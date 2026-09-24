@echo off
REM ============================================================
REM iniciar_windows.bat
REM Doble clic sobre este archivo para iniciar la demo en Windows.
REM La primera vez crea un "entorno virtual" (.venv): una carpeta
REM con una copia privada de Python y Flask solo para este proyecto,
REM para no mezclar con otros programas del computador.
REM Para DETENER la demo: cierra esta ventana negra o presiona Ctrl + C.
REM ============================================================
cd /d "%~dp0"

REM 1) Comprobar que Python esta instalado ("py" es el lanzador de Python en Windows).
where py >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se encontro Python. Instalalo desde https://www.python.org/downloads/
  echo         y marca la casilla "Add python.exe to PATH" durante la instalacion.
  pause
  exit /b 1
)

REM 2) Crear el entorno virtual solo si no existe.
if not exist ".venv\Scripts\python.exe" (
  echo Creando entorno virtual por primera vez...
  py -m venv .venv
)

REM 3) Instalar Flask (si ya esta instalado, no hace nada).
echo Instalando/verificando dependencias...
".venv\Scripts\python.exe" -m pip install --quiet -r requirements.txt
if errorlevel 1 (
  echo [ERROR] No se pudo instalar Flask. Revisa tu conexion a internet.
  pause
  exit /b 1
)

REM 4) Iniciar la aplicacion.
echo.
echo ==========================================================
echo  Demo iniciada. Abre en tu navegador:  http://127.0.0.1:8000
echo  Para detenerla: cierra esta ventana o presiona Ctrl + C
echo ==========================================================
".venv\Scripts\python.exe" app.py
pause
