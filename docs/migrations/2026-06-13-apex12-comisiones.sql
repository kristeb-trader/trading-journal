-- ─────────────────────────────────────────────────────────────────────────
-- Apex-12: corrección de P&L con comisiones (NQ 3.98 RT, MNQ 1.02 RT por ctto)
-- P&L de NinjaTrader venía bruto. Balance y threshold recalculados.
-- Sigue quemada: balance final 49156.54 < threshold trailing ~49188.
-- Correr en Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────

do $$
declare cta_id bigint;
begin
  select id into cta_id from apex_cuentas where nombre = 'Apex-12';
  if cta_id is null then raise exception 'No existe la cuenta Apex-12'; end if;

  -- 06-10: 1 NQ → 3.98              |  06-11: 1 MNQ + 1 NQ → 5.00  |  06-12: 1 NQ → 3.98
  update apex_registros set pnl_dia =  1096.02, balance = 51096.02, threshold = 49115 where cuenta_id = cta_id and fecha = '2026-06-10';
  update apex_registros set pnl_dia = -1230.50, balance = 49865.52, threshold = 49188 where cuenta_id = cta_id and fecha = '2026-06-11';
  update apex_registros set pnl_dia =  -708.98, balance = 49156.54, threshold = 49188 where cuenta_id = cta_id and fecha = '2026-06-12';
end $$;
