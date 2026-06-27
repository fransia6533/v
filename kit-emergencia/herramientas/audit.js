/* audit.js — casos nuevos pensados a mano (coloquiales, ambiguos, largos) para
   encontrar respuestas malas. Expected admite alternativas con "|".
   Uso: node herramientas/audit.js */
"use strict";
const { rutear } = require("./test_routing.js");

const C = [
  // --- lesiones coloquiales ---
  ["me chante la cabeza contra una roca", "cabeza"],
  ["se me fue el tobillo", "rodilla"],
  ["pise mal y me doble el tobillo", "rodilla"],
  ["me hice mierda la rodilla", "rodilla|hueso"],
  ["me abri la frente", "sangrado|cabeza"],
  ["se me revento la ceja", "sangrado|cabeza"],
  ["me corte el labio", "sangrado|raspon"],
  ["pise un clavo", "objeto-clavado|sangrado"],
  ["me corte con una lata", "sangrado"],
  ["me agarre los dedos con la puerta", "dedo-machucado"],
  ["me salio un moreton enorme", "contusion|golpe-abdomen|dolor-muscular"],
  ["me di un golpe fuerte en la pierna", "contusion|dolor-muscular|hueso"],
  ["tengo una espina clavada en el dedo", "astilla|objeto-clavado"],
  ["me llene de ronchas", "alergia|picadura"],
  ["me pica todo el cuerpo", "alergia|picadura"],
  ["se me reventaron las ampollas", "ampolla"],
  // --- síntomas ---
  ["tengo el estomago revuelto", "panza|nauseas"],
  ["tengo ganas de vomitar y diarrea", "intoxicacion-comida|nauseas|diarrea"],
  ["ando con cagadera", "diarrea"],
  ["me agarraron retortijones", "panza|diarrea"],
  ["me duele la guata y tengo diarrea", "diarrea|intoxicacion-comida|panza"],
  ["tengo fiebre y me duele el cuerpo", "fiebre|dolor-muscular"],
  ["estoy temblando de fiebre", "fiebre"],
  ["me arde al hacer pis", "orina"],
  ["me dan ganas de hacer pis a cada rato", "orina"],
  ["me duele la garganta al tragar", "garganta"],
  ["se me cierra la garganta", "alergia"],
  ["no puedo tragar nada", "garganta|atragantamiento"],
  ["tengo tos seca", "resfrio"],
  ["estoy todo congestionado", "resfrio"],
  ["tengo los ojos rojos", "ojo"],
  ["me lloran los ojos", "ojo|ceguera-nieve"],
  ["me entro una basurita al ojo", "ojo"],
  ["me duele la cabeza hace dos dias", "dolor-cabeza"],
  ["tengo una jaqueca terrible", "dolor-cabeza"],
  ["me siento muy debil y con sudor frio", "hipoglucemia|shock|malestar"],
  // --- montaña / frío ---
  ["tengo las manos heladas y no las siento", "frio"],
  ["se me durmieron los pies del frio", "frio"],
  ["no paro de tiritar", "frio"],
  ["me agarro la altura", "altura"],
  ["me cuesta respirar aca arriba", "altura|asma|pecho"],
  ["vomite por la altura", "altura"],
  ["me queme la cara con el sol", "quemadura-sol"],
  ["no veo bien con tanta nieve blanca", "ceguera-nieve"],
  ["tengo la nariz congelada", "frio|congelacion"],
  ["estoy cocinando en la carpa y me duele la cabeza", "monoxido"],
  ["me quede sin agua y tengo mucha sed", "deshidratacion"],
  // --- medicamentos / preguntas ---
  ["que tomo para el dolor de cabeza", "que-tomar"],
  ["algo para las nauseas", "que-tomar|nauseas"],
  ["que me tomo para la diarrea", "que-tomar|diarrea"],
  ["que sirve para la fiebre", "que-tomar|Paracetamol|fiebre"],
  ["para que es el corticoide", "Corticoide"],
  ["que hace la dexametasona", "Corticoide"],
  ["puedo darme dos paracetamol", "Paracetamol"],
  ["cuanto ibuprofeno puedo tomar", "Ibuprofeno"],
  ["me puedo poner la pomada", "que-tomar|ayuda-general"],
  ["sirve la adrenalina para la alergia grave", "Adrenalina"],
  // --- definiciones ---
  ["que es un esguince", "Esguince"],
  ["que significa hipotermia", "Hipotermia"],
  ["que es la anafilaxia", "Anafilaxia"],
  ["explicame que es el soroche", "Soroche / mal de altura"],
  ["que es una contusion", "Contusión / hematoma"],
  ["que es un hematoma", "Contusión / hematoma"],
  ["que es la cianosis", "Cianosis"],
  ["que es la rcp", "RCP"],
  // --- emergencias coloquiales ---
  ["se esta poniendo morado", "inconsciente"],
  ["le cuesta respirar y se le hincha la cara", "alergia"],
  ["le agarro un ataque y se sacude", "convulsion"],
  ["no reacciona cuando le hablo", "inconsciente"],
  ["mi amigo se desmayo", "inconsciente"],
  ["alguien se cayo al agua helada", "agua-fria|ahogamiento|frio"],
  ["se atoro con un pedazo de carne", "atragantamiento"],
  ["me mordio un perro callejero", "mordedura"],
  ["me pico una abeja y se me hincha", "alergia"],
  ["le cayo un rayo a un compañero", "rayo"],
  // --- conversacional / seguimiento ---
  ["y que me pongo", "ayuda-general"],
  ["que hago ahora", "ayuda-general"],
  ["algo mas que pueda hacer", "ayuda-general"],
  ["me puedo poner algo", "ayuda-general"],
  // --- largos ---
  ["me cai esquiando y me golpee la cabeza y estoy mareado", "cabeza"],
  ["se me clavo una rama en la pierna y sangra", "objeto-clavado|sangrado"],
  ["mi compañero esta confundido camina raro y le falta el aire en la altura", "altura"],
  ["me corte profundo y la sangre sale a chorros", "sangrado"],
  ["tengo dolor de panza fuerte abajo a la derecha y fiebre", "apendicitis"],
  ["estoy perdido en la montaña y se hace de noche", "perdido"],
  ["no aguanto el dolor de muela me esta matando", "muela"],
  ["me duele el pecho y se corre al brazo izquierdo con sudor frio", "pecho"],
];

let ok = 0; const fail = [];
for (const [f, e] of C) {
  const r = rutear(f);
  const bien = e.split("|").some((x) => x === r.id);
  if (bien) ok++; else fail.push(`✗ ${JSON.stringify(f)}  esp[${e}]  -> ${r.tipo}:${r.id}`);
}
console.log(`\nAUDIT: ${ok}/${C.length} (${(100*ok/C.length).toFixed(0)}%)\n`);
fail.forEach((x) => console.log(x));
