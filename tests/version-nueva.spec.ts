import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// UNA PESTAÑA ABIERTA HORAS SE ENTERA DE LA VERSIÓN NUEVA (dueño, 2026-10-02: subió la captura de
// Yape con la versión de la mañana y no pasó nada). Modo de fallo: el silencio — el arreglo ya está
// publicado y el celular sigue corriendo el código viejo sin que nadie lo sepa.
test('al volver a la pestaña con una versión vieja, en una pantalla sin riesgo se actualiza sola', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  await page.evaluate(() => {
    const w = window as any;
    w.__actualizada = 0; w.applyAppUpdate = () => { w.__actualizada++; };
    w.fetch = async () => new Response("<script>var APP_BUILD = 'ffffffffff'</script>"); w.sndScreen = 'o_home';
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => (window as any).__actualizada)).toBe(1);
});

test('a mitad de un pedido no recarga: muestra el aviso de actualizar', async ({ page }) => {
  await gotoApp(page, { '*': { success: true } });
  await page.evaluate(() => {
    const w = window as any;
    w.__actualizada = 0; w.applyAppUpdate = () => { w.__actualizada++; };
    w.fetch = async () => new Response("<script>var APP_BUILD = 'ffffffffff'</script>"); w.sndScreen = 'o_sent';
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => (window as any).updateReady)).toBe(true);
  expect(await page.evaluate(() => (window as any).__actualizada)).toBe(0);
});
