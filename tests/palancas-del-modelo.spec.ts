import { test, expect } from '@playwright/test';
import { APP_FILE, elegirSando, entrarConTelefono, gotoApp, hastaLaProteina, irAlArmador, mockBackend, stubWindowOpen } from './helpers';
import { unSignature } from './carta';

// Productos de la carta, preguntados a la carta: la regla no depende de qué haya este mes.
const UN_SIGNATURE = unSignature();

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
  items: [{ type: 'sig', sigId: UN_SIGNATURE, size: '15', qty: 1 }],
});

async function entrarConPedidoEntregado(page: any, ref = 'REF-001') {
  await gotoApp(page, {
    login: { customer: CLIENTE, isAdmin: false, token: 'tok-ana' },
    'session-check': { valid: true, customer: CLIENTE },
    'my-orders': { orders: [pedidoEntregado(ref)] },
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page, '900000001', '1234');
  await expect(page.getByRole('button', { name: 'INGRESAR //' })).toHaveCount(0);
}




// ── PALANCA 1 · EL PUENTE DE VUELTA A LOS SIGNATURES ──────────────────────────────────

test('ARMA EL TUYO ofrece una receta ya resuelta, sin dejar de ofrecer el armador', async ({ page }) => {
  // Las DOS aserciones son el punto: el puente existe Y el armador sigue entero. Empujar la
  // mezcla escondiendo o encareciendo ARMA EL TUYO rompería la mitad de la identidad de la
  // marca (los dos hermanos) para ganar céntimos.
  await gotoApp(page);
  // El puente vive en el paso de la proteína del Mundo WICHO (maqueta M22 con el puente).
  await hastaLaProteina(page);
  await expect(page.locator('button', { hasText: '¿Prefieres que ya esté resuelto?' })).toBeVisible();
  // ⚠ ACÁ DECÍA `text=The Original`, escrito a mano — y el código dice explícitamente lo
  // contrario: «El nombre sale del catálogo (que el servidor refresca), nunca escrito a
  // mano: si el dueño renombra o retira ese Signature, este texto lo sigue solo».
  // La prueba fijaba justo lo que el código hace dinámico, así que se rompió el
  // 2026-09-12 al mover la estrella a THE MARINARA sin que nada estuviera mal.
  // Ahora se lee del catálogo igual que el puente: es más estricto (falla si el puente
  // deja de seguir a `recommended`) y no se rompe cuando el dueño mueve la estrella.
  const recomendado = await page.evaluate(() => {
    const s = ((window as any).SIGS as any[]).find((x) => x.recommended);
    return s ? s.n : null;
  });
  expect(recomendado).toBeTruthy();
  await expect(page.locator('button', { hasText: '¿Prefieres que ya esté resuelto?' })).toContainText(recomendado as string);
  // El armador sigue entero: las proteínas se siguen ofreciendo y se puede seguir al paso
  // siguiente. El puente es una salida más, no un reemplazo.
  const armables = await page.evaluate(() => ((window as any).PROTS as any[]).filter((p) => !p.sigOnly && !p.vaultOnly).length);
  await expect(page.locator('.wb')).toHaveCount(armables);
  await expect(page.locator('button[onclick="byoStepNext()"], button.bt').first()).toBeVisible();
});

// ── PALANCA 2 · EL EMPUJÓN DE BEBIDA ENCABEZA CON EL PRODUCTO ─────────────────────────

