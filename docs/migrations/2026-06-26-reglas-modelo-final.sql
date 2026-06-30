-- ─────────────────────────────────────────────────────────────────────────
-- RULEBOOK — Modelo final aprobado (2026-06-26).
--
-- 3 capas: filosofia / proceso (con fases; "setup" como ETIQUETA) / riesgo.
-- Una regla = una fila. `es_checklist`+`fase` deciden su aparición en el
-- checklist diario. Reglas DURAS transversales viven SOLO en riesgo.
--
-- Conserva los `codigo` del checklist existentes (ligados a sesiones.checklist),
-- solo re-etiqueta. Las filas viejas de capa 'setup' se borran (su contenido
-- está respaldado en setup_reglas_archivada). FILOSOFÍA no se toca aquí (el
-- trader la reorganiza/afina en el editor).
-- Re-ejecutable. Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────

-- ── PROCESO · Fase 1 (Pre-sesión) ──
update reglas set capa='proceso', fase=1, setup=null, tipo='dura', es_checklist=true, activa=true,
  titulo='Cuenta PA activa verificada' where codigo='chk_cuenta_pa';
update reglas set capa='proceso', fase=1, setup=null, tipo='dura', es_checklist=true, activa=true,
  titulo='Zonas vigentes marcadas' where codigo='chk_zonas';

-- ── PROCESO · Fase 2 (Lectura del setup) — IRI (etiqueta setup='iri') ──
update reglas set capa='proceso', fase=2, setup='iri', tipo='dura', es_checklist=true, activa=true,
  titulo='Contexto / tendencia a favor',
  enunciado='El IRI se opera a favor de la tendencia/contexto del día.' where codigo='chk_contexto';
update reglas set capa='proceso', fase=2, setup='iri', tipo='dura', es_checklist=true, activa=true,
  titulo='Estructura I-R-I fluida',
  enunciado='Impulso 1 → Retroceso → Impulso 2 (consecución), estructura fluida.' where codigo='chk_estructura';
update reglas set capa='proceso', fase=2, setup='iri', tipo='dura', es_checklist=true, activa=true,
  titulo='Impulso 1 no sobreextendido (~5 velas)' where codigo='chk_5velas';
update reglas set capa='proceso', fase=2, setup='iri', tipo='dura', es_checklist=true, activa=true,
  titulo='Rompimiento de zona + consecución = entrada',
  enunciado='Tras el retroceso, esperar que el precio rompa la zona (alto/bajo del impulso 1). La entrada es una orden stop 1 tick sobre el máximo de la vela de rompimiento (1 tick bajo el mínimo si es bajista).' where codigo='chk_consecucion';

insert into reglas (codigo, titulo, enunciado, capa, tipo, fase, setup, direccion, es_checklist, estado, orden, activa) values
  ('iri_zona', 'Zona gris marcada en el extremo del impulso 1',
   'La zona gris (S/R) se marca en el punto más alto (alcista) o más bajo (bajista) —cuerpo + mecha— de la corrida del impulso 1, donde inicia el retroceso. Es el nivel de rompimiento.',
   'proceso', 'dura', 2, 'iri', 'ambas', true, 'vigente', 3, true)
on conflict (codigo) do update set titulo=excluded.titulo, enunciado=excluded.enunciado,
  capa='proceso', tipo='dura', fase=2, setup='iri', es_checklist=true, activa=true;

-- ── PROCESO · Fase 2 — Reingreso (etiqueta setup='reingreso') ──
insert into reglas (codigo, titulo, enunciado, capa, tipo, fase, setup, direccion, es_checklist, estado, orden, activa) values
  ('rei_zona', '2º intento a zona importante + fallo + reversión',
   'El reingreso se activa cuando el precio llega por 2ª vez a una zona importante, la consecución del IRI FALLA y se da una reversión en la zona gris.',
   'proceso', 'dura', 2, 'reingreso', 'ambas', true, 'vigente', 10, true),
  ('rei_entrada', 'Entrada del reingreso (1 tick sobre la vela de reingreso)',
   'Esperar el cierre de la vela de reingreso; en la vela siguiente (consecución) la entrada es una orden stop 1 tick sobre el máximo de la vela de reingreso (1 tick bajo el mínimo si es bajista).',
   'proceso', 'dura', 2, 'reingreso', 'ambas', true, 'vigente', 11, true)
on conflict (codigo) do update set titulo=excluded.titulo, enunciado=excluded.enunciado,
  capa='proceso', tipo='dura', fase=2, es_checklist=true, activa=true;

-- ── PROCESO · Fase 3 (Ejecución) ──
update reglas set capa='proceso', fase=3, setup=null, tipo='dura', es_checklist=true, activa=true,
  titulo='Orden stop precolocada 1 tick más allá, a tiempo' where codigo='chk_orden';

-- ── RIESGO (DURAS transversales; se marcan en el checklist) ──
update reglas set capa='riesgo', tipo='dura', es_checklist=true, fase=1, setup=null, activa=true,
  titulo='No operar con noticia roja activa' where codigo='chk_noticias';
update reglas set capa='riesgo', tipo='dura', es_checklist=true, fase=2, setup=null, activa=true
  where codigo='stop_max_puntos';

insert into reglas (codigo, titulo, enunciado, capa, tipo, fase, direccion, es_checklist, estado, orden, activa) values
  ('target_sin_zonas', 'Target sin zonas en contra',
   'Entre el precio de entrada y el target NO debe haber ninguna zona vigente en contra.',
   'riesgo', 'dura', 2, 'ambas', true, 'vigente', 5, true),
  ('rr_1a1', 'R:R siempre 1:1 — nunca mover stop ni target',
   'El ratio es SIEMPRE 1:1: el target equivale a la distancia entrada→mínimo del retroceso (el stop). Una vez colocada la orden, NUNCA se mueve el stop ni el target.',
   'riesgo', 'dura', 3, 'ambas', true, 'vigente', 6, true)
on conflict (codigo) do update set titulo=excluded.titulo, enunciado=excluded.enunciado,
  capa='riesgo', tipo='dura', es_checklist=true, activa=true;

update reglas set capa='riesgo', tipo='blanda', es_checklist=false, setup=null, activa=true
  where codigo='no_fomc';

-- ── Borrar filas viejas de capa 'setup' (respaldadas en setup_reglas_archivada) ──
delete from reglas where capa='setup';

notify pgrst, 'reload schema';

-- Verificación:
--   select capa, fase, setup, codigo, tipo, es_checklist, titulo
--   from reglas where activa order by capa, fase, orden;
