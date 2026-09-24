# Informe de pruebas en navegador (generado automáticamente)

Fecha de ejecución: 2026-09-24 · Navegador: Chromium (Playwright) · Resultado: **28 de 28 pasaron**

Generado por `tests/prueba_navegador.py`. Capturas en `docs/capturas/`.

| Caso | Acción | Resultado esperado | Resultado observado | ¿Pasó? |
|---|---|---|---|---|
| M1 Inicio | Abrir la dirección de la demo | Panel con 11 controles y franja DEMOSTRACIÓN | 11 controles; franja: 'DEMOSTRACIÓN · Datos 100% ficticios · Ningún mensaje se envía realmente' | ✅ Pasó |
| M3 Teléfono real | Registrar con +56911112222 | Rechazo: teléfono debe ser ficticio | No se guardó: El teléfono debe ser ficticio y empezar con 000. | ✅ Pasó |
| M4 Sin exámenes | Registrar sin marcar exámenes | Rechazo: seleccionar al menos un examen | No se guardó: Selecciona al menos un examen. | ✅ Pasó |
| M5 Sin confirmar ficticio | Guardar sin marcar 'Confirmo que son ficticios' | No se guarda | El navegador bloqueó el envío; no se creó paciente | ✅ Pasó |
| M2 Registro válido | Registrar PAC-011 con 2 exámenes | Detalle con invitación Pendiente | Control #12, invitación 'Pendiente', exámenes: 2 | ✅ Pasó |
| M6 Invitación simulada | Botón 'Simular envío de invitación' | Estado 'Simulada (no enviada realmente)' + evento | 'Simulada (no enviada realmente)'; en historial: True | ✅ Pasó |
| M9 Chat completo | Responder todo, dejar 1 examen en 'Lo respondo después' | Resumen con 1 pendiente | Resumen mostrado; 1 pendiente | ✅ Pasó |
| M10 Corrección antes de enviar | En el resumen: 'Cambiar' el examen pendiente | Vuelve al resumen con el nuevo valor | Nuevo valor en resumen: True | ✅ Pasó |
| M11 Envío | 'Enviar respuestas' | Confirmación y fecha de envío guardada | Mensaje de confirmación: True; enviado_en=2026-09-24T22:26:13 | ✅ Pasó |
| M12 Volver a abrir enlace | Recargar el chat | 'Ya enviaste tus respuestas' + resumen | Aparece 'Ya enviaste': True | ✅ Pasó |
| M11b Panel refleja respuesta | Buscar 'Paciente Prueba' en el panel | Completa, 1 de 2 realizados, requiere contacto (quiere aclarar) | PAC-011 Paciente Prueba	2026-10-03	Simulada (no enviada realmente)	Completa	1 de 2 1 sin realizar, en duda o sin respuesta	1 de 2	Sí Quiere aclarar con el equip | ✅ Pasó |
| M13 Persistencia | Detener la aplicación y volver a iniciarla | Respuestas siguen guardadas | App detenida: True; tras reiniciar sigue 'Completa' y comentario: True | ✅ Pasó |
| M14 Recordatorios hoy | Ejecutar recordatorios con fecha de hoy | PAC-003 recordatorio N°1; PAC-007 bloqueado | Recordatorios para la fecha simulada 2026-09-24: PAC-003 (2026-09-29): recordatorio N°1 simulado / PAC-007: bloqueado (pidió no recibir mensajes) | ✅ Pasó |
| M15 Sin duplicar | Repetir M14 | Ningún recordatorio nuevo | Fecha simulada 2026-09-24: no correspondía ningún recordatorio nuevo (no se duplican). | ✅ Pasó |
| M16 Fecha simulada +4 | Recordatorios con hoy+4 | PAC-003 N°2, PAC-004 N°1, PAC-007 bloqueado | Recordatorios para la fecha simulada 2026-09-28: PAC-003 (2026-09-29): recordatorio N°2 simulado / PAC-004 (2026-10-02): recordatorio N°1 simulado / PAC-007: bloqueado (pidió no recibir mensajes) | ✅ Pasó |
| M7 Invitación masiva | Botón masivo dos veces | 1ª: 1 simulada (PAC-002). 2ª: 0 | 1ª: 'Invitaciones simuladas: 1. Fallidas o bloqueadas: 0. (Ningún mensaje real salió.)' / 2ª: 'Invitaciones simuladas: 0. Fallidas o bloqueadas: 0. (Ningún mensaje real salió.)' | ✅ Pasó |
| M8 Invitación fallida | PAC-006 → Simular envío | 'Sin teléfono registrado', sigue Fallida | Sin teléfono registrado. | ✅ Pasó |
| M17 Baja de mensajes | Chat de PAC-004 → 'No quiero recibir más mensajes' | Confirmación y motivo en el panel | Chat retomó donde quedó: True; motivo en panel: True | ✅ Pasó |
| M18 Revisión sin nombre | Marcar revisada sin 'Quién revisa' | Pide nombre | Escribe quién revisó (nombre ficticio). | ✅ Pasó |
| M19 Revisión + verificación | PAC-008: verificar examen 'no coincide' y marcar revisada | Estado Revisada; verificación separada de lo declarado | Revisada: True; motivo 'NO coincide' visible: True | ✅ Pasó |
| M20 Filtro + exportación | Filtro contacto=Sí y revisión=Pendiente → Exportar CSV | Mismos controles en panel y CSV | Panel: ['7', '4', '6', '12', '5', '9'] / CSV: ['7', '4', '6', '12', '5', '9'] | ✅ Pasó |
| M21 CSV sin identificadores | Revisar columnas del CSV | Sin nombre ni teléfono | 17 columnas; nombre/teléfono presentes: False | ✅ Pasó |
| M22 Dos controles | Buscar PAC-010 | 2 filas con estados distintos y enlace entre ellos | 2 filas; estados: ['Completa', 'Sin responder']; enlace: True | ✅ Pasó |
| M23 Enlace inventado | Abrir /c/enlace-inventado | 404 (no encontrado) | Código 404 | ✅ Pasó |
| M24 Cambio de fecha | PAC-005 → cambiar fecha a hoy+30 | Evento cambio_fecha y motivo 'fecha cambió después de confirmar' | Evento: True; motivo: True | ✅ Pasó |
| M25 Corrección tras enviar | PAC-001 (ya revisado) cambia 'quiere contacto' a Sí y reenvía | Revisión vuelve a Pendiente; sin respuestas duplicadas | Revisión: pendiente; respuestas vigentes para esa pregunta: 1 | ✅ Pasó |
| M26 Diccionario CSV | Abrir menú Diccionario CSV | Explica columnas y que no es anónimo | Página abierta; menciona 'seudonimizados': True | ✅ Pasó |
| M27 Errores JavaScript | Observar la consola del navegador durante todo el recorrido | Ningún error | 0 errores [] | ✅ Pasó |
