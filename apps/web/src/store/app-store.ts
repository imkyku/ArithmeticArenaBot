import { create } from 'zustand';

type Locale = 'ru' | 'en';

interface AppStore {
  locale: Locale;
  userId?: string;
  setLocale: (locale: Locale) => void;
  setUserId: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  locale: 'ru',
  setLocale: (locale) => set({ locale }),
  setUserId: (userId) => set({ userId }),
}));
