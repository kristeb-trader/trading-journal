/**
 * GET /api/backtesting   la bitácora entera: cabecera + jornadas + operaciones
 *
 * De solo lectura desde el 24/09/2026: la bitácora vive en Supabase y se
 * registra desde el Journal. Cualquier otro método responde 405.
 */

import { json, soloLectura, leerBitacora } from './_comun.js';

export async function onRequestGet({ env }) {
  try {
    const { cabecera, jornadas } = await leerBitacora(env);
    return json({
      cabecera: cabecera ?? { valor_inicial: 0, contratos: 1, instrumento: 'MNQ', comision: 0 },
      jornadas,
    });
  } catch (e) {
    return json({ error: 'No se pudo leer la bitácora', detalle: String(e) }, 500);
  }
}

export const onRequestPost = soloLectura;
export const onRequestPut = soloLectura;
export const onRequestPatch = soloLectura;
export const onRequestDelete = soloLectura;
