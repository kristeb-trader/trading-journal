@echo off
rem Cadena diaria: sube a Supabase la ficha del motor de los dias que falten.
rem Lo normal es que lo haga solo el AddOn de NinjaTrader; esto es para emergencias.
set PYTHONIOENCODING=utf-8
python "%~dp0subir_dia.py" --pendientes
echo.
pause
