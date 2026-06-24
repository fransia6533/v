/* Service worker: guarda la app en el teléfono para usarla SIN internet.
   Si cambiás archivos, subí el número de versión (CACHE) para forzar la
   actualización. */
const CACHE = "kit-emergencia-v19";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./datos.js",
  "./paciente.js",
  "./chat.js",
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

// Si la página pide activar la versión nueva ya mismo, lo hacemos.
self.addEventListener("message", (e) => {
  if (e.data === "activar-ya") self.skipWaiting();
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
  // Network-first: si hay señal, siempre trae la última versión y la guarda.
  // Sin señal (montaña), usa lo guardado. Así no quedás con una versión vieja.
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
