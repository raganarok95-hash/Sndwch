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
      +'<button onclick="resolveConfirm(true)" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#241a08;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;letter-spacing:.08em;padding:14px;border-radius:10px;text-align:center;margin-bottom:8px;box-sizing:border-box">Confirmar //</button>'
      +'<button onclick="resolveConfirm(false)" style="all:unset;cursor:pointer;display:block;width:100%;background:transparent;border:1px solid var(--sw-border,#3A6B58);color:var(--sw-text-muted,#A8C8B0);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.06em;padding:12px;border-radius:10px;text-align:center;box-sizing:border-box">Cancelar</button>'
      +'</div></div>';
  }
  if(promptState){
    html+='<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:420;display:flex;align-items:flex-end;justify-content:center" class="fi">'
      +'<div role="dialog" aria-modal="true" aria-label="Ingresa un dato" style="background:var(--sw-bg,#1E3932);border-radius:14px 14px 0 0;width:100%;max-width:420px;padding:24px 20px 20px;box-sizing:border-box">'
      +'<p style="font-family:\'EB Garamond\',serif;font-size:14px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-bottom:14px;white-space:pre-line">'+esc(promptState.msg)+'</p>'
      +'<input id="ui-prompt-input" type="'+promptState.inputType+'" value="'+esc(promptState.defVal)+'" autofocus onkeydown="if(event.key===\'Enter\')submitPrompt();" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;color:var(--sw-text,#FFFFFF);width:100%;font-size:16px;box-sizing:border-box;margin-bottom:16px">'
      +'<button onclick="submitPrompt()" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#241a08;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;letter-spacing:.08em;padding:14px;border-radius:10px;text-align:center;margin-bottom:8px;box-sizing:border-box">Aceptar //</button>'
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
    html+='<a href="https://wa.me/'+WA+'?text='+supportMsg+'" target="_blank" rel="noopener" style="position:fixed;right:16px;bottom:84px;z-index:150;width:50px;height:50px;border-radius:50%;background:'+GOLD+';display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.4);text-decoration:none" aria-label="Soporte por WhatsApp">'+icon('chat',24,'#0d0d0d')+'</a>';
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
function total(){
  var sig=SIGS.find(function(x){return x.id===sigId;});
  var pr=PROTS.find(function(x){return x.id===prot;});
  var bp=mode==='sig'?sigPrice(sig):protPrice(pr);
  var dbl=dblProtRef();
  return money(bp+(doubleProt?dblFee(dbl,size):0)+(extraSauce?EXTRA_SAUCE_PRICE:0));
}
function szLabel(sz){return sz==='15'?'15CM':sz==='30'?'30CM':'';}
// Toggle de tamaño reutilizado en Signature y Build Your Own.
function SZTOG(){
  function opt(sz,l,d){var sel=size===sz;return'<div onclick="size=\''+sz+'\';render()" style="flex:1;background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'var(--sw-border,#3A6B58)')+';border-radius:10px;padding:14px;cursor:pointer;text-align:center;position:relative;box-shadow:'+SHADOW_SM+'">'+selBar(sel)+'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:'+(sel?'#FFFFFF':'#A8C8B0')+'">'+l+'</div><div style="font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+d+'</div></div>';}
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
