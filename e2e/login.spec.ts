import { test, expect } from '@playwright/test';

// Critério 7 — acesso protegido por login. Roda no projeto
// `unauthenticated` (sem storageState), separado do resto da suíte.

test('acesso sem sessão redireciona pra /login', async ({ page }) => {
  await page.goto('/ordens');
  await expect(page).toHaveURL(/\/login$/);
});

test('login válido leva pra página pedida', async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error('E2E_EMAIL e E2E_PASSWORD precisam estar definidas.');
  }

  await page.goto('/ordens');
  await expect(page).toHaveURL(/\/login$/);

  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL(/\/ordens$/);
});

test('credencial inválida mostra erro', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill('operador@example.com');
  await page.locator('#password').fill('senha-errada-123');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('Falha no login')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
