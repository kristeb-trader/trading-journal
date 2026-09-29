# Publicar el portal

**Entrada libre** (decisión del operador, 02/09/2026): Alfredo abre la dirección y está dentro, sin código ni
contraseña. Todo vive en Cloudflare: la web en Pages y las observaciones en D1.

## Cómo se publica

**Solo, al hacer push a `main`.** El workflow `.github/workflows/publicar-portal.yml` (en la raíz del repositorio)
compila y sube `dist/` con `wrangler pages deploy` cuando el push toca `chaumer/01_Plan/`, `chaumer/02_Assets/`,
`chaumer/04_Web/` o las Sesiones (`chaumer/05_Backtesting/claude/*`). Usa sus propios secretos de GitHub,
`PORTAL_CLOUDFLARE_API_TOKEN` y `PORTAL_CLOUDFLARE_ACCOUNT_ID` — no los del bot. Tarda unos dos minutos.

⚠️ **El repositorio es público** (D-022): lo que se sube, cualquiera lo puede leer. Nunca claves en el código.

A mano, solo si el workflow no está disponible, desde `04_Web/`:

```
npm run verificar
npx wrangler pages deploy dist --project-name=plan-operativo-nq
```

## Los secretos de Pages

Se ponen en Cloudflare → Workers & Pages → `plan-operativo-nq` → Settings → Variables and Secrets (Production),
tipo Secret. **Nunca** en el repositorio ni en el navegador.

| Secreto | Para qué | Estado |
|---|---|---|
| `SUPABASE_PORTAL_KEY` | Leer la bitácora de backtesting del Journal: un JWT del rol `portal_lector`, que solo ve `portal_bt_cabecera` y `portal_bt_jornadas`. Se genera con `node scripts/llave-portal.mjs` (pide el *Legacy JWT Secret* de Supabase sin enseñarlo, firma la llave, la prueba y la deja en `.dev.vars`). Sin ella, `/backtesting` dice «No se pudo leer la bitácora» | puesto |
| `CLAVE_OPERADOR` | Responder, marcar, exportar y borrar observaciones. Cualquier cadena larga: `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`, y `npx wrangler pages secret put CLAVE_OPERADOR --project-name=plan-operativo-nq` | **pendiente** (`tasks/current.md`) |

## Los dos enlaces

- **El de Alfredo**, con su nombre para que sus observaciones queden firmadas: `https://plan-operativo-nq.pages.dev/?a=Alfredo`.
  Lo abre una vez y el navegador lo recuerda.
- **El tuyo**, para gestionar las observaciones: `https://plan-operativo-nq.pages.dev/observaciones?k=TU_CLAVE`.
  **No lo compartas**: quien lo tenga responde y borra en tu nombre.

## Las observaciones, en D1

Se quedan en D1 por decisión del operador (D-027). Consultarlas sin abrir el portal:

```
npx wrangler d1 execute trading-plan-observaciones --remote --command="SELECT creada_en, autor, ancla_tipo, ancla_id, estado, texto FROM observaciones ORDER BY creada_en DESC LIMIT 50"
```

En local, la copia de D1 (`.wrangler/`) necesita la tabla: `npx wrangler d1 execute trading-plan-observaciones --local --file=d1/0001_observaciones.sql`.
Las tablas `bt_*` de D1 y el bucket R2 `chaumer-bitacora` siguen en Cloudflare sin usar (la bitácora vive en
Supabase desde el 24/09); `d1/0002` y `d1/0003` quedan como historia.

## Si algún día hay que cerrar la puerta

Cloudflare → Zero Trust → Access → Applications → añadir la aplicación apuntando a la dirección del portal, con una
política de lista blanca de correos. Dos minutos, sin tocar código ni volver a publicar.
