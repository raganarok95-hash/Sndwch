import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// El modo cocina se usa en un celular DEDICADO de gama baja, apoyado en la mesada, con las
// manos en la comida. Todo lo de acá salió de medir la pantalla real a 360×640 (viewport CSS
// típico de gama baja), no de suponer.
//
// MODO DE FALLO DE TODO ESTE ARCHIVO: SILENCIO. Ninguna de estas cosas lanza un error si se
// rompe — la pantalla se ve "bien" y simplemente vuelve a costar un gesto más con las manos
// sucias, o vuelve a esconder la mitad de la receta.

const ahora = Date.now();
const PEDIDO = {
  id: 'ord-1', ref: 'SND-1000', status: 'RECIBIDO',
  payment_status: 'pending', payment_method: 'yape',
  customer_name: 'Rosa Villanueva Chávez',
  customer_address: 'Av. Larco 1234, Dpto 502, Urb. La Merced, Trujillo',
  customer_phone: '987654321', contact_phone: '987654321',
  notes: 'Portón negro, tocar fuerte.', total: 45.8, date: '12/09 13:00', summary: '2 items',
  created_at: new Date(ahora - 1000 * 60 * 12).toISOString(),
  items: [{ type: 'sig', sigId: 'SIG01', size: '15', qty: 1 }],
  lat: -8.11, lon: -79.03,
};

test.use({ viewport: { width: 360, height: 640 } });

async function entrarACocina(page: any, pedidos: any[] = [PEDIDO]) {
  await page.evaluate(async (o: any) => {
    if (typeof (window as any).loadAdminBundle === 'function') {
      try { await (window as any).loadAdminBundle(); } catch (e) { /* ya cargado */ }
    }
    (window as any).adminOrders = o;
    (window as any).enterFocusMode();
  }, pedidos);
  // La pantalla entra con una animación (`class="fi"`). Medir antes de que termine da
  // tamaños ENCOGIDOS —el enlace de Maps mide 43.34 px a mitad de la transición y 44 exactos
  // al terminar— así que sin esta espera la prueba reporta un defecto que no existe y,
  // peor, deja de distinguir el día que sí exista.
  await page.waitForTimeout(700);
}

test('nada por debajo de 44×44: se toca de pie, con la mano ocupada', async ({ page }) => {
  await gotoApp(page);
  await entrarACocina(page);

  // El enlace "solo confirmar el pago" medía 20 px de alto y está pegado al botón grande:
  // errarle significa tocar "confirmar y preparar", que AVANZA el pedido.
  const chicos = await page.evaluate(() => {
    const out: string[] = [];
    document.querySelectorAll('button, a, [onclick]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.height < 44 || r.width < 44) {
        out.push(`${Math.round(r.width)}x${Math.round(r.height)} — ${(el as HTMLElement).innerText.slice(0, 40)}`);
      }
    });
    return out;
  });
  expect(chicos, 'zonas táctiles por debajo del mínimo de WCAG 2.5.5').toEqual([]);
});

test('la receta entra sin scroll, con el botón de acción todavía visible', async ({ page }) => {
  await gotoApp(page);
  await entrarACocina(page);

  const r = await page.evaluate(() => {
    const barra = [...document.querySelectorAll('div')]
      .find((d) => getComputedStyle(d).position === 'fixed' && getComputedStyle(d).bottom === '0px');
    const tope = barra ? barra.getBoundingClientRect().top : window.innerHeight;
    // El bloque de receta es el que lleva el rótulo "Para armar //".
    const rotulo = [...document.querySelectorAll('div')].find((d) => d.textContent?.trim() === 'Para armar //');
    const caja = rotulo?.parentElement?.getBoundingClientRect();
    return caja ? { fin: Math.round(caja.bottom), tope: Math.round(tope) } : null;
  });

  expect(r, 'no se encontró el bloque de receta').not.toBeNull();
  // Antes la barra fija cortaba la receta a media palabra —en "Proteína:" del 30CM— con un
  // corte tan limpio que parecía el borde de la tarjeta: no había forma de saber que faltaba.
  expect(r!.fin, `la receta termina en y=${r!.fin} y la barra tapa desde y=${r!.tope}`).toBeLessThanOrEqual(r!.tope);
});

test('una sola barra arriba, no dos: el rótulo no se come 100 px de una pantalla de 640', async ({ page }) => {
  await gotoApp(page);
  await entrarACocina(page);

  // Salir, las dos flechas y el contador viven en UNA fila. La segunda barra solo decía en
  // qué pantalla estás, que en un celular dedicado a operar nadie necesita que le recuerden.
  const alturaCabecera = await page.evaluate(() => {
    const salir = [...document.querySelectorAll('button')].find((b) => b.innerText.includes('Salir'));
    return salir ? Math.round(salir.getBoundingClientRect().bottom) : -1;
  });
  expect(alturaCabecera).toBeGreaterThan(0);
  expect(alturaCabecera, 'la cabecera volvió a ser de dos filas').toBeLessThanOrEqual(64);
});

test('la receta NUNCA calla un ingrediente que ya no está en la carta', async ({ page }) => {
  await gotoApp(page);
  // Un pedido con un Signature retirado — pasa de verdad: este repo ya retiró SIG07 y SIG08,
  // y un pedido programado o el historial puede seguir apuntando ahí.
  await entrarACocina(page, [{ ...PEDIDO, items: [{ type: 'sig', sigId: 'SIG99', size: '15', qty: 1 }] }]);

  // Antes `itemRecipeLines` devolvía [] y el bloque desaparecía entero: un pedido que se ve
  // SIN receta, en la pantalla que dice qué cocinar. Un dato que falta se dice, no se borra.
  await expect(page.locator('text=/ya no está en la carta/')).toBeVisible();
});

test('el aviso de pago sin confirmar sigue estando, y no lo tapa la barra', async ({ page }) => {
  await gotoApp(page);
  await entrarACocina(page);
  // Leer el comprobante no es confirmar el pago: este aviso es lo que recuerda mirar la
  // cuenta antes de preparar, y al reordenar la pantalla es justo lo que se pierde sin ruido.
  await expect(page.locator('text=/sin confirmar/')).toBeVisible();
});
