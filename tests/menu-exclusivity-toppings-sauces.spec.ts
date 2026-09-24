import { test, expect } from '@playwright/test';
import { gotoApp, irAlArmador, siguientePaso } from './helpers';

// Recorrido hasta el paso de VEGETALES del armador actual: tamaño → pan → proteína → queso
// (se salta: es opcional) → vegetales. Vive en un solo sitio porque las tres pruebas de este
// archivo lo necesitan, y la vez anterior que el armador cambió de orden hubo que corregirlo
// en tres copias (el salto del queso se agregó a mano en cada una).
async function hastaLosVegetales(page: any) {
  await irAlArmador(page);
  await page.locator('[onclick*="size=\'15\'"]').click();
  await siguientePaso(page); // tamaño -> pan
  await page.locator('[onclick^="base="]').first().click();
  await siguientePaso(page); // pan -> proteína
  await page.locator('[onclick^="prot="]').first().click();
  await siguientePaso(page); // proteína -> queso
  await siguientePaso(page); // queso -> vegetales
  // El riel nombra el paso en el que estás; el título es una pregunta («¿Qué le pones encima?»).
  await expect(page.locator('[aria-label="VEGETALES (aquí)"]')).toHaveCount(1);
}

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

  // ⚠ Hay que llegar de verdad al paso de VEGETALES: en el del queso "Jalapeño" no aparece
  // jamás, así que la aserción pasaría en falso. hastaLosVegetales() lo comprueba por el título.
  await hastaLosVegetales(page);

  // Paso de vegetales: Jalapeño no debe listarse.
  await expect(page.locator('text=Jalapeño')).not.toBeVisible();
  await siguientePaso(page); // vegetales -> salsas

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

  await hastaLosVegetales(page);

  // Paso de vegetales: la lechuga se lista y se puede elegir.
  await expect(page.locator('[onclick*="\'T09\'"]').first()).toBeVisible();
  await page.locator('[onclick*="\'T09\'"]').first().click();

  await siguientePaso(page); // vegetales -> salsas
  await page.locator('[onclick^="byoToggleSalsa("]').first().click();
  await siguientePaso(page); // «Listo» -> confirmar

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

// EL APIO (T08) YA NO EXISTE EN EL CATÁLOGO — retirado el 2026-09-12 (decisión del dueño).
//
// Llevaba una semana en un estado imposible: `sigOnly` desde el 2026-09-04 porque THE FRESH
// lo llevaba, y el 2026-09-05 esa receta pasó a atún escurrido + mayonesa + pimienta con
// `tops:[]`. Desde ese día era un insumo que había que comprar, lavar y picar al momento
// para CERO pedidos posibles, y nada avisaba: un ingrediente inalcanzable no produce ningún
// error. Se retiró entero, como se retiró T07 (giardiniera) con THE CHICAGO.
//
// LA PRUEBA SIGUE, y ahora protege dos cosas distintas:
//   a) que el mecanismo `sigOnly` siga funcionando — de él dependen T02 (Pepinillo),
//      P01 (Res) y P05 (Embutido), y esos tres SÍ tienen consumidor;
//   b) que nadie devuelva T08 al catálogo sin darle un consumidor. Volver a marcarlo
//      `sigOnly` sin ponerlo en ninguna receta recrea exactamente el mismo agujero.
//
// Su modo de fallo es SILENCIO: si el filtro `!x.sigOnly` del armador se rompe, el cliente
// vuelve a poder armar res y embutido por BYO —las dos que salieron por rentabilidad— sin que
// nada falle, sin que ningún tipo se queje, y con el margen sangrando otra vez.
test('lo marcado como sigOnly no aparece en ARMA EL TUYO, pero sigue en sus Signatures', async ({ page }) => {
  await gotoApp(page, {});

  // 1) No se ofrecen en el armador: ni apio, ni pepinillo.
  await hastaLosVegetales(page);
  // T08 ya no está en ninguna parte del catálogo; T02 sí existe, pero solo dentro de sus
  // Signatures. Los dos tienen que dar cero acá, por motivos distintos.
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

// Un ingrediente marcado `sigOnly` que ningún Signature usa no restringe nada: lo vuelve
// IMPOSIBLE DE PEDIR. Eso fue lo que le pasó al apio durante una semana —se seguía
// comprando, lavando y picando para cero pedidos— y el modo de fallo es SILENCIO: no hay
// error, no hay tipo que se queje, no hay pantalla que lo diga.
//
// Esta prueba lee el catálogo real del cliente y falla si vuelve a pasar con cualquier
// ingrediente, no solo con el apio.
test('ningún ingrediente sigOnly queda huérfano: si nadie lo usa, nadie puede pedirlo', async ({ page }) => {
  await gotoApp(page, {});

  const huerfanos = await page.evaluate(() => {
    const w = window as any;
    const usados = new Set<string>();
    (w.SIGS || []).forEach((sig: any) => {
      (sig.tops || []).forEach((id: string) => usados.add(id));
      (sig.sauces || []).forEach((id: string) => usados.add(id));
      if (sig.prot) usados.add(sig.prot);
    });
    const fuera: string[] = [];
    [['TOPS', w.TOPS], ['SAUCES', w.SAUCES], ['PROTS', w.PROTS]].forEach(([nombre, arr]: any) => {
      (arr || []).forEach((x: any) => {
        // vaultOnly queda fuera a propósito: el menú secreto NO vive en SIGS (lo resuelve el
        // servidor desde `secret_signature`), así que mirar SIGS diría que está huérfano
        // cuando sí tiene consumidor.
        if (x.sigOnly && !usados.has(x.id)) fuera.push(nombre + ':' + x.id + ' (' + x.l + ')');
      });
    });
    return fuera;
  });

  expect(huerfanos, 'marcados sigOnly pero sin ningún Signature que los use — nadie puede pedirlos').toEqual([]);
});
