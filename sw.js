/* Service worker: la app funciona sin internet. Subí VERSION cuando cambies archivos. */
const VERSION = 'gimnasio-v6';
const SHELL = ['./', './index.html', './app.css', './logic.js', './seed.js', './app.js', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Fuentes de Google: usar caché si existe y renovar en segundo plano.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VERSION + '-fonts').then(async c => {
      const cached = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => cached);
      return cached || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // App: primero caché, si no hay, red (y se guarda).
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(cached => cached || fetch(e.request).then(r => {
    if (r && r.ok) caches.open(VERSION).then(c => c.put(e.request, r.clone()));
    return r;
  }).catch(() => caches.match('./index.html'))));
});
