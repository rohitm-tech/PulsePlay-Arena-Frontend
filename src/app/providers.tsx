'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { persistor, store } from '@/store';
import { injectStore } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  useEffect(() => {
    injectStore(store);
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster richColors position="top-center" theme="system" />
          </QueryClientProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
