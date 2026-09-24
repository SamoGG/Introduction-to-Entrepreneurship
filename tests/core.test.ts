import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, categoryIds, questions, validateQuestions } from '../src/data/questions.ts';
import type { Question } from '../src/data/questions.ts';
import { calculateCoverage, calculateDimensionScore, calculateOverallScore, calculateResult, classifyDimension, classifyOverall, coverageLevel, scoreAnswer } from '../src/lib/scoring.ts';
import type { Answer, Answers } from '../src/lib/scoring.ts';
import { shuffleQuestions } from '../src/lib/shuffle.ts';
import { keys, readStored, validResult, validSession } from '../src/lib/storage.ts';
import type { TestSession } from '../src/lib/storage.ts';
import { translations } from '../src/i18n/translations.ts';

const earnsPoint = (id: number): Answer => id % 2 === 0 ? 'agree' : 'disagree';
const losesPoint = (id: number): Answer => id % 2 === 0 ? 'disagree' : 'agree';
const answersWith = (answer: (id: number) => Answer): Answers => Object.fromEntries(questions.map(({ id }) => [id, answer(id)]));

test('data contains every permanent ID, both languages, and the exact category mapping', () => {
  assert.doesNotThrow(() => validateQuestions(questions));
  assert.equal(questions.length, 54);
  assert.deepEqual(questions.map(q => q.id).sort((a, b) => a - b), Array.from({ length: 54 }, (_, i) => i + 1));
  for (const category of categories) {
    assert.equal(categoryIds[category].length, category === 'autonomy' ? 6 : 12);
    assert.deepEqual(questions.filter(q => q.category === category).map(q => q.id).sort((a, b) => a - b), [...categoryIds[category]].sort((a, b) => a - b));
  }
});

test('invalid question configuration fails clearly', () => {
  assert.throws(() => validateQuestions(questions.slice(1)), /54/);
  assert.throws(() => validateQuestions([...questions.slice(1), questions[1]]), /exactly once/);
  for (const patch of [{ id: 55 }, { id: 1.1 }, { english: '' }, { greek: ' ' }, { category: 'bad' }, { category: 'risk' }]) {
    assert.throws(() => validateQuestions([{ ...questions[0], ...patch } as Question, ...questions.slice(1)]));
  }
});

test('odd/even scoring uses original IDs and unknown is never a zero', () => {
  for (let id = 1; id <= 54; id++) {
    assert.equal(scoreAnswer(id, earnsPoint(id)), 1);
    assert.equal(scoreAnswer(id, losesPoint(id)), 0);
    assert.equal(scoreAnswer(id, 'unknown'), null);
    assert.equal(scoreAnswer(id, undefined), null);
  }
  assert.equal(scoreAnswer(18, 'agree'), 1);
  assert.throws(() => scoreAnswer(0, 'agree'));
  assert.throws(() => scoreAnswer(55, 'agree'));
});

test('the specified dimension example yields 6/8 × 12 = 9', () => {
  const answers: Answers = {};
  categoryIds.achievement.forEach((id, i) => { answers[id] = i < 6 ? earnsPoint(id) : i < 8 ? losesPoint(id) : 'unknown'; });
  const score = calculateDimensionScore('achievement', answers);
  assert.equal(score.points, 6);
  assert.equal(score.known, 8);
  assert.equal(score.unknown, 4);
  assert.equal(score.adjusted, 9);
  assert.equal(score.coverage, 8 / 12 * 100);
  assert.equal(score.classification, 'medium');
});

test('the specified overall example yields 30/40 × 54 = 40.5', () => {
  const answers = answersWith(id => id <= 30 ? earnsPoint(id) : id <= 40 ? losesPoint(id) : 'unknown');
  const score = calculateOverallScore(answers);
  assert.equal(score.adjusted, 40.5);
  assert.equal(score.known, 40);
  assert.equal(score.unknown, 14);
  assert.equal(score.coverage, 40 / 54 * 100);
  assert.equal(score.classification, 'medium');
});

test('full coverage is equivalent to raw scoring and classifications use unrounded scores', () => {
  for (let points = 0; points <= 54; points++) {
    const score = calculateOverallScore(answersWith(id => id <= points ? earnsPoint(id) : losesPoint(id)));
    assert.ok(Math.abs(score.adjusted! - points) < 1e-12);
    assert.equal(score.coverage, 100);
    assert.equal(score.unknown, 0);
    assert.equal(score.classification, points < 27 ? 'low' : points < 44 ? 'medium' : 'high');
  }
  assert.equal(classifyOverall(26.99), 'low');
  assert.equal(classifyOverall(27), 'medium');
  assert.equal(classifyOverall(43.99), 'medium');
  assert.equal(classifyOverall(44), 'high');
  assert.equal(classifyDimension(6.99, 12), 'low');
  assert.equal(classifyDimension(7, 12), 'medium');
  assert.equal(classifyDimension(9.99, 12), 'medium');
  assert.equal(classifyDimension(10, 12), 'high');
  assert.equal(classifyDimension(2.99, 6), 'low');
  assert.equal(classifyDimension(3, 6), 'medium');
  assert.equal(classifyDimension(3.99, 6), 'medium');
  assert.equal(classifyDimension(4, 6), 'high');
});

test('zero coverage yields N/A data; a real score of zero remains a score', () => {
  const result = calculateResult(answersWith(() => 'unknown'));
  for (const score of [result.overall, ...Object.values(result.dimensions)]) {
    assert.equal(score.adjusted, null);
    assert.equal(score.classification, null);
    assert.equal(score.coverage, 0);
    assert.equal(score.unknown, score.maximum);
  }
  assert.equal(calculateOverallScore(answersWith(losesPoint)).adjusted, 0);
  assert.equal(calculateOverallScore({}).adjusted, null);
  assert.equal(classifyOverall(null), null);
  assert.equal(classifyDimension(null, 6), null);
  assert.equal(calculateCoverage(0, 0), 0);
  assert.throws(() => calculateResult({ 1: 'agree' }), /Every statement/);
});

test('coverage warning boundaries are exact and independent of score', () => {
  assert.equal(calculateCoverage(46, 54), 46 / 54 * 100);
  assert.equal(coverageLevel(100), 'full');
  assert.equal(coverageLevel(80), 'full');
  assert.equal(coverageLevel(79.99), 'reduced');
  assert.equal(coverageLevel(60), 'reduced');
  assert.equal(coverageLevel(59.99), 'low');
  assert.equal(coverageLevel(0), 'low');
});

test('overall is directly normalized, rather than the sum of dimension scores', () => {
  const answers = answersWith(id => categoryIds.autonomy.includes(id) ? 'unknown' : earnsPoint(id));
  answers[3] = losesPoint(3);
  const result = calculateResult(answers);
  assert.equal(result.overall.adjusted, 48 / 49 * 54);
  assert.equal(result.dimensions.autonomy.adjusted, 0);
  assert.notEqual(result.overall.adjusted, Object.values(result.dimensions).reduce((sum, score) => sum + (score.adjusted ?? 0), 0));
});

test('2,000 seeded shuffles preserve all IDs, avoid category triples, and vary order', () => {
  let seed = 728184;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const orders = new Set<string>();
  const category = new Map(questions.map(q => [q.id, q.category]));
  const answers = answersWith(id => id % 7 === 0 ? 'unknown' : earnsPoint(id));
  const expected = calculateOverallScore(answers);
  for (let attempt = 0; attempt < 2000; attempt++) {
    const order = shuffleQuestions(random);
    assert.equal(order.length, 54);
    assert.equal(new Set(order).size, 54);
    assert.ok(order.every(id => id >= 1 && id <= 54));
    for (let i = 2; i < order.length; i++) {
      assert.ok(!(category.get(order[i]) === category.get(order[i - 1]) && category.get(order[i]) === category.get(order[i - 2])));
    }
    orders.add(order.join(','));
    assert.deepEqual(calculateOverallScore(Object.fromEntries(order.map(id => [id, answers[id]]))), expected);
  }
  assert.equal(orders.size, 2000);
});

test('session round-trips preserve IDs, order, answers, position, and language', () => {
  const session: TestSession = { version: 2, questionOrder: shuffleQuestions(), answers: { 18: 'agree', 26: 'unknown' }, currentIndex: 17, language: 'el', completed: false };
  const storage = { getItem: (key: string) => key === keys.session ? JSON.stringify(session) : null };
  assert.deepEqual(readStored(storage, keys.session, validSession), session);
  assert.ok(validSession({ ...session, language: 'en' }));
  assert.equal(validSession({ ...session, questionOrder: [1, 2] }), false);
  assert.equal(validSession({ ...session, questionOrder: Array(54).fill(1) }), false);
  assert.equal(validSession({ ...session, version: 1 }), false);
  assert.equal(validSession({ ...session, answers: { 55: 'agree' } }), false);
  assert.equal(validSession({ ...session, answers: { 1: 'invalid' } }), false);
  assert.equal(validSession({ ...session, answers: { 1: ['agree'] } }), false);
  assert.equal(validSession({ ...session, language: ['en'] }), false);
  assert.equal(validSession({ ...session, completed: true }), false);
  assert.equal(validSession({ ...session, currentIndex: 54 }), false);
  assert.equal(validSession({ ...session, language: 'fr' }), false);
});

test('malformed storage and tampered results are rejected safely', () => {
  assert.equal(readStored({ getItem: () => '{broken' }, keys.session, validSession), null);
  assert.equal(readStored({ getItem: () => { throw new Error('Blocked'); } }, keys.session, validSession), null);
  const result = calculateResult(answersWith(id => id > 40 ? 'unknown' : id > 30 ? losesPoint(id) : earnsPoint(id)), '2026-09-23T12:00:00.000Z');
  assert.ok(validResult(JSON.parse(JSON.stringify(result))));
  assert.equal(validResult({ ...result, version: 1 }), false);
  assert.equal(validResult({ ...result, overall: { ...result.overall, adjusted: 54 } }), false);
  assert.equal(validResult({ ...result, dimensions: {} }), false);
  assert.equal(validResult({ ...result, completedAt: 'invalid' }), false);
  assert.ok(validResult(calculateResult(answersWith(() => 'unknown'))));
});

test('English and Greek have matching complete UI text', () => {
  assert.deepEqual(Object.keys(translations.en).sort(), Object.keys(translations.el).sort());
  for (const language of ['en', 'el'] as const) {
    assert.ok(Object.values(translations[language]).every(value => typeof value === 'string' && value.trim().length > 0));
  }
  assert.equal(translations.el.agree, 'Συμφωνώ');
  assert.equal(translations.el.disagree, 'Διαφωνώ');
  assert.equal(translations.el.unknown, 'Δεν ξέρω');
});
