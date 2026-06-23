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

  // ---------- render lista ----------
  function render(filtro) {
    const cont = $("#listaBotiquin");
    const q = normalizar(filtro);
    cont.innerHTML = "";
    const items = datos.filter((it) => {
      if (!q) return true;
      return normalizar(it.objeto + " " + it.procedimiento + " " + it.comentario).includes(q);
    });
    if (items.length === 0) {
      cont.innerHTML = '<p class="vacio">Sin resultados.</p>';
      return;
    }
    items.forEach((it) => {
      const idx = datos.indexOf(it);
      const card = document.createElement("button");
      card.className = "bot-card" + (it.validado ? "" : " sinvalidar");
      card.innerHTML =
        `<div class="bot-nombre">${escapar(it.objeto)}</div>` +
        `<div class="bot-meta"><span class="chip-via">${escapar(it.via || "")}</span> ` +
        `<span class="bot-dosis">${escapar(it.dosis || "")}</span></div>`;
      card.addEventListener("click", () => verDetalle(idx));
      cont.appendChild(card);
    });
  }

  // ---------- detalle / edición ----------
  function verDetalle(idx) {
    const it = datos[idx];
    let html = `<h2>${escapar(it.objeto)}</h2>`;
    if (!it.validado)
      html += '<div class="alerta-validar">⚠️ Pendiente de validar por el médico.</div>';
    html += campo("Dosis (mg/cc) / cantidad", it.dosis);
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
    const it = idx >= 0 ? datos[idx] : { objeto: "", dosis: "", via: "", procedimiento: "", comentario: "", validado: false };
    let html = `<h2>${idx >= 0 ? "Editar" : "Nuevo"} ítem</h2>`;
    html += inputCampo("Objeto / Medicamento", "f_objeto", it.objeto, false);
    html += inputCampo("Dosis (mg/cc) / cantidad", "f_dosis", it.dosis, false);
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
        dosis: $("#f_dosis").value.trim(),
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
      aoa.push([it.objeto, it.dosis, it.via, it.procedimiento, it.comentario, it.validado ? "sí" : "no"]);
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
        dosis: get("dosis"),
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
