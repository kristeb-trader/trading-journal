-- La foto del día con sus placas (25/11/2026). FotoChaumer arma desde hoy la imagen con la placa de arriba
-- (fecha y entrada) y la de abajo (resultado, puntos, contratos, P&L, setup o motivo). Esta columna dice que la
-- imagen del día ya las lleva, para que el visor no las repita. Los días anteriores quedan en false: no se tocan.
-- Si Kris sube otra imagen a mano en el Diario, el Diario la vuelve a poner en false.
alter table public.sesiones
  add column if not exists imagen_placas boolean not null default false;

comment on column public.sesiones.imagen_placas is
  'La imagen del día (imagen_url) ya lleva las placas de FotoChaumer: el visor no pone su placa ni su banner.';

notify pgrst, 'reload schema';
