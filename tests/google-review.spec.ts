import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// D9 — Para un delivery local las reseñas de Google Maps son el canal gratuito más fuerte
// que existe, y hasta ahora la calificación se quedaba encerrada dentro de la app: alguien
// ponía 5 estrellas y ese valor no llegaba a nadie que no fuera ya cliente.
//
// Lo que fija este test, en orden de importancia:
//  1. El enlace se muestra IGUAL con 1 estrella que con 5. Enseñarlo solo a los contentos
//     es review gating: viola las políticas de Google y además fabrica un promedio falso.
//     Si este test se rompe porque alguien condicionó el bloque a la nota, el bloque está
//     mal, no el test.
//  2. Sin URL configurada no se muestra nada — un botón que no lleva a ninguna parte es
//     peor que no tener botón.
//  3. La URL sale de la base (get-store-hours), no del código: es un dato real del negocio.

const ENTREGADO = {
  id: 'ord-rev-1',
  ref: 'ORD-REV0001-AAAA',
  customer_name: 'Cliente de Prueba',
  customer_address: 'Av. Larco 100',
  summary: '1x SIGNATURE THE ORIGINAL',
  total: 22,
  status: 'ENTREGADO',
  payment_status: 'paid',
  payment_method: 'culqi',
  created_at: new Date().toISOString(),
  date: '29/08/2026',
};

const URL_RESENA = 'https://g.page/r/ejemplo-de-prueba/review';

async function calificarCon(page: any, estrellas: number, googleReviewUrl: string | null) {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000001', name: 'Cliente de Prueba', points: 50 }, isAdmin: false, token: 'tok-cust' },
    'my-orders': { orders: [ENTREGADO] },
    'get-store-hours': {
      hours: Array.from({ length: 7 }, () => ({ open: 0, close: 24, closed: false })),
      businessLaunched: true,
      googleReviewUrl,
    },
    'submit-rating': { success: true },
  });

  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000001');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();

  await page.locator('[onclick*="sndScreen=\'p_orders\';loadMyOrders()"]').click();
  await expect(page.locator('text=' + ENTREGADO.ref)).toBeVisible({ timeout: 10000 });
  await page.locator('text=' + ENTREGADO.ref).click();

  await expect(page.locator('text=¿Cómo estuvo tu pedido?')).toBeVisible();
  await page.locator(`[onclick="rtStars=${estrellas};render()"]`).click();
  await page.getByRole('button', { name: 'Enviar calificación //' }).click();
  return calls;
}

test('el enlace de reseña aparece con 5 estrellas', async ({ page }) => {
  await calificarCon(page, 5, URL_RESENA);
  const enlace = page.getByRole('link', { name: /Escribir reseña en Google/ });
  await expect(enlace).toBeVisible();
  await expect(enlace).toHaveAttribute('href', URL_RESENA);
});

test('el enlace de reseña aparece IGUAL con 1 estrella — no es review gating', async ({ page }) => {
  await calificarCon(page, 1, URL_RESENA);
  // Si alguna vez este test falla porque el bloque se escondió para notas bajas, lo que
  // está mal es el código: filtrar por nota viola las políticas de Google, y responder
  // bien a una reseña mala en público convence más que diez buenas.
  const enlace = page.getByRole('link', { name: /Escribir reseña en Google/ });
  await expect(enlace).toBeVisible();
  await expect(enlace).toHaveAttribute('href', URL_RESENA);
});

test('sin URL configurada no se muestra ningún enlace', async ({ page }) => {
  await calificarCon(page, 5, null);
  await expect(page.locator('text=/Escribir reseña en Google/')).toHaveCount(0);
  // Y el resto del agradecimiento sigue apareciendo: el bloque de reseña es un añadido,
  // no un reemplazo.
  await expect(page.locator('text=/¡Gracias por calificar!/')).toBeVisible();
});
