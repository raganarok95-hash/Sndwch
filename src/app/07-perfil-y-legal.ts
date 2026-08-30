// ── #60: pedido fijo (recurrente) ───────────────────────────────────────────────────────
//
// "El cliente lo deja armado todas las semanas." Ingreso predecible, que es justo lo que le
// falta a un negocio nuevo.
//
// ⚠ NO SE COBRA SOLO, Y LA PANTALLA LO DICE. El token de tarjeta de Culqi es de un solo uso
// y vive 5 minutos, así que no hay forma de volver a cobrar sin que el cliente ponga una
// tarjeta otra vez. Prometerle "se cobra solo" y después pedirle que confirme sería la clase
// de promesa falsa que ya obligó a retirar los badges MÁS PEDIDO y EDICIÓN LIMITADA.
var myRecurring=[];
var DIAS_SEMANA=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function sPRecurring(){
  var h=H('MI PEDIDO FIJO',"sndScreen='p_home';render()")+'<div style="flex:1;padding:20px 20px 140px;overflow-y:auto" class="fi">';
  h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px;line-height:1.5">Deja tu pedido de siempre armado para un día y una hora. Te avisamos una hora antes y lo confirmas en un toque — <b style="color:var(--sw-text-body,#F2F0EB)">nunca te cobramos sin que confirmes</b>.</div>';
  if(!myRecurring.length){
    h+='<div style="text-align:center;padding-top:40px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:'+GOLD+';letter-spacing:.2em">Sin pedidos fijos //</div><p style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:10px">Arma tu carrito y guárdalo como fijo desde la pantalla del carrito.</p></div>';
  }else{
    h+=myRecurring.map(function(r){
      return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:12px;padding:16px;margin-bottom:10px">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px">'
        +'<span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:17px;font-weight:600;color:var(--sw-text,#FFFFFF);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(DIAS_SEMANA[r.weekday]||'')+' · '+esc(r.slot)+'</span>'
        +'<button onclick="doDeleteRecurring(\''+r.id+'\')" style="all:unset;cursor:pointer;color:#ff8888;font-family:EB Garamond,serif;font-weight:600;font-size:10px;flex-shrink:0">Quitar</button>'
        +'</div>'
        +(r.label?'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:10px">'+esc(r.label)+'</div>':'')
        +'<button onclick="loadCart('+JSON.stringify(r.items||[]).replace(/"/g,'&quot;')+')" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#241a08;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.08em;padding:11px;border-radius:8px;text-align:center">Pedirlo ahora //</button>'
        +'</div>';
    }).join('');
  }
  h+='</div>'+NAV();
  return h;
}
async function goRecurring(){
  sndScreen='p_recurring';busy=true;busyMsg='Cargando...';render();
  try{
    var r=await api('recurring-list',{token:token});
    myRecurring=Array.isArray(r.recurring)?r.recurring:[];
  }catch(e){myRecurring=[];}
  busy=false;render();
}
async function doDeleteRecurring(id){
  if(!(await showConfirm('¿Quitar este pedido fijo? Dejaremos de avisarte.')))return;
  // Optimista, igual que favoritos: se quita al instante y se reinserta si el borrado falla.
  var idx=myRecurring.findIndex(function(r){return r.id===id;});
  var removed=idx>=0?myRecurring.splice(idx,1)[0]:null;
  render();
  try{
    await api('recurring-delete',{token:token,id:id});
  }catch(e){
    if(removed)myRecurring.splice(idx,0,removed);
    render();
    showToast('No se pudo quitar: '+e.message);
  }
}
// Guarda el carrito actual como pedido fijo. Vive acá, junto al resto del pedido fijo, para
// que toda la funcionalidad quede en un solo sitio.
async function saveCartAsRecurring(){
  if(!cust){showToast('Inicia sesión para dejar un pedido fijo.');return;}
  if(!cart.length){showToast('Arma tu pedido antes de dejarlo fijo.');return;}
  var wd=(document.getElementById('rec-day') as HTMLSelectElement|null);
  var sl=(document.getElementById('rec-slot') as HTMLSelectElement|null);
  if(!wd||!sl)return;
  var dia=parseInt(wd.value,10);
  busy=true;busyMsg='Guardando tu pedido fijo...';render();
  try{
    await api('recurring-add',{token:token,items:cart,weekday:dia,slot:sl.value,label:cart.length+' ítem'+(cart.length===1?'':'s')});
    busy=false;render();
    showToast('Listo — te avisamos cada '+DIAS_SEMANA[dia].toLowerCase()+' a las '+sl.value+'.');
  }catch(e){
    busy=false;render();
    showToast('No se pudo guardar: '+e.message);
  }
}

// FAVORITOS
async function loadFavorites(){
  sndScreen='p_favorites';busy=true;busyMsg='Cargando favoritos...';render();
  try{myFavorites=(await api('favorites-list',{token:token})).favorites;}catch(e){myFavorites=[];}
  busy=false;render();
}
function sPFavorites(){
  var h=H('MIS FAVORITOS',"sndScreen='p_home';render()")+'<div style="flex:1;padding:20px 20px 140px;overflow-y:auto" class="fi">';
  if(!myFavorites.length){
    h+='<div style="text-align:center;padding-top:64px"><div style="margin-bottom:12px;opacity:.5;display:flex;justify-content:center">'+icon('heart',32,'#A8C8B0')+'</div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:'+GOLD+';letter-spacing:.2em">Sin favoritos //</div><p style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:10px">Guarda un build desde la pantalla de confirmación de tu pedido.</p></div>';
  }else{
    h+=myFavorites.map(function(f){
      // min-width:0+text-overflow en el nombre y flex-shrink:0 en ELIMINAR (mismo
      // criterio que ya usa la fila de direcciones) — antes un nombre largo sin tope
      // podía tapar o empujar el botón de eliminar en pantallas angostas.
      return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:12px;padding:16px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px"><span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:17px;font-weight:600;color:var(--sw-text,#FFFFFF);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(f.name)+'</span><button onclick="doDeleteFavorite(\''+f.id+'\')" style="all:unset;cursor:pointer;color:#ff8888;font-family:EB Garamond,serif;font-weight:600;font-size:10px;flex-shrink:0">Eliminar</button></div><button onclick="loadBuild('+JSON.stringify(f.build).replace(/"/g,'&quot;')+')" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#241a08;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.08em;padding:11px;border-radius:8px;text-align:center">Pedir este //</button></div>';
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
  sndScreen='p_addresses';busy=true;busyMsg='Cargando direcciones...';render();
  try{myAddresses=(await api('addresses-list',{token:token})).addresses;}catch(e){myAddresses=[];}
  busy=false;render();
}
// editingAddrId: null = formulario en modo "agregar nueva"; con un id, el formulario de
// abajo queda prefilled con esa dirección y "Guardar" pasa a actualizarla en vez de crear
// una nueva — antes solo se podía agregar/eliminar, un typo obligaba a borrar y rehacer
// (hallazgo de auditoría UX, BAJO).
var editingAddrId=null;
function sPAddresses(){
  var editing=editingAddrId?myAddresses.find(function(a){return a.id===editingAddrId;}):null;
  var h=H('MIS DIRECCIONES',"sndScreen='p_home';render()")+'<div style="flex:1;padding:20px 20px 140px;overflow-y:auto" class="fi">';
  if(myAddresses.length){
    h+=myAddresses.map(function(a){
      return'<div style="background:var(--sw-card,#2D5246);border:1px solid '+(editingAddrId===a.id?GOLD:'var(--sw-border,#3A6B58)')+';border-radius:10px;padding:14px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(a.label)+'</div><div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(a.address)+'</div></div><div style="display:flex;gap:12px;flex-shrink:0;margin-left:10px"><button onclick="editingAddrId=\''+a.id+'\';newAddrMsg=\'\';render()" style="all:unset;cursor:pointer;color:'+GOLD+';font-family:EB Garamond,serif;font-style:italic;font-size:10px">Editar</button><button onclick="doDeleteAddress(\''+a.id+'\')" style="all:unset;cursor:pointer;color:#ff8888;font-family:EB Garamond,serif;font-style:italic;font-size:10px">Eliminar</button></div></div>';
    }).join('');
  }else{
    h+='<div style="text-align:center;padding-top:40px;margin-bottom:20px"><div style="margin-bottom:12px;opacity:.5;display:flex;justify-content:center">'+icon('direccion',32,'#A8C8B0')+'</div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:'+GOLD+';letter-spacing:.2em">Sin direcciones guardadas //</div></div>';
  }
  h+='<div style="margin-top:20px;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:16px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:10px">'+(editing?'Editar dirección //':'Agregar dirección //')+'</div><div style="display:flex;flex-direction:column;gap:8px">'+INP('na-label','Nombre // Casa, Trabajo...','text',editing?editing.label:undefined,'clientes')+INP('na-addr','Dirección completa','text',editing?editing.address:undefined,'direccion')+'<div id="na-msg" style="font-family:EB Garamond,serif;font-size:11px;color:#ff5555;min-height:14px">'+newAddrMsg+'</div>'+BTN(editing?'Guardar cambios //':'Guardar dirección //','doSaveAddress()')+(editing?'<div onclick="editingAddrId=null;newAddrMsg=\'\';render()" style="text-align:center;margin-top:8px;cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">Cancelar edición</div>':'')+'</div></div>';
  h+='</div>'+NAV();
  return h;
}
async function doSaveAddress(){
  var label=gv('na-label').trim();
  var addr=gv('na-addr').trim();
  if(!label||!addr){newAddrMsg='Completa nombre y dirección.';render();return;}
  try{
    if(editingAddrId){
      await api('addresses-update',{token:token,id:editingAddrId,label:label,address:addr});
      editingAddrId=null;
    }else{
      await api('addresses-add',{token:token,label:label,address:addr});
    }
    newAddrMsg='';
    await loadAddresses();
  }catch(e){newAddrMsg=e.message;render();}
}
async function doDeleteAddress(id){
  if(!(await showConfirm('¿Eliminar esta dirección?')))return;
  if(editingAddrId===id)editingAddrId=null;
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
  sndScreen='admin_home';busy=true;busyMsg='Cargando...';render();
  var done=false;
  var timer=setTimeout(function(){if(!done){done=true;busy=false;render();}},8000);
  try{var r=await api('admin-orders',{token:token});adminOrders=r.orders;adminOrdersTruncated=!!r.truncated;adminAddressFlags=r.addressFlags||null;lastPollCount=adminOrders.length;}
  catch(e){adminOrders=[];}
  busy=false;startPoll();render();
}

// Extraído a partir de un objeto de pedido directo (no solo por id en adminOrders) para
// poder reusarse también desde resultados de búsqueda (sndScreen='admin_search', ver #95), que
// no viven en adminOrders.
// contact_phone es el teléfono que el cliente escribió en ESTE pedido — antes solo se
// usaba customer_phone (el de la cuenta), así que un pedido de invitado nunca mostraba
// este botón, dejando al operador sin forma de escribirle por WhatsApp.
// Traduce el enum de status a una frase real — antes se inyectaba el enum crudo
// (ej. "está: PREPARANDO") directo en el mensaje de WhatsApp que lee el cliente.
function waStatusPhrase(o){
  switch(o.status){
    case 'RECIBIDO':return 'fue recibido y lo vamos a preparar pronto';
    case 'PREPARANDO':return 'lo estamos preparando ahora mismo';
    case 'EN CAMINO':return 'va en camino a tu dirección'+(o.eta_minutes?' (ETA ~'+o.eta_minutes+' min)':'');
    case 'ENTREGADO':return 'fue entregado — ¡que lo disfrutes!';
    case 'CANCELADO':return 'fue cancelado';
    default:return 'está: '+o.status;
  }
}
function waAdminOrder(o){
  var phone=o&&(o.contact_phone||o.customer_phone);
  if(!phone)return;
  var msg='Hola '+o.customer_name+'! Tu pedido '+o.ref+' de SND//WCH '+waStatusPhrase(o)+'. ¡Gracias por tu pedido!';
  window.open('https://wa.me/51'+phone.replace(/\D/g,'').replace(/^51/,'')+'?text='+encodeURIComponent(msg),'_blank');
}
function waAdmin(ordId){
  waAdminOrder((adminOrders||[]).find(function(x){return x.id===ordId;}));
}

// #19 — Mandarle al motorizado el link que cierra el pedido solo.
//
// Va por WhatsApp porque es como se le habla al motorizado hoy (ver el despacho automático,
// que sigue bloqueado por la API de WhatsApp Business). El link no exige cuenta ni sesión:
// el token ES la autorización, y se quema al usarse.
function waDeliveryLink(ordId){
  var o=(adminOrders||[]).find(function(x){return x.id===ordId;});
  if(!o||!o.delivery_token){showToast('Este pedido todavía no tiene link — se crea al pasarlo a EN CAMINO.');return;}
  var link=location.origin+location.pathname+'?entrega='+encodeURIComponent(o.delivery_token);
  var msg='Pedido '+o.ref+' — '+(o.customer_name||'')+'\n'+(o.customer_address||'')
    +'\n\nCuando lo entregues, abre este link y queda cerrado solo:\n'+link;
  // Sin número del motorizado configurado, wa.me sin destinatario abre el selector de
  // contactos: es un toque más, pero funciona sin pedirle al dueño que configure nada.
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
}
// El bucket de comprobantes es privado — cada tap pide una URL firmada nueva de corta
// duración en vez de guardar una URL fija (ver actAdminReceiptUrl), así nunca queda una
// URL permanente/pública dando vueltas.
async function viewReceipt(ordId){
  try{
    var r=await api('admin-receipt-url',{token:token,orderId:ordId});
    window.open(r.url,'_blank');
  }catch(e){showToast(e.message);}
}
// La ETA ahora la pone el servidor según la zona (ver DEFAULT_ETA_BY_ZONE en orders.ts),
// pero hay pedidos que se salen de la norma: tráfico, una dirección difícil, un motorizado
// que se demora. Esto deja corregirla en un tap sin cambiar el estado del pedido.
async function editEta(ordId,currentEta){
  var etaStr=await showPrompt('¿Cuántos minutos le dices al cliente?',String(currentEta||30),'number');
  if(etaStr===null)return;
  var eta=parseInt(etaStr,10);
  if(!eta||eta<=0){showToast('Pon un número de minutos válido.');return;}
  try{
    var r=await api('admin-update-status',{token:token,orderId:ordId,status:'EN CAMINO',etaMinutes:eta});
    adminOrders=adminOrders.map(function(o){return o.id===ordId?r.order:o;});
    showToast('ETA actualizada a '+eta+' min //','success');
    render();
  }catch(e){showToast(e.message);}
}
async function updateStatus(ordId,newSt){
  if(_adminOrderActionInProgress)return;
  // Ya no se pregunta la ETA en cada pedido: el servidor pone la de la zona si no llega
  // ninguna (ver DEFAULT_ETA_BY_ZONE en orders.ts). Eran 10 prompts al día escribiendo casi
  // siempre el mismo número. Para cambiarla en un pedido puntual está el botón de editar
  // ETA de la tarjeta, que sigue mandando etaMinutes explícito.
  var eta=null;
  _adminOrderActionInProgress=true;
  try{
    var r=await api('admin-update-status',{token:token,orderId:ordId,status:newSt,etaMinutes:eta});
    adminOrders=adminOrders.map(function(o){return o.id===ordId?r.order:o;});
    if(newSt==='ENTREGADO')adminOrders=adminOrders.filter(function(o){return o.id!==ordId;});
    _adminOrderActionInProgress=false;render();
  }catch(e){
    // Antes este catch solo hacía console.warn y volvía: el servidor rechaza avanzar un
    // pedido Yape/Plin sin pago confirmado, así que el operador tocaba el botón grande,
    // no pasaba absolutamente nada visible, y volvía a tocar. El resto de acciones de
    // admin (confirmar pago, cancelar) sí avisan — esta era la única muda, y es la más
    // usada de todas.
    _adminOrderActionInProgress=false;
    showToast(e.message||'No se pudo cambiar el estado del pedido.');
    render();return;
  }
  // El correo de cambio de estado ahora lo manda el propio servidor dentro de
  // admin-update-status (ver applyOrderStatusUpdate en orders.ts) — antes este cliente
  // llamaba directo a la función edge send-order-email sin ninguna autenticación (relay
  // de correo abierto + HTML sin escapar, hallazgo de auditoría de seguridad, CRÍTICO).
}
// El operador revisa su propia app de Yape/Plin y confirma aquí que el dinero llegó —
// recién entonces el pedido puede avanzar de RECIBIDO (el servidor también lo exige).
async function confirmOrderPayment(ordId){
  if(_adminOrderActionInProgress)return;
  _adminOrderActionInProgress=true;
  try{
    var r=await api('admin-confirm-payment',{token:token,orderId:ordId});
    adminOrders=adminOrders.map(function(o){return o.id===ordId?r.order:o;});
    _adminOrderActionInProgress=false;render();
  }catch(e){_adminOrderActionInProgress=false;showToast(e.message);}
}
// Antes confirmar el pago y pasar a preparación eran 2 taps separados (confirmar, luego
// tocar de nuevo "MARCAR COMO PREPARANDO") — en la inmensa mayoría de los casos el
// operador hace ambas cosas seguidas apenas ve el dinero en su app (hallazgo de la
// re-auditoría del panel admin). confirmOrderPayment sigue disponible aparte para el
// caso raro en que quiera confirmar el pago sin arrancar cocina todavía.
async function confirmAndAdvance(ordId){
  if(_adminOrderActionInProgress)return;
  _adminOrderActionInProgress=true;
  try{
    await api('admin-confirm-payment',{token:token,orderId:ordId});
    var r=await api('admin-update-status',{token:token,orderId:ordId,status:'PREPARANDO'});
    adminOrders=adminOrders.map(function(o){return o.id===ordId?r.order:o;});
    _adminOrderActionInProgress=false;render();
  }catch(e){_adminOrderActionInProgress=false;showToast(e.message);}
}
// Cancela un pedido — libera el stock reservado (ver actAdminCancelOrder). Antes esto
// solo funcionaba para pedidos nunca pagados (Yape/Plin sin confirmar); un pedido ya
// pagado con tarjeta/crédito no se podía cancelar en la app aunque, por ejemplo, se
// acabara un ingrediente a media preparación (hallazgo de la auditoría de flujo de
// pedidos) — ahora sí, pero con una advertencia aparte de que el reembolso se coordina
// manualmente (esta acción no toca Culqi ni el saldo de crédito).
async function cancelOrder(ordId){
  if(_adminOrderActionInProgress)return;
  var ord=(adminOrders||[]).find(function(o){return o.id===ordId;});
  var wasPaid=ord&&ord.payment_status==='paid';
  // Antes eran 2 modales secuenciales (confirmar → motivo) — fricción evitable justo en
  // una acción ya de por sí estresante (hallazgo de auditoría operativa, MEDIO). Un solo
  // showPrompt hace las dos cosas: cancelar el prompt (null) equivale a "no cancelar el
  // pedido"; aceptar (con o sin texto) confirma y captura el motivo opcional a la vez.
  var msg=(wasPaid
    ?'¿Cancelar este pedido? YA FUE PAGADO — tendrás que coordinar el reembolso tú mismo (Culqi/Yape/Plin/crédito), esto solo libera el stock reservado.'
    :'¿Cancelar este pedido? Se asume que el cliente nunca transfirió. Esto libera el stock reservado.')
    +'\n\n¿Por qué se cancela? (opcional, ayuda al resumen semanal)';
  var reason=await showPrompt(msg,'');
  if(reason===null)return; // admin canceló
  // Mismo guard que updateStatus/confirmOrderPayment/confirmAndAdvance — antes esta
  // acción era la única de la cola admin sin protección contra doble-tap (hallazgo de
  // auditoría de funcionamiento).
  _adminOrderActionInProgress=true;
  try{
    var r=await api('admin-cancel-order',{token:token,orderId:ordId,acknowledgeRefund:true,reason:reason||''});
    adminOrders=adminOrders.filter(function(o){return o.id!==ordId;});
    _adminOrderActionInProgress=false;render();
  }catch(e){_adminOrderActionInProgress=false;showToast(e.message);}
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
  var okCount=0,errs=[];
  for(var i=0;i<targets.length;i++){
    try{
      var r=await api('admin-confirm-payment',{token:token,orderId:targets[i]});
      adminOrders=adminOrders.map(function(o){return o.id===targets[i]?r.order:o;});
      okCount++;
    }catch(e){errs.push(e.message);}
  }
  bulkSelected={};
  busy=false;
  // Antes solo mostraba un conteo genérico ("N fallaron") — el operador tenía que revisar
  // manualmente cuál pedido falló y por qué, en medio de una tanda (hallazgo de auditoría
  // operativa, ALTO). Ahora muestra el motivo real (ej. "Confirma que el pago llegó...").
  if(errs.length)showToast(okCount+' confirmado(s), '+errs.length+' fallaron: '+errs.join(' · '));
  render();
}
// Avanza todos los pedidos seleccionados al mismo estado de un solo tap (ver #113 y
// actAdminBulkUpdateStatus) — cada pedido se procesa por separado en el servidor, así que
// un pago Yape/Plin sin confirmar en uno de ellos no bloquea al resto del lote.
async function bulkAdvanceStatus(status){
  var ids=Object.keys(bulkSelected).filter(function(k){return bulkSelected[k];});
  if(!ids.length)return;
  // Mismo ETA que ya se pide al avanzar UN pedido a EN CAMINO (updateStatus) — antes el
  // lote nunca lo pedía, así que el cliente recibía el push genérico en vez de la ventana
  // de hora real (hallazgo de auditoría operativa, ALTO).
  var eta=null;
  if(status==='EN CAMINO'){
    var etaStr=await showPrompt('¿Tiempo estimado de entrega en minutos (para los '+ids.length+' pedidos)?','20','number');
    if(etaStr===null)return;
    eta=parseInt(etaStr,10);
    if(!eta||eta<=0)eta=20;
  }
  if(!(await showConfirm('¿Marcar '+ids.length+' pedido(s) como '+status+'?')))return;
  busy=true;busyMsg='Actualizando pedidos...';render();
  try{
    var r=await api('admin-bulk-update-status',{token:token,orderIds:ids,status:status,etaMinutes:eta});
    var updatedIds={};
    (r.updated||[]).forEach(function(o){updatedIds[o.id]=o;});
    adminOrders=adminOrders.map(function(o){return updatedIds[o.id]?updatedIds[o.id]:o;});
    if(status==='ENTREGADO')adminOrders=adminOrders.filter(function(o){return !updatedIds[o.id];});
    bulkSelected={};
    // Antes solo mostraba un conteo genérico — el operador tenía que adivinar cuál pedido
    // falló y por qué (hallazgo de auditoría operativa, ALTO). El backend ya devuelve el
    // motivo real por pedido (r.failed[].error), solo faltaba mostrarlo.
    if(r.failed&&r.failed.length)showToast(r.failed.length+' pedido(s) no se pudieron actualizar: '+r.failed.map(function(f){return f.error;}).join(' · '));
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
    // Antes imprimía `it.label||it.sigId||it.prot||it.code` — y los ítems del carrito NO
    // tienen campo `label` (ver currentBuiltItem), así que el papel salía con códigos
    // internos: "1x P01", "1x SIG03". Ahora imprime el nombre real y la receta completa,
    // que es justo para lo que sirve un ticket de cocina.
    ?o.items.map(function(it){
      var lines=itemRecipeLines(it);
      return'<div style="padding:6px 0;border-bottom:1px dashed #000"><div><b>'+(it.qty||1)+'x '+esc(itemLabel(it))+'</b></div>'
        +lines.map(function(l){return'<div style="font-size:12px">'+esc(l)+'</div>';}).join('')+'</div>';
    }).join('')
    :'<div style="padding:4px 0">'+esc(o.summary||'')+'</div>';
  var html='<!doctype html><html><head><meta charset="utf-8"><title>Ticket '+esc(o.ref)+'</title>'
    +'<style>body{font-family:monospace;width:280px;margin:0 auto;padding:16px;color:#000}h1{font-size:16px;margin:0 0 4px}.hr{border-top:1px dashed #000;margin:8px 0}</style></head><body>'
    +'<h1>SND//WCH — COCINA</h1><div>REF: '+esc(o.ref)+'</div><div>'+esc(o.date||'')+'</div><div class="hr"></div>'
    +items
    +'<div class="hr"></div>'+(o.notes?'<div><b>NOTA:</b> '+esc(o.notes)+'</div>':'')
    // customer_rank se guarda en el pedido al momento de crearse (ver finalizeAndInsertOrder/
    // orders.ts) — solo para los 2 rangos más altos vale la pena un toque especial en
    // cocina; para el resto no aporta nada que el operador necesite ver.
    +((o.customer_rank==='CÍRCULO INTERNO'||o.customer_rank==='MESA FUNDADORA')?'<div class="hr"></div><div style="display:flex;align-items:center;gap:5px">'+icon('crown',13)+'<span>Cliente '+esc(o.customer_rank)+' — '+esc(o.customer_name||'')+'. ¡Gracias por su preferencia!</span></div>':'')
    +'<script>window.onload=function(){window.print();}<\/script></body></html>';
  var w=window.open('','_blank','width=340,height=600');
  if(!w){showToast('El navegador bloqueó la ventana de impresión.');return;}
  w.document.write(html);
  w.document.close();
}
