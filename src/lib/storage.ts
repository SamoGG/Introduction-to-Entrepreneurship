import { defaultPreferences, initialLanguage, preferencesKey, validPreferences } from './preferences.ts';
import type { Preferences } from './preferences.ts';
import { categories } from '../data/questions.ts';
import { calculateResult, validAnswers } from './scoring.ts';
import type { Answers, Result, Score } from './scoring.ts';

export type Language = 'en' | 'el';
export type TestSession = {
  version: 2;
  questionOrder: number[];
  answers: Answers;
  currentIndex: number;
  language: Language;
  completed: boolean;
};

export const keys = {
  session: 'get2-active-session', current: 'get2-current-result',
  previous: 'get2-previous-result', language: 'get2-language',
} as const;

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export function validSession(value: unknown): value is TestSession {
  if (!isObject(value) || value.version !== 2 || !Array.isArray(value.questionOrder) ||
      value.questionOrder.length !== 54 || new Set(value.questionOrder).size !== 54 ||
      !value.questionOrder.every(id => Number.isInteger(id) && id >= 1 && id <= 54) ||
      !Number.isInteger(value.currentIndex) || Number(value.currentIndex) < 0 || Number(value.currentIndex) > 53 ||
      (value.language !== 'en' && value.language !== 'el') || typeof value.completed !== 'boolean' ||
      !isObject(value.answers)) return false;
  return validAnswers(value.answers, value.completed);
}

export function validResult(value: unknown): value is Result {
  if (!isObject(value) || value.version !== 4 || typeof value.completedAt !== 'string' ||
      !Number.isFinite(Date.parse(value.completedAt)) || !validAnswers(value.answers, true) ||
      !isObject(value.overall) || !isObject(value.dimensions)) return false;
  const expected = calculateResult(value.answers, value.completedAt);
  const matches = (actual: unknown, score: Score) => isObject(actual) &&
    (Object.keys(score) as (keyof Score)[]).every(key => actual[key] === score[key]);
  const dimensions = value.dimensions;
  return matches(value.overall, expected.overall) && categories.every(category =>
    matches(dimensions[category], expected.dimensions[category]));
}

export function readStored<T>(storage: Pick<Storage, 'getItem'>, key: string, validate: (value: unknown) => value is T): T | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? 'null');
    return validate(value) ? value : null;
  } catch { return null; }
}

export function saveStored(key: string, value: unknown): boolean {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch { return false; }
}

export function deleteTestData(storage?: Pick<Storage, 'removeItem'>): boolean {
  let success = true;
  for (const key of [keys.session, keys.current, keys.previous]) {
    try { (storage ?? localStorage).removeItem(key); } catch { success = false; }
  }
  return success;
}

export function loadState() {
  const browserLanguage = typeof navigator === 'undefined' ? 'en' : navigator.language;
  try {
    const session = readStored(localStorage, keys.session, validSession);
    const language = readStored(localStorage, keys.language, (value): value is Language => value === 'en' || value === 'el');
    const saved = readStored(localStorage, keys.current, validResult);
    // A current result is derived only from the active completed session.
    const current = session?.completed ? calculateResult(session.answers, saved?.completedAt) : null;
    return {
      session,
      current,
      previous: readStored(localStorage, keys.previous, validResult),
      language: initialLanguage(language, session?.language, browserLanguage),
    };
  } catch {
    return { session: null, current: null, previous: null, language: initialLanguage(null, undefined, browserLanguage) };
  }
}

export function loadPreferences(): Preferences {
  try {
    return readStored(localStorage, preferencesKey, validPreferences) ?? { ...defaultPreferences };
  } catch { return { ...defaultPreferences }; }
}

// Compare exact stored records before a write, including deletions and edits in other tabs.
export function testDataSnapshot(): string | null {
  try { return JSON.stringify([keys.session, keys.current, keys.previous].map(key => localStorage.getItem(key))); }
  catch { return null; }
}
