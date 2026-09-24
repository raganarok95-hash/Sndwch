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
// ⚠ NO SE PUEDE ABRIR YAPE DESDE EL NAVEGADOR. NO LO VUELVAS A INTENTAR (2026-09-09).
//
// Hasta hoy el botón decía "Copiar número y abrir Yape" y en Android disparaba un
// `intent://` con `S.browser_fallback_url` al Play Store. Lo que el dueño vio al probarlo
// fue lo único que ese código podía hacer: **abrir la ficha de Play Store para DESCARGAR
// Yape**, a alguien que ya la tiene instalada. Nunca abrió la app, ni una vez.
//
// La causa no es el enlace, es Android: un `intent://` solo puede lanzar una actividad que
// declare `android.intent.category.BROWSABLE`, o sea que la app tiene que publicar un deep
// link. Yape NO publica ninguno para terceros — no hay `yape://` documentado ni App Link
// abierto (verificado por búsqueda el 2026-09-09, igual que en la investigación previa de
// 2026-09-05 sobre el QR). Sin eso, el intent no resuelve y el navegador cae al fallback:
// el Play Store. Quitar solo el fallback deja un botón que no hace nada, que es el mismo
// defecto de silencio que ya se había "arreglado" con un aviso en ámbar.
//
// Así que el botón hace UNA cosa y la hace siempre: copiar el número. El cambio de app lo
// hace la persona, que es lo que venía haciendo igual. Es la misma clase de decisión que
// retirar el QR de contacto disfrazado de QR de cobro: mejor no prometer que prometer y
// fallar. **Si alguien vuelve a proponer "abrir Yape", la respuesta está acá.**
function isMobileUA(){return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'');}
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
// SEMILLA, no la fuente. El valor real llega en `get-store-hours` (campo googleClientId,
// ver hours.ts) y lo aplica loadStoreHoursBackground() — así, poner el secret con
// `supabase secrets set GOOGLE_CLIENT_ID=...` prende el botón SIN redesplegar el cliente,
// igual que el píxel de Meta. Mientras siga el marcador, googleConfigured() es falso y todo
// lo de Google no se dibuja: la app se ve exactamente como si no existiera.
var GOOGLE_CLIENT_ID='REEMPLAZA_CON_TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
// Si una visita anterior ya recibió el id del servidor, se recupera ANTES del primer render.
// Sin esto, todo lo que dependa de googleConfigured() en el arranque —la pantalla de
// bienvenida, sobre todo— se decide con el marcador puesto y nunca se muestra.
// `indexOf('.apps.googleusercontent.com')` y no una comprobación laxa: en localStorage puede
// haber quedado cualquier cosa, y arrancar con basura ahí rompería el botón en vez de
// dejarlo apagado, que es el peor de los dos fallos.
try{
  var _gc=localStorage.getItem('sw_gcid');
  if(_gc&&_gc.indexOf('.apps.googleusercontent.com')>0)GOOGLE_CLIENT_ID=_gc;
}catch(e){}
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
  'RECIBIDO':  {c:'var(--sw-warn,#ffa500)',next:'PREPARANDO', icon:'reclamo',label:'Recibido'},
  'PREPARANDO':{c:'#3A86FF',next:'EN CAMINO',  icon:'',       label:'Preparando'},
  'EN CAMINO': {c:'#9b6fff',next:'ENTREGADO',  icon:'moto',   label:'En camino'},
  'ENTREGADO': {c:'var(--sw-ok,#25D366)',next:null,          icon:'check', label:'Entregado'},
  'CANCELADO': {c:'#A5A5A5',next:null,          icon:'close', label:'Cancelado'}
};
var STEPS=['RECIBIDO','PREPARANDO','EN CAMINO','ENTREGADO'];
// Un pedido está TERMINADO cuando su estado no tiene siguiente paso. Se deriva de STATUSES,
// no de una lista aparte: «Mis Pedidos» preguntaba `!=='ENTREGADO'` para decidir qué seguía
// activo, así que un pedido CANCELADO quedaba para siempre bajo «● Activos» con un «Toca
// Actualizar» parpadeando, como si todavía pudiera llegar. Un estado desconocido cuenta como
// activo: mejor que el cliente lo vea arriba a que desaparezca entre los viejos.
function pedidoTerminado(st){return !!STATUSES[st]&&!STATUSES[st].next;}

// B02 (HERBS//CHEESE, "Masa con orégano y parmesano") retirado por decisión del dueño —
// solo lo usaba SIG02 (hoy "The Marinara", antes "The Meatball", movido a B01) y
// CLASSIC//WHITE/FOCACCIA//ARTESANAL
// concentran mejor la variedad real de pan mostrada en el menú. Posible reincorporación
// futura — si vuelve, es solo restaurar esta entrada + volver SIG02.base a 'B02' (mismo
// cambio en SIG_DATA de catalog.ts) y agregar "B02" de vuelta a VALID_BASES ahí también.
// LA CARTA SALE DE `supabase/functions/_shared/carta.ts` (2026-09-24), la misma que usa el
// servidor para cobrar: la trae el bundle nuevo, que corre antes que este archivo. Lo de acá
// abajo solo le pone nombre a cada parte. Antes cada lista estaba escrita aquí y en
// catalog.ts, y `parity` las comparaba con regex. Un cambio de carta se hace allá, una vez.
var CARTA_VIEJA=(window as any).__sndNuevo.carta;
var BASES=CARTA_VIEJA.BASES;
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
// meta a la que haya que subir). (hoy sale de _shared/carta.ts, igual que en el servidor).
var PROTS:{id:string;l:string;s:string;d:string;p15:number;p30:number;pDbl:number;pDbl30:number;vaultOnly?:boolean;sigOnly?:boolean;noDouble?:boolean;noDouble30?:boolean}[]=CARTA_VIEJA.PROTS;
// vaultOnly (T04): seleccionable en ARMA EL TUYO pese a solo aparecer en la receta del
// menú secreto — confirmado por el dueño para tratarlo como exclusivo. No se puede pedir
// por BUILD YOUR OWN aunque siga en este array (SIG_DATA/priceSigBuild lo sigue
// necesitando para tasar ese Signature) — filtro real en byoTops() más abajo. DEBE
// salir de la misma carta que el servidor (hoy sale de _shared/carta.ts, igual que en el servidor).
// T07 (Giardiniera) se retiró con THE CHICAGO (SIG07) el 2026-08-22 — era su topping
// exclusivo y, además, el ÚNICO topping del catálogo que había que producir en casa
// (salmuera de 24-48 h + 3 días de reposo). Si SIG07 vuelve, restaurar la entrada T07 —
// "Giardiniera" / "Encurtido picante", spicy, sigOnly — más T07 en VALID_TOPS/TOP_LABEL/
// SIG_ONLY_TOPS en catalog.ts.
var TOPS:{id:string;l:string;s:string;d?:string;vaultOnly?:boolean;sigOnly?:boolean;spicy?:boolean}[]=CARTA_VIEJA.TOPS;
// C01 renombrado de Americano a Mozzarella 2026-08-08 (decisión del dueño, LLM Council de
// menú) — precio real investigado (Braedt ~S/22.50/kg) similar o menor al proxy genérico
// de queso ya usado en el análisis financiero, y con mejor derretido que el Americano
// procesado que reemplaza — id NO cambia (hoy sale de _shared/carta.ts, igual que en el servidor).
var CHEESE=CARTA_VIEJA.CHEESE;
// `spicy` marca las únicas 2 salsas cuya propia descripción ya declara picor ("calor
// progresivo"/"golpe de picor") — no es una clasificación nueva inventada, solo expone
// visualmente un dato que ya estaba en `d`. Usado por el paso 05 de BUILD YOUR OWN para
// darle jerarquía visual a la única lista plana de 13 ítems sin agrupar/iconos del flujo
// (hallazgo de auditoría UX).
var SAUCES:{id:string;l:string;s:string;d:string;spicy?:boolean;vaultOnly?:boolean;sigOnly?:boolean}[]=CARTA_VIEJA.SAUCES;
var SIGS:any[]=CARTA_VIEJA.SIGS;
// Antes 4 Signatures (SIG02/03/04/06) llevaban el tag "BUILD" — la misma palabra exacta
// que el modo "BUILD YOUR OWN" en la pantalla de inicio, confundiendo a un cliente nuevo
// sobre si estaba viendo un sándwich curado por la casa o el armado libre (hallazgo de
// auditoría UX, CRÍTICO). Ahora todos los Signatures regulares usan "SIGNATURE" (solo
// el menú secreto y THE CHICAGO, los dos más exclusivos, usan "RESERVE"), y ambos tags se
// distinguen tipográficamente del resto del texto — cursiva y más grande, como una
// firma — para reforzar que son curados por la casa.
function sigTypeTag(tag){
  if(tag==='Signature'||tag==='Reserve')return'<i style="font-style:italic;font-size:.7em;color:var(--sw-text-muted,#9DA096)">'+tag+'</i>';
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
// Turkey (SIG10) y Tuna Melt (SIG12) todavía no tienen foto: se pintan sin ella, a la misma
// altura (ver FUENTES.md, «las dos que faltan»).
var SIG_IMG:Record<string,string>=CARTA_VIEJA.SIG_IMG;
// Fotos reales de cada proteína en ARMA EL TUYO — igual que SIG_IMG arriba, solo se
// muestra la miniatura para los códigos que ya tengan un archivo real en img/. Las
// proteínas sin entrada aquí siguen mostrando la tarjeta sin foto (sin placeholder falso).
//
// LAS SEIS SE REHICIERON EL 2026-09-17. Las anteriores eran seis stock sueltos que nunca
// pasaron por `scripts/tratar_fotos.py` —el script existe justo para que un set de fotos
// ajenas no se lea como los resultados de una búsqueda de imágenes— y tres mostraban cosas
// que no están en ninguna receta: un mantel a cuadros azul, tomates cherry, aceitunas.
// Las nuevas salen del mismo tratamiento que los Signatures y su procedencia (id de Adobe
// Stock, licencia y recorte) está anotada en `img/fuente/FUENTES.md`.
//
// ⚠ SON CUADRADAS Y VAN EN .webp A PROPÓSITO. El archivo se usa en DOS sitios con formas
// distintas —la miniatura de 56×56 de esta lista y el hero de 190 px de alto de la pantalla
// de confirmación—, y el cuadrado es lo único que `object-fit:cover` sirve bien en los dos.
// A 1050 px (4.4x los píxeles de las de 500) en JPEG las seis pesaban 1.3 MB, que es lo que
// el cliente baja de golpe al abrir esta pantalla porque las seis miniaturas se ven a la
// vez; en WebP pesan 635 KB sin perder un píxel.
var PROT_IMG:Record<string,string>=CARTA_VIEJA.PROT_IMG;
// Foto de cada bebida de la casa. Hasta ahora las 3 se pintaban con un ícono de línea
// dentro de un círculo: el mismo tratamiento para las tres, sin decir de qué color ni de
// qué es ninguna. Son lo más rentable del catálogo (19-32% de costo contra ~45% de un
// sándwich) y la palanca de attach que el modelo mide, así que se ganan una foto igual
// que una proteína. Un id sin fila acá vuelve al ícono — nunca a un hueco.
var DRINK_IMG:Record<string,string>=CARTA_VIEJA.DRINK_IMG;
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
// ⚠ ESTE BLOQUE DESCRIBÍA UNA CALIBRACIÓN QUE NUNCA SE APLICÓ, y hasta el 2026-09-13 tenía
// CUATRO de sus cinco cifras equivocadas (decía R02 40, R05 120, R03 160 y R04 120; los
// valores reales son 20, 160, 320 y 160). Describía además otra BASE: "puntos por cada sol
// que perdona la recompensa". La recalibración que sí se aplicó el 2026-09-05 se hizo contra
// lo que a NOSOTROS nos cuesta honrar el canje, que es lo único que iguala el costo del
// programa — ver el comentario largo de REWARDS en catalog.ts, que es la fuente.
//
// TODAS DEVUELVEN ~1.5% (lo que nos cuesta ÷ los puntos que pide):
//   R02  20 pts, nos cuesta S/0.27  ->  1.33%
//   R03 320 pts, nos cuesta S/4.61  ->  1.44%
//   R04 160 pts, nos cuesta S/2.47  ->  1.54%
//   R05 160 pts, nos cuesta S/2.34  ->  1.46%
//   R06 400 pts, nos cuesta S/5.90  ->  1.48%   ← el ancla, no se mueve
// Antes había un factor 4.3 entre la más barata y la más cara PARA EL NEGOCIO: al cliente le
// convenía canjear siempre "subir a 30CM" y las otras cuatro eran decorado, y el programa
// terminaba pagando el canje más caro cada vez. Hoy la dispersión es 1.2x.
//
// Un comentario con los números cambiados es peor que ninguno: el próximo que recalibre parte
// de él. Salió del mismo día que el bono del invitado — la recalibración movió los valores y
// no volvió a mirar lo que estaba escrito al lado.
// Las recompensas salen de la carta (`_shared/carta.ts`), con su `tipo`: salsa, subir30, doble,
// bebida o sandwich. La lógica pregunta por el tipo, nunca por el id. Los puntos son SEMILLA: los
// reales vienen de `catalog_prices` (categoría 'reward') en get-catalog.
var RWDS:{id:string;tipo:string;pts:number;n:string;s:string;d:string;sizeOnly?:string}[]=CARTA_VIEJA.RWDS;
function recompensaDeTipo(tipo:string){return RWDS.filter(function(x){return x.tipo===tipo;})[0];}
// BEBIDAS Y SIDES — solo el catálogo de bebidas de la casa (D06-D08). D01-D05
// (chicha morada, inca kola, agua, papas, galleta) se retiraron a pedido del dueño:
// eran solo reventa de botellas/paquetes, sin nada distinto a lo que vende cualquier
// otro local — el catálogo ahora se queda solo con las bebidas propias sin jugos.
// `icon` distingue visualmente las 3 infusiones en BEBIDAS Y SIDES — antes eran
// idénticas salvo el texto (hallazgo de auditoría UX), sin nada que distinguirlas de un
// vistazo en una lista donde se comparan una junto a otra.
// PRECIOS +S/2 el 2026-08-22, decisión del dueño. El margen de 61-84% que el negocio venía
// usando para las bebidas costeaba SOLO el insumo, nunca el envase.
// El envase YA ESTÁ COTIZADO Y COMPRADO (dueño 2026-09-05): S/138 por 200 unidades = S/0.69
// la botella. Con eso, y costeando por MEDIO LITRO —que es el envase real, no el vaso de
// 350 ml que suponía el recetario— las tres quedan en 19-32% de costo, menos de la mitad del
// techo de 45%: son la parte más rentable del catálogo (ver modelo/costo_bebidas.py).
// Semilla en _shared/carta.ts; el precio real vive en catalog_prices.
// D09 (The Spice // Chai) sale del menú el 2026-09-06, decisión del dueño. Costeado por
// BOTELLA DE MEDIO LITRO —el envase real que ya se compró, no el vaso de 300 ml que suponía
// el recetario— quedaba en 42.5% de costo contra 19-32% de las otras tres. Era la única
// bebida cerca del techo de 45%, y por un motivo estructural: media botella de chai es media
// botella de LECHE, un insumo que se compra; en las otras tres el volumen es agua.
// Para restaurarlo: esta entrada más D09 en SIDE_PRICE/SIDE_LABEL (catalog.ts) y una fila en
// catalog_prices. (Se describe en prosa a propósito: scripts/parity.mjs parsea este array con
// regex y tomaría un literal comentado como una bebida viva, reportando una falsa diferencia
// con el servidor.)
var SIDES=CARTA_VIEJA.SIDES;

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
// dispositivo. #o-sched sigue existiendo como input oculto, ahora con el desfase de Lima
// ("YYYY-MM-DDTHH:mm-05:00"): el resto del flujo (effectiveOrderDate, doOrder) lo lee con
// `new Date()` y obtiene el mismo instante desde cualquier zona.
var SCHED_LEAD_MINUTES=20;
// ⚠ LAS FRANJAS SON HORAS DE LIMA, no del teléfono (A5, 2026-09-24). Se armaban con
// `setHours` y `new Date("AAAA-MM-DDTHH:mm")`, que usan la zona del DISPOSITIVO: quien pedía
// desde Madrid elegía «20:00» y el pedido quedaba para las 13:00 de Lima, sin ningún error.
// Toda fecha de franja pasa por `fechaEnLima()`, que escribe el desfase explícito. Lima no
// tiene horario de verano, así que el desfase es fijo.
var LIMA_DESFASE='-05:00';
function diaEnLima(d:Date):string{
  return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
}
function fechaEnLima(dia:string,minutos:number):Date{
  return new Date(dia+'T'+String(Math.floor(minutos/60)).padStart(2,'0')+':'+String(minutos%60).padStart(2,'0')+':00'+LIMA_DESFASE);
}
// El mediodía de Lima de HOY o MAÑANA: un instante que cae en ese día de Lima desde cualquier zona.
function schedDateForDay(dayKey){return new Date(fechaEnLima(diaEnLima(new Date()),12*60).getTime()+(dayKey==='tomorrow'?86400000:0));}
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
    var slotDate=fechaEnLima(diaEnLima(d),totalMin);
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
  // Con el desfase escrito: «2026-10-10T20:00-05:00» es el mismo instante en cualquier teléfono.
  return diaEnLima(schedDateForDay(schedDay))+'T'+schedSlot+LIMA_DESFASE;
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
    var sub=d.toLocaleDateString('es-PE',{timeZone:'America/Lima',weekday:'short',day:'numeric',month:'short'});
    return'<div onclick="'+(closed?'':'pickSchedDay(\''+dd.key+'\')')+'" style="flex:1;text-align:center;background:'+(closed?'var(--sw-card2,#171A14)':(sel?'var(--sw-card2,#171A14)':'var(--sw-card,#1B1F18)'))+';border:1px solid '+(sel&&!closed?GOLD:'#2C3228')+';border-radius:8px;padding:9px 6px;cursor:'+(closed?'not-allowed':'pointer')+';opacity:'+(closed?.4:1)+'"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:#fff">'+dd.l+'</div><div style="font-family:\'EB Garamond\',serif;font-size:9px;color:var(--sw-text-muted,#9DA096);text-transform:capitalize;margin-top:1px">'+(closed?'CERRADO':esc(sub))+'</div></div>';
  }).join('');
  var slots=schedSlotsDetailed(schedDay);
  var libres=slots.filter(function(s){return !s.full;});
  var slotsHTML=slots.length
    ?'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;max-height:160px;overflow-y:auto">'+slots.map(function(s){
        if(s.full)return'<div title="Esa hora ya está llena" style="background:var(--sw-card2,#171A14);border:1px solid var(--sw-border,#2C3228);border-radius:20px;padding:7px 14px;cursor:not-allowed;opacity:.45;font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:var(--sw-text-muted,#9DA096);text-decoration:line-through">'+s.t+'</div>';
        var sel=schedSlot===s.t;return'<div onclick="pickSchedSlot(\''+s.t+'\')" style="background:'+(sel?'var(--sw-card2,#171A14)':'var(--sw-card,#1B1F18)')+';border:1px solid '+(sel?GOLD:'#2C3228')+';border-radius:20px;padding:7px 14px;cursor:pointer;font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:'+(sel?'#fff':'#9DA096')+';box-shadow:'+(sel?SHADOW_GOLD:'none')+'">'+s.t+'</div>';
      }).join('')+'</div>'
      +(libres.length<slots.length?'<div style="margin-top:8px;font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#9DA096)">Las horas tachadas ya están completas — la cocina no da abasto para más pedidos en esa franja.</div>':'')
    :'<div style="margin-top:10px;font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#9DA096)">No hay horarios disponibles ese día.</div>';
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
// La ventana como HORA, que es como la dibujan las maquetas («Llega 7:40 – 8:05 p.m.»).
// Antes de pagar se estima con la cola que se ve; después, la del pedido manda: el servidor
// la fijó al crearlo (promised_from/promised_to) y es la que se compara al entregar.
function horaLima(ms:number):string{
  // «9 p.m.», no «9:00 p.m.»: la hora en punto se dice sin los ceros, como en las maquetas.
  return new Date(ms).toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'numeric',minute:'2-digit',hour12:true}).replace(/\s?a\.?\s?m\.?/i,' a.m.').replace(/\s?p\.?\s?m\.?/i,' p.m.').replace(':00 ',' ');
}
function textoVentana(desde:number,hasta:number):string{
  var a=horaLima(desde),b=horaLima(hasta),sufA=a.slice(-5),sufB=b.slice(-5);
  return(sufA===sufB?a.slice(0,-5):a)+' – '+b;
}
function ventanaEstimadaTexto(programadoPara?:string|null):string{
  var ancho=(ESTIMATED_DELIVERY_RANGE[1]-ESTIMATED_DELIVERY_RANGE[0])*60000;
  var prog=programadoPara?Date.parse(programadoPara):NaN;
  if(isFinite(prog))return textoVentana(prog,prog+ancho);
  var r=estimatedDeliveryRange(),ahora=Date.now();
  return textoVentana(ahora+r[0]*60000,ahora+r[1]*60000);
}
function ventanaDelPedido(o:any):string{
  var d=Date.parse(o&&o.promised_from),h=Date.parse(o&&o.promised_to);
  return isFinite(d)&&isFinite(h)?textoVentana(d,h):'';
}
// «dentro» / «tarde» del detalle de un pedido: se compara la entrega contra lo prometido,
// nunca contra la ventana de hoy.
function llegoDentro(o:any):boolean|null{
  var h=Date.parse(o&&o.promised_to),e=Date.parse(o&&o.delivered_at);
  return isFinite(h)&&isFinite(e)?e<=h:null;
}
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
// true cuando el distrito lo puso el pin del mapa y no el cliente: cambia el texto del
// selector de pregunta a confirmación (ver districtPickerHTML).
var deliveryDistrictFromPin=false;
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
// Solo B03 (Focaccia) lleva recargo.
//
// ⚠ EL DINERO SE CALCULA CON EL MISMO MÓDULO QUE EL SERVIDOR (2026-09-24). Las reglas —recargo
// del pan, combo, topes de las recompensas, salsa extra, organizador— y el cálculo del total
// viven en supabase/functions/_shared/dinero.ts, que el servidor usa para cobrar y la base nueva
// (src/nuevo/dinero.ts) le presta a este código. Acá ya no se escribe ningún número de dinero:
// se lee de ahí. Antes eran dos copias y con la focaccia daban totales distintos.
var DINERO=(window as any).__sndNuevo.dinero;
var REGLAS_DINERO=DINERO.reglas;
var BASE_SURCHARGE=REGLAS_DINERO.recargoPan;
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
// La fórmula, separada del "de dónde salen los km", para que se pueda comparar contra la
// del servidor con una tabla compartida (tests/fixtures/tarifa-envio.json). Lleva el MISMO
// nombre que su gemela en supabase/functions/api/actions/orders.ts a propósito: si algún
// día una de las dos cambia y la otra no, hay dos pruebas que fallan en vez de un cliente
// que muestra un monto y un servidor que cobra otro.
function deliveryFeeForKm(km){
  return Math.ceil(Math.max(DELIVERY_MIN_FEE,km*DELIVERY_KM_RATE)*2)/2;
}
// Los km cobrables y el envío a una dirección GUARDADA (con pin), con la misma fórmula que el
// checkout y sin la comisión de tarjeta (Yape es el método por defecto). null si no tiene pin
// o queda fuera de cobertura. Lo usan el grupal («envío 4.3 km») y el pedido fijo («te sale»):
// antes de existir, cada pantalla habría tenido su propia copia de la cuenta.
function kmADireccion(a:any):number|null{
  if(!a||typeof a.lat!=='number'||typeof a.lon!=='number')return null;
  var km=Math.round(haversineKm(a.lat,a.lon,STORE_LAT,STORE_LON)*DELIVERY_ROAD_FACTOR*100)/100;
  return isFinite(km)&&km<=DELIVERY_MAX_KM?km:null;
}
function envioADireccion(a:any):number|null{
  var km=kmADireccion(a);
  return km==null?null:deliveryFeeForKm(km);
}
function deliveryFeeBase(){
  var km=deliveryKmNow();
  if(km===null){
    // Sin pin se cae a la zona, exactamente como antes. Es el respaldo para un shell viejo
    // servido por un service worker desactualizado; el checkout exige el pin antes de pagar.
    var z=DELIVERY_PRICE_ZONES.find(function(x){return x.id===deliveryZone;});
    return z?z.fee:0;
  }
  return deliveryFeeForKm(km);
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
// Las reglas del dinero, leídas del módulo compartido (ver DINERO arriba). Quedan con su nombre
// de siempre porque los textos de la app las interpolan («el combo te descuenta S/1»). El porqué
// de cada valor está en supabase/functions/api/catalog.ts, junto a donde se cobra.
var COMBO_DISCOUNT_PER_PAIR=REGLAS_DINERO.comboPorPar;
var RESERVE_SIGS=new Set(REGLAS_DINERO.reservas);
// La bebida gratis de hora valle está RETIRADA (2026-09-05): su ventana es una lista vacía.
var OFFPEAK_DRINK_PROMO_HOURS_LIMA:number[][]=REGLAS_DINERO.valleHorasLima;
var OFFPEAK_DRINK_PROMO_CAP=REGLAS_DINERO.valleTope;
var ORGANIZER_FREE_MIN_SANDWICHES=REGLAS_DINERO.organizadorDesde;
var EXTRA_SAUCE_PRICE=REGLAS_DINERO.salsaExtra;
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
// Los límites del monto estaban ESCRITOS A MANO en dos sitios del cliente: en el texto que
// lee el cliente ("Monto entre S/10 y S/500") y en la validación de doGiftCardBuy(). El
// servidor los tiene como constantes desde siempre, así que eran dos números sueltos que
// nadie iba a sincronizar el día que el dueño moviera el tope — la misma clase de promesa
// rota que ya costó tres textos de marketing desactualizados. `npm run parity` compara
// estos dos contra GIFT_CARD_AMOUNT_MIN/MAX del servidor.
var GIFT_CARD_AMOUNT_MIN=10;
var GIFT_CARD_AMOUNT_MAX=500;
// Lo que recibe quien CREA su cuenta. Estaba escrito a mano dentro del texto de la pantalla
// de registro ("Bono de bienvenida: +40 pts"), con un comentario que decía "DEBE coincidir" y
// NADA que lo verificara — la clase exacta de promesa pública que este repo ya vio romperse
// tres veces. Ahora se interpola desde acá y `npm run parity` lo compara contra el servidor.
// Solo se usa para el copy: quien otorga los puntos es el servidor.
var WELCOME_BONUS_POINTS=40;
// Lo que recibe EL INVITADO al pagar su primer pedido — tiene que valer exactamente lo
// mismo que R05 (BEBIDA // GRATIS), porque eso es lo que la app le promete en tres sitios
// y lo que el dueño copia a WhatsApp. Estuvo en 120 desde el 2026-08-20 y se quedó ahí
// cuando R05 subió a 160 el 2026-09-05: ocho días prometiendo una bebida que el bono no
// alcanzaba a pagar. `npm run parity` compara las dos cosas ahora. Solo se usa para el
// copy — quien otorga los puntos de verdad es el servidor. DEBE coincidir con
// REFERRAL_BONUS_POINTS en supabase/functions/api/env.ts.
var REFERRAL_BONUS_POINTS=160;
// Lo que recibe QUIEN INVITA cuando su referido paga su primer pedido — 400 pts = un
// sándwich 15CM gratis. Solo se usa para el copy; quien otorga los puntos es el servidor.
// DEBE coincidir con REFERRER_REWARD_POINTS en supabase/functions/api/env.ts, que a su vez
// DEBE valer exactamente lo mismo que R06 — las dos cosas las verifica `npm run parity`.
// Es lo que hace CIERTA la frase "un sándwich 15CM gratis" que ve el cliente: si alguien
// mueve uno de los dos números y no el otro, la app promete un sándwich que la recompensa
// ya no alcanza a pagar.
// ── LOS DOS RETOS MENSUALES ──────────────────────────────────────────────────────────
// El servidor decide con `CHALLENGE_TARGET_ORDERS`/`CHALLENGE_BONUS_POINTS` y
// `DISCOVERY_TARGET_FLAVORS`/`DISCOVERY_BONUS_POINTS` (actions/customer.ts). El cliente
// escribía los cuatro números A MANO en el texto del perfil — "Haz 3 pedidos pagados este
// mes y gana 50 puntos extra" — que es exactamente el defecto que este repo ya documentó
// en grande: un número escrito a mano en un texto es una promesa que se va a romper, y el
// día que se rompa nadie se entera, porque es texto y no cálculo.
//
// Ahora se interpolan, y `npm run parity` compara los cuatro contra el servidor.
var CHALLENGE_TARGET_ORDERS=3;
var CHALLENGE_BONUS_POINTS=50;
var DISCOVERY_TARGET_FLAVORS=3;
var DISCOVERY_BONUS_POINTS=50;
var REFERRER_REWARD_POINTS=400;
// #55 — La escalera de referidos, solo para pintarla. Los puntos los otorga el servidor
// (grant_referral_milestone); acá nunca se suma nada. DEBE coincidir con
// REFERRAL_MILESTONES en supabase/functions/api/env.ts — lo verifica `npm run parity`.
//
// Existe en el cliente porque un premio escalonado que nadie VE es exactamente igual que
// no tenerlo: lo que hace que alguien invite al tercero es saber que el tercero paga
// distinto, y eso solo puede decirlo la pantalla de referidos.
// `covers`/`veces` dicen qué recompensa nombra cada etiqueta. Sirven para dos cosas y las dos
// hacen falta: `npm run parity` comprueba que los puntos alcancen para pagarla, y
// `referralLadderHTML` deja de nombrarla si el dueño la repricea desde el panel por encima
// del escalón. El primer escalón decía 120 con la bebida en 160 — pasaba el chequeo viejo
// porque 120 es múltiplo de la salsa extra (20).
var REFERRAL_MILESTONES=[
  {count:3,points:160,label:'Una bebida de la casa gratis',covers:'R05',veces:1},
  {count:5,points:400,label:'Otro sándwich 15CM gratis',covers:'R06',veces:1},
  {count:10,points:800,label:'Dos sándwiches 15CM gratis',covers:'R06',veces:2}
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
// Carga de cada hora (pedidos + lugares apartados por pedidos fijos), la misma cuenta con la
// que el servidor rechaza. Hace falta además de `fullHours` por un solo caso: la hora que le
// estamos GUARDANDO a este cliente. El servidor no le cuenta su propio lugar, así que para él
// esa hora solo está llena si lo está sin su lugar.
var cargaPorHora:Record<string,number>={};
// El pedido fijo del que sale el carrito actual, y la hora (ISO, inicio de hora) que ese fijo
// tiene apartada. Los pone pedirFijoAhora(); se limpian con el carrito.
var pendingRecurringId:string|null=null,miHoraApartada:string|null=null;
// ¿Está llena la hora en la que caería esta fecha? Se compara por INICIO DE HORA porque es
// como lo agrupa el servidor; comparar por minuto exacto no marcaría nada nunca.
function hourIsFull(d){
  // En UTC y no en la zona del teléfono: Lima va en horas enteras, así que la hora UTC truncada
  // es la de Lima; con `setMinutes` un teléfono en la India (+5:30) caía en la media hora.
  var h=new Date(d);h.setUTCMinutes(0,0,0);
  var k=h.toISOString();
  if(miHoraApartada&&k===miHoraApartada&&typeof cargaPorHora[k]==='number')return cargaPorHora[k]-1>=maxPerHour;
  if(!fullHours.length)return false;
  return fullHours.indexOf(k)>=0;
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
//
// ⚠ Y respeta el DERECHO DE OPOSICIÓN (Ley 29733). Va acá, en el envoltorio, y no en cada
// uno de los cinco sitios que reportan un evento: ese es justo el lugar donde el sexto se
// olvida, y un evento que se escapa no rompe nada visible — la promesa legal se incumple
// en silencio. El servidor corta por su lado (`reportPurchaseToMeta`), porque un cliente
// que se opone desde el celular no querría que su compra se reporte igual desde el otro
// camino.
function fbTrack(event,params?,eventId?){
  try{
    if(cust&&(cust as any).ad_tracking_opt_out)return;
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
  // `recurringId`: el pedido fijo del que sale este carrito. Viaja por acá porque este objeto
  // ya llega a los TRES caminos de cobro (Yape/crédito, reserva con tarjeta y su confirmación);
  // un campo suelto en uno solo dejaría al otro sin gastar el lugar apartado.
  return {fbp:get('_fbp')||'',fbc:get('_fbc')||'',ua:navigator.userAgent||'',groupCode:pendingGroupCode||'',recurringId:pendingRecurringId||''};
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
// null = todavia no eligio hermano, y eso pinta la pantalla de eleccion (sOEleccion).
// Antes arrancaba en 'sig', asi que esa pantalla no existia: el cliente caia directo en
// la lista de Signatures y la decision que estructura la marca era una barra de pestanas.
//
// ⚠ SE RECUERDA EL LADO, PERO SOLO PARA NO VOLVER A PREGUNTAR (decision del dueno,
// 2026-09-17: "que recuerde la eleccion anterior pero no de manera invasiva").
//
// La pantalla de eleccion es para quien llega por primera vez. A un cliente que ya pidio
// diez veces, preguntarle en cada visita de quien es el pedido es un toque de mas cada vez
// -- y la friccion que mas se nota es la que se repite. Desde la segunda visita entra
// directo a su lado.
//
// No es invasivo porque NO lo encierra: la barra de los dos hermanos sigue arriba del
// catalogo, asi que cambiarse es un toque y esta a la vista. Recordar sin salida seria
// invasivo; recordar con la puerta abierta al lado es lo contrario.
//
// El valor vive en localStorage y se acepta SOLO si es uno de los tres lados reales: un
// localStorage manipulado o heredado de una version futura no puede dejar la app en un
// estado que ningun boton produce.
var homeTab: string|null = (function(){
  try{
    var v = localStorage.getItem('sw_lado');
    return (v === 'sig' || v === 'byo') ? v : null;   // 'drink' fue un lado un dia; ya no
  }catch(e){ return null; }   // navegacion privada, cookies bloqueadas: se pregunta igual
})();
// Se llama desde los DOS sitios que cambian de lado —la pantalla de eleccion y la barra de
// arriba del catalogo— para que no haya uno que recuerde y otro que no.
// ── ELEGIR UN LADO ES ENTRAR A ESE LADO, NO CAMBIAR UNA PESTAÑA (2026-09-17) ──────────
//
// Hasta hoy tocar un hermano solo fijaba `homeTab` y volvía a pintar LA MISMA página con
// otra lista debajo. El dueño lo dijo así: «no importa dónde pulse me manda otra vez a una
// web reskineada de la anterior. ¿Si selecciono derecha o izquierda no debería ir
// directamente a la opción respectiva?». Tenía razón: la elección era un interruptor
// decorativo encima del home de siempre.
//
// Ahora cada lado ES una pantalla:
//   · SANDO  → su mosaico de Signatures, que es su carta cerrada.
//   · WICHO  → el armador, directo desde el pan. No hay lista intermedia que elegir antes
//     de elegir: su lado ES armar, así que entrar a su lado es empezar a armar.
//   · Bebidas → su propia pantalla, que ya existía y era una fila perdida en el home.
// El lado queda guardado, así que quien vuelve entra directo al suyo sin pasar otra vez por
// la puerta; cambiarlo es un gesto explícito (`volverALaPuerta`).
function elegirLado(id){
  homeTab = id;
  try{ localStorage.setItem('sw_lado', id); }catch(e){}
  if(id==='byo'){
    // Se entra al armador LIMPIO. Sin esto, quien vuelve a entrar por WICHO se encuentra a
    // medio armar el sándwich de la vez pasada, sin haber pedido nada.
    if(typeof resetBuilder==='function')resetBuilder();
    mode='byo';byoStep=0;sndScreen='o_build';render();return;
  }
  sndScreen='o_home';render();
}
// BEBIDAS NO ES UN TERCER HERMANO. Llego a serlo por un rato y estaba mal: entrar a bebidas
// desde la carta de SANDO teñia toda la pantalla de azul, o sea que el producto cambiaba de
// dueño por haber tocado una fila. Ahora es una pantalla alcanzable desde los dos lados que
// conserva el color del lado desde el que se entro, y recuerda por donde volver — se llega
// desde la carta, desde el armador y desde el checkout, y las tres vueltas son distintas.
var bebidasVolverA='o_home';
function irABebidas(desde){
  bebidasVolverA=desde||'o_home';
  sndScreen='o_sides';render();
}
// Volver a la puerta: olvida el lado guardado y vuelve a mostrar la cara partida. Es la
// ÚNICA forma de cambiar de hermano, y es a propósito que sea explícita — un interruptor
// siempre visible convertiría los dos mundos en dos pestañas otra vez.
function volverALaPuerta(){
  homeTab=null;
  try{ localStorage.removeItem('sw_lado'); }catch(e){}
  sndScreen='o_home';render();
}
// De quién es la pantalla ahora mismo. Lo lee el CSS por `[data-lado]` en <html> y reasigna
// las superficies de toda la app: el lado de SANDO es verde, el de WICHO azul. No es un
// tema claro/oscuro — es una decisión del cliente que el color acompaña.
// Se aplica en un solo sitio para que ninguna pantalla pueda quedarse en el lado
// equivocado: el defecto sería mudo, se vería "bien", solo que del color de otro.
function setLado(l){
  try{
    var h=document.documentElement;
    if(l==='wicho')h.setAttribute('data-lado','wicho');
    else h.removeAttribute('data-lado');
  }catch(e){}
}
// A dónde vuelve el botón "←" en pantallas legales que se abren desde más de un lugar
// (registro, perfil, o el pie de contacto del home) — sin esto, sPLegal() solo podía
// adivinar el origen mirando si `cust` existe, y desde el pie del home eso mandaba a un
// invitado de vuelta al login en vez de al home. Se fija justo antes de cada navegación.
var bkTo=null;
var mode=null,sigId=null,base=null,prot=null,cheese=null;
var tops=[],sauces=[],size=null,doubleProt=false,extraSauce=false;
// Paso actual del asistente de ARMA EL TUYO. El orden REAL es el del mostrador de Subway y
// vive en `BYO_STEP_LABELS` (04-armado): 0=pan, 1=proteína, 2=queso, 3=vegetales, 4=salsas.
// ⚠ Este comentario decía "2=toppings, 3=queso" — el orden de ANTES del 2026-09-05, cuando
// se intercambiaron los pasos 2 y 3. Doce días después el riel seguía anunciando el paso
// equivocado por ese mismo descuido, así que acá no se repite la lista: se nombra dónde
// vive. Ver sOBuild/byoStepBack/byoStepNext.
var byoStep=0;
// Lo que cuenta la pantalla del menú secreto además de la receta: llega en get-catalog
// (catalog.ts · SECRET_EXTRA). Vacío hasta que el catálogo responda.
var SECRET_EXTRA:{endsAt:string|null,hints:{t:string,s:string}[],past:{name:string,blurb:string,mes:string}[]}={endsAt:null,hints:[],past:[]};
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
// Entrar con correo y código de 6 dígitos (2026-09-23). `authPaso` es en qué mitad del
// flujo está: 'correo' pide la dirección, 'codigo' pide los 6 dígitos. `authProof` es la
// prueba FIRMADA por el servidor de que ese correo se verificó — viaja al registro y es lo
// único que autoriza crear una cuenta con ese correo. `authPinFallback` deja volver al
// login viejo (teléfono + PIN), que siguen usando las cuentas creadas antes y el panel.
var authPaso='correo',authEmail='',authProof='',authMasked='',authPinFallback=false;
// Vuelve el login por correo a su estado inicial. Se llama al terminar de entrar, al terminar
// de registrarse y al cerrar sesión — un solo lugar, porque la prueba de correo que queda
// viva después de usarse la manda el PRÓXIMO registro hecho en este equipo.
function limpiarLoginPorCorreo(){authPaso='correo';authEmail='';authProof='';authMasked='';authPinFallback=false;}
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
// Key de Google Maps — llega en get-store-hours. Vacía = la app usa Nominatim/OSM, que es
// como funcionó hasta el 2026-09-10 y sigue siendo el respaldo (ver buscarDireccion()).
var googleMapsKey='';
var pushSubscribed=false,pushMsg='';
// Derecho de oposición a la medición publicitaria (Ley 29733) — ver toggleAdTracking().
var adOptOutMsg='';
// ── DOS PRODUCTOS APAGADOS PARA LA APERTURA (dueño, 2026-09-23) ─────────────────────
// GEMELOS de PLAN_SEMANAL_ACTIVO / TARJETA_REGALO_ACTIVA en supabase/functions/api/env.ts.
// El servidor ya rechaza las tres acciones; esto es para que la app no OFREZCA algo que va
// a ser rechazado, que es la clase de promesa rota que este repo persigue.
// Los dos se retiran por el mismo motivo: piden plata o puntos por adelantado a alguien que
// todavía no conoce el negocio. Nada se borra — vuelven cuando haya clientes que repitan.
// ⚠ Si se prenden acá, hay que prenderlos TAMBIÉN en el servidor, o pasa lo contrario: la
// pantalla deja pedirlo y la acción lo rechaza.
var PLAN_SEMANAL_ACTIVO=false;
var TARJETA_REGALO_ACTIVA=false;
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
// El modo cocina se ancla al ID del pedido, no a su posición en la lista. La lista se
// reordena sola: el poll trae pedidos nuevos cada 25 s y sortedActiveOrders() los pone
// donde les toca por prioridad, así que un pedido nuevo puede meterse DELANTE del que el
// dueño está mirando. Con el ancla en el índice, la pantalla cambiaba de pedido sola y el
// botón de abajo —mismo sitio, mismo tamaño— pasaba de "marcar EN CAMINO el de Rosa" a
// "confirmar el pago del nuevo" con el dedo ya bajando. Medido: el onclick pasaba de
// updateStatus('ROSA','EN CAMINO') a confirmAndAdvance('NUEVO'). Confirmar un pago Yape
// que nadie miró contra la cuenta es exactamente lo que el lector de comprobantes existe
// para NO hacer solo.
var focusRef='';
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
// LOS IDS DE DIRECCIÓN SON NÚMEROS (bigint en `saved_addresses`), pero viajan como TEXTO en
// cada onclick (`pickAddr('5')`). Comparados con === nunca coinciden: elegir una dirección
// guardada no hacía nada, y ninguna prueba lo veía porque todas simulaban ids de texto.
// Toda comparación de un id que pasó por el HTML va por acá.
function mismoId(a:any,b:any):boolean{return a!=null&&b!=null&&String(a)===String(b);}
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
// Pantalla legal pedida por ?legal=... — la aplica el arranque en 08-*.
var legalFromUrl=null;
// ?grupo=1 — el QR de la tarjeta que va dentro de cada bolsa. Un pedido individual
// entregado a las 12:30 en una oficina YA es una muestra gratis repartida adentro del
// cliente objetivo: el compañero de al lado vio el empaque. Lo que faltaba era el puente
// entre ese sándwich y un pedido grupal, y ese puente es este parámetro.
var wantsNewGroup=false;
// ?fijo=ID[&franja=HH:MM] — el aviso del pedido fijo lleva acá. `franja` es la hora que el
// aviso ofreció cuando la de siempre se llenó: se respeta, para que el toque haga lo que el
// aviso dijo.
var fijoFromUrl:string|null=null,franjaFromUrl:string|null=null;
(function(){try{var qp=new URLSearchParams(location.search);var rc=qp.get('ref');if(rc)refCode=rc.trim();var gc=qp.get('group');if(gc)groupCodeFromUrl=gc.trim().toUpperCase();var ng=qp.get('grupo');if(ng)wantsNewGroup=true;var dt=qp.get('entrega');if(dt)deliveryTokenFromUrl=dt.trim();
  var fj=qp.get('fijo');if(fj)fijoFromUrl=fj.trim();var fr=qp.get('franja');if(fr&&/^[0-2][0-9]:[0-5][0-9]$/.test(fr))franjaFromUrl=fr;
  // ?src=... en el link de un anuncio (ver plan de campaña) — se guarda apenas se detecta
  // y sobrevive aunque el registro pase en otra visita, así un clic de anuncio que hoy solo
  // mira el menú y recién se registra mañana igual queda atribuido a esa campaña.
  var sc2=qp.get('src');if(sc2)localStorage.setItem('sw_src',sc2.trim().slice(0,60));
  // ?legal=... — enlace DIRECTO a cada texto legal. Hasta el 2026-09-12 los tres solo se
  // alcanzaban tocando dentro de la app, así que el negocio no tenía ninguna URL pública que
  // dar cuando alguien la pide por escrito. Y la piden: Google no publica la pantalla de
  // consentimiento de OAuth sin un link a la Política de Privacidad y a las Condiciones del
  // Servicio, y Meta pide lo mismo para verificar el negocio.
  //
  // No cambia NI UNA COMA del texto legal — solo agrega una forma de llegar a él. La pantalla
  // es la misma que ya se ve desde Mi Perfil.
  var lg=qp.get('legal');
  if(lg){
    lg=lg.trim().toLowerCase();
    // Términos y Política de Privacidad viven en la MISMA pantalla (sPLegal), así que las
    // dos claves llevan ahí. Google pide dos links distintos y los acepta aunque apunten a
    // la misma página; lo que no acepta es que no exista ninguno.
    if(lg==='privacidad'||lg==='terminos'||lg==='términos')legalFromUrl='p_legal';
    else if(lg==='devoluciones'||lg==='cambios')legalFromUrl='p_returns';
    else if(lg==='reclamaciones'||lg==='libro')legalFromUrl='p_complaints';
  }
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
