import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// LA DIVISIÓN DEL MENÚ SON LOS HERMANOS, NO UNA FRANJA.
//
// Esta prueba nació fijando un divisor "//" dorado dibujado entre los dos paneles. El
// dueño lo retiró viendo el preview, y tenía razón: el wordmark YA lleva su "//" arriba
// en la misma pantalla, así que repetirlo grande dejaba de ser marca y pasaba a ser ruido.
// La prueba se reescribió para fijar lo que hay AHORA en vez de borrarla — si describe una
// pantalla que ya no existe, deja de proteger nada.
//
// Lo que sí hay que proteger es lo que SIGNIFICA la división:
//   · Cada lado es de un hermano y se puede tocar (teclado y lector de pantalla incluidos).
//   · Elegir un lado tiñe la APP ENTERA de su color. Eso vive en un solo sitio (setLado en
//     render), y su modo de fallo es MUDO: si se rompe, la app se ve perfectamente bien,
//     solo que del color del hermano equivocado.

// ⚠ DESDE EL REDISEÑO LA DIVISIÓN ES LA PUERTA (2026-09-24). Estas pruebas describían una barra
// de tres pestañas (Signatures / Arma el tuyo / Bebidas) con `aria-pressed`, que ya no existe:
// hoy cada hermano es su propio lado y se elige en la puerta partida, a la que se vuelve con
// «Cambiar de lado». Se reescribieron sobre eso, protegiendo lo mismo: que cada lado se pueda
// elegir con teclado y lector, que cada hermano esté en su lado, y que el color sea el de toda
// la app.
const sando = (page: any) => page.getByRole('button', { name: /Ya está resuelto/ });
const wicho = (page: any) => page.getByRole('button', { name: /Tú decides/ });
async function aLaPuerta(page: any) {
  await page.getByRole('button', { name: 'Cambiar de lado' }).click();
  await expect(sando(page)).toBeVisible();
}

test('los dos lados son botones accesibles, y elegir uno se nota sin ver el color', async ({ page }) => {
  await gotoApp(page, {});
  await aLaPuerta(page);
  // Botones de verdad: se llega con Tab y los anuncia el lector de pantalla por su nombre.
  await expect(sando(page)).toBeEnabled();
  await expect(wicho(page)).toBeEnabled();
  await wicho(page).focus();
  await page.keyboard.press('Enter');
  // Elegir un lado ENTRA a ese lado: el armador de WICHO, con su primera pregunta.
  await expect(page.locator('text=¿De qué tamaño?')).toBeVisible();
});

test('cada hermano está en su lado', async ({ page }) => {
  await gotoApp(page, {});
  await aLaPuerta(page);
  const a = (await sando(page).boundingBox())!;
  const b = (await wicho(page).boundingBox())!;
  // SANDO a la izquierda, WICHO a la derecha. Es el orden del logo del dueño.
  expect(a.x).toBeLessThan(b.x);
});

test('elegir el lado de WICHO tiñe la app entera, y volver la devuelve', async ({ page }) => {
  await gotoApp(page, {});

  // Arranca en el mundo de SANDO: sin atributo.
  await expect(page.locator('html')).not.toHaveAttribute('data-lado', 'wicho');
  const verde = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--sw-card').trim());

  await aLaPuerta(page);
  await wicho(page).click();
  await expect(page.locator('html')).toHaveAttribute('data-lado', 'wicho');
  const azul = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--sw-card').trim());

  // No basta con que el atributo cambie: lo que importa es que los TOKENS cambien, porque
  // de ellos cuelgan los cientos de sitios que pintan superficie.
  expect(azul).not.toBe(verde);

  // Y tiene que volver. Un lado que se queda pegado es el mismo defecto mudo al revés.
  await page.evaluate(() => (window as any).volverALaPuerta());
  await sando(page).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-lado', 'wicho');
});

test('el precio NO cambia de color entre los dos lados', async ({ page }) => {
  // El dorado es el color del dinero y se queda igual en los dos mundos a propósito. Un
  // precio que cambia de color según dónde estás es justo la clase de duda que no queremos
  // en un checkout.
  await gotoApp(page, {});
  const oro = async () =>
    page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--sw-gold').trim());

  const antes = await oro();
  await aLaPuerta(page);
  await wicho(page).click();
  await expect(page.locator('html')).toHaveAttribute('data-lado', 'wicho');
  expect(await oro()).toBe(antes);
});
