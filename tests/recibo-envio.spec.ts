import { test, expect } from '@playwright/test';
import { gotoApp, setDeliveryPin, clearDeliveryPin } from './helpers';

// ⚠ EL RECIBO MOSTRABA S/8 QUE NO SALÍAN DE NINGUNA LÍNEA.
//
// En pago rápido el total es `payableTotal()`, que suma `deliveryFeeAmount()` — pero el papel
// solo tenía líneas del sándwich. El cliente veía:
//
//     Signature   S/20.90 · The Original
//     Tamaño      15CM
//     TOTAL       S/28.90
//
// Un 38% de más sin una palabra que lo explique, en la PRIMERA pantalla donde ve un precio. Y
// los costos inesperados son la causa nº1 de abandono de carrito.
//
// Peor: el recibo del CARRITO sí traía su línea de «Envío», así que los dos papeles que el
// mismo cliente ve seguidos armaban el total de forma distinta — justo lo que el comentario
// de PAPEL_ABRE dice que no puede pasar.
//
// MODO DE FALLO: SILENCIO. Quitar la línea no rompe nada; el total sigue siendo correcto y la
// pantalla se ve bien. Solo vuelve a ser una cuenta que no se puede seguir.

async function irAConfirmar(page: any) {
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
}

// Devuelve el texto del papel del recibo, que es el bloque que contiene "NO ES BOLETA".
async function papel(page: any) {
  return page.evaluate(() => {
    const marca = [...document.querySelectorAll('*')].find(
      (e) => e.textContent?.includes('NO ES BOLETA') && e.children.length <= 2,
    );
    let el: any = marca;
    while (el && !(el.innerText || '').includes('TOTAL')) el = el.parentElement;
    return (el?.innerText || '').replace(/\s+/g, ' ');
  });
}

test('el recibo nombra el envío en vez de dejarlo dentro del total sin explicar', async ({ page }) => {
  await gotoApp(page);
  await setDeliveryPin(page);
  await irAConfirmar(page);

  const t = await papel(page);
  expect(t).toContain('TOTAL');
  // Sin esta línea, el salto del precio del sándwich al total no tiene explicación.
  expect(t, `el papel no nombra el envío:\n${t}`).toMatch(/Env[íi]o/i);
});

test('sin pin todavía, el envío dice que es un ESTIMADO en vez de parecer definitivo', async ({ page }) => {
  await gotoApp(page);
  // gotoApp() siembra un pin por defecto, así que hay que quitarlo para llegar al caso real:
  // alguien que abrió la app y todavía no marcó dónde vive.
  await clearDeliveryPin(page);
  await page.evaluate(() => (window as any).render());
  await irAConfirmar(page);

  const t = await papel(page);
  // Sin coordenadas el servidor cae al cobro POR ZONA, así que siempre hay un importe — el
  // envío nunca queda mudo. Lo que importa entonces es que se lea como estimado: cobrar por
  // distancia real casi siempre sale MENOS, y un número que parece final hace que quien lo ve
  // decida sobre el peor caso. Que el importe baje después es una sorpresa buena; que parezca
  // cerrado cuando no lo está es lo que cuesta el pedido.
  expect(t).toMatch(/Env[íi]o/i);
  expect(t, `el envío sin pin tiene que decir que es estimado:\n${t}`).toMatch(/estimado por zona/i);
});

test('los DOS recibos que ve el mismo cliente nombran el envío igual', async ({ page }) => {
  await gotoApp(page);
  await setDeliveryPin(page);
  await irAConfirmar(page);
  const enConfirmar = await papel(page);

  // El del carrito, que es el que ve a continuación si agrega algo más.
  await page.evaluate(() => { (window as any).sndScreen = 'o_cart'; (window as any).render(); });
  const enCarrito = await papel(page);

  // No se compara el importe —pueden diferir legítimamente— sino que los dos NOMBREN la línea.
  // Que una cuenta cambie de forma entre dos pantallas seguidas hace que se revise dos veces.
  expect(enConfirmar).toMatch(/Env[íi]o/i);
  expect(enCarrito).toMatch(/Env[íi]o/i);
});
