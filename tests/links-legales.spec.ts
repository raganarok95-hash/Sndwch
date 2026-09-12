import { test, expect } from '@playwright/test';
import { mockBackend, APP_FILE } from './helpers';

// Los tres textos legales solo se alcanzaban tocando DENTRO de la app, así que el negocio no
// tenía ninguna URL pública que dar cuando alguien la pide por escrito. Y la piden: Google no
// publica la pantalla de consentimiento de OAuth sin un link a la Política de Privacidad y a
// las Condiciones del Servicio, y Meta exige lo mismo para verificar el negocio.
//
// MODO DE FALLO: SILENCIO. Si alguien quita el manejo de ?legal=, nada revienta — el link
// simplemente abre el menú, y quien lo siguió (un revisor de Google, un cliente que reclama)
// nunca ve el texto. El link sigue existiendo en la consola de Google, apuntando a nada.

async function abrir(page: any, url: string) {
  await mockBackend(page);
  await page.goto(url);
  await page.waitForTimeout(600);
}

test('?legal=privacidad abre el texto legal, no el menú', async ({ page }) => {
  await abrir(page, APP_FILE + '?legal=privacidad');
  // El encabezado real de la pantalla es "TÉRMINOS Y PRIVACIDAD" — los dos textos viven
  // juntos. Se afirma sobre lo que la pantalla DICE, no sobre el nombre que le pone Google.
  await expect(page.locator('text=/TÉRMINOS Y PRIVACIDAD/i').first()).toBeVisible();
  await expect(page.locator('text=/QUÉ DATOS PEDIMOS/i').first()).toBeVisible();
});

test('?legal=terminos lleva al mismo texto — Google pide dos links y acepta que coincidan', async ({ page }) => {
  await abrir(page, APP_FILE + '?legal=terminos');
  await expect(page.locator('text=/Términos/i').first()).toBeVisible();
});

test('?legal=reclamaciones abre el Libro de Reclamaciones, que es obligación legal', async ({ page }) => {
  await abrir(page, APP_FILE + '?legal=reclamaciones');
  await expect(page.locator('text=/Reclamaciones/i').first()).toBeVisible();
});

test('?legal=devoluciones abre cambios y devoluciones', async ({ page }) => {
  await abrir(page, APP_FILE + '?legal=devoluciones');
  await expect(page.locator('text=/Devoluciones|Cambios/i').first()).toBeVisible();
});

test('un valor que no existe no rompe nada: cae al menú de siempre', async ({ page }) => {
  // Un link mal copiado no puede dejar la app en blanco — el peor caso es el comportamiento
  // normal, nunca una pantalla rota.
  await abrir(page, APP_FILE + '?legal=cualquiercosa');
  await expect(page.locator('text=SIGNATURE').first()).toBeVisible();
});
