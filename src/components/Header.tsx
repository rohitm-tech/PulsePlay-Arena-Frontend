'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LogOut, Menu, Moon, Sun, X, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { siteHeaderInner, siteMobileNavInner } from '@/lib/site-layout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/auth/authSlice';
import { Button } from '@/components/ui/button';
import { listNotificationsRequest, markNotificationReadRequest } from '@/services/authApi';

const nav = [
  { href: '/matches', label: 'Live', matchPrefix: '/match/' as const },
  { href: '/features', label: 'Fan hub', auth: true as const },
  { href: '/leaderboards', label: 'Leaderboards' },
  { href: '/profile', label: 'Profile', auth: true as const },
  { href: '/admin', label: 'Admin', admin: true as const },
];

export function Header({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const user = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.accessToken);
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);

  const notifications = useQuery({
    queryKey: ['notifications'],
    enabled: !!token,
    queryFn: listNotificationsRequest,
    refetchInterval: 45_000,
  });

  const markRead = useMutation({
    mutationFn: markNotificationReadRequest,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => setMounted(true), []);

  function handleLogout() {
    dispatch(logout());
    setOpen(false);
    router.push('/');
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 border-b border-ink-200/60 bg-white/85 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/85',
        className
      )}
    >
      <div className={siteHeaderInner}>
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200/90 bg-ink-900 text-sm font-bold text-ink-50 transition group-hover:scale-105 dark:border-ink-600 dark:bg-ink-50 dark:text-ink-950">
            P
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink-900 dark:text-ink-50">PulsePlay</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav
            .filter((item) => {
              if (item.auth && !token) return false;
              if (item.admin && user?.role !== 'admin') return false;
              return true;
            })
            .map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`) ||
                ('matchPrefix' in item && item.matchPrefix ? pathname.startsWith(item.matchPrefix) : false);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-full px-6 py-2 text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-ink-900 text-ink-50 dark:bg-ink-100 dark:text-ink-950'
                      : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-900 dark:hover:text-ink-50'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="flex items-center gap-2">
          {token ? (
            <div className="relative hidden md:block">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                aria-label="Notifications"
                onClick={() => setNotifOpen((o) => !o)}
              >
                <Bell className="h-5 w-5" />
                {(notifications.data?.unread ?? 0) > 0 ? (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                ) : null}
              </Button>
              {notifOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-ink-200/90 bg-white p-2 text-left dark:border-ink-700 dark:bg-ink-950">
                  {(notifications.data?.items ?? []).length === 0 ? (
                    <p className="px-2 py-4 text-sm text-ink-500">No notifications yet.</p>
                  ) : (
                    notifications.data?.items.map((n) => (
                      <button
                        key={n._id}
                        type="button"
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-900 ${n.read ? 'opacity-60' : ''}`}
                        onClick={() => {
                          if (!n.read) markRead.mutate(n._id);
                        }}
                      >
                        <p className="font-medium text-ink-900 dark:text-ink-50">{n.title}</p>
                        <p className="text-xs text-ink-600 dark:text-ink-400">{n.body}</p>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {mounted && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          <div className="hidden items-center gap-2 md:flex">
            {token ? (
              <>
                <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5" />
                  Log out
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="outline">
                  Sign in
                </Button>
              </Link>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-200/60 bg-white/95 py-4 dark:border-ink-800/60 dark:bg-ink-950/95 md:hidden">
          <div className={siteMobileNavInner}>
            {nav
              .filter((item) => {
                if (item.auth && !token) return false;
                if (item.admin && user?.role !== 'admin') return false;
                return true;
              })
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-6 py-3 text-sm font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-900"
                >
                  {item.label}
                </Link>
              ))}
            <Link href="/matches" className="mt-2" onClick={() => setOpen(false)}>
              <Button className="w-full" size="sm">
                Browse matches
              </Button>
            </Link>
            {token && (
              <Button type="button" className="mt-2 w-full gap-2" size="sm" variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
