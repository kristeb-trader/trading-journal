-- 2026-08-03 · Vínculo error → regla del checklist  (APLICADA vía MCP)
--
-- Problema: la Disciplina solo lee `sesion_checklist`, que es AUTO-REPORTADO por el
-- trader antes/durante la sesión. El 8-jul-2026 quedó así:
--     checklist  → "No operar con noticia roja activa" = true
--     diagnóstico→ error "FOMC": operó un IRI tendencial en día FOMC, a sabiendas
-- Nadie vuelve atrás a desmarcar la casilla, así que el día salía 100% de disciplina.
--
-- Solución: cada error puede apuntar a la regla que contradice. Si ese vínculo está
-- informado, la disciplina cuenta esa regla como INCUMPLIDA ese día aunque la casilla
-- esté en true. NULL = el error no toca ninguna regla del checklist (los psicológicos
-- —Miedo, Duda, Rabia, Ansiedad, FOMO— siguen contando solo en la tasa de errores).

ALTER TABLE diagnostico_errores
  ADD COLUMN IF NOT EXISTS regla_codigo TEXT
  REFERENCES catalogo_reglas(codigo) ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_diagnostico_errores_regla
  ON diagnostico_errores (sesion_date, regla_codigo)
  WHERE regla_codigo IS NOT NULL;

COMMENT ON COLUMN diagnostico_errores.regla_codigo IS
  'Regla del checklist que este error contradice (NULL = ninguna). Si está informada, la disciplina cuenta esa regla como incumplida ese día aunque la casilla esté marcada.';

-- Backfill de los errores históricos que mapean sin ambigüedad a una regla (8 filas).
-- El resto queda en NULL: se comportan igual que antes y el Coach los irá tipificando.
UPDATE diagnostico_errores SET regla_codigo = 'chk_noticias'    WHERE error = 'FOMC';
UPDATE diagnostico_errores SET regla_codigo = 'chk_no_mover'    WHERE error = 'Mover Stop';
UPDATE diagnostico_errores SET regla_codigo = 'chk_consecucion' WHERE error = 'Trade sin Consecución';
UPDATE diagnostico_errores SET regla_codigo = 'chk_orden'       WHERE error = 'Entrada Tardía';

NOTIFY pgrst, 'reload schema';

-- Verificación
SELECT de.error, de.regla_codigo, r.titulo, count(*) AS veces
FROM diagnostico_errores de
JOIN catalogo_reglas r ON r.codigo = de.regla_codigo
GROUP BY de.error, de.regla_codigo, r.titulo
ORDER BY de.error;
