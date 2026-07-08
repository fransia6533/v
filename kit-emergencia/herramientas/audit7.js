/* audit7.js — lote v3.2: más casos de montaña, con frases reales/coloquiales. */
"use strict";
const { rutear } = require("./test_routing.js");

const C = [
  // --- asma sin inhalador ---
  ["me falta el aire y no tengo inhalador", "asma-sin-inhalador"],
  ["me agarro el asma y perdi el inhalador", "asma-sin-inhalador"],
  ["crisis de asma y no tengo inhalador a mano", "asma-sin-inhalador"],
  // --- anzuelo ---
  ["se me clavo un anzuelo en el dedo", "anzuelo"],
  ["tengo un anzuelo clavado", "anzuelo"],
  // --- sangrado con anticoagulantes ---
  ["tomo anticoagulantes y me corte y no para", "sangrado-anticoagulantes"],
  ["estoy con sintrom y me sangra mucho", "sangrado-anticoagulantes"],
  ["tomo warfarina y me golpee la cabeza", "sangrado-anticoagulantes"],
  // --- quemadura con combustible ---
  ["me queme con el hornillo", "quemadura-combustible"],
  ["se me derramo el combustible y se prendio", "quemadura-combustible"],
  ["me queme con la bencina blanca", "quemadura-combustible"],
  // --- algo en el ojo ---
  ["se me metio algo en el ojo", "ojo-objeto"],
  ["me entro una rama en el ojo", "ojo-objeto"],
  ["tengo una basurita en el ojo que no sale", "ojo-objeto"],
  ["tengo algo clavado en el ojo", "ojo-objeto"],
  // --- torsión testicular ---
  ["me duele mucho un testiculo de repente", "torsion-testicular"],
  ["me agarro un dolor fuerte en un testiculo", "torsion-testicular"],
  ["me duele un huevo de golpe y fuerte", "torsion-testicular"],
  // --- parto de emergencia ---
  ["se adelanto el parto y no llegamos", "parto-emergencia"],
  ["el bebe ya viene", "parto-emergencia"],
  ["esta por dar a luz aca", "parto-emergencia"],
  // --- casos vecinos que NO deben confundirse ---
  ["me golpearon en los testiculos", "golpe-genitales"],
  ["me pico un mosquito en el ojo", "picadura|ojo-objeto|ojo"],
  ["me queme con agua caliente", "quemadura"],
  ["tengo asma y me falta el aire", "asma"],
  ["se me clavo un palo en la pierna", "objeto-clavado"],
  ["me corte y sangra", "sangrado"],
];

let ok = 0; const fail = [];
for (const [f, e] of C) {
  const r = rutear(f);
  const bien = e.split("|").some((x) => x === r.id);
  if (bien) ok++; else fail.push(`✗ ${JSON.stringify(f)}  esp[${e}]  -> ${r.tipo}:${r.id}`);
}
console.log(`\nAUDIT7: ${ok}/${C.length} (${(100*ok/C.length).toFixed(0)}%)\n`);
fail.forEach((x) => console.log(x));
