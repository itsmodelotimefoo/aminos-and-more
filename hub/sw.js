/* Ops Hub service worker — caches the app shell for offline reads. Never caches
 * Supabase API responses (cross-origin) so order data is always live. */
const CACHE = 'opshub-v1';
const SHELL = ['/', '/index.html', '/styles.css', '/app.js', '/config.js',
  '/manifest.webmanifest', '/icons/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (e) =>
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) =>
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase etc. → straight to network
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/index.html')));
    return;
  }
  e.respondWith(caches.match(req).then((c) => c || fetch(req).then((res) => {
    if (res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
    return res;
  })));
});
