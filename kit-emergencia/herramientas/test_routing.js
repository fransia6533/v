/* Test harness offline: replica la lógica del chat (chat.js) y prueba miles
   de frases naturales para ver a qué situación/consejo/ítem rutean.
   Uso: node herramientas/test_routing.js            (resumen)
        node herramientas/test_routing.js --fallos    (lista fallos)
   No toca la app; sólo carga datos.js + fuzzy.js en un sandbox. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const dir = path.join(__dirname, "..");
const ctx = { window: undefined, console, setTimeout, document: undefined };
ctx.globalThis = ctx;
vm.createContext(ctx);
// Cargamos fuzzy + datos en UN solo scope para ver los const top-level.
const bundle =
  fs.readFileSync(path.join(dir, "fuzzy.js"), "utf8") + "\n" +
  fs.readFileSync(path.join(dir, "datos.js"), "utf8") + "\n" +
  "globalThis.__x = { TRIAGE, CONSEJOS, BOTIQUIN_DEFAULT, Fuzzy, REGLAS, MEDICAMENTOS, MED_MARCADOR, GLOSARIO, DEF_MARCADOR };";
vm.runInContext(bundle, ctx, { filename: "bundle.js" });

const { TRIAGE, CONSEJOS, BOTIQUIN_DEFAULT, Fuzzy, REGLAS, MEDICAMENTOS, MED_MARCADOR, GLOSARIO, DEF_MARCADOR } = ctx.__x;

// --- réplica del expandir() de chat.js ---
const SLANG = {
  "guata": "panza", "guatita": "panza", "wawa": "panza",
  "estoy enfermo del guata": "me duele la panza", "ando mal del guata": "me duele la panza",
  "me eche a perder el estomago": "me duele la panza", "ando mal del estomago": "me duele la panza",
  "pata": "pierna", "patas": "piernas", "pata rota": "pierna rota",
  "cabeza me estalla": "dolor de cabeza", "jaqueca": "dolor de cabeza", "me duele el coco": "dolor de cabeza",
  "chuchaqui": "resaca", "cana": "resaca", "goma": "resaca", "cruda": "resaca", "guayabo": "resaca",
  "me cure": "tengo resaca", "ando curado": "tengo resaca", "estoy con la goma": "tengo resaca",
  "ando con la cana": "tengo resaca", "estoy pasado de copas": "tengo resaca",
  "me chante": "me desmaye", "me desplome": "me desmaye", "me desmaye": "me desmaye",
  "me dio la palida": "me voy a desmayar", "la palida": "me voy a desmayar",
  "me dio un patatus": "me voy a desmayar", "me dio un soponcio": "me voy a desmayar",
  "me dio un yeyo": "me voy a desmayar", "me dio un telele": "me voy a desmayar",
  "me saque la cresta": "me cai fuerte", "me saque la mugre": "me cai fuerte", "me saque la chucha": "me cai fuerte",
  "me pegue un costalazo": "me cai fuerte", "me di un porrazo": "me golpee fuerte",
  "me fui de boca": "me cai fuerte", "me fui de hocico": "me cai fuerte", "me pegue": "me golpee",
  "cototo": "chichon", "chichon": "golpe en la cabeza",
  "estoy hecho bolsa": "me duele todo el cuerpo", "estoy hecho pebre": "me duele todo el cuerpo",
  "estoy molido": "me duele todo el cuerpo", "quede muerto": "me duele todo el cuerpo",
  "me agarro un aire": "tengo torticolis", "me dio un aire": "tengo torticolis",
  "ando con tiriton": "tengo escalofrios", "tiriton": "escalofrios",
  "devolvi": "vomite mucho", "eche la pota": "vomite mucho", "lance": "vomite mucho", "eche la chola": "vomite mucho",
  "me vino la regla": "dolor de regla", "estoy indispuesta": "dolor de regla", "ando con la regla": "dolor de regla",
  "ando achacado": "me siento mal", "estoy achacado": "me siento mal", "ando pa la caga": "me siento mal",
  "estoy pa la caga": "me siento mal", "ando desganado": "me siento mal",
  "se me bajo la presion": "me voy a desmayar", "me dio un bajon": "me siento debil",
  "wea": " ", "weas": " ", "po": " ", "cachai": " ", "oe": " ", "loco": " ", "weon": " ", "wn": " ",
  "pucha": " ", "chuta": " ", "ufa": " ", "altiro": " ", "filo": " ", "ya po": " ", "posta": " ",
  "remedios": "remedio", "pastillas": "pastilla", "pastis": "pastilla", "remedito": "remedio",
};
const MULETILLAS_FRASE = ["creo que", "parece que", "siento que", "me parece que",
  "la verdad que", "necesito ayuda", "necesito que me ayudes", "ayuda urgente", "es urgente", "es una urgencia"];
const MULETILLAS = ("amigo amiga hermano hermana pana wey wn weon weón men " +
  "creo parece oye oiga hola disculpa disculpame perdon perdona perdoname mira " +
  "che socorro auxilio ayuda ayudame ayudenme porfa porfavor porfis uff uf ufff aaa ay " +
  "urgente urgentemente oye compadre causa brother bro hey eh").split(" ");
const reMule = new RegExp("\\b(" + MULETILLAS_FRASE.concat(MULETILLAS).join("|") + ")\\b", "g");
function expandir(t) {
  let s = " " + (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") + " ";
  for (const k in SLANG) s = s.split(" " + k + " ").join(" " + SLANG[k] + " ");
  s = s.replace(reMule, " ");
  return s.replace(/\s+/g, " ").trim();
}

// --- réplica del responder() de chat.js: devuelve {tipo,id,score} ---
// Memo por texto EXPANDIDO: los prefijos coloquiales colapsan al mismo texto,
// así 10k+ contextos corren rápido sin cambiar el resultado de ninguno.
const _memo = new Map();
function rutear(textoOriginal) {
  const texto = expandir(textoOriginal);
  if (_memo.has(texto)) return _memo.get(texto);
  const res = _rutearReal(texto);
  _memo.set(texto, res);
  return res;
}
const reSeguir = /^(y |y ahora |ahora |entonces |despues |y despues |y luego |bueno |ok )*(que (hago|hago ahora|mas hago|mas puedo hacer|sigue|hago despues|otra cosa hago)|que me (pongo|aplico|hecho|echo)|que me puedo (poner|aplicar|echar)|me puedo poner algo|me pongo algo|que mas|algo (mas )?(que )?(pueda|puedo) (hacer|poner|aplicar)|que mas puedo hacer|necesito (hacer )?algo mas|hay algo mas que pueda hacer|y despues|y luego|eso es grave|es grave|es peligroso|es serio|me tengo que preocupar|cuando (tengo que )?(bajar|preocuparme)|cuando (pido|llamo a?) (rescate|emergencias|ayuda))\s*\??$/;
function _rutearReal(texto) {
  // 0) reglas de alta confianza (igual que chat.js)
  const norm = Fuzzy.normalizar(texto);
  // seguimiento vago, sin memoria en el test -> ayuda-general (default seguro)
  if (reSeguir.test(norm)) return { tipo: "consejo", id: "ayuda-general", score: 1 };
  // pregunta de definición ("que es la anafilaxia")
  if (DEF_MARCADOR.test(norm)) {
    const palabras = norm.split(/\s+/).filter((w) => w.length >= 4);
    let mejor = null, mejorS = 0;
    for (const g of GLOSARIO) for (const k of g.claves) {
      let s = 0;
      if ((" " + norm + " ").includes(" " + k + " ")) s = 1 + k.length / 100;
      else for (const w of palabras) { const sim = Fuzzy.simPalabra(w, k); if (sim > s) s = sim * 0.9; }
      if (s > mejorS && s >= 0.82) { mejorS = s; mejor = g; }
    }
    if (mejor) return { tipo: "def", id: mejor.titulo, score: 1 };
  }
  // pregunta por un medicamento concreto
  if (MED_MARCADOR.test(norm)) {
    for (const m of MEDICAMENTOS) {
      if (m.re.test(norm)) {
        const it = BOTIQUIN_DEFAULT.find((x) => x.objeto === m.nombre) || BOTIQUIN_DEFAULT.find((x) => x.objeto.indexOf(m.nombre) === 0);
        if (it) return { tipo: "item", id: m.nombre, score: 1 };
      }
    }
  }
  for (const rg of REGLAS) {
    if (rg.re.test(norm)) return { tipo: rg.tipo, id: rg.id, score: 1 };
  }
  const cand = [];
  TRIAGE.forEach((s) => cand.push({ objeto: s.titulo, tambien: (s.sintomas || []).join(", "), _t: "sit", _id: s.id }));
  CONSEJOS.forEach((c) => cand.push({ objeto: c.id.replace(/-/g, " "), tambien: (c.sintomas || []).join(", "), _t: "consejo", _id: c.id }));
  BOTIQUIN_DEFAULT.forEach((it) => cand.push({ objeto: it.objeto, tambien: it.tambien || "", _t: "item", _id: it.id || it.objeto }));

  const rank = Fuzzy.rankear(texto, cand);
  let top = rank[0];
  if (top && top.item._t === "item" && top.score < 0.62) {
    const alt = rank.find((r) => r.item._t !== "item" && r.score >= 0.45);
    if (alt) top = alt;
  }
  if (!top || top.score < 0.45) return { tipo: "nada", id: null, score: top ? top.score : 0 };
  return { tipo: top.item._t, id: top.item._id, score: +top.score.toFixed(2) };
}

// ============================================================================
// CASOS: frase -> destino esperado (tipo:id  o sólo id si da igual el tipo)
// Cada destino acepta varios ids válidos separados por "|".
// ============================================================================
const CASOS = [];
const C = (frase, esperado) => CASOS.push({ frase, esperado });

// ----- verbos de lesión (deben dominar sobre la parte del cuerpo) -----
const PARTES = ["pierna","brazo","mano","dedo","pie","tobillo","rodilla","cadera","muñeca","hombro","cuello","costilla","muslo","espalda","la cabeza","el codo","la nariz","el tobillo"];
PARTES.forEach((p) => {
  C(`me corté ${p}`, "sangrado");
  C(`me corte ${p}`, "sangrado");
  C(`me quemé ${p}`, "quemadura");
  C(`me queme ${p}`, "quemadura");
  // cabeza/nariz -> trauma de cabeza; costilla -> costilla; dedo -> dedo-roto
  const dest = /cabeza|nariz/.test(p) ? "cabeza" : /costilla/.test(p) ? "costilla" : /dedo/.test(p) ? "dedo-roto" : "hueso";
  C(`me rompí ${p}`, dest);
  C(`me quebré ${p}`, dest);
  C(`me fracturé ${p}`, dest);
  C(`me partí ${p}`, dest);
});

// ----- dolor en parte sin escenario propio -> dolor-muscular -----
["el trasero","la espalda","el hombro","el brazo","la cadera","el muslo","la pantorrilla","los gemelos","la nuca","el cuello","las costillas","la cintura","los riñones","el gluteo","la nalga","el antebrazo","todo el cuerpo","todo","las piernas","los brazos","la ingle","la axila"].forEach((p) => {
  C(`me duele ${p}`, "dolor-muscular");
});

// ----- frío / entumecimiento -----
["no siento los dedos","no siento las manos","no siento el pie","tengo un dedo negro","se me congelaron los dedos","tengo los dedos morados","tengo mucho frio","estoy tiritando","dedos blancos y duros","manos dormidas"].forEach((f) => C(f, "frio|congelacion"));

// ----- caídas -----
C("me caí de rodillas", "rodilla|hueso|cabeza");
C("me resbalé y me caí", "rodilla|hueso|cabeza");
C("me torcí el tobillo", "rodilla");
C("se me dobló la rodilla", "rodilla");

// ----- síntomas comunes -----
C("me duele la cabeza", "dolor-cabeza");
C("me parte la cabeza", "dolor-cabeza");
C("tengo jaqueca", "dolor-cabeza");
C("tengo fiebre", "fiebre");
C("estoy afiebrado", "fiebre");
C("tengo nauseas", "nauseas");
C("tengo ganas de vomitar", "nauseas");
C("me duele la panza", "panza");
C("me duele el estomago", "panza");
C("tengo diarrea", "diarrea");
C("ando suelto del estomago", "diarrea");
C("estoy mareado", "mareo");
C("todo me da vueltas", "mareo");
C("estoy deshidratado", "deshidratacion");
C("tengo una ampolla", "ampolla");
C("me salio una ampolla en el pie", "ampolla");
C("estoy resfriado", "resfrio");
C("tengo tos", "resfrio");
C("me pico un mosquito", "picadura");
C("me picaron", "picadura");
C("me queme con el sol", "quemadura-sol");
C("me sangra la nariz", "sangrado-nariz");
C("me duele la muela", "muela");
C("me duele el diente", "muela");
C("tengo un calambre", "calambre");
C("se me acalambro la pierna", "calambre");
C("me siento debil y tembloroso", "hipoglucemia|malestar");
C("me entro algo al ojo", "ojo");
C("me duele la garganta", "garganta");
C("me duele el oido", "oido");
C("me clave una astilla", "astilla");
C("me clave una espina", "astilla");

// ----- "qué pastillas / remedios" -----
["que pastillas debo tomar","que pastilla tomo","necesito un analgesico","dame algo para el dolor","que remedio tomo","necesito algo para el dolor","que me puedo tomar","quiero un calmante","algo antiinflamatorio","que medicamento tomo"].forEach((f) => C(f, "que-tomar"));

// ----- malestar general -----
["me siento mal","no me siento bien","estoy hecho mierda","me siento raro","me siento para atras","no ando bien"].forEach((f) => C(f, "malestar"));

// ----- resaca -----
["tengo resaca","ando con caña","estoy crudo","tengo chuchaqui","tome mucho anoche","ando mal del trago"].forEach((f) => C(f, "resaca"));

// ----- emergencias graves -----
C("alguien se desmayo", "inconsciente");
C("no respira", "inconsciente");
C("me duele el pecho", "pecho");
C("me duele el pecho y el brazo", "pecho");
C("se atraganto con comida", "atragantamiento");
C("me mordio una serpiente", "mordedura-serpiente");
C("me pico una araña", "arana-rincon");
C("me mordio una araña del rincon", "arana-rincon");
C("me mordio una viuda negra", "arana-trigo");
C("me pico un alacran", "picadura-alacran");
C("esta convulsionando", "convulsion");
C("tengo un ataque de panico", "panico");
C("no puedo respirar de los nervios", "panico");
C("me pico una abeja y me hincho", "alergia");
C("tengo una reaccion alergica", "alergia");
C("me golpee la cabeza", "cabeza");
C("me di un cabezazo", "cabeza");
C("tengo soroche", "altura|mam");
C("me falta el aire en la altura", "altura|mam");

// ----- typos fuertes -----
C("me duele la cabesa", "dolor-cabeza");
C("tngo fiebre", "fiebre");
C("me duele la pansa", "panza");
C("tngo nauseas", "nauseas");
C("me corte el braso", "sangrado");
C("me qebre la pierna", "hueso");
C("dolor de cabesa", "dolor-cabeza");

// ============================================================================
function ok(esperado, res) {
  const ids = esperado.split("|");
  return ids.some((e) => e === res.id || `${res.tipo}:${res.id}`.includes(e));
}

if (require.main !== module) { module.exports = { rutear, expandir, TRIAGE, CONSEJOS }; return; }

let pasa = 0;
const fallos = [];
for (const c of CASOS) {
  const res = rutear(c.frase);
  if (ok(c.esperado, res)) pasa++;
  else fallos.push({ frase: c.frase, esperado: c.esperado, got: `${res.tipo}:${res.id}`, score: res.score });
}

console.log(`\n=== ROUTING TEST ===`);
console.log(`Total: ${CASOS.length}  |  Pasan: ${pasa}  |  Fallan: ${fallos.length}  |  ${(100*pasa/CASOS.length).toFixed(1)}%\n`);
if (fallos.length && (process.argv.includes("--fallos") || fallos.length <= 40)) {
  console.log("FALLOS:");
  fallos.forEach((f) => console.log(`  ✗ "${f.frase}"  esperaba [${f.esperado}]  →  ${f.got} (${f.score})`));
}
module.exports = { rutear };
