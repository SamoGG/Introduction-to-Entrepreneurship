import { test, expect } from '@playwright/test';
import { translations } from '../src/i18n/translations.ts';

for (const language of ['en', 'el'] as const) {
  test(`${language}: footer and privacy remain localized and readable across display modes`, async ({ page }) => {
    const t = translations[language];
    const other = translations[language === 'en' ? 'el' : 'en'];
    await page.goto('/');
    await page.getByRole('button', { name: language === 'en' ? 'English' : 'Ελληνικά', exact: true }).click();
    const footer = page.locator('footer');
    await expect(footer).toContainText(t.madeBy);
    await expect(footer.getByText(t.aiDisclosure, { exact: true })).toBeVisible();
    await expect(footer).not.toContainText(other.aiDisclosure);
    for (const mode of [
      { width: 1280, theme: 'light', accessible: false },
      { width: 1280, theme: 'dark', accessible: false },
      { width: 375, theme: 'light', accessible: true },
      { width: 375, theme: 'dark', accessible: true },
    ]) {
      await page.setViewportSize({ width: mode.width, height: 812 });
      await footer.getByRole('button', { name: t.preferences, exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('radio', { name: mode.theme === 'light' ? t.light : t.dark, exact: true }).check();
      await dialog.getByRole('checkbox', { name: t.largerText }).setChecked(mode.accessible);
      await dialog.getByRole('checkbox', { name: t.highContrast }).setChecked(mode.accessible);
      await dialog.getByRole('button', { name: t.close, exact: true }).click();
      await footer.getByText(t.aiDisclosure, { exact: true }).scrollIntoViewIfNeeded();
      await expect(footer.getByText(t.aiDisclosure, { exact: true })).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await footer.getByRole('button', { name: t.privacyTitle, exact: true }).click();
      for (const key of ['privacyBody', 'privacyStorage', 'privacyControl', 'privacyExtra', 'privacyHosting'] as const) {
        await expect(dialog).toContainText(t[key]);
        await expect(dialog).not.toContainText(other[key]);
      }
      await dialog.locator('time').scrollIntoViewIfNeeded();
      await expect(dialog.locator('time')).toBeInViewport();
      await expect(dialog.locator('time')).toHaveAttribute('datetime', '2026-10-01');
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.keyboard.press('Escape');
      await expect(footer.getByRole('button', { name: t.privacyTitle, exact: true })).toBeFocused();
    }
    await footer.getByRole('button', { name: t.aboutTitle, exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText(t.aboutQuiz);
    await expect(page.getByRole('dialog')).toContainText(t.disclaimer);
  });
}
