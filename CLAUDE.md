# Trading Journal NQ Futures

Dashboard personal de operativa diaria en NQ/MNQ Futures (1 min), Metodología Chaumer.
100% serverless, ~$0.40/mes. Frontend vanilla, sin frameworks — y así se queda.

## Invariantes

Lo que no se toca sin aprobación explícita. Una línea cada una; el porqué, en el puntero.

- **Disciplina** — el criterio vive SOLO en `js/db.js`, y un día cuenta las reglas de **su etapa**,
  activas o no (`activa` solo decide qué se ve para marcar). `.claude/rules/disciplina.md` · D-004, D-024.
- **P&L** — `trades.profit` es **NETO**; `commission` es el round-trip total. D-002.
- **Riesgo en PUNTOS, no en dólares** — MNQ = $2/punto, NQ = $20/punto. D-005.
- **Horas: NinjaTrader va en hora de Colombia (UTC-5), no ET.** Convertir a ET antes de razonar
  sobre RTH o premercado. `.claude/rules/ninjatrader.md`.
- **Fechas: `hoyISO()` / `isoLocal()` de `db.js`, NUNCA `new Date().toISOString().slice(0,10)`**:
  pasa a UTC y desde las 19:00 locales da ya el día siguiente. Sobre una fecha anclada al mediodía
  (`new Date(f + 'T12:00:00')`) sí vale — por eso `getWeekKey` y `mondayOf` se quedan así.
- **Guardar sesión** — el Worker escribe el payload TAL CUAL en `sesiones`: una clave que no sea
  columna revienta el guardado entero. `.claude/rules/sesion.md`.
- **Coach IA** — caché por prefijo, la gráfica no se persiste, historial cortado a la fecha; en la
  etapa 2 el plan de Chaumer va **primero** en el system. `.claude/rules/coach.md`.
- **Sesión Operativa** — nada interactivo dentro de `#sessionFieldset` en modo lectura; los trades
  del día no se filtran por cuenta principal. `.claude/rules/sesion.md`.
- **Navegación: 6 botones, ni uno más** (el 7º recorta las etiquetas en móvil). Una sección nueva va
  a `Otros.ITEMS` **y** a `Nav.PADRE` (sin la segunda, la barra se queda apagada).
- **Un solo título por pantalla**, el de la barra: las secciones no llevan `<h2>`; el dato variable va
  a `Nav.setContexto()` y los controles de sección a `Nav.HERRAMIENTAS`.
- **Importes: `fmtMiles` / `fmtDinero` de `db.js`, nunca `toFixed(0)`** — sin decimales y con miles
  (`2.212`); `toLocaleString('es-ES')` no agrupa los números de 4 dígitos.
- **Cada tabla de trades tiene UN rol:** `trades` = journal de la cuenta principal; `apex_trades` =
  todas las de Apex. **`apex.js` NO lee `trades`**: contaría dos veces e inflaría el drawdown. D-019.
- **Cerrado y no se reabre** — las 6 reglas con relleno en feb–may se quedan como están. D-007.

## Verificación

Nunca "debería funcionar". En orden:

1. `node --check <archivo>` en cada `.js` tocado.
2. Levantar el preview y **mirar la pantalla afectada**, con la consola abierta y sin
   errores.
3. Si se tocó un cálculo o la BD: un `SELECT` contra Supabase que confirme el número.
4. Si se tocó `NinjaTrader/*.cs`: avisar a Kris de que hay que **recompilar en NT8** — no
   basta con el push.

**El preview no pide contraseña**, nunca, ni aunque la sesión caduque: cae solo a la copia local
(`js/dev.local.js`, banda ámbar; `?login` fuerza el login). ⚠️ **Es una foto, no un espejo**: vale
para maquetación; un número de **hoy** se afirma con el paso 3. `.claude/rules/modo-local.md`.

## Diseño

Los diseños aprobados se guardan en `docs/disenos/`, uno por archivo,
`YYYY-MM-DD-tema.md`, con versión y estado en la cabecera. **El diseño aprobado manda
sobre la implementación.** Ya pasó que se implementara otra cosa y hubo que rehacerla.

## Datos

- **Supabase** (PostgreSQL), proyecto `jothoslozctflfrnysrx`. **RLS activo en todas las
  tablas**: política `auth_all` para `authenticated`; `anon` sin políticas. Bot, Worker e
  indicadores NT8 usan `service_role`. **El portal** lee con su rol `portal_lector`, que solo
  ve las vistas `portal_*` (D-023). **Excepción a propósito: `motor_fichas`** lleva la
  política `candado`, no `auth_all` (D-026). "Normalizarla" lo abre sin dar ningún error.
- **El esquema se consulta con `list_tables` del MCP**, no con un documento. Aquí solo va
  lo que el esquema no dice.
- **Migraciones:** `docs/migrations/`, nombre `YYYY-MM-DD-descripcion.sql`. **Las aplica
  Claude** vía `apply_migration` del MCP, usando el nombre del archivo como `name`.
  Índice y estado: `docs/migrations/INDICE.md`.
- Tras cualquier `ALTER TABLE`: `NOTIFY pgrst, 'reload schema';`. Tabla nueva: activar RLS
  + política `auth_all` + grants a `service_role`.
- **Reglas: soft-delete** (`activa=false`), nunca borrado físico — hay historial con FK.

| Tabla | Lo que no se ve mirando las columnas |
|---|---|
| `sesion_checklist` | 1 fila = sesión × regla. **Sin fila = N/A**, no cuenta en disciplina. La sesión nace **limpia** (D-013) |
| `catalogo_reglas` | Rulebook canónico. Tres ejes deciden si una regla se evalúa: `bloquea_go`, `aplica_si` (siempre/dia_fomc/hay_noticia), `evidencia` (auto/declarada). `setup` NULL = común. **`etapa`** decide en qué disciplina cuenta. La etapa 2 (`origen` plan_*) la escribe **solo** `scripts/plan/sincronizar.mjs`: ni a mano ni desde la app |
| `diagnostico_errores` | `regla_codigo` = la regla que el error contradice → cuenta incumplida **aunque la casilla esté marcada**. NULL = psicológico |
| `sesion_noticias` | UNIQUE (fecha, hora): el CPI son 4 cifras a las 7:30 pero **un** evento con **una** ventana (±5 min) |
| `objetivos` | Fila única. `cuenta_principal` alimenta P&L/Análisis/Coach y la lee el indicador NT8. `limite_perdida_dia`, **obsoleto** |
| `chaumer_operativas` | **Solo el lado de Chaumer**: el de Kris se lee de `sesiones`+`trades`. `hora_entrada` en hora Colombia, **sin** `horaEt()` (D-017); `puntos` en puntos. El veredicto se calcula, no se guarda |
| `bt_*` | La bitácora de backtesting: nunca se mezcla con `trades` ni `apex_trades`. Se escribe con `bt_guardar_jornada` (una transacción, calcula el P&L). `pnl` **neto y congelado**: una jornada corregida **conserva** sus valores; `puntos` siempre positivo (el signo, `resultado`); `hora` en hora Colombia. El portal lee `portal_bt_*` |
| `plan_documentos` | Los 5 documentos del plan que lee el Coach. **Solo** `scripts/plan/sincronizar.mjs` (SQL por el MCP, `huella` sha256); el texto se edita en `chaumer/01_Plan` |
| `coach_uso` | Una fila por llamada del Coach: tokens, coste y `codigos_quitados`. **Sin texto** |
| `motor_fichas` | Lo que marcó el motor cada día. **Solo** `scripts/cadena/subir_dia.py` (`service_role`), a las 10:32 (11:32 en invierno). **Candado:** `authenticated` solo la lee si el día está registrado; `motor_estado(fecha)` dice si la hay sin enseñarla. `velas` (UTC) son para el agente: el Coach no las lee. Horas Colombia, precios en puntos |
| `sesiones` | `registrada_at` = el **primer** guardado (un trigger la congela): abre el candado de `motor_fichas` y decide qué gráficos del motor se publican; `diario_editado_at` = el último. `setup` y `setup_codigo` los sincroniza `fn_sync_setup_codigo`. La columna `noticias` existe pero no se usa (va a `sesion_noticias`), **ni `estado_emocional_fin_id`**: el estado al cierre vive en `diagnosticos_diarios`, que es donde lo escriben la web y el bot y lo lee el Coach. Los **niveles de precio** los escribe NinjaTrader (indicador `SupabaseDailyLevels`): si el bot o el formulario los mandaran, en `[]`, los **borrarían**. Las **zonas naranjas** (`soportes_naranja`, `resistencias_naranja`) ya no las escribe nadie desde el 5 oct: el plan nuevo no las usa y el AddOn las quitó |

## Lenguaje visual

- **Tokens:** `css/styles.css`, bloque `:root`. Iconos: Tabler Icons · Gráficas: Chart.js (CDN).
- **Cada color semántico tiene DOS valores**: `base` para bordes y fondos, `-txt` para texto sobre
  oscuro. Usar la base en un `color:` es el error típico. ⚠️ **Al tocar UI: el token, NUNCA el hex.**
- ⚠️ **Deuda:** conviven dos lenguajes visuales y quedan literales sin tokenizar.
- **Tabla completa, superficies y cifras de la deuda: `.claude/rules/estilos.md`** — carga sola al
  abrir `css/**` o `index.html`.

## Stack y URLs

| Capa | Qué |
|---|---|
| Frontend | HTML + JS vanilla — GitHub Pages, se publica solo al hacer push (`.claude/rules/publicacion.md`) |
| BD | Supabase (PostgreSQL) |
| Proxy IA | Cloudflare Worker `broad-hall-c53f.kristerock.workers.dev` |
| Análisis IA | Claude API `claude-opus-5-5` (`js/coach.js`) — adaptive thinking, effort low, caché de 5 min con toque, guardado automático; consumo en `coach_uso` (D-025, D-033) |
| Imágenes | Cloudinary (`dq4n7bjta` / preset `trading-journal`) |
| Bot | Telegram → Cloudflare Worker #2 + KV. **Se despliega solo** al hacer push que toque `TelegramBot/**` |
| NT8 | Indicadores C# en `NinjaTrader/` |

- Producción: `https://kristeb-trader.github.io/trading-journal`
- Supabase: `https://jothoslozctflfrnysrx.supabase.co`
- Repo: `https://github.com/kristeb-trader/trading-journal` (**público**, `main`). Lo que se
  sube lo puede leer cualquiera, `chaumer/` incluido: nunca claves en el código. D-022

## Mapa del código

```
js/app.js         Boot, navegación SPA, SesionOperativa (pestañas + cabecera),
                  Modal.openDay = vista del día a pantalla completa,
                  Nav.HERRAMIENTAS = controles de sección en la barra superior
js/db.js          Toda query a Supabase + cálculo canónico de disciplina +
                  fmtMiles/fmtDinero (formato de importes)
js/form.js        Pestaña "Diario" de Sesión Operativa
js/coach.js       Pestaña "Coach IA" (3 etapas) + renderHistorial = "Días anteriores"
js/calendar.js    Calendario mensual (Mío, en puntos) · js/metrics.js  KPIs + curva (pintarEquity)
js/calendarios.js La pantalla de los 4 calendarios (Mío · Chaumer · Claude · manual) y la vista de los 3 últimos
js/charts.js      Sección Análisis · js/disciplina.js  Dashboard de Disciplina
js/apex.js        Apex Tracker · js/experimentos.js  Laboratorio
js/estrategia.js  El plan de Chaumer y la etapa anterior, de solo lectura · js/fechas.js  Fechas Especiales
js/chaumer.js     Comparador Chaumer vs yo (pestañas Diferencias y Registrar)
js/backtesting.js Bitácora de backtesting: registrar, corregir, borrar (bt_*)
js/account-filter.js  Filtro de cuentas compartido (nombre COMPLETO)
js/table.js       Trades · js/data.js  Datos (catálogos) · js/gallery.js  Imágenes
css/styles.css    Dark mode + responsive
NinjaTrader/      SupabaseAutoExport (trades) · SupabaseDailyLevels (niveles) · ChecklistChaumer ·
                  RR (Risk Reward en PUNTOS) · CadenaDiaria (AddOn: exporta el día y lanza el puente) ·
                  MarcacionChaumer (el zigzag blanco del motor, en tiempo real)
scripts/cadena/   El puente de la cadena diaria: motor → gráfico → ficha en Supabase → portal;
                  medir.py: la operación de Kris medida con el motor (D-034)
scripts/plan/     El plan de Chaumer → reglas.json, catalogo_reglas y plan_documentos
scripts/herramientas/  medir-tokens · respaldo.ps1 (a diario, 11:00, a OneDrive: tarea de Windows)
TelegramBot/      Bot (Cloudflare Worker) · workers/proxy-ia/  copia del Worker proxy IA
```

## La carpeta `chaumer/`

El plan de trading de Alfredo Chaumer, su **portal** y las **Sesiones** del motor, traídos el 24 sep
(`docs/disenos/2026-09-24-unificacion-chaumer.md`). **Tiene sus propias reglas** —`chaumer/CLAUDE.md` y `chaumer/04_Web/CLAUDE.md`—,
que se cargan al abrir sus archivos. Desde fuera, lo que no puede fallar:

- **`chaumer/01_Plan/` se cambia solo con el sí de Kris, cambio a cambio**, en su commit `plan: …` y
  sincronizado (`sincronizar.mjs`, huellas, `npm run verificar`). Lo que se vea mal, se le dice.
- **El portal es otra web** (Astro, Cloudflare Pages): el "vanilla" no le aplica. Se publica solo, con
  sus propios secretos. **Alfredo ve el portal y nada más**; el repositorio, en cambio, es público.
- **En `chaumer/` no se crean documentos nuevos** (D-030): cada cosa a su sitio del Journal.

## Estado

Todas las secciones funcionando. **Qué está en marcha y qué falta: `tasks/current.md`.**

## Dónde está lo demás

| Busco | Está en |
|---|---|
| En qué estamos y qué falta | `tasks/current.md` · `tasks/backlog.md` |
| **Por qué** se decidió algo así | `docs/decisiones.md` |
| Cómo se calcula la disciplina, con ejemplo real | `docs/Disciplina.md` |
| La metodología Chaumer (el plan vigente) | `chaumer/01_Plan/` — `docs/metodologia-chaumer.md` es el rulebook de la etapa 1 |
| Qué pasó y cuándo | `docs/historial-proyecto.md` |
| Diseños aprobados | `docs/disenos/` |
| Estado de las migraciones | `docs/migrations/INDICE.md` |
| Documentación del sistema viejo (no vigente) | `docs/archivo/` |

<!-- Las rutas van entre backticks a propósito: asi son texto literal. Sin backticks,
     una ruta precedida de arroba seria un import, y ese archivo se cargaria entero
     en cada sesion. Ver docs/disenos/2026-08-16-reestructuracion.md seccion 13.1. -->
