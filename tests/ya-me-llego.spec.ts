import { test, expect } from '@playwright/test';
import { APP_FILE, mockBackend, stubWindowOpen } from './helpers';

// «YA ME LLEGÓ» DESDE EL AVISO (2026-10-08, docs/PANEL_NUEVO.md §8).
// Promesa: un invitado que cerró la app abre el aviso de «va en camino» (?pedido=REF) y llega a
// SU pedido con «Ya me llegó», que le avisa al servidor con ese ref.
// Modo de fallo silencioso: la app no pide cuenta, así que casi todos son invitados. Si el enlace
// no lleva al pedido, nadie cierra el suyo, nadie se queja, y la medición de entregas reales (con
// la que se decide si los pedidos pagados se cierran por tiempo) sale vacía.
test('un invitado abre su pedido desde el aviso y avisa que llegó', async ({ page }) => {
  const REF = 'R-9901';
  const PEDIDO = {
    id: '99019901-1111-4111-8111-111111111111', ref: REF, status: 'EN CAMINO', payment_method: 'yape', payment_status: 'paid',
    total: 30, delivery_fee: 5, items: [], summary: 'pedido de prueba', created_at: new Date().toISOString(),
  };
  const pedidos: any[] = [];
  const cerrados: any[] = [];
  await mockBackend(page, {
    'my-orders': (b: any) => { pedidos.push(b); return { orders: [PEDIDO] }; },
    'confirm-my-delivery': (b: any) => { cerrados.push(b); return { success: true, ref: REF }; },
    '*': { success: true },
  });
  await stubWindowOpen(page);
  await page.goto(APP_FILE + '?pedido=' + REF);
  await page.locator('[data-accion="ya-me-llego"]').click();
  await expect.poll(() => cerrados.length).toBe(1);
  expect(cerrados[0].ref).toBe(REF);
  // Sin sesión: lo buscó por el ref del enlace, que es la llave del invitado.
  expect(pedidos[0].ref).toBe(REF);
  expect(pedidos[0].token).toBeFalsy();
});
