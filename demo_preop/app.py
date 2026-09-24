"""
app.py
======
Programa principal de la demo. Usa Flask, una librería que convierte
funciones de Python en PÁGINAS WEB.

Cómo se lee este archivo:
    @app.get("/panel")        -> "cuando alguien abra la dirección /panel..."
    def panel(): ...          -> "...ejecuta esta función y muestra su resultado".

Hay dos "mundos" separados:
    1. EQUIPO (panel, registro, detalle, exportación): /panel, /registrar, /control/...
    2. PACIENTE (chat): /c/<token>  y su "API" /api/c/<token>/...
       (API = direcciones que no muestran una página, sino que reciben o
        entregan datos; el chat las usa por detrás cada vez que tocas un botón.)

Para iniciar:  python app.py      y abrir  http://127.0.0.1:8000
Para detener:  en la terminal, presionar Ctrl + C
"""

import csv
import io
import os
import secrets
from datetime import date

from flask import (Flask, Response, abort, flash, g, jsonify, redirect,
                   render_template, request, url_for)

import reglas
from base_datos import conectar, crear_tablas
from canal import CanalSimulado
from datos_demo import cargar_datos_demo

CARPETA = os.path.dirname(os.path.abspath(__file__))


def crear_app(ruta_db=None):
    """
    "Fábrica" de la aplicación: arma y devuelve la app.
    Recibir ruta_db permite que las pruebas automáticas usen OTRA base de
    datos, sin tocar la de la demo.
    """
    app = Flask(__name__)

    # Clave para firmar los avisos temporales (flash). Si no se define en una
    # variable de entorno, se genera una al azar cada vez: NUNCA va escrita en el código.
    app.secret_key = os.environ.get("CLAVE_SESION") or secrets.token_hex(32)

    ruta_db = ruta_db or os.environ.get("DEMO_DB") or os.path.join(CARPETA, "datos", "demo.sqlite3")
    cfg = reglas.cargar_json(os.path.join(CARPETA, "config.json"))
    cuestionario = reglas.cargar_json(os.path.join(CARPETA, "cuestionario.json"))
    canal = CanalSimulado(cfg["prefijo_telefono_ficticio"])  # <- en un piloto real se cambiaría esta línea
    clave_panel = os.environ.get("CLAVE_PANEL")               # contraseña opcional del panel

    # Si la base de datos no existe todavía, se crea y se llena con los 10 casos ficticios.
    es_nueva = not os.path.exists(ruta_db)
    con = conectar(ruta_db)
    crear_tablas(con)
    if es_nueva:
        cargar_datos_demo(con, cfg, cuestionario, lambda t: f"http://127.0.0.1:8000/c/{t}")
    con.close()

    # ------------------------------------------------------------------
    # Utilidades internas
    # ------------------------------------------------------------------
    def db():
        """Una conexión por cada visita a una página (se guarda en 'g')."""
        if "db" not in g:
            g.db = conectar(ruta_db)
        return g.db

    @app.teardown_appcontext
    def cerrar_db(_error):
        """Al terminar cada visita, se cierra la conexión."""
        conexion = g.pop("db", None)
        if conexion is not None:
            conexion.close()

    def url_paciente(token):
        """Enlace completo que recibiría el paciente."""
        return request.host_url.rstrip("/") + url_for("chat_paciente", token=token)

    def control_o_404(control_id):
        control = reglas.obtener_control(db(), control_id)
        if control is None:
            abort(404)
        return control

    @app.context_processor
    def variables_para_todas_las_paginas():
        """Datos disponibles en todas las plantillas HTML."""
        return {"E": reglas.ETIQUETAS, "cfg": cfg, "panel_protegido": bool(clave_panel)}

    # ------------------------------------------------------------------
    # PROTECCIÓN DEL PANEL (opcional en la demo local)
    # Si existe la variable de entorno CLAVE_PANEL, el navegador pedirá
    # usuario y contraseña para todo lo que NO sea el chat del paciente.
    # Esto es una protección BÁSICA, no suficiente para datos reales.
    # ------------------------------------------------------------------
    @app.before_request
    def proteger_panel():
        if not clave_panel:
            return None
        ruta = request.path
        if ruta.startswith("/c/") or ruta.startswith("/api/c/") or ruta.startswith("/static/"):
            return None  # el paciente entra con su enlace (token), no con contraseña
        auth = request.authorization
        if auth and auth.password and secrets.compare_digest(auth.password, clave_panel):
            return None
        return Response("Se requiere contraseña del panel.", 401,
                        {"WWW-Authenticate": 'Basic realm="Panel demo"'})

    # ------------------------------------------------------------------
    # PÁGINAS DEL EQUIPO
    # ------------------------------------------------------------------
    @app.get("/")
    def inicio():
        return redirect(url_for("panel"))

    def filtros_actuales():
        """Lee los filtros elegidos desde la dirección (?respuesta=parcial&...)."""
        return {k: request.args.get(k, "") for k in ("invitacion", "respuesta", "revision", "contacto", "buscar")}

    @app.get("/panel")
    def panel():
        hoy = date.today()
        todos = reglas.todos_los_resumenes(db(), cuestionario, cfg, hoy)
        filtros = filtros_actuales()
        filas = reglas.filtrar(todos, filtros)
        # Contadores (métricas administrativas) sobre TODOS los controles.
        total = len(todos)
        invitados = [r for r in todos if r["estado_invitacion"] in ("simulada", "enviada")]
        metricas = {
            "total": total,
            "invitados": len(invitados),
            "completas": sum(1 for r in invitados if r["estado_respuesta"] == "completa"),
            "parciales": sum(1 for r in invitados if r["estado_respuesta"] == "parcial"),
            "sin_responder": sum(1 for r in invitados if r["estado_respuesta"] == "sin_responder"),
            "contacto_pendiente": sum(1 for r in todos if r["requiere_contacto"] and r["estado_revision"] == "pendiente"),
            "fallidas": sum(1 for r in todos if r["estado_invitacion"] == "fallida"),
        }
        return render_template("panel.html", filas=filas, filtros=filtros, metricas=metricas,
                               hoy=hoy.isoformat(), query=request.query_string.decode())

    @app.route("/registrar", methods=["GET", "POST"])
    def registrar():
        pacientes = db().execute("SELECT * FROM pacientes ORDER BY codigo").fetchall()
        if request.method == "POST":
            f = request.form
            try:
                if f.get("confirmo_ficticio") != "si":
                    raise ValueError("Debes confirmar que los datos son ficticios.")
                if f.get("paciente_existente"):
                    paciente_id = int(f["paciente_existente"])
                else:
                    paciente_id = reglas.crear_paciente(db(), f.get("nombre_ficticio", ""),
                                                        f.get("telefono_ficticio", ""), cfg)
                control_id = reglas.crear_control(db(), paciente_id, f.get("fecha_control", ""),
                                                  f.get("motivo", ""), f.getlist("examenes"), cfg, cuestionario)
                db().commit()
                flash("Paciente y control registrados. La invitación queda PENDIENTE hasta que la simules.", "ok")
                return redirect(url_for("detalle", control_id=control_id))
            except ValueError as error:
                db().rollback()  # deshace cualquier cambio a medias
                flash(f"No se guardó: {error}", "error")
        return render_template("registrar.html", pacientes=pacientes, hoy=date.today().isoformat())

    @app.get("/control/<int:control_id>")
    def detalle(control_id):
        control = control_o_404(control_id)
        conexion = db()
        resumen = reglas.resumen_control(conexion, control, cuestionario, cfg, date.today())
        otros = conexion.execute(
            "SELECT id, fecha_control, motivo FROM controles WHERE paciente_id = ? AND id != ? ORDER BY fecha_control",
            (control["paciente_id"], control_id)).fetchall()
        return render_template(
            "detalle.html", c=control, r=resumen,
            examenes=reglas.examenes_de(conexion, control_id),
            respuestas=reglas.respuestas_de(conexion, control_id),
            eventos=reglas.eventos_de(conexion, control_id),
            preguntas=cuestionario["preguntas"], otros=otros,
            enlace=url_paciente(control["token"]),
            mensaje=reglas.texto_invitacion(control, url_paciente(control["token"]), cfg),
        )

    @app.post("/control/<int:control_id>/invitar")
    def invitar(control_id):
        control_o_404(control_id)
        token = reglas.obtener_control(db(), control_id)["token"]
        exito, texto = reglas.enviar_invitacion(db(), control_id, canal, url_paciente(token), cfg)
        db().commit()
        flash(texto, "ok" if exito else "error")
        return redirect(url_for("detalle", control_id=control_id))

    @app.post("/invitar-pendientes")
    def invitar_pendientes():
        """Simula la invitación de TODOS los controles con invitación pendiente."""
        filas = db().execute("SELECT id, token FROM controles WHERE estado_invitacion = 'pendiente'").fetchall()
        n_ok = n_error = 0
        for fila in filas:
            exito, _ = reglas.enviar_invitacion(db(), fila["id"], canal, url_paciente(fila["token"]), cfg)
            n_ok, n_error = n_ok + exito, n_error + (not exito)
        db().commit()
        flash(f"Invitaciones simuladas: {n_ok}. Fallidas o bloqueadas: {n_error}. (Ningún mensaje real salió.)", "ok")
        return redirect(url_for("panel"))

    @app.post("/recordatorios")
    def recordatorios():
        """Ejecuta la simulación de recordatorios para una fecha elegida (por defecto, hoy)."""
        try:
            hoy = date.fromisoformat(request.form.get("fecha_simulada") or date.today().isoformat())
        except ValueError:
            flash("Fecha no válida.", "error")
            return redirect(url_for("panel"))
        informe = reglas.ejecutar_recordatorios(db(), canal, cfg, cuestionario, hoy, url_paciente)
        db().commit()
        if informe:
            flash(f"Recordatorios para la fecha simulada {hoy}: " + " | ".join(informe), "ok")
        else:
            flash(f"Fecha simulada {hoy}: no correspondía ningún recordatorio nuevo (no se duplican).", "ok")
        return redirect(url_for("panel"))

    @app.post("/control/<int:control_id>/fecha")
    def cambiar_fecha(control_id):
        control = control_o_404(control_id)
        try:
            reglas.cambiar_fecha(db(), control, request.form.get("nueva_fecha", ""), request.form.get("quien", ""))
            db().commit()
            flash("Fecha actualizada. Las respuestas se conservan; el panel avisará si el paciente había confirmado otra fecha.", "ok")
        except ValueError:
            flash("Fecha no válida.", "error")
        return redirect(url_for("detalle", control_id=control_id))

    @app.post("/control/<int:control_id>/examen/<int:examen_id>/verificar")
    def verificar(control_id, examen_id):
        control = control_o_404(control_id)
        try:
            reglas.verificar_examen(db(), control, examen_id, request.form.get("verificacion"),
                                    request.form.get("quien", ""))
            db().commit()
            flash("Verificación del equipo guardada.", "ok")
        except ValueError as error:
            flash(str(error), "error")
        return redirect(url_for("detalle", control_id=control_id))

    @app.post("/control/<int:control_id>/revision")
    def revision(control_id):
        control = control_o_404(control_id)
        try:
            reglas.cambiar_revision(db(), control, request.form.get("estado"),
                                    request.form.get("quien", ""), request.form.get("nota", ""))
            db().commit()
            flash("Estado de revisión actualizado.", "ok")
        except ValueError as error:
            flash(str(error), "error")
        return redirect(url_for("detalle", control_id=control_id))

    @app.post("/reiniciar")
    def reiniciar():
        """Borra todo y vuelve a cargar los 10 casos ficticios."""
        cargar_datos_demo(db(), cfg, cuestionario, url_paciente)
        flash("Datos de demostración reiniciados (10 pacientes ficticios).", "ok")
        return redirect(url_for("panel"))

    # ------------------------------------------------------------------
    # EXPORTACIÓN CSV (se abre con Excel). Usa los MISMOS filtros del panel.
    # ------------------------------------------------------------------
    def csv_seguro(valor):
        """
        Evita la "inyección de fórmulas": si un texto empieza con = + - @,
        Excel podría interpretarlo como fórmula. Le anteponemos un apóstrofo.
        """
        texto = "" if valor is None else str(valor)
        return "'" + texto if texto[:1] in ("=", "+", "-", "@") else texto

    def respuesta_csv(nombre_archivo, encabezados, filas):
        salida = io.StringIO()
        # Punto y coma (;) porque Excel en español lo usa como separador.
        escritor = csv.writer(salida, delimiter=";")
        escritor.writerow(encabezados)
        for fila in filas:
            escritor.writerow([csv_seguro(v) for v in fila])
        # "﻿" (BOM) ayuda a Excel a mostrar bien las tildes y la ñ.
        return Response("﻿" + salida.getvalue(), mimetype="text/csv",
                        headers={"Content-Disposition": f"attachment; filename={nombre_archivo}"})

    COLUMNAS_CONTROLES = [
        "codigo_paciente", "id_control", "fecha_control", "estado_invitacion", "estado_respuesta",
        "n_examenes", "n_realizados_declarados", "n_pendientes_o_sin_respuesta",
        "n_resultados_disponibles_declarados", "n_verificados_equipo", "requiere_contacto",
        "motivos_contacto", "estado_revision", "revisado_por", "ultima_actualizacion",
        "version_cuestionario", "acepta_mensajes",
    ]

    @app.get("/exportar/controles.csv")
    def exportar_controles():
        todos = reglas.todos_los_resumenes(db(), cuestionario, cfg, date.today())
        filas = reglas.filtrar(todos, filtros_actuales())
        return respuesta_csv("controles_demo.csv", COLUMNAS_CONTROLES, [
            [r["codigo"], r["control_id"], r["fecha_control"], r["estado_invitacion"], r["estado_respuesta"],
             r["n_examenes"], r["n_realizados_declarados"], r["n_pendientes_o_sin_resp"],
             r["n_resultados_declarados"], r["n_verificados_equipo"], "si" if r["requiere_contacto"] else "no",
             " | ".join(r["motivos_contacto"]), r["estado_revision"], r["revisado_por"], r["actualizado_en"],
             r["version_cuestionario"], "si" if r["acepta_mensajes"] else "no"]
            for r in filas
        ])

    @app.get("/exportar/examenes.csv")
    def exportar_examenes():
        filas = db().execute(
            """SELECT p.codigo, c.id AS control_id, c.fecha_control, e.nombre, e.tipo,
                      e.declara_realizado, e.declara_resultado, e.verificacion_equipo
               FROM examenes_control e
               JOIN controles c ON c.id = e.control_id
               JOIN pacientes p ON p.id = c.paciente_id
               ORDER BY c.fecha_control, c.id, e.nombre""").fetchall()
        return respuesta_csv(
            "examenes_demo.csv",
            ["codigo_paciente", "id_control", "fecha_control", "examen", "tipo",
             "paciente_declara_realizado", "paciente_declara_resultado", "verificacion_equipo"],
            # "sin_respuesta" se escribe explícitamente: NO se inventa ninguna respuesta.
            [[f["codigo"], f["control_id"], f["fecha_control"], f["nombre"], f["tipo"],
              f["declara_realizado"] or "sin_respuesta", f["declara_resultado"] or "sin_respuesta",
              f["verificacion_equipo"]] for f in filas])

    @app.get("/diccionario")
    def diccionario():
        return render_template("diccionario.html")

    # ------------------------------------------------------------------
    # MUNDO DEL PACIENTE (chat). Solo se accede con el token del enlace.
    # ------------------------------------------------------------------
    def control_por_token_o_404(token):
        control = reglas.obtener_control_por_token(db(), token)
        if control is None:
            abort(404)
        return control

    @app.get("/c/<token>")
    def chat_paciente(token):
        control_por_token_o_404(token)
        return render_template("chat.html", token=token)

    @app.get("/api/c/<token>")
    def api_estado(token):
        """Entrega al chat SOLO los datos de este control (nada de otros pacientes)."""
        control = control_por_token_o_404(token)
        examenes = reglas.examenes_de(db(), control["id"])
        return jsonify({
            "nombre": control["nombre_ficticio"].split(" ")[0],  # solo el primer nombre
            "unidad": cfg["unidad"],
            "fecha_control": control["fecha_control"],
            "motivo": control["motivo"],
            "enviado_en": control["enviado_por_paciente_en"],
            "acepta_mensajes": bool(control["acepta_mensajes"]),
            "examenes": [{"id": e["id"], "nombre": e["nombre"], "tipo": e["tipo"],
                          "realizado": e["declara_realizado"], "resultado": e["declara_resultado"]}
                         for e in examenes],
            "respuestas": reglas.respuestas_de(db(), control["id"]),
            "cuestionario": cuestionario,
        })

    @app.post("/api/c/<token>/respuesta")
    def api_respuesta(token):
        control = control_por_token_o_404(token)
        datos = request.get_json(silent=True) or {}
        try:
            reglas.guardar_respuesta(db(), control, datos.get("tipo"), datos.get("item"),
                                     datos.get("valor"), cuestionario)
            db().commit()
            return jsonify({"ok": True})
        except ValueError as error:
            db().rollback()
            return jsonify({"ok": False, "error": str(error)}), 400

    @app.post("/api/c/<token>/enviar")
    def api_enviar(token):
        control = control_por_token_o_404(token)
        reglas.enviar_respuestas(db(), control)
        db().commit()
        return jsonify({"ok": True})

    @app.post("/api/c/<token>/baja")
    def api_baja(token):
        control = control_por_token_o_404(token)
        reglas.dar_de_baja(db(), control)
        db().commit()
        return jsonify({"ok": True})

    return app


if __name__ == "__main__":
    # host 127.0.0.1 = la app solo es visible desde TU computador (no desde internet ni la red).
    # debug=False para no exponer información interna si ocurre un error.
    crear_app().run(host="127.0.0.1", port=8000, debug=False)
