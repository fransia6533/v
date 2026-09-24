# 07 · Tabla de pruebas

**Importante:** la columna "Observado por Claude" viene de ejecuciones reales hechas el 2026-09-24 en el entorno de desarrollo (Linux, Python 3.11, Flask 3.1, navegador Chromium automatizado). **Todavía no se ha probado en tu computador.** Completa la última columna tú, después de "Reiniciar demo".

Fechas: los pacientes ficticios se crean relativos a "hoy" (ej. PAC-003 = hoy + 5 días).

## Resumen
| Tipo de prueba | Cómo se ejecuta | Resultado observado por Claude |
|---|---|---|
| 13 pruebas internas (reglas y base de datos) | `python -m unittest discover -s tests -v` | **13 de 13 OK** |
| 28 pruebas en navegador real (clics, formularios, chat, descarga CSV, reinicio de la app) | `python tests/prueba_navegador.py` | **28 de 28 pasaron**, 0 errores de JavaScript — ver [informe_pruebas_navegador.md](informe_pruebas_navegador.md) y [capturas/](capturas/) |
| Inicio desde cero con `iniciar_mac_linux.sh` | Copia limpia del zip | Crea entorno, instala Flask y abre el panel (código 200) |
| Inicio con `iniciar_windows.bat` | — | **No probado**: este entorno no tiene Windows. Revisado a mano (formato de líneas Windows, busca `py` y luego `python`) |

## A. Pruebas automáticas (13)
Ejecución: `python -m unittest discover -s tests -v` → **Ran 13 tests … OK** (observado por Claude).

| # | Caso | Qué comprueba | Observado por Claude |
|---|---|---|---|
| 01 | Carga inicial | 10 pacientes, 11 controles, panel abre | Pasó |
| 02 | Recorrido mínimo + persistencia | Registro → invitación → respuesta → sigue guardada al "reabrir" la app | Pasó |
| 03 | No mezclar controles | Enlace de un control no puede modificar exámenes de otro; chat solo ve sus datos | Pasó |
| 04 | Valores inválidos | Respuestas no permitidas y enlaces inventados se rechazan | Pasó |
| 05 | No / no sabe / no corresponde / sin respuesta | Se guardan distinto; lo vacío queda vacío | Pasó |
| 06 | Recordatorios | No se duplican; respetan la baja; no van a completos | Pasó |
| 07 | Corrección | No duplica respuesta; reabre la revisión | Pasó |
| 08 | Exportación = panel | Mismas filas con 4 combinaciones de filtros | Pasó |
| 09 | Teléfono real | Se rechaza un teléfono que no empieza con 000 | Pasó |
| 10 | Cambio de fecha | Queda en historial y como motivo de contacto | Pasó |
| 11 | Invitación | No se duplica; la fallida queda registrada | Pasó |
| 12 | Contraseña del panel | Sin clave → bloqueado; con clave → entra; paciente entra sin clave | Pasó |
| 13 | Completa requiere "Enviar" | Todo respondido sin enviar = Parcial; al enviar = Completa | Pasó |

## B. Pruebas manuales (en el navegador)

| # | Caso | Acción | Resultado esperado | Observado por Claude | Observado por ti | ¿Pasó? |
|---|---|---|---|---|---|---|
| M1 | Inicio | Iniciar demo y abrir `http://127.0.0.1:8000` | Panel con 11 controles y franja "DEMOSTRACIÓN" | Igual al esperado | | |
| M2 | Registro válido | Registrar control con teléfono `0001234` y 1 examen | Detalle del nuevo control, invitación "Pendiente" | Igual al esperado | | |
| M3 | Teléfono real | Registrar con `+56911112222` | "No se guardó: El teléfono debe ser ficticio y empezar con 000." | Igual al esperado | | |
| M4 | Sin exámenes | Registrar sin marcar exámenes | "No se guardó: Selecciona al menos un examen." | Igual al esperado | | |
| M5 | Sin confirmar ficticio | Registrar sin marcar la casilla | El navegador no deja enviar / "Debes confirmar que los datos son ficticios." | Mensaje del servidor observado | | |
| M6 | Invitación simulada | Botón "Simular envío" | Estado "Simulada (no enviada realmente)"; evento en historial | Igual al esperado | | |
| M7 | Invitación masiva sin duplicar | "Simular invitación a todos los pendientes" dos veces | 1ª: "simuladas: 1" (PAC-002). 2ª: "simuladas: 0" | Igual al esperado | | |
| M8 | Invitación fallida | PAC-006 → "Simular envío" | "Sin teléfono registrado."; sigue "Fallida" | Igual al esperado | | |
| M9 | Chat completo | Chat de PAC-003: responder todo, usar "Lo respondo después" en 1 examen | Resumen muestra 1 pendiente | Igual al esperado (Chromium, sin errores de JavaScript) | | |
| M10 | Corrección antes de enviar | En el resumen, "Cambiar" una respuesta | Vuelve a la pregunta y luego al resumen con el nuevo valor | Igual al esperado | | |
| M11 | Envío | "Enviar respuestas" | "✅ Tus respuestas quedaron guardadas" | Igual al esperado | | |
| M12 | Volver a abrir enlace | Recargar el chat después de enviar | "Ya enviaste tus respuestas (…)" + resumen | Igual al esperado | | |
| M13 | Persistencia | Cerrar la demo y volver a iniciarla | Respuestas siguen en panel y detalle | Verificado con prueba automática 02 | | |
| M14 | Recordatorios hoy | "Ejecutar recordatorios" con fecha de hoy | PAC-003 recordatorio N°1; PAC-007 bloqueado | Igual al esperado | | |
| M15 | Sin duplicar | Repetir M14 | "no correspondía ningún recordatorio nuevo" | Igual al esperado | | |
| M16 | Fecha simulada +4 días | Fecha = hoy + 4 | PAC-003 N°2, PAC-004 N°1, PAC-007 bloqueado | Igual al esperado | | |
| M17 | Baja de mensajes | En un chat: "No quiero recibir más mensajes" | Mensaje de confirmación; panel muestra motivo "Pidió no recibir más mensajes" | Igual al esperado (probado en chat de PAC-004) | | |
| M18 | Revisión sin nombre | Marcar revisada sin "Quién revisa" | "Escribe quién revisó (nombre ficticio)." | Igual al esperado | | |
| M19 | Revisión | PAC-008 → nombre + "Marcar como revisada" | Estado "Revisada"; sale del filtro "contacto + pendiente" | Igual al esperado | | |
| M20 | Filtro + exportación | Filtro contacto=Sí, revisión=Pendiente → Exportar | CSV con los mismos controles que el panel | Panel y CSV: controles 7, 6, 5, 9 (tras M19) | | |
| M21 | CSV sin identificadores directos | Abrir CSV | No hay columnas de nombre ni teléfono | Igual al esperado | | |
| M22 | Dos controles | PAC-010 | Dos filas con estados distintos; detalle enlaza al otro control | Igual al esperado | | |
| M23 | Enlace inventado | Abrir `/c/abc` | Página "Not Found" (404) | Igual al esperado | | |

## Revisión especial
- **No se mezclan pacientes/controles:** pruebas 03 y M22.
- **Las respuestas se guardan:** pruebas 02, M11–M13.
- **Exportación coincide con el panel:** pruebas 08 y M20.
