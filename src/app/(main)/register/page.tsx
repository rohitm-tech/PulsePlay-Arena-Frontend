'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/auth/authSlice';
import { registerRequest } from '@/services/authApi';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [team, setTeam] = useState('RCB');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await registerRequest({ name, email, password, favoriteTeam: team });
      dispatch(setCredentials(data));
      toast.success('Account ready');
      router.push('/matches');
    } catch {
      toast.error('Could not register');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <PageContainer column="narrow">
        <Card>
          <CardTitle>Create account</CardTitle>
          <CardDescription className="mt-2">Pick a team badge — UI stays neutral black & white.</CardDescription>
          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Name</label>
              <input
                className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm outline-none transition focus-visible:border-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:focus-visible:border-ink-300"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Email</label>
              <input
                className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm outline-none transition focus-visible:border-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:focus-visible:border-ink-300"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Password</label>
              <input
                className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm outline-none transition focus-visible:border-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:focus-visible:border-ink-300"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Favorite team</label>
              <select
                className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm outline-none transition focus-visible:border-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:focus-visible:border-ink-300"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              >
                {['RCB', 'CSK', 'MI', 'KKR', 'SRH', 'DC', 'PBKS', 'RR', 'GT', 'LSG'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating…' : 'Join PulsePlay'}
            </Button>
          </form>
          <p className="mt-8 text-center text-sm text-ink-500 dark:text-ink-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-ink-900 underline-offset-4 hover:underline dark:text-ink-50">
              Sign in
            </Link>
          </p>
        </Card>
      </PageContainer>
    </div>
  );
}
