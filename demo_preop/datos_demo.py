"""
datos_demo.py
=============
Crea 10 pacientes FICTICIOS, cada uno con una situación distinta, para
poder mostrar todos los casos en la presentación.

Todos los nombres son inventados. Los teléfonos empiezan con 000 (no existen).
Las fechas se calculan a partir de HOY, para que la demo siempre se vea actual.

Uso desde la terminal (borra todo y vuelve a cargar los datos de ejemplo):
    python datos_demo.py
También se puede reiniciar desde el panel con el botón "Reiniciar demo".
"""

from datetime import date, timedelta

import reglas
from base_datos import borrar_todo, conectar, crear_tablas
from canal import CanalSimulado

# Exámenes de ejemplo (deben existir en config.json).
HEMO = "Hemograma (ejemplo)"
BIOQ = "Perfil bioquímico (ejemplo)"
COAG = "Pruebas de coagulación (ejemplo)"
ECG = "Electrocardiograma (ejemplo)"
RX = "Radiografía de rodilla (ejemplo)"
RM = "Resonancia magnética de rodilla (ejemplo)"


def cargar_datos_demo(conexion, cfg, cuestionario, construir_url):
    """Borra todo y carga los 10 casos. 'construir_url' arma el enlace a partir del token."""
    borrar_todo(conexion)
    crear_tablas(conexion)
    canal = CanalSimulado(cfg["prefijo_telefono_ficticio"])
    hoy = date.today()

    def dia(n):
        """Fecha de hoy + n días, como texto AAAA-MM-DD."""
        return (hoy + timedelta(days=n)).isoformat()

    def nuevo(nombre, telefono, dias, examenes, motivo="Control de rodilla (ficticio)"):
        """Crea paciente + control y devuelve (paciente_id, control_id)."""
        pid = reglas.crear_paciente(conexion, nombre, telefono, cfg)
        cid = reglas.crear_control(conexion, pid, dia(dias), motivo, examenes, cfg, cuestionario)
        return pid, cid

    def invitar(cid):
        control = reglas.obtener_control(conexion, cid)
        reglas.enviar_invitacion(conexion, cid, canal, construir_url(control["token"]), cfg)

    def responder(cid, tipo, item, valor):
        """Simula que el paciente aprieta un botón. 'item' puede ser el nombre del examen."""
        control = reglas.obtener_control(conexion, cid)
        if tipo.startswith("examen"):
            item = conexion.execute(
                "SELECT id FROM examenes_control WHERE control_id = ? AND nombre = ?", (cid, item)
            ).fetchone()["id"]
        reglas.guardar_respuesta(conexion, control, tipo, item, valor, cuestionario)

    def cuestionario_basico(cid, quiere_contacto="no", comentario=None):
        responder(cid, "pregunta", "medio_contacto", "mensaje")
        responder(cid, "pregunta", "ayuda_traslado", "no")
        responder(cid, "pregunta", "reservada_1", "a")
        responder(cid, "pregunta", "quiere_contacto", quiere_contacto)
        if comentario:
            responder(cid, "pregunta", "comentario", comentario)

    def enviar(cid):
        reglas.enviar_respuestas(conexion, reglas.obtener_control(conexion, cid))

    # 1) Caso "ideal": responde todo, luego CORRIGE una respuesta, y el equipo revisa.
    _, c = nuevo("Ana Ficticia", "0001111", 10, [HEMO, RX])
    invitar(c)
    responder(c, "confirma_control", None, "si")
    responder(c, "examen_realizado", HEMO, "si")
    responder(c, "examen_resultado", HEMO, "si")
    responder(c, "examen_realizado", RX, "si")
    responder(c, "examen_resultado", RX, "no")
    cuestionario_basico(c)
    enviar(c)
    responder(c, "examen_resultado", RX, "si")  # corrección después de enviar
    enviar(c)                                    # responde "dos veces"
    for nombre in (HEMO, RX):
        eid = conexion.execute("SELECT id FROM examenes_control WHERE control_id=? AND nombre=?",
                               (c, nombre)).fetchone()["id"]
        reglas.verificar_examen(conexion, reglas.obtener_control(conexion, c), eid, "coincide", "Enf. Demo")
    reglas.cambiar_revision(conexion, reglas.obtener_control(conexion, c), "revisada", "Enf. Demo",
                            "Todo declarado y verificado (demo).")

    # 2) Recién registrado: invitación todavía PENDIENTE.
    nuevo("Bruno Ejemplo", "0002222", 14, [HEMO, BIOQ, ECG])

    # 3) Invitado pero SIN RESPONDER (control en 5 días -> le toca recordatorio).
    _, c = nuevo("Carla Prueba", "0003333", 5, [HEMO, COAG, RX])
    invitar(c)

    # 4) Respuesta PARCIAL: empezó y dejó cosas sin responder.
    _, c = nuevo("Diego Muestra", "0004444", 8, [HEMO, RX, RM])
    invitar(c)
    responder(c, "confirma_control", None, "si")
    responder(c, "examen_realizado", HEMO, "si")
    responder(c, "examen_resultado", HEMO, "si")

    # 5) Completa, pero con un EXAMEN PENDIENTE ("todavía no").
    _, c = nuevo("Elena Simulada", "0005555", 12, [HEMO, ECG, RX])
    invitar(c)
    responder(c, "confirma_control", None, "si")
    responder(c, "examen_realizado", HEMO, "si")
    responder(c, "examen_resultado", HEMO, "si")
    responder(c, "examen_realizado", ECG, "todavia_no")
    responder(c, "examen_realizado", RX, "si")
    responder(c, "examen_resultado", RX, "si")
    cuestionario_basico(c)
    enviar(c)

    # 6) INVITACIÓN FALLIDA: no tiene teléfono registrado.
    _, c = nuevo("Felipe Inventado", "", 9, [HEMO, RX])
    invitar(c)

    # 7) Empezó a responder y pidió NO RECIBIR MÁS MENSAJES.
    _, c = nuevo("Gabriela Demo", "0007777", 6, [HEMO, BIOQ])
    invitar(c)
    responder(c, "confirma_control", None, "si")
    reglas.dar_de_baja(conexion, reglas.obtener_control(conexion, c))

    # 8) Completa, pero PIDE CONTACTO y tiene dudas sobre un examen.
    _, c = nuevo("Hugo Ficticio", "0008888", 11, [HEMO, COAG, RM])
    invitar(c)
    responder(c, "confirma_control", None, "si")
    responder(c, "examen_realizado", HEMO, "si")
    responder(c, "examen_resultado", HEMO, "no_sabe")
    responder(c, "examen_realizado", COAG, "aclarar")
    responder(c, "examen_realizado", RM, "no_sabe")
    cuestionario_basico(c, quiere_contacto="si", comentario="Texto de ejemplo: tengo dudas sobre la orden (ficticio).")
    enviar(c)

    # 9) Completa y confirmada, pero luego el equipo CAMBIA LA FECHA del control.
    _, c = nuevo("Irene Ejemplo", "0009999", 15, [HEMO, RX])
    invitar(c)
    responder(c, "confirma_control", None, "si")
    for nombre in (HEMO, RX):
        responder(c, "examen_realizado", nombre, "si")
        responder(c, "examen_resultado", nombre, "si")
    cuestionario_basico(c)
    enviar(c)
    reglas.cambiar_fecha(conexion, reglas.obtener_control(conexion, c), dia(20), "Secretaría Demo")

    # 10) Mismo paciente con DOS CONTROLES: uno antiguo completo y uno nuevo sin responder.
    pid, c_antiguo = nuevo("Javier Prueba", "0001010", -30, [HEMO, RX], "Control anterior (ficticio)")
    invitar(c_antiguo)
    responder(c_antiguo, "confirma_control", None, "si")
    for nombre in (HEMO, RX):
        responder(c_antiguo, "examen_realizado", nombre, "si")
        responder(c_antiguo, "examen_resultado", nombre, "si")
    cuestionario_basico(c_antiguo)
    enviar(c_antiguo)
    reglas.cambiar_revision(conexion, reglas.obtener_control(conexion, c_antiguo), "revisada",
                            "Enf. Demo", "Control anterior revisado (demo).")
    c_nuevo = reglas.crear_control(conexion, pid, dia(13), "Control de seguimiento (ficticio)",
                                   [HEMO, BIOQ, RM], cfg, cuestionario)
    invitar(c_nuevo)

    conexion.commit()


if __name__ == "__main__":
    # Esto solo se ejecuta si corres "python datos_demo.py" directamente.
    import os
    carpeta = os.path.dirname(os.path.abspath(__file__))
    cfg = reglas.cargar_json(os.path.join(carpeta, "config.json"))
    cuestionario = reglas.cargar_json(os.path.join(carpeta, "cuestionario.json"))
    ruta_db = os.environ.get("DEMO_DB", os.path.join(carpeta, "datos", "demo.sqlite3"))
    con = conectar(ruta_db)
    cargar_datos_demo(con, cfg, cuestionario, lambda token: f"http://127.0.0.1:8000/c/{token}")
    con.close()
    print(f"Listo: datos ficticios cargados en {ruta_db}")
