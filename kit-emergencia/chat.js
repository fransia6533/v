/* ============================================================================
   chat.js — Asistente conversacional offline (estilo chat).
   Le escribís lo que sentís y te responde: consejo + qué del botiquín tomar
   (con la dosis para tu peso) + cuándo preocuparte. Podés seguir preguntando.
   No es una IA que inventa: usa el contenido cargado (a validar por el médico).
   ============================================================================ */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  function esc(s) { const d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }

  let flujo = null;       // { sit, nodeId, hist }
  let arrancado = false;
  let ultimoTema = null;  // { nombre, items } — para entender "¿y qué me pongo?"

  // preguntas de seguimiento vagas que dependen del tema anterior
  const reSeguir = /^(y |y ahora |ahora |entonces |despues |y despues |y luego |bueno |ok )*(que (hago|hago ahora|mas hago|mas puedo hacer|sigue|hago despues|otra cosa hago)|que me (pongo|aplico|hecho|echo)|que me puedo (poner|aplicar|echar)|me puedo poner algo|me pongo algo|que mas|algo (mas )?(que )?(pueda|puedo) (hacer|poner|aplicar)|que mas puedo hacer|necesito (hacer )?algo mas|hay algo mas que pueda hacer|y despues|y luego|eso es grave|es grave|es peligroso|es serio|me tengo que preocupar|cuando (tengo que )?(bajar|preocuparme)|cuando (pido|llamo a?) (rescate|emergencias|ayuda))\s*\??$/;

  function cont() { return $("#lista"); }
  function scrollAbajo() { window.scrollTo(0, document.body.scrollHeight); }

  // ---------- burbujas ----------
  function burbuja(de, html) {
    const div = document.createElement("div");
    div.className = "msg msg-" + de;
    div.innerHTML = html;
    cont().appendChild(div);
    scrollAbajo();
    return div;
  }
  function botMsg(html) { return burbuja("bot", html); }
  function userMsg(texto) { return burbuja("user", esc(texto)); }

  function chipsItems(keywords, contenedor) {
    const items = resolverItems(keywords);
    if (!items.length) return;
    const wrap = document.createElement("div");
    wrap.className = "chat-ops";
    items.forEach((it) => {
      const dosis = (window.Paciente && window.Paciente.calcular(it)) || it.dosis || "";
      const b = document.createElement("button");
      b.className = "btn chip-item";
      b.innerHTML = "💊 " + esc(it.objeto.split(" (")[0]) + (dosis ? ' <span class="chip-dosis">' + esc(dosis) + "</span>" : "");
      b.addEventListener("click", () => { userMsg("¿Cómo uso " + it.objeto.split(" (")[0] + "?"); responderItem(it); });
      wrap.appendChild(b);
    });
    contenedor.appendChild(wrap);
    scrollAbajo();
  }

  // Detecta si el mensaje es una pregunta/uso sobre un remedio del kit.
  function preguntaMedicamento(norm) {
    if (typeof MEDICAMENTOS === "undefined" || typeof MED_MARCADOR === "undefined") return null;
    if (!MED_MARCADOR.test(norm)) return null;
    for (const m of MEDICAMENTOS) {
      if (m.re.test(norm)) {
        const data = window.Botiquin ? window.Botiquin.datos() : (typeof BOTIQUIN_DEFAULT !== "undefined" ? BOTIQUIN_DEFAULT : []);
        const it = data.find((x) => x.objeto === m.nombre) || data.find((x) => x.objeto.indexOf(m.nombre) === 0);
        if (it) return it;
      }
    }
    return null;
  }

  function resolverItems(keywords) {
    const data = window.Botiquin ? window.Botiquin.datos() : [];
    const out = [];
    (keywords || []).forEach((k) => {
      const r = window.Fuzzy ? window.Fuzzy.rankear(k, data) : [];
      if (r.length && r[0].score >= 0.55 && out.indexOf(r[0].item) < 0) out.push(r[0].item);
    });
    return out;
  }

  // ---------- glosario / definiciones ("¿qué es la anafilaxia?") ----------
  function definicion(norm) {
    if (typeof GLOSARIO === "undefined" || typeof DEF_MARCADOR === "undefined") return null;
    if (!DEF_MARCADOR.test(norm)) return null;
    const palabras = norm.split(/\s+/).filter((w) => w.length >= 4);
    let mejor = null, mejorS = 0;
    for (const g of GLOSARIO) {
      for (const k of g.claves) {
        let s = 0;
        if ((" " + norm + " ").includes(" " + k + " ")) s = 1 + k.length / 100; // coincidencia exacta
        else { // tolerante a typos: mejor palabra parecida
          for (const w of palabras) { const sim = window.Fuzzy.simPalabra(w, k); if (sim > s) s = sim * 0.9; }
        }
        if (s > mejorS && s >= 0.82) { mejorS = s; mejor = g; }
      }
    }
    return mejor;
  }
  function responderDefinicion(g) {
    let html = "📖 <b>" + esc(g.titulo) + "</b><br>" + esc(g.def);
    html += '<div class="mini-aviso" style="margin-top:8px">ℹ️ Explicación general. Si lo estás viviendo ahora, contame qué pasa y te ayudo paso a paso.</div>';
    botMsg(html);
    cierre();
  }

  // ---------- arranque ----------
  function iniciar() {
    if (arrancado) return;
    arrancado = true;
    cont().innerHTML = "";
    const nombre = (window.Paciente && window.Paciente.get().nombre) || "";
    botMsg(
      "Hola" + (nombre ? " " + esc(nombre) : "") + " 👋 Soy tu asistente del botiquín. " +
      "Contame qué sentís o qué te pasó y te ayudo con lo que tenés en el kit.<br><br>" +
      'Por ejemplo: <i>"me duele la cabeza"</i>, <i>"me corté"</i>, <i>"me partí la pierna"</i>, <i>"tengo náuseas"</i>.' +
      '<div class="mini-aviso" style="margin-top:8px">⚠️ Son consejos generales, no reemplazan al médico ni al rescate. Ante la duda, pedí ayuda.</div>'
    );
    sugerencias(["Me duele la cabeza", "Me corté", "Tengo náuseas", "Me partí la pierna"]);
  }

  function sugerencias(lista) {
    const wrap = document.createElement("div");
    wrap.className = "chat-ops sugerencias";
    lista.forEach((t) => {
      const b = document.createElement("button");
      b.className = "btn chip-sug";
      b.textContent = t;
      b.addEventListener("click", () => enviar(t));
      wrap.appendChild(b);
    });
    cont().appendChild(wrap);
    scrollAbajo();
  }

  // ---------- entrada del usuario ----------
  function enviar(texto) {
    texto = (texto || "").trim();
    if (!texto) return;
    if (!arrancado) iniciar();
    // sacar sugerencias viejas
    document.querySelectorAll(".sugerencias").forEach((e) => e.remove());
    userMsg(texto);
    flujo = null;
    responder(texto);
    const inp = $("#busqueda");
    if (inp) inp.value = "";
  }

  // modismos / formas coloquiales -> palabra que la app entiende
  const SLANG = {
    "guata": "panza", "guatita": "panza", "wawa": "panza",
    "pata": "pierna", "patas": "piernas", "pata rota": "pierna rota",
    "cabeza me estalla": "dolor de cabeza", "jaqueca": "dolor de cabeza",
    "chuchaqui": "resaca", "caña": "resaca", "goma": "resaca", "cruda": "resaca", "guayabo": "resaca",
    "me chante": "me desmaye", "me desplome": "me desmaye", "me desmaye": "me desmaye",
    "me saque la cresta": "me cai fuerte", "me saque la mugre": "me cai fuerte",
    "me pegue un costalazo": "me cai fuerte", "me di un porrazo": "me golpee fuerte",
    "me fui de boca": "me cai fuerte", "me fui de hocico": "me cai fuerte",
    "cototo": "chichon", "chichon": "golpe en la cabeza",
    "wea": " ", "weas": " ", "po": " ", "cachai": " ", "oe": " ", "loco": " ",
    "pucha": " ", "chuta": " ", "ufa": " ",
    "remedios": "remedio", "pastillas": "pastilla", "pastis": "pastilla", "remedito": "remedio",
  };
  // muletillas / interjecciones que no aportan y rompen el match de frase
  // ("amigo me duele la cabeza" debe valer igual que "me duele la cabeza")
  const MULETILLAS_FRASE = ["creo que", "parece que", "siento que", "me parece que",
    "la verdad que", "necesito ayuda", "necesito que me ayudes", "ayuda urgente", "es urgente", "es una urgencia"];
  // "ayuda/auxilio/urgente" son gritos de auxilio, no un síntoma: se descartan
  // para que "necesito ayuda me duele el brazo" valga igual que "me duele el brazo".
  const MULETILLAS = ("amigo amiga hermano hermana pana wey wn weon weón men " +
    "creo parece oye oiga hola disculpa disculpame perdon perdona perdoname mira " +
    "che socorro auxilio ayuda ayudame ayudenme porfa porfavor porfis uff uf ufff aaa ay " +
    "urgente urgentemente oye compadre causa brother bro hey eh").split(" ");
  const reMule = new RegExp("\\b(" + MULETILLAS_FRASE.concat(MULETILLAS).join("|") + ")\\b", "g");
  function expandir(t) {
    let s = " " + (t || "").toLowerCase() + " ";
    for (const k in SLANG) {
      s = s.split(" " + k + " ").join(" " + SLANG[k] + " ");
    }
    s = s.replace(reMule, " ");
    return s.replace(/\s+/g, " ").trim();
  }

  // ¿lo describe como algo fuerte/grave? (para reforzar el aviso)
  const reIntenso = /\b(mucho|muchisimo|demasiado|insoportable|no aguanto|no soporto|terrible|horrible|fortisimo|fuertisimo|cada vez peor|empeora|grave|urgente|brutal|espantoso|atroz|no para|sin parar)\b/;
  let intensoActual = false;

  function responder(textoOriginal) {
    const texto = expandir(textoOriginal);
    intensoActual = reIntenso.test(window.Fuzzy.normalizar(textoOriginal));
    const norm = window.Fuzzy.normalizar(texto);

    // ¿es una pregunta de DEFINICIÓN? ("¿qué es la anafilaxia?") -> explicamos.
    // Usamos el texto original (sin sacar muletillas) por si "que" se filtró.
    const def = definicion(window.Fuzzy.normalizar(textoOriginal));
    if (def) { responderDefinicion(def); return; }

    // ¿pregunta de SEGUIMIENTO vaga? ("¿y qué me pongo?", "¿qué hago ahora?",
    // "¿algo más que pueda hacer?") -> respondemos según el último tema.
    if (reSeguir.test(norm)) { responderSeguimiento(); return; }

    // si solo gritó "ayuda/auxilio/urgente" (quedó vacío), lo guiamos
    if (!texto || texto.length < 2) {
      const ag = CONSEJOS.find((c) => c.id === "ayuda-general");
      if (ag) { responderConsejo(ag); return; }
    }

    // ¿pregunta por un MEDICAMENTO concreto? ("¿puedo inyectar adrenalina?")
    // Mandamos info de ESE remedio, sin que otras palabras lo desvíen.
    const medIt = preguntaMedicamento(norm);
    if (medIt) { responderItem(medIt, true); return; }

    // 0) reglas de alta confianza: si hay una señal inequívoca (verbo de
    //    lesión, pedido de pastilla) rutea directo, sin pasar por la búsqueda.
    if (typeof REGLAS !== "undefined") {
      for (const rg of REGLAS) {
        if (rg.re.test(norm)) {
          if (rg.tipo === "sit") {
            const s = TRIAGE.find((x) => x.id === rg.id);
            if (s) { iniciarFlujo(s); return; }
          } else if (rg.tipo === "consejo") {
            const c = CONSEJOS.find((x) => x.id === rg.id);
            if (c) { responderConsejo(c); return; }
          }
        }
      }
    }

    // armar candidatos: situaciones graves + consejos + items
    const cand = [];
    TRIAGE.forEach((s) => cand.push({ objeto: s.titulo, tambien: (s.sintomas || []).join(", "), _t: "sit", _o: s }));
    CONSEJOS.forEach((c) => cand.push({ objeto: c.id.replace(/-/g, " "), tambien: (c.sintomas || []).join(", "), _t: "consejo", _o: c }));
    (window.Botiquin ? window.Botiquin.datos() : []).forEach((it) =>
      cand.push({ objeto: it.objeto, tambien: it.tambien || "", _t: "item", _o: it }));

    const rank = window.Fuzzy.rankear(texto, cand);
    let top = rank[0];
    // un ítem con match débil no debe ganarle a un síntoma/situación
    if (top && top.item._t === "item" && top.score < 0.62) {
      const alt = rank.find((r) => r.item._t !== "item" && r.score >= 0.45);
      if (alt) top = alt;
    }
    // una SITUACIÓN grave (lanza preguntas de emergencia) necesita más certeza:
    // si el match es flojo, no asustes con un soroche/infarto inventado. Mejor
    // un consejo razonable, y si tampoco hay, decí honestamente que no entendiste.
    if (top && top.item._t === "sit" && top.score < 0.6) {
      const alt = rank.find((r) => r.item._t === "consejo" && r.score >= 0.5);
      if (alt) top = alt;
      else if (top.score < 0.62) top = null;
    }

    if (!top || top.score < 0.45) {
      botMsg("Mmm, no te entendí bien 🤔. Probá decirlo más simple o con otras palabras — por ejemplo: <i>\"me duele la cabeza\"</i>, <i>\"me arde al orinar\"</i>, <i>\"me corté la mano\"</i>, <i>\"tengo fiebre\"</i>. También podés contarme qué parte del cuerpo y qué sentís.");
      sugerencias(["Me duele la cabeza", "Me mareo", "Tengo fiebre", "Me corté", "No sé qué tengo"]);
      return;
    }
    if (top.item._t === "sit") iniciarFlujo(top.item._o);
    else if (top.item._t === "consejo") responderConsejo(top.item._o);
    else responderItem(top.item._o);
  }

  // ---------- seguimiento ("¿y qué me pongo?") según el último tema ----------
  function responderSeguimiento() {
    if (ultimoTema && ultimoTema.items && ultimoTema.items.length) {
      const b = botMsg("Seguimos con <b>" + esc(ultimoTema.nombre.toLowerCase()) + "</b> 👇 Del botiquín te puede servir:");
      chipsItems(ultimoTema.items, b);
      cierre();
      return;
    }
    if (ultimoTema) {
      botMsg("Para <b>" + esc(ultimoTema.nombre.toLowerCase()) + "</b> ya te di los pasos arriba. Contame si apareció algo nuevo (más dolor, sangre, fiebre, etc.) y lo vemos.");
      cierre();
      return;
    }
    const ag = CONSEJOS.find((c) => c.id === "ayuda-general");
    if (ag) responderConsejo(ag);
  }

  // ---------- consejo (síntoma común) ----------
  function responderConsejo(c) {
    ultimoTema = { nombre: (c.titulo || c.id.replace(/-/g, " ")), items: c.items || [] };
    let html = "";
    if (c.titulo) html += "<b>" + esc(c.titulo) + "</b><br>";
    html += esc(c.mensaje);
    const b = botMsg(html);
    // pasos numerados (guías tipo RCP, Heimlich, posición de recuperación...)
    if (c.pasos && c.pasos.length) {
      const ol = document.createElement("ol");
      ol.className = "pasos-chat";
      c.pasos.forEach((p) => { const li = document.createElement("li"); li.innerHTML = esc(p); ol.appendChild(li); });
      b.appendChild(ol);
    }
    chipsItems(c.items, b);
    if (c.cuandoConsultar) {
      const w = document.createElement("div");
      w.className = "chat-alarma";
      w.innerHTML = "🚩 <b>Cuándo preocuparte:</b> " + esc(c.cuandoConsultar);
      b.appendChild(w);
    }
    if (intensoActual) {
      const e = document.createElement("div");
      e.className = "mini-aviso";
      e.style.marginTop = "8px";
      e.innerHTML = "⚠️ Lo describís como algo fuerte. Si no mejora pronto o va a peor, no lo dejes pasar: pedí ayuda.";
      b.appendChild(e);
    }
    cierre();
  }

  // ---------- item del botiquín ----------
  // esPregunta = lo pidió preguntando por el remedio ("¿puedo usar X?")
  function responderItem(it, esPregunta) {
    ultimoTema = { nombre: it.objeto.split(" (")[0], items: [] };
    const dosis = (window.Paciente && window.Paciente.calcular(it)) || null;
    let html = "<b>" + esc(it.objeto.split(" (")[0]) + "</b>";
    if (!it.validado) html += ' <span class="mini-aviso">⚠️ sin validar</span>';
    html += "<br>";
    if (esPregunta && it.tambien) html += '<span class="mini-aviso">Se usa para: ' + esc(it.tambien) + "</span><br>";
    if (it.procedimiento) html += esc(it.procedimiento) + "<br>";
    if (dosis) html += "<br><b>Para tu peso:</b> " + esc(dosis) + " ⚠️";
    else if (it.dosis) html += "<br><b>Dosis:</b> " + esc(it.dosis);
    if (it.via) html += "<br><b>Vía:</b> " + esc(it.via);
    if (esPregunta) html += '<br><span class="mini-aviso" style="margin-top:6px">⚠️ Usalo solo para lo que dice arriba. Si no es para tu caso, no te lo des. Tu médico valida dosis y uso.</span>';
    botMsg(html);
    cierre();
  }

  // ---------- flujo de preguntas (situación grave) ----------
  function iniciarFlujo(sit) {
    ultimoTema = { nombre: sit.titulo, items: (typeof SITUACION_ITEMS !== "undefined" && SITUACION_ITEMS[sit.id]) || [] };
    flujo = { sit, nodeId: sit.inicio, hist: [] };
    botMsg("Entiendo, vamos a ver <b>" + esc(sit.titulo.toLowerCase()) + "</b>. Te hago un par de preguntas 👇");
    pintarNodo();
  }
  function pintarNodo() {
    const nodo = flujo.sit.nodos[flujo.nodeId];
    if (nodo.pregunta) {
      const b = botMsg("❓ " + esc(nodo.pregunta));
      const wrap = document.createElement("div");
      wrap.className = "chat-ops";
      (nodo.opciones || []).forEach((op) => {
        const btn = document.createElement("button");
        btn.className = "btn triage-op";
        btn.textContent = op.texto;
        btn.addEventListener("click", () => {
          userMsg(op.texto);
          flujo.hist.push(flujo.nodeId);
          flujo.nodeId = op.ir;
          pintarNodo();
        });
        wrap.appendChild(btn);
      });
      b.appendChild(wrap);
      scrollAbajo();
    } else if (nodo.resultado) {
      const r = nodo.resultado;
      const grav = r.nivel === "alta" ? "🔴 Urgente" : r.nivel === "media" ? "🟠 Importante" : "🟢 Leve";
      let html = "<b>" + grav + " — " + esc(r.titulo) + "</b><br>";
      html += "<b>Qué hacer:</b><ol class='pasos-chat'>";
      (r.pasos || []).forEach((p) => (html += "<li>" + esc(p) + "</li>"));
      html += "</ol>";
      const b = botMsg(html);
      const items = SITUACION_ITEMS[flujo.sit.id] || [];
      if (items.length) {
        const t = document.createElement("div");
        t.innerHTML = "<b>Del botiquín:</b>";
        b.appendChild(t);
        chipsItems(items, b);
      }
      if (r.cuandoBajar) {
        const w = document.createElement("div");
        w.className = "chat-alarma";
        w.innerHTML = "🚁 <b>Cuándo bajar / pedir rescate:</b> " + esc(r.cuandoBajar);
        b.appendChild(w);
      }
      flujo = null;
      cierre();
    }
  }

  function cierre() {
    const b = botMsg("¿Te ayudo con algo más?");
    sugerencias(["Me duele la cabeza", "Tengo náuseas", "Me corté", "Mal de altura"]);
  }

  window.Chat = { iniciar, enviar };
})();
