# Decisiones del proyecto

> Por qué las cosas son como son. Cuando dentro de seis meses te preguntes "¿por qué
> hicimos esto así?", la respuesta está aquí y no hay que deducirla del código ni bucear
> en 1.900 líneas de historial.
>
> **Formato:** decisión · motivo · alternativas descartadas · fecha. Una entrada por
> decisión, la más reciente arriba. No se reescriben: si una decisión se revierte, se
> añade una entrada nueva que la sustituye y se marca la vieja como *Sustituida*.

---

## D-010 — El tema claro se aplaza; en Ajustes solo queda la fila, marcada "Pendiente"

**Decisión.** No se construye el tema claro. La fila **Tema** existe en Otros › Ajustes
pero es **inerte**: sin interruptor, sin `[data-theme]`, sin `localStorage`, y `styles.css`
no gana ni una regla de tema. Es un recordatorio visible, no una función a medias.

**Motivo.** Se midió el CSS antes de decidir, y el sistema de color no gobierna lo
suficiente como para soportar un segundo tema:

| Fuera del `:root` | Cuántos | Qué pasaría en claro |
|---|---|---|
| `rgba(255,255,255,…)` | **82** | Bordes, hovers y separadores blancos **sobre fondo blanco: invisibles** |
| Colores hex a mano | **44** | Pensados para fondo oscuro: chillones o lavados |
| Estilos incrustados en el HTML | **66** | No responden a tokens en absoluto |
| Colores de gráficas | 5 en `charts.js` + 4 en `disciplina.js` | Chart.js pintaría igual que hoy |

Calendario, Disciplina, Análisis y el Coach se verían a trozos. Y **media pantalla migrada
se ve peor que ninguna**: parece un error, no una transición.

**Alternativas descartadas.** *Poner el interruptor igualmente* — Kris lo pidió así al
principio y se implementó como fila inerte tras ver los números; un tema roto a trozos
habría parecido un bug, no un trabajo en curso. *No poner nada* — se pierde la señal de que
está pedido y pendiente.

**Para retomarlo:** primero consolidar esos 82 blancos y 44 hex en tokens, después migrar
**pantalla completa por pantalla completa**, y solo al final encender el interruptor. Orden
en `.claude/rules/estilos.md`; números vivos en `tasks/backlog.md`.

**Fecha.** 2026-08-16 · Detalle: `docs/disenos/2026-08-16-navegacion-6-botones.md` §7

---

## D-009 — Los skills son genéricos y de usuario, no duplicados por proyecto

**Decisión.** Los skills de proceso (`flujo-desarrollo`, `lenguaje-visual`,
`base-de-datos`, `documentacion`) viven en `~/.claude/skills/` y sirven en cualquier
proyecto. Cuando necesitan un dato del proyecto, lo leen del `CLAUDE.md` vía un contrato
de 5 secciones con nombre estable.

**Motivo.** Kris tiene tres proyectos. Cuatro skills × tres proyectos = doce archivos a
sincronizar, que es el mismo problema de verdad duplicada que la reestructuración vino a
eliminar. Y un dato del proyecto guardado en `~/.claude/` queda fuera del repo: la paleta
se desincroniza del CSS que describe en cuanto cambia un color, sin que nada avise.

**Alternativas descartadas.** Duplicar los skills por proyecto (descartada explícitamente).
Meter los datos del proyecto dentro del skill (mismo problema de desincronización).

**La costura:** si el contenido cambia al cambiar de proyecto, es un DATO y va al repo. Si
no cambia, es PROCESO y va al skill.

**Fecha.** 2026-08-16 · Detalle: `docs/disenos/2026-08-16-reestructuracion.md`

---

## D-008 — El checklist nace limpio, no marcado en `true`

**Decisión.** Eliminados los triggers `trg_materializar_checklist` y `trg_backfill_regla`.
Una sesión nueva no crea filas en `sesion_checklist`, y una regla nueva no se autorrellena
en el histórico. **Sin fila = N/A**: `calcDisciplinaStats` ignora los ítems no registrados.

**Motivo.** El trigger metía las 18 reglas en `true` al nacer la fila de `sesiones`. Como
`SupabaseDailyLevels` crea esa fila al abrir el RTH, **el AddOn se auto-marcaba solo en la
apertura** (poll de 5 s) y luego persistía esos `true`. La disciplina medía un checklist
que nadie había respondido.

**Alternativas descartadas.** Materializar en `false` — habría contado como incumplidas
reglas que simplemente no se registraron.

**Fecha.** 2026-08-16 · Migración: `docs/migrations/2026-08-16-checklist-sin-materializar-en-true.sql`

---

## D-007 — Las 6 reglas de feb–may se quedan como están

**Decisión.** `rei_zona`, `chk_contexto`, `chk_no_mover`, `rr_1a1`, `stop_max_puntos` y
`target_sin_zonas` nacieron con el rulebook de junio, así que sus filas de **feb–may son
relleno en `true`** (288 ítems). **No se limpian.**

**Motivo.** Limpiarlas bajaría la disciplina global de **81,5% a 75,1%** y rompería la
comparabilidad con el histórico que Kris ya venía mirando. La disciplina de feb–may está
inflada **por diseño aceptado**; se lee con esa salvedad.

**Alternativas descartadas.** Borrar las filas (rompe la serie). Marcarlas `false` (miente
en el otro sentido).

**Fecha.** 2026-07-24 · **CERRADO — no volver a proponerlo.**

---

## D-006 — La cuenta principal es configurable, no está fija en el código

**Decisión.** `objetivos.cuenta_principal` guarda la cuenta que alimenta P&L, Análisis,
Disciplina y Coach. Se elige en Datos. El indicador `SupabaseAutoExport` la lee de Supabase
al arrancar y rutea hacia `trades` tanto las cuentas `PA-*` como esa, aunque sea una
evaluación sin prefijo.

**Motivo.** Estaba hardcodeada como `PA-APEX-232411-03` en `coach.js`. Kris quemó esa
cuenta y compró otra: las cuentas de fondeo **rotan**, y cada rotación exigía tocar código.
Ahora basta elegirla en Datos y reiniciar NinjaTrader — sin recompilar.

**Consecuencia importante:** por eso **NO se filtra por cuenta principal al mostrar los
trades de un día**. Filtrar por la de hoy vaciaría todo el histórico anterior.

**Fecha.** 2026-07-21 · Migración: `docs/migrations/2026-07-21-objetivos-cuenta-principal.sql`

---

## D-005 — El riesgo se mide en PUNTOS, no en dólares

**Decisión.** El límite de stop es `objetivos.stop_max_puntos` (80). `limite_perdida_dia`
($150) queda **obsoleto** como regla de proceso: es control de capital de Apex.

**Motivo.** Con varios contratos el dólar escala y el mismo error de proceso da una cifra
distinta. El punto es invariante. Además **$ por punto depende del contrato: MNQ = $2,
NQ = $20** — normalizar mal el MAE lo infla ×10 en NQ, y ya llevó a una conclusión falsa.

**Fecha.** Jun 2026 (el stop pasó de 60 pts/$120 a 80 pts)

---

## D-004 — La disciplina se calcula en un solo sitio: `js/db.js`

**Decisión.** Todo el criterio (`discContexto`, `esDiaHabil`, `sesionOpero`,
`discFactorAplica`, `reglaAutoResultado`, `maeEnPuntos`, `reglaCumplida`,
`calcDisciplinaStats`…) vive en `db.js`. `metrics`, `charts`, `calendar`, `disciplina`,
`app` y `coach` **delegan**.

**Motivo.** Estuvo duplicado en 4 sitios y se desincronizó: la misma métrica daba números
distintos según la pantalla desde la que la miraras.

**Fecha.** Ago 2026 · Detalle: `.claude/rules/disciplina.md` · `docs/Disciplina.md`

---

## D-003 — RLS activo + `service_role` para bot, Worker e indicadores

**Decisión.** RLS activado en todas las tablas de `public`, con una política única
`auth_all` para el rol `authenticated`. `anon` sin políticas → la clave pública que viaja
en el JS no lee ni escribe nada. Bot, Worker `/api/session` e indicadores NT8 usan
`service_role`.

**Motivo.** La `anon key` viaja en el JavaScript público de GitHub Pages. Sin RLS,
cualquiera con esa clave podía leer y escribir toda la base de datos.

**Alternativas descartadas.** Dejarlo abierto por ser un proyecto personal — el repo es
privado, pero la clave publicada no.

**Fecha.** 2026-06-24 · Plan: `docs/archivo/plan-seguridad-rls.md`

---

## D-002 — `profit` es NETO y `commission` es el round-trip

**Decisión.** `trades.profit` lleva la comisión round-trip **ya descontada**.
`trades.commission` guarda ese round-trip completo.

**Motivo.** Convivían las dos convenciones según el origen del dato, y los totales no
cuadraban entre pantallas.

**Fecha.** Jun 2026

---

## D-001 — Supabase + JS vanilla + GitHub Pages, sin frameworks

**Decisión.** Frontend HTML/JS vanilla servido por GitHub Pages, Supabase como base de
datos, Cloudflare Workers para lo que necesita servidor. **Sin frameworks ni bundler.**

**Motivo.** Arquitectura 100% serverless por ~$0,40/mes, deploy con un `git push` y sin
paso de build que pueda romperse. Compatibilidad directa con GitHub Pages.

**Alternativas descartadas.** React/Vue + bundler (añade build, dependencias y
mantenimiento a un proyecto de un solo desarrollador). Backend propio (coste y servidor
que mantener).

**Coste asumido:** sin módulos, el acoplamiento va por ids del DOM y los archivos crecen
(`coach.js` 2.136 líneas). Es el precio conocido de la decisión, no un descuido.

**Fecha.** Mayo 2026
