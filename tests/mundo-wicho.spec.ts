import { test, expect } from '@playwright/test';
import { gotoApp, hastaLaProteina } from './helpers';

// EL MUNDO WICHO (maqueta M22 + el puente, aprobada el 2026-09-24).
//
// Lo que no puede pasar en silencio en el paso de la proteína:
//   · que el puente lleve a otro lado, o a otro Signature que el que nombra;
//   · que la fila del secreto se abra para quien todavía no lo desbloqueó, o que diga una
//     cifra de pedidos distinta de la que el panel tiene puesta.
// Los productos y el umbral se leen de la app: nada de esto nombra un sándwich.

test('el puente lleva al lado de SANDO, a la estrella que nombra', async ({ page }) => {
  await gotoApp(page);
  await hastaLaProteina(page);
  const estrella = await page.evaluate(() => (window as any).estrellaDeSando());
  expect(estrella, 'la carta no tiene estrella que ofrecer').toBeTruthy();

  const puente = page.locator('button.puente');
  await expect(puente).toContainText(estrella.n);
  await puente.click();

  const dondeQuedo = await page.evaluate(() => {
    const w = window as any;
    let lado = null;
    try { lado = localStorage.getItem('sw_lado'); } catch (e) {}
    return { pantalla: w.sndScreen, sig: w.sigId, lado, homeTab: w.homeTab };
  });
  expect(dondeQuedo.pantalla).toBe('o_sig');
  expect(dondeQuedo.sig).toBe(estrella.id);
  // «Te llevo a su lado»: el lado queda recordado, no solo la pantalla.
  expect(dondeQuedo.homeTab).toBe('sig');
  expect(dondeQuedo.lado).toBe('sig');
});

test('el secreto cerrado dice cuántos pedidos faltan y no se abre', async ({ page }) => {
  await gotoApp(page);
  await hastaLaProteina(page);
  const min = await page.evaluate(() => {
    const w = window as any;
    w.cust = { name: 'Ana', total_orders: 0 };
    w.render();
    return (w.SIGS as any[]).find((s) => s.secret).minOrders;
  });
  const fila = page.locator('button.secreto');
  await expect(fila).toBeDisabled();
  await expect(fila).toContainText(`Se abre con tu pedido ${min}`);
});

test('el secreto abierto lleva al menú secreto', async ({ page }) => {
  await gotoApp(page);
  await hastaLaProteina(page);
  await page.evaluate(() => {
    const w = window as any;
    const min = (w.SIGS as any[]).find((s) => s.secret).minOrders;
    w.cust = { name: 'Ana', total_orders: min };
    w.render();
  });
  const fila = page.locator('button.secreto');
  await expect(fila).toBeEnabled();
  await fila.click();
  expect(await page.evaluate(() => (window as any).sndScreen)).toBe('o_secreto');
});

test('cada paso empieza arriba, con la pregunta a la vista', async ({ page }) => {
  // El paso de la proteína es largo: sin volver arriba, el siguiente heredaba el scroll y la
  // pregunta quedaba cortada fuera de la pantalla.
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoApp(page);
  await hastaLaProteina(page);
  await page.locator('.wb').first().click();
  await page.evaluate(() => window.scrollTo(0, 99999));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.locator('button[onclick="byoStepNext()"]').click();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
