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
) as { casos: Array<{ km: number; fee: number; nota: string }> };

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

test('el cliente redondea hacia ARRIBA, nunca al más cercano', async ({ page }) => {
  await gotoApp(page, {});
  // 3.1 km × S/2 = S/6.20. Al medio sol más cercano daría 6.00; hacia arriba da 6.50.
  // La diferencia la pone el dueño de su bolsillo cada vez que se equivoca hacia abajo.
  const fee = await page.evaluate(() => (window as any).deliveryFeeForKm(3.1));
  expect(fee).toBe(6.5);
});

test('por debajo del mínimo manda el mínimo, no los kilómetros', async ({ page }) => {
  await gotoApp(page, {});
  // El grupo de motorizados cobra un piso por viaje corto: cobrar 2 × 1.2 = S/2.40 sería
  // cobrarle al cliente menos de lo que cuesta llevarle el pedido.
  const fee = await page.evaluate(() => (window as any).deliveryFeeForKm(1.2));
  expect(fee).toBe(5);
});
