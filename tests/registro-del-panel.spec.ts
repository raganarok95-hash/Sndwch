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

// ⚠ LA PRUEBA QUE FALTABA, Y QUE HABRIA AHORRADO LA TARDE ENTERA.
//
// Al partir el bundle, el IIFE que ARRANCA LA APP se quedó del lado del panel. Con el panel
// sin cargar el cliente no llamaba a `render()` ni una vez: pantalla en blanco, sin un solo
// error en consola, para el 100% de los clientes. Y la app funcionaba perfecto en cuanto se
// llamaba a `render()` a mano — que es lo que hace este defecto tan difícil de ver: no está
// roto, es que nadie lo enciende.
//
// `check:cliente` no podía atraparlo: mira REFERENCIAS, y no faltaba ninguna. El problema no
// era que el cliente llamara al panel, sino que el interruptor estaba del otro lado. Lo
// único que lo ve es cargar la app y no tocar nada.
test('la app se pinta sola al cargar, sin el panel y sin que nadie llame a render()', async ({ page }) => {
  await gotoApp(page, {});
  // gotoApp ya espera a que aparezca el menú; esto comprueba explícitamente que lo hizo el
  // arranque de la app y no una llamada del test.
  const pintado = await page.evaluate(() => document.getElementById('app')!.innerHTML.length);
  expect(pintado, 'la app cargó pero dejó la pantalla vacía: nadie la arrancó').toBeGreaterThan(500);
  const pidioPanel = await page.evaluate(() =>
    performance.getEntriesByType('resource').some((r) => r.name.includes('admin.js')),
  );
  expect(pidioPanel, 'un cliente cualquiera descargó el bundle del panel').toBe(false);
});

// Desde que el panel viaja aparte, el registro arranca VACÍO y se llena cuando el bundle
// llega. Estas pruebas piden el panel primero, que es lo que hace la app de verdad al abrir
// una pantalla de admin.
async function conPanelCargado(page: any) {
  await gotoApp(page, {});
  await page.evaluate(() => (window as any).loadAdminBundle());
  await page.waitForFunction(() => Object.keys((window as any).ADMIN_SCREENS || {}).length > 0, null, {
    timeout: 10000,
  });
}

test('las 34 pantallas del panel quedan registradas', async ({ page }) => {
  await conPanelCargado(page);
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
  await conPanelCargado(page);
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
  await conPanelCargado(page);
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
  const pintado = await page.evaluate(() => {
    const w = window as any;
    // El panel sin cargar es el estado en el que está el 100% de los clientes. Se marca el
    // fallo de carga para que el router no intente pedirlo y responda con lo que responde
    // cuando no lo tiene.
    w.ADMIN_SCREENS = {};
    w.adminBundleError = 'simulado';
    w.sndScreen = 'admin_home';
    w.render();
    return document.getElementById('app')!.innerText || '';
  });
  expect(pintado.length, 'la app quedó en blanco sin el panel cargado').toBeGreaterThan(20);
});
