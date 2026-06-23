/* Lógica de la app. No contiene contenido médico (eso vive en datos.js). */

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const lista = $("#lista");
  const listaItems = $("#listaItems");
  const detalle = $("#detalle");
  const detalleContenido = $("#detalleContenido");
  const busqueda = $("#busqueda");

  const normalizar = (t) =>
    (t || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, ""); // saca acentos para el buscador

  const itemPorId = (id) => ITEMS.find((i) => i.id === id);

  // ---- Render de la lista de escenarios ----
  function pintarLista(filtro) {
    const q = normalizar(filtro);
    const resultados = ESCENARIOS.filter((e) => {
      if (!q) return true;
      const heno = normalizar(
        e.titulo + " " + (e.sintomas || []).join(" ") + " " + e.pasos.join(" ")
      );
      return heno.includes(q);
    });

    lista.innerHTML = "";
    if (resultados.length === 0) {
      lista.innerHTML =
        '<p class="vacio">No encontré nada con eso.<br>Probá otra palabra o revisá la lista completa.</p>';
      return;
    }
    resultados.forEach((e) => {
      const btn = document.createElement("button");
      btn.className =
        "tarjeta " + e.gravedad + (e.validado ? "" : " sinvalidar");
      btn.innerHTML =
        `${escapar(e.titulo)}<br><span class="etiqueta">${gravedadTexto(
          e.gravedad
        )}</span>`;
      btn.addEventListener("click", () => abrirEscenario(e.id));
      lista.appendChild(btn);
    });
  }

  function gravedadTexto(g) {
    return g === "alta"
      ? "Urgente"
      : g === "media"
      ? "Importante"
      : "Leve";
  }

  // ---- Detalle de un escenario ----
  function abrirEscenario(id) {
    const e = ESCENARIOS.find((x) => x.id === id);
    if (!e) return;

    let html = "";
    html += `<h2>${escapar(e.titulo)}</h2>`;
    html += `<div class="banner-gravedad ${e.gravedad}">${gravedadTexto(
      e.gravedad
    )}</div>`;

    if (!e.validado) {
      html +=
        '<div class="alerta-validar">⚠️ Contenido borrador, pendiente de validar por el médico.</div>';
    }

    html += '<ol class="pasos">';
    e.pasos.forEach((p) => (html += `<li>${escapar(p)}</li>`));
    html += "</ol>";

    if (e.items && e.items.length) {
      html += '<div class="bloque"><h3>🎒 Qué usar del kit</h3><div class="chips">';
      e.items.forEach((iid) => {
        const it = itemPorId(iid);
        const nombre = it ? it.nombre : iid;
        html += `<button class="chip" data-item="${iid}">${escapar(
          nombre
        )}</button>`;
      });
      html += "</div></div>";
    }

    if (e.cuandoBajar) {
      html += `<div class="bloque bajar"><h3>🚁 Cuándo bajar / pedir rescate</h3>${escapar(
        e.cuandoBajar
      )}</div>`;
    }

    detalleContenido.innerHTML = html;
    detalleContenido
      .querySelectorAll(".chip[data-item]")
      .forEach((c) =>
        c.addEventListener("click", () => abrirItem(c.dataset.item))
      );

    mostrarDetalle();
  }

  // ---- Detalle de un ítem ----
  function abrirItem(id) {
    const it = itemPorId(id);
    if (!it) return;
    let html = `<h2>${escapar(it.nombre)}</h2>`;
    if (!it.validado) {
      html +=
        '<div class="alerta-validar">⚠️ Pendiente de validar por el médico.</div>';
    }
    html += `<div class="bloque"><h3>Para qué sirve</h3>${escapar(
      it.paraQue
    )}</div>`;
    html += `<div class="bloque"><h3>Cómo usar</h3>${escapar(it.comoUsar)}</div>`;
    if (it.cuidado) {
      html += `<div class="bloque"><h3>Cuidado</h3>${escapar(it.cuidado)}</div>`;
    }
    detalleContenido.innerHTML = html;
    mostrarDetalle();
  }

  // ---- Datos personales / rescate ----
  function abrirDatos() {
    let html = `<h2>📋 Mis datos y rescate</h2>`;
    html += '<dl class="datos">';
    html += fila("Paciente", META.paciente);
    html += fila("Alergias conocidas", META.alergiasConocidas);
    html += fila("Grupo sanguíneo", META.grupoSanguineo);
    html += fila("Contacto de emergencia", META.contactoEmergencia);
    html += fila("Rescate de montaña", META.rescateMontana);
    html += fila("Revisado por", META.revisadoPor);
    html += fila("Fecha de revisión", META.fechaRevision);
    html += "</dl>";
    detalleContenido.innerHTML = html;
    mostrarDetalle();
  }

  function fila(dt, dd) {
    return `<dt>${escapar(dt)}</dt><dd>${escapar(dd)}</dd>`;
  }

  // ---- Glosario de ítems ----
  function pintarItems() {
    listaItems.innerHTML = "";
    ITEMS.forEach((it) => {
      const b = document.createElement("button");
      b.className = "item-btn";
      b.textContent = it.nombre;
      b.addEventListener("click", () => abrirItem(it.id));
      listaItems.appendChild(b);
    });
  }

  // ---- Utilidades de UI ----
  function mostrarDetalle() {
    detalle.classList.remove("oculto");
    detalle.scrollTop = 0;
    window.scrollTo(0, 0);
  }
  function ocultarDetalle() {
    detalle.classList.add("oculto");
  }
  function escapar(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  // ---- Eventos ----
  busqueda.addEventListener("input", (e) => pintarLista(e.target.value));
  $("#volver").addEventListener("click", ocultarDetalle);
  $("#btnDatos").addEventListener("click", abrirDatos);
  $("#cerrarAviso").addEventListener("click", () =>
    $("#aviso").classList.add("oculto")
  );

  // ---- Inicio ----
  pintarLista("");
  pintarItems();
  $("#versionApp").textContent = "v" + (META.version || "");

  // ---- Service worker (offline) ----
  const estado = $("#estadoOffline");
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("sw.js")
      .then(() => (estado.textContent = "✅ Listo para usar sin internet"))
      .catch(() => (estado.textContent = "⚠️ No se pudo activar el modo offline"));
  } else {
    estado.textContent = "Modo offline no soportado en este navegador";
  }
})();
