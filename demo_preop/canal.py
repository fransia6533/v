"""
canal.py
========
El "canal" es el medio por el que se le envía un mensaje al paciente
(WhatsApp, SMS, correo...).

EN ESTA DEMO NO SE ENVÍA NINGÚN MENSAJE REAL.
El CanalSimulado solo "finge" el envío y devuelve un resultado.
El estado que queda guardado es 'simulada', nunca 'enviada', para no
presentar una simulación como si fuera un mensaje real.

¿Por qué está en un archivo aparte?
    Para que en un piloto real se pueda crear otra clase, por ejemplo
    CanalWhatsApp, con el MISMO método enviar(...), y cambiar solo una línea
    en app.py. El resto de la aplicación (panel, chat, base de datos) no
    tendría que rehacerse. Ver docs/06_recordatorios_y_casos.md.
"""

from dataclasses import dataclass


@dataclass
class ResultadoEnvio:
    """Lo que devuelve un canal después de intentar enviar un mensaje."""
    exito: bool     # True si "salió" bien
    estado: str     # 'simulada' (demo), 'enviada' (canal real) o 'fallida'
    detalle: str    # explicación legible para el historial


class CanalSimulado:
    """Canal de mentira: no se conecta a internet ni a ningún servicio."""

    nombre = "simulado"

    def __init__(self, prefijo_ficticio="000"):
        # Solo aceptamos teléfonos con el prefijo ficticio (ver config.json).
        self.prefijo_ficticio = prefijo_ficticio

    def enviar(self, telefono, texto):
        """
        Simula el envío de 'texto' al 'telefono'.
        Reglas de la simulación (sirven para demostrar casos especiales):
          - Sin teléfono                      -> fallida
          - Teléfono que no es ficticio       -> fallida (protección)
          - Teléfono terminado en '0000'      -> fallida (simula número inválido)
          - Cualquier otro teléfono ficticio  -> simulada (NO enviada de verdad)
        """
        if not telefono:
            return ResultadoEnvio(False, "fallida", "Sin teléfono registrado.")
        if not telefono.startswith(self.prefijo_ficticio):
            return ResultadoEnvio(False, "fallida", "Teléfono no ficticio: la demo no envía a números reales.")
        if telefono.endswith("0000"):
            return ResultadoEnvio(False, "fallida", "Simulación de número inválido (termina en 0000).")
        return ResultadoEnvio(
            True,
            "simulada",
            f"Envío SIMULADO a {telefono}. Ningún mensaje salió realmente.",
        )
