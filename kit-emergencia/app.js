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
    if (sec === "botiquin") Botiquin.render($("#busquedaBot").value);
    if (sec === "datos") pintarDatos();
    if (sec !== "camara" && window.Camara) window.Camara.cerrar();
  }
  document.querySelectorAll(".nav-btn").forEach((b) =>
    b.addEventListener("click", () => mostrarSeccion(b.dataset.sec))
  );

  // ===================== EMERGENCIAS (escenarios) =====================
  function gravedadTexto(g) {
    return g === "alta" ? "Urgente" : g === "media" ? "Importante" : "Leve";
  }
  function pintarLista(filtro) {
    const lista = $("#lista");
    const q = normalizar(filtro);
    const res = ESCENARIOS.filter((e) => {
      if (!q) return true;
      return normalizar(e.titulo + " " + (e.sintomas || []).join(" ") + " " + e.pasos.join(" ")).includes(q);
    });
    lista.innerHTML = "";
    if (res.length === 0) {
      lista.innerHTML = '<p class="vacio">No encontré nada con eso.<br>Probá otra palabra.</p>';
      return;
    }
    res.forEach((e) => {
      const btn = document.createElement("button");
      btn.className = "tarjeta " + e.gravedad + (e.validado ? "" : " sinvalidar");
      btn.innerHTML = `${escapar(e.titulo)}<br><span class="etiqueta">${gravedadTexto(e.gravedad)}</span>`;
      btn.addEventListener("click", () => abrirEscenario(e.id));
      lista.appendChild(btn);
    });
  }
  function abrirEscenario(id) {
    const e = ESCENARIOS.find((x) => x.id === id);
    if (!e) return;
    let html = `<h2>${escapar(e.titulo)}</h2>`;
    html += `<div class="banner-gravedad ${e.gravedad}">${gravedadTexto(e.gravedad)}</div>`;
    if (!e.validado) html += '<div class="alerta-validar">⚠️ Contenido borrador, pendiente de validar por el médico.</div>';
    html += '<ol class="pasos">';
    e.pasos.forEach((p) => (html += `<li>${escapar(p)}</li>`));
    html += "</ol>";
    if (e.cuandoBajar)
      html += `<div class="bloque bajar"><h3>🚁 Cuándo bajar / pedir rescate</h3>${escapar(e.cuandoBajar)}</div>`;
    abrirModal(html);
  }

  // ===================== DATOS =====================
  function pintarDatos() {
    let html = '<dl class="datos">';
    html += fila("Paciente", META.paciente);
    html += fila("Altura", META.altura);
    html += fila("Peso", META.peso);
    html += fila("Grupo sanguíneo", META.grupoSanguineo);
    html += fila("Alergias conocidas", META.alergiasConocidas);
    html += fila("Contacto de emergencia", META.contactoEmergencia);
    html += fila("Rescate de montaña", META.rescateMontana);
    html += fila("Revisado por", META.revisadoPor);
    html += fila("Fecha de revisión", META.fechaRevision);
    html += "</dl>";
    $("#datosContenido").innerHTML = html;
  }
  function fila(dt, dd) {
    return `<dt>${escapar(dt)}</dt><dd>${escapar(dd)}</dd>`;
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
  $("#busqueda").addEventListener("input", (e) => pintarLista(e.target.value));
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
  pintarLista("");
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
