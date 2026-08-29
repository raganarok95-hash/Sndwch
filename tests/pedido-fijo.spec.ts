import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// #60 — Pedido fijo (recurrente). Ingreso predecible, que es justo lo que le falta a un
// negocio nuevo.
//
// LO QUE ESTE TEST PROTEGE SOBRE TODO: que la app NUNCA prometa cobrar sola. El token de
// tarjeta de Culqi es de un solo uso y vive 5 minutos, así que un cobro automático es
// imposible sin guardar la tarjeta del cliente — decisión del dueño, no de este código. Si
// alguien "mejora" el texto a "se cobra solo cada semana", la promesa se vuelve falsa y el
// cliente se entera el día que esperaba su sándwich y no llegó. Es la misma clase de promesa
// que ya obligó a retirar los badges MÁS PEDIDO y EDICIÓN LIMITADA.

const CLIENTE = { phone: '900000001', name: 'Cliente Fijo', points: 100, total_orders: 3 };

async function loguearYArmarCarrito(page: any) {
  await page.locator('.bottom-nav').getByRole('button', { name: 'Puntos' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill(CLIENTE.phone);
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('.bottom-nav').getByRole('button', { name: 'Pedido' }).click();
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  // Con un solo ítem la app va al "pago rápido" inline, no al carrito. El bloque de pedido
  // fijo vive en el CARRITO, que es donde el cliente ya está mirando el pedido completo —
  // se llega por el ícono del header.
  await page.locator('[aria-label="Ver carrito"]').click();
}

test('el carrito ofrece dejarlo fijo y deja claro que no se cobra solo', async ({ page }) => {
  await gotoApp(page, {
    login: { customer: CLIENTE, token: 'tok-1' },
    'recurring-list': { recurring: [] },
  });
  await loguearYArmarCarrito(page);

  const bloque = page.locator('details', { hasText: 'Dejarlo fijo cada semana' });
  await expect(bloque).toHaveCount(1);
  await bloque.locator('summary').click();

  // La promesa explícita. Si esto desaparece, la app estaría dando a entender un cobro
  // automático que Culqi no permite.
  await expect(page.locator('text=/No te cobramos sin que confirmes/')).toBeVisible();
  await expect(page.locator('#rec-day')).toBeVisible();
  await expect(page.locator('#rec-slot')).toBeVisible();
});

test('guardar el pedido fijo manda día, hora y el carrito completo', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: CLIENTE, token: 'tok-1' },
    'recurring-list': { recurring: [] },
    'recurring-add': { success: true },
  });
  await loguearYArmarCarrito(page);
  await page.locator('details', { hasText: 'Dejarlo fijo cada semana' }).locator('summary').click();

  await page.locator('#rec-day').selectOption('5');
  const primeraFranja = await page.locator('#rec-slot option').first().getAttribute('value');
  await page.locator('#rec-slot').selectOption(primeraFranja!);
  await page.getByRole('button', { name: 'Guardar como fijo //' }).click();

  await expect.poll(() => calls.filter((c) => c.action === 'recurring-add').length).toBeGreaterThan(0);
  const guardado = calls.find((c) => c.action === 'recurring-add')!;
  expect(guardado.body.weekday).toBe(5);
  expect(guardado.body.slot).toBe(primeraFranja);
  // El carrito viaja entero: el aviso tiene que poder reconstruir exactamente lo mismo.
  expect(Array.isArray(guardado.body.items)).toBe(true);
  expect(guardado.body.items.length).toBeGreaterThan(0);
  // Y NUNCA viaja un total: el precio se re-tasa el día del aviso. Guardarlo congelado sería
  // una segunda fuente de verdad, el defecto que ya costó tres semanas de precios fantasma.
  expect(guardado.body.total).toBeUndefined();
});

test('un invitado no ve la opción — no habría a quién avisarle', async ({ page }) => {
  await gotoApp(page);
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  await page.locator('[aria-label="Ver carrito"]').click();
  await expect(page.locator('details', { hasText: 'Dejarlo fijo cada semana' })).toHaveCount(0);
});

test('la pantalla lista los pedidos fijos y permite quitarlos', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: { customer: CLIENTE, token: 'tok-1' },
    'recurring-list': {
      recurring: [
        { id: 'rec-1', weekday: 5, slot: '19:30', label: '1 ítem', items: [{ mode: 'sig', sigId: 'SIG01', size: '15', qty: 1 }] },
      ],
    },
    'recurring-delete': { success: true },
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'Puntos' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill(CLIENTE.phone);
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="goRecurring()"]').click();

  await expect(page.locator('text=MI PEDIDO FIJO')).toBeVisible();
  await expect(page.locator('text=/Viernes · 19:30/')).toBeVisible();
  // La misma promesa, también acá: es la pantalla donde el cliente vuelve a mirar qué dejó
  // configurado, y es donde más fácil sería creer que se cobra solo.
  await expect(page.locator('text=/nunca te cobramos sin que confirmes/i')).toBeVisible();

  // La app usa su propio modal (showConfirm), no el diálogo nativo del navegador.
  await page.locator('[onclick*="doDeleteRecurring"]').click();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();
  await expect.poll(() => calls.filter((c) => c.action === 'recurring-delete').length).toBeGreaterThan(0);
  expect(calls.find((c) => c.action === 'recurring-delete')!.body.id).toBe('rec-1');
});
