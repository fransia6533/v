/* ============================================================================
   camara.js — Identificar un objeto del botiquín por foto.
   - Offline: intenta leer el texto de la etiqueta (TextDetector si el
     navegador lo soporta) y lo busca en TU botiquín. No inventa nada.
   - Online (con señal + clave de API): manda la foto a Claude para que la
     identifique y devuelva el procedimiento que cargó tu médico.
   ========================================================================== */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const KEY_API = "api_key_claude";
  let stream = null;
  let ultimaFoto = null; // base64 (sin encabezado)

  function escapar(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }
  const normalizar = (t) =>
    (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // ---------- cámara ----------
  async function abrirCamara() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }, audio: false,
      });
      const v = $("#video");
      v.srcObject = stream;
      v.classList.remove("oculta");
      $("#fotoPrevia").classList.add("oculta");
      $("#btnAbrirCam").classList.add("oculta");
      $("#btnCapturar").classList.remove("oculta");
    } catch (e) {
      setEstado("No pude abrir la cámara (" + e.message + "). Probá «Elegir foto».");
    }
  }
  function capturar() {
    const v = $("#video");
    const c = $("#canvas");
    c.width = v.videoWidth || 720;
    c.height = v.videoHeight || 960;
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    mostrarFoto(c.toDataURL("image/jpeg", 0.85));
    cerrarStream();
  }
  function cerrarStream() {
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    $("#video").classList.add("oculta");
    $("#btnCapturar").classList.add("oculta");
    $("#btnAbrirCam").classList.remove("oculta");
  }
  function desdeArchivo(file) {
    const reader = new FileReader();
    reader.onload = () => mostrarFoto(reader.result);
    reader.readAsDataURL(file);
  }
  function mostrarFoto(dataUrl) {
    const img = $("#fotoPrevia");
    img.src = dataUrl;
    img.classList.remove("oculta");
    ultimaFoto = dataUrl.split(",")[1];
    analizar(dataUrl);
  }

  // ---------- análisis ----------
  async function analizar(dataUrl) {
    const online = navigator.onLine;
    const apiKey = localStorage.getItem(KEY_API);
    setResultado('<p class="cargando">Analizando…</p>');

    if (online && apiKey) {
      try {
        await analizarNube(apiKey);
        return;
      } catch (e) {
        setResultado('<p class="alerta-validar">No pude usar la IA en la nube (' + escapar(e.message) + '). Probando lectura offline…</p>');
      }
    }
    await analizarOffline(dataUrl);
  }

  // ----- offline: TextDetector + match con el botiquín -----
  async function analizarOffline(dataUrl) {
    let texto = "";
    if ("TextDetector" in window) {
      try {
        const img = await cargarImagen(dataUrl);
        const det = new window.TextDetector();
        const bloques = await det.detect(img);
        texto = bloques.map((b) => b.rawValue).join(" ");
      } catch (e) {}
    }
    if (!texto) {
      setResultado(
        '<div class="alerta-validar">Sin señal no pude leer la etiqueta en este teléfono. ' +
        'Usá el buscador del <b>Botiquín</b> para encontrar el ítem a mano, o sacá la foto donde tengas señal.</div>'
      );
      return;
    }
    const match = buscarEnBotiquin(texto);
    if (match) {
      setResultado(renderItem(match, "Leído de la etiqueta: «" + escapar(texto.slice(0, 60)) + "…»"));
    } else {
      setResultado(
        '<div class="alerta-validar">Leí «' + escapar(texto.slice(0, 80)) +
        '» pero no coincide con ningún ítem de tu botiquín. Buscalo a mano en el Botiquín.</div>'
      );
    }
  }
  function cargarImagen(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  }
  function buscarEnBotiquin(texto) {
    const t = normalizar(texto);
    const items = window.Botiquin ? window.Botiquin.datos() : [];
    let mejor = null, mejorLen = 0;
    items.forEach((it) => {
      const palabras = normalizar(it.objeto).split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
      palabras.forEach((p) => {
        if (t.includes(p) && p.length > mejorLen) { mejor = it; mejorLen = p.length; }
      });
    });
    return mejor;
  }

  // ----- nube: Claude visión -----
  async function analizarNube(apiKey) {
    const items = window.Botiquin ? window.Botiquin.datos() : [];
    const contexto = items
      .map((it) => `- ${it.objeto} | dosis: ${it.dosis} | vía: ${it.via} | procedimiento: ${it.procedimiento} | comentario: ${it.comentario}`)
      .join("\n");
    const paciente = `Paciente: ${META.paciente}, ${META.altura}, ${META.peso}, sangre ${META.grupoSanguineo}, alergias: ${META.alergiasConocidas}.`;
    const prompt =
      "Sos un asistente de primeros auxilios. Mirá la foto e identificá cuál de estos ítems del botiquín es. " +
      "Respondé SOLO con información del botiquín de abajo (no inventes dosis ni procedimientos). " +
      "Si no estás seguro, decilo claramente. Respondé en español, breve y claro.\n\n" +
      paciente + "\n\nBOTIQUÍN:\n" + contexto +
      "\n\nFormato de respuesta:\n1) Qué objeto es.\n2) Dosis y vía (tal cual el botiquín).\n3) Procedimiento.\n4) Recordá pedir rescate si es grave.";

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: ultimaFoto } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error("HTTP " + resp.status + " " + t.slice(0, 120));
    }
    const json = await resp.json();
    const texto = (json.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    setResultado(
      '<div class="bloque-nube"><div class="badge-ia">🤖 IA (nube)</div>' +
      "<div class='texto-ia'>" + escapar(texto).replace(/\n/g, "<br>") + "</div>" +
      '<p class="hint-bot">Verificá siempre con lo que cargó tu médico.</p></div>'
    );
  }

  function renderItem(it, origen) {
    return (
      '<div class="bloque-nube">' +
      (origen ? '<div class="hint-bot">' + origen + "</div>" : "") +
      "<h3>" + escapar(it.objeto) + "</h3>" +
      "<p><b>Dosis/vía:</b> " + escapar(it.dosis) + " · " + escapar(it.via) + "</p>" +
      "<p><b>Procedimiento:</b> " + escapar(it.procedimiento) + "</p>" +
      (it.comentario ? "<p><b>Comentario:</b> " + escapar(it.comentario) + "</p>" : "") +
      (it.validado ? "" : '<div class="alerta-validar">⚠️ Pendiente de validar por el médico.</div>') +
      "</div>"
    );
  }

  // ---------- helpers UI ----------
  function setEstado(t) { $("#estadoCamara").innerHTML = t; }
  function setResultado(html) { $("#resultadoFoto").innerHTML = html; }

  window.Camara = {
    abrir: abrirCamara,
    capturar,
    desdeArchivo,
    cerrar: cerrarStream,
    guardarKey: (k) => {
      if (k) localStorage.setItem(KEY_API, k); else localStorage.removeItem(KEY_API);
    },
    tieneKey: () => !!localStorage.getItem(KEY_API),
  };
})();
