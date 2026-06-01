const CACHE_NAME = "vitour-cache-v1";

const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/logo.png",
  "/donut.png",
];

// Install Event - Pre-cache shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching static shell");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Dynamic caching with strict bypasses
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. Only intercept and cache requests for our own origin
  // This prevents CORS errors and guarantees third-party scripts (Clerk auth, Google Maps consent popup) load natively
  if (url.origin !== self.location.origin) return;

  // 2. Bypass non-HTTP/HTTPS schemes (e.g. chrome-extension://, file://, ws://)
  if (!url.protocol.startsWith("http")) return;


  // 2. Bypass hot-module-reloading and next.js dev endpoints
  if (url.pathname.includes("_next/webpack-hmr") || url.pathname.includes("hot-update")) return;

  // 3. Bypass third-party backend & auth services (Convex, Clerk, Google Maps)
  const bypassHosts = [
    "convex.cloud",
    "convex.site",
    "clerk.accounts.dev",
    "clerk.com",
    "maps.googleapis.com",
    "maps.gstatic.com",
  ];
  if (bypassHosts.some(host => url.host.includes(host))) return;

  // 4. Bypass Clerk local API routes
  if (url.pathname.startsWith("/_clerk") || url.pathname.startsWith("/api/")) return;

  // Cache-first strategy for static assets, network-first for pages
  const isStaticAsset = 
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // If network fails, return cached content if any
          return null;
        });
      })
    );
  } else {
    // Network-first (fallback to cache) for page navigation to ensure content freshness
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // If offline and not in cache, let it fail naturally
            return null;
          });
        })
    );
  }
});
