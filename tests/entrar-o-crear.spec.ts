import { test, expect } from '@playwright/test';
import { gotoApp, irAEntrar } from './helpers';

// ENTRAR TAMBIÉN CREA LA CUENTA (dueño, 2026-10-01: «solo deja ingresar si ya tienes cuenta»).
//
// Promesa: un correo que la base no conoce llega, con el mismo botón, al paso de crear la
// cuenta con ese correo ya resuelto; nadie tiene que buscar un «Registrarme» aparte.
// Modo de fallo: el SILENCIO — el código llega, se verifica y la pantalla se queda en el
// correo o vuelve a pedirlo, sin decir que falta crear la cuenta.
// Se busca por función (`data-accion`, ids de campos), nunca por el texto del botón.

test('un correo nuevo pasa del código a crear la cuenta', async ({ page }) => {
  const calls = await gotoApp(page, {
    'request-login-code': { success: true, masked: 'n***@correo.com' },
    'verify-login-code': { needsRegistration: true, emailProof: 'prueba', email: 'nuevo@correo.com' },
  });
  await irAEntrar(page);
  await page.locator('#l-email').fill('nuevo@correo.com');
  await page.locator('[data-accion="pedir-codigo"]').click();
  await page.locator('#l-code').fill('123456');
  await page.locator('[data-accion="verificar-codigo"]').click();

  await expect(page.locator('[data-accion="crear-cuenta"]')).toBeVisible();
  await expect(page.locator('#r-dni')).toBeVisible();
  expect(calls.filter((c) => c.action === 'verify-login-code')[0].body.email).toBe('nuevo@correo.com');
});
