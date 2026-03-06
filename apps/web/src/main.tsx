import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initTelegram } from './lib/telegram';
import { telegramAuth } from './lib/api';
import { useAppStore } from './store/app-store';
import { App } from './app/App';
import './styles/index.css';

const queryClient = new QueryClient();

const Bootstrap = (): JSX.Element => {
  const setUserId = useAppStore((s) => s.setUserId);

  useEffect(() => {
    const initDataRaw = initTelegram();
    if (initDataRaw) {
      telegramAuth(initDataRaw)
        .then((res) => setUserId(res.userId))
        .catch(() => undefined);
    }
  }, [setUserId]);

  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Bootstrap />
    </QueryClientProvider>
  </StrictMode>,
);
