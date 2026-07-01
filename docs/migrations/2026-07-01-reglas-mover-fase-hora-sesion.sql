-- 2026-07-01 — Reubicar reglas y mover la hora de la noticia a la sesión
--
-- 1) La regla parametrizable de 80 pts (stop_max_puntos) pasa de Riesgo a Reglas
--    (capa 'proceso'), conservando fase 2. Así aparece en Fase 2 con su input de puntos.
--    (Recordatorio: la regla duplicada de Fase 2 se elimina desde la UI con la papelera.)
update reglas set capa = 'proceso', fase = 2 where codigo = 'stop_max_puntos';

-- 2) "No operar con noticia roja activa" (chk_noticias) pasa de Riesgo a Reglas,
--    Fase 1 (compuerta de pre-sesión). Sigue siendo dura y checklist.
update reglas set capa = 'proceso', fase = 1 where codigo = 'chk_noticias';

-- 3) La hora de la noticia roja ahora se registra por día en la sesión (cambia cada
--    día), no en la regla. Nueva columna en `sesiones` (formato 'HH:MM', hora ET).
alter table sesiones add column if not exists hora_noticia_roja text;

-- Nota: la columna reglas.hora_noticia queda en desuso (se puede eliminar más
-- adelante): alter table reglas drop column if exists hora_noticia;

notify pgrst, 'reload schema';
