/**
 * Lo que comparten las rutas de la bitácora.
 *
 * El guion bajo del nombre es lo que impide que Pages lo publique como ruta.
 *
 * Desde el 24/09/2026 (fase 4a de la unificación) la bitácora vive en Supabase,
 * en el proyecto del Trading Journal, y se registra desde el Journal. El portal
 * solo la LEE, y la lee desde aquí, desde su servidor: el navegador nunca ve la
 * llave ni habla con Supabase.
 *
 * La llave (`SUPABASE_PORTAL_KEY`, secreto de Cloudflare) es un JWT de rol
 * `portal_lector`: solo puede leer las vistas `portal_bt_cabecera` y
 * `portal_bt_jornadas`. Ni una tabla, ni escribir. La genera
 * `scripts/llave-portal.mjs`.
 */

const SUPABASE_URL = 'https://jothoslozctflfrnysrx.supabase.co';

// La clave PUBLICABLE del proyecto: pública por diseño (la misma que viaja en
// el JavaScript del Journal). Solo identifica el proyecto ante la pasarela de
// Supabase; los permisos los pone el JWT de `portal_lector`.
const SUPABASE_PUBLICA = 'sb_publishable_XQX0FdnJFuq0YJS-_ashug_c6Hb1mS4';

export const json = (datos, estado = 200) =>
  new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/** La bitácora es de solo lectura en el portal. Cualquier escritura acaba aquí. */
export const soloLectura = () =>
  json({ error: 'La bitácora es de solo lectura en el portal: se registra desde el Journal' }, 405);

async function vista(env, ruta) {
  if (!env.SUPABASE_PORTAL_KEY) throw new Error('Falta el secreto SUPABASE_PORTAL_KEY');
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    headers: {
      apikey: SUPABASE_PUBLICA,
      authorization: `Bearer ${env.SUPABASE_PORTAL_KEY}`,
      accept: 'application/json',
    },
  });
  if (!r.ok) throw new Error(`Supabase respondió ${r.status}: ${await r.text()}`);
  return r.json();
}

/**
 * La bitácora entera: { cabecera, jornadas }, cada jornada con sus operaciones
 * en orden (una jornada sin operaciones sale con la lista vacía). Las jornadas
 * van de la más nueva a la más vieja, como las pedía la página.
 */
export async function leerBitacora(env) {
  const [cabeceras, jornadas] = await Promise.all([
    vista(env, 'portal_bt_cabecera?select=*'),
    vista(env, 'portal_bt_jornadas?select=*&order=fecha.desc'),
  ]);
  return {
    cabecera: cabeceras[0] ?? null,
    jornadas: jornadas ?? [],
  };
}
