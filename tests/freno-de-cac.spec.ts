import { test, expect } from '@playwright/test';
import { gotoApp, entrarConTelefono } from './helpers';

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
  techo: 24.63, techoPrimerPedido: 13.63, pedidosPorCliente: 2.41, confianzaValorVida: 0.75,
  costoReferido: 7.65,
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
  await entrarConTelefono(page, '900000000', '1234');
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
    // Sin gasto la pantalla ya no dice "sin gasto y nada más": está midiendo la línea base.
    await expect(page.locator('text=LÍNEA BASE · MIDIENDO')).toBeVisible();

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
    // Aparece en DOS sitios desde que se muestran los dos techos: la píldora de al lado de la
    // cifra y la línea que explica de dónde sale. Los dos tienen que traer el valor servido —
    // si uno se quedara con un número propio, la pantalla se contradiría a sí misma.
    await expect(page.locator('text=techo S/99.99')).toBeVisible();
    await expect(page.locator('text=El techo son S/99.99')).toBeVisible();
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

// ── LÍNEA BASE ORGÁNICA ───────────────────────────────────────────────────────────────────
//
// MODO DE FALLO: SILENCIO, y del peor tipo — el que se descubre tarde. La ventana en que se
// puede medir cuánta gente entra SIN publicidad existe una sola vez, antes del primer sol
// gastado, y no se puede reconstruir después. Si la pantalla la pinta como un hueco ("sin
// gasto cargado" y nada más), el periodo pasa sin que nadie sepa que estaba corriendo, y a
// partir de ahí el CAC le acredita a Meta para siempre a quien iba a llegar solo.
test.describe('freno de CAC — línea base', () => {
  test('sin gasto, la pantalla dice que está midiendo algo IRREPETIBLE, no que está vacía', async ({ page }) => {
    await abrirFreno(page, { ...frenoBase, nuevosPagados: 9, baseOrganicaDia: 0.32, baseDias: 28, baseNuevos: 9, baseFiable: false, atribuibles: null, cacPiso: null, baseMinDias: 14, baseMinClientes: 10 });

    await expect(page.locator('text=LÍNEA BASE · MIDIENDO')).toBeVisible();
    await expect(page.locator('text=clientes nuevos por día, sin publicidad')).toBeVisible();
    // Lo que hace que el dueño NO gaste antes de tiempo es esta frase, no el número.
    await expect(page.locator('text=no hay periodo limpio con el cual comparar')).toBeVisible();
    // Y cuánto falta para que sirva, en días y clientes concretos: "todavía no" sin un número
    // no dice si esperar dos días o dos meses.
    await expect(page.locator('text=Faltan')).toBeVisible();
  });

  test('cuando la base ya alcanza, lo dice — es la señal de que se puede empezar a gastar', async ({ page }) => {
    await abrirFreno(page, { ...frenoBase, nuevosPagados: 18, baseOrganicaDia: 0.64, baseDias: 28, baseNuevos: 18, baseFiable: false, atribuibles: null, cacPiso: null, baseMinDias: 14, baseMinClientes: 10 });
    await expect(page.locator('text=Ya alcanza para descontarla')).toBeVisible();
    await expect(page.locator('text=Faltan')).toHaveCount(0);
  });

  test('⚠ con base fiable, el TITULAR es el CAC ajustado y el optimista queda abajo y chico', async ({ page }) => {
    // El caso que justifica todo: el piso (S/10) queda cómodo bajo el techo de S/13.63 y
    // habría pintado "Dentro del techo"; el real (S/18.75) lo pasa.
    await abrirFreno(page, {
      ...frenoBase, gasto: 300, nuevosPagados: 30,
      cac: 18.75, margenPct: 25, cacMin: 14.06, cacMax: 23.44, cacPiso: 10,
      baseOrganicaDia: 0.5, baseDias: 28, baseNuevos: 14, baseFiable: true, atribuibles: 16, baseMinDias: 14, baseMinClientes: 10,
      veredicto: 'sobre-el-techo', fiable: true, motivo: null,
    });

    await expect(page.locator('text=Por encima del techo')).toBeVisible();
    await expect(page.locator('text=Dentro del techo')).toHaveCount(0);

    // El ajustado es LA cifra grande; el piso va abajo y dicho como lo que es.
    const grande = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('div'))
        .find((d) => getComputedStyle(d).fontSize === '40px');
      return el ? (el.textContent || '').trim() : null;
    });
    expect(grande).toBe('S/18.75');
    await expect(page.locator('text=Sin descontar la base darían S/10 sobre 30 clientes')).toBeVisible();

    // Y la advertencia de arriba CAMBIA: seguir diciendo "es el mejor caso" después de haber
    // restado la base pediría desconfianza del número más verdadero que hay.
    await expect(page.locator('text=Ya está descontado lo que entraba solo')).toBeVisible();
    await expect(page.locator('text=Este CAC es el MEJOR caso')).toHaveCount(0);
  });

  test('gastar y no traer a nadie por encima de la base NO se lee como "no entró nadie"', async ({ page }) => {
    await abrirFreno(page, {
      ...frenoBase, gasto: 400, nuevosPagados: 10, cacPiso: 40,
      baseOrganicaDia: 0.5, baseDias: 28, baseNuevos: 14, baseFiable: true, atribuibles: 0, baseMinDias: 14, baseMinClientes: 10,
      veredicto: 'sin-incrementales', fiable: true, motivo: null,
    });
    await expect(page.locator('text=Entraron clientes, pero no más de los que ya entraban')).toBeVisible();
    // Son dos hallazgos distintos y no pueden pintarse igual: acá el negocio SÍ sumó clientes.
    await expect(page.locator('text=Gastaste y no entró nadie')).toHaveCount(0);
    await expect(page.locator('text=Dentro del techo')).toHaveCount(0);
    // `gasto/0` daría Infinity: nunca una cifra inventada.
    await expect(page.locator('text=S/Infinity')).toHaveCount(0);
    await expect(page.locator('text=NaN')).toHaveCount(0);
  });
});

// ── EL GASTO SE CARGA A MANO ──────────────────────────────────────────────────────────────
//
// MODO DE FALLO: SILENCIO, y en la dirección peligrosa. Todo el freno divide gasto ÷ clientes,
// y el gasto lo transcribe el dueño del panel de Meta. Si se olvida unos días, el numerador
// queda corto mientras el denominador sigue creciendo: **el costo por cliente sale más barato
// de lo que es y la pantalla se ve perfecta**. Ese aviso es el único que invalida el número
// entero, no solo su precisión, y por eso va arriba de todos los demás.
test.describe('freno de CAC — el gasto sin cargar', () => {
  test('si faltan días de gasto lo dice ARRIBA de la cifra, y dice hacia qué lado miente', async ({ page }) => {
    await abrirFreno(page, {
      ...frenoBase, gasto: 180, nuevosPagados: 20, cac: 9, margenPct: 22.4, cacMin: 6.98, cacMax: 11.02,
      veredicto: 'sano', fiable: true, motivo: null,
      ultimoDia: '2026-11-14', diasSinCargar: 6, desactualizado: true,
    });

    const aviso = page.locator('text=Falta cargar 6 días de gasto');
    await expect(aviso).toBeVisible();
    // Decir "falta cargar" sin decir hacia qué lado se equivoca el número deja al dueño
    // creyendo que es un detalle administrativo. No lo es: acá abajo dice "Dentro del techo".
    //
    // Se busca la frase ÚNICA de este aviso y no "más barato de lo que es", que también está en
    // la advertencia del piso y casaba con dos nodos — un selector ambiguo, el mismo tropiezo
    // que ya está anotado arriba en este archivo.
    await expect(page.locator('text=se divide un gasto incompleto')).toBeVisible();
    await expect(page.locator('text=2026-11-14')).toBeVisible();

    const yAviso = await aviso.boundingBox();
    const yCifra = await page.locator('text=S/9').first().boundingBox();
    expect(yAviso!.y).toBeLessThan(yCifra!.y);
  });

  test('con el gasto al día no aparece ningún aviso — no es ruido de fondo', async ({ page }) => {
    await abrirFreno(page, {
      ...frenoBase, gasto: 300, nuevosPagados: 20, cac: 15, margenPct: 22.4, cacMin: 11.64, cacMax: 18.36,
      veredicto: 'sobre-el-techo', fiable: false, motivo: 'Con 20 conversiones el margen de error es ±22.4%.',
      ultimoDia: '2026-11-19', diasSinCargar: 1, desactualizado: false,
    });
    await expect(page.locator('text=Falta cargar')).toHaveCount(0);
  });
});

// ⚠ LOS MÍNIMOS DE LA LÍNEA BASE LOS MANDA EL SERVIDOR, no están escritos en la pantalla.
// Es la regla del repo —si el código ya conoce la cifra, se interpola— y acá el modo de fallo
// es el de siempre: escribir un 14 a mano no rompe nada hasta el día que el servidor lo mueva,
// y entonces la pantalla dice cuántos días faltan contra un umbral que ya no existe.
test('los umbrales de la línea base vienen del servidor, no escritos en la pantalla', async ({ page }) => {
  // Se sirven mínimos DISTINTOS de los reales y la pantalla tiene que hacer la cuenta con esos.
  await abrirFreno(page, {
    ...frenoBase, nuevosPagados: 4, baseOrganicaDia: 0.2, baseDias: 20, baseNuevos: 4,
    baseFiable: false, atribuibles: null, cacPiso: null,
    baseMinDias: 30, baseMinClientes: 25,
  });
  // 30 − 20 = 10 días y 25 − 4 = 21 clientes. Con los umbrales escritos a mano diría 0 y 6.
  await expect(page.locator('text=Faltan 10 días y 21 clientes')).toBeVisible();
});

// ⚠ LOS DOS TECHOS SE MUESTRAN, y contestan preguntas distintas (2026-09-13).
// El freno decide contra el valor de vida del cliente porque la publicidad es reinversión;
// el del primer pedido sigue visible porque contesta "¿ya se pagó hoy?". Modo de fallo si
// alguien colapsa los dos en uno: silencio — la pantalla deja de decir cuál se contestó.
test('la pantalla muestra los dos techos y de dónde sale el grande', async ({ page }) => {
  await abrirFreno(page, {
    ...frenoBase, gasto: 500, nuevosPagados: 25, cac: 20, margenPct: 20, cacMin: 16, cacMax: 24,
    veredicto: 'sano', fiable: true, motivo: null,
  });
  // El techo con el que se decide es el grande, y la pantalla explica POR QUÉ lo es.
  await expect(page.locator('text=techo S/24.63')).toBeVisible();
  await expect(page.locator('text=un cliente pide 2.41 veces, no una')).toBeVisible();
  // Y el del primer pedido sigue ahí: sin él no se puede saber si el cliente se pagó hoy.
  await expect(page.locator('text=Con un solo pedido serían S/13.63')).toBeVisible();
  // Con el techo viejo este CAC habría dicho "Por encima del techo" y apagado la campaña.
  await expect(page.locator('text=Dentro del techo')).toBeVisible();
});

test('el texto NO puede describir el techo del primer pedido — ya no es el que decide', async ({ page }) => {
  await abrirFreno(page, {
    ...frenoBase, gasto: 500, nuevosPagados: 25, cac: 20, margenPct: 20, cacMin: 16, cacMax: 24,
    veredicto: 'sano', fiable: true, motivo: null,
  });
  // ⚠ El texto decía "el techo es lo que te deja un cliente en su PRIMER pedido" y siguió
  // diciéndolo después de que el freno cambió de ancla. Un texto que describe un mecanismo
  // retirado manda a interpretar el número al revés — es el mismo defecto que ya obligó a
  // que el brief semanal dejara de nombrar la hora valle.
  await expect(page.locator('text=en su PRIMER pedido')).toHaveCount(0);
  await expect(page.locator('text=ya cuenta con que el cliente vuelve 2.41 veces')).toBeVisible();
  // Y el recorte por confianza se dice, con su motivo: un techo prestado que se presenta como
  // propio es el dato con aspecto de medición que este repo evita.
  await expect(page.locator('text=recortado al 75%')).toBeVisible();
  await expect(page.locator('text=todavía no la tuya')).toBeVisible();
});
