import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// EL PANEL SE ANUNCIA, EL ROUTER PREGUNTA.
//
// Hasta el 2026-09-10, `render()` y `renderScreen()` vivían DENTRO del archivo del panel de
// administración, con los 34 `case` de sus pantallas escritos ahí mismo. Mientras eso fuera
// así, el panel no se podía sacar del bundle que descarga TODO cliente que abre la carta —
// y el panel son 304 KB de 809, o sea el 38% del código, por pantallas que solo abre el
// dueño.
//
// Por qué importa más de lo que parece: el CAC es `CPM / (1000 × CTR × CVR) × 1.18`, y la
// CONVERSIÓN es la única de las tres variables que el negocio controla — las otras dos las
// fija la subasta de Meta. Un bundle que pesa el doble de lo necesario, en una conexión
// móvil de Trujillo, es fricción en el punto exacto donde se pierde al cliente.
//
// `check:bundle` protege la mitad estructural (que el router no vuelva a nombrar una
// pantalla de admin). Esta prueba protege la otra mitad: que el mecanismo de verdad
// FUNCIONE, incluido el caso en que el panel no esté cargado.

test('las 34 pantallas del panel quedan registradas', async ({ page }) => {
  await gotoApp(page, {});
  await page.waitForTimeout(400);
  const registradas = await page.evaluate(() => Object.keys((window as any).ADMIN_SCREENS || {}));

  // El número exacto sube cuando se agrega una pantalla; lo que no puede pasar es que baje
  // sin querer, ni que el registro quede vacío porque alguien movió el bloque de sitio.
  expect(registradas.length, 'el registro del panel quedó vacío o a medias').toBeGreaterThanOrEqual(34);
  expect(registradas).toContain('admin_home');
  expect(registradas).toContain('admin_dashboard');
  // Toda entrada del registro tiene que ser una función de verdad: una mal escrita entra
  // como `undefined` sin que nada avise, y la pantalla cae al home del cliente.
  const rotas = await page.evaluate(() => {
    const r = (window as any).ADMIN_SCREENS || {};
    return Object.keys(r).filter((k) => typeof r[k] !== 'function');
  });
  expect(rotas, 'hay entradas del registro que no son funciones').toEqual([]);
});

test('el router usa el registro para pintar una pantalla del panel', async ({ page }) => {
  await gotoApp(page, {});
  await page.waitForTimeout(400);
  const pintado = await page.evaluate(() => {
    const w = window as any;
    w.isAdmin = true;
    w.token = 'tok';
    w.sndScreen = 'admin_home';
    w.render();
    return document.getElementById('app')!.innerText || '';
  });
  expect(pintado).toMatch(/Panel/);
});

// Éste es el caso que hace que el mecanismo sea seguro: sin el panel cargado —o con una
// pantalla que no existe— no revienta nada, simplemente se vuelve al home del cliente. Es
// también lo que tiene que pasar si alguien sin sesión de admin escribe una pantalla de
// admin en la URL.
test('una pantalla de admin que no está registrada cae al home del cliente', async ({ page }) => {
  await gotoApp(page, {});
  await page.waitForTimeout(400);
  const pintado = await page.evaluate(() => {
    const w = window as any;
    w.sndScreen = 'admin_que_no_existe';
    w.render();
    return document.getElementById('app')!.innerText || '';
  });
  expect(pintado, 'una pantalla inexistente dejó la app en blanco en vez de volver al home').toMatch(
    /Build your own bite|SIGNATURE|ARMA EL TUYO/i,
  );
});

test('con el registro vacío la app del cliente sigue funcionando', async ({ page }) => {
  await gotoApp(page, {});
  await page.waitForTimeout(400);
  const pintado = await page.evaluate(() => {
    const w = window as any;
    // Simula el bundle del panel sin cargar, que es el estado en el que va a estar el 100%
    // de los clientes en cuanto se parta el archivo.
    w.ADMIN_SCREENS = {};
    w.sndScreen = 'admin_home';
    w.render();
    return document.getElementById('app')!.innerText || '';
  });
  expect(pintado.length, 'la app quedó en blanco sin el panel cargado').toBeGreaterThan(20);
});
