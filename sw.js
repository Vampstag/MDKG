const CACHE_NAME = 'mdkg-portfolio-v1';

// Install SW & Langsung Aktif
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Strategi: Stale-While-Revalidate (Sangat Cepat & Tetap Update)
self.addEventListener('fetch', (event) => {
    // Hanya cache permintaan GET (hindari POST/Form)
    if (event.request.method !== 'GET') return;
    
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