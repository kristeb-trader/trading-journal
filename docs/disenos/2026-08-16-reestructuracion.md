# Diseño — Reestructuración documental del Trading Journal

| | |
|---|---|
| **Versión** | v3 |
| **Fecha** | 2026-08-16 |
| **Estado** | ✅ **IMPLEMENTADO** (2026-08-16) — las 6 fases cerradas y verificadas |
| **Origen** | `docs/prompt-reestructuracion.md` + diagnóstico Fase 2 |
| **Cambios v2** | Separación en 4 capas: nace `tasks/` y `docs/decisiones.md`; los pendientes salen del `CLAUDE.md`. Justificación en §13 |
| **Alcance** | Documentación, memoria, skills, configuración. **No cambia el comportamiento de la app.** |

> **Cómo se usa este documento.** Es la fuente de verdad de la implementación. Si algo
> se implementa distinto a lo que dice aquí, o se corrige aquí primero, o está mal
> implementado. Cada iteración es este documento completo actualizado (v2, v3…), nunca
> un parche suelto.

---

## 0. Decisiones ya aprobadas (2026-08-16)

| # | Decisión | Consecuencia |
|---|---|---|
| 1 | **Desbloquear `.claude/` de `.gitignore`** | La configuración del proyecto se versiona; solo `settings.local.json` queda fuera |
| 2 | **Archivar los manuales, borrar los specs muertos** | Lista completa en §5 |
| 3 | **`CLAUDE.md` es la fuente única; la memoria apunta, no repite** | La memoria automática deja de describir el proyecto |
| 4 | **Fase 6 (tokens CSS) SÍ se hace**, al final y como fase separada | Con preview abierto y revisión de las 11 secciones antes de commitear |
| 5 | **NO se crean `docs/arquitectura.md` ni `docs/database.md`** | El mapa del código vive en `CLAUDE.md`; el esquema se consulta con `list_tables` (§13.4) |

Decisiones previas que este diseño respeta y no reabre:

- Los skills son **genéricos y de usuario** (`~/.claude/skills/`). No se duplican por proyecto.
- Las 6 reglas de feb–may (`rei_zona`, `chk_contexto`, `chk_no_mover`, `rr_1a1`,
  `stop_max_puntos`, `target_sin_zonas`) se quedan como están. Cerrado el 24 jul.
- El criterio de disciplina, el P&L neto, la zona horaria NT8 y las invariantes del
  Coach **no cambian**. Cambia dónde están escritas, no lo que dicen.
- La reestructuración de `js/`, `index.html` y `styles.css` **no entra**. Solo entra la
  declaración de tokens CSS, y solo si se aprueba aparte (§11, Fase 6).

---

## 1. El contrato skill ↔ proyecto

### 1.1 El problema que resuelve

Un skill genérico que no lee nada del proyecto acaba diciendo "documenta bien" y "usa
tokens coherentes". Inútil. El contrato es el mínimo que un proyecto debe declarar, con
nombres estables, para que un skill genérico pueda ser concreto sobre él.

### 1.2 Las cinco secciones

Son **cinco encabezados de nivel 2 en el `CLAUDE.md`**, con este texto exacto. Los
skills los localizan por el nombre del encabezado.

| Sección | Responde a | La lee |
|---|---|---|
| `## Invariantes` | ¿Qué no se toca sin permiso, y dónde está el detalle? | `flujo-desarrollo`, `base-de-datos` |
| `## Verificación` | ¿Qué significa "probado" en este stack? | `flujo-desarrollo` |
| `## Diseño` | ¿Dónde se guardan los diseños aprobados? | `flujo-desarrollo`, `lenguaje-visual` |
| `## Datos` | ¿Qué BD, dónde van las migraciones, quién las aplica? | `base-de-datos` |
| `## Lenguaje visual` | ¿Dónde están los tokens y qué reglas los gobiernan? | `lenguaje-visual`, `dashboards-informes` |

**Por qué van en `CLAUDE.md` y no en un archivo aparte:** el `CLAUDE.md` ya se carga en
cada sesión. Un archivo aparte o se carga también (duplica el coste) o hay que abrirlo
(un viaje extra cada vez). Además KrisKapital ya tiene cuatro de las cinco escritas con
otros nombres — migrarlo es renombrar encabezados, no redactar.

### 1.3 Por qué cinco y no diez

Cada sección existe porque **al menos un skill se vuelve vago sin ella**. Ninguna se
añadió "por completitud". Si en la implementación aparece una sexta, la lectura correcta
es que un skill se está pasando de listo, no que el contrato deba crecer.

`## Invariantes` es un **índice de una línea por invariante**, no el texto completo. El
detalle vive en `.claude/rules/` (carga solo al abrir los archivos afectados) o en un
documento apuntado. Sin esta separación el contrato haría el `CLAUDE.md` más grande, que
es justo lo contrario de lo que busca.

### 1.4 Degradación cuando el proyecto no cumple

Ningún skill falla ni se detiene si falta una sección. Cada uno tiene un comportamiento
por defecto y **lo dice en voz alta una vez**, sin repetirlo el resto de la sesión.

| Falta | El skill hace |
|---|---|
| `## Invariantes` | Trata todo cambio de datos como potencialmente destructivo: enseña el SQL y pide OK antes de aplicar |
| `## Verificación` | Cae al mínimo: comprobar sintaxis + arrancar la app. Y avisa de que el mínimo es eso |
| `## Diseño` | Usa `docs/disenos/` y lo declara |
| `## Datos` | Pregunta una vez cuál es el proyecto de Supabase y ofrece escribir la sección |
| `## Lenguaje visual` | Busca tokens en el CSS/tema del proyecto; si no hay sistema, **propone uno y pide aprobación** — nunca improvisa colores |

### 1.5 El esqueleto que se copia a un proyecto nuevo

Vive en `~/.claude/skills/documentacion/references/contrato.md`. Contenido:

```markdown
# <Proyecto> — <una línea de qué es>

## Invariantes
<!-- Una línea por invariante + dónde está el detalle. Si no hay, escribir "Ninguna declarada". -->
- **<Nombre>** — <la regla en una frase>. Detalle: `<ruta>`.

## Verificación
<!-- Qué significa "probado" aquí. Comandos concretos, en orden. -->
1. `<comando de sintaxis/build>`
2. `<cómo se levanta y se mira la app>`
3. `<comprobación contra datos reales, si aplica>`

## Diseño
Los diseños aprobados se guardan en `docs/disenos/`, un archivo por diseño,
`YYYY-MM-DD-tema.md`, con versión y estado en la cabecera.

## Datos
- **Motor:** <Supabase / otro> · **Proyecto:** `<id>`
- **Migraciones:** `<carpeta>` · **Las aplica:** <Claude vía MCP / el usuario>
- <Lo que el esquema no dice y hay que saber antes de tocarlo.>

## Lenguaje visual
- **Tokens:** `<archivo>` (`<selector>`)
- <Reglas que gobiernan su uso.>
```

---

## 2. Árbol de archivos: antes → después

### 2.1 Raíz del repo

| Antes | Después | Motivo |
|---|---|---|
| `CLAUDE.md` (259 líneas) | `CLAUDE.md` (~135 líneas) | §3 |
| `COACH_IA_SPEC.md` (728 l.) | **borrado** | Del 27 may; describe un Coach de 1 llamada que ya no existe |
| `supabase_coach_ia.sql` (19 KB) | **borrado** | Esquema del Coach viejo; la BD real no se parece |
| `README.md` (2 líneas) | `README.md` (~25 líneas) | Punto de entrada real |
| `.gitignore` | `.gitignore` | Sale `.claude/`; `*.local.json` ya cubre lo personal |
| — | `.claude/settings.json` | Permisos versionados (§9) |
| — | `.claude/rules/` (4 archivos) | Invariantes que cargan bajo demanda (§4) |
| — | `tasks/` (2 archivos) | Los pendientes salen del `CLAUDE.md` (§13) |

Sin cambios: `index.html`, `js/`, `css/`, `icons/`, `NinjaTrader/`, `TelegramBot/`,
`.github/`, `manifest.json`, `sw.js`, `favicon.svg`, `create-icons.html`, `Otros/`.

### 2.2 `docs/`

```
docs/
├── historial-proyecto.md        ← se queda. Cabecera podada + checkpoints renombrados (§7)
├── Disciplina.md                ← se queda INTACTO
├── decisiones.md                ← NUEVO. El porqué de lo decidido (§13.3)
├── metodologia-chaumer.md       ← NUEVO (viene de memory/rulebook-modelo.md)
├── disenos/                     ← NUEVO
│   ├── 2026-08-16-reestructuracion.md    ← este documento
│   └── prompt-reestructuracion.md        ← movido desde docs/ (es el encargo de origen)
├── migrations/
│   ├── INDICE.md                ← NUEVO (§6)
│   └── *.sql                    ← los 65, sin tocar ni renombrar
└── archivo/                     ← NUEVO
    ├── LEEME.md                 ← el aviso de que nada de aquí es vigente
    ├── manual-tecnico.md
    ├── manual-usuario.md
    ├── arquitectura-funcional.md
    ├── arquitectura-tecnica.md
    ├── plan-disciplina-fases.md
    ├── plan-seguridad-rls.md
    ├── plan-unificacion-reglas.md
    └── plan-rediseno-checklist-disciplina.md

tasks/                           ← NUEVO
├── current.md                   ← en lo que se está y lo siguiente
└── backlog.md                   ← ideas sin fecha
```

**No se crea `tasks/completed.md`:** eso ya es `docs/historial-proyecto.md`, con 1.938
líneas. Un tercer archivo solo añadiría un sitio más donde buscar lo mismo.

**Borrados de `docs/`** (4 archivos, 1,25 MB):

| Archivo | Motivo |
|---|---|
| `architecture-diagram.html` (28 KB) | Diagrama de mayo del modelo de 3 secciones |
| `user-journey.html` (33 KB) | Ídem |
| `Funcional Arquitecture.png` (929 KB) | Ídem, y no es editable |
| `Technical Arquitecture.png` (267 KB) | Ídem |

**Archivados, no borrados** (3.627 líneas): los 2 manuales y los 2 documentos de
arquitectura describen el modelo viejo de tres secciones, pero tienen detalle histórico
recuperable. Los 4 planes están ejecutados y cerrados; se guardan porque `Disciplina.md`
cita a `plan-rediseno-checklist-disciplina.md` como el porqué del rediseño — esa
referencia se mantiene apuntando a `docs/archivo/`.

`docs/archivo/LEEME.md`:

```markdown
# Archivo — documentación de sistemas anteriores

⚠️ **Nada de esta carpeta es vigente.** Describe el Trading Journal anterior a
agosto de 2026, cuando Sesión, Coach IA e Historial eran tres secciones separadas.

Se conserva por valor histórico. **No usarla como referencia para implementar.**
Para el estado real: `CLAUDE.md` (raíz) y `docs/historial-proyecto.md`.
```

### 2.3 Memoria automática (`~/.claude/projects/E--Proyectos-Trading-Journal/memory/`)

**Regla nueva:** la memoria automática guarda lo que **no está en el repo** — quién es
Kris y cómo trabaja. Todo lo que describe el proyecto se va al repo, porque el repo
cambia en el mismo commit que el código y la memoria no.

| Archivo (11 hoy) | Destino | Motivo |
|---|---|---|
| `MEMORY.md` | Reescrito | Índice de lo que quede |
| `user-profile.md` | **Se queda**, corregido | Quita el stop de 60 pts (son 80) y la metodología (se va al repo) |
| `project-overview.md` | **Borrado** | Duplica `CLAUDE.md` y contradice en modelo IA y RLS |
| `db-schema.md` | **Borrado** | Duplica `CLAUDE.md` y documenta 3 tablas que ya no existen y 2 triggers eliminados |
| `rulebook-modelo.md` | → `docs/metodologia-chaumer.md` | Conocimiento de dominio: debe versionarse con el código que lo implementa |
| `zona-horaria-nt8.md` | → `.claude/rules/ninjatrader.md` | Invariante del proyecto |
| `niveles-captura-pipeline.md` | → `.claude/rules/ninjatrader.md` | Invariante del proyecto |
| `coach-contexto-futuro-continuo.md` | → `.claude/rules/coach.md` | Invariante del proyecto |
| `cuenta-principal.md` | → `CLAUDE.md` §Datos (2 líneas) | El resto ya está en el historial |
| `deploy-bot.md` | → `CLAUDE.md` §Verificación (2 líneas) | Es una línea: se despliega solo al hacer push |
| `migraciones-via-mcp.md` | → skill `base-de-datos` | Es proceso portable, vale en los tres repos |

**Queda:** `MEMORY.md` + `user-profile.md`. De 28 KB a ~2 KB.

> **Por qué borrar `db-schema.md` en vez de actualizarlo.** El esquema real está a una
> llamada de `list_tables` del MCP, que nunca miente. Un documento que lo copia solo
> puede desincronizarse — y ya lo hizo: da por vivas `fomc_dates`, `apex_registros` y
> `estrategia_chaumer`, que no existen. Lo que sí se documenta es **lo que el esquema no
> dice** (por qué una columna existe, qué invariante la gobierna), y eso va a
> `CLAUDE.md` §Datos.

### 2.4 Skills (`~/.claude/skills/`)

| Antes | Después |
|---|---|
| `flujo-desarrollo/SKILL.md` (95 l., contaminado) | **Reescrito** — genérico, sin nombres de proyecto |
| — | `lenguaje-visual/` **nuevo** |
| — | `base-de-datos/` **nuevo** |
| — | `documentacion/` **nuevo** (+ `references/contrato.md`) |
| `dashboards-informes/` | **Se queda**. Un único añadido: una línea que delega los tokens en `lenguaje-visual` |

Sin tocar: `cloudflare`, `agents-sdk`, `durable-objects`, `sandbox-sdk`, `web-perf`,
`workers-best-practices`, `wrangler`, `cloudflare-email-service`.

---

## 3. El `CLAUDE.md` nuevo, completo

**Tamaño objetivo: ~135 líneas** (hoy 259). El estándar oficial pide menos de 200.

<details open>
<summary><b>Contenido propuesto — listo para leer</b></summary>

````markdown
# Trading Journal NQ Futures

Dashboard personal de operativa diaria en NQ/MNQ Futures (1 min), Metodología Chaumer.
100% serverless, ~$0.40/mes. Frontend vanilla, sin frameworks — y así se queda.

## Invariantes

Lo que no se toca sin aprobación explícita. Una línea cada una; el detalle se carga solo
cuando abres el archivo afectado.

- **Disciplina** — el criterio vive SOLO en `js/db.js`. Estuvo duplicado en 4 sitios y se
  desincronizó. Detalle: `.claude/rules/disciplina.md` · paso a paso: `docs/Disciplina.md`.
- **P&L** — `trades.profit` es **NETO** (comisión round-trip descontada);
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
- **Cerrado y no se reabre (24 jul)** — las 6 reglas con filas de relleno en feb–may
  (`rei_zona`, `chk_contexto`, `chk_no_mover`, `rr_1a1`, `stop_max_puntos`,
  `target_sin_zonas`) se quedan como están. Limpiarlas bajaría la disciplina global de
  81,5% a 75,1% y rompería la comparabilidad. La disciplina de feb–may está inflada **por
  diseño aceptado**.

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
| `catalogo_reglas` | Rulebook canónico. `bloquea_go`, `aplica_si` (siempre/dia_fomc/hay_noticia) y `evidencia` (auto/declarada) son los 3 ejes que deciden si una regla se evalúa |
| `diagnostico_errores` | `regla_codigo` = la regla que ese error contradice → la disciplina la cuenta incumplida **aunque la casilla esté marcada**. NULL = psicológico, no toca el checklist |
| `sesion_noticias` | UNIQUE (fecha, hora): una noticia por hora. El CPI publica 4 cifras a las 7:30 pero es **un** evento con **una** ventana |
| `objetivos` | Fila única. `cuenta_principal` es la cuenta que alimenta P&L/Análisis/Coach; se elige en Datos y la lee el indicador NT8 al arrancar. `limite_perdida_dia` está **obsoleto** (el riesgo se mide en puntos) |
| `sesiones` | La columna `noticias` (textarea) se retiró de la UI el 16 ago; su contenido se migró a `sesion_noticias`. **La columna sigue existiendo** |

## Lenguaje visual

- **Tokens:** `css/styles.css`, bloque `:root`. Fondo `#1a1a18`, accent `#1D9E75`,
  stop/error `#E24B4A`, warning `#BA7517`. Cards `radius 10px`, transiciones 150ms.
- Iconos: Tabler Icons (CDN). Gráficas: Chart.js (CDN).
- ⚠️ **Deuda conocida:** hay 19 tokens declarados pero ~140 colores escritos a mano fuera
  del `:root`, y dos lenguajes visuales conviviendo — el nuevo (16 ago) solo está en la
  pestaña Diario. Al tocar UI: usar tokens, no añadir hex nuevos.

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
                  Modal.openDay = vista del día a pantalla completa
js/db.js          Toda query a Supabase + cálculo canónico de disciplina
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

Todas las secciones funcionando: Disciplina · Análisis · Calendario+Métricas · Apex ·
Experimentos · Trades · Sesión Operativa · Imágenes · Estrategia · Datos · Fechas
Especiales (ese es el orden del menú).

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

> Las rutas van entre backticks **a propósito**: así son texto literal. Sin backticks,
> `@docs/...` sería un import y ese archivo se cargaría entero en cada sesión.
````

</details>

### 3.1 Qué se sacó y a dónde fue

| Del `CLAUDE.md` viejo | Líneas | A dónde |
|---|---|---|
| 4 bloques ✅ "Cerrado" + "BD limpia" + "Efecto lateral asumido" | ~42 | `docs/historial-proyecto.md` (ya están ahí; se borran del CLAUDE.md) |
| 7 reglas de oro de la disciplina, completas | ~28 | `.claude/rules/disciplina.md` |
| Invariantes del Coach, completas | ~19 | `.claude/rules/coach.md` |
| Invariantes de Sesión Operativa, completas | ~17 | `.claude/rules/sesion.md` |
| Zona horaria, completa | ~5 | `.claude/rules/ninjatrader.md` |
| Tabla de tablas con descripciones largas | ~18 | Comprimida a "lo que el esquema no dice" |
| "Flujo de trabajo (obligatorio)" | 6 | Skill `flujo-desarrollo` (era duplicado) |
| "Pendientes abiertos" (7 viñetas) | ~12 | `tasks/current.md` y `tasks/backlog.md` (§13.2) |

**Lo que se gana:** ~110 líneas salen del arranque de cada sesión. Las invariantes
vuelven **solo cuando abres el archivo al que afectan**; los pendientes, cuando preguntas
por ellos. Nada se pierde: cada cosa sigue presente cuando importa.

**Tamaño real tras implementar (Fase 2): 149 líneas / 8.457 bytes** — desde 259 líneas /
20.277 bytes. Estimé ~123; quedó en 149 porque la tabla "lo que el esquema no dice"
conservó más detalle del previsto. Sigue muy por debajo del límite de 200 del estándar.

---

## 4. `.claude/rules/` — invariantes bajo demanda

Mecanismo oficial de Claude Code: un `.md` con `paths:` en el frontmatter se carga
**solo cuando se lee un archivo que coincide**. Es la pieza que baja el coste sin perder
las reglas.

| Archivo | `paths` | Contenido |
|---|---|---|
| `disciplina.md` | `js/db.js`, `js/metrics.js`, `js/charts.js`, `js/calendar.js`, `js/disciplina.js`, `js/app.js`, `js/coach.js` | Las 7 reglas de oro, `discContexto()`, MAE en puntos, $ por contrato |
| `coach.md` | `js/coach.js`, `TelegramBot/worker.js` | Prompt caching, gráfica no persistida, corte temporal `antesDe`, `saveErroresIA` borra antes de insertar, el Coach no escribe emoción ni confianza, futuro continuo / PDR |
| `sesion.md` | `js/form.js`, `js/app.js`, `index.html` | Fieldset en lectura, alias de `Nav`, no filtrar por cuenta principal, campos vacíos en lectura, ids del Coach |
| `ninjatrader.md` | `NinjaTrader/**`, `js/coach.js`, `js/db.js` | Zona horaria Colombia vs ET, routing de cuentas, pipeline de niveles, `<Use instrument settings>`, recompilar tras editar |

> **Por qué es seguro.** Un `Edit` obliga a un `Read` previo, así que la regla siempre
> llega antes de la modificación. Y `## Invariantes` del `CLAUDE.md` mantiene la línea
> índice, para que la regla se conozca antes incluso de abrir el archivo.

---

## 5. Lista completa de borrados (para tu OK final)

**7 archivos, ~1,3 MB.** Nada de esto se referencia desde código.

| Archivo | Peso | Motivo |
|---|---|---|
| `COACH_IA_SPEC.md` | 27 KB | 27 may — Coach de 1 llamada, hoy son 3 etapas |
| `supabase_coach_ia.sql` | 19 KB | Esquema del Coach viejo |
| `docs/architecture-diagram.html` | 28 KB | Modelo de 3 secciones |
| `docs/user-journey.html` | 33 KB | Modelo de 3 secciones |
| `docs/Funcional Arquitecture.png` | 929 KB | Modelo de 3 secciones, no editable |
| `docs/Technical Arquitecture.png` | 267 KB | Ídem |
| `memory/project-overview.md` + `memory/db-schema.md` | 11 KB | Contradicen la realidad (§2.3) |

Todo queda en el historial de git y es recuperable con `git show`.

---

## 6. Convención de migraciones

**El nombre de archivo no cambia** — `YYYY-MM-DD-descripcion.sql`. Renombrar 65 archivos
es ruido sin beneficio.

Lo que cambia:

1. **Toda migración se aplica con `apply_migration`** (no con `execute_sql`), usando como
   `name` el nombre del archivo sin extensión. Así el registro de Supabase y
   `docs/migrations/` coinciden 1:1 desde hoy.
2. **`docs/migrations/INDICE.md`** — una tabla, una fila por archivo:

   | Archivo | Aplicada | Cómo | Qué hace |
   |---|---|---|---|
   | `2026-08-16-checklist-sin-materializar-en-true.sql` | ✅ 2026-08-16 | MCP | Quita los triggers de materialización |
   | `2026-06-01-setup-reglas.sql` | ✅ antes del registro | manual | … |

3. **Las 59 históricas** se marcan "aplicada antes del registro (jun–ago 2026)". **No se
   reaplican.** Verificado: Supabase tiene 6 migraciones registradas; las demás se
   corrieron a mano en el SQL Editor y no dejaron rastro.
4. **Si toca datos existentes**: respaldo previo en una tabla `_bak_<fecha>_<qué>`.

---

## 7. Convención de checkpoints

**Formato:** `## Checkpoint YYYY-MM-DD — <título>`

La fecha ISO ordena sola y no puede chocar. Elimina el problema de raíz: hoy hay dos
secciones tituladas `Checkpoint Ago 2026 (3)` (`historial-proyecto.md:1603` y `:1853`).

| Línea | Ahora | Pasa a ser |
|---|---|---|
| 1350 | `Checkpoint Ago 2026 (1) — Calendario…` | `Checkpoint 2026-08-03 — Calendario: fechas futuras + la verdad de la disciplina` |
| 1456 | `Checkpoint Ago 2026 (2) — Rediseño…` | `Checkpoint 2026-08-03b — Rediseño del checklist y de la disciplina` |
| 1603 | `Checkpoint Ago 2026 (3) — Coach IA…` | `Checkpoint 2026-08-11 — Coach IA: fuga temporal del historial` |
| 1853 | `Checkpoint Ago 2026 (3) — Sesión Operativa…` | `Checkpoint 2026-08-16 — Sesión Operativa: tres pantallas en una` |

Los checkpoints de junio y julio se renombran igual (misma operación, un `sed`).

**La cabecera** del historial (un párrafo de ~1.800 caracteres, ilegible) pasa a tabla:

```markdown
**Última actualización:** 2026-08-16

| Fecha | Checkpoint |
|---|---|
| 2026-08-16 | Sesión Operativa: tres pantallas en una |
| 2026-08-11 | Coach IA: fuga temporal del historial |
| 2026-08-03b | Rediseño del checklist y de la disciplina |
| 2026-08-03 | Calendario: fechas futuras + la verdad de la disciplina |
| 2026-07-24 | Filtro de cuentas multi-selección |

Anteriores: ver índice al final.
```

---

## 8. Los cuatro skills

Todos en `~/.claude/skills/`, genéricos, sin una sola ruta ni nombre de este repo.

### 8.1 `flujo-desarrollo` — reescrito

| | |
|---|---|
| **name** | `flujo-desarrollo` |
| **Ubicación** | `~/.claude/skills/flujo-desarrollo/SKILL.md` |
| **description** | `Ciclo obligatorio para cualquier cambio no trivial en los proyectos de Kris: análisis profundo del código real → diagnóstico en lenguaje claro y PARAR → diseño completo persistido en archivo y PARAR → implementación fiel por fases, verificada de verdad → commit y push. Usar SIEMPRE que se vaya a implementar una feature, corregir un bug, refactorizar o cambiar el comportamiento de cualquier app. También cuando se pida "arregla esto", "añade aquello" o "por qué falla X". Comunicación en español, conventional commits, nunca "debería funcionar".` |
| **Se dispara** | Automático, ante cualquier petición de cambio de código |
| **Lee del proyecto** | `## Verificación` (qué es "probado") · `## Diseño` (dónde se persisten) · `## Invariantes` (qué no tocar) |
| **Si falta** | Verificación → mínimo sintaxis+arrancar, y lo dice. Diseño → `docs/disenos/`. Invariantes → trata los cambios de datos como destructivos |

**Por qué conserva el nombre y no se llama `flujo-trabajo`:** `flujo-desarrollo` ya está
citado por nombre en `KrisKapital/CLAUDE.md:100`. Un nombre nuevo dejaría esa referencia
colgando y, sobre todo, dejaría **dos skills de proceso compitiendo** — que es
exactamente lo que pediste evitar. Se reescribe en su sitio: cero huérfanos, cero
solapamiento.

**Qué se le quita:** el §9 con los nombres de tus proyectos, el §4 que dice que tú corres
las migraciones (falso desde el 16 jul), y la contradicción interna entre "esperar
aprobación" (§1) y "no pedir confirmación a cada paso" (Preferencias). Se resuelve así:

> **Se para dos veces, no en cada paso.** Parada 1: después del diagnóstico. Parada 2:
> después del diseño. Dentro de un diseño ya aprobado se avanza sin preguntar, decidiendo
> con criterio técnico y reportando qué se decidió y por qué. `AskUserQuestion` se reserva
> para lo que solo Kris sabe y para lo irreversible.

**Contenido:**
1. El ciclo de 4 etapas, con las dos paradas explícitas.
2. Análisis: leer el código real, verificar en el repo, distinguir verificado de supuesto,
   citar ruta y línea. Prohibido opinar sobre código no leído.
3. Diagnóstico: para el usuario, no técnico, priorizado por dolor, tablas cortas. **Parar.**
4. Diseño: completo, persistido, versionado. Si pide cambios → **el diseño íntegro
   actualizado**, nunca un parche ni un "además de lo anterior". **Parar.**
5. Implementación: por fases, fiel al diseño, cada fase verificada y reportada antes de
   seguir. Al final, tabla de qué cambió / dónde / qué se verificó / qué queda.
6. Git: commit + push tras cada fase, conventional commits en español, cuerpo con el porqué.
7. Comunicación: español, directo, sin relleno; decir lo que quedó pendiente.

### 8.2 `lenguaje-visual` — nuevo

| | |
|---|---|
| **name** | `lenguaje-visual` |
| **description** | `Mantener un lenguaje visual coherente al crear o modificar cualquier pantalla, componente o estilo de las apps de Kris. Úsala antes de escribir CSS, de crear una pantalla nueva, de añadir un color o de rediseñar algo existente — y cuando convivan dos estéticas y haya que cerrar la deuda sin rehacer la app. Cubre tokens de diseño, estados (vacío, carga, error), densidad, responsive y accesibilidad. La paleta concreta NO está aquí: se lee del proyecto.` |
| **Se dispara** | Automático al tocar CSS o crear pantallas; también con "se ve feo", "modernízalo" |
| **Lee del proyecto** | `## Lenguaje visual` → archivo de tokens + selector + reglas de uso |
| **Si falta** | Busca el sistema en el CSS/tema. Si no hay ninguno, **propone un set de tokens y pide aprobación**. Nunca inventa colores sueltos |

**Contenido:**
1. **Antes de crear una pantalla:** buscar una pantalla que ya resuelva un problema
   parecido y copiar su estructura. Un componente nuevo es la última opción, no la primera.
2. **Cómo detectar que estás inventando un estilo:** si escribes un hex, un radio o un
   espaciado que no sale de un token, estás creando un segundo lenguaje. Contar los
   literales de color del proyecto es la medida objetiva de la deuda.
3. **Estados obligatorios:** toda vista con datos necesita vacío, carga y error. Un vacío
   sin explicación se lee como un fallo.
4. **Densidad y jerarquía:** un dato principal por bloque; el contexto pegado y pequeño.
5. **Responsive y accesibilidad:** contraste mínimo, el color nunca solo (icono o texto),
   objetivos táctiles, `tabular-nums` en columnas numéricas.
6. **Cerrar la deuda de dos lenguajes sin rehacer la app:** inventariar y nombrar el
   lenguaje ganador; migrar por pantalla completa, nunca a medias (media pantalla migrada
   se ve peor que ninguna); prohibir literales nuevos desde hoy; el resto se convierte al
   tocar cada pantalla por otro motivo. Nunca una migración masiva de CSS en un commit.

**Delimitación con `dashboards-informes`** (que ya existe y ya es genérico):

| | `lenguaje-visual` | `dashboards-informes` |
|---|---|---|
| Cubre | El sistema: tokens, estados, densidad, deuda, cualquier pantalla | Un tipo de pantalla: informes, KPIs, gráficas |
| Relación | Es el de arriba: define de dónde salen los tokens | Los consume |

Único cambio en `dashboards-informes`: una línea en su tabla de archivos de apoyo →
*"Los tokens del proyecto los define `lenguaje-visual`; `references/tokens.md` es el set
de partida cuando el proyecto no tiene ninguno."* Sin esto, los dos skills proponen
paletas distintas.

### 8.3 `base-de-datos` — nuevo

| | |
|---|---|
| **name** | `base-de-datos` |
| **description** | `Trabajar con la base de datos (Supabase / PostgreSQL) en los proyectos de Kris: crear o modificar tablas y columnas, escribir y aplicar migraciones, políticas RLS y roles, backfills y correcciones de datos. Úsala SIEMPRE antes de tocar el esquema o los datos, y cuando se pida "añade una columna", "crea una tabla", "corrige estos registros" o "aplica esta migración". Las migraciones las aplica Claude vía el MCP de Supabase y se verifican después con un SELECT.` |
| **Se dispara** | Automático ante cualquier cambio de esquema o datos |
| **Lee del proyecto** | `## Datos` (proyecto, carpeta, quién aplica) · `## Invariantes` (**obligatorio antes de tocar nada**) |
| **Si falta `## Datos`** | Pregunta una vez el id del proyecto y ofrece escribir la sección |
| **Si falta `## Invariantes`** | Modo conservador: enseña el SQL y pide OK antes de aplicar |

**Contenido:**
1. **Antes de tocar: leer `## Invariantes` del proyecto.** Sin excepción. Un cambio de
   esquema que ignora una invariante de datos no da error, da números falsos.
2. **Consultar el esquema real** con `list_tables`, no un documento. Un doc de esquema se
   desincroniza; la BD no.
3. **Migraciones:** archivo en la carpeta del proyecto **y** `apply_migration` del MCP (no
   `execute_sql` — con él los cambios se revierten). El `name` del apply = el nombre del
   archivo. Kris no corre pasos manuales. ← *esto resuelve la contradicción del hallazgo #2*
4. **Verificación obligatoria posterior:** un `SELECT` que demuestre el cambio, y
   enseñar el resultado. Sin SELECT no está hecho.
5. **RLS y roles:** tabla nueva → RLS on + política para `authenticated` + grants a
   `service_role`. La clave pública nunca debe poder leer ni escribir.
6. **Antes de algo destructivo** (DROP, DELETE masivo, cambio de tipo): contar las filas
   afectadas y enseñar el número, respaldar en `_bak_<fecha>_<qué>`, y **pedir OK
   explícito**. Un `DELETE` sobre una tabla con FK puede borrar en cascada lo que no ves.
7. **Después:** actualizar `## Datos` solo si cambió algo que el esquema no dice.
8. Tras `ALTER TABLE` en Supabase: `NOTIFY pgrst, 'reload schema';`.

### 8.4 `documentacion` — nuevo

| | |
|---|---|
| **name** | `documentacion` |
| **description** | `Decidir dónde va cada cosa que se escribe en los proyectos de Kris y mantener la documentación sin duplicados ni contradicciones. Úsala cuando haya que documentar un cambio, cuando no esté claro si algo va al CLAUDE.md, a la memoria, al historial o a ningún sitio, al cerrar una fase o checkpoint, al arrancar un proyecto nuevo, y cuando dos documentos digan cosas distintas. Contiene el contrato de secciones que todo proyecto debe exponer.` |
| **Se dispara** | Automático al cerrar trabajo o ante dudas de dónde documentar |
| **Lee del proyecto** | Las 5 secciones del contrato, para saber si existen |
| **Si faltan** | Ofrece crearlas a partir de `references/contrato.md` |
| **Archivos** | `references/contrato.md` — el contrato + el esqueleto vacío |

**El criterio portable** (responde "¿dónde va esto?" sin listar rutas):

> **Permanencia × frecuencia.**
>
> | | Se consulta a menudo | Se consulta rara vez |
> |---|---|---|
> | **Sigue siendo verdad mañana** | `CLAUDE.md` — pero en una línea, con puntero al detalle | Documento apuntado desde `CLAUDE.md` |
> | **Deja de ser verdad al cambiar el código** | Regla con `paths:`, que carga al abrir ese código | **No se escribe** — el código ya lo dice |
> | **Ya pasó** | Historial / checkpoint | Historial / checkpoint |

**Contenido:**
1. El criterio de arriba, con ejemplos de las cuatro celdas.
2. **Qué NO se documenta:** lo que el código ya dice (firmas, estructura de carpetas,
   listas de dependencias), lo que la BD ya dice (esquema), y lo que solo importó durante
   una conversación.
3. **La memoria automática guarda al usuario, no al proyecto.** Todo lo que describe el
   proyecto va al repo, porque el repo cambia en el mismo commit que el código.
4. **Cuándo un doc se archiva en vez de actualizarse:** cuando describe un modelo que ya
   no existe. Actualizarlo es reescribirlo; archivarlo con un aviso arriba es honesto y
   cuesta un minuto.
5. **Checkpoints:** `## Checkpoint YYYY-MM-DD — título`. La fecha ISO ordena sola y no
   choca. Prohibidos los contadores tipo "(3)".
6. **Mantener vivo el contrato:** cuando un proyecto gana una invariante nueva, va a
   `## Invariantes` como una línea + el detalle donde corresponda. Cuando dos documentos
   se contradicen, **no se documentan los dos**: se verifica cuál es verdad contra el
   código o la BD, se corrige uno y se borra el otro.

---

## 9. Configuración: `settings.json` y `settings.local.json`

### 9.1 `.gitignore`

```diff
- .claude/
  *.local.json
  .DS_Store
  Thumbs.db
```

`*.local.json` (línea 2) ya excluye `settings.local.json`. Quitar `.claude/` permite
versionar `settings.json`, `rules/` y `launch.json` sin exponer nada personal.

### 9.2 `.claude/settings.json` (nuevo, versionado)

```json
{
  "permissions": {
    "allow": [
      "Bash(git *)",
      "PowerShell(git *)",
      "Bash(node --check *)",
      "Bash(node -e *)",
      "Bash(node --input-type=module -e *)",
      "Bash(npx --yes wrangler *)",
      "Bash(gh *)",
      "mcp__61b871b3-9b9d-46fd-98b7-0e2e420cafa7__*",
      "mcp__Claude_Browser__*",
      "mcp__visualize__*"
    ],
    "deny": [
      "Bash(git push --force*)",
      "Bash(git reset --hard*)",
      "Bash(rm -rf *)"
    ]
  }
}
```

**De 122 reglas a 11 + 3.** Lo que se gana:

- Las 5 líneas con la **clave anon de Supabase escrita dentro** (`settings.local.json`
  líneas 50-54) desaparecen del disco.
- `Bash(node --check *)` cubre de una vez las 11 reglas literales que hay hoy, una por
  archivo `.js`.
- El `deny` es lo que faltaba: patrones amplios **con** las tres operaciones destructivas
  bloqueadas. `Bash(git *)` sin `deny` incluye `push --force` y `reset --hard`.
- Al versionarse, el trabajo se reutiliza y no se vuelve a acumular basura.

### 9.3 `.claude/settings.local.json`

Queda **vacío** (`{}`) y sigue gitignorado. Es donde Claude Code escribirá las nuevas
aprobaciones puntuales, que se revisan de vez en cuando y se promueven a `settings.json`
si son recurrentes.

### 9.4 ¿Algún hook?

**No, todavía no.** Evalué tres candidatos y ninguno se sostiene:

| Candidato | Veredicto |
|---|---|
| Hook que corra `node --check` tras cada edición de `.js` | Tentador, pero `node --check` no entiende módulos ni el orden de carga de este proyecto; daría falsos positivos. El skill ya lo exige |
| Hook que impida commitear sin haber verificado | No hay forma fiable de saber desde un hook si se verificó |
| Hook de auto-commit | Contradice el ciclo (el commit va tras la verificación, no tras la edición) |

Un hook útil aparecerá cuando exista un comando de build o test real. Hoy no lo hay.

---

## 10. Prueba de genericidad: los skills contra otros proyectos

No es un ejercicio mental: miré los dos repos.

### 10.1 KrisKapital (`E:\Proyectos\KrisKapital`) — React + TS + Vite + Supabase

Su `CLAUDE.md` (178 líneas) **ya tiene cuatro de las cinco secciones**, con otros nombres:

| Contrato | Hoy en KrisKapital | Trabajo para cumplir |
|---|---|---|
| `## Verificación` | `## Verificar de verdad` (línea 108) — `npm run build`, harness contra BD real, mirar la app | **Renombrar** |
| `## Datos` | `## Migraciones` (127) — `supabase/migrations/`, MCP, `apply_migration` no `execute_sql` | **Renombrar y añadir el id del proyecto** |
| `## Lenguaje visual` | `## Temas` (75) — tokens en `src/index.css`, dos familias `--*` y `--an-*`, par claro/oscuro obligatorio | **Renombrar** |
| `## Invariantes` | Dispersas: "nunca `delete`+`insert` sobre `loan_details`", "probar escribe en producción", "no hay modo privacidad" | **Agrupar en una sección** |
| `## Diseño` | ❌ No existe | **Añadir 2 líneas** |

**Resultado:** los cuatro skills funcionan sobre KrisKapital con ~20 minutos de
renombrado. Y funcionan **de verdad**, no en abstracto: `flujo-desarrollo` leería
"verificado = `npm run build` + harness + mirar la app" en vez de "preview + consola";
`base-de-datos` leería `supabase/migrations/` y la invariante de `loan_details`;
`lenguaje-visual` leería `src/index.css` y la regla del par claro/oscuro. **Ninguno de
esos datos está en el skill.** Es exactamente lo que pediste.

Detalle que la prueba destapó: KrisKapital advierte que **probar escribe en producción**
(el 13 ago una prueba dejó un crédito fuera de los informes). El Trading Journal no tiene
esa restricción. Es la prueba de que `## Verificación` tenía que ser una sección del
proyecto y no una regla del skill.

### 10.2 Finanzas Personales — **no es un proyecto de código**

Su `CLAUDE.md` tiene 36 líneas y dice *"El proyecto vive en otra parte"*: es la
documentación de diseño congelada de lo que hoy es KrisKapital. No tiene `src/`, ni BD
propia, ni UI.

**Comportamiento esperado de los skills ahí:**

| Skill | Qué hace |
|---|---|
| `documentacion` | **Funciona con normalidad** — es un repo de documentos, su caso ideal |
| `flujo-desarrollo` | Funciona, degradado: sin `## Verificación`, cae al mínimo y lo dice |
| `base-de-datos` | **No se dispara** — su descripción exige un cambio de esquema o datos, y aquí no hay BD |
| `lenguaje-visual` | **No se dispara** — no hay CSS que tocar |

Esto es el resultado correcto, y es la prueba más dura: un skill genérico mal escrito se
dispararía igual y ofrecería tokens para un repo sin interfaz.

---

## 11. Plan de implementación

Seis fases. Cada una se verifica sola y termina en commit + push. Si una falla, las
anteriores siguen en pie.

| # | Fase | Qué se toca | Cómo se verifica |
|---|---|---|---|
| **1** | **Configuración** | `.gitignore`, `.claude/settings.json`, vaciar `settings.local.json` | `git check-ignore .claude/settings.json` no devuelve nada · `git status` lista el archivo nuevo · `settings.local.json` sigue ignorado |
| **2** | **`CLAUDE.md` + `.claude/rules/`** | `CLAUDE.md` reescrito, 4 archivos de reglas | `wc -l CLAUDE.md` < 200 · las 5 secciones del contrato existen con el nombre exacto · abrir `js/db.js` carga `disciplina.md` |
| **3** | **Memoria** | Borrar 2, mover 5 al repo, corregir `user-profile`, reescribir `MEMORY.md` | **Checklist de las 6 contradicciones**: modelo IA, RLS, tablas muertas, triggers, stop 80 pts, nº de tablas → cada una con una sola respuesta en todo el sistema |
| **4** | **`docs/` + `tasks/`** | Archivar 8, borrar 4, `INDICE.md`, `decisiones.md`, `tasks/`, renombrar checkpoints, podar cabecera, `README.md` | `ls docs/` y `ls tasks/` coinciden con §2.2 · `grep -c "Checkpoint Ago 2026 (3)"` = 0 · ningún enlace roto · los 7 pendientes del `CLAUDE.md` viejo están todos en `tasks/` |
| **5** | **Skills** | Reescribir `flujo-desarrollo`, crear 3, 1 línea en `dashboards-informes` | Los 4 salen en `/` · prueba de disparo: pedir un cambio trivial y confirmar que `flujo-desarrollo` entra |
| **6** | **Tokens CSS** ⚠️ | `css/styles.css` — solo **añadir** variables al `:root` y sustituir literales repetidos | Preview levantado, las 11 secciones se ven idénticas, consola sin errores |

> ⚠️ **La Fase 6 requiere tu OK aparte.** Es la única que toca código de la app. No
> cambia ni un comportamiento —solo mueve colores a variables— pero toca `styles.css`, y
> dijiste que el CSS no se toca en esta ronda. La propongo porque **sin tokens declarados
> el skill `lenguaje-visual` no tiene de dónde leer** en este repo: leería 19 variables y
> tendría 140 literales alrededor contradiciéndolas. Si prefieres, se queda fuera y el
> skill funciona en modo degradado (propone y pide aprobación) hasta que decidas.

**Orden y dependencias:** 1 habilita a 2 (sin desbloquear `.claude/` no se pueden
versionar las reglas). 2 y 3 se refuerzan (la memoria apunta al `CLAUDE.md` nuevo). 4 es
independiente. 5 depende de 2 (los skills leen el contrato, que la Fase 2 crea). 6 es
opcional y va al final.

---

## 12. Resumen del resultado

| Métrica | Antes | Después |
|---|---|---|
| `CLAUDE.md` | 259 líneas / 20.277 bytes / ~6.000 tokens | **149 líneas / 8.457 bytes / ~2.500 tokens** ✅ medido |
| Contexto fijo por sesión | ~7.500 tokens | ~4.250 tokens (**−43%**) ✅ medido |
| Archivos de memoria | 11 (28 KB), 6 contradicciones | 2 (~2 KB), 0 contradicciones |
| Documentación engañosa | 3.627 líneas mezcladas con la vigente | 0 en circulación (archivada con aviso) |
| Reglas de permisos | 122 literales, con una clave dentro | 11 patrones + 3 bloqueos |
| Skills genéricos | 1, contaminado y contradictorio | 4, limpios, con contrato |
| Diseños aprobados | En el chat | `docs/disenos/`, versionados |
| Migraciones con registro | 6 de 65 | 65 de 65 en el índice, 100% de las nuevas en Supabase |

**Lo que NO cambia:** el comportamiento de la app, el criterio de disciplina, el P&L neto,
la zona horaria, las invariantes del Coach, `upsertSesion`, y la decisión cerrada sobre
las 6 reglas de feb–may.

---

## 13. Contraste con el esquema de cuatro capas

Kris planteó (2026-08-16) un esquema de organización documental —`CLAUDE.md` / `README.md`
/ `docs/` / `tasks/`— y preguntó si este diseño lo cumple. Se cumplía en tres de las
cuatro capas. Esta sección registra el contraste y lo que cambió a raíz de él.

### 13.1 El mecanismo de `@import` NO carga bajo demanda

El esquema propuesto mantiene el `CLAUDE.md` pequeño listando `@docs/architecture.md`,
`@docs/business-rules.md`, etc., dando por hecho que Claude "sigue la referencia" cuando
la necesita. **Es falso**, y es el punto que más habría dañado el objetivo de tokens.

> *"Imported files are expanded and loaded into context at launch alongside the CLAUDE.md
> that references them."*
>
> *"Splitting into `@path` imports helps organization but doesn't reduce context, since
> imported files load at launch."*
>
> — [code.claude.com/docs/en/memory](https://code.claude.com/docs/en/memory)

Cinco `@import` de documentos largos darían un `CLAUDE.md` visualmente corto y un coste
por sesión **mayor** que el actual.

**Decisión: este diseño no usa ni un `@import`.** Dos mecanismos en su lugar:

| Necesidad | Mecanismo | ¿Carga siempre? |
|---|---|---|
| Invariante ligada a unos archivos concretos | `.claude/rules/` con `paths:` | **No** — solo al abrir esos archivos |
| Documento de consulta ocasional | Ruta entre backticks en la tabla "Dónde está lo demás" | **No** — se abre si hace falta |

⚠️ Los backticks no son cosmética: la doc especifica que el parser de imports **salta los
code spans**. `` `@docs/x.md` `` es texto; `@docs/x.md` es un import. Toda ruta del
`CLAUDE.md` va entre backticks.

(Dos erratas menores del texto de origen: dice cinco niveles de anidamiento de imports —
la doc dice **cuatro**— y enlaza a la locale china de un dominio que ya redirige.)

### 13.2 Lo que se acepta: los pendientes salen del `CLAUDE.md`

Tenían razón. `## Estado y pendientes` eran ~12 líneas que **cambian cada semana** y se
pagaban en cada sesión. Un archivo que se carga siempre debe contener lo que casi nunca
cambia; los pendientes son lo contrario.

```
tasks/
├── current.md    En marcha + lo siguiente
└── backlog.md    Ideas sin fecha
```

Los 7 pendientes de hoy se reparten: los cuatro con trabajo definido (lenguaje visual,
render de `roto`, catálogo de recomendaciones en el prompt, rendimiento del modal) a
`current.md`; los tres exploratorios (estadísticas de 3 corridas, "dejé de ganar",
tipificación de errores) a `backlog.md`. En el `CLAUDE.md` queda una línea que apunta.

**`completed.md` no se crea:** es `docs/historial-proyecto.md`, 1.938 líneas. Un tercer
sitio donde buscar lo mismo.

### 13.3 Lo que se acepta: `docs/decisiones.md`

El hueco real de la v1. Hoy el **porqué** de cada decisión está enterrado en la narrativa
del historial o inflando el `CLAUDE.md`. Formato ADR-lite: decisión · motivo ·
alternativas descartadas · fecha. Entradas iniciales:

| ADR | De dónde sale |
|---|---|
| Las 6 reglas de feb–may se quedan como están | `CLAUDE.md` viejo, bloque 🚫 (24 jul) |
| La disciplina se calcula solo en `js/db.js` | Estuvo duplicada en 4 sitios y se desincronizó |
| `profit` es NETO, `commission` es round-trip | Unificado jun 2026 |
| El riesgo se mide en puntos, no en dólares | MNQ $2 / NQ $20; `limite_perdida_dia` obsoleto |
| El checklist nace limpio (sin materializar en `true`) | El AddOn se auto-marcaba en la apertura |
| RLS activo + `service_role` para bot/Worker/NT8 | Blindaje jun 2026 |
| `cuenta_principal` configurable en vez de hardcodeada | Las cuentas Apex rotan al quemarse |
| Supabase como BD, vanilla JS sin framework | Serverless, ~$0.40/mes, GitHub Pages directo |
| **Skills genéricos de usuario, no duplicados por proyecto** | Esta reestructuración |

Es también donde `documentacion` manda las decisiones futuras, en vez de dejarlas
sueltas en el historial.

### 13.4 Lo que se rechaza, con evidencia del propio repo

**`docs/` de 10-15 archivos numerados** (`02-architecture.md`, `04-database.md`,
`05-api.md`, `06-integrations.md`, `08-security.md`…) es una plantilla para un proyecto de
equipo que arranca de cero. Este es un proyecto vanilla de un solo desarrollador — **y ya
probó ese patrón**:

| Archivo que ya existe | Líneas | Estado |
|---|---|---|
| `manual-tecnico.md` | 982 | Describe un sistema que no existe |
| `arquitectura-tecnica.md` | 631 | Ídem |
| `arquitectura-funcional.md` | 522 | Ídem |
| `manual-usuario.md` | 764 | Ídem |

Los cuatro se archivan en esta misma reestructuración. Crear `docs/arquitectura.md` y
`docs/database.md` sería reponer el pie donde ya se cayó. En su lugar:

- **Arquitectura** → la tabla "Mapa del código" del `CLAUDE.md` (15 líneas) + el código.
  Un mapa corto se actualiza; un manual de 600 líneas no.
- **Base de datos** → `list_tables` del MCP, que no puede desincronizarse, más "lo que el
  esquema no dice" en `## Datos`. `memory/db-schema.md` da por vivas 3 tablas muertas: la
  prueba de por qué copiar un esquema a un documento no funciona.

**`CLAUDE.md` anidados por subdirectorio** (su punto 9) resuelven monorepos con
`frontend/` y `backend/`. Aquí `js/` es una carpeta plana de 18 archivos. `.claude/rules/`
con `paths:` hace lo mismo con más precisión y sin duplicar encabezados.

### 13.5 Resultado del contraste

| Capa | Pregunta | Dónde queda |
|---|---|---|
| `CLAUDE.md` | ¿Cómo debe trabajar Claude? | Las 5 secciones del contrato + stack + mapa. **~123 líneas** |
| `README.md` | ¿Qué es y cómo se ejecuta? | Reescrito en Fase 4 |
| `docs/` | ¿Cómo funciona y **por qué**? | `Disciplina.md` · `decisiones.md` · `metodologia-chaumer.md` · `historial-proyecto.md` · `disenos/` |
| `tasks/` | ¿Qué falta? | `current.md` · `backlog.md` |

El esquema de cuatro capas **valida el contrato**: sus cinco secciones son justo "cómo
debe trabajar Claude", y lo que este diseño saca del `CLAUDE.md` (historia, changelog,
esquema de tablas, pendientes) es justo lo que ese esquema dice que no debe estar ahí.

---

## 14. Resultado real de la implementación (2026-08-16)

Las 6 fases cerradas el mismo día. Medido, no estimado.

| Fase | Commit | Verificación que pasó |
|---|---|---|
| 1 · Configuración | `cdee3cc` | `settings.json` versionable · `settings.local.json` sigue ignorado · `rules/` versionable · el archivo con la clave anon fuera del disco |
| 2 · `CLAUDE.md` + rules | `11647f5` | 149 líneas (<200) · las 5 secciones con nombre exacto · 0 rutas con arroba · los 11 paths de las reglas apuntan a archivos reales |
| 3 · Memoria | `023cc3e` | **Las 6 contradicciones, una por una** · 11 archivos → 2 |
| 4 · `docs/` + `tasks/` | `023cc3e` | 0 títulos de checkpoint duplicados · 14 en formato ISO · 0 enlaces rotos (se arregló 1 en `Disciplina.md`) |
| 5 · Skills | `c9e3275` | Los 4 cargan · ninguno pasa de 170 líneas (límite 500) · **0 menciones** a este proyecto · el repo pasa los 7 chequeos del contrato |
| 6 · Tokens CSS | `9b05791` | **0 diferencias** al resolver tokens en ambas versiones · llaves 1803/1803 · 0 variables sin declarar · los 4 tokens computan en navegador el mismo `rgb()` |

### Cifras finales

| Métrica | Antes | Después |
|---|---|---|
| `CLAUDE.md` | 259 líneas / 20.277 B | **166 líneas / 9.9 KB** (−51%) — 149 tras la Fase 2, +17 al documentar el sistema de tokens en la Fase 6 |
| Archivos de memoria | 11 (28 KB) | **2** (~2 KB) |
| Contradicciones vivas | 6 | **0** |
| Docs engañosos en circulación | 3.627 líneas | **0** (archivados con aviso de en qué mienten) |
| Reglas de permisos | 122 literales, 1 con clave dentro | **11 patrones + 3 bloqueos** |
| Skills genéricos | 1, contaminado y contradictorio | **4**, con contrato |
| Tokens CSS / literales sueltos | 19 / 140 | **26 / 45** |
| Migraciones con registro | 6 de 65 | 65 en el índice; 100% de las nuevas en Supabase |

### Desviaciones respecto al diseño

Tres, todas menores y ya reflejadas arriba:

1. **`CLAUDE.md` quedó en 166 líneas, no ~123.** 149 tras la Fase 2 (la tabla "lo que el
   esquema no dice" conservó más detalle del previsto) y +17 en la Fase 6, al documentar
   la estructura base/-txt/-dim que el skill `lenguaje-visual` necesita para ser concreto
   aquí. Sigue por debajo del límite de 200.
2. **Se corrigió una ruta en `docs/Disciplina.md`** (el plan que se archivó). Es un enlace,
   no el criterio — el criterio no se tocó.
3. **Quedaron 45 literales de color**, no 0. Son variantes casi-idénticas de los mismos
   colores; unificarlas cambiaría píxeles, y la Fase 6 se aprobó con la condición de que no
   cambiara nada visualmente. Se consolidan al migrar cada pantalla.

### Hallazgo lateral, no causado por esta reestructuración

El registro del **service worker falla** (`getRegistrations()` vuelve vacío). Detectado al
verificar la Fase 6 con el navegador. `sw.js` no se tocó. Anotado en `tasks/current.md` sin
diagnosticar: la consola **no está limpia**, y no se declara como tal.

---

## Registro de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| v1 | 2026-08-16 | Diseño inicial |
| v2 | 2026-08-16 | Contraste con el esquema de 4 capas (§13). Nace `tasks/` (current + backlog) y los pendientes salen del `CLAUDE.md`. Nace `docs/decisiones.md` (ADR-lite). Se descarta el uso de `@import` con la cita oficial. `CLAUDE.md` baja de ~135 a ~123 líneas. Se rechaza con evidencia el `docs/` de 10-15 archivos y los `CLAUDE.md` anidados |
| v3 | 2026-08-16 | **Aprobado.** Se cierran las dos decisiones abiertas: Fase 6 (tokens CSS) se hace al final como fase separada; no se crean `arquitectura.md` ni `database.md` |
| v4 | 2026-08-16 | **Implementado.** §14 con el resultado real medido, las verificaciones que pasó cada fase, las 3 desviaciones respecto al diseño y un hallazgo lateral (el service worker falla, ajeno a esta reestructuración) |
