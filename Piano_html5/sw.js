const CACHE_NAME = "flat-piano-studio-v2";
const APP_SHELL = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.json",
    "./icon-128.png",
    "./icon-256.png",
    "./media/do.ogg",
    "./media/re.ogg",
    "./media/me.ogg",
    "./media/fa.ogg",
    "./media/sol.ogg",
    "./media/la.ogg",
    "./media/si.ogg",
    "./media/do_h.ogg",
    "./media/do_th.ogg",
    "./media/re_th.ogg",
    "./media/fa_th.ogg",
    "./media/sol_th.ogg",
    "./media/la_th.ogg",
    "./media/do.m4a",
    "./media/re.m4a",
    "./media/me.m4a",
    "./media/fa.m4a",
    "./media/sol.m4a",
    "./media/la.m4a",
    "./media/si.m4a",
    "./media/do_h.m4a",
    "./media/do_th.m4a",
    "./media/re_th.m4a",
    "./media/fa_th.m4a",
    "./media/sol_th.m4a",
    "./media/la_th.m4a"
];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
        }))
    );
});
