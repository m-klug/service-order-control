import { test, expect } from '@playwright/test';
import { createClient, selectClient, uniqueTag } from './support/helpers';

// Critérios 2 e 3 — criar OS completa; total calculado certo (RN-03).
// Cobre também a Fix 1 (item obrigatório).

test('cria OS completa com número automático e total certo', async ({
  page,
}) => {
  const tag = uniqueTag();
  const clientName = `Cliente E2E ${tag}`;
  await createClient(page, clientName);

  await page.goto('/ordens/nova');

  const numberInput = page.locator('#number');
  await expect(numberInput).toHaveValue(/^\d{4}[a-z]$/);
  const number = await numberInput.inputValue();

  await selectClient(page, clientName);
  await page.locator('#request').fill(`Solicitação E2E ${tag}`);
  await page.locator('#report').fill(`Relatório E2E ${tag}`);
  await page.locator('#warranty_months').fill('6');

  // Deslocamento opcional.
  await page.getByRole('button', { name: 'Adicionar deslocamento' }).click();
  await page.getByRole('textbox', { name: 'Carro' }).fill('Fiat Fiorino');

  // Item novo entra antes dos padrão: [Peça, Mão de Obra, Deslocamento].
  await page.getByRole('button', { name: 'Adicionar item' }).click();
  const desc = page.getByRole('textbox', { name: 'Descrição' });
  const qty = page.getByRole('spinbutton', { name: 'Quantidade' });
  const price = page.getByRole('textbox', { name: 'Preço unitário' });

  await desc.nth(0).fill('Peça E2E');
  await qty.nth(0).fill('3');
  await price.nth(0).fill('10,00');

  await qty.nth(1).fill('2'); // Mão de Obra
  await price.nth(1).fill('50,00');

  await qty.nth(2).fill('1'); // Deslocamento (preço já vem 95,00)

  // 3×10 + 2×50 + 1×95 = 225; desconto 25 => total 200.
  await page.locator('#discount').fill('25,00');
  await expect(page.getByText('R$ 200,00')).toBeVisible();

  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page).toHaveURL(/\/ordens$/);

  const row = page.getByRole('row', { name: new RegExp(number) });
  await expect(row).toContainText('R$ 200,00');
});

test('bloqueia salvar OS sem nenhum item', async ({ page }) => {
  const clientName = `Cliente E2E ${uniqueTag()}`;
  await createClient(page, clientName);

  await page.goto('/ordens/nova');
  await selectClient(page, clientName);

  const removeButton = page.getByRole('button', { name: 'Remover item' });
  while (await removeButton.count()) {
    await removeButton.first().click();
  }

  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page).toHaveURL(/\/ordens\/nova$/);
  await expect(page.getByText('Adicione pelo menos um item.')).toBeVisible();
});
