import { test, expect } from '@playwright/test';
import { gotoApp, mockBackend, APP_FILE, stubWindowOpen } from './helpers';

// LAS TRES PALANCAS DEL MODELO — medición y empujones (2026-09-06).
//
// POR QUÉ EXISTE ESTE ARCHIVO. `PREDICCION_V12.md` concluye que la meta de S/5,000 netos
// sostenidos NO se alcanza con más publicidad (a S/20,000/mes el resultado empeora), sino
// con tres números: la mezcla Signature / ARMA EL TUYO, el attach de bebida y los referidos
// por cada 100 pedidos servidos.
//
// EL MODO DE FALLO DE TODO LO QUE SE PRUEBA ACÁ ES SILENCIO. Si alguien vuelve a esconder la
// invitación a referir detrás de la calificación, quita el puente a los Signatures o borra la
// pantalla de medición, nada revienta: los tipos compilan, el checkout funciona, y el negocio
// simplemente vuelve a la mezcla que el modelo dice que no llega a la meta. Por eso lo que se
// fija es CONTENIDO y ESTADO, no que la pantalla no explote.

const CLIENTE = { phone: '900000001', name: 'Ana Cliente', points: 0, credit_balance: 0, total_orders: 3 };

// ── PALANCA 3 · EL REFERIDO NO PUEDE VOLVER A COLGAR DE LA CALIFICACIÓN ────────────────

const pedidoEntregado = (ref: string) => ({
  id: 'ord-1', ref, status: 'ENTREGADO', payment_status: 'paid', payment_method: 'yape',
  total: 20.9, created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  items: [{ type: 'sig', sigId: 'SIG01', size: '15', qty: 1 }],
});

async function entrarConPedidoEntregado(page: any, ref = 'REF-001') {
  await gotoApp(page, {
    login: { customer: CLIENTE, isAdmin: false, token: 'tok-ana' },
    'session-check': { valid: true, customer: CLIENTE },
    'my-orders': { orders: [pedidoEntregado(ref)] },
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await expect(page.getByRole('button', { name: 'INGRESAR //' })).toHaveCount(0);
}

test('un pedido entregado ofrece referir aunque el cliente NO haya calificado', async ({ page }) => {
  // El defecto que esto arregla: la invitación estaba DOBLEMENTE condicionada — solo si
  // calificaba, y solo en el render inmediato después de hacerlo. Calificar es opcional, así
  // que el momento de mayor intención (acaba de recibir su comida) quedaba sin usar para todo
  // el que no calificara, y la pantalla mostraba espacio vacío en su lugar.
  await entrarConPedidoEntregado(page);
  await page.locator('[onclick*="sndScreen=\'p_orders\';loadMyOrders()"]').click();
  await expect(page.locator('text=REF-001')).toBeVisible({ timeout: 10000 });
  await page.locator('text=REF-001').click();
  await expect(page.getByRole('button', { name: 'Compartir //' })).toBeVisible({ timeout: 10000 });
});

test('la invitación dice los DOS bonos, con el número real de cada uno', async ({ page }) => {
  // Es la regla que ya costó tres promesas rotas a la vez en los textos de marketing: si el
  // dueño mueve el bono desde el código y el texto se quedó escrito a mano, la app promete un
  // premio que la recompensa ya no paga. Acá se exige que los dos números estén presentes.
  await entrarConPedidoEntregado(page);
  await page.locator('[onclick*="sndScreen=\'p_orders\';loadMyOrders()"]').click();
  await expect(page.locator('text=REF-001')).toBeVisible({ timeout: 10000 });
  await page.locator('text=REF-001').click();
  await expect(page.locator('text=400 pts')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=120 pts')).toBeVisible();
});

test('a un invitado sin cuenta no se le ofrece referir', async ({ page }) => {
  // El código de referido ES el teléfono del cliente: para un invitado no existe, así que
  // ofrecerlo sería un botón que no puede funcionar. La tarjeta se salta ese caso mirando
  // `cust`, y esta prueba es lo que impide que alguien la muestre "para todos" y deje a los
  // invitados con un botón muerto.
  await mockBackend(page, { 'my-orders': { orders: [pedidoEntregado('REF-002')] } });
  await stubWindowOpen(page);
  await page.goto(APP_FILE);
  await page.waitForSelector('text=SIGNATURE');
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  // Sin sesión, PUNTOS enseña el registro/login — nunca el historial ni la invitación.
  await expect(page.getByRole('button', { name: 'Compartir //' })).toHaveCount(0);
});

// ── PALANCA 1 · EL PUENTE DE VUELTA A LOS SIGNATURES ──────────────────────────────────

test('ARMA EL TUYO ofrece una receta ya resuelta, sin dejar de ofrecer el armador', async ({ page }) => {
  // Las DOS aserciones son el punto: el puente existe Y el armador sigue entero. Empujar la
  // mezcla escondiendo o encareciendo ARMA EL TUYO rompería la mitad de la identidad de la
  // marca (los dos hermanos) para ganar céntimos.
  await gotoApp(page);
  await page.locator('text=Arma el tuyo').click();
  await expect(page.locator('text=¿Prefieres que ya esté resuelto?')).toBeVisible();
  await expect(page.locator('text=The Original')).toBeVisible();
  // El armador sigue completo: los panes se pueden elegir y el paso a paso sigue ahí.
  await expect(page.getByRole('button', { name: 'Ver el paso a paso completo →' })).toBeVisible();
  await expect(page.locator('[onclick*="startOrderWithBase"]').first()).toBeVisible();
});

// ── PALANCA 2 · EL EMPUJÓN DE BEBIDA ENCABEZA CON EL PRODUCTO ─────────────────────────

test('el empujón de bebida no encabeza con el descuento de S/1', async ({ page }) => {
  // El combo bajó de S/2 a S/1 el 2026-08-22 y este texto se quedó ofreciendo un ahorro de
  // S/1 sobre un producto de S/5-6 — encabezando con su argumento más débil. Lo que vende
  // estas bebidas es que NO son gaseosas de reventa. El descuento sigue nombrado, de segundo.
  await gotoApp(page);
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  await expect(page.locator('text=Infusiones de la casa, hechas acá')).toBeVisible();
  // Y el combo sigue nombrado: quitarlo entero sería esconder un descuento que sí existe.
  await expect(page.locator('text=el combo te descuenta')).toBeVisible();
});
