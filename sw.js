const CACHE_NAME = 'rivaj-inventory-cache-v9';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  'https://www.gstatic.com/images/branding/product/1x/google_gemini_128dp.png',
  'https://www.gstatic.com/images/branding/product/1x/google_gemini_256dp.png',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client'
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching essential assets');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
    // We only want to handle GET requests
    if (event.request.method !== 'GET') {
      return;
    }
  
    // Do not cache real-time database requests
    if (event.request.url.includes('.firebaseio.com')) {
      return fetch(event.request);
    }
  
    // Cache-first strategy for reliability
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // If we have a cached response, return it immediately
          if (cachedResponse) {
            return cachedResponse;
          }
  
          // If not in cache, fetch from the network
          return fetch(event.request).then(
            networkResponse => {
              // Check if we received a valid response
              if (!networkResponse || networkResponse.status !== 200) {
                return networkResponse;
              }
  
              // Clone the response because it's a one-time use stream
              const responseToCache = networkResponse.clone();
  
              caches.open(CACHE_NAME)
                .then(cache => {
                  // Do not cache chrome extension requests
                  if (!event.request.url.startsWith('chrome-extension://')) {
                     cache.put(event.request, responseToCache);
                  }
                });
  
              return networkResponse;
            }
          ).catch(error => {
              console.error('Service Worker: Fetch failed, and resource not in cache.', event.request.url, error);
              // The request will fail, which is the expected behavior when offline and not cached.
          });
        })
    );
});