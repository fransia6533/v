/* Test masivo: genera miles de frases naturales (verbos × partes × prefijos
   coloquiales × typos) y mide a qué rutean. Reutiliza rutear() del otro test.
   Uso: node herramientas/test_masivo.js [--fallos] [--n=20000] */
"use strict";
const { rutear } = require("./test_routing.js");

const args = process.argv.slice(2);
const N = (args.find((a) => a.startsWith("--n=")) || "--n=20000").split("=")[1] | 0;
const verFallos = args.includes("--fallos");

// generador de typos realistas (teclas vecinas, letras dobles, swaps, omisiones)
const VECINAS = { a:"sq", e:"rwd", i:"ou", o:"ipl", u:"yi", s:"ad", n:"mb", r:"et", l:"k", c:"vx", t:"ry", m:"n", d:"sf", b:"vn", p:"o", g:"hf", q:"wa", v:"bc" };
function typo(s, intensidad) {
  let out = "";
  for (const ch of s) {
    const r = pseudo(out.length + ch.charCodeAt(0));
    if (ch !== " " && r < intensidad) {
      const k = (r * 100) % 4 | 0;
      if (k === 0 && VECINAS[ch]) out += VECINAS[ch][(r * 1000) % VECINAS[ch].length | 0];
      else if (k === 1) out += ch + ch;          // doble
      else if (k === 2) continue;                 // omite
      else out += ch;                             // (swap simplificado) deja igual
    } else out += ch;
  }
  return out;
}
// pseudoaleatorio determinista (sin Math.random, para reproducibilidad)
let _seed = 12345;
function pseudo(salt) { _seed = (_seed * 1103515245 + 12345 + salt) & 0x7fffffff; return _seed / 0x7fffffff; }

// --- plantillas: cada una produce frase + destino esperado ---
const PARTES_GEN = ["pierna","brazo","mano","dedo","pie","tobillo","rodilla","cadera","muñeca","hombro","costilla","muslo","antebrazo","gemelo","pantorrilla"];
const PARTES_DOLOR = ["espalda","trasero","cintura","nuca","cuello","hombro","brazo","muslo","cadera","gluteo","nalga","pantorrilla","gemelo","costado","ingle","axila","riñones","lomo","antebrazo","codo"];
const PREFIJOS = ["", "oe ", "uff ", "ayuda ", "auxilio ", "creo que ", "parece que ", "hermano ", "amigo ", "po ", "wn "];

const PLANTILLAS = [];
const T = (fn) => PLANTILLAS.push(fn);

PARTES_GEN.forEach((p) => {
  T(() => [`me corte ${art(p)}`, "sangrado"]);
  T(() => [`me corte ${art(p)} con un cuchillo`, "sangrado"]);
  T(() => [`me queme ${art(p)}`, "quemadura"]);
  T(() => [`me rompi ${art(p)}`, p === "rodilla" ? "hueso|rodilla" : "hueso"]);
  T(() => [`me quebre ${art(p)}`, p === "rodilla" ? "hueso|rodilla" : "hueso"]);
  T(() => [`me fracture ${art(p)}`, p === "rodilla" ? "hueso|rodilla" : "hueso"]);
});
PARTES_DOLOR.forEach((p) => {
  T(() => [`me duele ${art(p)}`, "dolor-muscular"]);
  T(() => [`tengo dolor en ${art(p)}`, "dolor-muscular"]);
  T(() => [`me molesta ${art(p)}`, "dolor-muscular|nada"]);
});
// síntomas comunes con muchas variantes de prefijo
const SINT = [
  ["me duele la cabeza", "dolor-cabeza"], ["tengo dolor de cabeza", "dolor-cabeza"],
  ["tengo fiebre", "fiebre"], ["estoy con fiebre", "fiebre"],
  ["tengo nauseas", "nauseas"], ["tengo ganas de vomitar", "nauseas"],
  ["me duele la panza", "panza"], ["me duele el estomago", "panza"],
  ["tengo diarrea", "diarrea"], ["estoy mareado", "mareo"],
  ["tengo tos", "resfrio"], ["estoy resfriado", "resfrio"],
  ["me pico un mosquito", "picadura"], ["me salio una ampolla", "ampolla"],
  ["me sangra la nariz", "sangrado-nariz"], ["me duele la muela", "muela"],
  ["tengo un calambre", "calambre"], ["me duele la garganta", "garganta"],
  ["me duele el oido", "oido"], ["me clave una astilla", "astilla"],
  ["que pastilla tomo", "que-tomar"], ["dame algo para el dolor", "que-tomar"],
  ["necesito un analgesico", "que-tomar"], ["que me puedo tomar", "que-tomar"],
  ["me siento mal", "malestar"], ["no me siento bien", "malestar"],
  ["tengo resaca", "resaca"], ["me duele el pecho", "pecho"],
  ["no respira", "inconsciente"], ["se desmayo", "inconsciente"],
  ["me mordio una vibora", "mordedura"], ["esta convulsionando", "convulsion"],
  ["tengo soroche", "altura|mam"], ["no siento los dedos", "frio|congelacion"],
  ["tengo un dedo negro", "frio|congelacion"], ["me golpee la cabeza", "cabeza"],
];
SINT.forEach(([f, d]) => T(() => [f, d]));

function art(p) {
  const fem = /a$|cion$|riz$/.test(p) && !/dia$/.test(p);
  const plur = /s$/.test(p);
  if (plur) return "los " + p;
  return (fem ? "la " : "el ") + p;
}

function ok(esperado, res) {
  return esperado.split("|").some((e) => e === res.id || `${res.tipo}:${res.id}`.includes(e));
}

let pasa = 0, total = 0;
const fallos = [];
const porIntensidad = {};
for (let i = 0; i < N; i++) {
  const tpl = PLANTILLAS[(i * 2654435761) % PLANTILLAS.length];
  let [frase, esperado] = tpl();
  const pre = PREFIJOS[(i * 40503) % PREFIJOS.length];
  // intensidad de typo escalonada: 60% limpio, resto con ruido creciente
  const band = (i % 5);
  const intensidad = band === 0 ? 0.18 : band === 1 ? 0.10 : 0;
  frase = pre + typo(frase, intensidad);
  const res = rutear(frase);
  total++;
  const bien = ok(esperado, res);
  if (bien) pasa++;
  else {
    if (fallos.length < 60) fallos.push({ frase, esperado, got: `${res.tipo}:${res.id}`, intensidad });
    porIntensidad[intensidad] = (porIntensidad[intensidad] || 0) + 1;
  }
}

console.log(`\n=== TEST MASIVO ===`);
console.log(`Frases probadas: ${total}`);
console.log(`Aciertos: ${pasa}  (${(100 * pasa / total).toFixed(1)}%)   Fallos: ${total - pasa}`);
console.log(`Fallos por intensidad de typo:`, porIntensidad);
if (verFallos) {
  console.log(`\nMuestra de fallos:`);
  fallos.forEach((f) => console.log(`  ✗ "${f.frase}"  esp[${f.esperado}] → ${f.got}  (typo ${f.intensidad})`));
}
