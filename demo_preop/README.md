# Demo: seguimiento antes del control médico (Unidad de Rodilla)

> **DEMOSTRACIÓN con datos 100 % ficticios.** No envía mensajes reales, no se conecta a la ficha clínica, no diagnostica y no decide si alguien puede operarse.

Esta carpeta contiene una aplicación web pequeña que muestra el recorrido completo:

```
Equipo registra paciente y control → marca exámenes → prepara invitación (simulada)
→ paciente responde en un chat de botones → respuestas guardadas
→ panel del equipo → revisión humana → exportación CSV
```

---

## 1. Qué funciona de verdad, qué está simulado y qué falta

| Funciona realmente (en tu computador) | Está simulado | Pendiente para un piloto real |
|---|---|---|
| Registrar pacientes ficticios y controles | El **envío** de invitaciones (queda como "Simulada", nunca "Enviada") | Canal real (WhatsApp/SMS) con proveedor autorizado |
| Asociar exámenes a cada control | Los **recordatorios** (se ejecutan con un botón y una "fecha simulada") | Programación automática de recordatorios (tarea periódica) |
| Chat con botones que guarda cada respuesta | La **invitación fallida** (se simula con teléfono vacío o terminado en 0000) | Autenticación del paciente (hoy basta con el enlace) |
| Resumen y corrección antes de enviar | El "hospital": unidad, exámenes y preguntas son ejemplos | Preguntas clínicas definidas y aprobadas por el equipo médico |
| Panel con estados separados, filtros y motivos de contacto | | Usuarios con roles, registro de accesos, respaldos, alojamiento autorizado |
| Revisión humana, verificación de exámenes por el equipo | | Evaluación legal, ética e institucional |
| Historial de eventos (quién hizo qué y cuándo) | | Integración con la ficha clínica (si se aprueba) |
| Exportación CSV + diccionario de columnas | | |
| Datos que **siguen guardados** al cerrar y volver a abrir | | |
| 13 pruebas automáticas | | |

---

## 2. Qué necesitas

- Un computador con **Windows 10/11** o **macOS** (Linux también sirve).
- **Python 3.10 o más reciente**. Python es el lenguaje de programación en el que está escrita la demo; hay que instalarlo una vez.
- Conexión a internet **solo la primera vez** (para descargar Flask, la única librería que usamos).
- No necesitas cuentas, tarjetas de crédito ni servicios pagados.

> 👉 **Usas Windows:** sigue la guía detallada **[docs/12_guia_windows.md](docs/12_guia_windows.md)** (paso a paso, con qué deberías ver y cómo resolver errores).

---

## 3. Instalar y abrir la demo

### Windows

1. Descarga Python desde la página oficial: <https://www.python.org/downloads/> (botón amarillo "Download Python").
2. Abre el instalador. **Antes de apretar "Install Now", marca la casilla "Add python.exe to PATH"** (esto permite que el computador encuentre Python).
3. Descomprime el archivo `demo_preop.zip` (clic derecho → *Extraer todo*).
4. Entra a la carpeta `demo_preop` y haz **doble clic en `iniciar_windows.bat`**.
   - Si Windows muestra "Windows protegió su PC", haz clic en *Más información* → *Ejecutar de todas formas* (aparece porque el archivo no viene de una tienda oficial).
5. Se abre una ventana negra. La primera vez tarda 1–2 minutos. Cuando veas:
   ```
   Demo iniciada. Abre en tu navegador:  http://127.0.0.1:8000
   ```
   abre tu navegador (Chrome, Edge, Firefox) y escribe `http://127.0.0.1:8000`.

**Para detener:** cierra la ventana negra (o presiona `Ctrl + C` dentro de ella).
**Para volver a iniciar:** doble clic otra vez en `iniciar_windows.bat`. Tus datos siguen ahí.

### macOS

1. Descarga Python desde <https://www.python.org/downloads/> e instálalo (siguiente, siguiente…).
2. Descomprime `demo_preop.zip` (doble clic).
3. Abre la aplicación **Terminal** (Cmd + Espacio, escribe "Terminal", Enter).
   La terminal es una ventana donde se escriben órdenes de texto.
4. Escribe `cd ` (con un espacio al final), **arrastra la carpeta `demo_preop` a la ventana** y presiona Enter.
   Esto hace que la terminal "se pare" dentro de la carpeta.
5. Escribe y presiona Enter:
   ```
   bash iniciar_mac_linux.sh
   ```
6. Cuando aparezca `Demo iniciada`, abre el navegador en `http://127.0.0.1:8000`.

**Para detener:** en la Terminal presiona `Ctrl + C`.

### Qué deberías ver

- Una franja amarilla arriba que dice **"DEMOSTRACIÓN · Datos 100% ficticios"**.
- El **Panel de seguimiento** con 11 controles de 10 pacientes ficticios (PAC-001 a PAC-010) y tarjetas con números (completas, parciales, etc.).
- Filas en rosado = requieren contacto humano y aún no están revisadas.

---

## 4. Recorrido rápido para probar (5 minutos)

1. **Registrar control** (menú superior) → nombre "Paciente Prueba", teléfono `0001234`, una fecha, marca 1 examen, marca "Confirmo que son ficticios" → Guardar.
2. En el detalle, aprieta **Simular envío de invitación**. El estado cambia a "Simulada (no enviada realmente)" y ves el texto del mensaje que *se habría* enviado.
3. Aprieta **Abrir la vista del paciente (chat)**. Responde las preguntas con los botones.
4. En el resumen, aprieta **Cambiar** en alguna respuesta, corrígela y luego **Enviar respuestas**.
5. Vuelve al **Panel**: el paciente aparece como "Completa" (o "Parcial" si dejaste algo pendiente).
6. **Cierra la aplicación y vuelve a abrirla**: las respuestas siguen ahí.
7. Aprieta **Exportar esta tabla (CSV)** y ábrelo con Excel.

---

## 5. Errores habituales

| Lo que ves | Qué significa | Cómo resolverlo |
|---|---|---|
| `"py" no se reconoce...` o `No se encontró Python` | Python no está instalado o no se marcó "Add to PATH" | Reinstala Python marcando **Add python.exe to PATH** |
| `Address already in use` / `puerto en uso` | Ya hay otra copia de la demo abierta (u otro programa usa el puerto 8000) | Cierra la otra ventana negra/terminal y vuelve a iniciar |
| El navegador dice "No se puede acceder a este sitio" | La aplicación no está corriendo | Revisa que la ventana negra/terminal siga abierta y sin errores |
| Texto rojo `WARNING: This is a development server...` | Flask avisa que es un servidor para pruebas, no para producción | Es **normal** en la demo; no hay que hacer nada |
| `A new release of pip is available` | Aviso de que existe una versión nueva del instalador | Se puede ignorar |
| `No se pudo instalar Flask` | Sin internet la primera vez | Conéctate y vuelve a ejecutar |
| El chat dice "No se pudo guardar" | Cerraste la aplicación mientras respondías | Vuelve a iniciarla y recarga la página del chat |
| Quiero empezar de cero | — | Botón **Reiniciar demo** al final del panel (borra todo y recarga los 10 casos) |

---

## 6. Comprobar con pruebas automáticas (opcional)

Con la aplicación detenida, en la terminal dentro de `demo_preop`:

- Windows: `.venv\Scripts\python -m unittest discover -s tests -v`
- Mac: `.venv/bin/python -m unittest discover -s tests -v`

Debe terminar con **`OK`** (13 pruebas). Si aparece `FAILED`, copia el mensaje y me lo envías.

**Prueba en navegador (opcional, más completa):** recorre 28 casos haciendo clic como una persona y genera `docs/informe_pruebas_navegador.md` con capturas en `docs/capturas/`. Necesita instalar Playwright una vez:

- Windows: `.venv\Scripts\python -m pip install playwright` y luego `.venv\Scripts\python -m playwright install chromium`, después `.venv\Scripts\python tests\prueba_navegador.py`
- Mac: `.venv/bin/python -m pip install playwright` y luego `.venv/bin/python -m playwright install chromium`, después `.venv/bin/python tests/prueba_navegador.py`

Resultado de Claude al entregar: **13/13 pruebas internas OK y 28/28 pruebas de navegador pasaron.**

---

## 7. Proteger el panel con contraseña (opcional)

Por defecto el panel no tiene contraseña, pero **solo es visible desde tu propio computador** (la dirección `127.0.0.1` significa "este mismo equipo").
Si quieres activar una contraseña, **no la escribas en el código**; defínela como *variable de entorno* (un dato que se le entrega al programa al iniciarlo):

- Windows (en la ventana negra, antes de `app.py`): `set CLAVE_PANEL=tu-clave`
- Mac: `CLAVE_PANEL=tu-clave bash iniciar_mac_linux.sh`

El navegador pedirá usuario (cualquiera) y la contraseña. Es una protección **básica**: sirve para una demo, **no** para datos reales (ver `docs/09_seguridad_y_piloto.md`).

---

## 8. Mapa de archivos

```
demo_preop/
├── README.md               ← este archivo
├── iniciar_windows.bat     ← doble clic para iniciar en Windows
├── iniciar_mac_linux.sh    ← iniciar en Mac/Linux
├── requirements.txt        ← librerías necesarias (solo Flask)
├── config.json             ← unidad, catálogo de exámenes, días de recordatorio (editable)
├── cuestionario.json       ← preguntas de DEMO y su versión (editable)
├── app.py                  ← páginas y direcciones web (panel, chat, exportación)
├── reglas.py               ← reglas: estados, motivos de contacto, recordatorios, guardado
├── base_datos.py           ← estructura de la base de datos (tablas)
├── canal.py                ← canal de mensajes SIMULADO (aquí se conectaría WhatsApp)
├── datos_demo.py           ← los 10 pacientes ficticios
├── datos/demo.sqlite3      ← la base de datos (se crea sola al iniciar)
├── templates/              ← páginas HTML (panel, registro, detalle, chat, diccionario)
├── static/                 ← estilos (colores) y chat.js (lógica del chat)
├── tests/test_demo.py      ← pruebas automáticas
└── docs/                   ← ficha, plan, datos, guion, pruebas, presentación, seguridad, costos
```

## 9. Documentos

| Documento | Contenido |
|---|---|
| [docs/00_mapa_del_proyecto.md](docs/00_mapa_del_proyecto.md) | Resumen, alcance, diagrama, ruta técnica, primer ejercicio |
| [docs/01_ficha_proyecto.md](docs/01_ficha_proyecto.md) | Problema, usuarios, hipótesis |
| [docs/02_plan_por_etapas.md](docs/02_plan_por_etapas.md) | Etapas A–G con tareas, resultados y pruebas |
| [docs/03_datos.md](docs/03_datos.md) | Tablas y campos explicados uno por uno |
| [docs/04_guion_chatbot.md](docs/04_guion_chatbot.md) | Guion completo de la conversación |
| [docs/05_panel_y_exportacion.md](docs/05_panel_y_exportacion.md) | Panel, estados, CSV y diccionario |
| [docs/06_recordatorios_y_casos.md](docs/06_recordatorios_y_casos.md) | Recordatorios, casos especiales, paso a WhatsApp |
| [docs/07_pruebas.md](docs/07_pruebas.md) | Tabla de pruebas con resultados |
| [docs/08_presentacion.md](docs/08_presentacion.md) | Guion de 5 minutos y diapositivas |
| [docs/09_seguridad_y_piloto.md](docs/09_seguridad_y_piloto.md) | Condiciones antes de usar pacientes reales |
| [docs/10_costos_y_continuidad.md](docs/10_costos_y_continuidad.md) | Costos, supuestos y preguntas para el hospital |
| [docs/11_normativa_chile.md](docs/11_normativa_chile.md) | Normativa chilena y preguntas para el área jurídica y ética |
| [docs/12_guia_windows.md](docs/12_guia_windows.md) | Guía paso a paso para Windows |
| [docs/informe_pruebas_navegador.md](docs/informe_pruebas_navegador.md) | Resultado de las 28 pruebas en navegador |
