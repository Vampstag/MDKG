// v5: earlier versions cached full-file (200) video/audio responses and replayed them for
// Range requests; bumping the name drops those entries on activate.
const CACHE_NAME = 'mdkg-portfolio-v5';

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

    // Video/audio must never go through this worker. <video> loads via Range requests and
    // expects 206 Partial Content back; the handlers below answer from cache.match(), which
    // ignores the Range header and returns the whole file as a 200 — Safari/iOS then refuse
    // to play it and Chrome can't seek. They also re-fetched the entire file in the
    // background on every cache hit (10-40 MB each), starving the page's other requests.
    // Returning without respondWith() lets the browser handle it natively.
    if (event.request.headers.has('range') || /\.(mp4|webm|mov|m4v|mp3|ogg|wav)$/i.test(url.pathname)) return;

    if (event.request.mode === 'navigate' || /\.(html|css|js|json)$/.test(url.pathname)) {
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