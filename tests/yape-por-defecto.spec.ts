import { test, expect } from '@playwright/test';
import { irAlArmador, siguientePaso, gotoApp, PIN_TEST, entrarConTelefono } from './helpers';
import { unPanConRecargo, unPanSinRecargo } from './carta';
import { CARTA } from '../supabase/functions/_shared/carta.ts';

// El pan con recargo y cuánto suma, preguntados a la carta.
const CON_RECARGO = unPanConRecargo();
const RECARGO = CARTA.panes.find((p) => p.id === CON_RECARGO)!.recargo!;
const enPantalla = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

// SND//WCH — Yape/Plin es el método de pago por DEFECTO (2026-09-03) y la focaccia
// se cobra (recargo de pan).
//
// POR QUÉ EXISTE ESTE ARCHIVO. El default arrancaba en tarjeta, o sea que quien no tocaba
// el selector pagaba la comisión de Culqi (5.5%) sin haber elegido nada. Al volumen del
// plan, mover ese reparto vale ~S/487 al mes sin adquirir un solo cliente más.
//
// Su modo de fallo NO es una excepción: si alguien "limpia" el estado inicial de vuelta a
// null, nada revienta — el checkout sigue funcionando, los tipos siguen compilando, y el
// negocio simplemente vuelve a pagar la comisión en silencio. Por eso lo que se fija acá
// es el ESTADO INICIAL y el TOTAL, no que la pantalla no explote.

// Arma un Signature de 15CM y llega al checkout inline (pago rápido, carrito vacío) sin
// tocar el selector de pago. Ese "sin tocar" es todo el punto del archivo.
async function alCheckoutSinElegirPago(page: any) {
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
  await page.locator('#o-nom').fill('Cliente Default');
  await page.locator('#o-phone').fill('987654321');
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');
  await page.locator('#o-district').selectOption('trujillo');
}









// ── RECARGO POR PAN DE FOCACCIA ──────────────────────────────────────────────────────
//
// [MEDIDO] dueño 2026-09-03: de una focaccia de S/13 salen 10 de 15CM o 5 de 30CM.
// Sobrecosto real sobre el pan sub: +S/0.30 y +S/0.60. Se cobra S/0.50 y S/1.00.

test('el recargo de la focaccia se ve ANTES de elegirla y entra al precio', async ({ page }) => {
  await gotoApp(page);
  await irAlArmador(page);
  await page.locator('[onclick*="size=\'15\'"]').click();
  await siguientePaso(page); // tamaño -> pan: el recargo tiene que estar en la tarjeta del pan

  // El monto está en la tarjeta del pan, en el paso de elegir — no aparece recién en el
  // carrito. Un precio que sale después de haber elegido es la clase de sorpresa que hace
  // abandonar el pedido.
  await expect(page.locator(`[onclick*="base='${CON_RECARGO}'"]`)).toContainText(`+S/${enPantalla(RECARGO.p15)}`);
  await expect(page.locator(`[onclick*="base='${unPanSinRecargo()}'"]`)).not.toContainText('+S/');

  // El 30CM cobra el doble, porque usa el doble de pan. El tamaño es su propio paso desde el
  // rediseño del armador: se vuelve atrás, se cambia, y se regresa al pan.
  await page.locator('button[onclick="byoStepBack()"]').click();
  await page.locator('[onclick*="size=\'30\'"]').click();
  await siguientePaso(page);
  // pz() no escribe decimales cuando no hacen falta (S/1, no S/1.00).
  await expect(page.locator(`[onclick*="base='${CON_RECARGO}'"]`)).toContainText(`+S/${enPantalla(RECARGO.p30)}`);
  await expect(page.locator(`[onclick*="base='${CON_RECARGO}'"]`)).not.toContainText(`+S/${enPantalla(RECARGO.p15)}`);
});
