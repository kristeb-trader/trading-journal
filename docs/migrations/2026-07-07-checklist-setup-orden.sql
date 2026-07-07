-- ═══════════════════════════════════════════════════════════════════════════
-- Checklist por setup (AddOn NT ChecklistChaumer + web) — ajustes del rulebook
-- 2026-07-07
--
-- 1) "Contexto / tendencia a favor" pasa a común (setup = NULL): aplica tanto
--    a IRI como a Reingreso, con la misma clave (chk_contexto) en el JSONB.
-- 2) Título de consecución completo ("= entrada").
-- 3) Orden canónico del checklist, igual en AddOn NT y en Registrar (web).
--    En Fase 2 los comunes de cierre (target sin zonas, stop máx) van al final.
-- Solo UPDATEs de datos: no requiere NOTIFY pgrst.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Contexto a favor: común a ambos setups
update reglas set setup = null where codigo = 'chk_contexto';

-- 2) Título completo de la regla de entrada
update reglas set titulo = 'Rompimiento de zona + consecución = entrada'
 where codigo = 'chk_consecucion';

-- 3) Orden del checklist
-- Fase 1 · Pre-sesión
update reglas set orden = 1 where codigo = 'chk_calendario';
update reglas set orden = 2 where codigo = 'chk_zonas';
update reglas set orden = 3 where codigo = 'chk_noticias';
update reglas set orden = 4 where codigo = 'chk_cuenta_pa';

-- Fase 2 · Lectura del setup (IRI: 1-4 · Reingreso: 1,5,6 · comunes: 7-8)
update reglas set orden = 1 where codigo = 'chk_contexto';
update reglas set orden = 2 where codigo = 'chk_5velas';
update reglas set orden = 3 where codigo = 'chk_estructura';
update reglas set orden = 4 where codigo = 'chk_consecucion';
update reglas set orden = 5 where codigo = 'rei_zona';
update reglas set orden = 6 where codigo = 'rei_entrada';
update reglas set orden = 7 where codigo = 'target_sin_zonas';
update reglas set orden = 8 where codigo = 'stop_max_puntos';

-- Fase 3 · Ejecución
update reglas set orden = 1 where codigo = 'chk_orden';
update reglas set orden = 2 where codigo = 'rr_1a1';
update reglas set orden = 3 where codigo = 'chk_mqzpxeub';
