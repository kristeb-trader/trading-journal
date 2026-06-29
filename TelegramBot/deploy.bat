@echo off
REM Despliega el bot de Telegram a Cloudflare. Doble clic para ejecutar.
cd /d "%~dp0"
echo ============================================
echo  Desplegando el bot de Telegram a Cloudflare
echo ============================================
echo.
call npx --yes wrangler deploy
echo.
echo ============================================
echo  Listo. Puedes cerrar esta ventana.
echo ============================================
pause
