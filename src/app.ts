'use strict';
var SB_URL='https://rjosezuoyngiadunfzyn.supabase.co';
var SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqb3NlenVveW5naWFkdW5menluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1ODA0MTgsImV4cCI6MjA5MjE1NjQxOH0.fl4gayRXQvplNPzhf4TEzyWqrZXxXYBYHV0tMdJw1fs';
var API_FN_URL=SB_URL+'/functions/v1/api';
// ACCENT2 — segundo acento (ya se usaba suelto en PREPARANDO/ETA/programado antes de
// tener nombre propio) para diferenciar jerarquía: dorado = acción primaria, azul =
// acción secundaria/informativa. Sin esto, un botón "outline" y uno "filled" solo se
// distinguían por el relleno, ambos en el mismo dorado.
var WA='51930957640',GOLD='#CBA258',ACCENT2='#3A86FF';
// Identidad legal del negocio — mostrada en el pie de página, en Términos, y como
// identificación del proveedor en el Libro de Reclamaciones (exigido por el Código de
// Protección y Defensa del Consumidor). Debe coincidir EXACTAMENTE con lo que el backend
// tiene en env.ts (BUSINESS_LEGAL_NAME/BUSINESS_RUC) — ese es el que de verdad manda en
// los correos de reclamos; esta copia es solo para pintar la UI.
var BIZ_NAME='Ezra Kemish Vertiz Labarrera',BIZ_RUC='10736044523',BIZ_CITY='Trujillo, Perú',BIZ_EMAIL='contacto@sndwch.com',BIZ_IG='https://www.instagram.com/snd__wch/';
// El prefijo de moneda "S/" se muestra más chico que el monto — a tamaño completo
// se confundía visualmente con un "5" pegado al número (ej. "S/22" leído como "5/22").
var SOLES='<span style="font-size:.6em">S/</span>';
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
var EMAIL_FN_URL=SB_URL+'/functions/v1/send-order-email';

var STATUSES={
  'RECIBIDO':  {c:'#ffa500',next:'PREPARANDO', icon:'reclamo'},
  'PREPARANDO':{c:'#3A86FF',next:'EN CAMINO',  icon:''},
  'EN CAMINO': {c:'#9b6fff',next:'ENTREGADO',  icon:'moto'},
  'ENTREGADO': {c:'#25D366',next:null,          icon:'check'},
  'CANCELADO': {c:'#8B8B8B',next:null,          icon:'✕'}
};
var STEPS=['RECIBIDO','PREPARANDO','EN CAMINO','ENTREGADO'];

var BASES=[
  {id:'B01',l:'CLASSIC',s:'WHITE',   d:'Masa suave básica'},
  {id:'B02',l:'HERBS',  s:'CHEESE',  d:'Masa con orégano y parmesano'},
  {id:'B03',l:'FOCACCIA',s:'ARTESANAL',d:'Masa de focaccia artesanal'}
];
var PROTS=[
  {id:'P01',l:'ASADO',  s:'RES',        d:'Res asada mechada, cocción lenta',p15:14,p30:22,pDbl:6},
  {id:'P02',l:'POLLO',  s:'TERIYAKI',   d:'Tiras marinadas en teriyaki',p15:13,p30:21,pDbl:6},
  // vaultOnly: exclusiva de THE VAULT (SIG05, menú secreto) — no seleccionable en BUILD
  // YOUR OWN (ver el filtro en sOBuild) aunque siga en este array para que sigPrice/
  // dblProtRef/etc. la encuentren por id igual que cualquier otra proteína.
  {id:'P03',l:'POLLO',  s:'CAJUN',      d:'Pechuga deshilachada, condimento cajún',p15:13,p30:21,pDbl:6,vaultOnly:true},
  {id:'P04',l:'ATÚN',   s:'HOUSE',      d:'Atún premium con mayonesa clásica',p15:14,p30:22,pDbl:5},
  {id:'P05',l:'THE ITALIAN',s:'DELI',   d:'Paté peperoncino, jamón ahumado, cabanossi',p15:16,p30:26,pDbl:9},
  {id:'P06',l:'MEATBALL',s:'MARINARA',  d:'Albóndigas caseras en salsa marinara',p15:14,p30:24,pDbl:7}
];
var TOPS=[
  {id:'T01',l:'TOMATE',   s:'FRESCO'},
  {id:'T02',l:'PEPINILLO',s:'ENCURTIDO'},
  {id:'T03',l:'CEBOLLA',  s:'MORADA JULIANA'},
  {id:'T04',l:'JALAPEÑO', s:'ENCURTIDO'},
  {id:'T05',l:'ACEITUNA', s:'NEGRA EN RODAJAS'},
  {id:'T06',l:'PIMIENTO', s:'CURADO'},
  {id:'T07',l:'GIARDINIERA',s:'ENCURTIDO PICANTE'}
];
var CHEESE=[
  {id:'C01',l:'AMERICANO',s:''},
  {id:'C02',l:'CHEDDAR',  s:''},
  {id:'C03',l:'EDAM',     s:''}
];
var SAUCES=[
  {id:'S01',l:'AIOLI',   s:'SIGNATURE',d:'Ajo, limón, suave'},
  {id:'S02',l:'SPICY',   s:'MAYO',     d:'Cremoso, calor progresivo'},
  {id:'S03',l:'SMOKE',   s:'BBQ',      d:'Ahumado, miel, pimentón'},
  {id:'S04',l:'HONEY',   s:'MUSTARD',  d:'Dulce, mostaza equilibrado'},
  {id:'S05',l:'SNDWCH',  s:'SPECIAL',  d:'Nuestra salsa de la casa. Receta exclusiva SND//WCH.'},
  {id:'S06',l:'OIL & VINEGAR',s:'CLASSIC', d:'Aceite de oliva y vinagre, estilo italiano'},
  {id:'S07',l:'RANCH',   s:'CLASSIC',  d:'Cremoso, hierbas, ajo'},
  {id:'S08',l:'TERIYAKI',s:'GLAZE',    d:'Dulce, soja, jengibre'},
  {id:'S09',l:'CHIMICHURRI',s:'ARGENTINO',d:'Herbal, ajo, ácido'},
  {id:'S10',l:'PEANUT',  s:'SATAY',    d:'Maní, soya, jengibre'},
  {id:'S11',l:'MOSTAZA', s:'DIJON',    d:'Intensa, clásica, con carácter'},
  {id:'S12',l:'MIEL',    s:'PICANTE',  d:'Dulce con golpe de picor'},
  {id:'S13',l:'AU JUS',  s:'PARA MOJAR',d:'Caldo de la cocción de la carne, servido aparte para mojar cada bocado'}
];
var SIGS=[
  {id:'SIG01',n:'THE ORIGINAL',s:'SIGNATURE',badge:'PREMIUM',base:'B01',prot:'P01',tops:['T01','T02','T03'],sauces:['S01','S04'],p15:18,p30:22,
    pitch:'Res mechada jugosa de cocción lenta, con el equilibrio justo entre fresco y dulce. El sándwich que enamora desde el primer bocado.'},
  {id:'SIG02',n:'THE MEATBALL',s:'BUILD',    badge:'CLÁSICO',   base:'B02',prot:'P06',tops:['T01','T03','T05'],sauces:['S06','S07'],p15:19,p30:24,
    pitch:'Albóndigas caseras en salsa marinara, aceituna negra y una vinagreta al estilo italiano. El clásico de toda la vida, hecho como se debe.'},
  // chef:true (FAVORITO DEL CHEF) — el de mejor margen real, calculado sobre costos
  // reales de insumos (ver historial de la sesión que armó el menú). Antes lo tenía
  // SIG04 por decisión del dueño sin ese cálculo — se movió acá cuando se verificó el
  // costo real de cada producto.
  {id:'SIG03',n:'THE SMOKE',   s:'BUILD',    badge:'MÁS PEDIDO',base:'B03',prot:'P05',tops:['T03','T02','T01'],sauces:['S03','S08'],p15:21,p30:26,
    chef:true,
    pitch:'Fiambres italianos ahumados sobre focaccia artesanal, con un glaseado dulce-ahumado que se queda contigo. Nuestro build más premium, bocado a bocado.'},
  {id:'SIG04',n:'THE FRESH',   s:'BUILD',    badge:'LIGERO',    base:'B01',prot:'P04',tops:['T01','T02','T06'],sauces:['S01','S11'],p15:16,p30:22,
    pitch:'Atún premium, vegetales frescos y un toque cítrico de mostaza dijon. Ligero pero lleno de sabor — ideal para cualquier hora del día.'},
  {id:'SIG06',n:'THE TERIYAKI',s:'BUILD',    badge:'NUEVO',     base:'B01',prot:'P02',tops:['T01','T02','T06'],sauces:['S10','S05'],p15:17,p30:22,
    pitch:'Pollo teriyaki con salsa satay de maní y nuestra salsa de la casa. El sabor asiático que le faltaba al menú, con la firma SND//WCH.'},
  {id:'SIG07',n:'CHICAGO ITALIAN BEEF',s:'RESERVE',badge:'EDICIÓN LIMITADA',base:'B01',prot:'P01',tops:['T07'],sauces:['S13'],p15:25,p30:25,
    pitch:'Res mechada sobre pan italiano con giardiniera picante, y el au jus de la cocción servido aparte para mojar cada bocado. Una sola versión, la clásica.'},
  // Menú secreto — nunca aparece para invitados ni para quien no llegó a CÍRCULO INTERNO
  // (ver sOSig/rankName). DEBE coincidir con SIG05 en supabase/functions/api/catalog.ts —
  // el servidor es quien de verdad rechaza el pedido si no calificas, esto solo evita
  // mostrarlo/dejarlo elegir en la UI antes de intentarlo.
  {id:'SIG05',n:'THE VAULT',   s:'RESERVE',  badge:'SECRETO',   base:'B03',prot:'P03',tops:['T04','T06','T03'],sauces:['S02','S12'],p15:24,p30:30,
    secret:true,minOrders:15,
    pitch:'Solo para el Círculo Interno. Pollo cajún, picante y con un golpe de miel — una combinación que no está en ningún menú, te la ganaste a pedidos.'}
];
// "SIGNATURE"/"RESERVE" (curado por la casa) se distingue tipográficamente de "BUILD"
// (armado por el cliente) — cursiva y más grande, como una firma, en vez de la misma
// letra recta para ambos. Refuerza con tipografía la diferencia que ya existe en la
// receta: uno lo curó el chef, el otro lo arma cada cliente a su gusto.
function sigTypeTag(tag){
  if(tag==='SIGNATURE'||tag==='RESERVE')return'<i style="font-style:italic;font-size:1.15em">'+tag+'</i>';
  return tag;
}
// Fotos reales de cada Signature build — reemplazan el placeholder ilustrado
// (emoji + paleta de marca) que se usaba antes de tener fotografía.
var SIG_IMG={SIG01:'img/sig01.jpg',SIG02:'img/sig02.jpg',SIG03:'img/sig03.jpg',SIG04:'img/sig04.jpg'};
// Fotos reales de cada proteína en BUILD YOUR OWN — igual que SIG_IMG arriba, solo se
// muestra la miniatura para los códigos que ya tengan un archivo real en img/. Las
// proteínas sin entrada aquí siguen mostrando la tarjeta sin foto (sin placeholder falso).
var PROT_IMG={};
var RWDS=[
  {id:'R01',pts:40, n:'TOPPING',  s:'EXTRA',  d:'Un topping adicional gratis'},
  {id:'R02',pts:80, n:'4TA',      s:'SALSA',  d:'Cuarta salsa gratis'},
  {id:'R03',pts:140,n:'SAUCE',    s:'SET',    d:'3 salsas mini para llevar'},
  {id:'R04',pts:180,n:'DOBLE',    s:'PROTEÍNA',d:'Doble proteína gratis'},
  {id:'R05',pts:250,n:'BEBIDA',   s:'GRATIS', d:'Bebida a elección'},
  {id:'R06',pts:400,n:'SÁNDWICH', s:'GRATIS', d:'Sándwich 15CM gratis — cualquier proteína',sizeOnly:'15'}
];
// BEBIDAS Y SIDES — solo el catálogo de bebidas de la casa (D06-D09). D01-D05
// (chicha morada, inca kola, agua, papas, galleta) se retiraron a pedido del dueño:
// eran solo reventa de botellas/paquetes, sin nada distinto a lo que vende cualquier
// otro local — el catálogo ahora se queda solo con las bebidas propias sin jugos.
var SIDES=[
  // `d` es la descripción de venta que se muestra en BEBIDAS Y SIDES.
  {id:'D06',l:'THE BLOOM',    s:'HIBISCUS',p:4,d:'Flor de jamaica en infusión con un toque de canela, servida helada. Ácida, floral y sin una gota de jugo.'},
  {id:'D07',l:'THE MIDNIGHT', s:'BREW',    p:3,d:'Té negro reposado en frío toda la noche. Suave, sin amargor, con el punch justo de cafeína.'},
  {id:'D08',l:'THE COOL',     s:'MINT',    p:4,d:'Hierba luisa y menta fresca en infusión helada. Ligera, aromática, el break perfecto entre bocado y bocado.'},
  {id:'D09',l:'THE SPICE',    s:'CHAI',    p:6,d:'Té negro especiado con leche, canela, cardamomo, clavo y jengibre. Nuestra versión casera del chai clásico.'}
];

// HORARIO — valor de arranque mientras carga el real desde el servidor (ver
// loadStoreHoursBackground más abajo, que lo sobreescribe con lo que el dueño configuró
// en el panel admin). [hora_apertura, hora_cierre] en formato 24h, índice 0=domingo.
var STORE_HOURS=[[11,22],[11,22],[11,22],[11,22],[11,22],[11,22],[11,22]];
function storeStatus(){
  var now=new Date(),h=now.getHours()+now.getMinutes()/60,range=STORE_HOURS[now.getDay()];
  if(!range)return{open:false,label:'CERRADO HOY'};
  var open=h>=range[0]&&h<range[1];
  return open?{open:true,label:'ABIERTO AHORA · cierra '+String(range[1]).padStart(2,'0')+':00'}:{open:false,label:'CERRADO · abre '+String(range[0]).padStart(2,'0')+':00'};
}
function isWithinStoreHours(d){
  var range=STORE_HOURS[d.getDay()];
  if(!range)return false;
  var h=d.getHours()+d.getMinutes()/60;
  return h>=range[0]&&h<range[1];
}
// Rango orientativo de preparación + entrega mostrado ANTES de pagar (reduce la
// incertidumbre justo en el momento de decidir) — no es el ETA real del pedido, que
// el operador fija por pedido en el panel admin. ⚠️ EDITA este rango con el tiempo
// real de tu zona de reparto.
var ESTIMATED_DELIVERY_RANGE=[25,40];
// Coordenadas reales del punto de despacho (Av. Prolongación César Vallejo 2670,
// Condominio El Mirador del Golf, Trujillo) — usadas SOLO para el banner "Estás cerca"
// (ver checkNearbyStore/sOHome). No confundir con ESTIMATED_DELIVERY_RANGE de arriba.
var STORE_LAT=-8.139599,STORE_LON=-79.039458;
var NEARBY_RADIUS_KM=3;
// Combo sándwich (Signature o Build Your Own) + bebida: S/3 menos que pedir ambos por
// separado, aplicado una vez por cada par sándwich+bebida en el carrito (ver
// cartComboCount) — DEBE coincidir con COMBO_DISCOUNT_PER_PAIR en
// supabase/functions/api/catalog.ts, el servidor es quien de verdad cobra.
var COMBO_DISCOUNT_PER_PAIR=3;
// Bebida gratis (hasta S/4) de 2pm a 6pm hora Lima — DEBE coincidir con
// OFFPEAK_DRINK_PROMO_HOURS_LIMA en supabase/functions/api/catalog.ts, el servidor es
// quien de verdad aplica el descuento; esto solo calcula el estimado que ve el cliente
// antes de pagar (si no coincide, el checkout rechaza el total por no cuadrar).
var OFFPEAK_DRINK_PROMO_HOURS_LIMA=[[14,18]];
var OFFPEAK_DRINK_PROMO_CAP=4;
function isOffPeakDrinkPromoActiveNow(){
  var limaHour=new Date(Date.now()-5*3600000).getUTCHours();
  return OFFPEAK_DRINK_PROMO_HOURS_LIMA.some(function(r){return limaHour>=r[0]&&limaHour<r[1];});
}
// Plan Semanal — recarga de saldo propio con bono. Monto fijo (no hay input de monto como
// en la tarjeta de regalo) porque el bono está calculado para un solo punto de precio;
// DEBE coincidir con WEEKLY_PLAN_PRICE/WEEKLY_PLAN_CREDIT en
// supabase/functions/api/actions/customer.ts, el servidor es quien de verdad cobra y acredita.
var WEEKLY_PLAN_PRICE=90;
var WEEKLY_PLAN_CREDIT=100;
// Rangos por antigüedad (total_orders) — solo reconocimiento/pertenencia, nunca un
// multiplicador de puntos ni un precio distinto (VIP se retiró como tier a propósito).
// DEBE coincidir con RANKS en supabase/functions/api/env.ts.
var RANKS=[
  {name:'NUEVO',minOrders:0},
  {name:'REGULAR',minOrders:1},
  {name:'DE LA CASA',minOrders:5},
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
function lowStockNote(code){
  var q=invQty[code];
  if(q==null||q<=0||q>5)return'';
  return'<span style="font-family:\'Share Tech Mono\',monospace;font-size:8px;color:#ffa500;margin-left:6px;white-space:nowrap">¡QUEDAN '+q+'!</span>';
}

// STATE
var sc='o_home',tab='order',busy=false,busyMsg='';
// A dónde vuelve el botón "←" en pantallas legales que se abren desde más de un lugar
// (registro, perfil, o el pie de contacto del home) — sin esto, sPLegal() solo podía
// adivinar el origen mirando si `cust` existe, y desde el pie del home eso mandaba a un
// invitado de vuelta al login en vez de al home. Se fija justo antes de cada navegación.
var bkTo=null;
var mode=null,sigId=null,base=null,prot=null,cheese=null;
var tops=[],sauces=[],size=null,doubleProt=false,extraSauce=false;
var useCredit=false;
var manualPayMethod=null;
var cust=null,isAdmin=false,atab='reg',aErr='',refCode='';
// Credential (JWT) de Google Identity Services en espera de que el cliente complete el
// registro normal (nombre/teléfono/PIN/DNI) — ver onGoogleCredential()/doReg(). Nunca se
// usa por sí solo para crear una cuenta: el servidor lo vuelve a verificar en actRegister.
var _googleIdToken=null;
var adminOrders=[],myOrders=[],adminOrdersTruncated=false;
var agPhone='',agPts='',agMsg='';
var pollTimer=null,lastPollCount=0,pollFailing=false;
var isOffline=!navigator.onLine;
var deferredInstallPrompt=null,pwaDismissed=localStorage.getItem('sw_pwa_dismissed')==='1';
var nearStore=false,_nearCheckDone=false;
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
var ratingsList=null,ratingsMinStars=0,ratingsOnlyComments=false;
var prepListData=null,timeReportData=null,problemAddressesData=null,marketingContentData=null;
var bulkSelected={};
// Preset de sonido de nuevo pedido — antes era un único tono fijo sin forma de
// distinguirlo de otras notificaciones del navegador si el operador tiene varias apps abiertas.
var NOTIF_SOUND_PRESETS={
  campana:[[523,0],[659,.15],[784,.30]],
  timbre: [[880,0],[880,.12],[880,.24]],
  grave:  [[220,0],[330,.14],[440,.28]]
};
var notifSoundPreset=localStorage.getItem('sw_notif_sound')||'campana';
// Modo claro del panel admin — se aplica invirtiendo el filtro CSS sobre todo el
// contenedor en vez de reescribir cada color hardcodeado de ~10 pantallas: la UI del
// panel es solo color plano + emoji (sin fotos), así que invert+hue-rotate produce un
// tema claro coherente sin duplicar estilos.
var adminLightMode=localStorage.getItem('sw_admin_light')==='1';
var recNewPin=null;
var recEmailMasked=null;
var myAddresses=[],myFavorites=[],pickedAddrId=null;
var wPhone='',wAmt='',wMsg='';
var gcPhone='',gcAmt='',gcNote='',gcMsg='',gcName=null,gcEmail='';
var _pendingGift=null;
var rtStars=0,rtMsg='',chalMsg='',discChalMsg='';
var cmplStep='form',cmplKind='reclamo',cmplMinor=false,cmplErr='',cmplCode=null,cmplBusy=false;
var adminComplaints=[],cmplFilterStatus='',cmplRespondingId=null;
var addrText='',scheduleMode='now';
var confNom='',confPhone='',confEmail='',confNotes='';
var checkoutLocked=false,lockedMsg='',_payingInProgress=false;
var appliedReward=null;
var previewSigId=null;
var newAddrMsg='',favMsg='';
var cart=[];
var groupCodeFromUrl=null;
(function(){try{var qp=new URLSearchParams(location.search);var rc=qp.get('ref');if(rc)refCode=rc.trim();var gc=qp.get('group');if(gc)groupCodeFromUrl=gc.trim().toUpperCase();
  // ?src=... en el link de un anuncio (ver plan de campaña) — se guarda apenas se detecta
  // y sobrevive aunque el registro pase en otra visita, así un clic de anuncio que hoy solo
  // mira el menú y recién se registra mañana igual queda atribuido a esa campaña.
  var sc2=qp.get('src');if(sc2)localStorage.setItem('sw_src',sc2.trim().slice(0,60));
}catch(e){}})();
// Pedido grupal / de oficina — organiza el que tiene cuenta (actCreateGroupOrder exige
// sesión), pero contribuir NO exige cuenta, solo un nombre (ver actAddGroupItem, server).
var groupCode=null,groupData=null,groupJoinName='',groupMsg='',groupSize='15';
// Signatures para los que ya se pidió "avísame cuando vuelva" en esta sesión — solo
// para no dejar tocar el botón dos veces mientras se está en la app; el servidor ya
// deduplica con un unique (customer_phone, sig_id) si igual llega a repetirse.
var restockNotified=[];
try{groupJoinName=localStorage.getItem('sw_group_name')||'';}catch(e){}
var _groupPollTimer=null;

// TOAST / CONFIRM / PROMPT — reemplazan alert()/confirm()/prompt() nativos del navegador,
// que rompían la identidad visual de la marca (aparecían como cuadros de diálogo genéricos
// del sistema en vez de la estética verde/dorado del resto de la app). Se renderizan en su
// propio contenedor (#ui-overlays), independiente del árbol que controla render() — así
// siguen apareciendo aunque en ese momento la pantalla esté en el estado "busy" (spinner
// de carga), igual que antes alert()/confirm() podían aparecer sobre cualquier pantalla.
var toastMsg=null,toastType='error',toastTimer=null;
function showToast(msg,type?){
  type=type||'error';
  if(toastTimer)clearTimeout(toastTimer);
  toastMsg=msg;toastType=type;
  renderOverlays();
  toastTimer=setTimeout(function(){toastMsg=null;toastTimer=null;renderOverlays();},type==='error'?5000:3200);
}
function dismissToast(){
  if(toastTimer){clearTimeout(toastTimer);toastTimer=null;}
  toastMsg=null;renderOverlays();
}
var confirmState=null;
function showConfirm(msg){
  return new Promise(function(resolve){confirmState={msg:msg,resolve:resolve};renderOverlays();});
}
function resolveConfirm(val){
  var st=confirmState;confirmState=null;renderOverlays();
  if(st)st.resolve(val);
}
var promptState=null;
function showPrompt(msg,defVal?,inputType?): Promise<string|null>{
  return new Promise<string|null>(function(resolve){promptState={msg:msg,defVal:defVal||'',inputType:inputType||'text',resolve:resolve};renderOverlays();});
}
function resolvePrompt(val){
  var st=promptState;promptState=null;renderOverlays();
  if(st)st.resolve(val);
}
function submitPrompt(){
  var inp=(document.getElementById('ui-prompt-input') as HTMLInputElement | null);
  resolvePrompt(inp?inp.value:null);
}

function renderOverlays(){
  var el=(document.getElementById('ui-overlays') as HTMLInputElement | null);
  if(!el)return;
  var html='';
  if(toastMsg){
    var isErr=toastType==='error';
    html+='<div style="position:fixed;left:16px;right:16px;bottom:20px;z-index:400;display:flex;justify-content:center" class="fi">'
      +'<div style="max-width:420px;width:100%;background:'+(isErr?'#3a1414':'#1A3028')+';border:1px solid '+(isErr?'rgba(255,85,85,.5)':'rgba(203,162,88,.4)')+';border-radius:12px;padding:14px 16px;display:flex;align-items:flex-start;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,.4)">'
      +'<div style="flex:1;font-family:\'Barlow\',sans-serif;font-size:13px;color:'+(isErr?'#ffb3b3':'#F2F0EB')+';line-height:1.4">'+esc(toastMsg)+'</div>'
      +'<button onclick="dismissToast()" style="all:unset;cursor:pointer;color:'+(isErr?'#ffb3b3':'#A8C8B0')+';font-size:16px;line-height:1;padding:0 2px">&#10005;</button>'
      +'</div></div>';
  }
  if(confirmState){
    html+='<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:410;display:flex;align-items:flex-end;justify-content:center" class="fi">'
      +'<div style="background:#1E3932;border-radius:14px 14px 0 0;width:100%;max-width:420px;padding:24px 20px 20px;box-sizing:border-box">'
      +'<p style="font-family:\'Barlow\',sans-serif;font-size:14px;color:#F2F0EB;line-height:1.5;margin-bottom:20px;white-space:pre-line">'+esc(confirmState.msg)+'</p>'
      +'<button onclick="resolveConfirm(true)" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#fff;font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;letter-spacing:.08em;padding:14px;border-radius:10px;text-align:center;margin-bottom:8px;box-sizing:border-box">CONFIRMAR //</button>'
      +'<button onclick="resolveConfirm(false)" style="all:unset;cursor:pointer;display:block;width:100%;background:transparent;border:1px solid #3A6B58;color:#A8C8B0;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;padding:12px;border-radius:10px;text-align:center;box-sizing:border-box">CANCELAR</button>'
      +'</div></div>';
  }
  if(promptState){
    html+='<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:420;display:flex;align-items:flex-end;justify-content:center" class="fi">'
      +'<div style="background:#1E3932;border-radius:14px 14px 0 0;width:100%;max-width:420px;padding:24px 20px 20px;box-sizing:border-box">'
      +'<p style="font-family:\'Barlow\',sans-serif;font-size:14px;color:#F2F0EB;line-height:1.5;margin-bottom:14px;white-space:pre-line">'+esc(promptState.msg)+'</p>'
      +'<input id="ui-prompt-input" type="'+promptState.inputType+'" value="'+esc(promptState.defVal)+'" autofocus onkeydown="if(event.key===\'Enter\')submitPrompt();" style="background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px;color:#FFFFFF;width:100%;font-size:16px;box-sizing:border-box;margin-bottom:16px">'
      +'<button onclick="submitPrompt()" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#fff;font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;letter-spacing:.08em;padding:14px;border-radius:10px;text-align:center;margin-bottom:8px;box-sizing:border-box">ACEPTAR //</button>'
      +'<button onclick="resolvePrompt(null)" style="all:unset;cursor:pointer;display:block;width:100%;background:transparent;border:1px solid #3A6B58;color:#A8C8B0;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;padding:12px;border-radius:10px;text-align:center;box-sizing:border-box">CANCELAR</button>'
      +'</div></div>';
  }
  // Botón flotante de soporte por WhatsApp — visible desde cualquier pantalla del
  // cliente (no en el panel admin, que ya tiene su propio WhatsApp con cada cliente).
  if(sc.indexOf('admin')!==0){
    var supportMsg=encodeURIComponent('Hola, necesito ayuda con mi pedido/cuenta en SND//WCH.');
    html+='<a href="https://wa.me/'+WA+'?text='+supportMsg+'" target="_blank" rel="noopener" style="position:fixed;right:16px;bottom:84px;z-index:150;width:50px;height:50px;border-radius:50%;background:'+GOLD+';display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.4);text-decoration:none" aria-label="Soporte por WhatsApp">'+icon('chat',24,'#0d0d0d')+'</a>';
  }
  el.innerHTML=html;
}

// API — todas las operaciones sensibles (login, pedidos, puntos, admin) pasan
// por este Edge Function, que usa la service key en el servidor. El cliente
// nunca toca directamente las tablas customers/orders/transactions/admin_accounts.
async function api(action,payload){
  var body=Object.assign({action:action},payload||{});
  // Antes sin timeout: una red colgada (no caída, solo estancada) dejaba el spinner
  // pegado indefinidamente en cualquier pantalla de la app. sbG() ya usaba este patrón
  // en otra parte del archivo; faltaba aplicarlo aquí, el wrapper que usa casi todo.
  var ctrl=new AbortController();
  var timeoutId=setTimeout(function(){ctrl.abort();},15000);
  var r;
  try{
    r=await fetch(API_FN_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctrl.signal});
  }catch(e){
    if(e && e.name==='AbortError')throw new Error('La conexión tardó demasiado. Intenta de nuevo.');
    throw new Error('No se pudo conectar. Revisa tu conexión a internet.');
  }finally{
    clearTimeout(timeoutId);
  }
  var data=await r.json().catch(function(){return{};});
  if(!r.ok)throw new Error(data.error||'Error de conexión.');
  return data;
}

// SOUND
function playNotif(){
  try{
    var ctx=new(window.AudioContext||window.webkitAudioContext)();
    (NOTIF_SOUND_PRESETS[notifSoundPreset]||NOTIF_SOUND_PRESETS.campana).forEach(function(n){
      var o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.frequency.value=n[0];o.type='sine';
      g.gain.setValueAtTime(0,ctx.currentTime+n[1]);
      g.gain.linearRampToValueAtTime(.25,ctx.currentTime+n[1]+.06);
      g.gain.linearRampToValueAtTime(0,ctx.currentTime+n[1]+.38);
      o.start(ctx.currentTime+n[1]);
      o.stop(ctx.currentTime+n[1]+.42);
    });
  }catch(e){}
}
function setNotifSound(preset){
  notifSoundPreset=NOTIF_SOUND_PRESETS[preset]?preset:'campana';
  localStorage.setItem('sw_notif_sound',notifSoundPreset);
  playNotif();
  render();
}
function toggleAdminLight(){
  adminLightMode=!adminLightMode;
  localStorage.setItem('sw_admin_light',adminLightMode?'1':'0');
  render();
}

// POLLING
// Firma barata de la lista de pedidos activos (id+estado+eta) — si no cambió
// nada desde el último poll, no tocamos el DOM. Evita reconstruir toda la
// pantalla cada 25s cuando no hay novedades, que es el caso más común.
function ordersSig(orders){return(orders||[]).map(function(o){return o.id+':'+o.status+':'+(o.eta_minutes||'');}).join('|');}
function startPoll(){
  if(pollTimer)clearInterval(pollTimer);
  pollTimer=setInterval(async function(){
    if(sc!=='admin_home')return;
    try{
      var r=await api('admin-orders',{token:token});
      var total=r.orders.length;
      if(total>lastPollCount&&lastPollCount>=0)playNotif();
      lastPollCount=total;
      adminOrdersTruncated=!!r.truncated;
      // Antes un poll fallido quedaba en silencio total — el operador veía el estado
      // de siempre sin ninguna señal de que en realidad no se está actualizando.
      if(pollFailing){pollFailing=false;render();}
      if(ordersSig(r.orders)!==ordersSig(adminOrders)){
        adminOrders=r.orders;
        render();
      }
    }catch(e){
      if(!pollFailing){pollFailing=true;render();}
    }
  },25000);
}
function stopPoll(){if(pollTimer){clearInterval(pollTimer);pollTimer=null;lastPollCount=0;}}

// SUPABASE
// Atajo tipado para el patrón repetido de leer el valor de un <input>/<textarea> por id
// ((document.getElementById(id) as HTMLInputElement | null) solo devuelve HTMLElement, sin `.value`) — mismo
// comportamiento que antes (revienta si el elemento no existe), solo con el cast ya hecho
// una vez en vez de repetido en cada sitio de lectura.
function gv(id: string): string { return ((document.getElementById(id) as HTMLInputElement | null) as HTMLInputElement).value; }
function sbH(x?){var h={'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'};if(x)Object.keys(x).forEach(function(k){h[k]=x[k];});return h;}
async function sbG(t,q){var r=await fetch(SB_URL+'/rest/v1/'+t+'?'+q,{headers:sbH(),signal:(function(){try{var ac=new AbortController();setTimeout(function(){ac.abort();},10000);return ac.signal;}catch(e){return undefined;}})()});if(!r.ok){var e=await r.json();throw new Error(e.message||'Error');}return r.json();}

// UTILS
function fn(arr,id){var i=arr.find(function(x){return x.id===id;});return i?i.l+' // '+i.s:'';}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
// Bloque de texto legal titulado — usado por sPLegal() y sPReturns() (antes cada una
// tenía su propia copia idéntica de este helper).
function sec(t,b){return'<div style="margin-bottom:20px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:8px">'+t+'</div><p style="font-family:\'Barlow\',sans-serif;font-size:13px;color:#A8C8B0;line-height:1.6">'+b+'</p></div>';}
function isAvail(code){return invStock[code]!==false;}
function protPrice(p){return !p||!size?0:(size==='15'?p.p15:p.p30);}
function sigPrice(s){return !s||!size?0:(size==='15'?s.p15:s.p30);}
// Proteína "de referencia" para el precio de doble proteína: la del signature
// elegido, o la elegida en Build Your Own.
function dblProtRef(){
  var sig=SIGS.find(function(x){return x.id===sigId;});
  var protId=mode==='sig'?(sig?sig.prot:null):prot;
  return PROTS.find(function(x){return x.id===protId;});
}
function total(){
  var sig=SIGS.find(function(x){return x.id===sigId;});
  var pr=PROTS.find(function(x){return x.id===prot;});
  var bp=mode==='sig'?sigPrice(sig):protPrice(pr);
  var dbl=dblProtRef();
  return bp+(doubleProt&&dbl?dbl.pDbl:0)+(extraSauce?2:0);
}
function szLabel(sz){return sz==='15'?'15CM':sz==='30'?'30CM':'';}
// Toggle de tamaño reutilizado en Signature y Build Your Own.
function SZTOG(){
  function opt(sz,l,d){var sel=size===sz;return'<div onclick="size=\''+sz+'\';render()" style="flex:1;background:'+(sel?'#1E4A38':'#1A3028')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:10px;padding:14px;cursor:pointer;text-align:center;position:relative">'+selBar(sel)+'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:20px;font-weight:900;color:'+(sel?'#FFFFFF':'#A8C8B0')+'">'+l+'</div><div style="font-family:\'Barlow\',sans-serif;font-size:10px;color:#A8C8B0;margin-top:2px">'+d+'</div></div>';}
  return ST('00','TAMAÑO','Elige antes de continuar.')+'<div style="display:flex;gap:8px;margin-bottom:6px">'+opt('15','15CM','Individual')+opt('30','30CM','Clásico')+'</div><div style="height:1px;background:#1E3932;margin:20px 0"></div>';
}
function today(){return new Date().toLocaleDateString('es-PE');}
// La parte de tiempo es solo para que sea legible/ordenable — la parte random es la que
// importa: sin ella, el ref era adivinable (puro timestamp) y servía como única prueba
// de acceso para rastrear un pedido de invitado sin cuenta (ver actMyOrders/actSubmitRating
// en el servidor), lo que permitía enumerar pedidos de otras personas.
function oref(){
  var rand='';
  for(var i=0;i<4;i++)rand+=(Math.floor(Math.random()*36)).toString(36);
  return'ORD-'+Date.now().toString(36).toUpperCase().slice(-6)+'-'+rand.toUpperCase();
}
function stBadge(st){var s=STATUSES[st]||STATUSES['RECIBIDO'];var ic=s.icon?(ICONS[s.icon]?icon(s.icon,11,s.c):s.icon+' '):'';return'<span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+s.c+';background:'+s.c+'18;border:1px solid '+s.c+'44;border-radius:4px;padding:3px 9px;letter-spacing:.1em;display:inline-flex;align-items:center;gap:4px">'+ic+st+'</span>';}

// HTML HELPERS
// Logotipo — un solo lugar para las 3 versiones que antes vivían duplicadas (header de
// cada pantalla, splash de carga, pantalla de pedido confirmado): mismo tracking ajustado
// en SND/WCH con el "//" con su propio respiro, y una sombra sutil solo en los tamaños
// grandes (hero) para que se sienta como un logotipo y no como texto de header reciclado.
function WORDMARK(size,hero?){
  return'<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:'+size+'px;font-weight:900;color:#fff;letter-spacing:.02em;line-height:1'+(hero?';text-shadow:0 2px 14px rgba(0,0,0,.35)':'')+'">SND<span style="color:'+GOLD+';letter-spacing:.14em;padding:0 1px">//</span>WCH</span>';
}
function H(sub?,bk?,showCart?){
  var b=bk?'<button onclick="'+bk+'" style="all:unset;cursor:pointer;color:#A8C8B0;font-family:\'Barlow Condensed\',sans-serif;font-size:18px;font-weight:700;padding:0 14px 0 0;flex-shrink:0">←</button>':'';
  var sz=sub?26:40;
  var s2=sub?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-top:3px">'+sub+'</div>':'<div style="font-family:\'Share Tech Mono\',monospace;font-size:8px;color:#1c1c1c;letter-spacing:.35em;margin-top:4px">BUILD // YOUR // BITE</div>';
  // Ícono de carrito persistente mientras se navega el menú (armar un build, agregar
  // sides) — antes solo se veía cuántos items tenías en el carrito volviendo al home.
  var cartIcon=(showCart&&cart.length)?'<button onclick="go(\'o_cart\')" style="all:unset;cursor:pointer;position:relative;flex-shrink:0;padding:6px 10px;background:#2D5246;border-radius:8px;display:flex">'+icon('cart',18,'#F2F0EB')+'<span style="position:absolute;top:-4px;right:2px;background:'+GOLD+';color:#0d0d0d;font-family:\'Share Tech Mono\',monospace;font-size:9px;font-weight:700;border-radius:8px;padding:1px 5px;min-width:14px;text-align:center">'+cart.reduce(function(s,it){return s+it.qty;},0)+'</span></button>':'';
  return'<div style="padding:20px 20px 16px;border-bottom:1px solid #3A6B58;display:flex;align-items:center;flex-shrink:0">'+b+'<div style="flex:1"><div style="line-height:1">'+WORDMARK(sz)+'</div>'+s2+'</div>'+cartIcon+'</div>';
}
function NAV(){
  var oa=tab==='order';
  function nb(t,l,a){return'<button onclick="swTab(\''+t+'\')" style="all:unset;cursor:pointer;flex:1;padding:12px 0;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;letter-spacing:.12em;color:'+(a?'#fff':'#555')+'">'+l+(a?' <span style="color:'+GOLD+'">//</span>':'')+'</div><div style="width:4px;height:4px;border-radius:50%;background:'+GOLD+';opacity:'+(a?1:0)+'"></div></button>';}
  return'<div style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(11,11,11,.97);border-top:1px solid #0B0B0B;display:flex;z-index:100">'+nb('order','PEDIDO',oa)+nb('points','PUNTOS',!oa)+'</div>';
}
// Pie de contacto — datos del comercio, redes sociales y links legales. Requisito de
// Culqi para aprobar el comercio en producción (y buena práctica de por sí): un cliente
// debe poder identificar quién opera la web sin tener que abrir WhatsApp primero.
// Vive solo en el home (la primera pantalla que ve cualquiera, con o sin cuenta) para no
// repetir el mismo bloque en cada pantalla de la app.
function contactFooterHTML(){
  var igIcon='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>';
  return'<div style="margin-top:28px;padding-top:20px;border-top:1px solid #1E3932">'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">CONTACTO //</div>'
    +'<div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;line-height:2.1">'
    +'<div style="display:flex;align-items:center;gap:7px">'+icon('direccion',13,'#A8C8B0')+'Delivery — '+BIZ_CITY+'</div>'
    +'<div style="display:flex;align-items:center;gap:7px">'+icon('mail',13,'#A8C8B0')+'<a href="mailto:'+BIZ_EMAIL+'" style="color:#A8C8B0;text-decoration:none">'+BIZ_EMAIL+'</a></div>'
    +'<div style="display:flex;align-items:center;gap:7px">'+icon('chat',13,'#A8C8B0')+'<a href="https://wa.me/'+WA+'" target="_blank" rel="noopener" style="color:#A8C8B0;text-decoration:none">+51 930 957 640</a></div>'
    +'</div>'
    +'<a href="'+BIZ_IG+'" target="_blank" rel="noopener" aria-label="Instagram" style="margin-top:14px;width:34px;height:34px;border-radius:50%;background:#1A3028;border:1px solid #3A6B58;display:flex;align-items:center;justify-content:center;text-decoration:none;color:'+GOLD+'">'+igIcon+'</a>'
    +'<div style="display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:18px">'
    +'<span onclick="bkTo=\'o_home\';sc=\'p_legal\';render()" style="cursor:pointer;font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0;letter-spacing:.06em;text-decoration:underline">TÉRMINOS //</span>'
    +'<span onclick="bkTo=\'o_home\';sc=\'p_returns\';render()" style="cursor:pointer;font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0;letter-spacing:.06em;text-decoration:underline">CAMBIOS Y DEVOLUCIONES //</span>'
    +'<span onclick="bkTo=\'o_home\';sc=\'p_complaints\';cmplStep=\'form\';render()" style="cursor:pointer;font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0;letter-spacing:.06em;text-decoration:underline">LIBRO DE RECLAMACIONES //</span>'
    +'</div>'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:8px;color:#4A5A52;margin-top:16px;letter-spacing:.04em">'+esc(BIZ_NAME)+' · RUC '+BIZ_RUC+'</div>'
    +'</div>';
}
function AB(t,can?,bk?,nfn?,nl?){
  var bb=bk?'<button onclick="'+bk+'" style="all:unset;cursor:pointer;border:1px solid #3A6B58;color:#A8C8B0;font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;padding:12px 16px;border-radius:8px;flex-shrink:0">← ATRÁS</button>':'';
  var tt=t?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:8px;color:'+GOLD+';letter-spacing:.2em">TOTAL //</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:24px;font-weight:900;color:#FFFFFF">'+SOLES+'<span style="color:'+GOLD+'">'+t+'</span></div>':'';
  return'<div style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(11,11,11,.97);border-top:1px solid #0B0B0B;padding:12px 20px;display:flex;gap:10px;align-items:center;z-index:100"><div style="flex:1">'+tt+'</div>'+bb+'<button onclick="'+(can?nfn:'')+'" '+(can?'':'disabled')+' style="all:unset;cursor:'+(can?'pointer':'not-allowed')+';background:'+(can?GOLD:'#1E3932')+';color:'+(can?'#fff':'#4A7A68')+';font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;letter-spacing:.1em;padding:13px 0;border-radius:8px;text-align:center;flex:1">'+(nl||'CONTINUAR //')+'</button></div>';
}
// Barra de acento a la izquierda de una tarjeta seleccionada — repetida en todos los
// selectores tipo tarjeta (tamaño, signature, pan, proteína, topping, queso, salsa, extra).
function selBar(sel){return sel?'<div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:'+GOLD+';border-radius:10px 0 0 10px"></div>':'';}
// `thumb` (opcional, HTML de un <img> ya armado) muestra una miniatura a la izquierda —
// mismo patrón que ya usaba la lista de Signature builds. Sin thumb, la tarjeta se ve
// exactamente igual que antes (bases nunca tienen foto propia, solo proteínas).
function CARD(item,sel,fn,right?,thumb?){
  var inner='<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:16px;font-weight:700;color:#FFFFFF">'+item.l+'<span style="color:'+GOLD+'"> // </span>'+item.s+'</span>'+(right||'')+'</div>'+(item.d?'<p style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-top:4px">'+item.d+'</p>':'');
  return'<div onclick="'+fn+'" style="background:'+(sel?'#1E4A38':'#1A3028')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:10px;padding:14px 16px;cursor:pointer;margin-bottom:10px;position:relative;transition:all .15s">'+selBar(sel)+(thumb?'<div style="display:flex;gap:14px">'+thumb+'<div style="flex:1;min-width:0">'+inner+'</div></div>':inner)+'</div>';
}
function ST(n,t,s?){return'<div style="margin-bottom:20px"><h2 style="font-family:\'Barlow Condensed\',sans-serif;font-size:28px;font-weight:900;color:#fff;letter-spacing:.06em;line-height:1">'+n+'<span style="color:'+GOLD+'"> // </span>'+t+'</h2>'+(s?'<p style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-top:5px">'+s+'</p>':'')+'</div>';}
// font-size:16px a propósito (no 14px) — iOS Safari hace zoom automático al enfocar
// cualquier input con font-size menor a 16px, lo que rompe el layout del checkout en
// la mayoría de teléfonos de los clientes.
function INP(id,ph,type?,val?){return'<input id="'+id+'" type="'+(type||'text')+'" placeholder="'+ph+'" value="'+esc(val||'')+'" style="background:#2D5246;border:1px solid #0d0d0d;border-radius:10px;padding:14px 16px;color:#FFFFFF;width:100%;font-size:16px;caret-color:'+GOLD+'">';}
// box-sizing:border-box a propósito — `all:unset` resetea box-sizing a content-box, así
// que sin esto todo botón width:100% construido con BTN() se pasaba 28px (2×14px de
// padding) del ancho de su contenedor, cortándose fuera de pantalla en formularios
// angostos (ej. GUARDAR HORARIO en el panel admin). Hallazgo de la auditoría visual.
function BTN(l,fn,out?){return'<button onclick="'+fn+'" style="all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;background:'+(out?'transparent':GOLD)+';border:'+(out?'1px solid '+ACCENT2:'none')+';color:'+(out?ACCENT2:'#fff')+';font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;letter-spacing:.1em;padding:14px;border-radius:10px;text-align:center">'+l+'</button>';}
function LOAD(msg){return'<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1E3932"><div style="margin-bottom:16px">'+WORDMARK(38,true)+'</div><div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#A8C8B0;letter-spacing:.25em">'+(msg||'CARGANDO //')+'</div></div>';}
// Antes MIS PEDIDOS/HISTORIAL usaban el spinner genérico de pantalla completa (LOAD())
// mientras cargaban — con esto se ve de inmediato el armazón real de la pantalla (título,
// botón atrás) con bloques pulsantes del mismo tamaño que las tarjetas reales, en vez de
// un splash sin relación con lo que está por aparecer.
var listLoading=false;
function skeletonCards(n,heightPx){
  var row='<div class="pulse" style="background:#2D5246;border:1px solid #3A6B58;border-radius:12px;height:'+(heightPx||64)+'px;margin-bottom:10px"></div>';
  return new Array(n||3).fill(row).join('');
}

// NAV
function go(s){sc=s;render();}
function swTab(t){tab=t;sc=t==='order'?'o_home':(cust?'p_home':'p_auth');aErr='';render();}

// Reconstruye el estado global del builder a partir de un "build" guardado
// (viene de un pedido pasado o de un favorito) y salta directo a confirmar.
function loadBuild(bld){
  if(!bld)return;
  mode=bld.mode;sigId=bld.sigId||null;base=bld.base||null;prot=bld.prot||null;
  cheese=bld.cheese||null;tops=(bld.tops||[]).slice();sauces=(bld.sauces||[]).slice();
  size=bld.size||null;doubleProt=!!bld.doubleProt;extraSauce=!!bld.extraSauce;
  enterConfirm();
}
// Convierte el "build" legado (un pedido/favorito de antes del carrito) al formato
// de línea de carrito actual.
function buildToCartItem(bld){
  var item=Object.assign({},bld);
  item.type=bld.mode;
  delete item.mode;
  item.qty=1;
  return item;
}
// Limpia el estado del builder antes de empezar un pedido nuevo — evita que un
// build abandonado (o de un pedido anterior en la misma sesión) reaparezca
// precargado en un pedido sin relación.
function resetBuilder(){
  sigId=null;base=null;prot=null;cheese=null;tops=[];sauces=[];size=null;doubleProt=false;extraSauce=false;
}
function startOrder(m){
  resetBuilder();
  mode=m;
  go(m==='sig'?'o_sig':'o_build');
}
function currentBuiltItem(){
  return mode==='sig'
    ?{type:'sig',sigId:sigId,size:size,doubleProt:doubleProt,extraSauce:extraSauce,qty:1}
    :{type:'byo',base:base,prot:prot,cheese:cheese,tops:tops.slice(),sauces:sauces.slice(),size:size,doubleProt:doubleProt,extraSauce:extraSauce,qty:1};
}
// Entrada a la pantalla de revisar UN sándwich recién armado. Si el carrito estaba
// vacío (caso mayoritario: un solo sándwich), se habilita el pago directo — el
// sándwich se refleja de inmediato en `cart` y esta misma pantalla incluye los
// campos de checkout, evitando el paso extra de pasar por "TU CARRITO".
var quickPayEligible=false;
function enterConfirm(){
  quickPayEligible=cart.length===0;
  if(quickPayEligible){cart=[currentBuiltItem()];initCheckoutFields();}
  go('o_item_confirm');
}
// Vuelve al builder desde la confirmación — si se había habilitado el pago directo,
// se retira el sándwich en borrador del carrito (estaba vacío antes de entrar aquí).
function backFromConfirm(){
  if(quickPayEligible){cart=[];quickPayEligible=false;}
  go(mode==='sig'?'o_sig':'o_build');
}
// El cliente decide pedir más de un producto: el sándwich ya confirmado se queda
// en el carrito y pasamos a la vista de carrito completo para seguir agregando.
function goToCartFromConfirm(){
  syncConfirmFields();
  quickPayEligible=false;
  resetBuilder();mode=null;
  go('o_cart');
}
// Reinicia los campos transitorios del checkout (nombre/correo/notas/dirección/
// programación/crédito/recompensa) — se llama solo cuando el carrito pasa de estar
// vacío a tener su primer producto, para que un pedido nuevo nunca arrastre texto
// o selecciones de un carrito anterior ya finalizado.
function initCheckoutFields(){
  confNom=cust?cust.name:'';
  confPhone=cust?cust.phone:'';
  confEmail=cust&&cust.email?cust.email:'';
  confNotes='';
  addrText=cust&&cust.last_address?cust.last_address:'';
  pickedAddrId=null;
  scheduleMode='now';
  useCredit=false;
  manualPayMethod=null;
  checkoutLocked=false;lockedMsg='';
  _payingInProgress=false;
  appliedReward=null;
}
// Antes de cualquier re-render disparado DESDE la propia pantalla de carrito/checkout
// (toggle de recompensa, horario, crédito, elegir una dirección guardada) hay que
// preservar lo que el cliente ya escribió — render() reconstruye todo el innerHTML,
// así que sin esto cada toque borraría nombre/correo/notas/dirección en curso.
function syncConfirmFields(){
  var n=(document.getElementById('o-nom') as HTMLInputElement | null),p=(document.getElementById('o-phone') as HTMLInputElement | null),e=(document.getElementById('o-email') as HTMLInputElement | null),no=(document.getElementById('o-notes') as HTMLInputElement | null),a=(document.getElementById('o-addr') as HTMLInputElement | null);
  if(n)confNom=n.value;
  if(p)confPhone=p.value;
  if(e)confEmail=e.value;
  if(no)confNotes=no.value;
  if(a)addrText=a.value;
}
function confirmRerender(){syncConfirmFields();render();}
function lastPaidOrder(){
  return myOrders.find(function(o){return o.payment_status==='paid'&&((o.items&&o.items.length)||o.build);});
}
// Precio de una línea del carrito (una unidad, sin multiplicar por qty) — usado
// tanto para mostrar el carrito como para armar el pedido a enviar.
function itemUnitPrice(item){
  if(item.type==='side'){var d=SIDES.find(function(x){return x.id===item.code;});return d?d.p:0;}
  if(item.type==='sig'){
    var sig=SIGS.find(function(x){return x.id===item.sigId;});
    if(!sig)return 0;
    var pr=PROTS.find(function(x){return x.id===sig.prot;});
    var bp=item.size==='15'?sig.p15:sig.p30;
    var dbl=(item.doubleProt&&pr)?pr.pDbl:0;
    var sc=item.extraSauce?2:0;
    return bp+dbl+sc;
  }
  var pr2=PROTS.find(function(x){return x.id===item.prot;});
  if(!pr2)return 0;
  var bp2=item.size==='15'?pr2.p15:pr2.p30;
  var dbl2=item.doubleProt?pr2.pDbl:0;
  var sc2=item.extraSauce?2:0;
  return bp2+dbl2+sc2;
}
function itemLineTotal(item){return itemUnitPrice(item)*item.qty;}
function itemLabel(item){
  if(item.type==='side'){var d=SIDES.find(function(x){return x.id===item.code;});return d?d.l+' // '+d.s:'';}
  if(item.type==='sig'){var sig=SIGS.find(function(x){return x.id===item.sigId;});return(sig?sig.n+' // '+sig.s:'')+' '+szLabel(item.size);}
  return fn(PROTS,item.prot)+' '+szLabel(item.size);
}
function itemExtrasLabel(item){
  if(item.type==='side')return'';
  var parts=[];
  if(item.doubleProt)parts.push('doble proteína');
  if(item.extraSauce)parts.push('salsa extra');
  if(item.note)parts.push('nota: '+item.note);
  return parts.join(' · ');
}
function cartBaseTotal(){return cart.reduce(function(s,it){return s+itemLineTotal(it);},0);}
// Un combo = 1 sándwich + 1 bebida en el carrito — si hay más sándwiches que bebidas (o
// viceversa), solo se descuenta por la cantidad de pares completos, no por cada unidad.
function cartComboCount(){
  var sw=0,sd=0;
  cart.forEach(function(it){if(it.type==='side')sd+=it.qty;else sw+=it.qty;});
  return Math.min(sw,sd);
}
function cartComboDiscount(){return cartComboCount()*COMBO_DISCOUNT_PER_PAIR;}
function cartOffPeakDrinkDiscount(){
  if(!isOffPeakDrinkPromoActiveNow())return 0;
  var sidePrices=[];
  cart.forEach(function(it){if(it.type==='side'){for(var i=0;i<it.qty;i++)sidePrices.push(itemUnitPrice(it));}});
  if(!sidePrices.length)return 0;
  return Math.min(Math.min.apply(null,sidePrices),OFFPEAK_DRINK_PROMO_CAP);
}
// Busca el primer producto del carrito elegible para una recompensa — R04 necesita
// una línea con doble proteína activada, R06 necesita una línea 15CM. El resto de
// recompensas no tiene requisito propio (basta con que el carrito no esté vacío).
function findRewardTargetIndex(rewardId){
  if(rewardId==='R04'){for(var i=0;i<cart.length;i++){if(cart[i].type!=='side'&&cart[i].doubleProt)return i;}return -1;}
  if(rewardId==='R06'){for(var j=0;j<cart.length;j++){if(cart[j].type!=='side'&&cart[j].size==='15')return j;}return -1;}
  return cart.length?0:-1;
}
function rewardWaiverAmount(rewardId,targetIdx){
  if(targetIdx<0)return 0;
  var it=cart[targetIdx];
  if(rewardId==='R04'){
    var protCode=it.type==='sig'?(SIGS.find(function(x){return x.id===it.sigId;})||{}).prot:it.prot;
    var pr=PROTS.find(function(x){return x.id===protCode;});
    return pr?pr.pDbl:0;
  }
  if(rewardId==='R06'){
    if(it.type==='sig'){var sig=SIGS.find(function(x){return x.id===it.sigId;});return sig?(it.size==='15'?sig.p15:sig.p30):0;}
    var pr2=PROTS.find(function(x){return x.id===it.prot;});
    return pr2?(it.size==='15'?pr2.p15:pr2.p30):0;
  }
  return 0;
}
function cartFinalTotal(){
  var base=cartBaseTotal()-cartComboDiscount()-cartOffPeakDrinkDiscount();
  if(!appliedReward)return Math.max(0,base);
  var idx=findRewardTargetIndex(appliedReward);
  return Math.max(0,base-rewardWaiverAmount(appliedReward,idx));
}
// El carrito se guarda en localStorage en cada cambio y se restaura al abrir la app
// (ver restoreCart() en INIT) — sin esto, refrescar la página, cerrar la pestaña por
// error o recibir una llamada a medio armar el pedido borraba todo el carrito, una
// causa común de abandono en apps de delivery. Se descarta si tiene más de 24h para
// no resucitar un carrito viejo con precios/catálogo ya desactualizados.
function saveCart(){
  try{
    if(cart.length)localStorage.setItem('sw_cart',JSON.stringify({items:cart,reward:appliedReward,ts:Date.now()}));
    else localStorage.removeItem('sw_cart');
  }catch(e){}
  scheduleCartSync();
}
var _cartSyncTimer=null;
// El recordatorio de carrito abandonado (remind-abandoned-cart, cron) necesita que el
// servidor sepa qué hay en el carrito de un cliente logueado — debounced para no mandar
// una llamada por cada tap mientras arma el pedido, solo cuando se queda quieto ~4s. Solo
// tiene sentido si puede recibir el push (pushSubscribed) y tiene cuenta (token) — un
// invitado o alguien sin notificaciones activas nunca podría recibir el aviso de todos
// modos, así que ni vale la pena sincronizar su carrito al servidor.
function scheduleCartSync(){
  if(!cust||!pushSubscribed||!token)return;
  if(_cartSyncTimer)clearTimeout(_cartSyncTimer);
  _cartSyncTimer=setTimeout(function(){
    api('sync-cart',{token:token,items:cart}).catch(function(){});
  },4000);
}
// Se llama una sola vez al abrir la app (ver INIT), después de resolver la sesión —
// así, si el cliente tiene cuenta, initCheckoutFields() prellena nombre/correo/
// dirección desde su perfil en vez de con campos vacíos.
// Un ítem de carrito válido siempre tiene un type reconocido y un qty numérico — sin
// esto, un localStorage corrupto o de una versión vieja de la app restauraba el carrito
// tal cual, y la pantalla de inicio terminaba mostrando "CARRITO // NaN items" en vez de
// simplemente empezar con el carrito vacío.
function isValidCartItem(it){
  return it&&typeof it==='object'&&(it.type==='byo'||it.type==='sig'||it.type==='side')&&typeof it.qty==='number'&&it.qty>0;
}
function restoreCart(){
  try{
    var raw=JSON.parse(localStorage.getItem('sw_cart')||'null');
    if(raw&&Array.isArray(raw.items)&&raw.items.length&&raw.items.every(isValidCartItem)&&Date.now()-(raw.ts||0)<24*3600*1000){
      cart=raw.items;
      initCheckoutFields();
      appliedReward=raw.reward||null;
    }
  }catch(e){}
}
function addSandwichToCart(){
  var wasEmpty=cart.length===0;
  cart.push(currentBuiltItem());
  if(wasEmpty)initCheckoutFields();
  resetBuilder();mode=null;
  saveCart();
  go('o_cart');
  showToast('¡Agregado al carrito! //','success');
}
function addSideToCart(code){
  var wasEmpty=cart.length===0;
  var existing=cart.find(function(it){return it.type==='side'&&it.code===code;});
  if(existing){existing.qty++;}else{cart.push({type:'side',code:code,qty:1});}
  if(wasEmpty)initCheckoutFields();
  saveCart();
  render();
  var d=SIDES.find(function(x){return x.id===code;});
  showToast('¡'+(d?d.l:'Producto')+' agregado! //','success');
}
function sideQtyChange(code,delta){
  var it=cart.find(function(x){return x.type==='side'&&x.code===code;});
  if(!it)return;
  it.qty+=delta;
  if(it.qty<=0)cart=cart.filter(function(x){return x!==it;});
  saveCart();
  render();
}
function cartQtyChange(idx,delta){
  syncConfirmFields();
  var it=cart[idx];if(!it)return;
  it.qty+=delta;
  if(it.qty<=0)cart.splice(idx,1);
  if(appliedReward&&findRewardTargetIndex(appliedReward)<0)appliedReward=null;
  saveCart();
  render();
}
function cartRemove(idx){
  syncConfirmFields();
  cart.splice(idx,1);
  if(appliedReward&&findRewardTargetIndex(appliedReward)<0)appliedReward=null;
  saveCart();
  render();
}
function clearCart(){cart=[];appliedReward=null;saveCart();go('o_home');}
// Reconstruye un carrito completo a partir de un pedido pasado o favorito multi-línea
// — usado por "repetir pedido", que reproduce todo el carrito anterior de un tap.
function loadCart(items){
  if(!items||!items.length)return;
  cart=items.map(function(it){return Object.assign({},it);});
  initCheckoutFields();
  saveCart();
  go('o_cart');
}
function ratedRefs(){try{return JSON.parse(localStorage.getItem('sw_rated')||'[]');}catch(e){return[];}}
function markRated(ref){var r=ratedRefs();if(r.indexOf(ref)<0){r.push(ref);localStorage.setItem('sw_rated',JSON.stringify(r));}}
async function loadUserExtras(){
  if(!cust)return;
  try{myAddresses=(await api('addresses-list',{token:token})).addresses||[];}catch(e){}
  try{myFavorites=(await api('favorites-list',{token:token})).favorites||[];}catch(e){}
  render();
}
// ORDER SIGNATURE
function sOHome(){
  var pc=cust
    ?'<div onclick="swTab(\'points\')" style="background:#1A3028;border:1px solid rgba(203,162,88,.2);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-top:4px"><div><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:2px">TUS PUNTOS //</div><div style="font-family:Barlow Condensed,sans-serif;font-size:26px;font-weight:900;color:#FFFFFF">'+(cust.points||0)+'</div></div><span style="font-family:Share Tech Mono,monospace;font-size:11px;color:'+GOLD+'">VER \u2192</span></div>'
    :'<div onclick="swTab(\'points\')" style="background:#2D5246;border:1px solid #3A6B58;border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-top:4px"><div><div style="font-family:Barlow Condensed,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF">ACUMULA<span style="color:'+GOLD+'"> // </span>PUNTOS</div><p style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-top:2px">Gana puntos con cada pedido.</p></div><span style="font-family:Share Tech Mono,monospace;font-size:11px;color:'+GOLD+'">UNIRSE \u2192</span></div>';
  var ss=storeStatus();
  // El rango de entrega antes solo aparecía ya adentro del checkout — mostrarlo aquí
  // fija la expectativa de tiempo antes de que el cliente arme un pedido, sin costo.
  var hoursBadge='<div style="display:flex;align-items:center;gap:6px;margin-bottom:16px;flex-wrap:wrap"><span style="width:6px;height:6px;border-radius:50%;background:'+(ss.open?'#25D366':'#ff8888')+'"></span><span style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+(ss.open?'#25D366':'#ff8888')+';letter-spacing:.1em">'+ss.label+'</span>'+(ss.open?'<span style="color:#A8C8B0;font-family:Share Tech Mono,monospace;font-size:9px">· '+ESTIMATED_DELIVERY_RANGE[0]+'-'+ESTIMATED_DELIVERY_RANGE[1]+' min</span>':'')+'</div>';
  var lastOrd=cust?lastPaidOrder():null;
  var recoItems=lastOrd?(lastOrd.items&&lastOrd.items.length?lastOrd.items:(lastOrd.build?[buildToCartItem(lastOrd.build)]:null)):null;
  var recoCard=recoItems?'<div onclick="loadCart('+JSON.stringify(recoItems).replace(/"/g,'&quot;')+')" style="background:#1A3028;border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:16px 18px;cursor:pointer;margin-bottom:16px"><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:6px">↻ REPETIR PEDIDO //</div><div style="font-family:Barlow,sans-serif;font-size:13px;color:#F2F0EB">'+esc(lastOrd.summary||'')+'</div><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:'+GOLD+';margin-top:6px">Pedir lo mismo \u2192</div></div>':'';
  var cartCard=cart.length?'<div onclick="go(\'o_cart\')" style="background:#2D5246;border:1px solid '+GOLD+';border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:16px"><span style="display:inline-flex;align-items:center;gap:8px;font-family:Barlow Condensed,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF">'+icon('cart',16,'#FFFFFF')+'CARRITO<span style="color:'+GOLD+'"> // </span>'+cart.reduce(function(s,it){return s+it.qty;},0)+' items</span><span style="font-family:Share Tech Mono,monospace;font-size:11px;color:'+GOLD+'">VER \u2192</span></div>':'';
  var pwaCard=(deferredInstallPrompt&&!pwaDismissed)?'<div style="background:#1A3028;border:1px solid rgba(203,162,88,.3);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:16px"><div onclick="installPwa()" style="flex:1"><div style="display:inline-flex;align-items:center;gap:8px;font-family:Barlow Condensed,sans-serif;font-size:14px;font-weight:700;color:#FFFFFF">'+icon('device',15,GOLD)+'INSTALAR<span style="color:'+GOLD+'"> // </span>APP</div><div style="font-family:Barlow,sans-serif;font-size:11px;color:#A8C8B0;margin-top:2px">Pide m\u00e1s r\u00e1pido desde tu pantalla de inicio</div></div><button onclick="event.stopPropagation();dismissPwaBanner()" style="all:unset;cursor:pointer;color:#A8C8B0;font-size:16px;padding:0 4px">&#10005;</button></div>':'';
  var nearbyCard=(nearStore&&ss.open)?'<div onclick="startOrder(\'sig\')" style="background:linear-gradient(135deg,#1E4A38,#1A3028);border:1px solid '+GOLD+';border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:16px"><div style="flex:1"><div style="display:inline-flex;align-items:center;gap:8px;font-family:Barlow Condensed,sans-serif;font-size:14px;font-weight:700;color:#FFFFFF">'+icon('direccion',15,GOLD)+'¡ESTÁS CERCA<span style="color:'+GOLD+'"> // </span>DEL LOCAL!</div><div style="font-family:Barlow,sans-serif;font-size:11px;color:#A8C8B0;margin-top:2px">Pide ahora y recíbelo en '+ESTIMATED_DELIVERY_RANGE[0]+' min aprox.</div></div><button onclick="event.stopPropagation();dismissNearbyBanner()" style="all:unset;cursor:pointer;color:#A8C8B0;font-size:16px;padding:0 4px">&#10005;</button></div>':'';
  return H()
    +'<div style="flex:1;padding:24px 20px 100px;overflow-y:auto" class="fi">'
    +hoursBadge
    +nearbyCard
    +pwaCard
    +cartCard
    +recoCard
    +'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#F2F0EB;opacity:.8;letter-spacing:.15em;margin-bottom:20px">\xbfCÓMO QUIERES PEDIR? //</div>'
    +'<div onclick="startOrder(\'sig\')" style="background:#1A3028;border:1px solid '+GOLD+';border-radius:12px;padding:22px 20px;cursor:pointer;margin-bottom:12px;position:relative">'
    +'<div style="position:absolute;right:16px;top:16px;font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+'">RECOMENDADO //</div>'
    +'<div style="font-family:Barlow Condensed,sans-serif;font-size:26px;font-weight:900;color:#fff;margin-bottom:8px">SIGNATURE<span style="color:'+GOLD+'"> // </span>BUILDS</div>'
    +'<p style="font-family:Barlow,sans-serif;font-size:13px;color:#A8C8B0;line-height:1.5">6 combinaciones curadas. Rápido, sin decisiones.</p>'
    +'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px">'+SIGS.map(function(s){var nw=s.badge==='NUEVO';return'<span style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+(nw?'#25D366':GOLD)+';background:'+(nw?'rgba(37,211,102,.08)':'rgba(203,162,88,.08)')+';border:1px solid '+(nw?'rgba(37,211,102,.2)':'rgba(203,162,88,.2)')+';border-radius:4px;padding:2px 8px">'+s.n+'</span>';}).join('')+'</div>'
    +'</div>'
    +'<div onclick="startOrder(\'byo\')" style="background:#2D5246;border:1px solid #3A6B58;border-radius:12px;padding:22px 20px;cursor:pointer;margin-bottom:16px">'
    +'<div style="font-family:Barlow Condensed,sans-serif;font-size:26px;font-weight:900;color:#fff;margin-bottom:8px">BUILD<span style="color:'+GOLD+'"> // </span>YOUR OWN</div>'
    +'<p style="font-family:Barlow,sans-serif;font-size:13px;color:#A8C8B0;line-height:1.5">Elige base, proteína, toppings y salsas.</p>'
    +'</div>'
    +(cust?'<div onclick="doCreateGroupOrder()" style="background:#2D5246;border:1px solid #3A6B58;border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:16px"><div><div style="font-family:Barlow Condensed,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF">PEDIDO<span style="color:'+GOLD+'"> // </span>GRUPAL</div><div style="font-family:Barlow,sans-serif;font-size:11px;color:#A8C8B0;margin-top:2px">Para la oficina — cada quien agrega su sándwich, pagas todo junto</div></div><span style="font-family:Share Tech Mono,monospace;font-size:11px;color:'+GOLD+'">ORGANIZAR →</span></div>':'')
    +(cust&&myFavorites.length?'<div onclick="sc=\'p_favorites\';render()" style="background:#2D5246;border:1px solid #3A6B58;border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:16px"><span style="font-family:Barlow Condensed,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF">☆ MIS<span style="color:'+GOLD+'"> // </span>FAVORITOS</span><span style="font-family:Share Tech Mono,monospace;font-size:11px;color:'+GOLD+'">VER \u2192</span></div>':'')
    +pc
    +contactFooterHTML()
    +'</div>'+NAV();
}

// PEDIDO GRUPAL / DE OFICINA
// Cualquiera con el link agrega su propio Signature bajo su nombre, sin necesitar cuenta
// (solo quien organiza necesita sesión, para poder cerrar y pagar todo junto). Al cerrar,
// el servidor solo devuelve los items ya agregados — se cargan con loadCart() y de ahí en
// adelante es EXACTAMENTE el mismo carrito/checkout de siempre (combo, menú secreto, todo
// se valida igual), sin duplicar nada de esa lógica acá.
function shareGroupOrder(){
  var link=location.origin+location.pathname+'?group='+encodeURIComponent(groupCode);
  var text='Únete a mi pedido grupal en SND//WCH y agrega tu sándwich: '+link;
  if(navigator.share){navigator.share({title:'SND//WCH',text:text,url:link}).catch(function(){});}
  else{window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');}
}
async function doCreateGroupOrder(){
  if(!cust){showToast('Inicia sesión para organizar un pedido grupal.');return;}
  busy=true;busyMsg='Creando pedido grupal...';render();
  var res;
  try{res=await api('create-group-order',{token:token});}
  catch(e){busy=false;render();showToast(e.message);return;}
  groupCode=res.code;groupData=null;groupMsg='';
  busy=false;sc='group_order';render();
  loadGroupOrder();
  startGroupPoll();
}
async function loadGroupOrder(){
  if(!groupCode)return;
  try{
    var res=await api('get-group-order',{token:token,code:groupCode});
    groupData=res;
    render();
  }catch(e){stopGroupPoll();showToast(e.message);sc='o_home';render();}
}
function startGroupPoll(){
  stopGroupPoll();
  _groupPollTimer=setInterval(function(){if(sc==='group_order')loadGroupOrder();else stopGroupPoll();},5000);
}
function stopGroupPoll(){if(_groupPollTimer){clearInterval(_groupPollTimer);_groupPollTimer=null;}}
async function doAddGroupItem(sigId){
  var nameEl=(document.getElementById('grp-name') as HTMLInputElement | null);
  var name=nameEl?nameEl.value.trim():groupJoinName;
  if(!name){groupMsg='Ingresa tu nombre antes de agregar tu pedido.';render();return;}
  groupJoinName=name;
  try{localStorage.setItem('sw_group_name',name);}catch(e){}
  try{
    // Manda token (vacío si es invitado) para que el servidor sepa si quien agrega es
    // quien organizó, y así no le mande una notificación push a sí mismo.
    await api('add-group-item',{code:groupCode,contributorName:name,token:token,item:{type:'sig',sigId:sigId,size:groupSize,doubleProt:false,extraSauce:false,qty:1}});
    groupMsg='¡Listo! Tu pedido se agregó.';
    loadGroupOrder();
  }catch(e){groupMsg=e.message;render();}
}
async function doCloseGroupOrder(){
  if(!(await showConfirm('¿Cerrar el pedido grupal y continuar a pagar todo junto?')))return;
  busy=true;busyMsg='Cerrando pedido grupal...';render();
  var res;
  try{res=await api('close-group-order',{token:token,code:groupCode});}
  catch(e){busy=false;render();showToast(e.message);return;}
  stopGroupPoll();
  busy=false;
  loadCart(res.items); // ya navega a o_cart y renderiza
}
async function doCancelGroupOrder(){
  if(!(await showConfirm('¿Cancelar este pedido grupal? Se perderá todo lo agregado.')))return;
  try{await api('cancel-group-order',{token:token,code:groupCode});}
  catch(e){showToast(e.message);return;}
  stopGroupPoll();
  sc='o_home';render();
}
function sGroupOrder(){
  var g=groupData;
  var bk="stopGroupPoll();sc='o_home';render()";
  if(!g){
    return H('PEDIDO GRUPAL',bk)+'<div style="flex:1;padding:20px" class="fi">'+skeletonCards(3,64)+'</div>'+NAV();
  }
  var h=H('PEDIDO GRUPAL',bk)+'<div style="flex:1;padding:20px 20px 100px;overflow-y:auto" class="fi">';
  h+='<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:24px;font-weight:900;color:#fff;margin-bottom:4px">PEDIDO<span style="color:'+GOLD+'"> // </span>GRUPAL</div>';
  h+='<div style="font-family:\'Share Tech Mono\',monospace;font-size:11px;color:'+GOLD+';letter-spacing:.1em;margin-bottom:16px">Organiza '+esc(g.organizerName)+' · código '+esc(g.code)+'</div>';
  if(g.status==='open'){
    var msLeft=new Date(g.expiresAt).getTime()-Date.now();
    if(msLeft>0){
      var minsLeft=Math.floor(msLeft/60000),secsLeft=Math.floor((msLeft%60000)/1000);
      var urgent=msLeft<120000;
      h+='<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:'+(urgent?'#ff8888':'#A8C8B0')+';letter-spacing:.1em;margin-bottom:14px">CIERRA EN '+minsLeft+':'+String(secsLeft).padStart(2,'0')+'</div>';
    }
  }
  if(g.isOrganizer&&g.status==='open'){
    h+=BTN('COMPARTIR LINK //','shareGroupOrder()');
  }
  h+=(g.items.length?g.items.map(function(it){
    return'<div style="background:#1A3028;border:1px solid #3A6B58;border-radius:10px;padding:12px 14px;margin:10px 0 0;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;color:#FFFFFF">'+esc(it.label)+'</div><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0">'+esc(it.contributorName)+'</div></div><div style="font-family:\'Share Tech Mono\',monospace;font-size:13px;color:'+GOLD+'">'+SOLES+it.unitPrice+'</div></div>';
  }).join(''):'<div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-top:14px">Nadie agregó su pedido todavía.</div>');
  h+='<div style="display:flex;justify-content:space-between;align-items:center;background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px;margin:16px 0"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;color:#F2F0EB">TOTAL</span><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:24px;font-weight:900;color:'+GOLD+'">'+SOLES+g.total+'</span></div>';
  if(g.status!=='open'){
    h+='<div style="text-align:center;font-family:\'Share Tech Mono\',monospace;font-size:11px;color:#A8C8B0;letter-spacing:.1em">'+(g.status==='cancelled'?'ESTE PEDIDO GRUPAL FUE CANCELADO':'ESTE PEDIDO GRUPAL YA SE CERRÓ')+'</div>';
  }else{
    // Antes esta sección solo se mostraba a quien NO organizaba — quien creó el pedido
    // grupal podía compartir el link y cerrar/cobrar, pero nunca agregar su propio
    // sándwich (hallazgo reportado en vivo). Ahora se muestra siempre que el pedido
    // siga abierto, sin importar quién sea.
    h+='<div style="height:1px;background:#1E3932;margin:20px 0"></div>';
    h+='<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:12px">AGREGAR MI PEDIDO //</div>';
    h+=INP('grp-name','TU NOMBRE','text',groupJoinName||(g.isOrganizer&&cust?cust.name:''));
    h+='<div style="display:flex;gap:8px;margin:10px 0"><div onclick="groupSize=\'15\';render()" style="flex:1;text-align:center;padding:10px;border-radius:8px;cursor:pointer;background:'+(groupSize==='15'?GOLD:'#1A3028')+';color:'+(groupSize==='15'?'#0d0d0d':'#A8C8B0')+';font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700">15CM</div><div onclick="groupSize=\'30\';render()" style="flex:1;text-align:center;padding:10px;border-radius:8px;cursor:pointer;background:'+(groupSize==='30'?GOLD:'#1A3028')+';color:'+(groupSize==='30'?'#0d0d0d':'#A8C8B0')+';font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700">30CM</div></div>';
    h+=SIGS.filter(function(s){return!s.secret;}).map(function(s){
      var price=groupSize==='15'?s.p15:s.p30;
      return'<div style="background:#1A3028;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF">'+s.n+'<span style="color:'+GOLD+'"> // </span>'+sigTypeTag(s.s)+'</div><div style="font-family:\'Share Tech Mono\',monospace;font-size:12px;color:'+GOLD+'">'+SOLES+price+'</div></div><button onclick="doAddGroupItem(\''+s.id+'\')" style="all:unset;cursor:pointer;background:'+GOLD+';color:#0d0d0d;font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;padding:9px 16px;border-radius:8px">AGREGAR</button></div>';
    }).join('');
    h+='<div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:'+GOLD+';margin-top:8px;min-height:14px">'+esc(groupMsg)+'</div>';
    if(g.isOrganizer){
      h+='<div style="height:1px;background:#1E3932;margin:20px 0"></div>';
      h+=BTN('CERRAR Y PAGAR //','doCloseGroupOrder()');
      h+='<div onclick="doCancelGroupOrder()" style="text-align:center;margin-top:14px;cursor:pointer;font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#ff8888;letter-spacing:.1em">CANCELAR PEDIDO GRUPAL</div>';
    }
  }
  h+='</div>'+NAV();
  return h;
}

function sOSig(){
  // "Tu de siempre" — mismo repetir-último-pedido que ya existe en el home, pero
  // visible también aquí (donde el cliente ya está decidiendo qué pedir) para el que
  // ya sabe qué quiere y prefiere decidir en un tap en vez de volver al home primero.
  var lastOrdSig=cust?lastPaidOrder():null;
  var recoItemsSig=lastOrdSig?(lastOrdSig.items&&lastOrdSig.items.length?lastOrdSig.items:(lastOrdSig.build?[buildToCartItem(lastOrdSig.build)]:null)):null;
  var recoCardSig=recoItemsSig?'<div onclick="loadCart('+JSON.stringify(recoItemsSig).replace(/"/g,'&quot;')+')" style="background:#1A3028;border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:14px 16px;cursor:pointer;margin-bottom:16px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:6px">↻ TU DE SIEMPRE //</div><div style="font-family:\'Barlow\',sans-serif;font-size:13px;color:#F2F0EB">'+esc(lastOrdSig.summary||'')+'</div></div>':'';
  var h=H('SIGNATURE BUILDS','go(\'o_home\')',true)+'<div style="flex:1;padding:20px 20px 100px;overflow-y:auto" class="fi">'+SZTOG()+recoCardSig+ST('01','ELIGE TU BUILD','Tres salsas incluidas.')+SIGS.map(function(s){
    // Menú secreto (ver s.secret/s.minOrders) — invisible para invitados, y para un
    // cliente logueado que todavía no llega al rango exigido se muestra como una
    // tarjeta bloqueada (genera aspiración) en vez de ocultarse sin explicación.
    if(s.secret){
      if(!cust)return'';
      var myTotal=cust.total_orders||0;
      if(myTotal<s.minOrders){
        var missing=s.minOrders-myTotal;
        return'<div style="background:#0d1a15;border:1px dashed rgba(203,162,88,.35);border-radius:10px;padding:16px;margin-bottom:10px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:18px;font-weight:700;color:#A8C8B0;display:flex;align-items:center;gap:8px">'+icon('lock',15,'#A8C8B0')+s.n+'<span style="color:#A8C8B0"> // </span>'+sigTypeTag(s.s)+'</div><div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-top:8px">Se desbloquea en CÍRCULO INTERNO — te faltan '+missing+' pedido'+(missing===1?'':'s')+'.</div></div>';
      }
    }
    var sel=sigId===s.id,pr=PROTS.find(function(x){return x.id===s.prot;}),bs=BASES.find(function(x){return x.id===s.base;});
    var av=isAvail(s.base)&&isAvail(s.prot);
    var priceTag=size?SOLES+sigPrice(s):'—';
    if(!av){
      var notifyRequested=restockNotified.indexOf(s.id)>=0;
      return'<div style="background:#1A2420;border:1px solid rgba(255,85,85,.3);border-radius:10px;padding:16px;margin-bottom:10px;opacity:.7"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:18px;font-weight:700;color:#A8C8B0">'+s.n+'<span style="color:#A8C8B0"> // </span>'+sigTypeTag(s.s)+'</span><span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#ff8888">AGOTADO</span></div><div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-top:8px">'+(bs?bs.l+' // '+bs.s:'')+' · '+(pr?pr.l+' // '+pr.s:'')+'</div>'
        +(cust?'<button onclick="doRequestRestockNotify(\''+s.id+'\')" '+(notifyRequested?'disabled':'')+' style="all:unset;cursor:'+(notifyRequested?'default':'pointer')+';display:block;margin-top:10px;font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+(notifyRequested?'#25D366':GOLD)+';letter-spacing:.08em">'+(notifyRequested?'✓ TE AVISAMOS CUANDO VUELVA':'AVÍSAME CUANDO VUELVA →')+'</button>':'')
        +'</div>';
    }
    var thumb=SIG_IMG[s.id]?'<img src="'+SIG_IMG[s.id]+'" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:8px;flex-shrink:0" loading="lazy">':'';
    return'<div onclick="sigId=\''+s.id+'\';render()" style="background:'+(sel?'#1E4A38':'#1A3028')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:10px;padding:16px;cursor:pointer;margin-bottom:10px;position:relative;transition:all .15s"><div style="display:flex;gap:14px">'+thumb+'<div style="flex:1;min-width:0">'+selBar(sel)+'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:18px;font-weight:700;color:#FFFFFF">'+s.n+'<span style="color:'+GOLD+'"> // </span>'+sigTypeTag(s.s)+'</span><span style="font-family:\'Share Tech Mono\',monospace;font-size:14px;color:'+(sel?GOLD:'#444')+';margin-left:12px">'+priceTag+'</span></div><span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.35);border-radius:4px;padding:2px 7px">'+s.badge+'</span>'+(s.chef?'<span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#0d0d0d;background:'+GOLD+';border-radius:4px;padding:2px 7px;margin-left:6px">FAVORITO DEL CHEF</span>':'')+lowStockNote(s.prot)+'<div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-top:8px">'+(bs?bs.l+' // '+bs.s:'')+' · '+(pr?pr.l+' // '+pr.s:'')+'</div><div onclick="event.stopPropagation();openSigPreview(\''+s.id+'\')" style="margin-top:10px;display:inline-flex;align-items:center;gap:5px;font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.1em;cursor:pointer">'+icon('camera',11,GOLD)+'VER FOTO →</div></div></div></div>';
  }).join('');
  var sig=SIGS.find(function(x){return x.id===sigId;});
  return h+'</div>'+(previewSigId?sigPreviewOverlayHTML():'')+AB(size&&sig?sigPrice(sig):null,!!(size&&sigId),'go(\'o_home\')','enterConfirm()');
}
function openSigPreview(id){previewSigId=id;render();}
function closeSigPreview(){previewSigId=null;render();}
// Vista previa "referencial" de un Signature build — hasta tener fotografía
// profesional/IA, se ilustra con la paleta de marca en vez de una foto real.
function sigPreviewOverlayHTML(){
  var s=SIGS.find(function(x){return x.id===previewSigId;});
  if(!s)return'';
  var pr=PROTS.find(function(x){return x.id===s.prot;}),bs=BASES.find(function(x){return x.id===s.base;});
  var toppingsLbl=s.tops.map(function(id){return fn(TOPS,id);}).join(' · ');
  var saucesLbl=s.sauces.map(function(id){return fn(SAUCES,id);}).join(' + ');
  var photo=SIG_IMG[s.id];
  var hero=photo
    ?'<div style="position:relative;border-radius:14px 14px 0 0;overflow:hidden;height:220px"><img src="'+photo+'" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"><div style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(30,57,50,.92),rgba(30,57,50,.15) 55%,rgba(30,57,50,0));display:flex;flex-direction:column;justify-content:flex-end;padding:20px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:24px;font-weight:900;color:#fff">'+s.n+'<span style="color:'+GOLD+'"> // </span>'+sigTypeTag(s.s)+'</div><span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';background:rgba(203,162,88,.15);border:1px solid rgba(203,162,88,.4);border-radius:4px;padding:2px 8px;margin-top:8px;display:inline-block;width:fit-content">'+s.badge+'</span></div></div>'
    :'<div style="background:linear-gradient(160deg,#2D5246,#1A3028);border-radius:14px 14px 0 0;padding:32px 20px;text-align:center;position:relative;overflow:hidden">'
    +'<div style="position:absolute;top:10px;right:14px;font-family:\'Share Tech Mono\',monospace;font-size:8px;color:rgba(242,240,235,.5);letter-spacing:.15em">IMAGEN REFERENCIAL</div>'
    +'<div style="margin-bottom:10px;opacity:.55;display:flex;justify-content:center">'+icon('sandwich',56,GOLD)+'</div>'
    +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:24px;font-weight:900;color:#fff">'+s.n+'<span style="color:'+GOLD+'"> // </span>'+sigTypeTag(s.s)+'</div>'
    +'<span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.35);border-radius:4px;padding:2px 8px;margin-top:8px;display:inline-block">'+s.badge+'</span>'
    +'</div>';
  return'<div onclick="closeSigPreview()" style="position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;display:flex;align-items:flex-end;justify-content:center" class="fi">'
    +'<div onclick="event.stopPropagation()" style="background:#1E3932;border-radius:14px 14px 0 0;width:100%;max-width:480px;max-height:88vh;overflow-y:auto">'
    +hero
    +'<div style="padding:20px">'
    +'<p style="font-family:\'Barlow\',sans-serif;font-size:13px;color:#F2F0EB;line-height:1.6;margin-bottom:16px">'+esc(s.pitch||'')+'</p>'
    +'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px;margin-bottom:16px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">INGREDIENTES //</div>'
    +'<div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;line-height:1.8">'
    +'<div><span style="color:'+GOLD+'">Pan · </span>'+(bs?bs.l+' // '+bs.s:'')+'</div>'
    +'<div><span style="color:'+GOLD+'">Proteína · </span>'+(pr?pr.l+' // '+pr.s:'')+'</div>'
    +'<div><span style="color:'+GOLD+'">Toppings · </span>'+toppingsLbl+'</div>'
    +'<div><span style="color:'+GOLD+'">Salsas · </span>'+saucesLbl+'</div>'
    +'</div></div>'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#A8C8B0">15CM // 30CM</span><span style="font-family:\'Share Tech Mono\',monospace;font-size:13px;color:'+GOLD+'">'+SOLES+s.p15+' // '+SOLES+s.p30+'</span></div>'
    +'<button onclick="closeSigPreview();sigId=\''+s.id+'\';go(\'o_sig\')" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#fff;font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;letter-spacing:.1em;padding:14px;border-radius:10px;text-align:center;margin-bottom:8px">PEDIR ESTE SIGNATURE //</button>'
    +'<div onclick="closeSigPreview()" style="text-align:center;cursor:pointer;font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#A8C8B0;letter-spacing:.1em;padding:4px">CERRAR</div>'
    +'</div></div></div>';
}

// ORDER BUILD
function sOBuild(){
  var tL=tops.length,sL=sauces.length;
  var h=H('BUILD YOUR OWN','go(\'o_home\')',true)+'<div style="flex:1;padding:20px 20px 110px;overflow-y:auto" class="fi">'+SZTOG();
  h+=ST('01','PAN','');
  h+=BASES.map(function(b){var av=isAvail(b.id);return av?CARD(b,base===b.id,'base=\''+b.id+'\';render()'):CARDOFF(b);}).join('');
  h+='<div style="height:1px;background:#1E3932;margin:20px 0"></div>';
  h+=ST('02','PROTEÍNA','');
  h+=PROTS.filter(function(p){return !p.vaultOnly;}).map(function(p){var av=isAvail(p.id);var priceTag=size?SOLES+protPrice(p):'—';var thumb=PROT_IMG[p.id]?'<img src="'+PROT_IMG[p.id]+'" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:8px;flex-shrink:0" loading="lazy">':'';return av?CARD(p,prot===p.id,'prot=\''+p.id+'\';render()','<span style="font-family:\'Share Tech Mono\',monospace;font-size:14px;color:'+(prot===p.id?GOLD:'#444')+'">'+priceTag+'</span>'+lowStockNote(p.id),thumb):CARDOFF(p);}).join('');
  h+='<div style="height:1px;background:#1E3932;margin:20px 0"></div>';
  h+=ST('03','TOPPINGS','Sin límite, elige los que quieras.');
  h+='<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:'+GOLD+';margin-bottom:12px">'+tL+' seleccionados</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h+=TOPS.map(function(t: any){
    var av=isAvail(t.id);
    if(!av)return TOPOFF(t);
    var sel=tops.indexOf(t.id)>=0;
    return'<div onclick="var i=tops.indexOf(\''+t.id+'\');if(i>=0)tops.splice(i,1);else tops.push(\''+t.id+'\');render()" style="background:'+(sel?'#1E4A38':'#1A3028')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:10px;padding:13px 14px;cursor:pointer;position:relative;transition:all .15s">'+selBar(sel)+'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#FFFFFF">'+t.l+'<span style="color:'+GOLD+'"> // </span>'+t.s+'</div>'+(t.d?'<div style="font-family:\'Barlow\',sans-serif;font-size:10px;color:#A8C8B0;margin-top:3px">'+t.d+'</div>':'')+'</div>';
  }).join('');
  h+='</div><div style="height:1px;background:#1E3932;margin:20px 0"></div>';
  h+=ST('04','QUESO','Incluido sin costo, elige 1.');
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h+=CHEESE.map(function(c){
    var av=isAvail(c.id);
    if(!av)return TOPOFF(c);
    var sel=cheese===c.id;
    return'<div onclick="cheese=(cheese===\''+c.id+'\'?null:\''+c.id+'\');render()" style="background:'+(sel?'#1E4A38':'#1A3028')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:10px;padding:13px 14px;cursor:pointer;position:relative;transition:all .15s">'+selBar(sel)+'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#FFFFFF">'+c.l+'</div></div>';
  }).join('');
  h+='</div><div style="height:1px;background:#1E3932;margin:20px 0"></div>';
  h+=ST('05','SALSAS','Hasta 3, incluidas sin costo.');
  h+='<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:'+GOLD+';margin-bottom:12px">'+sL+' // 3</div>';
  h+=SAUCES.map(function(s){
    var av=isAvail(s.id);
    if(!av)return'<div style="background:#1A3028;border:1px solid #2a2a2a;border-radius:10px;padding:14px 16px;margin-bottom:8px;opacity:.35"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:16px;font-weight:700;color:#A8C8B0">'+s.l+'<span style="color:#A8C8B0"> // </span>'+s.s+'<span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#ff8888;margin-left:8px">AGOTADO</span></div></div>';
    var sel=sauces.indexOf(s.id)>=0,full=!sel&&sL>=3;
    return'<div onclick="var i=sauces.indexOf(\''+s.id+'\');if(i>=0)sauces.splice(i,1);else if(sauces.length<3)sauces.push(\''+s.id+'\');render()" style="background:'+(sel?'#1E4A38':'#1A3028')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:10px;padding:14px 16px;cursor:'+(full?'not-allowed':'pointer')+';opacity:'+(full?.3:1)+';margin-bottom:8px;position:relative;transition:all .15s">'+selBar(sel)+'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:16px;font-weight:700;color:#FFFFFF">'+s.l+'<span style="color:'+GOLD+'"> // </span>'+s.s+'</div><p style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-top:4px">'+s.d+'</p></div>';
  }).join('');
  h+=AB(size&&prot&&sL>0?total():null,!!(size&&base&&prot&&sL>0),'go(\'o_home\')','enterConfirm()');
  return h;
}
function CARDOFF(item){return'<div style="background:#1A3028;border:1px solid #2a2a2a;border-radius:10px;padding:14px 16px;margin-bottom:10px;opacity:.35"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:16px;font-weight:700;color:#A8C8B0">'+item.l+'<span style="color:#A8C8B0"> // </span>'+item.s+'</span><span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#ff8888">AGOTADO</span></div></div>';}
function TOPOFF(t){return'<div style="background:#1A3028;border:1px solid #2a2a2a;border-radius:10px;padding:13px 14px;opacity:.35"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#A8C8B0">'+t.l+'<span style="font-family:\'Share Tech Mono\',monospace;font-size:8px;color:#ff8888;display:block;margin-top:3px">AGOTADO</span></div></div>';}

// ORDER CONFIRM + SMART UPSELL
// PER-ITEM REVIEW — revisar un sándwich recién armado antes de agregarlo al carrito
function sOItemConfirm(){
  var sig=SIGS.find(function(x){return x.id===sigId;}),pr=PROTS.find(function(x){return x.id===prot;});
  var bk=mode==='sig'?'o_sig':'o_build',rows=[];
  var dbl=dblProtRef();
  var bp=mode==='sig'?sigPrice(sig):protPrice(pr);
  var dblSurcharge=(doubleProt&&dbl)?dbl.pDbl:0;
  var sauceSurcharge=extraSauce?2:0;
  var t=quickPayEligible?cartFinalTotal():total();
  rows.push({k:'TAMAÑO',v:szLabel(size)});
  // Un Signature es curado por la casa — desglosarlo en pan/proteína/toppings/salsas
  // solo repite lo que ya dice el nombre del sándwich. Solo BUILD YOUR OWN (donde el
  // cliente sí eligió cada ingrediente) muestra ese desglose completo.
  if(mode!=='sig'){rows.push({k:'PAN',v:fn(BASES,base)});rows.push({k:'PROTEÍNA',v:fn(PROTS,prot),p:protPrice(pr)});rows.push({k:'TOPPINGS',v:tops.length?tops.map(function(id){return fn(TOPS,id);}).join(' · '):'—'});rows.push({k:'QUESO',v:cheese?fn(CHEESE,cheese):'sin queso'});rows.push({k:'SALSAS',v:sauces.length?sauces.map(function(id){return fn(SAUCES,id);}).join(' + '):'—'});}
  if(doubleProt&&dbl)rows.push({k:'DOBLE',v:'Doble '+dbl.l+' // '+dbl.s,p:dbl.pDbl});
  if(extraSauce)rows.push({k:'SALSA EXTRA',v:'Salsa adicional a tu elección',p:2});
  var recU=(!doubleProt&&dbl)?{k:'doubleProt',e:icon('dumbbell',18,GOLD),l:'DOBLE PROTEÍNA',d:'El doble de tu proteína elegida',p:dbl.pDbl}:!extraSauce?{k:'sauce',e:icon('chili',18,GOLD),l:'SALSA EXTRA',d:'Salsa adicional a tu elección',p:2}:null;
  function uSel(k){return k==='doubleProt'?doubleProt:k==='sauce'?extraSauce:false;}
  function uBtn(k,e,l,d,p,sel){
    var act=(k==='doubleProt'?'doubleProt=!doubleProt':'extraSauce=!extraSauce')+(quickPayEligible?';cart[0]=currentBuiltItem()':'');
    return'<div onclick="'+act+';'+(quickPayEligible?'confirmRerender()':'render()')+'" style="background:'+(sel?'#1E4A38':'#1A3028')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:8px;position:relative;transition:all .15s">'+selBar(sel)+'<div style="display:flex;align-items:center;gap:10px"><span style="font-size:18px">'+e+'</span><div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF">'+l+'</div><div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0">'+d+'</div></div></div><span style="font-family:\'Share Tech Mono\',monospace;font-size:13px;color:'+(sel?GOLD:'#A8C8B0')+';flex-shrink:0;margin-left:8px">'+(sel?'✓ ':'+')+SOLES+p+'</span></div>';
  }
  var sigNameHTML=(mode==='sig'&&sig)?'<div style="margin:2px 0 14px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:26px;font-weight:900;color:#FFFFFF;letter-spacing:.03em;line-height:1.15">'+sig.n+'<span style="color:'+GOLD+'"> // </span>'+sigTypeTag(sig.s)+'</div></div>':'';
  return H('CONFIRMAR SÁNDWICH',(quickPayEligible?'backFromConfirm()':'go(\''+bk+'\')'),true)+'<div style="flex:1;padding:20px 20px 110px;overflow-y:auto" class="fi">'
    +'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:16px;margin-bottom:16px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.25em;margin-bottom:14px;font-weight:700">'+(mode==='sig'?'TU SIGNATURE //':'TU BUILD //')+'</div>'+rows.map(function(r){return'<div style="display:flex;justify-content:space-between;margin-bottom:9px;gap:8px;align-items:flex-start"><span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';min-width:72px">'+r.k+'</span><span style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#F2F0EB;flex:1;line-height:1.4">'+r.v+'</span>'+(r.p?'<span style="font-family:\'Share Tech Mono\',monospace;font-size:11px;color:'+GOLD+';flex-shrink:0">'+SOLES+r.p+'</span>':'')+'</div>';}).join('')+sigNameHTML+'<div style="border-top:1px solid #3A6B58;margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;align-items:center"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;color:#F2F0EB">TOTAL</span><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:28px;font-weight:900;color:'+GOLD+'">'+SOLES+t+'</span></div></div>'
    +(recU?'<div style="background:#1A3028;border:1px solid rgba(203,162,88,.3);border-radius:10px;padding:14px 16px;margin-bottom:12px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">¿ALGO MÁS? //</div>'+uBtn(recU.k,recU.e,recU.l,recU.d,recU.p,uSel(recU.k))+'</div>':'')
    +'<details style="margin-bottom:12px"><summary style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;cursor:pointer;font-weight:700;list-style:none;padding:8px 0">TODOS LOS EXTRAS // ▾</summary><div style="margin-top:8px">'+(dbl?uBtn('doubleProt',icon('dumbbell',18,GOLD),'DOBLE PROTEÍNA','El doble de tu proteína elegida',dbl.pDbl,doubleProt):'')+uBtn('sauce',icon('chili',18,GOLD),'SALSA EXTRA','Salsa adicional a tu elección',2,extraSauce)+'</div></details>'
    +(cust?'<div style="margin-top:16px;background:#1A3028;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:8px">☆ GUARDAR COMO FAVORITO //</div><div style="display:flex;gap:8px"><input id="o-favname" type="text" placeholder="Nombre // opcional" style="flex:1;background:#2D5246;border:1px solid #0d0d0d;border-radius:8px;padding:10px 12px;color:#FFFFFF;font-size:13px"><button onclick="doSaveFavorite()" style="all:unset;cursor:pointer;background:'+GOLD+';color:#fff;font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;padding:10px 16px;border-radius:8px">GUARDAR</button></div><div id="fav-msg" style="font-family:\'Barlow\',sans-serif;font-size:11px;color:'+GOLD+';margin-top:6px">'+favMsg+'</div></div>':'')
    +(quickPayEligible
        ?checkoutExtrasHTML()+'<div onclick="goToCartFromConfirm()" style="margin-top:16px;text-align:center;background:#1A3028;border:1px solid #3A6B58;border-radius:8px;padding:12px;cursor:pointer"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#FFFFFF">+ CARRITO</div><div style="font-family:\'Barlow\',sans-serif;font-size:10px;color:#A8C8B0;margin-top:2px">por si deseas pedir más de un SND//WCH</div></div>'
        :'<div id="o-err" style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#ff5555;margin-top:8px;min-height:16px"></div>')
    +'</div>'
    +(quickPayEligible
        ?AB(t,!checkoutLocked,'backFromConfirm()','doOrder()',payButtonLabel(t,'PAGAR AHORA //'))
        :AB(t,true,'go(\''+bk+'\')','addSandwichToCart()','AGREGAR AL CARRITO //'));
}
async function doSaveFavorite(){
  var nameEl=(document.getElementById('o-favname') as HTMLInputElement | null);
  var typed=nameEl?nameEl.value.trim():'';
  // El nombre es opcional — si no escribe uno, usamos el nombre del propio sándwich
  // (el signature, o proteína+tamaño para build-your-own) en vez de bloquear el guardado.
  var sigForName=mode==='sig'?SIGS.find(function(x){return x.id===sigId;}):null;
  var defaultName=sigForName?(sigForName.n+' '+szLabel(size)):(fn(PROTS,prot)+' '+szLabel(size));
  var name=typed||defaultName;
  try{
    await api('favorites-add',{token:token,name:name,mode:mode,sigId:sigId,base:base,prot:prot,tops:tops,cheese:cheese,sauces:sauces,size:size,doubleProt:doubleProt,extraSauce:extraSauce});
    favMsg='¡Guardado!';
    loadUserExtras();
  }catch(e){favMsg=e.message;render();}
}

// SIDES/BEBIDAS
function sOSides(){
  var h=H('BEBIDAS Y SIDES',"sc='o_cart';render()",true)+'<div style="flex:1;padding:20px 20px 100px;overflow-y:auto" class="fi">'+ST('01','ELIGE','Se agregan a tu carrito.');
  h+=SIDES.map(function(d){
    var inCart=cart.find(function(it){return it.type==='side'&&it.code===d.id;});
    var qty=inCart?inCart.qty:0;
    return'<div style="background:#1A3028;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px"><div style="flex:1"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:16px;font-weight:700;color:#FFFFFF">'+d.l+'<span style="color:'+GOLD+'"> // </span>'+d.s+'</div>'+(d.d?'<div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0;margin-top:3px;line-height:1.4">'+esc(d.d)+'</div>':'')+'<div style="font-family:\'Share Tech Mono\',monospace;font-size:11px;color:'+GOLD+';margin-top:4px">'+SOLES+d.p+'</div></div>'+(qty>0?'<div style="display:flex;align-items:center;gap:10px"><button onclick="sideQtyChange(\''+d.id+'\',-1)" style="all:unset;cursor:pointer;width:34px;height:34px;background:#2D5246;border-radius:6px;text-align:center;color:#FFFFFF;font-family:\'Barlow Condensed\',sans-serif;font-size:16px;font-weight:700">−</button><span class="bump" style="display:inline-block;font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;min-width:14px;text-align:center">'+qty+'</span><button onclick="sideQtyChange(\''+d.id+'\',1)" style="all:unset;cursor:pointer;width:34px;height:34px;background:#2D5246;border-radius:6px;text-align:center;color:#FFFFFF;font-family:\'Barlow Condensed\',sans-serif;font-size:16px;font-weight:700">+</button></div>':'<button onclick="addSideToCart(\''+d.id+'\')" style="all:unset;cursor:pointer;background:'+GOLD+';color:#fff;font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;padding:9px 16px;border-radius:8px">AGREGAR</button>')+'</div>';
  }).join('');
  h+='</div>'+AB(null,true,null,"sc='o_cart';render()",'VER CARRITO //');
  return h;
}

// CARRITO + CHECKOUT
function cartItemsHTML(){
  if(!cart.length)return'<div style="text-align:center;padding:24px 0"><div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:'+GOLD+';letter-spacing:.2em">CARRITO VACÍO //</div></div>';
  return cart.map(function(it,idx){
    var extras=itemExtrasLabel(it);
    var canEdit=it.type!=='side';
    return'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div style="flex:1"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF">'+esc(itemLabel(it))+'</div>'+(extras?'<div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0;margin-top:2px">'+esc(extras)+'</div>':'')+'</div><div style="display:flex;gap:10px;flex-shrink:0">'+(canEdit?'<button onclick="editCartItem('+idx+')" style="all:unset;cursor:pointer;color:'+GOLD+';font-family:\'Share Tech Mono\',monospace;font-size:10px">EDITAR</button>':'')+'<button onclick="cartRemove('+idx+')" style="all:unset;cursor:pointer;color:#ff8888;font-family:\'Share Tech Mono\',monospace;font-size:10px">QUITAR</button></div></div>'+(canEdit?'<div onclick="editItemNote('+idx+')" style="cursor:pointer;margin-top:4px;font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0">'+(it.note?'📝 '+esc(it.note):'+ agregar nota (ej. sin cebolla)')+'</div>':'')+'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><div style="display:flex;align-items:center;gap:10px"><button onclick="cartQtyChange('+idx+',-1)" style="all:unset;cursor:pointer;width:34px;height:34px;background:#1A3028;border-radius:6px;text-align:center;color:#FFFFFF;font-family:\'Barlow Condensed\',sans-serif;font-size:16px;font-weight:700">−</button><span class="bump" style="display:inline-block;font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;min-width:16px;text-align:center">'+it.qty+'</span><button onclick="cartQtyChange('+idx+',1)" style="all:unset;cursor:pointer;width:34px;height:34px;background:#1A3028;border-radius:6px;text-align:center;color:#FFFFFF;font-family:\'Barlow Condensed\',sans-serif;font-size:16px;font-weight:700">+</button></div><span style="font-family:\'Share Tech Mono\',monospace;font-size:13px;color:'+GOLD+'">'+SOLES+itemLineTotal(it)+'</span></div></div>';
  }).join('');
}
// Edita un producto ya en el carrito: lo saca y precarga el builder con su
// configuración exacta, para no tener que rearmarlo desde cero.
function editCartItem(idx){
  var it=cart[idx];
  if(!it||it.type==='side')return;
  syncConfirmFields();
  cart.splice(idx,1);
  if(appliedReward&&findRewardTargetIndex(appliedReward)<0)appliedReward=null;
  saveCart();
  var bld=Object.assign({},it);
  bld.mode=it.type;
  delete bld.type;
  delete bld.qty;
  loadBuild(bld);
}
async function editItemNote(idx){
  var it=cart[idx];
  if(!it)return;
  var n=await showPrompt('Nota para este producto (ej. sin cebolla, poca sal)',it.note||'');
  if(n===null)return;
  it.note=n.trim().slice(0,140);
  saveCart();
  render();
}
// Recompensas aplicables directamente al pedido en curso — reemplaza el viejo flujo
// de "canjear ahora y mostrar un código al repartidor". R04 y R06 descuentan el
// precio de la línea del carrito a la que apliquen; el resto no tiene mecánica de
// precio en el menú actual — quedan registradas en el pedido (recibo, ticket de
// cocina, WhatsApp) para que el local las prepare junto con él.
function rewardsPickerHTML(){
  if(!cust)return'';
  var unlocked=RWDS.filter(function(r){return(cust.points||0)>=r.pts;});
  if(!unlocked.length)return'';
  var rows=unlocked.map(function(r){
    var selected=appliedReward===r.id;
    var targetIdx=findRewardTargetIndex(r.id);
    var eligible=targetIdx>=0;
    var savings=selected?rewardWaiverAmount(r.id,targetIdx):0;
    var targetLabel=selected&&targetIdx>=0?itemLabel(cart[targetIdx]):'';
    var reqText=r.id==='R06'?' · agrega un sándwich 15CM para usarla':r.id==='R04'?' · agrega un sándwich con doble proteína para usarla':' · agrega algo a tu carrito para usarla';
    var sub=r.d+(!eligible?reqText:'')+(selected&&savings>0?' · ahorras '+SOLES+savings+' en '+targetLabel:(selected?' · se incluye con tu pedido':''));
    return'<div onclick="'+(eligible?'toggleReward(\''+r.id+'\')':'')+'" style="background:'+(selected?'#1E4A38':'#1A3028')+';border:1px solid '+(selected?GOLD:'#3A6B58')+';border-radius:10px;padding:12px 14px;margin-bottom:8px;cursor:'+(eligible?'pointer':'not-allowed')+';opacity:'+(eligible?1:.4)+'"><div style="display:flex;justify-content:space-between;align-items:center"><div style="flex:1;padding-right:8px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;color:#FFFFFF">'+r.n+'<span style="color:'+GOLD+'"> // </span>'+r.s+'</div><div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0;margin-top:2px">'+esc(sub)+'</div></div><span style="font-family:\'Share Tech Mono\',monospace;font-size:16px;color:'+(selected?GOLD:'#A8C8B0')+';flex-shrink:0">'+(selected?'✓':'○')+'</span></div></div>';
  }).join('');
  return'<div style="margin-top:16px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">USA TUS PUNTOS //</div>'+rows+'</div>';
}
function toggleReward(id){
  syncConfirmFields();
  if(appliedReward===id){appliedReward=null;saveCart();render();return;}
  if(findRewardTargetIndex(id)<0)return;
  appliedReward=id;
  saveCart();
  render();
}
function pickAddr(id){
  var a=myAddresses.find(function(x){return x.id===id;});
  if(!a)return;
  syncConfirmFields();
  pickedAddrId=id;addrText=a.address;render();
}
// Bloque de campos de checkout (puntos a ganar, recompensas, direcciones guardadas,
// nombre/correo/dirección/notas, horario, crédito, banner de notificaciones push) —
// se usa tanto en TU CARRITO (multi-producto) como en la confirmación de un solo
// sándwich cuando se elige pago directo. Asume que `cart` ya tiene al menos 1 producto.
function checkoutExtrasHTML(){
  var t=cartFinalTotal();
  var pBox=cust
    ?'<div style="background:#1A3028;border:1px solid rgba(203,162,88,.2);border-radius:8px;padding:12px;margin-top:14px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:4px">PUNTOS QUE GANARÁS //</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:22px;font-weight:900;color:#FFFFFF">+'+t+' pts <span style="font-size:11px;color:#A8C8B0;font-weight:700">pendientes hasta confirmar pago</span></div></div>'
    :'<div onclick="swTab(\'points\')" style="background:#2D5246;border:1px solid #3A6B58;border-radius:8px;padding:12px;margin-top:14px;cursor:pointer"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+'">↗ Regístrate en PUNTOS para ganar +'+t+' pts</div></div>';
  var payingWithCreditFully=useCredit&&cust&&(cust.credit_balance||0)>=t;
  return pBox
    +(manualPayMethod?'':rewardsPickerHTML())
    +(!cust||!myAddresses.length?'':'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">'+myAddresses.map(function(a){var sel=pickedAddrId===a.id;return'<div onclick="pickAddr(\''+a.id+'\')" style="background:'+(sel?'#1E4A38':'#1A3028')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:20px;padding:8px 14px;cursor:pointer;font-family:\'Share Tech Mono\',monospace;font-size:10px;color:'+(sel?'#fff':'#A8C8B0')+'">'+esc(a.label)+'</div>';}).join('')+'</div>')
    +'<div style="display:flex;flex-direction:column;gap:10px;margin-top:16px">'+INP('o-nom','NOMBRE // Tu nombre','text',confNom)+INP('o-phone','TELÉFONO // 9XXXXXXXX','tel',confPhone)+INP('o-email','CORREO // Opcional, para tu comprobante','email',confEmail)+'<div style="position:relative">'+INP('o-addr','DIRECCION // Calle o usa GPS','text',addrText)+'<button id="gps-btn" onclick="doGPS()" style="all:unset;cursor:pointer;position:absolute;right:0;top:0;bottom:0;width:44px;display:flex;align-items:center;justify-content:center;color:#A8C8B0;font-family:Barlow,sans-serif;font-size:11px;font-weight:700">&#128205;</button></div>'+'<div id="gps-hint" style="min-height:12px;margin-top:3px"></div>'+INP('o-notes','NOTAS // opcional','text',confNotes)+'</div>'
    +(scheduleMode==='now'?'<div style="margin-top:16px;background:#1A3028;border:1px solid rgba(203,162,88,.25);border-radius:10px;padding:12px 14px"><div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0;line-height:1.4;display:flex;align-items:flex-start;gap:8px">'+icon('horario',13,'#A8C8B0')+'<span>Tiempo estimado: <b style="color:#FFFFFF">'+ESTIMATED_DELIVERY_RANGE[0]+'-'+ESTIMATED_DELIVERY_RANGE[1]+' min</b> desde que confirmamos tu pedido.</span></div></div>':'')
    +'<div style="margin-top:10px;background:#1A3028;border:1px solid rgba(203,162,88,.25);border-radius:10px;padding:12px 14px"><div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0;line-height:1.4;display:flex;align-items:flex-start;gap:8px">'+icon('moto',13,'#A8C8B0')+'<span>El costo de delivery se paga <b style="color:#FFFFFF">directo al repartidor</b> al momento de la entrega — no está incluido en este total.</span></div></div>'
    +'<div style="margin-top:16px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">¿CUÁNDO? //</div><div style="display:flex;gap:8px;margin-bottom:8px"><div onclick="scheduleMode=\'now\';confirmRerender()" style="flex:1;text-align:center;background:'+(scheduleMode==='now'?'#1E4A38':'#1A3028')+';border:1px solid '+(scheduleMode==='now'?GOLD:'#3A6B58')+';border-radius:8px;padding:10px;cursor:pointer;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#fff">AHORA</div><div onclick="scheduleMode=\'later\';confirmRerender()" style="flex:1;text-align:center;background:'+(scheduleMode==='later'?'#1E4A38':'#1A3028')+';border:1px solid '+(scheduleMode==='later'?GOLD:'#3A6B58')+';border-radius:8px;padding:10px;cursor:pointer;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#fff">PROGRAMAR</div></div>'+(scheduleMode==='later'?'<input id="o-sched" type="datetime-local" style="background:#2D5246;border:1px solid #0d0d0d;border-radius:10px;padding:14px 16px;color:#FFFFFF;width:100%;font-size:14px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0;margin-top:4px">Debe caer dentro de nuestro horario de atención.</div>':'')+'</div>'
    +(!cust||(cust.credit_balance||0)<=0?'':(function(){var canCover=(cust.credit_balance||0)>=t;var checked=useCredit&&canCover;return'<div onclick="'+(canCover?'useCredit=!useCredit;if(useCredit)manualPayMethod=null;confirmRerender()':'')+'" style="margin-top:16px;background:'+(checked?'#1E4A38':'#1A3028')+';border:1px solid '+(checked?GOLD:'#3A6B58')+';border-radius:10px;padding:14px 16px;cursor:'+(canCover?'pointer':'not-allowed')+';opacity:'+(canCover?1:.5)+'"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;color:#FFFFFF">PAGAR CON MI CRÉDITO</div><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0;margin-top:2px">Disponible: '+SOLES+(cust.credit_balance||0)+(canCover?'':' · no alcanza para este pedido')+'</div></div><span style="font-family:\'Share Tech Mono\',monospace;font-size:16px;color:'+(checked?GOLD:'#A8C8B0')+'">'+(checked?'✓':'○')+'</span></div></div>';})())
    // Con recompensa el total puede llegar a S/0 — antes igual se mostraba el selector
    // TARJETA/YAPE/PLIN (y "YA REALICÉ EL PAGO //" si había un método manual elegido
    // antes) para un pedido que no cuesta nada.
    +(payingWithCreditFully||t===0?'':paymentMethodPickerHTML(t))
    +(checkoutLocked?'<div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#ff5555;margin-top:12px;background:rgba(255,85,85,.08);border:1px solid rgba(255,85,85,.3);border-radius:8px;padding:12px">'+esc(lockedMsg)+'</div>':'')
    +'<div id="o-err" style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#ff5555;margin-top:8px;min-height:16px"></div>'
    // Los clientes en su primer pedido reciben este mismo ofrecimiento, más prominente,
    // justo después de que el pago se confirma (ver sOSent) — no se les pregunta dos
    // veces en la misma compra.
    +(!cust||pushSubscribed||!cust.total_orders||!('serviceWorker' in navigator)||!('PushManager' in window)?'':'<div onclick="togglePushNotifications()" style="margin-top:16px;background:#1A3028;border:1px solid rgba(203,162,88,.3);border-radius:10px;padding:14px 16px;cursor:pointer"><div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#F2F0EB;line-height:1.4;display:flex;align-items:center;gap:8px">'+icon('notif',13,GOLD)+'<span>Te notificamos del estado de tu pedido<span style="color:'+GOLD+'"> — </span><span style="color:'+GOLD+';font-weight:700">actívalo aquí →</span></span></div>'+(pushMsg?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:'+GOLD+';margin-top:6px">'+esc(pushMsg)+'</div>':'')+'</div>');
}
// Selector de método de pago (tarjeta por Culqi, o Yape/Plin manual por transferencia)
// — se oculta si el pedido ya se cubre por completo con crédito interno. Mientras Culqi
// no esté configurado (ver CULQI_PUBLIC_KEY), TARJETA ni siquiera se muestra — un botón
// de pago marcado "PRONTO" se lee como una app a medio terminar; mejor mostrar solo los
// métodos que sí funcionan hoy (transferencia manual).
//
// El widget de Culqi (Culqi.options en payWithCulqi) ya tiene yape:true habilitado —
// técnicamente listo — pero Culqi todavía no activó Yape en la cuenta del comercio, así
// que hoy no aparece esa opción dentro del widget (confirmado en pantalla real: el
// dropdown solo muestra tarjeta). El botón de acá dice "TARJETA" a secas para no prometer
// algo que hoy no se ve — el día que Culqi lo active del lado de la cuenta, esta etiqueta
// es lo único que hay que volver a poner en "TARJETA / YAPE", cero cambios de lógica.
function paymentMethodPickerHTML(t){
  var culqiConfigured=CULQI_PUBLIC_KEY&&CULQI_PUBLIC_KEY.indexOf('REEMPLAZA')<0;
  // Antes había un botón "YAPE" y otro "PLIN" por separado para el pago manual, pero
  // ambos llevan a la misma pantalla de instrucciones (mismo número, mismo botón de
  // copiar) — obligar al cliente a elegir entre los dos no le da ninguna información
  // nueva, solo un tap de más. Un solo botón cubre ambas apps; internamente sigue
  // mandando 'yape' al servidor (el backend solo distingue "pago manual pendiente de
  // confirmar" de todo lo demás, nunca trató Yape y Plin como cosas distintas más allá
  // de esa etiqueta).
  return'<div style="margin-top:16px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">¿CÓMO PAGAS? //</div><div style="display:flex;gap:8px">'
    +(culqiConfigured?payMethodBtn('culqi','TARJETA',true):'')
    +payMethodBtn('yape','YAPE / PLIN',true)
    +'</div>'
    // El bono +10% solo se financia con la comisión de Culqi que el negocio se ahorra en
    // la transferencia manual (ver actPlaceOrder) — pagar Yape automático por el botón de
    // arriba SÍ pasa por Culqi como una tarjeta, así que ese bono no aplica ahí. El texto
    // vive pegado al botón de transferencia, no como línea general debajo de ambos, para
    // no prometer puntos que el pago con Yape automático no da.
    +(manualPayMethod?'':'<div style="font-family:\'Barlow\',sans-serif;font-size:10px;color:#A8C8B0;margin-top:6px">Transferencia por Yape/Plin: gana +10% de puntos extra</div>')
    +(manualPayMethod?manualPayInstructionsHTML(t):'')
    +'</div>';
}
function payMethodBtn(id,label,enabled){
  var sel=id==='culqi'?!manualPayMethod:manualPayMethod===id;
  return'<div onclick="'+(enabled?'selectPayMethod(\''+id+'\')':'')+'" style="flex:1;text-align:center;background:'+(sel?'#1E4A38':'#1A3028')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:8px;padding:10px 6px;cursor:'+(enabled?'pointer':'not-allowed')+';opacity:'+(enabled?1:.4)+'"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#fff">'+label+'</div>'+(enabled?'':'<div style="font-family:\'Share Tech Mono\',monospace;font-size:7px;color:#A8C8B0;margin-top:2px;letter-spacing:.05em">PRONTO</div>')+'</div>';
}
function selectPayMethod(m){
  manualPayMethod=(m==='culqi'?null:m);
  if(manualPayMethod)appliedReward=null;
  confirmRerender();
}
function manualPayInstructionsHTML(t){
  // Antes distinguía 'Yape'/'Plin' según manualPayMethod — desde que se fusionaron los
  // botones de arriba en uno solo, el valor siempre es 'yape' así que ya no hace falta.
  return'<div style="margin-top:10px;background:#1A3028;border:1px solid '+GOLD+';border-radius:10px;padding:14px 16px"><div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#F2F0EB;line-height:1.5">Transfiere <b style="color:'+GOLD+'">'+SOLES+t+'</b> por Yape o Plin a:</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;background:#2D5246;border-radius:8px;padding:10px 12px"><div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:20px;font-weight:900;color:#fff">'+YAPE_PLIN_PHONE+'</div><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0">'+esc(YAPE_PLIN_NAME)+'</div></div><button onclick="copyYapePlinPhone()" style="all:unset;cursor:pointer;background:'+GOLD+';color:#0d0d0d;font-family:\'Barlow Condensed\',sans-serif;font-size:11px;font-weight:700;padding:8px 12px;border-radius:6px">COPIAR</button></div><div id="ypc-msg" style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';margin-top:6px;min-height:12px"></div><div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0;margin-top:8px;line-height:1.4">Envía el pago desde tu app y confirma abajo con "YA REALICÉ EL PAGO". Tu pedido pasa a cocina recién cuando verifiquemos que llegó.</div></div>';
}
function copyYapePlinPhone(){
  var m=(document.getElementById('ypc-msg') as HTMLInputElement | null);
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(YAPE_PLIN_PHONE).then(function(){if(m)m.textContent='✓ Número copiado';}).catch(function(){if(m)m.textContent=YAPE_PLIN_PHONE;});
  }else if(m){m.textContent=YAPE_PLIN_PHONE;}
}
// Etiqueta del botón de pago principal — compartida entre TU CARRITO y el pago directo
// de un solo sándwich, ya que ambos ofrecen los mismos métodos de pago.
function payButtonLabel(t,fallback){
  if(t===0)return'CONFIRMAR PEDIDO GRATIS //';
  if(useCredit&&cust&&(cust.credit_balance||0)>=t)return'CONFIRMAR CON CRÉDITO //';
  if(manualPayMethod)return'YA REALICÉ EL PAGO //';
  return fallback;
}
function sOCart(){
  var baseTotal=cartBaseTotal();
  var t=cartFinalTotal();
  var empty=!cart.length;
  var comboDiscount=cartComboDiscount();
  var offPeakDiscount=cartOffPeakDrinkDiscount();
  var rewardIdx=appliedReward?findRewardTargetIndex(appliedReward):-1;
  var rewardDiscount=appliedReward?rewardWaiverAmount(appliedReward,rewardIdx):0;
  // Sándwich sin bebida en el carrito — el combo (sándwich+bebida, S/3 menos) todavía no
  // se está aprovechando, así que lo sugerimos justo donde se agrega una bebida.
  var hasSandwichNoDrink=cart.some(function(it){return it.type!=='side';})&&cartComboCount()<cart.reduce(function(s,it){return s+(it.type!=='side'?it.qty:0);},0);
  return H('TU CARRITO',"syncConfirmFields();sc='o_home';render()")+'<div style="flex:1;padding:20px 20px 110px;overflow-y:auto" class="fi">'
    +cartItemsHTML()
    +(cart.length?'<div style="display:flex;justify-content:space-between;align-items:center;background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px;margin-bottom:12px"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;color:#F2F0EB">TOTAL</span><div style="text-align:right"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:28px;font-weight:900;color:'+GOLD+'">'+SOLES+t+'</span>'+(comboDiscount>0?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#25D366">combo aplicado: ahorras '+SOLES+comboDiscount+'</div>':'')+(offPeakDiscount>0?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#25D366">bebida gratis (hora valle): ahorras '+SOLES+offPeakDiscount+'</div>':'')+(rewardDiscount>0?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#25D366">recompensa: ahorras '+SOLES+rewardDiscount+'</div>':'')+'</div></div>':'')
    +(hasSandwichNoDrink&&isOffPeakDrinkPromoActiveNow()?'<div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:'+GOLD+';margin-bottom:12px">Es hora valle — agrega una bebida y te sale GRATIS (hasta '+SOLES+OFFPEAK_DRINK_PROMO_CAP+')</div>':(hasSandwichNoDrink?'<div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:'+GOLD+';margin-bottom:12px">Agrega una bebida y ahorra '+SOLES+COMBO_DISCOUNT_PER_PAIR+' (combo)</div>':''))
    // Antes estos 2 botones eran los únicos puntos de navegación de este carrito que NO
    // llamaban syncConfirmFields() primero — el camino de "una cosa más" más común
    // (agregar un side/otro sándwich) borraba nombre/correo/dirección ya tipeados.
    +'<div style="display:flex;gap:8px;margin-bottom:20px"><div onclick="syncConfirmFields();go(\'o_home\')" style="flex:1;text-align:center;background:#1A3028;border:1px solid #3A6B58;border-radius:8px;padding:12px;cursor:pointer;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#FFFFFF">+ SÁNDWICH</div><div onclick="syncConfirmFields();sc=\'o_sides\';render()" style="flex:1;text-align:center;background:#1A3028;border:1px solid #3A6B58;border-radius:8px;padding:12px;cursor:pointer;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#FFFFFF">+ BEBIDA/SIDE</div></div>'
    +(empty?'':checkoutExtrasHTML())
    +(cart.length?'<div onclick="clearCart()" style="text-align:center;margin-top:16px;cursor:pointer;font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#ff8888;letter-spacing:.1em">VACIAR CARRITO</div>':'')
    +'</div>'
    +AB(cart.length?t:null,cart.length>0&&!checkoutLocked,null,'doOrder()',payButtonLabel(t,'PAGAR Y ENVIAR //'));
}

var _pendingOrder=null;
function doOrder(){
  if(_payingInProgress)return;
  if(!cart.length)return;
  if(appliedReward&&findRewardTargetIndex(appliedReward)<0)appliedReward=null;
  var nom=gv('o-nom').trim();
  var phone=gv('o-phone').trim();
  var email=gv('o-email').trim();
  var addr=gv('o-addr').trim();
  var notes=gv('o-notes').trim();
  var errEl=(document.getElementById('o-err') as HTMLInputElement | null);
  if(!nom||!addr){if(errEl)errEl.textContent='Ingresa tu nombre y dirección.';return;}
  // Antes no había ningún teléfono en el checkout de invitado — la única forma de
  // contactarlo era el mensaje de WhatsApp que él mismo debía enviar tras pagar, y si
  // ese paso fallaba (bloqueo de pop-up, cerró la pestaña) un pedido ya cobrado quedaba
  // sin ninguna manera de ubicar al cliente.
  if(!phone||phone.replace(/\D/g,'').length<6){if(errEl)errEl.textContent='Ingresa un teléfono de contacto válido.';return;}
  var schedIso=null;
  if(scheduleMode==='later'){
    var schedEl=(document.getElementById('o-sched') as HTMLInputElement | null);
    var schedVal=schedEl?schedEl.value:'';
    if(!schedVal){if(errEl)errEl.textContent='Elige una hora para tu pedido programado.';return;}
    var schedDate=new Date(schedVal);
    if(isNaN(schedDate.getTime())||schedDate.getTime()<Date.now()-60000){if(errEl)errEl.textContent='La hora programada no es válida.';return;}
    if(!isWithinStoreHours(schedDate)){if(errEl)errEl.textContent='Esa hora está fuera de nuestro horario de atención.';return;}
    schedIso=schedDate.toISOString();
  }else if(!storeStatus().open){
    // Antes solo se validaba el horario para pedidos programados — uno "AHORA" con la
    // tienda cerrada se podía pagar igual, y la cocina nunca lo iba a preparar.
    if(errEl)errEl.textContent='Estamos cerrados ahora mismo. Elige "PROGRAMAR" para pedir dentro de nuestro horario.';
    return;
  }
  if(errEl)errEl.textContent='';
  var ref=oref();
  var t=cartFinalTotal();
  var rewardObj=appliedReward?RWDS.find(function(x){return x.id===appliedReward;}):null;
  var rewardTargetIdx=appliedReward?findRewardTargetIndex(appliedReward):-1;
  var itemSummaries=cart.map(function(it){var extras=itemExtrasLabel(it);return it.qty+'x '+itemLabel(it)+(extras?' ('+extras+')':'');});
  var summary=itemSummaries.join(' · ')+(rewardObj?' · Recompensa: '+rewardObj.n+' '+rewardObj.s:'');
  var lines=['*PEDIDO SND//WCH*','Ref: '+ref,'','👤 '+nom,'📱 '+phone,'📍 '+addr,''];
  cart.forEach(function(it,idx){
    var extras=itemExtrasLabel(it);
    lines.push((idx+1)+') '+it.qty+'x '+itemLabel(it)+(extras?' — '+extras:'')+' — S/'+itemLineTotal(it));
    if(idx===rewardTargetIdx&&rewardObj)lines.push('   🎁 '+rewardObj.n+' // '+rewardObj.s);
  });
  if(notes)lines.push('','📝 '+notes);
  lines.push('','*TOTAL: S/'+t+'*');
  if(cust)lines.push('Cliente: '+cust.name+' ('+cust.phone+')');
  var ingredients=[];
  cart.forEach(function(it){
    if(it.type==='side'){for(var k=0;k<it.qty;k++)ingredients.push(it.code);return;}
    var sig=it.type==='sig'?SIGS.find(function(x){return x.id===it.sigId;}):null;
    var baseCode=it.type==='sig'?sig.base:it.base;
    var protCode=it.type==='sig'?sig.prot:it.prot;
    var topsArr=it.type==='sig'?sig.tops:it.tops;
    var saucesArr=it.type==='sig'?sig.sauces:it.sauces;
    var cheeseCode=it.type==='byo'?it.cheese:null;
    for(var q=0;q<it.qty;q++){
      ingredients.push(baseCode,protCode);
      ingredients=ingredients.concat(topsArr);
      if(cheeseCode)ingredients.push(cheeseCode);
      ingredients=ingredients.concat(saucesArr);
      if(it.doubleProt)ingredients.push(protCode);
    }
  });
  _payingInProgress=true;
  _pendingOrder={ref:ref,nom:nom,phone:phone,addr:addr,email:email,notes:notes,summary:summary,total:t,waLines:lines,items:cart.map(function(it){return Object.assign({},it);}),ingredients:ingredients,scheduledFor:schedIso,rewardId:appliedReward};
  if(t===0){
    payAsRewardOnly();
  }else if(useCredit&&cust&&(cust.credit_balance||0)>=t){
    payWithCredit();
  }else if(manualPayMethod){
    payWithManualMethod();
  }else{
    prepareThenPayWithCulqi(t,email);
  }
}
// Las tres formas de pagar que NO pasan por Culqi (crédito interno, Yape/Plin manual,
// recompensa 100% gratis) comparten exactamente el mismo esqueleto — arman el pedido con
// _pendingOrder, esperan place-order, y manejan éxito/error igual — así que solo varía el
// mensaje de progreso y 1-2 campos extra en el payload (antes eran 3 copias casi idénticas).
async function placeOrderDirect(msg,extraFields){
  if(!_pendingOrder)return;
  var po=_pendingOrder;
  busy=true;busyMsg=msg;render();
  var res;
  try{
    res=await api('place-order',Object.assign({token:token,ref:po.ref,name:po.nom,phone:po.phone,email:po.email,address:po.addr,notes:po.notes,summary:po.summary,total:po.total,items:po.items,ingredients:po.ingredients,scheduledFor:po.scheduledFor,rewardId:po.rewardId},extraFields||{}));
  }catch(e){
    busy=false;_payingInProgress=false;render();
    var errEl=(document.getElementById('o-err') as HTMLInputElement | null);
    if(errEl)errEl.textContent=e.message;else showToast(e.message);
    return;
  }
  finalizeOrderSuccess(res,po,null);
}
function payWithCredit(){return placeOrderDirect('Pagando con tu crédito...',{useCredit:true});}
// Yape/Plin: el cliente transfiere por su cuenta desde su propia app — nosotros no
// procesamos el cobro. El pedido queda payment_status:'pending' hasta que el operador
// confirme en el panel que el dinero llegó; solo entonces se prepara el pedido y se
// otorgan los puntos (ver el guard en el servidor, actAdminUpdateStatus).
function payWithManualMethod(){return placeOrderDirect('Registrando tu pedido...',{paymentMethod:manualPayMethod});}
// Un pedido cubierto por completo por una recompensa (ej. S/06 sándwich gratis en
// 15CM) no necesita ni Culqi ni crédito interno — el servidor lo acepta con total
// 0 mientras la recompensa sea válida.
function payAsRewardOnly(){return placeOrderDirect('Aplicando tu recompensa...',null);}

// Antes el cliente abría el widget de Culqi (con un cobro real detrás) directo, y recién
// DESPUÉS de cobrar el servidor validaba horario/inventario/carrito — cualquier rechazo
// ahí dejaba un cargo real sin ningún pedido creado (así fue como se coló el bug de zona
// horaria que se arregló en vivo). Ahora primero se valida y RESERVA todo (prepare-order,
// ver orders.ts) y solo si eso tuvo éxito se abre Culqi — el cliente nunca llega a ver el
// formulario de tarjeta si su pedido de todas formas iba a ser rechazado.
async function prepareThenPayWithCulqi(amountSoles,email){
  var po=_pendingOrder;
  if(!po)return;
  busy=true;busyMsg='Verificando tu pedido...';render();
  try{
    await api('prepare-order',{token:token,ref:po.ref,name:po.nom,phone:po.phone,email:po.email,address:po.addr,notes:po.notes,summary:po.summary,total:po.total,items:po.items,scheduledFor:po.scheduledFor,rewardId:po.rewardId});
  }catch(e){
    busy=false;_payingInProgress=false;render();
    var errEl=(document.getElementById('o-err') as HTMLInputElement | null);
    if(errEl)errEl.textContent=e.message;else showToast(e.message);
    return;
  }
  busy=false;render();
  payWithCulqi(amountSoles,email);
}
function payWithCulqi(amountSoles,email){
  // Ambos early-return de abajo DEBEN limpiar busy/_payingInProgress antes de salir —
  // doOrder() bloquea todo nuevo intento mientras _payingInProgress sea true, así que
  // dejarlo en true aquí (ej. Culqi.js no cargó por un adblocker/CDN caído) deja el botón
  // de pagar muerto para el resto de la sesión, sin ningún mensaje de error visible en
  // los siguientes clics.
  if(typeof Culqi==='undefined'){busy=false;_payingInProgress=false;render();showToast('No se pudo cargar la pasarela de pago. Verifica tu conexión e intenta de nuevo.');return;}
  if(!CULQI_PUBLIC_KEY||CULQI_PUBLIC_KEY.indexOf('REEMPLAZA')>=0){busy=false;_payingInProgress=false;render();showToast('La pasarela de pago aún no está configurada. Contacta al administrador.');return;}
  Culqi.publicKey=CULQI_PUBLIC_KEY;
  Culqi.settings({
    title:'SND//WCH',
    currency:'PEN',
    amount:Math.round(amountSoles*100),
    description:'Pedido '+(_pendingOrder?_pendingOrder.ref:'')
  });
  // yape:true — Culqi Checkout ya trae Yape integrado como pestaña dentro del mismo
  // widget (número + OTP los captura Culqi, nunca nuestro código, así que no nos mete
  // en alcance PCI). Culqi.token sale igual sea tarjeta o Yape — window.culqi() y
  // create-charge de abajo ya lo tratan de forma genérica, sin distinguir el origen.
  Culqi.options({
    lang:'auto',
    installments:false,
    paymentMethods:{tarjeta:true,yape:true,billetera:false,bancaMovil:false,agente:false,cuotealo:false}
  });
  Culqi.open();
}

// Callback global requerido por Culqi Checkout V4 — se ejecuta tras el intento de pago
window.culqi=function(){
  if(_pendingGift){
    if(Culqi.token){
      chargeAndFinalizeGift(Culqi.token.id);
    }else{
      gcMsg=(Culqi.error&&(Culqi.error.user_message||Culqi.error.merchant_message))||'No se pudo procesar el pago. Intenta de nuevo o con otro método.';
      _pendingGift=null;render();
    }
    return;
  }
  if(_pendingWeeklyPlan){
    if(Culqi.token){
      chargeAndFinalizeWeeklyPlan(Culqi.token.id);
    }else{
      wpMsg=(Culqi.error&&(Culqi.error.user_message||Culqi.error.merchant_message))||'No se pudo procesar el pago. Intenta de nuevo o con otro método.';
      _pendingWeeklyPlan=null;render();
    }
    return;
  }
  if(!_pendingOrder)return;
  if(Culqi.token){
    chargeAndFinalize(Culqi.token.id);
  }else{
    busy=false;_payingInProgress=false;render();
    var msg=(Culqi.error&&(Culqi.error.user_message||Culqi.error.merchant_message))||'No se pudo procesar el pago. Intenta de nuevo o con otro método.';
    var errEl=(document.getElementById('o-err') as HTMLInputElement | null);
    if(errEl)errEl.textContent=msg;else showToast(msg);
  }
};

async function chargeAndFinalize(culqiToken){
  if(!_pendingOrder)return;
  var po=_pendingOrder;
  busy=true;busyMsg='Procesando pago...';render();
  try{
    var resp=await fetch(CHARGE_FN_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({token:culqiToken,amountSoles:po.total,email:po.email,orderRef:po.ref})
    });
    var data=await resp.json().catch(function(){return{};});
    if(!resp.ok||!data.success){
      busy=false;_payingInProgress=false;render();
      var errEl=(document.getElementById('o-err') as HTMLInputElement | null);
      var msg=data.error||'El pago fue rechazado. Intenta de nuevo o con otro método.';
      if(errEl)errEl.textContent=msg;else showToast(msg);
      return;
    }
    // Pago confirmado con Culqi — el servidor re-verifica el cargo contra la reserva que
    // ya creó prepare-order (nombre/dirección/carrito/total ya quedaron ahí, no hace
    // falta reenviarlos ni confiar de nuevo en lo que diga el cliente en este paso).
    var res;
    try{
      res=await api('place-order',{token:token,chargeId:data.chargeId,ref:po.ref});
    }catch(e){
      // El cobro ya se hizo pero el pedido no quedó registrado — bloqueamos un reintento
      // desde aquí (crearía un SEGUNDO cobro real) y pedimos contactar al local con la ref.
      busy=false;checkoutLocked=true;
      lockedMsg=(e.message||'No se pudo registrar tu pedido tras el pago.')+' Ya se realizó el cobro — contáctanos con tu referencia '+po.ref+' para confirmar tu pedido manualmente. No vuelvas a intentar pagar.';
      render();
      return;
    }
    finalizeOrderSuccess(res,po,data.chargeId);
  }catch(e){
    busy=false;_payingInProgress=false;render();
    var errEl2=(document.getElementById('o-err') as HTMLInputElement | null);
    if(errEl2)errEl2.textContent='Error de conexión al procesar el pago. Intenta de nuevo.';
  }
}
function finalizeOrderSuccess(res,po,chargeId){
  if(res.customer){cust=res.customer;cacheCust(cust,isAdmin);}
  if(!cust){window._lastGuestName=po.nom;window._lastGuestPhone=po.phone;window._lastGuestEmail=po.email;}
  // Guardado aparte de po (que se anula más abajo) para que el botón de respaldo en
  // sOSent pueda reabrir el mismo mensaje si este intento automático no llegó a abrirse
  // (varios navegadores móviles bloquean un window.open que no viene de un tap directo).
  window._lWaText=po.waLines.join('\n');
  window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(window._lWaText),'_blank');
  localStorage.setItem('sw_last_ref',po.ref);
  window._lTot=po.total;window._lRef=po.ref;window._lChargeId=chargeId;
  window._lRewardLabel=res.order&&res.order.redeemed_reward?res.order.redeemed_reward:null;
  window._lPendingPayment=!!(res.order&&res.order.payment_status!=='paid');
  window._lPayMethod=res.order&&res.order.payment_method;
  cart=[];
  resetBuilder();mode=null;
  useCredit=false;manualPayMethod=null;scheduleMode='now';pickedAddrId=null;addrText='';
  confNom='';confEmail='';confNotes='';checkoutLocked=false;lockedMsg='';_payingInProgress=false;
  appliedReward=null;
  saveCart();
  _pendingOrder=null;
  busy=false;sc='o_sent';render();
  if(cust)loadUserExtras();
}


function reopenWhatsAppConfirm(){
  if(!window._lWaText)return;
  window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(window._lWaText),'_blank');
}
function sOSent(){
  var pending=window._lPendingPayment;
  var methodLabel=window._lPayMethod==='yape'?'Yape':window._lPayMethod==='plin'?'Plin':'';
  return'<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;background:#1E3932" class="fi">'
    +'<div style="margin-bottom:12px">'+WORDMARK(52,true)+'</div>'
    +(pending?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:11px;color:'+GOLD+';letter-spacing:.25em;margin-bottom:20px">✓ PEDIDO REGISTRADO //</div>':'<div style="font-family:\'Share Tech Mono\',monospace;font-size:11px;color:#25D366;letter-spacing:.25em;margin-bottom:20px">✓ PAGO CONFIRMADO //</div>')
    +'<p style="font-family:\'Barlow\',sans-serif;font-size:14px;color:#A8C8B0;max-width:260px;line-height:1.6;margin-bottom:16px">'+(pending?'Verificaremos tu pago por '+methodLabel+' y tu pedido pasará a preparación en cuanto lo confirmemos.':'Tu pago fue procesado y tu pedido ya está en preparación.')+'</p>'
    +'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:12px;padding:16px 20px;margin-bottom:16px;width:100%;max-width:320px">'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">ESTADO DEL PEDIDO //</div>'
    +stBadge('RECIBIDO')
    +'<div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0;margin-top:10px;line-height:1.5">Sigue el estado en PUNTOS → MIS PEDIDOS</div></div>'
    +'<div style="background:#1A3028;border:1px solid rgba(37,211,102,.25);border-radius:12px;padding:14px 20px;margin-bottom:16px;width:100%;max-width:320px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#25D366;letter-spacing:.2em;margin-bottom:4px">'+(pending?'MONTO A PAGAR //':'MONTO COBRADO //')+'</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:32px;font-weight:900;color:#FFFFFF">'+SOLES+(window._lTot||0)+'</div>'+(window._lChargeId?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:8px;color:#A8C8B0;margin-top:4px">Ref. pago: '+window._lChargeId+'</div>':'')+'</div>'
    +(cust?'<div style="background:#1A3028;border:1px solid rgba(203,162,88,.15);border-radius:12px;padding:14px 20px;margin-bottom:24px;width:100%;max-width:320px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:4px">'+(pending?'PUNTOS //':'PUNTOS GANADOS //')+'</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:'+(pending?'12px':'32px')+';font-weight:900;color:'+GOLD+'">'+(pending?'+'+(window._lTot||0)+' pts pendientes hasta confirmar tu pago':'+'+(window._lTot||0)+'<span style="font-size:14px"> pts</span>')+'</div></div>':'')
    +(window._lRewardLabel?'<div style="background:#0c1d30;border:1px solid rgba(37,211,102,.3);border-radius:12px;padding:14px 20px;margin-bottom:24px;width:100%;max-width:320px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#25D366;letter-spacing:.2em;margin-bottom:4px;display:flex;align-items:center;gap:6px">'+icon('gift',12,'#25D366')+'RECOMPENSA APLICADA //</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:18px;font-weight:900;color:#FFFFFF">'+esc(window._lRewardLabel)+'</div></div>':'')
    // Respaldo tappable del window.open automático de arriba — muchos navegadores
    // móviles lo bloquean por no venir de un tap directo del usuario, y sin esto un
    // pedido ya cobrado podía quedar sin ningún comprobante ni aviso al negocio.
    +(window._lWaText?'<button onclick="reopenWhatsAppConfirm()" style="all:unset;cursor:pointer;display:block;width:100%;max-width:320px;text-align:center;background:'+GOLD+';color:#0d0d0d;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;letter-spacing:.08em;padding:13px;border-radius:10px;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:8px">'+icon('chat',16,'#0d0d0d')+'CONFIRMAR PEDIDO POR WHATSAPP →</button>':'')
    // Antes el único lugar para activar notificaciones push era un toggle escondido en
    // el perfil (o una fila discreta en el checkout) — justo después del primer pedido
    // pagado es el momento de mayor intención: el cliente ya vio el valor de la app y
    // quiere saber cuándo llega SU pedido, así que se ofrece aquí de forma prominente.
    +(cust&&cust.total_orders===1&&!pushSubscribed&&('serviceWorker' in navigator)&&('PushManager' in window)?'<div onclick="togglePushNotifications()" style="background:#1A3028;border:1px solid rgba(203,162,88,.3);border-radius:12px;padding:14px 20px;margin-bottom:24px;width:100%;max-width:320px;cursor:pointer"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:4px;display:flex;align-items:center;gap:6px">'+icon('notif',12,GOLD)+'NO TE PIERDAS TU PEDIDO //</div><div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;line-height:1.5">Activa notificaciones y te avisamos apenas esté en camino.</div>'+(pushMsg?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:'+GOLD+';margin-top:6px">'+esc(pushMsg)+'</div>':'')+'</div>':'')
    +(cust?'<div onclick="shareReferral()" style="background:#1A3028;border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:14px 20px;margin-bottom:24px;width:100%;max-width:320px;cursor:pointer"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:4px;display:flex;align-items:center;gap:6px">'+icon('heart',12,GOLD)+'INVITA A UN AMIGO //</div><div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;line-height:1.5">Comparte tu código <b style="color:#FFFFFF">'+esc(cust.phone)+'</b> — ambos ganan 50 puntos en su primer pedido.</div></div>':'')
    +'<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">'
    +'<button onclick="sc=\'o_home\';render()" style="all:unset;cursor:pointer;border:1px solid '+GOLD+';color:'+GOLD+';font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;letter-spacing:.15em;padding:12px 22px;border-radius:10px">NUEVO PEDIDO</button>'
    +(cust?'<button onclick="sc=\'p_orders\';loadMyOrders()" style="all:unset;cursor:pointer;background:'+GOLD+';color:#0d0d0d;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;letter-spacing:.15em;padding:12px 22px;border-radius:10px">VER ESTADO →</button>':'')
    +'</div>'
    +(!cust?'<div onclick="atab=\'reg\';sc=\'p_auth\';render()" style="margin-top:20px;cursor:pointer;font-family:\'Share Tech Mono\',monospace;font-size:10px;color:'+GOLD+';letter-spacing:.1em">→ CREAR CUENTA Y GANAR PUNTOS POR ESTE PEDIDO</div>':'')
    +'</div>';
}

// AUTH
function sPAuth(){
  return H()+'<div style="flex:1;padding:24px 20px 100px;overflow-y:auto" class="fi"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:30px;font-weight:900;color:#fff;margin-bottom:6px">PUNTOS<span style="color:'+GOLD+'"> // </span>REWARDS</div><p style="font-family:\'Barlow\',sans-serif;font-size:13px;color:#A8C8B0;margin-bottom:24px;line-height:1.6">Acumula puntos con cada pedido. Canjéalos por salsas, upgrades y sándwiches gratis.</p><div style="display:flex;background:#2D5246;border-radius:10px;padding:4px;margin-bottom:24px">'+[['reg','CREAR CUENTA'],['login','INGRESAR']].map(function(x){return'<button onclick="atab=\''+x[0]+'\';aErr=\'\';render()" style="all:unset;cursor:pointer;flex:1;background:'+(atab===x[0]?GOLD:'transparent')+';color:'+(atab===x[0]?'#fff':'#555')+';font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;letter-spacing:.1em;padding:11px 0;border-radius:8px;text-align:center;transition:all .15s">'+x[1]+'</button>';}).join('')+'</div>'+(googleConfigured()?'<div id="google-btn-mount" style="display:flex;justify-content:center;margin-bottom:14px;min-height:44px"></div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px"><div style="flex:1;height:1px;background:#2D5246"></div><span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#5A7A6A;letter-spacing:.15em">O CON TU TELÉFONO</span><div style="flex:1;height:1px;background:#2D5246"></div></div>':'')+(atab==='reg'?'<div style="display:flex;flex-direction:column;gap:10px">'+INP('r-name','NOMBRE // Tu nombre completo','text',window._lastGuestName||'')+INP('r-phone','TELÉFONO // 9XXXXXXXX','tel',window._lastGuestPhone||'')+INP('r-pin','PIN PERSONAL // Mínimo 4 dígitos','password')+INP('r-email','CORREO // Para recuperar tu cuenta','email',window._lastGuestEmail||'')+INP('r-dni','DNI // 8 dígitos (obligatorio)','text')+INP('r-bday','FECHA NACIMIENTO // DD/MM/AAAA','text')+INP('r-ref','CÓDIGO DE REFERIDO // opcional','text',refCode)+'<div id="auth-err" style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#ff5555;min-height:16px">'+aErr+'</div>'+'<p style="font-family:\'Barlow\',sans-serif;font-size:10px;color:#A8C8B0;line-height:1.5;margin-bottom:4px">Al crear tu cuenta aceptas nuestros <span onclick="event.stopPropagation();sc=\'p_legal\';render()" style="color:'+GOLD+';cursor:pointer;text-decoration:underline">Términos y Política de Privacidad</span>.</p>'+BTN('CREAR CUENTA //','doReg()')+'</div>':'<div style="display:flex;flex-direction:column;gap:10px">'+INP('l-phone','TELÉFONO // 9XXXXXXXX','tel',savedPh)+INP('l-pin','PIN PERSONAL','password')+'<div id="auth-err" style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#ff5555;min-height:16px">'+aErr+'</div>'+BTN('INGRESAR //','doLogin()')+' '+`<div onclick="recNewPin=null;recEmailMasked=null;sc='p_recover';render()" style="text-align:center;margin-top:10px;font-family:'Share Tech Mono',monospace;font-size:10px;color:'+GOLD+';cursor:pointer;letter-spacing:.1em">¿Olvidaste tu PIN? // Recuperar →</div>`+'</div>')+'<div style="margin-top:28px;border-top:1px solid #0B0B0B;padding-top:20px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">RECOMPENSAS //</div>'+RWDS.map(function(r){return'<div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#A8C8B0">'+r.n+'<span style="color:#A8C8B0"> // </span>'+r.s+'</span><span style="font-family:\'Share Tech Mono\',monospace;font-size:11px;color:#A8C8B0">'+r.pts+' pts</span></div>';}).join('')+'</div></div>'+NAV();
}
async function doReg(){
  var name=gv('r-name').trim(),
      phone=gv('r-phone').trim(),
      pin=gv('r-pin').trim(),
      email=gv('r-email').trim(),
      dni=gv('r-dni').trim(),
      bdayRaw=gv('r-bday').trim(),
      refEl=(document.getElementById('r-ref') as HTMLInputElement | null),
      referredBy=refEl?refEl.value.trim():'';
  var err=(document.getElementById('auth-err') as HTMLInputElement | null);
  if(!name||!phone||pin.length<4){if(err)err.textContent='Completa nombre, teléfono y PIN (mínimo 4 dígitos).';return;}
  if(!dni||!/^\d{8}$/.test(dni)){if(err)err.textContent='DNI es obligatorio y debe tener 8 dígitos.';return;}
  if(email&&!/^[^@]+@[^@]+\.[^@]+$/.test(email)){if(err)err.textContent='Correo inválido.';return;}
  var bday=null;
  if(bdayRaw){
    var m=bdayRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(!m){if(err)err.textContent='Fecha de nacimiento debe ser DD/MM/AAAA.';return;}
    bday=m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
  }
  busy=true;busyMsg='Creando cuenta...';render();
  try{
    // Si venimos de "CREAR CUENTA Y GANAR PUNTOS POR ESTE PEDIDO" en la confirmación de un
    // pedido de invitado, sw_last_ref sigue siendo la prueba de acceso a ESE pedido (igual
    // que en my-orders/submit-rating de invitado) — el servidor solo lo vincula si sigue
    // sin dueño, así que mandarlo siempre aquí es seguro aunque no venga de ese flujo.
    var claimRef=localStorage.getItem('sw_last_ref')||null;
    var acqSrc=localStorage.getItem('sw_src')||null;
    var r=await api('register',{name:name,phone:phone,pin:pin,email:email||null,dni:dni,bday:bday,referredBy:referredBy||null,claimOrderRef:claimRef,acquisitionSource:acqSrc,googleIdToken:_googleIdToken||null});
    cust=r.customer;isAdmin=r.isAdmin;token=r.token;cacheCust(cust,isAdmin);
  }
  catch(e){aErr=e.message;busy=false;render();return;}
  _googleIdToken=null;
  localStorage.setItem('sw_ph',phone);localStorage.setItem('sw_tok',token);savedPh=phone;busy=false;sc='p_welcome';render();loadUserExtras();setTimeout(function(){sc='p_home';render();},6500);
}
async function doLogin(){
  var phone=gv('l-phone').trim(),pin=gv('l-pin').trim();
  var err=(document.getElementById('auth-err') as HTMLInputElement | null);
  if(!phone||!pin){if(err)err.textContent='Ingresa teléfono y PIN.';return;}
  busy=true;busyMsg='Verificando...';render();
  try{var r=await api('login',{phone:phone,pin:pin});cust=r.customer;isAdmin=r.isAdmin;token=r.token;cacheCust(cust,isAdmin);}
  catch(e){aErr=e.message;busy=false;render();return;}
  localStorage.setItem('sw_ph',phone);localStorage.setItem('sw_tok',token);savedPh=phone;busy=false;sc='p_home';render();loadUserExtras();
}
// Callback global de Google Identity Services (google.accounts.id.initialize) — recibe un
// credential (id_token JWT) que NUNCA se usa para iniciar sesión directamente acá: se manda
// al servidor (acción google-auth), que decide si ya existe una cuenta vinculada (login) o
// si falta completar el registro normal con DNI/teléfono/PIN (ver actGoogleAuth).
async function onGoogleCredential(resp){
  if(!resp||!resp.credential)return;
  busy=true;busyMsg='Verificando con Google...';render();
  try{
    var r=await api('google-auth',{idToken:resp.credential});
    if(r.needsRegistration){
      _googleIdToken=resp.credential;
      window._lastGuestName=(r.prefill&&r.prefill.name)||'';
      window._lastGuestEmail=(r.prefill&&r.prefill.email)||'';
      atab='reg';aErr='';busy=false;render();
      showToast('Ya verificamos tu cuenta de Google — completa DNI y teléfono para terminar tu registro.');
      return;
    }
    cust=r.customer;isAdmin=r.isAdmin;token=r.token;cacheCust(cust,isAdmin);
    localStorage.setItem('sw_ph',cust.phone);localStorage.setItem('sw_tok',token);savedPh=cust.phone;
    busy=false;sc='p_home';render();loadUserExtras();
  }catch(e){
    aErr=e.message;busy=false;render();
  }
}
// Monta el botón oficial de Google (renderButton — no un <button> propio, GIS exige su
// propio marcado dentro del contenedor) cada vez que p_auth se pinta — render() reemplaza
// todo el innerHTML en cada ciclo, así que el mount anterior siempre queda destruido y
// hay que rehacerlo. Sin ruido si el script de Google todavía no cargó (red lenta,
// bloqueador de contenido) o si GOOGLE_CLIENT_ID no está configurado.
function mountGoogleButton(){
  if(!googleConfigured())return;
  if(typeof google==='undefined'||!google.accounts||!google.accounts.id)return;
  var el=document.getElementById('google-btn-mount');
  if(!el)return;
  google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:onGoogleCredential});
  google.accounts.id.renderButton(el,{theme:'filled_black',size:'large',shape:'pill',width:280,text:'continue_with',locale:'es'});
}

// POINTS HOME
function sWelcome(){
  var pts=cust?cust.points||0:0;
  var nm=cust?cust.name.split(' ')[0]:'';
  var rwd=RWDS.slice().reverse().find(function(r){return pts>=r.pts;});
  var next=RWDS.find(function(r){return r.pts>pts;});
  return'<div onclick="sc=\'p_home\';render()" style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#1E3932;padding:48px 24px;position:relative;overflow:hidden">'
    +'<div style="position:absolute;top:-80px;right:-80px;width:300px;height:300px;border-radius:50%;background:rgba(203,162,88,.06)"></div>'
    +'<div style="position:absolute;bottom:-60px;left:-60px;width:220px;height:220px;border-radius:50%;background:rgba(203,162,88,.04)"></div>'
    +'<div style="text-align:center;position:relative;z-index:1;width:100%">'
    +'<div style="margin-bottom:28px">'+WORDMARK(24,true)+'</div>'
    // sc='p_welcome' solo se dispara al final de doReg() — doLogin() va directo a p_home
    // sin pasar por aquí — así que esta pantalla SIEMPRE es un registro nuevo, nunca un
    // login de alguien que vuelve. "de vuelta" era simplemente incorrecto en todos los casos.
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;font-weight:700;color:'+GOLD+';letter-spacing:.28em;margin-bottom:10px">BIENVENIDO //</div>'
    +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:48px;font-weight:900;color:#F2F0EB;line-height:1;margin-bottom:4px">'+esc(nm.toUpperCase())+'</div>'
    +'<div style="width:60px;height:3px;background:'+GOLD+';margin:18px auto 28px;border-radius:2px"></div>'
    +'<div style="background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.25);border-radius:16px;padding:20px;margin-bottom:16px">'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:'+GOLD+';letter-spacing:.2em;font-weight:700;margin-bottom:12px">TUS PUNTOS //</div>'
    +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:72px;font-weight:900;color:'+GOLD+';line-height:1">'+pts+'</div>'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0;margin-top:4px">PUNTOS ACUMULADOS</div>'
    +(rwd?'<div style="margin-top:12px;background:rgba(203,162,88,.15);border-radius:8px;padding:8px 12px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;color:'+GOLD+'">✓ PUEDES CANJEAR: '+(rwd.n+' '+rwd.s).toUpperCase()+'</div></div>':'')
    +(next?'<div style="margin-top:8px"><div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0">Te faltan <span style="color:#F2F0EB;font-weight:700">'+(next.pts-pts)+' pts</span> para '+next.n+' // '+next.s+'</div></div>':'')
    +'</div>'
    +'<div style="display:flex;gap:10px;justify-content:center">'
    +'<div style="background:rgba(242,240,235,.08);border:1px solid rgba(242,240,235,.12);border-radius:12px;padding:12px 16px;text-align:center">'
    +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:22px;font-weight:900;color:#F2F0EB">'+(cust?cust.total_orders||0:0)+'</div>'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:7px;color:#A8C8B0;margin-top:2px">PEDIDOS</div></div>'
    +'<div style="background:rgba(242,240,235,.08);border:1px solid rgba(242,240,235,.12);border-radius:12px;padding:12px 16px;text-align:center">'
    +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:22px;font-weight:900;color:#F2F0EB">'+(cust?cust.total_redeemed||0:0)+'</div>'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:7px;color:#A8C8B0;margin-top:2px">CANJEADOS</div></div>'
    +'</div>'
    // Antes esta pantalla solo mostraba el saldo de bienvenida sin explicar cómo
    // funciona el programa — un cliente nuevo no tenía forma de saber que hay recompensas,
    // referidos o un reto mensual hasta toparse con esas pantallas por su cuenta.
    +'<div style="margin-top:20px;text-align:left;background:rgba(242,240,235,.05);border-radius:12px;padding:16px 18px">'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:10px">CÓMO FUNCIONA //</div>'
    +[['cart','Gana puntos con cada pedido pagado.'],['gift','Canjéalos por salsas, upgrades y sándwiches gratis.'],['heart','Invita amigos — ambos ganan 50 puntos extra.']].map(function(x){return'<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px">'+icon(x[0],15,GOLD)+'<span style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;line-height:1.4">'+x[1]+'</span></div>';}).join('')
    +'</div>'
    +'<div style="margin-top:20px;font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#F2F0EB;letter-spacing:.15em;opacity:.7" class="blink">toca para continuar //</div>'
    +'</div></div>';
}
function sPHome(){
  var pts=cust.points||0;
  var next=RWDS.find(function(r){return r.pts>pts;}),prev=null;
  RWDS.forEach(function(r){if(r.pts<=pts)prev=r;});
  var pct=next?((pts-(prev?prev.pts:0))/(next.pts-(prev?prev.pts:0)))*100:100;
  var unlocked=RWDS.filter(function(r){return r.pts<=pts;});
  return H()+'<div style="flex:1;padding:20px 20px 100px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:14px">HOLA, '+esc(cust.name.split(' ')[0].toUpperCase())+' //</div>'
    +'<div style="background:linear-gradient(135deg,#0c1d30,#07121e);border:1px solid rgba(203,162,88,.15);border-radius:16px;padding:24px;margin-bottom:20px;overflow:hidden">'
    +'<div style="margin-bottom:8px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:4px">TUS PUNTOS //</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:58px;font-weight:900;color:#fff;line-height:1">'+pts.toLocaleString()+'</div></div>'
    +(next?'<div style="background:rgba(255,255,255,.05);border-radius:4px;height:4px;overflow:hidden;margin-bottom:6px"><div style="background:'+GOLD+';height:100%;width:'+Math.min(pct,100)+'%;border-radius:4px"></div></div><div style="display:flex;justify-content:space-between"><span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0">+'+(next.pts-pts)+' pts para</span><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:11px;font-weight:700;color:'+GOLD+'">'+next.n+' // '+next.s+'</span></div>':'')
    +'<div style="margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.04);display:flex;gap:24px">'+[['PEDIDOS',cust.total_orders||0],['CANJEADOS',cust.total_redeemed||0]].map(function(x){return'<div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:18px;font-weight:700;color:#FFFFFF">'+x[1]+'</div><div style="font-family:\'Share Tech Mono\',monospace;font-size:8px;color:'+GOLD+';letter-spacing:.15em">'+x[0]+'</div></div>';}).join('')+'</div></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">'+[['CANJEAR','RECOMPENSA','sc=\'p_rewards\';render()'],['MIS','PEDIDOS','sc=\'p_orders\';loadMyOrders()'],['HISTORIAL','PUNTOS','loadHist()'],['MI','PERFIL','sc=\'p_profile\';render()'],['MIS','DIRECCIONES','loadAddresses()'],['MIS','FAVORITOS','loadFavorites()']].concat(isAdmin?[['PANEL','ADMIN','sc=\'admin_home\';loadAdmin()']]:[]).map(function(x){var isAdm=x[0]==='PANEL';return'<div onclick="'+x[2]+'" style="background:'+(isAdm?'#1a1200':'#0d0d0d')+';border:1px solid '+(isAdm?'rgba(245,197,24,.3)':'#1c1c1c')+';border-radius:10px;padding:16px 14px;cursor:pointer"><div style="font-family:Barlow Condensed,sans-serif;font-size:20px;font-weight:900;color:'+(isAdm?'#F5C518':'#fff')+';letter-spacing:.06em">'+x[0]+'<span style="color:'+(isAdm?'#F5C518':GOLD)+'"> //</span></div><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:'+(isAdm?'#E0C060':'#A8C8B0')+';letter-spacing:.15em;margin-top:3px">'+x[1]+'</div></div>';}).join('')+'</div>'
    +(unlocked.length?'<div><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px;font-weight:700">LISTAS PARA USAR //</div>'+unlocked.map(function(r){return'<div style="background:#1A3028;border:1px solid '+GOLD+';border-radius:10px;padding:13px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:16px;font-weight:700;color:#FFFFFF">'+r.n+'<span style="color:'+GOLD+'"> // </span>'+r.s+'</span><span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0">se usa al pedir</span></div>';}).join('')+'</div>':'')
    +'</div>'+NAV();
}

// MY ORDERS — client side
async function loadMyOrders(){
  sc='p_orders';listLoading=true;render();
  // Timeout safety — never stay stuck more than 8 seconds
  var done=false;
  var timer=setTimeout(function(){if(!done){done=true;listLoading=false;render();}},8000);
  try{
    if(cust){
      myOrders=(await api('my-orders',{token:token})).orders;
    }else{
      var lr=localStorage.getItem('sw_last_ref');
      myOrders=lr?(await api('my-orders',{ref:lr})).orders:[];
    }
  }catch(e){myOrders=[];}
  if(!done){done=true;clearTimeout(timer);listLoading=false;render();}
}

function sPOrders(){
  var act=myOrders.filter(function(o){return o.status!=='ENTREGADO';});
  var done=myOrders.filter(function(o){return o.status==='ENTREGADO';});
  function card(o){
    var ci=STEPS.indexOf(o.status);
    return'<div onclick="_od=\''+o.id+'\';rtStars=0;rtMsg=\'\';sc=\'p_ord_detail\';render()" style="background:#2D5246;border:1px solid #3A6B58;border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">'
      +'<div><div style="font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:700;color:#FFFFFF">'+esc(o.customer_name)+'</div>'
      +'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0;margin-top:2px">'+esc(o.ref)+' · '+esc(o.date)+'</div></div>'
      +'<div style="font-family:Barlow Condensed,sans-serif;font-size:20px;font-weight:900;color:'+GOLD+';flex-shrink:0">'+SOLES+o.total+'</div></div>'
      +'<div style="font-family:Barlow,sans-serif;font-size:11px;color:#A8C8B0;margin-bottom:8px">'+esc(o.summary)+'</div>'
      +'<div style="display:flex;gap:2px;margin-bottom:6px">'+STEPS.map(function(st,i){var dn=i<=ci,c2=STATUSES[st];return'<div style="flex:1;height:3px;background:'+(dn?c2.c:'#3A6B58')+';border-radius:3px"></div>';}).join('')+'</div>'
      +stBadge(o.status)+'<div style="font-family:Share Tech Mono,monospace;font-size:8px;color:'+GOLD+';text-align:right;margin-top:4px">ver detalle ›</div></div>';
  }
  var h=H('MIS PEDIDOS',"sc='p_home';render()")+'<div style="flex:1;padding:20px 20px 100px;overflow-y:auto" class="fi">';
  if(listLoading){
    h+=skeletonCards(3,132);
  }else{
    if(act.length){
      h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#ffa500;letter-spacing:.2em;margin-bottom:10px" class="blink">● ACTIVOS // '+act.length+'</div>';
      h+=act.map(card).join('');
    }
    if(done.length){
      h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:'+(act.length?'16px':'0')+' 0 10px">ANTERIORES // '+done.length+'</div>';
      h+=done.map(card).join('');
    }
    if(!myOrders.length){
      h+='<div style="text-align:center;padding-top:64px"><div style="margin-bottom:12px;opacity:.5;display:flex;justify-content:center">'+icon('reclamo',32,'#A8C8B0')+'</div><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">SIN PEDIDOS //</div>'+BTN('HACER UN PEDIDO //','swTab(\'order\')')+'</div>';
    }
  }
  h+='<div style="margin-top:14px">'+BTN('ACTUALIZAR //','loadMyOrders()',true)+'</div></div>'+NAV();
  return h;
}
var _od=null;
function sOrdDetail(){
  var o=myOrders.find(function(x){return x.id==_od||x.id===_od;});
  if(!o)return sPOrders();
  var ci=STEPS.indexOf(o.status);
  return H('DETALLE',"sc='p_orders';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">'
    +'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:12px;padding:18px;margin-bottom:12px">'
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'
    +'<div><div style="font-family:Barlow Condensed,sans-serif;font-size:22px;font-weight:900;color:#FFFFFF">'+esc(o.customer_name)+'</div>'
    +'<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:'+GOLD+';margin-top:2px">'+esc(o.ref)+'</div>'
    +'<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0;margin-top:2px">'+esc(o.date)+'</div></div>'
    +'<div style="font-family:Barlow Condensed,sans-serif;font-size:34px;font-weight:900;color:'+GOLD+'">'+SOLES+o.total+'</div></div>'
    +'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0;margin-bottom:4px">PEDIDO //</div>'
    +'<div style="font-family:Barlow,sans-serif;font-size:13px;color:#ddd;line-height:1.6;margin-bottom:10px">'+esc(o.summary)+'</div>'
    +'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0;margin-bottom:4px">DIRECCIÓN //</div>'
    +'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#aaa">'+esc(o.customer_address)+'</div>'
    +(o.redeemed_reward?'<div style="margin-top:10px;padding-top:10px;border-top:1px solid #3A6B58"><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#25D366;display:flex;align-items:center;gap:6px">'+icon('gift',12,'#25D366')+esc(o.redeemed_reward)+'</div></div>':'')
    +'</div>'
    +'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:12px;padding:16px;margin-bottom:12px">'
    +'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0;margin-bottom:10px">ESTADO //</div>'
    +'<div style="display:flex;gap:4px;margin-bottom:12px">'+STEPS.map(function(st,i){var dn=i<=ci,c2=STATUSES[st];return'<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px"><div style="height:5px;width:100%;background:'+(dn?c2.c:'#3A6B58')+';border-radius:4px"></div><div style="font-family:Share Tech Mono,monospace;font-size:7px;color:'+(dn?c2.c:'#4A7A68')+';text-align:center;line-height:1.3">'+st.replace(' ','<br>')+'</div></div>';}).join('')+'</div>'
    +stBadge(o.status)
    +'</div>'
    // Antes la página de Cambios y Devoluciones prometía "puedes cancelar sin costo antes
    // de que la cocina empiece a preparar tu pedido", pero no existía ningún botón para
    // hacerlo desde la app — la única forma real era escribir por WhatsApp y esperar a que
    // un operador lo cancelara manualmente (hallazgo de la auditoría de flujo de pedidos:
    // una promesa que la app no cumplía por sí sola). Este botón cumple esa promesa
    // directamente mientras el pedido sigue en RECIBIDO.
    +(o.status==='RECIBIDO'?BTN('CANCELAR PEDIDO //','doCancelMyOrder(\''+o.id+'\',\''+o.ref+'\')',true):'')
    +(o.status!=='ENTREGADO'?'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;text-align:center;margin-top:10px" class="blink">&#8635; Toca ACTUALIZAR en MIS PEDIDOS</div>':'<div style="font-family:Barlow,sans-serif;font-size:13px;color:#25D366;text-align:center;margin-top:10px">&#9989; ¡Entregado!</div>')
    +ratingHTML(o)
    +'</div>'+NAV();
}
async function doCancelMyOrder(ordId,ref){
  if(!(await showConfirm('¿Cancelar este pedido? Como la cocina aún no empezó a prepararlo, no tiene costo.')))return;
  try{
    var r=await api('cancel-my-order',{token:token||undefined,orderId:ordId,ref:ref});
    myOrders=myOrders.map(function(o){return o.id===ordId?r.order:o;});
    showToast('Pedido cancelado.','success');
    render();
  }catch(e){showToast(e.message);}
}
function ratingHTML(o){
  if(o.status!=='ENTREGADO')return'';
  if(ratedRefs().indexOf(o.ref)>=0){
    return'<div style="margin-top:12px;background:#2D5246;border:1px solid #3A6B58;border-radius:12px;padding:16px;text-align:center"><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#25D366">&#10003; Ya calificaste este pedido &mdash; ¡gracias!</div></div>';
  }
  return'<div style="margin-top:12px;background:#2D5246;border:1px solid #3A6B58;border-radius:12px;padding:18px"><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:10px">¿CÓMO ESTUVO TU PEDIDO? //</div><div style="display:flex;gap:8px;margin-bottom:12px;justify-content:center">'+[1,2,3,4,5].map(function(n){var on=n<=rtStars;return'<span onclick="rtStars='+n+';render()" style="cursor:pointer;font-size:28px;color:'+(on?'#F5C518':'#3A6B58')+'">&#9733;</span>';}).join('')+'</div><textarea id="rt-comment" placeholder="Comentario opcional" style="background:#1A3028;border:1px solid #3A6B58;border-radius:8px;padding:10px 12px;color:#FFFFFF;width:100%;font-size:12px;font-family:Barlow,sans-serif;min-height:60px;margin-bottom:10px;box-sizing:border-box"></textarea><div id="rt-msg" style="font-family:Barlow,sans-serif;font-size:11px;color:#ff5555;min-height:14px;margin-bottom:8px">'+rtMsg+'</div>'+BTN('ENVIAR CALIFICACIÓN //','doSubmitRating(\''+o.ref+'\')')+'</div>';
}
async function doSubmitRating(ref){
  if(!rtStars){rtMsg='Elige de 1 a 5 estrellas.';render();return;}
  var commentEl=(document.getElementById('rt-comment') as HTMLInputElement | null);
  var comment=commentEl?commentEl.value.trim():'';
  try{
    await api('submit-rating',{ref:ref,stars:rtStars,comment:comment});
    markRated(ref);
    rtStars=0;rtMsg='';
  }catch(e){
    if(e.message&&e.message.indexOf('ya fue calificado')>=0)markRated(ref);
    rtMsg=e.message;
  }
  render();
}

async function loadHist(){
  sc='p_history';listLoading=true;render();
  var done=false;
  var timer=setTimeout(function(){if(!done){done=true;listLoading=false;render();}},8000);
  try{
    if(cust){
      var r=await api('my-history',{token:token});
      cust._txns=r.transactions;
    }
  }catch(e){if(cust)cust._txns=[];}
  if(!done){done=true;clearTimeout(timer);listLoading=false;render();}
}
function sPHistory(){
  var txns=(cust&&cust._txns)||[];
  var h=H('HISTORIAL DE PUNTOS',"sc='p_home';render()")+'<div style="flex:1;padding:20px 20px 100px;overflow-y:auto" class="fi">';
  if(listLoading){
    h+=skeletonCards(5,48);
  }else if(!txns.length){
    h+='<div style="text-align:center;padding-top:64px"><div style="margin-bottom:12px;opacity:.5;display:flex;justify-content:center">'+icon('estrella',32,'#A8C8B0')+'</div><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:'+GOLD+';letter-spacing:.2em">SIN MOVIMIENTOS //</div></div>';
  }else{
    h+=txns.map(function(t){
      var pos=(t.points||0)>=0;
      return'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:Barlow,sans-serif;font-size:13px;color:#F2F0EB">'+esc(t.description||t.type)+'</div><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0;margin-top:2px">'+esc(t.date||'')+'</div></div><div style="font-family:Barlow Condensed,sans-serif;font-size:20px;font-weight:900;color:'+(pos?'#25D366':'#ff8888')+'">'+(pos?'+':'')+t.points+'</div></div>';
    }).join('');
  }
  h+='</div>'+NAV();
  return h;
}

function sPRewards(){
  var pts=cust.points||0;
  return H('RECOMPENSAS','sc=\'p_home\';render()')+'<div style="flex:1;padding:20px 20px 100px;overflow-y:auto" class="fi"><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:4px">TU BALANCE //</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:48px;font-weight:900;color:#fff;margin-bottom:12px;line-height:1">'+pts+'<span style="color:'+GOLD+';font-size:22px"> pts</span></div><p style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:24px;line-height:1.5">Las recompensas se aplican directamente a tu pedido — elígelas en la pantalla de confirmar cuando tengas puntos suficientes.</p>'+RWDS.map(function(r){var ok=pts>=r.pts,pct=Math.min((pts/r.pts)*100,100);return'<div style="background:'+(ok?'#0c1d30':'#0d0d0d')+';border:1px solid '+(ok?GOLD:'#1a1a1a')+';border-radius:12px;padding:16px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:'+(ok?10:6)+'px"><div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:18px;font-weight:700;color:'+(ok?'#fff':'#666')+';letter-spacing:.04em">'+r.n+'<span style="color:'+(ok?GOLD:'#2a2a2a')+'"> // </span>'+r.s+'</div><p style="font-family:\'Barlow\',sans-serif;font-size:12px;color:'+(ok?'#888':'#555')+';margin-top:2px">'+r.d+'</p>'+(r.sizeOnly?'<p style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#ffa500;margin-top:4px">⚠ Válido solo en tamaño '+r.sizeOnly+'CM</p>':'')+'</div><div style="text-align:right;flex-shrink:0;margin-left:16px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:22px;font-weight:900;color:'+(ok?GOLD:'#444')+';line-height:1">'+r.pts+'</div><div style="font-family:\'Share Tech Mono\',monospace;font-size:8px;color:'+GOLD+'">PTS</div></div></div>'+(!ok?'<div style="background:#2D5246;border-radius:4px;height:3px;overflow:hidden;margin-bottom:4px"><div style="background:'+GOLD+';height:100%;width:'+pct+'%;border-radius:4px"></div></div><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+'">Faltan '+(r.pts-pts)+' puntos</div>':'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#25D366">✓ Disponible en tu próximo pedido</div>')+'</div>';}).join('')+'</div>'+BTN('HACER UN PEDIDO //','swTab(\'order\')')+'</div>'+NAV();
}



// Insignias de hitos — puramente derivadas de datos que ya viven en `cust` (sin pedir
// nada nuevo al servidor): marcan progreso acumulado (no solo del mes en curso, a
// diferencia de los retos de arriba) para darle al perfil una sensación de colección sin
// reintroducir un multiplicador de puntos por nivel (retirado a propósito del proyecto).
function computeBadges(c){
  return[
    {icon:'sandwich',label:'Primer pedido',unlocked:(c.total_orders||0)>=1},
    {icon:'flame',label:'Frecuente',sub:'10+ pedidos',unlocked:(c.total_orders||0)>=10},
    {icon:'crown',label:'Leyenda',sub:'25+ pedidos',unlocked:(c.total_orders||0)>=25},
    {icon:'compass',label:'Explorador',sub:'reto descubrimiento',unlocked:!!c.discovery_claimed_month},
    {icon:'trophy',label:'Recurrente',sub:'reto mensual',unlocked:!!c.challenge_claimed_month},
    {icon:'heart',label:'Embajador',sub:'3+ referidos',unlocked:(c.total_referrals||0)>=3},
  ];
}
function badgesHTML(c){
  var badges=computeBadges(c),unlockedCount=badges.filter(function(b){return b.unlocked;}).length;
  return'<div style="background:#1A3028;border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;margin-bottom:12px">INSIGNIAS<span style="color:'+GOLD+'"> // </span>'+unlockedCount+'/'+badges.length+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+badges.map(function(b){
    return'<div style="background:'+(b.unlocked?'#1E4A38':'#0d1a15')+';border:1px solid '+(b.unlocked?GOLD:'#2a2a2a')+';border-radius:10px;padding:10px;text-align:center;opacity:'+(b.unlocked?1:.4)+'"><div>'+icon(b.icon,22,(b.unlocked?GOLD:'#666'))+'</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:11px;font-weight:700;color:'+(b.unlocked?'#FFFFFF':'#A8C8B0')+';margin-top:4px">'+b.label+'</div>'+(b.sub?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:8px;color:#A8C8B0;margin-top:2px">'+b.sub+'</div>':'')+'</div>';
  }).join('')+'</div></div>';
}
function sPProfile(){
  var initial=esc((cust.name||'?').trim().charAt(0).toUpperCase());
  var heroHTML='<div style="background:linear-gradient(135deg,#2D5246,#1E3932);border:1px solid #3A6B58;border-radius:16px;padding:22px;margin-bottom:16px;display:flex;align-items:center;gap:16px"><div style="flex:0 0 auto;width:56px;height:56px;border-radius:50%;background:'+GOLD+';display:flex;align-items:center;justify-content:center;font-family:\'Barlow Condensed\',sans-serif;font-size:26px;font-weight:900;color:#12241D">'+initial+'</div><div style="flex:1;min-width:0"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:24px;font-weight:900;color:#FFFFFF;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(cust.name)+'</div><div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#A8C8B0;margin-top:4px">'+esc(cust.phone)+'</div><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-top:6px">'+rankName(cust.total_orders)+' //</div></div><div style="flex:0 0 auto;text-align:center;background:rgba(0,0,0,.2);border-radius:10px;padding:8px 12px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:20px;font-weight:900;color:'+GOLD+';line-height:1">'+(cust.points||0)+'</div><div style="font-family:\'Share Tech Mono\',monospace;font-size:8px;color:#A8C8B0;letter-spacing:.1em;margin-top:2px">PTS</div></div></div>';
  var referralHTML='<div style="background:#1A3028;border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;margin-bottom:10px">PROGRAMA<span style="color:'+GOLD+'"> // </span>REFERIDOS</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:26px;font-weight:900;color:#FFFFFF;margin-bottom:4px">'+cust.phone+'</div><div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:12px">Tu código de referido · '+(cust.total_referrals||0)+' amigos referidos</div><button onclick="shareReferral()" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#0d0d0d;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;letter-spacing:.08em;padding:12px;border-radius:8px;text-align:center">COMPARTIR POR WHATSAPP //</button></div>';
  var creditHTML='<div style="background:#1A3028;border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;margin-bottom:10px">CRÉDITO<span style="color:'+GOLD+'"> // </span>SND//WCH</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:34px;font-weight:900;color:#FFFFFF;margin-bottom:4px">'+SOLES+(cust.credit_balance||0)+'</div><div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0;margin-bottom:14px;line-height:1.5">No es dinero real: no se retira ni se transfiere a un banco. Solo sirve para pagar pedidos o regalarlo a otro cliente SND//WCH.</div><div style="display:flex;flex-direction:column;gap:8px">'+INP('cg-phone','TELÉFONO DEL AMIGO // 9XXXXXXXX','tel',wPhone)+INP('cg-amt','MONTO A REGALAR // S/','number',wAmt)+'<div id="cg-msg" style="font-family:\'Barlow\',sans-serif;font-size:11px;color:'+GOLD+';min-height:14px">'+wMsg+'</div>'+BTN('REGALAR CRÉDITO //','doCreditGift()')+'</div></div>';
  var giftCardHTML='<div style="background:#1A3028;border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;margin-bottom:10px">TARJETA<span style="color:'+GOLD+'"> // </span>DE REGALO</div><div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0;margin-bottom:14px;line-height:1.5">Compra crédito nuevo con tu tarjeta y regálalo a otro cliente — sin gastar tu propio saldo. Ideal para cumpleaños o para invitar a un amigo.</div>'+BTN('COMPRAR Y REGALAR //',"sc='gift_card';render()")+'</div>';
  var weeklyPlanHTML='<div style="background:#1A3028;border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;margin-bottom:10px">PLAN<span style="color:'+GOLD+'"> // </span>SEMANAL</div><div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0;margin-bottom:14px;line-height:1.5">Paga '+SOLES+WEEKLY_PLAN_PRICE+' hoy y recibe '+SOLES+WEEKLY_PLAN_CREDIT+' en saldo para pedir cuando quieras esta semana. Bono de '+SOLES+(WEEKLY_PLAN_CREDIT-WEEKLY_PLAN_PRICE)+' de regalo.</div>'+BTN('ACTIVAR PLAN SEMANAL //',"sc='weekly_plan';render()")+'</div>';
  var challengeHTML='<div style="background:#1A3028;border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;margin-bottom:10px">RETO<span style="color:'+GOLD+'"> // </span>MENSUAL</div><div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:12px;line-height:1.5">Haz 3 pedidos pagados este mes y gana 50 puntos extra.</div><div id="chal-msg" style="font-family:\'Barlow\',sans-serif;font-size:11px;color:'+GOLD+';margin-bottom:10px;min-height:14px">'+chalMsg+'</div>'+BTN('RECLAMAR RECOMPENSA //','doClaimChallenge()')+'</div>';
  var discoveryHTML='<div style="background:#1A3028;border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;margin-bottom:10px">RETO<span style="color:'+GOLD+'"> // </span>DESCUBRIMIENTO</div><div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:12px;line-height:1.5">Prueba 3 Signatures distintos este mes (no repitas siempre el mismo) y gana 50 puntos extra.</div><div id="disc-chal-msg" style="font-family:\'Barlow\',sans-serif;font-size:11px;color:'+GOLD+';margin-bottom:10px;min-height:14px">'+discChalMsg+'</div>'+BTN('RECLAMAR RECOMPENSA //','doClaimDiscoveryChallenge()')+'</div>';
  var pushHTML='<div onclick="togglePushNotifications()" style="background:'+(pushSubscribed?'#1E4A38':'#1A3028')+';border:1px solid '+(pushSubscribed?GOLD:'#3A6B58')+';border-radius:12px;padding:18px;margin-bottom:16px;cursor:pointer"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF">NOTIFICACIONES<span style="color:'+GOLD+'"> // </span>PUSH</div><div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0;margin-top:2px">Avísame cuando mi pedido esté en camino o listo</div></div><span style="font-family:\'Share Tech Mono\',monospace;font-size:16px;color:'+(pushSubscribed?GOLD:'#A8C8B0')+'">'+(pushSubscribed?'✓':'○')+'</span></div>'+(pushMsg?'<div style="font-family:\'Barlow\',sans-serif;font-size:11px;color:'+GOLD+';margin-top:8px">'+esc(pushMsg)+'</div>':'')+'</div>';
  return H('MI PERFIL','sc=\'p_home\';render()')+'<div style="flex:1;padding:24px 20px 100px;overflow-y:auto" class="fi">'+heroHTML
    +badgesHTML(cust)
    +pushHTML+referralHTML+creditHTML+weeklyPlanHTML+giftCardHTML+challengeHTML+discoveryHTML
    +'<div onclick="sc=\'p_legal\';render()" style="cursor:pointer;text-align:center;font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#A8C8B0;letter-spacing:.1em;padding:10px;margin-bottom:6px">TÉRMINOS Y PRIVACIDAD //</div>'+'<div style="display:flex;flex-direction:column;gap:10px"><button onclick="doLogout()" style="all:unset;cursor:pointer;display:block;width:100%;border:1px solid #3A6B58;color:#A8C8B0;font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;letter-spacing:.1em;padding:14px;border-radius:10px;text-align:center">CERRAR SESIÓN //</button><button onclick="doLogoutEverywhere()" style="all:unset;cursor:pointer;display:block;width:100%;border:1px solid rgba(255,85,85,.35);color:#ff8888;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;letter-spacing:.08em;padding:14px;border-radius:10px;text-align:center">CERRAR SESIÓN EN TODOS LOS DISPOSITIVOS //</button><button onclick="doDeleteAccount()" style="all:unset;cursor:pointer;display:block;width:100%;color:#ff5555;font-family:\'Barlow\',sans-serif;font-size:11px;letter-spacing:.05em;padding:10px;text-align:center;opacity:.7">Eliminar mi cuenta permanentemente</button></div></div>'+NAV();
}
function shareReferral(){
  // Antes solo mandaba el número como "código" — el amigo tenía que escribirlo a mano
  // en el registro. El link con ?ref= ya existe y auto-rellena ese campo (ver refCode
  // arriba); solo faltaba usarlo aquí.
  var link=location.origin+location.pathname+'?ref='+encodeURIComponent(cust.phone);
  var text='Usa mi link para crear tu cuenta en SND//WCH y ambos ganamos 50 puntos: '+link;
  if(navigator.share){
    navigator.share({title:'SND//WCH',text:text,url:link}).catch(function(){});
  }else{
    window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
  }
}
async function doCreditGift(){
  var phoneEl=(document.getElementById('cg-phone') as HTMLInputElement | null),amtEl=(document.getElementById('cg-amt') as HTMLInputElement | null);
  var phone=phoneEl?phoneEl.value.trim():'';
  var amt=amtEl?parseFloat(amtEl.value):NaN;
  wPhone=phone;wAmt=amtEl?amtEl.value:'';
  if(!phone||!amt||amt<=0){wMsg='Ingresa un teléfono y un monto válido.';render();return;}
  // Antes esto transfería con un solo tap y sin mostrar a quién le estaba llegando el
  // dinero — un typo en el teléfono lo mandaba a un desconocido sin ninguna forma de
  // darse cuenta antes de confirmar (hallazgo de la auditoría de flujo de pedidos).
  var name;
  try{
    var lookup=await api('credit-lookup',{token:token,toPhone:phone});
    name=lookup.name;
  }catch(e){wMsg=e.message;render();return;}
  if(!(await showConfirm('¿Enviar '+SOLES+amt+' de crédito a '+name+' ('+phone+')?')))return;
  try{
    await api('credit-gift',{token:token,toPhone:phone,amount:amt});
    var r=await api('session-check',{token:token});
    if(r.valid){cust=r.customer;cacheCust(cust,isAdmin);}
    wMsg='¡Crédito enviado a '+name+'!';wPhone='';wAmt='';
  }catch(e){wMsg=e.message;}
  render();
}
// Tarjeta de regalo digital: comprar crédito con un cobro real (Culqi) para acreditárselo
// a OTRO cliente — distinta de doCreditGift (que transfiere saldo YA PROPIO, sin cobro
// nuevo). Sigue el mismo esqueleto de dos pasos que el pago de pedidos (prepare-order +
// Culqi + place-order): primero se valida y reserva la compra (prepare-credit-purchase),
// solo si eso tuvo éxito se abre el widget de Culqi, y recién con el cobro confirmado se
// acredita el saldo (confirm-credit-purchase).
function sGiftCard(){
  return H('TARJETA DE REGALO','sc=\'p_profile\';render()')+'<div style="flex:1;padding:24px 20px 100px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:22px;font-weight:900;color:#fff;margin-bottom:4px">TARJETA<span style="color:'+GOLD+'"> // </span>DE REGALO</div>'
    +'<p style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:20px;line-height:1.5">Compra crédito SND//WCH con tu tarjeta y regálaselo a otro cliente al instante. Monto entre S/10 y S/500.</p>'
    +'<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:6px">'
    +INP('gc-phone','TELÉFONO DEL DESTINATARIO // 9XXXXXXXX','tel',gcPhone)
    +INP('gc-amt','MONTO // S/','number',gcAmt)
    +INP('gc-email','TU CORREO (para el comprobante)','email',gcEmail||(cust&&cust.email)||'')
    +INP('gc-note','MENSAJE PARA EL DESTINATARIO (opcional)','text',gcNote)
    +'</div>'
    +'<div id="gc-msg" style="font-family:\'Barlow\',sans-serif;font-size:11px;color:'+GOLD+';min-height:14px;margin:8px 0 12px">'+esc(gcMsg)+'</div>'
    +BTN('COMPRAR Y REGALAR //','doGiftCardBuy()')
    +'</div>'+NAV();
}
async function doGiftCardBuy(){
  var phoneEl=(document.getElementById('gc-phone') as HTMLInputElement | null);
  var amtEl=(document.getElementById('gc-amt') as HTMLInputElement | null);
  var emailEl=(document.getElementById('gc-email') as HTMLInputElement | null);
  var noteEl=(document.getElementById('gc-note') as HTMLInputElement | null);
  var phone=phoneEl?phoneEl.value.trim():'';
  var amt=amtEl?parseFloat(amtEl.value):NaN;
  var email=emailEl?emailEl.value.trim():'';
  var note=noteEl?noteEl.value.trim():'';
  gcPhone=phone;gcAmt=amtEl?amtEl.value:'';gcEmail=email;gcNote=note;
  if(!phone||!amt||amt<10||amt>500){gcMsg='Ingresa un teléfono y un monto entre S/10 y S/500.';render();return;}
  if(!email){gcMsg='Ingresa tu correo para el comprobante de pago.';render();return;}
  var name;
  try{
    var lookup=await api('credit-lookup',{token:token,toPhone:phone});
    name=lookup.name;
  }catch(e){gcMsg=e.message;render();return;}
  if(!(await showConfirm('¿Comprar '+SOLES+amt+' de crédito para '+name+' ('+phone+')?')))return;
  busy=true;busyMsg='Verificando...';render();
  var prep;
  try{
    prep=await api('prepare-credit-purchase',{token:token,toPhone:phone,amount:amt,message:note});
  }catch(e){
    busy=false;gcMsg=e.message;render();return;
  }
  busy=false;render();
  _pendingGift={ref:prep.ref,toPhone:phone,toName:prep.toName||name,amount:amt,email:email};
  payGiftWithCulqi(amt,email,prep.ref);
}
function payGiftWithCulqi(amountSoles,email,ref){
  if(typeof Culqi==='undefined'){gcMsg='No se pudo cargar la pasarela de pago. Verifica tu conexión e intenta de nuevo.';_pendingGift=null;render();return;}
  if(!CULQI_PUBLIC_KEY||CULQI_PUBLIC_KEY.indexOf('REEMPLAZA')>=0){gcMsg='La pasarela de pago aún no está configurada. Contacta al administrador.';_pendingGift=null;render();return;}
  Culqi.publicKey=CULQI_PUBLIC_KEY;
  Culqi.settings({
    title:'SND//WCH',
    currency:'PEN',
    amount:Math.round(amountSoles*100),
    description:'Tarjeta de regalo '+ref
  });
  Culqi.options({
    lang:'auto',
    installments:false,
    paymentMethods:{tarjeta:true,yape:true,billetera:false,bancaMovil:false,agente:false,cuotealo:false}
  });
  Culqi.open();
}
async function chargeAndFinalizeGift(culqiToken){
  if(!_pendingGift)return;
  var pg=_pendingGift;
  busy=true;busyMsg='Procesando pago...';render();
  try{
    var resp=await fetch(CREDIT_CHARGE_FN_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({token:culqiToken,amountSoles:pg.amount,email:pg.email,ref:pg.ref})
    });
    var data=await resp.json().catch(function(){return{};});
    if(!resp.ok||!data.success){
      busy=false;gcMsg=data.error||'El pago fue rechazado. Intenta de nuevo o con otro método.';_pendingGift=null;render();
      return;
    }
    var res;
    try{
      res=await api('confirm-credit-purchase',{token:token,chargeId:data.chargeId,ref:pg.ref});
    }catch(e){
      busy=false;
      gcMsg=(e.message||'No se pudo confirmar tu compra.')+' Ya se realizó el cobro — contáctanos con tu referencia '+pg.ref+' para confirmar el crédito manualmente. No vuelvas a intentar pagar.';
      _pendingGift=null;render();
      return;
    }
    busy=false;
    gcPhone='';gcAmt='';gcNote='';gcEmail='';
    _pendingGift=null;
    showToast('¡Regalaste crédito a '+(res.toName||pg.toName)+'!');
    sc='p_profile';render();
  }catch(e){
    busy=false;gcMsg='Error de conexión al procesar el pago. Intenta de nuevo.';_pendingGift=null;render();
  }
}
// Plan Semanal — mismo esqueleto de dos pasos que la tarjeta de regalo (prepare +
// Culqi + confirm), pero acredita al PROPIO comprador en vez de a otro cliente, y con
// monto fijo (sin inputs de teléfono/monto que llenar).
var wpMsg='',wpEmail='';
var _pendingWeeklyPlan=null;
function sWeeklyPlan(){
  return H('PLAN SEMANAL','sc=\'p_profile\';render()')+'<div style="flex:1;padding:24px 20px 100px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:22px;font-weight:900;color:#fff;margin-bottom:4px">PLAN<span style="color:'+GOLD+'"> // </span>SEMANAL</div>'
    +'<p style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:20px;line-height:1.5">Paga '+SOLES+WEEKLY_PLAN_PRICE+' hoy con tu tarjeta y recibe '+SOLES+WEEKLY_PLAN_CREDIT+' en saldo SND//WCH al instante — pide cuando quieras esta semana, el saldo no vence.</p>'
    +'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#F2F0EB">PAGAS HOY</span><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:22px;font-weight:900;color:#FFFFFF">'+SOLES+WEEKLY_PLAN_PRICE+'</span></div>'
    +'<div style="background:rgba(37,211,102,.1);border:1px solid rgba(37,211,102,.3);border-radius:10px;padding:16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center"><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#F2F0EB">RECIBES EN SALDO</span><span style="font-family:\'Barlow Condensed\',sans-serif;font-size:22px;font-weight:900;color:#25D366">'+SOLES+WEEKLY_PLAN_CREDIT+'</span></div>'
    +INP('wp-email','TU CORREO (para el comprobante)','email',wpEmail||(cust&&cust.email)||'')
    +'<div id="wp-msg" style="font-family:\'Barlow\',sans-serif;font-size:11px;color:'+GOLD+';min-height:14px;margin:8px 0 12px">'+esc(wpMsg)+'</div>'
    +BTN('ACTIVAR PLAN SEMANAL //','doWeeklyPlanBuy()')
    +'</div>'+NAV();
}
async function doWeeklyPlanBuy(){
  var emailEl=(document.getElementById('wp-email') as HTMLInputElement | null);
  var email=emailEl?emailEl.value.trim():'';
  wpEmail=email;
  if(!email){wpMsg='Ingresa tu correo para el comprobante de pago.';render();return;}
  if(!(await showConfirm('¿Pagar '+SOLES+WEEKLY_PLAN_PRICE+' y recibir '+SOLES+WEEKLY_PLAN_CREDIT+' en saldo?')))return;
  busy=true;busyMsg='Verificando...';render();
  var prep;
  try{
    prep=await api('prepare-weekly-plan',{token:token});
  }catch(e){
    busy=false;wpMsg=e.message;render();return;
  }
  busy=false;render();
  _pendingWeeklyPlan={ref:prep.ref,amount:prep.amountPaid,creditAmount:prep.creditAmount,email:email};
  payWeeklyPlanWithCulqi(prep.amountPaid,email,prep.ref);
}
function payWeeklyPlanWithCulqi(amountSoles,email,ref){
  if(typeof Culqi==='undefined'){wpMsg='No se pudo cargar la pasarela de pago. Verifica tu conexión e intenta de nuevo.';_pendingWeeklyPlan=null;render();return;}
  if(!CULQI_PUBLIC_KEY||CULQI_PUBLIC_KEY.indexOf('REEMPLAZA')>=0){wpMsg='La pasarela de pago aún no está configurada. Contacta al administrador.';_pendingWeeklyPlan=null;render();return;}
  Culqi.publicKey=CULQI_PUBLIC_KEY;
  Culqi.settings({
    title:'SND//WCH',
    currency:'PEN',
    amount:Math.round(amountSoles*100),
    description:'Plan Semanal '+ref
  });
  Culqi.options({
    lang:'auto',
    installments:false,
    paymentMethods:{tarjeta:true,yape:true,billetera:false,bancaMovil:false,agente:false,cuotealo:false}
  });
  Culqi.open();
}
async function chargeAndFinalizeWeeklyPlan(culqiToken){
  if(!_pendingWeeklyPlan)return;
  var pw=_pendingWeeklyPlan;
  busy=true;busyMsg='Procesando pago...';render();
  try{
    var resp=await fetch(CREDIT_CHARGE_FN_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({token:culqiToken,amountSoles:pw.amount,email:pw.email,ref:pw.ref})
    });
    var data=await resp.json().catch(function(){return{};});
    if(!resp.ok||!data.success){
      busy=false;wpMsg=data.error||'El pago fue rechazado. Intenta de nuevo o con otro método.';_pendingWeeklyPlan=null;render();
      return;
    }
    try{
      await api('confirm-weekly-plan',{token:token,chargeId:data.chargeId,ref:pw.ref});
    }catch(e){
      busy=false;
      wpMsg=(e.message||'No se pudo confirmar tu Plan Semanal.')+' Ya se realizó el cobro — contáctanos con tu referencia '+pw.ref+' para confirmar el saldo manualmente. No vuelvas a intentar pagar.';
      _pendingWeeklyPlan=null;render();
      return;
    }
    var r=await api('session-check',{token:token});
    if(r.valid){cust=r.customer;cacheCust(cust,isAdmin);}
    busy=false;
    wpEmail='';
    _pendingWeeklyPlan=null;
    showToast('¡Listo! Recibiste '+SOLES+pw.creditAmount+' en saldo.');
    sc='p_profile';render();
  }catch(e){
    busy=false;wpMsg='Error de conexión al procesar el pago. Intenta de nuevo.';_pendingWeeklyPlan=null;render();
  }
}
async function doRequestRestockNotify(sigId){
  if(restockNotified.indexOf(sigId)>=0)return;
  try{
    await api('request-restock-notify',{token:token,sigId:sigId});
    restockNotified.push(sigId);
    render();
    showToast('Te avisamos apenas vuelva.','success');
  }catch(e){showToast(e.message);}
}
async function doClaimChallenge(){
  try{
    var res=await api('claim-challenge',{token:token});
    if(res.customer){cust=res.customer;cacheCust(cust,isAdmin);}
    chalMsg='¡Reto completado! +50 pts';
  }catch(e){chalMsg=e.message;}
  render();
}
async function doClaimDiscoveryChallenge(){
  try{
    var res=await api('claim-discovery-challenge',{token:token});
    if(res.customer){cust=res.customer;cacheCust(cust,isAdmin);}
    discChalMsg='¡Reto completado! +50 pts';
  }catch(e){discChalMsg=e.message;}
  render();
}
function doLogout(){cust=null;isAdmin=false;savedPh='';token='';aErr='';localStorage.removeItem('sw_ph');localStorage.removeItem('sw_tok');cacheCust(null);sc='p_auth';render();}

// TÉRMINOS Y PRIVACIDAD — borrador inicial en texto simple, accesible desde el registro
// y el perfil. ⚠️ EDITA este texto con tu política real (revisada por un abogado) antes
// de operar de cara al público — esto es un punto de partida razonable, no asesoría legal.
function sPLegal(){
  var bk=(bkTo||(cust?'p_profile':'p_auth'));bkTo=null;
  return H('TÉRMINOS Y PRIVACIDAD',"sc='"+bk+"';render()")+'<div style="flex:1;padding:24px 20px 40px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:22px;font-weight:900;color:#fff;margin-bottom:4px">TÉRMINOS<span style="color:'+GOLD+'"> // </span>Y PRIVACIDAD</div>'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0;margin-bottom:20px">Última actualización: 2026</div>'
    +providerBlockHTML()
    +sec('QUÉ VENDEMOS //','Sándwiches preparados al momento, para delivery en '+BIZ_CITY+' — como Signature (combinaciones curadas por la casa) o armados a tu gusto (BUILD YOUR OWN), además de bebidas y snacks. El menú, con descripción y precio de cada producto, está disponible dentro de la app desde el home.')
    +sec('QUÉ DATOS PEDIMOS //','Nombre, teléfono, PIN, DNI y fecha de nacimiento al crear tu cuenta; correo y dirección son opcionales. El DNI y la fecha de nacimiento solo se usan para verificar tu identidad si necesitas recuperar tu cuenta — no se muestran a nadie más.')
    +sec('PARA QUÉ LOS USAMOS //','Para procesar tus pedidos, acreditar tus puntos y recompensas, prevenir fraude y contactarte sobre el estado de tu pedido.')
    +sec('CON QUIÉN LOS COMPARTIMOS //','No vendemos ni compartimos tus datos con terceros para publicidad. Solo se comparten con los proveedores estrictamente necesarios para operar (pasarela de pago, envío de correos).')
    +sec('TUS DATOS, TU DECISIÓN //','Puedes eliminar tu cuenta permanentemente desde tu perfil en cualquier momento — esto borra tus datos personales, favoritos, direcciones y crédito. Conservamos el historial de ventas ya anonimizado, sin tu nombre ni datos de contacto, para las cifras del negocio.')
    +sec('CONTACTO //','¿Preguntas sobre tus datos o tu pedido? Escríbenos por WhatsApp desde el botón de soporte, o a '+BIZ_EMAIL+'.')
    +'</div>';
}
// Identificación del proveedor — se repite al inicio de Términos, Cambios/Devoluciones
// y el Libro de Reclamaciones porque cada una de esas páginas debe poder leerse por sí
// sola (un consumidor puede llegar directo a cualquiera de ellas desde el pie del home).
function providerBlockHTML(){
  return'<div style="background:#1A3028;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px;margin-bottom:20px;font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;line-height:1.9">'
    +'<div><span style="color:'+GOLD+'">Proveedor · </span>'+esc(BIZ_NAME)+'</div>'
    +'<div><span style="color:'+GOLD+'">RUC · </span>'+BIZ_RUC+'</div>'
    +'<div><span style="color:'+GOLD+'">Cobertura · </span>Delivery en '+BIZ_CITY+' (sin local de atención al público)</div>'
    +'<div><span style="color:'+GOLD+'">Contacto · </span>'+BIZ_EMAIL+' · WhatsApp +51 930 957 640</div>'
    +'</div>';
}

// CAMBIOS Y DEVOLUCIONES — al ser comida preparada al momento y perecible no aplica un
// reembolso general como en retail, pero sí una política clara de reposición si el pedido
// llega mal. ⚠️ Revisa estos plazos/condiciones con el negocio real antes de operar.
function sPReturns(){
  var bk=(bkTo||(cust?'p_profile':'o_home'));bkTo=null;
  return H('CAMBIOS Y DEVOLUCIONES',"sc='"+bk+"';render()")+'<div style="flex:1;padding:24px 20px 40px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:22px;font-weight:900;color:#fff;margin-bottom:4px">CAMBIOS<span style="color:'+GOLD+'"> // </span>Y DEVOLUCIONES</div>'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0;margin-bottom:20px">Última actualización: 2026</div>'
    +providerBlockHTML()
    +sec('POR QUÉ NO HAY DEVOLUCIÓN GENERAL //','Nuestros productos son alimentos preparados al momento y perecibles: una vez entregado el pedido, no aceptamos devoluciones de dinero por simple arrepentimiento, tal como establece el Código de Protección y Defensa del Consumidor para este tipo de bienes.')
    +sec('SI TU PEDIDO LLEGÓ MAL //','Si el pedido llega incompleto, con un ingrediente distinto al pedido, o en mal estado, repórtalo dentro de las 2 horas siguientes a la entrega por WhatsApp (con foto si es posible) o desde el Libro de Reclamaciones. Verificado el problema, te ofrecemos —a tu elección— reposición sin costo, crédito interno equivalente en la app, o reembolso por el mismo medio de pago.')
    +sec('CANCELACIONES //','Puedes cancelar sin costo antes de que la cocina empiece a preparar tu pedido. Una vez iniciada la preparación, ya no se puede cancelar ni reembolsar.')
    +sec('TIEMPOS DE REEMBOLSO //','Cuando corresponde reembolso por el medio de pago original (tarjeta vía Culqi, Yape o Plin), el abono puede demorar entre 3 y 10 días hábiles según el operador financiero — nosotros lo iniciamos apenas se aprueba el caso.')
    +sec('CONTACTO //','Escríbenos por WhatsApp desde el botón de soporte, o a '+BIZ_EMAIL+'.')
    +'</div>';
}

// LIBRO DE RECLAMACIONES VIRTUAL — exigido por el Código de Protección y Defensa del
// Consumidor (D.S. 011-2011-PCM y modificatorias). Debe ser propio del sitio (no un
// formulario externo ni un Drive), identificar al proveedor, y entregar un código de
// reclamo al consumidor. Accesible SIN cuenta — cualquiera debe poder reclamar.
function sPComplaints(){
  var bk=(bkTo||(cust?'p_profile':'o_home'));bkTo=null;
  if(cmplStep==='success')return sComplaintsSuccess(bk);
  var kindToggle='<div style="display:flex;background:#2D5246;border-radius:10px;padding:4px;margin-bottom:20px">'+[['reclamo','RECLAMO'],['queja','QUEJA']].map(function(x){return'<button onclick="cmplKind=\''+x[0]+'\';render()" style="all:unset;cursor:pointer;flex:1;background:'+(cmplKind===x[0]?GOLD:'transparent')+';color:'+(cmplKind===x[0]?'#fff':'#555')+';font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;letter-spacing:.1em;padding:11px 0;border-radius:8px;text-align:center;transition:all .15s">'+x[1]+'</button>';}).join('')+'</div>';
  var kindHint='<p style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0;line-height:1.5;margin-bottom:20px">'+(cmplKind==='queja'?'Queja: malestar o disconformidad no relacionada directamente a un pedido (ej. atención, demoras).':'Reclamo: disconformidad relacionada a un producto o servicio que contrataste con nosotros.')+'</p>';
  var minorBlock='<label style="display:flex;align-items:center;gap:8px;font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin:6px 0 10px"><input type="checkbox" id="cq-minor" onchange="cmplMinor=this.checked;render()" '+(cmplMinor?'checked':'')+' style="accent-color:'+GOLD+'">Soy menor de edad (o reclamo en representación de uno)</label>'
    +(cmplMinor?INP('cq-guardian','NOMBRE DEL PADRE, MADRE O APODERADO','text'):'');
  var ta=function(id,ph){return'<textarea id="'+id+'" placeholder="'+ph+'" style="background:#2D5246;border:1px solid #0d0d0d;border-radius:10px;padding:14px 16px;color:#FFFFFF;width:100%;font-size:14px;font-family:Barlow,sans-serif;min-height:90px;box-sizing:border-box"></textarea>';};
  return H('LIBRO DE RECLAMACIONES',"sc='"+bk+"';render()")+'<div style="flex:1;padding:24px 20px 40px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:22px;font-weight:900;color:#fff;margin-bottom:4px">LIBRO DE<span style="color:'+GOLD+'"> // </span>RECLAMACIONES</div>'
    +'<p style="font-family:\'Barlow\',sans-serif;font-size:11px;color:#A8C8B0;line-height:1.6;margin-bottom:16px">Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, este establecimiento cuenta con un Libro de Reclamaciones a tu disposición.</p>'
    +providerBlockHTML()
    +kindToggle+kindHint
    +'<div style="display:flex;flex-direction:column;gap:10px">'
    +ST('01','TUS DATOS','')
    +INP('cq-name','NOMBRES Y APELLIDOS','text')
    +INP('cq-dni','DNI / CARNET DE EXTRANJERÍA','text')
    +INP('cq-addr','DOMICILIO','text')
    +INP('cq-phone','TELÉFONO','tel')
    +INP('cq-email','CORREO ELECTRÓNICO','email')
    +minorBlock
    +'</div>'
    +'<div style="height:1px;background:#1E3932;margin:20px 0"></div>'
    +ST('02','EL '+(cmplKind==='queja'?'MALESTAR':'PEDIDO'),'')
    +'<div style="display:flex;flex-direction:column;gap:10px">'
    +INP('cq-ref','REFERENCIA DEL PEDIDO // opcional (ej: SND-1234)','text')
    +INP('cq-amount','MONTO RECLAMADO // S/, opcional','number')
    +ta('cq-detail','Describe lo que pasó, con el mayor detalle posible')
    +ta('cq-request','¿Qué solicitas? (ej: reposición, reembolso, respuesta)')
    +'</div>'
    +'<div id="cq-err" style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#ff5555;min-height:16px;margin-top:14px">'+esc(cmplErr)+'</div>'
    +BTN(cmplBusy?'ENVIANDO...':'ENVIAR '+(cmplKind==='queja'?'QUEJA':'RECLAMO')+' //',cmplBusy?'':'doSubmitComplaint()')
    +'<p style="font-family:\'Barlow\',sans-serif;font-size:10px;color:#A8C8B0;line-height:1.5;margin-top:14px">Tenemos hasta 30 días calendario para responder tu reclamo o queja, conforme a la normativa vigente.</p>'
    +'</div>';
}
function sComplaintsSuccess(bk){
  return H('LIBRO DE RECLAMACIONES',"sc='"+bk+"';render()")+'<div style="flex:1;padding:24px 20px 40px;overflow-y:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center" class="fi">'
    +'<div style="font-size:44px;margin-bottom:16px">✓</div>'
    +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:20px;font-weight:900;color:#fff;margin-bottom:8px">'+(cmplKind==='queja'?'QUEJA':'RECLAMO')+' REGISTRAD'+(cmplKind==='queja'?'A':'O')+'</div>'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:6px">TU CÓDIGO //</div>'
    +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:32px;font-weight:900;color:'+GOLD+';margin-bottom:20px">'+esc(cmplCode||'')+'</div>'
    +'<p style="font-family:\'Barlow\',sans-serif;font-size:13px;color:#A8C8B0;line-height:1.6;max-width:320px">Te enviamos una copia a tu correo. Responderemos dentro de los 30 días calendario siguientes, conforme a ley.</p>'
    +'<div style="margin-top:24px;width:100%;max-width:280px">'+BTN('VOLVER AL INICIO //','sc=\'o_home\';cmplStep=\'form\';render()')+'</div>'
    +'</div>';
}
async function doSubmitComplaint(){
  var g=function(id){var el=(document.getElementById(id) as HTMLInputElement | null);return el?el.value.trim():'';};
  var name=g('cq-name'),dni=g('cq-dni'),addr=g('cq-addr'),phone=g('cq-phone'),email=g('cq-email'),guardian=g('cq-guardian');
  var ref=g('cq-ref'),amount=g('cq-amount'),detail=g('cq-detail'),request=g('cq-request');
  if(!name||!dni||!addr||!phone||!email||!detail||!request){cmplErr='Completa todos los campos obligatorios.';render();return;}
  if(!/^[^@]+@[^@]+\.[^@]+$/.test(email)){cmplErr='Ingresa un correo válido.';render();return;}
  if(cmplMinor&&!guardian){cmplErr='Ingresa el nombre del padre, madre o apoderado.';render();return;}
  cmplErr='';cmplBusy=true;render();
  try{
    var res=await api('submit-complaint',{kind:cmplKind,consumerName:name,consumerDni:dni,consumerAddress:addr,consumerPhone:phone,consumerEmail:email,isMinor:cmplMinor,guardianName:guardian,orderRef:ref,claimedAmount:amount?Number(amount):null,detail:detail,consumerRequest:request});
    cmplCode=res.claimCode;cmplBusy=false;cmplStep='success';render();
  }catch(e){cmplErr=e.message;cmplBusy=false;render();}
}

// FAVORITOS
async function loadFavorites(){
  sc='p_favorites';busy=true;busyMsg='Cargando favoritos...';render();
  try{myFavorites=(await api('favorites-list',{token:token})).favorites;}catch(e){myFavorites=[];}
  busy=false;render();
}
function sPFavorites(){
  var h=H('MIS FAVORITOS',"sc='p_home';render()")+'<div style="flex:1;padding:20px 20px 100px;overflow-y:auto" class="fi">';
  if(!myFavorites.length){
    h+='<div style="text-align:center;padding-top:64px"><div style="margin-bottom:12px;opacity:.5;display:flex;justify-content:center">'+icon('heart',32,'#A8C8B0')+'</div><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:'+GOLD+';letter-spacing:.2em">SIN FAVORITOS //</div><p style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-top:10px">Guarda un build desde la pantalla de confirmación de tu pedido.</p></div>';
  }else{
    h+=myFavorites.map(function(f){
      return'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:12px;padding:16px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-family:Barlow Condensed,sans-serif;font-size:17px;font-weight:700;color:#FFFFFF">'+esc(f.name)+'</span><button onclick="doDeleteFavorite(\''+f.id+'\')" style="all:unset;cursor:pointer;color:#ff8888;font-family:Share Tech Mono,monospace;font-size:10px">ELIMINAR</button></div><button onclick="loadBuild('+JSON.stringify(f.build).replace(/"/g,'&quot;')+')" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#fff;font-family:Barlow Condensed,sans-serif;font-size:13px;font-weight:700;letter-spacing:.08em;padding:11px;border-radius:8px;text-align:center">PEDIR ESTE //</button></div>';
    }).join('');
  }
  h+='</div>'+NAV();
  return h;
}
async function doDeleteFavorite(id){
  if(!(await showConfirm('¿Eliminar este favorito?')))return;
  // Optimista: se quita de la lista al instante en vez de esperar la respuesta del
  // servidor Y encima recargar toda la lista de nuevo — si el borrado falla, se
  // reinserta en su posición original y se avisa con un toast.
  var idx=myFavorites.findIndex(function(f){return f.id==id;});
  var removed=idx>=0?myFavorites.splice(idx,1)[0]:null;
  render();
  try{
    await api('favorites-delete',{token:token,id:id});
  }catch(e){
    if(removed)myFavorites.splice(idx,0,removed);
    render();
    showToast(e.message);
  }
}

// DIRECCIONES
async function loadAddresses(){
  sc='p_addresses';busy=true;busyMsg='Cargando direcciones...';render();
  try{myAddresses=(await api('addresses-list',{token:token})).addresses;}catch(e){myAddresses=[];}
  busy=false;render();
}
function sPAddresses(){
  var h=H('MIS DIRECCIONES',"sc='p_home';render()")+'<div style="flex:1;padding:20px 20px 100px;overflow-y:auto" class="fi">';
  if(myAddresses.length){
    h+=myAddresses.map(function(a){
      return'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:Barlow Condensed,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF">'+esc(a.label)+'</div><div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-top:2px">'+esc(a.address)+'</div></div><button onclick="doDeleteAddress(\''+a.id+'\')" style="all:unset;cursor:pointer;color:#ff8888;font-family:Share Tech Mono,monospace;font-size:10px;flex-shrink:0;margin-left:10px">ELIMINAR</button></div>';
    }).join('');
  }else{
    h+='<div style="text-align:center;padding-top:40px;margin-bottom:20px"><div style="margin-bottom:12px;opacity:.5;display:flex;justify-content:center">'+icon('direccion',32,'#A8C8B0')+'</div><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:'+GOLD+';letter-spacing:.2em">SIN DIRECCIONES GUARDADAS //</div></div>';
  }
  h+='<div style="margin-top:20px;background:#1A3028;border:1px solid #3A6B58;border-radius:10px;padding:16px"><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:10px">AGREGAR DIRECCIÓN //</div><div style="display:flex;flex-direction:column;gap:8px">'+INP('na-label','NOMBRE // Casa, Trabajo...')+INP('na-addr','DIRECCIÓN COMPLETA')+'<div id="na-msg" style="font-family:Barlow,sans-serif;font-size:11px;color:#ff5555;min-height:14px">'+newAddrMsg+'</div>'+BTN('GUARDAR DIRECCIÓN //','doAddAddress()')+'</div></div>';
  h+='</div>'+NAV();
  return h;
}
async function doAddAddress(){
  var label=gv('na-label').trim();
  var addr=gv('na-addr').trim();
  if(!label||!addr){newAddrMsg='Completa nombre y dirección.';render();return;}
  try{
    await api('addresses-add',{token:token,label:label,address:addr});
    newAddrMsg='';
    await loadAddresses();
  }catch(e){newAddrMsg=e.message;render();}
}
async function doDeleteAddress(id){
  if(!(await showConfirm('¿Eliminar esta dirección?')))return;
  var idx=myAddresses.findIndex(function(a){return a.id==id;});
  var removed=idx>=0?myAddresses.splice(idx,1)[0]:null;
  render();
  try{
    await api('addresses-delete',{token:token,id:id});
  }catch(e){
    if(removed)myAddresses.splice(idx,0,removed);
    render();
    showToast(e.message);
  }
}
async function doLogoutEverywhere(){
  if(!(await showConfirm('Esto cerrará tu sesión aquí y en cualquier otro dispositivo donde hayas iniciado sesión. ¿Continuar?')))return;
  busy=true;busyMsg='Cerrando sesiones...';render();
  try{await api('logout-everywhere',{token:token});}catch(e){}
  busy=false;doLogout();
}

// Antes no existía ningún camino para que un cliente pidiera borrar su cuenta — solo un
// borrado manual del dueño en la base de datos. Pide el PIN de nuevo (no solo el token de
// sesión) para que un dispositivo desbloqueado/token filtrado no baste para esta acción.
async function doDeleteAccount(){
  if(!(await showConfirm('Esto eliminará tu cuenta de forma permanente: pierdes tus puntos, crédito, direcciones y favoritos guardados. Tu historial de pedidos se conserva para el negocio, pero sin tu nombre ni datos de contacto. Esta acción NO se puede deshacer.\n\n¿Continuar?')))return;
  var pin=await showPrompt('Ingresa tu PIN para confirmar:','','tel');
  if(!pin)return;
  busy=true;busyMsg='Eliminando cuenta...';render();
  try{
    await api('delete-account',{token:token,pin:pin});
  }catch(e){
    busy=false;render();
    showToast('No se pudo eliminar la cuenta: '+e.message);
    return;
  }
  busy=false;
  showToast('Tu cuenta fue eliminada.','success');
  doLogout();
}

async function loadAdmin(){
  sc='admin_home';busy=true;busyMsg='Cargando...';render();
  var done=false;
  var timer=setTimeout(function(){if(!done){done=true;busy=false;render();}},8000);
  try{var r=await api('admin-orders',{token:token});adminOrders=r.orders;adminOrdersTruncated=!!r.truncated;lastPollCount=adminOrders.length;}
  catch(e){adminOrders=[];}
  busy=false;startPoll();render();
}

// Extraído a partir de un objeto de pedido directo (no solo por id en adminOrders) para
// poder reusarse también desde resultados de búsqueda (sc='admin_search', ver #95), que
// no viven en adminOrders.
// contact_phone es el teléfono que el cliente escribió en ESTE pedido — antes solo se
// usaba customer_phone (el de la cuenta), así que un pedido de invitado nunca mostraba
// este botón, dejando al operador sin forma de escribirle por WhatsApp.
function waAdminOrder(o){
  var phone=o&&(o.contact_phone||o.customer_phone);
  if(!phone)return;
  var msg='Hola '+o.customer_name+'! Tu pedido '+o.ref+' de SND//WCH está: '+o.status+'.';
  if(o.status==='PREPARANDO')msg+=' Lo estamos preparando ahora mismo.';
  if(o.status==='EN CAMINO')msg+=' Ya va en camino a tu dirección'+(o.eta_minutes?' (ETA ~'+o.eta_minutes+' min)':'')+'.';
  msg+=' ¡Gracias por tu pedido!';
  window.open('https://wa.me/51'+phone.replace(/\D/g,'').replace(/^51/,'')+'?text='+encodeURIComponent(msg),'_blank');
}
function waAdmin(ordId){
  waAdminOrder((adminOrders||[]).find(function(x){return x.id===ordId;}));
}
async function updateStatus(ordId,newSt){
  var ord=(adminOrders||[]).find(function(o){return o.id===ordId;});
  var eta=null;
  if(newSt==='EN CAMINO'){
    var etaStr=await showPrompt('¿Tiempo estimado de entrega en minutos?','20','number');
    if(etaStr===null)return; // admin canceló
    eta=parseInt(etaStr,10);
    if(!eta||eta<=0)eta=20;
  }
  try{
    var r=await api('admin-update-status',{token:token,orderId:ordId,status:newSt,etaMinutes:eta});
    adminOrders=adminOrders.map(function(o){return o.id===ordId?r.order:o;});
    if(newSt==='ENTREGADO')adminOrders=adminOrders.filter(function(o){return o.id!==ordId;});
    render();
  }catch(e){console.warn(e);return;}
  if(ord&&ord.customer_email){
    notifyOrderEmail(ord.customer_email,ord.customer_name,ord.ref,newSt,eta);
  }
}
// El operador revisa su propia app de Yape/Plin y confirma aquí que el dinero llegó —
// recién entonces el pedido puede avanzar de RECIBIDO (el servidor también lo exige).
async function confirmOrderPayment(ordId){
  try{
    var r=await api('admin-confirm-payment',{token:token,orderId:ordId});
    adminOrders=adminOrders.map(function(o){return o.id===ordId?r.order:o;});
    render();
  }catch(e){showToast(e.message);}
}
// Antes confirmar el pago y pasar a preparación eran 2 taps separados (confirmar, luego
// tocar de nuevo "MARCAR COMO PREPARANDO") — en la inmensa mayoría de los casos el
// operador hace ambas cosas seguidas apenas ve el dinero en su app (hallazgo de la
// re-auditoría del panel admin). confirmOrderPayment sigue disponible aparte para el
// caso raro en que quiera confirmar el pago sin arrancar cocina todavía.
async function confirmAndAdvance(ordId){
  try{
    await api('admin-confirm-payment',{token:token,orderId:ordId});
    var r=await api('admin-update-status',{token:token,orderId:ordId,status:'PREPARANDO'});
    adminOrders=adminOrders.map(function(o){return o.id===ordId?r.order:o;});
    render();
  }catch(e){showToast(e.message);}
}
// Etiqueta compacta del método de pago una vez confirmado — antes una vez pagado el
// pedido no mostraba de ninguna forma CÓMO se pagó (solo se veía mientras estaba
// pendiente de confirmar), así que el operador no podía distinguir de un vistazo un
// pedido pagado con tarjeta de uno pagado con crédito o recompensa (hallazgo de la
// re-auditoría del panel admin).
var PAYMENT_METHOD_BADGE={
  culqi:'💳 TARJETA',
  credit:'💰 CRÉDITO',
  reward:'🎁 RECOMPENSA',
  yape:'✅ YAPE/PLIN',
  plin:'✅ YAPE/PLIN',
  cod:'💵 CONTRA ENTREGA',
};
// Cancela un pedido — libera el stock reservado (ver actAdminCancelOrder). Antes esto
// solo funcionaba para pedidos nunca pagados (Yape/Plin sin confirmar); un pedido ya
// pagado con tarjeta/crédito no se podía cancelar en la app aunque, por ejemplo, se
// acabara un ingrediente a media preparación (hallazgo de la auditoría de flujo de
// pedidos) — ahora sí, pero con una advertencia aparte de que el reembolso se coordina
// manualmente (esta acción no toca Culqi ni el saldo de crédito).
async function cancelOrder(ordId){
  var ord=(adminOrders||[]).find(function(o){return o.id===ordId;});
  var wasPaid=ord&&ord.payment_status==='paid';
  var msg=wasPaid
    ?'¿Cancelar este pedido? YA FUE PAGADO — tendrás que coordinar el reembolso tú mismo (Culqi/Yape/Plin/crédito), esto solo libera el stock reservado.'
    :'¿Cancelar este pedido? Se asume que el cliente nunca transfirió. Esto libera el stock reservado.';
  if(!(await showConfirm(msg)))return;
  // Motivo opcional — no bloquea la cancelación si se deja vacío, solo alimenta el
  // resumen semanal ("3 cancelaciones esta semana por falta de stock") en vez de dejarlo
  // como un número suelto sin explicación.
  var reason=await showPrompt('¿Por qué se cancela? (opcional, ayuda al resumen semanal)','');
  try{
    var r=await api('admin-cancel-order',{token:token,orderId:ordId,acknowledgeRefund:true,reason:reason||''});
    adminOrders=adminOrders.filter(function(o){return o.id!==ordId;});
    render();
  }catch(e){showToast(e.message);}
}
function toggleBulkSelect(ordId){
  if(bulkSelected[ordId])delete bulkSelected[ordId];else bulkSelected[ordId]=true;
  render();
}
// Confirma el pago Yape/Plin de todos los pedidos seleccionados que lo tengan pendiente
// de un solo tap — antes había que confirmar uno por uno (ver confirmOrderPayment),
// friccioso durante una tanda de varios pedidos simultáneos en hora pico (hallazgo de la
// auditoría del panel admin).
async function bulkConfirmPayments(){
  var ids=Object.keys(bulkSelected).filter(function(k){return bulkSelected[k];});
  var targets=ids.filter(function(id){
    var o=(adminOrders||[]).find(function(x){return x.id===id;});
    return o&&(o.payment_method==='yape'||o.payment_method==='plin')&&o.payment_status!=='paid';
  });
  if(!targets.length){showToast('Ningún pedido seleccionado tiene un pago pendiente de confirmar.');return;}
  if(!(await showConfirm('¿Confirmar el pago de '+targets.length+' pedido(s)?')))return;
  busy=true;busyMsg='Confirmando pagos...';render();
  var okCount=0,failCount=0;
  for(var i=0;i<targets.length;i++){
    try{
      var r=await api('admin-confirm-payment',{token:token,orderId:targets[i]});
      adminOrders=adminOrders.map(function(o){return o.id===targets[i]?r.order:o;});
      okCount++;
    }catch(e){failCount++;}
  }
  bulkSelected={};
  busy=false;
  if(failCount)showToast(okCount+' confirmado(s), '+failCount+' fallaron.');
  render();
}
// Avanza todos los pedidos seleccionados al mismo estado de un solo tap (ver #113 y
// actAdminBulkUpdateStatus) — cada pedido se procesa por separado en el servidor, así que
// un pago Yape/Plin sin confirmar en uno de ellos no bloquea al resto del lote.
async function bulkAdvanceStatus(status){
  var ids=Object.keys(bulkSelected).filter(function(k){return bulkSelected[k];});
  if(!ids.length)return;
  if(!(await showConfirm('¿Marcar '+ids.length+' pedido(s) como '+status+'?')))return;
  busy=true;busyMsg='Actualizando pedidos...';render();
  try{
    var r=await api('admin-bulk-update-status',{token:token,orderIds:ids,status:status});
    var updatedIds={};
    (r.updated||[]).forEach(function(o){updatedIds[o.id]=o;});
    adminOrders=adminOrders.map(function(o){return updatedIds[o.id]?updatedIds[o.id]:o;});
    if(status==='ENTREGADO')adminOrders=adminOrders.filter(function(o){return !updatedIds[o.id];});
    bulkSelected={};
    if(r.failed&&r.failed.length)showToast(r.failed.length+' pedido(s) no se pudieron actualizar.');
  }catch(e){showToast('Error: '+e.message);}
  busy=false;render();
}
// Ticket de cocina imprimible (#114) — abre una ventana aparte con solo lo que cocina
// necesita ver (sin datos de cliente/entrega que no aportan al armado del pedido) y
// dispara el diálogo de impresión del navegador directamente.
function printTicket(ordId){
  var o=(adminOrders||[]).find(function(x){return x.id===ordId;});
  if(!o)return;
  var items=Array.isArray(o.items)&&o.items.length
    ?o.items.map(function(it){return'<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #000"><span>'+(it.qty||1)+'x '+esc(it.label||it.sigId||it.prot||it.code||'ítem')+(it.note?' ('+esc(it.note)+')':'')+'</span></div>';}).join('')
    :'<div style="padding:4px 0">'+esc(o.summary||'')+'</div>';
  var html='<!doctype html><html><head><meta charset="utf-8"><title>Ticket '+esc(o.ref)+'</title>'
    +'<style>body{font-family:monospace;width:280px;margin:0 auto;padding:16px;color:#000}h1{font-size:16px;margin:0 0 4px}.hr{border-top:1px dashed #000;margin:8px 0}</style></head><body>'
    +'<h1>SND//WCH — COCINA</h1><div>REF: '+esc(o.ref)+'</div><div>'+esc(o.date||'')+'</div><div class="hr"></div>'
    +items
    +'<div class="hr"></div>'+(o.notes?'<div><b>NOTA:</b> '+esc(o.notes)+'</div>':'')
    // customer_rank se guarda en el pedido al momento de crearse (ver finalizeAndInsertOrder/
    // orders.ts) — solo para los 2 rangos más altos vale la pena un toque especial en
    // cocina; para el resto no aporta nada que el operador necesite ver.
    +((o.customer_rank==='CÍRCULO INTERNO'||o.customer_rank==='MESA FUNDADORA')?'<div class="hr"></div><div>🌟 Cliente '+esc(o.customer_rank)+' — '+esc(o.customer_name||'')+'. ¡Gracias por su preferencia!</div>':'')
    +'<script>window.onload=function(){window.print();}<\/script></body></html>';
  var w=window.open('','_blank','width=340,height=600');
  if(!w){showToast('El navegador bloqueó la ventana de impresión.');return;}
  w.document.write(html);
  w.document.close();
}
async function notifyOrderEmail(to,name,ref,status,eta){
  try{
    var resp=await fetch(EMAIL_FN_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({to:to,customerName:name,orderRef:ref,status:status,etaMinutes:eta})
    });
    var data=await resp.json().catch(function(){return{};});
    if(!resp.ok||!data.success){console.warn('Email no enviado:',data.error||data);}
  }catch(e){console.warn('Error enviando correo:',e);}
}

// ADMIN HOME
// Barra flotante de acciones en lote (#113) — aparece solo cuando hay pedidos
// seleccionados; deja avanzar varios a la vez al mismo estado en un solo tap.
function bulkBar(){
  var ids=Object.keys(bulkSelected).filter(function(k){return bulkSelected[k];});
  if(!ids.length)return'';
  var n=ids.length;
  // Antes cada botón medía ~10px de padding vertical (~34px de alto total) y el botón de
  // cerrar apenas 4px de padding horizontal sin alto fijo — por debajo del mínimo táctil
  // recomendado (~44px), justo en la barra que se usa a las apuradas en hora pico
  // (hallazgo de la re-auditoría del panel admin). Ahora los 4 botones de acción miden
  // ~44px de alto y el botón de cerrar es un cuadrado de 40x40 en vez de un ícono suelto.
  return'<div style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(11,11,11,.97);border-top:1px solid #0B0B0B;padding:12px 16px;display:flex;gap:6px;align-items:center;z-index:110">'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:'+GOLD+';flex-shrink:0">'+n+' sel.</div>'
    +'<button onclick="bulkConfirmPayments()" style="all:unset;box-sizing:border-box;cursor:pointer;flex:1;text-align:center;background:#ffa500;color:#0d0d0d;font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;padding:15px 4px;border-radius:8px">✅ PAGO</button>'
    +'<button onclick="bulkAdvanceStatus(\'PREPARANDO\')" style="all:unset;box-sizing:border-box;cursor:pointer;flex:1;text-align:center;background:'+STATUSES.PREPARANDO.c+';color:#fff;font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;padding:15px 4px;border-radius:8px">PREPARANDO</button>'
    +'<button onclick="bulkAdvanceStatus(\'EN CAMINO\')" style="all:unset;box-sizing:border-box;cursor:pointer;flex:1;text-align:center;background:'+STATUSES['EN CAMINO'].c+';color:#fff;font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;padding:15px 4px;border-radius:8px">EN CAMINO</button>'
    +'<button onclick="bulkAdvanceStatus(\'ENTREGADO\')" style="all:unset;box-sizing:border-box;cursor:pointer;flex:1;text-align:center;background:'+STATUSES.ENTREGADO.c+';color:#fff;font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;padding:15px 4px;border-radius:8px">ENTREGADO</button>'
    +'<button onclick="bulkSelected={};render()" style="all:unset;box-sizing:border-box;cursor:pointer;color:#ff8888;font-family:\'Barlow Condensed\',sans-serif;font-size:18px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0">✕</button>'
    +'</div>';
}
// Íconos de línea minimalistas — mismo trazo/estilo que el ícono de Instagram del pie
// de página (stroke currentColor, sin relleno), en vez de emoji grandes y de colores
// dispares que no calzan con la estética tipográfica del resto de la app. Nació para el
// grid de herramientas del panel admin; el set se reutiliza también en pantallas de
// cliente (estados vacíos, carrito, insignias) para no mezclar dos lenguajes visuales.
var ICONS={
  clientes:'<circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-4 3.5-6.5 7-6.5S19 16 19 20"/>',
  buscar:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.3 15.3 21 21"/>',
  reportes:'<path d="M5 20V13M12 20V8M19 20v-6"/>',
  estrella:'<path d="M12 3.5l2.47 5.18 5.53.63-4.1 3.86 1.1 5.58L12 15.9l-4.99 2.85 1.1-5.58-4.1-3.86 5.53-.63L12 3.5z"/>',
  reclamo:'<rect x="6" y="4" width="12" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 11h6M9 15h6"/>',
  inventario:'<path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  precios:'<path d="M20 12.5 12.5 20 4 11.5V4h7.5L20 12.5z"/><circle cx="8" cy="8" r="1.2"/>',
  horario:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  puntos:'<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
  admins:'<path d="M12 3 19 6v5.5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z"/>',
  auditoria:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  sonido:'<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 8a5 5 0 0 1 0 8"/>',
  notif:'<path d="M12 3a5 5 0 0 0-5 5v3.5L5 15h14l-2-3.5V8a5 5 0 0 0-5-5z"/><path d="M9.5 18a2.5 2.5 0 0 0 5 0"/>',
  prep:'<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/><path d="M9 12h6M9 16h4"/>',
  franjas:'<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16v-7M16 16v-2"/>',
  direccion:'<path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.3"/>',
  cart:'<path d="M4 5h2l2.3 11.4A2 2 0 0 0 10.3 18h7.4a2 2 0 0 0 2-1.6L21 9H7.2"/><circle cx="10.5" cy="20.5" r="1.3"/><circle cx="17.5" cy="20.5" r="1.3"/>',
  device:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 19h2"/>',
  heart:'<path d="M12 20s-6.8-4.3-9-8.4C1.2 8.4 2.8 5 6.2 5c2 0 3.4 1.2 5.8 4 2.4-2.8 3.8-4 5.8-4 3.4 0 5 3.4 3.2 6.6C18.8 15.7 12 20 12 20z"/>',
  gift:'<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M4 13h16M12 9v11"/><path d="M12 9C10 5 6 5.3 6 7.5S9 9 12 9zM12 9c2-4 6-3.7 6-1.5S15 9 12 9z"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
  chat:'<path d="M4 18.5 5.2 15A8 8 0 1 1 8.6 18l-4.6.5z"/><path d="M8.5 10h7M8.5 13h4.5"/>',
  sandwich:'<path d="M4 11a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2"/><path d="M3 11h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2z"/><path d="M4 15.5h16"/><path d="M8 7c.7-1.3 1.9-2 4-2s3.3.7 4 2"/>',
  flame:'<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-2.3 1.5-3.7 1.9-5.8.2 1 1 1.6 1 1.6C8 7.3 9.7 4.7 12 3c-.6 3 .9 4 2.4 6 1 1.3 2.1 2.8 2.1 4.7 0 3.6-2.1 7.3-6.5 7.3z"/><path d="M12 21c1.8 0 3.2-1.2 3.2-3 0-1.4-.9-2.2-.9-3.4"/>',
  crown:'<path d="M4.5 17h15l-1.4-7.5-3.6 3.2L12 6.5 9.5 12.7l-3.6-3.2L4.5 17z"/><path d="M5 20h14"/>',
  compass:'<circle cx="12" cy="12" r="8.5"/><path d="M15.2 8.8 13 13l-4.2 2.2L11 11z"/>',
  trophy:'<path d="M8 4h8v3.5a4 4 0 0 1-8 0V4z"/><path d="M8 5H5.2a3 3 0 0 0 3 5.2M16 5h2.8a3 3 0 0 1-3 5.2"/><path d="M12 11.5V15M9 19.5h6l-.6-2.7H9.6L9 19.5z"/>',
  dumbbell:'<rect x="2" y="9.5" width="3" height="5" rx="1"/><rect x="19" y="9.5" width="3" height="5" rx="1"/><path d="M7 12h10"/><rect x="5" y="7.5" width="2" height="9" rx="1"/><rect x="17" y="7.5" width="2" height="9" rx="1"/>',
  chili:'<path d="M8 5.2c3-1.4 5.3.8 5.3 3 0 2-1.3 3-1.3 5 0 4-2.8 6.8-5.5 6.8-2.8 0-4-3-2-6 1-1.4 1.8-2 1.8-4 0-2-1-3.4 1.7-4.8z"/><path d="M8 5.2c-.9-1-1-2.4 0-3.4"/>',
  camera:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.5-2.5h5L16 7"/><circle cx="12" cy="13.5" r="3.5"/>',
  lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  moto:'<circle cx="6.5" cy="18" r="2.3"/><circle cx="17" cy="18" r="2.3"/><path d="M8.5 18h6l2-5.5h3M14 12.5l-2-4H8l-1 3"/><path d="M6.5 15.5h3"/>',
  check:'<path d="M4 12.5l5 5L20 6"/>',
  megaphone:'<path d="M3 10v4h3l7 4V6l-7 4H3z"/><path d="M13 8.5a4 4 0 0 1 0 7"/><path d="M16 6a7 7 0 0 1 0 12"/>',
};
function icon(name,size?,color?){return'<svg width="'+(size||18)+'" height="'+(size||18)+'" viewBox="0 0 24 24" fill="none" stroke="'+(color||GOLD)+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">'+(ICONS[name]||'')+'</svg>';}
function minutesAgo(iso){
  if(!iso)return null;
  var t=new Date(iso).getTime();
  if(!t)return null;
  return Math.max(0,Math.round((Date.now()-t)/60000));
}
// Prioridad de triage: pago manual sin confirmar > RECIBIDO > PREPARANDO > EN CAMINO —
// antes la cola ordenaba solo por más reciente, así que un pedido viejo esperando podía
// quedar enterrado bajo pedidos nuevos ya en camino durante una hora pico (hallazgo de la
// auditoría del panel admin).
function orderPriority(o){
  if((o.payment_method==='yape'||o.payment_method==='plin')&&o.payment_status!=='paid')return 0;
  if(o.status==='RECIBIDO')return 1;
  if(o.status==='PREPARANDO')return 2;
  if(o.status==='EN CAMINO')return 3;
  return 4;
}
// La referencia de urgencia de un pedido "para más tarde" es su hora programada, no la
// hora en que se creó — antes el triage y el aviso de "atascado" leían siempre created_at,
// así que un pedido programado para las 8pm creado a las 9am se veía tan urgente/viejo
// como uno inmediato apenas pasaban 10 min desde que se creó (hallazgo de la re-auditoría
// del panel admin: scheduled_for existe en la fila pero la cola nunca lo miraba).
function orderDueTime(o){
  return o.scheduled_for||o.created_at;
}
function sAdminHome(){
  // Dentro de cada nivel de prioridad, el que antes vence primero (el que lleva más
  // tiempo esperando, o el programado más próximo).
  var ao=(adminOrders||[]).slice().sort(function(a,b){
    var pa=orderPriority(a),pb=orderPriority(b);
    if(pa!==pb)return pa-pb;
    return new Date(orderDueTime(a)||0).getTime()-new Date(orderDueTime(b)||0).getTime();
  });
  var badge=ao.length;
  return'<div style="min-height:100vh;display:flex;flex-direction:column;background:#1E3932">'
    +'<div style="padding:20px 20px 16px;border-bottom:1px solid #3A6B58;display:flex;justify-content:space-between;align-items:center">'
    +'<div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:24px;font-weight:900;color:#FFFFFF">PANEL<span style="color:'+GOLD+'"> // </span>OPERADOR</div>'
    +(badge>0?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#ffa500;letter-spacing:.1em;margin-top:3px" class="pulse">● '+badge+' ACCIÓN REQUERIDA</div>':'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#A8C8B0;margin-top:3px">todo en orden //</div>')
    +'</div><button onclick="loadAdmin()" title="Actualizar ahora" style="all:unset;cursor:pointer;font-size:16px;margin-right:14px">🔄</button>'
    +'<button onclick="toggleAdminLight()" title="Modo claro/oscuro" style="all:unset;cursor:pointer;font-size:16px;margin-right:14px">'+(adminLightMode?'🌙':'☀️')+'</button>'
    +'<button onclick="stopPoll();sc=\'o_home\';tab=\'order\';render()" style="all:unset;cursor:pointer;font-family:\'Barlow\',sans-serif;font-size:12px;color:'+GOLD+'">← salir</button></div>'
    +(adminOrdersTruncated?'<div style="background:rgba(255,165,0,.12);border-bottom:1px solid rgba(255,165,0,.3);padding:8px 20px;font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#ffa500">⚠ Hay más pedidos activos de los que se muestran aquí (solo los '+ao.length+' más recientes).</div>':'')
    // Antes un poll fallido quedaba en silencio total — el operador podía estar viendo
    // un estado desactualizado sin ninguna señal de que la actualización automática dejó
    // de funcionar.
    +(pollFailing?'<div style="background:rgba(255,85,85,.12);border-bottom:1px solid rgba(255,85,85,.3);padding:8px 20px;font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#ff8888">⚠ No se pudo actualizar la cola de pedidos — reintentando…</div>':'')
    +'<div style="flex:1;padding:20px;overflow-y:auto" class="fi">'

    +'<div onclick="loadDashboard()" style="background:linear-gradient(135deg,#1a1200,#0d0d0d);border:1px solid rgba(245,197,24,.35);border-radius:12px;padding:18px;margin-bottom:18px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">'
    +'<div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:20px;font-weight:900;color:#F5C518">PANEL<span style="color:#fff"> // </span>DE NEGOCIO</div><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#a08010;letter-spacing:.1em;margin-top:2px">ventas · productos top · clientes · puntos</div></div>'
    +'<span style="font-family:\'Share Tech Mono\',monospace;font-size:12px;color:#F5C518">VER →</span></div>'

    // Active orders
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">PEDIDOS ACTIVOS // '+(ao.length||'ninguno')+'</div>'
    +(ao.length?ao.map(function(o){
      var s=STATUSES[o.status]||STATUSES['RECIBIDO'];
      var manualPending=(o.payment_method==='yape'||o.payment_method==='plin')&&o.payment_status!=='paid';
      // El checkout ya no obliga al cliente a declarar Yape vs Plin por separado (ambos
      // muestran el mismo número) — la etiqueta aquí es genérica a propósito, incluso
      // para pedidos viejos que sí guardaron 'plin' literal antes de este cambio.
      var manualLabel='YAPE/PLIN';
      var checked=!!bulkSelected[o.id];
      // "Hace X min" + borde rojo pulsante pasados 10 min sin arrancar — antes la única
      // pista de cuánto llevaba esperando un pedido era leer la hora absoluta y restarla
      // mentalmente (hallazgo de la auditoría del panel admin: fácil pasar por alto el
      // más viejo durante una hora pico). El aviso de atascado usa minsDue (minutos desde
      // que el pedido DEBÍA empezar, es decir desde scheduled_for si lo tiene) para que un
      // pedido programado para más tarde no se marque "atascado" mientras aún falta para
      // su hora — "hace X min" en la tarjeta sigue mostrando el tiempo desde que se creó,
      // que es la info que le interesa al operador.
      var mins=minutesAgo(o.created_at);
      var minsDue=minutesAgo(orderDueTime(o));
      var isScheduledAhead=o.scheduled_for&&new Date(o.scheduled_for).getTime()>Date.now();
      var isStale=(o.status==='RECIBIDO'||manualPending)&&!isScheduledAhead&&minsDue!==null&&minsDue>=10;
      return'<div style="background:#2D5246;border:1px solid '+(isStale?'#ff5555':(o.status==='RECIBIDO'?'rgba(255,165,0,.3)':'#1c1c1c'))+';border-radius:10px;padding:16px;margin-bottom:12px'+(isStale?'" class="pulse':'')+'">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'
        +'<div style="display:flex;gap:10px;flex:1">'
        +'<input type="checkbox" onchange="toggleBulkSelect(\''+o.id+'\')" '+(checked?'checked':'')+' style="margin-top:3px;width:18px;height:18px;flex-shrink:0;accent-color:'+GOLD+'">'
        +'<div style="flex:1"><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:17px;font-weight:700;color:#FFFFFF">'+esc(o.customer_name)+'</div>'
        +'<div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-top:2px">'+esc(o.customer_address)+'</div>'
        +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+(isStale?'#ff8888':'#A8C8B0')+';margin-top:4px">'+esc(o.ref)+' · '+SOLES+o.total+' · '+esc(o.date)+(mins!==null?' · hace '+mins+' min':'')+'</div>'
        +(isScheduledAhead?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#3A86FF;margin-top:2px">🕒 programado para '+esc(new Date(o.scheduled_for).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}))+'</div>':'')
        // Antes la ETA que el operador ingresaba al marcar "EN CAMINO" quedaba guardada
        // (eta_minutes) pero nunca se mostraba de vuelta en su propia cola — solo el
        // cliente la ve (ver el mensaje de WhatsApp) (hallazgo de la re-auditoría del
        // panel admin: el operador no tenía forma de recordar qué ETA le prometió a cada
        // cliente sin abrir el detalle del pedido).
        +(o.status==='EN CAMINO'&&o.eta_minutes?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#3A86FF;margin-top:2px">🛵 ETA ~'+o.eta_minutes+' min</div>':'')+'</div></div>'
        +stBadge(o.status)+'</div>'
        +'<div style="font-family:\'Barlow\',sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:12px">'+esc(o.summary)+'</div>'
        +(o.redeemed_reward?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#25D366;margin-bottom:10px">🎁 '+esc(o.redeemed_reward)+'</div>':'')
        +(o.payment_method==='cod'&&o.payment_status!=='paid'?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#ffa500;margin-bottom:10px">💵 COBRAR '+SOLES+o.total+' AL ENTREGAR</div>':'')
        +(manualPending?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#ffa500;margin-bottom:8px">⚠ PAGO '+manualLabel+' SIN CONFIRMAR — revisa tu app antes de continuar</div>':'')
        +(o.payment_status==='paid'&&PAYMENT_METHOD_BADGE[o.payment_method]?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#8BAF9A;margin-bottom:10px">'+PAYMENT_METHOD_BADGE[o.payment_method]+'</div>':'')
        // Imprimir/WhatsApp son acciones secundarias (se usan, pero no en cada pedido) —
        // antes ocupaban una fila completa cada una, alargando la tarjeta innecesariamente.
        // Una fila de 2 columnas compactas deja la acción principal (avanzar estado) como
        // lo único que realmente domina visualmente la tarjeta.
        +'<div style="display:flex;gap:8px;margin-bottom:8px">'
        +'<button onclick="printTicket(\''+o.id+'\')" style="all:unset;cursor:pointer;flex:1;text-align:center;background:rgba(139,175,154,.12);border:1px solid rgba(139,175,154,.4);color:#A8C8B0;font-family:\'Barlow Condensed\',sans-serif;font-size:11px;font-weight:700;letter-spacing:.04em;padding:9px 4px;border-radius:8px">🖨️ TICKET</button>'
        +((o.contact_phone||o.customer_phone)?'<button onclick="waAdmin(\''+o.id+'\')" style="all:unset;cursor:pointer;flex:1;text-align:center;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:'+GOLD+';font-family:\'Barlow Condensed\',sans-serif;font-size:11px;font-weight:700;letter-spacing:.04em;padding:9px 4px;border-radius:8px">💬 WHATSAPP</button>':'')
        +'</div>'
        +(manualPending
          ?'<button onclick="confirmAndAdvance(\''+o.id+'\')" style="all:unset;cursor:pointer;display:block;width:100%;background:#ffa500;color:#0d0d0d;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;padding:11px 0;border-radius:8px;text-align:center;margin-bottom:6px">✅ CONFIRMAR PAGO Y PREPARAR</button>'
            +'<button onclick="confirmOrderPayment(\''+o.id+'\')" style="all:unset;cursor:pointer;display:block;width:100%;text-align:center;color:#8BAF9A;font-family:\'Barlow\',sans-serif;font-size:10px;padding:6px 0;margin-bottom:8px">solo confirmar el pago, sin avanzar todavía</button>'
          :(s.next?'<button onclick="updateStatus(\''+o.id+'\',\''+s.next+'\')" style="all:unset;cursor:pointer;display:block;width:100%;background:'+STATUSES[s.next].c+';color:#FFFFFF;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;padding:11px 0;border-radius:8px;text-align:center">'+(STATUSES[s.next].icon?STATUSES[s.next].icon+' ':'')+'MARCAR COMO '+s.next+' →</button>':'<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#25D366;text-align:center;padding:8px">✅ COMPLETADO</div>'))
        // Antes este botón solo aparecía para pagos manuales sin confirmar — un pedido ya
        // pagado con tarjeta/crédito no tenía NINGUNA forma de cancelarse en la app
        // (hallazgo de la auditoría de flujo de pedidos: sin esto, si se acaba un
        // ingrediente a media preparación, el operador queda sin opciones).
        +'<button onclick="cancelOrder(\''+o.id+'\')" style="all:unset;cursor:pointer;display:block;width:100%;background:transparent;border:1px solid rgba(255,85,85,.4);color:#ff8888;font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;letter-spacing:.06em;padding:9px 0;border-radius:8px;text-align:center">✕ CANCELAR PEDIDO'+(manualPending?' (nunca pagó)':'')+'</button>'
        +'</div>';
    }).join(''):'<div style="background:#2D5246;border:1px solid #2D5246;border-radius:10px;padding:24px 20px;text-align:center;margin-bottom:8px"><div style="font-size:28px;margin-bottom:8px">✅</div><div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#A8C8B0">SIN PEDIDOS ACTIVOS //</div></div>')

    +'<div style="height:1px;background:#1E3932;margin:16px 0"></div>'

    // Antes esto era una lista plana de 11 filas idénticas sin agrupar ni con íconos —
    // costaba escanear rápido cuál botón era cuál en medio de un turno con pedidos activos.
    // Agrupado por qué tan seguido se usa cada herramienta, con un ícono por fila para
    // reconocerla de un vistazo (mismo criterio que ya usan las tarjetas del perfil de
    // cliente: 🔔 push, 💌 referidos, 💳 crédito).
    +[
      ['CLIENTES Y VENTAS //',[
        ['clientes','CLIENTES','sc=\'admin_customer\';custDetail=null;custDetailPhone=\'\';custDetailErr=\'\';render()'],
        ['buscar','BUSCAR PEDIDOS','sc=\'admin_search\';searchResults=null;render()'],
        ['reportes','REPORTES','sc=\'admin_report\';reportData=null;render()'],
        ['estrella','CALIFICACIONES','loadRatingsList()'],
        ['reclamo','RECLAMACIONES','loadAdminComplaints()'],
      ]],
      ['MARKETING //',[
        ['megaphone','CONTENIDO SEMANAL','loadMarketingContent()'],
      ]],
      ['CATÁLOGO //',[
        ['inventario','INVENTARIO','loadInventory()'],
        ['precios','PRECIOS','loadAdminCatalog()'],
        ['horario','HORARIO','loadStoreHoursForm()'],
      ]],
      ['CUENTA //',[
        ['puntos','PUNTOS MANUALES','sc=\'admin_gen\';agPhone=\'\';agPts=\'\';agMsg=\'\';render()'],
        ['admins','ADMINISTRADORES','loadAdminMgr()'],
        ['auditoria','AUDITORÍA','loadAuditLog()'],
      ]],
      ['COCINA Y OPERACIÓN //',[
        ['prep','PREPARACIÓN','loadPrepList()'],
        ['franjas','FRANJAS HORARIAS','loadTimeWindowReport()'],
        ['direccion','DIRECCIONES','loadProblemAddresses()'],
      ]],
    ].map(function(section: any){
      return'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:18px 0 10px">'+section[0]+'</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
        +section[1].map(function(x){return'<div onclick="'+x[2]+'" style="background:#2D5246;border:1px solid #1c1c1c;border-radius:10px;padding:14px 12px;cursor:pointer;text-align:center"><div style="width:36px;height:36px;border-radius:50%;background:#1A3028;border:1px solid #3A6B58;display:flex;align-items:center;justify-content:center;margin:0 auto 8px">'+icon(x[0])+'</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;color:'+GOLD+';letter-spacing:.03em">'+x[1]+'</div></div>';}).join('')
        +'</div>';
    }).join('')
    +(!cust||!('serviceWorker' in navigator)||!('PushManager' in window)?'':'<div onclick="togglePushNotifications()" style="margin-top:18px;background:#2D5246;border:1px solid '+(pushSubscribed?GOLD:'#1c1c1c')+';border-radius:10px;padding:12px 16px;cursor:pointer"><div style="display:flex;justify-content:space-between;align-items:center"><span style="display:inline-flex;align-items:center;gap:8px;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#A8C8B0">'+icon('notif')+'ALERTAS DE PEDIDOS Y STOCK</span><span style="font-family:\'Share Tech Mono\',monospace;font-size:14px;color:'+(pushSubscribed?GOLD:'#A8C8B0')+'">'+(pushSubscribed?'✓ ACTIVO':'○ ACTIVAR')+'</span></div>'+(pushMsg?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:'+GOLD+';margin-top:6px">'+esc(pushMsg)+'</div>':'')+'</div>')
    +'<div style="margin-top:18px;background:#2D5246;border:1px solid #1c1c1c;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center"><span style="display:inline-flex;align-items:center;gap:8px;font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#A8C8B0">'+icon('sonido')+'SONIDO DE NUEVO PEDIDO</span>'
    +'<select onchange="setNotifSound(this.value)" style="background:#1E3932;color:#FFFFFF;border:1px solid #3A6B58;border-radius:6px;padding:6px 8px;font-family:\'Share Tech Mono\',monospace;font-size:10px">'
    +['campana','timbre','grave'].map(function(p){return'<option value="'+p+'" '+(notifSoundPreset===p?'selected':'')+'>'+p+'</option>';}).join('')
    +'</select></div>'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#222;text-align:center;margin-top:6px">Auto-actualiza cada 25 seg · Sonido al recibir pedido</div>'
    +'</div>'
    +bulkBar()
    +'</div>';
}

// ADMIN DASHBOARD — vista de negocio (ventas, productos, clientes, puntos)
async function loadDashboard(){
  sc='admin_dashboard';busy=true;busyMsg='Calculando métricas...';render();
  try{
    var results=await Promise.all([api('dashboard-stats',{token:token}),api('admin-at-risk-customers',{token:token})]);
    dashStats=results[0];atRiskCustomers=results[1].customers;
  }catch(e){dashStats=null;atRiskCustomers=null;}
  busy=false;render();
}
function waRiskContact(phone,name){
  var msg='Hola '+name+'! Somos de SND//WCH — te extrañamos por acá, ¿todo bien? Cuando quieras tu Signature de siempre, ahí estamos.';
  window.open('https://wa.me/51'+String(phone).replace(/\D/g,'').replace(/^51/,'')+'?text='+encodeURIComponent(msg),'_blank');
}
function DTILE(label,big,sub?){
  return'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:12px;padding:14px 16px"><div style="font-family:Share Tech Mono,monospace;font-size:8px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:6px">'+label+'</div><div style="font-family:Barlow Condensed,sans-serif;font-size:26px;font-weight:900;color:#FFFFFF;line-height:1">'+big+'</div>'+(sub?'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0;margin-top:4px">'+sub+'</div>':'')+'</div>';
}
function DBAR(label,value,max,color?){
  var pct=max>0?Math.min(100,Math.round((value/max)*100)):0;
  return'<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-family:Barlow,sans-serif;font-size:12px;color:#F2F0EB">'+label+'</span><span style="font-family:Share Tech Mono,monospace;font-size:11px;color:'+(color||GOLD)+'">'+value+'</span></div><div style="background:#1E3932;border-radius:4px;height:8px;overflow:hidden"><div style="background:'+(color||GOLD)+';height:100%;width:'+pct+'%;border-radius:4px"></div></div></div>';
}
function sAdminDashboard(){
  var h=H('PANEL DE NEGOCIO',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  if(!dashStats){
    h+='<div style="text-align:center;padding-top:64px"><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#ff8888;letter-spacing:.2em">NO SE PUDO CARGAR //</div></div>'+BTN('REINTENTAR //','loadDashboard()');
    return h+'</div>';
  }
  var d=dashStats;
  // Alertas
  var alerts=[];
  if(d.pendingPayment>0)alerts.push(d.pendingPayment+' pedido(s) sin pago confirmado (posible prueba o error de checkout)');
  if(d.outOfStock&&d.outOfStock.length)alerts.push(d.outOfStock.length+' producto(s) sin stock: '+d.outOfStock.map(function(o){return o.product_name||o.product_code;}).join(', '));
  if(d.lowStock&&d.lowStock.length)alerts.push('Stock bajo: '+d.lowStock.map(function(o){return(o.product_name||o.product_code)+' ('+o.stock_qty+')';}).join(', '));
  if(d.trendTruncated)alerts.push('Hay tantos pedidos en el período reciente que la tendencia y los productos top de abajo no cubren todo el rango esperado.');
  if(alerts.length){
    h+='<div style="background:rgba(255,165,0,.1);border:1px solid rgba(255,165,0,.3);border-radius:10px;padding:14px 16px;margin-bottom:18px">'
      +'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#ffa500;letter-spacing:.15em;margin-bottom:6px">ALERTAS //</div>'
      +alerts.map(function(a){return'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#F2F0EB;margin-bottom:4px">⚠ '+esc(a)+'</div>';}).join('')
      +'</div>';
  }
  // Ventas
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px;font-weight:700">VENTAS //</div>';
  // Antes había que comparar los números a mano contra la semana/mes pasado — el dato
  // del período anterior ya se calcula en el servidor, esto solo arma el "+X% vs antes".
  function deltaTxt(pct){
    if(pct==null)return'';
    var arrow=pct>0?'▲':pct<0?'▼':'●';
    var color=pct>0?'#25D366':pct<0?'#ff8888':'#A8C8B0';
    return' · <span style="color:'+color+'">'+arrow+' '+(pct>0?'+':'')+pct+'% vs. antes</span>';
  }
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">'
    +DTILE('HOY',SOLES+d.revenue.today.revenue,d.revenue.today.count+' pedidos · tkt '+SOLES+d.revenue.today.avgTicket)
    +DTILE('SEMANA',SOLES+d.revenue.week.revenue,d.revenue.week.count+' pedidos · tkt '+SOLES+d.revenue.week.avgTicket+deltaTxt(d.deltas&&d.deltas.weekRevenuePct))
    +DTILE('MES',SOLES+d.revenue.month.revenue,d.revenue.month.count+' pedidos · tkt '+SOLES+d.revenue.month.avgTicket+deltaTxt(d.deltas&&d.deltas.monthRevenuePct))
    +DTILE('TOTAL',SOLES+d.revenue.allTime.revenue,d.revenue.allTime.count+' pedidos · tkt '+SOLES+d.revenue.allTime.avgTicket)
    +'</div>';
  // Ganancia estimada = ingresos × (1 - costo de insumos ~40-50%, ver COGS_LOW/HIGH en
  // admin.ts) — siempre como rango, nunca como cifra exacta, porque no hay costo real
  // por receta en el sistema (solo precio de venta).
  if(d.estimatedProfit){
    h+='<div style="background:rgba(37,211,102,.08);border:1px solid rgba(37,211,102,.25);border-radius:10px;padding:14px 16px;margin-bottom:18px">'
      +'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#25D366;letter-spacing:.15em;margin-bottom:8px">GANANCIA ESTIMADA (rango, no exacta) //</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      +[['HOY',d.estimatedProfit.today],['SEMANA',d.estimatedProfit.week],['MES',d.estimatedProfit.month],['TOTAL',d.estimatedProfit.allTime]].map(function(x){
        return'<div><div style="font-family:Share Tech Mono,monospace;font-size:8px;color:#A8C8B0;letter-spacing:.1em">'+x[0]+'</div><div style="font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:900;color:#25D366">'+SOLES+x[1].low+'–'+SOLES+x[1].high+'</div></div>';
      }).join('')
      +'</div></div>';
  }
  if(d.codPending&&d.codPending.count>0){
    h+='<div style="background:rgba(255,165,0,.08);border:1px solid rgba(255,165,0,.25);border-radius:10px;padding:14px 16px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#ffa500;letter-spacing:.15em">POR COBRAR · CONTRA ENTREGA //</div><div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-top:2px">'+d.codPending.count+' pedido(s) sin cobrar todavía</div></div><div style="font-family:Barlow Condensed,sans-serif;font-size:22px;font-weight:900;color:#ffa500">'+SOLES+d.codPending.total+'</div></div>';
  }
  // Tendencia 14 días
  if(d.trend&&d.trend.length){
    var trMax=Math.max.apply(null,d.trend.map(function(t){return t.revenue;}).concat([1]));
    h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px;font-weight:700">TENDENCIA · 14 DÍAS //</div>';
    h+='<div style="display:flex;gap:3px;align-items:flex-end;height:70px;margin-bottom:6px">'+d.trend.map(function(t){var pct=Math.round((t.revenue/trMax)*100);return'<div style="flex:1;height:100%;display:flex;align-items:flex-end" title="'+t.date+': S/'+t.revenue+'"><div style="width:100%;background:'+(t.revenue>0?GOLD:'#2D5246')+';height:'+Math.max(pct,t.revenue>0?4:2)+'%;border-radius:2px 2px 0 0"></div></div>';}).join('')+'</div>';
    h+='<div style="display:flex;gap:3px;margin-bottom:18px">'+d.trend.map(function(t,i){return'<div style="flex:1;text-align:center;font-family:Share Tech Mono,monospace;font-size:6px;color:#A8C8B0">'+(i%2===0?t.date:'')+'</div>';}).join('')+'</div>';
  }
  // Pedidos por estado
  var stEntries=Object.keys(d.ordersByStatus||{});
  var stMax=Math.max.apply(null,stEntries.map(function(k){return d.ordersByStatus[k];}).concat([1]));
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px;font-weight:700">PEDIDOS POR ESTADO //</div>';
  h+=stEntries.length?stEntries.map(function(k){return DBAR(k,d.ordersByStatus[k],stMax,(STATUSES[k]||{}).c);}).join(''):'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:16px">Sin pedidos todavía.</div>';
  if(d.avgEtaMinutes!=null){
    h+='<div style="margin-top:10px">'+DTILE('TIEMPO ESTIMADO PROMEDIO OFRECIDO',d.avgEtaMinutes+' min','Cuando se marca "EN CAMINO"')+'</div>';
  }
  h+='<div style="height:1px;background:#1E3932;margin:16px 0"></div>';
  // Productos top
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px;font-weight:700">PRODUCTOS MÁS VENDIDOS //</div>';
  if(d.topProducts&&d.topProducts.length){
    var pMax=Math.max.apply(null,d.topProducts.map(function(p){return p.count;}).concat([1]));
    h+=d.topProducts.map(function(p){
      var pct=Math.round((p.count/pMax)*100);
      return'<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-family:Barlow Condensed,sans-serif;font-size:14px;font-weight:700;color:#FFFFFF">'+esc(p.name)+'</span><span style="font-family:Share Tech Mono,monospace;font-size:11px;color:'+GOLD+'">'+p.count+' vendidos · '+SOLES+p.revenue+'</span></div><div style="background:#1E3932;border-radius:4px;height:8px;overflow:hidden"><div style="background:'+GOLD+';height:100%;width:'+pct+'%;border-radius:4px"></div></div></div>';
    }).join('');
  }else{
    h+='<div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:16px">Aún no hay ventas pagadas para rankear productos.</div>';
  }
  h+='<div style="height:1px;background:#1E3932;margin:16px 0"></div>';
  // Clientes
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px;font-weight:700">CLIENTES //</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">'
    +DTILE('TOTAL',d.customers.total)
    +DTILE('RECURRENTES',d.customers.returning,'>1 pedido')
    +DTILE('NUEVOS · SEMANA',d.customers.newThisWeek)
    +DTILE('NUEVOS · MES',d.customers.newThisMonth)
    // ROI del programa de referidos — antes no había ninguna forma de ver si el bono
    // de 50 puntos por referido realmente atrae clientes/ingresos.
    +(d.referrals?DTILE('CLIENTES REFERIDOS',d.referrals.referredCustomers,SOLES+d.referrals.revenue+' en ventas'):'')
    +'</div>';
  if(d.peakHours&&d.peakHours.length){
    var peakTop=d.peakHours.slice().sort(function(a,b){return b.count-a.count;})[0];
    var peakDayNames=['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
    var peakDayTop=d.peakDays&&d.peakDays.length?d.peakDays.slice().sort(function(a,b){return b.count-a.count;})[0]:null;
    h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0;margin-bottom:14px">📈 Hora pico (últimos 90 días): <b style="color:#FFFFFF">'+peakTop.hour+':00-'+(peakTop.hour+1)+':00</b>'+(peakDayTop?' · Día pico: <b style="color:#FFFFFF">'+peakDayNames[peakDayTop.dow]+'</b>':'')+'</div>';
  }
  // Origen de campaña (?src=... en el link del anuncio) — sin esto no hay forma de saber
  // si una campaña paga se está pagando sola. "convertidos" cuenta solo a quien ya hizo al
  // menos un pedido, no solo se registró.
  if(d.bySource&&d.bySource.length){
    h+='<div style="margin-bottom:16px"><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">ORIGEN DE CLIENTES //</div>'
      +d.bySource.map(function(s: any){return'<div style="display:flex;justify-content:space-between;align-items:center;background:#2D5246;border-radius:8px;padding:8px 12px;margin-bottom:6px"><span style="font-family:Barlow,sans-serif;font-size:12px;color:#F2F0EB">'+esc(s.source)+'</span><span style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0">'+s.signups+' registrados · <span style="color:'+GOLD+'">'+s.converted+' pidieron</span></span></div>';}).join('')
      +'</div>';
  }
  var tiers=d.customers.tiers||{};
  // VIP se retiró como tier — ya no hay un multiplicador de puntos distinto por nivel,
  // así que ya no tiene sentido mostrarlo como un bucket aparte en este gráfico.
  var tMax=Math.max(tiers.FREQUENT||0,tiers.REGULAR||0,tiers.MEMBER||0,1);
  h+=DBAR('FREQUENT',tiers.FREQUENT||0,tMax,'#F5C518')+DBAR('REGULAR',tiers.REGULAR||0,tMax,GOLD)+DBAR('MEMBER',tiers.MEMBER||0,tMax,'#A8C8B0');
  h+='<div style="height:1px;background:#1E3932;margin:16px 0"></div>';
  // Clientes en riesgo de fuga — priorizados por días sin pedir Y rango (perder a alguien
  // de MESA FUNDADORA pesa más que perder a alguien NUEVO). No reemplaza los recordatorios
  // automáticos (remind-second-order/remind-high-rank-winback), es para que el dueño
  // decida a quién más vale la pena escribirle personalmente.
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px;font-weight:700">CLIENTES EN RIESGO //</div>';
  if(atRiskCustomers&&atRiskCustomers.length){
    h+=atRiskCustomers.slice(0,10).map(function(c){
      var daysTxt=c.daysSinceLastOrder==null?'nunca pagó un pedido':'hace '+c.daysSinceLastOrder+' días';
      return'<div style="display:flex;justify-content:space-between;align-items:center;background:#2D5246;border:1px solid #3A6B58;border-radius:8px;padding:10px 14px;margin-bottom:8px"><div><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;color:#FFFFFF">'+esc(c.name||c.phone)+'</div><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0;margin-top:2px">'+esc(c.rank)+' · último pedido '+daysTxt+'</div></div><button onclick="waRiskContact(\''+esc(c.phone)+'\',\''+esc(c.name||'')+'\')" style="all:unset;cursor:pointer;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:'+GOLD+';font-family:\'Barlow Condensed\',sans-serif;font-size:11px;font-weight:700;padding:8px 12px;border-radius:8px;flex-shrink:0">💬</button></div>';
    }).join('');
  }else{
    h+='<div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:14px">Sin clientes en riesgo por ahora.</div>';
  }
  h+='<div style="height:1px;background:#1E3932;margin:16px 0"></div>';
  // Puntos
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px;font-weight:700">PUNTOS //</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:8px">'
    +DTILE('EMITIDOS',d.points.issued)
    +DTILE('CANJEADOS',d.points.redeemed)
    +DTILE('EN CIRCULACIÓN',d.points.outstanding)
    +'</div>';
  h+='<div style="height:1px;background:#1E3932;margin:16px 0"></div>';
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px;font-weight:700">EXPORTAR //</div>';
  h+='<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">'
    +'<button onclick="exportCsv(\'export-orders\',\'pedidos\')" style="all:unset;cursor:pointer;background:#2D5246;border:1px solid #3A6B58;color:'+GOLD+';font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;padding:12px;border-radius:8px;text-align:center">EXPORTAR PEDIDOS (CSV) //</button>'
    +'<button onclick="exportCsv(\'export-customers\',\'clientes\')" style="all:unset;cursor:pointer;background:#2D5246;border:1px solid #3A6B58;color:'+GOLD+';font-family:\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:700;padding:12px;border-radius:8px;text-align:center">EXPORTAR CLIENTES (CSV) //</button>'
    +'</div>';
  h+=BTN('ACTUALIZAR //','loadDashboard()',true);
  h+='</div>';
  return h;
}
function toCsv(rows){
  if(!rows||!rows.length)return'';
  var cols=Object.keys(rows[0]);
  function csvEsc(v){if(v==null)return'';var s=String(v);return/[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
  var lines=[cols.join(',')];
  rows.forEach(function(r){lines.push(cols.map(function(c){return csvEsc(r[c]);}).join(','));});
  return lines.join('\n');
}
async function exportCsv(action,filename){
  busy=true;busyMsg='Generando CSV...';render();
  try{
    var r=await api(action,{token:token});
    var rows=r.orders||r.customers||[];
    var csv=toCsv(rows);
    if(!csv){busy=false;render();showToast('No hay datos para exportar.','info');return;}
    var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='sndwch-'+filename+'-'+today().replace(/\//g,'-')+'.csv';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(function(){URL.revokeObjectURL(url);},2000);
    if(r.truncated)showToast('El negocio ya tiene más de '+rows.length+' registros — este CSV solo incluye los más recientes, no todo el historial.','info');
  }catch(e){showToast('Error al exportar: '+e.message);}
  busy=false;render();
}

// ADMIN GEN
function sAdminGen(){return'<div style="min-height:100vh;display:flex;flex-direction:column;background:#1E3932"><div style="padding:20px;border-bottom:1px solid #3A6B58;display:flex;align-items:center;gap:12px"><button onclick="sc=\'admin_home\';render()" style="all:unset;cursor:pointer;color:#A8C8B0;font-family:\'Barlow Condensed\',sans-serif;font-size:18px;font-weight:700;padding:0 12px 0 0">←</button><div style="font-family:\'Barlow Condensed\',sans-serif;font-size:22px;font-weight:900;color:#FFFFFF">PUNTOS<span style="color:'+GOLD+'"> // </span>MANUALES</div></div><div style="flex:1;padding:24px 20px" class="fi"><p style="font-family:\'Barlow\',sans-serif;font-size:14px;color:#A8C8B0;margin-bottom:20px;line-height:1.6">Otorga puntos confirmados directamente a un cliente.</p><div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">'+INP('ag-ph','TELÉFONO DEL CLIENTE // 9XXXXXXXX','tel',agPhone)+INP('ag-pts','PUNTOS A OTORGAR // Ej: 25','number',agPts)+BTN('OTORGAR PUNTOS //','doManualPts()')+'</div><div id="ag-msg" style="font-family:\'Barlow\',sans-serif;font-size:13px;color:'+GOLD+';min-height:20px">'+agMsg+'</div></div></div>';}
async function doManualPts(){
  var ph=gv('ag-ph').trim(),pts=parseInt(gv('ag-pts')||'0');
  agPhone=ph;agPts=String(pts);if(!ph||pts<1){agMsg='Ingresa teléfono y puntos válidos.';render();return;}
  busy=true;busyMsg='Otorgando puntos...';render();
  try{var r=await api('admin-manual-points',{token:token,phone:ph,pts:pts});agMsg='✓ +'+pts+' puntos a '+esc(r.name);if(cust&&cust.phone===ph)cust.points=r.newPoints;}
  catch(e){agMsg='Error: '+e.message;}
  busy=false;render();
}

// RENDER
function setGpsHint(msg,color?){var h=(document.getElementById('gps-hint') as HTMLInputElement | null);if(h)h.innerHTML='<span style="color:'+(color||'#ffa500')+'">'+msg+'</span>';}
function doGPS(){
  var btn=(document.getElementById('gps-btn') as HTMLInputElement | null);
  function done(){if(btn){btn.innerHTML='&#128205;';btn.disabled=false;}}
  function fail(err?){
    done();
    var msg='No pudimos obtener tu ubicación exacta. Arrastra el mapa hasta tu dirección.';
    if(err&&err.code===1)msg='Bloqueaste el permiso de ubicación, o estás dentro de una app como WhatsApp que no deja usar el GPS. Toca los tres puntos → "Abrir en el navegador", o arrastra el mapa manualmente.';
    else if(err&&err.code===2)msg='Tu dispositivo no pudo determinar tu ubicación. Arrastra el mapa hasta tu dirección.';
    else if(err&&err.code===3)msg='La búsqueda de ubicación tardó demasiado. Arrastra el mapa hasta tu dirección.';
    setGpsHint(msg);
    openMap(-8.1120,-79.0290,true);
  }
  if(!navigator.geolocation){fail();return;}
  if(btn){btn.innerHTML='<span class="sp">&#8635;</span>';btn.disabled=true;}
  setGpsHint('Buscando tu ubicación...','#A8C8B0');
  navigator.geolocation.getCurrentPosition(
    function(pos){done();setGpsHint('','#A8C8B0');openMap(pos.coords.latitude,pos.coords.longitude,false);},
    function(err){
      // Un GPS "frío" (primer intento) puede tardar más de lo que da un timeout agresivo.
      // Antes de rendirnos, reintentamos una vez con precisión más baja (mucho más rápida).
      if(err&&err.code===3){
        navigator.geolocation.getCurrentPosition(
          function(pos){done();setGpsHint('','#A8C8B0');openMap(pos.coords.latitude,pos.coords.longitude,false);},
          function(err2){fail(err2);},
          {timeout:8000,enableHighAccuracy:false,maximumAge:120000}
        );
        return;
      }
      fail(err);
    },
    {timeout:15000,enableHighAccuracy:true,maximumAge:60000}
  );
}
var _lmap=null,_mTimer=null;
function loadLeaflet(cb){
  if(window.L){cb();return;}
  // Load CSS
  var lnk=document.createElement('link');
  lnk.rel='stylesheet';
  lnk.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(lnk);
  // Load JS
  var s=document.createElement('script');
  s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  s.onload=cb;
  s.onerror=function(){showToast('No se pudo cargar el mapa. Verifica tu conexión.');};
  document.head.appendChild(s);
}
function openMap(lat,lon,approx){
  var m=(document.getElementById('mmap') as HTMLInputElement | null);
  if(!m)return;
  m.style.display='flex';
  var banner=(document.getElementById('mmap-accuracy-banner') as HTMLInputElement | null);
  if(banner)banner.style.display=approx?'block':'none';
  loadLeaflet(function(){
    setTimeout(function(){
      if(!_lmap){
      _lmap=L.map('lmap',{zoomControl:true,attributionControl:false});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(_lmap);
      _lmap.on('move',function(){var e=(document.getElementById('maddr') as HTMLInputElement | null);if(e)e.textContent='Buscando...';if(_mTimer)clearTimeout(_mTimer);});
      _lmap.on('moveend',function(){var c=_lmap.getCenter();if(_mTimer)clearTimeout(_mTimer);_mTimer=setTimeout(function(){revGeo(c.lat,c.lng);},700);});
    }
    _lmap.setView([lat,lon],17);
    _lmap.invalidateSize();
    revGeo(lat,lon);
    },150);
  }); // end loadLeaflet
}
function revGeo(lat,lon){
  window._mLat=lat;window._mLon=lon;
  // Nominatim for approximate reference only
  var url='https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+lat+'&lon='+lon+'&accept-language=es&zoom=18';
  fetch(url)
    .then(function(r){return r.json();})
    .then(function(d){
      var a=d.address||{};
      var parts=[];
      var road=a.road||a.pedestrian||a.residential||a.suburb||'';
      var nb=a.neighbourhood||a.quarter||a.city_district||'';
      if(road)parts.push(road);
      if(nb&&nb!==road)parts.push(nb);
      var hint=parts.length?parts.join(', '):'';
      window._mHint=hint;
      var h=(document.getElementById('maddr-hint') as HTMLInputElement | null);
      if(h)h.innerHTML=hint?'<span style="color:'+GOLD+'">&#8599; Referencia: </span>'+esc(hint):'';
      // Pre-fill input if empty
      var inp=(document.getElementById('maddr-input') as HTMLInputElement | null);
      if(inp&&!inp.value&&hint)inp.value=hint;
    })
    .catch(function(){
      window._mHint='';
    });
}

function closeMap(){(document.getElementById('mmap') as HTMLInputElement | null).style.display='none';}
function confirmMap(){
  var inp=(document.getElementById('maddr-input') as HTMLInputElement | null);
  var a=inp?inp.value.trim():'';
  if(!a){
    if(inp)inp.style.borderColor='#ff5555';
    setTimeout(function(){if(inp)inp.style.borderColor='#2a2a2a';},1500);
    return;
  }
  if(_lmap){var c=_lmap.getCenter();window._mLat=c.lat;window._mLon=c.lng;}
  closeMap();
  var el=(document.getElementById('o-addr') as HTMLInputElement | null);
  if(el){el.value=a;el.style.borderColor='#3A86FF';el.focus();}
  var h=(document.getElementById('gps-hint') as HTMLInputElement | null);
  if(h)h.innerHTML='<a href="https://maps.google.com/?q='+window._mLat+','+window._mLon+'" target="_blank" style="color:'+GOLD+';font-size:11px;text-decoration:none">&#128205; Ver pin en Google Maps</a>';
  setTimeout(function(){var e=(document.getElementById('o-addr') as HTMLInputElement | null);if(e)e.style.borderColor='#0d0d0d';},3000);
}

// Recordamos qué pantalla se pintó la última vez para distinguir "sigo en la
// misma pantalla, solo cambió algo" (hay que mantener el scroll donde estaba)
// de "el usuario navegó a otra pantalla" (ahí sí corresponde subir al inicio).
// Esto evita el salto visible al tope cada vez que algo se actualiza solo
// (poll del panel admin) o con cada toque al armar un pedido.
var _lastRenderedSc=null;
function render(){
  if(busy){(document.getElementById('app') as HTMLInputElement | null).innerHTML=LOAD(busyMsg);return;}
  var h;
  switch(sc){
    case'o_home':      h=sOHome();break;
    case'o_sig':       h=sOSig();break;
    case'o_build':     h=sOBuild();break;
    case'o_item_confirm':h=sOItemConfirm();break;
    case'o_cart':      h=sOCart();break;
    case'o_sides':     h=sOSides();break;
    case'o_sent':      h=sOSent();break;
    case'p_auth':      h=sPAuth();break;
    case'p_welcome':   h=sWelcome();break;
    case'p_recover':   h=sPRecover();break;
    case'p_legal':     h=sPLegal();break;
    case'p_returns':   h=sPReturns();break;
    case'p_complaints':h=sPComplaints();break;
    case'p_home':      h=sPHome();break;
    case'p_rewards':   h=sPRewards();break;
    case'p_history':   h=sPHistory();break;
    case'p_orders':    h=sPOrders();break;
    case'p_ord_detail':h=sOrdDetail();break;
    case'p_profile':   h=sPProfile();break;
    case'p_favorites': h=sPFavorites();break;
    case'gift_card':   h=sGiftCard();break;
    case'weekly_plan': h=sWeeklyPlan();break;
    case'group_order': h=sGroupOrder();break;
    case'p_addresses': h=sPAddresses();break;
    case'admin_home':  h=sAdminHome();break;
    case'admin_gen':   h=sAdminGen();break;
    case'admin_mgr':   h=sAdminMgr();break;
    case'admin_inventory':h=sAdminInventory();break;
    case'admin_catalog':h=sAdminCatalog();break;
    case'admin_dashboard':h=sAdminDashboard();break;
    case'admin_customer':h=sAdminCustomer();break;
    case'admin_search':h=sAdminSearch();break;
    case'admin_audit': h=sAdminAudit();break;
    case'admin_hours': h=sAdminHours();break;
    case'admin_report':h=sAdminReport();break;
    case'admin_ratings':h=sAdminRatings();break;
    case'admin_complaints':h=sAdminComplaints();break;
    case'admin_prep':h=sAdminPrepList();break;
    case'admin_time_report':h=sAdminTimeReport();break;
    case'admin_problem_addresses':h=sAdminProblemAddresses();break;
    case'admin_marketing':h=sAdminMarketing();break;
    default:           h=sOHome();
  }
  var sameScreen=sc===_lastRenderedSc,scrollY=window.scrollY;
  document.body.classList.toggle('no-fi',sameScreen);
  // Banner único y proactivo en vez de dejar que cada acción falle por separado con su
  // propio mensaje genérico — antes no había ninguna detección de modo sin conexión.
  var offlineBanner=isOffline?'<div style="background:#ffa500;color:#1a1200;text-align:center;padding:6px;font-family:\'Share Tech Mono\',monospace;font-size:10px;letter-spacing:.1em;font-weight:700">⚠ SIN CONEXIÓN — reconectando…</div>':'';
  // Modo claro del panel admin: invertir el filtro CSS de todo el contenedor en vez de
  // reescribir cada color hardcodeado (ver comentario en la declaración de adminLightMode).
  var adminLight=sc.indexOf('admin')===0&&adminLightMode;
  (document.getElementById('app') as HTMLInputElement | null).innerHTML='<div style="min-height:100vh;display:flex;flex-direction:column;background:#1E3932'+(adminLight?';filter:invert(1) hue-rotate(180deg)':'')+'">'+offlineBanner+h+'</div>';
  window.scrollTo(0,sameScreen?scrollY:0);
  _lastRenderedSc=sc;
  if(sc==='p_auth')mountGoogleButton();
  renderOverlays();
}


// INVENTORY
var INV_CATS=[
  {t:'PANES',arr:BASES},
  {t:'PROTEÍNAS',arr:PROTS},
  {t:'TOPPINGS',arr:TOPS},
  {t:'QUESOS',arr:CHEESE},
  {t:'SALSAS',arr:SAUCES}
];
var invQty={};
async function loadInvBackground(){
  try{
    var rows=await sbG('inventory','select=product_code,in_stock,stock_qty');
    invStock={};invQty={};
    rows.forEach(function(r){invStock[r.product_code]=r.in_stock;invQty[r.product_code]=r.stock_qty;});
  }catch(e){}
}
// Precios vigentes desde el panel admin (tabla catalog_prices vía get-catalog) — antes
// cambiar un precio requería editar el número hardcodeado aquí Y redesplegar el sitio.
// Muta PROTS/SIGS/SIDES/RWDS en el sitio en vez de cambiar cómo se leen en el resto del
// archivo, así el resto del pricing/checkout sigue funcionando igual.
async function loadCatalogBackground(){
  try{
    var r=await api('get-catalog',{});
    PROTS.forEach(function(p){var v=r.proteins&&r.proteins[p.id];if(v){p.p15=v.p15;p.p30=v.p30;p.pDbl=v.pDbl;}});
    SIGS.forEach(function(s){var v=r.sigs&&r.sigs[s.id];if(v){s.p15=v.p15;s.p30=v.p30;}});
    SIDES.forEach(function(d){var v=r.sides&&r.sides[d.id];if(typeof v==='number')d.p=v;});
    RWDS.forEach(function(rw){var v=r.rewardPts&&r.rewardPts[rw.id];if(typeof v==='number')rw.pts=v;});
  }catch(e){}
}
// Horario vigente desde el panel admin (tabla store_hours vía get-store-hours) — antes
// STORE_HOURS quedaba hardcodeado arriba y nunca se actualizaba con lo que el dueño
// guardaba en "Admin: editable store hours", así que el badge ABIERTO/CERRADO y la
// validación de "pedir para más tarde" seguían mostrando el horario placeholder aunque
// el horario real ya hubiera cambiado en la base de datos.
async function loadStoreHoursBackground(){
  try{
    var r=await api('get-store-hours',{});
    if(Array.isArray(r.hours)&&r.hours.length===7){
      STORE_HOURS=r.hours.map(function(d){return d.closed?null:[d.open,d.close];});
    }
  }catch(e){}
}
async function loadInventory(){
  sc='admin_inventory';busy=true;busyMsg='Cargando inventario...';render();
  try{
    var rows=await sbG('inventory','select=product_code,in_stock,stock_qty');
    invStock={};invQty={};
    rows.forEach(function(r){invStock[r.product_code]=r.in_stock;invQty[r.product_code]=r.stock_qty;});
  }catch(e){}
  busy=false;render();
}
async function toggleStock(code,name){
  var cur=invStock[code]!==false;
  var goingTo=!cur;
  var msg=goingTo
    ?'¿Confirmas que "'+name+'" vuelve a estar DISPONIBLE?'
    :'¿Confirmas marcar "'+name+'" como SIN STOCK? No se podrá elegir en pedidos hasta que lo reactives.';
  if(!(await showConfirm(msg)))return;
  busy=true;busyMsg='Actualizando...';render();
  try{
    await api('admin-inventory-toggle',{token:token,code:code,name:name,inStock:goingTo});
    invStock[code]=goingTo;
  }catch(e){showToast('Error al actualizar: '+e.message);}
  busy=false;render();
}
async function setStock(code,name){
  var el=(document.getElementById('qty-'+code) as HTMLInputElement | null);
  var raw=el?el.value.trim():'';
  var qty=raw===''?null:parseInt(raw,10);
  busy=true;busyMsg='Guardando stock...';render();
  try{
    await api('admin-inventory-set-stock',{token:token,code:code,name:name,qty:qty});
    invQty[code]=qty;
    if(qty!=null)invStock[code]=qty>0;
  }catch(e){showToast('Error al actualizar: '+e.message);}
  busy=false;render();
}
function sAdminInventory(){
  var h=H('INVENTARIO',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:6px">CONTROL DE STOCK //</div>';
  h+='<div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:20px;line-height:1.5">Un producto "sin stock" desaparece de las opciones del cliente hasta que lo reactives. Si además le pones una cantidad, se descuenta sola con cada venta y se marca "sin stock" automáticamente al llegar a 0 — deja el campo vacío para volver al control manual.</div>';
  INV_CATS.forEach(function(cat){
    h+='<div style="font-family:Barlow Condensed,sans-serif;font-size:18px;font-weight:900;color:#FFFFFF;margin:18px 0 10px">'+cat.t+'<span style="color:'+GOLD+'"> //</span></div>';
    h+=cat.arr.map(function(item){
      var name=item.l+(item.s&&item.s!=='//'?' // '+item.s:'');
      var av=invStock[item.id]!==false;
      var qty=invQty[item.id];
      var tracked=qty!=null;
      return'<div style="background:'+(av?'#2D5246':'#1A2420')+';border:1px solid '+(av?'#3A6B58':'rgba(255,85,85,.3)')+';border-radius:10px;padding:13px 16px;margin-bottom:8px">'
        +'<div style="display:flex;justify-content:space-between;align-items:center">'
        +'<div><div style="font-family:Barlow Condensed,sans-serif;font-size:15px;font-weight:700;color:'+(av?'#FFFFFF':'#A8C8B0')+'">'+name+'</div>'
        +'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+(av?'#25D366':'#ff8888')+';margin-top:2px;letter-spacing:.1em">'+(av?'● DISPONIBLE':'● SIN STOCK')+(tracked?' · '+qty+' unid.':'')+'</div></div>'
        +'<button onclick="toggleStock(\''+item.id+'\',\''+name.replace(/'/g,"\\'")+'\')" style="all:unset;cursor:pointer;background:'+(av?'rgba(255,85,85,.12)':'rgba(37,211,102,.15)')+';border:1px solid '+(av?'rgba(255,85,85,.4)':'rgba(37,211,102,.4)')+';color:'+(av?'#ff8888':'#25D366')+';font-family:Barlow Condensed,sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;padding:9px 14px;border-radius:8px;text-align:center;flex-shrink:0">'+(av?'MARCAR AGOTADO':'REACTIVAR')+'</button>'
        +'</div>'
        +'<div style="display:flex;gap:8px;margin-top:10px;align-items:center">'
        +'<input id="qty-'+item.id+'" type="number" min="0" placeholder="Sin rastreo de cantidad" value="'+(tracked?qty:'')+'" style="flex:1;background:#1A3028;border:1px solid #3A6B58;border-radius:8px;padding:9px 12px;color:#FFFFFF;font-size:16px;font-family:Share Tech Mono,monospace">'
        +'<button onclick="setStock(\''+item.id+'\',\''+name.replace(/'/g,"\\'")+'\')" style="all:unset;cursor:pointer;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:'+GOLD+';font-family:Barlow Condensed,sans-serif;font-size:11px;font-weight:700;padding:9px 14px;border-radius:8px;flex-shrink:0">GUARDAR STOCK</button>'
        +'</div>'
        +'</div>';
    }).join('');
  });
  h+='</div>';
  return h;
}

var _adminList=[];
async function loadAdminMgr(){sc='admin_mgr';busy=true;busyMsg='Cargando...';render();try{var r=await api('admin-accounts-list',{token:token});_adminList=r.accounts;}catch(e){_adminList=[];}busy=false;render();}
async function addAdmin(){
  var ph=(document.getElementById('aa-ph') as HTMLInputElement | null)&&gv('aa-ph').trim();
  var nm=(document.getElementById('aa-nm') as HTMLInputElement | null)&&gv('aa-nm').trim();
  if(!ph||!nm){showToast('Ingresa nombre y teléfono.');return;}
  try{
    await api('admin-accounts-add',{token:token,phone:ph,name:nm});
    await loadAdminMgr();
  }catch(e){showToast('Error: '+e.message);}
}
async function delAdmin(ph){
  if(!(await showConfirm('¿Eliminar admin '+ph+'?')))return;
  try{await api('admin-accounts-delete',{token:token,phone:ph});await loadAdminMgr();}catch(e){showToast('Error: '+e.message);}
}
function sAdminMgr(){
  return H('ADMINISTRADORES',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">'
    +'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:14px">CUENTAS ADMIN // '+_adminList.length+'</div>'
    +_adminList.map(function(a){var sp=a.role==='superadmin';return'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:Barlow Condensed,sans-serif;font-size:17px;font-weight:700;color:#FFFFFF">'+esc(a.name)+'</div><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0;margin-top:2px">'+esc(a.phone)+' · '+(sp?'SUPERADMIN':'admin')+'</div></div>'+(sp?'<span style="font-family:Share Tech Mono,monospace;font-size:8px;color:#F5C518">PRINCIPAL</span>':'<button onclick="delAdmin(\''+a.phone+'\')" style="all:unset;cursor:pointer;font-family:Barlow Condensed,sans-serif;font-size:12px;font-weight:700;color:#ff5555">ELIMINAR</button>')+'</div>';}).join('')
    +'<div style="height:1px;background:#1E3932;margin:16px 0"></div>'
    +'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">AGREGAR ADMIN //</div>'
    +'<div style="display:flex;flex-direction:column;gap:10px">'
    +INP('aa-nm','NOMBRE DEL NUEVO ADMIN')
    +INP('aa-ph','TELÉFONO','tel')
    +BTN('AGREGAR //','addAdmin()')
    +'</div></div>';
}

// PRECIOS — edita el catálogo (proteínas, signatures, bebidas/sides, recompensas) sin
// necesitar un redeploy: guarda en la tabla catalog_prices vía admin-catalog-set-price,
// que el resto de la app ya lee en cada acción sensible al precio (ver loadCatalogPrices
// del lado servidor).
var catalogMsg='';
async function loadAdminCatalog(){
  sc='admin_catalog';busy=true;busyMsg='Cargando precios...';render();
  await loadCatalogBackground();
  busy=false;render();
}
function cpNumField(id,label,val){
  return'<div style="flex:1;min-width:64px"><div style="font-family:\'Share Tech Mono\',monospace;font-size:8px;color:#A8C8B0;margin-bottom:4px">'+label+'</div><input id="'+id+'" type="number" step="0.1" value="'+val+'" style="background:#1E3932;border:1px solid #0d0d0d;border-radius:8px;padding:8px 10px;color:#FFFFFF;width:100%;font-size:13px;box-sizing:border-box"></div>';
}
function cpRow(label,inputsHtml,fn){
  return'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px;margin-bottom:10px">'
    +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;margin-bottom:10px">'+esc(label)+'</div>'
    +'<div style="display:flex;gap:8px;align-items:flex-end">'+inputsHtml
    +'<button onclick="'+fn+'" style="all:unset;cursor:pointer;background:'+GOLD+';color:#fff;font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;padding:9px 14px;border-radius:8px;white-space:nowrap">GUARDAR</button></div></div>';
}
function sAdminCatalog(){
  return H('PRECIOS // CATÁLOGO',"sc='admin_home';render()")
    +'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">'
    +(catalogMsg?'<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#25D366;margin-bottom:14px;text-align:center">'+esc(catalogMsg)+'</div>':'')
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">PROTEÍNAS //</div>'
    +PROTS.map(function(p){
      return cpRow(p.l+' '+p.s,
        cpNumField('cp-protein-'+p.id+'-p15','15CM',p.p15)+cpNumField('cp-protein-'+p.id+'-p30','30CM',p.p30)+cpNumField('cp-protein-'+p.id+'-pDbl','DOBLE +',p.pDbl),
        "saveCatalogPrice('protein','"+p.id+"')");
    }).join('')
    +'<div style="height:1px;background:#1E3932;margin:16px 0"></div>'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">SIGNATURES //</div>'
    +SIGS.map(function(s){
      return cpRow(s.n+' '+s.s,
        cpNumField('cp-sig-'+s.id+'-p15','15CM',s.p15)+cpNumField('cp-sig-'+s.id+'-p30','30CM',s.p30),
        "saveCatalogPrice('sig','"+s.id+"')");
    }).join('')
    +'<div style="height:1px;background:#1E3932;margin:16px 0"></div>'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">BEBIDAS Y SIDES //</div>'
    +SIDES.map(function(d){
      return cpRow(d.l+' '+d.s,
        cpNumField('cp-side-'+d.id+'-price','PRECIO',d.p),
        "saveCatalogPrice('side','"+d.id+"')");
    }).join('')
    +'<div style="height:1px;background:#1E3932;margin:16px 0"></div>'
    +'<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">RECOMPENSAS // puntos</div>'
    +RWDS.map(function(rw){
      return cpRow(rw.n+' '+rw.s,
        cpNumField('cp-reward-'+rw.id+'-pts','PUNTOS',rw.pts),
        "saveCatalogPrice('reward','"+rw.id+"')");
    }).join('')
    +'</div>';
}
async function saveCatalogPrice(category,code){
  var values;
  if(category==='protein'){
    values={p15:Number(gv('cp-protein-'+code+'-p15')),p30:Number(gv('cp-protein-'+code+'-p30')),pDbl:Number(gv('cp-protein-'+code+'-pDbl'))};
  }else if(category==='sig'){
    values={p15:Number(gv('cp-sig-'+code+'-p15')),p30:Number(gv('cp-sig-'+code+'-p30'))};
  }else if(category==='side'){
    values={price:Number(gv('cp-side-'+code+'-price'))};
  }else if(category==='reward'){
    values={pts:Number(gv('cp-reward-'+code+'-pts'))};
  }else{
    return;
  }
  busy=true;busyMsg='Guardando precio...';render();
  try{
    await api('admin-catalog-set-price',{token:token,code:code,category:category,values:values});
    await loadCatalogBackground();
    catalogMsg='Precio actualizado.';
  }catch(e){
    busy=false;render();
    showToast('Error: '+e.message);
    return;
  }
  busy=false;render();
  setTimeout(function(){catalogMsg='';if(sc==='admin_catalog')render();},2500);
}

// FICHA DE CLIENTE (#94) — historial completo de un cliente (pedidos, puntos,
// calificaciones, crédito) en una sola búsqueda por teléfono en vez de cruzar pantallas.
async function loadCustomerDetail(){
  var el=(document.getElementById('cd-phone') as HTMLInputElement | null);
  var phone=(el?el.value:custDetailPhone).trim();
  if(!phone){custDetailErr='Ingresa un teléfono.';render();return;}
  custDetailPhone=phone;custDetailErr='';
  busy=true;busyMsg='Buscando cliente...';render();
  try{custDetail=await api('admin-customer-detail',{token:token,phone:phone});}
  catch(e){custDetail=null;custDetailErr=e.message;}
  busy=false;render();
}
function sAdminCustomer(){
  var h=H('FICHA DE CLIENTE',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+=INP('cd-phone','TELÉFONO DEL CLIENTE','tel',custDetailPhone);
  h+='<div style="margin-top:10px">'+BTN('BUSCAR //','loadCustomerDetail()')+'</div>';
  if(custDetailErr)h+='<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#ff8888;margin-top:12px;text-align:center">'+esc(custDetailErr)+'</div>';
  if(custDetail){
    var c=custDetail.customer;
    h+='<div style="height:1px;background:#1E3932;margin:20px 0"></div>'
      +'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:12px;padding:16px;margin-bottom:16px">'
      +'<div style="font-family:Barlow Condensed,sans-serif;font-size:20px;font-weight:900;color:#FFFFFF">'+esc(c.name)+'</div>'
      +'<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0;margin-top:4px">'+esc(c.phone)+(c.email?' · '+esc(c.email):'')+'</div>'
      +'<div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap">'
      +'<div><div style="font-family:Share Tech Mono,monospace;font-size:8px;color:'+GOLD+'">PUNTOS</div><div style="font-family:Barlow Condensed,sans-serif;font-size:18px;font-weight:900;color:#FFFFFF">'+(c.points||0)+'</div></div>'
      +'<div><div style="font-family:Share Tech Mono,monospace;font-size:8px;color:'+GOLD+'">PEDIDOS</div><div style="font-family:Barlow Condensed,sans-serif;font-size:18px;font-weight:900;color:#FFFFFF">'+(c.total_orders||0)+'</div></div>'
      +'<div><div style="font-family:Share Tech Mono,monospace;font-size:8px;color:'+GOLD+'">CRÉDITO</div><div style="font-family:Barlow Condensed,sans-serif;font-size:18px;font-weight:900;color:#FFFFFF">'+SOLES+(c.credit_balance||0)+'</div></div>'
      +'</div></div>';
    h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">PEDIDOS RECIENTES // '+custDetail.orders.length+'</div>';
    h+=custDetail.orders.length?custDetail.orders.map(function(o){return'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:8px;padding:10px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:Barlow,sans-serif;font-size:12px;color:#F2F0EB">'+esc(o.ref)+'</div><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0">'+esc(o.date)+' · '+SOLES+o.total+'</div></div>'+stBadge(o.status)+'</div>';}).join(''):'<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0">Sin pedidos //</div>';
    h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:18px 0 10px">HISTORIAL DE PUNTOS // '+custDetail.transactions.length+'</div>';
    h+=custDetail.transactions.length?custDetail.transactions.map(function(t){var pos=t.points>=0;return'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1E3932"><span style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0">'+esc(t.description)+'</span><span style="font-family:Share Tech Mono,monospace;font-size:12px;color:'+(pos?'#25D366':'#ff8888')+'">'+(pos?'+':'')+t.points+'</span></div>';}).join(''):'<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0">Sin movimientos //</div>';
    if(custDetail.ratings&&custDetail.ratings.length){
      h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:18px 0 10px">CALIFICACIONES // '+custDetail.ratings.length+'</div>';
      h+=custDetail.ratings.map(function(r){return'<div style="padding:8px 0;border-bottom:1px solid #1E3932"><span style="color:#F5C518">'+'★'.repeat(r.stars)+'</span>'+(r.comment?'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-top:2px">'+esc(r.comment)+'</div>':'')+'</div>';}).join('');
    }
  }
  h+='</div>';
  return h;
}

// BUSCAR PEDIDOS (#95) — búsqueda libre de cualquier pedido (no solo los activos que
// muestra admin_home) por ref/teléfono/nombre y/o estado.
async function doSearchOrders(){
  var qEl=(document.getElementById('so-q') as HTMLInputElement | null),stEl=(document.getElementById('so-status') as HTMLInputElement | null);
  searchQ=qEl?qEl.value.trim():'';
  searchStatus=stEl?stEl.value:'';
  if(!searchQ&&!searchStatus){showToast('Ingresa un texto o elige un estado.');return;}
  busy=true;busyMsg='Buscando pedidos...';render();
  try{
    var r=await api('admin-search-orders',{token:token,q:searchQ||undefined,status:searchStatus||undefined});
    searchResults=r.orders;searchTruncated=!!r.truncated;
  }catch(e){searchResults=[];showToast('Error: '+e.message);}
  busy=false;render();
}
function waSearchResult(i){waAdminOrder(searchResults[i]);}
function sAdminSearch(){
  var h=H('BUSCAR PEDIDOS',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+=INP('so-q','REF, TELÉFONO O NOMBRE','text',searchQ);
  h+='<div style="margin:10px 0"><select id="so-status" style="width:100%;background:#2D5246;border:1px solid #0d0d0d;border-radius:10px;padding:14px 16px;color:#FFFFFF;font-size:14px">'
    +'<option value="">Todos los estados</option>'
    +Object.keys(STATUSES).map(function(s){return'<option value="'+s+'" '+(searchStatus===s?'selected':'')+'>'+s+'</option>';}).join('')
    +'</select></div>';
  h+=BTN('BUSCAR //','doSearchOrders()');
  if(searchResults!==null){
    h+='<div style="height:1px;background:#1E3932;margin:20px 0"></div>';
    h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">RESULTADOS // '+searchResults.length+(searchTruncated?' (recortado)':'')+'</div>';
    h+=searchResults.length?searchResults.map(function(o,i){
      return'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:14px;margin-bottom:10px">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><div><div style="font-family:Barlow Condensed,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF">'+esc(o.customer_name||'Invitado')+'</div><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0">'+esc(o.ref)+' · '+esc(o.date)+' · '+SOLES+o.total+'</div></div>'+stBadge(o.status)+'</div>'
        +((o.contact_phone||o.customer_phone)?'<button onclick="waSearchResult('+i+')" style="all:unset;cursor:pointer;font-family:Barlow Condensed,sans-serif;font-size:11px;color:'+GOLD+'">💬 WhatsApp</button>':'')
        +'</div>';
    }).join(''):'<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0;text-align:center;padding:20px 0">Sin resultados //</div>';
  }
  h+='</div>';
  return h;
}

// AUDITORÍA (#96) — visor de admin_action_log (antes solo consultable desde el
// dashboard de Supabase).
async function loadAuditLog(){
  sc='admin_audit';busy=true;busyMsg='Cargando auditoría...';render();
  try{var r=await api('admin-audit-log',{token:token,limit:50});auditLog=r.log;}
  catch(e){auditLog=[];}
  busy=false;render();
}
function sAdminAudit(){
  var h=H('REGISTRO DE AUDITORÍA',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  var log=auditLog||[];
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:14px">ÚLTIMAS '+log.length+' ACCIONES //</div>';
  h+=log.length?log.map(function(l){
    return'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:8px;padding:12px 14px;margin-bottom:8px">'
      +'<div style="display:flex;justify-content:space-between"><span style="font-family:Barlow Condensed,sans-serif;font-size:14px;font-weight:700;color:#FFFFFF">'+esc(l.action)+'</span><span style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0">'+esc(l.actor_phone)+'</span></div>'
      +(l.target?'<div style="font-family:Barlow,sans-serif;font-size:11px;color:#A8C8B0;margin-top:4px;word-break:break-all">'+esc(String(l.target))+'</div>':'')
      +'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0;margin-top:4px">'+esc(new Date(l.created_at).toLocaleString('es-PE'))+'</div>'
      +'</div>';
  }).join(''):'<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0;text-align:center;padding:20px 0">Sin registros aún //</div>';
  h+='</div>';
  return h;
}

// HORARIO DE ATENCIÓN (#97) — ver comentario en env.ts/loadStoreHours: antes el
// horario era un array hardcodeado que exigía redesplegar la función para cambiarlo.
var DOW_NAMES=['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
async function loadStoreHoursForm(){
  sc='admin_hours';busy=true;busyMsg='Cargando horario...';render();
  try{var r=await api('get-store-hours',{});storeHoursForm=r.hours;}
  catch(e){storeHoursForm=DOW_NAMES.map(function(){return{open:11,close:22,closed:false};});}
  busy=false;render();
}
function toggleClosedDay(i){
  if(!storeHoursForm)return;
  var el=(document.getElementById('sh-closed-'+i) as HTMLInputElement | null);
  var checked=el&&el.checked;
  var d=storeHoursForm[i]||{};
  storeHoursForm[i]=checked?{open:d.open,close:d.close,closed:true}:{open:d.open==null?11:d.open,close:d.close==null?22:d.close,closed:false};
  render();
}
async function saveStoreHours(){
  var days=DOW_NAMES.map(function(_,i){
    var d=storeHoursForm[i]||{};
    if(d.closed)return{closed:true};
    var openEl=(document.getElementById('sh-open-'+i) as HTMLInputElement | null),closeEl=(document.getElementById('sh-close-'+i) as HTMLInputElement | null);
    return{open:Number(openEl.value),close:Number(closeEl.value),closed:false};
  });
  busy=true;busyMsg='Guardando horario...';render();
  try{
    await api('admin-set-store-hours',{token:token,days:days});
    storeHoursMsg='Horario actualizado.';
  }catch(e){showToast('Error: '+e.message);}
  busy=false;render();
  setTimeout(function(){storeHoursMsg='';if(sc==='admin_hours')render();},2500);
}
function sAdminHours(){
  var h=H('HORARIO DE ATENCIÓN',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  if(storeHoursMsg)h+='<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#25D366;margin-bottom:14px;text-align:center">'+esc(storeHoursMsg)+'</div>';
  var days=storeHoursForm||[];
  h+=DOW_NAMES.map(function(name,i){
    var d=days[i]||{open:11,close:22,closed:false};
    return'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:14px 16px;margin-bottom:10px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:'+(d.closed?'0':'10px')+'">'
      +'<span style="font-family:Barlow Condensed,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF">'+name+'</span>'
      +'<label style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0;display:flex;align-items:center;gap:6px"><input type="checkbox" id="sh-closed-'+i+'" '+(d.closed?'checked':'')+' onchange="toggleClosedDay('+i+')" style="accent-color:'+GOLD+'">CERRADO</label>'
      +'</div>'
      +(d.closed?'':'<div style="display:flex;gap:8px;align-items:center"><input id="sh-open-'+i+'" type="number" min="0" max="24" value="'+(d.open==null?11:d.open)+'" style="flex:1;background:#1A3028;border:1px solid #3A6B58;border-radius:8px;padding:9px 12px;color:#FFFFFF;font-family:Share Tech Mono,monospace;font-size:12px"><span style="color:#A8C8B0">a</span><input id="sh-close-'+i+'" type="number" min="0" max="24" value="'+(d.close==null?22:d.close)+'" style="flex:1;background:#1A3028;border:1px solid #3A6B58;border-radius:8px;padding:9px 12px;color:#FFFFFF;font-family:Share Tech Mono,monospace;font-size:12px"></div>')
      +'</div>';
  }).join('');
  h+=BTN('GUARDAR HORARIO //','saveStoreHours()');
  h+='</div>';
  return h;
}

// REPORTE POR FECHAS (#98) — el dashboard normal solo cubre hoy/semana/mes fijos; esto
// deja elegir cualquier rango libre.
async function doRangeReport(){
  var fromEl=(document.getElementById('rr-from') as HTMLInputElement | null),toEl=(document.getElementById('rr-to') as HTMLInputElement | null);
  var from=fromEl?fromEl.value:'',to=toEl?toEl.value:'';
  if(!from||!to){reportErr='Elige ambas fechas.';render();return;}
  reportFrom=from;reportTo=to;reportErr='';
  busy=true;busyMsg='Generando reporte...';render();
  try{
    reportData=await api('admin-range-report',{token:token,from:from,to:to+'T23:59:59'});
  }catch(e){reportData=null;reportErr=e.message;}
  busy=false;render();
}
function sAdminReport(){
  var h=H('REPORTE POR FECHAS',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+='<div style="display:flex;gap:8px;margin-bottom:10px">'
    +'<input id="rr-from" type="date" value="'+esc(reportFrom)+'" style="flex:1;background:#2D5246;border:1px solid #0d0d0d;border-radius:10px;padding:12px;color:#FFFFFF;font-size:16px">'
    +'<input id="rr-to" type="date" value="'+esc(reportTo)+'" style="flex:1;background:#2D5246;border:1px solid #0d0d0d;border-radius:10px;padding:12px;color:#FFFFFF;font-size:16px">'
    +'</div>';
  h+=BTN('GENERAR REPORTE //','doRangeReport()');
  if(reportErr)h+='<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#ff8888;margin-top:12px;text-align:center">'+esc(reportErr)+'</div>';
  if(reportData){
    var d=reportData;
    h+='<div style="height:1px;background:#1E3932;margin:20px 0"></div>';
    h+='<div style="display:flex;gap:10px;margin-bottom:16px">'
      +DTILE('INGRESOS',SOLES+d.revenue,d.count+' pedidos')
      +DTILE('TICKET PROM.',SOLES+d.avgTicket)
      +'</div>';
    if(d.truncated)h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#ffa500;margin-bottom:12px">⚠ Hay más pedidos en este rango de los que se muestran aquí.</div>';
    h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">POR MÉTODO DE PAGO //</div>';
    h+=Object.keys(d.byMethod).length?Object.keys(d.byMethod).map(function(m){var v=d.byMethod[m];return DBAR(m.toUpperCase(),v.count,d.count);}).join(''):'<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0">Sin datos //</div>';
    h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:18px 0 10px">PRODUCTOS TOP //</div>';
    h+=d.topProducts.length?d.topProducts.map(function(p){return'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1E3932"><span style="font-family:Barlow,sans-serif;font-size:12px;color:#F2F0EB">'+esc(p.name)+'</span><span style="font-family:Share Tech Mono,monospace;font-size:11px;color:'+GOLD+'">'+p.count+' · '+SOLES+p.revenue+'</span></div>';}).join(''):'<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0">Sin datos //</div>';
    h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:18px 0 10px">POR DÍA //</div>';
    h+=d.byDay.length?d.byDay.map(function(day){return'<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1E3932"><span style="font-family:Share Tech Mono,monospace;font-size:11px;color:#A8C8B0">'+esc(day.date)+'</span><span style="font-family:Share Tech Mono,monospace;font-size:11px;color:'+GOLD+'">'+day.count+' · '+SOLES+day.revenue+'</span></div>';}).join(''):'';
  }
  h+='</div>';
  return h;
}

// CALIFICACIONES (#99) — antes solo se veían resumidas (promedio + últimos 5 comentarios)
// en el dashboard; esto expone el listado completo con filtros.
async function loadRatingsList(){
  sc='admin_ratings';busy=true;busyMsg='Cargando calificaciones...';render();
  try{var r=await api('admin-ratings-list',{token:token,limit:50,minStars:ratingsMinStars||undefined,onlyWithComments:ratingsOnlyComments});ratingsList=r.ratings;}
  catch(e){ratingsList=[];}
  busy=false;render();
}
function applyRatingsFilter(){
  var minEl=(document.getElementById('rt-min') as HTMLInputElement | null),cEl=(document.getElementById('rt-comments') as HTMLInputElement | null);
  ratingsMinStars=minEl?Number(minEl.value):0;
  ratingsOnlyComments=cEl?cEl.checked:false;
  loadRatingsList();
}
function sAdminRatings(){
  var h=H('CALIFICACIONES',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+='<div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap">'
    +'<select id="rt-min" onchange="applyRatingsFilter()" style="background:#2D5246;border:1px solid #0d0d0d;border-radius:8px;padding:9px 12px;color:#FFFFFF;font-family:Share Tech Mono,monospace;font-size:11px">'
    +[0,1,2,3,4,5].map(function(n){return'<option value="'+n+'" '+(ratingsMinStars===n?'selected':'')+'>'+(n===0?'Todas':n+'★ o más')+'</option>';}).join('')
    +'</select>'
    +'<label style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0;display:flex;align-items:center;gap:6px"><input type="checkbox" id="rt-comments" onchange="applyRatingsFilter()" '+(ratingsOnlyComments?'checked':'')+' style="accent-color:'+GOLD+'">Solo con comentario</label>'
    +'</div>';
  var list=ratingsList||[];
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">'+list.length+' CALIFICACIONES //</div>';
  h+=list.length?list.map(function(r){
    return'<div style="background:#2D5246;border:1px solid #3A6B58;border-radius:10px;padding:14px;margin-bottom:10px">'
      +'<div style="display:flex;justify-content:space-between"><span style="color:#F5C518;font-size:14px">'+'★'.repeat(r.stars)+'<span style="color:#3A6B58">'+'★'.repeat(5-r.stars)+'</span></span><span style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0">'+esc(r.order_ref||'')+'</span></div>'
      +(r.comment?'<div style="font-family:Barlow,sans-serif;font-size:13px;color:#F2F0EB;margin-top:6px">'+esc(r.comment)+'</div>':'')
      +'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0;margin-top:6px">'+esc(new Date(r.created_at).toLocaleDateString('es-PE'))+'</div>'
      +'</div>';
  }).join(''):'<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0;text-align:center;padding:20px 0">Sin calificaciones //</div>';
  h+='</div>';
  return h;
}

// PREPARACIÓN ANTICIPADA — agrega los ingredientes de todos los pedidos programados de
// las próximas 24h en un solo resumen, para que la cocina prepare antes de que entren
// en cola (antes cada pedido programado se preparaba recién cuando llegaba su hora).
async function loadPrepList(){
  sc='admin_prep';busy=true;busyMsg='Calculando preparación...';render();
  try{prepListData=await api('admin-prep-list',{token:token});}
  catch(e){prepListData=null;}
  busy=false;render();
}
function sAdminPrepList(){
  var h=H('PREPARACIÓN',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  if(!prepListData){
    return h+'<div style="text-align:center;padding-top:64px"><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#ff8888;letter-spacing:.2em">NO SE PUDO CARGAR //</div></div>'+BTN('REINTENTAR //','loadPrepList()')+'</div>';
  }
  var d=prepListData;
  var shortfalls=d.ingredients.filter(function(i){return i.shortfall;});
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.1em;margin-bottom:16px">Próximas '+d.windowHours+'h · '+d.orders.length+' pedido'+(d.orders.length===1?'':'s')+' programado'+(d.orders.length===1?'':'s')+'</div>';
  if(shortfalls.length){
    h+='<div style="background:rgba(255,85,85,.12);border:1px solid rgba(255,85,85,.35);border-radius:10px;padding:14px 16px;margin-bottom:16px"><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#ff8888;letter-spacing:.1em;margin-bottom:6px">⚠ NO VA A ALCANZAR //</div>'
      +shortfalls.map(function(i){return'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#F2F0EB;margin-bottom:4px">'+esc(i.label)+' — necesitas '+i.qty+(i.stockQty!=null?', tienes '+i.stockQty:', sin stock')+'</div>';}).join('')
      +'</div>';
  }
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px;font-weight:700">INGREDIENTES A PREPARAR //</div>';
  h+=d.ingredients.length?d.ingredients.map(function(i){
    return'<div style="display:flex;justify-content:space-between;align-items:center;background:#2D5246;border:1px solid '+(i.shortfall?'rgba(255,85,85,.4)':'#3A6B58')+';border-radius:8px;padding:10px 14px;margin-bottom:8px"><span style="font-family:Barlow,sans-serif;font-size:13px;color:#F2F0EB">'+esc(i.label)+'</span><span style="font-family:Barlow Condensed,sans-serif;font-size:18px;font-weight:900;color:'+(i.shortfall?'#ff8888':GOLD)+'">×'+i.qty+'</span></div>';
  }).join(''):'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:16px">Sin pedidos programados en esta ventana.</div>';
  if(d.orders.length){
    h+='<div style="height:1px;background:#1E3932;margin:18px 0"></div>';
    h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px;font-weight:700">PEDIDOS INCLUIDOS //</div>';
    h+=d.orders.map(function(o){
      return'<div style="font-family:Share Tech Mono,monospace;font-size:11px;color:#A8C8B0;margin-bottom:6px">'+esc(o.ref)+' · '+esc(o.customerName)+' · '+esc(new Date(o.deliveryTime).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}))+'</div>';
    }).join('');
  }
  h+=BTN('ACTUALIZAR //','loadPrepList()',true);
  h+='</div>';
  return h;
}

// MARKETING — contenido listo para copiar y pegar, uno distinto cada semana (ver
// MARKETING_CONTENT en el backend). No publica nada solo: ninguna red social está
// conectada a este sistema, así que el dueño sigue siendo quien pega y publica —
// esto solo le ahorra la parte de redactar cada semana.
async function loadMarketingContent(){
  sc='admin_marketing';busy=true;busyMsg='Cargando contenido...';render();
  try{marketingContentData=await api('admin-marketing-content',{token:token});}
  catch(e){marketingContentData=null;}
  busy=false;render();
}
function copyMktText(week,field){
  var d=marketingContentData;if(!d)return;
  var text=(week==='current'?d.current:d.next)[field];
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){showToast('Copiado ✓','info');});}
}
function mktBlock(pkg,week){
  return'<div style="background:#2D5246;border:1px solid #1c1c1c;border-radius:10px;padding:16px;margin-bottom:14px">'
    +'<div style="font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:700;color:#FFFFFF;margin-bottom:12px">'+esc(pkg.theme)+'</div>'
    +'<div style="font-family:Share Tech Mono,monospace;font-size:8px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:4px">WHATSAPP / HISTORIA //</div>'
    +'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#F2F0EB;line-height:1.5;margin-bottom:6px">'+esc(pkg.whatsapp)+'</div>'
    +'<button onclick="copyMktText(\''+week+'\',\'whatsapp\')" style="all:unset;cursor:pointer;background:'+GOLD+';color:#0d0d0d;font-family:Barlow Condensed,sans-serif;font-size:10px;font-weight:700;padding:7px 12px;border-radius:6px;margin-bottom:14px;display:inline-block">COPIAR</button>'
    +'<div style="font-family:Share Tech Mono,monospace;font-size:8px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:4px">CAPTION (INSTAGRAM/FACEBOOK) //</div>'
    +'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#F2F0EB;line-height:1.5;margin-bottom:6px">'+esc(pkg.caption)+'</div>'
    +'<button onclick="copyMktText(\''+week+'\',\'caption\')" style="all:unset;cursor:pointer;background:'+GOLD+';color:#0d0d0d;font-family:Barlow Condensed,sans-serif;font-size:10px;font-weight:700;padding:7px 12px;border-radius:6px;margin-bottom:14px;display:inline-block">COPIAR</button>'
    +'<div style="font-family:Share Tech Mono,monospace;font-size:8px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:4px">IDEA DE FOTO //</div>'
    +'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;line-height:1.5">'+esc(pkg.photoIdea)+'</div>'
    +'</div>';
}
function sAdminMarketing(){
  var h=H('MARKETING',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  var d=marketingContentData;
  if(!d)return h+'<div style="text-align:center;padding-top:64px"><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#ff8888;letter-spacing:.2em">NO SE PUDO CARGAR //</div></div>'+BTN('REINTENTAR //','loadMarketingContent()')+'</div>';
  h+='<div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:16px;line-height:1.5">Contenido listo para copiar y pegar — cambia cada semana. Nada se publica solo, tú decides cuándo y dónde.</div>';
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">ESTA SEMANA //</div>';
  h+=mktBlock(d.current,'current');
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0;letter-spacing:.2em;margin-bottom:8px">PRÓXIMA SEMANA //</div>';
  h+=mktBlock(d.next,'next');
  h+='</div>';
  return h;
}

// FRANJAS HORARIAS — no hay turnos de cocina distintos (una sola persona atiende), así
// que esto no mide personal: agrupa pedidos por hora del día para ver si hay una franja
// con más cancelaciones o entregas más lentas que el resto.
async function loadTimeWindowReport(){
  sc='admin_time_report';busy=true;busyMsg='Calculando franjas horarias...';render();
  try{timeReportData=await api('admin-time-window-report',{token:token});}
  catch(e){timeReportData=null;}
  busy=false;render();
}
function sAdminTimeReport(){
  var h=H('FRANJAS HORARIAS',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  if(!timeReportData){
    return h+'<div style="text-align:center;padding-top:64px"><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#ff8888;letter-spacing:.2em">NO SE PUDO CARGAR //</div></div>'+BTN('REINTENTAR //','loadTimeWindowReport()')+'</div>';
  }
  var d=timeReportData;
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.1em;margin-bottom:16px">Últimos '+d.windowDays+' días · ordenado por % de cancelación</div>';
  h+=d.hours.length?d.hours.map(function(hr){
    var urgent=hr.cancelRatePct>=20;
    return'<div style="background:#2D5246;border:1px solid '+(urgent?'rgba(255,85,85,.4)':'#3A6B58')+';border-radius:10px;padding:12px 14px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:Barlow Condensed,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF">'+String(hr.hour).padStart(2,'0')+':00–'+String((hr.hour+1)%24).padStart(2,'0')+':00</span><span style="font-family:Share Tech Mono,monospace;font-size:13px;color:'+(urgent?'#ff8888':GOLD)+'">'+hr.cancelRatePct+'% cancelado</span></div><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0;margin-top:4px">'+hr.total+' pedido'+(hr.total===1?'':'s')+' · '+hr.cancelled+' cancelado'+(hr.cancelled===1?'':'s')+(hr.avgDeliveryMin!=null?' · entrega prom. '+hr.avgDeliveryMin+' min':'')+'</div></div>';
  }).join(''):'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:16px">Sin pedidos en este período.</div>';
  h+=BTN('ACTUALIZAR //','loadTimeWindowReport()',true);
  h+='</div>';
  return h;
}

// DIRECCIONES CON ENTREGAS FALLIDAS REPETIDAS — si una dirección acumula 2+
// cancelaciones vale la pena revisarla antes del próximo pedido a ese mismo lugar.
async function loadProblemAddresses(){
  sc='admin_problem_addresses';busy=true;busyMsg='Buscando direcciones...';render();
  try{problemAddressesData=await api('admin-problem-addresses',{token:token});}
  catch(e){problemAddressesData=null;}
  busy=false;render();
}
function sAdminProblemAddresses(){
  var h=H('DIRECCIONES',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  if(!problemAddressesData){
    return h+'<div style="text-align:center;padding-top:64px"><div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#ff8888;letter-spacing:.2em">NO SE PUDO CARGAR //</div></div>'+BTN('REINTENTAR //','loadProblemAddresses()')+'</div>';
  }
  var addrs=problemAddressesData.addresses||[];
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.1em;margin-bottom:16px">Direcciones con 2+ cancelaciones</div>';
  h+=addrs.length?addrs.map(function(a){
    return'<div style="background:#2D5246;border:1px solid rgba(255,85,85,.3);border-radius:10px;padding:14px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:flex-start"><span style="font-family:Barlow,sans-serif;font-size:13px;color:#F2F0EB;flex:1">'+esc(a.address)+'</span><span style="font-family:Barlow Condensed,sans-serif;font-size:18px;font-weight:900;color:#ff8888;flex-shrink:0;margin-left:10px">'+a.cancelCount+'</span></div>'
      +(a.reasons&&a.reasons.length?'<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0;margin-top:6px">'+a.reasons.map(function(r){return esc(r);}).join(' · ')+'</div>':'')
      +'</div>';
  }).join(''):'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-bottom:16px">Sin direcciones con cancelaciones repetidas.</div>';
  h+=BTN('ACTUALIZAR //','loadProblemAddresses()',true);
  h+='</div>';
  return h;
}

// RECLAMACIONES — el negocio tiene 30 días calendario para responder cada reclamo/queja
// (obligación legal, no solo buena práctica); esta pantalla es donde el operador ve la
// cola pendiente y deja constancia de la respuesta.
async function loadAdminComplaints(){
  sc='admin_complaints';busy=true;busyMsg='Cargando reclamaciones...';render();
  try{var r=await api('admin-list-complaints',{token:token,status:cmplFilterStatus||undefined});adminComplaints=r.complaints;}
  catch(e){adminComplaints=[];}
  busy=false;render();
}
function setComplaintsFilter(v){cmplFilterStatus=v;loadAdminComplaints();}
function sAdminComplaints(){
  var h=H('RECLAMACIONES',"sc='admin_home';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+='<select onchange="setComplaintsFilter(this.value)" style="background:#2D5246;border:1px solid #0d0d0d;border-radius:8px;padding:9px 12px;color:#FFFFFF;font-family:Share Tech Mono,monospace;font-size:11px;margin-bottom:14px">'
    +[['','Todos'],['pendiente','Pendientes'],['atendido','Atendidos']].map(function(x){return'<option value="'+x[0]+'" '+(cmplFilterStatus===x[0]?'selected':'')+'>'+x[1]+'</option>';}).join('')
    +'</select>';
  var list=adminComplaints||[];
  h+='<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">'+list.length+' RECLAMACIONES //</div>';
  h+=list.length?list.map(function(c){
    var pending=c.status==='pendiente';
    var openId=cmplRespondingId===c.id;
    return'<div style="background:#2D5246;border:1px solid '+(pending?'rgba(255,165,0,.35)':'#3A6B58')+';border-radius:10px;padding:14px;margin-bottom:10px">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div>'
      +'<div style="font-family:Barlow Condensed,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF">'+esc(c.claim_code)+'<span style="color:'+GOLD+'"> // </span>'+(c.kind==='queja'?'QUEJA':'RECLAMO')+'</div>'
      +'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-top:2px">'+esc(c.consumer_name)+' · '+esc(c.consumer_phone)+' · '+esc(c.consumer_email)+'</div>'
      +'</div><span style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+(pending?'#ffa500':'#25D366')+';flex-shrink:0">'+(pending?'⏳ PENDIENTE':'✓ ATENDIDO')+'</span></div>'
      +'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#F2F0EB;margin-top:8px;line-height:1.5"><b>Detalle:</b> '+esc(c.detail)+'</div>'
      +'<div style="font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0;margin-top:4px;line-height:1.5"><b>Pide:</b> '+esc(c.consumer_request)+'</div>'
      +(c.order_ref?'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0;margin-top:6px">Pedido: '+esc(c.order_ref)+'</div>':'')
      +'<div style="font-family:Share Tech Mono,monospace;font-size:9px;color:#A8C8B0;margin-top:6px">'+esc(new Date(c.created_at).toLocaleDateString('es-PE'))+'</div>'
      +(c.provider_response?'<div style="background:#1A3028;border-radius:8px;padding:10px 12px;margin-top:10px;font-family:Barlow,sans-serif;font-size:12px;color:#A8C8B0"><b style="color:'+GOLD+'">Respuesta:</b> '+esc(c.provider_response)+'</div>'
        :(openId
          ?'<div style="margin-top:10px"><textarea id="cq-resp-'+c.id+'" placeholder="Escribe tu respuesta al consumidor" style="background:#1A3028;border:1px solid #3A6B58;border-radius:8px;padding:10px 12px;color:#FFFFFF;width:100%;font-size:12px;font-family:Barlow,sans-serif;min-height:70px;box-sizing:border-box;margin-bottom:8px"></textarea><button onclick="doRespondComplaint(\''+c.id+'\')" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#fff;font-family:Barlow Condensed,sans-serif;font-size:12px;font-weight:700;letter-spacing:.06em;padding:10px 0;border-radius:8px;text-align:center">GUARDAR RESPUESTA //</button></div>'
          :'<button onclick="cmplRespondingId=\''+c.id+'\';render()" style="all:unset;cursor:pointer;display:block;width:100%;text-align:center;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:'+GOLD+';font-family:Barlow Condensed,sans-serif;font-size:12px;font-weight:700;letter-spacing:.06em;padding:9px 0;border-radius:8px;margin-top:10px">RESPONDER //</button>'))
      +'</div>';
  }).join(''):'<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:#A8C8B0;text-align:center;padding:20px 0">Sin reclamaciones //</div>';
  h+='</div>';
  return h;
}
async function doRespondComplaint(id){
  var el=(document.getElementById('cq-resp-'+id) as HTMLInputElement | null);
  var response=el?el.value.trim():'';
  if(!response)return;
  try{
    await api('admin-respond-complaint',{token:token,id:id,response:response});
    cmplRespondingId=null;
    loadAdminComplaints();
  }catch(e){showToast(e.message,'error');}
}

function sPRecover(){
  var pinBox=recNewPin?'<div style="background:#1A3028;border:2px solid '+GOLD+';border-radius:12px;padding:20px;margin-bottom:16px;text-align:center"><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">TU NUEVO PIN //</div><div style="font-family:Barlow Condensed,sans-serif;font-size:36px;font-weight:900;color:'+GOLD+'">'+recNewPin+'</div><div style="font-family:Barlow,sans-serif;font-size:11px;color:#A8C8B0;margin-top:8px">Guárdalo — úsalo para ingresar con tu teléfono.</div></div>'
    :(recEmailMasked?'<div style="background:#1A3028;border:2px solid '+GOLD+';border-radius:12px;padding:20px;margin-bottom:16px;text-align:center"><div style="font-family:Share Tech Mono,monospace;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">✓ CORREO ENVIADO //</div><div style="font-family:Barlow,sans-serif;font-size:13px;color:#F2F0EB;line-height:1.5">Te mandamos tu PIN nuevo a<br><b style="color:'+GOLD+'">'+esc(recEmailMasked)+'</b></div></div>':'');
  return H('RECUPERAR CUENTA',"sc='p_auth';render()")
    +'<div style="flex:1;padding:24px 20px 40px" class="fi">'
    +'<div style="font-family:Barlow Condensed,sans-serif;font-size:22px;font-weight:900;color:#F2F0EB;margin-bottom:6px">RECUPERAR PIN //</div>'
    +'<div style="font-family:Barlow,sans-serif;font-size:13px;color:#A8C8B0;margin-bottom:24px;line-height:1.5">Verifica tu identidad con tu teléfono, DNI y fecha de nacimiento. Si tienes correo registrado, te mandamos el PIN nuevo ahí; si no, te lo mostramos aquí mismo.</div>'
    +pinBox
    +'<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">'
    +INP('rec-phone','TELÉFONO // 9XXXXXXXX','tel')
    +INP('rec-dni','DNI // Tu número de 8 dígitos','text')
    +INP('rec-bday','FECHA NACIMIENTO // DD/MM/AAAA','text')
    +'</div>'
    +'<div id="rec-msg" style="font-family:Barlow,sans-serif;font-size:12px;color:#ff5555;min-height:16px;margin-bottom:12px;text-align:center"></div>'
    +BTN('RECUPERAR MI PIN //','doRecover()')
    +'</div>';
}
async function doRecover(){
  var phone=gv('rec-phone').trim();
  var dni=gv('rec-dni').trim();
  var bdayRaw=gv('rec-bday').trim();
  var msg=(document.getElementById('rec-msg') as HTMLInputElement | null);
  if(!phone||!dni||!bdayRaw){if(msg)msg.textContent='Completa teléfono, DNI y fecha de nacimiento.';return;}
  var m=bdayRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(!m){if(msg)msg.textContent='Fecha debe ser DD/MM/AAAA.';return;}
  var bday=m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
  busy=true;busyMsg='Verificando...';render();
  try{
    var r=await api('recover',{phone:phone,dni:dni,bday:bday});
    if(r.emailSent){recNewPin=null;recEmailMasked=r.emailMasked;}
    else{recNewPin=r.newPin;recEmailMasked=null;}
    busy=false;sc='p_recover';render();
  }catch(e){
    busy=false;sc='p_recover';render();
    var m2=(document.getElementById('rec-msg') as HTMLInputElement | null);
    if(m2)m2.textContent=e.message;
  }
}

// PWA — registro del service worker (habilita instalación + apertura offline del
// shell) y captura del prompt nativo de instalación para ofrecerlo desde un botón
// propio en vez de esperar a que el navegador lo muestre por su cuenta.
if('serviceWorker' in navigator){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
}
window.addEventListener('beforeinstallprompt',function(e){
  e.preventDefault();
  deferredInstallPrompt=e;
  render();
});
window.addEventListener('appinstalled',function(){
  deferredInstallPrompt=null;
  render();
});
// Antes no había ninguna detección de modo sin conexión — cada acción fallaba por
// separado con su propio mensaje genérico en vez de un aviso único y proactivo.
window.addEventListener('offline',function(){isOffline=true;render();});
window.addEventListener('online',function(){isOffline=false;render();});
async function installPwa(){
  if(!deferredInstallPrompt)return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt=null;
  render();
}
function dismissPwaBanner(){
  pwaDismissed=true;
  localStorage.setItem('sw_pwa_dismissed','1');
  render();
}

function haversineKm(lat1,lon1,lat2,lon2){
  var R=6371;
  var dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
// Chequeo de ubicación de una sola vez al abrir la app (no un rastreo continuo): si el
// cliente ya cerró el banner hoy, o niega/no tiene geolocalización, simplemente no se
// muestra nada — nunca insiste ni vuelve a pedir permiso en la misma sesión.
function checkNearbyStore(){
  if(_nearCheckDone)return;
  _nearCheckDone=true;
  var today=new Date().toISOString().slice(0,10);
  if(localStorage.getItem('sw_near_dismissed')===today)return;
  if(!('geolocation' in navigator))return;
  navigator.geolocation.getCurrentPosition(function(pos){
    var d=haversineKm(pos.coords.latitude,pos.coords.longitude,STORE_LAT,STORE_LON);
    if(d<=NEARBY_RADIUS_KM){nearStore=true;render();}
  },function(){/* permiso denegado o ubicación no disponible — sin banner, sin insistir */},{maximumAge:600000,timeout:8000});
}
function dismissNearbyBanner(){
  nearStore=false;
  localStorage.setItem('sw_near_dismissed',new Date().toISOString().slice(0,10));
  render();
}

// NOTIFICACIONES PUSH — avisan cuando el pedido pasa a PREPARANDO/EN CAMINO/ENTREGADO,
// incluso con la app cerrada. Solo disponibles para clientes con cuenta (la suscripción
// se guarda ligada a tu teléfono) y requieren HTTPS (o localhost) + un navegador
// compatible con Push API.
function urlBase64ToUint8Array(base64String){
  var padding='='.repeat((4-base64String.length%4)%4);
  var base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
  var rawData=atob(base64);
  var out=new Uint8Array(rawData.length);
  for(var i=0;i<rawData.length;i++)out[i]=rawData.charCodeAt(i);
  return out;
}
async function checkPushSubscription(){
  if(!('serviceWorker' in navigator)||!('PushManager' in window))return;
  try{
    var reg=await navigator.serviceWorker.ready;
    var sub=await reg.pushManager.getSubscription();
    pushSubscribed=!!sub;
    render();
  }catch(e){}
}
async function togglePushNotifications(){
  if(!('serviceWorker' in navigator)||!('PushManager' in window)){pushMsg='Tu navegador no soporta notificaciones push.';render();return;}
  if(!cust){pushMsg='Inicia sesión para activar notificaciones.';render();return;}
  try{
    var reg=await navigator.serviceWorker.ready;
    var existing=await reg.pushManager.getSubscription();
    if(existing){
      await api('push-unsubscribe',{token:token,endpoint:existing.endpoint});
      await existing.unsubscribe();
      pushSubscribed=false;pushMsg='Notificaciones desactivadas.';render();
      return;
    }
    var perm=await Notification.requestPermission();
    if(perm!=='granted'){pushMsg='Necesitas permitir notificaciones desde tu navegador.';render();return;}
    var sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)});
    var subJson=sub.toJSON();
    await api('push-subscribe',{token:token,endpoint:subJson.endpoint,p256dh:subJson.keys.p256dh,auth:subJson.keys.auth});
    pushSubscribed=true;pushMsg='¡Notificaciones activadas!';render();
  }catch(e){pushMsg='No se pudo activar: '+(e.message||'intenta de nuevo.');render();}
}

// INIT
// Antes esperábamos la respuesta de session-check ANTES del primer pintado siempre que
// hubiera un token guardado — un solo round-trip al backend (que puede tardar 1-3s por
// cold start de la Edge Function + la vuelta Perú↔servidor) bloqueaba la pantalla de
// carga en CADA recarga, incluso para alguien que ya estaba con sesión iniciada. Ahora,
// si hay una copia cacheada del cliente (ver cacheCust), se pinta con ella de inmediato
// — session-check sigue corriendo en segundo plano para confirmar/corregir en silencio.
// Solo se bloquea con el spinner cuando no hay nada que mostrar todavía (primer login en
// este dispositivo tras limpiar datos, por ejemplo).
(async function(){
  var haveCachedCust=false;
  if(token){
    try{
      var cachedRaw=localStorage.getItem('sw_cust_cache');
      if(cachedRaw){cust=JSON.parse(cachedRaw);isAdmin=localStorage.getItem('sw_is_admin_cache')==='1';haveCachedCust=true;}
    }catch(e){}
  }
  restoreCart();
  render();
  if(token){
    if(!haveCachedCust){busy=true;busyMsg='Verificando tu sesión...';render();}
    try{
      var r=await api('session-check',{token:token});
      if(r.valid){cust=r.customer;isAdmin=r.isAdmin;cacheCust(cust,isAdmin);}
      else{token='';localStorage.removeItem('sw_tok');cust=null;isAdmin=false;cacheCust(null);}
    }catch(e){} // sin conexión — sigue con lo ya pintado (cache o invitado), no se pierde la sesión guardada
    if(!haveCachedCust)busy=false;
    render();
  }
  loadInvBackground().then(function(){render();}); // load stock status in background, re-render when ready
  loadCatalogBackground().then(function(){render();}); // load current prices in background, re-render when ready
  loadStoreHoursBackground().then(function(){render();}); // load real store hours in background, re-render when ready
  if(cust)loadUserExtras();
  checkPushSubscription();
  checkNearbyStore();
  // ?group=CODE (link compartido de un pedido grupal) — no exige cuenta para entrar y
  // contribuir, solo para organizar/cerrar, así que se abre para cualquiera.
  if(groupCodeFromUrl){
    groupCode=groupCodeFromUrl;sc='group_order';render();
    loadGroupOrder();
    startGroupPoll();
  }
})();
