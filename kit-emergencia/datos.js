/* ============================================================================
   KIT DE EMERGENCIA - ALTA MONTAÑA
   ----------------------------------------------------------------------------
   ESTE ARCHIVO ES EL "CEREBRO" DE LA APP. AQUÍ VIVE TODO EL CONTENIDO MÉDICO.

   >>> PARA EL MÉDICO QUE REVISA <<<
   - Todo lo marcado con  ⚠️ VALIDAR  o  "____"  hay que revisarlo/completarlo.
   - Podés AGREGAR, QUITAR o CORREGIR cualquier escenario o ítem.
   - Las DOSIS de medicamentos están en blanco a propósito: complételas usted.
   - No hace falta saber programar: solo editá el texto entre comillas.
     Respetá las comillas, las comas y las llaves { } tal como están.

   Estructura de un escenario:
     {
       id: "identificador-corto",
       titulo: "Lo que ve el usuario en el botón",
       sintomas: ["palabra clave para el buscador", "otra"],
       gravedad: "alta" | "media" | "baja",   // cambia el color
       pasos: ["Paso 1", "Paso 2", ...],       // qué hacer, en orden
       items: ["nombre-del-item-del-kit"],      // qué usar del kit
       cuandoBajar: "Señales de que hay que evacuar / pedir rescate",
       validado: false   // poné true cuando el médico lo apruebe
     }
   ========================================================================== */

const META = {
  version: "3.2 (borrador)",
  revisadoPor: "____ (nombre del médico)",   // ⚠️ VALIDAR
  fechaRevision: "____",                      // ⚠️ VALIDAR
  paciente: "Frank",
  altura: "190 cm",
  peso: "105 kg",
  grupoSanguineo: "O negativo",
  alergiasConocidas: "____ (completar)",      // ⚠️ VALIDAR - MUY IMPORTANTE
  contactoEmergencia: "____ (nombre y teléfono)",
  rescateMontana: "____ (número de rescate de la zona)"
};

/* --------------------------------------------------------------------------
   BOTIQUÍN — LA BASE DE DATOS PRINCIPAL (tipo tabla de Excel)
   Columnas: objeto · dosis · via · procedimiento · comentario · validado
   ⚠️ Tu amigo médico completa/corrige esto (en la app o en Excel).
   Las dosis están en blanco a propósito: las pone el médico.
   Contexto del paciente para las dosis: 190 cm · 105 kg · O negativo.
   -------------------------------------------------------------------------- */
// Cada ítem: objeto, tambien(otros nombres), dosis(texto fijo),
// dosisPorKg(ej "10 mg/kg, máx 50 mg" — la app calcula para tu peso),
// via, procedimiento(cómo y DÓNDE usar), comentario, validado.
const BOTIQUIN_DEFAULT = [
  // ---------------- MEDICAMENTOS ----------------
  {
    objeto: "Adrenalina (epinefrina) / autoinyector",
    tambien: "epinefrina, epipen, autoinyector, anafilaxia, alergia grave, shock",
    dosis: "____ mg  ⚠️ VALIDAR", dosisPorKg: "____ mg/kg  ⚠️ VALIDAR",
    via: "inyectable (intramuscular)",
    procedimiento: "Anafilaxia. DÓNDE: en la cara lateral (externa) del muslo, perpendicular, atraviesa la ropa. Mantener 3 seg. Repetir a los ____ min si no mejora. SIEMPRE pedir rescate.",
    comentario: "____ (dosis y repetición las define el médico)", validado: false
  },
  {
    objeto: "Antihistamínico",
    tambien: "antialérgico, alergia, loratadina, cetirizina, difenhidramina, ronchas, picazón",
    dosis: "____ mg  ⚠️ VALIDAR", dosisPorKg: "",
    via: "oral / masticable",
    procedimiento: "Alergia leve, picaduras, ronchas. En anafilaxia: DESPUÉS de la adrenalina, nunca en lugar de.",
    comentario: "____", validado: false
  },
  {
    objeto: "Corticoide",
    tambien: "dexametasona, prednisona, betametasona, antiinflamatorio fuerte, alergia, edema cerebral",
    dosis: "____ mg  ⚠️ VALIDAR", dosisPorKg: "____ mg/kg  ⚠️ VALIDAR",
    via: "oral / inyectable",
    procedimiento: "Alergia grave (tras adrenalina), inflamación, y en mal de altura grave (edema cerebral). Uso y dosis SOLO según el médico.",
    comentario: "____", validado: false
  },
  {
    objeto: "Paracetamol",
    tambien: "acetaminofeno, tylenol, fiebre, dolor, pastilla para el dolor, calmante, antifebril, para la fiebre, para el dolor, analgesico",
    dosis: "____ mg  ⚠️ VALIDAR", dosisPorKg: "____ mg/kg  ⚠️ VALIDAR",
    via: "oral",
    procedimiento: "Dolor leve/moderado y fiebre. Respetar el tiempo entre tomas. No pasar la dosis máxima diaria.",
    comentario: "____", validado: false
  },
  {
    objeto: "Ibuprofeno",
    tambien: "antiinflamatorio, dolor, golpe, esguince, fiebre, aine, ibuprofeno, calmante, para el dolor, antiinflamatorio para golpes",
    dosis: "____ mg  ⚠️ VALIDAR", dosisPorKg: "____ mg/kg  ⚠️ VALIDAR",
    via: "oral",
    procedimiento: "Dolor con inflamación (golpes, esguinces), fiebre. Tomar con algo de comida. Cuidado si hay problemas de estómago/riñón.",
    comentario: "____", validado: false
  },
  {
    objeto: "Analgésico fuerte",
    tambien: "tramadol, dolor intenso, fractura, calmante fuerte",
    dosis: "____ mg  ⚠️ VALIDAR", dosisPorKg: "",
    via: "oral / inyectable",
    procedimiento: "Dolor intenso (fractura, lesión grande). SOLO según indicación del médico; puede dar sueño/mareo.",
    comentario: "____", validado: false
  },
  {
    objeto: "Acetazolamida",
    tambien: "diamox, mal de altura, soroche, prevención altura",
    dosis: "____ mg  ⚠️ VALIDAR", dosisPorKg: "",
    via: "oral",
    procedimiento: "Prevención y tratamiento del mal de altura. Empezar según indique el médico. No reemplaza el descenso si hay señales graves.",
    comentario: "____", validado: false
  },
  {
    objeto: "Antiemético (para vómitos)",
    tambien: "metoclopramida, ondansetron, nausea, náuseas, vomito, vómito, mareo",
    dosis: "____ mg  ⚠️ VALIDAR", dosisPorKg: "",
    via: "oral / inyectable",
    procedimiento: "Náuseas y vómitos. Útil en altura y deshidratación.",
    comentario: "____", validado: false
  },
  {
    objeto: "Antidiarreico",
    tambien: "loperamida, diarrea, suelto",
    dosis: "____ mg  ⚠️ VALIDAR", dosisPorKg: "",
    via: "oral",
    procedimiento: "Diarrea. Hidratar siempre. No usar si hay fiebre alta o sangre en las heces.",
    comentario: "____", validado: false
  },
  {
    objeto: "Antibiótico de amplio espectro",
    tambien: "amoxicilina, azitromicina, ciprofloxacina, infección, herida infectada",
    dosis: "____ mg  ⚠️ VALIDAR", dosisPorKg: "____ mg/kg  ⚠️ VALIDAR",
    via: "oral",
    procedimiento: "Infecciones (heridas, respiratorias, digestivas). Cuál y cuánto SOLO según el médico. Ojo con alergias.",
    comentario: "____ ⚠️ revisar alergia a antibióticos", validado: false
  },
  {
    objeto: "Protector gástrico",
    tambien: "omeprazol, acidez, estomago, estómago",
    dosis: "____ mg  ⚠️ VALIDAR", dosisPorKg: "",
    via: "oral",
    procedimiento: "Acidez/malestar de estómago, y al usar antiinflamatorios varios días.",
    comentario: "____", validado: false
  },
  {
    objeto: "Sales de rehidratación oral",
    tambien: "suero oral, rehidratacion, deshidratacion, electrolitos, diarrea, vomito",
    dosis: "1 sobre en ____ ml de agua  ⚠️ VALIDAR", dosisPorKg: "",
    via: "oral",
    procedimiento: "Deshidratación por diarrea, vómitos o esfuerzo. Disolver en agua potable y tomar de a sorbos.",
    comentario: "", validado: false
  },
  {
    objeto: "Inhalador broncodilatador",
    tambien: "salbutamol, ventolin, asma, falta de aire, broncoespasmo, silbido",
    dosis: "____ puff  ⚠️ VALIDAR", dosisPorKg: "",
    via: "inhalado",
    procedimiento: "Falta de aire con silbido / asma. Agitar, exhalar, inhalar profundo con el disparo, aguantar unos segundos.",
    comentario: "____", validado: false
  },
  {
    objeto: "Colirio / suero ocular",
    tambien: "ojos, lavado ocular, cuerpo extraño, irritacion",
    dosis: "—", dosisPorKg: "",
    via: "ocular",
    procedimiento: "Lavar el ojo con irritación o algo adentro. Enjuagar abundante desde el lagrimal hacia afuera.",
    comentario: "", validado: false
  },
  // ---------------- INSUMOS / MATERIAL ----------------
  {
    objeto: "Gasas estériles",
    tambien: "apósitos, compresas, herida, sangrado",
    dosis: "las necesarias", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "Cubrir heridas y hacer presión directa sobre sangrados. Si se empapa, poner otra ENCIMA sin quitar la primera.",
    comentario: "", validado: false
  },
  {
    objeto: "Venda elástica",
    tambien: "venda, vendaje, esguince, compresion, compresión, sujetar",
    dosis: "—", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "Comprimir esguinces, sujetar gasas o férulas. Firme pero sin cortar la circulación (el dedo debe seguir rosado y tibio).",
    comentario: "", validado: false
  },
  {
    objeto: "Tela adhesiva / esparadrapo",
    tambien: "cinta, micropore, tape, fijar",
    dosis: "—", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "Fijar gasas, vendas y apósitos.",
    comentario: "", validado: false
  },
  {
    objeto: "Suturas adhesivas (Steri-Strips)",
    tambien: "puntos de mariposa, cierre de herida, corte",
    dosis: "—", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "Cerrar cortes limpios sin necesidad de puntos. Aproximar los bordes y pegar tiras cruzadas.",
    comentario: "", validado: false
  },
  {
    objeto: "Curitas / apósitos chicos",
    tambien: "curita, banditas, tiritas, raspon, raspón, ampolla",
    dosis: "—", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "Heridas y raspones pequeños, ampollas.",
    comentario: "", validado: false
  },
  {
    objeto: "Antiséptico",
    tambien: "desinfectante, povidona, yodo, clorhexidina, alcohol, herida",
    dosis: "____  ⚠️ VALIDAR cuál", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "Desinfectar la herida ya limpia, antes de cubrir.",
    comentario: "____", validado: false
  },
  {
    objeto: "Suero fisiológico",
    tambien: "solucion salina, solución salina, lavar herida, lavar ojo",
    dosis: "—", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "Lavar heridas y ojos, sacar tierra y restos.",
    comentario: "", validado: false
  },
  {
    objeto: "Guantes",
    tambien: "latex, látex, nitrilo, proteccion, protección",
    dosis: "2-3 pares", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "Ponételos antes de tocar sangre o heridas (te protege a vos y a la herida).",
    comentario: "", validado: false
  },
  {
    objeto: "Manta térmica",
    tambien: "manta de emergencia, aluminio, frío, hipotermia, abrigo, shock",
    dosis: "—", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "Hipotermia/shock: envolver con el lado plateado hacia el cuerpo, junto con ropa seca.",
    comentario: "", validado: false
  },
  {
    objeto: "Férula maleable (SAM splint)",
    tambien: "ferula, férula, entablillar, fractura, inmovilizar, hueso",
    dosis: "—", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "Inmovilizar fracturas/esguinces. Moldear sobre el miembro lesionado y sujetar con vendas, dejando arriba y abajo de la lesión.",
    comentario: "", validado: false
  },
  {
    objeto: "Torniquete",
    tambien: "hemorragia grave, sangrado que no para, amputacion",
    dosis: "—", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "SOLO si un brazo/pierna sangra y peligra la vida y la presión no alcanza. Colocar varios cm POR ENCIMA de la herida, apretar hasta que pare, y ANOTAR la hora.",
    comentario: "____ ⚠️ técnica a validar con el médico", validado: false
  },
  {
    objeto: "Tijera y pinza",
    tambien: "tijeras, pinza, cortar, astilla, garrapata, espina",
    dosis: "—", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "Cortar vendas/ropa y sacar astillas, espinas o garrapatas.",
    comentario: "", validado: false
  },
  {
    objeto: "Termómetro",
    tambien: "fiebre, temperatura",
    dosis: "—", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "Medir la temperatura para ver si hay fiebre o hipotermia.",
    comentario: "", validado: false
  },
  {
    objeto: "Jeringa y aguja",
    tambien: "inyeccion, inyección, lavar herida, adrenalina ampolla",
    dosis: "—", dosisPorKg: "",
    via: "uso externo",
    procedimiento: "Para inyectar medicación (si no es autoinyector) o lavar heridas a presión. Uso según el médico.",
    comentario: "____", validado: false
  }
];

// Encabezados de la tabla (orden de columnas para Excel y la app)
const BOTIQUIN_COLUMNAS = [
  { id: "objeto", titulo: "Objeto / Medicamento" },
  { id: "tambien", titulo: "Otros nombres / sinónimos" },
  { id: "dosis", titulo: "Dosis fija (mg/cc) / cantidad" },
  { id: "dosisPorKg", titulo: "Dosis por peso (ej: 10 mg/kg, máx 50 mg)" },
  { id: "via", titulo: "Vía (masticable/inyectable/oral...)" },
  { id: "procedimiento", titulo: "Procedimiento (cómo y dónde usar)" },
  { id: "comentario", titulo: "Comentario del médico" },
  { id: "validado", titulo: "Validado (sí/no)" }
];

/* --------------------------------------------------------------------------
   TRIAGE — ASISTENTE DE PRIMEROS AUXILIOS QUE PREGUNTA
   Escribís qué te pasó y te hace preguntas básicas para guiarte.
   Cada situación es un árbol: nodos con "pregunta" + opciones, o "resultado".
   ⚠️ Primeros auxilios generales, NO un diagnóstico. Validar con médico.
   Ante la duda: pedí ayuda / evacuá.
   -------------------------------------------------------------------------- */
const TRIAGE = [
  {
    id: "rodilla",
    titulo: "Me doblé / golpeé la rodilla o el tobillo",
    sintomas: ["rodilla", "tobillo", "torcedura", "esguince", "doblar", "torcer", "torci", "me torci", "articulacion", "ligamento", "no puedo caminar", "no puedo apoyar", "cojeo", "me cai", "me caí", "me cai de rodillas", "me cai fuerte", "me resbale y me cai", "tuve una caida", "me dobles", "se me torcio", "me torci el tobillo", "me dobles la rodilla"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿La pierna o el pie se ve torcido/deformado, o el hueso asoma?",
        opciones: [{ texto: "Sí", ir: "grave" }, { texto: "No", ir: "q2" }] },
      q2: { pregunta: "¿Podés apoyar el pie y dar unos pasos, aunque duela?",
        opciones: [{ texto: "Sí, puedo apoyar", ir: "leve" }, { texto: "No aguanta el peso", ir: "q3" }] },
      q3: { pregunta: "¿Se hinchó mucho/muy rápido, o sentís el pie frío u hormigueado?",
        opciones: [{ texto: "Sí", ir: "moderado" }, { texto: "No", ir: "moderado" }] },
      grave: { resultado: { nivel: "alta", titulo: "Posible fractura o luxación", pasos: [
        "No fuerces ni intentes acomodar el hueso.",
        "Inmovilizá tal como quedó: entablillá con un bastón/ramas y vendas, sujetando por arriba y por debajo de la lesión.",
        "Frío si tenés (nieve envuelta en tela, nunca directo) y mantené la pierna quieta y elevada.",
        "Revisá que el pie siga con color, calor y sensibilidad.",
        "Analgésico si está en tu botiquín y validado por el médico." ],
        cuandoBajar: "Evacuar / pedir rescate: deformidad o hueso visible es urgente." } },
      moderado: { resultado: { nivel: "media", titulo: "Esguince o golpe importante", pasos: [
        "Pará la actividad. Regla RICE: Reposo, hielo/frío envuelto 15-20 min, Compresión con venda (sin cortar la circulación) y Elevación.",
        "No cargues peso si duele mucho; usá un bastón o que te ayuden a moverte.",
        "Analgésico/antiinflamatorio si está en tu botiquín y validado.",
        "Vigilá las próximas horas: si empeora la hinchazón/dolor o no podés apoyar, tratalo como fractura." ],
        cuandoBajar: "Si no podés caminar, el dolor es intenso, o el pie se pone frío/pálido/hormigueado: bajá y consultá." } },
      leve: { resultado: { nivel: "baja", titulo: "Torcedura leve", pasos: [
        "Descansá. Frío 15-20 min si tenés, y vendá con compresión suave.",
        "Probá caminar con cuidado; evitá terreno difícil hasta que afloje.",
        "Si más tarde se hincha o duele más, aplicá RICE y tratalo como esguince." ],
        cuandoBajar: "Si empeora con las horas o no mejora, consultá." } }
    }
  },
  {
    id: "hueso",
    titulo: "Me rompí o quebré un hueso (fractura)",
    sintomas: ["hueso", "fractura", "fracture", "me fracture", "quebre", "quebré", "me quebre", "parti", "partí", "me parti", "rompi", "rompí", "me rompi", "roto", "hueso roto", "no puedo mover", "creo que me quebre", "se me rompio", "me quebre un hueso", "me parti un hueso", "se me rompio un hueso"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿El hueso asoma por la piel o hay una herida abierta sobre el golpe?",
        opciones: [{ texto: "Sí (hueso/herida abierta)", ir: "expuesta" }, { texto: "No, la piel está entera", ir: "q2" }] },
      q2: { pregunta: "¿El miembro se ve torcido/deformado, no lo podés mover, o el dolor es muy intenso?",
        opciones: [{ texto: "Sí", ir: "cerrada" }, { texto: "No estoy seguro", ir: "cerrada" }] },
      expuesta: { resultado: { nivel: "alta", titulo: "Fractura expuesta (hueso visible)", pasos: [
        "No empujes el hueso hacia adentro ni lo laves a fondo.",
        "Cubrí la herida con gasa estéril (humedecida con suero si tenés) para que no se seque.",
        "Controlá el sangrado con presión alrededor (no encima del hueso).",
        "Inmovilizá tal como quedó, sin enderezar, sujetando por arriba y por debajo.",
        "Pedí rescate urgente. Analgésico fuerte solo si está validado." ],
        cuandoBajar: "Siempre: emergencia. Evacuación urgente (riesgo de infección y sangrado)." } },
      cerrada: { resultado: { nivel: "alta", titulo: "Posible fractura cerrada", pasos: [
        "No fuerces ni intentes 'acomodar' el hueso.",
        "Inmovilizá con una férula/bastón/ramas y vendas, sujetando la articulación de arriba y la de abajo.",
        "Frío si tenés (envuelto, nunca directo) y mantené el miembro quieto y elevado.",
        "Revisá que la mano/pie siga con color, calor y sensibilidad. Si se pone frío/pálido/azul, aflojá el vendaje.",
        "Analgésico según tu botiquín y validado. Pedí ayuda para evacuar." ],
        cuandoBajar: "Evacuar: con una fractura no podés seguir la actividad. Urgente si el miembro se pone frío/pálido/sin sensibilidad." } }
    }
  },
  {
    id: "sangrado",
    titulo: "Me corté / tengo una herida que sangra",
    sintomas: ["corte", "herida", "sangre", "sangra", "sangrado", "hemorragia", "cortar", "tajo"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Sangra a chorros o por pulsos, o no lográs frenarlo haciendo presión?",
        opciones: [{ texto: "Sí", ir: "grave" }, { texto: "No", ir: "q2" }] },
      q2: { pregunta: "¿La herida es profunda o grande, o se ve grasa/músculo/hueso?",
        opciones: [{ texto: "Sí", ir: "moderado" }, { texto: "No, es superficial", ir: "leve" }] },
      grave: { resultado: { nivel: "alta", titulo: "Hemorragia importante", pasos: [
        "Presión DIRECTA, fuerte y constante con gasa o paño limpio. No la levantes para mirar: mantené la presión.",
        "Si la gasa se empapa, poné otra ENCIMA (no quites la primera) y seguí presionando.",
        "Herida profunda en brazo/pierna/ingle/axila que no para con presión: RELLENÁ la herida apretando gasa (o gasa hemostática si tenés) bien adentro, contra el punto que sangra, y seguí presionando fuerte encima.",
        "Elevá la zona por encima del corazón si es brazo o pierna y no hay fractura.",
        "Si es un brazo/pierna, el sangrado no para y peligra la vida: torniquete varios cm por encima de la herida, apretá hasta que pare, y ANOTÁ la hora. No lo aflojes.",
        "Pedí rescate urgente." ],
        cuandoBajar: "Siempre que uses torniquete o no controles el sangrado: evacuación urgente." } },
      moderado: { resultado: { nivel: "media", titulo: "Herida profunda/grande", pasos: [
        "Lavá las manos o poné guantes. Hacé presión hasta frenar el sangrado.",
        "Limpiá suave con agua limpia o suero, sacá tierra/restos. Antiséptico.",
        "Cubrí con gasa estéril y vendá. Puede necesitar puntos.",
        "Vigilá infección los días siguientes: enrojecimiento, calor, pus, fiebre." ],
        cuandoBajar: "Herida profunda/extensa, mordedura, o signos de infección: consultá médico." } },
      leve: { resultado: { nivel: "baja", titulo: "Herida superficial", pasos: [
        "Lavá con agua limpia o suero. Aplicá antiséptico.",
        "Cubrí con gasa o curita. Cambiá el apósito si se moja o ensucia.",
        "Vigilá signos de infección los días siguientes." ],
        cuandoBajar: "Si se infecta o no cierra, consultá." } }
    }
  },
  {
    id: "cabeza",
    titulo: "Me golpeé la cabeza",
    sintomas: ["cabeza", "golpe", "craneo", "cráneo", "caida", "caída", "conmocion", "conmoción", "cabezazo"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Estuvo inconsciente, está confundido, vomitó, convulsionó o no recuerda el golpe?",
        opciones: [{ texto: "Sí (alguna)", ir: "grave" }, { texto: "No", ir: "q2" }] },
      q2: { pregunta: "¿Dolor de cabeza fuerte que crece, ve doble, sale líquido/sangre por nariz u oído, o mucho sueño raro?",
        opciones: [{ texto: "Sí", ir: "grave" }, { texto: "No", ir: "leve" }] },
      grave: { resultado: { nivel: "alta", titulo: "Golpe de cabeza con señales de alarma", pasos: [
        "No lo dejes solo. Mantenelo quieto y tranquilo.",
        "Si está inconsciente pero respira, ponelo de costado (posición de recuperación).",
        "NO le des de comer ni beber (por si necesita cirugía).",
        "Pedí rescate urgente." ],
        cuandoBajar: "Cualquiera de estas señales = emergencia. Evacuar ya." } },
      leve: { resultado: { nivel: "media", titulo: "Golpe leve — vigilar", pasos: [
        "Reposo. Frío en el chichón (envuelto).",
        "Vigilalo 24-48 h. La primera noche, despertalo cada par de horas para ver que responde bien.",
        "Ante cualquier señal de alarma (vómitos, confusión, somnolencia, dolor creciente, ver doble): tratalo como grave y bajá." ],
        cuandoBajar: "Si aparece cualquier señal de alarma, evacuá." } }
    }
  },
  {
    id: "alergia",
    titulo: "Reacción alérgica / picadura",
    sintomas: ["alergia", "alergica", "alérgica", "picadura", "picó", "abeja", "ronchas", "hinchazon", "hinchazón", "anafilaxia", "veneno", "me hinche", "me hinche entero", "me llene de ronchas", "reaccion alergica", "me pico una abeja y me hinche", "se me hincho la cara"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Le cuesta respirar, se hincha lengua/garganta/cara, está por desmayarse, o ronchas por todo el cuerpo?",
        opciones: [{ texto: "Sí (alguna)", ir: "grave" }, { texto: "No", ir: "leve" }] },
      grave: { resultado: { nivel: "alta", titulo: "Reacción grave (anafilaxia)", pasos: [
        "USÁ LA ADRENALINA del botiquín YA, en la cara lateral del muslo, según la indicación validada por tu médico.",
        "Recostalo con las piernas elevadas. Si le cuesta respirar, mejor semisentado. NO lo pongas de pie ni lo sientes de golpe: el cambio brusco a vertical puede ser mortal.",
        "Antihistamínico DESPUÉS de la adrenalina, nunca en lugar de.",
        "Si no mejora en unos minutos, repetí la adrenalina (hace falta una segunda dosis hasta en 1 de cada 5 casos).",
        "Pedí rescate URGENTE siempre, aunque mejore." ],
        cuandoBajar: "Siempre. La anafilaxia es una emergencia: rescate de inmediato." } },
      leve: { resultado: { nivel: "baja", titulo: "Reacción leve", pasos: [
        "Alejate de lo que la causó. Si hay aguijón, sacalo raspando (no apretar).",
        "Frío en la zona. Antihistamínico si está en tu botiquín y validado.",
        "Vigilá: si empieza dificultad para respirar o hinchazón de cara/garganta, tratalo como anafilaxia y usá adrenalina." ],
        cuandoBajar: "Si aparece dificultad para respirar o hinchazón: emergencia." } }
    }
  },
  {
    id: "frio",
    titulo: "Frío extremo / no entra en calor",
    sintomas: ["frio", "frío", "hipotermia", "congelacion", "congelación", "tiritar", "temblar", "helado", "nieve", "dedos blancos", "no siento las manos", "no siento los dedos", "no siento el pie", "no siento los pies", "no siento la mano", "manos", "dedos", "hormigueo", "entumecido", "entumecidas", "manos dormidas", "dedos dormidos", "sin sensibilidad", "estoy helado", "estoy congelado", "congelado", "me estoy congelando", "muerto de frio", "dedo negro", "dedos negros", "se me puso negro el dedo", "dedos morados", "tengo los dedos morados", "se me congelaron los dedos"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Está confundido, habla raro, deja de tiritar, se adormece o camina como borracho?",
        opciones: [{ texto: "Sí", ir: "grave" }, { texto: "No", ir: "q2" }] },
      q2: { pregunta: "¿Hay dedos, nariz u orejas blancos, duros o sin sensibilidad?",
        opciones: [{ texto: "Sí (congelación)", ir: "congelacion" }, { texto: "No", ir: "leve" }] },
      grave: { resultado: { nivel: "alta", titulo: "Hipotermia (grave)", pasos: [
        "Movelo con MUCHA suavidad y mantenelo ACOSTADO y quieto: no lo hagas caminar ni mover brazos/piernas (el movimiento manda sangre fría al corazón y puede pararlo). Sacalo del viento.",
        "Aislalo del SUELO (mochila, ramas, aislante): el suelo le roba el calor. Quitá ropa mojada, poné ropa seca y abrigá todo, incluida la cabeza y el cuello.",
        "Manta térmica con el lado plateado hacia el cuerpo.",
        "Si está bien despierto y traga sin problema, bebida tibia y azucarada. NUNCA alcohol (enfría más y es un factor de riesgo, no un remedio).",
        "Pedí rescate urgente." ],
        cuandoBajar: "Confusión, deja de tiritar o se adormece: emergencia, evacuar." } },
      congelacion: { resultado: { nivel: "media", titulo: "Congelación", pasos: [
        "NO frotar ni dar masajes, y NO aplicar nieve ni hielo en la zona (es un mito y daña más el tejido).",
        "Recalentá en agua TIBIA, 37-39°C (apenas soportable, como para bañar un bebé — NO caliente), unos 30 min, hasta que la zona se ponga blanda y rosada. Si no hay agua, calor corporal (manos bajo las axilas).",
        "No recalientes si hay riesgo de que se vuelva a congelar: es peor descongelar y recongelar. En ese caso, mejor mantenerla congelada hasta llegar a un lugar donde no se recongele.",
        "No revientes ampollas (menos las de sangre). Quitá anillos/cosas ajustadas. Protegé con gasa. Un ibuprofeno ayuda contra el daño del tejido (dosis ⚠️ VALIDAR)." ],
        cuandoBajar: "Zonas que no recuperan color/sensibilidad, ampollas o piel negra: atención médica." } },
      leve: { resultado: { nivel: "baja", titulo: "Frío — todavía leve", pasos: [
        "Resguardate del viento y del frío. Ropa seca y abrigo, cabeza cubierta.",
        "Bebida tibia y moverte para generar calor.",
        "Vigilá que no avance a confusión o pérdida de tiriteo." ],
        cuandoBajar: "Si aparece confusión o deja de tiritar, tratá como hipotermia." } }
    }
  },
  {
    id: "altura",
    titulo: "Mal de altura / soroche",
    sintomas: ["altura", "soroche", "mam", "puna", "edema", "mal de montaña", "falta de aire", "me falta el aire"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Falta de aire en reposo, tos con espuma, camina como borracho, muy confundido o con mucho sueño?",
        opciones: [{ texto: "Sí (alguna)", ir: "grave" }, { texto: "No", ir: "q2" }] },
      q2: { pregunta: "¿Dolor de cabeza + náuseas/mareo/cansancio que no mejora con el descanso?",
        opciones: [{ texto: "Sí", ir: "moderado" }, { texto: "No", ir: "leve" }] },
      grave: { resultado: { nivel: "alta", titulo: "Señales de edema (grave)", pasos: [
        "DESCENDER YA: bajar es el tratamiento más importante. No sigas subiendo por ningún motivo.",
        "Oxígeno si hay. Medicación solo la validada por tu médico.",
        "Pedí rescate." ],
        cuandoBajar: "Cualquier señal de edema (pulmonar o cerebral): descender y rescate ya." } },
      moderado: { resultado: { nivel: "media", titulo: "Mal de altura", pasos: [
        "No subas más. Descansá e hidratate bien.",
        "Medicación solo la validada por tu médico.",
        "Si no mejora o empeora, descendé." ],
        cuandoBajar: "Si empeora o aparece falta de aire en reposo/confusión: descender y pedir ayuda." } },
      leve: { resultado: { nivel: "baja", titulo: "Síntomas leves de altura", pasos: [
        "Descansá, hidratate, no subas hasta sentirte bien.",
        "Vigilá las señales de alarma (falta de aire en reposo, confusión, caminar raro)." ],
        cuandoBajar: "Si aparecen señales de alarma, descender." } }
    }
  },
  {
    id: "quemadura",
    titulo: "Me quemé",
    sintomas: ["quemadura", "quemar", "quemado", "fuego", "agua caliente", "me queme", "quemadura profunda"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Es más grande que tu palma, está en cara/manos/genitales/articulación, o se ve blanca/negra/muy profunda?",
        opciones: [{ texto: "Sí", ir: "grave" }, { texto: "No", ir: "q2" }] },
      q2: { pregunta: "¿Hay ampollas?",
        opciones: [{ texto: "Sí", ir: "moderado" }, { texto: "No", ir: "leve" }] },
      grave: { resultado: { nivel: "alta", titulo: "Quemadura grande o profunda", pasos: [
        "Enfriá con agua FRESCA corriente (no helada) 10-20 min. NO uses hielo: empeora la quemadura.",
        "No revientes ampollas. Cubrí con gasa estéril sin apretar.",
        "Quitá anillos/ropa que NO esté pegada a la piel. Hidratá a la persona.",
        "Evacuá." ],
        cuandoBajar: "Quemaduras grandes/profundas o en zonas delicadas: atención médica." } },
      moderado: { resultado: { nivel: "media", titulo: "Quemadura con ampollas", pasos: [
        "Enfriá con agua fresca corriente (no helada) 10-20 min. No revientes las ampollas.",
        "Cubrí con gasa estéril sin apretar. No apliques cremas/pasta/grasa.",
        "Vigilá infección." ],
        cuandoBajar: "Si se infecta o es extensa, consultá." } },
      leve: { resultado: { nivel: "baja", titulo: "Quemadura leve", pasos: [
        "Enfriá con agua fresca corriente (no helada) 10-20 min.",
        "Cubrí si hace falta. No apliques cremas/pasta dental/grasa.",
        "Hidratate (el sol y la altura deshidratan)." ],
        cuandoBajar: "Si aparecen muchas ampollas o dolor que no cede, consultá." } }
    }
  },
  {
    id: "inconsciente",
    titulo: "Alguien se desmayó / no responde",
    sintomas: ["desmayo", "desmayado", "inconsciente", "no responde", "no despierta", "no respira", "respira", "rcp", "ahogado", "se desmayo", "se desplomo", "desplomo", "perdio el conocimiento", "se desvanecio", "desvanecido", "esta inconsciente", "no reacciona"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Respira? (mirá el pecho, escuchá y sentí el aire durante 10 segundos)",
        opciones: [{ texto: "Sí, respira", ir: "respira" }, { texto: "No / no estoy seguro", ir: "rcp" }] },
      rcp: { resultado: { nivel: "alta", titulo: "No respira — RCP", pasos: [
        "Pedí rescate YA (gritá por ayuda / llamá si tenés señal).",
        "Si sabés RCP: compresiones fuertes y rápidas en el centro del pecho, unas 100-120 por minuto, hundiendo ~5 cm.",
        "No pares hasta que llegue ayuda, la persona respire, o no puedas más.",
        "Si hay desfibrilador (DEA), usalo siguiendo las instrucciones de voz." ],
        cuandoBajar: "Emergencia máxima: rescate inmediato." } },
      respira: { resultado: { nivel: "media", titulo: "Respira pero no responde", pasos: [
        "Ponelo de costado (posición de recuperación) para que no se ahogue.",
        "Abrigalo y no lo dejes solo. Controlá que siga respirando.",
        "Pensá la causa: golpe, frío, falta de azúcar, alergia, altura — y actuá según eso.",
        "Pedí ayuda." ],
        cuandoBajar: "Si deja de respirar: empezá RCP. Evacuar igual." } }
    }
  },
  {
    id: "pecho",
    titulo: "Dolor de pecho fuerte / falta de aire repentina",
    sintomas: ["pecho", "corazon", "corazón", "infarto", "ahogo", "falta de aire", "respirar", "opresion", "opresión", "me duele el pecho", "dolor en el pecho", "opresion en el pecho", "se me aprieta el pecho", "palpitaciones"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Dolor opresivo en el pecho que dura, se corre al brazo/mandíbula, con sudor frío o falta de aire?",
        opciones: [{ texto: "Sí", ir: "grave" }, { texto: "No", ir: "leve" }] },
      grave: { resultado: { nivel: "alta", titulo: "Posible problema cardíaco", pasos: [
        "Pará todo esfuerzo. Sentalo cómodo y aflojá la ropa.",
        "Si tiene medicación cardíaca propia, ayudalo a tomarla.",
        "Pedí rescate urgente.",
        "Si deja de responder y no respira: empezá RCP." ],
        cuandoBajar: "Emergencia: rescate inmediato." } },
      leve: { resultado: { nivel: "media", titulo: "Molestia leve / falta de aire", pasos: [
        "Descansá, respirá tranquilo, hidratate.",
        "Puede ser cansancio o altura: no sigas subiendo.",
        "Si no cede, se repite o empeora, bajá y consultá." ],
        cuandoBajar: "Si el dolor es fuerte/opresivo o cuesta respirar en reposo: emergencia." } }
    }
  },
  {
    id: "atragantamiento",
    titulo: "Me atraganté / alguien se ahoga con comida",
    sintomas: ["atragantado", "atragante", "me atragante", "ahogando con comida", "se ahoga", "atragantamiento", "se atoro", "atorado", "se ahoga con comida"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Puede toser, hablar o respirar?",
        opciones: [{ texto: "Sí, tose o habla", ir: "leve" }, { texto: "No / se pone morado", ir: "q2" }] },
      q2: { pregunta: "¿Sigue consciente?",
        opciones: [{ texto: "Sí, consciente", ir: "heimlich" }, { texto: "No, se desmayó", ir: "rcp" }] },
      leve: { resultado: { nivel: "media", titulo: "Obstrucción leve", pasos: [
        "Animalo a TOSER fuerte: la tos es lo que mejor saca el objeto.",
        "No le pegues en la espalda mientras pueda toser bien.",
        "Quedate al lado, vigilando, hasta que lo expulse." ],
        cuandoBajar: "Si deja de poder toser o respirar, pasá a las maniobras y pedí ayuda." } },
      heimlich: { resultado: { nivel: "alta", titulo: "Atragantamiento (consciente)", pasos: [
        "Pedí ayuda a gritos.",
        "Dale 5 palmadas firmes entre los omóplatos, inclinándolo hacia adelante.",
        "Si no sale: maniobra de Heimlich — abrazalo por detrás, un puño sobre el ombligo, y 5 compresiones hacia adentro y arriba.",
        "Alterná 5 palmadas y 5 compresiones hasta que salga o deje de responder." ],
        cuandoBajar: "Emergencia: pedí rescate ya. Si se desmaya, empezá RCP." } },
      rcp: { resultado: { nivel: "alta", titulo: "Se desmayó atragantado", pasos: [
        "Bajalo al suelo con cuidado y pedí rescate YA.",
        "Empezá RCP: compresiones fuertes en el centro del pecho (100-120 por minuto).",
        "Antes de cada soplo, mirá la boca y sacá el objeto SOLO si lo ves.",
        "Seguí hasta que respire o llegue ayuda." ],
        cuandoBajar: "Emergencia máxima." } }
    }
  },
  {
    id: "mordedura",
    titulo: "Me mordió un animal / una víbora",
    sintomas: ["mordedura", "me mordio", "mordida", "vibora", "víbora", "serpiente", "perro", "animal", "araña", "arana", "alacran", "alacrán", "escorpion", "me pico una araña"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Fue una víbora/serpiente o un bicho venenoso (araña, alacrán)?",
        opciones: [{ texto: "Sí (víbora / veneno)", ir: "vibora" }, { texto: "No (perro u otro animal)", ir: "animal" }] },
      vibora: { resultado: { nivel: "alta", titulo: "Mordedura/picadura venenosa", pasos: [
        "Quedate lo más quieto posible y mantené la zona POR DEBAJO del nivel del corazón.",
        "NO cortes, NO chupes, NO pongas torniquete, NO hielo.",
        "Sacá anillos, reloj y ropa ajustada (la zona se hincha).",
        "Limpiá suave con agua, cubrí, y anotá la hora y cómo era el animal.",
        "Pedí rescate URGENTE y evacuá sin hacer esfuerzo." ],
        cuandoBajar: "Siempre: emergencia, puede necesitar antiveneno." } },
      animal: { resultado: { nivel: "media", titulo: "Mordedura de animal", pasos: [
        "Lavá la herida con abundante agua y jabón varios minutos.",
        "Controlá el sangrado con presión y cubrí con gasa.",
        "Aplicá antiséptico: las mordeduras se infectan fácil.",
        "Averiguá si el animal estaba vacunado (rabia)." ],
        cuandoBajar: "Mordedura profunda, en cara/manos, que sangra mucho, o animal salvaje/desconocido: consultá (rabia, tétanos, antibiótico)." } }
    }
  },
  {
    id: "convulsion",
    titulo: "Alguien está convulsionando (ataque)",
    sintomas: ["convulsion", "convulsión", "convulsionando", "ataque", "epilepsia", "convulsiona", "esta temblando todo", "le agarro un ataque"],
    inicio: "r",
    nodos: {
      r: { resultado: { nivel: "alta", titulo: "Convulsión", pasos: [
        "NO lo sujetes ni le metas nada en la boca.",
        "Despejá alrededor para que no se golpee; poné algo blando bajo la cabeza.",
        "Cuando pare, ponelo de costado (posición de recuperación).",
        "Tomá el tiempo que dura y quedate hasta que despierte del todo." ],
        cuandoBajar: "Dura más de 5 min, se repite, no despierta, es la primera vez, o fue en el agua o con un golpe: emergencia." } }
    }
  },
  {
    id: "panico",
    titulo: "Ataque de pánico / no puedo respirar de los nervios",
    sintomas: ["panico", "pánico", "ansiedad", "ataque de panico", "hiperventilo", "no puedo respirar de los nervios", "angustia", "me agito", "crisis de nervios"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Apareció de golpe con miedo/nervios, y NO hay golpe, alergia ni asma de por medio?",
        opciones: [{ texto: "Sí, fue de los nervios", ir: "panico" }, { texto: "No estoy seguro", ir: "descartar" }] },
      panico: { resultado: { nivel: "baja", titulo: "Crisis de ansiedad", pasos: [
        "Buscá un lugar tranquilo. Recordá: pasa, no es peligroso.",
        "Respirá lento: inhalá 4 segundos, sostené 4, exhalá 6. Repetí.",
        "Aflojá los hombros, apoyá los pies en el piso, nombrá 5 cosas que ves.",
        "Acompañá a la persona con calma." ],
        cuandoBajar: "Si hay dolor de pecho real, se desmaya, o no mejora en un rato: tratalo como problema de corazón/respiratorio y pedí ayuda." } },
      descartar: { resultado: { nivel: "media", titulo: "Mejor descartá algo físico", pasos: [
        "Si hay falta de aire con silbido: puede ser asma, usá el inhalador.",
        "Si hay dolor de pecho opresivo o sudor frío: posible problema de corazón, pedí ayuda.",
        "Si nada de eso, tratalo como crisis de ansiedad: respiración lenta y calma." ],
        cuandoBajar: "Dolor de pecho, desmayo o falta de aire que no cede: emergencia." } }
    }
  }
];

/* --------------------------------------------------------------------------
   CONSEJOS — síntomas comunes para responder tipo chat (no emergencia grave).
   El asistente los usa para contestar conversando y sugerir qué del botiquín.
   ⚠️ Consejos generales, a validar por el médico.
   -------------------------------------------------------------------------- */
const CONSEJOS = [
  { id: "dolor-cabeza", sintomas: ["dolor de cabeza", "cabeza", "jaqueca", "migraña", "cefalea", "me duele la cabeza", "me parte la cabeza", "me estalla la cabeza", "cabeza me estalla", "dolor de cabeza fuerte", "me esta matando la cabeza", "me duele mucho la cabeza", "tengo la cabeza que estalla"],
    puedeSer: "Lo más común es deshidratación, cansancio, hambre, poco sueño o tensión. En la montaña, también puede ser la altura (soroche). Si hubo un golpe antes, mirá 'golpe en la cabeza'.",
    mensaje: "Tomá agua (la deshidratación y la altura dan dolor de cabeza), descansá un rato a la sombra y aflojá el ritmo. Si no cede, del botiquín podés usar un analgésico.",
    items: ["paracetamol", "ibuprofeno"],
    cuandoConsultar: "Si es el peor dolor de tu vida, viene con vómitos, confusión o fiebre alta, o estás en altura con falta de aire/mareo: tratalo como golpe en la cabeza o mal de altura y pedí ayuda." },
  { id: "fiebre", sintomas: ["fiebre", "temperatura", "calentura", "destemplado", "tengo fiebre", "afiebrado", "afiebrada", "estoy afiebrado", "tengo temperatura", "hirviendo de fiebre", "estoy hirviendo", "tengo el cuerpo caliente", "cuerpo caliente", "estoy volando en fiebre", "ando con fiebre"],
    puedeSer: "Casi siempre es una infección y el cuerpo sube la temperatura para defenderse: resfrío o gripe, infección de garganta, de orina o del estómago. Sola no dice cuál: fijate qué otra cosa sentís (tos, ardor al orinar, diarrea, dolor de garganta).",
    mensaje: "Hidratate bien, descansá y no te abrigues de más. Del botiquín, un antitérmico ayuda a bajar la fiebre.",
    items: ["paracetamol", "ibuprofeno"],
    cuandoConsultar: "Fiebre alta que no baja, con rigidez de nuca, confusión, dificultad para respirar, o que dura varios días: consultá / bajá." },
  { id: "panza", sintomas: ["panza", "estomago", "estómago", "dolor abdominal", "barriga", "acidez", "me duele la panza", "dolor de barriga"],
    puedeSer: "Suele ser indigestión, gases, algo que te cayó mal, acidez o nervios. Si el dolor es muy fuerte y abajo a la derecha, ojo con la apendicitis; si fue tras un golpe fuerte, mirá 'golpe en la panza'.",
    mensaje: "Tomá líquidos de a sorbos, comé liviano y evitá grasas y alcohol. Si es acidez o ardor, un protector gástrico ayuda.",
    items: ["protector gastrico", "antiemetico"],
    cuandoConsultar: "Dolor muy fuerte que no afloja, con fiebre, vómitos con sangre, o panza dura: puede ser serio, pedí ayuda." },
  { id: "nauseas", sintomas: ["nausea", "náuseas", "ganas de vomitar", "vomito", "vómito", "descompuesto", "asco", "siento nauseas", "arcadas", "arcada", "quiero vomitar", "ganas de devolver", "tengo nauseas"],
    puedeSer: "Puede ser algo que comiste, mareo por movimiento (auto/bus), dolor de cabeza, o en altura el soroche. Si viene con diarrea, suele ser una infección del estómago.",
    mensaje: "Sentate o recostate, buscá aire fresco y tomá sorbos de agua o suero. Del botiquín, un antiemético corta las náuseas.",
    items: ["antiemetico", "sales de rehidratacion"],
    cuandoConsultar: "Vómitos que no paran, con sangre o deshidratación; o en altura con dolor de cabeza: podría ser soroche, descendé." },
  { id: "diarrea", sintomas: ["diarrea", "suelto", "descompostura", "caca liquida", "estoy flojo", "cagadera", "ando suelto", "flojo del estomago", "estoy flojo del estomago", "me cago", "ando con cagadera", "tengo el estomago suelto", "ando descompuesto del estomago", "descompuesto del estomago"],
    puedeSer: "Casi siempre es algo que comiste o tomaste (agua no segura) o un virus estomacal. Lo importante no es cortarla a toda costa, sino no deshidratarte.",
    mensaje: "Lo más importante es hidratar: suero oral o agua a sorbos seguidos. Comé liviano (arroz, banana). Un antidiarreico ayuda si no hay fiebre ni sangre.",
    items: ["sales de rehidratacion", "antidiarreico"],
    cuandoConsultar: "Diarrea con sangre, fiebre alta, o señales de deshidratación (boca seca, casi no orinás, muy débil): consultá." },
  { id: "mareo", sintomas: ["mareo", "mareado", "vahido", "todo da vueltas", "me mareo", "ando mareado", "siento que todo gira", "todo gira", "tengo mareos", "siento que me voy de lado"],
    puedeSer: "Bajón de presión, deshidratación, hambre (azúcar baja), cansancio o la altura. Si sentís que TODO gira (vértigo), suele ser del oído.",
    mensaje: "Sentate o agachate para no caerte, tomá agua y algo con azúcar. En altura, el mareo puede ser mal de montaña.",
    items: ["sales de rehidratacion"],
    cuandoConsultar: "Si te desmayaste, ves o hablás raro, o en altura con falta de aire: pedí ayuda." },
  { id: "deshidratacion", sintomas: ["deshidratado", "deshidratacion", "sed", "boca seca", "no orino", "estoy seco"],
    puedeSer: "Perdiste más líquido del que tomaste: sol, esfuerzo, altura, vómitos o diarrea. El cuerpo te avisa con sed, boca seca, orina oscura y cansancio.",
    mensaje: "Ponete a la sombra, descansá y tomá suero oral o agua de a poco y seguido. Evitá el esfuerzo hasta recuperarte.",
    items: ["sales de rehidratacion"],
    cuandoConsultar: "Confusión, no orinás, muy débil o desmayo: es grave, pedí ayuda." },
  { id: "ampolla", sintomas: ["ampolla", "rozadura", "me lastime el pie", "talon", "roce", "me ampolle", "rozadura en el pie", "ampollas en los pies", "me roza el zapato"],
    mensaje: "No la revientes. Limpiá la zona y cubrila con un apósito o tela para que no roce. Si ya se reventó, limpiá con antiséptico y cubrí.",
    items: ["curitas", "antiseptico", "tela adhesiva"],
    cuandoConsultar: "Si se infecta (roja, caliente, con pus), consultá." },
  { id: "insolacion", sintomas: ["insolacion", "golpe de calor", "mucho calor", "acalorado", "me insole", "me pegue el sol", "mucho sol", "estoy muy acalorado", "tengo golpe de calor"],
    mensaje: "Salí del sol a la sombra, aflojá la ropa, mojá la piel con agua y abanicá, y tomá líquidos. Descansá.",
    items: ["sales de rehidratacion"],
    cuandoConsultar: "Piel caliente y seca, confusión, deja de sudar o desmayo: golpe de calor grave, enfriá rápido y pedí rescate." },
  { id: "dolor-muscular", sintomas: ["dolor muscular", "agujetas", "cansancio", "contractura", "me duele el cuerpo", "musculo", "me duele todo", "me duele todo el cuerpo", "dolor de espalda", "me duele la espalda", "estoy molido", "me duele el trasero", "trasero", "traste", "cola", "gluteo", "glúteo", "nalga", "nalgas", "espalda", "espalda baja", "cintura", "lomo", "rinones", "riñones", "hombro", "hombros", "brazo", "brazos", "antebrazo", "codo", "codos", "muñeca", "mano", "manos", "dedo", "dedos", "cadera", "muslo", "pierna", "piernas", "pantorrilla", "gemelo", "pie", "pies", "cuello", "nuca", "costilla", "costillas", "espinilla", "ingle", "axila", "abdomen", "costado", "costados", "molesta", "me molesta", "me molestan", "todo el cuerpo", "todo", "articulaciones", "huesos", "las piernas", "los brazos"],
    puedeSer: "Lo más común tras un día duro: esfuerzo, caminata larga, mala postura con la mochila, frío o deshidratación. Suele mejorar con descanso.",
    mensaje: "Descansá, estirá suave e hidratate. Un antiinflamatorio del botiquín ayuda con el dolor.",
    items: ["ibuprofeno"],
    cuandoConsultar: "Dolor en el pecho, falta de aire, o una pierna hinchada y dolorida: no es muscular común, consultá." },
  { id: "resfrio", sintomas: ["resfrio", "resfriado", "tos", "mocos", "garganta", "gripe", "estoy resfriado", "estoy congestionado", "congestionado", "ando engripado", "engripado", "tengo la nariz tapada", "nariz tapada", "tengo gripe", "estoy con gripe"],
    puedeSer: "Casi siempre un virus común (resfrío o gripe). El aire frío y seco de la montaña lo empeora. Los antibióticos NO sirven para los virus.",
    mensaje: "Abrigate, hidratate y descansá. Para la fiebre o el malestar, un antitérmico ayuda.",
    items: ["paracetamol"],
    cuandoConsultar: "Falta de aire, fiebre alta que no baja, o dolor de pecho: consultá / bajá." },
  { id: "picadura", sintomas: ["picadura", "me pico", "insecto", "mosquito", "picazon", "picazón", "me pica", "me pico un mosquito", "me pico un bicho", "me picaron", "me pico un insecto", "bicho", "zancudo", "me pico un zancudo", "me pico un jejen", "me pico una hormiga"],
    puedeSer: "Casi siempre un mosquito, zancudo, jején, hormiga o abeja: molesta y pica pero no es grave. Ojo si fue araña de rincón o del trigo (mirá esos casos) o si te hinchás y cuesta respirar.",
    mensaje: "Lavá la zona y poné frío para la hinchazón. Si hay aguijón, sacalo raspando (no apretar). Un antihistamínico calma la picazón.",
    items: ["antihistaminico"],
    cuandoConsultar: "Si se hincha la cara/garganta, cuesta respirar o salen ronchas por todo el cuerpo: es alergia grave, usá adrenalina y pedí rescate." },
  { id: "quemadura-sol", sintomas: ["quemadura de sol", "me queme con el sol", "piel roja", "ardor sol", "quemado del sol"],
    mensaje: "Salí del sol, enfriá con agua, hidratá la piel y tomá líquidos. No revientes ampollas.",
    items: ["paracetamol"],
    cuandoConsultar: "Quemaduras con muchas ampollas, fiebre, o en zonas grandes: consultá." },
  { id: "sangrado-nariz", sintomas: ["sangra la nariz", "sangrado de nariz", "epistaxis", "me sangra la nariz", "sangre por la nariz", "hemorragia nasal"],
    mensaje: "Sentate e inclinate un poco hacia ADELANTE (no hacia atrás). Apretá la parte blanda de la nariz con dos dedos, sin soltar, 10 minutos seguidos, respirando por la boca. Frío en la nuca o el puente de la nariz ayuda.",
    items: ["gasas"],
    cuandoConsultar: "Si no para después de 20 min apretando, fue por un golpe fuerte, o sangra mucho y te sentís débil: pedí ayuda." },
  { id: "muela", sintomas: ["muela", "diente", "dolor de muela", "dolor de diente", "me duele la muela", "me duele el diente"],
    mensaje: "Enjuagá con agua tibia con sal, sacá restos de comida con cuidado y poné frío en la mejilla. Un analgésico ayuda con el dolor.",
    items: ["ibuprofeno", "paracetamol"],
    cuandoConsultar: "Hinchazón grande en la cara, fiebre, o dolor que no cede: necesitás un dentista/médico." },
  { id: "calambre", sintomas: ["calambre", "calambres", "se me acalambro", "pierna acalambrada", "me acalambre", "se me acalambro la pierna", "se me durmio la pierna", "tengo un calambre"],
    mensaje: "Pará, estirá suave el músculo y masajealo. Hidratate con agua y sales — los calambres suelen ser por esfuerzo, calor o falta de sales.",
    items: ["sales de rehidratacion"],
    cuandoConsultar: "Calambres muy seguidos con mucha debilidad o confusión: puede ser deshidratación seria." },
  { id: "hipoglucemia", sintomas: ["bajon de azucar", "azucar baja", "hipoglucemia", "tembloroso", "sudor frio", "me siento debil", "flojo y tembloroso", "hambre y mareo", "tengo hambre y mareo", "tengo un bajon de azucar", "ando tembloroso y con sudor frio"],
    mensaje: "Si estás tembloroso, con sudor frío, débil o con mucha hambre, puede ser el azúcar bajo. Sentate y tomá algo dulce YA (azúcar, jugo, caramelo, chocolate). A los 15 min comé algo más sólido.",
    items: [],
    cuandoConsultar: "Si te desmayás, no podés tragar, o no mejorás con el azúcar: emergencia, pedí ayuda." },
  { id: "ojo", sintomas: ["ojo", "algo en el ojo", "me entro algo al ojo", "ojo irritado", "ojo rojo", "basura en el ojo", "tierra en el ojo", "me arde el ojo", "me entro tierra al ojo", "tengo algo en el ojo"],
    mensaje: "No te refriegues. Lavá el ojo con abundante suero o agua limpia, del lagrimal hacia afuera, hasta sacar lo que tengas. Parpadeá bajo el agua.",
    items: ["colirio", "suero fisiologico"],
    cuandoConsultar: "Si algo quedó clavado, ves borroso o hay mucho dolor: no lo fuerces, tapá el ojo y consultá." },
  { id: "garganta", sintomas: ["garganta", "dolor de garganta", "me duele la garganta", "anginas", "faringitis", "me arde la garganta", "tengo anginas"],
    mensaje: "Hidratate con líquidos tibios, hacé gárgaras con agua tibia y sal, y descansá la voz. Un analgésico/antitérmico ayuda con el dolor y la fiebre.",
    items: ["paracetamol", "ibuprofeno"],
    cuandoConsultar: "Si te cuesta tragar o respirar, babeás, o hay fiebre alta que no baja: consultá." },
  { id: "oido", sintomas: ["oido", "oído", "dolor de oido", "me duele el oido", "otitis"],
    mensaje: "Calor suave sobre la oreja (paño tibio) y un analgésico para el dolor. No metas nada (ni hisopos ni agua) dentro del oído.",
    items: ["ibuprofeno", "paracetamol"],
    cuandoConsultar: "Fiebre alta, mucho dolor, o supura líquido/sangre: consultá médico." },
  { id: "astilla", sintomas: ["astilla", "espina", "me clave una astilla", "me clave una espina", "clavada", "se me clavo"],
    mensaje: "Lavá la zona y tus manos. Con una pinza desinfectada, sacá la astilla en el mismo ángulo en que entró. Lavá de nuevo y poné antiséptico.",
    items: ["pinza", "antiseptico", "curitas"],
    cuandoConsultar: "Si quedó muy adentro, no sale, o se infecta (rojo, hinchado, con pus): consultá." },
  { id: "que-tomar", sintomas: ["pastilla", "pastillas", "remedio", "remedios", "medicamento", "medicacion", "medicación", "analgesico", "analgésico", "calmante", "antiinflamatorio", "que tomo", "que pastilla", "que pastillas", "algo para el dolor", "dame algo", "necesito un remedio", "que me tomo", "antifebril", "que medicamento", "que remedio", "una pastilla"],
    mensaje: "Depende de qué tengas:\n• DOLOR o FIEBRE → Paracetamol o Ibuprofeno\n• ALERGIA / picazón → Antihistamínico\n• NÁUSEAS / vómitos → Antiemético\n• ACIDEZ / estómago → Protector gástrico\nDecime qué sentís y te paso la dosis para tu peso 👇",
    items: ["paracetamol", "ibuprofeno", "antihistaminico", "antiemetico"],
    cuandoConsultar: "No mezcles medicamentos sin saber, ni pases la dosis. Si el dolor es fuerte y no cede, o no sabés qué tomar: consultá." },
  { id: "malestar", sintomas: ["me siento mal", "no me siento bien", "estoy mal", "me siento descompuesto", "me siento raro", "no ando bien", "me siento pa la caga", "estoy achacado", "estoy hecho mierda", "me siento para atras", "ando para atras", "ando como las pelotas", "no doy mas", "estoy hecho pebre", "me siento flojo", "ando mal", "me siento mal en general"],
    mensaje: "Contame un poco más así te ayudo mejor 🙏 ¿Qué sentís?\n• ¿Te duele algo? (cabeza, panza, garganta…)\n• ¿Fiebre, náuseas o mareo?\n• ¿Frío, falta de aire?\nTocá una opción o escribilo.",
    items: [],
    cuandoConsultar: "Si tenés dolor de pecho, te cuesta respirar, estás confundido o muy débil: pedí ayuda ya." },
  { id: "resaca", sintomas: ["resaca", "caña", "estoy curado", "cruda", "goma", "tome mucho", "tomé mucho", "chuchaqui", "estoy crudo", "guayabo", "tengo caña", "tengo cruda", "estoy con resaca", "ando mal del trago"],
    mensaje: "Hidratate bien (agua y sales), comé algo liviano y descansá. Un analgésico ayuda con el dolor de cabeza. Evitá más alcohol.",
    items: ["sales de rehidratacion", "paracetamol", "ibuprofeno"],
    cuandoConsultar: "Vómitos que no paran, confusión, o no podés despertar bien a alguien: puede ser intoxicación, pedí ayuda." },
  // --- específicos de montaña / nieve ---
  { id: "ceguera-nieve", sintomas: ["ceguera de nieve", "no veo bien por la nieve", "me arden los ojos por el sol", "ojos rojos por la nieve", "vista nublada por el sol", "queratitis", "me lloran los ojos por el sol", "no veo bien despues de la nieve", "ojos quemados por la nieve", "siento arena en los ojos", "ojos irritados por el reflejo"],
    mensaje: "Suena a ceguera de nieve (los ojos se queman con el reflejo del sol en la nieve). Tapate los ojos y quedate en un lugar OSCURO; no te los refriegues. Paños fríos sobre los párpados cerrados y un analgésico ayudan. Suele mejorar solo en 1-2 días. De acá en más, NO salgas sin antiparras/lentes con filtro UV.",
    items: ["paracetamol", "ibuprofeno"],
    cuandoConsultar: "Si el dolor es muy intenso, no mejora en 2 días, o perdés visión: necesitás un médico." },
  { id: "labios-piel", sintomas: ["labios partidos", "labios agrietados", "se me partieron los labios", "tengo los labios secos", "piel agrietada", "piel reseca", "se me agrieto la piel", "tengo la cara quemada por el viento", "piel partida por el frio"],
    mensaje: "El frío, el viento y la altura resecan. Hidratá la piel y los labios (bálsamo/vaselina o protector labial), tomá agua y cubrí la cara del viento. No te despegues la piel.",
    items: [],
    cuandoConsultar: "Si hay grietas profundas que sangran, se infectan (pus, mucho rojo) o duelen mucho: tratalo como herida y consultá." },
  { id: "defecar", sintomas: ["me duele al cagar", "me duele cuando voy al baño", "me duele al obrar", "me arde al cagar", "me arde el ano", "sangre al cagar", "sangrado al defecar", "hemorroides", "almorranas", "me duele el ano", "dolor al defecar", "me cuesta cagar", "estoy estreñido", "estreñimiento", "no puedo hacer caca", "llevo dias sin ir al baño", "me duele el poto al cagar", "me duele el poto", "me sale sangre al cagar", "ardor al defecar"],
    mensaje: "El dolor o ardor al defecar suele ser por hemorroides, una fisura o estreñimiento. Tomá MUCHA agua, comé fibra (fruta, verdura), no pujes fuerte y no te aguantes las ganas. Higiene suave (agua, sin papel áspero) y, si arde, frío local o un baño de asiento tibio. Un analgésico ayuda con el dolor.",
    items: ["ibuprofeno", "paracetamol"],
    cuandoConsultar: "Mucha sangre (no solo un hilito), sangre oscura/con coágulos, dolor fuerte que no cede, fiebre, o varios días sin poder ir al baño con la panza hinchada: consultá." },
  { id: "infeccion", sintomas: ["tengo pus", "sale pus", "herida con pus", "sale liquido amarillo", "sangre con amarillo", "me sale amarillo", "liquido amarillo", "se me infecto la herida", "herida infectada", "esta hinchado rojo y caliente", "supura", "me sale liquido de la herida", "la herida huele mal", "herida que huele feo", "se puso amarilla la herida", "pus amarillo"],
    mensaje: "Líquido amarillo o pus, mal olor, o una zona roja-caliente-hinchada apuntan a una infección. Lavá con agua limpia y jabón, desinfectá con antiséptico y cubrí con gasa limpia; cambiá el apósito a diario. NO la aprietes ni la cierres con fuerza. Si tenés, un antibiótico lo decide el médico.",
    items: ["antiseptico", "gasas"],
    cuandoConsultar: "Fiebre, líneas rojas que suben desde la herida, hinchazón que crece, mucho dolor o pus abundante: necesitás antibiótico/médico, no lo dejes." },
  { id: "orina", sintomas: ["quiero mear", "necesito mear", "quiero orinar", "ganas de orinar", "tengo ganas de orinar", "quiero hacer pis", "quiero hacer pipi", "quiero hacer pichi", "no puedo orinar", "no puedo hacer pis", "me cuesta orinar", "me arde al orinar", "me duele al orinar", "ardor al orinar", "me arde cuando meo", "me arde al mear", "sangre en la orina", "orino mucho", "orino poco", "voy mucho a orinar", "retencion de orina", "infeccion urinaria", "me aguanto las ganas de mear", "tengo ardor para orinar"],
    mensaje: "Si solo tenés ganas, andá al baño tranquilo y seguí tomando agua normal. Si te ARDE o DUELE al orinar, vas a cada rato, o la orina sale turbia o con olor fuerte, puede ser una infección urinaria: tomá bastante agua y, si tenés, el antibiótico lo indica el médico. Evitá aguantarte.",
    items: [],
    cuandoConsultar: "Si NO podés orinar nada en muchas horas y te duele el bajo vientre, hay fiebre con ardor al orinar, sangre abundante en la orina, o dolor fuerte en la espalda baja/costado (riñón): es urgente, consultá." },
  { id: "hipo", sintomas: ["tengo hipo", "hipo", "no se me quita el hipo", "tengo hipo y no para", "me dio hipo"],
    mensaje: "Probá tomar agua de a sorbos lentos, aguantar la respiración unos segundos, o respirar dentro de una bolsa un ratito. Casi siempre se va solo.",
    items: [],
    cuandoConsultar: "Si el hipo dura más de 2 días seguidos o no te deja comer ni dormir: consultá." },
  { id: "insomnio", sintomas: ["no puedo dormir", "no logro dormir", "no me puedo dormir", "tengo insomnio", "no pego un ojo", "me cuesta dormir", "no consigo dormir", "no duermo nada"],
    mensaje: "Aflojá: respirá lento y profundo, abrigate bien, evitá pantallas y mate/café. En altura es normal dormir mal los primeros días — si además te falta el aire acostado o te duele la cabeza, puede ser la altura.",
    items: [],
    cuandoConsultar: "Si no podés dormir por falta de aire al estar acostado, o te despertás ahogado: en montaña puede ser mal de altura, prestá atención y si empeora, descendé." },
  { id: "encias", sintomas: ["me sangran las encias", "sangran las encias", "encias inflamadas", "me sangra la encia", "tengo las encias hinchadas"],
    mensaje: "Enjuagá con agua tibia con sal y cepillá suave. Frío local baja la hinchazón. Suele ser irritación o falta de higiene; mejorá el cepillado.",
    items: ["ibuprofeno"],
    cuandoConsultar: "Sangrado abundante que no para, mucha hinchazón con fiebre, o sangrado también en otras partes del cuerpo: consultá." },
  { id: "raspon", sintomas: ["me raspe", "me raspe la rodilla", "raspon", "rasmillon", "me pele la rodilla", "me rasmille", "raspadura", "me raye la piel", "me raspe el brazo", "tengo un raspon", "me pele", "rozadura en la piel", "me raspe la pierna", "me raspon", "rasguno", "me rasguñe", "rasguño"],
    mensaje: "Es un raspón (herida superficial). Lavá con agua limpia o suero, sacá toda la tierra, desinfectá con antiséptico y dejá al aire o cubrí con gasa/curita si va a rozar con la ropa. No pongas algodón directo sobre la herida. Cambiá el apósito si se ensucia o moja.",
    items: ["antiseptico", "gasas", "curitas"],
    cuandoConsultar: "Si es muy grande o profundo, quedó tierra que no sale, se pone rojo-caliente con pus (infección) o no estás al día con la vacuna del tétanos: consultá." },
  { id: "caida-grave", sintomas: ["me cai de un barranco", "me cai de altura", "cai de un risco", "me despeñe", "cai de varios metros", "me precipite", "rode por la ladera", "cai rodando", "cai de un acantilado", "me cai muy fuerte de alto", "cai al vacio", "me cai de la montaña", "cai por un precipicio", "me cai de muy alto", "cai de una pared", "me cai escalando", "me cai del cerro"],
    mensaje: "Una caída así puede tener lesiones graves aunque no se vean. ⚠️ Si pudo golpearse la CABEZA, el CUELLO o la ESPALDA: NO lo muevas (riesgo de columna), salvo peligro inmediato de muerte. Revisá: ¿responde?, ¿respira? Controlá los sangrados con presión firme. Abrigalo con la manta térmica y NO le des de comer ni beber. Si un hueso quedó deformado o expuesto, NO lo acomodes: inmovilizá como está y cubrí. Pedí rescate cuanto antes.",
    items: ["manta termica", "torniquete", "ferula", "gasas"],
    cuandoConsultar: "Pérdida de conocimiento, no respira, vómitos, confusión, dolor de cuello/espalda, no mueve o no siente las piernas/brazos, sangrado que no para, o hueso deformado/expuesto: es URGENTE, pedí rescate YA y no lo muevas." },
  { id: "supervivencia", sintomas: ["cuantas calorias debo comer", "sobrevivir la noche", "como sobrevivir la noche", "aguantar la noche", "pasar la noche en la montaña", "sobrevivir el frio", "cuanto debo comer", "que como para aguantar", "sobrevivir en la nieve", "como no morir de frio", "aguantar el frio toda la noche", "como aguanto la noche", "calorias para sobrevivir", "pasar la noche al aire libre", "sobrevivir a la intemperie"],
    mensaje: "Para aguantar una noche de frío en la montaña lo MÁS importante no es comer mucho, sino CONSERVAR EL CALOR: aislate del suelo (mochila, ramas, lo que tengas), tapate con la manta térmica (lado plateado hacia el cuerpo), cubrí cabeza, cuello y manos, y achicá el espacio de aire a tu alrededor. Comé lo que tengas y que sea calórico (frutos secos, chocolate, barritas) para tener energía y generar calor, y tomá agua aunque no tengas sed. Movete de a ratos (contraé los músculos) para no enfriarte. NO tomes alcohol: enfría más.",
    items: ["manta termica"],
    cuandoConsultar: "Si alguien tirita sin parar y después deja de tiritar de golpe, se pone confundido, torpe o con mucho sueño: es hipotermia grave. Mantenelo abrigado, dale algo caliente y dulce si está consciente, y pedí rescate." },
  { id: "objeto-clavado", sintomas: ["me clave un palo", "se me clavo un palo", "me incruste el palo de ski", "me incruste el palo", "tengo algo clavado", "me atravieso un fierro", "me clave un fierro", "tengo un palo clavado", "se me incrusto", "me empale", "tengo algo enterrado en la pierna", "me clave una rama", "me atraveso un palo", "tengo un hierro clavado", "objeto clavado", "me clave el piolet", "se me clavo un fierro", "me clave un clavo grande", "tengo un fierro clavado", "me incruste algo"],
    mensaje: "⚠️ Si quedó un objeto clavado (palo, fierro, rama, piolet), NO lo saques: está taponando la herida y, si lo retirás, puede sangrar mucho más. Estabilizalo con gasas y vendas ALREDEDOR para que no se mueva, hacé presión al LADO de la herida (no encima del objeto) para controlar el sangrado, y mantené quieta la zona. Que lo retire un profesional en un lugar seguro.",
    items: ["gasas", "venda elastica", "torniquete"],
    cuandoConsultar: "Si sangra mucho, el objeto está clavado en el pecho, abdomen, cuello o cabeza, o la persona se descompensa: es URGENTE, rescate YA. No lo saques vos." },
  { id: "luxacion", sintomas: ["se me salio el hombro", "se me zafo el hombro", "se me disloco", "luxacion", "se me salio de lugar", "se me zafo la rodilla", "tengo el hombro fuera de lugar", "se me salio el brazo", "se me corrio el hueso", "se me disloco el hombro", "dislocacion", "se me salto el hombro", "tengo la articulacion fuera de lugar"],
    mensaje: "Parece una luxación (el hueso se salió de la articulación). NO intentes meterlo en su lugar a la fuerza. Inmovilizá el brazo o la pierna en la posición en que quedó (cabestrillo o férula), poné frío y tomá un analgésico. Buscá ayuda para acomodarlo.",
    items: ["ferula", "venda elastica", "ibuprofeno", "analgesico fuerte"],
    cuandoConsultar: "Si la zona se pone fría, pálida, azulada, o no sentís/movés más abajo: urgente. No fuerces el hueso." },
  { id: "avalancha", sintomas: ["me tapo una avalancha", "quede enterrado en la nieve", "me cubrio la nieve", "avalancha", "quede atrapado en la nieve", "me sepulto la nieve", "alud", "nos tapo un alud", "quede bajo la nieve", "me enterro la nieve"],
    mensaje: "Si alguien quedó bajo una avalancha: lo PRIMERO es liberar la cara y el pecho y despejar la vía aérea (sacar la nieve de boca y nariz) para que respire. Después abrigalo (manta térmica), tratá la hipotermia y revisá golpes o fracturas. Marcá la zona y pedí rescate de inmediato.",
    items: ["manta termica"],
    cuandoConsultar: "Si no respira o no responde: empezá RCP si sabés y pedí rescate YA. El tiempo bajo la nieve es crítico." },
  { id: "agua-fria", sintomas: ["me cai al agua", "me cai al rio", "me cai a un lago helado", "me cai al agua helada", "cai en agua fria", "me moje entero en el rio", "cai a una laguna", "me cai al rio helado", "me cai a un lago", "cai al agua fria"],
    mensaje: "Salí del agua YA y sacate la ropa mojada (mojado te enfriás muchísimo más rápido). Secate, abrigate con ropa seca y manta térmica, y entrá en calor de a poco. Movete suave. Ojo: el cuerpo se enfría rápido aunque no lo sientas todavía.",
    items: ["manta termica"],
    cuandoConsultar: "Si tirita sin parar y luego deja de tiritar, se confunde o le da mucho sueño: hipotermia grave, pedí rescate." },
  { id: "diente-golpe", sintomas: ["se me cayo un diente de un golpe", "se me salto un diente", "me rompi un diente", "perdi un diente por un golpe", "se me quebro un diente", "me golpee y se me cayo un diente", "se me salio un diente", "me saltaron un diente", "se me partio un diente"],
    mensaje: "Si se salió un diente entero por un golpe: agarralo de la corona (la parte blanca), NO de la raíz; enjuagalo suave sin frotar y, si podés, volvé a ponerlo en su lugar o guardalo en leche o en tu propia saliva. Andá a un dentista lo antes posible (las primeras horas cuentan). Para el dolor, un analgésico y frío.",
    items: ["ibuprofeno", "paracetamol", "gasas"],
    cuandoConsultar: "Sangrado de la boca que no para, o si el golpe en la cara/cabeza fue fuerte: revisá también la cabeza y consultá." },
  { id: "monoxido", sintomas: ["monoxido", "cocine en la carpa y me duele la cabeza", "me siento mal en la carpa cerrada", "intoxicacion por monoxido", "dolor de cabeza cocinando en la carpa", "mareo en la carpa cerrada", "use la estufa en la carpa y me siento mal", "dolor de cabeza en la carpa cerrada"],
    mensaje: "⚠️ Si cocinaste o usaste calentador/estufa en una carpa o refugio CERRADO y te dio dolor de cabeza, mareo o náuseas, puede ser monóxido de carbono (no se ve ni se huele): SALÍ al aire libre YA y ventilá todo. Nunca uses cocina o estufa a combustión dentro de un espacio cerrado.",
    items: [],
    cuandoConsultar: "Si alguien se desmaya, está muy confundido o no despierta: sacalo al aire libre de inmediato y pedí rescate." },
  { id: "acv", sintomas: ["se le tuerce la cara", "tiene la boca chueca", "no puede hablar", "habla raro", "no mueve un brazo", "no mueve un lado del cuerpo", "se le cayo la cara", "perdio fuerza en un lado", "cara torcida", "no puede levantar el brazo", "se le traba la lengua", "derrame cerebral", "acv", "se le durmio media cara", "no le sale hablar"],
    mensaje: "⚠️ Cara torcida, no poder hablar bien o no mover un lado del cuerpo son señales de ACV (derrame). Es una EMERGENCIA: fijate y anotá la HORA en que empezó, no le des de comer ni beber, recostalo de costado con la cabeza un poco elevada y pedí rescate URGENTE. Cada minuto cuenta.",
    items: [],
    cuandoConsultar: "Cualquiera de esas señales = rescate inmediato. No esperes a ver si se pasa: mientras antes lo atiendan, mejor." },
  { id: "asma", sintomas: ["ataque de asma", "soy asmatico y me falta el aire", "silbo al respirar", "tengo asma y me ahogo", "no puedo respirar y silbo", "me falta el aire y pita el pecho", "crisis de asma", "broncoespasmo", "me agarro el asma", "tengo asma y no puedo respirar"],
    mensaje: "Sentate derecho y tratá de calmarte. Usá el inhalador (salbutamol/Ventolin): unos 2 disparos, esperá unos minutos y repetí si hace falta según la indicación. Respirá lento, con los labios casi cerrados al soltar el aire. Alejate del humo, el polvo y el frío fuerte.",
    items: ["inhalador"],
    cuandoConsultar: "Si el inhalador no hace efecto, los labios o las uñas se ponen azules, no puede hablar de corrido o se agota: emergencia, rescate." },
  { id: "costilla", sintomas: ["me rompi una costilla", "me duele al respirar despues del golpe", "creo que me quebre una costilla", "me duele una costilla al respirar", "golpe en las costillas", "me fracture una costilla", "me pegue en las costillas", "me duele al respirar tras el golpe en el costado"],
    mensaje: "Una costilla golpeada o rota duele mucho al respirar y toser. NO te vendes el pecho apretado (empeora la respiración). Respirá normal aunque moleste, tomá un analgésico y aplicá frío sobre la zona. Evitá esfuerzos y cargar peso.",
    items: ["ibuprofeno", "analgesico fuerte"],
    cuandoConsultar: "Mucha falta de aire, dolor de pecho intenso, toser sangre, o si el golpe fue muy fuerte: puede haber daño en el pulmón, pedí rescate." },
  { id: "amputacion", sintomas: ["me corte un dedo entero", "se me corto el dedo", "me amputaron", "perdi un dedo", "me corte la punta del dedo", "me corte un dedo completo", "se me corto un dedo", "casi me corto el dedo", "me corte un pedazo de dedo", "amputacion"],
    mensaje: "⚠️ Si se cortó una parte (un dedo, etc.): primero controlá el sangrado con presión firme, o torniquete si es mucho. Guardá la parte cortada envuelta en gasa limpia y húmeda, dentro de una bolsa, y esa bolsa dentro de otra con agua y hielo (NO pongas la parte directo sobre el hielo). Llevala con la persona. Rescate urgente.",
    items: ["torniquete", "gasas", "manta termica"],
    cuandoConsultar: "Sangrado que no se frena o amputación grande: torniquete y rescate YA." },
  { id: "dedo-machucado", sintomas: ["me machuque el dedo", "me aplaste el dedo", "me pille el dedo con la puerta", "me golpee el dedo con el martillo", "me machuque la uña", "se me puso negra la uña", "me reviente el dedo", "me agarre el dedo", "me aplaste la uña", "tengo la uña morada de un golpe"],
    mensaje: "Machucón de dedo: poné frío (hielo en un paño, no directo) 15-20 minutos, mantené la mano en alto y tomá un analgésico. Si la uña quedó morada y duele por la presión de la sangre, un médico puede aliviarla; no te la arranques.",
    items: ["ibuprofeno", "paracetamol"],
    cuandoConsultar: "Si el dedo queda torcido, no lo podés mover o el dolor es insoportable: puede haber fractura, consultá." },
  { id: "garrapata", sintomas: ["tengo una garrapata", "se me pego una garrapata", "me pico una garrapata", "como saco una garrapata", "tengo un bicho pegado en la piel", "garrapata", "se me prendio una garrapata"],
    mensaje: "Sacá la garrapata con una pinza, agarrándola lo más cerca de la piel posible y tirando firme y derecho, sin retorcer ni aplastarla. Desinfectá después con antiséptico. No uses fuego, alcohol ni cremas para que se suelte. Guardala por si hay que mostrarla.",
    items: ["tijera y pinza", "antiseptico"],
    cuandoConsultar: "Si después aparece una mancha roja en forma de diana, fiebre o dolores en el cuerpo: consultá, algunas garrapatas transmiten enfermedades." },
  { id: "apendicitis", sintomas: ["dolor fuerte abajo a la derecha de la panza", "me duele mucho la parte baja derecha", "dolor de panza que no para y a la derecha", "creo que es apendicitis", "apendicitis", "dolor abdominal intenso a la derecha", "me duele abajo a la derecha y tengo fiebre"],
    mensaje: "Un dolor fuerte que se concentra ABAJO a la DERECHA de la panza, que va empeorando y viene con fiebre, náuseas o no poder caminar derecho, puede ser apendicitis u otra urgencia abdominal. NO comas ni tomes nada, no te des laxantes ni pongas calor en la panza, y buscá atención médica.",
    items: [],
    cuandoConsultar: "Dolor que empeora, fiebre, vómitos o la panza dura como tabla: es urgente, no lo dejes pasar." },
  { id: "rayo", sintomas: ["me cayo un rayo", "nos cayo un rayo", "tormenta electrica", "me electrocuto un rayo", "relampagos y truenos encima", "nos agarro una tormenta electrica", "hay muchos rayos", "le cayo un rayo a alguien"],
    mensaje: "Tormenta eléctrica: bajá de cumbres y crestas, alejate de árboles solos, postes, metal y agua. Agachate con los pies juntos sobre algo aislante (mochila), no te acuestes en el suelo. Si a alguien le cayó un rayo, SE LO PUEDE tocar (no queda con corriente): fijate si respira y hacé RCP si hace falta, y pedí rescate.",
    items: ["manta termica"],
    cuandoConsultar: "Si no responde o no respira: RCP y rescate YA. Aunque parezca estar bien, quien recibió un rayo debe ser revisado." },
  { id: "perdido", sintomas: ["estoy perdido", "me perdi en la montaña", "no se donde estoy", "perdi el camino", "no encuentro el sendero", "estoy perdido en la nieve", "me perdi", "no se como volver", "me extravie", "perdi la huella"],
    mensaje: "Si te perdiste: PARÁ y quedate quieto, no sigas caminando sin rumbo (gastás energía y te alejás más). Abrigate, hacete ver (ropa de colores, luz, silbato: 3 pitidos seguidos), y si tenés señal mandá tu ubicación. Quedate cerca de un lugar visible o un refugio y esperá. Cuidá la batería del teléfono.",
    items: ["manta termica"],
    cuandoConsultar: "Si se hace de noche, baja la temperatura o hay alguien herido: priorizá refugio y calor, y pedí rescate apenas tengas señal." },
  { id: "agotamiento", sintomas: ["estoy agotado", "no puedo mas", "estoy exhausto", "no me dan las piernas", "estoy reventado de cansancio", "no puedo seguir caminando", "me quede sin fuerzas", "estoy muerto de cansancio", "no aguanto mas el cansancio"],
    mensaje: "Pará y descansá en un lugar protegido del viento. Tomá agua y comé algo con azúcar y energía (frutos secos, chocolate). Abrigate si hace frío. El agotamiento en altura o frío es peligroso: no fuerces, recuperá antes de seguir, y si no mejorás, no sigas subiendo.",
    items: ["sales de rehidratacion"],
    cuandoConsultar: "Si además hay confusión, mareo fuerte, no parás de temblar o no te recuperás con descanso y comida: puede ser hipotermia, deshidratación o altura, prestá atención." },
  { id: "shock", sintomas: ["esta palido y sudando frio", "esta como ido y con sudor frio", "pulso debil y palido", "se esta descomponiendo", "esta muy palido y mareado", "sudor frio y debilidad", "esta en shock", "esta blanco y con sudor frio", "se puso palido y debil"],
    mensaje: "Palidez, sudor frío, pulso rápido y débil y confusión pueden ser SHOCK (algo grave de fondo: sangrado, deshidratación, infección). Acostalo, levantale un poco las piernas, abrigalo con manta térmica, NO le des de comer ni beber, y controlá cualquier sangrado. Pedí rescate.",
    items: ["manta termica", "torniquete"],
    cuandoConsultar: "Empeora rápido, pierde el conocimiento o deja de respirar: rescate YA y RCP si hace falta." },
  { id: "hiperglucemia", sintomas: ["azucar alta", "hiperglucemia", "mucha sed y orino mucho", "soy diabetico y me siento mal", "aliento dulce", "tengo el azucar por las nubes", "diabetico con mucha sed", "azucar muy alta"],
    mensaje: "Si tenés diabetes y el azúcar está muy alta (mucha sed, orinás mucho, cansancio, visión borrosa): tomá agua, controlá la glucemia si tenés medidor y seguí la indicación de insulina de tu médico. No hagas esfuerzo intenso.",
    items: [],
    cuandoConsultar: "Vómitos, respiración rápida y profunda, aliento afrutado, mucha confusión o somnolencia: puede ser cetoacidosis, rescate." },
  { id: "intoxicacion-comida", sintomas: ["comi algo en mal estado", "intoxicacion por comida", "vomito y diarrea juntos", "me cayo mal la comida", "creo que me intoxique con la comida", "comida en mal estado", "tengo vomitos y diarrea", "me intoxique comiendo"],
    mensaje: "Suena a intoxicación por comida. Lo principal es no deshidratarte: agua y sales de rehidratación de a sorbos, descansá y comé liviano cuando puedas. Evitá lácteos, alcohol y frituras. Suele pasar en 1-2 días.",
    items: ["sales de rehidratacion", "antiemetico", "antidiarreico"],
    cuandoConsultar: "Sangre en la caca o el vómito, fiebre alta, no retenés líquidos, signos de deshidratación o dura más de 2-3 días: consultá." },
  { id: "ahogamiento", sintomas: ["se estaba ahogando en el agua", "lo sacamos del agua", "casi se ahoga en el rio", "trago agua y casi se ahoga", "se ahogo en el lago", "rescatamos a alguien del agua", "casi me ahogo nadando"],
    mensaje: "Sacá a la persona del agua. Si NO respira: empezá RCP de inmediato (30 compresiones + 2 ventilaciones) y pedí rescate. Si respira, ponela de costado, sacale la ropa mojada y abrigala (riesgo de hipotermia). Aunque se recupere, tiene que ser revisada: puede empeorar horas después.",
    items: ["manta termica"],
    cuandoConsultar: "No respira o no responde: RCP y rescate YA. Siempre control médico después de un casi-ahogamiento." },
  { id: "electrocucion", sintomas: ["me dio corriente", "toque un cable y me dio corriente", "me electrocute", "descarga electrica", "toque un cable pelado", "me dio la corriente", "me dio una descarga electrica"],
    mensaje: "⚠️ Antes de tocar a la persona, CORTÁ la corriente (apagá la llave) o alejá la fuente con algo que NO conduzca (madera seca). No la toques si sigue en contacto con la electricidad. Después fijate si respira (RCP si hace falta) y revisá quemaduras donde entró y salió la corriente. Pedí rescate.",
    items: ["manta termica", "gasas"],
    cuandoConsultar: "No respira, no responde, o la corriente pasó por el pecho/brazo a brazo: rescate YA, puede afectar el corazón." },
  { id: "vomito-sangre", sintomas: ["vomito sangre", "estoy vomitando sangre", "vomite con sangre", "sangre en el vomito", "devuelvo sangre", "vomite sangre"],
    mensaje: "Vomitar sangre (roja o como borra de café) es señal de sangrado interno. NO comas ni tomes nada, recostate de costado y buscá atención médica urgente. Guardá una muestra si podés.",
    items: [],
    cuandoConsultar: "Es urgente siempre. Si además está pálido, mareado o con sudor frío (shock): rescate YA." },
  { id: "colico-renal", sintomas: ["dolor de rinon", "colico renal", "dolor fuerte en la espalda baja que va al frente", "piedra en el rinon", "calculo renal", "me duele el rinon y no me calma", "dolor que va de la espalda a la ingle"],
    mensaje: "Un dolor muy fuerte tipo retortijón en la espalda baja o el costado que se va hacia la ingle puede ser un cólico renal (una piedra). Tomá un antiinflamatorio, bastante agua, y buscá una posición que alivie. Suele venir en olas.",
    items: ["ibuprofeno", "analgesico fuerte"],
    cuandoConsultar: "Fiebre con escalofríos, vómitos que no paran, sangre en la orina con fiebre, o dolor que no cede con nada: consultá." },
  { id: "lumbago", sintomas: ["me bloquee la espalda", "me quedo trabada la espalda", "lumbago", "no me puedo enderezar", "me agarro el lumbago", "me dio un tiron en la espalda baja", "se me trabo la cintura"],
    mensaje: "Lumbago (la espalda baja se trabó). No te quedes totalmente quieto: movimientos suaves, calor local y un antiinflamatorio ayudan. Evitá levantar peso y agacharte doblando la cintura. Suele aflojar en unos días.",
    items: ["ibuprofeno"],
    cuandoConsultar: "Si el dolor baja por la pierna con hormigueo, perdés fuerza en la pierna, o no controlás pis/caca: consultá, puede ser un nervio." },
  { id: "desgarro", sintomas: ["me desgarre", "creo que me desgarre", "se me desgarro el musculo", "senti que algo se rompio en el musculo", "desgarro muscular", "me desgarre el gemelo", "senti un latigazo en el musculo"],
    mensaje: "Si sentiste un tirón fuerte o un 'latigazo' en el músculo y duele al moverlo, puede ser un desgarro. Pará, aplicá frío 15-20 min, comprimí suave con venda elástica y mantené la zona en alto. Nada de calor ni masajes los primeros días. Reposo.",
    items: ["venda elastica", "ibuprofeno"],
    cuandoConsultar: "Si no podés mover o apoyar nada, se hincha mucho o se pone muy morado: consultá." },
  { id: "pie-trinchera", sintomas: ["pie de trinchera", "tengo los pies mojados y helados hace horas", "pies blancos y entumecidos por humedad", "tengo los pies congelados y mojados", "pies frios y mojados hace mucho"],
    mensaje: "Pies mojados y fríos por mucho tiempo dañan la piel (pie de trinchera). Sacate las botas y medias mojadas, secá bien, entrá en calor de a poco y poné medias secas. No los frotes fuerte. Mantenelos secos de ahora en más.",
    items: ["manta termica"],
    cuandoConsultar: "Si la piel queda muy pálida/azulada, sin sensibilidad, con ampollas o muy hinchada: consultá." },
  { id: "sabanones", sintomas: ["sabañones", "sabanones", "se me hincharon los dedos con el frio", "tengo los dedos rojos e hinchados por el frio", "me pican los dedos por el frio", "manchas rojas que pican por el frio"],
    mensaje: "Sabañones: la piel reacciona al frío con zonas rojas o moradas que pican o duelen (dedos, orejas, nariz). Entrá en calor LENTO (nada de fuego directo ni agua caliente), no te rasques y mantené la zona abrigada y seca. Suelen mejorar solos.",
    items: [],
    cuandoConsultar: "Si se ampolla, se abre o se infecta (pus, mucho rojo y dolor): consultá." },
  { id: "torticolis", sintomas: ["torticolis", "amaneci con el cuello trabado", "no puedo girar el cuello", "me quedo el cuello duro", "tengo el cuello tan duro que no lo puedo mover", "tengo el cuello trabado"],
    mensaje: "Tortícolis (el cuello se trabó). Calor local, movimientos muy suaves dentro de lo que no duele, y un antiinflamatorio. Evitá tirones bruscos y la mala postura al dormir. Suele aflojar en 1-3 días.",
    items: ["ibuprofeno"],
    cuandoConsultar: "Si vino tras un golpe fuerte, con fiebre, o con hormigueo/pérdida de fuerza en los brazos: consultá, no fuerces el cuello." },
  { id: "cuerpo-oido", sintomas: ["se me metio un bicho en el oido", "tengo algo en el oido", "se me metio agua en el oido", "tengo un insecto en el oido", "algo me entro al oido", "se me metio algo al oido"],
    mensaje: "Si te entró un insecto al oído, incliná la cabeza hacia ese lado; a veces sale solo. Podés poner unas gotas de agua tibia o aceite para que flote (NO si duele mucho o sale líquido). No metas pinzas ni cotonetes: empujás más adentro. Si es agua, saltá en una pata con la cabeza inclinada.",
    items: [],
    cuandoConsultar: "Si no sale, duele mucho, sangra o perdés audición: que lo saque un médico, no hurgues." },
  { id: "ojo-morado", sintomas: ["tengo un ojo morado", "me dieron un ojo en compota", "me golpee el ojo", "ojo hinchado por un golpe", "me pegaron en el ojo", "me deje el ojo morado"],
    mensaje: "Golpe en el ojo (ojo morado): poné frío (paño con hielo, no directo) 15-20 min las primeras horas, sin apretar el ojo. Mantené la cabeza elevada. El moretón cambia de color varios días, es normal.",
    items: ["ibuprofeno"],
    cuandoConsultar: "Si ves borroso o doble, te duele mover el ojo, ves sangre dentro del ojo o la pupila quedó rara: consultá." },
  { id: "quemadura-quimica", sintomas: ["me cayo algo quimico en el ojo", "me salpico quimico", "quemadura quimica", "me cayo lavandina", "me entro quimico al ojo", "me cayo acido en la piel", "me salpico acido"],
    mensaje: "Quemadura química: lavá con MUCHA agua limpia y corriente de inmediato, 15-20 minutos seguidos (si es en el ojo, mantenelo abierto y echá el agua hacia afuera). Sacá ropa o joyas con el químico. NO uses cremas ni intentes neutralizar con otra cosa.",
    items: ["suero fisiologico", "colirio"],
    cuandoConsultar: "Siempre consultá tras un químico en el ojo o una quemadura química grande. Si tenés el envase, mostralo." },
  { id: "una-encarnada", sintomas: ["uña encarnada", "una encarnada", "se me encarno la uña", "la uña se me clava en el dedo", "tengo la uña enterrada", "me duele la uña del pie encarnada"],
    mensaje: "Uña encarnada (se clava en la piel del dedo). Remojá el pie en agua tibia con sal varias veces al día, secá bien y separá suave el borde de la uña con un poquito de gasa. No la cortes en pico ni muy corta. Usá calzado holgado.",
    items: ["antiseptico"],
    cuandoConsultar: "Si hay pus, mucho rojo, calor y dolor (infección) o no mejora: consultá." },
  { id: "dolor-regla", sintomas: ["dolor de regla", "colicos menstruales", "me duele por la menstruacion", "tengo colicos de la regla", "dolor menstrual", "me vino la regla con dolor"],
    mensaje: "Para los cólicos menstruales: calor local en la panza baja, un antiinflamatorio (ibuprofeno suele andar bien), hidratarte y moverte suave. Descansá si lo necesitás.",
    items: ["ibuprofeno", "paracetamol"],
    cuandoConsultar: "Dolor que te tira al piso y no cede con nada, fiebre, sangrado muy abundante o desmayo: consultá." },
  { id: "herpes-labial", sintomas: ["herpes labial", "me salio un fuego en el labio", "tengo una calentura en el labio", "ampolla en el labio que arde", "me salio herpes en la boca"],
    mensaje: "Herpes labial ('fuego'): una ampollita que arde o pica en el labio. No la revientes ni la toques (se contagia), mantené la zona limpia y seca, y poné protector labial. Una crema antiviral acelera si la tenés. No compartas vasos ni cubiertos.",
    items: [],
    cuandoConsultar: "Si se extiende mucho, te llega cerca del ojo o tenés las defensas bajas: consultá." },
  { id: "palpitaciones", sintomas: ["corazon acelerado", "tengo el corazon acelerado", "me late muy rapido el corazon", "como bajo las pulsaciones", "como calmo el pulso", "debo calmar el pulso del corazon", "tengo taquicardia", "tengo palpitaciones", "se me acelera el corazon", "el corazon a mil", "el corazon me late fuerte", "me palpita el corazon rapido"],
    mensaje: "Si el corazón está acelerado pero SIN dolor de pecho: sentate, respirá lento y profundo (inhalá 4 segundos, exhalá 6), tomá agua y descansá. Suele ser por esfuerzo, susto, cafeína, deshidratación o nervios, y baja solo. Evitá café y bebidas energizantes.",
    items: [],
    cuandoConsultar: "Si además hay DOLOR u opresión en el pecho, falta de aire, sudor frío, te desmayás, o el corazón sigue muy acelerado sin calmarse: tratalo como problema de corazón, es una emergencia." },
  { id: "golpe-abdomen", sintomas: ["me golpee fuerte el estomago", "me golpee el estomago", "me pegaron en la panza", "recibi un golpe en el abdomen", "me dieron un golpe en la panza", "me golpee el abdomen", "golpe fuerte en la barriga", "me cai sobre la panza", "me golpee la boca del estomago"],
    mensaje: "Un golpe fuerte en la panza puede lastimar órganos por dentro aunque por fuera no se vea nada. Recostate, aflojá la ropa, NO comas ni tomes nada por un rato y vigilate. Frío suave sobre la zona ayuda con el dolor de la pared.",
    items: [],
    cuandoConsultar: "Dolor que crece, panza dura o hinchada, vómitos (sobre todo con sangre), sangre en la orina o en la caca, mareo, palidez o desmayo, o un moretón grande: puede haber daño interno, pedí rescate." },
  { id: "contusion", sintomas: ["me salio un moreton", "me salio un moreton enorme", "tengo un moreton", "me sale un cardenal", "me di un golpe fuerte en la pierna", "me pegue fuerte en el brazo", "me golpee la pierna", "tengo un golpe sin herida", "me magulle", "me di un porrazo en la pierna", "tengo un chichon en la pierna", "golpe morado"],
    mensaje: "Un golpe o moretón (contusión) sin herida abierta: aplicá FRÍO (hielo en un paño, no directo) 15-20 minutos las primeras horas, mantené la zona en alto y descansala. Pasadas 48 hs podés usar calor suave. Un analgésico ayuda. El color del moretón va cambiando varios días, es normal.",
    items: ["ibuprofeno", "venda elastica"],
    cuandoConsultar: "Si no podés mover o apoyar la zona, se hincha muchísimo, el dolor es muy fuerte o el moretón crece rápido: puede haber algo más (fractura, sangrado), consultá." },
  { id: "timpano", sintomas: ["se me rompio el oido", "se me revento el timpano", "se me rompio el timpano", "me reventé el oido", "se me perforo el timpano", "se me rompio el tambor del oido", "me duele mucho el oido y no escucho", "me sangra el oido y no escucho", "se me tapo el oido despues de un golpe"],
    mensaje: "Suena a tímpano perforado (se 'rompe' por un golpe, un buceo, una explosión o una infección fuerte). NO te metas nada en el oído ni eches gotas ni agua: mantenelo seco, podés tapar la oreja por fuera con una gasa floja. Un analgésico ayuda con el dolor. Suele cerrar solo en semanas.",
    items: ["paracetamol", "ibuprofeno", "gasas"],
    cuandoConsultar: "Mucho sangrado, mareo fuerte con vómitos, pérdida de audición que no mejora, o si fue por un golpe fuerte en la cabeza: consultá pronto." },
  { id: "flato", sintomas: ["tengo una puntada en el costado de tanto correr", "me dio flato", "tengo flato", "puntada al costado corriendo", "puntada en el costado al correr", "puntada de tanto caminar"],
    mensaje: "El flato (puntada en el costado al correr/caminar) no es grave. Bajá el ritmo o pará un momento, respirá lento y profundo, y presioná suave la zona inclinándote hacia ese lado. Se va en unos minutos. Evitá comer mucho justo antes de esfuerzo.",
    items: [],
    cuandoConsultar: "Si el dolor del costado es fuerte, no se va al parar, o viene con falta de aire o dolor de pecho: no es flato, prestá atención." },
  { id: "mareo-movimiento", sintomas: ["me mareo en el auto", "me mareo en el bus", "mareo de auto", "me mareo viajando", "cinetosis", "me mareo en el viaje a la montaña", "me dan nauseas en el auto", "me mareo en la micro"],
    mensaje: "Mareo por movimiento (auto/bus): mirá un punto fijo lejano o el horizonte, sentate adelante, ventilá con aire fresco y evitá leer o el celular. Comé liviano antes de viajar. Un antiemético/antimareo ayuda si lo tenés.",
    items: ["antiemetico"],
    cuandoConsultar: "Si los vómitos no paran o te deshidratás, prestá atención y rehidratate." },
  { id: "rozadura", sintomas: ["me rozaron las correas de la mochila", "me roza la entrepierna de caminar", "me roza el zapato", "tengo rozadura por la mochila", "me roza la ropa y arde", "rozadura entre las piernas", "me peló la correa"],
    mensaje: "Rozadura (la piel se irrita por el roce de la ropa, mochila o zapatos): limpiá y secá la zona, poné algo que separe/lubrique (vaselina) y cubrí con apósito si va a seguir rozando. Ajustá las correas y usá ropa que no apriete. Evitá que se ampolle.",
    items: ["curitas", "antiseptico"],
    cuandoConsultar: "Si la piel se abre, se pone muy roja con pus o duele mucho: tratala como herida e infección." },
  { id: "golpe-genitales", sintomas: ["me pegaron una patada en los testiculos", "me golpee los testiculos", "me golpee los huevos", "golpe en la ingle", "me pegue en las partes", "golpe en los genitales", "me golpee ahi abajo"],
    mensaje: "Golpe en los testículos: sentate, descansá y poné frío suave (paño con hielo, no directo) sobre la zona. El dolor y las náuseas suelen pasar en un rato. Un analgésico ayuda.",
    items: ["ibuprofeno", "paracetamol"],
    cuandoConsultar: "Si el dolor es muy fuerte y no cede, se hincha mucho, hay sangre en la orina, o un testículo queda muy duro/torcido: consultá pronto, puede ser grave." },
  { id: "humo", sintomas: ["hay mucho humo y me cuesta respirar", "trague humo del fuego", "inhale humo", "me ahogo con el humo", "respire humo de la fogata", "humo en la carpa", "intoxicacion por humo"],
    mensaje: "⚠️ Salí del humo al aire libre YA y agachate (el aire más limpio está abajo). Respirá tranquilo, tomá agua. El humo puede irritar y dañar las vías respiratorias aunque te sientas bien al rato.",
    items: [],
    cuandoConsultar: "Tos que no para, ronquera, falta de aire, hollín en la boca/nariz, confusión o labios azules: es urgente, pedí rescate. Tras inhalar mucho humo, controlate aunque mejores." },
  { id: "planta-urticante", sintomas: ["toque una ortiga y me arde la piel", "me roce con una planta y me pica", "me salieron ronchas por una planta", "toque una planta y me arde", "me pico una ortiga", "contacto con planta urticante"],
    mensaje: "Contacto con planta que pica (ortiga, etc.): NO te rasques. Lavá la zona con agua fría y jabón sin frotar, sacá pelitos/espinas con cinta adhesiva si quedaron, y poné frío. Un antihistamínico calma la picazón.",
    items: ["antihistaminico"],
    cuandoConsultar: "Si se hincha mucho, se extiende por todo el cuerpo, o cuesta respirar (alergia grave): tratalo como reacción alérgica seria." },
  { id: "aftas", sintomas: ["tengo llagas en la boca", "me salio un afta", "tengo aftas", "llaga en la lengua", "tengo una herida en la boca que arde", "me salieron llagas"],
    mensaje: "Las aftas (llaguitas en la boca) duelen pero no son graves. Enjuagá con agua tibia con sal o bicarbonato, evitá comidas ácidas, muy calientes o picantes, y mantené la boca limpia. Suelen irse solas en 1-2 semanas.",
    items: [],
    cuandoConsultar: "Si duran más de 2-3 semanas, son muy grandes, se repiten mucho o vienen con fiebre: consultá." },
  { id: "pre-desmayo", sintomas: ["siento que me voy a desmayar", "estoy por desmayarme", "veo todo negro", "se me nubla la vista y me mareo", "me voy a desmayar", "siento que me desvanezco", "estoy a punto de desmayarme", "me falta poco para desmayarme"],
    mensaje: "Si sentís que te vas a desmayar: ACOSTATE YA y levantá las piernas (o sentate con la cabeza entre las rodillas) para que llegue sangre al cerebro. Aflojá la ropa, aire fresco, y cuando mejores tomá agua y algo con azúcar. Levantate de a poco.",
    items: ["sales de rehidratacion"],
    cuandoConsultar: "Si llega a desmayarse y no responde, le cuesta respirar, hay dolor de pecho, o se repite: es para tomar en serio, pedí ayuda." },
  // ===================== GUÍAS QUE SALVAN VIDAS (paso a paso) =====================
  { id: "rcp", titulo: "RCP (reanimación) paso a paso", sintomas: ["como hago rcp", "como hacer rcp", "como dar masaje cardiaco", "como hago reanimacion", "como reanimar a alguien", "como hago compresiones", "rcp paso a paso", "como hacer reanimacion cardiopulmonar", "masaje al corazon", "como revivir a alguien"],
    mensaje: "Si la persona NO responde y NO respira (o solo hace boqueadas), es un paro: empezá RCP YA y que alguien llame al rescate / busque un desfibrilador (DEA).",
    pasos: ["Acostala boca arriba sobre algo firme (el suelo).", "Apoyá el talón de una mano en el CENTRO del pecho y la otra mano encima, con los dedos entrelazados.", "Comprimí FUERTE y rápido: hundí el pecho unos 5 cm, a 100-120 por minuto (el ritmo de 'La Macarena' o 'Stayin' Alive').", "Dejá que el pecho suba del todo entre cada compresión, sin despegar las manos.", "Si sabés dar respiraciones: cada 30 compresiones, 2 soplos boca a boca. Si no, hacé SOLO compresiones, sin parar.", "No pares hasta que llegue ayuda, la persona reaccione, o no puedas más. Si hay otra persona, túrnense cada 2 minutos."],
    items: [],
    cuandoConsultar: "Si estás solo y hay señal, llamá al rescate ANTES de empezar. Un DEA, si aparece, se usa siguiendo sus instrucciones de voz." },
  { id: "boca-a-boca", titulo: "Respiración boca a boca", sintomas: ["como doy respiracion boca a boca", "respiracion boca a boca", "como hacer respiracion artificial", "como dar respiraciones de rescate", "como le soplo aire", "como hago respiracion de rescate", "como darle aire a alguien"],
    mensaje: "Las respiraciones de rescate dan oxígeno cuando alguien no respira. Van junto con la RCP (2 soplos cada 30 compresiones).",
    pasos: ["Incliná la cabeza hacia atrás levantando el mentón para abrir la garganta.", "Tapá la nariz con dos dedos y sellá tu boca sobre la boca de la persona.", "Soplá suave y parejo durante 1 segundo, mirando que el PECHO SUBA.", "Despegate, dejá salir el aire, y dá un segundo soplo.", "Si el pecho no sube, reacomodá la cabeza y fijate que no haya algo tapando la boca."],
    items: [],
    cuandoConsultar: "Si no querés o no podés dar boca a boca, hacé SOLO compresiones de pecho: igual salva vidas." },
  { id: "posicion-recuperacion", titulo: "Posición de recuperación (de costado)", sintomas: ["posicion de recuperacion", "como pongo a alguien de costado", "posicion lateral de seguridad", "alguien inconsciente que respira", "esta desmayado pero respira que hago", "como acuesto a alguien inconsciente", "como pongo a alguien de lado", "esta inconsciente pero respira"],
    mensaje: "Si la persona está INCONSCIENTE pero RESPIRA, ponela de costado para que no se ahogue si vomita y la lengua no le tape la garganta:",
    pasos: ["Arrodillate a su lado. Estirá el brazo más cercano a vos hacia arriba (como saludando).", "Cruzá el otro brazo sobre el pecho y apoyá el dorso de su mano contra su mejilla.", "Flexioná la rodilla más lejana y, tirando de ella, girala hacia vos hasta dejarla de costado.", "Acomodá la cabeza un poco hacia atrás para que la vía quede abierta y la boca pueda drenar.", "Controlá que siga respirando hasta que llegue ayuda. Si deja de respirar, ponela boca arriba y empezá RCP."],
    items: ["manta termica"],
    cuandoConsultar: "Si NO respira o no estás seguro de que respira: no la pongas de costado, empezá RCP y pedí rescate." },
  { id: "heimlich", titulo: "Maniobra de Heimlich (atragantamiento)", sintomas: ["como hago la maniobra de heimlich", "como ayudo a alguien que se ahoga con comida", "como saco algo de la garganta", "maniobra de heimlich", "como desatoro a alguien", "se esta ahogando con comida que hago", "como saco la comida atorada", "alguien se atraganto que hago"],
    mensaje: "Si se atragantó y NO puede toser, hablar ni respirar (se agarra el cuello), actuá rápido:",
    pasos: ["Parate detrás de la persona y rodeala con los brazos por la cintura.", "Cerrá un puño y apoyalo con el pulgar justo ARRIBA del ombligo, debajo de las costillas.", "Agarrá el puño con la otra mano y hacé compresiones FUERTES hacia adentro y hacia arriba (como dibujando una J).", "Repetí los empujones hasta que salga el objeto o la persona pueda respirar o toser.", "Si se desmaya, bajala con cuidado al suelo y empezá RCP."],
    items: [],
    cuandoConsultar: "Si TODAVÍA puede toser, dejala toser (es lo más efectivo, no le pegues). En bebés es distinto: golpes en la espalda y en el pecho, no Heimlich." },
  { id: "presion-alta", sintomas: ["me subio la presion", "tengo la presion alta", "presion arterial alta", "tengo presion alta", "se me subio la presion", "tengo la presion por las nubes", "presion alta y dolor de cabeza"],
    mensaje: "Si te subió la presión (dolor de cabeza, zumbido en los oídos, cara caliente): sentate y tranquilizate, respirá lento, evitá esfuerzos, la sal y el café. Si tomás remedios para la presión, seguí la indicación de tu médico. Volvé a medirla en un rato si podés.",
    items: [],
    cuandoConsultar: "Presión muy alta CON dolor de pecho, falta de aire, dolor de cabeza muy fuerte, visión borrosa, vómitos o se te duerme un lado del cuerpo: es una urgencia, pedí ayuda." },
  { id: "boca-herida", sintomas: ["me mordi la lengua", "me parti el labio", "me mordi el cachete", "sangra la lengua", "me reventaron el labio", "me corte la lengua", "me sangra la lengua de un mordiscon", "me mordi adentro de la boca"],
    mensaje: "Cortes o mordeduras en el labio o la lengua sangran bastante pero suelen verse peor de lo que son. Hacé presión con una gasa limpia 5-10 minutos, poné algo frío (hielo envuelto en un paño) y enjuagá con agua fría. Evitá comidas calientes o picantes un rato.",
    items: ["gasas"],
    cuandoConsultar: "Si el corte es grande o profundo, los bordes quedan separados, no para de sangrar a los 15 minutos, o falta un pedazo de labio/diente: consultá, puede necesitar puntos." },
  { id: "sangrado-oido", sintomas: ["me sale sangre del oido despues de un golpe", "sangre por el oido", "me sangra el oido tras golpearme la cabeza", "sale liquido del oido despues del golpe"],
    mensaje: "⚠️ Sangre o líquido claro saliendo del oído después de un golpe en la cabeza puede indicar una lesión grave de cráneo. NO tapones el oído: dejá que drene, mantené la cabeza quieta, recostá a la persona de ese lado y pedí rescate URGENTE.",
    items: ["gasas"],
    cuandoConsultar: "Siempre urgente tras un golpe fuerte en la cabeza. Vigilá la conciencia y la respiración." },
  { id: "dedo-roto", sintomas: ["me rompi un dedo", "me quebre un dedo", "se me quebro un dedo", "me fracture un dedo", "tengo un dedo roto", "me rompi el dedo del pie", "creo que me quebre un dedo de la mano", "dedo torcido y roto", "me quebre el dedo"],
    mensaje: "Un dedo roto (de la mano o del pie) duele, se hincha y a veces queda torcido. Si está muy torcido NO lo acomodes a la fuerza. Inmovilizalo pegándolo con cinta al dedo de al lado (con una gasa en el medio), poné frío, mantené la mano o el pie en alto y tomá un analgésico.",
    items: ["tela adhesiva", "ibuprofeno", "ferula"],
    cuandoConsultar: "Si quedó muy torcido o deformado, el hueso asoma, se pone azul o sin sensibilidad, o el dolor es muy fuerte: que un médico lo acomode bien." },
  { id: "zumbido", sintomas: ["me zumban los oidos", "escucho un pitido", "tengo un pitido en el oido", "me suenan los oidos", "tinnitus", "siento un zumbido"],
    mensaje: "Suele pasar por presión (altura), ruido fuerte o cansancio. Tragá saliva o bostezá para destapar los oídos, descansá y tomá agua. Bajá el ritmo.",
    items: [],
    cuandoConsultar: "Si viene con mareo fuerte, pérdida de audición de golpe, o dolor intenso de oído: consultá." },
  { id: "vista", sintomas: ["veo borroso", "veo nublado", "no veo bien", "se me nubla la vista", "veo puntos", "veo lucecitas", "perdi vision"],
    mensaje: "Sentate, descansá la vista y tomá agua. En altura o con cansancio puede pasar. Si fue de golpe o solo en un ojo, prestá mucha atención.",
    items: [],
    cuandoConsultar: "Pérdida de visión REPENTINA, ver doble, con dolor de cabeza fuerte, debilidad en un lado del cuerpo o al hablar: puede ser grave (golpe, presión, altura), pedí ayuda YA." },
  // ===================== LOTE v2.8: rescates que salvan la vida =====================
  { id: "lesion-columna", titulo: "Posible lesión de columna / cuello", sintomas: ["me lastime la espalda en una caida", "no siento las piernas despues de caer", "me golpee la columna", "no puedo mover las piernas despues de la caida", "lesion de columna", "me cai de altura y no siento el cuerpo", "me duele la espalda y no siento las piernas", "no siento los brazos despues del golpe", "me fracture la columna"],
    mensaje: "⚠️ Tras una caída fuerte, un golpe en la cabeza/espalda o un accidente, si la persona tiene dolor en el cuello o la espalda, hormigueo, debilidad, o no siente o no mueve brazos o piernas: sospechá lesión de columna. NO la muevas ni le dobles el cuello. Dejala como está, sostené la cabeza con las dos manos alineada con el cuerpo para que no se mueva, abrigala y pedí rescate URGENTE. Solo movela si hay peligro de muerte ahí mismo (fuego, agua que sube, avalancha) y siempre en bloque (cabeza-cuello-tronco juntos, como un tronco).",
    items: [],
    cuandoConsultar: "Siempre urgente. Si deja de respirar, igual tendrás que hacer RCP: movela lo mínimo y en bloque." },
  { id: "atragantamiento-bebe", titulo: "Bebé atragantado (NO es Heimlich)", sintomas: ["un bebe se atraganta", "mi bebe se esta ahogando", "el bebe se atoro", "como desatoro a un bebe", "bebe atragantado", "se atraganto un bebe con comida", "mi guagua se atraganto", "un niño chico se ahoga con comida", "como ayudo a un bebe que se ahoga", "mi bebe no puede respirar se atraganto"],
    mensaje: "En bebés (menores de 1 año) NO se hace Heimlich. Si el bebé no puede toser, llorar ni respirar:",
    pasos: ["Sentate y poné al bebé boca abajo sobre tu antebrazo, con la cabeza más baja que el cuerpo, sosteniéndole la mandíbula (sin apretar el cuello).", "Dale 5 golpes firmes con el talón de la mano entre los omóplatos (en la espalda).", "Si no sale, dalo vuelta boca arriba, cabeza más baja, y hacé 5 compresiones en el centro del pecho con DOS dedos (como mini-RCP).", "Repetí: 5 golpes en la espalda, 5 compresiones en el pecho, hasta que salga el objeto o el bebé respire o llore.", "Si se desmaya, empezá RCP de bebé (compresiones suaves con dos dedos) y que alguien pida rescate YA."],
    items: [],
    cuandoConsultar: "Pedí rescate apenas puedas. Aunque el objeto salga y el bebé respire bien, hacelo revisar después." },
  { id: "me-atore-solo", titulo: "Me atraganté y estoy solo", sintomas: ["me estoy atragantando y estoy solo", "me atore y no hay nadie", "me ahogo con comida y estoy solo", "como me desatoro solo", "estoy solo y me atragante", "me atragante estando solo", "me atore solo que hago"],
    mensaje: "Si te atragantás, estás solo y no podés respirar, actuá ya:",
    pasos: ["Tosé con toda la fuerza que puedas: la tos es lo más efectivo.", "Hacete el Heimlich a vos mismo: cerrá un puño justo arriba del ombligo, agarralo con la otra mano y empujá fuerte hacia adentro y hacia arriba, repetidas veces.", "O apoyá la parte de arriba de la panza (arriba del ombligo) contra el borde firme de una roca, una silla o un tronco, y dejate caer con fuerza encima, una y otra vez, hasta que el objeto salga.", "En cuanto puedas, buscá ayuda o señal para pedir rescate."],
    items: [],
    cuandoConsultar: "Si lográs sacar el objeto pero te queda dolor, tos o te cuesta tragar, hacelo revisar. Si perdés el conocimiento, otra persona debe empezar RCP." },
  { id: "mordedura-serpiente", titulo: "Mordedura de serpiente / culebra", sintomas: ["me mordio una serpiente", "me pico una vibora", "mordedura de serpiente", "me mordio una culebra", "me mordio una serpiente en la pierna", "me pico una serpiente", "vibora me mordio", "me mordio una vibora en el pie", "me mordio una culebra de cola larga", "culebra de cola corta"],
    mensaje: "Mordedura de culebra/serpiente: mantené la CALMA y movete lo menos posible (el movimiento reparte el veneno). Alejate de la culebra (no la persigas ni la mates; si podés, sacale una foto de lejos). Sacá anillos, reloj y ropa apretada de esa zona ANTES de que hinche. Inmovilizá la parte mordida con una tablilla (como una fractura), QUIETA y a la altura del corazón o un poco más abajo. Lavá suave con agua. Marcá con lapicera el borde de la hinchazón y anotá la hora. Salí hacia ayuda caminando lento o que te lleven.\n\nNO hagas torniquete, NO cortes la herida, NO chupes el veneno, NO pongas hielo, NO tomes alcohol ni antiinflamatorios: todo eso empeora el daño.\n\n🇨🇱 En Chile podés quedarte algo más tranquilo: las culebras nativas (de cola larga y de cola corta) son poco venenosas y NO hay muertes registradas — dan dolor e hinchazón local que pasa en pocos días. Igual hacete ver, porque puede hincharse e infectarse.",
    items: [],
    cuandoConsultar: "Hacete ver siempre (y llamá a un centro de toxicología). URGENTE si la hinchazón sube rápido por el miembro, cuesta respirar o tragar, hay mareo/desmayo, sangrado que no para o sangre en la orina, hormigueo que se extiende, o ampollas y piel que se pone oscura. Fuera de Chile hay víboras peligrosas (tipo Bothrops): ahí es emergencia y se necesita antiveneno." },
  { id: "arana-rincon", titulo: "Mordedura de araña de rincón (loxoscelismo)", sintomas: ["me mordio una araña de rincon", "araña de rincon", "me pico la araña de rincon", "loxosceles", "loxoscelismo", "me mordio una araña", "me pico una araña", "creo que me mordio una araña de rincon", "araña del rincon me mordio", "mordedura de araña de rincon", "me pico una araña en la pieza"],
    mensaje: "Mordedura de araña de rincón (Loxosceles laeta): suele pasar DENTRO de la casa, de noche o al vestirse. La gravedad real se ve recién a las 24-48 horas, así que tomalo en serio aunque al principio parezca poca cosa. Hacé esto:",
    pasos: ["Mantené la calma y mové lo menos posible la zona (el movimiento reparte el veneno).", "Lavá con BASTANTE agua y jabón suave.", "Poné FRÍO, NUNCA calor: un paño con hielo envuelto en tela (no directo sobre la piel), por ratos de no más de 15 minutos por hora. El veneno actúa MÁS con el calor, por eso el calor empeora la herida y el frío la frena.", "Mantené la zona en alto (elevada) para el dolor y la hinchazón.", "Andá a un servicio de urgencia o llamá al 131 AUNQUE se vea poca cosa: lo importante es que te controlen.", "Si podés y sin arriesgarte, capturá o sacale una foto a la araña para identificarla.", "NO cortes, NO chupes, NO pongas torniquete, NO uses remedios caseros (pasta de dientes, lejía, hierbas, orina, tabaco) ni te automediques. NO toques ni revientes la herida/llaga que se va formando."],
    items: [],
    cuandoConsultar: "⚠️ EMERGENCIA (llamá al 131) si en las primeras 24-48 h aparece: ORINA OSCURA, ROJIZA o color té/coca-cola (la señal MÁS importante), fiebre, escalofríos, decaimiento general, color amarillo en la piel o los ojos, palidez, o si orinás muy poco. Eso es la forma grave (afecta la sangre y los riñones) y necesita hospital urgente. Importante: el 'suero anti-loxosceles' ya NO se recomienda en Chile (desde 2016); lo que salva es la atención médica y el control a tiempo." },
  { id: "arana-trigo", titulo: "Mordedura de viuda negra / araña del trigo (latrodectismo)", sintomas: ["me mordio una viuda negra", "viuda negra", "me pico la araña del trigo", "araña del trigo", "poto colorado", "trasero colorado", "latrodectus", "me mordio la araña del trigo", "araña de trigo me pico", "me pico una araña del trigo"],
    mensaje: "Mordedura de viuda negra / araña del trigo (Latrodectus, 'poto colorado'): suele pasar AFUERA, de día, en el campo. Casi no deja herida, pero da síntomas en TODO el cuerpo. Hacé esto:",
    pasos: ["Mantené la calma, sentate o recostate y dejá quieta la zona mordida.", "Lavá con agua y jabón suave.", "Poné un paño frío (envuelto en tela) en el lugar para el dolor.", "Andá a un servicio de urgencia o llamá al 131: el tratamiento para calmar el dolor y los calambres lo dan en el hospital.", "Si podés y sin arriesgarte, sacale una foto a la araña (negra, aterciopelada, con marcas rojas)."],
    items: [],
    cuandoConsultar: "⚠️ Andá a urgencia (131) si hay: dolor fuerte y calambres o rigidez en TODO el cuerpo, dolor de panza intenso (parece un abdomen agudo), sudoración abundante, presión alta, dolor de pecho, agitación o dificultad para respirar. Ojo especial en niños, adultos mayores y embarazadas (puede confundirse con preeclampsia). El dolor puede ser muy intenso, pero con tratamiento el pronóstico suele ser bueno." },
  { id: "picadura-alacran", titulo: "Picadura de alacrán / escorpión", sintomas: ["me pico un alacran", "me pico un escorpion", "alacran me pico", "picadura de alacran", "picadura de escorpion", "me pico un bicho y me duele mucho", "me pico un escorpion en la mano", "me pico un alacran en el pie"],
    mensaje: "Picadura de alacrán o escorpión: lavá con agua y jabón, poné frío (paño con hielo, no directo sobre la piel) y mantené la zona quieta y en alto. Tomá un analgésico para el dolor. Si podés y sin arriesgarte, sacale una foto al bicho para identificarlo. Vigilá de cerca cómo evoluciona. En Chile los alacranes no suelen ser peligrosos, pero conviene controlarse.",
    items: ["ibuprofeno", "paracetamol"],
    cuandoConsultar: "URGENTE (131) si hay dolor que se extiende, calambres, sudor abundante, babeo, vómitos, dificultad para respirar, visión borrosa, o si es un niño o una persona mayor: pedí ayuda." },
  { id: "golpe-calor", titulo: "Golpe de calor (emergencia)", sintomas: ["golpe de calor grave", "esta muy caliente y confundido", "no suda y esta rojo y confundido", "se desmayo por el calor", "esta delirando por el calor", "piel caliente y seca y confundido por el calor", "golpe de calor con desmayo", "esta rojo caliente y delira"],
    mensaje: "⚠️ El golpe de calor es una EMERGENCIA: piel muy caliente, persona confundida, agresiva, que delira o se desmaya, a veces SIN sudar. Hay que enfriarla YA: llevala a la sombra, sacale ropa, mojala con agua y abanicala, y poné paños fríos o nieve (envuelta en tela) en cuello, axilas e ingles. Si está consciente y traga bien, dale agua fresca de a sorbos. Pedí rescate URGENTE.",
    items: [],
    cuandoConsultar: "Siempre urgente. Confusión o desmayo con piel muy caliente = golpe de calor: enfriá agresivamente mientras llega el rescate. No es lo mismo que la insolación leve (esa mejora con sombra, agua y descanso)." },
  { id: "anafilaxia-sin-adrenalina", titulo: "Alergia grave sin adrenalina", sintomas: ["alergia grave y no tengo adrenalina", "se hincha y no tengo epipen", "anafilaxia sin adrenalina", "reaccion alergica grave y no tengo el autoinyector", "no tengo adrenalina y se ahoga", "se le cierra la garganta y no tengo adrenalina"],
    mensaje: "⚠️ Reacción alérgica grave SIN adrenalina a mano: igual pedí rescate URGENTE de inmediato. Recostá a la persona con las piernas en alto (semisentada si le cuesta respirar) y NO la pongas de pie ni la sientes de golpe. Si tiene antihistamínico, dáselo (ayuda pero NO reemplaza la adrenalina). Preguntá si alguien cerca tiene un autoinyector de adrenalina y usalo. Si deja de respirar, empezá RCP.",
    items: ["antihistaminico"],
    cuandoConsultar: "Siempre es emergencia máxima. Sin adrenalina, lo único que salva es la evacuación urgente: apurala todo lo posible." },
  { id: "hemorragia-interna", titulo: "Posible sangrado interno", sintomas: ["creo que tengo hemorragia interna", "me golpee fuerte y estoy palido y mareado", "sangrado interno", "golpe fuerte y la panza dura e hinchada", "me cai fuerte y estoy cada vez peor", "me pegaron fuerte y estoy palido y con sudor frio", "tengo la panza dura despues de un golpe"],
    mensaje: "⚠️ Después de un golpe fuerte (caída, choque) puede haber sangrado por DENTRO aunque no veas sangre. Señales: palidez, sudor frío, pulso rápido y débil, mareo, mucha sed, panza dura/hinchada o que duele cada vez más, moretones grandes. Recostá a la persona, abrigala, NO le des de comer ni beber y pedí rescate URGENTE. Tratala como shock: si no hay golpe de cabeza/columna ni fractura de pierna, elevá las piernas.",
    items: [],
    cuandoConsultar: "Siempre urgente. El sangrado interno no se frena desde afuera: necesita hospital rápido. Apurá la evacuación." },
  { id: "aplastamiento", titulo: "Aplastamiento / atrapado bajo un peso", sintomas: ["me quedo atrapada la pierna bajo una roca", "tengo un brazo aplastado", "me aplasto una roca", "quede atrapado bajo algo pesado", "me cayo una roca encima y no puedo salir", "aplastamiento", "tengo la pierna atrapada bajo una piedra"],
    mensaje: "⚠️ Si una parte del cuerpo quedó aplastada bajo algo pesado: pedí rescate URGENTE primero. Si lleva poco tiempo (pocos minutos) y podés liberarla con seguridad, hacelo y tratá heridas y sangrado. Si lleva MUCHO tiempo atrapada (más de 15 min) o no estás seguro, es más seguro NO liberarla sin ayuda médica: al soltar de golpe pueden liberarse toxinas peligrosas hacia el cuerpo. Mantené a la persona abrigada, hidratada si está consciente, y controlá cualquier sangrado.",
    items: [],
    cuandoConsultar: "Siempre urgente. Avisá a los rescatistas cuánto tiempo estuvo aplastada la zona: es un dato clave." },
  { id: "espina-garganta", titulo: "Espina / algo clavado en la garganta (respira)", sintomas: ["se me clavo una espina en la garganta", "tengo algo clavado en la garganta", "se me atoro una espina de pescado", "siento algo clavado en la garganta", "trague una espina", "tengo una espina en la garganta"],
    mensaje: "Si tenés algo clavado o la sensación de algo en la garganta pero PODÉS respirar, hablar y tragar, no es un atragantamiento de emergencia. Probá tragar algo blando (un bocado de pan o banana), tomá agua de a sorbos y tosé. NO metas los dedos a buscarlo. A veces queda la molestia un rato aunque la espina ya no esté.",
    items: [],
    cuandoConsultar: "Si te cuesta respirar o tragar saliva, babeás, hay sangre, o la molestia sigue varias horas o días: consultá, puede haber un resto clavado. Si NO podés respirar, es atragantamiento: Heimlich." },
  { id: "convulsion-febril", titulo: "Convulsión por fiebre (niño)", sintomas: ["mi hijo convulsiona por fiebre", "un niño con fiebre convulsiono", "convulsion febril", "el niño tiene fiebre y le dio un ataque", "mi hijo tiene fiebre y convulsiona", "mi guagua convulsiona por fiebre"],
    mensaje: "Una convulsión por fiebre alta en un niño asusta mucho pero suele durar poco y pasar sola. Ponelo de costado en un lugar seguro, NO le metas nada en la boca ni lo sujetes, sacale ropa de más y tomá el tiempo que dura. Cuando pase, bajá la fiebre (paño tibio, antitérmico cuando pueda tragar bien) y quedate con él.",
    items: ["paracetamol", "ibuprofeno"],
    cuandoConsultar: "URGENTE si dura más de 5 minutos, se repite, le cuesta respirar o queda muy decaído, es la primera vez, o es un bebé menor de 6 meses." },
  { id: "edema-altura", titulo: "Edema de altura (HAPE / HACE) — formas graves", sintomas: ["edema pulmonar de altura", "hape", "edema cerebral de altura", "tos con espuma en la altura", "camina como borracho en la altura", "como se que es edema de altura", "que es el edema de altura", "edema de altura"],
    mensaje: "⚠️ Son las formas GRAVES del mal de altura, y matan si no se baja:\n• Edema PULMONAR (HAPE): mucha falta de aire incluso en reposo, tos (a veces con espuma rosada), labios/uñas azulados, pecho que silba, agotamiento extremo.\n• Edema CEREBRAL (HACE): camina como borracho (no puede caminar derecho), muy confundido, dolor de cabeza que no cede, vómitos, mucho sueño.\nEn ambos, DESCENDER YA es lo que salva (aunque sea de noche), oxígeno si hay, y pedir rescate. No esperes a 'ver si mejora'.",
    items: [],
    cuandoConsultar: "Cualquiera de estas señales = emergencia: bajar de inmediato y pedir rescate. Nunca volver a subir con síntomas." },
  // ===================== LOTE v3.1: más casos de montaña =====================
  { id: "hiponatremia", titulo: "Tomé demasiada agua (hiponatremia)", sintomas: ["tome mucha agua y me siento mal", "hiponatremia", "tome demasiada agua", "tome litros de agua y estoy hinchado", "tome mucha agua y estoy confundido", "intoxicacion por agua", "tome mucho liquido y me siento mal", "me hinche de tomar agua"],
    puedeSer: "Si tomaste MUCHÍSIMA agua sola (sin comer ni reponer sales) en un día de esfuerzo, el sodio de la sangre baja demasiado. Da dolor de cabeza, náuseas, hinchazón, confusión y calambres — se parece a la deshidratación pero es lo contrario.",
    mensaje: "⚠️ Si creés que tomaste demasiada agua sola: DEJÁ de tomar más líquido por un rato. Comé algo salado (frutos secos, galletas saladas, un caldo) para reponer sodio. Descansá. NO tomes más agua pensando que vas a mejorar: la empeora.",
    items: ["sales de rehidratacion"],
    cuandoConsultar: "Confusión, vómitos, mucha somnolencia, convulsiones o que cuesta despertarlo: es grave (el cerebro se hincha), pedí rescate URGENTE." },
  { id: "picadura-boca", titulo: "Picadura de abeja/avispa en la boca o garganta", sintomas: ["me pico una abeja en la boca", "me pico una avispa en la lengua", "me pico un bicho en la garganta", "trague una abeja y me pico", "picadura en la boca", "me pico en la lengua", "me pico una abeja en la garganta"],
    mensaje: "⚠️ Una picadura DENTRO de la boca o la garganta es peligrosa: la hinchazón puede tapar la respiración. Chupá hielo o tomá agua bien fría de a sorbos para frenar la hinchazón, quedate sentado y tranquilo, y vigilá la respiración de cerca. Si tenés antihistamínico, tomalo.",
    items: ["antihistaminico"],
    cuandoConsultar: "URGENTE (131) si se hincha la lengua/garganta, cambia la voz, cuesta respirar o tragar, o hace ruido al respirar: tratalo como alergia grave (adrenalina si tenés) y pedí rescate." },
  { id: "sobredosis-medicamento", titulo: "Tomé de más un remedio / mezclé pastillas", sintomas: ["tome de mas una pastilla", "me pase con las pastillas", "tome muchos remedios", "sobredosis", "me tome de mas el remedio", "mezcle pastillas", "tome dos veces la pastilla", "me equivoque y tome mucho remedio", "tome muchas pastillas juntas"],
    mensaje: "Si tomaste de más un remedio o mezclaste varios: NO te provoques el vómito (puede ser peor). Fijate QUÉ tomaste, CUÁNTO y a qué HORA, guardá la caja, y llamá a un centro de toxicología (en Chile, CITUC +56 2 2635 3800) o al 131 para que te digan qué hacer según el remedio.",
    items: [],
    cuandoConsultar: "URGENTE (131) si hay mucho sueño, confusión, vómitos, dificultad para respirar, latidos raros o se desmaya. Si deja de responder: posición de recuperación y RCP si no respira." },
  { id: "agua-segura", titulo: "¿Puedo tomar esta agua? (agua segura)", sintomas: ["puedo tomar agua del rio", "el agua del rio es segura", "como purifico el agua", "puedo tomar agua de la vertiente", "el agua de deshielo se puede tomar", "como hago el agua segura", "es seguro tomar del estero", "puedo tomar nieve derretida", "puedo tomar agua de la montaña"],
    puedeSer: "El agua de ríos, esteros y deshielo puede tener microbios (giardia, bacterias) que dan diarrea, aunque se vea cristalina.",
    mensaje: "Para tomar agua segura en la montaña, lo más confiable es HERVIRLA (1 minuto de hervor; en mucha altura, 3 min). Si no podés, usá pastillas potabilizadoras o un filtro de montaña. Elegí agua que corra, lejos de animales o campamentos. La nieve hay que derretirla y también tratarla. Ojo: el agua sola no repone sales, sumá algo de comer.",
    items: ["sales de rehidratacion"],
    cuandoConsultar: "Si ya tomaste agua dudosa y tenés diarrea con sangre, fiebre alta o mucha deshidratación: consultá." },
  { id: "prevencion-altura", titulo: "Cómo prevenir el mal de altura (aclimatación)", sintomas: ["como prevengo el soroche", "como evito el mal de altura", "como me aclimato", "cada cuanto debo subir", "tips para la altura", "como subir sin enfermarme de altura", "consejos para la altura", "prevenir mal de montaña"],
    mensaje: "Para prevenir el mal de altura: subí DESPACIO para que el cuerpo se acostumbre. Pasados los ~3000 m, no subas más de ~500 m por día para dormir, y 'subí alto, dormí bajo'. Tomá bastante agua, comé liviano con hidratos, y evitá el alcohol y los esfuerzos fuertes los primeros días. Si tenés medicación preventiva indicada por tu médico, seguila. Si aparecen síntomas, NO sigas subiendo.",
    items: [],
    cuandoConsultar: "Si ya tenés dolor de cabeza + náuseas/mareo que no mejora, o falta de aire en reposo, tos o caminás como borracho: es mal de altura, mirá ese caso y descendé." },
  { id: "ropa-fuego", titulo: "Se me prendió fuego la ropa", sintomas: ["se me prendio la ropa", "me prendi fuego", "se me incendio la ropa", "tengo la ropa en llamas", "se prendio fuego mi ropa", "me agarro fuego la ropa"],
    mensaje: "⚠️ Si se te prende fuego la ropa: NO corras (el viento aviva el fuego). DETENETE, TIRATE al suelo y RODÁ una y otra vez para apagar las llamas, o tapate con una manta/abrigo. Una vez apagado, enfriá la quemadura con agua fresca corriente 10-20 min y tratala como quemadura.",
    items: [],
    cuandoConsultar: "Quemaduras grandes, en cara/manos/genitales, o si respiró humo/fuego (tos, hollín, voz ronca): emergencia, pedí rescate." },
  // ===================== LOTE v3.2: más casos de montaña =====================
  { id: "asma-sin-inhalador", titulo: "Crisis de asma sin inhalador", sintomas: ["me falta el aire y no tengo inhalador", "ataque de asma sin inhalador", "asma y perdi el inhalador", "crisis de asma y no tengo inhalador", "silbo al respirar y no tengo inhalador", "se me acabo el inhalador y me ahogo"],
    mensaje: "⚠️ Crisis de asma sin inhalador a mano: sentate derecho (NO te acuestes), aflojá la ropa del cuello y del pecho, y respirá lento y profundo tratando de mantener la calma (los nervios empeoran el ahogo). Buscá aire fresco, lejos de humo, frío seco o de lo que lo gatilló. Un café o té cargado (cafeína) puede ayudar un poco. Si aparece un inhalador (tuyo o de otra persona), usalo. Pedí ayuda.",
    items: [],
    cuandoConsultar: "URGENTE (131) si los labios o uñas se ponen azules, no puede hablar de corrido, se agota, se confunde, o el silbido desaparece porque casi no entra aire: es grave, rescate ya." },
  { id: "anzuelo", titulo: "Anzuelo clavado", sintomas: ["se me clavo un anzuelo", "tengo un anzuelo clavado", "me clave el anzuelo en el dedo", "anzuelo clavado", "se me enterro un anzuelo"],
    mensaje: "Anzuelo clavado: NO lo saques tirando hacia atrás si ya pasó la púa (el arpón desgarra al salir). Si es superficial y la púa no entró del todo, podés retirarlo con cuidado por donde entró. Si la púa quedó adentro, mejor dejalo puesto, cortá el sedal, cubrí la zona y andá a que te lo saquen bien. Lavá, desinfectá y vigilá infección.",
    items: ["antiseptico", "gasas"],
    cuandoConsultar: "Anzuelo en la cara, el ojo, cerca de una articulación o de un vaso grande, o si se infecta: no lo toques, consultá. Revisá que tengas la antitetánica al día." },
  { id: "sangrado-anticoagulantes", titulo: "Sangrado tomando anticoagulantes", sintomas: ["tomo anticoagulantes y me corte", "estoy con sintrom y sangro", "tomo warfarina y no para el sangrado", "sangro mucho y tomo anticoagulantes", "me corte y tomo diluyentes de sangre", "tomo anticoagulantes y me golpee"],
    mensaje: "⚠️ Si tomás anticoagulantes (warfarina/Sintrom o los nuevos) y te cortaste o golpeaste: el sangrado cuesta más de frenar y un golpe puede sangrar por dentro. Hacé PRESIÓN directa firme y sostenida bastante MÁS tiempo que lo normal (15-20 min sin espiar). Si fue un golpe en la cabeza o la panza, aunque no sangre por fuera, tomalo en serio.",
    items: ["gasas", "vendas"],
    cuandoConsultar: "URGENTE si el sangrado no para con presión, fue un golpe en la cabeza (aunque estés bien ahora), o aparece dolor de cabeza, vómitos, moretones grandes, sangre en la orina o la caca, o mucha debilidad: rescate." },
  { id: "quemadura-combustible", titulo: "Quemadura con combustible / hornillo", sintomas: ["me queme con el calentador", "se prendio fuego la bencina", "me queme con la bencina blanca", "quemadura con el gas del calentador", "se me derramo el combustible y se prendio", "me queme con el hornillo"],
    mensaje: "Quemadura con combustible/hornillo: si hay ropa con combustible encendido, apagá las llamas (tirate y rodá o tapá con una manta) y sacá la ropa que NO esté pegada a la piel. Enfriá la quemadura con agua fresca corriente 10-20 min (no hielo). No revientes ampollas, cubrí con gasa limpia. Ventilá bien si hubo humo o gas.",
    items: ["gasas"],
    cuandoConsultar: "Quemadura grande, profunda, en cara/manos/genitales, o si respiró humo/gas (tos, hollín, voz ronca, cuesta respirar): emergencia, pedí rescate." },
  { id: "ojo-objeto", titulo: "Algo metido o clavado en el ojo", sintomas: ["se me metio algo en el ojo", "tengo algo clavado en el ojo", "me entro una rama en el ojo", "me salto algo al ojo", "tengo una basurita en el ojo", "me clave algo en el ojo", "algo en el ojo que no sale"],
    mensaje: "Si te entró una basurita/tierra al ojo: NO te lo refriegues. Parpadeá seguido y lavá con agua limpia o suero, desde el lado de la nariz hacia afuera. Si algo quedó CLAVADO en el ojo, NO lo saques ni aprietes: cubrí los DOS ojos flojito (para que el ojo lastimado no se mueva) y andá a que te lo saquen. (El reflejo del sol en la nieve también quema los ojos: mirá 'ceguera de nieve'.)",
    items: ["suero fisiologico", "gasas"],
    cuandoConsultar: "Objeto clavado, dolor fuerte, ves borroso, no podés abrir el ojo, o hubo un golpe con sangre dentro del ojo: urgente, no te toques el ojo y consultá." },
  { id: "torsion-testicular", titulo: "Dolor testicular repentino y fuerte", sintomas: ["me duele mucho un testiculo de repente", "dolor fuerte en un testiculo", "se me hincho y duele un testiculo", "dolor testicular repentino", "me duele un huevo de golpe y fuerte", "me agarro un dolor fuerte en un testiculo"],
    mensaje: "⚠️ Dolor MUY fuerte y REPENTINO en un testículo (sin que haya un golpe, a veces con náuseas y el testículo más alto o hinchado) puede ser una TORSIÓN: el cordón se retuerce y corta la sangre al testículo. Es una emergencia con el reloj en contra (se salva mucho mejor en las primeras horas). No esperes a ver si pasa solo.",
    items: [],
    cuandoConsultar: "Andá a urgencia YA (131). Si fue por un golpe, mirá también 'golpe en los genitales'; pero un dolor intenso y repentino SIN golpe hay que tratarlo como torsión hasta que un médico diga lo contrario." },
  { id: "parto-emergencia", titulo: "Parto de emergencia", sintomas: ["se adelanto el parto", "va a tener el bebe aca", "esta por dar a luz", "parto de emergencia", "esta pariendo", "el bebe ya viene y no llegamos", "se le rompio la bolsa y viene el bebe"],
    mensaje: "Parto de emergencia (si ya no hay tiempo de llegar): pedí rescate y mantené la calma. Lavate las manos y poné mantas/ropa limpia debajo. Dejá que el bebé salga solo, sostenelo (NO tires ni apures). Cuando salga, ponelo sobre el pecho de la mamá piel con piel, secalo y abrigalo (cabeza incluida) y limpiale suave la boca y la nariz. NO cortes el cordón: dejalo y envolvé a los dos juntos. La placenta sale sola después; guardala. Mantené a ambos bien abrigados.",
    items: ["manta termica", "gasas"],
    cuandoConsultar: "Siempre pedí rescate. URGENTE si sale primero un pie, una mano o el cordón (no la cabeza), si la mamá sangra mucho, o si el bebé no respira ni llora (secalo y estimulá su espalda; si no respira, RCP de bebé)." },
  { id: "ayuda-general", sintomas: ["no se que tengo", "no se que me pasa", "que hago", "que hago ahora", "ayuda que hago", "es una emergencia", "necesito ayuda urgente", "auxilio que hago", "no se que hacer", "que hago doctor", "estoy en problemas"],
    mensaje: "Tranquilo/a, estoy con vos. Para ayudarte mejor, decime en pocas palabras qué pasa 👇\n• ¿Hay sangre, un golpe o un hueso raro?\n• ¿Cuesta respirar o alguien no responde? (eso es URGENTE)\n• ¿Dolor, fiebre, náuseas, frío?\nEscribilo simple o tocá una opción.",
    items: [],
    cuandoConsultar: "Si alguien no respira, no responde, sangra mucho o se está poniendo morado: es urgente, pedí rescate y empezá por eso." }
];

/* ============================================================================
   REGLAS — intención de ALTA confianza. Antes de la búsqueda difusa, si la
   frase tiene una señal inequívoca (un verbo de lesión, un pedido de pastilla)
   la mandamos directo al destino correcto. Así "me corté el tobillo" va a
   sangrado (no a esguince) y "algo para el dolor" va a qué tomar.
   El texto llega normalizado (minúsculas, sin acentos). Primera que matchea gana.
   ============================================================================ */
const REGLAS = [
  // === GUÍAS "CÓMO HAGO..." — preguntas educativas, van antes que las
  // señales de peligro (preguntar cómo hacer RCP no es la emergencia en sí). ===
  { re: /como (hago|hacer|se hace|dar|doy) (el |la )?(rcp|reanimacion|masaje cardiaco|compresiones|reanimacion cardiopulmonar)|rcp paso a paso|como reanim|como revivir a alguien|como hago las compresiones/, tipo: "consejo", id: "rcp" },
  { re: /(como|respiracion) (doy|dar|hacer|se hace|le doy)? ?(respiracion )?(boca a boca|de rescate|artificial)|como le soplo aire|como darle aire/, tipo: "consejo", id: "boca-a-boca" },
  { re: /posicion (de recuperacion|lateral)|como (pongo|acuesto|coloco|lo pongo) a? ?alguien? (de costado|de lado|inconsciente)|esta (inconsciente|desmayad).{0,16}(pero )?respira|como lo pongo de (costado|lado)|respira pero (esta inconsciente|no responde)/, tipo: "consejo", id: "posicion-recuperacion" },
  { re: /^(?!.*\b(bebe|guagua|lactante)\b)(?:maniobra de heimlich|como (hago|hacer) (la )?heimlich|como (desatoro|saco (la comida|algo) (atorad|de la garganta))|como ayudo a alguien que se (ahoga|atraganta)|como saco la comida atorada)/, tipo: "consejo", id: "heimlich" },
  // como detener una hemorragia
  { re: /como (paro|detengo|freno|corto) (el |la |una )?(sangrado|hemorragia|sangre)/, tipo: "sit", id: "sangrado" },
  // ====================================================================
  // === LOTE v2.8: rescates específicos (van ANTES que los genéricos) ===
  // ====================================================================
  // bebé/niño chico atragantado -> NO Heimlich (golpes espalda + pecho con 2 dedos)
  { re: /(bebe|guagua|lactante|nino chico|criatura|mi hijo chico).{0,30}(se atragant|se atoro|se ahoga|atragantad|no puede respirar|se esta ahogando)|(atragant|desator|se ahoga|se atoro|se esta ahogando).{0,24}(bebe|guagua|lactante|nino chico)/, tipo: "consejo", id: "atragantamiento-bebe" },
  // me atraganté yo mismo y estoy SOLO -> auto-Heimlich
  { re: /(me atragant|me atore|me estoy atragantando|me ahogo con (comida|algo)).{0,30}(solo|sola|y no hay nadie|nadie cerca)|estoy solo y me (atragant|atore)|como me desatoro solo|me atore solo/, tipo: "consejo", id: "me-atore-solo" },
  // espina / algo clavado en la garganta pero SÍ respira -> no es atragantamiento total
  { re: /espina (de pescado|en la garganta)|trague (una |la )?espina|se me (clavo|atoro) (una |la )?espina (en la garganta|de pescado)|se me clavo una espina en la garganta|(algo|una espina) clavad. en la garganta|tengo algo (clavado|atorado) en la garganta(?!.*no puedo respirar)/, tipo: "consejo", id: "espina-garganta" },
  // lesión de columna / cuello / espalda tras golpe o caída -> NO mover
  { re: /lesion de columna|me (lastime|golpee|fracture|quebre|fisure) la columna|me (lastime|golpee|fisure|jodi) la espalda (en|tras|por|de|con|cuando|al) .{0,12}(caida|caer|cai|golpe|accidente|cayendo)|me duele (el cuello|la espalda|la columna) (despues de|tras|por) (un |el |la )?(golpe|caida|caer|accidente|costalazo|porrazo)|(me cai|se cayo|cai|caida|me caigo|golpe|accidente).{0,36}no (siento|puede mover|puedo mover|muevo|mueve) (las piernas|los brazos|el cuerpo|las manos|los pies|el cuello)|no (siento|puede mover|puedo mover|muevo|mueve) (las piernas|los brazos|el cuerpo|las manos|los pies).{0,30}(cai|caida|golpe|caer|cayo|accidente)|no me muevo despues de (la caida|caer|el golpe)|me duele la espalda y no siento las piernas/, tipo: "consejo", id: "lesion-columna" },
  // convulsión por fiebre en niño/bebé (antes que la convulsión genérica)
  { re: /convulsion febril|(nino|bebe|guagua|mi hijo|el nino).{0,24}fiebre.{0,24}(convuls|le dio un ataque|temblando)|fiebre.{0,18}(convuls|le dio un ataque).{0,18}(nino|bebe|hijo|guagua)/, tipo: "consejo", id: "convulsion-febril" },
  // alergia grave SIN adrenalina disponible
  { re: /(alergia grave|anafilaxia|se (le )?hincha|reaccion alergica grave|se le cierra la garganta).{0,30}(no tengo|sin) (la )?(adrenalina|epipen|autoinyector)|no tengo (la )?(adrenalina|epipen|autoinyector)/, tipo: "consejo", id: "anafilaxia-sin-adrenalina" },
  // golpe de calor GRAVE (confusión, no suda, delira, se desmaya) -> emergencia
  { re: /golpe de calor (grave|fuerte|con desmayo)|(confundido|confusion|delira|delirando|no suda|piel (caliente y seca|seca y caliente|roja y caliente)).{0,30}(calor|insolad|del sol|al sol|tanto sol|mucho sol)|(calor|al sol|del sol|tanto sol|mucho sol).{0,30}(confundido|confusion|delira|delirando|no suda|rojo y caliente)/, tipo: "consejo", id: "golpe-calor" },
  // hemorragia interna tras golpe fuerte (palidez, sudor frío, panza dura)
  { re: /hemorragia interna|sangrado interno|(golpe fuerte|me golpee fuerte|me cai fuerte|me pegaron fuerte|me golpearon fuerte).{0,34}(palid|sudor frio|maread|cada vez peor|me siento peor)|(panza|barriga|abdomen|guata) (dura|hinchada|rigida).{0,24}(golpe|cai|despues)|(golpe|cai|porrazo).{0,30}(panza|barriga|abdomen|guata).{0,8}(dura|rigida|hinchada e|e hinchada)|(palid|sudor frio|maread).{0,22}despues de (un|el) golpe/, tipo: "consejo", id: "hemorragia-interna" },
  // aplastamiento / atrapado bajo algo pesado
  { re: /me aplasto (una |la )?(roca|piedra|tronco|maquina|algo)|aplastamiento|quede (atrapad|aplastad).{0,8}(bajo|debajo) (de )?(una |un |el |la )?(roca|piedra|tronco|arbol|auto|maquina|peso|algo pesado)|me cayo (una |la )?(roca|piedra|tronco|algo pesado) encima|tengo (la|el|una) (pierna|brazo|mano) aplastad|(atrapad|quedo atrapad).{0,8}(la|el|una) (pierna|brazo|mano).{0,10}(bajo|debajo) (de )?(una |un |el |la )?(roca|piedra|tronco|peso)/, tipo: "consejo", id: "aplastamiento" },
  // edema de altura (HAPE / HACE) — reconocimiento de las formas graves
  { re: /\bhape\b|edema (pulmonar|cerebral)( de altura)?|edema de altura|tos con espuma|que es el edema de altura|como se que es edema/, tipo: "consejo", id: "edema-altura" },
  // ---- LOTE v3.1: más casos de montaña ----
  // ropa en llamas -> detente/tírate/rueda (antes que quemadura genérica)
  { re: /se me (prendio|incendio) (fuego )?la ropa|me prendi fuego|tengo la ropa (en llamas|prendida|con fuego)|se prendio fuego mi ropa|me agarro fuego la ropa|estoy en llamas/, tipo: "consejo", id: "ropa-fuego" },
  // picadura de abeja/avispa DENTRO de la boca o garganta -> riesgo de vía aérea
  { re: /me pico (una |un )?(abeja|avispa|bicho|insecto).{0,14}(en la boca|en la lengua|en la garganta|adentro de la boca)|(pico|picadura) (en la|dentro de la) (boca|lengua|garganta)|me pico (en la|la) (lengua|boca|garganta)|trague (una |un )?(abeja|avispa) y me pico/, tipo: "consejo", id: "picadura-boca" },
  // sobredosis / mezcla de medicamentos
  { re: /sobredosis|tome de mas (la |el |un |una )?(pastillas?|remedios?|medicament|ibuprofeno|paracetamol)|me pase con (las |los )?(pastillas?|remedios?|medicament)|tome (muchas|demasiadas|dos veces|de mas) (pastillas?|remedios?)|mezcle (pastillas?|remedios?|medicament)|me tome de mas el remedio|tome muchos remedios|me equivoque y tome (mucho|de mas)/, tipo: "consejo", id: "sobredosis-medicamento" },
  // tomé demasiada agua -> hiponatremia
  { re: /hiponatremia|intoxicacion por agua|tome (muchisima|demasiada|litros de) (agua|liquido)|tome (mucha|tanta|mucho) (agua|liquido).{0,22}(mal|hinchad|confundid|nausea|no orino)|me hinche de (tomar|tanta) agua/, tipo: "consejo", id: "hiponatremia" },
  // ¿puedo tomar esta agua? -> agua segura
  { re: /(puedo|se puede|es seguro) (tomar|beber) (agua del|del rio|de la vertiente|del estero|agua de|nieve)|agua (del rio|de la vertiente|del estero|de deshielo|de la montana) (es segura|se puede tomar|potable|esta buena)|como (purifico|potabilizo|hago segura|hiervo|filtro) (el )?agua|puedo tomar (nieve derretida|del rio|de la vertiente|de deshielo)|el agua .{0,14}(es segura|potable|se puede tomar)/, tipo: "consejo", id: "agua-segura" },
  // cómo prevenir el soroche / aclimatación (antes que las reglas de mal de altura)
  { re: /como (prevengo|evito|no me da|puedo evitar) (el |la )?(soroche|mal de altura|mal de montana|puna|apunamiento)|como me aclimato|aclimatacion|como (subir|ascender) sin (enfermarme|soroche|que me de la altura)|(tips|consejos|recomendaciones) para (la altura|el soroche|subir)|prevenir (el )?(soroche|mal de altura|mal de montana)|cada cuanto (debo )?subir/, tipo: "consejo", id: "prevencion-altura" },
  // ---- LOTE v3.2: más casos de montaña ----
  // parto de emergencia
  { re: /parto (de emergencia|adelantado)|se adelanto el parto|va a (tener|nacer) el bebe|esta (por )?(dar a luz|pariendo)|el bebe (ya )?viene|se le rompio la bolsa|esta de parto|voy a tener el bebe (aca|ahora|ya)/, tipo: "consejo", id: "parto-emergencia" },
  // torsión testicular -> dolor testicular repentino/fuerte SIN golpe (emergencia)
  { re: /torsion testicular|dolor testicular (repentino|fuerte|intenso)|(me duele|dolor|duele).{0,16}(un |el )?(testiculo|huevo|teste).{0,18}(de repente|de golpe|repentin|muy fuerte|fuerte)|(de repente|repentin).{0,14}(dolor|duele).{0,14}(testiculo|huevo)|se me (hincho|subio).{0,10}(un |el )?testiculo/, tipo: "consejo", id: "torsion-testicular" },
  // algo en el ojo (basurita / clavado) -> antes que objeto-clavado y ceguera-nieve
  { re: /(se me metio|me entro|me salto|me clave|tengo) (algo|una rama|una basurita|tierra|una astilla|un palo|una pestana|arena) (en el|al) ojo|algo (clavado|metido) en el ojo|algo en el ojo que no (sale|puedo sacar)|se me metio algo en el ojo|tengo algo en el ojo/, tipo: "consejo", id: "ojo-objeto" },
  // sangrado en persona con anticoagulantes
  { re: /(anticoagulant|sintrom|warfarina|acenocumarol|diluyente. de sangre|adelgazante. de sangre).{0,30}(corte|sangr|golpe|no para)|(corte|sangr|golpe|no para|me golpee|me corte).{0,30}(anticoagulant|sintrom|warfarina|diluyente. de sangre)|tomo anticoagulantes/, tipo: "consejo", id: "sangrado-anticoagulantes" },
  // anzuelo clavado -> antes que objeto-clavado
  { re: /anzuelo|me clave (el |un )?anzuelo|se me (clavo|enterro) (el |un )?anzuelo/, tipo: "consejo", id: "anzuelo" },
  // crisis de asma SIN inhalador -> antes que asma
  { re: /(asma|me falta el aire|silbo|crisis de asma|ataque de asma).{0,28}(sin inhalador|no tengo (el )?inhalador|perdi (el )?inhalador|se me acabo el inhalador)|(sin inhalador|no tengo inhalador|perdi el inhalador|se me acabo el inhalador).{0,28}(asma|aire|silb|ahog)/, tipo: "consejo", id: "asma-sin-inhalador" },
  // quemadura con combustible / hornillo -> antes que quemadura genérica
  { re: /me queme (con (el |la )?)?(bencina|combustible|hornillo|calentador|parafina|gas blanco|bencina blanca|gas del (calentador|hornillo))|se (prendio|derramo) (fuego )?(la |el )?(bencina|combustible|parafina)|quemadura con (el )?(combustible|hornillo|calentador|bencina)/, tipo: "consejo", id: "quemadura-combustible" },
  // ========================================================================
  // SEÑALES DE PELIGRO — máxima prioridad. Si alguien describe algo que pone
  // en riesgo la vida, va directo a la emergencia correcta aunque lo escriba
  // raro. (La nariz que sangra se evalúa más abajo y no entra acá.)
  // ========================================================================
{ re: /\bno (respira|esta respirando|puede respirar)|dejo de respirar|no le sale aire|se (puso|esta poniendo|pone) (morad|azul)|esta (morad|azul)|labios azules|no reacciona|no responde|no despierta|esta inconsciente|perdio el conocimiento|sin pulso|no tiene pulso|no se despierta|se desmayo|se desvanecio|se desplomo|esta desmayad|esta tirad.{0,18}no (se mueve|responde|reacciona)|esta tirado (en el suelo|inconsciente)|no reacciona ni se mueve/, tipo: "sit", id: "inconsciente" },
{ re: /se (esta )?ahog(a|ando) con (comida|algo)|se atragant|se atoro con|atragantad|tiene algo atorado|comida atorada|\bme atore\b|\bme atragante\b|me estoy atragantando/, tipo: "sit", id: "atragantamiento" },
{ re: /convulsion|convulsiona|le dio un ataque|esta temblando todo el cuerpo|epilep|ataque epilep/, tipo: "sit", id: "convulsion" },
{ re: /mucha sangre|sangre por todos lados|chorro de sangre|brota sangre|sangra a chorro|perdiendo mucha sangre|no puedo parar la sangre|no para la hemorragia/, tipo: "sit", id: "sangrado" },
{ re: /me mordio (una |la )?(vibora|serpiente|culebra)|mordedura de (vibora|serpiente|culebra)|me pico (una )?(vibora|serpiente)/, tipo: "consejo", id: "mordedura-serpiente" },
{ re: /arana del? rincon|loxoscel|me (mordio|pico) (la |una )?arana del? rincon|arana del? rincon me (mordio|pico)/, tipo: "consejo", id: "arana-rincon" },
{ re: /viuda negra|arana del trigo|arana de trigo|poto colorado|trasero colorado|latrodect/, tipo: "consejo", id: "arana-trigo" },
{ re: /me pico (un |una )?(alacran|escorpion)|picadura de (alacran|escorpion)|\balacran\b|\bescorpion\b/, tipo: "consejo", id: "picadura-alacran" },
{ re: /me (pico|mordio) (una |la )?arana|picadura de arana/, tipo: "consejo", id: "arana-rincon" },
  // dolor de pecho que se irradia al brazo (posible infarto) -> máxima prioridad
  { re: /me duele el pecho|dolor (de|en el) pecho|opresion en el pecho|me aprieta el pecho|se me aprieta el pecho|dolor de pecho.{0,45}brazo|pecho.{0,30}brazo izquierdo|parece un infarto|creo que es un infarto/, tipo: "sit", id: "pecho" },
  // garganta/cara/lengua que se hincha (anafilaxia) -> alergia grave
  { re: /se me (cierra|hincha) la garganta|se me hincha la (lengua|cara|boca)|se le hincha la (cara|garganta|lengua)|hinchazon de (garganta|lengua|labios|cara)|se (le )?hincha.{0,20}cuesta respirar|cuesta respirar.{0,20}se (le )?hincha/, tipo: "sit", id: "alergia" },
  // tímpano / oído reventado (NO es fractura de hueso) -> antes que hueso
  { re: /se me (rompio|revento|perforo) (el )?(oido|timpano|tambor del oido)|me revente el oido|se me rompio el tambor/, tipo: "consejo", id: "timpano" },
  // humo / inhalación -> salir al aire (antes que asma/pecho)
  { re: /(mucho |trague |respire |inhale )?humo.{0,20}(respirar|me ahogo|me cuesta|carpa|fogata|fuego)|trague humo|inhale humo|respire humo|me ahogo con el humo|intoxicacion por humo/, tipo: "consejo", id: "humo" },
  // sensación de desmayo (pre-síncope)
  { re: /(siento|creo) que me (voy a |) ?(desmayo|voy a desmayar|desvanezco)|estoy (por|a punto de) desmayar|me voy a desmayar|veo todo negro|me falta poco para desmayarme/, tipo: "consejo", id: "pre-desmayo" },
  // flato / puntada al correr
  { re: /\bflato\b|me dio flato|puntada (en el|al) costado|puntada de tanto (correr|caminar)|me duele el costado (al|de tanto) (correr|caminar)/, tipo: "consejo", id: "flato" },
  // mareo por movimiento (auto/bus)
  { re: /me mareo en (el|la) (auto|bus|micro|combi|colectivo|camioneta|viaje)|mareo de (auto|bus|viaje)|cinetosis|me mareo viajando|me dan nauseas en el (auto|bus)/, tipo: "consejo", id: "mareo-movimiento" },
  // rozadura por mochila/ropa/zapato
  { re: /me roza(ron|) (las correas|la mochila|la entrepierna|el zapato|la ropa)|tengo rozadura|me roza.{0,12}(caminar|mochila|zapato)|rozadura entre las piernas|me pelo la correa/, tipo: "consejo", id: "rozadura" },
  // golpe en genitales
  { re: /(patada|golpe|me golpee|me pegue|me pegaron).{0,16}(testiculos|huevos|genitales|las partes|la ingle|ahi abajo)|me golpee ahi abajo/, tipo: "consejo", id: "golpe-genitales" },
  // contacto con planta urticante (ortiga)
  { re: /toque una ortiga|me pico una ortiga|toque una planta y me (arde|pica)|me roce con una planta|planta urticante|me salieron ronchas por una planta/, tipo: "consejo", id: "planta-urticante" },
  // aftas / llagas en la boca
  { re: /\bafta\b|\baftas\b|llagas? en la boca|llaga en la lengua|me salio un afta|herida en la boca que arde/, tipo: "consejo", id: "aftas" },
  // presión alta
  { re: /(me|se me) subio la presion|tengo (la )?presion (alta|arterial alta|por las nubes)|presion (arterial )?alta|alta (la )?presion/, tipo: "consejo", id: "presion-alta" },
  // mordí la lengua / partí el labio (herida en la boca por golpe/mordiscón)
  { re: /me mordi (la lengua|el cachete|el labio|adentro)|me parti el labio|me reventaron el labio|sangra (la lengua|el labio)|me corte la lengua|mordiscon en la lengua/, tipo: "consejo", id: "boca-herida" },
  // escalofríos / tiritón -> suele ser fiebre
  { re: /escalofrios|escalofrio|tiritando de fiebre|me agarraron escalofrios/, tipo: "consejo", id: "fiebre" },
  // quemadura de SOL / piel pelada por el sol (antes que raspón/quemadura)
  { re: /me pele.{0,14}(del sol|por el sol|con el sol)|me queme.{0,12}(con el |el |del )sol|piel (pelada|quemada|roja) (del|por el) sol|me queme la (cara|nariz|piel|espalda) (con|del) sol|quemadura de sol|me insole la piel/, tipo: "consejo", id: "quemadura-sol" },
  // picadura de abeja/avispa + cuesta respirar/se hincha -> alergia grave
  { re: /(cuesta respirar|se (le )?hincha|no puede respirar|hinchazon).{0,30}(picadura|abeja|avispa|me pico)|(picadura|abeja|avispa|me pico).{0,30}(cuesta respirar|se (le )?hincha|no puede respirar|hinchazon)/, tipo: "sit", id: "alergia" },
  // mareo / vértigo (todo gira)
  { re: /todo me gira|todo gira|tengo vertigo|\bvertigo\b|me da vueltas todo|siento que (todo )?gira/, tipo: "consejo", id: "mareo" },
  // calambre / acalambrado
  { re: /\bcalambre|se me acalambro|me acalambre|se me acalambraron/, tipo: "consejo", id: "calambre" },
  // miembro dormido (se durmió el brazo) -> molestia general (no es ACV)
  { re: /se me (durmio|adormecio|adormecieron) (el brazo|la mano|la pierna|el pie|el dedo)|tengo el (brazo|pie|la mano) dormid/, tipo: "consejo", id: "dolor-muscular" },
  // dolor muscular por esfuerzo / agujetas / todo el cuerpo
  { re: /me duelen los musculos|tengo agujetas|me duele todo el cuerpo|me duele el cuerpo (de|despues de)|estoy molido|me duele todo (de|despues de) (caminar|correr|la caminata|el ejercicio|entrenar)|me duelen las piernas de (tanto )?(caminar|correr)/, tipo: "consejo", id: "dolor-muscular" },
  // gases / hinchazón / boca del estómago -> panza
  { re: /muchos gases|ando con gases|tengo gases|flatulencia|hinchado de gases|panza hinchada|me duele la boca del estomago(?! y vomito sangre)|boca del estomago/, tipo: "consejo", id: "panza" },
  // vomité varias veces (sin sangre) -> náuseas
  { re: /vomite (muchas|varias|un par de|como \w+) veces|vomite mucho|no paro de vomitar|vomito mucho|vomite un monton|estuve vomitando/, tipo: "consejo", id: "nauseas" },
  // perdí la voz / afonía -> garganta
  { re: /perdi la voz|me quede afonico|estoy afonico|me quede ronco|\bafonia\b|no me sale la voz/, tipo: "consejo", id: "garganta" },
  // ampollas en los pies -> ampolla
  { re: /me salieron ampollas|me salio una ampolla|me ampolle|tengo (una )?ampolla|ampollas en (el pie|los pies|el talon|la mano)/, tipo: "consejo", id: "ampolla" },
  // golpe en un miembro (codo, etc.) -> contusión
  { re: /me golpee (el|la) (codo|antebrazo|muslo|espinilla|hombro|cadera|canilla|rodilla del golpe)/, tipo: "consejo", id: "contusion" },
  // descompuesto por el calor -> insolación
  { re: /(descompuesto|mal|mareo|nausea|malestar|me siento mal|me descompuse) (del|por el|con el) calor|me descompuse del calor/, tipo: "consejo", id: "insolacion" },
  // no poder moverse del todo / golpe en la espalda con inmovilidad -> serio
  { re: /no (puedo|me puedo) mover(me)?\b|me golpee la espalda.{0,20}no (puedo|me puedo) mover|no me puedo levantar del (golpe|dolor)/, tipo: "sit", id: "hueso" },
  // ACV / derrame (FAST): cara torcida, no habla, no mueve un lado
{ re: /se le (tuerce|torcio|cayo|durmio) (la )?(cara|media cara)|boca chueca|cara torcida|no (puede|le sale) hablar|habla raro|se le traba la lengua|no mueve un (brazo|lado)|no mueve la mitad|perdio fuerza en un lado|derrame cerebral|\bacv\b/, tipo: "consejo", id: "acv" },
  // ataque de asma / broncoespasmo
{ re: /ataque de asma|crisis de asma|broncoespasmo|asma y (me ahogo|no puedo respirar|me falta el aire)|soy asmatico|me agarro el asma|silbo al respirar|pita el pecho/, tipo: "consejo", id: "asma" },
  // shock: necesita la COMBINACIÓN (palidez + sudor frío/pulso débil), no
  // "sudor frío" suelto (eso también es bajón de azúcar o susto)
{ re: /esta en shock|(esta |se puso )?(muy )?palid[oa].{0,16}(sudor|sudando) frio|(sudor|sudando) frio.{0,16}(palid|pulso debil|debil)|pulso debil( y palid)?|se puso palid|palid[oa] y (debil|maread)|esta blanco y (con sudor|debil)/, tipo: "consejo", id: "shock" },
  // rayo / tormenta eléctrica
{ re: /me cayo un rayo|nos cayo un rayo|le cayo un rayo|cayo un rayo|tormenta electrica|me electrocuto un rayo|hay muchos rayos|tormenta con rayos/, tipo: "consejo", id: "rayo" },
  // cara/nariz/mandíbula rota de un golpe -> trauma de cabeza (no fractura genérica)
{ re: /(rompi|quebre|fracture|parti|reventaron|rompieron|destroce).{0,14}(la cara|la nariz|la mandibula|el pomulo|la mejilla|el craneo)|se me rompio la cara|me rompieron la cara|me reventaron la cara/, tipo: "sit", id: "cabeza" },
  // amputación / dedo cortado entero (antes que sangrado)
{ re: /me corte (un |el )?dedo (entero|completo)|me corte (un |el )?(dedo|mano|pie) (entero|completo)|se me corto (un |el )?dedo|me amputaron|amputacion|perdi (un |el )?dedo|me corte la punta del dedo|me corte un pedazo de dedo/, tipo: "consejo", id: "amputacion" },
  // costilla golpeada/rota (antes que fractura genérica)
{ re: /(rompi|quebre|fracture|parti|pegue|golpe).{0,14}costilla|costilla.{0,16}(rota|quebrada|al respirar|fracturada)|me duele (el costado|al respirar) (despues|tras) (de |del )?(un )?golpe/, tipo: "consejo", id: "costilla" },
  // dedo machucado / aplastado
{ re: /me machuque|me aplaste (el |un )?(dedo|la una|una)|me pille el dedo|me agarre el dedo|me golpee el dedo con|una (morada|negra)|se me puso negra la una|me reviente el dedo/, tipo: "consejo", id: "dedo-machucado" },
  // garrapata
{ re: /garrapata/, tipo: "consejo", id: "garrapata" },
  // apendicitis / dolor abdominal bajo derecho
{ re: /apendicitis|dolor.{0,22}(abajo a la derecha|parte baja derecha|lado derecho de la panza|abdominal.{0,6}derecha)|me duele.{0,16}(abajo a la derecha|la parte baja derecha)/, tipo: "consejo", id: "apendicitis" },
  // perdido / extraviado
{ re: /estoy perdido|me perdi|no se donde estoy|perdi (el camino|la huella|el sendero)|no encuentro el sendero|no se como volver|me extravie/, tipo: "consejo", id: "perdido" },
  // agotamiento / no puedo más
{ re: /estoy (agotado|exhausto|reventado|muerto de cansancio)|no puedo mas|no doy mas|no me dan las piernas|no puedo seguir caminando|me quede sin fuerzas|no aguanto mas el cansancio|estoy que no doy mas/, tipo: "consejo", id: "agotamiento" },
  // bajón de azúcar / debilidad con temblor y sudor frío -> hipoglucemia
  { re: /bajon de azucar|azucar baja|hipoglucemia|sin fuerzas y (tiemblo|tembloroso)|cero fuerza y tiemblo|tiemblo y (sudo frio|no tengo fuerza)|sudor frio y (hambre|debilidad)/, tipo: "consejo", id: "hipoglucemia" },
  // caída fuerte genérica (me saqué la cresta, me fui al suelo) -> golpe/triage
  { re: /^(?!.*\b(cabeza|craneo|nuca|cabezazo)\b).*(\bme cai fuerte\b|me fui al suelo de golpe|me cai (esquiando|patinando|en la nieve)|me pegue un (golpazo|costalazo))/, tipo: "sit", id: "rodilla" },

  // === LOTE NUEVO: cuadros médicos y de montaña adicionales ===
  // golpe en la CABEZA -> trauma (antes que el dolor de cabeza común)
  { re: /me (golpee|pegue|di) (un golpe )?(fuerte )?(en )?la cabeza|me di un cabezazo|golpe (fuerte )?en la cabeza|me cai.{0,18}(y )?me (golpee|pegue) la cabeza|me chante la cabeza|me pegue en la nuca/, tipo: "sit", id: "cabeza" },
  // herida en la ceja / corte por golpe en cara (no es tímpano ni hueso)
  { re: /me (abri|corte|revento|parti|rompi) (la |una )?ceja|se me (abrio|revento|partio) la ceja|me abri la (frente|ceja)/, tipo: "sit", id: "sangrado" },
  // ronchas / picazón en todo el cuerpo -> reacción alérgica
  { re: /me pica todo el cuerpo|me pica todo|me llene de ronchas|tengo ronchas|me salieron ronchas|picazon en (todo )?el cuerpo|urticaria/, tipo: "sit", id: "alergia" },
  // retortijones / cólicos de panza
  { re: /retortijones|retortijon|me agarraron retortijones|colicos? de (panza|estomago|guata)/, tipo: "consejo", id: "panza" },
  // no poder tragar / duele al tragar -> garganta
  { re: /no puedo tragar|me cuesta (mucho )?tragar|no logro tragar|me duele (mucho )?al tragar|me arde al tragar/, tipo: "consejo", id: "garganta" },
  // resfrío / congestión / tos
  { re: /tos seca|tos con flema|ataque de tos|estoy (todo )?congestionad|tengo congestion|nariz tapada|estoy resfriad|me agarro un resfrio|tengo gripe|estoy engripad|tengo mocos|me sale moco/, tipo: "consejo", id: "resfrio" },
  // partes del cuerpo congeladas -> frío (los pies mojados+fríos van a pie-trinchera)
  { re: /(nariz|orejas|oreja|cara|mejillas|manos|dedos|labios) congelad|se me congelo (la nariz|la cara|las orejas|las manos|los dedos)|tengo (la nariz|las orejas|los dedos|las manos) (helad|congelad)|no (me )?siento (la cara|la nariz|las orejas) (del |por el )?frio|no me siento la cara del frio/, tipo: "sit", id: "frio" },
  // sed / sin agua -> deshidratación (no caída al agua)
  { re: /tengo mucha sed|me quede sin agua|estoy deshidratad|tengo la boca muy seca|no tengo agua y tengo sed|me muero de sed|estoy muerto de sed|muerto de sed/, tipo: "consejo", id: "deshidratacion" },
  // algo en el ojo / ojo rojo (irritación, sin nieve) -> ojo
  { re: /me entro (algo|tierra|una basurita|polvo|una pestaña) (al|en el) ojo|tengo algo en el ojo|me arde el ojo|me pica el ojo|tengo (los |el )?ojos? rojos?|ojo irritado|se me metio algo en el ojo/, tipo: "consejo", id: "ojo" },
  // astilla / espina clavada (herida chica) -> astilla
  { re: /me clave una (astilla|espina)|tengo una (astilla|espina) clavada|se me clavo una (astilla|espina)|espina clavada|tengo una espina/, tipo: "consejo", id: "astilla" },
  // pisar un clavo/vidrio (herida punzante) -> sangrado/herida
  { re: /pise un (clavo|vidrio|fierro|palo)|me clave un clavo en el pie|se me clavo un (clavo|vidrio) en el pie/, tipo: "sit", id: "sangrado" },
  // golpe/moretón en un miembro (sin herida) -> contusión
  { re: /me salio un moreton|tengo un moreton|me sale un cardenal|me di un golpe fuerte en (la|el) (pierna|brazo|muslo|hombro|espalda|cadera)|me pegue (fuerte )?en (la|el) (pierna|brazo|muslo|hombro|espalda)|me magulle|golpe morado/, tipo: "consejo", id: "contusion" },
  // pregunta por pomada/crema -> qué aplicar
  { re: /me puedo poner (la |una )?(pomada|crema|ungüento)|me pongo (la |una )?(pomada|crema)|que (pomada|crema|ungüento) (me pongo|uso|puedo usar)/, tipo: "consejo", id: "que-tomar" },
  // corazón acelerado SIN dolor -> calmar pulsaciones (no es infarto)
{ re: /(como|debo|quiero|necesito) (bajar|bajo|calmar|calmo|controlar) (las pulsaciones|el pulso|el corazon|el ritmo cardiaco|las palpitaciones)|tengo (el )?corazon (acelerado|a mil|disparado)|me late (muy )?rapido el corazon|se me acelera el corazon|tengo taquicardia|tengo palpitaciones|el corazon a mil|me palpita (el corazon )?(rapido|fuerte)|corazon acelerado/, tipo: "consejo", id: "palpitaciones" },
  // golpe fuerte en el abdomen -> posible daño interno (no es la rodilla)
{ re: /(me golpee|me pegaron|me dieron|recibi un golpe|me pegue|me cai sobre).{0,16}(estomago|panza|abdomen|barriga|guata|boca del estomago|higado|bazo)|golpe (fuerte )?en (la|el) (panza|abdomen|barriga|estomago)/, tipo: "consejo", id: "golpe-abdomen" },
  // no poder mover / no sentir un miembro -> posible fractura o lesión seria
{ re: /no (puedo|logro|consigo) mover (la |el |mi |un |una )?(pierna|brazo|mano|dedo|dedos|pie|rodilla|tobillo|muneca|codo|hombro|cadera)|no siento (la |el )(pierna|brazo)\b|no me responde (la |el )(pierna|brazo|mano)/, tipo: "sit", id: "hueso" },
  // calor (NO confundir con "no entra en calor" = frío)
{ re: /(siento|tengo|hace|me muero de|hay|paso) (mucho |muchisimo |demasiado |tanto )*calor|estoy hirviendo de calor|me estoy (cocinando|derritiendo|asando) de calor|golpe de calor|me insole|estoy acalorado|mucho calor/, tipo: "consejo", id: "insolacion" },
{ re: /me dio (la )?corriente|me electrocute|descarga electrica|toque un cable( pelado)?|me dio una descarga/, tipo: "consejo", id: "electrocucion" },
{ re: /vomito sangre|vomitando sangre|vomite (con )?sangre|sangre en el vomito|devuelvo sangre/, tipo: "consejo", id: "vomito-sangre" },
{ re: /sangre (por|del|sale del) (el )?oido|me sangra el oido|(liquido|sale liquido).{0,14}oido.{0,18}golpe|golpe.{0,18}(sangre|liquido).{0,10}oido/, tipo: "consejo", id: "sangrado-oido" },
{ re: /se (estaba |esta )?ahog(o|aba|ando) (en|dentro)? ?(el |del )?(agua|rio|lago|mar|laguna)|lo sacamos del agua|casi se ahoga (en|nadando)|trago agua y casi se ahoga|se ahogo en (el|un)|rescatamos a alguien del agua|casi me ahogo nadando/, tipo: "consejo", id: "ahogamiento" },
{ re: /hiperglucemia|azucar (alta|muy alta|por las nubes)|aliento dulce|diabetic[oa].{0,20}(mucha sed|me siento mal|\bmal\b)|mucha sed y orino mucho/, tipo: "consejo", id: "hiperglucemia" },
{ re: /comi algo en mal estado|intoxicacion (por |con )?(la )?comida|me cayo mal la comida|me intoxique (con la |comiendo)|comida en mal estado|vomito y diarrea (juntos|al mismo tiempo)|tengo vomitos y diarrea/, tipo: "consejo", id: "intoxicacion-comida" },
{ re: /colico renal|dolor de rinon|piedra en (el )?rinon|calculo renal|me duele el rinon|dolor.{0,22}(espalda baja|espalda|costado|rinon).{0,22}(ingle|testiculo|adelante|al frente)|dolor que (va|baja) de la espalda (a la ingle|al testiculo)/, tipo: "consejo", id: "colico-renal" },
{ re: /lumbago|me bloquee la espalda|me quedo trabada la espalda|no me puedo enderezar|me agarro el lumbago|se me trabo la cintura|tiron en la espalda baja/, tipo: "consejo", id: "lumbago" },
{ re: /me desgarre|se me desgarro( el musculo)?|desgarro muscular|senti que algo se rompio en el musculo|senti un latigazo en el musculo/, tipo: "consejo", id: "desgarro" },
{ re: /pie de trinchera|pies (mojados y (helados|frios)|frios y mojados|congelados y mojados)|tengo los pies mojados y helados|pies blancos y entumecidos por humedad/, tipo: "consejo", id: "pie-trinchera" },
{ re: /sabanones|sabanones|dedos rojos e hinchados por el frio|se me hincharon los dedos con el frio|manchas rojas que pican por el frio|me pican los dedos por el frio/, tipo: "consejo", id: "sabanones" },
{ re: /torticolis|amaneci con el cuello trabado|no puedo girar el cuello|me quedo el cuello duro|cuello trabado|me duele el cuello y no lo puedo mover/, tipo: "consejo", id: "torticolis" },
{ re: /se me metio (un bicho|un insecto|algo|agua) (en|al) ?(el )?oido|tengo (algo|un insecto|un bicho) en el oido|algo me entro al oido/, tipo: "consejo", id: "cuerpo-oido" },
{ re: /ojo morado|ojo en compota|me golpee el ojo|me pegaron en el ojo|ojo hinchado por un golpe|me dieron un ojo|me deje el ojo morado/, tipo: "consejo", id: "ojo-morado" },
{ re: /quemadura quimica|me cayo (algo )?(quimico|acido|lavandina|lejia|soda)|me salpico (quimico|acido)|me entro quimico al ojo|me cayo acido en la piel/, tipo: "consejo", id: "quemadura-quimica" },
{ re: /una encarnada|una encarnada|se me encarno la una|la una se me clava|una enterrada|una del pie encarnada/, tipo: "consejo", id: "una-encarnada" },
{ re: /dolor de regla|colicos? menstruales?|dolor menstrual|me duele por la menstruacion|colicos de la regla|me vino la regla con dolor/, tipo: "consejo", id: "dolor-regla" },
{ re: /herpes labial|fuego en el labio|calentura en el labio|herpes en la boca|ampolla en el labio que arde/, tipo: "consejo", id: "herpes-labial" },
  // dedo roto/quebrado -> manejo propio (entablillar), antes que fractura genérica
{ re: /(me|se me) (rompi|quebre|quebro|fracture|parti).{0,8}(un |el |mi )?dedo|tengo (un |el )?dedo (roto|quebrado|fracturado)|dedo (roto|torcido y roto)|me (rompi|quebre) (un |el )?dedo (de la mano|del pie)/, tipo: "consejo", id: "dedo-roto" },

  // === INTELIGENCIA DE ALTURA / NIEVE (clave en montaña) ===
{ re: /soroche|mal de altura|mal de montana|\bpuna\b|apunad|edema (pulmonar|cerebral)|mal de las alturas/, tipo: "sit", id: "altura" },
{ re: /(dolor de cabeza|duele.{0,12}cabeza|jaqueca|nausea|vomit|mareo|me falta el aire|cuesta respirar|no puedo dormir).{0,40}(altura|montana|cordillera|subiendo|3 ?mil|4 ?mil|cumbre|cerro|aca arriba|aqui arriba|en la cima|en lo alto|tan arriba)/, tipo: "sit", id: "altura" },
{ re: /(altura|montana|cordillera|subiendo|cumbre|cerro|aca arriba|aqui arriba|en la cima|en lo alto).{0,40}(dolor de cabeza|duele.{0,12}cabeza|jaqueca|nausea|vomit|mareo|me falta el aire|cuesta respirar|no puedo dormir)/, tipo: "sit", id: "altura" },

  // === CEGUERA DE NIEVE / ojos por sol-nieve ===
{ re: /ceguera de nieve|(no veo|vista nublada|ojos rojos|me arden los ojos|ojos irritados|me lloran los ojos|siento arena en los ojos).{0,22}(nieve|sol|reflejo)|queratitis|quemadura en los ojos/, tipo: "consejo", id: "ceguera-nieve" },

  // === CAÍDA GRAVE (barranco/altura) — trauma serio, NO un esguince ===
{ re: /(cai|cai|caida|me despene|me precipite|rode|rode|cai rodando).{0,24}(barranco|precipicio|risco|acantilado|ladera|abismo|quebrada|de altura|de (varios |muchos )?metros|al vacio|por (un |el )?cerro|de (un |el )?cerro|de la montana|de una pared|escalando|de muy alto)|me despene|cai al vacio|cai de muy alto/, tipo: "consejo", id: "caida-grave" },

  // === SOBREVIVIR LA NOCHE / frío nocturno / calorías ===
{ re: /cuantas calorias|calorias para sobrevivir|sobrevivir la noche|aguantar la noche|pasar la noche (en|al|a la)|sobrevivir (el|al) frio|como no morir de frio|sobrevivir (en|a) la (nieve|montana|intemperie)|aguantar el frio (toda |por )?la noche|como aguanto la noche/, tipo: "consejo", id: "supervivencia" },

  // === OBJETO CLAVADO / empalamiento — NO sacarlo ===
{ re: /me clave (un |el )?(palo|fierro|hierro|rama|piolet|cuchillo|clavo|estaca)|se me clavo (un |el )|me incruste|me empale|tengo (un |el )?(palo|fierro|hierro|cuchillo|objeto) clavado|tengo algo clavado|objeto clavado|me atraves|se me incrusto|quedo clavado|clavado en (la|el|mi)|tengo algo enterrado en/, tipo: "consejo", id: "objeto-clavado" },
  // === LUXACIÓN / dislocación ===
{ re: /se me (salio|zafo|corrio|salto|disloco) (el |la )?(hombro|brazo|rodilla|cadera|hueso|articulacion|mandibula)|luxacion|dislocacion|se me disloco|fuera de lugar (el|la)|hombro fuera de lugar|se me salio de lugar/, tipo: "consejo", id: "luxacion" },
  // === AVALANCHA / alud ===
{ re: /avalancha|\balud\b|me (tapo|cubrio|sepulto|enterro) (la |una )?(nieve|avalancha|alud)|quede (enterrado|atrapado|sepultado|bajo) .{0,12}nieve/, tipo: "consejo", id: "avalancha" },
  // === CAÍDA AL AGUA HELADA ===
{ re: /me cai al (agua|rio|lago)|cai (en|a) (el |un |una )?(agua|rio|lago|laguna)|agua (fria|helada)|me moje entero|me cai a (un|una)/, tipo: "consejo", id: "agua-fria" },
  // === DIENTE por golpe (no es dolor de muela) ===
{ re: /se me (cayo|salto|quebro|partio|salio) (un |el )?diente|me rompi un diente|perdi un diente|me saltaron un diente|me golpee.{0,12}diente/, tipo: "consejo", id: "diente-golpe" },
  // === MONÓXIDO en carpa/refugio cerrado ===
{ re: /monoxido|cocin(e|ar|ando) (en|dentro de) (la |una )?carpa|(estufa|calentador|cocina) (en|dentro) (la |de )?carpa|(me siento mal|mareo|mareado|nausea|dolor de cabeza|me duele la cabeza) (en|dentro de) (la |una )?carpa( cerrada)?/, tipo: "consejo", id: "monoxido" },

  // === labios / piel agrietada por frío-viento (antes que quemadura/hueso) ===
{ re: /(parti|agriet|seca|reseca|cuartead).{0,14}(labios|la piel|la cara)|(labios|la piel|la cara).{0,16}(partid|seca|reseca|agrietad|cuartead|quemada por el viento)|labios (partidos|secos|agrietados)|piel (agrietada|reseca|partida)/, tipo: "consejo", id: "labios-piel" },

  // --- pedido de medicación (analgésico, pastilla, algo para el dolor) ---
{ re: /\balgo para (el |la )?(dolor|fiebre|nausea|malestar)/, tipo: "consejo", id: "que-tomar" },
{ re: /\bdame (algo|una pastilla|un remedio|un calmante|un analg)/, tipo: "consejo", id: "que-tomar" },
{ re: /\b(necesito|quiero|deme|me das|paso)\b.{0,18}\b(pastilla|remedio|calmante|analg|antiinflamatori|antifebril|algo para)/, tipo: "consejo", id: "que-tomar" },
{ re: /\b(que|cual|cuales)\b.{0,16}\b(pastilla|remedio|medicament|analg|calmante|antiinflamatori|antifebril|antipiretic)/, tipo: "consejo", id: "que-tomar" },
{ re: /\b(que|cual|cuales)\b.{0,14}\b(me )?(puedo |debo |podria )?(tomar|tomo)\b/, tipo: "consejo", id: "que-tomar" },

  // --- cabeza que late/palpita (jaqueca, NO un golpe) ---
{ re: /\b(me late|me palpita|me retumba|siento latir|me pulsa)\b.{0,14}(cabeza|sien|frente|craneo)/, tipo: "consejo", id: "dolor-cabeza" },
  // dolor de cabeza común / jaqueca (sin golpe, sin altura, sin pedir pastilla:
  // esas ya se evaluaron arriba) -> consejo
  { re: /me duele (mucho |un poco |fuerte |bastante |horrible )?la cabeza|dolor de cabeza|tengo (una )?jaqueca|tengo migraña|me parte la cabeza|me esta matando la cabeza|me estalla la cabeza/, tipo: "consejo", id: "dolor-cabeza" },

  // --- dolor al defecar / hemorroides / estreñimiento ---
{ re: /(duele|arde|sangre|sangra|cuesta|sale sangre).{0,14}(cagar|defecar|al bano|obrar|el ano|el poto)|hemorroide|almorrana|estreni|no puedo (hacer caca|obrar)|dias sin (ir al bano|cagar|obrar)/, tipo: "consejo", id: "defecar" },
  // --- orinar / hacer pis (ganas, ardor, infección urinaria) ---
  // (ojo: "no orino" suelto es señal de deshidratación, no entra acá)
{ re: /\b(orinar|mear|meo|meas|miccion)\b|hacer (pis|pipi|pichi|chichi)|retencion de orina|infeccion urinaria|sangre en la orina|me arde (al |para )?(orinar|mear)|ganas de (orinar|mear)|no puedo (orinar|mear)|orino (mucho|poco)/, tipo: "consejo", id: "orina" },
  // --- raspón / rasguño (herida leve; el verbo "raspar" manda sobre la parte) ---
{ re: /\bme raspe|me raspe|\braspon|\braspadura|rasmillon|me rasmille|me rasgu|\brasgun|\brasguno|me pele (la|el|un|mi)|me raye (la|el) (piel|rodilla|brazo|pierna|cara)/, tipo: "consejo", id: "raspon" },
  // --- hipo ---
{ re: /\bhipo\b|no se me quita el hipo|me dio hipo/, tipo: "consejo", id: "hipo" },
  // --- no puedo dormir / insomnio (la altura ya se evaluó arriba) ---
{ re: /no (puedo|logro|consigo) dormir|tengo insomnio|no pego un ojo|me cuesta (mucho )?dormir|no duermo( nada)?/, tipo: "consejo", id: "insomnio" },
  // --- zumbido / pitido de oídos ---
{ re: /\bzumb|pitido en (el |los )?oido|me suenan los oidos|tinnitus|me zumban los oidos/, tipo: "consejo", id: "zumbido" },
  // --- vista borrosa (si es de golpe, el mensaje avisa que es grave) ---
{ re: /veo (borroso|nublado|doble|puntos|lucecitas)|se me nubla la vista|vision borrosa/, tipo: "consejo", id: "vista" },
  // --- encías que sangran ---
{ re: /sangran las encias|me sangra la encia|encias (inflamadas|hinchadas|sangrando)/, tipo: "consejo", id: "encias" },
  // --- herida infectada / pus ---
{ re: /\bpus\b|sale pus|liquido amarillo|sangre con amarillo|sale amarillo|herida (con pus|infectada|que huele)|se (me )?infecto|supura|huele (mal|feo) la herida/, tipo: "consejo", id: "infeccion" },

  // --- sangrado de NARIZ (antes que sangrado general y quemadura) ---
{ re: /(sangr|sale sangre|sangre).{0,14}nariz|nariz.{0,16}(sangr|sangre)|hemorragia nasal|epistaxis/, tipo: "consejo", id: "sangrado-nariz" },

  // --- quemadura de sol (suave) antes que quemadura grave ---
{ re: /quem.{0,18}\bsol\b|\bsol\b.{0,10}quem|insolad|quemad[oa] del sol/, tipo: "consejo", id: "quemadura-sol" },
  // --- quemadura (fuego/agua caliente) ---
{ re: /\bme quem|\bse quem|\bte quem|\bnos quem|\bquemad|\bquemadura\b|me chamusqu|se chamusqu|agarr[eo] fuego|prend[io] fuego|me incendi/, tipo: "sit", id: "quemadura" },

  // --- golpe/fractura de CABEZA -> trauma de cabeza (más apropiado que hueso) ---
  // (parti = pasado/accidente; "me parte la cabeza" es jaqueca, NO trauma)
{ re: /(golpe|golpee|golpie|pegue|cabezazo|me di un golpe).{0,16}(cabeza|craneo|nuca)/, tipo: "sit", id: "cabeza" },
{ re: /(cabeza|craneo|nuca).{0,12}(golpe|golpee|cabezazo|porrazo)/, tipo: "sit", id: "cabeza" },
{ re: /(fractur|me quebr|me romp|me parti|me fisur|fisurad|fractura).{0,14}(cabeza|craneo|cabesa)/, tipo: "sit", id: "cabeza" },
{ re: /(cabeza|craneo|cabesa).{0,14}(fractur|quebr|rota|roto|partid|fisur)/, tipo: "sit", id: "cabeza" },
  // --- fractura / hueso roto en cualquier otra parte ---
{ re: /\b(fractur|fisur)/, tipo: "sit", id: "hueso" },
{ re: /\b(me|se me) (quebr|qebr|romp|parti|destroc|destroz|machuq|revente|revente)/, tipo: "sit", id: "hueso" },
{ re: /\bhueso (roto|partid|quebrad|fractur)/, tipo: "sit", id: "hueso" },
{ re: /\b(quebrad|partid) (un |el |la )?(hueso|pierna|brazo|tobillo|muneca|cadera|costilla|dedo)/, tipo: "sit", id: "hueso" },

  // --- esguince / torcedura -> rodilla/tobillo ---
{ re: /\b(me torci|se me torcio|me doble|se me doblo|me hice un esguince|me esguince|me torce)\b/, tipo: "sit", id: "rodilla" },

  // --- corte / herida que sangra (el verbo manda; nariz ya salió arriba) ---
{ re: /\b(me cort|me raj|me hice un (corte|tajo)|me hice una herida|me abri (el |la |un )|tengo un (corte|tajo)|tengo una herida|me taje|estoy sangrando|esta sangrando|me sangra|sangra (el|la|un)|no para de sangrar|sangro |perdiendo sangre|sangra mucho)/, tipo: "sit", id: "sangrado" },
];

/* ============================================================================
   MEDICAMENTOS — nombres distintivos de remedios/objetos del kit. Cuando el
   usuario PREGUNTA por uno ("¿puedo inyectar adrenalina?", "¿sirve el ibuprofeno
   para...?", "¿cuánto paracetamol tomo?"), respondemos sobre ESE remedio, sin
   importar las otras palabras. `nombre` es el inicio del objeto del botiquín.
   ============================================================================ */
const MEDICAMENTOS = [
  { re: /adrenalin|epinefrin|epipen|autoinyector/, nombre: "Adrenalina" },
  { re: /antihistamin|antialerg|loratadin|cetirizin|difenhidramin|clorfenamin/, nombre: "Antihistamínico" },
  { re: /corticoide|dexametason|prednison|betametason/, nombre: "Corticoide" },
  { re: /paracetamol|acetaminofen|tylenol/, nombre: "Paracetamol" },
  { re: /ibuprofen|\baine\b/, nombre: "Ibuprofeno" },
  { re: /tramadol|analgesico fuerte|calmante fuerte/, nombre: "Analgésico fuerte" },
  { re: /acetazolamid|diamox/, nombre: "Acetazolamida" },
  { re: /antiemetic|metoclopramid|ondansetron|para (el )?vomito|para (las )?nausea/, nombre: "Antiemético" },
  { re: /antidiarreic|loperamid/, nombre: "Antidiarreico" },
  { re: /antibiotic|amoxicilin|azitromicin|ciprofloxacin/, nombre: "Antibiótico" },
  { re: /omeprazol|protector gastric/, nombre: "Protector gástrico" },
  { re: /sales de rehidrat|suero oral|electrolit|(me tomo|tomar|tomo|beber|bebo|tragar) (el |un )?suero|suero de rehidratacion|suero para tomar/, nombre: "Sales de rehidratación" },
  { re: /inhalador|salbutamol|ventolin|broncodilatad/, nombre: "Inhalador" },
  { re: /colirio|suero (ocular|en el ojo|en los ojos|para (el|los) ojos?)|lavado ocular|gotas para (el |los )?ojos?/, nombre: "Colirio" },
  { re: /torniquete/, nombre: "Torniquete" },
  { re: /\bferula|entablill|sam splint/, nombre: "Férula" },
  { re: /antiseptic|povidona|clorhexidin|\byodo\b/, nombre: "Antiséptico" },
  { re: /suero fisiolog|solucion salin|\bsuero\b/, nombre: "Suero fisiológico" },
  { re: /manta termic|manta de emergencia/, nombre: "Manta térmica" },
  { re: /termometro/, nombre: "Termómetro" },
  { re: /jeringa|\baguja\b/, nombre: "Jeringa" },
  { re: /\bgasas?\b|aposito/, nombre: "Gasas" },
  { re: /venda elastic|vendaje/, nombre: "Venda elástica" },
  { re: /curita|tirita|bandita/, nombre: "Curitas" },
  { re: /sutura|steri.?strip|puntos? de mariposa/, nombre: "Suturas adhesivas" },
];
// señales de que es una PREGUNTA/uso sobre un remedio (no un síntoma)
const MED_MARCADOR = /\b(puedo|puede|debo|podria|tomar|tomo|me tomo|inyect|usar|uso|aplic|darme|me doy|ponerme|me pongo|me aplico|sirve|para que|que hace|que efecto|cuant[oa]s?|cuando|dosis|conviene|administr|le doy|me inyecto|funciona|es bueno|esta bien)/;

/* ============================================================================
   GLOSARIO — para preguntas tipo "¿qué es la anafilaxia?", "¿qué significa
   hipotermia?", "explicame el soroche". Responde con una definición clara.
   `claves` son las formas en que se puede nombrar el término.
   ============================================================================ */
const GLOSARIO = [
  { titulo: "Anafilaxia", claves: ["anafilaxia", "anafilaxis", "shock anafilactico", "reaccion alergica grave"],
    def: "Es una reacción alérgica GRAVE y rápida (por una picadura, comida o medicamento). Se hincha la cara, la lengua o la garganta, cuesta respirar, salen ronchas por todo el cuerpo y puede bajar la presión hasta el desmayo. Es una emergencia: se trata con ADRENALINA inyectada y pidiendo rescate." },
  { titulo: "Hipotermia", claves: ["hipotermia"],
    def: "Es cuando el cuerpo se enfría por debajo de lo normal (mucho frío o estar mojado). Primero se tirita y cuesta moverse; si empeora, la persona se confunde, DEJA de tiritar y le da sueño. Hay que abrigar, dar calor de a poco y, si es grave, pedir rescate." },
  { titulo: "Soroche / mal de altura", claves: ["soroche", "mal de altura", "mal agudo de montaña", "puna", "apunamiento", "mal de las alturas"],
    def: "Es el malestar por la falta de oxígeno en la altura: dolor de cabeza, náuseas, mareo, falta de aire y dormir mal. Se previene subiendo despacio. Si es grave (falta de aire en reposo, confusión, caminar como borracho), hay que DESCENDER." },
  { titulo: "Esguince", claves: ["esguince", "torcedura"],
    def: "Es el estiramiento o desgarro de los ligamentos de una articulación (típico en el tobillo) por un mal movimiento. Duele, se hincha y cuesta apoyar. Se trata con reposo, hielo, compresión y elevación (RICE)." },
  { titulo: "Luxación", claves: ["luxacion", "dislocacion"],
    def: "Es cuando un hueso se sale de su lugar en la articulación (por ejemplo el hombro). Queda deformado y muy doloroso. No se debe forzar para acomodarlo: se inmoviliza como quedó y se busca ayuda." },
  { titulo: "Fractura", claves: ["fractura", "hueso roto", "quebradura"],
    def: "Es un hueso roto o quebrado. Da dolor, a veces deformación, hinchazón e imposibilidad de mover. Se inmoviliza SIN acomodar el hueso y se busca atención. Si el hueso asoma por la piel es una fractura expuesta (más grave)." },
  { titulo: "Conmoción cerebral", claves: ["conmocion", "conmocion cerebral", "contusion cerebral"],
    def: "Es un golpe en la cabeza que 'sacude' el cerebro: puede dar mareo, dolor de cabeza, confusión, náuseas o ver borroso. Hay que vigilar a la persona varias horas; si empeora, vomita o pierde el conocimiento, es urgente." },
  { titulo: "RCP", claves: ["rcp", "reanimacion", "reanimacion cardiopulmonar", "masaje cardiaco"],
    def: "Es lo que se hace cuando alguien NO respira: 30 compresiones fuertes y rápidas en el centro del pecho + 2 respiraciones, repitiendo sin parar hasta que llegue ayuda. Mantiene la sangre circulando hacia el cerebro." },
  { titulo: "Torniquete", claves: ["torniquete"],
    def: "Es una banda que se aprieta FUERTE por encima de una herida en un brazo o pierna para frenar un sangrado que no para con presión. Se usa solo en hemorragias graves y se anota la hora en que se puso." },
  { titulo: "Edema (de altura)", claves: ["edema", "edema pulmonar", "edema cerebral", "edema de altura"],
    def: "Es hinchazón por acumulación de líquido. En la altura es peligroso: el edema pulmonar (líquido en los pulmones: mucha falta de aire, tos) y el cerebral (en el cerebro: confusión, caminar como borracho). Ambos exigen DESCENDER y pedir rescate." },
  { titulo: "Congelación", claves: ["congelacion", "congelamiento"],
    def: "Es el daño de la piel y los tejidos por frío extremo (dedos, nariz, orejas). La zona se pone blanca, dura y sin sensibilidad. Se recalienta de a poco (nada de fuego directo) y NO se frota." },
  { titulo: "Deshidratación", claves: ["deshidratacion"],
    def: "Es la falta de agua en el cuerpo: sed, boca seca, orinar poco y oscuro, cansancio y mareo. Se corrige tomando agua y sales de rehidratación de a sorbos." },
  { titulo: "Golpe de calor / insolación", claves: ["golpe de calor", "insolacion", "hipertermia"],
    def: "Es cuando el cuerpo se recalienta demasiado: piel caliente, dolor de cabeza, mareo, náuseas y confusión. Hay que ir a la sombra, refrescar el cuerpo con agua e hidratar. Si hay confusión, es una emergencia." },
  { titulo: "Shock", claves: ["shock", "estado de shock"],
    def: "Es cuando el cuerpo no recibe suficiente sangre y oxígeno (por un sangrado, deshidratación, infección o alergia grave). La persona se pone pálida, con sudor frío, pulso rápido y débil y confusión. Es una emergencia." },
  { titulo: "ACV / derrame", claves: ["acv", "derrame", "derrame cerebral", "ataque cerebral", "ictus"],
    def: "Es cuando se corta el riego de sangre a una parte del cerebro. Señales (regla FAST): cara torcida, no poder hablar bien, no mover un brazo/lado del cuerpo. Es una emergencia: cada minuto cuenta, hay que pedir rescate ya." },
  { titulo: "Convulsión", claves: ["convulsion", "ataque epileptico", "epilepsia"],
    def: "Es una descarga eléctrica anormal del cerebro: el cuerpo se sacude o se pone rígido y se puede perder el conocimiento. NO se sujeta a la persona ni se le mete nada en la boca; se protege la cabeza y se espera a que pase." },
  { titulo: "Hipoglucemia", claves: ["hipoglucemia", "bajon de azucar", "azucar baja"],
    def: "Es el azúcar en sangre demasiado BAJA: temblor, sudor frío, debilidad, hambre y confusión. Se corrige rápido comiendo o tomando algo dulce." },
  { titulo: "Hiperglucemia", claves: ["hiperglucemia", "azucar alta"],
    def: "Es el azúcar en sangre demasiado ALTA (típico en la diabetes): mucha sed, orinar mucho, cansancio y visión borrosa. Si es grave da vómitos, respiración profunda y confusión." },
  { titulo: "Adrenalina (epinefrina)", claves: ["adrenalina", "epinefrina", "epipen"],
    def: "Es un medicamento INYECTABLE que se usa en la anafilaxia (alergia grave) y el paro cardíaco. Abre las vías respiratorias y sube la presión. Viene en autoinyector (EpiPen). NO es para sangrados ni dolores comunes." },
  { titulo: "Antihistamínico", claves: ["antihistaminico", "antialergico"],
    def: "Es un medicamento para las alergias LEVES: corta la picazón, las ronchas y los estornudos. NO reemplaza a la adrenalina en una alergia grave." },
  { titulo: "Corticoide", claves: ["corticoide", "dexametasona", "corticoides"],
    def: "Es un antiinflamatorio potente (por ejemplo dexametasona). Se usa en alergias, inflamaciones fuertes y, en montaña, en el edema cerebral por altura." },
  { titulo: "Antiséptico", claves: ["antiseptico", "desinfectante", "povidona", "clorhexidina"],
    def: "Sirve para desinfectar heridas: mata los gérmenes antes de cubrir la herida con una gasa. Ejemplos: povidona yodada, clorhexidina." },
  { titulo: "Sutura / puntos", claves: ["sutura", "suturas", "puntos", "steri strips"],
    def: "Suturar es cerrar una herida con puntos. Las suturas adhesivas (Steri-Strips o 'puntos de mariposa') cierran cortes pequeños sin aguja, juntando los bordes." },
  { titulo: "Isquemia", claves: ["isquemia"],
    def: "Es la falta de riego de sangre a una zona, que queda pálida, fría y sin pulso. Es urgente, porque el tejido se daña si no le llega sangre pronto." },
  { titulo: "Fiebre", claves: ["fiebre"],
    def: "Es la temperatura del cuerpo más alta de lo normal (38 °C o más), casi siempre por una infección. Se baja con paracetamol o ibuprofeno e hidratación, y se vigila." },
  { titulo: "Taquicardia", claves: ["taquicardia", "palpitaciones"],
    def: "Es el corazón latiendo más rápido de lo normal. Puede ser por esfuerzo, fiebre, deshidratación, susto o algo del corazón. Si viene con dolor de pecho o falta de aire, consultá." },
  { titulo: "Contusión / hematoma", claves: ["contusion", "hematoma", "moreton", "cardenal", "morton"],
    def: "Una contusión es un golpe sin herida abierta; el hematoma (moretón) es la sangre acumulada bajo la piel por ese golpe. Se trata con frío las primeras horas, reposo y elevación. El color va cambiando varios días, es normal." },
  { titulo: "Cianosis", claves: ["cianosis", "labios azules", "piel azulada"],
    def: "Es cuando la piel, los labios o las uñas se ponen azulados/morados por falta de oxígeno en la sangre. Es una señal de alarma (problema respiratorio o circulatorio): revisá si respira bien y pedí ayuda." },
  { titulo: "Disnea", claves: ["disnea", "falta de aire", "dificultad para respirar"],
    def: "Es la sensación de falta de aire o dificultad para respirar. Puede ser por esfuerzo, asma, altura, un problema del corazón o de los pulmones. Si aparece de golpe o en reposo, es para tomar en serio." },
  { titulo: "Fractura expuesta", claves: ["fractura expuesta", "hueso expuesto", "fractura abierta"],
    def: "Es una fractura en la que el hueso rompió la piel y queda a la vista. Es más grave por el riesgo de sangrado e infección: NO se empuja el hueso adentro, se cubre con gasa estéril, se inmoviliza como quedó y se pide rescate urgente." },
];
// detecta preguntas de definición ("qué es / qué significa / explicame ...")
const DEF_MARCADOR = /\b(que|qué) (es|son|significa|significan|seria|quiere decir)\b|explica(me|r)?\b|definicion de\b|que es eso de\b|en que consiste\b/;

/* Ítems del botiquín recomendados para cada situación grave (por id de TRIAGE). */
const SITUACION_ITEMS = {
  rodilla: ["ibuprofeno", "venda elastica"],
  hueso: ["ferula", "analgesico fuerte", "gasas"],
  sangrado: ["gasas", "antiseptico", "torniquete"],
  cabeza: ["paracetamol"],
  alergia: ["adrenalina", "antihistaminico", "corticoide"],
  frio: ["manta termica"],
  altura: ["acetazolamida", "antiemetico"],
  quemadura: ["gasas", "suero fisiologico"],
  inconsciente: [],
  pecho: [],
  atragantamiento: [],
  mordedura: ["antiseptico", "gasas", "antibiotico"],
  convulsion: [],
  panico: ["inhalador"]
};

/* --------------------------------------------------------------------------
   ESCENARIOS DE EMERGENCIA
   Contenido GENÉRICO de primeros auxilios como punto de partida.
   ⚠️ TODO debe ser revisado por el médico antes de confiar en ello.
   -------------------------------------------------------------------------- */
const ESCENARIOS = [
  {
    id: "anafilaxia",
    titulo: "Reacción alérgica grave / Anafilaxia",
    sintomas: ["alergia", "anafilaxia", "hinchazon", "garganta", "ahogo",
               "ronchas", "picadura", "adrenalina", "epinefrina", "lengua"],
    gravedad: "alta",
    pasos: [
      "Reconocer signos GRAVES: hinchazón de labios/lengua/garganta, dificultad para respirar, ronchas extendidas, mareo o desmayo.",
      "USAR ADRENALINA / autoinyector según indicación del médico. Dosis: ____ ⚠️ VALIDAR. Inyectar en la cara lateral del muslo.",
      "Recostar a la persona y elevar las piernas (salvo que cueste respirar: entonces semisentado). NO ponerla de pie ni sentarla de golpe: el cambio brusco a vertical puede causar paro. ",
      "Si hay antihistamínico indicado, darlo DESPUÉS de la adrenalina (no en lugar de). Dosis: ____ ⚠️ VALIDAR.",
      "Repetir adrenalina a los ____ minutos si no mejora ⚠️ VALIDAR (una segunda dosis hace falta hasta en el 18% de los casos).",
      "Pedir rescate URGENTE: esto siempre requiere evacuación."
    ],
    items: ["adrenalina", "antihistaminico"],
    cuandoBajar: "SIEMPRE. La anafilaxia es una emergencia: evacuar/rescate de inmediato aunque mejore con la adrenalina.",
    validado: false
  },
  {
    id: "hemorragia",
    titulo: "Herida que sangra mucho / Hemorragia",
    sintomas: ["sangre", "sangrado", "herida", "corte", "hemorragia", "gasa", "venda", "torniquete"],
    gravedad: "alta",
    pasos: [
      "Presión DIRECTA y firme sobre la herida con gasa o paño limpio. No la levantes para 'mirar', mantené la presión.",
      "Si la gasa se empapa, poné otra ENCIMA (no quites la primera) y seguí presionando.",
      "Herida profunda que no para con presión (en lugar donde no se puede poner torniquete, como ingle, axila o cuello): RELLENÁ la herida empujando gasa (o gasa hemostática si tenés) bien adentro contra lo que sangra, y presioná fuerte encima. (AHA/ILCOR recomiendan gasa hemostática antes que gasa común si está disponible.)",
      "Elevar la zona por encima del corazón si es un brazo o pierna y no hay sospecha de fractura.",
      "Una vez controlado, cubrir con gasa estéril y vendar con presión (sin cortar la circulación: revisá que el dedo siga rosado).",
      "Torniquete SOLO si el sangrado de un miembro no para y peligra la vida: colocar varios cm por encima de la herida, apretar hasta que pare y anotar la hora. NO aflojarlo. ____ ⚠️ VALIDAR técnica con el médico."
    ],
    items: ["gasas", "vendas", "guantes", "antiseptico"],
    cuandoBajar: "Si el sangrado no se controla, si usaste torniquete, o si la herida es profunda/extensa: evacuar.",
    validado: false
  },
  {
    id: "hipotermia",
    titulo: "Frío extremo / Hipotermia",
    sintomas: ["frio", "hipotermia", "tiritar", "temblar", "confusion", "congelacion", "manta"],
    gravedad: "alta",
    pasos: [
      "Sacar a la persona del viento/frío y aislarla del SUELO (mochila, ramas, aislante: el suelo roba el calor). Quitar ropa mojada y reemplazar por seca.",
      "Abrigar de la cabeza a los pies, incluida la cabeza y el cuello. Usar manta térmica (lado plateado hacia el cuerpo).",
      "Si está bien despierto y puede tragar bien, dar bebidas tibias y azucaradas. NUNCA alcohol (enfría más; es un factor de riesgo, no un remedio).",
      "Mantenerla ACOSTADA y quieta, moverla con mucha suavidad: no hacerla caminar ni mover brazos/piernas (el movimiento manda sangre fría al corazón y puede pararlo).",
      "Si deja de tiritar, se confunde o se adormece: es hipotermia grave, emergencia."
    ],
    items: ["manta-termica"],
    cuandoBajar: "Confusión, dificultad para hablar o caminar, deja de tiritar: evacuar urgente.",
    validado: false
  },
  {
    id: "congelacion",
    titulo: "Congelación de dedos / nariz / orejas",
    sintomas: ["congelacion", "dedos", "blanco", "duro", "entumecido", "nariz", "orejas"],
    gravedad: "media",
    pasos: [
      "Llevar a lugar resguardado. NO frotar ni dar masajes, y NO aplicar nieve ni hielo (es un mito que daña el tejido).",
      "Recalentar en agua TIBIA a 37-39°C (apenas soportable, como para bañar un bebé — NO caliente), unos 30 min, hasta que la zona quede blanda y rosada. Si no hay agua, calor corporal (manos bajo las axilas).",
      "NO recalentar si existe riesgo de que se vuelva a congelar: es peor descongelar y recongelar. Mejor mantener congelado hasta un lugar seguro.",
      "No reventar ampollas (menos aún las de sangre). Proteger la zona con gasa y mantenerla abrigada. Un ibuprofeno ayuda contra el daño del tejido (dosis ⚠️ VALIDAR).",
      "Quitar anillos/cosas ajustadas antes de que hinche."
    ],
    items: ["gasas", "manta-termica"],
    cuandoBajar: "Zonas que no recuperan color/sensibilidad, ampollas o piel negra: necesita atención médica, evacuar.",
    validado: false
  },
  {
    id: "mam",
    titulo: "Mal de altura (MAM / soroche)",
    sintomas: ["altura", "soroche", "mam", "dolor de cabeza", "nauseas", "mareo", "puna", "edema"],
    gravedad: "media",
    pasos: [
      "Reconocer: dolor de cabeza + náuseas, mareo, cansancio extremo, falta de aire al subir.",
      "NO seguir subiendo. Descansar e hidratarse.",
      "Si los síntomas no mejoran o empeoran: DESCENDER. Bajar es el tratamiento más efectivo.",
      "Medicación (ej. para el MAM o el dolor): ____ ⚠️ VALIDAR con el médico cuál y qué dosis.",
      "SEÑALES DE ALARMA (edema): falta de aire en reposo, tos con espuma, caminar como borracho, confusión, mucho sueño. Esto es grave."
    ],
    items: ["analgesico"],
    cuandoBajar: "Cualquier señal de alarma (edema pulmonar o cerebral): DESCENDER YA y pedir rescate.",
    validado: false
  },
  {
    id: "fractura",
    titulo: "Fractura o esguince",
    sintomas: ["fractura", "rotura", "hueso", "esguince", "tobillo", "torcedura", "inmovilizar", "ferula"],
    gravedad: "media",
    pasos: [
      "No mover la zona lesionada más de lo necesario. No intentar 'acomodar' el hueso.",
      "Inmovilizar la articulación de arriba y de abajo de la lesión (entablillar con lo que haya: bastón, ramas, vendas).",
      "Aplicar frío si hay (nieve envuelta en tela, nunca directo sobre la piel) y elevar.",
      "Revisar que el miembro mantenga color, calor y sensibilidad después de inmovilizar.",
      "Analgésico si está indicado. Dosis: ____ ⚠️ VALIDAR."
    ],
    items: ["vendas", "analgesico"],
    cuandoBajar: "Fractura expuesta (hueso visible), deformidad grande, o no puede apoyar/caminar: evacuar.",
    validado: false
  },
  {
    id: "herida-leve",
    titulo: "Herida o raspón leve",
    sintomas: ["herida", "raspon", "rasguno", "corte pequeño", "limpiar", "curita", "antiseptico"],
    gravedad: "baja",
    pasos: [
      "Lavarte las manos o ponerte guantes.",
      "Limpiar la herida con agua limpia o suero. Sacar tierra/restos.",
      "Aplicar antiséptico.",
      "Cubrir con gasa o curita. Cambiar el apósito si se moja o ensucia.",
      "Vigilar signos de infección en los días siguientes: enrojecimiento, calor, pus, fiebre."
    ],
    items: ["antiseptico", "gasas", "curitas", "guantes"],
    cuandoBajar: "Signos de infección, herida que no cierra, o mordedura: consultar médico.",
    validado: false
  },
  {
    id: "quemadura",
    titulo: "Quemadura (sol intenso o calor)",
    sintomas: ["quemadura", "sol", "ampolla", "ardor", "insolacion"],
    gravedad: "baja",
    pasos: [
      "Enfriar con agua a temperatura ambiente varios minutos. No usar hielo directo.",
      "No reventar ampollas. Cubrir con gasa estéril sin apretar.",
      "No aplicar cremas/pasta dental/grasa.",
      "Hidratarse bien; el sol y la altura deshidratan rápido."
    ],
    items: ["gasas"],
    cuandoBajar: "Quemaduras grandes, en cara/manos/genitales, o con muchas ampollas: atención médica.",
    validado: false
  }
];

/* --------------------------------------------------------------------------
   ÍTEMS DEL KIT (glosario)
   Lo que tu amigo médico ponga en el botiquín. ⚠️ Completar dosis/uso.
   -------------------------------------------------------------------------- */
const ITEMS = [
  {
    id: "adrenalina",
    nombre: "Adrenalina / Autoinyector (epinefrina)",
    paraQue: "Reacción alérgica grave (anafilaxia).",
    comoUsar: "Inyectar en la cara lateral del muslo. ____ ⚠️ VALIDAR dosis y técnica.",
    cuidado: "Es el tratamiento que salva la vida en anafilaxia. Usar sin demora.",
    validado: false
  },
  {
    id: "antihistaminico",
    nombre: "Antihistamínico",
    paraQue: "Alergias leves; complemento (NO sustituto) de la adrenalina en anafilaxia.",
    comoUsar: "Dosis: ____ ⚠️ VALIDAR.",
    cuidado: "Puede dar sueño.",
    validado: false
  },
  {
    id: "analgesico",
    nombre: "Analgésico / Antiinflamatorio",
    paraQue: "Dolor, fiebre, dolor de cabeza de altura.",
    comoUsar: "Cuál y dosis: ____ ⚠️ VALIDAR.",
    cuidado: "Respetar el tiempo entre tomas. Ojo con el estómago / alergias.",
    validado: false
  },
  {
    id: "gasas",
    nombre: "Gasas estériles",
    paraQue: "Cubrir heridas y hacer presión sobre sangrados.",
    comoUsar: "Aplicar directamente sobre la herida. Cambiar si se empapa (sin quitar la primera capa en hemorragias).",
    cuidado: "Mantener el paquete cerrado hasta usar.",
    validado: false
  },
  {
    id: "vendas",
    nombre: "Vendas",
    paraQue: "Fijar gasas, inmovilizar, hacer presión.",
    comoUsar: "Envolver firme pero sin cortar circulación (el dedo debe seguir rosado y tibio).",
    cuidado: "",
    validado: false
  },
  {
    id: "antiseptico",
    nombre: "Antiséptico",
    paraQue: "Desinfectar heridas.",
    comoUsar: "Aplicar sobre la herida limpia.",
    cuidado: "____ ⚠️ VALIDAR cuál (povidona/clorhexidina) y precauciones.",
    validado: false
  },
  {
    id: "guantes",
    nombre: "Guantes",
    paraQue: "Protección al curar (tuya y de la herida).",
    comoUsar: "Ponételos antes de tocar sangre o heridas.",
    cuidado: "",
    validado: false
  },
  {
    id: "manta-termica",
    nombre: "Manta térmica",
    paraQue: "Conservar el calor corporal (hipotermia, shock).",
    comoUsar: "Envolver a la persona con el lado plateado hacia el cuerpo.",
    cuidado: "No reemplaza ropa seca; usar junto con abrigo.",
    validado: false
  },
  {
    id: "curitas",
    nombre: "Curitas / Apósitos",
    paraQue: "Heridas y raspones pequeños.",
    comoUsar: "Cubrir la herida limpia.",
    cuidado: "",
    validado: false
  }
];
