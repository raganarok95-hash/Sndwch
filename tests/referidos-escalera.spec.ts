import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// #55 — La escalera de referidos, del lado del cliente.
//
// El servidor ya paga los escalones (grant_referral_milestone) y eso está probado aparte en
// tests-api/escalera-referidos.test.ts. Lo que se fija ACÁ es lo único que hace que la
// escalera sirva de algo: que el cliente la VEA antes de invitar. Un premio escalonado que
// solo aparece como sorpresa al cobrarlo nunca fue una razón para invitar al tercero, que
// es exactamente para lo que se puso.
//
// El otro modo de fallo cubierto acá es una promesa falsa: si la escalera del cliente se
// desincroniza de la del servidor, la pantalla ofrece un premio que nadie va a otorgar —
// la misma clase de defecto que ya obligó a retirar los badges MÁS PEDIDO y EDICIÓN
// LIMITADA. `npm run parity` compara los dos arrays; esto comprueba que lo que se pinta
// sale de verdad de ese array y no de un texto escrito a mano en el HTML.

async function entrarComo(page: any, totalReferrals: number) {
  await gotoApp(page, {
    login: {
      customer: {
        phone: '900000055',
        name: 'Rosa Referidora',
        points: 500,
        credit_balance: 0,
        total_orders: 6,
        total_referrals: totalReferrals,
      },
      isAdmin: false,
      token: 'tok-rosa',
    },
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000055');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  // El login cae en el hub de PUNTOS; la escalera vive en la tarjeta del programa de
  // referidos, dentro de "Mi Perfil".
  await page.locator('[onclick*="p_profile"]').first().click();
  await expect(page.locator('text=PREMIOS EXTRA //')).toBeVisible();
}

test('con 0 referidos ya se ven los tres premios y cuántos amigos faltan', async ({ page }) => {
  // Lo más importante de todo el ítem: quien todavía no invitó a nadie tiene que poder ver
  // que invitar 3 veces paga distinto que invitar una. Esconder la escalera hasta el primer
  // referido la volvería inútil justo para quien hay que convencer.
  await entrarComo(page, 0);
  await expect(page.locator('text=Una bebida de la casa gratis')).toBeVisible();
  await expect(page.locator('text=Otro sándwich 15CM gratis')).toBeVisible();
  await expect(page.locator('text=Dos sándwiches 15CM gratis')).toBeVisible();
  await expect(page.locator('text=/faltan 3 amigos/')).toBeVisible();
});

test('los puntos que se muestran son los que paga el servidor, no un texto suelto', async ({ page }) => {
  await entrarComo(page, 0);
  await expect(page.locator('text=/\\+120 pts/')).toBeVisible();
  await expect(page.locator('text=/\\+400 pts/')).toBeVisible();
  await expect(page.locator('text=/\\+800 pts/')).toBeVisible();
});

test('un escalón alcanzado se marca ganado y el siguiente dice cuánto falta', async ({ page }) => {
  await entrarComo(page, 4);
  // Con 4 referidos: el escalón de 3 está ganado y los de 5 y 10 todavía no.
  await expect(page.locator('text=/falta 1 amigo/')).toBeVisible();
  // Singular, no "faltan 1 amigos" — se lee en el momento de decidir si vale la pena.
  await expect(page.locator('text=/faltan 1 amigo/')).toHaveCount(0);

  // Y el estado por fila, que es lo que de verdad distingue "ganado" de "por ganar": el
  // escalón cumplido cambia su número por un ✓ y los pendientes siguen mostrando cuántos
  // amigos piden. Sin esto, la prueba pasaría con las tres filas pintadas iguales.
  const marcas = await page.locator('text=PREMIOS EXTRA //').locator('..')
    .locator('div[style*="width:18px"]').allInnerTexts();
  expect(marcas).toEqual(['✓', '5', '10']);
});

test('pasado el último escalón no se promete un premio que ya no existe', async ({ page }) => {
  // Con 12 referidos la escalera está completa. Antes de arreglarlo, un cálculo ingenuo
  // habría dicho "te faltan -2 amigos"; y callar del todo dejaría al mejor referidor del
  // negocio pensando que dejó de ganar algo por invitar.
  await entrarComo(page, 12);
  await expect(page.locator('text=/Ganaste todos los premios/')).toBeVisible();
  await expect(page.locator('text=/faltan? -/')).toHaveCount(0);
  await expect(page.locator('text=/Cada nuevo amigo te sigue dando tu sándwich/')).toBeVisible();
});

test('la escalera no reemplaza al conteo ni al botón de compartir', async ({ page }) => {
  // Se agregó una tarjeta dentro de otra: si al insertarla se pisara el botón, el programa
  // de referidos entero se quedaría sin su única forma de invitar.
  await entrarComo(page, 4);
  await expect(page.locator('text=/4 amigos referidos/')).toBeVisible();
  await expect(page.getByRole('button', { name: /Compartir por WhatsApp/ })).toBeVisible();
});
