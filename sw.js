/* Офлайн-кэш Master Components. При обновлении файлов увеличивайте VERSION. */
var VERSION = 'mc-v14';
var FILES = [
  './', 'index.html', 'css/style.css', 'css/ui.css', 'manifest.webmanifest',
  'js/data/00-core.js', 'js/data/10-passive.js', 'js/data/20-semi.js', 'js/data/25-semi-extra.js', 'js/data/27-power-tv-new.js', 'js/data/30-wound.js',
  'js/data/40-appliance.js', 'js/data/50-fridge-micro-switch.js', 'js/data/60-variants.js', 'js/data/65-variants-extra.js', 'js/data/66-variants-new.js', 'js/data/70-sources.js', 'js/data/80-smdcodes.js',
  'js/symbols.js', 'js/looks.js', 'js/photos.js', 'js/anim.js', 'js/meter.js', 'js/tools.js', 'js/extra.js', 'js/app.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// Сначала сеть (чтобы обновления приходили сразу), без сети — из кэша
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(function (r) {
    var copy = r.clone();
    caches.open(VERSION).then(function (c) { c.put(e.request, copy); });
    return r;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (m) { return m || caches.match('index.html'); }); }));
});
