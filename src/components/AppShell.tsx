'use client';

import { Header } from '@/components/Header';

/** Shared chrome: fixed header on every route under `app/(main)/`. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
