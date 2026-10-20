/**
 * Los datos de «riesgo» que usan sus apartados. Salen de la página del paso
 * (20/10/2026, diseño docs/disenos/2026-10-20-reglas-plan-jornada.md §3): los
 * apartados viven en componentes propios y los comparten /riesgo y /plan.
 */
import * as P from '../../../lib/parsers.mjs';

export const v = (n) => P.parametro(n);

// La cuenta objetivo y su porcentaje: bloque «Consecuencias de riesgo» del plan.
export const riesgo = P.consecuenciasRiesgo();

// R-04 (plan 3.44, 05/10/2026): el tope es de dinero y los contratos son los que caben,
// redondeando hacia abajo. La tabla de la regla se calcula con el RIESGO_MAX vigente,
// para que no se quede vieja si cambia. MNQ: $2 por punto (R-01).
export const DOLAR_PUNTO = 2;
export const mRiesgo = v('RIESGO_MAX').match(/\$\s?([\d.]+)/);
if (!mRiesgo) throw new Error('riesgo.astro: RIESGO_MAX no trae una cifra en dólares: ' + v('RIESGO_MAX'));
export const riesgoMax = Number(mRiesgo[1].replace(/\./g, ''));
export const EJEMPLOS = [80, 40, 25, 10].map((pts) => {
  const c = Math.floor(riesgoMax / (pts * DOLAR_PUNTO));
  return { pts, c, usd: c * pts * DOLAR_PUNTO };
});
