const CACHE_NAME = 'haru-cache-v1';
const urlsToCache = [
  'index.html',
  'road.html',
  'river.html',
  'sabo.html',
  'steep_slope.html',
  'farmland.html',
  'agricultural_facilities.html',
  'forest_road.html',
  'forest_collapse.html',
  'other.html',
  'calc.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});