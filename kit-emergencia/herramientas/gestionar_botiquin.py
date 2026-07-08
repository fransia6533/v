#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Herramienta de Python para el Kit de Emergencia (corre en la computadora).
Solo usa librerías estándar de Python: NO hace falta instalar nada.

Sirve para que tu amigo médico trabaje cómodo en la computadora:

  python3 gestionar_botiquin.py plantilla [botiquin.xlsx]
        Genera un Excel con los encabezados y filas de ejemplo para completar.

  python3 gestionar_botiquin.py validar botiquin.xlsx
        Revisa el Excel: cuenta ítems, avisa qué dosis están sin completar y
        cuántos faltan validar.

  python3 gestionar_botiquin.py json botiquin.xlsx
        Convierte el Excel a JSON (para pegar en datos.js -> BOTIQUIN_DEFAULT).

El .xlsx que genera lo abre la app del teléfono (Importar) y también Excel /
Google Sheets. El que genera la app también lo lee esta herramienta.
"""

import sys
import os
import json
import zipfile
import xml.etree.ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

COLUMNAS = [
    "Objeto / Medicamento",
    "Otros nombres / sinónimos",
    "Dosis (mg/cc) / cantidad",
    "Vía (masticable/inyectable/oral...)",
    "Procedimiento",
    "Comentario del médico",
    "Validado (sí/no)",
]
CAMPOS = ["objeto", "tambien", "dosis", "via", "procedimiento", "comentario", "validado"]

EJEMPLO = [
    ["Adrenalina (autoinyector / epinefrina)", "epinefrina, epipen, anafilaxia",
     "____ mg  ⚠️ VALIDAR", "inyectable",
     "Anafilaxia: inyectar en la cara lateral del muslo. Pedir rescate.",
     "____ (a completar por el médico)", "no"],
    ["Antihistamínico", "antialérgico, loratadina, ronchas",
     "____ mg  ⚠️ VALIDAR", "oral / masticable",
     "Alergia leve. En anafilaxia: DESPUÉS de la adrenalina.", "____", "no"],
    ["Analgésico / antiinflamatorio", "ibuprofeno, paracetamol, dolor, fiebre",
     "____ mg cada ____ h  ⚠️ VALIDAR", "oral",
     "Dolor, fiebre, dolor de altura. Respetar tiempo entre tomas.", "____", "no"],
]


# ---------------- Escribir XLSX (stdlib) ----------------
def _esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;").replace("\n", "&#10;"))


def _col(n):
    s = ""
    n += 1
    while n > 0:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def escribir_xlsx(ruta, filas):
    sheet = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
             '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>']
    for r, fila in enumerate(filas):
        celdas = ""
        for c, val in enumerate(fila):
            if val in (None, ""):
                continue
            ref = _col(c) + str(r + 1)
            celdas += ('<c r="%s" t="inlineStr"><is><t xml:space="preserve">%s</t></is></c>'
                       % (ref, _esc(val)))
        sheet.append('<row r="%d">%s</row>' % (r + 1, celdas))
    sheet.append("</sheetData></worksheet>")
    sheet_xml = "".join(sheet)

    content_types = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        '</Types>')
    rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
    workbook = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        '<sheets><sheet name="Kit" sheetId="1" r:id="rId1"/></sheets></workbook>')
    wb_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')

    with zipfile.ZipFile(ruta, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", rels)
        z.writestr("xl/workbook.xml", workbook)
        z.writestr("xl/_rels/workbook.xml.rels", wb_rels)
        z.writestr("xl/worksheets/sheet1.xml", sheet_xml)


# ---------------- Leer XLSX (stdlib) ----------------
def leer_xlsx(ruta):
    with zipfile.ZipFile(ruta) as z:
        nombres = z.namelist()
        shared = []
        if "xl/sharedStrings.xml" in nombres:
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall(NS + "si"):
                shared.append("".join(t.text or "" for t in si.iter(NS + "t")))
        hoja = next((n for n in nombres if n.startswith("xl/worksheets/sheet")
                     and n.endswith(".xml")), None)
        if not hoja:
            raise ValueError("No se encontró la hoja")
        root = ET.fromstring(z.read(hoja))
        filas = []
        data = root.find(NS + "sheetData")
        for row in data.findall(NS + "row"):
            celdas = {}
            maxc = 0
            for c in row.findall(NS + "c"):
                ref = c.get("r", "")
                col = _ref_a_col(ref)
                t = c.get("t")
                if t == "inlineStr":
                    val = "".join(x.text or "" for x in c.iter(NS + "t"))
                elif t == "s":
                    v = c.find(NS + "v")
                    val = shared[int(v.text)] if v is not None else ""
                else:
                    v = c.find(NS + "v")
                    val = v.text if v is not None else ""
                celdas[col] = val or ""
                maxc = max(maxc, col)
            filas.append([celdas.get(i, "") for i in range(maxc + 1)])
        return filas


def _ref_a_col(ref):
    letras = "".join(ch for ch in ref if ch.isalpha())
    n = 0
    for ch in letras:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


# ---------------- Comandos ----------------
def cmd_plantilla(salida):
    filas = [COLUMNAS] + EJEMPLO
    escribir_xlsx(salida, filas)
    print("✅ Plantilla creada: %s" % salida)
    print("   Abrila en Excel/Google Sheets, completá las dosis (____) y mandásela")
    print("   a tu teléfono. En la app: Botiquín -> ⬆️ Importar.")


def _mapear(filas):
    if not filas:
        return []
    head = [str(h).strip().lower() for h in filas[0]]

    def col(claves):
        for i, h in enumerate(head):
            if any(k in h for k in claves):
                return i
        return -1
    ci = {
        "objeto": col(["objeto", "medicament", "nombre"]),
        "tambien": col(["otros nombres", "sinonimo", "sinónimo", "alias"]),
        "dosis": col(["dosis", "cantidad", "mg"]),
        "via": col(["via", "vía"]),
        "procedimiento": col(["procedimiento", "proceso", "uso"]),
        "comentario": col(["comentario", "nota"]),
        "validado": col(["validado", "validad"]),
    }
    items = []
    for fila in filas[1:]:
        def g(k):
            i = ci[k]
            return (fila[i].strip() if 0 <= i < len(fila) else "")
        if not g("objeto"):
            continue
        v = g("validado").lower()
        items.append({
            "objeto": g("objeto"), "tambien": g("tambien"), "dosis": g("dosis"),
            "via": g("via"), "procedimiento": g("procedimiento"),
            "comentario": g("comentario"),
            "validado": v in ("sí", "si", "true", "x", "1"),
        })
    return items, ci


def cmd_validar(ruta):
    filas = leer_xlsx(ruta)
    items, ci = _mapear(filas)
    if ci["objeto"] < 0:
        print("❌ No encontré la columna 'Objeto'. Revisá el encabezado.")
        return
    print("📋 Ítems encontrados: %d" % len(items))
    sin_dosis, sin_validar = [], []
    for it in items:
        d = it["dosis"]
        if (not d) or "____" in d or "VALIDAR" in d.upper():
            sin_dosis.append(it["objeto"])
        if not it["validado"]:
            sin_validar.append(it["objeto"])
    print("✅ Validados por el médico: %d / %d" % (len(items) - len(sin_validar), len(items)))
    if sin_dosis:
        print("\n⚠️  Dosis SIN completar (%d):" % len(sin_dosis))
        for o in sin_dosis:
            print("   - " + o)
    if sin_validar:
        print("\n⚠️  Faltan VALIDAR (%d):" % len(sin_validar))
        for o in sin_validar:
            print("   - " + o)
    if not sin_dosis and not sin_validar:
        print("\n🎉 Todo completo y validado.")


def cmd_json(ruta):
    filas = leer_xlsx(ruta)
    items, ci = _mapear(filas)
    print(json.dumps(items, ensure_ascii=False, indent=2))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    cmd = sys.argv[1]
    if cmd == "plantilla":
        salida = sys.argv[2] if len(sys.argv) > 2 else "botiquin.xlsx"
        cmd_plantilla(salida)
    elif cmd == "validar" and len(sys.argv) > 2:
        cmd_validar(sys.argv[2])
    elif cmd == "json" and len(sys.argv) > 2:
        cmd_json(sys.argv[2])
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
