import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
<<<<<<< HEAD
import { App } from './app/App';
import { telegramAuth } from './lib/api';
import { initTelegram } from './lib/telegram';
import { useAppStore } from './store/app-store';
=======
import { initTelegram } from './lib/telegram';
import { telegramAuth } from './lib/api';
import { useAppStore } from './store/app-store';
import { App } from './app/App';
>>>>>>> main
import './styles/index.css';

const queryClient = new QueryClient();

<<<<<<< HEAD
const Bootstrap = () => {
=======
const Bootstrap = (): JSX.Element => {
>>>>>>> main
  const setUserId = useAppStore((s) => s.setUserId);

  useEffect(() => {
    const initDataRaw = initTelegram();
<<<<<<< HEAD
    if (!initDataRaw) return;
    telegramAuth(initDataRaw)
      .then((res) => setUserId(res.userId))
      .catch(() => undefined);
=======
    if (initDataRaw) {
      telegramAuth(initDataRaw)
        .then((res) => setUserId(res.userId))
        .catch(() => undefined);
    }
>>>>>>> main
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
