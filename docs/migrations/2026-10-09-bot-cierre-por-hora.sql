-- bot_operaciones acepta el resultado 'CIERRE POR HORA' (plan 3.46, 09/10/2026, R-33).
--
-- Por qué: el plan tiene una tercera salida. Lo que siga abierto a las 16:50 de Nueva York (CIERRE_POR_HORA)
-- se cierra a mercado y se apunta como CIERRE POR HORA, con sus puntos. BotChaumer lo escribe en esta tabla;
-- sin este cambio, la fila de ese día la rechazaría la restricción y el día se quedaría sin resultado.
-- Solo amplía la lista: ninguna fila existente cambia.

alter table bot_operaciones drop constraint if exists bot_operaciones_resultado_check;
alter table bot_operaciones add constraint bot_operaciones_resultado_check
  check (resultado in ('EN CURSO', 'TARGET', 'STOP', 'CIERRE POR HORA', 'ABIERTO', 'NO OPERA', 'NO ARMADO'));

notify pgrst, 'reload schema';
