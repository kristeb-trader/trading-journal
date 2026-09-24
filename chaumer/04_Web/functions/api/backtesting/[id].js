/**
 * PUT    /api/backtesting/:id   corrige una jornada entera
 * DELETE /api/backtesting/:id   la borra, con sus operaciones y su imagen
 *
 * Las dos son del operador.
 *
 * El PUT reemplaza la jornada completa en vez de parchear campos sueltos: es
 * lo que recalcula el P&L de todas sus operaciones cuando cambian los
 * contratos, y evita que quede una fila con un P&L viejo.
 */

import {
  json, autorizado, ahora, leerCabecera,
  normalizarJornada, sentenciasDeOperaciones,
} from './_comun.js';

const identificador = (params) => {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function onRequestPut({ request, env, params }) {
  if (!autorizado(request, env)) return json({ error: 'Corregir es del operador' }, 403);

  const id = identificador(params);
  if (!id) return json({ error: 'Identificador no válido' }, 400);

  let cuerpo;
  try { cuerpo = await request.json(); }
  catch { return json({ error: 'El cuerpo de la petición no es JSON válido' }, 400); }

  try {
    const existente = await env.DB
      .prepare('SELECT id FROM bt_jornadas WHERE id = ?').bind(id).first();
    if (!existente) return json({ error: 'Esa jornada no existe' }, 404);

    const cabecera = await leerCabecera(env);
    const { error, jornada, operaciones } = normalizarJornada(cuerpo, cabecera);
    if (error) return json({ error }, 400);

    await env.DB
      .prepare(`UPDATE bt_jornadas
                SET fecha = ?, instrumento = ?, contratos = ?, valor_punto = ?,
                    comision = ?, imagen = ?, notas = ?, actualizada_en = ?
                WHERE id = ?`)
      .bind(jornada.fecha, jornada.instrumento, jornada.contratos, jornada.valor_punto,
            jornada.comision, jornada.imagen, jornada.notas, ahora(), id)
      .run();

    // Fuera las viejas y dentro las nuevas: el P&L se recalcula entero.
    await env.DB.prepare('DELETE FROM bt_operaciones WHERE jornada_id = ?').bind(id).run();
    if (operaciones.length) {
      await env.DB.batch(sentenciasDeOperaciones(env, id, operaciones));
    }

    return json({ id, ...jornada, operaciones });
  } catch (e) {
    const texto = String(e);
    if (/UNIQUE/i.test(texto)) {
      return json({ error: 'Ya hay otra jornada con esa fecha' }, 409);
    }
    return json({ error: 'No se pudo corregir la jornada', detalle: texto }, 500);
  }
}

export async function onRequestDelete({ request, env, params }) {
  if (!autorizado(request, env)) return json({ error: 'Borrar es del operador' }, 403);

  const id = identificador(params);
  if (!id) return json({ error: 'Identificador no válido' }, 400);

  try {
    const fila = await env.DB
      .prepare('SELECT imagen FROM bt_jornadas WHERE id = ?').bind(id).first();
    if (!fila) return json({ error: 'Esa jornada no existe' }, 404);

    // Explicito y no por cascada: asi no depende de que las claves ajenas
    // esten activas en el entorno donde corra.
    await env.DB.prepare('DELETE FROM bt_operaciones WHERE jornada_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM bt_jornadas WHERE id = ?').bind(id).run();

    // La imagen se va con su jornada: si no, queda huérfana en el almacén y
    // nadie sabria nunca de quien era.
    if (fila.imagen && env.IMAGENES) {
      try { await env.IMAGENES.delete(fila.imagen); } catch { /* la fila ya se fue */ }
    }

    return json({ borrada: id });
  } catch (e) {
    return json({ error: 'No se pudo borrar la jornada', detalle: String(e) }, 500);
  }
}
