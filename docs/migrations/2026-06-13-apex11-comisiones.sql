-- ─────────────────────────────────────────────────────────────────────────
-- Apex-11: corrección de P&L con comisiones (NQ 3.98 RT, MNQ 1.02 RT por ctto)
-- El P&L de NinjaTrader venía bruto. Se descuenta la comisión real por día.
-- Comisión/día = (contratos que rotaron) × round-trip del instrumento.
-- Balance recalculado; threshold sin cambio (la cuenta nunca superó 50K).
-- Correr en Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────

do $$
declare cta_id bigint;
begin
  select id into cta_id from apex_cuentas where nombre = 'Apex-11';
  if cta_id is null then raise exception 'No existe la cuenta Apex-11'; end if;

  -- 06-03: 1 NQ → 3.98   |  06-04: 14 MNQ → 14.28  |  06-05: 2 MNQ → 2.04
  -- 06-10: 2 MNQ → 2.04  |  06-12: 2 MNQ → 2.04
  update apex_registros set pnl_dia = -1603.98, balance = 48396.02 where cuenta_id = cta_id and fecha = '2026-06-03';
  update apex_registros set pnl_dia =   241.22, balance = 48637.24 where cuenta_id = cta_id and fecha = '2026-06-04';
  update apex_registros set pnl_dia =   233.96, balance = 48871.20 where cuenta_id = cta_id and fecha = '2026-06-05';
  update apex_registros set pnl_dia =   217.46, balance = 49088.66 where cuenta_id = cta_id and fecha = '2026-06-10';
  update apex_registros set pnl_dia =   209.96, balance = 49298.62 where cuenta_id = cta_id and fecha = '2026-06-12';
end $$;
