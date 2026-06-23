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

  // ===================== INICIO =====================
  if (window.Chat) Chat.iniciar();
  $("#versionApp").textContent = "v" + (META.version || "");
  $("#estadoKey").textContent = window.Camara && Camara.tieneKey() ? "✅ Clave guardada" : "";

  const estado = $("#estadoOffline");
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(() => (estado.textContent = "✅ Listo para usar sin internet"))
      .catch(() => (estado.textContent = "⚠️ No se pudo activar el modo offline"));
  } else {
    estado.textContent = "Modo offline no soportado";
  }
})();
