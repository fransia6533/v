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
  version: "0.5 (borrador)",
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
    tambien: "acetaminofeno, tylenol, fiebre, dolor",
    dosis: "____ mg  ⚠️ VALIDAR", dosisPorKg: "____ mg/kg  ⚠️ VALIDAR",
    via: "oral",
    procedimiento: "Dolor leve/moderado y fiebre. Respetar el tiempo entre tomas. No pasar la dosis máxima diaria.",
    comentario: "____", validado: false
  },
  {
    objeto: "Ibuprofeno",
    tambien: "antiinflamatorio, dolor, golpe, esguince, fiebre, aine",
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
    sintomas: ["rodilla", "tobillo", "torcedura", "esguince", "doblar", "torcer", "torci", "articulacion", "ligamento", "pie", "no puedo caminar", "no puedo apoyar", "cojeo", "me cai", "me caí"],
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
    titulo: "Me partí / quebré un hueso (brazo o pierna)",
    sintomas: ["hueso", "fractura", "fracture", "quebre", "quebré", "parti", "partí", "rompi", "rompí", "roto", "brazo", "pierna", "muñeca", "tobillo roto", "hueso roto", "no puedo mover"],
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
        "Elevá la zona por encima del corazón si es brazo o pierna y no hay fractura.",
        "Si es un brazo/pierna, el sangrado no para y peligra la vida: torniquete varios cm por encima de la herida y ANOTÁ la hora.",
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
    sintomas: ["alergia", "alergica", "alérgica", "picadura", "picó", "abeja", "ronchas", "hinchazon", "hinchazón", "anafilaxia", "veneno"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Le cuesta respirar, se hincha lengua/garganta/cara, está por desmayarse, o ronchas por todo el cuerpo?",
        opciones: [{ texto: "Sí (alguna)", ir: "grave" }, { texto: "No", ir: "leve" }] },
      grave: { resultado: { nivel: "alta", titulo: "Reacción grave (anafilaxia)", pasos: [
        "USÁ LA ADRENALINA del botiquín YA, en la cara lateral del muslo, según la indicación validada por tu médico.",
        "Recostalo con las piernas elevadas. Si le cuesta respirar, mejor semisentado.",
        "Antihistamínico DESPUÉS de la adrenalina, nunca en lugar de.",
        "Si no mejora, repetí la adrenalina según la indicación del médico.",
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
    sintomas: ["frio", "frío", "hipotermia", "congelacion", "congelación", "tiritar", "temblar", "helado", "nieve", "dedos blancos", "no siento las manos", "manos", "dedos", "hormigueo", "entumecido", "entumecidas", "manos dormidas", "dedos dormidos", "sin sensibilidad", "estoy helado"],
    inicio: "q1",
    nodos: {
      q1: { pregunta: "¿Está confundido, habla raro, deja de tiritar, se adormece o camina como borracho?",
        opciones: [{ texto: "Sí", ir: "grave" }, { texto: "No", ir: "q2" }] },
      q2: { pregunta: "¿Hay dedos, nariz u orejas blancos, duros o sin sensibilidad?",
        opciones: [{ texto: "Sí (congelación)", ir: "congelacion" }, { texto: "No", ir: "leve" }] },
      grave: { resultado: { nivel: "alta", titulo: "Hipotermia (grave)", pasos: [
        "Movelo con suavidad (los movimientos bruscos son peligrosos). Sacalo del viento y del suelo.",
        "Quitá ropa mojada, poné ropa seca y abrigá todo, incluida la cabeza y el cuello.",
        "Manta térmica con el lado plateado hacia el cuerpo.",
        "Si está consciente y traga bien, bebida tibia y azucarada. NUNCA alcohol.",
        "Pedí rescate urgente." ],
        cuandoBajar: "Confusión, deja de tiritar o se adormece: emergencia, evacuar." } },
      congelacion: { resultado: { nivel: "media", titulo: "Congelación", pasos: [
        "NO frotar ni dar masajes en la zona.",
        "Recalentá suave con calor corporal (manos bajo las axilas) o agua tibia (NO caliente).",
        "No recalientes si hay riesgo de que se vuelva a congelar (es peor descongelar y recongelar).",
        "No revientes ampollas. Quitá anillos/cosas ajustadas. Protegé con gasa." ],
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
        "Enfriá con agua a temperatura ambiente 10-20 min. NO uses hielo.",
        "No revientes ampollas. Cubrí con gasa estéril sin apretar.",
        "Quitá anillos/ropa que NO esté pegada a la piel. Hidratá a la persona.",
        "Evacuá." ],
        cuandoBajar: "Quemaduras grandes/profundas o en zonas delicadas: atención médica." } },
      moderado: { resultado: { nivel: "media", titulo: "Quemadura con ampollas", pasos: [
        "Enfriá con agua 10-20 min. No revientes las ampollas.",
        "Cubrí con gasa estéril sin apretar. No apliques cremas/pasta/grasa.",
        "Vigilá infección." ],
        cuandoBajar: "Si se infecta o es extensa, consultá." } },
      leve: { resultado: { nivel: "baja", titulo: "Quemadura leve", pasos: [
        "Enfriá con agua varios minutos.",
        "Cubrí si hace falta. No apliques cremas/pasta dental/grasa.",
        "Hidratate (el sol y la altura deshidratan)." ],
        cuandoBajar: "Si aparecen muchas ampollas o dolor que no cede, consultá." } }
    }
  },
  {
    id: "inconsciente",
    titulo: "Alguien se desmayó / no responde",
    sintomas: ["desmayo", "desmayado", "inconsciente", "no responde", "no despierta", "no respira", "respira", "convulsion", "convulsión", "rcp", "ahogado"],
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
    sintomas: ["pecho", "corazon", "corazón", "infarto", "ahogo", "falta de aire", "respirar", "opresion", "opresión"],
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
  }
];

/* --------------------------------------------------------------------------
   CONSEJOS — síntomas comunes para responder tipo chat (no emergencia grave).
   El asistente los usa para contestar conversando y sugerir qué del botiquín.
   ⚠️ Consejos generales, a validar por el médico.
   -------------------------------------------------------------------------- */
const CONSEJOS = [
  { id: "dolor-cabeza", sintomas: ["dolor de cabeza", "cabeza", "jaqueca", "migraña", "cefalea", "me duele la cabeza"],
    mensaje: "Tomá agua (la deshidratación y la altura dan dolor de cabeza), descansá un rato a la sombra y aflojá el ritmo. Si no cede, del botiquín podés usar un analgésico.",
    items: ["paracetamol", "ibuprofeno"],
    cuandoConsultar: "Si es el peor dolor de tu vida, viene con vómitos, confusión o fiebre alta, o estás en altura con falta de aire/mareo: tratalo como golpe en la cabeza o mal de altura y pedí ayuda." },
  { id: "fiebre", sintomas: ["fiebre", "temperatura", "calentura", "destemplado", "tengo fiebre"],
    mensaje: "Hidratate bien, descansá y no te abrigues de más. Del botiquín, un antitérmico ayuda a bajar la fiebre.",
    items: ["paracetamol", "ibuprofeno"],
    cuandoConsultar: "Fiebre alta que no baja, con rigidez de nuca, confusión, dificultad para respirar, o que dura varios días: consultá / bajá." },
  { id: "panza", sintomas: ["panza", "estomago", "estómago", "dolor abdominal", "barriga", "acidez", "me duele la panza", "dolor de barriga"],
    mensaje: "Tomá líquidos de a sorbos, comé liviano y evitá grasas y alcohol. Si es acidez o ardor, un protector gástrico ayuda.",
    items: ["protector gastrico", "antiemetico"],
    cuandoConsultar: "Dolor muy fuerte que no afloja, con fiebre, vómitos con sangre, o panza dura: puede ser serio, pedí ayuda." },
  { id: "nauseas", sintomas: ["nausea", "náuseas", "ganas de vomitar", "vomito", "vómito", "descompuesto", "asco", "siento nauseas"],
    mensaje: "Sentate o recostate, buscá aire fresco y tomá sorbos de agua o suero. Del botiquín, un antiemético corta las náuseas.",
    items: ["antiemetico", "sales de rehidratacion"],
    cuandoConsultar: "Vómitos que no paran, con sangre o deshidratación; o en altura con dolor de cabeza: podría ser soroche, descendé." },
  { id: "diarrea", sintomas: ["diarrea", "suelto", "descompostura", "caca liquida", "estoy flojo"],
    mensaje: "Lo más importante es hidratar: suero oral o agua a sorbos seguidos. Comé liviano (arroz, banana). Un antidiarreico ayuda si no hay fiebre ni sangre.",
    items: ["sales de rehidratacion", "antidiarreico"],
    cuandoConsultar: "Diarrea con sangre, fiebre alta, o señales de deshidratación (boca seca, casi no orinás, muy débil): consultá." },
  { id: "mareo", sintomas: ["mareo", "mareado", "vahido", "todo da vueltas", "me mareo"],
    mensaje: "Sentate o agachate para no caerte, tomá agua y algo con azúcar. En altura, el mareo puede ser mal de montaña.",
    items: ["sales de rehidratacion"],
    cuandoConsultar: "Si te desmayaste, ves o hablás raro, o en altura con falta de aire: pedí ayuda." },
  { id: "deshidratacion", sintomas: ["deshidratado", "deshidratacion", "sed", "boca seca", "no orino", "estoy seco"],
    mensaje: "Ponete a la sombra, descansá y tomá suero oral o agua de a poco y seguido. Evitá el esfuerzo hasta recuperarte.",
    items: ["sales de rehidratacion"],
    cuandoConsultar: "Confusión, no orinás, muy débil o desmayo: es grave, pedí ayuda." },
  { id: "ampolla", sintomas: ["ampolla", "rozadura", "me lastime el pie", "talon", "roce"],
    mensaje: "No la revientes. Limpiá la zona y cubrila con un apósito o tela para que no roce. Si ya se reventó, limpiá con antiséptico y cubrí.",
    items: ["curitas", "antiseptico", "tela adhesiva"],
    cuandoConsultar: "Si se infecta (roja, caliente, con pus), consultá." },
  { id: "insolacion", sintomas: ["insolacion", "golpe de calor", "mucho calor", "acalorado", "me insole"],
    mensaje: "Salí del sol a la sombra, aflojá la ropa, mojá la piel con agua y abanicá, y tomá líquidos. Descansá.",
    items: ["sales de rehidratacion"],
    cuandoConsultar: "Piel caliente y seca, confusión, deja de sudar o desmayo: golpe de calor grave, enfriá rápido y pedí rescate." },
  { id: "dolor-muscular", sintomas: ["dolor muscular", "agujetas", "cansancio", "contractura", "me duele el cuerpo", "musculo"],
    mensaje: "Descansá, estirá suave e hidratate. Un antiinflamatorio del botiquín ayuda con el dolor.",
    items: ["ibuprofeno"],
    cuandoConsultar: "Dolor en el pecho, falta de aire, o una pierna hinchada y dolorida: no es muscular común, consultá." },
  { id: "resfrio", sintomas: ["resfrio", "resfriado", "tos", "mocos", "garganta", "gripe", "estoy resfriado"],
    mensaje: "Abrigate, hidratate y descansá. Para la fiebre o el malestar, un antitérmico ayuda.",
    items: ["paracetamol"],
    cuandoConsultar: "Falta de aire, fiebre alta que no baja, o dolor de pecho: consultá / bajá." },
  { id: "picadura", sintomas: ["picadura", "me pico", "insecto", "mosquito", "picazon", "picazón", "me pica"],
    mensaje: "Lavá la zona y poné frío para la hinchazón. Si hay aguijón, sacalo raspando (no apretar). Un antihistamínico calma la picazón.",
    items: ["antihistaminico"],
    cuandoConsultar: "Si se hincha la cara/garganta, cuesta respirar o salen ronchas por todo el cuerpo: es alergia grave, usá adrenalina y pedí rescate." },
  { id: "quemadura-sol", sintomas: ["quemadura de sol", "me queme con el sol", "piel roja", "ardor sol", "quemado del sol"],
    mensaje: "Salí del sol, enfriá con agua, hidratá la piel y tomá líquidos. No revientes ampollas.",
    items: ["paracetamol"],
    cuandoConsultar: "Quemaduras con muchas ampollas, fiebre, o en zonas grandes: consultá." }
];

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
  pecho: []
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
      "Recostar a la persona y elevar las piernas (salvo que cueste respirar: entonces semisentado).",
      "Si hay antihistamínico indicado, darlo DESPUÉS de la adrenalina (no en lugar de). Dosis: ____ ⚠️ VALIDAR.",
      "Repetir adrenalina a los ____ minutos si no mejora ⚠️ VALIDAR.",
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
      "Elevar la zona por encima del corazón si es un brazo o pierna y no hay sospecha de fractura.",
      "Una vez controlado, cubrir con gasa estéril y vendar con presión (sin cortar la circulación: revisá que el dedo siga rosado).",
      "Torniquete SOLO si el sangrado de un miembro no para y peligra la vida: colocar varios cm por encima de la herida y anotar la hora. ____ ⚠️ VALIDAR técnica con el médico."
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
      "Sacar a la persona del viento/frío y del suelo. Quitar ropa mojada y reemplazar por seca.",
      "Abrigar de la cabeza a los pies, incluida la cabeza y el cuello. Usar manta térmica (lado plateado hacia el cuerpo).",
      "Si está consciente y puede tragar bien, dar bebidas tibias y azucaradas. NUNCA alcohol.",
      "Mover a la persona con suavidad; los movimientos bruscos pueden ser peligrosos en hipotermia severa.",
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
      "Llevar a lugar resguardado. NO frotar ni dar masajes en la zona congelada (daña el tejido).",
      "Recalentar con calor corporal suave (ej. manos bajo las axilas) o agua tibia (NO caliente) si hay.",
      "NO recalentar si existe riesgo de que se vuelva a congelar: es peor descongelar y recongelar.",
      "No reventar ampollas. Proteger la zona con gasa y mantenerla abrigada.",
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
