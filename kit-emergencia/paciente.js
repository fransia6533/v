/* ============================================================================
   paciente.js — Ficha del paciente (editable) y cálculo de dosis por peso.
   El peso/sangre se editan acá y se guardan en el teléfono. Si el médico
   puso una "dosis por kg" en un ítem, la app calcula la dosis para tu peso.
   ============================================================================ */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const KEY = "paciente_v1";

  const CAMPOS = [
    { id: "nombre", label: "Nombre" },
    { id: "peso", label: "Peso (kg)" },
    { id: "altura", label: "Altura (cm)" },
    { id: "grupoSanguineo", label: "Grupo sanguíneo" },
    { id: "edad", label: "Edad" },
    { id: "alergiasConocidas", label: "Alergias conocidas" },
    { id: "contactoEmergencia", label: "Contacto de emergencia" },
    { id: "rescateMontana", label: "Rescate de montaña (teléfono)" },
    { id: "revisadoPor", label: "Revisado por (médico)" },
    { id: "fechaRevision", label: "Fecha de revisión" }
  ];

  function semilla() {
    return {
      nombre: META.paciente || "",
      peso: (META.peso || "").replace(/[^\d.,]/g, "") || "",
      altura: (META.altura || "").replace(/[^\d.,]/g, "") || "",
      grupoSanguineo: META.grupoSanguineo || "",
      edad: "",
      alergiasConocidas: META.alergiasConocidas || "",
      contactoEmergencia: META.contactoEmergencia || "",
      rescateMontana: META.rescateMontana || "",
      revisadoPor: META.revisadoPor || "",
      fechaRevision: META.fechaRevision || ""
    };
  }

  function cargar() {
    try { const r = localStorage.getItem(KEY); if (r) return Object.assign(semilla(), JSON.parse(r)); } catch (e) {}
    return semilla();
  }
  let datos = cargar();
  function guardar() { localStorage.setItem(KEY, JSON.stringify(datos)); }

  function pesoKg() {
    const n = parseFloat(String(datos.peso).replace(",", "."));
    return isNaN(n) || n <= 0 ? null : n;
  }

  // Calcula la dosis a partir de "dosis por kg" (ej "10 mg/kg, máx 50 mg")
  function calcular(item) {
    const s = (item && item.dosisPorKg) || "";
    if (!s || /_{2,}/.test(s) || !/kg/i.test(s)) return null; // sin regla válida
    const peso = pesoKg();
    if (!peso) return null;
    const num = s.match(/([\d]+(?:[.,]\d+)?)\s*(mg|ml|mcg|g)?\s*\/\s*kg/i);
    if (!num) return null;
    const porKg = parseFloat(num[1].replace(",", "."));
    if (!porKg) return null;
    const unidad = (num[2] || "mg").toLowerCase();
    let dosis = porKg * peso;
    let tope = false;
    const cap = s.match(/m[áa]x\.?\s*([\d]+(?:[.,]\d+)?)/i);
    if (cap) { const c = parseFloat(cap[1].replace(",", ".")); if (dosis > c) { dosis = c; tope = true; } }
    const r = Math.round(dosis * 100) / 100;
    return "≈ " + r + " " + unidad + " para " + peso + " kg" + (tope ? " (tope)" : "");
  }

  // ---------- pantalla Datos (editable) ----------
  function render() {
    const cont = $("#datosContenido");
    if (!cont) return;
    let html = '<p class="hint-bot" style="padding:0 2px 8px">Estos datos se guardan en tu teléfono. El <b>peso</b> cambia las dosis calculadas del botiquín.</p>';
    CAMPOS.forEach((c) => {
      const val = datos[c.id] || "";
      const tipo = (c.id === "peso" || c.id === "altura" || c.id === "edad") ? 'inputmode="decimal"' : "";
      html += `<div class="campo-edit"><label for="p_${c.id}">${esc(c.label)}</label>` +
        `<input id="p_${c.id}" type="text" ${tipo} value="${esc(val)}" /></div>`;
    });
    html += '<div class="acciones-detalle"><button class="btn btn-ok" id="btnGuardarPaciente">💾 Guardar datos</button></div>';
    cont.innerHTML = html;
    $("#btnGuardarPaciente").addEventListener("click", () => {
      CAMPOS.forEach((c) => { datos[c.id] = ($("#p_" + c.id).value || "").trim(); });
      guardar();
      if (window.Botiquin) Botiquin.render(($("#busquedaBot") || {}).value || "");
      const b = $("#btnGuardarPaciente");
      b.textContent = "✅ Guardado";
      setTimeout(() => (b.textContent = "💾 Guardar datos"), 1500);
    });
  }

  function esc(s) { const d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }

  window.Paciente = {
    render, calcular, pesoKg,
    get: () => datos,
    set: (obj) => { datos = Object.assign(datos, obj || {}); guardar(); },
  };
})();
