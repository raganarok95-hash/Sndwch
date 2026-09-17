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

async function entrarAlArmador(page: any) {
  await mockBackend(page);
  await page.goto(APP_FILE);
  await page.getByRole('button', { name: /Tú decides/ }).click();
  await page.locator('text=/Elegir/i').first().click();
  await page.waitForSelector('[data-paso]');
}

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

test('los cinco pasos del armador se pueden recorrer y elegir con teclado', async ({ page }) => {
  await entrarAlArmador(page);

  const pasos = ['Pan', 'Proteína', 'Queso', 'Vegetales', 'Salsas'];
  for (let i = 0; i < pasos.length; i++) {
    const disfrazados = await controlesDisfrazados(page);
    expect(
      disfrazados,
      `en el paso "${pasos[i]}" hay controles que son <div onclick> en vez de <button>: ` +
        JSON.stringify(disfrazados) +
        ' — con mouse funcionan y con teclado no existen',
    ).toEqual([]);

    if (i === 0) {
      await page.locator('text=15CM').first().click();
      await page.locator('text=/Classic/').first().click();
    }
    if (i === 1) await page.locator('text=/Pollo/').first().click();
    if (i < 4) {
      await page.locator('button:has-text("Siguiente")').first().click();
      await page.waitForTimeout(220);
    }
  }
});

test('una ficha de vegetal dice si está puesta o no, no solo se ve distinta', async ({ page }) => {
  // El color no alcanza: un lector de pantalla no lo ve, y quien distingue mal los colores
  // tampoco. `aria-pressed` es lo que convierte "se ve dorada" en "está puesta".
  await entrarAlArmador(page);
  await page.locator('text=15CM').first().click();
  await page.locator('text=/Classic/').first().click();
  await page.locator('button:has-text("Siguiente")').first().click();
  await page.locator('text=/Pollo/').first().click();
  await page.locator('button:has-text("Siguiente")').first().click();  // queso
  await page.locator('button:has-text("Siguiente")').first().click();  // vegetales
  await page.waitForTimeout(250);

  const tomate = page.locator('button', { hasText: /^Tomate$/ }).first();
  await expect(tomate).toHaveAttribute('aria-pressed', 'false');
  await tomate.click();
  await expect(page.locator('button', { hasText: /^Tomate$/ }).first()).toHaveAttribute('aria-pressed', 'true');
});
