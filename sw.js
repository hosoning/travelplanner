const CACHE_NAME = 'travoo-v2';

// Use URLs relative to the SW's own location — works for ANY base path
// (root domain, GitHub Pages subdirectory, Cloudflare Pages, etc.)
const BASE = self.location.href.replace(/sw\.js(\?.*)?$/, '');
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'app.js',
  BASE + 'manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => {
      return Promise.allSettled(ASSETS.map(url =>
        c.add(url).catch(err => console.warn('[SW] cache miss:', url, err.message))
      ));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Don't intercept Firebase / CDN requests
  const url = e.request.url;
  if (url.includes('firebasejs') || url.includes('googleapis') || url.includes('gstatic')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      });
    }).catch(() => caches.match(BASE + 'index.html'))
  );
});

self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'Travoo', body: 'Check your latest itinerary' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body, icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png', vibrate: [200, 100, 200],
      tag: 'travoo-notif', renotify: true
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});