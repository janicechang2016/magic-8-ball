const VERSION = 'magic8-v3';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './magazine-inspo.webp',
];
const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(PRECACHE);
    try {
      const res = await fetch(THREE_CDN, { mode: 'no-cors' });
      await cache.put(THREE_CDN, res);
    } catch (_) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

// Network-first for HTML + manifest (so copy/code edits show up immediately
// online; cache fallback only when offline). Cache-first for everything else
// (icons, fonts, Three.js CDN).
function isNetworkFirst(url) {
  return url.pathname === '/' ||
         url.pathname.endsWith('/index.html') ||
         url.pathname.endsWith('/manifest.webmanifest');
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin && isNetworkFirst(url)) {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch (_) {
        const cached = await cache.match(req, { ignoreSearch: true });
        if (cached) return cached;
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
        throw _;
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    } catch (err) {
      const fallback = await cache.match('./index.html');
      if (fallback) return fallback;
      throw err;
    }
  })());
});
