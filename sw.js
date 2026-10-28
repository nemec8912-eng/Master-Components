/* Офлайн-кэш стартового экрана Master Toolkit.
   Запросы к проектам (components/, diagnose/, psu/) не трогает — у каждого свой service worker. */
var VERSION = 'hub-v1';
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'hub-icon.svg', 'hub-icons/icon-192.png', 'hub-icons/icon-512.png', 'hub-icons/apple-touch-icon.png',
  'hub-img/diagnose.jpg', 'hub-img/components.jpg', 'hub-img/psu.jpg'];
var APPS = /\/(components|diagnose|psu)\//;
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('hub-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  var rel = url.pathname.slice(new URL(self.registration.scope).pathname.length - 1);
  if (APPS.test(rel)) return; // проекты обслуживают себя сами
  e.respondWith(fetch(req).then(function (r) {
    if (r.ok) { var copy = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
    return r;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (m) { return m || (req.mode === 'navigate' ? caches.match('index.html') : undefined) || Response.error(); });
  }));
});
