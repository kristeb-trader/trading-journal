/**
 * GET  /api/observaciones   lista, con filtros opcionales
 * POST /api/observaciones   crea una observacion
 *
 * El portal es de entrada libre, asi que aqui NO hay identidad verificada:
 * el autor es lo que declara el navegador. Lo que si hay son frenos contra
 * el ruido, y ninguno le pide nada al revisor.
 */

const TIPOS = ['regla', 'termino', 'caso', 'parametro', 'pendiente', 'subfase', 'general'];
const MAX_TEXTO = 5000;
const MAX_AUTOR = 80;
const MAX_CITA = 1200;
const POR_HORA = 40; // por huella. Un revisor normal no llega ni de lejos.

const json = (datos, estado = 200) =>
  new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/** Huella de la conexion. No guardamos la IP: solo un hash, y sirve
 *  unicamente para contar y para poder limpiar si entra ruido. */
async function huella(request) {
  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';
  const datos = new TextEncoder().encode('chaumer:' + ip);
  const hash = await crypto.subtle.digest('SHA-256', datos);
  return [...new Uint8Array(hash)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const recorta = (v, max) => (v == null ? null : String(v).trim().slice(0, max) || null);

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const tipo = url.searchParams.get('ancla_tipo');
  const id = url.searchParams.get('ancla_id');
  const estado = url.searchParams.get('estado');

  let sql = `SELECT id, ancla_tipo, ancla_id, ancla_titulo, cita, texto, autor,
                    estado, respuesta, respondida_en, creada_en
             FROM observaciones WHERE 1 = 1`;
  const args = [];
  if (tipo) { sql += ' AND ancla_tipo = ?'; args.push(tipo); }
  if (id) { sql += ' AND ancla_id = ?'; args.push(id); }
  if (estado) { sql += ' AND estado = ?'; args.push(estado); }
  sql += ' ORDER BY creada_en DESC LIMIT 500';

  try {
    const { results } = await env.DB.prepare(sql).bind(...args).all();
    return json({ observaciones: results ?? [] });
  } catch (e) {
    return json({ error: 'No se pudieron leer las observaciones', detalle: String(e) }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  let cuerpo;
  try { cuerpo = await request.json(); }
  catch { return json({ error: 'El cuerpo de la petición no es JSON válido' }, 400); }

  const tipo = String(cuerpo.ancla_tipo || 'general');
  if (!TIPOS.includes(tipo)) {
    return json({ error: 'Ese tipo de anclaje no existe en el plan' }, 400);
  }

  const texto = recorta(cuerpo.texto, MAX_TEXTO);
  if (!texto) return json({ error: 'La observación está vacía' }, 400);

  // Los identificadores del plan tienen forma conocida. Si no encaja, se
  // guarda como general en vez de aceptar cualquier cosa.
  let anclaId = recorta(cuerpo.ancla_id, 120);
  if (anclaId && !/^[A-Za-zÀ-ÿ0-9_.\- ]{1,120}$/.test(anclaId)) anclaId = null;

  const h = await huella(request);

  try {
    // Freno al ruido: cuantas ha escrito esta misma conexion en una hora.
    const { results } = await env.DB
      .prepare(`SELECT COUNT(*) AS n FROM observaciones
                WHERE huella = ? AND creada_en > datetime('now', '-1 hour')`)
      .bind(h).all();
    if ((results?.[0]?.n ?? 0) >= POR_HORA) {
      return json({ error: 'Demasiadas observaciones seguidas. Prueba dentro de un rato.' }, 429);
    }

    const res = await env.DB
      .prepare(`INSERT INTO observaciones
                  (ancla_tipo, ancla_id, ancla_titulo, cita, texto, autor, huella)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                RETURNING id, ancla_tipo, ancla_id, ancla_titulo, cita, texto,
                          autor, estado, creada_en`)
      .bind(tipo, anclaId, recorta(cuerpo.ancla_titulo, 300), recorta(cuerpo.cita, MAX_CITA),
            texto, recorta(cuerpo.autor, MAX_AUTOR) || 'anónimo', h)
      .all();

    return json({ observacion: res.results?.[0] ?? null }, 201);
  } catch (e) {
    return json({ error: 'No se pudo guardar la observación', detalle: String(e) }, 500);
  }
}
