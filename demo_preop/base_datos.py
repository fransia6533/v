"""
base_datos.py
=============
Todo lo relacionado con la BASE DE DATOS de la demo.

¿Qué es una base de datos?
    Es un archivo donde la información se guarda ordenada en TABLAS
    (parecidas a hojas de Excel). Cada tabla tiene COLUMNAS (campos) y
    FILAS (registros).

¿Qué usamos?
    SQLite: una base de datos que vive en UN solo archivo
    (datos/demo.sqlite3). No hay que instalar nada extra: viene incluida
    con Python. Si cierras la aplicación, el archivo sigue ahí, por eso
    las respuestas no se pierden.

Tablas (ver docs/03_datos.md para la explicación campo por campo):
    pacientes         -> personas FICTICIAS
    controles         -> citas de control (un paciente puede tener varias)
    examenes_control  -> exámenes pedidos para CADA control
    respuestas        -> respuestas del cuestionario, por control
    eventos           -> historial: invitaciones, recordatorios, cambios
"""

import sqlite3
from datetime import datetime

# ---------------------------------------------------------------------------
# ESQUEMA: la "forma" de las tablas. Se escribe en lenguaje SQL, que es el
# idioma que entienden las bases de datos. "IF NOT EXISTS" significa que
# solo se crean si todavía no existen (no borra nada al reiniciar).
# Las reglas CHECK impiden guardar valores que no están en la lista.
# ---------------------------------------------------------------------------
ESQUEMA = """
CREATE TABLE IF NOT EXISTS pacientes (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT, -- número interno automático
    codigo             TEXT NOT NULL UNIQUE,              -- ej: PAC-001 (no se repite)
    nombre_ficticio    TEXT NOT NULL,                     -- nombre inventado
    telefono_ficticio  TEXT,                              -- vacío = no hay a dónde enviar
    acepta_mensajes    INTEGER NOT NULL DEFAULT 1         -- 1 = sí, 0 = pidió no recibir más
                       CHECK (acepta_mensajes IN (0, 1)),
    creado_en          TEXT NOT NULL                      -- fecha y hora de registro
);

CREATE TABLE IF NOT EXISTS controles (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id           INTEGER NOT NULL REFERENCES pacientes(id),
    fecha_control         TEXT NOT NULL,                  -- formato AAAA-MM-DD
    motivo                TEXT NOT NULL,                  -- ej: "Control de rodilla (ficticio)"
    token                 TEXT NOT NULL UNIQUE,           -- clave secreta del enlace del paciente
    version_cuestionario  TEXT NOT NULL,                  -- con qué versión de preguntas se trabaja
    estado_invitacion     TEXT NOT NULL DEFAULT 'pendiente'
                          CHECK (estado_invitacion IN ('pendiente', 'simulada', 'enviada', 'fallida')),
    enviado_por_paciente_en TEXT,                         -- cuándo apretó "Enviar" (vacío = nunca)
    fecha_confirmada      TEXT,                           -- fecha que el paciente confirmó como correcta
    estado_revision       TEXT NOT NULL DEFAULT 'pendiente'
                          CHECK (estado_revision IN ('pendiente', 'revisada')),
    revisado_por          TEXT,                           -- nombre de quien revisó (ficticio)
    revisado_en           TEXT,
    nota_equipo           TEXT,                           -- nota interna del equipo
    creado_en             TEXT NOT NULL,
    actualizado_en        TEXT NOT NULL                   -- última vez que algo cambió
);

CREATE TABLE IF NOT EXISTS examenes_control (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    control_id          INTEGER NOT NULL REFERENCES controles(id),
    nombre              TEXT NOT NULL,
    tipo                TEXT NOT NULL CHECK (tipo IN ('laboratorio', 'imagen')),
    -- LO QUE DICE EL PACIENTE (vacío/NULL = sin respuesta):
    declara_realizado   TEXT CHECK (declara_realizado IN ('si', 'todavia_no', 'no_sabe', 'aclarar')),
    declara_resultado   TEXT CHECK (declara_resultado IN ('si', 'no', 'no_sabe', 'no_corresponde')),
    -- LO QUE VERIFICÓ EL EQUIPO (es algo distinto a lo que dice el paciente):
    verificacion_equipo TEXT NOT NULL DEFAULT 'sin_verificar'
                        CHECK (verificacion_equipo IN ('sin_verificar', 'coincide', 'no_coincide')),
    verificado_por      TEXT,
    verificado_en       TEXT,
    UNIQUE (control_id, nombre)                           -- el mismo examen no se repite en un control
);

CREATE TABLE IF NOT EXISTS respuestas (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    control_id            INTEGER NOT NULL REFERENCES controles(id),
    pregunta_id           TEXT NOT NULL,                  -- ej: "quiere_contacto"
    valor                 TEXT,                           -- NULL = la dejó pendiente
    version_cuestionario  TEXT NOT NULL,
    respondido_en         TEXT NOT NULL,
    UNIQUE (control_id, pregunta_id)                      -- una sola respuesta vigente por pregunta
);

CREATE TABLE IF NOT EXISTS eventos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    control_id   INTEGER REFERENCES controles(id),
    tipo         TEXT NOT NULL,                           -- ej: invitacion_simulada, recordatorio_simulado
    detalle      TEXT,
    actor        TEXT NOT NULL,                           -- sistema / paciente / equipo
    clave_unica  TEXT UNIQUE,                             -- evita duplicados (ej: el mismo recordatorio dos veces)
    creado_en    TEXT NOT NULL
);
"""


def ahora():
    """Devuelve la fecha y hora actual como texto, ej: '2026-09-24T10:30:00'."""
    return datetime.now().isoformat(timespec="seconds")


def conectar(ruta_db):
    """
    Abre la conexión con el archivo de base de datos.
    - row_factory = sqlite3.Row permite leer columnas por nombre: fila["codigo"].
    - foreign_keys = ON hace que SQLite respete las relaciones entre tablas
      (por ejemplo, no permite un control de un paciente que no existe).
    """
    conexion = sqlite3.connect(ruta_db)
    conexion.row_factory = sqlite3.Row
    conexion.execute("PRAGMA foreign_keys = ON")
    return conexion


def crear_tablas(conexion):
    """Crea las tablas si no existen. Es seguro llamarla varias veces."""
    conexion.executescript(ESQUEMA)
    conexion.commit()


def borrar_todo(conexion):
    """Borra TODAS las tablas. Solo se usa para reiniciar los datos ficticios."""
    conexion.executescript(
        """
        DROP TABLE IF EXISTS eventos;
        DROP TABLE IF EXISTS respuestas;
        DROP TABLE IF EXISTS examenes_control;
        DROP TABLE IF EXISTS controles;
        DROP TABLE IF EXISTS pacientes;
        """
    )
    conexion.commit()


def registrar_evento(conexion, control_id, tipo, detalle, actor, clave_unica=None):
    """
    Anota algo que pasó en el historial (tabla eventos).
    Si se entrega una clave_unica que ya existe, NO se anota de nuevo y la
    función devuelve False. Así evitamos, por ejemplo, recordatorios repetidos.
    """
    try:
        conexion.execute(
            "INSERT INTO eventos (control_id, tipo, detalle, actor, clave_unica, creado_en) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (control_id, tipo, detalle, actor, clave_unica, ahora()),
        )
        return True
    except sqlite3.IntegrityError:
        # La clave_unica ya existía: el evento ya se había registrado antes.
        return False


def marcar_actualizado(conexion, control_id):
    """Actualiza la 'última actualización' de un control."""
    conexion.execute(
        "UPDATE controles SET actualizado_en = ? WHERE id = ?", (ahora(), control_id)
    )
