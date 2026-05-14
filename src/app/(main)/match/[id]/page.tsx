'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthGate } from '@/components/AuthGate';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setMatchDetail,
  setCommentary,
  type MatchSummary,
} from '@/store/matches/matchesSlice';
import { setPollsForMatch } from '@/store/polls/pollsSlice';
import { setMessages } from '@/store/chat/chatSlice';
import { setLeaderboard } from '@/store/leaderboard/leaderboardSlice';
import { usePulseSockets } from '@/hooks/usePulseSockets';
import api from '@/lib/api';
import {
  formatCommentaryEventLabel,
  localMomentumFromFeed,
  localTimelineFromFeed,
  rowsFromLiveScoreSocket,
  teamNamesFromMatch,
  winLeanFromStatus,
  wormFromScorePayload,
} from '@/lib/matchFeed';
import { isAxiosError } from 'axios';
import { MatchTimeline } from '@/components/match/MatchTimeline';
import { LiveScoreBoard } from '@/components/match/LiveScoreBoard';

/** Recharts pulls browser-only deps; load client-only to avoid App Router / webpack `__webpack_modules__[moduleId] is not a function` during prerender. */
const WormChart = dynamic(
  () => import('@/components/match/WormChart').then((m) => ({ default: m.WormChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 w-full animate-pulse rounded-xl border border-ink-200/60 bg-ink-100/80 dark:border-ink-800/60 dark:bg-ink-900/50" />
    ),
  }
);

const MomentumChart = dynamic(
  () => import('@/components/match/MomentumChart').then((m) => ({ default: m.MomentumChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-44 w-full animate-pulse rounded-xl border border-ink-200/60 bg-ink-100/80 dark:border-ink-800/60 dark:bg-ink-900/50" />
    ),
  }
);
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Share2, Sparkles, Loader2, MessageCircle, X } from 'lucide-react';

const REACTIONS = ['🔥', '😱', '👏', '💔', '🐐'];

type MatchAiPack = {
  summary: string;
  highlights: string[];
  insights: { id: string; title: string; body: string; tone: string; createdAt?: string }[];
};

function axiosMessage(err: unknown): string {
  if (isAxiosError(err) && err.response?.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
    return String((err.response.data as { message?: string }).message);
  }
  return isAxiosError(err) ? err.message : 'Something went wrong';
}

/** Collapse long Gemini/offline summaries in the commentary panel. */
const SUMMARY_READ_MORE_AT = 360;

function clipSummaryForPreview(text: string, maxChars: number): string {
  const t = text.trim();
  if (t.length <= maxChars) return t;
  let cut = t.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > Math.floor(maxChars * 0.55)) cut = cut.slice(0, lastSpace);
  return `${cut.trim()}…`;
}

export default function MatchPage() {
  const params = useParams<{ id: string }>();
  const matchId = params.id;
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const detail = useAppSelector((s) => s.matches.detail);
  const commentary = useAppSelector((s) => s.matches.commentary);
  const liveScore = useAppSelector((s) => s.matches.liveScoreById[matchId]);
  const polls = useAppSelector((s) => s.polls.byMatch[matchId] ?? []);
  const reactions = useAppSelector((s) => s.reactions.recent);
  const room = `match:${matchId}`;
  const chatMessages = useAppSelector((s) => s.chat.byRoom[room] ?? []);
  const typing = useAppSelector((s) => s.chat.typing[room] ?? []);
  const socketConnected = useAppSelector((s) => s.socket.connected);
  const user = useAppSelector((s) => s.auth.user);
  const [genPollLoading, setGenPollLoading] = useState(false);
  const [hydrateCommentaryForPoll, setHydrateCommentaryForPoll] = useState(true);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const { sendReaction, sendChat, sendTyping } = usePulseSockets(matchId, user?.favoriteTeam);

  useQuery({
    queryKey: ['match', matchId],
    enabled: !!matchId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await api.get<{ data: MatchSummary }>(`/api/matches/${matchId}`);
      dispatch(setMatchDetail(res.data.data));
      return res.data.data;
    },
  });

  useQuery({
    queryKey: ['commentary', matchId],
    enabled: !!matchId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await api.get<{ data: typeof commentary }>(`/api/matches/${matchId}/commentary`);
      dispatch(setCommentary(res.data.data));
      return res.data.data;
    },
  });

  useQuery({
    queryKey: ['polls', matchId],
    enabled: !!matchId,
    queryFn: async () => {
      const res = await api.get(`/api/polls/match/${matchId}`);
      dispatch(setPollsForMatch({ matchId, polls: res.data.data }));
      return res.data.data;
    },
  });

  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    staleTime: 60_000,
    queryFn: async () => {
      const res = await api.get<{ data: { configured: boolean; model: string | null } }>('/api/ai/status');
      return res.data.data;
    },
  });

  const { data: aiPack, isError: aiError, error: aiQueryError } = useQuery({
    queryKey: ['ai', matchId],
    enabled: !!matchId,
    retry: 1,
    queryFn: async () => {
      const res = await api.get<{ data: MatchAiPack }>(`/api/ai/match/${matchId}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    setSummaryExpanded(false);
  }, [matchId, aiPack?.summary]);

  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setChatOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chatOpen]);

  useQuery({
    queryKey: ['chat', matchId],
    enabled: !!matchId,
    queryFn: async () => {
      const res = await api.get(`/api/chat/${matchId}`);
      const msgs = (res.data.data as { _id: string; userName: string; text: string; createdAt?: string }[]).map(
        (m) => ({
          id: m._id,
          userName: m.userName,
          text: m.text,
          createdAt: m.createdAt,
        })
      );
      dispatch(setMessages({ room, messages: msgs }));
      return msgs;
    },
  });

  useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await api.get('/api/leaderboard');
      dispatch(setLeaderboard(res.data.data));
      return res.data.data;
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', matchId],
    enabled: !!matchId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await api.get<{
        data: {
          momentum: { over: string; score: number }[];
          winProbability: { teamA: string; teamB: string; pTeamA: number; pTeamB: number; note: string };
          timeline: { id: string; over: string; label: string; kind: string }[];
        };
      }>(`/api/matches/${matchId}/analytics`);
      return res.data.data;
    },
  });

  const feedCommentary = useMemo(() => {
    if (commentary.length) return commentary;
    return rowsFromLiveScoreSocket(matchId, liveScore, detail?.status);
  }, [commentary, matchId, liveScore, detail?.status]);

  const clientMomentum = useMemo(() => localMomentumFromFeed(feedCommentary), [feedCommentary]);
  const clientTimeline = useMemo(() => localTimelineFromFeed(feedCommentary), [feedCommentary]);

  const displayWinProb = useMemo(() => {
    if (analytics?.winProbability) return analytics.winProbability;
    const fromStatus = winLeanFromStatus(detail, liveScore);
    if (fromStatus) return fromStatus;
    if (!feedCommentary.length) return null;
    const { a, b } = teamNamesFromMatch(detail);
    return {
      teamA: a,
      teamB: b,
      pTeamA: 0.5,
      pTeamB: 0.5,
      note: 'Heuristic idle — win lean refines when more ball-by-ball lines are available.',
    };
  }, [analytics?.winProbability, detail, liveScore, feedCommentary.length]);

  const wormPoints = useMemo(() => {
    const fromLive = wormFromScorePayload(liveScore);
    if (fromLive.length) return fromLive;
    const fromCard = wormFromScorePayload({ score: detail?.score });
    if (fromCard.length) return fromCard;
    let acc = 0;
    return commentary.map((c, i) => {
      const ev = c.event as { runs?: number } | undefined;
      acc +=
        typeof ev?.runs === 'number'
          ? ev.runs
          : c.text.toLowerCase().includes('six')
            ? 6
            : c.text.toLowerCase().includes('four')
              ? 4
              : 1;
      return { over: c.over || String(i), runs: acc };
    });
  }, [liveScore, detail?.score, commentary]);

  const [chatInput, setChatInput] = useState('');
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [compareLines, setCompareLines] = useState<string[] | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  async function vote(pollId: string, option: string) {
    try {
      await api.post('/api/polls/vote', { pollId, option });
      toast.success('Vote recorded');
    } catch {
      toast.error('Vote failed');
    }
  }

  async function generatePollFromCommentary() {
    if (user?.role !== 'admin') return;
    setGenPollLoading(true);
    try {
      await api.post('/api/polls/generate-from-commentary', {
        matchId,
        hoursValid: 6,
        hydrateIfEmpty: hydrateCommentaryForPoll,
      });
      toast.success('AI poll published for this match');
      await queryClient.invalidateQueries({ queryKey: ['polls', matchId] });
    } catch (e) {
      toast.error(axiosMessage(e));
    } finally {
      setGenPollLoading(false);
    }
  }

  async function shareMatch() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: detail?.name ?? 'PulsePlay', text: 'Join me on PulsePlay', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Match link copied');
      }
    } catch {
      toast.error('Could not share');
    }
  }

  async function runCompare() {
    if (!compareA.trim() || !compareB.trim()) return;
    setCompareLoading(true);
    try {
      const ctx = JSON.stringify({ match: detail, recent: feedCommentary.slice(-12).map((c) => c.text) });
      const res = await api.post<{ data: { comparison: string[] } }>('/api/ai/compare-players', {
        playerA: compareA.trim(),
        playerB: compareB.trim(),
        context: ctx,
      });
      setCompareLines(res.data.data.comparison ?? []);
    } catch (e) {
      toast.error(axiosMessage(e));
    } finally {
      setCompareLoading(false);
    }
  }

  async function explainBall(text: string) {
    try {
      const wicketish = /\b(wicket|bowled|lbw|caught|stumped|run out)\b/i.test(text);
      const res = wicketish
        ? await api.post<{ data: { explanation: string } }>('/api/ai/explain-wicket', { text })
        : await api.post<{ data: { explanation: string } }>('/api/ai/what-happened', { text });
      toast.message(wicketish ? 'Wicket explainer' : 'What happened?', {
        description: res.data.data.explanation,
        duration: 12_000,
      });
    } catch (e) {
      toast.error(axiosMessage(e));
    }
  }

  async function reportChatMessage(messageId: string) {
    try {
      await api.post('/api/chat/report', { messageId, matchId, room });
      toast.success('Thanks — report logged for review.');
    } catch {
      toast.error('Report failed');
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
        <PageContainer>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-ink-500 dark:text-ink-400">Match room</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">
                {detail?.name ?? 'Loading…'}
              </h1>
              {detail?.venue && <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">{detail.venue}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-ink-200/90 bg-white/80 px-4 py-2 text-xs font-medium text-ink-600 dark:border-ink-700 dark:bg-ink-900/60 dark:text-ink-300">
                Socket:{' '}
                {socketConnected ? (
                  <span className="text-ink-900 dark:text-ink-50">live</span>
                ) : (
                  <span className="text-ink-500">connecting</span>
                )}
              </div>
              {user?.favoriteTeam ? (
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-900 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-100">
                  Team room: {user.favoriteTeam}
                </span>
              ) : null}
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => void shareMatch()}>
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
            </div>
          </div>

          <Card className="mt-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Scorecard</CardTitle>
                <CardDescription>
                  Innings and status from the live feed when connected; loaded once from the server — no score polling.
                </CardDescription>
              </div>
            </div>
            <div className="mt-5">
              <LiveScoreBoard live={liveScore} detail={detail} />
            </div>
            <div className="mt-6 border-t border-ink-200/60 pt-5 dark:border-ink-800/60">
              <div className="grid gap-6 lg:grid-cols-[7fr_3fr] lg:items-start">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-200">Run worm</h3>
                  <motion.div
                    key={wormPoints.map((p) => `${p.over}:${p.runs}`).join('|')}
                    initial={{ opacity: 0.88 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35 }}
                    className="mt-3 max-w-md lg:max-w-full"
                  >
                    <WormChart points={wormPoints.length ? wormPoints : [{ over: '0', runs: 0 }]} />
                  </motion.div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-ink-800 dark:text-ink-200">Reactions</h3>
                  <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">Tap to fan out on the overlay.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {REACTIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => sendReaction(r)}
                        className="rounded-2xl border border-ink-200 bg-white px-3 py-1.5 text-xl transition hover:-translate-y-0.5 hover:border-ink-400 active:scale-95 dark:border-ink-700 dark:bg-ink-900 dark:hover:border-ink-500"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <div className="relative mt-4 h-28 overflow-hidden rounded-xl border border-ink-200 bg-gradient-to-b from-ink-100 to-transparent dark:border-ink-800 dark:from-ink-900 dark:to-transparent">
                    <AnimatePresence>
                      {reactions.slice(0, 14).map((rx) => (
                        <motion.span
                          key={rx.id}
                          initial={{ opacity: 0, y: 12, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute text-2xl"
                          style={{ left: `${(rx.ts % 75) + 8}%`, top: `${(rx.id.length * 9) % 55}%` }}
                        >
                          {rx.emoji}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-12 lg:items-stretch lg:[&>*]:min-h-0">
            <Card className="flex min-h-0 flex-col p-5 lg:col-span-8 lg:h-full sm:p-6">
              <CardTitle className="shrink-0">Commentary</CardTitle>
              <CardDescription className="shrink-0">
                Ball-by-ball feed with quick explainers. Match summary (Gemini or offline) sits above the feed when available.
              </CardDescription>
              {aiError ? (
                <p className="mt-4 shrink-0 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  Summary unavailable: {axiosMessage(aiQueryError)}
                </p>
              ) : null}
              {!aiError && !aiPack ? (
                <p className="mt-4 shrink-0 text-sm text-ink-500 dark:text-ink-400">Loading match summary…</p>
              ) : null}
              {!aiError && aiPack?.summary ? (
                <div className="mt-4 shrink-0 rounded-xl border border-ink-200/90 bg-gradient-to-b from-white to-ink-50/80 p-4 dark:border-ink-700 dark:from-ink-900/80 dark:to-ink-950/40">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Summary</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-800 dark:text-ink-200">
                    {summaryExpanded || aiPack.summary.trim().length <= SUMMARY_READ_MORE_AT
                      ? aiPack.summary.trim()
                      : clipSummaryForPreview(aiPack.summary, SUMMARY_READ_MORE_AT)}
                  </p>
                  {aiPack.summary.trim().length > SUMMARY_READ_MORE_AT ? (
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-ink-700 underline-offset-2 hover:underline dark:text-ink-300"
                      onClick={() => setSummaryExpanded((v) => !v)}
                    >
                      {summaryExpanded ? 'Show less' : 'Read more'}
                    </button>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin">
                {feedCommentary.length === 0 ? (
                  <p className="text-sm text-ink-500 dark:text-ink-400">No ball-by-ball lines yet for this match.</p>
                ) : null}
                {commentary.length === 0 && feedCommentary.length > 0 ? (
                  <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                    Showing lines derived from the live score feed until full commentary is available.
                  </p>
                ) : null}
                {feedCommentary.map((c) => {
                  const eventLine = formatCommentaryEventLabel(c.event);
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-ink-200/80 bg-white/60 p-3 text-sm dark:border-ink-800/80 dark:bg-ink-900/40"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                        Over {c.over}
                      </div>
                      <p className="mt-1 text-ink-900 dark:text-ink-100">{c.text}</p>
                      {eventLine ? (
                        <p className="mt-2 inline-flex max-w-full rounded-lg bg-ink-100/90 px-2.5 py-1 text-xs text-ink-700 dark:bg-ink-800/80 dark:text-ink-200">
                          {eventLine}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => void explainBall(c.text)}>
                          What happened?
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="flex min-h-0 flex-col gap-4 lg:col-span-4">
              <Card className="p-5 sm:p-6">
                <CardTitle>Live analytics</CardTitle>
                <CardDescription>Momentum, key moments, and win lean from recent feed data.</CardDescription>
                <div className="mt-4 space-y-4">
                  {displayWinProb ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Win lean</p>
                      <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
                        <div
                          className="bg-ink-900 dark:bg-ink-100"
                          style={{ width: `${Math.round(displayWinProb.pTeamA * 100)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-ink-600 dark:text-ink-400">
                        {displayWinProb.teamA}: {(displayWinProb.pTeamA * 100).toFixed(0)}% · {displayWinProb.teamB}:{' '}
                        {(displayWinProb.pTeamB * 100).toFixed(0)}%
                      </p>
                      <p className="mt-1 text-xs text-ink-500 dark:text-ink-500">{displayWinProb.note}</p>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Momentum</p>
                    <MomentumChart
                      points={
                        analytics?.momentum?.length
                          ? analytics.momentum
                          : clientMomentum.length
                            ? clientMomentum
                            : [{ over: '0', score: 0 }]
                      }
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Key moments</p>
                    <div className="mt-2 max-h-40 overflow-y-auto pr-1">
                      <MatchTimeline items={analytics?.timeline?.length ? analytics.timeline : clientTimeline} />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Player compare
                </CardTitle>
                <CardDescription>
                  {aiStatus?.configured
                    ? `Gemini (${aiStatus.model ?? 'model'}) uses this match and recent balls as context.`
                    : 'Offline compare heuristics — set GEMINI_API_KEY on the backend for Gemini-grounded bullets.'}
                </CardDescription>
                <div className="mt-3 space-y-2">
                  <input
                    value={compareA}
                    onChange={(e) => setCompareA(e.target.value)}
                    placeholder="Player A"
                    className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                  />
                  <input
                    value={compareB}
                    onChange={(e) => setCompareB(e.target.value)}
                    placeholder="Player B"
                    className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                  />
                  <Button type="button" size="sm" disabled={compareLoading} onClick={() => void runCompare()}>
                    {compareLoading ? 'Comparing…' : 'Compare with AI'}
                  </Button>
                  {compareLines?.length ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-ink-700 dark:text-ink-300">
                      {compareLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-4 flex w-full min-w-0 flex-col gap-4">
            <Card className="w-full min-w-0 p-5 sm:p-6">
              <CardTitle>Polls</CardTitle>
              <CardDescription>
                Live questions for everyone in this room — tap an option to vote. Scored polls award XP when an admin closes them.
              </CardDescription>
              <div className="mt-4 space-y-3">
                {polls.map((p) => (
                  <div key={p._id} className="rounded-xl border border-ink-200 bg-ink-50/80 p-3 dark:border-ink-800 dark:bg-ink-900/50">
                    <p className="text-sm font-medium text-ink-900 dark:text-ink-50">{p.question}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.options.map((o) => (
                        <Button key={o} type="button" size="sm" variant="outline" onClick={() => vote(p._id, o)}>
                          {o}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
                {!polls.length && <p className="text-sm text-ink-500 dark:text-ink-400">No polls yet.</p>}
              </div>
              {user?.role === 'admin' ? (
                <div className="mt-5 rounded-xl border border-violet-200/80 bg-violet-50/60 p-3 text-xs dark:border-violet-900/50 dark:bg-violet-950/30">
                  <p className="font-medium text-violet-950 dark:text-violet-100">Admin: generate from commentary (Gemini)</p>
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-violet-900/90 dark:text-violet-200/90">
                    <input
                      type="checkbox"
                      checked={hydrateCommentaryForPoll}
                      onChange={(e) => setHydrateCommentaryForPoll(e.target.checked)}
                      className="rounded border-violet-400"
                    />
                    Fetch if cache empty (CricAPI)
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2 gap-1.5"
                    variant="secondary"
                    disabled={genPollLoading || !aiStatus?.configured}
                    onClick={() => void generatePollFromCommentary()}
                  >
                    {genPollLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Sparkles className="h-3.5 w-3.5" aria-hidden />}
                    Generate poll
                  </Button>
                  {!aiStatus?.configured ? (
                    <p className="mt-1 text-[11px] text-violet-800/80 dark:text-violet-300/80">Needs GEMINI_API_KEY on backend.</p>
                  ) : null}
                </div>
              ) : null}
            </Card>

            <Card className="w-full min-w-0 p-5 sm:p-6">
              <CardTitle>Match digest</CardTitle>
              <CardDescription>
                Highlights and insight cards from the same AI pack as the summary — summary is shown above commentary.
              </CardDescription>
              {aiError ? (
                <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">Highlights unavailable — check the commentary panel for the error message.</p>
              ) : null}
              {!aiError && aiPack ? (
                <div className="mt-3 flex w-full min-w-0 flex-col gap-8 text-sm">
                  {aiPack.highlights?.length ? (
                    <div className="min-w-0 w-full">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Highlights</p>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-ink-700 dark:text-ink-300">
                        {aiPack.highlights.map((h, idx) => (
                          <li key={`${idx}-${h.slice(0, 24)}`}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {aiPack.insights?.length ? (
                    <div className="min-w-0 w-full space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Insight cards</p>
                      {aiPack.insights.map((i) => (
                        <div
                          key={i.id}
                          className="rounded-lg border border-ink-200 bg-white/70 p-3 dark:border-ink-800 dark:bg-ink-900/50"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{i.tone}</p>
                          <p className="font-semibold text-ink-900 dark:text-ink-50">{i.title}</p>
                          <p className="text-ink-600 dark:text-ink-400">{i.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {!aiError && !aiPack ? <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">Loading highlights…</p> : null}
            </Card>
          </div>

        </PageContainer>

        {chatOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-[90] bg-ink-950/25 backdrop-blur-[1px] dark:bg-black/45"
            aria-label="Close chat"
            onClick={() => setChatOpen(false)}
          />
        ) : null}

        <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
          {chatOpen ? (
            <div
              id="match-fan-chat-panel"
              className="flex h-[min(72vh,460px)] w-[min(calc(100vw-2rem),22rem)] flex-col overflow-hidden rounded-2xl border border-ink-200/90 bg-white shadow-2xl dark:border-ink-700 dark:bg-ink-950"
              role="dialog"
              aria-modal="true"
              aria-labelledby="fan-chat-title"
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink-200/80 px-4 py-3 dark:border-ink-800">
                <h2 id="fan-chat-title" className="text-sm font-semibold tracking-tight text-ink-900 dark:text-ink-50">
                  Fan chat
                </h2>
                <div className="flex min-w-0 items-center gap-2">
                  {typing.length > 0 ? (
                    <span className="truncate text-xs text-ink-500 dark:text-ink-400">{typing.join(', ')} typing…</span>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-ink-50"
                    aria-label="Close chat panel"
                    onClick={() => setChatOpen(false)}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3 scrollbar-thin">
                {chatMessages.map((m) => (
                  <div key={m.id} className="group flex flex-wrap items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <span className="font-semibold text-ink-900 dark:text-ink-100">{m.userName}</span>{' '}
                      <span className="text-ink-700 dark:text-ink-300">{m.text}</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 shrink-0 text-xs opacity-0 transition group-hover:opacity-100"
                      onClick={() => void reportChatMessage(m.id)}
                    >
                      Report
                    </Button>
                  </div>
                ))}
              </div>
              <form
                className="shrink-0 border-t border-ink-200/80 p-3 dark:border-ink-800"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  sendChat(chatInput.trim());
                  setChatInput('');
                }}
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      sendTyping();
                    }}
                    className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none transition focus-visible:border-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:focus-visible:border-ink-300"
                    placeholder={`Message as ${user?.name ?? 'fan'}`}
                  />
                  <Button type="submit" size="sm" className="shrink-0">
                    Send
                  </Button>
                </div>
              </form>
            </div>
          ) : null}

          <Button
            type="button"
            size="icon"
            className={`h-14 w-14 rounded-full shadow-lg ${chatOpen ? 'ring-2 ring-ink-900/20 dark:ring-ink-100/20' : ''}`}
            variant={chatOpen ? 'secondary' : 'default'}
            aria-expanded={chatOpen}
            aria-controls={chatOpen ? 'match-fan-chat-panel' : undefined}
            aria-label={chatOpen ? 'Close fan chat' : 'Open fan chat'}
            onClick={() => setChatOpen((o) => !o)}
          >
            {chatOpen ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
          </Button>
        </div>
      </div>
    </AuthGate>
  );
}
