'use client';

import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout, setUser } from '@/store/auth/authSlice';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { patchMeRequest } from '@/services/authApi';
import { toast } from 'sonner';

export default function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [name, setName] = useState(user?.name ?? '');
  const [favoriteTeam, setFavoriteTeam] = useState(user?.favoriteTeam ?? '');
  const [players, setPlayers] = useState((user?.favoritePlayers ?? []).join(', '));
  const [prefs, setPrefs] = useState(user?.notificationPrefs);

  useEffect(() => {
    setName(user?.name ?? '');
    setFavoriteTeam(user?.favoriteTeam ?? '');
    setPlayers((user?.favoritePlayers ?? []).join(', '));
    setPrefs(user?.notificationPrefs);
  }, [user]);

  async function save() {
    try {
      const favoritePlayers = players
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8);
      const updated = await patchMeRequest({
        name: name.trim() || undefined,
        favoriteTeam: favoriteTeam.trim() || null,
        favoritePlayers,
        notificationPrefs: prefs,
      });
      dispatch(setUser(updated));
      toast.success('Profile saved');
    } catch {
      toast.error('Save failed');
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
        <PageContainer>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-ink-500 dark:text-ink-400">Account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">Profile</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600 dark:text-ink-400">
            Personalization, notification prefs, and fan tier from XP.
          </p>

          <Card className="mt-10">
            <CardTitle>Details</CardTitle>
            <CardDescription>Name, favorites, and in-app alert toggles.</CardDescription>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Favorite team</label>
                <input
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value)}
                  placeholder="e.g. RCB"
                  className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
                  Favorite players (comma-separated)
                </label>
                <input
                  value={players}
                  onChange={(e) => setPlayers(e.target.value)}
                  placeholder="Kohli, Gill, …"
                  className="mt-1 w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                />
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Live alerts (in-app toasts)</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ['boundaries', 'Sixes & fours'],
                    ['wickets', 'Wickets'],
                    ['milestones', 'Fifties / hundreds / result'],
                    ['polls', 'Poll results'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-ink-800 dark:text-ink-200">
                    <input
                      type="checkbox"
                      checked={prefs?.[key] ?? true}
                      onChange={(e) =>
                        setPrefs((p) => ({
                          boundaries: true,
                          wickets: true,
                          milestones: true,
                          polls: true,
                          ...p,
                          [key]: e.target.checked,
                        }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <dl className="mt-8 grid gap-3 border-t border-ink-100 pt-6 text-sm dark:border-ink-800 sm:grid-cols-2">
              <div>
                <dt className="text-ink-500 dark:text-ink-400">Email</dt>
                <dd className="font-medium text-ink-900 dark:text-ink-50">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-ink-500 dark:text-ink-400">Fan tier</dt>
                <dd className="font-medium text-ink-900 dark:text-ink-50">{user?.fanTier ?? 1} / 5</dd>
              </div>
              <div>
                <dt className="text-ink-500 dark:text-ink-400">XP</dt>
                <dd className="font-medium text-ink-900 dark:text-ink-50">{user?.xpPoints}</dd>
              </div>
              <div>
                <dt className="text-ink-500 dark:text-ink-400">Following</dt>
                <dd className="font-medium text-ink-900 dark:text-ink-50">{user?.followingCount ?? 0}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-ink-500 dark:text-ink-400">Badges</dt>
                <dd className="font-medium text-ink-900 dark:text-ink-50">{user?.badges?.join(', ') || '—'}</dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button type="button" onClick={() => void save()}>
                Save changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  dispatch(logout());
                  router.push('/');
                }}
              >
                Log out
              </Button>
            </div>
          </Card>
        </PageContainer>
      </div>
    </AuthGate>
  );
}
