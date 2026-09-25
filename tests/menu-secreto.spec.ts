import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';
import { SECRETO, unPanSinRecargo, unaProteinaDelSecreto, unaSalsaDelArmador } from './carta';

// Productos de la carta, preguntados a la carta: la regla no depende de qué haya este mes.
const UN_PAN = unPanSinRecargo();
const PROT_SECRETA = unaProteinaDelSecreto();
const UNA_SALSA = unaSalsaDelArmador();
const EL_SECRETO = SECRETO;

// La pantalla del menú secreto (maquetas «estructura» y «fondo»). Lo que no puede pasar en
// silencio: que muestre pistas o días inventados en vez de los de la base, que liste al
// vigente entre «los que ya no vuelven», o que alguien que no lo desbloqueó llegue a verla.

const FIN = () => new Date(Date.now() + 10.5 * 86400000).toISOString();
const catalogo = (extra: any = {}) => ({
  proteins: {}, sigs: {}, sides: {}, rewardPts: {}, inventory: {},
  secretSignature: {
    name: 'El Chifero', base: UN_PAN, prot: PROT_SECRETA, tops: [], sauces: [UNA_SALSA], p15: 24.9, p30: 34.9, minOrders: 3,
    vaultOnlyProts: [], vaultOnlyTops: [], vaultOnlySauces: [], endsAt: FIN(),
    hints: [{ t: 'Pica, y no de mentira', s: 'Si no aguantas el ají' }],
    past: [{ name: 'El Norteño', blurb: 'Cabrito, culantro y zarandaja', mes: 'AGO' }],
    ...extra,
  },
});

async function entrar(page, totalOrders: number, extra: any = {}) {
  await gotoApp(page, {
    'get-catalog': catalogo(extra),
    login: { customer: { phone: '900000001', name: 'Mafe', points: 0, total_orders: totalOrders }, isAdmin: false, token: 't' },
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await entrarConTelefono(page);
  await page.evaluate(() => { (window as any).go('o_home'); });
}

test('desbloqueado: días, pistas y los que ya no vuelven salen de la base', async ({ page }) => {
  await entrar(page, 5);
  await page.locator('[onclick*="o_secreto"]').first().click();
  await expect(page.getByText('EL CHIFERO')).toBeVisible();
  await expect(page.getByText('11 días')).toBeVisible();
  await expect(page.getByText('Pica, y no de mentira')).toBeVisible();
  await expect(page.getByText('El Norteño')).toBeVisible();
  await expect(page.locator('.msec .a')).toHaveCount(1);
  await page.getByRole('button', { name: 'Pedirlo a ciegas' }).click();
  expect(await page.evaluate(() => (window as any).sigId)).toBe(EL_SECRETO);
});

test('sin pistas cargadas no inventa ninguna', async ({ page }) => {
  await entrar(page, 5, { hints: [], past: [] });
  await page.locator('[onclick*="o_secreto"]').first().click();
  await expect(page.getByText('EL CHIFERO')).toBeVisible();
  await expect(page.getByText('No decimos qué lleva')).toHaveCount(0);
  await expect(page.getByText('Los que ya no vuelven')).toHaveCount(0);
});

test('sin desbloquear no se entra: la pantalla devuelve al inicio', async ({ page }) => {
  await entrar(page, 1);
  await page.evaluate(() => { (window as any).sndScreen = 'o_secreto'; (window as any).render(); });
  await expect(page.getByText('Lo desbloqueaste')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).sndScreen)).toBe('o_home');
});
