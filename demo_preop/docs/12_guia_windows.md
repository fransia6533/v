# 12 · Guía paso a paso para Windows

Tiempo estimado: 15 minutos la primera vez y 30 segundos las siguientes.
No necesitas saber usar la terminal: todo se hace con doble clic.

---

## Bloque 1 · Instalar Python (una sola vez)

**Esto vamos a hacer:** instalar Python, el programa que "lee" el código de la demo.

**Pasos**
1. Abre tu navegador y entra a **https://www.python.org/downloads/**
2. Aprieta el botón amarillo **"Download Python 3.x.x"** (cualquier versión 3.10 o más nueva sirve).
3. Abre el archivo descargado (queda en la carpeta *Descargas*).
4. En la primera ventana del instalador, **marca abajo la casilla "Add python.exe to PATH"**. ⚠️ Es el paso más importante.
5. Aprieta **"Install Now"** y espera. Si Windows pregunta si permites cambios, responde **Sí**.
6. Cuando diga **"Setup was successful"**, aprieta **Close**.

**Esto deberías ver:** el mensaje "Setup was successful".

**Así comprobamos que funcionó:** aprieta la tecla Windows, escribe `cmd` y presiona Enter. En la ventana negra escribe `py --version` y presiona Enter. Debe aparecer algo como `Python 3.12.5`. Cierra la ventana.

**Si falla:**
| Ves | Solución |
|---|---|
| `"py" no se reconoce como un comando...` | Vuelve a abrir el instalador, elige **Modify** o reinstala marcando **"Add python.exe to PATH"** |
| Se abre la **Microsoft Store** al escribir `python` | Usa `py` en vez de `python`. El script de la demo ya usa `py` primero |

---

## Bloque 2 · Descomprimir la demo

**Pasos**
1. Guarda `demo_preop.zip` en una carpeta fácil, por ejemplo *Documentos*.
2. Haz clic derecho sobre el zip → **"Extraer todo..."** → **Extraer**.
3. Entra a la carpeta que se creó hasta ver archivos como `README.md`, `app.py` e `iniciar_windows.bat`.
   (A veces queda una carpeta dentro de otra con el mismo nombre: entra hasta ver esos archivos.)

⚠️ **No ejecutes la demo desde dentro del zip sin extraer**: no podrá guardar datos.

---

## Bloque 3 · Iniciar la demo

**Pasos**
1. Haz **doble clic en `iniciar_windows.bat`**. Puede que Windows lo muestre solo como `iniciar_windows` con un ícono de engranaje.
2. Si aparece **"Windows protegió su PC"**: clic en **"Más información"** → **"Ejecutar de todas formas"**. Aparece porque el archivo no viene de una tienda oficial.
3. Se abre una ventana negra. **La primera vez** dice `Creando entorno virtual por primera vez...` y `Instalando/verificando dependencias...` y tarda 1–2 minutos (necesita internet).
4. Espera hasta ver:
   ```
   Demo iniciada. Abre en tu navegador:  http://127.0.0.1:8000
   ```
   Debajo aparecerá un texto rojo `WARNING: This is a development server...`: **es normal**.
5. Abre Chrome o Edge y escribe en la barra de direcciones: `127.0.0.1:8000`

**Esto deberías ver:** franja amarilla "DEMOSTRACIÓN · Datos 100% ficticios" y el **Panel de seguimiento** con 11 controles.

**No cierres la ventana negra mientras uses la demo**: es la aplicación funcionando.

**Para detener:** cierra la ventana negra (o haz clic en ella y presiona `Ctrl + C`).

**Si falla:**
| Ves | Qué significa | Solución |
|---|---|---|
| La ventana negra se abre y se cierra de inmediato | Hubo un error antes de la pausa | Abre `cmd`, arrastra `iniciar_windows.bat` a la ventana y presiona Enter: así el error queda visible. Envíame una foto |
| `[ERROR] No se encontro Python` | Falta el Bloque 1 | Instala Python marcando "Add python.exe to PATH" |
| `[ERROR] No se pudo instalar Flask` | Sin internet o una red que bloquea descargas (algunas redes de hospital lo hacen) | Conéctate a otra red (por ejemplo, desde tu casa) solo la primera vez |
| Aviso del **Firewall de Windows** | Windows pregunta si Python puede usar la red | La demo solo usa tu propio equipo (127.0.0.1); puedes cancelar el aviso y la demo funciona igual. Si no carga, elige "Permitir" solo para redes privadas |
| El navegador dice "No se puede acceder a este sitio" | La ventana negra está cerrada o con error | Revisa que siga abierta y que diga "Demo iniciada" |
| `Address already in use` | Ya hay otra ventana de la demo abierta | Ciérrala y vuelve a iniciar |

---

## Bloque 4 · Primer ejercicio (recorrido completo)

1. Menú **Registrar control** → nombre `Paciente Prueba`, teléfono `0001234`, una fecha, marca 2 exámenes, marca **"Confirmo que todos los datos son ficticios"** → **Guardar**.
2. En el detalle → **Simular envío de invitación** → debe decir "Simulada (no enviada realmente)".
3. **Abrir la vista del paciente (chat)** → responde. En un examen elige **"Lo respondo después"**.
4. En el resumen, aprieta **Cambiar** en ese examen, elige otra respuesta y luego **Enviar respuestas**.
5. Vuelve al **Panel** → busca `Paciente Prueba` → debe aparecer **Completa**.
6. **Cierra la ventana negra**, vuelve a hacer doble clic en `iniciar_windows.bat` y abre `127.0.0.1:8000`.

**Así comprobamos que funcionó:** tu paciente sigue en el panel con sus respuestas.

7. Aprieta **Exportar esta tabla (CSV)** y abre el archivo con Excel. En Chile, Excel usa punto y coma como separador, así que debería mostrarse en columnas.

**Envíame:** una foto del panel del paso 6, o el error exacto que viste y en qué paso.

---

## Bloque 5 (opcional) · Correr las pruebas automáticas

Con la demo **detenida**:
1. Abre la carpeta de la demo en el Explorador de archivos.
2. Haz clic en la barra de dirección de la ventana (arriba), escribe `cmd` y presiona Enter. Se abre una ventana negra "parada" en esa carpeta.
3. Escribe:
   ```
   .venv\Scripts\python -m unittest discover -s tests -v
   ```
4. Debe terminar con **`OK`** (13 pruebas).

---

## Para la presentación en el hospital
- Si usarás un **computador del hospital**, prueba antes: algunos equipos institucionales no permiten instalar programas ni ejecutar archivos `.bat`. En ese caso, lleva tu propio notebook con la demo ya instalada. Una vez instalada, **no necesita internet**.
- Antes de presentar: botón **Reiniciar demo** (al final del panel).
