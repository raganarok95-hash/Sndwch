import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gotoApp } from './helpers';

// LOS PUNTOS QUE EL CARRITO PROMETE SON LOS QUE EL SERVIDOR OTORGA.
//
// El carrito mostraba `cartFinalTotal()` crudo — el total con decimales — así que un pedido
// de S/25.90 anunciaba "+25.9 pts". Dos cosas mal en un solo número:
//
//   1. Un punto y medio no existe. Las columnas de puntos son `integer`, y ese detalle ya
//      costó un defecto en producción: `pointsFor` devolvía decimales y reventaba DESPUÉS
//      de que Culqi había cobrado. Es el defecto que hizo nacer `tests-api/`.
//   2. El servidor redondea y otorga 26. El cliente prometía 25.9. Es poco, pero es el
//      programa de fidelidad — literalmente la cuenta que el cliente lleva para saber
//      cuándo le toca su sándwich gratis.
//
// Esta prueba corre la tabla contra el JavaScript REAL del navegador; su gemela
// `tests-api/dinero.test.ts` la corre contra el Deno real del servidor, con la MISMA tabla.
// Es el mismo patrón que ya protege la tarifa de envío (tests/paridad-envio.spec.ts):
// `npm run parity` compara constantes duplicadas, nunca fórmulas.
//
// ⚠ Modo de fallo: SILENCIO. Prometer 25.9 y dar 26 no lanza ningún error y no rompe el
// cobro. Solo hace que la cuenta del cliente no cuadre con la del negocio.

const TABLA = JSON.parse(
  readFileSync(path.join(__dirname, 'fixtures', 'puntos.json'), 'utf8'),
) as { casos: Array<{ total: number; envio: number; pts: number; nota: string }> };

test('el cliente promete los mismos puntos que otorga el servidor', async ({ page }) => {
  await gotoApp(page, {});
  await page.waitForTimeout(400);

  // Se llama a la función REAL del cliente. Reimplementar la fórmula acá sería comparar
  // la prueba contra sí misma.
  const obtenido = await page.evaluate(
    (casos) => casos.map((c) => (window as any).pointsFor(c.total, c.envio)),
    TABLA.casos.map((c) => ({ total: c.total, envio: c.envio })),
  );

  TABLA.casos.forEach((c, i) => {
    expect(obtenido[i], `S/${c.total} con envío S/${c.envio} — ${c.nota}`).toBe(c.pts);
  });
});

test('nunca promete una fracción de punto', async ({ page }) => {
  await gotoApp(page, {});
  await page.waitForTimeout(400);
  const enteros = await page.evaluate(() => {
    const w = window as any;
    // Cualquier combinación de precios .90 con cualquier tarifa de envío del catálogo.
    const totales = [19.9, 20.9, 21.9, 23.9, 25.9, 26.9, 28.9, 30.9, 34.9, 62.7];
    const envios = [0, 5, 6, 6.35, 8, 8.47, 12, 12.7, 15, 15.87];
    const malos: string[] = [];
    for (const t of totales)
      for (const e of envios) {
        const p = w.pointsFor(t + e, e);
        if (!Number.isInteger(p)) malos.push(`pointsFor(${t + e}, ${e}) = ${p}`);
      }
    return malos;
  });
  expect(enteros, 'los puntos llegan a la base en una columna integer').toEqual([]);
});

// El delivery es pass-through: lo cobra el pedido y se lo lleva el motorizado. Premiarlo
// con puntos sería regalar fidelidad por la distancia a la que vive el cliente.
test('el envío no da puntos', async ({ page }) => {
  await gotoApp(page, {});
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const w = window as any;
    return { soloEnvio: w.pointsFor(8, 8), mismoPedidoDosZonas: [w.pointsFor(20.9 + 5, 5), w.pointsFor(20.9 + 15, 15)] };
  });
  expect(r.soloEnvio).toBe(0);
  expect(r.mismoPedidoDosZonas[0], 'el mismo sándwich da los mismos puntos viva donde viva').toBe(
    r.mismoPedidoDosZonas[1],
  );
});
