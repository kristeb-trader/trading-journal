-- El aviso de disciplina por Telegram, una sola vez por día (10/11/2026, D-052).
--
-- La pone el bot de Telegram al mandar «🎯 Disciplina» del día: al cerrar el registro, o cuando la
-- cadena avisa (`/disciplina`) si el registro llegó antes que el motor. Ni la web ni el bot la mandan
-- en el payload de la sesión, así que no la pisan.

alter table sesiones add column if not exists disciplina_avisada_at timestamptz;

notify pgrst, 'reload schema';
