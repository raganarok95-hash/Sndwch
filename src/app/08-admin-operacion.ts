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
  return'<div style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(11,11,11,.97);border-top:1px solid var(--sw-border-soft,#1c1c1c);padding:12px 16px;display:flex;gap:6px;align-items:center;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:110">'
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:'+GOLD+';flex-shrink:0">'+n+' sel.</div>'
    +'<button onclick="bulkConfirmPayments()" style="all:unset;box-sizing:border-box;cursor:pointer;flex:1;text-align:center;background:#ffa500;color:#0d0d0d;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:15px 4px;border-radius:8px">'+iconTxt('check','Pago','#0d0d0d')+'</button>'
    +'<button onclick="bulkAdvanceStatus(\'PREPARANDO\')" style="all:unset;box-sizing:border-box;cursor:pointer;flex:1;text-align:center;background:'+STATUSES.PREPARANDO.c+';color:#fff;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:15px 4px;border-radius:8px">'+STATUSES.PREPARANDO.label+'</button>'
    +'<button onclick="bulkAdvanceStatus(\'EN CAMINO\')" style="all:unset;box-sizing:border-box;cursor:pointer;flex:1;text-align:center;background:'+STATUSES['EN CAMINO'].c+';color:#fff;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:15px 4px;border-radius:8px">'+STATUSES['EN CAMINO'].label+'</button>'
    +'<button onclick="bulkAdvanceStatus(\'ENTREGADO\')" style="all:unset;box-sizing:border-box;cursor:pointer;flex:1;text-align:center;background:'+STATUSES.ENTREGADO.c+';color:#fff;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:15px 4px;border-radius:8px">'+STATUSES.ENTREGADO.label+'</button>'
    +'<button onclick="bulkSelected={};render()" aria-label="Cancelar selección" style="all:unset;box-sizing:border-box;cursor:pointer;color:#ff8888;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+icon('close',16,'#ff8888')+'</button>'
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
// Etiqueta compacta del método de pago una vez confirmado — antes una vez pagado el
// pedido no mostraba de ninguna forma CÓMO se pagó (solo se veía mientras estaba
// pendiente de confirmar), así que el operador no podía distinguir de un vistazo un
// pedido pagado con tarjeta de uno pagado con crédito o recompensa (hallazgo de la
// re-auditoría del panel admin).
var PAYMENT_METHOD_BADGE={
  culqi:iconTxt('card','Tarjeta','#8BAF9A'),
  credit:iconTxt('coin','Crédito','#8BAF9A'),
  reward:iconTxt('gift','Recompensa','#8BAF9A'),
  yape:iconTxt('check','Yape/Plin','#8BAF9A'),
  plin:iconTxt('check','Yape/Plin','#8BAF9A'),
  cod:iconTxt('cash','Contra entrega','#8BAF9A'),
};
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
// del panel admin: la hora programada existe en la fila pero la cola nunca la miraba).
// CORREGIDO 2026-08-27: se leía `o.scheduled_for`, columna que NO existe en `orders`
// (verificado contra information_schema; ese nombre solo vive en `pending_charges`).
// Siempre daba undefined, así que el badge "programado para HH:MM" nunca se mostró y
// esta misma corrección de urgencia estaba muerta desde que se escribió. La columna
// real es `delivery_time`, que es lo que escribe actPlaceOrder y lo que ya usan los
// crons de la misma tabla.
function orderDueTime(o){
  return o.delivery_time||o.created_at;
}
// Extraído para que admin_home y "modo foco" (sAdminFocus) ordenen la cola exactamente
// igual — antes este sort vivía solo inline dentro de sAdminHome.
function sortedActiveOrders(){
  return (adminOrders||[]).slice().sort(function(a,b){
    var pa=orderPriority(a),pb=orderPriority(b);
    if(pa!==pb)return pa-pb;
    return new Date(orderDueTime(a)||0).getTime()-new Date(orderDueTime(b)||0).getTime();
  });
}
// Secciones de accesos rápidos del admin — extraídas a función propia para poder
// reusarlas tanto en el grid de admin_home como en el drawer de navegación lateral
// (adminToolsDrawerOpen/toggleAdminToolsDrawer), alcanzable ahora desde cualquiera de
// las 14 pantallas secundarias del admin sin tener que volver primero a admin_home.
// C5 — SALUD DEL NEGOCIO. Una pantalla que responde "¿hay algo que atender ahora mismo?".
// El panel de negocio (ingresos, productos top, retención) ya existe y es bueno, pero
// contesta otra pregunta — "¿cómo va el negocio?" — y para saber si hay ALGO PENDIENTE hoy
// había que entrar a la cola, al inventario, a reclamaciones y al dashboard por separado y
// deducirlo. Cocinando solo, eso no pasa.
//
// El veredicto de cada señal lo calcula el SERVIDOR (actAdminHealth): acá solo se pinta.
// Si cada pantalla decidiera por su cuenta qué es "problema", dos versiones de la app
// mostrarían distinto el mismo estado del negocio.
var healthData=null,healthErr='';
async function loadHealth(){
  sndScreen='admin_health';busy=true;busyMsg='Revisando el negocio...';healthErr='';render();
  try{
    healthData=await api('admin-health',{token:token});
  }catch(e){healthData=null;healthErr=e.message;}
  busy=false;render();
}
var HEALTH_LEVELS={
  ok:{c:'#25D366',l:'OK'},
  atencion:{c:'#ffb84d',l:'ATENCIÓN'},
  problema:{c:'#ff8888',l:'PROBLEMA'}
};
function sAdminHealth(){
  var h=H('SALUD DEL NEGOCIO',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  if(healthErr){
    return h+'<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:#ff8888;background:rgba(255,85,85,.08);border:1px solid rgba(255,85,85,.3);border-radius:10px;padding:14px">'+esc(healthErr)+'</div>'
      +'<div style="margin-top:14px">'+BTN('Reintentar //','loadHealth()',true)+'</div></div>';
  }
  if(!healthData)return h+'</div>';
  var ov=HEALTH_LEVELS[healthData.overall]||HEALTH_LEVELS.ok;
  var resumen=healthData.overall==='ok'
    ?'Nada pendiente. Todo lo que este panel vigila está en orden.'
    :healthData.overall==='atencion'
      ?'Nada urgente, pero hay cosas que conviene mirar antes de la próxima tanda.'
      :'Hay algo que atender ahora — abajo está qué y dónde.';
  h+='<div style="background:var(--sw-card2,#1A3028);border:1px solid '+ov.c+';border-radius:12px;padding:18px;margin-bottom:18px">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+ov.c+';letter-spacing:.2em">● '+ov.l+'</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-top:6px">'+esc(resumen)+'</div>'
    +'</div>';
  h+=healthData.signals.map(function(sg){
    var lv=HEALTH_LEVELS[sg.level]||HEALTH_LEVELS.ok;
    // Las señales en verde se muestran igual, no se ocultan: una lista que solo aparece
    // cuando hay problemas no dice nada sobre lo que sí se está vigilando, y entonces el
    // silencio se lee como "no hay chequeo" en vez de "está bien".
    var clickable=sg.screen&&sg.level!=='ok';
    return'<div'+(clickable?' onclick="goHealthTarget(\''+sg.screen+'\')"':'')+' style="background:var(--sw-card,#2D5246);border:1px solid '+(sg.level==='ok'?'var(--sw-border-soft,#1c1c1c)':lv.c)+';border-radius:10px;padding:13px 16px;margin-bottom:8px'+(clickable?';cursor:pointer':'')+'">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">'
      +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(sg.label)+'</div>'
      +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:'+lv.c+';font-variant-numeric:tabular-nums">'+sg.count+'</div>'
      +'</div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px;line-height:1.4">'+esc(sg.hint)+(clickable?' →':'')+'</div>'
      +'</div>';
  }).join('');
  h+='<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:14px">Revisado: '+esc(new Date(healthData.checkedAt).toLocaleString('es-PE'))+'</div>';
  h+='<div style="margin-top:14px">'+BTN('Volver a revisar //','loadHealth()',true)+'</div>';
  return h+'</div>';
}
// Cada señal en rojo/ámbar lleva a la pantalla donde de verdad se arregla — el valor de
// esta vista es acortar el camino entre enterarse y resolver, no solo enterarse.
function goHealthTarget(sc){
  if(sc==='admin_inventory')return loadInventory();
  if(sc==='admin_complaints')return loadAdminComplaints();
  return loadAdmin();
}
// C6 — PLAN DE TANDA. Proyecta cuánto cocinar de cada insumo para cubrir los próximos N
// días, a partir del consumo real de los pedidos ya pagados.
//
// La pantalla trata la FIABILIDAD como el dato principal, no como una nota al pie: con
// pocas semanas de ventas, una proyección es un número inventado con aspecto de dato — y
// el aspecto de dato es lo que hace que se le crea. Mientras el servidor diga
// `reliable:false`, lo primero que se ve es por qué todavía no se le puede creer, y las
// cantidades quedan explícitamente marcadas como referencia.
var batchPlan=null,batchErr='',batchCoverDays=4;
async function loadBatchPlan(){
  sndScreen='admin_batch';busy=true;busyMsg='Calculando la tanda...';batchErr='';render();
  try{
    batchPlan=await api('admin-batch-plan',{token:token,coverDays:batchCoverDays});
  }catch(e){batchPlan=null;batchErr=e.message;}
  busy=false;render();
}
function setBatchCoverDays(d){batchCoverDays=d;loadBatchPlan();}
function sAdminBatchPlan(){
  var h=H('PLAN DE TANDA',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  if(batchErr){
    return h+'<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:#ff8888;background:rgba(255,85,85,.08);border:1px solid rgba(255,85,85,.3);border-radius:10px;padding:14px">'+esc(batchErr)+'</div>'
      +'<div style="margin-top:14px">'+BTN('Reintentar //','loadBatchPlan()',true)+'</div></div>';
  }
  if(!batchPlan)return h+'</div>';
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">¿Cuántos días cubre esta tanda? //</div>';
  h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">'
    +[2,3,4,7].map(function(d){
      var sel=batchCoverDays===d;
      return'<div onclick="setBatchCoverDays('+d+')" style="flex:1;min-width:64px;text-align:center;background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:8px;padding:10px 6px;cursor:pointer;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:'+(sel?'#fff':'#A8C8B0')+'">'+d+' días</div>';
    }).join('')
    +'</div>';
  if(!batchPlan.reliable){
    // Primero el motivo, antes que cualquier cantidad: si las cifras aparecieran arriba,
    // se leerían como una indicación y el aviso quedaría como letra chica.
    h+='<div style="background:rgba(255,184,77,.1);border:1px solid #ffb84d;border-radius:10px;padding:14px;margin-bottom:16px">'
      +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:#ffb84d">Todavía es una referencia, no una indicación</div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-top:6px">Hay '+batchPlan.ordersConsidered+' pedido(s) en '+batchPlan.daysOfData+' día(s) de historial. Para proyectar de verdad hacen falta al menos '+batchPlan.minOrders+' pedidos y '+batchPlan.minDaysOfData+' días. Úsalo como punto de partida y corrígelo con lo que veas en cocina.</div>'
      +'</div>';
  }
  if(!batchPlan.items.length){
    return h+'<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">Todavía no hay consumo registrado ni pedidos programados: no hay nada que proyectar.</div></div>';
  }
  h+='<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:12px;line-height:1.5">Consumo de los últimos '+batchPlan.daysOfData+' día(s) proyectado a '+batchPlan.coverDays+', con un margen de '+Math.round((batchPlan.safetyFactor-1)*100)+'% para no quedarte corto. Los pedidos ya programados se cuentan como piso.</div>';
  h+=batchPlan.items.map(function(it){
    var cocinar=it.toCook;
    return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:13px 16px;margin-bottom:8px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">'
      +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(it.name)+'</div>'
      +'<div style="text-align:right;flex-shrink:0">'
      +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:'+GOLD+';font-variant-numeric:tabular-nums;line-height:1">'+(cocinar==null?'—':cocinar)+'</div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:8px;color:'+GOLD+';letter-spacing:.1em">COCINAR</div>'
      +'</div></div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:5px;line-height:1.45">'
      +'Necesitas '+it.needed+' · '+(it.stockTracked?'tienes '+it.stock:'sin rastreo de cantidad — ponle un número en Inventario para saber cuánto falta')
      +' · usaste '+it.usedInWindow+' en '+batchPlan.daysOfData+' día(s) ('+it.perDay+'/día)'
      +(it.committed?' · '+it.committed+' ya pedido(s) para esos días':'')
      +'</div></div>';
  }).join('');
  h+='<div style="margin-top:14px">'+BTN('Registrar la tanda en Inventario //','loadInventory();setInvMode(\'tanda\')',true)+'</div>';
  return h+'</div>';
}
// D5 — GUION DE VIDEO. El backend para esto (actions/video.ts) estaba implementado y
// registrado desde hace tiempo, pero NINGUNA pantalla lo llamaba: el dueño no tenía forma
// de llegar a él. La mitad que importa es gratis y funciona hoy — genera el guion, el
// prompt para Veo/Flow, el pie de publicación y los hashtags a partir de la receta REAL
// del Signature (no de una descripción escrita a mano que se desactualiza). La otra mitad
// (generar el MP4 con la API de Veo) cuesta dinero real y necesita GEMINI_API_KEY, así que
// esa se deja como está: sin la key el servidor responde con instrucciones en vez de
// fallar, y el prompt igual sirve para pegarlo a mano en Flow, que es lo que el dueño ya
// hace.
var vidScript=null,vidSigId='',vidAngle='',vidErr='';
async function loadVideoScript(){
  sndScreen='admin_video';vidErr='';
  if(!vidSigId){var first=SIGS.find(function(x){return !x.secret;});vidSigId=first?first.id:'SIG01';}
  busy=true;busyMsg='Armando el guion...';render();
  try{
    vidScript=await api('admin-video-script',{token:token,sigId:vidSigId,angle:vidAngle||undefined});
    if(!vidAngle&&vidScript&&vidScript.angle)vidAngle=vidScript.angle.key;
  }catch(e){vidScript=null;vidErr=e.message;}
  busy=false;render();
}
function pickVideoSig(id){vidSigId=id;loadVideoScript();}
function pickVideoAngle(k){vidAngle=k;loadVideoScript();}
function sAdminVideo(){
  var h=H('GUION DE VIDEO',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5;margin-bottom:16px">El guion y el prompt salen de la receta real del Signature, así que si cambias la composición desde el panel, el video que generes ya refleja el cambio.</div>';
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">¿Qué sándwich? //</div>';
  h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">'
    +SIGS.filter(function(x){return !x.secret;}).map(function(x){
      var sel=vidSigId===x.id;
      return'<div onclick="pickVideoSig(\''+x.id+'\')" style="background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:20px;padding:8px 14px;cursor:pointer;font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:'+(sel?'#fff':'#A8C8B0')+'">'+esc(x.n)+'</div>';
    }).join('')
    +'</div>';
  if(vidErr){
    h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:#ff8888;background:rgba(255,85,85,.08);border:1px solid rgba(255,85,85,.3);border-radius:10px;padding:14px">'+esc(vidErr)+'</div>';
    return h+'</div>';
  }
  if(!vidScript)return h+'</div>';
  if(vidScript.angles&&vidScript.angles.length){
    h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">¿Qué plano? //</div>';
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">'
      +vidScript.angles.map(function(a){
        var sel=(vidScript.angle&&vidScript.angle.key)===a.key;
        return'<div onclick="pickVideoAngle(\''+a.key+'\')" style="background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:20px;padding:8px 14px;cursor:pointer;font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:'+(sel?'#fff':'#A8C8B0')+'">'+esc(a.label)+'</div>';
      }).join('')
      +'</div>';
  }
  var g=vidScript.guion||{};
  h+='<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:16px;margin-bottom:12px">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:640;color:var(--sw-text,#FFFFFF);margin-bottom:10px">'+esc(vidScript.name||'')+'</div>'
    +[['Duración',g.duracion],['Formato',g.formato],['Plano',g.plano],['Acción',g.accion],['Pan',g.pan],['Ingredientes',g.ingredientes]]
      .filter(function(r){return r[1];})
      .map(function(r){return'<div style="display:flex;gap:10px;margin-bottom:6px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.1em;min-width:88px;flex-shrink:0;padding-top:2px">'+r[0].toUpperCase()+'</div><div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">'+esc(String(r[1]))+'</div></div>';}).join('')
    +'</div>';
  // Los tres bloques que se COPIAN. Cada uno con su botón: el prompt va a Flow, el pie y
  // los hashtags van a Instagram — son destinos distintos, así que copiarlos juntos
  // obligaría a recortar a mano justo cuando el dueño está apurado publicando.
  h+=copyBlockHTML('Prompt para Flow / Veo','vid-prompt',vidScript.veoPrompt||'');
  h+=copyBlockHTML('Pie de publicación','vid-caption',vidScript.caption||'');
  h+=copyBlockHTML('Hashtags','vid-tags',vidScript.hashtags||'');
  if(vidScript._nota){
    h+='<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:12px;line-height:1.5">'+esc(vidScript._nota)+'</div>';
  }
  h+='<div style="margin-top:14px">'+BTN('Otro plano al azar //','vidAngle=\'\';loadVideoScript()',true)+'</div>';
  return h+'</div>';
}
// Bloque de texto copiable — se usa tres veces en la pantalla de guion. El textarea es
// readonly y no un <div>: copiar desde un div obliga a seleccionar a mano en móvil, que es
// justo donde el dueño va a estar cuando publique.
function copyBlockHTML(titulo,id,texto){
  return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:10px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:10px">'
    +'<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em">'+esc(titulo).toUpperCase()+'</div>'
    +'<button onclick="copyFromField(\''+id+'\')" style="all:unset;cursor:pointer;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:'+GOLD+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:600;padding:8px 14px;border-radius:8px;flex-shrink:0">Copiar</button>'
    +'</div>'
    +'<textarea id="'+id+'" readonly style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:10px 12px;color:var(--sw-text-body,#F2F0EB);width:100%;font-size:12px;font-family:EB Garamond,serif;min-height:'+(texto.length>200?'110px':'64px')+';box-sizing:border-box;resize:vertical">'+esc(texto)+'</textarea>'
    +'</div>';
}
async function copyFromField(id){
  var el=(document.getElementById(id) as HTMLInputElement | null);
  if(!el)return;
  try{
    await navigator.clipboard.writeText(el.value);
    showToast('Copiado.');
  }catch(e){
    // Sin permiso de portapapeles (o navegador viejo): seleccionar el texto deja al dueño
    // a un toque de copiarlo a mano, en vez de dejarlo sin salida.
    el.focus();el.select();
    showToast('Selecciónalo y copia con el teclado.');
  }
}
function adminToolsSections(){
  return[
    ['Clientes y ventas //',[
      ['clientes','Clientes','sndScreen=\'admin_customer\';custDetail=null;custDetailPhone=\'\';custDetailErr=\'\';render()'],
      ['buscar','Buscar pedidos','sndScreen=\'admin_search\';searchResults=null;render()'],
      ['reportes','Reportes','sndScreen=\'admin_report\';reportData=null;render()'],
      ['estrella','Calificaciones','loadRatingsList()'],
      ['reclamo','Reclamaciones','loadAdminComplaints()'],
    ]],
    ['Marketing //',[
      ['calendar','Calendario de contenido','loadCalendar()'],
      ['camera','Guion de video','loadVideoScript()'],
      ['megaphone','Contenido semanal','loadMarketingContent()'],
      ['precios','Códigos promo','loadPromoCodes()'],
      ['estrella','Rendimiento campañas','loadCampaignPerformance()'],
      ['clientes','Lista de espera','loadWaitlist()'],
    ]],
    ['Catálogo //',[
      ['inventario','Inventario','loadInventory()'],
      ['precios','Precios','loadAdminCatalog()'],
      ['horario','Horario','loadStoreHoursForm()'],
      ['lock','Menú secreto','loadSecretSignatureAdmin()'],
      ['precios','Signatures','loadCatalogItemsAdmin()'],
    ]],
    ['Cuenta //',[
      ['puntos','Puntos manuales','sndScreen=\'admin_gen\';agPhone=\'\';agPts=\'\';agMsg=\'\';acPhone=\'\';acDelta=\'\';acMsg=\'\';render()'],
      ['admins','Administradores','loadAdminMgr()'],
      ['auditoria','Auditoría','loadAuditLog()'],
    ]],
    ['Cocina y operación //',[
      ['warning','Salud del negocio','loadHealth()'],
      ['prep','Preparación','loadPrepList()'],
      ['inventario','Plan de tanda','loadBatchPlan()'],
      ['franjas','Franjas horarias','loadTimeWindowReport()'],
      ['direccion','Direcciones','loadProblemAddresses()'],
    ]],
  ];
}
// Grid de 2 columnas agrupado por sección — mismo HTML que ya usaba admin_home, ahora
// también reusado por el drawer de navegación lateral.
function adminToolsGridHTML(){
  return adminToolsSections().map(function(section: any){
    return'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:18px 0 10px">'+section[0]+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +section[1].map(function(x){return'<div onclick="'+x[2]+'" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 12px;cursor:pointer;text-align:center"><div style="width:36px;height:36px;border-radius:50%;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);display:flex;align-items:center;justify-content:center;margin:0 auto 8px">'+icon(x[0])+'</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;color:'+GOLD+';letter-spacing:.03em">'+x[1]+'</div></div>';}).join('')
      +'</div>';
  }).join('');
}
function sAdminHome(){
  var ao=sortedActiveOrders();
  var badge=ao.length;
  return'<div style="min-height:100vh;display:flex;flex-direction:column;background:var(--sw-bg,#1E3932)">'
    +'<div style="padding:20px 20px 16px;border-bottom:1px solid var(--sw-border,#3A6B58);display:flex;justify-content:space-between;align-items:center">'
    +'<div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:19px;font-weight:640;color:var(--sw-text,#FFFFFF);text-wrap:balance">Panel<span class="cut-sep" style="color:'+GOLD+'"> // </span>Operador</div>'
    +(badge>0?'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+STATUSES.RECIBIDO.c+';letter-spacing:.1em;margin-top:3px" class="pulse">● '+badge+' Acción requerida</div>':'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:3px">todo en orden //</div>')
    +'</div><button onclick="loadAdmin()" title="Actualizar ahora" aria-label="Actualizar ahora" style="all:unset;cursor:pointer;font-size:16px;width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">'+icon('refresh',16)+'</button>'
    +'<button onclick="toggleAdminLight()" title="Modo claro/oscuro" aria-label="Cambiar modo claro/oscuro" style="all:unset;cursor:pointer;font-size:16px;width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">'+icon(adminLightMode?'moon':'sun',16)+'</button>'
    +'<button onclick="stopPoll();sndScreen=\'o_home\';sndTab=\'order\';render()" style="all:unset;cursor:pointer;font-family:\'EB Garamond\',serif;font-size:12px;color:'+GOLD+'">← salir</button></div>'
    +(adminOrdersTruncated?'<div style="background:rgba(255,165,0,.12);border-bottom:1px solid rgba(255,165,0,.3);padding:8px 20px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:'+GOLD+';display:flex;align-items:center;gap:5px">'+icon('warning',12,GOLD)+'<span>Hay más pedidos activos de los que se muestran aquí (solo los '+ao.length+' más recientes).</span></div>':'')
    // Antes un poll fallido quedaba en silencio total — el operador podía estar viendo
    // un estado desactualizado sin ninguna señal de que la actualización automática dejó
    // de funcionar.
    +(pollFailing?'<div style="background:rgba(255,85,85,.12);border-bottom:1px solid rgba(255,85,85,.3);padding:8px 20px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#ff8888;display:flex;align-items:center;gap:5px">'+icon('warning',12,'#ff8888')+'<span>No se pudo actualizar la cola de pedidos — reintentando…</span></div>':'')
    +'<div style="flex:1;padding:20px;overflow-y:auto" class="fi">'

    +'<div onclick="loadDashboard()" style="background:var(--sw-card2,#1A3028);border:1px solid '+GOLD+';border-radius:12px;padding:18px;margin-bottom:18px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;box-shadow:'+SHADOW_SM+'">'
    +'<div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:640;color:var(--sw-text,#FFFFFF);text-wrap:balance">Panel<span class="cut-sep" style="color:'+GOLD+'"> // </span>de negocio</div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em;margin-top:2px">ventas · productos top · clientes · puntos</div></div>'
    +'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:'+GOLD+'">Ver →</span></div>'
    +'<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>'

    // Grid de accesos rápidos movido ARRIBA de "Pedidos activos" — antes quedaba
    // debajo de toda la cola, obligando a scrollear pasado cada pedido activo para
    // llegar a cualquier herramienta (hallazgo de auditoría UX, confirmado por el
    // dueño). Ahora reusa adminToolsGridHTML() (ver arriba), la misma función que
    // alimenta el drawer de navegación lateral desde las 14 pantallas secundarias.
    +adminToolsGridHTML()

    // Modo foco — un solo pedido a pantalla completa con la acción principal anclada al
    // fondo del viewport (zona real del pulgar, ver comentario en la tarjeta de abajo).
    // Solo tiene sentido con al menos un pedido activo.
    +(ao.length?'<div onclick="enterFocusMode()" style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card2,#1A3028);border:1px solid '+GOLD+';border-radius:10px;padding:12px 16px;margin-bottom:18px;cursor:pointer"><span style="display:inline-flex;align-items:center;gap:8px;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:'+GOLD+'">'+icon('compass',15,GOLD)+'Modo foco — un pedido a la vez</span><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:'+GOLD+'">Entrar →</span></div>':'')

    // Active orders
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">Pedidos activos // '+(ao.length||'ninguno')+'</div>'
    +(ao.length?ao.map(function(o){
      var s=STATUSES[o.status]||STATUSES['RECIBIDO'];
      var manualPending=(o.payment_method==='yape'||o.payment_method==='plin')&&o.payment_status!=='paid';
      // El checkout ya no obliga al cliente a declarar Yape vs Plin por separado (ambos
      // muestran el mismo número) — la etiqueta aquí es genérica a propósito, incluso
      // para pedidos viejos que sí guardaron 'plin' literal antes de este cambio.
      var manualLabel='Yape/Plin';
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
      var isScheduledAhead=o.delivery_time&&new Date(o.delivery_time).getTime()>Date.now();
      var isStale=(o.status==='RECIBIDO'||manualPending)&&!isScheduledAhead&&minsDue!==null&&minsDue>=10;
      // Antes toda la tarjeta pulsaba (class="pulse" en el contenedor completo), lo que
      // atenúa TODO al 35% de opacidad en cada ciclo — incluido el botón de acción, que
      // se veía deshabilitado justo cuando más urge tocarlo (hallazgo de auditoría de
      // diseño admin, ALTO). Ahora el pulso vive solo en un punto de acento junto al
      // "hace X min" — la tarjeta y su botón quedan siempre legibles.
      return'<div style="background:var(--sw-card,#2D5246);border:1px solid '+(isStale?STATUSES.RECIBIDO.c:(o.status==='RECIBIDO'?STATUSES.RECIBIDO.c:'var(--sw-border-soft,#1c1c1c)'))+';border-radius:10px;padding:16px;margin-bottom:12px">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'
        +'<div style="display:flex;gap:10px;flex:1">'
        +'<input type="checkbox" onchange="toggleBulkSelect(\''+o.id+'\')" '+(checked?'checked':'')+' style="margin-top:3px;width:18px;height:18px;flex-shrink:0;accent-color:'+GOLD+'">'
        +'<div style="flex:1"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:17px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(o.customer_name)+'</div>'
        +'<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(o.customer_address)+'</div>'
        +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:'+(isStale?STATUSES.RECIBIDO.c:'var(--sw-text-muted,#A8C8B0)')+';margin-top:4px;display:flex;align-items:center;gap:5px">'+(isStale?'<span class="pulse" style="width:6px;height:6px;border-radius:50%;background:'+STATUSES.RECIBIDO.c+';display:inline-block;flex-shrink:0"></span>':'')+'<span>'+esc(o.ref)+' · '+SOLES+pz(o.total)+' · '+esc(o.date)+(mins!==null?' · hace '+mins+' min':'')+'</span></div>'
        +(isScheduledAhead?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:'+GOLD+';margin-top:2px;display:flex;align-items:center;gap:5px">'+icon('horario',12,GOLD)+'<span>programado para '+esc(new Date(o.delivery_time).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}))+'</span></div>':'')
        // Antes la ETA que el operador ingresaba al marcar "EN CAMINO" quedaba guardada
        // (eta_minutes) pero nunca se mostraba de vuelta en su propia cola — solo el
        // cliente la ve (ver el mensaje de WhatsApp) (hallazgo de la re-auditoría del
        // panel admin: el operador no tenía forma de recordar qué ETA le prometió a cada
        // cliente sin abrir el detalle del pedido).
        +(o.status==='EN CAMINO'&&o.eta_minutes?'<div onclick="event.stopPropagation();editEta(\''+o.id+'\','+o.eta_minutes+')" style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#3A86FF;margin-top:2px;display:flex;align-items:center;gap:5px;cursor:pointer">'+icon('moto',12,'#3A86FF')+'<span>ETA ~'+o.eta_minutes+' min · editar</span></div>':'')+'</div></div>'
        +stBadge(o.status)+'</div>'
        +'<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:12px">'+esc(o.summary)+'</div>'
        // Receta expandida: sin esto un BUILD YOUR OWN solo mostraba el nombre de la
        // proteína y era imposible prepararlo (ver itemRecipeLines).
        +orderRecipeHTML(o.items)
        +(o.redeemed_reward?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#25D366;margin-bottom:10px;display:flex;align-items:center;gap:5px">'+icon('gift',12,'#25D366')+'<span>'+esc(o.redeemed_reward)+'</span></div>':'')
        +(o.payment_method==='cod'&&o.payment_status!=='paid'?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#ffa500;margin-bottom:10px;display:flex;align-items:center;gap:5px">'+icon('cash',12,'#ffa500')+'<span>Cobrar '+SOLES+pz(o.total)+' al entregar</span></div>':'')
        +(manualPending?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#ffa500;margin-bottom:8px;display:flex;align-items:center;gap:5px">'+icon('warning',12,'#ffa500')+'<span>Pago '+manualLabel+' sin confirmar — revisa tu app antes de continuar</span></div>':'')
        +(o.payment_status==='paid'&&PAYMENT_METHOD_BADGE[o.payment_method]?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted2,#8BAF9A);margin-bottom:10px">'+PAYMENT_METHOD_BADGE[o.payment_method]+'</div>':'')
        // El comprobante NUNCA reemplaza el botón de confirmar pago de abajo — es solo un
        // apoyo visual opcional que el cliente pudo subir (ver actAdminReceiptUrl).
        +(o.receipt_path?'<button onclick="viewReceipt(\''+o.id+'\')" style="all:unset;cursor:pointer;display:block;width:100%;text-align:center;background:rgba(168,200,176,.12);border:1px solid rgba(168,200,176,.4);color:var(--sw-text-muted,#A8C8B0);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:600;letter-spacing:.04em;padding:15px 4px;border-radius:8px;margin-bottom:8px">'+iconTxt('clip','Ver comprobante','#A8C8B0')+'</button>':'')
        // Imprimir/WhatsApp son acciones secundarias (se usan, pero no en cada pedido) —
        // antes ocupaban una fila completa cada una, alargando la tarjeta innecesariamente.
        // Una fila de 2 columnas compactas deja la acción principal (avanzar estado) como
        // lo único que realmente domina visualmente la tarjeta.
        +'<div style="display:flex;gap:8px;margin-bottom:8px">'
        +'<button onclick="printTicket(\''+o.id+'\')" style="all:unset;cursor:pointer;flex:1;text-align:center;background:rgba(139,175,154,.12);border:1px solid rgba(139,175,154,.4);color:var(--sw-text-muted,#A8C8B0);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:600;letter-spacing:.04em;padding:15px 4px;border-radius:8px">'+iconTxt('printer','Ticket','#A8C8B0')+'</button>'
        +((o.contact_phone||o.customer_phone)?'<button onclick="waAdmin(\''+o.id+'\')" style="all:unset;cursor:pointer;flex:1;text-align:center;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:'+GOLD+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:600;letter-spacing:.04em;padding:15px 4px;border-radius:8px">'+iconTxt('chat','WhatsApp',GOLD)+'</button>':'')
        +'</div>'
        // Botón principal agrandado (padding/tamaño de fuente) — "zona del pulgar" real
        // (position:fixed sobre todo el viewport) exigiría antes resolver "modo foco" de
        // un solo pedido a pantalla completa (con varias tarjetas en la cola, un botón
        // fijo de viewport no tiene un pedido único al que apuntar); mientras tanto, un
        // tap target mucho más grande es la mejora de ergonomía que sí se puede aplicar
        // ya, tarjeta por tarjeta, sin ese rediseño más grande.
        +(manualPending
          ?'<button onclick="confirmAndAdvance(\''+o.id+'\')" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#000;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:700;letter-spacing:.04em;padding:18px 0;border-radius:10px;text-align:center;margin-bottom:6px">'+iconTxt('check','Confirmar pago y preparar','#000')+'</button>'
            +'<button onclick="confirmOrderPayment(\''+o.id+'\')" style="all:unset;cursor:pointer;display:block;width:100%;text-align:center;color:var(--sw-text-muted2,#8BAF9A);font-family:\'EB Garamond\',serif;font-size:10px;padding:6px 0;margin-bottom:8px">solo confirmar el pago, sin avanzar todavía</button>'
          :(s.next?'<button onclick="updateStatus(\''+o.id+'\',\''+s.next+'\')" style="all:unset;cursor:pointer;display:block;width:100%;background:'+STATUSES[s.next].c+';color:#000;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:700;letter-spacing:.04em;padding:18px 0;border-radius:10px;text-align:center">'+(STATUSES[s.next].icon&&ICONS[STATUSES[s.next].icon]?icon(STATUSES[s.next].icon,15,'#000')+' ':'')+'Marcar como '+STATUSES[s.next].label.toLowerCase()+' →</button>':'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:#25D366;text-align:center;padding:8px">'+iconTxt('check','Completado','#25D366')+'</div>'))
        // Antes este botón solo aparecía para pagos manuales sin confirmar — un pedido ya
        // pagado con tarjeta/crédito no tenía NINGUNA forma de cancelarse en la app
        // (hallazgo de la auditoría de flujo de pedidos: sin esto, si se acaba un
        // ingrediente a media preparación, el operador queda sin opciones).
        +'<button onclick="cancelOrder(\''+o.id+'\')" style="all:unset;cursor:pointer;display:block;width:100%;background:transparent;border:1px solid rgba(255,85,85,.4);color:#ff8888;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;letter-spacing:.06em;padding:9px 0;border-radius:8px;text-align:center">'+iconTxt('close','Cancelar pedido'+(manualPending?' (nunca pagó)':''),'#ff8888')+'</button>'
        +'</div>';
    }).join(''):'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-card,#2D5246);border-radius:10px;padding:24px 20px;text-align:center;margin-bottom:8px">'+icon('check',28,'#25D366')+'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:8px">Sin pedidos activos //</div></div>')

    +(!cust||!('serviceWorker' in navigator)||!('PushManager' in window)?'':'<div onclick="togglePushNotifications()" style="margin-top:18px;background:var(--sw-card,#2D5246);border:1px solid '+(pushSubscribed?GOLD:'#1c1c1c')+';border-radius:10px;padding:12px 16px;cursor:pointer"><div style="display:flex;justify-content:space-between;align-items:center"><span style="display:inline-flex;align-items:center;gap:8px;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text-muted,#A8C8B0)">'+icon('notif')+'Alertas de pedidos y stock</span><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:14px;color:'+(pushSubscribed?GOLD:'#A8C8B0')+'">'+(pushSubscribed?'✓ Activo':'○ Activar')+'</span></div>'+(pushMsg?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:'+GOLD+';margin-top:6px">'+esc(pushMsg)+'</div>':'')+'</div>')
    +'<div style="margin-top:18px;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center"><span style="display:inline-flex;align-items:center;gap:8px;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text-muted,#A8C8B0)">'+icon('sonido')+'Sonido de nuevo pedido</span>'
    +'<select onchange="setNotifSound(this.value)" style="background:var(--sw-bg,#1E3932);color:var(--sw-text,#FFFFFF);border:1px solid var(--sw-border,#3A6B58);border-radius:6px;padding:6px 8px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px">'
    +['campana','timbre','grave'].map(function(p){return'<option value="'+p+'" '+(notifSoundPreset===p?'selected':'')+'>'+p+'</option>';}).join('')
    +'</select></div>'
    // Antes #222 fijo — pensado para fundirse casi invisible con el fondo oscuro original,
    // pero en modo claro se volvía el texto de MAYOR contraste de toda la pantalla (un
    // footnote menor terminaba dominando visualmente) — hallazgo de auditoría visual,
    // MEDIO. Con la variable de tema se mantiene sutil en ambos modos.
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted3,#3A4A44);text-align:center;margin-top:6px">Auto-actualiza cada 25 seg · Sonido al recibir pedido</div>'
    +'</div>'
    +bulkBar()
    +'</div>';
}

// MODO FOCO — un solo pedido a pantalla completa, con el botón de acción principal
// anclado con position:fixed al fondo real del viewport (la "zona del pulgar" que el
// botón agrandado de la tarjeta normal de admin_home no podía lograr — ver comentario en
// esa tarjeta: con varias tarjetas en la cola, un botón fijo de viewport no tiene un solo
// pedido al que apuntar; acá sí, porque solo se muestra uno).
function enterFocusMode(){focusIdx=0;sndScreen='admin_focus';render();}
function exitFocusMode(){sndScreen='admin_home';render();}
function focusStep(delta){
  var ao=sortedActiveOrders();
  if(!ao.length)return;
  focusIdx=((focusIdx+delta)%ao.length+ao.length)%ao.length;
  render();
}
function sAdminFocus(){
  var ao=sortedActiveOrders();
  var barBg='var(--sw-bg,#1E3932)';
  var topBar='<div style="padding:10px 16px;border-bottom:1px solid var(--sw-border,#3A6B58);display:flex;justify-content:space-between;align-items:center">'
    +'<button onclick="exitFocusMode()" style="all:unset;cursor:pointer;font-family:\'EB Garamond\',serif;font-size:15px;color:'+GOLD+';min-height:44px;display:inline-flex;align-items:center;padding-right:12px">← Salir</button>'
    +'<span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">Modo<span class="cut-sep" style="color:'+GOLD+'"> // </span>cocina</span>'
    +'</div>';
  if(!ao.length){
    return'<div style="min-height:100vh;display:flex;flex-direction:column;background:'+barBg+'">'+topBar
      +'<div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:40px 20px" class="fi">'+icon('check',32,'#25D366')+'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:12px">Sin pedidos activos — todo en orden //</div></div></div>';
  }
  if(focusIdx>=ao.length)focusIdx=0;
  var o=ao[focusIdx];
  var s=STATUSES[o.status]||STATUSES['RECIBIDO'];
  var manualPending=(o.payment_method==='yape'||o.payment_method==='plin')&&o.payment_status!=='paid';
  var manualLabel='Yape/Plin';
  var mins=minutesAgo(o.created_at);
  var minsDue=minutesAgo(orderDueTime(o));
  var isScheduledAhead=o.delivery_time&&new Date(o.delivery_time).getTime()>Date.now();
  var isStale=(o.status==='RECIBIDO'||manualPending)&&!isScheduledAhead&&minsDue!==null&&minsDue>=10;
  // Flechas de 56px reales: se tocan de pie, con la mano ocupada o con guante, sin apuntar.
  // Antes eran 20px de glifo con 4px de padding — un blanco de ~28px, muy por debajo del
  // mínimo de 44px, en la única pantalla que se usa con las manos sucias.
  var navBtn=function(delta,glyph,label){
    return'<button onclick="focusStep('+delta+')" aria-label="'+label+'" style="all:unset;cursor:pointer;font-family:\'EB Garamond\',serif;font-size:30px;line-height:1;color:'+(ao.length>1?GOLD:'var(--sw-text-muted3,#3A4A44)')+';width:56px;height:56px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px">'+glyph+'</button>';
  };
  var nav='<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 14px;border-bottom:1px solid var(--sw-border,#3A6B58)">'
    +navBtn(-1,'‹','Pedido anterior')
    +'<span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:14px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em">Pedido '+(focusIdx+1)+' de '+ao.length+'</span>'
    +navBtn(1,'›','Pedido siguiente')
    +'</div>';
  // ORDEN DE LECTURA EN COCINA: primero QUÉ SE ARMA, después a quién se le manda.
  // Antes el cuerpo abría con nombre + dirección + pin + referencia + línea de ref, y la
  // receta —lo único que se necesita mientras se arma— quedaba debajo del pliegue, en
  // 11px. Dirección, pin y teléfono importan al DESPACHAR, no al armar; bajan.
  var body='<div style="flex:1;padding:20px 18px 180px;overflow-y:auto" class="fi">'
    +stBadge(o.status)
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:26px;font-weight:640;color:var(--sw-text,#FFFFFF);margin-top:12px">'+esc(o.customer_name)+'</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:'+(isStale?STATUSES.RECIBIDO.c:'var(--sw-text-muted,#A8C8B0)')+';margin-top:6px;margin-bottom:16px;display:flex;align-items:center;gap:6px">'+(isStale?'<span class="pulse" style="width:8px;height:8px;border-radius:50%;background:'+STATUSES.RECIBIDO.c+';display:inline-block;flex-shrink:0"></span>':'')+'<span>'+esc(o.ref)+' · '+SOLES+pz(o.total)+(mins!==null?' · hace '+mins+' min':'')+'</span></div>'
    // La receta, en escala de cocina, arriba de todo lo demás.
    +orderRecipeHTML(o.items,true)
    +(isScheduledAhead?'<div style="font-family:\'EB Garamond\',serif;font-size:15px;color:'+GOLD+';margin-bottom:14px;display:flex;align-items:center;gap:8px">'+icon('horario',16,GOLD)+'<span>Programado para '+esc(new Date(o.delivery_time).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}))+'</span></div>':'')
    +(manualPending?'<div style="font-family:\'EB Garamond\',serif;font-size:15px;color:#ffa500;margin-bottom:14px;display:flex;align-items:center;gap:8px">'+icon('warning',16,'#ffa500')+'<span>Pago '+manualLabel+' sin confirmar — revisa tu app antes de continuar</span></div>':'')
    +(o.redeemed_reward?'<div style="font-family:\'EB Garamond\',serif;font-size:15px;color:#25D366;margin-bottom:14px;display:flex;align-items:center;gap:8px">'+icon('gift',16,'#25D366')+'<span>'+esc(o.redeemed_reward)+'</span></div>':'')
    +'<div style="height:1px;background:var(--sw-border,#3A6B58);margin:18px 0"></div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:'+GOLD+';letter-spacing:.18em;margin-bottom:10px">Para entregar //</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-size:17px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">'+esc(o.customer_address)+'</div>'
    // Pin exacto que el cliente confirmó en el mapa al pedir. En Trujillo la dirección en
    // texto no siempre ubica (numeración irregular, referencias en vez de número), así
    // que abrir el punto directo en Maps es la diferencia entre entregar y dar vueltas.
    // Solo aparece si el pedido trae coordenadas — los pedidos viejos no las tienen.
    +(typeof o.lat==='number'&&typeof o.lon==='number'
      ?'<a href="https://maps.google.com/?q='+o.lat+','+o.lon+'" target="_blank" rel="noopener" style="font-family:\'EB Garamond\',serif;font-size:15px;color:'+GOLD+';margin-top:10px;display:inline-flex;align-items:center;gap:8px;text-decoration:none;min-height:44px;align-items:center">'+icon('moto',16,GOLD)+'<span>Abrir pin exacto en Maps</span></a>'
      :'')
    // La referencia que escribe el cliente ("portón azul", "3er piso") viajaba como
    // o.notes y solo se veía en el TICKET IMPRESO, etiquetada "NOTA:" — o sea en el papel
    // de cocina, que es justo donde no sirve. Quien despacha la necesita en pantalla.
    // #30 — Una nota que dice "soy alérgico" no puede pintarse igual que "portón azul".
    // El bloque rojo no es decoración: esta tarjeta se lee de reojo con las manos ocupadas,
    // y ahí lo único que funciona es que el aviso no se parezca a lo de al lado.
    +(o.notes?(noteNeedsAttention(o.notes)
      ?'<div style="background:rgba(255,85,85,.12);border:1px solid rgba(255,85,85,.5);border-radius:8px;padding:12px 14px;margin-top:10px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:#ff8888;letter-spacing:.08em">⚠ ALERGIA O RESTRICCIÓN</div><div style="font-family:\'EB Garamond\',serif;font-size:17px;color:var(--sw-text,#FFFFFF);margin-top:4px;line-height:1.4">'+esc(o.notes)+'</div></div>'
      :'<div style="font-family:\'EB Garamond\',serif;font-size:16px;color:'+GOLD+';margin-top:8px">Referencia: '+esc(o.notes)+'</div>'):'')
    +(o.status==='EN CAMINO'&&o.eta_minutes?'<div onclick="event.stopPropagation();editEta(\''+o.id+'\','+o.eta_minutes+')" style="font-family:\'EB Garamond\',serif;font-size:15px;color:#3A86FF;margin-top:10px;display:flex;align-items:center;gap:8px;cursor:pointer;min-height:44px">'+icon('moto',16,'#3A86FF')+'<span>ETA ~'+o.eta_minutes+' min · editar</span></div>':'')
    +(o.payment_method==='cod'&&o.payment_status!=='paid'?'<div style="font-family:\'EB Garamond\',serif;font-size:16px;color:#ffa500;margin-top:12px;display:flex;align-items:center;gap:8px">'+icon('cash',16,'#ffa500')+'<span>Cobrar '+SOLES+pz(o.total)+' al entregar</span></div>':'')
    +(o.payment_status==='paid'&&PAYMENT_METHOD_BADGE[o.payment_method]?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:14px;color:var(--sw-text-muted2,#8BAF9A);margin-top:12px">'+PAYMENT_METHOD_BADGE[o.payment_method]+'</div>':'')
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:var(--sw-text-muted,#A8C8B0);margin-top:12px">'+esc(o.date)+' · '+esc(o.summary)+'</div>'
    +'<div style="display:flex;gap:10px;margin-top:22px">'
    +'<button onclick="printTicket(\''+o.id+'\')" style="all:unset;cursor:pointer;flex:1;text-align:center;background:rgba(139,175,154,.12);border:1px solid rgba(139,175,154,.4);color:var(--sw-text-muted,#A8C8B0);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;letter-spacing:.04em;padding:19px 4px;border-radius:8px">'+iconTxt('printer','Ticket','#A8C8B0')+'</button>'
    +((o.contact_phone||o.customer_phone)?'<button onclick="waAdmin(\''+o.id+'\')" style="all:unset;cursor:pointer;flex:1;text-align:center;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:'+GOLD+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;letter-spacing:.04em;padding:19px 4px;border-radius:8px">'+iconTxt('chat','WhatsApp',GOLD)+'</button>':'')
    +'</div>'
    +'<button onclick="cancelOrder(\''+o.id+'\')" style="all:unset;cursor:pointer;display:block;width:100%;background:transparent;border:1px solid rgba(255,85,85,.4);color:#ff8888;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;letter-spacing:.06em;padding:15px 0;border-radius:8px;text-align:center;margin-top:12px">'+iconTxt('close','Cancelar pedido'+(manualPending?' (nunca pagó)':''),'#ff8888')+'</button>'
    +'</div>';
  // El botón real anclado a la zona del pulgar: position:fixed sobre todo el viewport,
  // no relativo a la tarjeta. Con env(safe-area-inset-bottom) para no quedar tapado por
  // la barra de gestos de iOS/Android en el celular real del dueño.
  var fixedBar='<div style="position:fixed;left:0;right:0;bottom:0;padding:14px 20px calc(14px + env(safe-area-inset-bottom));background:'+barBg+';border-top:1px solid var(--sw-border,#3A6B58);box-shadow:0 -6px 20px rgba(0,0,0,.25)">'
    +(manualPending
      ?'<button onclick="confirmAndAdvance(\''+o.id+'\')" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#000;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:17px;font-weight:700;letter-spacing:.04em;padding:20px 0;border-radius:10px;text-align:center">'+iconTxt('check','Confirmar pago y preparar','#000')+'</button>'
        +'<button onclick="confirmOrderPayment(\''+o.id+'\')" style="all:unset;cursor:pointer;display:block;width:100%;text-align:center;color:var(--sw-text-muted2,#8BAF9A);font-family:\'EB Garamond\',serif;font-size:11px;padding:8px 0 0">solo confirmar el pago, sin avanzar todavía</button>'
      :(s.next?'<button onclick="updateStatus(\''+o.id+'\',\''+s.next+'\')" style="all:unset;cursor:pointer;display:block;width:100%;background:'+STATUSES[s.next].c+';color:#000;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:17px;font-weight:700;letter-spacing:.04em;padding:20px 0;border-radius:10px;text-align:center">'+(STATUSES[s.next].icon&&ICONS[STATUSES[s.next].icon]?icon(STATUSES[s.next].icon,16,'#000')+' ':'')+'Marcar como '+STATUSES[s.next].label.toLowerCase()+' →</button>':'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:#25D366;text-align:center;padding:10px">'+iconTxt('check','Completado','#25D366')+'</div>'))
    +'</div>';
  return'<div style="min-height:100vh;display:flex;flex-direction:column;background:'+barBg+'">'+topBar+nav+body+fixedBar+'</div>';
}
