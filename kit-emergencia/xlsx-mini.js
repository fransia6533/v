/* ============================================================================
   xlsx-mini.js — Lectura/escritura de Excel (.xlsx) en JavaScript puro.
   Sin librerías externas. Funciona offline en el navegador.

   - Escribir: genera un .xlsx válido (ZIP "stored", sin comprimir) que abren
     Excel y Google Sheets.
   - Leer: descomprime ZIP (soporta DEFLATE, como el que guarda Excel) y lee
     la primera hoja, resolviendo sharedStrings e inline strings.

   API:
     XLSXMini.write(aoa) -> Uint8Array        (aoa = array de filas, cada fila array de celdas)
     XLSXMini.read(uint8array) -> aoa
   ========================================================================== */
(function (global) {
  "use strict";

  // ---------- CRC32 ----------
  const CRC_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  // ---------- UTF-8 ----------
  const enc = new TextEncoder();
  const dec = new TextDecoder("utf-8");

  // ---------- DEFLATE inflate (raw) ----------
  // Implementación compacta basada en el algoritmo "puff"/tinflate.
  function inflateRaw(input) {
    let bitBuf = 0, bitCnt = 0, pos = 0;
    const out = [];

    function getBit() {
      if (bitCnt === 0) { bitBuf = input[pos++]; bitCnt = 8; }
      const b = bitBuf & 1; bitBuf >>= 1; bitCnt--; return b;
    }
    function getBits(n) {
      let v = 0;
      for (let i = 0; i < n; i++) v |= getBit() << i;
      return v;
    }
    function buildTree(lengths) {
      const maxBits = Math.max.apply(null, lengths);
      const blCount = new Array(maxBits + 1).fill(0);
      for (const l of lengths) if (l) blCount[l]++;
      const nextCode = new Array(maxBits + 1).fill(0);
      let code = 0;
      for (let bits = 1; bits <= maxBits; bits++) {
        code = (code + blCount[bits - 1]) << 1;
        nextCode[bits] = code;
      }
      const codes = {};
      for (let i = 0; i < lengths.length; i++) {
        const len = lengths[i];
        if (len) { codes[len + "_" + nextCode[len]] = i; nextCode[len]++; }
      }
      return { codes, maxBits };
    }
    function decodeSym(tree) {
      let code = 0, len = 0;
      while (len <= tree.maxBits) {
        code = (code << 1) | getBit(); len++;
        const sym = tree.codes[len + "_" + code];
        if (sym !== undefined) return sym;
      }
      throw new Error("inflate: símbolo inválido");
    }

    const LEN_BASE = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
    const LEN_EXTRA = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
    const DIST_BASE = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
    const DIST_EXTRA = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

    let last = 0;
    do {
      last = getBit();
      const type = getBits(2);
      if (type === 0) {
        // stored
        bitCnt = 0; // byte align
        const len = input[pos] | (input[pos + 1] << 8);
        pos += 4; // len + nlen
        for (let i = 0; i < len; i++) out.push(input[pos++]);
      } else {
        let litTree, distTree;
        if (type === 1) {
          const litLen = [];
          for (let i = 0; i < 144; i++) litLen.push(8);
          for (let i = 144; i < 256; i++) litLen.push(9);
          for (let i = 256; i < 280; i++) litLen.push(7);
          for (let i = 280; i < 288; i++) litLen.push(8);
          litTree = buildTree(litLen);
          distTree = buildTree(new Array(30).fill(5));
        } else {
          const hlit = getBits(5) + 257;
          const hdist = getBits(5) + 1;
          const hclen = getBits(4) + 4;
          const order = [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
          const clLen = new Array(19).fill(0);
          for (let i = 0; i < hclen; i++) clLen[order[i]] = getBits(3);
          const clTree = buildTree(clLen);
          const lengths = [];
          while (lengths.length < hlit + hdist) {
            const sym = decodeSym(clTree);
            if (sym < 16) lengths.push(sym);
            else if (sym === 16) { const r = getBits(2) + 3; const prev = lengths[lengths.length - 1]; for (let i = 0; i < r; i++) lengths.push(prev); }
            else if (sym === 17) { const r = getBits(3) + 3; for (let i = 0; i < r; i++) lengths.push(0); }
            else { const r = getBits(7) + 11; for (let i = 0; i < r; i++) lengths.push(0); }
          }
          litTree = buildTree(lengths.slice(0, hlit));
          distTree = buildTree(lengths.slice(hlit));
        }
        for (;;) {
          const sym = decodeSym(litTree);
          if (sym === 256) break;
          if (sym < 256) out.push(sym);
          else {
            const li = sym - 257;
            const length = LEN_BASE[li] + getBits(LEN_EXTRA[li]);
            const ds = decodeSym(distTree);
            const dist = DIST_BASE[ds] + getBits(DIST_EXTRA[ds]);
            let start = out.length - dist;
            for (let i = 0; i < length; i++) out.push(out[start + i]);
          }
        }
      }
    } while (!last);
    return new Uint8Array(out);
  }

  // ---------- ZIP lectura ----------
  function readZip(data) {
    // Buscar End Of Central Directory
    let eocd = -1;
    for (let i = data.length - 22; i >= 0; i--) {
      if (data[i] === 0x50 && data[i + 1] === 0x4b && data[i + 2] === 0x05 && data[i + 3] === 0x06) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("ZIP inválido");
    const u32 = (o) => data[o] | (data[o+1]<<8) | (data[o+2]<<16) | (data[o+3]<<24);
    const u16 = (o) => data[o] | (data[o+1]<<8);
    const count = u16(eocd + 10);
    let cd = u32(eocd + 16);
    const files = {};
    for (let n = 0; n < count; n++) {
      const nameLen = u16(cd + 28), extraLen = u16(cd + 30), commentLen = u16(cd + 32);
      const method = u16(cd + 10);
      const compSize = u32(cd + 20);
      const localOff = u32(cd + 42);
      const name = dec.decode(data.subarray(cd + 46, cd + 46 + nameLen));
      // leer cabecera local para datos
      const lNameLen = u16(localOff + 26), lExtraLen = u16(localOff + 28);
      const dataStart = localOff + 30 + lNameLen + lExtraLen;
      const raw = data.subarray(dataStart, dataStart + compSize);
      let content;
      if (method === 0) content = raw;
      else if (method === 8) content = inflateRaw(raw);
      else throw new Error("ZIP: método " + method + " no soportado");
      files[name] = content;
      cd += 46 + nameLen + extraLen + commentLen;
    }
    return files;
  }

  // ---------- ZIP escritura (stored) ----------
  function writeZip(entries) {
    // entries: [{name, data(Uint8Array)}]
    const chunks = [];
    const central = [];
    let offset = 0;
    function pushU32(arr, v) { arr.push(v & 255, (v>>>8)&255, (v>>>16)&255, (v>>>24)&255); }
    function pushU16(arr, v) { arr.push(v & 255, (v>>>8)&255); }
    for (const e of entries) {
      const nameBytes = enc.encode(e.name);
      const crc = crc32(e.data);
      const local = [];
      pushU32(local, 0x04034b50);
      pushU16(local, 20); pushU16(local, 0); pushU16(local, 0); // version, flags, method=0
      pushU16(local, 0); pushU16(local, 0); // time, date
      pushU32(local, crc); pushU32(local, e.data.length); pushU32(local, e.data.length);
      pushU16(local, nameBytes.length); pushU16(local, 0);
      const localHeader = new Uint8Array(local);
      const localOffset = offset;
      chunks.push(localHeader, nameBytes, e.data);
      offset += localHeader.length + nameBytes.length + e.data.length;
      const cen = [];
      pushU32(cen, 0x02014b50);
      pushU16(cen, 20); pushU16(cen, 20); pushU16(cen, 0); pushU16(cen, 0);
      pushU16(cen, 0); pushU16(cen, 0);
      pushU32(cen, crc); pushU32(cen, e.data.length); pushU32(cen, e.data.length);
      pushU16(cen, nameBytes.length); pushU16(cen, 0); pushU16(cen, 0);
      pushU16(cen, 0); pushU16(cen, 0); pushU32(cen, 0);
      pushU32(cen, localOffset);
      central.push(new Uint8Array(cen), nameBytes);
    }
    let centralSize = 0, centralStart = offset;
    for (const c of central) centralSize += c.length;
    const eocd = [];
    pushU32(eocd, 0x06054b50);
    pushU16(eocd, 0); pushU16(eocd, 0);
    pushU16(eocd, entries.length); pushU16(eocd, entries.length);
    pushU32(eocd, centralSize); pushU32(eocd, centralStart);
    pushU16(eocd, 0);
    const all = [];
    for (const c of chunks) all.push(c);
    for (const c of central) all.push(c);
    all.push(new Uint8Array(eocd));
    let total = 0; for (const a of all) total += a.length;
    const result = new Uint8Array(total);
    let p = 0; for (const a of all) { result.set(a, p); p += a.length; }
    return result;
  }

  // ---------- XML helpers ----------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function unesc(s) {
    return String(s)
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'").replace(/&#10;/g, "\n").replace(/&#13;/g, "\r")
      .replace(/&amp;/g, "&");
  }
  function colName(n) {
    let s = "";
    n++;
    while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
    return s;
  }

  // ---------- Escribir hoja ----------
  function write(aoa) {
    let rows = "";
    for (let r = 0; r < aoa.length; r++) {
      let cells = "";
      const row = aoa[r] || [];
      for (let c = 0; c < row.length; c++) {
        const val = row[c];
        if (val == null || val === "") continue;
        const ref = colName(c) + (r + 1);
        const text = esc(val).replace(/\n/g, "&#10;");
        cells += `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
      }
      rows += `<row r="${r + 1}">${cells}</row>`;
    }
    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
      `</Types>`;
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
    const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets><sheet name="Kit" sheetId="1" r:id="rId1"/></sheets></workbook>`;
    const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
    return writeZip([
      { name: "[Content_Types].xml", data: enc.encode(contentTypes) },
      { name: "_rels/.rels", data: enc.encode(rels) },
      { name: "xl/workbook.xml", data: enc.encode(workbook) },
      { name: "xl/_rels/workbook.xml.rels", data: enc.encode(wbRels) },
      { name: "xl/worksheets/sheet1.xml", data: enc.encode(sheet) },
    ]);
  }

  // ---------- Leer hoja ----------
  function read(data) {
    const files = readZip(data);
    // sharedStrings
    const shared = [];
    if (files["xl/sharedStrings.xml"]) {
      const xml = dec.decode(files["xl/sharedStrings.xml"]);
      const siRe = /<si>([\s\S]*?)<\/si>/g;
      let m;
      while ((m = siRe.exec(xml))) {
        const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
        let t, txt = "";
        while ((t = tRe.exec(m[1]))) txt += unesc(t[1]);
        shared.push(txt);
      }
    }
    // primera hoja
    let sheetName = Object.keys(files).find((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
    if (!sheetName) throw new Error("No se encontró hoja");
    const sheetXml = dec.decode(files[sheetName]);
    const aoa = [];
    const rowRe = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
    let rm;
    while ((rm = rowRe.exec(sheetXml))) {
      const rowIdx = parseInt(rm[1], 10) - 1;
      const cellsXml = rm[2];
      const row = [];
      const cellRe = /<c[^>]*r="([A-Z]+)\d+"[^>]*?(?:\st="([^"]+)")?[^>]*>([\s\S]*?)<\/c>/g;
      let cm;
      while ((cm = cellRe.exec(cellsXml))) {
        const col = colToIdx(cm[1]);
        const type = cm[2];
        const inner = cm[3];
        let value = "";
        if (type === "s") {
          const vm = /<v>([\s\S]*?)<\/v>/.exec(inner);
          if (vm) value = shared[parseInt(vm[1], 10)] || "";
        } else if (type === "inlineStr") {
          const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g; let t;
          while ((t = tRe.exec(inner))) value += unesc(t[1]);
        } else if (type === "str") {
          const vm = /<v>([\s\S]*?)<\/v>/.exec(inner);
          if (vm) value = unesc(vm[1]);
        } else {
          const vm = /<v>([\s\S]*?)<\/v>/.exec(inner);
          if (vm) value = unesc(vm[1]);
        }
        row[col] = value;
      }
      aoa[rowIdx] = row;
    }
    // normalizar (sin huecos undefined)
    for (let i = 0; i < aoa.length; i++) {
      if (!aoa[i]) aoa[i] = [];
      for (let j = 0; j < aoa[i].length; j++) if (aoa[i][j] == null) aoa[i][j] = "";
    }
    return aoa;
  }
  function colToIdx(s) {
    let n = 0;
    for (let i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64);
    return n - 1;
  }

  global.XLSXMini = { write, read, _inflateRaw: inflateRaw, _crc32: crc32, _readZip: readZip };
})(typeof window !== "undefined" ? window : globalThis);
