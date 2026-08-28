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
const OPEN_ALL_DAY_HOURS = Array.from({ length: 7 }, () => ({ open: 0, close: 24, closed: false }));

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
    const entry = all[action];
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

export async function gotoApp(page: Page, handlers: ActionHandlers = {}) {
  const calls = await mockBackend(page, handlers);
  await stubWindowOpen(page);
  await page.goto(APP_FILE);
  await page.waitForSelector('text=SIGNATURE');
  return calls;
}
