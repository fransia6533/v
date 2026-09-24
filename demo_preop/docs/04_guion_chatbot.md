# 04 · Guion de la conversación del paciente

Es un **chatbot de reglas**: preguntas fijas con botones. No usa inteligencia artificial, porque el flujo se resuelve con reglas simples.

**El bot NO**: interpreta resultados, recomienda cambios de medicamentos, cancela ni cambia controles, ni declara que alguien está apto para cirugía.

## Guion completo

| # | Paso | Mensaje del bot | Botones / respuesta | Qué se guarda |
|---|---|---|---|---|
| 1 | Presentación | "Hola Ana 👋. Te escribimos de Unidad de Rodilla (demostración ficticia)." | — | — |
| 2 | Aviso de demo | "⚠️ Esto es una DEMOSTRACIÓN con datos ficticios. Tus respuestas ayudan al equipo a preparar tu control; no se usan para diagnosticar. Este canal no atiende urgencias." | — | — |
| 3 | Inicio | "Te haré unas preguntas cortas. Toma unos minutos y puedes dejar respuestas pendientes." | **Comenzar** | — |
| 4 | Confirmación del control | "Tenemos registrado tu control (ficticio) para el 04-10-2026: 'Control de rodilla (ficticio)'. ¿Es correcto?" | Sí, es correcto · No, algo no coincide · No estoy seguro | `respuestas.confirma_control` y `fecha_confirmada` |
| 5 | Por cada examen | "Te solicitaron: Hemograma (ejemplo). ¿Ya te realizaste este examen?" | Sí · Todavía no · No estoy seguro · Prefiero aclararlo con el equipo · Lo respondo después | `examenes_control.declara_realizado` |
| 6 | Resultado (solo si respondió "Sí") | "¿Tienes disponible el resultado de Hemograma (ejemplo) para llevarlo a tu control?" | Sí, lo tengo · Todavía no · No sé · Lo respondo después | `examenes_control.declara_resultado` |
| 7 | Aviso del cuestionario | "📋 Cuestionario de demostración (versión demo-1.0). Las siguientes preguntas son EJEMPLOS… No son un cuestionario clínico validado." | — | — |
| 8 | Pregunta de ejemplo 1 | "(Ejemplo) Si el equipo necesita hablar contigo, ¿cómo prefieres que te contacten?" | Llamada · Mensaje · Me da lo mismo · Lo respondo después | `respuestas.medio_contacto` |
| 9 | Pregunta de ejemplo 2 | "(Ejemplo) ¿Necesitas ayuda para organizar tu llegada al control?" | Sí · No · No estoy seguro · Lo respondo después | `respuestas.ayuda_traslado` |
| 10 | Espacio reservado | "[ESPACIO RESERVADO] Aquí irá una pregunta que defina y apruebe el equipo médico." | Opción A · Opción B · No sé · Lo respondo después | `respuestas.reservada_1` |
| 11 | Contacto humano | "¿Quieres que alguien del equipo te contacte antes de tu control?" | Sí, por favor · No es necesario · Lo respondo después | `respuestas.quiere_contacto` |
| 12 | Comentario opcional | "¿Hay algo más que quieras contarle al equipo? (opcional, máx. 300 letras). Por favor no escribas urgencias aquí." | Cuadro de texto · Guardar comentario · Omitir | `respuestas.comentario` |
| 13 | Resumen | "Este es el resumen de tus respuestas. Puedes cambiar cualquiera antes de enviar." + lista con botón **Cambiar** en cada una | Cambiar (en cada fila) · ✅ Enviar respuestas | — |
| 14 | Pendientes | "Tienes N respuesta(s) pendiente(s). Puedes enviar igual y completarlas después con este mismo enlace." | — | — |
| 15 | Confirmación | "✅ Tus respuestas quedaron guardadas. Gracias." + "Una persona del equipo las revisará. Esta conversación no reemplaza la atención del equipo ni confirma que estés listo para tu control o cirugía…" | Revisar o corregir mis respuestas | `controles.enviado_por_paciente_en` |
| Siempre | Enlace inferior | "No quiero recibir más mensajes" (pide confirmación) | — | `pacientes.acepta_mensajes = 0` + evento |

## Reglas de la conversación
- **Cada botón se guarda al instante.** Si el paciente cierra la página, al volver el bot dice "Retomemos donde quedaste" y sigue en la primera pregunta pendiente.
- **Si ya envió**, al volver el bot dice "Ya enviaste tus respuestas (fecha). Puedes revisarlas o corregirlas" y muestra el resumen.
- **Corregir después de enviar** queda registrado como `respuesta_corregida` y, si el equipo ya lo había revisado, la revisión vuelve a **pendiente**.
- **"Lo respondo después"** deja la respuesta vacía (sin respuesta). No se inventa nada.
- La pregunta del resultado solo aparece si dijo **"Sí"** al examen. Si después cambia a "Todavía no", el resultado queda como `no_corresponde`.

## Cómo cambiar las preguntas
Edita `cuestionario.json` con el Bloc de notas, cambia la `version` (ej. `demo-1.1`), guarda y reinicia la demo. El **contenido clínico** debe definirlo y aprobarlo el equipo médico; la demo solo trae ejemplos y un espacio reservado.
