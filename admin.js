// SND//WCH — bundle del PANEL. Generado por scripts/build.mjs; no editar a mano.
// Se carga bajo demanda desde el router (loadAdminBundle) cuando se abre una pantalla
// de admin. Ningún cliente lo descarga: son ~300 KB que antes
// viajaban en index.html a cada celular que abría la carta.
// ADMIN HOME
// Barra flotante de acciones en lote (#113) — aparece solo cuando hay pedidos
// seleccionados; deja avanzar varios a la vez al mismo estado en un solo tap.
function bulkBar() {
    var ids = Object.keys(bulkSelected).filter(function (k) { return bulkSelected[k]; });
    if (!ids.length)
        return '';
    var n = ids.length;
    // Antes cada botón medía ~10px de padding vertical (~34px de alto total) y el botón de
    // cerrar apenas 4px de padding horizontal sin alto fijo — por debajo del mínimo táctil
    // recomendado (~44px), justo en la barra que se usa a las apuradas en hora pico
    // (hallazgo de la re-auditoría del panel admin). Ahora los 4 botones de acción miden
    // ~44px de alto y el botón de cerrar es un cuadrado de 40x40 en vez de un ícono suelto.
    return '<div style="position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(11,11,11,.97);border-top:1px solid var(--sw-border-soft,#1c1c1c);padding:12px 16px;display:flex;gap:6px;align-items:center;padding-bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:110">'
        + '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:' + GOLD + ';flex-shrink:0">' + n + ' sel.</div>'
        + '<button onclick="bulkConfirmPayments()" style="all:unset;box-sizing:border-box;cursor:pointer;flex:1;text-align:center;background:var(--sw-warn,#ffa500);color:var(--sw-on-gold,#241a08);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:15px 4px;border-radius:8px">' + iconTxt('check', 'Pago', 'var(--sw-on-gold,#241a08)') + '</button>'
        + '<button onclick="bulkAdvanceStatus(\'PREPARANDO\')" style="all:unset;box-sizing:border-box;cursor:pointer;flex:1;text-align:center;background:' + STATUSES.PREPARANDO.c + ';color:#fff;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:15px 4px;border-radius:8px">' + STATUSES.PREPARANDO.label + '</button>'
        + '<button onclick="bulkAdvanceStatus(\'EN CAMINO\')" style="all:unset;box-sizing:border-box;cursor:pointer;flex:1;text-align:center;background:' + STATUSES['EN CAMINO'].c + ';color:#fff;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:15px 4px;border-radius:8px">' + STATUSES['EN CAMINO'].label + '</button>'
        + '<button onclick="bulkAdvanceStatus(\'ENTREGADO\')" style="all:unset;box-sizing:border-box;cursor:pointer;flex:1;text-align:center;background:' + STATUSES.ENTREGADO.c + ';color:#fff;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:15px 4px;border-radius:8px">' + STATUSES.ENTREGADO.label + '</button>'
        + '<button onclick="bulkSelected={};render()" aria-label="Cancelar selección" style="all:unset;box-sizing:border-box;cursor:pointer;color:var(--sw-danger,#ff8888);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:18px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + icon('close', 16, 'var(--sw-danger,#ff8888)') + '</button>'
        + '</div>';
}
// Íconos de línea minimalistas — mismo trazo/estilo que el ícono de Instagram del pie
// de página (stroke currentColor, sin relleno), en vez de emoji grandes y de colores
// dispares que no calzan con la estética tipográfica del resto de la app. Nació para el
// grid de herramientas del panel admin; el set se reutiliza también en pantallas de
// cliente (estados vacíos, carrito, insignias) para no mezclar dos lenguajes visuales.
// Etiqueta compacta del método de pago una vez confirmado — antes una vez pagado el
// pedido no mostraba de ninguna forma CÓMO se pagó (solo se veía mientras estaba
// pendiente de confirmar), así que el operador no podía distinguir de un vistazo un
// pedido pagado con tarjeta de uno pagado con crédito o recompensa (hallazgo de la
// re-auditoría del panel admin).
var PAYMENT_METHOD_BADGE = {
    culqi: iconTxt('card', 'Tarjeta', '#8BAF9A'),
    credit: iconTxt('coin', 'Crédito', '#8BAF9A'),
    reward: iconTxt('gift', 'Recompensa', '#8BAF9A'),
    yape: iconTxt('check', 'Yape/Plin', '#8BAF9A'),
    plin: iconTxt('check', 'Yape/Plin', '#8BAF9A'),
    cod: iconTxt('cash', 'Contra entrega', '#8BAF9A'),
};
function minutesAgo(iso) {
    if (!iso)
        return null;
    var t = new Date(iso).getTime();
    if (!t)
        return null;
    return Math.max(0, Math.round((Date.now() - t) / 60000));
}
// Prioridad de triage: pago manual sin confirmar > RECIBIDO > PREPARANDO > EN CAMINO —
// antes la cola ordenaba solo por más reciente, así que un pedido viejo esperando podía
// quedar enterrado bajo pedidos nuevos ya en camino durante una hora pico (hallazgo de la
// auditoría del panel admin).
function orderPriority(o) {
    if ((o.payment_method === 'yape' || o.payment_method === 'plin') && o.payment_status !== 'paid')
        return 0;
    if (o.status === 'RECIBIDO')
        return 1;
    if (o.status === 'PREPARANDO')
        return 2;
    if (o.status === 'EN CAMINO')
        return 3;
    return 4;
}
// La referencia de urgencia de un pedido "para más tarde" es su hora programada, no la
// hora en que se creó — antes el triage y el aviso de "atascado" leían siempre created_at,
// así que un pedido programado para las 8pm creado a las 9am se veía tan urgente/viejo
// como uno inmediato apenas pasaban 10 min desde que se creó (hallazgo de la re-auditoría
// del panel admin: la hora programada existe en la fila pero la cola nunca la miraba).
// CORREGIDO 2026-08-27: se leía `o.scheduled_for`, columna que NO existe en `orders`
// (verificado contra information_schema; ese nombre solo vive en `pending_charges`).
// Siempre daba undefined, así que el badge "programado para HH:MM" nunca se mostró y
// esta misma corrección de urgencia estaba muerta desde que se escribió. La columna
// real es `delivery_time`, que es lo que escribe actPlaceOrder y lo que ya usan los
// crons de la misma tabla.
function orderDueTime(o) {
    return o.delivery_time || o.created_at;
}
// Extraído para que admin_home y "modo foco" (sAdminFocus) ordenen la cola exactamente
// igual — antes este sort vivía solo inline dentro de sAdminHome.
function sortedActiveOrders() {
    return (adminOrders || []).slice().sort(function (a, b) {
        var pa = orderPriority(a), pb = orderPriority(b);
        if (pa !== pb)
            return pa - pb;
        return new Date(orderDueTime(a) || 0).getTime() - new Date(orderDueTime(b) || 0).getTime();
    });
}
// Secciones de accesos rápidos del admin — extraídas a función propia para poder
// reusarlas tanto en el grid de admin_home como en el drawer de navegación lateral
// (adminToolsDrawerOpen/toggleAdminToolsDrawer), alcanzable ahora desde cualquiera de
// las 14 pantallas secundarias del admin sin tener que volver primero a admin_home.
// C5 — SALUD DEL NEGOCIO. Una pantalla que responde "¿hay algo que atender ahora mismo?".
// El panel de negocio (ingresos, productos top, retención) ya existe y es bueno, pero
// contesta otra pregunta — "¿cómo va el negocio?" — y para saber si hay ALGO PENDIENTE hoy
// había que entrar a la cola, al inventario, a reclamaciones y al dashboard por separado y
// deducirlo. Cocinando solo, eso no pasa.
//
// El veredicto de cada señal lo calcula el SERVIDOR (actAdminHealth): acá solo se pinta.
// Si cada pantalla decidiera por su cuenta qué es "problema", dos versiones de la app
// mostrarían distinto el mismo estado del negocio.
var healthData = null, healthErr = '';
async function loadHealth() {
    sndScreen = 'admin_health';
    busy = true;
    busyMsg = 'Revisando el negocio...';
    healthErr = '';
    render();
    try {
        healthData = await api('admin-health', { token: token });
    }
    catch (e) {
        healthData = null;
        healthErr = e.message;
    }
    busy = false;
    render();
}
var HEALTH_LEVELS = {
    ok: { c: 'var(--sw-ok,#25D366)', l: 'OK' },
    atencion: { c: '#ffb84d', l: 'ATENCIÓN' },
    problema: { c: 'var(--sw-danger,#ff8888)', l: 'PROBLEMA' }
};
function sAdminHealth() {
    var h = H('SALUD DEL NEGOCIO', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (healthErr) {
        return h + '<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-danger,#ff8888);background:rgba(255,85,85,.08);border:1px solid rgba(255,85,85,.3);border-radius:10px;padding:14px">' + esc(healthErr) + '</div>'
            + '<div style="margin-top:14px">' + BTN('Reintentar //', 'loadHealth()', true) + '</div></div>';
    }
    if (!healthData)
        return h + '</div>';
    var ov = HEALTH_LEVELS[healthData.overall] || HEALTH_LEVELS.ok;
    var resumen = healthData.overall === 'ok'
        ? 'Nada pendiente. Todo lo que este panel vigila está en orden.'
        : healthData.overall === 'atencion'
            ? 'Nada urgente, pero hay cosas que conviene mirar antes de la próxima tanda.'
            : 'Hay algo que atender ahora — abajo está qué y dónde.';
    h += '<div style="background:var(--sw-card2,#1A3028);border:1px solid ' + ov.c + ';border-radius:12px;padding:18px;margin-bottom:18px">'
        + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + ov.c + ';letter-spacing:.2em">● ' + ov.l + '</div>'
        + '<div style="font-family:\'EB Garamond\',serif;font-size:13px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-top:6px">' + esc(resumen) + '</div>'
        + '</div>';
    h += healthData.signals.map(function (sg) {
        var lv = HEALTH_LEVELS[sg.level] || HEALTH_LEVELS.ok;
        // Las señales en verde se muestran igual, no se ocultan: una lista que solo aparece
        // cuando hay problemas no dice nada sobre lo que sí se está vigilando, y entonces el
        // silencio se lee como "no hay chequeo" en vez de "está bien".
        var clickable = sg.screen && sg.level !== 'ok';
        return '<div' + (clickable ? ' onclick="goHealthTarget(\'' + sg.screen + '\')"' : '') + ' style="background:var(--sw-card,#2D5246);border:1px solid ' + (sg.level === 'ok' ? 'var(--sw-border-soft,#1c1c1c)' : lv.c) + ';border-radius:10px;padding:13px 16px;margin-bottom:8px' + (clickable ? ';cursor:pointer' : '') + '">'
            + '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">'
            + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + esc(sg.label) + '</div>'
            + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:' + lv.c + ';font-variant-numeric:tabular-nums">' + sg.count + '</div>'
            + '</div>'
            + '<div style="font-family:\'EB Garamond\',serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px;line-height:1.4">' + esc(sg.hint) + (clickable ? ' →' : '') + '</div>'
            + '</div>';
    }).join('');
    h += '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:14px">Revisado: ' + esc(new Date(healthData.checkedAt).toLocaleString('es-PE')) + '</div>';
    h += '<div style="margin-top:14px">' + BTN('Volver a revisar //', 'loadHealth()', true) + '</div>';
    return h + '</div>';
}
// Cada señal en rojo/ámbar lleva a la pantalla donde de verdad se arregla — el valor de
// esta vista es acortar el camino entre enterarse y resolver, no solo enterarse.
function goHealthTarget(sc) {
    if (sc === 'admin_inventory')
        return loadInventory();
    if (sc === 'admin_complaints')
        return loadAdminComplaints();
    return loadAdmin();
}
// C6 — PLAN DE TANDA. Proyecta cuánto cocinar de cada insumo para cubrir los próximos N
// días, a partir del consumo real de los pedidos ya pagados.
//
// La pantalla trata la FIABILIDAD como el dato principal, no como una nota al pie: con
// pocas semanas de ventas, una proyección es un número inventado con aspecto de dato — y
// el aspecto de dato es lo que hace que se le crea. Mientras el servidor diga
// `reliable:false`, lo primero que se ve es por qué todavía no se le puede creer, y las
// cantidades quedan explícitamente marcadas como referencia.
var batchPlan = null, batchErr = '', batchCoverDays = 4;
async function loadBatchPlan() {
    sndScreen = 'admin_batch';
    busy = true;
    busyMsg = 'Calculando la tanda...';
    batchErr = '';
    render();
    try {
        batchPlan = await api('admin-batch-plan', { token: token, coverDays: batchCoverDays });
    }
    catch (e) {
        batchPlan = null;
        batchErr = e.message;
    }
    busy = false;
    render();
}
function setBatchCoverDays(d) { batchCoverDays = d; loadBatchPlan(); }
function sAdminBatchPlan() {
    var h = H('PLAN DE TANDA', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (batchErr) {
        return h + '<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-danger,#ff8888);background:rgba(255,85,85,.08);border:1px solid rgba(255,85,85,.3);border-radius:10px;padding:14px">' + esc(batchErr) + '</div>'
            + '<div style="margin-top:14px">' + BTN('Reintentar //', 'loadBatchPlan()', true) + '</div></div>';
    }
    if (!batchPlan)
        return h + '</div>';
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">¿Cuántos días cubre esta tanda? //</div>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">'
        + [2, 3, 4, 7].map(function (d) {
            var sel = batchCoverDays === d;
            return '<div onclick="setBatchCoverDays(' + d + ')" style="flex:1;min-width:64px;text-align:center;background:' + (sel ? 'var(--sw-card2,#1A3028)' : 'var(--sw-card,#2D5246)') + ';border:1px solid ' + (sel ? GOLD : '#3A6B58') + ';border-radius:8px;padding:10px 6px;cursor:pointer;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:' + (sel ? '#fff' : '#A8C8B0') + '">' + d + ' días</div>';
        }).join('')
        + '</div>';
    if (!batchPlan.reliable) {
        // Primero el motivo, antes que cualquier cantidad: si las cifras aparecieran arriba,
        // se leerían como una indicación y el aviso quedaría como letra chica.
        h += '<div style="background:rgba(255,184,77,.1);border:1px solid #ffb84d;border-radius:10px;padding:14px;margin-bottom:16px">'
            + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:#ffb84d">Todavía es una referencia, no una indicación</div>'
            + '<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-top:6px">Hay ' + batchPlan.ordersConsidered + ' pedido(s) en ' + batchPlan.daysOfData + ' día(s) de historial. Para proyectar de verdad hacen falta al menos ' + batchPlan.minOrders + ' pedidos y ' + batchPlan.minDaysOfData + ' días. Úsalo como punto de partida y corrígelo con lo que veas en cocina.</div>'
            + '</div>';
    }
    if (!batchPlan.items.length) {
        return h + '<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">Todavía no hay consumo registrado ni pedidos programados: no hay nada que proyectar.</div></div>';
    }
    h += '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:12px;line-height:1.5">Consumo de los últimos ' + batchPlan.daysOfData + ' día(s) proyectado a ' + batchPlan.coverDays + ', con un margen de ' + Math.round((batchPlan.safetyFactor - 1) * 100) + '% para no quedarte corto. Los pedidos ya programados se cuentan como piso.</div>';
    h += batchPlan.items.map(function (it) {
        var cocinar = it.toCook;
        return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:13px 16px;margin-bottom:8px">'
            + '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">'
            + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + esc(it.name) + '</div>'
            + '<div style="text-align:right;flex-shrink:0">'
            + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:' + GOLD + ';font-variant-numeric:tabular-nums;line-height:1">' + (cocinar == null ? '—' : cocinar) + '</div>'
            + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:8px;color:' + GOLD + ';letter-spacing:.1em">COCINAR</div>'
            + '</div></div>'
            + '<div style="font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:5px;line-height:1.45">'
            + 'Necesitas ' + it.needed + ' · ' + (it.stockTracked ? 'tienes ' + it.stock : 'sin rastreo de cantidad — ponle un número en Inventario para saber cuánto falta')
            + ' · usaste ' + it.usedInWindow + ' en ' + batchPlan.daysOfData + ' día(s) (' + it.perDay + '/día)'
            + (it.committed ? ' · ' + it.committed + ' ya pedido(s) para esos días' : '')
            + '</div></div>';
    }).join('');
    h += '<div style="margin-top:14px">' + BTN('Registrar la tanda en Inventario //', 'loadInventory();setInvMode(\'tanda\')', true) + '</div>';
    return h + '</div>';
}
// D5 — GUION DE VIDEO. El backend para esto (actions/video.ts) estaba implementado y
// registrado desde hace tiempo, pero NINGUNA pantalla lo llamaba: el dueño no tenía forma
// de llegar a él. La mitad que importa es gratis y funciona hoy — genera el guion, el
// prompt para Veo/Flow, el pie de publicación y los hashtags a partir de la receta REAL
// del Signature (no de una descripción escrita a mano que se desactualiza). La otra mitad
// (generar el MP4 con la API de Veo) cuesta dinero real y necesita GEMINI_API_KEY, así que
// esa se deja como está: sin la key el servidor responde con instrucciones en vez de
// fallar, y el prompt igual sirve para pegarlo a mano en Flow, que es lo que el dueño ya
// hace.
var vidScript = null, vidSigId = '', vidAngle = '', vidFormato = '', vidErr = '';
async function loadVideoScript() {
    sndScreen = 'admin_video';
    vidErr = '';
    if (!vidSigId) {
        var first = SIGS.find(function (x) { return !x.secret; });
        vidSigId = first ? first.id : 'SIG01';
    }
    busy = true;
    busyMsg = 'Armando el guion...';
    render();
    try {
        vidScript = await api('admin-video-script', { token: token, sigId: vidSigId, angle: vidAngle || undefined, formato: vidFormato || undefined });
        if (!vidAngle && vidScript && vidScript.angle)
            vidAngle = vidScript.angle.key;
        if (!vidFormato && vidScript && vidScript.formato)
            vidFormato = vidScript.formato.key;
    }
    catch (e) {
        vidScript = null;
        vidErr = e.message;
    }
    busy = false;
    render();
}
function pickVideoSig(id) { vidSigId = id; loadVideoScript(); }
function pickVideoAngle(k) { vidAngle = k; loadVideoScript(); }
function pickVideoFormato(k) { vidFormato = k; loadVideoScript(); }
function sAdminVideo() {
    var h = H('GUION DE VIDEO', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5;margin-bottom:16px">El guion y el prompt salen de la receta real del Signature, así que si cambias la composición desde el panel, el video que generes ya refleja el cambio.</div>';
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">¿Qué sándwich? //</div>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">'
        + SIGS.filter(function (x) { return !x.secret; }).map(function (x) {
            var sel = vidSigId === x.id;
            return '<div onclick="pickVideoSig(\'' + x.id + '\')" style="background:' + (sel ? 'var(--sw-card2,#1A3028)' : 'var(--sw-card,#2D5246)') + ';border:1px solid ' + (sel ? GOLD : '#3A6B58') + ';border-radius:20px;padding:8px 14px;cursor:pointer;font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:' + (sel ? '#fff' : '#A8C8B0') + '">' + esc(x.n) + '</div>';
        }).join('')
        + '</div>';
    if (vidErr) {
        h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-danger,#ff8888);background:rgba(255,85,85,.08);border:1px solid rgba(255,85,85,.3);border-radius:10px;padding:14px">' + esc(vidErr) + '</div>';
        return h + '</div>';
    }
    if (!vidScript)
        return h + '</div>';
    // El FORMATO primero: es quién actúa, y manda sobre cómo se filma. Son los mismos cinco
    // (A-E) que el calendario semanal ya usa, así que el borrador del lunes y el prompt que se
    // pega en Flow hablan el mismo idioma en vez de proponer dos videos distintos.
    if (vidScript.formatos && vidScript.formatos.length) {
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">¿Qué formato? //</div>';
        h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">'
            + vidScript.formatos.map(function (f) {
                var sel = (vidScript.formato && vidScript.formato.key) === f.key;
                return '<div onclick="pickVideoFormato(\'' + f.key + '\')" style="background:' + (sel ? 'var(--sw-card2,#1A3028)' : 'var(--sw-card,#2D5246)') + ';border:1px solid ' + (sel ? GOLD : '#3A6B58') + ';border-radius:20px;padding:8px 14px;cursor:pointer;font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:' + (sel ? '#fff' : '#A8C8B0') + '">' + esc(f.letra + ' · ' + f.label) + '</div>';
            }).join('')
            + '</div>';
    }
    // El plano solo tiene sentido si el formato muestra el producto — EL SECRETO no lo muestra.
    if (vidScript.angles && vidScript.angles.length && vidScript.formato && vidScript.formato.key !== 'secreto') {
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">¿Qué plano? //</div>';
        h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">'
            + vidScript.angles.map(function (a) {
                var sel = (vidScript.angle && vidScript.angle.key) === a.key;
                return '<div onclick="pickVideoAngle(\'' + a.key + '\')" style="background:' + (sel ? 'var(--sw-card2,#1A3028)' : 'var(--sw-card,#2D5246)') + ';border:1px solid ' + (sel ? GOLD : '#3A6B58') + ';border-radius:20px;padding:8px 14px;cursor:pointer;font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:' + (sel ? '#fff' : '#A8C8B0') + '">' + esc(a.label) + '</div>';
            }).join('')
            + '</div>';
    }
    var g = vidScript.guion || {};
    h += '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:16px;margin-bottom:12px">'
        + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:640;color:var(--sw-text,#FFFFFF);margin-bottom:10px">' + esc(vidScript.name || '') + '</div>'
        + [['Formato', g.formato], ['Personajes', g.personajes], ['Duración', g.duracion], ['Encuadre', g.encuadre], ['Plano', g.plano], ['Acción', g.accion], ['Pan', g.pan], ['Ingredientes', g.ingredientes], ['Ojo', g.nota]]
            .filter(function (r) { return r[1]; })
            .map(function (r) { return '<div style="display:flex;gap:10px;margin-bottom:6px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.1em;min-width:88px;flex-shrink:0;padding-top:2px">' + r[0].toUpperCase() + '</div><div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">' + esc(String(r[1])) + '</div></div>'; }).join('')
        + '</div>';
    // Los tres bloques que se COPIAN. Cada uno con su botón: el prompt va a Flow, el pie y
    // los hashtags van a Instagram — son destinos distintos, así que copiarlos juntos
    // obligaría a recortar a mano justo cuando el dueño está apurado publicando.
    h += copyBlockHTML('Prompt para Flow', 'vid-prompt', vidScript.flowPrompt || '');
    h += copyBlockHTML('Pie de publicación', 'vid-caption', vidScript.caption || '');
    h += copyBlockHTML('Hashtags', 'vid-tags', vidScript.hashtags || '');
    if (vidScript._nota) {
        h += '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:12px;line-height:1.5">' + esc(vidScript._nota) + '</div>';
    }
    h += '<div style="margin-top:14px">' + BTN('Otro plano al azar //', 'vidAngle=\'\';loadVideoScript()', true) + '</div>';
    return h + '</div>';
}
// Bloque de texto copiable — se usa tres veces en la pantalla de guion. El textarea es
// readonly y no un <div>: copiar desde un div obliga a seleccionar a mano en móvil, que es
// justo donde el dueño va a estar cuando publique.
function copyBlockHTML(titulo, id, texto) {
    return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:10px">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:10px">'
        + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.15em">' + esc(titulo).toUpperCase() + '</div>'
        + '<button onclick="copyFromField(\'' + id + '\')" style="all:unset;cursor:pointer;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:' + GOLD + ';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:600;padding:8px 14px;border-radius:8px;flex-shrink:0">Copiar</button>'
        + '</div>'
        + '<textarea id="' + id + '" readonly style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:10px 12px;color:var(--sw-text-body,#F2F0EB);width:100%;font-size:12px;font-family:EB Garamond,serif;min-height:' + (texto.length > 200 ? '110px' : '64px') + ';box-sizing:border-box;resize:vertical">' + esc(texto) + '</textarea>'
        + '</div>';
}
async function copyFromField(id) {
    var el = document.getElementById(id);
    if (!el)
        return;
    try {
        await navigator.clipboard.writeText(el.value);
        showToast('Copiado.');
    }
    catch (e) {
        // Sin permiso de portapapeles (o navegador viejo): seleccionar el texto deja al dueño
        // a un toque de copiarlo a mano, en vez de dejarlo sin salida.
        el.focus();
        el.select();
        showToast('Selecciónalo y copia con el teclado.');
    }
}
function adminToolsSections() {
    return [
        ['Clientes y ventas //', [
                ['clientes', 'Clientes', 'sndScreen=\'admin_customer\';custDetail=null;custDetailPhone=\'\';custDetailErr=\'\';render()'],
                ['buscar', 'Buscar pedidos', 'sndScreen=\'admin_search\';searchResults=null;render()'],
                ['reportes', 'Reportes', 'sndScreen=\'admin_report\';reportData=null;render()'],
                ['estrella', 'Calificaciones', 'loadRatingsList()'],
                ['reclamo', 'Reclamaciones', 'loadAdminComplaints()'],
            ]],
        ['Marketing //', [
                ['calendar', 'Calendario de contenido', 'loadCalendar()'],
                ['camera', 'Guion de video', 'loadVideoScript()'],
                ['megaphone', 'Contenido semanal', 'loadMarketingContent()'],
                ['precios', 'Códigos promo', 'loadPromoCodes()'],
                ['estrella', 'Rendimiento campañas', 'loadCampaignPerformance()'],
                // Las tres palancas del modelo financiero, medidas contra lo que el modelo asume.
                // Va en Marketing y no en "Salud del sistema" porque las tres se mueven con
                // decisiones de marketing y producto, no con infraestructura.
                ['reportes', 'Las tres palancas', 'loadPalancas()'],
                ['clientes', 'Lista de espera', 'loadWaitlist()'],
            ]],
        ['Catálogo //', [
                ['inventario', 'Inventario', 'loadInventory()'],
                ['precios', 'Precios', 'loadAdminCatalog()'],
                ['horario', 'Horario', 'loadStoreHoursForm()'],
                ['lock', 'Menú secreto', 'loadSecretSignatureAdmin()'],
                ['precios', 'Signatures', 'loadCatalogItemsAdmin()'],
            ]],
        ['Cuenta //', [
                ['puntos', 'Puntos manuales', 'sndScreen=\'admin_gen\';agPhone=\'\';agPts=\'\';agMsg=\'\';acPhone=\'\';acDelta=\'\';acMsg=\'\';render()'],
                ['admins', 'Administradores', 'loadAdminMgr()'],
                ['auditoria', 'Auditoría', 'loadAuditLog()'],
            ]],
        ['Cocina y operación //', [
                ['warning', 'Salud del negocio', 'loadHealth()'],
                ['prep', 'Preparación', 'loadPrepList()'],
                ['recipe', 'Recetas', 'loadRecipes()'],
                ['inventario', 'Plan de tanda', 'loadBatchPlan()'],
                ['caja', 'Cierre de caja', 'loadCashClose()'],
                ['caja', 'Compras y costos', 'loadPurchases()'],
                ['caja', 'Tarjeta / Culqi', 'loadCulqiReport()'],
                ['franjas', 'Franjas horarias', 'loadTimeWindowReport()'],
                ['direccion', 'Direcciones', 'loadProblemAddresses()'],
            ]],
        ['Salud del sistema //', [
                ['warning', 'Salud técnica', 'loadTechHealth()'],
                ['reclamo', 'Cumplimiento', 'loadCompliance()'],
            ]],
    ];
}
// Grid de 2 columnas agrupado por sección — mismo HTML que ya usaba admin_home, ahora
// también reusado por el drawer de navegación lateral.
function adminToolsGridHTML() {
    return adminToolsSections().map(function (section) {
        return '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin:18px 0 10px">' + section[0] + '</div>'
            + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
            + section[1].map(function (x) { return '<div onclick="' + x[2] + '" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 12px;cursor:pointer;text-align:center"><div style="width:36px;height:36px;border-radius:50%;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);display:flex;align-items:center;justify-content:center;margin:0 auto 8px">' + icon(x[0]) + '</div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;color:' + GOLD + ';letter-spacing:.03em">' + x[1] + '</div></div>'; }).join('')
            + '</div>';
    }).join('');
}
function sAdminHome() {
    var ao = sortedActiveOrders();
    // Banner de las tres señales de dirección de la cola (#22 duplicada, #21 ambigua,
    // #17 agrupable). Devuelve '' cuando no hay nada que decir — una franja permanente que casi
    // siempre dice "todo bien" se deja de leer, y entonces no se lee el día que dice otra cosa.
    // #28 — El veredicto de la lectura del comprobante.
    //
    // Tres estados y ninguno dice "pagado": el pago lo confirma el dueño mirando su cuenta. Lo
    // que esto ahorra es entrecerrar los ojos para comparar el monto y acordarse de si esa
    // captura ya la vio.
    //
    // El caso "no se pudo leer" se muestra igual que los otros dos, a propósito. Callarlo haría
    // que la ausencia de aviso pareciera aprobación — y esa es exactamente la confusión que
    // convierte una ayuda en un riesgo.
    function receiptOcrHTML(o) {
        var st = receiptOcrState[o.ref];
        if (!st)
            return '';
        var caja = function (color, texto) {
            return '<div style="background:rgba(' + color + ',.12);border:1px solid rgba(' + color + ',.35);border-radius:8px;padding:9px 12px;margin-bottom:8px;font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">' + texto + '</div>';
        };
        if (st.loading)
            return caja('168,200,176', 'Leyendo el comprobante…');
        if (st.error)
            return caja('168,200,176', 'No se pudo leer el comprobante (' + esc(st.error) + '). Revísalo a ojo, como siempre.');
        var c = st.checks || {}, f = st.fields || {};
        var money = function (n) { return 'S/' + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2); };
        if (c.duplicateOpRefs && c.duplicateOpRefs.length) {
            return caja('255,85,85', '<b>Esta misma operación ya respalda ' + c.duplicateOpRefs.map(esc).join(', ') + '.</b> Una transferencia no puede pagar dos pedidos — compáralos antes de confirmar.');
        }
        if (c.verdict === 'ok') {
            return caja('37,211,102', 'El monto de la captura (' + money(c.amountRead) + ') coincide con el pedido' + (f.opNumber ? ' · op. ' + esc(f.opNumber) : '') + (f.dateText ? ' · ' + esc(f.dateText) : '') + '. <b>Igual confirma contra tu cuenta</b>: una captura se puede editar.');
        }
        if (c.verdict === 'revisar') {
            return caja('255,85,85', '<b>La captura dice ' + money(c.amountRead) + ' y el pedido es ' + money(c.expected) + '.</b> Revísalo antes de confirmar.');
        }
        return caja('255,165,0', 'No se reconoció el monto en la captura. Compáralo a ojo — que no se haya leído no significa que esté bien.');
    }
    function addressFlagsBanner() {
        var f = adminAddressFlags;
        if (!f)
            return '';
        var filas = [];
        function fila(color, texto) {
            return '<div style="background:rgba(' + color + ',.12);border-bottom:1px solid rgba(' + color + ',.3);padding:8px 20px;font-family:\'EB Garamond\',serif;font-size:10px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">' + texto + '</div>';
        }
        (f.duplicates || []).forEach(function (d) {
            filas.push(fila('255,165,0', '<b>Misma dirección</b> en ' + d.refs.length + ' pedidos (' + d.refs.map(esc).join(', ') + ') — casi siempre es un pedido partido en dos: se entregan juntos y es un viaje.'));
        });
        (f.nearby || []).forEach(function (n) {
            filas.push(fila('203,162,88', '<b>' + n.refs.length + ' pedidos a la zona «' + esc(n.zone) + '»</b> con poca diferencia (' + n.refs.map(esc).join(', ') + ') — salen en un solo viaje.'));
        });
        (f.ambiguous || []).forEach(function (a) {
            filas.push(fila('255,85,85', '<b>' + esc(a.ref) + '</b>: dirección ' + a.reasons.map(esc).join(' y ') + '. Pregúntale ANTES de despachar.'));
        });
        return filas.join('');
    }
    var badge = ao.length;
    return '<div style="min-height:100vh;display:flex;flex-direction:column;background:var(--sw-bg,#1E3932)">'
        + '<div style="padding:20px 20px 16px;border-bottom:1px solid var(--sw-border,#3A6B58);display:flex;justify-content:space-between;align-items:center">'
        + '<div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:19px;font-weight:640;color:var(--sw-text,#FFFFFF);text-wrap:balance">Panel<span class="cut-sep" style="color:' + GOLD + '"> // </span>Operador</div>'
        + (badge > 0 ? '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + STATUSES.RECIBIDO.c + ';letter-spacing:.1em;margin-top:3px" class="pulse">● ' + badge + ' Acción requerida</div>' : '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:3px">todo en orden //</div>')
        + '</div><button onclick="loadAdmin()" title="Actualizar ahora" aria-label="Actualizar ahora" style="all:unset;cursor:pointer;font-size:16px;width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' + icon('refresh', 16) + '</button>'
        + '<button onclick="toggleAdminLight()" title="Modo claro/oscuro" aria-label="Cambiar modo claro/oscuro" style="all:unset;cursor:pointer;font-size:16px;width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">' + icon(adminLightMode ? 'moon' : 'sun', 16) + '</button>'
        + '<button onclick="stopPoll();sndScreen=\'o_home\';sndTab=\'order\';render()" style="all:unset;cursor:pointer;font-family:\'EB Garamond\',serif;font-size:12px;color:' + GOLD + '">← salir</button></div>'
        + (adminOrdersTruncated ? '<div style="background:rgba(255,165,0,.12);border-bottom:1px solid rgba(255,165,0,.3);padding:8px 20px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:' + GOLD + ';display:flex;align-items:center;gap:5px">' + icon('warning', 12, GOLD) + '<span>Hay más pedidos activos de los que se muestran aquí (solo los ' + ao.length + ' más recientes).</span></div>' : '')
        // Antes un poll fallido quedaba en silencio total — el operador podía estar viendo
        // un estado desactualizado sin ninguna señal de que la actualización automática dejó
        // de funcionar.
        + (pollFailing ? '<div style="background:rgba(255,85,85,.12);border-bottom:1px solid rgba(255,85,85,.3);padding:8px 20px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-danger,#ff8888);display:flex;align-items:center;gap:5px">' + icon('warning', 12, 'var(--sw-danger,#ff8888)') + '<span>No se pudo actualizar la cola de pedidos — reintentando…</span></div>' : '')
        // #22 / #21 / #17 — Tres cosas que la cola ya sabía y no decía. Van ARRIBA de la lista
        // porque las tres son decisiones que se toman ANTES de despachar: juntar dos pedidos,
        // llamar para pedir la referencia que falta, o mandar dos en un viaje. Descubrirlas
        // después es un viaje pagado de más o un motorizado dando vueltas.
        + addressFlagsBanner()
        + '<div style="flex:1;padding:20px;overflow-y:auto" class="fi">'
        + '<div onclick="loadDashboard()" style="background:var(--sw-card2,#1A3028);border:1px solid ' + GOLD + ';border-radius:12px;padding:18px;margin-bottom:18px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;box-shadow:' + SHADOW_SM + '">'
        + '<div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:640;color:var(--sw-text,#FFFFFF);text-wrap:balance">Panel<span class="cut-sep" style="color:' + GOLD + '"> // </span>de negocio</div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em;margin-top:2px">ventas · productos top · clientes · puntos</div></div>'
        + '<span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:' + GOLD + '">Ver →</span></div>'
        + '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>'
        // Grid de accesos rápidos movido ARRIBA de "Pedidos activos" — antes quedaba
        // debajo de toda la cola, obligando a scrollear pasado cada pedido activo para
        // llegar a cualquier herramienta (hallazgo de auditoría UX, confirmado por el
        // dueño). Ahora reusa adminToolsGridHTML() (ver arriba), la misma función que
        // alimenta el drawer de navegación lateral desde las 14 pantallas secundarias.
        + adminToolsGridHTML()
        // Modo foco — un solo pedido a pantalla completa con la acción principal anclada al
        // fondo del viewport (zona real del pulgar, ver comentario en la tarjeta de abajo).
        // Solo tiene sentido con al menos un pedido activo.
        + (ao.length ? '<div onclick="enterFocusMode()" style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card2,#1A3028);border:1px solid ' + GOLD + ';border-radius:10px;padding:12px 16px;margin-bottom:18px;cursor:pointer"><span style="display:inline-flex;align-items:center;gap:8px;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:' + GOLD + '">' + icon('compass', 15, GOLD) + 'Modo foco — un pedido a la vez</span><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:' + GOLD + '">Entrar →</span></div>' : '')
        // Active orders
        + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:12px">Pedidos activos // ' + (ao.length || 'ninguno') + '</div>'
        + (ao.length ? ao.map(function (o) {
            var s = STATUSES[o.status] || STATUSES['RECIBIDO'];
            var manualPending = (o.payment_method === 'yape' || o.payment_method === 'plin') && o.payment_status !== 'paid';
            // El checkout ya no obliga al cliente a declarar Yape vs Plin por separado (ambos
            // muestran el mismo número) — la etiqueta aquí es genérica a propósito, incluso
            // para pedidos viejos que sí guardaron 'plin' literal antes de este cambio.
            var manualLabel = 'Yape/Plin';
            var checked = !!bulkSelected[o.id];
            // "Hace X min" + borde rojo pulsante pasados 10 min sin arrancar — antes la única
            // pista de cuánto llevaba esperando un pedido era leer la hora absoluta y restarla
            // mentalmente (hallazgo de la auditoría del panel admin: fácil pasar por alto el
            // más viejo durante una hora pico). El aviso de atascado usa minsDue (minutos desde
            // que el pedido DEBÍA empezar, es decir desde scheduled_for si lo tiene) para que un
            // pedido programado para más tarde no se marque "atascado" mientras aún falta para
            // su hora — "hace X min" en la tarjeta sigue mostrando el tiempo desde que se creó,
            // que es la info que le interesa al operador.
            var mins = minutesAgo(o.created_at);
            var minsDue = minutesAgo(orderDueTime(o));
            var isScheduledAhead = o.delivery_time && new Date(o.delivery_time).getTime() > Date.now();
            var isStale = (o.status === 'RECIBIDO' || manualPending) && !isScheduledAhead && minsDue !== null && minsDue >= 10;
            // Antes toda la tarjeta pulsaba (class="pulse" en el contenedor completo), lo que
            // atenúa TODO al 35% de opacidad en cada ciclo — incluido el botón de acción, que
            // se veía deshabilitado justo cuando más urge tocarlo (hallazgo de auditoría de
            // diseño admin, ALTO). Ahora el pulso vive solo en un punto de acento junto al
            // "hace X min" — la tarjeta y su botón quedan siempre legibles.
            return '<div style="background:var(--sw-card,#2D5246);border:1px solid ' + (isStale ? STATUSES.RECIBIDO.c : (o.status === 'RECIBIDO' ? STATUSES.RECIBIDO.c : 'var(--sw-border-soft,#1c1c1c)')) + ';border-radius:10px;padding:16px;margin-bottom:12px">'
                + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'
                + '<div style="display:flex;gap:10px;flex:1">'
                + '<input type="checkbox" onchange="toggleBulkSelect(\'' + o.id + '\')" ' + (checked ? 'checked' : '') + ' style="margin-top:3px;width:18px;height:18px;flex-shrink:0;accent-color:' + GOLD + '">'
                + '<div style="flex:1"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:17px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + esc(o.customer_name) + '</div>'
                + '<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">' + esc(o.customer_address) + '</div>'
                + '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:' + (isStale ? STATUSES.RECIBIDO.c : 'var(--sw-text-muted,#A8C8B0)') + ';margin-top:4px;display:flex;align-items:center;gap:5px">' + (isStale ? '<span class="pulse" style="width:6px;height:6px;border-radius:50%;background:' + STATUSES.RECIBIDO.c + ';display:inline-block;flex-shrink:0"></span>' : '') + '<span>' + esc(o.ref) + ' · ' + SOLES + pz(o.total) + ' · ' + esc(o.date) + (mins !== null ? ' · hace ' + mins + ' min' : '') + '</span></div>'
                + (isScheduledAhead ? '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:' + GOLD + ';margin-top:2px;display:flex;align-items:center;gap:5px">' + icon('horario', 12, GOLD) + '<span>programado para ' + esc(new Date(o.delivery_time).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })) + '</span></div>' : '')
                // Antes la ETA que el operador ingresaba al marcar "EN CAMINO" quedaba guardada
                // (eta_minutes) pero nunca se mostraba de vuelta en su propia cola — solo el
                // cliente la ve (ver el mensaje de WhatsApp) (hallazgo de la re-auditoría del
                // panel admin: el operador no tenía forma de recordar qué ETA le prometió a cada
                // cliente sin abrir el detalle del pedido).
                + (o.status === 'EN CAMINO' && o.eta_minutes ? '<div onclick="event.stopPropagation();editEta(\'' + o.id + '\',' + o.eta_minutes + ')" style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:#3A86FF;margin-top:2px;display:flex;align-items:center;gap:5px;cursor:pointer">' + icon('moto', 12, '#3A86FF') + '<span>ETA ~' + o.eta_minutes + ' min · editar</span></div>' : '') + '</div></div>'
                + stBadge(o.status) + '</div>'
                + '<div style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:12px">' + esc(o.summary) + '</div>'
                // Receta expandida: sin esto un BUILD YOUR OWN solo mostraba el nombre de la
                // proteína y era imposible prepararlo (ver itemRecipeLines).
                + orderRecipeHTML(o.items)
                + (o.redeemed_reward ? '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-ok,#25D366);margin-bottom:10px;display:flex;align-items:center;gap:5px">' + icon('gift', 12, 'var(--sw-ok,#25D366)') + '<span>' + esc(o.redeemed_reward) + '</span></div>' : '')
                + (o.payment_method === 'cod' && o.payment_status !== 'paid' ? '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-warn,#ffa500);margin-bottom:10px;display:flex;align-items:center;gap:5px">' + icon('cash', 12, 'var(--sw-warn,#ffa500)') + '<span>Cobrar ' + SOLES + pz(o.total) + ' al entregar</span></div>' : '')
                + (manualPending ? '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-warn,#ffa500);margin-bottom:8px;display:flex;align-items:center;gap:5px">' + icon('warning', 12, 'var(--sw-warn,#ffa500)') + '<span>Pago ' + manualLabel + ' sin confirmar — revisa tu app antes de continuar</span></div>' : '')
                + (o.payment_status === 'paid' && PAYMENT_METHOD_BADGE[o.payment_method] ? '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted2,#8BAF9A);margin-bottom:10px">' + PAYMENT_METHOD_BADGE[o.payment_method] + '</div>' : '')
                // El comprobante NUNCA reemplaza el botón de confirmar pago de abajo — es solo un
                // apoyo visual opcional que el cliente pudo subir (ver actAdminReceiptUrl).
                + (o.receipt_path ? '<button onclick="viewReceipt(\'' + o.id + '\')" style="all:unset;cursor:pointer;display:block;width:100%;text-align:center;background:rgba(168,200,176,.12);border:1px solid rgba(168,200,176,.4);color:var(--sw-text-muted,#A8C8B0);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:600;letter-spacing:.04em;padding:15px 4px;border-radius:8px;margin-bottom:8px">' + iconTxt('clip', 'Ver comprobante', '#A8C8B0') + '</button>' : '')
                // #28 — Lo que se leyó del comprobante. Va PEGADO al botón, que es donde el dueño
                // está mirando cuando decide si confirma el pago.
                + (o.receipt_path ? receiptOcrHTML(o) : '')
                // Imprimir/WhatsApp son acciones secundarias (se usan, pero no en cada pedido) —
                // antes ocupaban una fila completa cada una, alargando la tarjeta innecesariamente.
                // Una fila de 2 columnas compactas deja la acción principal (avanzar estado) como
                // lo único que realmente domina visualmente la tarjeta.
                + '<div style="display:flex;gap:8px;margin-bottom:8px">'
                + '<button onclick="printTicket(\'' + o.id + '\')" style="all:unset;cursor:pointer;flex:1;text-align:center;background:rgba(139,175,154,.12);border:1px solid rgba(139,175,154,.4);color:var(--sw-text-muted,#A8C8B0);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:600;letter-spacing:.04em;padding:15px 4px;border-radius:8px">' + iconTxt('printer', 'Ticket', '#A8C8B0') + '</button>'
                + ((o.contact_phone || o.customer_phone) ? '<button onclick="waAdmin(\'' + o.id + '\')" style="all:unset;cursor:pointer;flex:1;text-align:center;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:' + GOLD + ';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:600;letter-spacing:.04em;padding:15px 4px;border-radius:8px">' + iconTxt('chat', 'WhatsApp', GOLD) + '</button>' : '')
                + '</div>'
                // Botón principal agrandado (padding/tamaño de fuente) — "zona del pulgar" real
                // (position:fixed sobre todo el viewport) exigiría antes resolver "modo foco" de
                // un solo pedido a pantalla completa (con varias tarjetas en la cola, un botón
                // fijo de viewport no tiene un pedido único al que apuntar); mientras tanto, un
                // tap target mucho más grande es la mejora de ergonomía que sí se puede aplicar
                // ya, tarjeta por tarjeta, sin ese rediseño más grande.
                + (manualPending
                    ? '<button onclick="confirmAndAdvance(\'' + o.id + '\')" style="all:unset;cursor:pointer;display:block;width:100%;background:' + GOLD + ';color:#000;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:700;letter-spacing:.04em;padding:18px 0;border-radius:10px;text-align:center;margin-bottom:6px">' + iconTxt('check', 'Confirmar pago y preparar', '#000') + '</button>'
                        + '<button onclick="confirmOrderPayment(\'' + o.id + '\')" style="all:unset;cursor:pointer;display:block;width:100%;text-align:center;color:var(--sw-text-muted2,#8BAF9A);font-family:\'EB Garamond\',serif;font-size:10px;padding:6px 0;margin-bottom:8px">solo confirmar el pago, sin avanzar todavía</button>'
                    : (s.next ? '<button onclick="updateStatus(\'' + o.id + '\',\'' + s.next + '\')" style="all:unset;cursor:pointer;display:block;width:100%;background:' + STATUSES[s.next].c + ';color:#000;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:16px;font-weight:700;letter-spacing:.04em;padding:18px 0;border-radius:10px;text-align:center">' + (STATUSES[s.next].icon && ICONS[STATUSES[s.next].icon] ? icon(STATUSES[s.next].icon, 15, '#000') + ' ' : '') + 'Marcar como ' + STATUSES[s.next].label.toLowerCase() + ' →</button>' : '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:10px;color:var(--sw-ok,#25D366);text-align:center;padding:8px">' + iconTxt('check', 'Completado', 'var(--sw-ok,#25D366)') + '</div>'))
                // Antes este botón solo aparecía para pagos manuales sin confirmar — un pedido ya
                // pagado con tarjeta/crédito no tenía NINGUNA forma de cancelarse en la app
                // (hallazgo de la auditoría de flujo de pedidos: sin esto, si se acaba un
                // ingrediente a media preparación, el operador queda sin opciones).
                + '<button onclick="cancelOrder(\'' + o.id + '\')" style="all:unset;cursor:pointer;display:block;width:100%;background:transparent;border:1px solid rgba(255,85,85,.4);color:var(--sw-danger,#ff8888);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;letter-spacing:.06em;padding:9px 0;border-radius:8px;text-align:center">' + iconTxt('close', 'Cancelar pedido' + (manualPending ? ' (nunca pagó)' : ''), 'var(--sw-danger,#ff8888)') + '</button>'
                + '</div>';
        }).join('') : '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-card,#2D5246);border-radius:10px;padding:24px 20px;text-align:center;margin-bottom:8px">' + icon('check', 28, 'var(--sw-ok,#25D366)') + '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:8px">Sin pedidos activos //</div></div>')
        + (!cust || !('serviceWorker' in navigator) || !('PushManager' in window) ? '' : '<div onclick="togglePushNotifications()" style="margin-top:18px;background:var(--sw-card,#2D5246);border:1px solid ' + (pushSubscribed ? GOLD : '#1c1c1c') + ';border-radius:10px;padding:12px 16px;cursor:pointer"><div style="display:flex;justify-content:space-between;align-items:center"><span style="display:inline-flex;align-items:center;gap:8px;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text-muted,#A8C8B0)">' + icon('notif') + 'Alertas de pedidos y stock</span><span style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:14px;color:' + (pushSubscribed ? GOLD : '#A8C8B0') + '">' + (pushSubscribed ? '✓ Activo' : '○ Activar') + '</span></div>' + (pushMsg ? '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:' + GOLD + ';margin-top:6px">' + esc(pushMsg) + '</div>' : '') + '</div>')
        + '<div style="margin-top:18px;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center"><span style="display:inline-flex;align-items:center;gap:8px;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text-muted,#A8C8B0)">' + icon('sonido') + 'Sonido de nuevo pedido</span>'
        + '<select onchange="setNotifSound(this.value)" style="background:var(--sw-bg,#1E3932);color:var(--sw-text,#FFFFFF);border:1px solid var(--sw-border,#3A6B58);border-radius:6px;padding:6px 8px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px">'
        + ['campana', 'timbre', 'grave'].map(function (p) { return '<option value="' + p + '" ' + (notifSoundPreset === p ? 'selected' : '') + '>' + p + '</option>'; }).join('')
        + '</select></div>'
        // Antes #222 fijo — pensado para fundirse casi invisible con el fondo oscuro original,
        // pero en modo claro se volvía el texto de MAYOR contraste de toda la pantalla (un
        // footnote menor terminaba dominando visualmente) — hallazgo de auditoría visual,
        // MEDIO. Con la variable de tema se mantiene sutil en ambos modos.
        + '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted3,#3A4A44);text-align:center;margin-top:6px">Auto-actualiza cada 25 seg · Sonido al recibir pedido</div>'
        + '</div>'
        + bulkBar()
        + '</div>';
}
// MODO FOCO — un solo pedido a pantalla completa, con el botón de acción principal
// anclado con position:fixed al fondo real del viewport (la "zona del pulgar" que el
// botón agrandado de la tarjeta normal de admin_home no podía lograr — ver comentario en
// esa tarjeta: con varias tarjetas en la cola, un botón fijo de viewport no tiene un solo
// pedido al que apuntar; acá sí, porque solo se muestra uno).
function enterFocusMode() { focusIdx = 0; sndScreen = 'admin_focus'; render(); }
function exitFocusMode() { sndScreen = 'admin_home'; render(); }
function focusStep(delta) {
    var ao = sortedActiveOrders();
    if (!ao.length)
        return;
    focusIdx = ((focusIdx + delta) % ao.length + ao.length) % ao.length;
    render();
}
function sAdminFocus() {
    var ao = sortedActiveOrders();
    var barBg = 'var(--sw-bg,#1E3932)';
    var topBar = '<div style="padding:10px 16px;border-bottom:1px solid var(--sw-border,#3A6B58);display:flex;justify-content:space-between;align-items:center">'
        + '<button onclick="exitFocusMode()" style="all:unset;cursor:pointer;font-family:\'EB Garamond\',serif;font-size:15px;color:' + GOLD + ';min-height:44px;display:inline-flex;align-items:center;padding-right:12px">← Salir</button>'
        + '<span style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">Modo<span class="cut-sep" style="color:' + GOLD + '"> // </span>cocina</span>'
        + '</div>';
    if (!ao.length) {
        return '<div style="min-height:100vh;display:flex;flex-direction:column;background:' + barBg + '">' + topBar
            + '<div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:40px 20px" class="fi">' + icon('check', 32, 'var(--sw-ok,#25D366)') + '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:12px">Sin pedidos activos — todo en orden //</div></div></div>';
    }
    if (focusIdx >= ao.length)
        focusIdx = 0;
    var o = ao[focusIdx];
    var s = STATUSES[o.status] || STATUSES['RECIBIDO'];
    var manualPending = (o.payment_method === 'yape' || o.payment_method === 'plin') && o.payment_status !== 'paid';
    var manualLabel = 'Yape/Plin';
    var mins = minutesAgo(o.created_at);
    var minsDue = minutesAgo(orderDueTime(o));
    var isScheduledAhead = o.delivery_time && new Date(o.delivery_time).getTime() > Date.now();
    var isStale = (o.status === 'RECIBIDO' || manualPending) && !isScheduledAhead && minsDue !== null && minsDue >= 10;
    // Flechas de 56px reales: se tocan de pie, con la mano ocupada o con guante, sin apuntar.
    // Antes eran 20px de glifo con 4px de padding — un blanco de ~28px, muy por debajo del
    // mínimo de 44px, en la única pantalla que se usa con las manos sucias.
    var navBtn = function (delta, glyph, label) {
        return '<button onclick="focusStep(' + delta + ')" aria-label="' + label + '" style="all:unset;cursor:pointer;font-family:\'EB Garamond\',serif;font-size:30px;line-height:1;color:' + (ao.length > 1 ? GOLD : 'var(--sw-text-muted3,#3A4A44)') + ';width:56px;height:56px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px">' + glyph + '</button>';
    };
    var nav = '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 14px;border-bottom:1px solid var(--sw-border,#3A6B58)">'
        + navBtn(-1, '‹', 'Pedido anterior')
        + '<span style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:14px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em">Pedido ' + (focusIdx + 1) + ' de ' + ao.length + '</span>'
        + navBtn(1, '›', 'Pedido siguiente')
        + '</div>';
    // ORDEN DE LECTURA EN COCINA: primero QUÉ SE ARMA, después a quién se le manda.
    // Antes el cuerpo abría con nombre + dirección + pin + referencia + línea de ref, y la
    // receta —lo único que se necesita mientras se arma— quedaba debajo del pliegue, en
    // 11px. Dirección, pin y teléfono importan al DESPACHAR, no al armar; bajan.
    var body = '<div style="flex:1;padding:20px 18px 180px;overflow-y:auto" class="fi">'
        + stBadge(o.status)
        + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:26px;font-weight:640;color:var(--sw-text,#FFFFFF);margin-top:12px">' + esc(o.customer_name) + '</div>'
        + '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:' + (isStale ? STATUSES.RECIBIDO.c : 'var(--sw-text-muted,#A8C8B0)') + ';margin-top:6px;margin-bottom:16px;display:flex;align-items:center;gap:6px">' + (isStale ? '<span class="pulse" style="width:8px;height:8px;border-radius:50%;background:' + STATUSES.RECIBIDO.c + ';display:inline-block;flex-shrink:0"></span>' : '') + '<span>' + esc(o.ref) + ' · ' + SOLES + pz(o.total) + (mins !== null ? ' · hace ' + mins + ' min' : '') + '</span></div>'
        // La receta, en escala de cocina, arriba de todo lo demás.
        + orderRecipeHTML(o.items, true)
        + (isScheduledAhead ? '<div style="font-family:\'EB Garamond\',serif;font-size:15px;color:' + GOLD + ';margin-bottom:14px;display:flex;align-items:center;gap:8px">' + icon('horario', 16, GOLD) + '<span>Programado para ' + esc(new Date(o.delivery_time).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })) + '</span></div>' : '')
        + (manualPending ? '<div style="font-family:\'EB Garamond\',serif;font-size:15px;color:var(--sw-warn,#ffa500);margin-bottom:14px;display:flex;align-items:center;gap:8px">' + icon('warning', 16, 'var(--sw-warn,#ffa500)') + '<span>Pago ' + manualLabel + ' sin confirmar — revisa tu app antes de continuar</span></div>' : '')
        + (o.redeemed_reward ? '<div style="font-family:\'EB Garamond\',serif;font-size:15px;color:var(--sw-ok,#25D366);margin-bottom:14px;display:flex;align-items:center;gap:8px">' + icon('gift', 16, 'var(--sw-ok,#25D366)') + '<span>' + esc(o.redeemed_reward) + '</span></div>' : '')
        + '<div style="height:1px;background:var(--sw-border,#3A6B58);margin:18px 0"></div>'
        + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:' + GOLD + ';letter-spacing:.18em;margin-bottom:10px">Para entregar //</div>'
        + '<div style="font-family:\'EB Garamond\',serif;font-size:17px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">' + esc(o.customer_address) + '</div>'
        // Pin exacto que el cliente confirmó en el mapa al pedir. En Trujillo la dirección en
        // texto no siempre ubica (numeración irregular, referencias en vez de número), así
        // que abrir el punto directo en Maps es la diferencia entre entregar y dar vueltas.
        // Solo aparece si el pedido trae coordenadas — los pedidos viejos no las tienen.
        + (typeof o.lat === 'number' && typeof o.lon === 'number'
            ? '<a href="https://maps.google.com/?q=' + o.lat + ',' + o.lon + '" target="_blank" rel="noopener" style="font-family:\'EB Garamond\',serif;font-size:15px;color:' + GOLD + ';margin-top:10px;display:inline-flex;align-items:center;gap:8px;text-decoration:none;min-height:44px;align-items:center">' + icon('moto', 16, GOLD) + '<span>Abrir pin exacto en Maps</span></a>'
            : '')
        // La referencia que escribe el cliente ("portón azul", "3er piso") viajaba como
        // o.notes y solo se veía en el TICKET IMPRESO, etiquetada "NOTA:" — o sea en el papel
        // de cocina, que es justo donde no sirve. Quien despacha la necesita en pantalla.
        // #30 — Una nota que dice "soy alérgico" no puede pintarse igual que "portón azul".
        // El bloque rojo no es decoración: esta tarjeta se lee de reojo con las manos ocupadas,
        // y ahí lo único que funciona es que el aviso no se parezca a lo de al lado.
        + (o.notes ? (noteNeedsAttention(o.notes)
            ? '<div style="background:rgba(255,85,85,.12);border:1px solid rgba(255,85,85,.5);border-radius:8px;padding:12px 14px;margin-top:10px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-danger,#ff8888);letter-spacing:.08em">⚠ ALERGIA O RESTRICCIÓN</div><div style="font-family:\'EB Garamond\',serif;font-size:17px;color:var(--sw-text,#FFFFFF);margin-top:4px;line-height:1.4">' + esc(o.notes) + '</div></div>'
            : '<div style="font-family:\'EB Garamond\',serif;font-size:16px;color:' + GOLD + ';margin-top:8px">Referencia: ' + esc(o.notes) + '</div>') : '')
        + (o.status === 'EN CAMINO' && o.eta_minutes ? '<div onclick="event.stopPropagation();editEta(\'' + o.id + '\',' + o.eta_minutes + ')" style="font-family:\'EB Garamond\',serif;font-size:15px;color:#3A86FF;margin-top:10px;display:flex;align-items:center;gap:8px;cursor:pointer;min-height:44px">' + icon('moto', 16, '#3A86FF') + '<span>ETA ~' + o.eta_minutes + ' min · editar</span></div>' : '')
        + (o.payment_method === 'cod' && o.payment_status !== 'paid' ? '<div style="font-family:\'EB Garamond\',serif;font-size:16px;color:var(--sw-warn,#ffa500);margin-top:12px;display:flex;align-items:center;gap:8px">' + icon('cash', 16, 'var(--sw-warn,#ffa500)') + '<span>Cobrar ' + SOLES + pz(o.total) + ' al entregar</span></div>' : '')
        + (o.payment_status === 'paid' && PAYMENT_METHOD_BADGE[o.payment_method] ? '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:14px;color:var(--sw-text-muted2,#8BAF9A);margin-top:12px">' + PAYMENT_METHOD_BADGE[o.payment_method] + '</div>' : '')
        + '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:var(--sw-text-muted,#A8C8B0);margin-top:12px">' + esc(o.date) + ' · ' + esc(o.summary) + '</div>'
        + '<div style="display:flex;gap:10px;margin-top:22px">'
        + '<button onclick="printTicket(\'' + o.id + '\')" style="all:unset;cursor:pointer;flex:1;text-align:center;background:rgba(139,175,154,.12);border:1px solid rgba(139,175,154,.4);color:var(--sw-text-muted,#A8C8B0);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;letter-spacing:.04em;padding:19px 4px;border-radius:8px">' + iconTxt('printer', 'Ticket', '#A8C8B0') + '</button>'
        + ((o.contact_phone || o.customer_phone) ? '<button onclick="waAdmin(\'' + o.id + '\')" style="all:unset;cursor:pointer;flex:1;text-align:center;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:' + GOLD + ';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;letter-spacing:.04em;padding:19px 4px;border-radius:8px">' + iconTxt('chat', 'WhatsApp', GOLD) + '</button>' : '')
        // #19 — Solo cuando el pedido ya salió: antes de eso no hay token y no habría a quién
        // mandarle el link.
        + (o.status === 'EN CAMINO' && o.delivery_token ? '<button onclick="waDeliveryLink(\'' + o.id + '\')" style="all:unset;cursor:pointer;flex:1;text-align:center;background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.45);color:var(--sw-whatsapp,#25D366);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;letter-spacing:.04em;padding:19px 4px;border-radius:8px">' + iconTxt('chat', 'Link entrega', 'var(--sw-whatsapp,#25D366)') + '</button>' : '')
        + '</div>'
        + '<button onclick="cancelOrder(\'' + o.id + '\')" style="all:unset;cursor:pointer;display:block;width:100%;background:transparent;border:1px solid rgba(255,85,85,.4);color:var(--sw-danger,#ff8888);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;letter-spacing:.06em;padding:15px 0;border-radius:8px;text-align:center;margin-top:12px">' + iconTxt('close', 'Cancelar pedido' + (manualPending ? ' (nunca pagó)' : ''), 'var(--sw-danger,#ff8888)') + '</button>'
        + '</div>';
    // El botón real anclado a la zona del pulgar: position:fixed sobre todo el viewport,
    // no relativo a la tarjeta. Con env(safe-area-inset-bottom) para no quedar tapado por
    // la barra de gestos de iOS/Android en el celular real del dueño.
    var fixedBar = '<div style="position:fixed;left:0;right:0;bottom:0;padding:14px 20px calc(14px + env(safe-area-inset-bottom));background:' + barBg + ';border-top:1px solid var(--sw-border,#3A6B58);box-shadow:0 -6px 20px rgba(0,0,0,.25)">'
        + (manualPending
            ? '<button onclick="confirmAndAdvance(\'' + o.id + '\')" style="all:unset;cursor:pointer;display:block;width:100%;background:' + GOLD + ';color:#000;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:17px;font-weight:700;letter-spacing:.04em;padding:20px 0;border-radius:10px;text-align:center">' + iconTxt('check', 'Confirmar pago y preparar', '#000') + '</button>'
                + '<button onclick="confirmOrderPayment(\'' + o.id + '\')" style="all:unset;cursor:pointer;display:block;width:100%;text-align:center;color:var(--sw-text-muted2,#8BAF9A);font-family:\'EB Garamond\',serif;font-size:11px;padding:8px 0 0">solo confirmar el pago, sin avanzar todavía</button>'
            : (s.next ? '<button onclick="updateStatus(\'' + o.id + '\',\'' + s.next + '\')" style="all:unset;cursor:pointer;display:block;width:100%;background:' + STATUSES[s.next].c + ';color:#000;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:17px;font-weight:700;letter-spacing:.04em;padding:20px 0;border-radius:10px;text-align:center">' + (STATUSES[s.next].icon && ICONS[STATUSES[s.next].icon] ? icon(STATUSES[s.next].icon, 16, '#000') + ' ' : '') + 'Marcar como ' + STATUSES[s.next].label.toLowerCase() + ' →</button>' : '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:11px;color:var(--sw-ok,#25D366);text-align:center;padding:10px">' + iconTxt('check', 'Completado', 'var(--sw-ok,#25D366)') + '</div>'))
        + '</div>';
    return '<div style="min-height:100vh;display:flex;flex-direction:column;background:' + barBg + '">' + topBar + nav + body + fixedBar + '</div>';
}
// ADMIN DASHBOARD — vista de negocio (ventas, productos, clientes, puntos)
async function loadDashboard() {
    sndScreen = 'admin_dashboard';
    busy = true;
    busyMsg = 'Calculando métricas...';
    render();
    try {
        var results = await Promise.all([api('dashboard-stats', { token: token }), api('admin-at-risk-customers', { token: token })]);
        dashStats = results[0];
        atRiskCustomers = results[1].customers;
    }
    catch (e) {
        dashStats = null;
        atRiskCustomers = null;
    }
    busy = false;
    render();
}
function waRiskContact(i) {
    // Recibe solo el índice (numérico, seguro de interpolar en onclick) y busca el cliente
    // en memoria — nunca se embebe name/phone (texto libre del cliente) directo en el
    // atributo onclick, que un XSS podría explotar para robar el token de admin de localStorage
    // (hallazgo de auditoría 2026-08-07).
    var c = (atRiskCustomers || [])[i];
    if (!c)
        return;
    var msg = 'Hola ' + (c.name || '') + '! Somos de SND//WCH — te extrañamos por acá, ¿todo bien? Cuando quieras tu Signature de siempre, ahí estamos.';
    window.open('https://wa.me/51' + String(c.phone).replace(/\D/g, '').replace(/^51/, '') + '?text=' + encodeURIComponent(msg), '_blank');
}
function DTILE(label, big, sub, muted) {
    // muted=true reduce el peso visual para data de solo-referencia (ej. puntos en
    // circulación) que no compite por atención con las métricas que sí piden una acción
    // (hallazgo de auditoría: todo DTILE pesaba visualmente igual).
    var bg = muted ? 'var(--sw-card-muted,#24382F)' : 'var(--sw-card,#2D5246)', bd = muted ? 'var(--sw-border-muted,#2A473B)' : 'var(--sw-border,#3A6B58)', lc = muted ? 'var(--sw-text-muted3,#7FA08D)' : GOLD, bc = muted ? 'var(--sw-text-muted4,#C8D6CE)' : 'var(--sw-text,#FFFFFF)', bs = muted ? '20px' : '26px';
    return '<div style="background:' + bg + ';border:1px solid ' + bd + ';border-radius:12px;padding:14px 16px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:' + lc + ';letter-spacing:.15em;margin-bottom:6px">' + label + '</div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:' + bs + ';font-weight:640;color:' + bc + ';line-height:1">' + big + '</div>' + (sub ? '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">' + sub + '</div>' : '') + '</div>';
}
// Tile "hero" — usado una sola vez por pantalla para la métrica que de verdad manda
// (ingresos de HOY): el dueño abre el panel para saber "¿cómo voy hoy?", no para
// comparar HOY contra TOTAL histórico con el mismo peso visual.
function DHERO(label, big, sub) {
    return '<div style="background:linear-gradient(135deg,rgba(203,162,88,.16),rgba(203,162,88,.05));border:1px solid rgba(203,162,88,.5);border-radius:14px;padding:20px 18px;box-shadow:0 4px 22px rgba(203,162,88,.14)"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">' + label + '</div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:42px;font-weight:640;color:var(--sw-text,#FFFFFF);line-height:1">' + big + '</div>' + (sub ? '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:' + GOLD + ';margin-top:6px">' + sub + '</div>' : '') + '</div>';
}
function DBAR(label, value, max, color) {
    var pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">' + label + '</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:' + (color || GOLD) + '">' + value + '</span></div><div style="background:var(--sw-bg,#1E3932);border-radius:4px;height:8px;overflow:hidden"><div style="background:' + (color || GOLD) + ';height:100%;width:' + pct + '%;border-radius:4px"></div></div></div>';
}
function sAdminDashboard() {
    var h = H('PANEL DE NEGOCIO', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (!dashStats) {
        h += '<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-danger,#ff8888);letter-spacing:.2em">No se pudo cargar //</div></div>' + BTN('Reintentar //', 'loadDashboard()');
        return h + '</div>';
    }
    var d = dashStats;
    // Alertas
    var alerts = [];
    if (d.pendingPayment > 0)
        alerts.push(d.pendingPayment + ' pedido(s) sin pago confirmado (posible prueba o error de checkout)');
    if (d.outOfStock && d.outOfStock.length)
        alerts.push(d.outOfStock.length + ' producto(s) sin stock: ' + d.outOfStock.map(function (o) { return o.product_name || o.product_code; }).join(', '));
    if (d.lowStock && d.lowStock.length)
        alerts.push('Stock bajo: ' + d.lowStock.map(function (o) { return (o.product_name || o.product_code) + ' (' + o.stock_qty + ')'; }).join(', '));
    if (d.trendTruncated)
        alerts.push('Hay tantos pedidos en el período reciente que la tendencia y los productos top de abajo no cubren todo el rango esperado.');
    if (alerts.length) {
        h += '<div style="background:rgba(255,165,0,.1);border:1px solid rgba(255,165,0,.3);border-radius:10px;padding:14px 16px;margin-bottom:18px">'
            + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-warn,#ffa500);letter-spacing:.15em;margin-bottom:6px">Alertas //</div>'
            + alerts.map(function (a) { return '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);margin-bottom:4px;display:flex;align-items:center;gap:5px">' + icon('warning', 12, 'var(--sw-warn,#ffa500)') + '<span>' + esc(a) + '</span></div>'; }).join('')
            + '</div>';
    }
    // Ventas
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Ventas //</div>';
    // Antes había que comparar los números a mano contra la semana/mes pasado — el dato
    // del período anterior ya se calcula en el servidor, esto solo arma el "+X% vs antes".
    function deltaTxt(pct) {
        if (pct == null)
            return '';
        var arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '●';
        var color = pct > 0 ? 'var(--sw-ok,#25D366)' : pct < 0 ? 'var(--sw-danger,#ff8888)' : '#A8C8B0';
        return ' · <span style="color:' + color + '">' + arrow + ' ' + (pct > 0 ? '+' : '') + pct + '% vs. antes</span>';
    }
    h += '<div style="margin-bottom:10px">' + DHERO('Hoy', SOLES + pz(d.revenue.today.revenue), d.revenue.today.count + ' pedidos · tkt ' + SOLES + pz(d.revenue.today.avgTicket)) + '</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px">'
        + DTILE('Semana', SOLES + pz(d.revenue.week.revenue), d.revenue.week.count + ' pedidos · tkt ' + SOLES + pz(d.revenue.week.avgTicket) + deltaTxt(d.deltas && d.deltas.weekRevenuePct), true)
        + DTILE('Mes', SOLES + pz(d.revenue.month.revenue), d.revenue.month.count + ' pedidos · tkt ' + SOLES + pz(d.revenue.month.avgTicket) + deltaTxt(d.deltas && d.deltas.monthRevenuePct), true)
        + DTILE('Total', SOLES + pz(d.revenue.allTime.revenue), d.revenue.allTime.count + ' pedidos · tkt ' + SOLES + pz(d.revenue.allTime.avgTicket), true)
        + '</div>';
    // Ganancia estimada = ingresos × (1 - costo de insumos ~40-50%, ver COGS_LOW/HIGH en
    // admin.ts) — siempre como rango, nunca como cifra exacta, porque no hay costo real
    // por receta en el sistema (solo precio de venta).
    if (d.estimatedProfit) {
        h += '<div style="background:rgba(37,211,102,.08);border:1px solid rgba(37,211,102,.25);border-radius:10px;padding:14px 16px;margin-bottom:18px">'
            + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-ok,#25D366);letter-spacing:.15em;margin-bottom:8px">Ganancia estimada (rango, no exacta) //</div>'
            + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
            + [['Hoy', d.estimatedProfit.today], ['Semana', d.estimatedProfit.week], ['Mes', d.estimatedProfit.month], ['Total', d.estimatedProfit.allTime]].map(function (x) {
                return '<div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em">' + x[0] + '</div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:16px;font-weight:640;color:var(--sw-ok,#25D366)">' + SOLES + pz(x[1].low) + '–' + SOLES + pz(x[1].high) + '</div></div>';
            }).join('')
            + '</div></div>';
    }
    if (d.codPending && d.codPending.count > 0) {
        h += '<div style="background:rgba(255,165,0,.08);border:1px solid rgba(255,165,0,.25);border-radius:10px;padding:14px 16px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-warn,#ffa500);letter-spacing:.15em">Por cobrar · contra entrega //</div><div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">' + d.codPending.count + ' pedido(s) sin cobrar todavía</div></div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:var(--sw-warn,#ffa500)">' + SOLES + pz(d.codPending.total) + '</div></div>';
    }
    // Tendencia 14 días
    if (d.trend && d.trend.length) {
        var trMax = Math.max.apply(null, d.trend.map(function (t) { return t.revenue; }).concat([1]));
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Tendencia · 14 días //</div>';
        h += '<div style="display:flex;gap:3px;align-items:flex-end;height:70px;margin-bottom:6px">' + d.trend.map(function (t) { var pct = Math.round((t.revenue / trMax) * 100); return '<div style="flex:1;height:100%;display:flex;align-items:flex-end" title="' + t.date + ': S/' + t.revenue + '"><div style="width:100%;background:' + (t.revenue > 0 ? GOLD : 'var(--sw-card2,#1A3028)') + ';height:' + Math.max(pct, t.revenue > 0 ? 4 : 2) + '%;border-radius:2px 2px 0 0"></div></div>'; }).join('') + '</div>';
        h += '<div style="display:flex;gap:3px;margin-bottom:18px">' + d.trend.map(function (t, i) { return '<div style="flex:1;text-align:center;font-family:EB Garamond,serif;font-style:italic;font-size:6px;color:var(--sw-text-muted,#A8C8B0)">' + (i % 2 === 0 ? t.date : '') + '</div>'; }).join('') + '</div>';
    }
    // Pedidos por estado
    var stEntries = Object.keys(d.ordersByStatus || {});
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Pedidos por estado //</div>';
    if (!stEntries.length) {
        h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px">Sin pedidos todavía.</div>';
    }
    else {
        // ordersByStatus cuenta TODA la tabla histórica (ver dashboard_aggregates): ENTREGADO
        // crece sin límite mientras los estados en vivo — lo que de verdad hay que operar
        // AHORA — casi siempre son números chicos. Compartir una sola escala los volvía
        // invisibles junto a ENTREGADO (hallazgo de auditoría) — cada grupo ahora escala
        // contra su propio máximo.
        var LIVE_STATUSES = ['RECIBIDO', 'PREPARANDO', 'EN CAMINO'];
        var liveEntries = LIVE_STATUSES.filter(function (k) { return k in d.ordersByStatus; });
        var doneEntries = stEntries.filter(function (k) { return LIVE_STATUSES.indexOf(k) === -1; });
        if (liveEntries.length) {
            var liveMax = Math.max.apply(null, liveEntries.map(function (k) { return d.ordersByStatus[k]; }).concat([1]));
            h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em;margin-bottom:6px">En curso ahora //</div>';
            h += liveEntries.map(function (k) { return DBAR((STATUSES[k] || {}).label || k, d.ordersByStatus[k], liveMax, (STATUSES[k] || {}).c); }).join('');
        }
        if (doneEntries.length) {
            var doneMax = Math.max.apply(null, doneEntries.map(function (k) { return d.ordersByStatus[k]; }).concat([1]));
            h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em;margin:10px 0 6px">Histórico //</div>';
            h += doneEntries.map(function (k) { return DBAR((STATUSES[k] || {}).label || k, d.ordersByStatus[k], doneMax, (STATUSES[k] || {}).c); }).join('');
        }
    }
    if (d.avgEtaMinutes != null) {
        h += '<div style="margin-top:10px">' + DTILE('Tiempo estimado promedio ofrecido', d.avgEtaMinutes + ' min', 'Cuando se marca "EN CAMINO"') + '</div>';
    }
    h += '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>';
    // Productos top
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Productos más vendidos //</div>';
    if (d.topProducts && d.topProducts.length) {
        var pMax = Math.max.apply(null, d.topProducts.map(function (p) { return p.count; }).concat([1]));
        h += d.topProducts.map(function (p) {
            var pct = Math.round((p.count / pMax) * 100);
            return '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + esc(p.name) + '</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:' + GOLD + '">' + p.count + ' vendidos · ' + SOLES + pz(p.revenue) + '</span></div><div style="background:var(--sw-bg,#1E3932);border-radius:4px;height:8px;overflow:hidden"><div style="background:' + GOLD + ';height:100%;width:' + pct + '%;border-radius:4px"></div></div></div>';
        }).join('');
    }
    else {
        h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px">Aún no hay ventas pagadas para rankear productos.</div>';
    }
    h += '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>';
    // Clientes
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Clientes //</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">'
        + DTILE('Total', d.customers.total)
        + DTILE('Recurrentes', d.customers.returning, '>1 pedido')
        + DTILE('Nuevos · semana', d.customers.newThisWeek)
        + DTILE('Nuevos · mes', d.customers.newThisMonth)
        // ROI del programa de referidos — antes no había ninguna forma de ver si el bono
        // de 50 puntos por referido realmente atrae clientes/ingresos.
        + (d.referrals ? DTILE('Clientes referidos', d.referrals.referredCustomers, SOLES + pz(d.referrals.revenue) + ' en ventas') : '')
        + '</div>';
    if (d.peakHours && d.peakHours.length) {
        var peakTop = d.peakHours.slice().sort(function (a, b) { return b.count - a.count; })[0];
        var peakDayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        var peakDayTop = d.peakDays && d.peakDays.length ? d.peakDays.slice().sort(function (a, b) { return b.count - a.count; })[0] : null;
        h += '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px;display:flex;align-items:center;gap:5px"><span style="display:inline-flex;align-items:center;gap:5px">' + icon('reportes', 12, '#A8C8B0') + '<span>Hora pico (últimos 90 días): </span></span><b style="color:var(--sw-text,#FFFFFF)">' + peakTop.hour + ':00-' + (peakTop.hour + 1) + ':00</b>' + (peakDayTop ? ' · Día pico: <b style="color:var(--sw-text,#FFFFFF)">' + peakDayNames[peakDayTop.dow] + '</b>' : '') + '</div>';
    }
    // Confirmados vs. abandonados por Yape/Plin — antes no había forma de ver de un
    // vistazo qué tan seguido un pedido con este método SÍ termina transfiriéndose vs.
    // cuántos se cancelan por no confirmarse a tiempo (mismo cron de 3h que expira un
    // pago manual sin confirmar).
    if (d.yapePlin && d.yapePlin.total > 0) {
        var ypRate = Math.round((d.yapePlin.confirmed / d.yapePlin.total) * 100);
        h += '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:14px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Yape/Plin — confirmados vs. abandonados //</div><div style="display:flex;gap:8px"><div style="flex:1;text-align:center;background:var(--sw-card2,#1A3028);border-radius:8px;padding:8px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:var(--sw-ok,#25D366)">' + d.yapePlin.confirmed + '</div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.05em">Confirmados</div></div><div style="flex:1;text-align:center;background:var(--sw-card2,#1A3028);border-radius:8px;padding:8px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:var(--sw-danger-strong,#ff5555)">' + d.yapePlin.abandoned + '</div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.05em">Abandonados</div></div><div style="flex:1;text-align:center;background:var(--sw-card2,#1A3028);border-radius:8px;padding:8px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:22px;font-weight:640;color:' + GOLD + '">' + ypRate + '%</div><div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.05em">Tasa confirm.</div></div></div></div>';
    }
    // Origen de campaña (?src=... en el link del anuncio) — sin esto no hay forma de saber
    // si una campaña paga se está pagando sola. "convertidos" cuenta solo a quien ya hizo al
    // menos un pedido, no solo se registró.
    if (d.bySource && d.bySource.length) {
        h += '<div style="margin-bottom:16px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Origen de clientes //</div>'
            // recentRevenue/recentAvgTicket cubren solo la ventana reciente del dashboard
            // (~14-31 días, misma que topProducts/trend), no ingresos históricos totales por
            // fuente — por eso solo se muestran cuando hay algo que mostrar (>0), en vez de
            // sugerir un $0 que en realidad es "sin pedidos EN ESTA VENTANA".
            + d.bySource.map(function (s) { return '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border-radius:8px;padding:8px 12px;margin-bottom:6px"><span style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">' + esc(s.source) + '</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);text-align:right">' + s.signups + ' registrados · <span style="color:' + GOLD + '">' + s.converted + ' pidieron</span>' + (s.recentRevenue > 0 ? '<br>S/' + s.recentRevenue.toFixed(0) + ' · ticket S/' + s.recentAvgTicket.toFixed(2) + ' (últimos días)' : '') + '</span></div>'; }).join('')
            + '</div>';
    }
    var tiers = d.customers.tiers || {};
    // VIP se retiró como tier — ya no hay un multiplicador de puntos distinto por nivel,
    // así que ya no tiene sentido mostrarlo como un bucket aparte en este gráfico.
    var tMax = Math.max(tiers.FREQUENT || 0, tiers.REGULAR || 0, tiers.MEMBER || 0, 1);
    h += DBAR('Frequent', tiers.FREQUENT || 0, tMax, GOLD) + DBAR('Regular', tiers.REGULAR || 0, tMax, '#7FA894') + DBAR('Member', tiers.MEMBER || 0, tMax, '#4A6B5A');
    h += '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>';
    // Clientes en riesgo de fuga — priorizados por días sin pedir Y rango (perder a alguien
    // de MESA FUNDADORA pesa más que perder a alguien NUEVO). No reemplaza los recordatorios
    // automáticos (remind-second-order/remind-high-rank-winback), es para que el dueño
    // decida a quién más vale la pena escribirle personalmente.
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Clientes en riesgo //</div>';
    if (atRiskCustomers && atRiskCustomers.length) {
        h += atRiskCustomers.slice(0, 10).map(function (c, i) {
            var daysTxt = c.daysSinceLastOrder == null ? 'nunca pagó un pedido' : 'hace ' + c.daysSinceLastOrder + ' días';
            return '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:10px 14px;margin-bottom:8px"><div><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + esc(c.name || c.phone) + '</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">' + esc(c.rank) + ' · último pedido ' + daysTxt + '</div></div><button onclick="waRiskContact(' + i + ')" aria-label="Contactar por WhatsApp" style="all:unset;cursor:pointer;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:' + GOLD + ';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:11px;font-weight:600;padding:8px 12px;border-radius:8px;flex-shrink:0;display:inline-flex">' + icon('chat', 14, GOLD) + '</button></div>';
        }).join('');
    }
    else {
        h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px">Sin clientes en riesgo por ahora.</div>';
    }
    h += '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>';
    // Puntos
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Puntos //</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:8px">'
        + DTILE('Emitidos', d.points.issued)
        + DTILE('Canjeados', d.points.redeemed)
        + DTILE('En circulación', d.points.outstanding, undefined, true)
        + '</div>';
    h += '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>';
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Exportar //</div>';
    h += '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">'
        + '<button onclick="exportCsv(\'export-orders\',\'pedidos\')" style="all:unset;cursor:pointer;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);color:' + GOLD + ';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;padding:12px;border-radius:8px;text-align:center">Exportar pedidos (CSV) //</button>'
        + '<button onclick="exportCsv(\'export-customers\',\'clientes\')" style="all:unset;cursor:pointer;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);color:' + GOLD + ';font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;padding:12px;border-radius:8px;text-align:center">Exportar clientes (CSV) //</button>'
        + '</div>';
    h += BTN('Actualizar //', 'loadDashboard()', true);
    h += '</div>';
    return h;
}
function toCsv(rows) {
    if (!rows || !rows.length)
        return '';
    var cols = Object.keys(rows[0]);
    function csvEsc(v) { if (v == null)
        return ''; var s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    var lines = [cols.join(',')];
    rows.forEach(function (r) { lines.push(cols.map(function (c) { return csvEsc(r[c]); }).join(',')); });
    return lines.join('\n');
}
async function exportCsv(action, filename) {
    busy = true;
    busyMsg = 'Generando CSV...';
    render();
    try {
        var r = await api(action, { token: token });
        var rows = r.orders || r.customers || r.waitlist || [];
        var csv = toCsv(rows);
        if (!csv) {
            busy = false;
            render();
            showToast('No hay datos para exportar.', 'info');
            return;
        }
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'sndwch-' + filename + '-' + today().replace(/\//g, '-') + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        if (r.truncated)
            showToast('El negocio ya tiene más de ' + rows.length + ' registros — este CSV solo incluye los más recientes, no todo el historial.', 'info');
    }
    catch (e) {
        showToast('Error al exportar: ' + e.message);
    }
    busy = false;
    render();
}
// ADMIN GEN
// Antes armaba su propio header a mano (flecha + título grande, sin wordmark) en vez de
// usar H() como las otras 14 pantallas de detalle — se sentía "de otra app" sin ninguna
// razón funcional (hallazgo de auditoría visual, MEDIO). H() también trae el toggle
// claro/oscuro y sndScreen='admin_home' vía loadAdmin() (no solo render()), que esta pantalla no
// tenía.
function sAdminGen() {
    return '<div style="min-height:100vh;display:flex;flex-direction:column;background:var(--sw-bg,#1E3932)">' + H('Puntos manuales', 'loadAdmin()') + '<div style="flex:1;padding:24px 20px" class="fi"><p style="font-family:\'EB Garamond\',serif;font-size:14px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:20px;line-height:1.6">Otorga puntos confirmados directamente a un cliente.</p><div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">' + INP('ag-ph', 'Teléfono del cliente // 9XXXXXXXX', 'tel', agPhone, 'phone') + INP('ag-pts', 'Puntos a otorgar // Ej: 25', 'number', agPts) + BTN('Otorgar puntos //', 'doManualPts()') + '</div><div id="ag-msg" style="font-family:\'EB Garamond\',serif;font-size:13px;color:' + GOLD + ';min-height:20px">' + agMsg + '</div>'
        + '<div style="height:1px;background:var(--sw-card,#2D5246);margin:28px 0 24px"></div>'
        + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:640;color:var(--sw-text,#FFFFFF);margin-bottom:4px;text-wrap:balance">Crédito<span class="cut-sep" style="color:' + GOLD + '"> // </span>ajuste manual</div>'
        + '<p style="font-family:\'EB Garamond\',serif;font-size:14px;color:var(--sw-text-muted,#A8C8B0);margin:8px 0 20px;line-height:1.6">Corrige el saldo de crédito interno de un cliente (ej. reponer un pedido cancelado que se pagó con crédito). Puede ser negativo para descontar un exceso otorgado por error.</p><div style="display:flex;flex-direction:column;gap:12px">' + INP('ac-ph', 'Teléfono del cliente // 9XXXXXXXX', 'tel', acPhone, 'phone') + INP('ac-delta', 'Monto // positivo suma, negativo descuenta', 'number', acDelta, 'coin') + BTN('Ajustar crédito //', 'doManualCredit()') + '</div><div id="ac-msg" style="font-family:\'EB Garamond\',serif;font-size:13px;color:' + GOLD + ';min-height:20px;margin-top:12px">' + acMsg + '</div></div></div>';
}
async function doManualPts() {
    var ph = gv('ag-ph').trim(), pts = parseInt(gv('ag-pts') || '0');
    agPhone = ph;
    agPts = String(pts);
    if (!ph || pts < 1) {
        agMsg = 'Ingresa teléfono y puntos válidos.';
        render();
        return;
    }
    busy = true;
    busyMsg = 'Otorgando puntos...';
    render();
    try {
        var r = await api('admin-manual-points', { token: token, phone: ph, pts: pts });
        agMsg = '✓ +' + pts + ' puntos a ' + esc(r.name);
        if (cust && cust.phone === ph)
            cust.points = r.newPoints;
    }
    catch (e) {
        agMsg = 'Error: ' + e.message;
    }
    busy = false;
    render();
}
async function doManualCredit() {
    var ph = gv('ac-ph').trim(), delta = parseFloat(gv('ac-delta') || '0');
    acPhone = ph;
    acDelta = String(delta);
    if (!ph || !delta) {
        acMsg = 'Ingresa teléfono y un monto distinto de cero.';
        render();
        return;
    }
    busy = true;
    busyMsg = 'Ajustando crédito...';
    render();
    try {
        var r = await api('admin-manual-credit', { token: token, phone: ph, delta: delta });
        acMsg = '✓ Nuevo saldo de ' + esc(r.name) + ': ' + SOLES_TXT + pz(r.newBalance.toFixed(2));
        if (cust && cust.phone === ph)
            cust.credit_balance = r.newBalance;
    }
    catch (e) {
        acMsg = 'Error: ' + e.message;
    }
    busy = false;
    render();
}
// render() envuelve a renderScreen() para que un error al pintar UNA pantalla no deje la
// app muda. Antes, si cualquier función de pantalla lanzaba, `render()` moría antes de
// tocar el DOM: la pantalla anterior se quedaba intacta y tocar el botón "no hacía nada",
// sin ningún mensaje, ni en la app instalada ni en el navegador. Eso es exactamente lo
// que se reportó el 2026-08-21 con ARMA EL TUYO, y lo que hizo imposible diagnosticarlo
// a distancia: un fallo silencioso no deja rastro que el dueño pueda leerme.
// Ahora el error se pinta en pantalla, con la versión del build y la pantalla que falló.
// INVENTORY
var INV_CATS = [
    { t: 'Panes', arr: BASES },
    { t: 'Proteínas', arr: PROTS },
    { t: 'Toppings', arr: TOPS },
    { t: 'Quesos', arr: CHEESE },
    { t: 'Salsas', arr: SAUCES }
];
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
var invMode = 'fijar';
// Tandas (#5): qué se cocinó cuándo y cuánto aguanta. Va por una acción de ADMIN aparte y
// no dentro de get-catalog porque get-catalog es público, y la fecha de producción de la
// cocina no tiene por qué viajar a cualquiera que abra la app.
var invBatches = {}, invWarnHours = 24, invDefaultDays = 3;
function setInvMode(m) { invMode = m; render(); }
async function loadInventory() {
    sndScreen = 'admin_inventory';
    busy = true;
    busyMsg = 'Cargando inventario...';
    render();
    try {
        var r = await api('get-catalog', {});
        applyInventory(r.inventory);
        // Si la lectura de tandas falla, el inventario se sigue mostrando: perder la fecha de
        // caducidad empeora la pantalla, dejar sin inventario al dueño la inutiliza.
        try {
            var t = await api('admin-inventory-batches', { token: token });
            invBatches = t.batches || {};
            invWarnHours = t.warnHours || 24;
            invDefaultDays = t.defaultDays || 3;
        }
        catch (e2) {
            invBatches = {};
        }
    }
    catch (e) { }
    busy = false;
    render();
}
// Texto de la tanda de un insumo. Devuelve null cuando no hay nada que decir, para que la
// fila no gane una línea vacía.
function batchLine(code) {
    var b = invBatches[code];
    if (!b || !b.cookedAt)
        return null;
    var cocinado = new Date(b.cookedAt).getTime();
    if (!isFinite(cocinado))
        return null;
    var limite = cocinado + (b.shelfLifeDays || invDefaultDays) * 24 * 3600 * 1000;
    var horas = Math.round((limite - Date.now()) / 3600000);
    var f = new Date(cocinado).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
    if (b.estado === 'vencida')
        return { c: 'var(--sw-danger,#ff8888)', t: 'Tanda del ' + f + ' — VENCIDA hace ' + Math.abs(horas) + ' h. No usar.' };
    if (b.estado === 'por-vencer')
        return { c: '#E8B34A', t: 'Tanda del ' + f + ' — vence en ' + horas + ' h.' };
    return { c: '#A8C8B0', t: 'Tanda del ' + f + ' — quedan ' + Math.floor(horas / 24) + ' d.' };
}
async function setShelfLife(code, name) {
    var el = document.getElementById('vida-' + code);
    if (!el)
        return;
    var dias = parseInt(el.value, 10);
    if (!isFinite(dias) || dias < 1) {
        showToast('La vida útil tiene que ser al menos 1 día.');
        return;
    }
    busy = true;
    busyMsg = 'Guardando vida útil...';
    render();
    try {
        await api('admin-inventory-set-shelf-life', { token: token, code: code, days: dias });
        if (invBatches[code])
            invBatches[code].shelfLifeDays = dias;
        showToast('Vida útil de ' + name + ': ' + dias + ' día(s).');
    }
    catch (e) {
        showToast('Error: ' + e.message);
    }
    busy = false;
    render();
}
async function toggleStock(code, name) {
    var cur = invStock[code] !== false;
    var goingTo = !cur;
    // Reactivar ya no pide confirmación — riesgo asimétrico frente a marcar agotado
    // (bloquea ventas si es sin querer, mientras que reactivar solo vuelve a habilitar una
    // opción) — hallazgo de auditoría operativa, BAJO.
    if (!goingTo) {
        var msg = '¿Confirmas marcar "' + name + '" como SIN STOCK? No se podrá elegir en pedidos hasta que lo reactives.';
        if (!(await showConfirm(msg)))
            return;
    }
    busy = true;
    busyMsg = 'Actualizando...';
    render();
    try {
        await api('admin-inventory-toggle', { token: token, code: code, name: name, inStock: goingTo });
        invStock[code] = goingTo;
    }
    catch (e) {
        showToast('Error al actualizar: ' + e.message);
    }
    busy = false;
    render();
}
async function setStock(code, name) {
    var el = document.getElementById('qty-' + code);
    var raw = el ? el.value.trim() : '';
    var qty = raw === '' ? null : parseInt(raw, 10);
    busy = true;
    busyMsg = 'Guardando stock...';
    render();
    try {
        await api('admin-inventory-set-stock', { token: token, code: code, name: name, qty: qty });
        invQty[code] = qty;
        if (qty != null)
            invStock[code] = qty > 0;
    }
    catch (e) {
        showToast('Error al actualizar: ' + e.message);
    }
    busy = false;
    render();
}
function sAdminInventory() {
    var h = H('INVENTARIO', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:6px">Control de stock //</div>';
    h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px;line-height:1.5">Un producto "sin stock" desaparece de las opciones del cliente hasta que lo reactives. Si además le pones una cantidad, se descuenta sola con cada venta y se marca "sin stock" automáticamente al llegar a 0 — deja el campo vacío para volver al control manual.</div>';
    // Caducidad de tanda (#5): explicar de dónde sale la fecha, porque el dueño no la
    // escribe en ningún lado — se registra sola al usar "Sumar tanda".
    h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px;line-height:1.5">Cada vez que registras una tanda se guarda la fecha. Si un insumo pasa los días que aguanta —o le faltan menos de ' + invWarnHours + ' h— te llega un aviso y aparece en Salud del negocio. El valor por defecto son ' + invDefaultDays + ' días (guía de USDA para carne y pollo cocidos en frío); cámbialo por insumo si tu receta aguanta más.</div>';
    h += SEARCHBOX('inv-search', 'Buscar producto', 'inv-row');
    h += '<div style="display:flex;gap:8px;margin:14px 0 10px">'
        + ['fijar', 'tanda'].map(function (m) {
            var sel = invMode === m;
            var l = m === 'fijar' ? 'Fijar cantidad' : 'Sumar tanda';
            return '<div onclick="setInvMode(\'' + m + '\')" style="flex:1;text-align:center;background:' + (sel ? 'var(--sw-card2,#1A3028)' : 'var(--sw-card,#2D5246)') + ';border:1px solid ' + (sel ? GOLD : '#3A6B58') + ';border-radius:8px;padding:10px 8px;cursor:pointer;font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:' + (sel ? '#fff' : '#A8C8B0') + '">' + l + '</div>';
        }).join('')
        + '</div>';
    h += '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px;line-height:1.5">'
        + (invMode === 'tanda'
            ? 'Escribe cuánto PRODUJISTE de cada insumo en esta tanda. Se suma a lo que quedaba — no tienes que calcular el total tú.'
            : 'El número que escribas ES el stock final. Déjalo vacío para volver al control manual, sin rastreo de cantidad.')
        + '</div>';
    h += '<div style="margin-bottom:20px">' + BTN(invMode === 'tanda' ? 'Registrar la tanda //' : 'Guardar todos los cambios de stock //', 'saveAllInventoryChanges()', true) + '</div>';
    INV_CATS.forEach(function (cat) {
        h += '<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:16px;font-weight:640;color:var(--sw-text,#FFFFFF);margin:18px 0 10px;text-wrap:balance">' + cat.t + '<span class="cut-sep" style="color:' + GOLD + '"> //</span></div>';
        h += cat.arr.map(function (item) {
            var name = item.l + (item.s && item.s !== '//' ? ' // ' + item.s : '');
            var av = invStock[item.id] !== false;
            var qty = invQty[item.id];
            var tracked = qty != null;
            var bl = batchLine(item.id);
            return '<div class="inv-row" data-name="' + esc(name.toLowerCase()) + '" style="background:' + (av ? 'var(--sw-card,#2D5246)' : 'var(--sw-card-danger,#1A2420)') + ';border:1px solid ' + (av ? 'var(--sw-border,#3A6B58)' : 'rgba(255,85,85,.3)') + ';border-radius:10px;padding:13px 16px;margin-bottom:8px">'
                + '<div style="display:flex;justify-content:space-between;align-items:center">'
                + '<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:' + (av ? 'var(--sw-text,#FFFFFF)' : 'var(--sw-text-muted,#A8C8B0)') + '">' + name + '</div>'
                + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + (av ? 'var(--sw-ok,#25D366)' : 'var(--sw-danger,#ff8888)') + ';margin-top:2px;letter-spacing:.1em">' + (av ? '● Disponible' : '● Sin stock') + (tracked ? ' · ' + qty + ' unid.' : '') + '</div></div>'
                + '<button onclick="toggleStock(\'' + item.id + '\',\'' + name.replace(/'/g, "\\'") + '\')" style="all:unset;cursor:pointer;background:' + (av ? 'rgba(255,85,85,.12)' : 'rgba(37,211,102,.15)') + ';border:1px solid ' + (av ? 'rgba(255,85,85,.4)' : 'rgba(37,211,102,.4)') + ';color:' + (av ? 'var(--sw-danger,#ff8888)' : 'var(--sw-ok,#25D366)') + ';font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:11px;font-weight:600;letter-spacing:.08em;padding:15px 14px;border-radius:8px;text-align:center;flex-shrink:0">' + (av ? 'Marcar agotado' : 'Reactivar') + '</button>'
                + '</div>'
                + '<div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap">'
                // En modo tanda el campo arranca VACÍO y no precargado con el stock actual: si
                // mostrara el número de ahora, escribir encima se leería como "fijar" y sumaría
                // el doble sin que se note.
                + '<input id="qty-' + item.id + '" type="number" min="0" placeholder="' + (invMode === 'tanda' ? 'Producido en esta tanda' : 'Sin rastreo de cantidad') + '" value="' + (invMode === 'tanda' ? '' : (tracked ? qty : '')) + '" style="flex:1;min-width:120px;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:9px 12px;color:var(--sw-text,#FFFFFF);font-size:16px;font-family:EB Garamond,serif;font-style:italic">'
                + (invMode === 'tanda' ? '' : '<button onclick="setStock(\'' + item.id + '\',\'' + name.replace(/'/g, "\\'") + '\')" style="all:unset;cursor:pointer;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:' + GOLD + ';font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:11px;font-weight:600;padding:15px 14px;border-radius:8px;flex-shrink:0">Guardar stock</button>')
                + '</div>'
                // Caducidad de tanda (#5). La línea solo aparece si hay una tanda registrada: un
                // insumo que se compra ya listo no tiene fecha de cocción, e inventarle una sería
                // exactamente el dato falso que esta alerta existe para evitar.
                + (bl ? '<div style="font-family:EB Garamond,serif;font-size:11px;color:' + bl.c + ';margin-top:8px;line-height:1.4">' + esc(bl.t) + '</div>' : '')
                + (bl ? '<div style="display:flex;gap:8px;margin-top:8px;align-items:center">'
                    + '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);flex-shrink:0">Aguanta</div>'
                    + '<input id="vida-' + item.id + '" type="number" min="1" max="90" value="' + (invBatches[item.id] && invBatches[item.id].shelfLifeDays || invDefaultDays) + '" style="width:64px;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:7px 10px;color:var(--sw-text,#FFFFFF);font-size:16px;font-family:EB Garamond,serif">'
                    + '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);flex-shrink:0">días</div>'
                    + '<button onclick="setShelfLife(\'' + item.id + '\',\'' + name.replace(/'/g, "\\'") + '\')" style="all:unset;cursor:pointer;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:' + GOLD + ';font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:11px;font-weight:600;padding:11px 12px;border-radius:8px;flex-shrink:0">Guardar</button>'
                    + '</div>' : '')
                + '</div>';
        }).join('');
    });
    h += '</div>';
    return h;
}
// Guardado en lote — antes 19+ filas de inventario solo se podían guardar una por una
// (hallazgo de auditoría admin). Lee TODOS los inputs de cantidad antes de mostrar el
// estado "busy" (que reemplaza el DOM y borraría esos mismos inputs si se leyeran
// después), detecta cuáles de verdad cambiaron, y reutiliza admin-inventory-set-stock
// por cada uno — mismo endpoint que ya usaba el guardado fila por fila.
async function saveAllInventoryChanges() {
    if (invMode === 'tanda')
        return registerBatchRestock();
    var jobs = [];
    INV_CATS.forEach(function (cat) {
        cat.arr.forEach(function (item) {
            var el = document.getElementById('qty-' + item.id);
            if (!el)
                return;
            var raw = el.value.trim();
            var newQty = raw === '' ? null : parseInt(raw, 10);
            var curQty = invQty[item.id] == null ? null : invQty[item.id];
            if (newQty !== curQty) {
                jobs.push({ code: item.id, name: item.l + (item.s && item.s !== '//' ? ' // ' + item.s : ''), qty: newQty });
            }
        });
    });
    if (!jobs.length) {
        showToast('No hay cambios de stock sin guardar.');
        return;
    }
    busy = true;
    busyMsg = 'Guardando ' + jobs.length + ' cambio(s) de stock...';
    render();
    try {
        for (var i = 0; i < jobs.length; i++) {
            await api('admin-inventory-set-stock', { token: token, code: jobs[i].code, name: jobs[i].name, qty: jobs[i].qty });
            invQty[jobs[i].code] = jobs[i].qty;
            if (jobs[i].qty != null)
                invStock[jobs[i].code] = jobs[i].qty > 0;
        }
    }
    catch (e) {
        busy = false;
        render();
        showToast('Error al guardar: ' + e.message);
        return;
    }
    busy = false;
    render();
    showToast(jobs.length + ' producto(s) actualizado(s).');
}
// Registra una tanda: manda solo cuánto se PRODUJO de cada insumo y deja que el servidor
// haga la suma sobre la fila fresca (admin-inventory-restock). Va en UNA sola llamada, a
// diferencia del guardado fila por fila: una tanda es un evento, y si se corta a la mitad
// el dueño no tiene forma de saber qué insumos ya se sumaron y cuáles no — reponerlos
// "por si acaso" duplicaría el stock de los que sí pasaron.
async function registerBatchRestock() {
    var items = [];
    var invalid = false;
    INV_CATS.forEach(function (cat) {
        cat.arr.forEach(function (item) {
            var el = document.getElementById('qty-' + item.id);
            if (!el)
                return;
            var raw = el.value.trim();
            if (raw === '')
                return; // insumo que no entró en esta tanda
            var add = parseInt(raw, 10);
            if (!isFinite(add) || add <= 0) {
                invalid = true;
                return;
            }
            items.push({ code: item.id, name: item.l + (item.s && item.s !== '//' ? ' // ' + item.s : ''), add: add });
        });
    });
    if (invalid) {
        showToast('Una tanda solo suma: escribe cantidades mayores a 0, o deja vacío lo que no cocinaste.');
        return;
    }
    if (!items.length) {
        showToast('Escribe cuánto produjiste de al menos un insumo.');
        return;
    }
    if (!(await showConfirm('¿Registrar la tanda? Se sumarán las cantidades de ' + items.length + ' insumo(s) a lo que ya había en stock.')))
        return;
    busy = true;
    busyMsg = 'Registrando la tanda...';
    render();
    try {
        var r = await api('admin-inventory-restock', { token: token, items: items });
        // El servidor devuelve el stock resultante de cada insumo — se toma de ahí y no del
        // cálculo local, así lo que muestra la pantalla es lo que de verdad quedó guardado.
        (r.applied || []).forEach(function (a) { invQty[a.code] = a.to; invStock[a.code] = a.to > 0; });
    }
    catch (e) {
        busy = false;
        render();
        showToast('Error al registrar la tanda: ' + e.message);
        return;
    }
    busy = false;
    invMode = 'fijar';
    render();
    showToast('Tanda registrada: ' + items.length + ' insumo(s) repuesto(s).');
}
var _adminList = [];
async function loadAdminMgr() { sndScreen = 'admin_mgr'; busy = true; busyMsg = 'Cargando...'; render(); try {
    var r = await api('admin-accounts-list', { token: token });
    _adminList = r.accounts;
}
catch (e) {
    _adminList = [];
} busy = false; render(); }
async function addAdmin() {
    var ph = document.getElementById('aa-ph') && gv('aa-ph').trim();
    var nm = document.getElementById('aa-nm') && gv('aa-nm').trim();
    if (!ph || !nm) {
        showToast('Ingresa nombre y teléfono.');
        return;
    }
    // Misma fricción que quitarle el acceso a un admin (reingresar el PIN, no solo el
    // token de sesión) — agregar acceso administrativo total es igual de sensible que
    // quitarlo, antes solo esta acción pedía menos confirmación (auditoría de seguridad).
    var pin = await showPrompt('Ingresa tu PIN para confirmar:', '', 'tel');
    if (!pin)
        return;
    try {
        await api('admin-accounts-add', { token: token, phone: ph, name: nm, pin: pin });
        await loadAdminMgr();
    }
    catch (e) {
        showToast('Error: ' + e.message);
    }
}
async function delAdmin(ph) {
    if (!(await showConfirm('¿Eliminar admin ' + ph + '?')))
        return;
    // Misma fricción que borrar la propia cuenta de cliente (pedir el PIN de nuevo, no
    // solo el token de sesión) — antes esta acción, más irreversible/de mayor impacto
    // operativo, pedía MENOS confirmación que esa (hallazgo de auditoría UX).
    var pin = await showPrompt('Ingresa tu PIN para confirmar:', '', 'tel');
    if (!pin)
        return;
    try {
        await api('admin-accounts-delete', { token: token, phone: ph, pin: pin });
        await loadAdminMgr();
    }
    catch (e) {
        showToast('Error: ' + e.message);
    }
}
function sAdminMgr() {
    return H('ADMINISTRADORES', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">'
        + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:14px">Cuentas admin // ' + _adminList.length + '</div>'
        + _adminList.map(function (a) { var sp = a.role === 'superadmin'; return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:17px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + esc(a.name) + '</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">' + esc(a.phone) + ' · ' + (sp ? 'Superadmin' : 'admin') + '</div></div>' + (sp ? '<span style="font-family:EB Garamond,serif;font-style:italic;font-size:8px;color:' + GOLD + '">Principal</span>' : '<button onclick="delAdmin(\'' + a.phone + '\')" style="all:unset;cursor:pointer;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:12px;font-weight:600;color:var(--sw-danger-strong,#ff5555)">Eliminar</button>') + '</div>'; }).join('')
        + '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>'
        + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:12px">Agregar admin //</div>'
        + '<div style="display:flex;flex-direction:column;gap:10px">'
        + INP('aa-nm', 'Nombre del nuevo admin', 'text', undefined, 'clientes')
        + INP('aa-ph', 'Teléfono', 'tel', undefined, 'phone')
        + BTN('Agregar //', 'addAdmin()')
        + '</div></div>';
}
// PRECIOS — edita el catálogo (proteínas, signatures, bebidas/sides, recompensas) sin
// necesitar un redeploy: guarda en la tabla catalog_prices vía admin-catalog-set-price,
// que el resto de la app ya lee en cada acción sensible al precio (ver loadCatalogPrices
// del lado servidor).
var catalogMsg = '';
async function loadAdminCatalog() {
    sndScreen = 'admin_catalog';
    busy = true;
    busyMsg = 'Cargando precios...';
    render();
    await loadCatalogBackground();
    busy = false;
    render();
}
function cpNumField(id, label, val) {
    return '<div style="flex:1;min-width:64px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:8px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">' + label + '</div><input id="' + id + '" type="number" step="0.1" value="' + val + '" style="background:var(--sw-bg,#1E3932);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:8px;padding:8px 10px;color:var(--sw-text,#FFFFFF);width:100%;font-size:16px;box-sizing:border-box"></div>';
}
function cpRow(label, inputsHtml, fn) {
    return '<div class="cp-row" data-name="' + esc(label.toLowerCase()) + '" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:10px">'
        + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:10px">' + esc(label) + '</div>'
        // flex-wrap: en pantallas angostas (~320px) los inputs numéricos + el botón GUARDAR
        // no caben en una sola fila — antes se comprimían/cortaban en vez de acomodarse en
        // una segunda línea (hallazgo de auditoría UX, especialmente visible en la fila de
        // 3 campos de PROTEÍNAS).
        + '<div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">' + inputsHtml
        + '<button onclick="' + fn + '" style="all:unset;cursor:pointer;background:' + GOLD + ';color:var(--sw-on-gold,#241a08);font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:9px 14px;border-radius:8px;white-space:nowrap">Guardar</button></div></div>';
}
// Filtra filas de catálogo/inventario por nombre sin volver a renderizar toda la
// pantalla (render() reconstruye el innerHTML completo y le haría perder el foco/cursor
// al propio campo de búsqueda en cada tecla) — solo alterna display en el DOM ya pintado.
function filterAdminRows(inputId, rowClass) {
    var q = (gv(inputId) || '').toLowerCase().trim();
    var rows = document.getElementsByClassName(rowClass);
    for (var i = 0; i < rows.length; i++) {
        var name = (rows[i].getAttribute('data-name') || '');
        rows[i].style.display = (!q || name.indexOf(q) >= 0) ? '' : 'none';
    }
}
function SEARCHBOX(id, ph, rowClass) {
    return '<div style="position:relative;margin-bottom:12px">'
        + '<div style="position:absolute;left:15px;top:50%;transform:translateY(-50%);pointer-events:none;opacity:.55">' + icon('buscar', 16, '#A8C8B0') + '</div>'
        + '<input id="' + id + '" type="text" placeholder="' + ph + '" oninput="filterAdminRows(\'' + id + '\',\'' + rowClass + '\')" style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:12px 16px 12px 44px;color:var(--sw-text,#FFFFFF);width:100%;font-size:16px;box-sizing:border-box">'
        + '</div>';
}
function sAdminCatalog() {
    return H('PRECIOS // CATÁLOGO', "loadAdmin()")
        + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">'
        + (catalogMsg ? '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-ok,#25D366);margin-bottom:14px;text-align:center">' + esc(catalogMsg) + '</div>' : '')
        + SEARCHBOX('cat-search', 'Buscar producto o recompensa', 'cp-row')
        + '<div style="margin-bottom:16px">' + BTN('Guardar todos los cambios //', 'saveAllCatalogChanges()', true) + '</div>'
        + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:12px">Proteínas //</div>'
        + PROTS.map(function (p) {
            return cpRow(p.l + ' ' + p.s, cpNumField('cp-protein-' + p.id + '-p15', '15CM', p.p15) + cpNumField('cp-protein-' + p.id + '-p30', '30CM', p.p30) + cpNumField('cp-protein-' + p.id + '-pDbl', 'Doble 15CM +', p.pDbl) + cpNumField('cp-protein-' + p.id + '-pDbl30', 'Doble 30CM +', p.pDbl30), "saveCatalogPrice('protein','" + p.id + "')");
        }).join('')
        + '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>'
        + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:12px">Signatures //</div>'
        + SIGS.map(function (s) {
            return cpRow(s.n + ' ' + s.s, cpNumField('cp-sig-' + s.id + '-p15', '15CM', s.p15) + cpNumField('cp-sig-' + s.id + '-p30', '30CM', s.p30), "saveCatalogPrice('sig','" + s.id + "')");
        }).join('')
        + '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>'
        + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:12px">Bebidas y sides //</div>'
        + SIDES.map(function (d) {
            return cpRow(d.l + ' ' + d.s, cpNumField('cp-side-' + d.id + '-price', 'Precio', d.p), "saveCatalogPrice('side','" + d.id + "')");
        }).join('')
        + '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:16px 0"></div>'
        + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:12px">Recompensas // puntos</div>'
        + RWDS.map(function (rw) {
            return cpRow(rw.n + ' ' + rw.s, cpNumField('cp-reward-' + rw.id + '-pts', 'Puntos', rw.pts), "saveCatalogPrice('reward','" + rw.id + "')");
        }).join('')
        + '</div>';
}
function catalogFormValues(category, code) {
    if (category === 'protein')
        return { p15: Number(gv('cp-protein-' + code + '-p15')), p30: Number(gv('cp-protein-' + code + '-p30')), pDbl: Number(gv('cp-protein-' + code + '-pDbl')), pDbl30: Number(gv('cp-protein-' + code + '-pDbl30')) };
    if (category === 'sig')
        return { p15: Number(gv('cp-sig-' + code + '-p15')), p30: Number(gv('cp-sig-' + code + '-p30')) };
    if (category === 'side')
        return { price: Number(gv('cp-side-' + code + '-price')) };
    if (category === 'reward')
        return { pts: Number(gv('cp-reward-' + code + '-pts')) };
    return null;
}
async function saveCatalogPrice(category, code) {
    var values = catalogFormValues(category, code);
    if (!values)
        return;
    busy = true;
    busyMsg = 'Guardando precio...';
    render();
    try {
        await api('admin-catalog-set-price', { token: token, code: code, category: category, values: values });
        await loadCatalogBackground();
        catalogMsg = 'Precio actualizado.';
    }
    catch (e) {
        busy = false;
        render();
        showToast('Error: ' + e.message);
        return;
    }
    busy = false;
    render();
    setTimeout(function () { catalogMsg = ''; if (sndScreen === 'admin_catalog')
        render(); }, 2500);
}
// Guardado en lote — antes cada fila (22+ entre proteínas/signatures/bebidas/
// recompensas) solo se podía guardar una por una, sin indicador de qué quedó sin
// guardar (hallazgo de auditoría admin). Reutiliza el mismo action de a una fila
// (admin-catalog-set-price) por cada cambio real detectado, sin tocar el backend —
// lee TODOS los inputs antes de mostrar el estado "busy" (que reemplaza el DOM y
// borraría esos mismos inputs si se leyeran después).
async function saveAllCatalogChanges() {
    var jobs = [];
    PROTS.forEach(function (p) {
        var v = catalogFormValues('protein', p.id);
        if (v.p15 !== p.p15 || v.p30 !== p.p30 || v.pDbl !== p.pDbl || v.pDbl30 !== p.pDbl30)
            jobs.push({ category: 'protein', code: p.id, values: v });
    });
    SIGS.forEach(function (s) {
        var v = catalogFormValues('sig', s.id);
        if (v.p15 !== s.p15 || v.p30 !== s.p30)
            jobs.push({ category: 'sig', code: s.id, values: v });
    });
    SIDES.forEach(function (d) {
        var v = catalogFormValues('side', d.id);
        if (v.price !== d.p)
            jobs.push({ category: 'side', code: d.id, values: v });
    });
    RWDS.forEach(function (rw) {
        var v = catalogFormValues('reward', rw.id);
        if (v.pts !== rw.pts)
            jobs.push({ category: 'reward', code: rw.id, values: v });
    });
    if (!jobs.length) {
        catalogMsg = 'No hay cambios sin guardar.';
        render();
        setTimeout(function () { catalogMsg = ''; if (sndScreen === 'admin_catalog')
            render(); }, 2000);
        return;
    }
    busy = true;
    busyMsg = 'Guardando ' + jobs.length + ' cambio(s)...';
    render();
    try {
        for (var i = 0; i < jobs.length; i++) {
            await api('admin-catalog-set-price', { token: token, code: jobs[i].code, category: jobs[i].category, values: jobs[i].values });
        }
        await loadCatalogBackground();
        catalogMsg = jobs.length + ' precio(s) actualizado(s).';
    }
    catch (e) {
        busy = false;
        render();
        showToast('Error: ' + e.message);
        return;
    }
    busy = false;
    render();
    setTimeout(function () { catalogMsg = ''; if (sndScreen === 'admin_catalog')
        render(); }, 2500);
}
// MENÚ SECRETO — rotación mensual (decisión del dueño, 2026-08-10, reemplaza "The Vault"
// fijo). Publicar un cambio INSERTA una fila nueva en `secret_signature` (nunca
// actualiza in-place, ver actAdminSecretSignatureSet) — la fila de mayor id es la
// vigente, así queda historial de sándwiches secretos anteriores gratis.
var ssName = '', ssBase = '', ssProt = '', ssTops = [], ssSauces = [], ssVaultIds = [], ssP15 = '', ssP30 = '', ssMinOrders = '', ssImagePath = '', ssMsg = '', ssHistory = [];
async function loadSecretSignatureAdmin() {
    sndScreen = 'admin_secret';
    busy = true;
    busyMsg = 'Cargando menú secreto...';
    render();
    try {
        var r = await api('admin-secret-signature-get', { token: token });
        var cur = r.current;
        ssName = cur ? cur.name : '';
        ssBase = cur ? cur.base : 'B03';
        ssProt = cur ? cur.protein_id : '';
        ssTops = cur && Array.isArray(cur.tops) ? cur.tops.slice() : [];
        ssSauces = cur && Array.isArray(cur.sauces) ? cur.sauces.slice() : [];
        ssVaultIds = cur && Array.isArray(cur.vault_only_ids) ? cur.vault_only_ids.slice() : [];
        ssP15 = cur ? String(cur.price_15) : '';
        ssP30 = cur ? String(cur.price_30) : '';
        ssMinOrders = cur ? String(cur.min_orders) : '5';
        ssImagePath = cur && cur.image_path ? cur.image_path : '';
        ssHistory = r.history || [];
    }
    catch (e) {
        showToast('Error: ' + e.message);
    }
    busy = false;
    render();
}
function ssToggle(arr, id, max) {
    var i = arr.indexOf(id);
    if (i >= 0) {
        arr.splice(i, 1);
        var vi = ssVaultIds.indexOf(id);
        if (vi >= 0)
            ssVaultIds.splice(vi, 1);
    }
    else if (arr.length < max)
        arr.push(id);
    render();
}
function ssToggleVault(id) {
    var i = ssVaultIds.indexOf(id);
    if (i >= 0)
        ssVaultIds.splice(i, 1);
    else
        ssVaultIds.push(id);
    render();
}
function ssChip(sel, label, onclick) {
    return '<div onclick="' + onclick + '" style="background:' + (sel ? 'var(--sw-card2,#1A3028)' : 'var(--sw-card,#2D5246)') + ';border:1px solid ' + (sel ? GOLD : 'var(--sw-border,#3A6B58)') + ';border-radius:8px;padding:9px 12px;cursor:pointer;font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text,#FFFFFF);display:inline-block;margin:0 6px 6px 0">' + label + '</div>';
}
function sAdminSecretSignature() {
    var chosenIds = [ssProt, ...ssTops, ...ssSauces].filter(function (id) { return !!id; });
    var vaultChips = chosenIds.map(function (id) {
        var item = PROTS.find(function (x) { return x.id === id; }) || TOPS.find(function (x) { return x.id === id; }) || SAUCES.find(function (x) { return x.id === id; });
        if (!item)
            return '';
        var sel = ssVaultIds.indexOf(id) >= 0;
        return ssChip(sel, (sel ? '✓ ' : '') + item.l + ' ' + item.s, "ssToggleVault('" + id + "')");
    }).join('');
    return H('MENÚ SECRETO', "loadAdmin()")
        + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">'
        + (ssMsg ? '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-ok,#25D366);margin-bottom:14px;text-align:center">' + esc(ssMsg) + '</div>' : '')
        + '<p style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.6;margin-bottom:16px">El sándwich secreto rota — publica una receta nueva cuando quieras, sin depender de una sesión de código. El nombre y el precio son lo único que el cliente ve; la composición se revela recién cuando lo pide.</p>'
        + '<div style="margin-bottom:14px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Nombre del mes</div>' + INP('ss-name', 'ej. Reserva de Agosto', 'text', ssName) + '</div>'
        + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Pan //</div>'
        + '<div style="margin-bottom:14px">' + BASES.map(function (b) { return ssChip(ssBase === b.id, b.l + ' ' + b.s, "ssBase='" + b.id + "';render()"); }).join('') + '</div>'
        + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Proteína //</div>'
        // ⚠ ACÁ NO SE FILTRA POR `sigOnly`, y es a propósito (2026-09-05).
        //
        // `sigOnly` significa "no se puede armar en ARMA EL TUYO", NO "no se puede usar en un
        // Signature" — es literalmente lo contrario. El menú secreto ES un Signature, así que
        // filtrarlo acá estaba invertido y nadie lo notaba mientras el Set estuvo vacío.
        //
        // Dejó de ser teórico el día que P01 (Res) y P05 (Embutido) pasaron a `sigOnly` por
        // rentabilidad: con el filtro puesto, el dueño perdía la posibilidad de poner RES —la
        // proteína insignia— en el menú secreto del mes, sin ningún aviso y sin que nada fallara.
        + '<div style="margin-bottom:14px">' + PROTS.map(function (p) { return ssChip(ssProt === p.id, p.l + ' ' + p.s, "ssProt='" + p.id + "';var vi=ssVaultIds.indexOf('" + p.id + "');render()"); }).join('') + '</div>'
        + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Toppings // hasta 3 (' + ssTops.length + '/3)</div>'
        + '<div style="margin-bottom:14px">' + TOPS.filter(function (t) { return !t.sigOnly; }).map(function (t) { return ssChip(ssTops.indexOf(t.id) >= 0, t.l + ' ' + t.s, "ssToggle(ssTops,'" + t.id + "',3)"); }).join('') + '</div>'
        + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Salsas // hasta 2 (' + ssSauces.length + '/2)</div>'
        + '<div style="margin-bottom:14px">' + SAUCES.filter(function (s) { return !s.sigOnly; }).map(function (s) { return ssChip(ssSauces.indexOf(s.id) >= 0, s.l + ' ' + s.s, "ssToggle(ssSauces,'" + s.id + "',2)"); }).join('') + '</div>'
        + (chosenIds.length ? '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:6px">Exclusivos de este mes //</div>'
            + '<p style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:8px">Marca los ingredientes que NO deben poder armarse por Arma el tuyo este mes — es lo que hace que valga la pena desbloquear el secreto.</p>'
            + '<div style="margin-bottom:14px">' + vaultChips + '</div>' : '')
        + '<div style="display:flex;gap:8px;margin-bottom:14px">' + cpNumField('ss-p15', '15CM', ssP15) + cpNumField('ss-p30', '30CM', ssP30) + cpNumField('ss-min', 'Pedidos mín.', ssMinOrders) + '</div>'
        + '<div style="margin-bottom:20px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Foto (ruta/URL, opcional)</div>' + INP('ss-img', 'ej. img/sig05.jpg', undefined, ssImagePath) + '</div>'
        + BTN('Publicar sándwich del mes //', 'saveSecretSignature()')
        + (ssHistory.length ? '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:22px 0 14px"></div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Historial //</div>'
            + ssHistory.map(function (h) { return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:10px 14px;margin-bottom:8px;font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">' + esc(h.name) + ' · ' + new Date(h.created_at).toLocaleDateString('es-PE') + '</div>'; }).join('') : '')
        + '</div>';
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
var ciCur = {}, ciSel = '', ciName = '', ciSub = '', ciBadge = '', ciPitch = '', ciBase = '', ciProt = '', ciTops = [], ciSauces = [], ciCheese = '', ciP15 = '', ciP30 = '', ciImg = '', ciActive = true, ciMsg = '', ciHistory = [];
async function loadCatalogItemsAdmin() {
    sndScreen = 'admin_items';
    busy = true;
    busyMsg = 'Cargando Signatures...';
    render();
    try {
        var r = await api('admin-catalog-items-get', { token: token });
        ciCur = r.current || {};
        ciHistory = r.history || [];
        // Se abre el primero por defecto para que la pantalla no arranque vacía.
        if (!ciSel || !ciCur[ciSel]) {
            var ks = Object.keys(ciCur).sort();
            ciSel = ks.length ? ks[0] : '';
        }
        ciLoadForm();
    }
    catch (e) {
        showToast('Error: ' + e.message);
    }
    busy = false;
    render();
}
function ciLoadForm() {
    var c = ciCur[ciSel];
    ciName = c ? c.name : '';
    ciSub = c ? (c.subtitle || 'Signature') : 'Signature';
    ciBadge = c && c.badge ? c.badge : '';
    ciPitch = c && c.pitch ? c.pitch : '';
    ciBase = c ? c.base : 'B01';
    ciProt = c ? c.protein_id : '';
    ciTops = c && Array.isArray(c.tops) ? c.tops.slice() : [];
    ciSauces = c && Array.isArray(c.sauces) ? c.sauces.slice() : [];
    ciCheese = c && c.fixed_cheese ? c.fixed_cheese : '';
    ciP15 = c ? String(c.price_15) : '';
    ciP30 = c ? String(c.price_30) : '';
    ciImg = c && c.image_path ? c.image_path : '';
    ciActive = c ? c.active !== false : true;
}
function ciPick(id) {
    // Se guarda lo escrito en los campos de texto antes de cambiar de ítem: sin esto,
    // tocar otro Signature perdía en silencio lo que estabas editando.
    ciSyncInputs();
    ciSel = id;
    ciLoadForm();
    render();
}
function ciSyncInputs() {
    if (document.getElementById('ci-name')) {
        ciName = gv('ci-name');
        ciSub = gv('ci-sub');
        ciBadge = gv('ci-badge');
        ciPitch = gv('ci-pitch');
        ciImg = gv('ci-img');
        ciP15 = gv('ci-p15');
        ciP30 = gv('ci-p30');
    }
}
function ciToggle(arr, id, max) {
    var i = arr.indexOf(id);
    if (i >= 0)
        arr.splice(i, 1);
    else if (arr.length < max)
        arr.push(id);
    ciSyncInputs();
    render();
}
function sAdminCatalogItems() {
    var ids = Object.keys(ciCur).sort();
    return H('SIGNATURES', "loadAdmin()")
        + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">'
        + (ciMsg ? '<div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:10px;color:var(--sw-ok,#25D366);margin-bottom:14px;text-align:center">' + esc(ciMsg) + '</div>' : '')
        + '<p style="font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.6;margin-bottom:16px">Cambia nombre, texto, receta o precio de cualquier Signature sin tocar código. Cada publicación queda guardada: puedes ver qué se cobraba antes. Para sacar uno de la carta, apaga <b>Activo</b> — su receta se conserva.</p>'
        + '<div style="margin-bottom:16px">' + ids.map(function (id) {
        var c = ciCur[id];
        return ssChip(ciSel === id, (c.active === false ? '○ ' : '') + esc(c.name), "ciPick('" + id + "')");
    }).join('') + '</div>'
        + (ciSel ? '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:0 0 16px"></div>'
            + '<div style="margin-bottom:12px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Nombre</div>' + INP('ci-name', 'ej. The Original', 'text', ciName) + '</div>'
            + '<div style="display:flex;gap:8px;margin-bottom:12px">'
            + '<div style="flex:1"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Subtítulo</div>' + INP('ci-sub', 'Signature', 'text', ciSub) + '</div>'
            + '<div style="flex:1"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Badge (puede ir vacío)</div>' + INP('ci-badge', 'ej. Clásico', 'text', ciBadge) + '</div>'
            + '</div>'
            + '<div style="margin-bottom:14px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Pitch (lo que lee el cliente)</div>' + INP('ci-pitch', 'Describe el sándwich', 'text', ciPitch) + '</div>'
            + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Pan //</div>'
            + '<div style="margin-bottom:14px">' + BASES.map(function (bs) { return ssChip(ciBase === bs.id, bs.l + ' ' + bs.s, "ciSyncInputs();ciBase='" + bs.id + "';render()"); }).join('') + '</div>'
            + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Proteína //</div>'
            + '<div style="margin-bottom:14px">' + PROTS.filter(function (pr) { return !pr.vaultOnly; }).map(function (pr) { return ssChip(ciProt === pr.id, pr.l + ' ' + pr.s, "ciSyncInputs();ciProt='" + pr.id + "';render()"); }).join('') + '</div>'
            + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Toppings // hasta 3 (' + ciTops.length + '/3)</div>'
            + '<div style="margin-bottom:14px">' + TOPS.filter(function (t) { return !t.vaultOnly; }).map(function (t) { return ssChip(ciTops.indexOf(t.id) >= 0, t.l + ' ' + t.s, "ciToggle(ciTops,'" + t.id + "',3)"); }).join('') + '</div>'
            + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Salsas // hasta 2 (' + ciSauces.length + '/2)</div>'
            + '<div style="margin-bottom:14px">' + SAUCES.filter(function (sc) { return !sc.vaultOnly; }).map(function (sc) { return ssChip(ciSauces.indexOf(sc.id) >= 0, sc.l + ' ' + sc.s, "ciToggle(ciSauces,'" + sc.id + "',2)"); }).join('') + '</div>'
            + '<div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Queso fijo // opcional</div>'
            + '<div style="margin-bottom:14px">' + ssChip(!ciCheese, 'Sin queso fijo', "ciSyncInputs();ciCheese='';render()")
            + CHEESE.map(function (ch) { return ssChip(ciCheese === ch.id, ch.l + ' ' + ch.s, "ciSyncInputs();ciCheese='" + ch.id + "';render()"); }).join('') + '</div>'
            + '<div style="display:flex;gap:8px;margin-bottom:14px">' + cpNumField('ci-p15', '15CM', ciP15) + cpNumField('ci-p30', '30CM', ciP30) + '</div>'
            + '<div style="margin-bottom:14px"><div style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:4px">Foto (ruta/URL)</div>' + INP('ci-img', 'ej. img/sig01.jpg', undefined, ciImg) + '</div>'
            + '<div style="margin-bottom:20px">' + ssChip(ciActive, (ciActive ? '✓ ' : '') + 'Activo en la carta', "ciSyncInputs();ciActive=!ciActive;render()") + '</div>'
            + BTN('Publicar cambios //', 'saveCatalogItem()')
            : '<p style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">No hay Signatures publicados todavía.</p>')
        + (ciHistory.length ? '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:22px 0 14px"></div><div style="font-family:\'EB Garamond\',serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Historial //</div>'
            + ciHistory.map(function (h) { return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:10px 14px;margin-bottom:8px;font-family:\'EB Garamond\',serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">' + esc(h.item_id) + ' · ' + esc(h.name) + ' · ' + SOLES_TXT + pz(h.price_15) + '/' + SOLES_TXT + pz(h.price_30) + ' · ' + new Date(h.created_at).toLocaleDateString('es-PE') + '</div>'; }).join('') : '')
        + '</div>';
}
async function saveCatalogItem() {
    ciSyncInputs();
    if (!ciSel)
        return;
    busy = true;
    busyMsg = 'Publicando...';
    render();
    try {
        await api('admin-catalog-items-set', { token: token, itemId: ciSel, name: ciName.trim(), subtitle: ciSub.trim(),
            badge: ciBadge.trim(), pitch: ciPitch.trim(), base: ciBase, proteinId: ciProt, tops: ciTops, sauces: ciSauces,
            fixedCheese: ciCheese || null, price15: Number(ciP15), price30: Number(ciP30),
            imagePath: ciImg.trim() || null, active: ciActive });
        ciMsg = 'Publicado. Los clientes lo ven en su próxima carga.';
        // Se recarga el catálogo del propio panel para que lo que se ve en pantalla sea lo que
        // quedó guardado, no lo que se escribió — si el servidor normalizó algo, se nota acá.
        await loadCatalogItemsAdmin();
        await loadCatalogBackground();
    }
    catch (e) {
        showToast('Error: ' + e.message);
    }
    busy = false;
    render();
    setTimeout(function () { ciMsg = ''; if (sndScreen === 'admin_items')
        render(); }, 2500);
}
async function saveSecretSignature() {
    ssName = gv('ss-name');
    ssImagePath = gv('ss-img');
    ssP15 = gv('ss-p15');
    ssP30 = gv('ss-p30');
    ssMinOrders = gv('ss-min');
    if (!ssName.trim()) {
        showToast('Falta el nombre del sándwich del mes.');
        return;
    }
    if (!ssBase || !ssProt) {
        showToast('Elige pan y proteína.');
        return;
    }
    // Al menos una salsa (no "un topping O una salsa"): el cargo de SALSA EXTRA duplica la
    // última salsa de la receta, así que una receta sin salsas dejaba ese extra sin ningún
    // ingrediente real detrás. El servidor ya lo rechaza; esto lo avisa antes de enviar.
    if (!ssSauces.length) {
        showToast('Elige al menos una salsa para la receta.');
        return;
    }
    if (!ssTops.length) {
        showToast('Elige al menos un topping.');
        return;
    }
    var p15 = Number(ssP15), p30 = Number(ssP30), minOrders = Number(ssMinOrders);
    if (!(p15 > 0) || !(p30 > 0)) {
        showToast('Precio inválido.');
        return;
    }
    if (!Number.isInteger(minOrders) || minOrders < 0) {
        showToast('Pedidos mínimos inválido.');
        return;
    }
    busy = true;
    busyMsg = 'Publicando...';
    render();
    try {
        var pubRes = await api('admin-secret-signature-set', { token: token, name: ssName.trim(), base: ssBase, proteinId: ssProt, tops: ssTops, sauces: ssSauces, vaultOnlyIds: ssVaultIds, price15: p15, price30: p30, minOrders: minOrders, imagePath: ssImagePath.trim() || null });
        await loadCatalogBackground();
        // El servidor avisa por push a quienes ya desbloquearon el menú secreto y devuelve a
        // cuántos les llegó. Se muestra el número porque el dueño no tiene otra forma de saber
        // si el aviso salió: es 0 tanto si nadie calificaba como si se corrigió una publicación
        // reciente (hay una ventana de 12 h para no mandar dos push por arreglar una tilde).
        var av = pubRes && pubRes.announced;
        ssMsg = 'Sándwich del mes publicado.' + (av ? ' Avisamos a ' + av + ' cliente(s) que ya lo desbloquearon.' : ' (Sin aviso push esta vez.)');
    }
    catch (e) {
        busy = false;
        render();
        showToast('Error: ' + e.message);
        return;
    }
    await loadSecretSignatureAdmin();
    setTimeout(function () { ssMsg = ''; if (sndScreen === 'admin_secret')
        render(); }, 2500);
}
// FICHA DE CLIENTE (#94) — historial completo de un cliente (pedidos, puntos,
// calificaciones, crédito) en una sola búsqueda por teléfono en vez de cruzar pantallas.
async function loadCustomerDetail() {
    var el = document.getElementById('cd-phone');
    var phone = (el ? el.value : custDetailPhone).trim();
    if (!phone) {
        custDetailErr = 'Ingresa un teléfono.';
        render();
        return;
    }
    custDetailPhone = phone;
    custDetailErr = '';
    busy = true;
    busyMsg = 'Buscando cliente...';
    render();
    try {
        custDetail = await api('admin-customer-detail', { token: token, phone: phone });
    }
    catch (e) {
        custDetail = null;
        custDetailErr = e.message;
    }
    busy = false;
    render();
}
function sAdminCustomer() {
    var h = H('FICHA DE CLIENTE', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    h += INP('cd-phone', 'Teléfono del cliente', 'tel', custDetailPhone, 'phone');
    h += '<div style="margin-top:10px">' + BTN('Buscar //', 'loadCustomerDetail()') + '</div>';
    if (custDetailErr)
        h += '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-danger,#ff8888);margin-top:12px;text-align:center">' + esc(custDetailErr) + '</div>';
    if (custDetail) {
        var c = custDetail.customer;
        h += '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:20px 0"></div>'
            + '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:12px;padding:16px;margin-bottom:16px">'
            + '<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text,#FFFFFF);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(c.name) + '</div>'
            + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">' + esc(c.phone) + (c.email ? ' · ' + esc(c.email) : '') + '</div>'
            + '<div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap">'
            + '<div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:8px;color:' + GOLD + '">Puntos</div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text,#FFFFFF)">' + (c.points || 0) + '</div></div>'
            + '<div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:8px;color:' + GOLD + '">Pedidos</div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text,#FFFFFF)">' + (c.total_orders || 0) + '</div></div>'
            + '<div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:8px;color:' + GOLD + '">Crédito</div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text,#FFFFFF)">' + SOLES + pz(c.credit_balance || 0) + '</div></div>'
            + '</div></div>';
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Pedidos recientes // ' + custDetail.orders.length + '</div>';
        h += custDetail.orders.length ? custDetail.orders.map(function (o) { return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:10px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">' + esc(o.ref) + '</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0)">' + esc(o.date) + ' · ' + SOLES + pz(o.total) + '</div></div>' + stBadge(o.status) + '</div>'; }).join('') : '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">Sin pedidos //</div>';
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin:18px 0 10px">Historial de puntos // ' + custDetail.transactions.length + '</div>';
        h += custDetail.transactions.length ? custDetail.transactions.map(function (t) { var pos = t.points >= 0; return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1E3932"><span style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">' + esc(t.description) + '</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:12px;color:' + (pos ? 'var(--sw-ok,#25D366)' : 'var(--sw-danger,#ff8888)') + '">' + (pos ? '+' : '') + t.points + '</span></div>'; }).join('') : '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">Sin movimientos //</div>';
        if (custDetail.ratings && custDetail.ratings.length) {
            h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin:18px 0 10px">Calificaciones // ' + custDetail.ratings.length + '</div>';
            h += custDetail.ratings.map(function (r) { return '<div style="padding:8px 0;border-bottom:1px solid #1E3932"><span style="color:#F5C518">' + '★'.repeat(r.stars) + '</span>' + (r.comment ? '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">' + esc(r.comment) + '</div>' : '') + '</div>'; }).join('');
        }
    }
    h += '</div>';
    return h;
}
// BUSCAR PEDIDOS (#95) — búsqueda libre de cualquier pedido (no solo los activos que
// muestra admin_home) por ref/teléfono/nombre y/o estado.
async function doSearchOrders() {
    var qEl = document.getElementById('so-q'), stEl = document.getElementById('so-status');
    searchQ = qEl ? qEl.value.trim() : '';
    searchStatus = stEl ? stEl.value : '';
    if (!searchQ && !searchStatus) {
        showToast('Ingresa un texto o elige un estado.');
        return;
    }
    busy = true;
    busyMsg = 'Buscando pedidos...';
    render();
    try {
        var r = await api('admin-search-orders', { token: token, q: searchQ || undefined, status: searchStatus || undefined });
        searchResults = r.orders;
        searchTruncated = !!r.truncated;
    }
    catch (e) {
        searchResults = [];
        showToast('Error: ' + e.message);
    }
    busy = false;
    render();
}
function waSearchResult(i) { waAdminOrder(searchResults[i]); }
function sAdminSearch() {
    var h = H('BUSCAR PEDIDOS', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    h += INP('so-q', 'Ref, teléfono o nombre', 'text', searchQ, 'buscar');
    h += '<div style="margin:10px 0"><select id="so-status" style="width:100%;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px;color:var(--sw-text,#FFFFFF);font-size:14px">'
        + '<option value="">Todos los estados</option>'
        + Object.keys(STATUSES).map(function (s) { return '<option value="' + s + '" ' + (searchStatus === s ? 'selected' : '') + '>' + s + '</option>'; }).join('')
        + '</select></div>';
    h += BTN('Buscar //', 'doSearchOrders()');
    if (searchResults !== null) {
        h += '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:20px 0"></div>';
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Resultados // ' + searchResults.length + (searchTruncated ? ' (recortado)' : '') + '</div>';
        h += searchResults.length ? searchResults.map(function (o, i) {
            return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px;margin-bottom:10px">'
                + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + esc(o.customer_name || 'Invitado') + '</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0)">' + esc(o.ref) + ' · ' + esc(o.date) + ' · ' + SOLES + pz(o.total) + '</div></div>' + stBadge(o.status) + '</div>'
                + ((o.contact_phone || o.customer_phone) ? '<button onclick="waSearchResult(' + i + ')" style="all:unset;cursor:pointer;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:11px;color:' + GOLD + '">' + iconTxt('chat', 'WhatsApp', GOLD) + '</button>' : '')
                + '</div>';
        }).join('') : '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);text-align:center;padding:20px 0">Sin resultados //</div>';
    }
    h += '</div>';
    return h;
}
// AUDITORÍA (#96) — visor de admin_action_log (antes solo consultable desde el
// dashboard de Supabase).
async function loadAuditLog() {
    sndScreen = 'admin_audit';
    busy = true;
    busyMsg = 'Cargando auditoría...';
    render();
    try {
        var r = await api('admin-audit-log', { token: token, limit: 50 });
        auditLog = r.log;
    }
    catch (e) {
        auditLog = [];
    }
    busy = false;
    render();
}
// Antes mostraba el string técnico crudo (ej. "update-status", "catalog-set-price")
// directo de la columna `action` — rompía con el resto de la app, que consistentemente
// usa copy en español llano (hallazgo de auditoría de diseño admin, MEDIO).
var AUDIT_ACTION_LABEL = {
    'manual-points': 'Puntos manuales otorgados', 'manual-credit': 'Ajuste manual de crédito',
    'accounts-add': 'Cuenta admin agregada', 'accounts-delete': 'Cuenta admin eliminada',
    'export-orders': 'Exportó pedidos (CSV)', 'export-customers': 'Exportó clientes (CSV)',
    'catalog-set-price': 'Precio de catálogo editado', 'respond-complaint': 'Reclamo respondido',
    'set-store-hours': 'Horario de atención editado', 'set-business-launched': 'Bandera "negocio abierto" cambiada', 'update-status': 'Estado de pedido actualizado',
    'bulk-update-status': 'Estados actualizados en lote', 'confirm-payment': 'Pago manual confirmado',
    'cancel-order': 'Pedido cancelado', 'self-cancel-needs-refund': 'Cliente canceló pedido pagado',
    'inventory-toggle': 'Disponibilidad de producto cambiada', 'inventory-set-stock': 'Stock de producto editado',
    'promo-create': 'Código promocional creado', 'promo-toggle': 'Código promocional activado/desactivado',
    'calendar-create': 'Entrada de calendario creada', 'calendar-update': 'Entrada de calendario editada', 'calendar-delete': 'Entrada de calendario eliminada',
    'calendar-image-upload': 'Foto subida a una entrada del calendario', 'raw-video-upload': 'Clip crudo subido a la cola semanal', 'social-publish': 'Publicación enviada a Meta (Instagram/Facebook)',
};
function sAdminAudit() {
    var h = H('REGISTRO DE AUDITORÍA', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    var log = auditLog || [];
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:14px">Últimas ' + log.length + ' acciones //</div>';
    h += log.length ? log.map(function (l) {
        return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:12px 14px;margin-bottom:8px">'
            + '<div style="display:flex;justify-content:space-between"><span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + esc(AUDIT_ACTION_LABEL[l.action] || l.action) + '</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0)">' + esc(l.actor_phone) + '</span></div>'
            + (l.target ? '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px;word-break:break-all">' + esc(String(l.target)) + '</div>' : '')
            + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">' + esc(new Date(l.created_at).toLocaleString('es-PE')) + '</div>'
            + '</div>';
    }).join('') : '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);text-align:center;padding:20px 0">Sin registros aún //</div>';
    h += '</div>';
    return h;
}
// HORARIO DE ATENCIÓN (#97) — ver comentario en env.ts/loadStoreHours: antes el
// horario era un array hardcodeado que exigía redesplegar la función para cambiarlo.
var DOW_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
async function loadStoreHoursForm() {
    sndScreen = 'admin_hours';
    busy = true;
    busyMsg = 'Cargando horario...';
    render();
    try {
        var r = await api('get-store-hours', {});
        storeHoursForm = r.hours;
        businessLaunched = r.businessLaunched === true;
    }
    catch (e) {
        storeHoursForm = DOW_NAMES.map(function () { return { open: 11, close: 22, closed: false }; });
    }
    busy = false;
    render();
}
var _launchToggleInProgress = false;
// Pausa temporal: cierra la tienda un rato y se reabre SOLA. Antes esto obligaba a editar
// el horario semanal y acordarse de revertirlo — si se olvidaba, se perdía ese mismo día
// de la semana siguiente entero.
async function pauseStore(minutes) {
    if (minutes > 0 && !(await showConfirm('¿Pausar los pedidos por ' + (minutes >= 60 ? (minutes / 60) + ' hora(s)' : minutes + ' minutos') + '?\nLa tienda se reabre sola, no tienes que acordarte de nada.')))
        return;
    try {
        var r = await api('admin-pause-store', { token: token, minutes: minutes });
        storePausedUntil = r.pausedUntil || null;
        storeHoursMsg = minutes > 0 ? 'Pausado. Volvemos solos a las ' + new Date(r.pausedUntil).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) + '.' : 'Pedidos reactivados.';
        render();
        setTimeout(function () { storeHoursMsg = ''; if (sndScreen === 'admin_hours')
            render(); }, 3500);
    }
    catch (e) {
        showToast(e.message);
    }
}
async function toggleBusinessLaunched() {
    if (_launchToggleInProgress)
        return;
    var next = !businessLaunched;
    if (next && !(await showConfirm('¿Confirmas que SND//WCH ya abrió de verdad?\n\nEsto retira la tarjeta "Avísame cuando abramos" del Home para todos los invitados — solo actívalo el día real de lanzamiento.')))
        return;
    _launchToggleInProgress = true;
    render();
    try {
        await api('admin-set-business-launched', { token: token, launched: next });
        businessLaunched = next;
        showToast(next ? '¡Listo! El negocio ya figura como abierto.' : 'Revertido: el negocio figura como aún no abierto.', 'success');
    }
    catch (e) {
        showToast('Error: ' + e.message);
    }
    _launchToggleInProgress = false;
    render();
}
function toggleClosedDay(i) {
    if (!storeHoursForm)
        return;
    var el = document.getElementById('sh-closed-' + i);
    var checked = el && el.checked;
    var d = storeHoursForm[i] || {};
    storeHoursForm[i] = checked ? { open: d.open, close: d.close, closed: true } : { open: d.open == null ? 11 : d.open, close: d.close == null ? 22 : d.close, closed: false };
    render();
}
async function saveStoreHours() {
    var days = DOW_NAMES.map(function (_, i) {
        var d = storeHoursForm[i] || {};
        if (d.closed)
            return { closed: true };
        var openEl = document.getElementById('sh-open-' + i), closeEl = document.getElementById('sh-close-' + i);
        return { open: Number(openEl.value), close: Number(closeEl.value), closed: false };
    });
    busy = true;
    busyMsg = 'Guardando horario...';
    render();
    try {
        await api('admin-set-store-hours', { token: token, days: days });
        storeHoursMsg = 'Horario actualizado.';
    }
    catch (e) {
        showToast('Error: ' + e.message);
    }
    busy = false;
    render();
    setTimeout(function () { storeHoursMsg = ''; if (sndScreen === 'admin_hours')
        render(); }, 2500);
}
function sAdminHours() {
    var h = H('HORARIO DE ATENCIÓN', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (storeHoursMsg)
        h += '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-ok,#25D366);margin-bottom:14px;text-align:center">' + esc(storeHoursMsg) + '</div>';
    // Bandera de lanzamiento real — controla si la tarjeta "Avísame cuando abramos" sigue
    // apareciendo en el Home de los invitados. Vive aparte del horario semanal porque es
    // un interruptor de una sola vez, no un dato que se edite seguido.
    h += '<div style="background:' + (businessLaunched ? 'rgba(37,211,102,.1)' : 'var(--sw-card,#2D5246)') + ';border:1px solid ' + (businessLaunched ? 'rgba(37,211,102,.4)' : GOLD) + ';border-radius:10px;padding:14px 16px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;gap:12px">'
        + '<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + (businessLaunched ? 'El negocio ya abrió //' : 'Aún no hemos abierto //') + '</div>'
        + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">' + (businessLaunched ? 'La tarjeta de lista de espera ya no aparece en el Home.' : 'Actívalo el día real de lanzamiento para retirar la lista de espera.') + '</div></div>'
        + '<button onclick="toggleBusinessLaunched()" style="all:unset;cursor:pointer;flex-shrink:0;background:' + (businessLaunched ? 'transparent' : GOLD) + ';border:1px solid ' + (businessLaunched ? 'rgba(255,85,85,.4)' : GOLD) + ';color:' + (businessLaunched ? 'var(--sw-danger,#ff8888)' : 'var(--sw-on-gold,#241a08)') + ';font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:11px;font-weight:600;letter-spacing:.04em;padding:9px 14px;border-radius:8px;text-align:center">' + (businessLaunched ? 'Revertir' : 'Ya abrimos →') + '</button>'
        + '</div>';
    // Pausa temporal — separada del horario semanal a propósito: esto es "hoy no puedo",
    // no "los martes cerramos". Se reanuda sola.
    var pausaActiva = storePausedUntil && new Date(storePausedUntil).getTime() > Date.now();
    h += '<div style="background:' + (pausaActiva ? 'rgba(255,170,0,.12)' : 'var(--sw-card,#2D5246)') + ';border:1px solid ' + (pausaActiva ? 'rgba(255,170,0,.5)' : 'var(--sw-border,#3A6B58)') + ';border-radius:10px;padding:14px 16px;margin-bottom:18px">'
        + '<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + (pausaActiva ? 'Pedidos en pausa //' : 'Pausa temporal //') + '</div>'
        + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px;margin-bottom:10px">'
        + (pausaActiva ? 'Se reactivan solos a las ' + new Date(storePausedUntil).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) + '. No tienes que hacer nada.' : 'Si te quedaste sin insumos o no puedes atender un rato. Se reabre sola.') + '</div>'
        + (pausaActiva
            ? '<button onclick="pauseStore(0)" style="all:unset;cursor:pointer;display:block;width:100%;box-sizing:border-box;background:' + GOLD + ';color:var(--sw-on-gold,#241a08);font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:11px;border-radius:8px;text-align:center;min-height:44px">Reactivar ahora</button>'
            : '<div style="display:flex;gap:8px">' + [[30, '30 min'], [60, '1 hora'], [180, '3 horas'], [600, 'Resto del día']].map(function (x) {
                return '<button onclick="pauseStore(' + x[0] + ')" style="all:unset;cursor:pointer;flex:1;box-sizing:border-box;background:transparent;border:1px solid var(--sw-border,#3A6B58);color:var(--sw-text-muted,#A8C8B0);font-family:EB Garamond,serif;font-weight:600;font-size:11px;padding:10px 4px;border-radius:8px;text-align:center;min-height:44px">' + x[1] + '</button>';
            }).join('') + '</div>')
        + '</div>';
    var days = storeHoursForm || [];
    h += DOW_NAMES.map(function (name, i) {
        var d = days[i] || { open: 11, close: 22, closed: false };
        return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:10px">'
            + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:' + (d.closed ? '0' : '10px') + '">'
            + '<span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + name + '</span>'
            + '<label style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);display:flex;align-items:center;gap:6px"><input type="checkbox" id="sh-closed-' + i + '" ' + (d.closed ? 'checked' : '') + ' onchange="toggleClosedDay(' + i + ')" style="accent-color:' + GOLD + '">Cerrado</label>'
            + '</div>'
            + (d.closed ? '' : '<div style="display:flex;gap:8px;align-items:center"><input id="sh-open-' + i + '" type="number" min="0" max="24" value="' + (d.open == null ? 11 : d.open) + '" style="flex:1;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:9px 12px;color:var(--sw-text,#FFFFFF);font-family:EB Garamond,serif;font-style:italic;font-size:12px"><span style="color:var(--sw-text-muted,#A8C8B0)">a</span><input id="sh-close-' + i + '" type="number" min="0" max="24" value="' + (d.close == null ? 22 : d.close) + '" style="flex:1;background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:9px 12px;color:var(--sw-text,#FFFFFF);font-family:EB Garamond,serif;font-style:italic;font-size:12px"></div>')
            + '</div>';
    }).join('');
    h += BTN('Guardar horario //', 'saveStoreHours()');
    h += '</div>';
    return h;
}
// REPORTE POR FECHAS (#98) — el dashboard normal solo cubre hoy/semana/mes fijos; esto
// deja elegir cualquier rango libre.
async function doRangeReport() {
    var fromEl = document.getElementById('rr-from'), toEl = document.getElementById('rr-to');
    var from = fromEl ? fromEl.value : '', to = toEl ? toEl.value : '';
    if (!from || !to) {
        reportErr = 'Elige ambas fechas.';
        render();
        return;
    }
    reportFrom = from;
    reportTo = to;
    reportErr = '';
    busy = true;
    busyMsg = 'Generando reporte...';
    render();
    try {
        reportData = await api('admin-range-report', { token: token, from: from, to: to + 'T23:59:59' });
    }
    catch (e) {
        reportData = null;
        reportErr = e.message;
    }
    busy = false;
    render();
}
function sAdminReport() {
    var h = H('REPORTE POR FECHAS', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px">'
        + '<input id="rr-from" type="date" value="' + esc(reportFrom) + '" style="flex:1;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px;color:var(--sw-text,#FFFFFF);font-size:16px">'
        + '<input id="rr-to" type="date" value="' + esc(reportTo) + '" style="flex:1;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px;color:var(--sw-text,#FFFFFF);font-size:16px">'
        + '</div>';
    h += BTN('Generar reporte //', 'doRangeReport()');
    if (reportErr)
        h += '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-danger,#ff8888);margin-top:12px;text-align:center">' + esc(reportErr) + '</div>';
    if (reportData) {
        var d = reportData;
        h += '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:20px 0"></div>';
        h += '<div style="display:flex;gap:10px;margin-bottom:16px">'
            + DTILE('Ingresos', SOLES + pz(d.revenue), d.count + ' pedidos')
            + DTILE('Ticket prom.', SOLES + pz(d.avgTicket))
            + '</div>';
        if (d.truncated)
            h += '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-warn,#ffa500);margin-bottom:12px;display:flex;align-items:center;gap:5px">' + icon('warning', 12, 'var(--sw-warn,#ffa500)') + '<span>Hay más pedidos en este rango de los que se muestran aquí.</span></div>';
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Por método de pago //</div>';
        h += Object.keys(d.byMethod).length ? Object.keys(d.byMethod).map(function (m) { var v = d.byMethod[m]; return DBAR(m.toUpperCase(), v.count, d.count); }).join('') : '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">Sin datos //</div>';
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin:18px 0 10px">Productos top //</div>';
        h += d.topProducts.length ? d.topProducts.map(function (p) { return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1E3932"><span style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">' + esc(p.name) + '</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:' + GOLD + '">' + p.count + ' · ' + SOLES + pz(p.revenue) + '</span></div>'; }).join('') : '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">Sin datos //</div>';
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin:18px 0 10px">Por día //</div>';
        h += d.byDay.length ? d.byDay.map(function (day) { return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1E3932"><span style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">' + esc(day.date) + '</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:' + GOLD + '">' + day.count + ' · ' + SOLES + pz(day.revenue) + '</span></div>'; }).join('') : '';
    }
    h += '</div>';
    return h;
}
// CALIFICACIONES (#99) — antes solo se veían resumidas (promedio + últimos 5 comentarios)
// en el dashboard; esto expone el listado completo con filtros.
async function loadRatingsList() {
    sndScreen = 'admin_ratings';
    busy = true;
    busyMsg = 'Cargando calificaciones...';
    render();
    try {
        var r = await api('admin-ratings-list', { token: token, limit: 50, minStars: ratingsMinStars || undefined, onlyWithComments: ratingsOnlyComments, onlyConsented: ratingsOnlyConsented });
        ratingsList = r.ratings;
    }
    catch (e) {
        ratingsList = [];
    }
    busy = false;
    render();
}
function applyRatingsFilter() {
    var minEl = document.getElementById('rt-min'), cEl = document.getElementById('rt-comments'), tEl = document.getElementById('rt-consented');
    ratingsMinStars = minEl ? Number(minEl.value) : 0;
    ratingsOnlyComments = cEl ? cEl.checked : false;
    ratingsOnlyConsented = tEl ? tEl.checked : false;
    loadRatingsList();
}
function sAdminRatings() {
    var h = H('CALIFICACIONES', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    h += '<div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap">'
        + '<select id="rt-min" onchange="applyRatingsFilter()" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:8px;padding:9px 12px;color:var(--sw-text,#FFFFFF);font-family:EB Garamond,serif;font-style:italic;font-size:11px">'
        + [0, 1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '" ' + (ratingsMinStars === n ? 'selected' : '') + '>' + (n === 0 ? 'Todas' : n + '★ o más') + '</option>'; }).join('')
        + '</select>'
        + '<label style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);display:flex;align-items:center;gap:6px"><input type="checkbox" id="rt-comments" onchange="applyRatingsFilter()" ' + (ratingsOnlyComments ? 'checked' : '') + ' style="accent-color:' + GOLD + '">Solo con comentario</label>'
        + '<label style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);display:flex;align-items:center;gap:6px"><input type="checkbox" id="rt-consented" onchange="applyRatingsFilter()" ' + (ratingsOnlyConsented ? 'checked' : '') + ' style="accent-color:' + GOLD + '">Solo autorizadas como testimonio</label>'
        + '</div>';
    var list = ratingsList || [];
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">' + list.length + ' calificaciones //</div>';
    h += list.length ? list.map(function (r) {
        return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px;margin-bottom:10px">'
            + '<div style="display:flex;justify-content:space-between"><span style="color:#F5C518;font-size:14px">' + '★'.repeat(r.stars) + '<span style="color:#3A6B58">' + '★'.repeat(5 - r.stars) + '</span></span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0)">' + esc(r.order_ref || '') + '</span></div>'
            + (r.comment ? '<div style="font-family:EB Garamond,serif;font-size:13px;color:var(--sw-text-body,#F2F0EB);margin-top:6px">' + esc(r.comment) + '</div>' : '')
            + (r.testimonial_consent ? '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-ok,#25D366);margin-top:6px;display:flex;align-items:center;gap:5px">' + icon('check', 11, 'var(--sw-ok,#25D366)') + '<span>Autorizada como testimonio público</span></div>' : '')
            // Antes no mostraba quién dejó la reseña — para agradecer o dar seguimiento el
            // dueño tenía que cruzarla a mano contra BUSCAR PEDIDOS por el ref (hallazgo de
            // auditoría de diseño admin, MEDIO). customer_phone puede venir null si la cuenta
            // ya se borró (anonimización, ver actDeleteAccount) — se omite en ese caso.
            + (r.customer_phone ? '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:' + GOLD + ';margin-top:6px">' + esc(r.customer_phone) + '</div>' : '')
            + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px">' + esc(new Date(r.created_at).toLocaleDateString('es-PE')) + '</div>'
            + '</div>';
    }).join('') : '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);text-align:center;padding:20px 0">Sin calificaciones //</div>';
    h += '</div>';
    return h;
}
// PREPARACIÓN ANTICIPADA — agrega los ingredientes de todos los pedidos programados de
// las próximas 24h en un solo resumen, para que la cocina prepare antes de que entren
// en cola (antes cada pedido programado se preparaba recién cuando llegaba su hora).
async function loadPrepList() {
    sndScreen = 'admin_prep';
    busy = true;
    busyMsg = 'Calculando preparación...';
    render();
    try {
        prepListData = await api('admin-prep-list', { token: token });
    }
    catch (e) {
        prepListData = null;
    }
    busy = false;
    render();
}
function sAdminPrepList() {
    var h = H('PREPARACIÓN', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (!prepListData) {
        return h + '<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-danger,#ff8888);letter-spacing:.2em">No se pudo cargar //</div></div>' + BTN('Reintentar //', 'loadPrepList()') + '</div>';
    }
    var d = prepListData;
    var shortfalls = d.ingredients.filter(function (i) { return i.shortfall; });
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.1em;margin-bottom:16px">Próximas ' + d.windowHours + 'h · ' + d.orders.length + ' pedido' + (d.orders.length === 1 ? '' : 's') + ' programado' + (d.orders.length === 1 ? '' : 's') + '</div>';
    if (shortfalls.length) {
        h += '<div style="background:rgba(255,85,85,.12);border:1px solid rgba(255,85,85,.35);border-radius:10px;padding:14px 16px;margin-bottom:16px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-danger,#ff8888);letter-spacing:.1em;margin-bottom:6px;display:flex;align-items:center;gap:5px">' + icon('warning', 12, 'var(--sw-danger,#ff8888)') + '<span>No va a alcanzar //</span></div>'
            + shortfalls.map(function (i) { return '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);margin-bottom:4px">' + esc(i.label) + ' — necesitas ' + i.qty + (i.stockQty != null ? ', tienes ' + i.stockQty : ', sin stock') + '</div>'; }).join('')
            + '</div>';
    }
    // #10 — MISE EN PLACE, agrupado por dónde está cada cosa. Antes esto era una lista plana
    // de 15 líneas ordenada por faltante: correcta para LEER, inservible para trabajar, porque
    // obliga a volver a la refri una vez por línea. Los grupos los arma el servidor
    // (miseEnPlaceGroups) desde la MISMA lista que ya se usaba — no es otra consulta, así que
    // no puede decir algo distinto que el bloque de faltantes de arriba.
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Mise en place //</div>';
    var grupos = d.miseEnPlace || [];
    if (!grupos.length && d.ingredients.length) {
        // Respaldo por si el servidor todavía no manda los grupos (deploy a medias): mostrar la
        // lista plana es peor que la agrupada, pero infinitamente mejor que una pantalla vacía.
        grupos = [{ key: 'todos', label: 'Ingredientes', items: d.ingredients }];
    }
    h += grupos.length ? grupos.map(function (g) {
        return '<div style="margin-bottom:14px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.15em;margin-bottom:6px">' + esc(g.label).toUpperCase() + '</div>'
            + g.items.map(function (i) {
                return '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border:1px solid ' + (i.shortfall ? 'rgba(255,85,85,.4)' : '#3A6B58') + ';border-radius:8px;padding:10px 14px;margin-bottom:6px"><span style="font-family:EB Garamond,serif;font-size:13px;color:var(--sw-text-body,#F2F0EB)">' + esc(i.label) + '</span><span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:' + (i.shortfall ? 'var(--sw-danger,#ff8888)' : GOLD) + '">×' + i.qty + '</span></div>';
            }).join('') + '</div>';
    }).join('') : '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px">Sin pedidos programados en esta ventana.</div>';
    // #12 — ORDEN DE ARMADO. Antes esta lista solo decía a qué hora ENTREGA cada pedido, que
    // es el dato que no sirve: lo que hay que saber es a qué hora EMPEZAR. Con una sola
    // persona armando, los tiempos se acumulan, así que tres pedidos para las 8pm no se
    // empiezan todos a las 7:55.
    if (d.orders.length) {
        h += '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:18px 0"></div>';
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:4px">Orden de armado //</div>';
        h += '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:10px;line-height:1.5">Calculado hacia atrás desde cada hora de entrega, contando ' + (d.minutesPerOrder || 5) + ' min por sándwich y que los armas uno tras otro.</div>';
        var plan = (d.assembly && d.assembly.length) ? d.assembly : d.orders.map(function (o) { return { ref: o.ref, customerName: o.customerName, deliveryTime: o.deliveryTime, startBy: null, late: false }; });
        h += plan.map(function (o) {
            var hora = function (t) { return t ? new Date(t).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '—'; };
            return '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border:1px solid ' + (o.late ? 'rgba(255,85,85,.45)' : '#3A6B58') + ';border-radius:8px;padding:10px 14px;margin-bottom:6px">'
                + '<div style="min-width:0"><div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(o.ref) + ' · ' + esc(o.customerName) + '</div>'
                + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">Entrega ' + esc(hora(o.deliveryTime)) + (o.late ? ' · ya vas tarde' : '') + '</div></div>'
                + '<div style="text-align:right;flex:0 0 auto;margin-left:10px"><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:17px;font-weight:640;color:' + (o.late ? 'var(--sw-danger,#ff8888)' : GOLD) + '">' + esc(hora(o.startBy)) + '</div>'
                + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.12em">EMPIEZA</div></div></div>';
        }).join('');
    }
    h += BTN('Actualizar //', 'loadPrepList()', true);
    h += '</div>';
    return h;
}
// MARKETING — contenido listo para copiar y pegar, uno distinto cada semana (ver
// MARKETING_CONTENT en el backend). No publica nada solo: ninguna red social está
// conectada a este sistema, así que el dueño sigue siendo quien pega y publica —
// esto solo le ahorra la parte de redactar cada semana.
async function loadMarketingContent() {
    sndScreen = 'admin_marketing';
    busy = true;
    busyMsg = 'Cargando contenido...';
    render();
    try {
        marketingContentData = await api('admin-marketing-content', { token: token });
    }
    catch (e) {
        marketingContentData = null;
    }
    busy = false;
    render();
}
function copyMktText(week, field) {
    var d = marketingContentData;
    if (!d)
        return;
    var text = (week === 'current' ? d.current : d.next)[field];
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { showToast('Copiado ✓', 'info'); });
    }
}
function mktBlock(pkg, week) {
    return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:16px;margin-bottom:14px">'
        + '<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:16px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:12px">' + esc(pkg.theme) + '</div>'
        + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:' + GOLD + ';letter-spacing:.15em;margin-bottom:4px">WhatsApp / historia //</div>'
        + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-bottom:6px">' + esc(pkg.whatsapp) + '</div>'
        + '<button onclick="copyMktText(\'' + week + '\',\'whatsapp\')" style="all:unset;cursor:pointer;background:' + GOLD + ';color:var(--sw-on-gold,#241a08);font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:10px;font-weight:600;padding:7px 12px;border-radius:6px;margin-bottom:14px;display:inline-block">Copiar</button>'
        + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:' + GOLD + ';letter-spacing:.15em;margin-bottom:4px">Caption (Instagram/Facebook) //</div>'
        + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-bottom:6px">' + esc(pkg.caption) + '</div>'
        + '<button onclick="copyMktText(\'' + week + '\',\'caption\')" style="all:unset;cursor:pointer;background:' + GOLD + ';color:var(--sw-on-gold,#241a08);font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:10px;font-weight:600;padding:7px 12px;border-radius:6px;margin-bottom:14px;display:inline-block">Copiar</button>'
        + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:' + GOLD + ';letter-spacing:.15em;margin-bottom:4px">Guion de video //</div>'
        + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.5;margin-bottom:6px;white-space:pre-wrap">' + esc(pkg.videoIdea || '') + '</div>'
        + '<button onclick="copyMktText(\'' + week + '\',\'videoIdea\')" style="all:unset;cursor:pointer;background:' + GOLD + ';color:var(--sw-on-gold,#241a08);font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:10px;font-weight:600;padding:7px 12px;border-radius:6px;margin-bottom:14px;display:inline-block">Copiar</button>'
        + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:' + GOLD + ';letter-spacing:.15em;margin-bottom:4px">Idea de foto //</div>'
        + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5">' + esc(pkg.photoIdea) + '</div>'
        + '</div>';
}
function sAdminMarketing() {
    var h = H('MARKETING', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    var d = marketingContentData;
    if (!d)
        return h + '<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-danger,#ff8888);letter-spacing:.2em">No se pudo cargar //</div></div>' + BTN('Reintentar //', 'loadMarketingContent()') + '</div>';
    h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px;line-height:1.5">Contenido listo para copiar y pegar — cambia cada semana. Nada se publica solo, tú decides cuándo y dónde.</div>';
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Esta semana //</div>';
    h += mktBlock(d.current, 'current');
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.2em;margin-bottom:8px">Próxima semana //</div>';
    h += mktBlock(d.next, 'next');
    h += '</div>';
    return h;
}
async function loadPromoCodes() {
    sndScreen = 'admin_promo';
    busy = true;
    busyMsg = 'Cargando códigos...';
    render();
    try {
        var res = await api('admin-promo-list', { token: token });
        promoCodesData = res.promoCodes;
    }
    catch (e) {
        promoCodesData = null;
    }
    busy = false;
    render();
}
function setPcType(t) { pcType = t; render(); }
async function createPromoCode() {
    var code = gv('pc-code').trim();
    var value = gv('pc-value').trim();
    var maxUses = gv('pc-maxuses').trim();
    var minOrder = gv('pc-minorder').trim();
    var validUntil = gv('pc-validuntil').trim();
    var campaignTag = gv('pc-tag').trim();
    if (!code || !value) {
        pcMsg = 'Completa código y valor.';
        render();
        return;
    }
    pcMsg = 'Creando...';
    render();
    try {
        await api('admin-promo-create', { token: token, code: code, discountType: pcType, value: Number(value), maxUses: maxUses || null, minOrderTotal: minOrder || null, validUntil: validUntil ? new Date(validUntil).toISOString() : null, campaignTag: campaignTag || null });
        pcMsg = '';
        pcCode = '';
        pcValue = '';
        pcMaxUses = '';
        pcMinOrder = '';
        pcValidUntil = '';
        pcCampaignTag = '';
        await loadPromoCodes();
    }
    catch (e) {
        pcMsg = e.message || 'No se pudo crear el código.';
        render();
    }
}
async function togglePromoCode(id, active) {
    try {
        await api('admin-promo-toggle', { token: token, id: id, active: active });
        await loadPromoCodes();
    }
    catch (e) {
        showToast(e.message || 'No se pudo actualizar.');
    }
}
function sAdminPromo() {
    var h = H('CÓDIGOS PROMO', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px;line-height:1.5">El descuento se aplica solo sobre el total de comida (nunca sobre delivery), mismo criterio que las recompensas — y solo funciona con tarjeta o crédito, no con Yape/Plin hasta confirmar el pago.</div>';
    h += '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:16px;margin-bottom:20px">';
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Nuevo código //</div>';
    h += '<div style="display:flex;flex-direction:column;gap:8px">'
        + INP('pc-code', 'Código // ej. LANZAMIENTO10', 'text', pcCode)
        + '<div style="display:flex;gap:8px"><div onclick="setPcType(\'percent\')" style="flex:1;text-align:center;background:' + (pcType === 'percent' ? 'var(--sw-card2,#1A3028)' : 'transparent') + ';border:1px solid ' + (pcType === 'percent' ? GOLD : '#3A6B58') + ';border-radius:8px;padding:10px;cursor:pointer;font-family:EB Garamond,serif;font-size:12px;color:' + (pcType === 'percent' ? GOLD : '#A8C8B0') + '">% Porcentaje</div><div onclick="setPcType(\'fixed\')" style="flex:1;text-align:center;background:' + (pcType === 'fixed' ? 'var(--sw-card2,#1A3028)' : 'transparent') + ';border:1px solid ' + (pcType === 'fixed' ? GOLD : '#3A6B58') + ';border-radius:8px;padding:10px;cursor:pointer;font-family:EB Garamond,serif;font-size:12px;color:' + (pcType === 'fixed' ? GOLD : '#A8C8B0') + '">S/ Monto fijo</div></div>'
        + INP('pc-value', pcType === 'percent' ? 'Valor // ej. 10 (%)' : 'Valor // ej. 5 (soles)', 'number', pcValue)
        + INP('pc-maxuses', 'Usos máximos // opcional', 'number', pcMaxUses)
        + INP('pc-minorder', 'Pedido mínimo // opcional, en soles', 'number', pcMinOrder)
        + INP('pc-validuntil', 'Válido hasta // opcional', 'date', pcValidUntil)
        + INP('pc-tag', 'Etiqueta de campaña // opcional, para tu referencia', 'text', pcCampaignTag)
        + '</div>';
    h += (pcMsg ? '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-danger,#ff8888);margin-top:8px">' + esc(pcMsg) + '</div>' : '');
    h += '<div style="margin-top:12px">' + BTN('Crear código //', 'createPromoCode()') + '</div>';
    h += '</div>';
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Códigos existentes //</div>';
    if (!promoCodesData || !promoCodesData.length) {
        h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">Sin códigos creados todavía.</div>';
    }
    else {
        h += promoCodesData.map(function (p) {
            var valueLabel = p.discount_type === 'percent' ? p.value + '%' : SOLES_TXT + pz(p.value);
            var usesLabel = (p.uses_count || 0) + (p.max_uses != null ? '/' + p.max_uses : '') + ' usos';
            return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px 14px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div style="min-width:0"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + esc(p.code) + '</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">' + esc(valueLabel + ' · ' + usesLabel + (p.campaign_tag ? ' · ' + p.campaign_tag : '')) + '</div></div><div onclick="togglePromoCode(\'' + p.id + '\',' + (!p.active) + ')" style="flex-shrink:0;cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:' + (p.active ? 'var(--sw-ok,#25D366)' : 'var(--sw-danger,#ff8888)') + '">' + (p.active ? 'Activo' : 'Inactivo') + '</div></div></div>';
        }).join('');
    }
    h += '</div>';
    return h;
}
async function loadCampaignPerformance() {
    sndScreen = 'admin_campaign_perf';
    busy = true;
    busyMsg = 'Calculando rendimiento...';
    render();
    try {
        campaignPerfData = await api('admin-campaign-performance', { token: token });
    }
    catch (e) {
        campaignPerfData = null;
    }
    busy = false;
    render();
}
function sAdminCampaignPerf() {
    var h = H('RENDIMIENTO CAMPAÑAS', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (!campaignPerfData)
        return h + '<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-danger,#ff8888);letter-spacing:.2em">No se pudo cargar //</div></div>' + BTN('Reintentar //', 'loadCampaignPerformance()') + '</div>';
    var d = campaignPerfData;
    h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px;line-height:1.5">Últimos ' + d.lookbackDays + ' días · convertido = pagó dentro de ' + d.windowDays + ' días de recibir el aviso.</div>';
    if (!d.campaigns.length) {
        h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">Sin envíos registrados en este período.</div>';
    }
    else {
        h += d.campaigns.map(function (c) {
            return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px 14px;margin-bottom:8px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF);margin-bottom:4px">' + esc(c.campaignType) + '</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">' + c.touches + ' envíos · ' + c.customersReached + ' clientes · <span style="color:' + GOLD + '">' + c.conversionRate + '% convirtió</span> · ' + SOLES_TXT + pz(c.revenue) + ' en ingresos</div></div>';
        }).join('');
    }
    h += '</div>';
    return h;
}
// Calendario de contenido real (marketing_calendar) — reemplaza depender solo del
// "Contenido semanal" rotativo (sAdminMarketing, arriba) para saber qué publicar hoy: acá
// el dueño planea fechas concretas, por canal, y lleva registro de qué ya publicó de
// verdad. Nada de esto publica solo — sigue siendo copiar/pegar a mano (mismo límite del
// resto del sistema de marketing: no hay conector real a Instagram/TikTok/Meta).
var CAL_CHANNELS = [['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['whatsapp', 'WhatsApp'], ['facebook', 'Facebook'], ['google_business', 'Google Business'], ['otro', 'Otro']];
var CAL_CHANNEL_LABEL = {};
CAL_CHANNELS.forEach(function (c) { CAL_CHANNEL_LABEL[c[0]] = c[1]; });
// 'publishing' es transitorio (segundos, hasta ~2min si es video) — lo pone
// claimCalendarEntry() en el servidor mientras el cron o "Publicar ahora" están a mitad
// de publicar, para que el otro camino no la duplique (auditoría de código, ALTO).
var CAL_STATUS_LABEL = { draft: 'Borrador', scheduled: 'Programado', publishing: 'Publicando...', posted: 'Publicado' };
var CAL_STATUS_COLOR = { draft: '#A8C8B0', scheduled: GOLD, publishing: GOLD, posted: 'var(--sw-ok,#25D366)' };
// #50 — Deja escritas las próximas semanas del calendario en un toque.
//
// Hasta acá el cron ya las va dejando solo cada semana; este botón existe para el arranque
// (la tabla vacía el día 1) y para cuando el dueño quiere ver el mes entero de una. El
// servidor NUNCA pisa una fecha que ya tiene entrada, así que tocarlo dos veces no duplica
// nada y no borra lo que él haya planeado a mano.
async function generateCalendar() {
    busy = true;
    busyMsg = 'Generando borradores...';
    render();
    try {
        var res = await api('admin-calendar-generate', { token: token, weeks: 4 });
        await loadCalendar();
        showToast(res.creados ? ('Listo: ' + res.creados + ' borrador' + (res.creados === 1 ? '' : 'es') + ' nuevo' + (res.creados === 1 ? '' : 's') + '.') : 'Las próximas 4 semanas ya estaban planeadas.');
    }
    catch (e) {
        busy = false;
        render();
        showToast("No se pudo generar: " + e.message);
    }
}
async function loadCalendar() {
    sndScreen = 'admin_calendar';
    busy = true;
    busyMsg = 'Cargando calendario...';
    render();
    try {
        var res = await api('admin-calendar-list', { token: token });
        calendarData = res.entries;
    }
    catch (e) {
        calendarData = null;
    }
    try {
        var ru = await api('admin-list-raw-uploads', { token: token });
        rawUploads = ru.uploads;
    }
    catch (e) {
        rawUploads = null;
    }
    busy = false;
    render();
}
// 20MB de tope (mismo límite que el backend, ver actAdminUploadRawVideo en social.ts) —
// a diferencia de handleCalendarImageFile, no hay compresión posible del lado del
// cliente para video, así que el clip ya debe llegar razonablemente liviano; si pesa de
// más, el mensaje de error pide comprimirlo antes en vez de fallar en silencio.
function handleRawVideoFile(ev) {
    var input = ev && ev.target;
    var file = input && input.files && input.files[0];
    if (input)
        input.value = '';
    if (!file)
        return;
    if (!/^video\/(mp4|quicktime)$/.test(file.type)) {
        showToast('Selecciona un video MP4 o MOV.');
        return;
    }
    if (file.size > 20 * 1024 * 1024) {
        showToast('El video pesa más de 20MB — comprímelo antes de subirlo.');
        return;
    }
    rawVideoUploading = true;
    render();
    var reader = new FileReader();
    reader.onload = async function () {
        var base64 = String(reader.result || '').split(',')[1] || '';
        try {
            await api('admin-upload-raw-video', { token: token, videoBase64: base64, mime: file.type });
            showToast('Clip subido — se procesa en la próxima sesión semanal.', 'success');
            await loadCalendar();
        }
        catch (e) {
            showToast(e.message || 'No se pudo subir el video.');
        }
        rawVideoUploading = false;
        render();
    };
    reader.onerror = function () { rawVideoUploading = false; showToast('No se pudo leer el archivo.'); render(); };
    reader.readAsDataURL(file);
}
function setCalChannel(c) { calChannel = c; render(); }
async function createCalendarEntry() {
    var date = gv('cal-date').trim();
    var title = gv('cal-title').trim();
    var caption = gv('cal-caption').trim();
    var whatsapp = gv('cal-whatsapp').trim();
    var photo = gv('cal-photo').trim();
    var tag = gv('cal-tag').trim();
    if (!date || !title) {
        calMsg = 'Completa fecha y tema.';
        render();
        return;
    }
    calMsg = 'Creando...';
    render();
    try {
        await api('admin-calendar-create', { token: token, scheduledDate: date, channel: calChannel, title: title, captionText: caption || null, whatsappText: whatsapp || null, photoIdea: photo || null, campaignTag: tag || null });
        calMsg = '';
        calDate = '';
        calTitle = '';
        calCaption = '';
        calWhatsapp = '';
        calPhoto = '';
        calTag = '';
        await loadCalendar();
    }
    catch (e) {
        calMsg = e.message || 'No se pudo crear.';
        render();
    }
}
async function setCalendarStatus(id, status) {
    try {
        await api('admin-calendar-update', { token: token, id: id, status: status });
        await loadCalendar();
    }
    catch (e) {
        showToast(e.message || 'No se pudo actualizar.');
    }
}
async function deleteCalendarEntry(id) {
    if (!(await showConfirm('¿Eliminar esta entrada del calendario?')))
        return;
    try {
        await api('admin-calendar-delete', { token: token, id: id });
        await loadCalendar();
    }
    catch (e) {
        showToast(e.message || 'No se pudo eliminar.');
    }
}
// Publicación real en Instagram/Facebook (Meta Graph API) — ver actAdminPublishSocial en
// social.ts. La foto se comprime en el propio celular antes de subirla, mismo criterio
// que handleReceiptFile (canvas, máx. 1080px de lado, JPEG) — la API de Instagram exige
// una URL pública de imagen ya alojada, así que primero sube a Storage y recién después
// se puede publicar.
function handleCalendarImageFile(ev, id) {
    var input = ev && ev.target;
    var file = input && input.files && input.files[0];
    if (input)
        input.value = '';
    if (!file)
        return;
    if (!/^image\//.test(file.type)) {
        showToast('Selecciona una imagen.');
        return;
    }
    calImageUploadingId = id;
    render();
    var reader = new FileReader();
    reader.onload = function () {
        var img = new Image();
        img.onload = function () {
            var maxDim = 1080;
            var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            var w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
            var canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d');
            if (!ctx) {
                calImageUploadingId = null;
                showToast('No se pudo procesar la imagen.');
                render();
                return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            var base64 = canvas.toDataURL('image/jpeg', .82).split(',')[1] || '';
            uploadCalendarImageBase64(id, base64);
        };
        img.onerror = function () { calImageUploadingId = null; showToast('No se pudo leer la imagen.'); render(); };
        img.src = String(reader.result || '');
    };
    reader.onerror = function () { calImageUploadingId = null; showToast('No se pudo leer el archivo.'); render(); };
    reader.readAsDataURL(file);
}
async function uploadCalendarImageBase64(id, base64) {
    try {
        await api('admin-calendar-upload-image', { token: token, id: id, imageBase64: base64, mime: 'image/jpeg' });
        calImageUploadingId = null;
        await loadCalendar();
    }
    catch (e) {
        calImageUploadingId = null;
        showToast(e.message || 'No se pudo subir la imagen.');
        render();
    }
}
async function publishCalendarEntry(id) {
    if (!(await showConfirm('¿Publicar esta entrada ahora en Instagram/Facebook? Esto sale de verdad a la cuenta real — no hay forma de deshacerlo desde acá.')))
        return;
    calPublishingId = id;
    render();
    try {
        await api('admin-publish-social', { token: token, id: id });
        calPublishingId = null;
        showToast('Publicado en Meta.', 'success');
        await loadCalendar();
    }
    catch (e) {
        calPublishingId = null;
        showToast(e.message || 'No se pudo publicar.');
        render();
    }
}
function sAdminCalendar() {
    var h = H('CALENDARIO DE CONTENIDO', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px;line-height:1.5">Planea fechas y canales reales. Instagram y Facebook sí se pueden publicar de verdad desde acá (sube una foto/video y toca "Publicar ahora", o déjalo programado y sale solo el día que le toca) — el resto de canales sigue siendo copiar el texto a mano.</div>';
    // El botón va ARRIBA del formulario manual a propósito: crear una entrada a mano es el
    // camino largo, y hasta #50 era el único que había.
    h += '<div style="margin-bottom:20px"><button onclick="generateCalendar()" style="all:unset;cursor:pointer;display:block;width:100%;background:' + GOLD + ';color:var(--sw-on-gold,#241a08);font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:13px;font-weight:600;letter-spacing:.06em;padding:12px;border-radius:8px;text-align:center">Generar las próximas 4 semanas //</button><div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px;line-height:1.5">Deja los borradores escritos (caption, texto de WhatsApp e idea de foto) en las fechas que todavía estén libres. No toca ninguna entrada que ya exista.</div></div>';
    h += '<div style="background:var(--sw-card,#2D5246);border:1px solid ' + GOLD + ';border-radius:10px;padding:16px;margin-bottom:20px">';
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:6px">Clips de la semana //</div>';
    // Copy corregida (auditoría UX, P2): antes prometía "sin que tengas que volver a tocar
    // nada" — pero el procesamiento real depende de una sesión de Claude que se dispara a
    // mano (no hay cron para esto, ver actAdminUploadRawVideo en social.ts), así que decir
    // "automático" era engañoso. Ahora nombra la cadencia real (semanal) sin prometer más
    // de lo que existe hoy.
    h += '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:10px;line-height:1.5">Sube aquí el video crudo (sin editar) de lo que grabaste — se procesa en la próxima sesión semanal de contenido (la disparas tú por chat cuando tengas clips listos), que lo recorta al formato correcto, escribe el caption y lo agenda.</div>';
    h += '<label style="cursor:pointer;display:inline-block;background:' + (rawVideoUploading ? '#1E3932' : GOLD) + ';color:' + (rawVideoUploading ? '#4A7A68' : 'var(--sw-on-gold,#241a08)') + ';font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:10px 16px;border-radius:8px">'
        + (rawVideoUploading ? 'Subiendo...' : '+ Subir clip (MP4/MOV) →')
        + '<input type="file" accept="video/mp4,video/quicktime" onchange="handleRawVideoFile(event)" style="display:none" ' + (rawVideoUploading ? 'disabled' : '') + '>'
        + '</label>';
    if (rawUploads && rawUploads.length) {
        // Muestra la fecha del clip más antiguo pendiente — sin esto no había forma de
        // distinguir "recién subido, normal" de "lleva 3 semanas esperando, algo se
        // atascó" (auditoría UX, P2).
        var oldestUpload = rawUploads.reduce(function (a, b) { return new Date(a.uploaded_at) < new Date(b.uploaded_at) ? a : b; });
        var oldestDate = new Date(oldestUpload.uploaded_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
        h += '<div style="margin-top:10px;font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">' + rawUploads.length + ' clip' + (rawUploads.length === 1 ? '' : 's') + ' esperando — el más antiguo desde el ' + oldestDate + '.</div>';
    }
    h += '</div>';
    h += '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:16px;margin-bottom:20px">';
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Nueva entrada //</div>';
    h += '<div style="display:flex;flex-direction:column;gap:8px">'
        + INP('cal-date', 'Fecha', 'date', calDate)
        + INP('cal-title', 'Tema // ej. Sándwich secreto del mes', 'text', calTitle)
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' + CAL_CHANNELS.map(function (c) { return '<div onclick="setCalChannel(\'' + c[0] + '\')" style="text-align:center;background:' + (calChannel === c[0] ? 'var(--sw-card2,#1A3028)' : 'transparent') + ';border:1px solid ' + (calChannel === c[0] ? GOLD : '#3A6B58') + ';border-radius:8px;padding:8px;cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:' + (calChannel === c[0] ? GOLD : '#A8C8B0') + '">' + c[1] + '</div>'; }).join('') + '</div>'
        + INP('cal-caption', 'Texto para el post // opcional', 'text', calCaption)
        + INP('cal-whatsapp', 'Texto para difusión WhatsApp // opcional', 'text', calWhatsapp)
        + INP('cal-photo', 'Idea de foto // opcional', 'text', calPhoto)
        + INP('cal-tag', 'Etiqueta de campaña // opcional', 'text', calTag)
        + '</div>';
    h += (calMsg ? '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-danger,#ff8888);margin-top:8px">' + esc(calMsg) + '</div>' : '');
    h += '<div style="margin-top:12px">' + BTN('Agregar al calendario //', 'createCalendarEntry()') + '</div>';
    h += '</div>';
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Entradas //</div>';
    if (!calendarData || !calendarData.length) {
        h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">Sin entradas planeadas todavía.</div>';
    }
    else {
        h += calendarData.map(function (e) {
            var next = e.status === 'draft' ? 'scheduled' : (e.status === 'scheduled' ? 'posted' : null);
            var nextLabel = e.status === 'draft' ? 'Programar' : (e.status === 'scheduled' ? 'Marcar publicado' : null);
            // El guion va ANTES de la idea de foto: es lo que hay que grabar y lo que la pauta
            // consume, y en una lista larga lo primero es lo que se lee.
            var texts = [e.caption_text ? 'Post: ' + e.caption_text : '', e.whatsapp_text ? 'WhatsApp: ' + e.whatsapp_text : '', e.video_idea ? 'Video: ' + e.video_idea : '', e.photo_idea ? 'Foto: ' + e.photo_idea : ''].filter(Boolean);
            // Publicar de verdad (Meta Graph API) solo tiene sentido para instagram/facebook, y
            // solo una vez que la entrada tiene una foto real subida — el resto de canales
            // (whatsapp/google_business/otro) siguen siendo copiar/pegar a mano, igual que
            // siempre.
            var canAutoPublish = (e.channel === 'instagram' || e.channel === 'facebook');
            var uploadingThis = calImageUploadingId === e.id;
            var publishingThis = calPublishingId === e.id;
            // media_type='video' llega solo de la sesión de procesamiento semanal (nunca de
            // este panel a mano) — acá solo se muestra un indicador, sin input para subirlo,
            // porque el clip crudo se sube aparte en "Clips de la semana //" arriba.
            var isVideoEntry = e.media_type === 'video';
            var hasMedia = isVideoEntry ? !!e.video_url : !!e.image_url;
            var photoBlock = canAutoPublish ? ('<div style="margin-top:10px;display:flex;align-items:center;gap:10px">'
                + (isVideoEntry
                    ? (e.video_url ? '<div style="width:44px;height:44px;border-radius:6px;flex-shrink:0;border:1px solid ' + GOLD + ';display:flex;align-items:center;justify-content:center;font-family:EB Garamond,serif;font-size:8px;color:' + GOLD + '">VIDEO</div>' : '')
                    : (e.image_url ? '<img src="' + esc(e.image_url) + '" alt="Vista previa de la publicación programada" style="width:44px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0;border:1px solid var(--sw-border-soft,#1c1c1c)">' : ''))
                + (isVideoEntry ? '' :
                    '<label style="cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:' + GOLD + '">'
                        + (uploadingThis ? 'Subiendo...' : (e.image_url ? 'Cambiar foto' : 'Subir foto'))
                        + '<input type="file" accept="image/*" onchange="handleCalendarImageFile(event,\'' + e.id + '\')" style="display:none" ' + (uploadingThis ? 'disabled' : '') + '>'
                        + '</label>')
                + (hasMedia && e.status !== 'posted' && e.status !== 'publishing' ? '<span onclick="' + (publishingThis ? '' : 'publishCalendarEntry(\'' + e.id + '\')') + '" style="cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:var(--sw-ok,#25D366)">' + (publishingThis ? 'Publicando...' : 'Publicar ahora →') + '</span>' : '')
                + (e.status === 'publishing' ? '<span style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:' + GOLD + '">Publicando ahora mismo (cron o admin) — espera un momento</span>' : '')
                + (e.status === 'scheduled' && hasMedia ? '<span style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">Programado — sale solo</span>' : '')
                + (e.status === 'posted' && e.published_ref ? '<span style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-ok,#25D366)">✓ Publicado en Meta</span>' : '')
                + '</div>') : '';
            return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px 14px;margin-bottom:8px">'
                + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">'
                + '<div style="min-width:0"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + esc(e.title) + '</div>'
                + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">' + esc(e.scheduled_date + ' · ' + (CAL_CHANNEL_LABEL[e.channel] || e.channel) + (e.campaign_tag ? ' · ' + e.campaign_tag : '')) + '</div></div>'
                + '<div style="flex-shrink:0;text-align:right"><span style="font-family:EB Garamond,serif;font-size:11px;color:' + CAL_STATUS_COLOR[e.status] + '">' + CAL_STATUS_LABEL[e.status] + '</span></div>'
                + '</div>'
                + (texts.length ? '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:8px;line-height:1.5;white-space:pre-wrap">' + esc(texts.join(' · ')) + '</div>' : '')
                + photoBlock
                + '<div style="display:flex;gap:14px;margin-top:10px">'
                + (next ? '<span onclick="setCalendarStatus(\'' + e.id + '\',\'' + next + '\')" style="cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:' + GOLD + '">' + nextLabel + '</span>' : '')
                + '<span onclick="deleteCalendarEntry(\'' + e.id + '\')" style="cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:var(--sw-danger,#ff8888)">Eliminar</span>'
                + '</div></div>';
        }).join('');
    }
    h += '</div>';
    return h;
}
// Lista de espera pre-lanzamiento (waitlist_signups) — ver actWaitlistJoin (público, sin
// sesión) para el lado del cliente. El negocio aún no abre, así que hoy esta es la única
// forma de captación real que existe (checklist de lanzamiento, semana 5-6).
async function loadWaitlist() {
    sndScreen = 'admin_waitlist';
    busy = true;
    busyMsg = 'Cargando lista de espera...';
    render();
    try {
        var res = await api('admin-waitlist-list', { token: token });
        waitlistData = res.waitlist;
    }
    catch (e) {
        waitlistData = null;
    }
    busy = false;
    render();
}
function sAdminWaitlist() {
    var h = H('LISTA DE ESPERA', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px;line-height:1.5">Gente que quiere que le avisemos apenas abramos — captada desde la app sin necesitar cuenta.</div>';
    if (waitlistData && waitlistData.length) {
        h += '<div style="margin-bottom:16px">' + BTN('Exportar lista (CSV) //', 'exportCsv(\'admin-waitlist-list\',\'lista-espera\')', true) + '</div>';
    }
    if (!waitlistData || !waitlistData.length) {
        h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)">Todavía nadie se anotó.</div>';
    }
    else {
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">' + waitlistData.length + ' anotados //</div>';
        h += waitlistData.map(function (w) {
            return '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:12px 14px;margin-bottom:8px"><div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + esc(w.name || w.phone) + '</div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">' + esc(w.phone + (w.source ? ' · ' + w.source : '')) + '</div></div>';
        }).join('');
    }
    h += '</div>';
    return h;
}
// FRANJAS HORARIAS — no hay turnos de cocina distintos (una sola persona atiende), así
// que esto no mide personal: agrupa pedidos por hora del día para ver si hay una franja
// con más cancelaciones o entregas más lentas que el resto.
async function loadTimeWindowReport() {
    sndScreen = 'admin_time_report';
    busy = true;
    busyMsg = 'Calculando franjas horarias...';
    render();
    try {
        timeReportData = await api('admin-time-window-report', { token: token });
    }
    catch (e) {
        timeReportData = null;
    }
    busy = false;
    render();
}
function sAdminTimeReport() {
    var h = H('FRANJAS HORARIAS', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (!timeReportData) {
        return h + '<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-danger,#ff8888);letter-spacing:.2em">No se pudo cargar //</div></div>' + BTN('Reintentar //', 'loadTimeWindowReport()') + '</div>';
    }
    var d = timeReportData;
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.1em;margin-bottom:16px">Últimos ' + d.windowDays + ' días · ordenado por % de cancelación</div>';
    h += d.hours.length ? d.hours.map(function (hr) {
        var urgent = hr.cancelRatePct >= 20;
        return '<div style="background:var(--sw-card,#2D5246);border:1px solid ' + (urgent ? 'rgba(255,85,85,.4)' : '#3A6B58') + ';border-radius:10px;padding:12px 14px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + String(hr.hour).padStart(2, '0') + ':00–' + String((hr.hour + 1) % 24).padStart(2, '0') + ':00</span><span style="font-family:EB Garamond,serif;font-style:italic;font-size:13px;color:' + (urgent ? 'var(--sw-danger,#ff8888)' : GOLD) + '">' + hr.cancelRatePct + '% cancelado</span></div><div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">' + hr.total + ' pedido' + (hr.total === 1 ? '' : 's') + ' · ' + hr.cancelled + ' cancelado' + (hr.cancelled === 1 ? '' : 's') + (hr.avgDeliveryMin != null ? ' · entrega prom. ' + hr.avgDeliveryMin + ' min' : '') + '</div></div>';
    }).join('') : '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px">Sin pedidos en este período.</div>';
    h += BTN('Actualizar //', 'loadTimeWindowReport()', true);
    h += '</div>';
    return h;
}
// DIRECCIONES CON ENTREGAS FALLIDAS REPETIDAS — si una dirección acumula 2+
// cancelaciones vale la pena revisarla antes del próximo pedido a ese mismo lugar.
async function loadProblemAddresses() {
    sndScreen = 'admin_problem_addresses';
    busy = true;
    busyMsg = 'Buscando direcciones...';
    render();
    try {
        problemAddressesData = await api('admin-problem-addresses', { token: token });
    }
    catch (e) {
        problemAddressesData = null;
    }
    busy = false;
    render();
}
function sAdminProblemAddresses() {
    var h = H('DIRECCIONES', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (!problemAddressesData) {
        return h + '<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-danger,#ff8888);letter-spacing:.2em">No se pudo cargar //</div></div>' + BTN('Reintentar //', 'loadProblemAddresses()') + '</div>';
    }
    var addrs = problemAddressesData.addresses || [];
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.1em;margin-bottom:16px">Direcciones con 2+ cancelaciones</div>';
    h += addrs.length ? addrs.map(function (a) {
        return '<div style="background:var(--sw-card,#2D5246);border:1px solid rgba(255,85,85,.3);border-radius:10px;padding:14px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:flex-start"><span style="font-family:EB Garamond,serif;font-size:13px;color:var(--sw-text-body,#F2F0EB);flex:1">' + esc(a.address) + '</span><span style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-danger,#ff8888);flex-shrink:0;margin-left:10px">' + a.cancelCount + '</span></div>'
            + (a.reasons && a.reasons.length ? '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px">' + a.reasons.map(function (r) { return esc(r); }).join(' · ') + '</div>' : '')
            + '</div>';
    }).join('') : '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px">Sin direcciones con cancelaciones repetidas.</div>';
    h += BTN('Actualizar //', 'loadProblemAddresses()', true);
    h += '</div>';
    return h;
}
// RECLAMACIONES — el negocio tiene 15 días HÁBILES para responder cada reclamo/queja
// (Ley 31435 + D.S. 101-2022-PCM; antes eran 30 calendario y el texto lo decía mal —
// ver COMPLAINT_DEADLINE_BUSINESS_DAYS en supabase/functions/api/actions/complaints.ts)
// (obligación legal, no solo buena práctica); esta pantalla es donde el operador ve la
// cola pendiente y deja constancia de la respuesta.
async function loadAdminComplaints() {
    sndScreen = 'admin_complaints';
    busy = true;
    busyMsg = 'Cargando reclamaciones...';
    render();
    try {
        var r = await api('admin-list-complaints', { token: token, status: cmplFilterStatus || undefined });
        adminComplaints = r.complaints;
    }
    catch (e) {
        adminComplaints = [];
    }
    busy = false;
    render();
}
function setComplaintsFilter(v) { cmplFilterStatus = v; loadAdminComplaints(); }
function sAdminComplaints() {
    var h = H('RECLAMACIONES', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    h += '<select onchange="setComplaintsFilter(this.value)" style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:8px;padding:9px 12px;color:var(--sw-text,#FFFFFF);font-family:EB Garamond,serif;font-style:italic;font-size:11px;margin-bottom:14px">'
        + [['', 'Todos'], ['pendiente', 'Pendientes'], ['atendido', 'Atendidos']].map(function (x) { return '<option value="' + x[0] + '" ' + (cmplFilterStatus === x[0] ? 'selected' : '') + '>' + x[1] + '</option>'; }).join('')
        + '</select>';
    // Ordenado por antigüedad ascendente (el pendiente más viejo primero) — antes quedaba
    // en el orden que devolviera la API, sin ninguna prioridad visual hacia el que está más
    // cerca de vencer el plazo legal de respuesta (el cron alert-complaint-deadlines sí lo
    // rastrea aparte, pero acá el operador no tenía ninguna señal al mirar la lista) —
    // hallazgo de auditoría operativa, BAJO.
    var list = (adminComplaints || []).slice().sort(function (a, b) { return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); });
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">' + list.length + ' reclamaciones //</div>';
    h += list.length ? list.map(function (c) {
        var pending = c.status === 'pendiente';
        var openId = cmplRespondingId === c.id;
        return '<div style="background:var(--sw-card,#2D5246);border:1px solid ' + (pending ? 'rgba(255,165,0,.35)' : '#3A6B58') + ';border-radius:10px;padding:14px;margin-bottom:10px">'
            + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div>'
            + '<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + esc(c.claim_code) + '<span class="cut-sep" style="color:' + GOLD + '"> // </span>' + (c.kind === 'queja' ? 'Queja' : 'Reclamo') + '</div>'
            + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">' + esc(c.consumer_name) + ' · ' + esc(c.consumer_phone) + ' · ' + esc(c.consumer_email) + '</div>'
            + '</div><span style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:' + (pending ? 'var(--sw-warn,#ffa500)' : 'var(--sw-ok,#25D366)') + ';flex-shrink:0;display:inline-flex;align-items:center;gap:4px">' + (pending ? icon('horario', 11, 'var(--sw-warn,#ffa500)') + '<span>Pendiente</span>' : '✓ Atendido') + '</span></div>'
            + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);margin-top:8px;line-height:1.5"><b>Detalle:</b> ' + esc(c.detail) + '</div>'
            + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px;line-height:1.5"><b>Pide:</b> ' + esc(c.consumer_request) + '</div>'
            + (c.order_ref ? '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px">Pedido: ' + esc(c.order_ref) + '</div>' : '')
            + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:9px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px">' + esc(new Date(c.created_at).toLocaleDateString('es-PE')) + '</div>'
            + (c.provider_response ? '<div style="background:var(--sw-card2,#1A3028);border-radius:8px;padding:10px 12px;margin-top:10px;font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0)"><b style="color:' + GOLD + '">Respuesta:</b> ' + esc(c.provider_response) + '</div>'
                : (openId
                    ? '<div style="margin-top:10px"><textarea id="cq-resp-' + c.id + '" placeholder="Escribe tu respuesta al consumidor" style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:10px 12px;color:var(--sw-text,#FFFFFF);width:100%;font-size:12px;font-family:EB Garamond,serif;min-height:70px;box-sizing:border-box;margin-bottom:8px"></textarea><button onclick="doRespondComplaint(\'' + c.id + '\')" style="all:unset;cursor:pointer;display:block;width:100%;background:' + GOLD + ';color:var(--sw-on-gold,#241a08);font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:12px;font-weight:600;letter-spacing:.06em;padding:10px 0;border-radius:8px;text-align:center">Guardar respuesta //</button></div>'
                    : '<button onclick="cmplRespondingId=\'' + c.id + '\';render()" style="all:unset;cursor:pointer;display:block;width:100%;text-align:center;background:rgba(203,162,88,.12);border:1px solid rgba(203,162,88,.4);color:' + GOLD + ';font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:12px;font-weight:600;letter-spacing:.06em;padding:9px 0;border-radius:8px;margin-top:10px">Responder //</button>'))
            + '</div>';
    }).join('') : '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);text-align:center;padding:20px 0">Sin reclamaciones //</div>';
    h += '</div>';
    return h;
}
async function doRespondComplaint(id) {
    var el = document.getElementById('cq-resp-' + id);
    var response = el ? el.value.trim() : '';
    if (!response)
        return;
    try {
        await api('admin-respond-complaint', { token: token, id: id, response: response });
        cmplRespondingId = null;
        loadAdminComplaints();
    }
    catch (e) {
        showToast(e.message, 'error');
    }
}
async function doRecover() {
    var phone = gv('rec-phone').trim();
    var dni = gv('rec-dni').trim();
    var bdayRaw = gv('rec-bday').trim();
    recPhone = phone;
    recDni = dni;
    recBday = bdayRaw;
    var msg = document.getElementById('rec-msg');
    if (!phone || !dni || !bdayRaw) {
        if (msg)
            msg.textContent = 'Completa teléfono, DNI y fecha de nacimiento.';
        return;
    }
    var bday = parseBdayDDMMYYYY(bdayRaw);
    if (!bday) {
        if (msg)
            msg.textContent = 'Fecha inválida — debe ser DD/MM/AAAA y existir de verdad.';
        return;
    }
    busy = true;
    busyMsg = 'Verificando...';
    render();
    try {
        var r = await api('recover', { phone: phone, dni: dni, bday: bday });
        if (r.emailSent) {
            recNewPin = null;
            recEmailMasked = r.emailMasked;
        }
        else {
            recNewPin = r.newPin;
            recEmailMasked = null;
            recPinRevealed = false;
        }
        // Antes el teléfono no pasaba de esta pantalla a Ingresar — el cliente lo volvía a
        // teclear pese a haberlo escrito hace un momento (hallazgo de auditoría UX, MEDIO).
        savedPh = phone;
        busy = false;
        sndScreen = 'p_recover';
        render();
    }
    catch (e) {
        busy = false;
        sndScreen = 'p_recover';
        render();
        var m2 = document.getElementById('rec-msg');
        if (m2)
            m2.textContent = e.message;
    }
}
// ── #9 / #3 / #4: RECETAS DE PRODUCCIÓN ────────────────────────────────────────────────
//
// Tres cosas que hasta hoy solo existían en RECETARIO.md, que es un documento para leer y
// no para cocinar con él al lado: escalar la receta a las porciones de hoy, cronometrar
// cada etapa, e imprimir la etiqueta que va pegada al envase.
//
// El recetario NO se reemplaza: sigue teniendo el porqué de cada decisión (por qué punta de
// pecho y no lomo, qué pasa si sobrecargas la sartén). Acá está solo lo que hay que calcular.
var recipesData = null, recipeTarget = '', recipeTimer = null, recipeTimerStep = null, recipeTimerEndsAt = 0;
// ── PUBLICAR UNA RECETA DESDE EL PANEL (2026-09-10) ───────────────────────────────────
// `admin-recipe-set` existía en el servidor desde que se creó esta pantalla, con su código,
// sus validaciones y su historial append-only. Lo que NUNCA existió es una pantalla que lo
// llamara: el panel de Recetas solo LEÍA. O sea que el CLAUDE.md decía "las demás las carga
// el dueño desde el panel" y desde el panel no se podía cargar ninguna.
//
// Es el mismo modo de fallo que dejó `actAdminRetentionReport` importada y sin registrar: el
// backend compila, la acción responde, y nada avisa de que nadie la llama.
var recipeForm = { code: '', name: '', yield: '', grams: '', ing: '', steps: '' }, recipeFormMsg = '', recipeFormOpen = false;
// Ingredientes y etapas se escriben como TEXTO, una por línea, y no como N filas que se
// agregan con un botón. No es pereza: el dueño carga esto desde el celular, muchas veces
// copiando del recetario, y escribir seis líneas seguidas es más rápido que tocar "agregar"
// seis veces. El formato es el mismo que ya usa el recetario: nombre, cantidad, unidad.
function parseRecipeLines(txt, campos) {
    return String(txt || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
        var p = l.split('|').map(function (x) { return x.trim(); });
        var o = {};
        campos.forEach(function (c, i) { o[c] = p[i] || ''; });
        return o;
    });
}
function recipeFormLoad(code) {
    var r = (recipesData && recipesData.recipes || []).find(function (x) { return x.recipe_code === code; });
    if (!r)
        return;
    // Publicar de nuevo NO edita la fila: inserta una versión nueva (append-only). Por eso
    // cargar una receta existente y republicarla es la forma correcta de corregirla, y el
    // historial de "qué hice la vez que salió bien" queda intacto.
    recipeForm = {
        code: r.recipe_code || '',
        name: r.name || '',
        yield: String(r.yield_portions || ''),
        grams: String(r.portion_grams || ''),
        ing: (r.ingredients || []).map(function (i) { return [i.item, i.qty, i.unit].join(' | '); }).join('\n'),
        steps: (r.steps || []).map(function (x) { return [x.label, x.minutes].join(' | '); }).join('\n')
    };
    recipeFormOpen = true;
    recipeFormMsg = '';
    render();
}
function recipeFormClear() {
    recipeForm = { code: '', name: '', yield: '', grams: '', ing: '', steps: '' };
    recipeFormMsg = '';
    render();
}
function recipeFormRead() {
    var g = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
    recipeForm = { code: g('rf-code'), name: g('rf-name'), yield: g('rf-yield'), grams: g('rf-grams'), ing: g('rf-ing'), steps: g('rf-steps') };
}
async function doPublishRecipe() {
    recipeFormRead();
    var ings = parseRecipeLines(recipeForm.ing, ['item', 'qty', 'unit']).map(function (i) { return { item: i.item, qty: Number(i.qty), unit: i.unit }; });
    var pasos = parseRecipeLines(recipeForm.steps, ['label', 'minutes']).map(function (x) { return { label: x.label, minutes: Number(x.minutes) }; });
    // ⚠ Se valida ACÁ ADEMÁS del servidor, y no en su lugar. El servidor manda —es quien
    // escribe— pero un error que el cliente puede ver antes de mandar le ahorra al dueño un
    // viaje entero, y sobre todo le dice CUÁL de las seis líneas está mal.
    var malas = ings.filter(function (i) { return !i.item || !isFinite(i.qty) || i.qty <= 0 || !i.unit; });
    if (malas.length) {
        recipeFormMsg = 'Revisa los ingredientes: cada línea va "nombre | cantidad | unidad". Falla: ' + malas[0].item;
        render();
        return;
    }
    if (!ings.length) {
        recipeFormMsg = 'Una receta sin ingredientes no sirve para calcular nada.';
        render();
        return;
    }
    busy = true;
    busyMsg = 'Publicando la receta...';
    render();
    try {
        await api('admin-recipe-set', { token: token, recipeCode: recipeForm.code, name: recipeForm.name,
            yieldPortions: Number(recipeForm.yield), portionGrams: recipeForm.grams ? Number(recipeForm.grams) : null,
            ingredients: ings, steps: pasos });
        recipeFormMsg = '';
        recipeForm = { code: '', name: '', yield: '', grams: '', ing: '', steps: '' };
        recipeFormOpen = false;
        busy = false;
        await loadRecipes(recipeTarget);
    }
    catch (e) {
        busy = false;
        recipeFormMsg = (e && e.message) || 'No se pudo publicar la receta.';
        render();
    }
}
async function loadRecipes(target) {
    sndScreen = 'admin_recipes';
    busy = true;
    busyMsg = 'Cargando recetas...';
    render();
    var t = Number(target || recipeTarget);
    try {
        recipesData = await api('admin-recipes', { token: token, targetPortions: (t > 0 ? t : null) });
    }
    catch (e) {
        recipesData = null;
    }
    busy = false;
    render();
}
function setRecipeTarget(v) {
    recipeTarget = v;
    // Se recalcula EN EL SERVIDOR, no acá: el escalado decide cuánto comprar, y tenerlo en
    // dos sitios es la forma de que un día digan cosas distintas.
    loadRecipes(v);
}
// #3 — Temporizador de una etapa. Uno solo a la vez a propósito: cocinando solo, dos
// cronómetros corriendo es exactamente la situación en la que se ignoran los dos.
function startRecipeTimer(code, idx, minutes) {
    stopRecipeTimer();
    recipeTimerStep = code + '#' + idx;
    recipeTimerEndsAt = Date.now() + minutes * 60000;
    recipeTimer = setInterval(function () {
        if (Date.now() >= recipeTimerEndsAt) {
            stopRecipeTimer();
            // La app puede estar en segundo plano mientras se cocina — por eso además del cambio
            // en pantalla suena y vibra. Un aviso solo visual no sirve con las manos ocupadas.
            try {
                playNotif();
            }
            catch (e) { }
            try {
                if (navigator.vibrate)
                    navigator.vibrate([200, 100, 200, 100, 400]);
            }
            catch (e) { }
            showToast('Terminó la etapa ⏱');
        }
        render();
    }, 1000);
    render();
}
function stopRecipeTimer() {
    if (recipeTimer) {
        clearInterval(recipeTimer);
        recipeTimer = null;
    }
    recipeTimerStep = null;
    recipeTimerEndsAt = 0;
}
function recipeTimerLeft() {
    var ms = recipeTimerEndsAt - Date.now();
    if (ms < 0)
        ms = 0;
    var m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
    return m + ':' + (s < 10 ? '0' : '') + s;
}
// #4 — La etiqueta. RECETARIO.md lo dice sin rodeos: "Sin fecha no hay rotación" — en el
// refri dos bolsas de mechado son indistinguibles.
function printRecipeLabels(code) {
    var r = (recipesData && recipesData.recipes || []).filter(function (x) { return x.recipe_code === code; })[0];
    if (!r)
        return;
    var hoy = new Date();
    var f = function (d) { return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', ''); };
    var vence = r.shelfLifeDays > 0 ? new Date(hoy.getTime() + r.shelfLifeDays * 86400000) : null;
    var g = r.portion_grams ? r.portion_grams + 'g' : '';
    // Se imprimen varias iguales: una tanda son muchas bolsas, y rotular a mano una por una es
    // justo el trabajo que esto elimina.
    var n = Math.max(1, Number(r.yield_portions) || 1);
    var etiquetas = '';
    for (var i = 0; i < n; i++) {
        etiquetas += '<div class="et"><div class="c">' + esc(r.recipe_code) + (g ? ' · ' + g : '') + '</div>'
            + '<div class="n">' + esc(r.name) + '</div>'
            + '<div class="d">PROD ' + f(hoy) + (vence ? ' · USAR ANTES DE ' + f(vence) : '') + '</div></div>';
    }
    var w = window.open('', '_blank');
    if (!w) {
        showToast('El navegador bloqueó la ventana de impresión.');
        return;
    }
    w.document.write('<html><head><title>Etiquetas ' + esc(r.recipe_code) + '</title><style>'
        + 'body{font-family:system-ui,sans-serif;margin:8mm;display:flex;flex-wrap:wrap;gap:3mm}'
        + '.et{border:1px solid #000;border-radius:2mm;padding:3mm;width:48mm;box-sizing:border-box}'
        + '.c{font-weight:700;font-size:11pt}.n{font-size:8pt;margin:1mm 0}'
        + '.d{font-size:7pt;letter-spacing:.03em}'
        + '@media print{.et{break-inside:avoid}}'
        + '</style></head><body>' + etiquetas + '</body></html>');
    w.document.close();
    w.focus();
    w.print();
}
function sAdminRecipes() {
    var h = H('RECETAS', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (!recipesData) {
        return h + '<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-danger,#ff8888);letter-spacing:.2em">No se pudo cargar //</div></div>' + BTN('Reintentar //', 'loadRecipes()') + '</div>';
    }
    h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px;line-height:1.5">Las cantidades y los tiempos para cocinar. El porqué de cada decisión sigue en el recetario — acá está lo que hay que calcular.</div>';
    // ── PUBLICAR / CORREGIR UNA RECETA ──────────────────────────────────────────────────
    // Va ARRIBA de la lista y cerrado por defecto: lo que el dueño hace todos los días es
    // CONSULTAR una receta, no cargarla. Un formulario abierto empujaría la lista fuera de
    // pantalla en el 95% de las visitas.
    var rfLbl = 'font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.15em;margin:10px 0 4px';
    var rfInp = 'width:100%;box-sizing:border-box;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:10px 12px;color:var(--sw-text,#FFFFFF);font-size:16px;font-family:EB Garamond,serif';
    h += '<details' + (recipeFormOpen ? ' open' : '') + ' style="background:var(--sw-card2,#1A3028);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:14px 16px;margin-bottom:18px">'
        + '<summary style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;cursor:pointer;list-style:none">+ Publicar o corregir una receta //</summary>'
        // Append-only: se dice acá, donde se decide, y no en un comentario que el dueño no lee.
        + '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:10px;line-height:1.5">Publicar guarda una <b style="color:var(--sw-text-body,#F2F0EB)">versión nueva</b>; la anterior no se borra. Para corregir una receta, ábrela con <i>Cargar</i> y publica de nuevo.</div>'
        + '<div style="' + rfLbl + '">Código del insumo //</div>'
        + '<input id="rf-code" value="' + esc(recipeForm.code) + '" placeholder="P01" style="' + rfInp + '">'
        + '<div style="' + rfLbl + '">Nombre //</div>'
        + '<input id="rf-name" value="' + esc(recipeForm.name) + '" placeholder="Res asada mechada" style="' + rfInp + '">'
        + '<div style="display:flex;gap:10px">'
        + '<div style="flex:1"><div style="' + rfLbl + '">Rinde (porciones) //</div><input id="rf-yield" type="number" min="1" inputmode="numeric" value="' + esc(recipeForm.yield) + '" placeholder="24" style="' + rfInp + '"></div>'
        + '<div style="flex:1"><div style="' + rfLbl + '">Gramos por porción //</div><input id="rf-grams" type="number" min="1" inputmode="numeric" value="' + esc(recipeForm.grams) + '" placeholder="85" style="' + rfInp + '"></div>'
        + '</div>'
        // ⚠ La unidad tiene que coincidir con la de las COMPRAS. Comprar en kg y escribir la
        // receta en g da un costo por porción mil veces menor, sin ningún error visible.
        + '<div style="' + rfLbl + '">Ingredientes — uno por línea: nombre | cantidad | unidad //</div>'
        + '<textarea id="rf-ing" rows="5" placeholder="Punta de pecho | 2.5 | kg&#10;Sal | 40 | g" style="' + rfInp + ';resize:vertical;line-height:1.5">' + esc(recipeForm.ing) + '</textarea>'
        + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-warn,#ffa500);margin-top:4px">La unidad tiene que ser la misma con la que compras ese insumo, o el costo por porción sale mal sin avisar.</div>'
        // Los minutos NO se escalan con las porciones (duplicar la tanda no duplica el braseado).
        + '<div style="' + rfLbl + '">Etapas — una por línea: nombre | minutos //</div>'
        + '<textarea id="rf-steps" rows="4" placeholder="Sellado | 15&#10;Braseado | 180" style="' + rfInp + ';resize:vertical;line-height:1.5">' + esc(recipeForm.steps) + '</textarea>'
        + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:4px">Los minutos no se escalan: duplicar la tanda no duplica el braseado.</div>'
        + (recipeFormMsg ? '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-danger-strong,#ff5555);background:rgba(255,85,85,.08);border:1px solid rgba(255,85,85,.3);border-radius:8px;padding:10px 12px;margin-top:10px">' + esc(recipeFormMsg) + '</div>' : '')
        + '<div style="margin-top:12px">' + BTN('Publicar receta //', 'doPublishRecipe()') + '</div>'
        + '<div onclick="recipeFormClear()" style="text-align:center;margin-top:10px;cursor:pointer;font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em">Limpiar</div>'
        + '</details>';
    h += '<div style="background:var(--sw-card,#2D5246);border:1px solid ' + GOLD + ';border-radius:10px;padding:14px;margin-bottom:18px">'
        + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Escalar a //</div>'
        + '<div style="display:flex;gap:8px;align-items:center">'
        + '<input id="rec-target" type="number" min="1" inputmode="numeric" value="' + esc(String(recipeTarget || '')) + '" placeholder="porciones" style="flex:1;min-width:0;background:var(--sw-bg,#1E3932);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:10px 12px;color:var(--sw-text,#FFFFFF);font-family:EB Garamond,serif;font-size:13px">'
        + '<button onclick="setRecipeTarget(document.getElementById(\'rec-target\').value)" style="all:unset;cursor:pointer;background:' + GOLD + ';color:var(--sw-on-gold,#241a08);font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:10px 16px;border-radius:8px">Calcular</button>'
        + (recipesData.targetPortions ? '<button onclick="setRecipeTarget(\'\')" style="all:unset;cursor:pointer;font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);padding:10px">Quitar</button>' : '')
        + '</div></div>';
    var recetas = recipesData.recipes || [];
    if (!recetas.length) {
        h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5">Todavía no hay ninguna receta cargada.</div>';
        return h + '</div>';
    }
    h += recetas.map(function (r) {
        var tl = r.timeline || { steps: [], totalMinutes: 0 };
        var esc2 = function (x) { return esc(String(x == null ? '' : x)); };
        var s = '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:16px;margin-bottom:16px">'
            + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:4px">'
            + '<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:16px;font-weight:600;color:var(--sw-text,#FFFFFF)">' + esc2(r.name) + '</div>'
            + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.15em;margin-top:2px">' + esc2(r.recipe_code) + ' · RINDE ' + esc2(r.yield_portions) + (r.portion_grams ? ' × ' + esc2(r.portion_grams) + 'g' : '') + '</div></div>'
            + '<div style="text-align:right;flex:0 0 auto"><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:640;color:' + GOLD + '">' + Math.floor(tl.totalMinutes / 60) + 'h ' + (tl.totalMinutes % 60) + 'm</div>'
            + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.1em">DE TANDA</div></div></div>'
            + '<div onclick="recipeFormLoad(\'' + esc2(r.recipe_code) + '\')" style="cursor:pointer;display:inline-block;font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.1em;margin-bottom:10px">Cargar para corregir →</div>';
        // Ingredientes. Cuando hay escalado, la cantidad original queda AL LADO: sin ella no hay
        // forma de notar que el factor está mal.
        s += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.15em;margin:12px 0 6px">INGREDIENTES' + (r.scaled ? ' · PARA ' + esc2(recipesData.targetPortions) : '') + '</div>';
        var ing = r.scaled || (r.ingredients || []).map(function (i) { return { item: i.item, qty: i.qty, unit: i.unit, scaledQty: i.qty }; });
        s += ing.map(function (i) {
            var cambio = r.scaled && i.scaledQty !== i.qty;
            return '<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.06)">'
                + '<span style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">' + esc2(i.item) + '</span>'
                + '<span style="flex:0 0 auto;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:' + (cambio ? GOLD : 'var(--sw-text,#FFFFFF)') + '">' + esc2(i.scaledQty) + ' ' + esc2(i.unit)
                + (cambio ? '<span style="font-family:EB Garamond,serif;font-weight:400;font-size:10px;color:var(--sw-text-muted,#A8C8B0)"> (base ' + esc2(i.qty) + ')</span>' : '')
                + '</span></div>';
        }).join('');
        // #3 — Etapas con cronómetro. Los tiempos NO se escalan: duplicar la tanda no duplica el
        // braseado, y decir que sí haría planificar contra un número falso.
        s += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.15em;margin:14px 0 6px">ETAPAS</div>';
        s += tl.steps.map(function (st, idx) {
            var corriendo = recipeTimerStep === (r.recipe_code + '#' + idx);
            return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0">'
                + '<span style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);min-width:0">' + esc2(st.label) + '</span>'
                + '<span style="flex:0 0 auto">'
                + (st.minutes
                    ? (corriendo
                        ? '<button onclick="stopRecipeTimer()" style="all:unset;cursor:pointer;background:var(--sw-danger,#ff8888);color:var(--sw-on-gold,#241a08);font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:12px;font-weight:640;padding:6px 12px;border-radius:6px">' + recipeTimerLeft() + ' ✕</button>'
                        : '<button onclick="startRecipeTimer(\'' + esc2(r.recipe_code) + '\',' + idx + ',' + st.minutes + ')" style="all:unset;cursor:pointer;background:var(--sw-bg,#1E3932);border:1px solid ' + GOLD + ';color:' + GOLD + ';font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:11px;font-weight:600;padding:6px 12px;border-radius:6px">' + st.minutes + ' min ▶</button>')
                    : '<span style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">sin tiempo</span>')
                + '</span></div>';
        }).join('');
        if (r.notes) {
            s += '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5;margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08)">' + esc2(r.notes) + '</div>';
        }
        // #4 — Etiquetas. La vida útil viene del INVENTARIO (la misma que usa la alerta de
        // caducidad), no de la receta: dos números para lo mismo terminan en que uno gana solo.
        s += '<div style="margin-top:12px">'
            + '<button onclick="printRecipeLabels(\'' + esc2(r.recipe_code) + '\')" style="all:unset;cursor:pointer;background:var(--sw-bg,#1E3932);border:1px solid var(--sw-border,#3A6B58);color:var(--sw-text,#FFFFFF);font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:12px;font-weight:600;padding:9px 14px;border-radius:8px">Imprimir ' + esc2(r.yield_portions) + ' etiquetas //</button>'
            + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:5px;line-height:1.5">'
            + (r.shelfLifeDays > 0
                ? 'Con fecha de hoy y límite a ' + esc2(r.shelfLifeDays) + ' días, tomado del inventario.'
                : 'Sin vida útil configurada para este insumo: la etiqueta sale con la fecha de producción y sin fecha límite. Se configura en Inventario.')
            + '</div></div>';
        return s + '</div>';
    }).join('');
    return h + '</div>';
}
// ── #40: CIERRE DE CAJA DIARIO ─────────────────────────────────────────────────────────
//
// El panel de negocio ya muestra "ingresos", y para ESTE negocio ese número miente por
// omisión en tres formas: el delivery no es plata suya (va al motorizado), un pedido pagado
// con crédito interno no trajo plata hoy (entró cuando se vendió el Plan Semanal), y la
// tarjeta no llega entera (Culqi se queda su comisión). Cerrar la caja es separar eso.
var cashCloseData = null;
async function loadCashClose() {
    sndScreen = 'admin_cash';
    busy = true;
    busyMsg = 'Cuadrando la caja...';
    render();
    try {
        cashCloseData = await api('admin-cash-close', { token: token });
    }
    catch (e) {
        cashCloseData = null;
    }
    busy = false;
    render();
}
function sAdminCashClose() {
    var h = H('CIERRE DE CAJA', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (!cashCloseData) {
        return h + '<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-danger,#ff8888);letter-spacing:.2em">No se pudo cargar //</div></div>' + BTN('Reintentar //', 'loadCashClose()') + '</div>';
    }
    var d = cashCloseData;
    var money = function (n) { return 'S/' + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2); };
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.1em;margin-bottom:14px">Hoy · ' + d.orders + ' pedido' + (d.orders === 1 ? '' : 's') + ' cobrado' + (d.orders === 1 ? '' : 's') + '</div>';
    // El número grande es el que de verdad le queda al negocio, no el bruto. Poner el bruto
    // arriba sería repetir la mentira que esta pantalla existe para deshacer.
    h += '<div style="background:var(--sw-card2,#1A3028);border:1px solid ' + GOLD + ';border-radius:12px;padding:20px;margin-bottom:16px;text-align:center">'
        + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:34px;font-weight:640;color:' + GOLD + ';line-height:1.1">' + money(d.businessRevenue) + '</div>'
        + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.15em;margin-top:4px">TUYO, DESPUÉS DEL REPARTO Y LA COMISIÓN</div></div>';
    var fila = function (label, valor, nota = '', color = '') {
        return '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">'
            + '<div style="min-width:0"><div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">' + label + '</div>'
            + (nota ? '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);line-height:1.4;margin-top:1px">' + nota + '</div>' : '') + '</div>'
            + '<div style="flex:0 0 auto;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:' + (color || 'var(--sw-text,#FFFFFF)') + '">' + valor + '</div></div>';
    };
    h += '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:16px;margin-bottom:16px">';
    h += fila('Cobrado en total', money(d.gross), 'Todo lo que pagaron los clientes, delivery incluido.');
    h += fila('− Pagado con crédito interno', '−' + money(d.creditUsed), 'Esa plata entró el día que compraron el Plan Semanal o la tarjeta de regalo. Hoy no llegó nada.', 'var(--sw-warn-soft,#ffb366)');
    h += fila('− Comisión de Culqi', '−' + money(d.cardFees), 'Solo sobre lo que pasó por tarjeta (' + Math.round((d.culqiFeeRate || 0) * 1000) / 10 + '%).', 'var(--sw-warn-soft,#ffb366)');
    h += fila('<b>Entró hoy</b>', '<b>' + money(d.cashIn) + '</b>', '', GOLD);
    h += fila('− Reparto (va al motorizado)', '−' + money(d.deliveryPassThrough), 'Pass-through: lo cobras y se lo entregas. Incluye el de los pedidos pagados con crédito — al motorizado se le paga igual.', 'var(--sw-warn-soft,#ffb366)');
    h += '</div>';
    if (d.byMethod && d.byMethod.length) {
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Por método //</div>';
        h += d.byMethod.map(function (m) {
            return '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:10px 14px;margin-bottom:6px">'
                + '<div><div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">' + esc(m.label) + '</div>'
                + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">' + m.orders + ' pedido' + (m.orders === 1 ? '' : 's') + ' · ' + money(m.net) + ' de comida</div></div>'
                + '<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:640;color:' + GOLD + '">' + money(m.gross) + '</div></div>';
        }).join('');
    }
    // Yape/Plin sin confirmar NO suma arriba, a propósito: el cliente dijo que pagó y nadie
    // miró la cuenta. El día que sume una vez, esta pantalla deja de servir para cuadrar.
    if (d.pendingConfirmation && d.pendingConfirmation.orders) {
        h += '<div style="background:rgba(255,165,0,.12);border:1px solid rgba(255,165,0,.35);border-radius:10px;padding:14px 16px;margin-top:14px">'
            + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.1em;margin-bottom:4px">SIN CONFIRMAR //</div>'
            + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">' + d.pendingConfirmation.orders + ' pedido' + (d.pendingConfirmation.orders === 1 ? '' : 's') + ' por ' + money(d.pendingConfirmation.amount) + ' esperan que confirmes el pago. <b>No están sumados arriba</b> — revísalos contra tu cuenta antes de darlos por cobrados.</div></div>';
    }
    // #39 — El pasivo de crédito NO es del día: es un saldo acumulado. Va al final y separado
    // con una línea, porque mezclarlo con el cierre sería exactamente el error que este cierre
    // vino a arreglar.
    var cl = d.creditLiability;
    if (cl && cl.customers) {
        h += '<div style="height:1px;background:var(--sw-bg,#1E3932);margin:20px 0"></div>';
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Crédito que debes // acumulado, no de hoy</div>';
        h += '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:10px;padding:16px">'
            + '<div style="display:flex;justify-content:space-between;align-items:baseline"><div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">' + cl.customers + ' cliente' + (cl.customers === 1 ? '' : 's') + ' con saldo</div>'
            + '<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:' + GOLD + '">' + money(cl.total) + '</div></div>'
            + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5;margin-top:6px">Plata que ya cobraste (Plan Semanal, tarjetas de regalo) y todavía debes en comida. Promedio ' + money(cl.average) + ', el mayor ' + money(cl.largest) + '.</div></div>';
    }
    h += BTN('Actualizar //', 'loadCashClose()', true);
    return h + '</div>';
}
// ── #38: COMPRAS DE INSUMOS Y COSTO REAL ───────────────────────────────────────────────
//
// Todo el costeo del menú corre hoy sobre literales de markdown que nadie actualiza cuando
// sube la carne. Cada compra registrada convierte eso en un número derivado de boletas — y
// cruzándolo con las recetas (que desde #9 también son dato) da el costo por porción.
var purchasesData = null, purchaseMsg = '';
async function loadPurchases() {
    sndScreen = 'admin_purchases';
    busy = true;
    busyMsg = 'Cargando compras...';
    render();
    try {
        purchasesData = await api('admin-purchases', { token: token });
    }
    catch (e) {
        purchasesData = null;
    }
    busy = false;
    render();
}
async function doAddPurchase() {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var code = g('pu-code'), qty = g('pu-qty'), unit = g('pu-unit'), total = g('pu-total');
    if (!code || !qty || !unit || !total) {
        purchaseMsg = 'Completa insumo, cantidad, unidad y lo pagado.';
        render();
        return;
    }
    busy = true;
    busyMsg = 'Guardando compra...';
    render();
    try {
        var r = await api('admin-purchase-add', { token: token, productCode: code, qty: Number(qty), unit: unit, totalPaid: Number(total), supplier: g('pu-supplier') || null, purchasedAt: g('pu-date') || null });
        purchaseMsg = '';
        await loadPurchases();
        // El aviso de subida sale AHORA, cuando el dueño acaba de pagar y todavía se acuerda de
        // por qué. Enterarse un mes después, con el margen ya bajo, no permite hacer nada.
        if (r.spike) {
            showToast('Ojo: subió ' + Math.round(r.spike.pct * 100) + '% (de S/' + r.spike.previous + ' a S/' + r.spike.current + ' por unidad).');
        }
        else {
            showToast('Compra registrada ✓');
        }
    }
    catch (e) {
        busy = false;
        purchaseMsg = e.message;
        render();
    }
}
function sAdminPurchases() {
    var h = H('COMPRAS Y COSTOS', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (!purchasesData) {
        return h + '<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-danger,#ff8888);letter-spacing:.2em">No se pudo cargar //</div></div>' + BTN('Reintentar //', 'loadPurchases()') + '</div>';
    }
    var d = purchasesData;
    var money = function (n) { return 'S/' + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2); };
    h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:14px;line-height:1.5">Anota cada compra con lo que pagaste en total — el precio por unidad lo calcula solo. Con eso el costo del menú deja de ser un número escrito a mano.</div>';
    // Formulario primero: es lo que se hace al volver del mercado, con la boleta en la mano.
    h += '<div style="background:var(--sw-card,#2D5246);border:1px solid ' + GOLD + ';border-radius:10px;padding:16px;margin-bottom:20px">'
        + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:10px">Registrar compra //</div>'
        + '<div style="display:flex;flex-direction:column;gap:8px">'
        + INP('pu-code', 'Insumo // código o nombre (P01, Punta de pecho...)', 'text')
        + '<div style="display:flex;gap:8px">' + INP('pu-qty', 'Cantidad', 'number') + INP('pu-unit', 'Unidad // kg, g, unidades', 'text') + '</div>'
        + INP('pu-total', 'Total pagado // S/', 'number')
        + INP('pu-supplier', 'Proveedor // opcional', 'text')
        + INP('pu-date', 'Fecha // AAAA-MM-DD, vacío = hoy', 'text')
        + '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-danger-strong,#ff5555);min-height:14px">' + esc(purchaseMsg) + '</div>'
        + BTN('Guardar compra //', 'doAddPurchase()')
        + '</div></div>';
    // Costo por porción: lo que de verdad se venía a buscar.
    if (d.recipeCosts && d.recipeCosts.length) {
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">Costo por porción //</div>';
        h += d.recipeCosts.map(function (r) {
            var listo = r.costPerPortion != null;
            return '<div style="background:var(--sw-card,#2D5246);border:1px solid ' + (listo ? 'rgba(203,162,88,.45)' : 'var(--sw-border,#3A6B58)') + ';border-radius:8px;padding:12px 14px;margin-bottom:8px">'
                + '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">'
                + '<div style="font-family:EB Garamond,serif;font-size:13px;color:var(--sw-text-body,#F2F0EB)">' + esc(r.name) + '</div>'
                + '<div style="flex:0 0 auto;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:17px;font-weight:640;color:' + (listo ? GOLD : 'var(--sw-text-muted,#A8C8B0)') + '">' + (listo ? money(r.costPerPortion) : '—') + '</div></div>'
                // Si falta el precio de UN ingrediente NO se muestra un total parcial: un número que
                // parece completo y no lo está es sobre lo que se fija el precio de venta.
                + (listo
                    ? '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:3px">' + money(r.total) + ' la tanda ÷ ' + r.yieldPortions + ' porciones</div>'
                    : '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:3px;line-height:1.5">Falta el precio de: ' + esc(r.missing.slice(0, 4).join(', ')) + (r.missing.length > 4 ? ' y ' + (r.missing.length - 4) + ' más' : '') + '. Sin todos, un total parcial engañaría.</div>')
                + '</div>';
        }).join('');
    }
    if (d.costs && d.costs.length) {
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin:18px 0 8px">Precio por unidad //</div>';
        h += d.costs.map(function (c) {
            var subio = c.spikePct != null && c.spikePct >= (d.spikeThreshold || 0.15);
            return '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border:1px solid ' + (subio ? 'rgba(255,165,0,.45)' : 'var(--sw-border,#3A6B58)') + ';border-radius:8px;padding:10px 14px;margin-bottom:6px">'
                + '<div style="min-width:0"><div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">' + esc(c.code) + '</div>'
                + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">' + c.purchases + ' compra' + (c.purchases === 1 ? '' : 's') + ' · última ' + esc(c.lastPurchasedAt) + '</div></div>'
                + '<div style="text-align:right;flex:0 0 auto"><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:15px;font-weight:640;color:' + GOLD + '">' + money(c.avgUnitCost) + '</div>'
                + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:8px;color:' + (subio ? 'var(--sw-warn-soft,#ffb366)' : 'var(--sw-text-muted,#A8C8B0)') + ';letter-spacing:.08em">por ' + esc(c.unit) + (c.spikePct != null ? ' · ' + (c.spikePct >= 0 ? '+' : '') + Math.round(c.spikePct * 100) + '%' : '') + '</div></div></div>';
        }).join('');
    }
    if (!d.costs || !d.costs.length) {
        h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5">Todavía no hay ninguna compra registrada.</div>';
    }
    return h + '</div>';
}
// ── #31 / #34: CONCILIACIÓN Y COMISIONES DE CULQI ──────────────────────────────────────
var culqiReportData = null;
async function loadCulqiReport() {
    sndScreen = 'admin_culqi';
    busy = true;
    busyMsg = 'Cargando reporte...';
    render();
    try {
        culqiReportData = await api('admin-culqi-report', { token: token });
    }
    catch (e) {
        culqiReportData = null;
    }
    busy = false;
    render();
}
function sAdminCulqiReport() {
    var h = H('TARJETA // CULQI', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (!culqiReportData) {
        return h + '<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-danger,#ff8888);letter-spacing:.2em">No se pudo cargar //</div></div>' + BTN('Reintentar //', 'loadCulqiReport()') + '</div>';
    }
    var d = culqiReportData;
    var money = function (n) { return 'S/' + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2); };
    h += '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-muted,#A8C8B0);margin-bottom:16px;line-height:1.5">Este mes. La comisión de Culqi es un costo real que no aparecía en ningún reporte — a este ritmo puede pesar más que tus costos fijos.</div>';
    h += '<div style="background:var(--sw-card2,#1A3028);border:1px solid ' + GOLD + ';border-radius:12px;padding:20px;margin-bottom:16px;text-align:center">'
        + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:32px;font-weight:640;color:' + GOLD + ';line-height:1.1">' + money(d.netExpected) + '</div>'
        + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:var(--sw-text-muted,#A8C8B0);letter-spacing:.15em;margin-top:4px">DEBERÍA LLEGARTE DE CULQI</div>'
        + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);margin-top:6px;line-height:1.5">Compara este número con lo que de verdad depositaron. Si no cuadra, hay algo que revisar.</div></div>';
    var fila2 = function (l, v, n = '', c = '') {
        return '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">'
            + '<div style="min-width:0"><div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">' + l + '</div>'
            + (n ? '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:10px;color:var(--sw-text-muted,#A8C8B0);line-height:1.4;margin-top:1px">' + n + '</div>' : '') + '</div>'
            + '<div style="flex:0 0 auto;font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:14px;font-weight:600;color:' + (c || 'var(--sw-text,#FFFFFF)') + '">' + v + '</div></div>';
    };
    h += '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:16px;margin-bottom:16px">';
    h += fila2('Facturado con tarjeta', money(d.invoiced), d.orders + ' pedido' + (d.orders === 1 ? '' : 's') + '.');
    h += fila2('− Comisión de Culqi', '−' + money(d.fees), 'Al ' + (Math.round((d.feeRate || 0) * 1000) / 10) + '%. Es un costo, no un redondeo.', 'var(--sw-warn-soft,#ffb366)');
    h += fila2('Cobros rechazados', String(d.declines), d.declineRate != null ? ('El ' + Math.round(d.declineRate * 100) + '% de los intentos.') : 'Sin intentos este mes.', d.declineRate != null && d.declineRate > 0.3 ? 'var(--sw-danger,#ff8888)' : '');
    if (d.orphanCharges)
        h += fila2('Cargos huérfanos detectados', String(d.orphanCharges), 'Cobros sin pedido detrás que el cron ya concilió.', 'var(--sw-warn-soft,#ffb366)');
    h += '</div>';
    h += BTN('Actualizar //', 'loadCulqiReport()', true);
    return h + '</div>';
}
// ── E6 · Salud técnica (#97 base, #98 latencia, #88 cuentas admin) ─────────────────────
// Una sola pantalla para lo técnico. El dueño no va a entrar a tres sitios distintos a
// revisar si la base se está llenando, si la función responde lenta y si hay una cuenta
// admin de alguien que ya no está. Las señales de NEGOCIO (#77, #78, #86) van aparte, en
// Cumplimiento: se miran en otro momento y con otra cabeza.
var techHealthData = null;
async function loadTechHealth() {
    sndScreen = 'admin_tech';
    busy = true;
    busyMsg = 'Revisando la infraestructura...';
    render();
    try {
        techHealthData = await api('admin-tech-health', { token: token });
    }
    catch (e) {
        techHealthData = null;
    }
    busy = false;
    render();
}
function fmtBytes(n) {
    var b = Number(n) || 0;
    if (b >= 1048576)
        return (Math.round(b / 1048576 * 10) / 10) + ' MB';
    if (b >= 1024)
        return Math.round(b / 1024) + ' KB';
    return b + ' B';
}
function sAdminTechHealth() {
    var h = H('SALUD TÉCNICA', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (!techHealthData) {
        return h + '<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-danger,#ff8888);letter-spacing:.2em">No se pudo cargar //</div></div>' + BTN('Reintentar //', 'loadTechHealth()') + '</div>';
    }
    var d = techHealthData;
    var db = d.db || {};
    var pct = Math.round((Number(db.usedPct) || 0) * 1000) / 10;
    // El espacio de la base primero, porque es el único de esta pantalla que puede DETENER el
    // negocio: el plan `free` no degrada con aviso, pasa a solo-lectura y deja de tomar pedidos.
    h += '<div style="background:var(--sw-card2,#1A3028);border:1px solid ' + (db.warn ? 'var(--sw-danger,#ff8888)' : GOLD) + ';border-radius:12px;padding:18px;margin-bottom:16px">'
        + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">ESPACIO EN LA BASE //</div>'
        + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:28px;font-weight:640;color:' + (db.warn ? 'var(--sw-danger,#ff8888)' : GOLD) + ';line-height:1.1">' + pct + '%</div>'
        + '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">' + fmtBytes(db.usedBytes) + ' de ' + fmtBytes(db.limitBytes) + '</div>'
        + '<div style="height:6px;border-radius:3px;background:rgba(255,255,255,.12);margin:10px 0 8px;overflow:hidden"><div style="height:100%;width:' + Math.min(100, pct) + '%;background:' + (db.warn ? 'var(--sw-danger,#ff8888)' : GOLD) + '"></div></div>'
        + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5">'
        + (db.warn
            ? 'Al llegar al tope, la base pasa a <b>solo lectura</b> y la app deja de tomar pedidos. Borra registros viejos de <i>debug_logs</i> o sube de plan antes de llegar.'
            : 'El plan gratuito da 500 MB. Al topar no hay aviso ni degradación: la base pasa a solo lectura y deja de entrar cualquier pedido.')
        + '</div></div>';
    if (db.tables && db.tables.length) {
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">LAS QUE MÁS PESAN //</div>';
        h += db.tables.map(function (t) {
            return '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:9px 14px;margin-bottom:6px">'
                + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">' + esc(String(t.table_name || '')) + '</div>'
                + '<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:' + GOLD + '">' + fmtBytes(t.total_bytes) + '</div></div>';
        }).join('');
    }
    // Latencia. Se mide sobre las peticiones LENTAS que la función ya anota: escribir una
    // fila por request duplicaría el tráfico a la base para medir sobre todo peticiones sanas.
    var lat = d.latency || {};
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin:18px 0 8px">VELOCIDAD DE RESPUESTA //</div>';
    if (!lat.samples) {
        h += '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px;margin-bottom:16px">'
            + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">Ninguna petición pasó del segundo y medio esta semana. <span style="font-style:italic;color:var(--sw-text-muted,#A8C8B0)">Eso es lo que se quiere ver: solo se anotan las lentas.</span></div></div>';
    }
    else {
        h += '<div style="background:var(--sw-card,#2D5246);border:1px solid ' + (lat.warn ? 'var(--sw-danger,#ff8888)' : 'var(--sw-border-soft,#1c1c1c)') + ';border-radius:10px;padding:14px 16px;margin-bottom:16px">'
            + '<div style="display:flex;gap:18px;flex-wrap:wrap">'
            + '<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:' + (lat.warn ? 'var(--sw-danger,#ff8888)' : GOLD) + '">' + lat.p95 + ' ms</div><div style="font-family:EB Garamond,serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">p95</div></div>'
            + '<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:var(--sw-text,#FFFFFF)">' + lat.worst + ' ms</div><div style="font-family:EB Garamond,serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">la peor</div></div>'
            + '<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:var(--sw-text,#FFFFFF)">' + lat.samples + '</div><div style="font-family:EB Garamond,serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">peticiones lentas (7 días)</div></div>'
            + '</div>'
            + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5;margin-top:10px">'
            + 'Se mira el p95 y no el promedio: una petición de 8 segundos entre 99 rápidas no mueve el promedio, y es justo la que hace abandonar un carrito.'
            + '</div></div>';
    }
    // Cuentas admin. Hoy hay una sola, y por eso mismo está acá antes de que haga falta.
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">CUENTAS ADMIN //</div>';
    var stale = d.staleAdmins || [];
    if (!stale.length) {
        h += '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px">'
            + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">' + (d.adminCount || 0) + ' cuenta' + ((d.adminCount || 0) === 1 ? '' : 's') + ' con acceso, ninguna abandonada.</div></div>';
    }
    else {
        h += stale.map(function (a) {
            return '<div style="background:rgba(255,165,0,.12);border:1px solid rgba(255,165,0,.35);border-radius:10px;padding:12px 14px;margin-bottom:6px">'
                + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)"><b>' + esc(a.name || a.phone) + '</b> · ' + esc(a.phone) + '</div>'
                + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5;margin-top:2px">'
                + (a.neverLoggedIn ? 'Nunca ha entrado desde que se registra el acceso.' : 'Sin entrar hace ' + a.daysSince + ' días.')
                + ' Si esta persona ya no trabaja contigo, quítale el acceso en <b>Administradores</b>.</div></div>';
        }).join('');
    }
    return h + '</div>';
}
// ── LAS TRES PALANCAS DEL MODELO, MEDIDAS (2026-09-06) ────────────────────────────────
//
// POR QUÉ EXISTE ESTA PANTALLA. `PREDICCION_V12.md` concluye que la meta de S/5,000 netos
// sostenidos NO se decide con más publicidad —a S/20,000/mes el resultado empeora— sino con
// tres números: qué fracción de los sándwiches se arma en ARMA EL TUYO, cuántos pedidos
// llevan bebida, y cuántos clientes trae cada 100 pedidos servidos.
//
// Ninguno de los tres estaba medido. El modelo los ASUME, y mover cualquiera unos puntos
// cambia la conclusión entera. Empujar una palanca sin medirla es cómo, dentro de tres
// meses, nadie sabría cuál de los tres empujones funcionó.
//
// ⚠ Y el reporte de cohortes del que cuelga todo esto —el mejor dato del panel— tenía su
// acción IMPORTADA Y NUNCA REGISTRADA en la tabla del servidor: no se podía abrir desde la
// app, solo lo veía el correo mensual. Modo de fallo puro silencio.
//
// Los valores que el modelo asume llegan DEL SERVIDOR (`modelo` en la respuesta), nunca
// escritos acá: un número a mano en la pantalla se desincroniza el día que el modelo cambie
// y nada falla. `npm run parity` verifica que el servidor y el Python no se separen.
var palancasData = null;
async function loadPalancas() {
    sndScreen = 'admin_palancas';
    busy = true;
    busyMsg = 'Midiendo las palancas...';
    render();
    try {
        palancasData = await api('admin-retention-report', { token: token });
    }
    catch (e) {
        palancasData = null;
    }
    busy = false;
    render();
}
// Una palanca puede ir por encima o por debajo del supuesto, y en las tres "más es mejor"
// menos en la mezcla: ahí lo bueno es MENOS armado, porque un Signature deja ~S/5.50 más.
function palancaCard(titulo, real, meta, sufijo, menosEsMejor, explica) {
    var hay = real !== null && real !== undefined;
    var mejor = hay && (menosEsMejor ? Number(real) <= meta : Number(real) >= meta);
    var col = !hay ? 'var(--sw-text-muted,#A8C8B0)' : (mejor ? 'var(--sw-ok,#25D366)' : 'var(--sw-warn,#ffa500)');
    return '<div style="background:var(--sw-card2,#1A3028);border:1px solid ' + (hay ? (mejor ? 'rgba(37,211,102,.35)' : 'rgba(255,165,0,.35)') : 'var(--sw-border,#3A6B58)') + ';border-radius:12px;padding:16px;margin-bottom:10px">'
        + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">' + esc(titulo) + ' //</div>'
        + '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap">'
        + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:30px;font-weight:640;color:' + col + ';line-height:1">'
        // Un guion y NUNCA un 0 donde no hay dato: un 0 se lee como "medimos y dio cero".
        + (hay ? (real + sufijo) : '—') + '</div>'
        + '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0)">el modelo asume ' + meta + sufijo + '</div>'
        + '</div>'
        + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5;margin-top:8px">' + explica + '</div>'
        + '</div>';
}
function sAdminPalancas() {
    var h = H('LAS TRES PALANCAS', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (!palancasData) {
        return h + '<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-danger,#ff8888);letter-spacing:.2em">No se pudo cargar //</div></div>' + BTN('Reintentar //', 'loadPalancas()') + '</div>';
    }
    var p = palancasData.palancas || {};
    var m = palancasData.modelo || {};
    // LA SALVAGUARDA VA ARRIBA DE LAS CIFRAS, NO AL PIE. Al pie se lee después de haberles
    // creído. Mismo criterio que el plan de tanda y el reporte de cohortes.
    if (!p.reliable) {
        h += '<div style="background:rgba(255,165,0,.12);border:1px solid rgba(255,165,0,.35);border-radius:10px;padding:14px 16px;margin-bottom:16px">'
            + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:11px;color:var(--sw-warn,#ffa500);margin-bottom:4px">Todavía no le creas a estos números</div>'
            + '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">'
            + 'Van ' + (p.orders || 0) + ' pedidos pagados en 90 días. Con menos de 20, un pedido de más mueve el porcentaje varios puntos: es ruido con forma de medición.</div></div>';
    }
    h += palancaCard('MEZCLA — cuánto se arma', p.byoPct, m.byoPct, '%', true, 'Es la fracción de SÁNDWICHES armados en ARMA EL TUYO (no de pedidos: uno puede llevar de los dos). '
        + 'Un Signature deja ~S/5.50 más que un armado, así que acá lo bueno es que baje. '
        + (p.sigUnits !== undefined ? ('Van ' + p.sigUnits + ' Signature contra ' + p.byoUnits + ' armados.') : ''));
    h += palancaCard('BEBIDA — cuántos pedidos la llevan', p.drinkPct, m.drinkPct, '%', false, 'La palanca más barata de las tres: no exige adquirir a nadie y las bebidas están al 19-32% de costo. '
        + 'Cada 15 puntos de attach valen ~S/0.48 más por pedido.');
    h += palancaCard('REFERIDOS — por cada 100 pedidos', p.referralsPer100, m.referralsPer100, '', false, 'Clientes captados por referido, por cada 100 pedidos servidos. '
        + 'Es la palanca que en el modelo convierte "no llega nunca" en "sostiene desde feb-27": un referido cuesta S/7.65 contra ~S/17.87 de comprarlo en Meta. '
        + (p.referredCustomers !== undefined ? ('Van ' + p.referredCustomers + ' clientes por referido en 90 días.') : ''));
    h += '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px;margin-top:16px">'
        + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);line-height:1.6">'
        + '<b style="font-style:normal;color:var(--sw-text-body,#F2F0EB)">Lo que NO está acá y decide igual de fuerte:</b> el CAC real. '
        + 'Sale de blogs de agencia, no de medición propia, y todo el modelo cuelga de él. Se mide poniendo los secrets de Meta — es el bloqueo número uno del negocio.'
        + '</div></div>';
    // El reporte de cohortes completo, que hasta hoy no se podía abrir desde la app.
    var ov = palancasData.overall || {};
    if (ov.customers) {
        h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin:22px 0 10px">RETENCIÓN //</div>'
            + '<div style="display:flex;gap:18px;flex-wrap:wrap;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px">'
            + '<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:' + GOLD + '">' + ov.repeatRatePct + '%</div><div style="font-family:EB Garamond,serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">vuelve a pedir</div></div>'
            + '<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:var(--sw-text,#FFFFFF)">' + ov.avgOrdersIfReturned + '</div><div style="font-family:EB Garamond,serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">pedidos si vuelve</div></div>'
            + '<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:20px;font-weight:640;color:var(--sw-text,#FFFFFF)">' + ov.customers + '</div><div style="font-family:EB Garamond,serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">clientes</div></div>'
            + '</div>';
    }
    return h + '</div>';
}
// ── E6 · Cumplimiento y promesa (#78 entrega, #77 queja repetida, #86 Libro) ───────────
var complianceData = null;
async function loadCompliance() {
    sndScreen = 'admin_compliance';
    busy = true;
    busyMsg = 'Revisando entregas y reclamos...';
    render();
    try {
        complianceData = await api('admin-compliance', { token: token });
    }
    catch (e) {
        complianceData = null;
    }
    busy = false;
    render();
}
function sAdminCompliance() {
    var h = H('CUMPLIMIENTO', "loadAdmin()") + '<div style="flex:1;padding:20px 20px 40px;overflow-y:auto" class="fi">';
    if (!complianceData) {
        return h + '<div style="text-align:center;padding-top:64px"><div style="font-family:EB Garamond,serif;font-weight:600;font-size:10px;color:var(--sw-danger,#ff8888);letter-spacing:.2em">No se pudo cargar //</div></div>' + BTN('Reintentar //', 'loadCompliance()') + '</div>';
    }
    var d = complianceData;
    var dl = d.delivery || {};
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.1em;margin-bottom:14px">Últimos ' + (d.windowDays || 90) + ' días</div>';
    // #78 — Lo prometido contra lo cumplido.
    if (!dl.measured) {
        h += '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px;margin-bottom:16px">'
            + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:6px">ENTREGA //</div>'
            + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">Todavía no hay ningún pedido con hora de entrega registrada. <span style="font-style:italic;color:var(--sw-text-muted,#A8C8B0)">La hora la escribe el link de confirmación que abre quien reparte; sin ella no se puede medir la promesa contra nada.</span></div></div>';
    }
    else {
        var pctOk = Math.round((Number(dl.onTimePct) || 0) * 1000) / 10;
        var malo = pctOk < 80;
        h += '<div style="background:var(--sw-card2,#1A3028);border:1px solid ' + (malo ? 'var(--sw-danger,#ff8888)' : GOLD) + ';border-radius:12px;padding:18px;margin-bottom:12px">'
            + '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">LLEGARON A TIEMPO //</div>'
            + '<div style="font-family:\'Bodoni Moda\',serif;font-optical-sizing:auto;font-size:30px;font-weight:640;color:' + (malo ? 'var(--sw-danger,#ff8888)' : GOLD) + ';line-height:1.1">' + pctOk + '%</div>'
            + '<div style="font-family:EB Garamond,serif;font-size:11px;color:var(--sw-text-muted,#A8C8B0);margin-top:2px">' + dl.onTime + ' de ' + dl.measured + ' pedidos medidos</div>'
            + '<div style="display:flex;gap:18px;margin-top:12px">'
            + '<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text,#FFFFFF)">' + dl.avgMinutes + ' min</div><div style="font-family:EB Garamond,serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">promedio</div></div>'
            + '<div><div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:18px;font-weight:640;color:var(--sw-text,#FFFFFF)">' + dl.p90Minutes + ' min</div><div style="font-family:EB Garamond,serif;font-size:10px;color:var(--sw-text-muted,#A8C8B0)">9 de cada 10 llegan antes de</div></div>'
            + '</div>'
            + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5;margin-top:10px">El promedio esconde la cola: con nueve entregas de 30 minutos y una de tres horas el promedio dice 47, y el cliente de las tres horas no vuelve.</div>'
            + '</div>';
        if (dl.worst && dl.worst.length) {
            h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">LOS QUE MÁS SE PASARON //</div>';
            h += dl.worst.map(function (w) {
                var exceso = w.minutes - w.promised;
                return '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--sw-card,#2D5246);border:1px solid var(--sw-border,#3A6B58);border-radius:8px;padding:9px 14px;margin-bottom:6px">'
                    + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">' + esc(w.ref || '') + '</div>'
                    + '<div style="font-family:Bodoni Moda,serif;font-optical-sizing:auto;font-size:13px;font-weight:600;color:' + (exceso > 0 ? 'var(--sw-danger,#ff8888)' : GOLD) + '">' + w.minutes + ' min <span style="font-size:10px;opacity:.8">(prometido ' + w.promised + ')</span></div></div>';
            }).join('');
        }
    }
    // #77 — Queja repetida. Dos reclamos del mismo cliente no son un cliente difícil: son un
    // problema de proceso que ya se manifestó dos veces.
    var rep = d.repeatComplaints || [];
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin:18px 0 8px">RECLAMÓ MÁS DE UNA VEZ //</div>';
    if (!rep.length) {
        h += '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px;margin-bottom:16px">'
            + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)">Nadie ha reclamado dos veces.</div></div>';
    }
    else {
        h += rep.map(function (r) {
            return '<div style="background:rgba(255,165,0,.12);border:1px solid rgba(255,165,0,.35);border-radius:10px;padding:12px 14px;margin-bottom:6px">'
                + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB)"><b>' + esc(r.name || r.phone) + '</b> · ' + r.count + ' veces</div>'
                + '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:11px;color:var(--sw-text-muted,#A8C8B0);line-height:1.5;margin-top:2px">' + esc((r.codes || []).join(' · ')) + '</div></div>';
        }).join('');
    }
    // #86 — El consolidado del Libro de Reclamaciones. Va entero y sin recortar: un reporte
    // al que le falta un campo obligatorio no sirve el día que Indecopi lo pide.
    var cs = d.complaints || [];
    h += '<div style="font-family:EB Garamond,serif;font-weight:600;font-size:9px;color:' + GOLD + ';letter-spacing:.2em;margin-bottom:8px">LIBRO DE RECLAMACIONES //</div>';
    h += '<div style="background:var(--sw-card,#2D5246);border:1px solid var(--sw-border-soft,#1c1c1c);border-radius:10px;padding:14px 16px;margin-bottom:10px">'
        + '<div style="font-family:EB Garamond,serif;font-size:12px;color:var(--sw-text-body,#F2F0EB);line-height:1.5">' + cs.length + ' registro' + (cs.length === 1 ? '' : 's') + ' en la ventana. '
        + '<span style="font-style:italic;color:var(--sw-text-muted,#A8C8B0)">Exporta el consolidado con todos los campos del Libro para tenerlo listo si te lo piden.</span></div></div>';
    h += BTN('Descargar consolidado //', 'exportComplianceCsv()');
    return h + '</div>';
}
// El CSV se arma en el navegador con lo que la pantalla YA tiene: pedirlo otra vez al
// servidor abriría la puerta a que el archivo y lo que se ve en pantalla digan cosas
// distintas.
function exportComplianceCsv() {
    var cs = (complianceData && complianceData.complaints) || [];
    if (!cs.length) {
        showToast('No hay reclamos que exportar.', 'info');
        return;
    }
    // Cabeceras en español y con los nombres del Libro, no las claves internas: el archivo se
    // entrega a un tercero que no conoce el modelo de datos de esta app.
    var rows = cs.map(function (r) {
        return {
            'Codigo': r.claimCode || '', 'Fecha': r.createdAt || '', 'Tipo': r.kind || '',
            'Consumidor': r.consumerName || '', 'DNI': r.consumerDni || '', 'Pedido': r.orderRef || '',
            'Monto reclamado': r.claimedAmount == null ? '' : r.claimedAmount,
            'Estado': r.status || '', 'Respondido': r.respondedAt || '',
        };
    });
    var csv = toCsv(rows);
    var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    var a = document.createElement('a');
    a.href = url;
    a.download = 'sndwch-libro-reclamaciones-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
}
// ── EL PANEL SE REGISTRA A SÍ MISMO ───────────────────────────────────────────────────
// Antes estas 34 pantallas estaban escritas como `case` dentro de `renderScreen()`, que vive
// en el bundle del cliente. Eso ataba las dos mitades: el router nombraba cada pantalla del
// panel, así que el panel no se podía sacar del bundle sin dejar al router sin router.
//
// Ahora la dependencia va en un solo sentido: el panel se anuncia, el router pregunta.
//
// ⚠ UNA PANTALLA NUEVA DEL PANEL SE AGREGA ACÁ. Si no, no es alcanzable y nada avisa: el
// router cae al home del cliente sin un solo error. Es el mismo modo de fallo que dejó
// `actAdminRetentionReport` importada y sin registrar durante meses — registrar es un paso
// aparte de escribir, y ninguna herramienta lo comprueba por ti.
Object.assign(ADMIN_SCREENS, {
    admin_home: sAdminHome,
    admin_health: sAdminHealth,
    admin_batch: sAdminBatchPlan,
    admin_video: sAdminVideo,
    admin_gen: sAdminGen,
    admin_mgr: sAdminMgr,
    admin_inventory: sAdminInventory,
    admin_catalog: sAdminCatalog,
    admin_secret: sAdminSecretSignature,
    admin_items: sAdminCatalogItems,
    admin_dashboard: sAdminDashboard,
    admin_customer: sAdminCustomer,
    admin_search: sAdminSearch,
    admin_audit: sAdminAudit,
    admin_hours: sAdminHours,
    admin_report: sAdminReport,
    admin_ratings: sAdminRatings,
    admin_complaints: sAdminComplaints,
    admin_prep: sAdminPrepList,
    admin_recipes: sAdminRecipes,
    admin_cash: sAdminCashClose,
    admin_palancas: sAdminPalancas,
    admin_tech: sAdminTechHealth,
    admin_compliance: sAdminCompliance,
    admin_purchases: sAdminPurchases,
    admin_culqi: sAdminCulqiReport,
    admin_time_report: sAdminTimeReport,
    admin_problem_addresses: sAdminProblemAddresses,
    admin_marketing: sAdminMarketing,
    admin_promo: sAdminPromo,
    admin_campaign_perf: sAdminCampaignPerf,
    admin_calendar: sAdminCalendar,
    admin_waitlist: sAdminWaitlist,
    admin_focus: sAdminFocus,
});
