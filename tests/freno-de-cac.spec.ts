import { test, expect } from '@playwright/test';
import { gotoApp } from './helpers';

// EL FRENO DE CAC — que la pantalla no deje creerle a un número que no se lo merece.
//
// POR QUÉ EXISTE. Sobre esta pantalla se decide si el dueño sigue gastando o corta, y el
// número que muestra tiene DOS defectos conocidos que no son bugs sino límites del dato:
//
//   1. Es un PISO, no el CAC real: cuenta como captado por publicidad a todo cliente nuevo
//      sin referidor, y ahí adentro también está el orgánico. Con más gente en el reparto,
//      sale más barato de lo que es. Para un freno esa es la dirección peligrosa.
//   2. Por debajo del mínimo de aprendizaje de Meta (50 conversiones cada 7 días) lo que se
//      mide es el CAC de arranque, no el de régimen — apagar la campaña ahí es apagarla
//      justo antes de que empiece a funcionar.
//
// Las dos advertencias van ARRIBA de la cifra, nunca al pie: al pie se leen después de
// haberle creído. Mismo criterio que el plan de tanda y el reporte de cohortes.
//
// MODO DE FALLO: SILENCIO. Si alguien mueve las advertencias abajo o pinta un 0 donde no hay
// dato, nada revienta — solo se empieza a decidir gasto real contra un número que miente.

const ADMIN = { phone: '900000000', name: 'Admin' };

const frenoBase = {
  dias: 28, gasto: 0, nuevosPagados: 0, nuevosReferidos: 0,
  cac: null, margenPct: null, cacMin: null, cacMax: null,
  techo: 13.63, costoReferido: 7.65,
  veredicto: 'sin-gasto', fiable: false,
  motivo: 'No hay gasto cargado en este periodo, así que no hay CAC que medir.',
  minAprendizajeMeta: 200, salioDeAprendizaje: false,
  desde: '2026-08-15', gastos: [], promosKilled: false, promosKilledHace: null,
};

// Se entra POR LA INTERFAZ, no sembrando estado: el panel vive en `admin.js`, que se carga
// bajo demanda (ver check:cliente — las 8 partes del cliente no dependen de las 2 del panel).
// Llamar a `loadCacBrake()` sin ese paso da "is not a function", que es justo lo que pasaría
// en producción si alguien rompiera la carga diferida.
async function abrirFreno(page: any, freno: any) {
  await gotoApp(page, {
    login: { customer: ADMIN, isAdmin: true, token: 'tok-admin' },
    'session-check': { valid: true, customer: ADMIN, isAdmin: true },
    'admin-orders': { orders: [], truncated: false },
    'admin-cac-brake': freno,
    'addresses-list': { addresses: [] },
    'favorites-list': { favorites: [] },
    'my-orders': { orders: [] },
  });
  await page.locator('.bottom-nav').getByRole('button', { name: 'PUNTOS' }).click();
  await page.getByRole('button', { name: 'INGRESAR' }).click();
  await page.locator('#l-phone').fill('900000000');
  await page.locator('#l-pin').fill('1234');
  await page.getByRole('button', { name: 'INGRESAR //' }).click();
  await page.locator('[onclick*="admin_home"]').click();
  await page.getByText('Freno de CAC').click();
  await expect(page.locator('text=FRENO DE CAC')).toBeVisible({ timeout: 10000 });
  // Se espera a que asiente la animación de entrada (`.fi`) antes de medir: acá se comparan
  // posiciones verticales, y este repo ya reportó un defecto falso midiendo un DOM en
  // movimiento (un botón de 43.34 px con `min-height:44px` puesto). Es precaución, no el
  // arreglo de un fallo observado.
  //
  // ⚠ LO QUE SÍ FALLÓ ACÁ FUE UN SELECTOR AMBIGUO, y conviene dejarlo escrito: medir contra
  // `text=COSTO POR CLIENTE` daba el veredicto al revés porque ese texto casa con DOS nodos
  // —el rótulo y el contenedor que lo envuelve— y `.first()` devolvía el contenedor, que
  // empieza más arriba que el rótulo. La comparación se hace contra la CIFRA, que es única en
  // la pantalla y además es exactamente lo que el lector no puede ver antes de la
  // advertencia.
  await page.waitForTimeout(700);
}

test.describe('freno de CAC', () => {
  test('la advertencia de que el CAC es el MEJOR caso va ARRIBA de la cifra, siempre', async ({ page }) => {
    await abrirFreno(page, { ...frenoBase, gasto: 2000, nuevosPagados: 120, cac: 16.67, margenPct: 9.1, cacMin: 15.15, cacMax: 18.19, veredicto: 'sobre-el-techo', fiable: true, motivo: null });

    const aviso = page.locator('text=Este CAC es el MEJOR caso');
    await expect(aviso).toBeVisible();
    // "Arriba" se comprueba midiendo, no leyendo el orden del código.
    const yAviso = await aviso.boundingBox();
    const yCifra = await page.locator('text=S/16.67').boundingBox();
    expect(yAviso!.y).toBeLessThan(yCifra!.y);
  });

  test('sin gasto cargado muestra un GUION, nunca un 0', async ({ page }) => {
    await abrirFreno(page, frenoBase);
    await expect(page.locator('text=Sin gasto cargado')).toBeVisible();

    // ⚠ SE MIRA LA CIFRA, NO LA PÁGINA. La primera versión comprobaba que el texto del body
    // contuviera un guion — y pasaba con el defecto inyectado, porque los párrafos de
    // explicación ya traen varios guiones largos. Una aserción que cualquier página cumple no
    // protege nada; verificado inyectando `S/0.00` en el lugar de la cifra.
    //
    // Un 0 acá se leería como "medimos y salió gratis", que es lo contrario de "no hay dato".
    const cifra = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('div'))
        .find((d) => getComputedStyle(d).fontSize === '40px');
      return el ? (el.textContent || '').trim() : null;
    });
    expect(cifra).toBe('—');
    await expect(page.locator('text=S/0.00')).toHaveCount(0);
  });

  test('gastar sin captar a nadie NO se pinta como sano', async ({ page }) => {
    await abrirFreno(page, { ...frenoBase, gasto: 400, veredicto: 'sin-conversiones', fiable: true, motivo: null });
    await expect(page.locator('text=Gastaste y no entró nadie')).toBeVisible();
    await expect(page.locator('text=Dentro del techo')).toHaveCount(0);
  });

  test('por encima del techo lo dice, y con pocas conversiones avisa ANTES de la cifra', async ({ page }) => {
    await abrirFreno(page, {
      ...frenoBase, gasto: 300, nuevosPagados: 8, cac: 37.5, margenPct: 35.4, cacMin: 24.22, cacMax: 50.78,
      veredicto: 'sobre-el-techo', fiable: false,
      motivo: 'Con 8 conversiones el margen de error es ±35.4%: el CAC real está entre S/24.22 y S/50.78, y el techo (S/13.63) cae dentro de ese rango.',
    });
    await expect(page.locator('text=Por encima del techo')).toBeVisible();

    const cautela = page.locator('text=Todavía no decidas con este número');
    await expect(cautela).toBeVisible();
    const yCautela = await cautela.boundingBox();
    const yCifra = await page.locator('text=S/37.50').boundingBox();
    expect(yCautela!.y).toBeLessThan(yCifra!.y);
    // El motivo trae el margen y los dos extremos: sin números no dice cuánto falta para decidir.
    await expect(page.locator('text=margen de error')).toBeVisible();
  });

  test('el referido se muestra al lado con su costo, que es contra lo que hay que comparar', async ({ page }) => {
    await abrirFreno(page, { ...frenoBase, gasto: 1000, nuevosPagados: 60, nuevosReferidos: 14, cac: 16.67, margenPct: 12.9, cacMin: 14.52, cacMax: 18.82, veredicto: 'sobre-el-techo', fiable: true, motivo: null });
    await expect(page.locator('text=por referido')).toBeVisible();
    // El costo del referido lo manda el SERVIDOR, nunca escrito en la pantalla: si cambia el
    // insumo del 15CM, el número lo sigue solo.
    await expect(page.locator('text=7.65')).toBeVisible();
  });

  test('el techo NO está escrito en la pantalla: viene del servidor', async ({ page }) => {
    // Se sirve un techo distinto del real y la pantalla tiene que pintar ESE.
    await abrirFreno(page, { ...frenoBase, techo: 99.99, gasto: 100, nuevosPagados: 10, cac: 10, margenPct: 31.6, cacMin: 6.84, cacMax: 13.16, veredicto: 'sano', fiable: true });
    await expect(page.locator('text=99.99')).toBeVisible();
  });

  test('el freno de emergencia apaga TODAS las promociones y dice qué NO toca', async ({ page }) => {
    await abrirFreno(page, frenoBase);
    await expect(page.locator('text=FRENO DE EMERGENCIA')).toBeVisible();
    // Lo que el interruptor NO apaga tiene que estar escrito al lado del botón, no en otra
    // pantalla: quien lo toca está apurado y necesita saber qué NO va a romper.
    await expect(page.locator('text=recompensas por puntos')).toBeVisible();
  });

  test('con las promociones apagadas lo dice ARRIBA de todo, y ofrece volver a encender', async ({ page }) => {
    await abrirFreno(page, { ...frenoBase, promosKilled: true, promosKilledHace: '9 días' });
    const aviso = page.locator('text=Promociones APAGADAS');
    await expect(aviso).toBeVisible();
    // ⚠ El riesgo de un kill switch es quedarse abajo y que nadie se acuerde. Por eso tiene
    // que decir CUÁNTO LLEVA así, no solo que está apagado.
    await expect(page.locator('text=9 días')).toBeVisible();
    await expect(page.getByText('Volver a encender')).toBeVisible();
    // Y el botón de apagar desaparece: ofrecer apagar algo ya apagado es ruido.
    await expect(page.locator('text=FRENO DE EMERGENCIA')).toHaveCount(0);
  });
});
