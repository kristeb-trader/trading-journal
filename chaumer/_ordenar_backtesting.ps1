# ============================================================
#  Ordenar 05_Backtesting  ·  08/09/2026
#  Ejecutar desde E:\Proyectos\Chaumer   ->   .\_ordenar_backtesting.ps1
# ============================================================
$ErrorActionPreference = 'Stop'
$B = 'E:\Proyectos\Chaumer\05_Backtesting'
$H = Join-Path $B '_Historia'
$G = 'E:\Proyectos\Chaumer\02_Assets\galeria'

if (-not (Test-Path $B)) { Write-Host "No encuentro $B" -ForegroundColor Red; exit 1 }
New-Item -ItemType Directory -Force -Path $H | Out-Null
New-Item -ItemType Directory -Force -Path $G | Out-Null

$borrados = 0; $movidos = 0

# --- 1. Basura -------------------------------------------------
foreach ($x in @('__pycache__','sql')) {
    $p = Join-Path $B $x
    if (Test-Path $p) { Remove-Item $p -Recurse -Force; $borrados++; Write-Host "borrado  $x" }
}

# --- 2. Primera version del motor -> _Historia ------------------
foreach ($x in @('motor.py','dibujo.py')) {
    $p = Join-Path $B $x
    if (Test-Path $p) { Move-Item $p (Join-Path $H $x) -Force; $movidos++; Write-Host "archivado  $x" }
}

# --- 3. Imagenes huerfanas -> _Historia -------------------------
foreach ($x in @('F1_10jul.png','M7_dia_completo.png','resumen_39_sesiones.png')) {
    $p = Join-Path $B $x
    if (Test-Path $p) { Move-Item $p (Join-Path $H $x) -Force; $movidos++; Write-Host "archivado  $x" }
}

# --- 4. Imagenes enlazadas desde el plan -> 02_Assets\galeria ---
foreach ($x in @('F1_zona1_10jul.png','L6_sesion_completa.png')) {
    $p = Join-Path $B $x
    if (Test-Path $p) { Move-Item $p (Join-Path $G $x) -Force; $movidos++; Write-Host "a galeria  $x" }
}

# --- 5. Nota de que hay en _Historia ---------------------------
@"
# _Historia de 05_Backtesting

Archivado el 08/09/2026. Nada de aqui se usa.

- **motor.py** y **dibujo.py** — la PRIMERA version del motor de auditoria,
  de mediados de agosto de 2026. Se reescribieron enteros el 26/08/2026 y
  nacieron ``lector.py`` y ``dia.py``, que son los que estan en uso.
  Ningun archivo del proyecto los importa ya.
- **F1_10jul.png**, **M7_dia_completo.png**, **resumen_39_sesiones.png** —
  salidas de prueba de aquella primera version. No estan enlazadas en
  ningun documento.

Las otras dos imagenes que vivian sueltas en 05_Backtesting SI estaban
enlazadas desde el plan y se movieron a ``02_Assets\galeria``:
F1_zona1_10jul.png (glosario) y L6_sesion_completa.png (galeria).
"@ | Set-Content -Path (Join-Path $H 'LEEME.md') -Encoding UTF8

Write-Host ""
Write-Host "Listo: $borrados borrados, $movidos movidos." -ForegroundColor Green
Write-Host ""
Write-Host "05_Backtesting queda asi:" -ForegroundColor Cyan
Get-ChildItem $B | Select-Object Mode, Name | Format-Table -AutoSize
