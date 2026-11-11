const CACHE = 'dongya-list-v29';
const ASSETS = ['./', './index.html', './manifest.webmanifest',
  './icon-192-v2.png', './icon-512-v2.png', './icon-180-v2.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const isPage = e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').includes('text/html');

  /* 页面：先联网拿最新版，失败才用缓存（保证每次更新都能生效） */
  if(isPage){
    e.respondWith(
      fetch(e.request, { cache: 'reload' }).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  /* 静态资源：缓存优先，后台更新 */
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }))
  );
});
