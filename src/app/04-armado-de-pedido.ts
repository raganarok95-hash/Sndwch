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
// ══ ARMA EL TUYO — escrito de cero el 2026-09-17 ═══════════════════════════════════════
//
// POR QUÉ SE TIRÓ LO ANTERIOR. El dueño entró por el lado de WICHO y encontró: una lista de
// cinco filas con borde («1 PAN · 2 PROTEÍNA · …») ocupando 200px arriba, un rótulo que
// decía literalmente «00 // Tamaño», dos rectángulos grises para el tamaño, otro título, dos
// rectángulos grises más, y una barra abajo con «← Atrás / Siguiente →». O sea: cabecera,
// lista de cajas con borde, barra fija. La anatomía exacta de la app anterior con otra
// paleta. Y eso pasó aunque esta pantalla ya se había «rehecho» dos veces.
//
// LA CAUSA NO ERA ESTA PANTALLA, ERA EL VOCABULARIO. Mientras una tarjeta sea «rectángulo
// redondeado con borde, título y subtítulo», da igual cuántas veces se reescriba el archivo:
// vuelve a salir lo mismo, porque es el único ladrillo disponible. Así que acá NO se usan
// H(), ST(), AB() ni CAB(): las piezas de abajo nacen con esta pantalla.
//
// LAS TRES DECISIONES DE DISEÑO
//
// 1. UNA PREGUNTA POR PANTALLA. La lista de cinco pasos desaparece. Dónde estás lo dice una
//    línea de 3px arriba, no 200px de filas. Lo que se recupera es la pantalla entera para
//    lo único que importa ahí: elegir.
//
// 2. CADA PASO SE VE DISTINTO PORQUE CADA PASO ES DISTINTO. Antes los cinco eran la misma
//    lista con otro contenido, que es justamente lo que hacía que todo se viera igual.
//    Tamaño y pan son UNA comparación entre dos → dos mitades, como la puerta. La proteína
//    es lo que de verdad decide el sándwich y es el único paso con fotos reales → la foto
//    manda. Queso es una elección chica y gratis → chica. Vegetales y salsas es apilar
//    cosas → se apilan, y se ven llenarse.
//
// 3. SE VE LO QUE ESTÁS HACIENDO. Era lo único que faltaba en todas las versiones: cinco
//    decisiones y recién al final te enterabas de qué armaste. En un mostrador lo ves
//    hacerse delante tuyo; ese es medio atractivo del formato. No tenemos ilustración por
//    capas, así que el sándwich se escribe: una línea que crece con cada paso, abajo, junto
//    al precio, que también se mueve. El precio a la vista desde el primer paso es además
//    la defensa contra el costo sorpresa al final, que es el 39% del abandono.

var BYO_STEP_LABELS=['TAMAÑO','PAN','PROTEÍNA','QUESO','VEGETALES','SALSAS'];
// ⚠ Este array es el ORDEN REAL de los pasos, no una lista de nombres bonitos. Si cambia lo
// que pinta cada paso sin cambiar esto, la línea de arriba anuncia un paso y la pantalla
// muestra otro — pasó, y duró doce días. Lo vigila tests/armador-riel.spec.ts.
var BYO_ULTIMO=BYO_STEP_LABELS.length-1;
function byoStepCanContinue(){
  if(byoStep===0)return!!size;
  if(byoStep===1)return!!base;
  if(byoStep===2)return!!prot;
  return true;
}
function byoStepHint(){
  if(byoStep===0)return'Elige un tamaño';
  if(byoStep===1)return'Elige un pan';
  if(byoStep===2)return'Elige una proteína';
  return'';
}
function byoStepBack(){
  if(byoStep>0){byoStep--;render();}else volverALaPuerta();
}
function byoStepNext(){
  if(!byoStepCanContinue())return;
  if(byoStep<BYO_ULTIMO){byoStep++;render();}else enterConfirm();
}
// Saltar a un paso ya visitado. Sin esto, corregir el pan elegido tres pasos atrás obliga a
// retroceder de a uno; con la lista vieja al menos se veía todo junto, así que quitarla sin
// dar esta salida habría sido perder algo real.
function byoIrAPaso(i){
  if(i<0||i>byoStep)return;
  byoStep=i;render();
}

// ── LA LÍNEA DE PASOS ──────────────────────────────────────────────────────────────────
// Seis segmentos de 3px pegados al borde de arriba. Lleno = hecho, a medio tono = donde
// estás, apagado = falta. Es tocable en lo ya hecho: cada segmento es el atajo a su paso.
function BYO_LINEA(){
  var segs='';
  for(var i=0;i<BYO_STEP_LABELS.length;i++){
    var hecho=i<byoStep,aqui=i===byoStep;
    segs+='<button type="button"'+(i<=byoStep?' onclick="byoIrAPaso('+i+')"':' disabled')
      +' aria-label="'+esc(BYO_STEP_LABELS[i])+(hecho?' (hecho)':aqui?' (aquí)':' (falta)')+'"'
      +' style="all:unset;'+(i<=byoStep?'cursor:pointer;':'')+'flex:1;height:3px;border-radius:999px;'
      +'background:'+(hecho?ACC():aqui?'rgba(140,200,236,.55)':'var(--sw-border,#1F3243)')+'"></button>';
  }
  return'<div style="display:flex;gap:3px;padding:0 18px">'+segs+'</div>';
}

// ── LA CABECERA DEL PASO ───────────────────────────────────────────────────────────────
// Volver, en qué paso vas, y el carrito si hay algo. Sin logotipo: dentro del armador ya
// sabes dónde estás, y repetir la marca en cada paso es lo que hacía la app anterior.
function BYO_CABEZA(){
  return'<div style="position:sticky;top:0;z-index:20;background:var(--sw-bg,#0B1724);padding-top:10px">'
    +BYO_LINEA()
    +'<div style="display:flex;align-items:center;gap:6px;height:46px;padding:0 8px">'
    +'<button type="button" onclick="byoStepBack()" aria-label="Volver" style="all:unset;cursor:pointer;'
    +'width:44px;height:44px;display:flex;align-items:center;justify-content:center;'
    +'color:var(--sw-text-muted,#9DA096);font-size:22px">&#8592;</button>'
    +'<div style="flex:1;min-width:0;text-align:center;font-family:\'EB Garamond\',serif;font-weight:600;'
    +'font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:'+ACC()+'">'
    +esc(BYO_STEP_LABELS[byoStep])+'<span style="color:var(--sw-text-muted,#9DA096);margin-left:9px">'
    +(byoStep+1)+'/'+BYO_STEP_LABELS.length+'</span></div>'
    +(cart.length?RIEL_CARRITO():'<div style="width:44px"></div>')
    +'</div></div>';
}

// ── LA PREGUNTA ────────────────────────────────────────────────────────────────────────
// Lo primero que se lee. Va en pregunta y no en sustantivo («¿Qué proteína?» y no
// «PROTEÍNA») porque el cliente está respondiendo, no leyendo un índice.
function BYO_PREGUNTA(q,ayuda){
  return'<div style="padding:22px 18px 16px">'
    +'<h2 style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:28px;font-weight:640;'
    +'color:var(--sw-text,#fff);line-height:1.05;letter-spacing:.01em;text-wrap:balance">'+q+'</h2>'
    +(ayuda?'<p style="font-family:\'EB Garamond\',serif;font-size:13px;line-height:1.5;'
      +'color:var(--sw-text-muted,#9DA096);margin-top:7px;max-width:34ch">'+ayuda+'</p>':'')
    +'</div>';
}

// ── DOS MITADES ────────────────────────────────────────────────────────────────────────
// Para tamaño y pan: dos opciones y la decisión es una comparación. Una lista vertical
// obliga a leer una, bajar, leer la otra y acordarse de la primera; lado a lado se comparan
// de un vistazo. Eco deliberado de la puerta: ahí también eliges entre dos mitades.
function BYO_MITADES(ops){
  return'<div style="display:flex;gap:8px;padding:0 18px 18px;align-items:stretch">'+ops.map(function(o){
    var sel=o.sel;
    return'<button type="button" aria-pressed="'+(sel?'true':'false')+'" onclick="'+o.fn+'" '
      +'style="all:unset;box-sizing:border-box;cursor:pointer;flex:1;min-width:0;display:flex;'
      +'flex-direction:column;justify-content:flex-end;min-height:168px;padding:16px;border-radius:12px;'
      +'background:'+(sel?'rgba(140,200,236,.13)':'var(--sw-card2,#0F1D29)')+';'
      +'box-shadow:inset 0 0 0 '+(sel?'2px '+ACC():'1px var(--sw-border,#1F3243)')+'">'
      +(o.fig?'<div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:0">'+o.fig+'</div>':'')
      +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:28px;font-weight:640;'
      +'color:var(--sw-text,#fff);line-height:1">'+esc(o.t)+'</div>'
      +(o.s?'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;letter-spacing:.2em;'
        +'text-transform:uppercase;color:'+(sel?ACC():'var(--sw-text-muted,#9DA096)')+';margin-top:5px">'+esc(o.s)+'</div>':'')
      +(o.d?'<p style="font-family:\'EB Garamond\',serif;font-size:11px;line-height:1.5;'
        +'color:var(--sw-text-muted,#9DA096);margin-top:9px">'+esc(o.d)+'</p>':'')
      +(o.extra?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:'+GOLD+';'
        +'margin-top:9px">'+o.extra+'</div>':'')
      +'</button>';
  }).join('')+'</div>';
}

// ── UNA PROTEÍNA ───────────────────────────────────────────────────────────────────────
// El único paso con fotos reales (las 6 .webp cuadradas), y el que de verdad decide el
// sándwich. La foto ocupa un tercio del ancho y toca los bordes de la fila: es el argumento,
// no una miniatura decorativa de 48px al lado de un texto.
function BYO_PROTEINA(pr){
  var av=isAvail(pr.id),sel=prot===pr.id;
  var img=PROT_IMG[pr.id];
  var precio=size==='30'?pr.p30:pr.p15;
  return'<button type="button" aria-pressed="'+(sel?'true':'false')+'" '
    +(av?'onclick="prot=\''+pr.id+'\';if(doubleProt&&'+(pr.noDouble?'true':'false')+')doubleProt=false;render()"':'disabled')
    +' aria-label="'+esc(pr.l+' '+pr.s)+'" style="all:unset;box-sizing:border-box;'+(av?'cursor:pointer;':'opacity:.45;')
    +'display:flex;align-items:stretch;width:100%;min-height:104px;overflow:hidden;border-radius:12px;'
    +'background:'+(sel?'rgba(140,200,236,.13)':'var(--sw-card2,#0F1D29)')+';'
    +'box-shadow:inset 0 0 0 '+(sel?'2px '+ACC():'1px var(--sw-border,#1F3243)')+'">'
    +(img?'<img src="'+img+'" alt="" aria-hidden="true" loading="lazy" style="width:104px;height:auto;min-height:104px;'
      +'object-fit:cover;flex:0 0 auto'+(av?'':';filter:grayscale(1)')+'">':'')
    +'<span style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;padding:13px 15px">'
    +'<span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:640;'
    +'color:var(--sw-text,#fff);line-height:1.1">'+esc(pr.l)
    +'<span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;letter-spacing:.18em;'
    +'text-transform:uppercase;color:var(--sw-text-muted,#9DA096);margin-left:8px">'+esc(pr.s)+'</span></span>'
    +'<span style="font-family:\'EB Garamond\',serif;font-size:11px;line-height:1.45;'
    +'color:var(--sw-text-muted,#9DA096);margin-top:5px">'+esc(av?pr.d:'Agotada hoy')+'</span>'
    +'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:'+GOLD+';margin-top:7px">'
    +SOLES+pz(precio)+'</span>'
    +'</span></button>';
}

// ── UNA COSA QUE SE APILA ──────────────────────────────────────────────────────────────
// Vegetales y salsas: no son una lista donde eliges uno, son cosas que se van poniendo
// encima. Por eso se llenan de color al tocarlas en vez de encender una casilla al costado,
// y por eso fluyen en vez de ir una debajo de otra: lo que importa es CUÁNTO llevas puesto,
// y eso se ve de un vistazo con las piezas llenas contra las vacías.
function BYO_PIEZA(o){
  var sel=o.sel;
  return'<button type="button" aria-pressed="'+(sel?'true':'false')+'"'+(o.off?' disabled':' onclick="'+o.fn+'"')
    +' style="all:unset;box-sizing:border-box;'+(o.off?'opacity:.4;':'cursor:pointer;')
    +'display:inline-flex;flex-direction:column;gap:2px;padding:11px 15px;border-radius:999px;'
    +'background:'+(sel?ACC():'var(--sw-card2,#0F1D29)')+';'
    +'box-shadow:inset 0 0 0 1px '+(sel?ACC():'var(--sw-border,#1F3243)')+'">'
    +'<span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:640;'
    +'color:'+(sel?ACC_INK():'var(--sw-text,#fff)')+';line-height:1.1">'+esc(o.t)+'</span>'
    +(o.s?'<span style="font-family:\'EB Garamond\',serif;font-size:9px;letter-spacing:.06em;'
      +'color:'+(sel?'rgba(14,26,23,.72)':'var(--sw-text-muted,#9DA096)')+'">'+esc(o.s)+'</span>':'')
    +'</button>';
}

// ── EL SÁNDWICH QUE LLEVAS ─────────────────────────────────────────────────────────────
// Lo que estás armando, escrito. Crece con cada paso. No es un resumen para el final: es lo
// que reemplaza a ver el sándwich hacerse delante tuyo. Cada parte es tocable y te devuelve
// a su paso, así que además es la navegación que se perdió al quitar la lista de cinco filas.
function BYO_LOQUELLEVAS(){
  var partes=[];
  if(size)partes.push({i:0,t:size==='30'?'30CM':'15CM'});
  if(base){var b=BASES.find(function(x){return x.id===base;});if(b)partes.push({i:1,t:b.l});}
  if(prot){var pr=PROTS.find(function(x){return x.id===prot;});if(pr)partes.push({i:2,t:pr.l+(doubleProt?' doble':'')});}
  if(cheese){var c=CHEESE.find(function(x){return x.id===cheese;});if(c)partes.push({i:3,t:c.l});}
  if(tops.length)partes.push({i:4,t:tops.length+(tops.length===1?' vegetal':' vegetales')});
  if(sauces.length)partes.push({i:5,t:sauces.length+(sauces.length===1?' salsa':' salsas')});
  if(!partes.length)return'';
  return'<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:0 4px;min-width:0">'
    +partes.map(function(x,k){
      return(k?'<span style="color:var(--sw-text-muted,#9DA096);font-size:11px">·</span>':'')
        +'<button type="button" onclick="byoIrAPaso('+x.i+')" style="all:unset;cursor:pointer;'
        +'font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:var(--sw-text-muted4,#C6C9BE)">'
        +esc(x.t)+'</button>';
    }).join('')+'</div>';
}

// ── EL PIE ─────────────────────────────────────────────────────────────────────────────
// Precio + lo que llevas + una sola acción. El precio se mueve desde el primer paso, que es
// la única forma de que no aparezca una sorpresa al final — el costo inesperado al final del
// embudo es el 39% del abandono en delivery, y es la palanca de conversión más barata que
// tenemos. No hay botón de «Atrás» acá: volver es la flecha de arriba a la izquierda, igual
// que en todas las demás pantallas. Tener dos sitios para lo mismo era de la app anterior.
function BYO_PIE(){
  var listo=byoStepCanContinue();
  var precio=(size&&prot)?itemUnitPrice(currentBuiltItem()):0;
  var etiqueta=byoStep<BYO_ULTIMO?'Siguiente':'Listo';
  return'<div class="sw-barra" style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;'
    +'max-width:480px;background:rgba(6,12,18,.97);border-top:1px solid var(--sw-border-soft,#111F2B);'
    +'padding:12px 18px calc(12px + env(safe-area-inset-bottom,0px));z-index:90;'
    +'display:flex;align-items:center;gap:14px">'
    +'<div style="flex:1;min-width:0">'
    +(precio>0?'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;'
      +'font-weight:640;color:'+GOLD+';line-height:1">'+SOLES+pz(precio)+'</div>':'')
    +BYO_LOQUELLEVAS()
    +'</div>'
    +'<button type="button"'+(listo?' onclick="byoStepNext()"':' disabled')+' style="all:unset;box-sizing:border-box;'
    // Deshabilitado se distingue por la FORMA —solo borde, sin relleno de color—, no apagando
    // el texto: ese texto es la instrucción («Elige un tamaño») y con opacidad .4 quedaba en
    // 2.13:1 de contraste (mínimo 4.5:1). Lo vio tests/contraste.spec.ts el 2026-09-24.
    +(listo?'cursor:pointer;':'cursor:default;')+'flex:0 0 auto;background:'+(listo?ACC():'transparent')+';'
    +'color:'+(listo?ACC_INK():'var(--sw-text-muted,#9DA096)')+';'
    +(listo?'':'box-shadow:inset 0 0 0 1px var(--sw-border,#1F3243);')
    +'border-radius:999px;padding:14px 26px;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;'
    +'font-size:15px;font-weight:640;letter-spacing:.03em">'+(listo?etiqueta:byoStepHint())+'</button>'
    +'</div>';
}

// Desde cuánto sale un sándwich de este tamaño. Se calcula sobre las proteínas que HOY se
// pueden elegir, no sobre un número escrito: decir "desde S/13.90" cuando la proteína barata
// se agotó o el dueño la repreció es una promesa rota, y de las que no avisan.
function byoDesde(sz){
  var ps=PROTS.filter(function(x){return!x.vaultOnly&&!x.sigOnly&&isAvail(x.id);})
              .map(function(x){return sz==='30'?x.p30:x.p15;});
  return ps.length?Math.min.apply(null,ps):0;
}

// ══ LA PANTALLA ════════════════════════════════════════════════════════════════════════
function sOBuild(){
  var cuerpo='';

  if(byoStep===0){
    // TAMAÑO. Va primero y solo, como en cualquier mostrador: es lo que cambia el precio de
    // todo lo que viene después, así que preguntarlo al final sería mover el piso.
    //
    // ⚠ Y VA APILADO, NO EN DOS COLUMNAS. Lo que se compara acá es un LARGO, y dos columnas
    // no pueden mostrar una proporción: cada barra queda medida contra su propia columna, no
    // contra la otra. Apiladas comparten el mismo ancho, así que la de 30CM se ve el doble
    // de la de 15CM porque lo es. Es la única forma de que el dibujo diga la verdad.
    cuerpo=BYO_PREGUNTA('¿De qué tamaño?','Es lo primero porque cambia el precio de todo lo demás.')
      +'<div style="display:flex;flex-direction:column;gap:10px;padding:0 18px">'
      // ⚠ Ni una palabra sobre cuánta gente. Ver la nota en SZTOG (02-*): el tamaño se describe
      // por lo que ES —pan y relleno—, nunca por cuántos deberían comérselo.
      +[{sz:'15',t:'15CM',s:'El de siempre',d:'Un sándwich completo.',w:'50%'},
        {sz:'30',t:'30CM',s:'El doble de todo',d:'El doble de pan y el doble de relleno.',w:'100%'}].map(function(o){
        var sel=size===o.sz;
        return'<button type="button" aria-pressed="'+(sel?'true':'false')+'" onclick="size=\''+o.sz+'\';render()" '
          +'style="all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;padding:18px;'
          +'border-radius:12px;background:'+(sel?'rgba(140,200,236,.13)':'var(--sw-card2,#0F1D29)')+';'
          +'box-shadow:inset 0 0 0 '+(sel?'2px '+ACC():'1px var(--sw-border,#1F3243)')+'">'
          // La barra ES el sándwich a escala. Va arriba del nombre porque es lo primero que
          // resuelve la pregunta: se entiende sin leer una palabra.
          +'<div style="height:26px;width:'+o.w+';border-radius:999px;margin-bottom:15px;'
          +'background:'+(sel?ACC():'var(--sw-border,#1F3243)')+';'
          +'box-shadow:inset 0 -7px 0 rgba(0,0,0,.2)"></div>'
          +'<div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px">'
          +'<span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:28px;'
          +'font-weight:640;color:var(--sw-text,#fff);line-height:1">'+o.t+'</span>'
          +'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:15px;color:'+GOLD+'">'
          +'desde '+SOLES+pz(byoDesde(o.sz))+'</span></div>'
          +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;letter-spacing:.2em;'
          +'text-transform:uppercase;color:'+(sel?ACC():'var(--sw-text-muted,#9DA096)')+';margin-top:6px">'
          +o.s+'</div>'
          +'<p style="font-family:\'EB Garamond\',serif;font-size:11px;line-height:1.5;'
          +'color:var(--sw-text-muted,#9DA096);margin-top:5px">'+o.d+'</p>'
          +'</button>';
      }).join('')+'</div>';

  }else if(byoStep===1){
    // PAN. Dos opciones otra vez, y el recargo de la focaccia ARRIBA, antes de elegir: dejó
    // de ser gratis el 2026-09-03 y un precio que aparece recién en el carrito es
    // exactamente la sorpresa que hace abandonar.
    cuerpo=BYO_PREGUNTA('¿Sobre qué pan?','Los dos se hornean acá.')
      +BYO_MITADES(BASES.map(function(b){
        // ⚠ El recargo se PREGUNTA, no se escribe. `BASE_SURCHARGE` es un objeto por pan con
        // un precio por tamaño, no un número: la primera versión de esta línea lo trataba
        // como número y habría pintado "[object Object]" al lado del pan — sin romper nada,
        // sin que el typecheck dijera una palabra. Y va por `baseSurcharge()`, que es el
        // mismo camino que usa el cobro, para que no puedan decir cosas distintas.
        var rec=baseSurcharge(b.id,size||'15');
        return{t:b.l,s:b.s,d:b.d,sel:base===b.id,fn:"base='"+b.id+"';render()",
               extra:rec>0?'+'+SOLES+pz(rec):'Sin recargo'};
      }));

  }else if(byoStep===2){
    // PROTEÍNA. El paso con foto. Y el doble se ofrece DESPUÉS de elegir, no antes: ofrecer
    // «doble» sin saber doble de qué es una pregunta sin sentido.
    var dispo=PROTS.filter(function(x){return!x.vaultOnly&&!x.sigOnly;});
    var elegida=PROTS.find(function(x){return x.id===prot;});
    var puedeDoble=elegida&&!(size==='30'?elegida.noDouble30:elegida.noDouble);
    var recargoDbl=elegida?(size==='30'?elegida.pDbl30:elegida.pDbl):0;
    cuerpo=BYO_PREGUNTA('¿Qué va adentro?','Lo que elijas acá es el sándwich. Todo lo demás lo acompaña.')
      +'<div style="display:flex;flex-direction:column;gap:9px;padding:0 18px">'
      +dispo.map(BYO_PROTEINA).join('')+'</div>'
      +(puedeDoble
        ?'<div style="padding:18px 18px 0">'
         +BYO_PIEZA({t:'Doble de '+elegida.l,s:'+'+SOLES_TXT+pz(recargoDbl),sel:doubleProt,
                     fn:"doubleProt=!doubleProt;render()"})
         +'</div>':'');

  }else if(byoStep===3){
    // QUESO. Chico porque la decisión es chica: son tres, no cuestan, y «sin queso» es una
    // respuesta legítima que tiene que estar a la vista y no escondida en un «saltar».
    cuerpo=BYO_PREGUNTA('¿Con queso?','Va incluido, no cuesta nada.')
      +'<div style="display:flex;flex-wrap:wrap;gap:8px;padding:0 18px">'
      +CHEESE.map(function(c){
        return BYO_PIEZA({t:c.l,s:c.d,sel:cheese===c.id,fn:"cheese=cheese==='"+c.id+"'?null:'"+c.id+"';render()"});
      }).join('')
      +BYO_PIEZA({t:'Sin queso',sel:cheese===null&&byoStep>=3,fn:"cheese=null;render()"})
      +'</div>';

  }else if(byoStep===4){
    // VEGETALES. Sin límite y sin costo, así que la pregunta no es «cuáles puedes» sino
    // «cuáles quieres». «Todos» es un atajo real: mucha gente los quiere todos y hacerle
    // tocar siete veces es trabajo inventado.
    var veg=TOPS.filter(function(x){return!x.vaultOnly&&!x.sigOnly;});
    var ids=veg.filter(function(x){return isAvail(x.id);}).map(function(x){return x.id;});
    var todos=ids.length>0&&ids.every(function(id){return tops.indexOf(id)>=0;});
    cuerpo=BYO_PREGUNTA('¿Qué le pones encima?','Todos los que quieras, y ninguno cuesta.')
      +'<div style="display:flex;flex-wrap:wrap;gap:8px;padding:0 18px">'
      +BYO_PIEZA({t:todos?'Ninguno':'Todos',s:todos?'empezar de cero':'los '+ids.length,sel:todos,
                  fn:"tops="+(todos?'[]':'['+ids.map(function(id){return"'"+id+"'";}).join(',')+']')+";render()"})
      +veg.map(function(t){
        var av=isAvail(t.id);
        return BYO_PIEZA({t:t.l,s:av?t.s:'agotado',off:!av,sel:tops.indexOf(t.id)>=0,
          fn:"var i=tops.indexOf('"+t.id+"');if(i>=0)tops.splice(i,1);else tops.push('"+t.id+"');render()"});
      }).join('')
      +'</div>';

  }else{
    // SALSAS. Es el único paso con un tope real: van hasta MAX_SAUCES_BYO incluidas y no se
    // puede elegir una cuarta distinta. Aparte existe una porción EXTRA de la última que
    // elegiste, que sí se cobra — son dos cosas distintas y la pantalla tiene que decirlo,
    // porque confundirlas es prometer una salsa gratis que el servidor va a cobrar.
    var sal=SAUCES.filter(function(x){return!x.vaultOnly&&!x.sigOnly;});
    var n=sauces.length;
    var lleno=n>=MAX_SAUCES_BYO;
    cuerpo=BYO_PREGUNTA('¿Y de salsa?','Hasta '+MAX_SAUCES_BYO+' incluidas. Llevas '+n+'.')
      +'<div style="display:flex;flex-wrap:wrap;gap:8px;padding:0 18px">'
      +sal.map(function(x){
        var av=isAvail(x.id),sel=sauces.indexOf(x.id)>=0;
        // Al llegar al tope las no elegidas se apagan en vez de desaparecer: una salsa que
        // se esfuma de la lista parece un error de la app, apagada se lee como "ya elegiste
        // las tuyas". Y las elegidas siguen tocables, para poder cambiar de opinión.
        return BYO_PIEZA({t:x.l,s:av?(x.spicy?'pica · '+x.s:x.s):'agotada',off:!av||(lleno&&!sel),sel:sel,
          fn:"byoToggleSalsa('"+x.id+"')"});
      }).join('')
      +'</div>'
      // La porción extra solo tiene sentido cuando ya hay una salsa que duplicar — el
      // servidor rechaza el pedido si no la hay, así que ofrecerla antes sería ofrecer algo
      // que va a fallar al pagar.
      +(n?'<div style="padding:20px 18px 0">'
        +BYO_PIEZA({t:'Doble de la última',s:'+'+SOLES_TXT+pz(EXTRA_SAUCE_PRICE),sel:extraSauce,
                    fn:"extraSauce=!extraSauce;render()"})
        +'</div>':'');
  }

  // ⚠ EL PASO OCUPA LA PANTALLA, NO SE AMONTONA ARRIBA. La primera versión dejaba 350px de
  // vacío debajo de las opciones en cuatro de los seis pasos: la pregunta y las piezas
  // pegadas al techo y el resto negro. Eso no es minimalismo, es una pantalla a medio
  // pintar. Los pasos de dos mitades ESTIRAN (son paneles, y a alto completo repiten la
  // puerta, que es de donde vienes); los de piezas se CENTRAN en el espacio que queda; el de
  // proteína no hace ninguna de las dos porque su lista ya llena y tiene que poder rodar.
  // Solo el paso del TAMAÑO estira a alto completo, porque ahí los paneles llevan la figura
  // del pan y el alto es parte de lo que se compara. El del PAN no: sin figura, estirado
  // queda una caja vacía con el texto al pie, que es peor que una caja del tamaño de su
  // contenido. El de PROTEÍNA ni estira ni centra — su lista ya llena y tiene que rodar.
  // El paso se compone en el alto que tiene: la pregunta y las opciones centradas en el
  // espacio libre, no pegadas al techo con 350px de negro debajo. Estirar las cajas para
  // llenar fue el error opuesto y peor —una caja de 460px con una barra y cuatro líneas
  // adentro—: el vacío no se arregla inflando el contenido, se arregla componiéndolo.
  // Proteína es la excepción: su lista ya llena y tiene que poder rodar desde arriba.
  return'<div style="min-height:100dvh;display:flex;flex-direction:column;background:var(--sw-bg,#0B1724)">'
    +BYO_CABEZA()
    +'<div class="fi" style="flex:1;display:flex;flex-direction:column;justify-content:'
    +(byoStep===2?'flex-start':'center')+';padding-bottom:var(--sw-barra,124px)">'
    +cuerpo
    +'</div></div>'+BYO_PIE();
}

// Tocar una salsa. Vive acá y no dentro del onclick porque la regla —la cuarta se cobra— es
// una regla de dinero, y una regla de dinero escrita dentro de un atributo HTML no se puede
// leer, ni probar, ni encontrar el día que cambie.
// Cuántas salsas entran sin costo. Es un tope del CLIENTE, no del servidor: el servidor
// tasa las que le lleguen. Vive con un nombre y no como un `3` suelto porque aparece en la
// regla, en el texto de la pregunta y en el apagado de las piezas — tres sitios que se
// desincronizan a la primera si es un literal.
var MAX_SAUCES_BYO=3;
function byoToggleSalsa(id){
  var i=sauces.indexOf(id);
  if(i>=0){
    sauces.splice(i,1);
    // Sin salsas no puede haber porción extra: el servidor rechaza ese pedido con un error
    // y el cobro se caería DESPUÉS de pasar por Culqi.
    if(!sauces.length)extraSauce=false;
  }else if(sauces.length<MAX_SAUCES_BYO){
    sauces.push(id);
  }
  render();
}
// ── LA FICHA ─────────────────────────────────────────────────────────────────────────
// Para elegir entre cosas cuyo NOMBRE ya lo dice todo (quesos, vegetales). Una tarjeta con
// párrafo para "Tomate" no informa: ocupa. La ficha cabe 3 por fila, así que los 8
// vegetales entran en una pantalla en vez de dos y medio.
function FICHA(etiqueta,sel,fn){
  // Botón real, no un <div onclick>. El panel ya había tenido que corregir esto mismo en su
  // cajón de navegación: un div con onclick no se alcanza con teclado, no se anuncia como
  // control y no responde a Enter. Estas fichas son el ÚNICO modo de elegir vegetales y
  // queso, así que un cliente con teclado o lector de pantalla se quedaba sin el paso.
  // `aria-pressed` porque son interruptores, no enlaces: dicen si están puestas o no.
  return'<button type="button" aria-pressed="'+(sel?'true':'false')+'" onclick="'+fn+'" style="all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:5px;background:'+(sel?ACC():'var(--sw-card,#1B1F18)')+';border:1px solid '+(sel?ACC():'var(--sw-border,#2C3228)')+';border-radius:999px;padding:10px 16px;cursor:pointer;transition:all .15s;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:'+(sel?'var(--sw-on-gold,#241a08)':'var(--sw-text,#fff)')+'">'+etiqueta+'</button>';
}
function FICHA_OFF(etiqueta){
  return'<div style="display:inline-flex;align-items:center;background:var(--sw-card2,#171A14);border:1px solid var(--sw-border,#2C3228);border-radius:999px;padding:10px 16px;opacity:.35;font-family:\'Bodoni Moda\',serif;font-size:13px;font-weight:600;color:var(--sw-text-muted,#9DA096);text-decoration:line-through">'+etiqueta+'</div>';
}

// ORDER CONFIRM + SMART UPSELL
// PER-ITEM REVIEW — revisar un sándwich recién armado antes de agregarlo al carrito
function sOItemConfirm(){
  aplicarMetodoPreferido();
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

// La fila de bebida de la app anterior (drinkRowHTML) vivia aca: miniatura de 48px,
// nombre, precio y un boton Agregar — o sea el mismo componente que un item del carrito,
// para el producto de mejor margen del catalogo. Se fue entera con la pantalla nueva
// (sMundoBebidas en 03-*), donde cada bebida ocupa su propio panel con la foto a sangre.

// SIDES/BEBIDAS
// La pantalla vive entera en sMundoBebidas (03-*), junto a la carta de SANDO, porque las
// dos son mundos y comparten las mismas piezas. Acá solo queda el nombre que usa el router.
function sOSides(){ return sMundoBebidas(); }
