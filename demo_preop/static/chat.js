/*
 * chat.js
 * =======
 * Lógica de la conversación del paciente. Es un "chatbot" de REGLAS:
 * cada pregunta tiene botones fijos. No usa inteligencia artificial.
 *
 * Cómo funciona:
 *  1. Pide al servidor los datos de ESTE control (GET /api/c/<token>).
 *  2. Arma la lista de "pasos" (preguntas) según los exámenes asignados.
 *  3. Cada vez que el paciente toca un botón, la respuesta se GUARDA de
 *     inmediato en el servidor (POST /api/c/<token>/respuesta).
 *  4. Al final muestra un RESUMEN, permite CORREGIR y luego ENVIAR.
 *
 * Seguridad: todo el texto se inserta con "textContent" (nunca innerHTML),
 * para que nadie pueda inyectar código escribiendo en el comentario.
 */

const TOKEN = document.body.dataset.token;
const API = `/api/c/${TOKEN}`;
const cajaMensajes = document.getElementById("mensajes");
const cajaOpciones = document.getElementById("opciones");

let datos = null;          // datos del control que entrega el servidor
let modoEdicion = false;   // true cuando el paciente está corrigiendo desde el resumen

// Opciones de cada tipo de pregunta. valor null = "lo respondo después" (queda sin respuesta).
const OPCIONES = {
  confirma_control: [
    { valor: "si", texto: "Sí, es correcto" },
    { valor: "no", texto: "No, algo no coincide" },
    { valor: "no_sabe", texto: "No estoy seguro" },
  ],
  examen_realizado: [
    { valor: "si", texto: "Sí" },
    { valor: "todavia_no", texto: "Todavía no" },
    { valor: "no_sabe", texto: "No estoy seguro" },
    { valor: "aclarar", texto: "Prefiero aclararlo con el equipo" },
    { valor: null, texto: "Lo respondo después" },
  ],
  examen_resultado: [
    { valor: "si", texto: "Sí, lo tengo" },
    { valor: "no", texto: "Todavía no" },
    { valor: "no_sabe", texto: "No sé" },
    { valor: null, texto: "Lo respondo después" },
  ],
};

/* ---------- Utilidades de pantalla ---------- */

// Agrega una "burbuja" de mensaje. quien = "bot" o "yo".
function burbuja(texto, quien = "bot") {
  const div = document.createElement("div");
  div.className = `burbuja ${quien}`;
  div.textContent = texto;
  cajaMensajes.appendChild(div);
  cajaMensajes.scrollTop = cajaMensajes.scrollHeight;
  return div;
}

// Muestra botones de opciones. Cada opción: {texto, accion, clase?}
function botones(lista) {
  cajaOpciones.textContent = "";
  for (const op of lista) {
    const b = document.createElement("button");
    b.textContent = op.texto;
    if (op.clase) b.className = op.clase;
    b.addEventListener("click", op.accion);
    cajaOpciones.appendChild(b);
  }
}

// Convierte "2026-10-05" en "05-10-2026".
function fechaLegible(iso) {
  const [a, m, d] = iso.split("-");
  return `${d}-${m}-${a}`;
}

/* ---------- Comunicación con el servidor ---------- */

async function cargarDatos() {
  const r = await fetch(API);
  if (!r.ok) throw new Error("No se encontró este enlace.");
  datos = await r.json();
}

async function post(ruta, cuerpo) {
  const r = await fetch(API + ruta, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo || {}),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok || !json.ok) throw new Error(json.error || "No se pudo guardar.");
}

/* ---------- Pasos de la conversación ---------- */

// Arma la lista de preguntas. La pregunta del resultado solo aparece si
// el paciente dijo que SÍ se hizo el examen.
function construirPasos() {
  const pasos = [{ clave: "confirma", tipo: "confirma_control" }];
  for (const e of datos.examenes) {
    pasos.push({ clave: `real-${e.id}`, tipo: "examen_realizado", examen: e });
    if (e.realizado === "si") pasos.push({ clave: `res-${e.id}`, tipo: "examen_resultado", examen: e });
  }
  for (const p of datos.cuestionario.preguntas) pasos.push({ clave: `p-${p.id}`, tipo: "pregunta", pregunta: p });
  return pasos;
}

// Texto de la pregunta de cada paso.
function textoPregunta(paso) {
  if (paso.tipo === "confirma_control")
    return `Tenemos registrado tu control (ficticio) para el ${fechaLegible(datos.fecha_control)}: "${datos.motivo}". ¿Es correcto?`;
  if (paso.tipo === "examen_realizado")
    return `Te solicitaron: ${paso.examen.nombre}. ¿Ya te realizaste este ${paso.examen.tipo === "imagen" ? "examen de imagen" : "examen"}?`;
  if (paso.tipo === "examen_resultado")
    return `¿Tienes disponible el resultado de ${paso.examen.nombre} para llevarlo a tu control?`;
  return paso.pregunta.texto;
}

// Valor actualmente guardado para un paso (undefined/null = sin respuesta).
function valorActual(paso) {
  if (paso.tipo === "confirma_control") return datos.respuestas.confirma_control;
  if (paso.tipo === "examen_realizado") return paso.examen.realizado;
  if (paso.tipo === "examen_resultado") return paso.examen.resultado;
  return datos.respuestas[paso.pregunta.id];
}

// Texto legible de un valor guardado (para el resumen).
function textoValor(paso, valor) {
  if (valor === null || valor === undefined) return "Sin responder (pendiente)";
  if (paso.tipo === "pregunta") {
    if (paso.pregunta.tipo === "texto") return valor;
    const op = paso.pregunta.opciones.find((o) => o.valor === valor);
    return op ? op.texto : valor;
  }
  const op = OPCIONES[paso.tipo].find((o) => o.valor === valor);
  return op ? op.texto : valor;
}

// Muestra una pregunta con sus botones.
function mostrarPaso(paso) {
  // Antes de la primera pregunta del cuestionario, aviso claro de que es de demostración.
  const primera = datos.cuestionario.preguntas[0];
  if (!modoEdicion && paso.tipo === "pregunta" && paso.pregunta.id === primera.id) {
    burbuja(`📋 ${datos.cuestionario.titulo} (versión ${datos.cuestionario.version}). ${datos.cuestionario.aviso}`);
  }
  burbuja(textoPregunta(paso));

  // Pregunta de texto libre: cuadro para escribir + botones.
  if (paso.tipo === "pregunta" && paso.pregunta.tipo === "texto") {
    cajaOpciones.textContent = "";
    const area = document.createElement("textarea");
    area.maxLength = paso.pregunta.max || 300;
    area.rows = 3;
    area.value = valorActual(paso) || "";
    area.placeholder = "Escribe aquí (opcional)";
    cajaOpciones.appendChild(area);
    const enviarTexto = document.createElement("button");
    enviarTexto.textContent = "Guardar comentario";
    enviarTexto.addEventListener("click", () => responder(paso, area.value.trim() || null, area.value.trim() || "(sin comentario)"));
    const omitir = document.createElement("button");
    omitir.textContent = "Omitir";
    omitir.addEventListener("click", () => responder(paso, null, "Omitir"));
    cajaOpciones.append(enviarTexto, omitir);
    area.focus();
    return;
  }

  // Pregunta con botones.
  let opciones = paso.tipo === "pregunta" ? [...paso.pregunta.opciones] : [...OPCIONES[paso.tipo]];
  if (paso.tipo === "pregunta") opciones.push({ valor: null, texto: "Lo respondo después" });
  botones(opciones.map((o) => ({ texto: o.texto, accion: () => responder(paso, o.valor, o.texto) })));
}

// El paciente eligió una opción: se guarda y se avanza.
async function responder(paso, valor, textoVisible) {
  burbuja(textoVisible, "yo");
  cajaOpciones.textContent = "";
  const cuerpo = {
    tipo: paso.tipo,
    item: paso.tipo === "pregunta" ? paso.pregunta.id : paso.examen ? paso.examen.id : null,
    valor: valor,
  };
  try {
    await post("/respuesta", cuerpo);
    await cargarDatos(); // recargamos desde el servidor: la fuente de verdad es la base de datos
  } catch (error) {
    burbuja(`⚠️ ${error.message} Revisa que la aplicación siga abierta e inténtalo de nuevo.`);
    return mostrarPaso(paso);
  }
  avanzarDesde(paso, valor);
}

function avanzarDesde(paso, valor) {
  const pasos = construirPasos();
  // Si corrigió un examen a "Sí", preguntamos por su resultado antes de volver.
  if (paso.tipo === "examen_realizado" && valor === "si") {
    const res = pasos.find((p) => p.clave === `res-${paso.examen.id}`);
    if (res && (valorActual(res) === null || valorActual(res) === undefined || !modoEdicion)) return mostrarPaso(res);
  }
  if (modoEdicion) return mostrarResumen();
  // Siguiente pregunta SIN responder (si retomó la conversación, no repetimos lo ya respondido).
  const i = pasos.findIndex((p) => p.clave === paso.clave);
  const siguiente = pasos.slice(i + 1).find((p) => valorActual(p) === null || valorActual(p) === undefined);
  if (siguiente) return mostrarPaso(siguiente);
  mostrarResumen();
}

/* ---------- Resumen, corrección y envío ---------- */

function mostrarResumen() {
  modoEdicion = true;
  const pasos = construirPasos();
  burbuja("Este es el resumen de tus respuestas. Puedes cambiar cualquiera antes de enviar.");

  // Tarjeta con la lista de respuestas y un botón "Cambiar" en cada una.
  const tarjeta = document.createElement("div");
  tarjeta.className = "burbuja bot resumen";
  let pendientes = 0;
  for (const paso of pasos) {
    const valor = valorActual(paso);
    if ((valor === null || valor === undefined) && !(paso.tipo === "pregunta" && !paso.pregunta.obligatoria)) pendientes++;
    const fila = document.createElement("div");
    fila.className = "fila-resumen";
    const t = document.createElement("div");
    const q = document.createElement("small");
    q.textContent = textoPregunta(paso);
    const v = document.createElement("b");
    v.textContent = textoValor(paso, valor);
    t.append(q, document.createElement("br"), v);
    const cambiar = document.createElement("button");
    cambiar.textContent = "Cambiar";
    cambiar.className = "chico";
    cambiar.addEventListener("click", () => mostrarPaso(paso));
    fila.append(t, cambiar);
    tarjeta.appendChild(fila);
  }
  cajaMensajes.appendChild(tarjeta);
  cajaMensajes.scrollTop = cajaMensajes.scrollHeight;

  if (pendientes) burbuja(`Tienes ${pendientes} respuesta(s) pendiente(s). Puedes enviar igual y completarlas después con este mismo enlace.`);
  botones([{ texto: "✅ Enviar respuestas", accion: enviar, clase: "principal" }]);
}

async function enviar() {
  cajaOpciones.textContent = "";
  try {
    await post("/enviar");
    await cargarDatos();
  } catch (error) {
    burbuja(`⚠️ ${error.message}`);
    return mostrarResumen();
  }
  burbuja("✅ Tus respuestas quedaron guardadas. Gracias.", "bot");
  burbuja("Una persona del equipo las revisará. Esta conversación no reemplaza la atención del equipo ni confirma que estés listo para tu control o cirugía. Si tienes una urgencia, acude a un servicio de urgencia.");
  botones([{ texto: "Revisar o corregir mis respuestas", accion: mostrarResumen }]);
}

// Solicitud de no recibir más mensajes (queda registrada para el equipo).
document.getElementById("baja").addEventListener("click", async () => {
  if (!confirm("¿Confirmas que no quieres recibir más mensajes de este sistema? El equipo quedará informado.")) return;
  try {
    await post("/baja");
    burbuja("No quiero recibir más mensajes", "yo");
    burbuja("Listo: registramos tu solicitud. No se te enviarán más recordatorios. Puedes seguir respondiendo aquí si lo deseas.");
  } catch (error) {
    burbuja(`⚠️ ${error.message}`);
  }
});

/* ---------- Inicio ---------- */

async function iniciar() {
  try {
    await cargarDatos();
  } catch (error) {
    burbuja(`⚠️ ${error.message}`);
    return;
  }
  burbuja(`Hola ${datos.nombre} 👋. Te escribimos de ${datos.unidad}.`);
  burbuja("⚠️ Esto es una DEMOSTRACIÓN con datos ficticios. Tus respuestas ayudan al equipo a preparar tu control; no se usan para diagnosticar. Este canal no atiende urgencias.");

  const pasos = construirPasos();
  if (datos.enviado_en) {
    burbuja(`Ya enviaste tus respuestas (${datos.enviado_en.replace("T", " ")}). Puedes revisarlas o corregirlas.`);
    return mostrarResumen();
  }
  const pendiente = pasos.find((p) => valorActual(p) === null || valorActual(p) === undefined);
  const yaEmpezo = pasos.some((p) => valorActual(p) !== null && valorActual(p) !== undefined);
  if (yaEmpezo) {
    burbuja("Retomemos donde quedaste. Lo que ya respondiste está guardado.");
    return pendiente ? mostrarPaso(pendiente) : mostrarResumen();
  }
  burbuja("Te haré unas preguntas cortas. Toma unos minutos y puedes dejar respuestas pendientes.");
  botones([{ texto: "Comenzar", accion: () => mostrarPaso(pasos[0]), clase: "principal" }]);
}

iniciar();
