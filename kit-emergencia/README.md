# 🏔️ Kit de Emergencia · Alta Montaña

Mini-app **offline** para usar un botiquín de primeros auxilios en alta montaña.
Funciona en el celular **sin señal y en modo avión**, una vez instalada.

> ⚠️ **Esto NO es un médico ni reemplaza al rescate profesional.** Es una guía de
> apoyo. Todo el contenido médico (dosis, procedimientos) debe ser **revisado y
> aprobado por un médico** antes de confiar en él.

**Paciente:** Frank · 190 cm · 105 kg · grupo sanguíneo **O negativo**.

---

## Qué hace

- **🚑 Emergencias** — escenarios guiados paso a paso (anafilaxia, hemorragia,
  hipotermia, mal de altura, fractura, etc.) con "cuándo bajar / pedir rescate".
- **🎒 Botiquín** — una **base de datos tipo tabla** con columnas:
  **Objeto · Dosis (mg/cc) · Vía (masticable/inyectable/oral...) · Procedimiento ·
  Comentario del médico · Validado**. Se puede agregar, editar y borrar ítems
  desde la app.
- **📷 Cámara** — sacás una foto del medicamento y la app intenta identificarlo:
  - **Offline**: lee el texto de la etiqueta (si el navegador lo soporta) y lo
    busca en *tu* botiquín. No inventa nada.
  - **Online (con señal y clave de API)**: manda la foto a la IA de Claude para
    identificarla y devolver el procedimiento que cargó tu médico.
- **📋 Datos** — tu ficha (altura, peso, sangre, alergias, contacto, rescate).

---

## La base de datos en Excel (para editar con tu médico)

Desde la pantalla **Botiquín**:

- **⬇️ Excel** — descarga `botiquin-kit-emergencia.xlsx` a tu teléfono
  (carpeta de descargas / **My Files**). Lo abrís y editás con tu amigo médico
  en Excel o Google Sheets.
- **⬆️ Importar** — volvés a cargar el `.xlsx` (o un `.csv`) editado y la app
  reemplaza el botiquín con lo que pusieron. Reconoce las columnas por su
  encabezado, así que tu médico puede agregar o sacar filas con libertad.

El Excel se lee y se escribe con código propio (`xlsx-mini.js`), **sin librerías
externas**, para que funcione sin internet. Está probado para leer archivos
guardados por Excel/Google Sheets (con acentos, comentarios largos y saltos de
línea).

---

## La cámara con IA (opcional, solo con señal)

La cámara funciona siempre para sacar la foto. El análisis con IA en la nube es
**opcional** y solo sirve cuando hay señal:

1. Andá a **Cámara → ⚙️ Configurar análisis con IA**.
2. Pegá tu **clave de API de Claude** (se guarda solo en tu teléfono, en este
   navegador; no se manda a ningún otro lado).
3. Con señal, la foto se analiza con la IA usando tu botiquín como referencia.

Sin clave o sin señal, la cámara intenta leer la etiqueta en el teléfono y
buscar el ítem en tu botiquín; si no puede, te manda al buscador del Botiquín.

> ⚠️ La IA puede equivocarse: siempre verificá con lo que cargó tu médico.

---

## 📲 Cómo instalarla en el celular (Samsung Galaxy S24 Ultra u otro)

1. Subí esta carpeta a un hosting estático con HTTPS (GitHub Pages, Netlify…),
   **o** abrila desde un servidor local. El modo offline necesita `https://` o
   `localhost`.
2. Abrila en el navegador del celular (Samsung Internet o Chrome).
3. Menú del navegador → **"Agregar a pantalla de inicio"** / "Instalar app".
4. Abrila una vez **con internet** para que se guarde. Después funciona sola,
   incluso en modo avión.
5. Verificá que abajo diga **"✅ Listo para usar sin internet"**.

### Probarla en una computadora
```bash
cd kit-emergencia
python3 -m http.server 8000
# abrir http://localhost:8000
```

---

## 👨‍⚕️ Para el médico: cómo revisar y editar

Dos formas, las dos válidas:

1. **En la app** (Botiquín → tocar un ítem → ✏️ Editar). Marcá "Validado" cuando
   lo apruebes (desaparece el aviso "sin validar").
2. **En Excel** (⬇️ Excel → editar → ⬆️ Importar). Buscá las marcas
   **`⚠️ VALIDAR`** y los **`____`** (sobre todo las **dosis**, que están en
   blanco a propósito). Podés agregar o quitar filas.

Contexto del paciente para las dosis: **190 cm · 105 kg · O negativo**.
Completá también los datos de la pantalla **📋 Datos** (alergias, grupo
sanguíneo, contacto y número de rescate de la zona) en `datos.js`.

---

## 📁 Archivos

| Archivo         | Qué es                                                    |
|-----------------|-----------------------------------------------------------|
| `datos.js`      | Ficha del paciente, escenarios de emergencia y botiquín por defecto. |
| `botiquin.js`   | Tabla del botiquín: editar, guardar, exportar/importar Excel. |
| `camara.js`     | Cámara + identificación por foto (offline y con IA en la nube). |
| `xlsx-mini.js`  | Lector/escritor de Excel en JS puro (offline, sin librerías). |
| `app.js`        | Navegación, escenarios y cableado general.                |
| `index.html` / `styles.css` | Interfaz (botones grandes, alto contraste).   |
| `sw.js`         | Hace que funcione **offline**.                            |
| `manifest.json` / `icono.png` | Permite instalarla como app.                |

---

## ✅ Estado actual

Versión **0.2 (borrador)**. Contenido genérico de primeros auxilios como punto
de partida, **pendiente de validación médica**. Las dosis de medicamentos están
en blanco para que las complete el médico.
