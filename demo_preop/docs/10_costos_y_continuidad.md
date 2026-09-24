# 10 · Costos y posible continuidad

> **Ninguna cifra de este documento está verificada con proveedores.** Los precios de servidores y mensajería cambian y dependen del país; deben cotizarse en las páginas oficiales o con el área de compras del hospital al momento de decidir. Aquí solo separamos **qué** costaría, con supuestos declarados.

## 1. Costo de construir la demo
| Ítem | Costo en dinero | Supuesto |
|---|---|---|
| Software (Python, Flask, SQLite) | 0 | Son gratuitos y de código abierto |
| Servicios externos | 0 | La demo no usa ninguno |
| Computador | Ya disponible | Se usa el de Gabriel |
| Tiempo de Gabriel/Osmán | Horas de trabajo (no monetizadas) | Instalar, probar, ensayar y presentar |

## 2. Costos mensuales de un eventual piloto (categorías, sin cifras)
| Categoría | Qué incluye | Cómo estimarlo |
|---|---|---|
| Alojamiento | Servidor o plataforma autorizada por el hospital, base de datos, copias de seguridad | Cotizar con TI del hospital o proveedor autorizado |
| Dominio y certificado (HTTPS) | Dirección web y conexión cifrada | Puede estar cubierto por TI del hospital |
| Canal de mensajería | Mensajes de invitación y recordatorio (WhatsApp/SMS) | Revisar la página oficial de precios del proveedor elegido para el país |
| Tiempo del personal que revisa | Horas de enfermería/secretaría | Medirlo en el piloto (es una de las métricas) |

## 3. Soporte y mantenimiento
- Actualizaciones de seguridad de Python/Flask.
- Cambios en preguntas y versiones del cuestionario.
- Atención de fallas (¿quién responde si el sistema se cae un lunes a las 8:00?).
- Supuesto: requiere una persona técnica responsable, aunque sea con dedicación parcial.

## 4. Costos que aumentan con pacientes o mensajes
- **Mensajes:** crecen con (controles × (1 invitación + recordatorios)). Con la configuración de la demo `[7, 2]`, cada control podría recibir hasta 3 mensajes.
- **Revisión humana:** crece con los casos que "requieren contacto".
- **Almacenamiento:** muy bajo para este volumen (texto), no es el costo principal.

## 5. Trabajo adicional de integraciones y seguridad (el más grande)
- Usuarios, roles y registro de accesos.
- Verificación de identidad del paciente.
- Canal real de mensajería con proveedor autorizado.
- Revisión de seguridad profesional y documentación para el hospital.
- (Opcional, bastante más complejo) Integración con la ficha clínica o agenda del hospital.

## 6. Preguntas para conversar con el hospital
**Sobre el uso**
1. ¿Quién llama hoy a los pacientes antes del control y cuánto tiempo le toma?
2. ¿Cuántos controles por semana tiene la unidad?
3. ¿Con qué frecuencia llega un paciente sin exámenes o sin resultados? ¿Se registra?
4. ¿Quién revisaría el panel y cuándo?

**Sobre la aprobación**
5. ¿Quién debe aprobar un piloto (jefatura, dirección, TI, protección de datos, comité de ética)?
6. ¿Qué canales de mensajería están autorizados para contactar pacientes?
7. ¿Dónde puede alojarse un sistema con datos de pacientes?

**Sobre el financiamiento**
8. ¿Existe un presupuesto de innovación, calidad o investigación que pueda cubrir un piloto?
9. ¿Qué resultado del piloto justificaría continuar?
10. ¿Otras unidades tienen el mismo problema?

**No asumimos que existe un negocio** solo porque hay interés en la idea. Primero hay que comprobar que el problema existe, que la herramienta se usa y que alguien está dispuesto a sostenerla.
