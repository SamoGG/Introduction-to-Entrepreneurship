import { test, expect } from '@playwright/test';
import { questions } from '../src/data/questions.ts';
import { translations } from '../src/i18n/translations.ts';
import type { QuizSession } from '../src/lib/attributesQuiz.ts';
const key = 'attributes-quiz-session';
test('quiz learning, keyboard, persistence, language, results and isolated retake', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await page.getByRole('radio').first().click();
  await expect(page.getByRole('radio').first()).toBeChecked();
  await page.getByRole('button', { name: 'Attributes Quiz', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Understanding the Five Entrepreneurial Attributes' })).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(0);
  const get2 = await page.evaluate(() => localStorage.getItem('get2-active-session'));
  await page.getByRole('button', { name: 'Take the Quiz', exact: true }).click();
  await expect(page.getByRole('radio')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await page.getByRole('radio').first().focus(); await page.keyboard.press('Space'); await page.keyboard.press('Enter');
  await expect(page.locator('#quiz-position')).toContainText('2 of 54');
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  const state = await page.evaluate(k => JSON.parse(localStorage.getItem(k)!) as QuizSession, key);
  await page.reload(); await page.getByRole('button', { name: 'Attributes Quiz', exact: true }).click(); await page.getByRole('button', { name: 'Continue Quiz' }).click();
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)!), key)).toEqual(state);
  await expect(page.getByRole('radio').first()).toBeChecked();
  await page.getByRole('button', { name: 'Ελληνικά', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Με ποιο επιχειρηματικό χαρακτηριστικό σχετίζεται αυτή η δήλωση;' })).toBeVisible();
  const greek = await page.evaluate(k => JSON.parse(localStorage.getItem(k)!), key);
  expect(greek).toEqual({ ...state, language: 'el' });
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Review answers', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Submit Quiz' })).toBeDisabled();
  await page.getByRole('button', { name: /^Question 1:/ }).click();
  for (let i = 0; i < 54; i++) {
    const question = questions.find(q => q.id === state.questionOrder[i])!;
    // Two deliberately wrong answers exercise post-submission corrections.
    const category = i < 2 ? question.category === 'risk' ? 'achievement' : 'risk' : question.category;
    await page.getByRole('radio', { name: translations.en[category], exact: true }).check();
    await page.getByRole('button', { name: i === 53 ? 'Review answers' : 'Next', exact: true }).last().click();
  }
  await page.getByRole('button', { name: 'Submit Quiz' }).click();
  await expect(page.locator('.quiz-score')).toContainText('52 / 54');
  await page.getByText('Review Incorrect Answers (2)', { exact: true }).click();
  await expect(page.locator('.quiz-correction')).toHaveCount(2);
  await page.getByRole('button', { name: 'Retake Quiz', exact: true }).click();
  const retake = await page.evaluate(k => JSON.parse(localStorage.getItem(k)!), key);
  expect(retake.answers).toEqual({}); expect(retake.currentIndex).toBe(0);
  expect(retake.questionOrder).not.toEqual(state.questionOrder); expect(retake.optionOrder).not.toEqual(state.optionOrder);
  // Language changes are existing GET2 behavior; quiz interactions must not alter its answers or order.
  const after = await page.evaluate(() => localStorage.getItem('get2-active-session'));
  expect(after).toBe(get2);
});

test('Greek quiz fits mobile, dark, high contrast and larger text; native keyboard radios', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Ελληνικά', exact: true }).click();
  await page.getByRole('button', { name: 'Κουίζ Χαρακτηριστικών', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(() => { const d = document.documentElement.dataset; d.theme = 'dark'; d.highContrast = 'true'; d.largerText = 'true'; d.reduceMotion = 'true'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Ξεκίνα το Κουίζ' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('radio').first().focus(); await page.keyboard.press('Space'); await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio').nth(1)).toBeChecked();
  await page.keyboard.press('Enter'); await expect(page.locator('#quiz-position')).toContainText('2');
});
