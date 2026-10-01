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
export function loadQuiz(): QuizSession | null {
  try {
    const s = JSON.parse(localStorage.getItem(quizKey) ?? 'null') as QuizSession;
    const permutation = (value: unknown, expected: readonly unknown[]) => Array.isArray(value) && value.length === expected.length && new Set(value).size === expected.length && value.every(v => expected.includes(v));
    if (!s || s.version !== 1 || !permutation(s.questionOrder, questions.map(q => q.id)) || !s.optionOrder || !questions.every(q => permutation(s.optionOrder[q.id], categories)) || !s.answers || typeof s.answers !== 'object' || Array.isArray(s.answers) || !Object.entries(s.answers).every(([id, a]) => questions.some(q => String(q.id) === id) && a !== undefined && categories.includes(a)) || !Number.isInteger(s.currentIndex) || s.currentIndex < 0 || s.currentIndex >= 54 || !['en', 'el'].includes(s.language) || typeof s.completed !== 'boolean' || (s.completed && Object.keys(s.answers).length !== 54)) return null;
    return s;
  } catch { return null; }
}
export function scoreQuiz(answers: QuizSession['answers']) {
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
