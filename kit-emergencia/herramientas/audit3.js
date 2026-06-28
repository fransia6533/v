/* audit3.js — guías que salvan vidas (RCP, boca a boca, etc.) + seguimiento. */
"use strict";
const { rutear } = require("./test_routing.js");

const C = [
  // --- RCP / boca a boca / posición / Heimlich ---
  ["como hago rcp", "rcp"],
  ["como hacer reanimacion", "rcp"],
  ["como doy masaje cardiaco", "rcp"],
  ["rcp paso a paso", "rcp"],
  ["como hago las compresiones", "rcp"],
  ["como revivir a alguien que no respira", "rcp|inconsciente"],
  ["como doy respiracion boca a boca", "boca-a-boca"],
  ["respiracion boca a boca", "boca-a-boca"],
  ["como hacer respiracion artificial", "boca-a-boca"],
  ["como le doy aire", "boca-a-boca"],
  ["posicion de recuperacion", "posicion-recuperacion"],
  ["como pongo a alguien de costado", "posicion-recuperacion"],
  ["esta inconsciente pero respira que hago", "posicion-recuperacion"],
  ["como lo pongo de lado", "posicion-recuperacion"],
  ["como hago la maniobra de heimlich", "heimlich"],
  ["maniobra de heimlich", "heimlich"],
  ["como saco algo de la garganta", "heimlich"],
  ["como ayudo a alguien que se atraganta", "heimlich"],
  ["como desatoro a alguien", "heimlich"],
  // --- desmayo / emergencias relacionadas ---
  ["alguien se desmayo que hago", "inconsciente"],
  ["se desmayo y no respira", "inconsciente"],
  ["mi amigo no responde y no respira", "inconsciente"],
  ["alguien dejo de respirar", "inconsciente"],
  ["esta tirado y no se mueve", "inconsciente"],
  // --- definiciones (no confundir con how-to) ---
  ["que es la rcp", "RCP"],
  ["que es la reanimacion", "RCP"],
  // --- seguimiento / hilo ---
  ["y eso es grave", "ayuda-general"],
  ["cuando tengo que bajar", "ayuda-general"],
  ["que hago ahora", "ayuda-general"],
  ["algo mas que pueda hacer", "ayuda-general"],
  ["y que me pongo", "ayuda-general"],
  ["me puedo poner algo", "ayuda-general"],
  ["cuando pido rescate", "ayuda-general"],
  // --- más preguntas variadas ---
  ["cuanto dura un esguince", "ayuda-general|Esguince|rodilla"],
  ["se puede caminar con un esguince", "rodilla|Esguince|ayuda-general"],
  ["puedo seguir caminando con el tobillo hinchado", "rodilla|ayuda-general"],
  ["el corte necesita puntos", "sangrado|ayuda-general"],
  ["cada cuanto cambio la gasa", "Gasas|ayuda-general|infeccion"],
  ["se infecto la herida que hago", "infeccion"],
  ["como paro una hemorragia", "sangrado"],
  ["como detengo el sangrado", "sangrado"],
  ["como bajo la fiebre", "fiebre|que-tomar"],
  ["como desinfecto una herida", "sangrado|infeccion|Antiséptico"],
];

let ok = 0; const fail = [];
for (const [f, e] of C) {
  const r = rutear(f);
  const bien = e.split("|").some((x) => x === r.id);
  if (bien) ok++; else fail.push(`✗ ${JSON.stringify(f)}  esp[${e}]  -> ${r.tipo}:${r.id}`);
}
console.log(`\nAUDIT3: ${ok}/${C.length} (${(100*ok/C.length).toFixed(0)}%)\n`);
fail.forEach((x) => console.log(x));
