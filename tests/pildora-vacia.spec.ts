import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// NINGUNA PÍLDORA SIN TEXTO (2026-09-24).
//
// La carta v4 salió sin badges (decisión del dueño) y el mosaico del home siguió pintando el
// sello del badge igual: un óvalo oscuro vacío en la esquina de cada tarjeta. Nada fallaba —el
// badge vacío es un valor válido, el panel permite borrarlo— y la pantalla parecía rota.
//
// La prueba no pregunta por ningún producto ni por ningún badge: mira TODA píldora visible del
// home (algo con borde totalmente redondeado) y exige que diga algo. Cubre el mosaico y
// cualquier píldora nueva que alguien agregue con un texto que puede venir vacío.

test('el home no pinta píldoras vacías', async ({ page }) => {
  await gotoApp(page);
  await page.waitForTimeout(500);
  const vacias = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll('#app span, #app div'))) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (parseFloat(cs.borderTopLeftRadius) < 100) continue; // solo píldoras (radio 999)
      if (el.children.length > 0) continue;                   // un contenedor redondeado no es una píldora
      if (r.width < r.height * 1.5) continue;                 // un punto de color es un círculo, no una píldora
      if (parseFloat(cs.paddingLeft) === 0) continue;         // una barra de progreso tampoco: solo la píldora de texto lleva relleno
      if ((el.textContent || '').trim() === '') out.push(el.outerHTML.slice(0, 160));
    }
    return out;
  });
  expect(vacias, 'píldoras visibles sin texto:\n' + vacias.join('\n')).toEqual([]);
});
