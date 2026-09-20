const VERSION = "neul-v0.40.15-v11-3d-layout";
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/i18n.js",
  "/pwa.js",
  "/webgl-venue.js",
  "/seat-map-intelligence.js",
  "/lib/ticket-lifecycle.js",
  "/enhancements.js",
  "/storage.js",
  "/manifest.webmanifest",
  "/data/events.js",
  "/data/artists.js",
  "/data/venues.js",
  "/data/discovery.js",
  "/data/taipei-dome-geometry.js",
  "/data/multi-venue-geometry.js",
  "/assets/hero-crowd-crisp.webp",
  "/assets/featured-live-4.webp",
  "/assets/featured-live-3.webp",
  "/assets/featured-live-2.webp",
  "/assets/featured-live-1.webp",
  "/assets/hero-live-crisp.webp",
  "/assets/featured-1-crisp.webp",
  "/assets/featured-2-crisp.webp",
  "/assets/featured-3-crisp.webp",
  "/assets/featured-4-crisp.webp",
  "/assets/feature-stage.webp",
  "/assets/venue-3d.webp",
  "/assets/seat-view.webp",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => ![STATIC_CACHE, RUNTIME_CACHE].includes(key)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ offline: true, results: [] }), {
        status: 503,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      }))
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) caches.open(RUNTIME_CACHE).then(cache => cache.put("/index.html", response.clone()));
          return response;
        })
        .catch(async () => (await caches.match("/index.html")) || (await caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(response => {
        if (response.ok && ["script", "style", "image", "font", "manifest"].includes(request.destination)) {
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, response.clone()));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});


self.addEventListener("push", event => {
  let data={}; try{data=event.data?.json()||{};}catch{data={body:event.data?.text()||"NEUL 有新的追星提醒"};}
  event.waitUntil(self.registration.showNotification(data.title||"NEUL",{body:data.body||"活動資訊有更新",icon:"/icons/icon-192.png",badge:"/icons/icon-192.png",tag:data.eventId||"neul-alert",data:{url:data.url||"/"}}));
});
self.addEventListener("notificationclick", event => {
  event.notification.close(); const url=event.notification.data?.url||"/";
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{for(const c of list){if("focus" in c){c.navigate(url);return c.focus();}}return clients.openWindow?clients.openWindow(url):undefined;}));
});
