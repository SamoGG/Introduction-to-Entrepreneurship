import { categories, questions } from '../data/questions.ts';
import type { Category } from '../data/questions.ts';
import type { Language } from './storage.ts';
export const quizKey = 'attributes-quiz-session';
export type QuizSession = { version: 1; questionOrder: number[]; optionOrder: Record<number, Category[]>; answers: Partial<Record<number, Category>>; currentIndex: number; language: Language; completed: boolean };
function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function createQuiz(language: Language): QuizSession {
  return { version: 1, questionOrder: shuffled(questions.map(q => q.id)), optionOrder: Object.fromEntries(questions.map(q => [q.id, shuffled(categories)])), answers: {}, currentIndex: 0, language, completed: false };
}
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null &&
  typeof value === 'object' && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const questionIds = questions.map(q => q.id);
const isCategory = (value: unknown): value is Category => categories.some(c => c === value);
const permutation = (value: unknown, expected: readonly unknown[]) => Array.isArray(value) &&
  value.length === expected.length && new Set(value).size === expected.length &&
  expected.every(item => value.includes(item));

export function validQuizAnswers(value: unknown, complete = false): value is QuizSession['answers'] {
  return isRecord(value) && (!complete || Object.keys(value).length === 54) &&
    Object.entries(value).every(([id, answer]) => questionIds.some(q => String(q) === id) && isCategory(answer));
}

export function validQuizSession(value: unknown): value is QuizSession {
  if (!isRecord(value) || value.version !== 1 || !permutation(value.questionOrder, questionIds) ||
      !isRecord(value.optionOrder) || Object.keys(value.optionOrder).length !== 54 ||
      !Number.isInteger(value.currentIndex) || Number(value.currentIndex) < 0 || Number(value.currentIndex) >= 54 ||
      (value.language !== 'en' && value.language !== 'el') || typeof value.completed !== 'boolean' ||
      !validQuizAnswers(value.answers, value.completed)) return false;
  const options = value.optionOrder;
  return questionIds.every(id => Object.hasOwn(options, id) && permutation(options[id], categories));
}

export function parseQuiz(raw: string | null): QuizSession | null {
  try {
    // A normal record is under 8 KB. Reject oversized/corrupt browser data before parsing it.
    if (!raw || raw.length > 25_000) return null;
    const value: unknown = JSON.parse(raw);
    return validQuizSession(value) ? value : null;
  } catch { return null; }
}

export function loadQuiz(): QuizSession | null {
  try { return parseQuiz(localStorage.getItem(quizKey)); } catch { return null; }
}
export function scoreQuiz(answers: QuizSession['answers']) {
  if (!validQuizAnswers(answers)) throw new Error('Invalid quiz answers');
  const byAttribute = Object.fromEntries(categories.map(c => [c, { correct: 0, total: questions.filter(q => q.category === c).length, percentage: 0 }])) as Record<Category, { correct: number; total: number; percentage: number }>;
  const pairs = new Map<string, { correct: Category; selected: Category; count: number }>();
  let correctAnswers = 0;
  for (const q of questions) {
    const selected = answers[q.id];
    if (selected === q.category) { correctAnswers++; byAttribute[q.category].correct++; }
    else if (selected) { const key = `${q.category}:${selected}`; const pair = pairs.get(key) ?? { correct: q.category, selected, count: 0 }; pair.count++; pairs.set(key, pair); }
  }
  for (const c of categories) byAttribute[c].percentage = byAttribute[c].correct / byAttribute[c].total * 100;
  return { correctAnswers, incorrectAnswers: 54 - correctAnswers, percentage: correctAnswers / 54 * 100, byAttribute, confusions: [...pairs.values()].filter(p => p.count >= 2).sort((a, b) => b.count - a.count || a.correct.localeCompare(b.correct) || a.selected.localeCompare(b.selected)).slice(0, 2) };
}
export const overallBand = (p: number) => p >= 90 ? 0 : p >= 80 ? 1 : p >= 70 ? 2 : p >= 60 ? 3 : 4;
export const attributeBand = (p: number) => p >= 90 ? 0 : p >= 70 ? 1 : p >= 50 ? 2 : 3;
