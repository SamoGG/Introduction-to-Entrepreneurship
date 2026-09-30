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
  finalScore: number;
  coverage: number;
  classification: Classification | null;
};
export type Result = {
  version: 4;
  answers: Answers;
  completedAt: string;
  overall: Score;
  dimensions: Record<Category, Score>;
};

export function validAnswers(value: unknown, complete = false): value is Answers {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return false;
  const entries = Object.entries(value);
  return (!complete || entries.length === 54) && entries.every(([id, answer]) =>
    /^([1-9]|[1-4][0-9]|5[0-4])$/.test(id) &&
    (answer === 'agree' || answer === 'disagree' || answer === 'unknown'));
}

export function scoreAnswer(questionId: number, answer: Answer | undefined): number | null {
  if (!Number.isInteger(questionId) || questionId < 1 || questionId > 54) {
    throw new Error('Scoring requires a permanent question ID from 1 to 54.');
  }
  if (answer === undefined || answer === 'unknown') return null;
  if (answer !== 'agree' && answer !== 'disagree') throw new Error('Invalid questionnaire response.');
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
  if (!validAnswers(answers)) throw new Error('Invalid questionnaire responses.');
  let points = 0;
  let known = 0;
  let unknown = 0;
  for (const id of ids) {
    const point = scoreAnswer(id, answers[id]);
    if (point !== null) { known++; points += point; }
    if (answers[id] === 'unknown') unknown++;
  }
  const maximum = ids.length;
  // Unknown is uncertainty, not a keyed response. It cannot add evidence points.
  const finalScore = points;
  const interpretable = known === 0 ? null : finalScore;
  return {
    points, known, unknown, maximum, finalScore,
    coverage: calculateCoverage(known, maximum),
    classification: maximum === 54 ? classifyOverall(interpretable) : classifyDimension(interpretable, maximum),
  };
}

export function calculateDimensionScore(category: Category, answers: Answers): Score {
  return calculate(categoryIds[category], answers);
}

export function calculateOverallScore(answers: Answers): Score {
  // The overall score equals the sum of dimension points.
  return calculate(Array.from({ length: 54 }, (_, index) => index + 1), answers);
}

export function calculateResult(answers: Answers, completedAt = new Date().toISOString()): Result {
  if (!validAnswers(answers, true)) {
    throw new Error('Every statement needs a valid response before results can be calculated.');
  }
  if (!Number.isFinite(Date.parse(completedAt))) throw new Error('Invalid completion date.');
  return {
    version: 4,
    answers: { ...answers },
    completedAt,
    overall: calculateOverallScore(answers),
    dimensions: Object.fromEntries(categories.map(category =>
      [category, calculateDimensionScore(category, answers)],
    )) as Record<Category, Score>,
  };
}
