// Blob service worker: offline support with a versioned cache.
// Bump CACHE_VERSION to ship an update (the file change itself triggers the SW update).
var CACHE_VERSION = 'v1';
var CACHE = 'blob-cache-' + CACHE_VERSION;
var CORE = ['./', './index.html', './manifest.json', './favicon.png'];
var OPTIONAL = ['./icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', function (event) {
  event.waitUntil((async function () {
    var cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    // icons are nice-to-have: a missing one must not break installation
    await Promise.all(OPTIONAL.map(function (url) {
      return cache.add(url).catch(function () {});
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.map(function (key) {
      if (key !== CACHE) return caches.delete(key);
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // network first so deployed updates arrive; cached page when offline
    event.respondWith((async function () {
      try {
        return await fetch(req);
      } catch (err) {
        var cache = await caches.open(CACHE);
        return (await cache.match(req)) || (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // cache first for same-origin assets, filling the cache as they are used
  event.respondWith((async function () {
    var cache = await caches.open(CACHE);
    var hit = await cache.match(req);
    if (hit) return hit;
    try {
      var res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch (err) {
      return Response.error();
    }
  })());
});
