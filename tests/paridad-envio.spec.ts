import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gotoApp } from './helpers';

// PARIDAD DE LA FÓRMULA, NO SOLO DE LAS CONSTANTES.
//
// La revisión de arquitectura (2026-09-10, `ARQUITECTURA.md`) encontró este hueco:
// `npm run parity` compara los VALORES duplicados entre cliente y servidor —el precio por
// km, el mínimo, el factor de ruta— pero ninguna de sus 93 comprobaciones mira la FÓRMULA
// que los combina. Si un lado empezara a redondear al medio sol MÁS CERCANO en vez de hacia
// arriba, parity seguiría en verde y el cliente mostraría un monto mientras el servidor
// cobra otro. Es exactamente el defecto que parity se escribió para evitar, entrando por la
// puerta que parity no mira.
//
// Esta prueba corre la tabla contra el JavaScript REAL del navegador; su gemela
// `tests-api/delivery-distancia.test.ts` la corre contra el Deno real del servidor. La
// tabla vive en un solo archivo. Si una fórmula cambia y la otra no, una de las dos falla.
//
// Por qué importa tanto: el delivery es PASS-THROUGH. El negocio no gana nada con él, solo
// lo cobra para pagarle al motorizado. Un cobro corto no reduce el margen — sale del
// bolsillo del dueño, y no aparece en ningún reporte como "error".

const TABLA = JSON.parse(
  readFileSync(path.join(__dirname, 'fixtures', 'tarifa-envio.json'), 'utf8'),
) as { casos: Array<{ km: number; fee: number | null; nota: string }> };

test('el cliente cobra lo mismo que el servidor para cada distancia', async ({ page }) => {
  await gotoApp(page, {});

  // Se llama a la función REAL del cliente, la misma que usa el checkout. No se
  // reimplementa la fórmula acá: eso sería comparar el test contra sí mismo.
  const obtenido = await page.evaluate(
    (kms) => kms.map((km) => (window as any).deliveryFeeForKm(km)),
    TABLA.casos.map((c) => c.km),
  );

  TABLA.casos.forEach((c, i) => {
    expect(obtenido[i], `${c.km} km — ${c.nota}`).toBe(c.fee);
  });
});

test('pasado el último tramo el cliente lo marca fuera de alcance', async ({ page }) => {
  await gotoApp(page, {});
  // Modo de fallo: el cliente muestra un envío (o S/0) a alguien a 10 km y lo deja seguir; el
  // servidor lo rechaza recién al tocar pagar. problemaDelPedido frena el pago con fueraDeAlcance.
  const r = await page.evaluate(() => {
    const w = window as any;
    const lejos = { lat: w.STORE_LAT + 0.08, lon: w.STORE_LON };
    const cerca = { lat: w.STORE_LAT + 0.005, lon: w.STORE_LON };
    return {
      lejos: w.fueraDeAlcance(w.kmADireccion(lejos)), envioLejos: w.envioADireccion(lejos),
      cerca: w.fueraDeAlcance(w.kmADireccion(cerca)),
    };
  });
  expect(r.lejos).toBe(true);
  expect(r.envioLejos).toBeNull();
  expect(r.cerca).toBe(false);
});
