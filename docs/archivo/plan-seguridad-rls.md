# Plan — Blindaje de seguridad (RLS + Auth)

> Estado: **COMPLETADO** (2026-06-24). RLS activo en todas las tablas; `anon`
> bloqueada y verificada. Único pendiente operativo: corregir el archivo local
> `supabase-service-key.txt` de los indicadores NT8 (export no verificado por no
> poder operar más trades ese día; el código ya usa service_role).
> Disparado por una alerta de Supabase: "RLS Disabled in Public" en todas las tablas.

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
- [x] **Fase 2 — RLS en todas las tablas** (HECHO 2026-06-24). Migración dinámica
      `2026-06-24-fase2-activar-rls.sql`: borra políticas viejas → activa RLS →
      crea solo `auth_all` (`for all to authenticated using/with check true`) en
      todas las tablas de `public`. Rollback: `2026-06-24-fase2-rollback-rls.sql`.
      · Gotcha resuelto: la 1ª versión solo creaba `auth_all` sin borrar políticas
        viejas permisivas de `anon` → con RLS on, anon SEGUÍA entrando. Se corrigió
        borrando todas las políticas antes de crear la nueva.
      · Verificado con la anon key pública: LEER trades/sesiones/apex_cuentas → `[]`;
        INSERT → 401; DELETE → 204 sin efecto. anon key inservible. Web logueada y
        bot siguen OK.
- [x] **Fase 3 — Bot + Worker `/api/session`** (HECHO 2026-06-24). Verificado:
      `/sesion` + `/stats` en el bot y guardado de sesión en la web funcionan con
      `service_role`.
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
- [x] **Fase 4 — Indicadores NT8** (HECHO 2026-06-25). Verificado: trade de Sim101
      exportado y guardado en `apex_trades` con RLS activo. Decisión: en vez de un
      Worker proxy, la `service_role` vive en un **archivo local** y los 3 `.cs` la
      leen de ahí (regla del plan: service_role permitida en la máquina del usuario).
      · **Gotcha resuelto (2026-06-25)**: el primer trade dio HTTP 403 / 42501
        "permission denied for table apex_trades". `service_role` ignora RLS pero
        necesita GRANTS de tabla, que le faltaban en `apex_trades`. Arreglado con
        `2026-06-25-grants-service-role.sql` (CRUD a service_role en todas las tablas
        + default privileges). Tras eso, el export entra silencioso (solo imprime
        en Output si falla). Ojo routing: cuentas sin prefijo `PA-` (ej. Sim101) van
        a `apex_trades` sin Telegram; solo las `PA-*` van a `trades` + Telegram.
      · Código cambiado en `SupabaseAutoExport.cs`, `SupabaseDailyLevels.cs` y
        `ChecklistChaumer.cs`: se quitó la `anon key` hardcodeada; ahora leen
        `Documentos\NinjaTrader 8\supabase-service-key.txt` (helper `ReadServiceKey`).
        Los 2 indicadores avisan en el Output si el archivo falta/está vacío.
      · Pasos manuales del usuario:
        1. Crear `Documentos\NinjaTrader 8\supabase-service-key.txt` y pegar la
           `service_role` key (una sola línea, sin comillas). Asegurar que esa
           carpeta NO esté sincronizada a la nube.
        2. NinjaTrader → recompilar (F5 en el editor NinjaScript).
        3. Verificar (con RLS aún off): cerrar un trade → llega a `trades`/Telegram;
           niveles del día suben a `sesiones`; panel checklist lee/escribe.

## Notas
- Supabase free **sí** tiene Auth, RLS y `service_role`.
- Tras Fase 1-4 listas, recién activar RLS (Fase 2) y verificar cada superficie:
  web (logueado), bot (`/sesion`), indicadores (export de un trade).
- Recordatorio: configurar también un **backup periódico** (no solo el inicial).
