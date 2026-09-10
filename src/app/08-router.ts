// SND//WCH — EL ROUTER
//
// Esta parte existe desde el 2026-09-10 y su razón es de negocio, no de orden. `render()` y
// `renderScreen()` vivían DENTRO del archivo del panel de administración, con los 34 `case`
// de sus pantallas escritos ahí mismo. Mientras eso fuera así, el panel no se podía sacar
// del bundle que descarga TODO cliente que abre la carta — y el panel son 313 KB de 819,
// o sea el 39% del código, por 34 pantallas que solo abre el dueño.
//
// Por qué eso importa más de lo que parece: el modelo del negocio dice que el CAC es
// `CPM / (1000 × CTR × CVR) × 1.18`, y que la CONVERSIÓN es la única de las tres variables
// que el negocio controla — las otras dos las fija la subasta de Meta. Un bundle que pesa
// el doble de lo necesario, en una conexión móvil de Trujillo, es fricción en el punto
// exacto donde se pierde al cliente.
//
// El router es la ÚLTIMA parte del CLIENTE (08) a propósito: llama a las pantallas de las
// partes 01-07 y consulta el registro que llenan las partes del panel (09-10). Las
// declaraciones de función se hoistean, así que el orden no cambia el comportamiento; lo
// que dice es quién depende de quién.
//
// ⚠ Una pantalla de CLIENTE nueva se agrega como `case` acá. Una de ADMIN nunca: va al
// registro, en la parte 10. Meter una de admin en el switch vuelve a atar las dos mitades.

// El registro que llena el panel al cargarse. Se declara acá —en el bundle del cliente— para
// que el router pueda preguntar sin saber si el panel existe: un objeto vacío responde "no la
// tengo" igual de bien que uno lleno, y sin una sola condición extra.
var ADMIN_SCREENS: Record<string, () => string> = {};

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
    // El lado se aplica en CADA render y en UN solo sitio. Hacerlo dentro de cada onclick
    // que cambia de pantalla garantizaba lo contrario: la que se olvidara se quedaría del
    // color del otro hermano, sin romper nada y sin que nadie lo notara.
    // El armador y las bebidas son de WICHO —son las pantallas donde el cliente ELIGE—;
    // todo lo demás vive del lado de SANDO. El admin nunca: tiene su propia piel.
    // La decisión de lado vive en `ladoActual()` (02-*), UNA sola vez, porque también la
    // consulta `ACC()` para elegir el color de acento. Dos copias de esta condición serían
    // dos oportunidades de que el fondo diga un lado y el acento diga el otro.
    setLado(ladoActual());
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
          +'<button onclick="applyAppUpdate()" style="all:unset;cursor:pointer;display:block;width:100%;background:'+GOLD+';color:var(--sw-on-gold,#241a08);font-family:\'Bodoni Moda\',serif;font-size:16px;font-weight:700;padding:18px 0;border-radius:10px;text-align:center">Recargar la app</button></div>';
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
    case'delivery_confirm':h=sDeliveryConfirm();break;
    // ── LAS 34 PANTALLAS DEL PANEL YA NO ESTÁN ESCRITAS ACÁ ────────────────────────
    // Estaban como 34 `case` fijos, y eso era lo que ataba el router al panel: mientras el
    // router nombrara cada pantalla de admin, el panel no se podía sacar del bundle que
    // descarga TODO cliente que abre la carta.
    //
    // Ahora el panel se registra a sí mismo en `ADMIN_SCREENS` al cargarse y el router solo
    // pregunta. Si el panel no está cargado no hay entrada y cae al home del cliente — que
    // es exactamente lo que tiene que pasar cuando alguien sin sesión de admin escribe una
    // pantalla de admin en la URL.
    default:
      var pantallaAdmin = ADMIN_SCREENS[sndScreen];
      h = pantallaAdmin ? pantallaAdmin() : sOHome();
  }
  GOLD=_prevGold;
  if(_prevStatusColors)Object.keys(_prevStatusColors).forEach(function(k){STATUSES[k].c=_prevStatusColors[k];});
  var sameScreen=sndScreen===_lastRenderedSc,scrollY=window.scrollY;
  document.body.classList.toggle('no-fi',sameScreen);
  // Banner único y proactivo en vez de dejar que cada acción falle por separado con su
  // propio mensaje genérico — antes no había ninguna detección de modo sin conexión.
  var offlineBanner=isOffline?'<div style="background:var(--sw-warn,#ffa500);color:#1a1200;text-align:center;padding:6px;font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;letter-spacing:.1em;display:flex;align-items:center;justify-content:center;gap:5px">'+icon('warning',12,'#1a1200')+'<span>SIN CONEXIÓN — reconectando…</span></div>':'';
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
