// HTML HELPERS
// Logotipo — un solo lugar para las 3 versiones que antes vivían duplicadas (header de
// cada pantalla, splash de carga, pantalla de pedido confirmado): mismo tracking ajustado
// en SND/WCH con el "//" con su propio respiro, y una sombra sutil solo en los tamaños
// grandes (hero) para que se sienta como un logotipo y no como texto de header reciclado.
function WORDMARK(size,hero?){
  return'<span style="font-family:\'Fraunces\',serif;font-optical-sizing:auto;font-size:'+size+'px;font-weight:620;color:var(--sw-text,#FFFFFF);letter-spacing:.02em;line-height:1">SND<span class="wm-mark" aria-hidden="true"><i></i><i></i></span>WCH</span>';
}
// ── LA CABECERA VIEJA AHORA ES EL RIEL (2026-09-17) ──────────────────────────────────
//
// H() era el sello de la app anterior en las ~25 pantallas que no se habian rehecho: 96px
// de alto que repetian el wordmark a 26-40px en CADA pantalla, con el sitio donde estabas
// escrito chiquito debajo. O sea que la pantalla mas grande de toda la app decia el nombre
// de la marca, que es el unico dato que el cliente ya sabe.
//
// No se reescribieron 25 pantallas a mano: se reescribio la PIEZA. Mismos parametros, misma
// llamada, y las 25 pasan a tener la anatomia nueva de una vez. Eso es justamente lo que
// distingue rehacer el sistema de repintar pantalla por pantalla — si esto viviera copiado
// en cada pantalla, cambiarlo seria 25 ediciones y la numero 26 volveria a inventarse otra.
//
// `sub` deja de ser un subtitulo bajo el logo y pasa a ser el centro del riel: DONDE estas.
// Cuando no hay `bk` (no hay a donde volver) la izquierda muestra el wordmark en chico, que
// es todo el espacio que la marca necesita dentro de la app.
// Cuántas cosas lleva el carrito, en UNIDADES (dos del mismo sándwich son 2). Una sola
// cuenta para los dos botones de carrito: hasta el 2026-09-23 el de la cabecera contaba
// unidades y el del riel del armador contaba LÍNEAS, así que con dos iguales uno decía 2 y
// el otro 1 — el mismo carrito con dos números distintos según la pantalla.
function unidadesEnCarrito(){return cart.reduce(function(a,it){return a+(it.qty||1);},0);}
function H(sub?,bk?,showCart?){
  var total=unidadesEnCarrito();
  var cartIcon=(showCart&&total)
    ?'<button onclick="go(\'o_cart\')" aria-label="Ver carrito ('+total+')" '
     +'style="all:unset;cursor:pointer;width:44px;height:44px;display:flex;align-items:center;'
     +'justify-content:center;font-family:\'EB Garamond\',serif;font-weight:600;font-size:13px;'
     +'color:'+ACC_INK()+';background:'+ACC()+';border-radius:999px">'+total+'</button>'
    :'';
  // El cajón de herramientas, para saltar de una pantalla del panel a otra sin volver a la
  // portada. El modo claro/oscuro vive en «Este celular» desde el 2026-10-07: se ajusta una vez.
  var toolsNav=(sndScreen.indexOf('admin')===0&&sndScreen!=='admin_home')
    ?'<button onclick="toggleAdminToolsDrawer()" title="Herramientas" aria-label="Abrir navegación de herramientas" '
     +'style="all:unset;cursor:pointer;width:40px;height:40px;display:inline-flex;align-items:center;'
     +'justify-content:center;flex-shrink:0">'+icon('grid',16)+'</button>':'';
  var der=cartIcon+toolsNav;
  // Las pestañas de una entrada del panel que junta varias pantallas (chipsDelGrupo, 09-*):
  // van acá para aparecer en todas las del grupo sin tocar cada pantalla.
  var chips=sndScreen.indexOf('admin')===0&&typeof (window as any).chipsDelGrupo==='function'?(window as any).chipsDelGrupo():'';
  return RIEL({volver:bk||'',titulo:sub||'',
               derecha:der?'<div style="display:flex;align-items:center;gap:2px">'+der+'</div>':''})+chips;
}
function NAV(){
  var oa=sndTab==='order';
  // Pestaña inactiva subida de #666 a #999 sobre este fondo casi negro (rgba(11,11,11,.97))
  // — #666 daba ~3.4:1, bajo el 4.5:1 mínimo AA para texto normal; esta barra fija aparece
  // en casi toda pantalla secundaria (auditoría UX/accesibilidad, P1). #999 da ~5.9:1.
  function nb(t,l,a){return'<button onclick="swTab(\''+t+'\')" style="all:unset;cursor:pointer;flex:1;padding:12px 0;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:15px;letter-spacing:.04em;color:'+(a?'#fff':'#999')+'">'+l+(a?' <span class="cut-sep" style="color:'+GOLD+'">//</span>':'')+'</div><div style="width:4px;height:4px;border-radius:50%;background:'+GOLD+';opacity:'+(a?1:0)+'"></div></button>';}
  // class="bottom-nav" para poder ocultarla desde CSS cuando se abre el teclado virtual:
  // medido a 320x330 (alto típico con teclado Android), esta barra caía justo encima del
  // campo de teléfono del checkout y tapaba el de nombre — el primer formulario que ve un
  // cliente nuevo. Ver el listener de visualViewport en INIT.
  return'<div class="bottom-nav sw-barra" style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(11,11,11,.97);border-top:1px solid var(--sw-border-soft,#1c1c1c);display:flex;padding-bottom:calc(0px + env(safe-area-inset-bottom,0px));z-index:100">'+nb('order','Pedido',oa)+nb('points','Puntos',!oa)+'</div>';
}
function legalLinksHTML(backTo){
  function lnk(label,screen,extra?){
    return'<button type="button" onclick="bkTo=\''+backTo+'\';sndScreen=\''+screen+'\';'+(extra||'')+'render()" style="all:unset;cursor:pointer;font-family:Archivo,sans-serif;font-weight:700;font-size:11px;color:inherit;text-decoration:underline;text-underline-offset:3px;padding:6px 0">'+label+' <span class="cut-sep" style="color:'+GOLD+'">//</span></button>';
  }
  // Color heredado del fondo donde se pinta (losa clara, kraft, lado WICHO): un gris fijo
  // pensado para fondo oscuro dejaba el Libro de Reclamaciones a 2:1 sobre la losa (2026-10-01).
  return'<div style="display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:14px;justify-content:center">'
    +lnk('Cambios y devoluciones','p_returns')
    +lnk('Libro de reclamaciones','p_complaints','cmplStep=\'form\';')
    +'</div>';
}
function AB(t,can?,bk?,nfn?,nl?,hint?){
  var bb=bk?'<button onclick="'+bk+'" style="all:unset;cursor:pointer;border:1px solid var(--sw-border,#2C3228);color:var(--sw-text-muted,#9DA096);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.1em;padding:12px 16px;border-radius:8px;flex-shrink:0">← Atrás</button>':'';
  // ⚠ pz() VA ACÁ DENTRO, no en quien llama. Estaba al revés y las CUATRO pantallas con
  // total —Signature, armador, confirmación y carrito— pintaban el número crudo: un
  // Signature de S/20.90 se anunciaba como "S/20.9" justo encima del botón de pagar, y el
  // armador podía llegar a mostrar la basura completa de punto flotante
  // (24.369999999999997), que es el defecto que el dueño reportó el 2026-09-09 en el
  // empujón a 30CM. `check:precios` no lo veía porque su regla mira `SOLES+algo` y acá
  // entre medio hay una etiqueta HTML.
  //
  // Dejarlo en quien llama significa acordarse cinco veces; ponerlo acá significa que no
  // se puede escribir mal. Es el mismo criterio que ya obligó a que el recargo del pan
  // viva DENTRO de basePrice en vez de sumarse en cada sitio que lo necesita.
  var tt=t?'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:8px;color:'+GOLD+';letter-spacing:.2em">Total //</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:var(--sw-text,#FFFFFF)">'+SOLES+'<span style="color:'+GOLD+'">'+pz(t)+'</span></div>':'';
  // Sombra hacia arriba (en vez de solo un hairline) para separar la barra fija del
  // contenido que se desliza debajo — antes ambos quedaban al mismo plano visual.
  // Botón principal: relleno dorado plano cuando está activo, sin degradado ni resplandor
  // — la barra de acción en sí (borde superior + fondo casi negro) ya la distingue como
  // LA acción de la pantalla, no hace falta un efecto extra en el botón (dirección Prada
  // Caffè: selección/énfasis se comunican con color plano y borde, nunca con glow).
  // Hint bajo la barra cuando el botón está deshabilitado — explica QUÉ falta en vez de
  // dejar un botón gris sin razón visible (hallazgo de auditoría UX, severidad BAJA).
  var hintRow=(!can&&hint)?'<div style="position:fixed;bottom:66px;left:50%;transform:translateX(-50%);width:100%;max-width:480px;padding:0 20px;text-align:right;pointer-events:none"><span style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#9DA096);background:rgba(11,11,11,.9);padding:4px 10px;border-radius:8px">'+esc(hint)+'</span></div>':'';
  return hintRow+'<div class="sw-barra" style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(11,11,11,.97);border-top:1px solid var(--sw-border-soft,#1c1c1c);padding:12px 20px;display:flex;gap:10px;align-items:center;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:100"><div style="flex:1">'+tt+'</div>'+bb+'<button onclick="'+(can?nfn:'')+'" '+(can?'':'disabled')+' style="all:unset;cursor:'+(can?'pointer':'not-allowed')+';background:'+(can?GOLD:'var(--sw-bg,#17130E)')+';color:'+(can?'var(--sw-on-gold,#241a08)':'#73776C')+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;letter-spacing:.05em;padding:13px 0;border-radius:8px;text-align:center;flex:1">'+(nl||'Continuar //')+'</button></div>';
}
// Badge visible de un Signature: 'Nuevo' (u otro badge temporal futuro) solo mientras
// newUntil no haya pasado, si no el badge permanente en s.badge — evita que un badge de
// novedad se quede pegado para siempre (hallazgo de auditoría de copy, BAJO).
function sigBadge(s){return(s.newUntil&&Date.now()<new Date(s.newUntil+'T23:59:59').getTime())?'Nuevo':s.badge;}
// Distinto de `newUntil` (que solo cambia el texto del badge, nunca oculta el ítem) —
// `availableUntil` es para variantes de temporada de verdad: el Signature entero deja de
// listarse/pedirse al pasar la fecha. Espejo server-side: SIG_AVAILABILITY en catalog.ts.
function sigAvailable(s){return!s.availableUntil||Date.now()<new Date(s.availableUntil+'T23:59:59').getTime();}
function ST(n,t,s?){return'<div style="margin-bottom:20px"><h2 style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:#fff;letter-spacing:.02em;line-height:1.15;text-wrap:balance">'+(n?n+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>':'')+t+'</h2>'+(s?'<p style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-muted,#9DA096);margin-top:5px">'+s+'</p>':'')+'</div>';}
// font-size:15px a propósito (no 14px) — iOS Safari hace zoom automático al enfocar
// cualquier input con font-size menor a 16px, lo que rompe el layout del checkout en
// la mayoría de teléfonos de los clientes.
// `ac` = valor de autocomplete (name/tel/email/street-address...). Sin él el navegador no
// puede autocompletar y se incumple WCAG 1.3.5 (identificar el propósito del campo); en un
// checkout donde se escribe nombre, teléfono y dirección a mano en el celular, además es
// fricción pura.
// `chk` = clave de FIELD_RULES (ver más abajo) para validar en vivo. Sin ella el input
// se comporta exactamente como antes — ningún campo gana un aviso por accidente.
function INP(id,ph,type?,val?,iconName?,ac?,chk?){
  var padLeft=iconName?'44px':'16px';
  // aria-label derivado del placeholder. Ningún input de la app tenía <label> ni
  // aria-label: el placeholder era la única etiqueta y desaparece apenas se escribe la
  // primera letra, así que un lector de pantalla nunca sabía de qué campo se trataba. Se
  // corta en el "//" porque los placeholders siguen el formato "Nombre // Tu nombre": la
  // primera mitad es la etiqueta real, la segunda es la ayuda.
  var lbl=String(ph).split('//')[0].trim()||String(ph);
  var acAttr=ac?' autocomplete="'+ac+'"':'';
  // El único campo type="password" de toda la app es el PIN (no hay contraseñas
  // tradicionales) — antes abría el teclado QWERTY completo en móvil pese a ser siempre
  // numérico (hallazgo de auditoría UX, MEDIO). inputmode="numeric" abre el teclado
  // correcto sin dejar de ocultar el valor tecleado.
  var numAttrs=type==='password'?' inputmode="numeric" pattern="[0-9]*"':'';
  // El chequeo corre al salir del campo (blur, con force) y en cada tecla (input, sin
  // force): así el aviso nunca aparece mientras se escribe por primera vez, pero
  // desaparece apenas el campo queda bien. `data-chk` lo deja repintable tras un render().
  var chkAttrs=chk?' data-chk="'+chk+'" onblur="fieldCheck(this,\''+chk+'\',true)" oninput="fieldCheck(this,\''+chk+'\')"':'';
  return'<div style="position:relative">'
    +(iconName?'<div style="position:absolute;left:15px;top:50%;transform:translateY(-50%);pointer-events:none;opacity:.55">'+icon(iconName,16,'#9DA096')+'</div>':'')
    +'<input id="'+id+'" type="'+(type||'text')+'"'+numAttrs+acAttr+chkAttrs+' aria-label="'+esc(lbl)+'" placeholder="'+ph+'" value="'+esc(val||'')+'" style="background:var(--sw-card,#1B1F18);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px 14px '+padLeft+';color:var(--sw-text,#FFFFFF);width:100%;font-size:15px;caret-color:'+GOLD+';box-shadow:'+SHADOW_SM+';box-sizing:border-box">'
    +(chk?'<div id="'+id+'-msg" role="alert" aria-live="polite" style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-danger-strong,#ff5555);margin-top:4px;min-height:13px"></div>':'')
    +'</div>';
}
// Validación en vivo del checkout. DOS reglas y ni una más: son exactamente las que
// doOrder() ya rechaza al tocar PAGAR (nombre vacío, teléfono con menos de 6 dígitos),
// copiadas de ahí — y la del teléfono es además la misma que exige actReg en el servidor
// (actions/auth.ts). Lo que cambia NO es qué se rechaza sino CUÁNDO se entera el cliente:
// antes armaba el sándwich entero, escribía todo y recién al pagar le decían que el
// teléfono estaba mal. Mismo defecto que ya obligó a poner el selector de distrito y a
// pintar tachadas las horas llenas. El teléfono es el que más importa: es el único campo
// que se ve lleno estando mal, y sin él un pedido ya cobrado no se puede entregar.
// Dos campos quedan FUERA a propósito:
// - El CORREO, porque ni doOrder ni place-order lo validan — pintarlo de rojo marcaría
//   como error algo que el pedido igual acepta.
// - La DIRECCIÓN, porque su input comparte contenedor con el botón de GPS, que se estira
//   con `bottom:0`: meterle un mensaje debajo descentraría el botón. Y una dirección
//   vacía se ve vacía, mientras que un teléfono corto no.
var FIELD_RULES: Record<string,{ok:(v:string)=>boolean,msg:string}> = {
  nombre:{ok:function(v){return v.trim().length>0;},msg:'Necesitamos tu nombre para el pedido.'},
  tel:{ok:function(v){return v.replace(/\D/g,'').length>=6;},msg:'Ingresa un teléfono de contacto válido.'},
  // ⚠ LA DIRECCIÓN NO TENÍA REGLA, Y SU FALTA PINTABA DE ROJO EL NOMBRE (corregido
  // 2026-09-12). `placeOrder` gatea con `if(!nom||!addr)` y llamaba a `fieldCheck` sobre
  // `o-nom` en los dos casos, así que alguien que escribió su nombre y olvidó la dirección
  // veía su nombre marcado como error junto a "Ingresa tu nombre y dirección". Mira el
  // campo señalado, está bien, y el que de verdad falta queda sin marcar — peor que no
  // marcar ninguno, porque lo manda a corregir lo que ya estaba correcto. Es justo lo
  // contrario de lo que el comentario de esa función dice hacer ("un mensaje al pie de un
  // formulario largo no dice CUÁL de los campos está mal").
  //
  // La regla es exactamente la del gate —no vacía— y no la del servidor (`addressIssues`
  // pide número y referencia): una regla más estricta que la puerta pintaría en rojo algo
  // que igual va a poder pagar, y un rojo que no bloquea deja de significar nada.
  direccion:{ok:function(v){return v.trim().length>0;},msg:'Necesitamos tu dirección para llevarte el pedido.'}
};
// Qué campos ya se marcaron mal. Vive FUERA del DOM a propósito: render() reconstruye
// todo el innerHTML del checkout en cada toque (recompensa, crédito, horario, dirección
// guardada), así que un estado guardado en el propio input se perdería y el error se
// borraría solo sin que el cliente arreglara nada.
var _fieldBad: Record<string,boolean> = {};
// Pinta el estado de un campo SIN pasar por render(): reconstruir el innerHTML del
// checkout haría perder el foco y el cursor a mitad de una palabra.
function paintField(id,msg){
  var el=(document.getElementById(id) as HTMLInputElement | null);
  var m=document.getElementById(id+'-msg');
  if(el){
    el.style.borderColor=msg?'var(--sw-danger-strong,#ff5555)':'var(--sw-border-soft,#1c1c1c)';
    // aria-invalid además del color: un lector de pantalla no ve el borde rojo, y el
    // mensaje va en aria-live para que se anuncie al aparecer.
    el.setAttribute('aria-invalid',msg?'true':'false');
  }
  if(m)m.textContent=msg||'';
}
// `force` = el cliente ya salió del campo (blur). Mientras escribe por primera vez no se
// marca nada: un error que aparece en la primera letra es un rechazo antes de que
// terminara de escribir. Una vez marcado, sí se revisa en cada tecla, para que el aviso
// desaparezca en el momento exacto en que el campo queda bien.
function fieldCheck(el,kind,force?){
  if(!el)return true;
  var rule=FIELD_RULES[kind];
  if(!rule)return true;
  var ok=rule.ok(el.value);
  if(ok)_fieldBad[el.id]=false;
  else if(force)_fieldBad[el.id]=true;
  paintField(el.id,_fieldBad[el.id]?rule.msg:'');
  return ok;
}
// Re-pinta lo ya marcado después de un render(). Se llama desde la pantalla de checkout,
// no desde INP(), porque en el momento en que INP() devuelve su string el input todavía
// no existe en el DOM.
function repaintFields(){
  Object.keys(_fieldBad).forEach(function(id){
    if(!_fieldBad[id])return;
    var el=(document.getElementById(id) as HTMLInputElement | null);
    if(!el)return;
    var kind=el.getAttribute('data-chk')||'';
    var rule=FIELD_RULES[kind];
    // Revalida en vez de confiar en la marca vieja: entre un render y otro el valor pudo
    // cambiar por otra vía (elegir una dirección guardada rellena o-addr sin que nadie
    // toque el teclado), y dejar el rojo puesto sobre un campo ya correcto sería un
    // error inventado.
    if(rule)paintField(id,rule.ok(el.value)?'':rule.msg);
  });
}
// box-sizing:border-box a propósito — `all:unset` resetea box-sizing a content-box, así
// que sin esto todo botón width:100% construido con BTN() se pasaba 28px (2×14px de
// padding) del ancho de su contenedor, cortándose fuera de pantalla en formularios
// angostos (ej. GUARDAR HORARIO en el panel admin). Hallazgo de la auditoría visual.
function BTN(l,fn,out?){return'<button onclick="'+fn+'" style="all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;background:'+(out?'transparent':GOLD)+';border:'+(out?'1px solid #9DA096':'none')+';color:'+(out?'#9DA096':'var(--sw-on-gold,#241a08)')+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;letter-spacing:.05em;padding:14px;border-radius:10px;text-align:center">'+l+'</button>';}
// El indicador de carga es EL OJO DE WICHO, no una rueda genérica (idea del dueño,
// 2026-09-12). La espiral ya existía dibujada —SPIRAL() en 02-*, cuyo propio comentario
// decía que `gira` la convierte en indicador de carga— pero nunca se había usado para
// eso: la pieza estaba construida y sin enchufar. Una espiral que gira es literalmente
// lo que ya significa en la marca, así que no hay nada que aprender.
function LOAD(msg){return'<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--sw-bg,#17130E)">'
  +'<div style="margin-bottom:14px">'+SPIRAL(34,'var(--sw-spiral,#C3A6D2)',true)+'</div>'
  +'<div style="margin-bottom:14px">'+WORDMARK(30,true)+'</div>'
  +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:var(--sw-text-muted,#9DA096);letter-spacing:.25em">'+(msg||'CARGANDO //')+'</div></div>';}
// Antes MIS PEDIDOS/HISTORIAL usaban el spinner genérico de pantalla completa (LOAD())
// mientras cargaban — con esto se ve de inmediato el armazón real de la pantalla (título,
// botón atrás) con bloques pulsantes del mismo tamaño que las tarjetas reales, en vez de
// un splash sin relación con lo que está por aparecer.
var listLoading=false;
function skeletonCards(n,heightPx){
  var row='<div class="pulse" style="background:var(--sw-card,#1B1F18);border:1px solid var(--sw-border,#2C3228);border-radius:12px;height:'+(heightPx||64)+'px;margin-bottom:10px"></div>';
  return new Array(n||3).fill(row).join('');
}

// NAV
function go(s){sndScreen=s;render();}
function swTab(t){sndTab=t;sndScreen=t==='order'?'o_home':(cust?'p_home':'p_auth');aErr='';render();}

// Reconstruye el estado global del builder a partir de un "build" guardado
// (viene de un pedido pasado o de un favorito) y salta directo a confirmar.
function loadBuild(bld){
  if(!bld)return;
  mode=bld.mode;sigId=bld.sigId||null;base=bld.base||null;prot=bld.prot||null;
  sinIng=Array.isArray(bld.sin)?bld.sin.slice():[];
  cheese=bld.cheese||null;tops=(bld.tops||[]).slice();sauces=(bld.sauces||[]).slice();
  size=bld.size||null;doubleProt=!!bld.doubleProt;
  // Salsa extra requiere al menos una salsa base en BUILD YOUR OWN (ver catalog.ts) — un
  // favorito/pedido repetido guardado antes de este fix podía traer extraSauce:true con
  // 0 salsas, lo que el servidor ahora rechaza; se sanea acá antes de reconstruir el build.
  extraSauce=!!bld.extraSauce&&(mode==='sig'||sauces.length>0);
  // Si el cliente vuelve "ATRÁS" desde confirmar, que caiga en el último paso (salsas)
  // en vez de tener que reavanzar los 5 pasos para reajustar un build ya completo
  // (favorito/repetir pedido).
  byoStep=4;
  enterConfirm();
}
// Limpia el estado del builder antes de empezar un pedido nuevo — evita que un
// build abandonado (o de un pedido anterior en la misma sesión) reaparezca
// precargado en un pedido sin relación.
function resetBuilder(){
  sigId=null;base=null;prot=null;cheese=null;tops=[];sauces=[];size=null;doubleProt=false;extraSauce=false;sinIng=[];
  byoStep=0;
  editingItemQty=null;
}
function startOrder(m){
  resetBuilder();
  mode=m;
  go(m==='sig'?'o_sig':'o_build');
}
function startOrderWithSig(id){
  resetBuilder();
  mode='sig';
  sigId=id;
  go('o_sig');
}
// editingItemQty: cuando se está editando una línea ya en el carrito (ver
// editCartItem), guarda la cantidad original para que currentBuiltItem() la respete al
// volver a insertarla — antes se perdía siempre (currentBuiltItem hardcodeaba qty:1), así
// que editar cualquier detalle de una línea con qty>1 (ej. agregar una nota) la dejaba en
// 1 unidad sin ningún aviso (hallazgo de auditoría de código, ALTO).
var editingItemQty=null;
function currentBuiltItem(){
  var qty=editingItemQty||1;
  return mode==='sig'
    ?Object.assign({type:'sig',sigId:sigId,size:size,doubleProt:doubleProt,extraSauce:extraSauce,cheese:cheese,qty:qty},sinIng.length?{sin:sinIng.slice()}:{})
    :{type:'byo',base:base,prot:prot,cheese:cheese,tops:tops.slice(),sauces:sauces.slice(),size:size,doubleProt:doubleProt,extraSauce:extraSauce,qty:qty};
}
var quickPayEligible=false;
function enterConfirm(){
  // Ya no hay pantalla de «Confirmar sándwich»: el último paso del armador suma el sándwich al
  // pedido igual que «Lo quiero» de la ficha (ver loQuiero, 2026-09-25).
  quickPayEligible=false;
  loQuiero();
}
// Reinicia los campos transitorios del checkout (nombre/correo/notas/dirección/
// programación/crédito/recompensa) — se llama solo cuando el carrito pasa de estar
// vacío a tener su primer producto, para que un pedido nuevo nunca arrastre texto
// o selecciones de un carrito anterior ya finalizado.
function initCheckoutFields(){
  // `||''`: una cuenta sin teléfono o sin nombre guardado (la de Google puede llegar así) dejaba
  // estos campos en undefined y el carrito se caía entero al abrirse («reading 'replace'»).
  confNom=(cust&&cust.name)||'';
  confPhone=(cust&&cust.phone)||'';
  confEmail=cust&&cust.email?cust.email:'';
  confNotes='';
  addrText=cust&&cust.last_address?cust.last_address:'';
  pickedAddrId=null;
  scheduleMode='now';schedDay='today';schedSlot=null;
  useCredit=false;
  promoFieldOpen=false;
  // 'yape', no null: null es TARJETA. Ver el comentario del default en 01-*.
  manualPayMethod='yape';
  payMethodChosen=false;
  checkoutLocked=false;lockedMsg='';
  _payingInProgress=false;
  appliedReward=null;
  // Un pedido nuevo no arrastra los avisos del anterior: el carrito pasó de vacío a
  // tener su primer producto, así que el checkout empieza limpio igual que los campos.
  _fieldBad={};
}
// Antes de cualquier re-render disparado DESDE la propia pantalla de carrito/checkout
// (toggle de recompensa, horario, crédito, elegir una dirección guardada) hay que
// preservar lo que el cliente ya escribió — render() reconstruye todo el innerHTML,
// así que sin esto cada toque borraría nombre/correo/notas/dirección en curso.
function syncConfirmFields(){
  var n=(document.getElementById('o-nom') as HTMLInputElement | null),p=(document.getElementById('o-phone') as HTMLInputElement | null),e=(document.getElementById('o-email') as HTMLInputElement | null),no=(document.getElementById('o-notes') as HTMLInputElement | null),a=(document.getElementById('o-addr') as HTMLInputElement | null);
  if(n)confNom=n.value;
  if(p)confPhone=p.value;
  if(e)confEmail=e.value;
  if(no)confNotes=no.value;
  if(a)addrText=a.value;
}
function confirmRerender(){syncConfirmFields();render();}
// ── EL ORDEN DE LA CARTA, UNO SOLO PARA LAS DOS PANTALLAS ────────────────────────────
//
// Fijo y decidido a mano — NO se ordena dinámicamente por margen: el cliente que vuelve
// tiene que encontrar la carta donde la dejó. Cualquier Signature nuevo que no esté
// listado acá se muestra al final, en su orden natural.
//
// ⚠ VIVÍA DENTRO DEL HOME Y LA PANTALLA DE ELECCIÓN NO LO USABA (corregido 2026-09-12).
// `sOSig()` recorría `SIGS` directo, así que el home enseñaba un orden y la pantalla
// siguiente —donde el cliente DE VERDAD elige— enseñaba otro. La estrella quedaba en la
// primera fila de una lista y en la cuarta de la otra, dos toques después.
//
// ⚠ Y EL ORDEN ANTERIOR ESTABA ANCLADO A NÚMEROS MUERTOS: decía ordenar por margen con
// cifras de antes del recosteo con merma y de la subida de precios del 2026-08-22 ("SIG03
// 68% y SIG04 49% bruto", contra 32.5% y 26.6% reales hoy), así que ponía al CUARTO y al
// QUINTO en contribución en las dos posiciones más miradas de la lista.
//
// El orden de hoy es por CONTRIBUCIÓN EN SOLES a 15CM, no por porcentaje de costo: el
// negocio deposita soles, y un 20% de costo sobre S/19.90 puede dejar menos que un 32%
// sobre S/23.90. A 15CM porque es el 80% del negocio según la hipótesis del dueño.
// Números de `modelo/rentabilidad_por_parte.py`, que lee `catalog_prices` y
// `catalog_items` (la base), nunca los literales del código:
//   carta v4 (2026-09-24), `deja` a 15CM de modelo/menu_clasicos_usa.py:
//   SIG09 Philly S/17.48 · SIG02 Meatball S/17.43 · SIG10 Turkey S/17.28
//   SIG12 Tuna Melt S/16.96 · SIG11 Hoagie S/16.37 · SIG04 Classic Tuna S/15.35
//
// NO es menu engineering completo: la matriz de Kasavana & Smith cruza margen con
// POPULARIDAD, y popularidad todavía no existe — el negocio no ha abierto. Esto ordena por
// la única de las dos dimensiones que hoy se puede medir, y habrá que rehacerlo con ventas
// reales. Un Signature que se venda el triple puede merecer la primera fila aunque deje
// S/1 menos.
//
// El orden vive en la carta (`orden` de cada Signature en `_shared/carta.ts`), no acá: antes era
// una lista de códigos que se quedaba atrás cada vez que la carta cambiaba. Un Signature que la
// base agrega sin estar en la carta va al final.
function sigsEnOrden(lista){
  var o=CARTA_VIEJA.ORDEN;
  return lista.slice().sort(function(a,b){
    return (o[a.id]!=null?o[a.id]:999)-(o[b.id]!=null?o[b.id]:999);
  });
}
// Precio de una línea del carrito (una unidad, sin multiplicar por qty). Lo calcula el módulo
// de dinero compartido con el servidor (ver DINERO en 01-*): 0 si la línea ya no está en la carta.
function itemUnitPrice(item){return DINERO.unitario(item);}
// money() acá y pz() en los dos displays: sin esto, 3 x The Original 15CM daba
// 20.9*3 = 62.699999999999996 y ESE número se le mostraba al cliente en el carrito y en
// el mensaje de WhatsApp. Es exactamente el defecto que money()/pz() existen para evitar.
function itemLineTotal(item){return money(itemUnitPrice(item)*item.qty);}
function itemLabel(item){
  if(item.type==='side'){var d=SIDES.find(function(x){return x.id===item.code;});return d?d.l+' // '+d.s:'';}
  if(item.type==='sig'){var sig=SIGS.find(function(x){return x.id===item.sigId;});return(sig?sig.n+' // '+sig.s:'')+' '+szLabel(item.size);}
  return fn(PROTS,item.prot)+' '+szLabel(item.size);
}
// Receta COMPLETA de un ítem, para las pantallas del operador (cola, modo foco, ticket).
// itemLabel() de arriba está pensado para el CLIENTE, que ya sabe lo que eligió: para un
// BUILD YOUR OWN devuelve solo "Pollo // Cajún 15CM". Eso es exactamente lo que se guarda
// en `orders.summary`, así que el operador leía el nombre de la proteína y NADA MÁS: ni
// pan, ni toppings, ni queso, ni salsas. Con eso es imposible armar el sándwich sin
// adivinar (hallazgo de la auditoría de UX del panel — el más grave de todos, porque
// rompe la operación el primer día). Los datos siempre estuvieron guardados en
// `orders.items`; nadie los pintaba.
//
// Para un Signature expande la receta desde SIGS por el mismo motivo: el operador no tiene
// por qué recordar de memoria qué lleva cada uno de los 8, y menos en hora pico.
// ⚠ UN INGREDIENTE QUE YA NO ESTÁ EN EL CATÁLOGO NO PUEDE DESAPARECER EN SILENCIO.
// `fn()` devuelve cadena VACÍA cuando no encuentra el id, así que hasta el 2026-09-12 esta
// función empujaba igual la línea y la pantalla de cocina mostraba «Pan:» seguido de nada.
// Y si el Signature entero no estaba en SIGS, devolvía [] y `orderRecipeHTML` omitía el
// bloque completo: un pedido que se ve SIN receta.
//
// No es hipotético — este repo ya retiró P07 (res laminada), T07 (giardiniera), T08 (apio),
// D09 (chai) y SIG07/SIG08. Un pedido programado hecho antes de un retiro, o el historial,
// cae justo ahí. En la pantalla que dice QUÉ COCINAR, un dato que falta se dice; no se borra.
function nombreOId(arr,id,etiqueta){
  if(!id)return '(sin '+etiqueta+')';
  var n=fn(arr,id);
  // El id crudo entre paréntesis es feo a propósito: se lee como "esto hay que mirarlo",
  // que es exactamente lo que hay que hacer.
  return n||('⚠ '+id+' — ya no está en la carta, confirma con el cliente');
}
function itemRecipeLines(item){
  if(item.type==='side')return[];
  var lines=[];
  var base,prot,tops,sauces,cheese;
  if(item.type==='sig'){
    var sig=SIGS.find(function(x){return x.id===item.sigId;});
    // Antes: `return []`, y el sándwich desaparecía de la comanda sin decir nada.
    if(!sig)return['⚠ '+(item.sigId||'este Signature')+' ya no está en la carta — llama al cliente antes de armarlo'];
    base=sig.base;prot=sig.prot;tops=sig.tops||[];sauces=sig.sauces||[];
    cheese=sig.fixedCheese||item.cheese||null;
    // Lo que el cliente quitó no se lista como si fuera: cocina lo lee en la línea SIN.
    var quita=Array.isArray(item.sin)?item.sin:[];
    tops=tops.filter(function(t){return quita.indexOf(t)<0;});
    sauces=sauces.filter(function(t){return quita.indexOf(t)<0;});
    if(cheese&&quita.indexOf(cheese)>=0)cheese=null;
  }else{
    base=item.base;prot=item.prot;tops=item.tops||[];sauces=item.sauces||[];
    cheese=item.cheese||null;
  }
  lines.push('Pan: '+nombreOId(BASES,base,'pan'));
  lines.push('Proteína: '+nombreOId(PROTS,prot,'proteína')+(item.doubleProt?' (DOBLE)':''));
  if(cheese)lines.push('Queso: '+nombreOId(CHEESE,cheese,'queso'));
  // "Vegetales" y no "Toppings", igual que el paso del armador: es la palabra que usa Subway
  // en español y la que el cliente peruano ya trae. Hasta hoy el armador decía una cosa y el
  // resumen del pedido otra para lo MISMO — la vista previa, el resumen y la invitación del
  // armador tenían cada una su nombre.
  lines.push('Vegetales: '+(tops.length?tops.map(function(id){return nombreOId(TOPS,id,'vegetal');}).join(' · '):'sin vegetales'));
  lines.push('Salsas: '+(sauces.length?sauces.map(function(id){return nombreOId(SAUCES,id,'salsa');}).join(' + '):'sin salsa')+(item.extraSauce?' (+EXTRA)':''));
  if(item.type==='sig'&&item.sin&&item.sin.length)lines.push('SIN: '+item.sin.map(nombreIngrediente).join(', ').toUpperCase());
  if(item.note)lines.push('Nota: '+item.note);
  return lines;
}
// Bloque de receta para una lista de ítems de un pedido ya guardado (o.items).
//
// `big` = escala de cocina (modo foco). El dueño arma los pedidos de pie, con las manos
// ocupadas y el celular apoyado a medio metro: a 11px la receta era ilegible justo en la
// pantalla donde SÓLO existe para leerse mientras se arma. En esa escala cada línea
// separa etiqueta y valor ("Salsas:" tenue, "Aioli + Dijon" grande) para poder barrerla
// de un vistazo en vez de leerla palabra por palabra. La escala compacta se mantiene tal
// cual para la cola de pedidos y el ticket impreso, donde sí conviene que entre todo.
function orderRecipeHTML(items,big?){
  if(!Array.isArray(items)||!items.length)return'';
  var fTitle=big?19:12,fLine=big?17:11,pad=big?'16px 18px':'12px 14px',gapB=big?16:8;
  var blocks=items.map(function(it){
    var lines=itemRecipeLines(it);
    if(!lines.length)return'';
    return'<div style="margin-bottom:'+gapB+'px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:'+fTitle+'px;font-weight:640;color:var(--sw-text,#FFFFFF);margin-bottom:'+(big?6:0)+'px">'+(it.qty>1?it.qty+'x ':'')+esc(itemLabel(it))+'</div>'
      +lines.map(function(l){
        if(!big)return'<div style="font-family:\'EB Garamond\',serif;font-size:'+fLine+'px;color:var(--sw-text-body,#EFEDE4);line-height:1.5">'+esc(l)+'</div>';
        // En escala de cocina se parte "Etiqueta: valor" para que el valor domine.
        var i=l.indexOf(': '),k=i>0?l.slice(0,i+1):'',v=i>0?l.slice(i+2):l;
        return'<div style="font-family:\'EB Garamond\',serif;font-size:'+fLine+'px;line-height:1.55;margin-bottom:2px">'
          +(k?'<span style="color:var(--sw-text-muted,#9DA096)">'+esc(k)+' </span>':'')
          +'<span style="color:var(--sw-text-body,#EFEDE4);font-weight:600">'+esc(v)+'</span></div>';
      }).join('')
      +'</div>';
  }).filter(Boolean).join('');
  if(!blocks)return'';
  return'<div style="background:var(--sw-card2,#171A14);border:1px solid rgba(203,162,88,'+(big?'.55':'.3')+');border-radius:'+(big?10:8)+'px;padding:'+pad+';margin-bottom:'+(big?16:12)+'px">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:'+(big?11:8)+'px;color:'+GOLD+';letter-spacing:.18em;margin-bottom:'+(big?12:8)+'px">Para armar //</div>'
    +blocks+'</div>';
}
function itemExtrasLabel(item){
  if(item.type==='side')return'';
  var parts=[];
  if(item.doubleProt)parts.push('doble proteína');
  if(item.extraSauce)parts.push('salsa extra');
  if(item.type==='sig'&&item.cheese)parts.push('con '+fn(CHEESE,item.cheese).toLowerCase());
  if(item.type==='sig'&&item.sin&&item.sin.length)parts.push(sinTexto(item.sin));
  if(item.note)parts.push('nota: '+item.note);
  return parts.join(' · ');
}
// ── EL TOTAL DEL CARRITO: UN SOLO CÁLCULO, EL DEL SERVIDOR (2026-09-24) ──────────────────
// Todo lo de abajo lee de `cartDesglose()`, que le pide el desglose al módulo de dinero
// compartido con el servidor (supabase/functions/_shared/dinero.ts): combo, sándwich del
// organizador, recompensa y el orden en que se aplican. Antes esto era una segunda copia del
// cálculo, y con el pan focaccia daba S/0.50 más que el servidor en R06 y en el sándwich del
// organizador — el cliente veía un total y el pago se rechazaba por «el total no coincide».
// Lo vigila tests/dinero-cliente.spec.ts. Las funciones conservan su nombre porque las usan
// el carrito y el checkout; ninguna calcula nada propio.
function cartDesglose(){
  return DINERO.desglose(cart,{recompensa:appliedReward||null,organizador:!!pendingGroupCode,cuandoMs:effectiveOrderDate().getTime()});
}
function organizerFreeAmount(){return cartDesglose().organizador.monto;}
// La primera línea del carrito a la que se le puede aplicar la recompensa, o -1.
function findRewardTargetIndex(rewardId){return DINERO.lineaDeLaRecompensa(cart,rewardId);}
// Cuánto perdona la recompensa sobre la línea `targetIdx`. Se pide el desglose con esa
// recompensa: el monto sale del mismo cálculo que cobra el servidor.
function rewardWaiverAmount(rewardId,targetIdx){
  if(targetIdx<0)return 0;
  var d=DINERO.desglose(cart,{recompensa:rewardId,organizador:!!pendingGroupCode,cuandoMs:effectiveOrderDate().getTime()});
  return d.recompensa&&d.recompensa.indice===targetIdx?d.recompensa.monto:0;
}
// El código promocional lo valida y lo descuenta el servidor aparte; acá se resta el mismo
// monto que él confirmó.
function cartFinalTotal(){
  var total=cartDesglose().total;
  if(appliedPromo)total-=appliedPromo.discount;
  return money(Math.max(0,total));
}
// El carrito se guarda en localStorage en cada cambio y se restaura al abrir la app
// (ver restoreCart() en INIT) — sin esto, refrescar la página, cerrar la pestaña por
// error o recibir una llamada a medio armar el pedido borraba todo el carrito, una
// causa común de abandono en apps de delivery. Se descarta si tiene más de 24h para
// no resucitar un carrito viejo con precios/catálogo ya desactualizados.
function saveCart(){
  try{
    if(cart.length)localStorage.setItem('sw_cart',JSON.stringify({items:cart,reward:appliedReward,ts:Date.now()}));
    else localStorage.removeItem('sw_cart');
  }catch(e){}
  scheduleCartSync();
}
var _cartSyncTimer=null;
// El recordatorio de carrito abandonado (remind-abandoned-cart, cron) necesita que el
// servidor sepa qué hay en el carrito de un cliente logueado — debounced para no mandar
// una llamada por cada tap mientras arma el pedido, solo cuando se queda quieto ~4s. Solo
// tiene sentido si puede recibir el push (pushSubscribed) y tiene cuenta (token) — un
// invitado o alguien sin notificaciones activas nunca podría recibir el aviso de todos
// modos, así que ni vale la pena sincronizar su carrito al servidor.
function scheduleCartSync(){
  if(!cust||!pushSubscribed||!token)return;
  if(_cartSyncTimer)clearTimeout(_cartSyncTimer);
  _cartSyncTimer=setTimeout(function(){
    api('sync-cart',{token:token,items:cart}).catch(function(){});
  },4000);
}
// Se llama una sola vez al abrir la app (ver INIT), después de resolver la sesión —
// así, si el cliente tiene cuenta, initCheckoutFields() prellena nombre/correo/
// dirección desde su perfil en vez de con campos vacíos.
// Un ítem de carrito válido siempre tiene un type reconocido y un qty numérico — sin
// esto, un localStorage corrupto o de una versión vieja de la app restauraba el carrito
// tal cual, y la pantalla de inicio terminaba mostrando "CARRITO // NaN items" en vez de
// simplemente empezar con el carrito vacío.
function isValidCartItem(it){
  return it&&typeof it==='object'&&(it.type==='byo'||it.type==='sig'||it.type==='side')&&typeof it.qty==='number'&&it.qty>0;
}
// Además de la forma (isValidCartItem), hay que comprobar que los IDS sigan existiendo en
// el catálogo. El carrito vive 24h en localStorage y el catálogo se edita desde el panel:
// si en ese lapso se retira un Signature o cambia una proteína, itemUnitPrice() devuelve 0
// y itemLabel() cadena vacía para la línea huérfana. El cliente veía una fila en blanco a
// S/0 y recién al pagar el servidor la rechazaba con un error genérico.
function cartItemStillExists(it){
  if(it.type==='side')return SIDES.some(function(x){return x.id===it.code;});
  if(it.type==='sig')return SIGS.some(function(x){return x.id===it.sigId;});
  return PROTS.some(function(x){return x.id===it.prot;});
}
// ⚠ EXISTIR EN EL CATÁLOGO NO ES LO MISMO QUE PODERSE PEDIR (2026-09-12).
//
// `cartItemStillExists` pregunta si el id sigue en el array. Eso alcanzaba mientras retirar
// algo significara BORRARLO, y dejó de alcanzar el 2026-09-05: res (P01) y embutido (P05)
// salieron de ARMA EL TUYO por rentabilidad y **siguen en `PROTS`**, marcadas `sigOnly`,
// porque sus Signatures las usan. El id existe; la combinación ya no se puede pedir.
//
// El servidor SÍ lo rechaza — `priceByoBuild` lanza "Proteína inválida." para cualquier
// prot en `SIG_ONLY_PROTS`/`VAULT_ONLY_PROTS` — así que sin este filtro el cliente carga el
// carrito, ve un precio real (S/14.90 para res, medido) y camina hasta PAGAR para enterarse.
// Es exactamente el defecto que ya obligó a poner el selector de distrito y a mostrar las
// horas llenas tachadas: el servidor tenía razón y el cliente se enteraba al final.
//
// NO ES SOLO LA PROTEÍNA, y la primera versión de esto se quedó corta justamente ahí.
// `priceByoBuild` rechaza con el MISMO criterio los tres: proteína, toppings y salsas
// (`SIG_ONLY_*` / `VAULT_ONLY_*`). Y hay un caso vivo hoy en cada uno: **T02 pepinillo** pasó
// a `sigOnly` el 2026-09-04 (lo reemplazó la lechuga en el armador, pero SIG01 y SIG03 lo
// llevan), y el jalapeño T04 y las dos salsas picantes son exclusivas del menú secreto.
// Filtrar solo la proteína dejaba pasar un armado con pepinillo hasta el checkout.
//
// Estas listas replican las del servidor a propósito y tienen que seguirlas: si alguna vez se
// mueve un ingrediente a `sigOnly` allá y no acá, vuelve el mismo agujero.
function cartItemOrderable(it){
  if(!cartItemStillExists(it))return false;
  if(it.type!=='byo')return true;
  var p=PROTS.find(function(x){return x.id===it.prot;});
  if(!p||p.sigOnly||p.vaultOnly)return false;
  var libre=function(lista,ids){
    return (ids||[]).every(function(id){
      var x=lista.find(function(y){return y.id===id;});
      return !!x&&!x.sigOnly&&!x.vaultOnly;
    });
  };
  return libre(TOPS,it.tops)&&libre(SAUCES,it.sauces);
}
// Repetir pide algo MÁS que poderse pedir: que sea LO MISMO que pidió.
//
// El menú secreto rota cada mes bajo el mismo id (SIG05) — es su mecanismo, no un defecto.
// Pero por eso "Pedir lo mismo" sobre un pedido viejo con SIG05 entregaría **otro sándwich,
// con otra receta y otro precio**, bajo el mismo nombre. El botón promete lo contrario de lo
// que haría, y el cliente se entera cuando lo muerde. Se excluye del repetir; pedirlo sigue
// estando a un toque desde su propia tarjeta, que es donde se ve la composición del mes.
function cartItemRepeatable(it){
  if(!cartItemOrderable(it))return false;
  if(it.type!=='sig')return true;
  var s=SIGS.find(function(x){return x.id===it.sigId;});
  return !!s&&!s.secret;
}
function restoreCart(){
  try{
    var raw=JSON.parse(localStorage.getItem('sw_cart')||'null');
    if(raw&&Array.isArray(raw.items)&&raw.items.length&&raw.items.every(isValidCartItem)&&Date.now()-(raw.ts||0)<24*3600*1000){
      cart=raw.items.filter(cartItemOrderable);
      if(!cart.length){cart=[];return;}
      initCheckoutFields();
      appliedReward=raw.reward||null;
    }
  }catch(e){}
}
function addSideToCart(code){
  var wasEmpty=cart.length===0;
  var existing=cart.find(function(it){return it.type==='side'&&it.code===code;});
  if(existing){existing.qty++;}else{cart.push({type:'side',code:code,qty:1});}
  if(wasEmpty)initCheckoutFields();
  saveCart();
  render();
  var d=SIDES.find(function(x){return x.id===code;});
  fbTrack('AddToCart',{currency:'PEN',value:d?d.p:0});
  showToast('¡'+(d?d.l:'Producto')+' agregado! //','success');
}
// Reconstruye un carrito completo a partir de un pedido pasado o favorito multi-línea
// — usado por "repetir pedido", que reproduce todo el carrito anterior de un tap.
//
// ⚠ UN PEDIDO PASADO ES MUCHO MÁS VIEJO QUE LAS 24 H DEL CARRITO, así que es el caso donde
// más probable es que algo haya salido de la carta — y hasta el 2026-09-12 era el ÚNICO de
// los dos caminos que no filtraba nada (`restoreCart` sí lo hacía desde siempre). Ver
// `cartItemOrderable`/`cartItemRepeatable` arriba para qué se cae y por qué.
//
// LO QUE SE CAE SE DICE. Descartar en silencio sería peor que el defecto que esto arregla:
// el cliente toca "Pedir lo mismo", recibe algo distinto de lo que pidió y no se entera
// hasta que llega. Y si no queda NADA, no se le manda a un carrito vacío sin explicación.
function loadCart(items){
  if(!items||!items.length)return;
  var pedibles=items.filter(cartItemRepeatable);
  var fuera=items.length-pedibles.length;
  if(!pedibles.length){
    showToast('Ese pedido ya no se puede repetir: lo que llevaba salió de la carta. Ármalo de nuevo y te ayudamos.','info');
    go('o_home');
    return;
  }
  cart=pedibles.map(function(it){return Object.assign({},it);});
  initCheckoutFields();
  saveCart();
  go('o_cart');
  if(fuera)showToast(fuera===1
    ?'Una cosa de ese pedido ya no está en la carta — el resto te lo dejamos listo.'
    :fuera+' cosas de ese pedido ya no están en la carta — el resto te lo dejamos listo.','info');
}
function ratedRefs(){try{return JSON.parse(localStorage.getItem('sw_rated')||'[]');}catch(e){return[];}}
function markRated(ref){var r=ratedRefs();if(r.indexOf(ref)<0){r.push(ref);localStorage.setItem('sw_rated',JSON.stringify(r));}}
async function loadUserExtras(){
  if(!cust)return;
  // Antes myOrders solo se llenaba al visitar MIS PEDIDOS/HISTORIAL — un cliente
  // recurrente que recién abre la app nunca veía la tarjeta "↻ REPETIR PEDIDO //" en el
  // home (lastPaidOrder() lee de acá) hasta visitar esa pantalla primero, y refrescar la
  // página a medio pedido perdía todo rastro de que tenía uno en curso (hallazgo de
  // auditoría UX). Se pide aquí también, en segundo plano, igual que direcciones/favoritos.
  // Las 3 llamadas son independientes entre sí — antes corrían una tras otra en serie sin
  // motivo (el backend ya usa Promise.all para este mismo patrón en varios lados); ahora
  // en paralelo, conservando el mismo swallow-de-error individual por llamada (hallazgo
  // de auditoría de código, MEDIO).
  var results=await Promise.allSettled([
    api('addresses-list',{token:token}),
    api('favorites-list',{token:token}),
    api('my-orders',{token:token}),
  ]);
  if(results[0].status==='fulfilled')myAddresses=results[0].value.addresses||[];
  if(results[1].status==='fulfilled')myFavorites=results[1].value.favorites||[];
  if(results[2].status==='fulfilled')myOrders=results[2].value.orders||[];
  render();
}

// ── PANTALLA DE ELECCION (concepto 1) ─────────────────────────────────────────────
// Las dos mitades del logo, a sangre, cada una como boton de su lado. Sin lista de
// producto debajo y sin tarjetas: lo unico que se decide aca es de quien es el pedido.
//
// ⚠ LAS DOS MITADES MIDEN LO MISMO Y SE TOCAN. Son media cara cada una: un hueco entre
// ellas o un lado mas grande parte la cabeza por la costura, y se nota en el ojo, la
// oreja y el sandwich. La diferencia entre los lados la da el color del plano, nunca la
// escala del personaje.
// == EL SISTEMA DE PANTALLAS (escrito de cero, 2026-09-17) ==============================
//
// POR QUE EXISTE. El front se rehizo pantalla por pantalla y el dueno lo resumio mejor que
// nadie: "hiciste lo que queremos evitar, que la web se vea amateur arreglando una cosa y
// otra". Tenia razon, y la causa no era ninguna pantalla en particular: era que CADA UNA
// inventaba su propio encabezado, su propio margen y su propia tarjeta. Cuando la coherencia
// depende de que alguien se acuerde, se pierde en la tercera pantalla.
//
// Estas piezas son la anatomia. Toda pantalla del cliente se arma con ellas y ninguna vuelve
// a escribir un padding a mano. Si algo no se puede expresar con estas piezas, la discusion
// es si falta una pieza, no si esta pantalla merece una excepcion.
//
// NO SON UN REFACTOR DE LO ANTERIOR. Estan escritas mirando que necesita una pantalla de
// esta app, no que hacia H(). La cabecera vieja gastaba 96px en repetir el logotipo en cada
// pantalla; el riel gasta 52 y los usa para decir donde estas y como salir.

// El RIEL - la franja de arriba. Tres zonas y nada mas: como salgo, donde estoy, que tengo
// pendiente. Pegada al borde superior porque en un telefono el pulgar llega antes al borde
// que al centro.
function RIEL(o?){
  o=o||{};
  var izq=o.volver
    ?'<button onclick="'+o.volver+'" aria-label="Volver" style="all:unset;cursor:pointer;width:44px;height:44px;'
     +'display:flex;align-items:center;justify-content:center;color:var(--sw-text-muted,#9DA096);font-size:22px">&#8592;</button>'
    :'<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center">'+WORDMARK(15)+'</div>';
  var centro=o.titulo
    ?'<div style="flex:1;min-width:0;text-align:center;font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;'
     +'letter-spacing:.24em;text-transform:uppercase;color:'+ACC()+';overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(o.titulo)+'</div>'
    :'<div style="flex:1"></div>';
  var der=o.derecha||'<div style="width:44px"></div>';
  return'<div style="position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:6px;height:52px;padding:0 8px;'
    +'background:var(--sw-bg,#17130E);border-bottom:1px solid var(--sw-border-soft,#16241C)">'+izq+centro+der+'</div>';
}


// La PANTALLA - el contenedor. El cuerpo NO trae margen lateral a proposito: la imagen va a
// sangre y es BLOQUE/SECCION quien mete el texto en la caja. Asi "a sangre" es el estado
// natural de una foto y no algo que haya que pelear con margenes negativos.
function PANTALLA(riel,cuerpo,accion?){
  return'<div style="min-height:100dvh;display:flex;flex-direction:column;background:var(--sw-bg,#17130E)">'
    +(riel||'')
    +'<div style="flex:1;min-width:0" class="fi">'+cuerpo+'</div>'
    +(accion||'')+'</div>';
}



// ── LLEVAR A OTRA PANTALLA, SIN CAJA (reescrito 2026-09-17) ───────────────────────────
//
// La versión anterior era un rectángulo redondeado con borde, título y subtítulo, y el
// comentario decía orgullosamente que reemplazaba «la fila con Elegir → de la app anterior,
// el patrón que hacía que todo se viera igual». Era el mismo patrón con la flecha borrada.
// El dueño lo cazó a la primera: «también es un recolor».
//
// La caja no aporta NADA acá. No agrupa nada que no esté ya junto, no separa de nada que
// esté al lado, y no hay contenido dentro que necesite un contenedor. Lo único que hacía era
// dar el aspecto de app genérica: tres rectángulos apilados con borde de 1px.
//
// Esto es una carta de restaurante, no un panel de control. Así que se lee como una carta:
// el nombre grande, el dato que decide alineado a la derecha, una línea fina entre uno y
// otro. Sin relleno, sin borde, sin marco. La fila entera sigue siendo el botón.
function PUERTA(o){
  return'<button onclick="'+o.fn+'" style="all:unset;box-sizing:border-box;cursor:pointer;display:block;'
    +'width:100%;padding:17px 0;border-top:1px solid var(--sw-border-soft,#16241C)">'
    +'<div style="display:flex;align-items:baseline;justify-content:space-between;gap:14px">'
    +'<span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;'
    +'color:var(--sw-text,#fff);line-height:1.1">'+o.titulo+'</span>'
    +(o.dato?'<span style="flex:0 0 auto;font-family:\'EB Garamond\',serif;font-style:italic;font-size:15px;'
      +'color:'+ACC()+'">'+o.dato+'</span>':'')
    +'</div>'
    +(o.bajada?'<div style="font-family:\'EB Garamond\',serif;font-size:11px;line-height:1.5;'
      +'color:var(--sw-text-muted,#9DA096);margin-top:5px;max-width:40ch">'+o.bajada+'</div>':'')
    +'</button>';
}

// La tarjeta del menu secreto, ahora una pieza propia. Vivia como una closure dentro del
// home viejo, asi que era inalcanzable desde cualquier otra pantalla y se perdia con el.
// El contenido es el mismo que el dueno aprobo el 2026-09-17 (variantes A/B/D), palabra por
// palabra: lo que cambia es que ahora tiene nombre y se puede colocar donde haga falta.
// ── EL MENÚ SECRETO, PANTALLA PROPIA ────────────────────────────────────────────────────
// Maquetas aprobadas: menu-secreto-estructura (qué va y en qué orden) y menu-secreto-fondo
// (el bocado de cerca detrás). Solo se llega desbloqueado: la tarjeta bloqueada no trae acá.
// Todo lo que dice sale de la base: el nombre, los días que le quedan (catalog.ts ·
// finDelSecreto), las pistas que cargó el dueño y los que ya no vuelven.
var MESES_LARGO=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function diasDelSecreto(endsAt:string|null,ahora?:number):string{
  var fin=endsAt?Date.parse(endsAt):NaN;
  if(!isFinite(fin))return'';
  var d=Math.ceil((fin-(ahora||Date.now()))/86400000);
  return d<=0?'':d===1?'Último día':d+' días';
}
function mesDeLima(ms:number,delta?:number):string{
  var d=new Date(ms-5*3600000);
  return MESES_LARGO[(d.getUTCMonth()+(delta||0)+12)%12];
}
function sMenuSecreto(){
  var sig=SIGS.find(function(s){return s.secret;});
  var desbloqueado=!!sig&&!!cust&&(cust.total_orders||0)>=sig.minOrders;
  if(!sig||!desbloqueado){sndScreen='o_home';return sOHome();}
  var fin=SECRET_EXTRA.endsAt?Date.parse(SECRET_EXTRA.endsAt):NaN;
  var mes=isFinite(fin)?mesDeLima(fin):'';
  var dias=diasDelSecreto(SECRET_EXTRA.endsAt);
  var precio=SOLES_TXT+pz(sig.p15);
  var foto=SIG_IMG[sig.id]||'';
  return'<div class="msec fi">'
    +(foto?'<div class="fo" aria-hidden="true"><img src="'+foto+'" alt=""></div>':'')+'<div class="velo"></div>'
    +'<button class="sal" onclick="go(\'o_home\')" aria-label="Volver">←</button>'
    +'<div class="wm"><img src="img/logo-avatar-96.png" alt=""><span class="tx">SND<span class="mk"><i></i><i></i></span>WCH</span></div>'
    +'<div class="cuerpo">'
    +'<div class="cab">Lo desbloqueaste</div>'
    +'<div class="nom"><b>'+esc(String(sig.n||'').toUpperCase())+'</b>'
    +((mes||dias)?'<div class="mes"><s>'+(mes?'El secreto de '+esc(mes):'')+'</s><k>'+esc(dias)+'</k></div>':'')+'</div>'
    +(SECRET_EXTRA.hints.length?'<div class="pistas"><em>No decimos qué lleva. Decimos cómo pega.</em>'
      +SECRET_EXTRA.hints.map(function(h,i){return'<div class="p"><k>0'+(i+1)+'</k><div class="t"><b>'+esc(h.t)+'</b>'+(h.s?'<s>'+esc(h.s)+'</s>':'')+'</div></div>';}).join('')
      +'</div>':'')
    +(SECRET_EXTRA.past.length?'<div class="ant"><em>Los que ya no vuelven</em>'
      +SECRET_EXTRA.past.slice(0,3).map(function(p){return'<div class="a"><i>'+esc(p.mes)+'</i><div class="t"><b>'+esc(p.name)+'</b>'+(p.blurb?'<s>'+esc(p.blurb)+'</s>':'')+'</div><p>SE FUE</p></div>';}).join('')
      +'</div>'
      +'<div class="adv">Cada uno duró un mes y no volvió.'+(isFinite(fin)?'<br>El de '+esc(mesDeLima(fin,1))+' será otro y no avisa.':'')+'</div>':'')
    +'</div>'
    +'<div class="pre"><em>15 cm</em><b>'+precio+'</b></div>'
    +'<div class="go sw-barra"><button class="oro" onclick="startOrderWithSig(\''+sig.id+'\')">Pedirlo a ciegas</button><button class="cel" onclick="startOrderWithSig(\''+sig.id+'\')">'+precio+'</button></div>'
    +'</div>';
}

// == LOS DOS MUNDOS (escritos de cero, 2026-09-17) ======================================
//
// Hasta hoy elegir un hermano solo cambiaba una pestana dentro de UNA sola pagina: el
// wordmark grande, la linea de estado, la cara partida como interruptor, una fila
// "Bebidas", y debajo la lista del lado elegido. Esa pagina era la de la app anterior con
// pintura nueva, y por eso daba igual donde se tocara.
//
// Ahora cada lado ES una pantalla, con su color y su forma:
//   SANDO   - su carta cerrada. Se mira, se elige una y se acabo.
//   WICHO   - no tiene pantalla propia: su lado ES armar, asi que entrar por el lo mete
//             directo en el armador (ver elegirLado en 01-*).
//   BEBIDAS - pantalla propia alcanzable desde los dos lados, que CONSERVA el color del
//             lado desde el que se entro. No es un tercer hermano: es el mismo producto
//             visto desde cualquiera de los dos.





// ── BEBIDAS · lado SANDO: el vaso a sangre · lado WICHO: tres franjas (maquetas aprobadas) ──
// docs/maquetas/aprobadas/bebidas-lado-sando.png, bebidas-lado-wicho.png y
// bebidas-sando-sigo-sin-bebida.png. Es la misma pantalla para los dos lados, pintada como el
// lado por el que se entró (ladoActual). Tras «Lo quiero», si el pedido no trae bebida, se
// pasa por acá con «Sigo sin bebida →» (ofrecerBebida).
// El precio con sándwich sale de COMBO_DISCOUNT_PER_PAIR: nunca se escribe.
var bebidaSel:string|null=null;
function precioEnCombo(d:any){return money(Math.max(0,d.p-COMBO_DISCOUNT_PER_PAIR));}
function bebidasDisponibles(){return SIDES.filter(function(d){return isAvail(d.id);});}
function bebidaElegida(){
  var lista=bebidasDisponibles();
  return lista.find(function(d){return d.id===bebidaSel;})||lista[0]||null;
}
// En el lado de SANDO la elegida es la que está a la vista: se sigue el deslizamiento sin
// volver a pintar toda la pantalla (solo el pie y los puntos).
function bebidaDeslizada(el:HTMLElement){
  var i=Math.round(el.scrollLeft/Math.max(1,el.clientWidth));
  var lista=bebidasDisponibles();
  if(!lista[i]||lista[i].id===bebidaSel)return;
  bebidaSel=lista[i].id;
  var pie=document.getElementById('bebida-precio');
  if(pie)pie.innerHTML=pieBebidaHTML(lista[i]);
  var nom=document.getElementById('bebida-nombre');
  if(nom)nom.textContent='Agregar '+lista[i].l;
}
function hayComboAhora(){return cart.some(function(it){return it.type!=='side';});}
function precioBebidaAhora(d:any){return hayComboAhora()?precioEnCombo(d):d.p;}
// El precio de una bebida, dicho como se cobra (dueño, 2026-10-01: «cuando es en combo debe verse
// tachado el precio anterior y se vea el que se cobra en combo»). Sin sándwich en el pedido, el
// precio de carta y, abajo, cuánto baja si se suma uno.
function precioBebidaHTML(d:any){
  if(hayComboAhora())return'<n><del>'+SOLES_TXT+pz(d.p)+'</del> '+SOLES_TXT+pz(precioEnCombo(d))+'</n><s>Precio en combo</s>';
  return'<n>'+SOLES_TXT+pz(d.p)+'</n><s>Con sándwich '+SOLES_TXT+pz(precioEnCombo(d))+'</s>';
}
function pieBebidaHTML(d:any){
  return(hayComboAhora()?'<del>'+SOLES_TXT+pz(d.p)+'</del> ':'')+SOLES_TXT+pz(precioBebidaAhora(d));
}
function agregarBebidaElegida(){
  var d=bebidaElegida();
  if(!d)return;
  addSideToCart(d.id);
  salirDeBebidas();
}
function salirDeBebidas(){
  var volver=ofrecerBebida?'o_cart':bebidasVolverA;
  ofrecerBebida=false;bebidaSel=null;
  go(volver);
}
function sMundoBebidas(){
  var lista=bebidasDisponibles();
  var d=bebidaElegida();
  if(!d){return'<div class="bw">'+VACIO('Sin bebidas hoy','Se acabaron por hoy. Mañana vuelven.',null)+'</div>';}
  // La barra dice QUÉ se agrega: antes decía solo «Agregar» y no había forma de saber cuál de las
  // tres estaba elegida (dueño: «no deja seleccionarlas bien»).
  var pie='<div class="bebida-go sw-barra"><button class="oro" onclick="agregarBebidaElegida()" id="bebida-nombre">Agregar '+esc(d.l)+'</button>'
    +'<button class="cel" onclick="agregarBebidaElegida()" id="bebida-precio">'+pieBebidaHTML(d)+'</button></div>';
  var sin=ofrecerBebida?'Sigo sin bebida →':'';
  if(ladoActual()==='wicho'){
    return'<div class="bw fi"><button class="sal" onclick="salirDeBebidas()" aria-label="Volver">←</button>'
      +'<div class="cab"><em>Algo para tomar</em><u>'+lista.length+(lista.length===1?', bien helada':', bien heladas')+'</u></div>'
      +lista.map(function(x){
        var on=x.id===d.id;
        return'<button class="bd'+(on?' on':'')+'" aria-pressed="'+on+'" onclick="bebidaSel=\''+x.id+'\';render()">'
          +(DRINK_IMG[x.id]?'<img src="'+DRINK_IMG[x.id]+'" alt="" loading="lazy">':'')+'<div class="v"></div>'
          +(on?'<i class="ok">✓ Elegida</i>':'')
          +'<div class="tx"><b>'+esc(x.l)+'</b><s>'+esc(x.s)+' · 500 ml</s><p>'+esc(x.d||'')+'</p></div>'
          +'<div class="pz">'+precioBebidaHTML(x)+'</div></button>';
      }).join('')
      +'<div class="pie">Con cualquier sándwich, la bebida baja '+SOLES_TXT+pz(COMBO_DISCOUNT_PER_PAIR)+'.<br>Se aplica sola en el carrito.'
      +(sin?'<br><button onclick="salirDeBebidas()">'+sin+'</button>':'')+'</div>'
      +'</div>'+pie;
  }
  return'<div class="b3 fi"><button class="sal" onclick="salirDeBebidas()" aria-label="Volver">←</button>'
    +'<div class="pistas" onscroll="bebidaDeslizada(this)">'
    +lista.map(function(x,i){
      return'<section class="vaso" aria-label="'+esc(x.l)+'"><div class="fo">'+(DRINK_IMG[x.id]?'<img src="'+DRINK_IMG[x.id]+'" alt="" '+(i?'loading="lazy"':'')+'>':'')+'<div class="v"></div></div>'
        +'<div class="arr"><em>Algo para tomar</em><u>'+(lista.length>1?'Desliza →':'')+'</u></div>'
        +'<div class="nom"><b>'+esc(x.l)+'</b><s>'+esc(x.s)+' · 500 ml</s><p>'+esc(x.d||'')+'</p></div>'
        +'<div class="pz">'+precioBebidaHTML(x)+'</div>'
        +'<div class="cn" aria-hidden="true">'+lista.map(function(_y,k){return'<i class="'+(k===i?'on':'')+'"></i>';}).join('')+'</div>'
        +'</section>';
    }).join('')
    +'</div>'
    +(sin?'<button class="sinb" onclick="salirDeBebidas()">'+sin+'</button>':'')
    +'</div>'+pie;
}

// Cuantos Signatures hay HOY, en palabras. Se cuenta sobre la misma lista que pinta el
// mosaico, asi que la puerta y la carta no pueden decir cosas distintas.
function cuantosSignatures(){
  var n=SIGS.filter(function(x){return!x.secret&&sigAvailable(x);}).length;
  // Como lo dice M2: «Cinco recetas cerradas.» — la cifra se cuenta, la frase es la de la maqueta.
  var palabras=['','Una','Dos','Tres','Cuatro','Cinco','Seis','Siete','Ocho','Nueve','Diez'];
  if(!n)return'La carta de la casa.';
  if(n===1)return'Una receta cerrada.';
  return(palabras[n]||String(n))+' recetas cerradas.';
}
// ── LA PUERTA · la cara partida (M2 + la esquina de la cuenta, aprobadas 2026-09-25) ──────
// docs/maquetas/aprobadas/la-puerta-M2-sin-sesion.png y -con-sesion.png. Es SIEMPRE la primera
// pantalla: la app no pide nada al abrir (dueño: «luego siempre la primera pantalla debe ser la
// dividida en mitades, tiene que cubrir por completo la pantalla»). Cada mitad de la cara es un
// botón entero que lleva a su mundo; la cuenta vive en la esquina del lado claro, porque los
// mundos no tienen barra y sin ella no habría cómo llegar a los puntos.
//
// Todo número que dice sale del código: cuántos Signatures (`cuantosSignatures`), la hora de
// cierre (STORE_HOURS) y el envío mínimo (DELIVERY_MIN_FEE). La maqueta los trae de muestra.
function horaDoce(h:number):string{
  var m=h%24,suf=m<12?'a.m.':'p.m.',x=m%12===0?12:m%12;
  return x+':00 '+suf;
}
function puertaEstado():{rotulo:string,detalle:string,cerrado:boolean}{
  var envio='delivery desde '+SOLES_TXT+(DELIVERY_MIN_FEE%1?pz(DELIVERY_MIN_FEE):String(DELIVERY_MIN_FEE));
  if(!businessLaunched)return{rotulo:'Aún no abrimos',detalle:envio,cerrado:false};
  var lima=limaDayHour(new Date()),range=STORE_HOURS[lima.weekday];
  if(!range)return{rotulo:'Cerrado hoy',detalle:envio,cerrado:true};
  var abierto=lima.hour>=range[0]&&lima.hour<range[1];
  return abierto
    ?{rotulo:'Abierto ahora',detalle:'cierra '+horaDoce(range[1])+' · '+envio,cerrado:false}
    :{rotulo:'Cerrado',detalle:'abre '+horaDoce(range[0])+' · '+envio,cerrado:true};
}
function sOEleccion(){
  var est=puertaEstado();
  var mitad=function(id,clase,nombre,titulo,bajada,img){
    return'<button class="h '+clase+'" onclick="elegirLado(\''+id+'\')" aria-label="'+esc(nombre+' · '+titulo)+'">'
      +'<div class="cara"><img src="img/'+img+'" alt="" aria-hidden="true"></div>'
      +'<div class="txt"><div class="nom">'+esc(nombre)+'</div><div class="prom">'+esc(titulo)+'</div>'
      +'<div class="baj">'+esc(bajada)+'</div></div></button>';
  };
  var nombre=cust&&cust.name?String(cust.name).trim().split(/\s+/)[0]:'';
  var yo=cust
    ?'<button class="yo" data-fondo="#CFE6F5" onclick="swTab(\'points\')" aria-label="Tu cuenta">'+esc(nombre)+' <span class="pt">'+(cust.points||0)+' pts</span></button>'
    :'<button class="yo" data-fondo="#CFE6F5" onclick="swTab(\'points\')">Entrar →</button>';
  return'<div class="pta fi">'
    +'<div class="cab"><span class="wm"><span class="snd" data-fondo="#1E1B15">SND</span><span class="wm-mark" aria-hidden="true"><i></i><i></i></span><span class="wch" data-fondo="#CFE6F5">WCH</span></span></div>'
    +yo
    +'<div class="mitades">'
    // ⚠ EL NUMERO SE CUENTA, NUNCA SE ESCRIBE (ver cuantosSignatures).
    +mitad('sig','hs','SND','Ya está resuelto',cuantosSignatures(),'sando.webp')
    +mitad('byo','hw','WCH','Tú decides','Pan, proteína, lo que quieras.','wicho.webp')
    +'</div>'
    +'<div class="pie'+(est.cerrado?' cerrado':'')+'"><span>'+esc(est.rotulo)+'</span><em>'+esc(est.detalle)+'</em></div>'
    +'</div>';
}

// Devuelve la primera frase de un texto. Si no encuentra un punto seguido de espacio
// —un pitch de una sola oracion, por ejemplo— devuelve el texto entero: nunca inventa un
// corte donde el autor no lo puso, que es justo el defecto que este helper viene a cerrar.
function primeraFrase(t){
  if(!t)return'';
  var m=/^(.+?[.!?])(\s|$)/.exec(t);
  return m?m[1]:t;
}

// El home ya no PINTA nada: reparte. Antes eran 351 lineas que armaban la barra de
// pestanas, los tres paneles (sig / byo / drink), la tarjeta del secreto, la de oficina, la
// de puntos y la de favoritos, todo en una sola funcion con closures adentro — que es
// exactamente por que cada lado se veia igual que el otro: eran el mismo render con un
// filtro. Ahora cada destino es su propia pantalla y esto solo decide cual.
function sOHome(){
  if(homeTab===null)return sOEleccion();
  // Quien entro por WICHO no tiene un "home": su lado es armar. Puede caer aca al volver
  // con el lado guardado en localStorage, y se lo devuelve al armador en vez de mostrarle
  // la carta cerrada de su hermano con los colores cambiados.
  if(homeTab==='byo'){ mode='byo'; sndScreen='o_build'; return sOBuild(); }
  return sMundoSando();
}

// PEDIDO GRUPAL / DE OFICINA
// Cualquiera con el link agrega su propio Signature bajo su nombre, sin necesitar cuenta
// (solo quien organiza necesita sesión, para poder cerrar y pagar todo junto). Al cerrar,
// el servidor solo devuelve los items ya agregados — se cargan con loadCart() y de ahí en
// adelante es EXACTAMENTE el mismo carrito/checkout de siempre (combo, menú secreto, todo
// se valida igual), sin duplicar nada de esa lógica acá.
function shareGroupOrder(){
  var link=location.origin+location.pathname+'?group='+encodeURIComponent(groupCode);
  var text='Únete a mi pedido grupal en SND//WCH y agrega tu sándwich: '+link;
  if(navigator.share){navigator.share({title:'SND//WCH',text:text,url:link}).catch(function(){});}
  else{window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');}
}
// Se llama después de un login/registro exitoso: si el cliente llegó por el QR de la
// tarjeta (?grupo=1) sin sesión, esto retoma lo que venía a hacer en vez de dejarlo
// parado en la pantalla de puntos sin ninguna pista.
function resumeWantedGroup(){
  if(!wantsNewGroup||!cust)return false;
  wantsNewGroup=false;
  doCreateGroupOrder();
  return true;
}
// EL GRUPO A LA VISTA (maquetas aprobadas grupo-3 y grupo-4, dueño 2026-09-30: «los pedidos
// grupales son de los que más suman»). Se ofrece al empezar a armar y en el carrito. Organizar
// exige cuenta (el servidor cobra a quien organizó); los demás entran por el enlace sin cuenta.
var grupoLlevaCarrito=false;
function empezarGrupo(conCarrito?:boolean){
  grupoLlevaCarrito=!!conCarrito;
  if(!cust){
    wantsNewGroup=true;
    showToast('Entra a tu cuenta para organizar el grupo. Los demás no necesitan cuenta.');
    swTab('points');
    return;
  }
  doCreateGroupOrder();
}
// «Convertir en grupo»: lo que ya estaba en el carrito pasa al grupo a nombre de quien organiza,
// para no elegirlo dos veces. Sale del carrito: al cerrar el grupo vuelve con todo lo demás.
async function pasarCarritoAlGrupo(){
  grupoLlevaCarrito=false;
  var nombre=(cust&&cust.name)||'Yo';
  var pasados=0;
  for(var i=0;i<cart.length;i++){
    try{await api('add-group-item',{code:groupCode,contributorName:nombre,token:token,item:cart[i]});pasados++;}
    catch(e){showToast('No se pudo pasar todo al grupo: '+e.message,'error');break;}
  }
  if(pasados===cart.length){cart=[];saveCart();}
  else cart=cart.slice(pasados);
}
function textoGrupoGratis():string{
  return'con '+ORGANIZER_FREE_MIN_SANDWICHES+', el más barato va gratis';
}
async function doCreateGroupOrder(){
  if(!cust){showToast('Inicia sesión para organizar un pedido grupal.');return;}
  busy=true;busyMsg='Creando pedido grupal...';render();
  var res;
  try{res=await api('create-group-order',{token:token});}
  catch(e){busy=false;render();showToast(e.message);return;}
  groupCode=res.code;groupData=null;groupMsg='';
  if(grupoLlevaCarrito)await pasarCarritoAlGrupo();
  busy=false;sndScreen='group_order';render();
  loadGroupOrder();
  startGroupPoll();
}
var _grpDirPedidas=false,_grpCargando=false,grupoError='';
async function loadGroupOrder(){
  if(!groupCode)return;
  _grpCargando=true;
  try{
    var res=await api('get-group-order',{token:token,code:groupCode});
    groupData=res;grupoError='';
    // El envío estimado del organizador sale de su dirección con pin (envioEstimadoGrupo).
    if(res&&res.isOrganizer&&token&&!myAddresses.length&&!_grpDirPedidas){
      _grpDirPedidas=true;
      try{myAddresses=(await api('addresses-list',{token:token})).addresses||[];}catch(e){}
    }
    render();
  }catch(e:any){
    // Antes esto echaba al inicio con un aviso fugaz, y si la pantalla ya estaba pintada sin
    // datos quedaba «QUIÉNES COMEN» en blanco (dueño, 2026-10-01). Ahora el error se queda a la
    // vista, con reintentar.
    stopGroupPoll();grupoError=e.message||'No se pudo cargar el grupo.';render();
  }finally{_grpCargando=false;}
}
function startGroupPoll(){
  stopGroupPoll();
  _groupPollTimer=setInterval(function(){if(sndScreen==='group_order')loadGroupOrder();else stopGroupPoll();},5000);
}
function stopGroupPoll(){if(_groupPollTimer){clearInterval(_groupPollTimer);_groupPollTimer=null;}}
async function submitGroupItem(item,okMsg){
  var nameEl=(document.getElementById('grp-name') as HTMLInputElement | null);
  var name=nameEl?nameEl.value.trim():groupJoinName;
  if(!name){
    // Sin nombre no se agrega: se dice con un aviso y se lleva el foco al campo (antes era una
    // línea al pie, fuera de la vista: «no deja elegir bebidas»).
    showToast('Escribe tu nombre arriba antes de agregar.','error');
    var ne=document.getElementById('grp-name') as HTMLInputElement|null;if(ne){ne.scrollIntoView({block:'center'});ne.focus();}
    return;
  }
  groupJoinName=name;
  try{localStorage.setItem('sw_group_name',name);}catch(e){}
  try{
    // Manda token (vacío si es invitado) para que el servidor sepa si quien agrega es
    // quien organizó, y así no le mande una notificación push a sí mismo.
    var r=await api('add-group-item',{code:groupCode,contributorName:name,token:token,item:item});
    if(r&&r.id&&r.llave)guardarLlave(String(r.id),String(r.llave));
    groupMsg='';
    // Agregar ya no es silencioso: se nombra lo que entró y aparece en «Lo tuyo», arriba.
    showToast(okMsg);
    loadGroupOrder();
  }catch(e){groupMsg=e.message;render();}
}
function doAddGroupItem(sigId){
  var sg=SIGS.find(function(x){return x.id===sigId;});
  submitGroupItem({type:'sig',sigId:sigId,size:groupSize,doubleProt:false,extraSauce:false,qty:1},'Agregado: '+(sg?sg.n:'tu sándwich')+' '+groupSize+'CM. Lo ves arriba, en «Lo tuyo».');
}
// Antes solo se podía agregar un Signature al pedido grupal (SIGS.filter en sGroupOrder) —
// quien solo quería sumar una bebida sin sándwich no tenía forma de hacerlo (hallazgo de
// auditoría UX). Mismo action del servidor (add-group-item -> priceCartItem ya valida
// item.type:'side' desde que existen los carritos multi-ítem), solo faltaba la UI.
function doAddGroupSide(code){
  var dd=SIDES.find(function(x){return x.id===code;});
  submitGroupItem({type:'side',code:code,qty:1},'Agregado: '+(dd?dd.l:'tu bebida')+'. Lo ves arriba, en «Lo tuyo».');
}
async function doCloseGroupOrder(){
  if(!(await showConfirm('¿Cerrar el pedido grupal y continuar a pagar todo junto?')))return;
  busy=true;busyMsg='Cerrando pedido grupal...';render();
  var res;
  try{res=await api('close-group-order',{token:token,code:groupCode});}
  catch(e){busy=false;render();showToast(e.message);return;}
  stopGroupPoll();
  busy=false;
  // Se recuerda de qué grupo salió este carrito para marcar el pedido resultante: sin esto
  // el pedido de una oficina de 6 sándwiches es indistinguible de uno normal y el canal no
  // se puede medir. Se limpia al confirmar (ver doOrder) para que no se pegue al siguiente.
  pendingGroupCode=groupCode;
  loadCart(res.items); // ya navega a o_cart y renderiza
}
async function doCancelGroupOrder(){
  if(!(await showConfirm('¿Cancelar este pedido grupal? Se perderá todo lo agregado.')))return;
  try{await api('cancel-group-order',{token:token,code:groupCode});}
  catch(e){showToast(e.message);return;}
  stopGroupPoll();
  sndScreen='o_home';render();
}
// ══ PEDIDO GRUPAL (maqueta docs/maquetas/aprobadas/pedido-grupal.png · k1.html #GR) ══════
// Papel kraft, «QUIÉNES COMEN», una fila por persona con lo que eligió, y la barra partida:
// «Cerrar y pagar» (cada uno paga lo suyo) a la izquierda, «Yo invito» a la derecha.
function wmClaro():string{
  return'<div class="wm"><img src="img/logo-avatar-96.png" alt=""><span class="tx">SND<span class="mk"><i></i><i></i></span>WCH</span></div>';
}
function linkDelGrupo():string{return location.origin+location.pathname+'?group='+encodeURIComponent(groupCode||'');}
async function copiarEnlaceGrupo(){
  var link=linkDelGrupo();
  try{await navigator.clipboard.writeText(link);showToast('Enlace copiado. Pásalo por WhatsApp.');}
  catch(e){shareGroupOrder();}
}
// Las personas del grupo, en el orden en que llegaron, con lo suyo sumado.
function gentePorPersona(g:any):{name:string,labels:string[],suma:number}[]{
  var orden:string[]=[],por:any={};
  (g.items||[]).forEach(function(it:any){
    var n=it.contributorName||'';
    if(!por[n]){por[n]={name:n,labels:[],suma:0};orden.push(n);}
    por[n].labels.push(it.label+(it.qty>1?' ×'+it.qty:''));
    por[n].suma+=it.unitPrice*it.qty;
  });
  return orden.map(function(n){return por[n];});
}
// El envío todavía no está elegido (sale de la dirección al cerrar). Al organizador se le
// estima con su primera dirección marcada en el mapa, con la MISMA fórmula que cobra el
// servidor; quien entra por el link no la conoce, y se le dice que se sabe al cerrar.
function envioEstimadoGrupo(g:any):{km:number,fee:number}|null{
  if(!g.isOrganizer)return null;
  var a=myAddresses.find(function(x:any){return typeof x.lat==='number'&&typeof x.lon==='number';});
  var km=kmADireccion(a);
  return km==null?null:{km:km,fee:deliveryFeeForKm(km)};
}
// Las cifras de esta pantalla van con dos decimales y en columna, como en la maqueta (7.00).
function d2(n:number):string{return(Math.round(n*100)/100).toFixed(2);}
function quienSoyEnElGrupo(g:any):string{
  return groupJoinName||(g.isOrganizer?(cust&&cust.name?cust.name:g.organizerName):'');
}
function sGroupOrder(){
  var g=groupData;
  var bk="stopGroupPoll();sndScreen='o_home';render()";
  if(!g){
    // Sin datos: se piden (una sola vez a la vez) y se dice qué pasa. Nunca una pantalla vacía.
    if(groupCode&&!_grpCargando&&!grupoError)setTimeout(loadGroupOrder,0);
    var estado=grupoError
      ?'<div class="aviso"><b>No pudimos cargar el grupo</b><s>'+esc(grupoError)+'</s></div>'
        +'<button class="link" onclick="grupoError=\'\';loadGroupOrder();render()"><s>Vuelve a intentarlo</s><u>Reintentar</u></button>'
      :'<div class="aviso"><s>'+(groupCode?'Cargando el grupo…':'No hay un grupo abierto.')+'</s></div>';
    return'<div class="mgr fi"><button class="sal" onclick="'+bk+'" aria-label="Volver">←</button>'+wmClaro()
      +'<div class="tit"><em>Pedido grupal</em><b>QUIÉNES<br>COMEN</b></div>'+estado+'</div>';
  }
  // Al volver a esta pantalla desde otra, el refresco automático tiene que seguir.
  if(g.status==='open'&&!_groupPollTimer)startGroupPoll();
  var abierto=g.status==='open';
  var repartido=g.status==='splitting'||(g.status==='paid'&&g.partes&&g.partes.length);
  var puedeCerrar=g.isOrganizer&&(abierto||g.canPay);
  var h;
  if(repartido){
    // La mesa cobrando (maqueta aprobada 2026-10-03, aprobadas/grupo-la-mesa-cobrando.png).
    var ps=g.partes||[];
    var pagadas=ps.filter(function(p:any){return p.paid;}).length;
    var vivas=ps.filter(function(p:any){return!p.cancelled;}).length;
    var msL=g.splitDeadline?Date.parse(g.splitDeadline)-Date.now():0;
    var minL=Math.max(0,Math.ceil(msL/60000));
    var cobrando=g.status==='splitting'&&msL>0;
    h='<div class="mgr mesa-g fi"><button class="sal" onclick="'+bk+'" aria-label="Volver">←</button>'
      +'<div class="cod">#'+esc(g.code)+'</div>'
      +'<div class="tit"><em>'+(cobrando?'Cobrando · quedan '+minL+' min':'Pedido grupal')+'</em><b>'+pagadas+' DE '+vivas+'<br>'+(pagadas===1?'YA PAGÓ':'YA PAGARON')+'</b></div>';
  }else{
    h='<div class="mgr fi"><button class="sal" onclick="'+bk+'" aria-label="Volver">←</button>'+wmClaro()
      +'<div class="tit"><em>Pedido grupal · #'+esc(g.code)+'</em><b>QUIÉNES<br>COMEN</b></div>';
  }
  // Qué está pasando, dicho arriba (dueño, 2026-10-01: «nunca compartí el enlace»; el grupo se crea
  // al tocar «Armar el grupo»). Al organizador: que ya está abierto y cómo sumar gente. A quien
  // llega por el enlace: quién lo invitó y qué hacer — casi nunca conoce SND//WCH.
  if(abierto){
    var minA=Math.max(0,Math.ceil((new Date(g.expiresAt).getTime()-Date.now())/60000));
    h+=g.isOrganizer
      ?'<p class="intro">Tu grupo está abierto '+minA+' min. Comparte el enlace para que cada uno elija lo suyo desde su celular, o agrega tú todo abajo.</p>'
      :'<p class="intro"><b>'+esc(g.organizerName||'Alguien')+'</b> armó este pedido y te invitó. Escribe tu nombre, elige lo tuyo y llega todo junto. Te quedan '+minA+' min.</p>';
  }
  if(abierto)h+='<button class="link" onclick="copiarEnlaceGrupo()"><s>'+esc(linkDelGrupo().replace(/^https?:\/\//,''))+'</s><u>Copiar enlace</u></button>';
  if(repartido){
    h+=partesDelGrupoHTML(g);
    if(cobrando)h+='<div class="reloj"><i>'+minL+'</i><span>Lo que no se pague en '+minL+' min se cancela; lo pagado sale igual, junto.</span></div>';
    var faltanPagar=ps.some(function(p:any){return!p.paid&&!p.cancelled;});
    if(g.isOrganizer&&cobrando&&faltanPagar)h+='<div class="go sw-barra"><button class="osc solo" data-accion="recordar-pagos" onclick="recordarPagosGrupo()">Recordarles por WhatsApp</button></div>';
    return h+'</div>';
  }else{
    var gente=gentePorPersona(g);
    h+='<div class="gente">'+gente.map(function(p){
      return'<div class="g"><k>'+esc((p.name.trim()[0]||'?').toUpperCase())+'</k><div class="t"><b>'+esc(p.name)+'</b><s>'+esc(p.labels.join(' + '))+'</s></div><p>'+d2(p.suma)+'</p></div>';
    }).join('');
    if(abierto){
      var ms=new Date(g.expiresAt).getTime()-Date.now();
      var min=Math.max(0,Math.ceil(ms/60000));
      // El sándwich gratis del organizador va en esta misma fila: es la razón concreta para
      // insistirle a uno más, y la maqueta no tiene otra fila donde ponerlo sin empujar el total.
      var freeAt=g.organizerFreeAt||ORGANIZER_FREE_MIN_SANDWICHES;
      var swQty=typeof g.sandwichQty==='number'?g.sandwichQty:0;
      var falta=Math.max(0,freeAt-swQty);
      h+='<div class="g esp'+(ms<120000?' urge':'')+'"><k>?</k><div class="t"><b>'+(gente.length?'¿Falta alguien?':'Nadie eligió todavía')+'</b><s>'+(min===1?'Les queda 1 minuto':'Les quedan '+min+' minutos')+'</s>'
        +'<s class="oro">'+(falta?('Faltan '+falta+' para que uno vaya gratis'):'¡Un sándwich va gratis!')+'</s></div><p>'+swQty+'/'+freeAt+'</p></div>';
    }
    h+='</div>';
  }
  h+='<div class="sello" aria-hidden="true"><img class="av" src="img/logo-avatar-96.png" alt=""><div class="wmb">SND<span class="mk"><i></i><i></i></span>WCH</div><s>TRUJILLO</s></div>';
  // Se acabó el tiempo pero el pedido no se perdió (2026-09-23): los 15 minutos significan
  // «ya no entra nadie más», se paga con los que alcanzaron y se dice por qué no hubo gratis.
  if(!abierto&&g.canPay&&!repartido){
    var faltaron=typeof g.missingForFree==='number'?g.missingForFree:0;
    h+='<div class="aviso"><b>Se acabó el tiempo para sumarse</b><s>'
      +(g.freeApplies?'Igual llegaron: el 15CM más barato no se cobra.'
        :('No llegaron a '+(g.organizerFreeAt||ORGANIZER_FREE_MIN_SANDWICHES)+' sándwiches'+(faltaron?(' — faltaron '+faltaron):'')+', así que esta vez ninguno va gratis.'))
      +' Puedes pagar con lo que hay.</s></div>';
  }
  if(!repartido&&(abierto||g.canPay)){
    var gente2=gentePorPersona(g);
    var env=envioEstimadoGrupo(g);
    var n=Math.max(1,gente2.length);
    var yo=quienSoyEnElGrupo(g);
    var mia=gente2.find(function(p){return p.name===yo;});
    h+='<div class="cta">';
    h+='<div class="l"><span>'+(env?'Envío '+env.km.toFixed(1)+' km · se parte entre todos':'Envío · se parte entre todos')+'</span><span>'+(env?d2(env.fee):'al cerrar')+'</span></div>';
    if(mia)h+='<div class="l"><span>Tu parte por ahora</span><span>'+d2(mia.suma+(env?Math.floor(env.fee*100/n)/100:0))+'</span></div>';
    h+='<div class="tt"><em>Van</em><b>'+SOLES_TXT+pz((g.total||0)+(env?env.fee:0))+'</b></div></div>';
  }
  if(abierto)h+=sumarAlGrupoHTML(g);
  else if(!g.canPay&&!repartido){
    h+='<div class="aviso"><b>'+(g.status==='cancelled'?'Este pedido grupal fue cancelado':g.status==='paid'?'Este pedido grupal ya se pagó':'Este pedido grupal ya se cerró')+'</b></div>';
  }
  if(puedeCerrar&&!repartido){
    h+='<button class="cancelar" onclick="doCancelGroupOrder()">Cancelar pedido grupal</button>';
    h+=botonesCierreGrupo();
  }
  return h+'</div>';
}
// Lo que cada uno suma (dueño, 2026-10-01). Tres cosas que faltaban:
//  · quien entra por el enlace casi nunca conoce SND//WCH: cada sándwich y cada bebida va con su
//    foto y una línea que lo vende («es oportunidad para ganar clientes»);
//  · agregar era silencioso y no se podía deshacer: ahora «Lo tuyo» va arriba, con lo que llevas,
//    y cada cosa se quita ahí mismo (remove-group-item, con la llave que dio el servidor);
//  · cada agregado se confirma con un aviso que nombra lo que entró.
function llavesDelGrupo():Record<string,string>{
  try{return JSON.parse(localStorage.getItem('sw_grp_llaves_'+(groupCode||''))||'{}')||{};}catch(e){return {};}
}
function guardarLlave(id:string,llave:string){
  var m=llavesDelGrupo();m[id]=llave;
  try{localStorage.setItem('sw_grp_llaves_'+(groupCode||''),JSON.stringify(m));}catch(e){}
}
function loTuyoHTML(g:any):string{
  var yo=quienSoyEnElGrupo(g),llaves=llavesDelGrupo();
  var mios=(g.items||[]).filter(function(it:any){return llaves[it.id]||(yo&&it.contributorName===yo);});
  if(!mios.length)return'';
  var suma=mios.reduce(function(a:number,it:any){return a+it.unitPrice*it.qty;},0);
  return'<div class="tuyo"><em>Lo tuyo · '+mios.length+(mios.length===1?' cosa':' cosas')+' · '+SOLES_TXT+pz(suma)+'</em>'
    +mios.map(function(it:any){
      var quitable=!!llaves[it.id]||!!g.isOrganizer;
      return'<div class="l"><span>'+esc(it.label)+(it.qty>1?' ×'+it.qty:'')+'</span><span class="p">'+d2(it.unitPrice*it.qty)+'</span>'
        +(quitable&&g.status==='open'?'<button onclick="quitarDelGrupo(\''+esc(String(it.id))+'\')" aria-label="Quitar '+esc(it.label)+'">Quitar</button>':'')+'</div>';
    }).join('')+'</div>';
}
function primeraFraseCorta(t:string):string{var f=primeraFrase(t||'');return f.length>110?f.slice(0,107).trim()+'…':f;}
function sumarAlGrupoHTML(g:any):string{
  var h='<div class="sumar"><em>Suma lo tuyo</em>'
    +'<input id="grp-name" aria-label="Tu nombre" placeholder="Tu nombre" autocomplete="given-name" value="'+esc(groupJoinName||(g.isOrganizer&&cust?cust.name:''))+'">'
    +loTuyoHTML(g)
    +'<div class="tam" role="radiogroup" aria-label="Tamaño">'
    +['15','30'].map(function(sz){return'<button role="radio" aria-checked="'+(groupSize===sz)+'" class="'+(groupSize===sz?'on':'')+'" onclick="groupSize=\''+sz+'\';render()">'+sz+'CM</button>';}).join('')+'</div>';
  h+='<h3>Los sándwiches</h3>'+SIGS.filter(function(s){return!s.secret&&sigAvailable(s);}).map(function(s){
    var foto=SIG_IMG[s.id]||fotoDelPlato(s.id);
    return'<div class="it">'+(foto?'<img src="'+foto+'" alt="" loading="lazy">':'')
      +'<div class="t"><b>'+esc(s.n)+'</b><s>'+esc(primeraFraseCorta(s.pitch||''))+'</s><i>'+SOLES_TXT+pz(groupSize==='15'?s.p15:s.p30)+' · '+groupSize+'CM</i></div>'
      +'<button onclick="doAddGroupItem(\''+s.id+'\')">Agregar</button></div>';
  }).join('');
  h+='<h3>Para tomar</h3>'+SIDES.filter(function(d){return isAvail(d.id);}).map(function(d){
    var foto=DRINK_IMG[d.id];
    return'<div class="it">'+(foto?'<img src="'+foto+'" alt="" loading="lazy">':'')
      +'<div class="t"><b>'+esc(d.l)+'</b><s>'+esc(primeraFraseCorta(d.d||''))+'</s><i>'+SOLES_TXT+pz(d.p)+' · 500 ml</i></div>'
      +'<button onclick="doAddGroupSide(\''+d.id+'\')">Agregar</button></div>';
  }).join('');
  return h+'<div class="msg" role="status">'+esc(groupMsg)+'</div></div>';
}
async function quitarDelGrupo(id:string){
  var llave=llavesDelGrupo()[id]||'';
  try{
    await api('remove-group-item',{token:token||'',code:groupCode,id:id,llave:llave});
    showToast('Quitado de tu pedido.');
    loadGroupOrder();
  }catch(e:any){showToast(e.message,'error');}
}
// Los dos cierres del grupo. «Cerrar y pagar»: cada uno paga lo suyo (decisión del dueño,
// 2026-09-24) — el servidor crea un pedido Yape por persona con su parte del envío
// (actions/group.ts · repartirGrupo). «Yo invito»: el organizador paga todo en un pedido.
function botonesCierreGrupo():string{
  return'<div class="go sw-barra"><button class="oro" data-accion="cerrar-y-pagar" onclick="abrirRepartoGrupo()">Cerrar y pagar</button><button class="cel" onclick="doCloseGroupOrder()">Yo invito</button></div>';
}
var repartoAddrId:any=null,repartoPhone='';
async function abrirRepartoGrupo(){
  // Quien entra por el link del grupo no pasó por el perfil: sin esto vería «guarda la
  // dirección» teniendo direcciones guardadas.
  if(!myAddresses.length){
    try{myAddresses=(await api('addresses-list',{token:token})).addresses||[];}catch(e){}
  }
  var conPin=myAddresses.filter(function(a:any){return typeof a.lat==='number'&&typeof a.lon==='number';});
  // La dirección que ya está marcada en este pedido (la del checkout) también sirve.
  var hayPinDelPedido=!!addrText&&typeof window._mLat==='number'&&typeof window._mLon==='number';
  repartoAddrId=conPin.length?conPin[0].id:(hayPinDelPedido?'__mapa':null);
  repartoPhone=cust&&cust.phone?String(cust.phone):'';
  grpPrev=null;grpHoja=false;
  sndScreen='group_split';render();
}
// ── LA MESA (maqueta aprobada 2026-10-03: aprobadas/grupo-la-mesa*.png) ──────────────────
// Antes de cobrar, quien organiza ve cuánto le llega a cada uno. Los montos NO se calculan
// acá: los da `group-split-preview`, que usa la misma función que cobra (repartirGrupo). Si la
// pantalla hiciera su propia cuenta, el día que cambie una regla mostraría un monto y cobraría
// otro. La dirección y el teléfono se cambian en una hoja («Cambiar») sin salir de la mesa.
var grpHoja=false;
var grpPrev:any=null;
function repartoDireccion():any{
  if(repartoAddrId==='__mapa')return typeof window._mLat==='number'?{label:'La de este pedido',address:addrText,reference:'',lat:window._mLat,lon:window._mLon}:null;
  var a=myAddresses.find(function(x:any){return mismoId(x.id,repartoAddrId);});
  return a&&typeof a.lat==='number'&&typeof a.lon==='number'?a:null;
}
function pedirPreviewReparto(){
  var a=repartoDireccion();
  if(!a||!groupCode)return;
  var clave=a.lat+','+a.lon+'|'+((groupData&&groupData.items)||[]).length;
  if(grpPrev&&grpPrev.clave===clave)return;
  grpPrev={clave:clave,cargando:true};
  api('group-split-preview',{token:token,code:groupCode,lat:a.lat,lon:a.lon}).then(function(r:any){
    if(!grpPrev||grpPrev.clave!==clave)return;
    grpPrev={clave:clave,partes:r.partes||[],fee:Number(r.fee)||0};
    if(sndScreen==='group_split')render();
  }).catch(function(e:any){
    if(!grpPrev||grpPrev.clave!==clave)return;
    grpPrev={clave:clave,error:(e&&e.message)||'No pudimos calcular el reparto.'};
    if(sndScreen==='group_split')render();
  });
}
function hojaDeReparto():string{
  var hayPinDelPedido=!!addrText&&typeof window._mLat==='number'&&typeof window._mLon==='number';
  var h='<div class="hoja-velo" onclick="grpHoja=false;render()"></div><div class="hoja" role="dialog" aria-label="Dónde lo dejamos"><div class="mango"></div><h3>¿Dónde lo dejamos?</h3>';
  h+='<div class="dirs" role="radiogroup" aria-label="Dirección">';
  if(hayPinDelPedido){
    var onM=repartoAddrId==='__mapa';
    h+='<button class="dl'+(onM?' on':'')+'" role="radio" aria-checked="'+onM+'" data-accion="reparto-direccion" onclick="repartoAddrId=\'__mapa\';render()"><b>La de este pedido</b><s>'+esc(addrText)+'</s></button>';
  }
  // Todas las guardadas, no solo las que tienen pin (dueño, 2026-10-01): una sin pin se ubica en
  // el mapa con un toque y queda guardada con su pin.
  h+=myAddresses.map(function(a:any){
    var pin=typeof a.lat==='number'&&typeof a.lon==='number';
    var on=pin&&mismoId(repartoAddrId,a.id);
    return pin
      ?'<button class="dl'+(on?' on':'')+'" role="radio" aria-checked="'+on+'" data-accion="reparto-direccion" onclick="repartoAddrId=\''+a.id+'\';render()"><b>'+esc(a.label)+'</b><s>'+esc(a.address)+(a.reference?' · '+esc(a.reference):'')+'</s></button>'
      :'<button class="dl" data-accion="reparto-ubicar" onclick="grpHoja=false;abrirMapaPara(\'group_split\',\''+a.id+'\','+esc(JSON.stringify(a.address||''))+')"><b>'+esc(a.label)+'</b><s>'+esc(a.address)+' · tócala para ubicarla en el mapa</s></button>';
  }).join('');
  h+='<button class="dl sin" data-accion="reparto-otra" onclick="grpHoja=false;abrirMapaPara(\'group_split\',null,\'\')"><b>Otra dirección</b><s>Búscala o márcala en el mapa</s></button></div>';
  h+='<label class="lbl" for="grp-phone">Teléfono para el repartidor</label>'
    +'<input id="grp-phone" class="inp" type="tel" inputmode="tel" autocomplete="tel" value="'+esc(repartoPhone)+'" oninput="repartoPhone=this.value">'
    +'<p class="av">El envío sale de esta dirección y se parte entre todos.</p>';
  return h+'<div class="go sw-barra"><button class="osc solo" data-accion="reparto-listo" onclick="grpHoja=false;render()"'+(repartoAddrId?'':' disabled')+'>Listo</button></div></div>';
}
function sGroupSplit(){
  var g=groupData||{};
  var a=repartoDireccion();
  if(!a)grpHoja=true;
  else setTimeout(pedirPreviewReparto,0);
  var gente=gentePorPersona(g);
  var h='<div class="mgr mesa-g fi"><button class="sal" onclick="grpHoja=false;sndScreen=\'group_order\';render()" aria-label="Volver">←</button>'
    +'<div class="cod">#'+esc(groupCode||'')+'</div>'
    +'<div class="tit"><em>Cerrar y pagar · '+gente.length+(gente.length===1?' persona':' personas')+'</em><b>LA CUENTA<br>DE LA MESA</b></div>';
  if(a){
    h+='<button class="va" data-accion="reparto-cambiar" onclick="grpHoja=true;render()"><span><b>Va a '+esc(a.label)+(a.address&&a.label!=='La de este pedido'?' · '+esc(a.address):'')+'</b>'
      +'<s>El repartidor llama a '+esc(repartoPhone||'—')+'</s></span><u>Cambiar</u></button>';
  }
  var prev=grpPrev&&a&&!grpPrev.cargando&&!grpPrev.error?grpPrev:null;
  var porNombre:any={};
  if(prev)prev.partes.forEach(function(p:any){porNombre[p.name]=p;});
  var yo=quienSoyEnElGrupo(g);
  var sw=typeof g.sandwichQty==='number'?g.sandwichQty:0;
  h+='<div class="mesa">'+gente.map(function(p){
    var pr=porNombre[p.name];
    var gratis=pr&&pr.gratis>0;
    var monto=pr?(gratis?'<s>'+SOLES_TXT+pz(pr.total+pr.gratis)+'</s>':'')+SOLES_TXT+pz(pr.total):'…';
    return'<div class="pz'+(gratis?' gratis':'')+'">'+(gratis?'<span class="tag">Gratis</span>':'')
      +'<b class="q">'+esc(p.name)+(p.name===yo?' (tú)':'')+'</b>'
      +'<span class="s">'+esc(p.labels.join(' + '))+(gratis?' · va gratis: el grupo llegó a '+sw:'')+'</span>'
      +'<span class="m">'+monto+'</span></div>';
  }).join('');
  if(prev&&prev.partes.length){
    var n=prev.partes.length,cada=Math.floor(prev.fee*100/n)/100;
    h+='<div class="pz env"><span class="s">Envío a '+esc(a.label)+'</span><span class="m">'+SOLES_TXT+pz(prev.fee)+' ÷ '+n+'</span>'
      +'<span class="s">= '+SOLES_TXT+pz(cada)+' cada uno, ya sumado'+(Math.round(cada*n*100)!==Math.round(prev.fee*100)?' (los céntimos que sobran van a quien organiza)':'')+'</span></div>';
  }
  h+='</div>';
  if(grpPrev&&grpPrev.error)h+='<div class="aviso"><b>No pudimos calcular el reparto</b><s>'+esc(grpPrev.error)+'</s></div>';
  h+='<div class="reloj"><i>'+GROUP_SPLIT_MINUTES_CLIENT+'</i><span>Al cobrar, a cada uno le llega su parte para pagar con Yape: tienen '+GROUP_SPLIT_MINUTES_CLIENT+' min. Lo que no se pague se cancela y el resto sale igual.</span></div>';
  h+='<div class="go sw-barra"><button class="oro solo" data-accion="reparto-cobrar" onclick="doSplitGroupOrder()"'+(prev?'':' disabled')+'>Cobrar a cada uno</button></div>';
  if(grpHoja)h+=hojaDeReparto();
  return h+'</div>';
}
var GROUP_SPLIT_MINUTES_CLIENT=20;
async function doSplitGroupOrder(){
  var a:any=repartoDireccion();
  if(!a){grpHoja=true;render();showToast('Elige la dirección.');return;}
  var tel=String(repartoPhone||'').trim();
  busy=true;busyMsg='Repartiendo...';render();
  try{
    await api('split-group-order',{token:token,code:groupCode,address:a.address+(a.reference?' — '+a.reference:''),lat:a.lat,lon:a.lon,contactPhone:tel});
    busy=false;grpHoja=false;grpPrev=null;sndScreen='group_order';render();
    loadGroupOrder();startGroupPoll();
  }catch(e:any){busy=false;render();showToast(e.message);}
}
// La mesa cobrando: la misma grilla dice quién ya pagó y quién falta. Cada parte se paga con
// el mismo Yape de siempre (pagarParteGrupo abre la pantalla de pedido enviado para ESA ref).
function partesDelGrupoHTML(g:any):string{
  var partes=g.partes||[];
  var yo=quienSoyEnElGrupo(g);
  return'<div class="mesa">'+partes.map(function(p:any){
    var est=p.cancelled?'<span class="est no">No pagó a tiempo</span>':p.paid?'<span class="est ok">Pagó</span>':'<span class="est falta">Falta</span>';
    var dentro=est+'<b class="q">'+esc(p.name)+(p.name===yo?' (tú)':'')+'</b><span class="m">'+SOLES_TXT+pz(p.total)+'</span>';
    if(!p.paid&&!p.cancelled&&g.status==='splitting'){
      return'<button class="pz" data-accion="pagar-parte" onclick="pagarParteGrupo(\''+esc(p.ref)+'\','+p.total+')">'+dentro+'<u>Pagar</u></button>';
    }
    return'<div class="pz'+(p.paid?' pagado':'')+(p.cancelled?' fuera':'')+'">'+dentro+'</div>';
  }).join('')+'</div>';
}
// Quien organiza les recuerda a los que faltan, con lo que debe cada uno y el enlace.
function recordarPagosGrupo(){
  var g=groupData;if(!g)return;
  var faltan=(g.partes||[]).filter(function(p:any){return!p.paid&&!p.cancelled;});
  if(!faltan.length)return;
  var msLeft=g.splitDeadline?Date.parse(g.splitDeadline)-Date.now():0;
  var text='Falta pagar tu parte del pedido SND//WCH: '+faltan.map(function(p:any){return p.name+' '+SOLES_TXT+pz(p.total);}).join(', ')
    +(msLeft>0?'. Quedan '+Math.ceil(msLeft/60000)+' min':'')+'. Se paga aquí: '+linkDelGrupo();
  if(navigator.share){navigator.share({text:text}).catch(function(){});}
  else{window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');}
}
function pagarParteGrupo(ref:string,total:number){
  window._lRef=ref;window._lTot=total;window._lPayMethod='yape';window._lPendingPayment=true;
  window._lOrderCreatedAt=Date.now();window._lPoints=0;window._lVentana='';
  receiptUploadState=null;
  stopGroupPoll();sndScreen='o_sent';render();
}

// ── MUNDO SANDO · un plato a la vez (maqueta M15, aprobada) ───────────────────────────────
// docs/maquetas/aprobadas/mundo-sando-M15.png (fuente m8.html). «Ya está resuelto» no es una
// lista para comparar: es que él ya decidió. Cada Signature ocupa la pantalla y se pasa al
// siguiente de costado; el último plato es el secreto. El orden, los nombres, las frases y los
// precios salen de la carta (sigsEnOrden, SIGS): la maqueta los trae de muestra.
function romano(n:number):string{
  var t:[number,string][]=[[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']],out='';
  t.forEach(function(p){while(n>=p[0]){out+=p[1];n-=p[0];}});
  return out;
}
function M15_PASAR(total:number,i:number,esSecreto:boolean,hayVault:boolean){
  var marcas='';
  for(var k=0;k<total;k++){
    // El secreto es el PENÚLTIMO: el último plato es «Y además» (2026-10-01).
    var ultimoVault=hayVault&&k===total-2;
    marcas+='<i class="'+(k===i?'on':(ultimoVault?'vlt':''))+'"></i>';
  }
  return'<div class="pasar" aria-hidden="true">'+marcas+'<em>'+(i===total-1?'Último':'Baja ↓')+'</em></div>';
}
// ── «Y ADEMÁS» (maqueta aprobada 2026-10-01, docs/maquetas/aprobadas/y-ademas.png) ───────
// Lo que el Mundo SANDO viejo tenía al pie y se perdió con el tarot: el grupo, las bebidas,
// los favoritos, los puntos, los pedidos y la línea legal. El MISMO contenido en los dos
// mundos (dueño: «lo compartido va en los dos»): SANDO lo recibe como última carta del mazo;
// WICHO, como hoja desde una píldora en el armador. Una sola lista: no se pueden desalinear.
var yAdemasAbierta=false;
function conCuenta(accion:string):string{
  // Puntos, pedidos y favoritos son de una cuenta: sin sesión se ofrece entrar, como la puerta.
  return cust?accion:"yAdemasAbierta=false;swTab('points')";
}
function yAdemasEntradas(desde:string){
  var bebidas=bebidasDisponibles().slice(0,3).map(function(d:any){return{p:d.p,img:DRINK_IMG[d.id]||''};});
  var desdeBeb=bebidas.length?Math.min.apply(null,bebidas.map(function(d:any){return Number(d.p)||0;})):0;
  return[
    {id:'grupo',t:'Pedido en grupo',s:'Cada uno elige lo suyo desde el enlace. '+textoGrupoGratis().replace(/^c/,'C')+'.',fn:"yAdemasAbierta=false;empezarGrupo()",grande:true},
    {id:'bebidas',t:'Bebidas',s:(bebidas.length?'Desde '+SOLES_TXT+pz(desdeBeb)+' · sueltas o en combo':'Sueltas o en combo'),fn:"yAdemasAbierta=false;irABebidas('"+desde+"')",fotos:bebidas},
    {id:'favoritos',t:'Tus favoritos',s:'Lo que guardaste, a un toque de pedirlo otra vez.',fn:conCuenta("yAdemasAbierta=false;go('p_favs')")},
    {id:'puntos',t:'Tus puntos',s:cust?'Tienes '+(cust.points||0)+'. Mira qué te falta para el siguiente.':'Cuánto tienes y qué te falta para el siguiente.',fn:conCuenta("yAdemasAbierta=false;go('p_rewards')")},
    {id:'pedidos',t:'Tus pedidos',s:'Pedir lo mismo, y en qué va el de hoy.',fn:conCuenta("yAdemasAbierta=false;loadMyOrders()")},
  ];
}
function lineaLegalYAdemas(desde:string){
  var ir=function(t:string,pantalla:string,extra?:string){
    return'<button type="button" onclick="yAdemasAbierta=false;bkTo=\''+desde+'\';sndScreen=\''+pantalla+'\';'+(extra||'')+'render()">'+t+'</button>';
  };
  return'<div class="ya-legal">'
    +'<button type="button" class="lib" data-accion="libro-de-reclamaciones" onclick="yAdemasAbierta=false;bkTo=\''+desde+'\';sndScreen=\'p_complaints\';cmplStep=\'form\';render()">Libro de Reclamaciones</button>'
    +'<div>'+ir('Términos y privacidad','p_lo_legal')+ir('Cambios y devoluciones','p_returns')+'</div>'
    +'<div><a href="https://wa.me/'+WA+'" target="_blank" rel="noopener">WhatsApp</a><a href="mailto:'+BIZ_EMAIL+'">Correo</a><a href="'+BIZ_IG+'" target="_blank" rel="noopener">Instagram</a></div>'
    +'</div>';
}
// SANDO: el último plato del mazo, en kraft como los demás.
function platoYAdemas(total:number,i:number,hayVault:boolean):string{
  var es=yAdemasEntradas('o_home');
  return'<section class="plato kraft yademas" aria-label="Y además"><div class="forro"></div>'
    +'<div class="ficha"><div class="num">Última · Y además</div><h1>Y además</h1>'
    +'<div class="ya-t">'+es.map(function(x:any){
      return'<button type="button" class="ya-k'+(x.grande?' grande':'')+'" data-accion="y-ademas-'+x.id+'" onclick="'+x.fn+'">'
        +(x.grande?'<img src="'+broPose('sando','alegre')+'" alt="" aria-hidden="true">':'')
        +'<span><b>'+esc(x.t)+'</b>'
        +(x.fotos&&x.fotos.length?'<i class="beb">'+x.fotos.map(function(d:any){return d.img?'<img src="'+d.img+'" alt="">':'';}).join('')+'</i>':'')
        +'<s>'+esc(x.s)+'</s></span></button>';
    }).join('')+'</div></div>'
    +lineaLegalYAdemas('o_home')
    +M15_PASAR(total,i,false,hayVault)
    +'</section>';
}
// WICHO: la misma lista como hoja, encima del armador (no pierde el paso).
function hojaYAdemas():string{
  if(!yAdemasAbierta)return'';
  var es=yAdemasEntradas('o_build');
  return'<div class="ya-fondo" onclick="yAdemasAbierta=false;render()"></div>'
    +'<div class="ya-hoja" role="dialog" aria-label="Y además">'
    +'<div class="ya-cab"><h2>Y además</h2><img src="'+broPose('wicho','alegre')+'" alt="" aria-hidden="true">'
    +'<button type="button" class="ya-x" onclick="yAdemasAbierta=false;render()" aria-label="Cerrar">&#10005;</button></div>'
    +'<div class="ya-lista">'+es.map(function(x:any){
      return'<button type="button" class="ya-r'+(x.grande?' grande':'')+'" data-accion="y-ademas-'+x.id+'" onclick="'+x.fn+'">'
        +'<span><b>'+esc(x.t)+'</b><s>'+esc(x.s)+'</s></span><i aria-hidden="true">→</i></button>';
    }).join('')+'</div>'
    +lineaLegalYAdemas('o_build')
    +'</div>';
}
// EL PLATO DEL PEDIDO EN GRUPO (dueño 2026-09-30: «los pedidos grupales son de los que más
// suman»; «en la 2 mejor pon solo el logo en grande»). Va segundo, justo después de la estrella:
// nadie lo pasa de largo. El pack de 5 es el mismo grupo llenado por una sola persona. La regla
// (desde cuántos, cuál va gratis) sale de la carta.
function platoGrupo(total:number,hayVault:boolean):string{
  return'<section class="plato kraft grupo" aria-label="Pedido en grupo"><div class="forro"></div>'
    +'<div class="logo" aria-hidden="true"><img src="img/logo-avatar-640.webp" alt=""></div>'
    +'<div class="ficha"><div class="num">Para varios</div>'
    +'<h1>Pedido en grupo</h1><div class="pitch">Mandas un enlace y cada uno elige el suyo desde su celular, Signature o armado. Tú pagas una vez y llega todo junto.</div>'
    +'<div class="regla">Desde '+ORGANIZER_FREE_MIN_SANDWICHES+' sándwiches, el más barato va gratis</div></div>'
    +'<div class="pie"><div class="cuenta">'
    +'<button class="solo" onclick="empezarGrupo()">O llénalo tú: pack de '+ORGANIZER_FREE_MIN_SANDWICHES+'</button>'
    +'<button class="b" onclick="empezarGrupo()">Armar el grupo</button>'
    +'</div></div>'
    +M15_PASAR(total,1,false,hayVault)
    +'</section>';
}
// ── LA CARTA DEL LADO SANDO: EL TAROT (dueño, 2026-10-01: «el concepto de la 3 está hermoso
// excepcional», docs/maquetas/aprobadas/la-carta-tarot.png). Al entrar al lado SANDO se ven
// todas las cartas en abanico y la del secreto boca abajo; al tocar una se abre SU plato a
// pantalla completa, como antes. La ✕ del plato vuelve al tarot; la del tarot, a la puerta.
var sandoEnPlatos=false;
function abrirPlato(idx:number){
  sandoEnPlatos=true;render();
  setTimeout(function(){
    var s=document.querySelectorAll('.m15 .pistas > section')[idx] as HTMLElement|undefined;
    var pistas=document.querySelector('.m15 .pistas') as HTMLElement|null;
    if(s&&pistas)pistas.scrollTop=s.offsetTop;
  },0);
}
// Primer toque: levanta la carta y marca su fila en la lista de abajo. Segundo toque: abre su
// plato. Se hace sin render() para que el abanico no vuelva a abrirse desde cero en cada toque.
// En la fila (2026-10-01): la carta del centro es la elegida. Tocarla abre su plato; tocar una del
// costado la trae al centro.
function tocarCarta(btn:HTMLElement){
  if(btn.classList.contains('sel')){abrirPlato(Number(btn.getAttribute('data-plato')));return;}
  var mano=btn.parentElement as HTMLElement|null;
  if(mano)mano.scrollTo({left:btn.offsetLeft-(mano.clientWidth-btn.offsetWidth)/2,behavior:'smooth'});
}
// Cada carta gira según su distancia al centro: al pasar de una a otra se ve voltearse. La del
// centro queda elegida y marca su fila en la lista. Se guarda dónde quedó la mano para que un
// render() (llegan la carta y el horario por red) no la devuelva al principio: eso era el «cargó
// tres veces» del dueño, junto con la animación de entrada que se repetía en cada render.
var manoScroll:number|null=null,_giroPedido=false;
function girarCartas(mano:HTMLElement){
  if(_giroPedido)return;_giroPedido=true;
  requestAnimationFrame(function(){
    _giroPedido=false;
    manoScroll=mano.scrollLeft;
    var centro=mano.scrollLeft+mano.clientWidth/2,mejor:any=null,dMin=9;
    mano.querySelectorAll('.k').forEach(function(k:any){
      var paso=k.offsetWidth+8;
      var d=Math.max(-1,Math.min(1,(k.offsetLeft+k.offsetWidth/2-centro)/paso));
      k.style.setProperty('--d',d.toFixed(3));
      if(Math.abs(d)<dMin){dMin=Math.abs(d);mejor=k;}
    });
    if(mejor&&!mejor.classList.contains('sel'))marcarCarta(Number(mejor.getAttribute('data-plato')));
  });
}
function iniciarMano(){
  var mano=document.querySelector('.mtarot .mano') as HTMLElement|null;
  if(!mano)return;
  if(manoScroll!=null)mano.scrollLeft=manoScroll;
  else{
    var e=mano.querySelector('.k.sel') as HTMLElement|null;
    if(e)mano.scrollLeft=e.offsetLeft-(mano.clientWidth-e.offsetWidth)/2;
  }
  girarCartas(mano);
}
function marcarCarta(plato:number){
  document.querySelectorAll('.mtarot .k').forEach(function(k){
    var on=Number(k.getAttribute('data-plato'))===plato;
    k.classList.toggle('sel',on);k.setAttribute('aria-pressed',String(on));
  });
  document.querySelectorAll('.mtarot .lista .fila').forEach(function(f){
    f.classList.toggle('on',Number(f.getAttribute('data-plato'))===plato);
  });
}
var NUM_PALABRA=['Ninguna','Una','Dos','Tres','Cuatro','Cinco','Seis','Siete','Ocho','Nueve','Diez'];
// LA CARTA VENDE (dueño, 2026-10-01: «si bien el concepto es hermoso debemos hacer que venda
// también»): arriba el abanico, numerado como un tarot; abajo la lista con el MISMO número, lo
// que lleva cada uno dicho para antojar (el pitch de la carta) y su precio. Tocar una fila abre
// el plato directo: quien leyó la descripción ya sabe qué está eligiendo.
function sCartaTarot(visibles:any[],secreto:any){
  var total=visibles.length+(secreto?1:0);
  var n=cart.reduce(function(a,it){return a+(it.qty||1);},0);
  // El índice del plato: el primero, después el del pedido en grupo, después el resto (ver
  // sMundoSando). El secreto es el último.
  var platoDe=function(i:number){return i===0?0:i+1;};
  var estrella=Math.max(0,visibles.findIndex(function(s:any){return s.recommended;}));
  var cartas=visibles.map(function(s:any,i:number){
    var sel=i===estrella;
    return'<button class="k'+(s.recommended?' e':'')+(sel?' sel':'')+'" onclick="tocarCarta(this)" aria-pressed="'+sel+'"'
      +' data-plato="'+platoDe(i)+'" aria-label="Carta '+romano(i+1)+': '+esc(s.n)+', '+SOLES_TXT+pz(s.p15)+'">'
      +'<u>'+romano(i+1)+'</u>'
      +(fotoDelPlato(s.id)?'<img src="'+(SIG_IMG[s.id]||fotoDelPlato(s.id))+'" alt="">':'<span class="sinfoto"></span>')
      +'<b>'+esc(s.n)+'</b><s>'+SOLES_TXT+pz(s.p15)+'</s>'+(s.recommended?'<i>★</i>':'')+'</button>';
  }).join('');
  var filas=visibles.map(function(s:any,i:number){
    var sel=i===estrella;
    return'<button class="fila'+(sel?' on':'')+'" data-plato="'+platoDe(i)+'" onclick="abrirPlato('+platoDe(i)+')">'
      +'<u>'+romano(i+1)+'</u><span class="t"><b>'+esc(s.n)+(s.recommended?' <em>★ La estrella</em>':'')+'</b>'
      +'<span class="d">'+esc(s.pitch||'')+'</span>'
      +'<span class="p">'+SOLES_TXT+pz(s.p15)+' · 30CM '+SOLES_TXT+pz(s.p30)+'</span></span><span class="ir" aria-hidden="true">→</span></button>';
  }).join('');
  if(secreto){
    var myTotal=cust?(cust.total_orders||0):0;
    var falta=Math.max(0,secreto.minOrders-myTotal);
    var abierto=!!cust&&falta===0;
    var pSec=visibles.length+1;
    cartas+='<button class="k x" onclick="tocarCarta(this)" aria-pressed="false"'
      +' data-plato="'+pSec+'" aria-label="Carta '+romano(total)+': el sándwich secreto, '+(abierto?'abierto':'boca abajo')+'"><u>'+romano(total)+'</u><span class="luna" aria-hidden="true">☾</span><em>'+(abierto?'Ya es tuya':'Boca abajo')+'</em></button>';
    filas+='<button class="fila x" data-plato="'+pSec+'" onclick="abrirPlato('+pSec+')">'
      +'<u>'+romano(total)+'</u><span class="t"><b>El sándwich secreto</b>'
      +'<span class="d">No está en la carta y cambia cada mes. No se dice qué lleva: se revela cuando lo pides.</span>'
      +'<span class="p">'+(abierto?'Ya es tuyo · '+SOLES_TXT+pz(secreto.p15):'Se da vuelta en tu pedido número '+secreto.minOrders+(cust?' · te '+(falta===1?'falta 1':'faltan '+falta):''))+'</span></span><span class="ir" aria-hidden="true">→</span></button>';
  }
  // «Y además» (maqueta aprobada 2026-10-01): la última carta, después del secreto. Su plato es
  // el último de la pila (grupo y secreto incluidos).
  var pYa=visibles.length+1+(secreto?1:0);
  cartas+='<button class="k y" onclick="tocarCarta(this)" aria-pressed="false" data-plato="'+pYa+'" data-accion="carta-y-ademas" aria-label="Última carta: y además">'
    +'<u>+</u><span class="ya-ic" aria-hidden="true">&#8230;</span><b>Y además</b><s>Grupo · bebidas · tus cosas</s></button>';
  filas+='<button class="fila" data-plato="'+pYa+'" onclick="abrirPlato('+pYa+')">'
    +'<u>+</u><span class="t"><b>Y además</b><span class="d">Pedido en grupo, bebidas, tus favoritos, tus puntos y tus pedidos.</span></span><span class="ir" aria-hidden="true">→</span></button>';
  var cuantas=NUM_PALABRA[visibles.length]||String(visibles.length);
  return'<div class="mtarot fi">'
    +'<div class="riel"><button class="x" onclick="volverALaPuerta()" aria-label="Cambiar de lado">&#10005;</button>'
    +'<span class="wm">SND<span class="wm-mark" aria-hidden="true"><i></i><i></i></span>WCH</span>'
    +(n?'<button class="c" onclick="go(\'o_cart\')" aria-label="Tu pedido, '+n+(n===1?' cosa':' cosas')+'"><span>'+n+'</span></button>':'<span class="vacio"></span>')
    +'</div>'
    +'<div class="cab"><h1>Elige tu carta</h1><p>'+cuantas+' a la vista.'+(secreto?' La '+(total===7?'séptima':'última')+', boca abajo.':'')+'</p></div>'
    +'<div class="mano" onscroll="girarCartas(this)">'+cartas+'</div>'
    +'<p class="pista">Desliza para pasar de carta. Toca la del centro y es tuya.</p>'
    +'<div class="lista"><h2>Lo que dice cada carta</h2>'+filas+'</div>'
    +'</div>';
}
function sMundoSando(){
  var visibles=sigsEnOrden(SIGS.filter(function(x){return!x.secret&&sigAvailable(x);}));
  var secreto=SIGS.find(function(s){return s.secret;});
  if(!sandoEnPlatos)return sCartaTarot(visibles,secreto);
  // +1: el plato del pedido en grupo, que va segundo (ver platoGrupo).
  var total=visibles.length+1+(secreto?1:0)+1;
  var sirve=broPose('sando','cuerpo');
  var platos=visibles.map(function(s,i){
    var av=sigInStock(s);
    var marca=s.recommended?'La estrella':(sigBadge(s)||'');
    // Escasez REAL: lo que el dueño contó al abrir (quedanHoy). Manda sobre la etiqueta.
    if(av&&quedanHoy(s.prot))marca='Quedan '+quedanHoy(s.prot)+' hoy';
    // El plato de cada Signature va en KRAFT, el papel de la bolsa y del ticket (dueño,
    // 2026-09-30: «no estoy eligiendo color de todo el mundo pero sí de sus sándwiches… elegí
    // kraft»). El secreto conserva su noche morada.
    return'<section class="plato kraft" aria-label="'+esc(s.n)+'"><div class="forro"></div>'
      +'<div class="foto">'+(fotoDelPlato(s.id)?'<img src="'+fotoDelPlato(s.id)+'" alt="" '+(i>0?'loading="lazy"':'')+(av?'':' style="filter:grayscale(1)"')+'>':'')+'<div class="baja"></div></div>'
      +'<img class="sirve" src="'+sirve+'" alt="" aria-hidden="true">'
      +'<div class="ficha"><div class="num">'+romano(i+1)+' de '+romano(visibles.length)+(marca?'<b>'+esc(marca)+'</b>':'')+'</div>'
      +'<h1>'+esc(s.n)+'</h1><div class="pitch">'+esc(s.pitch||'')+'</div></div>'
      +'<div class="pie"><div class="puno"></div><div class="cuenta">'
      +'<div class="p">'+SOLES_TXT+pz(s.p15)+'<s>30CM · '+SOLES_TXT+pz(s.p30)+'</s></div>'
      +(av?'<button class="b" onclick="startOrderWithSig(\''+s.id+'\')">Lo quiero</button>':'<button class="b" disabled>Agotado</button>')
      +'</div></div>'
      +M15_PASAR(total,i===0?0:i+1,false,!!secreto)
      +'</section>'
      +(i===0?platoGrupo(total,!!secreto):'');
  }).join('');
  var platoSecreto='';
  if(secreto){
    var myTotal=cust?(cust.total_orders||0):0;
    var falta=Math.max(0,secreto.minOrders-myTotal);
    var abierto=!!cust&&falta===0;
    var hechos=Math.min(myTotal,secreto.minOrders);
    platoSecreto='<section class="plato v'+(abierto?' abierto':'')+'" aria-label="El sándwich secreto"><div class="forro"></div>'
      +'<div class="foto">'+(fotoDelPlato(secreto.id)?'<img src="'+fotoDelPlato(secreto.id)+'" alt="" loading="lazy">':'')+'<div class="baja"></div></div>'
      // El ojo espiral suelto sobre la foto borrosa se veía pegado (dueño 2026-09-30): se quitó.
      +'<div class="ficha"><div class="num">'+romano(total)+' de '+romano(total)+'<b>'+(abierto?'Abierto':'Cerrado')+'</b></div>'
      +'<h1>El sándwich<br>secreto</h1>'
      +'<div class="pitch">'+(abierto?'Ya es tuyo. Se revela cuando lo abres.':'No está en la carta. Cambia cada mes. No se dice qué lleva — se revela cuando lo pides.')+'</div>'
      +(abierto?'':'<div class="barra"><b style="width:'+Math.round(hechos/Math.max(1,secreto.minOrders)*100)+'%"></b></div>'
        +'<div class="falta">'+hechos+' de '+secreto.minOrders+' pedidos</div>')
      +'</div>'
      +'<div class="pie"><div class="puno"></div><div class="cuenta">'
      +(abierto
        ?'<div class="p">'+SOLES_TXT+pz(secreto.p15)+'<s>el mes que corre</s></div><button class="b" onclick="go(\'o_secreto\')">Abrirlo</button>'
        :'<div class="p">Te faltan '+falta+' '+(falta===1?'pedido':'pedidos')+'<s>y se abre solo</s></div>')
      +'</div></div>'
      +M15_PASAR(total,total-2,true,true)
      +'</section>';
  }
  var n=cart.reduce(function(a,it){return a+(it.qty||1);},0);
  return'<div class="m15 fi">'
    +'<div class="riel"><button class="x" onclick="sandoEnPlatos=false;render()" aria-label="Volver a las cartas">&#10005;</button>'
    +'<span class="wm">SND<span class="wm-mark" aria-hidden="true"><i></i><i></i></span>WCH</span>'
    +(n?'<button class="c" onclick="go(\'o_cart\')" aria-label="Tu pedido, '+n+(n===1?' cosa':' cosas')+'"><span>'+n+'</span></button>':'<span class="vacio"></span>')
    +'</div>'
    +'<div class="pistas">'+platos+platoSecreto+platoYAdemas(total,total-1,!!secreto)+'</div>'
    +'</div>';
}

// ── 01 · FICHA DE UN SIGNATURE (aprobada) + la fila de doble proteína ─────────────────────
// docs/maquetas/aprobadas/01-ficha-de-un-signature.png y 01-ficha-con-doble-proteina.png.
// Lo que lleva sale de la receta (proteína, queso, verdes, salsa); el precio, de
// itemUnitPrice() — el mismo que cobra el servidor. «Lo quiero» lo suma al pedido.
function nombreDe(lista:any[],id:string|null|undefined):string{
  var x=id?lista.find(function(y){return y.id===id;}):null;
  return x?x.l:'';
}
function nombreIngrediente(id:string):string{
  return nombreDe(TOPS,id)||nombreDe(SAUCES,id)||nombreDe(CHEESE,id)||id;
}
function sinTexto(ids:string[]):string{
  return 'sin '+ids.map(function(id){return nombreIngrediente(id).toLowerCase();}).join(', sin ');
}
function alternarSin(id:string){
  var i=sinIng.indexOf(id);
  if(i>=0)sinIng.splice(i,1);else sinIng.push(id);
  render();
}
// EL COMBO A LA VISTA EN LA FICHA (dueño 2026-09-30, del estudio de Subway): cuánto sale con
// la bebida más barata de hoy, con el descuento del combo ya aplicado. La cifra sale de las
// mismas funciones que cobra el carrito, nunca escrita.
function conBebidaTexto(precio:number):string{
  var lista=bebidasDisponibles();
  if(!lista.length)return'';
  var min=Math.min.apply(null,lista.map(function(d){return precioEnCombo(d);}));
  return'<s>Con bebida '+SOLES_TXT+pz(money(precio+min))+'</s>';
}
function sOSig(){
  var s=SIGS.find(function(x){return x.id===sigId;});
  if(!s){go('o_home');return'';}
  if(!size)size='15';
  var visibles=sigsEnOrden(SIGS.filter(function(x){return!x.secret&&sigAvailable(x);}));
  var i=visibles.findIndex(function(x){return x.id===s.id;});
  var marca=s.recommended?'La estrella':(sigBadge(s)||'');
  var pr=PROTS.find(function(x){return x.id===s.prot;});
  var queso=s.fixedCheese||cheese;
  var filas:[string,string][]=[];
  if(pr)filas.push(['Proteína',pr.l+(pr.s?' · '+pr.s.toLowerCase():'')]);
  if(queso)filas.push(['Queso',nombreDe(CHEESE,queso)]);
  if(s.tops&&s.tops.length)filas.push(['Verdes',s.tops.map(function(t){return nombreDe(TOPS,t);}).filter(Boolean).join(' · ')]);
  filas.push(['Salsa',s.sauces&&s.sauces.length?s.sauces.map(function(t){return nombreDe(SAUCES,t);}).filter(Boolean).join(' · '):'Sin salsa']);
  var tam=function(sz){
    var p=itemUnitPrice({type:'sig',sigId:s.id,size:sz,doubleProt:false,extraSauce:false,cheese:cheese,qty:1});
    return'<button class="'+(size===sz?'on':'')+'" aria-pressed="'+(size===sz)+'" onclick="size=\''+sz+'\';render()">'+sz+'CM<s>'+SOLES_TXT+pz(p)+'</s></button>';
  };
  // QUITAR (dueño 2026-09-30): cada vegetal, salsa y el queso fijo se pueden sacar; nada se
  // agrega. El pan y la proteína no se quitan: sin ellos ya no es ese Signature.
  var quitables:string[]=[].concat(queso?[queso]:[],s.tops||[],s.sauces||[]).filter(Boolean);
  var quitar=quitables.length?'<div class="quita"><em>¿Le quitas algo?</em><div class="ops">'
    +quitables.map(function(id){var fuera=sinIng.indexOf(id)>=0;
      return'<button aria-pressed="'+fuera+'" class="'+(fuera?'off':'')+'" onclick="alternarSin(\''+id+'\')">'+(fuera?'Sin ':'')+esc(nombreIngrediente(id).toLowerCase())+'</button>';}).join('')
    +'</div></div>':'';
  var dbl=dblProtRef();
  var fila='';
  if(dbl){
    var recargo=dblFee(dbl,size);
    fila='<button class="dp" aria-pressed="'+(!!doubleProt)+'" onclick="doubleProt=!doubleProt;render()">'
      +'<span><em>Doble proteína</em><n>El doble de '+esc((dbl.l||'').toLowerCase())+'</n></span>'
      +'<span class="r">+'+SOLES_TXT+pz(recargo)+'<span class="sw"></span></span></button>';
  }
  return'<div class="f01 fi"><div class="forro"></div>'
    // En escritorio la foto es media pantalla de alto completo: ahí va la vertical, que muestra
    // el sándwich entero (la apaisada se recortaría por las puntas otra vez).
    +'<div class="foto">'+(SIG_IMG[s.id]?'<picture>'+(fotoDelPlato(s.id)!==SIG_IMG[s.id]?'<source media="(min-width:900px)" srcset="'+fotoDelPlato(s.id)+'">':'')+'<img src="'+SIG_IMG[s.id]+'" alt="'+esc(s.n)+'"></picture>':'')+'</div>'
    +'<button class="sal" onclick="'+(editingItemQty?'cancelarEdicionFicha()':'go(\'o_home\')')+'" aria-label="Volver">←</button>'
    +'<div class="cuerpo"><div class="num">'+(i>=0?romano(i+1):'')+(marca?' · '+esc(marca):'')+'</div>'
    +'<h1>'+esc(s.n)+'</h1>'
    +filas.map(function(f){return'<div class="fila"><em>'+f[0]+'</em><span>'+esc(f[1])+'</span></div>';}).join('')
    +quitar
    +'<div class="tam">'+tam('15')+tam('30')+'</div>'
    +fila
    +'</div>'
    +'<div class="pie sw-barra"><span class="p">'+SOLES_TXT+pz(itemUnitPrice(currentBuiltItem()))+conBebidaTexto(itemUnitPrice(currentBuiltItem()))+'</span>'
    +'<button onclick="loQuiero()">'+(editingItemQty?'Listo':'Lo quiero')+'</button></div>'
    +'</div>';
}
// «Lo quiero»: suma el sándwich al pedido. Si el pedido todavía no trae bebida y hay alguna,
// pasa por las bebidas (con «Sigo sin bebida»); si no, directo a la 30G. Lo usan la ficha y el
// último paso del armador, así que los dos caminos llegan igual al pedido.
var ofrecerBebida=false;
function loQuiero(){
  var editando=!!editingItemQty;
  var wasEmpty=cart.length===0;
  // Una línea editada vuelve a SU lugar del recibo, no al final.
  if(_lineaEnEdicion)cart.splice(_lineaEnEdicion.idx,0,currentBuiltItem());else cart.push(currentBuiltItem());
  _lineaEnEdicion=null;
  editingItemQty=null;
  if(wasEmpty)initCheckoutFields();
  resetBuilder();mode=null;
  saveCart();
  if(!editando)fbTrack('AddToCart',{currency:'PEN',value:money(itemUnitPrice(cart[cart.length-1]))});
  var traeBebida=cart.some(function(it){return it.type==='side';});
  var hayBebida=SIDES.some(function(d){return isAvail(d.id);});
  if(!editando&&!traeBebida&&hayBebida){ofrecerBebida=true;irABebidas('o_cart');return;}
  go('o_cart');
}
// Salir de la ficha mientras se edita una línea: la línea vuelve al pedido tal como estaba.
var _lineaEnEdicion:any=null;
function cancelarEdicionFicha(){
  if(_lineaEnEdicion){cart.splice(_lineaEnEdicion.idx,0,_lineaEnEdicion.item);saveCart();}
  _lineaEnEdicion=null;editingItemQty=null;resetBuilder();mode=null;go('o_cart');
}
