import { useSelector } from 'react-redux';
import type { RootState } from './store';
import enCA from './locales/en-US.json';

type Messages = Record<string, unknown>;

const locales: Record<string, Messages> = {
  'en-US': enCA as unknown as Messages,
};

export const useTranslation = () => {
  const locale = useSelector((s: RootState) => ((s as unknown) as { locale?: { locale?: string } })?.locale?.locale || 'en-US');
  const messages = locales[locale] ?? locales['en-US'];

  const t = (path: string, fallback?: string) => {
    const parts = path.split('.');
    let cur: unknown = messages;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return fallback ?? path;
      }
    }
    return typeof cur === 'string' ? cur : fallback ?? String(cur);
  };

  const get = (path: string) => {
    const parts = path.split('.');
    let cur: unknown = messages;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return undefined;
      }
    }
    return cur;
  };

  return { t, get, locale };
};

export default useTranslation;
