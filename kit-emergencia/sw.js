/* Service worker: guarda la app en el teléfono para usarla SIN internet.
   Si cambiás archivos, subí el número de versión (CACHE) para forzar la
   actualización. */
const CACHE = "kit-emergencia-v3";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./datos.js",
  "./botiquin.js",
  "./camara.js",
  "./fuzzy.js",
  "./xlsx-mini.js",
  "./manifest.json",
  "./icono.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Cache-first: prioriza lo guardado, ideal para uso offline en la montaña.
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
