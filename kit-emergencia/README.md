# 🏔️ Kit de Emergencia · Alta Montaña

Mini-app **offline** para ayudar a usar el kit de primeros auxilios en alta
montaña. Funciona en el celular **sin señal y en modo avión**, una vez instalada.

> ⚠️ **Esto NO es un médico ni reemplaza al rescate profesional.** Es una guía de
> apoyo. Todo el contenido médico debe ser **revisado y aprobado por un médico**
> antes de confiar en él.

---

## Por qué NO es una "IA que razona"

Una IA tipo chatbot que funcione offline en un teléfono tiende a **inventar
datos** (alucinar). En una emergencia médica eso es peligroso. Por eso esta app
es una **guía estructurada**: muestra exactamente lo que el médico escribió, sin
inventar nada. Es más segura, más rápida y no necesita batería de sobra.

---

## 📲 Cómo instalarla en el celular (para usar sin internet)

1. Subí esta carpeta a un hosting estático con HTTPS (ej. GitHub Pages, Netlify),
   **o** abrila desde un servidor local. El modo offline (service worker)
   necesita `https://` o `localhost` para activarse.
2. Abrí `index.html` en el navegador del celular (Chrome o Safari).
3. Menú del navegador → **"Agregar a pantalla de inicio"** / "Instalar app".
4. Abrila una vez **con internet** para que se guarde. Después funciona sola,
   incluso en modo avión.
5. Verificá que abajo diga **"✅ Listo para usar sin internet"**.

### Probarla rápido en una computadora
```bash
cd kit-emergencia
python3 -m http.server 8000
# abrir http://localhost:8000
```

---

## 👨‍⚕️ Para el médico: cómo revisar y editar el contenido

Todo el contenido vive en un solo archivo: **`datos.js`**. No hace falta saber
programar, solo editar texto entre comillas.

- Buscá las marcas **`⚠️ VALIDAR`** y los **`____`**: son los puntos a completar
  (sobre todo **dosis de medicamentos**, que están en blanco a propósito).
- Podés **agregar, quitar o corregir** cualquier escenario o ítem del kit.
- Completá los datos del paciente en el bloque `META` (alergias, grupo
  sanguíneo, contacto de emergencia, número de rescate de la zona).
- Cuando un escenario quede aprobado, cambiá `validado: false` a
  `validado: true` (desaparece el aviso "sin validar").

Estructura de un escenario (ejemplo):
```js
{
  id: "anafilaxia",
  titulo: "Reacción alérgica grave / Anafilaxia",
  sintomas: ["alergia", "ahogo", "adrenalina"],   // palabras para el buscador
  gravedad: "alta",            // "alta" | "media" | "baja" (cambia el color)
  pasos: ["Paso 1...", "Paso 2..."],              // qué hacer, en orden
  items: ["adrenalina"],                          // qué usar del kit
  cuandoBajar: "Cuándo evacuar / pedir rescate",
  validado: false              // poner true cuando esté aprobado
}
```

> Respetá las **comillas**, las **comas** y las **llaves `{ }`** tal como están.
> Si algo se rompe, la app no carga: revisá que no falte una coma o una comilla.

---

## 📁 Archivos

| Archivo         | Qué es                                                    |
|-----------------|-----------------------------------------------------------|
| `datos.js`      | **El contenido médico.** Lo único que edita el médico.    |
| `index.html`    | La página principal.                                       |
| `app.js`        | La lógica (buscador, navegación). No tiene contenido médico.|
| `styles.css`    | El diseño (botones grandes, alto contraste).              |
| `sw.js`         | Hace que funcione **offline**.                            |
| `manifest.json` | Permite instalarla como app.                              |
| `icono.png`     | Ícono de la app.                                          |

---

## ✅ Estado actual

Versión **0.1 (borrador)**. Contenido genérico de primeros auxilios como punto de
partida, **pendiente de validación médica**. Incluye: anafilaxia, hemorragia,
hipotermia, congelación, mal de altura, fractura/esguince, herida leve y
quemadura, más un glosario de ítems del kit.
