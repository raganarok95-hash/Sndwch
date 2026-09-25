import { test, expect } from '@playwright/test';
import { gotoApp, mockBackend, stubWindowOpen, APP_FILE, entrarConTelefono, cartaDeLaApp, type Carta } from './helpers';

// INCENTIVO AL ORGANIZADOR (2026-08-22). Quien junta un pedido grupal de 5 o más
// sándwiches se lleva gratis el 15CM más barato del grupo. Es el motor del canal de
// oficinas: el dueño no puede vender puerta a puerta porque sus mañanas están cocinando,
// así que el que vende es el propio cliente que insiste a un compañero más.
//
// Estos tests cubren el lado del CLIENTE (lo que se muestra y el total que se manda).
// Quien de verdad decide si el descuento corresponde es el servidor, que lo verifica
// contra la base (organizerFreeSandwichApplies): que el código exista, que quien paga sea
// quien organizó, que haya 5+ sándwiches y que ese grupo no se haya cobrado ya. Nada de
// eso se puede ejercer acá porque el backend está mockeado — pero el total que el cliente
// manda SÍ tiene que coincidir con el que el servidor va a recalcular, y eso es
// exactamente lo que se verifica abajo.

const enOchoMinutos = () => new Date(Date.now() + 3600000).toISOString();

// Lo que el servidor le muestra al grupo: cinco sándwiches. Las etiquetas y precios de esta
// lista son solo lo que pinta la pantalla del grupo; lo que se COBRA sale del carrito de abajo.
const CINCO_SANDWICHES = ['Ana', 'Beto', 'Caro', 'Dani', 'Eli'].map((contributorName, i) => (
  { id: i + 1, contributorName, label: 'Un Signature // 15CM', qty: 1, unitPrice: 20, isSandwich: true }
));

// El carrito que arma el grupo al cerrarse, con la carta que la app tiene cargada: cuatro del
// Signature más caro y uno del más barato, que es el que tiene que salir gratis.
function extremos(c: Carta) {
  const porPrecio = [...c.signatures].sort((x, y) => c.p15[x]! - c.p15[y]!);
  return { barato: porPrecio[0]!, caro: porPrecio[porPrecio.length - 1]! };
}
const linea = (sigId: string) => ({ type: 'sig', sigId, size: '15', qty: 1, cheese: null, extraSauce: false, doubleProt: false });
const carritoDelGrupo = (c: Carta) => {
  const { barato, caro } = extremos(c);
  return [linea(caro), linea(caro), linea(caro), linea(caro), linea(barato)];
};
const soles = (page: any, n: number) =>
  page.evaluate((x: number) => (window as any).SOLES_TXT + (window as any).pz(x), Math.round(n * 100) / 100);

test('el grupo muestra cuántos sándwiches faltan para que uno vaya gratis', async ({ page }) => {
  // 3 de 5: todavía falta. El aviso es lo que le da al organizador una razón concreta
  // para insistirle a un compañero más — sin él, el incentivo existe pero nadie lo sabe.
  await mockBackend(page, {
    'get-group-order': {
      code: 'OFI001', status: 'open', organizerName: 'Ana Cliente', expiresAt: enOchoMinutos(),
      items: CINCO_SANDWICHES.slice(0, 3), total: 60, isOrganizer: false,
      sandwichQty: 3, organizerFreeAt: 5,
    },
  });
  await stubWindowOpen(page);
  await page.goto(APP_FILE + '?group=OFI001');
  await page.waitForSelector('text=PEDIDO GRUPAL');

  await expect(page.locator('text=Faltan 2 para que uno vaya gratis')).toBeVisible();
});

test('al llegar a 5 sándwiches el grupo anuncia que uno va gratis', async ({ page }) => {
  await mockBackend(page, {
    'get-group-order': {
      code: 'OFI001', status: 'open', organizerName: 'Ana Cliente', expiresAt: enOchoMinutos(),
      items: CINCO_SANDWICHES, total: 100, isOrganizer: false,
      sandwichQty: 5, organizerFreeAt: 5,
    },
  });
  await stubWindowOpen(page);
  await page.goto(APP_FILE + '?group=OFI001');
  await page.waitForSelector('text=PEDIDO GRUPAL');

  await expect(page.locator('text=¡Un sándwich va gratis!')).toBeVisible();
  await expect(page.locator('text=Faltan')).not.toBeVisible();
});

test('el organizador cierra un grupo de 5 y el total descuenta el 15CM más barato', async ({ page }) => {
  let items: any[] = [];
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0 }, isAdmin: false, token: 'tok-ana' },
    'create-group-order': { success: true, code: 'OFI001', expiresAt: enOchoMinutos() },
    'get-group-order': {
      code: 'OFI001', status: 'open', organizerName: 'Ana Cliente', expiresAt: enOchoMinutos(),
      items: CINCO_SANDWICHES, total: 100, isOrganizer: true,
      sandwichQty: 5, organizerFreeAt: 5,
    },
    'close-group-order': () => ({ success: true, items }),
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-ofi', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: null,
    }),
  });
  // Fuera de la ventana 3pm-6pm de "bebida gratis hora valle": este carrito no tiene
  // bebidas, así que la promo no aplicaría igual, pero fijar la hora deja el test
  // determinista sin importar cuándo corra.
  await page.clock.setFixedTime(new Date('2026-01-15T15:00:00Z'));
  const c = await cartaDeLaApp(page);
  const { barato, caro } = extremos(c);
  items = carritoDelGrupo(c);

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page, '900000001', '1234');
  // ESPERAR A QUE EL LOGIN RESUELVA ANTES DE NAVEGAR. Sin esto hay una carrera real: el
  // fetch de `login` sigue en vuelo mientras el test ya cambió de pestaña y abrió el pedido
  // grupal, y cuando la respuesta llega la app vuelve a renderizar y pisa la pantalla del
  // grupo — con lo que el aviso de "Faltan N sándwiches" desaparece antes de que la
  // aserción lo encuentre. Local resuelve en milisegundos y nunca se ve; el runner de
  // GitHub, con los 151 tests en paralelo, sí entra en esa ventana (falló así el
  // 2026-09-06, con 20 corridas locales en verde). Es el mismo motivo por el que
  // `tests/yape-por-defecto.spec.ts` espera acá, y el mismo patrón que playwright.config.ts
  // ya documenta para el fallo de `weekly-plan.spec.ts` del 2026-08-22.
  // La espera NO relaja lo que se comprueba: fija una precondición que el test ya asumía.
  await expect(page.getByRole('button', { name: 'INGRESAR //' })).toHaveCount(0);

  await page.locator('.bottom-nav').getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="doCreateGroupOrder"]').first().click();
  await expect(page.locator('text=¡Un sándwich va gratis!')).toBeVisible();

  await page.getByRole('button', { name: /yo invito/i }).click();
  await expect(page.getByRole('button', { name: 'CONFIRMAR //' })).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=TU CARRITO')).toBeVisible();
  // Cuatro del más caro y uno del más barato: el más barato va gratis.
  // ⚠ SE COMPRUEBA LA CUENTA, NO LA FRASE — ver la nota equivalente en
  // rewards-redemption.spec.ts. La línea verde "sándwich del organizador: ahorras …"
  // dejó de existir al pasar el carrito a recibo (2026-09-10); el descuento sigue igual.
  const perdonado = await page.evaluate(() => (window as any).organizerFreeAmount());
  expect(perdonado, 'el 15CM más barato del grupo tiene que ir gratis').toBeCloseTo(c.p15[barato]!, 2);
  await expect(page.locator('text=/Sándwich del organizador/')).toBeVisible();

  await page.locator('#o-nom').fill('Ana Cliente');
  await page.locator('#o-phone').fill('900000001');
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');
  await page.locator('#o-district').selectOption('trujillo');
  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await expect(page.locator('text=¿Ya transferiste')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();
  await expect(page.locator('.m06 .ok', { hasText: 'Pedido recibido' })).toBeVisible({ timeout: 10000 });

  const placeOrder = calls.find((c) => c.action === 'place-order');
  expect(placeOrder).toBeTruthy();
  // Los cuatro que se pagan + delivery de zona 'media' (S/8, sin engordar porque paga con
  // Yape/Plin). Si el descuento del organizador no se hubiera aplicado el total no
  // coincidiría con el del servidor y el pedido se rechazaría.
  expect(placeOrder!.body.total).toBe(Math.round((4 * c.p15[caro]! + 8) * 100) / 100);
  // El código del grupo viaja con el pedido: es lo que le permite al servidor verificar
  // el descuento contra la base y, además, medir el canal de oficinas.
  expect(placeOrder!.body.groupCode).toBe('OFI001');
});

test('un grupo de 4 sándwiches todavía no descuenta nada', async ({ page }) => {
  // El umbral tiene que morder de verdad: si el descuento se aplicara con 4, el
  // incentivo dejaría de empujar hacia el quinto sándwich, que es todo su propósito.
  let items: any[] = [];
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0 }, isAdmin: false, token: 'tok-ana' },
    'create-group-order': { success: true, code: 'OFI002', expiresAt: enOchoMinutos() },
    'get-group-order': {
      code: 'OFI002', status: 'open', organizerName: 'Ana Cliente', expiresAt: enOchoMinutos(),
      items: CINCO_SANDWICHES.slice(0, 4), total: 80, isOrganizer: true,
      sandwichQty: 4, organizerFreeAt: 5,
    },
    'close-group-order': () => ({ success: true, items }),
  });
  await page.clock.setFixedTime(new Date('2026-01-15T15:00:00Z'));
  const c = await cartaDeLaApp(page);
  items = carritoDelGrupo(c).slice(0, 4);

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page, '900000001', '1234');
  // ESPERAR A QUE EL LOGIN RESUELVA ANTES DE NAVEGAR. Sin esto hay una carrera real: el
  // fetch de `login` sigue en vuelo mientras el test ya cambió de pestaña y abrió el pedido
  // grupal, y cuando la respuesta llega la app vuelve a renderizar y pisa la pantalla del
  // grupo — con lo que el aviso de "Faltan N sándwiches" desaparece antes de que la
  // aserción lo encuentre. Local resuelve en milisegundos y nunca se ve; el runner de
  // GitHub, con los 151 tests en paralelo, sí entra en esa ventana (falló así el
  // 2026-09-06, con 20 corridas locales en verde). Es el mismo motivo por el que
  // `tests/yape-por-defecto.spec.ts` espera acá, y el mismo patrón que playwright.config.ts
  // ya documenta para el fallo de `weekly-plan.spec.ts` del 2026-08-22.
  // La espera NO relaja lo que se comprueba: fija una precondición que el test ya asumía.
  await expect(page.getByRole('button', { name: 'INGRESAR //' })).toHaveCount(0);

  await page.locator('.bottom-nav').getByRole('button', { name: 'PEDIDO' }).click();
  await page.locator('[onclick*="doCreateGroupOrder"]').first().click();
  // 10 s y no los 5 por defecto: entre el clic y este texto hay SEIS peticiones encadenadas
  // (login, addresses-list, favorites-list, my-orders, create-group-order y get-group-order),
  // comprobado instrumentando el flujo. La pantalla se pinta recién con la última. Es el
  // mismo timeout que ya usan los specs de admin por la misma razón, y no relaja lo que se
  // comprueba: el texto exigido es idéntico.
  await expect(page.locator('text=Faltan 1 para que uno vaya gratis')).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: /yo invito/i }).click();
  await expect(page.getByRole('button', { name: 'CONFIRMAR //' })).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();

  await expect(page.locator('text=TU CARRITO')).toBeVisible();
  await expect(page.locator('text=sándwich del organizador')).not.toBeVisible();
  // Los cuatro enteros, sin ningún descuento, más S/8 de delivery (sin engordar: el default
  // es Yape/Plin, que no paga comisión — ver tests/yape-por-defecto.spec.ts).
  const { caro } = extremos(c);
  await expect(page.locator(`text=${await soles(page, 4 * c.p15[caro]! + 8)}`).first()).toBeVisible();
  expect(calls.length).toBeGreaterThan(0);
});
