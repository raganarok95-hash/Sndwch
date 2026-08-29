// ORDER BUILD
// Antes las 5 categorías (pan, proteína, toppings, queso, salsas — 13 salsas en total)
// vivían en un solo scroll continuo de ~3 pantallas de largo, todas con la misma
// tarjeta idéntica sin ninguna jerarquía visual entre categorías — el "muro de texto"
// que más distancia a esta pantalla de una experiencia de armado premium (ver Subway:
// un paso a la vez, con progreso claro). Convertido a un asistente de 5 pasos —
// mismos datos/validaciones de siempre (base/prot/tops/cheese/sauces), solo cambia
// cómo se presentan. BYO_STEP_LABELS/byoStep* viven junto al resto del estado del
// builder (ver resetBuilder/loadBuild).
var BYO_STEP_LABELS=['PAN','PROTEÍNA','TOPPINGS','QUESO','SALSAS'];
function byoStepCanContinue(){
  if(byoStep===0)return!!(size&&base);
  if(byoStep===1)return!!prot;
  return true;
}
function byoStepHint(){
  if(byoStep===0)return!size&&!base?'Elige tamaño y pan':!size?'Elige un tamaño':'Elige un pan';
  if(byoStep===1)return'Elige una proteína';
  return'';
}
function byoStepBack(){
  if(byoStep>0){byoStep--;render();}else go('o_home');
}
function byoStepNext(){
  if(!byoStepCanContinue())return;
  if(byoStep<4){byoStep++;render();}else enterConfirm();
}
function sOBuild(){
  var tL=tops.length,sL=sauces.length;
  // 3 estados en vez de 2 (antes solo dorado/gris): el paso ACTUAL lleva un resplandor
  // propio para que el ojo lo encuentre de inmediato en vez de tener que leer "PASO X//5".
  var progressBar='<div style="display:flex;gap:4px;margin-bottom:10px">'+BYO_STEP_LABELS.map(function(_,i){
    var st=i<byoStep?'done':i===byoStep?'current':'todo';
    // El glow del paso "current" (box-shadow con blur) violaba la No-Glow Rule de
    // DESIGN.md — ninguna señal de estado en la app usa resplandor, siempre opacidad/borde
    // (auditoría UX, P3). El paso actual ya se distingue por opacidad plena vs. .55 de los
    // completados y el color dorado vs. verde de los pendientes, sin necesitar el glow.
    return'<div style="flex:1;height:5px;border-radius:4px;background:'+(st==='todo'?'#2D5246':GOLD)+';opacity:'+(st==='todo'?1:st==='done'?.55:1)+'"></div>';
  }).join('')+'</div>';
  var stepLabel='<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:18px">Paso '+(byoStep+1)+' // 5</div>';
  var h=H('ARMA EL TUYO','byoStepBack()',true)+'<div style="flex:1;padding:20px 20px 160px;overflow-y:auto" class="fi">'+progressBar+stepLabel;
  if(byoStep===0){
    h+=SZTOG();
    h+=ST('','Pan','');
    h+=BASES.map(function(b){var av=isAvail(b.id);return av?CARD(b,base===b.id,'base=\''+b.id+'\';render()'):CARDOFF(b);}).join('');
  }else if(byoStep===1){
    h+=ST('','Proteína','');
    h+=PROTS.filter(function(p){return !p.vaultOnly&&!p.sigOnly;}).map(function(p){var av=isAvail(p.id);var priceTag=size?SOLES+protPrice(p):'—';var thumb=PROT_IMG[p.id]?'<img src="'+PROT_IMG[p.id]+'" alt="'+esc(p.l+' '+p.s)+'" style="width:56px;height:56px;object-fit:cover;border-radius:8px;flex-shrink:0" loading="lazy">':'';return av?CARD(p,prot===p.id,'prot=\''+p.id+'\';render()','<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:14px;color:'+(prot===p.id?GOLD:'var(--sw-text-muted,#A8C8B0)')+'">'+priceTag+'</span>'+lowStockNote(p.id),thumb):CARDOFF(p);}).join('');
  }else if(byoStep===2){
    h+=ST('','Toppings','Sin límite, elige los que quieras.');
    h+='<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:'+GOLD+';margin-bottom:12px">'+tL+' seleccionados</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
    h+=TOPS.filter(function(t){return !t.vaultOnly&&!t.sigOnly;}).map(function(t: any){
      var av=isAvail(t.id);
      if(!av)return TOPOFF(t);
      var sel=tops.indexOf(t.id)>=0;
      return'<div onclick="var i=tops.indexOf(\''+t.id+'\');if(i>=0)tops.splice(i,1);else tops.push(\''+t.id+'\');render()" style="background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:10px;padding:13px 14px;cursor:pointer;position:relative;transition:all .15s;box-shadow:'+(sel?SHADOW_GOLD:SHADOW_SM)+'">'+selBar(sel)+'<div style="display:flex;align-items:center;gap:6px"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+t.l+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+t.s+'</span>'+(t.spicy?icon('chili',12,'#ff8a5c'):'')+'</div>'+(t.d?'<div style="font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:3px">'+t.d+'</div>':'')+'</div>';
    }).join('');
    h+='</div>';
  }else if(byoStep===3){
    h+=ST('','Queso','Opcional — incluido sin costo si eliges 1.');
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
    h+=CHEESE.map(function(c){
      var av=isAvail(c.id);
      if(!av)return TOPOFF(c);
      var sel=cheese===c.id;
      return'<div onclick="cheese=(cheese===\''+c.id+'\'?null:\''+c.id+'\');render()" style="background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:10px;padding:13px 14px;cursor:pointer;position:relative;transition:all .15s;box-shadow:'+(sel?SHADOW_GOLD:SHADOW_SM)+'">'+selBar(sel)+'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+c.l+'</div></div>';
    }).join('');
    h+='</div>';
  }else{
    h+=ST('','Salsas','Hasta 3, incluidas sin costo. Opcional — si no quieres ninguna, sigue de largo.');
    h+='<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:'+GOLD+';margin-bottom:12px">'+sL+' // 3</div>';
    // Sugerencia no restrictiva por proteína, anclada a los maridajes que ya usan los
    // propios Signatures (auditoría de menú 2026-08-05: Atún→Aioli/Dijon, Pollo
    // Teriyaki→Satay/SNDWCH Special, Albóndiga→Oil&Vinegar) — solo marca las cartas
    // sugeridas con un tag, nunca bloquea ni preselecciona ninguna otra salsa.
    var sauceSuggest=({P04:['S01','S11'],P02:['S10','S05'],P06:['S06']})[prot]||[];
    if(sauceSuggest.length){
      h+='<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:12px">Sugerencia para tu proteína, marcada abajo — sigue siendo tu elección.</div>';
    }
    // Antes las 13 salsas eran una sola lista plana sin ningún elemento visual que las
    // distinguiera entre sí (el único paso de BUILD YOUR OWN sin agrupar/iconos, hallazgo
    // de auditoría UX). Se agrupan en PICANTES/OTRAS SALSAS y se marca con el ícono de ají
    // solo a las 2 cuya propia descripción ya declaraba picor — no es una clasificación
    // nueva, solo hace visible un dato que ya estaba en el texto.
    var sauceCard=function(s){
      var av=isAvail(s.id);
      if(!av)return'<div style="background:var(--sw-card2,#1A3028);border:1px solid #2a2a2a;border-radius:10px;padding:14px 16px;margin-bottom:8px;opacity:.35"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:600;color:var(--sw-text-muted,#A8C8B0)">'+s.l+'<span style="color:var(--sw-text-muted,#A8C8B0)"> // </span>'+s.s+'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#ff8888;margin-left:8px">Agotado</span></div></div>';
      var sel=sauces.indexOf(s.id)>=0,full=!sel&&sL>=3,suggested=sauceSuggest.indexOf(s.id)>=0;
      return'<div onclick="var i=sauces.indexOf(\''+s.id+'\');if(i>=0){sauces.splice(i,1);if(!sauces.length)extraSauce=false;}else if(sauces.length<3)sauces.push(\''+s.id+'\');render()" style="background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'#3A6B58')+';border-radius:10px;padding:14px 16px;cursor:'+(full?'not-allowed':'pointer')+';opacity:'+(full?.3:1)+';margin-bottom:8px;position:relative;transition:all .15s;box-shadow:'+(sel?SHADOW_GOLD:SHADOW_SM)+'">'+selBar(sel)+'<div style="display:flex;align-items:center;gap:6px"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+s.l+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+s.s+'</span>'+(s.spicy?icon('chili',14,'#ff8a5c'):'')+(suggested?'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:'+GOLD+';border:1px solid '+GOLD+';border-radius:20px;padding:1px 8px;margin-left:auto">Sugerida</span>':'')+'</div><p style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">'+s.d+'</p></div>';
    };
    // UNA sola lista, en el orden del catálogo. El picante se marca con el ícono de ají al
    // costado del nombre y nada más — que es lo que ya hace sauceCard.
    //
    // Antes esto se partía en dos secciones, "Picantes //" arriba y "Otras salsas //"
    // debajo. Eso le daba a una sola salsa un encabezado propio y el primer lugar de la
    // pantalla: el picante quedaba presentado como la categoría principal en vez de como
    // un atributo más (decisión del dueño 2026-08-21, "Ají está demasiado priorizado,
    // debe estar con las demás salsas solo al costado indicar que es picante"). Con una
    // sola salsa picante en el catálogo el agrupamiento además no ordenaba nada.
    var byoSauces=SAUCES.filter(function(s){return !s.sigOnly&&!s.vaultOnly;});
    h+=byoSauces.map(sauceCard).join('');
  }
  h+=AB(size?total():null,byoStepCanContinue(),'byoStepBack()','byoStepNext()',byoStep<4?'Siguiente →':'Continuar //',byoStepHint());
  return h;
}
function CARDOFF(item){return'<div style="background:var(--sw-card2,#1A3028);border:1px solid #2a2a2a;border-radius:10px;padding:14px 16px;margin-bottom:10px;opacity:.35"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:600;color:var(--sw-text-muted,#A8C8B0)">'+item.l+'<span style="color:var(--sw-text-muted,#A8C8B0)"> // </span>'+item.s+'</span><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#ff8888">Agotado</span></div></div>';}
function TOPOFF(t){return'<div style="background:var(--sw-card2,#1A3028);border:1px solid #2a2a2a;border-radius:10px;padding:13px 14px;opacity:.35"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text-muted,#A8C8B0)">'+t.l+'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:8px;color:#ff8888;display:block;margin-top:3px">Agotado</span></div></div>';}

// ORDER CONFIRM + SMART UPSELL
// PER-ITEM REVIEW — revisar un sándwich recién armado antes de agregarlo al carrito
function sOItemConfirm(){
  var sig=SIGS.find(function(x){return x.id===sigId;}),pr=PROTS.find(function(x){return x.id===prot;});
  var bk=mode==='sig'?'o_sig':'o_build',rows=[];
  var dbl=dblProtRef();
  var bp=mode==='sig'?sigPrice(sig):protPrice(pr);
  var dblSurcharge=doubleProt?dblFee(dbl,size):0;
  var sauceSurcharge=extraSauce?EXTRA_SAUCE_PRICE:0;
  var t=quickPayEligible?payableTotal():total();
  rows.push({k:'Tamaño',v:szLabel(size)});
  // Un Signature es curado por la casa — desglosarlo en pan/proteína/toppings/salsas
  // solo repite lo que ya dice el nombre del sándwich. Solo BUILD YOUR OWN (donde el
  // cliente sí eligió cada ingrediente) muestra ese desglose completo.
  if(mode!=='sig'){rows.push({k:'Pan',v:fn(BASES,base)});rows.push({k:'Proteína',v:fn(PROTS,prot),p:protPrice(pr)});rows.push({k:'Toppings',v:tops.length?tops.map(function(id){return fn(TOPS,id);}).join(' · '):'—'});rows.push({k:'Queso',v:cheese?fn(CHEESE,cheese):'sin queso'});rows.push({k:'Salsas',v:sauces.length?sauces.map(function(id){return fn(SAUCES,id);}).join(' + '):'—'});}
  if(doubleProt&&dbl)rows.push({k:'Doble',v:'Doble '+dbl.l+' // '+dbl.s,p:dblFee(dbl,size)});
  if(extraSauce)rows.push({k:'Salsa extra',v:'Salsa adicional a tu elección',p:2});
  // Queso opcional — mecanismo para un futuro Signature que lo ofrezca a elección (ver
  // cheeseOptional en SIGS). SIG02 lo usó hasta 2026-08-08; ahora tiene queso FIJO
  // (fixedCheese, ver sigPreviewOverlayHTML) porque la investigación de esa sesión
  // encontró que el queso derretido es estructural en esa receta, no opcional — ningún
  // Signature usa cheeseOptional hoy, esto queda listo por si hace falta más adelante.
  var cheeseSigAllowed=mode==='sig'&&sig&&sig.cheeseOptional;
  if(cheeseSigAllowed&&cheese)rows.push({k:'Queso',v:fn(CHEESE,cheese)+' (opcional, sin costo)'});
  // "Extra" es más de una salsa que ya elegiste — en BUILD YOUR OWN no tiene sentido
  // ofrecerla (ni el servidor la acepta) si el cliente no seleccionó ninguna salsa base.
  var sauceExtraAllowed=mode==='sig'||sauces.length>0;
  var recU=(!doubleProt&&dbl)?{k:'doubleProt',e:icon('dumbbell',18,GOLD),l:'Doble proteína',d:'El doble de tu proteína elegida'+dblStockWarn(dbl.id),p:dblFee(dbl,size)}:(!extraSauce&&sauceExtraAllowed)?{k:'sauce',e:icon('chili',18,GOLD),l:'Salsa extra',d:'Salsa adicional a tu elección',p:EXTRA_SAUCE_PRICE}:(cheeseSigAllowed&&!cheese)?{k:'cheese',e:icon('queso',18,GOLD),l:'Queso',d:'Cheddar derretido, opcional y gratis',p:0}:null;
  // Ticket-growth: sugerir subir a 30CM justo en la confirmación — antes el tamaño solo
  // se elegía una vez, más arriba en el flujo (SZTOG), sin ninguna segunda oportunidad de
  // upsell aquí. 0 cuando el 30CM no cuesta más que el 15CM (hoy ningún ítem) —
  // no tiene sentido "sugerir" un upgrade que no mueve el ticket.
  var sizeUpsellDelta=size==='15'?(mode==='sig'?(sig?sig.p30-sig.p15:0):(pr?pr.p30-pr.p15:0)):0;
  function uSel(k){return k==='doubleProt'?doubleProt:k==='sauce'?extraSauce:k==='cheese'?!!cheese:false;}
  function uBtn(k,e,l,d,p,sel){
    var act=(k==='doubleProt'?'doubleProt=!doubleProt':k==='sauce'?'extraSauce=!extraSauce':'cheese=(cheese?null:\'C02\')')+(quickPayEligible?';cart[0]=currentBuiltItem()':'');
    var priceLabel=p?SOLES+p:'GRATIS';
    return'<div onclick="'+act+';'+(quickPayEligible?'confirmRerender()':'render()')+'" style="background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'var(--sw-border,#3A6B58)')+';border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:8px;position:relative;transition:all .15s;box-shadow:'+SHADOW_SM+'">'+selBar(sel)+'<div style="display:flex;align-items:center;gap:10px"><span style="font-size:18px">'+e+'</span><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+l+'</div><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">'+d+'</div></div></div><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:'+(sel?GOLD:'#A8C8B0')+';flex-shrink:0;margin-left:8px">'+(sel?'✓ ':'+')+priceLabel+'</span></div>';
  }
  var sigNameHTML=(mode==='sig'&&sig)?'<div style="margin:2px 0 14px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:26px;font-weight:640;color:var(--sw-text,#FFFFFF);letter-spacing:.03em;line-height:1.15">'+sig.n+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+sigTypeTag(sig.s)+'</div></div>':'';
  return H('CONFIRMAR SÁNDWICH',(quickPayEligible?'backFromConfirm()':'go(\''+bk+'\')'),true)+'<div style="flex:1;padding:20px 20px 160px;overflow-y:auto" class="fi">'
    +'<div style="background:'+'var(--sw-card,#2D5246)'+';border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:16px;margin-bottom:16px;box-shadow:'+SHADOW_SM+'"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.25em;margin-bottom:14px">'+(mode==='sig'?'Tu signature //':'Tu build //')+'</div>'+rows.map(function(r){return'<div style="display:flex;justify-content:space-between;margin-bottom:9px;gap:8px;align-items:flex-start"><span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;letter-spacing:.1em;color:'+GOLD+';min-width:72px">'+r.k+'</span><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:var(--sw-text-body,#F2F0EB);flex:1;line-height:1.4">'+r.v+'</span>'+(r.p?'<span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:'+GOLD+';flex-shrink:0">'+SOLES+r.p+'</span>':'')+'</div>';}).join('')+sigNameHTML+'<div style="border-top:1px solid var(--sw-border,#3A6B58);margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;align-items:center"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text-body,#F2F0EB)">Total</span><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:28px;font-weight:640;color:'+GOLD+'">'+SOLES+pz(t)+'</span></div></div>'
    +(sizeUpsellDelta>0?'<div onclick="size=\'30\';'+(quickPayEligible?'cart[0]=currentBuiltItem();confirmRerender()':'render()')+'" style="background:'+'var(--sw-card2,#1A3028)'+';border:1px solid rgba(203,162,88,.3);border-radius:10px;padding:14px 16px;margin-bottom:12px;cursor:pointer;box-shadow:'+SHADOW_SM+'"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">¿Con más hambre? //</div><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">Sube a 30CM</div><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">El doble de sándwich por un poco más</div></div><span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:14px;color:'+GOLD+'">+'+SOLES+sizeUpsellDelta+'</span></div></div>':'')
    +(recU?'<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.3);border-radius:10px;padding:14px 16px;margin-bottom:12px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">¿Algo más? //</div>'+uBtn(recU.k,recU.e,recU.l,recU.d,recU.p,uSel(recU.k))+'</div>':'')
    +'<details style="margin-bottom:12px"><summary style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;cursor:pointer;list-style:none;padding:8px 0">Todos los extras // ▾</summary><div style="margin-top:8px">'+(dbl?uBtn('doubleProt',icon('dumbbell',18,GOLD),'Doble proteína','El doble de tu proteína elegida'+dblStockWarn(dbl.id),dblFee(dbl,size),doubleProt):'')+(sauceExtraAllowed?uBtn('sauce',icon('chili',18,GOLD),'Salsa extra','Salsa adicional a tu elección',2,extraSauce):'')+(cheeseSigAllowed?uBtn('cheese',icon('queso',18,GOLD),'Queso','Cheddar derretido, opcional y gratis',0,!!cheese):'')+'</div></details>'
    +(cust?'<div style="margin-top:16px;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:8px;display:flex;align-items:center;gap:5px">'+icon('estrella',11,GOLD)+'<span>Guardar como favorito //</span></div><div style="display:flex;gap:8px"><input id="o-favname" type="text" maxlength="40" placeholder="Nombre // opcional" style="flex:1;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:8px;padding:10px 12px;color:var(--sw-text,#FFFFFF);font-size:13px"><button onclick="doSaveFavorite()" style="all:unset;cursor:pointer;background:'+GOLD+';color:#241a08;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:10px 16px;border-radius:8px">Guardar</button></div><div id="fav-msg" style="font-family:\'EB Garamond\',serif;font-size:11px;color:'+GOLD+';margin-top:6px">'+favMsg+'</div></div>':'')
    +(quickPayEligible
        ?checkoutExtrasHTML()+'<div onclick="goToCartFromConfirm()" style="margin-top:16px;text-align:center;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:12px;cursor:pointer"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#FFFFFF)">+ Carrito</div><div style="font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">por si deseas pedir más de un SND//WCH</div></div>'
        :'<div id="o-err" style="font-family:\'EB Garamond\',serif;font-size:12px;color:#ff5555;margin-top:8px;min-height:16px"></div>')
    +'</div>'
    +(quickPayEligible
        ?AB(t,!checkoutLocked,'backFromConfirm()','doOrder()',payButtonLabel(t,'Pagar ahora //'))
        :AB(t,true,'go(\''+bk+'\')','addSandwichToCart()','Agregar al carrito //'));
}
async function doSaveFavorite(){
  var nameEl=(document.getElementById('o-favname') as HTMLInputElement | null);
  var typed=nameEl?nameEl.value.trim():'';
  // El nombre es opcional — si no escribe uno, usamos el nombre del propio sándwich
  // (el signature, o proteína+tamaño para build-your-own) en vez de bloquear el guardado.
  var sigForName=mode==='sig'?SIGS.find(function(x){return x.id===sigId;}):null;
  var defaultName=sigForName?(sigForName.n+' '+szLabel(size)):(fn(PROTS,prot)+' '+szLabel(size));
  var name=typed||defaultName;
  try{
    await api('favorites-add',{token:token,name:name,mode:mode,sigId:sigId,base:base,prot:prot,tops:tops,cheese:cheese,sauces:sauces,size:size,doubleProt:doubleProt,extraSauce:extraSauce});
    favMsg='¡Guardado!';
    loadUserExtras();
  }catch(e){favMsg=e.message;render();}
}

// SIDES/BEBIDAS
function sOSides(){
  var h=H('BEBIDAS Y SIDES',"sndScreen='o_cart';render()",true)+'<div style="flex:1;padding:20px 20px 140px;overflow-y:auto" class="fi">'+ST('01','Elige','Se agregan a tu carrito.');
  h+=SIDES.map(function(d){
    var inCart=cart.find(function(it){return it.type==='side'&&it.code===d.id;});
    var qty=inCart?inCart.qty:0;
    return'<div style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px"><div style="display:flex;align-items:flex-start;gap:12px;flex:1"><div style="flex-shrink:0;width:36px;height:36px;border-radius:50%;background:rgba(203,162,88,.12);display:flex;align-items:center;justify-content:center">'+icon(d.icon,17,GOLD)+'</div><div style="flex:1"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+d.l+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+d.s+'</div>'+(d.d?'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:3px;line-height:1.4">'+esc(d.d)+'</div>':'')+'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:'+GOLD+';margin-top:4px">'+SOLES+d.p+'</div></div></div>'+(qty>0?'<div style="display:flex;align-items:center;gap:10px"><button onclick="sideQtyChange(\''+d.id+'\',-1)" style="all:unset;cursor:pointer;width:34px;height:34px;background:var(--sw-card,#2D5246);border-radius:6px;text-align:center;color:var(--sw-text,#FFFFFF);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:600">−</button><span class="bump" style="display:inline-block;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);min-width:14px;text-align:center">'+qty+'</span><button onclick="sideQtyChange(\''+d.id+'\',1)" style="all:unset;cursor:pointer;width:34px;height:34px;background:var(--sw-card,#2D5246);border-radius:6px;text-align:center;color:var(--sw-text,#FFFFFF);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:600">+</button></div>':'<button onclick="addSideToCart(\''+d.id+'\')" style="all:unset;cursor:pointer;background:'+GOLD+';color:#241a08;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:9px 16px;border-radius:8px">Agregar</button>')+'</div>';
  }).join('');
  h+='</div>'+AB(null,true,null,"sndScreen='o_cart';render()",'Ver carrito //');
  return h;
}
