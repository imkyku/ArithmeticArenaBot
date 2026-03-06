import { translations } from '@arena/shared';
import { useAppStore } from '../store/app-store';

export const useT = () => {
  const locale = useAppStore((s) => s.locale);
  return translations[locale];
};
