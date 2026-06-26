# Trading Journal NQ Futures — CLAUDE.md

> Contexto automático para Claude Code. Para historial detallado de fases ver `docs/historial-proyecto.md`.

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
js/coach.js      — Coach IA: flujo 3 etapas, chat, diagnóstico, guardar
js/metrics.js    — KPIs y métricas generales (cards del calendario)
js/charts.js     — Sección Análisis unificada: filtros Mes/Trimestre/Anual adaptativos
js/form.js       — Formulario de sesión diaria + experimentos
js/db.js         — Capa de datos Supabase (todas las queries)
js/experimentos.js — Laboratorio de Experimentos: veredictos + matriz cronológica
js/apex.js       — Apex Tracker: cuentas de fondeo, vista detalle, auto-carga NT8
js/estrategia.js — Sección Estrategia: reglas por setup + Chaumer
css/styles.css   — Dark mode completo + responsive mobile
TelegramBot/worker.js — Bot de Telegram (Cloudflare Worker)
```

## Tablas principales (Supabase)
| Tabla | Propósito |
|---|---|
| `trades` | Trades con `profit` NETO, `commission` round-trip |
| `sesiones` | Registro diario: emoción, checklist, premercado, setup |
| `diagnosticos_diarios` | Análisis IA: 3 secciones técnicas + 4 diagnóstico + chat |
| `diagnostico_errores` | Errores detectados (manual + IA) con recomendaciones |
| `diagnostico_experimentos` | Condiciones en prueba (T/S) por sesión |
| `catalogo_errores` | Maestro de nombres de errores con tipo |
| `catalogo_emociones` | Emociones con emoji |
| `catalogo_experimentos` | Experimentos activos/inactivos |
| `setup_reglas` | Reglas documentadas por setup × dirección |
| `estrategia_chaumer` | Secciones editables de la estrategia |
| `objetivos` | Stop máx, trades/día, P&L objetivo, límite pérdida |
| `fomc_dates` | Fechas FOMC 2025-2026 |
| `apex_cuentas` | Cuentas de fondeo Apex: parámetros (DD, target, safety net) y estado |
| `apex_registros` | Registro diario manual por cuenta Apex (P&L, balance, threshold) |
| `apex_trades` | Trades individuales auto-exportados de NT8 (cuentas de evaluación) |

## Coach IA — flujo
1. **Análisis Técnico** → 1ª llamada IA → 3 secciones (Contexto / Desarrollo / Validación)
2. **Chat** (opcional) → si la IA genera el diagnóstico estructurado en el chat, se auto-aplica al Step 3
3. **Diagnóstico Final** → 2ª llamada IA → 4 secciones (Veredicto / Errores / Aprendizaje / Resumen)

## Convención P&L
`profit` = **NETO** (comisión round-trip ya descontada). `commission` = round-trip total. Convención unificada Jun 2026.

## Flujo de trabajo (obligatorio)
1. Analizar → presentar diagnóstico → **esperar aprobación** → implementar
2. Verificar de verdad (preview, consola sin errores)
3. Commit + push inmediato tras cada cambio aprobado
4. Conventional commits en español: `feat/fix/docs(scope): descripción`
5. Cambios en BD → entregar SQL en `docs/migrations/` y avisar al usuario que lo corra

## Estado actual (Jun 2026)
### Funcionando
- Secciones: Calendario+Métricas, Trades, Registrar, Análisis (unificado: Mes/Trimestre/Anual), Experimentos, Apex Tracker, Galería, Historial, Coach IA, Estrategia, Datos
- Coach IA 3 etapas + auto-detección diagnóstico en chat
- Filtro de cuenta: carga PA-APEX por defecto, persiste en localStorage
- Nav mobile scrollable horizontal

### Pendientes
- **🔒 Blindaje de seguridad (RLS + Auth) — COMPLETADO** (2026-06-24). RLS activo
  en todas las tablas; web vía login Supabase Auth (rol `authenticated`); bot,
  Worker `/api/session` e indicadores NT8 con `service_role`. `anon` bloqueada y
  verificada (anon key pública inservible). Plan y fases en `docs/plan-seguridad-rls.md`.
  **NO usar "Resolve issue" de Supabase** (rompe las políticas). Tablas nuevas:
  activar RLS + política `auth_all` (ver `docs/migrations/2026-06-24-fase2-activar-rls.sql`).
  · **Export NT8 verificado (2026-06-25)**: trade de Sim101 → `apex_trades` con RLS
    activo. Requirió grants de `service_role` (faltaban en `apex_trades` → HTTP 403/
    42501); arreglado con `docs/migrations/2026-06-25-grants-service-role.sql` (CRUD
    a service_role en todas las tablas + default privileges). En éxito el indicador
    NO imprime nada en el Output (solo si falla). Routing: cuentas sin prefijo `PA-`
    (ej. Sim101) → `apex_trades` sin Telegram; `PA-*` → `trades` + Telegram.
- **Unificación tablas Apex — drop pendiente**: `apex_registros` + `apex_trades` ya
  se unificaron en `apex_trades` (filas `tipo='trade'`/`'dia'`). Falta ejecutar
  `drop table apex_registros;` (comentado en `docs/migrations/2026-06-23-apex-unificar-tablas.sql`)
  tras confirmar que todo cuadra. El código tiene fallback mientras tanto.
- **AddOn NT8 `ChecklistChaumer`** — entregado y compila; el usuario lo prueba en
  vivo con la operativa (panel flotante de checklist sincronizado con `sesiones.checklist`).
- **Reestructuración Disciplina/Reglas/Errores por fases** — COMPLETA (Bloques 1-5,
  2026-06-19). Ver `docs/plan-disciplina-fases.md`.
- **Migraciones por correr** (Supabase SQL): `2026-06-19-sesiones-chk-cuenta-pa.sql`,
  `2026-06-19-sesiones-alerta-riesgo.sql`.
- Verificar que Worker web `/api/session` guarde los campos nuevos (`chk_cuenta_pa`,
  `alerta_riesgo_vista`) y los de premercado correctamente
- Recomendaciones tipificadas en Coach IA (Fase 4B) — pendiente de implementar
- Estadísticas de 3 corridas, volumen en trades, tasa de ejecución de setups válidos
- **Limpieza columnas `chk_*` de `sesiones`** (PENDIENTE, dejada para más adelante).
  El checklist ya vive en `sesiones.checklist` (JSONB) + catálogo `checklist_items`;
  las 7 columnas `chk_*` se conservan como espejo/respaldo. Para eliminarlas (orden
  seguro): 1) `form.js` y `TelegramBot/worker.js` dejan de escribir `chk_*` (solo
  `checklist`); 2) verificar `select count(*) from sesiones where checklist is null
  or checklist='{}'::jsonb;` = 0; 3) `ALTER TABLE sesiones DROP COLUMN` de las 7.
  La lectura (calendario/charts/metrics/coach) NO se toca: la hidratación en `db.js`
  sigue exponiendo `s.chk_*` desde el JSONB.

## Para contexto adicional
- Plan de seguridad (RLS + Auth): `docs/plan-seguridad-rls.md` ← EN CURSO
- Plan disciplina por fases: `docs/plan-disciplina-fases.md`
- Historial completo de fases: `docs/historial-proyecto.md`
- Esquema BD detallado: `memory/db-schema.md`
- Perfil del usuario: `memory/user-profile.md`
