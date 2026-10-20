/**
 * Los datos de «dentro» que usan sus apartados. Salen de la página del paso
 * (20/10/2026, diseño docs/disenos/2026-10-20-reglas-plan-jornada.md §3): los
 * apartados viven en componentes propios y los comparten /dentro y /plan.
 */
import * as P from '../../../lib/parsers.mjs';

export const v = (n) => P.parametro(n);
