/* Network-first navigation: deployments and member pages never use stale HTML. */
const CACHE = "bbm-app-shell-v1";
const base = new URL("./", self.location.href);
const offline = new URL("app/offline.html", base).href;
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([
    offline, new URL("app/icon-192.png", base).href,
  ])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key.startsWith("bbm-app-shell-") && key !== CACHE)
    .map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate" || event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(offline)));
});
