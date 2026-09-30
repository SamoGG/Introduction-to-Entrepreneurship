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

test('odd/even scoring uses original IDs and unknown remains distinct from a keyed zero', () => {
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

test('six points with eight known responses remain 6/12', () => {
  const answers: Answers = {};
  categoryIds.achievement.forEach((id, i) => { answers[id] = i < 6 ? earnsPoint(id) : i < 8 ? losesPoint(id) : 'unknown'; });
  const score = calculateDimensionScore('achievement', answers);
  assert.equal(score.points, 6);
  assert.equal(score.known, 8);
  assert.equal(score.unknown, 4);
  assert.equal(score.finalScore, 6);
  assert.equal(score.coverage, 8 / 12 * 100);
  assert.equal(score.classification, 'low');
});

test('thirty points with forty known responses remain 30/54', () => {
  const answers = answersWith(id => id <= 30 ? earnsPoint(id) : id <= 40 ? losesPoint(id) : 'unknown');
  const score = calculateOverallScore(answers);
  assert.equal(score.finalScore, 30);
  assert.equal(score.known, 40);
  assert.equal(score.unknown, 14);
  assert.equal(score.coverage, 40 / 54 * 100);
  assert.equal(score.classification, 'medium');
});

test('full coverage is equivalent to raw scoring and classifications use unrounded scores', () => {
  for (let points = 0; points <= 54; points++) {
    const score = calculateOverallScore(answersWith(id => id <= points ? earnsPoint(id) : losesPoint(id)));
    assert.ok(Math.abs(score.finalScore! - points) < 1e-12);
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
    assert.equal(score.finalScore, 0);
    assert.equal(score.classification, null);
    assert.equal(score.coverage, 0);
    assert.equal(score.unknown, score.maximum);
  }
  assert.equal(calculateOverallScore(answersWith(losesPoint)).finalScore, 0);
  assert.equal(calculateOverallScore({}).finalScore, 0);
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

test('overall equals the sum of dimension scores', () => {
  const answers = answersWith(id => categoryIds.autonomy.includes(id) ? 'unknown' : earnsPoint(id));
  answers[3] = losesPoint(3);
  const result = calculateResult(answers);
  assert.equal(result.overall.finalScore, 48);
  assert.equal(result.dimensions.autonomy.finalScore, 0);
  assert.equal(result.overall.finalScore, Object.values(result.dimensions).reduce((sum, score) => sum + (score.finalScore ?? 0), 0));
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
  assert.equal(validResult({ ...result, overall: { ...result.overall, finalScore: 54 } }), false);
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

// Exhaust all possible positive/negative/unknown counts, then mutate every item.
// Items are interchangeable within a dimension once their binary key is applied.
for (const category of categories) {
  test(`${category}: unknown substitutions never increase dimension or overall scores`, () => {
    const ids = categoryIds[category];
    for (let positive = 0; positive <= ids.length; positive++) {
      for (let negative = 0; negative <= ids.length - positive; negative++) {
        const answers = answersWith(() => 'unknown');
        ids.forEach((id, index) => { answers[id] = index < positive ? earnsPoint(id) : index < positive + negative ? losesPoint(id) : 'unknown'; });
        const before = calculateDimensionScore(category, answers);
        assert.equal(before.finalScore, positive);
        assert.equal(before.coverage, (positive + negative) / ids.length * 100);
        assert.equal(before.unknown, ids.length - positive - negative);
        assert.equal(before.classification, positive + negative === 0 ? null : classifyDimension(positive, ids.length));
        const overall = calculateOverallScore(answers);
        assert.equal(overall.finalScore, positive);
        for (const id of ids) {
          const unknown = { ...answers, [id]: 'unknown' as const };
          assert.ok(calculateDimensionScore(category, unknown).finalScore <= before.finalScore);
          assert.ok(calculateOverallScore(unknown).finalScore <= overall.finalScore);
          const missing = { ...answers };
          delete missing[id];
          assert.equal(calculateOverallScore(missing).finalScore, calculateOverallScore(unknown).finalScore);
          assert.equal(calculateDimensionScore(category, missing).finalScore, calculateDimensionScore(category, unknown).finalScore);
          if (answers[id] === 'unknown') {
            for (const [answer, delta] of [[earnsPoint(id), 1], [losesPoint(id), 0]] as const) {
              const next = { ...answers, [id]: answer };
              assert.equal(calculateDimensionScore(category, next).finalScore, positive + delta);
              assert.equal(calculateOverallScore(next).finalScore, positive + delta);
            }
          }
        }
      }
    }
  });

  test(`${category}: sparse evidence cannot earn a high score; full coverage matches original GET2`, () => {
    const ids = categoryIds[category];
    for (const count of [1, 3]) {
      const answers = answersWith(() => 'unknown');
      ids.slice(0, count).forEach(id => { answers[id] = earnsPoint(id); });
      const score = calculateDimensionScore(category, answers);
      assert.equal(score.finalScore, count);
      assert.equal(score.coverage, count / ids.length * 100);
      assert.equal(score.unknown, ids.length - count);
      assert.notEqual(score.classification, 'high');
    }
    for (let points = 0; points <= ids.length; points++) {
      const answers = answersWith(losesPoint);
      ids.slice(0, points).forEach(id => { answers[id] = earnsPoint(id); });
      assert.equal(calculateDimensionScore(category, answers).finalScore, points);
      assert.equal(calculateDimensionScore(category, answers).coverage, 100);
    }
  });
}

test('mixed responses preserve every dimension across presentation order and language', () => {
  const answers = answersWith(id => id % 3 === 0 ? 'unknown' : id % 3 === 1 ? earnsPoint(id) : losesPoint(id));
  const date = '2026-09-30T12:00:00.000Z';
  const expected = calculateResult(answers, date);
  for (const language of ['en', 'el'] as const) {
    const session: TestSession = { version: 2, questionOrder: shuffleQuestions(), answers, currentIndex: 0, language, completed: true };
    const restored = readStored({ getItem: () => JSON.stringify(session) }, keys.session, validSession)!;
    const reordered = Object.fromEntries(restored.questionOrder.map(id => [id, restored.answers[id]]));
    assert.deepEqual(calculateResult(reordered, date), expected);
  }
});

test('prorated result version 2 is rejected even when full-coverage scores happen to match', () => {
  for (const answers of [answersWith(earnsPoint), answersWith(() => 'unknown')]) {
    const result = calculateResult(answers);
    assert.equal(validResult({ ...result, version: 2 }), false);
    assert.equal(readStored({ getItem: () => JSON.stringify({ ...result, version: 2 }) }, keys.previous, validResult), null);
    assert.ok(validResult(result));
  }
});

test('runtime scoring rejects invalid values, extra IDs and inherited completion', () => {
  for (const value of ['invalid', '', null, true, 1, [], {}]) {
    const answers = answersWith(earnsPoint);
    (answers as Record<number, unknown>)[1] = value;
    assert.throws(() => calculateResult(answers), /valid response/);
    assert.throws(() => calculateOverallScore(answers), /Invalid/);
    assert.throws(() => scoreAnswer(1, value as Answer), /Invalid/);
  }
  assert.throws(() => calculateResult({ ...answersWith(earnsPoint), 55: 'agree' }), /valid response/);
  assert.throws(() => calculateResult(Object.create(answersWith(earnsPoint))), /valid response/);
  assert.throws(() => calculateResult(answersWith(earnsPoint), 'invalid'), /completion date/);
});

test('saved result evidence must reproduce every score, coverage and classification', () => {
  const result = calculateResult(answersWith(earnsPoint));
  assert.ok(validResult(result));
  assert.equal(validResult({ ...result, answers: answersWith(() => 'unknown') }), false);
  assert.equal(validResult({ ...result, version: 3 }), false);
  const { answers: _, ...withoutEvidence } = result;
  assert.equal(validResult(withoutEvidence), false);
  result.answers[1] = 'unknown';
  assert.equal(validResult(result), false);
});
