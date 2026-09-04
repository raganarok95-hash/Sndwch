import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// Extiende el mismo criterio de POLLO CAJÚN (P03, vault-exclusive-protein.spec.ts) a
// JALAPEÑO (T04) + SPICY MAYO/PICANTE MIEL (S02/S12), que solo aparecen en el menú
// secreto (SIG05) — vaultOnly en TOPS/SAUCES (src/app.ts) + VAULT_ONLY_TOPS/
// VAULT_ONLY_SAUCES en el backend (catalog.ts).
//
// Antes este archivo cubría también GIARDINIERA (T07) y su gemelo cubría AU JUS (S13),
// los dos exclusivos de THE CHICAGO (SIG07). Los tres se retiraron del catálogo el
// 2026-08-22 (ver el comentario del retiro en SIGS de src/app.ts), así que esas dos
// pruebas se borraron junto con chicago-exclusive-sauce.spec.ts: verificar que un
// ingrediente que ya no existe en ningún array no se muestre no prueba nada. El
// mecanismo sigOnly/SIG_ONLY_* sigue vivo en el código y vuelve a tener cobertura en
// cuanto SIG07 (u otro Signature con ingrediente propio) regrese.

test('JALAPEÑO + SPICY MAYO/PICANTE MIEL (exclusivos del menú secreto) no aparecen en ARMA EL TUYO', async ({ page }) => {
  await gotoApp(page, {});

  await page.locator('text=Arma el tuyo').click();
  await page.locator('[onclick*="startOrder(\'byo\')"]').first().click();
  await expect(page.locator('text=ARMA EL TUYO')).toBeVisible();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="base="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();
  await page.locator('[onclick^="prot="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();

  // Paso de toppings: Jalapeño no debe listarse.
  await expect(page.locator('text=Jalapeño')).not.toBeVisible();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click(); // toppings -> queso
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click(); // queso -> salsas

  // Otras salsas siguen disponibles normalmente.
  await expect(page.locator('text=Aioli').first()).toBeVisible();

  // S09 (Chimichurri // Piña y Ají) es pública y picante, pero va en la MISMA lista que
  // el resto: el picor se marca con el ícono de ají al costado, no con una sección propia
  // (decisión del dueño 2026-08-21 — una sección "Picantes //" encabezando la pantalla
  // presentaba el picante como la categoría principal en vez de como un atributo).
  await expect(page.locator('text=Chimichurri').first()).toBeVisible();
  await expect(page.locator('text=Picantes //')).not.toBeVisible();
  await expect(page.locator('text=Otras salsas //')).not.toBeVisible();

  // Pero las dos del menú secreto siguen ocultas: que exista picante público no debe
  // filtrar las exclusivas.
  await expect(page.locator('text=Spicy').first()).not.toBeVisible();
  await expect(page.locator('text=Picante // Miel')).not.toBeVisible();
});

// LECHUGA (T09) — agregada el 2026-09-04 al igualar los gramajes al estándar de Subway.
//
// POR QUÉ TIENE PRUEBA. Era el único ingrediente del set estándar de Subway que no existía
// en el catálogo, y el de MAYOR volumen (21 g) al menor costo por gramo — lo que más hace
// que un sándwich se vea lleno, por lo que menos cuesta. Su modo de fallo es silencioso: un
// topping que desaparece del array no rompe nada, solo deja al sándwich viéndose más vacío
// y a nadie le salta un error.
test('LECHUGA aparece en ARMA EL TUYO y el pedido la acepta', async ({ page }) => {
  const calls = await gotoApp(page, {
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-lechuga', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: null,
    }),
  });

  await page.locator('text=Arma el tuyo').click();
  await page.locator('[onclick*="startOrder(\'byo\')"]').first().click();
  await expect(page.locator('text=ARMA EL TUYO')).toBeVisible();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="base="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();
  await page.locator('[onclick^="prot="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();

  // Paso de toppings: la lechuga se lista y se puede elegir.
  await expect(page.locator('[onclick*="\'T09\'"]').first()).toBeVisible();
  await page.locator('[onclick*="\'T09\'"]').first().click();

  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();   // queso
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();   // salsas
  await page.locator('[onclick*="sauces.push("]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();

  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
  await page.locator('#o-nom').fill('Cliente Lechuga');
  await page.locator('#o-phone').fill('987654399');
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');
  await page.locator('#o-district').selectOption('trujillo');
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();
  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });

  // La lechuga viaja al servidor dentro del ítem, no se pierde en el camino.
  const po = calls.find((c) => c.action === 'place-order')!;
  expect(JSON.stringify(po.body.items)).toContain('T09');
});

// APIO (T08) — sacado de ARMA EL TUYO el 2026-09-04, pero NO borrado del catálogo.
//
// POR QUÉ TIENE PRUEBA, Y POR QUÉ SON DOS ASERCIONES OPUESTAS. THE FRESH (SIG04) lleva apio
// y es su ÚNICO elemento crocante — entró ahí el 2026-08-08 justamente porque el pimiento
// curado no aportaba crocancia y la receta quedaba sin ninguna. Si alguien "limpia" el
// catálogo borrando T08 en vez de marcarlo sigOnly, ese Signature pierde en silencio la
// textura por la que se eligió: no falla ningún tipo, no revienta nada, el sándwich sale
// distinto y nadie se entera.
test('el APIO ya no se puede elegir en ARMA EL TUYO, pero sigue en THE FRESH', async ({ page }) => {
  await gotoApp(page, {});

  // 1) No se ofrece en el armador.
  await page.locator('text=Arma el tuyo').click();
  await page.locator('[onclick*="startOrder(\'byo\')"]').first().click();
  await expect(page.locator('text=ARMA EL TUYO')).toBeVisible();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="base="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();
  await page.locator('[onclick^="prot="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();
  await expect(page.locator('[onclick*="\'T08\'"]')).toHaveCount(0);
  // La lechuga sí, para confirmar que estamos mirando el paso correcto.
  await expect(page.locator('[onclick*="\'T09\'"]').first()).toBeVisible();

  // 2) Pero sigue vivo en la receta de THE FRESH.
  const apioSigueEnLaReceta = await page.evaluate(
    () => (window as any).SIGS.find((s: any) => s.id === 'SIG04')?.tops?.includes('T08'),
  );
  expect(apioSigueEnLaReceta).toBe(true);
});
