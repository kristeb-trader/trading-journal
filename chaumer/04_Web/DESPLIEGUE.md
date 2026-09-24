# Publicar el portal

**Decidido por el operador el 02/09/2026:** entrada libre. Alfredo abre una
dirección y está dentro. Sin código, sin correo, sin contraseña.

El repositorio **no se conecta a Cloudflare**. Se compila en el equipo y se
suben solo los archivos de `dist/`. El código se queda privado en GitHub.

Todo vive en Cloudflare: la web en Pages y las observaciones en D1. Una sola
cuenta, sin claves viajando entre servicios.

---

## Una sola vez

Desde `04_Web/`, en una terminal.

### 1 · Entrar en Cloudflare  ✅ HECHO

```
npx wrangler login
```

Abre el navegador y pide autorizar. Es la cuenta que ya tienes.

### 2 · Crear la base  ✅ HECHA. database_id ya está en wrangler.toml

```
npx wrangler d1 create trading-plan-observaciones
```

Devuelve un `database_id`. **Pégalo en `wrangler.toml`**, sustituyendo
`PENDIENTE_DE_CREAR`.

### 3 · Crear la tabla  ✅ HECHA y verificada de extremo a extremo

```
npx wrangler d1 execute trading-plan-observaciones --remote --file=./d1/0001_observaciones.sql
```

### 4 · Inventar la clave de operador

Cualquier cadena larga que no sea adivinable. Por ejemplo la que salga de:

```
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

Guárdala. Es la que te deja **responder, marcar, exportar y borrar**.

### 5 · Publicar  ✅ HECHO el 02/09/2026

```
npm run build
npx wrangler pages deploy dist --project-name=plan-operativo-nq
```

La primera vez pregunta si crear el proyecto: acepta. Al terminar imprime la
dirección, del tipo `https://plan-operativo-nq.pages.dev`.

> Las direcciones `.pages.dev` son únicas en el mundo. Si `trading-plan` está
> cogido, elige otro nombre y úsalo también en `--project-name`.

### 6 · Guardar la clave como secreto

```
npx wrangler pages secret put CLAVE_OPERADOR --project-name=plan-operativo-nq
```

Pega la clave del paso 4. **No va al repositorio ni al navegador.**

---

## La bitácora de backtesting: la lee de Supabase

**Desde el 24/09/2026 (fase 4a de la unificación) la bitácora no vive aquí.**
Está en Supabase, en el proyecto del Trading Journal (`bt_cabecera`,
`bt_jornadas`, `bt_operaciones`), y los gráficos en Cloudinary. Se registra
desde el Journal. El portal **solo la lee**, desde su servidor:
`functions/api/backtesting/` la pide a las vistas `portal_bt_cabecera` y
`portal_bt_jornadas`. Escribir responde 405.

Lo que tiene que estar configurado:

### El secreto `SUPABASE_PORTAL_KEY`

Un JWT de rol `portal_lector`, que solo puede leer esas dos vistas. Se genera
desde esta carpeta con:

```
node scripts/llave-portal.mjs
```

Pide el *Legacy JWT Secret* de Supabase sin enseñarlo, firma la llave, la
prueba (lee las vistas y **no** lee `trades` ni escribe) y la guarda en
`.dev.vars`. Después se pega en Cloudflare → Workers & Pages →
`plan-operativo-nq` → Settings → Variables and Secrets (Production), tipo
Secret. Sin ella, `/backtesting` dice «No se pudo leer la bitácora».

> Lo de antes —las tablas `bt_*` en D1 y el bucket R2 `chaumer-bitacora`— sigue
> ahí, sin tocar, hasta la fase 8, que lo apaga con una exportación guardada.
> Los scripts `d1/0002` y `d1/0003` quedan como historia.

---

## Los dos enlaces

**El de Alfredo**, con su nombre dentro para que sus observaciones queden
firmadas sin que él escriba nada:

```
https://plan-operativo-nq.pages.dev/?a=Alfredo
```

Lo abre una vez y su navegador lo recuerda. Después le vale la dirección a secas.

**El tuyo**, que abre la pantalla de observaciones con permiso para responder,
marcar, exportar y borrar:

```
https://plan-operativo-nq.pages.dev/observaciones?k=TU_CLAVE
```

También se recuerda. Desde el 24/09/2026 ya **no** abre nada en la bitácora de
backtesting, que se registra desde el Journal.

**No lo compartas**: quien lo tenga puede responder y borrar observaciones en
tu nombre.

---

## Cada vez que cambie el plan

```
npm run build
npx wrangler pages deploy dist --project-name=plan-operativo-nq
```

Eso es todo. `build` sincroniza `01_Plan/` y `02_Assets/`, así que cualquier
cambio en el plan entra solo.

---

## Consultar las observaciones sin abrir el portal

```
npx wrangler d1 execute trading-plan-observaciones --remote --command="SELECT creada_en, autor, ancla_tipo, ancla_id, estado, texto FROM observaciones ORDER BY creada_en DESC LIMIT 50"
```

---

## Si algún día hay que cerrar la puerta

El portal es de entrada libre por decisión del operador. Si la dirección se
filtra y hace falta cerrarlo:

**Cloudflare** → **Zero Trust** → **Access** → **Applications** → añadir la
aplicación apuntando a la dirección del portal, con una política de lista
blanca de correos.

Dos minutos, sin tocar código ni volver a publicar.
