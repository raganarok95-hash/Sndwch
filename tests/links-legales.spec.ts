import { test, expect } from '@playwright/test';
import { mockBackend, APP_FILE } from './helpers';

// Los tres textos legales solo se alcanzaban tocando DENTRO de la app, así que el negocio no
// tenía ninguna URL pública que dar cuando alguien la pide por escrito. Y la piden: Google no
// publica la pantalla de consentimiento de OAuth sin un link a la Política de Privacidad y a
// las Condiciones del Servicio, y Meta exige lo mismo para verificar el negocio.
//
// MODO DE FALLO: SILENCIO. Si alguien quita el manejo de ?legal=, nada revienta — el link
// simplemente abre el menú, y quien lo siguió (un revisor de Google, un cliente que reclama)
// nunca ve el texto. El link sigue existiendo en la consola de Google, apuntando a nada.

async function abrir(page: any, url: string) {
  await mockBackend(page);
  await page.goto(url);
  await page.waitForTimeout(600);
}

test('?legal=privacidad abre el texto legal, no el menú', async ({ page }) => {
  await abrir(page, APP_FILE + '?legal=privacidad');
  // El encabezado real de la pantalla es "TÉRMINOS Y PRIVACIDAD" — los dos textos viven
  // juntos. Se afirma sobre lo que la pantalla DICE, no sobre el nombre que le pone Google.
  await expect(page.locator('text=/TÉRMINOS Y PRIVACIDAD/i').first()).toBeVisible();
  await expect(page.locator('text=/QUÉ DATOS PEDIMOS/i').first()).toBeVisible();
});

test('?legal=terminos lleva al mismo texto — Google pide dos links y acepta que coincidan', async ({ page }) => {
  await abrir(page, APP_FILE + '?legal=terminos');
  await expect(page.locator('text=/Términos/i').first()).toBeVisible();
});

test('?legal=reclamaciones abre el Libro de Reclamaciones, que es obligación legal', async ({ page }) => {
  await abrir(page, APP_FILE + '?legal=reclamaciones');
  await expect(page.locator('text=/Reclamaciones/i').first()).toBeVisible();
});

test('?legal=devoluciones abre cambios y devoluciones', async ({ page }) => {
  await abrir(page, APP_FILE + '?legal=devoluciones');
  await expect(page.locator('text=/Devoluciones|Cambios/i').first()).toBeVisible();
});

test('un valor que no existe no rompe nada: cae a la entrada de siempre', async ({ page }) => {
  // Un link mal copiado no puede dejar la app en blanco — el peor caso es el comportamiento
  // normal, nunca una pantalla rota.
  //
  // Lo que aqui se afirma cambio el 2026-09-17 y vale decir por que NO es debilitar la
  // prueba: la entrada normal de la app dejo de ser la lista de Signatures y paso a ser la
  // eleccion entre los dos hermanos (`homeTab` arranca en null). La intencion de esta
  // prueba siempre fue "cae a lo normal", no "cae a la lista"; afirmar sobre la lista era
  // afirmar sobre un detalle de implementacion. Se comprueban los DOS lados, que es mas
  // fuerte que el `text=SIGNATURE` anterior: una pantalla en blanco no los tiene.
  await abrir(page, APP_FILE + '?legal=cualquiercosa');
  await expect(page.locator('text=/Ya está resuelto/i').first()).toBeVisible();
  await expect(page.locator('text=/Tú decides/i').first()).toBeVisible();
});

// ── EL TEXTO LEGAL TIENE QUE DESCRIBIR LO QUE LA APP HACE ──────────────────────────────
// Se desalineó dos veces sin que nada avisara: decía que el DNI se pide "al crear tu cuenta"
// después de que el registro con Google dejó de pedirlo, y no mencionaba a Google entre los
// terceros pese a que le manda lo que el cliente escribe en el campo de dirección.
//
// Su modo de fallo es el peor de todos: no rompe nada, se ve bien, y es lo primero que lee
// un revisor de Google al publicar la pantalla de consentimiento — y lo que un cliente puede
// usar en un reclamo. Estas pruebas no juzgan la redacción; fijan que los HECHOS estén.

test('la política declara a Google entre los terceros — sin eso Google rechaza publicar', async ({ page }) => {
  await abrir(page, APP_FILE + '?legal=privacidad');
  const txt = await page.locator('body').innerText();
  // La propia política de OAuth de Google exige declarar qué datos suyos se usan y para qué.
  expect(txt).toMatch(/Google/);
  // Y los dos envíos reales: el autocompletado de la dirección y el inicio de sesión.
  expect(txt).toMatch(/direcci[oó]n/i);
});

test('la política no promete que pedimos DNI cuando entras con Google', async ({ page }) => {
  await abrir(page, APP_FILE + '?legal=privacidad');
  const txt = await page.locator('body').innerText();
  // Tiene que distinguir los dos caminos. Un texto que solo describe el formulario deja de
  // ser cierto para la mitad de las cuentas el día que Google se prenda.
  expect(txt).toMatch(/Continuar con Google|con Google/);
  expect(txt, 'debe decir que por Google solo se pide el teléfono').toMatch(/solo te pedimos el tel[eé]fono/i);
});

test('la política nombra los cuatro eventos que Meta de verdad recibe', async ({ page }) => {
  await abrir(page, APP_FILE + '?legal=privacidad');
  const txt = await page.locator('body').innerText();
  // fbTrack se dispara con Purchase, CompleteRegistration, AddToCart y Lead. Declarar solo
  // las compras dejaba fuera tres de los cuatro.
  expect(txt).toMatch(/compras/i);
  expect(txt).toMatch(/creas tu cuenta/i);
  expect(txt).toMatch(/carrito/i);
  expect(txt).toMatch(/lista de espera/i);
});

test('sigue diciendo lo que NO se comparte, que es la parte que protege al cliente', async ({ page }) => {
  await abrir(page, APP_FILE + '?legal=privacidad');
  const txt = await page.locator('body').innerText();
  expect(txt).toMatch(/NO le llegan tu DNI/);
  expect(txt).toMatch(/SHA-256/);
  // Y el derecho de oposición de la Ley 29733, que ya tiene su propio interruptor.
  expect(txt).toMatch(/29733/);
});
