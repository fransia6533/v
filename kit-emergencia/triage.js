/* ============================================================================
   triage.js — Asistente de primeros auxilios que pregunta.
   Escribís qué te pasó -> te hace preguntas -> te guía. Offline, sin IA.
   ============================================================================ */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }
  function gravedadTexto(g) {
    return g === "alta" ? "Urgente" : g === "media" ? "Importante" : "Leve";
  }

  let estado = null; // { sit, nodeId, hist: [] }

  // ---------- lista (mezcla situaciones + ítems del botiquín, tolerante a errores) ----------
  function lista(filtro) {
    estado = null;
    const cont = $("#lista");
    const q = (filtro || "").trim();
    cont.innerHTML = "";

    const intro = document.createElement("p");
    intro.className = "hint-bot";
    intro.style.padding = "0 2px 4px";
    intro.textContent = q
      ? "Resultados para «" + q + "»:"
      : "Escribí qué te pasó (ej: me partí la pierna) o un medicamento (ej: adrenalina).";
    cont.appendChild(intro);

    let resultados;
    if (!q) {
      resultados = TRIAGE.map((s) => ({ tipo: "sit", _sit: s }));
    } else {
      const cand = [];
      TRIAGE.forEach((s) => cand.push({ tipo: "sit", objeto: s.titulo, tambien: (s.sintomas || []).join(", "), _sit: s }));
      const items = window.Botiquin ? window.Botiquin.datos() : [];
      items.forEach((it) => cand.push({ tipo: "item", objeto: it.objeto, tambien: it.tambien || "", _item: it }));
      resultados = Fuzzy.rankear(q, cand).filter((x) => x.score >= 0.4).map((x) => x.item);
      if (resultados.length === 0) resultados = TRIAGE.map((s) => ({ tipo: "sit", _sit: s }));
    }

    resultados.forEach((r) => {
      const btn = document.createElement("button");
      if (r.tipo === "item") {
        btn.className = "tarjeta triage-card item-tag";
        btn.innerHTML = `${esc(r._item.objeto)}<br><span class="etiqueta">💊 del botiquín — cómo usar</span>`;
        btn.addEventListener("click", () => mostrarItem(r._item));
      } else {
        btn.className = "tarjeta triage-card";
        btn.innerHTML = `${esc(r._sit.titulo)}<br><span class="etiqueta">🩹 te hago preguntas</span>`;
        btn.addEventListener("click", () => empezar(r._sit.id));
      }
      cont.appendChild(btn);
    });
  }

  // ---------- detalle de un ítem del botiquín (con dosis por peso) ----------
  function mostrarItem(it) {
    const cont = $("#lista");
    cont.innerHTML = "";
    const barra = document.createElement("div");
    barra.className = "triage-barra";
    const atras = document.createElement("button");
    atras.className = "btn";
    atras.textContent = "← Volver";
    atras.addEventListener("click", () => lista(($("#busqueda") || {}).value || ""));
    barra.appendChild(atras);
    cont.appendChild(barra);

    const calc = window.Paciente ? window.Paciente.calcular(it) : null;
    let html = `<div class="triage-resultado"><h2>💊 ${esc(it.objeto)}</h2>`;
    if (!it.validado) html += '<div class="alerta-validar">⚠️ Pendiente de validar por el médico.</div>';
    if (calc) html += `<div class="bloque dosis-calc"><h3>Dosis para tu peso</h3>${esc(calc)} <span class="mini-aviso">⚠️ validar</span></div>`;
    if (it.dosis) html += `<div class="bloque"><h3>Dosis</h3>${esc(it.dosis)}</div>`;
    if (it.via) html += `<div class="bloque"><h3>Vía</h3>${esc(it.via)}</div>`;
    if (it.procedimiento) html += `<div class="bloque"><h3>Cómo y dónde usar</h3>${esc(it.procedimiento)}</div>`;
    if (it.comentario) html += `<div class="bloque"><h3>Comentario del médico</h3>${esc(it.comentario)}</div>`;
    html += "</div>";
    const div = document.createElement("div");
    div.innerHTML = html;
    cont.appendChild(div);
    window.scrollTo(0, 0);
  }

  function empezar(id) {
    const sit = TRIAGE.find((s) => s.id === id);
    if (!sit) return;
    estado = { sit, nodeId: sit.inicio, hist: [] };
    pintarNodo();
  }

  // ---------- pintar un nodo (pregunta o resultado) ----------
  function pintarNodo() {
    const cont = $("#lista");
    const nodo = estado.sit.nodos[estado.nodeId];
    cont.innerHTML = "";

    // barra superior: volver
    const barra = document.createElement("div");
    barra.className = "triage-barra";
    const atras = document.createElement("button");
    atras.className = "btn";
    atras.textContent = "← Atrás";
    atras.addEventListener("click", volver);
    const inicio = document.createElement("button");
    inicio.className = "btn";
    inicio.textContent = "Empezar de nuevo";
    inicio.addEventListener("click", () => lista(""));
    barra.appendChild(atras);
    barra.appendChild(inicio);
    cont.appendChild(barra);

    const titulo = document.createElement("div");
    titulo.className = "triage-titulo";
    titulo.textContent = estado.sit.titulo;
    cont.appendChild(titulo);

    if (nodo.pregunta) {
      const box = document.createElement("div");
      box.className = "triage-pregunta";
      box.innerHTML = `<div class="q-texto">${esc(nodo.pregunta)}</div>`;
      const ops = document.createElement("div");
      ops.className = "triage-ops";
      (nodo.opciones || []).forEach((op) => {
        const b = document.createElement("button");
        b.className = "btn triage-op";
        b.textContent = op.texto;
        b.addEventListener("click", () => {
          estado.hist.push(estado.nodeId);
          estado.nodeId = op.ir;
          pintarNodo();
        });
        ops.appendChild(b);
      });
      box.appendChild(ops);
      cont.appendChild(box);
    } else if (nodo.resultado) {
      const r = nodo.resultado;
      const card = document.createElement("div");
      card.className = "triage-resultado";
      let html = `<div class="banner-gravedad ${r.nivel}">${gravedadTexto(r.nivel)}</div>`;
      html += `<h2>${esc(r.titulo)}</h2>`;
      html += '<div class="alerta-validar">⚠️ Primeros auxilios generales, no un diagnóstico. Validar con tu médico. Ante la duda, pedí ayuda.</div>';
      html += '<ol class="pasos">';
      (r.pasos || []).forEach((p) => (html += `<li>${esc(p)}</li>`));
      html += "</ol>";
      if (r.cuandoBajar)
        html += `<div class="bloque bajar"><h3>🚁 Cuándo bajar / pedir rescate</h3>${esc(r.cuandoBajar)}</div>`;
      card.innerHTML = html;
      cont.appendChild(card);
    }
    window.scrollTo(0, 0);
  }

  function volver() {
    if (estado && estado.hist.length) {
      estado.nodeId = estado.hist.pop();
      pintarNodo();
    } else {
      lista("");
    }
  }

  window.Triage = { lista, empezar };
})();
