import type { MatchSummary } from '@/store/matches/matchesSlice';

export type FeedBall = {
  id: string;
  over: string;
  ball: string;
  text: string;
  timestamp?: string;
  event?: unknown;
};

/** Build feed rows from `live_score_update` payload when REST commentary is still empty. */
export function rowsFromLiveScoreSocket(matchId: string, live: unknown, statusHint?: string): FeedBall[] {
  if (!live || typeof live !== 'object') return [];
  const ls = live as { score?: unknown[]; status?: string };
  const scores = ls.score;
  if (!Array.isArray(scores) || scores.length === 0) return [];
  const status = typeof ls.status === 'string' ? ls.status : statusHint ?? '';
  const ts = new Date().toISOString();
  const rows: FeedBall[] = scores.map((raw, i) => {
    if (!raw || typeof raw !== 'object') {
      return {
        id: `${matchId}-live-${i}`,
        over: String(i),
        ball: '0',
        text: 'Score update',
        timestamp: ts,
      };
    }
    const row = raw as Record<string, unknown>;
    const r = Number(row.r ?? row.run ?? 0);
    const w = Number(row.w ?? row.wickets ?? 0);
    const o = row.o ?? row.overs;
    const over = o != null && String(o).length > 0 ? String(o) : String(i);
    const inning = String(row.inning ?? `Innings ${i + 1}`);
    const rSafe = Number.isFinite(r) ? r : 0;
    const wSafe = Number.isFinite(w) ? w : 0;
    return {
      id: `${matchId}-live-${i}`,
      over,
      ball: 'sync',
      text: `Live score — ${inning}: ${rSafe}/${wSafe} after ${over} overs.`,
      timestamp: ts,
    };
  });
  if (status && /\b(won|win by|victory|tied|tie)\b/i.test(status)) {
    rows.push({
      id: `${matchId}-live-result`,
      over: rows[rows.length - 1]?.over ?? '0',
      ball: '0',
      text: `WIN! ${status}`,
      timestamp: ts,
    });
  }
  return rows;
}

function teamMatchScore(winnerLower: string, team: string): number {
  const t = team.toLowerCase();
  let s = 0;
  for (const word of t.split(/\s+/)) {
    if (word.length < 3) continue;
    if (winnerLower.includes(word)) s += word.length;
    if (word.length >= 4 && winnerLower.includes(word.slice(0, 4))) s += 2;
  }
  if (t.length > 4 && winnerLower.includes(t.slice(0, 6))) s += 8;
  return s;
}

export function winLeanFromStatus(
  detail: MatchSummary | null,
  live: unknown
): { teamA: string; teamB: string; pTeamA: number; pTeamB: number; note: string } | null {
  const statusFromLive =
    live && typeof live === 'object' && typeof (live as { status?: unknown }).status === 'string'
      ? (live as { status: string }).status
      : '';
  const status = statusFromLive || detail?.status || '';
  if (!/\b(won|win by|victory)\b/i.test(status)) return null;
  const { a, b } = teamNamesFromMatch(detail);
  const wonM = status.match(/^(.+?)\s+won\b/i);
  if (wonM) {
    const winnerLower = wonM[1].trim().toLowerCase();
    const sa = teamMatchScore(winnerLower, a);
    const sb = teamMatchScore(winnerLower, b);
    if (sa > sb + 2) return { teamA: a, teamB: b, pTeamA: 0.94, pTeamB: 0.06, note: 'Settled — parsed winner from status text.' };
    if (sb > sa + 2) return { teamA: a, teamB: b, pTeamA: 0.06, pTeamB: 0.94, note: 'Settled — parsed winner from status text.' };
  }
  const lower = status.toLowerCase();
  const aNorm = a.toLowerCase().replace(/\s+/g, ' ').trim();
  const bNorm = b.toLowerCase().replace(/\s+/g, ' ').trim();
  const aWin = aNorm.length > 2 && lower.includes(aNorm.slice(0, Math.min(12, aNorm.length)));
  const bWin = bNorm.length > 2 && lower.includes(bNorm.slice(0, Math.min(12, bNorm.length)));
  if (aWin && !bWin) return { teamA: a, teamB: b, pTeamA: 0.94, pTeamB: 0.06, note: 'Settled — from live / match status (winner named).' };
  if (bWin && !aWin) return { teamA: a, teamB: b, pTeamA: 0.06, pTeamB: 0.94, note: 'Settled — from live / match status (winner named).' };
  return { teamA: a, teamB: b, pTeamA: 0.5, pTeamB: 0.5, note: 'Finished — status text did not clearly name a side; split shown.' };
}

export function teamNamesFromMatch(detail: MatchSummary | null): { a: string; b: string } {
  const teams = detail?.teams ?? [];
  if (teams.length >= 2) return { a: teams[0], b: teams[1] };
  const name = detail?.name ?? 'Team A vs Team B';
  const parts = name.split(/\s+vs\s+/i);
  if (parts.length >= 2) return { a: parts[0].trim(), b: parts[1].trim() };
  return { a: 'Side A', b: 'Side B' };
}

export function localMomentumFromFeed(feed: FeedBall[]): { over: string; score: number }[] {
  let acc = 0;
  const out: { over: string; score: number }[] = [];
  for (const b of feed) {
    const t = b.text.toLowerCase();
    let d = 0.15;
    if (/\bsix\b|maximum|sailed over/.test(t)) d = 3;
    else if (/\bfour\b|boundary/.test(t)) d = 2;
    else if (/wicket|bowled|caught|lbw|stumped|run out/.test(t)) d = -3.5;
    else if (/win!/.test(t)) d = 4;
    acc += d;
    out.push({ over: b.over || String(out.length), score: Math.round(acc * 10) / 10 });
  }
  return out.slice(-24);
}

export function localTimelineFromFeed(feed: FeedBall[]): { id: string; over: string; label: string; kind: string }[] {
  const picks: { id: string; over: string; label: string; kind: string }[] = [];
  for (const b of feed) {
    const t = b.text;
    const lower = t.toLowerCase();
    let kind = '';
    if (/win!/.test(lower)) kind = 'WIN';
    else if (/wicket|bowled|caught|lbw|stumped|run out/.test(lower)) kind = 'WICKET';
    else if (/\bsix\b|maximum/.test(lower)) kind = 'SIX';
    else if (/\bfour\b|boundary/.test(lower)) kind = 'FOUR';
    else if (/fifty|half[- ]century/.test(lower)) kind = 'FIFTY';
    else if (/century|100 up/.test(lower)) kind = 'CENTURY';
    if (!kind) continue;
    picks.push({ id: b.id, over: b.over, label: kind, kind });
  }
  return picks.slice(-16);
}

/** Human-readable line for parsed commentary events (never raw JSON). */
export function formatCommentaryEventLabel(ev: unknown): string | null {
  if (!ev || typeof ev !== 'object') return null;
  const o = ev as Record<string, unknown>;
  const type = typeof o.type === 'string' ? o.type : '';
  if (!type || type === 'UNKNOWN') {
    const raw = typeof o.raw === 'string' ? o.raw.trim() : '';
    return raw.length > 0 ? raw.slice(0, 120) + (raw.length > 120 ? '…' : '') : null;
  }
  const bits: string[] = [type.replace(/_/g, ' ')];
  const player = typeof o.player === 'string' ? o.player.trim() : '';
  const bowler = typeof o.bowler === 'string' ? o.bowler.trim() : '';
  const runs = typeof o.runs === 'number' && Number.isFinite(o.runs) ? o.runs : undefined;
  if (player) bits.push(player);
  if (bowler && type === 'WICKET') bits.push(`vs ${bowler}`);
  else if (bowler && !player) bits.push(bowler);
  if (runs != null && type !== 'WICKET') bits.push(`${runs} runs`);
  return bits.join(' · ');
}

/** Cumulative match progression from scorecard rows (innings snapshots). */
export function wormFromScorePayload(live: unknown): { over: string; runs: number }[] {
  if (!live || typeof live !== 'object') return [];
  const sc = (live as { score?: Array<Record<string, unknown>> }).score;
  if (!Array.isArray(sc) || sc.length === 0) return [];
  let cumOvers = 0;
  let cumRuns = 0;
  return sc.map((inn) => {
    const r = Number(inn.r ?? inn.run ?? 0) || 0;
    const o = Number(inn.o ?? inn.overs ?? 0) || 0;
    cumOvers += o;
    cumRuns += r;
    const overLabel = Number.isInteger(cumOvers) ? String(cumOvers) : cumOvers.toFixed(1);
    return { over: overLabel, runs: cumRuns };
  });
}
