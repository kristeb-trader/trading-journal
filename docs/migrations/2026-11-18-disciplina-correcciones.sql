-- La causa de una regla rota, corregida por Kris (18/11/2026).
--
-- El juicio del motor puede acertar que el trade rompió una regla y equivocarse de CAUSA: empareja por el minuto y a
-- veces juzga otro setup (05/11: dijo «stop del plan 155»; la causa era la consecución), o no sabe nombrar lo que pasó
-- (10/11: «sin setup»; era un soporte mal creado). Una fila corrige la causa de ese día: el día sigue contando como regla
-- rota, igual que antes; solo cambia lo que se ve (Disciplina, el visor, el Coach) y la regla que suma en la fuga.
-- Si el juicio del día es ✓ (o no cuenta), la corrección no se aplica.
--   regla    el código (los de REGLA_TXT de js/db.js: consecucion, primer_iri, zona_mal_creada, entrada_incorrecta…)
--   etiqueta lo que dice el cuadrito, con las palabras de Kris («Soporte mal creado»)
--   texto    la causa en una frase (lo que sale al pasar el ratón y lo que lee el Coach)

create table if not exists disciplina_correcciones (
  fecha     date primary key,
  regla     text not null,
  etiqueta  text,
  texto     text,
  creada_at timestamptz not null default now()
);

alter table disciplina_correcciones enable row level security;
drop policy if exists auth_all on disciplina_correcciones;
create policy auth_all on disciplina_correcciones for all to authenticated using (true) with check (true);
grant select, insert, update, delete on disciplina_correcciones to authenticated, service_role;

notify pgrst, 'reload schema';
