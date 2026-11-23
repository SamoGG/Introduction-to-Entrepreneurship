import { test, expect } from '@playwright/test';
import { questions } from '../src/data/questions.ts';
import { calculateResult } from '../src/lib/scoring.ts';
import type { Answers } from '../src/lib/scoring.ts';
import { translations } from '../src/i18n/translations.ts';

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

for (const binaryAnswers of [true, false]) {
  for (const action of ['restart', 'new', 'retake-results', 'retake-welcome'] as const) {
    test(`${action} can switch from ${binaryAnswers ? 'binary' : 'three-response'} mode without changing data on cancel`, async ({ page }) => {
      const t = translations.en;
      const completed = action.startsWith('retake');
      const answers: Answers = completed ? Object.fromEntries(questions.map(q => [q.id, 'agree'])) : { 1: 'agree' };
      const previous = calculateResult(Object.fromEntries(questions.map(q => [q.id, 'disagree'])));
      const current = completed ? calculateResult(answers) : null;
      await page.goto('/');
      await page.evaluate(({ binaryAnswers, answers, completed, previous, current, order }) => {
        localStorage.setItem('get2-language', JSON.stringify('en'));
        localStorage.setItem('get2-active-session', JSON.stringify({ version: 2, questionOrder: order, answers, currentIndex: 0, language: 'en', completed, binaryAnswers }));
        localStorage.setItem('get2-previous-result', JSON.stringify(previous));
        if (current) localStorage.setItem('get2-current-result', JSON.stringify(current));
      }, { binaryAnswers, answers, completed, previous, current, order: questions.map(q => q.id) });
      await page.reload();
      if (action === 'restart') await page.getByRole('button', { name: t.continue, exact: true }).click();
      if (action === 'retake-results') await page.getByRole('button', { name: t.viewResults, exact: true }).click();
      const snapshot = () => page.evaluate(() => ['get2-active-session', 'get2-current-result', 'get2-previous-result'].map(key => localStorage.getItem(key)));
      const before = await snapshot();
      const trigger = page.getByRole('button', { name: action === 'restart' ? t.restart : action === 'new' ? t.newTest : t.retake, exact: true });
      await trigger.click();
      const dialog = page.getByRole('dialog');
      const mode = dialog.getByRole('checkbox', { name: t.binaryAnswers, exact: true });
      await expect(mode).toBeEnabled();
      await expect(mode).toBeChecked({ checked: binaryAnswers });
      await mode.setChecked(!binaryAnswers);
      await dialog.getByRole('button', { name: t.cancelAction, exact: true }).click();
      expect(await snapshot()).toEqual(before);
      await trigger.click();
      await expect(mode).toBeChecked({ checked: binaryAnswers });
      await mode.setChecked(!binaryAnswers);
      await dialog.getByRole('button', { name: completed ? t.start : t.confirmRestart, exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(page.getByRole('radio')).toHaveCount(binaryAnswers ? 3 : 2);
      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('get2-active-session')!))).toMatchObject({ binaryAnswers: !binaryAnswers, answers: {}, currentIndex: 0, completed: false });
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('get2-previous-result')!))).toEqual(current ?? previous);
      await page.reload();
      const welcomeMode = page.getByRole('checkbox', { name: t.binaryAnswers, exact: true });
      await expect(welcomeMode).toBeChecked({ checked: !binaryAnswers });
      await expect(welcomeMode).toBeDisabled();
      await page.getByRole('button', { name: t.continue, exact: true }).click();
      await expect(page.getByRole('radio')).toHaveCount(binaryAnswers ? 3 : 2);
    });
  }
}
