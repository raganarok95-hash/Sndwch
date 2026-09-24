import { test, expect } from '@playwright/test';
import { mockBackend, APP_FILE } from './helpers';

// TODO LO QUE SE ELIGE EN EL ARMADOR SE PUEDE ELEGIR CON TECLADO
//
// El panel ya había tenido que corregir esto en su cajón de navegación: un `<div onclick>`
// no se alcanza con Tab, no se anuncia como control y no responde a Enter. Al rehacer los
// cinco pasos del armador (2026-09-17) era fácil repetir el mismo patrón — es el que tenía
// la app anterior en cada tarjeta.
//
// MODO DE FALLO: SILENCIO, y del peor tipo. Con el mouse funciona todo, así que nadie que
// pruebe la app se entera. Quien se entera es el cliente que navega con teclado o con
// lector de pantalla, y lo que descubre no es que "se ve raro": es que no puede pedir.
//
// La prueba recorre los cinco pasos y exige que cada control de elección sea un <button>.
// No cuenta cuántos hay —eso cambiaría con cada ingrediente nuevo del catálogo— sino que
// NINGUNO sea un div clickeable.

// Se entra por la puerta, eligiendo la mitad de WICHO («Tú decides»): así llega un cliente
// nuevo. El armador abre directo en el TAMAÑO — ya no hay una pantalla intermedia con
// «Elegir», que era de la app anterior y dejó a esta prueba esperando 30 s.
async function entrarAlArmador(page: any) {
  await mockBackend(page);
  await page.goto(APP_FILE);
  await page.getByRole('button', { name: /Tú decides/ }).click();
  await page.waitForSelector('text=¿De qué tamaño?');
}

// Avanzar se busca por lo que hace, no por su rótulo («Siguiente» / «Listo» / la pista).
const siguiente = (page: any) => page.locator('button[onclick="byoStepNext()"]').click();

// Un div con onclick que además es visible: eso es un control disfrazado.
async function controlesDisfrazados(page: any): Promise<string[]> {
  return page.evaluate(() => {
    const fuera: string[] = [];
    document.querySelectorAll('#app div[onclick]').forEach((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      const txt = ((el as HTMLElement).innerText || '').trim().split('\n')[0].slice(0, 40);
      fuera.push(txt || '(sin texto)');
    });
    return fuera;
  });
}

test('los seis pasos del armador se pueden recorrer y elegir con teclado', async ({ page }) => {
  await entrarAlArmador(page);

  // Seis desde que el TAMAÑO pasó a ser su propio paso, antes del pan.
  const pasos = ['Tamaño', 'Pan', 'Proteína', 'Queso', 'Vegetales', 'Salsas'];
  for (let i = 0; i < pasos.length; i++) {
    const disfrazados = await controlesDisfrazados(page);
    expect(
      disfrazados,
      `en el paso "${pasos[i]}" hay controles que son <div onclick> en vez de <button>: ` +
        JSON.stringify(disfrazados) +
        ' — con mouse funcionan y con teclado no existen',
    ).toEqual([]);

    if (i === 0) await page.locator('[onclick*="size=\'15\'"]').click();
    if (i === 1) await page.locator('[onclick^="base="]').first().click();
    if (i === 2) await page.locator('[onclick^="prot="]').first().click();
    if (i < pasos.length - 1) {
      await siguiente(page);
      await expect(page.locator(`[aria-label="${pasos[i + 1].toUpperCase()} (aquí)"]`)).toHaveCount(1);
    }
  }
});

test('una ficha de vegetal dice si está puesta o no, no solo se ve distinta', async ({ page }) => {
  // El color no alcanza: un lector de pantalla no lo ve, y quien distingue mal los colores
  // tampoco. `aria-pressed` es lo que convierte "se ve dorada" en "está puesta".
  await entrarAlArmador(page);
  await page.locator('[onclick*="size=\'15\'"]').click();
  await siguiente(page); // tamaño -> pan
  await page.locator('[onclick^="base="]').first().click();
  await siguiente(page); // pan -> proteína
  await page.locator('[onclick^="prot="]').first().click();
  await siguiente(page); // proteína -> queso
  await siguiente(page); // queso -> vegetales
  await expect(page.locator('[aria-label="VEGETALES (aquí)"]')).toHaveCount(1);

  // El armador trae vegetales puestos por defecto, así que el tomate puede empezar marcado o
  // no. Lo que se exige es que `aria-pressed` diga el estado REAL y se invierta al tocarlo.
  const tomate = () => page.locator('button[onclick*="\'T01\'"]').first();
  const antes = await tomate().getAttribute('aria-pressed');
  expect(['true', 'false'], 'la ficha tiene que decir si está puesta').toContain(antes);
  await tomate().click();
  await expect(tomate()).toHaveAttribute('aria-pressed', antes === 'true' ? 'false' : 'true');
  const puesto = await page.evaluate(() => (window as any).tops.includes('T01'));
  expect(String(puesto), 'aria-pressed tiene que coincidir con lo que de verdad lleva el sándwich').toBe(await tomate().getAttribute('aria-pressed'));
});
