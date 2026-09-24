# 01 · Ficha del proyecto

## Problema concreto que intentamos resolver
Antes de un control de rodilla, el equipo necesita saber si el paciente se realizó los exámenes e imágenes solicitados y si tendrá los resultados disponibles. Hoy (supuesto a confirmar con el equipo) esa información se obtiene de forma dispersa: llamadas, consultas el mismo día o se descubre en la consulta que falta algo. Queremos probar una forma **ordenada y trazable** de preguntar y registrar esas respuestas antes del control.

## Quién participa (tres roles distintos)

| Rol | Quién es | Qué hace con el sistema | Qué gana (hipótesis) |
|---|---|---|---|
| **Paciente que responde** | Persona con un control programado | Responde un chat breve desde un enlace | Saber con anticipación qué le falta; pedir contacto si tiene dudas |
| **Personal que revisa** | Secretaría, enfermería o médico de la unidad (por definir) | Registra controles, mira el panel, verifica y marca como revisado | Ver en un solo lugar quién respondió, qué falta y a quién llamar |
| **Institución que podría financiar** | Hospital / jefatura de área / otra unidad | No usa la herramienta directamente; aprueba y paga un piloto | Información administrativa para decidir (por medir) |

Estos tres roles **no son lo mismo**: que el paciente use la herramienta no significa que la institución la vaya a financiar, ni que el personal tenga tiempo para revisarla.

## Qué hace hoy el equipo sin la herramienta
**No lo sabemos todavía.** Debemos preguntarlo (ver preguntas en `10_costos_y_continuidad.md`):
- ¿Quién llama a los pacientes antes del control? ¿Siempre, a veces, nunca?
- ¿Dónde se anota si trajo los exámenes?
- ¿Cuántos controles por semana tiene la unidad?
- ¿Qué pasa hoy cuando un paciente llega sin exámenes?

## Qué parte de ese trabajo queremos facilitar
Solo la parte **administrativa**: preguntar, registrar de forma ordenada y mostrar quién requiere contacto humano. No reemplazamos la revisión clínica ni la decisión médica.

## Hipótesis

| # | Hipótesis | ¿Se puede comprobar con la demo? |
|---|---|---|
| H1 | El equipo entiende el recorrido y el panel sin capacitación larga | ✅ Sí, mostrándolo |
| H2 | Las preguntas de exámenes/resultados reflejan lo que el equipo necesita saber | ✅ Sí, con su retroalimentación |
| H3 | Los estados separados (invitación / respuesta / revisión) ayudan a priorizar | ✅ Parcialmente (opinión del equipo) |
| H4 | Los pacientes reales responden en proporción suficiente | ❌ Requiere piloto real |
| H5 | Disminuye la cantidad de pacientes que llegan sin exámenes | ❌ Requiere piloto y línea base |
| H6 | Ahorra tiempo al personal | ❌ Requiere medir el tiempo actual y el tiempo con la herramienta |
| H7 | Alguien en la institución está dispuesto a financiarlo | ❌ Requiere conversación institucional |

**No afirmamos** que la herramienta ahorre tiempo, mejore resultados clínicos o genere dinero. Son hipótesis por medir.

## Posible uso para investigación (más adelante)
Solo con autorización institucional, evaluación ética y la base legal que corresponda. La demo **no** autoriza investigar ni publicar. Ver `09_seguridad_y_piloto.md`.
