# 03 · Datos que necesitamos

Usamos **5 tablas**. Una tabla es como una hoja de Excel: columnas (campos) y filas (registros).
Tipos de dato: **Texto**, **Número entero**, **Fecha** (se guarda como texto `AAAA-MM-DD`), **Fecha y hora** (`AAAA-MM-DDTHH:MM:SS`), **Sí/No** (se guarda 1/0).

Las preguntas del cuestionario **no** están en una tabla: están en `cuestionario.json`, con su número de versión. Así se pueden modificar con el Bloc de notas. Cada control guarda con qué versión se respondió.

## 1. `pacientes`
| Campo | Significado | Tipo | Obligatorio | Ejemplo ficticio |
|---|---|---|---|---|
| id | Número interno automático | Entero | Sí (automático) | 1 |
| codigo | Código visible del paciente, no se repite | Texto | Sí (automático) | PAC-001 |
| nombre_ficticio | Nombre inventado | Texto | Sí | Ana Ficticia |
| telefono_ficticio | Teléfono inventado; debe empezar con 000 | Texto | No (vacío = invitación fallida) | 0001111 |
| acepta_mensajes | Si acepta recibir mensajes (0 = pidió no recibir más) | Sí/No | Sí (por defecto Sí) | 1 |
| creado_en | Cuándo se registró | Fecha y hora | Sí (automático) | 2026-09-24T10:00:00 |

## 2. `controles` (un paciente puede tener varios)
| Campo | Significado | Tipo | Obligatorio | Ejemplo |
|---|---|---|---|---|
| id | Número interno del control | Entero | Sí | 11 |
| paciente_id | A qué paciente pertenece | Entero | Sí | 10 |
| fecha_control | Fecha del control | Fecha | Sí | 2026-10-07 |
| motivo | Descripción breve | Texto | Sí | Control de seguimiento (ficticio) |
| token | Clave secreta y larga del enlace del paciente | Texto | Sí (automático) | Xy8…(22 caracteres) |
| version_cuestionario | Versión de preguntas usada | Texto | Sí | demo-1.0 |
| estado_invitacion | pendiente / simulada / enviada / fallida | Texto | Sí | simulada |
| enviado_por_paciente_en | Cuándo el paciente apretó "Enviar" | Fecha y hora | No (vacío = nunca) | 2026-09-24T11:02:00 |
| fecha_confirmada | Fecha que el paciente confirmó como correcta | Fecha | No | 2026-10-07 |
| estado_revision | pendiente / revisada | Texto | Sí | pendiente |
| revisado_por | Quién revisó | Texto | No | Enf. Demo |
| revisado_en | Cuándo revisó | Fecha y hora | No | 2026-09-24T12:00:00 |
| nota_equipo | Nota interna | Texto | No | Llamar el lunes (demo) |
| creado_en / actualizado_en | Creación y último cambio | Fecha y hora | Sí | 2026-09-24T10:00:00 |

> El **estado de respuesta** (sin responder / parcial / completa) y los **motivos de contacto** no se guardan: se **calculan** cada vez a partir de las respuestas. Así nunca quedan desactualizados.

## 3. `examenes_control` (exámenes de CADA control)
| Campo | Significado | Tipo | Obligatorio | Ejemplo |
|---|---|---|---|---|
| id | Número interno | Entero | Sí | 25 |
| control_id | A qué control pertenece | Entero | Sí | 8 |
| nombre | Nombre del examen (del catálogo en `config.json`) | Texto | Sí | Hemograma (ejemplo) |
| tipo | laboratorio / imagen | Texto | Sí | laboratorio |
| declara_realizado | **Lo que DICE el paciente**: si / todavia_no / no_sabe / aclarar | Texto | No (vacío = sin respuesta) | aclarar |
| declara_resultado | **Lo que DICE el paciente**: si / no / no_sabe / no_corresponde | Texto | No (vacío = sin respuesta) | no_sabe |
| verificacion_equipo | **Lo que VERIFICÓ el equipo**: sin_verificar / coincide / no_coincide | Texto | Sí (por defecto sin_verificar) | coincide |
| verificado_por / verificado_en | Quién y cuándo verificó | Texto / Fecha y hora | No | Enf. Demo |

### Tres cosas distintas (no son equivalentes)
1. **El paciente dice que se realizó el examen** → `declara_realizado = si`
2. **El paciente dice que tiene el resultado** → `declara_resultado = si`
3. **El equipo verificó esa información** → `verificacion_equipo = coincide` (o `no_coincide`)

Un paciente puede decir "sí" y el equipo verificar "no coincide". Ambas cosas quedan guardadas por separado.

### "No", "no sabe", "no corresponde" y "sin respuesta"
| Valor | Significa | Quién lo pone |
|---|---|---|
| `todavia_no` / `no` | El paciente respondió que no | Paciente |
| `no_sabe` | El paciente respondió que no está seguro | Paciente |
| `aclarar` | El paciente prefiere aclararlo con el equipo | Paciente |
| `no_corresponde` | La pregunta del resultado no aplica porque el paciente NO declaró el examen como realizado | Sistema (regla lógica, no una respuesta inventada) |
| vacío (`sin_respuesta` en CSV) | Nadie respondió todavía | — (nunca se rellena) |

## 4. `respuestas` (cuestionario de CADA control)
| Campo | Significado | Tipo | Obligatorio | Ejemplo |
|---|---|---|---|---|
| id | Número interno | Entero | Sí | 40 |
| control_id | A qué control pertenece | Entero | Sí | 8 |
| pregunta_id | Qué pregunta (según `cuestionario.json`) | Texto | Sí | quiere_contacto |
| valor | Respuesta elegida (vacío = "lo respondo después") | Texto | No | si |
| version_cuestionario | Versión de la pregunta | Texto | Sí | demo-1.0 |
| respondido_en | Cuándo respondió o corrigió | Fecha y hora | Sí | 2026-09-24T11:00:00 |

Regla: **una sola respuesta vigente por pregunta y por control**. Si el paciente responde dos veces o corrige, se reemplaza (no se duplica) y el cambio queda en `eventos`.
La confirmación del control se guarda aquí como `pregunta_id = confirma_control`.

## 5. `eventos` (historial / registro de invitaciones y recordatorios)
| Campo | Significado | Tipo | Obligatorio | Ejemplo |
|---|---|---|---|---|
| id | Número interno | Entero | Sí | 120 |
| control_id | Control al que se refiere | Entero | Sí | 3 |
| tipo | Qué pasó | Texto | Sí | recordatorio_simulado |
| detalle | Explicación legible | Texto | No | Recordatorio N°1 (fecha simulada 2026-09-24)… |
| actor | sistema / paciente / equipo | Texto | Sí | sistema |
| clave_unica | Evita duplicados (ej. el mismo recordatorio dos veces) | Texto | No | recordatorio-3-2026-09-29-1 |
| creado_en | Cuándo | Fecha y hora | Sí | 2026-09-24T12:30:00 |

Tipos de evento: `control_registrado`, `invitacion_simulada`, `invitacion_fallida`, `envio_bloqueado`, `conversacion_iniciada`, `respuestas_enviadas`, `respuestas_reenviadas`, `respuesta_corregida`, `revision_reabierta`, `baja_mensajes`, `recordatorio_simulado`, `recordatorio_fallido`, `recordatorio_bloqueado`, `cambio_fecha`, `verificacion_examen`, `revision_revisada`, `revision_pendiente`.

## Los 10 pacientes ficticios
| Código | Situación que demuestra |
|---|---|
| PAC-001 | Caso ideal: responde, **corrige después de enviar**, responde dos veces, equipo verifica y revisa |
| PAC-002 | Recién registrado: invitación **pendiente** |
| PAC-003 | Invitado y **sin responder** (control en 5 días → le corresponde recordatorio) |
| PAC-004 | Respuesta **parcial** |
| PAC-005 | Completa, con un **examen pendiente** |
| PAC-006 | **Invitación fallida** (sin teléfono) |
| PAC-007 | Parcial y **pidió no recibir más mensajes** |
| PAC-008 | Completa, **pide contacto**, "no sabe" y "prefiere aclarar" |
| PAC-009 | Completa, pero el equipo **cambió la fecha** después de que la confirmó |
| PAC-010 | **Dos controles**: uno antiguo completo y revisado, uno nuevo sin responder |
