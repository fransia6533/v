# 05 · Panel del equipo y exportación

## Qué muestra el panel (una fila por control)
| Columna | De dónde sale |
|---|---|
| Paciente (código y nombre ficticio) | `pacientes` |
| Fecha del control | `controles.fecha_control` |
| Invitación | `controles.estado_invitacion` |
| Respuesta | Calculado: sin responder / parcial / completa |
| Exámenes realizados (declarado) | Cuántos el paciente dice haberse hecho, de cuántos |
| Resultados disponibles (declarado) | Cuántos resultados el paciente dice tener |
| Requiere contacto + motivos | Calculado (ver lista abajo) |
| Revisión | `controles.estado_revision` y quién revisó |
| Última actualización | `controles.actualizado_en` |
| Abrir | Lleva al detalle del control |

Arriba hay **tarjetas con métricas administrativas**: controles, invitados, completas, parciales, sin responder, invitaciones fallidas y "requieren contacto y no están revisados".
Las filas en **rosado** requieren contacto y aún no están revisadas.

## Tres estados separados
| Estado | Valores | Significado |
|---|---|---|
| Invitación | Pendiente · Simulada (no enviada realmente) · Enviada (solo con canal real) · Fallida | Si el mensaje salió |
| Respuesta | Sin responder · Parcial · Completa | Cuánto respondió el paciente |
| Revisión humana | Pendiente · Revisada | Si una persona del equipo ya lo miró |

> **"Completa" no significa que el paciente esté clínicamente preparado** para su control o cirugía. Solo significa que respondió todas las preguntas obligatorias y apretó "Enviar". "No sé" cuenta como respuesta (es honesta); dejarla vacía no.

## Motivos de "requiere contacto humano" (administrativos, no clínicos)
- La invitación falló.
- Pidió no recibir más mensajes.
- Indicó que los datos del control no coinciden o no está seguro.
- La fecha del control cambió después de que el paciente la confirmó.
- Declara un examen pendiente / no sabe si se lo hizo / quiere aclararlo con el equipo.
- Resultado no disponible o no sabe.
- El equipo verificó que algo **no coincide**.
- Respondió algo marcado como "pide atención" en `cuestionario.json` (ej. quiere contacto).
- Faltan pocos días (≤ último recordatorio configurado) y la respuesta no está completa.

## Filtros
Invitación, Respuesta, Revisión, Requiere contacto (Sí/No) y búsqueda por código o nombre. Ejemplo útil: **Requiere contacto = Sí + Revisión = Pendiente** → la lista de trabajo del día.

## Detalle de un control
Muestra: datos del control, los tres estados, motivos, mensaje preparado (no enviado), enlace del paciente, tabla de exámenes con **lo que dice el paciente** separado de **la verificación del equipo**, respuestas del cuestionario, formulario de revisión (exige nombre de quien revisa), cambio de fecha, otros controles del mismo paciente e **historial completo**.

## Exportación CSV
- **Exportar esta tabla (CSV)** → `controles_demo.csv`: una fila por control, **con los mismos filtros que el panel** (la prueba automática `test_08` comprueba que coinciden).
- **Exportar exámenes (CSV)** → `examenes_demo.csv`: una fila por examen de cada control.
- Separador punto y coma (`;`) y codificación que Excel entiende con tildes.
- **No incluyen nombre ni teléfono**, pero **no son anónimos**: el código PAC-xxx permite volver a identificar a la persona dentro del sistema (son datos **seudonimizados**).
- Diccionario de columnas: menú **Diccionario CSV** dentro de la aplicación.
