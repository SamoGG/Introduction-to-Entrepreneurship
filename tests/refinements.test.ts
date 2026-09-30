import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPreferences, initialLanguage, validPreferences } from '../src/lib/preferences.ts';
import { deleteTestData, keys } from '../src/lib/storage.ts';
import { filterQuestions, profileHighlights, profilePercentages } from '../src/lib/profile.ts';
import { calculateResult } from '../src/lib/scoring.ts';
import type { Answer } from '../src/lib/scoring.ts';
import { categories, questions, categoryIds } from '../src/data/questions.ts';

const winning = (id: number): Answer => id % 2 === 0 ? 'agree' : 'disagree';

test('browser language is only a fallback; saved language and existing sessions win', () => {
  assert.equal(initialLanguage(null, undefined, 'el-GR'), 'el');
  assert.equal(initialLanguage(null, undefined, 'EL-cy'), 'el');
  assert.equal(initialLanguage(null, undefined, 'fr-FR'), 'en');
  assert.equal(initialLanguage('en', 'el', 'el-GR'), 'en');
  assert.equal(initialLanguage('el', undefined, 'en-US'), 'el');
  assert.equal(initialLanguage(null, 'el', 'en-GB'), 'el');
});

test('preferences validate themes and actual booleans, and reject corrupt versions', () => {
  assert.ok(validPreferences(defaultPreferences));
  assert.ok(validPreferences({ ...defaultPreferences, theme: 'dark', highContrast: true }));
  for (const bad of [null, [], {}, { ...defaultPreferences, theme: 'blue' }, { ...defaultPreferences, largerText: 'false' }, { ...defaultPreferences, version: 2 }]) assert.equal(validPreferences(bad), false);
});

test('deletion removes only test data and reports failures without deleting preferences', () => {
  const store = new Map([keys.session, keys.current, keys.previous, keys.language, 'get2-preferences', 'other-app'].map(key => [key, 'value']));
  assert.equal(deleteTestData({ removeItem: key => { store.delete(key); } }), true);
  assert.deepEqual([...store.keys()], [keys.language, 'get2-preferences', 'other-app']);
  const attempted: string[] = [];
  assert.equal(deleteTestData({ removeItem: key => { attempted.push(key); throw new Error('Blocked'); } }), false);
  assert.deepEqual(attempted, [keys.session, keys.current, keys.previous]);
});

test('review filters preserve display positions and original ID mappings', () => {
  const order = [18, 3, 51, 7];
  const answers = { 18: 'unknown', 51: 'agree' } as const;
  assert.deepEqual(filterQuestions(order, answers, 'unknown'), [{ id: 18, index: 0 }]);
  assert.deepEqual(filterQuestions(order, answers, 'unanswered'), [{ id: 3, index: 1 }, { id: 7, index: 3 }]);
  assert.equal(filterQuestions(order, answers, 'all').length, 4);
  assert.deepEqual(order, [18, 3, 51, 7]);
});

test('profile percentages normalize different scales and distinguish N/A from zero', () => {
  const result = calculateResult(Object.fromEntries(questions.map(q => [q.id, winning(q.id)])));
  const percentages = profilePercentages(result);
  for (const category of categories) assert.equal(percentages[category], 100);
  result.dimensions.autonomy.finalScore = 3;
  result.dimensions.achievement.finalScore = 3;
  result.dimensions.risk.finalScore = 0;
  result.dimensions.locus.known = 0;
  assert.equal(profilePercentages(result).autonomy, 50);
  assert.equal(profilePercentages(result).achievement, 25);
  assert.equal(profilePercentages(result).risk, 0);
  assert.equal(profilePercentages(result).locus, null);
});

test('summary excludes low-coverage dimensions and requires at least three eligible dimensions', () => {
  const answers = Object.fromEntries(questions.map(q => [q.id, winning(q.id)]));
  let result = calculateResult(answers);
  assert.equal(profileHighlights(result)?.kind, 'balanced');
  result.dimensions.autonomy.finalScore = 0;
  result.dimensions.risk.coverage = 59;
  const summary = profileHighlights(result)!;
  assert.equal(summary.kind, 'higher');
  assert.ok(!summary.dimensions.includes('risk'));
  for (const id of [...categoryIds.achievement, ...categoryIds.creativity, ...categoryIds.locus]) answers[id] = 'unknown';
  result = calculateResult(answers);
  assert.equal(profileHighlights(result), null);
});
