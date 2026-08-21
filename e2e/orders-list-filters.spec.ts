import { test, expect } from '@playwright/test';
import { createClient, selectClient, uniqueTag } from './support/helpers';

// Critério 5 — listar/buscar por status, cliente, período e pagamento.

test('filtra a lista de OS', async ({ page }) => {
  const clientName = `Cliente E2E ${uniqueTag()}`;
  await createClient(page, clientName);

  // OS-A: status padrão (Aberta), não paga.
  await page.goto('/ordens/nova');
  await selectClient(page, clientName);
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page).toHaveURL(/\/ordens$/);

  // OS-B: "Em andamento", marcada como paga.
  await page.goto('/ordens/nova');
  await selectClient(page, clientName);
  await page.locator('select').nth(0).selectOption({ label: 'Em andamento' });
  await page.getByRole('checkbox', { name: 'Pago' }).check();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page).toHaveURL(/\/ordens$/);

  const search = page.getByPlaceholder('Buscar por número ou cliente…');

  // Filtro por cliente: as duas OS aparecem.
  await search.fill(clientName);
  await expect(page.getByRole('row', { name: clientName })).toHaveCount(2);

  // + status "Em andamento": só a OS-B.
  await page.locator('select').nth(0).selectOption({ label: 'Em andamento' });
  await expect(page.getByRole('row', { name: clientName })).toHaveCount(1);
  await page
    .locator('select')
    .nth(0)
    .selectOption({ label: 'Todos os status' });

  // + pagamento "Pago": só a OS-B.
  await page.locator('select').nth(1).selectOption({ label: 'Pago' });
  await expect(page.getByRole('row', { name: clientName })).toHaveCount(1);
  await page
    .locator('select')
    .nth(1)
    .selectOption({ label: 'Pagamento: todos' });

  // Período no futuro: nenhuma das duas (abertas hoje).
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  await page.getByLabel('Data inicial').fill(future);
  await expect(page.getByRole('row', { name: clientName })).toHaveCount(0);
});
