import { test, expect } from '@playwright/test';
import { createClient, selectClient, uniqueTag } from './support/helpers';

// Critério 4 — marcar como paga e registrar valor pago.

test('marca pago, confere pré-preenchimento e persistência', async ({
  page,
}) => {
  const clientName = `Cliente E2E ${uniqueTag()}`;
  await createClient(page, clientName);

  await page.goto('/ordens/nova');
  const numberInput = page.locator('#number');
  await expect(numberInput).toHaveValue(/^\d{4}[a-z]$/);
  const number = await numberInput.inputValue();
  await selectClient(page, clientName);

  // Mão de Obra (1º item padrão) = R$ 100,00; Deslocamento fica 0.
  await page.getByRole('spinbutton', { name: 'Quantidade' }).nth(0).fill('1');
  await page
    .getByRole('textbox', { name: 'Preço unitário' })
    .nth(0)
    .fill('100,00');

  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page).toHaveURL(/\/ordens$/);

  await page.getByRole('cell', { name: number, exact: true }).click();
  await expect(page).toHaveURL(/\/ordens\/[^/]+$/);

  await page.getByRole('checkbox', { name: 'Pago' }).check();
  const amountPaid = page.locator('#amount_paid');
  await expect(amountPaid).toHaveValue(/^R\$\s100,00$/);

  await amountPaid.click();
  await amountPaid.press('ControlOrMeta+a');
  await amountPaid.pressSequentially('80,00');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page).toHaveURL(/\/ordens$/);

  await page.getByRole('cell', { name: number, exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Pago' })).toBeChecked();
  await expect(page.locator('#amount_paid')).toHaveValue(/^R\$\s80,00$/);
});
