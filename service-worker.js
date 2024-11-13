// service-worker.js

const CACHE_NAME = 'pokemon-damage-calculator-v2';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json',
    '/service-worker.js',
    '/icon-192.png',
    '/icon-512.png',
    'https://pokeapi.co/api/v2/type',
    'https://pokeapi.co/api/v2/type/normal/',    // normal
    'https://pokeapi.co/api/v2/type/fighting/',  // fighting
    'https://pokeapi.co/api/v2/type/flying/',    // flying
    'https://pokeapi.co/api/v2/type/poison/',    // poison
    'https://pokeapi.co/api/v2/type/ground/',    // ground
    'https://pokeapi.co/api/v2/type/rock/',      // rock
    'https://pokeapi.co/api/v2/type/bug/',       // bug
    'https://pokeapi.co/api/v2/type/ghost/',     // ghost
    'https://pokeapi.co/api/v2/type/steel/',     // steel
    'https://pokeapi.co/api/v2/type/fire/',      // fire
    'https://pokeapi.co/api/v2/type/water/',     // water
    'https://pokeapi.co/api/v2/type/grass/',     // grass
    'https://pokeapi.co/api/v2/type/electric/',  // electric
    'https://pokeapi.co/api/v2/type/psychic/',   // psychic
    'https://pokeapi.co/api/v2/type/ice/',       // ice
    'https://pokeapi.co/api/v2/type/dragon/',    // dragon
    'https://pokeapi.co/api/v2/type/dark/',      // dark
    'https://pokeapi.co/api/v2/type/fairy/',     // fairy
    'https://pokeapi.co/api/v2/type/stellar/',   // stellar
    'https://pokeapi.co/api/v2/type/unknown/',   // unknown
    'https://pokeapi.co/api/v2/type/shadow/'     // shadow
];

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
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchResponse => {
                // Cache new files
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        }).catch(() => caches.match('/index.html')) // Serve app shell when offline
    );
});
