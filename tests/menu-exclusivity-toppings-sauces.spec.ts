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

  // ⚠ El orden del armador cambió el 2026-09-05 al de Subway: pan -> proteína -> QUESO ->
  // vegetales -> salsas. Sin este salto extra la aserción caía en el paso del queso, donde
  // "Jalapeño" no aparece jamás — o sea que pasaba en falso y habría seguido pasando aunque
  // el jalapeño volviera a listarse entre los vegetales.
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click(); // queso -> vegetales

  // Paso de vegetales: Jalapeño no debe listarse.
  await expect(page.locator('text=Jalapeño')).not.toBeVisible();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click(); // vegetales -> salsas

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
  // Paso de QUESO: desde el 2026-09-05 el armador sigue el orden de Subway (pan -> proteína
  // -> queso -> vegetales -> salsas), así que hay un paso más antes de los vegetales. Se
  // salta sin elegir nada — el queso es opcional.
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();

  // Paso de vegetales: la lechuga se lista y se puede elegir.
  await expect(page.locator('[onclick*="\'T09\'"]').first()).toBeVisible();
  await page.locator('[onclick*="\'T09\'"]').first().click();

  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();   // vegetales -> salsas
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
// POR QUÉ SIGUE TENIENDO PRUEBA DESPUÉS DE QUE EL APIO SALIÓ DE TODO (2026-09-05). El apio
// también salió de THE FRESH cuando el dueño rehizo esa receta a la original de Estados
// Unidos (atún escurrido, mayonesa y pimienta), así que hoy T08 no tiene ningún consumidor.
// Lo que se fija acá es que **el mecanismo `sigOnly` siga funcionando**, porque de él dependen
// ahora T02 (Pepinillo), P01 (Res) y P05 (Embutido) — y esos tres SÍ tienen consumidor.
//
// Su modo de fallo es SILENCIO: si el filtro `!x.sigOnly` del armador se rompe, el cliente
// vuelve a poder armar res y embutido por BYO —las dos que salieron por rentabilidad— sin que
// nada falle, sin que ningún tipo se queje, y con el margen sangrando otra vez.
test('lo marcado como sigOnly no aparece en ARMA EL TUYO, pero sigue en sus Signatures', async ({ page }) => {
  await gotoApp(page, {});

  // 1) No se ofrecen en el armador: ni apio, ni pepinillo.
  await page.locator('text=Arma el tuyo').click();
  await page.locator('[onclick*="startOrder(\'byo\')"]').first().click();
  await expect(page.locator('text=ARMA EL TUYO')).toBeVisible();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="base="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();
  await page.locator('[onclick^="prot="]').first().click();
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();
  // Un paso más: el queso va antes de los vegetales desde el reorden Subway (2026-09-05).
  await page.getByRole('button', { name: 'SIGUIENTE →' }).click();
  await expect(page.locator('[onclick*="\'T08\'"]')).toHaveCount(0);
  await expect(page.locator('[onclick*="\'T02\'"]')).toHaveCount(0);
  // La lechuga sí, para confirmar que estamos mirando el paso correcto — y porque es
  // justamente la que el dueño puso EN LUGAR del pepinillo.
  await expect(page.locator('[onclick*="\'T09\'"]').first()).toBeVisible();

  // 2) Pero el pepinillo sigue vivo en las recetas que lo usan: si alguien lo borra del
  //    catálogo en vez de marcarlo, THE ORIGINAL y THE SMOKE cambian de sabor en silencio.
  const pepinilloEnRecetas = await page.evaluate(
    () => (window as any).SIGS
      .filter((s: any) => (s.tops || []).includes('T02'))
      .map((s: any) => s.id),
  );
  expect(pepinilloEnRecetas).toContain('SIG01');
  expect(pepinilloEnRecetas).toContain('SIG03');
});
