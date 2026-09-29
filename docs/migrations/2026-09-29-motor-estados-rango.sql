-- motor_estados(desde, hasta): el estado de la ficha del motor de un rango de días
--
-- El calendario de Claude (docs/disenos/2026-09-29-cuatro-calendarios.md §3.3)
-- necesita saber, para un mes entero, qué días tienen ficha pero siguen cerrados
-- por el candado (D-026). `motor_estado(fecha)` ya lo dice, pero día a día: esto
-- es la misma lógica para un rango, en una sola llamada.
--
-- Solo devuelve (fecha, estado). NUNCA la ficha, los puntos ni la operación: la
-- política `candado` de motor_fichas no se toca y sigue siendo la única puerta a
-- los datos. Un día sin registrar sale como 'bloqueada', igual que en motor_estado.
--
-- Reversión: drop function public.motor_estados(date, date);

create or replace function public.motor_estados(p_desde date, p_hasta date)
returns table (fecha date, estado text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select m.fecha,
         case when motor_dia_registrado(m.fecha) then m.estado else 'bloqueada' end
    from motor_fichas m
   where m.fecha between p_desde and p_hasta
   order by m.fecha
$$;

revoke all on function public.motor_estados(date, date) from public, anon;
grant execute on function public.motor_estados(date, date) to authenticated, service_role;
