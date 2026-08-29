// POINTS HOME
function sWelcome(){
  var pts=cust?cust.points||0:0;
  var nm=cust?cust.name.split(' ')[0]:'';
  var rwd=RWDS.slice().reverse().find(function(r){return pts>=r.pts;});
  var next=RWDS.find(function(r){return r.pts>pts;});
  return'<div onclick="sndScreen=\'p_home\';render()" style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;background:var(--sw-bg,#1E3932);padding:48px 24px;position:relative;overflow:hidden">'
    +'<div style="position:absolute;top:-80px;right:-80px;width:300px;height:300px;border-radius:50%;background:rgba(203,162,88,.06)"></div>'
    +'<div style="position:absolute;bottom:-60px;left:-60px;width:220px;height:220px;border-radius:50%;background:rgba(203,162,88,.04)"></div>'
    +'<div style="text-align:center;position:relative;z-index:1;width:100%">'
    +'<div style="margin-bottom:28px">'+WORDMARK(24,true)+'</div>'
    // sndScreen='p_welcome' solo se dispara al final de doReg() — doLogin() va directo a p_home
    // sin pasar por aquí — así que esta pantalla SIEMPRE es un registro nuevo, nunca un
    // login de alguien que vuelve. "de vuelta" era simplemente incorrecto en todos los casos.
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:'+GOLD+';letter-spacing:.28em;margin-bottom:10px">Bienvenido //</div>'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:34px;font-weight:640;color:var(--sw-text-body,#F2F0EB);line-height:1.15;margin-bottom:4px;text-wrap:balance;word-break:break-word">'+esc(nm.toUpperCase())+'</div>'
    +'<div style="width:60px;height:3px;background:'+GOLD+';margin:18px auto 28px;border-radius:2px"></div>'
    +'<div style="background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.25);border-radius:16px;padding:20px;margin-bottom:16px">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">Tus puntos //</div>'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:72px;font-weight:640;color:'+GOLD+';line-height:1">'+pts+'</div>'
    // Traducción a soles: "1,240 puntos" no le dice a nadie cuánto tiene. La evidencia de
    // programas de fidelidad dice que el problema del esquema 1:1 no es la tasa sino que
    // el premio se SIENTE lejos — mostrar el equivalente en dinero (mismo criterio que la
    // tarjeta de regalo, 40 pts = S/1) lo vuelve concreto de inmediato.
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">Puntos acumulados · equivalen a '+SOLES_TXT+(pts/GIFT_CARD_POINTS_PER_SOL).toFixed(2)+'</div>'
    +(rwd?'<div style="margin-top:12px;background:rgba(203,162,88,.15);border-radius:8px;padding:8px 12px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:'+GOLD+'">✓ Puedes canjear: '+(rwd.n+' '+rwd.s).toUpperCase()+'</div></div>':'')
    +(next?'<div style="margin-top:8px"><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">Te faltan <span style="color:var(--sw-text-body,#F2F0EB);font-weight:700">'+(next.pts-pts)+' pts</span> ('+SOLES_TXT+((next.pts-pts)/GIFT_CARD_POINTS_PER_SOL).toFixed(2)+' de consumo) para '+next.n+' // '+next.s+'</div></div>':'')
    +'</div>'
    +'<div style="display:flex;gap:10px;justify-content:center">'
    +'<div style="background:rgba(242,240,235,.08);border:1px solid rgba(242,240,235,.12);border-radius:12px;padding:12px 16px;text-align:center">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:var(--sw-text-body,#F2F0EB)">'+(cust?cust.total_orders||0:0)+'</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:7px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">Pedidos</div></div>'
    +'<div style="background:rgba(242,240,235,.08);border:1px solid rgba(242,240,235,.12);border-radius:12px;padding:12px 16px;text-align:center">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:var(--sw-text-body,#F2F0EB)">'+(cust?cust.total_redeemed||0:0)+'</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:7px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">Canjeados</div></div>'
    +'</div>'
    // Antes esta pantalla solo mostraba el saldo de bienvenida sin explicar cómo
    // funciona el programa — un cliente nuevo no tenía forma de saber que hay recompensas,
    // referidos o un reto mensual hasta toparse con esas pantallas por su cuenta.
    +'<div style="margin-top:20px;text-align:left;background:rgba(242,240,235,.05);border-radius:12px;padding:16px 18px">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:10px">Cómo funciona //</div>'
    +[['cart','Gana puntos con cada pedido pagado.'],['gift','Canjéalos por salsas, upgrades y sándwiches gratis.'],['heart','Invita a un amigo y gánate un sándwich 15CM gratis.']].map(function(x){return'<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px">'+icon(x[0],15,GOLD)+'<span style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.4">'+x[1]+'</span></div>';}).join('')
    +'</div>'
    +'<div style="margin-top:20px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">toca para continuar //</div>'
    +'</div></div>';
}
function sPHome(){
  var pts=cust.points||0;
  var next=RWDS.find(function(r){return r.pts>pts;}),prev=null;
  RWDS.forEach(function(r){if(r.pts<=pts)prev=r;});
  var pct=next?((pts-(prev?prev.pts:0))/(next.pts-(prev?prev.pts:0)))*100:100;
  var unlocked=RWDS.filter(function(r){return r.pts<=pts;});
  var totalOrders=cust.total_orders||0;
  var nextRank=RANKS.find(function(r){return r.minOrders>totalOrders;});
  // Ring circular en vez de la barra lineal de antes — mismo dato (progreso hacia la
  // próxima recompensa), pero como el elemento visual central del perfil, igual que en
  // el mockup Prada Caffè (fase 2 de fidelidad). Debajo del ring se agrega el rango
  // (antes solo vivía en sPProfile, una pantalla aparte) y cuánto falta para el
  // siguiente — dato que el home del perfil no mostraba en absoluto hasta ahora.
  var ringR=54,ringC=2*Math.PI*ringR,ringPct=next?Math.min(pct,100):100,ringDash=ringC*(ringPct/100);
  var ringHTML='<div style="display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:20px">'
    +'<div style="position:relative;width:140px;height:140px">'
    +'<svg width="140" height="140" viewBox="0 0 140 140" style="transform:rotate(-90deg)"><circle cx="70" cy="70" r="'+ringR+'" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"/><circle cx="70" cy="70" r="'+ringR+'" fill="none" stroke="'+GOLD+'" stroke-width="8" stroke-linecap="round" stroke-dasharray="'+ringDash+' '+ringC+'"/></svg>'
    +'<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:32px;font-weight:640;color:#fff;line-height:1">'+pts.toLocaleString()+'</span><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">puntos</span></div>'
    +'</div>'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:600;color:'+GOLD+';margin-top:14px;letter-spacing:.05em">'+esc(rankName(totalOrders))+'</div>'
    +(nextRank
      ?'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">Te faltan <b style="color:var(--sw-text-body,#F2F0EB)">'+(nextRank.minOrders-totalOrders)+' pedido'+(nextRank.minOrders-totalOrders===1?'':'s')+'</b> para '+esc(nextRank.name)+'</div>'
      :'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">Ya alcanzaste el rango máximo</div>')
    +'</div>';
  return H()+'<div style="flex:1;padding:20px 20px 140px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:14px">Hola, '+esc(cust.name.split(' ')[0].toUpperCase())+' //</div>'
    // Gradiente navy (#0c1d30) fuera de la paleta forest/dorado documentada en DESIGN.md
    // (auditoría UX, P3) — reemplazado por un degradado dentro de la misma familia verde
    // bosque (forest-card-deep → casi negro con tinte verde) para que el hero de Perfil
    // no sea la única superficie de toda la app con un tono de marca distinto.
    +'<div style="background:linear-gradient(135deg,#1A3028,#0c1712);border:1px solid rgba(203,162,88,.15);border-radius:16px;padding:24px;margin-bottom:20px;overflow:hidden">'
    +ringHTML
    +(next?'<div style="background:rgba(255,255,255,.05);border-radius:4px;height:4px;overflow:hidden;margin-bottom:6px"><div style="background:'+GOLD+';height:100%;width:'+Math.min(pct,100)+'%;border-radius:4px"></div></div><div style="display:flex;justify-content:space-between"><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0)">+'+(next.pts-pts)+' pts para</span><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:600;color:'+GOLD+'">'+next.n+' // '+next.s+'</span></div>':'')
    +'<div style="margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.04);display:flex;gap:24px">'+[['Pedidos',cust.total_orders||0],['Canjeados',cust.total_redeemed||0]].map(function(x){return'<div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+x[1]+'</div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:8px;color:'+GOLD+';letter-spacing:.15em">'+x[0]+'</div></div>';}).join('')+'</div></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">'+[['Canjear','Recompensa','sndScreen=\'p_rewards\';render()'],['Mis','Pedidos','sndScreen=\'p_orders\';loadMyOrders()'],['Historial','Puntos','loadHist()'],['Mi','Perfil','sndScreen=\'p_profile\';render()'],['Mis','Direcciones','loadAddresses()'],['Mis','Favoritos','loadFavorites()']].concat(isAdmin?[['Panel','Admin','sndScreen=\'admin_home\';loadAdmin()']]:[]).map(function(x){return'<div onclick="'+x[2]+'" style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:16px 14px;cursor:pointer"><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);letter-spacing:.03em">'+x[0]+'<span style="color:'+GOLD+'"> //</span></div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.15em;margin-top:3px">'+x[1]+'</div></div>';}).join('')+'</div>'
    +(unlocked.length?'<div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Listas para usar //</div>'+unlocked.map(function(r){return'<div style="background:var(--sw-card2,#1A3028);border:1px solid '+GOLD+';border-radius:10px;padding:13px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+r.n+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+r.s+'</span><span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0)">se usa al pedir</span></div>';}).join('')+'</div>':'')
    +'</div>'+NAV();
}

// MY ORDERS — client side
async function loadMyOrders(){
  sndScreen='p_orders';listLoading=true;render();
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
    return'<div onclick="_sndOd=\''+o.id+'\';rtStars=0;rtMsg=\'\';sndScreen=\'p_ord_detail\';render()" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">'
      +'<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:16px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(o.customer_name)+'</div>'
      +'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(o.ref)+' · '+esc(o.date)+'</div></div>'
      +'<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:'+GOLD+';flex-shrink:0">'+SOLES+pz(o.total)+'</div></div>'
      +'<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:8px">'+esc(o.summary)+'</div>'
      +'<div style="display:flex;gap:2px;margin-bottom:6px">'+STEPS.map(function(st,i){var dn=i<=ci;return'<div style="flex:1;height:3px;background:'+(dn?GOLD:'#3A6B58')+';border-radius:3px"></div>';}).join('')+'</div>'
      +stBadge(o.status)+'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:8px;color:'+GOLD+';text-align:right;margin-top:4px">ver detalle ›</div></div>';
  }
  var h=H('MIS PEDIDOS',"sndScreen='p_home';render()")+'<div style="flex:1;padding:20px 20px 140px;overflow-y:auto" class="fi">';
  if(listLoading){
    h+=skeletonCards(3,132);
  }else{
    if(act.length){
      h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:#ffa500;letter-spacing:.2em;margin-bottom:10px" class="blink">● Activos // '+act.length+'</div>';
      h+=act.map(card).join('');
    }
    if(done.length){
      h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:'+(act.length?'16px':'0')+' 0 10px">Anteriores // '+done.length+'</div>';
      h+=done.map(card).join('');
    }
    if(!myOrders.length){
      h+='<div style="text-align:center;padding-top:64px"><div style="margin-bottom:12px;opacity:.5;display:flex;justify-content:center">'+icon('reclamo',32,'#A8C8B0')+'</div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">Sin pedidos //</div>'+BTN('Hacer un pedido //','swTab(\'order\')')+'</div>';
    }
  }
  h+='<div style="margin-top:14px">'+BTN('Actualizar //','loadMyOrders()',true)+'</div></div>'+NAV();
  return h;
}
var _sndOd=null;
function sOrdDetail(){
  var o=myOrders.find(function(x){return x.id==_sndOd||x.id===_sndOd;});
  if(!o)return sPOrders();
  var ci=STEPS.indexOf(o.status);
  return H('DETALLE',"sndScreen='p_orders';render()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">'
    +'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:12px;padding:18px;margin-bottom:12px">'
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'
    +'<div style="min-width:0"><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:var(--sw-text,#FFFFFF);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(o.customer_name)+'</div>'
    +'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:'+GOLD+';margin-top:2px">'+esc(o.ref)+'</div>'
    +'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(o.date)+'</div></div>'
    +'<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:34px;font-weight:640;color:'+GOLD+'">'+SOLES+pz(o.total)+'</div></div>'
    +'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Pedido //</div>'
    +'<div style="font-family:EB Garamond,serif;font-size:13px;color:#ddd;line-height:1.6;margin-bottom:10px">'+esc(o.summary)+'</div>'
    +'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Dirección //</div>'
    +'<div style="font-family:EB Garamond,serif;font-size:12px;color:#aaa">'+esc(o.customer_address)+'</div>'
    +(o.redeemed_reward?'<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--sw-border,#3A6B58)"><div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:#25D366;display:flex;align-items:center;gap:6px">'+icon('gift',12,'#25D366')+esc(o.redeemed_reward)+'</div></div>':'')
    +'</div>'
    +'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:12px;padding:16px;margin-bottom:12px">'
    +'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:10px">Estado //</div>'
    +'<div style="display:flex;gap:4px;margin-bottom:12px">'+STEPS.map(function(st,i){var dn=i<=ci;return'<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px"><div style="height:5px;width:100%;background:'+(dn?GOLD:'#3A6B58')+';border-radius:4px"></div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:7px;color:'+(dn?GOLD:'#4A7A68')+';text-align:center;line-height:1.3">'+((STATUSES[st]||{}).label||st).replace(' ','<br>')+'</div></div>';}).join('')+'</div>'
    +stBadge(o.status)
    +'</div>'
    // Antes la página de Cambios y Devoluciones prometía "puedes cancelar sin costo antes
    // de que la cocina empiece a preparar tu pedido", pero no existía ningún botón para
    // hacerlo desde la app — la única forma real era escribir por WhatsApp y esperar a que
    // un operador lo cancelara manualmente (hallazgo de la auditoría de flujo de pedidos:
    // una promesa que la app no cumplía por sí sola). Este botón cumple esa promesa
    // directamente mientras el pedido sigue en RECIBIDO.
    +(o.status==='RECIBIDO'?BTN('Cancelar pedido //','doCancelMyOrder(\''+o.id+'\',\''+o.ref+'\')',true):'')
    +(o.status!=='ENTREGADO'?'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);text-align:center;margin-top:10px" class="blink">&#8635; Toca Actualizar en Mis Pedidos</div>':'<div style="font-family:EB Garamond,serif;font-size:13px;color:#25D366;text-align:center;margin-top:10px">&#9989; ¡Entregado!</div>')
    +ratingHTML(o)
    +'</div>'+NAV();
}
var _cancelMyOrderInProgress=false;
// Guard contra doble-tap — el servidor ya reclama el pedido de forma atómica
// (actCancelMyOrder exige status=eq.RECIBIDO en la misma sentencia que lo marca
// CANCELADO), pero sin este guard dos taps casi simultáneos en "Cancelar pedido" antes
// de que el primero resuelva mandaban dos solicitudes que el servidor procesaba en
// paralelo — la primera reclamaba el pedido, la segunda solo veía el error genérico
// "ya no se puede cancelar" en vez de nunca dispararse (hallazgo de auditoría de
// funcionamiento).
async function doCancelMyOrder(ordId,ref){
  if(_cancelMyOrderInProgress)return;
  if(!(await showConfirm('¿Cancelar este pedido? Como la cocina aún no empezó a prepararlo, no tiene costo.')))return;
  _cancelMyOrderInProgress=true;
  try{
    var r=await api('cancel-my-order',{token:token||undefined,orderId:ordId,ref:ref});
    myOrders=myOrders.map(function(o){return o.id===ordId?r.order:o;});
    showToast('Pedido cancelado.','success');
    _cancelMyOrderInProgress=false;render();
  }catch(e){_cancelMyOrderInProgress=false;showToast(e.message);}
}
function ratingHTML(o){
  if(o.status!=='ENTREGADO')return'';
  if(ratedRefs().indexOf(o.ref)>=0){
    // Justo tras calificar (el momento de mayor satisfacción real) se resurfacea el
    // código de referido en vez del simple "gracias" — antes vivía escondido en el
    // perfil y nunca se mostraba en el instante en que el cliente está más contento
    // (hallazgo del checklist de pre-lanzamiento). Solo aparece esta vez (justRatedRef),
    // no en cada visita futura al historial — y solo si hay cuenta (el código es el
    // teléfono del cliente, no existe para invitados).
    if(justRatedRef===o.ref&&cust){
      // Copy reforzado (plan de conversión desde frío, MARKETING_PLAN.md §14.4.3) — antes
      // solo mencionaba WhatsApp en el texto y en el botón, aunque shareReferral() ya usa
      // navigator.share() cuando está disponible (abre el selector nativo completo:
      // Instagram, TikTok, WhatsApp, etc.), no solo WhatsApp. El copy ahora refleja lo que
      // el botón de verdad hace, y lo pide explícitamente — mismo momento de mayor
      // satisfacción de siempre, sin lógica nueva.
      return'<div style="margin-top:12px;background:var(--sw-card2,#1A3028);border:1px solid '+GOLD+';border-radius:12px;padding:18px;text-align:center"><div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:#25D366;margin-bottom:10px">&#10003; ¡Gracias por calificar!</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:6px">¿Compartes SND//WCH en tu Instagram, TikTok o WhatsApp?</div><div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:12px;line-height:1.5">Con tu link te ganas un sándwich 15CM GRATIS cuando tu invitado haga su primer pedido — compártelo en una historia o mándaselo directo a alguien.</div>'+BTN('Compartir //','shareReferral()')+'</div>';
    }
    return'<div style="margin-top:12px;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:12px;padding:16px;text-align:center"><div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:#25D366">&#10003; Ya calificaste este pedido &mdash; ¡gracias!</div></div>';
  }
  // El consentimiento de testimonio NUNCA viene marcado por defecto — el cliente tiene
  // que elegirlo activamente cada vez (hallazgo del checklist de pre-lanzamiento: la
  // web/redes van a necesitar reseñas reales para publicar, pero nunca sin permiso
  // explícito de a quién pertenecen).
  return'<div style="margin-top:12px;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:12px;padding:18px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:10px">¿Cómo estuvo tu pedido? //</div><div style="display:flex;gap:8px;margin-bottom:12px;justify-content:center">'+[1,2,3,4,5].map(function(n){var on=n<=rtStars;return'<span onclick="rtStars='+n+';render()" style="cursor:pointer;font-size:28px;color:'+(on?'#F5C518':'#3A6B58')+'">&#9733;</span>';}).join('')+'</div><textarea id="rt-comment" placeholder="Comentario opcional" style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:10px 12px;color:var(--sw-text,#FFFFFF);width:100%;font-size:12px;font-family:EB Garamond,serif;min-height:60px;margin-bottom:10px;box-sizing:border-box"></textarea><label style="display:flex;align-items:flex-start;gap:8px;font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:10px;cursor:pointer"><input type="checkbox" id="rt-consent" onchange="rtConsent=this.checked" '+(rtConsent?'checked':'')+' style="accent-color:'+GOLD+';margin-top:2px;flex-shrink:0">Autorizo que SND//WCH use esta reseña como testimonio público (redes sociales, web) — opcional.</label><div id="rt-msg" style="font-family:EB Garamond,serif;font-size:11px;color:#ff5555;min-height:14px;margin-bottom:8px">'+rtMsg+'</div>'+BTN('Enviar calificación //','doSubmitRating(\''+o.ref+'\')')+'</div>';
}
async function doSubmitRating(ref){
  if(!rtStars){rtMsg='Elige de 1 a 5 estrellas.';render();return;}
  var commentEl=(document.getElementById('rt-comment') as HTMLInputElement | null);
  var comment=commentEl?commentEl.value.trim():'';
  try{
    await api('submit-rating',{ref:ref,stars:rtStars,comment:comment,testimonialConsent:rtConsent});
    markRated(ref);
    justRatedRef=ref;
    rtStars=0;rtMsg='';rtConsent=false;
  }catch(e){
    if(e.message&&e.message.indexOf('ya fue calificado')>=0)markRated(ref);
    rtMsg=e.message;
  }
  render();
}

async function loadHist(){
  sndScreen='p_history';listLoading=true;render();
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
  var h=H('HISTORIAL DE PUNTOS',"sndScreen='p_home';render()")+'<div style="flex:1;padding:20px 20px 140px;overflow-y:auto" class="fi">';
  if(listLoading){
    h+=skeletonCards(5,48);
  }else if(!txns.length){
    h+='<div style="text-align:center;padding-top:64px"><div style="margin-bottom:12px;opacity:.5;display:flex;justify-content:center">'+icon('estrella',32,'#A8C8B0')+'</div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:'+GOLD+';letter-spacing:.2em">Sin movimientos //</div></div>';
  }else{
    h+=txns.map(function(t){
      var pos=(t.points||0)>=0;
      return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:EB Garamond,serif;font-size:13px;color:var(--sw-text-body,#F2F0EB)">'+esc(t.description||t.type)+'</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(t.date||'')+'</div></div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:'+(pos?'#25D366':'#ff8888')+'">'+(pos?'+':'')+t.points+'</div></div>';
    }).join('');
  }
  h+='</div>'+NAV();
  return h;
}

function sPRewards(){
  var pts=cust.points||0;
  return H('RECOMPENSAS','sndScreen=\'p_home\';render()')+'<div style="flex:1;padding:20px 20px 140px;overflow-y:auto" class="fi"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:4px">Tu balance //</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:48px;font-weight:640;color:#fff;margin-bottom:12px;line-height:1">'+pts+'<span style="color:'+GOLD+';font-size:22px"> pts</span></div><p style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:24px;line-height:1.5">Las recompensas se aplican directamente a tu pedido — elígelas en la pantalla de confirmar cuando tengas puntos suficientes.</p>'// La tarjeta bloqueada usaba una paleta gris propia (#141C19/#666/#555/#444/#1a1a1a/
// #2a2a2a) en vez de los tokens ya establecidos para "no disponible ahora" (CARDOFF/
// TOPOFF: var(--sw-card2)+var(--sw-text-muted)) — se unifica aquí, pero SIN el
// opacity:.35 de esas dos porque esta tarjeta sigue siendo accionable (barra de
// progreso + "faltan X puntos"), no un ítem agotado — hallazgo de auditoría visual,
// MEDIO.
+RWDS.map(function(r){var ok=pts>=r.pts,pct=Math.min((pts/r.pts)*100,100);return'<div style="background:var(--sw-card2,#1A3028);border:1px solid '+(ok?GOLD:'var(--sw-border,#3A6B58)')+';border-radius:12px;padding:16px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:'+(ok?10:6)+'px"><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:600;color:'+(ok?'#fff':'var(--sw-text-muted,#A8C8B0)')+';letter-spacing:.04em">'+r.n+'<span style="color:'+(ok?GOLD:'var(--sw-text-muted,#A8C8B0)')+'"> // </span>'+r.s+'</div><p style="font-family:\'EB Garamond\',serif;font-size:12px;color:'+(ok?'#888':'var(--sw-text-muted,#A8C8B0)')+';margin-top:2px">'+r.d+'</p>'+(r.sizeOnly?'<p style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:#ffa500;margin-top:4px;display:flex;align-items:center;gap:4px">'+icon('warning',10,'#ffa500')+'<span>Válido solo en tamaño '+r.sizeOnly+'CM</span></p>':'')+'</div><div style="text-align:right;flex-shrink:0;margin-left:16px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:'+(ok?GOLD:'var(--sw-text-muted,#A8C8B0)')+';line-height:1">'+r.pts+'</div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:8px;color:'+GOLD+'">Pts</div></div></div>'+(!ok?'<div style="background:var(--sw-card,#2D5246);border-radius:4px;height:3px;overflow:hidden;margin-bottom:4px"><div style="background:'+GOLD+';height:100%;width:'+pct+'%;border-radius:4px"></div></div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+'">Faltan '+(r.pts-pts)+' puntos</div>':'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:#25D366">✓ Disponible en tu próximo pedido</div>')+'</div>';}).join('')+'</div>'+BTN('Hacer un pedido //','swTab(\'order\')')+'</div>'+NAV();
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
  return'<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:12px">Insignias<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+unlockedCount+'/'+badges.length+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+badges.map(function(b){
    return'<div style="background:'+(b.unlocked?'#1E4A38':'#0d1a15')+';border:1px solid '+(b.unlocked?GOLD:'#2a2a2a')+';border-radius:10px;padding:10px;text-align:center;opacity:'+(b.unlocked?1:.4)+'"><div>'+icon(b.icon,22,(b.unlocked?GOLD:'#666'))+'</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:600;color:'+(b.unlocked?'#FFFFFF':'#A8C8B0')+';margin-top:4px">'+b.label+'</div>'+(b.sub?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:8px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+b.sub+'</div>':'')+'</div>';
  }).join('')+'</div></div>';
}
function sPProfile(){
  var initial=esc((cust.name||'?').trim().charAt(0).toUpperCase());
  var heroHTML='<div style="background:linear-gradient(135deg,#2D5246,#1E3932);border:1px solid var(--sw-border,#3A6B58);border-radius:16px;padding:22px;margin-bottom:16px;display:flex;align-items:center;gap:16px"><div style="flex:0 0 auto;width:56px;height:56px;border-radius:50%;background:'+GOLD+';display:flex;align-items:center;justify-content:center;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:26px;font-weight:640;color:#12241D">'+initial+'</div><div style="flex:1;min-width:0"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:24px;font-weight:640;color:var(--sw-text,#FFFFFF);line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(cust.name)+'</div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">'+esc(cust.phone)+'</div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-top:6px">'+rankName(cust.total_orders)+' //</div></div><div style="flex:0 0 auto;text-align:center;background:rgba(0,0,0,.2);border-radius:10px;padding:8px 12px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:'+GOLD+';line-height:1">'+(cust.points||0)+'</div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em;margin-top:2px">Pts</div></div></div>';
  var referralHTML='<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:10px">Programa<span class="cut-sep" style="color:'+GOLD+'"> // </span>referidos</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:26px;font-weight:640;color:var(--sw-text,#FFFFFF);margin-bottom:4px">'+cust.phone+'</div><div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:12px">Tu código de referido · '+(cust.total_referrals||0)+' amigos referidos</div><button onclick="shareReferral()" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#0d0d0d;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.08em;padding:12px;border-radius:8px;text-align:center">Compartir por WhatsApp //</button></div>';
  // Antes las 3 tarjetas de abajo (crédito/tarjeta de regalo/Plan Semanal) no tenían
  // ningún elemento que las diferencie, pese a tener lógicas de negocio muy distintas
  // (transferir saldo YA propio, comprar saldo para OTRO gastando PUNTOS, o comprar saldo
  // para MÍ pagando con tarjeta real) — hallazgo de auditoría UX, MEDIO.
  var balanceCompareHTML='<div style="font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-muted2,#8BAF9A);margin:4px 0 12px;line-height:1.5">Con tu saldo actual → <b style="color:var(--sw-text-muted,#A8C8B0)">crédito</b>. Con tus puntos → <b style="color:var(--sw-text-muted,#A8C8B0)">tarjeta de regalo</b>. Con tarjeta hoy → <b style="color:var(--sw-text-muted,#A8C8B0)">Plan Semanal</b>.</div>';
  var creditHTML='<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:10px">Crédito<span class="cut-sep" style="color:'+GOLD+'"> // </span>SND//WCH</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:34px;font-weight:640;color:var(--sw-text,#FFFFFF);margin-bottom:4px">'+SOLES+(cust.credit_balance||0)+'</div><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px;line-height:1.5">No es dinero real: no se retira ni se transfiere a un banco. Solo sirve para pagar pedidos o regalarlo a otro cliente SND//WCH.</div><div style="display:flex;flex-direction:column;gap:8px">'+INP('cg-phone','Teléfono del amigo // 9XXXXXXXX','tel',wPhone,'phone')+INP('cg-amt','Monto a regalar // S/','number',wAmt,'coin')+'<div id="cg-msg" style="font-family:\'EB Garamond\',serif;font-size:11px;color:'+GOLD+';min-height:14px">'+wMsg+'</div>'+BTN('Regalar crédito //','doCreditGift()',true)+'</div></div>';
  // "con tu tarjeta" contradecía el mecanismo real desde que se rediseñó a puntos (sin
  // ningún cobro) — quedó con la copy vieja de antes de ese rediseño (hallazgo de
  // auditoría UX, ALTO — confirmado en vivo, la pantalla de compra en sí ya decía bien
  // "REGALAR CON PUNTOS", solo este teaser quedó desactualizado).
  var giftCardHTML='<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:10px">Tarjeta<span class="cut-sep" style="color:'+GOLD+'"> // </span>de regalo</div><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px;line-height:1.5">Usa tus puntos para regalarle crédito a otro cliente al instante — sin gastar tu saldo. Ideal para cumpleaños o para invitar a un amigo.</div>'+BTN('Comprar y regalar //',"sndScreen='gift_card';render()",true)+'</div>';
  var weeklyPlanHTML='<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:10px">Plan<span class="cut-sep" style="color:'+GOLD+'"> // </span>semanal</div><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px;line-height:1.5">Paga '+SOLES+WEEKLY_PLAN_PRICE+' hoy y recibe '+SOLES+WEEKLY_PLAN_CREDIT+' en saldo para pedir cuando quieras esta semana. Bono de '+SOLES+(WEEKLY_PLAN_CREDIT-WEEKLY_PLAN_PRICE)+' de regalo.</div>'+BTN('Activar plan semanal //',"sndScreen='weekly_plan';render()")+'</div>';
  var challengeHTML='<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:10px">Reto<span class="cut-sep" style="color:'+GOLD+'"> // </span>mensual</div><div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:12px;line-height:1.5">Haz 3 pedidos pagados este mes y gana 50 puntos extra.</div><div id="chal-msg" style="font-family:\'EB Garamond\',serif;font-size:11px;color:'+GOLD+';margin-bottom:10px;min-height:14px">'+chalMsg+'</div>'+BTN('Reclamar recompensa //','doClaimChallenge()',true)+'</div>';
  var discoveryHTML='<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:18px;margin-bottom:16px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:10px">Reto<span class="cut-sep" style="color:'+GOLD+'"> // </span>descubrimiento</div><div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:12px;line-height:1.5">Prueba 3 Signatures distintos este mes (no repitas siempre el mismo) y gana 50 puntos extra.</div><div id="disc-chal-msg" style="font-family:\'EB Garamond\',serif;font-size:11px;color:'+GOLD+';margin-bottom:10px;min-height:14px">'+discChalMsg+'</div>'+BTN('Reclamar recompensa //','doClaimDiscoveryChallenge()',true)+'</div>';
  var pushHTML='<div onclick="togglePushNotifications()" style="background:'+(pushSubscribed?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(pushSubscribed?GOLD:'#3A6B58')+';border-radius:12px;padding:18px;margin-bottom:16px;cursor:pointer;box-shadow:'+(pushSubscribed?SHADOW_GOLD:SHADOW_SM)+'"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">Notificaciones<span class="cut-sep" style="color:'+GOLD+'"> // </span>push</div><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">Avísame cuando mi pedido esté en camino o listo</div></div><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:16px;color:'+(pushSubscribed?GOLD:'#A8C8B0')+'">'+(pushSubscribed?'✓':'○')+'</span></div>'+(pushMsg?'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:'+GOLD+';margin-top:8px">'+esc(pushMsg)+'</div>':'')+'</div>';
  // Las 7 tarjetas de abajo (referidos/crédito/tarjeta de regalo/Plan Semanal/2 retos/
  // push) antes se sucedían sin ningún agrupamiento, pese a tener mecánicas muy distintas
  // (crecimiento vs. manejo de saldo vs. gamificación) — se agrupan bajo 2 eyebrows y se
  // marca la única tarjeta con cobro real (Plan Semanal) para que no se confunda con las
  // demás, que solo mueven saldo/puntos propios — hallazgo de auditoría visual, MEDIO.
  var sectionLabel=function(t){return'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:20px 0 10px">'+t+'</div>';};
  weeklyPlanHTML=weeklyPlanHTML.replace('Plan<span class="cut-sep"','<span style="float:right;font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.04em">Pago con tarjeta</span>Plan<span class="cut-sep"');
  return H('MI PERFIL','sndScreen=\'p_home\';render()')+'<div style="flex:1;padding:24px 20px 140px;overflow-y:auto" class="fi">'+heroHTML
    +badgesHTML(cust)
    +pushHTML
    +sectionLabel('Retos y referidos //')+referralHTML+challengeHTML+discoveryHTML
    +sectionLabel('Tu saldo //')+balanceCompareHTML+creditHTML+giftCardHTML+weeklyPlanHTML
    +'<div onclick="sndScreen=\'p_legal\';render()" style="cursor:pointer;text-align:center;font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em;padding:10px;margin-bottom:6px">Términos y privacidad //</div>'+'<div style="display:flex;flex-direction:column;gap:10px"><button onclick="doLogout()" style="all:unset;cursor:pointer;display:block;width:100%;border:1px solid var(--sw-border,#3A6B58);color:var(--sw-text-muted,#A8C8B0);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;letter-spacing:.1em;padding:14px;border-radius:10px;text-align:center">Cerrar sesión //</button><button onclick="doLogoutEverywhere()" style="all:unset;cursor:pointer;display:block;width:100%;border:1px solid rgba(255,85,85,.35);color:#ff8888;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.08em;padding:14px;border-radius:10px;text-align:center">Cerrar sesión en todos los dispositivos //</button><button onclick="doDeleteAccount()" style="all:unset;cursor:pointer;display:block;width:100%;color:#ff5555;font-family:\'EB Garamond\',serif;font-size:11px;letter-spacing:.05em;padding:10px;text-align:center;opacity:.7">Eliminar mi cuenta permanentemente</button></div></div>'+NAV();
}
function shareReferral(){
  // Antes solo mandaba el número como "código" — el amigo tenía que escribirlo a mano
  // en el registro. El link con ?ref= ya existe y auto-rellena ese campo (ver refCode
  // arriba); solo faltaba usarlo aquí.
  var link=location.origin+location.pathname+'?ref='+encodeURIComponent(cust.phone);
  var text='Usa mi link para crear tu cuenta en SND//WCH — tu primera bebida va por mi cuenta y yo me gano un sándwich: '+link;
  if(navigator.share){
    navigator.share({title:'SND//WCH',text:text,url:link}).catch(function(){});
  }else{
    window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
  }
}
var _creditGiftInProgress=false;
async function doCreditGift(){
  if(_creditGiftInProgress)return;
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
  if(!(await showConfirm('¿Enviar '+SOLES_TXT+amt+' de crédito a '+name+' ('+phone+')?')))return;
  // Guard de doble-tap — tarjeta de regalo y Plan Semanal ya lo tenían, esta transferencia
  // de saldo YA propio se había quedado sin él (hallazgo de auditoría de funcionamiento,
  // MEDIO): un doble-tap tras confirmar el modal regalaba el crédito dos veces.
  _creditGiftInProgress=true;
  try{
    await api('credit-gift',{token:token,toPhone:phone,amount:amt});
    var r=await api('session-check',{token:token});
    if(r.valid){cust=r.customer;cacheCust(cust,isAdmin);}
    wMsg='¡Crédito enviado a '+name+'!';wPhone='';wAmt='';
  }catch(e){wMsg=e.message;}
  _creditGiftInProgress=false;
  render();
}
// Tarjeta de regalo digital: se paga con puntos PROPIOS y acredita saldo a OTRO cliente
// — distinta de doCreditGift (que transfiere saldo ya propio, sin gastar puntos).
// Rediseño de esta sesión: antes cobraba de verdad por Culqi (dos pasos, prepare +
// widget + confirm) porque Culqi no soporta "cobrar con puntos" — el dueño pidió
// corregirlo a la intención original. Ahora es una sola llamada atómica al servidor
// (redeem_points_for_gift_credit), sin cobro, reserva, ni ventana de expiración.
function sGiftCard(){
  var amt=parseFloat(gcAmt)||0;
  var ptsCost=amt>0?Math.round(amt*GIFT_CARD_POINTS_PER_SOL):0;
  return H('TARJETA DE REGALO','sndScreen=\'p_profile\';render()')+'<div style="flex:1;padding:24px 20px 140px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:19px;font-weight:640;color:#fff;margin-bottom:4px;text-wrap:balance">Tarjeta<span class="cut-sep" style="color:'+GOLD+'"> // </span>de regalo</div>'
    +'<p style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:6px;line-height:1.5">Usa tus puntos para regalarle crédito SND//WCH a otro cliente al instante. Monto entre S/10 y S/500.</p>'
    +'<p style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:'+GOLD+';letter-spacing:.05em;margin-bottom:18px">Tienes '+(cust.points||0)+' pts // '+GIFT_CARD_POINTS_PER_SOL+' pts = S/1</p>'
    +'<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:6px">'
    +INP('gc-phone','Teléfono del destinatario // 9XXXXXXXX','tel',gcPhone,'phone')
    +INP('gc-amt','Monto // S/','number',gcAmt,'coin')
    +'</div>'
    +(ptsCost>0?'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:6px">Costará <b style="color:'+GOLD+'">'+ptsCost+' puntos</b>.</div>':'')
    +'<div id="gc-msg" style="font-family:\'EB Garamond\',serif;font-size:11px;color:'+GOLD+';min-height:14px;margin:8px 0 12px">'+esc(gcMsg)+'</div>'
    +BTN('Regalar con puntos //','doGiftCardBuy()')
    +'</div>'+NAV();
}
async function doGiftCardBuy(){
  if(_giftBuyInProgress)return;
  var phoneEl=(document.getElementById('gc-phone') as HTMLInputElement | null);
  var amtEl=(document.getElementById('gc-amt') as HTMLInputElement | null);
  var phone=phoneEl?phoneEl.value.trim():'';
  var amt=amtEl?parseFloat(amtEl.value):NaN;
  gcPhone=phone;gcAmt=amtEl?amtEl.value:'';
  if(!phone||!amt||amt<10||amt>500){gcMsg='Ingresa un teléfono y un monto entre S/10 y S/500.';render();return;}
  var ptsCost=Math.round(amt*GIFT_CARD_POINTS_PER_SOL);
  if(ptsCost>(cust.points||0)){gcMsg='No tienes puntos suficientes para este monto.';render();return;}
  var name;
  try{
    var lookup=await api('credit-lookup',{token:token,toPhone:phone});
    name=lookup.name;
  }catch(e){gcMsg=e.message;render();return;}
  if(!(await showConfirm('¿Regalar '+SOLES_TXT+amt+' de crédito a '+name+' ('+phone+') por '+ptsCost+' puntos?')))return;
  _giftBuyInProgress=true;
  busy=true;busyMsg='Procesando...';render();
  try{
    var res=await api('gift-card-purchase',{token:token,toPhone:phone,amount:amt});
    var r=await api('session-check',{token:token});
    if(r.valid){cust=r.customer;cacheCust(cust,isAdmin);}
    busy=false;_giftBuyInProgress=false;
    gcPhone='';gcAmt='';
    showToast('¡Regalaste crédito a '+(res.toName||name)+'!');
    sndScreen='p_profile';render();
  }catch(e){
    busy=false;_giftBuyInProgress=false;gcMsg=e.message;render();
  }
}
// Plan Semanal — mismo esqueleto de dos pasos que la tarjeta de regalo (prepare +
// Culqi + confirm), pero acredita al PROPIO comprador en vez de a otro cliente, y con
// monto fijo (sin inputs de teléfono/monto que llenar).
var wpMsg='',wpEmail='';
var wpCritical=false;
var _weeklyPlanBuyInProgress=false;
var _pendingWeeklyPlan=null;
function sWeeklyPlan(){
  return H('PLAN SEMANAL','sndScreen=\'p_profile\';render()')+'<div style="flex:1;padding:24px 20px 140px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:19px;font-weight:640;color:#fff;margin-bottom:4px;text-wrap:balance">Plan<span class="cut-sep" style="color:'+GOLD+'"> // </span>semanal</div>'
    +'<p style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:20px;line-height:1.5">Paga '+SOLES+WEEKLY_PLAN_PRICE+' hoy con tu tarjeta y recibe '+SOLES+WEEKLY_PLAN_CREDIT+' en saldo SND//WCH al instante — pide cuando quieras esta semana, el saldo no vence.</p>'
    +'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text-body,#F2F0EB)">Pagas hoy</span><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:var(--sw-text,#FFFFFF)">'+SOLES+WEEKLY_PLAN_PRICE+'</span></div>'
    +'<div style="background:rgba(37,211,102,.1);border:1px solid rgba(37,211,102,.3);border-radius:10px;padding:16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text-body,#F2F0EB)">Recibes en saldo</span><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:#25D366">'+SOLES+WEEKLY_PLAN_CREDIT+'</span></div>'
    +INP('wp-email','Tu correo (para el comprobante)','email',wpEmail||(cust&&cust.email)||'','mail')
    +'<div id="wp-msg" style="font-family:\'EB Garamond\',serif;font-size:11px;min-height:14px;margin:8px 0 12px'+(wpCritical?';color:#ff5555;background:rgba(255,85,85,.08);border:1px solid rgba(255,85,85,.3);border-radius:8px;padding:10px 12px':';color:'+GOLD)+'">'+esc(wpMsg)+'</div>'
    +BTN('Activar plan semanal //','doWeeklyPlanBuy()')
    +'</div>'+NAV();
}
async function doWeeklyPlanBuy(){
  if(_weeklyPlanBuyInProgress)return;
  var emailEl=(document.getElementById('wp-email') as HTMLInputElement | null);
  var email=emailEl?emailEl.value.trim():'';
  wpEmail=email;
  wpCritical=false;
  if(!email){wpMsg='Ingresa tu correo para el comprobante de pago.';render();return;}
  if(!(await showConfirm('¿Pagar '+SOLES_TXT+WEEKLY_PLAN_PRICE+' y recibir '+SOLES_TXT+WEEKLY_PLAN_CREDIT+' en saldo?')))return;
  _weeklyPlanBuyInProgress=true;
  busy=true;busyMsg='Verificando...';render();
  var prep;
  try{
    prep=await api('prepare-weekly-plan',{token:token});
  }catch(e){
    busy=false;_weeklyPlanBuyInProgress=false;wpMsg=e.message;render();return;
  }
  busy=false;render();
  _pendingWeeklyPlan={ref:prep.ref,amount:prep.amountPaid,creditAmount:prep.creditAmount,email:email};
  payWeeklyPlanWithCulqi(prep.amountPaid,email,prep.ref);
}
function payWeeklyPlanWithCulqi(amountSoles,email,ref){
  if(typeof Culqi==='undefined'){_weeklyPlanBuyInProgress=false;wpMsg='No se pudo cargar la pasarela de pago. Verifica tu conexión e intenta de nuevo.';_pendingWeeklyPlan=null;render();return;}
  if(!CULQI_PUBLIC_KEY||CULQI_PUBLIC_KEY.indexOf('REEMPLAZA')>=0){_weeklyPlanBuyInProgress=false;wpMsg='La pasarela de pago aún no está configurada. Contacta al administrador.';_pendingWeeklyPlan=null;render();return;}
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
      busy=false;_weeklyPlanBuyInProgress=false;wpMsg=data.error||'El pago fue rechazado. Intenta de nuevo o con otro método.';_pendingWeeklyPlan=null;render();
      return;
    }
    try{
      await api('confirm-weekly-plan',{token:token,chargeId:data.chargeId,ref:pw.ref});
    }catch(e){
      busy=false;_weeklyPlanBuyInProgress=false;
      wpCritical=true;
      wpMsg=(e.message||'No se pudo confirmar tu Plan Semanal.')+' Ya se realizó el cobro — contáctanos con tu referencia '+pw.ref+' para confirmar el saldo manualmente. No vuelvas a intentar pagar.';
      _pendingWeeklyPlan=null;render();
      return;
    }
    var r=await api('session-check',{token:token});
    if(r.valid){cust=r.customer;cacheCust(cust,isAdmin);}
    busy=false;_weeklyPlanBuyInProgress=false;
    wpEmail='';
    _pendingWeeklyPlan=null;
    showToast('¡Listo! Recibiste '+SOLES+pw.creditAmount+' en saldo.');
    sndScreen='p_profile';render();
  }catch(e){
    // Mismo riesgo que el catch de arriba (confirm-weekly-plan falló): no sabemos si el
    // cargo llegó a ejecutarse antes de que se cortara la conexión.
    busy=false;_weeklyPlanBuyInProgress=false;
    wpCritical=true;
    wpMsg='No pudimos confirmar si el pago se procesó (falló la conexión). Antes de reintentar, contáctanos con tu referencia '+pw.ref+' para verificar si ya se hizo el cobro.';
    _pendingWeeklyPlan=null;render();
  }
}
async function doRequestRestockNotify(sigId){
  if(restockNotified.indexOf(sigId)>=0)return;
  try{
    await api('request-restock-notify',{token:token,sigId:sigId});
    restockNotified.push(sigId);
    saveRestockNotified();
    render();
    showToast('Te avisamos apenas vuelva.','success');
  }catch(e){showToast(e.message);}
}
// Guardias de reentrada, como ya tienen doCreditGift/doGiftCardBuy/doWeeklyPlanBuy. BTN()
// no genera `disabled`, así que el botón sigue clickeable durante la llamada. El servidor
// rechaza el segundo reclamo de forma atómica (RPC claim_monthly_challenge), así que no se
// duplican puntos — pero si la respuesta de error llega DESPUÉS que la de éxito, el mensaje
// termina diciendo "Ya reclamaste el reto de este mes" encima de un reclamo que sí
// funcionó. Un mensaje que contradice lo que acaba de pasar erosiona la confianza.
var _challengeClaimInProgress=false;
var _discChallengeClaimInProgress=false;
async function doClaimChallenge(){
  if(_challengeClaimInProgress)return;
  _challengeClaimInProgress=true;
  try{
    var res=await api('claim-challenge',{token:token});
    if(res.customer){cust=res.customer;cacheCust(cust,isAdmin);}
    chalMsg='¡Reto completado! +50 pts';
  }catch(e){chalMsg=e.message;}
  _challengeClaimInProgress=false;
  render();
}
async function doClaimDiscoveryChallenge(){
  if(_discChallengeClaimInProgress)return;
  _discChallengeClaimInProgress=true;
  try{
    var res=await api('claim-discovery-challenge',{token:token});
    if(res.customer){cust=res.customer;cacheCust(cust,isAdmin);}
    discChalMsg='¡Reto completado! +50 pts';
  }catch(e){discChalMsg=e.message;}
  _discChallengeClaimInProgress=false;
  render();
}
// Limpia todo el estado en memoria específico del cliente/admin que acaba de cerrar
// sesión — antes solo se limpiaba `cust`/`token`, así que en un dispositivo compartido
// (logout de A, login de B sin recargar la página) myOrders/myAddresses/myFavorites (y
// del lado admin: custDetail/dashStats/searchResults/auditLog) seguían en memoria y se
// alcanzaban a mostrar brevemente bajo la sesión de B hasta que loadUserExtras() (u
// homólogo admin) resolvía de nuevo (hallazgo de auditoría de código).
function doLogout(){
  cust=null;isAdmin=false;savedPh='';token='';aErr='';clearGoogleLink();
  pendingGroupCode=null;
  localStorage.removeItem('sw_ph');localStorage.removeItem('sw_tok');cacheCust(null);
  myOrders=[];myAddresses=[];myFavorites=[];pickedAddrId=null;editingAddrId=null;
  custDetail=null;custDetailPhone='';custDetailErr='';
  dashStats=null;atRiskCustomers=null;
  searchResults=null;searchTruncated=false;auditLog=null;
  ratingsList=null;ratingsOnlyConsented=false;prepListData=null;timeReportData=null;problemAddressesData=null;marketingContentData=null;
  rtConsent=false;justRatedRef=null;
  promoCodesData=null;pcCode='';pcType='percent';pcValue='';pcMaxUses='';pcMinOrder='';pcValidUntil='';pcCampaignTag='';pcMsg='';campaignPerfData=null;
  calendarData=null;calDate='';calChannel='instagram';calTitle='';calCaption='';calWhatsapp='';calPhoto='';calTag='';calMsg='';waitlistData=null;
  calImageUploadingId=null;calPublishingId=null;
  adminOrders=[];bulkSelected={};focusIdx=0;
  sndScreen='p_auth';render();
}

// TÉRMINOS Y PRIVACIDAD — borrador inicial en texto simple, accesible desde el registro
// y el perfil. ⚠️ EDITA este texto con tu política real (revisada por un abogado) antes
// de operar de cara al público — esto es un punto de partida razonable, no asesoría legal.
function sPLegal(){
  var bk=(bkTo||(cust?'p_profile':'p_auth'));bkTo=null;
  return H('TÉRMINOS Y PRIVACIDAD',"sndScreen='"+bk+"';render()")+'<div style="flex:1;padding:24px 20px 40px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:#fff;margin-bottom:4px;text-wrap:balance">Términos<span class="cut-sep" style="color:'+GOLD+'"> // </span>y privacidad</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:20px">Última actualización: 2026</div>'
    +providerBlockHTML()
    +sec('QUÉ VENDEMOS //','Sándwiches preparados al momento, para delivery en '+BIZ_CITY+' — como Signature (combinaciones curadas por la casa) o armados a tu gusto (ARMA EL TUYO), además de bebidas y snacks. El menú, con descripción y precio de cada producto, está disponible dentro de la app desde el home.')
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
  return'<div style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:20px;font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.9">'
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
  return H('CAMBIOS Y DEVOLUCIONES',"sndScreen='"+bk+"';render()")+'<div style="flex:1;padding:24px 20px 40px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:#fff;margin-bottom:4px;text-wrap:balance">Cambios<span class="cut-sep" style="color:'+GOLD+'"> // </span>y devoluciones</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:20px">Última actualización: 2026</div>'
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
  var kindToggle='<div style="display:flex;background:var(--sw-card,#2D5246);border-radius:10px;padding:4px;margin-bottom:20px">'+[['reclamo','Reclamo'],['queja','Queja']].map(function(x){return'<button onclick="cmplKind=\''+x[0]+'\';render()" style="all:unset;cursor:pointer;flex:1;background:'+(cmplKind===x[0]?GOLD:'transparent')+';color:'+(cmplKind===x[0]?'#241a08':'var(--sw-text-muted,#A8C8B0)')+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.1em;padding:11px 0;border-radius:8px;text-align:center;transition:all .15s">'+x[1]+'</button>';}).join('')+'</div>';
  var kindHint='<p style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5;margin-bottom:20px">'+(cmplKind==='queja'?'Queja: malestar o disconformidad no relacionada directamente a un pedido (ej. atención, demoras).':'Reclamo: disconformidad relacionada a un producto o servicio que contrataste con nosotros.')+'</p>';
  // Checkbox nativo del navegador — único control de toda la app que rompía con el
  // lenguaje 100% custom del resto (accent-color solo tiñe el estado marcado, el
  // desmarcado seguía siendo el default del SO) (hallazgo de auditoría de diseño, MEDIO).
  // <button role="checkbox"> en vez de <div onclick>: el Libro de Reclamaciones es
  // obligatorio por ley para TODO consumidor, y con un div clickeable no era completable
  // ni con teclado ni con lector de pantalla — justo el usuario que la norma más protege.
  var minorBlock='<button type="button" role="checkbox" aria-checked="'+(cmplMinor?'true':'false')+'" onclick="cmplMinor=!cmplMinor;render()" style="all:unset;box-sizing:border-box;width:100%;display:flex;align-items:center;gap:10px;cursor:pointer;margin:6px 0 10px;min-height:44px"><div style="flex-shrink:0;width:20px;height:20px;border-radius:5px;background:'+(cmplMinor?GOLD:'transparent')+';border:1px solid '+(cmplMinor?GOLD:'#3A6B58')+';display:flex;align-items:center;justify-content:center">'+(cmplMinor?icon('check',13,'#0d0d0d'):'')+'</div><span style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">Soy menor de edad (o reclamo en representación de uno)</span></button>'
    +(cmplMinor?INP('cq-guardian','Nombre del padre, madre o apoderado','text',undefined,'clientes'):'');
  var ta=function(id,ph){return'<textarea id="'+id+'" placeholder="'+ph+'" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px;color:var(--sw-text,#FFFFFF);width:100%;font-size:14px;font-family:EB Garamond,serif;min-height:90px;box-sizing:border-box"></textarea>';};
  return H('LIBRO DE RECLAMACIONES',"sndScreen='"+bk+"';render()")+'<div style="flex:1;padding:24px 20px 40px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:#fff;margin-bottom:4px;text-wrap:balance">Libro de<span class="cut-sep" style="color:'+GOLD+'"> // </span>reclamaciones</div>'
    +'<p style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);line-height:1.6;margin-bottom:16px">Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, este establecimiento cuenta con un Libro de Reclamaciones a tu disposición.</p>'
    +providerBlockHTML()
    +kindToggle+kindHint
    +'<div style="display:flex;flex-direction:column;gap:10px">'
    +ST('01','Tus datos','')
    // Prellenado desde la cuenta si hay sesión — antes un cliente logueado con un
    // reclamo real (ya frustrado) tenía que re-escribir 5 campos que la app ya conoce, en
    // vez de solo revisarlos/corregirlos (hallazgo de auditoría UX, MEDIO). Todo sigue
    // editable, para el caso de reclamar en nombre de otra persona.
    +INP('cq-name','Nombres y apellidos','text',cust?cust.name:undefined,'clientes')
    +INP('cq-dni','DNI / Carnet de extranjería','text',cust?cust.dni:undefined,'card')
    +INP('cq-addr','Domicilio','text',cust?cust.last_address:undefined,'direccion')
    +INP('cq-phone','Teléfono','tel',cust?cust.phone:undefined,'phone')
    +INP('cq-email','Correo electrónico','email',cust?cust.email:undefined,'mail')
    +minorBlock
    +'</div>'
    +'<div style="height:1px;background:var(--sw-bg,#1E3932);margin:20px 0"></div>'
    +ST('02','El '+(cmplKind==='queja'?'malestar':'pedido'),'')
    +'<div style="display:flex;flex-direction:column;gap:10px">'
    +INP('cq-ref','Referencia del pedido // opcional (ej: SND-1234)','text')
    +INP('cq-amount','Monto reclamado // S/, opcional','number')
    +ta('cq-detail','Describe lo que pasó, con el mayor detalle posible')
    +ta('cq-request','¿Qué solicitas? (ej: reposición, reembolso, respuesta)')
    +'</div>'
    +'<div id="cq-err" style="font-family:\'EB Garamond\',serif;font-size:12px;color:#ff5555;min-height:16px;margin-top:14px">'+esc(cmplErr)+'</div>'
    +BTN(cmplBusy?'Enviando...':'Enviar '+(cmplKind==='queja'?'queja':'reclamo')+' //',cmplBusy?'':'doSubmitComplaint()')
    +'<p style="font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5;margin-top:14px">Tenemos hasta 15 días hábiles para responder tu reclamo o queja, conforme a la normativa vigente.</p>'
    +'</div>';
}
function sComplaintsSuccess(bk){
  return H('LIBRO DE RECLAMACIONES',"sndScreen='"+bk+"';render()")+'<div style="flex:1;padding:24px 20px 40px;overflow-y:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center" class="fi">'
    // Antes un carácter Unicode "✓" suelto a font-size:44px — sin relación con el
    // tratamiento de éxito ya establecido en la app (círculo con ícono propio, ver
    // pantalla de confirmación de pedido) — hallazgo de auditoría visual, MEDIO.
    +'<div style="margin-bottom:16px;width:64px;height:64px;border-radius:50%;background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.3);display:flex;align-items:center;justify-content:center">'+icon('check',28,'#25D366')+'</div>'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:#fff;margin-bottom:8px">'+(cmplKind==='queja'?'Queja':'Reclamo')+' registrad'+(cmplKind==='queja'?'a':'o')+'</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:6px">Tu código //</div>'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:32px;font-weight:640;color:'+GOLD+';margin-bottom:20px">'+esc(cmplCode||'')+'</div>'
    +'<p style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-muted,#A8C8B0);line-height:1.6;max-width:320px">Te enviamos una copia a tu correo. Responderemos dentro de los 15 días hábiles siguientes, conforme a ley.</p>'
    +'<div style="margin-top:24px;width:100%;max-width:280px">'+BTN('Volver al inicio //','sndScreen=\'o_home\';cmplStep=\'form\';render()')+'</div>'
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
