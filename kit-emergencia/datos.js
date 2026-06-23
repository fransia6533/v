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
  version: "0.2 (borrador)",
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
const BOTIQUIN_DEFAULT = [
  {
    objeto: "Adrenalina (autoinyector / epinefrina)",
    dosis: "____ mg  ⚠️ VALIDAR",
    via: "inyectable",
    procedimiento: "Reacción alérgica grave (anafilaxia): inyectar en la cara lateral del muslo. Repetir a los ____ min si no mejora. SIEMPRE pedir rescate.",
    comentario: "____ (a completar por el médico)",
    validado: false
  },
  {
    objeto: "Antihistamínico",
    dosis: "____ mg  ⚠️ VALIDAR",
    via: "oral / masticable",
    procedimiento: "Alergia leve. En anafilaxia: dar DESPUÉS de la adrenalina, nunca en lugar de.",
    comentario: "____",
    validado: false
  },
  {
    objeto: "Analgésico / antiinflamatorio",
    dosis: "____ mg cada ____ h  ⚠️ VALIDAR",
    via: "oral",
    procedimiento: "Dolor, fiebre, dolor de cabeza de altura. Respetar el tiempo entre tomas.",
    comentario: "____",
    validado: false
  },
  {
    objeto: "Gasas estériles",
    dosis: "las necesarias",
    via: "uso externo",
    procedimiento: "Cubrir heridas y hacer presión directa sobre sangrados. Si se empapa, poner otra encima sin quitar la primera.",
    comentario: "",
    validado: false
  },
  {
    objeto: "Vendas",
    dosis: "—",
    via: "uso externo",
    procedimiento: "Fijar gasas, inmovilizar, hacer presión. Sin cortar la circulación (el dedo debe seguir rosado).",
    comentario: "",
    validado: false
  },
  {
    objeto: "Antiséptico",
    dosis: "____  ⚠️ VALIDAR cuál",
    via: "uso externo",
    procedimiento: "Desinfectar la herida ya limpia antes de cubrir.",
    comentario: "____",
    validado: false
  },
  {
    objeto: "Manta térmica",
    dosis: "—",
    via: "uso externo",
    procedimiento: "Hipotermia/shock: envolver con el lado plateado hacia el cuerpo, junto con ropa seca.",
    comentario: "",
    validado: false
  },
  {
    objeto: "Suero fisiológico",
    dosis: "—",
    via: "uso externo",
    procedimiento: "Lavar heridas y ojos.",
    comentario: "",
    validado: false
  }
];

// Encabezados de la tabla (orden de columnas para Excel y la app)
const BOTIQUIN_COLUMNAS = [
  { id: "objeto", titulo: "Objeto / Medicamento" },
  { id: "dosis", titulo: "Dosis (mg/cc) / cantidad" },
  { id: "via", titulo: "Vía (masticable/inyectable/oral...)" },
  { id: "procedimiento", titulo: "Procedimiento" },
  { id: "comentario", titulo: "Comentario del médico" },
  { id: "validado", titulo: "Validado (sí/no)" }
];

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
