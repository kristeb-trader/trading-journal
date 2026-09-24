/**
 * PATCH  /api/observaciones/:id   cambia estado o añade respuesta
 * DELETE /api/observaciones/:id   borra (solo para limpiar ruido)
 *
 * Estas dos son del operador, no del revisor. Como el portal no tiene
 * puerta, se protegen con una clave que viaja en la cabecera y que solo
 * conoce quien abrió su pantalla con el enlace correcto.
 *
 * Si CLAVE_OPERADOR no esta configurada, estas rutas quedan cerradas del
 * todo: es preferible a dejarlas abiertas por descuido.
 */

const ESTADOS = ['nueva', 'revisada', 'aplicada', 'descartada'];

const json = (datos, estado = 200) =>
  new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/** Comparacion en tiempo constante: sin esto, la clave se puede adivinar
 *  midiendo cuanto tarda en fallar. */
function igual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function autorizado(request, env) {
  const esperada = env.CLAVE_OPERADOR;
  if (!esperada) return false;
  return igual(request.headers.get('x-clave') || '', esperada);
}

export async function onRequestPatch({ request, env, params }) {
  if (!autorizado(request, env)) {
    return json({ error: 'Esta acción es del operador' }, 403);
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return json({ error: 'Identificador no válido' }, 400);

  let cuerpo;
  try { cuerpo = await request.json(); }
  catch { return json({ error: 'El cuerpo de la petición no es JSON válido' }, 400); }

  const campos = [];
  const args = [];

  if (cuerpo.estado != null) {
    if (!ESTADOS.includes(cuerpo.estado)) return json({ error: 'Ese estado no existe' }, 400);
    campos.push('estado = ?');
    args.push(cuerpo.estado);
  }
  if (cuerpo.respuesta != null) {
    campos.push('respuesta = ?', "respondida_en = datetime('now')");
    args.push(String(cuerpo.respuesta).trim().slice(0, 5000) || null);
  }
  if (!campos.length) return json({ error: 'No hay nada que cambiar' }, 400);

  campos.push("actualizada_en = datetime('now')");
  args.push(id);

  try {
    const res = await env.DB
      .prepare(`UPDATE observaciones SET ${campos.join(', ')} WHERE id = ?
                RETURNING id, estado, respuesta, respondida_en`)
      .bind(...args).all();
    if (!res.results?.length) return json({ error: 'No existe esa observación' }, 404);
    return json({ observacion: res.results[0] });
  } catch (e) {
    return json({ error: 'No se pudo actualizar', detalle: String(e) }, 500);
  }
}

export async function onRequestDelete({ request, env, params }) {
  if (!autorizado(request, env)) {
    return json({ error: 'Esta acción es del operador' }, 403);
  }
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return json({ error: 'Identificador no válido' }, 400);

  try {
    await env.DB.prepare('DELETE FROM observaciones WHERE id = ?').bind(id).run();
    return json({ borrada: id });
  } catch (e) {
    return json({ error: 'No se pudo borrar', detalle: String(e) }, 500);
  }
}
