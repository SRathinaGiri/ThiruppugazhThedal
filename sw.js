const CACHE_NAME = 'thiruppugazh-cache-v2';
// This list includes all our app files AND our data files
const urlsToCache = [
    '.',
    'index.html',
    'style.css',
    'app.js',
    'manifest.json',
    'omicon.png', // Make sure you have this icon
    'songs.json',
    'places.json',
    'songplaces.json',
    'alangkaram.json',
    'anthathi.json',
    'anuboothi.json',
    'mayilvirutham.json',
    'sevalvirutham.json',
    'vaguppu.json',
    'velvirutham.json',
    'murugan.png',
    'arunagiri.png',
    'main_title_icon.png',
    'srgiri.jpg',
    'sundaram.jpg',
    'about_light.html', // Cache the about pages too
    'about_dark.html'
];

// Install event: Open cache and add all our files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event: Serve from cache first, then network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response from cache
                if (response) {
                    return response;
                }
                // Not in cache - fetch from network
                return fetch(event.request);
            }
            )
    );
});