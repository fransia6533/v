# 09 · Seguridad y condiciones antes de usar pacientes reales

## Lo que la demo SÍ hace (y por qué no alcanza)
| Medida en la demo | Por qué no es suficiente para datos reales |
|---|---|
| Solo datos ficticios; teléfonos deben empezar con 000 | Con datos reales se necesitan controles institucionales, no solo validaciones |
| La app solo es visible desde tu computador (`127.0.0.1`) | Un sistema real estaría en un servidor accesible y necesita protección completa |
| Contraseña opcional del panel por variable de entorno (no escrita en el código) | Es una sola clave compartida; no hay usuarios individuales ni roles |
| Enlace del paciente con token aleatorio largo | Quien obtenga el enlace puede ver la fecha del control y responder; falta verificar identidad |
| Historial de eventos | No registra **quién del equipo** vio qué (no hay usuarios), ni es inalterable |
| CSV sin nombre ni teléfono | Sigue siendo dato **seudonimizado**, no anónimo |
| Texto con `textContent` y plantillas con escape automático | Falta una revisión de seguridad profesional (CSRF, cabeceras, límites de uso, etc.) |

**Una demo local no es un sistema preparado para el hospital.** Tener contraseña o un texto de consentimiento **no** significa que el proyecto "cumpla con la ley".

## Reglas mientras sigamos en demo
- Usar **exclusivamente datos sintéticos**. No pegar datos de pacientes en este chat ni subirlos a servicios públicos (GitHub, Drive personal, etc.).
- No publicar la demo en internet.
- No escribir contraseñas ni claves dentro del código.

## Condiciones pendientes antes de usar pacientes reales
Validar con los responsables del hospital:

1. **Autorización institucional** y un **responsable** formal del proyecto.
2. **Preguntas clínicas** definidas, revisadas y aprobadas por el equipo médico (con versión y fecha de aprobación).
3. **Base jurídica** para tratar los datos, **información al paciente** (qué se pregunta, para qué, quién lo ve, cuánto tiempo se guarda) y **consentimientos** que correspondan según la normativa del país.
4. **Accesos según funciones:** usuarios individuales (no una clave compartida), roles (registrar, revisar, exportar), cierre de sesión, contraseñas robustas o acceso institucional.
5. **Alojamiento y proveedores autorizados** por el hospital (servidor, base de datos, canal de mensajería), con acuerdos de tratamiento de datos.
6. **Registro de accesos y modificaciones** (quién vio, cambió o exportó cada dato), protegido contra alteraciones.
7. **Copias de seguridad** periódicas, cifradas y probadas (restaurar al menos una vez).
8. **Conservación y eliminación:** cuánto tiempo se guardan los datos y cómo se eliminan.
9. **Manejo de incidentes:** qué hacer y a quién avisar si hay un acceso indebido o una pérdida de datos.
10. **Responsable humano** de revisar respuestas y solicitudes de contacto, con plazos definidos; qué pasa si nadie revisa.
11. **Condiciones del canal de mensajería:** proveedor autorizado, plantillas aprobadas, gestión de bajas, qué hacer si el mensaje llega a otra persona.
12. **Verificación de identidad** del paciente al abrir el enlace (por ejemplo, fecha de nacimiento o un código), según lo que defina el hospital.
13. **Seguridad técnica:** conexión cifrada (HTTPS), protección contra CSRF, actualizaciones, revisión de seguridad por un profesional.
14. **Texto de urgencias** revisado por el hospital (qué hacer si el paciente escribe algo urgente en el comentario, que nadie lee en tiempo real).

## Normativa
**Aún no sé en qué país está el hospital.** Cuando me lo confirmes, revisaré fuentes oficiales vigentes (ley de protección de datos personales, normas sobre datos de salud y ficha clínica, derechos del paciente e investigación en seres humanos) y te entregaré una lista de temas para validar con el área legal del hospital. **No reemplaza una asesoría legal.**

## Investigación (etapa posterior)
| Tipo de dato | Qué es | Ejemplo en este proyecto |
|---|---|---|
| **Identificado** | Permite saber directamente quién es | Tabla `pacientes` con nombre y teléfono |
| **Seudonimizado** | Se quitó el nombre, pero con un código o tabla de correspondencia se puede volver a identificar | El CSV con `PAC-001` |
| **Anónimo** | No es posible volver a identificar a la persona con medios razonables, ni siquiera combinando datos | Requiere un proceso de anonimización evaluado (agregar, quitar fechas exactas, etc.) |

Quitar el nombre **no** vuelve anónima una tabla: fechas de control, combinaciones de exámenes o comentarios libres pueden permitir identificar a alguien.

Cualquier uso para investigación o publicación queda **sujeto a la evaluación institucional, ética y normativa** que corresponda (por ejemplo, comité de ética y protocolo aprobado). El interés en investigar no equivale a una autorización.
