// EL RECORRIDO POR TODAS LAS PANTALLAS DEL CLIENTE (2026-10-01).
//
// Promesas, cada una con su modo de fallo silencioso:
//   · ninguna pantalla vuelve al VERDE de la app anterior (el dueño: «en ciertas pantallas se
//     ve de fondo el fondo verde»; había seis verdes escritos a mano que ningún chequeo veía);
//   · ningún texto queda por debajo de 3:1 de contraste con su fondo (los enlaces legales
//     estaban a 2:1 sobre la losa: el Libro de Reclamaciones, obligatorio, casi invisible);
//   · ninguna pantalla pinta «undefined», «NaN» ni «null» (este recorrido encontró la fila
//     legal convertida en «undefined» por un `return` con un comentario detrás).
// Mide el color calculado de cada elemento: no busca textos ni clases.
import { test, expect } from '@playwright/test';
import { gotoApp, pedirUnSignature } from './helpers';
const PANTALLAS = ['o_home','o_sig','o_build','o_cart','o_dir','o_pagar','o_sides','o_sent','p_auth','p_welcome','p_legal','p_lo_legal','p_returns','p_complaints','p_home','p_datos','p_rewards','p_history','p_orders','p_ord_detail','p_problema','o_secreto','p_pago','p_avisos','group_order','group_split','p_addresses'];
test('ninguna pantalla del cliente tiene verde viejo, contraste bajo ni «undefined»', async ({ page }) => {
  test.setTimeout(240000);
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Ana', points: 120, total_orders: 2 }, isAdmin: false, token: 't' },
    'addresses-list': { addresses: [{ id: 'a1', label: 'Casa', address: 'Av. España 123', lat: -8.1, lon: -79.0 }] },
    '*': { success: true },
  });
  await pedirUnSignature(page);
  const salida: string[] = [], problemas: string[] = [];
  for (const sc of PANTALLAS) {
    await page.evaluate((sc) => { const w = window as any;
      w.cust = w.cust || { phone: '900000001', name: 'Ana', points: 120, total_orders: 2, credit_balance: 0 };
      w.myOrders = w.myOrders && w.myOrders.length ? w.myOrders : [{ id: '11111111-1111-4111-8111-111111111111', ref: 'A41', status: 'EN CAMINO', total: 34, delivery_fee: 5, items: w.cart, created_at: new Date().toISOString(), payment_method: 'yape' }];
      w._sndOd = w.myOrders[0].id; w.groupCode = 'ABCD23'; w.groupData = null;
      w.sndScreen = sc; w.busy = false; try { w.render(); } catch (e) {} }, sc);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const r = await page.evaluate(() => {
      const rgb = (s: string) => (s.match(/[\d.]+/g) || []).map(Number);
      const lum = (c: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const fondo = (el: Element | null): number[] => { while (el) { const c = rgb(getComputedStyle(el).backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] > 0.6)) return c; el = el.parentElement; } return [255, 255, 255]; };
      const verdes: string[] = [], chicas: string[] = [], bajas: string[] = [], rotos: string[] = [];
      const vis = (document.getElementById('app') as HTMLElement).innerText;
      for (const m of vis.match(/\b(undefined|NaN|null)\b/g) || []) rotos.push(m);
      for (const el of Array.from(document.querySelectorAll('#app *'))) {
        const cs = getComputedStyle(el), b = el.getBoundingClientRect();
        if (b.width < 2 || b.height < 2 || cs.visibility === 'hidden' || cs.display === 'none' || el.closest('[aria-hidden="true"]')) continue;
        const bg = rgb(cs.backgroundColor);
        if (bg.length >= 3 && (bg[3] === undefined || bg[3] > 0.3) && bg[1] > bg[0] + 2 && bg[1] > bg[2] + 2 && lum(bg) < 0.06) verdes.push(el.tagName + '.' + String(el.className).slice(0, 30) + ' ' + cs.backgroundColor);
        const propio = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent || '').trim().length > 1);
        if (!propio) continue;
        const t = (el.textContent || '').trim().slice(0, 30);
        if (parseFloat(cs.fontSize) < 11) chicas.push(cs.fontSize + ' «' + t + '»');
        const fg = rgb(cs.color), bgc = fondo(el);
        const L1 = lum(fg), L2 = lum(bgc), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        if (ratio < 3 && parseFloat(cs.opacity) > 0.5 && !el.classList.contains('cut-sep')) bajas.push(ratio.toFixed(1) + ' «' + t + '» ' + el.tagName + '.' + String(el.className).slice(0,20) + ' ' + cs.color + ' sobre ' + bgc.join(','));
      }
      return { rotos, verdes: [...new Set(verdes)].slice(0, 6), chicas: [...new Set(chicas)].slice(0, 8), bajas: [...new Set(bajas)].slice(0, 8), nC: new Set(chicas).size, nB: new Set(bajas).size };
    });
    problemas.push(...r.verdes.map((v) => sc + ' verde: ' + v), ...r.bajas.map((b) => sc + ' contraste: ' + b), ...r.rotos.map((x) => sc + ' pinta: ' + x));
    salida.push(`## ${sc}  verdes=${r.verdes.length} chicas=${r.nC} contraste<3=${r.nB}\n  V: ${r.verdes.join(' | ')}\n  C: ${r.chicas.join(' | ')}\n  B: ${r.bajas.join(' | ')}`);
  }
  expect(problemas).toEqual([]);
});
