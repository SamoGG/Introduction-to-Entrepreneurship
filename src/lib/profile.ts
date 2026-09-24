import { categories } from '../data/questions.ts';
import type { Category } from '../data/questions.ts';
import type { Answers, Result } from './scoring.ts';

export type ReviewFilter = 'all' | 'unknown' | 'unanswered';
export function filterQuestions(order: number[], answers: Answers, filter: ReviewFilter) {
  return order.map((id, index) => ({ id, index })).filter(({ id }) =>
    filter === 'all' || (filter === 'unknown' ? answers[id] === 'unknown' : answers[id] === undefined));
}

export function profilePercentages(result: Result): Record<Category, number | null> {
  return Object.fromEntries(categories.map(category => {
    const score = result.dimensions[category];
    return [category, score.adjusted === null ? null : score.adjusted / score.maximum * 100];
  })) as Record<Category, number | null>;
}

export function profileHighlights(result: Result): { kind: 'balanced' | 'higher'; dimensions: Category[] } | null {
  const percentages = profilePercentages(result);
  const eligible = categories.filter(category => result.dimensions[category].coverage >= 60 && percentages[category] !== null)
    .sort((a, b) => percentages[b]! - percentages[a]!);
  if (eligible.length < 3) return null;
  const maximum = percentages[eligible[0]]!;
  if (maximum - percentages[eligible.at(-1)!]! < 10) return { kind: 'balanced', dimensions: eligible };
  return { kind: 'higher', dimensions: eligible.filter(category => maximum - percentages[category]! <= 5) };
}
