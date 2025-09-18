/**
 * Service Worker for EC Site
 *
 * Provides basic offline functionality and caching for learning purposes
 */

const CACHE_NAME = 'ec-site-v1';
const urlsToCache = [
  '/',
  '/css/main.css',
  '/css/atoms.css',
  '/css/molecules.css',
  '/css/organisms.css',
  '/css/templates.css',
  '/js/main.js',
  '/js/components/header.js',
  '/js/components/cart.js',
  '/js/components/product.js',
  '/images/no-image.svg',
  '/images/favicon-32x32.png',
  '/images/favicon-16x16.png',
  '/images/apple-touch-icon.png'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  console.log('ServiceWorker: Install event');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('ServiceWorker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.error('ServiceWorker: Failed to cache resources', error);
      })
  );

  // Force activate immediately
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', function(event) {
  console.log('ServiceWorker: Activate event');

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('ServiceWorker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', function(event) {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(function(response) {
        // Return cached version if available
        if (response) {
          console.log('ServiceWorker: Serving from cache', request.url);
          return response;
        }

        // Otherwise fetch from network
        console.log('ServiceWorker: Fetching from network', request.url);
        return fetch(request).then(function(response) {
          // Don't cache if not successful
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          // Cache static assets for future use
          if (shouldCacheRequest(request)) {
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(request, responseToCache);
              })
              .catch(function(error) {
                console.warn('ServiceWorker: Failed to cache', request.url, error);
              });
          }

          return response;
        });
      })
      .catch(function(error) {
        console.error('ServiceWorker: Fetch failed', request.url, error);

        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }

        // For other requests, just let it fail
        throw error;
      })
  );
});

/**
 * Determine if a request should be cached
 */
function shouldCacheRequest(request) {
  const url = new URL(request.url);

  // Cache static assets
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    return true;
  }

  // Cache API responses (for learning purposes, be selective in production)
  if (url.pathname.startsWith('/api/')) {
    return false; // Don't cache API responses for now
  }

  // Cache HTML pages
  if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
    return true;
  }

  return false;
}

// Message event - handle messages from main thread
self.addEventListener('message', function(event) {
  console.log('ServiceWorker: Message received', event.data);

  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;

      case 'CACHE_URLS':
        if (event.data.urls) {
          cacheUrls(event.data.urls);
        }
        break;

      case 'CLEAR_CACHE':
        clearCache();
        break;

      default:
        console.log('ServiceWorker: Unknown message type', event.data.type);
    }
  }
});

/**
 * Cache specific URLs
 */
function cacheUrls(urls) {
  caches.open(CACHE_NAME)
    .then(function(cache) {
      return cache.addAll(urls);
    })
    .then(function() {
      console.log('ServiceWorker: URLs cached successfully');
    })
    .catch(function(error) {
      console.error('ServiceWorker: Failed to cache URLs', error);
    });
}

/**
 * Clear all caches
 */
function clearCache() {
  caches.keys()
    .then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
    .then(function() {
      console.log('ServiceWorker: All caches cleared');
    })
    .catch(function(error) {
      console.error('ServiceWorker: Failed to clear caches', error);
    });
}

// Background sync for offline actions (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', function(event) {
    console.log('ServiceWorker: Background sync', event.tag);

    if (event.tag === 'cart-sync') {
      event.waitUntil(syncCartData());
    }
  });
}

/**
 * Sync cart data when back online
 */
function syncCartData() {
  // Future implementation: sync offline cart changes
  console.log('ServiceWorker: Syncing cart data');
  return Promise.resolve();
}