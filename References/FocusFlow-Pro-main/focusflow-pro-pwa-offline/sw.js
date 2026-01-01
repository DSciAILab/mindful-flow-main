// sw.js v2 - Offline-oriented Service Worker
const VERSION = 'v2';
const PRECACHE = `focusflow-precache-${VERSION}`;
const RUNTIME = `focusflow-runtime-${VERSION}`;

const PRECACHE_URLS = [
  '/',            // navigation fallback
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // external assets (cached after first online fetch)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    await cache.addAll(PRECACHE_URLS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => {
      if (!k.includes(VERSION)) return caches.delete(k);
    }));
    self.clients.claim();
  })());
});

// Helper: stale-while-revalidate
async function staleWhileRevalidate(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  const networkFetch = fetch(request).then(response => {
    try { cache.put(request, response.clone()); } catch(e) {}
    return response;
  }).catch(() => null);
  return cachedResponse || networkFetch || Response.error();
}

self.addEventListener('fetch', event => {
  const req = event.request;

  // Navigation requests: offline-first (serve cached index.html if offline)
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(RUNTIME);
        cache.put('/', fresh.clone());
        return fresh;
      } catch (err) {
        const cache = await caches.open(PRECACHE);
        return (await cache.match('/')) || (await cache.match('/index.html')) || Response.error();
      }
    })());
    return;
  }

  const url = new URL(req.url);
  // Same-origin static: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(RUNTIME, req));
    return;
  }

  // Cross-origin (e.g., CDN CSS/JS): cache with SWR too (opaque allowed)
  event.respondWith(staleWhileRevalidate('focusflow-cdn-' + VERSION, req));
});
