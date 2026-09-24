import type { Language } from './storage.ts';

export type Preferences = {
  version: 1;
  theme: 'system' | 'light' | 'dark';
  largerText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
};
export const preferencesKey = 'get2-preferences';
export const defaultPreferences: Preferences = { version: 1, theme: 'system', largerText: false, highContrast: false, reduceMotion: false };

export function validPreferences(value: unknown): value is Preferences {
  if (!value || typeof value !== 'object') return false;
  const p = value as Preferences;
  return p.version === 1 && ['system', 'light', 'dark'].includes(p.theme) &&
    [p.largerText, p.highContrast, p.reduceMotion].every(item => typeof item === 'boolean');
}

export function initialLanguage(saved: Language | null, session: Language | undefined, browserLanguage: string): Language {
  return saved ?? session ?? (browserLanguage.toLowerCase().startsWith('el') ? 'el' : 'en');
}
