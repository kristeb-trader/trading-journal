-- Fechas Especiales: el calendario de la Fed, completo hacia atrás (decisión de Kris, 28/09/2026, opción A).
--
-- Fuente: la Reserva Federal (calendario del FOMC), consultada el 28/09/2026. Criterio del plan (R-36):
-- día de Fed = día con un evento rojo de la Fed en Forex Factory, la sesión entera.
--
-- 1 · Los "FOMC Day 1" que quedaban (los anteriores al 24/09) pasan a tipo 'otro', como hizo
--     2026-09-24-fed-day1-a-otro.sql con los futuros: el primer día de la reunión no publica nada.
--     Efecto en la disciplina: ninguno (el único con sesión, 17/03/2026, no tuvo operaciones).
--     Se deshace con: UPDATE catalogo_fechas SET tipo='fomc' WHERE tipo='otro' AND nombre='FOMC Day 1' AND fecha < '2026-09-24';
-- 2 · Las actas (minutes, 14:00 ET, tres semanas después de cada decisión) que faltaban: 15.
--     Las de oct/nov/dic de 2026 son las previstas. Efecto aceptado por Kris: el 08/04/2026 operó una
--     Continuación en día de actas, y la regla de la etapa 1 «en día de Fed solo reingreso» cuenta
--     incumplida: la disciplina de abril baja un punto.

UPDATE public.catalogo_fechas
   SET tipo = 'otro'
 WHERE tipo = 'fomc' AND nombre = 'FOMC Day 1';

INSERT INTO public.catalogo_fechas (fecha, tipo, nombre, emoji, notas, activa)
SELECT v.fecha::date, 'fomc', 'FOMC Minutes (actas)', '🏛️', v.notas, true
  FROM (VALUES
    ('2025-01-08', 'actas de la reunión de dic-2024'),
    ('2025-02-19', 'actas de la reunión de enero'),
    ('2025-04-09', 'actas de la reunión de marzo'),
    ('2025-05-28', 'actas de la reunión de mayo'),
    ('2025-07-09', 'actas de la reunión de junio'),
    ('2025-08-20', 'actas de la reunión de julio'),
    ('2025-10-08', 'actas de la reunión de septiembre'),
    ('2025-11-19', 'actas de la reunión de octubre'),
    ('2025-12-30', 'actas de la reunión de diciembre'),
    ('2026-02-18', 'actas de la reunión de enero'),
    ('2026-04-08', 'actas de la reunión de marzo'),
    ('2026-05-20', 'actas de la reunión de abril'),
    ('2026-10-07', 'actas de la reunión de septiembre (prevista)'),
    ('2026-11-18', 'actas de la reunión de octubre (prevista)'),
    ('2026-12-30', 'actas de la reunión de diciembre (prevista)')
  ) AS v(fecha, notas)
 WHERE NOT EXISTS (SELECT 1 FROM public.catalogo_fechas c WHERE c.fecha = v.fecha::date AND c.tipo = 'fomc');
