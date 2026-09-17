import { test, expect } from '@playwright/test';
import { mockBackend, APP_FILE } from './helpers';

// NINGÚN TEXTO DE LA APP POR DEBAJO DEL MÍNIMO LEGIBLE
//
// Esta app tiene DOS pieles que se aplican sobre el mismo HTML: la de SANDO y la de WICHO,
// que cambian fondo, tarjeta, borde y acento con un solo atributo (`data-lado`). Eso hace
// que un color elegido mirando una de las dos pueda quedar ilegible en la otra sin que nadie
// toque esa pantalla — y ya pasó: el texto del lado de WICHO era casi negro sobre un fondo
// que después se volvió casi negro. Nada revienta; simplemente no se lee.
//
// La comprobación no opina de estética: mide el contraste REAL de cada texto pintado contra
// el fondo que de verdad tiene detrás (subiendo por los padres hasta encontrar uno opaco) y
// lo compara con el mínimo de WCAG AA — 4.5:1, o 3:1 si el texto es grande o seminegrita.
// Es la misma regla que ya se usó a mano al elegir los colores del semáforo del panel.
//
// Recorre las pantallas por las que pasa un cliente real, en los DOS lados.

type Fallo = { pantalla: string; texto: string; px: number; ratio: number; color: string; fondo: string };

const PANTALLAS: [string, string][] = [
  ['entrada', "window.homeTab=null;window.sndScreen='o_home';"],
  ['home-sando', "window.homeTab='sig';window.sndScreen='o_home';"],
  ['home-wicho', "window.homeTab='byo';window.sndScreen='o_home';"],
  ['bebidas', "window.homeTab='drink';window.sndScreen='o_home';"],
  ['ficha-signature', "window.selSig='SIG01';window.sndScreen='o_sig';"],
  ['armador-pan', "window.byoStep=0;window.size=null;window.base=null;window.sndScreen='o_build';"],
  ['armador-proteina', "window.size='15';window.base='B01';window.byoStep=1;window.sndScreen='o_build';"],
  ['armador-queso', "window.prot='P02';window.byoStep=2;window.sndScreen='o_build';"],
  ['armador-vegetales', "window.byoStep=3;window.sndScreen='o_build';"],
  ['armador-salsas', "window.byoStep=4;window.sndScreen='o_build';"],
  ['confirmar', "window.sndScreen='o_item_confirm';"],
  ['carrito', "window.sndScreen='o_cart';"],
  ['ingresar', "window.sndScreen='p_auth';"],
  ['legal', "window.sndScreen='p_legal';"],
  ['reclamos', "window.sndScreen='p_complaints';"],
];

test('ningún texto queda por debajo del contraste mínimo, en ninguna de las dos pieles', async ({ page }) => {
  await mockBackend(page);
  await page.goto(APP_FILE);
  await page.waitForTimeout(700);

  const fallos: Fallo[] = [];

  for (const [nombre, estado] of PANTALLAS) {
    await page.evaluate((s) => {
      // eslint-disable-next-line no-eval
      eval(s);
      (window as any).render();
    }, estado);
    await page.waitForTimeout(220);

    const malos = await page.evaluate(() => {
      const lum = (c: string) => {
        const m = (c.match(/[\d.]+/g) || ['0', '0', '0']).map(Number).slice(0, 3).map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2];
      };
      // El fondo REAL detrás del texto. No basta con quedarse en el primer ancestro que
      // tenga color: media app usa veladuras (`rgba(...,.14)`) sobre el fondo de la
      // pantalla, y tomar esa veladura como si fuera opaca daba 1:1 en textos que en
      // pantalla se leen perfecto. Hay que COMPONER cada capa sobre la de abajo, que es lo
      // que hace el navegador.
      const partes = (c: string) => (c.match(/[\d.]+/g) || ['0', '0', '0']).map(Number);
      const fondoDe = (el: Element) => {
        const capas: number[][] = [];
        let n: Element | null = el;
        while (n && n !== document.documentElement) {
          const bg = getComputedStyle(n).backgroundColor;
          if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) {
            const p = partes(bg);
            capas.push([p[0], p[1], p[2], p.length > 3 ? p[3] : 1]);
            if ((p.length > 3 ? p[3] : 1) >= 0.999) break;
          }
          n = n.parentElement;
        }
        const base = partes(getComputedStyle(document.body).backgroundColor || 'rgb(18,21,15)');
        let r = base[0], g = base[1], b = base[2];
        for (let i = capas.length - 1; i >= 0; i--) {
          const [cr, cg, cb, a] = capas[i];
          r = cr * a + r * (1 - a); g = cg * a + g * (1 - a); b = cb * a + b * (1 - a);
        }
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
      };
      const out: any[] = [];
      document.querySelectorAll('#app *').forEach((el) => {
        // Solo el texto propio del elemento: si se contara el de los hijos, cada contenedor
        // reportaría el texto de toda su rama con SU color, que no es el que se ve.
        const t = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => (n.textContent || '').trim()).join('').trim();
        if (t.length < 2) return;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4 || cs.visibility === 'hidden' || +cs.opacity === 0) return;
        // Un texto sobre una FOTO no se puede medir así: el fondo es la imagen, no un color.
        // Esos llevan su propia sombra de texto y su degradado, y medirlos contra el color
        // del contenedor daría un número que no significa nada.
        if (cs.textShadow && cs.textShadow !== 'none') return;
        // La OPACIDAD del elemento (y la de sus padres) también apaga el texto: `opacity:.5`
        // sobre blanco no es blanco, es gris a medio camino del fondo. El navegador compone;
        // medir el color declarado sería medir un color que nadie ve. Es el caso de los pasos
        // pendientes del riel del armador, que se atenúan justo así.
        let op = 1;
        for (let a: Element | null = el; a && a !== document.documentElement; a = a.parentElement) {
          op *= Number(getComputedStyle(a).opacity || 1);
        }
        const fondo = fondoDe(el);
        const mezcla = (c: string, bg: string, alpha: number) => {
          const p = partes(c), q = partes(bg);
          return `rgb(${p[0] * alpha + q[0] * (1 - alpha)}, ${p[1] * alpha + q[1] * (1 - alpha)}, ${p[2] * alpha + q[2] * (1 - alpha)})`;
        };
        const l1 = lum(op < 0.999 ? mezcla(cs.color, fondo, op) : cs.color);
        const l2 = lum(fondo);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const px = parseFloat(cs.fontSize);
        const grande = px >= 18.66 || (px >= 14 && Number(cs.fontWeight) >= 600);
        if (ratio < (grande ? 3 : 4.5)) {
          out.push({ texto: t.slice(0, 40), px, ratio: +ratio.toFixed(2), color: cs.color + (op < 0.999 ? ` @${op.toFixed(2)}` : ''), fondo });
        }
      });
      return out;
    });

    for (const m of malos) fallos.push({ pantalla: nombre, ...m });
  }

  expect(
    fallos,
    'textos por debajo del mínimo WCAG AA:\n' +
      fallos.map((f) => `  · [${f.pantalla}] "${f.texto}" ${f.px}px ratio ${f.ratio}:1 — ${f.color} sobre ${f.fondo}`).join('\n'),
  ).toEqual([]);
});

test('el lado de WICHO se mide igual que el de SANDO', async ({ page }) => {
  // El mismo HTML con la otra piel. Este test existe aparte porque el cambio de lado no es
  // una pantalla: es un atributo en el root que reescribe TODOS los tokens a la vez.
  await mockBackend(page);
  await page.goto(APP_FILE);
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    (window as any).homeTab = 'byo';
    (window as any).sndScreen = 'o_home';
    (window as any).render();
  });
  await page.waitForTimeout(300);

  const lado = await page.evaluate(() => document.documentElement.getAttribute('data-lado'));
  expect(lado, 'entrar por ARMA EL TUYO tiene que poner la piel de WICHO').toBe('wicho');
});
