import { test, expect } from '@playwright/test';
async function login(page: import('@playwright/test').Page) {
  await page.goto('./#/login');
  await page.getByRole('button', { name: 'Zaloguj się do panelu' }).click();
  await expect(
    page.getByRole('heading', { name: /Dzień dobry/ }),
  ).toBeVisible();
}
test('login rejects invalid password', async ({ page }) => {
  await page.goto('./#/login');
  await page.getByLabel('Hasło', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Zaloguj się do panelu' }).click();
  await expect(page.getByRole('alert')).toContainText('Niepoprawny');
});
test('CRM moves lead with accessible control', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Leady i sprzedaż' }).click();
  await page.getByLabel('Etap Studio Przykład').selectOption('umowa');
  await expect(
    page
      .locator('.kanban-column')
      .filter({ has: page.getByRole('heading', { name: /umowa/ }) }),
  ).toContainText('Studio Przykład');
});
test('public booking confirms and reserves selected slot', async ({ page }) => {
  await page.goto('./#/rezerwacja');
  const date = new Date();
  date.setDate(date.getDate() + 7);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  await page
    .getByLabel('Data', { exact: true })
    .fill(date.toISOString().slice(0, 10));
  await page.getByLabel('Data', { exact: true }).press('Tab');
  const slot = page.locator('.slots button').first();
  await expect(slot).toBeVisible();
  const label = await slot.textContent();
  await slot.click();
  await page.getByLabel('Imię i nazwisko').fill('Klient Testowy');
  await page.getByLabel('E-mail', { exact: true }).fill('test@example.com');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Potwierdź rezerwację' }).click();
  await expect(page.getByRole('status')).toContainText('potwierdzona');
  await expect(
    page.locator('.slots').getByRole('button', { name: label!, exact: true }),
  ).toHaveCount(0);
});
test('customer filtering and CSV download', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Klienci', exact: true }).click();
  await page.getByRole('searchbox').fill('Alicja');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksport CSV' }).click();
  expect((await download).suggestedFilename()).toContain('.csv');
});
test('PDF and dark mode', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Włącz tryb ciemny' }).click();
  await expect(page.locator('.app-shell')).toHaveClass(/dark/);
  await page.getByRole('link', { name: 'Dokumenty', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Pobierz PDF' }).first().click();
  expect((await download).suggestedFilename()).toContain('.pdf');
});
test('dashboard screenshot and mobile overflow', async ({ page }, info) => {
  await login(page);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `screenshots/${info.project.name}.png`,
    fullPage: true,
    scale: 'css',
  });
});
