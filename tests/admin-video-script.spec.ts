import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// D5 — El backend de esto (actions/video.ts, 237 líneas) estaba implementado y registrado
// desde hace tiempo, pero ninguna pantalla lo llamaba: el dueño no tenía forma de llegar.
// La mitad que importa es gratis — genera guion, prompt para Flow/Veo, pie de publicación
// y hashtags a partir de la receta REAL del Signature, no de una descripción escrita a
// mano que se desactualiza.

const MOCK_ORDER = {
  id: 'ord-vid-1',
  ref: 'ORD-VID0001-AAAA',
  customer_name: 'Cliente',
  customer_address: 'Av. Test 1',
  contact_phone: '987654321',
  summary: '1x SIGNATURE THE ORIGINAL',
  total: 22,
  status: 'RECIBIDO',
  payment_status: 'paid',
  payment_method: 'culqi',
  created_at: new Date().toISOString(),
};

function guion(sigId: string, angleKey = 'macro') {
  return {
    success: true,
    sigId,
    name: 'The Original',
    angle: { key: angleKey, label: angleKey === 'macro' ? 'Macro del corte' : 'Vapor y calor' },
    guion: {
      duracion: '8 segundos',
      formato: 'Vertical 9:16 (Reels / TikTok / Stories)',
      plano: 'extreme macro lens',
      accion: 'el cuchillo termina el corte',
      ingredientes: 'Res asada · Tomate · Aioli',
      pan: 'CLASSIC // WHITE',
    },
    veoPrompt: 'PROMPT DE PRUEBA para ' + sigId,
    caption: 'The Original //\n\nRes asada en pan classic.',
    hashtags: '#sndwch #trujillo',
    angles: [
      { key: 'macro', label: 'Macro del corte' },
      { key: 'steam', label: 'Vapor y calor' },
    ],
    _nota: 'Falta GEMINI_API_KEY para generar el video automáticamente.',
  };
}

async function abrirGuion(page: any) {
  const calls = await gotoApp(page, {
    login: { customer: { phone: '900000000', name: 'Admin' }, isAdmin: true, token: 'tok-admin' },
    'admin-orders': () => ({ orders: [MOCK_ORDER], truncated: false }),
    'admin-video-script': (body: any) => guion(body.sigId, body.angle || 'macro'),
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').click();
  await expect(page.locator('text=' + MOCK_ORDER.ref)).toBeVisible({ timeout: 10000 });
  await page.locator('[onclick*="loadVideoScript()"]').first().click();
  await expect(page.locator('text=GUION DE VIDEO')).toBeVisible();
  return calls;
}

test('el panel arma el guion y deja copiar prompt, pie y hashtags por separado', async ({ page }) => {
  await abrirGuion(page);

  await expect(page.locator('text=8 segundos')).toBeVisible();
  await expect(page.locator('text=/Res asada · Tomate · Aioli/')).toBeVisible();

  // Tres bloques copiables distintos: el prompt va a Flow, el pie y los hashtags a
  // Instagram. Juntarlos obligaría a recortar a mano justo al publicar.
  await expect(page.locator('#vid-prompt')).toHaveValue(/PROMPT DE PRUEBA/);
  await expect(page.locator('#vid-caption')).toHaveValue(/The Original/);
  await expect(page.locator('#vid-tags')).toHaveValue(/#sndwch/);
  await expect(page.getByRole('button', { name: 'Copiar' })).toHaveCount(3);

  // Sin la key de pago, el servidor explica en vez de fallar y el prompt igual sirve.
  await expect(page.locator('text=/Falta GEMINI_API_KEY/')).toBeVisible();
});

test('cambiar de Signature vuelve a pedir el guion de ese sándwich', async ({ page }) => {
  const calls = await abrirGuion(page);
  const primera = calls.filter((c) => c.action === 'admin-video-script').length;

  await page.getByText('The Smoke', { exact: true }).first().click();
  await expect.poll(() => calls.filter((c) => c.action === 'admin-video-script').length).toBeGreaterThan(primera);
  const ultima = calls.filter((c) => c.action === 'admin-video-script').pop()!;
  expect(ultima.body.sigId).toBe('SIG03');
});

test('cambiar de plano pide el mismo sándwich con otro ángulo', async ({ page }) => {
  const calls = await abrirGuion(page);
  await page.getByText('Vapor y calor', { exact: true }).click();

  await expect.poll(() => {
    const c = calls.filter((x) => x.action === 'admin-video-script').pop();
    return c?.body.angle;
  }).toBe('steam');
});
