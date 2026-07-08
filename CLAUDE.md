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
| Exportación | Indicador C# en NinjaTrader 8 (`NinjaTrader/SupabaseAutoExport.cs`) — routing: PA→`trades`+Telegram, eval Apex→`apex_trades` sin notificar |

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
| `objetivos` | Stop máx (`stop_max_puntos`, default 80), trades/día, P&L objetivo, límite pérdida |
| `fomc_dates` | Fechas FOMC 2025-2026 |
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

## Estado actual (Jun 2026)
Funcionando: todas las secciones (Calendario+Métricas, Trades, Registrar, Análisis,
Experimentos, Apex Tracker, Galería, Historial, Coach IA, Estrategia, Datos), Coach IA
3 etapas, filtro de cuenta persistente, nav mobile.

### Pendientes abiertos
- Coach IA: probar en vivo el formato real de las 3 tarjetas.
- Recomendaciones tipificadas en Coach IA (Fase 4B): implementado salvo inyectar el
  catálogo de recomendaciones en el prompt del Coach (para que reutilice nombres y no
  duplique). Pendiente ese último paso.
- Estadísticas de 3 corridas, volumen en trades, tasa de ejecución de setups válidos.
- **Checklist normalizado en `sesion_checklist` (en curso, Jul 2026).** Migrado el
  checklist del JSONB a una tabla relacional; `reglas` renombrada a `catalogo_reglas`.
  Fases A (SQL), B (web) y C (AddOn NT) implementadas y verificadas contra la BD real.
  **Falta que el usuario:** (1) corra `2026-07-08-normalizar-checklist-catalogo-reglas.sql`;
  (2) verifique el guardado real en producción (web + AddOn recompilado); (3) corra el
  drop del modelo viejo `2026-07-08-drop-sesiones-checklist-jsonb.sql`. Ver [[rulebook-modelo]].

> **BD limpia (validado Jul 2026):** no quedan tablas legacy por borrar. `apex_registros`
> y todas las archivadas (`*_archivada`, `reglas_legacy_backup`, `checklist_items`,
> `sesion_casuisticas`, `experimento_registros`, `catalogo_casuisticas`, `errores_sesion`)
> ya no existen. Vivas: `sesiones`, `sesion_checklist`, `trades`, `apex_trades`,
> `apex_cuentas`, `catalogo_reglas`, etc.

## Para contexto adicional
- Historial completo + hitos cerrados: `docs/historial-proyecto.md`
- Esquema BD detallado: `memory/db-schema.md` · Perfil del usuario: `memory/user-profile.md`
- Planes: `docs/plan-seguridad-rls.md`, `docs/plan-disciplina-fases.md`, `docs/plan-unificacion-reglas.md`
