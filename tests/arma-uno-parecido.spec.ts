import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// «¿Lo quieres a tu manera? Arma uno parecido →» (ficha versión WICHO, maqueta aprobada).
// Lleva al armador con la receta del Signature ya puesta. Lo que no puede pasar en silencio:
// que llegue vacío (el enlace no hizo nada), o que cuele al armador una pieza exclusiva del
// Signature —THE ORIGINAL lleva res, que es sigOnly— a un precio que el armador no cobra.

test('desde la ficha, el armador llega con la receta puesta', async ({ page }) => {
  await gotoApp(page);
  await page.locator(`[onclick="startOrderWithSig('SIG02')"]`).first().click();
  await page.locator(`[onclick*="openSigPreview('SIG02')"]`).first().click();
  await page.locator('button', { hasText: 'Arma uno parecido' }).click();

  const st = await page.evaluate(() => ({
    screen: (window as any).sndScreen, mode: (window as any).mode,
    prot: (window as any).prot, base: (window as any).base,
    sauces: (window as any).sauces, sig: (window as any).SIGS.find((s: any) => s.id === 'SIG02'),
  }));
  expect(st.screen).toBe('o_build');
  expect(st.mode).toBe('byo');
  expect(st.prot).toBe(st.sig.prot);
  expect(st.base).toBe(st.sig.base);
  expect(st.sauces.length).toBeGreaterThan(0);
  await expect(page.getByText(/Te lo dejé como/)).toBeVisible();
});

test('lo exclusivo del Signature no entra al armador, y se dice', async ({ page }) => {
  await gotoApp(page);
  await page.locator(`[onclick="startOrderWithSig('SIG01')"]`).first().click();
  await page.locator(`[onclick*="openSigPreview('SIG01')"]`).first().click();
  await page.locator('button', { hasText: 'Arma uno parecido' }).click();
  const st = await page.evaluate(() => {
    const w = window as any;
    const p = w.PROTS.find((x: any) => x.id === w.SIGS.find((s: any) => s.id === 'SIG01').prot);
    return { prot: w.prot, protDelSig: p, tops: w.tops.map((id: string) => w.TOPS.find((t: any) => t.id === id)) };
  });
  expect(st.protDelSig.sigOnly).toBe(true);
  expect(st.prot).toBeNull();
  expect(st.tops.every((t: any) => !t.sigOnly && !t.vaultOnly)).toBe(true);
  await expect(page.getByText(/es solo del Signature/)).toBeVisible();
});
