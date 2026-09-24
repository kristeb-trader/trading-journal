-- Guardar una jornada de backtesting desde el Journal: jornada + operaciones, todo o nada.
-- Fase 4b de docs/disenos/2026-09-24-unificacion-chaumer.md.
--
-- Por qué una función y no varias llamadas desde el navegador: corregir una jornada
-- es actualizarla, borrar sus operaciones e insertar las nuevas. Hecho en tres
-- peticiones, un corte a medias deja una jornada sin operaciones o con el P&L viejo.
-- Aquí va en una sola transacción.
--
-- La aritmética es la del portal (functions/api/backtesting/_comun.js, hasta el 24/09):
--   comision_op = round(comision × contratos, 2)
--   pnl         = round(±puntos × valor_punto × contratos − comision_op, 2)   (− si stop)
-- El P&L se guarda NETO y se calcula AQUÍ, al escribir; nunca al mostrar.
--
-- Congelado: una jornada NUEVA toma instrumento, contratos, valor_punto y comisión de
-- bt_cabecera. Una jornada que se CORRIGE conserva los suyos: cambiar los datos de
-- inicio no reescribe el pasado (DISENO_BACKTESTING.md). El portal, al corregir,
-- volvía a coger los de la cabecera; eso contradecía su propio diseño.
--
-- security invoker: corre con los permisos de quien llama (authenticated → auth_all).

create or replace function bt_guardar_jornada(p jsonb)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id     bigint := nullif(p->>'id', '')::bigint;
  v_fecha  date   := nullif(p->>'fecha', '')::date;
  v_imagen text   := nullif(btrim(p->>'imagen'), '');
  v_notas  text   := nullif(btrim(p->>'notas'), '');
  v_ops    jsonb  := coalesce(p->'operaciones', '[]'::jsonb);
  v_instr  text;
  v_contr  integer;
  v_vp     numeric;
  v_com    numeric;
  v_comop  numeric;
  v_pts    numeric;
  o        jsonb;
  n        integer := 0;
begin
  if v_fecha is null then
    raise exception 'Falta la fecha de la jornada';
  end if;
  if jsonb_typeof(v_ops) <> 'array' or jsonb_array_length(v_ops) > 20 then
    raise exception 'Las operaciones no son una lista válida';
  end if;

  if v_id is null then
    select instrumento, contratos, valor_punto, comision
      into v_instr, v_contr, v_vp, v_com
      from bt_cabecera where id = 1;
    if not found then
      raise exception 'Faltan los datos de inicio del backtesting';
    end if;
    insert into bt_jornadas (fecha, instrumento, contratos, valor_punto, comision, imagen, notas)
    values (v_fecha, v_instr, v_contr, v_vp, v_com, v_imagen, v_notas)
    returning id into v_id;
  else
    update bt_jornadas
       set fecha = v_fecha, imagen = v_imagen, notas = v_notas, actualizada_en = now()
     where id = v_id
    returning instrumento, contratos, valor_punto, comision
      into v_instr, v_contr, v_vp, v_com;
    if not found then
      raise exception 'Esa jornada no existe';
    end if;
    delete from bt_operaciones where jornada_id = v_id;
  end if;

  v_comop := round(v_com * v_contr, 2);

  for o in select value from jsonb_array_elements(v_ops) loop
    v_pts := (o->>'puntos')::numeric;
    if v_pts is null or v_pts < 0 then
      raise exception 'Los puntos van siempre en positivo: el signo lo pone el resultado';
    end if;
    insert into bt_operaciones
      (jornada_id, orden, hora, direccion, setup, puntos, resultado, comision, pnl, observaciones)
    values
      (v_id, n, o->>'hora', o->>'direccion', o->>'setup', v_pts, o->>'resultado', v_comop,
       round((case when o->>'resultado' = 'stop' then -1 else 1 end) * v_pts * v_vp * v_contr - v_comop, 2),
       nullif(btrim(o->>'observaciones'), ''));
    n := n + 1;
  end loop;

  return v_id;
end
$$;

-- Solo la sesión de Kris (y los procesos con service_role). Ni anon ni el portal.
revoke all on function bt_guardar_jornada(jsonb) from public, anon;
grant execute on function bt_guardar_jornada(jsonb) to authenticated, service_role;

notify pgrst, 'reload schema';
