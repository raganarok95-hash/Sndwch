import { test, expect } from '@playwright/test';
import { mockBackend, APP_FILE } from './helpers';

// LA INSCRIPCIÓN DE EMBAJADORES SIN EL DUEÑO (dueño, 2026-11-21: «Gestiona todo el proceso que
// esté activo»). Quien abre sndwch.app/?embajador=1 se inscribe con nombre y celular y recibe su
// enlace al instante.
// Promesa: el formulario manda nombre y celular a `embajador-inscribirse` y muestra el enlace que
// devuelve el servidor, con los montos que también vienen del servidor.
// Modo de fallo: el silencio — el aviso se publica, la gente entra, el botón no inscribe a nadie o
// muestra otro enlace, y sus pedidos nunca quedan a su nombre: nadie cobra y nadie avisa.

test('?embajador=1 inscribe con nombre y celular y muestra el enlace del servidor', async ({ page }) => {
  const calls = await mockBackend(page, {
    'embajador-inscribirse': { success: true, yaInscrito: false, enlace: 'https://sndwch.app/?src=emb-ana-maria', porPrimero: 7, porSegundo: 3 },
  });
  await page.goto(APP_FILE + '?embajador=1');
  await page.locator('#emb-alta-nombre').fill('Ana María');
  await page.locator('#emb-alta-telefono').fill('987654321');
  await page.locator('[data-accion="inscribir-embajador"]').click();
  await expect(page.locator('[data-accion="enlace-embajador"]')).toHaveText('https://sndwch.app/?src=emb-ana-maria');
  const alta = calls.find((c) => c.action === 'embajador-inscribirse')!;
  expect(alta.body.nombre).toBe('Ana María');
  expect(alta.body.telefono).toBe('987654321');
  // Los montos los dice el servidor, no la pantalla.
  await expect(page.locator('body')).toContainText('S/7');
  await expect(page.locator('body')).toContainText('S/3');
});
