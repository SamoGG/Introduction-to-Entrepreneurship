import { test, expect } from '@playwright/test';
import { questions } from '../src/data/questions.ts';

test('French binary test persists its mode, excludes unknown shortcuts and translates the quiz', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Français', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Uniquement D’accord / Pas d’accord' }).check();
  await page.getByRole('button', { name: 'Commencer le test', exact: true }).click();
  await expect(page.getByRole('radio')).toHaveCount(2);
  await page.keyboard.press('3');
  await expect(page.getByRole('button', { name: 'Suivant', exact: true })).toBeDisabled();
  const agree = page.getByRole('radio', { name: 'D’accord', exact: true });
  // GET2 updates controlled radios after acquiring its asynchronous storage lock.
  // check() verifies immediately after clicking; wait for the committed state instead.
  await agree.click();
  await expect(agree).toBeChecked();
  await expect.poll(() => page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem('get2-active-session')!);
    return { binaryAnswers: session.binaryAnswers, answer: session.answers[session.questionOrder[0]] };
  })).toEqual({ binaryAnswers: true, answer: 'agree' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('checkbox', { name: 'Uniquement D’accord / Pas d’accord' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Uniquement D’accord / Pas d’accord' })).toBeDisabled();
  await page.getByRole('button', { name: 'Continuer le test', exact: true }).click();
  await expect(page.getByRole('radio')).toHaveCount(2);
  await expect(agree).toBeChecked();
  const id = await page.evaluate(() => JSON.parse(localStorage.getItem('get2-active-session')!).questionOrder[0]);
  await expect(page.locator('#question-text')).toHaveText(questions.find(q => q.id === id)!.french);
  await page.getByRole('button', { name: 'Revoir les réponses', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Je ne sais pas', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Quiz des caractéristiques', exact: true }).click();
  await page.getByRole('button', { name: 'Commencer le quiz', exact: true }).click();
  await expect(page.getByRole('radio')).toHaveCount(5);
  expect(questions.map(q => q.french)).toContain(await page.getByRole('heading', { level: 1 }).textContent());
});

test('default GET2 mode still offers all three responses', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await expect(page.getByRole('radio')).toHaveCount(3);
  await page.keyboard.press('3');
  await expect(page.getByRole('radio', { name: 'I don’t know', exact: true })).toBeChecked();
});
