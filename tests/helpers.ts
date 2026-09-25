import { Page } from '@playwright/test';
import path from 'path';

// SND//WCH — tests/helpers
// Toda la app pasa por UN solo endpoint (api()) que manda {action, ...} por POST — eso
// hace que interceptar esa única ruta y despachar por `action` sea suficiente para
// simular el backend completo sin depender de una red real (bloqueada en muchos entornos
// de CI/sandbox) ni de datos reales en Supabase. loadInvBackground() es la única llamada
// que no pasa por api() (usa sbG() directo a PostgREST) — se intercepta aparte.

export const APP_FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');

export type ActionHandlers = Record<string, unknown | ((body: any) => unknown)>;

// Horario abierto las 24h los 7 días — evita que un test falle solo porque corrió de
// madrugada hora Lima (el horario real hardcodeado en el cliente es 11-22).
export const OPEN_ALL_DAY_HOURS = Array.from({ length: 7 }, () => ({ open: 0, close: 24, closed: false }));

const DEFAULT_HANDLERS: ActionHandlers = {
  'session-check': { valid: false },
  'get-catalog': { proteins: {}, sigs: {}, sides: {}, rewardPts: {}, inventory: {} },
  // businessLaunched:true — el negocio abre el 7 de septiembre y hasta entonces el
  // servidor y el cliente rechazan cualquier pedido (assertBusinessLaunched en
  // orders.ts). Los tests ejercitan el negocio YA operando, así que el mock lo
  // declara abierto; sin esto todos los flujos de checkout fallarían por diseño.
  'get-store-hours': { hours: OPEN_ALL_DAY_HOURS, businessLaunched: true },
};

// Instala el mock del backend ANTES de navegar (page.route corre para toda request que
// haga match, incluida la primera que dispara el propio arranque de la app). `handlers`
// se mergea sobre los defaults — cada test solo declara las acciones que le importan.
export async function mockBackend(page: Page, handlers: ActionHandlers = {}) {
  const all = { ...DEFAULT_HANDLERS, ...handlers };
  const calls: { action: string; body: any }[] = [];

  await page.route('**/functions/v1/api', async (route) => {
    const body = route.request().postDataJSON();
    const action = body?.action;
    calls.push({ action, body });
    // `'*'` es el comodín: se usa cuando una prueba recorre MUCHAS acciones y lo que le
    // importa no es cada respuesta sino que ninguna pantalla se rompa (ver
    // `panel-todas-las-herramientas.spec.ts`, que abre las 35 herramientas del panel).
    // El estricto sigue siendo el default: sin handler y sin comodín, la acción responde
    // 400 con "acción no mockeada" — que es lo que hace que una prueba normal se entere de
    // que la app empezó a llamar algo que nadie declaró.
    const entry = all[action] !== undefined ? all[action] : all['*'];
    if (entry === undefined) {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'acción no mockeada: ' + action }) });
      return;
    }
    // Un handler puede lanzar (throw new Error('mensaje')) para simular un error real del
    // servidor (400/409/etc.) — api() en el cliente solo distingue éxito/error por status
    // HTTP (r.ok), así que antes no había forma de probar un camino de error del backend
    // real sin ese salto de status; todo error simulado en los tests hasta ahora era
    // client-side puro (nunca llegaba a llamar al mock).
    try {
      const payload = typeof entry === 'function' ? (entry as (b: any) => unknown)(body) : entry;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
    } catch (e: any) {
      await route.fulfill({ status: e?.status || 400, contentType: 'application/json', body: JSON.stringify({ error: e?.message || 'Error simulado.' }) });
    }
  });

  // loadInvBackground() lee inventario directo de PostgREST (sbG), no por api() — sin
  // mockearla, cada carga de página intenta una request real que el sandbox bloquea.
  // Está envuelta en try/catch en el cliente así que un fallo no rompe nada, pero
  // abortarla explícitamente evita el timeout de red innecesario en cada test.
  await page.route('**/rest/v1/inventory*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  // Los dos <script> de terceros de src/shell.html NUNCA deben cargarse en un test.
  //
  // `checkout.culqi.com/js/v4` define `window.Culqi`, que es justo lo que weekly-plan.spec.ts
  // sustituye por un stub para poder simular un pago sin widget real. Ese script va con
  // `defer`, o sea que corre DESPUÉS del nuestro: donde la red lo alcanza, pisa el stub, y
  // `Culqi.open()` abre el widget de verdad en vez de disparar `window.culqi()`. El flujo
  // se queda ahí y el test falla esperando un mensaje que nunca llega.
  //
  // Esto no se veía en desarrollo: el proxy de este sandbox bloquea `checkout.culqi.com`,
  // así que el stub sobrevivía por accidente y el test pasaba 20 de 20 veces. En el runner
  // de GitHub el dominio SÍ es alcanzable y el mismo test falló 2 de 2. No era una prueba
  // intermitente — era determinista en ambos lados, con el resultado opuesto en cada uno,
  // y la diferencia era la red, no la temporización.
  //
  // Abortarlos deja el resultado igual en cualquier entorno, con o sin salida a internet,
  // que es el mismo criterio que ya sigue todo este archivo: un test no depende de red real.
  // Ojo: NO debilita third-party-globals.spec.ts, que se inyecta su propio script para
  // probar la resiliencia y no depende de que estos dos carguen.
  await page.route('**/checkout.culqi.com/**', (route) => route.abort());
  await page.route('**/accounts.google.com/**', (route) => route.abort());

  return calls;
}

// window.open('https://wa.me/...') se dispara automáticamente al confirmar un pedido —
// sin esto Playwright abre una pestaña real hacia WhatsApp en cada test de checkout.
export async function stubWindowOpen(page: Page) {
  await page.addInitScript(() => {
    (window as any).open = () => null;
  });
}

// Punto de entrega por defecto de los tests. Desde el 2026-09-02 el envío se cobra por
// DISTANCIA REAL y el checkout exige un pin confirmado antes de pagar, así que sin esto todo
// test que llegue a pagar se queda en la puerta.
//
// Estas coordenadas están elegidas para dar exactamente 4.00 km cobrables = **S/8**, que es el
// mismo monto que cobraba la zona "media" (la que venía por defecto) en el esquema anterior.
// Así los totales esperados de los tests que ya existían siguen siendo válidos y siguen
// probando lo que probaban, en vez de convertirse en una reescritura de números.
//
// Representa al cliente NORMAL: el que ya confirmó su ubicación una vez y la tiene guardada.
// El caso sin pin tiene su propio test en tests/delivery-distancia.spec.ts.
export const PIN_TEST = { lat: -8.111962, lon: -79.039458, km: 4.0, fee: 8 };

export async function setDeliveryPin(page: Page, lat = PIN_TEST.lat, lon = PIN_TEST.lon) {
  await page.evaluate(([la, lo]) => {
    (window as any)._mLat = la;
    (window as any)._mLon = lo;
  }, [lat, lon]);
}

export async function clearDeliveryPin(page: Page) {
  await page.evaluate(() => {
    (window as any)._mLat = null;
    (window as any)._mLon = null;
  });
}

// La app abre en la pantalla de eleccion entre los dos hermanos (`homeTab` arranca en
// null). Una prueba que necesita el CATALOGO tiene que pasar por ahi igual que un cliente.
// Se exporta porque cuatro specs navegan por su cuenta en vez de usar gotoApp, y repetir
// el clic en cada uno los deja desincronizados el dia que la pantalla cambie.
export async function elegirSando(page: Page) {
  // La app abre SIEMPRE en la puerta (2026-09-25). Se toca la puerta SOLO si está: una prueba
  // que ya navegó dentro del mundo y vuelve a llamar esto no tiene que salir de él.
  const puerta = page.getByRole('button', { name: /Ya está resuelto/ });
  await Promise.race([puerta.waitFor(), page.waitForSelector('text=Y además')]);
  if (await puerta.isVisible()) await puerta.click();
  // Se espera un texto que SOLO existe en el mundo de SANDO ya pintado. Antes era
  // "SIGNATURE", que era la pestaña del catálogo viejo; al desaparecer esa barra el helper
  // se quedaba esperando 30s en cada prueba de la suite. El ancla es el tramo de abajo del
  // mundo, así que llegar hasta él significa que la pantalla se pintó ENTERA.
  await page.waitForSelector('text=Y además');
}

export async function gotoApp(page: Page, handlers: ActionHandlers = {}) {
  const calls = await mockBackend(page, handlers);
  await stubWindowOpen(page);
  // Se inyecta ANTES de que corra el bundle: así el pin ya está puesto en el primer render y
  // ningún test tiene que acordarse de ponerlo.
  await page.addInitScript(([la, lo]) => {
    (window as any)._mLat = la;
    (window as any)._mLon = lo;
  }, [PIN_TEST.lat, PIN_TEST.lon]);
  await page.goto(APP_FILE);
  // ⚠ LA APP ABRE EN LA PANTALLA DE ELECCION (sOEleccion), no en el catalogo. `homeTab`
  // arranca en null a proposito: la decision entre los dos hermanos es una pantalla, no
  // una pestana. Asi que cada prueba tiene que pasar por ella igual que un cliente.
  //
  // Se HACE CLIC, no se siembra `homeTab='sig'` desde el test. Este repo ya se quemo con
  // eso: la pantalla de bienvenida tenia una prueba en verde que preparaba a mano un
  // estado que produccion no podia alcanzar, y la pantalla no se mostro NUNCA. Un clic
  // recorre el mismo camino que el cliente, y de paso deja la pantalla de eleccion
  // cubierta por toda la suite: si se rompe, se rompe ruidosamente y en todas partes.
  await elegirSando(page);
  return calls;
}

// ── Entrar por la interfaz ────────────────────────────────────────────────────────────
//
// POR QUÉ EXISTE. Hasta el 2026-09-23, 35 specs repetían las mismas tres líneas para entrar:
// llenar `#l-phone`, llenar `#l-pin`, tocar «INGRESAR //». El día que la pantalla de entrada
// pasó a correo + código de 6 dígitos —que es lo que las pantallas aprobadas prometen— esas
// tres líneas dejaron de existir y **46 pruebas se rompieron de golpe por un cambio de una
// pantalla**. No porque el cambio estuviera mal: porque el detalle de CÓMO se entra estaba
// copiado 46 veces.
//
// Ahora vive acá. El próximo cambio de la pantalla de entrada toca un archivo, no 35.
//
// Sigue entrando por teléfono + PIN a propósito: es el camino que el panel admin usa y el
// que conservan las cuentas creadas antes del correo, así que es el que la mayoría de estas
// pruebas quiere ejercitar. Para probar el camino de correo está su propio spec.
export async function entrarConTelefono(page: Page, phone = '900000001', pin = '1234') {
  await irAEntrar(page);
  // Entrar abre en el correo; este enlace destapa el teléfono + PIN de las cuentas de antes.
  await page.getByRole('button', { name: 'Entrar con teléfono y PIN' }).click();
  await page.locator('#l-phone').fill(phone);
  await page.locator('#l-pin').fill(pin);
  await page.locator('.en-go button.oro').click();
}

// Entrar se abre desde la esquina de la puerta («Entrar →») o desde PUNTOS sin sesión, como lo
// hace un cliente. Si ya está abierta no se toca nada; si la prueba está dentro de un mundo,
// primero vuelve a la puerta por su «×».
export async function irAEntrar(page: Page) {
  const entrar = page.locator('.en'), esquina = page.locator('.pta .yo'), cambiar = page.locator('[aria-label="Cambiar de lado"]').first();
  await Promise.race([entrar.waitFor(), esquina.waitFor(), cambiar.waitFor()]);
  if (await entrar.isVisible()) return;
  if (!(await esquina.isVisible())) await cambiar.click();
  await esquina.click();
  await entrar.waitFor();
}

// ── Entrar al armador ─────────────────────────────────────────────────────────────────
//
// Hasta el rediseño, el armador se abría tocando el texto «Arma el tuyo» en el home. Ese
// texto ya no existe: el home es la puerta partida entre los dos hermanos, y el armador es
// el lado de WICHO. Diez pruebas quedaron buscando el texto viejo y esperando 30 s cada una.
//
// Se entra como entra un cliente que ya está del lado de SANDO (donde deja `gotoApp`):
// «Cambiar de lado» → la mitad de WICHO. El armador abre en el paso del TAMAÑO.
export async function irAlArmador(page: Page) {
  await page.locator('[aria-label="Cambiar de lado"]').first().click();
  await page.locator('button[onclick="elegirLado(\'byo\')"]').click();
  await page.waitForSelector('text=¿De qué tamaño?');
}

// Hasta el paso de la proteína (el de la maqueta M22): tamaño y pan, los primeros de cada uno.
export async function hastaLaProteina(page: Page) {
  await irAlArmador(page);
  await page.locator('[onclick*="size=\'15\'"]').click();
  await siguientePaso(page);
  await page.locator('[onclick^="base="]').first().click();
  await siguientePaso(page);
  await page.waitForSelector('text=¿Qué va adentro?');
}

// El botón de avanzar del armador. Se busca por lo que HACE, no por su rótulo: el rótulo
// cambia entre «Siguiente», «Listo» y la pista de lo que falta («Elige un pan»).
export async function siguientePaso(page: Page) {
  await page.locator('button[onclick="byoStepNext()"]').click();
}

// ── LA CARTA, PREGUNTADA A LA APP (2026-09-24) ──────────────────────────────────────────────
//
// Una prueba necesita «un Signature que se pueda pedir», «una bebida» o «una proteína del
// armador», nunca «The Original». Escribir el código de un producto ata la prueba a una carta
// que cambia: la v4 del 2026-09-24 retiró tres Signatures de una vez y rompió decenas de
// pruebas sin que ninguna regla hubiera cambiado. Esto lee la carta que la app tiene cargada
// (los mismos arrays con los que pinta y cobra), así que sirve para cualquier carta.
//
// `signature(i)` / `bebida(i)` / `proteina(i)` dan uno distinto por índice cuando hay varios,
// y dan vueltas si hay menos: una prueba que necesita dos DISTINTOS los pide con 0 y 1 y
// comprueba antes el largo de la lista.
export type Carta = {
  signatures: string[];
  bebidas: string[];
  armador: string[];
  /** Proteínas y vegetales que existen pero solo dentro de un Signature (sigOnly). */
  protExclusivas: string[];
  topsExclusivos: string[];
  /** El id del menú secreto, o null si la carta no tiene. */
  secreto: string | null;
  panes: string[];
  topsDelArmador: string[];
  salsasDelArmador: string[];
  /** Precio de carta de cada Signature (15CM y 30CM) y de cada bebida, y el nombre de la bebida
   *  como lo escribe el carrito («The Midnight // Brew»). */
  p15: Record<string, number>;
  p30: Record<string, number>;
  precioBebida: Record<string, number>;
  nombreBebida: Record<string, string>;
  signature: (i?: number) => string;
  bebida: (i?: number) => string;
  proteina: (i?: number) => string;
  pan: (i?: number) => string;
  top: (i?: number) => string;
  salsa: (i?: number) => string;
};
export async function cartaDeLaApp(page: Page): Promise<Carta> {
  const c = await page.evaluate(() => {
    const w = window as any;
    return {
      signatures: (w.sigsEnOrden ? w.sigsEnOrden(w.SIGS) : w.SIGS).filter((s: any) => !s.secret && !s.retired).map((s: any) => s.id),
      bebidas: w.SIDES.map((d: any) => d.id),
      armador: w.PROTS.filter((p: any) => !p.sigOnly && !p.vaultOnly).map((p: any) => p.id),
      protExclusivas: w.PROTS.filter((p: any) => p.sigOnly).map((p: any) => p.id),
      topsExclusivos: w.TOPS.filter((t: any) => t.sigOnly).map((t: any) => t.id),
      secreto: (w.SIGS.find((s: any) => s.secret) || { id: null }).id,
      panes: w.BASES.map((b: any) => b.id),
      topsDelArmador: w.TOPS.filter((t: any) => !t.sigOnly && !t.vaultOnly).map((t: any) => t.id),
      salsasDelArmador: w.SAUCES.filter((x: any) => !x.sigOnly && !x.vaultOnly).map((x: any) => x.id),
      p15: Object.fromEntries(w.SIGS.map((s: any) => [s.id, s.p15])),
      p30: Object.fromEntries(w.SIGS.map((s: any) => [s.id, s.p30])),
      precioBebida: Object.fromEntries(w.SIDES.map((d: any) => [d.id, d.p])),
      nombreBebida: Object.fromEntries(w.SIDES.map((d: any) => [d.id, d.s ? d.l + ' // ' + d.s : d.l])),
    };
  });
  for (const k of ['signatures', 'bebidas', 'armador', 'panes', 'topsDelArmador', 'salsasDelArmador'] as const) if (!c[k].length) throw new Error(`La app no tiene ${k}: la prueba no puede armarse.`);
  const vuelta = (l: string[]) => (i = 0) => l[i % l.length]!;
  return {
    ...c,
    signature: vuelta(c.signatures),
    bebida: vuelta(c.bebidas),
    proteina: vuelta(c.armador),
    pan: vuelta(c.panes),
    top: vuelta(c.topsDelArmador),
    salsa: vuelta(c.salsasDelArmador),
  };
}

/** Un monto como lo escribe la app («S/23.90»), con su propio formateador. */
export async function soles(page: Page, n: number): Promise<string> {
  return page.evaluate((x) => (window as any).SOLES_TXT + (window as any).pz(x), Math.round(n * 100) / 100);
}
