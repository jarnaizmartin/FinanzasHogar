const CACHE_NAME = 'finanzashogar-v1';

// Archivos que queremos guardar para uso sin internet
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
];

// Al instalar el SW: guardamos los archivos básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Al activar: eliminamos cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Al recibir peticiones: primero intentamos la red,
// si falla usamos la caché (offline)
self.addEventListener('fetch', (event) => {
  // Solo gestionamos peticiones HTTP/HTTPS normales
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, la guardamos en caché
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Sin internet: usamos lo que tenemos en caché
        return caches.match(event.request);
      })
  );
});
