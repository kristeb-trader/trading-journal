# Orden en `chaumer/`: menos documentos, un sitio para cada cosa

| | |
|---|---|
| **Versión** | v1 |
| **Estado** | 🟢 Aprobado (29/09/2026), con P1 y P2 — en implementación |
| **Fecha** | 28/09/2026 |
| **Decidido con Kris** | `04_Web/textos/` ya no se usa: fuera · `chaumer/_Historia/` al archivo · `03_Materia_Prima/` ya no se usa: al archivo |

## Registro de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| v1 | 28/09/2026 | Primera propuesta, tras el diagnóstico del mismo día |

---

## 1. El problema

Hasta el 25/09 el trabajo de Chaumer se repartía entre Cowork y Claude Code, y se comunicaban **escribiéndose
documentos** (encargos, diagnósticos, estados, propuestas). Cowork desapareció (D-028); los documentos se quedaron.
Además el Journal ya tiene un sitio para cada tipo de documento, pero en `chaumer/` ninguna regla lo dice, así que
cada chat abría el suyo.

Lo que cuesta hoy (verificado el 28/09):

- **Documentos que mienten:** `04_Web/DESPLIEGUE.md` (dice que el portal se sube a mano y que el código es
  privado: lo publica GitHub Actions y el repositorio es público), `04_Web/DISENO_PORTAL.md` («propuesta», 38 reglas,
  un documento maestro que ya no existe, una puerta con contraseña que nunca se puso) y `FASES.md` (la fase 3, «sin
  definir», ya funciona).
- **El estado, en cinco sitios:** `chaumer/CLAUDE.md`, `01_Plan/ESTADO.md`, `FASES.md`, `04_Web/ESTADO_FASE_2.md`,
  `tasks/current.md`. Y `ESTADO_FASE_2.md` guarda **4 pendientes del portal que no están en `tasks/current.md`**.
- **Dos archivos paralelos:** `docs/archivo/chaumer/` (en git) y `chaumer/_Historia/` (solo en disco).
- **Material muerto en git:** 28 imágenes de trabajo (`Claude outputs/`), un script de un solo uso, 9 imágenes que
  ninguna página enseña, 10 `.md` de textos que ya no se usan.

## 2. Cómo queda

```
chaumer/                               HOY                              DESPUÉS
├── CLAUDE.md                          sí                               sí + «Dónde va cada cosa» (§3.6)
├── FASES.md                           sí                               ✗ archivado
├── _ordenar_backtesting.ps1           sí                               ✗ borrado
├── Claude outputs/                    28 PNG                           ✗ borrada
├── _Historia/                         8 .md + 3 PNG, fuera de git      ✗ al archivo, en git
├── .claude/launch.json                sí                               ✗ borrado (el de la raíz ya lo tiene)
├── .vscode/                           sí                               sí
├── 01_Plan/                           sí                               sí (dos rutas corregidas, §3.5)
├── 02_Assets/                         30 imágenes                      21 (−9 que no enseña nadie)
├── 03_Materia_Prima/                  transcripciones + un CSV vacío   ✗ al archivo (local) / borrado
├── 04_Web/                            8 .md en la raíz + textos/       2 .md (CLAUDE, DESPLIEGUE) · sin textos/
└── 05_Backtesting/                    kris/ + claude/                  igual, sin kris/CLAUDE.md
```

**En la raíz de `chaumer/`: de 8 carpetas y 3 archivos a 5 carpetas y 1 archivo** (más `.vscode/`).
**En la raíz de `04_Web/`: de 8 `.md` a 2.**

## 3. Qué pasa con cada cosa

### 3.1 Se rescata antes de archivar (nada se pierde)

| De | Qué | A |
|---|---|---|
| `04_Web/ESTADO_FASE_2.md` «Qué falta» | 1) crear la clave del operador para las observaciones · 2) Alfredo no puede comentar en los ocho módulos · 3) simplificar la prosa de los casos · 4) pasarle la dirección a Alfredo | `tasks/current.md`, sección **Portal** |
| `04_Web/DISENO_PORTAL.md` | Lo que sigue siendo regla: «nada de escritura desde el cliente; ninguna clave en el bundle» (§10) · la imagen de un caso se resuelve **solo por nombre** (§7) · el enlazado automático entre documentos (§9), si el código lo sigue haciendo | `04_Web/CLAUDE.md`, una línea cada una |
| `04_Web/DESPLIEGUE.md` | **No se archiva: se reescribe**, corto y verdadero: publica GitHub Actions al hacer push (`.github/workflows/publicar-portal.yml`, secretos `PORTAL_CLOUDFLARE_*`); los dos secretos de Pages (`SUPABASE_PORTAL_KEY`, `CLAVE_OPERADOR` — este, pendiente); consultar las observaciones en D1; cerrar la puerta si algún día hace falta. Fuera los pasos «✅ HECHO» | el mismo archivo |

### 3.2 Se archiva — `docs/archivo/chaumer/`

| Archivo | Por qué se archiva | En qué miente (va al `LEEME`) |
|---|---|---|
| `FASES.md` | Mapa de fases del 24/09 | La fase 3 (agente de backtesting) sale «sin definir»: hoy es la cadena del motor y las Sesiones |
| `04_Web/ESTADO_FASE_2.md` | Sustituido por `tasks/current.md` (D-028) | Sus pendientes se pasaron a `tasks/current.md` el 28/09 |
| `04_Web/DISENO_PORTAL.md` | Diseño original del portal (31/08) | 38 reglas, documento maestro, puerta con Cloudflare Access, advertencias en la portada: nada de eso es así hoy |
| `04_Web/DIAGNOSTICO_PORTAL.md` | Foto del 07/09 | Todo lo que cuenta es de ese día |
| `04_Web/CAMBIO_IRI_A_CONTINUACION.md` | Trabajo terminado el 23/09 | Queda pendiente el paso ③ (NinjaTrader), que es del operador |
| `04_Web/DISENO_COACH.md` | Reemplazado el 24/09 (lo dice su cabecera) | El coach vive en el Journal |
| `_Historia/` entera (8 `.md` + 3 PNG) → `docs/archivo/chaumer/cowork/` | Lo pide Kris. Revisados: ninguna clave dentro | Documentos de la época de Cowork (bitácora, briefs, prompts, propuesta de limpieza de reglas) |

Con un **`docs/archivo/chaumer/LEEME.md`** que diga, archivo por archivo, qué era y en qué ya no se puede creer
(incluidos los dos que ya estaban: `PENDIENTE_PORTAL.md` y `PROPUESTAS_AL_PLAN.md`).

**`03_Materia_Prima/`** → `docs/archivo/chaumer/materia-prima/`, **fuera de git**: las transcripciones son de los
vídeos y audios de Chaumer (material de terceros, `.gitignore` desde siempre). Con ellas, `HALLAZGOS_videos.md` y
las 4 capturas `.jfif` que había en `textos/`. El `registro_sobreextension.csv` **se borra**: es una plantilla con
una sola fila de ejemplo («ejemplo - borrar esta fila»).

### 3.3 Se mueve

`04_Web/DISENO_BACKTESTING.md` → **`docs/disenos/2026-09-09-bitacora-backtesting.md`**, donde están todos los
diseños. Sigue vigente: lo citan `js/backtesting.js` y `04_Web/src/pages/backtesting.astro`, que se actualizan. Las
dos migraciones que lo citan no se tocan (son historia aplicada).

### 3.4 Se borra (git lo conserva)

| Qué | Cuántos |
|---|---|
| `Claude outputs/` — imágenes de trabajo de sesiones pasadas: `2026-07-16.png`, `2026-09-10_filtro.png`, `2026-09-10_umbral8000.png`, `2026-09-14.png`, `2026-09-14_hasta_0858.png`, `2026-09-14_maximos.png`, `2026-09-15_fix.png`, `2026-09-18*.png` (6), `DUDA_zona_estirada.png`, `alcance.png`, `apendice.png`, `comparacion.png`, `duda_premercado.png`, `fluida.png`, `julio_antes_despues.png`, `mecha_vs_cuerpo.png`, `pareja.png`, `pc_0911.png`, `r10.png`, `stop_cuatro.png`, `tramo_0837.png`, `tramo_0841.png`, `zoom_0909.png` | 28 |
| `_ordenar_backtesting.ps1` — se ejecutó una vez el 08/09; sus rutas ya no existen | 1 |
| `02_Assets/`: `8jul_dia_completo`, `BT_10jul`, `BT_13jul`, `NT8_selector_setups`, `galeria/F1_zona1_10jul`, `galeria/G-11_10jul_operacion`, `galeria/G-12_06jul_reingreso`, `galeria/G-12_06jul_sesion_completa`, `galeria/L6_sesion_completa` — ninguna página las enseña (los casos de julio usan ya el gráfico de su Sesión) | 9 |
| `04_Web/textos/` (9 `.md` + `LEEME.md`) y los dos scripts que solo existían para ellos: `scripts/textos.mjs` y `scripts/aprobados.mjs` (sale de `npm run verificar`) | 12 |
| `05_Backtesting/kris/CLAUDE.md` — describe un «módulo de registro» que ya vive en el Journal (`js/backtesting.js`) | 1 |
| `chaumer/.claude/launch.json` — repite la configuración `portal` del `.claude/launch.json` de la raíz | 1 |
| `03_Materia_Prima/registro_sobreextension.csv` — plantilla vacía | 1 |

**No se toca:** `01_Plan/` (salvo §3.5), `02_Assets/diagramas/` (tu regla: no se mueven hasta rehacerlos),
`05_Backtesting/claude/` (protocolo, motor, sesiones), `05_Backtesting/claude/motor/_Historia/` (el motor viejo, en
disco) y `04_Web/.claude/` (el preview de las sesiones que arrancan en `04_Web/`).

### 3.5 Dos rutas del plan (necesitan tu sí, cambio a cambio)

| # | Archivo | Hoy | Propuesto |
|---|---|---|---|
| P1 | `CONTEXTUALIZACION.md` L15 | transcripción en `03_Materia_Prima\transcripciones\2026-08-24_audio_chaumer.md` | … en `docs/archivo/chaumer/materia-prima/transcripciones/2026-08-24_audio_chaumer.md` (en disco, fuera de git) |
| P2 | `GALERIA.md` G-12, línea `**Archivo:**` | `../02_Assets/galeria/L6_sesion_completa.png` | `05_Backtesting\claude\2026-07-06.png` |

Commit `plan: …` propio, versión 3.35, sincronizado (el documento `contextualizacion` del Coach cambia: se aplica
por el MCP con su huella).

### 3.6 Para que no vuelva a pasar

En **`chaumer/CLAUDE.md`**, una sección nueva y corta, **«Dónde va cada cosa — en `chaumer/` no nacen documentos»**:

| Si es… | Va a |
|---|---|
| un diseño | `docs/disenos/AAAA-MM-DD-tema.md` |
| un pendiente | `tasks/current.md` |
| una decisión y su porqué | `docs/decisiones.md` |
| lo que pasó | `docs/historial-proyecto.md` (el Journal) · `01_Plan/HISTORIAL.md` (solo el plan) |
| una imagen de trabajo (dudas, previas, comparaciones) | el scratchpad de la sesión, **nunca** el repositorio |
| algo que ya no vale | `docs/archivo/chaumer/`, con su línea en el `LEEME` |

En `chaumer/` solo viven: el plan, las imágenes que publica el portal, el código del portal, las Sesiones y sus tres
documentos de protocolo, y los dos `CLAUDE.md`.

En el **`CLAUDE.md` de la raíz**, una línea en «La carpeta `chaumer/`»: *en `chaumer/` no se crean documentos
nuevos; cada cosa va a su sitio del Journal (`chaumer/CLAUDE.md`)*.

Y una decisión nueva, **D-030**, con el porqué.

### 3.7 Referencias que se arreglan

| Dónde | Qué cita | Pasa a |
|---|---|---|
| `04_Web/CLAUDE.md` | `DISENO_PORTAL.md`, `DISENO_BACKTESTING.md`, `textos\` | lo rescatado en §3.1 · `docs/disenos/2026-09-09-bitacora-backtesting.md` · nada |
| `04_Web/src/pages/zonas.astro` (comentario) | `ESTADO_FASE_2`, `textos/02-zonas.md` | el archivo |
| `04_Web/src/pages/setups.astro`, `scripts/nombres.mjs` (comentarios) | `CAMBIO_IRI_A_CONTINUACION.md` | `docs/archivo/chaumer/…` |
| `04_Web/src/lib/parsers.mjs` (comentario) | `01_Plan/PROPUESTA_LIMPIEZA_REGLAS.md` (nunca estuvo ahí) | `docs/archivo/chaumer/cowork/…` |
| `04_Web/src/pages/backtesting.astro`, `js/backtesting.js` | `DISENO_BACKTESTING.md` | `docs/disenos/2026-09-09-bitacora-backtesting.md` |
| `04_Web/scripts/sync.mjs` | la carpeta `galeria/sesiones/`, que ya no existe | fuera esa rama |
| `04_Web/package.json` | `npm run aprobados` en `verificar` | fuera |
| `.gitignore` | `03_Materia_Prima/transcripciones/`, `04_Web/textos/*.jfif…` | `docs/archivo/chaumer/materia-prima/` |

## 4. Plan de implementación

Cada fase, verificada y en su commit.

| Fase | Qué | Verificación |
|---|---|---|
| **F1 · Rescatar** | §3.1: pendientes a `tasks/current.md`, reglas vivas a `04_Web/CLAUDE.md`, `DESPLIEGUE.md` reescrito | Leer cada cosa rescatada contra el código o el workflow antes de escribirla |
| **F2 · Archivar y mover** | §3.2 y §3.3 + `LEEME` del archivo + §3.7 | Búsqueda: ninguna ruta de un documento vivo apunta a algo que ya no existe |
| **F3 · Borrar** | §3.4 | `npm run verificar` sin fallos · el portal compila y se ve igual (captura) |
| **F4 · Plan 3.35** | §3.5: P1 y P2, con tu sí | `vigilar --estricto`, sincronización con huella, `npm run verificar` |
| **F5 · La regla** | §3.6 + D-030 | — |
