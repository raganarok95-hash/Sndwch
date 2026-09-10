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

test('los dos lados son botones accesibles y dicen cuál está activo', async ({ page }) => {
  await gotoApp(page, {});

  await expect(page.getByRole('button', { name: 'Signatures' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Arma el tuyo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bebidas' })).toBeVisible();

  // aria-pressed es la única forma de saber cuál está activo sin ver el color — y por lo
  // tanto la única que sirve para alguien que usa lector de pantalla.
  await expect(page.getByRole('button', { name: 'Signatures' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Arma el tuyo' }).click();
  await expect(page.getByRole('button', { name: 'Arma el tuyo' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Signatures' })).toHaveAttribute('aria-pressed', 'false');
});

test('cada hermano está en su lado', async ({ page }) => {
  await gotoApp(page, {});
  // Los personajes son las dos mitades de la marca: si un lado se queda sin el suyo, la
  // división deja de decir de quién es la pantalla.
  await expect(page.locator('img[alt="SANDO"]')).toBeVisible();
  await expect(page.locator('img[alt="WICHO"]')).toBeVisible();

  const sando = (await page.locator('img[alt="SANDO"]').boundingBox())!;
  const wicho = (await page.locator('img[alt="WICHO"]').boundingBox())!;
  // SANDO a la izquierda, WICHO a la derecha. Es el orden del logo del dueño.
  expect(sando.x).toBeLessThan(wicho.x);
});

test('elegir el lado de WICHO tiñe la app entera, y volver la devuelve', async ({ page }) => {
  await gotoApp(page, {});

  // Arranca en el mundo de SANDO: sin atributo.
  await expect(page.locator('html')).not.toHaveAttribute('data-lado', 'wicho');
  const verde = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--sw-card').trim());

  await page.getByRole('button', { name: 'Arma el tuyo' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-lado', 'wicho');
  const azul = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--sw-card').trim());

  // No basta con que el atributo cambie: lo que importa es que los TOKENS cambien, porque
  // de ellos cuelgan los 997 sitios que pintan superficie.
  expect(azul).not.toBe(verde);

  // Y tiene que volver. Un lado que se queda pegado es el mismo defecto mudo al revés.
  await page.getByRole('button', { name: 'Signatures' }).click();
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
  await page.getByRole('button', { name: 'Arma el tuyo' }).click();
  expect(await oro()).toBe(antes);
});
