import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// CATÁLOGO EDITABLE DESDE EL PANEL (2026-08-27). Hasta esta fecha, cambiar el nombre, el
// pitch, el badge, la composición o el precio de un Signature exigía editar `SIGS` en
// src/app.ts, `SIG_DATA` y `SIG_LABEL` en catalog.ts, la foto en `SIG_IMG`, la tabla
// `catalog_prices`, y recompilar y desplegar. Retirar uno (como pasó con THE CHICAGO)
// costaba una sesión de código entera.
//
// Ahora la fila vigente de la tabla `catalog_items` manda, y el cliente la recibe por la
// acción pública `get-catalog` (campo `sigItems`). Los literales de SIGS quedaron como
// SEMILLA: lo que se ve en el primer render y el respaldo si el servidor no responde.
//
// Estos dos tests cubren justamente eso — que el literal del código NO sea lo que gana.

const ITEM_BASE = {
  s: 'Signature', badge: 'Clásico', base: 'B01', prot: 'P01',
  tops: ['T01', 'T02', 'T03'], sauces: ['S01', 'S04'],
  p15: 20.9, p30: 26.9, img: 'img/sig01.jpg', active: true,
  fixedCheese: null, cheeseOptional: false,
};

test('el nombre de un Signature sale de la base, no del literal del código', async ({ page }) => {
  await gotoApp(page, {
    'get-catalog': {
      proteins: {}, sigs: {}, sides: {}, rewardPts: {},
      sigItems: {
        // En src/app.ts este literal se llama "The Original". Si el cliente mostrara el
        // literal en vez de esto, el test falla — que es exactamente lo que se quiere
        // detectar: significaría que cambiar el menú desde el panel no tiene efecto.
        SIG01: { ...ITEM_BASE, n: 'El Renombrado', badge: 'Badge del panel', pitch: 'Pitch publicado desde el panel.' },
      },
    },
  });

  await expect(page.locator('text=El Renombrado')).toBeVisible();
  // El badge también sale de la base. Se verifica en la tarjeta del home junto al nombre;
  // el pitch NO se comprueba acá porque esa pantalla no lo muestra — vive en el detalle
  // del Signature. Afirmarlo acá haría fallar el test por una expectativa equivocada, no
  // por un defecto del código (pasó exactamente eso al escribirlo).
  await expect(page.locator('text=Badge del panel')).toBeVisible();
  // Y el literal del código ya no debe aparecer por ningún lado.
  await expect(page.locator('text=The Original')).not.toBeVisible();
});

test('un Signature publicado como inactivo desaparece de la carta', async ({ page }) => {
  await gotoApp(page, {
    'get-catalog': {
      proteins: {}, sigs: {}, sides: {}, rewardPts: {},
      sigItems: {
        // Retirar un ítem del menú es publicar active:false — sin tocar código, y
        // conservando su receta en la tabla para cuando vuelva.
        SIG01: { ...ITEM_BASE, n: 'The Original', pitch: 'Da igual, está retirado.', active: false },
      },
    },
  });

  // Se espera a que OTRO Signature esté visible antes de afirmar la ausencia: si no, el
  // test podría pasar simplemente porque el fetch de catálogo todavía no resolvió, y no
  // estaría probando nada.
  await expect(page.locator('text=The Teriyaki').first()).toBeVisible();
  await expect(page.locator('text=The Original')).not.toBeVisible();
});
