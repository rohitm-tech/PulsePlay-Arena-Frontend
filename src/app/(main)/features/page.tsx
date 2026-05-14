'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AuthGate } from '@/components/AuthGate';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isAxiosError } from 'axios';
import { claimAchievementsRequest } from '@/services/authApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/auth/authSlice';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';

function GeminiHintIcon({ questionId, className }: { questionId: string; className?: string }) {
  const gid = `gem-hint-grad-${questionId}`;
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset="0.55" stopColor="#818cf8" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gid})`}
        d="M8 1.2l1.35 3.95h4.25L10.1 8.05l1.35 3.95L8 9.9l-3.45 2.1L6.9 8.05 2.4 5.15h4.25L8 1.2z"
      />
    </svg>
  );
}

type FanDeskKpi = { label: string; value: string; note?: string };

type FanDeskData = {
  geminiConfigured: boolean;
  ai: {
    headline: string;
    insights: string[];
    kpis: FanDeskKpi[];
    source: 'gemini' | 'offline';
  };
  quiz: {
    packId: string;
    questions: { id: string; question: string; options: string[]; category: string }[];
  };
};

type QuizPackState = FanDeskData['quiz'];

export default function FeaturesPage() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [packResults, setPackResults] = useState<Record<string, { correct: boolean; answer?: string }>>({});
  const [hints, setHints] = useState<Record<string, { hint: string; source: 'gemini' | 'offline' }>>({});
  const [aiQuiz, setAiQuiz] = useState<QuizPackState | null>(null);
  const [quizInterests, setQuizInterests] = useState('');

  const desk = useQuery({
    queryKey: ['fan-desk'],
    enabled: !!token,
    retry: 1,
    queryFn: async () => {
      const res = await api.get<{ data: FanDeskData }>('/api/features/fan-desk', { timeout: 60_000 });
      return res.data.data;
    },
  });

  const activeQuiz = aiQuiz ?? desk.data?.quiz ?? null;

  useEffect(() => {
    setPicks({});
    setPackResults({});
    setHints({});
  }, [activeQuiz?.packId]);

  const achievements = useQuery({
    queryKey: ['achievements'],
    enabled: !!token,
    queryFn: async () => {
      const res = await api.get<{ data: { definitions: { id: string; title: string; description: string; icon: string }[]; unlocked: string[] } }>(
        '/api/users/me/achievements'
      );
      return res.data.data;
    },
  });

  const claim = useMutation({
    mutationFn: claimAchievementsRequest,
    onSuccess: (user) => {
      dispatch(setUser(user));
      toast.success('Badges synced to your profile.');
    },
    onError: () => toast.error('Could not claim badges'),
  });

  const verifyPack = useMutation({
    mutationFn: async (args: { packId: string; questionId: string; choice: string }) => {
      const res = await api.post<{ data: { correct: boolean; answer?: string } }>('/api/features/fan-desk/quiz/verify', {
        packId: args.packId,
        questionId: args.questionId,
        choice: args.choice,
      });
      return { questionId: args.questionId, ...res.data.data };
    },
    onSuccess: (data) => {
      setPackResults((prev) => ({ ...prev, [data.questionId]: { correct: data.correct, answer: data.answer } }));
      toast(data.correct ? 'Correct!' : `Not quite — ${data.answer ?? ''}`);
    },
    onError: () => toast.error('Verify failed'),
  });

  const hintPack = useMutation({
    mutationFn: async (args: { packId: string; questionId: string }) => {
      const res = await api.post<{ data: { hint: string; source: 'gemini' | 'offline' } }>('/api/features/fan-desk/quiz/hint', {
        packId: args.packId,
        questionId: args.questionId,
      });
      return { questionId: args.questionId, ...res.data.data };
    },
    onSuccess: (data) => {
      setHints((prev) => ({ ...prev, [data.questionId]: { hint: data.hint, source: data.source } }));
    },
    onError: () => toast.error('Could not load hint'),
  });

  const generateQuiz = useMutation({
    mutationFn: async (interests: string) => {
      const res = await api.post<{ data: QuizPackState }>('/api/features/fan-desk/quiz/generate', {
        interests: interests.trim() ? interests.trim().slice(0, 500) : undefined,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setAiQuiz(data);
      toast.success('New AI quiz pack is ready.');
    },
    onError: (err) => {
      const msg =
        isAxiosError(err) &&
        err.response?.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
          ? String((err.response.data as { message?: string }).message)
          : 'Could not generate quiz';
      toast.error(msg);
    },
  });

  return (
    <AuthGate>
      <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
        <PageContainer>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-ink-500 dark:text-ink-400">Fan hub</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">Trivia & achievements</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600 dark:text-ink-400">
            Gemini-powered fan pulse plus a five-question cricket pack — still grounded in your auth and XP badges.
          </p>

          {desk.isError ? (
            <div className="mt-10 rounded-xl border border-rose-200/90 bg-rose-50/80 p-4 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100">
              <p className="font-medium">Could not load the fan desk.</p>
              <p className="mt-1 text-rose-800/90 dark:text-rose-200/90">
                Check that the backend is running and you are signed in. If Gemini is enabled, a slow API can also block this request until it times out.
              </p>
              <Button type="button" size="sm" className="mt-3" variant="outline" onClick={() => void desk.refetch()}>
                Try again
              </Button>
            </div>
          ) : desk.data ? (
            <Card className="mt-10 border-ink-200/80 dark:border-ink-800/80">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
                    Fan pulse
                  </CardTitle>
                  <CardDescription>
                    {desk.data.ai.source === 'gemini'
                      ? 'Written by Gemini for T20 / IPL-style fans (illustrative KPIs — not live league tables).'
                      : 'Offline copy — set GEMINI_API_KEY on the backend for rotating AI insights.'}
                  </CardDescription>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    desk.data.geminiConfigured
                      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'bg-ink-200 text-ink-700 dark:bg-ink-800 dark:text-ink-300'
                  }`}
                >
                  {desk.data.geminiConfigured ? 'Gemini ready' : 'Gemini off'}
                </span>
              </div>
              <p className="mt-4 text-lg font-semibold tracking-tight text-ink-900 dark:text-ink-50">{desk.data.ai.headline}</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-700 dark:text-ink-300">
                {desk.data.ai.insights.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {desk.data.ai.kpis.map((k) => (
                  <div
                    key={k.label}
                    className="rounded-xl border border-ink-200/90 bg-white/80 p-3 dark:border-ink-700/90 dark:bg-ink-900/50"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">{k.label}</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-ink-900 dark:text-ink-50">{k.value}</p>
                    {k.note ? <p className="mt-1 text-xs text-ink-600 dark:text-ink-400">{k.note}</p> : null}
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <p className="mt-10 text-sm text-ink-500">
              {desk.isFetching ? 'Loading fan desk…' : 'Preparing fan desk…'}
            </p>
          )}

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle>Cricket quiz pack</CardTitle>
              <CardDescription>
                Five questions per view — from the static bank or freshly written by Gemini. Optional interests steer AI topics. Hints stay
                spoiler-free when GEMINI_API_KEY is set.
              </CardDescription>
              {desk.isError ? (
                <p className="mt-4 text-sm text-rose-700 dark:text-rose-400">
                  Quiz uses the same fan-desk load. Fix the error above, then tap Try again.
                </p>
              ) : desk.data && activeQuiz ? (
                <div className="mt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    {aiQuiz ? (
                      <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-900 dark:bg-violet-900/50 dark:text-violet-100">
                        AI-generated pack
                      </span>
                    ) : (
                      <span className="rounded-full bg-ink-200/80 px-2.5 py-0.5 text-xs font-medium text-ink-800 dark:bg-ink-800 dark:text-ink-200">
                        Question bank
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <label htmlFor="quiz-interests" className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
                      Optional interests (steer AI topics)
                    </label>
                    <textarea
                      id="quiz-interests"
                      rows={2}
                      maxLength={500}
                      value={quizInterests}
                      onChange={(e) => setQuizInterests(e.target.value)}
                      placeholder="e.g. WPL, yorkers, DRS, powerplay fielding rules…"
                      className="w-full resize-y rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus-visible:border-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:focus-visible:border-ink-300"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="gap-2"
                        disabled={!desk.data.geminiConfigured || generateQuiz.isPending}
                        onClick={() => generateQuiz.mutate(quizInterests)}
                      >
                        {generateQuiz.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Sparkles className="h-3.5 w-3.5" aria-hidden />}
                        Generate 5 questions with AI
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={desk.isFetching}
                        onClick={() => {
                          setAiQuiz(null);
                          void desk.refetch();
                        }}
                      >
                        New pack from bank
                      </Button>
                    </div>
                    {!desk.data.geminiConfigured ? (
                      <p className="text-xs text-ink-500 dark:text-ink-400">AI generation needs GEMINI_API_KEY on the backend.</p>
                    ) : null}
                  </div>

                  <ol className="mt-8 list-none space-y-6">
                    {activeQuiz.questions.map((q, i) => {
                      const pick = picks[q.id] ?? null;
                      const outcome = packResults[q.id];
                      const hintRow = hints[q.id];
                      const hintLoading =
                        hintPack.isPending && hintPack.variables?.packId === activeQuiz.packId && hintPack.variables?.questionId === q.id;
                      return (
                        <li
                          key={q.id}
                          className="rounded-2xl border border-ink-200/90 bg-white/60 p-4 dark:border-ink-800/90 dark:bg-ink-950/30"
                        >
                          <div className="flex flex-wrap items-start gap-3">
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-sm font-semibold text-white dark:bg-ink-100 dark:text-ink-950"
                              aria-hidden
                            >
                              {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">{q.category}</p>
                                <button
                                  type="button"
                                  title={desk.data.geminiConfigured ? 'Get a hint from Gemini' : 'Gemini hints need GEMINI_API_KEY on the backend'}
                                  disabled={hintLoading}
                                  onClick={() => hintPack.mutate({ packId: activeQuiz.packId, questionId: q.id })}
                                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-violet-200/90 bg-violet-50/90 px-2.5 py-1 text-xs font-medium text-violet-900 transition hover:bg-violet-100/90 disabled:opacity-60 dark:border-violet-800/80 dark:bg-violet-950/50 dark:text-violet-100 dark:hover:bg-violet-900/60"
                                >
                                  {hintLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                  ) : (
                                    <GeminiHintIcon questionId={q.id} className="h-3.5 w-3.5" />
                                  )}
                                  Hint
                                </button>
                              </div>
                              <p className="mt-1 text-sm font-medium text-ink-900 dark:text-ink-50">{q.question}</p>
                              {hintRow ? (
                                <p
                                  className={`mt-2 rounded-xl border px-3 py-2 text-sm leading-relaxed ${
                                    hintRow.source === 'gemini'
                                      ? 'border-violet-200/80 bg-violet-50/80 text-violet-950 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-100'
                                      : 'border-ink-200/80 bg-ink-50/90 text-ink-800 dark:border-ink-700/80 dark:bg-ink-900/50 dark:text-ink-200'
                                  }`}
                                >
                                  <span className="font-medium text-ink-600 dark:text-ink-300">
                                    {hintRow.source === 'gemini' ? 'Gemini hint · ' : 'Note · '}
                                  </span>
                                  {hintRow.hint}
                                </p>
                              ) : null}
                              <div className="mt-3 flex flex-wrap gap-2">
                                {q.options.map((o) => (
                                  <button
                                    key={o}
                                    type="button"
                                    onClick={() => setPicks((prev) => ({ ...prev, [q.id]: o }))}
                                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                                      pick === o
                                        ? 'border-ink-900 bg-ink-900 text-white dark:border-ink-100 dark:bg-ink-100 dark:text-ink-950'
                                        : 'border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900'
                                    }`}
                                  >
                                    {o}
                                  </button>
                                ))}
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={!pick || verifyPack.isPending}
                                  onClick={() => pick && verifyPack.mutate({ packId: activeQuiz.packId, questionId: q.id, choice: pick })}
                                >
                                  Check answer
                                </Button>
                                {outcome ? (
                                  <span
                                    className={`text-xs font-medium ${outcome.correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}
                                  >
                                    {outcome.correct ? 'Nice.' : `Answer: ${outcome.answer ?? '—'}`}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ) : (
                <p className="mt-4 text-sm text-ink-500">Loading…</p>
              )}
            </Card>

            <Card>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Unlocked from your XP, streak, predictions, and follows — sync as profile badges.</CardDescription>
              <div className="mt-4 space-y-3">
                {achievements.data?.definitions.map((d) => {
                  const on = achievements.data.unlocked.includes(d.id);
                  return (
                    <div
                      key={d.id}
                      className={`flex gap-3 rounded-xl border p-3 text-sm ${
                        on ? 'border-ink-900/30 bg-ink-50 dark:border-ink-500/30 dark:bg-ink-900/40' : 'border-ink-200/80 opacity-70 dark:border-ink-800/80'
                      }`}
                    >
                      <span className="text-2xl">{d.icon}</span>
                      <div>
                        <p className="font-semibold text-ink-900 dark:text-ink-50">{d.title}</p>
                        <p className="text-ink-600 dark:text-ink-400">{d.description}</p>
                        {on ? <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">Unlocked</p> : null}
                      </div>
                    </div>
                  );
                })}
                <Button type="button" size="sm" variant="outline" disabled={claim.isPending} onClick={() => claim.mutate()}>
                  Sync badges to profile
                </Button>
              </div>
            </Card>
          </div>
        </PageContainer>
      </div>
    </AuthGate>
  );
}
