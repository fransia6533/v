"""
tests/prueba_navegador.py
=========================
PRUEBA DE PUNTA A PUNTA EN UN NAVEGADOR REAL (Chromium).

Hace exactamente lo que haría una persona: abre páginas, escribe en los
formularios, aprieta botones, responde el chat, descarga el CSV, cierra y
vuelve a abrir la aplicación. Recorre los 23 casos manuales de docs/07_pruebas.md.

Al terminar escribe:
  - docs/informe_pruebas_navegador.md  (tabla: caso, acción, esperado, observado, pasó/falló)
  - docs/capturas/*.png                 (capturas de pantalla como evidencia)

Es OPCIONAL: necesita instalar Playwright (una herramienta que maneja el navegador):
    pip install playwright
    python -m playwright install chromium
    python tests/prueba_navegador.py

Usa una base de datos TEMPORAL y el puerto 8765: no toca tu demo.
"""

import csv
import io
import os
import re
import sqlite3
import subprocess
import sys
import tempfile
import time
import urllib.request
from datetime import date, timedelta

from playwright.sync_api import sync_playwright

CARPETA = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUERTO = 8765
BASE = f"http://127.0.0.1:{PUERTO}"
CAPTURAS = os.path.join(CARPETA, "docs", "capturas")
TMP = tempfile.mkdtemp()
RUTA_DB = os.path.join(TMP, "e2e.sqlite3")
# Si Chromium está en una ruta especial (entorno de desarrollo), se puede indicar aquí.
CHROMIUM = os.environ.get("CHROMIUM_PATH")

resultados = []  # cada elemento: (caso, accion, esperado, observado, paso)
activo = {}      # guarda el proceso de la aplicación que está corriendo


def anotar(caso, accion, esperado, observado, paso):
    resultados.append((caso, accion, esperado, observado, "✅ Pasó" if paso else "❌ Falló"))
    print(("PASÓ " if paso else "FALLÓ"), caso, "-", observado)


# ---------------------------------------------------------------------------
# Iniciar y detener la aplicación como un programa aparte (igual que el usuario)
# ---------------------------------------------------------------------------
def puerto_ocupado():
    try:
        urllib.request.urlopen(BASE + "/panel", timeout=1)
        return True
    except Exception:
        return False


def iniciar_servidor():
    if puerto_ocupado():
        raise RuntimeError(f"El puerto {PUERTO} ya está en uso: cierra otra copia de esta prueba.")
    codigo = ("import app; app.crear_app().run(host='127.0.0.1', port=%d, debug=False)" % PUERTO)
    entorno = dict(os.environ, DEMO_DB=RUTA_DB)
    proceso = subprocess.Popen([sys.executable, "-c", codigo], cwd=CARPETA, env=entorno,
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try:
            urllib.request.urlopen(BASE + "/panel", timeout=1)
            return proceso
        except Exception:
            time.sleep(0.2)
    raise RuntimeError("La aplicación no inició")


def detener_servidor(proceso):
    proceso.terminate()
    proceso.wait(timeout=10)


def sql(consulta, parametros=()):
    con = sqlite3.connect(RUTA_DB)
    filas = con.execute(consulta, parametros).fetchall()
    con.close()
    return filas


def avisos(pagina):
    """Textos de los avisos (flash) que muestra la página tras una acción."""
    return [t.strip() for t in pagina.locator("main > .aviso").all_inner_texts()]


def ids_en_panel(pagina):
    return re.findall(r'href="/control/(\d+)"', pagina.content())


def main():
    os.makedirs(CAPTURAS, exist_ok=True)
    hoy = date.today()
    activo["servidor"] = iniciar_servidor()
    try:
        recorrido(hoy)
    finally:
        # Pase lo que pase (incluso si la prueba se cae), se detiene la aplicación.
        detener_servidor(activo["servidor"])
    escribir_informe()


def recorrido(hoy):
    """Recorre todos los casos (en M13 detiene y vuelve a iniciar la aplicación)."""
    with sync_playwright() as p:
        navegador = p.chromium.launch(**({"executable_path": CHROMIUM} if CHROMIUM else {}))
        contexto = navegador.new_context(viewport={"width": 1300, "height": 900}, accept_downloads=True)
        pg = contexto.new_page()
        errores_js = []
        pg.on("pageerror", lambda e: errores_js.append(str(e)))

        # M1 — Inicio
        pg.goto(BASE)
        n = len(ids_en_panel(pg))
        franja = pg.locator(".franja-demo").inner_text()
        pg.screenshot(path=f"{CAPTURAS}/01_panel_inicial.png", full_page=True)
        anotar("M1 Inicio", "Abrir la dirección de la demo", "Panel con 11 controles y franja DEMOSTRACIÓN",
               f"{n} controles; franja: '{franja}'", n == 11 and "DEMOSTRACIÓN" in franja)

        # M3 — Teléfono real
        pg.goto(BASE + "/registrar")
        pg.fill("input[name=nombre_ficticio]", "Paciente Prueba")
        pg.fill("input[name=telefono_ficticio]", "+56911112222")
        pg.check("input[name=examenes] >> nth=0")
        pg.check("input[name=confirmo_ficticio]")
        pg.click("form.formulario button")
        a = avisos(pg)
        anotar("M3 Teléfono real", "Registrar con +56911112222", "Rechazo: teléfono debe ser ficticio",
               a[0] if a else "(sin aviso)", bool(a) and "ficticio" in a[0] and len(sql("SELECT * FROM pacientes")) == 10)

        # M4 — Sin exámenes
        pg.goto(BASE + "/registrar")
        pg.fill("input[name=nombre_ficticio]", "Paciente Prueba")
        pg.fill("input[name=telefono_ficticio]", "0001234")
        pg.check("input[name=confirmo_ficticio]")
        pg.click("form.formulario button")
        a = avisos(pg)
        anotar("M4 Sin exámenes", "Registrar sin marcar exámenes", "Rechazo: seleccionar al menos un examen",
               a[0] if a else "(sin aviso)", bool(a) and "al menos un examen" in a[0] and len(sql("SELECT * FROM pacientes")) == 10)

        # M5 — Sin confirmar ficticio (el navegador no deja enviar: casilla obligatoria)
        pg.goto(BASE + "/registrar")
        pg.fill("input[name=nombre_ficticio]", "Paciente Prueba")
        pg.check("input[name=examenes] >> nth=0")
        pg.click("form.formulario button")
        sigue_en_form = pg.url.endswith("/registrar") and len(sql("SELECT * FROM pacientes")) == 10
        anotar("M5 Sin confirmar ficticio", "Guardar sin marcar 'Confirmo que son ficticios'",
               "No se guarda", "El navegador bloqueó el envío; no se creó paciente" if sigue_en_form else "Se guardó",
               sigue_en_form)

        # M2 — Registro válido
        pg.goto(BASE + "/registrar")
        pg.fill("input[name=nombre_ficticio]", "Paciente Prueba")
        pg.fill("input[name=telefono_ficticio]", "0001234")
        pg.fill("input[name=fecha_control]", (hoy + timedelta(days=9)).isoformat())
        pg.check("input[name=examenes] >> nth=0")
        pg.check("input[name=examenes] >> nth=4")
        pg.check("input[name=confirmo_ficticio]")
        pg.click("form.formulario button")
        nuevo_id = int(re.search(r"/control/(\d+)", pg.url).group(1))
        estado = pg.locator(".etq.inv-pendiente").first.inner_text()
        pg.screenshot(path=f"{CAPTURAS}/02_registro_nuevo.png", full_page=True)
        anotar("M2 Registro válido", "Registrar PAC-011 con 2 exámenes", "Detalle con invitación Pendiente",
               f"Control #{nuevo_id}, invitación '{estado}', exámenes: {len(sql('SELECT * FROM examenes_control WHERE control_id=?', (nuevo_id,)))}",
               estado == "Pendiente")

        # M6 — Invitación simulada
        pg.click("text=Simular envío de invitación")
        estado = pg.locator(".etq.inv-simulada").first.inner_text()
        en_historial = "invitacion_simulada" in pg.content()
        anotar("M6 Invitación simulada", "Botón 'Simular envío de invitación'",
               "Estado 'Simulada (no enviada realmente)' + evento", f"'{estado}'; en historial: {en_historial}",
               "Simulada" in estado and en_historial)
        enlace = pg.locator("a:has-text('Abrir la vista del paciente')").get_attribute("href")

        # M9–M11 — Chat completo en tamaño teléfono
        chat = contexto.new_page()
        chat.on("pageerror", lambda e: errores_js.append(str(e)))
        chat.set_viewport_size({"width": 400, "height": 820})
        chat.goto(enlace)

        def boton(texto):
            chat.locator("#opciones button", has_text=texto).first.click()
            chat.wait_for_timeout(200)

        boton("Comenzar")
        boton("Sí, es correcto")
        boton("Sí"); boton("Sí, lo tengo")          # primer examen preguntado: realizado, con resultado
        boton("Lo respondo después")                  # segundo examen: queda pendiente
        boton("Llamada"); boton("No"); boton("Opción A"); boton("No es necesario")
        chat.fill("#opciones textarea", "Comentario de prueba (ficticio)")
        boton("Guardar comentario")
        texto = chat.locator("#mensajes").inner_text()
        chat.screenshot(path=f"{CAPTURAS}/03_chat_resumen.png", full_page=True)
        anotar("M9 Chat completo", "Responder todo, dejar 1 examen en 'Lo respondo después'",
               "Resumen con 1 pendiente", "Resumen mostrado; " + ("1 pendiente" if "Tienes 1 respuesta" in texto else "sin aviso de pendiente"),
               "Tienes 1 respuesta" in texto)

        # M10 — Corregir antes de enviar: el examen pendiente → "Prefiero aclararlo con el equipo"
        filas = chat.locator(".resumen").last.locator(".fila-resumen")
        for i in range(filas.count()):
            if "Sin responder" in filas.nth(i).inner_text():
                filas.nth(i).locator("button").click()
                break
        chat.wait_for_timeout(200)
        boton("Prefiero aclararlo con el equipo")
        ultimo = chat.locator(".resumen").last.inner_text()
        anotar("M10 Corrección antes de enviar", "En el resumen: 'Cambiar' el examen pendiente",
               "Vuelve al resumen con el nuevo valor", "Nuevo valor en resumen: " + str("Prefiero aclararlo" in ultimo),
               "Prefiero aclararlo" in ultimo and "Tienes 1 respuesta" not in chat.locator("#mensajes").inner_text().split("Este es el resumen")[-1])

        # M11 — Enviar
        boton("Enviar respuestas")
        texto = chat.locator("#mensajes").inner_text()
        chat.screenshot(path=f"{CAPTURAS}/04_chat_enviado.png", full_page=True)
        guardado = sql("SELECT enviado_por_paciente_en FROM controles WHERE id=?", (nuevo_id,))[0][0]
        anotar("M11 Envío", "'Enviar respuestas'", "Confirmación y fecha de envío guardada",
               f"Mensaje de confirmación: {'quedaron guardadas' in texto}; enviado_en={guardado}",
               "quedaron guardadas" in texto and guardado is not None)

        # M12 — Volver a abrir el enlace
        chat.reload(); chat.wait_for_timeout(500)
        texto = chat.locator("#mensajes").inner_text()
        anotar("M12 Volver a abrir enlace", "Recargar el chat", "'Ya enviaste tus respuestas' + resumen",
               "Aparece 'Ya enviaste': " + str("Ya enviaste" in texto), "Ya enviaste" in texto)

        # Panel refleja la respuesta del nuevo paciente
        pg.goto(BASE + "/panel?buscar=Paciente+Prueba")
        fila = pg.locator("tbody tr").first.inner_text()
        anotar("M11b Panel refleja respuesta", "Buscar 'Paciente Prueba' en el panel",
               "Completa, 1 de 2 realizados, requiere contacto (quiere aclarar)",
               fila.replace("\n", " ")[:160], "Completa" in fila and "Quiere aclarar" in fila)

        # M13 — Persistencia: cerrar y volver a abrir la aplicación
        detener_servidor(activo["servidor"])
        caido = False
        try:
            urllib.request.urlopen(BASE + "/panel", timeout=1)
        except Exception:
            caido = True
        activo["servidor"] = iniciar_servidor()
        pg.goto(f"{BASE}/control/{nuevo_id}")
        html = pg.content()
        anotar("M13 Persistencia", "Detener la aplicación y volver a iniciarla",
               "Respuestas siguen guardadas", f"App detenida: {caido}; tras reiniciar sigue 'Completa' y comentario: "
               f"{'resp-completa' in html and 'Comentario de prueba' in html}",
               caido and "resp-completa" in html and "Comentario de prueba" in html)

        # M14 — Recordatorios con la fecha de hoy
        pg.goto(BASE + "/panel")
        pg.fill("input[name=fecha_simulada]", hoy.isoformat())
        pg.click("text=Ejecutar recordatorios (simulados)")
        a = " ".join(avisos(pg))
        anotar("M14 Recordatorios hoy", "Ejecutar recordatorios con fecha de hoy",
               "PAC-003 recordatorio N°1; PAC-007 bloqueado", a,
               "PAC-003" in a and "N°1" in a and "PAC-007: bloqueado" in a)

        # M15 — Repetir: no duplica
        pg.fill("input[name=fecha_simulada]", hoy.isoformat())
        pg.click("text=Ejecutar recordatorios (simulados)")
        a = " ".join(avisos(pg))
        anotar("M15 Sin duplicar", "Repetir M14", "Ningún recordatorio nuevo", a, "no correspondía" in a)

        # M16 — Fecha simulada +4 días
        pg.fill("input[name=fecha_simulada]", (hoy + timedelta(days=4)).isoformat())
        pg.click("text=Ejecutar recordatorios (simulados)")
        a = " ".join(avisos(pg))
        anotar("M16 Fecha simulada +4", "Recordatorios con hoy+4",
               "PAC-003 N°2, PAC-004 N°1, PAC-007 bloqueado", a,
               "PAC-003" in a and "N°2" in a and "PAC-004" in a and "PAC-007: bloqueado" in a)

        # M7 — Invitación masiva sin duplicar
        pg.click("text=Simular invitación a todos los pendientes")
        a1 = " ".join(avisos(pg))
        pg.click("text=Simular invitación a todos los pendientes")
        a2 = " ".join(avisos(pg))
        anotar("M7 Invitación masiva", "Botón masivo dos veces", "1ª: 1 simulada (PAC-002). 2ª: 0",
               f"1ª: '{a1}' / 2ª: '{a2}'", "simuladas: 1." in a1 and "simuladas: 0." in a2)

        # M8 — Invitación fallida
        pg.goto(BASE + "/control/6")
        pg.click("text=Simular envío de invitación")
        a = " ".join(avisos(pg))
        anotar("M8 Invitación fallida", "PAC-006 → Simular envío", "'Sin teléfono registrado', sigue Fallida",
               a, "Sin teléfono" in a and pg.locator(".etq.inv-fallida").count() > 0)

        # M17 — Baja de mensajes desde el chat (PAC-004)
        token4 = sql("SELECT token FROM controles WHERE id=4")[0][0]
        chat.goto(f"{BASE}/c/{token4}"); chat.wait_for_timeout(400)
        retoma = "Retomemos" in chat.locator("#mensajes").inner_text()
        chat.once("dialog", lambda d: d.accept())
        chat.click("#baja"); chat.wait_for_timeout(400)
        pg.goto(BASE + "/control/4")
        motivo = "Pidió no recibir más mensajes" in pg.content()
        anotar("M17 Baja de mensajes", "Chat de PAC-004 → 'No quiero recibir más mensajes'",
               "Confirmación y motivo en el panel", f"Chat retomó donde quedó: {retoma}; motivo en panel: {motivo}",
               retoma and motivo and sql("SELECT acepta_mensajes FROM pacientes WHERE codigo='PAC-004'")[0][0] == 0)

        # M18 — Revisión sin nombre
        pg.goto(BASE + "/control/8")
        pg.fill("input[name=quien] >> nth=-1", "")
        pg.click("button[value=revisada]")
        a = " ".join(avisos(pg))
        anotar("M18 Revisión sin nombre", "Marcar revisada sin 'Quién revisa'", "Pide nombre",
               a, "Escribe quién revisó" in a)

        # M19 — Revisión con nombre + verificación de un examen
        pg.locator("form[action*='/examen/'] select").first.select_option("no_coincide")
        pg.locator("form[action*='/examen/'] input[name=quien]").first.fill("Enf. Demo")
        pg.locator("form[action*='/examen/'] button").first.click()
        verif = "El equipo verificó que NO coincide" in pg.content()
        pg.locator("input[name=quien]").last.fill("Enf. Demo")
        pg.fill("textarea[name=nota]", "Llamado (demo)")
        pg.click("button[value=revisada]")
        revisada = pg.locator(".etq.rev-revisada").count() > 0
        pg.screenshot(path=f"{CAPTURAS}/05_detalle_revisado.png", full_page=True)
        anotar("M19 Revisión + verificación", "PAC-008: verificar examen 'no coincide' y marcar revisada",
               "Estado Revisada; verificación separada de lo declarado",
               f"Revisada: {revisada}; motivo 'NO coincide' visible: {verif}", revisada and verif)

        # M20 — Filtro + exportación coinciden
        pg.goto(BASE + "/panel")
        pg.select_option("select[name=contacto]", "si")
        pg.select_option("select[name=revision]", "pendiente")
        pg.click("text=Filtrar")
        pg.wait_for_url("**contacto=si**")
        en_panel = ids_en_panel(pg)
        pg.screenshot(path=f"{CAPTURAS}/06_panel_filtrado.png", full_page=True)
        with pg.expect_download() as descarga:
            pg.click("text=Exportar esta tabla (CSV)")
        ruta_csv = descarga.value.path()
        texto_csv = open(ruta_csv, encoding="utf-8-sig").read()
        filas_csv = list(csv.DictReader(io.StringIO(texto_csv), delimiter=";"))
        en_csv = [f["id_control"] for f in filas_csv]
        anotar("M20 Filtro + exportación", "Filtro contacto=Sí y revisión=Pendiente → Exportar CSV",
               "Mismos controles en panel y CSV", f"Panel: {en_panel} / CSV: {en_csv}",
               en_panel == en_csv and len(en_panel) > 0 and "8" not in en_panel)

        # M21 — CSV sin identificadores directos
        encabezado = texto_csv.splitlines()[0]
        sin_ident = "nombre" not in encabezado and "telefono" not in encabezado and "Ficticia" not in texto_csv
        anotar("M21 CSV sin identificadores", "Revisar columnas del CSV", "Sin nombre ni teléfono",
               f"{len(encabezado.split(';'))} columnas; nombre/teléfono presentes: {not sin_ident}", sin_ident)

        # M22 — Dos controles del mismo paciente
        pg.goto(BASE + "/panel?buscar=PAC-010")
        filas_010 = pg.locator("tbody tr").all_inner_texts()
        pg.goto(BASE + "/control/11")
        enlaza = "/control/10" in pg.content()
        anotar("M22 Dos controles", "Buscar PAC-010", "2 filas con estados distintos y enlace entre ellos",
               f"{len(filas_010)} filas; estados: {[('Completa' if 'Completa' in f else 'Sin responder' if 'Sin responder' in f else '?') for f in filas_010]}; enlace: {enlaza}",
               len(filas_010) == 2 and enlaza and any("Completa" in f for f in filas_010) and any("Sin responder" in f for f in filas_010))

        # M23 — Enlace inventado
        r = pg.goto(BASE + "/c/enlace-inventado")
        anotar("M23 Enlace inventado", "Abrir /c/enlace-inventado", "404 (no encontrado)", f"Código {r.status}", r.status == 404)

        # M24 — Cambio de fecha desde el detalle
        pg.goto(BASE + "/control/5")
        pg.fill("input[name=nueva_fecha]", (hoy + timedelta(days=30)).isoformat())
        pg.locator("form[action$='/fecha'] input[name=quien]").fill("Secretaría Demo")
        pg.click("text=Cambiar fecha")
        html = pg.content()
        anotar("M24 Cambio de fecha", "PAC-005 → cambiar fecha a hoy+30",
               "Evento cambio_fecha y motivo 'fecha cambió después de confirmar'",
               f"Evento: {'cambio_fecha' in html}; motivo: {'fecha del control cambió' in html}",
               "cambio_fecha" in html and "fecha del control cambió" in html)

        # M25 — Corrección después de enviar reabre la revisión (PAC-001)
        token1 = sql("SELECT token FROM controles WHERE id=1")[0][0]
        chat.goto(f"{BASE}/c/{token1}"); chat.wait_for_timeout(400)
        filas = chat.locator(".resumen").last.locator(".fila-resumen")
        for i in range(filas.count()):
            if "alguien del equipo te contacte" in filas.nth(i).inner_text():
                filas.nth(i).locator("button").click(); break
        chat.wait_for_timeout(200)
        boton("Sí, por favor")
        boton("Enviar respuestas")
        estado_rev = sql("SELECT estado_revision FROM controles WHERE id=1")[0][0]
        n_resp = sql("SELECT COUNT(*) FROM respuestas WHERE control_id=1 AND pregunta_id='quiere_contacto'")[0][0]
        anotar("M25 Corrección tras enviar", "PAC-001 (ya revisado) cambia 'quiere contacto' a Sí y reenvía",
               "Revisión vuelve a Pendiente; sin respuestas duplicadas",
               f"Revisión: {estado_rev}; respuestas vigentes para esa pregunta: {n_resp}", estado_rev == "pendiente" and n_resp == 1)

        # M26 — Diccionario
        pg.goto(BASE + "/diccionario")
        anotar("M26 Diccionario CSV", "Abrir menú Diccionario CSV", "Explica columnas y que no es anónimo",
               "Página abierta; menciona 'seudonimizados': " + str("seudonimizados" in pg.content()),
               "seudonimizados" in pg.content())

        # Sin errores de JavaScript durante toda la prueba
        anotar("M27 Errores JavaScript", "Observar la consola del navegador durante todo el recorrido",
               "Ningún error", f"{len(errores_js)} errores {errores_js[:2]}", not errores_js)

        navegador.close()


def escribir_informe():
    pasaron = sum(1 for r in resultados if "Pasó" in r[4])
    lineas = [
        "# Informe de pruebas en navegador (generado automáticamente)",
        "",
        f"Fecha de ejecución: {date.today().isoformat()} · Navegador: Chromium (Playwright) · "
        f"Resultado: **{pasaron} de {len(resultados)} pasaron**",
        "",
        "Generado por `tests/prueba_navegador.py`. Capturas en `docs/capturas/`.",
        "",
        "| Caso | Acción | Resultado esperado | Resultado observado | ¿Pasó? |",
        "|---|---|---|---|---|",
    ]
    for r in resultados:
        lineas.append("| " + " | ".join(str(x).replace("|", "/").replace("\n", " ") for x in r) + " |")
    with open(os.path.join(CARPETA, "docs", "informe_pruebas_navegador.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lineas) + "\n")
    print(f"\n{pasaron} de {len(resultados)} pasaron")
    sys.exit(0 if pasaron == len(resultados) else 1)


if __name__ == "__main__":
    main()
