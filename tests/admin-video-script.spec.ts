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

const FORMATOS = [
  { key: 'pleito', letra: 'A', label: 'EL PLEITO (principal)' },
  { key: 'reto', letra: 'B', label: 'EL RETO DEL ALOCADO' },
  { key: 'receta', letra: 'C', label: 'LA RECETA DEL CALMADO' },
  { key: 'secreto', letra: 'D', label: 'EL SECRETO' },
  { key: 'mesa', letra: 'E', label: 'LA MESA LARGA' },
];

// El mock refleja el contrato REAL de `admin-video-script` (actions/video.ts): desde que el
// guion se arma alrededor de los dos hermanos, la respuesta trae `formato`/`formatos` y el
// prompt se llama `flowPrompt` (antes `veoPrompt`, cuando el generador era Veo directo).
// Un mock desactualizado deja el test verde sobre una pantalla que en producción no pinta nada.
function guion(sigId: string, angleKey = 'macro', fmtKey = 'pleito') {
  const fmt = FORMATOS.find((f) => f.key === fmtKey)!;
  return {
    success: true,
    sigId,
    name: 'The Original',
    angle: { key: angleKey, label: angleKey === 'macro' ? 'Macro del corte' : 'Vapor y calor' },
    formato: fmt,
    guion: {
      duracion: '8 segundos',
      formato: fmt.letra + ' · ' + fmt.label,
      plano: 'extreme macro lens',
      accion: 'el cuchillo termina el corte',
      ingredientes: 'Res asada · Tomate · Aioli',
      pan: 'CLASSIC // WHITE',
    },
    flowPrompt: 'PROMPT DE PRUEBA para ' + sigId,
    caption: 'The Original //\n\nRes asada en pan classic.',
    hashtags: '#sndwch #trujillo',
    formatos: FORMATOS,
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
    'admin-video-script': (body: any) => guion(body.sigId, body.angle || 'macro', body.formato || 'pleito'),
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

// Los cinco formatos son la mitad del sistema: el prompt que se pega en Flow cambia entero
// según cuál se elija. Sin esta prueba, el selector podía dejar de mandar `formato` y el
// panel seguiría pintando un guion — el de siempre — sin que nada reventara.
test('elegir formato pide el guion de ESE formato', async ({ page }) => {
  const calls = await abrirGuion(page);
  await page.getByText('C · LA RECETA DEL CALMADO', { exact: true }).click();

  await expect.poll(() => {
    const c = calls.filter((x) => x.action === 'admin-video-script').pop();
    return c?.body.formato;
  }).toBe('receta');
});

// EL SECRETO no muestra el producto — no se puede. Por eso ahí los tratamientos de cámara
// (que son todos sobre CÓMO se ve el sándwich) no tienen nada que modificar y no se pintan.
test('EL SECRETO no ofrece planos de producto', async ({ page }) => {
  await abrirGuion(page);
  await expect(page.getByText('Vapor y calor', { exact: true })).toBeVisible();

  await page.getByText('D · EL SECRETO', { exact: true }).click();
  await expect(page.getByText('Vapor y calor', { exact: true })).toHaveCount(0);
});
