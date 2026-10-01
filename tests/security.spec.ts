import { test, expect } from '@playwright/test';
import { createQuiz, quizKey } from '../src/lib/attributesQuiz.ts';
import { keys } from '../src/lib/storage.ts';
import { defaultPreferences, preferencesKey } from '../src/lib/preferences.ts';

test('deleting saved data clears both activities and retains only preferences and unrelated data', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(({ quizKey, quiz, keys, preferencesKey, preferences }) => {
    localStorage.setItem(quizKey, JSON.stringify(quiz));
    localStorage.setItem(keys.session, JSON.stringify({ version: 2, questionOrder: quiz.questionOrder, answers: {}, currentIndex: 0, language: 'en', completed: false }));
    localStorage.setItem(keys.current, '{}');
    localStorage.setItem(keys.previous, '{}');
    localStorage.setItem(keys.language, '"en"');
    localStorage.setItem(preferencesKey, JSON.stringify(preferences));
    localStorage.setItem('unrelated-app', 'keep');
  }, { quizKey, quiz: createQuiz('en'), keys, preferencesKey, preferences: defaultPreferences });
  await page.reload();
  await page.getByRole('button', { name: 'Delete Saved Data', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(() => Object.keys(localStorage).sort())).toEqual([keys.language, preferencesKey, 'unrelated-app'].sort());
  await page.getByRole('button', { name: 'Attributes Quiz', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Take the Quiz' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Continue Test' })).toHaveCount(0);
  // A quiz-only attempt must also expose deletion, including a queued answer write.
  await page.getByRole('button', { name: 'Attributes Quiz', exact: true }).click();
  await page.getByRole('button', { name: 'Take the Quiz' }).click();
  await page.evaluate(() => navigator.locks.request('attributes-quiz-data', () => {}));
  await page.evaluate(() => new Promise<void>(ready => {
    void navigator.locks.request('attributes-quiz-data', () => new Promise<void>(release => {
      Object.assign(window, { releaseAuditLock: release }); ready();
    }));
  }));
  await page.getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Delete Saved Data', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await page.evaluate(() => (window as unknown as { releaseAuditLock: () => void }).releaseAuditLock());
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await page.evaluate(k => localStorage.getItem(k), quizKey)).toBeNull();
});

test('corrupt storage and XSS payloads are ignored without execution or a blank screen', async ({ page }) => {
  const errors: string[] = [];
  const dialogs: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await page.goto('/');
  const quiz = createQuiz('en');
  const session = { version: 2, questionOrder: quiz.questionOrder, answers: {}, currentIndex: 0, language: 'en', completed: false };
  for (const raw of ['invalid JSON', '{}', '[]', JSON.stringify({ ...session, version: -1 }),
    JSON.stringify({ ...session, currentIndex: '0' }), JSON.stringify({ ...session, answers: { 55: 'agree' } }),
    ...["<script>alert('XSS')</script>", "<img src=x onerror=alert('XSS')>"].map(payload => JSON.stringify({ ...session, answers: { 1: payload } }))]) {
    await page.evaluate(({ raw, storageKeys }) => {
      for (const key of storageKeys) localStorage.setItem(key, raw);
    }, { raw, storageKeys: [...Object.values(keys), quizKey, preferencesKey] });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Start Test', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue Test' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Attributes Quiz', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Take the Quiz' })).toBeVisible();
  }
  expect(errors).toEqual([]);
  expect(dialogs).toEqual([]);
});
