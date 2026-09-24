import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// Flujo prioritario #4: un cliente con sesión activa borra su cuenta. doDeleteAccount()
// usa los modales propios (showConfirm/showPrompt, ver index.html) en vez de
// confirm()/prompt() nativos — hay que interactuar con esos overlays, no con diálogos
// del navegador.

test('cliente elimina su cuenta desde el perfil', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '987654321', name: 'Cliente Prueba', points: 120 }, isAdmin: false, token: 'tok-cust' },
    'delete-account': { success: true },
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page, '987654321', '1234');

  await page.locator('[onclick*="sndScreen=\'p_profile\'"]').click();
  await expect(page.locator('text=Eliminar mi cuenta permanentemente')).toBeVisible();
  await page.locator('text=Eliminar mi cuenta permanentemente').click();

  // Modal de confirmación propio de la app (no window.confirm).
  await expect(page.locator('text=CONFIRMAR //')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  // Modal de PIN propio de la app (no window.prompt).
  const pinInput = page.locator('#ui-prompt-input');
  await expect(pinInput).toBeVisible();
  await pinInput.fill('1234');
  await page.getByRole('button', { name: 'ACEPTAR //' }).click();

  await expect(page.locator('text=Tu cuenta fue eliminada.')).toBeVisible({ timeout: 10000 });

  const deleteCall = calls.find((c) => c.action === 'delete-account');
  expect(deleteCall).toBeTruthy();
  expect(deleteCall!.body.pin).toBe('1234');

  // doLogout() debe devolver a la pantalla de login/registro.
  // Tras cerrar sesión se vuelve al formulario de entrada. Desde el 2026-09-23 el primer
  // campo es el CORREO (el de teléfono vive detrás de «entrar con teléfono y PIN»).
  await expect(page.locator('#l-email, #r-phone').first()).toBeVisible();
});
