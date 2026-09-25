-- Fase 7 · Fechas Especiales es la única lista de días de Fed (decisión de Kris, 24/09/2026).
--
-- Criterio del plan (la regla de la Fed): día con un evento de la Fed en ROJO en Forex Factory, el día
-- entero. El primer día de una reunión ("FOMC Day 1") no tiene nada en rojo: sale de la lista pasando a
-- tipo 'otro' — sigue en el calendario como información, pero ya no es día de Fed para la disciplina ni
-- para el motor. Solo los futuros: los "Day 1" anteriores al 24/09 son de la etapa 1 y no se tocan.

UPDATE public.catalogo_fechas
   SET tipo = 'otro'
 WHERE tipo = 'fomc' AND nombre = 'FOMC Day 1' AND fecha >= DATE '2026-09-24';
