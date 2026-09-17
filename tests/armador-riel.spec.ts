import { test, expect } from '@playwright/test';
import { mockBackend, APP_FILE } from './helpers';

// EL RIEL TIENE QUE DECIR LO MISMO QUE LA PANTALLA
//
// El 2026-09-05 se intercambió el CONTENIDO de los pasos 2 y 3 del armador para seguir el
// orden del mostrador de Subway (el queso va antes que los vegetales, porque va debajo y es
// lo que se funde al tostar). Se cambió el `if` que decide qué se pinta, y NO se cambiaron
// ni `BYO_STEP_LABELS` ni `byoValor`. Resultado: durante doce días el riel encendía
// "TOPPINGS" mientras el título decía "Queso", y "QUESO" mientras el título decía
// "Vegetales" — y el valor de al lado también estaba cambiado, así que el riel mostraba el
// queso elegido en la fila de los vegetales.
//
// MODO DE FALLO: SILENCIO. No hay excepción, no hay pantalla rota, no hay test que caiga.
// La app simplemente le miente al cliente sobre en qué paso está. Por eso esta prueba no
// afirma contra una lista escrita acá (eso sería copiar el mismo error), sino que COMPARA
// las dos fuentes entre sí: el rótulo que el riel enciende y el título que se pintó.

const TITULO_POR_ROTULO: Record<string, RegExp> = {
  'PAN': /^Pan$/i,
  'PROTEÍNA': /^Proteína$/i,
  'QUESO': /^Queso$/i,
  'VEGETALES': /^Vegetales$/i,
  'SALSAS': /^Salsas$/i,
};

test('el paso encendido en el riel es el que la pantalla está pintando', async ({ page }) => {
  await mockBackend(page);
  await page.goto(APP_FILE);
  await page.getByRole('button', { name: /Tú decides/ }).click();
  await page.locator('text=/Elegir/i').first().click();
  await page.waitForSelector('[data-paso]');

  // Se recorren los cinco pasos eligiendo lo mínimo para poder avanzar.
  for (let paso = 0; paso < 5; paso++) {
    const activo = page.locator('[data-actual="1"]');
    await expect(activo, `en el paso ${paso} el riel debe tener exactamente un paso encendido`).toHaveCount(1);

    // La fila lleva el número, el rótulo y el valor elegido. Se busca el rótulo entre las
    // líneas en vez de asumir que es la primera: el número va antes.
    const lineas = (await activo.innerText()).split('\n').map((x) => x.trim().toUpperCase());
    const rotulo = lineas.find((x) => x in TITULO_POR_ROTULO) || lineas.join(' | ');
    const esperado = TITULO_POR_ROTULO[rotulo];
    expect(esperado, `el riel encendió "${rotulo}", que no es ninguno de los cinco pasos conocidos`).toBeTruthy();

    // El título de la sección que de verdad se pintó (el <h2> de ST()).
    const titulos = await page.locator('h2').allInnerTexts();
    const coincide = titulos.some((t) => esperado.test(t.trim()));
    expect(
      coincide,
      `el riel dice "${rotulo}" pero la pantalla pintó ${JSON.stringify(titulos)} — ` +
      'el orden de BYO_STEP_LABELS dejó de coincidir con el de los `if` que eligen qué pintar',
    ).toBe(true);

    if (paso === 0) {
      await page.locator('text=15CM').first().click();
      await page.locator('text=/Classic/').first().click();
    }
    if (paso === 1) await page.locator('text=/Pollo/').first().click();
    if (paso < 4) {
      await page.locator('button:has-text("Siguiente")').first().click();
      await page.waitForTimeout(250);
    }
  }
});

test('el valor que el riel muestra al lado de cada paso es el de ESE paso', async ({ page }) => {
  // El segundo defecto del mismo cambio, que el test de arriba no ve: los rótulos pueden
  // estar bien y `byoValor` seguir devolviendo el queso en la fila de los vegetales.
  await mockBackend(page);
  await page.goto(APP_FILE);
  await page.getByRole('button', { name: /Tú decides/ }).click();
  await page.locator('text=/Elegir/i').first().click();
  await page.locator('text=15CM').first().click();
  await page.locator('text=/Classic/').first().click();
  await page.locator('button:has-text("Siguiente")').first().click();
  await page.locator('text=/Pollo/').first().click();
  await page.locator('button:has-text("Siguiente")').first().click();
  // Paso QUESO: se elige uno real y tiene que aparecer en la fila del queso, no en otra.
  await page.locator('text=Cheddar').first().click();
  await page.waitForTimeout(200);

  const filaQueso = await page.locator('[data-paso="2"]').innerText();
  expect(filaQueso, 'el queso elegido debe salir en la fila QUESO del riel').toMatch(/QUESO/i);
  expect(filaQueso).toMatch(/Cheddar/i);

  await page.locator('button:has-text("Siguiente")').first().click();
  await page.locator('text=Tomate').first().click();
  await page.waitForTimeout(200);
  const filaVeg = await page.locator('[data-paso="3"]').innerText();
  expect(filaVeg, 'el vegetal elegido debe salir en la fila VEGETALES, no en la del queso').toMatch(/VEGETALES/i);
  expect(filaVeg).toMatch(/1 vegetal/i);
});
