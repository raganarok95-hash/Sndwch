// POINTS HOME
function sWelcome(){
  var pts=cust?cust.points||0:0;
  var nm=cust?cust.name.split(' ')[0]:'';
  var rwd=RWDS.slice().reverse().find(function(r){return pts>=r.pts;});
  var next=RWDS.find(function(r){return r.pts>pts;});
  return'<div onclick="sndScreen=\'p_home\';render()" style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;background:var(--sw-bg,#17130E);padding:48px 24px;position:relative;overflow:hidden">'
    +'<div style="position:absolute;top:-80px;right:-80px;width:300px;height:300px;border-radius:50%;background:rgba(203,162,88,.06)"></div>'
    +'<div style="position:absolute;bottom:-60px;left:-60px;width:220px;height:220px;border-radius:50%;background:rgba(203,162,88,.04)"></div>'
    +'<div style="text-align:center;position:relative;z-index:1;width:100%">'
    +'<div style="margin-bottom:28px">'+WORDMARK(24,true)+'</div>'
    // sndScreen='p_welcome' solo se dispara al final de doReg() — doLogin() va directo a p_home
    // sin pasar por aquí — así que esta pantalla SIEMPRE es un registro nuevo, nunca un
    // login de alguien que vuelve. "de vuelta" era simplemente incorrecto en todos los casos.
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:'+GOLD+';letter-spacing:.28em;margin-bottom:10px">Bienvenido //</div>'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:40px;font-weight:640;color:var(--sw-text-body,#EFEDE4);line-height:1.15;margin-bottom:4px;text-wrap:balance;word-break:break-word">'+esc(nm.toUpperCase())+'</div>'
    +'<div style="width:60px;height:3px;background:'+GOLD+';margin:18px auto 28px;border-radius:4px"></div>'
    +'<div style="background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.25);border-radius:20px;padding:20px;margin-bottom:16px">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">Tus puntos //</div>'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:72px;font-weight:640;color:'+GOLD+';line-height:1">'+pts+'</div>'
    // Traducción a soles: "1,240 puntos" no le dice a nadie cuánto tiene. La evidencia de
    // programas de fidelidad dice que el problema del esquema 1:1 no es la tasa sino que
    // el premio se SIENTE lejos — mostrar el equivalente en dinero (mismo criterio que la
    // tarjeta de regalo, 40 pts = S/1) lo vuelve concreto de inmediato.
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#9DA096);margin-top:4px">Puntos acumulados · equivalen a '+SOLES_TXT+pz(pts/GIFT_CARD_POINTS_PER_SOL)+'</div>'
    +(rwd?'<div style="margin-top:12px;background:rgba(203,162,88,.15);border-radius:8px;padding:8px 12px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:'+GOLD+'">✓ Puedes canjear: '+(rwd.n+' '+rwd.s).toUpperCase()+'</div></div>':'')
    +(next?'<div style="margin-top:8px"><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#9DA096)">Te faltan <span style="color:var(--sw-text-body,#EFEDE4);font-weight:700">'+(next.pts-pts)+' pts</span> ('+SOLES_TXT+pz((next.pts-pts)/GIFT_CARD_POINTS_PER_SOL)+' de consumo) para '+next.n+' // '+next.s+'</div></div>':'')
    +'</div>'
    +'<div style="display:flex;gap:10px;justify-content:center">'
    +'<div style="background:rgba(242,240,235,.08);border:1px solid rgba(242,240,235,.12);border-radius:12px;padding:12px 16px;text-align:center">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:var(--sw-text-body,#EFEDE4)">'+(cust?cust.total_orders||0:0)+'</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:8px;color:var(--sw-text-muted,#9DA096);margin-top:2px">Pedidos</div></div>'
    +'<div style="background:rgba(242,240,235,.08);border:1px solid rgba(242,240,235,.12);border-radius:12px;padding:12px 16px;text-align:center">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:var(--sw-text-body,#EFEDE4)">'+(cust?cust.total_redeemed||0:0)+'</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:8px;color:var(--sw-text-muted,#9DA096);margin-top:2px">Canjeados</div></div>'
    +'</div>'
    // Antes esta pantalla solo mostraba el saldo de bienvenida sin explicar cómo
    // funciona el programa — un cliente nuevo no tenía forma de saber que hay recompensas,
    // referidos o un reto mensual hasta toparse con esas pantallas por su cuenta.
    +'<div style="margin-top:20px;text-align:left;background:rgba(242,240,235,.05);border-radius:12px;padding:16px 18px">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:10px">Cómo funciona //</div>'
    +[['cart','Gana puntos con cada pedido pagado.'],['gift','Canjéalos por salsas, upgrades y sándwiches gratis.'],['heart','Invita a un amigo y gánate un sándwich 15CM gratis.']].map(function(x){return'<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px">'+icon(x[0],15,GOLD)+'<span style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-muted,#9DA096);line-height:1.4">'+x[1]+'</span></div>';}).join('')
    +'</div>'
    +'<div style="margin-top:20px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#9DA096)">toca para continuar //</div>'
    +'</div></div>';
}
// ── TU CUENTA (maqueta aprobada `tu-cuenta.png`, «Pantalla de tu cuenta, se aprueba») ────────
// La ficha del cliente arriba (pedidos, puntos, crédito: cada cifra lleva a lo suyo) y la lista
// de lo que se configura. Reemplaza el perfil viejo con la barra de abajo. Lo que no tiene dato
// (la fecha de alta, si el servidor no la manda) no se inventa: la línea no se pinta.
function sPHome(){
  var c:any=cust||{};
  var desde='';
  if(c.created_at){var d=new Date(c.created_at);if(!isNaN(d.getTime()))desde='Cliente desde '+['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][d.getMonth()]+' '+d.getFullYear();}
  var nDir=myAddresses.length;
  var fila=function(t:string,s:string,accion:string){
    return'<button class="r" onclick="'+accion+'"><span><b>'+t+'</b><s>'+s+'</s></span><span class="fl" aria-hidden="true">→</span></button>';
  };
  return'<div class="mct mcu fi"><button class="sal" onclick="volverALaPuerta()" aria-label="Volver">←</button>'
    +'<span class="marca-der" aria-hidden="true"><img src="img/logo-avatar-96.png" alt="">SND<span class="wm-mark"><i></i><i></i></span>WCH</span>'
    +'<div class="ficha">'
    +(desde?'<div class="hd"><em>'+esc(desde)+'</em></div>':'')
    +'<h1>'+esc(c.name||'')+'</h1>'
    +'<div class="cifras">'
    +'<button onclick="loadMyOrders()"><em>Pedidos</em><b>'+(c.total_orders||0)+'</b></button>'
    +'<button onclick="sndScreen=\'p_rewards\';render()"><em>Puntos</em><b>'+(c.points||0)+'</b></button>'
    +'<div><em>Crédito</em><b>'+SOLES_TXT+pz(c.credit_balance||0)+'</b></div>'
    +'</div></div>'
    +'<div class="lis">'
    // El rediseño de la cuenta perdió la única entrada al panel (dueño, 2026-10-01: «no tengo
    // como entrar a admin»). Va primero: para quien administra es lo que más se usa.
    +(isAdmin?fila('Panel de admin','Pedidos, cocina, carta y números',"loadAdmin()"):'')
    +fila('Tus direcciones',nDir?(nDir===1?'Una guardada':nDir+' guardadas'):'Ninguna guardada todavía',"loadAddresses()")
    +fila('Tus datos','Nombre, teléfono, DNI',"sndScreen='p_datos';render()")
    +fila('Cómo pagas',metodoPreferido()==='culqi'?'Tarjeta por defecto':'Yape por defecto',"sndScreen='p_pago';render()")
    +fila('Avisos','Cuando sale y cuando llega',"sndScreen='p_avisos';render()")
    +fila('Lo legal','Términos, privacidad, cambios y el Libro de Reclamaciones',"sndScreen='p_lo_legal';render()")
    +'</div>'
    +'<button class="salir" onclick="doLogout()"><b>Cerrar sesión</b><s>En este aparato</s></button>'
    +'<button class="salir borrar" onclick="doDeleteAccount()"><b>Borrar mi cuenta</b><s>No se puede deshacer</s></button>'
    +'</div>';
}
// TUS DATOS: lo que la cuenta guarda de ti. No hay edición en el servidor todavía: se muestra y
// se dice cómo cambiarlo, en vez de un formulario que no guardaría nada.
function sPDatos(){
  var c:any=cust||{};
  var dato=function(t:string,v:string){return'<div class="r dato"><span><s>'+t+'</s><b>'+esc(v||'—')+'</b></span></div>';};
  return'<div class="mct mcu fi"><button class="sal" onclick="sndScreen=\'p_home\';render()" aria-label="Volver">←</button>'
    +'<div class="cab"><em>Tu cuenta</em><h1>TUS<br>DATOS</h1><p>Para cambiar alguno, escríbenos por el chat de la esquina.</p></div>'
    +'<div class="lis">'+dato('Nombre',c.name)+dato('Teléfono',c.phone)+dato('Correo',c.email)+dato('DNI',c.dni)+'</div>'
    +'</div>';
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

// ── TUS PEDIDOS · LOS SELLOS (maqueta aprobada `tus-pedidos-los-sellos.png`, «Tus pedidos me
// suena bien», con «Pedir lo mismo» arriba). El último pedido a lo ancho con su foto y el botón
// para repetirlo; debajo, un sello por pedido. Toda cifra sale de los pedidos: cuántas veces,
// la fecha de cada sello y el día que más se repite (solo si de verdad se repite).
var MESES_CORTOS=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
var DIAS_LARGOS=['domingos','lunes','martes','miércoles','jueves','viernes','sábados'];
// En la hora de Lima (UTC−5, sin horario de verano), no en la del aparato: un pedido de las 7
// de la noche de un jueves sería viernes para un navegador en UTC. Se leen con getUTC*.
function fechaDelPedido(o:any):Date|null{
  var d=new Date(o.created_at||o.date||'');
  return isNaN(d.getTime())?null:new Date(d.getTime()-5*3600000);
}
function cuandoFue(d:Date):string{
  var hoy=new Date(Date.now()-5*3600000);
  var dias=Math.floor(Date.UTC(hoy.getUTCFullYear(),hoy.getUTCMonth(),hoy.getUTCDate())/86400000)-Math.floor(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())/86400000);
  if(dias<=0)return'hoy';if(dias===1)return'ayer';
  if(dias<7)return'hace '+dias+' días';
  return d.getUTCDate()+' '+MESES_CORTOS[d.getUTCMonth()];
}
function precioDeRepetir(o:any):number{
  var its=(o.items||[]).filter(cartItemRepeatable);
  return money(its.reduce(function(a:number,it:any){return a+itemUnitPrice(it)*(it.qty||1);},0));
}
function sPOrders(){
  var bk="sndScreen=cust?'p_home':'o_home';render()";
  if(listLoading)return'<div class="msl fi"><button class="sal" onclick="'+bk+'" aria-label="Volver">←</button><div class="cargando">Buscando tus pedidos…</div></div>';
  if(!myOrders.length)return'<div class="msl vacio fi"><button class="sal" onclick="'+bk+'" aria-label="Volver">←</button>'
    +VACIO('Todavía ningún pedido','Cuando hagas el primero, aparece acá con su sello.','<button class="ir" onclick="volverALaPuerta()">Pedir ahora</button>')+'</div>';
  var ult=myOrders[0];
  var fu=fechaDelPedido(ult);
  var itsUlt=ult.items||[];
  var primero=itsUlt.find(function(it:any){return it.type==='sig';});
  var foto=primero?fotoDelPlato(primero.sigId):'';
  var repetible=itsUlt.some(cartItemRepeatable);
  var terminado=pedidoTerminado(ult.status);
  var estado=terminado?(ult.status==='CANCELADO'?'Cancelado':'Llegó'+(ult.delivered_at?' '+horaLima(new Date(ult.delivered_at).getTime()):''))
    :(STATUSES[ult.status]?STATUSES[ult.status].label:ult.status);
  var comidos=myOrders.filter(function(o:any){return o.status!=='CANCELADO';});
  // El día que más se repite: se dice solo si pasa de la mitad y hay al menos 3.
  var porDia=[0,0,0,0,0,0,0];
  comidos.forEach(function(o:any){var d=fechaDelPedido(o);if(d)porDia[d.getUTCDay()]++;});
  var max=Math.max.apply(null,porDia),diaTop=porDia.indexOf(max);
  var dato=max>=3&&max*2>comidos.length?'Los '+DIAS_LARGOS[diaTop]+' son '+max+' de los '+comidos.length+' — por algo será.':'';
  var sellos=myOrders.map(function(o:any,k:number){
    var d=fechaDelPedido(o);
    return'<button class="sello'+(k===0?' on':'')+(o.status==='CANCELADO'?' x':'')+'" onclick="_sndOd=\''+o.id+'\';rtStars=0;rtMsg=\'\';sndScreen=\'p_ord_detail\';render()" aria-label="Pedido '+esc(o.ref||'')+'">'
      +'<em>'+(d?MESES_CORTOS[d.getUTCMonth()]:'—')+'</em><b>'+(d?String(d.getUTCDate()).padStart(2,'0'):'')+'</b></button>';
  }).join('');
  return'<div class="msl fi">'
    +'<div class="ultimo">'+(foto?'<img src="'+foto+'" alt="">':'')+'<div class="velo"></div>'
    +'<button class="sal" onclick="'+bk+'" aria-label="Volver">←</button>'
    +'<button class="tx" onclick="_sndOd=\''+ult.id+'\';rtStars=0;rtMsg=\'\';sndScreen=\'p_ord_detail\';render()">'
    +'<em>El último'+(fu?' · '+cuandoFue(fu):'')+'</em><b>'+esc(ult.summary||'Tu pedido')+'</b>'
    +'<s>'+esc(estado)+' · '+SOLES_TXT+pz(ult.total||0)+'</s></button></div>'
    +(repetible
      ?'<button class="repetir" onclick="loadCart(myOrders[0].items)"><span>Pedir lo mismo</span><b>'+SOLES_TXT+pz(precioDeRepetir(ult))+'</b></button>'
      :'')
    +'<div class="cuerpo"><div class="veces"><em>Has comido acá</em><b>'+comidos.length+(comidos.length===1?' vez':' veces')+'</b></div>'
    +'<div class="sellos">'+sellos+'</div>'
    +'<p class="pie">Toca un sello y se abre ese pedido.'+(dato?'<br>'+esc(dato):'')+'</p></div>'
    +'</div>';
}
var _sndOd=null;
// ── DETALLE DE UN PEDIDO (maqueta aprobada `detalle-de-un-pedido.png`, «me agradan, aprobadas»).
// El recibo kraft: arriba lo que pasó con la hora («Llegó a las 7:52 p.m.»), la caja de lo
// pedido / prometido / llegado, cada línea con su precio y abajo lo que se puede hacer.
// ⚠ LA CUENTA TIENE QUE PODER SEGUIRSE: cada línea usa el `precio` que el servidor guardó ESE
// día (catalog.ts, deriveCart). Un pedido anterior a eso no lo trae y entonces no se muestran
// precios por línea: recalcular con la carta de hoy sería un número que el cliente no pagó.
// Los descuentos (combo, recompensa, código) salen de la resta, no de otra cuenta.
var MEDIO_DE_PAGO:any={yape:'Yape',plin:'Plin',card:'tarjeta',transfer:'transferencia',credit:'crédito'};
function titularDelPedido(o:any):string{
  if(o.status==='CANCELADO')return'Se canceló';
  if(o.status==='ENTREGADO')return o.delivered_at?'Llegó a las '+horaLima(Date.parse(o.delivered_at)):'Llegó';
  return(STATUSES[o.status]?STATUSES[o.status].label:String(o.status||''));
}
// En un recibo todo monto lleva sus dos decimales («5.00», no «5»), como en la maqueta.
function montoFmt(n:number):string{return money(n).toFixed(2);}
function sOrdDetail(){
  var o=myOrders.find(function(x){return mismoId(x.id,_sndOd);});
  if(!o)return sPOrders();
  var fu=fechaDelPedido(o);
  var envio=Number(o.delivery_fee),hayEnvio=Number.isFinite(envio)&&envio>0;
  var km=Number(o.delivery_km);
  var pagado=Number(o.total)||0;
  var consumo=hayEnvio?money(pagado-envio):pagado;
  var its=o.items||[];
  var conPrecio=its.length>0&&its.every(function(it:any){return Number.isFinite(Number(it.precio));});
  var lista=0;
  var lineas=its.map(function(it:any,k:number){
    var q=it.qty||1,monto=conPrecio?money(Number(it.precio)*q):0;
    lista+=monto;
    var extra=itemExtrasLabel(it);
    return'<div class="ln"><i>'+String(k+1).padStart(2,'0')+'</i><div class="q"><b>'+esc(lineaNombre(it))+'</b>'+(extra?'<s>'+esc(extra)+'</s>':'')+'</div>'
      +(conPrecio?'<span>'+montoFmt(monto)+'</span>':'')+'</div>';
  }).join('');
  var desc=conPrecio?money(lista-consumo):0;
  var medio=MEDIO_DE_PAGO[o.payment_method]||'';
  // El momento tenso del pedido, con un hermano: en camino (cuándo llega) o cancelado.
  var momento=o.status==='EN CAMINO'
    ?HERMANO_DICE('alegre','Va en camino',ventanaDelPedido(o)?'Llega '+String(ventanaDelPedido(o)).replace(/\.?$/,'.'):'Ya salió de la cocina.')
    :o.status==='CANCELADO'
      ?HERMANO_DICE('serio','Este pedido se canceló','Si ya habías pagado, te lo devolvemos: lo ves en tu cuenta o te escribimos.','alerta')
      :'';
  var caja=''
    +(fu?'<div class="c"><em>Lo pediste</em><b>'+esc(horaLima(Date.parse(o.created_at)))+'</b></div>':'')
    +(ventanaDelPedido(o)?'<div class="c"><em>Prometimos</em><b>'+esc(ventanaDelPedido(o))+'</b></div>':'')
    +(o.delivered_at?'<div class="c"><em>Llegó</em><b class="'+(llegoDentro(o)===true?'ok':llegoDentro(o)===false?'tarde':'')+'">'+esc(horaLima(Date.parse(o.delivered_at)))+(llegoDentro(o)===true?' · dentro':llegoDentro(o)===false?' · tarde':'')+'</b></div>':'');
  var repetible=its.some(cartItemRepeatable);
  var acc=''
    +(repetible&&o.status!=='CANCELADO'?'<button class="ac" onclick="loadCart(myOrders.find(function(x){return mismoId(x.id,_sndOd);}).items)"><span>Pedir lo mismo</span><s>'+SOLES_TXT+pz(precioDeRepetir(o))+' hoy</s></button>':'')
    +(o.status==='RECIBIDO'?'<button class="ac" onclick="doCancelMyOrder(\''+esc(String(o.id))+'\',\''+esc(String(o.ref))+'\')"><span>Cancelar pedido</span><s>antes de que la cocina empiece</s></button>':'')
    +(puedeReportarPedido(o)&&cust?'<button class="ac" onclick="abrirAlgoSalioMal(\''+esc(String(o.ref))+'\')"><span>Algo salió mal</span><s>hasta '+REPORTE_PLAZO_HORAS+' h después</s></button>':'')
    +'<button class="ac" onclick="window.print()"><span>Guardar el recibo</span><s>PDF · no es boleta</s></button>';
  return'<div class="mct mod fi">'
    +'<button class="sal" onclick="sndScreen=\'p_orders\';render()" aria-label="Volver">←</button>'
    +'<span class="marca-der" aria-hidden="true"><img src="img/logo-avatar-96.png" alt="">SND<span class="wm-mark"><i></i><i></i></span>WCH</span>'
    +'<div class="cab"><em>Pedido '+esc(String(o.ref||''))+(fu?' · '+fu.getUTCDate()+' '+MESES_CORTOS[fu.getUTCMonth()]:'')+'</em><h1>'+esc(titularDelPedido(o))+'</h1></div>'
    +momento
    +(caja?'<div class="caja">'+caja+'</div>':'')
    +'<div class="lns">'+lineas+'</div>'
    +(desc>0.004?'<div class="x"><span>'+(o.redeemed_reward?'Recompensa y combo':'Combo y descuentos')+'</span><span>−'+montoFmt(desc)+'</span></div>':'')
    +(hayEnvio?'<div class="x"><span>Envío'+(Number.isFinite(km)&&km>0?' '+km+' km':'')+(medio?' · pagado con '+medio:'')+'</span><span>'+montoFmt(envio)+'</span></div>'
      :(medio?'<div class="x"><span>Pagado con '+medio+'</span><span></span></div>':''))
    +'<div class="tot"><em>'+(o.status==='CANCELADO'?'Ibas a pagar':'Pagaste')+'</em><b>'+SOLES_TXT+montoFmt(pagado)+'</b></div>'
    +(o.customer_address?'<p class="dir">'+esc(String(o.customer_address))+'</p>':'')
    +'<div class="acs">'+acc+'</div>'
    +'<div class="calif">'+ratingHTML(o)+'</div>'
    +'</div>';
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
// #20 — A los RATING_WINDOW_DAYS días se deja de pedir la calificación.
//
// Sin esto la tarjeta de estrellas se arrastra para siempre en el historial: el cliente ya
// no se acuerda de ese sándwich y la tarjeta se vuelve parte del ruido de la pantalla, lo
// que además le quita fuerza a la del pedido reciente, que es la única que se va a
// responder.
//
// El SERVIDOR sigue aceptando la calificación pasada la ventana, a propósito: si alguien
// vuelve al historial y quiere calificar un pedido viejo, esa reseña es igual de válida y
// rechazarla sería tirar información real. Lo que se cierra es el PEDIDO de calificación,
// no la posibilidad — por eso este número vive solo acá y no necesita comprobación de
// paridad con el backend.
var RATING_WINDOW_DAYS=14;
function ratingWindowOpen(o){
  var t=new Date(o.delivered_at||o.updated_at||o.created_at).getTime();
  if(!t||isNaN(t))return true; // sin fecha utilizable, mejor seguir preguntando que callar
  return (Date.now()-t)<=RATING_WINDOW_DAYS*86400000;
}
// ── LA INVITACIÓN A REFERIR YA NO CUELGA DE QUE EL CLIENTE CALIFIQUE (2026-09-06) ─────
//
// POR QUÉ. `PREDICCION_V12.md` mide que la viralidad es la ÚNICA palanca que convierte
// "la meta no se alcanza nunca" en "se sostiene desde feb-27": un referido cuesta S/7.65
// contra ~S/17.87 de comprar el mismo cliente en Meta. El modelo asume 6 referidos por cada
// 100 pedidos y hace falta llegar a 25.
//
// Y la invitación estaba DOBLEMENTE condicionada: aparecía solo si el cliente calificaba, y
// solo en el render inmediato después de hacerlo (`justRatedRef`). Calificar es opcional, así
// que el momento de mayor intención —acaba de recibir su comida— quedaba sin usar para todo
// el que no calificara. Y las dos pantallas donde no aparecía no mostraban nada en su lugar:
// eran espacio muerto.
//
// Esto NO le quita sitio al pedido de calificación, que sigue intacto y primero: la tarjeta
// solo ocupa los dos estados que hoy están vacíos —ya calificó, o la ventana se cerró sin
// calificar—. El modo de fallo es SILENCIO: si alguien la vuelve a condicionar, nada revienta
// y el negocio simplemente deja de pedir el referido en el único momento en que conviene.
function refInviteHTML(compacta: boolean){
  // El código de referido ES el teléfono del cliente, así que un invitado no tiene ninguno.
  if(!cust)return'';
  return'<div style="margin-top:12px;background:var(--sw-card2,#171A14);border:1px solid '+GOLD+';border-radius:12px;padding:'+(compacta?'14px':'18px')+';text-align:center">'
    +(compacta?'':'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-ok,#25D366);margin-bottom:10px">&#10003; ¡Gracias por calificar!</div>')
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:6px">¿Compartes SND//WCH en tu Instagram, TikTok o WhatsApp?</div>'
    // Los DOS bonos se interpolan de las constantes, nunca escritos a mano: es la regla que
    // ya costó tres promesas rotas a la vez en los textos de marketing. `npm run parity`
    // verifica además que REFERRER_REWARD_POINTS valga exactamente lo mismo que R06, que es
    // lo que hace cierta la frase "un sándwich 15CM gratis".
    +'<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#9DA096);margin-bottom:12px;line-height:1.5">Con tu link te ganas '+loQueGanaQuienInvita()+' cuando tu invitado haga su primer pedido, y él arranca con '+loQueGanaElInvitado()+'.</div>'
    +BTN('Compartir //','shareReferral()')+'</div>';
}
function ratingHTML(o){
  if(o.status!=='ENTREGADO')return'';
  // La ventana se comprueba DESPUÉS de "ya calificó": quien sí calificó tiene que seguir
  // viendo su agradecimiento y su código de referido aunque hayan pasado dos semanas.
  // Ventana de calificación cerrada sin calificar. Antes esto devolvía '' y la pantalla
  // quedaba vacía; ahora al menos pide el referido, que es lo que el modelo necesita.
  if(ratedRefs().indexOf(o.ref)<0&&!ratingWindowOpen(o))return refInviteHTML(true);
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
      return refInviteHTML(false);
    }
    // Ya calificó, en una visita posterior. Antes esto era solo el "gracias" y nada más:
    // espacio muerto en la pantalla que el cliente más contento vuelve a abrir.
    return'<div style="margin-top:12px;background:var(--sw-card,#1B1F18);border:1px solid var(--sw-border,#2C3228);border-radius:12px;padding:16px;text-align:center"><div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-ok,#25D366)">&#10003; Ya calificaste este pedido &mdash; ¡gracias!</div></div>'+refInviteHTML(true);
  }
  // El consentimiento de testimonio NUNCA viene marcado por defecto — el cliente tiene
  // que elegirlo activamente cada vez (hallazgo del checklist de pre-lanzamiento: la
  // web/redes van a necesitar reseñas reales para publicar, pero nunca sin permiso
  // explícito de a quién pertenecen).
  // ⚠ LA INVITACIÓN VA TAMBIÉN ACÁ, DEBAJO DEL FORMULARIO DE CALIFICACIÓN (2026-09-06).
  //
  // Sin esto el cambio no servía de nada donde importa: la ventana de calificación está
  // ABIERTA justo en el momento de mayor intención —el pedido acaba de llegar— así que un
  // cliente que no califica pasaba por esa pantalla sin que se le pidiera el referido, que es
  // exactamente el caso que este cambio venía a resolver. Llenar solo los estados tardíos
  // (ya calificó, o la ventana se cerró) es llenar los momentos en que ya no está contento.
  //
  // Va DEBAJO y no arriba: el pedido de calificación sigue siendo lo primero y no se toca.
  // La calificación tiene valor propio —testimonios, y enterarse de un problema— y cambiarla
  // de sitio por el referido sería canjear una cosa por la otra en vez de sumar.
  return'<div style="margin-top:12px;background:var(--sw-card,#1B1F18);border:1px solid var(--sw-border,#2C3228);border-radius:12px;padding:18px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:10px">¿Cómo estuvo tu pedido? //</div><div style="display:flex;gap:8px;margin-bottom:12px;justify-content:center">'+[1,2,3,4,5].map(function(n){var on=n<=rtStars;return'<span onclick="rtStars='+n+';render()" style="cursor:pointer;font-size:28px;color:'+(on?'#F5C518':'var(--sw-border,#25382D)')+'">&#9733;</span>';}).join('')+'</div><textarea id="rt-comment" placeholder="Comentario opcional" style="background:var(--sw-card2,#122019);border:1px solid var(--sw-border,#25382D);border-radius:8px;padding:10px 12px;color:var(--sw-text,#FFFFFF);width:100%;font-size:13px;font-family:EB Garamond,serif;min-height:60px;margin-bottom:10px;box-sizing:border-box"></textarea><label style="display:flex;align-items:flex-start;gap:8px;font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#9DA096);margin-bottom:10px;cursor:pointer"><input type="checkbox" id="rt-consent" onchange="rtConsent=this.checked" '+(rtConsent?'checked':'')+' style="accent-color:'+GOLD+';margin-top:2px;flex-shrink:0">Autorizo que SND//WCH use esta reseña como testimonio público (redes sociales, web) — opcional.</label><div id="rt-msg" style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-danger-strong,#ff5555);min-height:14px;margin-bottom:8px">'+rtMsg+'</div>'+BTN('Enviar calificación //','doSubmitRating(\''+o.ref+'\')')+'</div>'+refInviteHTML(true);
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
  // El historial de puntos, en el mundo de la 29: un renglón por movimiento, sin la barra vieja.
  var txns=(cust&&cust._txns)||[];
  var h='<div class="mw mpt mph fi"><button class="sal" onclick="sndScreen=\'p_rewards\';render()" aria-label="Volver">←</button>'
    +'<div class="dice"><em>Tus puntos</em><h1>De dónde salió cada uno</h1></div>';
  if(listLoading)h+='<p class="cargando">Buscando tus movimientos…</p>';
  else if(!txns.length)h+=VACIO('Sin movimientos','Cada pedido suma puntos. Aquí verás de dónde salió cada uno y en qué se fue.',null,'piensa');
  else h+='<div class="otras movs">'+txns.map(function(t:any){
    var pos=(t.points||0)>=0;
    return'<div class="g'+(pos?'':' neg')+'"><span class="n">'+esc(t.description||t.type)+(t.date?'<s>'+esc(t.date)+'</s>':'')+'</span><span class="d">'+(pos?'+':'')+t.points+'</span></div>';
  }).join('')+'</div>';
  return h+'</div>';
}

// 29 · WICHO ES EL ESTADO (docs/maquetas/aprobadas/29-tus-puntos.png). No hay barra: lo que
// falta se cuenta en PEDIDOS, que es como lo piensa el cliente, no en puntos.
// Un pedido vale lo que el cliente suele gastar en comida (1 punto por sol, el envío no
// cuenta); sin pedidos cargados, lo que cuesta el 15CM del Signature estrella. Es una
// estimación y se dice como tal: «unos N pedidos».
function puntosPorPedido(){
  var com=(myOrders||[]).filter(function(o:any){return o.status!=='CANCELADO'&&o.total>0;});
  if(com.length){
    var s=com.reduce(function(a:number,o:any){return a+Math.max(0,(o.total||0)-(o.delivery_fee||0));},0);
    var p=Math.round(s/com.length);
    if(p>0)return p;
  }
  var est=SIGS.filter(function(s:any){return s.estrella;})[0]||SIGS[0];
  return Math.max(1,Math.round((est&&est.p15)||20));
}
function metaEnPalabras(r:any){
  var t:any={sandwich:'Un sándwich gratis',subir30:'Tu 30CM gratis',bebida:'Una bebida gratis',doble:'Doble proteína gratis',salsa:'Una salsa extra gratis'};
  return t[r.tipo]||(r.n+' '+r.s);
}
function pedidosQueFaltan(r:any,pts:number){return Math.max(0,Math.ceil((r.pts-pts)/puntosPorPedido()));}
function fotoDeLaMeta(){
  var ult=(myOrders||[])[0];
  var sig=ult&&(ult.items||[]).find(function(it:any){return it.type==='sig';});
  var id=sig?sig.sigId:((SIGS.filter(function(s:any){return s.estrella;})[0]||SIGS[0]||{}).id);
  return id?(SIG_IMG[id]||''):'';
}
function sPRewards(){
  var pts=(cust&&cust.points)||0;
  var orden=RWDS.slice().sort(function(a,b){return a.pts-b.pts;});
  // La meta es la recompensa más grande que todavía no alcanza; si ya alcanza todas, la más grande.
  var faltan=orden.filter(function(r){return pts<r.pts;});
  var meta=faltan.length?faltan[faltan.length-1]:orden[orden.length-1];
  var ya=meta&&pts>=meta.pts;
  var n=meta?pedidosQueFaltan(meta,pts):0;
  // Las marcas son el TRAMO FINAL: los pedidos que faltan y, antes, los últimos ya hechos,
  // hasta 8 en total. Si faltan más de 7, no se dibujan: la frase basta.
  var hechosTot=Math.floor(pts/puntosPorPedido());
  var hechos=(meta&&!ya&&n<=7)?Math.min(hechosTot,8-n):0;
  var total=(meta&&!ya&&n<=7)?n+hechos:0;
  var frase=ya?'“Ya es tuyo. Pídelo cuando quieras.”'
    :(n<=1?'“Un pedido más y te lo doy yo mismo.”':'“Unos '+(n<=10?['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez'][n]:String(n))+' pedidos más y te lo doy yo mismo.”');
  var marcas='';
  for(var i=0;i<total;i++)marcas+=i<hechos?'<i class="ok" aria-hidden="true">✓</i>':'<i aria-hidden="true">'+(i+1)+'</i>';
  var otras=orden.filter(function(r){return r!==meta;}).map(function(r){
    var ok=pts>=r.pts,k=pedidosQueFaltan(r,pts);
    return'<div class="g'+(ok?' ya':'')+'"><span class="n">'+esc(metaEnPalabras(r))+'</span><span class="d">'+(ok?'YA LA TIENES':(k===1?'1 pedido':'~'+k+' pedidos'))+'</span></div>';
  }).join('');
  var alcanza=orden.some(function(r){return pts>=r.pts;});
  var foto=fotoDeLaMeta();
  return'<div class="mw mpt fi">'
    +'<button class="sal" onclick="sndScreen=\'p_home\';render()" aria-label="Volver">←</button>'
    +'<img class="wicho" src="'+broPose('wicho','saluda')+'" alt="">'
    +'<div class="dice"><em>'+(ya?'Ya tienes':'Vas por')+'</em><h1>'+esc(meta?metaEnPalabras(meta):'Tu primer premio')+'</h1>'
    +'<p class="pts">'+pts+' puntos'+(meta&&!ya?' · te faltan '+(meta.pts-pts):'')+'</p></div>'
    +'<div class="medio">'+(foto?'<div class="premio"><img src="'+foto+'" alt=""></div>':'')+'<div class="frase">'+frase+'</div></div>'
    +(total?'<div class="marcas" role="img" aria-label="'+hechos+' de '+total+' pedidos">'+marcas+'</div>':'')
    +(otras?'<div class="otras"><div class="r">O cambia de meta</div>'+otras+'</div>':'')
    +'<button class="hist" onclick="loadHist()">De dónde salió cada punto →</button>'
    +'<div class="pie sw-barra"><button class="go" onclick="volverALaPuerta()">'+(alcanza?'Canjear algo ahora':'Pedir y sumar')+'</button>'
    +(alcanza?'<p>Lo eliges al pagar, en PUNTOS.</p>':'')+'</div>'
    +'</div>';
}



// #55 — La escalera de referidos, pintada dentro de la tarjeta del programa.
//
// Sin esto el escalonado no existe para el cliente: los puntos extra le caerían de sorpresa
// y nunca habrían sido una razón para invitar al tercero, que es justamente para lo que se
// puso la escalera. Por eso el escalón siguiente se muestra SIEMPRE con cuántos amigos
// faltan, no solo los ya ganados.
// ⚠ LA FRASE SE DERIVA, NO SE AFIRMA — mismo criterio que `offpeakActiva()` en el servidor.
// "una bebida de la casa" es cierto solo mientras el bono del invitado alcance para R05, y
// R05 se puede repricear **desde el panel** (`catalog_prices`, categoría `reward`), que es
// justo lo que `RWDS[].pts` recibe de `get-catalog`. Un literal acá se vuelve mentira el día
// que el dueño mueva ese número, sin tocar código y sin que nada avise.
// Ya pasó por el camino del código: R05 subió de 120 a 160 el 2026-09-05 y el bono se quedó
// en 120 — ocho días prometiendo una bebida que no alcanzaba a pagar, y encima 120 no cubría
// NINGUNA recompensa salvo la salsa extra.
function loQueGanaQuienInvita(){
  var r=recompensaDeTipo('sandwich');
  return (r&&REFERRER_REWARD_POINTS>=r.pts)
    ? 'un <b>sándwich 15CM GRATIS</b> ('+REFERRER_REWARD_POINTS+' pts)'
    : '<b>'+REFERRER_REWARD_POINTS+' pts</b> para tu próximo pedido';
}
function loQueGanaElInvitado(){
  var r05=recompensaDeTipo('bebida');
  return (r05&&REFERRAL_BONUS_POINTS>=r05.pts)
    ? REFERRAL_BONUS_POINTS+' pts — una bebida de la casa'
    : REFERRAL_BONUS_POINTS+' pts para su primer pedido';
}
function shareReferral(){
  // Antes solo mandaba el número como "código" — el amigo tenía que escribirlo a mano
  // en el registro. El link con ?ref= ya existe y auto-rellena ese campo (ver refCode
  // arriba); solo faltaba usarlo aquí.
  var link=location.origin+location.pathname+'?ref='+encodeURIComponent(cust.phone);
  // El mensaje que sale por WhatsApp es una promesa pública igual que el brief semanal: no
  // puede nombrar la bebida si el bono dejó de cubrirla. `loQueGanaElInvitado()` lo decide.
  var text='Usa mi link para crear tu cuenta en SND//WCH — arrancas con '+loQueGanaElInvitado()
    +', y yo me gano un sándwich: '+link;
  if(navigator.share){
    navigator.share({title:'SND//WCH',text:text,url:link}).catch(function(){});
  }else{
    window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
  }
}
var _creditGiftInProgress=false;
// Guardias de reentrada, como ya tienen doCreditGift/doGiftCardBuy/doWeeklyPlanBuy. BTN()
// no genera `disabled`, así que el botón sigue clickeable durante la llamada. El servidor
// rechaza el segundo reclamo de forma atómica (RPC claim_monthly_challenge), así que no se
// duplican puntos — pero si la respuesta de error llega DESPUÉS que la de éxito, el mensaje
// termina diciendo "Ya reclamaste el reto de este mes" encima de un reclamo que sí
// funcionó. Un mensaje que contradice lo que acaba de pasar erosiona la confianza.
var _challengeClaimInProgress=false;
var _discChallengeClaimInProgress=false;
// Limpia todo el estado en memoria específico del cliente/admin que acaba de cerrar
// sesión — antes solo se limpiaba `cust`/`token`, así que en un dispositivo compartido
// (logout de A, login de B sin recargar la página) myOrders/myAddresses/myFavorites (y
// del lado admin: custDetail/dashStats/searchResults/auditLog) seguían en memoria y se
// alcanzaban a mostrar brevemente bajo la sesión de B hasta que loadUserExtras() (u
// homólogo admin) resolvía de nuevo (hallazgo de auditoría de código).
function doLogout(){
  cust=null;isAdmin=false;savedPh='';token='';aErr='';clearGoogleLink();
  // Quien sale a propósito no puede volver a entrar solo en la próxima apertura.
  try{localStorage.removeItem('sw_g_antes');}catch(e){}
  try{if(typeof google!=='undefined'&&google.accounts&&google.accounts.id)google.accounts.id.disableAutoSelect();}catch(e){}
  // El login por correo también es estado de sesión. Sin esta línea, quien cerraba sesión
  // dejaba el formulario en «teléfono y PIN» para la persona siguiente, y —peor— dejaba en
  // memoria `authProof`, la prueba de que SU correo ya se verificó: el registro la manda, y
  // la próxima cuenta creada en este mismo equipo se quedaba con un correo ajeno.
  limpiarLoginPorCorreo();
  pendingGroupCode=null;pendingRecurringId=null;miHoraApartada=null;
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
  adminOrders=[];bulkSelected={};focusIdx=0;focusRef='';
  sndScreen='p_auth';render();
}

// LO LEGAL, EN CRIOLLO (maqueta aprobada `lo-legal.png`, «me agradan, aprobadas»). Es el
// ÍNDICE: cada fila abre su texto, que no se toca aquí (CLAUDE.md: el texto legal solo cambia
// a pedido explícito). Va también el Libro de Reclamaciones: la ley pide que esté a la vista y
// desde el camino nuevo no se llegaba. La maqueta deja «[fecha real]»: no hay una fecha por
// documento, así que no se inventa. Razón social y RUC salen de BIZ_NAME/BIZ_RUC.
function sPLoLegal(){
  var fila=function(t:string,s:string,pantalla:string,extra?:string,ir?:string){
    return'<button class="doc" onclick="bkTo=\'p_lo_legal\';sndScreen=\''+pantalla+'\';'+(extra||'')+'render()"><b>'+t+'</b><s>'+s+'</s><i>'+(ir||'Leer completo')+'</i></button>';
  };
  return'<div class="mll fi"><button class="sal" onclick="sndScreen=cust?\'p_home\':\'o_home\';render()" aria-label="Volver">←</button>'
    +'<div class="cab"><em>Las reglas del juego</em><h1>Lo legal, en criollo</h1></div>'
    +fila('Términos y condiciones','De qué nos hacemos cargo y de qué no cuando pides, pagas y recibes.','p_legal')
    +fila('Política de privacidad','Qué datos tuyos guardamos, para qué, y cómo pedir que los borremos.','p_legal')
    +fila('Cambios y devoluciones','Qué pasa si el pedido llega mal, tarde o no llega. Incluye cancelaciones.','p_returns')
    +fila('Libro de Reclamaciones','Si algo no estuvo bien, déjalo por escrito. Te damos un código de reclamo.','p_complaints',"cmplStep='form';",'Abrir el libro')
    +'<p class="biz">'+esc(BIZ_NAME)+' · RUC '+esc(BIZ_RUC)+'<br>'+esc(BIZ_CITY)+' · '+esc(BIZ_EMAIL)+'</p>'
    +'</div>';
}
// La cabecera de los textos legales (2026-10-01): la misma de «Lo legal», sin la barra vieja.
// El cuerpo de cada texto queda EXACTAMENTE como estaba (CLAUDE.md: el texto legal no se toca).
function CAB_LEGAL(bk:string,titulo:string){
  return'<div class="mlt fi"><button class="sal" onclick="sndScreen=\''+bk+'\';render()" aria-label="Volver">←</button><div class="cab"><em>Lo legal · '+titulo+'</em></div>';
}
// TÉRMINOS Y PRIVACIDAD — borrador inicial en texto simple, accesible desde el registro
// y el perfil. ⚠️ EDITA este texto con tu política real (revisada por un abogado) antes
// de operar de cara al público — esto es un punto de partida razonable, no asesoría legal.
function sPLegal(){
  var bk=(bkTo||(cust?'p_lo_legal':'o_home'));bkTo=null;
  return CAB_LEGAL(bk,'Términos y privacidad')+'<div style="flex:1;padding:8px 20px 40px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:#fff;margin-bottom:4px;text-wrap:balance">Términos<span class="cut-sep" style="color:'+GOLD+'"> // </span>y privacidad</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#9DA096);margin-bottom:20px">Última actualización: 2026</div>'
    +providerBlockHTML()
    +sec('QUÉ VENDEMOS //','Sándwiches preparados al momento, para delivery en '+BIZ_CITY+' — como Signature (combinaciones curadas por la casa) o armados a tu gusto (ARMA EL TUYO), además de bebidas y snacks. El menú, con descripción y precio de cada producto, está disponible dentro de la app desde el home.')
    // ⚠ TEXTO LEGAL — corregido el 2026-09-12 A PEDIDO EXPLÍCITO DEL DUEÑO, porque había
    // dejado de describir lo que la app hace. Cada afirmación de acá está verificada contra
    // el código, no redactada de memoria:
    //  · El camino de Google pide UN solo campo (actRegister con googleIdToken): nombre y
    //    correo salen del token firmado, el PIN lo genera el servidor y no se muestra, y
    //    `dni`/`birthday` se guardan en null. Decir "pedimos DNI al crear tu cuenta" era
    //    falso para ese camino desde el día que se habilitó.
    //  · `google_id` (el identificador de la cuenta de Google) SE GUARDA en `customers`, y
    //    el texto no lo mencionaba. Es un dato personal nuevo y hay que declararlo.
    +sec('QUÉ DATOS PEDIMOS //','Depende de cómo crees tu cuenta. Con el formulario normal: nombre, teléfono, PIN, DNI y fecha de nacimiento; correo y dirección son opcionales. Con «Continuar con Google» solo te pedimos el teléfono — el nombre y el correo nos los da Google, no creamos ningún PIN que tengas que recordar, y no te pedimos DNI ni fecha de nacimiento. En ese caso guardamos también el identificador de tu cuenta de Google, que es lo que nos deja reconocerte la próxima vez que entres. El DNI y la fecha de nacimiento, cuando los das, solo sirven para verificar tu identidad si necesitas recuperar tu cuenta — no se muestran a nadie más.')
    +sec('PARA QUÉ LOS USAMOS //','Para procesar tus pedidos, acreditar tus puntos y recompensas, prevenir fraude y contactarte sobre el estado de tu pedido.')
    // ⚠ GOOGLE FALTABA POR COMPLETO en esta lista (corregido 2026-09-12, pedido del dueño).
    // No es un detalle de redacción: la propia política de OAuth de Google exige que la
    // privacidad declare qué datos suyos se usan y para qué, así que un texto que no lo
    // menciona es motivo de rechazo al publicar la pantalla de consentimiento. Y hay dos
    // envíos reales, verificados en el código: lo que se ESCRIBE en el campo de dirección va
    // al autocompletado de Places (`AutocompleteSuggestion.fetchAutocompleteSuggestions`) y
    // las coordenadas del pin van al `google.maps.Geocoder`, las dos desde el navegador.
    +sec('CON QUIÉN LOS COMPARTIMOS //','Nunca vendemos tus datos. Se comparten solo con los proveedores necesarios para que el negocio funcione: la pasarela de pago para cobrarte, el servicio de correo para escribirte, Google para buscar tu dirección y para dejarte entrar con tu cuenta, y Meta (Facebook e Instagram) para medir qué anuncios traen pedidos de verdad. A Google le llega lo que escribes en el campo de dirección y el punto que marcas en el mapa, que es lo que permite encontrar el número exacto de tu calle; si entras con «Continuar con Google», Google sabe además que usaste tu cuenta en esta app, como en cualquier sitio donde inicias sesión con ella. A Meta le llegan tu correo, tu teléfono y tu nombre de pila SIEMPRE cifrados con un código irreversible (SHA-256, nunca legibles), junto con el monto del pedido y qué productos llevaste; como en cualquier web con publicidad, tu navegador también le deja ver tu dirección IP y las cookies que el propio píxel de Meta guarda. Además de las compras, Meta ve cuándo creas tu cuenta, cuándo agregas algo al carrito y cuándo te anotas en la lista de espera. NO le llegan tu DNI, tu fecha de nacimiento, tu PIN ni tu dirección de entrega. Esa medición sirve para saber cuánto cuesta traer un cliente nuevo — nunca para decidir qué te cobramos a ti.')
    +sec('TUS DATOS, TU DECISIÓN //','Puedes eliminar tu cuenta permanentemente desde tu perfil en cualquier momento — esto borra tus datos personales, favoritos, direcciones y crédito. Conservamos el historial de ventas ya anonimizado, sin tu nombre ni datos de contacto, para las cifras del negocio. Y si no quieres que midamos tus compras para publicidad, apágalo en tu perfil, en Privacidad: tus pedidos dejan de reportarse a Meta desde ese momento, sin que cambie nada de tu cuenta, tus puntos ni tus precios. Es tu derecho de oposición según la Ley 29733 de Protección de Datos Personales.')
    +sec('CONTACTO //','¿Preguntas sobre tus datos o tu pedido? Escríbenos por WhatsApp desde el botón de soporte, o a '+BIZ_EMAIL+'.')
    +'</div></div>';
}
// Identificación del proveedor — se repite al inicio de Términos, Cambios/Devoluciones
// y el Libro de Reclamaciones porque cada una de esas páginas debe poder leerse por sí
// sola (un consumidor puede llegar directo a cualquiera de ellas desde el pie del home).
function providerBlockHTML(){
  return'<div style="background:var(--sw-card2,#171A14);border:1px solid var(--sw-border,#2C3228);border-radius:10px;padding:14px 16px;margin-bottom:20px;font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-muted,#9DA096);line-height:1.9">'
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
  var bk=(bkTo||(cust?'p_lo_legal':'o_home'));bkTo=null;
  return CAB_LEGAL(bk,'Cambios y devoluciones')+'<div style="flex:1;padding:8px 20px 40px;overflow-y:auto" class="fi">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:#fff;margin-bottom:4px;text-wrap:balance">Cambios<span class="cut-sep" style="color:'+GOLD+'"> // </span>y devoluciones</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#9DA096);margin-bottom:20px">Última actualización: 2026</div>'
    +providerBlockHTML()
    +sec('POR QUÉ NO HAY DEVOLUCIÓN GENERAL //','Nuestros productos son alimentos preparados al momento y perecibles: una vez entregado el pedido, no aceptamos devoluciones de dinero por simple arrepentimiento, tal como establece el Código de Protección y Defensa del Consumidor para este tipo de bienes.')
    +sec('SI TU PEDIDO LLEGÓ MAL //','Si el pedido llega incompleto, con un ingrediente distinto al pedido, o en mal estado, repórtalo dentro de las 48 horas siguientes a la entrega por WhatsApp (con foto si es posible) o desde el Libro de Reclamaciones. Verificado el problema, te ofrecemos —a tu elección— reposición sin costo, crédito interno equivalente en la app, o reembolso por el mismo medio de pago.')
    +sec('CANCELACIONES //','Puedes cancelar sin costo antes de que la cocina empiece a preparar tu pedido. Una vez iniciada la preparación, ya no se puede cancelar ni reembolsar.')
    +sec('TIEMPOS DE REEMBOLSO //','Cuando corresponde reembolso por el medio de pago original (tarjeta vía Culqi, Yape o Plin), el abono puede demorar entre 3 y 10 días hábiles según el operador financiero — nosotros lo iniciamos apenas se aprueba el caso.')
    +sec('CONTACTO //','Escríbenos por WhatsApp desde el botón de soporte, o a '+BIZ_EMAIL+'.')
    +'</div></div>';
}

// LIBRO DE RECLAMACIONES VIRTUAL — exigido por el Código de Protección y Defensa del
// Consumidor (D.S. 011-2011-PCM y modificatorias). Debe ser propio del sitio (no un
// formulario externo ni un Drive), identificar al proveedor, y entregar un código de
// reclamo al consumidor. Accesible SIN cuenta — cualquiera debe poder reclamar.
// ── LIBRO DE RECLAMACIONES · TRES PASOS (maqueta aprobada 2026-10-03,
// docs/maquetas/aprobadas/libro-de-reclamaciones-tres-pasos.png) ─────────────────────────
// 1) ¿Esto es tuyo? — con cuenta, una tarjeta ya llena con «Cambiar»; sin cuenta, los campos.
// 2) Reclamo o queja, y el pedido (se elige de su lista, no se escribe).
// 3) Qué pasó y qué solicitas.
// Los campos son los mismos que exige la ley y que `submit-complaint` ya recibía; los textos
// legales van iguales. Lo escrito vive en `cmplDatos`: cada render reconstruye el DOM, y sin
// guardarlo antes de pasar de paso (o de tocar Reclamo/Queja) se perdería lo tecleado.
var cmplDatos:any={},cmplEditando=false,cmplPedidosPedidos=false,cmplVuelta='';
var CMPL_PASOS=['form','que','detalle'];
var CMPL_CAMPOS=['cq-name','cq-dni','cq-addr','cq-phone','cq-email','cq-guardian','cq-ref','cq-amount','cq-detail','cq-request'];
function cmplGuardar(){
  CMPL_CAMPOS.forEach(function(id){
    var el=document.getElementById(id) as HTMLInputElement|null;
    if(el)cmplDatos[id]=el.value.trim();
  });
}
function cmplDato(id:string){return cmplDatos[id]!=null?String(cmplDatos[id]):'';}
// La cuenta llena lo que sabe, una sola vez: si el cliente lo cambió, se respeta lo suyo.
function cmplPrellenar(){
  if(!cust||cmplDatos._prellenado)return;
  var c:any=cust;
  var de:any={'cq-name':c.name,'cq-dni':c.dni,'cq-addr':c.last_address,'cq-phone':c.phone,'cq-email':c.email};
  Object.keys(de).forEach(function(k){if(!cmplDato(k)&&de[k])cmplDatos[k]=String(de[k]);});
  cmplDatos._prellenado=true;
}
function cmplFaltaDeLaPersona(){
  return['cq-name','cq-dni','cq-addr','cq-phone','cq-email'].some(function(k){return!cmplDato(k);});
}
function cmplIr(paso:string){
  cmplGuardar();
  if(paso==='que'&&cmplStep==='form'){
    var falta=cmplFaltaDeLaPersona();
    if(falta){cmplEditando=true;cmplErr='Completa tus datos: nombre, DNI, domicilio, teléfono y correo.';render();return;}
    if(!/^[^@]+@[^@]+\.[^@]+$/.test(cmplDato('cq-email'))){cmplEditando=true;cmplErr='Ingresa un correo válido.';render();return;}
    if(cmplMinor&&!cmplDato('cq-guardian')){cmplErr='Ingresa el nombre del padre, madre o apoderado.';render();return;}
  }
  cmplErr='';cmplStep=paso;render();
  window.scrollTo(0,0);
}
function cmplAtras(bk:string){
  cmplGuardar();cmplErr='';
  var i=CMPL_PASOS.indexOf(cmplStep);
  if(i>0){cmplStep=CMPL_PASOS[i-1];render();window.scrollTo(0,0);return;}
  cmplVuelta='';sndScreen=bk;render();
}
function cmplCampo(id:string,label:string,type:string,ac:string,area?:boolean){
  var v=esc(cmplDato(id));
  return'<label class="cp"><span>'+label+'</span>'
    +(area?'<textarea id="'+id+'" rows="4">'+v+'</textarea>'
      :'<input id="'+id+'" type="'+type+'"'+(ac?' autocomplete="'+ac+'"':'')+(type==='tel'?' inputmode="tel"':'')+' value="'+v+'">')
    +'</label>';
}
function cmplDniOculto(d:string){d=String(d||'');return d.length>3?d.charAt(0)+'•••••'+d.slice(-2):d;}
function sPComplaints(){
  // A dónde vuelve: se toma de bkTo en la primera pintada y se guarda, porque los pasos
  // vuelven a pintar la pantalla y bkTo es de un solo uso.
  if(bkTo){cmplVuelta=bkTo;bkTo=null;}
  var bk=cmplVuelta||(cust?'p_lo_legal':'o_home');
  if(cmplStep==='success')return sComplaintsSuccess(bk);
  if(CMPL_PASOS.indexOf(cmplStep)<0)cmplStep='form';
  cmplPrellenar();
  var n=CMPL_PASOS.indexOf(cmplStep)+1;
  var queja=cmplKind==='queja';
  var h='<div class="lib3 fi"><div class="top"><button class="sal" data-accion="libro-atras" onclick="cmplAtras(\''+bk+'\')" aria-label="Volver">←</button><span>SND//WCH</span></div>'
    +'<div class="pasos" aria-hidden="true">'+[1,2,3].map(function(k){return'<i'+(k<=n?' class="on"':'')+'></i>';}).join('')+'</div>'
    +'<div class="eyb">Libro de reclamaciones · '+n+' de 3</div>';
  var ley='Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, este establecimiento cuenta con un Libro de Reclamaciones a tu disposición.';
  var plazo='Tenemos hasta 15 días hábiles para responder tu reclamo o queja, conforme a la normativa vigente.';
  var err='<div id="cq-err" class="err" role="alert">'+esc(cmplErr)+'</div>';
  var minor='<button type="button" class="menor" role="checkbox" data-accion="libro-menor" aria-checked="'+(cmplMinor?'true':'false')+'" onclick="cmplGuardar();cmplMinor=!cmplMinor;render()"><i>'+(cmplMinor?icon('check',13,'#F4ECDD'):'')+'</i><span>Soy menor de edad (o reclamo en representación de uno)</span></button>'
    +(cmplMinor?cmplCampo('cq-guardian','Nombre del padre, madre o apoderado','text','name'):'');
  if(cmplStep==='form'){
    var tarjeta=!!cust&&!cmplEditando&&!cmplFaltaDeLaPersona();
    h+='<h2>'+(tarjeta?'¿Esto es tuyo?':'¿Quién reclama?')+'</h2>';
    if(tarjeta){
      h+='<div class="yo"><div class="n">'+esc(cmplDato('cq-name'))+'</div>'
        +'<div class="d">DNI '+esc(cmplDniOculto(cmplDato('cq-dni')))+'<br>'+esc(cmplDato('cq-addr'))+'<br>'+esc(cmplDato('cq-phone'))+' · '+esc(cmplDato('cq-email'))+'</div>'
        +'<button type="button" class="cam" data-accion="libro-cambiar-datos" onclick="cmplEditando=true;render()">Cambiar (reclamo por otra persona)</button></div>';
    }else{
      h+='<div class="campos">'+cmplCampo('cq-name','Nombres y apellidos','text','name')+cmplCampo('cq-dni','DNI / Carnet de extranjería','text','off')
        +cmplCampo('cq-addr','Domicilio','text','street-address')+cmplCampo('cq-phone','Teléfono','tel','tel')+cmplCampo('cq-email','Correo electrónico','email','email')+'</div>';
    }
    h+=minor
      +'<div class="eyb luego">Luego</div><div class="mini"><div><b>2 · ¿Qué es?</b>Reclamo o queja, y el pedido</div><div><b>3 · ¿Qué pasó?</b>Lo que pasó y qué solicitas</div></div>'
      +'<p class="ley">'+ley+' '+plazo+'</p>'+providerBlockLib()+err
      +'<div class="go sw-barra"><button data-accion="libro-siguiente" onclick="cmplIr(\'que\')">'+(tarjeta?'Sí, soy yo · siguiente':'Siguiente')+'</button></div></div>';
    return h;
  }
  if(cmplStep==='que'){
    if(cust&&!myOrders.length&&!cmplPedidosPedidos){
      cmplPedidosPedidos=true;
      api('my-orders',{token:token}).then(function(r:any){myOrders=(r&&r.orders)||[];if(sndScreen==='p_complaints'&&cmplStep==='que'){cmplGuardar();render();}}).catch(function(){});
    }
    h+='<h2>¿Qué es?</h2>'
      +'<div class="tipo" role="radiogroup" aria-label="Tipo">'+[['reclamo','Reclamo','Disconformidad relacionada a un producto o servicio que contrataste con nosotros.'],['queja','Queja','Malestar o disconformidad no relacionada directamente a un pedido (ej. atención, demoras).']].map(function(x){
        var on=cmplKind===x[0];
        return'<button type="button" role="radio" aria-checked="'+on+'" data-accion="libro-tipo-'+x[0]+'" class="'+(on?'on':'')+'" onclick="cmplGuardar();cmplKind=\''+x[0]+'\';render()"><b>'+x[1]+'</b><span>'+x[2]+'</span></button>';
      }).join('')+'</div>';
    var recientes=(myOrders||[]).slice(0,4);
    h+='<div class="eyb">El pedido · opcional</div>';
    if(recientes.length){
      h+='<div class="peds" role="radiogroup" aria-label="Pedido">'+recientes.map(function(o:any){
        var on=cmplDato('cq-ref')===o.ref,d=fechaDelPedido(o);
        return'<button type="button" role="radio" aria-checked="'+on+'" data-accion="libro-pedido" class="'+(on?'on':'')+'" onclick="cmplGuardar();cmplDatos[\'cq-ref\']=cmplDatos[\'cq-ref\']===\''+esc(o.ref)+'\'?\'\':\''+esc(o.ref)+'\';render()">'
          +'<b>'+esc(o.summary||o.ref)+'</b><span>'+(d?cuandoFue(d)+' · ':'')+SOLES_TXT+pz(o.total||0)+'</span></button>';
      }).join('')+'</div>'
      +'<input id="cq-ref" type="hidden" value="'+esc(cmplDato('cq-ref'))+'">';
    }else{
      h+='<div class="campos">'+cmplCampo('cq-ref','Referencia del pedido (ej: SND-1234)','text','off')+'</div>';
    }
    h+='<div class="campos">'+cmplCampo('cq-amount','Monto reclamado · S/, opcional','number','off')+'</div>'+err
      +'<div class="go sw-barra"><button data-accion="libro-siguiente" onclick="cmplIr(\'detalle\')">Siguiente</button></div></div>';
    return h;
  }
  h+='<h2>¿Qué pasó?</h2><div class="campos">'
    +cmplCampo('cq-detail','Describe lo que pasó, con el mayor detalle posible','text','',true)
    +cmplCampo('cq-request','¿Qué solicitas? (ej: reposición, reembolso, respuesta)','text','',true)+'</div>'
    +'<p class="ley">'+plazo+'</p>'+err
    +'<div class="go sw-barra"><button data-accion="libro-enviar" onclick="doSubmitComplaint()"'+(cmplBusy?' disabled':'')+'>'+(cmplBusy?'Enviando…':'Enviar '+(queja?'queja':'reclamo'))+'</button></div></div>';
  return h;
}
// Los datos del proveedor son obligatorios a la vista en el libro; salen de BIZ_*, nunca escritos.
function providerBlockLib(){
  return'<div class="prov"><div><b>Proveedor · </b>'+esc(BIZ_NAME)+'</div><div><b>RUC · </b>'+BIZ_RUC+'</div>'
    +'<div><b>Cobertura · </b>Delivery en '+BIZ_CITY+' (sin local de atención al público)</div>'
    +'<div><b>Contacto · </b>'+BIZ_EMAIL+' · WhatsApp +51 930 957 640</div></div>';
}
function sComplaintsSuccess(bk){
  var queja=cmplKind==='queja';
  return'<div class="lib3 fi"><div class="top"><span></span><span>SND//WCH</span></div>'
    +'<div class="eyb">Libro de reclamaciones</div>'
    +'<h2>'+(queja?'Queja':'Reclamo')+' registrad'+(queja?'a':'o')+'</h2>'
    +'<div class="yo"><div class="eyb" style="margin-top:0">Tu código</div><div class="cod">'+esc(cmplCode||'')+'</div>'
    +'<div class="d">Te enviamos una copia a tu correo. Responderemos dentro de los 15 días hábiles siguientes, conforme a ley.</div></div>'
    +'<div class="go sw-barra"><button data-accion="libro-volver" onclick="sndScreen=\''+bk+'\';cmplStep=\'form\';cmplDatos={};cmplEditando=false;cmplErr=\'\';cmplVuelta=\'\';render()">Volver</button></div></div>';
}
async function doSubmitComplaint(){
  cmplGuardar();
  var g=cmplDato;
  var name=g('cq-name'),dni=g('cq-dni'),addr=g('cq-addr'),phone=g('cq-phone'),email=g('cq-email'),guardian=g('cq-guardian');
  var ref=g('cq-ref'),amount=g('cq-amount'),detail=g('cq-detail'),request=g('cq-request');
  if(!name||!dni||!addr||!phone||!email){cmplEditando=true;cmplErr='Completa tus datos: nombre, DNI, domicilio, teléfono y correo.';cmplStep='form';render();return;}
  if(!detail||!request){cmplErr='Cuéntanos qué pasó y qué solicitas.';render();return;}
  if(!/^[^@]+@[^@]+\.[^@]+$/.test(email)){cmplEditando=true;cmplErr='Ingresa un correo válido.';cmplStep='form';render();return;}
  if(cmplMinor&&!guardian){cmplErr='Ingresa el nombre del padre, madre o apoderado.';cmplStep='form';render();return;}
  cmplErr='';cmplBusy=true;render();
  try{
    var res=await api('submit-complaint',{kind:cmplKind,consumerName:name,consumerDni:dni,consumerAddress:addr,consumerPhone:phone,consumerEmail:email,isMinor:cmplMinor,guardianName:guardian,orderRef:ref,claimedAmount:amount?Number(amount):null,detail:detail,consumerRequest:request});
    cmplCode=res.claimCode;cmplBusy=false;cmplStep='success';render();
  }catch(e){cmplErr=e.message;cmplBusy=false;render();}
}

// ── EJERCER EL DERECHO DE OPOSICIÓN (Ley 29733) ──────────────────────────────────────
// La Política de Privacidad promete que esto se puede apagar desde el perfil. Esta función
// es lo que hace que esa frase sea verdad.
//
// El estado nuevo se toma de lo que devuelve el SERVIDOR (`r.customer`), nunca de lo que el
// navegador supone que acaba de guardar: si la escritura falla, el interruptor vuelve solo a
// su sitio en vez de quedarse mostrando lo contrario de lo que la base dice. Un interruptor
// de privacidad que MIENTE sobre su propio estado es peor que no tenerlo.
async function toggleAdTracking(){
  if(!cust){adOptOutMsg='Inicia sesión para cambiar esto.';render();return;}
  var nuevo=!(cust as any).ad_tracking_opt_out;
  adOptOutMsg='';
  try{
    var r=await api('set-ad-tracking',{token:token,optOut:nuevo});
    if(r&&r.customer){cust=r.customer;cacheCust(cust,isAdmin);}
    adOptOutMsg=nuevo?'Listo — tus pedidos ya no se reportan para medir anuncios.':'Medición activada de nuevo. Gracias, nos ayuda a saber qué anuncio funciona.';
  }catch(e:any){
    adOptOutMsg=(e&&e.message)||'No se pudo guardar. Intenta de nuevo.';
  }
  render();
}

// ── TU CUENTA · «CÓMO PAGAS» Y «AVISOS» ──────────────────────────────────────────────
// Las dos filas de la maqueta de Tu cuenta. Lo que se elige acá se guarda en el cliente
// (set-preferences) y se cumple en otro lado: el método, en el checkout (metodoPreferido);
// los avisos, en el servidor (push.ts · avisoPermitido), que es el único sitio donde apagar
// un aviso lo apaga de verdad.
var prefMsg='';
function metodoPreferido():string{return cust&&(cust as any).preferred_payment==='culqi'?'culqi':'yape';}
function avisosDe():{pedido:boolean,promo:boolean}{
  var n=(cust&&(cust as any).notif_prefs)||{};
  return{pedido:n.pedido!==false,promo:n.promo!==false};
}
async function guardarPreferencias(p:any){
  if(!cust){prefMsg='Entra a tu cuenta para guardar esto.';render();return;}
  var antes=cust;
  cust=Object.assign({},cust,p.preferredPayment?{preferred_payment:p.preferredPayment}:{},p.notifPrefs?{notif_prefs:p.notifPrefs}:{});
  prefMsg='';render();
  try{
    var r=await api('set-preferences',Object.assign({token:token},p));
    if(r&&r.customer){cust=r.customer;cacheCust(cust,isAdmin);}
    prefMsg='Guardado';
  }catch(e:any){cust=antes;prefMsg=(e&&e.message)||'No se pudo guardar.';}
  render();
}
function sPPago(){
  var m=metodoPreferido();
  var fila=function(id:string,t:string,s:string){
    var on=m===id;
    return'<button class="r'+(on?' on':'')+'" role="radio" aria-checked="'+on+'" onclick="guardarPreferencias({preferredPayment:\''+id+'\'})"><span><b>'+t+'</b><s>'+s+'</s></span><span class="marca"></span></button>';
  };
  return'<div class="mct fi"><button class="sal" onclick="sndScreen=\'p_home\';prefMsg=\'\';render()" aria-label="Volver">←</button>'
    +'<div class="cab"><em>Tu cuenta</em><h1>CÓMO<br>PAGAS</h1>'
    +'<p>Con esto abre el pago. Igual puedes cambiarlo en cada pedido.</p></div>'
    +'<div class="lis" role="radiogroup" aria-label="Cómo pagas">'
    +fila('yape','Yape','Sin comisión. Escaneas el QR y listo.')
    +fila('culqi','Tarjeta','Con comisión sobre el envío. La procesa Culqi.')
    +'</div><div class="ok">'+esc(prefMsg)+'</div></div>';
}
function sPAvisos(){
  var a=avisosDe();
  var fila=function(k:string,t:string,s:string){
    var on=(a as any)[k];
    var nuevo=Object.assign({},a);(nuevo as any)[k]=!on;
    return'<button class="r'+(on?' on':'')+'" role="switch" aria-checked="'+on+'" onclick=\'guardarPreferencias({notifPrefs:'+JSON.stringify(nuevo)+'})\'><span><b>'+t+'</b><s>'+s+'</s></span><span class="llave"></span></button>';
  };
  var permiso=typeof Notification!=='undefined'?Notification.permission:'unsupported';
  return'<div class="mct fi"><button class="sal" onclick="sndScreen=\'p_home\';prefMsg=\'\';render()" aria-label="Volver">←</button>'
    +'<div class="cab"><em>Tu cuenta</em><h1>AVISOS</h1>'
    +'<p>Qué te avisamos a este celular.</p></div>'
    +'<div class="lis">'
    +fila('pedido','Tu pedido','Cuando sale y cuando llega.')
    +fila('promo','Novedades y recordatorios','El sándwich del mes, tus puntos, lo que dejaste en el carrito.')
    +'</div><div class="ok">'+esc(prefMsg)+'</div>'
    // Derecho de oposición a la medición publicitaria (Ley 29733): el interruptor se perdió al
    // rehacer «Tu cuenta» y toggleAdTracking quedó sin botón (hallado al limpiar código muerto,
    // 2026-10-02). Encendido = se mide; el estado sale del servidor (cust), no de lo supuesto.
    +(cust?'<div class="cab" style="margin-top:22px"><em>Privacidad</em></div><div class="lis">'
      +'<button class="r'+(!(cust as any).ad_tracking_opt_out?' on':'')+'" role="switch" data-accion="medicion-anuncios" aria-checked="'+(!(cust as any).ad_tracking_opt_out)+'" onclick="toggleAdTracking()"><span><b>Medir anuncios con mis pedidos</b><s>Meta recibe tus datos cifrados para saber qué anuncio trajo el pedido. Apágalo y no se reportan.</s></span><span class="llave"></span></button>'
      +'</div><div class="ok">'+esc(adOptOutMsg)+'</div>':'')
    +(permiso==='granted'?'':'<div class="nota">'+(permiso==='denied'
      ?'<b>Este celular tiene los avisos bloqueados.</b> Actívalos desde los ajustes del navegador para que te lleguen.'
      :'<b>Este celular todavía no recibe avisos.</b> Se activan la primera vez que haces un pedido.')+'</div>')
    +'</div>';
}

// ── 35 · ALGO SALIÓ MAL ────────────────────────────────────────────────────────────────
// Maqueta: docs/maquetas/aprobadas/35-algo-salio-mal.png. Reporte rápido de UN pedido
// entregado, dentro de las 48 h (los Términos dicen lo mismo, ver sPReturns). No es el Libro
// de Reclamaciones: eso sigue en su pantalla, con su plazo legal. DEBEN coincidir con
// problems.ts — lo verifica `npm run parity`.
var REPORTE_PLAZO_HORAS=REGLAS_N.REPORTE_PLAZO_HORAS;
var RESPUESTA_CORTE_HORA=REGLAS_N.RESPUESTA_CORTE_HORA,RESPUESTA_HOY_HORA=REGLAS_N.RESPUESTA_HOY_HORA,RESPUESTA_MANANA_HORA=REGLAS_N.RESPUESTA_MANANA_HORA;
var MOTIVOS_PROBLEMA=[
  {id:'falto',t:'Faltó algo',s:'Vino incompleto'},
  {id:'frio',t:'Llegó frío',s:'O tarde de más'},
  {id:'distinto',t:'No era lo que pedí',s:'Cambiaron algo'},
  {id:'otro',t:'Otra cosa',s:'Cuéntamelo tú'},
];
var probRef='',probMotivo='',probDetalle='',probEnviando=false,probError='',probListo:string|null=null;

function puedeReportarPedido(o:any):boolean{
  if(!o||o.status!=='ENTREGADO')return false;
  var e=Date.parse(o.delivered_at);
  return isFinite(e)&&Date.now()-e<=REPORTE_PLAZO_HORAS*3600000;
}
// La misma regla que respondeAntesDe() del servidor, para mostrar la hora ANTES de enviar;
// después de enviar manda la que guardó el servidor.
function respondeAntesTexto(iso?:string|null):string{
  var t=iso?Date.parse(iso):NaN;
  if(!isFinite(t)){
    var LIMA=-5*3600000,local=new Date(Date.now()+LIMA);
    var y=local.getUTCFullYear(),m=local.getUTCMonth(),d=local.getUTCDate();
    t=(local.getUTCHours()<RESPUESTA_CORTE_HORA?Date.UTC(y,m,d,RESPUESTA_HOY_HORA,0):Date.UTC(y,m,d+1,RESPUESTA_MANANA_HORA,0))-LIMA;
  }
  var mismoDia=new Date(t-5*3600000).getUTCDate()===new Date(Date.now()-5*3600000).getUTCDate();
  var hora=horaLima(t);
  return 'Sando responde antes de '+(hora.indexOf('1:')===0?'la ':'las ')+hora+(mismoDia?'':' de mañana');
}
function cuandoFuePedido(o:any):string{
  var t=Date.parse(o&&(o.delivered_at||o.created_at));
  if(!isFinite(t))return '';
  var dia=function(ms:number){return new Date(ms-5*3600000).toISOString().slice(0,10);};
  var hoy=dia(Date.now()),ayer=dia(Date.now()-86400000),el=dia(t);
  return el===hoy?'hoy':el===ayer?'ayer':new Date(t).toLocaleDateString('es-PE',{timeZone:'America/Lima',day:'numeric',month:'short'});
}
var probRespuesta='';
async function abrirAlgoSalioMal(ref:string){
  probRef=ref;probMotivo='';probDetalle='';probError='';probListo=null;probEnviando=false;probRespuesta='';
  sndScreen='p_problema';render();
  // Si ya lo reportó, la pantalla no vuelve a pedirle que marque nada: le dice hasta cuándo
  // le respondemos, o qué se decidió.
  try{
    var r=await api('my-order-problems',{token:token});
    var p=(r.problems||[]).find(function(x:any){return x.ref===ref;});
    if(p){
      probListo=p.respond_by||'';
      if(p.resolved_at)probRespuesta=({reposicion:'Te lo reponemos sin costo',credito:'Te dejamos el monto como crédito en la app',reembolso:'Te devolvemos el dinero por el mismo medio'} as any)[p.resolution]+(p.resolution_note?'. '+p.resolution_note:'.');
      if(sndScreen==='p_problema')render();
    }
  }catch(e){/* sin la consulta, la pantalla sigue sirviendo para reportar */}
}
function elegirMotivo(id:string){
  var ta=document.getElementById('prob-detalle') as HTMLTextAreaElement|null;
  if(ta)probDetalle=ta.value;
  probMotivo=id;probError='';render();
}
async function enviarProblema(){
  if(!probMotivo){probError='Marca qué pasó.';render();return;}
  var ta=document.getElementById('prob-detalle') as HTMLTextAreaElement|null;
  if(ta)probDetalle=ta.value;
  if(probMotivo==='otro'&&!probDetalle.trim()){probError='Cuéntanos qué pasó.';render();return;}
  probEnviando=true;probError='';render();
  try{
    var r=await api('report-order-problem',{token:token,ref:probRef,motivo:probMotivo,detalle:probDetalle});
    probListo=r.respondeAntesDe||'';
  }catch(e:any){probError=(e&&e.message)||'No se pudo enviar. Intenta de nuevo.';}
  probEnviando=false;render();
}
function sAlgoSalioMal(){
  var o=myOrders.find(function(x){return x.ref===probRef;});
  if(!o)return sPOrders();
  var volver="sndScreen='p_ord_detail';render()";
  var h='<div class="m35 fi"><div class="forro"></div><div class="wicho"></div>'
    +'<button class="sal" onclick="'+volver+'" aria-label="Volver">←</button>'
    +'<div class="cab"><em>Pedido '+esc(String(o.ref||''))+(cuandoFuePedido(o)?' · '+esc(cuandoFuePedido(o)):'')+'</em>'
    +'<h1>“Dime qué pasó.<br>Lo arreglo yo.”</h1>'
    +'<p>No hace falta que escribas nada. Marca lo que pasó y te respondo hoy mismo.</p></div>'
    +'<img class="figura" src="img/sando2_cuerpo_forro.png" alt="">';
  if(probListo!==null){
    return h+'<div class="listo">'+(probRespuesta?esc(probRespuesta):'Listo. Ya lo tengo.')+'</div>'
      +(probRespuesta?'':'<div class="plazo">'+esc(respondeAntesTexto(probListo))+'.</div>')
      +'<button class="ir sw-barra" onclick="'+volver+'">Volver a mi pedido</button></div>';
  }
  if(!puedeReportarPedido(o)){
    return h+'<div class="listo">Pasaron más de '+REPORTE_PLAZO_HORAS+' horas desde la entrega.</div>'
      +'<div class="plazo">Si igual quieres dejar constancia, está el Libro de Reclamaciones.</div>'
      +'<button class="ir sw-barra" onclick="sndScreen=\'p_complaints\';render()">Libro de Reclamaciones</button></div>';
  }
  return h+'<div class="ops" role="radiogroup" aria-label="Qué pasó">'+MOTIVOS_PROBLEMA.map(function(m){
      var on=probMotivo===m.id;
      return'<button class="op'+(on?' on':'')+'" role="radio" aria-checked="'+on+'" onclick="elegirMotivo(\''+m.id+'\')"><b>'+esc(m.t)+'</b><i>'+esc(m.s)+'</i></button>'
        +(on&&m.id==='otro'?'<textarea id="prob-detalle" maxlength="1000" placeholder="Cuéntamelo acá">'+esc(probDetalle)+'</textarea>':'');
    }).join('')+'</div>'
    +'<div class="plazo">'+esc(respondeAntesTexto(null))+'</div>'
    +(probError?'<div class="err">'+esc(probError)+'</div>':'')
    +'<button class="ir sw-barra"'+(probEnviando?' disabled':'')+' onclick="enviarProblema()">'+(probEnviando?'Enviando…':'Enviar el reclamo')+'</button></div>';
}

// ── TUS FAVORITOS (2026-10-01) ───────────────────────────────────────────────────────────
// Se guardaban desde el armador y se cargaban al entrar, pero ninguna pantalla los mostraba:
// «Y además» los promete («lo que guardaste, a un toque de pedirlo otra vez») y esto los cumple.
// Pedirlo reconstruye el armado (loadBuild) y lleva a confirmarlo: el precio es el de hoy.
function sFavoritos(){
  var bk="sndScreen=cust?'p_home':'o_home';render()";
  var favs=myFavorites||[];
  return'<div class="mw mpt mph mfav fi"><button class="sal" onclick="'+bk+'" aria-label="Volver">←</button>'
    +'<div class="dice"><em>Tus favoritos</em><h1>'+(favs.length?'Lo que guardaste':'Todavía nada guardado')+'</h1></div>'
    +(favs.length?'<div class="fav-lista">'+favs.map(function(f:any,i:number){
        var b=f.build||{};
        var sig=b.mode==='sig'?SIGS.find(function(x:any){return x.id===b.sigId;}):null;
        var que=sig?sig.n:(b.mode==='byo'?'Armado por ti':'');
        return'<div class="fav"><span><b>'+esc(f.name||'')+'</b><s>'+esc(que)+(b.size?' · '+esc(String(b.size))+'CM':'')+'</s></span>'
          +'<button type="button" data-accion="pedir-favorito" onclick="loadBuild(myFavorites['+i+'].build)">Pedirlo →</button></div>';
      }).join('')+'</div>'
      :VACIO('Sin favoritos','Cuando armes uno que te guste, guárdalo al confirmarlo y aparece acá.','<button class="ir" onclick="volverALaPuerta()">Ir a pedir</button>','piensa'))
    +'</div>';
}
