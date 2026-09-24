#!/bin/bash
# ============================================================
# iniciar_mac_linux.sh
# Inicia la demo en Mac o Linux. Desde la Terminal:
#     bash iniciar_mac_linux.sh
# La primera vez crea un "entorno virtual" (.venv): una carpeta con una
# copia privada de Python y Flask solo para este proyecto.
# Para DETENER la demo: presiona Ctrl + C en la Terminal.
# ============================================================
cd "$(dirname "$0")" || exit 1

# 1) Comprobar que Python 3 está instalado.
if ! command -v python3 >/dev/null 2>&1; then
  echo "[ERROR] No se encontró python3. Instálalo desde https://www.python.org/downloads/"
  exit 1
fi

# 2) Crear el entorno virtual solo si no existe.
if [ ! -x ".venv/bin/python" ]; then
  echo "Creando entorno virtual por primera vez..."
  python3 -m venv .venv || { echo "[ERROR] No se pudo crear el entorno virtual."; exit 1; }
fi

# 3) Instalar Flask (si ya está instalado, no hace nada).
echo "Instalando/verificando dependencias..."
.venv/bin/python -m pip install --quiet -r requirements.txt || { echo "[ERROR] No se pudo instalar Flask. Revisa tu conexión a internet."; exit 1; }

# 4) Iniciar la aplicación.
echo
echo "=========================================================="
echo " Demo iniciada. Abre en tu navegador:  http://127.0.0.1:8000"
echo " Para detenerla: presiona Ctrl + C"
echo "=========================================================="
.venv/bin/python app.py
