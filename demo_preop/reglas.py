"""
reglas.py
=========
Aquí están las REGLAS del sistema: cómo se calculan los estados, qué se
guarda cuando el paciente responde, cuándo corresponde un recordatorio, etc.

Separar las reglas de las pantallas (app.py) tiene dos ventajas:
  1. Se pueden probar automáticamente (tests/test_demo.py).
  2. Si mañana cambia la pantalla, las reglas siguen siendo las mismas.

IMPORTANTE: ninguna regla de este archivo es clínica. El sistema NO
diagnostica, NO calcula riesgos y NO decide si alguien puede operarse.
Solo ordena información administrativa y marca casos para que una PERSONA
del equipo los revise.
"""

import json
import secrets
from datetime import date, timedelta

from base_datos import ahora, marcar_actualizado, registrar_evento

# ---------------------------------------------------------------------------
# TEXTOS LEGIBLES para cada valor guardado. En la base de datos guardamos
# valores cortos y sin tildes ("todavia_no"); en pantalla mostramos frases.
# ---------------------------------------------------------------------------
ETIQUETAS = {
    "realizado": {
        "si": "Sí, me lo hice",
        "todavia_no": "Todavía no",
        "no_sabe": "No estoy seguro",
        "aclarar": "Prefiere aclararlo con el equipo",
        None: "Sin respuesta",
    },
    "resultado": {
        "si": "Sí, tiene el resultado",
        "no": "No lo tiene todavía",
        "no_sabe": "No sabe",
        "no_corresponde": "No corresponde (no declaró el examen como realizado)",
        None: "Sin respuesta",
    },
    "confirma_control": {
        "si": "Sí, es correcto",
        "no": "No, algo no coincide",
        "no_sabe": "No estoy seguro",
        None: "Sin respuesta",
    },
    "verificacion": {
        "sin_verificar": "Sin verificar",
        "coincide": "Verificado: coincide",
        "no_coincide": "Verificado: NO coincide",
    },
    "invitacion": {
        "pendiente": "Pendiente",
        "simulada": "Simulada (no enviada realmente)",
        "enviada": "Enviada",
        "fallida": "Fallida",
    },
    "respuesta": {
        "sin_responder": "Sin responder",
        "parcial": "Parcial",
        "completa": "Completa",
    },
    "revision": {"pendiente": "Pendiente", "revisada": "Revisada"},
}

# Valores permitidos para cada tipo de respuesta del paciente.
# None (vacío) significa "lo respondo después" = sin respuesta.
VALORES_REALIZADO = {"si", "todavia_no", "no_sabe", "aclarar", None}
VALORES_RESULTADO = {"si", "no", "no_sabe", None}
VALORES_CONFIRMA = {"si", "no", "no_sabe", None}


# ---------------------------------------------------------------------------
# CARGA DE ARCHIVOS DE CONFIGURACIÓN
# ---------------------------------------------------------------------------
def cargar_json(ruta):
    """Lee un archivo .json (config.json o cuestionario.json)."""
    with open(ruta, encoding="utf-8") as archivo:
        return json.load(archivo)


def preguntas_por_id(cuestionario):
    """Convierte la lista de preguntas en un diccionario {id: pregunta}."""
    return {p["id"]: p for p in cuestionario["preguntas"]}


# ---------------------------------------------------------------------------
# LECTURA DE DATOS DE UN CONTROL
# ---------------------------------------------------------------------------
def obtener_control(conexion, control_id):
    """Devuelve el control junto con los datos de su paciente."""
    return conexion.execute(
        """SELECT c.*, p.codigo, p.nombre_ficticio, p.telefono_ficticio, p.acepta_mensajes
           FROM controles c JOIN pacientes p ON p.id = c.paciente_id
           WHERE c.id = ?""",
        (control_id,),
    ).fetchone()


def obtener_control_por_token(conexion, token):
    """Busca un control usando el token secreto del enlace del paciente."""
    fila = conexion.execute("SELECT id FROM controles WHERE token = ?", (token,)).fetchone()
    return obtener_control(conexion, fila["id"]) if fila else None


def examenes_de(conexion, control_id):
    """Exámenes pedidos para UN control (nunca mezcla controles)."""
    return conexion.execute(
        "SELECT * FROM examenes_control WHERE control_id = ? ORDER BY tipo, nombre",
        (control_id,),
    ).fetchall()


def respuestas_de(conexion, control_id):
    """Respuestas del cuestionario de UN control, como diccionario {pregunta_id: valor}."""
    filas = conexion.execute(
        "SELECT pregunta_id, valor FROM respuestas WHERE control_id = ?", (control_id,)
    ).fetchall()
    return {f["pregunta_id"]: f["valor"] for f in filas}


def eventos_de(conexion, control_id):
    """Historial de UN control, del más nuevo al más antiguo."""
    return conexion.execute(
        "SELECT * FROM eventos WHERE control_id = ? ORDER BY id DESC", (control_id,)
    ).fetchall()


# ---------------------------------------------------------------------------
# CÁLCULO DE ESTADOS (se calculan cada vez; así nunca quedan desactualizados)
# ---------------------------------------------------------------------------
def calcular_estado_respuesta(control, examenes, respuestas, cuestionario):
    """
    - 'sin_responder': el paciente no ha respondido NADA.
    - 'completa': apretó "Enviar" y respondió todo lo obligatorio.
      ("No sé" o "prefiero aclararlo" CUENTAN como respuesta: son respuestas
       honestas. Lo que no cuenta es dejarla vacía.)
    - 'parcial': cualquier otra situación.
    OJO: 'completa' NO significa que el paciente esté clínicamente preparado.
    """
    hay_algo = any(v is not None for v in respuestas.values()) or any(
        e["declara_realizado"] is not None for e in examenes
    )
    if not hay_algo:
        return "sin_responder"

    faltan = []
    if respuestas.get("confirma_control") is None:
        faltan.append("confirmación del control")
    for e in examenes:
        if e["declara_realizado"] is None:
            faltan.append(e["nombre"])
        elif e["declara_realizado"] == "si" and e["declara_resultado"] is None:
            faltan.append(f"resultado de {e['nombre']}")
    for p in cuestionario["preguntas"]:
        if p.get("obligatoria") and respuestas.get(p["id"]) is None:
            faltan.append(p["id"])

    if not faltan and control["enviado_por_paciente_en"]:
        return "completa"
    return "parcial"


def calcular_motivos_contacto(control, examenes, respuestas, cuestionario, cfg, hoy):
    """
    Devuelve una lista de MOTIVOS por los que una persona del equipo debería
    mirar el caso. Son motivos ADMINISTRATIVOS, no clínicos.
    Lista vacía = por ahora no hay nada que requiera contacto humano.
    """
    motivos = []
    estado = calcular_estado_respuesta(control, examenes, respuestas, cuestionario)

    if control["estado_invitacion"] == "fallida":
        motivos.append("La invitación falló")
    if not control["acepta_mensajes"]:
        motivos.append("Pidió no recibir más mensajes")

    confirma = respuestas.get("confirma_control")
    if confirma in ("no", "no_sabe"):
        motivos.append("Indicó que los datos del control no coinciden o no está seguro")
    if control["fecha_confirmada"] and control["fecha_confirmada"] != control["fecha_control"]:
        motivos.append("La fecha del control cambió después de que el paciente la confirmó")

    for e in examenes:
        if e["declara_realizado"] == "aclarar":
            motivos.append(f"Quiere aclarar con el equipo: {e['nombre']}")
        elif e["declara_realizado"] == "no_sabe":
            motivos.append(f"No sabe si se realizó: {e['nombre']}")
        elif e["declara_realizado"] == "todavia_no":
            motivos.append(f"Declara examen pendiente: {e['nombre']}")
        elif e["declara_resultado"] in ("no", "no_sabe"):
            motivos.append(f"Resultado no disponible o no sabe: {e['nombre']}")
        if e["verificacion_equipo"] == "no_coincide":
            motivos.append(f"El equipo verificó que NO coincide: {e['nombre']}")

    for p in cuestionario["preguntas"]:
        valor = respuestas.get(p["id"])
        if valor is not None and valor in p.get("marca_contacto", []):
            motivos.append(f"Respuesta que pide atención: {p['id']} = {valor}")

    # Si el control está cerca y todavía no hay respuesta completa.
    dias = cfg["recordatorios"]["dias_antes_del_control"]
    ultimo_aviso = min(dias) if dias else 0
    dias_restantes = (date.fromisoformat(control["fecha_control"]) - hoy).days
    if estado != "completa" and control["estado_invitacion"] in ("simulada", "enviada") \
            and dias_restantes <= ultimo_aviso:
        motivos.append(f"Faltan {dias_restantes} días para el control y la respuesta no está completa")

    return motivos


def resumen_control(conexion, control, cuestionario, cfg, hoy):
    """
    Junta todo lo que el PANEL necesita mostrar de un control en un solo
    diccionario. La exportación CSV usa exactamente esta misma función,
    por eso el panel y la exportación siempre coinciden.
    """
    examenes = examenes_de(conexion, control["id"])
    respuestas = respuestas_de(conexion, control["id"])
    estado_resp = calcular_estado_respuesta(control, examenes, respuestas, cuestionario)
    motivos = calcular_motivos_contacto(control, examenes, respuestas, cuestionario, cfg, hoy)
    return {
        "control_id": control["id"],
        "codigo": control["codigo"],
        "nombre_ficticio": control["nombre_ficticio"],
        "fecha_control": control["fecha_control"],
        "motivo": control["motivo"],
        "estado_invitacion": control["estado_invitacion"],
        "estado_respuesta": estado_resp,
        "n_examenes": len(examenes),
        "n_realizados_declarados": sum(1 for e in examenes if e["declara_realizado"] == "si"),
        "n_pendientes_o_sin_resp": sum(1 for e in examenes if e["declara_realizado"] != "si"),
        "n_resultados_declarados": sum(1 for e in examenes if e["declara_resultado"] == "si"),
        "n_verificados_equipo": sum(1 for e in examenes if e["verificacion_equipo"] != "sin_verificar"),
        "requiere_contacto": bool(motivos),
        "motivos_contacto": motivos,
        "estado_revision": control["estado_revision"],
        "revisado_por": control["revisado_por"] or "",
        "acepta_mensajes": bool(control["acepta_mensajes"]),
        "actualizado_en": control["actualizado_en"],
        "version_cuestionario": control["version_cuestionario"],
    }


def todos_los_resumenes(conexion, cuestionario, cfg, hoy):
    """Resumen de todos los controles, ordenados por fecha de control."""
    ids = conexion.execute("SELECT id FROM controles ORDER BY fecha_control, id").fetchall()
    return [
        resumen_control(conexion, obtener_control(conexion, f["id"]), cuestionario, cfg, hoy)
        for f in ids
    ]


def filtrar(resumenes, filtros):
    """
    Aplica los filtros del panel. 'filtros' es un diccionario con claves
    opcionales: invitacion, respuesta, revision, contacto ('si'/'no'), buscar.
    """
    resultado = []
    for r in resumenes:
        if filtros.get("invitacion") and r["estado_invitacion"] != filtros["invitacion"]:
            continue
        if filtros.get("respuesta") and r["estado_respuesta"] != filtros["respuesta"]:
            continue
        if filtros.get("revision") and r["estado_revision"] != filtros["revision"]:
            continue
        if filtros.get("contacto") == "si" and not r["requiere_contacto"]:
            continue
        if filtros.get("contacto") == "no" and r["requiere_contacto"]:
            continue
        buscar = (filtros.get("buscar") or "").strip().lower()
        if buscar and buscar not in r["codigo"].lower() and buscar not in r["nombre_ficticio"].lower():
            continue
        resultado.append(r)
    return resultado


# ---------------------------------------------------------------------------
# REGISTRO DE PACIENTES Y CONTROLES (lo hace el equipo)
# ---------------------------------------------------------------------------
def siguiente_codigo(conexion):
    """Genera el próximo código de paciente: PAC-001, PAC-002, ..."""
    fila = conexion.execute("SELECT COUNT(*) AS n FROM pacientes").fetchone()
    numero = fila["n"] + 1
    while conexion.execute("SELECT 1 FROM pacientes WHERE codigo = ?", (f"PAC-{numero:03d}",)).fetchone():
        numero += 1
    return f"PAC-{numero:03d}"


def crear_paciente(conexion, nombre_ficticio, telefono_ficticio, cfg):
    """Registra un paciente FICTICIO. Rechaza teléfonos que no sean ficticios."""
    telefono = (telefono_ficticio or "").strip().replace(" ", "")
    if telefono and not telefono.startswith(cfg["prefijo_telefono_ficticio"]):
        raise ValueError(
            f"El teléfono debe ser ficticio y empezar con {cfg['prefijo_telefono_ficticio']}."
        )
    if not nombre_ficticio.strip():
        raise ValueError("Falta el nombre ficticio.")
    codigo = siguiente_codigo(conexion)
    cursor = conexion.execute(
        "INSERT INTO pacientes (codigo, nombre_ficticio, telefono_ficticio, creado_en) VALUES (?, ?, ?, ?)",
        (codigo, nombre_ficticio.strip(), telefono or None, ahora()),
    )
    return cursor.lastrowid


def crear_control(conexion, paciente_id, fecha_control, motivo, nombres_examenes, cfg, cuestionario):
    """
    Registra un control para un paciente y le asocia los exámenes elegidos.
    Cada control recibe un TOKEN: una clave larga y aleatoria que va en el
    enlace del paciente. Sin el token no se puede abrir su conversación.
    """
    date.fromisoformat(fecha_control)  # lanza error si la fecha no es válida
    catalogo = {e["nombre"]: e["tipo"] for e in cfg["catalogo_examenes"]}
    if not nombres_examenes:
        raise ValueError("Selecciona al menos un examen.")
    for nombre in nombres_examenes:
        if nombre not in catalogo:
            raise ValueError(f"Examen desconocido: {nombre}")

    momento = ahora()
    cursor = conexion.execute(
        """INSERT INTO controles (paciente_id, fecha_control, motivo, token, version_cuestionario,
                                  creado_en, actualizado_en)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (paciente_id, fecha_control, motivo.strip() or "Control (ficticio)",
         secrets.token_urlsafe(16), cuestionario["version"], momento, momento),
    )
    control_id = cursor.lastrowid
    for nombre in nombres_examenes:
        conexion.execute(
            "INSERT INTO examenes_control (control_id, nombre, tipo) VALUES (?, ?, ?)",
            (control_id, nombre, catalogo[nombre]),
        )
    registrar_evento(conexion, control_id, "control_registrado",
                     f"Control {fecha_control} con {len(nombres_examenes)} examen(es).", "equipo")
    return control_id


# ---------------------------------------------------------------------------
# INVITACIONES Y RECORDATORIOS
# ---------------------------------------------------------------------------
def texto_invitacion(control, url_paciente, cfg, es_recordatorio=False):
    """Prepara el texto del mensaje. En la demo se MUESTRA, pero no se envía."""
    inicio = "Recordatorio: " if es_recordatorio else ""
    return (
        f"[DEMO – mensaje ficticio] {inicio}Hola {control['nombre_ficticio']}. "
        f"El {cfg['nombre_equipo']} te invita a responder unas preguntas breves antes de tu "
        f"control del {control['fecha_control']}. Enlace: {url_paciente} . "
        f"Este canal no atiende urgencias."
    )


def enviar_invitacion(conexion, control_id, canal, url_paciente, cfg):
    """
    Intenta enviar (simular) la invitación de un control.
    Devuelve (exito, mensaje_para_mostrar).
    """
    control = obtener_control(conexion, control_id)
    if control is None:
        return False, "Control no encontrado."
    if not control["acepta_mensajes"]:
        registrar_evento(conexion, control_id, "envio_bloqueado",
                         "No se envió: el paciente pidió no recibir mensajes.", "sistema")
        return False, "El paciente pidió no recibir mensajes. No se envió nada."
    if control["estado_invitacion"] in ("simulada", "enviada"):
        return False, "La invitación ya fue enviada/simulada. No se duplica."

    resultado = canal.enviar(control["telefono_ficticio"],
                             texto_invitacion(control, url_paciente, cfg))
    conexion.execute("UPDATE controles SET estado_invitacion = ? WHERE id = ?",
                     (resultado.estado, control_id))
    tipo = "invitacion_" + resultado.estado  # invitacion_simulada / invitacion_fallida
    registrar_evento(conexion, control_id, tipo, resultado.detalle, "sistema")
    marcar_actualizado(conexion, control_id)
    return resultado.exito, resultado.detalle


def ejecutar_recordatorios(conexion, canal, cfg, cuestionario, hoy, construir_url):
    """
    Revisa TODOS los controles y simula recordatorios cuando corresponde.

    Corresponde un recordatorio si:
      - la invitación salió (simulada o enviada),
      - el paciente acepta mensajes,
      - la respuesta NO está completa,
      - el control es hoy o en el futuro,
      - hoy es igual o posterior a "fecha del control - N días" (config.json).

    Anti-duplicados: cada recordatorio tiene una clave única
    (control + fecha del control + número de recordatorio). Si ya existe,
    no se vuelve a enviar aunque se apriete el botón muchas veces.
    Como máximo se envía UN recordatorio por control en cada ejecución.

    'construir_url' es una función que recibe el token y devuelve el enlace.
    Devuelve una lista de textos que describen lo que se hizo.
    """
    dias = sorted(cfg["recordatorios"]["dias_antes_del_control"], reverse=True)  # ej: [7, 2]
    informe = []
    for fila in conexion.execute("SELECT id FROM controles ORDER BY id").fetchall():
        control = obtener_control(conexion, fila["id"])
        examenes = examenes_de(conexion, control["id"])
        respuestas = respuestas_de(conexion, control["id"])
        estado = calcular_estado_respuesta(control, examenes, respuestas, cuestionario)
        fecha = date.fromisoformat(control["fecha_control"])

        if control["estado_invitacion"] not in ("simulada", "enviada"):
            continue
        if estado == "completa" or fecha < hoy:
            continue

        # ¿Qué recordatorios ya "vencieron" a la fecha de hoy?
        vencidos = [i for i, d in enumerate(dias) if hoy >= fecha - timedelta(days=d)]
        if not vencidos:
            continue
        numero = vencidos[-1] + 1  # el más reciente que corresponde (1, 2, ...)
        clave = f"recordatorio-{control['id']}-{control['fecha_control']}-{numero}"

        if not control["acepta_mensajes"]:
            # Se deja constancia UNA sola vez de que no se envió por la solicitud del paciente.
            if registrar_evento(conexion, control["id"], "recordatorio_bloqueado",
                                "No se envió recordatorio: pidió no recibir mensajes.",
                                "sistema", clave_unica=clave + "-bloqueado"):
                informe.append(f"{control['codigo']}: bloqueado (pidió no recibir mensajes)")
            continue

        ya_existe = conexion.execute("SELECT 1 FROM eventos WHERE clave_unica = ?", (clave,)).fetchone()
        if ya_existe:
            continue

        resultado = canal.enviar(control["telefono_ficticio"],
                                 texto_invitacion(control, construir_url(control["token"]), cfg, True))
        tipo = "recordatorio_simulado" if resultado.exito else "recordatorio_fallido"
        registrar_evento(conexion, control["id"], tipo,
                         f"Recordatorio N°{numero} (fecha simulada {hoy.isoformat()}). {resultado.detalle}",
                         "sistema", clave_unica=clave)
        marcar_actualizado(conexion, control["id"])
        informe.append(f"{control['codigo']} ({control['fecha_control']}): recordatorio N°{numero} "
                       f"{'simulado' if resultado.exito else 'FALLIDO'}")
    return informe


# ---------------------------------------------------------------------------
# RESPUESTAS DEL PACIENTE
# ---------------------------------------------------------------------------
def _despues_de_enviar(conexion, control, descripcion):
    """
    Si el paciente cambia algo DESPUÉS de haber enviado, queda registrado
    como corrección y, si el equipo ya lo había revisado, la revisión vuelve
    a 'pendiente' para que alguien lo mire de nuevo.
    """
    if not control["enviado_por_paciente_en"]:
        return
    registrar_evento(conexion, control["id"], "respuesta_corregida", descripcion, "paciente")
    if control["estado_revision"] == "revisada":
        conexion.execute("UPDATE controles SET estado_revision = 'pendiente' WHERE id = ?", (control["id"],))
        registrar_evento(conexion, control["id"], "revision_reabierta",
                         "La revisión volvió a 'pendiente' porque el paciente corrigió una respuesta.",
                         "sistema")


def guardar_respuesta(conexion, control, tipo, item_id, valor, cuestionario):
    """
    Guarda UNA respuesta del paciente. Se llama cada vez que aprieta un botón,
    por eso si cierra la página a mitad de camino, lo respondido no se pierde.

    tipo:
      'confirma_control'  -> ¿son correctos los datos del control?
      'examen_realizado'  -> item_id = id del examen
      'examen_resultado'  -> item_id = id del examen
      'pregunta'          -> item_id = id de la pregunta del cuestionario
    valor: el valor elegido, o None si lo deja para después.
    Lanza ValueError si algo no es válido (así nunca se guarda basura).
    """
    control_id = control["id"]

    if tipo == "confirma_control":
        if valor not in VALORES_CONFIRMA:
            raise ValueError("Valor no válido.")
        anterior = respuestas_de(conexion, control_id).get("confirma_control")
        _guardar_en_respuestas(conexion, control_id, "confirma_control", valor, cuestionario)
        # Guardamos QUÉ fecha confirmó, para detectar si después cambia.
        fecha_confirmada = control["fecha_control"] if valor == "si" else None
        conexion.execute("UPDATE controles SET fecha_confirmada = ? WHERE id = ?", (fecha_confirmada, control_id))
        if anterior != valor:
            _despues_de_enviar(conexion, control, f"Confirmación del control: {anterior} → {valor}")

    elif tipo in ("examen_realizado", "examen_resultado"):
        # Seguridad: el examen DEBE pertenecer a este control (no mezclar pacientes).
        examen = conexion.execute(
            "SELECT * FROM examenes_control WHERE id = ? AND control_id = ?", (item_id, control_id)
        ).fetchone()
        if examen is None:
            raise ValueError("Ese examen no pertenece a este control.")

        if tipo == "examen_realizado":
            if valor not in VALORES_REALIZADO:
                raise ValueError("Valor no válido.")
            # Si NO se lo hizo (o no sabe), la pregunta del resultado no aplica.
            # Si se lo hizo, el resultado queda vacío hasta que responda.
            if valor == "si":
                resultado = None if examen["declara_resultado"] == "no_corresponde" else examen["declara_resultado"]
            elif valor is None:
                resultado = None
            else:
                resultado = "no_corresponde"
            conexion.execute(
                "UPDATE examenes_control SET declara_realizado = ?, declara_resultado = ? WHERE id = ?",
                (valor, resultado, examen["id"]),
            )
            if examen["declara_realizado"] != valor:
                _despues_de_enviar(conexion, control,
                                   f"{examen['nombre']} realizado: {examen['declara_realizado']} → {valor}")
        else:
            if examen["declara_realizado"] != "si":
                raise ValueError("Solo se pregunta por el resultado si el examen está realizado.")
            if valor not in VALORES_RESULTADO:
                raise ValueError("Valor no válido.")
            conexion.execute("UPDATE examenes_control SET declara_resultado = ? WHERE id = ?",
                             (valor, examen["id"]))
            if examen["declara_resultado"] != valor:
                _despues_de_enviar(conexion, control,
                                   f"{examen['nombre']} resultado: {examen['declara_resultado']} → {valor}")

    elif tipo == "pregunta":
        pregunta = preguntas_por_id(cuestionario).get(item_id)
        if pregunta is None:
            raise ValueError("Pregunta desconocida.")
        if pregunta["tipo"] == "opciones":
            permitidos = {o["valor"] for o in pregunta["opciones"]} | {None}
            if valor not in permitidos:
                raise ValueError("Opción no válida.")
        else:  # texto libre
            valor = (valor or "").strip()[: pregunta.get("max", 300)] or None
        anterior = respuestas_de(conexion, control_id).get(item_id)
        _guardar_en_respuestas(conexion, control_id, item_id, valor, cuestionario)
        if anterior != valor:
            _despues_de_enviar(conexion, control, f"Pregunta {item_id}: {anterior} → {valor}")
    else:
        raise ValueError("Tipo de respuesta desconocido.")

    registrar_evento(conexion, control_id, "conversacion_iniciada",
                     "El paciente comenzó a responder.", "paciente",
                     clave_unica=f"inicio-{control_id}")
    marcar_actualizado(conexion, control_id)


def _guardar_en_respuestas(conexion, control_id, pregunta_id, valor, cuestionario):
    """
    Inserta la respuesta o, si ya existía, la reemplaza (UPSERT).
    Gracias a UNIQUE(control_id, pregunta_id) nunca hay dos respuestas
    vigentes para la misma pregunta del mismo control.
    """
    conexion.execute(
        """INSERT INTO respuestas (control_id, pregunta_id, valor, version_cuestionario, respondido_en)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (control_id, pregunta_id)
           DO UPDATE SET valor = excluded.valor, respondido_en = excluded.respondido_en""",
        (control_id, pregunta_id, valor, cuestionario["version"], ahora()),
    )


def enviar_respuestas(conexion, control):
    """El paciente aprieta 'Enviar'. Puede hacerlo más de una vez (sin duplicar datos)."""
    primera_vez = control["enviado_por_paciente_en"] is None
    conexion.execute("UPDATE controles SET enviado_por_paciente_en = ? WHERE id = ?", (ahora(), control["id"]))
    registrar_evento(conexion, control["id"],
                     "respuestas_enviadas" if primera_vez else "respuestas_reenviadas",
                     "El paciente envió sus respuestas." if primera_vez
                     else "El paciente volvió a enviar (revisó o corrigió sus respuestas).",
                     "paciente")
    marcar_actualizado(conexion, control["id"])


def dar_de_baja(conexion, control):
    """El paciente pide no recibir más mensajes. Aplica al PACIENTE (todos sus controles)."""
    conexion.execute("UPDATE pacientes SET acepta_mensajes = 0 WHERE id = ?", (control["paciente_id"],))
    registrar_evento(conexion, control["id"], "baja_mensajes",
                     "El paciente pidió no recibir más mensajes.", "paciente")
    marcar_actualizado(conexion, control["id"])


# ---------------------------------------------------------------------------
# ACCIONES DEL EQUIPO
# ---------------------------------------------------------------------------
def cambiar_fecha(conexion, control, nueva_fecha, quien):
    """Cambia la fecha del control. Las respuestas se conservan, pero el panel avisará."""
    date.fromisoformat(nueva_fecha)
    if nueva_fecha == control["fecha_control"]:
        return
    conexion.execute("UPDATE controles SET fecha_control = ? WHERE id = ?", (nueva_fecha, control["id"]))
    registrar_evento(conexion, control["id"], "cambio_fecha",
                     f"{control['fecha_control']} → {nueva_fecha} (por {quien or 'equipo'})", "equipo")
    marcar_actualizado(conexion, control["id"])


def verificar_examen(conexion, control, examen_id, verificacion, quien):
    """El equipo anota si verificó lo que declaró el paciente. Es independiente de lo declarado."""
    if verificacion not in ETIQUETAS["verificacion"]:
        raise ValueError("Verificación no válida.")
    examen = conexion.execute("SELECT * FROM examenes_control WHERE id = ? AND control_id = ?",
                              (examen_id, control["id"])).fetchone()
    if examen is None:
        raise ValueError("Ese examen no pertenece a este control.")
    conexion.execute(
        "UPDATE examenes_control SET verificacion_equipo = ?, verificado_por = ?, verificado_en = ? WHERE id = ?",
        (verificacion, quien or None, ahora() if verificacion != "sin_verificar" else None, examen_id),
    )
    registrar_evento(conexion, control["id"], "verificacion_examen",
                     f"{examen['nombre']}: {verificacion} (por {quien or 'equipo'})", "equipo")
    marcar_actualizado(conexion, control["id"])


def cambiar_revision(conexion, control, nuevo_estado, quien, nota):
    """Marca el control como revisado (o lo reabre). Exige el nombre de quien revisa."""
    if nuevo_estado not in ("pendiente", "revisada"):
        raise ValueError("Estado no válido.")
    if nuevo_estado == "revisada" and not (quien or "").strip():
        raise ValueError("Escribe quién revisó (nombre ficticio).")
    conexion.execute(
        "UPDATE controles SET estado_revision = ?, revisado_por = ?, revisado_en = ?, nota_equipo = ? WHERE id = ?",
        (nuevo_estado, (quien or "").strip() or None,
         ahora() if nuevo_estado == "revisada" else None, (nota or "").strip() or None, control["id"]),
    )
    registrar_evento(conexion, control["id"], "revision_" + nuevo_estado,
                     f"Por {quien or 'equipo'}. Nota: {nota or '-'}", "equipo")
    marcar_actualizado(conexion, control["id"])
