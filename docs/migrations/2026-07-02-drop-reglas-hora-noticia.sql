-- 2026-07-02 — Eliminar la columna en desuso reglas.hora_noticia
--
-- La hora de la noticia roja se registra ahora por día en sesiones.hora_noticia_roja
-- (la escribe Registrar sesión en la web y el AddOn ChecklistChaumer de NinjaTrader).
-- Ningún código lee ni escribe reglas.hora_noticia → se elimina.

alter table reglas drop column if exists hora_noticia;

-- Refrescar el cache de esquema de PostgREST tras el ALTER.
notify pgrst, 'reload schema';
