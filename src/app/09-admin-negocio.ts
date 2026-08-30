// ADMIN DASHBOARD — vista de negocio (ventas, productos, clientes, puntos)
async function loadDashboard(){
  sndScreen='admin_dashboard';busy=true;busyMsg='Calculando métricas...';render();
  try{
    var results=await Promise.all([api('dashboard-stats',{token:token}),api('admin-at-risk-customers',{token:token})]);
    dashStats=results[0];atRiskCustomers=results[1].customers;
  }catch(e){dashStats=null;atRiskCustomers=null;}
  busy=false;render();
}
function waRiskContact(i){
  // Recibe solo el índice (numérico, seguro de interpolar en onclick) y busca el cliente
  // en memoria — nunca se embebe name/phone (texto libre del cliente) directo en el
  // atributo onclick, que un XSS podría explotar para robar el token de admin de localStorage
  // (hallazgo de auditoría 2026-08-07).
  var c=(atRiskCustomers||[])[i];if(!c)return;
  var msg='Hola '+(c.name||'')+'! Somos de SND//WCH — te extrañamos por acá, ¿todo bien? Cuando quieras tu Signature de siempre, ahí estamos.';
  window.open('https://wa.me/51'+String(c.phone).replace(/\D/g,'').replace(/^51/,'')+'?text='+encodeURIComponent(msg),'_blank');
}
function DTILE(label,big,sub?,muted?){
  // muted=true reduce el peso visual para data de solo-referencia (ej. puntos en
  // circulación) que no compite por atención con las métricas que sí piden una acción
  // (hallazgo de auditoría: todo DTILE pesaba visualmente igual).
  var bg=muted?'var(--sw-card-muted,#24382F)':'var(--sw-card,#2D5246)',bd=muted?'var(--sw-border-muted,#2A473B)':'var(--sw-border,#3A6B58)',lc=muted?'var(--sw-text-muted3,#7FA08D)':GOLD,bc=muted?'var(--sw-text-muted4,#C8D6CE)':'var(--sw-text,#FFFFFF)',bs=muted?'20px':'26px';
  return'<div style="background:'+bg+';border:1px solid '+bd+';border-radius:12px;padding:14px 16px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:'+lc+';letter-spacing:.15em;margin-bottom:6px">'+label+'</div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:'+bs+';font-weight:640;color:'+bc+';line-height:1">'+big+'</div>'+(sub?'<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">'+sub+'</div>':'')+'</div>';
}
// Tile "hero" — usado una sola vez por pantalla para la métrica que de verdad manda
// (ingresos de HOY): el dueño abre el panel para saber "¿cómo voy hoy?", no para
// comparar HOY contra TOTAL histórico con el mismo peso visual.
function DHERO(label,big,sub?){
  return'<div style="background:linear-gradient(135deg,rgba(203,162,88,.16),rgba(203,162,88,.05));border:1px solid rgba(203,162,88,.5);border-radius:14px;padding:20px 18px;box-shadow:0 4px 22px rgba(203,162,88,.14)"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">'+label+'</div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:42px;font-weight:640;color:var(--sw-text,#FFFFFF);line-height:1">'+big+'</div>'+(sub?'<div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:'+GOLD+';margin-top:6px">'+sub+'</div>':'')+'</div>';
}
function DBAR(label,value,max,color?){
  var pct=max>0?Math.min(100,Math.round((value/max)*100)):0;
  return'<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">'+label+'</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:'+(color||GOLD)+'">'+value+'</span></div><div style="background:var(--sw-bg,#1E3932);border-radius:4px;height:8px;overflow:hidden"><div style="background:'+(color||GOLD)+';height:100%;width:'+pct+'%;border-radius:4px"></div></div></div>';
}
function sAdminDashboard(){
  var h=H('PANEL DE NEGOCIO',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  if(!dashStats){
    h+='<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:#ff8888;letter-spacing:.2em">No se pudo cargar //</div></div>'+BTN('Reintentar //','loadDashboard()');
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
      +'<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:#ffa500;letter-spacing:.15em;margin-bottom:6px">Alertas //</div>'
      +alerts.map(function(a){return'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);margin-bottom:4px;display:flex;align-items:center;gap:5px">'+icon('warning',12,'#ffa500')+'<span>'+esc(a)+'</span></div>';}).join('')
      +'</div>';
  }
  // Ventas
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Ventas //</div>';
  // Antes había que comparar los números a mano contra la semana/mes pasado — el dato
  // del período anterior ya se calcula en el servidor, esto solo arma el "+X% vs antes".
  function deltaTxt(pct){
    if(pct==null)return'';
    var arrow=pct>0?'▲':pct<0?'▼':'●';
    var color=pct>0?'#25D366':pct<0?'#ff8888':'#A8C8B0';
    return' · <span style="color:'+color+'">'+arrow+' '+(pct>0?'+':'')+pct+'% vs. antes</span>';
  }
  h+='<div style="margin-bottom:10px">'+DHERO('Hoy',SOLES+d.revenue.today.revenue,d.revenue.today.count+' pedidos · tkt '+SOLES+d.revenue.today.avgTicket)+'</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px">'
    +DTILE('Semana',SOLES+d.revenue.week.revenue,d.revenue.week.count+' pedidos · tkt '+SOLES+d.revenue.week.avgTicket+deltaTxt(d.deltas&&d.deltas.weekRevenuePct),true)
    +DTILE('Mes',SOLES+d.revenue.month.revenue,d.revenue.month.count+' pedidos · tkt '+SOLES+d.revenue.month.avgTicket+deltaTxt(d.deltas&&d.deltas.monthRevenuePct),true)
    +DTILE('Total',SOLES+d.revenue.allTime.revenue,d.revenue.allTime.count+' pedidos · tkt '+SOLES+d.revenue.allTime.avgTicket,true)
    +'</div>';
  // Ganancia estimada = ingresos × (1 - costo de insumos ~40-50%, ver COGS_LOW/HIGH en
  // admin.ts) — siempre como rango, nunca como cifra exacta, porque no hay costo real
  // por receta en el sistema (solo precio de venta).
  if(d.estimatedProfit){
    h+='<div style="background:rgba(37,211,102,.08);border:1px solid rgba(37,211,102,.25);border-radius:10px;padding:14px 16px;margin-bottom:18px">'
      +'<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:#25D366;letter-spacing:.15em;margin-bottom:8px">Ganancia estimada (rango, no exacta) //</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      +[['Hoy',d.estimatedProfit.today],['Semana',d.estimatedProfit.week],['Mes',d.estimatedProfit.month],['Total',d.estimatedProfit.allTime]].map(function(x){
        return'<div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em">'+x[0]+'</div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:16px;font-weight:640;color:#25D366">'+SOLES+x[1].low+'–'+SOLES+x[1].high+'</div></div>';
      }).join('')
      +'</div></div>';
  }
  if(d.codPending&&d.codPending.count>0){
    h+='<div style="background:rgba(255,165,0,.08);border:1px solid rgba(255,165,0,.25);border-radius:10px;padding:14px 16px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:#ffa500;letter-spacing:.15em">Por cobrar · contra entrega //</div><div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+d.codPending.count+' pedido(s) sin cobrar todavía</div></div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:#ffa500">'+SOLES+d.codPending.total+'</div></div>';
  }
  // Tendencia 14 días
  if(d.trend&&d.trend.length){
    var trMax=Math.max.apply(null,d.trend.map(function(t){return t.revenue;}).concat([1]));
    h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Tendencia · 14 días //</div>';
    h+='<div style="display:flex;gap:3px;align-items:flex-end;height:70px;margin-bottom:6px">'+d.trend.map(function(t){var pct=Math.round((t.revenue/trMax)*100);return'<div style="flex:1;height:100%;display:flex;align-items:flex-end" title="'+t.date+': S/'+t.revenue+'"><div style="width:100%;background:'+(t.revenue>0?GOLD:'var(--sw-card2,#1A3028)')+';height:'+Math.max(pct,t.revenue>0?4:2)+'%;border-radius:2px 2px 0 0"></div></div>';}).join('')+'</div>';
    h+='<div style="display:flex;gap:3px;margin-bottom:18px">'+d.trend.map(function(t,i){return'<div style="flex:1;text-align:center;font-family:EB Garamond,serif;font-style:italic;font-size:6px;color:var(--sw-text-muted,#A8C8B0)">'+(i%2===0?t.date:'')+'</div>';}).join('')+'</div>';
  }
  // Pedidos por estado
  var stEntries=Object.keys(d.ordersByStatus||{});
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Pedidos por estado //</div>';
  if(!stEntries.length){
    h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px">Sin pedidos todavía.</div>';
  }else{
    // ordersByStatus cuenta TODA la tabla histórica (ver dashboard_aggregates): ENTREGADO
    // crece sin límite mientras los estados en vivo — lo que de verdad hay que operar
    // AHORA — casi siempre son números chicos. Compartir una sola escala los volvía
    // invisibles junto a ENTREGADO (hallazgo de auditoría) — cada grupo ahora escala
    // contra su propio máximo.
    var LIVE_STATUSES=['RECIBIDO','PREPARANDO','EN CAMINO'];
    var liveEntries=LIVE_STATUSES.filter(function(k){return k in d.ordersByStatus;});
    var doneEntries=stEntries.filter(function(k){return LIVE_STATUSES.indexOf(k)===-1;});
    if(liveEntries.length){
      var liveMax=Math.max.apply(null,liveEntries.map(function(k){return d.ordersByStatus[k];}).concat([1]));
      h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em;margin-bottom:6px">En curso ahora //</div>';
      h+=liveEntries.map(function(k){return DBAR((STATUSES[k]||{}).label||k,d.ordersByStatus[k],liveMax,(STATUSES[k]||{}).c);}).join('');
    }
    if(doneEntries.length){
      var doneMax=Math.max.apply(null,doneEntries.map(function(k){return d.ordersByStatus[k];}).concat([1]));
      h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em;margin:10px 0 6px">Histórico //</div>';
      h+=doneEntries.map(function(k){return DBAR((STATUSES[k]||{}).label||k,d.ordersByStatus[k],doneMax,(STATUSES[k]||{}).c);}).join('');
    }
  }
  if(d.avgEtaMinutes!=null){
    h+='<div style="margin-top:10px">'+DTILE('Tiempo estimado promedio ofrecido',d.avgEtaMinutes+' min','Cuando se marca "EN CAMINO"')+'</div>';
  }
  h+='<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>';
  // Productos top
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Productos más vendidos //</div>';
  if(d.topProducts&&d.topProducts.length){
    var pMax=Math.max.apply(null,d.topProducts.map(function(p){return p.count;}).concat([1]));
    h+=d.topProducts.map(function(p){
      var pct=Math.round((p.count/pMax)*100);
      return'<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(p.name)+'</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:'+GOLD+'">'+p.count+' vendidos · '+SOLES+p.revenue+'</span></div><div style="background:var(--sw-bg,#1E3932);border-radius:4px;height:8px;overflow:hidden"><div style="background:'+GOLD+';height:100%;width:'+pct+'%;border-radius:4px"></div></div></div>';
    }).join('');
  }else{
    h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px">Aún no hay ventas pagadas para rankear productos.</div>';
  }
  h+='<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>';
  // Clientes
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Clientes //</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">'
    +DTILE('Total',d.customers.total)
    +DTILE('Recurrentes',d.customers.returning,'>1 pedido')
    +DTILE('Nuevos · semana',d.customers.newThisWeek)
    +DTILE('Nuevos · mes',d.customers.newThisMonth)
    // ROI del programa de referidos — antes no había ninguna forma de ver si el bono
    // de 50 puntos por referido realmente atrae clientes/ingresos.
    +(d.referrals?DTILE('Clientes referidos',d.referrals.referredCustomers,SOLES+d.referrals.revenue+' en ventas'):'')
    +'</div>';
  if(d.peakHours&&d.peakHours.length){
    var peakTop=d.peakHours.slice().sort(function(a,b){return b.count-a.count;})[0];
    var peakDayNames=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var peakDayTop=d.peakDays&&d.peakDays.length?d.peakDays.slice().sort(function(a,b){return b.count-a.count;})[0]:null;
    h+='<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px;display:flex;align-items:center;gap:5px"><span style="display:inline-flex;align-items:center;gap:5px">'+icon('reportes',12,'#A8C8B0')+'<span>Hora pico (últimos 90 días): </span></span><b style="color:var(--sw-text,#FFFFFF)">'+peakTop.hour+':00-'+(peakTop.hour+1)+':00</b>'+(peakDayTop?' · Día pico: <b style="color:var(--sw-text,#FFFFFF)">'+peakDayNames[peakDayTop.dow]+'</b>':'')+'</div>';
  }
  // Confirmados vs. abandonados por Yape/Plin — antes no había forma de ver de un
  // vistazo qué tan seguido un pedido con este método SÍ termina transfiriéndose vs.
  // cuántos se cancelan por no confirmarse a tiempo (mismo cron de 3h que expira un
  // pago manual sin confirmar).
  if(d.yapePlin&&d.yapePlin.total>0){
    var ypRate=Math.round((d.yapePlin.confirmed/d.yapePlin.total)*100);
    h+='<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:14px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Yape/Plin — confirmados vs. abandonados //</div><div style="display:flex;gap:8px"><div style="flex:1;text-align:center;background:var(--sw-card2,#1A3028);border-radius:8px;padding:8px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:#25D366">'+d.yapePlin.confirmed+'</div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.05em">Confirmados</div></div><div style="flex:1;text-align:center;background:var(--sw-card2,#1A3028);border-radius:8px;padding:8px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:#ff5555">'+d.yapePlin.abandoned+'</div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.05em">Abandonados</div></div><div style="flex:1;text-align:center;background:var(--sw-card2,#1A3028);border-radius:8px;padding:8px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:'+GOLD+'">'+ypRate+'%</div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.05em">Tasa confirm.</div></div></div></div>';
  }
  // Origen de campaña (?src=... en el link del anuncio) — sin esto no hay forma de saber
  // si una campaña paga se está pagando sola. "convertidos" cuenta solo a quien ya hizo al
  // menos un pedido, no solo se registró.
  if(d.bySource&&d.bySource.length){
    h+='<div style="margin-bottom:16px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Origen de clientes //</div>'
      // recentRevenue/recentAvgTicket cubren solo la ventana reciente del dashboard
      // (~14-31 días, misma que topProducts/trend), no ingresos históricos totales por
      // fuente — por eso solo se muestran cuando hay algo que mostrar (>0), en vez de
      // sugerir un $0 que en realidad es "sin pedidos EN ESTA VENTANA".
      +d.bySource.map(function(s: any){return'<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border-radius:8px;padding:8px 12px;margin-bottom:6px"><span style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">'+esc(s.source)+'</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);text-align:right">'+s.signups+' registrados · <span style="color:'+GOLD+'">'+s.converted+' pidieron</span>'+(s.recentRevenue>0?'<br>S/'+s.recentRevenue.toFixed(0)+' · ticket S/'+s.recentAvgTicket.toFixed(2)+' (últimos días)':'')+'</span></div>';}).join('')
      +'</div>';
  }
  var tiers=d.customers.tiers||{};
  // VIP se retiró como tier — ya no hay un multiplicador de puntos distinto por nivel,
  // así que ya no tiene sentido mostrarlo como un bucket aparte en este gráfico.
  var tMax=Math.max(tiers.FREQUENT||0,tiers.REGULAR||0,tiers.MEMBER||0,1);
  h+=DBAR('Frequent',tiers.FREQUENT||0,tMax,GOLD)+DBAR('Regular',tiers.REGULAR||0,tMax,'#7FA894')+DBAR('Member',tiers.MEMBER||0,tMax,'#4A6B5A');
  h+='<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>';
  // Clientes en riesgo de fuga — priorizados por días sin pedir Y rango (perder a alguien
  // de MESA FUNDADORA pesa más que perder a alguien NUEVO). No reemplaza los recordatorios
  // automáticos (remind-second-order/remind-high-rank-winback), es para que el dueño
  // decida a quién más vale la pena escribirle personalmente.
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Clientes en riesgo //</div>';
  if(atRiskCustomers&&atRiskCustomers.length){
    h+=atRiskCustomers.slice(0,10).map(function(c,i){
      var daysTxt=c.daysSinceLastOrder==null?'nunca pagó un pedido':'hace '+c.daysSinceLastOrder+' días';
      return'<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:10px 14px;margin-bottom:8px"><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(c.name||c.phone)+'</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(c.rank)+' · último pedido '+daysTxt+'</div></div><button onclick="waRiskContact('+i+')" aria-label="Contactar por WhatsApp" style="all:unset;cursor:pointer;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:'+GOLD+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:600;padding:8px 12px;border-radius:8px;flex-shrink:0;display:inline-flex">'+icon('chat',14,GOLD)+'</button></div>';
    }).join('');
  }else{
    h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px">Sin clientes en riesgo por ahora.</div>';
  }
  h+='<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>';
  // Puntos
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Puntos //</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:8px">'
    +DTILE('Emitidos',d.points.issued)
    +DTILE('Canjeados',d.points.redeemed)
    +DTILE('En circulación',d.points.outstanding,undefined,true)
    +'</div>';
  h+='<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>';
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Exportar //</div>';
  h+='<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">'
    +'<button onclick="exportCsv(\'export-orders\',\'pedidos\')" style="all:unset;cursor:pointer;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);color:'+GOLD+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;padding:12px;border-radius:8px;text-align:center">Exportar pedidos (CSV) //</button>'
    +'<button onclick="exportCsv(\'export-customers\',\'clientes\')" style="all:unset;cursor:pointer;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);color:'+GOLD+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;padding:12px;border-radius:8px;text-align:center">Exportar clientes (CSV) //</button>'
    +'</div>';
  h+=BTN('Actualizar //','loadDashboard()',true);
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
    var rows=r.orders||r.customers||r.waitlist||[];
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
// Antes armaba su propio header a mano (flecha + título grande, sin wordmark) en vez de
// usar H() como las otras 14 pantallas de detalle — se sentía "de otra app" sin ninguna
// razón funcional (hallazgo de auditoría visual, MEDIO). H() también trae el toggle
// claro/oscuro y sndScreen='admin_home' vía loadAdmin() (no solo render()), que esta pantalla no
// tenía.
function sAdminGen(){return'<div style="min-height:100vh;display:flex;flex-direction:column;background:var(--sw-bg,#1E3932)">'+H('Puntos manuales','loadAdmin()')+'<div style="flex:1;padding:24px 20px" class="fi"><p style="font-family:\'EB Garamond\',serif;font-size:14px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:20px;line-height:1.6">Otorga puntos confirmados directamente a un cliente.</p><div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">'+INP('ag-ph','Teléfono del cliente // 9XXXXXXXX','tel',agPhone,'phone')+INP('ag-pts','Puntos a otorgar // Ej: 25','number',agPts)+BTN('Otorgar puntos //','doManualPts()')+'</div><div id="ag-msg" style="font-family:\'EB Garamond\',serif;font-size:13px;color:'+GOLD+';min-height:20px">'+agMsg+'</div>'
  +'<div style="height:1px;background:var(--sw-card,#2D5246);margin:28px 0 24px"></div>'
  +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:640;color:var(--sw-text,#FFFFFF);margin-bottom:4px;text-wrap:balance">Crédito<span class="cut-sep" style="color:'+GOLD+'"> // </span>ajuste manual</div>'
  +'<p style="font-family:\'EB Garamond\',serif;font-size:14px;color:var(--sw-text-muted,#A8C8B0);margin:8px 0 20px;line-height:1.6">Corrige el saldo de crédito interno de un cliente (ej. reponer un pedido cancelado que se pagó con crédito). Puede ser negativo para descontar un exceso otorgado por error.</p><div style="display:flex;flex-direction:column;gap:12px">'+INP('ac-ph','Teléfono del cliente // 9XXXXXXXX','tel',acPhone,'phone')+INP('ac-delta','Monto // positivo suma, negativo descuenta','number',acDelta,'coin')+BTN('Ajustar crédito //','doManualCredit()')+'</div><div id="ac-msg" style="font-family:\'EB Garamond\',serif;font-size:13px;color:'+GOLD+';min-height:20px;margin-top:12px">'+acMsg+'</div></div></div>';}
async function doManualPts(){
  var ph=gv('ag-ph').trim(),pts=parseInt(gv('ag-pts')||'0');
  agPhone=ph;agPts=String(pts);if(!ph||pts<1){agMsg='Ingresa teléfono y puntos válidos.';render();return;}
  busy=true;busyMsg='Otorgando puntos...';render();
  try{var r=await api('admin-manual-points',{token:token,phone:ph,pts:pts});agMsg='✓ +'+pts+' puntos a '+esc(r.name);if(cust&&cust.phone===ph)cust.points=r.newPoints;}
  catch(e){agMsg='Error: '+e.message;}
  busy=false;render();
}
async function doManualCredit(){
  var ph=gv('ac-ph').trim(),delta=parseFloat(gv('ac-delta')||'0');
  acPhone=ph;acDelta=String(delta);if(!ph||!delta){acMsg='Ingresa teléfono y un monto distinto de cero.';render();return;}
  busy=true;busyMsg='Ajustando crédito...';render();
  try{var r=await api('admin-manual-credit',{token:token,phone:ph,delta:delta});acMsg='✓ Nuevo saldo de '+esc(r.name)+': '+SOLES_TXT+r.newBalance.toFixed(2);if(cust&&cust.phone===ph)cust.credit_balance=r.newBalance;}
  catch(e){acMsg='Error: '+e.message;}
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
      var h=(document.getElementById('maddr-hint') as HTMLInputElement | null);
      if(h)h.innerHTML=hint?'<span style="color:'+GOLD+'">&#8599; Referencia: </span>'+esc(hint):'';
      // Pre-fill input if empty
      var inp=(document.getElementById('maddr-input') as HTMLInputElement | null);
      if(inp&&!inp.value&&hint)inp.value=hint;
    })
    .catch(function(){});
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
  // Antes esto escribía la dirección directo en el input y no repintaba, para no perder
  // lo que el cliente tuviera a medio escribir en los otros campos. Ahora sí repinta,
  // porque el aviso de zona vs. pin (deliveryZoneMismatchHTML) vive en el picker de zona
  // y sin un render no aparecería hasta que el cliente tocara cualquier otra cosa — o
  // sea, justo cuando ya no sirve. syncConfirmFields() antes del render es lo que hace
  // que nada de lo escrito se pierda; addrText se fija después porque la dirección que
  // vale es la que se acaba de elegir en el mapa, no la que había en el input.
  syncConfirmFields();
  addrText=a;
  // Si el pin cae claramente en otro distrito del que estaba elegido, no tiene sentido
  // dejar el anterior: el mapa es un dato más fuerte que un selector que el cliente
  // quizá ni tocó.
  var inferred=districtFromAddress(a);
  if(inferred)deliveryDistrict=inferred;
  render();
  var el=(document.getElementById('o-addr') as HTMLInputElement | null);
  if(el){el.style.borderColor='#3A86FF';el.focus();}
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
// render() envuelve a renderScreen() para que un error al pintar UNA pantalla no deje la
// app muda. Antes, si cualquier función de pantalla lanzaba, `render()` moría antes de
// tocar el DOM: la pantalla anterior se quedaba intacta y tocar el botón "no hacía nada",
// sin ningún mensaje, ni en la app instalada ni en el navegador. Eso es exactamente lo
// que se reportó el 2026-08-21 con ARMA EL TUYO, y lo que hizo imposible diagnosticarlo
// a distancia: un fallo silencioso no deja rastro que el dueño pueda leerme.
// Ahora el error se pinta en pantalla, con la versión del build y la pantalla que falló.
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
    // Repone cualquier función nuestra que un bundle de terceros haya pisado desde el
    // render anterior (ver el bloque "BLINDAJE DE FUNCIONES GLOBALES" más abajo). Va acá
    // porque render() corre antes de pintar cada pantalla: si Culqi acaba de pisar `go`,
    // los onclick del HTML que estamos por generar ya salen apuntando a la función buena.
    if(typeof sndRestoreOwnedFns==='function')sndRestoreOwnedFns();
    renderScreen();
  }catch(e){
    try{
      console.error('render() falló en la pantalla "'+sndScreen+'":',e);
      var appEl=(document.getElementById('app') as HTMLElement | null);
      if(appEl){
        appEl.innerHTML='<div style="min-height:100vh;background:#1E3932;padding:28px 22px;font-family:\'EB Garamond\',serif;color:#F2F0EB">'
          +'<div style="font-family:\'Bodoni Moda\',serif;font-size:20px;font-weight:640;color:#fff;margin-bottom:10px">Algo se rompió al abrir esta pantalla</div>'
          +'<p style="font-size:15px;line-height:1.55;color:#A8C8B0;margin-bottom:18px">No es culpa tuya. Toca el botón de abajo para recargar la app con la última versión; si vuelve a pasar, mándanos esta pantalla completa.</p>'
          +'<div style="background:#1A3028;border:1px solid #3A6B58;border-radius:8px;padding:14px 16px;font-size:13px;line-height:1.6;word-break:break-word;margin-bottom:20px">'
          +'<div style="color:'+GOLD+';font-weight:600;letter-spacing:.14em;font-size:10px;margin-bottom:8px">DETALLE //</div>'
          +'<div>Pantalla: '+esc(String(sndScreen))+'</div><div>Versión: '+esc(APP_BUILD)+'</div><div>Error: '+esc(String((e&&(e as any).message)||e))+'</div></div>'
          +'<button onclick="applyAppUpdate()" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#241a08;font-family:\'Bodoni Moda\',serif;font-size:16px;font-weight:700;padding:18px 0;border-radius:10px;text-align:center">Recargar la app</button></div>';
      }
    }catch(_){}
  }
}
function renderScreen(){
  if(busy){
    var appElBusy=(document.getElementById('app') as HTMLInputElement | null);
    // El admin navega decenas de veces por turno — antes cada navegación (cola,
    // dashboard, inventario, etc.) mostraba el splash de pantalla completa (logo +
    // "CARGANDO //"), borrando todo el contexto previo, cuando ya existe skeletonCards()
    // para esto mismo del lado cliente (hallazgo de auditoría de diseño admin, ALTO).
    if(sndScreen.indexOf('admin')===0){appElBusy.innerHTML='<div style="min-height:100vh;background:var(--sw-bg,#1E3932);padding:20px" class="fi '+(adminLightMode?'admin-light':'admin-dark')+'">'+skeletonCards(4,64)+'</div>';}
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
    case'admin_home':  h=sAdminHome();break;
    case'admin_health':h=sAdminHealth();break;
    case'admin_batch':h=sAdminBatchPlan();break;
    case'admin_video':h=sAdminVideo();break;
    case'admin_gen':   h=sAdminGen();break;
    case'admin_mgr':   h=sAdminMgr();break;
    case'admin_inventory':h=sAdminInventory();break;
    case'admin_catalog':h=sAdminCatalog();break;
    case'admin_secret': h=sAdminSecretSignature();break;
    case'admin_items': h=sAdminCatalogItems();break;
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
    case'admin_promo':h=sAdminPromo();break;
    case'admin_campaign_perf':h=sAdminCampaignPerf();break;
    case'admin_calendar':h=sAdminCalendar();break;
    case'admin_waitlist':h=sAdminWaitlist();break;
    case'admin_focus':h=sAdminFocus();break;
    default:           h=sOHome();
  }
  GOLD=_prevGold;
  if(_prevStatusColors)Object.keys(_prevStatusColors).forEach(function(k){STATUSES[k].c=_prevStatusColors[k];});
  var sameScreen=sndScreen===_lastRenderedSc,scrollY=window.scrollY;
  document.body.classList.toggle('no-fi',sameScreen);
  // Banner único y proactivo en vez de dejar que cada acción falle por separado con su
  // propio mensaje genérico — antes no había ninguna detección de modo sin conexión.
  var offlineBanner=isOffline?'<div style="background:#ffa500;color:#1a1200;text-align:center;padding:6px;font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;letter-spacing:.1em;display:flex;align-items:center;justify-content:center;gap:5px">'+icon('warning',12,'#1a1200')+'<span>SIN CONEXIÓN — reconectando…</span></div>':'';
  // Nunca mientras hay una operación en vuelo (un pago, por ejemplo): recargar en medio
  // de un cobro es exactamente lo que no queremos ofrecerle al cliente.
  var updateBanner=(updateReady&&!busy)?'<button type="button" onclick="applyAppUpdate()" style="width:100%;border:0;background:var(--sw-gold,#C9A227);color:#1a1200;text-align:center;padding:8px 6px;min-height:44px;font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;letter-spacing:.08em;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">'+icon('refresh',13,'#1a1200')+'<span>NUEVA VERSIÓN DISPONIBLE — TOCA PARA ACTUALIZAR</span></button>':'';
  (document.getElementById('app') as HTMLInputElement | null).innerHTML='<div class="'+(adminScope?(adminLight?'admin-light':'admin-dark'):'')+'" style="min-height:100vh;display:flex;flex-direction:column;background:var(--sw-bg,#1E3932)">'+offlineBanner+updateBanner+h+'</div>';
  window.scrollTo(0,sameScreen?scrollY:0);
  _lastRenderedSc=sndScreen;
  if(sndScreen==='p_auth')mountGoogleButton();
  renderOverlays();
  makeClickablesAccessible();
}

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


// INVENTORY
var INV_CATS=[
  {t:'Panes',arr:BASES},
  {t:'Proteínas',arr:PROTS},
  {t:'Toppings',arr:TOPS},
  {t:'Quesos',arr:CHEESE},
  {t:'Salsas',arr:SAUCES}
];
var invQty={};
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
    storePausedUntil=r.pausedUntil||null;
    // Capacidad (#23/#24/#16): qué franjas ya están llenas y cuántos pedidos tiene la
    // cocina por delante ahora mismo.
    fullHours=Array.isArray(r.fullHours)?r.fullHours:[];
    queueAhead=typeof r.queueAhead==='number'?r.queueAhead:0;
    if(typeof r.queueMinutesPerOrder==='number')queueMinutesPerOrder=r.queueMinutesPerOrder;
    if(typeof r.maxPerHour==='number')maxPerHour=r.maxPerHour;
  }catch(e){}
}
// C7 — El panel de inventario tiene dos modos que hacen cosas distintas con el MISMO
// número escrito en cada fila:
//  · 'fijar'  → el número ES el stock (lo que había desde siempre; sirve para corregir un
//               conteo, o para apagar el rastreo dejándolo vacío).
//  · 'tanda'  → el número es lo que se acaba de PRODUCIR y se SUMA a lo que quedaba.
// El segundo existe porque el dueño cocina por tandas 1-2 veces por semana y al terminar
// sabe cuánto hizo, no cuánto suma con el sobrante. Hacer esa cuenta a mano por cada
// insumo, recién salido de cocinar, es donde se equivoca — y un stock mal puesto apaga un
// producto en la tienda o vende algo que ya no hay. La suma la hace el servidor
// (admin-inventory-restock) leyendo la fila fresca, no el navegador con el número que
// cargó cuando abrió la pantalla.
var invMode='fijar';
// Tandas (#5): qué se cocinó cuándo y cuánto aguanta. Va por una acción de ADMIN aparte y
// no dentro de get-catalog porque get-catalog es público, y la fecha de producción de la
// cocina no tiene por qué viajar a cualquiera que abra la app.
var invBatches={},invWarnHours=24,invDefaultDays=3;
function setInvMode(m){invMode=m;render();}
async function loadInventory(){
  sndScreen='admin_inventory';busy=true;busyMsg='Cargando inventario...';render();
  try{
    var r=await api('get-catalog',{});
    applyInventory(r.inventory);
    // Si la lectura de tandas falla, el inventario se sigue mostrando: perder la fecha de
    // caducidad empeora la pantalla, dejar sin inventario al dueño la inutiliza.
    try{
      var t=await api('admin-inventory-batches',{token:token});
      invBatches=t.batches||{};invWarnHours=t.warnHours||24;invDefaultDays=t.defaultDays||3;
    }catch(e2){invBatches={};}
  }catch(e){}
  busy=false;render();
}
// Texto de la tanda de un insumo. Devuelve null cuando no hay nada que decir, para que la
// fila no gane una línea vacía.
function batchLine(code){
  var b=invBatches[code];
  if(!b||!b.cookedAt)return null;
  var cocinado=new Date(b.cookedAt).getTime();
  if(!isFinite(cocinado))return null;
  var limite=cocinado+(b.shelfLifeDays||invDefaultDays)*24*3600*1000;
  var horas=Math.round((limite-Date.now())/3600000);
  var f=new Date(cocinado).toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit'});
  if(b.estado==='vencida')return{c:'#ff8888',t:'Tanda del '+f+' — VENCIDA hace '+Math.abs(horas)+' h. No usar.'};
  if(b.estado==='por-vencer')return{c:'#E8B34A',t:'Tanda del '+f+' — vence en '+horas+' h.'};
  return{c:'#A8C8B0',t:'Tanda del '+f+' — quedan '+Math.floor(horas/24)+' d.'};
}
async function setShelfLife(code,name){
  var el=(document.getElementById('vida-'+code) as HTMLInputElement | null);
  if(!el)return;
  var dias=parseInt(el.value,10);
  if(!isFinite(dias)||dias<1){showToast('La vida útil tiene que ser al menos 1 día.');return;}
  busy=true;busyMsg='Guardando vida útil...';render();
  try{
    await api('admin-inventory-set-shelf-life',{token:token,code:code,days:dias});
    if(invBatches[code])invBatches[code].shelfLifeDays=dias;
    showToast('Vida útil de '+name+': '+dias+' día(s).');
  }catch(e){showToast('Error: '+e.message);}
  busy=false;render();
}
async function toggleStock(code,name){
  var cur=invStock[code]!==false;
  var goingTo=!cur;
  // Reactivar ya no pide confirmación — riesgo asimétrico frente a marcar agotado
  // (bloquea ventas si es sin querer, mientras que reactivar solo vuelve a habilitar una
  // opción) — hallazgo de auditoría operativa, BAJO.
  if(!goingTo){
    var msg='¿Confirmas marcar "'+name+'" como SIN STOCK? No se podrá elegir en pedidos hasta que lo reactives.';
    if(!(await showConfirm(msg)))return;
  }
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
  var h=H('INVENTARIO',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:6px">Control de stock //</div>';
  h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px;line-height:1.5">Un producto "sin stock" desaparece de las opciones del cliente hasta que lo reactives. Si además le pones una cantidad, se descuenta sola con cada venta y se marca "sin stock" automáticamente al llegar a 0 — deja el campo vacío para volver al control manual.</div>';
  // Caducidad de tanda (#5): explicar de dónde sale la fecha, porque el dueño no la
  // escribe en ningún lado — se registra sola al usar "Sumar tanda".
  h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px;line-height:1.5">Cada vez que registras una tanda se guarda la fecha. Si un insumo pasa los días que aguanta —o le faltan menos de '+invWarnHours+' h— te llega un aviso y aparece en Salud del negocio. El valor por defecto son '+invDefaultDays+' días (guía de USDA para carne y pollo cocidos en frío); cámbialo por insumo si tu receta aguanta más.</div>';
  h+=SEARCHBOX('inv-search','Buscar producto','inv-row');
  h+='<div style="display:flex;gap:8px;margin:14px 0 10px">'
    +['fijar','tanda'].map(function(m){
      var sel=invMode===m;
      var l=m==='fijar'?'Fijar cantidad':'Sumar tanda';
      return'<div onclick="setInvMode(\''+m+'\')" style="flex:1;text-align:center;background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:8px;padding:10px 8px;cursor:pointer;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:'+(sel?'#fff':'#A8C8B0')+'">'+l+'</div>';
    }).join('')
    +'</div>';
  h+='<div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px;line-height:1.5">'
    +(invMode==='tanda'
      ?'Escribe cuánto PRODUJISTE de cada insumo en esta tanda. Se suma a lo que quedaba — no tienes que calcular el total tú.'
      :'El número que escribas ES el stock final. Déjalo vacío para volver al control manual, sin rastreo de cantidad.')
    +'</div>';
  h+='<div style="margin-bottom:20px">'+BTN(invMode==='tanda'?'Registrar la tanda //':'Guardar todos los cambios de stock //','saveAllInventoryChanges()',true)+'</div>';
  INV_CATS.forEach(function(cat){
    h+='<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:16px;font-weight:640;color:var(--sw-text,#FFFFFF);margin:18px 0 10px;text-wrap:balance">'+cat.t+'<span class="cut-sep" style="color:'+GOLD+'"> //</span></div>';
    h+=cat.arr.map(function(item){
      var name=item.l+(item.s&&item.s!=='//'?' // '+item.s:'');
      var av=invStock[item.id]!==false;
      var qty=invQty[item.id];
      var tracked=qty!=null;
      var bl=batchLine(item.id);
      return'<div class="inv-row" data-name="'+esc(name.toLowerCase())+'" style="background:'+(av?'var(--sw-card,#2D5246)':'var(--sw-card-danger,#1A2420)')+';border:1px solid '+(av?'var(--sw-border,#3A6B58)':'rgba(255,85,85,.3)')+';border-radius:10px;padding:13px 16px;margin-bottom:8px">'
        +'<div style="display:flex;justify-content:space-between;align-items:center">'
        +'<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:'+(av?'var(--sw-text,#FFFFFF)':'var(--sw-text-muted,#A8C8B0)')+'">'+name+'</div>'
        +'<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+(av?'#25D366':'#ff8888')+';margin-top:2px;letter-spacing:.1em">'+(av?'● Disponible':'● Sin stock')+(tracked?' · '+qty+' unid.':'')+'</div></div>'
        +'<button onclick="toggleStock(\''+item.id+'\',\''+name.replace(/'/g,"\\'")+'\')" style="all:unset;cursor:pointer;background:'+(av?'rgba(255,85,85,.12)':'rgba(37,211,102,.15)')+';border:1px solid '+(av?'rgba(255,85,85,.4)':'rgba(37,211,102,.4)')+';color:'+(av?'#ff8888':'#25D366')+';font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:11px;font-weight:600;letter-spacing:.08em;padding:15px 14px;border-radius:8px;text-align:center;flex-shrink:0">'+(av?'Marcar agotado':'Reactivar')+'</button>'
        +'</div>'
        +'<div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap">'
        // En modo tanda el campo arranca VACÍO y no precargado con el stock actual: si
        // mostrara el número de ahora, escribir encima se leería como "fijar" y sumaría
        // el doble sin que se note.
        +'<input id="qty-'+item.id+'" type="number" min="0" placeholder="'+(invMode==='tanda'?'Producido en esta tanda':'Sin rastreo de cantidad')+'" value="'+(invMode==='tanda'?'':(tracked?qty:''))+'" style="flex:1;min-width:120px;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:9px 12px;color:var(--sw-text,#FFFFFF);font-size:16px;font-family:EB Garamond,serif;font-style:italic">'
        +(invMode==='tanda'?'':'<button onclick="setStock(\''+item.id+'\',\''+name.replace(/'/g,"\\'")+'\')" style="all:unset;cursor:pointer;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:'+GOLD+';font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:11px;font-weight:600;padding:15px 14px;border-radius:8px;flex-shrink:0">Guardar stock</button>')
        +'</div>'
        // Caducidad de tanda (#5). La línea solo aparece si hay una tanda registrada: un
        // insumo que se compra ya listo no tiene fecha de cocción, e inventarle una sería
        // exactamente el dato falso que esta alerta existe para evitar.
        +(bl?'<div style="font-family:EB Garamond,serif;font-size:11px;color:'+bl.c+';margin-top:8px;line-height:1.4">'+esc(bl.t)+'</div>':'')
        +(bl?'<div style="display:flex;gap:8px;margin-top:8px;align-items:center">'
          +'<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);flex-shrink:0">Aguanta</div>'
          +'<input id="vida-'+item.id+'" type="number" min="1" max="90" value="'+(invBatches[item.id]&&invBatches[item.id].shelfLifeDays||invDefaultDays)+'" style="width:64px;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:7px 10px;color:var(--sw-text,#FFFFFF);font-size:16px;font-family:EB Garamond,serif">'
          +'<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);flex-shrink:0">días</div>'
          +'<button onclick="setShelfLife(\''+item.id+'\',\''+name.replace(/'/g,"\\'")+'\')" style="all:unset;cursor:pointer;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:'+GOLD+';font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:11px;font-weight:600;padding:11px 12px;border-radius:8px;flex-shrink:0">Guardar</button>'
          +'</div>':'')
        +'</div>';
    }).join('');
  });
  h+='</div>';
  return h;
}
// Guardado en lote — antes 19+ filas de inventario solo se podían guardar una por una
// (hallazgo de auditoría admin). Lee TODOS los inputs de cantidad antes de mostrar el
// estado "busy" (que reemplaza el DOM y borraría esos mismos inputs si se leyeran
// después), detecta cuáles de verdad cambiaron, y reutiliza admin-inventory-set-stock
// por cada uno — mismo endpoint que ya usaba el guardado fila por fila.
async function saveAllInventoryChanges(){
  if(invMode==='tanda')return registerBatchRestock();
  var jobs: {code:string;name:string;qty:number|null}[]=[];
  INV_CATS.forEach(function(cat){
    cat.arr.forEach(function(item){
      var el=(document.getElementById('qty-'+item.id) as HTMLInputElement | null);
      if(!el)return;
      var raw=el.value.trim();
      var newQty=raw===''?null:parseInt(raw,10);
      var curQty=invQty[item.id]==null?null:invQty[item.id];
      if(newQty!==curQty){
        jobs.push({code:item.id,name:item.l+(item.s&&item.s!=='//'?' // '+item.s:''),qty:newQty});
      }
    });
  });
  if(!jobs.length){showToast('No hay cambios de stock sin guardar.');return;}
  busy=true;busyMsg='Guardando '+jobs.length+' cambio(s) de stock...';render();
  try{
    for(var i=0;i<jobs.length;i++){
      await api('admin-inventory-set-stock',{token:token,code:jobs[i].code,name:jobs[i].name,qty:jobs[i].qty});
      invQty[jobs[i].code]=jobs[i].qty;
      if(jobs[i].qty!=null)invStock[jobs[i].code]=(jobs[i].qty as number)>0;
    }
  }catch(e){
    busy=false;render();
    showToast('Error al guardar: '+e.message);
    return;
  }
  busy=false;render();
  showToast(jobs.length+' producto(s) actualizado(s).');
}
// Registra una tanda: manda solo cuánto se PRODUJO de cada insumo y deja que el servidor
// haga la suma sobre la fila fresca (admin-inventory-restock). Va en UNA sola llamada, a
// diferencia del guardado fila por fila: una tanda es un evento, y si se corta a la mitad
// el dueño no tiene forma de saber qué insumos ya se sumaron y cuáles no — reponerlos
// "por si acaso" duplicaría el stock de los que sí pasaron.
async function registerBatchRestock(){
  var items: {code:string;name:string;add:number}[]=[];
  var invalid=false;
  INV_CATS.forEach(function(cat){
    cat.arr.forEach(function(item){
      var el=(document.getElementById('qty-'+item.id) as HTMLInputElement | null);
      if(!el)return;
      var raw=el.value.trim();
      if(raw==='')return; // insumo que no entró en esta tanda
      var add=parseInt(raw,10);
      if(!isFinite(add)||add<=0){invalid=true;return;}
      items.push({code:item.id,name:item.l+(item.s&&item.s!=='//'?' // '+item.s:''),add:add});
    });
  });
  if(invalid){showToast('Una tanda solo suma: escribe cantidades mayores a 0, o deja vacío lo que no cocinaste.');return;}
  if(!items.length){showToast('Escribe cuánto produjiste de al menos un insumo.');return;}
  if(!(await showConfirm('¿Registrar la tanda? Se sumarán las cantidades de '+items.length+' insumo(s) a lo que ya había en stock.')))return;
  busy=true;busyMsg='Registrando la tanda...';render();
  try{
    var r=await api('admin-inventory-restock',{token:token,items:items});
    // El servidor devuelve el stock resultante de cada insumo — se toma de ahí y no del
    // cálculo local, así lo que muestra la pantalla es lo que de verdad quedó guardado.
    (r.applied||[]).forEach(function(a){invQty[a.code]=a.to;invStock[a.code]=a.to>0;});
  }catch(e){
    busy=false;render();
    showToast('Error al registrar la tanda: '+e.message);
    return;
  }
  busy=false;invMode='fijar';render();
  showToast('Tanda registrada: '+items.length+' insumo(s) repuesto(s).');
}

var _adminList=[];
async function loadAdminMgr(){sndScreen='admin_mgr';busy=true;busyMsg='Cargando...';render();try{var r=await api('admin-accounts-list',{token:token});_adminList=r.accounts;}catch(e){_adminList=[];}busy=false;render();}
async function addAdmin(){
  var ph=(document.getElementById('aa-ph') as HTMLInputElement | null)&&gv('aa-ph').trim();
  var nm=(document.getElementById('aa-nm') as HTMLInputElement | null)&&gv('aa-nm').trim();
  if(!ph||!nm){showToast('Ingresa nombre y teléfono.');return;}
  // Misma fricción que quitarle el acceso a un admin (reingresar el PIN, no solo el
  // token de sesión) — agregar acceso administrativo total es igual de sensible que
  // quitarlo, antes solo esta acción pedía menos confirmación (auditoría de seguridad).
  var pin=await showPrompt('Ingresa tu PIN para confirmar:','','tel');
  if(!pin)return;
  try{
    await api('admin-accounts-add',{token:token,phone:ph,name:nm,pin:pin});
    await loadAdminMgr();
  }catch(e){showToast('Error: '+e.message);}
}
async function delAdmin(ph){
  if(!(await showConfirm('¿Eliminar admin '+ph+'?')))return;
  // Misma fricción que borrar la propia cuenta de cliente (pedir el PIN de nuevo, no
  // solo el token de sesión) — antes esta acción, más irreversible/de mayor impacto
  // operativo, pedía MENOS confirmación que esa (hallazgo de auditoría UX).
  var pin=await showPrompt('Ingresa tu PIN para confirmar:','','tel');
  if(!pin)return;
  try{await api('admin-accounts-delete',{token:token,phone:ph,pin:pin});await loadAdminMgr();}catch(e){showToast('Error: '+e.message);}
}
function sAdminMgr(){
  return H('ADMINISTRADORES',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">'
    +'<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:14px">Cuentas admin // '+_adminList.length+'</div>'
    +_adminList.map(function(a){var sp=a.role==='superadmin';return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:17px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(a.name)+'</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(a.phone)+' · '+(sp?'Superadmin':'admin')+'</div></div>'+(sp?'<span style="font-family:EB Garamond,serif;font-style:italic;font-size:8px;color:'+GOLD+'">Principal</span>':'<button onclick="delAdmin(\''+a.phone+'\')" style="all:unset;cursor:pointer;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:12px;font-weight:600;color:#ff5555">Eliminar</button>')+'</div>';}).join('')
    +'<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>'
    +'<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">Agregar admin //</div>'
    +'<div style="display:flex;flex-direction:column;gap:10px">'
    +INP('aa-nm','Nombre del nuevo admin','text',undefined,'clientes')
    +INP('aa-ph','Teléfono','tel',undefined,'phone')
    +BTN('Agregar //','addAdmin()')
    +'</div></div>';
}

// PRECIOS — edita el catálogo (proteínas, signatures, bebidas/sides, recompensas) sin
// necesitar un redeploy: guarda en la tabla catalog_prices vía admin-catalog-set-price,
// que el resto de la app ya lee en cada acción sensible al precio (ver loadCatalogPrices
// del lado servidor).
var catalogMsg='';
async function loadAdminCatalog(){
  sndScreen='admin_catalog';busy=true;busyMsg='Cargando precios...';render();
  await loadCatalogBackground();
  busy=false;render();
}
function cpNumField(id,label,val){
  return'<div style="flex:1;min-width:64px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:8px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">'+label+'</div><input id="'+id+'" type="number" step="0.1" value="'+val+'" style="background:var(--sw-bg,#1E3932);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:8px;padding:8px 10px;color:var(--sw-text,#FFFFFF);width:100%;font-size:16px;box-sizing:border-box"></div>';
}
function cpRow(label,inputsHtml,fn){
  return'<div class="cp-row" data-name="'+esc(label.toLowerCase())+'" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:10px">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:10px">'+esc(label)+'</div>'
    // flex-wrap: en pantallas angostas (~320px) los inputs numéricos + el botón GUARDAR
    // no caben en una sola fila — antes se comprimían/cortaban en vez de acomodarse en
    // una segunda línea (hallazgo de auditoría UX, especialmente visible en la fila de
    // 3 campos de PROTEÍNAS).
    +'<div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">'+inputsHtml
    +'<button onclick="'+fn+'" style="all:unset;cursor:pointer;background:'+GOLD+';color:#241a08;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:9px 14px;border-radius:8px;white-space:nowrap">Guardar</button></div></div>';
}
// Filtra filas de catálogo/inventario por nombre sin volver a renderizar toda la
// pantalla (render() reconstruye el innerHTML completo y le haría perder el foco/cursor
// al propio campo de búsqueda en cada tecla) — solo alterna display en el DOM ya pintado.
function filterAdminRows(inputId,rowClass){
  var q=(gv(inputId)||'').toLowerCase().trim();
  var rows=document.getElementsByClassName(rowClass);
  for(var i=0;i<rows.length;i++){
    var name=(rows[i].getAttribute('data-name')||'');
    (rows[i] as HTMLElement).style.display=(!q||name.indexOf(q)>=0)?'':'none';
  }
}
function SEARCHBOX(id,ph,rowClass){
  return'<div style="position:relative;margin-bottom:12px">'
    +'<div style="position:absolute;left:15px;top:50%;transform:translateY(-50%);pointer-events:none;opacity:.55">'+icon('buscar',16,'#A8C8B0')+'</div>'
    +'<input id="'+id+'" type="text" placeholder="'+ph+'" oninput="filterAdminRows(\''+id+'\',\''+rowClass+'\')" style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:12px 16px 12px 44px;color:var(--sw-text,#FFFFFF);width:100%;font-size:16px;box-sizing:border-box">'
    +'</div>';
}
function sAdminCatalog(){
  return H('PRECIOS // CATÁLOGO',"loadAdmin()")
    +'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">'
    +(catalogMsg?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:#25D366;margin-bottom:14px;text-align:center">'+esc(catalogMsg)+'</div>':'')
    +SEARCHBOX('cat-search','Buscar producto o recompensa','cp-row')
    +'<div style="margin-bottom:16px">'+BTN('Guardar todos los cambios //','saveAllCatalogChanges()',true)+'</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">Proteínas //</div>'
    +PROTS.map(function(p){
      return cpRow(p.l+' '+p.s,
        cpNumField('cp-protein-'+p.id+'-p15','15CM',p.p15)+cpNumField('cp-protein-'+p.id+'-p30','30CM',p.p30)+cpNumField('cp-protein-'+p.id+'-pDbl','Doble 15CM +',p.pDbl)+cpNumField('cp-protein-'+p.id+'-pDbl30','Doble 30CM +',p.pDbl30),
        "saveCatalogPrice('protein','"+p.id+"')");
    }).join('')
    +'<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">Signatures //</div>'
    +SIGS.map(function(s){
      return cpRow(s.n+' '+s.s,
        cpNumField('cp-sig-'+s.id+'-p15','15CM',s.p15)+cpNumField('cp-sig-'+s.id+'-p30','30CM',s.p30),
        "saveCatalogPrice('sig','"+s.id+"')");
    }).join('')
    +'<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">Bebidas y sides //</div>'
    +SIDES.map(function(d){
      return cpRow(d.l+' '+d.s,
        cpNumField('cp-side-'+d.id+'-price','Precio',d.p),
        "saveCatalogPrice('side','"+d.id+"')");
    }).join('')
    +'<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">Recompensas // puntos</div>'
    +RWDS.map(function(rw){
      return cpRow(rw.n+' '+rw.s,
        cpNumField('cp-reward-'+rw.id+'-pts','Puntos',rw.pts),
        "saveCatalogPrice('reward','"+rw.id+"')");
    }).join('')
    +'</div>';
}
function catalogFormValues(category,code){
  if(category==='protein')return{p15:Number(gv('cp-protein-'+code+'-p15')),p30:Number(gv('cp-protein-'+code+'-p30')),pDbl:Number(gv('cp-protein-'+code+'-pDbl')),pDbl30:Number(gv('cp-protein-'+code+'-pDbl30'))};
  if(category==='sig')return{p15:Number(gv('cp-sig-'+code+'-p15')),p30:Number(gv('cp-sig-'+code+'-p30'))};
  if(category==='side')return{price:Number(gv('cp-side-'+code+'-price'))};
  if(category==='reward')return{pts:Number(gv('cp-reward-'+code+'-pts'))};
  return null;
}
async function saveCatalogPrice(category,code){
  var values=catalogFormValues(category,code);
  if(!values)return;
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
  setTimeout(function(){catalogMsg='';if(sndScreen==='admin_catalog')render();},2500);
}
// Guardado en lote — antes cada fila (22+ entre proteínas/signatures/bebidas/
// recompensas) solo se podía guardar una por una, sin indicador de qué quedó sin
// guardar (hallazgo de auditoría admin). Reutiliza el mismo action de a una fila
// (admin-catalog-set-price) por cada cambio real detectado, sin tocar el backend —
// lee TODOS los inputs antes de mostrar el estado "busy" (que reemplaza el DOM y
// borraría esos mismos inputs si se leyeran después).
async function saveAllCatalogChanges(){
  var jobs: {category:string;code:string;values:any}[]=[];
  PROTS.forEach(function(p){
    var v=catalogFormValues('protein',p.id);
    if(v.p15!==p.p15||v.p30!==p.p30||v.pDbl!==p.pDbl||v.pDbl30!==p.pDbl30)jobs.push({category:'protein',code:p.id,values:v});
  });
  SIGS.forEach(function(s){
    var v=catalogFormValues('sig',s.id);
    if(v.p15!==s.p15||v.p30!==s.p30)jobs.push({category:'sig',code:s.id,values:v});
  });
  SIDES.forEach(function(d){
    var v=catalogFormValues('side',d.id);
    if(v.price!==d.p)jobs.push({category:'side',code:d.id,values:v});
  });
  RWDS.forEach(function(rw){
    var v=catalogFormValues('reward',rw.id);
    if(v.pts!==rw.pts)jobs.push({category:'reward',code:rw.id,values:v});
  });
  if(!jobs.length){catalogMsg='No hay cambios sin guardar.';render();setTimeout(function(){catalogMsg='';if(sndScreen==='admin_catalog')render();},2000);return;}
  busy=true;busyMsg='Guardando '+jobs.length+' cambio(s)...';render();
  try{
    for(var i=0;i<jobs.length;i++){
      await api('admin-catalog-set-price',{token:token,code:jobs[i].code,category:jobs[i].category,values:jobs[i].values});
    }
    await loadCatalogBackground();
    catalogMsg=jobs.length+' precio(s) actualizado(s).';
  }catch(e){
    busy=false;render();
    showToast('Error: '+e.message);
    return;
  }
  busy=false;render();
  setTimeout(function(){catalogMsg='';if(sndScreen==='admin_catalog')render();},2500);
}

// MENÚ SECRETO — rotación mensual (decisión del dueño, 2026-08-10, reemplaza "The Vault"
// fijo). Publicar un cambio INSERTA una fila nueva en `secret_signature` (nunca
// actualiza in-place, ver actAdminSecretSignatureSet) — la fila de mayor id es la
// vigente, así queda historial de sándwiches secretos anteriores gratis.
var ssName='',ssBase='',ssProt='',ssTops:string[]=[],ssSauces:string[]=[],ssVaultIds:string[]=[],ssP15='',ssP30='',ssMinOrders='',ssImagePath='',ssMsg='',ssHistory:any[]=[];
async function loadSecretSignatureAdmin(){
  sndScreen='admin_secret';busy=true;busyMsg='Cargando menú secreto...';render();
  try{
    var r=await api('admin-secret-signature-get',{token:token});
    var cur=r.current;
    ssName=cur?cur.name:'';ssBase=cur?cur.base:'B03';ssProt=cur?cur.protein_id:'';
    ssTops=cur&&Array.isArray(cur.tops)?cur.tops.slice():[];
    ssSauces=cur&&Array.isArray(cur.sauces)?cur.sauces.slice():[];
    ssVaultIds=cur&&Array.isArray(cur.vault_only_ids)?cur.vault_only_ids.slice():[];
    ssP15=cur?String(cur.price_15):'';ssP30=cur?String(cur.price_30):'';
    ssMinOrders=cur?String(cur.min_orders):'5';ssImagePath=cur&&cur.image_path?cur.image_path:'';
    ssHistory=r.history||[];
  }catch(e){showToast('Error: '+e.message);}
  busy=false;render();
}
function ssToggle(arr,id,max){
  var i=arr.indexOf(id);
  if(i>=0){arr.splice(i,1);var vi=ssVaultIds.indexOf(id);if(vi>=0)ssVaultIds.splice(vi,1);}
  else if(arr.length<max)arr.push(id);
  render();
}
function ssToggleVault(id){
  var i=ssVaultIds.indexOf(id);
  if(i>=0)ssVaultIds.splice(i,1);else ssVaultIds.push(id);
  render();
}
function ssChip(sel,label,onclick){
  return'<div onclick="'+onclick+'" style="background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'var(--sw-border,#3A6B58)')+';border-radius:8px;padding:9px 12px;cursor:pointer;font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text,#FFFFFF);display:inline-block;margin:0 6px 6px 0">'+label+'</div>';
}
function sAdminSecretSignature(){
  var chosenIds=[ssProt,...ssTops,...ssSauces].filter(function(id){return!!id;});
  var vaultChips=chosenIds.map(function(id){
    var item:any=PROTS.find(function(x){return x.id===id;})||TOPS.find(function(x){return x.id===id;})||SAUCES.find(function(x){return x.id===id;});
    if(!item)return'';
    var sel=ssVaultIds.indexOf(id)>=0;
    return ssChip(sel,(sel?'✓ ':'')+item.l+' '+item.s,"ssToggleVault('"+id+"')");
  }).join('');
  return H('MENÚ SECRETO',"loadAdmin()")
    +'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">'
    +(ssMsg?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:#25D366;margin-bottom:14px;text-align:center">'+esc(ssMsg)+'</div>':'')
    +'<p style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.6;margin-bottom:16px">El sándwich secreto rota — publica una receta nueva cuando quieras, sin depender de una sesión de código. El nombre y el precio son lo único que el cliente ve; la composición se revela recién cuando lo pide.</p>'
    +'<div style="margin-bottom:14px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Nombre del mes</div>'+INP('ss-name','ej. Reserva de Agosto','text',ssName)+'</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Pan //</div>'
    +'<div style="margin-bottom:14px">'+BASES.map(function(b){return ssChip(ssBase===b.id,b.l+' '+b.s,"ssBase='"+b.id+"';render()");}).join('')+'</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Proteína //</div>'
    +'<div style="margin-bottom:14px">'+PROTS.filter(function(p){return!p.sigOnly;}).map(function(p){return ssChip(ssProt===p.id,p.l+' '+p.s,"ssProt='"+p.id+"';var vi=ssVaultIds.indexOf('"+p.id+"');render()");}).join('')+'</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Toppings // hasta 3 ('+ssTops.length+'/3)</div>'
    +'<div style="margin-bottom:14px">'+TOPS.filter(function(t){return!t.sigOnly;}).map(function(t){return ssChip(ssTops.indexOf(t.id)>=0,t.l+' '+t.s,"ssToggle(ssTops,'"+t.id+"',3)");}).join('')+'</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Salsas // hasta 2 ('+ssSauces.length+'/2)</div>'
    +'<div style="margin-bottom:14px">'+SAUCES.filter(function(s){return!s.sigOnly;}).map(function(s){return ssChip(ssSauces.indexOf(s.id)>=0,s.l+' '+s.s,"ssToggle(ssSauces,'"+s.id+"',2)");}).join('')+'</div>'
    +(chosenIds.length?'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:6px">Exclusivos de este mes //</div>'
      +'<p style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:8px">Marca los ingredientes que NO deben poder armarse por Arma el tuyo este mes — es lo que hace que valga la pena desbloquear el secreto.</p>'
      +'<div style="margin-bottom:14px">'+vaultChips+'</div>':'')
    +'<div style="display:flex;gap:8px;margin-bottom:14px">'+cpNumField('ss-p15','15CM',ssP15)+cpNumField('ss-p30','30CM',ssP30)+cpNumField('ss-min','Pedidos mín.',ssMinOrders)+'</div>'
    +'<div style="margin-bottom:20px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Foto (ruta/URL, opcional)</div>'+INP('ss-img','ej. img/sig05.jpg',undefined,ssImagePath)+'</div>'
    +BTN('Publicar sándwich del mes //','saveSecretSignature()')
    +(ssHistory.length?'<div style="height:1px;background:var(--sw-bg,#1E3932);margin:22px 0 14px"></div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Historial //</div>'
      +ssHistory.map(function(h){return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:10px 14px;margin-bottom:8px;font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">'+esc(h.name)+' · '+new Date(h.created_at).toLocaleDateString('es-PE')+'</div>';}).join(''):'')
    +'</div>';
}
// ── Signatures editables desde el panel (2026-08-27) ──────────────────────────────────
//
// Contraparte de escritura de `catalog_items`. Antes, cambiar el nombre, el pitch, el
// badge, la composición o el precio de un Signature exigía editar SIGS/SIG_DATA/SIG_LABEL/
// SIG_IMG + catalog_prices y desplegar; retirar uno costaba una sesión de código entera.
//
// Se calca deliberadamente el panel del menú secreto de arriba (mismos chips, mismos
// helpers, mismo flujo publicar→recargar): quien ya sabe usar aquel sabe usar este, y
// cualquier arreglo futuro en esos helpers vale para los dos.
var ciCur:any={},ciSel='',ciName='',ciSub='',ciBadge='',ciPitch='',ciBase='',ciProt='',
    ciTops:string[]=[],ciSauces:string[]=[],ciCheese='',ciP15='',ciP30='',ciImg='',
    ciActive=true,ciMsg='',ciHistory:any[]=[];
async function loadCatalogItemsAdmin(){
  sndScreen='admin_items';busy=true;busyMsg='Cargando Signatures...';render();
  try{
    var r=await api('admin-catalog-items-get',{token:token});
    ciCur=r.current||{};ciHistory=r.history||[];
    // Se abre el primero por defecto para que la pantalla no arranque vacía.
    if(!ciSel||!ciCur[ciSel]){var ks=Object.keys(ciCur).sort();ciSel=ks.length?ks[0]:'';}
    ciLoadForm();
  }catch(e){showToast('Error: '+e.message);}
  busy=false;render();
}
function ciLoadForm(){
  var c=ciCur[ciSel];
  ciName=c?c.name:'';ciSub=c?(c.subtitle||'Signature'):'Signature';
  ciBadge=c&&c.badge?c.badge:'';ciPitch=c&&c.pitch?c.pitch:'';
  ciBase=c?c.base:'B01';ciProt=c?c.protein_id:'';
  ciTops=c&&Array.isArray(c.tops)?c.tops.slice():[];
  ciSauces=c&&Array.isArray(c.sauces)?c.sauces.slice():[];
  ciCheese=c&&c.fixed_cheese?c.fixed_cheese:'';
  ciP15=c?String(c.price_15):'';ciP30=c?String(c.price_30):'';
  ciImg=c&&c.image_path?c.image_path:'';
  ciActive=c?c.active!==false:true;
}
function ciPick(id){
  // Se guarda lo escrito en los campos de texto antes de cambiar de ítem: sin esto,
  // tocar otro Signature perdía en silencio lo que estabas editando.
  ciSyncInputs();ciSel=id;ciLoadForm();render();
}
function ciSyncInputs(){
  if(document.getElementById('ci-name')){
    ciName=gv('ci-name');ciSub=gv('ci-sub');ciBadge=gv('ci-badge');ciPitch=gv('ci-pitch');
    ciImg=gv('ci-img');ciP15=gv('ci-p15');ciP30=gv('ci-p30');
  }
}
function ciToggle(arr,id,max){
  var i=arr.indexOf(id);
  if(i>=0)arr.splice(i,1);else if(arr.length<max)arr.push(id);
  ciSyncInputs();render();
}
function sAdminCatalogItems(){
  var ids=Object.keys(ciCur).sort();
  return H('SIGNATURES',"loadAdmin()")
    +'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">'
    +(ciMsg?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:#25D366;margin-bottom:14px;text-align:center">'+esc(ciMsg)+'</div>':'')
    +'<p style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.6;margin-bottom:16px">Cambia nombre, texto, receta o precio de cualquier Signature sin tocar código. Cada publicación queda guardada: puedes ver qué se cobraba antes. Para sacar uno de la carta, apaga <b>Activo</b> — su receta se conserva.</p>'
    +'<div style="margin-bottom:16px">'+ids.map(function(id){
        var c=ciCur[id];
        return ssChip(ciSel===id,(c.active===false?'○ ':'')+esc(c.name),"ciPick('"+id+"')");
      }).join('')+'</div>'
    +(ciSel?'<div style="height:1px;background:var(--sw-bg,#1E3932);margin:0 0 16px"></div>'
      +'<div style="margin-bottom:12px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Nombre</div>'+INP('ci-name','ej. The Original','text',ciName)+'</div>'
      +'<div style="display:flex;gap:8px;margin-bottom:12px">'
        +'<div style="flex:1"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Subtítulo</div>'+INP('ci-sub','Signature','text',ciSub)+'</div>'
        +'<div style="flex:1"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Badge (puede ir vacío)</div>'+INP('ci-badge','ej. Clásico','text',ciBadge)+'</div>'
      +'</div>'
      +'<div style="margin-bottom:14px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Pitch (lo que lee el cliente)</div>'+INP('ci-pitch','Describe el sándwich','text',ciPitch)+'</div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Pan //</div>'
      +'<div style="margin-bottom:14px">'+BASES.map(function(bs){return ssChip(ciBase===bs.id,bs.l+' '+bs.s,"ciSyncInputs();ciBase='"+bs.id+"';render()");}).join('')+'</div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Proteína //</div>'
      +'<div style="margin-bottom:14px">'+PROTS.filter(function(pr){return!pr.vaultOnly;}).map(function(pr){return ssChip(ciProt===pr.id,pr.l+' '+pr.s,"ciSyncInputs();ciProt='"+pr.id+"';render()");}).join('')+'</div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Toppings // hasta 3 ('+ciTops.length+'/3)</div>'
      +'<div style="margin-bottom:14px">'+TOPS.filter(function(t){return!t.vaultOnly;}).map(function(t){return ssChip(ciTops.indexOf(t.id)>=0,t.l+' '+t.s,"ciToggle(ciTops,'"+t.id+"',3)");}).join('')+'</div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Salsas // hasta 2 ('+ciSauces.length+'/2)</div>'
      +'<div style="margin-bottom:14px">'+SAUCES.filter(function(sc){return!sc.vaultOnly;}).map(function(sc){return ssChip(ciSauces.indexOf(sc.id)>=0,sc.l+' '+sc.s,"ciToggle(ciSauces,'"+sc.id+"',2)");}).join('')+'</div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Queso fijo // opcional</div>'
      +'<div style="margin-bottom:14px">'+ssChip(!ciCheese,'Sin queso fijo',"ciSyncInputs();ciCheese='';render()")
        +CHEESE.map(function(ch){return ssChip(ciCheese===ch.id,ch.l+' '+ch.s,"ciSyncInputs();ciCheese='"+ch.id+"';render()");}).join('')+'</div>'
      +'<div style="display:flex;gap:8px;margin-bottom:14px">'+cpNumField('ci-p15','15CM',ciP15)+cpNumField('ci-p30','30CM',ciP30)+'</div>'
      +'<div style="margin-bottom:14px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Foto (ruta/URL)</div>'+INP('ci-img','ej. img/sig01.jpg',undefined,ciImg)+'</div>'
      +'<div style="margin-bottom:20px">'+ssChip(ciActive,(ciActive?'✓ ':'')+'Activo en la carta',"ciSyncInputs();ciActive=!ciActive;render()")+'</div>'
      +BTN('Publicar cambios //','saveCatalogItem()')
      :'<p style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">No hay Signatures publicados todavía.</p>')
    +(ciHistory.length?'<div style="height:1px;background:var(--sw-bg,#1E3932);margin:22px 0 14px"></div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Historial //</div>'
      +ciHistory.map(function(h){return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:10px 14px;margin-bottom:8px;font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">'+esc(h.item_id)+' · '+esc(h.name)+' · '+SOLES_TXT+h.price_15+'/'+SOLES_TXT+h.price_30+' · '+new Date(h.created_at).toLocaleDateString('es-PE')+'</div>';}).join(''):'')
    +'</div>';
}
async function saveCatalogItem(){
  ciSyncInputs();
  if(!ciSel)return;
  busy=true;busyMsg='Publicando...';render();
  try{
    await api('admin-catalog-items-set',{token:token,itemId:ciSel,name:ciName.trim(),subtitle:ciSub.trim(),
      badge:ciBadge.trim(),pitch:ciPitch.trim(),base:ciBase,proteinId:ciProt,tops:ciTops,sauces:ciSauces,
      fixedCheese:ciCheese||null,price15:Number(ciP15),price30:Number(ciP30),
      imagePath:ciImg.trim()||null,active:ciActive});
    ciMsg='Publicado. Los clientes lo ven en su próxima carga.';
    // Se recarga el catálogo del propio panel para que lo que se ve en pantalla sea lo que
    // quedó guardado, no lo que se escribió — si el servidor normalizó algo, se nota acá.
    await loadCatalogItemsAdmin();
    await loadCatalogBackground();
  }catch(e){showToast('Error: '+e.message);}
  busy=false;render();
  setTimeout(function(){ciMsg='';if(sndScreen==='admin_items')render();},2500);
}
async function saveSecretSignature(){
  ssName=gv('ss-name');ssImagePath=gv('ss-img');ssP15=gv('ss-p15');ssP30=gv('ss-p30');ssMinOrders=gv('ss-min');
  if(!ssName.trim()){showToast('Falta el nombre del sándwich del mes.');return;}
  if(!ssBase||!ssProt){showToast('Elige pan y proteína.');return;}
  // Al menos una salsa (no "un topping O una salsa"): el cargo de SALSA EXTRA duplica la
  // última salsa de la receta, así que una receta sin salsas dejaba ese extra sin ningún
  // ingrediente real detrás. El servidor ya lo rechaza; esto lo avisa antes de enviar.
  if(!ssSauces.length){showToast('Elige al menos una salsa para la receta.');return;}
  if(!ssTops.length){showToast('Elige al menos un topping.');return;}
  var p15=Number(ssP15),p30=Number(ssP30),minOrders=Number(ssMinOrders);
  if(!(p15>0)||!(p30>0)){showToast('Precio inválido.');return;}
  if(!Number.isInteger(minOrders)||minOrders<0){showToast('Pedidos mínimos inválido.');return;}
  busy=true;busyMsg='Publicando...';render();
  try{
    var pubRes=await api('admin-secret-signature-set',{token:token,name:ssName.trim(),base:ssBase,proteinId:ssProt,tops:ssTops,sauces:ssSauces,vaultOnlyIds:ssVaultIds,price15:p15,price30:p30,minOrders:minOrders,imagePath:ssImagePath.trim()||null});
    await loadCatalogBackground();
    // El servidor avisa por push a quienes ya desbloquearon el menú secreto y devuelve a
    // cuántos les llegó. Se muestra el número porque el dueño no tiene otra forma de saber
    // si el aviso salió: es 0 tanto si nadie calificaba como si se corrigió una publicación
    // reciente (hay una ventana de 12 h para no mandar dos push por arreglar una tilde).
    var av=pubRes&&pubRes.announced;
    ssMsg='Sándwich del mes publicado.'+(av?' Avisamos a '+av+' cliente(s) que ya lo desbloquearon.':' (Sin aviso push esta vez.)');
  }catch(e){
    busy=false;render();
    showToast('Error: '+e.message);
    return;
  }
  await loadSecretSignatureAdmin();
  setTimeout(function(){ssMsg='';if(sndScreen==='admin_secret')render();},2500);
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
  var h=H('FICHA DE CLIENTE',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+=INP('cd-phone','Teléfono del cliente','tel',custDetailPhone,'phone');
  h+='<div style="margin-top:10px">'+BTN('Buscar //','loadCustomerDetail()')+'</div>';
  if(custDetailErr)h+='<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:#ff8888;margin-top:12px;text-align:center">'+esc(custDetailErr)+'</div>';
  if(custDetail){
    var c=custDetail.customer;
    h+='<div style="height:1px;background:var(--sw-bg,#1E3932);margin:20px 0"></div>'
      +'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:12px;padding:16px;margin-bottom:16px">'
      +'<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text,#FFFFFF);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(c.name)+'</div>'
      +'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">'+esc(c.phone)+(c.email?' · '+esc(c.email):'')+'</div>'
      +'<div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap">'
      +'<div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:8px;color:'+GOLD+'">Puntos</div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text,#FFFFFF)">'+(c.points||0)+'</div></div>'
      +'<div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:8px;color:'+GOLD+'">Pedidos</div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text,#FFFFFF)">'+(c.total_orders||0)+'</div></div>'
      +'<div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:8px;color:'+GOLD+'">Crédito</div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text,#FFFFFF)">'+SOLES+(c.credit_balance||0)+'</div></div>'
      +'</div></div>';
    h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Pedidos recientes // '+custDetail.orders.length+'</div>';
    h+=custDetail.orders.length?custDetail.orders.map(function(o){return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:10px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">'+esc(o.ref)+'</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0)">'+esc(o.date)+' · '+SOLES+pz(o.total)+'</div></div>'+stBadge(o.status)+'</div>';}).join(''):'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">Sin pedidos //</div>';
    h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:18px 0 10px">Historial de puntos // '+custDetail.transactions.length+'</div>';
    h+=custDetail.transactions.length?custDetail.transactions.map(function(t){var pos=t.points>=0;return'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1E3932"><span style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">'+esc(t.description)+'</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:12px;color:'+(pos?'#25D366':'#ff8888')+'">'+(pos?'+':'')+t.points+'</span></div>';}).join(''):'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">Sin movimientos //</div>';
    if(custDetail.ratings&&custDetail.ratings.length){
      h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:18px 0 10px">Calificaciones // '+custDetail.ratings.length+'</div>';
      h+=custDetail.ratings.map(function(r){return'<div style="padding:8px 0;border-bottom:1px solid #1E3932"><span style="color:#F5C518">'+'★'.repeat(r.stars)+'</span>'+(r.comment?'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(r.comment)+'</div>':'')+'</div>';}).join('');
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
  var h=H('BUSCAR PEDIDOS',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+=INP('so-q','Ref, teléfono o nombre','text',searchQ,'buscar');
  h+='<div style="margin:10px 0"><select id="so-status" style="width:100%;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px;color:var(--sw-text,#FFFFFF);font-size:14px">'
    +'<option value="">Todos los estados</option>'
    +Object.keys(STATUSES).map(function(s){return'<option value="'+s+'" '+(searchStatus===s?'selected':'')+'>'+s+'</option>';}).join('')
    +'</select></div>';
  h+=BTN('Buscar //','doSearchOrders()');
  if(searchResults!==null){
    h+='<div style="height:1px;background:var(--sw-bg,#1E3932);margin:20px 0"></div>';
    h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Resultados // '+searchResults.length+(searchTruncated?' (recortado)':'')+'</div>';
    h+=searchResults.length?searchResults.map(function(o,i){
      return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px;margin-bottom:10px">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(o.customer_name||'Invitado')+'</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0)">'+esc(o.ref)+' · '+esc(o.date)+' · '+SOLES+pz(o.total)+'</div></div>'+stBadge(o.status)+'</div>'
        +((o.contact_phone||o.customer_phone)?'<button onclick="waSearchResult('+i+')" style="all:unset;cursor:pointer;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:11px;color:'+GOLD+'">'+iconTxt('chat','WhatsApp',GOLD)+'</button>':'')
        +'</div>';
    }).join(''):'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);text-align:center;padding:20px 0">Sin resultados //</div>';
  }
  h+='</div>';
  return h;
}

// AUDITORÍA (#96) — visor de admin_action_log (antes solo consultable desde el
// dashboard de Supabase).
async function loadAuditLog(){
  sndScreen='admin_audit';busy=true;busyMsg='Cargando auditoría...';render();
  try{var r=await api('admin-audit-log',{token:token,limit:50});auditLog=r.log;}
  catch(e){auditLog=[];}
  busy=false;render();
}
// Antes mostraba el string técnico crudo (ej. "update-status", "catalog-set-price")
// directo de la columna `action` — rompía con el resto de la app, que consistentemente
// usa copy en español llano (hallazgo de auditoría de diseño admin, MEDIO).
var AUDIT_ACTION_LABEL={
  'manual-points':'Puntos manuales otorgados','manual-credit':'Ajuste manual de crédito',
  'accounts-add':'Cuenta admin agregada','accounts-delete':'Cuenta admin eliminada',
  'export-orders':'Exportó pedidos (CSV)','export-customers':'Exportó clientes (CSV)',
  'catalog-set-price':'Precio de catálogo editado','respond-complaint':'Reclamo respondido',
  'set-store-hours':'Horario de atención editado','set-business-launched':'Bandera "negocio abierto" cambiada','update-status':'Estado de pedido actualizado',
  'bulk-update-status':'Estados actualizados en lote','confirm-payment':'Pago manual confirmado',
  'cancel-order':'Pedido cancelado','self-cancel-needs-refund':'Cliente canceló pedido pagado',
  'inventory-toggle':'Disponibilidad de producto cambiada','inventory-set-stock':'Stock de producto editado',
  'promo-create':'Código promocional creado','promo-toggle':'Código promocional activado/desactivado',
  'calendar-create':'Entrada de calendario creada','calendar-update':'Entrada de calendario editada','calendar-delete':'Entrada de calendario eliminada',
  'calendar-image-upload':'Foto subida a una entrada del calendario','raw-video-upload':'Clip crudo subido a la cola semanal','social-publish':'Publicación enviada a Meta (Instagram/Facebook)',
};
function sAdminAudit(){
  var h=H('REGISTRO DE AUDITORÍA',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  var log=auditLog||[];
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:14px">Últimas '+log.length+' acciones //</div>';
  h+=log.length?log.map(function(l){
    return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:12px 14px;margin-bottom:8px">'
      +'<div style="display:flex;justify-content:space-between"><span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(AUDIT_ACTION_LABEL[l.action]||l.action)+'</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0)">'+esc(l.actor_phone)+'</span></div>'
      +(l.target?'<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px;word-break:break-all">'+esc(String(l.target))+'</div>':'')
      +'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">'+esc(new Date(l.created_at).toLocaleString('es-PE'))+'</div>'
      +'</div>';
  }).join(''):'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);text-align:center;padding:20px 0">Sin registros aún //</div>';
  h+='</div>';
  return h;
}

// HORARIO DE ATENCIÓN (#97) — ver comentario en env.ts/loadStoreHours: antes el
// horario era un array hardcodeado que exigía redesplegar la función para cambiarlo.
var DOW_NAMES=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
async function loadStoreHoursForm(){
  sndScreen='admin_hours';busy=true;busyMsg='Cargando horario...';render();
  try{var r=await api('get-store-hours',{});storeHoursForm=r.hours;businessLaunched=r.businessLaunched===true;}
  catch(e){storeHoursForm=DOW_NAMES.map(function(){return{open:11,close:22,closed:false};});}
  busy=false;render();
}
var _launchToggleInProgress=false;
// Pausa temporal: cierra la tienda un rato y se reabre SOLA. Antes esto obligaba a editar
// el horario semanal y acordarse de revertirlo — si se olvidaba, se perdía ese mismo día
// de la semana siguiente entero.
async function pauseStore(minutes){
  if(minutes>0&&!(await showConfirm('¿Pausar los pedidos por '+(minutes>=60?(minutes/60)+' hora(s)':minutes+' minutos')+'?\nLa tienda se reabre sola, no tienes que acordarte de nada.')))return;
  try{
    var r=await api('admin-pause-store',{token:token,minutes:minutes});
    storePausedUntil=r.pausedUntil||null;
    storeHoursMsg=minutes>0?'Pausado. Volvemos solos a las '+new Date(r.pausedUntil).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})+'.':'Pedidos reactivados.';
    render();
    setTimeout(function(){storeHoursMsg='';if(sndScreen==='admin_hours')render();},3500);
  }catch(e){showToast(e.message);}
}
async function toggleBusinessLaunched(){
  if(_launchToggleInProgress)return;
  var next=!businessLaunched;
  if(next&&!(await showConfirm('¿Confirmas que SND//WCH ya abrió de verdad?\n\nEsto retira la tarjeta "Avísame cuando abramos" del Home para todos los invitados — solo actívalo el día real de lanzamiento.')))return;
  _launchToggleInProgress=true;render();
  try{
    await api('admin-set-business-launched',{token:token,launched:next});
    businessLaunched=next;
    showToast(next?'¡Listo! El negocio ya figura como abierto.':'Revertido: el negocio figura como aún no abierto.','success');
  }catch(e){showToast('Error: '+e.message);}
  _launchToggleInProgress=false;render();
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
  setTimeout(function(){storeHoursMsg='';if(sndScreen==='admin_hours')render();},2500);
}
function sAdminHours(){
  var h=H('HORARIO DE ATENCIÓN',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  if(storeHoursMsg)h+='<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:#25D366;margin-bottom:14px;text-align:center">'+esc(storeHoursMsg)+'</div>';
  // Bandera de lanzamiento real — controla si la tarjeta "Avísame cuando abramos" sigue
  // apareciendo en el Home de los invitados. Vive aparte del horario semanal porque es
  // un interruptor de una sola vez, no un dato que se edite seguido.
  h+='<div style="background:'+(businessLaunched?'rgba(37,211,102,.1)':'var(--sw-card,#2D5246)')+';border:1px solid '+(businessLaunched?'rgba(37,211,102,.4)':GOLD)+';border-radius:10px;padding:14px 16px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;gap:12px">'
    +'<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+(businessLaunched?'El negocio ya abrió //':'Aún no hemos abierto //')+'</div>'
    +'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+(businessLaunched?'La tarjeta de lista de espera ya no aparece en el Home.':'Actívalo el día real de lanzamiento para retirar la lista de espera.')+'</div></div>'
    +'<button onclick="toggleBusinessLaunched()" style="all:unset;cursor:pointer;flex-shrink:0;background:'+(businessLaunched?'transparent':GOLD)+';border:1px solid '+(businessLaunched?'rgba(255,85,85,.4)':GOLD)+';color:'+(businessLaunched?'#ff8888':'#241a08')+';font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:11px;font-weight:600;letter-spacing:.04em;padding:9px 14px;border-radius:8px;text-align:center">'+(businessLaunched?'Revertir':'Ya abrimos →')+'</button>'
    +'</div>';
  // Pausa temporal — separada del horario semanal a propósito: esto es "hoy no puedo",
  // no "los martes cerramos". Se reanuda sola.
  var pausaActiva=storePausedUntil&&new Date(storePausedUntil).getTime()>Date.now();
  h+='<div style="background:'+(pausaActiva?'rgba(255,170,0,.12)':'var(--sw-card,#2D5246)')+';border:1px solid '+(pausaActiva?'rgba(255,170,0,.5)':'var(--sw-border,#3A6B58)')+';border-radius:10px;padding:14px 16px;margin-bottom:18px">'
    +'<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+(pausaActiva?'Pedidos en pausa //':'Pausa temporal //')+'</div>'
    +'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px;margin-bottom:10px">'
    +(pausaActiva?'Se reactivan solos a las '+new Date(storePausedUntil).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})+'. No tienes que hacer nada.':'Si te quedaste sin insumos o no puedes atender un rato. Se reabre sola.')+'</div>'
    +(pausaActiva
      ? '<button onclick="pauseStore(0)" style="all:unset;cursor:pointer;display:block;width:100%;box-sizing:border-box;background:'+GOLD+';color:#241a08;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:11px;border-radius:8px;text-align:center;min-height:44px">Reactivar ahora</button>'
      : '<div style="display:flex;gap:8px">'+[[30,'30 min'],[60,'1 hora'],[180,'3 horas'],[600,'Resto del día']].map(function(x){
          return'<button onclick="pauseStore('+x[0]+')" style="all:unset;cursor:pointer;flex:1;box-sizing:border-box;background:transparent;border:1px solid var(--sw-border,#3A6B58);color:var(--sw-text-muted,#A8C8B0);font-family:EB Garamond,serif;font-weight:600;font-size:11px;padding:10px 4px;border-radius:8px;text-align:center;min-height:44px">'+x[1]+'</button>';
        }).join('')+'</div>')
    +'</div>';
  var days=storeHoursForm||[];
  h+=DOW_NAMES.map(function(name,i){
    var d=days[i]||{open:11,close:22,closed:false};
    return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:10px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:'+(d.closed?'0':'10px')+'">'
      +'<span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+name+'</span>'
      +'<label style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);display:flex;align-items:center;gap:6px"><input type="checkbox" id="sh-closed-'+i+'" '+(d.closed?'checked':'')+' onchange="toggleClosedDay('+i+')" style="accent-color:'+GOLD+'">Cerrado</label>'
      +'</div>'
      +(d.closed?'':'<div style="display:flex;gap:8px;align-items:center"><input id="sh-open-'+i+'" type="number" min="0" max="24" value="'+(d.open==null?11:d.open)+'" style="flex:1;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:9px 12px;color:var(--sw-text,#FFFFFF);font-family:EB Garamond,serif;font-style:italic;font-size:12px"><span style="color:var(--sw-text-muted,#A8C8B0)">a</span><input id="sh-close-'+i+'" type="number" min="0" max="24" value="'+(d.close==null?22:d.close)+'" style="flex:1;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:9px 12px;color:var(--sw-text,#FFFFFF);font-family:EB Garamond,serif;font-style:italic;font-size:12px"></div>')
      +'</div>';
  }).join('');
  h+=BTN('Guardar horario //','saveStoreHours()');
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
  var h=H('REPORTE POR FECHAS',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+='<div style="display:flex;gap:8px;margin-bottom:10px">'
    +'<input id="rr-from" type="date" value="'+esc(reportFrom)+'" style="flex:1;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px;color:var(--sw-text,#FFFFFF);font-size:16px">'
    +'<input id="rr-to" type="date" value="'+esc(reportTo)+'" style="flex:1;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px;color:var(--sw-text,#FFFFFF);font-size:16px">'
    +'</div>';
  h+=BTN('Generar reporte //','doRangeReport()');
  if(reportErr)h+='<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:#ff8888;margin-top:12px;text-align:center">'+esc(reportErr)+'</div>';
  if(reportData){
    var d=reportData;
    h+='<div style="height:1px;background:var(--sw-bg,#1E3932);margin:20px 0"></div>';
    h+='<div style="display:flex;gap:10px;margin-bottom:16px">'
      +DTILE('Ingresos',SOLES+d.revenue,d.count+' pedidos')
      +DTILE('Ticket prom.',SOLES+d.avgTicket)
      +'</div>';
    if(d.truncated)h+='<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:#ffa500;margin-bottom:12px;display:flex;align-items:center;gap:5px">'+icon('warning',12,'#ffa500')+'<span>Hay más pedidos en este rango de los que se muestran aquí.</span></div>';
    h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Por método de pago //</div>';
    h+=Object.keys(d.byMethod).length?Object.keys(d.byMethod).map(function(m){var v=d.byMethod[m];return DBAR(m.toUpperCase(),v.count,d.count);}).join(''):'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">Sin datos //</div>';
    h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:18px 0 10px">Productos top //</div>';
    h+=d.topProducts.length?d.topProducts.map(function(p){return'<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1E3932"><span style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">'+esc(p.name)+'</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:'+GOLD+'">'+p.count+' · '+SOLES+p.revenue+'</span></div>';}).join(''):'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">Sin datos //</div>';
    h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin:18px 0 10px">Por día //</div>';
    h+=d.byDay.length?d.byDay.map(function(day){return'<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1E3932"><span style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">'+esc(day.date)+'</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:'+GOLD+'">'+day.count+' · '+SOLES+day.revenue+'</span></div>';}).join(''):'';
  }
  h+='</div>';
  return h;
}

// CALIFICACIONES (#99) — antes solo se veían resumidas (promedio + últimos 5 comentarios)
// en el dashboard; esto expone el listado completo con filtros.
async function loadRatingsList(){
  sndScreen='admin_ratings';busy=true;busyMsg='Cargando calificaciones...';render();
  try{var r=await api('admin-ratings-list',{token:token,limit:50,minStars:ratingsMinStars||undefined,onlyWithComments:ratingsOnlyComments,onlyConsented:ratingsOnlyConsented});ratingsList=r.ratings;}
  catch(e){ratingsList=[];}
  busy=false;render();
}
function applyRatingsFilter(){
  var minEl=(document.getElementById('rt-min') as HTMLInputElement | null),cEl=(document.getElementById('rt-comments') as HTMLInputElement | null),tEl=(document.getElementById('rt-consented') as HTMLInputElement | null);
  ratingsMinStars=minEl?Number(minEl.value):0;
  ratingsOnlyComments=cEl?cEl.checked:false;
  ratingsOnlyConsented=tEl?tEl.checked:false;
  loadRatingsList();
}
function sAdminRatings(){
  var h=H('CALIFICACIONES',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+='<div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap">'
    +'<select id="rt-min" onchange="applyRatingsFilter()" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:8px;padding:9px 12px;color:var(--sw-text,#FFFFFF);font-family:EB Garamond,serif;font-style:italic;font-size:11px">'
    +[0,1,2,3,4,5].map(function(n){return'<option value="'+n+'" '+(ratingsMinStars===n?'selected':'')+'>'+(n===0?'Todas':n+'★ o más')+'</option>';}).join('')
    +'</select>'
    +'<label style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);display:flex;align-items:center;gap:6px"><input type="checkbox" id="rt-comments" onchange="applyRatingsFilter()" '+(ratingsOnlyComments?'checked':'')+' style="accent-color:'+GOLD+'">Solo con comentario</label>'
    +'<label style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);display:flex;align-items:center;gap:6px"><input type="checkbox" id="rt-consented" onchange="applyRatingsFilter()" '+(ratingsOnlyConsented?'checked':'')+' style="accent-color:'+GOLD+'">Solo autorizadas como testimonio</label>'
    +'</div>';
  var list=ratingsList||[];
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">'+list.length+' calificaciones //</div>';
  h+=list.length?list.map(function(r){
    return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px;margin-bottom:10px">'
      +'<div style="display:flex;justify-content:space-between"><span style="color:#F5C518;font-size:14px">'+'★'.repeat(r.stars)+'<span style="color:#3A6B58">'+'★'.repeat(5-r.stars)+'</span></span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0)">'+esc(r.order_ref||'')+'</span></div>'
      +(r.comment?'<div style="font-family:EB Garamond,serif;font-size:13px;color:var(--sw-text-body,#F2F0EB);margin-top:6px">'+esc(r.comment)+'</div>':'')
      +(r.testimonial_consent?'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:#25D366;margin-top:6px;display:flex;align-items:center;gap:5px">'+icon('check',11,'#25D366')+'<span>Autorizada como testimonio público</span></div>':'')
      // Antes no mostraba quién dejó la reseña — para agradecer o dar seguimiento el
      // dueño tenía que cruzarla a mano contra BUSCAR PEDIDOS por el ref (hallazgo de
      // auditoría de diseño admin, MEDIO). customer_phone puede venir null si la cuenta
      // ya se borró (anonimización, ver actDeleteAccount) — se omite en ese caso.
      +(r.customer_phone?'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:'+GOLD+';margin-top:6px">'+esc(r.customer_phone)+'</div>':'')
      +'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px">'+esc(new Date(r.created_at).toLocaleDateString('es-PE'))+'</div>'
      +'</div>';
  }).join(''):'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);text-align:center;padding:20px 0">Sin calificaciones //</div>';
  h+='</div>';
  return h;
}

// PREPARACIÓN ANTICIPADA — agrega los ingredientes de todos los pedidos programados de
// las próximas 24h en un solo resumen, para que la cocina prepare antes de que entren
// en cola (antes cada pedido programado se preparaba recién cuando llegaba su hora).
async function loadPrepList(){
  sndScreen='admin_prep';busy=true;busyMsg='Calculando preparación...';render();
  try{prepListData=await api('admin-prep-list',{token:token});}
  catch(e){prepListData=null;}
  busy=false;render();
}
function sAdminPrepList(){
  var h=H('PREPARACIÓN',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  if(!prepListData){
    return h+'<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:#ff8888;letter-spacing:.2em">No se pudo cargar //</div></div>'+BTN('Reintentar //','loadPrepList()')+'</div>';
  }
  var d=prepListData;
  var shortfalls=d.ingredients.filter(function(i){return i.shortfall;});
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.1em;margin-bottom:16px">Próximas '+d.windowHours+'h · '+d.orders.length+' pedido'+(d.orders.length===1?'':'s')+' programado'+(d.orders.length===1?'':'s')+'</div>';
  if(shortfalls.length){
    h+='<div style="background:rgba(255,85,85,.12);border:1px solid rgba(255,85,85,.35);border-radius:10px;padding:14px 16px;margin-bottom:16px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:#ff8888;letter-spacing:.1em;margin-bottom:6px;display:flex;align-items:center;gap:5px">'+icon('warning',12,'#ff8888')+'<span>No va a alcanzar //</span></div>'
      +shortfalls.map(function(i){return'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);margin-bottom:4px">'+esc(i.label)+' — necesitas '+i.qty+(i.stockQty!=null?', tienes '+i.stockQty:', sin stock')+'</div>';}).join('')
      +'</div>';
  }
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Ingredientes a preparar //</div>';
  h+=d.ingredients.length?d.ingredients.map(function(i){
    return'<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border:1px solid '+(i.shortfall?'rgba(255,85,85,.4)':'#3A6B58')+';border-radius:8px;padding:10px 14px;margin-bottom:8px"><span style="font-family:EB Garamond,serif;font-size:13px;color:var(--sw-text-body,#F2F0EB)">'+esc(i.label)+'</span><span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:'+(i.shortfall?'#ff8888':GOLD)+'">×'+i.qty+'</span></div>';
  }).join(''):'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px">Sin pedidos programados en esta ventana.</div>';
  if(d.orders.length){
    h+='<div style="height:1px;background:var(--sw-bg,#1E3932);margin:18px 0"></div>';
    h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Pedidos incluidos //</div>';
    h+=d.orders.map(function(o){
      return'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:6px">'+esc(o.ref)+' · '+esc(o.customerName)+' · '+esc(new Date(o.deliveryTime).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}))+'</div>';
    }).join('');
  }
  h+=BTN('Actualizar //','loadPrepList()',true);
  h+='</div>';
  return h;
}

// MARKETING — contenido listo para copiar y pegar, uno distinto cada semana (ver
// MARKETING_CONTENT en el backend). No publica nada solo: ninguna red social está
// conectada a este sistema, así que el dueño sigue siendo quien pega y publica —
// esto solo le ahorra la parte de redactar cada semana.
async function loadMarketingContent(){
  sndScreen='admin_marketing';busy=true;busyMsg='Cargando contenido...';render();
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
  return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:16px;margin-bottom:14px">'
    +'<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:16px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:12px">'+esc(pkg.theme)+'</div>'
    +'<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:4px">WhatsApp / historia //</div>'
    +'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-bottom:6px">'+esc(pkg.whatsapp)+'</div>'
    +'<button onclick="copyMktText(\''+week+'\',\'whatsapp\')" style="all:unset;cursor:pointer;background:'+GOLD+';color:#0d0d0d;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:10px;font-weight:600;padding:7px 12px;border-radius:6px;margin-bottom:14px;display:inline-block">Copiar</button>'
    +'<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:4px">Caption (Instagram/Facebook) //</div>'
    +'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-bottom:6px">'+esc(pkg.caption)+'</div>'
    +'<button onclick="copyMktText(\''+week+'\',\'caption\')" style="all:unset;cursor:pointer;background:'+GOLD+';color:#0d0d0d;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:10px;font-weight:600;padding:7px 12px;border-radius:6px;margin-bottom:14px;display:inline-block">Copiar</button>'
    +'<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:4px">Idea de foto //</div>'
    +'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5">'+esc(pkg.photoIdea)+'</div>'
    +'</div>';
}
function sAdminMarketing(){
  var h=H('MARKETING',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  var d=marketingContentData;
  if(!d)return h+'<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:#ff8888;letter-spacing:.2em">No se pudo cargar //</div></div>'+BTN('Reintentar //','loadMarketingContent()')+'</div>';
  h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px;line-height:1.5">Contenido listo para copiar y pegar — cambia cada semana. Nada se publica solo, tú decides cuándo y dónde.</div>';
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Esta semana //</div>';
  h+=mktBlock(d.current,'current');
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.2em;margin-bottom:8px">Próxima semana //</div>';
  h+=mktBlock(d.next,'next');
  h+='</div>';
  return h;
}

async function loadPromoCodes(){
  sndScreen='admin_promo';busy=true;busyMsg='Cargando códigos...';render();
  try{var res=await api('admin-promo-list',{token:token});promoCodesData=res.promoCodes;}
  catch(e){promoCodesData=null;}
  busy=false;render();
}
function setPcType(t){pcType=t;render();}
async function createPromoCode(){
  var code=gv('pc-code').trim();
  var value=gv('pc-value').trim();
  var maxUses=gv('pc-maxuses').trim();
  var minOrder=gv('pc-minorder').trim();
  var validUntil=gv('pc-validuntil').trim();
  var campaignTag=gv('pc-tag').trim();
  if(!code||!value){pcMsg='Completa código y valor.';render();return;}
  pcMsg='Creando...';render();
  try{
    await api('admin-promo-create',{token:token,code:code,discountType:pcType,value:Number(value),maxUses:maxUses||null,minOrderTotal:minOrder||null,validUntil:validUntil?new Date(validUntil).toISOString():null,campaignTag:campaignTag||null});
    pcMsg='';pcCode='';pcValue='';pcMaxUses='';pcMinOrder='';pcValidUntil='';pcCampaignTag='';
    await loadPromoCodes();
  }catch(e){
    pcMsg=e.message||'No se pudo crear el código.';
    render();
  }
}
async function togglePromoCode(id,active){
  try{await api('admin-promo-toggle',{token:token,id:id,active:active});await loadPromoCodes();}
  catch(e){showToast(e.message||'No se pudo actualizar.');}
}
function sAdminPromo(){
  var h=H('CÓDIGOS PROMO',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px;line-height:1.5">El descuento se aplica solo sobre el total de comida (nunca sobre delivery), mismo criterio que las recompensas — y solo funciona con tarjeta o crédito, no con Yape/Plin hasta confirmar el pago.</div>';
  h+='<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:16px;margin-bottom:20px">';
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Nuevo código //</div>';
  h+='<div style="display:flex;flex-direction:column;gap:8px">'
    +INP('pc-code','Código // ej. LANZAMIENTO10','text',pcCode)
    +'<div style="display:flex;gap:8px"><div onclick="setPcType(\'percent\')" style="flex:1;text-align:center;background:'+(pcType==='percent'?'var(--sw-card2,#1A3028)':'transparent')+';border:1px solid '+(pcType==='percent'?GOLD:'#3A6B58')+';border-radius:8px;padding:10px;cursor:pointer;font-family:EB Garamond,serif;font-size:12px;color:'+(pcType==='percent'?GOLD:'#A8C8B0')+'">% Porcentaje</div><div onclick="setPcType(\'fixed\')" style="flex:1;text-align:center;background:'+(pcType==='fixed'?'var(--sw-card2,#1A3028)':'transparent')+';border:1px solid '+(pcType==='fixed'?GOLD:'#3A6B58')+';border-radius:8px;padding:10px;cursor:pointer;font-family:EB Garamond,serif;font-size:12px;color:'+(pcType==='fixed'?GOLD:'#A8C8B0')+'">S/ Monto fijo</div></div>'
    +INP('pc-value',pcType==='percent'?'Valor // ej. 10 (%)':'Valor // ej. 5 (soles)','number',pcValue)
    +INP('pc-maxuses','Usos máximos // opcional','number',pcMaxUses)
    +INP('pc-minorder','Pedido mínimo // opcional, en soles','number',pcMinOrder)
    +INP('pc-validuntil','Válido hasta // opcional','date',pcValidUntil)
    +INP('pc-tag','Etiqueta de campaña // opcional, para tu referencia','text',pcCampaignTag)
    +'</div>';
  h+=(pcMsg?'<div style="font-family:EB Garamond,serif;font-size:11px;color:#ff8888;margin-top:8px">'+esc(pcMsg)+'</div>':'');
  h+='<div style="margin-top:12px">'+BTN('Crear código //','createPromoCode()')+'</div>';
  h+='</div>';
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Códigos existentes //</div>';
  if(!promoCodesData||!promoCodesData.length){
    h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">Sin códigos creados todavía.</div>';
  }else{
    h+=promoCodesData.map(function(p){
      var valueLabel=p.discount_type==='percent'?p.value+'%':SOLES_TXT+p.value;
      var usesLabel=(p.uses_count||0)+(p.max_uses!=null?'/'+p.max_uses:'')+' usos';
      return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px 14px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div style="min-width:0"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(p.code)+'</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(valueLabel+' · '+usesLabel+(p.campaign_tag?' · '+p.campaign_tag:''))+'</div></div><div onclick="togglePromoCode(\''+p.id+'\','+(!p.active)+')" style="flex-shrink:0;cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:'+(p.active?'#25D366':'#ff8888')+'">'+(p.active?'Activo':'Inactivo')+'</div></div></div>';
    }).join('');
  }
  h+='</div>';
  return h;
}

async function loadCampaignPerformance(){
  sndScreen='admin_campaign_perf';busy=true;busyMsg='Calculando rendimiento...';render();
  try{campaignPerfData=await api('admin-campaign-performance',{token:token});}
  catch(e){campaignPerfData=null;}
  busy=false;render();
}
function sAdminCampaignPerf(){
  var h=H('RENDIMIENTO CAMPAÑAS',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  if(!campaignPerfData)return h+'<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:#ff8888;letter-spacing:.2em">No se pudo cargar //</div></div>'+BTN('Reintentar //','loadCampaignPerformance()')+'</div>';
  var d=campaignPerfData;
  h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px;line-height:1.5">Últimos '+d.lookbackDays+' días · convertido = pagó dentro de '+d.windowDays+' días de recibir el aviso.</div>';
  if(!d.campaigns.length){
    h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">Sin envíos registrados en este período.</div>';
  }else{
    h+=d.campaigns.map(function(c){
      return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px 14px;margin-bottom:8px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:4px">'+esc(c.campaignType)+'</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">'+c.touches+' envíos · '+c.customersReached+' clientes · <span style="color:'+GOLD+'">'+c.conversionRate+'% convirtió</span> · '+SOLES_TXT+c.revenue+' en ingresos</div></div>';
    }).join('');
  }
  h+='</div>';
  return h;
}

// Calendario de contenido real (marketing_calendar) — reemplaza depender solo del
// "Contenido semanal" rotativo (sAdminMarketing, arriba) para saber qué publicar hoy: acá
// el dueño planea fechas concretas, por canal, y lleva registro de qué ya publicó de
// verdad. Nada de esto publica solo — sigue siendo copiar/pegar a mano (mismo límite del
// resto del sistema de marketing: no hay conector real a Instagram/TikTok/Meta).
var CAL_CHANNELS=[['instagram','Instagram'],['tiktok','TikTok'],['whatsapp','WhatsApp'],['facebook','Facebook'],['google_business','Google Business'],['otro','Otro']];
var CAL_CHANNEL_LABEL={};CAL_CHANNELS.forEach(function(c){CAL_CHANNEL_LABEL[c[0]]=c[1];});
// 'publishing' es transitorio (segundos, hasta ~2min si es video) — lo pone
// claimCalendarEntry() en el servidor mientras el cron o "Publicar ahora" están a mitad
// de publicar, para que el otro camino no la duplique (auditoría de código, ALTO).
var CAL_STATUS_LABEL={draft:'Borrador',scheduled:'Programado',publishing:'Publicando...',posted:'Publicado'};
var CAL_STATUS_COLOR={draft:'#A8C8B0',scheduled:GOLD,publishing:GOLD,posted:'#25D366'};
// #50 — Deja escritas las próximas semanas del calendario en un toque.
//
// Hasta acá el cron ya las va dejando solo cada semana; este botón existe para el arranque
// (la tabla vacía el día 1) y para cuando el dueño quiere ver el mes entero de una. El
// servidor NUNCA pisa una fecha que ya tiene entrada, así que tocarlo dos veces no duplica
// nada y no borra lo que él haya planeado a mano.
async function generateCalendar(){
  busy=true;busyMsg='Generando borradores...';render();
  try{
    var res=await api('admin-calendar-generate',{token:token,weeks:4});
    await loadCalendar();
    showToast(res.creados?('Listo: '+res.creados+' borrador'+(res.creados===1?'':'es')+' nuevo'+(res.creados===1?'':'s')+'.'):'Las próximas 4 semanas ya estaban planeadas.');
  }catch(e){busy=false;render();showToast("No se pudo generar: "+e.message);}
}
async function loadCalendar(){
  sndScreen='admin_calendar';busy=true;busyMsg='Cargando calendario...';render();
  try{var res=await api('admin-calendar-list',{token:token});calendarData=res.entries;}
  catch(e){calendarData=null;}
  try{var ru=await api('admin-list-raw-uploads',{token:token});rawUploads=ru.uploads;}
  catch(e){rawUploads=null;}
  busy=false;render();
}
// 20MB de tope (mismo límite que el backend, ver actAdminUploadRawVideo en social.ts) —
// a diferencia de handleCalendarImageFile, no hay compresión posible del lado del
// cliente para video, así que el clip ya debe llegar razonablemente liviano; si pesa de
// más, el mensaje de error pide comprimirlo antes en vez de fallar en silencio.
function handleRawVideoFile(ev){
  var input=ev&&ev.target;
  var file=input&&input.files&&input.files[0];
  if(input)input.value='';
  if(!file)return;
  if(!/^video\/(mp4|quicktime)$/.test(file.type)){showToast('Selecciona un video MP4 o MOV.');return;}
  if(file.size>20*1024*1024){showToast('El video pesa más de 20MB — comprímelo antes de subirlo.');return;}
  rawVideoUploading=true;render();
  var reader=new FileReader();
  reader.onload=async function(){
    var base64=String(reader.result||'').split(',')[1]||'';
    try{
      await api('admin-upload-raw-video',{token:token,videoBase64:base64,mime:file.type});
      showToast('Clip subido — se procesa en la próxima sesión semanal.','success');
      await loadCalendar();
    }catch(e){showToast(e.message||'No se pudo subir el video.');}
    rawVideoUploading=false;render();
  };
  reader.onerror=function(){rawVideoUploading=false;showToast('No se pudo leer el archivo.');render();};
  reader.readAsDataURL(file);
}
function setCalChannel(c){calChannel=c;render();}
async function createCalendarEntry(){
  var date=gv('cal-date').trim();
  var title=gv('cal-title').trim();
  var caption=gv('cal-caption').trim();
  var whatsapp=gv('cal-whatsapp').trim();
  var photo=gv('cal-photo').trim();
  var tag=gv('cal-tag').trim();
  if(!date||!title){calMsg='Completa fecha y tema.';render();return;}
  calMsg='Creando...';render();
  try{
    await api('admin-calendar-create',{token:token,scheduledDate:date,channel:calChannel,title:title,captionText:caption||null,whatsappText:whatsapp||null,photoIdea:photo||null,campaignTag:tag||null});
    calMsg='';calDate='';calTitle='';calCaption='';calWhatsapp='';calPhoto='';calTag='';
    await loadCalendar();
  }catch(e){calMsg=e.message||'No se pudo crear.';render();}
}
async function setCalendarStatus(id,status){
  try{await api('admin-calendar-update',{token:token,id:id,status:status});await loadCalendar();}
  catch(e){showToast(e.message||'No se pudo actualizar.');}
}
async function deleteCalendarEntry(id){
  if(!(await showConfirm('¿Eliminar esta entrada del calendario?')))return;
  try{await api('admin-calendar-delete',{token:token,id:id});await loadCalendar();}
  catch(e){showToast(e.message||'No se pudo eliminar.');}
}
// Publicación real en Instagram/Facebook (Meta Graph API) — ver actAdminPublishSocial en
// social.ts. La foto se comprime en el propio celular antes de subirla, mismo criterio
// que handleReceiptFile (canvas, máx. 1080px de lado, JPEG) — la API de Instagram exige
// una URL pública de imagen ya alojada, así que primero sube a Storage y recién después
// se puede publicar.
function handleCalendarImageFile(ev,id){
  var input=ev&&ev.target;
  var file=input&&input.files&&input.files[0];
  if(input)input.value='';
  if(!file)return;
  if(!/^image\//.test(file.type)){showToast('Selecciona una imagen.');return;}
  calImageUploadingId=id;render();
  var reader=new FileReader();
  reader.onload=function(){
    var img=new Image();
    img.onload=function(){
      var maxDim=1080;
      var scale=Math.min(1,maxDim/Math.max(img.width,img.height));
      var w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
      var canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      var ctx=canvas.getContext('2d');
      if(!ctx){calImageUploadingId=null;showToast('No se pudo procesar la imagen.');render();return;}
      ctx.drawImage(img,0,0,w,h);
      var base64=canvas.toDataURL('image/jpeg',.82).split(',')[1]||'';
      uploadCalendarImageBase64(id,base64);
    };
    img.onerror=function(){calImageUploadingId=null;showToast('No se pudo leer la imagen.');render();};
    img.src=String(reader.result||'');
  };
  reader.onerror=function(){calImageUploadingId=null;showToast('No se pudo leer el archivo.');render();};
  reader.readAsDataURL(file);
}
async function uploadCalendarImageBase64(id,base64){
  try{
    await api('admin-calendar-upload-image',{token:token,id:id,imageBase64:base64,mime:'image/jpeg'});
    calImageUploadingId=null;
    await loadCalendar();
  }catch(e){calImageUploadingId=null;showToast(e.message||'No se pudo subir la imagen.');render();}
}
async function publishCalendarEntry(id){
  if(!(await showConfirm('¿Publicar esta entrada ahora en Instagram/Facebook? Esto sale de verdad a la cuenta real — no hay forma de deshacerlo desde acá.')))return;
  calPublishingId=id;render();
  try{
    await api('admin-publish-social',{token:token,id:id});
    calPublishingId=null;
    showToast('Publicado en Meta.','success');
    await loadCalendar();
  }catch(e){calPublishingId=null;showToast(e.message||'No se pudo publicar.');render();}
}
function sAdminCalendar(){
  var h=H('CALENDARIO DE CONTENIDO',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px;line-height:1.5">Planea fechas y canales reales. Instagram y Facebook sí se pueden publicar de verdad desde acá (sube una foto/video y toca "Publicar ahora", o déjalo programado y sale solo el día que le toca) — el resto de canales sigue siendo copiar el texto a mano.</div>';
  // El botón va ARRIBA del formulario manual a propósito: crear una entrada a mano es el
  // camino largo, y hasta #50 era el único que había.
  h+='<div style="margin-bottom:20px"><button onclick="generateCalendar()" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#241a08;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.06em;padding:12px;border-radius:8px;text-align:center">Generar las próximas 4 semanas //</button><div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px;line-height:1.5">Deja los borradores escritos (caption, texto de WhatsApp e idea de foto) en las fechas que todavía estén libres. No toca ninguna entrada que ya exista.</div></div>';
  h+='<div style="background:var(--sw-card,#2D5246);border:1px solid '+GOLD+';border-radius:10px;padding:16px;margin-bottom:20px">';
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:6px">Clips de la semana //</div>';
  // Copy corregida (auditoría UX, P2): antes prometía "sin que tengas que volver a tocar
  // nada" — pero el procesamiento real depende de una sesión de Claude que se dispara a
  // mano (no hay cron para esto, ver actAdminUploadRawVideo en social.ts), así que decir
  // "automático" era engañoso. Ahora nombra la cadencia real (semanal) sin prometer más
  // de lo que existe hoy.
  h+='<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:10px;line-height:1.5">Sube aquí el video crudo (sin editar) de lo que grabaste — se procesa en la próxima sesión semanal de contenido (la disparas tú por chat cuando tengas clips listos), que lo recorta al formato correcto, escribe el caption y lo agenda.</div>';
  h+='<label style="cursor:pointer;display:inline-block;background:'+(rawVideoUploading?'#1E3932':GOLD)+';color:'+(rawVideoUploading?'#4A7A68':'#241a08')+';font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:10px 16px;border-radius:8px">'
    +(rawVideoUploading?'Subiendo...':'+ Subir clip (MP4/MOV) →')
    +'<input type="file" accept="video/mp4,video/quicktime" onchange="handleRawVideoFile(event)" style="display:none" '+(rawVideoUploading?'disabled':'')+'>'
    +'</label>';
  if(rawUploads&&rawUploads.length){
    // Muestra la fecha del clip más antiguo pendiente — sin esto no había forma de
    // distinguir "recién subido, normal" de "lleva 3 semanas esperando, algo se
    // atascó" (auditoría UX, P2).
    var oldestUpload=rawUploads.reduce(function(a,b){return new Date(a.uploaded_at)<new Date(b.uploaded_at)?a:b;});
    var oldestDate=new Date(oldestUpload.uploaded_at).toLocaleDateString('es-PE',{day:'2-digit',month:'short'});
    h+='<div style="margin-top:10px;font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">'+rawUploads.length+' clip'+(rawUploads.length===1?'':'s')+' esperando — el más antiguo desde el '+oldestDate+'.</div>';
  }
  h+='</div>';
  h+='<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:16px;margin-bottom:20px">';
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Nueva entrada //</div>';
  h+='<div style="display:flex;flex-direction:column;gap:8px">'
    +INP('cal-date','Fecha','date',calDate)
    +INP('cal-title','Tema // ej. Sándwich secreto del mes','text',calTitle)
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'+CAL_CHANNELS.map(function(c){return'<div onclick="setCalChannel(\''+c[0]+'\')" style="text-align:center;background:'+(calChannel===c[0]?'var(--sw-card2,#1A3028)':'transparent')+';border:1px solid '+(calChannel===c[0]?GOLD:'#3A6B58')+';border-radius:8px;padding:8px;cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:'+(calChannel===c[0]?GOLD:'#A8C8B0')+'">'+c[1]+'</div>';}).join('')+'</div>'
    +INP('cal-caption','Texto para el post // opcional','text',calCaption)
    +INP('cal-whatsapp','Texto para difusión WhatsApp // opcional','text',calWhatsapp)
    +INP('cal-photo','Idea de foto // opcional','text',calPhoto)
    +INP('cal-tag','Etiqueta de campaña // opcional','text',calTag)
    +'</div>';
  h+=(calMsg?'<div style="font-family:EB Garamond,serif;font-size:11px;color:#ff8888;margin-top:8px">'+esc(calMsg)+'</div>':'');
  h+='<div style="margin-top:12px">'+BTN('Agregar al calendario //','createCalendarEntry()')+'</div>';
  h+='</div>';
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Entradas //</div>';
  if(!calendarData||!calendarData.length){
    h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">Sin entradas planeadas todavía.</div>';
  }else{
    h+=calendarData.map(function(e){
      var next=e.status==='draft'?'scheduled':(e.status==='scheduled'?'posted':null);
      var nextLabel=e.status==='draft'?'Programar':(e.status==='scheduled'?'Marcar publicado':null);
      var texts=[e.caption_text?'Post: '+e.caption_text:'',e.whatsapp_text?'WhatsApp: '+e.whatsapp_text:'',e.photo_idea?'Foto: '+e.photo_idea:''].filter(Boolean);
      // Publicar de verdad (Meta Graph API) solo tiene sentido para instagram/facebook, y
      // solo una vez que la entrada tiene una foto real subida — el resto de canales
      // (whatsapp/google_business/otro) siguen siendo copiar/pegar a mano, igual que
      // siempre.
      var canAutoPublish=(e.channel==='instagram'||e.channel==='facebook');
      var uploadingThis=calImageUploadingId===e.id;
      var publishingThis=calPublishingId===e.id;
      // media_type='video' llega solo de la sesión de procesamiento semanal (nunca de
      // este panel a mano) — acá solo se muestra un indicador, sin input para subirlo,
      // porque el clip crudo se sube aparte en "Clips de la semana //" arriba.
      var isVideoEntry=e.media_type==='video';
      var hasMedia=isVideoEntry?!!e.video_url:!!e.image_url;
      var photoBlock=canAutoPublish?(
        '<div style="margin-top:10px;display:flex;align-items:center;gap:10px">'
        +(isVideoEntry
          ?(e.video_url?'<div style="width:44px;height:44px;border-radius:6px;flex-shrink:0;border:1px solid '+GOLD+';display:flex;align-items:center;justify-content:center;font-family:EB Garamond,serif;font-size:8px;color:'+GOLD+'">VIDEO</div>':'')
          :(e.image_url?'<img src="'+esc(e.image_url)+'" alt="Vista previa de la publicación programada" style="width:44px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0;border:1px solid var(--sw-border-soft,#1c1c1c)">':''))
        +(isVideoEntry?'':
          '<label style="cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:'+GOLD+'">'
          +(uploadingThis?'Subiendo...':(e.image_url?'Cambiar foto':'Subir foto'))
          +'<input type="file" accept="image/*" onchange="handleCalendarImageFile(event,\''+e.id+'\')" style="display:none" '+(uploadingThis?'disabled':'')+'>'
          +'</label>')
        +(hasMedia&&e.status!=='posted'&&e.status!=='publishing'?'<span onclick="'+(publishingThis?'':'publishCalendarEntry(\''+e.id+'\')')+'" style="cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:#25D366">'+(publishingThis?'Publicando...':'Publicar ahora →')+'</span>':'')
        +(e.status==='publishing'?'<span style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:'+GOLD+'">Publicando ahora mismo (cron o admin) — espera un momento</span>':'')
        +(e.status==='scheduled'&&hasMedia?'<span style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">Programado — sale solo</span>':'')
        +(e.status==='posted'&&e.published_ref?'<span style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:#25D366">✓ Publicado en Meta</span>':'')
        +'</div>'
      ):'';
      return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px 14px;margin-bottom:8px">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">'
        +'<div style="min-width:0"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(e.title)+'</div>'
        +'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(e.scheduled_date+' · '+(CAL_CHANNEL_LABEL[e.channel]||e.channel)+(e.campaign_tag?' · '+e.campaign_tag:''))+'</div></div>'
        +'<div style="flex-shrink:0;text-align:right"><span style="font-family:EB Garamond,serif;font-size:11px;color:'+CAL_STATUS_COLOR[e.status]+'">'+CAL_STATUS_LABEL[e.status]+'</span></div>'
        +'</div>'
        +(texts.length?'<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:8px;line-height:1.5;white-space:pre-wrap">'+esc(texts.join(' · '))+'</div>':'')
        +photoBlock
        +'<div style="display:flex;gap:14px;margin-top:10px">'
        +(next?'<span onclick="setCalendarStatus(\''+e.id+'\',\''+next+'\')" style="cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:'+GOLD+'">'+nextLabel+'</span>':'')
        +'<span onclick="deleteCalendarEntry(\''+e.id+'\')" style="cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:#ff8888">Eliminar</span>'
        +'</div></div>';
    }).join('');
  }
  h+='</div>';
  return h;
}

// Lista de espera pre-lanzamiento (waitlist_signups) — ver actWaitlistJoin (público, sin
// sesión) para el lado del cliente. El negocio aún no abre, así que hoy esta es la única
// forma de captación real que existe (checklist de lanzamiento, semana 5-6).
async function loadWaitlist(){
  sndScreen='admin_waitlist';busy=true;busyMsg='Cargando lista de espera...';render();
  try{var res=await api('admin-waitlist-list',{token:token});waitlistData=res.waitlist;}
  catch(e){waitlistData=null;}
  busy=false;render();
}
function sAdminWaitlist(){
  var h=H('LISTA DE ESPERA',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px;line-height:1.5">Gente que quiere que le avisemos apenas abramos — captada desde la app sin necesitar cuenta.</div>';
  if(waitlistData&&waitlistData.length){
    h+='<div style="margin-bottom:16px">'+BTN('Exportar lista (CSV) //','exportCsv(\'admin-waitlist-list\',\'lista-espera\')',true)+'</div>';
  }
  if(!waitlistData||!waitlistData.length){
    h+='<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">Todavía nadie se anotó.</div>';
  }else{
    h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">'+waitlistData.length+' anotados //</div>';
    h+=waitlistData.map(function(w){
      return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px 14px;margin-bottom:8px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(w.name||w.phone)+'</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(w.phone+(w.source?' · '+w.source:''))+'</div></div>';
    }).join('');
  }
  h+='</div>';
  return h;
}

// FRANJAS HORARIAS — no hay turnos de cocina distintos (una sola persona atiende), así
// que esto no mide personal: agrupa pedidos por hora del día para ver si hay una franja
// con más cancelaciones o entregas más lentas que el resto.
async function loadTimeWindowReport(){
  sndScreen='admin_time_report';busy=true;busyMsg='Calculando franjas horarias...';render();
  try{timeReportData=await api('admin-time-window-report',{token:token});}
  catch(e){timeReportData=null;}
  busy=false;render();
}
function sAdminTimeReport(){
  var h=H('FRANJAS HORARIAS',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  if(!timeReportData){
    return h+'<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:#ff8888;letter-spacing:.2em">No se pudo cargar //</div></div>'+BTN('Reintentar //','loadTimeWindowReport()')+'</div>';
  }
  var d=timeReportData;
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.1em;margin-bottom:16px">Últimos '+d.windowDays+' días · ordenado por % de cancelación</div>';
  h+=d.hours.length?d.hours.map(function(hr){
    var urgent=hr.cancelRatePct>=20;
    return'<div style="background:var(--sw-card,#2D5246);border:1px solid '+(urgent?'rgba(255,85,85,.4)':'#3A6B58')+';border-radius:10px;padding:12px 14px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+String(hr.hour).padStart(2,'0')+':00–'+String((hr.hour+1)%24).padStart(2,'0')+':00</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:13px;color:'+(urgent?'#ff8888':GOLD)+'">'+hr.cancelRatePct+'% cancelado</span></div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">'+hr.total+' pedido'+(hr.total===1?'':'s')+' · '+hr.cancelled+' cancelado'+(hr.cancelled===1?'':'s')+(hr.avgDeliveryMin!=null?' · entrega prom. '+hr.avgDeliveryMin+' min':'')+'</div></div>';
  }).join(''):'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px">Sin pedidos en este período.</div>';
  h+=BTN('Actualizar //','loadTimeWindowReport()',true);
  h+='</div>';
  return h;
}

// DIRECCIONES CON ENTREGAS FALLIDAS REPETIDAS — si una dirección acumula 2+
// cancelaciones vale la pena revisarla antes del próximo pedido a ese mismo lugar.
async function loadProblemAddresses(){
  sndScreen='admin_problem_addresses';busy=true;busyMsg='Buscando direcciones...';render();
  try{problemAddressesData=await api('admin-problem-addresses',{token:token});}
  catch(e){problemAddressesData=null;}
  busy=false;render();
}
function sAdminProblemAddresses(){
  var h=H('DIRECCIONES',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  if(!problemAddressesData){
    return h+'<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:#ff8888;letter-spacing:.2em">No se pudo cargar //</div></div>'+BTN('Reintentar //','loadProblemAddresses()')+'</div>';
  }
  var addrs=problemAddressesData.addresses||[];
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.1em;margin-bottom:16px">Direcciones con 2+ cancelaciones</div>';
  h+=addrs.length?addrs.map(function(a){
    return'<div style="background:var(--sw-card,#2D5246);border:1px solid rgba(255,85,85,.3);border-radius:10px;padding:14px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:flex-start"><span style="font-family:EB Garamond,serif;font-size:13px;color:var(--sw-text-body,#F2F0EB);flex:1">'+esc(a.address)+'</span><span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:#ff8888;flex-shrink:0;margin-left:10px">'+a.cancelCount+'</span></div>'
      +(a.reasons&&a.reasons.length?'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px">'+a.reasons.map(function(r){return esc(r);}).join(' · ')+'</div>':'')
      +'</div>';
  }).join(''):'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px">Sin direcciones con cancelaciones repetidas.</div>';
  h+=BTN('Actualizar //','loadProblemAddresses()',true);
  h+='</div>';
  return h;
}

// RECLAMACIONES — el negocio tiene 15 días HÁBILES para responder cada reclamo/queja
// (Ley 31435 + D.S. 101-2022-PCM; antes eran 30 calendario y el texto lo decía mal —
// ver COMPLAINT_DEADLINE_BUSINESS_DAYS en supabase/functions/api/actions/complaints.ts)
// (obligación legal, no solo buena práctica); esta pantalla es donde el operador ve la
// cola pendiente y deja constancia de la respuesta.
async function loadAdminComplaints(){
  sndScreen='admin_complaints';busy=true;busyMsg='Cargando reclamaciones...';render();
  try{var r=await api('admin-list-complaints',{token:token,status:cmplFilterStatus||undefined});adminComplaints=r.complaints;}
  catch(e){adminComplaints=[];}
  busy=false;render();
}
function setComplaintsFilter(v){cmplFilterStatus=v;loadAdminComplaints();}
function sAdminComplaints(){
  var h=H('RECLAMACIONES',"loadAdmin()")+'<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
  h+='<select onchange="setComplaintsFilter(this.value)" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:8px;padding:9px 12px;color:var(--sw-text,#FFFFFF);font-family:EB Garamond,serif;font-style:italic;font-size:11px;margin-bottom:14px">'
    +[['','Todos'],['pendiente','Pendientes'],['atendido','Atendidos']].map(function(x){return'<option value="'+x[0]+'" '+(cmplFilterStatus===x[0]?'selected':'')+'>'+x[1]+'</option>';}).join('')
    +'</select>';
  // Ordenado por antigüedad ascendente (el pendiente más viejo primero) — antes quedaba
  // en el orden que devolviera la API, sin ninguna prioridad visual hacia el que está más
  // cerca de vencer el plazo legal de respuesta (el cron alert-complaint-deadlines sí lo
  // rastrea aparte, pero acá el operador no tenía ninguna señal al mirar la lista) —
  // hallazgo de auditoría operativa, BAJO.
  var list=(adminComplaints||[]).slice().sort(function(a,b){return new Date(a.created_at).getTime()-new Date(b.created_at).getTime();});
  h+='<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">'+list.length+' reclamaciones //</div>';
  h+=list.length?list.map(function(c){
    var pending=c.status==='pendiente';
    var openId=cmplRespondingId===c.id;
    return'<div style="background:var(--sw-card,#2D5246);border:1px solid '+(pending?'rgba(255,165,0,.35)':'#3A6B58')+';border-radius:10px;padding:14px;margin-bottom:10px">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div>'
      +'<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(c.claim_code)+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+(c.kind==='queja'?'Queja':'Reclamo')+'</div>'
      +'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(c.consumer_name)+' · '+esc(c.consumer_phone)+' · '+esc(c.consumer_email)+'</div>'
      +'</div><span style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:'+(pending?'#ffa500':'#25D366')+';flex-shrink:0;display:inline-flex;align-items:center;gap:4px">'+(pending?icon('horario',11,'#ffa500')+'<span>Pendiente</span>':'✓ Atendido')+'</span></div>'
      +'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);margin-top:8px;line-height:1.5"><b>Detalle:</b> '+esc(c.detail)+'</div>'
      +'<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px;line-height:1.5"><b>Pide:</b> '+esc(c.consumer_request)+'</div>'
      +(c.order_ref?'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px">Pedido: '+esc(c.order_ref)+'</div>':'')
      +'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px">'+esc(new Date(c.created_at).toLocaleDateString('es-PE'))+'</div>'
      +(c.provider_response?'<div style="background:var(--sw-card2,#1A3028);border-radius:8px;padding:10px 12px;margin-top:10px;font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)"><b style="color:'+GOLD+'">Respuesta:</b> '+esc(c.provider_response)+'</div>'
        :(openId
          ?'<div style="margin-top:10px"><textarea id="cq-resp-'+c.id+'" placeholder="Escribe tu respuesta al consumidor" style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:10px 12px;color:var(--sw-text,#FFFFFF);width:100%;font-size:12px;font-family:EB Garamond,serif;min-height:70px;box-sizing:border-box;margin-bottom:8px"></textarea><button onclick="doRespondComplaint(\''+c.id+'\')" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#241a08;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:12px;font-weight:600;letter-spacing:.06em;padding:10px 0;border-radius:8px;text-align:center">Guardar respuesta //</button></div>'
          :'<button onclick="cmplRespondingId=\''+c.id+'\';render()" style="all:unset;cursor:pointer;display:block;width:100%;text-align:center;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:'+GOLD+';font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:12px;font-weight:600;letter-spacing:.06em;padding:9px 0;border-radius:8px;margin-top:10px">Responder //</button>'))
      +'</div>';
  }).join(''):'<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);text-align:center;padding:20px 0">Sin reclamaciones //</div>';
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
  var pinBox=recNewPin?'<div style="background:var(--sw-card2,#1A3028);border:2px solid '+GOLD+';border-radius:12px;padding:20px;margin-bottom:16px;text-align:center"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">TU NUEVO PIN //</div><div onclick="togglePinReveal()" style="cursor:pointer;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:36px;font-weight:640;color:'+GOLD+(recPinRevealed?'':';filter:blur(9px);user-select:none')+'">'+recNewPin+'</div><div onclick="togglePinReveal()" style="cursor:pointer;font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.1em;margin-top:6px;display:flex;align-items:center;justify-content:center;gap:5px">'+icon(recPinRevealed?'lock':'camera',11,GOLD)+(recPinRevealed?'OCULTAR':'TOCA PARA VER')+'</div><div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:8px">Guárdalo — úsalo para ingresar con tu teléfono. No dejes esta pantalla abierta en un dispositivo compartido.</div></div>'
    :(recEmailMasked?'<div style="background:var(--sw-card2,#1A3028);border:2px solid '+GOLD+';border-radius:12px;padding:20px;margin-bottom:16px;text-align:center"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">✓ CORREO ENVIADO //</div><div style="font-family:EB Garamond,serif;font-size:13px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">Te mandamos tu PIN nuevo a<br><b style="color:'+GOLD+'">'+esc(recEmailMasked)+'</b></div></div>':'');
  return H('RECUPERAR CUENTA',"sndScreen='p_auth';render()")
    +'<div style="flex:1;padding:24px 20px 40px" class="fi">'
    +'<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:var(--sw-text-body,#F2F0EB);margin-bottom:6px">RECUPERAR PIN //</div>'
    +'<div style="font-family:EB Garamond,serif;font-size:13px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:24px;line-height:1.5">Verifica tu identidad con tu teléfono, DNI y fecha de nacimiento. Si tienes correo registrado, te mandamos el PIN nuevo ahí; si no, te lo mostramos aquí mismo.</div>'
    +pinBox
    // Antes el formulario (teléfono/DNI/fecha) y el botón "Recuperar mi PIN //" seguían
    // visibles sin cambio tras generar el PIN — un segundo tap invalidaba en silencio el
    // que ya se había mostrado, sin ningún CTA claro para seguir a Ingresar (hallazgo de
    // auditoría UX, ALTO). Ahora, con un PIN/correo ya generado, el formulario se oculta y
    // se reemplaza por un solo botón directo a Ingresar.
    +((recNewPin||recEmailMasked)
      ?BTN('Ir a ingresar //',"atab='login';sndScreen='p_auth';render()")
      :'<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">'
        +INP('rec-phone','Teléfono // 9XXXXXXXX','tel',recPhone,'phone')
        +INP('rec-dni','DNI // Tu número de 8 dígitos','text',recDni,'card')
        +INP('rec-bday','Fecha de nacimiento // DD/MM/AAAA','text',recBday,'calendar')
        +'</div>'
        +'<div id="rec-msg" style="font-family:EB Garamond,serif;font-size:12px;color:#ff5555;min-height:16px;margin-bottom:12px;text-align:center"></div>'
        +BTN('Recuperar mi PIN //','doRecover()'))
    +'</div>';
}
async function doRecover(){
  var phone=gv('rec-phone').trim();
  var dni=gv('rec-dni').trim();
  var bdayRaw=gv('rec-bday').trim();
  recPhone=phone;recDni=dni;recBday=bdayRaw;
  var msg=(document.getElementById('rec-msg') as HTMLInputElement | null);
  if(!phone||!dni||!bdayRaw){if(msg)msg.textContent='Completa teléfono, DNI y fecha de nacimiento.';return;}
  var bday=parseBdayDDMMYYYY(bdayRaw);
  if(!bday){if(msg)msg.textContent='Fecha inválida — debe ser DD/MM/AAAA y existir de verdad.';return;}
  busy=true;busyMsg='Verificando...';render();
  try{
    var r=await api('recover',{phone:phone,dni:dni,bday:bday});
    if(r.emailSent){recNewPin=null;recEmailMasked=r.emailMasked;}
    else{recNewPin=r.newPin;recEmailMasked=null;recPinRevealed=false;}
    // Antes el teléfono no pasaba de esta pantalla a Ingresar — el cliente lo volvía a
    // teclear pese a haberlo escrito hace un momento (hallazgo de auditoría UX, MEDIO).
    savedPh=phone;
    busy=false;sndScreen='p_recover';render();
  }catch(e){
    busy=false;sndScreen='p_recover';render();
    var m2=(document.getElementById('rec-msg') as HTMLInputElement | null);
    if(m2)m2.textContent=e.message;
  }
}

// Red de seguridad global. Casi toda la interacción de la app son handlers `onclick`
// en línea que llaman funciones globales; si una de ellas lanza, el navegador se traga
// el error en la consola y para el usuario simplemente "no pasa nada al tocar" — sin
// mensaje, sin pista, idéntico a un botón muerto. Eso hizo indiagnosticable a distancia
// el reporte del 2026-08-21 sobre ARMA EL TUYO. Ahora cualquier error suelto levanta una
// barra visible con la pantalla, el build y el mensaje: el dueño puede mandarnos una foto
// y sabemos exactamente qué pasó, en vez de adivinar.
var lastRuntimeError='';
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
      +'<button onclick="document.getElementById(\'rt-err\').remove();lastRuntimeError=\'\'" style="all:unset;cursor:pointer;margin-top:8px;color:#FFB3B3;text-decoration:underline;font-size:12px">cerrar</button>';
  }catch(_){}
}
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
var SW_UPDATE_FLAG='__shell-update-pending';
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
})();
