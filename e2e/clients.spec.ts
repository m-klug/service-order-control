import { test, expect } from '@playwright/test';
import { createClient, selectClient, uniqueTag } from './support/helpers';

// Critério 1 — cadastrar cliente e reusar em várias OS.

test('cria cliente e reusa em duas OS diferentes', async ({ page }) => {
  const clientName = `Cliente E2E ${uniqueTag()}`;

  await createClient(page, clientName);
  await expect(page.getByRole('cell', { name: clientName })).toBeVisible();

  for (let i = 0; i < 2; i++) {
    await page.goto('/ordens/nova');
    await selectClient(page, clientName);
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page).toHaveURL(/\/ordens$/);
  }

  const rows = page.getByRole('row', { name: new RegExp(clientName) });
  await expect(rows).toHaveCount(2);
});
