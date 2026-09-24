# 08 · Guion de demostración (5 minutos) y presentación breve

## Antes de empezar (checklist)
- [ ] Demo iniciada y probada 10 minutos antes.
- [ ] **Reiniciar demo** (botón al final del panel) para partir de los 10 casos limpios.
- [ ] Dos pestañas abiertas: el **Panel** y una pestaña vacía para el chat.
- [ ] Zoom del navegador al 125 % si se proyecta.
- [ ] Decir siempre: "datos ficticios" y "envío simulado".

## Guion de 5 minutos

| Tiempo | Qué muestras | Qué dices (sugerencia) |
|---|---|---|
| 0:00–0:45 | Diapositiva 1 (problema) | "Queremos validar si preguntar a los pacientes, antes del control, por sus exámenes y resultados ayuda al equipo a saber a quién contactar. No diagnostica ni decide nada clínico. Todo lo que verán es ficticio." |
| 0:45–1:30 | Registrar control → paciente nuevo, 2 exámenes → Guardar | "Así registraría el equipo a un paciente y los exámenes que le pidieron." |
| 1:30–1:50 | Detalle → **Simular envío de invitación** | "Aquí el sistema prepararía el mensaje. En esta demo **no sale ningún mensaje**: queda como 'Simulada'." |
| 1:50–3:00 | Abrir la vista del paciente → responder; en un examen elegir "Prefiero aclararlo con el equipo"; en el resumen corregir una respuesta; Enviar | "El paciente responde con botones. Puede dejar cosas pendientes o pedir aclarar con el equipo, y corregir antes de enviar." |
| 3:00–4:00 | Panel → filtro **Requiere contacto = Sí** + **Revisión = Pendiente**; abrir PAC-008 | "El equipo ve de inmediato quién requiere contacto y **por qué**. Fíjense que separamos lo que dice el paciente de lo que verifica el equipo." |
| 4:00–4:30 | Marcar como revisada; **Exportar esta tabla (CSV)** | "Una persona revisa y queda registrado quién y cuándo. Se puede exportar a Excel." |
| 4:30–5:00 | Diapositiva 4–5 (qué mediríamos, qué necesitamos) | "Para saber si sirve de verdad necesitamos un piloto autorizado. Esto es lo que les pedimos…" |

**Si algo falla en vivo:** "Reiniciar demo" y mostrar PAC-008 (caso ya cargado) y el CSV.

## Contenido de la presentación (5 diapositivas)

### 1. Problema que queremos validar
- Antes de un control, ¿sabemos si el paciente se hizo los exámenes y tiene los resultados?
- Hipótesis: preguntarlo de forma ordenada, antes del control, ayuda al equipo a priorizar contactos.
- **No** afirmamos que ahorre tiempo ni que mejore resultados: es lo que queremos medir.

### 2. Funcionamiento propuesto
- Diagrama de 7 pasos (de `00_mapa_del_proyecto.md`).
- El sistema no diagnostica, no calcula riesgos, no decide aptitud quirúrgica.
- Siempre hay una persona que revisa.

### 3. Demostración del recorrido completo
- Registro → invitación (simulada) → chat → panel → revisión → exportación.
- Casos especiales: sin respuesta, parcial, examen pendiente, fallida, baja, cambio de fecha, dos controles.

### 4. Qué mediríamos en un piloto (métricas administrativas)
| Métrica | Cómo se calcula |
|---|---|
| Tasa de entrega | Invitaciones entregadas / invitaciones intentadas |
| Tasa de respuesta | Controles con alguna respuesta / invitaciones entregadas |
| Formularios completos | Controles "Completa" / invitaciones entregadas |
| Tiempo hasta responder | Mediana de horas entre invitación y envío del paciente |
| Casos que requieren contacto | Controles con al menos un motivo / total |
| Tiempo de revisión | Mediana entre envío del paciente y "Revisada" |
| Solicitudes de baja | Bajas / invitaciones entregadas |
| Concordancia declarado vs. verificado | Exámenes "coincide" / exámenes verificados |
| (Con línea base previa) Pacientes que llegan sin exámenes | Comparar antes vs. durante el piloto, con registro del propio equipo |

**No hay resultados todavía.** Estas métricas se calcularían solo con un piloto autorizado.

### 5. Qué necesitamos del hospital para avanzar
1. Un **responsable** institucional del proyecto y una persona del equipo que revise respuestas.
2. **Definición y aprobación** de las preguntas por el equipo médico.
3. Orientación sobre **autorización institucional**, protección de datos y, si corresponde, comité de ética.
4. Datos operativos para dimensionar: controles por semana, cómo se contacta hoy a los pacientes.
5. Decisión sobre el **canal** (WhatsApp, SMS, otro) y proveedores autorizados.
6. Saber **quién aprobaría y quién podría financiar** un piloto.
