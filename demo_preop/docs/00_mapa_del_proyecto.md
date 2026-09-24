# 00 · Mapa del proyecto

## 1. Resumen en lenguaje sencillo

Antes de un control en la Unidad de Rodilla, alguien del equipo suele tener que averiguar si el paciente se hizo los exámenes que le pidieron y si tiene los resultados. Esta demo muestra una forma ordenada de hacerlo:

1. El equipo registra al paciente (ficticio), la fecha del control y los exámenes pedidos.
2. El sistema prepara un mensaje con un enlace personal (en la demo el envío es **simulado**).
3. El paciente abre el enlace y conversa con un "asistente" de botones (sin inteligencia artificial): dice si se hizo cada examen, si tiene el resultado y responde un cuestionario de ejemplo.
4. Todo queda guardado en una base de datos.
5. El equipo ve un panel con quién respondió, qué falta y a quién hay que llamar, y marca cada caso como revisado.
6. Se puede exportar una tabla (CSV) para Excel.

El sistema **no diagnostica, no calcula riesgos y no decide** si alguien puede operarse. Solo ordena información y avisa a una persona.

## 2. Qué incluye y qué no incluye la demo

**Incluye:** una unidad ficticia, 10 pacientes ficticios (11 controles), registro de controles y exámenes, invitación simulada, chat de botones con resumen y corrección, panel con filtros y tres estados separados (invitación / respuesta / revisión), verificación de exámenes por el equipo, recordatorios simulados configurables, casos especiales, historial de eventos, exportación CSV con diccionario y pruebas automáticas.

**No incluye:** datos reales, conexión a la ficha clínica, WhatsApp o SMS reales, archivos o fotografías, pagos, aplicación móvil, inteligencia artificial, usuarios con roles, alojamiento en internet ni validación legal.

## 3. Diagrama del recorrido de la información

```
 ┌───────────────────────┐
 │  EQUIPO DEL HOSPITAL  │  (secretaría / enfermería — ficticio)
 └──────────┬────────────┘
            │ 1. registra
            ▼
 ┌───────────────────────┐      tabla: pacientes, controles
 │ PACIENTE + CONTROL    │
 └──────────┬────────────┘
            │ 2. marca exámenes pedidos
            ▼
 ┌───────────────────────┐      tabla: examenes_control
 │ EXÁMENES DEL CONTROL  │
 └──────────┬────────────┘
            │ 3. botón "Simular envío"            ← SIMULADO en la demo
            ▼
 ┌───────────────────────┐      tabla: eventos (invitacion_simulada / fallida)
 │ INVITACIÓN (enlace)   │
 └──────────┬────────────┘
            │ 4. el paciente abre su enlace personal
            ▼
 ┌───────────────────────┐
 │ CONVERSACIÓN (chat)   │  preguntas con botones, resumen, corrección
 └──────────┬────────────┘
            │ 5. cada botón se guarda al instante
            ▼
 ┌───────────────────────┐      tablas: examenes_control (lo que DICE el paciente),
 │ RESPUESTAS GUARDADAS  │              respuestas (cuestionario)
 └──────────┬────────────┘
            │ 6. se calculan estados y motivos de contacto
            ▼
 ┌───────────────────────┐
 │ PANEL DE SEGUIMIENTO  │  filtros, motivos, exportación CSV
 └──────────┬────────────┘
            │ 7. una persona revisa, verifica exámenes y anota
            ▼
 ┌───────────────────────┐      controles.estado_revision, examenes_control.verificacion_equipo
 │ REVISIÓN HUMANA       │
 └───────────────────────┘
       ↺ Recordatorios (simulados) vuelven al paso 3 si la respuesta no está completa.
```

## 4. Ruta técnica elegida (una sola)

| Necesidad | Herramienta | Qué es y para qué sirve aquí | Por qué basta para la demo |
|---|---|---|---|
| Lenguaje | **Python** | Lenguaje de programación fácil de leer | Gratuito, se instala una vez, muy usado para enseñar |
| Páginas web | **Flask** | Librería que convierte funciones de Python en páginas web | Pequeña, una sola dependencia, sin configuración |
| Base de datos | **SQLite** | Base de datos que vive en un único archivo | Viene incluida con Python; no hay que instalar ni configurar servidor |
| Chat del paciente | **HTML + JavaScript** | Lo que el navegador ya sabe mostrar y ejecutar | Sin inteligencia artificial: botones y reglas |
| Preguntas y plazos | **Archivos JSON** | Archivos de texto con formato ordenado | Se editan con el Bloc de notas; tienen número de versión |
| Envío de mensajes | **Canal simulado** (`canal.py`) | Finge el envío y deja registro | Cero costo; separado para cambiarlo luego por WhatsApp |

**Lo hice yo (Claude):** todo el código, las pruebas, los datos ficticios y los documentos.
**Lo haces tú:** instalar Python, descomprimir la carpeta, ejecutar la demo, probarla y contarme el resultado.
**No se usa ningún servicio externo ni pagado** en esta etapa. Por eso no hay precios que verificar todavía (ver `10_costos_y_continuidad.md`).

## 5. Plan por etapas (resumen)

| Etapa | Entregable | Prueba de término | Estado |
|---|---|---|---|
| A. Alcance y recorrido | Diagrama y explicación (arriba y en `02`) | Puedes explicarlo sin hablar de código | ✅ Entregado |
| B. Datos | 5 tablas + 10 pacientes ficticios (`03`) | Estructura comprensible con ejemplos | ✅ Entregado |
| C. Conversación | Guion (`04`) + chat funcionando | Completar y corregir antes de enviar | ✅ Probado en navegador |
| D. Primera versión | App completa conectada | La respuesta sigue tras cerrar y abrir | ✅ Prueba automática 02 |
| E. Panel | Panel + filtros + CSV + diccionario (`05`) | Identificar rápido qué requiere seguimiento | ✅ Prueba automática 08 |
| F. Recordatorios y casos | Simulación configurable (`06`) | Demostrar los 8 casos especiales | ✅ Pruebas 06, 07, 10, 11 |
| G. Pruebas y presentación | Tabla de pruebas (`07`) + guion (`08`) | Todas pasan en TU computador | ⏳ Falta que lo ejecutes tú |

Detalle completo: [02_plan_por_etapas.md](02_plan_por_etapas.md).

## 6. Tu primer ejercicio

**Esto vamos a hacer:** abrir la demo en tu computador y registrar un paciente ficticio.

**Pasos:**
1. Instala Python (sección 3 del README).
2. Descomprime `demo_preop.zip`.
3. Inicia la demo (`iniciar_windows.bat` o `bash iniciar_mac_linux.sh`).
4. Abre `http://127.0.0.1:8000`.
5. Haz el "Recorrido rápido" de la sección 4 del README (7 pasos).

**Esto deberías ver:** el panel con 11 controles; al final, tu paciente nuevo con estado "Completa" o "Parcial".

**Así comprobamos que funcionó:** cierra la ventana de la demo, vuelve a iniciarla y confirma que tu paciente y sus respuestas siguen ahí.

**Envíame:** (a) tu sistema operativo, (b) una captura del panel o el mensaje de error exacto, (c) el país del hospital (para la parte normativa).
