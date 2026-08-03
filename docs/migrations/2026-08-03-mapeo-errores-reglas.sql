-- 2026-08-03 · Mapeo error → regla del checklist, 2ª tanda  (APLICADA vía MCP)
--
-- Continúa `2026-08-03-errores-regla-codigo.sql`, que vinculó los 4 errores evidentes
-- (FOMC, Mover Stop, Trade sin Consecución, Entrada Tardía = 8 registros).
--
-- Aquí se revisaron los 38 errores que quedaban sin vínculo y se mapearon 5 nombres
-- más (13 registros). Los 25 restantes se dejan en NULL a propósito:
--   · Psicológicos (16): Miedo, Duda, Rabia, Ansiedad, Baja Confianza, FOMO,
--     Sobreconfianza, Sobre-Apalancamiento, Dos trades, Confundir Reglas.
--     No hay casilla que prevenga sentir miedo — cuentan solo en la tasa de errores.
--   · Condiciones de mercado (4): 3ª Corrida, Contra Máximo Histórico, Contra Máximo
--     Premercado, Contra Mínimo Premercado. Viven en el Laboratorio de Experimentos,
--     que es donde se decide si merecen ser regla; vincularlas adelantaría esa decisión.
--   · Ya contados o sin regla equivalente (5): Checklist Incompleto (el error ES que
--     había casillas en ✗ → restaría dos veces), Entrada con Filtros en Rojo ×2 (no
--     dice qué filtro; la del 17-jun ya la cubre el error FOMC del mismo día),
--     Descartar Setup Válido ×2 (no existe regla que obligue a tomar todo setup válido).

-- Evidencia literal del diagnóstico: "Zona naranja vigente entre entrada y target —
-- no fue verificada antes de entrar, violando target_sin_zonas".
UPDATE diagnostico_errores SET regla_codigo = 'target_sin_zonas'
  WHERE error = 'Contra Soporte' AND regla_codigo IS NULL;

-- Es exactamente lo que previene esa casilla.
UPDATE diagnostico_errores SET regla_codigo = 'chk_cuenta_pa'
  WHERE error = 'Entré en Sim y no Real' AND regla_codigo IS NULL;

-- "el trader reconoció que el IRI no era claro ni fluido".
UPDATE diagnostico_errores SET regla_codigo = 'chk_estructura'
  WHERE error = 'IRIs Poco Claros' AND regla_codigo IS NULL;

-- El nombre despista: el detalle dice "stop de 73 puntos supera el límite... entró igual".
UPDATE diagnostico_errores SET regla_codigo = 'stop_max_puntos'
  WHERE error = 'Target Largo' AND regla_codigo IS NULL;

-- Decisión de Kris: marcar mal una zona = falló el rompimiento + consecución (no
-- "zonas vigentes"). Lo confirma el dato: en 3 de los 7 días esa casilla YA estaba en
-- false, o sea que el trader ya reconocía ese fallo concreto.
-- Nota: `chk_consecucion` es exclusiva de IRI y de Fase 2, así que solo surte efecto en
-- días operados con setup IRI (2 de los 7 casos tumban una casilla que estaba en true;
-- los otros 5 quedan documentados sin restar de nuevo).
UPDATE diagnostico_errores SET regla_codigo = 'chk_consecucion'
  WHERE error = 'Error de Marcación' AND regla_codigo IS NULL;

-- Impacto medido (disciplina por mes, antes → después):
--   feb 75,6 → 75,0 | mar 64,2 = | abr 71,1 → 70,2 | may 89,9 = |
--   jun 96,2 → 95,1 | jul 99,3 = | GLOBAL 81,5 → 81,0
-- Solo 5 casillas cambian de estado; el resto de vínculos apuntan a casillas que el
-- trader ya había dejado sin marcar, así que documentan sin penalizar dos veces.

-- Verificación
SELECT r.titulo AS regla, de.error, count(*) AS veces
FROM diagnostico_errores de
JOIN catalogo_reglas r ON r.codigo = de.regla_codigo
GROUP BY r.titulo, de.error
ORDER BY r.titulo, de.error;
