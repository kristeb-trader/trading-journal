/**
 * /api/backtesting/imagen/:clave   los gráficos que servía R2
 *
 * Desde el 24/09/2026 los gráficos están en Cloudinary y cada jornada guarda su
 * dirección completa. Subir responde 405; pedir uno por aquí, 404.
 */

import { json, soloLectura } from '../_comun.js';

export const onRequestGet = () => json({ error: 'Los gráficos están en Cloudinary' }, 404);
export const onRequest = soloLectura;
