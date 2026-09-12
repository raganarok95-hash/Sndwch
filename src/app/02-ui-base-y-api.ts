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
// Escape cierra el overlay de arriba. Un diálogo modal sin salida por teclado deja
// atrapado a quien no usa el mouse: las tres capas se cerraban solo tocando un botón.
// Cancelar es siempre la salida segura (nunca confirma nada por accidente).
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  if(promptState){resolvePrompt(null);return;}
  if(confirmState){resolveConfirm(false);return;}
  if(adminToolsDrawerOpen){toggleAdminToolsDrawer();return;}
});

function renderOverlays(){
  var el=(document.getElementById('ui-overlays') as HTMLInputElement | null);
  if(!el)return;
  var html='';
  if(toastMsg){
    var isErr=toastType==='error';
    // bottom:92px, no 20px: deja despejada la barra de acción fija (AB(), z-index:100,
    // ~70-80px de alto con el total) que vive en la misma zona — antes el toast de
    // "agregado al carrito" la tapaba 3.2s justo en el momento en que el usuario busca
    // pagar (hallazgo P0 de crítica impeccable 2026-07-30).
    // role/aria-live: sin esto el aviso aparece y desaparece sin que un lector de pantalla
    // diga nada — "agregado al carrito" o el error de un pago quedaban mudos. `alert` para
    // los errores (interrumpe), `status` para el resto (espera a que termine la frase).
    html+='<div role="'+(isErr?'alert':'status')+'" aria-live="'+(isErr?'assertive':'polite')+'" style="position:fixed;left:16px;right:16px;bottom:92px;z-index:400;display:flex;justify-content:center" class="fi">'
      +'<div style="max-width:420px;width:100%;background:'+(isErr?'#3a1414':'#1A3028')+';border:1px solid '+(isErr?'rgba(255,85,85,.5)':'rgba(203,162,88,.4)')+';border-radius:12px;padding:14px 16px;display:flex;align-items:flex-start;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,.4)">'
      +'<div style="flex:1;font-family:\'EB Garamond\',serif;font-size:13px;color:'+(isErr?'#ffb3b3':'#F2F0EB')+';line-height:1.4">'+esc(toastMsg)+'</div>'
      +'<button onclick="dismissToast()" aria-label="Cerrar aviso" style="all:unset;cursor:pointer;color:'+(isErr?'#ffb3b3':'#A8C8B0')+';font-size:15px;line-height:1;padding:0 2px">&#10005;</button>'
      +'</div></div>';
  }
  if(confirmState){
    // role/aria-modal: sin esto un lector de pantalla sigue leyendo la pantalla de atrás
    // como si el diálogo no existiera, y el usuario confirma a ciegas.
    html+='<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:410;display:flex;align-items:flex-end;justify-content:center" class="fi">'
      +'<div role="dialog" aria-modal="true" aria-label="Confirmación" style="background:var(--sw-bg,#1E3932);border-radius:12px 14px 0 0;width:100%;max-width:420px;padding:24px 20px 20px;box-sizing:border-box">'
      +'<p style="font-family:\'EB Garamond\',serif;font-size:15px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-bottom:20px;white-space:pre-line">'+esc(confirmState.msg)+'</p>'
      +'<button onclick="resolveConfirm(true)" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:var(--sw-on-gold,#241a08);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;letter-spacing:.08em;padding:14px;border-radius:10px;text-align:center;margin-bottom:8px;box-sizing:border-box">Confirmar //</button>'
      +'<button onclick="resolveConfirm(false)" style="all:unset;cursor:pointer;display:block;width:100%;background:transparent;border:1px solid var(--sw-border,#3A6B58);color:var(--sw-text-muted,#A8C8B0);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.06em;padding:12px;border-radius:10px;text-align:center;box-sizing:border-box">Cancelar</button>'
      +'</div></div>';
  }
  if(promptState){
    html+='<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:420;display:flex;align-items:flex-end;justify-content:center" class="fi">'
      +'<div role="dialog" aria-modal="true" aria-label="Ingresa un dato" style="background:var(--sw-bg,#1E3932);border-radius:12px 14px 0 0;width:100%;max-width:420px;padding:24px 20px 20px;box-sizing:border-box">'
      +'<p style="font-family:\'EB Garamond\',serif;font-size:15px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-bottom:14px;white-space:pre-line">'+esc(promptState.msg)+'</p>'
      +'<input id="ui-prompt-input" type="'+promptState.inputType+'" value="'+esc(promptState.defVal)+'" autofocus onkeydown="if(event.key===\'Enter\')submitPrompt();" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;color:var(--sw-text,#FFFFFF);width:100%;font-size:15px;box-sizing:border-box;margin-bottom:16px">'
      +'<button onclick="submitPrompt()" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:var(--sw-on-gold,#241a08);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;letter-spacing:.08em;padding:14px;border-radius:10px;text-align:center;margin-bottom:8px;box-sizing:border-box">Aceptar //</button>'
      +'<button onclick="resolvePrompt(null)" style="all:unset;cursor:pointer;display:block;width:100%;background:transparent;border:1px solid var(--sw-border,#3A6B58);color:var(--sw-text-muted,#A8C8B0);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.06em;padding:12px;border-radius:10px;text-align:center;box-sizing:border-box">Cancelar</button>'
      +'</div></div>';
  }
  // Drawer de navegación lateral entre herramientas admin — ver toolsNav en H() y
  // adminToolsSections()/adminToolsGridHTML() (definidas junto a sAdminHome). Reusa la
  // misma lista de secciones que el grid de admin_home, en formato de filas compactas
  // (mejor lectura vertical que el grid de 2 columnas dentro de un panel angosto).
  if(adminToolsDrawerOpen){
    // Botón real, no un <div onclick>: las filas del drawer no eran alcanzables con
    // teclado ni se anunciaban como controles.
    var drawerRow=function(icn,label,action){return'<button type="button" onclick="adminToolsDrawerOpen=false;'+action+'" style="all:unset;box-sizing:border-box;width:100%;display:flex;align-items:center;gap:12px;padding:12px 4px;min-height:44px;cursor:pointer;border-bottom:1px solid var(--sw-border-soft,#1c1c1c)">'+icon(icn,17)+'<span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+label+'</span></button>';};
    html+='<div onclick="toggleAdminToolsDrawer()" style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:430" class="fi"></div>'
      +'<div role="dialog" aria-modal="true" aria-label="Herramientas de administración" style="position:fixed;top:0;right:0;bottom:0;width:82%;max-width:340px;background:var(--sw-bg,#1E3932);border-left:1px solid var(--sw-border,#3A6B58);z-index:431;overflow-y:auto;padding:20px" class="fi">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text,#FFFFFF)">Herramientas<span style="color:'+GOLD+'"> //</span></div><button onclick="toggleAdminToolsDrawer()" aria-label="Cerrar" style="all:unset;cursor:pointer;color:var(--sw-text-muted,#A8C8B0);font-size:18px;padding:4px">&#10005;</button></div>'
      +drawerRow('refresh','Cola de pedidos','loadAdmin()')
      +drawerRow('reportes','Panel de negocio','loadDashboard()')
      +adminToolsSections().map(function(section: any){
        return'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:18px 0 4px">'+section[0]+'</div>'
          +section[1].map(function(x){return drawerRow(x[0],x[1],x[2]);}).join('');
      }).join('')
      +'</div>';
  }
  // Botón flotante de soporte por WhatsApp — visible desde cualquier pantalla del
  // cliente (no en el panel admin, que ya tiene su propio WhatsApp con cada cliente).
  // Tampoco en las 2 pantallas de checkout (o_item_confirm/o_cart): al ser fixed en la
  // misma posición de pantalla sin importar el scroll, ahí se superponía físicamente al
  // campo TELÉFONO del formulario — un tap accidental (zona natural del pulgar) sacaba
  // al cliente de la app hacia WhatsApp a mitad de pago (hallazgo de auditoría UX, ALTO).
  // o_home agregado a la lista de exclusión: medido con Playwright a 390px, el botón caía
  // exactamente encima del precio 15CM de la cuarta fila del catálogo. Mismo choque que ya
  // había obligado a excluir el checkout y el carrito — la diferencia es que acá tapa la
  // información que decide la compra, no un campo de formulario. En el home el cliente
  // todavía tiene el enlace de WhatsApp del pie; el botón flotante sigue disponible en el
  // resto de pantallas, que es donde de verdad hace falta pedir ayuda.
  if(sndScreen.indexOf('admin')!==0&&sndScreen!=='o_item_confirm'&&sndScreen!=='o_cart'&&sndScreen!=='o_home'){
    var supportMsg=encodeURIComponent('Hola, necesito ayuda con mi pedido/cuenta en SND//WCH.');
    html+='<a href="https://wa.me/'+WA+'?text='+supportMsg+'" target="_blank" rel="noopener" style="position:fixed;right:16px;bottom:84px;z-index:150;width:50px;height:50px;border-radius:50%;background:'+GOLD+';display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.4);text-decoration:none" aria-label="Soporte por WhatsApp">'+icon('chat',24,'var(--sw-on-gold,#241a08)')+'</a>';
  }
  el.innerHTML=html;
  makeClickablesAccessible();
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
// El poll de 25s solo actualiza mientras sndScreen==='admin_home' (abajo) — antes, las 14
// pantallas secundarias (Inventario, Catálogo, Ficha de cliente, etc.) volvían a
// admin_home con un simple render() sin recargar nada, dejando la cola congelada con el
// estado de ANTES de salir hasta el próximo tick del poll (hasta 25s más) — justo en el
// momento en que el operador más necesita ver pedidos nuevos entrar (hallazgo de
// auditoría operativa, CRÍTICO). Los 15 botones "←" de esas pantallas ahora llaman a
// loadAdmin() en vez de solo render() — carga fresca + reinicia el poll al volver.
function startPoll(){
  if(pollTimer)clearInterval(pollTimer);
  pollTimer=setInterval(async function(){
    // admin_focus incluido (antes solo admin_home): el modo foco está pensado justo para
    // cocinar con las manos ocupadas mirando un pedido a la vez — y era la ÚNICA pantalla
    // donde el poll no corría, así que ni sonaba el aviso de pedido nuevo ni se
    // actualizaba la cola. Un pedido podía entrar sin que el dueño se enterara mientras
    // usaba la pantalla diseñada para no tener que mirar el celular (hallazgo de
    // auditoría de operación).
    if(sndScreen!=='admin_home'&&sndScreen!=='admin_focus')return;
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
        adminAddressFlags=r.addressFlags||null;
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
// Nombre visible de un ítem del catálogo: "Pollo // Teriyaki".
// ⚠ El separador solo va si hay algo del otro lado. Los TRES quesos tienen `s:''` (son
// nombres que no necesitan apellido — Mozzarella, Cheddar, Edam), así que esta función
// venía imprimiendo "Cheddar // " con la barra colgando en toda pantalla que muestre el
// queso elegido: el resumen del armado, la confirmación y el detalle del pedido. No
// rompía nada; solo se veía como un texto cortado a la mitad.
// Se arregla acá y no poniéndoles un subtítulo inventado a los quesos: rellenar un dato
// de producto que el dueño no escribió es exactamente lo que este repo no hace.
// Red de seguridad global. Casi toda la interacción de la app son handlers `onclick`
// en línea que llaman funciones globales; si una de ellas lanza, el navegador se traga
// el error en la consola y para el usuario simplemente "no pasa nada al tocar" — sin
// mensaje, sin pista, idéntico a un botón muerto. Eso hizo indiagnosticable a distancia
// el reporte del 2026-08-21 sobre ARMA EL TUYO. Ahora cualquier error suelto levanta una
// barra visible con la pantalla, el build y el mensaje: el dueño puede mandarnos una foto
// y sabemos exactamente qué pasó, en vez de adivinar.
var lastRuntimeError='';
// El inventario llega dentro de get-catalog (ver actGetCatalog), NO por PostgREST directo.
// Antes esta función hacía sbG('inventory',...) con la anon key, pero esa tabla tiene RLS
// activada sin políticas: PostgREST responde 200 [] — no un error — así que el catch nunca
// veía nada y invStock quedaba vacío para todos. Con el objeto vacío, isAvail() daba true
// siempre, y lo que el dueño marcaba SIN STOCK se seguía mostrando disponible.
function applyInventory(inv){
  invStock={};invQty={};
  if(!inv)return;
  Object.keys(inv).forEach(function(code){
    invStock[code]=inv[code].inStock;invQty[code]=inv[code].qty;
  });
}


// ── LO QUE LA APP CARGA AL ARRANCAR, Y CÓMO AVISA CUANDO ALGO SE ROMPE ────────────────
// Las tres cargas de fondo traen el catálogo, el horario y el inventario reales por encima
// de las semillas del código, y `showRuntimeError` es la barra que aparece cuando el
// JavaScript revienta. Las cuatro vivían en el archivo del panel, así que al partir el
// bundle el cliente arrancaba sin catálogo, sin horario y sin forma de avisar de nada —
// todo eso sin un solo error en consola.
function showRuntimeError(msg){
  if(!msg||lastRuntimeError===msg)return;
  lastRuntimeError=msg;
  try{
    var bar=document.getElementById('rt-err');
    if(!bar){
      bar=document.createElement('div');
      bar.id='rt-err';
      bar.setAttribute('style','position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#5A1414;color:#FFE8E8;padding:12px 16px calc(12px + env(safe-area-inset-bottom));font-family:\'EB Garamond\',serif;font-size:13px;line-height:1.5;box-shadow:0 -6px 20px rgba(0,0,0,.35)');
      document.body.appendChild(bar);
    }
    bar.innerHTML='<div style="font-weight:600;margin-bottom:4px">Algo falló en esta pantalla — mándanos esta foto</div>'
      +'<div style="opacity:.9;word-break:break-word">Pantalla: '+esc(String(sndScreen))+' · Versión: '+esc(APP_BUILD)+'</div>'
      +'<div style="opacity:.9;word-break:break-word">'+esc(String(msg))+'</div>'
      +'<button onclick="document.getElementById(\'rt-err\').remove();lastRuntimeError=\'\'" style="all:unset;cursor:pointer;margin-top:8px;color:#FFB3B3;text-decoration:underline;font-size:13px">cerrar</button>';
  }catch(_){}
}
async function loadInvBackground(){
  try{
    var r=await api('get-catalog',{});
    applyInventory(r.inventory);
  }catch(e){}
}
// Precios vigentes desde el panel admin (tabla catalog_prices vía get-catalog) — antes
// cambiar un precio requería editar el número hardcodeado aquí Y redesplegar el sitio.
// Muta PROTS/SIGS/SIDES/RWDS en el sitio en vez de cambiar cómo se leen en el resto del
// archivo, así el resto del pricing/checkout sigue funcionando igual.
async function loadCatalogBackground(){
  try{
    var r=await api('get-catalog',{});
    // El inventario viaja en la misma respuesta, así que el arranque no necesita una
    // segunda llamada para saber qué está agotado.
    applyInventory(r.inventory);
    PROTS.forEach(function(p){var v=r.proteins&&r.proteins[p.id];if(v){p.p15=v.p15;p.p30=v.p30;p.pDbl=v.pDbl;if(typeof v.pDbl30==='number')p.pDbl30=v.pDbl30;}});
    SIGS.forEach(function(s){var v=r.sigs&&r.sigs[s.id];if(v){s.p15=v.p15;s.p30=v.p30;}});
    // Signatures públicos editables desde el panel (2026-08-27). Antes de esto, `r.sigs`
    // solo traía precios: el nombre, el badge, el pitch, la foto y la composición vivían
    // como literales en el array SIGS de arriba, así que cambiar cualquiera de esos exigía
    // recompilar y desplegar. Ahora `r.sigItems` trae el ítem COMPLETO desde la tabla
    // `catalog_items` y este bloque lo vuelca sobre la entrada que ya existe en SIGS —
    // exactamente el mismo mecanismo que ya usaba el menú secreto abajo.
    //
    // El literal de SIGS pasa a ser SEMILLA: lo que se ve en el primer render, antes de que
    // este fetch resuelva, y el respaldo si el servidor no responde. Nunca lo edites para
    // cambiar el menú.
    if(r.sigItems){
      Object.keys(r.sigItems).forEach(function(id){
        var v=r.sigItems[id];if(!v)return;
        var sig=SIGS.find(function(x){return x.id===id;});
        // Un item_id que no está en la semilla de SIGS se AGREGA en vez de descartarse.
        // Antes se hacía `if(!sig)return;`, así que publicar un Signature nuevo desde el
        // panel lo dejaba pedible por API pero invisible en la carta: existía para el
        // servidor y no para el cliente. Que el panel pueda publicar un ítem nuevo es
        // justamente lo que hace que cambiar el menú no requiera desplegar.
        if(!sig){
          sig={id:id,n:'',s:'',badge:'',pitch:'',img:'',base:'B01',prot:'',tops:[],sauces:[],p15:0,p30:0};
          SIGS.push(sig);
        }
        if(v.n)sig.n=v.n;
        if(v.s)sig.s=v.s;
        // badge y pitch pueden quedar vacíos a propósito (un Signature sin badge), así que
        // se copian aunque vengan en blanco — usar `if(v.badge)` haría imposible QUITAR un
        // badge desde el panel, que es justo una de las cosas que se quiere poder hacer.
        if(typeof v.badge==='string')sig.badge=v.badge;
        if(typeof v.pitch==='string'&&v.pitch)sig.pitch=v.pitch;
        if(v.base)sig.base=v.base;
        if(v.prot)sig.prot=v.prot;
        if(Array.isArray(v.tops))sig.tops=v.tops;
        if(Array.isArray(v.sauces))sig.sauces=v.sauces;
        if(typeof v.p15==='number')sig.p15=v.p15;
        if(typeof v.p30==='number')sig.p30=v.p30;
        // El queso fijo VIAJA en sigItems desde que el panel edita el menú, pero este
        // bloque no lo volcaba: cambiar el queso de un Signature desde el panel no llegaba
        // nunca al cliente, que seguía mostrando (y contando como ingrediente) el de la
        // semilla. Se copia aunque venga en null, porque QUITAR el queso fijo es una de las
        // ediciones válidas — con `if(v.fixedCheese)` sería imposible.
        if('fixedCheese' in v)sig.fixedCheese=v.fixedCheese||null;
        if(typeof v.cheeseOptional==='boolean')sig.cheeseOptional=v.cheeseOptional;
        if(v.img)SIG_IMG[id]=v.img;
        // Retirar un Signature del menú (lo que con THE CHICAGO costó una sesión de código)
        // ahora es publicar active=false desde el panel. La receta queda guardada en la
        // tabla para cuando vuelva.
        sig.retired=(v.active===false);
      });
      // Los retirados salen de la carta. Se filtra acá y no en cada pantalla para que
      // ninguna vista tenga que acordarse de hacerlo.
      for(var i=SIGS.length-1;i>=0;i--)if(SIGS[i].retired)SIGS.splice(i,1);
      // Y hay que volver a limpiar el carrito guardado: restoreCart() corre en INIT, antes
      // de que este fetch resuelva, así que ahí SIGS todavía era la semilla del código y un
      // Signature retirado pasaba el filtro. Sin esto, quien tuviera uno en el carrito veía
      // una línea en blanco a S/0 y el servidor le rechazaba el pago.
      if(cart.length){
        var quedan=cart.filter(cartItemStillExists);
        if(quedan.length!==cart.length){
          cart=quedan;saveCart();
          if(!cart.length)appliedReward=null;
        }
      }
    }
    SIDES.forEach(function(d){var v=r.sides&&r.sides[d.id];if(typeof v==='number')d.p=v;});
    RWDS.forEach(function(rw){var v=r.rewardPts&&r.rewardPts[rw.id];if(typeof v==='number')rw.pts=v;});
    // Sándwich secreto con rotación mensual (decisión del dueño, 2026-08-10) — antes SIG05
    // era un literal fijo ('The Vault', Pollo Cajún) en el array de arriba. Ahora
    // r.secretSignature trae la composición vigente (nombre/pan/proteína/tops/salsas/
    // precio/minOrders) publicada desde Admin // Menú secreto, y este bloque la vuelca
    // sobre la misma entrada SIG05 ya presente en SIGS — el resto del código (vaultCard,
    // sigPreviewOverlayHTML, checkout) sigue leyendo esos mismos campos sin cambios.
    var secret=r.secretSignature;
    if(secret){
      var secretSig=SIGS.find(function(s){return s.id==='SIG05';});
      if(secretSig){
        secretSig.n=secret.name;secretSig.base=secret.base;secretSig.prot=secret.prot;
        secretSig.tops=secret.tops;secretSig.sauces=secret.sauces;
        secretSig.p15=secret.p15;secretSig.p30=secret.p30;secretSig.minOrders=secret.minOrders;
      }
      // vaultOnly ya no es un flag fijo en PROTS/TOPS/SAUCES (ver comentarios junto a
      // P03/T04/S02/S12 arriba) — se recalcula en cada refresco a partir de qué ids
      // manda el servidor este ciclo, para que ARMA EL TUYO excluya exactamente lo que
      // el sándwich secreto de este mes reserva para sí, ni más ni menos.
      PROTS.forEach(function(p){p.vaultOnly=(secret.vaultOnlyProts||[]).indexOf(p.id)>=0;});
      TOPS.forEach(function(t){t.vaultOnly=(secret.vaultOnlyTops||[]).indexOf(t.id)>=0;});
      SAUCES.forEach(function(sauce){sauce.vaultOnly=(secret.vaultOnlySauces||[]).indexOf(sauce.id)>=0;});
    }
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
    businessLaunched=r.businessLaunched===true;
    if(r.metaPixelId){metaPixelId=r.metaPixelId;initMetaPixel(r.metaPixelId);}
    // Mismo mecanismo que el píxel: el literal de 01-* es solo la semilla, y el valor real
    // llega del servidor. Sin esto, poner el secret no prendía "Continuar con Google" y el
    // único modo de arreglarlo era editar el literal y redesplegar el cliente entero.
    if(r.googleClientId)GOOGLE_CLIENT_ID=r.googleClientId;
    // La key de Google Maps viaja al cliente igual que el id del píxel: una key de navegador
    // es pública por diseño (se ve en el HTML de cualquier sitio que use Maps) y lo que la
    // protege es la restricción por referrer que se le pone en Google Cloud, no esconderla.
    // Llegando por acá se puede rotar sin desplegar el cliente.
    if(r.googleMapsKey)googleMapsKey=r.googleMapsKey;
    storePausedUntil=r.pausedUntil||null;
    // Capacidad (#23/#24/#16): qué franjas ya están llenas y cuántos pedidos tiene la
    // cocina por delante ahora mismo.
    fullHours=Array.isArray(r.fullHours)?r.fullHours:[];
    queueAhead=typeof r.queueAhead==='number'?r.queueAhead:0;
    if(typeof r.queueMinutesPerOrder==='number')queueMinutesPerOrder=r.queueMinutesPerOrder;
    if(typeof r.maxPerHour==='number')maxPerHour=r.maxPerHour;
  }catch(e){}
}


// ── ICONOS, DISTANCIA E INVENTARIO: COMPARTIDOS, NO DEL PANEL (2026-09-10) ────────────
// Estas cinco cosas vivían dentro de los archivos del panel, y el 2026-09-10 —al partir el
// bundle para que el panel dejara de viajar en el celular de cada cliente— resultó que el
// CLIENTE ENTERO dependía de ellas. Con el panel sin cargar, la app no pintaba una sola
// pantalla: `icon()` sola se usa 45 veces en las partes 01-07.
//
// Que estuvieran ahí nunca rompió nada mientras todo viajaba en un mismo archivo. Ése es
// justo el punto: un acoplamiento así no se manifiesta hasta el día que intentas separar,
// y entonces se manifiesta como la app en blanco.
//
//   · ICONS / icon / iconTxt  — el juego de íconos de toda la interfaz
//   · haversineKm             — la distancia con la que se COBRA el envío (`deliveryKmNow`)
//   · invQty                  — el stock que decide si un Signature se ofrece o sale agotado
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
  // Olla con vapor — la receta acá es producción por tandas, no un libro de cocina.
  recipe:'<path d="M5 10h14v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6z"/><path d="M3 10h18"/><path d="M9 6c0-1 1-1 1-2M13 7c0-1 1-1 1-2"/>',
  caja:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.3"/>',
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
  flor:'<circle cx="12" cy="12" r="1.6"/><path d="M12 3.5c1.8 1.8 1.8 4.7 0 6.5-1.8-1.8-1.8-4.7 0-6.5z"/><path d="M12 20.5c1.8-1.8 1.8-4.7 0-6.5-1.8 1.8-1.8 4.7 0 6.5z"/><path d="M3.5 12c1.8-1.8 4.7-1.8 6.5 0-1.8 1.8-4.7 1.8-6.5 0z"/><path d="M20.5 12c-1.8-1.8-4.7-1.8-6.5 0 1.8 1.8 4.7 1.8 6.5 0z"/>',
  hoja:'<path d="M5 19c-1-6 1.5-13 13-14 1 8-4 13-13 14z"/><path d="M6.5 17.5c3-4 6-7 10.5-11.5"/>',
  vapor:'<path d="M5 10h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-5z"/><path d="M16 11.5h1.3a2 2 0 0 1 0 4H16"/><path d="M8 7c-.5-.9.5-1.4 0-2.3M11.3 7c-.5-.9.5-1.4 0-2.3M14.6 7c-.5-.9.5-1.4 0-2.3"/>',
  queso:'<path d="M3 17 12 4l9 13z"/><circle cx="10" cy="13.5" r="1"/><circle cx="14" cy="11" r="1"/><circle cx="12.5" cy="15.5" r="1"/>',
  camera:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.5-2.5h5L16 7"/><circle cx="12" cy="13.5" r="3.5"/>',
  lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  moto:'<circle cx="6.5" cy="18" r="2.3"/><circle cx="17" cy="18" r="2.3"/><path d="M8.5 18h6l2-5.5h3M14 12.5l-2-4H8l-1 3"/><path d="M6.5 15.5h3"/>',
  check:'<path d="M4 12.5l5 5L20 6"/>',
  megaphone:'<path d="M3 10v4h3l7 4V6l-7 4H3z"/><path d="M13 8.5a4 4 0 0 1 0 7"/><path d="M16 6a7 7 0 0 1 0 12"/>',
  phone:'<path d="M6 4h3l1.5 4-2 1.6a11.5 11.5 0 0 0 5.4 5.4l1.6-2 4 1.5v3a2 2 0 0 1-2.2 2C10.4 18.9 5.1 13.6 4 8.2A2 2 0 0 1 6 4z"/>',
  gps:'<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="1.3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  clip:'<path d="M8 12.5V6.5a4 4 0 0 1 8 0v9a2.5 2.5 0 0 1-5 0V8"/>',
  card:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/>',
  cash:'<rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9v.01M18 15v.01"/>',
  coin:'<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.3c0-1 1-1.8 2.5-1.8s2.5.8 2.5 1.6c0 2.4-5 1.4-5 3.8 0 .9 1.1 1.6 2.5 1.6s2.5-.7 2.5-1.7"/><path d="M12 6v1.2M12 16.8V18"/>',
  refresh:'<path d="M4 12a8 8 0 0 1 13.6-5.7L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-13.6 5.7L4 16"/><path d="M4 20v-4h4"/>',
  moon:'<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sun:'<circle cx="12" cy="12" r="4.5"/><path d="M12 3v2.2M12 18.8V21M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M3 12h2.2M18.8 12H21M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>',
  printer:'<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="1.5"/><rect x="7" y="14" width="10" height="6"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>',
  warning:'<path d="M12 4 3 20h18L12 4z"/><path d="M12 10v4M12 17v.01"/>',
  calendar:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  grid:'<circle cx="6" cy="6" r="1.7"/><circle cx="12" cy="6" r="1.7"/><circle cx="18" cy="6" r="1.7"/><circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/><circle cx="6" cy="18" r="1.7"/><circle cx="12" cy="18" r="1.7"/><circle cx="18" cy="18" r="1.7"/>',
};
function icon(name,size?,color?){return'<svg width="'+(size||18)+'" height="'+(size||18)+'" viewBox="0 0 24 24" fill="none" stroke="'+(color||GOLD)+'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">'+(ICONS[name]||'')+'</svg>';}
function iconTxt(name,label,color?){return'<span style="display:inline-flex;align-items:center;gap:5px;vertical-align:middle">'+icon(name,13,color)+'<span>'+label+'</span></span>';}
function haversineKm(lat1,lon1,lat2,lon2){
  var R=6371;
  var dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
var invQty={};

function fn(arr,id){var i=arr.find(function(x){return x.id===id;});return i?(i.s?i.l+' // '+i.s:i.l):'';}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
// Valida DD/MM/AAAA y que la fecha exista de verdad en el calendario (antes solo se
// validaba el formato con regex — "31/02/2026" pasaba igual aunque febrero no tenga 31
// días, hallazgo de auditoría de UX). new Date hace roll-over silencioso de fechas
// imposibles (31/02 se vuelve 03/03), así que comparamos los 3 campos contra lo que
// realmente quedó construido para detectar ese roll-over.
function parseBdayDDMMYYYY(raw){
  var m=String(raw||'').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(!m)return null;
  var d=parseInt(m[1],10),mo=parseInt(m[2],10),y=parseInt(m[3],10);
  var dt=new Date(y,mo-1,d);
  if(dt.getFullYear()!==y||dt.getMonth()!==mo-1||dt.getDate()!==d)return null;
  return y+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}
// Bloque de texto legal titulado — usado por sPLegal() y sPReturns() (antes cada una
// tenía su propia copia idéntica de este helper).
function sec(t,b){return'<div style="margin-bottom:20px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:8px">'+t+'</div><p style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-muted,#A8C8B0);line-height:1.6">'+b+'</p></div>';}
function isAvail(code){return invStock[code]!==false;}
// El corte de marca, como componente. `alto` acepta cualquier medida CSS; los llamantes
// que lo usan de divisor a pantalla completa le pasan '100%' y lo posicionan absoluto con
// un desborde arriba y abajo, para que las barras salgan del encuadre en vez de terminar
// en punta dentro de la pantalla.
function CUT(alto?,ancho?,gap?){
  var st='height:'+(alto||'100%')+(ancho?';width:'+ancho:'');
  return'<div class="sw-cut" aria-hidden="true"'+(gap?' style="gap:'+gap+'"':'')+'>'
    +'<i style="'+st+'"></i><i style="'+st+'"></i></div>';
}
// ── EL ACENTO ES DEL LADO; EL DORADO ES DEL DINERO ────────────────────────────────────
//
// Regla que faltaba y que se notó al pintar el armador sobre el mundo de WICHO: el dorado
// estaba haciendo DOS trabajos a la vez — marcar los precios y marcar lo interactivo. En el
// lado celeste eso choca: un botón dorado sobre azul se lee como si fuera plata.
//
// A partir de acá:
//   · `GOLD`  = dinero. Precios, totales, recompensas. NO cambia entre lados, a propósito:
//               un precio que cambia de color según dónde estás es justo la duda que no
//               queremos en un checkout, y hay una prueba que lo fija.
//   · `ACC()` = el acento del lado. Pasos, selección, énfasis. Cambia con el hermano.
// Si un elemento no sabe cuál de los dos le toca, la pregunta es si muestra plata o no.
// ── DE QUIÉN ES ESTA PANTALLA ─────────────────────────────────────────────────────────
// La regla es una sola y no admite excepciones cómodas:
//
//     verde de SANDO  = lo que YA está decidido    (la receta cerrada, tus pedidos, el panel)
//     celeste de WICHO = donde ELIGES tú           (armas, canjeas, guardas, invitas)
//
// Si una pantalla nueva no cae claramente de un lado, es señal de que no sabemos qué le
// estamos pidiendo al cliente en ella. Eso es lo que la regla vale: no es un tema, es una
// pregunta que hay que poder responder de cada pantalla.
//
// Pedido explícito del dueño (2026-09-10): "que estén mitad a mitad los colores en toda la
// web". Con el armador y las bebidas solamente, WICHO tenía DOS pantallas de unas cuarenta
// — la app era verde con dos excepciones. Las que se suman ahora no se eligieron para
// llegar a una cuota: cada una es literalmente una pantalla donde el cliente decide.
//
// ⚠ El admin es de SANDO SIEMPRE, aunque el dueño esté eligiendo cosas todo el rato. No es
// una pantalla de cliente y el celeste ahí no significaría nada.
var LADO_WICHO=[
  'o_build',      // armas el sándwich
  'o_sides',      // eliges la bebida
  'p_rewards',    // eliges qué canjear
  'p_favorites',  // tus armados guardados
  'p_recurring',  // eliges qué se repite y cuándo
  'gift_card',    // eliges a quién le regalas
  'group_order'   // cada quien arma el suyo
];
function ladoActual(){
  if(/^admin/.test(String(sndScreen||'')))return'sando';
  if(LADO_WICHO.indexOf(String(sndScreen||''))>=0)return'wicho';
  if(sndScreen==='o_home'&&(homeTab==='byo'||homeTab==='drink'))return'wicho';
  return'sando';
}
function ACC(){return ladoActual()==='wicho'?'var(--sw-sky,#8CC8EC)':GOLD;}
// El texto que va ENCIMA del acento. Sobre celeste nunca es blanco: no contrasta.
function ACC_INK(){return ladoActual()==='wicho'?'var(--sw-sky-ink,#0E1A17)':'var(--sw-on-gold,#241a08)';}

// Uno de los dos hermanos, como elemento de interfaz. `activo` dispara su reacción y,
// en el caso de WICHO, pone a girar su ojo. El ojo se dibuja ENCIMA del de la ilustración
// (mismo centro y radio, muestreados del archivo) porque una espiral es geometría y se
// puede redibujar; una sonrisa nueva no, ésa exige dibujo del dueño.
function BRO(quien,ancho,activo?){
  var esW=quien==='wicho';
  var ojo=esW?'<div class="sw-eye">'+SPIRAL(60,'#503C64',!!activo)+'</div>':'';
  return'<div class="sw-bro'+(activo?' sw-on':'')+'" style="width:'+ancho+'">'
    +'<img class="sw-bro-'+quien+'" src="img/'+quien+'.png" alt="'+(esW?'WICHO':'SANDO')+'" loading="lazy">'
    +ojo+'</div>';
}
// La espiral del ojo de WICHO. `gira` la convierte en el indicador de carga.
function SPIRAL(size,color,gira?){
  var n=148,vueltas=3.2,r=(size/2)-2.4,pts=[];
  for(var i=0;i<=n;i++){
    var t=(i/n)*vueltas*2*Math.PI;
    var rr=(t/(vueltas*2*Math.PI))*r;
    pts.push((size/2+rr*Math.cos(t)).toFixed(1)+','+(size/2+rr*Math.sin(t)).toFixed(1));
  }
  return'<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" fill="none"'
    +(gira?' class="sw-spiral"':'')+' style="flex-shrink:0" aria-hidden="true">'
    +'<path d="M'+pts.join(' L')+'" stroke="'+color+'" stroke-width="2.4" stroke-linecap="round"/></svg>';
}
function protPrice(p){return !p||!size?0:(size==='15'?p.p15:p.p30);}
function sigPrice(s){return !s||!size?0:(size==='15'?s.p15:s.p30);}
// Proteína "de referencia" para el precio de doble proteína: la del signature
// elegido, o la elegida en Build Your Own.
// Devolver null aquí apaga la doble proteína ENTERA para esa proteína: total() deja de
// sumar el recargo, la fila "Doble" no se pinta y el upsell de confirmación pasa de largo
// a la salsa extra. Un solo punto de corte en vez de tres condiciones repetidas.
//
// P04 (atún) queda fuera por decisión del dueño (2026-08-21), y el número lo respalda: el
// recargo `pDbl` es plano pero la porción que agrega SÍ escala con el tamaño, así que en
// un 30CM se cobraban S/9 por 170g de atún que cuestan S/11.39 — el negocio PERDÍA S/2.39
// en cada doble de atún. Además 170g de ensalada de atún en un pan de 30CM es un sándwich
// que se desarma. El servidor lo rechaza también (NO_DOUBLE_PROTS en catalog.ts): esto
// solo evita ofrecerlo en la UI.
function dblProtRef(){
  var sig=SIGS.find(function(x){return x.id===sigId;});
  var protId=mode==='sig'?(sig?sig.prot:null):prot;
  var p: any=PROTS.find(function(x){return x.id===protId;});
  return (p&&p.noDouble)?undefined:p;
}
// Recargo de doble proteína del tamaño pedido. Único punto donde se decide pDbl vs
// pDbl30 en el cliente — si agregas un cálculo nuevo de doble proteína, pásalo por acá.
// DEBE coincidir con dblFee() en supabase/functions/api/catalog.ts.
function dblFee(pr,sz){return !pr?0:(sz==='30'?pr.pDbl30:pr.pDbl);}
// Precio del sándwich que se está armando ahora mismo.
//
// ⚠ NO REIMPLEMENTES LA FÓRMULA ACÁ. Esto delega en `itemUnitPrice()`, que es la que ya
// usan el carrito, el checkout y el mensaje de WhatsApp — y la que el servidor replica.
//
// Estaba escrita dos veces y las dos copias YA habían divergido: `itemUnitPrice()` suma el
// recargo del pan de focaccia (`baseSurcharge`) y `total()` no. O sea que en ARMA EL TUYO
// con focaccia el armador anunciaba S/13.90 durante todo el flujo y el carrito cobraba
// S/14.40 apenas se agregaba. El cliente no pierde plata —el cobro correcto es el del
// carrito— pero ve cambiar el precio sin haber tocado nada, que es la peor forma de llegar
// a un checkout. Es el mismo defecto que ya costó tres semanas de precios fantasma, en
// chico: dos sitios fijando el mismo número y uno ganando en silencio.
//
// El recargo del pan existe SOLO en ARMA EL TUYO — en un Signature la receta fija el pan y
// el cliente no lo elige, así que no hay nada que recargar. Eso ya lo sabe itemUnitPrice.
function total(){
  if(!size)return 0;
  return money(itemUnitPrice(currentBuiltItem()));
}
// ── LOS PUNTOS QUE PROMETE EL CARRITO SON LOS QUE OTORGA EL SERVIDOR ──────────────────
// DEBE coincidir con `pointsFor()` en supabase/functions/api/actions/orders.ts.
//
// El carrito mostraba `cartFinalTotal()` crudo, o sea el total con decimales: un pedido de
// S/25.90 prometía "+25.9 pts". Dos defectos en un solo número:
//
//   1. Un punto y medio no existe. Las columnas de puntos son `integer` — ese detalle ya
//      costó un defecto en produccción, con `pointsFor` reventando DESPUÉS de que Culqi
//      había cobrado (ver tests-api/dinero.test.ts).
//   2. El servidor redondea, así que otorga 26. El cliente prometía 25.9 y entregaba otra
//      cosa. Poco, pero es el programa de fidelidad: es literalmente la cuenta que el
//      cliente lleva para saber cuándo le toca su sándwich gratis.
//
// El delivery NO da puntos, y eso no es un detalle: es pass-through al motorizado, plata
// que nunca fue del negocio. Premiarla sería regalar puntos por la distancia a la que vive
// el cliente.
function pointsFor(total,deliveryFee){return Math.round(total-(deliveryFee||0));}
function szLabel(sz){return sz==='15'?'15CM':sz==='30'?'30CM':'';}
// ── LA BANDA DEL HERMANO ──────────────────────────────────────────────────────────────
// El hermano que manda en la pantalla, presentándola. Nació como un bloque suelto dentro
// del armador ("Con WICHO"); lo usan ahora las DOS listas donde el cliente elige algo, que
// es justo donde el dueño pidió que estuvieran presentes.
//
// Reacciona a cada toque sin una sola línea de estado: `render()` rehace el DOM, y en
// estas dos pantallas un render ocurre exactamente cuando se toca una opción, así que la
// animación se reproduce desde cero cada vez (ver `.sw-nudge` en shell.html).
//
// El ojo espiral acompaña SOLO a WICHO y gira de verdad — es geometría redibujada en SVG,
// no un cuadro de animación. SANDO no lo lleva porque no lo tiene: inventárselo sería
// dibujarle algo que su ilustración no dice.
// `activo` = el cliente ya eligió algo en esta pantalla. Entonces el hermano cambia de
// POSE, no solo de posición: saluda. Hasta el 2026-09-10 esto solo se podía hacer con
// WICHO —de SANDO existía UNA sola pose— y ese desbalance estaba anotado en
// marca/PERSONAJES.md como algo que solo el dueño podía destrabar. Lo destrabó: mandó seis
// poses nuevas, incluida la sonrisa que había pedido para el momento de confirmar.
function CAB(quien,texto,activo?){
  var esW=quien==='wicho';
  var pose=activo?'saluda':'cuerpo';
  return'<div style="display:flex;align-items:flex-end;gap:11px;margin-bottom:14px">'
    // ⚠ Se fija la ALTURA y no el ancho: los dos cuerpos son de 640 px de alto pero de
    // ancho distinto (WICHO 448, SANDO 302), así que con un ancho fijo SANDO salía casi
    // 50% más alto que su hermano y la banda cambiaba de tamaño según de quién fuera.
    +'<img class="sw-nudge" src="img/'+quien+'_'+pose+'.png" alt="'+(esW?'WICHO':'SANDO')+'" loading="lazy" style="height:62px;width:auto;flex-shrink:0">'
    +'<div style="flex:1;padding-bottom:4px">'
    +'<div style="display:flex;align-items:center;gap:5px">'
    +(esW?'<span style="display:inline-flex">'+SPIRAL(11,'var(--sw-spiral,#C3A6D2)',true)+'</span>':'')
    +'<span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;letter-spacing:.24em;'
    +'text-transform:uppercase;color:'+ACC()+'">Con '+(esW?'WICHO':'SANDO')+'</span></div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;'
    +'color:var(--sw-text-muted,#A8C8B0);line-height:1.35;margin-top:2px">'+esc(texto)+'</div></div></div>';
}
// ── EL ESTADO VACÍO ES DONDE VIVEN LOS HERMANOS ───────────────────────────────────────
// Pedido del dueño (2026-09-10): que los personajes estén presentes en toda la web, no
// solo en el menú. El estado vacío es el mejor sitio para eso y el más honesto: es una
// pantalla que hoy no tiene NADA que mostrar —un ícono gris de 32 px y dos líneas de
// texto sobre medio metro de fondo— así que poner al hermano ahí no le quita espacio a
// ningún dato. Es la diferencia entre "no hay nada" y "todavía no hay nada".
//
// Quién aparece lo decide `ladoActual()`, no un parámetro: si la pantalla es de WICHO,
// aparece WICHO. Dejarlo elegir a mano sería la forma de que un día no coincidan el color
// de la pantalla y el hermano que la habita.
//
// ⚠ LOS DOS HERMANOS NO TIENEN LAS MISMAS POSES, y por eso existe este mapa en vez de
// concatenar el nombre del estado al del personaje. En `img/` hay hoy siete poses de SANDO
// (cuerpo, grita, mira, piensa, saluda, serio, sonrie) y cuatro de WICHO (cuerpo, grita,
// rie, saluda). Pedir `img/wicho_piensa.png` no da un error de compilación ni de runtime:
// da una imagen rota en la pantalla del cliente, que es el peor sitio para enterarse.
//
// Cada estado declara qué archivo usa PARA CADA HERMANO, y donde WICHO no tiene la pose
// cae a `cuerpo`, que sí existe. Eso deja el hueco a la vista en vez de taparlo: las tres
// entradas donde WICHO dice 'cuerpo' son exactamente las tres poses que faltan por generar
// (ver docs/PROMPTS_PERSONAJES.md § 4.3).
var POSES: Record<string, Record<string, string>> = {
  cuerpo: { sando: 'cuerpo', wicho: 'cuerpo' },
  saluda: { sando: 'saluda', wicho: 'saluda' },
  grita:  { sando: 'grita',  wicho: 'grita'  },
  alegre: { sando: 'sonrie', wicho: 'rie'    },
  // WICHO todavía no tiene estas tres:
  mira:   { sando: 'mira',   wicho: 'cuerpo' },
  piensa: { sando: 'piensa', wicho: 'cuerpo' },
  serio:  { sando: 'serio',  wicho: 'cuerpo' },
};
function broPose(quien,estado){
  var fila=POSES[estado||'cuerpo']||POSES.cuerpo;
  return 'img/'+quien+'_'+(fila[quien]||'cuerpo')+'.png';
}

function VACIO(titulo,texto,cta?,estado?){
  var quien=ladoActual();
  return'<div style="text-align:center;padding:34px 10px 10px">'
    +'<img src="'+broPose(quien,estado)+'" alt="" aria-hidden="true" loading="lazy" style="height:150px;width:auto;opacity:.85;margin-bottom:14px">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:'+ACC()+';letter-spacing:.2em">'+esc(titulo)+' //</div>'
    +'<p style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-muted,#A8C8B0);margin:10px auto 0;max-width:280px;line-height:1.55">'+texto+'</p>'
    +(cta||'')
    +'</div>';
}
// ── ETIQUETA · EL PAPEL ───────────────────────────────────────────────────────────────
// La cuarta dirección visual que eligió el dueño, y la única con un límite explícito de su
// parte: "etiqueta, pero solo para los recibos de pago". O sea que no es un estilo para
// decorar la app — es lo que se pone cuando se está rindiendo cuentas de plata.
//
// Por eso rompe la paleta a propósito: papel claro y tinta negra en una app oscura, en
// monoespaciada, con el corte punteado. Se ve como un ticket porque ES un ticket, y esa
// diferencia de material es la que hace que se lea distinto del resto de la pantalla.
//
// Vive acá y no en la pantalla del carrito porque ahora la usan DOS: el carrito y la
// confirmación del sándwich. Dos copias del mismo papel terminan en que una cambia y la
// otra no, y entonces la app tiene dos formas de contar la misma cuenta.
//
// ⚠ Los colores son literales a propósito y NO son tokens de la paleta: no deben moverse
// cuando la app cambia de lado (verde de SANDO / celeste de WICHO). Un recibo que cambia
// de color según en qué parte del menú estabas parece otro documento.
var PAPEL_TINTA='#1A1A18',PAPEL_FONDO='#F6F2E7',PAPEL_MUDO='#6A665C',PAPEL_AHORRO='#2E6B4F';
var PAPEL_MONO='font-family:ui-monospace,SFMono-Regular,Menlo,monospace';
function PAPEL_ABRE(titulo){
  return'<div style="background:'+PAPEL_FONDO+';color:'+PAPEL_TINTA+';border-radius:4px;padding:15px;margin-bottom:12px;'+PAPEL_MONO+'">'
    +'<div style="font-size:9px;letter-spacing:.2em;color:'+PAPEL_MUDO+'">'+esc(titulo)+'</div>'
    +'<div style="border-top:1px dashed '+PAPEL_TINTA+';margin:9px 0 7px"></div>';
}
// Corte grueso + el importe grande. Es el cierre de cualquier papel.
function PAPEL_TOTAL(rotulo,monto){
  return'<div style="border-top:2px solid '+PAPEL_TINTA+';margin:8px 0 7px"></div>'
    +'<div style="display:flex;justify-content:space-between;align-items:baseline">'
    +'<span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600">'+esc(rotulo)+'</span>'
    +'<span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:28px;font-weight:640">'+SOLES+pz(monto)+'</span></div>'
    +'</div>';
}
// Una línea del papel. `tono` no es decoración: 'ahorro' es lo que el cliente NO paga y
// 'mudo' es lo que todavía no se puede saber. Un descuento en la misma tinta que el resto
// se lee como un cargo más.
function reciboLinea(k,v,tono?){
  var col=tono==='ahorro'?PAPEL_AHORRO:tono==='mudo'?PAPEL_MUDO:PAPEL_TINTA;
  return'<div style="display:flex;justify-content:space-between;gap:10px;font-size:11px;color:'+col+';padding:3px 0">'
    +'<span>'+esc(k)+'</span><span style="font-weight:700">'+v+'</span></div>';
}
// Toggle de tamaño reutilizado en Signature y Build Your Own. El borde de lo elegido es
// ACC() y no GOLD: la selección es ESTADO, y el dorado es del dinero. Estaba haciendo los
// dos trabajos a la vez, y en el mundo celeste un control dorado se lee como plata.
function SZTOG(){
  function opt(sz,l,d){var sel=size===sz;return'<div onclick="size=\''+sz+'\';render()" style="flex:1;background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?ACC():'var(--sw-border,#3A6B58)')+';border-radius:10px;padding:14px;cursor:pointer;text-align:center;position:relative;box-shadow:'+SHADOW_SM+'">'+selBar(sel)+'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:'+(sel?'#FFFFFF':'#A8C8B0')+'">'+l+'</div><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+d+'</div></div>';}
  // "Individual"/"Clásico" no comunicaban porción real (hallazgo de auditoría UX, MEDIO)
  // — un cliente sin contexto de la marca no sabía si "Clásico" alcanzaba para compartir.
  return ST('00','Tamaño','Elige antes de continuar.')+'<div style="display:flex;gap:8px;margin-bottom:6px">'+opt('15','15CM','Para uno')+opt('30','30CM','Para compartir')+'</div><div style="height:1px;background:var(--sw-bg,#1E3932);margin:20px 0"></div>';
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
function stBadge(st){var s=STATUSES[st]||STATUSES['RECIBIDO'];var ic=s.icon?(ICONS[s.icon]?icon(s.icon,11,s.c):s.icon+' '):'';return'<span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+s.c+';background:'+s.c+'18;border:1px solid '+s.c+'44;border-radius:4px;padding:3px 9px;letter-spacing:.1em;display:inline-flex;align-items:center;gap:4px">'+ic+(s.label||st)+'</span>';}
