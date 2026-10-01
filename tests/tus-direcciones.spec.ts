import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// TUS DIRECCIONES (2026-10-01). Modo de fallo: SILENCIO — una dirección que se escribe y no se
// manda, una corrección que crea otra en vez de cambiar la misma, o la pantalla vieja de vuelta.
const CASA = { id: 'a1', label: 'Casa', address: 'Av. España 123', reference: 'Portón negro' };

async function aLasDirecciones(page: any, enviados: any[], iniciales: any[] = [CASA]) {
  let lista = [...iniciales];
  await gotoApp(page, {
    'addresses-list': () => ({ addresses: lista }),
    'addresses-add': (b: any) => { enviados.push(['add', b]); lista = [...lista, { id: 'a2', label: b.label, address: b.address, reference: b.reference }]; return { success: true }; },
    'addresses-update': (b: any) => { enviados.push(['update', b]); lista = lista.map((a) => a.id === b.id ? { ...a, label: b.label, address: b.address, reference: b.reference } : a); return { success: true }; },
    'addresses-delete': (b: any) => { enviados.push(['delete', b]); lista = lista.filter((a) => a.id !== b.id); return { success: true }; },
    'my-orders': { orders: [] },
  });
  await page.evaluate(() => { const w = window as any; w.cust = { id: 'c1', name: 'Ana', phone: '900000001', points: 0, total_orders: 1 }; w.token = 'tok'; w.volverALaPuerta(); });
  await page.locator('.pta .yo').click();
  await page.locator('.mcu .r', { hasText: 'Tus direcciones' }).click();
  await page.locator('.mdir').waitFor();
}

test('la cuenta trae las direcciones del servidor y se ven en la pantalla nueva', async ({ page }) => {
  await aLasDirecciones(page, []);
  await expect(page.locator('.mdir .r.dir')).toHaveCount(1);
  await expect(page.locator('.mdir .r.dir')).toContainText('Av. España 123');
  await expect(page.locator('.bottom-nav')).toHaveCount(0);
});

test('agregar una dirección la manda con su referencia y aparece en la lista', async ({ page }) => {
  const env: any[] = [];
  await aLasDirecciones(page, env);
  await page.fill('#na-label', 'Trabajo');
  await page.fill('#na-addr', 'Jr. Pizarro 456');
  await page.fill('#na-ref', 'Piso 3');
  await page.getByRole('button', { name: 'Guardar la dirección' }).click();
  await expect(page.locator('.mdir .r.dir')).toHaveCount(2);
  expect(env[0][0]).toBe('add');
  expect(env[0][1]).toMatchObject({ label: 'Trabajo', address: 'Jr. Pizarro 456', reference: 'Piso 3' });
});

test('corregir cambia la MISMA dirección, no crea otra', async ({ page }) => {
  const env: any[] = [];
  await aLasDirecciones(page, env);
  await page.locator('.mdir .r.dir button', { hasText: 'Corregir' }).click();
  await expect(page.locator('#na-addr')).toHaveValue('Av. España 123');
  await page.fill('#na-addr', 'Av. España 125');
  await page.getByRole('button', { name: 'Guardar los cambios' }).click();
  await expect(page.locator('.mdir .r.dir')).toHaveCount(1);
  await expect(page.locator('.mdir .r.dir')).toContainText('Av. España 125');
  expect(env.map((e) => e[0])).toEqual(['update']);
  expect(env[0][1].id).toBe('a1');
});

test('sin nombre o sin dirección no se manda nada y se dice por qué', async ({ page }) => {
  const env: any[] = [];
  await aLasDirecciones(page, env, []);
  await page.getByRole('button', { name: 'Guardar la dirección' }).click();
  await expect(page.locator('#na-msg')).toContainText('Completa');
  expect(env).toEqual([]);
});
