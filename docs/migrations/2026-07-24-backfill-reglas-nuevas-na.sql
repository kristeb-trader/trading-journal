-- 2026-07-24 · Una regla de checklist nueva ya NO se da por cumplida en el historial
-- APLICADA vía MCP de Supabase el 24 jul 2026. Este archivo queda como historial.
--
-- CONTEXTO
-- El trigger `fn_backfill_regla_checklist` materializaba cada regla nueva en TODAS
-- las sesiones con `cumplido = true`, con la intención de "no dañar disciplina".
-- El efecto real es el contrario: días anteriores a la existencia de la regla
-- aparecen cumpliéndola, inflando el % de disciplina histórico.
--
-- Como `calcDisciplinaStats` (js/db.js) ignora los ítems SIN fila registrada
-- (`if (s[f.key] === undefined) return`), la representación correcta de "N/A" es
-- simplemente NO crear la fila.
--
-- ALCANCE (deliberadamente quirúrgico)
-- Solo se limpian las 3 reglas de Reingreso creadas el 24 jul por la Fase A de
-- setups paramétricos, que nacieron con 120 filas en `true` y ningún `false`.
-- NO se tocan las 14 reglas con `created_at = 2026-06-29`: esa es la fecha en que
-- se unificó el rulebook en `catalogo_reglas`, no la fecha en que la regla empezó
-- a aplicar, y sus filas antiguas sí llevan los valores reales migrados desde el
-- JSONB `sesiones.checklist` y las columnas `chk_*`. Borrar por `created_at`
-- destruiría 1.414 filas de historial legítimo.
--
-- IMPACTO MEDIDO: disciplina global 81.6% → 81.5% (6 ítems fantasma, en los días
-- de Reingreso operados del 20 mar y 9 abr).

-- 1) El backfill solo alcanza de hoy en adelante.
--    Hora Colombia: los `sesion_date` son fechas locales, no UTC
--    (ver la regla de oro de zona horaria del proyecto).
CREATE OR REPLACE FUNCTION public.fn_backfill_regla_checklist()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.es_checklist = true then
    insert into sesion_checklist (sesion_date, regla_codigo, cumplido)
    select s.sesion_date, new.codigo, true
      from sesiones s
     where s.sesion_date >= (now() at time zone 'America/Bogota')::date
    on conflict (sesion_date, regla_codigo) do nothing;
  end if;
  return new;
end $function$;

-- 2) Limpiar el relleno ya existente. Se conserva la sesión del 24 jul,
--    el día en que las reglas nacieron.
DELETE FROM sesion_checklist
 WHERE regla_codigo IN ('rei_consecucion_fallida','rei_vela_reingreso','rei_vela_consecucion')
   AND sesion_date < DATE '2026-07-24';

-- ── VERIFICACIÓN (ejecutada tras aplicar) ──────────────────────────────────
-- a) Quedan 3 filas, todas del 2026-07-24.                              ✔
-- b) Los días de Reingreso previos (20 mar, 9 abr) pasan de 18 a 15 ítems. ✔
-- c) Regla de prueba insertada y revertida: crea 1 sola fila, la de hoy.  ✔
-- d) Disciplina global: 81.5% sobre 1119 ítems.                          ✔

-- ── PENDIENTE (decisión del usuario) ───────────────────────────────────────
-- Otras 6 reglas (rei_zona, chk_contexto, chk_no_mover, rr_1a1,
-- stop_max_puntos, target_sin_zonas) tienen su primer `false` el 2026-06-01:
-- nacieron con el rulebook de junio y sus filas de feb–may también son relleno
-- en `true` (288 ítems). Limpiarlas bajaría la disciplina global a 75.1%.
