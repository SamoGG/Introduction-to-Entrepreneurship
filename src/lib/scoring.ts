import { categories, categoryIds } from '../data/questions.ts';
import type { Category } from '../data/questions.ts';

export type Answer = 'agree' | 'disagree' | 'unknown';
export type Answers = Partial<Record<number, Answer>>;
export type Classification = 'low' | 'medium' | 'high';
export type Score = {
  points: number;
  known: number;
  unknown: number;
  maximum: number;
  adjusted: number | null;
  coverage: number;
  classification: Classification | null;
};
export type Result = {
  version: 2;
  completedAt: string;
  overall: Score;
  dimensions: Record<Category, Score>;
};

export function scoreAnswer(questionId: number, answer: Answer | undefined): number | null {
  if (!Number.isInteger(questionId) || questionId < 1 || questionId > 54) {
    throw new Error('Scoring requires a permanent question ID from 1 to 54.');
  }
  if (answer === undefined || answer === 'unknown') return null;
  return Number(questionId % 2 === 0 ? answer === 'agree' : answer === 'disagree');
}

export function calculateCoverage(known: number, total: number): number {
  return total === 0 ? 0 : known / total * 100;
}

export function classificationThresholds(maximum: number): readonly [number, number] {
  return maximum === 54 ? [27, 44] : maximum === 6 ? [3, 4] : [7, 10];
}

export function classifyOverall(score: number | null): Classification | null {
  if (score === null) return null;
  const [medium, high] = classificationThresholds(54);
  return score < medium ? 'low' : score < high ? 'medium' : 'high';
}

export function classifyDimension(score: number | null, maximum: number): Classification | null {
  if (score === null) return null;
  const [medium, high] = classificationThresholds(maximum);
  return score < medium ? 'low' : score < high ? 'medium' : 'high';
}

export function coverageLevel(coverage: number): 'full' | 'reduced' | 'low' {
  return coverage >= 80 ? 'full' : coverage >= 60 ? 'reduced' : 'low';
}

function calculate(ids: readonly number[], answers: Answers): Score {
  let points = 0;
  let known = 0;
  let unknown = 0;
  for (const id of ids) {
    const point = scoreAnswer(id, answers[id]);
    if (point !== null) { known++; points += point; }
    if (answers[id] === 'unknown') unknown++;
  }
  const maximum = ids.length;
  // Keep full precision for classification. Round only when displaying results.
  const adjusted = known === 0 ? null : points / known * maximum;
  return {
    points, known, unknown, maximum, adjusted,
    coverage: calculateCoverage(known, maximum),
    classification: maximum === 54 ? classifyOverall(adjusted) : classifyDimension(adjusted, maximum),
  };
}

export function calculateDimensionScore(category: Category, answers: Answers): Score {
  return calculate(categoryIds[category], answers);
}

export function calculateOverallScore(answers: Answers): Score {
  // Calculate directly; summing independently normalized dimensions is incorrect.
  return calculate(Array.from({ length: 54 }, (_, index) => index + 1), answers);
}

export function calculateResult(answers: Answers, completedAt = new Date().toISOString()): Result {
  if (!Array.from({ length: 54 }, (_, index) => answers[index + 1]).every(Boolean)) {
    throw new Error('Every statement needs a response before results can be calculated.');
  }
  return {
    version: 2,
    completedAt,
    overall: calculateOverallScore(answers),
    dimensions: Object.fromEntries(categories.map(category =>
      [category, calculateDimensionScore(category, answers)],
    )) as Record<Category, Score>,
  };
}
