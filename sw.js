const CACHE_NAME = 'mdkg-portfolio-v2';

// Install SW & Langsung Aktif
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Drop caches from previous SW versions so a bumped CACHE_NAME actually frees the old
// entries instead of leaving them orphaned in storage forever.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
            .then(() => clients.claim())
    );
});

// Strategi: Stale-While-Revalidate (Sangat Cepat & Tetap Update)
self.addEventListener('fetch', (event) => {
    // Hanya cache permintaan GET (hindari POST/Form)
    if (event.request.method !== 'GET') return;

    // HTML/CSS/JS always go network-first: stale-while-revalidate was serving a cached
    // copy immediately on every load, so a code edit only became visible on the *second*
    // reload after that request (the first reload silently re-cached the new version
    // in the background) — on devices that never came back for a second load, this meant
    // the site was stuck showing an old version indefinitely. Markup/scripts/styles need
    // to always reflect what's actually on disk; images/video/fonts are unaffected and
    // keep the fast cache-first behavior below.
    const url = new URL(event.request.url);
    if (event.request.mode === 'navigate' || /\.(html|css|js)$/.test(url.pathname)) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(event.request)) // offline fallback only
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => { /* Abaikan error jika benar-benar offline */ });
            return cachedResponse || fetchPromise;
        })
    );
});