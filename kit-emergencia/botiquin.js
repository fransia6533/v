/* ============================================================================
   botiquin.js — La base de datos del botiquín (tabla editable + Excel).
   Guarda en el teléfono (localStorage) y exporta/importa Excel (.xlsx) y .csv.
   ========================================================================== */
(function () {
  "use strict";

  const STORE_KEY = "botiquin_v2";
  const cols = BOTIQUIN_COLUMNAS;

  function cargar() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return BOTIQUIN_DEFAULT.map((x) => Object.assign({}, x));
  }
  function guardar(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  let datos = cargar();

  // ---------- utilidades ----------
  const $ = (s) => document.querySelector(s);
  function escapar(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }
  const normalizar = (t) =>
    (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // ---------- render lista (con búsqueda tolerante a errores) ----------
  function render(filtro) {
    const cont = $("#listaBotiquin");
    const q = (filtro || "").trim();
    cont.innerHTML = "";
    responder(q); // chat conversacional arriba

    let lista;
    if (!q) {
      lista = datos.map((it) => ({ item: it }));
    } else {
      lista = Fuzzy.rankear(q, datos).filter((x) => x.score >= 0.4);
    }
    if (lista.length === 0) {
      cont.innerHTML = '<p class="vacio">Sin resultados. Probá con otra palabra o tocá ➕ Agregar.</p>';
      return;
    }
    lista.forEach(({ item }) => {
      const idx = datos.indexOf(item);
      const card = document.createElement("button");
      card.className = "bot-card" + (item.validado ? "" : " sinvalidar");
      card.innerHTML =
        `<div class="bot-nombre">${escapar(item.objeto)}</div>` +
        `<div class="bot-meta"><span class="chip-via">${escapar(item.via || "")}</span> ` +
        `<span class="bot-dosis">${escapar(item.dosis || "")}</span></div>`;
      card.addEventListener("click", () => verDetalle(idx));
      cont.appendChild(card);
    });
  }

  // ---------- chat conversacional ----------
  function responder(q) {
    const cont = $("#chatRespuesta");
    if (!cont) return;
    if (!q) { cont.innerHTML = ""; return; }
    const rank = Fuzzy.rankear(q, datos);
    const top = rank[0];
    const second = rank[1];

    if (!top || top.score < 0.45) {
      cont.innerHTML = burbuja(
        `No encontré <b>«${escapar(q)}»</b> en tu botiquín. ` +
        `Revisá la lista de abajo o agregalo con ➕.`
      );
      return;
    }
    // ¿ambiguo? (dos candidatos parecidos)
    if (second && top.score - second.score < 0.08 && top.score < 0.9) {
      let html = `¿Cuál de estos buscás?<div class="chat-ops">`;
      rank.slice(0, 3).forEach((r) => {
        const idx = datos.indexOf(r.item);
        html += `<button class="btn chat-op" data-idx="${idx}">${escapar(r.item.objeto)}</button>`;
      });
      html += `</div>`;
      cont.innerHTML = burbuja(html);
      cont.querySelectorAll(".chat-op").forEach((b) =>
        b.addEventListener("click", () => verDetalle(parseInt(b.dataset.idx, 10)))
      );
      return;
    }
    // respuesta directa
    const it = top.item;
    const idx = datos.indexOf(it);
    const seguro = top.score >= 0.9;
    let html = (seguro ? "💊 " : "💊 Creo que buscás ") + `<b>${escapar(it.objeto)}</b>`;
    if (!it.validado) html += ` <span class="mini-aviso">⚠️ sin validar</span>`;
    html += `<div class="chat-info">`;
    const calc = window.Paciente ? window.Paciente.calcular(it) : null;
    if (calc) html += `<div><b>Dosis para tu peso:</b> ${escapar(calc)} ⚠️</div>`;
    if (it.dosis) html += `<div><b>Dosis/vía:</b> ${escapar(it.dosis)} · ${escapar(it.via || "")}</div>`;
    if (it.procedimiento) html += `<div><b>Qué hacer:</b> ${escapar(it.procedimiento)}</div>`;
    html += `</div><button class="btn chat-op" data-idx="${idx}">Ver detalle completo</button>`;
    cont.innerHTML = burbuja(html);
    const btn = cont.querySelector(".chat-op");
    if (btn) btn.addEventListener("click", () => verDetalle(idx));
  }
  function burbuja(html) {
    return `<div class="burbuja">${html}</div>`;
  }

  // ---------- detalle / edición ----------
  function verDetalle(idx) {
    const it = datos[idx];
    let html = `<h2>${escapar(it.objeto)}</h2>`;
    if (!it.validado)
      html += '<div class="alerta-validar">⚠️ Pendiente de validar por el médico.</div>';
    if (it.tambien) html += campo("Otros nombres", it.tambien);
    const calc = window.Paciente ? window.Paciente.calcular(it) : null;
    if (calc) html += `<div class="bloque dosis-calc"><h3>Dosis para tu peso</h3>${escapar(calc)} <span class="mini-aviso">⚠️ validar</span></div>`;
    html += campo("Dosis fija", it.dosis);
    if (it.dosisPorKg) html += campo("Dosis por kg (regla del médico)", it.dosisPorKg);
    html += campo("Vía", it.via);
    html += campo("Procedimiento", it.procedimiento);
    html += campo("Comentario del médico", it.comentario);
    html +=
      `<div class="acciones-detalle">` +
      `<button class="btn" id="btnEditar">✏️ Editar</button>` +
      `<button class="btn btn-peligro" id="btnEliminar">🗑️ Eliminar</button></div>`;
    abrirModal(html);
    $("#btnEditar").addEventListener("click", () => editar(idx));
    $("#btnEliminar").addEventListener("click", () => {
      if (confirm("¿Eliminar «" + it.objeto + "» del botiquín?")) {
        datos.splice(idx, 1);
        guardar(datos);
        cerrarModal();
        render($("#busquedaBot").value);
      }
    });
  }
  function campo(t, v) {
    return `<div class="bloque"><h3>${escapar(t)}</h3>${escapar(v) || "—"}</div>`;
  }

  function editar(idx) {
    const it = idx >= 0 ? datos[idx] : { objeto: "", tambien: "", dosis: "", dosisPorKg: "", via: "", procedimiento: "", comentario: "", validado: false };
    let html = `<h2>${idx >= 0 ? "Editar" : "Nuevo"} ítem</h2>`;
    html += inputCampo("Objeto / Medicamento", "f_objeto", it.objeto, false);
    html += inputCampo("Otros nombres / sinónimos (separados por coma)", "f_tambien", it.tambien || "", false);
    html += inputCampo("Dosis fija (mg/cc) / cantidad", "f_dosis", it.dosis, false);
    html += inputCampo("Dosis por kg (ej: 10 mg/kg, máx 50 mg)", "f_dosisPorKg", it.dosisPorKg || "", false);
    html += inputCampo("Vía (masticable / inyectable / oral / uso externo)", "f_via", it.via, false);
    html += inputCampo("Procedimiento", "f_proc", it.procedimiento, true);
    html += inputCampo("Comentario del médico", "f_com", it.comentario, true);
    html +=
      `<label class="check-validado"><input type="checkbox" id="f_val" ${it.validado ? "checked" : ""}/> Validado por el médico</label>`;
    html += `<div class="acciones-detalle"><button class="btn btn-ok" id="btnGuardar">💾 Guardar</button></div>`;
    abrirModal(html);
    $("#btnGuardar").addEventListener("click", () => {
      const nuevo = {
        objeto: $("#f_objeto").value.trim(),
        tambien: $("#f_tambien").value.trim(),
        dosis: $("#f_dosis").value.trim(),
        dosisPorKg: $("#f_dosisPorKg").value.trim(),
        via: $("#f_via").value.trim(),
        procedimiento: $("#f_proc").value.trim(),
        comentario: $("#f_com").value.trim(),
        validado: $("#f_val").checked,
      };
      if (!nuevo.objeto) { alert("Poné al menos el nombre del objeto."); return; }
      if (idx >= 0) datos[idx] = nuevo; else datos.push(nuevo);
      guardar(datos);
      cerrarModal();
      render($("#busquedaBot").value);
    });
  }
  function inputCampo(label, id, val, multilinea) {
    const control = multilinea
      ? `<textarea id="${id}" rows="4">${escapar(val)}</textarea>`
      : `<input id="${id}" type="text" value="${escapar(val)}" />`;
    return `<div class="campo-edit"><label for="${id}">${escapar(label)}</label>${control}</div>`;
  }

  // ---------- modal helpers (compartidos con app.js) ----------
  function abrirModal(html) {
    const det = $("#detalle");
    $("#detalleContenido").innerHTML = html;
    det.classList.remove("oculta");
    det.scrollTop = 0;
    window.scrollTo(0, 0);
  }
  function cerrarModal() {
    $("#detalle").classList.add("oculta");
  }

  // ---------- Excel: exportar ----------
  function aMatriz() {
    const aoa = [cols.map((c) => c.titulo)];
    datos.forEach((it) => {
      aoa.push(cols.map((c) =>
        c.id === "validado" ? (it.validado ? "sí" : "no") : (it[c.id] || "")
      ));
    });
    return aoa;
  }
  function exportar() {
    const aoa = aMatriz();
    const bytes = XLSXMini.write(aoa);
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    descargar(blob, "botiquin-kit-emergencia.xlsx");
  }
  function descargar(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  // ---------- Excel/CSV: importar ----------
  function importar(file) {
    const nombre = (file.name || "").toLowerCase();
    const reader = new FileReader();
    reader.onload = function () {
      try {
        let aoa;
        if (nombre.endsWith(".csv")) aoa = parseCSV(reader.result);
        else aoa = XLSXMini.read(new Uint8Array(reader.result));
        aplicarMatriz(aoa);
      } catch (e) {
        alert("No pude leer el archivo: " + e.message);
      }
    };
    if (nombre.endsWith(".csv")) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  }
  function aplicarMatriz(aoa) {
    if (!aoa || aoa.length < 2) { alert("El archivo no tiene filas de datos."); return; }
    // mapear columnas por encabezado (tolerante)
    const head = (aoa[0] || []).map((h) => normalizar(h));
    function col(claves) {
      for (let i = 0; i < head.length; i++) if (claves.some((k) => head[i].includes(k))) return i;
      return -1;
    }
    const ci = {
      objeto: col(["objeto", "medicament", "nombre"]),
      tambien: col(["otros nombres", "sinonimo", "sinónimo", "alias"]),
      dosisPorKg: col(["por kg", "por peso", "/kg", "mg/kg"]),
      dosis: col(["dosis", "cantidad", "mg"]),
      via: col(["via", "vía"]),
      procedimiento: col(["procedimiento", "proceso", "uso"]),
      comentario: col(["comentario", "nota"]),
      validado: col(["validado", "validad"]),
    };
    if (ci.objeto < 0) { alert("No encontré la columna 'Objeto'. Revisá el encabezado."); return; }
    const nuevos = [];
    for (let r = 1; r < aoa.length; r++) {
      const row = aoa[r] || [];
      const obj = (row[ci.objeto] || "").toString().trim();
      if (!obj) continue;
      const get = (k) => (ci[k] >= 0 ? (row[ci[k]] || "").toString().trim() : "");
      const v = get("validado").toLowerCase();
      nuevos.push({
        objeto: obj,
        tambien: get("tambien"),
        dosis: get("dosis"),
        dosisPorKg: get("dosisPorKg"),
        via: get("via"),
        procedimiento: get("procedimiento"),
        comentario: get("comentario"),
        validado: v === "sí" || v === "si" || v === "true" || v === "x" || v === "1",
      });
    }
    if (nuevos.length === 0) { alert("No encontré filas con objeto."); return; }
    if (!confirm("Esto reemplaza el botiquín actual con " + nuevos.length + " ítems del archivo. ¿Seguir?")) return;
    datos = nuevos;
    guardar(datos);
    render($("#busquedaBot").value);
    alert("Listo: " + nuevos.length + " ítems importados.");
  }
  function parseCSV(text) {
    // soporta comillas, saltos de línea dentro de celdas, separador , o ;
    const sep = (text.split("\n")[0].match(/;/g) || []).length > (text.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
    const rows = [];
    let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else {
        if (ch === '"') q = true;
        else if (ch === sep) { row.push(cell); cell = ""; }
        else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
        else if (ch === "\r") {} else cell += ch;
      }
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  // ---------- API pública ----------
  window.Botiquin = {
    render,
    nuevo: () => editar(-1),
    exportar,
    importar,
    buscar: (q) => render(q),
    datos: () => datos,
  };
})();
