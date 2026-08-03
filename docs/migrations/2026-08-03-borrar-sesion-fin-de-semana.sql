-- 2026-08-03 · Borrar la sesión del sábado 25-jul-2026 (basura del AddOn NT8)
--
-- Contexto: el AddOn `ChecklistChaumer` crea la fila de `sesiones` antes de escribir
-- en `sesion_checklist` (por la FK). Si NinjaTrader se abre un fin de semana, queda
-- una sesión fantasma con `no_opero=false` (default de la columna) que el cálculo de
-- disciplina interpretaba como día operado.
--
-- La sesión del 2026-07-25 (sábado) tenía 1/17 ítems y 0 trades. Se verificó que no
-- tenía diagnósticos, errores ni experimentos asociados; solo arrastra sus 17 filas
-- de `sesion_checklist` vía ON DELETE CASCADE.
--
-- Complementado por: guarda de fin de semana en el AddOn (no crea sesión sáb/dom) y
-- filtro de días hábiles en el cálculo de estadísticas (db.js).

DELETE FROM sesiones WHERE sesion_date = '2026-07-25';

-- Verificación: debe devolver 0
SELECT count(*) AS sesiones_fin_de_semana
FROM sesiones
WHERE extract(isodow FROM sesion_date) >= 6;
