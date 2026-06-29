/* audit5.js — lote v2.8: rescates que salvan la vida, con frases reales
   (modismos, errores de tipeo, frases largas y seguimiento del hilo). */
"use strict";
const { rutear } = require("./test_routing.js");

const C = [
  // --- lesión de columna / cuello (NO mover) ---
  ["me cai de la roca y no siento las piernas", "lesion-columna"],
  ["se cayo del cerro y no puede mover los brazos", "lesion-columna"],
  ["me lastime la espalda en una caida fea", "lesion-columna"],
  ["no puedo mover las piernas despues de la caida", "lesion-columna"],
  ["creo que me fracture la columna", "lesion-columna"],
  // --- bebé atragantado (NO Heimlich) ---
  ["mi bebe se atraganto con un pedazo de comida", "atragantamiento-bebe"],
  ["la guagua se esta ahogando ayudame", "atragantamiento-bebe"],
  ["como desatoro a un bebe que se ahoga", "atragantamiento-bebe"],
  ["un niño chico se atoro con comida", "atragantamiento-bebe"],
  // --- me atoré yo y estoy solo ---
  ["me atragante y estoy solo no hay nadie", "me-atore-solo"],
  ["como me desatoro solo", "me-atore-solo"],
  ["me ahogo con comida y estoy solo", "me-atore-solo"],
  // --- espina en la garganta (respira) ---
  ["se me clavo una espina de pescado en la garganta", "espina-garganta"],
  ["trague una espina y la siento", "espina-garganta"],
  ["tengo algo clavado en la garganta pero respiro", "espina-garganta"],
  // --- mordedura de serpiente ---
  ["me mordio una serpiente en la pierna", "mordedura-serpiente"],
  ["me pico una vibora", "mordedura-serpiente"],
  ["una culebra me mordio", "mordedura-serpiente"],
  // --- araña de rincón (loxoscelismo) / viuda negra / alacrán ---
  ["me mordio una araña del rincon", "arana-rincon"],
  ["creo que me pico una araña de rincon en la pieza", "arana-rincon"],
  ["me pico una araña y no se cual", "arana-rincon"],
  ["me mordio una viuda negra", "arana-trigo"],
  ["me pico la araña del trigo en el campo", "arana-trigo"],
  ["me pico un alacran y me duele mucho", "picadura-alacran"],
  ["me pico un escorpion", "picadura-alacran"],
  // --- golpe de calor (emergencia) ---
  ["esta delirando por el calor y no suda", "golpe-calor"],
  ["golpe de calor grave esta confundido", "golpe-calor"],
  ["con tanto sol quedo confundido y rojo", "golpe-calor"],
  // --- anafilaxia sin adrenalina ---
  ["se le cierra la garganta y no tengo adrenalina", "anafilaxia-sin-adrenalina"],
  ["reaccion alergica grave y no tengo el autoinyector", "anafilaxia-sin-adrenalina"],
  // --- hemorragia interna ---
  ["me golpee fuerte la panza y estoy palido y mareado", "hemorragia-interna"],
  ["creo que tengo una hemorragia interna", "hemorragia-interna"],
  ["me pegaron fuerte y estoy cada vez peor con sudor frio", "hemorragia-interna"],
  // --- aplastamiento ---
  ["me cayo una roca encima y no puedo salir", "aplastamiento"],
  ["tengo la pierna atrapada bajo una piedra", "aplastamiento"],
  ["quede aplastado debajo de un tronco", "aplastamiento"],
  // --- convulsión febril ---
  ["mi hijo tiene fiebre y le dio una convulsion", "convulsion-febril"],
  ["convulsion febril en un niño", "convulsion-febril"],
  // --- edema de altura (HAPE/HACE) ---
  ["creo que es edema pulmonar de altura", "edema-altura"],
  ["tiene tos con espuma en la altura", "edema-altura"],
  ["camina como borracho en la altura", "edema-altura"],
  // --- guías que salvan (siguen funcionando) ---
  ["como hago rcp", "rcp"],
  ["como le doy respiracion boca a boca", "boca-a-boca"],
  ["esta inconsciente pero respira", "posicion-recuperacion"],
  ["como hago la maniobra de heimlich a un adulto", "heimlich"],
];

let ok = 0; const fail = [];
for (const [f, e] of C) {
  const r = rutear(f);
  const bien = e.split("|").some((x) => x === r.id);
  if (bien) ok++; else fail.push(`✗ ${JSON.stringify(f)}  esp[${e}]  -> ${r.tipo}:${r.id}`);
}
console.log(`\nAUDIT5: ${ok}/${C.length} (${(100*ok/C.length).toFixed(0)}%)\n`);
fail.forEach((x) => console.log(x));
