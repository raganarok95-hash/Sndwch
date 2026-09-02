import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Lote E6 — las dos pantallas nuevas del panel: Salud técnica y Cumplimiento.
//
// El cálculo de las siete señales está probado contra el servidor real en
// tests-api/higiene-tecnica.test.ts. Lo que se fija ACÁ es lo que decide si sirven de algo:
// que cada número llegue con lo que hay que hacer con él, y —más importante— que la
// AUSENCIA de dato se vea como ausencia y no como un cero tranquilizador. Una pantalla que
// dice "0% de entregas tarde" porque nadie registró ninguna hora es peor que no tenerla.

const ADMIN = {
  login: { customer: { phone: '900000099', name: 'Dueño', points: 0, credit_balance: 0, total_orders: 0 }, isAdmin: true, token: 'tok-admin' },
  'admin-orders': { orders: [], truncated: false },
};

const MB = 1024 * 1024;

const TECH_SANO = {
  db: { usedBytes: 40 * MB, limitBytes: 500 * MB, usedPct: 0.08, warn: false, tables: [{ table_name: 'orders', total_bytes: 12 * MB, row_estimate: 800 }] },
  latency: { samples: 0, p50: null, p95: null, worst: null, warn: false },
  staleAdmins: [],
  adminCount: 1,
  staleDays: 60,
};

const CUMPLIMIENTO_SANO = {
  windowDays: 90,
  delivery: { delivered: 0, measured: 0, onTime: 0, onTimePct: null, avgMinutes: null, p90Minutes: null, worst: [] },
  repeatComplaints: [],
  complaints: [],
};

async function entrarAlPanel(page: any, mocks: Record<string, unknown>) {
  await gotoApp(page, { ...ADMIN, ...mocks });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000099');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').first().click();
}

async function abrirSaludTecnica(page: any, data: Record<string, unknown>) {
  await entrarAlPanel(page, { 'admin-tech-health': data });
  await page.locator('[onclick*="loadTechHealth"]').first().click();
  await expect(page.locator('text=ESPACIO EN LA BASE //')).toBeVisible();
}

async function abrirCumplimiento(page: any, data: Record<string, unknown>) {
  await entrarAlPanel(page, { 'admin-compliance': data });
  await page.locator('[onclick*="loadCompliance"]').first().click();
}

test('el espacio de la base se muestra con lo que pasa al topar, no solo con el porcentaje', async ({ page }) => {
  // "82%" a secas no dice nada. Lo que hay que saber es que al llegar la base pasa a solo
  // lectura y el negocio DEJA DE TOMAR PEDIDOS — no es una degradación gradual.
  await abrirSaludTecnica(page, { ...TECH_SANO, db: { ...TECH_SANO.db, usedBytes: 410 * MB, usedPct: 0.82, warn: true } });
  await expect(page.locator('text=82%')).toBeVisible();
  await expect(page.locator('text=/solo lectura/')).toBeVisible();
  await expect(page.locator('text=/deja de tomar pedidos|deje de entrar cualquier pedido/')).toBeVisible();
});

test('cuando hay espacio de sobra igual se explica el límite, sin alarma', async ({ page }) => {
  await abrirSaludTecnica(page, TECH_SANO);
  await expect(page.locator('text=8%')).toBeVisible();
  await expect(page.locator('text=40 MB de 500 MB')).toBeVisible();
  await expect(page.locator('text=/El plan gratuito da 500 MB/')).toBeVisible();
});

test('sin peticiones lentas se dice que eso es lo bueno, no se muestra un 0 ms', async ({ page }) => {
  // Un "0 ms" se leería como una medición instantánea. Solo se anotan las lentas, así que
  // no tener ninguna es el resultado deseado y hay que decirlo con esas palabras.
  await abrirSaludTecnica(page, TECH_SANO);
  await expect(page.locator('text=/Ninguna petición pasó/')).toBeVisible();
  await expect(page.locator('text=/0 ms/')).toHaveCount(0);
});

test('el p95 se muestra y se explica por qué no es el promedio', async ({ page }) => {
  await abrirSaludTecnica(page, {
    ...TECH_SANO,
    latency: { samples: 20, p50: 1300, p95: 9000, worst: 9000, warn: true },
  });
  await expect(page.locator('text=9000 ms').first()).toBeVisible();
  await expect(page.locator('text=/no mueve el promedio/')).toBeVisible();
});

test('una cuenta admin que nunca entró se muestra con qué hacer al respecto', async ({ page }) => {
  // Señalar la cuenta sin decir dónde se quita el acceso deja al dueño buscando la pantalla.
  await abrirSaludTecnica(page, {
    ...TECH_SANO,
    adminCount: 2,
    staleAdmins: [{ phone: '900000077', name: 'Ex ayudante', daysSince: null, neverLoggedIn: true }],
  });
  await expect(page.locator('text=Ex ayudante')).toBeVisible();
  await expect(page.locator('text=/Nunca ha entrado/')).toBeVisible();
  await expect(page.locator('text=/Administradores/')).toBeVisible();
});

test('con una sola cuenta admin activa no queda una alerta permanente', async ({ page }) => {
  await abrirSaludTecnica(page, TECH_SANO);
  await expect(page.locator('text=/ninguna abandonada/')).toBeVisible();
  await expect(page.locator('text=/Nunca ha entrado/')).toHaveCount(0);
});

test('sin horas de entrega registradas NO se muestra un porcentaje de cumplimiento', async ({ page }) => {
  // El fallo más caro de esta pantalla: un "100% a tiempo" calculado sobre cero entregas
  // medidas. Un número inventado que se ve bien es peor que la ausencia de número.
  await abrirCumplimiento(page, CUMPLIMIENTO_SANO);
  await expect(page.locator('text=/Todavía no hay ningún pedido con hora de entrega/')).toBeVisible();
  await expect(page.locator('text=LLEGARON A TIEMPO //')).toHaveCount(0);
});

test('con entregas medidas se muestra el porcentaje, el p90 y los peores', async ({ page }) => {
  await abrirCumplimiento(page, {
    ...CUMPLIMIENTO_SANO,
    delivery: {
      delivered: 10, measured: 10, onTime: 9, onTimePct: 0.9, avgMinutes: 45, p90Minutes: 180,
      worst: [{ ref: 'ORD-TARDE', minutes: 180, promised: 40 }],
    },
  });
  await expect(page.locator('text=90%')).toBeVisible();
  await expect(page.locator('text=180 min').first()).toBeVisible();
  await expect(page.locator('text=ORD-TARDE')).toBeVisible();
  await expect(page.locator('text=/El promedio esconde la cola/')).toBeVisible();
});

test('un cliente que reclamó dos veces se muestra con sus dos códigos', async ({ page }) => {
  await abrirCumplimiento(page, {
    ...CUMPLIMIENTO_SANO,
    repeatComplaints: [{ phone: '111', name: 'Ana', count: 2, kinds: ['reclamo'], codes: ['R-1', 'R-2'], lastAt: '2026-09-05' }],
  });
  await expect(page.getByText('Ana', { exact: true })).toBeVisible();
  await expect(page.locator('text=R-1 · R-2')).toBeVisible();
});

test('sin reincidentes no queda una franja de alerta permanente', async ({ page }) => {
  await abrirCumplimiento(page, CUMPLIMIENTO_SANO);
  await expect(page.locator('text=/Nadie ha reclamado dos veces/')).toBeVisible();
});

test('el consolidado del Libro se puede descargar y nombra cuántos registros lleva', async ({ page }) => {
  await abrirCumplimiento(page, {
    ...CUMPLIMIENTO_SANO,
    complaints: [
      { claimCode: 'R-1', createdAt: '2026-09-01', kind: 'reclamo', consumerName: 'Ana', consumerDni: '12345678', orderRef: 'ORD-1', claimedAmount: 20.9, status: 'abierto', respondedAt: null },
    ],
  });
  await expect(page.locator('text=/1 registro en la ventana/')).toBeVisible();
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: /Descargar consolidado/ }).click();
  const archivo = await descarga;
  expect(archivo.suggestedFilename()).toContain('libro-reclamaciones');
});

test('si el servidor falla, cada pantalla ofrece reintentar en vez de quedarse en blanco', async ({ page }) => {
  await entrarAlPanel(page, { 'admin-tech-health': () => { throw new Error('boom'); } });
  await page.locator('[onclick*="loadTechHealth"]').first().click();
  await expect(page.locator('text=No se pudo cargar //')).toBeVisible();
  await expect(page.getByRole('button', { name: /Reintentar/ })).toBeVisible();
});
