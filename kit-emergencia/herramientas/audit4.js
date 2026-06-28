/* audit4.js — modismos coloquiales (chilenos/argentinos) + escenarios nuevos. */
"use strict";
const { rutear } = require("./test_routing.js");

const C = [
  // --- modismos chilenos ---
  ["me saqué la cresta esquiando", "rodilla|hueso|cabeza"],
  ["me saqué la chucha en la nieve", "rodilla|hueso|cabeza"],
  ["estoy con la goma", "resaca"],
  ["ando con la caña", "resaca"],
  ["me curé anoche y hoy ando mal", "resaca"],
  ["me dio la pálida", "pre-desmayo"],
  ["me dio un patatús", "pre-desmayo"],
  ["me dio un soponcio", "pre-desmayo"],
  ["estoy hecho bolsa de tanto caminar", "dolor-muscular"],
  ["ando hecho pebre", "dolor-muscular|malestar"],
  ["me agarró un aire en el cuello", "torticolis"],
  ["me duele el coco", "dolor-cabeza"],
  ["estoy enfermo del guata", "panza"],
  ["me eché a perder el estómago", "panza"],
  ["ando con tiritón", "fiebre|frio"],
  ["devolví toda la comida", "nauseas"],
  ["eché la pota", "nauseas"],
  ["me vino la regla con dolor", "dolor-regla"],
  ["estoy indispuesta", "dolor-regla"],
  ["ando achacado", "malestar"],
  ["estoy pa la cagá", "malestar"],
  ["me pegué en la rodilla", "rodilla|contusion"],
  ["se me bajó la presión", "pre-desmayo"],
  // --- escenarios nuevos ---
  ["me subió la presión", "presion-alta"],
  ["tengo la presión alta", "presion-alta"],
  ["me mordí la lengua y sangra", "boca-herida"],
  ["me partí el labio de un golpe", "boca-herida"],
  ["me reventaron el labio", "boca-herida"],
  ["tengo escalofríos", "fiebre"],
  ["me agarraron escalofríos y fiebre", "fiebre"],
  // --- más coloquiales variados ---
  ["me pica un montón el brazo", "alergia|picadura|dolor-muscular"],
  ["tengo cero fuerza y tiemblo", "hipoglucemia|malestar|shock"],
  ["me arde la guata", "panza"],
  ["ando como las pelotas", "malestar"],
  ["me duele la raja", "dolor-muscular|defecar"],
  ["no doy más de cansado", "agotamiento"],
  ["estoy muerto de sed", "deshidratacion"],
  ["tengo la garganta hecha pebre", "garganta"],
  ["me late la cabeza", "dolor-cabeza"],
  ["se me dobló el tobillo", "rodilla"],
  ["me quebré la muñeca", "hueso"],
  ["me corté con el cuchillo", "sangrado"],
  ["me quemé con la fogata", "quemadura"],
  ["no veo bien con tanto sol en la nieve", "ceguera-nieve"],
  ["me caí a una quebrada", "caida-grave"],
  ["se me clavó un palo en la pierna", "objeto-clavado"],
  ["no me siento la cara del frío", "frio"],
  // --- preguntas / hilo ---
  ["cómo hago rcp", "rcp"],
  ["cómo le doy respiración boca a boca", "boca-a-boca"],
  ["está inconsciente pero respira", "posicion-recuperacion"],
  ["qué es la cianosis", "Cianosis"],
  ["y eso es grave", "ayuda-general"],
];

let ok = 0; const fail = [];
for (const [f, e] of C) {
  const r = rutear(f);
  const bien = e.split("|").some((x) => x === r.id);
  if (bien) ok++; else fail.push(`✗ ${JSON.stringify(f)}  esp[${e}]  -> ${r.tipo}:${r.id}`);
}
console.log(`\nAUDIT4: ${ok}/${C.length} (${(100*ok/C.length).toFixed(0)}%)\n`);
fail.forEach((x) => console.log(x));
