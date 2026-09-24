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

// ⚠ REESCRITA EL 2026-09-23 para el armador rehecho. El riel dejó de ser una lista con el
// valor al lado de cada paso: ahora son seis segmentos (el TAMAÑO pasó a ser su propio paso)
// que se nombran por `aria-label` («QUESO (aquí)»), y los títulos pasaron a ser preguntas
// («¿Con queso?»). El defecto que esta prueba caza sigue siendo el mismo —que el orden de
// BYO_STEP_LABELS y el de los `if` que pintan cada paso se separen— y se sigue comparando
// una fuente contra la otra, nunca contra una lista escrita acá.
//
// Cada rótulo del riel se reconoce por la pregunta que le corresponde. Una palabra clave por
// paso, que no aparece en la pregunta de ningún otro.
const PREGUNTA_POR_ROTULO: Record<string, RegExp> = {
  'TAMAÑO': /tamaño/i,
  'PAN': /\bpan\b/i,
  'PROTEÍNA': /adentro/i,
  'QUESO': /queso/i,
  'VEGETALES': /encima/i,
  'SALSAS': /salsa/i,
};

async function entrarAlArmador(page: any) {
  await mockBackend(page);
  await page.goto(APP_FILE);
  await page.getByRole('button', { name: /Tú decides/ }).click();
  await page.waitForSelector('text=¿De qué tamaño?');
}
const siguiente = (page: any) => page.locator('button[onclick="byoStepNext()"]').click();
const rotuloActual = async (page: any) => {
  const aqui = page.locator('[aria-label$=" (aquí)"]');
  await expect(aqui, 'el riel debe tener exactamente un paso encendido').toHaveCount(1);
  return String(await aqui.getAttribute('aria-label')).replace(' (aquí)', '');
};

test('el paso encendido en el riel es el que la pantalla está pintando', async ({ page }) => {
  await entrarAlArmador(page);
  const vistos: string[] = [];
  for (let paso = 0; paso < 6; paso++) {
    const rotulo = await rotuloActual(page);
    const esperado = PREGUNTA_POR_ROTULO[rotulo];
    expect(esperado, `el riel encendió "${rotulo}", que no es ninguno de los seis pasos conocidos`).toBeTruthy();
    const titulo = (await page.locator('h2').first().innerText()).trim();
    expect(
      esperado.test(titulo),
      `el riel dice "${rotulo}" pero la pantalla pregunta "${titulo}" — ` +
        'el orden de BYO_STEP_LABELS dejó de coincidir con el de los `if` que eligen qué pintar',
    ).toBe(true);
    vistos.push(rotulo);

    if (paso === 0) await page.locator('[onclick*="size=\'15\'"]').click();
    if (paso === 1) await page.locator('[onclick^="base="]').first().click();
    if (paso === 2) await page.locator('[onclick^="prot="]').first().click();
    if (paso < 5) await siguiente(page);
  }
  expect(new Set(vistos).size, `el riel repitió un paso: ${JSON.stringify(vistos)}`).toBe(6);
});

// El segundo defecto del mismo cambio de orden: los rótulos pueden estar bien y el ATAJO al
// paso estar mal. Cada parte de «lo que llevas» (el resumen del pie) es un botón que vuelve
// a su paso, y el paso va escrito como número en BYO_LOQUELLEVAS (`i:3` el queso, `i:4` los
// vegetales). Si el orden cambia y ese número no, tocar «Cheddar» te lleva a los vegetales.
test('cada parte de «lo que llevas» vuelve a SU paso, no al de al lado', async ({ page }) => {
  await entrarAlArmador(page);
  await page.locator('[onclick*="size=\'15\'"]').click();
  await siguiente(page);
  await page.locator('[onclick^="base="]').first().click();
  await siguiente(page);
  await page.locator('[onclick^="prot="]').first().click();
  await siguiente(page);
  await page.locator('button', { hasText: /Cheddar/ }).first().click(); // queso
  await siguiente(page);
  await page.locator('[onclick*="\'T01\'"]').first().click(); // un vegetal
  await siguiente(page); // salsas: desde acá se ve el resumen completo

  const partes: [RegExp, string][] = [
    [/^15CM$/, 'TAMAÑO'],
    [/^Cheddar/, 'QUESO'],
    // El armador trae vegetales puestos por defecto: se busca la parte por la palabra, no
    // por la cuenta («5 vegetales»), que depende de esos defaults.
    [/vegetal/, 'VEGETALES'],
  ];
  for (const [texto, paso] of partes) {
    await page.locator('button[onclick^="byoIrAPaso("]', { hasText: texto }).first().click();
    expect(await rotuloActual(page), `tocar «${texto.source}» en lo que llevas tiene que volver a ${paso}`).toBe(paso);
    // Volver hasta las salsas para tocar la siguiente parte desde el mismo lugar.
    while ((await rotuloActual(page)) !== 'SALSAS') await siguiente(page);
  }
});
