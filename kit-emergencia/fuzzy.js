/* ============================================================================
   fuzzy.js — Búsqueda tolerante a errores de tipeo (offline, sin librerías).
   En una emergencia escribir es difícil: "adrelina", "antihistaminco",
   "manta termka" deben encontrar el ítem correcto igual.
   ========================================================================== */
(function (global) {
  "use strict";

  function normalizar(t) {
    return (t || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")   // saca acentos
      .replace(/[^a-z0-9ñ ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Distancia de Levenshtein (cuántos cambios para pasar de a -> b)
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      let cur = [i];
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      prev = cur;
    }
    return prev[b.length];
  }

  // Similitud 0..1 entre dos palabras
  function simPalabra(a, b) {
    if (!a || !b) return 0;
    const d = levenshtein(a, b);
    return 1 - d / Math.max(a.length, b.length);
  }

  // Palabras comunes que no aportan ("me doblé la rodilla" -> "doble rodilla")
  const STOP = new Set(("me mi mis te se le lo la el los las un una unos unas y o de del en con que por para al a su tu tus yo " +
    "debo hacer tengo tiene esta este eso esa muy mucho mucha mas más como cuando si no es ha he " +
    "siento sienten estoy ando onda dame quiero necesito tener algo un poco re").split(" "));
  function quitarRelleno(palabras) {
    const filtradas = palabras.filter((w) => w.length >= 2 && !STOP.has(w));
    return filtradas.length ? filtradas : palabras.filter((w) => w.length >= 2);
  }

  // Mejor similitud de una palabra contra cualquier palabra de un texto
  function mejorContra(palabra, palabras) {
    let mejor = 0;
    for (const w of palabras) {
      if (w.length < 2) continue;
      let s = simPalabra(palabra, w);
      // bonus si la palabra escrita es prefijo de una más larga (ej "adre" -> "adrenalina")
      if (w.startsWith(palabra) && palabra.length >= 3) s = Math.max(s, 0.85);
      if (s > mejor) mejor = s;
    }
    return mejor;
  }

  // Puntaje 0..1 de cuánto matchea la consulta con un ítem del botiquín
  function puntaje(consulta, item) {
    const q = normalizar(consulta);
    if (!q) return 0;
    // "tambien" = otros nombres/sinónimos que pone el médico (ej "ibuprofeno")
    const nombreCrudo = item.objeto + " " + (item.tambien || "");
    const nombre = normalizar(nombreCrudo);
    const soloNombre = normalizar(item.objeto);
    const texto = normalizar(nombreCrudo + " " + (item.via || "") + " " + (item.procedimiento || "") + " " + (item.comentario || ""));
    if (!nombre) return 0;

    // 1) substring directo en el nombre/sinónimos -> match completo
    if (nombre.includes(q) || (soloNombre && q.includes(soloNombre))) return 1;

    const qWords = quitarRelleno(q.split(" "));
    const nWords = quitarRelleno(nombre.split(" "));
    const tWords = quitarRelleno(texto.split(" "));
    if (qWords.length === 0) return 0;

    // 2) similitud por palabra contra el NOMBRE (lo más importante)
    let sumaNombre = 0;
    qWords.forEach((qw) => (sumaNombre += mejorContra(qw, nWords)));
    const scoreNombre = sumaNombre / qWords.length;

    // 3) similitud por palabra contra todo el texto (más permisivo)
    let sumaTexto = 0;
    qWords.forEach((qw) => (sumaTexto += mejorContra(qw, tWords)));
    const scoreTexto = sumaTexto / qWords.length;

    // 4) similitud de la frase completa contra el nombre
    const scoreFrase = simPalabra(q.replace(/ /g, ""), nombre.replace(/ /g, ""));

    // 5) mejor palabra suelta contra TODO el texto (sinónimos/síntomas) -> peso menor
    let mejorTok = 0;
    qWords.forEach((qw) => { const s = mejorContra(qw, nWords); if (s > mejorTok) mejorTok = s; });

    // 6) mejor palabra suelta contra el NOMBRE principal (ej "adrenalina") -> peso mayor,
    //    para que un nombre propio gane a una palabra genérica de un síntoma
    const sWords = quitarRelleno(soloNombre.split(" "));
    let mejorTokName = 0;
    qWords.forEach((qw) => { const s = mejorContra(qw, sWords); if (s > mejorTokName) mejorTokName = s; });

    return Math.max(scoreNombre, scoreFrase, scoreTexto * 0.85, mejorTok * 0.85, mejorTokName * 0.9);
  }

  // Ordena los ítems por puntaje (de mayor a menor)
  function rankear(consulta, items) {
    return items
      .map((item) => ({ item, score: puntaje(consulta, item) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  global.Fuzzy = { normalizar, levenshtein, simPalabra, puntaje, rankear };
})(typeof window !== "undefined" ? window : globalThis);
