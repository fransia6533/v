/* audit2.js — segunda ronda: casos nuevos + escenarios que voy a agregar. */
"use strict";
const { rutear } = require("./test_routing.js");

const C = [
  // --- escenarios NUEVOS (a crear) ---
  ["tengo una puntada en el costado de tanto correr", "flato"],
  ["me dio flato corriendo", "flato"],
  ["me mareo en el auto camino a la montaña", "mareo-movimiento"],
  ["me mareo en el bus y tengo nauseas", "mareo-movimiento|nauseas"],
  ["me rozaron las correas de la mochila", "rozadura|ampolla"],
  ["me roza la entrepierna de caminar", "rozadura"],
  ["me pegaron una patada en los testiculos", "golpe-genitales"],
  ["me golpee los huevos", "golpe-genitales"],
  ["hay mucho humo y me cuesta respirar", "humo"],
  ["trague humo del fuego", "humo"],
  ["toque una ortiga y me arde la piel", "planta-urticante"],
  ["me roce con una planta y me salieron ronchas que pican", "planta-urticante|alergia"],
  ["tengo llagas en la boca", "aftas"],
  ["me salio un afta en la lengua", "aftas"],
  ["siento que me voy a desmayar", "pre-desmayo"],
  ["estoy por desmayarme, veo todo negro", "pre-desmayo"],
  ["se me clavo un anzuelo en el dedo", "objeto-clavado|anzuelo"],
  ["todo me gira tengo vertigo", "mareo|vertigo"],
  // --- coloquial / variantes de existentes ---
  ["me dio un tiron en la pierna", "calambre|desgarro|dolor-muscular"],
  ["se me acalambro el gemelo", "calambre"],
  ["me agarro un calambre en el pie", "calambre"],
  ["tengo la panza hinchada y gases", "panza"],
  ["ando con muchos gases", "panza"],
  ["tengo acidez y me sube acido", "panza"],
  ["vomite como cinco veces", "nauseas|intoxicacion-comida"],
  ["no paro de vomitar", "nauseas|intoxicacion-comida"],
  ["tengo diarrea hace tres dias", "diarrea"],
  ["estoy con fiebre y escalofrios", "fiebre"],
  ["tengo fiebre altisima", "fiebre"],
  ["me arde la garganta al hablar", "garganta"],
  ["perdi la voz", "garganta|resfrio"],
  ["me duelen los musculos de tanto caminar", "dolor-muscular"],
  ["me duele todo el cuerpo despues de la caminata", "dolor-muscular"],
  ["tengo agujetas en las piernas", "dolor-muscular"],
  ["se me hincho el tobillo", "rodilla"],
  ["me torci la muñeca", "rodilla|luxacion"],
  ["me golpee el codo y se me durmio el brazo", "contusion|dolor-muscular"],
  ["se me durmio el brazo", "dolor-muscular|frio"],
  ["tengo hormigueo en las manos", "frio|dolor-muscular"],
  ["me sangra mucho la nariz y no para", "sangrado-nariz"],
  ["me salio sangre de la nariz", "sangrado-nariz"],
  ["me reviento un grano y se infecto", "infeccion"],
  ["tengo una herida que no cierra", "infeccion|sangrado"],
  ["se me abrio el corte de nuevo", "sangrado"],
  ["me salieron ampollas en los pies de caminar", "ampolla"],
  ["se me hizo una ampolla en el talon", "ampolla"],
  ["me pele la nariz del sol", "quemadura-sol|labios-piel"],
  ["tengo la piel quemada y se pela", "quemadura-sol|quemadura"],
  ["me insole y me duele la cabeza", "insolacion"],
  ["estoy descompuesto del calor", "insolacion|malestar"],
  // --- preguntas / definiciones ---
  ["cada cuanto puedo tomar paracetamol", "Paracetamol"],
  ["puedo tomar ibuprofeno con el estomago vacio", "Ibuprofeno"],
  ["el ibuprofeno sirve para la fiebre", "Ibuprofeno"],
  ["que es bueno para el dolor de muela", "que-tomar|muela"],
  ["que me conviene para la diarrea", "que-tomar|diarrea"],
  ["que es la insolacion", "Golpe de calor / insolación"],
  ["que significa una luxacion", "Luxación"],
  ["que es un esguince de tobillo", "Esguince"],
  ["para que sirve la manta termica", "Manta térmica"],
  ["como uso el torniquete", "Torniquete"],
  ["que es una conmocion cerebral", "Conmoción cerebral"],
  // --- emergencias / largas ---
  ["mi amigo se quemo toda la mano con el fuego", "quemadura"],
  ["se corto con el hacha cortando leña y sangra mucho", "sangrado"],
  ["alguien se cayo y esta sangrando de la cabeza", "cabeza|sangrado"],
  ["mi compañera no para de vomitar y esta muy debil", "deshidratacion|nauseas|intoxicacion-comida"],
  ["le cuesta respirar despues de la picadura de abeja", "alergia"],
  ["se desmayo con el calor y esta palido", "inconsciente|insolacion|shock"],
  ["estoy temblando de frio y ya no siento las manos", "frio"],
  ["me cai y me golpee la espalda no puedo moverme", "hueso|caida-grave"],
  ["tengo un dolor que baja de la espalda al testiculo", "colico-renal"],
  ["me duele la boca del estomago y vomito", "panza|intoxicacion-comida"],
  // --- seguimiento ---
  ["y eso es grave", "ayuda-general"],
  ["cuando tengo que bajar", "ayuda-general"],
  ["necesito hacer algo mas", "ayuda-general"],
];

let ok = 0; const fail = [];
for (const [f, e] of C) {
  const r = rutear(f);
  const bien = e.split("|").some((x) => x === r.id);
  if (bien) ok++; else fail.push(`✗ ${JSON.stringify(f)}  esp[${e}]  -> ${r.tipo}:${r.id}`);
}
console.log(`\nAUDIT2: ${ok}/${C.length} (${(100*ok/C.length).toFixed(0)}%)\n`);
fail.forEach((x) => console.log(x));
