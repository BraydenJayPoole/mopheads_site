const CACHE_NAME = 'mopheads-site-v3'; // Increment version number when changing cache contents
const urlsToCache = [
  '/',
  // Add other static assets you want to cache here, e.g.:
  // '/css/styles.css',
  // '/js/script.js',
  // '/images/logo.png',
  // ...
];

self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache open or addAll failed:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('mopheads-site-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
        console.log("Service worker now ready to handle fetches!");
        return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  //console.log('Fetch event for:', event.request.url);
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        //console.log('Found in cache:', event.request.url);
        return response; // Serve from cache
      }

      //console.log('Not found in cache, fetching from network:', event.request.url);
      return fetch(event.request).then(networkResponse => {
        // Check if the response is valid
        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.
        var responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME)
          .then(function(cache) {
            cache.put(event.request, responseToCache);
          });

        return networkResponse;
      }).catch(function() {
        // If the network is unavailable, try to serve an offline page.
        // You might have a specific offline page for different routes.
        if (event.request.mode === 'navigate') {
            return caches.match('/offline.html'); // Example
        }
        return new Response("Network unavailable", {
            status: 503,
            statusText: "Service Unavailable"
        });
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data.type === 'check-cache') {
    const urlToCheck = event.data.url;
    caches.match(urlToCheck).then(response => {
      event.source.postMessage({ type: 'cache-check-result', url: urlToCheck, inCache: !!response });
    });
  }
});