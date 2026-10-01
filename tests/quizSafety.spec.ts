import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createQuiz, quizKey } from '../src/lib/attributesQuiz.ts';
import { questions } from '../src/data/questions.ts';
const settle = (page: Page) => page.evaluate(() => navigator.locks.request('attributes-quiz-data', () => {}));
async function openQuiz(page: Page) {
  await page.getByRole('button', { name: 'Attributes Quiz', exact: true }).click();
}

test('no answer feedback before submission, forced incomplete submission fails, and boundaries hold', async ({ page }) => {
  await page.goto('/'); await openQuiz(page);
  await page.getByRole('button', { name: 'Take the Quiz' }).click();
  await expect(page.locator('#quiz-position')).toHaveText('Question 1 of 54');
  await page.keyboard.press('Enter'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#quiz-position')).toHaveText('Question 1 of 54');
  await expect(page.locator('.quiz-score, .quiz-correction, .quiz-review')).toHaveCount(0);
  await expect(page.getByText(/Original question/)).toHaveCount(0);
  await page.keyboard.press('1'); await expect(page.getByRole('radio').first()).toBeChecked();
  await page.getByRole('button', { name: 'Review answers', exact: true }).click();
  const submit = page.getByRole('button', { name: 'Submit Quiz', exact: true });
  await expect(submit).toBeDisabled();
  await submit.evaluate((node: HTMLButtonElement) => { node.disabled = false; node.click(); });
  await expect(page.locator('.quiz-score, .quiz-correction')).toHaveCount(0);
  await page.locator('.results-menu summary').click();
  await page.getByRole('button', { name: 'Attributes Quiz Results', exact: true }).click();
  await expect(page.getByText('Complete the attributes quiz to see your results here.')).toBeVisible();
  await expect(page.locator('.quiz-review')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue Quiz' }).click();
  await settle(page);
  const before = await page.evaluate(k => localStorage.getItem(k), quizKey);
  await page.getByRole('button', { name: 'Appearance & accessibility', exact: true }).click();
  await page.keyboard.press('5'); await page.keyboard.press('Enter'); await page.keyboard.press('Escape');
  await settle(page);
  expect(await page.evaluate(k => localStorage.getItem(k), quizKey)).toBe(before);
});

test('blocked storage retains in-memory answers across app tabs and results navigation', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } }));
  await page.goto('/'); await openQuiz(page);
  await page.getByRole('button', { name: 'Take the Quiz' }).click();
  await page.keyboard.press('3'); await expect(page.getByRole('radio').nth(2)).toBeChecked();
  const statement = await page.locator('[data-page-heading]').textContent();
  await page.getByRole('button', { name: 'GET2 Test', exact: true }).click();
  await openQuiz(page); await page.getByRole('button', { name: 'Continue Quiz' }).click();
  await expect(page.getByRole('radio').nth(2)).toBeChecked();
  await expect(page.locator('[data-page-heading]')).toHaveText(statement!);
  await page.locator('.results-menu summary').click();
  await page.getByRole('button', { name: 'Attributes Quiz Results', exact: true }).click();
  await page.getByRole('button', { name: 'Continue Quiz' }).click();
  await expect(page.getByRole('radio').nth(2)).toBeChecked();
});

test('stale tabs cannot overwrite submitted answers or restore deleted quiz data', async ({ page, context }) => {
  await page.goto('/');
  const s = createQuiz('en'); s.answers = Object.fromEntries(questions.map(q => [q.id, q.category]));
  await page.evaluate(({key, s}) => localStorage.setItem(key, JSON.stringify(s)), {key: quizKey, s});
  await page.reload(); await openQuiz(page); await page.getByRole('button', { name: 'Continue Quiz' }).click();
  const stale = await context.newPage();
  // Simulate a suspended tab that has not received storage/focus updates.
  await stale.addInitScript(() => {
    window.addEventListener('storage', event => event.stopImmediatePropagation());
    window.addEventListener('focus', event => event.stopImmediatePropagation());
  });
  await stale.goto('/'); await openQuiz(stale); await stale.getByRole('button', { name: 'Continue Quiz' }).click();
  await page.getByRole('button', { name: 'Review answers', exact: true }).click();
  await page.getByRole('button', { name: 'Submit Quiz' }).click();
  await expect(page.locator('.quiz-score')).toContainText('54 / 54');
  await settle(page);
  const completed = await page.evaluate(k => localStorage.getItem(k), quizKey);
  await stale.getByRole('radio').first().click(); await settle(stale);
  expect(await page.evaluate(k => localStorage.getItem(k), quizKey)).toBe(completed);
  await expect(stale.getByText('Quiz data changed in another tab. The latest saved progress has been loaded.')).toBeVisible();
  await page.getByRole('button', { name: 'Retake Quiz' }).click(); await settle(page);
  await stale.reload(); await openQuiz(stale); await stale.getByRole('button', { name: 'Continue Quiz' }).click();
  await page.evaluate(k => localStorage.removeItem(k), quizKey);
  await stale.getByRole('radio').first().click(); await settle(stale);
  expect(await page.evaluate(k => localStorage.getItem(k), quizKey)).toBeNull();
  await expect(stale.getByRole('button', { name: 'Take the Quiz' })).toBeVisible();
});

test('corrupt stored content does not execute or reveal results and can be replaced with a fresh quiz', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const s = createQuiz('en');
  await page.evaluate(({key, s}) => localStorage.setItem(key, JSON.stringify({...s, completed: true, answers: {'1': '<img src=x onerror=alert(1)>'}})), {key: quizKey, s});
  await page.reload(); await page.locator('.results-menu summary').click();
  await page.getByRole('button', { name: 'Attributes Quiz Results', exact: true }).click();
  await expect(page.locator('.quiz-score, .quiz-correction')).toHaveCount(0);
  await openQuiz(page); await page.getByRole('button', { name: 'Take the Quiz' }).click();
  await expect(page.getByRole('radio')).toHaveCount(5);
  expect(errors).toEqual([]);
});

test('simultaneous quiz writes cannot overwrite the winning tab and rapid local input is retained', async ({ page, context }) => {
  await page.goto('/'); await openQuiz(page); await page.getByRole('button', { name: 'Take the Quiz' }).click();
  await settle(page);
  const other = await context.newPage(); await other.goto('/'); await openQuiz(other);
  await other.getByRole('button', { name: 'Continue Quiz' }).click();
  await page.evaluate(() => new Promise<void>(ready => {
    void navigator.locks.request('attributes-quiz-data', () => new Promise<void>(release => {
      Object.assign(window, { releaseQuizLock: release }); ready();
    }));
  }));
  const winning = await page.getByRole('radio').first().getAttribute('value');
  await page.getByRole('radio').first().click();
  await other.getByRole('radio').nth(1).click();
  await page.evaluate(() => (window as unknown as { releaseQuizLock: () => void }).releaseQuizLock());
  await settle(page); await settle(other);
  const stored = await page.evaluate(k => JSON.parse(localStorage.getItem(k)!), quizKey);
  expect(stored.answers).toEqual({ [stored.questionOrder[0]]: winning });
  await expect(other.getByRole('button', { name: 'Continue Quiz' })).toBeVisible();
  await other.close();
  // Consecutive edits in one tab should remain responsive while writes queue.
  await page.locator('[data-page-heading]').focus();
  await page.keyboard.press('2'); await page.keyboard.press('5'); await page.keyboard.press('Enter');
  await expect(page.locator('#quiz-position')).toHaveText('Question 2 of 54');
  await settle(page);
  const updated = await page.evaluate(k => JSON.parse(localStorage.getItem(k)!), quizKey);
  expect(updated.answers[updated.questionOrder[0]]).toBe(updated.optionOrder[updated.questionOrder[0]][4]);
  expect(updated.currentIndex).toBe(1);
});
