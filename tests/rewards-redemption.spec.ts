import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Cubre la reestructura de recompensas de esta sesión: R05 ("BEBIDA // GRATIS", 220 pts
// tras la recalibración de puntos contra el costo real de insumos) antes no descontaba
// nada del total — canjearla costaba puntos reales sin entregar ningún valor. Este test
// confirma que hoy sí perdona el precio real de la bebida elegida (D06 THE BLOOM, S/4) y
// que el rewardId viaja hasta place-order.

test('cliente con puntos canjea BEBIDA GRATIS y el total refleja el descuento real', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: {
      customer: { phone: '900000002', name: 'Bruno Cliente', email: 'bruno@test.com', points: 250, credit_balance: 0 },
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
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId=\'SIG01\'"]').click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();

  // Sale del modo "pago rápido" (un solo ítem) para poder agregar también una bebida —
  // R05 solo es elegible sobre una línea de bebida/side, nunca sobre un sándwich.
  await page.locator('text=+ CARRITO').click();
  await page.locator('[onclick*="sc=\'o_sides\'"]').click();
  await page.locator('[onclick*="addSideToCart(\'D06\')"]').click();
  await page.getByRole('button', { name: 'VER CARRITO //' }).click();

  // Texto exacto de la línea del carrito, no una subcadena — "text=THE BLOOM" también
  // matchea el toast "¡The Bloom agregado! //" que sigue visible unos segundos más
  // (antes esto quedaba oculto porque el toast tapaba el botón "VER CARRITO //" y
  // Playwright esperaba a que desapareciera antes de poder hacer clic; con el fix P0 de
  // la crítica impeccable 2026-07-30 el toast ya no bloquea el botón, así que el clic
  // ahora sucede de inmediato, mientras el toast todavía está en pantalla).
  await expect(page.getByText('The Bloom // Hibiscus', { exact: true })).toBeVisible();

  // Canjea BEBIDA GRATIS y confirma que el ahorro mostrado es el precio real de la
  // bebida (S/4) — antes de esta sesión este número siempre era S/0 (recompensa rota).
  await page.locator("[onclick*=\"toggleReward('R05')\"]").click();
  // El bug de auditoría (HTML crudo visible al aplicar cualquier recompensa con
  // ahorro) hacía que este texto SOLO apareciera bien renderizado en el resumen de
  // TOTAL, nunca en la fila de la recompensa misma — ahora aparece en ambos lugares
  // (arreglado), así que el locator debe apuntar específicamente a la fila del picker.
  await expect(page.locator("[onclick*=\"toggleReward('R05')\"] >> text=ahorras S/4")).toBeVisible();

  await page.locator('#o-nom').fill('Bruno Cliente');
  await page.locator('#o-phone').fill('987654323');
  await page.locator('#o-addr').fill('Av. España 456, Trujillo');

  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await expect(page.locator('text=¿CÓMO PAGAS?')).toBeVisible();
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await expect(page.locator('text=¿Ya transferiste')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });

  const placeOrderCall = calls.find((c) => c.action === 'place-order');
  expect(placeOrderCall).toBeTruthy();
  expect(placeOrderCall!.body.rewardId).toBe('R05');
  expect(placeOrderCall!.body.items).toHaveLength(2);
});

// Hallazgo de auditoría de rentabilidad (mismo día que se reestructuraron las
// recompensas): el descuento de combo (sándwich+bebida, S/3) se calculaba ANTES de
// aplicar la recompensa, sin excluir la unidad que la recompensa ya regala completa.
// Sándwich 15CM + bebida, canjeando SÁNDWICH GRATIS (R06): antes, combo -S/3 sobre el
// total y luego R06 perdonaba el precio COMPLETO del sándwich — la bebida terminaba
// gratis de rebote (combo aplicado sobre una unidad que ya no se estaba cobrando).
// Este test confirma que el combo YA NO aparece cuando el sándwich de ese combo es
// justo el que la recompensa está regalando.
test('SÁNDWICH GRATIS (R06) + bebida en el carrito no regala también el combo', async ({ page }) => {
  const calls = await gotoApp(page, {
    login: {
      customer: { phone: '900000003', name: 'Carla Cliente', email: 'carla@test.com', points: 750, credit_balance: 0 },
      isAdmin: false,
      token: 'tok-carla',
    },
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-reward2', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: null,
    }),
  });
  // Fija la hora fuera de la ventana 2pm-6pm Lima de "bebida gratis hora valle" — sin esto,
  // si el test corre de verdad dentro de esa ventana (hora real del entorno), la bebida
  // también sale gratis por esa promo y el total cae a S/0, saltándose el paso de elegir
  // método de pago que este test sí necesita. Puntual a este test (no en gotoApp) porque
  // otros tests construyen timestamps mock con la hora real y se romperían si se fija
  // globalmente.
  await page.clock.setFixedTime(new Date('2026-01-15T15:00:00Z'));

  await page.getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000003');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.getByRole('button', { name: 'PEDIDO' }).click();

  // THE ORIGINAL (SIG01) 15CM = S/18.
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId=\'SIG01\'"]').click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();

  await page.locator('text=+ CARRITO').click();
  await page.locator('[onclick*="sc=\'o_sides\'"]').click();
  await page.locator('[onclick*="addSideToCart(\'D06\')"]').click();
  await page.getByRole('button', { name: 'VER CARRITO //' }).click();

  await page.locator("[onclick*=\"toggleReward('R06')\"]").click();

  // El ahorro de la recompensa debe ser el precio COMPLETO del sándwich (S/18) — y el
  // combo NO debe aparecer, porque ese sándwich ya no cuenta para el combo (fix de esta
  // sesión). Si el combo se colara de nuevo, la bebida quedaría gratis sin que nadie lo
  // decidiera.
  await expect(page.locator('text=recompensa: ahorras S/18')).toBeVisible();
  await expect(page.locator('text=combo aplicado')).not.toBeVisible();

  await page.locator('#o-nom').fill('Carla Cliente');
  await page.locator('#o-phone').fill('987654324');
  await page.locator('#o-addr').fill('Av. España 789, Trujillo');

  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await expect(page.locator('text=¿CÓMO PAGAS?')).toBeVisible();
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await expect(page.locator('text=¿Ya transferiste')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });

  const placeOrderCall2 = calls.find((c) => c.action === 'place-order');
  expect(placeOrderCall2).toBeTruthy();
  expect(placeOrderCall2!.body.rewardId).toBe('R06');
});
