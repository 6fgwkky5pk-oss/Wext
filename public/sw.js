const V = 'wext-v7';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  if (r.url.includes('version.json')) return;
  const u = new URL(r.url);
  if (u.origin !== location.origin && !u.host.includes('fonts.g')) return;
  // network first for navigation, cache fallback
  e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(ca => ca.put(r, c)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('./'))));
});
