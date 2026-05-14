'use client';

import { useMemo } from 'react';
import type { MatchSummary } from '@/store/matches/matchesSlice';

export type InningScoreRow = {
  r: number;
  w: number;
  o: number | string;
  inning: string;
};

function pickScoreRows(raw: unknown): InningScoreRow[] {
  if (!raw || typeof raw !== 'object') return [];
  const score = (raw as { score?: unknown }).score;
  if (!Array.isArray(score)) return [];
  const out: InningScoreRow[] = [];
  for (const item of score) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const r = Number(row.r ?? row.run ?? 0);
    const w = Number(row.w ?? row.wickets ?? 0);
    const oRaw = row.o ?? row.overs ?? 0;
    const o = typeof oRaw === 'number' ? oRaw : Number(String(oRaw));
    const inning = String(row.inning ?? 'Innings');
    out.push({
      r: Number.isFinite(r) ? r : 0,
      w: Number.isFinite(w) ? w : 0,
      o: Number.isFinite(o) ? o : String(oRaw ?? '—'),
      inning,
    });
  }
  return out;
}

function statusFromPayload(raw: unknown, fallback?: string): string {
  if (raw && typeof raw === 'object' && typeof (raw as { status?: unknown }).status === 'string') {
    return (raw as { status: string }).status;
  }
  return fallback ?? '';
}

function updatedLabel(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const ts = (raw as { ts?: unknown }).ts;
  if (typeof ts !== 'number' || !Number.isFinite(ts)) return null;
  try {
    return new Date(ts).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return null;
  }
}

type LiveScoreBoardProps = {
  live: unknown;
  detail: MatchSummary | null;
};

export function LiveScoreBoard({ live, detail }: LiveScoreBoardProps) {
  const liveRows = useMemo(() => pickScoreRows(live), [live]);
  const cardRows = useMemo(() => pickScoreRows({ score: detail?.score }), [detail?.score]);
  const rows = liveRows.length ? liveRows : cardRows;
  const status = statusFromPayload(live, detail?.status);
  const syncAt = updatedLabel(live);

  if (!rows.length && !status) {
    return (
      <p className="rounded-xl border border-dashed border-ink-200/80 bg-ink-50/50 px-4 py-6 text-center text-sm text-ink-600 dark:border-ink-800/80 dark:bg-ink-900/30 dark:text-ink-400">
        Score lines will appear here after the next update from the match feed.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {status ? (
        <div className="rounded-xl border border-ink-200/80 bg-gradient-to-r from-ink-900/[0.04] to-transparent px-4 py-3 dark:border-ink-800/80 dark:from-white/[0.06]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500 dark:text-ink-400">Match status</p>
          <p className="mt-1 text-base font-semibold leading-snug text-ink-900 dark:text-ink-50">{status}</p>
          {syncAt ? <p className="mt-1 text-xs text-ink-500 dark:text-ink-500">Last score sync · {syncAt}</p> : null}
        </div>
      ) : null}

      {rows.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((inn, idx) => (
            <div
              key={`${inn.inning}-${idx}`}
              className="flex flex-col justify-between rounded-xl border border-ink-200/90 bg-white/70 px-4 py-3 dark:border-ink-800/90 dark:bg-ink-900/45"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">{inn.inning}</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl font-semibold tabular-nums tracking-tight text-ink-900 dark:text-ink-50">
                  {inn.r}
                  <span className="text-2xl font-medium text-ink-400 dark:text-ink-500">/{inn.w}</span>
                </span>
                <span className="text-sm tabular-nums text-ink-600 dark:text-ink-300">
                  {typeof inn.o === 'number' ? `${Number.isInteger(inn.o) ? inn.o : inn.o.toFixed(1)} ov` : `${inn.o} ov`}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
