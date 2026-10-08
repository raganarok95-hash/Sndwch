// SND//WCH — EL CONTRATO DE LA API (2026-09-24)
//
// Cada acción declara acá qué recibe y qué devuelve. Lo leen los dos lados:
//   · el servidor valida la entrada con el esquema ANTES de llamar a la acción (api/entrada.ts),
//     y la tabla ACTIONS exige que cada acción de acá tenga un manejador con estos tipos;
//   · el cliente nuevo llama `llamar('recurring-skip', {...})` (src/nuevo/api.ts): un nombre de
//     acción mal escrito, un campo que falta o uno de otro tipo NO COMPILA.
//
// Lo que antes los ataba era un texto repetido en dos lados — `api('recurring-skip')` en el
// cliente y `"recurring-skip": actRecurringSkip` en el servidor— que nadie comparaba.
//
// Las acciones entran acá a medida que se migran; las que faltan siguen con `any` en la tabla,
// a la vista. La lista de las que ya están es la de este objeto.
import * as e from './esquema.ts';
import type { Direccion, FijoDelCliente, FijoSugerido, ItemCarrito } from './dominio.ts';

/** El token de sesión. No se rechaza acá: sin él, `requireSession` responde 401, que es lo que
 *  el cliente necesita para mandar a iniciar sesión (un 400 de validación no lo haría). */
const token: e.Esquema<string> = { leer: (v) => (typeof v === 'string' ? v : '') };

/** Los ítems se aceptan como vienen y los valida `priceCartItem`, que conoce la carta. */
const items = e.lista(e.sinRevisar() as e.Esquema<ItemCarrito>, {
  min: 1,
  max: 30,
  mensaje: 'Tu carrito está vacío — arma el pedido antes de dejarlo fijo.',
});

/** Lo que manda el checkout en los caminos que cobran. Texto opcional: cada acción sigue
 *  rechazando con su propio mensaje lo que falte («Faltan datos del pedido.»). lat/lon pasan sin
 *  tocar (readCoords los sanea; null→0 sería una coordenada válida). */
const CAMPOS_DEL_PEDIDO = {
  token,
  ref: e.textoOpcional(40),
  name: e.textoOpcional(80),
  phone: e.textoOpcional(20),
  email: e.textoOpcional(254),
  address: e.textoOpcional(300),
  notes: e.textoOpcional(500),
  summary: e.textoOpcional(1000),
  deliveryZone: e.textoOpcional(40),
  total: e.numero({ min: 0, max: 100_000, opcional: true, mensaje: 'El total no es válido.' }),
  items: e.sinRevisar(),
  rewardId: e.textoOpcional(20),
  promoCode: e.textoOpcional(40),
  scheduledFor: e.textoOpcional(40),
  recurringId: e.textoOpcional(64),
  groupCode: e.textoOpcional(24),
  lat: e.sinRevisar(),
  lon: e.sinRevisar(),
  fbp: e.textoOpcional(120),
  fbc: e.textoOpcional(300),
  ua: e.textoOpcional(400),
  src: e.textoOpcional(60),
};

/** Lo único que manda pg_cron: el secreto que verifyCronSecret compara. */
const CAMPOS_CRON = { token, cronSecret: e.textoOpcional(500) };

/** El panel, mientras sus tipos no se endurezcan: pasa el dato tal cual y con el tipo que el
 *  código del panel ya asumía (`any`). Igual entra al contrato: lo no declarado se descarta. */
// deno-lint-ignore no-explicit-any
const crudo = e.sinRevisar() as e.Esquema<any>;

function accion<S>() {
  return <E extends e.Esquema<unknown>>(entrada: E) => ({ entrada, salida: undefined as unknown as S });
}

export const CONTRATO = {
  'addresses-list': accion<{ addresses: Direccion[] }>()(e.objeto({ token })),

  'recurring-list': accion<{
    recurring: FijoDelCliente[];
    sugerido: FijoSugerido | null;
    desdeConfirmados: number;
    sueltaMin: number;
  }>()(e.objeto({ token })),

  'recurring-add': accion<{ success: true }>()(
    e.objeto({
      token,
      items,
      weekday: e.entero({ min: 0, max: 6, mensaje: 'Elige un día de la semana.' }),
      slot: e.texto({ min: 1, max: 5, mensaje: 'Elige una hora válida.' }),
      addressId: e.nulable(e.idNumerico('Esa dirección no es válida.')),
    }),
  ),

  'recurring-delete': accion<{ success: true }>()(
    e.objeto({ token, id: e.uuid('Falta el pedido fijo.') }),
  ),

  // El aviso de puntos de la 06A, cuando quien pagó sin entrar YA tenía cuenta (ver
  // vincularPedidoDeInvitado en api/actions/auth.ts). `customer` sale solo si se acreditó.
  'reclamar-pedido': accion<{ acreditado: boolean; customer: Record<string, unknown> | null }>()(
    e.objeto({ token, ref: e.texto({ min: 1, max: 40, mensaje: 'Falta el pedido.' }) }),
  ),

  // Quitar lo que uno agregó a un pedido grupal (2026-10-01). La llave la da add-group-item.
  'remove-group-item': accion<{ success: true }>()(
    e.objeto({
      token,
      code: e.texto({ min: 4, max: 12, mensaje: 'Falta el código del grupo.' }),
      id: e.uuid('Falta qué quitar.'),
      llave: e.texto({ max: 200 }),
    }),
  ),

  // El botón de los anuncios de Meta (dueño, 2026-10-01: «que yo pueda desactivar manualmente
  // con un botón los anuncios de meta»). `que`: 'ver' | 'apagar' | 'prender'.
  'admin-meta-ads': accion<{
    cuenta: string;
    campanas: { id: string; nombre: string; estado: string; activa: boolean }[];
    pausadasPorBoton: string[];
    pausadasAt: string | null;
  }>()(
    e.objeto({ token, que: e.texto({ min: 3, max: 8, mensaje: 'Falta qué hacer con los anuncios.' }) }),
  ),

  // ── ACCESO (2026-10-01): las cinco acciones con que se entra y se sale de una cuenta. ──
  'google-auth': accion<Record<string, unknown>>()(
    e.objeto({ token, idToken: e.texto({ min: 20, max: 4096, mensaje: 'Google no mandó la credencial.' }) }),
  ),
  'request-login-code': accion<Record<string, unknown>>()(
    e.objeto({ token, email: e.texto({ min: 3, max: 254, mensaje: 'Escribe tu correo.' }) }),
  ),
  'verify-login-code': accion<Record<string, unknown>>()(
    e.objeto({
      token,
      email: e.texto({ min: 3, max: 254, mensaje: 'Escribe tu correo.' }),
      code: e.texto({ min: 6, max: 6, mensaje: 'El código son 6 dígitos.' }),
    }),
  ),
  'session-check': accion<Record<string, unknown>>()(e.objeto({ token })),
  // El PIN es opcional: las cuentas que entran con correo o con Google no tienen.
  'delete-account': accion<Record<string, unknown>>()(
    e.objeto({ token, pin: { leer: (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 12) : '') } as e.Esquema<string> }),
  ),

  // ── DINERO, las simples (2026-10-01). Cada acción sigue validando adentro lo que ya validaba;
  // el contrato asegura la FORMA y que no entre nada que no se declaró. lat/lon pasan sin tocar:
  // como número opcional, un dato ausente llegaría como null y Number(null) es 0 —una coordenada
  // válida en el mar—, cuando hoy llega NaN y la acción lo rechaza.
  'my-orders': accion<Record<string, unknown>>()(e.objeto({ token, ref: e.textoOpcional(40) })),
  'cancel-my-order': accion<Record<string, unknown>>()(
    e.objeto({ token, orderId: e.textoOpcional(64), ref: e.textoOpcional(40) }),
  ),
  'report-order-problem': accion<Record<string, unknown>>()(
    e.objeto({ token, ref: e.textoOpcional(40), motivo: e.textoOpcional(60), detalle: e.textoOpcional(1000) }),
  ),
  'my-order-problems': accion<Record<string, unknown>>()(e.objeto({ token })),
  'create-group-order': accion<Record<string, unknown>>()(e.objeto({ token })),
  'get-group-order': accion<Record<string, unknown>>()(e.objeto({ token, code: e.textoOpcional(12) })),
  'add-group-item': accion<Record<string, unknown>>()(
    e.objeto({ token, code: e.textoOpcional(12), contributorName: e.textoOpcional(40), item: e.sinRevisar() }),
  ),
  'cancel-group-order': accion<Record<string, unknown>>()(e.objeto({ token, code: e.textoOpcional(12) })),
  'close-group-order': accion<Record<string, unknown>>()(e.objeto({ token, code: e.textoOpcional(12) })),
  'split-group-order': accion<Record<string, unknown>>()(
    e.objeto({ token, code: e.textoOpcional(12), address: e.textoOpcional(300), contactPhone: e.textoOpcional(20), lat: e.sinRevisar(), lon: e.sinRevisar() }),
  ),
  'group-split-preview': accion<Record<string, unknown>>()(
    e.objeto({ token, code: e.textoOpcional(12), lat: e.sinRevisar(), lon: e.sinRevisar() }),
  ),
  'registrar-visita': accion<Record<string, unknown>>()(e.objeto({ token, src: e.textoOpcional(60) })),
  'export-orders': accion<Record<string, unknown>>()(e.objeto({ token })),

  // ── LAS TRES QUE COBRAN (2026-10-01). Todo lo que leen ellas Y sus auxiliares
  // (readCoords: lat/lon · readMetaAttribution: fbp/fbc/ua/groupCode · organizerWaiverFor:
  // groupCode/token · fijoPropio: recurringId). El monto y los ítems los vuelve a calcular el
  // servidor (deriveCart, _shared/dinero.ts): acá solo se asegura la forma.
  'prepare-order': accion<Record<string, unknown>>()(e.objeto(CAMPOS_DEL_PEDIDO)),
  'place-order': accion<Record<string, unknown>>()(
    e.objeto({
      ...CAMPOS_DEL_PEDIDO,
      chargeId: e.textoOpcional(120),
      paymentMethod: e.textoOpcional(20),
      useCredit: e.bandera(),
      cod: e.sinRevisar(),
    }),
  ),
  'validate-promo-code': accion<Record<string, unknown>>()(
    e.objeto({
      token,
      code: e.textoOpcional(40),
      phone: e.textoOpcional(20),
      rewardId: e.textoOpcional(20),
      scheduledFor: e.textoOpcional(40),
      groupCode: e.textoOpcional(24),
      items: e.sinRevisar(),
    }),
  ),

  // ── EL RESTO DEL CLIENTE (2026-10-01). Booleanos, números, listas y coordenadas pasan sin
  // tocar (sinRevisar): cada acción ya los interpreta a su manera y cambiar esa lectura sería
  // cambiar su comportamiento. Los textos tienen topes holgados; el comprobante (imageBase64)
  // no tiene tope de texto: lo cortaría en silencio.
  'get-catalog': accion<Record<string, unknown>>()(e.objeto({ token })),
  'get-store-hours': accion<Record<string, unknown>>()(e.objeto({ token })),
  'my-history': accion<Record<string, unknown>>()(e.objeto({ token })),
  'favorites-list': accion<Record<string, unknown>>()(e.objeto({ token })),
  'dashboard-stats': accion<Record<string, unknown>>()(e.objeto({ token })),
  'export-customers': accion<Record<string, unknown>>()(e.objeto({ token })),
  'set-ad-tracking': accion<Record<string, unknown>>()(e.objeto({ token, optOut: e.sinRevisar() })),
  'set-preferences': accion<Record<string, unknown>>()(
    e.objeto({ token, notifPrefs: e.sinRevisar(), preferredPayment: e.sinRevisar() }),
  ),
  'addresses-add': accion<Record<string, unknown>>()(
    e.objeto({ token, label: e.textoOpcional(80), address: e.textoOpcional(500), reference: e.textoOpcional(500), lat: e.sinRevisar(), lon: e.sinRevisar() }),
  ),
  'addresses-update': accion<Record<string, unknown>>()(
    e.objeto({ token, id: e.textoOpcional(64), label: e.textoOpcional(80), address: e.textoOpcional(500), reference: e.textoOpcional(500), lat: e.sinRevisar(), lon: e.sinRevisar() }),
  ),
  'addresses-delete': accion<Record<string, unknown>>()(e.objeto({ token, id: e.textoOpcional(64) })),
  'favorites-add': accion<Record<string, unknown>>()(
    e.objeto({
      token, name: e.textoOpcional(80), mode: e.textoOpcional(20), sigId: e.textoOpcional(20),
      size: e.sinRevisar(), base: e.sinRevisar(), prot: e.sinRevisar(), doubleProt: e.sinRevisar(),
      cheese: e.sinRevisar(), tops: e.sinRevisar(), sauces: e.sinRevisar(), extraSauce: e.sinRevisar(),
    }),
  ),
  'submit-rating': accion<Record<string, unknown>>()(
    e.objeto({ token, ref: e.textoOpcional(40), stars: e.sinRevisar(), comment: e.textoOpcional(2000), testimonialConsent: e.sinRevisar() }),
  ),
  'confirm-delivery': accion<Record<string, unknown>>()(e.objeto({ token, deliveryToken: e.textoOpcional(200) })),
  'confirm-my-delivery': accion<Record<string, unknown>>()(
    e.objeto({ token, orderId: e.textoOpcional(64), ref: e.textoOpcional(40) }),
  ),
  'upload-receipt': accion<Record<string, unknown>>()(
    e.objeto({ token, ref: e.textoOpcional(40), mime: e.textoOpcional(60), imageBase64: e.sinRevisar() }),
  ),
  'push-subscribe': accion<Record<string, unknown>>()(
    e.objeto({ token, endpoint: e.textoOpcional(2000), p256dh: e.textoOpcional(500), auth: e.textoOpcional(500) }),
  ),
  'push-unsubscribe': accion<Record<string, unknown>>()(e.objeto({ token, endpoint: e.textoOpcional(2000) })),
  'submit-complaint': accion<Record<string, unknown>>()(
    e.objeto({
      token, kind: e.textoOpcional(40), consumerName: e.textoOpcional(200), consumerDni: e.textoOpcional(40),
      consumerAddress: e.textoOpcional(500), consumerPhone: e.textoOpcional(40), consumerEmail: e.textoOpcional(254),
      detail: e.textoOpcional(10_000), consumerRequest: e.textoOpcional(10_000), isMinor: e.sinRevisar(),
      guardianName: e.textoOpcional(200), claimedAmount: e.sinRevisar(), orderRef: e.textoOpcional(40),
    }),
  ),
  'report-client-error': accion<Record<string, unknown>>()(
    e.objeto({ token, donde: e.textoOpcional(200), mensaje: e.textoOpcional(1000), pila: e.textoOpcional(2000), pantalla: e.textoOpcional(100), version: e.textoOpcional(100) }),
  ),
  'anniversary-greeting': accion<Record<string, unknown>>()(e.objeto({ token, cronSecret: e.textoOpcional(500) })),
  'sync-cart': accion<Record<string, unknown>>()(e.objeto({ token, items: e.sinRevisar() })),

  // ── LOS CRONS (2026-10-01): pg_cron los llama con el secreto; verifyCronSecret lo compara.
  'remind-monthly-recap': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'remind-low-stock': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'alert-batch-expiry': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'alert-scheduled-shortfall': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'alert-card-declines': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'alert-system-health': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'alert-cook-now': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'alert-cac-brake': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'alert-admin-access': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'send-retention-report': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'remind-marketing-content': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'auto-publish-calendar': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'verificar-meta': accion<{ pixel: boolean; token: boolean; tokenValido: boolean | null; puedeEscribirAlPixel: boolean | null; detalle: string | null }>()(e.objeto(CAMPOS_CRON)),
  'alert-complaint-deadlines': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'remind-unclaimed-challenge': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'remind-peak-hour': accion<Record<string, unknown>>()(e.objeto({ ...CAMPOS_CRON, slot: e.sinRevisar() })),
  'remind-abandoned-cart': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'remind-after-cancel': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'remind-high-rank-winback': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'remind-lapsed-customers': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'remind-recurring-orders': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'remind-points-nudge': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'expire-stale-manual-payments': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'alert-stuck-orders': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'expire-pending-charges': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'alert-scheduled-orders': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'reconcile-culqi-charges': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'alert-order-problems': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'remind-abandoned-payment': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'remind-unused-credit': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'remind-second-order': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'remind-never-ordered': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'bounce-back-first-order': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),
  'expire-group-shares': accion<Record<string, unknown>>()(e.objeto(CAMPOS_CRON)),

  // ── EL PANEL (2026-10-01). Solo un admin las llama (requireAdmin). Los campos pasan tal como
  // llegan (sinRevisar): el contrato descarta lo no declarado y check:contrato-campos asegura que
  // no falte nada. Endurecer los tipos de cada una queda pendiente, empezando por las que tocan dinero.
  'admin-orders': accion<Record<string, unknown>>()(e.objeto({ token })),
  'cliente-lee-captura': accion<Record<string, unknown>>()(e.objeto({ token, ref: e.textoOpcional(40), text: e.textoOpcional(4000) })),
  'admin-receipt-ocr': accion<Record<string, unknown>>()(e.objeto({ token, ref: crudo, text: crudo })),
  'admin-update-status': accion<Record<string, unknown>>()(e.objeto({ token, orderId: e.uuid('Falta el pedido.'), status: e.texto({ min: 1, max: 20, mensaje: 'Falta el estado.' }), etaMinutes: e.numero({ min: 0, max: 600, opcional: true, mensaje: 'Los minutos no son válidos.' }) })),
  'admin-confirm-payment': accion<Record<string, unknown>>()(e.objeto({ token, orderId: e.uuid('Falta el pedido.') })),
  'admin-cancel-order': accion<Record<string, unknown>>()(e.objeto({ token, orderId: e.uuid('Falta el pedido.'), acknowledgeRefund: e.bandera(), reason: e.textoOpcional(200) })),
  'admin-receipt-url': accion<Record<string, unknown>>()(e.objeto({ token, orderId: crudo })),
  'admin-manual-points': accion<Record<string, unknown>>()(e.objeto({ token, phone: e.textoOpcional(20), pts: e.numero({ min: -100_000, max: 100_000, mensaje: 'Los puntos no son válidos.' }) })),
  'admin-manual-credit': accion<Record<string, unknown>>()(e.objeto({ token, phone: e.textoOpcional(20), delta: e.numero({ min: -10_000, max: 10_000, mensaje: 'El monto de crédito no es válido.' }) })),
  'admin-accounts-list': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-accounts-add': accion<Record<string, unknown>>()(e.objeto({ token, pin: e.textoOpcional(20), phone: e.textoOpcional(20), name: e.textoOpcional(80) })),
  'admin-accounts-delete': accion<Record<string, unknown>>()(e.objeto({ token, pin: e.textoOpcional(20), phone: e.textoOpcional(20) })),
  'admin-inventory-toggle': accion<Record<string, unknown>>()(e.objeto({ token, code: crudo, name: crudo, inStock: e.bandera() })),
  'admin-inventory-set-stock': accion<Record<string, unknown>>()(e.objeto({ token, code: e.textoOpcional(20), name: e.textoOpcional(80), qty: e.numero({ min: 0, max: 100_000, opcional: true, mensaje: 'La cantidad tiene que ser un número de 0 a 100000.' }) })),
  'admin-inventory-restock': accion<Record<string, unknown>>()(e.objeto({ token, items: crudo })),
  'admin-inventory-batches': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-inventory-set-shelf-life': accion<Record<string, unknown>>()(e.objeto({ token, code: crudo, days: crudo })),
  'admin-health': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-batch-plan': accion<Record<string, unknown>>()(e.objeto({ token, coverDays: crudo })),
  'admin-cash-close': accion<Record<string, unknown>>()(e.objeto({ token, since: crudo, until: crudo })),
  'admin-purchases': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-purchase-add': accion<Record<string, unknown>>()(e.objeto({ token, productCode: crudo, qty: crudo, totalPaid: crudo, unit: crudo, supplier: crudo, purchasedAt: crudo, notes: crudo })),
  'admin-culqi-report': accion<Record<string, unknown>>()(e.objeto({ token, since: crudo, until: crudo })),
  'admin-tech-health': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-cac-brake': accion<Record<string, unknown>>()(e.objeto({ token, dias: crudo })),
  'admin-ad-spend-set': accion<Record<string, unknown>>()(e.objeto({ token, spendDate: crudo, amount: crudo, platform: crudo, note: crudo })),
  'admin-kill-promos': accion<Record<string, unknown>>()(e.objeto({ token, kill: e.bandera() })),
  'admin-retention-report': accion<Record<string, unknown>>()(e.objeto({ token, months: crudo })),
  'admin-compliance': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-recipes': accion<Record<string, unknown>>()(e.objeto({ token, targetPortions: crudo })),
  'admin-recipe-set': accion<Record<string, unknown>>()(e.objeto({ token, recipeCode: crudo, name: crudo, yieldPortions: crudo, ingredients: crudo, steps: crudo, portionGrams: crudo, notes: crudo, active: crudo })),
  'admin-catalog-set-price': accion<Record<string, unknown>>()(e.objeto({ token, code: e.texto({ min: 1, max: 20, mensaje: 'Falta el código.' }), category: e.texto({ min: 1, max: 20, mensaje: 'Falta la categoría.' }), values: e.sinRevisar() })),
  'admin-catalog-items-get': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-catalog-items-set': accion<Record<string, unknown>>()(e.objeto({ token, itemId: crudo, name: crudo, subtitle: crudo, badge: crudo, pitch: crudo, base: crudo, proteinId: crudo, tops: crudo, sauces: crudo, fixedCheese: crudo, price15: crudo, price30: crudo, imagePath: crudo, active: crudo, cheeseOptional: crudo })),
  'admin-secret-signature-get': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-secret-signature-set': accion<Record<string, unknown>>()(e.objeto({ token, name: e.textoOpcional(80), base: e.textoOpcional(20), proteinId: e.textoOpcional(20), tops: crudo, sauces: crudo, price15: e.numero({ min: 0, max: 500, mensaje: 'El precio de 15CM no es válido.' }), price30: e.numero({ min: 0, max: 500, mensaje: 'El precio de 30CM no es válido.' }), minOrders: crudo, vaultOnlyIds: crudo, imagePath: crudo, endsAt: crudo, hints: crudo, blurb: crudo, announce: crudo })),
  'admin-customer-detail': accion<Record<string, unknown>>()(e.objeto({ token, phone: crudo })),
  'admin-search-orders': accion<Record<string, unknown>>()(e.objeto({ token, q: crudo, status: crudo, dateFrom: crudo, dateTo: crudo })),
  'admin-abrir-pantalla': accion<Record<string, unknown>>()(e.objeto({ token, pantalla: e.textoOpcional(40) })),
  'admin-audit-log': accion<Record<string, unknown>>()(e.objeto({ token, limit: crudo, actorPhone: crudo })),
  'admin-range-report': accion<Record<string, unknown>>()(e.objeto({ token, from: crudo, to: crudo })),
  'admin-ratings-list': accion<Record<string, unknown>>()(e.objeto({ token, limit: crudo, minStars: crudo, onlyWithComments: e.bandera(), onlyConsented: crudo })),
  'admin-at-risk-customers': accion<Record<string, unknown>>()(e.objeto({ token, riskScore: crudo })),
  'admin-prep-list': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-time-window-report': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-problem-addresses': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-marketing-content': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-campaign-performance': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-promo-list': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-promo-create': accion<Record<string, unknown>>()(e.objeto({
    token,
    code: e.texto({ min: 1, max: 20, mensaje: 'Falta el código.' }),
    discountType: e.texto({ min: 1, max: 20, mensaje: 'Tipo de descuento inválido.' }),
    value: e.numero({ min: 0.01, max: 100, mensaje: 'El descuento va de 0.01 a 100 (soles o %).' }),
    maxDiscount: e.numero({ min: 0.01, max: 100, opcional: true, mensaje: 'El tope del descuento va de S/0.01 a S/100.' }),
    maxUses: e.numero({ min: 1, max: 100_000, opcional: true, mensaje: 'Los usos van de 1 a 100000.' }),
    minOrderTotal: e.numero({ min: 0, max: 1000, opcional: true, mensaje: 'El pedido mínimo va de S/0 a S/1000.' }),
    validFrom: e.textoOpcional(40),
    validUntil: e.textoOpcional(40),
    campaignTag: e.textoOpcional(60),
  })),
  'admin-promo-toggle': accion<Record<string, unknown>>()(e.objeto({ token, id: crudo, active: e.bandera() })),
  'admin-calendar-list': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-calendar-create': accion<Record<string, unknown>>()(e.objeto({ token, scheduledDate: crudo, channel: crudo, title: crudo, status: crudo, captionText: crudo, whatsappText: crudo, photoIdea: crudo, videoIdea: crudo, campaignTag: crudo })),
  'admin-calendar-update': accion<Record<string, unknown>>()(e.objeto({ token, id: crudo, scheduledDate: crudo, channel: crudo, title: crudo, captionText: crudo, whatsappText: crudo, photoIdea: crudo, videoIdea: crudo, campaignTag: crudo, status: crudo })),
  'admin-calendar-delete': accion<Record<string, unknown>>()(e.objeto({ token, id: crudo })),
  'admin-calendar-generate': accion<Record<string, unknown>>()(e.objeto({ token, weeks: crudo })),
  'admin-waitlist-list': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-calendar-upload-image': accion<Record<string, unknown>>()(e.objeto({ token, id: crudo, mime: crudo, imageBase64: crudo })),
  'admin-upload-raw-video': accion<Record<string, unknown>>()(e.objeto({ token, mime: crudo, videoBase64: crudo, notes: crudo })),
  'admin-list-raw-uploads': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-publish-social': accion<Record<string, unknown>>()(e.objeto({ token, id: crudo })),
  'admin-video-script': accion<Record<string, unknown>>()(e.objeto({ token, sigId: crudo, angle: crudo, formato: crudo })),
  'admin-set-store-hours': accion<Record<string, unknown>>()(e.objeto({ token, days: crudo })),
  'admin-set-business-launched': accion<Record<string, unknown>>()(e.objeto({ token, launched: e.bandera() })),
  'admin-pause-store': accion<Record<string, unknown>>()(e.objeto({ token, minutes: e.numero({ min: 0, max: 60 * 24 * 7, opcional: true, mensaje: 'Duración de pausa inválida.' }) })),
  'admin-list-complaints': accion<Record<string, unknown>>()(e.objeto({ token, status: crudo })),
  'admin-respond-complaint': accion<Record<string, unknown>>()(e.objeto({ token, id: crudo, response: crudo })),
  'admin-order-problems': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-resolve-order-problem': accion<Record<string, unknown>>()(e.objeto({ token, id: crudo, solucion: crudo, nota: crudo })),
  'admin-zone-waitlist': accion<Record<string, unknown>>()(e.objeto({ token })),
  'admin-notify-zone': accion<Record<string, unknown>>()(e.objeto({ token, district: crudo, districtLabel: crudo })),

  'recurring-skip': accion<{ success: true; skipOn: string | null }>()(
    e.objeto({ token, id: e.uuid('Falta el pedido fijo.'), deshacer: e.bandera() }),
  ),
};

export type Contrato = typeof CONTRATO;
export type Accion = keyof Contrato;
export type Entrada<A extends Accion> = e.Tipo<Contrato[A]['entrada']>;
export type Salida<A extends Accion> = Contrato[A]['salida'];
