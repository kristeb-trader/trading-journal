# Trading Journal NQ Futures — CLAUDE.md

> Contexto automático para Claude Code. Historial completo de fases (y hitos ya
> completados) en `docs/historial-proyecto.md`.

## Proyecto
Dashboard personal para registro y análisis de operativa diaria en NQ/MNQ Futures (1 min), siguiendo la **Metodología Chaumer**. Arquitectura 100% serverless, ~$0.40/mes.

## Stack
| Capa | Tecnología |
|---|---|
| Frontend | HTML + JS vanilla (sin frameworks) — GitHub Pages |
| Base de datos | Supabase (PostgreSQL) — **RLS activado** (web vía login `authenticated`; bot/worker/NT8 con `service_role`) |
| Proxy IA | Cloudflare Worker `broad-hall-c53f.kristerock.workers.dev` |
| Análisis IA | Claude API `claude-sonnet-4-6` |
| Imágenes | Cloudinary (cloud: `dq4n7bjta`, preset: `trading-journal`) |
| Bot | Telegram → Cloudflare Worker #2 + KV |
| Exportación | Indicador C# en NinjaTrader 8 (`NinjaTrader/SupabaseAutoExport.cs`) — routing: PA-* **y la cuenta principal** (`objetivos.cuenta_principal`) →`trades`+Telegram, resto (eval Apex)→`apex_trades` sin notificar |

## URLs clave
- **Producción:** `https://kristeb-trader.github.io/trading-journal`
- **Supabase:** `https://jothoslozctflfrnysrx.supabase.co`
- **Repo:** `https://github.com/kristeb-trader/trading-journal` (privado, rama `main`)

## Paleta visual
- Fondo: `#1a1a18` | Accent verde: `#1D9E75` | Stop/error: `#E24B4A` | Warning: `#BA7517`
- Cards: `border-radius: 10px`, sombras suaves, transiciones 150ms
- Iconos: Tabler Icons (CDN) | Gráficas: Chart.js (CDN)

## Archivos clave
```
js/app.js        — Boot, navegación SPA, Modal.openDay (modal del calendario)
js/account-filter.js — Filtro de cuentas compartido (multi-selección con checkboxes).
                   Nombre COMPLETO de la cuenta; default = `objetivos.cuenta_principal`.
                   Lo usan Análisis, Calendario, Trades y Métricas (hereda el del Calendario)
js/calendar.js   — Calendario mensual, filtro de cuenta, openDayModal
js/coach.js      — Coach IA: flujo 3 etapas, chat, diagnóstico, guardar. Lee de `catalogo_reglas`
js/metrics.js    — KPIs y métricas generales (cards del calendario)
js/charts.js     — Sección Análisis unificada: filtros Mes/Trimestre/Anual
js/form.js       — Formulario de sesión diaria + experimentos
js/disciplina.js — Dashboard de Disciplina: semáforo por fase, racha, errores por causa
js/db.js         — Capa de datos Supabase (todas las queries) + **cálculo canónico de
                   disciplina** (ver "Reglas de oro de la disciplina" más abajo)
js/experimentos.js — Laboratorio de Experimentos: veredictos + matriz cronológica
js/apex.js       — Apex Tracker: cuentas de fondeo, vista detalle, auto-carga NT8
js/estrategia.js — Editor del rulebook `catalogo_reglas` por capas
js/fechas.js     — Sección Fechas Especiales: CRUD de `catalogo_fechas` (fomc/festivo/vacaciones/otro) por año
css/styles.css   — Dark mode completo + responsive mobile
TelegramBot/worker.js — Bot de Telegram (Cloudflare Worker). NO pide niveles de
                   premercado (los pone `SupabaseDailyLevels`) ni noticias (las registra
                   el AddOn en `sesion_noticias`). Se despliega solo al hacer push

```

## Tablas principales (Supabase)
| Tabla | Propósito |
|---|---|
| `trades` | Trades con `profit` NETO, `commission` round-trip |
| `sesiones` | Registro diario: emoción, premercado, setup (el checklist ya NO vive aquí). `setup` (texto) + **`setup_codigo`** (FK a `catalogo_setup_variantes`); el trigger `fn_sync_setup_codigo` los mantiene sincronizados escriba quien escriba (web, bot, Worker o NT8) |
| **`sesion_checklist`** | **Checklist diario normalizado** (1 fila = sesión × regla). FK a `sesiones(sesion_date)` y `catalogo_reglas(codigo)`; `cumplido` bool. Reemplaza al JSONB `sesiones.checklist` y a las columnas `chk_*`. Triggers: sesión nueva → materializa en `true`; **regla nueva → solo de hoy en adelante** (Jul 2026: antes rellenaba TODO el historial en `true` e inflaba la disciplina). **Sin fila = N/A**: `calcDisciplinaStats` ignora los ítems no registrados. `db.js` reconstruye `s.checklist` en memoria al leer |
| `diagnosticos_diarios` | Análisis IA: 3 secciones técnicas + 4 diagnóstico + chat |
| `diagnostico_errores` | Errores detectados (manual + IA) con recomendaciones. **`regla_codigo`** (FK a `catalogo_reglas`, Ago 2026) = la regla del checklist que ese error contradice → la disciplina la cuenta **incumplida aunque la casilla esté marcada**. NULL = no toca el checklist (los psicológicos: Miedo, Duda, Rabia…) |
| `diagnostico_experimentos` | Condiciones en prueba (T/S) por sesión |
| `catalogo_errores` / `catalogo_emociones` / `catalogo_experimentos` | Maestros |
| **`sesion_noticias`** | **Noticias rojas del día** (Ago 2026): varias por día con `hora` + `nombre`. Ventana ±5 min sobre la **entrada** (estar ya dentro es válido). Trigger bidireccional con `sesiones.hora_noticia_roja` (texto) porque el Worker no versionado aún la escribe |
| **`catalogo_reglas`** | **Rulebook canónico unificado** (1 fila = 1 regla; antes `reglas`, renombrada Jul 2026). Capas filosofia/proceso/riesgo; `tipo` dura/blanda; `es_checklist`+`fase` → checklist diario (`sesion_checklist`). **`bloquea_go`** (¿hace falta para dar GO?), **`aplica_si`** (siempre/dia_fomc/hay_noticia) y **`evidencia`** (auto/declarada) — Ago 2026. **`setup`** apunta a `catalogo_setups.codigo` (o NULL = común): una regla aplica a un día si es NULL o coincide con la familia del setup de ese día. Ver [[rulebook-modelo]] |
| **`catalogo_setups`** | **Familias de setup** (`iri`, `reingreso`, …). Es lo que agrupa las reglas de Fase 2. Se gestiona en Datos → "Setups operativos" |
| **`catalogo_setup_variantes`** | **Variantes operativas** (`iri_continuacion_alcista` → "IRI Continuación Alcista"): `setup_codigo` (FK a la familia), `subtipo`, `direccion`. Alimenta los dropdowns de la web, el teclado del bot y el AddOn NT8 |
| `objetivos` | Config global (single row): Stop máx (`stop_max_puntos`, default 80), trades/día, P&L objetivo, límite pérdida, y **`cuenta_principal`** (la cuenta que el journal usa para P&L/análisis/Coach; se elige en Datos) |
| **`catalogo_fechas`** | **Días especiales del calendario** (`tipo`: fomc/festivo/vacaciones/otro; fecha, nombre, emoji, notas). Se gestiona en la sección "Fechas Especiales". El calendario lee de aquí. Reemplaza a `fomc_dates` y al cálculo de festivos en código |
| `apex_cuentas` | Cuentas de fondeo Apex: parámetros (DD, target, safety net) y estado |
| `apex_trades` | Trades + días auto-exportados de NT8 (`tipo='trade'`/`'dia'`) |

> Tablas viejas del rulebook (`setup_reglas_archivada`, `estrategia_chaumer_archivada`,
> `reglas_legacy_backup`, `checklist_items`) eliminadas Jul 2026 — todo vive en `catalogo_reglas`.
> Esquema detallado en `memory/db-schema.md`.

## Coach IA — flujo
1. **Análisis Técnico** → 1ª llamada IA → 3 secciones (Contexto / Desarrollo / Validación)
2. **Chat** (opcional) → si la IA genera el diagnóstico estructurado, se auto-aplica al Step 3
3. **Diagnóstico Final** → 2ª llamada IA → 4 secciones (Veredicto / Errores / Aprendizaje / Resumen)

## Convención P&L
`profit` = **NETO** (comisión round-trip ya descontada). `commission` = round-trip total. Unificada Jun 2026.

## Flujo de trabajo (obligatorio)
1. Analizar → presentar diagnóstico → **esperar aprobación** → implementar
2. Verificar de verdad (preview, consola sin errores)
3. Commit + push inmediato tras cada cambio aprobado
4. Conventional commits en español: `feat/fix/docs(scope): descripción`
5. Cambios en BD → entregar SQL en `docs/migrations/` y avisar al usuario que lo corra

## Estado actual (Ago 2026)
Funcionando: todas las secciones — Disciplina, Análisis, Calendario+Métricas, Apex,
Experimentos, Trades, Sesión (antes "Registrar"), Historial, Coach IA, Imágenes,
Estrategia, Datos, **Fechas Especiales** (ese es el orden del menú). Coach IA 3 etapas,
checklist normalizado, cuenta principal configurable, filtro de cuenta persistente.

> 🎯 **REGLAS DE ORO DE LA DISCIPLINA (Ago 2026).** El criterio vive **solo** en `db.js`
> (`discContexto` · `esDiaHabil` · `sesionOpero` · `discFactorAplica` ·
> `discAplicaContexto` · `reglaAutoResultado` · `maeEnPuntos` · `reglasRotasPorDia` ·
> `reglaCumplida` · `calcDisciplinaStats`); estuvo duplicado en 4 sitios y se
> desincronizó. Al tocar disciplina, cambiar **ahí** y dejar que
> `metrics/charts/calendar/disciplina/app/coach` deleguen. **Construye el contexto con
> `discContexto()` y pásale trades y errores COMPLETOS** (sin filtro de cuenta ni de
> período): son índices de "qué pasó ese día", no métricas. Siete invariantes:
> 1. **Sábados y domingos no cuentan en NADA.** El AddOn crea filas de `sesiones` al
>    abrir NT8; sin este filtro entraban como días operados.
> 2. **`no_opero = false` NO significa que operó** — es el default de la columna. Las
>    Fases 2/3 solo aplican si hubo **operativa real** (trades ese día o setup declarado).
> 3. **Los días sin conexión** (`no_opero=true` + `se_conecto=false`) quedan fuera de
>    toda estadística, no solo de la disciplina.
> 4. **El checklist es auto-reportado y puede mentir.** Un error con `regla_codigo`
>    tumba esa regla aunque la casilla esté en `true`.
> 5. **Hay reglas que NO se marcan: se calculan** (`evidencia='auto'`) — stop máximo,
>    ventana de noticia y día FOMC. Devuelven true/false/**null**; `null` = sin evidencia
>    y NO cuenta. Cuando el dato puede responder, responde el dato.
> 6. **Tercer eje de aplicabilidad: `aplica_si`** (`siempre` · `dia_fomc` ·
>    `hay_noticia`). Una regla solo se evalúa cuando había algo que cumplir; si no, su %
>    se diluye en cientos de días sin riesgo y deja de significar nada.
>    ⚠️ La condición se comprueba **dentro de `reglaAutoResultado`**, no solo en
>    `discFactorAplica`: el Coach pide el resultado suelto y sin esa guarda reportaba
>    "violaste la regla del FOMC" en días que no eran FOMC (bug real, 3 ago).
> 7. **`bloquea_go`**: el GO cae DENTRO de la Fase 2, no al final del checklist. Las
>    reglas que describen hechos posteriores a la entrada no lo bloquean — exigirlas
>    obligaba a marcar lo que aún no había pasado o a perder el trade.
>
> ⚠️ **$ por punto según contrato: MNQ = $2, NQ = $20.** Normalizar mal el MAE lo infla
> ×10 en los trades de NQ (ya llevó a una conclusión falsa). El riesgo se mide en PUNTOS,
> no en dólares: `objetivos.limite_perdida_dia` ($150) quedó obsoleto y es control de
> capital de Apex, no regla de proceso.

> 📤 **Al guardar una sesión: `upsertSesion` manda el payload al Worker `/api/session`,
> que lo escribe TAL CUAL como columnas de `sesiones`.** Cualquier clave que no sea una
> columna real revienta el guardado entero (PGRST204). Las claves de tablas relacionales
> —hoy `checklist` y `noticiasRojas`— hay que **sacarlas del destructuring** antes de
> enviarlo. Ya rompió el guardado una vez (3 ago).

> ⏰ **REGLA DE ORO — zona horaria (ya causó 2 bugs).** NinjaTrader está en hora de
> **Colombia (UTC-5)**: todo lo que exporta (velas y `entry_time`/`exit_time`) viene en
> hora Colombia, NO en ET. Colombia no tiene DST y NY sí → en verano 09:30 ET = **08:30
> Colombia**; en invierno coinciden. Al tocar horas: convertir a ET antes de razonar
> sobre RTH/premercado. Los parámetros RTH del indicador van en **ET (930/1600)**.

### Pendientes abiertos
- 🔴 **Verificar en vivo el Coach IA** (previsto para la sesión del 4 ago): validación por
  fases, títulos de regla descriptivos, horas en ET, la 9ª parte `reglaCodigo` **y el
  bloque "VERIFICADO POR DATOS"** del checklist. Generar un análisis y confirmar.
- **Estrenar el checklist rediseñado en vivo** (4 ago): comprobar que el GO se habilita
  con 8 ítems, que las noticias rojas se registran desde el AddOn y que las 3 reglas
  automáticas resuelven bien al cierre del día.
- Recomendaciones tipificadas en Coach IA (Fase 4B): implementado salvo inyectar el
  catálogo de recomendaciones en el prompt (para que reutilice nombres y no duplique).
- Modal del día: un ítem tumbado por un error se ve igual que uno nunca marcado.
  `_checklistDia` ya expone `roto` para distinguirlos visualmente ("marcado, pero el
  diagnóstico lo desmiente") — falta el render.
- Los 39 errores históricos sin `regla_codigo` se comportan como antes; se irán
  tipificando solos según el Coach analice días nuevos.
- Estadísticas de 3 corridas, volumen en trades, tasa de ejecución de setups válidos.
- "Dejé de ganar": ampliar para capturar más casos (miedo, reingreso no tomado…).
- Rendimiento general del Journal (el modal del día cargaba lento).

> 🚫 **Decidido y CERRADO (24 jul) — no volver a proponerlo.** Otras 6 reglas
> (`rei_zona`, `chk_contexto`, `chk_no_mover`, `rr_1a1`, `stop_max_puntos`,
> `target_sin_zonas`) nacieron con el rulebook de junio, así que sus filas de **feb–may
> son relleno en `true`** (288 ítems). Kris decidió **dejarlas como están**: limpiarlas
> bajaría la disciplina global de 81.5% a 75.1% y rompería la comparabilidad con el
> histórico que ya viene mirando. La disciplina de feb–may está inflada **por diseño
> aceptado**; leerla con esa salvedad.

> ✅ **Cerrado (24 jul):** `ChecklistChaumer` recompilado en NT8 → los botones de setup
> salen de `catalogo_setups` (Fase D cerrada). Y la cuenta principal `APEX-232411-14` ya
> tiene trades reales en `trades` (22-24 jul) → el routing de `SupabaseAutoExport` hacia
> la cuenta principal está verificado end-to-end.

> ✅ **Cerrado (3 ago):** `ChecklistChaumer` recompilado de nuevo con la **guarda de fin
> de semana** (`EsFinDeSemana()` en `UpsertSesionAsync`/`UpsertChecklistAsync`) → abrir
> NT8 un sábado ya no deja filas fantasma en `sesiones`.

> ✅ **Cerrado (3 ago, 2ª recompilación):** `ChecklistChaumer` con el **rediseño del
> checklist** — el GO exige solo las 8 reglas que lo bloquean (antes las 13), los ítems
> automáticos se muestran con ⚙ y sin casilla, y las **noticias rojas son una lista**
> (varias por día, con nombre, alerta de la próxima ventana y bloqueo del GO dentro de
> ella). Las 5 fases del rediseño quedan activas end-to-end.

> ⚠️ **Efecto lateral asumido (3 ago):** la **tasa de errores** y los **días limpios**
> tienen ahora un denominador menor (salieron los días sin conexión), así que sus
> porcentajes son más altos que los que Kris venía viendo. Es lo pedido, no un bug.

> **BD limpia (re-verificado 24 jul 2026 contra la BD real — 17 tablas vivas; única
> columna añadida desde entonces: `diagnostico_errores.regla_codigo`, 3 ago):** no quedan tablas ni columnas
> legacy. Eliminadas: `apex_registros`, `fomc_dates`, las `*_archivada`,
> `reglas_legacy_backup`, `checklist_items`, `sesion_casuisticas`,
> `experimento_registros`, `catalogo_casuisticas`, `errores_sesion`, y de `sesiones`
> el JSONB `checklist` + las 7 columnas `chk_*` (el checklist vive 100% en
> `sesion_checklist`). Vivas: `sesiones`, `sesion_checklist`, `trades`, `apex_trades`,
> `apex_cuentas`, `catalogo_reglas`, `catalogo_fechas`, `objetivos`, etc.

## Para contexto adicional
- **Cómo se calcula la disciplina (y errores / días limpios), paso a paso con el ejemplo
  real de julio: `docs/Disciplina.md`** ← leerlo antes de tocar cualquier métrica de disciplina
- Historial completo + hitos cerrados: `docs/historial-proyecto.md`
- Esquema BD detallado: `memory/db-schema.md` · Perfil del usuario: `memory/user-profile.md`
- Planes: `docs/plan-seguridad-rls.md`, `docs/plan-disciplina-fases.md`, `docs/plan-unificacion-reglas.md`
