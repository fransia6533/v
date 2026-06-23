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

  // ---------- lista de situaciones (con búsqueda tolerante a errores) ----------
  function lista(filtro) {
    estado = null;
    const cont = $("#lista");
    const q = (filtro || "").trim();
    cont.innerHTML = "";

    const intro = document.createElement("p");
    intro.className = "hint-bot";
    intro.style.padding = "0 2px 4px";
    intro.textContent = "Tocá lo que te pasó y te hago unas preguntas para guiarte.";
    cont.appendChild(intro);

    let situaciones;
    if (!q) {
      situaciones = TRIAGE.slice();
    } else {
      const wrap = TRIAGE.map((s) => ({ objeto: s.titulo, tambien: (s.sintomas || []).join(", "), _sit: s }));
      situaciones = Fuzzy.rankear(q, wrap).filter((x) => x.score >= 0.4).map((x) => x.item._sit);
      if (situaciones.length === 0) situaciones = TRIAGE.slice();
    }

    situaciones.forEach((s) => {
      const btn = document.createElement("button");
      btn.className = "tarjeta triage-card";
      btn.textContent = s.titulo;
      btn.addEventListener("click", () => empezar(s.id));
      cont.appendChild(btn);
    });
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
