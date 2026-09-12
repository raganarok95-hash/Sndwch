import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// El cliente armaba el sándwich entero, escribía nombre, teléfono y dirección, y recién al
// tocar PAGAR se enteraba de que el teléfono estaba mal. Mismo defecto que ya obligó a
// poner el selector de distrito y a pintar tachadas las horas llenas.
//
// MODO DE FALLO: SILENCIO. Si alguien quita el parámetro `chk` de INP() en el checkout, o
// borra la llamada a repaintFields() del router, no revienta nada — el pedido se sigue
// cobrando y la pantalla se ve igual. Solo vuelve a fallar tarde, que es justo lo que se
// vino a arreglar. Por eso estas cuatro cosas están fijadas acá.

const MSG_TEL = 'Ingresa un teléfono de contacto válido.';
const MSG_NOM = 'Necesitamos tu nombre para el pedido.';

// Deja al invitado parado en el checkout inline (pago rápido) con el carrito ya armado.
async function irAlCheckout(page: any) {
  await page.locator('[onclick*="startOrderWithSig("]').first().click();
  await page.locator('[onclick*="size=\'15\'"]').click();
  await page.locator('[onclick^="sigId="]').first().click();
  await page.getByRole('button', { name: 'CONTINUAR //' }).click();
  await expect(page.locator('text=CONFIRMAR SÁNDWICH')).toBeVisible();
}

test('el aviso NO aparece mientras se escribe por primera vez, y sí al salir del campo', async ({ page }) => {
  await gotoApp(page);
  await irAlCheckout(page);

  const msg = page.locator('#o-phone-msg');

  // Un teléfono a medio escribir todavía no es un error: marcarlo en la primera tecla se
  // siente como un rechazo antes de que el cliente terminara.
  await page.locator('#o-phone').fill('98');
  await expect(msg).toHaveText('');

  // Recién al salir del campo (blur) se marca.
  await page.locator('#o-nom').click();
  await expect(msg).toHaveText(MSG_TEL);
  await expect(page.locator('#o-phone')).toHaveAttribute('aria-invalid', 'true');
});

test('una vez marcado, el aviso desaparece en la tecla que lo arregla — sin salir del campo', async ({ page }) => {
  await gotoApp(page);
  await irAlCheckout(page);

  await page.locator('#o-phone').fill('98');
  await page.locator('#o-nom').click();
  await expect(page.locator('#o-phone-msg')).toHaveText(MSG_TEL);

  // Sin blur: se completa el número y el aviso se va solo. Si hiciera falta salir del
  // campo otra vez, el cliente vería un error sobre un campo que ya está bien.
  await page.locator('#o-phone').fill('987654321');
  await expect(page.locator('#o-phone-msg')).toHaveText('');
  await expect(page.locator('#o-phone')).toHaveAttribute('aria-invalid', 'false');
});

test('el aviso sobrevive a un render() — no se borra solo al tocar otra cosa del checkout', async ({ page }) => {
  await gotoApp(page);
  await irAlCheckout(page);

  await page.locator('#o-nom').fill('Cliente Invitado');
  await page.locator('#o-phone').fill('98');
  await page.locator('#o-addr').click();
  await expect(page.locator('#o-phone-msg')).toHaveText(MSG_TEL);

  // Elegir el distrito dispara un render() completo, que reconstruye todo el innerHTML.
  // Sin repaintFields() el borde rojo y el mensaje desaparecerían sin que el cliente
  // arreglara nada — un error que se borra solo es peor que no haberlo mostrado.
  await page.locator('#o-district').selectOption('trujillo');
  await expect(page.locator('#o-phone-msg')).toHaveText(MSG_TEL);
  // Y el valor escrito sigue ahí (syncConfirmFields), así que el aviso no está pintado
  // sobre un campo que el render vació.
  await expect(page.locator('#o-phone')).toHaveValue('98');
});

test('tocar PAGAR con un campo mal marca EL CAMPO, no solo el mensaje al pie', async ({ page }) => {
  await gotoApp(page);
  await irAlCheckout(page);

  // Todo correcto salvo el nombre: el aviso al pie dice "nombre y dirección", que en un
  // formulario largo no dice cuál de los dos.
  await page.locator('#o-phone').fill('987654321');
  await page.locator('#o-addr').fill('Av. España 123, Trujillo');
  await page.locator('#o-district').selectOption('trujillo');
  await page.locator('[onclick*="selectPayMethod(\'yape\')"]').click();
  await page.getByRole('button', { name: 'YA REALICÉ EL PAGO //' }).click();

  await expect(page.locator('#o-nom-msg')).toHaveText(MSG_NOM);
});

// El correo queda deliberadamente fuera: ni doOrder ni place-order lo validan, así que un
// borde rojo ahí marcaría como error algo que el pedido igual acepta. Si alguien le agrega
// validación en vivo sin agregarla también al camino que cobra, este test lo dice.
test('el correo no gana un aviso que el pedido no respalda', async ({ page }) => {
  await gotoApp(page);
  await irAlCheckout(page);
  await expect(page.locator('#o-email-msg')).toHaveCount(0);
});
