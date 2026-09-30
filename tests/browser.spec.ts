import { test, expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { calculateResult } from '../src/lib/scoring.ts';
import type { Answer, Answers } from '../src/lib/scoring.ts';
import type { TestSession } from '../src/lib/storage.ts';
import { questions } from '../src/data/questions.ts';

const browserErrors = new WeakMap<BrowserContext, string[]>();
test.beforeEach(async ({ context }) => {
  const errors: string[] = [];
  browserErrors.set(context, errors);
  const observe = (page: Page) => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  };
  context.pages().forEach(observe);
  context.on('page', observe);
});
test.afterEach(async ({ context }) => {
  expect(browserErrors.get(context)).toEqual([]);
});

const sessionKey = 'get2-active-session';
const currentKey = 'get2-current-result';
const previousKey = 'get2-previous-result';
const winning = (id: number): Answer => id % 2 === 0 ? 'agree' : 'disagree';
const losing = (id: number): Answer => id % 2 === 0 ? 'disagree' : 'agree';
const readSession = (page: Page): Promise<TestSession> => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), sessionKey);

async function seed(page: Page, answers: Answers, completed = false, language = 'en') {
  await page.goto('/');
  const session = { version: 2, questionOrder: questions.map(q => q.id).reverse(), answers, currentIndex: 0, language, completed };
  const result = completed ? calculateResult(answers) : null;
  await page.evaluate(({ session, result }) => {
    localStorage.setItem('get2-active-session', JSON.stringify(session));
    localStorage.setItem('get2-language', JSON.stringify(session.language));
    if (result) localStorage.setItem('get2-current-result', JSON.stringify(result));
  }, { session, result });
  await page.reload();
  if (completed) await page.getByRole('button', { name: language === 'el' ? 'Προβολή Αποτελεσμάτων' : 'View Results', exact: true }).click();
}

test('welcome, keyboard, EN/EL, persistence, review navigation and restart', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Entrepreneurial Tendency Test');
  await page.screenshot({ path: 'test-results/welcome-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  const initial = await readSession(page);
  const firstQuestion = questions.find(question => question.id === initial.questionOrder[0])!;
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(firstQuestion.english);
  expect(initial.questionOrder).toHaveLength(54);
  expect(new Set(initial.questionOrder).size).toBe(54);
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await page.keyboard.press('ArrowRight');
  expect((await readSession(page)).currentIndex).toBe(0);
  await page.keyboard.press('1');
  await expect(page.getByRole('radio', { name: 'Agree', exact: true })).toBeChecked();
  expect((await readSession(page)).answers[initial.questionOrder[0]]).toBe('agree');
  expect((await readSession(page)).currentIndex).toBe(0);
  await page.keyboard.press('Enter');
  expect((await readSession(page)).currentIndex).toBe(1);
  await page.keyboard.press('3');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('radio', { name: 'Agree', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Ελληνικά' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'el');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(firstQuestion.greek);
  await expect(page.getByRole('radio', { name: 'Συμφωνώ' })).toBeChecked();
  const greek = await readSession(page);
  expect(greek.questionOrder).toEqual(initial.questionOrder);
  await page.reload();
  await page.getByRole('button', { name: 'Συνέχεια Τεστ', exact: true }).click();
  expect(await readSession(page)).toEqual(greek);
  await page.getByRole('button', { name: 'Επισκόπηση απαντήσεων' }).click();
  await expect(page.locator('.question-grid button')).toHaveCount(54);
  await expect(page.getByRole('button', { name: 'Υπολογισμός Αποτελεσμάτων' })).toBeDisabled();
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('button', { name: 'Question 2: I don’t know', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'I don’t know' })).toBeChecked();
  await page.getByRole('radio', { name: 'Disagree' }).check();
  await page.getByRole('button', { name: 'Back to Review' }).last().click();
  await expect(page.getByRole('button', { name: 'Question 2: Disagree', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Restart Test', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  expect((await readSession(page)).questionOrder).toEqual(initial.questionOrder);
  await page.getByRole('button', { name: 'Restart Test', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Restart Test' }).click();
  const restarted = await readSession(page);
  expect(restarted.questionOrder).not.toEqual(initial.questionOrder);
  expect(restarted.answers).toEqual({});
  expect(restarted.currentIndex).toBe(0);
  expect(errors).toEqual([]);
});

test('complete questionnaire, coverage-weighted results, copy, print, retake and comparison', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  const first = await readSession(page);
  for (let index = 0; index < 54; index++) {
    const id = first.questionOrder[index];
    const answer = id <= 30 ? winning(id) : id <= 40 ? losing(id) : 'unknown';
    await page.getByRole('radio', { name: answer === 'agree' ? 'Agree' : answer === 'disagree' ? 'Disagree' : 'I don’t know', exact: true }).check();
    await page.getByRole('button', { name: index === 53 ? 'Review answers' : 'Next', exact: true }).last().click();
  }
  await expect(page.getByRole('button', { name: 'Calculate Results' })).toBeEnabled();
  await page.getByRole('button', { name: 'Calculate Results' }).click();
  await expect(page.locator('.overall-score')).toHaveText('30/ 54');
  await expect(page.locator('.overall-main .classification')).toHaveText('Medium');
  await expect(page.locator('.coverage-heading strong')).toHaveText('74%');
  await expect(page.locator('.dimension-card')).toHaveCount(5);
  await expect(page.locator('.overall-coverage')).toContainText('reduced response coverage');
  expect(await page.locator('details[open]').count()).toBe(0);
  await page.locator('.overall-calculation summary').click();
  await expect(page.locator('.overall-calculation')).toContainText('40 / 54 = 74.1%');
  await page.getByRole('button', { name: 'Copy Results', exact: true }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('Overall\n30 / 54 — Medium');
  expect(copied).toContain('Response coverage: 74%');
  await page.getByRole('button', { name: 'Ελληνικά' }).click();
  await expect(page.locator('.overall-score')).toHaveText('30/ 54');
  await page.getByRole('button', { name: 'Αντιγραφή Αποτελεσμάτων', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Συνολικά\n30 / 54 — Μέτρια');
  await page.getByRole('button', { name: 'English' }).click();
  await page.evaluate(() => { window.print = () => { document.body.dataset.printed = 'yes'; }; });
  await page.getByRole('button', { name: 'Download Results', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-printed', 'yes');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.locator('.result-actions')).toBeHidden();
  await expect(page.locator('.result-date')).toBeVisible();
  await expect(page.locator('.dimension-card')).toHaveCount(5);
  await page.pdf({ path: 'test-results/results.pdf', format: 'A4' });
  await page.emulateMedia({ media: 'screen' });
  await page.screenshot({ path: 'test-results/results-desktop.png', fullPage: true });
  await page.reload();
  await expect(page.getByRole('button', { name: 'View Results', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View Results', exact: true }).click();
  await expect(page.locator('.overall-score')).toHaveText('30/ 54');
  await page.getByRole('button', { name: 'Take Test Again' }).click();
  const retake = await readSession(page);
  expect(retake.questionOrder).not.toEqual(first.questionOrder);
  expect(retake.answers).toEqual({});
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).overall.finalScore, previousKey)).toBe(30);
  // A restart during a retake must preserve the last completed comparison.
  await page.getByRole('button', { name: 'Restart Test', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Restart Test' }).click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).overall.finalScore, previousKey)).toBe(30);
  const second = await readSession(page);
  for (let index = 0; index < 54; index++) {
    await page.getByRole('radio', { name: winning(second.questionOrder[index]) === 'agree' ? 'Agree' : 'Disagree', exact: true }).check();
    await page.getByRole('button', { name: index === 53 ? 'Review answers' : 'Next', exact: true }).last().click();
  }
  await page.getByRole('button', { name: 'Calculate Results' }).click();
  await expect(page.locator('.overall-score')).toHaveText('54/ 54');
  await page.locator('.comparison summary').click();
  await expect(page.locator('.comparison tbody tr').first()).toContainText('+24');
  expect(await page.evaluate(() => Object.keys(localStorage).sort())).toEqual(['get2-active-session', 'get2-current-result', 'get2-language', 'get2-previous-result']);
  await page.getByRole('button', { name: 'Take Test Again' }).click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).overall.finalScore, previousKey)).toBe(54);
  expect(await page.evaluate(key => localStorage.getItem(key), currentKey)).toBeNull();
});

test('all unknowns finish with N/A, zero coverage, safe calculations and copy fallback', async ({ page }) => {
  await seed(page, Object.fromEntries(questions.map(q => [q.id, 'unknown'])));
  await page.getByRole('button', { name: 'Continue Test' }).click();
  await page.getByRole('button', { name: 'Review answers', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Calculate Results' })).toBeEnabled();
  await page.getByRole('button', { name: 'Calculate Results' }).click();
  await expect(page.locator('.overall-score')).toHaveText('0/ 54');
  await expect(page.locator('.coverage-heading strong')).toHaveText('0%');
  await expect(page.locator('.dimension-score strong')).toHaveText(['0', '0', '0', '0', '0']);
  for (const summary of await page.locator('.calculation summary').all()) await summary.click();
  await expect(page.locator('body')).not.toContainText('NaN');
  await expect(page.locator('body')).not.toContainText('Infinity');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('Denied')) }, configurable: true }));
  await page.getByRole('button', { name: 'Copy Results' }).click();
  await expect(page.getByRole('textbox', { name: 'Result summary' })).toContainText('Overall\n0 / 54 — N/A');
});

test('mobile layouts in both languages fit 320px and 390px screens', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const language of ['en', 'el']) {
      await page.goto('/');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.getByRole('button', { name: language === 'en' ? 'English' : 'Ελληνικά' }).click();
      await expectFits(page);
      if (width === 390 && language === 'en') await page.screenshot({ path: 'test-results/welcome-mobile.png', fullPage: true });
      await page.getByRole('button', { name: language === 'en' ? 'Start Test' : 'Έναρξη Τεστ', exact: true }).click();
      await expectFits(page);
      await page.getByRole('button', { name: language === 'en' ? 'Review answers' : 'Επισκόπηση απαντήσεων', exact: true }).first().click();
      await expectFits(page);
      const answers = Object.fromEntries(questions.map(q => [q.id, q.id % 3 === 0 ? 'unknown' : winning(q.id)]));
      await seed(page, answers, true, language);
      await expectFits(page);
      for (const summary of await page.locator('.calculation summary').all()) await summary.click();
      await expectFits(page);
      if (width === 390 && language === 'el') await page.screenshot({ path: 'test-results/results-mobile-greek.png', fullPage: true });
    }
  }
});

async function expectFits(page: Page) {
  const layout = await page.evaluate(() => ({
    width: window.innerWidth, scroll: document.documentElement.scrollWidth,
    overflowing: [...document.querySelectorAll('body *')].filter(node => node.getBoundingClientRect().right > window.innerWidth + 1).map(node => ({ tag: node.tagName, class: node.className, right: node.getBoundingClientRect().right })).slice(0, 10),
  }));
  expect(layout.scroll, JSON.stringify(layout)).toBeLessThanOrEqual(layout.width);
}

test('corrupt local data and blocked storage do not crash the application', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('get2-active-session', '{bad json');
    localStorage.setItem('get2-current-result', '{"version":1}');
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Start Test', exact: true })).toBeVisible();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Denied', 'SecurityError'); }; });
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('could not save');
  await page.getByRole('radio', { name: 'Agree', exact: true }).check();
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
});

test('first-visit language, saved preferences, modal focus and safe deletion', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'el-GR', colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'el');
  expect(await page.locator('html').evaluate(node => getComputedStyle(node).colorScheme)).toBe('dark');
  await page.getByRole('button', { name: 'English' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const preferencesButton = page.getByRole('button', { name: 'Appearance & accessibility' });
  await preferencesButton.click();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
  await modal.getByRole('radio', { name: 'Light', exact: true }).check();
  await modal.getByRole('checkbox', { name: 'Larger text' }).check();
  await modal.getByRole('checkbox', { name: 'High contrast' }).check();
  await modal.getByRole('checkbox', { name: 'Reduce motion' }).check();
  await page.keyboard.press('Escape');
  await expect(preferencesButton).toBeFocused();
  expect(await page.locator('html').evaluate(node => getComputedStyle(node).colorScheme)).toBe('light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-larger-text', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await page.keyboard.press('Enter');
  expect((await readSession(page)).currentIndex).toBe(0);
  await page.keyboard.press('1');
  await expect(page.locator('.answer-feedback')).toHaveText('Answer saved');
  await page.keyboard.press('2');
  await expect(page.locator('.answer-feedback')).toHaveText('Answer updated');
  await page.keyboard.press('Enter');
  expect((await readSession(page)).currentIndex).toBe(1);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  // Keys on an unrelated button do not change an answer or advance.
  await page.getByRole('button', { name: 'English' }).focus();
  await page.keyboard.press('3');
  expect(Object.keys((await readSession(page)).answers)).toHaveLength(1);
  await page.getByRole('button', { name: 'Delete Saved Data' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('get2-active-session'))).not.toBeNull();
  await page.getByRole('button', { name: 'Delete Saved Data' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start Test', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Saved test data deleted.');
  expect(await page.evaluate(() => Object.keys(localStorage).sort())).toEqual(['get2-language', 'get2-preferences']);
  await expect(page.getByRole('button', { name: 'Delete Saved Data' })).toHaveCount(0);
  await context.close();
});

test('review filters retain display numbering and Enter returns to review', async ({ page }) => {
  await seed(page, { 54: 'unknown', 53: 'agree' });
  await page.getByRole('button', { name: 'Continue Test' }).click();
  await page.getByRole('button', { name: 'Review answers', exact: true }).click();
  const filters = page.getByRole('group', { name: 'Filter questions' });
  await filters.getByRole('button', { name: 'I don’t know 1' }).click();
  await expect(page.locator('.question-grid button')).toHaveCount(1);
  await page.getByRole('button', { name: 'Question 1: I don’t know' }).click();
  await page.getByRole('radio', { name: 'Agree', exact: true }).check();
  await page.keyboard.press('Enter');
  await expect(page.locator('.empty-filter')).toBeVisible();
  await filters.getByRole('button', { name: 'Unanswered 52' }).click();
  await expect(page.locator('.question-grid button')).toHaveCount(52);
  await expect(page.locator('.question-grid button').first()).toHaveAttribute('aria-label', 'Question 3: Unanswered');
  await filters.getByRole('button', { name: 'All 54' }).click();
  await expect(page.locator('.question-grid button')).toHaveCount(54);
});

test('profile, white printing in dark mode, and Retake preserves preferences', async ({ page }) => {
  const answers = Object.fromEntries(questions.map(q => [q.id, winning(q.id)]));
  await seed(page, answers, true);
  await page.getByRole('button', { name: 'Appearance & accessibility' }).click();
  await page.getByRole('radio', { name: 'Dark', exact: true }).check();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('img', { name: /Your profile at a glance:/ })).toBeVisible();
  await expect(page.locator('.profile-summary')).toContainText('similar percentages');
  await page.screenshot({ path: 'test-results/results-dark.png', fullPage: true });
  await page.emulateMedia({ media: 'print' });
  expect(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(255, 255, 255)');
  await expect(page.locator('.profile-panel')).toBeVisible();
  await expect(page.locator('.footer-links')).toBeHidden();
  await page.pdf({ path: 'test-results/profile-print.pdf', format: 'A4' });
  await page.emulateMedia({ media: 'screen' });
  await expect(page.getByRole('button', { name: 'Delete Saved Data' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Take Test Again', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('get2-current-result'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('get2-previous-result'))).not.toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('get2-active-session'))).not.toBeNull();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});

test('requested widths, themes, large Greek text and 200 percent zoom remain usable', async ({ page }) => {
  await seed(page, Object.fromEntries(questions.map(q => [q.id, q.id % 5 === 0 ? 'unknown' : winning(q.id)])), true, 'el');
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.getByRole('button', { name: 'Εμφάνιση και προσβασιμότητα' }).click();
      await page.getByRole('radio', { name: theme === 'light' ? 'Φωτεινό' : 'Σκοτεινό', exact: true }).check();
      await page.getByRole('checkbox', { name: 'Μεγαλύτερο κείμενο' }).check();
      await page.getByRole('checkbox', { name: 'Υψηλή αντίθεση' }).check();
      await expectFits(page);
      await page.keyboard.press('Escape');
      await expectFits(page);
    }
  }
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await expectFits(page);
  await page.evaluate(() => { document.documentElement.style.zoom = ''; });
  await page.getByRole('button', { name: 'Επανάληψη Τεστ' }).click();
  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole('radio', { name: 'Συμφωνώ', exact: true }).check();
  await expectFits(page);
  const navigation = page.locator('.question-navigation');
  expect(await navigation.evaluate(node => getComputedStyle(node).position)).toBe('sticky');
  for (const radio of await page.locator('.answer-option').all()) {
    const bounds = await radio.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
  }
  await page.screenshot({ path: 'test-results/question-mobile-accessible.png', fullPage: true });
});


test('reopening always starts at welcome and preserves unfinished answers and completed results', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Start Test', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await page.keyboard.press('1');
  await page.keyboard.press('Enter');
  await page.keyboard.press('3');
  const saved = await readSession(page);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('/');
  await expect(reopened.getByRole('button', { name: 'Continue Test', exact: true })).toBeVisible();
  await expect(reopened.locator('#question-text')).toHaveCount(0);
  expect(await readSession(reopened)).toEqual(saved);
  await reopened.getByRole('button', { name: 'Continue Test', exact: true }).click();
  await expect(reopened.getByRole('radio', { name: 'I don’t know', exact: true })).toBeChecked();
  await reopened.getByRole('radio', { name: 'Disagree', exact: true }).check();
  const updated = await readSession(reopened);
  await reopened.reload();
  await expect(reopened.getByRole('button', { name: 'Continue Test', exact: true })).toBeVisible();
  expect(await readSession(reopened)).toEqual(updated);
  await reopened.getByRole('button', { name: 'Continue Test', exact: true }).click();
  await expect(reopened.getByRole('radio', { name: 'Disagree', exact: true })).toBeChecked();
  await seed(reopened, Object.fromEntries(questions.map(q => [q.id, winning(q.id)])), true, 'el');
  const completed = await readSession(reopened);
  const result = await reopened.evaluate(key => localStorage.getItem(key), currentKey);
  await reopened.close();
  const returning = await context.newPage();
  await returning.goto('/');
  await expect(returning.getByRole('button', { name: 'Προβολή Αποτελεσμάτων', exact: true })).toBeVisible();
  await expect(returning.getByRole('button', { name: 'Επανάληψη Τεστ', exact: true })).toBeVisible();
  await expect(returning.locator('.overall-score')).toHaveCount(0);
  expect(await readSession(returning)).toEqual(completed);
  expect(await returning.evaluate(key => localStorage.getItem(key), currentKey)).toBe(result);
  await returning.getByRole('button', { name: 'Προβολή Αποτελεσμάτων', exact: true }).click();
  await expect(returning.locator('.overall-score')).toHaveText('54/ 54');
  await returning.reload();
  await expect(returning.getByRole('button', { name: 'Προβολή Αποτελεσμάτων', exact: true })).toBeVisible();
});

test('printing failures remain recoverable in both languages', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await seed(page, Object.fromEntries(questions.map(q => [q.id, winning(q.id)])), true);
  await page.evaluate(() => { window.print = () => { throw new Error('Unavailable'); }; });
  await page.getByRole('button', { name: 'Download Results', exact: true }).click();
  await expect(page.locator('.print-status')).toContainText('Printing is unavailable');
  await expect(page.getByRole('status')).toContainText('Printing is unavailable');
  await page.getByRole('button', { name: 'Ελληνικά' }).click();
  await expect(page.locator('.print-status')).toContainText('Η εκτύπωση δεν είναι διαθέσιμη');
  await expect(page.locator('.overall-score')).toHaveText('54/ 54');
  await page.evaluate(() => { window.print = () => {}; });
  await page.getByRole('button', { name: 'Λήψη Αποτελεσμάτων', exact: true }).click();
  await expect(page.locator('.print-status')).toBeHidden();
  expect(errors).toEqual([]);
});

test('unavailable storage getters and failed deletion preserve a usable session', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {
    get() { throw new DOMException('Denied', 'SecurityError'); }, configurable: true,
  }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Test', exact: true }).click();
  await page.getByRole('radio', { name: 'Agree', exact: true }).check();
  await expect(page.locator('.answer-feedback')).toContainText('saving is unavailable');
  await page.getByRole('button', { name: 'Delete Saved Data' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('could not be deleted');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('radio', { name: 'Agree', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('#question-position')).toHaveText('Question 2 of 54');
});

test('three positives and nine unknowns show 3/12 in screen, copy and print', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const creativeIds = questions.filter(q => q.category === 'creativity').map(q => q.id);
  const answers: Answers = Object.fromEntries(questions.map(q => [q.id, 'unknown']));
  creativeIds.slice(0, 3).forEach(id => { answers[id] = winning(id); });
  await seed(page, answers, true);
  const dimension = page.locator('.dimension-card').filter({ has: page.getByRole('heading', { name: 'Creative Tendency', exact: true }) });
  await expect(dimension.locator('.dimension-score')).toHaveText('3 / 12');
  await expect(dimension.locator('.classification')).toHaveText('Low');
  await expect(dimension).toContainText('Response coverage: 25%');
  await expect(dimension).toContainText('Unknown responses: 9');
  await dimension.locator('summary').click();
  await expect(dimension.locator('.calculation')).toContainText('3 / 12 = 25%');
  await expect(dimension.locator('.calculation')).not.toContainText('×');
  await page.getByRole('button', { name: 'Copy Results', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Creative Tendency\n3 / 12 — Low\nResponse coverage: 25% (3 / 12)\nUnknown responses: 9');
  await page.emulateMedia({ media: 'print' });
  await expect(dimension.locator('.dimension-score')).toBeVisible();
  await expect(dimension.getByText('Unknown responses: 9', { exact: true })).toBeVisible();
  await expect(dimension.locator('.dimension-coverage')).toBeVisible();
});

test('old prorated results cannot enter retake comparison; answers and preferences survive', async ({ page }) => {
  const answers: Answers = Object.fromEntries(questions.map(q => [q.id, q.id <= 3 ? winning(q.id) : 'unknown']));
  await seed(page, answers, true);
  await page.evaluate(() => {
    const current = JSON.parse(localStorage.getItem('get2-current-result')!);
    const prorate = (score: Record<string, number>) => {
      const { finalScore: _, ...rest } = score;
      return { ...rest, adjusted: score.known ? score.points / score.known * score.maximum : null };
    };
    const legacy = { ...current, version: 2, overall: prorate(current.overall), dimensions: Object.fromEntries(Object.entries(current.dimensions).map(([key, score]) => [key, prorate(score as Record<string, number>)])) };
    localStorage.setItem('get2-current-result', JSON.stringify(legacy));
    localStorage.setItem('get2-previous-result', JSON.stringify(legacy));
    localStorage.setItem('get2-language', JSON.stringify('el'));
    localStorage.setItem('get2-preferences', JSON.stringify({ version: 1, theme: 'dark', largerText: true, highContrast: true, reduceMotion: true }));
  });
  const preferences = await page.evaluate(() => localStorage.getItem('get2-preferences'));
  await page.reload();
  await page.getByRole('button', { name: 'Προβολή Αποτελεσμάτων', exact: true }).click();
  await expect(page.locator('.overall-score')).toHaveText('3/ 54');
  await expect(page.locator('.comparison')).toHaveCount(0);
  expect((await readSession(page)).answers).toEqual(answers);
  expect(await page.evaluate(() => localStorage.getItem('get2-preferences'))).toBe(preferences);
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('button', { name: 'Take Test Again' }).click();
  const previous = await page.evaluate(() => JSON.parse(localStorage.getItem('get2-previous-result')!));
  expect(previous.version).toBe(3);
  expect(previous.overall.finalScore).toBe(3);
  expect(previous.overall.adjusted).toBeUndefined();
});
