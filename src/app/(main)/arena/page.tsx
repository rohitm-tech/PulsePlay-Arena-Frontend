'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, Gift, Sparkles, Target, Trophy, Zap } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AuthGate } from '@/components/AuthGate';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchArenaSummary, postArenaHeartbeat, fetchArenaPersonalization, claimArenaPass, unlockArenaPremiumDev } from '@/services/arenaApi';
import { hydrateArenaFromSummary } from '@/lib/arenaHydrate';
import { setPersonalization } from '@/store/personalization/personalizationSlice';
import { cn } from '@/lib/utils';

function XpGlowBar({ pct }: { pct: number }) {
  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full border border-ink-200/80 bg-ink-900/10 dark:border-ink-700/80 dark:bg-ink-950/80">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 shadow-[0_0_24px_rgba(168,85,247,0.45)]"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      />
    </div>
  );
}

export default function ArenaPage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const progression = useAppSelector((s) => s.progression);
  const streaks = useAppSelector((s) => s.streaks);
  const achievements = useAppSelector((s) => s.achievements.items);
  const quests = useAppSelector((s) => s.quests.missions);
  const rewards = useAppSelector((s) => s.rewards);
  const pass = useAppSelector((s) => s.tournamentPass);
  const personalization = useAppSelector((s) => s.personalization);
  const [claiming, setClaiming] = useState<number | null>(null);

  const summary = useQuery({
    queryKey: ['arenaSummary'],
    queryFn: fetchArenaSummary,
  });

  const heartbeat = useMutation({
    mutationFn: () => postArenaHeartbeat(false),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['arenaSummary'] }),
  });

  const personalizationQ = useQuery({
    queryKey: ['arenaPersonalization'],
    queryFn: fetchArenaPersonalization,
    enabled: summary.isSuccess,
  });

  useEffect(() => {
    if (summary.data) hydrateArenaFromSummary(dispatch, summary.data);
  }, [dispatch, summary.data]);

  useEffect(() => {
    if (personalizationQ.data) {
      dispatch(setPersonalization(personalizationQ.data as never));
    }
  }, [dispatch, personalizationQ.data]);

  const hbOnce = useRef(false);

  useEffect(() => {
    if (hbOnce.current) return;
    hbOnce.current = true;
    void heartbeat.mutateAsync();
  }, [heartbeat]);

  async function onClaim(milestone: number, track: 'free' | 'premium') {
    setClaiming(milestone);
    try {
      await claimArenaPass(milestone, track);
      await queryClient.invalidateQueries({ queryKey: ['arenaSummary'] });
    } finally {
      setClaiming(null);
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
        <PageContainer>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-600 dark:text-violet-300">PulsePlay Arena</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">Tournament command center</h1>
              <p className="mt-2 max-w-2xl text-sm text-ink-600 dark:text-ink-400">
                Progression, streaks, missions, and predictions layer on top of the same CricAPI-backed match hub — live rooms stay available, but Arena is where seasons are won.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void queryClient.invalidateQueries({ queryKey: ['arenaSummary'] })}>
              <Sparkles className="h-4 w-4" />
              Refresh board
            </Button>
          </div>

          {summary.isLoading ? (
            <div className="mt-10 h-48 animate-pulse rounded-3xl border border-ink-200/60 bg-ink-100/80 dark:border-ink-800/60 dark:bg-ink-900/40" />
          ) : summary.isError ? (
            <p className="mt-8 text-sm text-red-600">Could not load Arena summary.</p>
          ) : (
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 space-y-6 rounded-3xl border border-ink-200/70 bg-gradient-to-br from-white to-violet-50/40 p-6 dark:border-ink-800/70 dark:from-ink-900/90 dark:to-violet-950/20"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Season level</p>
                    <p className="text-2xl font-semibold tabular-nums">
                      Lv {progression.level}{' '}
                      <span className="text-base font-normal text-ink-500 dark:text-ink-400">· {progression.fanRank}</span>
                    </p>
                  </div>
                  <div className="rounded-full border border-ink-200/80 bg-white/80 px-3 py-1 text-xs font-medium dark:border-ink-700 dark:bg-ink-950/60">
                    Prestige {progression.prestigeTier}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-xs text-ink-500 dark:text-ink-400">
                    <span>
                      {progression.current} / {progression.next} XP this bar
                    </span>
                    <span>{progression.seasonXp} season XP</span>
                  </div>
                  <XpGlowBar pct={progression.pct} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Login streak', value: streaks.login, icon: Flame },
                    { label: 'Prediction streak', value: streaks.prediction, icon: Target },
                    { label: 'Arena coins', value: rewards.coins, icon: Gift },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl border border-ink-200/70 bg-white/70 p-4 dark:border-ink-800/70 dark:bg-ink-950/50"
                    >
                      <s.icon className="mb-2 h-5 w-5 text-violet-600 dark:text-violet-300" />
                      <p className="text-xs text-ink-500 dark:text-ink-400">{s.label}</p>
                      <p className="text-xl font-semibold tabular-nums">{s.value}</p>
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.aside
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="space-y-4 rounded-3xl border border-ink-200/70 bg-white/90 p-5 dark:border-ink-800/70 dark:bg-ink-900/80"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-50">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Tournament pass
                </div>
                <p className="text-xs text-ink-600 dark:text-ink-400">
                  Milestones every 400 season XP. Premium doubles coin payouts (dev unlock below).
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: Math.min(pass.maxMilestone, 6) }).map((_, i) => (
                    <Button
                      key={i}
                      type="button"
                      size="sm"
                      variant={pass.claimedFree.includes(i) ? 'secondary' : 'default'}
                      disabled={claiming === i || pass.claimedFree.includes(i)}
                      className="rounded-xl"
                      onClick={() => void onClaim(i, 'free')}
                    >
                      {pass.claimedFree.includes(i) ? `Tier ${i} ✓` : `Claim ${i}`}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void unlockArenaPremiumDev()}>
                    Unlock premium (demo)
                  </Button>
                </div>
              </motion.aside>
            </div>
          )}

          <section className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-ink-200/70 bg-white/90 p-6 dark:border-ink-800/70 dark:bg-ink-900/70">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Trophy className="h-5 w-5 text-violet-600 dark:text-violet-300" />
                Missions
              </h2>
              <ul className="mt-4 space-y-3">
                {quests.map((m) => (
                  <li key={m._id} className="rounded-2xl border border-ink-200/60 bg-ink-50/80 p-3 text-sm dark:border-ink-800/60 dark:bg-ink-950/40">
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">{m.description}</p>
                    <p className="mt-2 text-xs tabular-nums text-ink-600 dark:text-ink-300">
                      {m.progress}/{m.target} · +{m.xpReward} XP · +{m.coinReward} coins
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-ink-200/70 bg-white/90 p-6 dark:border-ink-800/70 dark:bg-ink-900/70">
              <h2 className="text-lg font-semibold">Achievements</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {achievements
                  .filter((a) => !a.hidden || a.unlocked)
                  .map((a) => (
                    <li
                      key={a.id}
                      className={cn(
                        'rounded-2xl border px-3 py-2 text-xs',
                        a.unlocked
                          ? 'border-violet-400/60 bg-violet-50/80 dark:border-violet-700/50 dark:bg-violet-950/30'
                          : 'border-ink-200/60 opacity-70 dark:border-ink-800/60'
                      )}
                    >
                      <p className="font-semibold">{a.hidden && !a.unlocked ? '???' : a.title}</p>
                      <p className="text-ink-500 dark:text-ink-400">{a.rarity}</p>
                    </li>
                  ))}
              </ul>
            </div>
          </section>

          {personalization.loaded ? (
            <section className="mt-12 rounded-3xl border border-ink-200/70 bg-gradient-to-r from-ink-900 to-violet-900 p-6 text-ink-50 dark:border-ink-800/60">
              <h2 className="text-lg font-semibold">Personalized pulse</h2>
              <p className="mt-2 text-sm text-ink-100">{personalization.headline}</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-ink-200">
                {personalization.missionsIdea.map((m) => (
                  <li key={m}>• {m}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-ink-300">{personalization.reminder}</p>
            </section>
          ) : null}
        </PageContainer>
      </div>
    </AuthGate>
  );
}
