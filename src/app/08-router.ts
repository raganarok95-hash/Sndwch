// SND//WCH — EL ROUTER
//
// Esta parte existe desde el 2026-09-10 y su razón es de negocio, no de orden. `render()` y
// `renderScreen()` vivían DENTRO del archivo del panel de administración, con los 34 `case`
// de sus pantallas escritos ahí mismo. Mientras eso fuera así, el panel no se podía sacar
// del bundle que descarga TODO cliente que abre la carta — y el panel son 313 KB de 819,
// o sea el 39% del código, por 34 pantallas que solo abre el dueño.
//
// Por qué eso importa más de lo que parece: el modelo del negocio dice que el CAC es
// `CPM / (1000 × CTR × CVR) × 1.18`, y que la CONVERSIÓN es la única de las tres variables
// que el negocio controla — las otras dos las fija la subasta de Meta. Un bundle que pesa
// el doble de lo necesario, en una conexión móvil de Trujillo, es fricción en el punto
// exacto donde se pierde al cliente.
//
// El router es la ÚLTIMA parte del CLIENTE (08) a propósito: llama a las pantallas de las
// partes 01-07 y consulta el registro que llenan las partes del panel (09-10). Las
// declaraciones de función se hoistean, así que el orden no cambia el comportamiento; lo
// que dice es quién depende de quién.
//
// ⚠ Una pantalla de CLIENTE nueva se agrega como `case` acá. Una de ADMIN nunca: va al
// registro, en la parte 10. Meter una de admin en el switch vuelve a atar las dos mitades.

// El registro que llena el panel al cargarse. Se declara acá —en el bundle del cliente— para
// que el router pueda preguntar sin saber si el panel existe: un objeto vacío responde "no la
// tengo" igual de bien que uno lleno, y sin una sola condición extra.
var ADMIN_SCREENS: Record<string, () => string> = {};

var SW_UPDATE_FLAG='__shell-update-pending';
// INIT
// Antes esperábamos la respuesta de session-check ANTES del primer pintado siempre que
// hubiera un token guardado — un solo round-trip al backend (que puede tardar 1-3s por
// cold start de la Edge Function + la vuelta Perú↔servidor) bloqueaba la pantalla de
// carga en CADA recarga, incluso para alguien que ya estaba con sesión iniciada. Ahora,
// si hay una copia cacheada del cliente (ver cacheCust), se pinta con ella de inmediato
// — session-check sigue corriendo en segundo plano para confirmar/corregir en silencio.
// Solo se bloquea con el spinner cuando no hay nada que mostrar todavía (primer login en
// este dispositivo tras limpiar datos, por ejemplo).
// ─── BLINDAJE DE FUNCIONES GLOBALES ────────────────────────────────────────────────
//
// Este archivo se sirve como <script> inline, así que cada función de nivel superior es
// una propiedad de `window`. `src/shell.html` carga además dos bundles minificados de
// terceros — `checkout.culqi.com/js/v4` (una app Vue) y `accounts.google.com/gsi/client`
// — ambos con `defer`/`async`, o sea que corren DESPUÉS del nuestro. Si alguno declara
// una función de nivel superior con un nombre que también usamos nosotros, gana el
// último: nuestra función deja de existir y el `onclick` que la llama muere en silencio.
//
// No es hipotético. El 2026-08-21 pasó DOS veces el mismo día: primero Culqi pisó `sc`
// (era el `createComponentInstance` de Vue) y reventó cada render con
// "sc.indexOf is not a function"; renombrada esa, apareció "go is not a function" — otra
// función nuestra pisada por el mismo bundle. Renombrar de a una es un juego perdido:
// hay ~305 nombres nuestros expuestos y el que colisione mañana depende de qué elija
// Culqi o Google en su próxima actualización, sin avisarnos.
//
// Esto lo resuelve de raíz, sin tocar los 147 `onclick` en línea. Se toma una foto de
// TODAS las funciones que hay en `window` al terminar nuestro script — momento en que
// solo están las nuestras y las del navegador, porque los scripts diferidos todavía no
// corrieron— y se repone cualquiera que haya cambiado de identidad.
//
// Solo se protegen FUNCIONES, nunca variables de estado: nuestras funciones jamás se
// reasignan en runtime, así que si una cambió de identidad es porque alguien la pisó.
// El estado (sndScreen, cart, base...) sí cambia legítimamente y no se toca acá.
// Una propiedad nueva de un tercero (`window.Culqi`, `window.google`) no está en la foto,
// así que nunca se borra: solo se repone lo que ya era nuestro.
var _sndOwnedFns=(function(){
  var snap={};
  try{
    Object.getOwnPropertyNames(window).forEach(function(k){
      try{
        var d=Object.getOwnPropertyDescriptor(window,k);
        if(!d||!d.writable||typeof d.value!=='function')return;
        snap[k]=d.value;
      }catch(_){}
    });
  }catch(_){}
  return snap;
})();


// ── LA INFRAESTRUCTURA DEL PROPIO ROUTER ──────────────────────────────────────────────
// Las tres cosas de acá abajo las usa `render()` en CADA pintada, y vivían en el archivo
// del panel. O sea que el cliente no podía pintar una sola pantalla sin el panel cargado —
// y eso no se notaba mientras todo viajara junto. `applyAppUpdate` es el mismo caso, con un
// agravante: la llama el botón de la pantalla de error, que es exactamente la que aparece
// cuando algo ya salió mal.
var _lastRenderedSc=null;
// Toda la app se dibuja como HTML en strings, y buena parte de los controles son
// <div onclick> (tarjetas de Signature, chips de bebida, filas de dirección...): el
// navegador no los ve como controles, así que no se podían enfocar ni activar con teclado
// y un lector de pantalla los leía como texto suelto. Marcarlos acá, después de cada
// render, en vez de reescribir las ~60 etiquetas a mano: no toca ni una línea del HTML
// generado (cero riesgo de romper una plantilla) y cubre también las que se agreguen
// después. La regla de foco visible ya existe en shell.html para cursor:pointer.
function makeClickablesAccessible(){
  var nodes=document.querySelectorAll('[onclick]');
  for(var i=0;i<nodes.length;i++){
    var el=nodes[i] as HTMLElement;
    var tag=el.tagName;
    if(tag==='BUTTON'||tag==='A'||tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA'||tag==='LABEL')continue;
    if(el.hasAttribute('tabindex'))continue;
    el.setAttribute('tabindex','0');
    if(!el.hasAttribute('role'))el.setAttribute('role','button');
  }
}
function sndRestoreOwnedFns(){
  var fixed=[];
  for(var k in _sndOwnedFns){
    try{
      if((window as any)[k]!==_sndOwnedFns[k]){(window as any)[k]=_sndOwnedFns[k];fixed.push(k);}
    }catch(_){}
  }
  if(fixed.length)console.warn('Un script externo pisó estas funciones y se repusieron:',fixed.join(', '));
  return fixed;
}
async function applyAppUpdate(){
  updateReady=false;render();
  // Borrar la marca ANTES de recargar: si quedara, la pestaña nueva volvería a ver el
  // aviso al arrancar (el service worker la limpia también, pero recién cuando termina su
  // propia revalidación, varios segundos después).
  try{
    if(window.caches){
      var ks=await caches.keys();
      await Promise.all(ks.map(async function(k){var c=await caches.open(k);await c.delete(SW_UPDATE_FLAG);}));
    }
  }catch(e){}
  try{
    if(navigator.serviceWorker&&navigator.serviceWorker.controller)
      navigator.serviceWorker.controller.postMessage({type:'sw-skip-waiting'});
  }catch(e){}
  location.reload();
}


// ── EL ARRANQUE DE LA APP Y SUS OYENTES GLOBALES ──────────────────────────────────────
// Todo esto vivía en el archivo del panel, y el 2026-09-10 —al partir el bundle— resultó
// que ahí estaba el IIFE que ARRANCA LA APP. Con el panel sin cargar, el cliente no llamaba
// a `render()` ni una vez: la pantalla quedaba en blanco, sin un solo error en la consola,
// para el 100% de los clientes. Y la app funcionaba perfecto en cuanto se llamaba a
// `render()` a mano, que es lo que hace este defecto tan difícil de ver: no está roto, es
// que nadie lo enciende.
//
// `check:cliente` no lo atrapó porque mira REFERENCIAS, y acá no faltaba ninguna: el
// problema no era que el cliente llamara al panel, sino que el interruptor estaba del otro
// lado. Por eso la defensa nueva es una prueba de comportamiento
// (`tests/registro-del-panel.spec.ts`) que carga la app y exige que se pinte SOLA.
//
// Con el arranque vienen sus oyentes: el manejador de errores de JavaScript, el registro
// del service worker, el aviso de sin conexión, el prompt de instalación y el atajo de
// teclado. Ninguno es de admin y todos tienen que existir desde el primer instante.
// Enter/Espacio sobre uno de esos controles hace lo mismo que un tap. Un <button> real ya
// lo hace solo; esto es solo para los que no lo son.
document.addEventListener('keydown',function(e){
  if(e.key!=='Enter'&&e.key!==' ')return;
  var el=document.activeElement as HTMLElement;
  if(!el||typeof el.getAttribute!=='function')return;
  if(el.tagName==='BUTTON'||el.tagName==='A'||el.tagName==='INPUT'||el.tagName==='TEXTAREA')return;
  if(el.getAttribute('role')!=='button')return;
  e.preventDefault();
  el.click();
});

// Solo errores REALES de JavaScript. Un `<img>` o una fuente que no carga también dispara
// un evento 'error', y mostrarle al cliente una barra roja porque no bajó una foto sería
// una falsa alarma peor que el problema: se filtra exigiendo que haya un mensaje de error
// de verdad (los fallos de recurso llegan sin `message`).
window.addEventListener('error',function(ev){if(ev&&ev.message)showRuntimeError(ev.message);});
window.addEventListener('unhandledrejection',function(ev: any){
  var r=ev&&ev.reason;showRuntimeError((r&&r.message)||String(r||'Promesa rechazada'));
});

// PWA — registro del service worker (habilita instalación + apertura offline del
// shell) y captura del prompt nativo de instalación para ofrecerlo desde un botón
// propio en vez de esperar a que el navegador lo muestre por su cuenta.
if('serviceWorker' in navigator){
  window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
  // El shell se sirve desde caché para que la app abra al instante; el service worker
  // revalida en paralelo y avisa por aquí si el servidor tiene una versión distinta.
  navigator.serviceWorker.addEventListener('message',function(ev){
    if(ev.data&&ev.data.type==='sw-shell-updated'&&!updateReady){updateReady=true;render();}
  });
  // El mensaje solo alcanza a las pestañas ya abiertas: cuando la revalidación termina, la
  // pestaña que acaba de navegar todavía no tiene listener. Por eso el service worker deja
  // además una marca en la caché y aquí se consulta al arrancar.
  checkShellUpdateFlag();
}
async function checkShellUpdateFlag(){
  if(!window.caches)return;
  for(var i=0;i<3;i++){
    try{
      var hit=await caches.match(SW_UPDATE_FLAG);
      if(hit){updateReady=true;render();return;}
    }catch(e){return;}
    await new Promise(function(r){setTimeout(r,2500);});
  }
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
// Teclado virtual abierto → esconder la barra fija de navegación. Medido con Playwright a
// 320x330 (alto típico de viewport con el teclado de Android abierto): la barra quedaba
// justo encima del campo de teléfono del checkout y tapaba el de nombre. visualViewport
// es la única API que reporta el alto REAL disponible cuando el teclado está arriba;
// window.innerHeight no cambia en Android. El umbral de 75% distingue "teclado abierto"
// de la barra de URL que se contrae al hacer scroll (esa se lleva ~10-15%, no ~40%).
if(window.visualViewport){
  window.visualViewport.addEventListener('resize',function(){
    var vv=window.visualViewport;
    if(!vv)return;
    document.body.classList.toggle('kb-open',vv.height<window.innerHeight*0.75);
  });
}
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

// Los dos momentos en que un tercero puede haber pisado algo: cuando termina de cargar
// la página (ahí ya corrieron los scripts con defer/async) y en cada render (Culqi
// también inyecta código al abrir su formulario de pago, después del load).
window.addEventListener('load',function(){sndRestoreOwnedFns();});

(async function(){
  var haveCachedCust=false;
  if(token){
    try{
      var cachedRaw=localStorage.getItem('sw_cust_cache');
      if(cachedRaw){cust=JSON.parse(cachedRaw);isAdmin=localStorage.getItem('sw_is_admin_cache')==='1';haveCachedCust=true;}
    }catch(e){}
  }
  restoreCart();
  // Primera apertura: solo si no hay sesión, no se ha visto antes, Google está configurado
  // y no venimos por un link con destino propio (un pedido grupal, un código de referido,
  // una confirmación de entrega). Interponerla ahí rompería el link que la persona tocó.
  // ?legal=... gana sobre todo lo demás: quien llega con ese link viene a LEER el texto, sea
  // Google revisando la app o un cliente que lo pidió. Mandarlo al menú primero sería
  // exactamente lo contrario de lo que el link promete.
  if(legalFromUrl)sndScreen=legalFromUrl;
  else try{
    if(!token && !localStorage.getItem('sw_seen_hello') && googleConfigured()
       && !groupCodeFromUrl && !location.search){
      sndScreen='p_hello';
    }
  }catch(e){}
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
    groupCode=groupCodeFromUrl;sndScreen='group_order';render();
    loadGroupOrder();
    startGroupPoll();
  }
  // ?grupo=1 (QR de la tarjeta de la bolsa). A diferencia de ?group=CODE, organizar SÍ
  // exige cuenta — el servidor necesita saber a quién cobrarle al cerrar. Si ya hay
  // sesión se crea el grupo de una; si no, se deja el intento anotado y se lleva a la
  // pantalla de cuenta: doCreateGroupOrder() se dispara solo apenas entre (ver
  // resumeWantedGroup, llamado desde el login/registro).
  if(wantsNewGroup){
    if(cust)doCreateGroupOrder();
    else{sndScreen='p_home';sndTab='points';showToast('Inicia sesión para organizar el pedido de tu oficina.');render();}
  }
  // ?entrega=TOKEN — el link del motorizado (#19). Va al final a propósito: si está, es lo
  // único que importa de esta visita y se lleva la pantalla entera.
  if(deliveryTokenFromUrl){
    sndScreen='delivery_confirm';deliveryConfirmState={loading:true};render();
    doConfirmDelivery();
  }
})();


// ── EL PANEL SE DESCARGA SOLO CUANDO SE ABRE ──────────────────────────────────────────
// Mismo patrón que `loadTesseract()` usa para los 3 MB del lector de comprobantes: se pide
// una vez, cuando de verdad hace falta, y nunca antes. Acá son ~230 KB de panel que dejan
// de viajar en el celular de cada cliente que abre la carta.
//
// El nombre lleva `?v=` con el sello del build, que hashea LOS DOS bundles: sin eso, un
// cambio solo en el panel se quedaría servido desde la caché del navegador bajo la misma
// URL, y el dueño vería su panel viejo sin un solo error de por medio.
var _adminBundle: Promise<void> | null = null;
var adminBundleError = '';
// ⚠ `adminBundleReady` no es un detalle: sin él, una pantalla de admin que NO EXISTE deja
// la app en un bucle infinito de render. `needsAdminBundle()` diría "falta el panel" para
// siempre —porque esa pantalla no va a aparecer en el registro nunca— y cada render pediría
// el bundle y volvería a pintar. Un cuelgue, que es peor que una pantalla en blanco.
// Lo encontró la prueba de la pantalla inventada, que existía justamente para el caso raro.
var adminBundleReady = false;
function loadAdminBundle(){
  if(_adminBundle)return _adminBundle;
  _adminBundle=new Promise<void>(function(resolve,reject){
    var sc=document.createElement('script');
    sc.src='admin.js?v='+APP_BUILD;
    sc.onload=function(){adminBundleError='';adminBundleReady=true;resolve();};
    // ⚠ Un fallo acá NO puede quedarse callado. Si el lector de comprobantes no carga, el
    // comprobante se abre igual y el OCR era un extra. Si el panel no carga, el dueño se
    // queda sin panel — y con el registro vacío el router lo mandaría al home del cliente
    // como si nada hubiera pasado. Se guarda el motivo para poder DECIRLO.
    sc.onerror=function(){
      _adminBundle=null;
      adminBundleError='No se pudo cargar el panel. Revisa tu conexión y vuelve a intentar.';
      reject(new Error(adminBundleError));
    };
    document.head.appendChild(sc);
  });
  return _adminBundle;
}
// ¿Esta pantalla necesita el panel y todavía no está? Lo pide y vuelve a pintar al llegar.
function needsAdminBundle(){
  if(adminBundleReady||adminBundleError)return false;
  return String(sndScreen||'').indexOf('admin')===0 && !ADMIN_SCREENS[sndScreen];
}
function render(){
  try{
    // Red de seguridad contra el bug de Culqi (ver el comentario largo junto a la
    // declaración de sndScreen): si un script de terceros vuelve a pisar la variable de
    // pantalla con algo que no es un string, la reponemos en vez de dejar que reviente
    // cada render y la app quede muerta. Renombrarla ya lo previene; esto es el cinturón
    // además de los tirantes, porque el costo es una comparación por render y el costo de
    // equivocarse es la app entera caída sin que nadie se entere.
    if(typeof sndScreen!=='string'){
      console.error('sndScreen fue sobrescrito por un script externo — reponiendo a o_home');
      sndScreen='o_home';
    }
    // El lado se aplica en CADA render y en UN solo sitio. Hacerlo dentro de cada onclick
    // que cambia de pantalla garantizaba lo contrario: la que se olvidara se quedaría del
    // color del otro hermano, sin romper nada y sin que nadie lo notara.
    // El armador y las bebidas son de WICHO —son las pantallas donde el cliente ELIGE—;
    // todo lo demás vive del lado de SANDO. El admin nunca: tiene su propia piel.
    // La decisión de lado vive en `ladoActual()` (02-*), UNA sola vez, porque también la
    // consulta `ACC()` para elegir el color de acento. Dos copias de esta condición serían
    // dos oportunidades de que el fondo diga un lado y el acento diga el otro.
    setLado(ladoActual());
    // Repone cualquier función nuestra que un bundle de terceros haya pisado desde el
    // render anterior (ver el bloque "BLINDAJE DE FUNCIONES GLOBALES" más abajo). Va acá
    // porque render() corre antes de pintar cada pantalla: si Culqi acaba de pisar `go`,
    // los onclick del HTML que estamos por generar ya salen apuntando a la función buena.
    if(typeof sndRestoreOwnedFns==='function')sndRestoreOwnedFns();
    // El panel viaja en su propio archivo desde el 2026-09-10. Si la pantalla es de admin y
    // todavía no llegó, se pide y se vuelve a pintar cuando esté. Mientras tanto se muestra
    // el cargando de siempre, no una pantalla en blanco ni el home del cliente.
    if(needsAdminBundle()){
      busy=true;busyMsg='Cargando el panel...';
      loadAdminBundle().then(function(){busy=false;render();}).catch(function(){busy=false;render();});
    }
    renderScreen();
  }catch(e){
    try{
      console.error('render() falló en la pantalla "'+sndScreen+'":',e);
      var appEl=(document.getElementById('app') as HTMLElement | null);
      if(appEl){
        appEl.innerHTML='<div style="min-height:100vh;background:#1E3932;padding:28px 22px;font-family:\'EB Garamond\',serif;color:#F2F0EB">'
          +'<div style="font-family:\'Bodoni Moda\',serif;font-size:22px;font-weight:640;color:#fff;margin-bottom:10px">Algo se rompió al abrir esta pantalla</div>'
          +'<p style="font-size:15px;line-height:1.55;color:#A8C8B0;margin-bottom:18px">No es culpa tuya. Toca el botón de abajo para recargar la app con la última versión; si vuelve a pasar, mándanos esta pantalla completa.</p>'
          +'<div style="background:#1A3028;border:1px solid #3A6B58;border-radius:8px;padding:14px 16px;font-size:13px;line-height:1.6;word-break:break-word;margin-bottom:20px">'
          +'<div style="color:'+GOLD+';font-weight:600;letter-spacing:.14em;font-size:11px;margin-bottom:8px">DETALLE //</div>'
          +'<div>Pantalla: '+esc(String(sndScreen))+'</div><div>Versión: '+esc(APP_BUILD)+'</div><div>Error: '+esc(String((e&&(e as any).message)||e))+'</div></div>'
          +'<button onclick="applyAppUpdate()" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:var(--sw-on-gold,#241a08);font-family:\'Bodoni Moda\',serif;font-size:15px;font-weight:700;padding:18px 0;border-radius:10px;text-align:center">Recargar la app</button></div>';
      }
    }catch(_){}
  }
}
// Pantallas del CLIENTE cuyo contenido es una lista de tarjetas: mientras cargan se pinta
// el armazón con bloques del tamaño real en vez del splash de pantalla completa. El número
// es cuántos bloques dibujar — se elige parecido a lo que suele llegar, porque un esqueleto
// que no se parece a lo que aparece después es peor que un spinner.
var LIST_SCREENS: Record<string, number> = {
  p_favorites: 3,
  p_addresses: 3,
  p_recurring: 2,
};

function renderScreen(){
  if(busy){
    var appElBusy=(document.getElementById('app') as HTMLInputElement | null);
    // El admin navega decenas de veces por turno — antes cada navegación (cola,
    // dashboard, inventario, etc.) mostraba el splash de pantalla completa (logo +
    // "CARGANDO //"), borrando todo el contexto previo, cuando ya existe skeletonCards()
    // para esto mismo del lado cliente (hallazgo de auditoría de diseño admin, ALTO).
    if(sndScreen.indexOf('admin')===0){appElBusy.innerHTML='<div style="min-height:100vh;background:var(--sw-bg,#1E3932);padding:20px" class="fi '+(adminLightMode?'admin-light':'admin-dark')+'">'+skeletonCards(4,64)+'</div>';}
    // Las pantallas de LISTA del cliente reciben el mismo trato que ya tenía el admin: el
    // armazón con bloques del tamaño real en vez del splash de pantalla completa. El splash
    // borra el contexto y deja al cerebro en una espera sin final a la vista; el esqueleto
    // dice qué viene. Solo aplica donde lo que llega ES una lista de tarjetas — en un cobro
    // o un login no hay armazón que anticipar y el splash sigue siendo lo correcto.
    else if(LIST_SCREENS[sndScreen]){appElBusy.innerHTML='<div style="min-height:100vh;background:var(--sw-bg,#1E3932);padding:20px" class="fi">'+skeletonCards(LIST_SCREENS[sndScreen],64)+'</div>';}
    else{appElBusy.innerHTML=LOAD(busyMsg);}
    return;
  }
  var h;
  // Identidad "Modo cocina de una mano" del panel admin (elegida por el dueño, ver
  // .admin-dark/.admin-light en shell.html) — antes el admin oscuro (el estado por
  // defecto) no tenía ninguna clase propia y heredaba el verde+dorado del cliente sin
  // querer; ahora SIEMPRE es un tema propio (negro puro + ámbar en oscuro, la paleta
  // clara ya existente en claro), nunca la piel del cliente. GOLD y STATUSES.c son
  // variables JS reasignables (mismo mecanismo ya usado antes solo para el modo claro),
  // así que todo lo que ya concatena '+GOLD+'/lee STATUSES[x].c en sAdmin*/DTILE/etc.
  // recoge el valor correcto sin tocar cada aparición individual.
  var adminScope=sndScreen.indexOf('admin')===0;
  var adminLight=adminScope&&adminLightMode;
  var _prevGold=GOLD;
  if(adminScope)GOLD=adminLight?'#8A5000':'#FFB020';
  // Semáforo de 3 colores (rojo/ámbar/verde) — nada de morado/azul decorativo, a
  // propósito: en "Modo cocina de una mano" el color se gasta SOLO en decir "qué tan
  // urgente/avanzado" un pedido, nunca como decoración. En claro se reusan variantes
  // oscurecidas ya verificadas por contraste WCAG AA (≥4.46:1) de la pasada anterior.
  var _prevStatusColors=null;
  if(adminScope){
    _prevStatusColors={};
    Object.keys(STATUSES).forEach(function(k){_prevStatusColors[k]=STATUSES[k].c;});
    if(adminLight){
      STATUSES.RECIBIDO.c='#B23A3A';
      STATUSES.PREPARANDO.c='#8A5000';
      STATUSES['EN CAMINO'].c='#A85200';
      STATUSES.ENTREGADO.c='#1B6B35';
      STATUSES.CANCELADO.c='#6B6350';
    }else{
      STATUSES.RECIBIDO.c='#FF4D4D';
      STATUSES.PREPARANDO.c='#FFB020';
      STATUSES['EN CAMINO'].c='#FF8A00';
      STATUSES.ENTREGADO.c='#3DDC84';
      STATUSES.CANCELADO.c='#8A8A8A';
    }
  }
  switch(sndScreen){
    case'o_home':      h=sOHome();break;
    case'o_sig':       h=sOSig();break;
    case'o_build':     h=sOBuild();break;
    case'o_item_confirm':h=sOItemConfirm();break;
    case'o_cart':      h=sOCart();break;
    case'o_sides':     h=sOSides();break;
    case'o_sent':      h=sOSent();break;
    case'p_auth':      h=sPAuth();break;
    // Registro con Google: un solo campo. Ver sGoogleAuth() en 05-*.
    case'p_gauth':     h=sGoogleAuth();break;
    // Primera apertura. Ver sHello() en 05-*.
    case'p_hello':     h=sHello();break;
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
    case'p_recurring': h=sPRecurring();break;
    case'gift_card':   h=sGiftCard();break;
    case'weekly_plan': h=sWeeklyPlan();break;
    case'group_order': h=sGroupOrder();break;
    case'p_addresses': h=sPAddresses();break;
    case'delivery_confirm':h=sDeliveryConfirm();break;
    // ── LAS 34 PANTALLAS DEL PANEL YA NO ESTÁN ESCRITAS ACÁ ────────────────────────
    // Estaban como 34 `case` fijos, y eso era lo que ataba el router al panel: mientras el
    // router nombrara cada pantalla de admin, el panel no se podía sacar del bundle que
    // descarga TODO cliente que abre la carta.
    //
    // Ahora el panel se registra a sí mismo en `ADMIN_SCREENS` al cargarse y el router solo
    // pregunta. Si el panel no está cargado no hay entrada y cae al home del cliente — que
    // es exactamente lo que tiene que pasar cuando alguien sin sesión de admin escribe una
    // pantalla de admin en la URL.
    default:
      var pantallaAdmin = ADMIN_SCREENS[sndScreen];
      // Si el panel no cargó, se DICE. Caer al home del cliente en silencio dejaría al
      // dueño sin panel y sin ninguna pista de por qué — el peor de los dos errores.
      h = pantallaAdmin
        ? pantallaAdmin()
        : (adminBundleError
            ? '<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;gap:14px">'
              + '<div style="font-family:\'Bodoni Moda\',serif;font-size:18px;font-weight:640;color:var(--sw-text,#FFFFFF)">El panel no cargó</div>'
              + '<p style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-muted,#A8C8B0);max-width:280px;line-height:1.55">'+esc(adminBundleError)+'</p>'
              + BTN('Reintentar //','adminBundleError=\'\';render()')
              + '</div>'
            : sOHome());
  }
  GOLD=_prevGold;
  if(_prevStatusColors)Object.keys(_prevStatusColors).forEach(function(k){STATUSES[k].c=_prevStatusColors[k];});
  var sameScreen=sndScreen===_lastRenderedSc,scrollY=window.scrollY;
  document.body.classList.toggle('no-fi',sameScreen);
  // Banner único y proactivo en vez de dejar que cada acción falle por separado con su
  // propio mensaje genérico — antes no había ninguna detección de modo sin conexión.
  var offlineBanner=isOffline?'<div style="background:var(--sw-warn,#ffa500);color:#1a1200;text-align:center;padding:6px;font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;letter-spacing:.1em;display:flex;align-items:center;justify-content:center;gap:5px">'+icon('warning',12,'#1a1200')+'<span>SIN CONEXIÓN — reconectando…</span></div>':'';
  // Nunca mientras hay una operación en vuelo (un pago, por ejemplo): recargar en medio
  // de un cobro es exactamente lo que no queremos ofrecerle al cliente.
  var updateBanner=(updateReady&&!busy)?'<button type="button" onclick="applyAppUpdate()" style="width:100%;border:0;background:var(--sw-gold,#C9A227);color:#1a1200;text-align:center;padding:8px 6px;min-height:44px;font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;letter-spacing:.08em;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">'+icon('refresh',13,'#1a1200')+'<span>NUEVA VERSIÓN DISPONIBLE — TOCA PARA ACTUALIZAR</span></button>':'';
  (document.getElementById('app') as HTMLInputElement | null).innerHTML='<div class="'+(adminScope?(adminLight?'admin-light':'admin-dark'):'')+'" style="min-height:100vh;display:flex;flex-direction:column;background:var(--sw-bg,#1E3932)">'+offlineBanner+updateBanner+h+'</div>';
  window.scrollTo(0,sameScreen?scrollY:0);
  _lastRenderedSc=sndScreen;
  // Antes esto era `if(sndScreen==='p_auth')`. El botón de Google ahora aparece en varias
  // pantallas (checkout, PUNTOS sin sesión, bienvenida), y mountGoogleButton() ya no hace
  // nada si no encuentra su punto de anclaje — así que preguntarle a cada render es más
  // barato que mantener una lista de pantallas que alguien va a olvidar actualizar.
  mountGoogleButton();
  renderOverlays();
  makeClickablesAccessible();
  // render() acaba de reconstruir todo el innerHTML, así que un campo ya marcado como
  // inválido perdió su borde rojo y su mensaje. repaintFields() los vuelve a pintar
  // revalidando el valor actual — es no-op mientras no haya ningún campo marcado.
  repaintFields();
}
