import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Cubre la reestructura de recompensas de esta sesión: R05 ("BEBIDA // GRATIS", 120 pts)
// antes no descontaba nada del total — canjearla costaba puntos reales sin entregar
// ningún valor. Este test confirma que hoy sí perdona el precio real de la bebida
// elegida (D06 THE BLOOM, S/4) y que el rewardId viaja hasta place-order.

test('cliente con puntos canjea BEBIDA GRATIS y el total refleja el descuento real', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: {
      customer: { phone: '900000002', name: 'Bruno Cliente', email: 'bruno@test.com', points: 200, credit_balance: 0 },
      isAdmin: false,
      token: 'tok-bruno',
    },
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-reward', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: null,
    }),
  });

  await page.getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000002');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  // El login deja al cliente en la pestaña PUNTOS (p_home) — hay que cambiar a PEDIDO
  // para llegar a startOrder().
  await page.getByRole('button', { name: 'PEDIDO' }).click();

  // THE ORIGINAL (SIG01) 15CM = S/18 — cualquier signature serviría, se fija uno
  // concreto solo para que el flujo sea determinista.
  await page.locator('[onclick*="startOrder(\'sig\')"]').click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId=\'SIG01\'"]').click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();

  // Sale del modo "pago rápido" (un solo ítem) para poder agregar también una bebida —
  // R05 solo es elegible sobre una línea de bebida/side, nunca sobre un sándwich.
  await page.locator('text=+ CARRITO').click();
  await page.locator('[onclick*="sc=\'o_sides\'"]').click();
  await page.locator('[onclick*="addSideToCart(\'D06\')"]').click();
  await page.getByRole('button', { name: 'VER CARRITO //' }).click();

  await expect(page.locator('text=THE BLOOM')).toBeVisible();

  // Canjea BEBIDA GRATIS y confirma que el ahorro mostrado es el precio real de la
  // bebida (S/4) — antes de esta sesión este número siempre era S/0 (recompensa rota).
  await page.locator("[onclick*=\"toggleReward('R05')\"]").click();
  await expect(page.locator('text=ahorras S/4')).toBeVisible();

  await page.locator('#o-nom').fill('Bruno Cliente');
  await page.locator('#o-phone').fill('987654323');
  await page.locator('#o-addr').fill('Av. España 456, Trujillo');

  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await expect(page.locator('text=¿CÓMO PAGAS?')).toBeVisible();
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();

  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });

  const placeOrderCall = calls.find((c) => c.action === 'place-order');
  expect(placeOrderCall).toBeTruthy();
  expect(placeOrderCall!.body.rewardId).toBe('R05');
  expect(placeOrderCall!.body.items).toHaveLength(2);
});
