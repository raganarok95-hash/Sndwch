import { test, expect } from '@playwright/test';
import { gotoApp, irAlArmador, siguientePaso } from './helpers';
import { unVegetalDelArmador } from './carta';
import { CARTA } from '../supabase/functions/_shared/carta.ts';

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

// TODO VEGETAL DEL ARMADOR SE OFRECE Y VIAJA AL PEDIDO.
//
// Nació por la lechuga (2026-09-04): el ingrediente de más volumen al menor costo, lo que más
// hace que un sándwich se vea lleno. Su modo de fallo es silencioso: un vegetal que desaparece
// de la lista no rompe nada, solo deja al sándwich más vacío. Ahora vale para cada vegetal que
// la carta ofrece en el armador, sin nombrar ninguno.
test('cada vegetal del armador aparece, y lo elegido viaja al pedido', async ({ page }) => {
  const calls = await gotoApp(page, {
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-lechuga', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: null,
    }),
  });

  await hastaLosVegetales(page);

  // Paso de vegetales: cada uno de la carta se lista, y uno se puede tocar.
  for (const v of CARTA.vegetales.filter((x) => !x.soloEnSignature && !x.soloSecreto)) {
    await expect(page.locator(`[onclick*="'${v.id}'"]`).first(), `${v.nombre} no se ofrece en el armador`).toBeVisible();
  }
  await page.locator(`[onclick*="'${unVegetalDelArmador()}'"]`).first().click();
  const elegidos: string[] = await page.evaluate(() => [...(window as any).tops]);

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
  await expect(page.locator('.m06 .ok', { hasText: 'Pedido recibido' })).toBeVisible({ timeout: 10000 });

  // Lo elegido viaja al servidor dentro del ítem, no se pierde en el camino.
  const po = calls.find((c) => c.action === 'place-order')!;
  expect([...po.body.items[0].tops].sort()).toEqual([...elegidos].sort());
});

// LO MARCADO `sigOnly` NO SE OFRECE EN EL ARMADOR, PERO SIGUE EN SUS SIGNATURES.
//
// Preguntado a la carta de la app, nunca con códigos escritos: la carta cambia (la v4 del
// 2026-09-24 retiró el pepinillo y dos proteínas, y agregó la cebolla salteada del Philly).
//
// Su modo de fallo es SILENCIO: si el filtro `!x.sigOnly` del armador se rompe, el cliente
// puede armar lo que solo existe dentro de un Signature —a un precio que el armador no está
// hecho para cobrar— sin que nada falle ni ningún tipo se queje.
test('lo marcado como sigOnly no aparece en ARMA EL TUYO, pero sigue en sus Signatures', async ({ page }) => {
  await gotoApp(page, {});
  const { vegetales, deSignature } = await page.evaluate(() => {
    const w = window as any;
    const exclusivos = w.TOPS.filter((t: any) => t.sigOnly).map((t: any) => t.id);
    return {
      vegetales: { exclusivos, delArmador: w.TOPS.filter((t: any) => !t.sigOnly && !t.vaultOnly).map((t: any) => t.id) },
      deSignature: exclusivos.map((id: string) => w.SIGS.some((s: any) => !s.secret && (s.tops || []).includes(id))),
    };
  });

  // 1) No se ofrecen en el armador.
  await hastaLosVegetales(page);
  for (const id of vegetales.exclusivos) await expect(page.locator(`[onclick*="'${id}'"]`)).toHaveCount(0);
  // Uno del armador sí, para confirmar que estamos mirando el paso correcto.
  await expect(page.locator(`[onclick*="'${vegetales.delArmador[0]}'"]`).first()).toBeVisible();

  // 2) Pero siguen vivos en las recetas que los usan: si alguien los borra del catálogo en
  //    vez de marcarlos, esos Signatures cambian de sabor en silencio.
  expect(deSignature.every(Boolean), 'un vegetal exclusivo ya no lo lleva ningún Signature').toBe(true);
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
