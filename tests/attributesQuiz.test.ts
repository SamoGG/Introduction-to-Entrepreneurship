import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, questions } from '../src/data/questions.ts';
import { attributeBand, createQuiz, loadQuiz, overallBand, parseQuiz, quizKey, scoreQuiz, validQuizSession } from '../src/lib/attributesQuiz.ts';
import { keys } from '../src/lib/storage.ts';
const correct = Object.fromEntries(questions.map(q => [q.id, q.category]));
const wrong = Object.fromEntries(questions.map(q => [q.id, categories[(categories.indexOf(q.category) + 1) % 5]]));

test('authoritative attribute distribution covers permanent IDs exactly once', () => {
  const expected = [[1,6,10,15,19,24,28,33,37,42,46,51], [3,12,21,30,39,48], [5,8,14,17,23,26,32,35,41,44,50,53], [2,9,11,18,20,27,29,36,38,45,47,54], [4,7,13,16,22,25,31,34,40,43,49,52]];
  categories.forEach((c, i) => assert.deepEqual(questions.filter(q => q.category === c).map(q => q.id).sort((a,b) => a-b), expected[i]));
  assert.equal(new Set(questions.map(q => q.id)).size, 54);
  assert.deepEqual(expected.map(ids => ids.length), [12,6,12,12,12]);
});
test('category matches earn one point, mismatches zero; totals and percentages', () => {
  assert.equal(scoreQuiz({ 1: 'achievement' }).correctAnswers, 1);
  assert.equal(scoreQuiz({ 1: 'risk' }).correctAnswers, 0);
  assert.equal(scoreQuiz(correct).correctAnswers, 54);
  assert.equal(scoreQuiz(correct).percentage, 100);
  assert.equal(scoreQuiz(wrong).percentage, 0);
  assert.equal(scoreQuiz(wrong).incorrectAnswers, 54);
  assert.equal(scoreQuiz({ ...correct, 1: 'risk' }).percentage, 53 / 54 * 100);
});
test('per-attribute denominators use true membership, not selected labels', () => {
  const r = scoreQuiz(Object.fromEntries(questions.map(q => [q.id, 'autonomy' as const])));
  assert.deepEqual(r.byAttribute.autonomy, {correct: 6, total: 6, percentage: 100});
  assert.deepEqual(r.byAttribute.risk, {correct: 0, total: 12, percentage: 0});
});
test('randomized question and option permutations and both languages preserve scoring', () => {
  for (const language of ['en', 'el'] as const) {
    const s = createQuiz(language);
    assert.deepEqual([...s.questionOrder].sort((a,b) => a-b), questions.map(q => q.id));
    for (const order of Object.values(s.optionOrder)) assert.deepEqual([...order].sort(), [...categories].sort());
    s.answers = Object.fromEntries(s.questionOrder.map(id => [id, s.optionOrder[id].find(c => c === correct[id])!]));
    assert.equal(scoreQuiz(s.answers).percentage, 100);
  }
});
test('confusions are directional, repeated at least twice, and capped at two', () => {
  assert.deepEqual(scoreQuiz({ ...correct, 1: 'risk' }).confusions, []);
  assert.deepEqual(scoreQuiz({ ...correct, 1: 'risk', 6: 'risk', 2: 'achievement' }).confusions, [{ correct: 'achievement', selected: 'risk', count: 2 }]);
  assert.equal(scoreQuiz(wrong).confusions.length, 2);
});
test('educational feedback uses exact unrounded thresholds', () => {
  assert.deepEqual([100,90,89,80,79,70,69,60,59].map(overallBand), [0,0,1,1,2,2,3,3,4]);
  assert.deepEqual([90,89,70,69,50,49].map(attributeBand), [0,1,1,2,2,3]);
});
test('persistence validates permutations and retake leaves GET2 data intact', () => {
  const data = new Map<string,string>([[keys.session, 'untouched GET2']]);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {getItem: (key: string) => data.get(key) ?? null} });
  try {
    const s = createQuiz('el'); s.answers = {1: 'achievement'}; s.currentIndex = 3;
    data.set(quizKey, JSON.stringify(s)); assert.deepEqual(loadQuiz(), s);
    const retake = createQuiz('en'); data.set(quizKey, JSON.stringify(retake));
    assert.deepEqual(retake.answers, {}); assert.equal(retake.currentIndex, 0); assert.equal(retake.completed, false);
    assert.equal(data.get(keys.session), 'untouched GET2');
    for (const invalid of [{...s, questionOrder: Array(54).fill(1)}, {...s, optionOrder: {}}, {...s, completed: true}, {...s, answers: {55: 'risk'}}, {...s, currentIndex: 54}]) { data.set(quizKey, JSON.stringify(invalid)); assert.equal(loadQuiz(), null); }
  } finally { Reflect.deleteProperty(globalThis, 'localStorage'); }
});

test('scoring rejects forged values, extra IDs and inherited answer objects', () => {
  for (const answers of [null, [], { 0: 'risk' }, { 55: 'risk' }, { '01': 'risk' }, { 1: 'agree' }, { 1: undefined }, { 1: '<script>alert(1)</script>' }, Object.create(correct)]) {
    assert.throws(() => scoreQuiz(answers as Parameters<typeof scoreQuiz>[0]), /Invalid quiz answers/);
  }
});

test('untrusted saved sessions reject malformed records and cannot fake completion with a count', () => {
  const s = createQuiz('en');
  const invalid: unknown[] = [null, [], {}, {...s, answers: null}, {...s, completed: 'true'},
    {...s, currentIndex: -1}, {...s, currentIndex: 1.5}, {...s, questionOrder: [...s.questionOrder.slice(1), 55]},
    {...s, optionOrder: {...s.optionOrder, 1: Array(5).fill('risk')}},
    {...s, optionOrder: {...s.optionOrder, 55: [...categories]}},
    {...s, answers: {...correct, 54: undefined}, completed: true},
    {...s, answers: {...correct, 54: 'agree'}, completed: true},
    {...s, answers: {...correct, 55: 'risk'}, completed: true},
    {...s, answers: Object.create(correct), completed: true},
    {...s, optionOrder: Object.create(s.optionOrder)}, Object.create(s)];
  for (const value of invalid) assert.equal(validQuizSession(value), false);
  for (const raw of ['{', 'null', '[]', 'x'.repeat(25_001)]) assert.equal(parseQuiz(raw), null);
  assert.equal(validQuizSession({...s, answers: correct, completed: true}), true);
});
