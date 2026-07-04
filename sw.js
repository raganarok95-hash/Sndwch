const CACHE_NAME = 'sndwch-shell-v1';
const SHELL_URLS = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Solo cacheamos la navegación al shell (index.html) para que la app abra incluso con
// mala señal — todo lo demás (llamadas a la API, Culqi, fuentes) va directo a la red
// sin pasar por el service worker, porque son datos en vivo que nunca deben servirse
// desde una copia vieja en caché (precios, stock, estado de pedidos, sesión...).
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match('./index.html'))
  );
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
    vibrate: [200, 100, 200],
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
