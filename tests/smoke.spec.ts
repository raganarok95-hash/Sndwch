import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Prueba mínima de humo — antes no existía NINGUNA prueba automatizada versionada en el
// repo (los scripts de Playwright de sesiones anteriores se escribían y se descartaban).
// Esto no reemplaza pruebas manuales antes de un cambio grande, pero atrapa el tipo de
// regresión más básica: que la app ni siquiera cargue o que el flujo de login/registro
// esté roto por un error de sintaxis en index.html.
//
// USA gotoApp COMO LOS OTROS 21 SPECS (corregido 2026-08-27). Antes hacía `page.goto()`
// pelado, sin mockBackend, así que era el ÚNICO test que salía a la red real: pegaba
// get-catalog / get-store-hours / session-check contra el Supabase de PRODUCCIÓN en cada
// PR. El runner de GitHub sí tiene salida a internet — es la misma razón por la que el
// script real de Culqi pisaba el stub y rompía weekly-plan.spec.ts solo en CI. El test
// más básico de la suite no puede depender de que producción esté arriba.
//
// Cómo correrla: npm install && npx playwright install chromium && npm test

// ⚠ Esta prueba buscaba `text=BUILD`, y pasaba por el subtítulo "Build your own bite" —
// el ÚNICO texto en inglés que quedaba en la app, justo debajo del nombre del negocio.
// Al corregirlo al español la prueba se cayó, que es lo correcto: estaba anclada a un
// defecto. Recuperar la palabra para que volviera a pasar habría sido devolver el defecto
// para complacer a la prueba.
//
// Ahora se ancla a los DOS CAMINOS DE PEDIDO, que es lo que de verdad tiene que estar
// pintado para decir que la app arrancó — y son la mitad de la identidad de la marca (los
// dos hermanos), así que si alguno desaparece de la home es un problema de negocio, no de
// texto.
test('la app carga y muestra los dos caminos de pedido', async ({ page }) => {
  await gotoApp(page);
  await expect(page.locator('text=Signatures').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=Arma el tuyo').first()).toBeVisible();
  // Un menú sin un solo precio es una app sin carta: se pinta igual y no vende nada. Es el
  // mismo criterio con el que la prueba de humo de producción mira el CONTENIDO del
  // catálogo y no solo que el endpoint responda 200.
  //
  // ⚠ EXIGE DECIMALES a propósito. La primera versión buscaba `S/` seguido de un dígito y
  // pasaba igual con los precios rotos: matcheaba el "30" de **30CM**, que en el texto
  // renderizado queda justo debajo del "S/". Un precio de carta siempre trae dos decimales
  // (.90), y "30CM" no — se descubrió inyectando un `pz()` que devuelve cadena vacía.
  await expect(page.locator('text=/S\\/\\s*\\d+[.,]\\d{2}/').first()).toBeVisible();
});

test('la pestaña de puntos muestra el formulario de login/registro para un invitado', async ({ page }) => {
  await gotoApp(page);
  await page.locator('text=PUNTOS').first().click();
  await expect(page.locator('input#l-phone, input#r-phone').first()).toBeVisible({ timeout: 10000 });
});
