'use strict';
var SB_URL='https://rjosezuoyngiadunfzyn.supabase.co';
var SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb3NlenVveW5naWFkdW5menluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1ODA0MTgsImV4cCI6MjA5MjE1NjQxOH0.fl4gayRXQvplNPzhf4TEzyWqrZXxXYBYHV0tMdJw1fs';
var API_FN_URL=SB_URL+'/functions/v1/api';
var WA='51930957640',GOLD='#CBA258';
// Sistema de sombra — deliberadamente plano y contenido (dirección "Prada Caffè"). El
// sistema anterior ("profundidad": degradado+glow dorado+textura de grano en cada tarjeta
// seleccionada) se retiró: competía con la paleta plana de la nueva identidad y era la
// causa principal de que la app se sintiera "con brillos que no debería tener" (hallazgo
// de auditoría visual). SHADOW_GOLD se conserva como alias de SHADOW_SM únicamente para no
// tener que tocar cada uno de sus ~15 usos — la selección se comunica con borde dorado,
// nunca con una sombra más fuerte.
var SHADOW_SM='0 2px 6px rgba(0,0,0,.22)';
var SHADOW_MD='0 4px 14px rgba(0,0,0,.28)';
var SHADOW_GOLD=SHADOW_SM;
function surfaceGrad(top,bottom){return'linear-gradient(160deg,'+top+','+bottom+')';}
// Identidad legal del negocio — mostrada en el pie de página, en Términos, y como
// identificación del proveedor en el Libro de Reclamaciones (exigido por el Código de
// Protección y Defensa del Consumidor). Debe coincidir EXACTAMENTE con lo que el backend
// tiene en env.ts (BUSINESS_LEGAL_NAME/BUSINESS_RUC) — ese es el que de verdad manda en
// los correos de reclamos; esta copia es solo para pintar la UI.
var BIZ_NAME='Ezra Kemish Vertiz Labarrera',BIZ_RUC='10736044523',BIZ_CITY='Trujillo, Perú',BIZ_EMAIL='contacto@sndwch.com',BIZ_IG='https://www.instagram.com/snd__wch/';
// El prefijo de moneda "S/" se muestra más chico que el monto — a tamaño completo
// se confundía visualmente con un "5" pegado al número (ej. "S/22" leído como "5/22").
var SOLES='<span style="font-size:.6em">S/</span>';
// Versión sin HTML de SOLES, para textos que NO se pintan con innerHTML (showConfirm/
// showPrompt escapan su mensaje a propósito por seguridad — ver esc() en renderOverlays
// — así que el <span> de arriba salía literal, como texto crudo, en vez de dar formato).
var SOLES_TXT='S/';
// Redondeo de dinero a 2 decimales. Desde que el catálogo pasó a precios con decimales
// (.90, decisión del dueño 2026-08-15) la aritmética de punto flotante de JS produce
// basura visible: 18.90 - 3 + 8.47 da 24.369999999999997, y ESE número se le mostraba
// al cliente y se mandaba al servidor. La app se construyó asumiendo precios enteros y
// nunca redondeaba. Todo cálculo de dinero pasa por acá.
function money(n){return Math.round((Number(n)||0)*100)/100;}
// Formato para mostrar: 2 decimales cuando el monto los tiene, entero cuando no.
// "S/18.90" y no "S/18.9" (que se lee a medio escribir), pero "S/8" y no "S/8.00".
function pz(n){var v=money(n);return v===Math.floor(v)?String(v):v.toFixed(2);}
// PASARELA DE PAGO — CULQI (LIVE — los cargos son reales)
// La llave pública SÍ puede estar en el cliente — no es secreta. La llave SECRETA vive
// solo en Supabase → Edge Functions → Secrets (CULQI_SECRET_KEY), nunca aquí.
var CULQI_PUBLIC_KEY='pk_live_q82LnGIDlmQ0bpUC';
// PAGO MANUAL — YAPE / PLIN
// El cliente transfiere por su cuenta desde su propia app — nosotros no procesamos el
// cobro. El pedido queda pendiente hasta que el operador confirme en el panel de admin
// que el dinero llegó (ver payWithManualMethod() y actAdminConfirmPayment en el servidor).
// Yape y Plin confirmados activos en este número (el mismo de WhatsApp).
var YAPE_PLIN_PHONE='930957640';
var YAPE_PLIN_NAME='SND//WCH';
// El TITULAR real de la cuenta, que es el nombre que Yape le muestra al cliente cuando
// escribe el número — no la marca. Sale de BIZ_NAME (el titular del RUC del negocio), no
// está inventado. Si Yape lo muestra de otra forma (solo nombre y una inicial, por
// ejemplo), corregir acá: el punto es que coincida con lo que el cliente ve en su pantalla.
var YAPE_PLIN_HOLDER=BIZ_NAME;
// Ventana real antes de que el cron cancele solo un pedido Yape/Plin sin confirmar —
// DEBE coincidir con STALE_MANUAL_PAYMENT_HOURS en supabase/functions/api/env.ts. Se usa
// para mostrarle al cliente un plazo real (no inventado) en la pantalla de confirmación.
var STALE_MANUAL_PAYMENT_HOURS_CLIENT=3;
// Deep link a la app de Yape — nunca autocompleta destinatario/monto (Yape no expone
// esa API a terceros sin ser comercio afiliado con QR emitido por el banco); solo
// intenta ABRIR la app para ahorrar el cambio manual de apps. Si Yape no está
// instalado, Android cae solo al Play Store (via S.browser_fallback_url del intent)
// e iOS simplemente no navega — ningún caso rompe nada, las instrucciones manuales
// de abajo siguen siendo la vía real independientemente de si esto abre algo o no.
// Package/App Store id verificados contra las fichas oficiales de Yape (no inventados).
var YAPE_ANDROID_PKG='com.bcp.innovacxion.yapeapp';
function isMobileUA(){return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'');}
function yapeAppOpenUrl(){
  var ua=navigator.userAgent||'';
  if(/Android/i.test(ua))return'intent://#Intent;package='+YAPE_ANDROID_PKG+';scheme=yape;S.browser_fallback_url='+encodeURIComponent('https://play.google.com/store/apps/details?id='+YAPE_ANDROID_PKG)+';end';
  if(/iPhone|iPad|iPod/i.test(ua))return'yape://';
  return null;
}
function openYapeApp(){var u=yapeAppOpenUrl();if(u)window.location.href=u;}
var showYapeQR=false;
function toggleYapeQR(){showYapeQR=!showYapeQR;confirmRerender();}
// Captura del comprobante de transferencia — puramente opcional, nunca reemplaza la
// confirmación manual real que hace el admin (ver actAdminConfirmPayment en el servidor).
// null = sin subir todavía, 'uploading', 'done', o 'error:<mensaje>'.
var receiptUploadState=null;
// Llave pública VAPID para notificaciones push — DEBE ser el mismo par que
// VAPID_PRIVATE_KEY en el servidor (api/index.ts). La pública no es secreta.
var VAPID_PUBLIC_KEY='BKTQjrOAOBVbt-wG_vUol13SrlwS0FrWppXxgu0velMopQOsIzxHF0hu3BDMSItRVHlan23RQZA6dF3wpbU1rA0';
// "CONTINUAR CON GOOGLE" — Google Identity Services
// El Client ID NO es secreto (viaja al cliente por diseño, igual que CULQI_PUBLIC_KEY) —
// pero es un dato real de la Google Cloud Console del negocio, que hoy no existe, así que
// esto sigue el mismo criterio que CULQI_PUBLIC_KEY/REEMPLAZA: mientras no se reemplace,
// el botón de Google queda deshabilitado y el registro/login por teléfono+PIN de siempre
// sigue funcionando igual (ver googleConfigured() y sPAuth()).
var GOOGLE_CLIENT_ID='REEMPLAZA_CON_TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
function googleConfigured(){return GOOGLE_CLIENT_ID&&GOOGLE_CLIENT_ID.indexOf('REEMPLAZA')<0;}
var CHARGE_FN_URL=SB_URL+'/functions/v1/create-charge';
var CREDIT_CHARGE_FN_URL=SB_URL+'/functions/v1/create-credit-charge';

// `label` separado de la clave (hallazgo de auditoría de arquitectura): la clave
// (RECIBIDO/PREPARANDO/...) es el identificador interno — se guarda en orders.status, se
// compara con === en toda la app, dispara la lógica de crons — y hasta esta sesión
// también era lo único que se imprimía al usuario (stBadge/DBAR/bulkBar mostraban la
// clave cruda en ALL-CAPS, la única esquina que el recaseo de esta sesión no había
// podido tocar sin arriesgar romper esas comparaciones). Ahora `label` es puramente
// texto para mostrar — cambiarlo no afecta nada guardado ni comparado.
var STATUSES={
  'RECIBIDO':  {c:'#ffa500',next:'PREPARANDO', icon:'reclamo',label:'Recibido'},
  'PREPARANDO':{c:'#3A86FF',next:'EN CAMINO',  icon:'',       label:'Preparando'},
  'EN CAMINO': {c:'#9b6fff',next:'ENTREGADO',  icon:'moto',   label:'En camino'},
  'ENTREGADO': {c:'#25D366',next:null,          icon:'check', label:'Entregado'},
  'CANCELADO': {c:'#A5A5A5',next:null,          icon:'close', label:'Cancelado'}
};
var STEPS=['RECIBIDO','PREPARANDO','EN CAMINO','ENTREGADO'];

// B02 (HERBS//CHEESE, "Masa con orégano y parmesano") retirado por decisión del dueño —
// solo lo usaba SIG02 (hoy "The Marinara", antes "The Meatball", movido a B01) y
// CLASSIC//WHITE/FOCACCIA//ARTESANAL
// concentran mejor la variedad real de pan mostrada en el menú. Posible reincorporación
// futura — si vuelve, es solo restaurar esta entrada + volver SIG02.base a 'B02' (mismo
// cambio en SIG_DATA de catalog.ts) y agregar "B02" de vuelta a VALID_BASES ahí también.
var BASES=[
  {id:'B01',l:'Classic',s:'White',   d:'Masa suave básica'},
  {id:'B03',l:'Focaccia',s:'Artesanal',d:'Masa de focaccia artesanal'}
];
// `sigOnly` se declara en el tipo aunque HOY ningún ítem lo use (se fue con THE CHICAGO,
// ver abajo). Sin la declaración TypeScript infiere el tipo desde los literales y los
// filtros `!x.sigOnly` de sOBuild/sAdminSecretSignature dejan de compilar — o sea que
// borrar el último ingrediente exclusivo borraría también el mecanismo. Es el tipo el que
// lo mantiene vivo, sin necesidad de inventar un dato falso en el array.
// `pDbl` es el recargo de doble proteína en 15CM y `pDbl30` el de 30CM. Antes había UN
// solo `pDbl` plano para los dos tamaños, y eso cobraba mal: la porción que agrega el
// doble escala con el tamaño (85 g en 15CM, 170 g en 30CM) pero el recargo no. Con los
// costos reales YA CON MERMA del recetario (2026-08-22), el doble en 30CM costaba más de
// lo que cobraba en 3 de 4 proteínas: res S/6.30 de insumo por S/6 cobrados (105%),
// embutido S/8.59 por S/9 (95%), pollo S/4.95 por S/6 (83%). Es el mismo defecto que ya
// había obligado a apagar el doble de atún (`noDouble` abajo), solo que ahí se apagó el
// producto en vez de corregir la estructura.
// Los valores nuevos suben SOLO donde el costo pasaba el techo de 45%; donde ya estaba
// sano no se toca (P06 15CM sigue en 6, que es 22% de costo — el 45% es un techo, no una
// meta a la que haya que subir). DEBEN coincidir con PROT_PRICE en catalog.ts.
var PROTS:{id:string;l:string;s:string;d:string;p15:number;p30:number;pDbl:number;pDbl30:number;vaultOnly?:boolean;sigOnly?:boolean;noDouble?:boolean}[]=[
  // l/s invertidos (antes 'Asado // Res') — rompía la convención genérico+estilo que
  // siguen el resto de proteínas (Pollo/Cajún, Atún/House, Albóndiga/Marinara): "Res" es
  // el ingrediente genérico (mismo rol que Pollo/Atún/Embutido), "Asado" es la
  // preparación/estilo (mismo rol que Cajún/House/Italiano) — hallazgo de auditoría de
  // copy. DEBE coincidir con PROT_LABEL.P01 en supabase/functions/api/catalog.ts.
  {id:'P01',l:'Res',  s:'Asado',        d:'Res asada mechada, cocción lenta',p15:14.9,p30:22.9,pDbl:7,pDbl30:14},
  {id:'P02',l:'Pollo',  s:'Teriyaki',   d:'Tiras marinadas en teriyaki',p15:13.9,p30:21.9,pDbl:6,pDbl30:11},
  // vaultOnly: exclusiva del menú secreto (SIG05, menú secreto) — no seleccionable en BUILD
  // YOUR OWN (ver el filtro en sOBuild) aunque siga en este array para que sigPrice/
  // dblProtRef/etc. la encuentren por id igual que cualquier otra proteína.
  {id:'P03',l:'Pollo',  s:'Cajun',      d:'Pechuga deshilachada, condimento cajún',p15:13.9,p30:21.9,pDbl:6,pDbl30:11,vaultOnly:true},
  // p15/p30 subidos de 14/25 a 16/30 (análisis financiero de esta sesión) — con el mismo
  // costo real por kilo que P05 (~S/38/kg), el atún BYO rentaba solo 46.4%/44.0% contra
  // el objetivo del negocio (~55% margen / 45% costo), mientras P05 con costo idéntico ya
  // rentaba 53.1%/53.3% a este mismo precio. THE FRESH (SIG04) no se toca — su precio vive
  // aparte en SIG_DATA/SIGS y ya rentaba sano (55.3%/49.6%), el problema era solo la
  // proteína suelta en BUILD YOUR OWN. DEBE coincidir con PROT_PRICE.P04 en catalog.ts.
  // noDouble: el atún es la ÚNICA proteína sin opción de doble (decisión del dueño
  // 2026-08-21). El recargo pDbl es plano pero la porción que agrega escala con el tamaño:
  // en 30CM se cobraban S/9 por 170g de atún que cuestan S/11.39 — pérdida real de S/2.39
  // por unidad, la única operación del catálogo con margen negativo. `pDbl` se deja en 9
  // a propósito para no romper la paridad con PROT_PRICE.P04 del servidor; lo que apaga la
  // opción es esta bandera, respetada por dblProtRef() en el cliente y por NO_DOUBLE_PROTS
  // en supabase/functions/api/catalog.ts.
  {id:'P04',l:'Atún',   s:'House',      d:'Atún premium con mayonesa clásica',p15:16.9,p30:30.9,pDbl:10.9,pDbl30:21.9,noDouble:true},
  // p30 subido de 26 a 30 — mismo motivo que P04: el embutido premium cuesta casi el
  // doble por kilo que pollo/res — DEBE coincidir con PROT_PRICE.P05 en catalog.ts.
  // "THE ITALIAN" rompía la convención de nombre genérico + estilo del resto de
  // proteínas BYO (POLLO/CAJUN, ATÚN/HOUSE, ALBÓNDIGA/MARINARA) — hallazgo de auditoría
  // de marca. Ahora EMBUTIDO/ITALIANO sigue el mismo patrón.
  {id:'P05',l:'Embutido',s:'Italiano',   d:'Paté peperoncino, jamón ahumado, cabanossi',p15:16.9,p30:30.9,pDbl:9.9,pDbl30:19.9},
  // pDbl bajado de 7 a 6 — carne molida (~S/10/kg) es el insumo más barato del catálogo,
  // no tenía sentido que su doble proteína costara más que la de res/pollo (P01/P02,
  // pDbl:6, insumos 2-4x más caros por kilo). DEBE coincidir con PROT_PRICE.P06 en catalog.ts.
  // l corregido de 'Meatball' a 'Albóndiga' — único nombre en inglés entre las 6
  // proteínas, rompía la convención 100% en español del resto (Res/Pollo/Pollo/Atún/
  // Embutido) y ni coincidía con su propia descripción ("Albóndigas caseras..."). id
  // NO cambia (solo el label) — DEBE coincidir con PROT_LABEL.P06 en catalog.ts.
  {id:'P06',l:'Albóndiga',s:'Marinara',  d:'Albóndigas caseras en salsa marinara',p15:14.9,p30:24.9,pDbl:6,pDbl30:6}
  // P07 (RES // CHICAGO, corte laminado) se retiró junto con THE CHICAGO (SIG07) el
  // 2026-08-22 — era su proteína exclusiva y sin ese Signature no tenía consumidor. Ver
  // el comentario completo del retiro en SIGS más abajo. Si SIG07 vuelve, hay que
  // restaurar la entrada P07 — label "Res" / "Chicago", descripción "Corte fino laminado,
  // sazón italiana, estilo Chicago", p15 14.9, p30 22.9, pDbl 6, sigOnly — más
  // PROT_PRICE.P07/PROT_LABEL.P07/SIG_ONLY_PROTS en catalog.ts. (Se describe en prosa a
  // propósito: scripts/parity.mjs parsea este array con regex y tomaría un literal
  // comentado como si fuera una proteína viva, reportando una falsa diferencia con el
  // servidor.)
];
// vaultOnly (T04): seleccionable en ARMA EL TUYO pese a solo aparecer en la receta del
// menú secreto — confirmado por el dueño para tratarlo como exclusivo. No se puede pedir
// por BUILD YOUR OWN aunque siga en este array (SIG_DATA/priceSigBuild lo sigue
// necesitando para tasar ese Signature) — filtro real en byoTops() más abajo. DEBE
// coincidir con VAULT_ONLY_TOPS en catalog.ts.
// T07 (Giardiniera) se retiró con THE CHICAGO (SIG07) el 2026-08-22 — era su topping
// exclusivo y, además, el ÚNICO topping del catálogo que había que producir en casa
// (salmuera de 24-48 h + 3 días de reposo). Si SIG07 vuelve, restaurar la entrada T07 —
// "Giardiniera" / "Encurtido picante", spicy, sigOnly — más T07 en VALID_TOPS/TOP_LABEL/
// SIG_ONLY_TOPS en catalog.ts.
var TOPS:{id:string;l:string;s:string;vaultOnly?:boolean;sigOnly?:boolean;spicy?:boolean}[]=[
  {id:'T01',l:'Tomate',   s:'Fresco'},
  {id:'T02',l:'Pepinillo',s:'Encurtido'},
  {id:'T03',l:'Cebolla',  s:'Morada juliana'},
  {id:'T04',l:'Jalapeño', s:'Encurtido',vaultOnly:true},
  {id:'T05',l:'Aceituna', s:'Negra en rodajas'},
  {id:'T06',l:'Pimiento', s:'Curado'},
  // Nueva 2026-08-08 (decisión del dueño, LLM Council de menú) — reemplaza a Pimiento en
  // SIG04 (ver SIGS.SIG04 abajo): el pimiento curado es tierno, no aporta crocancia real,
  // y esa receta quedó con un solo elemento crocante (Pepinillo). Apio picado es el
  // ingrediente clásico de ensalada de atún para esto exacto — sin proveedor nuevo.
  // Disponible también en BUILD YOUR OWN (no hay razón para restringirlo). DEBE coincidir
  // con VALID_TOPS en supabase/functions/api/catalog.ts.
  {id:'T08',l:'Apio',     s:'Picado'}
];
// C01 renombrado de Americano a Mozzarella 2026-08-08 (decisión del dueño, LLM Council de
// menú) — precio real investigado (Braedt ~S/22.50/kg) similar o menor al proxy genérico
// de queso ya usado en el análisis financiero, y con mejor derretido que el Americano
// procesado que reemplaza — id NO cambia, DEBE coincidir con VALID_CHEESE en catalog.ts.
var CHEESE=[
  {id:'C01',l:'Mozzarella',s:'',d:'Derrite fácil, sabor suave'},
  {id:'C02',l:'Cheddar',  s:'',d:'Sabor intenso y textura firme'},
  {id:'C03',l:'Edam',     s:''}
];
// `spicy` marca las únicas 2 salsas cuya propia descripción ya declara picor ("calor
// progresivo"/"golpe de picor") — no es una clasificación nueva inventada, solo expone
// visualmente un dato que ya estaba en `d`. Usado por el paso 05 de BUILD YOUR OWN para
// darle jerarquía visual a la única lista plana de 13 ítems sin agrupar/iconos del flujo
// (hallazgo de auditoría UX).
var SAUCES:{id:string;l:string;s:string;d:string;spicy?:boolean;vaultOnly?:boolean;sigOnly?:boolean}[]=[
  {id:'S01',l:'Aioli',   s:'Signature',d:'Ajo, limón, suave'},
  // vaultOnly: exclusiva del menú secreto (SIG05, junto con S12) — mismo criterio que sigOnly
  // en S13, solo que anclado al menú secreto en vez de a un signature público. Confirmado
  // por el dueño para tratarla igual que Au Jus.
  {id:'S02',l:'Spicy',   s:'Mayo',     d:'Cremoso, calor progresivo',spicy:true,vaultOnly:true},
  {id:'S03',l:'Smoke',   s:'BBQ',      d:'Ahumado, miel, pimentón'},
  {id:'S04',l:'Honey',   s:'Mustard',  d:'Dulce, mostaza suave'},
  // Perfil documentado 2026-08-08 (confirmado por el dueño, LLM Council de menú) — hasta
  // ahora era la única de las 12 salsas sin descripción de sabor, lo que bloqueaba evaluar
  // si era redundante con otras o cómo combinaba en SIG06. Es salada/umami, NO dulce —
  // dato relevante: SIG06 (Teriyaki+Satay+SNDWCH) tiene 2 fuentes dulces, no 3, porque
  // esta salsa aporta un contrapunto salado, no otro dulzor apilado.
  {id:'S05',l:'SNDWCH',  s:'Special',  d:'Salada, con carácter umami. Receta exclusiva de la casa.'},
  {id:'S06',l:'Oil & Vinegar',s:'Classic', d:'Aceite de oliva y vinagre, estilo italiano'},
  {id:'S08',l:'Teriyaki',s:'Glaze',    d:'Dulce, soja, jengibre'},
  // S09 vuelve (decisión del dueño 2026-08-21) tras haberse retirado el mismo día junto
  // con The Ember (SIG08), su único consumidor. Vuelve CAMBIADA: ahora lleva ají y es
  // picante. Eso tapa el hueco más grave que encontró el council de salsas — S02 y S12,
  // las 2 únicas picantes, son exclusivas del menú secreto, así que ARMA EL TUYO no tenía
  // ninguna opción picante para el público general. En un negocio de comida en Perú, eso
  // se lee como carta incompleta, no como menú secreto. DEBE coincidir con SAUCE_LABEL.S09
  // y VALID_SAUCES en supabase/functions/api/catalog.ts.
  {id:'S09',l:'Chimichurri',s:'Piña y Ají',d:'Piña asada y ají, dulce-ahumado con picor',spicy:true},
  // Subtítulo cambiado de ARGENTINO a PIÑA ASADA — ya no es el chimichurri clásico solo
  // (ajo, perejil, ácido), se le agrega piña asada por decisión del dueño (dulce-ahumado
  // que corta el ácido/herbal). DEBE coincidir con cualquier copia espejo del lado
  // servidor si alguna vez se agrega (hoy las salsas no tienen label server-side).
  {id:'S10',l:'Peanut',  s:'Satay',    d:'Maní, soya, jengibre'},
  // Descripción reescrita 2026-08-08 (decisión del dueño, LLM Council de menú) — con S04
  // (Honey Mustard) en el mismo catálogo, "intensa, con carácter" no diferenciaba en qué
  // eje difieren las dos mostazas. Dijon es ácida y filosa, SIN dulzor — S04 es lo
  // opuesto (dulce, suave). Mismo ingrediente base, roles opuestos, ambas se quedan.
  // Ojo: evitar la palabra "picante" acá — no es exacta para Dijon (es acidez/pungencia,
  // no calor) y además rompe tests/menu-exclusivity-toppings-sauces.spec.ts, que usa esa
  // palabra como proxy para verificar que ninguna salsa picante-de-verdad (vaultOnly)
  // aparezca en BUILD YOUR OWN.
  {id:'S11',l:'Mostaza', s:'Dijon',    d:'Ácida y filosa, sin dulzor'},
  {id:'S12',l:'Picante', s:'Miel',     d:'Dulce con golpe de picor',spicy:true,vaultOnly:true}
  // S13 (Au Jus) se retiró con THE CHICAGO (SIG07) el 2026-08-22 — era su salsa exclusiva
  // y salía de la cocción de P07, que también se fue. Sin ese Signature no hay de dónde
  // sacarla ni dónde servirla. Si SIG07 vuelve, restaurar la entrada S13 — "Au Jus" /
  // "Para mojar", descripción "Caldo de la cocción de la carne, servido aparte para mojar
  // cada bocado", sigOnly — más S13 en VALID_SAUCES/SAUCE_LABEL/SIG_ONLY_SAUCES en
  // catalog.ts.
];
var SIGS:any[]=[
  // PRECIOS +S/2 en los 5 Signatures del menú de apertura (decisión del dueño,
  // 2026-08-22, en AMBOS tamaños para no alterar la diferencia p30-p15 de la que depende
  // R03). Se subió DESPUÉS de recostear todo el menú con la merma de cocción real del
  // recetario: los cinco ya cumplían el techo de 45% de insumos y esta subida es para
  // ganar margen, no para tapar un hueco. DEBEN coincidir con SIG_DATA en catalog.ts y
  // con la tabla catalog_prices, que es la que de verdad cobra.
  // Precio de curaduría (2026-08-08, decisión del dueño tras auditoría financiera/LLM
  // Council): SIG01/02/03/06 p30 y SIG04 p15+p30 estaban EXACTAMENTE igualados al precio
  // de armar la misma proteína+tamaño por BUILD YOUR OWN (ver itemUnitPrice — BYO cobra
  // directo prot.p15/p30, sin sumar nada por curaduría) — 0 premio de precio por la
  // curaduría en 5 de 7 Signatures. +S/2 en esos puntos exactos de paridad (nunca donde ya
  // había premio, ej. SIG01 p15=18 vs BYO P01 p15=14 se deja igual). DEBE coincidir con
  // SIG_DATA en supabase/functions/api/catalog.ts.
  // Badge corregido esta sesión (hallazgo de auditoría de producción/marketing): PREMIUM
  // estaba en el signature más barato de los tres comparables (18/22) mientras el más
  // caro (SIG03, 21/26) llevaba MÁS PEDIDO — posicionamiento invertido frente al precio
  // real. THE ORIGINAL pasa a CLÁSICO (encaja mejor: el asado mechado de siempre).
  // recommended:true en vez de asumir "el primero del array" para el badge Recomendado
  // del home — antes se calculaba por posición (i===0), frágil si SIGS se reordena de
  // nuevo (ya pasó una vez esta sesión, al mover el badge chef) — hallazgo de auditoría
  // de copy/estructura, BAJO. Pitch reescrito para referenciar su propio badge (Clásico:
  // el primero del catálogo, el punto de partida) en vez de una descripción genérica que
  // cualquier otro Signature también podría reclamar (hallazgo de auditoría de copy).
  {id:'SIG01',n:'The Original',s:'Signature',badge:'Clásico',recommended:true,base:'B01',prot:'P01',tops:['T01','T02','T03'],sauces:['S01','S04'],p15:20.9,p30:26.9,
    pitch:'El primero de la carta y el que manda la receta: res mechada jugosa de cocción lenta, con el equilibrio justo entre fresco y dulce. Empieza por acá.'},
  // RANCH (antes S07) ya no existe en el catálogo (retirada por decisión del dueño) —
  // esta receta ya venía sin ella (no encajaba con el encuadre 100% italiano del pitch,
  // quedaba fuera de lugar sobre albóndigas en marinara). Queda con una sola salsa, tal
  // como pide el pitch.
  // Badge cambiado de PREMIUM a ITALIANO (auditoría de naming por sabor 2026-08-07):
  // "Premium" prometía una experiencia elevada que la proteína real no entrega (carne
  // molida, el insumo más barato del catálogo por kilo) y contradecía el propio pitch
  // ("el clásico de toda la vida"). ITALIANO describe el estilo real (marinara +
  // vinagreta al estilo italiano) sin implicar sobreprecio — mismo patrón descriptivo que
  // ya usa AHUMADO (SIG03). Explícitamente NO se usa
  // "Casero"/"Tradicional" ni ningún sinónimo (decisión del dueño: la marca se posiciona
  // como compañía consolidada, no como negocio local/casero).
  // Queso corregido de OPCIONAL a FIJO 2026-08-08 (decisión del dueño, LLM Council de
  // menú — investigación real de comparables exitosos confirmó que el queso derretido es
  // estructural en esta categoría de sándwich, no un extra: "melted mozzarella is what
  // makes a Meatball Sub"). fixedCheese:'C01' (Mozzarella) va siempre en la receta, sin
  // depender de que el cliente lo pida — DEBE coincidir con SIG_DATA.SIG02 en catalog.ts.
  // Sin cambio de precio (costo real ~S/0.39-0.77/unidad, el dueño confirmó no subirlo).
  // base movida de B02 (retirado, ver BASES arriba) a B01 — un roll blanco simple es de
  // hecho más auténtico para un meatball sub que uno con hierbas.
  // chef:true (FAVORITO DEL CHEF) retirado esta sesión (auditoría de menú/copy) — se
  // había movido acá desde SIG03 por tener mejor margen real (P06, carne molida, cuesta
  // ~3.8x menos por kilo que P05 sin bajar de precio proporcionalmente), pero el badge
  // implica un juicio de sabor genuino de una persona real, y el propio código admitía
  // que la razón era margen, no gusto — mismo riesgo que ya motivó retirar MÁS PEDIDO/
  // EDICIÓN LIMITADA (afirmar algo que no existe). El negocio tampoco tiene un rol de
  // "chef" — el dueño arma los pedidos él mismo. P06 sigue siendo el de mejor margen real
  // del catálogo (no se le baja el precio), solo ya no se lo comunica con esta etiqueta.
  // Nombre cambiado de "The Meatball" a "The Marinara" 2026-08-08 (decisión del dueño, LLM
  // Council de naming/sabor) — "The Meatball" (inglés) repetía el mismo ingrediente que la
  // proteína interna ya muestra en español ("Albóndiga", ver PROTS.P06 arriba), bilingüismo
  // visible en la misma tarjeta (título vs. desglose de ingredientes). "Marinara" es un
  // préstamo que se usa igual en español e inglés — evita la traducción duplicada y sigue
  // encajando con el badge "Italiano". DEBE coincidir con SIG_LABEL.SIG02 en catalog.ts.
  {id:'SIG02',n:'The Marinara',s:'Signature',badge:'Italiano',   base:'B01',prot:'P06',tops:['T01','T03','T05'],sauces:['S06'],p15:21.9,p30:28.9,fixedCheese:'C01',
    pitch:'Albóndigas caseras bañadas en marinara, con mozzarella derretida hasta el borde y aceituna negra sobre una vinagreta al estilo italiano. El clásico de toda la vida, hecho como se debe: con queso de verdad.'},
  // Se retiró TERIYAKI (S08, perfil asiático) — no encajaba con "fiambres italianos
  // ahumados"; esa salsa ya tiene su propio signature (SIG06). Queda con SMOKE/BBQ solo,
  // que ya describe por sí sola el "glaseado dulce-ahumado" del pitch.
  // p30 subido de 26 a 30 (mismo motivo que P05 arriba) — mantiene el criterio de premio
  // S/0 a 30CM frente a armarlo en BUILD YOUR OWN.
  // Badge corregido esta sesión (hallazgo de auditoría financiera/legal): MÁS PEDIDO
  // afirmaba un dato de ventas real que no existe — el negocio aún no ha abierto, no hay
  // ningún pedido real que respalde "el más pedido" (riesgo de publicidad engañosa).
  // AHUMADO es puramente descriptivo del propio producto (coincide con el nombre THE
  // SMOKE), no una afirmación verificable sobre el comportamiento de otros clientes.
  // Queso FIJO agregado 2026-08-08 (mismo criterio y misma sesión que SIG02) —
  // fixedCheese:'C02' (Cheddar): comparable exitoso investigado (Firehouse "Smokehouse
  // Beef & Cheddar Brisket") combina ahumado+BBQ+cheddar derretido como estándar de la
  // categoría — DEBE coincidir con SIG_DATA.SIG03 en catalog.ts. Sin cambio de precio.
  {id:'SIG03',n:'The Smoke',   s:'Signature',badge:'Ahumado',base:'B03',prot:'P05',tops:['T03','T02','T01'],sauces:['S03'],p15:23.9,p30:34.9,fixedCheese:'C02',
    pitch:'Fiambres italianos ahumados y cheddar derretido sobre focaccia artesanal, con un glaseado dulce-ahumado que se queda contigo. Nuestro build más premium, bocado a bocado.'},
  // p30 subido de 25 a 30 — se nos escapó actualizar este Signature cuando P04 (atún)
  // subió su p30 de 25 a 30; hasta ahora THE FRESH vendía S/5 más barato que armar
  // exactamente la misma receta por BUILD YOUR OWN (hallazgo de auditoría, CRÍTICO).
  // Ahora sí iguala el criterio de premio S/0 a 30CM que ya tienen los demás Signatures.
  // Badge cambiado de LIGERO a CÍTRICO (auditoría de naming por sabor 2026-08-07):
  // "Ligero" choca con la proteína real (atún CON MAYONESA + Aioli, otra base cremosa) —
  // evidencia real de "health halo" muestra que una etiqueta tipo "light" puede bajar la
  // percepción de sabor cuando el bocado real resulta cremoso, no solo ser inexacta.
  // Receta y pitch corregidos otra vez 2026-08-08 (decisión del dueño, LLM Council de
  // naming/sabor 2026-08-08): el consejo señaló, con 5/5 asesores y 5/5 rondas de
  // revisión por pares, que el fix de arriba corrigió el badge pero dejó intactos el
  // nombre del producto y el pitch — "Ligero" seguía escrito en el pitch, prometiendo algo
  // que el bocado real (dos bases cremosas: mayonesa de P04 + Aioli) no entregaba. En vez
  // de renombrar el producto, el dueño eligió arreglar la receta: se quita el Aioli
  // (duplicaba la mayonesa que P04 ya trae) y se agrega un chorrito de limón real —
  // CÍTRICO ahora se sostiene con un ingrediente directo, no heredado del Aioli. El limón
  // es un ingrediente de preparación (se exprime al armar el sándwich), no una salsa
  // seleccionable — no tiene entrada propia en SAUCES/catalog.ts, solo vive en este pitch
  // (confirmado con el dueño 2026-08-08, no asumir de nuevo que necesita ser una entidad
  // de catálogo). "Ligero" se retira del pitch (no es honesto con una base de mayonesa,
  // sea una o dos).
  // Pimiento (T06) reemplazado por Apio (T08) 2026-08-08 (decisión del dueño, LLM Council
  // de menú) — el pimiento curado es tierno, no aporta crocancia real, dejando esta receta
  // con un solo elemento crocante (Pepinillo) y riesgo real de fatiga de paladar (5/5
  // asesores lo confirmaron). Apio picado es el ingrediente clásico de ensalada de atún
  // para esto exacto. Pendiente sin resolver todavía: la receta sigue sin ningún elemento
  // dulce (Dijon+limón apilan ácido) — el dueño solo confirmó el fix de crocancia, no el
  // de dulzor, no inventar una solución sin pedido explícito.
  {id:'SIG04',n:'The Fresh',   s:'Signature',badge:'Cítrico',    base:'B01',prot:'P04',tops:['T01','T02','T08'],sauces:['S11'],p15:20.9,p30:34.9,
    pitch:'Atún premium con mayonesa clásica, con el crocante fresco del apio y un chorrito de limón que corta la cremosidad, y el carácter justo de la mostaza dijon. Fresco en cada bocado — ideal para cualquier hora del día.'},
  // badge:'Asiático' es el permanente (mismo rol que Clásico/Premium/Ahumado/Ligero en el
  // resto) — 'Nuevo' se muestra solo mientras newUntil no haya pasado, vía sigBadge()
  // abajo. Antes 'Nuevo' era un string fijo sin ningún mecanismo de expiración, se habría
  // quedado ahí para siempre. newUntil se ancla a la fecha estimada de lanzamiento del
  // negocio (~septiembre 2026, ver "Contexto de negocio" en CLAUDE.md) + ~60 días de
  // ventana — AJUSTAR a la fecha real de apertura en cuanto se confirme, esto es un
  // placeholder documentado, no un dato certero (hallazgo de auditoría de copy, BAJO).
  // Pepinillo (T02) quitado 2026-08-08 (decisión explícita del dueño) — el consejo de
  // menú había señalado que el pepinillo mitigaba sin querer el riesgo de "doble dulce"
  // (teriyaki+satay, dos salsas dulces sin nada ácido) documentado por fuentes de chef;
  // el dueño pidió quitarlo igual. Queda Tomate+Pimiento. El riesgo de doble dulce ya NO
  // tiene ningún elemento ácido que lo corte — sin resolver, documentado a propósito
  // (no se agregó ningún reemplazo sin que el dueño lo pidiera). DEBE coincidir con
  // SIG_DATA.SIG06 en catalog.ts si esa entrada llega a declarar tops explícitos.
  // Naming ("The Teriyaki" sin salsa Teriyaki Glaze/S08) revisado 2026-08-08 — un council
  // posterior señaló que el nombre no coincide con ninguna salsa de la receta (usa S10
  // Peanut Satay + S05 SNDWCH Special). El dueño decidió NO reactivar S08 (agregarla
  // habría sumado una tercera fuente dulce — "dulce, soja, jengibre" — al doble dulce ya
  // documentado arriba). El nombre queda igual sin cambiar la receta: "Teriyaki" describe
  // la proteína (Pollo//Teriyaki, P02, marinado real), no una salsa — el pitch ya lo deja
  // claro liderando con "Pollo teriyaki caramelizado", no promete una salsa que no está.
  // Además, con S05 ya documentado como salado/umami (no dulce, ver SAUCES arriba), esta
  // receta tiene 2 fuentes dulces reales (proteína marinada + satay), no 3.
  {id:'SIG06',n:'The Teriyaki',s:'Signature',badge:'Asiático',newUntil:'2026-10-31', base:'B01',prot:'P02',tops:['T01','T06'],sauces:['S10','S05'],p15:19.9,p30:25.9,
    pitch:'Pollo teriyaki caramelizado con salsa satay de maní y nuestra salsa de la casa — dulce, tostado, con la firma SND//WCH en cada bocado. El sabor asiático que le faltaba al menú.'},
  // Pitch corregido: usa la misma masa clásica que THE ORIGINAL (B01), no un "pan
  // italiano" aparte — es justo el pan correcto/auténtico para este plato (un roll
  // clásico, no focaccia), pero el texto anterior prometía algo que no era (hallazgo de
  // auditoría de producción).
  // THE CHICAGO (SIG07) se retiró del catálogo de apertura el 2026-08-22 (decisión del
  // dueño). NO es un problema de producto — su naming por procedencia real era el mejor
  // resuelto del catálogo y es el único plato que nadie más vende en Trujillo. Es puro
  // costo de producción para una persona sola cocinando en casa, según el recetario que
  // se escribió el mismo día (ver RECETARIO.md): 3 días de calendario (marinar → asar →
  // enfriar toda la noche EN el jus → laminar), su propio corte a S/28-34/kg en tanda
  // separada que nunca se puede mezclar con el mechado de P01, un margen de cocción de
  // pocos grados (52-55°C, el único ítem donde equivocarse 5°C arruina la tanda), un
  // laminado fino que a cuchillo llega a 1.5-2.5 mm cuando la técnica pide 0.5-1 mm de
  // rebanadora, la giardiniera como ÚNICO topping de producción propia (5 días de
  // anticipación), y el au jus en envase aparte con riesgo real de derrame en moto.
  // Con él salen sus tres ingredientes exclusivos: P07, T07 y S13 (ver arriba).
  // Vuelve cuando haya rodaje y ojalá una rebanadora. Para restaurarlo: reponer las 3
  // entradas de arriba, esta entrada, SIG_IMG.SIG07, SIG07 en RESERVE_SIGS y en
  // SIG_HOME_ORDER, y del lado servidor SIG_DATA.SIG07/SIG_LABEL.SIG07/RESERVE_SIGS.
  // Variante de temporada de apertura (aprobada 2026-08-07, investigación de menú §10.8/
  // §11.4): S08 (Teriyaki Glaze) y S09 (Chimichurri Piña Asada) eran las únicas 2 salsas
  // del catálogo sin ninguna receta fija detrás. Reutiliza la proteína más preparada del
  // negocio (P01, la de THE ORIGINAL) — cero fricción de producción, cero SKU nuevo.
  // `availableUntil` (distinto de `newUntil`, que solo cambia el badge a "Nuevo" pero
  // nunca oculta el ítem — verificado en sigBadge() antes de reusarlo, habría sido el
  // mismo error de "EDICIÓN LIMITADA sin mecanismo real" que ya se retiró antes) hace que
  // Menú secreto — nunca aparece para invitados ni para quien no llegó al rango que pide
  // minOrders (ver sOSig). Bajado 15 → 5 → 3 pedidos (decisiones de negocio; el paso a 3 es
  // del 2026-08-26). Este literal es solo la SEMILLA: el valor real vive en la columna
  // `min_orders` de la tabla `secret_signature` y se edita desde Admin // Menú secreto sin
  // tocar código. Cambiar solo acá no cambia nada, igual que con `catalog_prices`.
  // OJO: el umbral ya NO coincide con ningún rango de RANKS (INICIADO sigue en 5). Por eso
  // ni la tarjeta bloqueada ni la celebración post-pedido derivan su texto de rankName() —
  // hablan de pedidos, que es lo que el mecanismo realmente mide. Ver sOSig y _lSecretUnlock.
  // DEBE coincidir con SIG_GATES.SIG05 en supabase/functions/api/catalog.ts — el servidor es
  // quien de verdad rechaza el pedido si no calificas, esto solo evita mostrarlo/dejarlo
  // elegir en la UI antes de intentarlo.
  // Pitch sin ingredientes explícitos (pedido del dueño) — el sándwich secreto lo es de
  // verdad, no solo de nombre: ni el pitch ni la vista previa deben decir qué lleva. Se
  // revela recién cuando lo pides. Ver ingredientsLine en sOSig() y
  // sigPreviewOverlayHTML(), que ocultan el desglose de Pan/Proteína/Toppings/Salsas
  // específicamente para s.secret.
  // Rotación mensual (decisión del dueño, 2026-08-10 — reemplaza "The Vault" fijo, que
  // existió hasta esa fecha). n/base/prot/tops/sauces/p15/p30/minOrders de abajo son solo
  // el respaldo/semilla para el primer render antes de que loadCatalogBackground()
  // reciba la fila vigente de la tabla `secret_signature` (vía get-catalog); a partir de
  // ahí esos campos de este mismo objeto se sobreescriben en memoria, igual que ya pasa
  // con p15/p30 de cualquier Signature. No editar este literal para cambiar el sándwich
  // del mes — eso se hace desde Admin // Menú secreto.
  {id:'SIG05',n:'Menú secreto',s:'Reserve',  badge:'Secreto',   base:'B03',prot:'P03',tops:['T04','T06','T03'],sauces:['S02','S12'],p15:24.9,p30:30.9,
    secret:true,minOrders:3,
    pitch:'Solo para clientes iniciados. Una combinación que no está en ningún menú — te la ganaste a pedidos. No preguntes qué lleva. Pruébalo.'}
];
// Antes 4 Signatures (SIG02/03/04/06) llevaban el tag "BUILD" — la misma palabra exacta
// que el modo "BUILD YOUR OWN" en la pantalla de inicio, confundiendo a un cliente nuevo
// sobre si estaba viendo un sándwich curado por la casa o el armado libre (hallazgo de
// auditoría UX, CRÍTICO). Ahora todos los Signatures regulares usan "SIGNATURE" (solo
// el menú secreto y THE CHICAGO, los dos más exclusivos, usan "RESERVE"), y ambos tags se
// distinguen tipográficamente del resto del texto — cursiva y más grande, como una
// firma — para reforzar que son curados por la casa.
function sigTypeTag(tag){
  if(tag==='Signature'||tag==='Reserve')return'<i style="font-style:italic;font-size:.7em;color:var(--sw-text-muted,#A8C8B0)">'+tag+'</i>';
  return tag;
}
// Fotos reales de cada Signature build — reemplazan el placeholder ilustrado
// (emoji + paleta de marca) que se usaba antes de tener fotografía.
// Las fotos se re-recortaron a un mismo tamaño/aspect ratio (640x440) en una ronda de
// auditoría — antes iban de 900x620 a 438x500, con verticales en riesgo real de mal
// recorte por object-fit:cover en el banner horizontal (hallazgo de auditoría V3). SIG04
// (aceituna negra, ajena a su receta), SIG05 (ingredientes de banh mi vietnamita — zanahoria
// juliana/cilantro — sin relación con pollo cajún/spicy mayo/miel picante) y SIG06 (se veía
// un segundo plato de fondo) se re-sourcearon/recortaron también.
var SIG_IMG={SIG01:'img/sig01.jpg',SIG02:'img/sig02.jpg',SIG03:'img/sig03.jpg',SIG04:'img/sig04.jpg',SIG05:'img/sig05.jpg',SIG06:'img/sig06.jpg'};
// Fotos reales de cada proteína en BUILD YOUR OWN — igual que SIG_IMG arriba, solo se
// muestra la miniatura para los códigos que ya tengan un archivo real en img/. Las
// proteínas sin entrada aquí siguen mostrando la tarjeta sin foto (sin placeholder falso).
// P02 (mostraba arroz frito de fondo, ajeno al producto) y P05 (mostraba aceitunas verdes,
// P05 no las lleva) se re-sourcearon en la ronda de auditoría V3 — recortadas a 500x500
// como el resto del set.
var PROT_IMG={P01:'img/prot_p01.jpg',P02:'img/prot_p02.jpg',P04:'img/prot_p04.jpg',P05:'img/prot_p05.jpg',P06:'img/prot_p06.jpg'};
// Reestructurado esta sesión — ver el comentario espejo en REWARDS (catalog.ts) para el
// porqué completo. R01 se retiró (topping extra ya es gratis para todos, sin nada real
// que canjear). R02/R03/R05 quedan repreciadas contra el mismo "tipo de cambio" real que
// ya usaban R04/R06. Puntos de R03/R04/R05/R06 subidos ~1.8x después (costo real de
// insumo resultó ser ~45% del valor perdonado, no ~20-30% asumido) — DEBE coincidir con
// REWARDS en supabase/functions/api/catalog.ts.
// Orden ASCENDENTE por puntos real — antes R05 (220) quedaba después de R03 (270) y R04
// (320), lo que rompía dos cosas que asumen que el array ya viene ordenado: el "próxima
// recompensa" (RWDS.find busca el PRIMER match, no el más barato) y la barra de progreso
// en sPHome (el forEach de `prev` toma el último elemento visto que cumple pts<=pts, que
// solo es el máximo real si el array está ordenado) — hallazgo de auditoría financiera,
// verificado leyendo ambos usos antes de reordenar en vez de tocar esa lógica.
// R03 subido de 270 a 320 pts (auditoría de menú, ronda posterior) — a 270 pts entregaba
// solo 33.75 pts/sol, por debajo de la banda ~36-54 pts/sol del resto tras la
// recalibración de arriba — DEBE coincidir con REWARDS.R03 en catalog.ts.
// R02/R03 renombrados: n/s se muestran como "n // s" en toda la app (mismo corte que
// separa ingrediente/estilo en un Signature o proteína) — "4ta // Salsa" cortaba un
// ordinal de su sustantivo y "Sube a // 30CM" cortaba una frase verbal a la mitad,
// rompiendo la convención que sí siguen R04/R05/R06 (sustantivo // sustantivo) —
// hallazgo de auditoría de copy, BAJO. R03 DEBE coincidir con REWARDS.R03.label en
// catalog.ts.
// TASA ÚNICA: 20 PUNTOS POR CADA SOL QUE PERDONA LA RECOMPENSA.
// Los puntos se ganan 1 por sol gastado, así que 20 pts/sol = 5% de retorno para el
// cliente, igual en las cinco. R03 y R04 estaban en 40 y 53 pts/sol (2.5% y 1.9%), o sea
// que un cliente racional NUNCA las iba a canjear: por los mismos 320 puntos le convenía
// esperar a R06 y llevarse un sándwich entero de ~S/20 en vez de perdonar S/6-8. Eran dos
// opciones muertas ocupando sitio en la pantalla, y encima hacían ver el programa como
// arbitrario. Recalibradas a la misma tasa que las otras tres:
//   R02  40 pts ÷ S/2 (EXTRA_SAUCE_PRICE) = 20
//   R05 120 pts ÷ S/6 (R05_FLAT_WAIVER)   = 20
//   R03 160 pts ÷ S/8 (R03_FLAT_WAIVER)   = 20   ← era 320
//   R04 120 pts ÷ S/6 (R04_FLAT_WAIVER)   = 20   ← era 320
//   R06 400 pts ÷ ~S/20 (un 15CM)         = 20
// No sube el techo de lo que regala el negocio: R06 ya fijaba ese 5% sobre el premio más
// caro del programa. Lo que cambia es que ahora ninguna opción domina a las otras.
// DEBE coincidir con REWARDS en supabase/functions/api/catalog.ts — y ojo, esos puntos
// también viven en `catalog_prices` (categoría 'reward'), que es lo que de verdad manda en
// runtime: cambiar solo estos literales no cambia nada.
var RWDS=[
  {id:'R02',pts:40, n:'Salsa',    s:'Extra',  d:'Perdona el cargo de salsa extra (S/2)'},
  {id:'R04',pts:120,n:'Doble',    s:'Proteína',d:'Doble proteína gratis'},
  {id:'R05',pts:120,n:'Bebida',   s:'Gratis', d:'Bebida a elección'},
  {id:'R03',pts:160,n:'Tamaño',   s:'30CM',   d:'Tu sándwich 15CM sube a 30CM gratis',sizeOnly:'15'},
  {id:'R06',pts:400,n:'Sándwich', s:'Gratis', d:'Sándwich 15CM gratis — no aplica a Signatures Reserve',sizeOnly:'15'}
];
// BEBIDAS Y SIDES — solo el catálogo de bebidas de la casa (D06-D09). D01-D05
// (chicha morada, inca kola, agua, papas, galleta) se retiraron a pedido del dueño:
// eran solo reventa de botellas/paquetes, sin nada distinto a lo que vende cualquier
// otro local — el catálogo ahora se queda solo con las bebidas propias sin jugos.
// `icon` distingue visualmente las 4 infusiones en BEBIDAS Y SIDES — antes eran
// idénticas salvo el texto (hallazgo de auditoría UX), sin nada que distinguirlas de un
// vistazo en una lista donde se comparan una junto a otra.
// PRECIOS +S/2 (y +S/3 en el chai) el 2026-08-22, decisión del dueño. El margen de
// 61-84% que el negocio venía usando para las bebidas costeaba SOLO el insumo, nunca el
// envase: con una botella con tapa a rosca a ~S/1 (estimado, falta cotizar) el margen
// real era 56-66%, no 84%. El chai lleva +S/3 y no +S/2 porque es el único con costo de
// insumo alto de verdad (leche, cardamomo, jengibre: ~S/1.55 por vaso contra S/0.31-0.62
// de las infusiones). DEBEN coincidir con SIDE_PRICE en catalog.ts y con catalog_prices.
var SIDES=[
  // `d` es la descripción de venta que se muestra en BEBIDAS Y SIDES.
  {id:'D06',l:'The Bloom',    s:'Hibiscus',p:6,d:'Flor de jamaica en infusión con un toque de canela, servida helada. Ácida, floral y sin una gota de jugo.',icon:'flor'},
  {id:'D07',l:'The Midnight', s:'Brew',    p:5,d:'Té negro reposado en frío toda la noche. Suave, sin amargor, con el punch justo de cafeína.',icon:'moon'},
  {id:'D08',l:'The Cool',     s:'Mint',    p:6,d:'Hierba luisa y menta fresca en infusión helada. Ligera, aromática, el break perfecto entre bocado y bocado.',icon:'hoja'},
  {id:'D09',l:'The Spice',    s:'Chai',    p:9,d:'Té negro especiado con leche, canela, cardamomo, clavo y jengibre. Nuestra versión casera del chai clásico.',icon:'vapor'}
];

// HORARIO — valor de arranque mientras carga el real desde el servidor (ver
// loadStoreHoursBackground más abajo, que lo sobreescribe con lo que el dueño configuró
// en el panel admin). [hora_apertura, hora_cierre] en formato 24h, índice 0=domingo.
// índice 1 (lunes) en null = día de descanso, coincide con store_hours en la base.
var STORE_HOURS=[[11,22],null,[11,22],[11,22],[11,22],[11,22],[11,22]];
// El horario SIEMPRE se evalúa en hora de Lima, nunca en la del aparato (2026-08-28).
// Antes se usaban getDay()/getHours(), que devuelven la zona del dispositivo. Perú tiene
// una sola zona y sin horario de verano, así que un celular bien configurado dentro del
// país acertaba — pero el bug no depende de dónde ESTÁ el usuario sino de cómo está
// CONFIGURADO su aparato: alguien pidiendo desde el extranjero para entregar en Trujillo,
// un Android con la zona mal después de un reinicio, o un navegador que arranca en UTC.
// En esos casos el cliente mostraba ABIERTO/CERRADO al revés y dejaba elegir horas que el
// servidor después rechazaba, o bloqueaba horas perfectamente válidas.
// Espejo exacto de limaFields() en supabase/functions/api/env.ts.
function limaDayHour(d){
  var parts=new Intl.DateTimeFormat('en-US',{
    timeZone:'America/Lima',weekday:'short',hour:'numeric',minute:'numeric',hourCycle:'h23'
  }).formatToParts(d);
  var get=function(t){var p=parts.find(function(x){return x.type===t;});return p?p.value:'0';};
  var W={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  return {weekday:W[get('weekday')],hour:Number(get('hour'))+Number(get('minute'))/60};
}
function storeStatus(){
  var lima=limaDayHour(new Date()),range=STORE_HOURS[lima.weekday];
  if(!range)return{open:false,label:'CERRADO HOY'};
  var open=lima.hour>=range[0]&&lima.hour<range[1];
  return open?{open:true,label:'ABIERTO AHORA · cierra '+String(range[1]).padStart(2,'0')+':00'}:{open:false,label:'CERRADO · abre '+String(range[0]).padStart(2,'0')+':00'};
}
function isWithinStoreHours(d){
  var lima=limaDayHour(d),range=STORE_HOURS[lima.weekday];
  if(!range)return false;
  return lima.hour>=range[0]&&lima.hour<range[1];
}
// Picker de "pedir para más tarde" — antes era un <input type="datetime-local"> nativo,
// que en varios navegadores/webviews móviles (ej. el navegador embebido de YouTube)
// se renderiza como una caja vacía enorme sin nuestros estilos (el sistema operativo
// dibuja su propio widget de fecha/hora, ignorando el CSS) — un bug que Playwright
// nunca puede detectar porque corre sobre Chromium de escritorio, que sí respeta el
// CSS del input. Reemplazado por franjas horarias propias (HOY/MAÑANA + cada 30 min
// dentro del horario real) para que el control se vea y funcione igual en cualquier
// dispositivo. #o-sched sigue existiendo como input oculto con el mismo formato
// "YYYY-MM-DDTHH:mm" que antes, así el resto del flujo (effectiveOrderDate, doOrder)
// no tuvo que cambiar.
var SCHED_LEAD_MINUTES=20;
function schedDateForDay(dayKey){var d=new Date();if(dayKey==='tomorrow')d.setDate(d.getDate()+1);return d;}
// Devuelve las franjas del día con su estado. `full` viene de la capacidad real que manda
// el servidor (#23): antes el cliente ofrecía todas las franjas por igual y el rechazo por
// hora llena aparecía recién al tocar PAGAR, con el sándwich ya armado y la dirección ya
// escrita. La franja llena se sigue MOSTRANDO, apagada — esconderla dejaría un hueco
// inexplicable en la lista de horas.
function schedSlotsDetailed(dayKey){
  var d=schedDateForDay(dayKey),range=STORE_HOURS[limaDayHour(d).weekday];
  if(!range)return[];
  var out=[],now=new Date(),isToday=dayKey==='today';
  for(var totalMin=range[0]*60;totalMin<range[1]*60;totalMin+=30){
    var slotDate=new Date(d);slotDate.setHours(0,0,0,0);slotDate.setMinutes(totalMin);
    if(isToday&&slotDate.getTime()<now.getTime()+SCHED_LEAD_MINUTES*60000)continue;
    out.push({t:String(Math.floor(totalMin/60)).padStart(2,'0')+':'+String(totalMin%60).padStart(2,'0'),full:hourIsFull(slotDate)});
  }
  return out;
}
// Solo las franjas ELEGIBLES. Lo usan el default y la validación: una hora llena no puede
// quedar preseleccionada, porque el cliente la pagaría sin haberla elegido.
function schedSlots(dayKey){
  return schedSlotsDetailed(dayKey).filter(function(s){return !s.full;}).map(function(s){return s.t;});
}
// #25 — La primera hora libre, mirando HOY y después MAÑANA. Rechazar sin ofrecer una
// alternativa es mandar al cliente a adivinar cuándo volver: la mayoría no vuelve. Devuelve
// null solo si de verdad no queda ninguna franja en los dos días.
function nextFreeSlot(){
  var hoy=schedSlots('today');
  if(hoy.length)return{day:'today',label:'hoy',slot:hoy[0]};
  var man=schedSlots('tomorrow');
  if(man.length)return{day:'tomorrow',label:'mañana',slot:man[0]};
  return null;
}
// #60 — Franjas ofrecidas para un pedido FIJO. Se toma el horario más amplio de la semana y
// no el de hoy: la recurrencia es para un día futuro, y acotarla al horario de hoy
// escondería franjas perfectamente válidas (o dejaría la lista vacía un día cerrado).
function recurringSlotOptions(){
  var abre=24,cierra=0;
  for(var i=0;i<7;i++){
    var r=STORE_HOURS[i];
    if(!r)continue;
    if(r[0]<abre)abre=r[0];
    if(r[1]>cierra)cierra=r[1];
  }
  if(abre>=cierra)return[];
  var out=[];
  for(var m=abre*60;m<cierra*60;m+=30){
    out.push(String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'));
  }
  return out;
}
// Salta a esa franja y deja el pedido en modo programado, para que ofrecerla sea un toque y
// no una instrucción que el cliente tiene que ejecutar a mano.
function useNextFreeSlot(){
  var n=nextFreeSlot();
  if(!n)return;
  scheduleMode='later';schedDay=n.day;schedSlot=n.slot;
  confirmRerender();
}
function schedInputValue(){
  if(!schedSlot)return'';
  var d=schedDateForDay(schedDay),parts=schedSlot.split(':');
  d.setHours(parseInt(parts[0],10),parseInt(parts[1],10),0,0);
  var pad=function(n){return String(n).padStart(2,'0');};
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
}
function initSchedDefault(){
  if(schedSlot)return;
  var slots=schedSlots(schedDay);
  if(!slots.length&&schedDay==='today'){schedDay='tomorrow';slots=schedSlots('tomorrow');}
  schedSlot=slots.length?slots[0]:null;
}
function pickSchedDay(dayKey){schedDay=dayKey;var slots=schedSlots(dayKey);schedSlot=slots.length?slots[0]:null;confirmRerender();}
function pickSchedSlot(hhmm){schedSlot=hhmm;confirmRerender();}
function scheduleTimePickerHTML(){
  var days=[{key:'today',l:'HOY'},{key:'tomorrow',l:'MAÑANA'}];
  var dayChips=days.map(function(dd){
    var d=schedDateForDay(dd.key),closed=!STORE_HOURS[limaDayHour(d).weekday],sel=schedDay===dd.key;
    var sub=d.toLocaleDateString('es-PE',{weekday:'short',day:'numeric',month:'short'});
    return'<div onclick="'+(closed?'':'pickSchedDay(\''+dd.key+'\')')+'" style="flex:1;text-align:center;background:'+(closed?'#162922':(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)'))+';border:1px solid '+(sel&&!closed?GOLD:'#3A6B58')+';border-radius:8px;padding:9px 6px;cursor:'+(closed?'not-allowed':'pointer')+';opacity:'+(closed?.4:1)+'"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:#fff">'+dd.l+'</div><div style="font-family:\'EB Garamond\',serif;font-size:9px;color:var(--sw-text-muted,#A8C8B0);text-transform:capitalize;margin-top:1px">'+(closed?'CERRADO':esc(sub))+'</div></div>';
  }).join('');
  var slots=schedSlotsDetailed(schedDay);
  var libres=slots.filter(function(s){return !s.full;});
  var slotsHTML=slots.length
    ?'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;max-height:160px;overflow-y:auto">'+slots.map(function(s){
        if(s.full)return'<div title="Esa hora ya está llena" style="background:#162922;border:1px solid #3A6B58;border-radius:20px;padding:7px 14px;cursor:not-allowed;opacity:.45;font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:var(--sw-text-muted,#A8C8B0);text-decoration:line-through">'+s.t+'</div>';
        var sel=schedSlot===s.t;return'<div onclick="pickSchedSlot(\''+s.t+'\')" style="background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:20px;padding:7px 14px;cursor:pointer;font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:'+(sel?'#fff':'#A8C8B0')+';box-shadow:'+(sel?SHADOW_GOLD:'none')+'">'+s.t+'</div>';
      }).join('')+'</div>'
      +(libres.length<slots.length?'<div style="margin-top:8px;font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">Las horas tachadas ya están completas — la cocina no da abasto para más pedidos en esa franja.</div>':'')
    :'<div style="margin-top:10px;font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">No hay horarios disponibles ese día.</div>';
  if(slots.length&&!libres.length)slotsHTML+='<div style="margin-top:6px;font-family:\'EB Garamond\',serif;font-size:11px;color:'+GOLD+'">Todas las horas de ese día están completas. Prueba el otro día.</div>';
  return'<div style="display:flex;gap:8px">'+dayChips+'</div>'+slotsHTML+'<input type="hidden" id="o-sched" value="'+esc(schedInputValue())+'">';
}
// Rango orientativo de preparación + entrega mostrado ANTES de pagar (reduce la
// incertidumbre justo en el momento de decidir) — no es el ETA real del pedido, que
// el operador fija por pedido en el panel admin. ⚠️ EDITA este rango con el tiempo
// real de tu zona de reparto.
var ESTIMATED_DELIVERY_RANGE=[25,40];
// #16 — El rango de arriba es el de la cocina VACÍA. Con pedidos por delante, prometer lo
// mismo es mentir, y un ETA que miente es la causa directa de una calificación de 1
// estrella: el cliente no reclama por esperar 50 minutos, reclama por esperar 50 cuando le
// dijeron 25. Avisar la demora cuesta alguna venta; la mala calificación cuesta más.
//
// `queueAhead` son los pedidos en RECIBIDO/PREPARANDO (los que compiten por el tiempo de
// armado); los que ya salieron EN CAMINO no cuentan. Si el fetch de capacidad falló,
// queueAhead es 0 y esto devuelve exactamente el rango de siempre.
function estimatedDeliveryRange(){
  var extra=Math.max(0,queueAhead)*queueMinutesPerOrder;
  return[ESTIMATED_DELIVERY_RANGE[0]+extra,ESTIMATED_DELIVERY_RANGE[1]+extra];
}
function estimatedRangeText(){var r=estimatedDeliveryRange();return r[0]+'-'+r[1]+' min';}
// Coordenadas reales del punto de despacho (Av. Prolongación César Vallejo 2670,
// Condominio El Mirador del Golf, Trujillo) — usadas SOLO para el banner "Estás cerca"
// (ver checkNearbyStore/sOHome). No confundir con ESTIMATED_DELIVERY_RANGE de arriba.
var STORE_LAT=-8.139599,STORE_LON=-79.039458;
var NEARBY_RADIUS_KM=3;
// Zonas de Trujillo que hoy NO se cubren con delivery — el checkout las rechaza si el
// texto de la dirección las menciona (comparación por substring, sin acentos/mayúsculas).
// No hay geocerca real: depende de que el cliente escriba el nombre del distrito/zona.
// El servidor vuelve a validar esto mismo (ver assertAddressAllowed en orders.ts) —
// este chequeo de acá es solo para dar el aviso al toque, sin esperar la respuesta del
// servidor. DEBE coincidir con DELIVERY_EXCLUDED_ZONES en supabase/functions/api/env.ts.
var DELIVERY_EXCLUDED_ZONES=['el milagro','el porvenir'];
// #30 — Palabras que convierten una nota del cliente en un asunto de SEGURIDAD, no de
// preferencia. El campo de notas es texto libre y se usa sobre todo para referencias de
// dirección ("portón azul", "3er piso"): una alergia escrita ahí se pintaba igual que el
// portón y se perdía entre lo demás, justo mientras se arma el pedido.
//
// La lista es corta y de lenguaje de restricción, no de ingredientes, a propósito: meter
// cada alérgeno haría saltar la alerta con "sin cebolla" y con cualquier receta que los
// nombre, y una alarma que salta siempre deja de mirarse. Un "sin cebolla" se sigue viendo
// como nota normal: es una preferencia, no un riesgo.
// DEBE coincidir con NOTE_ALERT_WORDS en supabase/functions/api/env.ts.
var NOTE_ALERT_WORDS=['alergi','alérgi','intoleran','celiac','celíac','gluten','lactosa','diabet'];
function noteNeedsAttention(notes){
  var n=(notes||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return NOTE_ALERT_WORDS.some(function(w){return n.indexOf(w.normalize('NFD').replace(/[\u0300-\u036f]/g,''))>=0;});
}
function addressInExcludedZone(addr){
  var a=(addr||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return DELIVERY_EXCLUDED_ZONES.some(function(z){return a.indexOf(z)>=0;});
}
// Distritos de la provincia de Trujillo que el checkout ofrece explícitamente. NO es una
// lista de cobertura nueva: es exactamente lo que el servidor ya acepta hoy
// (assertAddressAllowed rechaza únicamente DELIVERY_EXCLUDED_ZONES, todo lo demás pasa),
// puesto por delante para que el cliente ELIJA en vez de que el sistema adivine su zona
// leyendo el texto libre de la dirección. Los que están fuera de cobertura se muestran
// igual pero deshabilitados — enterarse ANTES de llenar todo el checkout es mucho mejor
// que un error al final, y además comunica que el negocio existe pero todavía no llega.
// Si el dueño decide recortar cobertura (ej. dejar de repartir a Salaverry), se marca
// `out:true` acá Y se agrega el nombre a DELIVERY_EXCLUDED_ZONES en los DOS lados
// (este archivo y supabase/functions/api/env.ts) — el substring del servidor sigue siendo
// la única defensa real, este selector es la capa de experiencia, no la de autorización.
var DELIVERY_DISTRICTS=[
  {id:'trujillo',l:'Trujillo (Centro)'},
  {id:'victor_larco',l:'Víctor Larco Herrera'},
  {id:'la_esperanza',l:'La Esperanza'},
  {id:'huanchaco',l:'Huanchaco'},
  {id:'laredo',l:'Laredo'},
  {id:'moche',l:'Moche'},
  {id:'salaverry',l:'Salaverry'},
  {id:'florencia_de_mora',l:'Florencia de Mora'},
  {id:'el_porvenir',l:'El Porvenir',out:true},
  {id:'el_milagro',l:'El Milagro',out:true},
  {id:'otro',l:'Otro / no está en la lista'}
];
// Vacío = todavía no eligió. Es obligatorio para pagar (ver doOrder) — a diferencia de la
// zona de precio, que sí tiene default porque solo mueve el monto del motorizado.
var deliveryDistrict='';
function districtById(id){return DELIVERY_DISTRICTS.find(function(d){return d.id===id;});}
// El distrito elegido se ADJUNTA al texto de la dirección que se manda al servidor (no
// viaja como campo propio: no hay columna para él y el motorizado necesita el distrito
// dentro de la dirección impresa de todos modos). Si el cliente ya lo escribió a mano, no
// se duplica.
function addressWithDistrict(addr,districtId){
  var d=districtById(districtId);
  if(!d||d.id==='otro')return addr;
  var norm=function(x){return(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');};
  if(norm(addr).indexOf(norm(d.l))>=0)return addr;
  return addr+', '+d.l;
}
// Si el cliente elige una dirección guardada, se intenta deducir el distrito de su texto
// para no obligarlo a volver a elegir algo que ya está escrito ahí.
function districtFromAddress(addr){
  var norm=function(x){return(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');};
  var a=norm(addr);
  var hit=DELIVERY_DISTRICTS.find(function(d){return d.id!=='otro'&&a.indexOf(norm(d.l))>=0;});
  return hit?hit.id:'';
}
// El delivery lo hacen motorizados que el dueño coordina por pedido — antes se pagaba
// aparte, directo al motorizado, sin ningún monto fijo ("todas las apps indican un
// monto" fue la razón de negocio para cambiarlo). Ahora el cliente elige su zona
// aproximada en el checkout (nunca exige GPS — eso sería más fricción, no menos) y ese
// monto se SUMA al total que de verdad se cobra (Culqi/Yape/Plin/crédito, el que sea).
// El dueño le sigue pagando al motorizado por fuera de la app, igual que siempre — esto
// solo asegura que el cliente vea y pague un número real, no un rango. DEBE coincidir
// con DELIVERY_ZONE_FEES en supabase/functions/api/env.ts.
var DELIVERY_PRICE_ZONES=[
  {id:'cerca',l:'Cerca del local',fee:6},
  {id:'media',l:'Distancia media',fee:8},
  {id:'lejos',l:'Lejos',fee:12},
  {id:'muy_lejos',l:'Muy lejos',fee:15}
];
// 'media' por defecto — así nadie tiene que pensar en su zona para completar el pedido;
// solo toca si sabe que está más cerca o más lejos de lo normal.
var deliveryZone='media';
// Solo se usa para "engordar" el fee de delivery cuando el pedido se va a pagar con
// tarjeta (Culqi descuenta esta comisión del cargo completo, incluido el delivery, que es
// pass-through puro sin margen — hallazgo de auditoría financiera). DEBE coincidir con
// CULQI_FEE_RATE en supabase/functions/api/env.ts, ese lado es el que de verdad cobra;
// este solo estima el total antes de pagar.
var CULQI_FEE_RATE=0.055;
// Réplica de la decisión de doOrder() sobre qué método de pago se va a usar, calculada
// SOLO con el fee de delivery real (sin engordar) para no crear una dependencia circular
// con deliveryFeeAmount() de abajo — si el crédito alcanza para cubrir el total real, o
// hay un método manual elegido, nunca se pasa por Culqi y el fee nunca se engorda.
function willPayWithCard(){
  // ⚠ Esto leía la tarifa de ZONA hasta el 2026-09-03. Desde que el envío se cobra por
  // distancia, la zona y el monto real dejaron de coincidir, y este total intermedio es
  // el que decide si el crédito alcanza — con la zona por defecto (S/8) un pedido a 6 km
  // (S/12) parecía cubierto por un crédito que no llegaba, y el servidor lo rechazaba
  // después de que el cliente ya había tocado pagar. deliveryFeeBase() es la MISMA
  // función que produce el monto que se muestra y se cobra, así que no pueden separarse.
  // No hay ciclo: deliveryFeeBase() nunca llama a willPayWithCard(), solo deliveryFeeAmount().
  var t0=cartFinalTotal()+deliveryFeeBase();
  if(t0===0)return false;
  if(useCredit&&cust&&(cust.credit_balance||0)>=t0)return false;
  if(manualPayMethod)return false;
  // Ni recompensa/crédito cubre el total ni hay método manual elegido → el pedido va
  // por Culqi sí o sí (mismo enrutamiento que doOrder() más abajo), tanto si el cliente
  // tocó "Tarjeta" a propósito como si nunca tocó el selector y cae en el camino rápido.
  // DEBE devolver true en ambos casos: actPrepareOrder (orders.ts) siempre calcula el
  // fee inflado para cualquier pedido que vaya a Culqi, así que el total mostrado acá
  // tiene que coincidir con lo que el servidor va a exigir — de lo contrario el pedido
  // se rechaza con "El total no coincide con los productos del pedido." La transparencia
  // del recargo (el hallazgo P2 original) se resuelve mostrándolo como línea aparte en
  // paymentMethodPickerHTML(), no ocultando el monto real que se va a cobrar.
  return true;
}
// ── RECARGO POR PAN DE FOCACCIA (2026-09-03) ──────────────────────────────────────────
//
// El tipo de pan era una elección GRATUITA y la focaccia cuesta más que el pan sub, así que
// ese sobrecosto salía entero del margen. Medido por el dueño el 2026-09-03: de una focaccia
// de S/13 salen 10 sándwiches de 15CM o 5 de 30CM → S/1.30 y S/2.60 contra S/1.00 y S/2.00
// del pan sub. Se cobra S/0.50 y S/1.00.
//
// Solo B03 (Focaccia) lleva recargo. DEBE coincidir con BASE_SURCHARGE en env.ts — el
// servidor es el que de verdad cobra; `npm run parity` compara los dos lados.
var BASE_SURCHARGE={B03:{p15:0.5,p30:1}};
function baseSurcharge(base,size){var b=BASE_SURCHARGE[base];return b?(size==='15'?b.p15:b.p30):0;}

// ── COBRO DEL DELIVERY POR DISTANCIA REAL (2026-09-02) ────────────────────────────────
//
// El motorizado (un tercero con 50+ repartidores, coordinado por WhatsApp) cobra S/2 POR
// KILÓMETRO. Hasta hoy la app cobraba un monto plano por ZONA que elegía el cliente, con
// "media" por defecto: el cliente elegía su propio precio de envío y elegir el más barato no
// le costaba nada. El pin del mapa existía pero SOLO AVISABA del desajuste.
//
// Estas cuatro constantes DEBEN coincidir con las de supabase/functions/api/env.ts — el
// servidor es el que de verdad cobra y recalcula todo desde las coordenadas; acá solo se
// muestra. `npm run parity` compara los dos lados.
var DELIVERY_KM_RATE=2;          // S/ por kilómetro
var DELIVERY_ROAD_FACTOR=1.3;    // línea recta → ruta real en moto
var DELIVERY_MIN_FEE=5;          // piso real del motorizado por viaje corto (dueño 2026-09-02)
var DELIVERY_MAX_KM=12;          // techo de cobertura
// Kilómetros COBRABLES desde el pin confirmado. `null` significa "no se puede medir" y nunca
// 0: un 0 silencioso le cobraría el mínimo a alguien que vive a 10 km.
function deliveryKmNow(){
  if(typeof window._mLat!=='number'||typeof window._mLon!=='number')return null;
  if(window._mLat===0&&window._mLon===0)return null;
  var recta=haversineKm(window._mLat,window._mLon,STORE_LAT,STORE_LON);
  if(!isFinite(recta))return null;
  return Math.round(recta*DELIVERY_ROAD_FACTOR*100)/100;
}
// La tarifa antes de la comisión de tarjeta. Se redondea hacia ARRIBA al medio sol: el
// motorizado cobra en efectivo y S/7.43 no existe en la práctica; hacia arriba y no al más
// cercano deja el error del lado de pagarle completo, nunca del lado de quedarse corto — el
// delivery es pass-through y no tiene margen del que salga la diferencia.
function deliveryFeeBase(){
  var km=deliveryKmNow();
  if(km===null){
    // Sin pin se cae a la zona, exactamente como antes. Es el respaldo para un shell viejo
    // servido por un service worker desactualizado; el checkout exige el pin antes de pagar.
    var z=DELIVERY_PRICE_ZONES.find(function(x){return x.id===deliveryZone;});
    return z?z.fee:0;
  }
  return Math.ceil(Math.max(DELIVERY_MIN_FEE,km*DELIVERY_KM_RATE)*2)/2;
}
function deliveryFeeAmount(){
  var fee=deliveryFeeBase();
  if(!fee)return 0;
  return money(willPayWithCard()?fee/(1-CULQI_FEE_RATE):fee);
}
// El total que de verdad se cobra — cartFinalTotal() (comida, con descuentos/recompensa)
// más el delivery. Los puntos ganados siguen calculándose sobre cartFinalTotal() sin
// delivery (ver checkoutExtrasHTML) — el delivery es un pass-through al motorizado, no
// premia con puntos igual que la comida.
function payableTotal(){return money(cartFinalTotal()+deliveryFeeAmount());}
// Combo sándwich (Signature o Build Your Own) + bebida: S/2 menos que pedir ambos por
// separado, aplicado una vez por cada par sándwich+bebida en el carrito (ver
// cartComboCount). Bajado de S/3 a S/2 — a S/3 el combo dejaba THE MIDNIGHT (D07, la
// bebida más barata, también S/3) completamente GRATIS con cualquier sándwich, a
// cualquier hora del día — a diferencia de la promo de hora valle (bebida gratis de
// verdad), que el negocio decidió a propósito limitar a la ventana de baja demanda
// porque regalar margen fuera de esa ventana no es "casi puro margen incremental"
// (hallazgo de auditoría financiera). DEBE coincidir con COMBO_DISCOUNT_PER_PAIR en
// supabase/functions/api/catalog.ts, el servidor es quien de verdad cobra.
// Bajado de S/2 a S/1 el 2026-08-22 (decisión del dueño, misma ronda que la subida de
// bebidas). A S/2 el combo se comía entre el 58% y el 118% de lo que deja una bebida ya
// contado el envase — THE MIDNIGHT en combo dejaba −S/0.31, o sea que el par sándwich+
// bebida rendía MENOS que el sándwich solo. Y a diferencia de la promo de hora valle
// (que sí puede crear un pedido que no existía), este descuento se le aplica a alguien
// que YA decidió comprar la bebida: es margen regalado, no adquisición.
var COMBO_DISCOUNT_PER_PAIR=1;
// Tope plano de R03 — DEBE coincidir con R03_FLAT_WAIVER en catalog.ts (ese lado es el
// que de verdad cobra; este solo estima el ahorro que ve el cliente antes de pagar).
var R03_FLAT_WAIVER=8;
// Topes planos de R04/R05 — mismo criterio que R03: evitan que el valor mostrado al
// cliente (y lo que el servidor de verdad cobra) dependa de elegir la proteína/bebida
// más cara. DEBEN coincidir con R04_FLAT_WAIVER/R05_FLAT_WAIVER en catalog.ts.
var R04_FLAT_WAIVER=6;
// Subido de 4 a 6 el 2026-08-22, junto con la subida de precio de las bebidas. NO es
// generosidad nueva: es lo que mantiene cierto el nombre de la recompensa. Con las
// bebidas a S/5-9 y el tope en S/4, "BEBIDA // GRATIS" habría dejado de cubrir una sola
// bebida del catálogo — la misma clase de promesa falsa que ya obligó a retirar los
// badges MÁS PEDIDO y EDICIÓN LIMITADA. A S/6 cubre entero THE MIDNIGHT/THE BLOOM/THE
// COOL y deja THE SPICE parcial, exactamente la misma relación que había antes con el
// tope en S/4. Los puntos de R05 NO cambian (120): a S/6 de tope quedan en 20 pts/sol,
// que es justo donde ya está R06, así que el programa sigue internamente coherente.
var R05_FLAT_WAIVER=6;
// Signatures RESERVE (menú secreto/premium) excluidas de R06 para que esa recompensa no
// se gamee eligiendo el sándwich más caro del catálogo — DEBE coincidir con RESERVE_SIGS
// en catalog.ts.
var RESERVE_SIGS=new Set(['SIG05']);
// Bebida gratis (hasta S/4) de 3pm a 6pm hora Lima — DEBE coincidir con
// OFFPEAK_DRINK_PROMO_HOURS_LIMA en supabase/functions/api/catalog.ts, el servidor es
// quien de verdad aplica el descuento; esto solo calcula el estimado que ve el cliente
// antes de pagar (si no coincide, el checkout rechaza el total por no cuadrar).
// Empezaba a las 14:00 hasta el 2026-08-15 — en Perú el almuerzo por delivery se estira
// hasta cerca de las 16:00, así que esa primera hora descontaba pedidos que igual iban a
// entrar en vez de crear pedidos nuevos (ver el comentario largo del lado del servidor).
var OFFPEAK_DRINK_PROMO_HOURS_LIMA=[[15,18]];
// Subido de 4 a 6 el 2026-08-22 por el mismo motivo que R05_FLAT_WAIVER: con las bebidas
// a S/5-9, un tope de S/4 dejaba de regalar "la bebida" para pasar a regalar un pedazo.
var OFFPEAK_DRINK_PROMO_CAP=6;
// INCENTIVO AL ORGANIZADOR DE PEDIDO GRUPAL (2026-08-22). Quien junta al grupo se lleva
// un sándwich gratis a partir de este número de sándwiches. Convierte al cliente en el
// vendedor del canal de oficinas — el de mejor economía del negocio y el único que el
// dueño no puede trabajar él mismo, porque sus mañanas están cocinando.
// DEBE coincidir con ORGANIZER_FREE_MIN_SANDWICHES en supabase/functions/api/catalog.ts.
// Ojo: esto es solo el espejo para que el cliente muestre el mismo número; quien de
// verdad decide si el descuento corresponde es el servidor, que lo verifica contra la
// base (organizerFreeSandwichApplies en actions/group.ts).
var ORGANIZER_FREE_MIN_SANDWICHES=5;
// Recargo por salsa extra. DEBE coincidir con EXTRA_SAUCE_PRICE en
// supabase/functions/api/catalog.ts — lo verifica `npm run parity`. Antes era un literal
// `2` repetido 5 veces acá y 4 en el servidor, y es el único precio del catálogo que no se
// puede editar desde el panel, así que la única defensa posible es esta comparación.
var EXTRA_SAUCE_PRICE=2;
// Hora efectiva para el descuento de hora valle: si el pedido está programado para más
// tarde (scheduleMode==='later'), usa esa hora elegida — no la hora en la que se arma
// el carrito. Antes esto siempre miraba "ahora", así que programar un pedido para las
// 8pm (hora pico) mientras se arma el carrito a las 3pm (hora valle) regalaba la bebida
// igual, aunque la cocina la fuera a preparar en hora pico (hallazgo de auditoría de
// rentabilidad) — DEBE coincidir con deriveCart en supabase/functions/api/catalog.ts,
// que es quien de verdad cobra.
function effectiveOrderDate(){
  if(scheduleMode==='later'){
    var schedEl=(document.getElementById('o-sched') as HTMLInputElement|null);
    var v=schedEl?schedEl.value:'';
    if(v){var d=new Date(v);if(!isNaN(d.getTime()))return d;}
  }
  return new Date();
}
function isOffPeakDrinkPromoActiveNow(){
  var limaHour=new Date(effectiveOrderDate().getTime()-5*3600000).getUTCHours();
  return OFFPEAK_DRINK_PROMO_HOURS_LIMA.some(function(r){return limaHour>=r[0]&&limaHour<r[1];});
}
// Plan Semanal — recarga de saldo propio con bono. Monto fijo (no hay input de monto como
// en la tarjeta de regalo) porque el bono está calculado para un solo punto de precio;
// DEBE coincidir con WEEKLY_PLAN_PRICE/WEEKLY_PLAN_CREDIT en
// supabase/functions/api/actions/customer.ts, el servidor es quien de verdad cobra y acredita.
// Precio subido de S/90 a S/95 para cubrir la comisión de Culqi (~4%) sobre el cobro.
var WEEKLY_PLAN_PRICE=95;
var WEEKLY_PLAN_CREDIT=100;
// Tarjeta de regalo: se paga con puntos propios, sin ningún cobro real (rediseño de esta
// sesión — antes cobraba por Culqi). DEBE coincidir con GIFT_CARD_POINTS_PER_SOL en
// supabase/functions/api/actions/customer.ts, el servidor es quien de verdad debita los
// puntos y acredita el saldo.
var GIFT_CARD_POINTS_PER_SOL=40;
// Lo que recibe EL INVITADO al pagar su primer pedido — 120 pts = una bebida gratis (R05).
// Subido de 50 el 2026-08-20: el invitado es quien tiene que decidir comprar y 50 puntos
// (S/1.25) no le dicen nada a alguien que nunca pidió. Solo se usa para el copy — quien
// otorga los puntos de verdad es el servidor. DEBE coincidir con REFERRAL_BONUS_POINTS en
// supabase/functions/api/env.ts.
var REFERRAL_BONUS_POINTS=120;
// #55 — La escalera de referidos, solo para pintarla. Los puntos los otorga el servidor
// (grant_referral_milestone); acá nunca se suma nada. DEBE coincidir con
// REFERRAL_MILESTONES en supabase/functions/api/env.ts — lo verifica `npm run parity`.
//
// Existe en el cliente porque un premio escalonado que nadie VE es exactamente igual que
// no tenerlo: lo que hace que alguien invite al tercero es saber que el tercero paga
// distinto, y eso solo puede decirlo la pantalla de referidos.
var REFERRAL_MILESTONES=[
  {count:3,points:120,label:'Una bebida de la casa gratis'},
  {count:5,points:400,label:'Otro sándwich 15CM gratis'},
  {count:10,points:800,label:'Dos sándwiches 15CM gratis'}
];
// Cuál es el siguiente escalón por alcanzar y cuántos amigos faltan. Devuelve null cuando
// ya se pasó el último — ahí la escalera se pinta completa, sin un "faltan -2".
function nextReferralMilestone(n){
  var t=Number(n)||0;
  for(var i=0;i<REFERRAL_MILESTONES.length;i++){
    if(REFERRAL_MILESTONES[i].count>t) return {m:REFERRAL_MILESTONES[i],missing:REFERRAL_MILESTONES[i].count-t};
  }
  return null;
}
// Píxel de Meta — el id llega del servidor (get-store-hours) y no está en el código: si el
// dueño todavía no configuró el secret, la app no carga NINGÚN script de terceros. Todo lo
// de medición pasa por fbq(), que es un no-op mientras el píxel no exista, así que ningún
// llamador necesita preguntar si está activo.
var metaPixelId=null,_metaPixelLoaded=false;
// Pausa temporal de la tienda (se reanuda sola). Llega en get-store-hours.
var storePausedUntil=null;
// Capacidad (#23/#24/#16), también de get-store-hours. `fullHours` son los inicios de hora
// (ISO) que ya llegaron al tope; `queueAhead`, los pedidos que la cocina tiene por delante
// ahora mismo. Los valores por defecto son deliberadamente NEUTROS: si el fetch falla, no se
// deshabilita ninguna franja ni se infla ningún estimado — el servidor sigue rechazando lo
// que no puede cumplir, así que el peor caso acá es volver al comportamiento anterior.
var fullHours=[],queueAhead=0,queueMinutesPerOrder=5,maxPerHour=10;
// ¿Está llena la hora en la que caería esta fecha? Se compara por INICIO DE HORA porque es
// como lo agrupa el servidor; comparar por minuto exacto no marcaría nada nunca.
function hourIsFull(d){
  if(!fullHours.length)return false;
  var h=new Date(d);h.setMinutes(0,0,0);
  return fullHours.indexOf(h.toISOString())>=0;
}
function initMetaPixel(id){
  if(_metaPixelLoaded||!id)return;
  _metaPixelLoaded=true;
  /* Snippet oficial del píxel de Meta (sin modificar su lógica de cola). */
  (function(f:any,b,e,v,n?,t?,s?){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments);};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
  s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);})(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  (window as any).fbq('init',id);
  (window as any).fbq('track','PageView');
}
// Envoltorio único: si el píxel no está configurado no hace nada, y un error dentro de
// fbq nunca puede tumbar el flujo de compra que lo llamó.
function fbTrack(event,params?,eventId?){
  try{
    var fbq=(window as any).fbq;
    if(!fbq)return;
    if(eventId)fbq('track',event,params||{},{eventID:eventId});
    else fbq('track',event,params||{});
  }catch(e){}
}
// Cookies que pone el propio píxel; viajan con el pedido para que el evento de compra que
// manda el SERVIDOR se pueda atribuir al mismo anuncio (si no, Meta lo ve como una venta
// sin origen y no puede optimizar).
function metaAttribution(){
  var get=function(n){var m=document.cookie.match('(^|;)\\s*'+n+'\\s*=\\s*([^;]+)');return m?m.pop():'';};
  return {fbp:get('_fbp')||'',fbc:get('_fbc')||'',ua:navigator.userAgent||'',groupCode:pendingGroupCode||''};
}
// Rangos por antigüedad (total_orders) — solo reconocimiento/pertenencia, nunca un
// multiplicador de puntos ni un precio distinto (VIP se retiró como tier a propósito).
// DEBE coincidir con RANKS en supabase/functions/api/env.ts.
var RANKS=[
  {name:'NUEVO',minOrders:0},
  {name:'REGULAR',minOrders:1},
  {name:'INICIADO',minOrders:5},
  {name:'CÍRCULO INTERNO',minOrders:15},
  {name:'MESA FUNDADORA',minOrders:30}
];
function rankName(totalOrders){
  var name=RANKS[0].name;
  RANKS.forEach(function(r){if((totalOrders||0)>=r.minOrders)name=r.name;});
  return name;
}
// Urgencia real (no un timer inventado): invQty ya se carga para todos, no solo para el
// panel admin (ver loadInvBackground) — solo faltaba mostrárselo al cliente en vez de
// guardarlo solo para uso interno.
// #11 — Disponibilidad REAL de un Signature (ojo: `sigAvailable` es otra cosa, la ventana
// de fechas de una edición limitada; esto mira INSUMOS).
//
// Antes esto era `isAvail(s.base)&&isAvail(s.prot)` en los dos sitios donde se pinta un
// Signature. Pero el servidor reserva la receta COMPLETA (`priceSigBuild` arma
// `[base, prot, ...tops, ...sauces]` más el queso fijo, y eso es lo que va a
// `reserve_inventory`). O sea que si se acababa un topping, una salsa o el queso fijo, la
// tarjeta seguía diciendo "disponible": el cliente elegía el sándwich, lo armaba entero,
// llegaba al checkout y recién ahí el servidor lo rechazaba con "uno o más productos se
// agotaron". Es el mismo defecto que ya obligó a poner el selector de distrito — la
// restricción existía y el cliente se enteraba al tocar PAGAR.
//
// El servidor sigue siendo la autoridad (esto no reemplaza `reserve_inventory`): lo que
// cambia es que la app deja de ofrecer algo que ella misma ya sabe que no puede cumplir.
function sigInStock(s){
  if(!s)return false;
  var codes=[s.base,s.prot].concat(s.tops||[],s.sauces||[]);
  if(s.fixedCheese)codes.push(s.fixedCheese);
  return codes.every(function(c){return !c||isAvail(c);});
}
function lowStockNote(code){
  var q=invQty[code];
  if(q==null||q<=0||q>5)return'';
  return'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:'+GOLD+';margin-left:6px;white-space:nowrap">quedan '+q+'</span>';
}
// Doble proteína consume 2 unidades de esa proteína, no 1 — antes el cliente solo se
// enteraba de que no alcanzaba stock cuando el servidor rechazaba el pedido al pagar
// (hallazgo de auditoría UX). invQty ya se carga para todos (ver lowStockNote arriba),
// solo faltaba advertir específicamente cuando pedir DOBLE consumiría más de lo que queda.
function dblStockWarn(protId){
  var q=invQty[protId];
  if(q==null||q>=2)return'';
  return' <span style="color:'+GOLD+'">— '+(q<=0?'sin stock ahora mismo':'solo queda '+q+', puede no alcanzar para doble')+'</span>';
}

// STATE
// `sndScreen` (antes `sc`) y `sndTab` (antes `tab`) llevan prefijo A PROPÓSITO — no es
// estilo, es un bug real de producción del 2026-08-21 que dejó la app entera inservible.
//
// Todo este archivo se sirve como un <script> inline, así que cada `var` de nivel
// superior es una propiedad de `window`. `src/shell.html` carga además
// `checkout.culqi.com/js/v4`, que es una app Vue, y su bundle minificado declara una
// función de nivel superior llamada `sc` (el `createComponentInstance` de Vue). Como ese
// script va con `defer`, corre DESPUÉS del nuestro y pisaba nuestra variable: a partir de
// ahí `sc` dejaba de ser el nombre de la pantalla y pasaba a ser una función de Vue, y la
// primera línea de renderScreen() —`sc.indexOf('admin')`— lanzaba
// "sc.indexOf is not a function" en cada render. La app quedaba muerta en TODAS las
// plataformas a la vez (app instalada, navegador del celular, PC), sin relación con la
// caché, y sin mensaje visible hasta que se agregó el capturador de errores.
//
// Regla para cualquier variable global nueva de este archivo: nombre largo y específico,
// nunca de 1-3 letras. Compartimos el objeto `window` con Culqi y con Google Sign-In, y
// los dos son bundles minificados que pueden declarar globales de cualquier nombre corto
// en cualquier actualización suya, sin avisarnos.
var sndScreen='o_home',sndTab='order',busy=false,busyMsg='';
// Tab activa en el home (Signatures/Arma el tuyo) — puramente de presentación, no
// se persiste ni afecta ningún flujo de pedido real.
var homeTab='sig';
// A dónde vuelve el botón "←" en pantallas legales que se abren desde más de un lugar
// (registro, perfil, o el pie de contacto del home) — sin esto, sPLegal() solo podía
// adivinar el origen mirando si `cust` existe, y desde el pie del home eso mandaba a un
// invitado de vuelta al login en vez de al home. Se fija justo antes de cada navegación.
var bkTo=null;
var mode=null,sigId=null,base=null,prot=null,cheese=null;
var tops=[],sauces=[],size=null,doubleProt=false,extraSauce=false;
// Paso actual del asistente de BUILD YOUR OWN (0=pan,1=proteína,2=toppings,3=queso,
// 4=salsas) — ver sOBuild/byoStepBack/byoStepNext.
var byoStep=0;
var useCredit=false;
// El campo de código promocional arranca colapsado (ver promoCodeHTML) — se abre solo si
// el cliente dice que tiene uno.
var promoFieldOpen=false;
// ── YAPE/PLIN ES EL MÉTODO POR DEFECTO (2026-09-03) ──────────────────────────────────
//
// Arrancaba en null, o sea TARJETA: quien no tocaba el selector terminaba en Culqi, que
// cobra CULQI_FEE_RATE (5.5%) de cada pedido. El método por defecto no es un detalle de
// interfaz — es el que elige la mayoría, porque la mayoría no elige. Al volumen del plan
// mover el reparto tarjeta/Yape del 60% al 30% vale ~S/487 al mes sin adquirir a nadie
// (ver PLAN_DE_MEJORA.md §4b), y es la única de las fugas de margen que no le cuesta un
// sol más al cliente: paga lo mismo o menos, porque el recargo de delivery engordado
// (deliveryFeeAmount) desaparece.
//
// Lo que NO cambia: la tarjeta sigue a un tap de distancia y con su propia razón escrita
// al lado ("Automático"). Esto es un default, no un embudo — quien prefiera pagar con
// tarjeta la ve en el mismo sitio de siempre.
//
// El costo real de este default lo paga el dueño en tiempo: cada pago manual hay que
// confirmarlo contra la cuenta. Eso ya está abaratado con el lector de comprobantes (#28)
// y la confirmación por lotes del panel — pero el lector NO confirma el pago, solo lo lee.
var manualPayMethod='yape';
// true recién cuando el cliente toca explícitamente un botón del selector "¿Cómo
// pagas?" (Yape/Plin o Tarjeta) — hoy solo sirve para saber si el cliente ya decidió por
// su cuenta, y así no pisarle la elección al prender/apagar el crédito interno. NO controla si el recargo de
// Culqi se aplica: eso lo decide willPayWithCard() mirando el mismo enrutamiento real
// que usa doOrder() (¿alcanza el crédito? ¿hay método manual elegido? si no, va por
// Culqi sea cual sea el estado de este flag) — server-side, actPrepareOrder SIEMPRE
// calcula el fee inflado para cualquier pedido que termine en Culqi, sin importar si el
// cliente tocó el botón; hacer que el cliente dependiera de este flag para calcular el
// mismo total causaba que el camino rápido (nunca tocar el selector) mandara un total
// más bajo que el que el servidor exige y el pedido se rechazara con "El total no
// coincide" (bug real de la sesión anterior, hallazgo de auditoría de código).
var payMethodChosen=false;
var cust=null,isAdmin=false,atab='reg',aErr='',refCode='';
// Credential (JWT) de Google Identity Services en espera de que el cliente complete el
// registro normal (nombre/teléfono/PIN/DNI) — ver onGoogleCredential()/doReg(). Nunca se
// usa por sí solo para crear una cuenta: el servidor lo vuelve a verificar en actRegister.
// _googleLinkedEmail es SOLO para mostrar (banner en sPAuth) — nunca se manda al servidor.
// En un dispositivo compartido, alguien podría tocar "Continuar con Google" y abandonar el
// formulario sin enviarlo; sin este banner visible, un segundo cliente en el mismo sndTab que
// llena el registro con SUS propios datos terminaría vinculando sin saberlo la cuenta de la
// primera persona (doReg() adjunta _googleIdToken a cualquier envío mientras siga activo).
// clearGoogleLink() se llama en cada punto donde cambia quién está usando el formulario
// (cambio de pestaña reg/login, login manual, logout) para que esa ventana sea lo más corta
// posible, y el banner + el link "No soy yo" cubren el resto.
var _googleIdToken=null,_googleLinkedEmail=null;
function clearGoogleLink(){_googleIdToken=null;_googleLinkedEmail=null;}
var adminOrders=[],myOrders=[],adminOrdersTruncated=false;
// #21/#22/#17 — Las tres señales que el servidor calcula sobre las direcciones de la cola
// (ambigua, duplicada, agrupable). null mientras no haya respuesta: la cola tiene que
// funcionar igual con un servidor viejo que todavía no las manda.
var adminAddressFlags=null;
// #19 — El token del link que abre el MOTORIZADO para confirmar la entrega. No es una
// sesión ni exige cuenta: quien reparte no tiene una. El token en sí es la autorización,
// igual que `ref` para un invitado que quiere ver o cancelar su pedido.
var deliveryTokenFromUrl=null,deliveryConfirmState=null;
// Guard contra doble-tap en las acciones que mutan un pedido desde la cola admin —
// updateStatus/confirmOrderPayment/confirmAndAdvance no tenían ninguna protección (a
// diferencia de doOrder(), que sí usa _payingInProgress), así que dos taps rápidos en
// hora pico podían disparar dos actualizaciones de estado seguidas (hallazgo de
// auditoría de UX).
var _adminOrderActionInProgress=false;
var agPhone='',agPts='',agMsg='';
var acPhone='',acDelta='',acMsg='';
var pollTimer=null,lastPollCount=0,pollFailing=false;
// Sello del build: scripts/build.mjs reemplaza este literal por el hash del contenido
// compilado al regenerar index.html (ver el comentario largo en ese script sobre por qué
// es el hash del contenido y no el SHA de git). Sirve para una pregunta que hasta ahora
// no se podía contestar a distancia: "¿qué versión está corriendo realmente en tu
// teléfono?". Sin esto, un shell viejo pegado en caché y un bug real de código se ven
// idénticos desde afuera, y no hay forma de distinguirlos sin tener el dispositivo en la
// mano. Se pinta al pie del home, en gris tenue.
var APP_BUILD='__APP_BUILD__';
var isOffline=!navigator.onLine;
// El service worker sirve el shell desde caché (stale-while-revalidate) para que la app
// abra al instante; cuando detecta que en el servidor hay una versión distinta avisa por
// postMessage y esto levanta la barra de "actualizar". Sin este aviso, servir de caché
// dejaría al cliente en una versión vieja del código sin manera de enterarse.
var updateReady=false;
var deferredInstallPrompt=null,pwaDismissed=localStorage.getItem('sw_pwa_dismissed')==='1';
var nearStore=false,_nearCheckDone=false;
var wlPhone='',wlName='',wlMsg='',wlDone=localStorage.getItem('sw_wl_done')==='1';
// Bandera real de "el negocio ya abrió de verdad" (app_settings.business_launched,
// vía get-store-hours) — arranca en false para no cambiar el comportamiento mientras
// carga; el admin la togglea el día real de lanzamiento y la tarjeta de lista de espera
// desaparece sola, sin necesitar otro cambio de código (fix P1 de crítica impeccable
// 2026-07-30: antes solo dependía de cust/wlDone, nunca de si el negocio ya abrió).
var businessLaunched=false;
var pushSubscribed=false,pushMsg='';
var savedPh=localStorage.getItem('sw_ph')||'';
var token=localStorage.getItem('sw_tok')||'';
// Copia local del cliente + rol admin — deja pintar la pantalla de inicio de inmediato
// en el arranque (sin esperar la respuesta de session-check) para quien ya tenía sesión
// guardada; session-check sigue corriendo en segundo plano para confirmar o corregir en
// silencio, en vez de bloquear el primer pintado con un spinner cada vez que se recarga.
function cacheCust(c,adminFlag?){
  if(c){localStorage.setItem('sw_cust_cache',JSON.stringify(c));localStorage.setItem('sw_is_admin_cache',adminFlag?'1':'0');}
  else{localStorage.removeItem('sw_cust_cache');localStorage.removeItem('sw_is_admin_cache');}
}
var invStock={};
var dashStats=null;
var atRiskCustomers=null;
// Panel admin — ficha de cliente, búsqueda de pedidos, auditoría, horario, reportes,
// calificaciones y selección múltiple para acciones en lote (ver #94-99/#113).
var custDetailPhone='',custDetail=null,custDetailErr='';
var searchQ='',searchStatus='',searchResults=null,searchTruncated=false;
var auditLog=null;
var storeHoursForm=null,storeHoursMsg='';
var reportFrom='',reportTo='',reportData=null,reportErr='';
var ratingsList=null,ratingsMinStars=0,ratingsOnlyComments=false,ratingsOnlyConsented=false;
var prepListData=null,timeReportData=null,problemAddressesData=null,marketingContentData=null;
var promoCodesData=null,pcCode='',pcType='percent',pcValue='',pcMaxUses='',pcMinOrder='',pcValidUntil='',pcCampaignTag='',pcMsg='';
var campaignPerfData=null;
var calendarData=null,calDate='',calChannel='instagram',calTitle='',calCaption='',calWhatsapp='',calPhoto='',calTag='',calMsg='';
var calImageUploadingId=null,calPublishingId=null;
// Clips crudos (Reels/Historias) que el dueño sube una vez por semana — una sesión
// programada aparte (no este código) los procesa y crea las entradas de calendario;
// este bloque solo cubre la subida y la lista de "esperando procesar".
var rawUploads=null,rawVideoUploading=false;
var waitlistData=null;
var bulkSelected={};
var focusIdx=0;
// Preset de sonido de nuevo pedido — antes era un único tono fijo sin forma de
// distinguirlo de otras notificaciones del navegador si el operador tiene varias apps abiertas.
var NOTIF_SOUND_PRESETS={
  campana:[[523,0],[659,.15],[784,.30]],
  timbre: [[880,0],[880,.12],[880,.24]],
  grave:  [[220,0],[330,.14],[440,.28]]
};
var notifSoundPreset=localStorage.getItem('sw_notif_sound')||'campana';
// Modo claro del panel admin — paleta real vía custom properties CSS (.admin-light en
// shell.html), no un filter:invert(1) hue-rotate(180deg) (ese enfoque invertía
// matemáticamente el dorado de marca a un olivo lavado — hallazgo de auditoría visual).
var adminLightMode=localStorage.getItem('sw_admin_light')==='1';
// Antes la única forma de saltar de una herramienta admin (ej. Inventario) a otra
// (ej. Reportes) era volver primero a admin_home — ida y vuelta completa por cada
// cambio de tarea durante un turno. El drawer (H() lo abre desde cualquiera de las 14
// pantallas secundarias) deja saltar directo — hallazgo de auditoría UX, confirmado por
// el dueño para implementar junto con el reordenamiento del grid.
var adminToolsDrawerOpen=false;
function toggleAdminToolsDrawer(){adminToolsDrawerOpen=!adminToolsDrawerOpen;render();}
var recNewPin=null;
var recEmailMasked=null;
// Antes cualquier error del servidor (o incluso el splash de "Verificando...") borraba
// los 3 campos enteros — el peor momento posible para pedirle a un cliente ya frustrado
// (no puede entrar a su cuenta) que vuelva a teclear todo, en vez de solo corregir el
// campo que falló (ej. la fecha con formato equivocado) (hallazgo de auditoría UX, MEDIO).
var recPhone='',recDni='',recBday='';
// El PIN nuevo se mostraba siempre visible en texto plano y grande apenas se generaba —
// riesgo real de shoulder-surfing en un dispositivo compartido (hallazgo de auditoría de
// UX). Ahora arranca oculto (blur) y el cliente decide cuándo revelarlo con un tap.
var recPinRevealed=false;
function togglePinReveal(){recPinRevealed=!recPinRevealed;render();}
var myAddresses=[],myFavorites=[],pickedAddrId=null;
var wPhone='',wAmt='',wMsg='';
var gcPhone='',gcAmt='',gcMsg='';
// Bloquea un segundo tap mientras la compra sigue en curso (mismo patrón que
// _payingInProgress en doOrder) — antes esta pantalla no tenía ningún guard contra
// doble-submit, a diferencia del checkout normal.
var _giftBuyInProgress=false;
var rtStars=0,rtMsg='',chalMsg='',discChalMsg='';
var rtConsent=false,justRatedRef=null;
var cmplStep='form',cmplKind='reclamo',cmplMinor=false,cmplErr='',cmplCode=null,cmplBusy=false;
var adminComplaints=[],cmplFilterStatus='',cmplRespondingId=null;
var addrText='',scheduleMode='now',schedDay='today',schedSlot=null;
var confNom='',confPhone='',confEmail='',confNotes='';
var checkoutLocked=false,lockedMsg='',_payingInProgress=false;
var appliedReward=null;
// appliedPromo: {code, discount} tras validar con validate-promo-code — el descuento se
// vuelve a calcular/validar server-side en prepare-order/place-order (nunca se confía en
// este valor cacheado), así que si el carrito cambia después de aplicar el código y el
// descuento quedó desactualizado, el checkout simplemente rechaza con "el total no
// coincide" en vez de cobrar mal — mismo criterio de seguridad que el resto del checkout.
var appliedPromo=null,promoStatus='';
var previewSigId=null;
var newAddrMsg='',favMsg='';
var cart=[];
var groupCodeFromUrl=null;
// ?grupo=1 — el QR de la tarjeta que va dentro de cada bolsa. Un pedido individual
// entregado a las 12:30 en una oficina YA es una muestra gratis repartida adentro del
// cliente objetivo: el compañero de al lado vio el empaque. Lo que faltaba era el puente
// entre ese sándwich y un pedido grupal, y ese puente es este parámetro.
var wantsNewGroup=false;
(function(){try{var qp=new URLSearchParams(location.search);var rc=qp.get('ref');if(rc)refCode=rc.trim();var gc=qp.get('group');if(gc)groupCodeFromUrl=gc.trim().toUpperCase();var ng=qp.get('grupo');if(ng)wantsNewGroup=true;var dt=qp.get('entrega');if(dt)deliveryTokenFromUrl=dt.trim();
  // ?src=... en el link de un anuncio (ver plan de campaña) — se guarda apenas se detecta
  // y sobrevive aunque el registro pase en otra visita, así un clic de anuncio que hoy solo
  // mira el menú y recién se registra mañana igual queda atribuido a esa campaña.
  var sc2=qp.get('src');if(sc2)localStorage.setItem('sw_src',sc2.trim().slice(0,60));
}catch(e){}})();
// Pedido grupal / de oficina — organiza el que tiene cuenta (actCreateGroupOrder exige
// sesión), pero contribuir NO exige cuenta, solo un nombre (ver actAddGroupItem, server).
var groupCode=null,groupData=null,groupJoinName='',groupMsg='',groupSize='15';
// Código del pedido grupal del que salió el carrito actual (solo para medir el canal).
var pendingGroupCode=null;
// Signatures para los que ya se pidió "avísame cuando vuelva" en esta sesión — solo
// para no dejar tocar el botón dos veces mientras se está en la app; el servidor ya
// deduplica con un unique (customer_phone, sig_id) si igual llega a repetirse.
// Persistido en localStorage — antes vivía solo en memoria, así que un refresh o volver
// más tarde hacía que el botón "Avísame cuando vuelva →" se viera como si nunca se
// hubiera tocado, aunque el backend sí lo haya registrado (restock_notify_requests es
// idempotente) — el cliente mentía sobre el estado real (hallazgo de auditoría UX, MEDIO).
var restockNotified=(function(){try{return JSON.parse(localStorage.getItem('sw_restock_notified')||'[]');}catch(e){return [];}})();
function saveRestockNotified(){try{localStorage.setItem('sw_restock_notified',JSON.stringify(restockNotified));}catch(e){}}
try{groupJoinName=localStorage.getItem('sw_group_name')||'';}catch(e){}
var _groupPollTimer=null;
