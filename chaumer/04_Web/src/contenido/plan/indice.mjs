/**
 * Los 37 apartados del plan de la jornada, en orden. La ÚNICA lista.
 *
 * Aquí solo va lo que el contenido no dice: el paso, el id y el nombre corto
 * de la ruta. El título, las reglas que cita y su primer gráfico se leen del
 * propio componente al compilar, para que no haya dos sitios que mantener.
 *
 * La usan las 8 páginas del paso (su ruta de apartados) y «Reglas» (/plan).
 * Diseño: docs/disenos/2026-10-20-reglas-plan-jornada.md §3.
 */
import fs from 'node:fs';
import path from 'node:path';

const LISTA = [
  ['premercado', 'estado', 'Cómo estoy hoy'],
  ['premercado', 'noticias', 'El calendario'],
  ['premercado', 'instrumento', 'El gráfico'],
  ['premercado', 'atm', 'Estrategia ATM'],
  ['premercado', 'zonas-vol', 'Zonas por volumen'],
  ['zonas', 'movimiento', 'Corrida y retroceso'],
  ['zonas', 'nace', 'Generación de zonas'],
  ['zonas', 'consecucion', 'Rompimiento y consecución'],
  ['zonas', 'estira', 'Sin consecución'],
  ['zonas', 'apendice', 'La zona apéndice'],
  ['zonas', 'convivencia', 'Zonas entre zonas'],
  ['zonas', 'caduca', 'Cuándo quitar una zona'],
  ['setups', 'dos', 'Solo hay dos'],
  ['setups', 'continuacion', 'Continuación'],
  ['setups', 'fluida', 'Corrida fluida'],
  ['setups', 'reingreso', 'Reingreso'],
  ['setups', 'comparar', 'Diferencias'],
  ['jornada', 'ventana', 'Ventana Operativa'],
  ['jornada', 'primera', 'La primera vela'],
  ['jornada', 'transcurso', 'Cómo avanza la sesión'],
  ['jornada', 'registro', 'El registro'],
  ['entrada', 'orden', 'Qué orden y dónde'],
  ['entrada', 'medir', 'Stop y objetivo'],
  ['entrada', 'antes', 'Antes de enviar'],
  ['entrada', 'espera', 'La orden esperando'],
  ['filtros', 'dia', 'No abrir el día'],
  ['filtros', 'cuatro', 'Los seis filtros'],
  ['filtros', 'noticias', 'Las noticias'],
  ['filtros', 'cancelan', 'Lo que cancela la orden'],
  ['filtros', 'despues', 'Descartado no es vacío'],
  ['dentro', 'llenado', 'Al llenarse'],
  ['dentro', 'no-tocar', 'No se toca nada'],
  ['dentro', 'salidas', 'Tres salidas'],
  ['dentro', 'cerrar', 'Al cerrar'],
  ['riesgo', 'cuanto', 'Cuánto se arriesga'],
  ['riesgo', 'cuantas', 'Cuántas veces'],
  ['riesgo', 'tamano', 'Con cuántos contratos'],
];

const RAIZ = path.join(process.cwd(), 'src/contenido/plan');

function leerFuente(paso, id) {
  return fs.readFileSync(path.join(RAIZ, paso, id + '.astro'), 'utf8');
}

function datosDe(paso, id) {
  const s = leerFuente(paso, id);
  const h2 = /<h2>([\s\S]*?)(<Refs|<\/h2>)/.exec(s);
  const reglas = [];
  for (const m of s.matchAll(/cods="([^"]+)"/g))
    for (const c of m[1].match(/R-\d{2}/g) || []) if (!reglas.includes(c)) reglas.push(c);
  const img = /<img[^>]*\ssrc="([^"]+)"/.exec(s);
  return {
    titulo: h2 ? h2[1].replace(/\s+/g, ' ').trim() : id,
    reglas,
    imagen: img ? img[1] : null,
    graficos: (s.match(/<figure/g) || []).length,
  };
}

/** Los 37, con sus datos. */
export const APARTADOS = LISTA.map(([paso, id, corto]) => ({ paso, id, corto, ...datosDe(paso, id) }));

/** Los apartados de un paso, en orden. */
export function apartadosDe(paso) {
  const r = APARTADOS.filter((a) => a.paso === paso);
  if (!r.length) throw new Error('indice.mjs: el paso ' + paso + ' no tiene apartados');
  return r;
}

/** La ruta de un paso tal como la pide Modulo.astro: [{ id, t }]. */
export function seccionesDe(paso) {
  return apartadosDe(paso).map((a) => ({ id: a.id, t: a.corto }));
}
