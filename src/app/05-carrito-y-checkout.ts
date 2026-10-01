// Edita un producto ya en el carrito: lo saca y precarga el builder con su
// configuración exacta, para no tener que rearmarlo desde cero.
function editCartItem(idx){
  var it=cart[idx];
  if(!it||it.type==='side')return;
  syncConfirmFields();
  _lineaEnEdicion={idx:idx,item:it};
  cart.splice(idx,1);
  if(appliedReward&&findRewardTargetIndex(appliedReward)<0)appliedReward=null;
  saveCart();
  var bld=Object.assign({},it);
  bld.mode=it.type;
  delete bld.type;
  editingItemQty=it.qty||1;
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
// de "canjear ahora y mostrar un código al repartidor". Todas descuentan el precio real
// de la línea del carrito a la que apliquen (ver rewardWaiverAmount) — quedan además
// registradas en el pedido (recibo, ticket de cocina, WhatsApp).
function rewardsPickerHTML(){
  if(!cust)return'';
  // Mismo criterio que en promoCodeHTML: un código promocional y una recompensa de
  // puntos no se combinan en el mismo pedido.
  if(appliedPromo){
    return'<div style="margin-top:16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Usa tus puntos //</div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#9DA096)">No se puede combinar con el código promocional aplicado abajo — quítalo primero si prefieres usar una recompensa.</div></div>';
  }
  var unlocked=RWDS.filter(function(r){return(cust.points||0)>=r.pts;});
  // Antes, sin ninguna recompensa desbloqueada (el caso más común en un primer o segundo
  // pedido), esta función no mostraba nada — el mismo framing "Te faltan N pts" que ya
  // existe en el perfil (ver sProfile) nunca se reutilizaba justo donde más empuja a
  // agregar algo más al carrito: el checkout (hallazgo de auditoría, MEDIO).
  if(!unlocked.length){
    var cheapest=RWDS.slice().sort(function(a,b){return a.pts-b.pts;})[0];
    if(!cheapest)return'';
    var missingPts=cheapest.pts-(cust.points||0);
    return'<div style="margin-top:16px;background:var(--sw-card2,#171A14);border:1px solid rgba(203,162,88,.2);border-radius:8px;padding:12px 14px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:4px">Tus puntos //</div><div style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-muted,#9DA096)">Te faltan <span style="color:var(--sw-text-body,#EFEDE4);font-weight:700">'+missingPts+' pts</span> para '+cheapest.n+' // '+cheapest.s+'.</div></div>';
  }
  var rows=unlocked.map(function(r){
    var selected=appliedReward===r.id;
    var targetIdx=findRewardTargetIndex(r.id);
    var eligible=targetIdx>=0;
    var savings=selected?rewardWaiverAmount(r.id,targetIdx):0;
    var targetLabel=selected&&targetIdx>=0?itemLabel(cart[targetIdx]):'';
    // R03 en una línea 15CM cuyo precio no cambia en 30CM (hoy ningún ítem del catálogo)
    // antes mostraba el mismo mensaje genérico que "no tienes ningún 15CM" — confuso
    // cuando el cliente SÍ tiene uno en el carrito, solo que ese producto no tiene nada
    // que perdonar (hallazgo de auditoría UX).
    var r03FlatPriceItem=cart.some(function(it){return it.type!=='side'&&it.size==='15'&&itemSizeUpgradeDiff(it)===0;});
    var reqText=r.tipo==='sandwich'?' · agrega un sándwich 15CM para usarla'
      :r.tipo==='doble'?' · agrega un sándwich con doble proteína para usarla'
      :r.tipo==='salsa'?' · agrega salsa extra a un sándwich para usarla'
      :r.tipo==='subir30'?(r03FlatPriceItem?' · ese sándwich ya cuesta igual en 30CM, no hay nada que perdonar':' · agrega un sándwich 15CM para usarla')
      :r.tipo==='bebida'?' · agrega una bebida para usarla'
      :' · agrega algo a tu carrito para usarla';
    // SOLES (con <span>) es HTML pensado para insertarse crudo — pero `sub` entero pasa
    // por esc() más abajo, así que había que usar SOLES_TXT (texto plano) acá, no SOLES.
    // Antes se veía literalmente "<span style=...>S/</span>4" en pantalla al aplicar
    // cualquier recompensa con ahorro (hallazgo de auditoría UX, ALTO, confirmado por
    // 2 agentes independientes).
    var sub=r.d+(!eligible?reqText:'')+(selected&&savings>0?' · ahorras '+SOLES_TXT+pz(savings)+' en '+targetLabel:(selected?' · se incluye con tu pedido':''));
    return'<div onclick="'+(eligible?'toggleReward(\''+r.id+'\')':'')+'" style="background:'+(selected?'var(--sw-card2,#171A14)':'var(--sw-card,#1B1F18)')+';border:1px solid '+(selected?GOLD:'#2C3228')+';border-radius:10px;padding:12px 14px;margin-bottom:8px;cursor:'+(eligible?'pointer':'not-allowed')+';opacity:'+(eligible?1:.4)+';box-shadow:'+(selected?SHADOW_GOLD:SHADOW_SM)+'"><div style="display:flex;justify-content:space-between;align-items:center"><div style="flex:1;padding-right:8px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+r.n+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+r.s+'</div><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#9DA096);margin-top:2px">'+esc(sub)+'</div></div><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:15px;color:'+(selected?GOLD:'var(--sw-text-muted,#9DA096)')+';flex-shrink:0">'+(selected?'✓':'○')+'</span></div></div>';
  }).join('');
  return'<div style="margin-top:16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Usa tus puntos //</div>'+rows+'</div>';
}
function toggleReward(id){
  syncConfirmFields();
  if(appliedReward===id){appliedReward=null;saveCart();render();return;}
  if(findRewardTargetIndex(id)<0)return;
  appliedReward=id;
  saveCart();
  render();
}
// Bloqueado con Yape/Plin (ver el mismo criterio del lado servidor, actPlaceOrder): el
// código recién se redime cuando el pago manual se confirma, y ofrecerlo acá antes de eso
// implicaría prometer un descuento que el servidor todavía va a rechazar.
function promoCodeHTML(){
  var box='<div style="margin-top:16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Código promocional //</div>';
  if(appliedPromo){
    return box+'<div style="background:var(--sw-card2,#171A14);border:1px solid rgba(37,211,102,.3);border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;gap:8px"><span style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-ok,#25D366)">'+esc(appliedPromo.code)+' aplicado · ahorras '+SOLES_TXT+pz(appliedPromo.discount)+'</span><span onclick="removePromoCode()" style="cursor:pointer;flex-shrink:0;font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-danger,#ff8888)">Quitar</span></div></div>';
  }
  // Un código promocional y una recompensa de puntos no se pueden combinar en el mismo
  // pedido (mismo criterio que combo/hora-valle: nunca se suman) — el servidor ya lo
  // rechaza, esto solo evita que el cliente llegue a intentarlo sin saber por qué falla.
  if(appliedReward){
    return box+'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#9DA096)">No se puede combinar con la recompensa aplicada arriba — quítala primero si prefieres usar un código.</div></div>';
  }
  // Colapsado detrás de un enlace hasta que el cliente diga que tiene un código. Un campo
  // de cupón siempre visible es una de las fugas clásicas del checkout: le recuerda al
  // que no tiene ninguno que "podría estar pagando menos", y se va a buscar uno a otra
  // pestaña de la que muchas veces no vuelve. Quien sí tiene código lo busca igual.
  if(!promoFieldOpen){
    return box+'<div onclick="promoFieldOpen=true;confirmRerender()" style="cursor:pointer;font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:var(--sw-text-muted,#9DA096);text-decoration:underline;text-underline-offset:3px">¿Tienes un código?</div></div>';
  }
  return box+'<div style="display:flex;gap:8px"><input id="o-promo" type="text" placeholder="Opcional" oninput="promoStatus=\'\';renderPromoStatus()" style="flex:1;min-width:0;background:var(--sw-card,#1B1F18);border:1px solid var(--sw-border,#2C3228);border-radius:8px;padding:10px 12px;color:var(--sw-text,#FFFFFF);font-family:\'EB Garamond\',serif;font-size:15px;text-transform:uppercase"/>'
    +'<button onclick="applyPromoCode()" style="flex-shrink:0;background:var(--sw-card2,#171A14);border:1px solid '+GOLD+';border-radius:8px;padding:0 16px;cursor:pointer;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:'+GOLD+'">Aplicar</button></div>'
    +'<div id="o-promo-status" style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-danger,#ff8888);margin-top:6px;min-height:14px">'+esc(promoStatus)+'</div></div>';
}
// No usa render() completo (a diferencia del resto de este archivo) porque el checkout
// tiene varios campos de texto que el usuario puede seguir tipeando mientras esto corre
// (nombre/dirección/etc, ver syncConfirmFields) — un re-render completo aquí los borraría
// a medio tipear, el mismo bug que syncConfirmFields ya existe para evitar en otros lados.
function renderPromoStatus(){var el=document.getElementById('o-promo-status');if(el)el.textContent=promoStatus;}
async function applyPromoCode(){
  var el=(document.getElementById('o-promo') as HTMLInputElement|null);
  var code=el?el.value.trim():'';
  if(!code)return;
  var phone=cust?cust.phone:confPhone.trim();
  if(!phone){promoStatus='Ingresa tu teléfono de contacto primero.';renderPromoStatus();return;}
  promoStatus='Verificando...';renderPromoStatus();
  try{
    // El preview tiene que tasar EXACTAMENTE igual que el cobro, o el descuento que se
    // muestra no es el que se aplica y el checkout se rechaza por total que no coincide.
    // Faltaban tres cosas:
    //  · `token` y `groupCode`, sin los cuales el servidor no puede saber que el carrito
    //    trae el sándwich gratis del organizador, así que calculaba el % sobre un
    //    subtotal más alto que el real.
    //  · el ISO de la hora programada. Antes se mandaba `schedEl.value` crudo
    //    ("2026-08-28T15:30", sin zona): el servidor corre en UTC, así que esa cadena
    //    naive se interpretaba como 15:30 UTC = 10:30 en Lima, y el preview no veía la
    //    promo de hora valle que el pedido real sí iba a aplicar.
    var promoSchedIso=null;
    if(scheduleMode==='later'&&schedInputValue()){
      var pd=new Date(schedInputValue());
      if(!isNaN(pd.getTime()))promoSchedIso=pd.toISOString();
    }
    var res=await api('validate-promo-code',{code:code,phone:phone,items:cart,rewardId:appliedReward,scheduledFor:promoSchedIso,token:token,groupCode:pendingGroupCode||''});
    appliedPromo={code:res.code,discount:res.discount};
    promoStatus='';
  }catch(e){
    appliedPromo=null;
    promoStatus=e&&e.message?e.message:'No se pudo validar el código.';
  }
  // confirmRerender() (no render() a secas) — este re-render ocurre DESPUÉS de que el
  // usuario ya pudo haber tipeado nombre/teléfono/dirección mientras se verificaba el
  // código (llamada async); sin sincronizar esos campos primero, el re-render los pisaría
  // con el valor viejo de confNom/confPhone/addrText (mismo bug ya corregido antes para
  // el resto del checkout, ver syncConfirmFields).
  confirmRerender();
}
function removePromoCode(){appliedPromo=null;promoStatus='';confirmRerender();}
function pickAddr(id){
  var a=myAddresses.find(function(x){return mismoId(x.id,id);});
  if(!a)return;
  syncConfirmFields();
  pickedAddrId=id;addrText=a.address;
  // Se restauran las coordenadas guardadas con esa dirección: por eso el pin se pide UNA
  // sola vez por dirección y no en cada pedido. Si la dirección es vieja y no las tiene, se
  // limpian para que el checkout vuelva a pedir el pin en vez de cobrar la distancia de la
  // dirección ANTERIOR, que es el peor error posible acá.
  window._mLat=typeof a.lat==='number'?a.lat:null;
  window._mLon=typeof a.lon==='number'?a.lon:null;
  // Si la dirección guardada ya menciona el distrito, se preselecciona — el cliente no
  // tiene que volver a elegir algo que ya escribió cuando la guardó.
  var inferred=districtFromAddress(a.address);
  if(inferred){deliveryDistrict=inferred;deliveryDistrictFromPin=true;}
  // La referencia viaja con la dirección (maqueta 34): no se vuelve a escribir en cada pedido.
  if(a.reference)confNotes=a.reference;
  render();
}
// Bloque de campos de checkout (puntos a ganar, recompensas, direcciones guardadas,
// nombre/correo/dirección/notas, horario, crédito, banner de notificaciones push) —
// se usa tanto en TU CARRITO (multi-producto) como en la confirmación de un solo
// sándwich cuando se elige pago directo. Asume que `cart` ya tiene al menos 1 producto.
// Sándwich sin bebida en el carrito — el combo (sándwich+bebida, S/3 menos) todavía no
// se está aprovechando, así que lo sugerimos justo donde se agrega una bebida. Antes vivía
// solo dentro de sOCart, así que un cliente que pasa por el pago directo de UN sándwich
// (enterConfirm/quickPayEligible, sin pisar nunca TU CARRITO — el camino más común) nunca
// lo veía; movido a checkoutExtrasHTML (compartida por ambos flujos) para que ambos lo vean.
// Antes esto era UNA LÍNEA DE TEXTO ("agrega una bebida y ahorra S/2") sin forma de
// agregarla: el cliente tenía que salir del checkout, ir a BEBIDAS Y SIDES, elegir, y
// volver. Ahora muestra las bebidas reales con su precio y las agrega de un toque.
//
// Por qué importa: la incidencia de bebida es ~14% más baja en pedido digital que
// presencial, y más de la mitad de los comensales agregaría una si se le pidiera
// explícitamente. Los prompts de add-on en checkout suben el ticket 3%+ de forma típica.
// En este negocio vale doble, porque las infusiones tienen 61-84% de margen contra 48.5%
// del promedio: el attach de bebida sube la CONTRIBUCIÓN más de lo que sube el ticket.
function comboDrinkNudgeHTML(){
  var hasSandwichNoDrink=cart.some(function(it){return it.type!=='side';})&&cartComboCount()<cart.reduce(function(s,it){return s+(it.type!=='side'?it.qty:0);},0);
  if(!hasSandwichNoDrink)return'';
  // La rama de hora valle se queda escrita a propósito aunque hoy nunca se cumpla: la promo
  // se apagó vaciando su ventana horaria (ver OFFPEAK_DRINK_PROMO_HOURS_LIMA), no borrando el
  // mecanismo. Si el dueño la reactiva poniendo horas, el texto vuelve solo — y mientras
  // esté apagada, este anuncio NO puede aparecer: prometer una bebida gratis que el servidor
  // ya no descuenta es la clase de promesa rota que se descubre recién al pagar.
  var offPeak=isOffPeakDrinkPromoActiveNow();
  // ── EL TÍTULO ENCABEZA CON EL PRODUCTO, NO CON EL DESCUENTO (2026-09-06) ────────────
  //
  // Decía "¿Le sumas algo de tomar? Ahorras S/1 en combo". El combo bajó de S/2 a S/1 el
  // 2026-08-22 y nadie revisó este texto: quedó ofreciendo un ahorro de S/1 sobre un
  // producto de S/5-6, o sea encabezando con el argumento más débil que tiene.
  //
  // Lo que de verdad vende estas bebidas es que NO son gaseosas de reventa: son infusiones
  // de la casa, y esa es justamente la razón por la que D01-D05 se retiraron del catálogo.
  // El descuento sigue nombrado, pero de segundo — que es el orden en que importa.
  //
  // No es cosmético para el negocio: `PREDICCION_V12.md` mide el attach de bebida como una
  // de las tres palancas de la meta, y vale ~S/0.48 por pedido cada 15 puntos. Ahora además
  // se MIDE (pantalla "Las tres palancas"), así que este cambio se puede evaluar en vez de
  // suponer que funcionó.
  var titulo=offPeak
    ?'Es hora valle — tu bebida va GRATIS (hasta '+SOLES_TXT+pz(OFFPEAK_DRINK_PROMO_CAP)+')'
    :'Infusiones de la casa, hechas acá — y el combo te descuenta '+SOLES_TXT+pz(COMBO_DISCOUNT_PER_PAIR);
  // ── LA BEBIDA SE VENDE CON SU DESCRIPCIÓN, NO CON SU NOMBRE (2026-09-05) ──────────────
  //
  // Antes estas tarjetas mostraban nombre + precio y nada más, en cuatro columnas de 72px.
  // "The Bloom // Hibiscus · S/6" no le dice a nadie qué está comprando: son infusiones de
  // la casa, no gaseosas de marca conocida, así que el nombre solo no vende. La descripción
  // ya existía en el catálogo (`d`) y solo se usaba en la pantalla de bebidas — o sea que el
  // texto de venta no estaba en el momento de la venta.
  //
  // Dos columnas en vez de cuatro para que la descripción entre legible. Es el único empujón
  // de bebida del flujo, y la bebida es el ítem de mejor margen del catálogo: sube la
  // contribución del pedido más de lo que sube el ticket.
  var chips=SIDES.map(function(d){
    // La foto va acá y no solo en la pantalla de BEBIDAS: este chip es el único empujón que
    // ve quien nunca entra a esa pantalla, y una bebida descrita solo con texto compite de
    // memoria contra un sándwich que sí tiene foto.
    return'<div onclick="addSideToCart(\''+d.id+'\')" style="flex:1 1 calc(50% - 4px);min-width:130px;background:var(--sw-card,#1B1F18);border:1px solid #2C3228;border-radius:10px;padding:10px 11px;cursor:pointer;display:flex;gap:9px;align-items:flex-start">'
      +(DRINK_IMG[d.id]?'<img src="'+DRINK_IMG[d.id]+'" alt="" style="flex-shrink:0;width:40px;height:40px;object-fit:cover;border-radius:8px" loading="lazy">':'')
      +'<div style="flex:1;min-width:0">'
      +'<div style="display:flex;justify-content:space-between;align-items:baseline;gap:6px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#FFFFFF);line-height:1.25">'+esc(d.l)+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+esc(d.s)+'</div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:'+GOLD+';white-space:nowrap">+'+SOLES_TXT+pz(d.p)+'</div></div>'
      +(d.d?'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#9DA096);line-height:1.4;margin-top:4px">'+esc(d.d)+'</div>':'')
      +'</div></div>';
  }).join('');
  return'<div style="margin-top:16px;background:var(--sw-card2,#171A14);border:1px solid rgba(203,162,88,.25);border-radius:10px;padding:12px 14px">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:'+GOLD+';margin-bottom:9px">'+titulo+'</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'+chips+'</div></div>';
}
// Zona por defecto 'media' — el cliente solo toca esto si sabe que está más cerca o más
// lejos de lo normal, nunca es un paso obligatorio. El monto ya se suma al total de abajo
// (ver payableTotal) — no hace falta un aviso aparte de "cuánto cuesta el delivery".
// Selector de DISTRITO — obligatorio, y separado a propósito de la "zona de entrega" de
// abajo (esa solo fija el precio del motorizado; esta decide si el pedido se puede
// entregar). Antes la cobertura se resolvía adivinando: se buscaba el nombre del distrito
// dentro del texto libre que el cliente escribía, así que quien no lo escribía pasaba el
// filtro sin querer y quien sí lo escribía se enteraba recién al tocar PAGAR, con todo el
// checkout ya lleno. Los distritos fuera de cobertura salen listados y deshabilitados
// ("todavía no llegamos aquí") en vez de ocultos: ocultarlos hace parecer que el negocio
// no existe para esa persona; mostrarlos apagados dice que existe y todavía no llega.
// El aviso de "tu zona no cuadra con tu pin" vivía acá y se retiró el 2026-09-02, junto con
// zoneForKm/applySuggestedZone/DELIVERY_ZONE_MAX_KM. Existía porque el cobro salía de la zona
// que el cliente elegía y el pin solo podía AVISAR del desajuste; su texto llegaba a decir
// "puede que el motorizado te pida la diferencia al llegar", que era una promesa sobre lo que
// haría un tercero. Ahora el envío se cobra por distancia real (ver deliveryFeeBase en
// src/app/01-*) y no hay zona que pueda desajustarse: no hay nada que avisar.
function districtPickerHTML(){
  var opts=DELIVERY_DISTRICTS.map(function(d){
    var sel=deliveryDistrict===d.id;
    return'<option value="'+d.id+'"'+(sel?' selected':'')+(d.out?' disabled':'')+'>'+esc(d.l)+(d.out?' — todavía no llegamos aquí':'')+'</option>';
  }).join('');
  var out=DELIVERY_DISTRICTS.filter(function(d){return d.out;}).map(function(d){return d.l;}).join(' y ');
  // Cuando el pin ya resolvió el distrito, esto deja de ser una PREGUNTA y pasa a ser una
  // confirmación. El selector se queda en el DOM (es la única defensa de cobertura cuando
  // no hay pin, y el servidor no ve el mapa), pero preguntar dos veces el mismo dato —
  // una al mapa y otra al cliente — era exactamente lo que el dueño reportó como fricción.
  var delPin=deliveryDistrictFromPin&&deliveryDistrict;
  // ── EL DISTRITO YA NO SE PREGUNTA SI EL MAPA LO SABE (maqueta 34, dueño 2026-09-24) ──
  // La maqueta no tiene selector de distrito: la dirección se marca en el mapa y de ahí sale
  // todo. El selector queda solo cuando el mapa no lo resolvió, o cuando el cliente pide
  // cambiarlo. El <select> sigue existiendo (oculto) para que doOrder lea el mismo campo.
  var d=districtById(deliveryDistrict);
  if(delPin&&d&&!districtSelectOpen){
    var fuera=!!(d as any).out;
    return'<div><input type="hidden" id="o-district" value="'+esc(deliveryDistrict)+'">'
      +'<div id="o-district-hint" style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;font-family:\'EB Garamond\',serif;font-size:13px;color:'+(fuera?'var(--sw-danger,#ff8888)':'var(--sw-text-muted,#9DA096)')+'">'
      +'<span>'+(fuera?'Todavía no llegamos a '+esc(d.l)+'.':'Entregamos en '+esc(d.l)+'.')+'</span>'
      +'<button onclick="districtSelectOpen=true;syncConfirmFields();render()" style="all:unset;cursor:pointer;font-size:11px;color:'+GOLD+';letter-spacing:.1em">No es mi distrito</button></div>'
      +(fuera?HERMANO_DICE('piensa','Todavía no llegamos a '+d.l,'Déjanos tu correo abajo y te avisamos el día que abramos tu zona.','alerta')+zonaEsperaHTML(d):'')
      +'</div>';
  }
  return'<div>'
    +'<label for="o-district" style="display:block;font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:6px">'+(delPin?'Distrito // lo tomamos de tu mapa':'Distrito //')+'</label>'
    +'<select id="o-district" onchange="pickDistrict(this.value)" style="background:var(--sw-card,#1B1F18);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px;color:var(--sw-text,#FFFFFF);width:100%;font-size:15px;box-shadow:'+SHADOW_SM+';box-sizing:border-box;-webkit-appearance:none;appearance:none">'
    +'<option value=""'+(deliveryDistrict?'':' selected')+'>Elige tu distrito</option>'+opts+'</select>'
    +'<div id="o-district-hint" style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#9DA096);margin-top:5px">'+esc(delPin?'Si no es el correcto, cámbialo aquí.':'Por ahora no llegamos a '+out+'.')+'</div>'
    +'</div>';
}
var districtSelectOpen=false;
// «Te avisamos apenas abramos la zona» (maqueta 34): queda anotado con su distrito y el dueño
// avisa desde el panel cuando abre esa zona (actions/zones.ts). Sin sesión no hay a quién
// avisarle, así que se lo dice en vez de fingir que quedó anotado.
var zonaEsperaEstado:Record<string,string>={};
function zonaEsperaHTML(d:any):string{
  var st=zonaEsperaEstado[d.id]||'';
  if(st==='ok')return'<div style="margin-top:6px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:'+GOLD+'">Listo. Te avisamos apenas abramos '+esc(d.l)+'.</div>';
  if(!cust)return'<div style="margin-top:6px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:var(--sw-text-muted,#9DA096)">Entra a tu cuenta y te avisamos apenas abramos '+esc(d.l)+'.</div>';
  return'<button onclick="unirmeAZona(\''+d.id+'\')" style="all:unset;cursor:pointer;margin-top:8px;display:inline-block;font-family:\'EB Garamond\',serif;font-size:13px;color:'+GOLD+';border-bottom:1px solid '+GOLD+'">'+(st==='enviando'?'Anotándote…':'Avísame cuando lleguen')+'</button>'
    +(st&&st!=='enviando'?'<div style="margin-top:4px;font-size:11px;color:var(--sw-danger,#ff8888)">'+esc(st)+'</div>':'');
}
async function unirmeAZona(id:string){
  syncConfirmFields();
  zonaEsperaEstado[id]='enviando';render();
  try{
    await api('zone-waitlist-join',{token:token,district:id,lat:window._mLat,lon:window._mLon});
    zonaEsperaEstado[id]='ok';
  }catch(e:any){zonaEsperaEstado[id]=(e&&e.message)||'No se pudo anotar. Intenta de nuevo.';}
  render();
}
// No re-renderiza el checkout entero a propósito: hacerlo borraría lo que el cliente
// tenga escrito a medias en los inputs de arriba (nombre/dirección/referencia solo se
// vuelcan a las variables en syncConfirmFields).
function pickDistrict(id){
  deliveryDistrict=id||'';
  // Si el cliente lo toca, deja de ser lo que dijo el mapa.
  deliveryDistrictFromPin=false;
  var hint=document.getElementById('o-district-hint');
  if(hint)hint.textContent=deliveryDistrict&&deliveryDistrict!=='otro'
    ?'Entregamos en '+((districtById(deliveryDistrict)||{}).l||'')+'.'
    :'Por ahora no llegamos a '+DELIVERY_DISTRICTS.filter(function(d){return d.out;}).map(function(d){return d.l;}).join(' y ')+'.';
}
function deliveryZonePickerHTML(){
  var km=deliveryKmNow();
  // CON PIN: se muestra la tarifa real por distancia. Ya no hay nada que elegir — antes el
  // cliente escogía su zona de un desplegable, o sea escogía cuánto pagar de envío.
  if(km!==null){
    var base=deliveryFeeBase();
    return'<div style="margin-top:14px">'
      +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Envío //</div>'
      +'<div style="background:var(--sw-card,#1B1F18);border:1px solid var(--sw-border,#2C3228);border-radius:10px;padding:12px 14px">'
        +'<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">'
          +'<div style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-body,#EFEDE4)">'+km.toFixed(1)+' km hasta tu punto</div>'
          +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:640;color:'+GOLD+'">'+SOLES_TXT+pz(base)+'</div></div>'
          +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#9DA096);line-height:1.45;margin-top:4px">Se cobra por distancia real, '+SOLES_TXT+pz(DELIVERY_KM_RATE)+' por kilómetro. El motorizado te lo entrega en la puerta.</div>'
      +'<button onclick="abrirUbicacion()" style="all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;margin-top:10px;border:1px solid '+GOLD+';color:'+GOLD+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.05em;padding:9px;border-radius:8px;text-align:center">Cambiar mi ubicación //</button>'
      +'</div></div>';
  }
  // SIN PIN: no hay distancia medida. No se ofrece el desplegable de zonas de vuelta a
  // propósito — volvería a dejar que el cliente elija su propio precio de envío.
  //
  // ⚠ PERO SÍ SE ESTÁ COBRANDO ALGO, y decir lo contrario contradecía al recibo de arriba.
  // El servidor cae a la tarifa por zona cuando no recibe coordenadas (a propósito, para
  // que un shell viejo servido por un service worker desactualizado pueda pagar igual), así
  // que `deliveryFeeAmount()` YA devuelve un monto y el recibo YA lo suma al total. Este
  // bloque decía "calculamos el envío al instante" como si todavía no hubiera nada — dos
  // párrafos de la misma pantalla contando cosas distintas sobre la misma plata. Es el
  // mismo defecto que descuadraba el recibo, en su otra forma: no un número mal sumado,
  // sino un número que se afirma y se niega a la vez.
  //
  // Ahora se dice lo que se cobra HOY y qué gana el cliente confirmando el pin. Y el pin
  // deja de venderse como un trámite: en la mayoría de las direcciones de Trujillo la
  // distancia real cobra MENOS que el estimado por zona, así que confirmarlo suele abaratar.
  var estimado=deliveryFeeAmount();
  return'<div style="margin-top:14px">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Envío //</div>'
    +'<div style="background:rgba(203,162,88,.08);border:1px solid '+GOLD+';border-radius:10px;padding:12px 14px">'
    +(estimado>0
      ?'<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:6px">'
        +'<span style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-body,#EFEDE4)">Estimado por tu zona</span>'
        +'<span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:640;color:'+GOLD+'">'+SOLES_TXT+pz(estimado)+'</span></div>'
      :'')
    +'<div style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-body,#EFEDE4);line-height:1.5">'
    +(estimado>0
      ?'Confirma tu ubicación en el mapa y lo cobramos por la distancia real: '+SOLES_TXT+pz(DELIVERY_KM_RATE)+' por kilómetro. Casi siempre sale menos que el estimado.'
      :'Confirma tu ubicación en el mapa y calculamos el envío al instante. Se cobra por distancia real, '+SOLES_TXT+pz(DELIVERY_KM_RATE)+' por kilómetro.')
    +'</div>' 
    +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#9DA096);margin-top:4px">Solo la primera vez por dirección: después queda guardada.</div>'
    +'<button onclick="abrirUbicacion()" style="all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;margin-top:10px;background:'+GOLD+';color:var(--sw-bg,#17130E);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.05em;padding:10px;border-radius:8px;text-align:center">Confirmar mi ubicación //</button>'
    +'</div></div>';
}
function checkoutExtrasHTML(){
  var t=pointsFor(payableTotal(),deliveryFeeAmount());
  var payT=payableTotal();
  var pBox=cust
    ?'<div style="background:var(--sw-card2,#171A14);border:1px solid rgba(203,162,88,.2);border-radius:8px;padding:12px;margin-top:14px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:4px">Puntos que ganarás //</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:var(--sw-text,#FFFFFF)">+'+t+' pts <span style="font-size:11px;color:var(--sw-text-muted,#9DA096);font-weight:600">pendientes hasta confirmar pago</span></div></div>'
    :'<div onclick="swTab(\'points\')" style="background:var(--sw-card,#1B1F18);border:1px solid var(--sw-border,#2C3228);border-radius:8px;padding:12px;margin-top:14px;cursor:pointer"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:'+GOLD+'">↗ Regístrate en PUNTOS para ganar +'+t+' pts</div></div>';
  var payingWithCreditFully=useCredit&&cust&&(cust.credit_balance||0)>=payT;
  return pBox
    +comboDrinkNudgeHTML()
    // Antes, al elegir Yape/Plin, el picker de recompensas se ocultaba por completo y no
    // quedaba NINGUNA confirmación de que la recompensa ya aplicada seguía activa (el
    // descuento sí sigue funcionando en el monto a transferir, pero visualmente parecía
    // perdida) — hallazgo de auditoría UX, MEDIO.
    // ⚠ La condición era `manualPayMethod` a secas, y eso se rompió solo el día que Yape
    // pasó a ser el DEFAULT (2026-09-03): el selector de recompensas y el campo de código
    // promocional desaparecían del checkout para todo cliente que no tocara el selector de
    // pago — o sea la mayoría. Un cliente con puntos entraba a pagar y no veía dónde
    // canjearlos. Ese es exactamente el modo de fallo que este archivo documenta en otros
    // lados: nada revienta, nada avisa, simplemente deja de existir una función entera.
    //
    // Lo que la regla protegía sigue protegido: ocultarlo tiene sentido cuando el cliente ya
    // ELIGIÓ transferir (payMethodChosen) y tiene el monto en pantalla listo para yapear —
    // cambiar la recompensa ahí mueve el número después de que él lo copió. Un default que
    // nadie tocó todavía no es ese momento.
    +(manualPayMethod&&payMethodChosen
      ?(appliedReward?(function(){var r=RWDS.find(function(x){return x.id===appliedReward;});return r?'<div style="background:var(--sw-card2,#171A14);border:1px solid rgba(37,211,102,.3);border-radius:8px;padding:10px 14px;margin-top:14px;font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-ok,#25D366);display:flex;align-items:center;gap:6px">'+icon('gift',12,'var(--sw-ok,#25D366)')+'Recompensa aplicada: '+esc(r.n+' '+r.s)+'</div>':'';})():'')
      :rewardsPickerHTML()+promoCodeHTML())
    // "Contacto y entrega //" y "Entrega y horario //" — antes esto era ~9 bloques
    // apilados sin ninguna frontera visual propia entre sí, un scroll largo sin dividir
    // (hallazgo de auditoría UX, P1) pese a que el patrón <details>/<summary> ya existe
    // en "Todos los extras //" (ver sOItemConfirm). Envueltos ahora en <details open> —
    // siguen mostrando exactamente el mismo contenido por defecto (ningún campo
    // obligatorio queda oculto), pero el cliente puede colapsarlos una vez completados
    // para acortar el scroll del resto del checkout.
    +'<details open style="margin-top:20px"><summary style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;cursor:pointer;list-style:none">Contacto y entrega //</summary><div style="margin-top:10px">'
    +(!cust||!myAddresses.length?'':'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">'+myAddresses.map(function(a){var sel=mismoId(pickedAddrId,a.id);return'<div onclick="pickAddr(\''+a.id+'\')" style="background:'+(sel?'var(--sw-card2,#171A14)':'var(--sw-card,#1B1F18)')+';border:1px solid '+(sel?GOLD:'#2C3228')+';border-radius:20px;padding:8px 14px;cursor:pointer;font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:'+(sel?'#fff':'#9DA096')+'">'+esc(a.label)+'</div>';}).join('')+'</div>')
    // Antes de pagar no se ofrece ninguna cuenta (dueño, 2026-09-25): la cuenta se ofrece UNA
    // vez, después de pagar, en la losa de la 06A (ver avisoDePuntos).
    +'<div style="display:flex;flex-direction:column;gap:10px">'+INP('o-nom','Nombre // Tu nombre','text',confNom,'clientes','name','nombre')+INP('o-phone','Teléfono // 9XXXXXXXX','tel',confPhone,'phone','tel','tel')+INP('o-email','Correo // Opcional, para tu comprobante','email',confEmail,'mail','email')+'<div style="position:relative">'+INP('o-addr','Dirección // Calle o usa GPS','text',addrText,'direccion','street-address','direccion')+'<button id="gps-btn" onclick="abrirUbicacion()" aria-label="Usar mi ubicación actual" style="all:unset;cursor:pointer;position:absolute;right:0;top:0;bottom:0;width:44px;display:flex;align-items:center;justify-content:center;color:var(--sw-text-muted,#9DA096)">'+icon('gps',16,'#9DA096')+'</button></div>'+'<div id="gps-hint" style="min-height:12px;margin-top:3px"></div>'+districtPickerHTML()+INP('o-notes','Referencia // portón, piso, cerca de... (opcional)','text',confNotes)+'</div>'
    +(scheduleMode==='now'?'<div style="margin-top:16px;background:var(--sw-card2,#171A14);border:1px solid rgba(203,162,88,.25);border-radius:10px;padding:12px 14px"><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#9DA096);line-height:1.4;display:flex;align-items:flex-start;gap:8px">'+icon('horario',13,'#9DA096')+'<span>Llega <b style="color:var(--sw-text,#FFFFFF)">'+esc(ventanaEstimadaTexto(null))+'</b> si lo confirmas ahora.'+(queueAhead>0?' Ahora mismo hay '+queueAhead+' pedido'+(queueAhead===1?'':'s')+' por delante.':'')+'</span></div></div>':'')
    +'</div></details>'
    +'<details open style="margin-top:16px"><summary style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;cursor:pointer;list-style:none">Entrega y horario //</summary><div style="margin-top:10px">'
    +deliveryZonePickerHTML()
    +'<div style="margin-top:16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">¿Cuándo? //</div><div style="display:flex;gap:8px;margin-bottom:8px"><div onclick="scheduleMode=\'now\';confirmRerender()" style="flex:1;text-align:center;background:'+(scheduleMode==='now'?'var(--sw-card2,#122019)':'var(--sw-card,#221B14)')+';border:1px solid '+(scheduleMode==='now'?GOLD:'var(--sw-border,#25382D)')+';border-radius:8px;padding:10px;cursor:pointer;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:#fff">Ahora</div><div onclick="scheduleMode=\'later\';initSchedDefault();confirmRerender()" style="flex:1;text-align:center;background:'+(scheduleMode==='later'?'var(--sw-card2,#122019)':'var(--sw-card,#221B14)')+';border:1px solid '+(scheduleMode==='later'?GOLD:'var(--sw-border,#25382D)')+';border-radius:8px;padding:10px;cursor:pointer;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:#fff">Programar</div></div>'
    // Antes el aviso de "estamos cerrados" solo aparecía como error al tocar pagar, al
    // final de todo el checkout — un cliente podía llenar nombre/dirección/método de
    // pago completos antes de enterarse. Ahora aparece apenas elige "Ahora" con la
    // tienda cerrada (hallazgo de auditoría UX, BAJO).
    +(scheduleMode==='now'&&!storeStatus().open?HERMANO_DICE('mira',storeStatus().label,'Elige «Programar» y lo dejamos listo para cuando abramos.','alerta'):'')
    +(scheduleMode==='later'?scheduleTimePickerHTML():'')+'</div>'
    +'</div></details>'
    +(!cust||(cust.credit_balance||0)<=0?'':(function(){var canCover=(cust.credit_balance||0)>=payT;var checked=useCredit&&canCover;return'<div onclick="'+(canCover?'toggleCredit()':'')+'" style="margin-top:16px;background:'+(checked?'var(--sw-card2,#171A14)':'var(--sw-card,#1B1F18)')+';border:1px solid '+(checked?GOLD:'#2C3228')+';border-radius:10px;padding:14px 16px;cursor:'+(canCover?'pointer':'not-allowed')+';opacity:'+(canCover?1:.5)+';box-shadow:'+(checked?SHADOW_GOLD:SHADOW_SM)+'"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">Pagar con mi crédito</div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#9DA096);margin-top:2px">Disponible: '+SOLES+pz(cust.credit_balance||0)+(canCover?'':' · no alcanza para este pedido')+'</div></div><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:15px;color:'+(checked?GOLD:'#9DA096')+'">'+(checked?'✓':'○')+'</span></div></div>';})())
    // Con recompensa el total puede llegar a S/0 — antes igual se mostraba el selector
    // TARJETA/YAPE/PLIN (y "YA REALICÉ EL PAGO //" si había un método manual elegido
    // antes) para un pedido que no cuesta nada.
    +(payingWithCreditFully||payT===0?'':paymentMethodPickerHTML(payT))
    +(checkoutLocked?'<div style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-danger-strong,#ff5555);margin-top:12px;background:rgba(255,85,85,.08);border:1px solid rgba(255,85,85,.3);border-radius:8px;padding:12px">'+esc(lockedMsg)+'</div>':'')
    +'<div id="o-err" style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-danger-strong,#ff5555);margin-top:8px;min-height:16px"></div>'
    // #25 — Hueco para el botón "programar para la siguiente hora libre". Va acá, pegado al
    // error, y no dentro del mensaje: el error es texto y esto es una acción.
    +'<div id="o-alt-slot"></div>'
    // Los clientes en su primer pedido reciben este mismo ofrecimiento, más prominente,
    // justo después de que el pago se confirma (ver sOSent) — no se les pregunta dos
    // veces en la misma compra.
    +(!cust||pushSubscribed||!cust.total_orders||!('serviceWorker' in navigator)||!('PushManager' in window)?'':'<div onclick="togglePushNotifications()" style="margin-top:16px;background:var(--sw-card2,#171A14);border:1px solid rgba(203,162,88,.3);border-radius:10px;padding:14px 16px;cursor:pointer"><div style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-body,#EFEDE4);line-height:1.4;display:flex;align-items:center;gap:8px">'+icon('notif',13,GOLD)+'<span>Te notificamos del estado de tu pedido<span style="color:'+GOLD+'"> — </span><span style="color:'+GOLD+';font-weight:700">actívalo aquí →</span></span></div>'+(pushMsg?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:'+GOLD+';margin-top:6px">'+esc(pushMsg)+'</div>':'')+'</div>');
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
// ── QR CODE (encoder propio, sin librerías) ─────────────────────────────────
// No existe un paquete QR en el bundle vanilla de este cliente, así que se
// reimplementa acá el algoritmo público (ISO/IEC 18004, la misma base que usan
// las librerías QR más conocidas) en modo Byte con corrección de errores nivel M,
// versiones 1-10 (hasta ~100 caracteres). Validado offline contra un decoder real
// (jsqr) antes de integrarlo — ver /scratchpad de la sesión que lo escribió.
// Solo se usa para un QR informativo (guardar el número del negocio), nunca para
// intentar simular un QR de cobro propio de Yape — eso requiere ser comercio
// afiliado con QR emitido por el banco, algo que este negocio no tiene hoy.
var qrExpTable=(function(){var t=new Array(256);for(var i=0;i<8;i++)t[i]=1<<i;for(var j=8;j<256;j++)t[j]=t[j-4]^t[j-5]^t[j-6]^t[j-8];return t;})();
var qrLogTable=(function(){var t=new Array(256);for(var i=0;i<255;i++)t[qrExpTable[i]]=i;return t;})();
function qrGlog(n){return qrLogTable[n];}
function qrGexp(n){while(n<0)n+=255;while(n>=256)n-=255;return qrExpTable[n];}
function qrPolyNew(num,shift){
  var offset=0;
  while(offset<num.length&&num[offset]===0)offset++;
  var out=new Array(num.length-offset+shift);
  for(var i=0;i<num.length-offset;i++)out[i]=num[i+offset];
  for(var j=num.length-offset;j<out.length;j++)out[j]=0;
  return out;
}
function qrPolyMod(a,b){
  if(a.length-b.length<0)return a;
  var ratio=qrGlog(a[0])-qrGlog(b[0]);
  var num=a.slice();
  for(var i=0;i<b.length;i++)num[i]^=qrGexp(qrGlog(b[i])+ratio);
  return qrPolyMod(qrPolyNew(num,0),b);
}
// count,total,data por bloque — índice (typeNumber-1)*4+ecIdx con ecIdx L=0,M=1,Q=2,H=3.
var qrRSBlockTable=[
  [1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],
  [1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],
  [1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],
  [2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],
  [2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],
];
var qrPatternPositionTable=[
  [],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],
];
var QR_G15=(1<<10)|(1<<8)|(1<<5)|(1<<4)|(1<<2)|(1<<1)|1;
var QR_G15_MASK=(1<<14)|(1<<12)|(1<<10)|(1<<4)|(1<<1);
var QR_G18=(1<<12)|(1<<11)|(1<<10)|(1<<9)|(1<<8)|(1<<5)|(1<<2)|1;
function paymentMethodPickerHTML(t){
  var culqiConfigured=CULQI_PUBLIC_KEY&&CULQI_PUBLIC_KEY.indexOf('REEMPLAZA')<0;
  // Antes había un botón "YAPE" y otro "PLIN" por separado para el pago manual, pero
  // ambos llevan a la misma pantalla de instrucciones (mismo número, mismo botón de
  // copiar) — obligar al cliente a elegir entre los dos no le da ninguna información
  // nueva, solo un tap de más. Un solo botón cubre ambas apps; internamente sigue
  // mandando 'yape' al servidor (el backend solo distingue "pago manual pendiente de
  // confirmar" de todo lo demás, nunca trató Yape y Plin como cosas distintas más allá
  // de esa etiqueta).
  //
  // Yape/Plin va PRIMERO (antes Tarjeta aparecía antes) y con la etiqueta "RECOMENDADO"
  // — es el único método que hoy no paga la comisión de Culqi (~4-5.5%), así que
  // empujarlo primero es una decisión de negocio real, no solo de layout (ver Contexto
  // de negocio en CLAUDE.md).
  // Mientras el pedido vaya a salir por Culqi (willPayWithCard(), sea por elección
  // explícita o por no haber tocado el selector todavía — ver el comentario de esa
  // función) el total YA incluye el recargo real. Esta línea lo hace explícito en vez de
  // dejar que el cliente note el aumento recién al ver el total — resuelve el hallazgo
  // P2 original (recargo invisible) sin cambiar el monto real que se cobra.
  // Lo que la tarjeta agrega al total: el fee de envío "engordado" menos el fee real.
  //
  // ⚠ Esto restaba la tarifa de ZONA hasta el 2026-09-03, y desde que el envío se cobra por
  // distancia esa resta daba un número sin sentido que igual se le mostraba al cliente. Se
  // compara contra deliveryFeeBase(), que es la misma función que produce el monto real.
  // ⚠ Esto era `deliveryFeeAmount()-deliveryFeeBase()` y se rompió solo el día que Yape
  // pasó a ser el default: deliveryFeeAmount() solo engorda el fee cuando el pedido VA a
  // salir por tarjeta, así que con Yape elegido la resta daba 0 y el botón dejaba de decir
  // cuánto se ahorra — justo en el único estado en que el cliente necesita esa razón.
  // El número que hay que mostrar es el recargo HIPOTÉTICO de la tarjeta, que no depende
  // del método elegido ahora mismo.
  var feeBase=deliveryFeeBase();
  var cardExtra=feeBase?money(feeBase/(1-CULQI_FEE_RATE)-feeBase):0;
  var cardFeeNote=willPayWithCard()&&!manualPayMethod&&cardExtra>0
    ?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#9DA096);margin-top:6px">El total ya incluye '+SOLES_TXT+pz(cardExtra)+' de comisión por pagar con tarjeta — con Yape/Plin no se cobra.</div>'
    :'';
  return'<div style="margin-top:16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">¿Cómo pagas? //</div><div style="display:flex;gap:8px">'
    +payMethodBtn('yape','Yape / Plin',true,cardExtra>0?'Ahorras '+SOLES_TXT+pz(cardExtra):'Recomendado')
    +(culqiConfigured?payMethodBtn('culqi','Tarjeta',true,'Automático'):'')
    +'</div>'
    // El widget de Culqi ya trae Yape integrado como pestaña (paymentMethods.yape=true,
    // ver openCulqi) — o sea que por el camino "Tarjeta" también se puede pagar con Yape
    // SIN subir comprobante ni esperar confirmación manual. Con la etiqueta anterior
    // nadie lo descubría, y quien no quería la fricción del comprobante simplemente
    // abandonaba en vez de cruzar al camino automático. Sí paga comisión (por eso
    // Yape/Plin manual sigue primero y marcado "Recomendado"), pero un pedido con
    // comisión vale infinitamente más que un pedido abandonado.
    +(culqiConfigured&&!manualPayMethod?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#9DA096);margin-top:6px">En "Tarjeta" también puedes pagar con Yape al instante, sin subir comprobante.</div>':'')
    // El camino de Yape/Plin ya tenía su línea de seguridad ("nunca te pediremos tu
    // clave") dentro de las instrucciones de transferencia; el de tarjeta no tenía
    // ninguna. Desconfianza al momento de entregar la tarjeta es una de las causas
    // principales de abandono en checkout, y acá el dato es verificable y real: el
    // formulario lo renderiza Culqi, la tarjeta nunca pasa por nuestro código.
    +(culqiConfigured&&!manualPayMethod?'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#9DA096);margin-top:6px;display:flex;align-items:flex-start;gap:6px">'+icon('lock',12,'#9DA096')+'<span>Tu tarjeta la procesa Culqi — nosotros nunca la vemos ni la guardamos.</span></div>':'')
    +cardFeeNote
    +(manualPayMethod?manualPayInstructionsHTML(t):'')
    // Condiciones de contratación y canal de reclamo ANTES de pagar, no después: es lo
    // que exige el D.L. 1729 sobre información previa al consumidor en comercio
    // electrónico, y hasta ahora solo existían en el footer del home.
    +legalLinksHTML('o_item_confirm')
    +'</div>';
}
// Antes cada botón llevaba un monograma Y/P morado/turquesa (los colores propios de esas
// apps) — quedaba fuera de lugar frente al resto de la app (monocromo + dorado, ver
// icon()/ICONS) y se veía de baja calidad a ese tamaño chico (hallazgo directo del dueño).
// TARJETA nunca tuvo ícono al lado del texto — por consistencia, YAPE/PLIN tampoco lo
// necesita: el texto ya identifica el método, sin arriesgar además un uso no autorizado
// de la marca de Yape/Plin.
function payMethodBtn(id,label,enabled,badge){
  // Yape/Plin arranca marcado (es el default desde el 2026-09-03, ver 01-*). Durante un
  // tiempo NINGUNO aparecía marcado, porque el que venía por defecto era Tarjeta y verla
  // pre-seleccionada hacía sentir que el recargo estaba decidido de antemano (hallazgo P2).
  // Con el default invertido ese problema desaparece solo: lo que queda marcado es el
  // método SIN recargo, y el cliente ve exactamente lo que va a pagar si no toca nada.
  var sel=id==='culqi'?(payMethodChosen&&!manualPayMethod):manualPayMethod===id;
  return'<div onclick="'+(enabled?'selectPayMethod(\''+id+'\')':'')+'" style="flex:1;text-align:center;background:'+(sel?'var(--sw-card2,#171A14)':'var(--sw-card,#1B1F18)')+';border:1px solid '+(sel?GOLD:'#2C3228')+';border-radius:8px;padding:10px 6px;cursor:'+(enabled?'pointer':'not-allowed')+';opacity:'+(enabled?1:.4)+'">'
    +(badge?'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:8px;color:'+GOLD+';letter-spacing:.08em;margin-bottom:3px">'+badge+'</div>':'')
    +'<div style="display:flex;align-items:center;justify-content:center;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:#fff">'+label+'</div>'
    +(enabled?'':'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#9DA096);margin-top:2px;letter-spacing:.05em">Pronto</div>')+'</div>';
}
// Prender el crédito apaga el método manual (si el crédito cubre el total no hace falta
// ninguno). Apagarlo tiene que DEVOLVER el default, no dejar al cliente en tarjeta sin
// haberla elegido nunca — que es lo que pasaba cuando esto era un `manualPayMethod=null`
// escrito dentro del onclick: el cliente tocaba dos veces el crédito y salía pagando la
// comisión de Culqi sin haber elegido la tarjeta. Si ya eligió a mano (payMethodChosen),
// se respeta su elección.
// El checkout abre con el método que el cliente eligió en Tu cuenta · «Cómo pagas», mientras
// no haya tocado nada en este pedido (payMethodChosen). Tarjeta se marca como elegida para
// que el recargo que ve sea el que de verdad va a pagar.
function aplicarMetodoPreferido(){
  if(payMethodChosen||useCredit||!cust)return;
  if(metodoPreferido()==='culqi'){manualPayMethod=null;payMethodChosen=true;}
  else manualPayMethod='yape';
}
function toggleCredit(){
  useCredit=!useCredit;
  if(useCredit)manualPayMethod=null;
  else if(!payMethodChosen)manualPayMethod='yape';
  confirmRerender();
}
function selectPayMethod(m){
  manualPayMethod=(m==='culqi'?null:m);
  payMethodChosen=true;
  // Antes elegir Yape/Plin borraba en silencio cualquier recompensa ya aplicada — el
  // servidor (deriveCart) no tiene ninguna restricción que ate una recompensa a un
  // método de pago en particular, así que esto era un descuido, no una regla de
  // negocio: un cliente que canjeaba BEBIDA GRATIS y luego elegía Yape perdía el
  // descuento sin ningún aviso (hallazgo al probar la reestructura de recompensas de
  // esta sesión). checkoutExtrasHTML ya oculta el selector de recompensas cuando hay
  // un método manual elegido (para no dejar cambiarla a medio pago) — eso basta, no
  // hace falta además descartar la que ya estaba aplicada.
  confirmRerender();
}
function payStep(n,label,body){
  return'<div style="display:flex;gap:10px;margin-top:'+(n===1?'0':'10px')+'"><div style="flex:0 0 auto;width:20px;height:20px;border-radius:50%;background:'+GOLD+';color:var(--sw-on-gold,#241a08);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:640;display:flex;align-items:center;justify-content:center">'+n+'</div><div style="flex:1;min-width:0"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.1em;margin-bottom:4px">'+label+'</div>'+body+'</div></div>';
}
function manualPayInstructionsHTML(t){
  // Antes distinguía 'Yape'/'Plin' según manualPayMethod — desde que se fusionaron los
  // botones de arriba en uno solo, el valor siempre es 'yape' así que ya no hace falta.
  // Bajado a 2 pasos reales (antes 3): "copia el monto" se quitó — el monto ya se ve
  // grande arriba de todo, copiarlo aparte no ahorraba nada (transferir 2-4 dígitos a
  // mano es más rápido que cambiar de app y pegar) y solo sumaba un tap sin valor real
  // (hallazgo directo del dueño probando el flujo). En el mismo espíritu se dejó UN solo
  // botón principal por plataforma en el paso de "transfiere" (antes había 2 botones que
  // hacían casi lo mismo: COPIAR NÚMERO y ABRIR YAPE, uno al lado del otro).
  var recurring=(function(){try{return localStorage.getItem('sw_yp_used')==='1';}catch(e){return false;}})();
  var mobile=isMobileUA();
  return'<div style="margin-top:10px;background:var(--sw-card2,#171A14);border:1px solid '+GOLD+';border-radius:10px;padding:14px 16px">'
    +'<div style="text-align:center;margin-bottom:14px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#9DA096);letter-spacing:.2em;margin-bottom:2px">Monto a transferir //</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:40px;font-weight:640;color:'+GOLD+'">'+SOLES+pz(t)+'</div></div>'
    +payStep(1,'Transfiere por Yape o Plin a','<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#1B1F18);border-radius:8px;padding:8px 10px"><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:640;color:#fff">'+YAPE_PLIN_PHONE+'</div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:8px;color:var(--sw-text-muted,#9DA096)">'+esc(YAPE_PLIN_NAME)+(recurring?' · ya usaste este número antes ✓':'')+'</div></div></div>'
      // El nombre que Yape muestra al escribir el número es el del TITULAR de la cuenta, no
      // el de la marca. Ver un nombre personal donde esperabas "SND//WCH" es el momento
      // exacto en que alguien se detiene a preguntarse si se equivocó de destinatario — y en
      // una transferencia manual esa duda es un pedido perdido. Decirlo antes la borra.
      +'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#9DA096);line-height:1.45;margin-top:8px;background:var(--sw-card,#1B1F18);border-radius:8px;padding:9px 11px">En Yape te va a aparecer a nombre de <b style="color:var(--sw-text-body,#EFEDE4)">'+esc(YAPE_PLIN_HOLDER)+'</b>. Es la cuenta del negocio — estás en el sitio correcto.</div>'
      // UN solo botón, igual en celular y en escritorio: copiar el número. La versión que
      // decía "Copiar número y abrir Yape" no abría Yape nunca — abría el Play Store. Ver
      // el comentario largo en `src/app/01-*` sobre por qué eso no tiene arreglo.
      +'<button onclick="copyYapePlinPhone()" style="all:unset;cursor:pointer;display:block;width:100%;text-align:center;margin-top:8px;background:'+GOLD+';color:var(--sw-on-gold,#241a08);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;padding:11px;border-radius:8px">'+iconTxt('phone','Copiar número','var(--sw-on-gold,#241a08)')+'</button>'
      // ── EL QR ES EL DE COBRO REAL DE YAPE, NO UNA TARJETA DE CONTACTO (2026-09-05) ──
      //
      // Hasta hoy acá se dibujaba un QR generado con el encoder propio que codificaba un
      // `MECARD:` — o sea una TARJETA DE CONTACTO. Escanearlo con la cámara guardaba el
      // número en la agenda; escanearlo DENTRO de Yape no hacía absolutamente nada, porque
      // Yape espera su propio formato emitido por el banco. El rótulo decía "escanea el
      // código QR", así que cualquiera esperaba pagar con él y no pasaba nada: el modo de
      // fallo era SILENCIO, y el dueño lo encontró probando el flujo.
      //
      // `img/yape-qr.png` es el QR personal de cobro que el dueño exportó de "Mi QR" en su
      // app de Yape. Ese sí cobra. NO se regenera ni se dibuja: es una imagen que solo el
      // dueño puede emitir, igual que el RUC o la razón social.
      //
      // Y se muestra ABIERTO en escritorio y plegado en celular a propósito: en la compu el
      // QR es LA vía (lo escaneas con el celular), mientras que en el celular no puedes
      // escanear tu propia pantalla y lo útil es el número. Antes estaba plegado en los dos.
      +'<div style="text-align:center;margin-top:8px"><span onclick="toggleYapeQR()" style="cursor:pointer;font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#9DA096);text-decoration:underline;letter-spacing:.05em">'+((showYapeQR||!mobile)?'ocultar código QR':'o paga escaneando nuestro QR de Yape')+'</span></div>'
      +((showYapeQR||!mobile)?'<div style="display:flex;flex-direction:column;align-items:center;margin-top:10px"><div style="padding:8px;background:#fff;border-radius:10px;line-height:0"><img src="img/yape-qr.png" alt="Código QR de Yape para pagar a '+esc(YAPE_PLIN_HOLDER)+'" width="148" height="148" style="display:block;width:148px;height:148px"></div><div style="font-family:\'EB Garamond\',serif;font-size:9px;color:var(--sw-text-muted,#9DA096);margin-top:6px;text-align:center;max-width:220px">'+(mobile?'Escanéalo desde otro celular, o usa el número de arriba.':'Abre Yape en tu celular y escanea este código.')+'</div></div>':'')
      +'<div id="ypc-msg" style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-ok,#25D366);margin-top:6px;min-height:12px"></div>')
    +payStep(2,'Confirma aquí abajo','<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#9DA096);line-height:1.4">Toca "Ya realicé el pago". Tu pedido pasa a cocina recién cuando lo verifiquemos.</div>')
    +'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#9DA096);margin-top:12px;opacity:.85;display:flex;align-items:center;gap:5px">'+icon('lock',12,'#9DA096')+'<span>Nunca te pediremos tu clave, tu PIN ni un código que te llegue por SMS.</span></div>'
    +'</div>';
}
function copyYapePlinPhone(){
  var m=(document.getElementById('ypc-msg') as HTMLElement | null);
  // Devuelve el verde: `yapeOpenFailed()` deja el renglón en ámbar, y sin esto un segundo
  // toque mostraría "✓ Número copiado" pintado como si fuera un aviso de error.
  if(m)m.style.color='var(--sw-ok,#25D366)';
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(YAPE_PLIN_PHONE).then(function(){if(m)m.textContent='✓ Copiado — ahora abre Yape y pégalo';}).catch(function(){if(m)m.textContent=YAPE_PLIN_PHONE;});
  }else if(m){m.textContent=YAPE_PLIN_PHONE;}
}
// Subir captura del comprobante (item 12, opcional) — se comprime en el propio celular
// antes de mandarla (canvas, máx. 1000px de lado, JPEG calidad .7) para no depender de
// que el edge function reciba fotos de 5-10MB tal cual las entrega la cámara.
function handleReceiptFile(ev){
  var input=ev&&ev.target;
  var file=input&&input.files&&input.files[0];
  if(input)input.value='';
  if(!file)return;
  if(!/^image\//.test(file.type)){receiptUploadState='error:Selecciona una imagen (foto o captura de pantalla).';render();return;}
  receiptUploadState='uploading';render();
  var reader=new FileReader();
  reader.onload=function(){
    var img=new Image();
    img.onload=function(){
      var maxDim=1000;
      var scale=Math.min(1,maxDim/Math.max(img.width,img.height));
      var w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
      var canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      var ctx=canvas.getContext('2d');
      if(!ctx){receiptUploadState='error:No se pudo procesar la imagen.';render();return;}
      ctx.drawImage(img,0,0,w,h);
      var base64=canvas.toDataURL('image/jpeg',.7).split(',')[1]||'';
      uploadReceiptBase64(base64);
    };
    img.onerror=function(){receiptUploadState='error:No se pudo leer la imagen.';render();};
    img.src=String(reader.result||'');
  };
  reader.onerror=function(){receiptUploadState='error:No se pudo leer el archivo.';render();};
  reader.readAsDataURL(file);
}
async function uploadReceiptBase64(base64){
  try{
    await api('upload-receipt',{ref:window._lRef,imageBase64:base64,mime:'image/jpeg'});
    receiptUploadState='done';
  }catch(e){
    receiptUploadState='error:'+(e.message||'No se pudo subir el comprobante.');
  }
  render();
}
// Etiqueta del botón de pago principal — compartida entre TU CARRITO y el pago directo
// de un solo sándwich, ya que ambos ofrecen los mismos métodos de pago.
function payButtonLabel(t,fallback){
  if(t===0)return'Confirmar pedido gratis //';
  if(useCredit&&cust&&(cust.credit_balance||0)>=t)return'Confirmar con crédito //';
  if(manualPayMethod)return'Ya realicé el pago //';
  return fallback;
}
// ── 30 G · EL PEDIDO ES UN RECIBO DE ESTRAZA (aprobada) + renglones y hojas ────────────────
// docs/maquetas/aprobadas/30G-el-carrito.png y 30G-*.png (camino de compra, 2026-09-25).
// Reemplaza «Confirmar sándwich» y «Tu carrito». Todo lo que se decide antes de pagar es un
// renglón del mismo recibo —LLEGA, DÓNDE, RECIBE, y PUNTOS o CÓDIGO cuando aplican— y cada uno
// abre una hoja o la 34. Las cuentas salen de cartDesglose()/payableTotal(), las mismas que
// cobra el servidor: acá no se suma nada por cuenta propia.
var hoja30:string|null=null,hojaLinea=-1,hojaErr='';
function cuantasCosas(n:number):string{
  var p=['','Una cosa','Dos cosas','Tres cosas','Cuatro cosas','Cinco cosas','Seis cosas','Siete cosas','Ocho cosas','Nueve cosas','Diez cosas'];
  return p[n]||(n+' cosas');
}
function lineaNombre(it:any):string{
  var x=it.qty>1?' ×'+it.qty:'';
  if(it.type==='side'){var d=SIDES.find(function(y){return y.id===it.code;});return(d?d.l:'')+x;}
  if(it.type==='sig'){var s=SIGS.find(function(y){return y.id===it.sigId;});return(s?s.n:'')+' '+it.size+'CM'+x;}
  return'Arma el tuyo '+it.size+'CM'+x;
}
function lineaDetalle(it:any):string{
  if(it.type==='side'){var d=SIDES.find(function(y){return y.id===it.code;});return d?d.s:'';}
  var partes:string[]=[];
  if(it.type==='byo'){var p=PROTS.find(function(y){return y.id===it.prot;});if(p)partes.push(p.l+(p.s?' '+p.s:''));}
  var ex=itemExtrasLabel(it);if(ex)partes.push(ex);
  if(it.note)partes.push(it.note);
  return partes.join(' · ');
}
function llegaTexto():string{
  if(scheduleMode==='later'&&schedSlot){
    return(schedDay==='today'?'Hoy ':'Mañana ')+horaDoceMin(schedSlot);
  }
  return ventanaEstimadaTexto(null)||'Lo antes posible';
}
function horaDoceMin(hhmm:string):string{
  var h=+hhmm.slice(0,2),m=hhmm.slice(3,5),suf=h<12?'a.m.':'p.m.',x=h%12===0?12:h%12;
  return x+':'+m+' '+suf;
}
// La dirección está lista con el texto y el pin: el envío se cobra por distancia real y el distrito
// ya no limita nada (dueño, 2026-09-30: «ya no hay limitante con distrito»). Exigirlo dejaba al
// cliente en un bucle 30G → 34 → mapa cuando el geocodificador no lo reconocía.
function direccionLista():boolean{return!!addrText&&deliveryKmNow()!==null;}
function recibeListo():boolean{return!!confNom.trim()&&confPhone.replace(/\D/g,'').length>=6;}
// La mejor recompensa que ESTE pedido puede usar ahora (la que más perdona). null si ninguna.
function recompensaUsable(){
  if(!cust)return null;
  var mejor:any=null,ahorro=0;
  RWDS.forEach(function(r){
    if((cust.points||0)<r.pts)return;
    var i=findRewardTargetIndex(r.id);if(i<0)return;
    var a=rewardWaiverAmount(r.id,i);
    if(a>ahorro){ahorro=a;mejor=r;}
  });
  return mejor;
}
function en30(etq:string,valor:string,accion:string,fn:string,falta?:boolean){
  return'<button class="en'+(falta?' falta':'')+'" onclick="'+fn+'"><em>'+etq+'</em><n>'+esc(valor)+'</n><u>'+accion+'</u></button>';
}
function sOCart(){
  aplicarMetodoPreferido();
  if(!cart.length){
    return'<div class="m30 kraft fi"><button class="sal" onclick="go(\'o_home\')" aria-label="Volver">←</button>'
      +'<div class="tit"><em>Todavía nada</em><b>Tu pedido<br>está vacío</b></div>'
      +'<div class="vk">'+VACIO('Carrito vacío','Elige un Signature o arma el tuyo — todo se junta acá antes de pagar.',null,'piensa')+'</div></div>';
  }
  var d=cartDesglose();
  var envio=deliveryFeeAmount();
  var dirOk=direccionLista(),recOk=recibeListo();
  // El combo se ve EN la bebida: precio de carta tachado y al lado lo que se cobra (dueño,
  // 2026-10-01). Los pares se reparten entre las bebidas en orden; la suma es exactamente d.combo,
  // que es lo que cobra el servidor, así que el total no cambia.
  var paresCombo=COMBO_DISCOUNT_PER_PAIR>0?Math.round(d.combo/COMBO_DISCOUNT_PER_PAIR):0;
  var lineas=cart.map(function(it,i){
    var total=itemLineTotal(it),desc=0;
    if(it.type==='side'&&paresCombo>0){var u=Math.min(it.qty||1,paresCombo);paresCombo-=u;desc=u*COMBO_DISCOUNT_PER_PAIR;}
    var det=lineaDetalle(it);
    if(desc>0)det=(det?det+' · ':'')+'en combo';
    return'<button class="li" onclick="hojaLinea='+i+';hoja30=\'linea\';render()"><i>'+String(i+1).padStart(2,'0')+'</i>'
      +'<span class="q"><b>'+esc(lineaNombre(it))+'</b>'+(det?'<s>'+esc(det)+'</s>':'')+'</span>'
      +'<p>'+(desc>0?'<del>'+pz(total)+'</del> '+pz(total-desc):pz(total))+'</p></button>';
  }).join('');
  var ex='';
  if(d.organizador.monto>0)ex+='<div class="ex"><span>Sándwich del organizador</span><span>−'+pz(d.organizador.monto)+'</span></div>';
  if(appliedReward){var rw=RWDS.find(function(x){return x.id===appliedReward;});var ra=rewardWaiverAmount(appliedReward,findRewardTargetIndex(appliedReward));if(ra>0)ex+='<div class="ex"><span>'+esc(rw?rw.n:'Recompensa')+'</span><span>−'+pz(ra)+'</span></div>';}
  if(appliedPromo)ex+='<div class="ex"><span>Código '+esc(appliedPromo.code)+'</span><span>−'+pz(appliedPromo.discount)+'</span></div>';
  ex+=dirOk&&envio>0
    ?'<div class="ex"><span>Envío '+deliveryKmNow()+' km</span><span>'+pz(envio)+'</span></div>'
    :'<div class="ex"><span>Envío</span><span>Al elegir dónde</span></div>';
  var rw2=!appliedPromo?recompensaUsable():null;
  var renglones=en30('Llega',llegaTexto(),'Programar',"hoja30='programar';initSchedDefault();render()")
    +en30('Dónde',dirOk?addrText:'¿Dónde te lo dejamos?',dirOk?'Cambiar':'Elegir',"go('o_dir')",!dirOk)
    +en30('Recibe',recOk?confNom.trim()+' · '+confPhone:'¿A nombre de quién?',recOk?'Cambiar':'Poner',"hoja30='recibe';hojaErr='';render()",!recOk)
    +(cust&&!appliedPromo&&(appliedReward||rw2)
      ?(appliedReward
        ?en30('Puntos','Canjeando: '+((RWDS.find(function(x){return x.id===appliedReward;})||{n:''}).n),'Quitar',"toggleReward('"+appliedReward+"')")
        :en30('Puntos','Tienes '+(cust.points||0)+' · '+rw2.n.toLowerCase(),'Usar',"toggleReward('"+rw2.id+"')"))
      :'')
    +(!appliedReward
      ?(appliedPromo?en30('Código',appliedPromo.code,'Quitar','removePromoCode()'):en30('Código','¿Tienes uno?','Poner',"hoja30='codigo';hojaErr='';render()"))
      :'');
  var t=payableTotal();
  var sinEnvio=!dirOk||envio===0;
  var h='<div class="m30 kraft fi"><button class="sal" onclick="go(\'o_home\')" aria-label="Seguir pidiendo">←</button>'
    +'<div class="tit"><em>Va saliendo</em><b>'+esc(cuantasCosas(cart.length)).replace(' ','<br>')+'</b></div>'
    +'<div class="papel"><div class="cinta c1"></div><div class="cinta c2"></div><div class="sello">'
    +'<div class="hd"><span>SND//WCH · TRUJILLO</span><span></span></div>'
    +lineas+ex+renglones
    +'<div class="tt"><em>'+(sinEnvio?'Sin envío':'Total')+'</em><b>'+SOLES_TXT+pz(t)+'</b></div>'
    +'</div></div>'
    +'<div class="err" id="o-err" role="alert"></div>'
    // Maqueta aprobada grupo-4: el pedido se puede volver grupo sin perder lo elegido. No se
    // ofrece si el pedido ya viene de un grupo.
    +(!pendingGroupCode&&cart.some(function(it){return it.type!=='side';})
      ?'<div class="grupo30"><b>¿Pides para más gente?</b><span>Hazlo grupo: comparte el enlace y cada uno suma el suyo. '+esc(textoGrupoGratis().replace(/^c/,'C'))+'.</span><button onclick="empezarGrupo(true)">Convertir en grupo →</button></div>'
      :'')
    +'<div class="hermanos" aria-hidden="true"><img class="s" src="'+broPose('sando','saluda')+'" alt=""><img class="w" src="'+broPose('wicho','alegre')+'" alt=""></div>'
    +'</div>'
    +hoja30HTML()
    +'<div class="m30-go sw-barra">'+(hoja30?'<button class="oro" onclick="hojaListo()">'+hojaBoton()+'</button>'
      :'<button class="oro" onclick="irAPagar()">Pagar</button><button class="cel" onclick="irAPagar()">'+SOLES_TXT+pz(t)+(sinEnvio?' + envío':'')+'</button>')+'</div>';
  return h;
}
function hojaBoton(){return hoja30==='codigo'?'Aplicar':hoja30==='linea'?'Listo':'Listo';}
function cerrarHoja(){hoja30=null;hojaLinea=-1;hojaErr='';render();}
function hoja30HTML(){
  if(!hoja30)return'';
  var cuerpo='';
  if(hoja30==='recibe'){
    cuerpo='<em>Para el motorizado</em><h3>¿Quién lo<br>recibe?</h3>'
      +'<label class="campo"><s>Nombre</s><input id="o-nom" type="text" autocomplete="name" value="'+esc(confNom)+'"></label>'
      +'<label class="campo"><s>Celular</s><input id="o-phone" type="tel" inputmode="tel" autocomplete="tel" value="'+esc(confPhone)+'"></label>'
      +'<div class="err" role="alert">'+esc(hojaErr)+'</div>'
      +'<div class="nota">Solo para avisarte y para que el motorizado te ubique.<br>No te creamos ninguna cuenta.</div>';
  }else if(hoja30==='programar'){
    var dias=[{k:'today',l:'Hoy'},{k:'tomorrow',l:'Mañana'}];
    var slots=schedSlotsDetailed(schedDay);
    cuerpo='<em>Lo programas</em><h3>¿A qué<br>hora?</h3>'
      +'<div class="dias">'+dias.map(function(x){
        var cerrado=!STORE_HOURS[limaDayHour(schedDateForDay(x.k)).weekday];
        return'<button aria-pressed="'+(schedDay===x.k)+'"'+(cerrado?' disabled':'')+' onclick="schedDay=\''+x.k+'\';schedSlot=null;initSchedDefault();render()">'+x.l+'</button>';
      }).join('')
      +(scheduleMode==='later'?'<button onclick="scheduleMode=\'now\';schedSlot=null;hoja30=null;render()">Lo antes posible</button>':'')+'</div>'
      +(slots.length
        ?'<div class="fr">'+slots.map(function(s){return'<button aria-pressed="'+(scheduleMode==='later'&&schedSlot===s.t)+'"'+(s.full?' disabled':'')+' onclick="scheduleMode=\'later\';schedSlot=\''+s.t+'\';render()">'+s.t+'</button>';}).join('')+'</div>'
        :'<div class="nota">No hay horarios disponibles ese día.</div>')
      +'<div class="nota" style="margin-top:14px">Las tachadas ya están llenas.<br>Te llega en la media hora que elijas.</div>';
  }else if(hoja30==='codigo'){
    cuerpo='<em>Descuento</em><h3>¿Tienes un<br>código?</h3>'
      +'<label class="campo"><s>El código</s><input id="o-promo" type="text" autocapitalize="characters" value=""></label>'
      +'<div class="err" id="o-promo-status" role="alert">'+esc(hojaErr||promoStatus||'')+'</div>'
      +'<div class="nota">Se aplica sobre la comida, no sobre el envío.<br>Si no vale, te decimos por qué.</div>';
  }else if(hoja30==='linea'){
    var it=cart[hojaLinea];
    if(!it){hoja30=null;return'';}
    cuerpo='<em>Esta línea</em><h3>'+esc(lineaNombre(Object.assign({},it,{qty:1})))+'</h3>'
      +'<div class="cant"><button onclick="cambiarCantidad('+hojaLinea+',-1)" aria-label="Uno menos">−</button><b>'+it.qty+'</b><button onclick="cambiarCantidad('+hojaLinea+',1)" aria-label="Uno más">+</button></div>'
      +(it.type!=='side'?'<button class="op" onclick="hoja30=null;editCartItem('+hojaLinea+')"><span>Cambiarle algo</span><u>Editar</u></button>'
        +'<button class="op" onclick="editItemNote('+hojaLinea+')"><span>'+esc(it.note?'Nota: '+it.note:'Una nota para la cocina')+'</span><u>'+(it.note?'Cambiar':'Poner')+'</u></button>':'')
      +'<button class="op" onclick="quitarLinea('+hojaLinea+')"><span>Sacarla del pedido</span><u>Quitar</u></button>';
  }
  return'<div class="hvelo" onclick="cerrarHoja()"></div><div class="hoja" role="dialog" aria-modal="true">'+cuerpo+'</div>';
}
function cambiarCantidad(i:number,delta:number){
  var it=cart[i];if(!it)return;
  it.qty=Math.max(1,Math.min(20,it.qty+delta));
  saveCart();render();
}
function quitarLinea(i:number){
  cart.splice(i,1);
  if(appliedReward&&findRewardTargetIndex(appliedReward)<0)appliedReward=null;
  saveCart();hoja30=null;hojaLinea=-1;render();
}
async function hojaListo(){
  if(hoja30==='recibe'){
    var n=(document.getElementById('o-nom') as HTMLInputElement|null),p=(document.getElementById('o-phone') as HTMLInputElement|null);
    confNom=n?n.value:confNom;confPhone=p?p.value:confPhone;
    if(!confNom.trim()){hojaErr='Escribe a nombre de quién va.';render();return;}
    if(confPhone.replace(/\D/g,'').length<6){hojaErr='Escribe un celular válido.';render();return;}
    hoja30=null;hojaErr='';render();return;
  }
  if(hoja30==='codigo'){
    var el=(document.getElementById('o-promo') as HTMLInputElement|null);
    if(!el||!el.value.trim()){hojaErr='Escribe el código.';render();return;}
    if(!cust&&confPhone.replace(/\D/g,'').length<6){hojaErr='Primero dinos a nombre de quién va (el celular).';render();return;}
    hojaErr='';
    await applyPromoCode();
    if(appliedPromo){hoja30=null;promoStatus='';render();}
    return;
  }
  hoja30=null;render();
}
// PAGAR: lo que falta se resuelve donde vive (la 34 o la hoja de RECIBE); después la 31.
var FALTA_SANDWICH='Las bebidas van con un sándwich: agrega uno para pedir.';
function faltaSandwich():boolean{return cart.length>0&&!cart.some(function(it:any){return it.type!=='side';});}
function irAPagar(){
  // Antes de pedir dirección o datos: a quien solo lleva bebidas no se le hace llenar todo para
  // decirle al final que no puede pagar.
  if(faltaSandwich()){var e0=document.getElementById('o-err');if(e0)e0.textContent=FALTA_SANDWICH;else showToast(FALTA_SANDWICH,'error');return;}
  if(!direccionLista()){go('o_dir');return;}
  if(!recibeListo()){hoja30='recibe';hojaErr='';render();return;}
  var err=problemaDelPedido();
  if(err){var e=document.getElementById('o-err');if(e)e.textContent=err;else showToast(err,'error');return;}
  go('o_pagar');
}

// ── 34 · DÓNDE TE LO DEJAMOS (aprobada, fuente i1.html #D) ────────────────────────────────
// Las direcciones guardadas con su distancia y su envío (kmADireccion/envioADireccion, la
// misma cuenta del cobro). «Otra dirección» abre el mapa: el costo se sabe al marcarla.
var dirElegida:any=null;
function sODir(){
  var lista=cust?myAddresses:[];
  if(dirElegida===null&&pickedAddrId!=null)dirElegida=pickedAddrId;
  var tarjetas=lista.map(function(a){
    var km=kmADireccion(a),env=envioADireccion(a);
    var sel=dirElegida!=null&&mismoId(dirElegida,a.id);
    return'<button class="et" aria-pressed="'+sel+'" onclick="dirElegida='+JSON.stringify(a.id).replace(/"/g,'&quot;')+';render()">'
      +'<span class="hd"><span>'+esc(a.label||'Guardada')+'</span><span>'+(km!=null?km.toFixed(1)+' km':'—')+'</span></span>'
      +'<b>'+esc(a.address)+'</b>'+(a.reference?'<s>'+esc(a.reference)+'</s>':'')
      +'<span class="pie"><i>'+(env!=null?'Envío '+SOLES_TXT+pz(env):'Márcala en el mapa')+'</i><u>Editar</u></span></button>';
  }).join('');
  var sel=lista.find(function(a){return dirElegida!=null&&mismoId(dirElegida,a.id);});
  var envSel=sel?envioADireccion(sel):null;
  return'<div class="m34 kraft fi"><button class="sal" onclick="dirElegida=null;go(\'o_cart\')" aria-label="Volver">←</button>'
    +'<div class="tit"><em>'+(lista.length?'Tus direcciones':'Tu dirección')+'</em><b>Dónde te<br>lo dejamos</b></div>'
    +tarjetas
    +'<button class="et otra" onclick="otraDireccion()"><span class="hd"><span>Agregar</span><span>—</span></span>'
    +'<b>Otra dirección</b><s>Te decimos el costo apenas la marques en el mapa</s></button>'
    // La nota de la maqueta («Fuera de los distritos que cubrimos no llegamos todavía») se quitó:
    // desde el 2026-09-30 no hay zonas ni tope de distancia (dueño). Una promesa que ya no es cierta.
    +'</div>'
    // Una guardada SIN pin se ubica en el mapa ELLA MISMA y queda guardada con su pin (dueño,
    // 2026-10-01: «pide marcar en mapa aún si seleccionas una dirección guardada, luego no deja
    // seleccionar en el mapa o ir a pagar»). Antes el botón abría el mapa para una dirección nueva.
    +'<div class="m30-go sw-barra">'+(sel&&envSel!=null
      ?'<button class="oro" onclick="usarDireccion()">Usar esta</button><button class="cel" onclick="usarDireccion()">'+SOLES_TXT+pz(envSel)+'</button>'
      :sel
        ?'<button class="oro solo" onclick="abrirMapaPara(\'o_cart\','+esc(JSON.stringify(sel.id))+','+esc(JSON.stringify(sel.address||''))+')">Ubicar «'+esc(sel.label||'esta')+'» en el mapa</button>'
        :'<button class="oro solo" onclick="otraDireccion()">Marcar en el mapa</button>')+'</div>';
}
function usarDireccion(){
  if(dirElegida==null)return;
  pickAddr(dirElegida);
  dirElegida=null;
  go('o_cart');
}
// El mapa de siempre (openMap/confirmMap): al confirmarlo deja dirección, distrito y
// coordenadas, y se vuelve a la 30G.
var volverDelMapa=false;
function otraDireccion(){
  volverDelMapa=true;
  abrirUbicacion();
}

// ── 31 · PAGAR CON YAPE (e1.html #Q) · CON TARJETA (y1.html #P) — aprobadas ──────────────
// Yape es el medio por defecto (no suma comisión). La diferencia con tarjeta sale de
// deliveryFeeAmount() con y sin comisión: nunca se escribe.
function totalCon(tarjeta:boolean){
  var antes=manualPayMethod;
  manualPayMethod=tarjeta?null:'yape';
  var t=payableTotal();
  manualPayMethod=antes;
  return t;
}
function montoPartido(v:number){
  var s=pz(v),k=s.indexOf('.');
  return SOLES_TXT+(k<0?s:s.slice(0,k)+'<i>'+s.slice(k)+'</i>');
}
var pagarErr='';
function sOPagar(){
  var t=payableTotal();
  var envio=deliveryFeeAmount();
  if(t===0||(useCredit&&cust&&(cust.credit_balance||0)>=t)){
    // Sin nada que cobrar (recompensa que cubre todo, o crédito): no hay pasarela que explicar.
    return'<div class="m31 t fi"><button class="sal" onclick="go(\'o_cart\')" aria-label="Volver">←</button>'
      +'<div class="cab"><em>'+(t===0?'No pagas nada':'Pagas con tu crédito')+'</em><u></u></div>'
      +'<div class="mt"><b>'+montoPartido(t)+'</b></div>'
      +'<div class="err" role="alert">'+esc(pagarErr)+'</div></div>'
      +'<div class="m30-go sw-barra"><button class="oro" onclick="confirmarPago()">Confirmar</button></div>';
  }
  if(manualPayMethod){
    var conTarjeta=totalCon(true);
    return'<div class="m31 y fi"><button class="sal" onclick="go(\'o_cart\')" aria-label="Volver">←</button>'
      +'<div class="cab"><em>Pagar con Yape</em><u></u></div>'
      +'<div class="mt"><b>'+montoPartido(t)+'</b><s>'+(envio>0?'Envío '+SOLES_TXT+pz(envio)+' incluido<br>':'')+'No se suma nada más</s></div>'
      +'<div class="visor"><img src="img/yape-qr.png" alt="Código QR de Yape para pagar a '+esc(YAPE_PLIN_HOLDER||'')+'"><b class="a"></b><b class="b"></b><b class="c"></b><b class="d"></b></div>'
      +'<div class="esc">Escanea desde Yape</div>'
      +'<button class="alt" onclick="selectPayMethod(\'culqi\');render()"><n>Prefiero tarjeta</n><s>Son '+SOLES_TXT+pz(money(conTarjeta-t))+' más</s></button>'
      +'<div class="fr">Apenas confirmes,<br>el pedido entra a la cocina</div>'
      +'<img class="h" style="left:-14px;bottom:68px;width:112px" src="'+broPose('sando','cuerpo')+'" alt="" aria-hidden="true">'
      +'<img class="h" style="right:-16px;bottom:68px;width:124px" src="'+broPose('wicho','cuerpo')+'" alt="" aria-hidden="true">'
      +'<div class="err" role="alert">'+esc(pagarErr)+'</div>'
      +'</div>'
      +'<div class="m30-go sw-barra"><button class="oro" onclick="confirmarPago()">Ya pagué</button><button class="cel" onclick="confirmarPago()">'+SOLES_TXT+pz(t)+'</button></div>';
  }
  var conYape=totalCon(false);
  return'<div class="m31 t fi"><button class="sal" onclick="go(\'o_cart\')" aria-label="Volver">←</button>'
    +'<div class="cab"><em>Pagas con tarjeta</em><u></u></div>'
    +'<div class="mt"><b>'+montoPartido(t)+'</b><div class="av"><k>'+SOLES_TXT+pz(conYape)+' con Yape</k>'
    +'<s>+'+SOLES_TXT+pz(money(t-conYape))+' de comisión, sobre el envío</s></div></div>'
    +'<div class="paso"><div class="p"><k>1</k><div class="t"><b>Se abre la ventana de Culqi</b><s>La pasarela, no nosotros</s></div></div>'
    +'<div class="p"><k>2</k><div class="t"><b>Escribes tu tarjeta ahí</b><s>Nunca en esta app</s></div></div>'
    +'<div class="p"><k>3</k><div class="t"><b>Vuelves y entra a la cocina</b><s>Te avisamos apenas salga</s></div></div></div>'
    +'<div class="seg"><em>Qué vemos nosotros</em><s>Si el pago salió bien y los 4 últimos dígitos.<br>Ni el número completo ni el CVV pasan por acá.</s></div>'
    +'<button class="vol" onclick="selectPayMethod(\'yape\');render()"><n>Mejor con Yape</n><s>No se suma nada</s></button>'
    +'<img class="mano" src="'+broPose('sando','pulgar')+'" alt="" aria-hidden="true">'
    +'<div class="fr">Si la ventana no abre,<br>vuelve y elige Yape.</div>'
    +'<div class="err" role="alert">'+esc(pagarErr)+'</div>'
    +'</div>'
    +'<div class="m30-go sw-barra"><button class="oro" onclick="confirmarPago()">Ir a pagar</button><button class="cel" onclick="confirmarPago()">'+SOLES_TXT+pz(t)+'</button></div>';
}
function confirmarPago(){pagarErr='';doOrder(true);}

var _pendingOrder=null;
// Lo que impide pagar, o null. Lee el ESTADO del pedido (confNom, addrText, schedSlot…), no
// campos de un formulario: la 30G guarda cada dato en su renglón. El servidor vuelve a validar.
function problemaDelPedido():string|null{
  if(!cart.length)return'Tu pedido está vacío.';
  // Las bebidas se ven y se entra a ellas directo, pero van con un sándwich (dueño, 2026-09-30).
  // El servidor lo exige igual (assertTraeSandwich en orders.ts): esto solo lo avisa antes.
  if(faltaSandwich())return FALTA_SANDWICH;
  if(!confNom.trim())return'Falta a nombre de quién va el pedido.';
  if(!addrText.trim())return'Falta dónde te lo dejamos.';
  if(addressInExcludedZone(addressWithDistrict(addrText.trim(),deliveryDistrict)))return'Por ahora tu zona aún no está disponible para delivery, pero esperamos poder llegar pronto.';
  if(confPhone.replace(/\D/g,'').length<6)return'Ingresa un celular de contacto válido.';
  if(scheduleMode==='later'){
    var v=schedInputValue();
    if(!v)return'Elige una hora para tu pedido programado.';
    var d=new Date(v);
    if(isNaN(d.getTime())||d.getTime()<Date.now()-60000)return'La hora programada no es válida.';
    if(!isWithinStoreHours(d))return'Esa hora está fuera de nuestro horario de atención.';
    if(hourIsFull(d))return'Esa hora se llenó mientras armabas el pedido. Elige otra en «Programar».';
  }else if(!storeStatus().open){
    return'Estamos cerrados ahora mismo. Toca «Programar» para pedir dentro de nuestro horario.';
  }else if(hourIsFull(new Date())){
    var libre=nextFreeSlot();
    return libre?'Esta hora ya está completa. La más cercana libre es '+libre.label+' a las '+libre.slot+': elígela en «Programar».'
      :'Esta hora ya está completa — la cocina no da abasto para más pedidos ahora mismo. Prueba con otro día.';
  }
  if(!businessLaunched)return'Todavía no abrimos. Te avisamos apenas arranquemos.';
  if(deliveryKmNow()===null)return'Marca tu ubicación en el mapa para calcular el envío: se cobra por distancia real.';
  return null;
}
// `desdePagar`: viene de la 31, que ES la confirmación (se ve el monto y el QR); no se vuelve a
// preguntar «¿ya transferiste?».
async function doOrder(desdePagar?){
  if(_payingInProgress)return;
  if(!cart.length)return;
  if(appliedReward&&findRewardTargetIndex(appliedReward)<0)appliedReward=null;
  var problema=problemaDelPedido();
  if(problema){
    pagarErr=problema;
    var errEl=(document.getElementById('o-err') as HTMLInputElement | null);
    if(sndScreen==='o_pagar')render();else if(errEl)errEl.textContent=problema;else showToast(problema,'error');
    return;
  }
  var nom=confNom.trim(),phone=confPhone.trim(),email=confEmail.trim(),notes=confNotes.trim();
  var addr=addressWithDistrict(addrText.trim(),deliveryDistrict);
  var schedIso=scheduleMode==='later'?new Date(schedInputValue()).toISOString():null;
  pagarErr='';
  var ref=oref();
  var t=payableTotal();
  var rewardObj=appliedReward?RWDS.find(function(x){return x.id===appliedReward;}):null;
  var rewardTargetIdx=appliedReward?findRewardTargetIndex(appliedReward):-1;
  var itemSummaries=cart.map(function(it){var extras=itemExtrasLabel(it);return it.qty+'x '+itemLabel(it)+(extras?' ('+extras+')':'');});
  var summary=itemSummaries.join(' · ')+(rewardObj?' · Recompensa: '+rewardObj.n+' '+rewardObj.s:'');
  var lines=['*PEDIDO SND//WCH*','Ref: '+ref,'','👤 '+nom,'📱 '+phone,'📍 '+addr,''];
  cart.forEach(function(it,idx){
    var extras=itemExtrasLabel(it);
    lines.push((idx+1)+') '+it.qty+'x '+itemLabel(it)+(extras?' — '+extras:'')+' — S/'+pz(itemLineTotal(it)));
    if(idx===rewardTargetIdx&&rewardObj)lines.push('   🎁 '+rewardObj.n+' // '+rewardObj.s);
  });
  if(notes)lines.push('','📝 '+notes);
  var _km=deliveryKmNow();
  lines.push('','🛵 Delivery ('+(_km===null?(DELIVERY_PRICE_ZONES.find(function(z){return z.id===deliveryZone;})||{}).l:_km.toFixed(1)+' km')+'): S/'+deliveryFeeAmount());
  lines.push('*TOTAL: S/'+t+'*');
  if(cust)lines.push('Cliente: '+cust.name+' ('+cust.phone+')');
  var ingredients=[];
  cart.forEach(function(it){
    if(it.type==='side'){for(var k=0;k<it.qty;k++)ingredients.push(it.code);return;}
    var sig=it.type==='sig'?SIGS.find(function(x){return x.id===it.sigId;}):null;
    var baseCode=it.type==='sig'?sig.base:it.base;
    var protCode=it.type==='sig'?sig.prot:it.prot;
    var topsArr=it.type==='sig'?sig.tops:it.tops;
    var saucesArr=it.type==='sig'?sig.sauces:it.sauces;
    // Queso opcional (SIG02) manda el mismo campo `cheese` que BUILD YOUR OWN.
    var cheeseCode=it.cheese||null;
    for(var q=0;q<it.qty;q++){
      ingredients.push(baseCode,protCode);
      ingredients=ingredients.concat(topsArr);
      if(cheeseCode)ingredients.push(cheeseCode);
      ingredients=ingredients.concat(saucesArr);
      if(it.doubleProt)ingredients.push(protCode);
    }
  });
  _payingInProgress=true;
  _pendingOrder={ref:ref,nom:nom,phone:phone,addr:addr,email:email,notes:notes,summary:summary,total:t,waLines:lines,items:cart.map(function(it){return Object.assign({},it);}),ingredients:ingredients,scheduledFor:schedIso,rewardId:appliedReward,deliveryZone:deliveryZone,deliveryFee:deliveryFeeAmount(),promoCode:appliedPromo?appliedPromo.code:null,
    // Coordenadas del pin que el cliente confirmó en el mapa (confirmMap()). Hasta ahora
    // se guardaban solo en window._mLat/_mLon y se usaban únicamente para pintarle a él
    // un link de Google Maps — nunca llegaban al servidor, así que las columnas lat/lon
    // de `orders` quedaban siempre vacías y quien reparte recibía solo texto. En una
    // ciudad con numeración poco confiable eso es la causa directa de entregas fallidas.
    lat:typeof window._mLat==='number'?window._mLat:null,lon:typeof window._mLon==='number'?window._mLon:null};
  if(t===0){
    payAsRewardOnly();
  }else if(useCredit&&cust&&(cust.credit_balance||0)>=t){
    payWithCredit();
  }else if(manualPayMethod){
    // Antes un solo tap en "YA REALICÉ EL PAGO" creaba el pedido de inmediato — sin
    // ningún cobro real detrás que lo confirme (a diferencia de Culqi), un tap
    // accidental generaba un pedido 'pending' real que el admin tenía que revisar y
    // descartar a mano sin que el cliente hubiera transferido nada todavía.
    if(!desdePagar&&!(await showConfirm('¿Ya transferiste '+SOLES_TXT+pz(t)+' por Yape o Plin a '+YAPE_PLIN_PHONE+'? Tu pedido pasa a cocina recién cuando confirmemos que llegó.'))){
      _payingInProgress=false;render();return;
    }
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
    res=await api('place-order',Object.assign({token:token,ref:po.ref,name:po.nom,phone:po.phone,email:po.email,address:po.addr,notes:po.notes,summary:po.summary,total:po.total,items:po.items,ingredients:po.ingredients,scheduledFor:po.scheduledFor,rewardId:po.rewardId,deliveryZone:po.deliveryZone,promoCode:po.promoCode,lat:po.lat,lon:po.lon},metaAttribution(),extraFields||{}));
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
function payWithManualMethod(){
  // Marca que este cliente ya pasó por el flujo de transferencia manual — se usa solo
  // para mostrarle un "ya usaste este número antes ✓" la próxima vez (item 9 de la
  // lista de fricción Yape/Plin), nunca para nada que afecte el pedido en sí.
  try{localStorage.setItem('sw_yp_used','1');}catch(e){}
  return placeOrderDirect('Registrando tu pedido...',{paymentMethod:manualPayMethod});
}
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
// ── UN FALLO CON TARJETA NUNCA ES MUDO (2026-10-01) ──────────────────────────────────────
// Dueño: «Pagar con culqi no funciona». No había ni una reserva ni un error registrado: el
// motivo salía en un aviso de segundos, porque en la pantalla Pagar no existe #o-err. Ahora
// el motivo queda escrito en la pantalla (pagarErr) y además llega al resumen diario.
function falloConTarjeta(donde:string,msg:string,detalle?:any){
  busy=false;_payingInProgress=false;
  pagarErr=msg;
  reportarError('tarjeta:'+donde,new Error(msg+(detalle?' · '+String(JSON.stringify(detalle)).slice(0,200):'')));
  var errEl=(document.getElementById('o-err') as HTMLInputElement | null);
  render();
  if(errEl&&document.body.contains(errEl))errEl.innerHTML=HERMANO_DICE('serio','No pasó el pago',msg,'alerta');
}
async function prepareThenPayWithCulqi(amountSoles,email){
  var po=_pendingOrder;
  if(!po)return;
  busy=true;busyMsg='Verificando tu pedido...';render();
  try{
    // lat/lon van también acá: prepare-order es el que fija el monto que Culqi va a cobrar,
    // así que si no las recibe cobraría por zona mientras place-order cobra por distancia.
    await api('prepare-order',{token:token,ref:po.ref,name:po.nom,phone:po.phone,email:po.email,address:po.addr,notes:po.notes,summary:po.summary,total:po.total,items:po.items,scheduledFor:po.scheduledFor,rewardId:po.rewardId,deliveryZone:po.deliveryZone,promoCode:po.promoCode,lat:po.lat,lon:po.lon,...metaAttribution()});
  }catch(e){
    falloConTarjeta('prepare-order',e.message||'No se pudo preparar el pago.');
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
  if(typeof Culqi==='undefined'){falloConTarjeta('sin-culqi','No se pudo cargar la pasarela de pago (Culqi). Revisa tu conexión o paga con Yape.');return;}
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
  if(!_pendingOrder)return;
  if(Culqi.token){
    chargeAndFinalize(Culqi.token.id);
  }else{
    var msg=(Culqi.error&&(Culqi.error.user_message||Culqi.error.merchant_message))||'No se pudo procesar el pago. Intenta de nuevo o con otro método.';
    // Cerrar la ventana sin pagar también llega acá: eso no es un fallo y no se reporta.
    if(Culqi.error)falloConTarjeta('culqi',msg,Culqi.error);
    else{busy=false;_payingInProgress=false;render();}
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
      // El rechazo con cara (#24): el hermano serio arriba del motivo, que viene del banco.
      falloConTarjeta('create-charge',data.error||'El pago fue rechazado. Intenta de nuevo o con otro método.',{status:resp.status});
      return;
    }
    // Pago confirmado con Culqi — el servidor re-verifica el cargo contra la reserva que
    // ya creó prepare-order (nombre/dirección/carrito/total ya quedaron ahí, no hace
    // falta reenviarlos ni confiar de nuevo en lo que diga el cliente en este paso).
    var res;
    try{
      res=await api('place-order',Object.assign({token:token,chargeId:data.chargeId,ref:po.ref},metaAttribution()));
    }catch(e){
      // El cobro ya se hizo pero el pedido no quedó registrado — bloqueamos un reintento
      // desde aquí (crearía un SEGUNDO cobro real) y pedimos contactar al local con la ref.
      busy=false;checkoutLocked=true;
      reportarError('tarjeta:place-order-tras-cobro',new Error((e.message||'')+' · ref '+po.ref));
      lockedMsg=(e.message||'No se pudo registrar tu pedido tras el pago.')+' Ya se realizó el cobro — contáctanos con tu referencia '+po.ref+' para confirmar tu pedido manualmente. No vuelvas a intentar pagar.';
      render();
      return;
    }
    finalizeOrderSuccess(res,po,data.chargeId);
  }catch(e){
    falloConTarjeta('conexion','Error de conexión al procesar el pago. Intenta de nuevo.',{msg:String(e&&e.message||e)});
  }
}
function finalizeOrderSuccess(res,po,chargeId){
  // Celebración de rango — antes rankName() era puramente informativo, sin ningún evento
  // ni aviso al cruzar un umbral (hallazgo de auditoría: cero feedback al pasar de NUEVO a
  // REGULAR, o al desbloquear el menú secreto en INICIADO). Se compara el rango justo antes y
  // justo después de que el servidor confirme este pedido (fuente real: total_orders que
  // ya devuelve el propio res.customer, no un cálculo local que podría desincronizarse).
  var prevRank=cust?rankName(cust.total_orders):null;
  var prevTot=cust?(cust.total_orders||0):null;
  if(res.customer){cust=res.customer;cacheCust(cust,isAdmin);}
  var newRank=cust?rankName(cust.total_orders):null;
  window._lRankUp=(prevRank&&newRank&&prevRank!==newRank)?newRank:null;
  // Desbloqueo del menú secreto — evento PROPIO, no derivado del rango. Antes la
  // celebración decía "Ya puedes ver el menú secreto" solo al llegar a INICIADO, porque el
  // umbral del secreto y ese rango coincidían en 5. Desde que el umbral bajó a 3 dejaron de
  // coincidir, y atarlo al rango avisaría dos pedidos tarde. Se compara contra el umbral
  // real del sándwich secreto vigente (que además es editable desde el panel, así que
  // cualquier valor futuro sigue funcionando sin tocar esto).
  var secretGate=(SIGS.find(function(s){return s.secret;})||{}).minOrders;
  window._lSecretUnlock=(prevTot!==null&&typeof secretGate==='number'
    &&prevTot<secretGate&&(cust.total_orders||0)>=secretGate);
  if(!cust){window._lastGuestName=po.nom;window._lastGuestPhone=po.phone;window._lastGuestEmail=po.email;}
  // Guardado aparte de po (que se anula más abajo) para que el botón de respaldo en
  // sOSent pueda reabrir el mismo mensaje si este intento automático no llegó a abrirse
  // (varios navegadores móviles bloquean un window.open que no viene de un tap directo).
  window._lWaText=po.waLines.join('\n');
  window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(window._lWaText),'_blank');
  localStorage.setItem('sw_last_ref',po.ref);
  window._lTot=po.total;window._lChargeId=chargeId;
  // Los puntos NO se ganan sobre el delivery: el servidor otorga `total - delivery_fee`
  // (ver finalizeAndInsertOrder en orders.ts), porque el delivery es pass-through al
  // motorizado, no consumo. La pantalla de éxito mostraba `_lTot` (con delivery) como
  // puntos ganados, así que prometía ~8-15 pts de más y el cliente veía otro número en
  // su perfil. El checkout ya lo calculaba bien; solo esta pantalla mentía.
  window._lPoints=Math.round(po.total-(po.deliveryFee||0));
  window._lRewardLabel=res.order&&res.order.redeemed_reward?res.order.redeemed_reward:null;
  window._lPendingPayment=!!(res.order&&res.order.payment_status!=='paid');
  window._lPayMethod=res.order&&res.order.payment_method;
  // Momento real de creación — usado para mostrar un plazo real (no inventado) antes de
  // que el cron lo cancele solo, ver STALE_MANUAL_PAYMENT_HOURS_CLIENT.
  window._lOrderCreatedAt=Date.now();
  window._lRef=po.ref;avisoPaso='aviso';aErr='';
  // La hora que el servidor dejó prometida al crear el pedido (ventanaPrometida en env.ts).
  window._lVentana=ventanaDelPedido(res.order);
  receiptUploadState=null;
  cart=[];
  pendingGroupCode=null;pendingRecurringId=null;miHoraApartada=null;
  resetBuilder();mode=null;
  useCredit=false;manualPayMethod='yape';payMethodChosen=false;scheduleMode='now';schedDay='today';schedSlot=null;pickedAddrId=null;addrText='';
  confNom='';confEmail='';confNotes='';checkoutLocked=false;lockedMsg='';_payingInProgress=false;
  appliedReward=null;
  saveCart();
  _pendingOrder=null;
  busy=false;sndScreen='o_sent';render();
  // eventID = referencia del pedido: el servidor manda esta MISMA compra por Conversions
  // API con el mismo id, y Meta descarta el duplicado en vez de contar la venta dos veces.
  // Solo se reporta si el pedido ya quedó pagado — un Yape pendiente todavía no es venta,
  // y el servidor lo reportará cuando el admin confirme que el dinero llegó.
  if(!window._lPendingPayment)fbTrack('Purchase',{currency:'PEN',value:money(po.total-(po.deliveryFee||0))},po.ref);
  if(cust)loadUserExtras();
}


function reopenWhatsAppConfirm(){
  if(!window._lWaText)return;
  window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(window._lWaText),'_blank');
}
// ── 06 A · PEDIDO ENVIADO · la losa (aprobada 2026-09-24) ─────────────────────────────────
// docs/maquetas/aprobadas/06A-pedido-enviado-la-losa.png. SANDO está DETRÁS de una losa clara
// que lo corta a la altura del hombro: los datos viven en la losa y no hay forma de que la
// figura tape uno (el defecto de la 06, donde las zapatillas tapaban el número y la hora).
//
// Lo que la pantalla anterior también decía —el pago por confirmar, el comprobante, el rango
// nuevo, el menú secreto, el aviso por WhatsApp, las notificaciones, el referido— sigue acá,
// como renglones de la MISMA losa debajo de los de la maqueta: nada de eso se perdió, y la
// primera vista es la aprobada.
//
// EL AVISO DE PUNTOS (aprobado 2026-09-25, docs/maquetas/aprobadas/06A-aviso-*.png): a quien
// pagó sin cuenta se le ofrece UNA vez, acá, en el renglón de los puntos. Con Google es un toque
// (nombre y celular ya los dio en el checkout); con correo, la losa sube en el mismo lugar:
// correo y DNI, después el código. Antes de pagar no se le pidió nada.
var avisoPaso='aviso',avisoDni='',avisoBday='';
function seguirElPedido(){avisoPaso='aviso';loadMyOrders();}
function avisoDePuntosHTML(pts){
  var g=googleConfigured();
  return'<div class="dr espera"><span>Te esperan</span><b class="pt">+'+pts+' puntos</b></div>'
    +'<div class="guardar">'
    +(g?'<div class="g" id="google-btn-mount" data-tema="filled_black"></div>':'')
    +'<button class="c'+(g?'':' solo')+'" onclick="avisoPaso=\'correo\';aErr=\'\';render()">'+(g?'Correo →':'Guardarlos con mi correo →')+'</button>'
    +'</div>'
    +'<div class="err" id="aviso-err" role="alert">'+esc(aErr||'')+'</div>';
}
function avisoCampo(id,rotulo,tipo,val,ph,extra){
  return'<label class="campo'+(extra&&extra.clase?' '+extra.clase:'')+'"><s>'+esc(rotulo)+'</s><input id="'+id+'" type="'+tipo+'"'
    +(val?' value="'+esc(val)+'"':'')+(ph?' placeholder="'+esc(ph)+'"':'')
    +(extra&&extra.im?' inputmode="'+extra.im+'"':'')+(extra&&extra.ac?' autocomplete="'+extra.ac+'"':'')
    +(extra&&extra.max?' maxlength="'+extra.max+'"':'')+'></label>';
}
function sOSent(){
  var pending=window._lPendingPayment;
  var methodLabel=window._lPayMethod==='yape'?'Yape':window._lPayMethod==='plin'?'Plin':'';
  // Plazo real (no inventado) para que confirmemos el pago manual — coincide con el cron
  // que cancela solo un Yape/Plin sin confirmar tras STALE_MANUAL_PAYMENT_HOURS_CLIENT.
  var manualWaiting=pending&&!!methodLabel;
  var deadlineLabel=manualWaiting&&window._lOrderCreatedAt
    ?new Date(window._lOrderCreatedAt+STALE_MANUAL_PAYMENT_HOURS_CLIENT*3600000).toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit'})
    :null;
  var pts=window._lPoints||0;
  var invitado=!cust&&pts>0&&!!window._lRef;
  var sube=invitado&&(avisoPaso==='correo'||avisoPaso==='codigo');
  var ref=window._lRef?'#'+esc(window._lRef):'';
  var losa='',pie='';
  if(sube&&avisoPaso==='correo'){
    losa='<div class="ca"><em>Guardar +'+pts+' puntos</em><u>'+ref+'</u></div>'
      +avisoCampo('av-email','Tu correo','email',authEmail||window._lastGuestEmail||'','tu@correo.com',{im:'email',ac:'email'})
      +'<div class="par">'+avisoCampo('av-dni','DNI','text',avisoDni,'8 dígitos',{im:'numeric',max:8})
      +avisoCampo('av-bday','Cumpleaños','text',avisoBday,'DD/MM/AAAA',{im:'numeric',max:10})+'</div>'
      +'<div class="err" id="aviso-err" role="alert">'+esc(aErr||'')+'</div>'
      +'<div class="mini">Tu nombre y tu celular ya los tenemos: <b>'+esc(window._lastGuestName||'')+' · '+esc(window._lastGuestPhone||'')+'</b>.<br>'
      +'+'+WELCOME_BONUS_POINTS+' puntos de bienvenida. Aceptas los <button onclick="event.stopPropagation();sndScreen=\'p_legal\';render()">Términos y la Privacidad</button>.</div>';
    pie='<button class="oro" onclick="avisoMandarCodigo()">Mandar código</button><button class="cel" onclick="avisoPaso=\'aviso\';aErr=\'\';render()">Ahora no</button>';
  }else if(sube){
    losa='<div class="ca"><em>Guardar +'+pts+' puntos</em><u>'+ref+'</u></div>'
      +avisoCampo('av-code','El código · 6 dígitos','tel','','••••••',{clase:'cod',im:'numeric',ac:'one-time-code',max:6})
      +'<div class="err" id="aviso-err" role="alert">'+esc(aErr||'')+'</div>'
      +'<div class="mini">Lo mandamos a <b>'+esc(authMasked||authEmail)+'</b>. Vence en unos minutos.</div>'
      +'<div class="dr" style="margin-top:14px"><span>No me llegó</span><button onclick="avisoMandarCodigo(true)">Mandar otro →</button></div>';
    pie='<button class="oro" onclick="avisoVerificar()">Guardar</button><button class="cel" onclick="avisoPaso=\'aviso\';aErr=\'\';render()">Ahora no</button>';
  }else{
    var rankPerk=window._lSecretUnlock?'Ya puedes verlo':null;
    losa='<div class="ca"><em>Tu pedido</em><u>'+ref+'</u></div>'
      +(window._lVentana?'<div class="dr"><span>Llega</span><b>'+esc(window._lVentana)+'</b></div>':'')
      +'<div class="dr"><span>Pagaste</span><b>'+SOLES_TXT+pz(window._lTot||0)+'</b></div>'
      +(window._lRewardLabel?'<div class="dr"><span>Canjeaste</span><b>'+esc(window._lRewardLabel)+'</b></div>':'')
      +(cust&&pts>0?'<div class="dr"><span>'+(pending?'Al confirmar':'Ganaste')+'</span><b class="pt">+'+pts+' puntos</b></div>':'')
      +(invitado?avisoDePuntosHTML(pts):'')
      +(manualWaiting?'<div class="nota">Confirmamos tu '+methodLabel+' contra la cuenta'
        +(deadlineLabel?'; si no lo hacemos antes de las '+esc(deadlineLabel)+', el pedido se cancela solo':'')+'.<br>'
        +(receiptUploadState==='done'?'✓ Comprobante recibido.'
          :receiptUploadState==='uploading'?'Subiendo el comprobante…'
          :'<label>Subir la captura del comprobante (opcional)<input type="file" accept="image/*" onchange="handleReceiptFile(event)" style="position:absolute;width:1px;height:1px;opacity:0"></label>')
        +(typeof receiptUploadState==='string'&&receiptUploadState.indexOf('error:')===0?'<br>'+esc(receiptUploadState.slice(6)):'')
        +'</div>':'')
      +(window._lRankUp?'<div class="dr"><span>Subiste a</span><b class="pt">'+esc(window._lRankUp)+'</b></div>':'')
      +(rankPerk?'<div class="dr"><span>Menú secreto</span><b class="pt">'+rankPerk+'</b></div>':'')
      +'<div class="extra">'
      // Respaldo tappable del window.open automático: muchos navegadores móviles lo bloquean
      // por no venir de un toque, y sin esto un pedido cobrado podía quedar sin aviso al negocio.
      +(window._lWaText?'<button onclick="reopenWhatsAppConfirm()">Mandar el aviso por WhatsApp <span>→</span></button>':'')
      // Justo después del primer pedido pagado es el momento de mayor intención para activar
      // las notificaciones: quiere saber cuándo llega SU pedido.
      +(cust&&cust.total_orders===1&&!pushSubscribed&&('serviceWorker' in navigator)&&('PushManager' in window)?'<button onclick="togglePushNotifications()">Avísame cuando salga <span>→</span></button>':'')
      +(cust?'<button onclick="shareReferral()">Invita a alguien <span>→</span></button>':'')
      +'</div>'
      // Si algo sale mal con este pedido, es acá donde el cliente lo va a buscar.
      +legalLinksHTML('o_sent');
    pie='<button class="oro" onclick="seguirElPedido()">Seguir el pedido</button><button class="cel" onclick="seguirElPedido()" aria-label="Seguir el pedido">→</button>';
  }
  return'<div class="m06 fi'+(sube?' sube':'')+'"><div class="forro"></div>'
    +'<div class="arr"><div class="col"><img src="'+broPose('sando','asoma')+'" alt="" aria-hidden="true"></div>'
    +'<div class="arriba"><div class="ok">Pedido recibido</div><h1>YA ESTÁ<br>EN LA<br>COCINA</h1>'
    +'<div class="sub">“Ya prendí<br>la plancha.”<u>Sando</u></div></div></div>'
    +'<div class="losa">'+losa+'</div>'
    +'</div>'
    +'<div class="m06-go sw-barra">'+pie+'</div>';
}
// ── El aviso por correo: correo + DNI → código → cuenta ─────────────────────────────────
// Mismas reglas que el registro normal (doReg): DNI obligatorio de 8 dígitos y fecha de
// nacimiento real. Nombre y celular son los del checkout (window._lastGuest*).
async function avisoMandarCodigo(reenviar?){
  var email=reenviar?authEmail:(document.getElementById('av-email')?gv('av-email'):'').trim();
  if(!reenviar){
    avisoDni=(document.getElementById('av-dni')?gv('av-dni'):'').trim();
    avisoBday=(document.getElementById('av-bday')?gv('av-bday'):'').trim();
    if(!email||email.indexOf('@')<0){aErr='Escribe un correo válido.';render();return;}
    if(!/^\d{8}$/.test(avisoDni)){aErr='El DNI son 8 dígitos.';render();return;}
    if(!parseBdayDDMMYYYY(avisoBday)){aErr='El cumpleaños va como DD/MM/AAAA.';render();return;}
  }
  busy=true;busyMsg='Mandando el código...';render();
  try{
    var r=await api('request-login-code',{email:email});
    authEmail=email;authMasked=r.masked||email;avisoPaso='codigo';aErr='';
  }catch(e){aErr=e.message;}
  busy=false;render();
}
// Deja la sesión abierta con lo que devolvió el servidor, igual que los otros caminos de entrada.
function avisoAbrirSesion(r){
  cust=r.customer;isAdmin=!!r.isAdmin;token=r.token;cacheCust(cust,isAdmin);
  localStorage.setItem('sw_ph',cust.phone);localStorage.setItem('sw_tok',token);savedPh=cust.phone;
}
// Quien ya tenía cuenta y pagó sin entrar: se le vincula ESTE pedido (acción reclamar-pedido).
async function avisoReclamar(){
  var ref=window._lRef||localStorage.getItem('sw_last_ref');
  if(!ref||!token)return;
  try{
    var r=await api('reclamar-pedido',{token:token,ref:ref});
    if(r&&r.customer){cust=r.customer;cacheCust(cust,isAdmin);}
  }catch(e){}
}
async function avisoVerificar(){
  var code=(document.getElementById('av-code')?gv('av-code'):'').replace(/\D/g,'');
  if(code.length!==6){aErr='El código son 6 dígitos.';render();return;}
  busy=true;busyMsg='Guardando tus puntos...';render();
  try{
    var r=await api('verify-login-code',{email:authEmail,code:code});
    if(!r.needsRegistration){
      avisoAbrirSesion(r);await avisoReclamar();
    }else if(!window._lastGuestName||!window._lastGuestPhone){
      // Sin los datos del checkout (se recargó la página) no se puede crear la cuenta acá: se
      // sigue en Entrar, en el paso de la primera vez, con el correo ya verificado.
      authProof=r.emailProof;authEmail=r.email;busy=false;sndScreen='p_auth';render();return;
    }else{
      var reg=await api('register',{name:window._lastGuestName,phone:window._lastGuestPhone,pin:'',email:r.email,
        dni:avisoDni,bday:parseBdayDDMMYYYY(avisoBday),referredBy:refCode||null,
        claimOrderRef:window._lRef||localStorage.getItem('sw_last_ref')||null,
        acquisitionSource:localStorage.getItem('sw_src')||null,emailProof:r.emailProof});
      avisoAbrirSesion(reg);
      fbTrack('CompleteRegistration',{content_name:refCode?'referido':'directo'});
    }
    limpiarLoginPorCorreo();avisoPaso='aviso';aErr='';
  }catch(e){aErr=e.message;}
  busy=false;render();loadUserExtras();
}
// Google desde el aviso: el celular ya lo dio en el checkout, así que no hay paso intermedio.
async function avisoConGoogle(idToken){
  try{
    var r=await api('register',{phone:window._lastGuestPhone,googleIdToken:idToken,referredBy:refCode||null,
      claimOrderRef:window._lRef||localStorage.getItem('sw_last_ref')||null,
      acquisitionSource:localStorage.getItem('sw_src')||null});
    clearGoogleLink();avisoAbrirSesion(r);
    fbTrack('CompleteRegistration',{content_name:refCode?'referido':'google'});
    aErr='';busy=false;render();loadUserExtras();
  }catch(e){
    // Si el celular ya es de otra cuenta, o algo falla, se sigue por el paso de Entrar que pide
    // el celular: el token de Google ya quedó guardado.
    aErr=e.message;busy=false;go('p_gauth');
  }
}

// ── ENTRAR · «te abren la puerta» (maqueta «entrar 2», docs/maquetas/aprobadas/entrar.png) ────
// UNA sola pantalla para todo el acceso (dueño, 2026-09-25: «esa pantalla no me convence para
// que esté en duplicado varias veces»). Lo que cambia de un momento a otro es el CAMPO, nunca la
// pantalla: el correo, el código, los datos de la primera vez, el celular después de Google y el
// teléfono con PIN de las cuentas de antes. Se llega solo desde la esquina de la puerta
// («Entrar →») o desde una pantalla de cuenta sin sesión; ANTES DE PAGAR no se pide nada — a
// quien pagó sin cuenta se le ofrece una vez, en la losa de la 06A (ver avisoDePuntosHTML).
//
// El bono de bienvenida se INTERPOLA de `WELCOME_BONUS_POINTS` (`npm run parity` lo compara
// contra el servidor): un incentivo que no se comunica no convierte, y uno escrito a mano se
// desincroniza.
var entrarVerRef=false;
function entrarPaso():string{
  if(sndScreen==='p_gauth')return'google';
  if(authProof)return'primera';
  if(authPinFallback)return'pin';
  if(authPaso==='codigo')return'codigo';
  return'correo';
}
// La flecha de arriba retrocede UN paso dentro de la misma pantalla; solo desde el correo sale.
function entrarAtras(){
  aErr='';
  var p=entrarPaso();
  if(p==='google'){discardGoogleLink();sndScreen='p_auth';render();return;}
  if(p==='primera'||p==='codigo'||p==='pin'){limpiarLoginPorCorreo();render();return;}
  limpiarLoginPorCorreo();clearGoogleLink();
  sndTab='order';sndScreen='o_home';render();
}
// La mitad celeste del pie («Con Google») no puede ser el botón de Google: Google exige dibujar
// el suyo (renderButton). Pide la tarjeta de One Tap y, si el navegador no la muestra, lleva la
// vista al botón real para que sea un toque.
function tocarGoogle(){
  try{google.accounts.id.prompt();}catch(e){}
  var m=document.getElementById('google-btn-mount');
  if(m&&m.scrollIntoView)m.scrollIntoView({block:'center',behavior:'smooth'});
}
function entrarCampo(id,rotulo,tipo,val,extra){
  return'<label class="campo'+(extra&&extra.clase?' '+extra.clase:'')+'"><s>'+esc(rotulo)+'</s>'
    +'<input id="'+id+'" type="'+tipo+'"'+(val?' value="'+esc(val)+'"':'')
    +(extra&&extra.ph?' placeholder="'+esc(extra.ph)+'"':'')
    +(extra&&extra.ac?' autocomplete="'+extra.ac+'"':'')
    +(extra&&extra.im?' inputmode="'+extra.im+'"':'')
    +(extra&&extra.max?' maxlength="'+extra.max+'"':'')
    +'></label>';
}
function sEntrar(){
  var p=entrarPaso(),g=googleConfigured();
  var em='Buenas',titulo='¿QUIÉN LLEGÓ?',cuerpo='',pie='';
  var err='<div class="err" id="'+(p==='google'?'gauth-err':'auth-err')+'" role="alert">'+esc(aErr||'')+'</div>';
  var legal='<button onclick="event.stopPropagation();sndScreen=\'p_legal\';render()">Términos y Política de Privacidad</button>';
  if(p==='correo'){
    // «¿Quién llegó?» se queda (dueño, 2026-10-01: «está súper bien»), pero tiene que verse que
    // aquí también se CREA la cuenta: se leía como un login solo para quien ya la tenía.
    cuerpo='<p class="doble">Ingresa o crea tu cuenta</p>'
      +entrarCampo('l-email','Tu correo','email',authEmail,{ph:'tu@correo.com',ac:'email',im:'email'})
      +'<p class="primera">¿Primera vez? Es igual: te mandamos un código y después solo tu nombre y DNI.'+(g?' Con Google, ni el DNI.':'')+'</p>'
      +err
      +(g?'<div class="goo" id="google-btn-mount" data-tema="outline"></div>':'')
      +'<div class="nota">No hay contraseña: entras siempre con un código de 6 dígitos.'
      +'<br><button onclick="authPinFallback=true;aErr=\'\';render()">Entrar con teléfono y PIN</button></div>';
    pie='<button class="oro" data-accion="pedir-codigo" onclick="doPedirCodigo()">Mandarme el código</button>'+(g?'<button class="cel" data-accion="con-google" onclick="tocarGoogle()">Con Google</button>':'');
  }else if(p==='codigo'){
    em='Revisa tu correo';titulo='SEIS NÚMEROS';
    cuerpo=entrarCampo('l-code','El código','tel','',{clase:'codigo',ac:'one-time-code',im:'numeric',max:6,ph:'••••••'})
      +err
      +'<div class="hecho">Lo mandamos a <b>'+esc(authMasked||authEmail)+'</b>. Vence en unos minutos y sirve una sola vez.</div>'
      +'<div class="nota"><button onclick="doPedirCodigo()">No me llegó · mandar otro</button><br>'
      +'<button onclick="authPaso=\'correo\';aErr=\'\';render()">Era otro correo · cambiar</button></div>';
    pie='<button class="oro" data-accion="verificar-codigo" onclick="doVerificarCodigo()">Entrar</button>';
  }else if(p==='primera'){
    em='Primera vez';titulo='¿CÓMO TE LLAMAS?';
    cuerpo='<div class="hecho">✓ <b>'+esc(authEmail)+'</b>. Vas a entrar siempre con ese correo y un código.</div>'
      +entrarCampo('r-name','Nombre','text',window._lastGuestName||'',{ac:'name'})
      +entrarCampo('r-phone','Celular · para avisarte','tel',window._lastGuestPhone||'',{ac:'tel',im:'tel',ph:'9•• ••• •••'})
      +'<div class="par">'+entrarCampo('r-dni','DNI','text','',{im:'numeric',max:8,ph:'8 dígitos'})
      +entrarCampo('r-bday','Cumpleaños','text','',{im:'numeric',max:10,ph:'DD/MM/AAAA'})+'</div>'
      +(entrarVerRef||refCode?entrarCampo('r-ref','Código de quien te invitó','text',refCode,{})
        :'<div class="nota"><button onclick="entrarVerRef=true;render()">¿Te invitó alguien? · su código</button></div>')
      +err
      +'<div class="nota">Al entrar te damos +'+WELCOME_BONUS_POINTS+' puntos de bienvenida.<br>Al crear tu cuenta aceptas los '+legal+'.</div>';
    pie='<button class="oro" data-accion="crear-cuenta" onclick="doReg()">Crear cuenta</button>';
  }else if(p==='pin'){
    em='Cuenta de antes';titulo='TELÉFONO Y PIN';
    cuerpo=entrarCampo('l-phone','Tu teléfono','tel',savedPh||'',{ac:'tel',im:'tel'})
      +entrarCampo('l-pin','Tu PIN','password','',{im:'numeric',ac:'current-password'})
      +err
      +'<div class="nota">'
      +'<button onclick="authPinFallback=false;aErr=\'\';render()">Prefiero entrar con mi correo</button></div>';
    pie='<button class="oro" data-accion="entrar-con-pin" onclick="doLogin()">Entrar</button>';
  }else{
    var nombre=String(window._lastGuestName||'').trim().split(/\s+/)[0];
    em=nombre?'Hola, '+nombre:'Hola';titulo='UN NÚMERO Y LISTO';
    // autocomplete="tel": en Android el navegador ofrece el número guardado y el campo se llena
    // de un toque. Nombre y correo no se piden: el servidor los toma del token de Google.
    cuerpo=entrarCampo('g-phone','Tu celular','tel',window._lastGuestPhone||'',{ac:'tel',im:'tel',ph:'9•• ••• •••'})
      +(entrarVerRef||refCode?entrarCampo('g-ref','Código de quien te invitó','text',refCode,{})
        :'<div class="nota"><button onclick="entrarVerRef=true;render()">¿Te invitó alguien? · su código</button></div>')
      +err
      +'<div class="nota">Con Google no pedimos DNI.<br>El número es para avisarte cuando tu pedido sale.<br>'
      // "No soy yo" existe porque el dispositivo puede ser prestado.
      +'<button onclick="entrarAtras()">No soy yo · otro correo</button></div>';
    pie='<button class="oro" onclick="doGoogleRegister()">Listo</button>';
  }
  var corta=p==='primera';
  return'<div class="en fi">'
    +'<div class="esc'+(corta?' corta':'')+'"><div class="piso"></div>'
    +'<img class="sd" src="'+broPose('sando','entrar')+'" alt="" aria-hidden="true">'
    +'<img class="wc" src="'+broPose('wicho','entrar')+'" alt="" aria-hidden="true">'
    +'<div class="tx"><em>'+esc(em)+'</em><b>'+esc(titulo)+'</b></div></div>'
    +'<button class="sal" onclick="entrarAtras()" aria-label="Volver">←</button>'
    +'<div class="cuerpo">'+cuerpo+'</div>'
    +'</div>'
    +'<div class="en-go sw-barra">'+pie+'</div>';
}
function sPAuth(){return sEntrar();}
async function doReg(){
  // Con correo verificado no hay campos de PIN ni de correo (ver el formulario): el PIN lo
  // genera el servidor y el correo sale de la prueba firmada.
  var conCorreo=!!authProof;
  var name=gv('r-name').trim(),
      phone=gv('r-phone').trim(),
      pin=conCorreo?'':gv('r-pin').trim(),
      email=conCorreo?authEmail:gv('r-email').trim(),
      dni=gv('r-dni').trim(),
      bdayRaw=gv('r-bday').trim(),
      refEl=(document.getElementById('r-ref') as HTMLInputElement | null),
      referredBy=refEl?refEl.value.trim():'';
  var err=(document.getElementById('auth-err') as HTMLInputElement | null);
  if(!name||!phone||(!conCorreo&&pin.length<4)){if(err)err.textContent=conCorreo?'Completa nombre y teléfono.':'Completa nombre, teléfono y PIN (mínimo 4 dígitos).';return;}
  // Mismo mínimo que ya exige el teléfono de contacto del checkout de invitado (línea de
  // doOrder más abajo) — antes el teléfono de CUENTA (login + código de referido) no
  // validaba ningún formato, a diferencia del DNI. Un typo creaba una cuenta que igual
  // loguea pero cuyo "código de referido" (el propio número) es inservible para quien lo
  // recibe (hallazgo de auditoría UX, ALTO).
  if(phone.replace(/\D/g,'').length<6){if(err)err.textContent='Ingresa un teléfono válido.';return;}
  if(!dni||!/^\d{8}$/.test(dni)){if(err)err.textContent='DNI es obligatorio y debe tener 8 dígitos.';return;}
  if(email&&!/^[^@]+@[^@]+\.[^@]+$/.test(email)){if(err)err.textContent='Correo inválido.';return;}
  // Obligatoria (antes opcional en silencio) — recuperar el PIN exige DNI+fecha de
  // nacimiento (ver doRecover/actRecover): una cuenta sin fecha de nacimiento quedaba sin
  // ninguna forma de recuperarse, con el mismo error genérico de "no encontramos una
  // cuenta" que credenciales incorrectas — indistinguible para el cliente (hallazgo de
  // auditoría UX, CRÍTICO).
  var bday=parseBdayDDMMYYYY(bdayRaw);
  if(!bday){if(err)err.textContent='Fecha de nacimiento es obligatoria — debe ser DD/MM/AAAA y existir de verdad.';return;}
  busy=true;busyMsg='Creando cuenta...';render();
  try{
    // Si venimos de "CREAR CUENTA Y GANAR PUNTOS POR ESTE PEDIDO" en la confirmación de un
    // pedido de invitado, sw_last_ref sigue siendo la prueba de acceso a ESE pedido (igual
    // que en my-orders/submit-rating de invitado) — el servidor solo lo vincula si sigue
    // sin dueño, así que mandarlo siempre aquí es seguro aunque no venga de ese flujo.
    var claimRef=localStorage.getItem('sw_last_ref')||null;
    var acqSrc=localStorage.getItem('sw_src')||null;
    var r=await api('register',{name:name,phone:phone,pin:pin,email:email||null,dni:dni,bday:bday,referredBy:referredBy||null,claimOrderRef:claimRef,acquisitionSource:acqSrc,googleIdToken:_googleIdToken||null,emailProof:authProof||null});
    cust=r.customer;isAdmin=r.isAdmin;token=r.token;cacheCust(cust,isAdmin);
  }
  catch(e){aErr=e.message;busy=false;render();return;}
  clearGoogleLink();limpiarLoginPorCorreo();
  fbTrack('CompleteRegistration',{content_name:referredBy?'referido':'directo'});
  localStorage.setItem('sw_ph',phone);localStorage.setItem('sw_tok',token);savedPh=phone;busy=false;sndScreen='p_welcome';render();loadUserExtras();
  // La bienvenida dura 6.5s y recién ahí se va a p_home — si venía por el QR de la
  // tarjeta (?grupo=1), el grupo se crea al terminar esa pantalla, no antes, para no
  // pisarla a mitad de camino.
  setTimeout(function(){if(!resumeWantedGroup()){sndScreen='p_home';render();}},6500);
}
// ── Entrar con correo y código de 6 dígitos ──────────────────────────────────────────
// El servidor contesta IGUAL exista o no la cuenta (ver actRequestLoginCode), así que acá
// tampoco se puede adelantar nada: la pantalla dice "te mandamos un código" y punto. Quién
// tiene cuenta y quién no recién se sabe al acertar el código.
async function doPedirCodigo(){
  // Desde el paso del código («No me llegó · mandar otro») ya no hay campo: se reusa el correo.
  var email=(document.getElementById('l-email')?gv('l-email'):authEmail).trim();
  var err=(document.getElementById('auth-err') as HTMLInputElement | null);
  if(!email||email.indexOf('@')<0){if(err)err.textContent='Escribe un correo válido.';return;}
  clearGoogleLink();
  busy=true;busyMsg='Mandando el código...';render();
  try{
    var r=await api('request-login-code',{email:email});
    authEmail=email;authMasked=r.masked||email;authPaso='codigo';aErr='';
  }catch(e){aErr=e.message;busy=false;render();return;}
  busy=false;render();
}
async function doVerificarCodigo(){
  var code=gv('l-code').replace(/\D/g,'');
  var err=(document.getElementById('auth-err') as HTMLInputElement | null);
  if(code.length!==6){if(err)err.textContent='El código son 6 dígitos.';return;}
  busy=true;busyMsg='Verificando...';render();
  var r;
  try{ r=await api('verify-login-code',{email:authEmail,code:code}); }
  catch(e){aErr=e.message;busy=false;render();return;}
  if(r.needsRegistration){
    // Correo verificado, cuenta todavía no. Se pasa a "crear cuenta" con el correo ya
    // resuelto y bloqueado: el servidor lo va a leer de authProof, no del campo, así que
    // dejarlo editable solo serviría para confundir.
    authProof=r.emailProof;authEmail=r.email;atab='reg';aErr='';busy=false;render();return;
  }
  cust=r.customer;isAdmin=r.isAdmin;token=r.token;cacheCust(cust,isAdmin);
  localStorage.setItem('sw_ph',cust.phone);localStorage.setItem('sw_tok',token);savedPh=cust.phone;
  limpiarLoginPorCorreo();
  busy=false;sndScreen='p_home';render();loadUserExtras();
  resumeWantedGroup();
}
async function doLogin(){
  var phone=gv('l-phone').trim(),pin=gv('l-pin').trim();
  var err=(document.getElementById('auth-err') as HTMLInputElement | null);
  if(!phone||!pin){if(err)err.textContent='Ingresa teléfono y PIN.';return;}
  // Alguien usando el login manual no está en el flujo de Google — si había un vínculo de
  // Google pendiente de una persona anterior en este mismo dispositivo, se descarta acá
  // (ver clearGoogleLink()/hallazgo de auditoría de seguridad de esta sesión).
  clearGoogleLink();
  busy=true;busyMsg='Verificando...';render();
  try{var r=await api('login',{phone:phone,pin:pin});cust=r.customer;isAdmin=r.isAdmin;token=r.token;cacheCust(cust,isAdmin);}
  catch(e){aErr=e.message;busy=false;render();return;}
  localStorage.setItem('sw_ph',phone);localStorage.setItem('sw_tok',token);savedPh=phone;busy=false;sndScreen='p_home';render();loadUserExtras();
  // Si llegó por el QR de la tarjeta (?grupo=1), retoma lo que venía a hacer.
  resumeWantedGroup();
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
      _googleLinkedEmail=(r.prefill&&r.prefill.email)||(r.prefill&&r.prefill.name)||'tu cuenta de Google';
      if(sndScreen==='o_sent'&&window._lastGuestPhone){
        // El aviso de puntos de la 06A: el celular ya está (el del checkout), así que la cuenta
        // se crea de un toque. Ver avisoConGoogle().
        busyMsg='Guardando tus puntos...';
        await avisoConGoogle(resp.credential);
        return;
      }
      window._lastGuestName=(r.prefill&&r.prefill.name)||'';
      window._lastGuestEmail=(r.prefill&&r.prefill.email)||'';
      // Antes esto mandaba al formulario COMPLETO (nombre, teléfono, PIN, DNI, fecha de
      // nacimiento, correo) con un toast explicando lo que faltaba. O sea: "Continuar con
      // Google" ahorraba dos campos de seis y seguía siendo un registro.
      // Desde el 2026-09-12 va a una pantalla de UN SOLO CAMPO. El teléfono es lo único
      // que Google no puede dar y que el negocio necesita de verdad: es la primary key de
      // `customers` (seis tablas le apuntan por foreign key) y es con lo que se ubica a
      // alguien para entregarle el pedido.
      aErr='';busy=false;go('p_gauth');
      return;
    }
    cust=r.customer;isAdmin=r.isAdmin;token=r.token;cacheCust(cust,isAdmin);
    localStorage.setItem('sw_ph',cust.phone);localStorage.setItem('sw_tok',token);savedPh=cust.phone;
    try{localStorage.setItem('sw_g_antes','1');}catch(e){}
    // Desde el aviso de la 06A, quien ya tenía cuenta se queda en su pedido y se le vincula.
    if(sndScreen==='o_sent'){await avisoReclamar();busy=false;render();loadUserExtras();return;}
    busy=false;sndScreen='p_home';render();loadUserExtras();
  }catch(e){
    aErr=e.message;busy=false;render();
  }
}
// Link visible "No soy yo" del banner de vinculación (ver sPAuth) — descarta el vínculo de
// Google pendiente y limpia el prellenado, dejando el formulario en blanco para que la
// persona que de verdad está frente al dispositivo registre su propia cuenta sin arrastrar
// nada de un intento anterior.
function discardGoogleLink(){
  clearGoogleLink();
  window._lastGuestName='';window._lastGuestEmail='';
  render();
}
// Monta el botón oficial de Google (renderButton — no un <button> propio, GIS exige su
// propio marcado dentro del contenedor) cada vez que p_auth se pinta — render() reemplaza
// todo el innerHTML en cada ciclo, así que el mount anterior siempre queda destruido y
// hay que rehacerlo. Sin ruido si el script de Google todavía no cargó (red lenta,
// bloqueador de contenido) o si GOOGLE_CLIENT_ID no está configurado.
// ── REGISTRO CON GOOGLE: UN SOLO CAMPO ──────────────────────────────────────────────
// Se llega acá solo después de que el servidor verificó el token de Google y respondió
// needsRegistration. Es el paso «google» de Entrar (ver sEntrar): el celular es lo único que
// Google no da y que el negocio necesita de verdad — es la primary key de `customers` y con lo
// que se ubica a alguien para entregarle el pedido.
function sGoogleAuth(){return sEntrar();}
async function doGoogleRegister(){
  var phone=gv('g-phone').trim(),ref=(document.getElementById('g-ref')?gv('g-ref'):refCode||'').trim();
  var err=(document.getElementById('gauth-err') as HTMLInputElement | null);
  // Mismo mínimo que doOrder() y que actReg en el servidor. Se valida acá además de allá
  // para que el aviso llegue sin un viaje de red.
  if(phone.replace(/\D/g,'').length<6){
    fieldCheck(document.getElementById('g-phone'),'tel',true);
    if(err)err.textContent='Ingresa un teléfono válido.';return;
  }
  if(!_googleIdToken){if(err)err.textContent='Tu sesión de Google expiró. Vuelve a tocar el botón de Google.';return;}
  busy=true;busyMsg='Creando tu cuenta...';render();
  try{
    // Sin dni, sin bday y sin pin: el servidor los resuelve cuando hay googleIdToken (ver
    // actRegister). Nombre y correo tampoco se mandan — los toma del token firmado.
    // Mismas dos claves que usa doReg(): el pedido de invitado que se reclama al crear la
    // cuenta y de dónde vino la persona. Sin esto, quien pide como invitado y recién
    // después crea su cuenta con Google perdería los puntos de ese pedido.
    var r=await api('register',{phone:phone,googleIdToken:_googleIdToken,referredBy:ref||null,
      claimOrderRef:localStorage.getItem('sw_last_ref')||null,
      acquisitionSource:localStorage.getItem('sw_src')||null});
    clearGoogleLink();
    // Mismo evento que doReg(): sin esto, toda cuenta creada por Google quedaría invisible
    // para Meta y el CAC medido saldría más alto de lo real justo por el camino que lo baja.
    fbTrack('CompleteRegistration',{content_name:ref?'referido':'google'});
    cust=r.customer;isAdmin=!!r.isAdmin;token=r.token;cacheCust(cust,isAdmin);
    localStorage.setItem('sw_ph',cust.phone);localStorage.setItem('sw_tok',token);savedPh=cust.phone;
    try{localStorage.setItem('sw_g_antes','1');}catch(e){}
    busy=false;go('p_welcome');loadUserExtras();
  }catch(e){
    busy=false;render();
    var e2=(document.getElementById('gauth-err') as HTMLInputElement | null);
    if(e2)e2.textContent=e.message;
  }
}
// ⚠ ONE TAP NO EXISTIA. Hasta el 2026-09-17 esta funcion hacia exactamente dos cosas
// —`initialize()` y `renderButton()`— y ninguna llamada a `prompt()` ni el parametro
// `auto_select` aparecian en todo el cliente. O sea que el boton se pintaba y nada mas:
// quien ya tenia sesion de Google igual tenia que tocarlo. El dueno lo reporto como que
// la web "no te pide la autenticacion de google o se autentica de inmediato al ya tenerlo
// puesto", y no era un problema del secret —que el ya habia configurado— sino una
// funcion que nunca se construyo.
//
// `auto_select` es lo que resuelve su pedido: si la persona ya dio consentimiento antes y
// tiene UNA sola sesion de Google abierta, entra sin tocar nada.
var _oneTapPedido=false,_gInicializado='';
// UNA inicialización por client id. Antes se reinicializaba en cada render, y se hacía solo
// dentro de mountGoogleButton: en la puerta, que no tiene botón, Google nunca se enteraba.
function googleListoParaEntrar(){
  if(!googleConfigured())return false;
  if(typeof google==='undefined'||!google.accounts||!google.accounts.id)return false;
  if(_gInicializado!==GOOGLE_CLIENT_ID){
    google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:onGoogleCredential,auto_select:true,cancel_on_tap_outside:false});
    _gInicializado=GOOGLE_CLIENT_ID;
  }
  return true;
}
// ENTRAR SOLO CON GOOGLE AL ABRIR LA APP (dueño: «no veo que se ingrese en automático con el
// proceso de google OAuth»). Las tres causas, ya cerradas:
//  1. One Tap solo se pedía en pantallas con botón de Google; la app abre en la puerta, que no
//     lo tiene, así que nunca se le preguntaba a Google por la sesión.
//  2. El client id llega por red: en la primera visita la pantalla se armaba antes.
//  3. El script de Google es async: si terminaba después del render, nada lo volvía a montar.
// Esto corre cuando carga el script (onGoogleLibraryLoad), cuando llega el client id y tras
// cada render. Al abrir la app solo se pide a quien YA entró con Google en este equipo
// (`sw_g_antes`): a esa persona `auto_select` la vuelve a entrar sin tocar nada; a quien nunca
// entró no se le ofrece cuenta antes de pagar (CLAUDE.md: la cuenta se ofrece UNA vez).
function googleAlCargar(){
  if(!googleListoParaEntrar())return;
  mountGoogleButton();
  var antes=false;try{antes=localStorage.getItem('sw_g_antes')==='1';}catch(e){}
  if(antes&&!cust&&!token&&!_oneTapPedido){
    _oneTapPedido=true;
    try{google.accounts.id.prompt();}catch(e){}
  }
}
(window as any).onGoogleLibraryLoad=googleAlCargar;
function mountGoogleButton(){
  if(!googleListoParaEntrar())return;
  var el=document.getElementById('google-btn-mount');
  if(!el)return;
  if(el.getAttribute('data-montado')==='1'&&el.childElementCount)return;
  el.setAttribute('data-montado','1');
  // Cada hueco dice cómo quiere el botón: el de Entrar va sobre papel claro (outline) y el de la
  // losa de la 06A sobre el bloque oscuro (filled_black). El ancho es el del hueco, entre los
  // límites que Google acepta.
  var ancho=Math.max(200,Math.min(400,Math.round(el.clientWidth||280)));
  google.accounts.id.renderButton(el,{theme:el.getAttribute('data-tema')||'filled_black',size:'large',shape:'rectangular',width:ancho,text:'continue_with',locale:'es'});
  // La tarjeta de One Tap se pide UNA vez por carga y solo si no hay sesion. Sin el
  // guard, `mountGoogleButton()` corre despues de CADA render (ver 08-router) y Google
  // acabaria bloqueando el origen por pedirlo en bucle; y con sesion abierta seria
  // ofrecerle iniciar sesion a alguien que ya la inicio.
  if(_oneTapPedido||cust)return;
  _oneTapPedido=true;
  try{google.accounts.id.prompt();}catch(e){}
}

// ── DIRECCIÓN DEL CLIENTE: GPS, MAPA Y BUSCADOR ─────────────────────────────────────
//
// ⚠ ESTE BLOQUE VIVÍA EN `09-admin-negocio.ts`, bajo un rótulo que decía "// RENDER".
// No es admin ni es el render: es el flujo con el que un CLIENTE elige dónde recibe su
// pedido — el permiso de ubicación, el mapa, el reverse geocoding que rellena el distrito
// y el buscador de direcciones. Estaba en el archivo equivocado, y eso tenía un costo
// concreto: mientras el flujo de dirección del cliente viva dentro del archivo del panel,
// el panel NO se puede sacar del bundle que descarga cada cliente (39% del código, ver
// ARQUITECTURA.md). Moverlo acá, junto al checkout que lo usa, es el primer paso de eso.
//
// No cambia una sola línea de comportamiento: son scripts globales concatenados, las
// funciones se hoistean igual y el estado de arriba solo se inicializa.

// ── LA UBICACIÓN ES SOLO GOOGLE (dueño, 2026-10-01: «No debería derivar nunca al motor
// anterior. Ese motor es muy impreciso») ──────────────────────────────────────────────────
// El motor anterior se fue ENTERO: el buscador, la dirección que se lee bajo el pin y los
// mosaicos del mapa. Antes, cualquier tropiezo con Google caía en silencio a ese motor, y
// el cliente terminaba con un pin a dos cuadras sin que nadie lo supiera. Ahora, si Google
// falla, el cliente lo lee en el mapa y el dueño lo recibe (reportarError → resumen diario).
//
// La causa de que «siguiera el motor viejo» con las keys bien puestas: el script se carga con
// `loading=async`, y en ese modo `google.maps.places` NO existe al terminar de cargar — hay
// que pedir cada librería con `importLibrary`. El código preguntaba «¿está Places?», la
// respuesta era no, y caía callado al motor anterior.
//
// Y el GPS ya no manda: el mapa abre con el BUSCADOR arriba. El GPS de una laptop (por IP) o
// de un celular bajo techo puede errar por cientos de metros; se ofrece como botón y, si su
// precisión es mala, se dice.
var GPS_PRECISO_M=60;
function setGpsHint(msg,color?){var h=(document.getElementById('gps-hint') as HTMLInputElement | null);if(h)h.innerHTML='<span style="color:'+(color||'var(--sw-warn,#ffa500)')+'">'+msg+'</span>';}
// El aviso amarillo del mapa: '' lo esconde.
function avisoMapa(msg){
  var b=(document.getElementById('mmap-accuracy-banner') as HTMLElement | null);
  if(!b)return;
  b.textContent=msg||'';
  b.style.display=msg?'block':'none';
}
function falloGoogle(donde,e){reportarError('ubicacion-google:'+donde,e);}
// Punto de entrada: abre el mapa donde quedó el último pin (o en la tienda) con el buscador
// listo para escribir.
function abrirUbicacion(){
  var lat=typeof window._mLat==='number'?window._mLat:STORE_LAT;
  var lon=typeof window._mLon==='number'?window._mLon:STORE_LON;
  openMap(lat,lon,false);
  setTimeout(function(){var i=(document.getElementById('maddr-input') as HTMLInputElement | null);if(i)i.focus();},350);
}
function doGPS(){
  var btn=(document.getElementById('gps-btn') as HTMLButtonElement | null);
  var txt=btn?btn.innerHTML:'';
  function done(){if(btn){btn.innerHTML=txt;btn.disabled=false;}}
  function fail(err?){
    done();
    var msg='No pudimos obtener tu ubicación. Escribe tu dirección arriba o arrastra el mapa hasta tu puerta.';
    if(err&&err.code===1)msg='El permiso de ubicación está bloqueado (o estás dentro de WhatsApp o Instagram, que no lo dejan usar). Escribe tu dirección arriba.';
    avisoMapa(msg);
  }
  if(!navigator.geolocation){fail();return;}
  if(btn){btn.innerHTML='Buscando tu ubicación…';btn.disabled=true;}
  var ok=function(pos){
    done();
    var prec=Math.round(pos.coords.accuracy||9999);
    openMap(pos.coords.latitude,pos.coords.longitude,false);
    avisoMapa(prec>GPS_PRECISO_M
      ?'Tu ubicación es aproximada (±'+prec+' m). Escribe tu dirección arriba o arrastra el mapa hasta tu puerta.'
      :'');
  };
  navigator.geolocation.getCurrentPosition(ok,function(err){
    // Un GPS "frío" puede tardar más que el primer intento: se reintenta una vez con
    // precisión baja, y la precisión real se le dice al cliente.
    if(err&&err.code===3){
      navigator.geolocation.getCurrentPosition(ok,function(e2){fail(e2);},{timeout:8000,enableHighAccuracy:false,maximumAge:120000});
      return;
    }
    fail(err);
  },{timeout:15000,enableHighAccuracy:true,maximumAge:60000});
}
var _lmap:any=null,_mTimer:any=null;
function openMap(lat,lon,approx){
  var m=(document.getElementById('mmap') as HTMLElement | null);
  if(!m)return;
  m.style.display='flex';
  avisoMapa(approx?'Este pin es aproximado. Arrástralo hasta tu puerta antes de confirmar.':'');
  loadGoogleMaps().then(function(){
    var g=(window as any).google;
    if(!_lmap){
      var MapaG=gClase('maps','Map');
      _lmap=new MapaG(document.getElementById('lmap'),{
        center:{lat:lat,lng:lon},zoom:17,
        disableDefaultUI:true,zoomControl:true,clickableIcons:false,
        // 'greedy': un dedo arrastra el mapa. Con el valor por defecto, en el celular pide dos
        // dedos y el cliente cree que el pin no se mueve.
        gestureHandling:'greedy',
      });
      _lmap.addListener('dragstart',function(){var h=(document.getElementById('maddr-hint') as HTMLElement | null);if(h)h.textContent='Buscando…';});
      _lmap.addListener('idle',function(){
        if(_mTimer)clearTimeout(_mTimer);
        _mTimer=setTimeout(function(){var c=_lmap.getCenter();revGeo(c.lat(),c.lng());},500);
      });
    }else{
      _lmap.setCenter({lat:lat,lng:lon});_lmap.setZoom(17);
    }
    revGeo(lat,lon);
  }).catch(function(e){
    falloGoogle('mapa',e);
    avisoMapa('No pudimos cargar el mapa. Revisa tu conexión y vuelve a intentarlo; si sigue, escríbenos por WhatsApp.');
  });
}
var _revUlt='';
// La mitad celeste de la barra: el envío al punto donde está el pin, con la MISMA cuenta que
// cobra el checkout (envioADireccion). Así el cliente ve el costo antes de confirmar.
function pintarEnvioMapa(lat,lon){
  var km=kmADireccion({lat:lat,lon:lon}),fee=envioADireccion({lat:lat,lon:lon});
  var e=document.getElementById('mmap-envio'),k=document.getElementById('mmap-km');
  if(e)e.textContent=fee==null?'Envío':'Envío '+SOLES_TXT+pz(fee);
  if(k)k.textContent=km==null?'':(Math.round(km*10)/10).toFixed(1)+' km';
}
function revGeo(lat,lon){
  window._mLat=lat;window._mLon=lon;
  pintarEnvioMapa(lat,lon);
  var k=Number(lat).toFixed(6)+','+Number(lon).toFixed(6);
  if(k===_revUlt)return;
  _revUlt=k;
  revGeoGoogle(lat,lon).catch(function(e){
    window._mDistrict='';
    pintarReferenciaMapa('');
    falloGoogle('direccion-del-pin',e);
  });
}
// `google.maps.Geocoder` corre EN EL NAVEGADOR a propósito: la API REST de Geocoding rechaza
// una key restringida por referrer (probado — devuelve REQUEST_DENIED), y quitarle esa
// restricción a la key la dejaría usable por cualquiera que la copie del HTML.
async function revGeoGoogle(lat,lon){
  await loadGoogleMaps();
  var Geo=gClase('geocoding','Geocoder');
  if(!Geo)throw new Error('Google cargó sin el geocodificador');
  var res:any;
  try{res=await new Geo().geocode({location:{lat:lat,lng:lon},language:'es'});}
  catch(e){
    // Google a veces responde «server error, may succeed if you try again» (pasó el 2026-10-01).
    await new Promise(function(r){setTimeout(r,800);});
    res=await new Geo().geocode({location:{lat:lat,lng:lon},language:'es'});
  }
  var r=(res&&res.results&&res.results[0]);
  // Sin resultados no es una falla (un descampado): no hay referencia, y se dice.
  if(!r){window._mDistrict='';pintarReferenciaMapa('');return;}
  var comp=r.address_components||[];
  var buscar=function(tipo){
    var c=comp.find(function(x){return (x.types||[]).indexOf(tipo)>=0;});
    return c?c.long_name:'';
  };
  // En Perú el distrito es `locality`; `administrative_area_level_2` es la provincia. Se
  // prueban varios porque Google no es consistente en toda la ciudad.
  window._mDistrict=districtFromAddress([buscar('locality'),buscar('sublocality'),buscar('administrative_area_level_2'),buscar('administrative_area_level_3')].filter(Boolean).join(', '))||'';
  var calle=buscar('route'),num=buscar('street_number');
  var hint=[calle&&num?calle+' '+num:calle,buscar('sublocality')].filter(Boolean).join(', ');
  pintarReferenciaMapa(hint);
  var inp=(document.getElementById('maddr-input') as HTMLInputElement | null);
  if(inp&&!inp.value&&hint)inp.value=hint;
}

// ── BUSCADOR DE DIRECCIÓN: GOOGLE PLACES ────────────────────────────────────────────────
// COSTO: Autocomplete con `sessionToken` se cobra POR SESIÓN y no por tecla, y una sesión
// cerrada con un Place Details sale gratis en cualquier volumen. Por eso el token se crea al
// empezar a escribir y se DESCARTA al elegir un resultado: reusarlo invalida la sesión y
// Google pasa a cobrar tecla por tecla.
var _addrTimer:any=null,_addrBusy=false,_addrLast='';
var _gmapsPromise:any=null,_gSessionToken:any=null,_gLibs:any=null;
// Las clases de Google, de donde estén: lo que devolvió importLibrary o el namespace global
// (las pruebas inyectan un `google` falso sin importLibrary).
function gClase(lib,nombre){
  var g=(window as any).google;
  return (_gLibs&&_gLibs[lib]&&_gLibs[lib][nombre])||(g&&g.maps&&((lib==='places'?g.maps.places:g.maps)||{})[nombre]);
}
// La key llega en get-store-hours. Si el cliente abre el mapa antes de que esa respuesta
// llegue, se la espera una vez en vez de dar el mapa por perdido.
// Espera a que `google.maps.importLibrary` exista. Con `loading=async` aparece un poco después
// del onload, y el script de «Continuar con Google» (gsi) también escribe en `window.google`:
// según quién termine primero, mirar `google.maps` una sola vez daba «cargó sin el mapa»
// (tres veces en el teléfono del dueño, 2026-10-01).
async function esperarImportLibrary(ms){
  var t0=Date.now();
  while(Date.now()-t0<ms){
    var g=(window as any).google;
    // Se captura `g.maps` en este instante: si otro script reemplaza `window.google` después,
    // las librerías se siguen pidiendo al objeto correcto.
    if(g&&g.maps&&typeof g.maps.importLibrary==='function'){var gm=g.maps;return function(n){return gm.importLibrary(n);};}
    await new Promise(function(r){setTimeout(r,100);});
  }
  return null;
}
async function keyDeGoogle(){
  if(!googleMapsKey){try{await loadStoreHoursBackground();}catch(e){}}
  if(!googleMapsKey)throw new Error('sin key de Google Maps');
  return googleMapsKey;
}
function loadGoogleMaps(){
  if(_gmapsPromise)return _gmapsPromise;
  _gmapsPromise=(async function(){
    var key=await keyDeGoogle();
    var g=(window as any).google;
    var yaPuesto=!!document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if(!(g&&g.maps&&g.maps.importLibrary)&&!yaPuesto){
      // Google llama a esta función si rechaza la key (API apagada, dominio no permitido,
      // facturación). Sin ella, ese rechazo solo se ve en la consola de un teléfono ajeno.
      (window as any).gm_authFailure=function(){
        falloGoogle('key-rechazada',new Error('Google rechazó la key (gm_authFailure): revisa APIs activadas y dominios permitidos'));
        avisoMapa('El mapa no está disponible ahora. Escríbenos por WhatsApp y te tomamos la dirección.');
      };
      await new Promise<void>(function(resolve,reject){
        var sc=document.createElement('script');
        // `language=es&region=PE` no es cosmético: sin region, "Av. España" prioriza España.
        sc.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(key)
          +'&language=es&region=PE&loading=async&v=weekly';
        sc.async=true;
        sc.onload=function(){resolve();};
        sc.onerror=function(){reject(new Error('el script de Google Maps no cargó'));};
        document.head.appendChild(sc);
      });
    }
    var importar=await esperarImportLibrary(10000);
    // Con `loading=async` las librerías NO están al terminar el script: se piden. Este era el
    // defecto que mandaba todo al motor anterior.
    // Se guarda lo que DEVUELVE importLibrary, no se lo busca después en `google.maps.places`:
    // el 2026-10-01 un teléfono real reportó «cargó sin Places» con el namespace aún vacío,
    // y ese chequeo tumbaba también el mapa, que no necesita Places.
    if(importar){
      var libs=await Promise.all([importar('maps'),importar('places'),importar('geocoding')]);
      _gLibs={maps:libs[0],places:libs[1],geocoding:libs[2]};
    }else{
      var g2=(window as any).google;
      _gLibs={maps:g2&&g2.maps,places:g2&&g2.maps&&g2.maps.places,geocoding:g2&&g2.maps};
    }
    if(!_gLibs.maps||!_gLibs.maps.Map)throw new Error('Google Maps cargó sin el mapa (importLibrary '+(importar?'sí':'no')+')');
  })();
  _gmapsPromise.catch(function(){_gmapsPromise=null;});
  return _gmapsPromise;
}
function googleListo(){return !!gClase('places','AutocompleteSuggestion');}
// Un token por sesión de búsqueda. Se pide una sola vez y se suelta al elegir.
function gSessionToken(){
  var T=gClase('places','AutocompleteSessionToken');
  if(!_gSessionToken&&T)_gSessionToken=new T();
  return _gSessionToken;
}
async function buscarConGoogle(q){
  await loadGoogleMaps();
  var AS=gClase('places','AutocompleteSuggestion');
  if(!AS)throw new Error('Google cargó sin el buscador (Places)');
  var r=await AS.fetchAutocompleteSuggestions({
    input:q,
    sessionToken:gSessionToken(),
    // Acotado a Perú y sesgado a Trujillo: el círculo NO excluye, solo ordena — excluir daría
    // "no encontramos nada" en los bordes de la ciudad, que es donde más falta hace acertar.
    includedRegionCodes:['pe'],
    locationBias:{center:{lat:STORE_LAT,lng:STORE_LON},radius:20000},
    language:'es',
  });
  var sug=(r&&r.suggestions)||[];
  return sug.map(function(x){
    var pp=x.placePrediction;
    if(!pp)return null;
    return {
      texto:(pp.text&&pp.text.toString&&pp.text.toString())||String(pp.text||''),
      place:pp,
    };
  }).filter(Boolean);
}

// La referencia que se lee bajo el pin. Desde que el mapa se rehizo (2026-09-17) ese hueco
// es la línea principal de la hoja inferior, no un pie de página: si se deja vacío queda un
// renglón en blanco encima del botón de confirmar y la hoja parece rota. Sin referencia se
// vuelve a la instrucción, que es lo único cierto en ese momento.
function pintarReferenciaMapa(hint){
  var h=(document.getElementById('maddr-hint') as HTMLElement | null);
  if(!h)return;
  h.innerHTML=hint?esc(hint):'<i>Arrastra el mapa hasta tu puerta</i>';
}
function addrResultsEl(){return(document.getElementById('maddr-results') as HTMLElement | null);}
function addrSearchTyped(){
  if(_addrTimer)clearTimeout(_addrTimer);
  _addrTimer=setTimeout(addrSearchNow,400);
}
function addrSearchNow(){
  if(_addrTimer){clearTimeout(_addrTimer);_addrTimer=null;}
  var inp=(document.getElementById('maddr-input') as HTMLInputElement | null);
  var q=inp?inp.value.trim():'';
  var box=addrResultsEl();
  if(!box)return;
  if(q.length<3){box.style.display='none';box.innerHTML='';return;}
  if(_addrBusy||q===_addrLast)return;
  _addrBusy=true;_addrLast=q;
  box.style.display='block';
  box.innerHTML='<div class="n">Buscando…</div>';
  buscarConGoogle(q).then(function(hits){
    _addrBusy=false;
    if(!hits.length){pintarSinResultados(box);return;}
    (window as any)._addrHits=hits;
    box.innerHTML=hits.map(function(h,i){
      return'<button class="f" onclick="addrPick('+i+')">'+esc(h.texto)+'</button>';
    }).join('');
  }).catch(function(e){
    // Nunca cae a otro motor: se dice, y al dueño le llega.
    _addrBusy=false;_addrLast='';
    falloGoogle('buscador',e);
    box.innerHTML='<div class="n mal">No pudimos buscar ahora. Intenta de nuevo en un momento, o arrastra el mapa hasta tu puerta.</div>';
  });
}
function pintarSinResultados(box){
  box.innerHTML='<div class="n">No encontramos esa dirección. Prueba con la calle y el número, o arrastra el mapa hasta tu puerta.</div>';
}
// Elegir un resultado mueve el pin, pero NO cierra el mapa ni confirma: la persona mira que
// el pin quedó en su puerta y recién confirma.
async function addrPick(i){
  var list=(window as any)._addrHits||[];
  var r=list[i];
  if(!r)return;
  var box=addrResultsEl();
  if(box){box.style.display='none';box.innerHTML='';}
  avisoMapa('');
  var lat=NaN,lon=NaN;
  // Un resultado de Google todavía no trae coordenadas: hay que pedir el Place Details. Esa
  // llamada es la que CIERRA la sesión de autocompletado y la vuelve gratis, así que no es
  // un costo extra — es lo que evita que se cobre tecla por tecla.
  if(r.place&&r.place.toPlace){
    try{
      var place=r.place.toPlace();
      await place.fetchFields({fields:['location','formattedAddress']});
      if(place.location){lat=place.location.lat();lon=place.location.lng();}
      // El texto que el motorizado va a leer sale de Google, que sí trae el número. Solo se
      // escribe si el cliente no puso nada suyo: lo que él escribió (una referencia, un
      // interior) vale más que la versión canónica de una API.
      var inp=(document.getElementById('maddr-input') as HTMLInputElement | null);
      if(inp&&place.formattedAddress&&(!inp.value||inp.value===r.texto))inp.value=place.formattedAddress;
    }catch(e){falloGoogle('detalle-del-lugar',e);}
    // El token se suelta acá, pase lo que pase. Reusarlo invalida la sesión y Google cobra
    // cada tecla como una llamada suelta.
    _gSessionToken=null;
  }
  if(!isFinite(lat)||!isFinite(lon))return;
  if(_lmap){_lmap.setCenter({lat:lat,lng:lon});_lmap.setZoom(18);revGeo(lat,lon);}
  else{openMap(lat,lon,false);}
}

// Pantalla a la que vuelve el mapa al confirmar ('' = el checkout de siempre) y, si el mapa se
// abrió para ubicar una dirección GUARDADA que no tenía pin, cuál.
var mapaVuelveA:string|null=null,mapaDirId:any=null;
function abrirMapaPara(vuelve:string,dirId:any,textoInicial:string){
  mapaVuelveA=vuelve;mapaDirId=dirId;
  abrirUbicacion();
  if(textoInicial){
    var i=(document.getElementById('maddr-input') as HTMLInputElement|null);
    if(i){i.value=textoInicial;setTimeout(addrSearchNow,400);}
  }
}
function closeMap(){mapaVuelveA=null;mapaDirId=null;(document.getElementById('mmap') as HTMLInputElement | null).style.display='none';}
function confirmMap(){
  var inp=(document.getElementById('maddr-input') as HTMLInputElement | null);
  var a=inp?inp.value.trim():'';
  // Sin texto escrito vale lo que Google leyó bajo el pin. Antes «Es acá» no hacía nada y no
  // decía por qué: parecía que el mapa no dejaba seguir.
  if(!a){var hm=(document.getElementById('maddr-hint') as HTMLElement|null);var t=hm&&!hm.querySelector('i')?(hm.textContent||'').trim():'';if(t&&t!=='Buscando…')a=t;}
  if(!a){
    avisoMapa('Escribe tu calle y número arriba (o una referencia) para que el motorizado te encuentre.');
    if(inp)inp.focus();
    return;
  }
  if(_lmap){var c=_lmap.getCenter();window._mLat=c.lat();window._mLon=c.lng();}
  // Solo se esconde: closeMap() además olvida a qué pantalla volver (es la ✕ del mapa).
  (document.getElementById('mmap') as HTMLElement).style.display='none';
  // Antes esto escribía la dirección directo en el input y no repintaba, para no perder
  // lo que el cliente tuviera a medio escribir en los otros campos. Ahora sí repinta,
  // porque la tarifa de envío se calcula desde el pin (ver deliveryFeeBase) y sin un render
  // el cliente no vería el monto nuevo hasta tocar cualquier otra cosa — o sea, justo
  // cuando ya no sirve. syncConfirmFields() antes del render es lo que hace
  // que nada de lo escrito se pierda; addrText se fija después porque la dirección que
  // vale es la que se acaba de elegir en el mapa, no la que había en el input.
  syncConfirmFields();
  addrText=a;
  // Si el pin cae claramente en otro distrito del que estaba elegido, no tiene sentido
  // dejar el anterior: el mapa es un dato más fuerte que un selector que el cliente
  // quizá ni tocó.
  // El pin manda sobre el texto: alguien puede escribir "casa de mi mamá" y el mapa igual
  // sabe dónde está. Solo si el reverse geocoding no reconoció el distrito se cae a
  // adivinarlo de lo escrito, que es lo único que había antes.
  var inferred=window._mDistrict||districtFromAddress(a);
  if(inferred){deliveryDistrict=inferred;deliveryDistrictFromPin=!!window._mDistrict;}
  // El mapa también lo usan «Tus direcciones» y el cierre del pedido en grupo: vuelve a la
  // pantalla que lo abrió con el texto y el pin (despuesDelMapa, 07-*).
  if(mapaVuelveA){var vuelve=mapaVuelveA;mapaVuelveA=null;despuesDelMapa(vuelve,a);return;}
  // Desde «Otra dirección» de la 34: la dirección queda elegida y se vuelve al recibo.
  if(volverDelMapa){volverDelMapa=false;pickedAddrId=null;go('o_cart');return;}
  render();
  var el=(document.getElementById('o-addr') as HTMLInputElement | null);
  // El resaltado usa el ACENTO del lado, no el azul de "pedido en preparación". Ese azul es
  // un color de ESTADO de la cola del panel; acá decía "te llenamos la dirección", que no es
  // un estado de pedido — y en una app sin azul en ningún otro sitio, aparecía de la nada.
  if(el){el.style.borderColor=ACC();el.focus();}
  var h=(document.getElementById('gps-hint') as HTMLInputElement | null);
  if(h)h.innerHTML='<a href="https://maps.google.com/?q='+window._mLat+','+window._mLon+'" target="_blank" style="color:'+GOLD+';font-size:11px;text-decoration:none">&#128205; Ver pin en Google Maps</a>';
  // Y al apagarse vuelve al borde REAL de un input (`--sw-border-soft`, el que pone `INP()`),
  // no a `--sw-on-gold`, que es el color del TEXTO sobre dorado. Ese token quedó acá en la
  // tokenización y dejaba el campo con un borde que no significa nada — el defecto no se ve
  // hasta que alguien usa el GPS, y entonces el campo queda marcado de un color ajeno.
  setTimeout(function(){var e=(document.getElementById('o-addr') as HTMLInputElement | null);if(e)e.style.borderColor='var(--sw-border-soft,#1c1c1c)';},3000);
}

// Recordamos qué pantalla se pintó la última vez para distinguir "sigo en la
// misma pantalla, solo cambió algo" (hay que mantener el scroll donde estaba)
// de "el usuario navegó a otra pantalla" (ahí sí corresponde subir al inicio).
// Esto evita el salto visible al tope cada vez que algo se actualiza solo
// (poll del panel admin) o con cada toque al armar un pedido.
