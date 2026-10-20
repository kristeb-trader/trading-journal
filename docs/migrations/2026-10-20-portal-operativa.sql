-- Operativa diaria en el portal (diseño docs/disenos/2026-10-20-operativa-diaria-portal.md, D-041).
--
-- Una vista con los trades de la cuenta principal del Journal, con la MISMA
-- forma que `portal_bt_jornadas`: una fila por día y sus operaciones en un
-- jsonb. Así la página del portal reutiliza el código de Backtesting.
--
-- · La cuenta principal se lee de `objetivos`: si cambia, la vista la sigue.
-- · Solo desde el 21/10/2026 (decisión del operador, 20/10/2026): lo anterior
--   era otra etapa y no sale, ni siquiera en la curva.
-- · Un día sin trades sale solo si la sesión dice `no_opero`, con el motivo.
-- · El análisis del día (`sesiones.analisis_trader`) es del DÍA, no del trade:
--   va en las observaciones de la primera operación, que es donde la página
--   pinta también el gráfico.
-- · Corre con los permisos de su dueño (no `security_invoker`), como las de
--   Backtesting: `portal_lector` lee las filas sin tocar `trades` ni `sesiones`.

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
                  'pnl', o.profit,
                  'observaciones', case when o.orden = 1 then s.analisis_trader end)
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
