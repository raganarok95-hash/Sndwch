// CARRITO + CHECKOUT
function cartItemsHTML(){
  if(!cart.length)return'<div style="text-align:center;padding:24px 0"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:'+GOLD+';letter-spacing:.2em">Carrito vacío //</div></div>';
  return cart.map(function(it,idx){
    var extras=itemExtrasLabel(it);
    var canEdit=it.type!=='side';
    return'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div style="flex:1"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(itemLabel(it))+'</div>'+(extras?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(extras)+'</div>':'')+'</div><div style="display:flex;gap:10px;flex-shrink:0">'+(canEdit?'<button onclick="editCartItem('+idx+')" style="all:unset;cursor:pointer;color:'+GOLD+';font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px">Editar</button>':'')+'<button onclick="cartRemove('+idx+')" style="all:unset;cursor:pointer;color:#ff8888;font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px">Quitar</button></div></div>'+(canEdit?'<div onclick="editItemNote('+idx+')" style="cursor:pointer;margin-top:4px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0)">'+(it.note?icon('reclamo',11,'#A8C8B0')+'<span style="margin-left:5px">'+esc(it.note)+'</span>':'+ agregar nota (ej. sin cebolla)')+'</div>':'')+'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><div style="display:flex;align-items:center;gap:10px"><button onclick="cartQtyChange('+idx+',-1)" aria-label="Quitar una unidad" style="all:unset;cursor:pointer;width:44px;height:44px;line-height:44px;background:var(--sw-card2,#1A3028);border-radius:6px;text-align:center;color:var(--sw-text,#FFFFFF);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:600">−</button><span class="bump" style="display:inline-block;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);min-width:16px;text-align:center">'+it.qty+'</span><button onclick="cartQtyChange('+idx+',1)" aria-label="Agregar una unidad" style="all:unset;cursor:pointer;width:44px;height:44px;line-height:44px;background:var(--sw-card2,#1A3028);border-radius:6px;text-align:center;color:var(--sw-text,#FFFFFF);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:600">+</button></div><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:'+GOLD+'">'+SOLES+pz(itemLineTotal(it))+'</span></div></div>';
  }).join('');
}
// Edita un producto ya en el carrito: lo saca y precarga el builder con su
// configuración exacta, para no tener que rearmarlo desde cero.
function editCartItem(idx){
  var it=cart[idx];
  if(!it||it.type==='side')return;
  syncConfirmFields();
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
    return'<div style="margin-top:16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Usa tus puntos //</div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">No se puede combinar con el código promocional aplicado abajo — quítalo primero si prefieres usar una recompensa.</div></div>';
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
    return'<div style="margin-top:16px;background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.2);border-radius:8px;padding:12px 14px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:4px">Tus puntos //</div><div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">Te faltan <span style="color:var(--sw-text-body,#F2F0EB);font-weight:700">'+missingPts+' pts</span> para '+cheapest.n+' // '+cheapest.s+'.</div></div>';
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
    var reqText=r.id==='R06'?' · agrega un sándwich 15CM para usarla'
      :r.id==='R04'?' · agrega un sándwich con doble proteína para usarla'
      :r.id==='R02'?' · agrega salsa extra a un sándwich para usarla'
      :r.id==='R03'?(r03FlatPriceItem?' · ese sándwich ya cuesta igual en 30CM, no hay nada que perdonar':' · agrega un sándwich 15CM para usarla')
      :r.id==='R05'?' · agrega una bebida para usarla'
      :' · agrega algo a tu carrito para usarla';
    // SOLES (con <span>) es HTML pensado para insertarse crudo — pero `sub` entero pasa
    // por esc() más abajo, así que había que usar SOLES_TXT (texto plano) acá, no SOLES.
    // Antes se veía literalmente "<span style=...>S/</span>4" en pantalla al aplicar
    // cualquier recompensa con ahorro (hallazgo de auditoría UX, ALTO, confirmado por
    // 2 agentes independientes).
    var sub=r.d+(!eligible?reqText:'')+(selected&&savings>0?' · ahorras '+SOLES_TXT+savings+' en '+targetLabel:(selected?' · se incluye con tu pedido':''));
    return'<div onclick="'+(eligible?'toggleReward(\''+r.id+'\')':'')+'" style="background:'+(selected?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(selected?GOLD:'#3A6B58')+';border-radius:10px;padding:12px 14px;margin-bottom:8px;cursor:'+(eligible?'pointer':'not-allowed')+';opacity:'+(eligible?1:.4)+';box-shadow:'+(selected?SHADOW_GOLD:SHADOW_SM)+'"><div style="display:flex;justify-content:space-between;align-items:center"><div style="flex:1;padding-right:8px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+r.n+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+r.s+'</div><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">'+esc(sub)+'</div></div><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:16px;color:'+(selected?GOLD:'#A8C8B0')+';flex-shrink:0">'+(selected?'✓':'○')+'</span></div></div>';
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
    return box+'<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(37,211,102,.3);border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;gap:8px"><span style="font-family:\'EB Garamond\',serif;font-size:12px;color:#25D366">'+esc(appliedPromo.code)+' aplicado · ahorras '+SOLES_TXT+pz(appliedPromo.discount)+'</span><span onclick="removePromoCode()" style="cursor:pointer;flex-shrink:0;font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:#ff8888">Quitar</span></div></div>';
  }
  // Un código promocional y una recompensa de puntos no se pueden combinar en el mismo
  // pedido (mismo criterio que combo/hora-valle: nunca se suman) — el servidor ya lo
  // rechaza, esto solo evita que el cliente llegue a intentarlo sin saber por qué falla.
  if(appliedReward){
    return box+'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">No se puede combinar con la recompensa aplicada arriba — quítala primero si prefieres usar un código.</div></div>';
  }
  // Colapsado detrás de un enlace hasta que el cliente diga que tiene un código. Un campo
  // de cupón siempre visible es una de las fugas clásicas del checkout: le recuerda al
  // que no tiene ninguno que "podría estar pagando menos", y se va a buscar uno a otra
  // pestaña de la que muchas veces no vuelve. Quien sí tiene código lo busca igual.
  if(!promoFieldOpen){
    return box+'<div onclick="promoFieldOpen=true;confirmRerender()" style="cursor:pointer;font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:var(--sw-text-muted,#A8C8B0);text-decoration:underline;text-underline-offset:3px">¿Tienes un código?</div></div>';
  }
  return box+'<div style="display:flex;gap:8px"><input id="o-promo" type="text" placeholder="Opcional" oninput="promoStatus=\'\';renderPromoStatus()" style="flex:1;min-width:0;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:10px 12px;color:var(--sw-text,#FFFFFF);font-family:\'EB Garamond\',serif;font-size:16px;text-transform:uppercase"/>'
    +'<button onclick="applyPromoCode()" style="flex-shrink:0;background:var(--sw-card2,#1A3028);border:1px solid '+GOLD+';border-radius:8px;padding:0 16px;cursor:pointer;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;color:'+GOLD+'">Aplicar</button></div>'
    +'<div id="o-promo-status" style="font-family:\'EB Garamond\',serif;font-size:11px;color:#ff8888;margin-top:6px;min-height:14px">'+esc(promoStatus)+'</div></div>';
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
  var phone=cust?cust.phone:gv('o-phone').trim();
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
    var schedEl=(document.getElementById('o-sched') as HTMLInputElement|null);
    var promoSchedIso=null;
    if(scheduleMode==='later'&&schedEl&&schedEl.value){
      var pd=new Date(schedEl.value);
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
  var a=myAddresses.find(function(x){return x.id===id;});
  if(!a)return;
  syncConfirmFields();
  pickedAddrId=id;addrText=a.address;
  // Si la dirección guardada ya menciona el distrito, se preselecciona — el cliente no
  // tiene que volver a elegir algo que ya escribió cuando la guardó.
  var inferred=districtFromAddress(a.address);
  if(inferred)deliveryDistrict=inferred;
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
  var offPeak=isOffPeakDrinkPromoActiveNow();
  var titulo=offPeak
    ?'Es hora valle — tu bebida va GRATIS (hasta '+SOLES_TXT+OFFPEAK_DRINK_PROMO_CAP+')'
    :'¿Le sumas algo de tomar? Ahorras '+SOLES_TXT+COMBO_DISCOUNT_PER_PAIR+' en combo';
  var chips=SIDES.map(function(d){
    return'<div onclick="addSideToCart(\''+d.id+'\')" style="flex:1;min-width:72px;background:var(--sw-card,#2D5246);border:1px solid #3A6B58;border-radius:10px;padding:10px 8px;cursor:pointer;text-align:center">'
      +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;color:var(--sw-text,#FFFFFF);line-height:1.25">'+esc(d.l)+'</div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:1px">'+esc(d.s)+'</div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:'+GOLD+';margin-top:4px">+'+SOLES_TXT+d.p+'</div>'
      +'</div>';
  }).join('');
  return'<div style="margin-top:16px;background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.25);border-radius:10px;padding:12px 14px">'
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
// C4 — Distancia máxima (km) que cubre cada zona de PRECIO, derivada del único dato de
// tarifa que el propio negocio publica al cliente: "~S/2 por km" (ver el texto bajo el
// home). Con esa tarifa el fee de cada zona describe su alcance: S/6 → 3 km, S/8 → 4 km,
// S/12 → 6 km, y de ahí para arriba MUY LEJOS. No es una geocerca ni una validación:
// existe solo para AVISAR cuando la zona elegida y el pin del mapa no cuadran. Nunca
// bloquea el pedido — un pin puede caer mal (GPS en interiores, mapa arrastrado a ojo) y
// el cliente conoce su dirección mejor que el navegador. El cobro real lo sigue fijando
// la zona que él eligió.
var DELIVERY_ZONE_MAX_KM={cerca:3,media:4,lejos:6};
function zoneForKm(km){
  if(km<=DELIVERY_ZONE_MAX_KM.cerca)return'cerca';
  if(km<=DELIVERY_ZONE_MAX_KM.media)return'media';
  if(km<=DELIVERY_ZONE_MAX_KM.lejos)return'lejos';
  return'muy_lejos';
}
// Distancia entre el pin que el cliente confirmó en el mapa y el punto de despacho.
// Devuelve null si nunca tocó el mapa/GPS — sin pin no hay nada que comparar y no se
// muestra ningún aviso (la mayoría de los pedidos escriben la dirección a mano).
function pinDistanceKm(){
  if(typeof window._mLat!=='number'||typeof window._mLon!=='number')return null;
  return haversineKm(window._mLat,window._mLon,STORE_LAT,STORE_LON);
}
function applySuggestedZone(z){deliveryZone=z;confirmRerender();}
// Aviso de zona vs. pin. Las dos direcciones del desajuste importan, por motivos
// distintos: si el cliente eligió una zona más BARATA de lo que dice el pin, el dueño
// pone la diferencia de su bolsillo (el delivery es pass-through, no tiene margen del
// que salga); si eligió una más CARA, está pagando de más y avisarle es lo honesto.
// Por eso los dos casos se avisan, con texto distinto.
function deliveryZoneMismatchHTML(){
  var km=pinDistanceKm();
  if(km===null)return'';
  var sug=zoneForKm(km);
  if(sug===deliveryZone)return'';
  var zSel=DELIVERY_PRICE_ZONES.find(function(x){return x.id===deliveryZone;});
  var zSug=DELIVERY_PRICE_ZONES.find(function(x){return x.id===sug;});
  if(!zSel||!zSug)return'';
  var masCaro=zSug.fee>zSel.fee;
  var txt=masCaro
    ?'Tu pin está a ~'+km.toFixed(1)+' km, que corresponde a '+zSug.l.toUpperCase()+'. Si dejas '+zSel.l.toUpperCase()+', puede que el motorizado te pida la diferencia al llegar.'
    :'Tu pin está a ~'+km.toFixed(1)+' km: te alcanza '+zSug.l.toUpperCase()+' ('+SOLES_TXT+zSug.fee+') y estás pagando '+SOLES_TXT+zSel.fee+'.';
  var color=masCaro?'#ffb84d':GOLD;
  return'<div style="margin-top:10px;background:rgba(203,162,88,.08);border:1px solid '+color+';border-radius:8px;padding:10px 12px">'
    +'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-body,#F2F0EB);line-height:1.45">'+esc(txt)+'</div>'
    +'<button onclick="applySuggestedZone(\''+sug+'\')" style="all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;margin-top:8px;background:transparent;border:1px solid '+color+';color:'+color+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;letter-spacing:.05em;padding:9px;border-radius:8px;text-align:center">Cambiar a '+esc(zSug.l.toUpperCase())+' // '+SOLES_TXT+zSug.fee+'</button>'
    +'</div>';
}
function districtPickerHTML(){
  var opts=DELIVERY_DISTRICTS.map(function(d){
    var sel=deliveryDistrict===d.id;
    return'<option value="'+d.id+'"'+(sel?' selected':'')+(d.out?' disabled':'')+'>'+esc(d.l)+(d.out?' — todavía no llegamos aquí':'')+'</option>';
  }).join('');
  var out=DELIVERY_DISTRICTS.filter(function(d){return d.out;}).map(function(d){return d.l;}).join(' y ');
  return'<div>'
    +'<label for="o-district" style="display:block;font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:6px">Distrito //</label>'
    +'<select id="o-district" onchange="pickDistrict(this.value)" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px;color:var(--sw-text,#FFFFFF);width:100%;font-size:16px;box-shadow:'+SHADOW_SM+';box-sizing:border-box;-webkit-appearance:none;appearance:none">'
    +'<option value=""'+(deliveryDistrict?'':' selected')+'>Elige tu distrito</option>'+opts+'</select>'
    +'<div id="o-district-hint" style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:5px">'+esc('Por ahora no llegamos a '+out+'.')+'</div>'
    +'</div>';
}
// No re-renderiza el checkout entero a propósito: hacerlo borraría lo que el cliente
// tenga escrito a medias en los inputs de arriba (nombre/dirección/referencia solo se
// vuelcan a las variables en syncConfirmFields).
function pickDistrict(id){
  deliveryDistrict=id||'';
  var hint=document.getElementById('o-district-hint');
  if(hint)hint.textContent=deliveryDistrict&&deliveryDistrict!=='otro'
    ?'Entregamos en '+((districtById(deliveryDistrict)||{}).l||'')+'.'
    :'Por ahora no llegamos a '+DELIVERY_DISTRICTS.filter(function(d){return d.out;}).map(function(d){return d.l;}).join(' y ')+'.';
}
function deliveryZonePickerHTML(){
  var h='<div style="margin-top:16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Zona de entrega //</div><div style="display:flex;flex-wrap:wrap;gap:8px">';
  h+=DELIVERY_PRICE_ZONES.map(function(z){
    var sel=deliveryZone===z.id;
    // La zona seleccionada muestra el fee REAL que se va a cobrar (inflado si el pedido
    // va por Culqi, ver willPayWithCard()) — antes siempre mostraba el fee plano de
    // catálogo aunque el total ya llevara el recargo de tarjeta sumado, dejando sin
    // explicar por qué zona+comida no sumaban el total mostrado (residual del mismo
    // hallazgo P2, auditoría UX).
    var shownFee=sel?deliveryFeeAmount():z.fee;
    return'<div onclick="deliveryZone=\''+z.id+'\';confirmRerender()" style="flex:1;min-width:110px;text-align:center;background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:8px;padding:10px 8px;cursor:pointer"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;color:'+(sel?'#fff':'#A8C8B0')+'">'+z.l+'</div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:'+(sel?GOLD:'#A8C8B0')+';margin-top:2px">'+SOLES_TXT+shownFee+'</div></div>';
  }).join('');
  h+='</div>'+deliveryZoneMismatchHTML()+'<div style="font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px;display:flex;align-items:center;gap:6px">'+icon('moto',11,'#A8C8B0')+'<span>El delivery se paga junto con tu pedido — el motorizado te lo entrega en la puerta.</span></div></div>';
  return h;
}
function checkoutExtrasHTML(){
  var t=cartFinalTotal();
  var payT=payableTotal();
  var pBox=cust
    ?'<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.2);border-radius:8px;padding:12px;margin-top:14px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:4px">Puntos que ganarás //</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:var(--sw-text,#FFFFFF)">+'+t+' pts <span style="font-size:11px;color:var(--sw-text-muted,#A8C8B0);font-weight:600">pendientes hasta confirmar pago</span></div></div>'
    :'<div onclick="swTab(\'points\')" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:12px;margin-top:14px;cursor:pointer"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:'+GOLD+'">↗ Regístrate en PUNTOS para ganar +'+t+' pts</div></div>';
  var payingWithCreditFully=useCredit&&cust&&(cust.credit_balance||0)>=payT;
  return pBox
    +comboDrinkNudgeHTML()
    // Antes, al elegir Yape/Plin, el picker de recompensas se ocultaba por completo y no
    // quedaba NINGUNA confirmación de que la recompensa ya aplicada seguía activa (el
    // descuento sí sigue funcionando en el monto a transferir, pero visualmente parecía
    // perdida) — hallazgo de auditoría UX, MEDIO.
    +(manualPayMethod
      ?(appliedReward?(function(){var r=RWDS.find(function(x){return x.id===appliedReward;});return r?'<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(37,211,102,.3);border-radius:8px;padding:10px 14px;margin-top:14px;font-family:\'EB Garamond\',serif;font-size:12px;color:#25D366;display:flex;align-items:center;gap:6px">'+icon('gift',12,'#25D366')+'Recompensa aplicada: '+esc(r.n+' '+r.s)+'</div>':'';})():'')
      :rewardsPickerHTML()+promoCodeHTML())
    // "Contacto y entrega //" y "Entrega y horario //" — antes esto era ~9 bloques
    // apilados sin ninguna frontera visual propia entre sí, un scroll largo sin dividir
    // (hallazgo de auditoría UX, P1) pese a que el patrón <details>/<summary> ya existe
    // en "Todos los extras //" (ver sOItemConfirm). Envueltos ahora en <details open> —
    // siguen mostrando exactamente el mismo contenido por defecto (ningún campo
    // obligatorio queda oculto), pero el cliente puede colapsarlos una vez completados
    // para acortar el scroll del resto del checkout.
    +'<details open style="margin-top:20px"><summary style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;cursor:pointer;list-style:none">Contacto y entrega //</summary><div style="margin-top:10px">'
    +(!cust||!myAddresses.length?'':'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">'+myAddresses.map(function(a){var sel=pickedAddrId===a.id;return'<div onclick="pickAddr(\''+a.id+'\')" style="background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:20px;padding:8px 14px;cursor:pointer;font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:'+(sel?'#fff':'#A8C8B0')+'">'+esc(a.label)+'</div>';}).join('')+'</div>')
    +'<div style="display:flex;flex-direction:column;gap:10px">'+INP('o-nom','Nombre // Tu nombre','text',confNom,'clientes','name')+INP('o-phone','Teléfono // 9XXXXXXXX','tel',confPhone,'phone','tel')+INP('o-email','Correo // Opcional, para tu comprobante','email',confEmail,'mail','email')+'<div style="position:relative">'+INP('o-addr','Dirección // Calle o usa GPS','text',addrText,'direccion','street-address')+'<button id="gps-btn" onclick="doGPS()" aria-label="Usar mi ubicación actual" style="all:unset;cursor:pointer;position:absolute;right:0;top:0;bottom:0;width:44px;display:flex;align-items:center;justify-content:center;color:var(--sw-text-muted,#A8C8B0)">'+icon('gps',16,'#A8C8B0')+'</button></div>'+'<div id="gps-hint" style="min-height:12px;margin-top:3px"></div>'+districtPickerHTML()+INP('o-notes','Referencia // portón, piso, cerca de... (opcional)','text',confNotes)+'</div>'
    +(scheduleMode==='now'?'<div style="margin-top:16px;background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.25);border-radius:10px;padding:12px 14px"><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);line-height:1.4;display:flex;align-items:flex-start;gap:8px">'+icon('horario',13,'#A8C8B0')+'<span>Tiempo estimado: <b style="color:var(--sw-text,#FFFFFF)">'+ESTIMATED_DELIVERY_RANGE[0]+'-'+ESTIMATED_DELIVERY_RANGE[1]+' min</b> desde que confirmamos tu pedido.</span></div></div>':'')
    +'</div></details>'
    +'<details open style="margin-top:16px"><summary style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;cursor:pointer;list-style:none">Entrega y horario //</summary><div style="margin-top:10px">'
    +deliveryZonePickerHTML()
    +'<div style="margin-top:16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">¿Cuándo? //</div><div style="display:flex;gap:8px;margin-bottom:8px"><div onclick="scheduleMode=\'now\';confirmRerender()" style="flex:1;text-align:center;background:'+(scheduleMode==='now'?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(scheduleMode==='now'?GOLD:'#3A6B58')+';border-radius:8px;padding:10px;cursor:pointer;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:#fff">Ahora</div><div onclick="scheduleMode=\'later\';initSchedDefault();confirmRerender()" style="flex:1;text-align:center;background:'+(scheduleMode==='later'?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(scheduleMode==='later'?GOLD:'#3A6B58')+';border-radius:8px;padding:10px;cursor:pointer;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:#fff">Programar</div></div>'
    // Antes el aviso de "estamos cerrados" solo aparecía como error al tocar pagar, al
    // final de todo el checkout — un cliente podía llenar nombre/dirección/método de
    // pago completos antes de enterarse. Ahora aparece apenas elige "Ahora" con la
    // tienda cerrada (hallazgo de auditoría UX, BAJO).
    +(scheduleMode==='now'&&!storeStatus().open?'<div style="background:rgba(255,85,85,.08);border:1px solid rgba(255,85,85,.3);border-radius:8px;padding:10px 14px;margin-bottom:8px;font-family:\'EB Garamond\',serif;font-size:11px;color:#ff8888;display:flex;align-items:center;gap:7px">'+icon('horario',13,'#ff8888')+'<span>'+esc(storeStatus().label)+' — elige "Programar" para pedir dentro de nuestro horario.</span></div>':'')
    +(scheduleMode==='later'?scheduleTimePickerHTML():'')+'</div>'
    +'</div></details>'
    +(!cust||(cust.credit_balance||0)<=0?'':(function(){var canCover=(cust.credit_balance||0)>=payT;var checked=useCredit&&canCover;return'<div onclick="'+(canCover?'useCredit=!useCredit;if(useCredit)manualPayMethod=null;confirmRerender()':'')+'" style="margin-top:16px;background:'+(checked?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(checked?GOLD:'#3A6B58')+';border-radius:10px;padding:14px 16px;cursor:'+(canCover?'pointer':'not-allowed')+';opacity:'+(canCover?1:.5)+';box-shadow:'+(checked?SHADOW_GOLD:SHADOW_SM)+'"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">Pagar con mi crédito</div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">Disponible: '+SOLES+(cust.credit_balance||0)+(canCover?'':' · no alcanza para este pedido')+'</div></div><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:16px;color:'+(checked?GOLD:'#A8C8B0')+'">'+(checked?'✓':'○')+'</span></div></div>';})())
    // Con recompensa el total puede llegar a S/0 — antes igual se mostraba el selector
    // TARJETA/YAPE/PLIN (y "YA REALICÉ EL PAGO //" si había un método manual elegido
    // antes) para un pedido que no cuesta nada.
    +(payingWithCreditFully||payT===0?'':paymentMethodPickerHTML(payT))
    +(checkoutLocked?'<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:#ff5555;margin-top:12px;background:rgba(255,85,85,.08);border:1px solid rgba(255,85,85,.3);border-radius:8px;padding:12px">'+esc(lockedMsg)+'</div>':'')
    +'<div id="o-err" style="font-family:\'EB Garamond\',serif;font-size:12px;color:#ff5555;margin-top:8px;min-height:16px"></div>'
    // Los clientes en su primer pedido reciben este mismo ofrecimiento, más prominente,
    // justo después de que el pago se confirma (ver sOSent) — no se les pregunta dos
    // veces en la misma compra.
    +(!cust||pushSubscribed||!cust.total_orders||!('serviceWorker' in navigator)||!('PushManager' in window)?'':'<div onclick="togglePushNotifications()" style="margin-top:16px;background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.3);border-radius:10px;padding:14px 16px;cursor:pointer"><div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.4;display:flex;align-items:center;gap:8px">'+icon('notif',13,GOLD)+'<span>Te notificamos del estado de tu pedido<span style="color:'+GOLD+'"> — </span><span style="color:'+GOLD+';font-weight:700">actívalo aquí →</span></span></div>'+(pushMsg?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:'+GOLD+';margin-top:6px">'+esc(pushMsg)+'</div>':'')+'</div>');
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
function qrPolyMultiply(a,b){
  var num=new Array(a.length+b.length-1);
  for(var i=0;i<num.length;i++)num[i]=0;
  for(var i=0;i<a.length;i++)for(var j=0;j<b.length;j++)num[i+j]^=qrGexp(qrGlog(a[i])+qrGlog(b[j]));
  return qrPolyNew(num,0);
}
function qrPolyMod(a,b){
  if(a.length-b.length<0)return a;
  var ratio=qrGlog(a[0])-qrGlog(b[0]);
  var num=a.slice();
  for(var i=0;i<b.length;i++)num[i]^=qrGexp(qrGlog(b[i])+ratio);
  return qrPolyMod(qrPolyNew(num,0),b);
}
function qrErrorCorrectPolynomial(len){
  var a=[1];
  for(var i=0;i<len;i++)a=qrPolyMultiply(a,[1,qrGexp(i)]);
  return a;
}
// count,total,data por bloque — índice (typeNumber-1)*4+ecIdx con ecIdx L=0,M=1,Q=2,H=3.
var qrRSBlockTable=[
  [1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],
  [1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],
  [1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],
  [2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],
  [2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],
];
function qrGetRSBlocks(typeNumber,ecIdx){
  var row=qrRSBlockTable[(typeNumber-1)*4+ecIdx];
  var list=[];
  var len=row.length/3;
  for(var i=0;i<len;i++){
    var count=row[i*3],totalCount=row[i*3+1],dataCount=row[i*3+2];
    for(var j=0;j<count;j++)list.push({totalCount:totalCount,dataCount:dataCount});
  }
  return list;
}
function qrBufNew(){return{buffer:[],length:0};}
function qrBufPutBit(buf,bit){
  var bufIndex=Math.floor(buf.length/8);
  if(buf.buffer.length<=bufIndex)buf.buffer.push(0);
  if(bit)buf.buffer[bufIndex]|=(0x80>>>(buf.length%8));
  buf.length++;
}
function qrBufPut(buf,num,length){for(var i=0;i<length;i++)qrBufPutBit(buf,((num>>>(length-i-1))&1)===1);}
function qrLengthBits(typeNumber){return typeNumber<10?8:16;}
function qrStringToBytes(s){
  var out=[];
  var utf8=unescape(encodeURIComponent(s));
  for(var i=0;i<utf8.length;i++)out.push(utf8.charCodeAt(i)&0xff);
  return out;
}
function qrCreateBytes(buffer,rsBlocks){
  var offset=0,maxDcCount=0,maxEcCount=0;
  var dcdata=new Array(rsBlocks.length),ecdata=new Array(rsBlocks.length);
  for(var r=0;r<rsBlocks.length;r++){
    var dcCount=rsBlocks[r].dataCount,ecCount=rsBlocks[r].totalCount-dcCount;
    maxDcCount=Math.max(maxDcCount,dcCount);maxEcCount=Math.max(maxEcCount,ecCount);
    dcdata[r]=new Array(dcCount);
    for(var i=0;i<dcdata[r].length;i++)dcdata[r][i]=0xff&buffer.buffer[i+offset];
    offset+=dcCount;
    var rsPoly=qrErrorCorrectPolynomial(ecCount);
    var rawPoly=qrPolyNew(dcdata[r],rsPoly.length-1);
    var modPoly=qrPolyMod(rawPoly,rsPoly);
    ecdata[r]=new Array(rsPoly.length-1);
    for(var i2=0;i2<ecdata[r].length;i2++){
      var modIndex=i2+modPoly.length-ecdata[r].length;
      ecdata[r][i2]=modIndex>=0?modPoly[modIndex]:0;
    }
  }
  var totalCodeCount=0;
  for(var b=0;b<rsBlocks.length;b++)totalCodeCount+=rsBlocks[b].totalCount;
  var data=new Array(totalCodeCount);
  var index=0;
  for(var i3=0;i3<maxDcCount;i3++)for(var r3=0;r3<rsBlocks.length;r3++)if(i3<dcdata[r3].length)data[index++]=dcdata[r3][i3];
  for(var i4=0;i4<maxEcCount;i4++)for(var r4=0;r4<rsBlocks.length;r4++)if(i4<ecdata[r4].length)data[index++]=ecdata[r4][i4];
  return data;
}
function qrCreateData(typeNumber,ecIdx,text){
  var rsBlocks=qrGetRSBlocks(typeNumber,ecIdx);
  var buffer=qrBufNew();
  var bytes=qrStringToBytes(text);
  qrBufPut(buffer,4,4);
  qrBufPut(buffer,bytes.length,qrLengthBits(typeNumber));
  for(var i=0;i<bytes.length;i++)qrBufPut(buffer,bytes[i],8);
  var totalDataCount=0;
  for(var b=0;b<rsBlocks.length;b++)totalDataCount+=rsBlocks[b].dataCount;
  if(buffer.length>totalDataCount*8)throw new Error('qr overflow');
  if(buffer.length+4<=totalDataCount*8)qrBufPut(buffer,0,4);
  while(buffer.length%8!==0)qrBufPutBit(buffer,false);
  while(true){
    if(buffer.length>=totalDataCount*8)break;
    qrBufPut(buffer,0xEC,8);
    if(buffer.length>=totalDataCount*8)break;
    qrBufPut(buffer,0x11,8);
  }
  return qrCreateBytes(buffer,rsBlocks);
}
var qrPatternPositionTable=[
  [],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],
];
function qrGetBCHDigit(data){var d=0;while(data!==0){d++;data>>>=1;}return d;}
var QR_G15=(1<<10)|(1<<8)|(1<<5)|(1<<4)|(1<<2)|(1<<1)|1;
var QR_G15_MASK=(1<<14)|(1<<12)|(1<<10)|(1<<4)|(1<<1);
var QR_G18=(1<<12)|(1<<11)|(1<<10)|(1<<9)|(1<<8)|(1<<5)|(1<<2)|1;
function qrGetBCHTypeInfo(data){
  var d=data<<10;
  while(qrGetBCHDigit(d)-qrGetBCHDigit(QR_G15)>=0)d^=(QR_G15<<(qrGetBCHDigit(d)-qrGetBCHDigit(QR_G15)));
  return((data<<10)|d)^QR_G15_MASK;
}
// Solo entra en juego desde versión 7 (nuestro uso real — número/MECARD/URL corta
// — nunca llega tan lejos, pero se implementa completo para no dejar un encoder
// que silenciosamente produzca un QR inválido si algún día se codifica más texto).
function qrGetBCHTypeNumber(data){
  var d=data<<12;
  while(qrGetBCHDigit(d)-qrGetBCHDigit(QR_G18)>=0)d^=(QR_G18<<(qrGetBCHDigit(d)-qrGetBCHDigit(QR_G18)));
  return(data<<12)|d;
}
function qrSetupTypeNumber(m,test){
  var bits=qrGetBCHTypeNumber(m.typeNumber);
  for(var i=0;i<18;i++){
    var mod=(!test&&((bits>>i)&1)===1);
    m.modules[Math.floor(i/3)][i%3+m.moduleCount-8-3]=mod;
  }
  for(var i2=0;i2<18;i2++){
    var mod2=(!test&&((bits>>i2)&1)===1);
    m.modules[i2%3+m.moduleCount-8-3][Math.floor(i2/3)]=mod2;
  }
}
function qrGetMask(pattern,i,j){
  switch(pattern){
    case 0:return(i+j)%2===0;
    case 1:return i%2===0;
    case 2:return j%3===0;
    case 3:return(i+j)%3===0;
    case 4:return(Math.floor(i/2)+Math.floor(j/3))%2===0;
    case 5:return(i*j)%2+(i*j)%3===0;
    case 6:return((i*j)%2+(i*j)%3)%2===0;
    case 7:return((i*j)%3+(i+j)%2)%2===0;
    default:return false;
  }
}
// Nota: solo versiones 1-10 (suficiente para "MECARD:N:...;TEL:9XXXXXXXX;;", ~40
// caracteres) — evita necesitar la tabla completa de posiciones de alineación
// (hasta versión 40) que el estándar define para QRs mucho más grandes.
function qrGetPatternPosition(typeNumber){return qrPatternPositionTable[typeNumber-1];}
function qrEcLevelIdxToBCH(ecIdx){return[1,0,3,2][ecIdx];}
function qrModelNew(typeNumber,ecIdx){return{typeNumber:typeNumber,ecIdx:ecIdx,modules:null,moduleCount:0,dataCache:null,text:''};}
function qrIsDark(m,row,col){return m.modules[row][col];}
function qrSetupPositionProbePattern(m,row,col){
  for(var r=-1;r<=7;r++){
    if(row+r<=-1||m.moduleCount<=row+r)continue;
    for(var c=-1;c<=7;c++){
      if(col+c<=-1||m.moduleCount<=col+c)continue;
      var dark=(r>=0&&r<=6&&(c===0||c===6))||(c>=0&&c<=6&&(r===0||r===6))||(r>=2&&r<=4&&c>=2&&c<=4);
      m.modules[row+r][col+c]=dark;
    }
  }
}
function qrSetupTimingPattern(m){
  for(var r=8;r<m.moduleCount-8;r++){if(m.modules[r][6]!=null)continue;m.modules[r][6]=(r%2===0);}
  for(var c=8;c<m.moduleCount-8;c++){if(m.modules[6][c]!=null)continue;m.modules[6][c]=(c%2===0);}
}
function qrSetupPositionAdjustPattern(m){
  var pos=qrGetPatternPosition(m.typeNumber);
  for(var i=0;i<pos.length;i++)for(var j=0;j<pos.length;j++){
    var row=pos[i],col=pos[j];
    if(m.modules[row][col]!=null)continue;
    for(var r=-2;r<=2;r++)for(var c=-2;c<=2;c++){
      var dark=(r===-2||r===2||c===-2||c===2||(r===0&&c===0));
      m.modules[row+r][col+c]=dark;
    }
  }
}
function qrSetupTypeInfo(m,test,maskPattern){
  var data=(qrEcLevelIdxToBCH(m.ecIdx)<<3)|maskPattern;
  var bits=qrGetBCHTypeInfo(data);
  for(var i=0;i<15;i++){
    var mod=(!test&&((bits>>i)&1)===1);
    if(i<6)m.modules[i][8]=mod;else if(i<8)m.modules[i+1][8]=mod;else m.modules[m.moduleCount-15+i][8]=mod;
  }
  for(var i2=0;i2<15;i2++){
    var mod2=(!test&&((bits>>i2)&1)===1);
    if(i2<8)m.modules[8][m.moduleCount-i2-1]=mod2;else if(i2<9)m.modules[8][15-i2-1+1]=mod2;else m.modules[8][15-i2-1]=mod2;
  }
  m.modules[m.moduleCount-8][8]=!test;
}
function qrMapData(m,data,maskPattern){
  var inc=-1,row=m.moduleCount-1,bitIndex=7,byteIndex=0;
  for(var col=m.moduleCount-1;col>0;col-=2){
    if(col===6)col--;
    while(true){
      for(var c=0;c<2;c++){
        if(m.modules[row][col-c]==null){
          var dark=false;
          if(byteIndex<data.length)dark=(((data[byteIndex]>>>bitIndex)&1)===1);
          if(qrGetMask(maskPattern,row,col-c))dark=!dark;
          m.modules[row][col-c]=dark;
          bitIndex--;
          if(bitIndex===-1){byteIndex++;bitIndex=7;}
        }
      }
      row+=inc;
      if(row<0||m.moduleCount<=row){row-=inc;inc=-inc;break;}
    }
  }
}
function qrGetLostPoint(m){
  var moduleCount=m.moduleCount,lostPoint=0;
  for(var row=0;row<moduleCount;row++)for(var col=0;col<moduleCount;col++){
    var sameCount=0,dark=qrIsDark(m,row,col);
    for(var r=-1;r<=1;r++){
      if(row+r<0||moduleCount<=row+r)continue;
      for(var c=-1;c<=1;c++){
        if(col+c<0||moduleCount<=col+c)continue;
        if(r===0&&c===0)continue;
        if(dark===qrIsDark(m,row+r,col+c))sameCount++;
      }
    }
    if(sameCount>5)lostPoint+=(3+sameCount-5);
  }
  for(var row2=0;row2<moduleCount-1;row2++)for(var col2=0;col2<moduleCount-1;col2++){
    var cnt=0;
    if(qrIsDark(m,row2,col2))cnt++;
    if(qrIsDark(m,row2+1,col2))cnt++;
    if(qrIsDark(m,row2,col2+1))cnt++;
    if(qrIsDark(m,row2+1,col2+1))cnt++;
    if(cnt===0||cnt===4)lostPoint+=3;
  }
  for(var row3=0;row3<moduleCount;row3++)for(var col3=0;col3<moduleCount-6;col3++){
    if(qrIsDark(m,row3,col3)&&!qrIsDark(m,row3,col3+1)&&qrIsDark(m,row3,col3+2)&&qrIsDark(m,row3,col3+3)&&qrIsDark(m,row3,col3+4)&&!qrIsDark(m,row3,col3+5)&&qrIsDark(m,row3,col3+6))lostPoint+=40;
  }
  for(var col4=0;col4<moduleCount;col4++)for(var row4=0;row4<moduleCount-6;row4++){
    if(qrIsDark(m,row4,col4)&&!qrIsDark(m,row4+1,col4)&&qrIsDark(m,row4+2,col4)&&qrIsDark(m,row4+3,col4)&&qrIsDark(m,row4+4,col4)&&!qrIsDark(m,row4+5,col4)&&qrIsDark(m,row4+6,col4))lostPoint+=40;
  }
  var darkCount=0;
  for(var col5=0;col5<moduleCount;col5++)for(var row5=0;row5<moduleCount;row5++)if(qrIsDark(m,row5,col5))darkCount++;
  var ratio=Math.abs(100*darkCount/moduleCount/moduleCount-50)/5;
  lostPoint+=ratio*10;
  return lostPoint;
}
function qrMakeImpl(m,test,maskPattern){
  m.moduleCount=m.typeNumber*4+17;
  m.modules=new Array(m.moduleCount);
  for(var row=0;row<m.moduleCount;row++){m.modules[row]=new Array(m.moduleCount);for(var c=0;c<m.moduleCount;c++)m.modules[row][c]=null;}
  qrSetupPositionProbePattern(m,0,0);
  qrSetupPositionProbePattern(m,m.moduleCount-7,0);
  qrSetupPositionProbePattern(m,0,m.moduleCount-7);
  qrSetupPositionAdjustPattern(m);
  qrSetupTimingPattern(m);
  qrSetupTypeInfo(m,test,maskPattern);
  if(m.typeNumber>=7)qrSetupTypeNumber(m,test);
  if(m.dataCache==null)m.dataCache=qrCreateData(m.typeNumber,m.ecIdx,m.text);
  qrMapData(m,m.dataCache,maskPattern);
}
function qrGetBestMaskPattern(m){
  var minLostPoint=0,pattern=0;
  for(var i=0;i<8;i++){
    qrMakeImpl(m,true,i);
    var lp=qrGetLostPoint(m);
    if(i===0||minLostPoint>lp){minLostPoint=lp;pattern=i;}
  }
  return pattern;
}
// Punto de entrada: intenta versiones 1..10 hasta que el texto quepa (nivel M).
// Si algún día se necesita codificar algo más largo que ~90 caracteres esto
// lanza — no hay fallback silencioso a un QR roto.
function qrMakeMatrix(text){
  for(var typeNumber=1;typeNumber<=10;typeNumber++){
    try{
      var m=qrModelNew(typeNumber,1);
      m.text=text;
      qrMakeImpl(m,false,qrGetBestMaskPattern(m));
      return{size:m.moduleCount,isDark:function(r,c){return qrIsDark(m,r,c);}};
    }catch(e){
      if(String((e&&e.message)||e).indexOf('overflow')<0)throw e;
    }
  }
  throw new Error('texto demasiado largo para el QR');
}
// SVG compacto: un solo <path> con todos los módulos oscuros (evita cientos de
// <rect> individuales) + quiet zone de 4 módulos (mínimo del estándar para que
// cualquier lector lo reconozca).
function qrSvgHTML(text,pxSize){
  var qr=qrMakeMatrix(text);
  var size=qr.size,quiet=4,total=size+quiet*2;
  var d='';
  for(var r=0;r<size;r++)for(var c=0;c<size;c++)if(qr.isDark(r,c))d+='M'+(c+quiet)+' '+(r+quiet)+'h1v1h-1z';
  return'<svg viewBox="0 0 '+total+' '+total+'" width="'+pxSize+'" height="'+pxSize+'" style="background:#fff;border-radius:8px" shape-rendering="crispEdges"><path d="'+d+'" fill="#0d0d0d"/></svg>';
}
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
  var cardFeeNote=willPayWithCard()&&!manualPayMethod
    ?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px">El total ya incluye '+SOLES_TXT+(deliveryFeeAmount()-(function(){var z=DELIVERY_PRICE_ZONES.find(function(x){return x.id===deliveryZone;});return z?z.fee:0;})()).toFixed(2)+' de comisión por pagar con tarjeta — con Yape/Plin no se cobra.</div>'
    :'';
  return'<div style="margin-top:16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">¿Cómo pagas? //</div><div style="display:flex;gap:8px">'
    +payMethodBtn('yape','Yape / Plin',true,'Recomendado')
    +(culqiConfigured?payMethodBtn('culqi','Tarjeta',true,'Automático'):'')
    +'</div>'
    // El widget de Culqi ya trae Yape integrado como pestaña (paymentMethods.yape=true,
    // ver openCulqi) — o sea que por el camino "Tarjeta" también se puede pagar con Yape
    // SIN subir comprobante ni esperar confirmación manual. Con la etiqueta anterior
    // nadie lo descubría, y quien no quería la fricción del comprobante simplemente
    // abandonaba en vez de cruzar al camino automático. Sí paga comisión (por eso
    // Yape/Plin manual sigue primero y marcado "Recomendado"), pero un pedido con
    // comisión vale infinitamente más que un pedido abandonado.
    +(culqiConfigured&&!manualPayMethod?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px">En "Tarjeta" también puedes pagar con Yape al instante, sin subir comprobante.</div>':'')
    // El camino de Yape/Plin ya tenía su línea de seguridad ("nunca te pediremos tu
    // clave") dentro de las instrucciones de transferencia; el de tarjeta no tenía
    // ninguna. Desconfianza al momento de entregar la tarjeta es una de las causas
    // principales de abandono en checkout, y acá el dato es verificable y real: el
    // formulario lo renderiza Culqi, la tarjeta nunca pasa por nuestro código.
    +(culqiConfigured&&!manualPayMethod?'<div style="font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px;display:flex;align-items:flex-start;gap:6px">'+icon('lock',12,'#A8C8B0')+'<span>Tu tarjeta la procesa Culqi — nosotros nunca la vemos ni la guardamos.</span></div>':'')
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
  // Ninguno aparece pre-seleccionado hasta que el cliente toca uno — antes Tarjeta se
  // veía marcada por defecto sin ninguna elección real, lo que reforzaba la sensación de
  // que el recargo ya estaba decidido de antemano (mismo hallazgo P2 de arriba).
  var sel=id==='culqi'?(payMethodChosen&&!manualPayMethod):manualPayMethod===id;
  return'<div onclick="'+(enabled?'selectPayMethod(\''+id+'\')':'')+'" style="flex:1;text-align:center;background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:8px;padding:10px 6px;cursor:'+(enabled?'pointer':'not-allowed')+';opacity:'+(enabled?1:.4)+'">'
    +(badge?'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:7px;color:'+GOLD+';letter-spacing:.08em;margin-bottom:3px">'+badge+'</div>':'')
    +'<div style="display:flex;align-items:center;justify-content:center;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:#fff">'+label+'</div>'
    +(enabled?'':'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:7px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px;letter-spacing:.05em">Pronto</div>')+'</div>';
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
  return'<div style="display:flex;gap:10px;margin-top:'+(n===1?'0':'10px')+'"><div style="flex:0 0 auto;width:20px;height:20px;border-radius:50%;background:'+GOLD+';color:#0d0d0d;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:640;display:flex;align-items:center;justify-content:center">'+n+'</div><div style="flex:1;min-width:0"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.1em;margin-bottom:4px">'+label+'</div>'+body+'</div></div>';
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
  return'<div style="margin-top:10px;background:var(--sw-card2,#1A3028);border:1px solid '+GOLD+';border-radius:10px;padding:14px 16px">'
    +'<div style="text-align:center;margin-bottom:14px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.2em;margin-bottom:2px">Monto a transferir //</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:38px;font-weight:640;color:'+GOLD+'">'+SOLES+pz(t)+'</div></div>'
    +payStep(1,'Transfiere por Yape o Plin a','<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border-radius:8px;padding:8px 10px"><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:640;color:#fff">'+YAPE_PLIN_PHONE+'</div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:8px;color:var(--sw-text-muted,#A8C8B0)">'+esc(YAPE_PLIN_NAME)+(recurring?' · ya usaste este número antes ✓':'')+'</div></div></div>'
      // Un solo botón principal por plataforma: en el celular abre Yape directo (y de
      // paso copia el número); en desktop no hay app que abrir, así que el único botón
      // útil es copiar.
      +'<button onclick="'+(mobile?'copyYapePlinPhone();openYapeApp()':'copyYapePlinPhone()')+'" style="all:unset;cursor:pointer;display:block;width:100%;text-align:center;margin-top:8px;background:'+GOLD+';color:#0d0d0d;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:11px;border-radius:8px">'+(mobile?iconTxt('phone','Abrir Yape','#0d0d0d'):'Copiar número')+'</button>'
      +'<div style="text-align:center;margin-top:8px"><span onclick="toggleYapeQR()" style="cursor:pointer;font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);text-decoration:underline;letter-spacing:.05em">'+(showYapeQR?'ocultar código QR':'o escanea el código QR con tu número guardado')+'</span></div>'
      +(showYapeQR?'<div style="display:flex;flex-direction:column;align-items:center;margin-top:10px"><div style="padding:8px;background:#fff;border-radius:10px">'+qrSvgHTML('MECARD:N:'+YAPE_PLIN_NAME+';TEL:'+YAPE_PLIN_PHONE+';;',148)+'</div><div style="font-family:\'EB Garamond\',serif;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px;text-align:center;max-width:220px">Guarda nuestro número en tus contactos escaneando — no reemplaza la transferencia, solo evita escribirlo a mano.</div></div>':'')
      +'<div id="ypc-msg" style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#25D366;margin-top:6px;min-height:12px"></div>')
    +payStep(2,'Confirma aquí abajo','<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);line-height:1.4">Toca "Ya realicé el pago". Tu pedido pasa a cocina recién cuando lo verifiquemos.</div>')
    +'<div style="font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:12px;opacity:.85;display:flex;align-items:center;gap:5px">'+icon('lock',12,'#A8C8B0')+'<span>Nunca te pediremos tu clave, tu PIN ni un código que te llegue por SMS.</span></div>'
    +'</div>';
}
function copyYapePlinPhone(){
  var m=(document.getElementById('ypc-msg') as HTMLInputElement | null);
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(YAPE_PLIN_PHONE).then(function(){if(m)m.textContent='✓ Número copiado';}).catch(function(){if(m)m.textContent=YAPE_PLIN_PHONE;});
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
function sOCart(){
  var baseTotal=cartBaseTotal();
  var t=payableTotal();
  var empty=!cart.length;
  var comboDiscount=cartComboDiscount();
  var offPeakDiscount=cartOffPeakDrinkDiscount();
  // Ya no se suman (ver cartStackedDiscount) — se muestra solo el que de verdad se
  // aplicó, nunca los dos a la vez.
  var showCombo=comboDiscount>0&&comboDiscount>=offPeakDiscount;
  var showOffPeak=offPeakDiscount>0&&offPeakDiscount>comboDiscount;
  var rewardIdx=appliedReward?findRewardTargetIndex(appliedReward):-1;
  var rewardDiscount=appliedReward?rewardWaiverAmount(appliedReward,rewardIdx):0;
  var orgDiscount=organizerFreeAmount();
  return H('TU CARRITO',"syncConfirmFields();sndScreen='o_home';render()")+'<div style="flex:1;padding:20px 20px 160px;overflow-y:auto" class="fi">'
    +cartItemsHTML()
    +(cart.length?'<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:12px"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text-body,#F2F0EB)">Total</span><div style="text-align:right"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:28px;font-weight:640;color:'+GOLD+'">'+SOLES+pz(t)+'</span>'+(showCombo?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#25D366">combo aplicado: ahorras '+SOLES+pz(comboDiscount)+'</div>':'')+(showOffPeak?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#25D366">bebida gratis (hora valle): ahorras '+SOLES+pz(offPeakDiscount)+'</div>':'')+(orgDiscount>0?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#25D366">sándwich del organizador: ahorras '+SOLES+pz(orgDiscount)+'</div>':'')+(rewardDiscount>0?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#25D366">recompensa: ahorras '+SOLES+pz(rewardDiscount)+'</div>':'')+'</div></div>':'')
    // Antes estos 2 botones eran los únicos puntos de navegación de este carrito que NO
    // llamaban syncConfirmFields() primero — el camino de "una cosa más" más común
    // (agregar un side/otro sándwich) borraba nombre/correo/dirección ya tipeados.
    +'<div style="display:flex;gap:8px;margin-bottom:20px"><div onclick="syncConfirmFields();go(\'o_home\')" style="flex:1;text-align:center;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:12px;cursor:pointer;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#FFFFFF)">+ Sándwich</div><div onclick="syncConfirmFields();sndScreen=\'o_sides\';render()" style="flex:1;text-align:center;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:12px;cursor:pointer;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#FFFFFF)">+ Bebida/side</div></div>'
    +(empty?'':checkoutExtrasHTML())
    +(cart.length?'<div onclick="clearCart()" style="text-align:center;margin-top:16px;cursor:pointer;font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:#ff8888;letter-spacing:.1em">Vaciar carrito</div>':'')
    +'</div>'
    +AB(cart.length?t:null,cart.length>0&&!checkoutLocked,null,'doOrder()',payButtonLabel(t,'Pagar y enviar //'));
}

var _pendingOrder=null;
async function doOrder(){
  if(_payingInProgress)return;
  if(!cart.length)return;
  if(appliedReward&&findRewardTargetIndex(appliedReward)<0)appliedReward=null;
  var nom=gv('o-nom').trim();
  var phone=gv('o-phone').trim();
  var email=gv('o-email').trim();
  var addr=gv('o-addr').trim();
  var notes=gv('o-notes').trim();
  var errEl=(document.getElementById('o-err') as HTMLInputElement | null);
  if(!nom||!addr){if(errEl)errEl.textContent='Ingresa tu nombre y dirección.';return;}
  // El distrito es obligatorio: es lo que decide si el pedido se puede entregar (los que
  // están fuera de cobertura ni siquiera son seleccionables, ver districtPickerHTML). Se
  // adjunta al texto de la dirección antes de validar y de mandarlo, así el motorizado lo
  // ve impreso y el chequeo por substring de abajo lo cubre igual que si el cliente lo
  // hubiera escrito a mano.
  if(!deliveryDistrict){if(errEl)errEl.textContent='Elige tu distrito para poder llevarte el pedido.';return;}
  addr=addressWithDistrict(addr,deliveryDistrict);
  // Solo se avisa recién al intentar pagar, no mientras el cliente todavía está
  // escribiendo la dirección — un aviso en vivo mientras tipea se siente como un
  // rechazo prematuro antes de que termine de escribir. El servidor vuelve a validar
  // esto mismo (assertAddressAllowed en orders.ts) por si alguien se salta el cliente.
  if(addressInExcludedZone(addr)){if(errEl)errEl.textContent='Por ahora tu zona aún no está disponible para delivery, pero esperamos poder llegar pronto.';return;}
  // Antes no había ningún teléfono en el checkout de invitado — la única forma de
  // contactarlo era el mensaje de WhatsApp que él mismo debía enviar tras pagar, y si
  // ese paso fallaba (bloqueo de pop-up, cerró la pestaña) un pedido ya cobrado quedaba
  // sin ninguna manera de ubicar al cliente.
  if(!phone||phone.replace(/\D/g,'').length<6){if(errEl)errEl.textContent='Ingresa un teléfono de contacto válido.';return;}
  var schedIso=null;
  if(scheduleMode==='later'){
    var schedEl=(document.getElementById('o-sched') as HTMLInputElement | null);
    var schedVal=schedEl?schedEl.value:'';
    if(!schedVal){if(errEl)errEl.textContent='Elige una hora para tu pedido programado.';return;}
    var schedDate=new Date(schedVal);
    if(isNaN(schedDate.getTime())||schedDate.getTime()<Date.now()-60000){if(errEl)errEl.textContent='La hora programada no es válida.';return;}
    if(!isWithinStoreHours(schedDate)){if(errEl)errEl.textContent='Esa hora está fuera de nuestro horario de atención.';return;}
    schedIso=schedDate.toISOString();
  }else if(!storeStatus().open){
    // Antes solo se validaba el horario para pedidos programados — uno "AHORA" con la
    // tienda cerrada se podía pagar igual, y la cocina nunca lo iba a preparar.
    if(errEl)errEl.textContent='Estamos cerrados ahora mismo. Elige "PROGRAMAR" para pedir dentro de nuestro horario.';
    return;
  }
  // El negocio abre el 7 de septiembre. Hasta entonces NO se acepta ningún pedido, ni
  // inmediato ni programado: el badge del home ya lo dice, pero el catálogo y Culqi
  // seguían operativos y se podía pagar de verdad por comida que nadie iba a preparar.
  // El servidor también lo rechaza (assertBusinessLaunched en orders.ts) — esto solo
  // evita que el cliente descubra el bloqueo recién después de meter su tarjeta.
  if(!businessLaunched){
    if(errEl)errEl.textContent='Todavía no abrimos. Déjanos tu teléfono en la pantalla de inicio y te avisamos apenas arranquemos.';
    return;
  }
  if(errEl)errEl.textContent='';
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
  lines.push('','🛵 Delivery ('+(DELIVERY_PRICE_ZONES.find(function(z){return z.id===deliveryZone;})||{}).l+'): S/'+deliveryFeeAmount());
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
    if(!(await showConfirm('¿Ya transferiste '+SOLES_TXT+pz(t)+' por Yape o Plin a '+YAPE_PLIN_PHONE+'? Tu pedido pasa a cocina recién cuando confirmemos que llegó.'))){
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
async function prepareThenPayWithCulqi(amountSoles,email){
  var po=_pendingOrder;
  if(!po)return;
  busy=true;busyMsg='Verificando tu pedido...';render();
  try{
    await api('prepare-order',{token:token,ref:po.ref,name:po.nom,phone:po.phone,email:po.email,address:po.addr,notes:po.notes,summary:po.summary,total:po.total,items:po.items,scheduledFor:po.scheduledFor,rewardId:po.rewardId,deliveryZone:po.deliveryZone,promoCode:po.promoCode,...metaAttribution()});
  }catch(e){
    busy=false;_payingInProgress=false;render();
    var errEl=(document.getElementById('o-err') as HTMLInputElement | null);
    if(errEl)errEl.textContent=e.message;else showToast(e.message);
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
  if(typeof Culqi==='undefined'){busy=false;_payingInProgress=false;render();showToast('No se pudo cargar la pasarela de pago. Verifica tu conexión e intenta de nuevo.');return;}
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
  if(_pendingWeeklyPlan){
    if(Culqi.token){
      chargeAndFinalizeWeeklyPlan(Culqi.token.id);
    }else{
      // _weeklyPlanBuyInProgress también se resetea acá (antes solo en la rama gemela de
      // pedido normal, línea de abajo) — sin esto, un rechazo de Culqi dejaba el guard de
      // doble-tap en true para siempre: doWeeklyPlanBuy() empieza con
      // if(_weeklyPlanBuyInProgress)return; sin ningún aviso, así que cualquier reintento
      // era un no-op silencioso hasta recargar la página (hallazgo de auditoría UX,
      // CRÍTICO).
      busy=false;_weeklyPlanBuyInProgress=false;
      wpMsg=(Culqi.error&&(Culqi.error.user_message||Culqi.error.merchant_message))||'No se pudo procesar el pago. Intenta de nuevo o con otro método.';
      _pendingWeeklyPlan=null;render();
    }
    return;
  }
  if(!_pendingOrder)return;
  if(Culqi.token){
    chargeAndFinalize(Culqi.token.id);
  }else{
    busy=false;_payingInProgress=false;render();
    var msg=(Culqi.error&&(Culqi.error.user_message||Culqi.error.merchant_message))||'No se pudo procesar el pago. Intenta de nuevo o con otro método.';
    var errEl=(document.getElementById('o-err') as HTMLInputElement | null);
    if(errEl)errEl.textContent=msg;else showToast(msg);
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
      busy=false;_payingInProgress=false;render();
      var errEl=(document.getElementById('o-err') as HTMLInputElement | null);
      var msg=data.error||'El pago fue rechazado. Intenta de nuevo o con otro método.';
      if(errEl)errEl.textContent=msg;else showToast(msg);
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
      lockedMsg=(e.message||'No se pudo registrar tu pedido tras el pago.')+' Ya se realizó el cobro — contáctanos con tu referencia '+po.ref+' para confirmar tu pedido manualmente. No vuelvas a intentar pagar.';
      render();
      return;
    }
    finalizeOrderSuccess(res,po,data.chargeId);
  }catch(e){
    busy=false;_payingInProgress=false;render();
    var errEl2=(document.getElementById('o-err') as HTMLInputElement | null);
    if(errEl2)errEl2.textContent='Error de conexión al procesar el pago. Intenta de nuevo.';
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
  window._lRef=po.ref;
  receiptUploadState=null;
  cart=[];
  pendingGroupCode=null;
  resetBuilder();mode=null;
  useCredit=false;manualPayMethod=null;payMethodChosen=false;scheduleMode='now';schedDay='today';schedSlot=null;pickedAddrId=null;addrText='';
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
function sOSent(){
  var pending=window._lPendingPayment;
  var methodLabel=window._lPayMethod==='yape'?'Yape':window._lPayMethod==='plin'?'Plin':'';
  // Plazo real (no inventado) para que confirmemos el pago manual — coincide con el cron
  // que cancela solo un Yape/Plin sin confirmar tras STALE_MANUAL_PAYMENT_HOURS_CLIENT.
  var manualWaiting=pending&&!!methodLabel;
  var deadlineLabel=manualWaiting&&window._lOrderCreatedAt
    ?new Date(window._lOrderCreatedAt+STALE_MANUAL_PAYMENT_HOURS_CLIENT*3600000).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})
    :null;
  // Antes esta pantalla nunca mostraba la referencia del pedido (útil para ubicarlo en
  // MIS PEDIDOS o mencionarlo si hay que escribir a soporte) y usaba la misma tarjeta
  // genérica que cualquier pantalla informativa — sin ningún tratamiento propio para el
  // momento de mayor satisfacción del flujo (hallazgo de auditoría UX/diseño).
  var rankUp=window._lRankUp;
  // El aviso del menú secreto ya no cuelga del nombre del rango (ver _lSecretUnlock): el
  // umbral se edita desde el panel y no tiene por qué caer sobre un rango.
  var rankPerk=window._lSecretUnlock?'Ya puedes ver el menú secreto.':null;
  return'<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;background:var(--sw-bg,#1E3932)" class="fi">'
    +'<div style="margin-bottom:12px;padding:14px;border-radius:50%;box-shadow:'+SHADOW_GOLD+'">'+WORDMARK(52,true)+'</div>'
    // Un pedido 100% cubierto por una recompensa (total S/0) nunca tuvo ningún pago real
    // que "confirmar" — decía "PAGO CONFIRMADO" igual (hallazgo de auditoría UX, BAJO).
    +(pending?'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:'+GOLD+';letter-spacing:.25em;margin-bottom:6px">✓ Pedido registrado //</div>':(window._lTot===0?'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:#25D366;letter-spacing:.25em;margin-bottom:6px">✓ Pedido confirmado //</div>':'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:#25D366;letter-spacing:.25em;margin-bottom:6px">✓ Pago confirmado //</div>'))
    +(window._lRef?'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em;margin-bottom:20px">Pedido '+esc(window._lRef)+'</div>':'<div style="margin-bottom:20px"></div>')
    +(rankUp?'<div class="rank-pop" style="background:linear-gradient(135deg,rgba(203,162,88,.22),rgba(203,162,88,.06));border:1px solid '+GOLD+';border-radius:14px;padding:16px 20px;margin-bottom:20px;width:100%;max-width:320px;box-shadow:'+SHADOW_GOLD+'"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:6px">¡Subiste de rango! //</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:24px;font-weight:640;color:var(--sw-text,#FFFFFF)">'+esc(rankUp)+'</div>'+(rankPerk?'<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px">'+rankPerk+'</div>':'')+'</div>':'')
    // Desbloqueo del menú secreto SIN subida de rango. Hasta el 2026-08-26 este aviso vivía
    // solo dentro de la tarjeta de rango, lo cual funcionaba de casualidad porque el umbral
    // del secreto (5) caía justo sobre INICIADO. Al bajarlo a 3 dejaron de coincidir: quien
    // pasa de 2 a 3 pedidos desbloquea el menú secreto y no cambia de rango, así que se
    // habría enterado por ningún lado. Esta tarjeta cubre ese caso.
    +((rankPerk&&!rankUp)?'<div class="rank-pop" style="background:linear-gradient(135deg,rgba(203,162,88,.22),rgba(203,162,88,.06));border:1px solid '+GOLD+';border-radius:14px;padding:16px 20px;margin-bottom:20px;width:100%;max-width:320px;box-shadow:'+SHADOW_GOLD+'"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:6px">¡Desbloqueaste algo! //</div><div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">'+rankPerk+'</div></div>':'')
    +'<p style="font-family:\'EB Garamond\',serif;font-size:14px;color:var(--sw-text-muted,#A8C8B0);max-width:260px;line-height:1.6;margin-bottom:16px">'+(pending?'Verificaremos tu pago por '+methodLabel+' y tu pedido pasará a preparación en cuanto lo confirmemos.':'Tu pago fue procesado y tu pedido ya está en preparación.')+'</p>'
    +'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:12px;padding:16px 20px;margin-bottom:16px;width:100%;max-width:320px">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">Estado del pedido //</div>'
    +stBadge('RECIBIDO')
    +(manualWaiting?'<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px"><span class="pulse" style="width:7px;height:7px;border-radius:50%;background:'+GOLD+';display:inline-block"></span><span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.1em">Esperando confirmación de pago</span></div>':'')
    +(deadlineLabel?'<div style="font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px">Confirmamos manualmente — si no lo hacemos antes de las '+deadlineLabel+', el pedido se cancela solo.</div>':'')
    +(manualWaiting?'<div style="margin-top:10px">'
      +(receiptUploadState==='done'
        ?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#25D366">✓ comprobante recibido — gracias</div>'
        :'<label style="display:inline-flex;align-items:center;gap:6px;cursor:'+(receiptUploadState==='uploading'?'default':'pointer')+';font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';text-decoration:underline;letter-spacing:.05em">'
          +(receiptUploadState==='uploading'?'subiendo comprobante...':icon('clip',12)+'<span>subir captura del comprobante (opcional)</span>')
          +'<input type="file" accept="image/*" onchange="handleReceiptFile(event)"'+(receiptUploadState==='uploading'?' disabled':'')+' style="position:absolute;width:1px;height:1px;opacity:0"></label>')
      +(typeof receiptUploadState==='string'&&receiptUploadState.indexOf('error:')===0?'<div style="font-family:\'EB Garamond\',serif;font-size:10px;color:#ff8888;margin-top:4px">'+esc(receiptUploadState.slice(6))+'</div>':'')
      +'</div>':'')
    +'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:10px;line-height:1.5">Sigue el estado en Puntos → Mis Pedidos</div></div>'
    +'<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(37,211,102,.25);border-radius:12px;padding:14px 20px;margin-bottom:16px;width:100%;max-width:320px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:#25D366;letter-spacing:.2em;margin-bottom:4px">'+(pending?'Monto a pagar //':(window._lTot===0?'Cubierto por recompensa //':'Monto cobrado //'))+'</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:32px;font-weight:640;color:var(--sw-text,#FFFFFF)">'+SOLES+pz(window._lTot||0)+'</div>'+(window._lChargeId?'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">Ref. pago: '+window._lChargeId+'</div>':'')+'</div>'
    +(cust?'<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.15);border-radius:12px;padding:14px 20px;margin-bottom:24px;width:100%;max-width:320px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:4px">'+(pending?'Puntos //':'Puntos ganados //')+'</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:'+(pending?'12px':'32px')+';font-weight:640;color:'+GOLD+'">'+(pending?'+'+(window._lPoints||0)+' pts pendientes hasta confirmar tu pago':'+'+(window._lPoints||0)+'<span style="font-size:14px"> pts</span>')+'</div></div>':'')
    +(window._lRewardLabel?'<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(37,211,102,.3);border-radius:12px;padding:14px 20px;margin-bottom:24px;width:100%;max-width:320px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:#25D366;letter-spacing:.2em;margin-bottom:4px;display:flex;align-items:center;gap:6px">'+icon('gift',12,'#25D366')+'Recompensa aplicada //</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text,#FFFFFF)">'+esc(window._lRewardLabel)+'</div></div>':'')
    // Respaldo tappable del window.open automático de arriba — muchos navegadores
    // móviles lo bloquean por no venir de un tap directo del usuario, y sin esto un
    // pedido ya cobrado podía quedar sin ningún comprobante ni aviso al negocio.
    +(window._lWaText?'<button onclick="reopenWhatsAppConfirm()" style="all:unset;cursor:pointer;display:block;width:100%;max-width:320px;text-align:center;background:'+GOLD+';color:#0d0d0d;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.08em;padding:13px;border-radius:10px;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:8px">'+icon('chat',16,'#0d0d0d')+'Confirmar pedido por WhatsApp →</button>':'')
    // Antes el único lugar para activar notificaciones push era un toggle escondido en
    // el perfil (o una fila discreta en el checkout) — justo después del primer pedido
    // pagado es el momento de mayor intención: el cliente ya vio el valor de la app y
    // quiere saber cuándo llega SU pedido, así que se ofrece aquí de forma prominente.
    +(cust&&cust.total_orders===1&&!pushSubscribed&&('serviceWorker' in navigator)&&('PushManager' in window)?'<div onclick="togglePushNotifications()" style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.3);border-radius:12px;padding:14px 20px;margin-bottom:24px;width:100%;max-width:320px;cursor:pointer"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:4px;display:flex;align-items:center;gap:6px">'+icon('notif',12,GOLD)+'No te pierdas tu pedido //</div><div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5">Activa notificaciones y te avisamos apenas esté en camino.</div>'+(pushMsg?'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:'+GOLD+';margin-top:6px">'+esc(pushMsg)+'</div>':'')+'</div>':'')
    +(cust?'<div onclick="shareReferral()" style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:14px 20px;margin-bottom:24px;width:100%;max-width:320px;cursor:pointer"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:4px;display:flex;align-items:center;gap:6px">'+icon('heart',12,GOLD)+'Invita a un amigo //</div><div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5">Comparte tu código <b style="color:var(--sw-text,#FFFFFF)">'+esc(cust.phone)+'</b> — cuando haga su primer pedido, tú te ganas un SÁNDWICH 15CM GRATIS y él estrena con una BEBIDA GRATIS.</div></div>':'')
    +'<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">'
    +'<button onclick="sndScreen=\'o_home\';render()" style="all:unset;cursor:pointer;border:1px solid '+GOLD+';color:'+GOLD+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.15em;padding:12px 22px;border-radius:10px">Nuevo pedido</button>'
    +(cust?'<button onclick="sndScreen=\'p_orders\';loadMyOrders()" style="all:unset;cursor:pointer;background:'+GOLD+';color:#0d0d0d;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.15em;padding:12px 22px;border-radius:10px">Ver estado →</button>':'')
    +'</div>'
    +(!cust?'<div onclick="atab=\'reg\';sndScreen=\'p_auth\';render()" style="margin-top:20px;cursor:pointer;font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:'+GOLD+';letter-spacing:.1em">→ Crea tu cuenta y gana puntos por este pedido</div>':'')
    // Si algo sale mal con este pedido, es acá donde el cliente lo va a buscar.
    +legalLinksHTML('o_sent')
    +'</div>';
}

// AUTH
// Antes el bono de bienvenida se otorgaba en silencio (server-side, sin que este
// formulario lo mencionara nunca) — un incentivo que no se comunica no convierte
// (hallazgo de auditoría, BAJO). DEBE coincidir con WELCOME_BONUS_POINTS en
// supabase/functions/api/env.ts.
function sPAuth(){
  return H()+'<div style="flex:1;padding:24px 20px 140px;overflow-y:auto" class="fi"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:23px;font-weight:640;color:#fff;margin-bottom:6px;text-wrap:balance">Puntos<span class="cut-sep" style="color:'+GOLD+'"> // </span>rewards</div><p style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:24px;line-height:1.6">Acumula puntos con cada pedido. Canjéalos por salsas, upgrades y sándwiches gratis. Bono de bienvenida: +40 pts al crear tu cuenta.</p><div style="display:flex;background:var(--sw-card,#2D5246);border-radius:10px;padding:4px;margin-bottom:24px">'+[['reg','Crear cuenta'],['login','Ingresar']].map(function(x){return'<button onclick="clearGoogleLink();atab=\''+x[0]+'\';aErr=\'\';render()" style="all:unset;cursor:pointer;flex:1;background:'+(atab===x[0]?GOLD:'transparent')+';color:'+(atab===x[0]?'#241a08':'var(--sw-text-muted,#A8C8B0)')+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.1em;padding:11px 0;border-radius:8px;text-align:center;transition:all .15s">'+x[1]+'</button>';}).join('')+'</div>'+(googleConfigured()?'<div id="google-btn-mount" style="display:flex;justify-content:center;margin-bottom:14px;min-height:44px"></div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px"><div style="flex:1;height:1px;background:var(--sw-card,#2D5246)"></div><span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:#5A7A6A;letter-spacing:.15em">O con tu teléfono</span><div style="flex:1;height:1px;background:var(--sw-card,#2D5246)"></div></div>':'')+(atab==='reg'?'<div style="display:flex;flex-direction:column;gap:10px">'+(_googleIdToken?'<div style="background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.3);border-radius:10px;padding:12px 14px;margin-bottom:4px;display:flex;flex-direction:column;gap:6px"><div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.4">✓ Verificamos <b>'+esc(_googleLinkedEmail||'')+'</b> con Google. Completa tu registro para vincularla — si no eres tú, descarta este vínculo abajo.</div><div onclick="discardGoogleLink()" style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);cursor:pointer;text-decoration:underline;align-self:flex-start">No soy yo — continuar sin Google</div></div>':'')+INP('r-name','Nombre // Tu nombre completo','text',window._lastGuestName||'','clientes')+INP('r-phone','Teléfono // 9XXXXXXXX','tel',window._lastGuestPhone||'','phone')+INP('r-pin','PIN personal // Mínimo 4 dígitos','password',undefined,'lock')+INP('r-email','Correo // Para recuperar tu cuenta','email',window._lastGuestEmail||'','mail')+INP('r-dni','DNI // 8 dígitos (obligatorio)','text',undefined,'card')+INP('r-bday','Fecha de nacimiento // DD/MM/AAAA (obligatorio)','text',undefined,'calendar')+INP('r-ref','Código de referido // opcional','text',refCode)+'<div id="auth-err" style="font-family:\'EB Garamond\',serif;font-size:12px;color:#ff5555;min-height:16px">'+aErr+'</div>'+'<p style="font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5;margin-bottom:4px">Al crear tu cuenta aceptas nuestros <span onclick="event.stopPropagation();sndScreen=\'p_legal\';render()" style="color:'+GOLD+';cursor:pointer;text-decoration:underline">Términos y Política de Privacidad</span>.</p>'+BTN('Crear cuenta //','doReg()')+'</div>':'<div style="display:flex;flex-direction:column;gap:10px">'+INP('l-phone','Teléfono // 9XXXXXXXX','tel',savedPh,'phone')+INP('l-pin','PIN personal','password',undefined,'lock')+'<div id="auth-err" style="font-family:\'EB Garamond\',serif;font-size:12px;color:#ff5555;min-height:16px">'+aErr+'</div>'+BTN('Ingresar //','doLogin()')+' '+`<div onclick="recNewPin=null;recEmailMasked=null;recPhone='';recDni='';recBday='';sndScreen='p_recover';render()" style="text-align:center;margin-top:10px;font-family:EB Garamond,serif;font-weight:600;font-size:11px;color:'+GOLD+';cursor:pointer;letter-spacing:.1em">¿Olvidaste tu PIN? // Recuperar →</div>`+'</div>')+'<div style="margin-top:28px;border-top:1px solid var(--sw-border-soft,#1c1c1c);padding-top:20px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">Recompensas //</div>'+RWDS.map(function(r){return'<div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text-muted,#A8C8B0)">'+r.n+'<span style="color:var(--sw-text-muted,#A8C8B0)"> // </span>'+r.s+'</span><span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">'+r.pts+' pts</span></div>';}).join('')+'</div></div>'+NAV();
}
async function doReg(){
  var name=gv('r-name').trim(),
      phone=gv('r-phone').trim(),
      pin=gv('r-pin').trim(),
      email=gv('r-email').trim(),
      dni=gv('r-dni').trim(),
      bdayRaw=gv('r-bday').trim(),
      refEl=(document.getElementById('r-ref') as HTMLInputElement | null),
      referredBy=refEl?refEl.value.trim():'';
  var err=(document.getElementById('auth-err') as HTMLInputElement | null);
  if(!name||!phone||pin.length<4){if(err)err.textContent='Completa nombre, teléfono y PIN (mínimo 4 dígitos).';return;}
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
    var r=await api('register',{name:name,phone:phone,pin:pin,email:email||null,dni:dni,bday:bday,referredBy:referredBy||null,claimOrderRef:claimRef,acquisitionSource:acqSrc,googleIdToken:_googleIdToken||null});
    cust=r.customer;isAdmin=r.isAdmin;token=r.token;cacheCust(cust,isAdmin);
  }
  catch(e){aErr=e.message;busy=false;render();return;}
  clearGoogleLink();
  fbTrack('CompleteRegistration',{content_name:referredBy?'referido':'directo'});
  localStorage.setItem('sw_ph',phone);localStorage.setItem('sw_tok',token);savedPh=phone;busy=false;sndScreen='p_welcome';render();loadUserExtras();
  // La bienvenida dura 6.5s y recién ahí se va a p_home — si venía por el QR de la
  // tarjeta (?grupo=1), el grupo se crea al terminar esa pantalla, no antes, para no
  // pisarla a mitad de camino.
  setTimeout(function(){if(!resumeWantedGroup()){sndScreen='p_home';render();}},6500);
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
      window._lastGuestName=(r.prefill&&r.prefill.name)||'';
      window._lastGuestEmail=(r.prefill&&r.prefill.email)||'';
      atab='reg';aErr='';busy=false;render();
      // Antes decía solo "DNI y teléfono" — el formulario también exige un PIN nuevo
      // (mínimo 4 dígitos) para poder crear la cuenta, y quien viene de Google se
      // enteraba de eso recién al tocar CREAR CUENTA (hallazgo de auditoría UX).
      showToast('Ya verificamos tu cuenta de Google — completa DNI, teléfono y crea un PIN para terminar tu registro.');
      return;
    }
    cust=r.customer;isAdmin=r.isAdmin;token=r.token;cacheCust(cust,isAdmin);
    localStorage.setItem('sw_ph',cust.phone);localStorage.setItem('sw_tok',token);savedPh=cust.phone;
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
function mountGoogleButton(){
  if(!googleConfigured())return;
  if(typeof google==='undefined'||!google.accounts||!google.accounts.id)return;
  var el=document.getElementById('google-btn-mount');
  if(!el)return;
  google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:onGoogleCredential});
  google.accounts.id.renderButton(el,{theme:'filled_black',size:'large',shape:'pill',width:280,text:'continue_with',locale:'es'});
}
