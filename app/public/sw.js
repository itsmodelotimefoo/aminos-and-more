/* Storefront service-worker kill-switch.
 *
 * Flowdeck was briefly deployed to this origin and registered a service worker
 * at /sw.js (scope "/") that cached its app shell, manifest and icons. The
 * storefront itself uses no service worker, so a plain redeploy cannot evict
 * that stale worker — returning visitors would keep being served Flowdeck from
 * cache. This replacement worker takes over the same scriptURL, purges all
 * caches, unregisters itself, and reloads any open tab so the visitor lands on
 * the live storefront. Safe for clean visitors: their browsers only fetch this
 * file if they already had the old worker registered. */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      try {
        await self.registration.unregister();
      } catch (e) {}
      // Only force a reload for visitors who actually had cached (Flowdeck) data.
      if (keys.length) {
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          try {
            client.navigate(client.url);
          } catch (e) {}
        }
      }
    })()
  );
});
