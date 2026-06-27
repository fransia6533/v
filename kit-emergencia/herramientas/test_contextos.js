/* test_contextos.js — 10 mil+ contextos naturales.
   Familias de frases (muchas paráfrasis reales + modismos chilenos) cruzadas
   con prefijos coloquiales y bandas de typo. Reporta los fallos LIMPIOS
   agrupados por escenario esperado, para ver exactamente qué falta.
   Uso: node herramientas/test_contextos.js [--fallos] */
"use strict";
const { rutear } = require("./test_routing.js");
const verFallos = process.argv.includes("--fallos");

// ---------------- typo determinista ----------------
const VECINAS = { a:"sq", e:"rwd", i:"ou", o:"ipl", u:"yi", s:"ad", n:"mb", r:"et", l:"k", c:"vx", t:"ry", m:"n", d:"sf", b:"vn", p:"o", g:"hf", q:"wa", v:"bc" };
let _seed = 99;
function pseudo(salt) { _seed = (_seed * 1103515245 + 12345 + salt) & 0x7fffffff; return _seed / 0x7fffffff; }
function typo(s, inten) {
  if (!inten) return s;
  let out = "";
  for (const ch of s) {
    const r = pseudo(out.length + ch.charCodeAt(0));
    if (ch !== " " && r < inten) {
      const k = (r * 100) % 3 | 0;
      if (k === 0 && VECINAS[ch]) out += VECINAS[ch][(r * 1000) % VECINAS[ch].length | 0];
      else if (k === 1) out += ch + ch;
      else continue;
    } else out += ch;
  }
  return out;
}

// ---------------- partes del cuerpo ----------------
const art = (p) => {
  if (/^(los|las|el|la) /.test(p)) return p;
  const fem = /a$|cion$|riz$/.test(p) && !/dia$/.test(p);
  if (/s$/.test(p)) return "los " + p;
  return (fem ? "la " : "el ") + p;
};
const PARTES = ["pierna","brazo","mano","dedo","pie","tobillo","rodilla","cadera","muñeca","hombro","costilla","muslo","antebrazo","gemelo","pantorrilla","codo","espinilla","talon"];
const PARTES_DOLOR = ["espalda","trasero","cintura","nuca","cuello","hombro","brazo","muslo","cadera","gluteo","nalga","pantorrilla","gemelo","costado","ingle","axila","riñones","lomo","antebrazo","codo","espinilla","las piernas","los brazos"];

// ---------------- familias: verbo/frase -> escenario ----------------
// Lesiones que se combinan con una parte del cuerpo
const LESION = [
  { verbos: ["me corte","me corté","me hice un corte en","me hice un tajo en","me raje","me rajé","me abri","me corte feo","me hice una herida en"], dest: "sangrado" },
  { verbos: ["sangra","me sangra","no para de sangrar","esta sangrando","sangro por"], dest: "sangrado", suf: true },
  { verbos: ["me queme","me quemé","me chamusque","me queme feo","me agarro fuego en"], dest: "quemadura" },
  { verbos: ["me quebre","me quebré","me rompi","me rompí","me fracture","me fracturé","me parti","me partí","creo que me quebre","se me rompio","se me quebro","me destroce"], dest: "hueso", partes: PARTES.filter((p)=>p!=="rodilla"&&p!=="costilla"&&p!=="dedo") },
];
// Esguince/torcedura (mano de obra: tobillo/rodilla/muñeca)
const ESGUINCE = { verbos: ["me torci","me torcí","me doble","me doblé","se me doblo","me hice un esguince en","me resbale y me torci"], partes: ["tobillo","rodilla","la muñeca","el pie"], dest: "rodilla" };

// Dolor general (parte sin escenario propio)
const DOLOR_VERBOS = ["me duele","tengo dolor en","me molesta","siento dolor en","me late","tengo molestia en","me duele mucho"];

// Síntomas con muchas paráfrasis (frase completa -> escenario)
const SINTOMAS = [
  { dest: "dolor-cabeza", frases: ["me duele la cabeza","tengo dolor de cabeza","tengo jaqueca","me parte la cabeza","tengo migraña","me late la cabeza","dolor de cabeza fuerte","me duele mucho la cabeza","tengo la cabeza que estalla","me esta matando la cabeza"] },
  { dest: "fiebre", frases: ["tengo fiebre","estoy afiebrado","tengo calentura","estoy hirviendo de fiebre","tengo temperatura","creo que tengo fiebre","tengo el cuerpo caliente","estoy volando en fiebre","ando con fiebre"] },
  { dest: "nauseas", frases: ["tengo nauseas","tengo ganas de vomitar","tengo ganas de devolver","tengo asco","siento que voy a vomitar","tengo arcadas","ando con nauseas","me dan ganas de vomitar"] },
  { dest: "panza", frases: ["me duele la panza","me duele el estomago","me duele la guata","tengo dolor de barriga","tengo acidez","tengo el estomago revuelto","me duele la barriga","tengo dolor de panza","me duele la guatita"] },
  { dest: "diarrea", frases: ["tengo diarrea","ando suelto","estoy flojo del estomago","tengo cagadera","ando con cagadera","tengo el estomago suelto","ando descompuesto del estomago"] },
  { dest: "mareo", frases: ["estoy mareado","me mareo","todo me da vueltas","ando mareado","siento que todo gira","tengo mareos"] },
  { dest: "resfrio", frases: ["estoy resfriado","tengo tos","tengo mocos","me agarro un resfrio","tengo gripe","estoy congestionado","ando engripado","tengo la nariz tapada"] },
  { dest: "deshidratacion", frases: ["estoy deshidratado","tengo mucha sed","tengo la boca seca","no orino hace rato","estoy seco de sed"] },
  { dest: "ampolla", frases: ["tengo una ampolla","me salio una ampolla","me ampolle el pie","el zapato me lastimo","tengo ampollas en los pies"] },
  { dest: "picadura", frases: ["me pico un mosquito","me picaron","me pico un bicho","tengo una picadura","me pico un insecto","me pico un zancudo"] },
  { dest: "muela", frases: ["me duele la muela","me duele un diente","tengo dolor de muela","me esta matando la muela"] },
  { dest: "calambre", frases: ["tengo un calambre","se me acalambro la pierna","me dio un calambre","se me acalambro el pie"] },
  { dest: "garganta", frases: ["me duele la garganta","tengo la garganta irritada","me arde la garganta","tengo anginas","tengo dolor de garganta"] },
  { dest: "oido", frases: ["me duele el oido","tengo dolor de oido","me duele un oido"] },
  { dest: "astilla", frases: ["se me clavo una astilla","me clave una espina","tengo una astilla clavada","me clave una astilla"] },
  { dest: "que-tomar", frases: ["que pastilla tomo","que me tomo","dame algo para el dolor","necesito un analgesico","que remedio tomo","algo para la fiebre","que puedo tomar","que medicamento tomo","necesito algo para el dolor","quiero un calmante","que pastillas debo tomar"] },
  { dest: "malestar", frases: ["me siento mal","no me siento bien","me siento raro","ando para atras","estoy hecho pebre","ando como las pelotas","no doy mas"] },
  { dest: "malestar|hipoglucemia", frases: ["me siento debil","me siento flojo"] },
  { dest: "resaca", frases: ["tengo resaca","ando con caña","estoy crudo","tengo chuchaqui","me pase con el trago","ando con la goma","tengo cruda"] },
  { dest: "insolacion|quemadura-sol", frases: ["me insole","me pego el sol","tengo golpe de calor","me quede mucho al sol"] },
  { dest: "quemadura-sol|insolacion", frases: ["me queme con el sol","tengo la piel roja del sol","me queme la piel con el sol"] },
  { dest: "sangrado-nariz", frases: ["me sangra la nariz","sangro por la nariz","tengo hemorragia nasal","me sale sangre de la nariz"] },
  { dest: "ojo", frases: ["me entro algo al ojo","tengo algo en el ojo","me entro tierra al ojo","me arde el ojo"] },
  { dest: "hipoglucemia|malestar", frases: ["tengo un bajon de azucar","ando tembloroso y con sudor frio","me siento debil y tembloroso"] },
  { dest: "hipoglucemia|malestar|mareo", frases: ["tengo hambre y mareo"] },
  // emergencias
  { dest: "inconsciente", frases: ["se desmayo","no respira","no responde","esta inconsciente","no despierta","perdio el conocimiento","se desplomo","no reacciona"] },
  { dest: "pecho", frases: ["me duele el pecho","tengo una opresion en el pecho","siento que me da un infarto","me aprieta el pecho","tengo un dolor fuerte en el pecho"] },
  { dest: "atragantamiento", frases: ["me atragante","se esta ahogando con comida","se atoro con la comida","me atore","se ahoga con comida"] },
  { dest: "mordedura", frases: ["me mordio una vibora","me mordio un perro","me mordio una serpiente","me mordio un animal"] },
  { dest: "mordedura|picadura", frases: ["me pico una araña","me pico un alacran"] },
  { dest: "convulsion", frases: ["esta convulsionando","le dio un ataque","esta temblando todo","le agarro una convulsion"] },
  { dest: "panico", frases: ["tengo un ataque de panico","no puedo respirar de los nervios","tengo mucha angustia","me esta dando una crisis de nervios"] },
  { dest: "alergia", frases: ["tengo una reaccion alergica","me hinche entero","me llene de ronchas","me pico una abeja y me hinche","creo que es alergia"] },
  { dest: "cabeza", frases: ["me golpee la cabeza","me di un cabezazo","me pegue en la cabeza","me golpee fuerte la cabeza"] },
  { dest: "altura|mam", frases: ["tengo soroche","me falta el aire en la altura","tengo mal de altura","me agarro la puna","la altura me tiene mal"] },
  { dest: "frio|congelacion", frases: ["tengo mucho frio","estoy congelado","no siento los dedos","tengo los dedos morados","estoy tiritando","no siento las manos","tengo un dedo negro","se me congelaron los dedos"] },
  // --- señales de peligro (deben ir a la emergencia correcta) ---
  { dest: "inconsciente", frases: ["no respira","dejo de respirar","se puso morado","no reacciona para nada","no se despierta","esta inconsciente en el suelo","no le sale aire","se puso azul"] },
  { dest: "atragantamiento", frases: ["se esta ahogando con comida","se atoro con un pedazo","tiene algo atorado en la garganta","se atraganto comiendo"] },
  { dest: "convulsion", frases: ["le dio un ataque","esta temblando todo el cuerpo","le agarro una convulsion","esta convulsionando en el piso"] },
  { dest: "sangrado", frases: ["sale mucha sangre","hay sangre por todos lados","brota sangre de la herida","no puedo parar la sangre","sangra a chorro"] },
  { dest: "mordedura", frases: ["me mordio una vibora","me mordio una serpiente","me pico un alacran","me pico un escorpion"] },
  // --- altura / nieve (clave en montaña) ---
  { dest: "altura", frases: ["tengo soroche","me agarro el mal de altura","estoy apunado","me duele la cabeza por la altura","tengo nauseas en la altura","me falta el aire subiendo el cerro","mareo por la altura","no puedo dormir en la altura","la altura me tiene con dolor de cabeza"] },
  // --- ceguera de nieve ---
  { dest: "ceguera-nieve", frases: ["tengo ceguera de nieve","me arden los ojos por el sol","no veo bien por la nieve","ojos rojos por la nieve","siento arena en los ojos","me lloran los ojos por el reflejo"] },
  // --- labios / piel ---
  { dest: "labios-piel", frases: ["tengo los labios partidos","se me partieron los labios","tengo la piel agrietada","tengo la cara quemada por el viento","piel reseca por el frio"] },
  // --- caídas fuertes (modismos chilenos) ---
  { dest: "rodilla|hueso|cabeza", frases: ["me saque la cresta","me pegue un costalazo","me fui de boca","me saque la mugre"] },
  { dest: "cabeza", frases: ["me sale un cototo","tengo un chichon","me salio un chichon en la cabeza"] },
  // --- pedir ayuda sin saber qué ---
  { dest: "ayuda-general", frases: ["no se que tengo","no se que me pasa","que hago ahora","es una emergencia","no se que hacer"] },
  // --- dolor al defecar / hemorroides / estreñimiento ---
  { dest: "defecar", frases: ["me duele al cagar","me arde al cagar","me duele cuando voy al baño","tengo hemorroides","me sale sangre al cagar","estoy estreñido","llevo dias sin ir al baño","me duele el ano","me duele el poto al cagar"] },
  // --- herida infectada / pus ---
  { dest: "infeccion", frases: ["tengo pus en la herida","sale pus","se me infecto la herida","me sale liquido amarillo","la herida huele mal","me esta saliendo sangre con amarillo","la herida supura"] },
  // --- orinar / pis ---
  { dest: "orina", frases: ["quiero mear","necesito mear","quiero hacer pis","quiero orinar","tengo ganas de orinar","no puedo orinar","me arde al orinar","me duele al orinar","me arde cuando meo","sangre en la orina","voy mucho a orinar","tengo una infeccion urinaria","mear"] },
  // --- hipo ---
  { dest: "hipo", frases: ["tengo hipo","no se me quita el hipo","me dio hipo","tengo hipo y no para"] },
  // --- insomnio ---
  { dest: "insomnio", frases: ["no puedo dormir","tengo insomnio","no pego un ojo","me cuesta dormir","no duermo nada"] },
  // --- zumbido de oidos ---
  { dest: "zumbido", frases: ["me zumban los oidos","tengo un pitido en el oido","me suenan los oidos","escucho un pitido"] },
  // --- vista ---
  { dest: "vista", frases: ["veo borroso","veo nublado","se me nubla la vista","veo lucecitas"] },
  // --- encias ---
  { dest: "encias", frases: ["me sangran las encias","sangran las encias","tengo las encias hinchadas"] },
  // --- preguntas por un MEDICAMENTO concreto -> info de ese remedio ---
  { dest: "Adrenalina", frases: ["puedo inyectar adrenalina","me puedo inyectar adrenalina","para que sirve la adrenalina","cuando uso la adrenalina","sirve la adrenalina","puedo darme adrenalina","me puedo poner adrenalina","como uso el epipen"] },
  { dest: "Ibuprofeno", frases: ["puedo tomar ibuprofeno","cuanto ibuprofeno puedo tomar","sirve el ibuprofeno para el golpe","me tomo un ibuprofeno"] },
  { dest: "Paracetamol", frases: ["puedo tomar paracetamol","cuanto paracetamol tomo","sirve el paracetamol para la fiebre","me tomo un paracetamol"] },
  { dest: "Acetazolamida", frases: ["puedo tomar diamox","cuanta acetazolamida tomo","sirve el diamox para la altura"] },
  { dest: "Antihistamínico", frases: ["puedo tomar antihistaminico","sirve el antihistaminico para la alergia","me tomo la loratadina"] },
  { dest: "Antiemético", frases: ["puedo tomar algo para el vomito","cuando uso el antiemetico"] },
  { dest: "Torniquete", frases: ["puedo usar el torniquete","cuando uso el torniquete"] },
  { dest: "Antiséptico", frases: ["puedo usar povidona","sirve el antiseptico para la herida"] },
  // --- raspón / rasguño (leve) ---
  { dest: "raspon", frases: ["me raspe la rodilla","me raspe el brazo","me rasguñe","tengo un raspon","me pele la rodilla","me raspe la pierna"] },
  // --- caída grave (barranco / altura) ---
  { dest: "caida-grave", frases: ["me cai de un barranco","me cai de altura","me despeñe","cai de varios metros","me cai del cerro","cai por un precipicio","me cai escalando"] },
  // --- sobrevivir la noche / frío nocturno ---
  { dest: "supervivencia", frases: ["cuantas calorias debo comer para sobrevivir la noche","como sobrevivir la noche","como aguanto la noche de frio","sobrevivir el frio","sobrevivir en la nieve"] },
  // --- objeto clavado / empalamiento ---
  { dest: "objeto-clavado", frases: ["me incruste el palo de ski por accidente en mi pierna","me clave un fierro en la pierna","tengo un palo clavado","me empale","tengo algo clavado","se me clavo un palo","me clave una rama"] },
  // --- luxación / dislocación ---
  { dest: "luxacion", frases: ["se me salio el hombro","se me zafo el hombro","se me disloco la rodilla","tengo el hombro fuera de lugar","se me salio el brazo de lugar"] },
  // --- avalancha ---
  { dest: "avalancha", frases: ["me tapo una avalancha","quede enterrado en la nieve","me cubrio la nieve","nos tapo un alud","quede atrapado en la nieve"] },
  // --- caída al agua helada ---
  { dest: "agua-fria", frases: ["me cai al rio helado","me cai al agua","me cai a un lago helado","cai en agua fria","me moje entero en el rio"] },
  // --- diente por golpe ---
  { dest: "diente-golpe", frases: ["se me cayo un diente de un golpe","me rompi un diente","se me salto un diente","perdi un diente por un golpe","se me quebro un diente"] },
  // --- monóxido en carpa cerrada ---
  { dest: "monoxido", frases: ["cocine en la carpa y me duele la cabeza","me siento mal en la carpa cerrada","intoxicacion por monoxido","mareo en la carpa cerrada"] },
  // --- ACV / derrame ---
  { dest: "acv", frases: ["se le tuerce la cara","tiene la boca chueca","no puede hablar","no mueve un brazo","no mueve un lado del cuerpo","cara torcida","se le traba la lengua"] },
  // --- ataque de asma ---
  { dest: "asma", frases: ["tengo un ataque de asma","soy asmatico y me falta el aire","silbo al respirar","crisis de asma","me agarro el asma"] },
  // --- shock ---
  { dest: "shock", frases: ["esta palido y sudando frio","pulso debil y palido","sudor frio y debilidad","se puso palido y debil"] },
  // --- rayo / tormenta eléctrica ---
  { dest: "rayo", frases: ["me cayo un rayo","nos cayo un rayo","tormenta electrica","hay muchos rayos"] },
  // --- cara/nariz rota de un golpe -> trauma de cabeza ---
  { dest: "cabeza", frases: ["se me rompio la cara","me rompi la nariz de un golpe","me rompieron la cara","me quebre la mandibula de un golpe"] },
  // --- amputación / dedo cortado entero ---
  { dest: "amputacion", frases: ["me corte un dedo entero","se me corto el dedo","perdi un dedo","me corte la punta del dedo","me corte un dedo completo"] },
  // --- costilla ---
  { dest: "costilla", frases: ["me rompi una costilla","me duele la costilla al respirar","me quebre una costilla","me pegue en las costillas"] },
  // --- dedo machucado ---
  { dest: "dedo-machucado", frases: ["me machuque el dedo","me aplaste el dedo","me pille el dedo con la puerta","se me puso negra la uña"] },
  // --- garrapata ---
  { dest: "garrapata", frases: ["tengo una garrapata","se me pego una garrapata","como saco una garrapata"] },
  // --- apendicitis ---
  { dest: "apendicitis", frases: ["dolor fuerte abajo a la derecha de la panza","me duele mucho la parte baja derecha","creo que es apendicitis"] },
  // --- perdido ---
  { dest: "perdido", frases: ["estoy perdido","me perdi en la montaña","no se donde estoy","perdi el camino","no se como volver"] },
  // --- agotamiento ---
  { dest: "agotamiento", frases: ["estoy agotado","no puedo mas","estoy exhausto","no me dan las piernas","me quede sin fuerzas"] },
  // --- LOTE NUEVO ---
  { dest: "dedo-roto", frases: ["me rompi un dedo","me quebre un dedo","tengo un dedo roto","se me quebro un dedo","me fracture un dedo","me rompi el dedo del pie"] },
  { dest: "electrocucion", frases: ["me dio corriente","toque un cable y me dio corriente","me electrocute","me dio una descarga electrica","toque un cable pelado"] },
  { dest: "vomito-sangre", frases: ["vomito sangre","estoy vomitando sangre","vomite con sangre","sangre en el vomito","devuelvo sangre"] },
  { dest: "sangrado-oido", frases: ["me sale sangre del oido despues de un golpe","sangre por el oido","me sangra el oido tras golpearme la cabeza"] },
  { dest: "ahogamiento", frases: ["casi se ahoga en el rio","lo sacamos del agua","se ahogo en el lago","rescatamos a alguien del agua","casi me ahogo nadando"] },
  { dest: "hiperglucemia", frases: ["tengo el azucar por las nubes","azucar alta","soy diabetico y me siento mal","mucha sed y orino mucho","aliento dulce"] },
  { dest: "intoxicacion-comida", frases: ["comi algo en mal estado","me intoxique con la comida","tengo vomitos y diarrea","me cayo mal la comida","comida en mal estado"] },
  { dest: "colico-renal", frases: ["colico renal","dolor de rinon","piedra en el rinon","calculo renal","dolor que va de la espalda a la ingle"] },
  { dest: "lumbago", frases: ["me bloquee la espalda","lumbago","no me puedo enderezar","me agarro el lumbago","se me trabo la cintura"] },
  { dest: "desgarro", frases: ["me desgarre","me desgarre el gemelo","se me desgarro el musculo","senti un latigazo en el musculo","desgarro muscular"] },
  { dest: "pie-trinchera", frases: ["pie de trinchera","tengo los pies mojados y helados hace horas","pies blancos y entumecidos por humedad","tengo los pies congelados y mojados"] },
  { dest: "sabanones", frases: ["tengo sabañones","se me hincharon los dedos con el frio","tengo los dedos rojos e hinchados por el frio","me pican los dedos por el frio"] },
  { dest: "torticolis", frases: ["tengo torticolis","amaneci con el cuello trabado","no puedo girar el cuello","me quedo el cuello duro","tengo el cuello trabado"] },
  { dest: "cuerpo-oido", frases: ["se me metio un bicho en el oido","tengo algo en el oido","se me metio agua en el oido","tengo un insecto en el oido"] },
  { dest: "ojo-morado", frases: ["tengo un ojo morado","me golpee el ojo","me pegaron en el ojo","ojo hinchado por un golpe"] },
  { dest: "quemadura-quimica", frases: ["me cayo algo quimico en el ojo","quemadura quimica","me cayo lavandina","me cayo acido en la piel","me salpico acido"] },
  { dest: "una-encarnada", frases: ["tengo una uña encarnada","se me encarno la uña","la uña se me clava en el dedo","tengo la uña enterrada"] },
  { dest: "dolor-regla", frases: ["dolor de regla","colicos menstruales","me duele por la menstruacion","tengo colicos de la regla","dolor menstrual"] },
  { dest: "herpes-labial", frases: ["herpes labial","me salio un fuego en el labio","tengo una calentura en el labio","me salio herpes en la boca"] },
  // --- calor / golpe de calor (NO confundir con frío) ---
  { dest: "insolacion", frases: ["siento mucho mucho calor","tengo mucho calor","hace demasiado calor","me muero de calor","tengo muchisimo calor"] },
  // --- preguntas de DEFINICIÓN (glosario) ---
  { dest: "Anafilaxia", frases: ["que es la anafilaxia","que es anafilaxia","explicame la anafilaxia","que significa anafilaxia"] },
  { dest: "Hipotermia", frases: ["que es la hipotermia","que significa hipotermia"] },
  { dest: "Soroche / mal de altura", frases: ["que es el soroche","explicame el mal de altura"] },
  { dest: "Esguince", frases: ["que es un esguince","que significa esguince"] },
  { dest: "RCP", frases: ["que es la rcp","que es rcp"] },
  { dest: "ACV / derrame", frases: ["que es un acv","que es un derrame cerebral"] },
  { dest: "Shock", frases: ["que es el shock","que es estar en shock"] },
  { dest: "Adrenalina (epinefrina)", frases: ["que es la adrenalina","que es la epinefrina"] },
  { dest: "Fractura", frases: ["que es una fractura","que significa fractura"] },
  { dest: "Edema (de altura)", frases: ["que es el edema pulmonar","que es un edema"] },
  // --- palpitaciones / corazón acelerado (sin dolor) ---
  { dest: "palpitaciones", frases: ["tengo el corazon acelerado","me late muy rapido el corazon","como bajo las pulsaciones","debo calmar el pulso del corazon","tengo taquicardia","se me acelera el corazon"] },
  // --- golpe en el abdomen ---
  { dest: "golpe-abdomen", frases: ["me golpee fuerte el estomago","me golpee el estomago","me pegaron en la panza","me golpee el abdomen","recibi un golpe en el abdomen"] },
  // --- no poder mover un miembro -> posible fractura ---
  { dest: "hueso", frases: ["no puedo mover la pierna","no puedo mover el brazo","no siento la pierna","no me responde la mano","no puedo mover la mano"] },
  // --- preguntas de seguimiento (sin memoria -> guía general) ---
  { dest: "ayuda-general", frases: ["que me pongo","me puedo poner algo","que hago ahora","que mas hago","algo mas que pueda hacer","y ahora que hago","que mas puedo hacer","me pongo algo"] },
  // --- "me pongo/aplico/tomo suero" (distinguir tipo de suero) ---
  { dest: "Suero fisiológico", frases: ["me pongo suero","me aplico suero","me pongo suero en la herida"] },
  { dest: "Sales de rehidratación", frases: ["me tomo suero","tomar suero","quiero tomar suero"] },
  { dest: "Colirio", frases: ["me pongo suero en el ojo","suero ocular","lavado ocular"] },
  // --- contextos LARGOS (frases con varias partes) ---
  { dest: "altura", frases: ["me duele mucho la cabeza desde que subimos a la montaña y tengo nauseas","tengo nauseas y dolor de cabeza desde que estamos en la altura","me falta el aire desde que subimos al cerro"] },
  { dest: "sangrado", frases: ["me corte la mano con un cuchillo en la cocina y sale mucha sangre","me hice un corte profundo en el brazo y no para de sangrar","me corte con un vidrio y sangra bastante"] },
  { dest: "inconsciente", frases: ["se cayo mi amigo de un barranco y no responde","encontre a alguien tirado que no responde ni respira","mi compañero se desmayo y no despierta"] },
  { dest: "hueso", frases: ["me cai esquiando y no puedo mover la pierna del dolor","me golpee fuerte y creo que me quebre el brazo porque no lo puedo mover"] },
  { dest: "quemadura", frases: ["se me volco agua hirviendo en el brazo y me queme","me queme la mano con la olla cocinando"] },
  // --- lote de auditoría: escenarios y arreglos nuevos ---
  { dest: "contusion", frases: ["me salio un moreton enorme","tengo un moreton","me di un golpe fuerte en la pierna","me pegue fuerte en el brazo","me magulle"] },
  { dest: "timpano", frases: ["se me rompio el oido","se me revento el timpano","se me perforo el timpano","me reventé el oido"] },
  { dest: "pecho", frases: ["me duele el pecho","me duele el pecho y se corre al brazo izquierdo con sudor frio","opresion en el pecho","me aprieta el pecho"] },
  { dest: "alergia", frases: ["se me cierra la garganta","se me hincha la lengua","me llene de ronchas","me pica todo el cuerpo","le cuesta respirar y se le hincha la cara"] },
  { dest: "dolor-cabeza", frases: ["me duele la cabeza hace dos dias","tengo una jaqueca terrible","me esta matando la cabeza","me parte la cabeza"] },
  { dest: "resfrio", frases: ["tengo tos seca","estoy todo congestionado","tengo la nariz tapada","estoy engripado"] },
  { dest: "deshidratacion", frases: ["tengo mucha sed","me quede sin agua y tengo mucha sed","tengo la boca muy seca"] },
  { dest: "ojo", frases: ["me entro una basurita al ojo","tengo los ojos rojos","me arde el ojo","tengo algo en el ojo"] },
  { dest: "panza", frases: ["me agarraron retortijones","tengo retortijones","colicos de panza"] },
  { dest: "garganta", frases: ["no puedo tragar nada","me cuesta tragar","me duele al tragar"] },
  { dest: "frio", frases: ["tengo la nariz congelada","se me congelo la nariz","tengo las orejas congeladas"] },
  { dest: "altura", frases: ["me cuesta respirar aca arriba","me duele la cabeza aca arriba","tengo nauseas en la cima"] },
  { dest: "Corticoide", frases: ["que hace la dexametasona","para que es el corticoide"] },
  // --- lote audit2: escenarios nuevos ---
  { dest: "flato", frases: ["tengo una puntada en el costado de tanto correr","me dio flato corriendo","tengo flato","puntada al costado corriendo"] },
  { dest: "mareo-movimiento", frases: ["me mareo en el auto","me mareo en el bus y tengo nauseas","me mareo viajando a la montaña","me mareo en la micro"] },
  { dest: "rozadura", frases: ["me rozaron las correas de la mochila","me roza la entrepierna de caminar","tengo rozadura por la mochila","me roza el zapato"] },
  { dest: "golpe-genitales", frases: ["me pegaron una patada en los testiculos","me golpee los huevos","me golpee los testiculos","golpe en la ingle"] },
  { dest: "humo", frases: ["hay mucho humo y me cuesta respirar","trague humo del fuego","inhale humo","me ahogo con el humo"] },
  { dest: "planta-urticante", frases: ["toque una ortiga y me arde la piel","me pico una ortiga","me roce con una planta y me arde","toque una planta urticante"] },
  { dest: "aftas", frases: ["tengo llagas en la boca","me salio un afta en la lengua","tengo aftas","tengo una llaga en la boca que arde"] },
  { dest: "pre-desmayo", frases: ["siento que me voy a desmayar","estoy por desmayarme veo todo negro","me voy a desmayar","estoy a punto de desmayarme"] },
];

// ---------------- construir casos ----------------
const casos = [];
LESION.forEach((L) => {
  const partes = L.partes || PARTES;
  L.verbos.forEach((v) => partes.forEach((p) => {
    if (L.suf) casos.push([`${v} ${art(p)}`, L.dest]);       // "me sangra la mano"
    else casos.push([`${v} ${art(p)}`, L.dest]);
  }));
});
ESGUINCE.verbos.forEach((v) => ESGUINCE.partes.forEach((p) => casos.push([`${v} ${art(p)}`, ESGUINCE.dest])));
DOLOR_VERBOS.forEach((v) => PARTES_DOLOR.forEach((p) => casos.push([`${v} ${art(p)}`, "dolor-muscular"])));
SINTOMAS.forEach((S) => S.frases.forEach((f) => casos.push([f, S.dest])));

// Si nos importan como módulo, exportamos las familias y herramientas y NO corremos.
if (require.main !== module) {
  module.exports = { casos, typo, art, LESION, ESGUINCE, DOLOR_VERBOS, PARTES, PARTES_DOLOR, SINTOMAS };
  return;
}

const PREFIJOS_FULL = ["", "oe ", "uff ", "ayuda ", "auxilio ", "creo que ", "parece que ", "hermano ", "amigo ", "po ", "wn ", "oye ", "necesito ayuda "];
// para descubrir huecos basta con 4 prefijos representativos (rápido);
// --full usa los 13 para la validación final (~13k frases).
const PREFIJOS = process.argv.includes("--full") ? PREFIJOS_FULL
  : process.argv.includes("--base") ? [""]
  : ["", "amigo ", "creo que ", "po "];
// banda limpia + un poco de typo liviano (lo realista). El ruido extremo no aporta.
const BANDAS = process.argv.includes("--typos") ? [0, 0.08, 0.14] : [0];

function ok(esperado, res) {
  return esperado.split("|").some((e) => e === res.id || `${res.tipo}:${res.id}`.includes(e));
}

let total = 0, pasa = 0, limpioT = 0, limpioP = 0;
const fallosLimpios = {};
let idx = 0;
for (const [frase, dest] of casos) {
  for (const pre of PREFIJOS) {
    for (const band of BANDAS) {
      idx++;
      const f = pre + typo(frase, band);
      const res = rutear(f);
      const bien = ok(dest, res);
      total++; if (bien) pasa++;
      if (band === 0) {
        limpioT++; if (bien) limpioP++;
        if (!bien) {
          (fallosLimpios[dest] = fallosLimpios[dest] || []).push(`"${f}" → ${res.tipo}:${res.id}`);
        }
      }
    }
  }
}

console.log(`\n=== TEST CONTEXTOS (${total.toLocaleString()} frases) ===`);
console.log(`Total:  ${pasa}/${total}  (${(100*pasa/total).toFixed(1)}%)`);
console.log(`LIMPIO: ${limpioP}/${limpioT}  (${(100*limpioP/limpioT).toFixed(2)}%)   ← lo que importa`);
const escFall = Object.keys(fallosLimpios);
console.log(`Escenarios con fallos limpios: ${escFall.length}`);
if (verFallos) {
  for (const k of escFall) {
    console.log(`\n[${k}]  ${fallosLimpios[k].length} fallos:`);
    [...new Set(fallosLimpios[k])].slice(0, 12).forEach((x) => console.log("   ✗ " + x));
  }
}
