import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

/**
 * Loga uma vez pelo formulário real e salva a sessão pros demais specs
 * reusarem (projeto `authenticated`). Usa o único usuário operador já
 * existente no Supabase local — sem signup público (GOTRUE_DISABLE_SIGNUP).
 */
setup('login', async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'E2E_EMAIL e E2E_PASSWORD precisam estar definidas (usuário operador local — ver README).',
    );
  }

  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/ordens$/);

  await page.context().storageState({ path: authFile });
});
