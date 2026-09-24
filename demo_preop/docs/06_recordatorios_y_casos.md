# 06 · Recordatorios y casos especiales

## Cómo funcionan los recordatorios simulados
En `config.json`:
```json
"recordatorios": { "dias_antes_del_control": [7, 2] }
```
Significa: un recordatorio 7 días antes del control y otro 2 días antes. **Es una decisión operativa de la demo, no una recomendación clínica.** Puedes cambiar los números (ej. `[5]` o `[10, 5, 1]`), guardar y reiniciar la demo.

En el panel → **Simulaciones** → elige una **fecha simulada** ("hacer como si hoy fuera…") → **Ejecutar recordatorios (simulados)**.

Se simula un recordatorio solo si **todo** esto se cumple:
1. La invitación salió (simulada o enviada).
2. El paciente acepta mensajes.
3. La respuesta **no** está completa.
4. El control es hoy o en el futuro.
5. Ya llegó el día de algún recordatorio (fecha del control − N días).

**Anti-duplicados:** cada recordatorio tiene una clave única (control + fecha del control + número). Si ya existe, no se repite, aunque se apriete el botón muchas veces. Como máximo sale **un** recordatorio por control en cada ejecución. Si la fecha del control cambia, empieza un nuevo ciclo de recordatorios para la nueva fecha.

En un piloto, el mismo botón se reemplazaría por una **tarea programada** que lo ejecute una vez al día (misma función `ejecutar_recordatorios` de `reglas.py`).

## Casos especiales: cómo se demuestran y cómo quedan registrados
| Caso | Cómo verlo en la demo | Qué queda registrado |
|---|---|---|
| Paciente que no responde | PAC-003. Ejecuta recordatorios con fecha de hoy | Evento `recordatorio_simulado`; cuando faltan ≤ 2 días aparece el motivo "Faltan N días… no está completa" |
| Respuesta incompleta | PAC-004 | Estado **Parcial**; en el detalle se ve qué quedó "Sin respuesta" |
| Responde dos veces | PAC-001, o abre un chat ya enviado y vuelve a enviar | Evento `respuestas_reenviadas`; **no** se duplican respuestas (una vigente por pregunta) |
| Corrección de una respuesta | PAC-001 (resultado de radiografía cambió de "no" a "sí") | Evento `respuesta_corregida` con valor anterior → nuevo; si estaba revisado, `revision_reabierta` |
| Cambio de fecha del control | PAC-009, o formulario "Cambiar fecha" en el detalle | Evento `cambio_fecha`; motivo "La fecha cambió después de que el paciente la confirmó" |
| Examen pendiente | PAC-005 (Electrocardiograma "Todavía no") | `declara_realizado = todavia_no`, resultado `no_corresponde`; motivo de contacto |
| Invitación fallida | PAC-006 (sin teléfono). También cualquier teléfono terminado en `0000` | Estado **Fallida**, evento `invitacion_fallida` con la causa; se puede reintentar tras corregir |
| No recibir más mensajes | PAC-007, o enlace al pie del chat | `acepta_mensajes = 0`, evento `baja_mensajes`; cada recordatorio que habría correspondido queda como `recordatorio_bloqueado` (una vez cada uno, sin repetirse) y nunca se envía |

## Qué faltaría para usar un canal real (por ejemplo WhatsApp) sin rehacer la aplicación
La aplicación ya separa el canal en `canal.py`. Para un piloto habría que:
1. **Elegir y contratar un proveedor autorizado por el hospital** (por ejemplo, la plataforma oficial de WhatsApp Business de Meta, directamente o mediante un proveedor intermediario). Verificar precios y condiciones vigentes en sus páginas oficiales al momento de decidir; **no los informo aquí porque cambian y no los he verificado para tu país**.
2. **Crear una clase `CanalWhatsApp`** en `canal.py` con el mismo método `enviar(telefono, texto)` que devuelva `estado = "enviada"` o `"fallida"`.
3. **Cambiar una línea** en `app.py`: `canal = CanalSimulado(...)` → `canal = CanalWhatsApp(...)`.
4. **Guardar las credenciales** del proveedor en variables de entorno o un gestor de secretos, **nunca en el código**.
5. **Usar plantillas de mensaje aprobadas** por el proveedor (en WhatsApp, los mensajes que inicia la empresa suelen requerir plantillas aprobadas; confirmarlo en la documentación oficial).
6. **Recibir confirmaciones de entrega** (webhook: una dirección a la que el proveedor avisa si el mensaje llegó o falló) y registrar la baja si el paciente escribe "no quiero más mensajes" por el canal.
7. **Programar** la ejecución diaria de invitaciones y recordatorios.
8. **Validar** con el hospital que el canal y el proveedor están autorizados para datos de salud.

El panel, el chat, la base de datos y las reglas **no necesitan rehacerse**.
