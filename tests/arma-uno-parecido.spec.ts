import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// «¿Lo quieres a tu manera? Arma uno parecido →» (ficha versión WICHO, maqueta aprobada).
// Lleva al armador con la receta del Signature ya puesta. Lo que no puede pasar en silencio:
// que llegue vacío (el enlace no hizo nada), o que cuele al armador una pieza exclusiva del
// Signature —una proteína sigOnly— a un precio que el armador no cobra.
//
// Los Signatures se eligen de la carta que la app tiene cargada, por lo que la prueba necesita
// de cada uno, nunca por su nombre: la carta cambia.
async function signatureDonde(page: any, condicion: 'armable' | 'exclusiva'): Promise<string> {
  const id = await page.evaluate((cond: string) => {
    const w = window as any;
    const prot = (s: any) => w.PROTS.find((p: any) => p.id === s.prot) || {};
    const s = w.SIGS.find((x: any) => !x.secret && (cond === 'exclusiva'
      ? prot(x).sigOnly
      : !prot(x).sigOnly && !prot(x).vaultOnly && (x.sauces || []).length > 0));
    return s ? s.id : null;
  }, condicion);
  if (!id) throw new Error(`La carta no tiene un Signature con proteína ${condicion}: la prueba no puede armarse.`);
  return id;
}

test('desde la ficha, el armador llega con la receta puesta', async ({ page }) => {
  await gotoApp(page);
  const id = await signatureDonde(page, 'armable');
  await page.locator(`[onclick="startOrderWithSig('${id}')"]`).first().click();
  await page.locator(`[onclick*="openSigPreview('${id}')"]`).first().click();
  await page.locator('button', { hasText: 'Arma uno parecido' }).click();

  const st = await page.evaluate((x: string) => ({
    screen: (window as any).sndScreen, mode: (window as any).mode,
    prot: (window as any).prot, base: (window as any).base,
    sauces: (window as any).sauces, sig: (window as any).SIGS.find((s: any) => s.id === x),
  }), id);
  expect(st.screen).toBe('o_build');
  expect(st.mode).toBe('byo');
  expect(st.prot).toBe(st.sig.prot);
  expect(st.base).toBe(st.sig.base);
  expect(st.sauces.length).toBeGreaterThan(0);
  await expect(page.getByText(/Te lo dejé como/)).toBeVisible();
});

test('lo exclusivo del Signature no entra al armador, y se dice', async ({ page }) => {
  await gotoApp(page);
  const id = await signatureDonde(page, 'exclusiva');
  await page.locator(`[onclick="startOrderWithSig('${id}')"]`).first().click();
  await page.locator(`[onclick*="openSigPreview('${id}')"]`).first().click();
  await page.locator('button', { hasText: 'Arma uno parecido' }).click();
  const st = await page.evaluate((x: string) => {
    const w = window as any;
    const p = w.PROTS.find((y: any) => y.id === w.SIGS.find((s: any) => s.id === x).prot);
    return { prot: w.prot, protDelSig: p, tops: w.tops.map((t0: string) => w.TOPS.find((t: any) => t.id === t0)) };
  }, id);
  expect(st.protDelSig.sigOnly).toBe(true);
  expect(st.prot).toBeNull();
  expect(st.tops.every((t: any) => !t.sigOnly && !t.vaultOnly)).toBe(true);
  await expect(page.getByText(/es solo del Signature/)).toBeVisible();
});
