// service-worker.js — Alfa Reclame PWA cache (Sprint 13 J2.1)
'use strict';

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const PAGES_CACHE = `pages-${CACHE_VERSION}`;
const IMAGES_CACHE = `images-${CACHE_VERSION}`;
const ASSETS_CACHE = `assets-${CACHE_VERSION}`;

const SHELL_FILES = [
  '/',
  '/manifest.json',
  '/public/css/huisstijl.css',
  '/public/images/favicon-192.png',
  '/raambelettering-rotterdam/',
  '/autoreclame-rotterdam/',
  '/gevelreclame-rotterdam/',
  '/contact/',
];

const PAGES_MAX_AGE = 7 * 24 * 60 * 60 * 1000;   // 7 days
const IMAGES_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
const ASSETS_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

// ---------------------------------------------------------------------------
// INSTALL — pre-cache shell files, skip missing ones gracefully
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const results = await Promise.allSettled(
        SHELL_FILES.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] shell pre-cache skip (${url}):`, err.message);
          })
        )
      );
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) {
        console.warn(`[SW] ${failed.length} shell file(s) failed to pre-cache.`);
      }
    }).then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// ACTIVATE — delete old versioned caches, claim all clients
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.endsWith(`-${CACHE_VERSION}`))
          .map((k) => {
            console.info(`[SW] deleting old cache: ${k}`);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// FETCH — route by resource type
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;
  // Skip API calls
  if (url.pathname.startsWith('/api/')) return;

  if (
    url.pathname.match(/\.(png|jpg|jpeg|webp|avif|svg|gif|ico)$/i) ||
    url.pathname.startsWith('/img/') ||
    url.pathname.startsWith('/public/images/')
  ) {
    event.respondWith(cacheFirst(req, IMAGES_CACHE, IMAGES_MAX_AGE));
  } else if (
    url.pathname.match(/\.(css|js|woff|woff2|ttf)$/i) ||
    url.pathname.startsWith('/public/')
  ) {
    event.respondWith(cacheFirst(req, ASSETS_CACHE, ASSETS_MAX_AGE));
  } else if (url.pathname.match(/\.(html|njk)$|\/$|^\/[^.]*\/?$/)) {
    event.respondWith(staleWhileRevalidate(req, PAGES_CACHE, PAGES_MAX_AGE));
  } else {
    event.respondWith(networkFirst(req, PAGES_CACHE));
  }
});

// ---------------------------------------------------------------------------
// Strategy helpers
// ---------------------------------------------------------------------------

/**
 * Store a response with a timestamp header so we can check max-age later.
 */
async function storeWithTimestamp(cacheName, req, response) {
  const clone = response.clone();
  const headers = new Headers(clone.headers);
  headers.set('sw-cached-at', Date.now().toString());
  const timestamped = new Response(clone.body, {
    status: clone.status,
    statusText: clone.statusText,
    headers,
  });
  const cache = await caches.open(cacheName);
  await cache.put(req, timestamped);
}

/**
 * Return true if a cached response has exceeded its maxAge.
 */
function isExpired(cachedResponse, maxAge) {
  const cachedAt = cachedResponse.headers.get('sw-cached-at');
  if (!cachedAt) return false; // no timestamp — treat as fresh (shell pre-cache)
  return Date.now() - parseInt(cachedAt, 10) > maxAge;
}

/**
 * cacheFirst — serve from cache; on miss (or expiry) fetch, store, return.
 */
async function cacheFirst(req, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached && !isExpired(cached, maxAge)) {
    return cached;
  }
  try {
    const fresh = await fetch(req);
    if (fresh.ok) {
      await storeWithTimestamp(cacheName, req, fresh);
      return fresh.clone();
    }
    return cached || fresh;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

/**
 * staleWhileRevalidate — return cached immediately if available; always
 * fire-and-forget background fetch to keep cache warm.
 */
async function staleWhileRevalidate(req, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);

  const fetchAndStore = fetch(req)
    .then(async (fresh) => {
      if (fresh.ok) await storeWithTimestamp(cacheName, req, fresh);
      return fresh;
    })
    .catch(() => null);

  if (cached && !isExpired(cached, maxAge)) {
    // Return stale immediately; background refresh continues (fire-and-forget)
    void fetchAndStore;
    return cached;
  }

  // No valid cache — wait for network
  const fresh = await fetchAndStore;
  if (fresh) return fresh;
  if (cached) return cached; // expired but better than nothing
  throw new Error(`[SW] staleWhileRevalidate: no response for ${req.url}`);
}

/**
 * networkFirst — try network; fall back to cache on failure.
 */
async function networkFirst(req, cacheName) {
  try {
    const fresh = await fetch(req);
    if (fresh.ok) {
      await storeWithTimestamp(cacheName, req, fresh);
    }
    return fresh;
  } catch (err) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(req);
    if (cached) return cached;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// PUSH — show notification when a push message is received (Sprint 14 K3.4)
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Alfa Reclame', {
      body: data.body || 'Nieuwe update beschikbaar',
      icon: '/public/images/favicon-192.png',
      badge: '/public/images/favicon-192.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});
