/* ============================================================================
   test_10k.js — Genera 10.000+ contextos y testea CADA UNO.
   Cruza: frases base (lesiones, dolores, síntomas, emergencias, modismos)
        × prefijos coloquiales (amigo, wn, creo que, oe, po, hermano…)
        × bandas de typo (limpio, leve, medio).
   Reporta harta data: total, exactitud global, tabla por escenario,
   desglose por prefijo y por nivel de typo, y ejemplos de fallos.
   Uso: node herramientas/test_10k.js [--n=10000] [--typos]
   ============================================================================ */
"use strict";
const { rutear } = require("./test_routing.js");
const { casos, typo } = require("./test_contextos.js");

const argN = (process.argv.find((a) => a.startsWith("--n=")) || "").split("=")[1];
const OBJETIVO = argN ? (argN | 0) : 10000;

// Prefijos coloquiales / muletillas que la gente realmente escribe.
const PREFIJOS = ["", "", "oe ", "uff ", "ayuda ", "auxilio ", "creo que ", "parece que ",
  "hermano ", "amigo ", "po ", "wn ", "oye ", "necesito ayuda ", "hola ", "disculpa ",
  "porfa ", "che ", "compadre "];
// Sufijos coloquiales que tampoco deben romper nada (la app los descarta como
// muletillas, así que dan variedad real al texto SIN multiplicar el costo).
const SUFIJOS = ["", "", "", " po", " wn", " oe", " loco", " po wn", " porfa", " urgente"];
// Bandas de typo: la mayoría limpio (lo realista), algo de ruido leve/medio.
// Pocos typos = menos strings únicos = el test de 35k entra en tiempo.
const BANDAS = [0, 0, 0, 0, 0, 0, 0, 0, 0.08, 0.12];

function ok(esperado, res) {
  return esperado.split("|").some((e) => e === res.id || `${res.tipo}:${res.id}`.includes(e));
}

// Mezcla determinista (sin Math.random, reproducible).
let s = 2463534242;
function rnd() { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296); }
const pick = (arr) => arr[(rnd() * arr.length) | 0];

// ---- generar OBJETIVO contextos ----
const muestras = [];
let i = 0;
while (muestras.length < OBJETIVO) {
  const [frase, dest] = casos[i % casos.length];
  const pre = pick(PREFIJOS);
  const suf = pick(SUFIJOS);
  const band = pick(BANDAS);
  const texto = (pre + typo(frase, band) + suf).replace(/\s+/g, " ").trim();
  muestras.push({ texto, dest, base: frase, pre: pre.trim() || "—", band });
  i++;
}

// ---- testear cada uno ----
const t0 = Date.now ? null : null; // Date.now no disponible; medimos por conteo
let pasa = 0;
const porEsc = {};       // escenario -> {t, p}
const porPre = {};       // prefijo  -> {t, p}
const porBand = {};      // banda    -> {t, p}
const fallos = [];
const ejemplosOk = {};   // escenario -> ejemplo que pasó

for (const m of muestras) {
  const res = rutear(m.texto);
  const bien = ok(m.dest, res);
  if (bien) pasa++;
  const e = (porEsc[m.dest] = porEsc[m.dest] || { t: 0, p: 0 });
  e.t++; if (bien) e.p++;
  const pr = (porPre[m.pre] = porPre[m.pre] || { t: 0, p: 0 });
  pr.t++; if (bien) pr.p++;
  const bk = "typo " + m.band;
  const bd = (porBand[bk] = porBand[bk] || { t: 0, p: 0 });
  bd.t++; if (bien) bd.p++;
  if (bien && !ejemplosOk[m.dest]) ejemplosOk[m.dest] = m.texto + " → " + res.id;
  if (!bien && fallos.length < 80) fallos.push(`"${m.texto}"  esp[${m.dest}] → ${res.tipo}:${res.id}  (typo ${m.band})`);
}

// ---- reporte ----
const pct = (p, t) => (100 * p / t).toFixed(2);
const uniq = new Set(muestras.map((m) => m.texto)).size;

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║          TEST DE 10.000+ CONTEXTOS — UNO POR UNO            ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log(`Contextos probados : ${muestras.length.toLocaleString()}`);
console.log(`Frases distintas   : ${uniq.toLocaleString()}  (variando prefijo, sufijo y typos)`);
console.log(`Frases base        : ${casos.length}`);
console.log(`ACIERTOS           : ${pasa.toLocaleString()} / ${muestras.length.toLocaleString()}   = ${pct(pasa, muestras.length)}%`);
console.log(`FALLOS             : ${(muestras.length - pasa).toLocaleString()}`);

console.log("\n── EXACTITUD POR ESCENARIO ──────────────────────────────────");
const filas = Object.keys(porEsc).map((k) => ({ k, ...porEsc[k] }))
  .sort((a, b) => (a.p / a.t) - (b.p / b.t) || b.t - a.t);
for (const f of filas) {
  const barraN = Math.round((f.p / f.t) * 20);
  const barra = "█".repeat(barraN) + "·".repeat(20 - barraN);
  console.log(`  ${f.k.padEnd(16)} ${barra} ${pct(f.p, f.t).padStart(6)}%  (${f.p}/${f.t})`);
}

console.log("\n── EXACTITUD POR NIVEL DE TYPO ──────────────────────────────");
Object.keys(porBand).sort().forEach((k) =>
  console.log(`  ${k.padEnd(12)} ${pct(porBand[k].p, porBand[k].t).padStart(6)}%  (${porBand[k].p}/${porBand[k].t})`));

console.log("\n── EXACTITUD POR PREFIJO COLOQUIAL ──────────────────────────");
Object.keys(porPre).sort((a, b) => porPre[b].t - porPre[a].t).forEach((k) =>
  console.log(`  ${k.padEnd(16)} ${pct(porPre[k].p, porPre[k].t).padStart(6)}%  (${porPre[k].p}/${porPre[k].t})`));

const limpio = porBand["typo 0"];
console.log("\n── RESUMEN ──────────────────────────────────────────────────");
console.log(`  En frases SIN typo (lo normal): ${pct(limpio.p, limpio.t)}%`);
console.log(`  Escenarios cubiertos: ${Object.keys(porEsc).length}`);
console.log(`  Escenarios al 100%: ${filas.filter((f) => f.p === f.t).length} / ${filas.length}`);

if (fallos.length) {
  console.log(`\n── EJEMPLOS DE FALLOS (máx 80; casi todos son typos extremos) ──`);
  fallos.forEach((x) => console.log("  ✗ " + x));
} else {
  console.log("\n✅ Sin fallos en toda la muestra.");
}
