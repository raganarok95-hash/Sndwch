import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// C5 — El panel de negocio ya responde "¿cómo va el negocio?" (ingresos, productos top,
// retención). La pregunta que faltaba es otra: "¿hay algo que atender AHORA?" — y para
// contestarla había que entrar a la cola, al inventario, a reclamaciones y al dashboard
// por separado y deducirlo. Cocinando solo, eso no pasa.
//
// Lo que fija este test: el veredicto viene del servidor y la pantalla solo lo pinta (si
// cada versión de la app decidiera por su cuenta qué es "problema", dos pantallas dirían
// cosas distintas del mismo estado); las señales en verde se muestran igual que las rojas
// (una lista que solo aparece cuando hay problemas hace que el silencio se lea como "no
// hay chequeo"); y cada señal roja lleva a la pantalla donde se arregla.

const MOCK_ORDER = {
  id: 'ord-health-1',
  ref: 'ORD-HLT0001-AAAA',
  customer_name: 'Cliente',
  customer_address: 'Av. Test 1',
  contact_phone: '987654321',
  summary: '1x SIGNATURE THE ORIGINAL',
  total: 22,
  status: 'RECIBIDO',
  payment_status: 'paid',
  payment_method: 'culqi',
  created_at: new Date().toISOString(),
};

function salud(overall: string, signals: any[]) {
  return { checkedAt: new Date().toISOString(), overall, signals };
}

async function abrirSalud(page: any) {
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').click();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible({ timeout: 10000 });
  await page.locator('[onclick*="loadHealth()"]').first().click();
  await expect(page.locator('text=SALUD DEL NEGOCIO')).toBeVisible();
}

test('todo en verde dice explícitamente que no hay nada pendiente', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    'admin-health': () =>
      salud('ok', [
        { id: 'pagos', label: 'Pagos por confirmar', count: 0, level: 'ok', hint: 'Ninguno esperando.', screen: 'admin_home' },
        { id: 'reclamos', label: 'Reclamos por vencer', count: 0, level: 'ok', hint: 'Ninguno cerca del plazo.', screen: 'admin_complaints' },
      ]),
  });
  await abrirSalud(page);

  await expect(page.locator('text=/Nada pendiente/')).toBeVisible();
  // Las señales en verde SÍ se listan: es lo que dice qué se está vigilando.
  await expect(page.locator('text=Pagos por confirmar')).toBeVisible();
  await expect(page.locator('text=Reclamos por vencer')).toBeVisible();
});

test('una señal en rojo se marca y lleva a la pantalla donde se arregla', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    'get-catalog': { inventory: {} },
    'admin-health': () =>
      salud('problema', [
        { id: 'pagos', label: 'Pagos por confirmar', count: 0, level: 'ok', hint: 'Ninguno esperando.', screen: 'admin_home' },
        { id: 'agotados', label: 'Insumos agotados', count: 2, level: 'atencion', hint: 'RES // ASADO, POLLO // TERIYAKI', screen: 'admin_inventory' },
      ]),
  });
  await abrirSalud(page);

  await expect(page.locator('text=/Hay algo que atender ahora/')).toBeVisible();
  await expect(page.locator('text=/RES \\/\\/ ASADO/')).toBeVisible();

  // El valor de esta vista es acortar el camino entre enterarse y resolver.
  await page.locator('text=Insumos agotados').click();
  await expect(page.locator('text=INVENTARIO')).toBeVisible();
});

test('el veredicto lo decide el servidor, la pantalla no lo recalcula', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    // Conteos en cero pero el servidor dice "atención": la pantalla debe respetarlo. Si
    // dedujera el nivel del número, acá pintaría verde y contradiría al servidor.
    'admin-health': () =>
      salud('atencion', [
        { id: 'bajo_stock', label: 'Insumos por acabarse', count: 0, level: 'atencion', hint: 'Algo que solo el servidor sabe.', screen: 'admin_inventory' },
      ]),
  });
  await abrirSalud(page);

  await expect(page.locator('text=/Nada urgente, pero hay cosas que conviene mirar/')).toBeVisible();
});

test('si la revisión falla lo dice, en vez de mostrar una pantalla vacía', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    // Un handler que lanza simula un error real del servidor (ver mockBackend).
    'admin-health': () => {
      throw new Error('Error interno del servidor.');
    },
  });
  await abrirSalud(page);

  // Una pantalla de salud en blanco se lee como "todo bien", que es lo peor que puede
  // decir cuando en realidad no pudo revisar nada.
  await expect(page.locator('text=Error interno del servidor.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reintentar //' })).toBeVisible();
});
