import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// LA TARJETA DE REGALO ESTÁ APAGADA PARA LA APERTURA
//
// ⚠ ESTE ARCHIVO CAMBIÓ DE TRABAJO EL 2026-09-23. Antes ejercitaba el flujo completo de
// regalar crédito con puntos; el dueño lo RETIRÓ para la apertura, así que ese flujo ya no existe
// en el cliente y aquellas pruebas afirmaban un estado que dejó de ser cierto.
//
// No se borraron: se reescribieron para fijar el estado NUEVO, que es lo que hay que
// proteger ahora — que la app no OFREZCA algo que el servidor va a rechazar. El flujo viejo
// vive en el historial de git y vuelve entero el día que se prenda
// TARJETA_REGALO_ACTIVA (está en el servidor y en src/app/01-*, los dos a la vez).
//
// Por qué se retiró: le pide al cliente 2 000 puntos (S/50 = cinco sándwiches gratis de por medio) por adelantado antes de que
// conozca el negocio. Ver docs/PROMESAS_SIN_RESPALDO.md.

test('la cuenta no ofrece la tarjeta de regalo mientras esté apagado', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 5000, credit_balance: 0 }, isAdmin: false, token: 'tok-ana' },
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page);
  // La oferta vivía en «Mi perfil», no en la pantalla de puntos. La primera versión de esta
  // prueba miraba la pantalla de puntos, así que PASABA con la oferta encendida: no vigilaba
  // nada. Se comprobó prendiendo la bandera a propósito — ver docs/AUDITORIA_CLASES_DE_ERROR.md.
  await page.locator('[onclick*="sndScreen=\'p_profile\'"]').first().click();
  await expect(page.getByText('Eliminar mi cuenta permanentemente')).toBeVisible();

  // Con 5 000 puntos le alcanzaría de sobra: si apareciera, sería porque está encendido,
  // no porque el cliente no califica. Se busca el ACCESO a la pantalla, no el rótulo del
  // botón, que puede reescribirse sin que la oferta deje de estar ahí.
  await expect(page.locator('[onclick*="sndScreen=\'gift_card\'"]')).toHaveCount(0);
});
