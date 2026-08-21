import { test, expect } from '@playwright/test';
import { createClient, selectClient, uniqueTag } from './support/helpers';

// Critério 6 — gerar o PDF da OS.

test('gera o PDF de uma OS existente', async ({ page }) => {
  const clientName = `Cliente E2E ${uniqueTag()}`;
  await createClient(page, clientName);

  await page.goto('/ordens/nova');
  const numberInput = page.locator('#number');
  await expect(numberInput).toHaveValue(/^\d{4}[a-z]$/);
  const number = await numberInput.inputValue();
  await selectClient(page, clientName);
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page).toHaveURL(/\/ordens$/);

  await page.getByRole('cell', { name: number, exact: true }).click();
  await expect(page).toHaveURL(/\/ordens\/[^/]+$/);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Gerar PDF' }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/^OS-.*\.pdf$/);
  const path = await download.path();
  expect(path).toBeTruthy();
  const fs = await import('node:fs');
  expect(fs.statSync(path!).size).toBeGreaterThan(0);
});
