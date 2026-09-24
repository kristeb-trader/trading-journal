/**
 * GET /api/backtesting/export   la bitácora entera en JSON, para guardar
 *
 * Es la copia de seguridad. Al pasar los datos a la base dejaron de estar
 * versionados en git: esta descarga es lo que lo compensa, y lo que se lleva
 * al repositorio de vez en cuando.
 *
 * No pide clave, porque leer la bitácora tampoco la pide.
 */

export async function onRequestGet({ env }) {
  try {
    const cabecera = await env.DB
      .prepare('SELECT valor_inicial, contratos, instrumento, comision FROM bt_cabecera WHERE id = 1')
      .first();

    const { results: jornadas } = await env.DB
      .prepare(`SELECT id, fecha, instrumento, contratos, valor_punto, comision,
                       imagen, notas, creada_en, actualizada_en
                FROM bt_jornadas ORDER BY fecha`)
      .all();

    const { results: operaciones } = await env.DB
      .prepare(`SELECT jornada_id, orden, hora, direccion, setup,
                       puntos, resultado, comision, pnl, observaciones
                FROM bt_operaciones ORDER BY jornada_id, orden`)
      .all();

    const porJornada = new Map();
    for (const o of operaciones ?? []) {
      const { jornada_id: _, ...resto } = o;
      if (!porJornada.has(o.jornada_id)) porJornada.set(o.jornada_id, []);
      porJornada.get(o.jornada_id).push(resto);
    }

    const fecha = new Date().toISOString().slice(0, 10);
    const salida = {
      exportado_en: fecha,
      cabecera: cabecera ?? null,
      jornadas: (jornadas ?? []).map(({ id, ...j }) => ({
        ...j,
        operaciones: porJornada.get(id) ?? [],
      })),
    };

    return new Response(JSON.stringify(salida, null, 2), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="backtesting-${fecha}.json"`,
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    return new Response('No se pudo exportar la bitácora: ' + e, { status: 500 });
  }
}
