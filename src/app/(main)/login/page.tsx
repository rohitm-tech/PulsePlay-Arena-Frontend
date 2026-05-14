'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/auth/authSlice';
import { loginRequest } from '@/services/authApi';
import { config } from '@/config';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [email, setEmail] = useState(config.loginPrefillEmail);
  const [password, setPassword] = useState(config.loginPrefillPassword);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginRequest({ email, password });
      dispatch(setCredentials(data));
      toast.success('Welcome back');
      router.push('/matches');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <PageContainer column="narrow">
        <Card className="border-ink-200/80 dark:border-ink-800/80">
          <CardTitle>Sign in</CardTitle>
          <CardDescription className="mt-2">
            Access token + refresh token issued on success. Demo fields are prefilled when present — change or clear them anytime.
          </CardDescription>
          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Email</label>
              <input
                className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 outline-none transition focus-visible:border-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:focus-visible:border-ink-300"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">Password</label>
              <input
                className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 outline-none transition focus-visible:border-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:focus-visible:border-ink-300"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in…' : 'Continue'}
            </Button>
          </form>
          <p className="mt-8 text-center text-sm text-ink-500 dark:text-ink-400">
            New here?{' '}
            <Link href="/register" className="font-medium text-ink-900 underline-offset-4 hover:underline dark:text-ink-50">
              Create an account
            </Link>
          </p>
        </Card>
      </PageContainer>
    </div>
  );
}
