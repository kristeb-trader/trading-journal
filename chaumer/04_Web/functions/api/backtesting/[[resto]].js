/**
 * Todo lo que cuelga de /api/backtesting/ y no es la exportación.
 *
 * Aquí estaban corregir y borrar una jornada, los datos de inicio y subir o
 * servir los gráficos de R2. Desde el 24/09/2026 la bitácora se registra en el
 * Journal y los gráficos están en Cloudinary: escribir responde 405, y leer
 * algo que ya no existe, 404.
 */

import { json, soloLectura } from './_comun.js';

export const onRequestGet = () => json({ error: 'Esa dirección ya no existe' }, 404);
export const onRequest = soloLectura;
