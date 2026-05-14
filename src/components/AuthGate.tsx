'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import { siteInShell } from '@/lib/site-layout';

type Persisted = { _persist?: { rehydrated: boolean } };

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const rehydrated = useAppSelector((s) => (s as Persisted)._persist?.rehydrated ?? false);

  useEffect(() => {
    if (!rehydrated) return;
    if (!accessToken) router.replace('/login');
  }, [accessToken, rehydrated, router]);

  if (!rehydrated || !accessToken) {
    return (
      <div className={cn(siteInShell, 'flex min-h-[50vh] flex-col items-center justify-center gap-3')}>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-200 border-t-ink-900 dark:border-ink-700 dark:border-t-ink-50" />
        <p className="text-sm text-ink-500 dark:text-ink-400">Checking session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
