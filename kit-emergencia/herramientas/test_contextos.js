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
const PARTES_DOLOR = ["espalda","trasero","cintura","nuca","cuello","hombro","brazo","muslo","cadera","gluteo","nalga","pantorrilla","gemelo","costado","ingle","axila","riñones","lomo","antebrazo","codo","abdomen","espinilla","las piernas","los brazos"];

// ---------------- familias: verbo/frase -> escenario ----------------
// Lesiones que se combinan con una parte del cuerpo
const LESION = [
  { verbos: ["me corte","me corté","me hice un corte en","me hice un tajo en","me raje","me rajé","me abri","me corte feo","me hice una herida en"], dest: "sangrado" },
  { verbos: ["sangra","me sangra","no para de sangrar","esta sangrando","sangro por"], dest: "sangrado", suf: true },
  { verbos: ["me queme","me quemé","me chamusque","me queme feo","me agarro fuego en"], dest: "quemadura" },
  { verbos: ["me quebre","me quebré","me rompi","me rompí","me fracture","me fracturé","me parti","me partí","creo que me quebre","se me rompio","se me quebro","me destroce"], dest: "hueso", partes: PARTES.filter((p)=>p!=="rodilla") },
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
