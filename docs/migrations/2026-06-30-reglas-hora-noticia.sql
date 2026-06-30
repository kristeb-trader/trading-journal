-- 2026-06-30 — Hora de la noticia roja en la regla del calendario económico
-- La regla `chk_noticias` (Calendario económico verificado) lleva la hora de la
-- noticia de alto impacto del día. La web calcula y muestra la ventana de bloqueo
-- ±5 min (no operar). Formato 'HH:MM' (hora ET, como el resto del journal).

alter table reglas add column if not exists hora_noticia text;

-- Refrescar el cache de esquema de PostgREST tras el ALTER.
notify pgrst, 'reload schema';
