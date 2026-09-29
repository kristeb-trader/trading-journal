# Respaldo del Trading Journal en OneDrive.
#
# El código ya está en GitHub, los datos en Supabase y las imágenes en Cloudinary. Esto copia lo que
# además vive en este equipo: el proyecto entero (con .git y lo que git ignora: el backtesting de Kris,
# las velas, la materia prima...), la configuración de NinjaTrader y los skills y la memoria de Claude.
#
# Solo AÑADE y ACTUALIZA: nunca borra nada del respaldo, aunque se borre en el origen (lo sobrescrito,
# OneDrive lo guarda 30 días en su historial de versiones). No copia claves: la service_role se saca
# de nuevo del panel de Supabase (Settings > API).
#
# Lo lanza a diario la tarea de Windows «TradingJournal - respaldo» (11:00, o al encender si estaba
# apagado). A mano:  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\herramientas\respaldo.ps1
# Registro: respaldo.log en el destino.
#
# RESTAURAR EN UN DISCO NUEVO
#   1. Instalar Git y clonar:  git clone https://github.com/kristeb-trader/trading-journal "E:\Proyectos\Trading Journal"
#      (o copiar «Trading Journal» del respaldo, que ya trae .git).
#   2. Del respaldo al proyecto, lo que git no tiene: chaumer\05_Backtesting\kris\, claude\motor\datos\ y
#      _Historia\, docs\archivo\chaumer\materia-prima\, docs\archivo\inicio-journal\ y js\dev.local.js.
#   3. «NinjaTrader 8» del respaldo a Documentos\NinjaTrader 8\ (con NT8 cerrado), recompilar en NT8 y
#      volver a crear supabase-service-key.txt con la service_role.
#   4. «Claude\skills» a C:\Users\<usuario>\.claude\skills y «Claude\memoria» a la carpeta memory del
#      proyecto en C:\Users\<usuario>\.claude\projects\.
#   5. En chaumer\04_Web: npm install.

$ErrorActionPreference = 'Continue'
$DESTINO  = 'E:\OneDrive\Cerebro\07_Proyectos\Journal Trading'
$PROYECTO = 'E:\Proyectos\Trading Journal'
$NT8      = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'NinjaTrader 8'
$CLAUDE   = Join-Path $env:USERPROFILE '.claude'
$LOG      = Join-Path $DESTINO 'respaldo.log'

# Lo que se regenera solo (o son claves): no se copia
$SIN_DIRS  = @('node_modules', 'dist', '.astro', '.wrangler', '__pycache__', 'worktrees', 'recovery')
$SIN_FILES = @('.dev.vars', 'supabase-service-key.txt', '*.pyc')

function Anotar($texto) {
    $linea = '{0}  {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $texto
    Add-Content -Path $LOG -Value $linea -Encoding UTF8
    Write-Output $linea
}

# robocopy sin /PURGE: nunca borra en el destino; copia lo nuevo o cambiado. -Plano: sin subcarpetas.
function Copiar($nombre, $origen, $destino, [string[]]$archivos = @('*'), [string[]]$sinArchivos = @(), [switch]$Plano) {
    if (-not (Test-Path $origen)) { Anotar "$nombre · FALTA el origen $origen"; return }
    $parametros = @($origen, $destino) + $archivos + @('/R:1', '/W:2', '/NP', '/NJH', '/NJS', '/NDL', '/NFL',
                  '/XD') + $SIN_DIRS + @('/XF') + $SIN_FILES + $sinArchivos
    if (-not $Plano) { $parametros += '/E' }
    $salida = & robocopy @parametros
    $codigo = $LASTEXITCODE
    # 0 = nada nuevo · 1 = copió · 2/3 = hay extras en el destino (normal: no se borra) · >= 8 = fallo
    if ($codigo -ge 8) { Anotar "$nombre · FALLÓ (robocopy $codigo) $(($salida | Select-Object -Last 3) -join ' ')" }
    elseif ($codigo -band 1) { Anotar "$nombre · ok, copió lo nuevo" }
    else { Anotar "$nombre · ok, sin cambios" }
}

New-Item -ItemType Directory -Force -Path $DESTINO | Out-Null

Copiar 'proyecto'        $PROYECTO  (Join-Path $DESTINO 'Trading Journal')
Copiar 'NT8 config'      $NT8       (Join-Path $DESTINO 'NinjaTrader 8') @('cadena-diaria.json', 'checklist-chaumer-config.json', 'TradingJournalSettings.xml', 'Config.xml') -Plano
Copiar 'NT8 plantillas'  (Join-Path $NT8 'templates')  (Join-Path $DESTINO 'NinjaTrader 8\templates')
Copiar 'NT8 workspaces'  (Join-Path $NT8 'workspaces') (Join-Path $DESTINO 'NinjaTrader 8\workspaces')
Copiar 'NT8 código'      (Join-Path $NT8 'bin\Custom') (Join-Path $DESTINO 'NinjaTrader 8\bin\Custom') @('*.cs') @('@*.cs')
Copiar 'Claude skills'   (Join-Path $CLAUDE 'skills')  (Join-Path $DESTINO 'Claude\skills')
Copiar 'Claude memoria'  (Join-Path $CLAUDE 'projects\E--Proyectos-Trading-Journal\memory') (Join-Path $DESTINO 'Claude\memoria')
