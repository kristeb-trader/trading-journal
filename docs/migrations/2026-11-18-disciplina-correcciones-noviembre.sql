-- Las causas de noviembre que Kris corrigió el 18/11/2026, tras revisarlas vela a vela con él (tabla en
-- 2026-11-18-disciplina-correcciones.sql). Los tres días siguen en rojo; cambia la causa.
insert into disciplina_correcciones (fecha, regla, etiqueta, texto) values
  ('2026-11-05', 'consecucion', 'Sin consecución',
   'Reingreso alcista sobre el soporte de la 9:58: la vela de las 10:02 lo rompe (mínimo 27.433), pero ninguna pasa de ese mínimo antes de volver arriba. Sin una consecución que falle no hay reingreso'),
  ('2026-11-10', 'zona_mal_creada', 'Soporte mal creado',
   'Corto al romper un soporte que no existía: entre la resistencia de la 10:02 y la zona de premercado de la 4:01, el retroceso pasó del 50 % (bajó a 27.993,50; la mitad estaba en 28.002,6), y además nunca se confirmó'),
  ('2026-11-17', 'entrada_incorrecta', 'Entrada incorrecta',
   'Orden equivocada: entró en corto, y el setup que buscaba era un Reingreso alcista')
on conflict (fecha) do update set regla = excluded.regla, etiqueta = excluded.etiqueta, texto = excluded.texto;
