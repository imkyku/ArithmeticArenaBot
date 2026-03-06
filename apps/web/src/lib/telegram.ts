import WebApp from '@twa-dev/sdk';

export const initTelegram = (): string | null => {
  try {
    WebApp.ready();
    WebApp.expand();
    return WebApp.initData || null;
  } catch {
    return null;
  }
};
