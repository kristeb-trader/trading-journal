-- ═══════════════════════════════════════════════════════════════════════════
-- sesiones.setup_codigo — sincronización automática (Fase B)
-- 2026-07-24
--
-- POR QUÉ
-- La web guarda la sesión a través del Worker `/api/session`, que NO está
-- versionado en este repo: no se puede garantizar que propague una columna
-- nueva. El bot de Telegram y los indicadores NT8 escriben por su cuenta.
--
-- En vez de tocar cuatro escritores, la BD deriva `setup_codigo` sola:
--   · si llega `setup_codigo` → manda ese, y se rellena el texto legacy
--   · si llega solo `setup` (texto) → se busca la variante por nombre
--   · texto desconocido → setup_codigo = null (no rompe la escritura)
--
-- Así `sesiones.setup` (texto) y `sesiones.setup_codigo` (FK) no se pueden
-- desincronizar, venga la escritura de donde venga.
-- ═══════════════════════════════════════════════════════════════════════════

-- OJO: hay que comparar contra OLD. Un primer intento hacía ganar siempre a
-- `setup_codigo` cuando no era null, y eso REVERTÍA en silencio el cambio de
-- setup en sesiones existentes (el Worker y el bot mandan solo el texto, así
-- que el código viejo pisaba el nuevo). El código solo manda si ES el que cambió.
create or replace function fn_sync_setup_codigo()
returns trigger
language plpgsql
as $$
declare
  v_codigo text;
  v_nombre text;
  codigo_cambio boolean;
  texto_cambio  boolean;
begin
  if tg_op = 'INSERT' then
    codigo_cambio := new.setup_codigo is not null;
    texto_cambio  := new.setup is not null;
  else
    codigo_cambio := new.setup_codigo is distinct from old.setup_codigo;
    texto_cambio  := new.setup is distinct from old.setup;
  end if;

  -- 1) El código manda SOLO si es el que cambió: se rellena el texto legacy.
  if codigo_cambio and new.setup_codigo is not null then
    select nombre into v_nombre
      from catalogo_setup_variantes
     where codigo = new.setup_codigo;
    if v_nombre is not null then
      new.setup := v_nombre;
    end if;
    return new;
  end if;

  -- 2) Cambió el texto (o no hay código): se deriva del texto.
  if texto_cambio or new.setup_codigo is null then
    if new.setup is null or btrim(new.setup) = '' then
      new.setup_codigo := null;
    else
      select codigo into v_codigo
        from catalogo_setup_variantes
       where lower(btrim(new.setup)) = lower(btrim(nombre))
       limit 1;
      new.setup_codigo := v_codigo;   -- null si el texto no está en el catálogo
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_sync_setup_codigo on sesiones;
create trigger trg_sync_setup_codigo
  before insert or update of setup, setup_codigo on sesiones
  for each row execute function fn_sync_setup_codigo();

notify pgrst, 'reload schema';

-- Verificación:
--   update sesiones set setup = 'Reingreso Bajista' where sesion_date = '...';
--   select setup, setup_codigo from sesiones where sesion_date = '...';
