'use client';

import { useQuery } from '@tanstack/react-query';
import { AuthGate } from '@/components/AuthGate';
import { PageContainer } from '@/components/layout/PageContainer';
import api from '@/lib/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLeaderboard, type LeaderboardRow } from '@/store/leaderboard/leaderboardSlice';

export default function LeaderboardsPage() {
  const dispatch = useAppDispatch();
  const rows = useAppSelector((s) => s.leaderboard.rows);

  useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await api.get<{ data: LeaderboardRow[] }>('/api/leaderboard');
      dispatch(setLeaderboard(res.data.data));
      return res.data.data;
    },
  });

  return (
    <AuthGate>
      <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
        <PageContainer>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">Leaderboards</h1>
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">XP, correct calls, and streaks — high contrast table.</p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-ink-200/90 bg-white dark:border-ink-800/90 dark:bg-ink-900/40">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-200 bg-ink-50 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:border-ink-800 dark:bg-ink-950/80 dark:text-ink-400">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Fan</th>
                  <th className="px-6 py-3">XP</th>
                  <th className="px-6 py-3">Correct</th>
                  <th className="px-6 py-3">Streak</th>
                </tr>
              </thead>
              <tbody className="text-ink-800 dark:text-ink-200">
                {rows.map((r, idx) => (
                  <tr key={r._id} className="border-t border-ink-100 transition hover:bg-ink-50 dark:border-ink-800/80 dark:hover:bg-ink-900/60">
                    <td className="px-6 py-3 text-ink-500 dark:text-ink-500">{idx + 1}</td>
                    <td className="px-6 py-3 font-medium text-ink-900 dark:text-ink-50">
                      {(r.userId as { name?: string })?.name ?? 'Player'}
                    </td>
                    <td className="px-6 py-3">{r.xp}</td>
                    <td className="px-6 py-3">{r.correctPredictions}</td>
                    <td className="px-6 py-3">{r.streak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageContainer>
      </div>
    </AuthGate>
  );
}
