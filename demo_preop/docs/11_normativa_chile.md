# 11 · Normativa en Chile: temas a validar antes de un piloto

> **Esto NO es asesoría legal ni una declaración de cumplimiento.** Es una lista de temas, basada en fuentes oficiales, para conversar con el área jurídica, el encargado de protección de datos / seguridad de la información y el comité de ética del hospital.
> Revisado el 25-09-2026. Los sitios oficiales (bcn.cl, diariooficial.interior.gob.cl) no se pudieron abrir directamente desde el entorno de desarrollo: la información se contrastó con los resultados de búsqueda de esas mismas páginas oficiales y con documentos de la Biblioteca del Congreso. **Antes de decidir, lean el texto vigente en [leychile.cl / bcn.cl](https://www.bcn.cl/leychile).**

## 1. Normas principales

| Norma | Qué regula | Por qué importa a este proyecto |
|---|---|---|
| **Ley 19.628** sobre protección de la vida privada | Tratamiento de datos personales (texto vigente hasta el 30-11-2026) | Hoy define los datos de salud como **datos sensibles** |
| **Ley 21.719** (publicada el 13-12-2024, **vigente desde el 01-12-2026**) | Reforma completa de la Ley 19.628, que pasa a llamarse "Ley de protección de datos personales"; crea la **Agencia de Protección de Datos Personales** | Un piloto que empiece después de diciembre de 2026 quedará bajo este régimen: derechos de acceso, rectificación, supresión, oposición, portabilidad y bloqueo; protección reforzada de datos de salud; sanciones |
| **Ley 20.584** de derechos y deberes de los pacientes | Atención en salud, **ficha clínica** (art. 12) y su reserva (art. 13) | Toda la información de la ficha y de los exámenes es **dato sensible**. Terceros no relacionados con la atención (incluidos investigadores) tienen acceso restringido |
| **Decreto 41 (2012), Minsal**: Reglamento sobre fichas clínicas | Contenido, conservación y seguridad de la ficha | Si en el futuro se integra con la ficha o se registran respuestas en ella |
| **Ley 20.120** y su reglamento (**DS 114/2010**) | Investigación científica en seres humanos | Investigación biomédica requiere informe favorable de un **Comité Ético Científico** acreditado, autorización del director de la institución y **consentimiento informado** |
| **Ley 21.663**, Ley Marco de Ciberseguridad | Deberes de ciberseguridad y reporte de incidentes a la **ANCI** | Los prestadores de salud son **servicios esenciales**; algunos hospitales y clínicas fueron calificados **Operadores de Importancia Vital**. Un sistema nuevo debe encajar en su gestión de seguridad y reporte de incidentes |
| (Si el hospital es público) **Ley 20.285** de transparencia y normas de gobierno digital | Deberes de los órganos del Estado | Contratación de proveedores, alojamiento y políticas de datos del Servicio de Salud |

## 2. Qué significa para cada etapa

| Etapa | Situación |
|---|---|
| **Demo actual** (datos 100 % ficticios, en tu computador) | No hay datos personales reales, así que no hay tratamiento de datos de pacientes. Igual conviene decir en la presentación que es ficticia y no pegar datos reales en ningún lado. |
| **Piloto con pacientes reales** | Hay tratamiento de **datos sensibles de salud**: los exámenes pedidos y lo que responde el paciente. Se necesita, como mínimo, lo de la sección 3. |
| **Investigación o publicación** | Es una etapa distinta: requiere protocolo, **Comité Ético Científico**, autorización institucional y la base de legitimidad que corresponda. Que existan los datos del piloto **no autoriza** a usarlos para investigar. |

## 3. Preguntas para el hospital (antes de un piloto)

**Legitimidad y transparencia**
1. ¿Cuál es la **base de legitimidad** para tratar estos datos: consentimiento del paciente, parte de la atención de salud u otra que indique el área jurídica? ¿Cómo cambia desde el 01-12-2026 con la Ley 21.719?
2. ¿Qué **información** debe recibir el paciente antes de responder: quién es el responsable, para qué se usan los datos, quién los ve, cuánto tiempo se guardan y cómo ejercer sus derechos?
3. ¿Las respuestas del paciente quedarán **en la ficha clínica** o en un registro administrativo aparte? Esto cambia las reglas que aplican.

**Responsables y proveedores**
4. ¿Quién es el **responsable** del tratamiento: el hospital o el Servicio de Salud? ¿Quién es el **encargado/delegado** de protección de datos o de seguridad de la información?
5. Si participan terceros (Gabriel/Osmán como desarrolladores, un servidor externo, WhatsApp u otro proveedor de mensajería), ¿qué **contrato o convenio de tratamiento de datos** se requiere? ¿Qué proveedores están autorizados?
6. ¿Se permite alojar datos de pacientes **fuera de Chile** (por ejemplo, en servidores de proveedores extranjeros de mensajería o nube)? ¿Con qué condiciones?

**Seguridad**
7. ¿El hospital es **Operador de Importancia Vital** según la Ley 21.663? ¿Qué exige su sistema de gestión de seguridad para incorporar una herramienta nueva?
8. ¿Cuál es el **procedimiento de incidentes** (a quién se avisa y en qué plazos)?
9. ¿Qué exigencias hay de **registro de accesos**, respaldos, conservación y eliminación?

**Investigación (más adelante)**
10. ¿Qué **Comité Ético Científico** correspondería? ¿Exigiría consentimiento informado específico para usar datos del piloto con fines de investigación?
11. ¿Qué nivel de **anonimización** se exigiría? La Ley 21.719 distingue:
    - **Anonimización:** procedimiento **irreversible**; el dato deja de ser personal.
    - **Seudonimización:** el dato ya no se atribuye a la persona **sin información adicional** guardada por separado. **Sigue siendo dato personal.** El CSV de la demo (con código PAC-xxx) es seudonimizado, **no anónimo**.

## 4. Qué NO afirmamos
- No afirmamos que la demo o un piloto "cumpla con la ley".
- Tener contraseña, un texto de consentimiento o quitar nombres **no** basta para cumplir.
- No reemplazamos la evaluación del área jurídica, del encargado de protección de datos ni del Comité Ético Científico.

## Fuentes
- [Ley 21.719, BCN LeyChile](https://www.bcn.cl/leychile/navegar?idNorma=1209272) y [síntesis de la Ley 21.719, BCN Asesorías Parlamentarias](https://www.bcn.cl/asesoriasparlamentarias/detalle_documento.html?id=84440)
- [Balance legislativo Ley 21.719, BCN](https://www.bcn.cl/balance-legislativo/detalle/ficha_LEY_21719_2024-12-13)
- [Ley 19.628, BCN (versión vigente desde 01-12-2026)](https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01)
- [Ley 21.719 en el Diario Oficial, 13-12-2024](https://www.diariooficial.interior.gob.cl/publicaciones/2024/12/13/44023/01/2583630.pdf)
- [Ley 20.584, BCN](https://www.bcn.cl/leychile/navegar?idNorma=1039348); [art. 12](https://www.suseso.gob.cl/612/w3-propertyvalue-130626.html) y [art. 13](https://www.suseso.gob.cl/612/w3-propertyvalue-130630.html) (SUSESO)
- [Ley 20.584 e investigación biomédica, Rev. Méd. Chile (SciELO)](https://www.scielo.cl/scielo.php?script=sci_arttext&pid=S0034-98872015000100012)
- [Ley 20.120 (ISP)](https://ispch.cl/sites/default/files/normativa_anamed/medicamentos/Ley%2020.120.pdf); [normativa vigente, CEISH U. de Chile](https://medicina.uchile.cl/ceish/normativas-y-pautas-eticas/normativa-vigente)
- [Ley 21.663, BCN](https://www.bcn.cl/leychile/navegar?idNorma=1202434); [ANCI: nómina de OIV](https://anci.gob.cl/noticias/anci-presenta-nomina-de-oiv-correspondiente-al-primer-procedimiento-de-calificacion/)
- [Guía de implementación de la Ley 21.719, Secretaría de Gobierno Digital](https://wikiguias.digital.gob.cl/datos-personales/guia-practica-implementacion-nueva-ley-datos-personales); [Guía introductoria a la anonimización](https://wikiguias.digital.gob.cl/documentos/gui%CC%81a_anonimizacion_de_datos.pdf)
