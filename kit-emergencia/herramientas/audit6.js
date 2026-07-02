/* audit6.js — lote v3.1: más casos de montaña + frases reales/coloquiales
   y verificación del "qué puede ser". */
"use strict";
const { rutear } = require("./test_routing.js");

const C = [
  // --- hiponatremia (tomé demasiada agua) ---
  ["tome muchisima agua y me siento mal", "hiponatremia"],
  ["me tome litros de agua y estoy hinchado", "hiponatremia"],
  ["tome demasiada agua y estoy confundido", "hiponatremia"],
  // --- picadura en la boca/garganta ---
  ["me pico una abeja en la boca", "picadura-boca"],
  ["me pico una avispa en la lengua", "picadura-boca"],
  ["trague una abeja y me pico en la garganta", "picadura-boca"],
  // --- sobredosis / mezcla de remedios ---
  ["me pase con las pastillas", "sobredosis-medicamento"],
  ["tome de mas el ibuprofeno", "sobredosis-medicamento"],
  ["mezcle pastillas sin querer", "sobredosis-medicamento"],
  ["creo que tome muchas pastillas juntas", "sobredosis-medicamento"],
  // --- agua segura ---
  ["puedo tomar agua del rio", "agua-segura"],
  ["el agua de la vertiente es segura", "agua-segura"],
  ["como purifico el agua", "agua-segura"],
  ["puedo tomar nieve derretida", "agua-segura"],
  // --- prevención de altura ---
  ["como prevengo el soroche", "prevencion-altura"],
  ["como me aclimato a la altura", "prevencion-altura"],
  ["consejos para subir sin enfermarme", "prevencion-altura|altura"],
  // --- ropa en llamas ---
  ["se me prendio la ropa", "ropa-fuego"],
  ["me agarro fuego la ropa en la fogata", "ropa-fuego"],
  // --- casos de montaña ya existentes (no deben romperse) ---
  ["hay muchos rayos que hago", "rayo"],
  ["me perdi en la montaña", "perdido"],
  ["me quede sin agua y tengo mucha sed", "deshidratacion"],
  ["se me congelaron los dedos", "frio"],
  ["me cai a una quebrada", "caida-grave"],
  ["me quede atrapado bajo la nieve", "avalancha"],
  ["cocine en la carpa y me duele la cabeza", "monoxido"],
  ["tengo los pies mojados y helados hace horas", "pie-trinchera"],
  ["no veo bien por el reflejo de la nieve", "ceguera-nieve"],
  ["cuantas calorias necesito para aguantar la noche", "supervivencia"],
  // --- "qué puede ser" existe en síntomas comunes (routing correcto) ---
  ["me duele la cabeza", "dolor-cabeza"],
  ["tengo fiebre", "fiebre"],
  ["me duele la panza", "panza"],
  ["tengo diarrea", "diarrea"],
  ["ando mareado", "mareo"],
];

let ok = 0; const fail = [];
for (const [f, e] of C) {
  const r = rutear(f);
  const bien = e.split("|").some((x) => x === r.id);
  if (bien) ok++; else fail.push(`✗ ${JSON.stringify(f)}  esp[${e}]  -> ${r.tipo}:${r.id}`);
}
console.log(`\nAUDIT6: ${ok}/${C.length} (${(100*ok/C.length).toFixed(0)}%)\n`);
fail.forEach((x) => console.log(x));
