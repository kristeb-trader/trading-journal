-- 2026-08-16 · Sesión nueva = checklist LIMPIO (se acabó el "todo true por defecto")
-- APLICADA vía MCP de Supabase el 16 ago 2026. Este archivo queda como historial.
--
-- EL SÍNTOMA
-- Al abrir el mercado, el AddOn ChecklistChaumer aparecía con TODAS las casillas
-- marcadas sin que el trader tocara nada.
--
-- LA CADENA (probada con datos reales del 14 ago)
--   1. `SupabaseDailyLevels` hace UPSERT a `sesiones` al detectar la apertura del RTH
--      (09:30-09:31 ET). Si la fila del día no existía, es un INSERT.
--   2. `trg_materializar_checklist` (AFTER INSERT on sesiones) insertaba las 18 reglas
--      de checklist con `cumplido = true`.
--   3. El AddOn hace poll cada 5 s y copia el estado de BD a las casillas → se marcaban
--      solas. Y el siguiente guardado persistía esos `true` como si los hubiera marcado
--      el trader → disciplina inflada al 100% en los días no corregidos a mano.
--
--   Huella forense: `rr_1a1` es la única regla con `activa = false`, así que ni el AddOn
--   ni la web la escriben — pero el trigger no filtraba por `activa`. Su updated_at del
--   14 ago quedó en 08:31:00.247 hora Colombia = 09:31 ET, el instante de la apertura,
--   junto con la fila de `sesiones` que trae `precio_apertura` (la escribe DailyLevels).
--   Mismo sello el 5 y el 10 de agosto, ambos cerrados 18/18 en `true`.
--
-- LA DECISIÓN (Kris, 16 ago)
-- La sesión nace limpia y el trader va marcando a medida que cumple cada regla.
-- Una casilla sin marcar NO se da por cumplida. `trg_backfill_regla` se va por el mismo
-- motivo: una regla nueva aparecería ya marcada en la sesión en curso.
--
-- POR QUÉ ES SEGURO QUITARLOS (verificado uno por uno)
--   · calcDisciplinaStats (js/db.js): `if (s[f.key] === undefined) return` → sin fila = N/A
--   · _checklistDia (js/app.js): solo pinta los ítems que tienen fila registrada
--   · Las 3 reglas `evidencia='auto'` no leen la fila: las calcula reglaAutoResultado
--   · form.js renderiza las casillas desmarcadas por defecto
--   · El AddOn con 0 filas muestra todo desmarcado (LoadStateAsync)
--
-- NO SE TOCA NINGUNA FILA EXISTENTE: el histórico (incluidos 5, 10, 12 y 13 de agosto,
-- que quedaron en 18/18 true) se conserva tal cual por decisión expresa de Kris.

drop trigger if exists trg_materializar_checklist on sesiones;
drop function if exists fn_materializar_checklist_sesion();

drop trigger if exists trg_backfill_regla on catalogo_reglas;
drop function if exists fn_backfill_regla_checklist();

-- ── Verificación (ejecutada tras aplicar) ───────────────────────────────────
--   Ningún trigger de materialización vivo:
--     select tgname from pg_trigger t join pg_class c on c.oid = t.tgrelid
--      where not t.tgisinternal
--        and tgname in ('trg_materializar_checklist','trg_backfill_regla');
--     → 0 filas ✓
--   Sesión nueva → 0 filas de checklist (fila de prueba, borrada después):
--     insert into sesiones (sesion_date) values ('2099-12-31');
--     select count(*) from sesion_checklist where sesion_date = '2099-12-31';  → 0 ✓
--     delete from sesiones where sesion_date = '2099-12-31';
--   Histórico intacto: 2068 filas en sesion_checklist, 180 de agosto ✓
