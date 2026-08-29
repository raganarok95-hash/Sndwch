import { test, expect } from '@playwright/test';
import { APP_FILE } from './helpers';

// Los otros 31 tests cargan index.html por file:// con TODA la red bloqueada, así que los
// bundles de terceros (Culqi, Google Sign-In) nunca se ejecutan. Ese es exactamente el
// hueco por el que se colaron a producción dos bugs el 2026-08-21: Culqi es una app Vue,
// su bundle minificado declara funciones globales de nombre corto, y al correr DESPUÉS
// de nuestro script (va con `defer`) pisó primero `sc` — "sc.indexOf is not a function",
// cada render muerto — y después `go` — "go is not a function", cada navegación muerta.
// Los 32 tests pasaban en verde mientras la app real estaba inservible en todas las
// plataformas.
//
// Este test simula esa colisión sin depender de la red: inyecta un script que pisa
// nuestras funciones globales igual que lo haría Culqi, y verifica que la app se recupera
// sola y sigue navegando.

test('la app sobrevive a un script externo que pisa sus funciones globales', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));

  await page.route('**/functions/v1/api', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ valid: false, proteins: {}, sigs: {}, sides: {}, rewardPts: {}, hours: [], businessLaunched: true }),
    }),
  );
  await page.route('**/rest/v1/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto(APP_FILE);
  // Esperar la condición real (el blindaje ya instalado y el home pintado) en vez de un
  // número de milisegundos: una espera fija o se queda corta en una máquina lenta (CI) o
  // desperdicia tiempo en una rápida, y en los dos casos el test deja de decir la verdad.
  await page.waitForFunction(() => typeof (window as any).sndRestoreOwnedFns === 'function');
  await expect(page.locator('text=/ARMA EL TUYO/i').first()).toBeVisible();

  // Un bundle de terceros pisa tres funciones nuestras, igual que hizo Culqi.
  const pisadas = await page.evaluate(() => {
    const w = window as any;
    const antes = { go: w.go, render: w.render, startOrder: w.startOrder };
    w.go = function () { return 'soy Vue, no tu funcion'; };
    w.render = function () { return 'soy Vue, no tu funcion'; };
    w.startOrder = function () { return 'soy Vue, no tu funcion'; };
    return { pisadas: w.go !== antes.go && w.render !== antes.render && w.startOrder !== antes.startOrder };
  });
  expect(pisadas.pisadas, 'el test debe haber logrado pisar las funciones').toBe(true);

  // Cualquier interacción dispara un render, que es donde el blindaje repone lo pisado.
  await page.evaluate(() => (window as any).sndRestoreOwnedFns());

  const repuestas = await page.evaluate(() => {
    const w = window as any;
    return {
      go: typeof w.go === 'function' && w.go.toString().indexOf('soy Vue') === -1,
      render: typeof w.render === 'function' && w.render.toString().indexOf('soy Vue') === -1,
      startOrder: typeof w.startOrder === 'function' && w.startOrder.toString().indexOf('soy Vue') === -1,
    };
  });
  expect(repuestas.go, 'go() debe haber vuelto a ser la nuestra').toBe(true);
  expect(repuestas.render, 'render() debe haber vuelto a ser la nuestra').toBe(true);
  expect(repuestas.startOrder, 'startOrder() debe haber vuelto a ser la nuestra').toBe(true);

  // Y la app tiene que seguir navegando de verdad, no solo tener las funciones bien.
  await page.locator('text=/ARMA EL TUYO/i').first().click();
  const paso = page.locator('text=/Ver el paso a paso completo/i').first();
  await expect(paso).toBeVisible();
  await paso.click();
  await expect(page.locator('text=Paso 1 // 5')).toBeVisible();

  expect(errores, 'no debe quedar ningún error de JavaScript sin manejar').toEqual([]);
});

// El estado (a diferencia de las funciones) no se repone, pero sí tiene un guard: si un
// tercero deja sndScreen en algo que no es un string, render() la repone en vez de
// reventar en bucle. Eso fue literalmente el primer bug del 2026-08-21.
test('un sndScreen corrupto no deja la app muerta', async ({ page }) => {
  await page.route('**/functions/v1/api', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, hours: [], businessLaunched: true }) }),
  );
  await page.route('**/rest/v1/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto(APP_FILE);
  await page.waitForFunction(() => typeof (window as any).render === 'function');
  await expect(page.locator('text=/ARMA EL TUYO|Signatures/i').first()).toBeVisible();

  await page.evaluate(() => {
    const w = window as any;
    w.sndScreen = function vueInterno() { return 1; }; // exactamente lo que hizo Culqi
    w.render();
  });

  await expect(page.locator('text=/ARMA EL TUYO|Signatures/i').first()).toBeVisible();
  const tipo = await page.evaluate(() => typeof (window as any).sndScreen);
  expect(tipo, 'sndScreen debe haber vuelto a ser un string').toBe('string');
});
