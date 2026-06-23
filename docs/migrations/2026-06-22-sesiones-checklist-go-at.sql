-- ─────────────────────────────────────────────────────────────────────────
-- Sello de "visto bueno para operar" del checklist (AddOn NinjaTrader).
--
-- Cuando se pulsa GO en el panel de checklist (NT8) con el 100% marcado, se
-- guarda la marca de tiempo aquí. El Journal web puede mostrarlo como
-- "operativa aprobada a las HH:MM". Nullable; se resetea por sesión.
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

alter table sesiones add column if not exists checklist_go_at timestamptz;

notify pgrst, 'reload schema';
