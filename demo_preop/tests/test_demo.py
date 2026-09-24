"""
tests/test_demo.py
==================
PRUEBAS AUTOMÁTICAS. Son pequeños programas que usan la demo como lo haría
una persona y comprueban que el resultado sea el esperado.

Cómo ejecutarlas (desde la carpeta demo_preop):
    python -m unittest discover -s tests -v

Cada prueba usa una base de datos TEMPORAL, así que no toca tu demo.
Si todo está bien, al final verás "OK". Si algo falla, verás "FAILED" y el motivo.
"""

import csv
import io
import os
import re
import sys
import tempfile
import unittest
from datetime import date, timedelta

# Permite importar app.py, reglas.py, etc. desde la carpeta superior.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import reglas  # noqa: E402
from app import crear_app  # noqa: E402
from base_datos import conectar  # noqa: E402


class PruebasDemo(unittest.TestCase):

    def setUp(self):
        """Antes de cada prueba: base de datos nueva con los 10 casos ficticios."""
        self.carpeta = tempfile.TemporaryDirectory()
        self.ruta_db = os.path.join(self.carpeta.name, "prueba.sqlite3")
        self.app = crear_app(self.ruta_db)
        self.cliente = self.app.test_client()

    def tearDown(self):
        self.carpeta.cleanup()

    # ---------- utilidades ----------
    def sql(self, consulta, parametros=()):
        con = conectar(self.ruta_db)
        filas = con.execute(consulta, parametros).fetchall()
        con.close()
        return filas

    def token_de(self, control_id):
        return self.sql("SELECT token FROM controles WHERE id = ?", (control_id,))[0]["token"]

    def responder(self, token, tipo, item, valor):
        return self.cliente.post(f"/api/c/{token}/respuesta", json={"tipo": tipo, "item": item, "valor": valor})

    def registrar(self, nombre="Paciente Prueba", telefono="0005678", dias=10, examenes=None):
        examenes = examenes or ["Hemograma (ejemplo)"]
        return self.cliente.post("/registrar", data={
            "nombre_ficticio": nombre, "telefono_ficticio": telefono,
            "fecha_control": (date.today() + timedelta(days=dias)).isoformat(),
            "motivo": "Control de prueba", "examenes": examenes, "confirmo_ficticio": "si",
        })

    # ---------- pruebas ----------
    def test_01_carga_diez_pacientes_ficticios(self):
        self.assertEqual(len(self.sql("SELECT * FROM pacientes")), 10)
        self.assertEqual(len(self.sql("SELECT * FROM controles")), 11)  # PAC-010 tiene 2 controles
        self.assertEqual(self.cliente.get("/panel").status_code, 200)

    def test_02_recorrido_minimo_y_persistencia(self):
        """Un paciente -> un control -> un examen -> respuesta -> guardado -> visible -> sigue tras reiniciar."""
        r = self.registrar()
        self.assertEqual(r.status_code, 302)  # redirige al detalle = se guardó
        control = self.sql("SELECT * FROM controles ORDER BY id DESC LIMIT 1")[0]
        self.assertEqual(control["estado_invitacion"], "pendiente")

        self.cliente.post(f"/control/{control['id']}/invitar")
        self.assertEqual(self.sql("SELECT estado_invitacion FROM controles WHERE id=?", (control["id"],))[0][0], "simulada")

        examen_id = self.sql("SELECT id FROM examenes_control WHERE control_id=?", (control["id"],))[0]["id"]
        token = control["token"]
        self.assertEqual(self.responder(token, "examen_realizado", examen_id, "si").status_code, 200)

        # "Cerrar y volver a abrir la aplicación": creamos una app NUEVA con el mismo archivo.
        otra_app = crear_app(self.ruta_db).test_client()
        datos = otra_app.get(f"/api/c/{token}").get_json()
        self.assertEqual(datos["examenes"][0]["realizado"], "si")
        self.assertIn("Parcial", otra_app.get(f"/control/{control['id']}").data.decode())

    def test_03_no_se_mezclan_controles_ni_pacientes(self):
        # PAC-010 tiene el control 10 (antiguo, completo) y el 11 (nuevo, sin responder).
        antiguo = self.sql("SELECT * FROM examenes_control WHERE control_id=10")
        token_nuevo = self.token_de(11)
        # Intentar responder, desde el enlace del control 11, un examen del control 10 -> rechazado.
        r = self.responder(token_nuevo, "examen_realizado", antiguo[0]["id"], "todavia_no")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(self.sql("SELECT declara_realizado FROM examenes_control WHERE id=?",
                                  (antiguo[0]["id"],))[0][0], "si")
        # El chat del control 11 solo ve sus propios exámenes.
        datos = self.cliente.get(f"/api/c/{token_nuevo}").get_json()
        ids = {e["id"] for e in datos["examenes"]}
        self.assertEqual(ids, {f["id"] for f in self.sql("SELECT id FROM examenes_control WHERE control_id=11")})
        self.assertEqual(datos["respuestas"], {})

    def test_04_valores_invalidos_no_se_guardan(self):
        token = self.token_de(3)
        examen_id = self.sql("SELECT id FROM examenes_control WHERE control_id=3")[0]["id"]
        self.assertEqual(self.responder(token, "examen_realizado", examen_id, "quizas").status_code, 400)
        # Resultado sin haber declarado el examen realizado -> rechazado.
        self.assertEqual(self.responder(token, "examen_resultado", examen_id, "si").status_code, 400)
        self.assertEqual(self.cliente.get("/api/c/token-inventado").status_code, 404)

    def test_05_cuatro_tipos_de_no_respuesta_se_distinguen(self):
        token = self.token_de(3)
        e1, e2, e3 = [f["id"] for f in self.sql("SELECT id FROM examenes_control WHERE control_id=3 ORDER BY id")]
        self.responder(token, "examen_realizado", e1, "todavia_no")  # "no"
        self.responder(token, "examen_realizado", e2, "no_sabe")     # "no sabe"
        # e3 queda sin respuesta
        filas = {f["id"]: f for f in self.sql("SELECT * FROM examenes_control WHERE control_id=3")}
        self.assertEqual(filas[e1]["declara_resultado"], "no_corresponde")
        self.assertEqual(filas[e2]["declara_realizado"], "no_sabe")
        self.assertIsNone(filas[e3]["declara_realizado"])  # NO se inventa nada

    def test_06_recordatorios_no_se_duplican_y_respetan_baja(self):
        hoy = date.today()
        r1 = self.cliente.post("/recordatorios", data={"fecha_simulada": hoy.isoformat()})
        self.assertEqual(r1.status_code, 302)
        n1 = len(self.sql("SELECT * FROM eventos WHERE tipo='recordatorio_simulado'"))
        self.cliente.post("/recordatorios", data={"fecha_simulada": hoy.isoformat()})
        n2 = len(self.sql("SELECT * FROM eventos WHERE tipo='recordatorio_simulado'"))
        self.assertEqual(n1, n2)  # apretar dos veces no duplica
        self.assertGreater(n1, 0)
        # PAC-007 (control 7) pidió no recibir mensajes: nunca recibe recordatorio.
        self.assertEqual(len(self.sql("SELECT * FROM eventos WHERE control_id=7 AND tipo='recordatorio_simulado'")), 0)
        # Controles completos no reciben recordatorio (control 1).
        self.assertEqual(len(self.sql("SELECT * FROM eventos WHERE control_id=1 AND tipo LIKE 'recordatorio%'")), 0)

    def test_07_correccion_no_duplica_y_reabre_revision(self):
        # El control 1 está revisado. El paciente corrige una respuesta.
        token = self.token_de(1)
        self.responder(token, "pregunta", "quiere_contacto", "si")
        self.assertEqual(len(self.sql("SELECT * FROM respuestas WHERE control_id=1 AND pregunta_id='quiere_contacto'")), 1)
        self.assertEqual(self.sql("SELECT estado_revision FROM controles WHERE id=1")[0][0], "pendiente")
        self.assertTrue(self.sql("SELECT * FROM eventos WHERE control_id=1 AND tipo='revision_reabierta'"))

    def test_08_exportacion_coincide_con_panel(self):
        for filtros in ("", "contacto=si", "respuesta=parcial", "invitacion=fallida&revision=pendiente"):
            panel = self.cliente.get(f"/panel?{filtros}").data.decode()
            en_panel = re.findall(r'href="/control/(\d+)"', panel)
            texto = self.cliente.get(f"/exportar/controles.csv?{filtros}").data.decode("utf-8-sig")
            filas = list(csv.DictReader(io.StringIO(texto), delimiter=";"))
            self.assertEqual(en_panel, [f["id_control"] for f in filas], filtros)

    def test_09_rechaza_telefono_no_ficticio(self):
        r = self.registrar(telefono="+56912345678")
        self.assertEqual(r.status_code, 200)  # vuelve al formulario con error
        self.assertIn("ficticio", r.data.decode())
        self.assertEqual(len(self.sql("SELECT * FROM pacientes")), 10)

    def test_10_cambio_de_fecha_queda_marcado(self):
        # El control 9 cambió de fecha después de confirmar (datos demo).
        con = conectar(self.ruta_db)
        cfg = reglas.cargar_json(os.path.join(os.path.dirname(reglas.__file__), "config.json"))
        cuest = reglas.cargar_json(os.path.join(os.path.dirname(reglas.__file__), "cuestionario.json"))
        resumen = reglas.resumen_control(con, reglas.obtener_control(con, 9), cuest, cfg, date.today())
        con.close()
        self.assertTrue(any("fecha del control cambió" in m for m in resumen["motivos_contacto"]))
        self.assertTrue(self.sql("SELECT * FROM eventos WHERE control_id=9 AND tipo='cambio_fecha'"))

    def test_11_invitacion_no_se_duplica_y_fallida_se_registra(self):
        self.cliente.post("/control/1/invitar")  # ya estaba simulada
        self.assertEqual(len(self.sql("SELECT * FROM eventos WHERE control_id=1 AND tipo LIKE 'invitacion_%'")), 1)
        self.assertEqual(self.sql("SELECT estado_invitacion FROM controles WHERE id=6")[0][0], "fallida")

    def test_12_panel_protegido_con_clave(self):
        os.environ["CLAVE_PANEL"] = "clave-de-prueba"
        try:
            cliente = crear_app(self.ruta_db).test_client()
            self.assertEqual(cliente.get("/panel").status_code, 401)
            import base64
            cabecera = {"Authorization": "Basic " + base64.b64encode(b"equipo:clave-de-prueba").decode()}
            self.assertEqual(cliente.get("/panel", headers=cabecera).status_code, 200)
            # El paciente entra con su enlace, sin contraseña.
            self.assertEqual(cliente.get(f"/c/{self.token_de(3)}").status_code, 200)
        finally:
            del os.environ["CLAVE_PANEL"]

    def test_13_completa_requiere_enviar(self):
        token = self.token_de(3)
        self.responder(token, "confirma_control", None, "si")
        for f in self.sql("SELECT id FROM examenes_control WHERE control_id=3"):
            self.responder(token, "examen_realizado", f["id"], "todavia_no")
        for p in ("medio_contacto", "ayuda_traslado", "reservada_1", "quiere_contacto"):
            valor = {"medio_contacto": "llamada", "reservada_1": "a"}.get(p, "no")
            self.responder(token, "pregunta", p, valor)
        self.assertIn("Parcial", self.cliente.get("/control/3").data.decode())
        self.cliente.post(f"/api/c/{token}/enviar")
        html = self.cliente.get("/control/3").data.decode()
        self.assertIn("resp-completa", html)


if __name__ == "__main__":
    unittest.main()
