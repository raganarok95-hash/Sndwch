import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// #50 — El botón que genera los borradores del calendario.
//
// La lógica de QUÉ fechas se generan está probada en tests-api/calendario-contenido.test.ts,
// contra el código real del servidor. Lo que se fija acá es lo otro: que la acción sea
// ALCANZABLE desde el panel. Este repo ya tuvo el caso contrario — el generador de guion de
// video estaba implementado y desplegado y no había ninguna pantalla desde donde llamarlo
// (D5), o sea código muerto que en los tests y el typecheck se ve idéntico a código vivo.

const ADMIN = {
  login: { customer: { phone: '900000099', name: 'Dueño', points: 0, credit_balance: 0, total_orders: 0 }, isAdmin: true, token: 'tok-admin' },
  'admin-list-raw-uploads': { uploads: [] },
};

async function entrarAlCalendario(page: any, extra: Record<string, unknown> = {}) {
  const calls = await gotoApp(page, { ...ADMIN, ...extra });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000099');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').first().click();
  await page.locator('[onclick*="loadCalendar()"]').first().click();
  await expect(page.getByRole('button', { name: /Generar las próximas 4 semanas/ })).toBeVisible();
  return calls;
}

test('el botón existe y pide al servidor generar los borradores', async ({ page }) => {
  const calls = await entrarAlCalendario(page, {
    'admin-calendar-list': { entries: [] },
    'admin-calendar-generate': { success: true, creados: 4, fechas: ['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28'] },
  });
  await page.getByRole('button', { name: /Generar las próximas 4 semanas/ }).click();
  await expect(page.locator('text=/4 borradores nuevos/')).toBeVisible();

  const gen = calls.filter((c) => c.action === 'admin-calendar-generate');
  expect(gen).toHaveLength(1);
  expect(gen[0].body.weeks).toBe(4);
  // Y vuelve a leer la lista: sin esto el dueño tocaría el botón y vería la misma pantalla
  // vacía, sin ninguna señal de que funcionó.
  expect(calls.filter((c) => c.action === 'admin-calendar-list').length).toBeGreaterThan(1);
});

test('si no había nada que generar lo dice, en vez de fingir que hizo algo', async ({ page }) => {
  // El cron ya deja los borradores solo cada semana, así que el caso normal de tocar el
  // botón a mano es que no quede ninguna fecha libre. Un "Listo: 0 borradores" sonaría a
  // error; callarse sonaría a que el botón no hace nada.
  await entrarAlCalendario(page, {
    'admin-calendar-list': { entries: [] },
    'admin-calendar-generate': { success: true, creados: 0, fechas: [] },
  });
  await page.getByRole('button', { name: /Generar las próximas 4 semanas/ }).click();
  await expect(page.locator('text=/ya estaban planeadas/')).toBeVisible();
});

test('un fallo del servidor no deja la pantalla colgada en "Generando..."', async ({ page }) => {
  await entrarAlCalendario(page, {
    'admin-calendar-list': { entries: [] },
    'admin-calendar-generate': () => { throw new Error('La tabla no responde.'); },
  });
  await page.getByRole('button', { name: /Generar las próximas 4 semanas/ }).click();
  await expect(page.locator('text=/No se pudo generar/')).toBeVisible();
  // El botón vuelve a estar disponible: si el spinner se quedara puesto, el dueño tendría
  // que recargar la app entera para reintentar.
  await expect(page.getByRole('button', { name: /Generar las próximas 4 semanas/ })).toBeVisible();
});
