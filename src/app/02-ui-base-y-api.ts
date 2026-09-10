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
      +'<button onclick="dismissToast()" aria-label="Cerrar aviso" style="all:unset;cursor:pointer;color:'+(isErr?'#ffb3b3':'#A8C8B0')+';font-size:16px;line-height:1;padding:0 2px">&#10005;</button>'
      +'</div></div>';
  }
  if(confirmState){
    // role/aria-modal: sin esto un lector de pantalla sigue leyendo la pantalla de atrás
    // como si el diálogo no existiera, y el usuario confirma a ciegas.
    html+='<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:410;display:flex;align-items:flex-end;justify-content:center" class="fi">'
      +'<div role="dialog" aria-modal="true" aria-label="Confirmación" style="background:var(--sw-bg,#1E3932);border-radius:14px 14px 0 0;width:100%;max-width:420px;padding:24px 20px 20px;box-sizing:border-box">'
      +'<p style="font-family:\'EB Garamond\',serif;font-size:14px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-bottom:20px;white-space:pre-line">'+esc(confirmState.msg)+'</p>'
      +'<button onclick="resolveConfirm(true)" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:var(--sw-on-gold,#241a08);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;letter-spacing:.08em;padding:14px;border-radius:10px;text-align:center;margin-bottom:8px;box-sizing:border-box">Confirmar //</button>'
      +'<button onclick="resolveConfirm(false)" style="all:unset;cursor:pointer;display:block;width:100%;background:transparent;border:1px solid var(--sw-border,#3A6B58);color:var(--sw-text-muted,#A8C8B0);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.06em;padding:12px;border-radius:10px;text-align:center;box-sizing:border-box">Cancelar</button>'
      +'</div></div>';
  }
  if(promptState){
    html+='<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:420;display:flex;align-items:flex-end;justify-content:center" class="fi">'
      +'<div role="dialog" aria-modal="true" aria-label="Ingresa un dato" style="background:var(--sw-bg,#1E3932);border-radius:14px 14px 0 0;width:100%;max-width:420px;padding:24px 20px 20px;box-sizing:border-box">'
      +'<p style="font-family:\'EB Garamond\',serif;font-size:14px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-bottom:14px;white-space:pre-line">'+esc(promptState.msg)+'</p>'
      +'<input id="ui-prompt-input" type="'+promptState.inputType+'" value="'+esc(promptState.defVal)+'" autofocus onkeydown="if(event.key===\'Enter\')submitPrompt();" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;color:var(--sw-text,#FFFFFF);width:100%;font-size:16px;box-sizing:border-box;margin-bottom:16px">'
      +'<button onclick="submitPrompt()" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:var(--sw-on-gold,#241a08);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;letter-spacing:.08em;padding:14px;border-radius:10px;text-align:center;margin-bottom:8px;box-sizing:border-box">Aceptar //</button>'
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
    var drawerRow=function(icn,label,action){return'<button type="button" onclick="adminToolsDrawerOpen=false;'+action+'" style="all:unset;box-sizing:border-box;width:100%;display:flex;align-items:center;gap:12px;padding:12px 4px;min-height:44px;cursor:pointer;border-bottom:1px solid var(--sw-border-soft,#1c1c1c)">'+icon(icn,17)+'<span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+label+'</span></button>';};
    html+='<div onclick="toggleAdminToolsDrawer()" style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:430" class="fi"></div>'
      +'<div role="dialog" aria-modal="true" aria-label="Herramientas de administración" style="position:fixed;top:0;right:0;bottom:0;width:82%;max-width:340px;background:var(--sw-bg,#1E3932);border-left:1px solid var(--sw-border,#3A6B58);z-index:431;overflow-y:auto;padding:20px" class="fi">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:17px;font-weight:640;color:var(--sw-text,#FFFFFF)">Herramientas<span style="color:'+GOLD+'"> //</span></div><button onclick="toggleAdminToolsDrawer()" aria-label="Cerrar" style="all:unset;cursor:pointer;color:var(--sw-text-muted,#A8C8B0);font-size:18px;padding:4px">&#10005;</button></div>'
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
function sec(t,b){return'<div style="margin-bottom:20px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:8px">'+t+'</div><p style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-muted,#A8C8B0);line-height:1.6">'+b+'</p></div>';}
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
    +'<span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:8.5px;letter-spacing:.24em;'
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
// ⚠ SANDO tiene UNA sola pose (`sando_cuerpo.png`) y WICHO cuatro. Eso es dibujo del
// dueño, no algo que se pueda fabricar acá — está anotado en `marca/PERSONAJES.md`. Por
// eso esta función no promete poses distintas por situación: usa el cuerpo entero, que es
// lo único que los dos tienen.
function VACIO(titulo,texto,cta?){
  var quien=ladoActual();
  return'<div style="text-align:center;padding:34px 10px 10px">'
    +'<img src="img/'+quien+'_cuerpo.png" alt="" aria-hidden="true" loading="lazy" style="height:150px;width:auto;opacity:.85;margin-bottom:14px">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:'+ACC()+';letter-spacing:.2em">'+esc(titulo)+' //</div>'
    +'<p style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin:10px auto 0;max-width:280px;line-height:1.55">'+texto+'</p>'
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
    +'<div style="font-size:8.5px;letter-spacing:.2em;color:'+PAPEL_MUDO+'">'+esc(titulo)+'</div>'
    +'<div style="border-top:1px dashed '+PAPEL_TINTA+';margin:9px 0 7px"></div>';
}
// Corte grueso + el importe grande. Es el cierre de cualquier papel.
function PAPEL_TOTAL(rotulo,monto){
  return'<div style="border-top:2px solid '+PAPEL_TINTA+';margin:8px 0 7px"></div>'
    +'<div style="display:flex;justify-content:space-between;align-items:baseline">'
    +'<span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600">'+esc(rotulo)+'</span>'
    +'<span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:26px;font-weight:640">'+SOLES+pz(monto)+'</span></div>'
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
  function opt(sz,l,d){var sel=size===sz;return'<div onclick="size=\''+sz+'\';render()" style="flex:1;background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?ACC():'var(--sw-border,#3A6B58)')+';border-radius:10px;padding:14px;cursor:pointer;text-align:center;position:relative;box-shadow:'+SHADOW_SM+'">'+selBar(sel)+'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:'+(sel?'#FFFFFF':'#A8C8B0')+'">'+l+'</div><div style="font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+d+'</div></div>';}
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
