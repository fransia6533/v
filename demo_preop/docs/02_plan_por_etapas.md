# 02 · Plan por etapas

Cada etapa tiene: objetivo, tareas, resultado, cómo comprobar, errores habituales y qué queda fuera.
Las etapas A–F ya están construidas en esta carpeta. Tu trabajo es **comprobarlas** en tu computador, en orden.

---

## Etapa A · Alcance y recorrido de la información

**Objetivo:** entender el flujo completo sin hablar de código.

**Tareas**
1. Lee el diagrama en `00_mapa_del_proyecto.md`.
2. Revisa la tabla de abajo: qué entra, dónde se guarda y quién lo ve.
3. Explícale el recorrido a Osmán en voz alta en 2 minutos.

| Información | La ingresa | Se guarda en | Debería verla |
|---|---|---|---|
| Nombre y teléfono (ficticios) | Equipo | `pacientes` | Equipo (nunca aparece en el CSV) |
| Fecha y motivo del control | Equipo | `controles` | Equipo y el propio paciente en su enlace |
| Exámenes pedidos | Equipo | `examenes_control` | Equipo y el propio paciente |
| Lo que el paciente declara | Paciente | `examenes_control`, `respuestas` | Equipo |
| Verificación del equipo | Equipo | `examenes_control` | Equipo |
| Revisión y nota interna | Equipo | `controles` | Solo equipo |
| Historial (quién hizo qué) | Sistema | `eventos` | Equipo / responsable |

**Cómo se inicia el proceso:** en la demo, con el botón **"Simular envío de invitación"** (uno por uno) o **"Simular invitación a todos los pendientes"**. En un piloto, esto mismo podría ejecutarse automáticamente cada día (extensión del mismo flujo, sin rehacer nada).

**Resultado:** puedes explicar el recorrido. **Comprobación:** Osmán lo entiende sin ver código.
**Errores habituales:** confundir "invitación simulada" con "mensaje enviado" → la demo nunca usa la palabra "enviada" para una simulación.
**Fuera por ahora:** envío automático, ficha clínica.

---

## Etapa B · Datos que necesitamos

**Objetivo:** estructura mínima y comprensible.

**Tareas**
1. Lee `03_datos.md` (5 tablas, campo por campo).
2. Inicia la demo y abre el detalle de PAC-008 y PAC-010 para ver datos reales (ficticios) en cada tabla.
3. Comprueba que PAC-010 tiene **dos controles** con respuestas separadas.

**Resultado:** base de datos `datos/demo.sqlite3` con 10 pacientes y 11 controles.
**Comprobación:** en el panel ves PAC-010 dos veces (fechas distintas, estados distintos).
**Errores habituales:** creer que "no corresponde" es un invento → solo se usa cuando el paciente dijo que **no** se hizo el examen (no tiene sentido preguntar por su resultado).
**Fuera por ahora:** catálogo de exámenes del hospital, datos reales.

---

## Etapa C · Conversación del paciente

**Objetivo:** guion claro y chat que permite corregir antes de enviar.

**Tareas**
1. Lee `04_guion_chatbot.md`.
2. Abre el chat de PAC-003 (Panel → PAC-003 → Abrir → "Abrir la vista del paciente").
3. Responde todo, deja **una** pregunta en "Lo respondo después", corrige otra desde el resumen y envía.

**Resultado:** conversación completa con resumen y corrección.
**Comprobación:** en el panel, PAC-003 aparece "Parcial" (porque dejaste una pendiente). Vuelve a abrir el chat, complétala, envía y pasa a "Completa".
**Errores habituales:** cerrar la pestaña a mitad de camino → no pasa nada: al volver, el chat dice "Retomemos donde quedaste".
**Fuera por ahora:** preguntas clínicas reales (las define y aprueba el equipo médico).

---

## Etapa D · Primera versión funcional

**Objetivo:** recorrido pequeño pero completo, guardado de forma permanente.

**Tareas**
1. Instala Python e inicia la demo (README, sección 3).
2. Registra un paciente nuevo con **un** examen.
3. Simula la invitación, responde en el chat y envía.
4. Cierra la demo (cerrar ventana / Ctrl + C) y vuelve a iniciarla.

**Resultado:** el recorrido paciente → control → examen → respuesta → base de datos → panel.
**Comprobación (criterio de término):** después de reiniciar, la respuesta sigue en el panel y en el detalle. También lo verifica la prueba automática `test_02`.
**Errores habituales:** ver README sección 5 (Python no encontrado, puerto en uso, sin internet la primera vez).
**Fuera por ahora:** publicar en internet.

---

## Etapa E · Panel para el equipo

**Objetivo:** identificar rápido qué casos requieren seguimiento y por qué.

**Tareas**
1. Lee `05_panel_y_exportacion.md`.
2. En el panel, filtra "Requiere contacto = Sí" y "Revisión = Pendiente".
3. Abre PAC-008, lee los motivos, verifica un examen y marca como revisada.
4. Exporta el CSV con el mismo filtro y ábrelo en Excel.

**Resultado:** panel con 3 estados separados, motivos de contacto, filtros, CSV y diccionario.
**Comprobación:** las filas del CSV son exactamente las mismas que ves en el panel (prueba automática `test_08`).
**Errores habituales:** Excel muestra todo en una columna → en Excel, usa la opción para importar un archivo de texto/CSV (pestaña *Datos*) y elige el separador "punto y coma". Si los nombres del menú no coinciden con tu versión de Excel, avísame y lo vemos con una captura.
**Fuera por ahora:** usuarios con roles, gráficos.

---

## Etapa F · Recordatorios y casos especiales

**Objetivo:** demostrar 8 casos especiales y cómo quedan registrados.

**Tareas**
1. Lee `06_recordatorios_y_casos.md`.
2. En el panel, sección "Simulaciones", ejecuta recordatorios con la fecha de hoy. Luego repite: no se duplican.
3. Cambia la fecha simulada a 7 días en el futuro y vuelve a ejecutar.
4. Revisa el historial de PAC-003 y PAC-007.

**Resultado:** recordatorios simulados, configurables en `config.json`, sin duplicados.
**Comprobación:** pruebas automáticas 06, 07, 10 y 11 + historial de cada control.
**Errores habituales:** "no pasó nada" al ejecutar → es correcto si ya se había enviado ese recordatorio o si nadie cumple las condiciones.
**Fuera por ahora:** envío automático diario, WhatsApp real.

---

## Etapa G · Pruebas y presentación

**Objetivo:** comprobar todo en TU computador y preparar la presentación.

**Tareas**
1. Ejecuta las pruebas automáticas (README, sección 6).
2. Recorre la tabla manual de `07_pruebas.md` y completa la columna "Resultado observado (tú)".
3. Ensaya el guion de 5 minutos de `08_presentacion.md` con el botón "Reiniciar demo" antes de empezar.

**Resultado:** tabla de pruebas completa y guion ensayado.
**Comprobación:** todas las pruebas "Pasó". Si alguna falla, me envías el caso y el mensaje.
**Errores habituales:** presentar con datos modificados de ensayos anteriores → siempre "Reiniciar demo" antes.
**Fuera por ahora:** resultados de un piloto real (no existen todavía).
