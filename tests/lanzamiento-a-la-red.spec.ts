import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// EL LANZAMIENTO A LA RED PROPIA — la palanca del mes 3.
//
// POR QUÉ EXISTE. La simulación del 2026-09-13 (`PREDICCION_V13.md`, `modelo/modelo_v14.py`)
// midió que avisarle a 200 personas hace que P(S/3,000 netos en el mes 3) pase de 1.2% a
// 44.7%, y que MÁS PUBLICIDAD NO LO MUEVE — a S/8,000 de lanzamiento sale peor que a S/0,
// porque el gasto se resta hoy y el cliente devuelve en su segundo pedido.
//
// MODO DE FALLO: SILENCIO, por dos lados distintos.
//   · Si el bloque desaparece, no revienta nada: el dueño simplemente no lo hace, y el mes 3
//     no llega. Una palanca que nadie ve es una palanca que no existe.
//   · Si el link pierde el `?src=lanzamiento`, tampoco revienta nada: esos clientes entran a
//     la línea base orgánica como si fueran un ritmo diario, y meses después el freno apaga
//     la publicidad por 'sin-incrementales' — la campaña muerta por una fiesta de apertura.

const ADMIN = { phone: '900000000', name: 'Admin' };

async function abrirMarketing(page: any) {
  await gotoApp(page, {
    login: { customer: ADMIN, isAdmin: true, token: 'tok-admin' },
    'session-check': { valid: true, customer: ADMIN, isAdmin: true },
    'admin-orders': { orders: [], truncated: false },
    'addresses-list': { addresses: [] },
    'favorites-list': { favorites: [] },
    'my-orders': { orders: [] },
    'admin-marketing-content': {
      current: { theme: 'TEMA A', whatsapp: 'wa a', caption: 'cap a', videoIdea: 'vid a', photoIdea: 'foto a' },
      next: { theme: 'TEMA B', whatsapp: 'wa b', caption: 'cap b', videoIdea: 'vid b', photoIdea: 'foto b' },
    },
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').click();
  await page.getByText('Avísale a tu gente').first().click();
  await expect(page.locator('text=MARKETING')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(500);
}

test('el bloque del lanzamiento existe y trae el link marcado', async ({ page }) => {
  await abrirMarketing(page);
  await expect(page.locator('text=Avísale a tu gente')).toBeVisible();
  // ⚠ El `?src=lanzamiento` es lo que separa a esta gente del orgánico sostenido. Sin él, el
  // freno de CAC apaga la publicidad meses después por una ráfaga que ocurrió una sola vez.
  await expect(page.locator('text=?src=lanzamiento').first()).toBeVisible();
});

test('va ARRIBA del contenido semanal — lo que se deja para después no se hace', async ({ page }) => {
  await abrirMarketing(page);
  const yLanz = await page.locator('text=Avísale a tu gente').boundingBox();
  const ySemana = await page.locator('text=Esta semana').boundingBox();
  expect(yLanz!.y).toBeLessThan(ySemana!.y);
});

test('el bono del mensaje se INTERPOLA, no está escrito a mano', async ({ page }) => {
  await abrirMarketing(page);
  // El servidor otorga 40 y el cliente lo lee de su constante. Si alguien escribe el número
  // dentro del texto, `npm run parity` deja de poder compararlo y la promesa se desincroniza
  // sola el día que el servidor la mueva — ya pasó tres veces en este repo.
  const texto = await page.evaluate(() => {
    const f = (window as any).lanzamientoTexto;
    return typeof f === 'function' ? f() : null;
  });
  expect(texto).toContain('puntos de bienvenida');
  const esperado = await page.evaluate(() => (window as any).WELCOME_BONUS_POINTS);
  expect(esperado).toBeGreaterThan(0);
  expect(texto).toContain(String(esperado) + ' puntos de bienvenida');
});

test('⚠ sobrevive aunque el contenido semanal no cargue', async ({ page }) => {
  // El bloque estaba DETRÁS del `return` de error de la pantalla, así que un fallo cargando
  // el brief semanal —que no tiene nada que ver— hacía desaparecer entera la palanca que más
  // mueve los primeros tres meses. No depende de ese fetch: es un link y un texto que se
  // arman en el cliente.
  await gotoApp(page, {
    login: { customer: ADMIN, isAdmin: true, token: 'tok-admin' },
    'session-check': { valid: true, customer: ADMIN, isAdmin: true },
    'admin-orders': { orders: [], truncated: false },
    'addresses-list': { addresses: [] },
    'favorites-list': { favorites: [] },
    'my-orders': { orders: [] },
    // Un handler que LANZA es la forma que tiene el helper de simular un error real del
    // servidor (ver `mockBackend`): el cliente solo distingue éxito/error por el status HTTP.
    'admin-marketing-content': () => { throw new Error('el brief se cayó'); },
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').click();
  await page.getByText('Avísale a tu gente').first().click();
  await page.waitForTimeout(600);

  await expect(page.locator('text=Avísale a tu gente').first()).toBeVisible();
  await expect(page.locator('text=?src=lanzamiento').first()).toBeVisible();
  // Y el fallo del brief se dice, no se calla: decir solo "no se pudo cargar" sin decir QUÉ
  // dejaría al dueño pensando que el link tampoco sirve.
  await expect(page.locator('text=No se pudo cargar el contenido semanal')).toBeVisible();
});
