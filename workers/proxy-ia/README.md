# Proxy del Journal — Worker `broad-hall-c53f`

`https://broad-hall-c53f.kristerock.workers.dev` · cuenta de Cloudflare `03b9d27f…` (la misma del bot y del portal).

`worker.js` es **copia literal** del código desplegado, traída desde el panel de Cloudflare el 24/09/2026
(fase 6a de `docs/disenos/2026-09-24-coach-plan-completo.md`; antes no estaba en ningún repositorio —
hallazgo 7 de la unificación). **No se despliega desde aquí**: si se cambia, hay que pegarlo en el panel
(Workers & Pages → `broad-hall-c53f` → Edit code → Deploy) y dejar este archivo igual que lo desplegado.

## Qué hace

Todo pide `POST` y la cabecera `Authorization: Bearer <access_token>` de la sesión de Supabase del Journal
(`DB.cabecerasWorker`). El Worker la valida contra `/auth/v1/user`. Sin sesión válida: 401.

**Toda respuesta lleva `Access-Control-Allow-Origin`, también las de error.** Sin esa cabecera el navegador
descarta la respuesta y `fetch` revienta con un `Failed to fetch` opaco en vez del código real (12/10/2026).

| Ruta | Qué hace | Lo usa |
|---|---|---|
| `/api/session` | Upsert en `sesiones` (`on_conflict=sesion_date`, merge) con la `service_role`. **Escribe el payload tal cual**: una clave que no sea columna revienta el guardado (PGRST204) — invariante «Guardar sesión» del `CLAUDE.md` | `DB.upsertSesion` (`js/db.js`) |
| cualquier otra (`/api/claude`) | Reenvía el cuerpo **sin tocarlo** a `api.anthropic.com/v1/messages`, con la `x-api-key` y la `anthropic-version` que manda el navegador. No filtra modelo ni `max_tokens`, **no reenvía `anthropic-beta`** y no hace streaming | `llamarClaude` (`js/coach.js`) |

## Secretos (en Cloudflare, nunca aquí: el repositorio es público, D-022)

`SUPABASE_URL` · `SUPABASE_SERVICE_KEY`.

`DASHBOARD_SECRET` **se retiró el 12/10/2026** y se puede borrar del panel. Era una clave aparte que Kris
tecleaba en ⚙ Ajustes: vivía solo en el `localStorage`, se perdía al borrar los datos del sitio y no era
recuperable (en Cloudflare es un *secret*: se escribe y no se lee). Ahora la puerta es el login del Journal.

## Notas

- La clave de Anthropic **no** está en el Worker: la manda el navegador de Kris en cada llamada.
- Validar la sesión cuesta un salto extra a Supabase por petición. Se hace así, y no verificando la firma del
  JWT, para no meter el `JWT secret` como tercer secreto del Worker.
- Sin `anthropic-beta`, ninguna función beta de la API llega a Anthropic por este proxy. Si algún día hace
  falta, hay que añadir esa cabecera aquí (y a `Access-Control-Allow-Headers`).
