/* app.js — navegación, escenarios de emergencia, datos y cableado general. */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);

  function escapar(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }
  const normalizar = (t) =>
    (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // ===================== NAVEGACIÓN =====================
  function mostrarSeccion(sec) {
    document.querySelectorAll(".seccion").forEach((s) => s.classList.add("oculta"));
    $("#sec-" + sec).classList.remove("oculta");
    document.querySelectorAll(".nav-btn").forEach((b) =>
      b.classList.toggle("activo", b.dataset.sec === sec)
    );
    if (sec === "emergencias" && window.Chat) Chat.iniciar();
    if (sec === "botiquin") Botiquin.render($("#busquedaBot").value);
    if (sec === "datos") pintarDatos();
    if (sec !== "camara" && window.Camara) window.Camara.cerrar();
  }
  document.querySelectorAll(".nav-btn").forEach((b) =>
    b.addEventListener("click", () => mostrarSeccion(b.dataset.sec))
  );

  // ===================== EMERGENCIAS (chat asistente) =====================
  // El chat se maneja en chat.js. Acá solo cableamos el input.

  // ===================== DATOS (editable) =====================
  function pintarDatos() {
    if (window.Paciente) Paciente.render();
  }

  // ===================== MODAL (compartido) =====================
  window.abrirModal = function (html) {
    $("#detalleContenido").innerHTML = html;
    const det = $("#detalle");
    det.classList.remove("oculta");
    det.scrollTop = 0;
    window.scrollTo(0, 0);
  };
  $("#volver").addEventListener("click", () => $("#detalle").classList.add("oculta"));

  // ===================== EVENTOS =====================
  function enviarChat() {
    const inp = $("#busqueda");
    if (window.Chat) Chat.enviar(inp.value);
  }
  $("#busqueda").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); enviarChat(); } });
  $("#btnEnviar").addEventListener("click", enviarChat);
  $("#cerrarAviso").addEventListener("click", () => $("#aviso").classList.add("oculta"));

  // Botiquín
  $("#busquedaBot").addEventListener("input", (e) => Botiquin.buscar(e.target.value));
  $("#btnAgregar").addEventListener("click", () => Botiquin.nuevo());
  $("#btnExportar").addEventListener("click", () => Botiquin.exportar());
  $("#btnImportar").addEventListener("click", () => $("#fileImport").click());
  $("#fileImport").addEventListener("change", (e) => {
    if (e.target.files[0]) Botiquin.importar(e.target.files[0]);
    e.target.value = "";
  });

  // Cámara
  $("#btnAbrirCam").addEventListener("click", () => Camara.abrir());
  $("#btnCapturar").addEventListener("click", () => Camara.capturar());
  $("#btnGaleria").addEventListener("click", () => $("#fileFoto").click());
  $("#fileFoto").addEventListener("change", (e) => {
    if (e.target.files[0]) Camara.desdeArchivo(e.target.files[0]);
    e.target.value = "";
  });
  $("#btnGuardarKey").addEventListener("click", () => {
    Camara.guardarKey($("#apiKey").value.trim());
    $("#estadoKey").textContent = Camara.tieneKey() ? "✅ Clave guardada" : "Sin clave";
  });

  // ===================== ACTUALIZAR (forzar última versión) =====================
  // Botón a prueba de balas contra "me quedé pegado en una versión vieja":
  // borra TODO lo guardado (service worker + cachés) y recarga sin caché.
  async function forzarActualizar() {
    const btn = $("#btnActualizar");
    if (btn) { btn.disabled = true; btn.textContent = "⏳ Actualizando…"; }
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (e) { /* seguimos igual */ }
    // recarga saltando la caché del navegador (cache-buster en la URL)
    const u = new URL(window.location.href);
    u.searchParams.set("v", String(Date.now()));
    window.location.replace(u.toString());
  }
  const btnAct = $("#btnActualizar");
  if (btnAct) btnAct.addEventListener("click", forzarActualizar);

  // ===================== INICIO =====================
  if (window.Chat) Chat.iniciar();
  $("#versionApp").textContent = "v" + (META.version || "");
  $("#estadoKey").textContent = window.Camara && Camara.tieneKey() ? "✅ Clave guardada" : "";

  const estado = $("#estadoOffline");
  if ("serviceWorker" in navigator) {
    // Si llega una versión nueva del service worker y toma control,
    // recargamos UNA sola vez para que el usuario nunca quede pegado en
    // una versión vieja (problema típico: seguía viendo la v0.4).
    let recargando = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (recargando) return;
      recargando = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("sw.js")
      .then((reg) => {
        estado.textContent = "✅ Listo para usar sin internet";
        // Buscar actualización al abrir y cada 60 s mientras esté abierta.
        reg.update().catch(() => {});
        setInterval(() => reg.update().catch(() => {}), 60000);
        // Si hay un SW esperando, pedirle que tome el control ya.
        if (reg.waiting) reg.waiting.postMessage("activar-ya");
        reg.addEventListener("updatefound", () => {
          const nuevo = reg.installing;
          if (!nuevo) return;
          nuevo.addEventListener("statechange", () => {
            if (nuevo.state === "installed" && navigator.serviceWorker.controller) {
              nuevo.postMessage("activar-ya");
            }
          });
        });
      })
      .catch(() => (estado.textContent = "⚠️ No se pudo activar el modo offline"));
  } else {
    estado.textContent = "Modo offline no soportado";
  }
})();
