-- motor_fichas.origen_datos admite 'bot' (19/10/2026)
-- La ficha del motor se hace con las velas con las que decidió el bot en vivo (la ventana, de su archivo
-- datos/dia_bot/) sobre la exportación del servidor (el premercado). Diseño: docs/disenos/2026-10-19-velas-del-bot.md.
-- 'manual' y 'addon' siguen igual: son las fichas hechas solo con la exportación del servidor.

alter table public.motor_fichas drop constraint if exists motor_fichas_origen_datos_check;
alter table public.motor_fichas add constraint motor_fichas_origen_datos_check
  check (origen_datos = any (array['addon'::text, 'manual'::text, 'bot'::text]));

notify pgrst, 'reload schema';
