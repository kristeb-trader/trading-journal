/**
 * GET  /api/backtesting   la bitácora entera: cabecera + jornadas + operaciones
 * POST /api/backtesting   registra una jornada
 *
 * Leer es libre. Escribir pide la clave del operador.
 */

import {
  json, autorizado, ahora, leerCabecera,
  normalizarJornada, sentenciasDeOperaciones,
} from './_comun.js';

export async function onRequestGet({ env }) {
  try {
    const cabecera = await leerCabecera(env);

    const { results: jornadas } = await env.DB
      .prepare(`SELECT id, fecha, instrumento, contratos, valor_punto, comision,
                       imagen, notas
                FROM bt_jornadas ORDER BY fecha DESC`)
      .all();

    const { results: operaciones } = await env.DB
      .prepare(`SELECT id, jornada_id, orden, hora, direccion, setup,
                       puntos, resultado, comision, pnl, observaciones
                FROM bt_operaciones ORDER BY jornada_id, orden`)
      .all();

    // Se agrupan aqui y no con un JOIN: una jornada sin operaciones tiene que
    // salir igual, con su lista vacia, y es la mitad del valor de la bitácora.
    const porJornada = new Map();
    for (const o of operaciones ?? []) {
      if (!porJornada.has(o.jornada_id)) porJornada.set(o.jornada_id, []);
      porJornada.get(o.jornada_id).push(o);
    }

    return json({
      cabecera,
      jornadas: (jornadas ?? []).map((j) => ({ ...j, operaciones: porJornada.get(j.id) ?? [] })),
    });
  } catch (e) {
    return json({ error: 'No se pudo leer la bitácora', detalle: String(e) }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!autorizado(request, env)) return json({ error: 'Registrar es del operador' }, 403);

  let cuerpo;
  try { cuerpo = await request.json(); }
  catch { return json({ error: 'El cuerpo de la petición no es JSON válido' }, 400); }

  try {
    const cabecera = await leerCabecera(env);
    const { error, jornada, operaciones } = normalizarJornada(cuerpo, cabecera);
    if (error) return json({ error }, 400);

    const t = ahora();
    const fila = await env.DB
      .prepare(`INSERT INTO bt_jornadas
                  (fecha, instrumento, contratos, valor_punto, comision,
                   imagen, notas, creada_en, actualizada_en)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id`)
      .bind(jornada.fecha, jornada.instrumento, jornada.contratos, jornada.valor_punto,
            jornada.comision, jornada.imagen, jornada.notas, t, t)
      .first();

    if (operaciones.length) {
      await env.DB.batch(sentenciasDeOperaciones(env, fila.id, operaciones));
    }

    return json({ id: fila.id, ...jornada, operaciones }, 201);
  } catch (e) {
    const texto = String(e);
    if (/UNIQUE/i.test(texto)) {
      return json({ error: 'Esa fecha ya está registrada. Corrígela desde su fila.' }, 409);
    }
    return json({ error: 'No se pudo guardar la jornada', detalle: texto }, 500);
  }
}
