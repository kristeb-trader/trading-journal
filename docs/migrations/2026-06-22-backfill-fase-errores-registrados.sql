-- ─────────────────────────────────────────────────────────────────────────
-- Backfill de la fase en los errores YA registrados (diagnostico_errores).
--
-- La fase del catálogo (catalogo_errores.fase) es el default para registros
-- nuevos; no toca los errores guardados antes. Esos quedaron con fase = null y
-- aparecen como "sin fase asignada" en el modal Errores por fase.
--
-- Copia la fase del catálogo a cada ocurrencia con fase null, emparejando por
-- nombre del error. Los errores de texto libre que no estén en el catálogo
-- quedan en null (no hay fase de referencia). Correr en el SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────

update diagnostico_errores de
set fase = ce.fase
from catalogo_errores ce
where de.error = ce.nombre
  and de.fase is null
  and ce.fase is not null;

-- Verificación (opcional): ocurrencias que siguen sin fase (errores fuera del catálogo)
--   select sesion_date, error from diagnostico_errores
--   where fase is null order by sesion_date desc;

notify pgrst, 'reload schema';
