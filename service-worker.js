// service-worker.js

const CACHE_NAME = 'pokemon-damage-calculator-v4';
const baseUrl = "https://poke-type-75aw.onrender.com"
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/icon-192.png',
    '/icon-512.png',
].map(path => baseUrl + path)

// Install Service Worker and Cache Static Assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Opened cache');
            return cache.addAll(URLS_TO_CACHE);
        })
    );
});

// Activate Service Worker and Clean Old Caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch Event to Serve Cached Files or Fetch from Network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match('/index.html')
        // caches.match(event.request).then(response => {
//             return response || fetch(event.request).then(fetchResponse => {
//                 // Cache new files
//                 return caches.open(CACHE_NAME).then(cache => {
//                     cache.put(event.request, fetchResponse.clone());
//                     return fetchResponse;
//                 });
//             });
//         }).catch(() => caches.match('/index.html')) // Serve app shell when offline
    );
});
