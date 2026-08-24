var CACHE_NAME = 'dongya-glass-v32';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  // Network-first for HTML, cache-first for everything else
  var url = new URL(e.request.url);
  if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '') {
    // HTML: network first, fallback to cache
    e.respondWith(
      fetch(e.request).then(function(resp) {
        var respClone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, respClone);
        });
        return resp;
      }).catch(function() {
        return caches.match(e.request).then(function(response) {
          return response || caches.match('./index.html');
        });
      })
    );
  } else {
    // Other assets: cache first, fallback to network
    e.respondWith(
      caches.match(e.request).then(function(response) {
        if (response) return response;
        return fetch(e.request).then(function(resp) {
          if (e.request.method === 'GET' && resp.status === 200) {
            var respClone = resp.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(e.request, respClone);
            });
          }
          return resp;
        }).catch(function() {
          return caches.match('./index.html');
        });
      })
    );
  }
});
