const VERSION = 'v2';
const SHELL_CACHE = 'sndwch-shell-' + VERSION;
const IMG_CACHE = 'sndwch-img-' + VERSION;
const SHELL_URLS = ['./', './index.html'];
const SHELL_KEY = './index.html';
// Marca persistente de "hay shell nuevo". No basta con postMessage: la revalidación
// termina DESPUÉS de que la navegación ya empezó, y la pestaña recién cargada todavía no
// tiene su listener puesto, así que el aviso se perdía (comprobado en pruebas). La marca
// vive en la caché, así que la página la encuentra aunque el mensaje llegue tarde o el
// service worker se haya dormido en el medio.
const UPDATE_FLAG = './__shell-update-pending';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = [SHELL_CACHE, IMG_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => keep.indexOf(k) === -1).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Huella barata para saber si el shell cambió sin leer los ~650 KB del cuerpo dos veces.
// ETag es lo que sirve Vercel; si faltara, cae a Last-Modified y luego al tamaño.
function shellStamp(res) {
  if (!res) return '';
  const h = res.headers;
  return h.get('etag') || h.get('last-modified') || h.get('content-length') || '';
}

async function notifyUpdate() {
  const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of list) client.postMessage({ type: 'sw-shell-updated' });
}

// Navegación: stale-while-revalidate. Se responde con la copia en caché al instante (la
// app abre sin esperar la descarga del shell) y en paralelo se baja la versión nueva para
// la próxima visita. Los precios/stock/estado de pedido NO viven en el shell — se piden a
// la API en cada arranque (`get-catalog`) — así que servir el shell de caché nunca muestra
// un precio viejo, solo código viejo. Si el shell cambió, se avisa a la pestaña abierta
// (`sw-shell-updated`) para que ofrezca recargar en vez de dejar al cliente en una versión
// vieja sin enterarse.
// `event` es obligatorio, no decorativo: sin `waitUntil` el navegador apaga el service
// worker apenas se resuelve `respondWith` y la revalidación en segundo plano queda a medias
// — el shell nunca se actualizaba en la caché (comprobado en pruebas: la copia vieja
// sobrevivía indefinidamente a los deploys).
async function handleNavigate(event, request) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(SHELL_KEY);
  // `cache:'no-cache'` fuerza una petición condicional al origen en vez de dejar que la
  // caché HTTP del navegador conteste sola. Sin esto la revalidación puede devolver la
  // misma copia vieja que ya teníamos y el shell nunca se actualizaría (pasó en pruebas:
  // el heurístico de frescura del navegador servía el archivo viejo sin ir a la red).
  const network = fetch(request, { cache: 'no-cache' })
    .then(async (res) => {
      if (res && res.ok) {
        const before = shellStamp(cached);
        const after = shellStamp(res);
        await cache.put(SHELL_KEY, res.clone());
        if (cached && before && after && before !== after) {
          await cache.put(UPDATE_FLAG, new Response('1'));
          await notifyUpdate();
        } else if (!cached || before === after) {
          await cache.delete(UPDATE_FLAG);
        }
      }
      return res;
    })
    .catch(() => null);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  const fresh = await network;
  return fresh || Response.error();
}

// Fotos de producto: cache-first con revalidación en segundo plano. Son el grueso de los
// bytes de la app (~880 KB) y cambian muy de vez en cuando (el sándwich secreto rota una
// vez al mes), así que la segunda visita no debería volver a descargarlas.
async function handleImage(event, request) {
  const cache = await caches.open(IMG_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok && res.type === 'basic') cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  const fresh = await network;
  return fresh || Response.error();
}

// Todo lo demás (llamadas a la API, Culqi, fuentes) va directo a la red sin pasar por el
// service worker: son datos en vivo que nunca deben servirse desde una copia vieja.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigate(event, request));
    return;
  }
  let url;
  try { url = new URL(request.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  if (/^\/img\//.test(url.pathname) || /\/(icon-\d+|icon-maskable-\d+|apple-touch-icon)\.png$/.test(url.pathname)) {
    event.respondWith(handleImage(event, request));
  }
});

// La app pide saltarse la espera cuando el cliente acepta actualizar.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'sw-skip-waiting') self.skipWaiting();
});

// Notificaciones push — el servidor las dispara cuando el operador cambia el estado
// de un pedido (PREPARANDO/EN CAMINO/ENTREGADO). El payload ya trae título y cuerpo
// listos, así que aquí solo se muestran.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const title = data.title || 'SND//WCH';
  const options = {
    body: data.body || 'Tu pedido tiene una actualización.',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    // Patrón de vibración configurable por el servidor (ej. un pulso más largo/distinto
    // para "tu pago fue confirmado" que para un cambio de estado normal) — antes era
    // siempre el mismo patrón sin importar qué tan importante fuera el aviso.
    vibrate: data.vibrate || [200, 100, 200],
    // tag+renotify: una actualización de estado (RECIBIDO→PREPARANDO→EN CAMINO→ENTREGADO)
    // del MISMO pedido reemplaza la notificación anterior en vez de apilarse — así el
    // cliente ve una sola tarjeta de seguimiento que se actualiza, como en las apps de
    // delivery, en vez de acumular una notificación por cada cambio de estado.
    tag: data.tag || 'sndwch-order',
    renotify: data.renotify !== false,
    data: { url: data.url || './index.html' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
