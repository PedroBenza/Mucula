/* Mucula SW — shell estático; não intercepta Supabase/API.
 * Versão: incrementar CACHE_NAME em cada deploy relevante. */
var CACHE_NAME = 'mucula-shell-v1';
var PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRECACHE).catch(function () {
        /* precache parcial ok */
      });
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  /* Nunca cachear Supabase, esm CDN, nem pedidos cross-origin de API */
  if (
    url.hostname.indexOf('supabase.co') >= 0 ||
    url.hostname.indexOf('esm.sh') >= 0 ||
    url.pathname.indexOf('/auth/') >= 0
  ) {
    return;
  }

  /* Navegação: network first, fallback index (SPA hash) */
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          return res;
        })
        .catch(function () {
          return caches.match('./index.html');
        })
    );
    return;
  }

  /* Same-origin assets: cache falling back to network */
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(req, copy);
          });
          return res;
        });
      })
    );
  }
});
