import { test, expect } from '@playwright/test';
import { gotoApp, elegirSando, pedirUnSignature, ponerRecibe, ponerDireccion } from './helpers';

// EL INVITADO NO VUELVE A ESCRIBIR SUS DATOS (dueño, 2026-11-02: «sigue buscando más procesos a mejorar»).
// Promesa: si el invitado ya escribió a quién va, su celular y su dirección, y la app se recarga
// (sale a Yape y el navegador la reinicia, o vuelve otro día), «Pagar» lo lleva directo a pagar.
// Modo de fallo: silencioso — el carrito sigue, pero los datos se borraron y tiene que escribir
// todo y mover el mapa otra vez justo antes de pagar; muchos abandonan ahí.
test('un invitado que recarga la app no vuelve a escribir a quién va ni la dirección', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  await pedirUnSignature(page);
  await ponerDireccion(page);
  await ponerRecibe(page, 'Ana Prueba', '987654321');
  await page.reload();
  await elegirSando(page);
  await pedirUnSignature(page);
  await page.locator('.m30-go .oro').click();
  await expect(page.locator('.m31')).toBeVisible();
  expect(await page.evaluate(() => [(window as any).confNom, (window as any).confPhone])).toEqual(['Ana Prueba', '987654321']);
});
