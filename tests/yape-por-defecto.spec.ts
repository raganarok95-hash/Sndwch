import { test, expect } from '@playwright/test';
import { gotoApp, PIN_TEST } from './helpers';

// SND//WCH — Yape/Plin es el método de pago por DEFECTO (2026-09-03) y la focaccia
// se cobra (recargo de pan).
//
// POR QUÉ EXISTE ESTE ARCHIVO. El default arrancaba en tarjeta, o sea que quien no tocaba
// el selector pagaba la comisión de Culqi (5.5%) sin haber elegido nada. Al volumen del
// plan, mover ese reparto vale ~S/487 al mes sin adquirir un solo cliente más.
//
// Su modo de fallo NO es una excepción: si alguien "limpia" el estado inicial de vuelta a
// null, nada revienta — el checkout sigue funcionando, los tipos siguen compilando, y el
// negocio simplemente vuelve a pagar la comisión en silencio. Por eso lo que se fija acá
// es el ESTADO INICIAL y el TOTAL, no que la pantalla no explote.

// Arma un Signature de 15CM y llega al checkout inline (pago rápido, carrito vacío) sin
// tocar el selector de pago. Ese "sin tocar" es todo el punto del archivo.
async function alCheckoutSinElegirPago(page: any) {
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
  await page.locator('#o-nom').fill('Cliente Default');
  await page.locator('#o-phone').fill('987654321');
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');
  await page.locator('#o-district').selectOption('trujillo');
}

test('sin tocar el selector, el pedido sale por Yape/Plin y no por tarjeta', async ({ page }) => {
  const calls = await gotoApp(page, {
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-y1', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: null,
    }),
  });

  await alCheckoutSinElegirPago(page);

  // Las instrucciones de transferencia se ven SIN haber tocado ningún botón: eso es lo
  // que significa que Yape es el default, no que aparezca primero en la fila.
  await expect(page.locator('text=Transfiere por Yape o Plin a')).toBeVisible();

  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await expect(page.locator('text=¿Ya transferiste')).toBeVisible();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();
  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });

  const po = calls.find((c) => c.action === 'place-order');
  expect(po!.body.paymentMethod).toBe('yape');
});

test('el total por defecto NO lleva el recargo de la comisión de tarjeta', async ({ page }) => {
  // La prueba de fondo del default: el cliente que no elige nada paga MENOS que antes.
  // El pin de los tests da S/8 exactos de envío; por Culqi ese mismo envío se engorda a
  // 8/(1-0.055) = S/8.47. Si el default volviera a tarjeta, el total subiría S/0.47 sin
  // que nadie lo haya pedido.
  const calls = await gotoApp(page, {
    'place-order': (body: any) => ({
      success: true,
      order: { id: 'ord-y2', ref: body.ref, status: 'RECIBIDO', payment_status: 'pending', payment_method: 'yape', total: body.total },
      customer: null,
    }),
  });

  await alCheckoutSinElegirPago(page);
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();
  await page.getByRole('button', { name: 'CONFIRMAR //' }).click();
  await expect(page.locator('text=PEDIDO REGISTRADO')).toBeVisible({ timeout: 10000 });

  const po = calls.find((c) => c.action === 'place-order');
  // SIG01 15CM = S/20.90 + S/8 de envío sin engordar.
  expect(Math.round(po!.body.total * 100)).toBe(Math.round((20.9 + PIN_TEST.fee) * 100));
});

test('el botón de Yape dice cuánto se ahorra, con el monto real del pedido', async ({ page }) => {
  // Un default sin razón visible se lee como una imposición. El monto tiene que ser el
  // recargo real de ESTE pedido, no un porcentaje abstracto.
  await gotoApp(page);
  await alCheckoutSinElegirPago(page);
  // 8/(1-0.055) - 8 = S/0.47
  await expect(page.locator('text=Ahorras S/0.47')).toBeVisible();
});

test('el checkout dice a nombre de quién llega la transferencia', async ({ page }) => {
  // Yape muestra el nombre del TITULAR, no el de la marca. Ver un nombre personal donde
  // esperabas SND//WCH es el momento exacto en que alguien se detiene a pensar que se
  // equivocó de destinatario — y una transferencia que no se hace es un pedido perdido.
  await gotoApp(page);
  await alCheckoutSinElegirPago(page);
  await expect(page.locator('text=Es la cuenta del negocio')).toBeVisible();
});

test('el QR de pago es el QR real de Yape, no un código de contacto generado', async ({ page }) => {
  // Hasta el 2026-09-05 acá se dibujaba un QR generado que codificaba un `MECARD:` — una
  // TARJETA DE CONTACTO. Escanearlo dentro de Yape no hacía nada, porque Yape espera su
  // propio formato emitido por el banco; el rótulo igual decía "escanea el código QR".
  //
  // Modo de fallo: SILENCIO. El cliente escanea, no pasa nada, y no hay error en ningún
  // lado. Por eso lo que se fija es que la fuente sea la IMAGEN que el dueño exportó de su
  // app, y que NO haya vuelto un SVG generado en su lugar.
  await gotoApp(page);
  await alCheckoutSinElegirPago(page);
  const qr = page.locator('img[src="img/yape-qr.png"]');
  await expect(qr).toBeVisible();
  // El navegador de escritorio no puede escanear su propia pantalla, así que el QR va
  // ABIERTO por defecto ahí: es LA vía de pago en compu, no un extra plegado.
  await expect(page.locator('text=Abre Yape en tu celular y escanea')).toBeVisible();
});

test('elegir tarjeta a propósito sí aplica el recargo, y se le avisa al cliente', async ({ page }) => {
  // El default no puede convertirse en un embudo: la tarjeta tiene que seguir estando a un
  // tap, cobrar lo que cobra, y decirlo.
  await gotoApp(page);
  await alCheckoutSinElegirPago(page);
  await page.locator('[onclick*="selectPayMethod(\'culqi\')"]').click();
  await expect(page.locator('text=de comisión por pagar con tarjeta')).toBeVisible();
  // Y el camino de vuelta existe.
  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await expect(page.locator('text=Transfiere por Yape o Plin a')).toBeVisible();
});

test('prender y apagar el crédito devuelve a Yape, no deja al cliente en tarjeta', async ({ page }) => {
  // Bug real que este default introdujo: el toggle del crédito ponía manualPayMethod=null
  // (=tarjeta) al prenderse y no lo devolvía al apagarse, así que dos taps en una casilla
  // que quedó desmarcada dejaban al cliente pagando comisión sin haber elegido nunca la
  // tarjeta — y sin nada en pantalla que se lo dijera.
  await gotoApp(page, {
    login: {
      customer: { phone: '900000002', name: 'Cliente Crédito', points: 0, credit_balance: 200 },
      isAdmin: false,
      token: 'tok-credito',
    },
    'session-check': {
      valid: true,
      customer: { phone: '900000002', name: 'Cliente Crédito', points: 0, credit_balance: 200 },
    },
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000002');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await expect(page.getByRole('button', { name: 'INGRESAR //' })).toHaveCount(0);

  await page.locator('.bottom-nav').getByRole('button', { name: 'PEDIDO' }).click();
  await alCheckoutSinElegirPago(page);

  await page.locator('[onclick*="toggleCredit()"]').click();
  await expect(page.getByRole('button', { name: 'CONFIRMAR CON CRÉDITO //' })).toBeVisible();

  await page.locator('[onclick*="toggleCredit()"]').click();
  await expect(page.locator('text=Transfiere por Yape o Plin a')).toBeVisible();
  await expect(page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' })).toBeVisible();
});

test('el default no le esconde las recompensas ni el código promocional al cliente', async ({ page }) => {
  // REGRESIÓN REAL introducida por este mismo cambio. El checkout ocultaba el selector de
  // recompensas y el campo de código promocional en cuanto había un método manual elegido —
  // una regla escrita cuando ese método SOLO podía llegar por una elección explícita, con el
  // monto a transferir ya en pantalla. Al volver Yape el default, la condición se cumplía
  // desde el primer render y un cliente con puntos entraba a pagar sin ver dónde canjearlos.
  // Nada reventaba: la función simplemente dejaba de existir.
  await gotoApp(page, {
    login: {
      customer: { phone: '900000003', name: 'Cliente Puntos', points: 900, credit_balance: 0 },
      isAdmin: false,
      token: 'tok-puntos',
    },
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000003');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await expect(page.getByRole('button', { name: 'INGRESAR //' })).toHaveCount(0);
  await page.locator('.bottom-nav').getByRole('button', { name: 'PEDIDO' }).click();

  await alCheckoutSinElegirPago(page);
  expect(await page.locator('[onclick*="toggleReward("]').count()).toBeGreaterThan(0);

  // Y lo que la regla original protegía sigue en pie: una vez que el cliente ELIGE
  // transferir, con el monto ya en pantalla listo para copiar, el selector se cierra.
  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  expect(await page.locator('[onclick*="toggleReward("]').count()).toBe(0);
});

// ── RECARGO POR PAN DE FOCACCIA ──────────────────────────────────────────────────────
//
// [MEDIDO] dueño 2026-09-03: de una focaccia de S/13 salen 10 de 15CM o 5 de 30CM.
// Sobrecosto real sobre el pan sub: +S/0.30 y +S/0.60. Se cobra S/0.50 y S/1.00.

test('el recargo de la focaccia se ve ANTES de elegirla y entra al precio', async ({ page }) => {
  await gotoApp(page);
  await page.locator('text=Arma el tuyo').click();
  await page.locator('[onclick*="startOrder(\'byo\')"]').first().click();
  await expect(page.locator('text=ARMA EL TUYO')).toBeVisible();
  await page.locator('[onclick*="size=\'15\'"]').click();

  // El monto está en la tarjeta del pan, en el paso de elegir — no aparece recién en el
  // carrito. Un precio que sale después de haber elegido es la clase de sorpresa que hace
  // abandonar el pedido.
  await expect(page.locator('[onclick*="base=\'B03\'"]')).toContainText('+S/0.50');
  await expect(page.locator('[onclick*="base=\'B01\'"]')).not.toContainText('+S/');

  // El 30CM cobra el doble, porque usa el doble de pan.
  await page.locator('[onclick*="size=\'30\'"]').click();
  // pz() no escribe decimales cuando no hacen falta: el doble de S/0.50 se muestra "+S/1".
  await expect(page.locator('[onclick*="base=\'B03\'"]')).toContainText('+S/1');
  await expect(page.locator('[onclick*="base=\'B03\'"]')).not.toContainText('+S/0.50');
});
