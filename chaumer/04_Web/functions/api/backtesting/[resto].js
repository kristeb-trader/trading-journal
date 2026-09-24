/**
 * /api/backtesting/:algo   lo que había aquí y ya no existe
 *
 * Corregir o borrar una jornada (/:id) y los datos de inicio (/cabecera). Desde
 * el 24/09/2026 la bitácora se registra en el Journal: escribir responde 405, y
 * leer algo que ya no existe, 404. La exportación tiene su propia ruta.
 *
 * Un solo tramo a propósito: un comodín [[...]] casaría también con
 * /api/backtesting a secas y le quitaría la lectura a index.js.
 */

import { json, soloLectura } from './_comun.js';

export const onRequestGet = () => json({ error: 'Esa dirección ya no existe' }, 404);
export const onRequest = soloLectura;
