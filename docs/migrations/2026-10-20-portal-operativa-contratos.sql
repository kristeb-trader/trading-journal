-- Operativa diaria del portal: cada operación lleva sus contratos (`trades.qty`),
-- para la ficha de la lupa (fecha arriba; setup, resultado, puntos, contratos y
-- P&L abajo). Petición de Kris, 20/10/2026. Solo añade esa clave; el resto es
-- la vista de 2026-10-20-portal-operativa-notas.sql.
--
-- ⚠️ Con la prueba temporal de octubre activa, en la BD la vista arranca el
-- 01/10 (tasks/current.md). Este archivo describe el estado definitivo.

create or replace view portal_op_jornadas as
with principal as (
  select cuenta_principal as cuenta from objetivos limit 1
),
ops as (
  select t.*,
         row_number() over (partition by t.trade_date order by t.entry_time, t.trade_number) as orden
  from trades t
  join principal p on t.account = p.cuenta
  where t.trade_date >= date '2026-10-21'
),
dias as (
  select distinct trade_date as fecha from ops
  union
  select sesion_date from sesiones
  where no_opero is true and sesion_date >= date '2026-10-21'
)
select d.fecha,
       s.imagen_url as imagen,
       -- Las notas de la jornada solo se pintan en un día sin operación.
       case when s.no_opero is true then s.motivo_no_opero end as notas,
       coalesce((
         select jsonb_agg(jsonb_build_object(
                  'id', o.trade_number,
                  'orden', o.orden,
                  'hora', to_char(o.entry_time, 'HH24:MI'),
                  'direccion', case o.market_pos when 'Long' then 'largo' when 'Short' then 'corto' end,
                  'setup', case
                             when s.setup_codigo like 'continuacion%' then 'continuacion'
                             when s.setup_codigo like 'reingreso%' then 'reingreso'
                           end,
                  'puntos', abs(o.exit_price - o.entry_price),
                  'resultado', o.resultado,
                  'comision', o.commission,
                  'contratos', o.qty,
                  'pnl', o.profit,
                  'observaciones', case when o.orden = 1 then s.resumen_ia end)
                order by o.orden)
         from ops o where o.trade_date = d.fecha
       ), '[]'::jsonb) as operaciones
from dias d
left join sesiones s on s.sesion_date = d.fecha;

-- Supabase concede todo objeto nuevo de `public` a anon y authenticated. En una
-- vista que salta RLS eso sería una puerta abierta: fuera.
revoke all on portal_op_jornadas from anon, authenticated, public;
grant select on portal_op_jornadas to portal_lector, service_role;

notify pgrst, 'reload schema';
