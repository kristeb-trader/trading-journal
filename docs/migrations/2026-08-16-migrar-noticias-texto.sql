-- ═══════════════════════════════════════════════════════════════════════════
-- Migrar `sesiones.noticias` (texto libre) → `sesion_noticias`
-- 2026-08-16
--
-- POR QUÉ
-- El formulario tenía DOS bloques de noticias: el textarea libre «Noticias del
-- día» (`sesiones.noticias`) y las «Noticias rojas» estructuradas
-- (`sesion_noticias`, Ago 2026). Se unifica en el segundo; antes de quitar el
-- textarea de la UI hay que rescatar lo que solo vive ahí.
--
-- QUÉ SE MIGRA — 37 días con texto:
--   · 22 días dicen «Sin Noticias» / «Nada Importante» / «Ninguna» → nada que
--     migrar (ausencia de noticia no es una noticia).
--   · 7 días YA tienen su fila de noticia roja pero con `nombre` NULL (las creó
--     el backfill de agosto desde `hora_noticia_roja`): el texto aporta el
--     NOMBRE → se completa con UPDATE.
--   · 9 filas nuevas: días con noticia en el texto que no tenían fila.
--
-- El parseo se hace A MANO (son ~16 registros) en vez de con una regex: los
-- formatos son irregulares ("7:30am", "07:30 a.m", "01:00 p.m", "1:30PM",
-- "9:00 am —>") y una fila mal parseada mueve una ventana de ±5 min.
--
-- UNA NOTICIA POR HORA: la tabla tiene UNIQUE (sesion_date, hora). Los días en
-- que el texto lista varias cifras a la misma hora (el CPI del 14-jul publica 4)
-- son UN solo evento con UNA ventana → se agrupan en una fila.
--
-- VERIFICADO ANTES DE APLICAR: ningún trade del histórico cae dentro de ±5 min
-- de las horas nuevas, así que la disciplina ya calculada NO cambia.
--
-- `sesiones.noticias` NO se borra: el texto original se conserva por si acaso.
-- La UI simplemente deja de mostrarlo.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Completar el nombre de las filas que el backfill dejó en NULL ────────
update sesion_noticias set nombre = 'Fed Chairman Warsh Testifies' where sesion_date = '2026-07-15' and hora = '09:00' and nombre is null;
update sesion_noticias set nombre = 'Fed Chairman Warsh Testifies' where sesion_date = '2026-07-14' and hora = '09:00' and nombre is null;
update sesion_noticias set nombre = 'Unemployment Claims'          where sesion_date = '2026-07-09' and hora = '07:30' and nombre is null;
update sesion_noticias set nombre = 'FOMC Meeting Minutes'         where sesion_date = '2026-07-08' and hora = '13:00' and nombre is null;
update sesion_noticias set nombre = 'ISM Services PMI'             where sesion_date = '2026-07-06' and hora = '09:00' and nombre is null;
update sesion_noticias set nombre = 'Average Hourly Earnings m/m'  where sesion_date = '2026-07-02' and hora = '07:30' and nombre is null;
update sesion_noticias set nombre = 'ISM Manufacturing PMI'        where sesion_date = '2026-07-01' and hora = '09:00' and nombre is null;

-- ── 2. Noticias que solo estaban en el texto ───────────────────────────────
-- El trigger de `sesion_noticias` recalcula `sesiones.hora_noticia_roja`, así
-- que el 14 y el 15 de julio pasan de "09:00" a "07:30,09:00" y la ventana de
-- ±5 min empieza a cubrir también la publicación de la mañana.
insert into sesion_noticias (sesion_date, hora, nombre) values
  ('2026-07-15', '07:30', 'Core PPI m/m · PPI m/m'),
  ('2026-07-14', '07:30', 'Core CPI m/m · Core CPI y/y · CPI m/m · CPI y/y'),
  ('2026-06-25', '07:30', 'Core PCE Price Index m/m'),
  ('2026-06-17', '13:00', 'FOMC Economic Projections'),
  ('2026-06-17', '13:30', 'FOMC Press Conference'),
  ('2026-06-11', '07:30', 'Core PPI m/m'),
  ('2026-06-10', '07:30', 'Core CPI m/m'),
  ('2026-06-05', '07:30', 'Unemployment Rate'),
  ('2026-06-03', '09:00', 'ISM Services PMI')
on conflict (sesion_date, hora) do nothing;

notify pgrst, 'reload schema';

-- Verificación:
--   select sesion_date, hora, nombre from sesion_noticias order by sesion_date desc;
--   select count(*) from sesion_noticias where nombre is null;   -- debe ser 0
--   select sesion_date, hora_noticia_roja from sesiones
--     where sesion_date in ('2026-07-14','2026-07-15');          -- "07:30,09:00"
