# Plan — Blindaje de seguridad (RLS + Auth)

> Estado: **EN CURSO** (iniciado 2026-06-24). Disparado por una alerta de
> Supabase: "RLS Disabled in Public" en todas las tablas.

## Problema
- Las tablas tienen **RLS desactivado** y la **`anon key` viaja en el JS público**
  de GitHub Pages (`js/config.js`).
- GitHub es plan **gratis** → el sitio de Pages es **público** (no se puede hacer
  privado sin Pro). La `anon key` siempre será visible.
- Resultado: **cualquiera con la URL puede leer, editar y borrar toda la BD.**

## Decisiones del usuario (2026-06-24)
- GitHub: **gratis** (descartado "Pages privado").
- **No hay backup** de la BD → hacer backup es lo primero/urgente.
- Quiere **protección TOTAL**: nadie más debe poder **leer, editar ni borrar**.
  Son datos reales de cuentas de fondeo (confidencialidad + integridad).

## Conclusión técnica
Con sitio público + `anon key` pública, la única forma de bloquear hasta la
**lectura** es exigir **autenticación**. Por tanto la solución es:
**Supabase Auth (login) + RLS activado** con políticas solo para usuarios
autenticados. La `anon key` sola queda inservible.

## ⚠️ Reglas críticas
- **NO usar el botón "Resolve issue" de Supabase** (activa RLS sin políticas →
  rompe TODO: web, bot, indicadores).
- La **`service_role` key** NUNCA va en el JS público — solo en Workers (secreto)
  o en los indicadores locales (máquina del usuario).
- **Cutover coordinado:** RLS se activa AL FINAL, cuando todas las rutas de
  escritura ya estén adaptadas; si no, la app se cae.

## Rutas que hoy usan la `anon key` (hay que adaptarlas)
- **Web** (`js/db.js`): lecturas directas + varias escrituras directas
  (errores, experimentos, apex, catálogos, checklist_items, `sesiones.checklist`).
- **Worker `/api/session`** (no versionado): guarda sesiones (ya usa un token).
- **Bot Telegram** (`TelegramBot/worker.js`): escribe sesiones + checklist.
- **Indicadores NT8** (`SupabaseAutoExport.cs`, `SupabaseDailyLevels.cs`,
  `ChecklistChaumer.cs`): POST directo a Supabase REST con la `anon key`.

## Fases
- [x] **Fase 0 — Backup** (HECHO 2026-06-24). `pg_dump` 18 vía Session pooler
      (host `aws-1-sa-east-1`, user `postgres.jothoslozctflfrnysrx`, puerto 5432,
      `PGPASSWORD`). Archivo ~22 MB en `Documentos\backup_trading_journal_2026-06-24.sql`.
      Pendiente del usuario: guardar copia fuera del PC + configurar backup periódico.
- [x] **Fase 1 — Login web** (HECHO 2026-06-24). Supabase Auth, un solo usuario
      (signup público desactivado). Gate en `app.js` + pantalla de login + botón
      cerrar sesión. Aprendizajes:
      · Hubo que dar grants al rol `authenticated` (antes solo tenía `anon`)
        → `2026-06-24-grants-authenticated.sql`.
      · NO usar "Resolve issue" de Supabase: activa RLS sin políticas y rompe el
        acceso. Quedó RLS off de baseline (`2026-06-24-disable-rls-baseline.sql`).
- [ ] **Fase 2 — RLS en las ~18 tablas**: activar RLS + política
      `to authenticated using (true) with check (true)`. `anon` sin políticas
      (bloqueada). *(Se hace al final del cutover.)*
- [~] **Fase 3 — Bot + Worker `/api/session`**: escribir con `service_role`
      (secreto del Worker), no con `anon`. (EN CURSO 2026-06-24)
      · Bot (`TelegramBot/worker.js`): código cambiado — usa `env.SUPABASE_SERVICE_ROLE`
        en vez de `env.SUPABASE_KEY` (lecturas y escrituras). Falta deploy + crear
        la secret en Cloudflare.
      · Worker `/api/session` (no versionado): pendiente que el usuario apunte su
        consulta a `service_role`.
      · Pasos manuales del usuario:
        1. Supabase → Settings → API → copiar `service_role` key.
        2. Cloudflare → Worker bot → Settings → Variables → crear secret
           `SUPABASE_SERVICE_ROLE` (encrypted) con esa key. Mantener `SUPABASE_KEY`
           por ahora no hace daño; se puede borrar tras verificar.
        3. Re-deploy del Worker bot.
        4. Igual en el Worker `/api/session`: que use la `service_role`.
        5. Verificar (con RLS aún off): `/sesion` y `/stats` en el bot + guardar
           sesión desde la web.
- [ ] **Fase 4 — Indicadores NT8**: enviar a través de un endpoint del Worker
      (con `service_role`) en vez de POST directo con `anon`. Requiere recompilar
      e importar los .cs.

## Notas
- Supabase free **sí** tiene Auth, RLS y `service_role`.
- Tras Fase 1-4 listas, recién activar RLS (Fase 2) y verificar cada superficie:
  web (logueado), bot (`/sesion`), indicadores (export de un trade).
- Recordatorio: configurar también un **backup periódico** (no solo el inicial).
