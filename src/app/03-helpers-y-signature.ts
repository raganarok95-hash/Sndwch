// HTML HELPERS
// Logotipo — un solo lugar para las 3 versiones que antes vivían duplicadas (header de
// cada pantalla, splash de carga, pantalla de pedido confirmado): mismo tracking ajustado
// en SND/WCH con el "//" con su propio respiro, y una sombra sutil solo en los tamaños
// grandes (hero) para que se sienta como un logotipo y no como texto de header reciclado.
function WORDMARK(size,hero?){
  return'<span style="font-family:\'Fraunces\',serif;font-optical-sizing:auto;font-size:'+size+'px;font-weight:620;color:var(--sw-text,#FFFFFF);letter-spacing:.02em;line-height:1">SND<span class="wm-mark" aria-hidden="true"><i></i><i></i></span>WCH</span>';
}
function H(sub?,bk?,showCart?){
  var b=bk?'<button onclick="'+bk+'" style="all:unset;cursor:pointer;color:var(--sw-text-muted,#A8C8B0);font-family:\'EB Garamond\',serif;font-size:20px;padding:0 14px 0 0;flex-shrink:0">←</button>':'';
  var sz=sub?26:40;
  var s2=sub?'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:'+GOLD+';letter-spacing:.18em;text-transform:uppercase;margin-top:3px">'+sub+'</div>':'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.04em;margin-top:4px">Build your own bite</div>';
  // Ícono de carrito persistente mientras se navega el menú (armar un build, agregar
  // sides) — antes solo se veía cuántos items tenías en el carrito volviendo al home.
  var cartIcon=(showCart&&cart.length)?'<button onclick="go(\'o_cart\')" aria-label="Ver carrito" style="all:unset;cursor:pointer;position:relative;flex-shrink:0;padding:6px 10px;background:var(--sw-card,#2D5246);border-radius:8px;display:flex">'+icon('cart',18,'#F2F0EB')+'<span style="position:absolute;top:-4px;right:2px;background:'+GOLD+';color:#0d0d0d;font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;font-weight:700;border-radius:8px;padding:1px 5px;min-width:14px;text-align:center">'+cart.reduce(function(s,it){return s+it.qty;},0)+'</span></button>':'';
  // Toggle claro/oscuro — antes SOLO existía en sAdminHome, así que un operador en
  // cualquiera de las 14 pantallas secundarias del admin (Inventario, Catálogo, Ficha de
  // cliente, etc.) tenía que volver a la cola primero para cambiar de tema (hallazgo de
  // auditoría visual, ALTO). H() es el header compartido de esas 14 pantallas — agregarlo
  // acá, condicionado a estar en una pantalla admin, lo hace alcanzable desde cualquiera.
  var lightToggle=sndScreen.indexOf('admin')===0?'<button onclick="toggleAdminLight()" title="Modo claro/oscuro" aria-label="Cambiar modo claro/oscuro" style="all:unset;cursor:pointer;font-size:16px;width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">'+icon(adminLightMode?'moon':'sun',16)+'</button>':'';
  // Mismo criterio que lightToggle arriba: antes saltar de una herramienta admin a otra
  // (ej. Inventario → Reportes) exigía volver primero a admin_home. No se muestra en
  // admin_home mismo porque esa pantalla ya tiene el grid completo visible arriba de la
  // cola (ver adminToolsGridHTML/reordenamiento en sAdminHome) — hallazgo de auditoría
  // UX, confirmado por el dueño.
  var toolsNav=(sndScreen.indexOf('admin')===0&&sndScreen!=='admin_home')?'<button onclick="toggleAdminToolsDrawer()" title="Herramientas" aria-label="Abrir navegación de herramientas" style="all:unset;cursor:pointer;font-size:16px;width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">'+icon('grid',16)+'</button>':'';
  return'<div style="padding:20px 20px 16px;border-bottom:1px solid var(--sw-border,#3A6B58);display:flex;align-items:center;flex-shrink:0">'+b+'<div style="flex:1"><div style="line-height:1">'+WORDMARK(sz)+'</div>'+s2+'</div>'+cartIcon+toolsNav+lightToggle+'</div>';
}
function NAV(){
  var oa=sndTab==='order';
  // Pestaña inactiva subida de #666 a #999 sobre este fondo casi negro (rgba(11,11,11,.97))
  // — #666 daba ~3.4:1, bajo el 4.5:1 mínimo AA para texto normal; esta barra fija aparece
  // en casi toda pantalla secundaria (auditoría UX/accesibilidad, P1). #999 da ~5.9:1.
  function nb(t,l,a){return'<button onclick="swTab(\''+t+'\')" style="all:unset;cursor:pointer;flex:1;padding:12px 0;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:14px;letter-spacing:.04em;color:'+(a?'#fff':'#999')+'">'+l+(a?' <span class="cut-sep" style="color:'+GOLD+'">//</span>':'')+'</div><div style="width:4px;height:4px;border-radius:50%;background:'+GOLD+';opacity:'+(a?1:0)+'"></div></button>';}
  // class="bottom-nav" para poder ocultarla desde CSS cuando se abre el teclado virtual:
  // medido a 320x330 (alto típico con teclado Android), esta barra caía justo encima del
  // campo de teléfono del checkout y tapaba el de nombre — el primer formulario que ve un
  // cliente nuevo. Ver el listener de visualViewport en INIT.
  return'<div class="bottom-nav" style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(11,11,11,.97);border-top:1px solid var(--sw-border-soft,#1c1c1c);display:flex;padding-bottom:calc(0px + env(safe-area-inset-bottom,0px));z-index:100">'+nb('order','Pedido',oa)+nb('points','Puntos',!oa)+'</div>';
}
// Pie de contacto — datos del comercio, redes sociales y links legales. Requisito de
// Culqi para aprobar el comercio en producción (y buena práctica de por sí): un cliente
// debe poder identificar quién opera la web sin tener que abrir WhatsApp primero.
// Vive solo en el home (la primera pantalla que ve cualquiera, con o sin cuenta) para no
// repetir el mismo bloque en cada pantalla de la app.
function contactFooterHTML(){
  var igIcon='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>';
  return'<div style="margin-top:28px;padding-top:20px;border-top:1px solid var(--sw-bg,#1E3932)">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:12px">Contacto //</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:2.1">'
    +'<div style="display:flex;align-items:center;gap:7px">'+icon('direccion',13,'#A8C8B0')+'Delivery — '+BIZ_CITY+'</div>'
    +'<div style="display:flex;align-items:center;gap:7px">'+icon('mail',13,'#A8C8B0')+'<a href="mailto:'+BIZ_EMAIL+'" style="color:var(--sw-text-muted,#A8C8B0);text-decoration:none">'+BIZ_EMAIL+'</a></div>'
    +'<div style="display:flex;align-items:center;gap:7px">'+icon('chat',13,'#A8C8B0')+'<a href="https://wa.me/'+WA+'" target="_blank" rel="noopener" style="color:var(--sw-text-muted,#A8C8B0);text-decoration:none">+51 930 957 640</a></div>'
    +'</div>'
    +'<a href="'+BIZ_IG+'" target="_blank" rel="noopener" aria-label="Instagram" style="margin-top:14px;width:34px;height:34px;border-radius:50%;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);display:flex;align-items:center;justify-content:center;text-decoration:none;color:'+GOLD+'">'+igIcon+'</a>'
    +'<div style="display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:18px">'
    // <button> y no <span onclick>: son navegables con teclado y las anuncia un lector de
    // pantalla. El del Libro de Reclamaciones es obligatorio por ley para TODO consumidor y
    // medía 10px de alto con letra de 9px — inalcanzable para quien no usa mouse y apenas
    // legible a brillo de calle. Ahora 12px de texto y 44px de área táctil.
    +legalFooterLink('Términos','p_legal')
    +legalFooterLink('Cambios y devoluciones','p_returns')
    +legalFooterLink('Libro de reclamaciones','p_complaints',"cmplStep='form';")
    +'</div>'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:8px;color:#4A5A52;margin-top:16px;letter-spacing:.04em">'+esc(BIZ_NAME)+' · RUC '+BIZ_RUC+'</div>'
    // Sello del build al pie. Deliberadamente discreto (8px, gris del pie) — no le dice
    // nada a un cliente, pero contesta de un vistazo "¿qué versión tienes tú instalada?"
    // sin necesitar la consola del navegador ni tener el teléfono en la mano.
    +'<div style="font-family:\'EB Garamond\',serif;font-size:8px;color:#3E4C46;margin-top:4px;letter-spacing:.04em">v '+esc(APP_BUILD)+'</div>'
    +'</div>';
}
// Fila compacta de enlaces legales, reutilizable fuera del home. El Libro de
// Reclamaciones vivía SOLO en el footer del home (contactFooterHTML), o sea que no era
// alcanzable desde el carrito, el checkout ni la confirmación — justo las pantallas donde
// nace un reclamo. Indecopi exige que el aviso esté en lugar visible y fácilmente
// accesible, y esa obligación se extiende a apps y a cualquier canal digital. Lo mismo
// para "Cambios y devoluciones": el consumidor tiene derecho a conocer las condiciones de
// contratación ANTES de pagar, no después.
//
// Se emiten como <button> reales, no <span onclick>: son navegables con teclado y las
// anuncia un lector de pantalla. La versión del footer usaba spans y por eso el Libro de
// Reclamaciones era inalcanzable para quien no usa mouse — que es precisamente el
// consumidor al que la ley más protege.
function legalFooterLink(label,screen,extra?){
  return'<button type="button" onclick="bkTo=\'o_home\';sndScreen=\''+screen+'\';'+(extra||'')+'render()" style="all:unset;cursor:pointer;font-family:\'EB Garamond\',serif;font-weight:600;font-size:12px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.04em;text-decoration:underline;min-height:44px;padding:4px 2px;display:inline-flex;align-items:center">'+label+' <span class="cut-sep" style="color:'+GOLD+'">//</span></button>';
}
function legalLinksHTML(backTo){
  function lnk(label,screen,extra?){
    return'<button type="button" onclick="bkTo=\''+backTo+'\';sndScreen=\''+screen+'\';'+(extra||'')+'render()" style="all:unset;cursor:pointer;font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.06em;text-decoration:underline;padding:6px 2px;min-height:24px;display:inline-flex;align-items:center">'+label+' <span class="cut-sep" style="color:'+GOLD+'">//</span></button>';
  }
  return'<div style="display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:14px;justify-content:center">'
    +lnk('Cambios y devoluciones','p_returns')
    +lnk('Libro de reclamaciones','p_complaints','cmplStep=\'form\';')
    +'</div>';
}
function AB(t,can?,bk?,nfn?,nl?,hint?){
  var bb=bk?'<button onclick="'+bk+'" style="all:unset;cursor:pointer;border:1px solid var(--sw-border,#3A6B58);color:var(--sw-text-muted,#A8C8B0);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;letter-spacing:.1em;padding:12px 16px;border-radius:8px;flex-shrink:0">← Atrás</button>':'';
  var tt=t?'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:8px;color:'+GOLD+';letter-spacing:.2em">Total //</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:24px;font-weight:640;color:var(--sw-text,#FFFFFF)">'+SOLES+'<span style="color:'+GOLD+'">'+t+'</span></div>':'';
  // Sombra hacia arriba (en vez de solo un hairline) para separar la barra fija del
  // contenido que se desliza debajo — antes ambos quedaban al mismo plano visual.
  // Botón principal: relleno dorado plano cuando está activo, sin degradado ni resplandor
  // — la barra de acción en sí (borde superior + fondo casi negro) ya la distingue como
  // LA acción de la pantalla, no hace falta un efecto extra en el botón (dirección Prada
  // Caffè: selección/énfasis se comunican con color plano y borde, nunca con glow).
  // Hint bajo la barra cuando el botón está deshabilitado — explica QUÉ falta en vez de
  // dejar un botón gris sin razón visible (hallazgo de auditoría UX, severidad BAJA).
  var hintRow=(!can&&hint)?'<div style="position:fixed;bottom:66px;left:50%;transform:translateX(-50%);width:100%;max-width:480px;padding:0 20px;text-align:right;pointer-events:none"><span style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);background:rgba(11,11,11,.9);padding:4px 10px;border-radius:6px">'+esc(hint)+'</span></div>':'';
  return hintRow+'<div style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(11,11,11,.97);border-top:1px solid var(--sw-border-soft,#1c1c1c);padding:12px 20px;display:flex;gap:10px;align-items:center;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:100"><div style="flex:1">'+tt+'</div>'+bb+'<button onclick="'+(can?nfn:'')+'" '+(can?'':'disabled')+' style="all:unset;cursor:'+(can?'pointer':'not-allowed')+';background:'+(can?GOLD:'#1E3932')+';color:'+(can?'#241a08':'#4A7A68')+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;letter-spacing:.05em;padding:13px 0;border-radius:8px;text-align:center;flex:1">'+(nl||'Continuar //')+'</button></div>';
}
// Barra de acento a la izquierda de una tarjeta seleccionada — repetida en todos los
// selectores tipo tarjeta (tamaño, signature, pan, proteína, topping, queso, salsa, extra).
function selBar(sel){return sel?'<div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:'+GOLD+';border-radius:10px 0 0 10px"></div>':'';}
// Badge visible de un Signature: 'Nuevo' (u otro badge temporal futuro) solo mientras
// newUntil no haya pasado, si no el badge permanente en s.badge — evita que un badge de
// novedad se quede pegado para siempre (hallazgo de auditoría de copy, BAJO).
function sigBadge(s){return(s.newUntil&&Date.now()<new Date(s.newUntil+'T23:59:59').getTime())?'Nuevo':s.badge;}
// Distinto de `newUntil` (que solo cambia el texto del badge, nunca oculta el ítem) —
// `availableUntil` es para variantes de temporada de verdad: el Signature entero deja de
// listarse/pedirse al pasar la fecha. Espejo server-side: SIG_AVAILABILITY en catalog.ts.
function sigAvailable(s){return!s.availableUntil||Date.now()<new Date(s.availableUntil+'T23:59:59').getTime();}
// `thumb` (opcional, HTML de un <img> ya armado) muestra una miniatura a la izquierda —
// mismo patrón que ya usaba la lista de Signature builds. Sin thumb, la tarjeta se ve
// exactamente igual que antes (bases nunca tienen foto propia, solo proteínas).
function CARD(item,sel,fn,right?,thumb?){
  var inner='<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+item.l+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+item.s+'</span>'+(right||'')+'</div>'+(item.d?'<p style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">'+item.d+'</p>':'');
  return'<div onclick="'+fn+'" style="background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'var(--sw-border,#3A6B58)')+';border-radius:10px;padding:14px 16px;cursor:pointer;margin-bottom:10px;position:relative;transition:all .15s;box-shadow:'+SHADOW_SM+'">'+selBar(sel)+(thumb?'<div style="display:flex;gap:14px">'+thumb+'<div style="flex:1;min-width:0">'+inner+'</div></div>':inner)+'</div>';
}
function ST(n,t,s?){return'<div style="margin-bottom:20px"><h2 style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:21px;font-weight:640;color:#fff;letter-spacing:.02em;line-height:1.15;text-wrap:balance">'+(n?n+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>':'')+t+'</h2>'+(s?'<p style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:5px">'+s+'</p>':'')+'</div>';}
// font-size:16px a propósito (no 14px) — iOS Safari hace zoom automático al enfocar
// cualquier input con font-size menor a 16px, lo que rompe el layout del checkout en
// la mayoría de teléfonos de los clientes.
// `ac` = valor de autocomplete (name/tel/email/street-address...). Sin él el navegador no
// puede autocompletar y se incumple WCAG 1.3.5 (identificar el propósito del campo); en un
// checkout donde se escribe nombre, teléfono y dirección a mano en el celular, además es
// fricción pura.
function INP(id,ph,type?,val?,iconName?,ac?){
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
  return'<div style="position:relative">'
    +(iconName?'<div style="position:absolute;left:15px;top:50%;transform:translateY(-50%);pointer-events:none;opacity:.55">'+icon(iconName,16,'#A8C8B0')+'</div>':'')
    +'<input id="'+id+'" type="'+(type||'text')+'"'+numAttrs+acAttr+' aria-label="'+esc(lbl)+'" placeholder="'+ph+'" value="'+esc(val||'')+'" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px 14px '+padLeft+';color:var(--sw-text,#FFFFFF);width:100%;font-size:16px;caret-color:'+GOLD+';box-shadow:'+SHADOW_SM+';box-sizing:border-box">'
    +'</div>';
}
// box-sizing:border-box a propósito — `all:unset` resetea box-sizing a content-box, así
// que sin esto todo botón width:100% construido con BTN() se pasaba 28px (2×14px de
// padding) del ancho de su contenedor, cortándose fuera de pantalla en formularios
// angostos (ej. GUARDAR HORARIO en el panel admin). Hallazgo de la auditoría visual.
function BTN(l,fn,out?){return'<button onclick="'+fn+'" style="all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;background:'+(out?'transparent':GOLD)+';border:'+(out?'1px solid #A8C8B0':'none')+';color:'+(out?'#A8C8B0':'#241a08')+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;letter-spacing:.05em;padding:14px;border-radius:10px;text-align:center">'+l+'</button>';}
function LOAD(msg){return'<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--sw-bg,#1E3932)"><div style="margin-bottom:16px">'+WORDMARK(38,true)+'</div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.25em">'+(msg||'CARGANDO //')+'</div></div>';}
// Antes MIS PEDIDOS/HISTORIAL usaban el spinner genérico de pantalla completa (LOAD())
// mientras cargaban — con esto se ve de inmediato el armazón real de la pantalla (título,
// botón atrás) con bloques pulsantes del mismo tamaño que las tarjetas reales, en vez de
// un splash sin relación con lo que está por aparecer.
var listLoading=false;
function skeletonCards(n,heightPx){
  var row='<div class="pulse" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:12px;height:'+(heightPx||64)+'px;margin-bottom:10px"></div>';
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
// Convierte el "build" legado (un pedido/favorito de antes del carrito) al formato
// de línea de carrito actual.
function buildToCartItem(bld){
  var item=Object.assign({},bld);
  item.type=bld.mode;
  delete item.mode;
  item.qty=1;
  return item;
}
// Limpia el estado del builder antes de empezar un pedido nuevo — evita que un
// build abandonado (o de un pedido anterior en la misma sesión) reaparezca
// precargado en un pedido sin relación.
function resetBuilder(){
  sigId=null;base=null;prot=null;cheese=null;tops=[];sauces=[];size=null;doubleProt=false;extraSauce=false;
  byoStep=0;
  editingItemQty=null;
}
function startOrder(m){
  resetBuilder();
  mode=m;
  go(m==='sig'?'o_sig':'o_build');
}
// Igual que startOrder('sig') pero deja el Signature tocado en la lista del home
// ya preseleccionado en sOSig — evita el paso extra de buscarlo de nuevo en la lista
// completa cuando el cliente ya sabe justo cuál quiere.
function startOrderWithSig(id){
  resetBuilder();
  mode='sig';
  sigId=id;
  go('o_sig');
}
// Igual que startOrder('byo') pero deja el pan ya preseleccionado en el paso 1 — antes las
// filas de BASES en Home decían "Elegir →" pero llamaban a startOrder('byo') sin pasar
// nada, así que abrían el asistente desde cero sin preseleccionar el pan que el cliente
// acababa de tocar (hallazgo de auditoría UX, ALTO — texto y acción no coincidían).
function startOrderWithBase(id){
  resetBuilder();
  mode='byo';
  base=id;
  go('o_build');
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
    ?{type:'sig',sigId:sigId,size:size,doubleProt:doubleProt,extraSauce:extraSauce,cheese:cheese,qty:qty}
    :{type:'byo',base:base,prot:prot,cheese:cheese,tops:tops.slice(),sauces:sauces.slice(),size:size,doubleProt:doubleProt,extraSauce:extraSauce,qty:qty};
}
// Entrada a la pantalla de revisar UN sándwich recién armado. Si el carrito estaba
// vacío (caso mayoritario: un solo sándwich), se habilita el pago directo — el
// sándwich se refleja de inmediato en `cart` y esta misma pantalla incluye los
// campos de checkout, evitando el paso extra de pasar por "TU CARRITO".
var quickPayEligible=false;
function enterConfirm(){
  quickPayEligible=cart.length===0;
  if(quickPayEligible){cart=[currentBuiltItem()];initCheckoutFields();}
  go('o_item_confirm');
}
// Vuelve al builder desde la confirmación — si se había habilitado el pago directo,
// se retira el sándwich en borrador del carrito (estaba vacío antes de entrar aquí).
function backFromConfirm(){
  if(quickPayEligible){cart=[];quickPayEligible=false;}
  go(mode==='sig'?'o_sig':'o_build');
}
// El cliente decide pedir más de un producto: el sándwich ya confirmado se queda
// en el carrito y pasamos a la vista de carrito completo para seguir agregando.
function goToCartFromConfirm(){
  syncConfirmFields();
  quickPayEligible=false;
  resetBuilder();mode=null;
  go('o_cart');
}
// Reinicia los campos transitorios del checkout (nombre/correo/notas/dirección/
// programación/crédito/recompensa) — se llama solo cuando el carrito pasa de estar
// vacío a tener su primer producto, para que un pedido nuevo nunca arrastre texto
// o selecciones de un carrito anterior ya finalizado.
function initCheckoutFields(){
  confNom=cust?cust.name:'';
  confPhone=cust?cust.phone:'';
  confEmail=cust&&cust.email?cust.email:'';
  confNotes='';
  addrText=cust&&cust.last_address?cust.last_address:'';
  pickedAddrId=null;
  scheduleMode='now';schedDay='today';schedSlot=null;
  useCredit=false;
  promoFieldOpen=false;
  manualPayMethod=null;
  payMethodChosen=false;
  checkoutLocked=false;lockedMsg='';
  _payingInProgress=false;
  appliedReward=null;
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
function lastPaidOrder(){
  return myOrders.find(function(o){return o.payment_status==='paid'&&((o.items&&o.items.length)||o.build);});
}
// Precio de una línea del carrito (una unidad, sin multiplicar por qty) — usado
// tanto para mostrar el carrito como para armar el pedido a enviar.
function itemUnitPrice(item){
  if(item.type==='side'){var d=SIDES.find(function(x){return x.id===item.code;});return d?d.p:0;}
  if(item.type==='sig'){
    var sig=SIGS.find(function(x){return x.id===item.sigId;});
    if(!sig)return 0;
    var pr=PROTS.find(function(x){return x.id===sig.prot;});
    var bp=item.size==='15'?sig.p15:sig.p30;
    var dbl=item.doubleProt?dblFee(pr,item.size):0;
    var extraSauceFee=item.extraSauce?EXTRA_SAUCE_PRICE:0;
    return bp+dbl+extraSauceFee;
  }
  var pr2=PROTS.find(function(x){return x.id===item.prot;});
  if(!pr2)return 0;
  var bp2=item.size==='15'?pr2.p15:pr2.p30;
  var dbl2=item.doubleProt?dblFee(pr2,item.size):0;
  var sc2=item.extraSauce?EXTRA_SAUCE_PRICE:0;
  return bp2+dbl2+sc2;
}
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
function itemRecipeLines(item){
  if(item.type==='side')return[];
  var lines=[];
  var base,prot,tops,sauces,cheese;
  if(item.type==='sig'){
    var sig=SIGS.find(function(x){return x.id===item.sigId;});
    if(!sig)return[];
    base=sig.base;prot=sig.prot;tops=sig.tops||[];sauces=sig.sauces||[];
    cheese=sig.fixedCheese||item.cheese||null;
  }else{
    base=item.base;prot=item.prot;tops=item.tops||[];sauces=item.sauces||[];
    cheese=item.cheese||null;
  }
  lines.push('Pan: '+fn(BASES,base));
  lines.push('Proteína: '+fn(PROTS,prot)+(item.doubleProt?' (DOBLE)':''));
  if(cheese)lines.push('Queso: '+fn(CHEESE,cheese));
  lines.push('Toppings: '+(tops.length?tops.map(function(id){return fn(TOPS,id);}).join(' · '):'sin toppings'));
  lines.push('Salsas: '+(sauces.length?sauces.map(function(id){return fn(SAUCES,id);}).join(' + '):'sin salsa')+(item.extraSauce?' (+EXTRA)':''));
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
        if(!big)return'<div style="font-family:\'EB Garamond\',serif;font-size:'+fLine+'px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">'+esc(l)+'</div>';
        // En escala de cocina se parte "Etiqueta: valor" para que el valor domine.
        var i=l.indexOf(': '),k=i>0?l.slice(0,i+1):'',v=i>0?l.slice(i+2):l;
        return'<div style="font-family:\'EB Garamond\',serif;font-size:'+fLine+'px;line-height:1.55;margin-bottom:2px">'
          +(k?'<span style="color:var(--sw-text-muted,#A8C8B0)">'+esc(k)+' </span>':'')
          +'<span style="color:var(--sw-text-body,#F2F0EB);font-weight:600">'+esc(v)+'</span></div>';
      }).join('')
      +'</div>';
  }).filter(Boolean).join('');
  if(!blocks)return'';
  return'<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,'+(big?'.55':'.3')+');border-radius:'+(big?10:8)+'px;padding:'+pad+';margin-bottom:'+(big?16:12)+'px">'
    +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:'+(big?11:8)+'px;color:'+GOLD+';letter-spacing:.18em;margin-bottom:'+(big?12:8)+'px">Para armar //</div>'
    +blocks+'</div>';
}
function itemExtrasLabel(item){
  if(item.type==='side')return'';
  var parts=[];
  if(item.doubleProt)parts.push('doble proteína');
  if(item.extraSauce)parts.push('salsa extra');
  if(item.type==='sig'&&item.cheese)parts.push('con '+fn(CHEESE,item.cheese).toLowerCase());
  if(item.note)parts.push('nota: '+item.note);
  return parts.join(' · ');
}
function cartBaseTotal(){return cart.reduce(function(s,it){return s+itemLineTotal(it);},0);}
// Un combo = 1 sándwich + 1 bebida en el carrito — si hay más sándwiches que bebidas (o
// viceversa), solo se descuenta por la cantidad de pares completos, no por cada unidad.
// R05/R06 regalan una unidad COMPLETA (bebida o sándwich 15CM entero) — esa unidad no
// debe contar para el combo, o el combo termina regalando TAMBIÉN la otra mitad del par
// sobre algo que ya es gratis (espejo exacto del fix de deriveCart en el servidor, ver
// ese comentario para el caso concreto que esto corrige).
function cartComboCount(){
  var sw=0,sd=0;
  cart.forEach(function(it){if(it.type==='side')sd+=it.qty;else sw+=it.qty;});
  if(appliedReward){
    var idx=findRewardTargetIndex(appliedReward);
    if(idx>=0){
      var target=cart[idx];
      if(appliedReward==='R06'&&target.type!=='side')sw-=1;
      if(appliedReward==='R05'&&target.type==='side')sd-=1;
    }
  }
  // El sándwich gratis del organizador tampoco cuenta: si contara, el combo terminaría
  // regalando también la bebida emparejada con un sándwich que ya no se está cobrando —
  // exactamente el bug que ya se corrigió una vez para R06.
  if(organizerFreeIdx()>=0)sw-=1;
  return Math.min(sw,sd);
}
function cartComboDiscount(){return cartComboCount()*COMBO_DISCOUNT_PER_PAIR;}
function cartOffPeakDrinkDiscount(){
  if(!isOffPeakDrinkPromoActiveNow())return 0;
  var rewardIdx=appliedReward?findRewardTargetIndex(appliedReward):-1;
  var sidePrices=[];
  cart.forEach(function(it,idx){
    if(it.type==='side'){
      var qty=(appliedReward==='R05'&&idx===rewardIdx)?it.qty-1:it.qty;
      for(var i=0;i<qty;i++)sidePrices.push(itemUnitPrice(it));
    }
  });
  if(!sidePrices.length)return 0;
  return Math.min(Math.min.apply(null,sidePrices),OFFPEAK_DRINK_PROMO_CAP);
}
// Cuánto costaría subir ESTE sándwich (ya en 15CM) a 30CM — 0 si ya es 30CM o si el
// producto cobra lo mismo en ambos tamaños. Hoy ningún ítem del catálogo está en ese
// caso, pero la guarda se queda: es lo que evita regalar un canje que no vale nada si
// alguna vez vuelve a haber uno. Usado por R03.
function itemSizeUpgradeDiff(it){
  if(it.type==='side'||it.size!=='15')return 0;
  if(it.type==='sig'){var sig=SIGS.find(function(x){return x.id===it.sigId;});return sig?Math.max(0,sig.p30-sig.p15):0;}
  var pr=PROTS.find(function(x){return x.id===it.prot;});
  return pr?Math.max(0,pr.p30-pr.p15):0;
}
// Busca el primer producto del carrito elegible para una recompensa — R02 necesita una
// línea con SALSA EXTRA activada, R03 una línea 15CM cuya versión 30CM cueste más, R04
// una línea con doble proteína activada, R05 una línea de bebida/side, R06 una línea
// 15CM. El resto de recompensas no tiene requisito propio (basta con que el carrito no
// esté vacío).
// 15CM y no RESERVE — la misma regla que usan R06 ("SÁNDWICH GRATIS") y el sándwich
// gratis del organizador. Excluir los RESERVE evita que cualquiera de los dos se gamee
// eligiendo el menú secreto, que es el ítem más caro del catálogo.
function isFreeSandwichEligible(it){
  return it.type!=='side'&&it.size==='15'&&!(it.type==='sig'&&RESERVE_SIGS.has(it.sigId));
}
// Cuántos sándwiches (no ítems: las bebidas no cuentan) hay en el carrito.
function cartSandwichQty(){
  var n=0;cart.forEach(function(it){if(it.type!=='side')n+=it.qty;});return n;
}
// Índice del 15CM más barato que se regala al organizador, o -1 si no corresponde.
// Espejo exacto de deriveCart en el servidor: solo si el carrito viene de un pedido
// grupal (pendingGroupCode) y llega al mínimo de sándwiches; nunca sobre la misma línea
// que ya está regalando una recompensa.
function organizerFreeIdx(){
  if(!pendingGroupCode)return -1;
  if(cartSandwichQty()<ORGANIZER_FREE_MIN_SANDWICHES)return -1;
  var rewardIdx=appliedReward?findRewardTargetIndex(appliedReward):-1;
  var best=Infinity,bi=-1;
  cart.forEach(function(it,idx){
    if(idx===rewardIdx)return;
    if(!isFreeSandwichEligible(it))return;
    var pr=itemBasePrice(it);
    if(pr<best){best=pr;bi=idx;}
  });
  return bi;
}
function itemBasePrice(it){
  if(it.type==='side')return itemUnitPrice(it);
  if(it.type==='sig'){var sig=SIGS.find(function(x){return x.id===it.sigId;});return sig?(it.size==='15'?sig.p15:sig.p30):0;}
  var pr=PROTS.find(function(x){return x.id===it.prot;});
  return pr?(it.size==='15'?pr.p15:pr.p30):0;
}
function organizerFreeAmount(){
  var i=organizerFreeIdx();
  return i<0?0:itemBasePrice(cart[i]);
}
function findRewardTargetIndex(rewardId){
  // En BUILD YOUR OWN, R02 ("4TA SALSA GRATIS") solo aplica si ya llegó al tope de 3
  // salsas base antes de pagar por la extra — un Signature no tiene ese tope (sus salsas
  // son fijas de receta), así que ahí basta con extraSauce activado. DEBE coincidir con
  // eligibleR02 en supabase/functions/api/catalog.ts.
  if(rewardId==='R02'){for(var i=0;i<cart.length;i++){if(cart[i].type!=='side'&&cart[i].extraSauce&&(cart[i].type==='sig'||cart[i].sauces.length===3))return i;}return -1;}
  if(rewardId==='R03'){for(var j=0;j<cart.length;j++){if(itemSizeUpgradeDiff(cart[j])>0)return j;}return -1;}
  if(rewardId==='R04'){for(var k=0;k<cart.length;k++){if(cart[k].type!=='side'&&cart[k].doubleProt)return k;}return -1;}
  if(rewardId==='R05'){for(var m=0;m<cart.length;m++){if(cart[m].type==='side')return m;}return -1;}
  if(rewardId==='R06'){for(var n=0;n<cart.length;n++){if(isFreeSandwichEligible(cart[n]))return n;}return -1;}
  return cart.length?0:-1;
}
function rewardWaiverAmount(rewardId,targetIdx){
  if(targetIdx<0)return 0;
  var it=cart[targetIdx];
  if(rewardId==='R02')return it.extraSauce?EXTRA_SAUCE_PRICE:0;
  if(rewardId==='R03')return Math.min(itemSizeUpgradeDiff(it),R03_FLAT_WAIVER);
  if(rewardId==='R04'){
    var protCode=it.type==='sig'?(SIGS.find(function(x){return x.id===it.sigId;})||{}).prot:it.prot;
    var pr=PROTS.find(function(x){return x.id===protCode;});
    return pr?Math.min(dblFee(pr,it.size),R04_FLAT_WAIVER):0;
  }
  if(rewardId==='R05')return it.type==='side'?Math.min(itemUnitPrice(it),R05_FLAT_WAIVER):0;
  if(rewardId==='R06'){
    if(it.type==='sig'){var sig=SIGS.find(function(x){return x.id===it.sigId;});return sig?(it.size==='15'?sig.p15:sig.p30):0;}
    var pr2=PROTS.find(function(x){return x.id===it.prot;});
    return pr2?(it.size==='15'?pr2.p15:pr2.p30):0;
  }
  return 0;
}
// Combo y hora valle ya no se suman — antes sándwich+bebida en la ventana de hora valle
// perdía S/3+S/4=S/7 sin usar ningún punto. Solo se aplica el mayor de los dos (espejo
// exacto del fix en deriveCart, supabase/functions/api/catalog.ts).
function cartStackedDiscount(){return Math.max(cartComboDiscount(),cartOffPeakDrinkDiscount());}
function cartFinalTotal(){
  var base=cartBaseTotal()-cartStackedDiscount();
  base-=organizerFreeAmount();
  if(appliedReward){
    var idx=findRewardTargetIndex(appliedReward);
    base-=rewardWaiverAmount(appliedReward,idx);
  }
  if(appliedPromo)base-=appliedPromo.discount;
  return money(Math.max(0,base));
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
function restoreCart(){
  try{
    var raw=JSON.parse(localStorage.getItem('sw_cart')||'null');
    if(raw&&Array.isArray(raw.items)&&raw.items.length&&raw.items.every(isValidCartItem)&&Date.now()-(raw.ts||0)<24*3600*1000){
      cart=raw.items.filter(cartItemStillExists);
      if(!cart.length){cart=[];return;}
      initCheckoutFields();
      appliedReward=raw.reward||null;
    }
  }catch(e){}
}
function addSandwichToCart(){
  var wasEmpty=cart.length===0;
  cart.push(currentBuiltItem());
  if(wasEmpty)initCheckoutFields();
  resetBuilder();mode=null;
  saveCart();
  fbTrack('AddToCart',{currency:'PEN',value:money(itemUnitPrice(cart[cart.length-1]))});
  go('o_cart');
  showToast('¡Agregado al carrito! //','success');
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
function sideQtyChange(code,delta){
  var it=cart.find(function(x){return x.type==='side'&&x.code===code;});
  if(!it)return;
  it.qty+=delta;
  if(it.qty<=0)cart=cart.filter(function(x){return x!==it;});
  // Mismo guard que cartQtyChange/cartRemove/editCartItem — antes faltaba acá, así que
  // quitar a 0 la bebida a la que se le aplicó R05 (bebida gratis) desde ESTE picker (a
  // diferencia de "Quitar" en TU CARRITO) dejaba la recompensa pintada como seleccionada
  // pero sin poder tocarla para soltarla (hallazgo de auditoría UX, MEDIO).
  if(appliedReward&&findRewardTargetIndex(appliedReward)<0)appliedReward=null;
  saveCart();
  render();
}
function cartQtyChange(idx,delta){
  syncConfirmFields();
  var it=cart[idx];if(!it)return;
  it.qty+=delta;
  if(it.qty<=0)cart.splice(idx,1);
  if(appliedReward&&findRewardTargetIndex(appliedReward)<0)appliedReward=null;
  saveCart();
  render();
}
function cartRemove(idx){
  syncConfirmFields();
  cart.splice(idx,1);
  if(appliedReward&&findRewardTargetIndex(appliedReward)<0)appliedReward=null;
  saveCart();
  render();
}
// pendingGroupCode se limpia acá y en doLogout() a propósito (2026-08-27). Antes solo se
// limpiaba tras un pedido pagado con éxito, así que sobrevivía a un abandono: el
// organizador cerraba un grupo de 5+, no pagaba, vaciaba el carrito, armaba un pedido
// PERSONAL que también llegara a 5 sándwiches, y metaAttribution() seguía mandando ese
// groupCode. El servidor solo comprueba que el grupo ORIGINAL tuviera 5+ y que nadie haya
// cobrado aún con ese código — nunca que el carrito actual sea el del grupo — así que
// regalaba un 15CM en un pedido que no tenía nada que ver con el grupo.
function clearCart(){cart=[];appliedReward=null;appliedPromo=null;promoStatus='';pendingGroupCode=null;saveCart();go('o_home');}
// Reconstruye un carrito completo a partir de un pedido pasado o favorito multi-línea
// — usado por "repetir pedido", que reproduce todo el carrito anterior de un tap.
function loadCart(items){
  if(!items||!items.length)return;
  cart=items.map(function(it){return Object.assign({},it);});
  initCheckoutFields();
  saveCart();
  go('o_cart');
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
// ORDER SIGNATURE
// Lista de espera pre-lanzamiento — el negocio real aún no abre (ver CLAUDE.md), así que
// esto le da a cualquier visitante sin cuenta una forma de decir "avísenme" sin la
// fricción de un registro completo (DNI, PIN, etc.). Solo se muestra a invitados y
// desaparece (localStorage) apenas se anota, para no insistir en cada visita.
async function joinWaitlist(){
  var phone=gv('wl-phone').trim();
  var name=gv('wl-name').trim();
  if(phone.replace(/\D/g,'').length<6){wlMsg='Ingresa un teléfono válido.';render();return;}
  wlMsg='Enviando...';render();
  try{
    await api('waitlist-join',{phone:phone,name:name||null,source:'app_home'});
    wlDone=true;localStorage.setItem('sw_wl_done','1');wlPhone='';wlName='';wlMsg='';
    fbTrack('Lead',{content_name:'lista_de_espera'});
    showToast('¡Listo! Te avisamos apenas abramos.','success');
  }catch(e){wlMsg=e.message||'No se pudo registrar.';}
  render();
}
function waitlistCardHTML(){
  if(cust||wlDone||businessLaunched)return'';
  // Copy reforzado (plan de conversión desde frío, MARKETING_PLAN.md §14.4.2) — antes era
  // un mensaje puramente pasivo ("te avisamos"), sin ningún incentivo concreto visible en
  // el primer segundo. Ahora menciona el código BIENVENIDA real (ya creado, -S/5, mínimo
  // S/15) en vez de prometer un mecanismo de "primeros N inscritos" que no existe en el
  // backend — nunca se promete algo que la app no cumple de verdad (Product Principle #2).
  return'<div style="background:var(--sw-card,#2D5246);border:1px solid '+GOLD+';border-radius:12px;padding:16px;margin-bottom:16px">'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">Sé de los primeros<span class="cut-sep" style="color:'+GOLD+'"> // </span>en probarlo</div>'
    +'<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin:4px 0 12px;line-height:1.5">Déjanos tu teléfono y te avisamos apenas empecemos a repartir de verdad — usa el código <b style="color:'+GOLD+'">BIENVENIDA</b> en tu primer pedido y llévate S/5 de descuento.</div>'
    +'<div style="display:flex;flex-direction:column;gap:8px">'+INP('wl-phone','Teléfono','tel',wlPhone)+INP('wl-name','Nombre // opcional','text',wlName)+'</div>'
    +(wlMsg?'<div style="font-family:EB Garamond,serif;font-size:11px;color:#ff8888;margin-top:8px">'+esc(wlMsg)+'</div>':'')
    +'<div style="margin-top:10px">'+BTN('Avísame //','joinWaitlist()')+'</div>'
    +'</div>';
}
function sOHome(){
  var pc=cust
    ?'<div onclick="swTab(\'points\')" style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.2);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-top:4px"><div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:2px">Tus puntos //</div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:26px;font-weight:640;color:var(--sw-text,#FFFFFF)">'+(cust.points||0)+'</div></div><span style="font-family:EB Garamond,serif;font-weight:600;font-size:11px;color:'+GOLD+'">Ver \u2192</span></div>'
    :'<div onclick="swTab(\'points\')" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-top:4px"><div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">Acumula<span class="cut-sep" style="color:'+GOLD+'"> // </span>puntos</div><p style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">Gana puntos con cada pedido.</p></div><span style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:'+GOLD+'">Unirse \u2192</span></div>';
  var ss=storeStatus();
  // storeStatus() solo mira el horario del día (11-22) — antes eso bastaba para decidir
  // "abierto/cerrado", pero desde que existe businessLaunched (el negocio real aún no
  // abrió) mostrar "ABIERTO AHORA" en verde junto a la tarjeta "Avísame cuando abramos"
  // era una contradicción visible en la misma pantalla (auditoría UX, P1). El badge de
  // Home ahora respeta businessLaunched sin tocar ss.open en sí — eso sigue gobernando
  // si se puede pedir "ahora" vs. solo "programar" (isWithinStoreHours), una decisión de
  // horario real, no de si el negocio ya abrió, y no se toca acá.
  var showOpenBadge=ss.open&&businessLaunched;
  // El rango de entrega antes solo aparecía ya adentro del checkout — mostrarlo aquí
  // fija la expectativa de tiempo antes de que el cliente arme un pedido, sin costo.
  var hoursBadge='<div style="display:flex;align-items:center;gap:6px;margin-bottom:16px;flex-wrap:wrap"><span style="width:6px;height:6px;border-radius:50%;background:'+(!businessLaunched?GOLD:(ss.open?'#25D366':'#ff8888'))+'"></span><span style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+(!businessLaunched?GOLD:(ss.open?'#25D366':'#ff8888'))+';letter-spacing:.1em">'+(!businessLaunched?'AÚN NO ABRIMOS':ss.label)+'</span>'+(showOpenBadge?'<span style="color:var(--sw-text-muted,#A8C8B0);font-family:EB Garamond,serif;font-weight:600;font-size:9px">· '+ESTIMATED_DELIVERY_RANGE[0]+'-'+ESTIMATED_DELIVERY_RANGE[1]+' min</span>':'')+'</div>'
  // El costo de envío ya se mostraba en el checkout, pero recién ahí: el cliente armaba
  // todo el pedido y se enteraba del delivery al final. Esa sorpresa al final es la causa
  // más citada de abandono de carrito en Perú (70-80% de los carritos). Decirlo desde la
  // primera pantalla, con el rango real y de dónde sale, convierte un cargo inesperado en
  // un precio entendido: los motorizados de Trujillo cobran ~S/2 por kilómetro.
  +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:-10px;margin-bottom:16px">Delivery desde '+SOLES_TXT+DELIVERY_PRICE_ZONES[0].fee+' según tu zona — lo cobra el motorizado, ~'+SOLES_TXT+'2 por km.</div>';
  var lastOrd=cust?lastPaidOrder():null;
  var recoItems=lastOrd?(lastOrd.items&&lastOrd.items.length?lastOrd.items:(lastOrd.build?[buildToCartItem(lastOrd.build)]:null)):null;
  var recoCard=recoItems?'<div onclick="loadCart('+JSON.stringify(recoItems).replace(/"/g,'&quot;')+')" style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:16px 18px;cursor:pointer;margin-bottom:16px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:6px">↻ Repetir pedido //</div><div style="font-family:EB Garamond,serif;font-size:13px;color:var(--sw-text-body,#F2F0EB)">'+esc(lastOrd.summary||'')+'</div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:'+GOLD+';margin-top:6px">Pedir lo mismo \u2192</div></div>':'';
  var cartCard=cart.length?'<div onclick="go(\'o_cart\')" style="background:var(--sw-card,#2D5246);border:1px solid '+GOLD+';border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:16px"><span style="display:inline-flex;align-items:center;gap:8px;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+icon('cart',16,'#FFFFFF')+'Carrito<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+cart.reduce(function(s,it){return s+it.qty;},0)+' items</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:'+GOLD+'">Ver \u2192</span></div>':'';
  var pwaCard=(deferredInstallPrompt&&!pwaDismissed)?'<div style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.3);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:16px"><div onclick="installPwa()" style="flex:1"><div style="display:inline-flex;align-items:center;gap:8px;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+icon('device',15,GOLD)+'Instalar<span class="cut-sep" style="color:'+GOLD+'"> // </span>app</div><div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">Pide m\u00e1s r\u00e1pido desde tu pantalla de inicio</div></div><button onclick="event.stopPropagation();dismissPwaBanner()" aria-label="Cerrar aviso de instalación" style="all:unset;cursor:pointer;color:var(--sw-text-muted,#A8C8B0);font-size:16px;padding:0 4px">&#10005;</button></div>':'';
  var nearbyCard=(nearStore&&ss.open&&businessLaunched)?'<div onclick="startOrder(\'sig\')" style="background:linear-gradient(135deg,#1E4A38,#1A3028);border:1px solid '+GOLD+';border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:16px"><div style="flex:1"><div style="display:inline-flex;align-items:center;gap:8px;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+icon('direccion',15,GOLD)+'¡Estás cerca<span class="cut-sep" style="color:'+GOLD+'"> // </span>del local!</div><div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">Pide ahora y recíbelo en '+ESTIMATED_DELIVERY_RANGE[0]+' min aprox.</div></div><button onclick="event.stopPropagation();dismissNearbyBanner()" aria-label="Cerrar aviso de cercanía" style="all:unset;cursor:pointer;color:var(--sw-text-muted,#A8C8B0);font-size:16px;padding:0 4px">&#10005;</button></div>':'';
  return H()
    +'<div style="flex:1;padding:24px 20px 140px;overflow-y:auto" class="fi">'
    +hoursBadge
    +waitlistCardHTML()
    +nearbyCard
    +pwaCard
    +cartCard
    +recoCard
    +'<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-text-body,#F2F0EB);opacity:.8;letter-spacing:.15em;margin-bottom:16px">¿Cómo quieres pedir? //</div>'
    // Rediseño de esta sesión (fase 2 de fidelidad al mockup Prada Caffè): las 2 tarjetas
    // hero (una por modo) se reemplazan por tabs + lista plana de filas, como en el
    // mockup — un cliente puede ver los 6-7 Signatures reales (nombre, badge, precio) sin
    // tener que entrar a otra pantalla primero. sOSig() sigue existiendo tal cual (con
    // toda su lógica de stock/secreto/preview) — estas filas solo son la "vista previa"
    // del home; tocar cualquiera navega ahí. El filtro s.secret se mantiene (hallazgo
    // CRÍTICO de auditoría de una sesión anterior: el menú secreto no debe filtrarse acá).
    +(function(){
      // el menú secreto nunca aparece en esta lista, ni siquiera ya desbloqueado — vive solo en
      // vaultCard más abajo (mismo criterio que el mockup: el menú secreto es su propia
      // sección separada, no una fila más entre los Signatures normales). Evita el
      // hallazgo de la auditoría de esta ronda: mostrarlo en ambos lugares a la vez.
      // Orden de exhibición del home, fijo y decidido a mano (NO ordenado dinámicamente
      // por margen: el cliente que vuelve debe encontrar la carta donde la dejó). El
      // orden del array SIGS es el orden en que se fueron creando, y dejaba a los dos
      // Signatures de peor margen (SIG03 68% y SIG04 49% bruto en 15CM) justo en las
      // posiciones 3 y 4, que son de las más miradas de una lista en móvil. Acá van al
      // final y suben los de mejor margen, sin tocar ningún precio ni receta. Cualquier
      // Signature nuevo que no esté listado acá se muestra al final, en su orden natural.
      var SIG_HOME_ORDER=['SIG01','SIG02','SIG06','SIG03','SIG04'];
      var visibleSigs=SIGS.filter(function(s){return!s.secret&&sigAvailable(s);}).slice().sort(function(a,b){
        var ia=SIG_HOME_ORDER.indexOf(a.id),ib=SIG_HOME_ORDER.indexOf(b.id);
        return (ia<0?99:ia)-(ib<0?99:ib);
      });
      var secretSig=SIGS.find(function(s){return s.secret;});
      var tabBar='<div style="display:flex;background:var(--sw-card,#2D5246);border-radius:10px;padding:4px;margin-bottom:4px">'
        +'<button onclick="homeTab=\'sig\';render()" style="all:unset;cursor:pointer;flex:1;text-align:center;padding:10px 0;min-height:44px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:'+(homeTab==='sig'?GOLD:'transparent')+';color:'+(homeTab==='sig'?'#241a08':'var(--sw-text-muted,#A8C8B0)')+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.03em;transition:all .15s">Signatures</button>'
        +'<button onclick="homeTab=\'byo\';render()" style="all:unset;cursor:pointer;flex:1;text-align:center;padding:10px 0;min-height:44px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:'+(homeTab==='byo'?GOLD:'transparent')+';color:'+(homeTab==='byo'?'#241a08':'var(--sw-text-muted,#A8C8B0)')+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.03em;transition:all .15s">Arma el tuyo</button>'
        +'</div>';
      var sigPanel='<div style="margin-bottom:8px">'+visibleSigs.map(function(s,i){
        var av=isAvail(s.base)&&isAvail(s.prot);
        var thumb=SIG_IMG[s.id]?'<img src="'+SIG_IMG[s.id]+'" alt="'+esc(s.n)+'" style="width:48px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0" loading="lazy">':'<div style="width:48px;height:48px;border-radius:8px;flex-shrink:0;background:'+'var(--sw-card2,#1A3028)'+'"></div>';
        if(!av)return'<div style="display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid var(--sw-border,#3A6B58);opacity:.4">'+thumb+'<div style="flex:1;min-width:0"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text-muted,#A8C8B0)">'+s.n+'<span style="color:var(--sw-text-muted,#A8C8B0)"> // </span>'+sigTypeTag(s.s)+'</div></div><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#ff8888;flex-shrink:0">Agotado</span></div>';
        // Sin el sufijo " // Signature" en la fila: la etiqueta de arriba ya dice el tipo
        // ("Clásico · Recomendado") y, al agrandar el precio a 22px, ese sufijo empujaba el
        // nombre hasta cortarlo con puntos suspensivos a 320px ("The Original // Sig…").
        // Entre mostrar el nombre completo del producto y repetir su categoría, gana el
        // nombre.
        return'<div onclick="startOrderWithSig(\''+s.id+'\')" style="display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid var(--sw-border,#3A6B58);cursor:pointer">'+thumb+'<div style="flex:1;min-width:0"><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;letter-spacing:.02em;color:'+GOLD+'">'+sigBadge(s)+(s.recommended?' · Recomendado':'')+'</span><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:600;color:var(--sw-text,#FFFFFF);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+s.n+'</div></div>'
          // Antes solo se veía el precio de 15CM y el de 30CM aparecía recién en la
          // pantalla siguiente. Mostrar los dos deja ver la escalera completa desde la
          // lista, que es donde el cliente compara. Solo se muestra el 30CM si de verdad
          // cuesta más — hoy THE CHICAGO tiene el mismo precio en ambos tamaños y
          // repetirlo se leería como un error de la app.
          // El precio va en Bodoni a 22px, no en Garamond itálica a 13px. Cuando cobras S/25
          // contra un menú del día de S/12, el precio ES el argumento de venta: escribirlo
          // como letra chica lo vuelve una disculpa. El nombre del Signature ya iba a 16px y
          // su precio a 13 — invertido respecto a lo que sostiene el ticket.
          +'<div style="text-align:right;flex-shrink:0"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:'+GOLD+'">'+SOLES+pz(s.p15)+'</span>'
          +(s.p30>s.p15?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:1px">30CM '+SOLES+pz(s.p30)+'</div>':'')
          +'</div></div>';
      }).join('')+'</div>';
      var byoPanel='<div style="margin-bottom:8px">'
        +'<p style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5;padding:10px 4px 4px">Elige base, proteína, toppings y salsas — a tu manera.</p>'
        +BASES.map(function(b){
          var av=isAvail(b.id);
          return'<div '+(av?'onclick="startOrderWithBase(\''+b.id+'\')" style="cursor:pointer;':'style="opacity:.4;')+'display:flex;align-items:center;justify-content:space-between;padding:12px 4px;border-bottom:1px solid var(--sw-border,#3A6B58)"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+b.l+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+b.s+'</span>'+(av?'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:'+GOLD+'">Elegir →</span>':'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#ff8888">Agotado</span>')+'</div>';
        }).join('')
        +'<div style="margin-top:14px">'+BTN('Ver el paso a paso completo →',"startOrder('byo')",true)+'</div></div>';
      var vaultCard=secretSig?(function(){
        var myTotal=cust?(cust.total_orders||0):0;
        var missing=Math.max(0,secretSig.minOrders-myTotal);
        var unlocked=!!cust&&missing===0;
        return'<div style="margin:20px 0 16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Menú secreto //</div>'
          // Borde sólido (no dashed) — dashed ya es el lenguaje visual de "opción sin
          // seleccionar" en el resto de la app (row-byo-opt/CARDOFF); reusarlo acá leía
          // como placeholder incompleto en vez de exclusivo (hallazgo de auditoría visual).
          // El chip "Secreto" pasa de rectangular a un sello circular, más cerca del
          // medallón del mockup que del badge de precio genérico que usa el resto de tarjetas.
          +'<div onclick="'+(unlocked?'startOrderWithSig(\''+secretSig.id+'\')':'')+'" style="background:linear-gradient(160deg,#1A3028,#0d1a15);border:1px solid rgba(203,162,88,.4);border-radius:14px;padding:24px 20px;text-align:center;'+(unlocked?'cursor:pointer':'')+'">'
          +'<span style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;border:1px solid '+GOLD+';font-family:\'EB Garamond\',serif;font-style:italic;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.04em;margin:0 auto 14px">Secreto</span>'
          +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:#fff">'+secretSig.n+'</div>'
          +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px;line-height:1.5">Se desbloquea en '+esc(rankName(secretSig.minOrders))+'<br>('+secretSig.minOrders+' pedidos).</div>'
          +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:'+GOLD+';margin-top:12px">'+(unlocked?SOLES+secretSig.p15:'Te faltan '+missing+' pedido'+(missing===1?'':'s'))+'</div>'
          +'</div></div>';
      })():'';
      // Pedido de oficina — el canal con mejor economía del negocio: una sola entrega para
      // 4-8 sándwiches, así que el delivery por persona baja a una fracción. Antes solo
      // aparecía DENTRO del carrito y solo para quien ya tenía sesión iniciada: quien
      // llegaba por primera vez no se enteraba nunca de que existía. Acá lo ve todo el
      // mundo; si no tiene cuenta, doCreateGroupOrder lo manda a crearla.
      var officeCard='<div onclick="doCreateGroupOrder()" style="margin-top:14px;background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer">'
        +icon('clientes',18,GOLD)
        +'<div style="flex:1;min-width:0"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">¿Piden en grupo<span class="cut-sep" style="color:'+GOLD+'"> // </span>en la oficina?</div>'
        +'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px;line-height:1.4">Mandas un link, cada quien arma el suyo sin crear cuenta, y el delivery se divide entre todos.</div>'
        // El sándwich gratis solo se anunciaba DENTRO del pedido grupal, o sea después de
        // que la persona ya decidió organizarlo. La decisión se toma acá, en la puerta.
        +'<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:'+GOLD+';margin-top:5px">Desde '+ORGANIZER_FREE_MIN_SANDWICHES+' sándwiches, uno va gratis.</div></div>'
        +'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:'+GOLD+';flex-shrink:0">Armar →</span></div>';
      return tabBar+(homeTab==='byo'?byoPanel:sigPanel)+(homeTab==='sig'?vaultCard:'')+officeCard;
    })()
    // Acá había una SEGUNDA tarjeta de pedido grupal ("Pedido // grupal · Organizar →"),
    // con el mismo onclick y el mismo destino que officeCard de arriba. Era la versión
    // vieja, de cuando el canal solo se ofrecía a quien ya tenía sesión; al agregar
    // officeCard (visible también para invitados) nadie borró esta, así que un cliente
    // logueado veía dos puertas al mismo sitio, una encima de la otra — reportado por el
    // dueño con captura. Queda solo officeCard.
    +(cust&&myFavorites.length?'<div onclick="sndScreen=\'p_favorites\';render()" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:12px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:16px"><span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);display:inline-flex;align-items:center;gap:6px">'+icon('estrella',15,'#FFFFFF')+'<span>Mis<span class="cut-sep" style="color:'+GOLD+'"> // </span>favoritos</span></span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:'+GOLD+'">Ver \u2192</span></div>':'')
    +pc
    +contactFooterHTML()
    +'</div>'+NAV();
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
async function doCreateGroupOrder(){
  if(!cust){showToast('Inicia sesión para organizar un pedido grupal.');return;}
  busy=true;busyMsg='Creando pedido grupal...';render();
  var res;
  try{res=await api('create-group-order',{token:token});}
  catch(e){busy=false;render();showToast(e.message);return;}
  groupCode=res.code;groupData=null;groupMsg='';
  busy=false;sndScreen='group_order';render();
  loadGroupOrder();
  startGroupPoll();
}
async function loadGroupOrder(){
  if(!groupCode)return;
  try{
    var res=await api('get-group-order',{token:token,code:groupCode});
    groupData=res;
    render();
  }catch(e){stopGroupPoll();showToast(e.message);sndScreen='o_home';render();}
}
function startGroupPoll(){
  stopGroupPoll();
  _groupPollTimer=setInterval(function(){if(sndScreen==='group_order')loadGroupOrder();else stopGroupPoll();},5000);
}
function stopGroupPoll(){if(_groupPollTimer){clearInterval(_groupPollTimer);_groupPollTimer=null;}}
async function submitGroupItem(item,okMsg){
  var nameEl=(document.getElementById('grp-name') as HTMLInputElement | null);
  var name=nameEl?nameEl.value.trim():groupJoinName;
  if(!name){groupMsg='Ingresa tu nombre antes de agregar tu pedido.';render();return;}
  groupJoinName=name;
  try{localStorage.setItem('sw_group_name',name);}catch(e){}
  try{
    // Manda token (vacío si es invitado) para que el servidor sepa si quien agrega es
    // quien organizó, y así no le mande una notificación push a sí mismo.
    await api('add-group-item',{code:groupCode,contributorName:name,token:token,item:item});
    groupMsg=okMsg;
    loadGroupOrder();
  }catch(e){groupMsg=e.message;render();}
}
function doAddGroupItem(sigId){
  submitGroupItem({type:'sig',sigId:sigId,size:groupSize,doubleProt:false,extraSauce:false,qty:1},'¡Listo! Tu pedido se agregó.');
}
// Antes solo se podía agregar un Signature al pedido grupal (SIGS.filter en sGroupOrder) —
// quien solo quería sumar una bebida sin sándwich no tenía forma de hacerlo (hallazgo de
// auditoría UX). Mismo action del servidor (add-group-item -> priceCartItem ya valida
// item.type:'side' desde que existen los carritos multi-ítem), solo faltaba la UI.
function doAddGroupSide(code){
  submitGroupItem({type:'side',code:code,qty:1},'¡Listo! Tu bebida se agregó.');
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
function sGroupOrder(){
  var g=groupData;
  var bk="stopGroupPoll();sndScreen='o_home';render()";
  if(!g){
    return H('PEDIDO GRUPAL',bk)+'<div style="flex:1;padding:20px" class="fi">'+skeletonCards(3,64)+'</div>'+NAV();
  }
  var h=H('PEDIDO GRUPAL',bk)+'<div style="flex:1;padding:20px 20px 140px;overflow-y:auto" class="fi">';
  h+='<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:#fff;margin-bottom:4px;text-wrap:balance">Pedido<span class="cut-sep" style="color:'+GOLD+'"> // </span>grupal</div>';
  h+='<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:'+GOLD+';letter-spacing:.1em;margin-bottom:16px">Organiza '+esc(g.organizerName)+' · código '+esc(g.code)+'</div>';
  if(g.status==='open'){
    var msLeft=new Date(g.expiresAt).getTime()-Date.now();
    if(msLeft>0){
      var minsLeft=Math.floor(msLeft/60000),secsLeft=Math.floor((msLeft%60000)/1000);
      var urgent=msLeft<120000;
      h+='<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:'+(urgent?'#ff8888':'#A8C8B0')+';letter-spacing:.1em;margin-bottom:14px">Cierra en '+minsLeft+':'+String(secsLeft).padStart(2,'0')+'</div>';
    }
  }
  if(g.isOrganizer&&g.status==='open'){
    h+=BTN('Compartir link //','shareGroupOrder()');
  }
  h+=(g.items.length?g.items.map(function(it){
    return'<div style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:12px 14px;margin:10px 0 0;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+esc(it.label)+'</div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0)">'+esc(it.contributorName)+'</div></div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:'+GOLD+'">'+SOLES+it.unitPrice+'</div></div>';
  }).join(''):'<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:14px">Nadie agregó su pedido todavía.</div>');
  h+='<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin:16px 0"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text-body,#F2F0EB)">Total</span><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:24px;font-weight:640;color:'+GOLD+'">'+SOLES+g.total+'</span></div>';
  // Avance del sándwich gratis del organizador. Es el motor del canal de oficinas: le
  // da a quien está juntando al grupo una razón concreta para insistirle a un compañero
  // más, y esa insistencia es la venta que el dueño no puede hacer él mismo.
  var freeAt=g.organizerFreeAt||ORGANIZER_FREE_MIN_SANDWICHES;
  var swQty=typeof g.sandwichQty==='number'?g.sandwichQty:0;
  if(g.status==='open'){
    var falta=Math.max(0,freeAt-swQty);
    var pctFree=Math.min(100,Math.round(swQty/freeAt*100));
    h+='<div style="background:var(--sw-card2,#1A3028);border:1px solid '+(falta?'var(--sw-border,#3A6B58)':GOLD)+';border-radius:10px;padding:14px 16px;margin-bottom:16px">'
      +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:'+(falta?'var(--sw-text,#FFFFFF)':GOLD)+'">'
      +(falta?('Faltan '+falta+' sándwich'+(falta===1?'':'es')+' para que uno vaya gratis'):'¡Un sándwich va gratis!')+'</div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:3px">'
      +(falta?('Con '+freeAt+' o más, el 15CM más barato del grupo no se cobra.'):'Se descuenta el 15CM más barato al cerrar y pagar.')+'</div>'
      +'<div style="height:4px;background:var(--sw-bg,#1E3932);border-radius:2px;margin-top:10px;overflow:hidden"><div style="height:100%;width:'+pctFree+'%;background:'+GOLD+'"></div></div>'
      +'</div>';
  }
  if(g.status!=='open'){
    h+='<div style="text-align:center;font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em">'+(g.status==='cancelled'?'Este pedido grupal fue cancelado':'Este pedido grupal ya se cerró')+'</div>';
  }else{
    // Antes esta sección solo se mostraba a quien NO organizaba — quien creó el pedido
    // grupal podía compartir el link y cerrar/cobrar, pero nunca agregar su propio
    // sándwich (hallazgo reportado en vivo). Ahora se muestra siempre que el pedido
    // siga abierto, sin importar quién sea.
    h+='<div style="height:1px;background:var(--sw-bg,#1E3932);margin:20px 0"></div>';
    h+='<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:12px">Agregar mi pedido //</div>';
    h+=INP('grp-name','Tu nombre','text',groupJoinName||(g.isOrganizer&&cust?cust.name:''),'clientes');
    h+='<div style="display:flex;gap:8px;margin:10px 0"><div onclick="groupSize=\'15\';render()" style="flex:1;text-align:center;padding:10px;border-radius:8px;cursor:pointer;background:'+(groupSize==='15'?GOLD:'#1A3028')+';color:'+(groupSize==='15'?'#0d0d0d':'#A8C8B0')+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600">15CM</div><div onclick="groupSize=\'30\';render()" style="flex:1;text-align:center;padding:10px;border-radius:8px;cursor:pointer;background:'+(groupSize==='30'?GOLD:'#1A3028')+';color:'+(groupSize==='30'?'#0d0d0d':'#A8C8B0')+';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600">30CM</div></div>';
    h+=SIGS.filter(function(s){return!s.secret&&sigAvailable(s);}).map(function(s){
      var price=groupSize==='15'?s.p15:s.p30;
      return'<div style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+s.n+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+sigTypeTag(s.s)+'</div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:'+GOLD+'">'+SOLES+price+'</div></div><button onclick="doAddGroupItem(\''+s.id+'\')" style="all:unset;cursor:pointer;background:'+GOLD+';color:#0d0d0d;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:9px 16px;border-radius:8px">Agregar</button></div>';
    }).join('');
    // Antes solo se podían agregar Signatures — quien solo quería sumar una bebida sin
    // sándwich (o completar la suya) no tenía forma de hacerlo (hallazgo de auditoría UX).
    h+='<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin:14px 0 12px">Bebidas y sides //</div>';
    h+=SIDES.map(function(s){
      return'<div style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+s.l+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+s.s+'</div><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:'+GOLD+'">'+SOLES+s.p+'</div></div><button onclick="doAddGroupSide(\''+s.id+'\')" style="all:unset;cursor:pointer;background:'+GOLD+';color:#0d0d0d;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:9px 16px;border-radius:8px">Agregar</button></div>';
    }).join('');
    h+='<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:'+GOLD+';margin-top:8px;min-height:14px">'+esc(groupMsg)+'</div>';
    if(g.isOrganizer){
      h+='<div style="height:1px;background:var(--sw-bg,#1E3932);margin:20px 0"></div>';
      h+=BTN('Cerrar y pagar //','doCloseGroupOrder()');
      h+='<div onclick="doCancelGroupOrder()" style="text-align:center;margin-top:14px;cursor:pointer;font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:#ff8888;letter-spacing:.1em">Cancelar pedido grupal</div>';
    }
  }
  h+='</div>'+NAV();
  return h;
}

function sOSig(){
  // "Tu de siempre" — mismo repetir-último-pedido que ya existe en el home, pero
  // visible también aquí (donde el cliente ya está decidiendo qué pedir) para el que
  // ya sabe qué quiere y prefiere decidir en un tap en vez de volver al home primero.
  var lastOrdSig=cust?lastPaidOrder():null;
  var recoItemsSig=lastOrdSig?(lastOrdSig.items&&lastOrdSig.items.length?lastOrdSig.items:(lastOrdSig.build?[buildToCartItem(lastOrdSig.build)]:null)):null;
  var recoCardSig=recoItemsSig?'<div onclick="loadCart('+JSON.stringify(recoItemsSig).replace(/"/g,'&quot;')+')" style="background:var(--sw-card2,#1A3028);border:1px solid rgba(203,162,88,.25);border-radius:12px;padding:14px 16px;cursor:pointer;margin-bottom:16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.15em;margin-bottom:6px">↻ Tu de siempre //</div><div style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-body,#F2F0EB)">'+esc(lastOrdSig.summary||'')+'</div></div>':'';
  var h=H('SIGNATURE BUILDS','go(\'o_home\')',true)+'<div style="flex:1;padding:20px 20px 140px;overflow-y:auto" class="fi">'+SZTOG()+recoCardSig+ST('01','Elige tu build','Tres salsas incluidas.')+SIGS.map(function(s){
    // Menú secreto (ver s.secret/s.minOrders) — invisible para invitados, y para un
    // cliente logueado que todavía no llega al rango exigido se muestra como una
    // tarjeta bloqueada (genera aspiración) en vez de ocultarse sin explicación.
    if(s.secret){
      if(!cust)return'';
      var myTotal=cust.total_orders||0;
      if(myTotal<s.minOrders){
        var missing=s.minOrders-myTotal;
        return'<div style="background:#0d1a15;border:1px dashed rgba(203,162,88,.35);border-radius:10px;padding:16px;margin-bottom:10px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:600;color:var(--sw-text-muted,#A8C8B0);display:flex;align-items:center;gap:8px">'+icon('lock',15,'#A8C8B0')+s.n+'<span style="color:var(--sw-text-muted,#A8C8B0)"> // </span>'+sigTypeTag(s.s)+'</div><div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:8px">Se desbloquea con '+s.minOrders+' pedidos — te faltan '+missing+' pedido'+(missing===1?'':'s')+'.</div></div>';
      }
    }
    var sel=sigId===s.id,pr=PROTS.find(function(x){return x.id===s.prot;}),bs=BASES.find(function(x){return x.id===s.base;});
    var av=isAvail(s.base)&&isAvail(s.prot);
    var priceTag=size?SOLES+sigPrice(s):'—';
    if(!av){
      var notifyRequested=restockNotified.indexOf(s.id)>=0;
      return'<div style="background:var(--sw-card-danger,#1A2420);border:1px solid rgba(255,85,85,.3);border-radius:10px;padding:16px;margin-bottom:10px;opacity:.7"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:600;color:var(--sw-text-muted,#A8C8B0)">'+s.n+'<span style="color:var(--sw-text-muted,#A8C8B0)"> // </span>'+sigTypeTag(s.s)+'</span><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#ff8888">Agotado</span></div><div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:8px">'+(bs?bs.l+' // '+bs.s:'')+' · '+(pr?pr.l+' // '+pr.s:'')+'</div>'
        // Antes esto desaparecía sin dejar rastro para un invitado sin cuenta — parecía un
        // callejón sin salida en vez de una invitación a registrarse (hallazgo de auditoría
        // UX, MEDIO).
        +(cust?'<button onclick="doRequestRestockNotify(\''+s.id+'\')" '+(notifyRequested?'disabled':'')+' style="all:unset;cursor:'+(notifyRequested?'default':'pointer')+';display:block;margin-top:10px;font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+(notifyRequested?'#25D366':GOLD)+';letter-spacing:.08em">'+(notifyRequested?'✓ Te avisamos cuando vuelva':'Avísame cuando vuelva →')+'</button>':'<div onclick="swTab(\'points\')" style="cursor:pointer;display:block;margin-top:10px;font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.08em">Inicia sesión para que te avisemos →</div>')
        +'</div>';
    }
    // Antes, sin foto real (ver SIG_IMG — hoy los 7 signatures públicos ya la tienen, así
    // que esta reserva ya no debería activarse en la práctica, pero se deja como red de
    // seguridad para el día que se agregue un signature nuevo sin foto todavía), la
    // tarjeta simplemente no mostraba nada a la izquierda — el texto arrancaba pegado al
    // borde en esas filas mientras las demás tenían una miniatura, dando una lista
    // "parchada" (hallazgo del dueño). Mismo bloque de reserva que ya usa
    // sigPreviewOverlayHTML cuando no hay foto, a la misma escala que la miniatura real —
    // nunca se inventa una foto, solo se pareja el espacio que ocupa.
    var thumb=SIG_IMG[s.id]
      ?'<img src="'+SIG_IMG[s.id]+'" alt="'+esc(s.n)+'" style="width:64px;height:64px;object-fit:cover;border-radius:8px;flex-shrink:0" loading="lazy">'
      :'<div style="width:64px;height:64px;border-radius:8px;flex-shrink:0;background:linear-gradient(160deg,#2D5246,#1A3028);display:flex;align-items:center;justify-content:center;opacity:.6">'+icon('sandwich',26,GOLD)+'</div>';
    // el menú secreto (s.secret), incluso YA desbloqueado, no debe revelar su composición —
    // el punto de un menú secreto es que sigue siendo secreto hasta que lo pruebas
    // (pedido explícito del dueño). Antes esta misma línea mostraba pan+proteína en
    // texto plano para CUALQUIER Signature, incluida el menú secreto una vez desbloqueada.
    // Antes el pitch (lo que de verdad diferencia sabor/estilo entre Signatures) solo
    // se veía tras abrir "VER FOTO" — comparar 6 Signatures exigía 6 taps extra solo para
    // entender en qué se diferencian (hallazgo de auditoría UX, ALTO). Truncado a 1 línea
    // con -webkit-line-clamp para no alargar la tarjeta.
    var pitchPreview=s.pitch?'<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical">'+esc(s.pitch)+'</div>':'';
    var ingredientsLine=s.secret
      ?'<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:'+GOLD+';margin-top:8px;font-style:italic">Ingredientes secretos — se revelan cuando lo pruebas.</div>'
      :'<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:8px">'+(bs?bs.l+' // '+bs.s:'')+' · '+(pr?pr.l+' // '+pr.s:'')+'</div>';
    // Precio/receta fijos sin importar el tamaño elegido (hoy solo THE CHICAGO, plato
    // tradicional que no se vende "para compartir") — el selector 15CM/30CM de arriba
    // sigue siendo genérico para todos los Signature, así que sin este aviso el cliente
    // no tenía forma de saber por qué el precio no cambiaba al tocar 30CM (auditoría de
    // menú, BAJO).
    var singleSizeNote=s.p15===s.p30?'<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:'+GOLD+';margin-top:4px">Tamaño único — mismo precio en 15CM y 30CM.</div>':'';
    // doubleProt/extraSauce reseteados también acá (no solo cheese) — antes, activar
    // "Doble proteína" en un Signature, volver a esta lista y tocar OTRO Signature distinto
    // heredaba el cargo sin que el cliente lo hubiera elegido para ese producto nuevo
    // (resetBuilder() solo corre al ENTRAR al flujo, no al cambiar de tarjeta ya adentro —
    // hallazgo de auditoría UX, CRÍTICO: cobro no consentido).
    return'<div onclick="sigId=\''+s.id+'\';cheese=null;doubleProt=false;extraSauce=false;render()" style="background:'+(sel?'var(--sw-card2,#1A3028)':'var(--sw-card,#2D5246)')+';border:1px solid '+(sel?GOLD:'var(--sw-border,#3A6B58)')+';border-radius:10px;padding:16px;cursor:pointer;margin-bottom:10px;position:relative;transition:all .15s;box-shadow:'+SHADOW_SM+'"><div style="display:flex;gap:14px">'+thumb+'<div style="flex:1;min-width:0">'+selBar(sel)+'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;letter-spacing:.04em;color:'+GOLD+'">'+sigBadge(s)+'</span><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:2px;margin-bottom:6px"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;font-weight:600;color:var(--sw-text,#FFFFFF)">'+s.n+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+sigTypeTag(s.s)+'</span><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:14px;color:'+(sel?GOLD:'var(--sw-text-muted,#A8C8B0)')+';margin-left:12px">'+priceTag+'</span></div>'+lowStockNote(s.prot)+pitchPreview+ingredientsLine+singleSizeNote+'<div onclick="event.stopPropagation();openSigPreview(\''+s.id+'\')" style="margin-top:10px;display:inline-flex;align-items:center;gap:5px;font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.1em;cursor:pointer">'+icon('camera',11,GOLD)+'Ver foto →</div></div></div></div>';
  }).join('');
  var sig=SIGS.find(function(x){return x.id===sigId;});
  return h+'</div>'+(previewSigId?sigPreviewOverlayHTML():'')+AB(size&&sig?sigPrice(sig):null,!!(size&&sigId),'go(\'o_home\')','enterConfirm()');
}
function openSigPreview(id){previewSigId=id;render();}
function closeSigPreview(){previewSigId=null;render();}
// Vista previa "referencial" de un Signature build — hasta tener fotografía
// profesional/IA, se ilustra con la paleta de marca en vez de una foto real.
function sigPreviewOverlayHTML(){
  var s=SIGS.find(function(x){return x.id===previewSigId;});
  if(!s)return'';
  var pr=PROTS.find(function(x){return x.id===s.prot;}),bs=BASES.find(function(x){return x.id===s.base;});
  // A diferencia de fn() (usado en resúmenes de texto plano), acá sí se agrega la
  // descripción larga (`d`) cuando existe — sin esto, ingredientes exclusivos de un
  // Signature (ej. Giardiniera/Au Jus, sigOnly) nunca se explican en ningún otro lugar
  // de la interfaz porque BUILD YOUR OWN (el único paso que sí muestra `d`) los excluye
  // por diseño (hallazgo de auditoría de menú).
  var toppingsLbl=s.tops.map(function(id){var t:any=TOPS.find(function(x){return x.id===id;});return t?t.l+' // '+t.s+(t.d?' — '+t.d:''):'';}).join(' · ');
  var saucesLbl=s.sauces.map(function(id){var sauce=SAUCES.find(function(x){return x.id===id;});return sauce?sauce.l+' // '+sauce.s+(sauce.d?' — '+sauce.d:''):'';}).join(' + ');
  // fixedCheese (SIG02 Mozzarella, SIG03 Cheddar, ver comentario junto a esas entradas en
  // SIGS) — a diferencia de toppings/salsas, no es una elección del cliente, siempre va.
  var ch:any=s.fixedCheese?CHEESE.find(function(x){return x.id===s.fixedCheese;}):null;
  var cheeseLbl=ch?ch.l+(ch.s?' // '+ch.s:'')+(ch.d?' — '+ch.d:''):'';
  var photo=SIG_IMG[s.id];
  var hero=photo
    ?'<div style="position:relative;border-radius:14px 14px 0 0;overflow:hidden;height:220px"><img src="'+photo+'" alt="'+esc(s.n)+'" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"><div style="position:absolute;top:10px;right:14px;z-index:1;font-family:\'EB Garamond\',serif;font-weight:600;font-size:8px;color:rgba(255,255,255,.72);letter-spacing:.15em;text-shadow:0 1px 3px rgba(0,0,0,.6)">Imagen referencial</div><div style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(30,57,50,.92),rgba(30,57,50,.15) 55%,rgba(30,57,50,0));display:flex;flex-direction:column;justify-content:flex-end;padding:20px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:24px;font-weight:640;color:#fff">'+s.n+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+sigTypeTag(s.s)+'</div><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:'+GOLD+';background:rgba(203,162,88,.15);border:1px solid rgba(203,162,88,.4);border-radius:4px;padding:2px 8px;margin-top:8px;display:inline-block;width:fit-content">'+sigBadge(s)+'</span></div></div>'
    // Sin foto no hay nada que rotular como "referencial" — el aviso va SOBRE la foto
    // (ver arriba), que es donde de verdad puede diferir de lo que llega a la mesa.
    // Estaba al revés: se mostraba solo en el placeholder sin imagen, o sea justo donde
    // no había imagen que advertir, y nunca sobre las fotos reales.
    :'<div style="background:linear-gradient(160deg,#2D5246,#1A3028);border-radius:14px 14px 0 0;padding:32px 20px;text-align:center;position:relative;overflow:hidden">'
    +'<div style="margin-bottom:10px;opacity:.55;display:flex;justify-content:center">'+icon('sandwich',56,GOLD)+'</div>'
    +'<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:24px;font-weight:640;color:#fff">'+s.n+'<span class="cut-sep" style="color:'+GOLD+'"> // </span>'+sigTypeTag(s.s)+'</div>'
    +'<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:'+GOLD+';background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.35);border-radius:4px;padding:2px 8px;margin-top:8px;display:inline-block">'+sigBadge(s)+'</span>'
    +'</div>';
  return'<div onclick="closeSigPreview()" style="position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;display:flex;align-items:flex-end;justify-content:center" class="fi">'
    +'<div onclick="event.stopPropagation()" style="background:var(--sw-bg,#1E3932);border-radius:14px 14px 0 0;width:100%;max-width:480px;max-height:88vh;overflow-y:auto">'
    +hero
    +'<div style="padding:20px">'
    +'<p style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-body,#F2F0EB);line-height:1.6;margin-bottom:16px">'+esc(s.pitch||'')+'</p>'
    // el menú secreto (s.secret) nunca revela su composición, ni siquiera desbloqueado — el
    // punto de un menú secreto es que sigue siendo secreto hasta que lo pruebas (pedido
    // explícito del dueño). El resto de Signatures sí muestra el desglose normal.
    +(s.secret
      ?'<div style="background:var(--sw-card,#2D5246);border:1px solid rgba(203,162,88,.35);border-radius:10px;padding:14px 16px;margin-bottom:16px;text-align:center"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:6px">Ingredientes //</div><div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);font-style:italic">Secretos. Se revelan cuando lo pruebas.</div></div>'
      :'<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:16px"><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:'+GOLD+';letter-spacing:.2em;margin-bottom:10px">Ingredientes //</div>'
      +'<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.8">'
      +'<div><span style="color:'+GOLD+'">Pan · </span>'+(bs?bs.l+' // '+bs.s+(bs.d?' — '+bs.d:''):'')+'</div>'
      +'<div><span style="color:'+GOLD+'">Proteína · </span>'+(pr?pr.l+' // '+pr.s+(pr.d?' — '+pr.d:''):'')+'</div>'
      +(cheeseLbl?'<div><span style="color:'+GOLD+'">Queso · </span>'+cheeseLbl+'</div>':'')
      +'<div><span style="color:'+GOLD+'">Toppings · </span>'+toppingsLbl+'</div>'
      +'<div><span style="color:'+GOLD+'">Salsas · </span>'+saucesLbl+'</div>'
      +'</div></div>')
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text-muted,#A8C8B0)">15CM // 30CM</span><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:'+GOLD+'">'+SOLES+pz(s.p15)+' // '+SOLES+pz(s.p30)+'</span></div>'
    +'<button onclick="closeSigPreview();sigId=\''+s.id+'\';go(\'o_sig\')" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:#241a08;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;letter-spacing:.1em;padding:14px;border-radius:10px;text-align:center;margin-bottom:8px">Pedir este Signature //</button>'
    +'<div onclick="closeSigPreview()" style="text-align:center;cursor:pointer;font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em;padding:4px">Cerrar</div>'
    +'</div></div></div>';
}
