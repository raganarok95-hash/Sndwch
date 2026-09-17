// ORDER BUILD
// Antes las 5 categorías (pan, proteína, toppings, queso, salsas — 13 salsas en total)
// vivían en un solo scroll continuo de ~3 pantallas de largo, todas con la misma
// tarjeta idéntica sin ninguna jerarquía visual entre categorías — el "muro de texto"
// que más distancia a esta pantalla de una experiencia de armado premium (ver Subway:
// un paso a la vez, con progreso claro). Convertido a un asistente de 5 pasos —
// mismos datos/validaciones de siempre (base/prot/tops/cheese/sauces), solo cambia
// cómo se presentan. BYO_STEP_LABELS/byoStep* viven junto al resto del estado del
// builder (ver resetBuilder/loadBuild).
// ⚠ ESTE ARRAY ES EL ORDEN REAL DE LOS PASOS, no una lista de nombres bonitos.
// El 2026-09-05 se intercambió el CONTENIDO de los pasos 2 y 3 para seguir el orden del
// mostrador de Subway (queso antes que vegetales) y nadie tocó esto ni `byoValor`. Durante
// doce días el riel dijo TOPPINGS mientras la pantalla decía Queso, y QUESO mientras la
// pantalla decía Vegetales — con el valor equivocado al lado, además. No rompía nada: solo
// mentía. Lo vigila `tests/armador-riel.spec.ts`, que compara el rótulo encendido del riel
// contra el título que de verdad se pintó.
// "Vegetales" y no "Toppings": es la palabra que usa Subway en español y la que el cliente
// peruano ya trae; "toppings" es jerga de heladería.
var BYO_STEP_LABELS=['PAN','PROTEÍNA','QUESO','VEGETALES','SALSAS'];
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
  // ── EL RIEL DE PASOS (concepto 6, elegido por el dueño) ─────────────────────────────
  //
  // Antes esto era una barra de 5 segmentos + el rótulo "Paso 2 // 5". Con eso el cliente
  // ve DÓNDE va, pero no QUÉ lleva elegido: para recordar si ya puso el pan tiene que
  // volver atrás, y volver atrás en un armador es donde se abandona un pedido.
  //
  // El riel muestra los cinco pasos con su valor actual al lado. Es el mismo progreso, con
  // el dato que faltaba.
  //
  // ⚠ LO ELEGIDO SE LEE DEL ESTADO REAL, nunca de una copia. Si un paso se guardara aparte
  // para pintarlo acá, el día que el cliente cambie el pan por el camino largo el riel
  // diría una cosa y el carrito cobraría otra — que es el defecto que este repo ya pagó
  // con los precios fantasma, en versión pequeña.
  var byoValor=function(i){
    if(i===0){
      var b=BASES.find(function(x){return x.id===base;});
      var t=size?(size==='30'?'30CM':'15CM'):'';
      return b?(t?t+' · ':'')+b.l:(t||'');
    }
    if(i===1){var pr=PROTS.find(function(x){return x.id===prot;});return pr?pr.l+(doubleProt?' · doble':''):'';}
    if(i===2){var c=CHEESE.find(function(x){return x.id===cheese;});return c?c.l:(cheese===null&&byoStep>2?'sin queso':'');}
    if(i===3)return tops.length?tops.length+(tops.length===1?' vegetal':' vegetales'):'';
    if(i===4)return sauces.length?sauces.length+(sauces.length===1?' salsa':' salsas'):'';
    return'';
  };
  var progressBar='<div style="margin-bottom:16px;background:var(--sw-card2,#171A14);border-radius:12px;padding:5px">'
    +BYO_STEP_LABELS.map(function(l,i){
      var hecho=i<byoStep, actual=i===byoStep;
      var v=byoValor(i);
      // El paso ACTUAL lleva el color del lado; los hechos, su valor en claro; los que
      // faltan quedan atenuados. Sin resplandor: ninguna señal de estado en esta app lo
      // usa (ver DESIGN.md), el contraste lo dan la opacidad y el color.
      // `data-paso`/`data-actual` los lee `tests/armador-riel.spec.ts` para comparar el
      // rótulo encendido contra el título que se pintó. Sin un gancho estable habría que
      // reconocer el paso activo por su color inline, que cambia con el lado y con el tema.
      return'<div data-paso="'+i+'"'+(actual?' data-actual="1"':'')+' style="display:flex;align-items:center;gap:11px;padding:9px 11px;border-radius:8px;'
        +(actual?'background:'+ACC()+';':'')+'">'
        +'<span style="width:22px;height:22px;border-radius:50%;flex:0 0 auto;display:flex;'
        +'align-items:center;justify-content:center;font-family:\'EB Garamond\',serif;font-weight:600;'
        +'font-size:9px;border:1px solid '+(actual?'var(--sw-on-gold,#241a08)':hecho?ACC():'var(--sw-border,#2C3228)')+';'
        +'color:'+(actual?'var(--sw-on-gold,#241a08)':hecho?ACC():'var(--sw-text-muted3,#73776C)')+'">'
        +(hecho?'&#10003;':(i+1))+'</span>'
        +'<span style="flex:1;min-width:0;font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;'
        +'letter-spacing:.12em;color:'+(actual?'var(--sw-on-gold,#241a08)':'var(--sw-text,#fff)')
        +';opacity:'+(actual||hecho?'1':'.5')+'">'+l+'</span>'
        +'<span style="flex:0 0 auto;font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;'
        +'color:'+(actual?'var(--sw-on-gold,#241a08)':'var(--sw-text-muted,#9DA096)')+';'
        +'opacity:'+(actual?'.8':'1')+';max-width:150px;overflow:hidden;text-overflow:ellipsis;'
        +'white-space:nowrap">'+esc(v)+'</span>'
        +'</div>';
    }).join('')+'</div>';
  var stepLabel='';
  // WICHO preside su pantalla. No es adorno: el armador ES lo que él representa —el lado
  // donde el cliente decide— y tenerlo presente es lo que hace que el cambio de mundo se
  // lea como "pasaste con el otro hermano" y no como "cambió el color".
  var wichoCab=CAB('wicho',byoStep===0?'Empieza por el pan. Nada está mal.':byoStepHint(),byoStep>0);
  var h=H('ARMA EL TUYO','byoStepBack()',true)+'<div style="flex:1;padding:20px 20px 160px;overflow-y:auto" class="fi">'
    +wichoCab+progressBar+stepLabel;
  if(byoStep===0){
    h+=SZTOG();
    h+=ST('','Pan','');
    // ── DOS PANES, DOS PANELES — no dos filas de una lista ────────────────────────────
    // Son exactamente dos opciones y la decisión es una comparación, no un recorrido. Una
    // lista vertical obliga a leer una, bajar, leer la otra y recordar la primera; lado a
    // lado se comparan de un vistazo. El recargo va ARRIBA, visible antes de elegir: la
    // focaccia dejó de ser gratis el 2026-09-03 y un precio que aparece recién en el
    // carrito es la clase de sorpresa que hace abandonar el pedido.
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
    h+=BASES.map(function(b){
      var av=isAvail(b.id),sel=base===b.id;
      var extra=size?baseSurcharge(b.id,size):0;
      if(!av)return'<div style="background:var(--sw-card2,#171A14);border:1px solid var(--sw-border,#2C3228);border-radius:12px;padding:18px 15px;min-height:140px;display:flex;flex-direction:column;justify-content:flex-end;opacity:.35"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text-muted,#9DA096)">'+b.l+'</div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-danger,#ff8888);margin-top:4px">Agotado</div></div>';
      return'<div onclick="base=\''+b.id+'\';render()" style="position:relative;background:'+(sel?'var(--sw-card2,#171A14)':'var(--sw-card,#1B1F18)')+';border:1px solid '+(sel?ACC():'var(--sw-border,#2C3228)')+';border-radius:12px;padding:18px 15px;min-height:140px;display:flex;flex-direction:column;justify-content:flex-end;cursor:pointer;transition:all .15s;box-shadow:'+(sel?SHADOW_GOLD:SHADOW_SM)+'">'
        +(extra>0?'<div style="position:absolute;top:12px;right:13px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:'+(sel?ACC():'var(--sw-text-muted,#9DA096)')+'">+'+SOLES+pz(extra)+'</div>':'')
        +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text,#fff);line-height:1.1">'+b.l+'</div>'
        +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;letter-spacing:.14em;color:'+(sel?ACC():'var(--sw-text-muted3,#73776C)')+';margin-top:5px">'+b.s.toUpperCase()+'</div>'
        +(b.d?'<p style="font-family:\'EB Garamond\',serif;font-size:11px;line-height:1.45;color:var(--sw-text-muted,#9DA096);margin-top:9px">'+esc(b.d)+'</p>':'')
        +'</div>';
    }).join('');
    h+='</div>';
  }else if(byoStep===1){
    // ── LA PROTEÍNA SE ELIGE MIRÁNDOLA ───────────────────────────────────────────────
    // Es la decisión que define el sándwich y la única del armador que tiene fotografía
    // propia. En una fila de lista esa foto era una miniatura de 56px al costado de un
    // párrafo: el tamaño de un ícono, para lo único que el cliente de verdad quiere ver.
    // Acá la foto ES la tarjeta, en el mismo mosaico de dos columnas que los Signatures.
    h+=ST('','Proteína','');
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
    h+=PROTS.filter(function(p){return !p.vaultOnly&&!p.sigOnly;}).map(function(p){
      var av=isAvail(p.id),sel=prot===p.id;
      // `size` arranca en null y el paso de tamaño va ANTES, así que sin esto las
      // proteínas mostrarían un guion donde va el precio — y acá el cliente no viene de
      // ver ningún precio: los panes no tienen uno propio, este sería el primero que la
      // pantalla le enseña. Se muestra el del 15CM; `size` sigue exigiéndose igual.
      var precio=size?protPrice(p):p.p15;
      var img=PROT_IMG[p.id];
      if(!av)return'<div style="position:relative;aspect-ratio:1;border-radius:12px;overflow:hidden;background:var(--sw-card2,#171A14);border:1px solid var(--sw-border,#2C3228);display:flex;align-items:flex-end;padding:13px;opacity:.4">'
        +(img?'<img src="'+img+'" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(1)">':'')
        +'<div style="position:relative"><div style="font-family:\'Bodoni Moda\',serif;font-size:15px;font-weight:640;color:var(--sw-text-muted,#9DA096)">'+p.l+'</div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-danger,#ff8888)">Agotado</div></div></div>';
      return'<div onclick="prot=\''+p.id+'\';render()" style="position:relative;aspect-ratio:1;border-radius:12px;overflow:hidden;cursor:pointer;border:'+(sel?'2px solid '+ACC():'1px solid var(--sw-border,#2C3228)')+';background:var(--sw-card,#1B1F18);transition:all .15s;box-shadow:'+(sel?SHADOW_GOLD:SHADOW_SM)+'">'
        +(img?'<img src="'+img+'" alt="'+esc(p.l+' '+p.s)+'" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">':'')
        // El degradado no es decoración: sin él el nombre se pierde sobre la parte clara
        // de la foto, y cada foto tiene la parte clara en otro sitio.
        +'<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.1) 0%,rgba(0,0,0,.05) 38%,rgba(0,0,0,.72) 100%)"></div>'
        +(sel?'<div style="position:absolute;top:9px;right:9px;width:22px;height:22px;border-radius:999px;background:'+ACC()+';display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--sw-on-gold,#241a08)">&#10003;</div>':'')
        +'<div style="position:absolute;left:12px;right:12px;bottom:11px">'
        +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:640;color:#fff;line-height:1.1;text-shadow:0 1px 6px rgba(0,0,0,.8)">'+p.l+'</div>'
        +'<div style="display:flex;justify-content:space-between;align-items:baseline;gap:6px;margin-top:2px">'
        +'<span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;letter-spacing:.12em;color:rgba(255,255,255,.72)">'+p.s.toUpperCase()+'</span>'
        +'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:'+(sel?ACC():'#fff')+';text-shadow:0 1px 6px rgba(0,0,0,.8)">'+SOLES+pz(precio)+'</span>'
        +'</div></div>'
        +lowStockNote(p.id)
        +'</div>';
    }).join('');
    h+='</div>';
    // La descripción de la proteína elegida, UNA sola, debajo del mosaico. Antes las seis
    // descripciones estaban a la vez en pantalla y ninguna se leía.
    var pSel=PROTS.find(function(x){return x.id===prot;});
    if(pSel&&pSel.d)h+='<p style="font-family:\'EB Garamond\',serif;font-size:13px;line-height:1.5;color:var(--sw-text-muted,#9DA096);margin-top:14px">'+esc(pSel.d)+'</p>';
  // ── ORDEN SUBWAY (2026-09-05) ──────────────────────────────────────────────────────
  // El queso va ANTES de los vegetales, no después. Es el orden real del mostrador de
  // Subway (pan -> proteína -> queso -> tostado -> vegetales -> salsas) y el que el cliente
  // ya trae aprendido: el queso se pone sobre la proteína porque va debajo, y porque es lo
  // que se funde al tostar.
  }else if(byoStep===2){
    h+=ST('','Queso','Incluido sin costo si eliges uno.');
    // ── "SIN QUESO" ES UNA OPCIÓN, NO LA AUSENCIA DE UNA ──────────────────────────────
    // Antes la única forma de decir "ninguno" era no tocar nada, o tocar dos veces el que
    // ya estaba. Eso deja al cliente sin saber si el paso está resuelto o si se lo saltó
    // por error — y el riel de pasos le muestra un guion que parece un pendiente.
    h+='<div style="display:flex;flex-wrap:wrap;gap:8px">';
    h+=FICHA('Sin queso',cheese===null,'cheese=null;render()');
    h+=CHEESE.map(function(c){
      if(!isAvail(c.id))return FICHA_OFF(c.l);
      return FICHA(c.l,cheese===c.id,'cheese=\''+c.id+'\';render()');
    }).join('');
    h+='</div>';
  }else if(byoStep===3){
    // "Vegetales" y no "Toppings": es la palabra que usa Subway en español y la que el
    // cliente peruano ya trae. "Toppings" es jerga de heladería y de pizza.
    //
    // ── SON GRATIS E ILIMITADOS, ASÍ QUE LO QUE HACE FALTA ES VELOCIDAD ───────────────
    // Cada vegetal traía su párrafo de venta — y por un defecto real, DOS VECES el mismo
    // párrafo. Pero acá no hay nada que vender: no cuestan, no hay tope y los nombres se
    // explican solos (tomate, cebolla, lechuga). El párrafo solo alargaba el paso a dos
    // pantallas de scroll para una decisión de tres toques. Fichas, y "todos" de un golpe.
    h+=ST('','Vegetales','Sin límite, y ninguno cuesta.');
    var vegDisp=TOPS.filter(function(t: any){return !t.vaultOnly&&!t.sigOnly&&isAvail(t.id);});
    var todosIds=vegDisp.map(function(t: any){return t.id;});
    var todos=tL>0&&todosIds.every(function(id){return tops.indexOf(id)>=0;});
    h+='<div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:12px">'
      +'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:'+(tL?ACC():'var(--sw-text-muted3,#73776C)')+'">'+(tL?tL+(tL===1?' elegido':' elegidos'):'ninguno todavía')+'</span>'
      +'<span onclick="tops='+(todos?'[]':'['+todosIds.map(function(id){return'\''+id+'\'';}).join(',')+']')+';render()" style="cursor:pointer;font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;letter-spacing:.14em;color:'+ACC()+';border-bottom:1px solid '+ACC()+'">'+(todos?'QUITAR TODOS':'PONER TODOS')+'</span>'
      +'</div>';
    h+='<div style="display:flex;flex-wrap:wrap;gap:8px">';
    h+=TOPS.filter(function(t: any){return !t.vaultOnly&&!t.sigOnly;}).map(function(t: any){
      if(!isAvail(t.id))return FICHA_OFF(t.l);
      var sel=tops.indexOf(t.id)>=0;
      return FICHA(t.l+(t.spicy?' '+icon('chili',11,'#ff8a5c'):''),sel,'var i=tops.indexOf(\''+t.id+'\');if(i>=0)tops.splice(i,1);else tops.push(\''+t.id+'\');render()');
    }).join('');
    h+='</div>';
  }else{
    h+=ST('','Salsas','Hasta 3, incluidas sin costo.');
    // ── LA BANDEJA DE TRES ESPACIOS ──────────────────────────────────────────────────
    // El tope de 3 era un texto ("0 // 3") que nadie mira hasta que la cuarta salsa deja
    // de responder al toque — y una carta que no responde parece rota, no llena. Tres
    // espacios dibujados dicen cuántos quedan ANTES de tocar, y al llenarse explican solos
    // por qué las demás se apagan.
    h+='<div style="display:flex;gap:6px;margin-bottom:16px">';
    for(var _i=0;_i<3;_i++){
      var lleno=_i<sL;
      h+='<div style="flex:1;height:4px;border-radius:999px;background:'+(lleno?ACC():'var(--sw-border,#2C3228)')+';transition:background .2s"></div>';
    }
    h+='</div>';
    // Sugerencia no restrictiva por proteína, anclada a los maridajes que ya usan los
    // propios Signatures (auditoría de menú 2026-08-05: Atún→Aioli/Dijon, Pollo
    // Teriyaki→Satay/SNDWCH Special, Albóndiga→Oil&Vinegar) — solo marca las sugeridas,
    // nunca bloquea ni preselecciona ninguna otra salsa.
    var sauceSuggest=({P04:['S01','S11'],P02:['S10','S05'],P06:['S06']})[prot]||[];
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
    h+=SAUCES.filter(function(s){return !s.sigOnly&&!s.vaultOnly;}).map(function(s){
      if(!isAvail(s.id))return'<div style="background:var(--sw-card2,#171A14);border:1px solid var(--sw-border,#2C3228);border-radius:10px;padding:12px 13px;opacity:.35"><div style="font-family:\'Bodoni Moda\',serif;font-size:13px;font-weight:600;color:var(--sw-text-muted,#9DA096)">'+s.l+'</div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-danger,#ff8888);margin-top:3px">Agotado</div></div>';
      var sel=sauces.indexOf(s.id)>=0,lleno=!sel&&sL>=3,sug=sauceSuggest.indexOf(s.id)>=0;
      return'<div onclick="var i=sauces.indexOf(\''+s.id+'\');if(i>=0){sauces.splice(i,1);if(!sauces.length)extraSauce=false;}else if(sauces.length<3)sauces.push(\''+s.id+'\');render()" style="position:relative;background:'+(sel?'var(--sw-card2,#171A14)':'var(--sw-card,#1B1F18)')+';border:1px solid '+(sel?ACC():'var(--sw-border,#2C3228)')+';border-radius:10px;padding:12px 13px;cursor:'+(lleno?'not-allowed':'pointer')+';opacity:'+(lleno?.32:1)+';transition:all .15s;box-shadow:'+(sel?SHADOW_GOLD:SHADOW_SM)+'">'
        +(sug&&!sel?'<div style="position:absolute;top:10px;right:11px;width:5px;height:5px;border-radius:999px;background:'+ACC()+'" title="Sugerida para tu proteína"></div>':'')
        +(sel?'<div style="position:absolute;top:9px;right:10px;font-size:11px;color:'+ACC()+'">&#10003;</div>':'')
        +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#fff);padding-right:16px">'+s.l+(s.spicy?' '+icon('chili',11,'#ff8a5c'):'')+'</div>'
        // Una sola frase, no el párrafo entero: son 11 salsas en pantalla y el párrafo
        // completo convertía el paso en un muro que nadie lee.
        +(s.d?'<div style="font-family:\'EB Garamond\',serif;font-size:11px;line-height:1.4;color:var(--sw-text-muted,#9DA096);margin-top:4px">'+esc(primeraFrase(s.d))+'</div>':'')
        +'</div>';
    }).join('');
    h+='</div>';
    if(sauceSuggest.length)h+='<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted3,#73776C);margin-top:12px"><span style="display:inline-block;width:5px;height:5px;border-radius:999px;background:'+ACC()+';vertical-align:middle;margin-right:6px"></span>Va bien con la proteína que elegiste — sigue siendo tu elección.</div>';
  }
  h+=AB(size?total():null,byoStepCanContinue(),'byoStepBack()','byoStepNext()',byoStep<4?'Siguiente →':'Continuar //',byoStepHint());
  return h;
}
// ── LA FICHA ─────────────────────────────────────────────────────────────────────────
// Para elegir entre cosas cuyo NOMBRE ya lo dice todo (quesos, vegetales). Una tarjeta con
// párrafo para "Tomate" no informa: ocupa. La ficha cabe 3 por fila, así que los 8
// vegetales entran en una pantalla en vez de dos y medio.
function FICHA(etiqueta,sel,fn){
  return'<div onclick="'+fn+'" style="display:inline-flex;align-items:center;gap:5px;background:'+(sel?ACC():'var(--sw-card,#1B1F18)')+';border:1px solid '+(sel?ACC():'var(--sw-border,#2C3228)')+';border-radius:999px;padding:10px 16px;cursor:pointer;transition:all .15s;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:'+(sel?'var(--sw-on-gold,#241a08)':'var(--sw-text,#fff)')+'">'+etiqueta+'</div>';
}
function FICHA_OFF(etiqueta){
  return'<div style="display:inline-flex;align-items:center;background:var(--sw-card2,#171A14);border:1px solid var(--sw-border,#2C3228);border-radius:999px;padding:10px 16px;opacity:.35;font-family:\'Bodoni Moda\',serif;font-size:13px;font-weight:600;color:var(--sw-text-muted,#9DA096);text-decoration:line-through">'+etiqueta+'</div>';
}

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
  // ⚠ LA LÍNEA QUE SOSTIENE EL TOTAL. Un Signature no se desglosa (ver abajo), y sin esta
  // línea el papel mostraba "Tamaño · 15CM" y debajo "TOTAL S/23.90" — un total sin una
  // sola línea que lo explique. Es el mismo defecto que descuadraba el recibo del carrito,
  // en su forma más pura: la cuenta no se puede seguir.
  if(mode==='sig'&&sig)rows.push({k:'Signature',v:sig.n,p:bp});
  rows.push({k:'Tamaño',v:szLabel(size)});
  // Un Signature es curado por la casa — desglosarlo en pan/proteína/toppings/salsas
  // solo repite lo que ya dice el nombre del sándwich. Solo BUILD YOUR OWN (donde el
  // cliente sí eligió cada ingrediente) muestra ese desglose completo.
  if(mode!=='sig'){rows.push({k:'Pan',v:fn(BASES,base)});rows.push({k:'Proteína',v:fn(PROTS,prot),p:protPrice(pr)});rows.push({k:'Vegetales',v:tops.length?tops.map(function(id){return fn(TOPS,id);}).join(' · '):'—'});rows.push({k:'Queso',v:cheese?fn(CHEESE,cheese):'sin queso'});rows.push({k:'Salsas',v:sauces.length?sauces.map(function(id){return fn(SAUCES,id);}).join(' + '):'—'});}
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
  // money() no es cosmético acá: 23.90-13.90 en punto flotante da 9.999999999999998, y esa
  // era la cifra que el cliente veía en el empujón a 30CM. Se redondea en el CÁLCULO y no
  // solo al pintarlo, porque el mismo valor decide si la tarjeta aparece (>0).
  var sizeUpsellDelta=money(size==='15'?(mode==='sig'?(sig?sig.p30-sig.p15:0):(pr?pr.p30-pr.p15:0)):0);
  function uSel(k){return k==='doubleProt'?doubleProt:k==='sauce'?extraSauce:k==='cheese'?!!cheese:false;}
  function uBtn(k,e,l,d,p,sel){
    var act=(k==='doubleProt'?'doubleProt=!doubleProt':k==='sauce'?'extraSauce=!extraSauce':'cheese=(cheese?null:\'C02\')')+(quickPayEligible?';cart[0]=currentBuiltItem()':'');
    var priceLabel=p?SOLES+pz(p):'GRATIS';
    return'<div onclick="'+act+';'+(quickPayEligible?'confirmRerender()':'render()')+'" style="background:'+(sel?'var(--sw-card2,#171A14)':'var(--sw-card,#1B1F18)')+';border:1px solid '+(sel?GOLD:'var(--sw-border,#2C3228)')+';border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:8px;position:relative;transition:all .15s;box-shadow:'+SHADOW_SM+'">'+selBar(sel)+'<div style="display:flex;align-items:center;gap:10px"><span style="font-size:18px">'+e+'</span><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+l+'</div><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#9DA096)">'+d+'</div></div></div><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:'+(sel?GOLD:'#9DA096')+';flex-shrink:0;margin-left:8px">'+(sel?'✓ ':'+')+priceLabel+'</span></div>';
  }
  // ── HERO A SANGRE ─────────────────────────────────────────────────────────────────
  // El nombre del Signature estaba escrito DEBAJO del desglose: se leía "Tamaño · 15CM"
  // y recién después de qué sándwich se estaba hablando. Ahora encabeza la pantalla sobre
  // su propia foto, a sangre y sin márgenes laterales — el mismo tratamiento con el que se
  // eligió en la lista, así que la pantalla confirma visualmente lo que se tocó.
  //
  // Un armado no tiene foto propia (es una combinación que no existe fotografiada), así
  // que usa la de su PROTEÍNA, que es la decisión que de verdad lo define. No se inventa
  // una imagen de un sándwich que nadie fotografió.
  var heroImg=(mode==='sig'&&sig)?SIG_IMG[sig.id]:PROT_IMG[prot];
  var heroTitulo=(mode==='sig'&&sig)
    ?sig.n+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+sigTypeTag(sig.s)
    :'Tu SND'+'<span class="cut-sep" style="color:'+GOLD+'">//</span>'+'WCH';
  var heroSub=(mode==='sig'&&sig)?esc(sigBadge(sig)):esc(fn(PROTS,prot));
  var heroHTML=heroImg
    ?'<div style="position:relative;height:190px;margin:-20px -20px 16px;overflow:hidden">'
      +'<img src="'+heroImg+'" alt="'+esc(mode==='sig'&&sig?sig.n:'')+'" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">'
      // El degradado cierra contra el fondo de la app (no contra negro) para que la foto
      // no termine en un corte duro: se funde con la pantalla en vez de estar pegada.
      +'<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.25) 0%,rgba(0,0,0,.05) 30%,rgba(0,0,0,.55) 70%,var(--sw-bg,#12150F) 100%)"></div>'
      +'<div style="position:absolute;left:20px;right:20px;bottom:12px">'
      +PILL(heroSub,false)+'<span style="margin-left:6px">'+PILL(szLabel(size),true)+'</span>'
      +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:28px;font-weight:640;color:#fff;letter-spacing:.02em;line-height:1.12;margin-top:7px;text-shadow:0 2px 8px rgba(0,0,0,.75)">'+heroTitulo+'</div>'
      +'</div></div>'
    // Sin foto no se inventa una: queda el nombre solo, que es lo que había antes.
    :'<div style="margin:2px 0 14px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:28px;font-weight:640;color:var(--sw-text,#FFFFFF);letter-spacing:.03em;line-height:1.15">'+heroTitulo+'</div></div>';
  return H('CONFIRMAR SÁNDWICH',(quickPayEligible?'backFromConfirm()':'go(\''+bk+'\')'),true)+'<div style="flex:1;padding:20px 20px 160px;overflow-y:auto" class="fi">'
    +heroHTML
    // ── ETIQUETA ──────────────────────────────────────────────────────────────────
    // El desglose deja de ser una tarjeta verde más entre tarjetas verdes y pasa al mismo
    // papel del recibo del carrito. No es un cambio de color: acá se está mostrando una
    // CUENTA, y el material tiene que decir eso antes de que se lea una sola cifra.
    // Que las dos pantallas usen el mismo papel importa además porque el cliente ve las
    // dos seguidas — si la cuenta cambia de forma entre una y otra, se revisa dos veces.
    +PAPEL_ABRE(mode==='sig'?'TU SIGNATURE · NO ES BOLETA':'TU BUILD · NO ES BOLETA')
    +rows.map(function(r){
      // El importe de una línea solo aparece cuando esa línea CUESTA algo. Poner "S/0"
      // en el pan y el queso llenaría el papel de ceros y escondería lo que sí se cobra.
      return reciboLinea(r.k,(r.p?SOLES+pz(r.p)+' · ':'')+'<span style="font-weight:400">'+r.v+'</span>');
    }).join('')
    // ⚠ EL ENVÍO FALTABA EN ESTE RECIBO, Y EL TOTAL SÍ LO INCLUÍA (corregido 2026-09-12).
    // En pago rápido `t` es payableTotal(), o sea cartFinalTotal()+deliveryFeeAmount(): el
    // papel mostraba «Signature S/20.90 · Tamaño 15CM · TOTAL S/28.90» y esos S/8 no salían
    // de ninguna línea. Un 38% de más sin una sola palabra que lo explique, en la primera
    // pantalla donde el cliente ve un precio.
    //
    // Es EXACTAMENTE el defecto que el comentario de `var t` de arriba dice haber arreglado
    // —«un total sin una sola línea que lo explique... la cuenta no se puede seguir»— pero
    // solo se arregló para el sándwich. Y el recibo del CARRITO sí trae su línea de Envío,
    // así que los dos papeles que el cliente ve seguidos armaban el total de forma distinta:
    // justo lo que el comentario de PAPEL_ABRE dice que no puede pasar.
    //
    // Se usa el MISMO texto y el mismo criterio que el recibo del carrito (ver reciboCarrito
    // en 05-*), incluido el «se calcula con tu dirección» en mudo cuando todavía no hay
    // dirección: sin esa línea, el cliente no sabe si el envío ya está contado o falta sumarlo.
    +(quickPayEligible
      ? (deliveryFeeAmount()>0
          ? reciboLinea(deliveryKmNow()!==null?'Envío · '+deliveryKmNow()+' km':'Envío · estimado por zona',SOLES+pz(deliveryFeeAmount()))
          : reciboLinea('Envío','se calcula con tu dirección','mudo'))
      :'')
    +PAPEL_TOTAL('TOTAL',t)
    +(sizeUpsellDelta>0?'<div onclick="size=\'30\';'+(quickPayEligible?'cart[0]=currentBuiltItem();confirmRerender()':'render()')+'" style="background:'+'var(--sw-card2,#171A14)'+';border:1px solid rgba(203,162,88,.3);border-radius:10px;padding:14px 16px;margin-bottom:12px;cursor:pointer;box-shadow:'+SHADOW_SM+'"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:8px">¿Con más hambre? //</div><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">Sube a 30CM</div><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">El doble de sándwich por un poco más</div></div><span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:15px;color:'+GOLD+'">+'+SOLES+pz(sizeUpsellDelta)+'</span></div></div>':'')
    +(recU?'<div style="background:var(--sw-card2,#171A14);border:1px solid rgba(203,162,88,.3);border-radius:10px;padding:14px 16px;margin-bottom:12px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">¿Algo más? //</div>'+uBtn(recU.k,recU.e,recU.l,recU.d,recU.p,uSel(recU.k))+'</div>':'')
    +'<details style="margin-bottom:12px"><summary style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;cursor:pointer;list-style:none;padding:8px 0">Todos los extras // ▾</summary><div style="margin-top:8px">'+(dbl?uBtn('doubleProt',icon('dumbbell',18,GOLD),'Doble proteína','El doble de tu proteína elegida'+dblStockWarn(dbl.id),dblFee(dbl,size),doubleProt):'')+(sauceExtraAllowed?uBtn('sauce',icon('chili',18,GOLD),'Salsa extra','Salsa adicional a tu elección',EXTRA_SAUCE_PRICE,extraSauce):'')+(cheeseSigAllowed?uBtn('cheese',icon('queso',18,GOLD),'Queso','Cheddar derretido, opcional y gratis',0,!!cheese):'')+'</div></details>'
    +(cust?'<div style="margin-top:16px;background:var(--sw-card2,#171A14);border:1px solid var(--sw-border,#2C3228);border-radius:10px;padding:14px 16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:8px;display:flex;align-items:center;gap:5px">'+icon('estrella',11,GOLD)+'<span>Guardar como favorito //</span></div><div style="display:flex;gap:8px"><input id="o-favname" type="text" maxlength="40" placeholder="Nombre // opcional" style="flex:1;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:8px;padding:10px 12px;color:var(--sw-text,#FFFFFF);font-size:13px"><button onclick="doSaveFavorite()" style="all:unset;cursor:pointer;background:'+GOLD+';color:var(--sw-on-gold,#241a08);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;padding:10px 16px;border-radius:8px">Guardar</button></div><div id="fav-msg" style="font-family:\'EB Garamond\',serif;font-size:11px;color:'+GOLD+';margin-top:6px">'+favMsg+'</div></div>':'')
    +(quickPayEligible
        ?checkoutExtrasHTML()+'<div onclick="goToCartFromConfirm()" style="margin-top:16px;text-align:center;background:var(--sw-card2,#171A14);border:1px solid var(--sw-border,#2C3228);border-radius:8px;padding:12px;cursor:pointer"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#FFFFFF)">+ Carrito</div><div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#9DA096);margin-top:2px">por si deseas pedir más de un SND//WCH</div></div>'
        :'<div id="o-err" style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-danger-strong,#ff5555);margin-top:8px;min-height:16px"></div>')
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

// Miniatura de una bebida. Con foto es una foto; sin foto vuelve al ícono de línea que
// había antes. El respaldo no es decorativo: una bebida nueva publicada desde el panel no
// tiene archivo en `img/`, y devolver un hueco dejaría la fila descuadrada.
function sideThumbHTML(d){
  if(DRINK_IMG[d.id])return'<img src="'+DRINK_IMG[d.id]+'" alt="'+esc(d.l+' '+d.s)+'" style="flex-shrink:0;width:48px;height:48px;object-fit:cover;border-radius:8px" loading="lazy">';
  return'<div style="flex-shrink:0;width:36px;height:36px;border-radius:50%;background:rgba(203,162,88,.12);display:flex;align-items:center;justify-content:center">'+icon(d.icon,17,GOLD)+'</div>';
}

// Una bebida se pinta igual en la pestaña BEBIDAS del menú y en la pantalla BEBIDAS Y
// SIDES. Estaba escrita solo dentro de sOSides; al abrir el segundo punto de compra
// (2026-09-09) se extrajo en vez de copiarse — dos plantillas para el mismo ítem
// terminan en que una se queda con el precio o la foto viejos y nadie se entera.
function drinkRowHTML(d){
    var inCart=cart.find(function(it){return it.type==='side'&&it.code===d.id;});
    var qty=inCart?inCart.qty:0;
    return'<div style="background:var(--sw-card2,#171A14);border:1px solid var(--sw-border,#2C3228);border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px"><div style="display:flex;align-items:flex-start;gap:12px;flex:1">'+sideThumbHTML(d)+'<div style="flex:1"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+d.l+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+d.s+'</div>'+(d.d?'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:3px;line-height:1.4">'+esc(d.d)+'</div>':'')+'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:'+GOLD+';margin-top:4px">'+SOLES+pz(d.p)+'</div></div></div>'+(qty>0?'<div style="display:flex;align-items:center;gap:10px"><button onclick="sideQtyChange(\''+d.id+'\',-1)" style="all:unset;cursor:pointer;width:34px;height:34px;background:var(--sw-card,#2D5246);border-radius:8px;text-align:center;color:var(--sw-text,#FFFFFF);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600">−</button><span class="bump" style="display:inline-block;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);min-width:14px;text-align:center">'+qty+'</span><button onclick="sideQtyChange(\''+d.id+'\',1)" style="all:unset;cursor:pointer;width:34px;height:34px;background:var(--sw-card,#2D5246);border-radius:8px;text-align:center;color:var(--sw-text,#FFFFFF);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600">+</button></div>':'<button onclick="addSideToCart(\''+d.id+'\')" style="all:unset;cursor:pointer;background:'+GOLD+';color:var(--sw-on-gold,#241a08);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;padding:9px 16px;border-radius:8px">Agregar</button>')+'</div>';
}

// SIDES/BEBIDAS
function sOSides(){
  var h=H('BEBIDAS Y SIDES',"sndScreen='o_cart';render()",true)+'<div style="flex:1;padding:20px 20px 140px;overflow-y:auto" class="fi">'+ST('01','Elige','Se agregan a tu carrito.');
  h+=SIDES.map(drinkRowHTML).join('');
  h+='</div>'+AB(null,true,null,"sndScreen='o_cart';render()",'Ver carrito //');
  return h;
}
