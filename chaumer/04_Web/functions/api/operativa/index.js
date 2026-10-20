/**
 * GET /api/operativa   los trades de la cuenta principal del Journal
 *
 * Con la misma forma que /api/backtesting, para que la página use el mismo
 * componente (Bitacora.astro): { cabecera, jornadas }. La vista
 * `portal_op_jornadas` ya filtra la cuenta principal y el arranque, el
 * 21/10/2026 (diseño docs/disenos/2026-10-20-operativa-diaria-portal.md, D-041).
 *
 * No hay valor inicial: la curva arranca en 0. Solo lectura; cualquier otro
 * método responde 405.
 */

import { json, vista } from '../backtesting/_comun.js';

const CABECERA = { valor_inicial: 0, contratos: 1, instrumento: 'MNQ', comision: 0 };

export async function onRequestGet({ env }) {
  try {
    const jornadas = await vista(env, 'portal_op_jornadas?select=*&order=fecha.desc');
    return json({ cabecera: CABECERA, jornadas: jornadas ?? [] });
  } catch (e) {
    return json({ error: 'No se pudo leer la operativa', detalle: String(e) }, 500);
  }
}

const soloLectura = () =>
  json({ error: 'La operativa es de solo lectura en el portal: se registra desde el Journal' }, 405);
export const onRequestPost = soloLectura;
export const onRequestPut = soloLectura;
export const onRequestPatch = soloLectura;
export const onRequestDelete = soloLectura;
