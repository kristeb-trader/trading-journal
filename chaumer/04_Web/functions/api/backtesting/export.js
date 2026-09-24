/**
 * GET /api/backtesting/export   la bitácora entera en JSON, para guardar
 *
 * La copia de seguridad, con la misma forma que tenía cuando la bitácora vivía
 * en D1: sin identificadores, las jornadas de vieja a nueva y cada una con sus
 * operaciones. Desde el 24/09/2026 los datos salen de Supabase.
 *
 * No pide clave, porque leer la bitácora tampoco la pide.
 */

import { leerBitacora } from './_comun.js';

export async function onRequestGet({ env }) {
  try {
    const { cabecera, jornadas } = await leerBitacora(env);

    const fecha = new Date().toISOString().slice(0, 10);
    const salida = {
      exportado_en: fecha,
      cabecera,
      jornadas: jornadas
        .slice()
        .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0))
        .map(({ id: _, operaciones, ...j }) => ({
          ...j,
          operaciones: (operaciones ?? []).map(({ id: __, ...o }) => o),
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
