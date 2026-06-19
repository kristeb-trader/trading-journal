-- ─────────────────────────────────────────────────────────────────────────
-- Nuevo ítem del checklist Pre-Sesión: "¿Cuenta PA activa?" (verificación
-- visual de la cuenta correcta antes de operar). Se guarda y cuenta en la
-- métrica de Disciplina (ahora 7 ítems por día operado). Default false.
-- Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

alter table sesiones add column if not exists chk_cuenta_pa boolean default false;
