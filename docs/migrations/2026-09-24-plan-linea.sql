-- Posición de cada línea en la checklist diaria del plan. Fase 5c de
-- docs/disenos/2026-09-24-etapa-plan-chaumer.md.
--
-- Estrategia enseña la checklist del plan en el mismo orden que el documento de Cowork.
-- `orden` no sirve para eso: decide el orden del checklist en el Diario y en NinjaTrader,
-- donde la casilla tiene que ir antes del GO. Desde aquí, scripts/plan/sincronizar.mjs
-- la rellena en cada sincronización.

alter table catalogo_reglas add column if not exists plan_linea smallint;
comment on column catalogo_reglas.plan_linea is
  'Posición (1…) de la línea en chaumer/01_Plan/CHECKLIST_DIARIA.md. Solo en origen plan_linea.';

update catalogo_reglas c set plan_linea = v.n
  from (values ('p2_g_7ca8fa6a',1),('p2_g_56e12136',2),('p2_g_c2fe2169',3),('p2_g_3c6db45c',4),('p2_g_d5a65697',5),('p2_g_954acdc6',6),('p2_g_f322eb01',7),('p2_g_bdc4380f',8),('p2_g_88dfc66e',9),('p2_g_ad8984a6',10),('p2_g_05dcd39d',11),('p2_g_32e3a881',12),('p2_g_509ccd8b',13),('p2_g_882c476d',14),('p2_corrida_fluida',15),('p2_g_3891b80b',16),('p2_g_a82d169d',17),('p2_g_fad99fde',18),('p2_stop_max',19),('p2_g_9e2b60e5',20),('p2_punto_referencia',21),('p2_g_0525f6f2',22),('p2_fomc_continuacion',23),('p2_noticia',24),('p2_g_8a5d31d2',25),('p2_instrumento',26),('p2_g_c214cf46',27),('p2_g_ed59f89a',28),('p2_g_ed096ec1',29),('p2_g_3e1b11b1',30),('p2_g_ec38f419',31),('p2_g_32941671',32),('p2_g_ab1071ef',33),('p2_g_c71bf461',34),('p2_g_9963d984',35),('p2_g_218eb551',36),('p2_una_operacion',37),('p2_g_47bfb2ed',38),('p2_g_411dcd27',39),('p2_g_a2236380',40),('p2_g_4d13fb5a',41),('p2_g_2fbe48dc',42),('p2_g_7e25f57a',43),('p2_g_e84a5159',44),('p2_g_609eb8eb',45),('p2_g_230aec35',46),('p2_g_52b219ac',47),('p2_g_34ed8946',48)) as v(codigo, n)
 where c.codigo = v.codigo;

notify pgrst, 'reload schema';
