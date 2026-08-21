import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export function uniqueTag(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Cadastra um cliente pela tela de Clientes e volta pra lista. */
export async function createClient(page: Page, name: string): Promise<void> {
  await page.goto('/clientes');
  await page.getByRole('button', { name: 'Novo cliente' }).click();
  await page.locator('#name').fill(name);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Salvar' })
    .click();
  await expect(page.getByText('Cliente criado')).toBeVisible();
}

/** Preenche o cliente de uma OS aberta no editor, pelo combobox de busca. */
export async function selectClient(page: Page, name: string): Promise<void> {
  await page.getByPlaceholder('Buscar cliente…').fill(name);
  await page.getByRole('option', { name }).click();
}
