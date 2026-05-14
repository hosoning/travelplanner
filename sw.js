const VER = 'travoo-v3';
const BASE = self.location.href.replace(/sw\.js(\?.*)?$/, '');
const ASSETS = [BASE, BASE+'index.html', BASE+'app.js', BASE+'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c =>
    Promise.allSettled(ASSETS.map(u => c.add(u).catch(()=>{})))
  ));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k=>k!==VER).map(k=>caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if(e.request.method!=='GET') return;
  const url = e.request.url;
  if(url.includes('firebasejs')||url.includes('gstatic')||url.includes('googleapis')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(!res||res.status!==200||res.type==='opaque') return res;
        caches.open(VER).then(c=>c.put(e.request,res.clone()));
        return res;
      });
    }).catch(() => caches.match(BASE+'index.html'))
  );
});