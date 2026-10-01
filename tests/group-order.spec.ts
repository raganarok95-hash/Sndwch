import { test, expect } from '@playwright/test';
import { gotoApp, mockBackend, stubWindowOpen, APP_FILE, entrarConTelefono, cartaDeLaApp } from './helpers';

// Pedido grupal: quien organiza necesita cuenta (crea/cierra), pero contribuir NO
// (solo un nombre) — dos flujos separados que valen la pena cubrir por separado.

test('alguien sin cuenta se une por link y agrega su pedido', async ({ page }) => {
  const calls = await mockBackend(page, {
    'get-group-order': { code: 'ABC123', status: 'open', organizerName: 'Ana Cliente', expiresAt: new Date(Date.now() + 3600000).toISOString(), items: [], total: 0, isOrganizer: false },
    'add-group-item': { success: true },
  });
  await stubWindowOpen(page);
  await page.goto(APP_FILE + '?group=ABC123');
  await page.waitForSelector('text=PEDIDO GRUPAL');
  await expect(page.getByText('Pedido grupal · #ABC123')).toBeVisible();
  // Countdown de 15 min (ventana corta a propósito, ver GROUP_ORDER_WINDOW_MINUTES) —
  // el mock expira en 1h así que alcanza a mostrar minutos de sobra sin acercarse a 0.
  await expect(page.getByText(/les quedan \d+ minutos/i)).toBeVisible();

  await page.locator('#grp-name').fill('Beto');
  await page.getByRole('button', { name: 'AGREGAR' }).first().click();

  await expect(page.getByText(/^Agregado: .* Lo ves arriba/)).toBeVisible({ timeout: 10000 });

  const addCall = calls.find((c) => c.action === 'add-group-item');
  expect(addCall).toBeTruthy();
  expect(addCall!.body.code).toBe('ABC123');
  expect(addCall!.body.contributorName).toBe('Beto');
  expect(addCall!.body.item.type).toBe('sig');
  expect(addCall!.body.item.size).toBe('15');
  // Invitado sin cuenta manda token vacío — el servidor lo usa solo para distinguir si
  // quien agrega es quien organizó (y así no notificarle su propio pedido a sí mismo).
  expect(addCall!.body.token).toBe('');
});



// Antes solo se podían agregar Signatures al pedido grupal (SIGS.filter en sGroupOrder) —
// quien solo quería sumar una bebida sin sándwich no tenía forma de hacerlo (hallazgo de
// auditoría UX). Cubre la nueva sección BEBIDAS Y SIDES // y doAddGroupSide().
test('alguien sin cuenta agrega solo una bebida al pedido grupal, sin sándwich', async ({ page }) => {
  const calls = await mockBackend(page, {
    'get-group-order': { code: 'ABC123', status: 'open', organizerName: 'Ana Cliente', expiresAt: new Date(Date.now() + 3600000).toISOString(), items: [], total: 0, isOrganizer: false },
    'add-group-item': { success: true },
  });
  await stubWindowOpen(page);
  await page.goto(APP_FILE + '?group=ABC123');
  await page.waitForSelector('text=PEDIDO GRUPAL');

  await page.locator('#grp-name').fill('Beto');
  await page.getByRole('button', { name: 'AGREGAR' }).last().click();

  await expect(page.getByText(/^Agregado: .* Lo ves arriba/)).toBeVisible({ timeout: 10000 });

  const addCall = calls.find((c) => c.action === 'add-group-item');
  expect(addCall).toBeTruthy();
  expect(addCall!.body.code).toBe('ABC123');
  expect(addCall!.body.contributorName).toBe('Beto');
  expect(addCall!.body.item.type).toBe('side');
  expect(addCall!.body.item.code).toBeTruthy();
});
