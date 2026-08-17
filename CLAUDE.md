# Trading Journal NQ Futures

Dashboard personal de operativa diaria en NQ/MNQ Futures (1 min), Metodología Chaumer.
100% serverless, ~$0.40/mes. Frontend vanilla, sin frameworks — y así se queda.

## Invariantes

Lo que no se toca sin aprobación explícita. Una línea cada una; el detalle se carga solo
al abrir el archivo afectado.

- **Disciplina** — el criterio vive SOLO en `js/db.js`. Estuvo duplicado en 4 sitios y se
  desincronizó. Detalle: `.claude/rules/disciplina.md` · paso a paso: `docs/Disciplina.md`.
- **P&L** — `trades.profit` es **NETO** (comisión round-trip ya descontada);
  `commission` es el round-trip total. Unificado jun 2026.
- **Riesgo en PUNTOS, no en dólares** — MNQ = $2/punto, NQ = $20/punto. Normalizar mal el
  MAE lo infla ×10 en NQ y ya llevó a una conclusión falsa.
- **Horas: NinjaTrader está en hora de Colombia (UTC-5), no ET.** Convertir a ET antes de
  razonar sobre RTH o premercado. Ya causó 2 bugs. Detalle:
  `.claude/rules/ninjatrader.md`.
- **Guardar sesión** — `upsertSesion` manda el payload al Worker `/api/session`, que lo
  escribe TAL CUAL como columnas de `sesiones`. Una clave que no sea columna revienta el
  guardado entero (PGRST204). `checklist` y `noticiasRojas` van fuera del destructuring.
- **Coach IA** — prompt caching por prefijo, la gráfica no se persiste, el historial va
  cortado a la fecha analizada. Detalle: `.claude/rules/coach.md`.
- **Sesión Operativa** — nada interactivo funciona dentro de `#sessionFieldset` en modo
  lectura; los trades del día NO se filtran por cuenta principal. Detalle:
  `.claude/rules/sesion.md`.
- **Navegación: 6 botones, ni uno más** — en móvil la barra son botones de 60 px contra
  ~390 px de pantalla; el 7º obliga a deslizar. Una sección nueva va a las tarjetas de
  **Otros** (`Otros.ITEMS` en `app.js`) **y** a `Nav.PADRE`: sin la segunda, la barra se
  queda entera apagada al entrar en ella.
- **Un solo título por pantalla**, el de la barra superior. Las secciones NO llevan `<h2>`
  propio: el dato variable (mes, filtro, rango) va a `Nav.setContexto(seccion, texto)`.
  Y los controles de sección (filtro de cuentas, flechas de mes) **viven en esa misma
  barra**: se declaran en `Nav.HERRAMIENTAS`, no en el markup de la sección.
- **Importes: `fmtMiles` / `fmtDinero` de `db.js`, nunca `toFixed(0)`.** Sin decimales y
  con separador de miles (2212 → `2.212`). Se agrupa a mano porque `toLocaleString('es-ES')`
  **no agrupa los números de 4 dígitos** (CLDR del español) y devolvía `"2212"`.
- **Un trade vive en UNA tabla: `trades` o `apex_trades`, nunca en las dos.** `apex.js`
  concatena ambas y filtra por cuenta; duplicar infla el **drawdown consumido** de Apex, que
  es lo que decide si la cuenta se quema. La cuenta principal se ve en las dos vistas
  estando solo en `trades`.
- **Cerrado y no se reabre (24 jul)** — las 6 reglas con filas de relleno en feb–may
  (`rei_zona`, `chk_contexto`, `chk_no_mover`, `rr_1a1`, `stop_max_puntos`,
  `target_sin_zonas`) se quedan como están. Limpiarlas bajaría la disciplina global de
  81,5% a 75,1% y rompería la comparabilidad. La disciplina de feb–may está inflada **por
  diseño aceptado**. Motivo completo: `docs/decisiones.md`.

## Verificación

Nunca "debería funcionar". En orden:

1. `node --check <archivo>` en cada `.js` tocado.
2. Levantar el preview y **mirar la pantalla afectada**, con la consola abierta y sin
   errores.
3. Si se tocó un cálculo o la BD: un `SELECT` contra Supabase que confirme el número.
4. Si se tocó `NinjaTrader/*.cs`: avisar a Kris de que hay que **recompilar en NT8** — no
   basta con el push.

El bot de Telegram **se despliega solo** al hacer push a `main` que toque
`TelegramBot/**` (GitHub Actions). No hace falta `wrangler deploy` a mano.

## Diseño

Los diseños aprobados se guardan en `docs/disenos/`, uno por archivo,
`YYYY-MM-DD-tema.md`, con versión y estado en la cabecera. **El diseño aprobado manda
sobre la implementación.** Ya pasó que se implementara otra cosa y hubo que rehacerla.

## Datos

- **Supabase** (PostgreSQL), proyecto `jothoslozctflfrnysrx`. **RLS activo en las 18
  tablas**: política `auth_all` para `authenticated`; `anon` sin políticas. Bot, Worker e
  indicadores NT8 usan `service_role`.
- **El esquema se consulta con `list_tables` del MCP**, no con un documento. Aquí solo va
  lo que el esquema no dice.
- **Migraciones:** `docs/migrations/`, nombre `YYYY-MM-DD-descripcion.sql`. **Las aplica
  Claude** vía `apply_migration` del MCP, usando el nombre del archivo como `name`.
  Índice y estado: `docs/migrations/INDICE.md`.
- Tras cualquier `ALTER TABLE`: `NOTIFY pgrst, 'reload schema';`. Tabla nueva: activar RLS
  + política `auth_all` + grants a `service_role`.
- **Reglas: soft-delete** (`activa=false`), nunca borrado físico — hay historial con FK.

Lo que el esquema no cuenta y hay que saber:

| Tabla | Lo que no se ve mirando las columnas |
|---|---|
| `sesion_checklist` | 1 fila = sesión × regla. **Sin fila = N/A**, no cuenta en disciplina. Sin triggers de materialización desde el 16 ago: la sesión nace **limpia** |
| `catalogo_reglas` | Rulebook canónico. `bloquea_go`, `aplica_si` (siempre/dia_fomc/hay_noticia) y `evidencia` (auto/declarada) son los 3 ejes que deciden si una regla se evalúa. `setup` NULL = común a todos |
| `diagnostico_errores` | `regla_codigo` = la regla que ese error contradice → la disciplina la cuenta incumplida **aunque la casilla esté marcada**. NULL = psicológico, no toca el checklist |
| `sesion_noticias` | UNIQUE (fecha, hora): una noticia por hora. El CPI publica 4 cifras a las 7:30 pero es **un** evento con **una** ventana (±5 min sobre la entrada) |
| `objetivos` | Fila única. `cuenta_principal` es la cuenta que alimenta P&L/Análisis/Coach; se elige en Datos y la lee el indicador NT8 al arrancar. `limite_perdida_dia` está **obsoleto** (el riesgo se mide en puntos) |
| `sesiones` | `setup` (texto) y `setup_codigo` los sincroniza el trigger `fn_sync_setup_codigo`, escriba quien escriba. La columna `noticias` se retiró de la UI el 16 ago y su contenido se migró a `sesion_noticias`; **la columna sigue existiendo** |

## Lenguaje visual

- **Tokens:** `css/styles.css`, bloque `:root` (26). Iconos: Tabler Icons · Gráficas:
  Chart.js (ambos por CDN).
- **Cada color semántico tiene DOS valores**: `base` para bordes y fondos, `-txt` para
  texto sobre oscuro (la base no contrasta). Usar la base en un `color:` es el error
  típico.
- ⚠️ **Al tocar UI: usar el token, NUNCA el hex.**
- ⚠️ **Deuda:** conviven dos lenguajes visuales (el nuevo solo está en la pestaña Diario)
  y quedan 45 literales sin tokenizar.
- **Tabla completa, superficies y detalle de la deuda: `.claude/rules/estilos.md`** — se
  carga solo al abrir `css/**` o `index.html`.

## Stack y URLs

| Capa | Qué |
|---|---|
| Frontend | HTML + JS vanilla — GitHub Pages |
| BD | Supabase (PostgreSQL) |
| Proxy IA | Cloudflare Worker `broad-hall-c53f.kristerock.workers.dev` |
| Análisis IA | Claude API `claude-sonnet-5` (`js/coach.js:5`) — adaptive thinking, effort low, prompt caching |
| Imágenes | Cloudinary (`dq4n7bjta` / preset `trading-journal`) |
| Bot | Telegram → Cloudflare Worker #2 + KV |
| NT8 | Indicadores C# en `NinjaTrader/` |

- Producción: `https://kristeb-trader.github.io/trading-journal`
- Supabase: `https://jothoslozctflfrnysrx.supabase.co`
- Repo: `https://github.com/kristeb-trader/trading-journal` (privado, `main`)

## Mapa del código

```
js/app.js         Boot, navegación SPA, SesionOperativa (pestañas + cabecera),
                  Modal.openDay = vista del día a pantalla completa,
                  Nav.HERRAMIENTAS = controles de sección en la barra superior
js/db.js          Toda query a Supabase + cálculo canónico de disciplina +
                  fmtMiles/fmtDinero (formato de importes)
js/form.js        Pestaña "Diario" de Sesión Operativa
js/coach.js       Pestaña "Coach IA" (3 etapas) + renderHistorial = "Días anteriores"
js/calendar.js    Calendario mensual · js/metrics.js  KPIs
js/charts.js      Sección Análisis · js/disciplina.js  Dashboard de Disciplina
js/apex.js        Apex Tracker · js/experimentos.js  Laboratorio
js/estrategia.js  Editor del rulebook · js/fechas.js  Fechas Especiales
js/account-filter.js  Filtro de cuentas compartido (nombre COMPLETO)
css/styles.css    Dark mode + responsive
NinjaTrader/      SupabaseAutoExport (trades) · SupabaseDailyLevels (niveles) ·
                  ChecklistChaumer (checklist en el gráfico)
TelegramBot/      Bot (Cloudflare Worker). Se despliega solo al hacer push
```

**Sesión Operativa** (`section-register`, menú "Sesión") = una pantalla, 3 pestañas, una
sola fecha. `Nav.go('coach')` y `Nav.go('historial')` son alias que abren esta sección en
su pestaña — no romperlos.

## Estado

Todas las secciones funcionando. **El menú son 6 botones** — Disciplina · Análisis ·
Calendario · Sesión · Apex · **Otros** —, y las otras 6 secciones (Experimentos · Trades ·
Imágenes · Estrategia · Datos · Fechas Especiales) se abren desde las tarjetas de **Otros**,
donde vive también **Ajustes** (claves y objetivos, tema, seguridad, cerrar sesión).

**Qué está en marcha y qué falta: `tasks/current.md`.**

## Dónde está lo demás

| Busco | Está en |
|---|---|
| En qué estamos y qué falta | `tasks/current.md` · `tasks/backlog.md` |
| **Por qué** se decidió algo así | `docs/decisiones.md` |
| Cómo se calcula la disciplina, con ejemplo real | `docs/Disciplina.md` |
| La metodología Chaumer (setups, reglas duras) | `docs/metodologia-chaumer.md` |
| Qué pasó y cuándo | `docs/historial-proyecto.md` |
| Diseños aprobados | `docs/disenos/` |
| Estado de las migraciones | `docs/migrations/INDICE.md` |
| Documentación del sistema viejo (no vigente) | `docs/archivo/` |

<!-- Las rutas van entre backticks a propósito: asi son texto literal. Sin backticks,
     una ruta precedida de arroba seria un import, y ese archivo se cargaria entero
     en cada sesion. Ver docs/disenos/2026-08-16-reestructuracion.md seccion 13.1. -->
