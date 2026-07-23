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
js/calendar.js   — Calendario mensual, filtro de cuenta, openDayModal
js/coach.js      — Coach IA: flujo 3 etapas, chat, diagnóstico, guardar. Lee de `catalogo_reglas`
js/metrics.js    — KPIs y métricas generales (cards del calendario)
js/charts.js     — Sección Análisis unificada: filtros Mes/Trimestre/Anual
js/form.js       — Formulario de sesión diaria + experimentos
js/db.js         — Capa de datos Supabase (todas las queries)
js/experimentos.js — Laboratorio de Experimentos: veredictos + matriz cronológica
js/apex.js       — Apex Tracker: cuentas de fondeo, vista detalle, auto-carga NT8
js/estrategia.js — Editor del rulebook `catalogo_reglas` por capas
js/fechas.js     — Sección Fechas Especiales: CRUD de `catalogo_fechas` (fomc/festivo/vacaciones/otro) por año
css/styles.css   — Dark mode completo + responsive mobile
TelegramBot/worker.js — Bot de Telegram (Cloudflare Worker)
```

## Tablas principales (Supabase)
| Tabla | Propósito |
|---|---|
| `trades` | Trades con `profit` NETO, `commission` round-trip |
| `sesiones` | Registro diario: emoción, premercado, setup (el checklist ya NO vive aquí) |
| **`sesion_checklist`** | **Checklist diario normalizado** (1 fila = sesión × regla). FK a `sesiones(sesion_date)` y `catalogo_reglas(codigo)`; `cumplido` bool. Reemplaza al JSONB `sesiones.checklist` y a las columnas `chk_*`. Triggers: sesión nueva y regla nueva → materializan en `true` (no dañar disciplina). `db.js` reconstruye `s.checklist` en memoria al leer |
| `diagnosticos_diarios` | Análisis IA: 3 secciones técnicas + 4 diagnóstico + chat |
| `diagnostico_errores` | Errores detectados (manual + IA) con recomendaciones |
| `diagnostico_experimentos` | Condiciones en prueba (T/S) por sesión |
| `catalogo_errores` / `catalogo_emociones` / `catalogo_experimentos` | Maestros |
| **`catalogo_reglas`** | **Rulebook canónico unificado** (1 fila = 1 regla; antes `reglas`, renombrada Jul 2026). Capas filosofia/proceso/riesgo; `setup` (iri/reingreso) etiqueta en proceso Fase 2; `tipo` dura/blanda; `es_checklist`+`fase` → checklist diario (`sesion_checklist`). Ver [[rulebook-modelo]] |
| `objetivos` | Config global (single row): Stop máx (`stop_max_puntos`, default 80), trades/día, P&L objetivo, límite pérdida, y **`cuenta_principal`** (la cuenta que el journal usa para P&L/análisis/Coach; se elige en Datos) |
| **`catalogo_fechas`** | **Días especiales del calendario** (`tipo`: fomc/festivo/vacaciones/otro; fecha, nombre, emoji, notas). Se gestiona en la sección "Fechas Especiales". El calendario lee de aquí. Reemplaza a `fomc_dates` y al cálculo de festivos en código |
| `fomc_dates` | ⚠️ Obsoleta (migrada a `catalogo_fechas`); pendiente de drop |
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

## Estado actual (Jul 2026)
Funcionando: todas las secciones — Disciplina, Análisis, Calendario+Métricas, Apex,
Experimentos, Trades, Sesión (antes "Registrar"), Historial, Coach IA, Imágenes,
Estrategia, Datos, **Fechas Especiales** (ese es el orden del menú). Coach IA 3 etapas,
checklist normalizado, cuenta principal configurable, filtro de cuenta persistente.

> ⏰ **REGLA DE ORO — zona horaria (ya causó 2 bugs).** NinjaTrader está en hora de
> **Colombia (UTC-5)**: todo lo que exporta (velas y `entry_time`/`exit_time`) viene en
> hora Colombia, NO en ET. Colombia no tiene DST y NY sí → en verano 09:30 ET = **08:30
> Colombia**; en invierno coinciden. Al tocar horas: convertir a ET antes de razonar
> sobre RTH/premercado. Los parámetros RTH del indicador van en **ET (930/1600)**.

### Pendientes abiertos
- **Verificar en vivo el Coach IA** tras los últimos cambios (validación por fases,
  títulos de regla descriptivos, horas en ET): generar un análisis y confirmar.
- Recomendaciones tipificadas en Coach IA (Fase 4B): implementado salvo inyectar el
  catálogo de recomendaciones en el prompt (para que reutilice nombres y no duplique).
- Estadísticas de 3 corridas, volumen en trades, tasa de ejecución de setups válidos.
- "Dejé de ganar": ampliar para capturar más casos (miedo, reingreso no tomado…).
- Rendimiento general del Journal (el modal del día cargaba lento).
- Cuenta nueva `APEX-232411-14` (evaluación): ya es la principal y el routing la manda
  a `trades`. Falta ver el primer trade real fluyendo end-to-end.

> **BD limpia (verificado Jul 2026 contra la BD real):** no quedan tablas ni columnas
> legacy. Eliminadas: `apex_registros`, `fomc_dates`, las `*_archivada`,
> `reglas_legacy_backup`, `checklist_items`, `sesion_casuisticas`,
> `experimento_registros`, `catalogo_casuisticas`, `errores_sesion`, y de `sesiones`
> el JSONB `checklist` + las 7 columnas `chk_*` (el checklist vive 100% en
> `sesion_checklist`). Vivas: `sesiones`, `sesion_checklist`, `trades`, `apex_trades`,
> `apex_cuentas`, `catalogo_reglas`, `catalogo_fechas`, `objetivos`, etc.

## Para contexto adicional
- Historial completo + hitos cerrados: `docs/historial-proyecto.md`
- Esquema BD detallado: `memory/db-schema.md` · Perfil del usuario: `memory/user-profile.md`
- Planes: `docs/plan-seguridad-rls.md`, `docs/plan-disciplina-fases.md`, `docs/plan-unificacion-reglas.md`
