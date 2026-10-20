/* Network-first navigation: deployments and member pages never use stale HTML. */
const CACHE = "bbm-app-shell-v2";
const base = new URL("./", self.location.href);
const offline = new URL("app/offline.html", base).href;
const icon = new URL("app/icon-192.png?v=2", base).href;
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([
    offline, icon,
  ])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key.startsWith("bbm-app-shell-") && key !== CACHE)
    .map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  if (event.request.method === "GET" && event.request.url === icon) {
    event.respondWith(caches.match(icon).then((cached) => cached || fetch(event.request)));
    return;
  }
  if (event.request.mode !== "navigate" || event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(offline)));
});
