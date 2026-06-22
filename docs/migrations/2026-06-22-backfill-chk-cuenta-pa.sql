-- ─────────────────────────────────────────────────────────────────────────
-- Backfill de "Cuenta PA activa" (chk_cuenta_pa) en el historial.
--
-- Problema: el ítem se agregó el 2026-06-19 (default false), así que todas las
-- sesiones previas quedaron en false y la disciplina las contaba como FALLO,
-- cuando ese check ni existía aún. Empezaste a registrarlo de forma consistente
-- el 2026-06-02.
--
-- Solución: marcar chk_cuenta_pa = true en las sesiones ANTERIORES a 2026-06-02
-- (asumir cuenta correcta en ese periodo). Se PRESERVA el registro real desde
-- 2026-06-02 en adelante — incluido el fallo legítimo del 2026-06-18.
--
-- Actualiza la columna chk_cuenta_pa Y el JSONB sesiones.checklist (la app lee
-- del JSONB vía hidratación). Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

update sesiones
set chk_cuenta_pa = true,
    checklist = jsonb_set(coalesce(checklist, '{}'::jsonb), '{chk_cuenta_pa}', 'true'::jsonb)
where sesion_date < '2026-06-02'
  and chk_cuenta_pa is distinct from true;

-- Verificación (opcional): desde 2026-06-02 solo debería quedar 2026-06-18 en false
--   select sesion_date from sesiones
--   where sesion_date >= '2026-06-02' and chk_cuenta_pa is distinct from true
--   order by sesion_date;

notify pgrst, 'reload schema';
