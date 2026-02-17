const CACHE_NAME = 'a4-tuner-v35';

self.addEventListener('install', event => {
  const base = self.registration.scope;
  const urlsToCache = [
    base,
    base + 'index.html',
    base + 'manifest.json',
    base + 'icons/icon-192.png',
    base + 'icons/icon-512.png',
    base + 'icons/apple-touch-icon.png'
  ];
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Runtime cache for Google Fonts (cache-first, populate on first fetch)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Navigation requests (index.html): network-first so updates are always picked up.
  // Falls back to cache when offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Other app shell (icons, manifest): cache-first, fall back to network
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
