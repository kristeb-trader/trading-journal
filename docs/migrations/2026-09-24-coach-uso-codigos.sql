-- coach_uso.codigos_quitados: cuántos códigos del plan (R-40, P-22, G-12, D-06, C-01) coló el
-- modelo entre paréntesis en esa respuesta y quitó el vigilante de js/coach.js antes de pintar y
-- guardar. Sirve para saber si la instrucción «sin códigos» basta. Fase 6b de
-- docs/disenos/2026-09-24-coach-plan-completo.md (§3.3).

alter table coach_uso add column if not exists codigos_quitados integer not null default 0;

notify pgrst, 'reload schema';
