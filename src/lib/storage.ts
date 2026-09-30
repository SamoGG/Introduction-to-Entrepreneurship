import { defaultPreferences, initialLanguage, preferencesKey, validPreferences } from './preferences.ts';
import type { Preferences } from './preferences.ts';
import { categories } from '../data/questions.ts';
import { classifyDimension, classifyOverall } from './scoring.ts';
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
  const entries = Object.entries(value.answers);
  return entries.every(([id, answer]) => /^([1-9]|[1-4][0-9]|5[0-4])$/.test(id) &&
    (answer === 'agree' || answer === 'disagree' || answer === 'unknown')) &&
    (!value.completed || entries.length === 54);
}

function validScore(value: unknown, maximum: number): value is Score {
  if (!isObject(value)) return false;
  const { points, known, unknown, finalScore, coverage, classification } = value;
  if (![points, known, unknown].every(n => typeof n === 'number' && Number.isInteger(n) && n >= 0) ||
      value.maximum !== maximum || Number(known) + Number(unknown) !== maximum || Number(points) > Number(known)) return false;
  const expected = Number(points);
  const interpretable = known === 0 ? null : expected;
  return finalScore === expected && coverage === Number(known) / maximum * 100 && classification ===
    (maximum === 54 ? classifyOverall(interpretable) : classifyDimension(interpretable, maximum));
}

export function validResult(value: unknown): value is Result {
  if (!isObject(value) || value.version !== 3 || typeof value.completedAt !== 'string' ||
      !Number.isFinite(Date.parse(value.completedAt)) || !validScore(value.overall, 54) || !isObject(value.dimensions)) return false;
  const dimensions = value.dimensions;
  if (!categories.every(category => validScore(dimensions[category], category === 'autonomy' ? 6 : 12))) return false;
  return (['points', 'known', 'unknown'] as const).every(field =>
    categories.reduce((sum, category) => sum + (dimensions[category] as Score)[field], 0) === (value.overall as Score)[field]);
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
    return {
      session,
      current: readStored(localStorage, keys.current, validResult),
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
