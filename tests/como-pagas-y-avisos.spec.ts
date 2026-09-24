import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

// Tu cuenta · «Cómo pagas» y «Avisos». Lo que no puede pasar en silencio: que tocar un
// interruptor no mande nada al servidor (el cliente cree que apagó las promos y le siguen
// llegando), que mande el interruptor equivocado, o que la preferencia de pago no llegue al
// checkout (eligió tarjeta y el pago le abre en Yape).

const CLIENTE = { phone: '900000001', name: 'Cliente de Prueba', points: 0, credit_balance: 0 };

async function entrar(page, cliente: any, handlers: any = {}) {
  await gotoApp(page, {
    login: { customer: cliente, isAdmin: false, token: 'tok' },
    ...handlers,
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page);
}

test('apagar «Novedades» manda promo:false y deja el pedido encendido', async ({ page }) => {
  let enviado: any = null;
  await entrar(page, CLIENTE, {
    'set-preferences': (b: any) => { enviado = b; return { success: true, customer: { ...CLIENTE, notif_prefs: b.notifPrefs } }; },
  });
  await page.evaluate(() => { (window as any).sndScreen = 'p_profile'; (window as any).render(); });
  await page.locator('[role=button]', { hasText: 'Avisos' }).first().click();
  await page.getByRole('switch', { name: /Novedades y recordatorios/ }).click();
  await expect(page.getByRole('switch', { name: /Novedades y recordatorios/ })).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('switch', { name: /Tu pedido/ })).toHaveAttribute('aria-checked', 'true');
  expect(enviado.notifPrefs).toEqual({ pedido: true, promo: false });
});

test('elegir Tarjeta se guarda, y el checkout abre en tarjeta', async ({ page }) => {
  let enviado: any = null;
  await entrar(page, CLIENTE, {
    'set-preferences': (b: any) => { enviado = b; return { success: true, customer: { ...CLIENTE, preferred_payment: b.preferredPayment } }; },
  });
  await page.evaluate(() => { (window as any).sndScreen = 'p_profile'; (window as any).render(); });
  await page.locator('[role=button]', { hasText: 'Cómo pagas' }).first().click();
  await page.getByRole('radio', { name: /Tarjeta/ }).click();
  await expect(page.getByRole('radio', { name: /Tarjeta/ })).toHaveAttribute('aria-checked', 'true');
  expect(enviado.preferredPayment).toBe('culqi');
  const metodo = await page.evaluate(() => { (window as any).aplicarMetodoPreferido(); return (window as any).manualPayMethod; });
  expect(metodo).toBeNull();
});

test('sin preferencia, el checkout sigue abriendo en Yape', async ({ page }) => {
  await entrar(page, CLIENTE);
  const metodo = await page.evaluate(() => { (window as any).aplicarMetodoPreferido(); return (window as any).manualPayMethod; });
  expect(metodo).toBe('yape');
});
