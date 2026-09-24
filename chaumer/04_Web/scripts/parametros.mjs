/**
 * parametros.mjs — ninguna pagina pide un parametro que no existe, y ninguna
 * lleva un numero de reserva escrito a mano.
 *
 * Tarea 2 de PENDIENTE_PORTAL.md. Hasta el 22/09/2026 cada pagina hacia
 *
 *   par.get('UMBRAL_VOL_MNQ')?.valor ?? '> 6.000 contratos'
 *
 * y si el nombre no existia en el plan, se pintaba la reserva sin avisar.
 * Asi el umbral de volumen enseno durante dias un numero retirado.
 *
 * Ahora las paginas piden el valor con `P.parametro('X')` (o el atajo
 * `v('X')`), que tira la compilacion si X no existe. Esto hace lo mismo SIN
 * compilar, con el archivo y la linea, y vigila las dos formas de volver a
 * lo de antes:
 *
 *   1. PARAMETRO QUE NO EXISTE   se pide un nombre que no esta en PARAMETROS.md
 *   2. RESERVA A MANO            `v('X', '80 puntos')`, `?.valor ?? '…'`, o
 *                                leer la tabla con `parametros().get(…)`
 *
 *   node scripts/parametros.mjs
 *
 * Sale con codigo 1 si encuentra algo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parametros } from '../src/lib/parsers.mjs';

const WEB = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(WEB, 'src');

function fuentes(dir) {
  const salida = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'content') continue; // generado: es el plan, no codigo
      salida.push(...fuentes(abs));
    } else if (/\.(astro|mjs|ts)$/.test(e.name)) salida.push(abs);
  }
  return salida;
}

const existen = new Set(parametros().keys());

// `P.parametro('X')` y el atajo de las paginas `v('X')`.
const PIDE = /\b(?:parametro|detalleParametro|equivalencias|v)\(\s*'([A-Z0-9_]+)'/g;
const RESERVA = [
  [/\bv\(\s*'[A-Z0-9_]+'\s*,/, "v('X', reserva)"],
  [/\?\.valor\s*\?\?/, '?.valor ?? reserva'],
  [/parametros\(\)\s*\.get\(/, 'parametros().get(…)'],
];

const fallos = [];
let pedidos = 0;
for (const archivo of fuentes(SRC)) {
  const rel = path.relative(WEB, archivo).split(path.sep).join('/');
  // El propio lector define la puerta: ahi no se juzga.
  if (rel === 'src/lib/parsers.mjs') continue;
  fs.readFileSync(archivo, 'utf8').split('\n').forEach((linea, i) => {
    for (const m of linea.matchAll(PIDE)) {
      pedidos++;
      if (!existen.has(m[1])) {
        fallos.push([rel, i + 1, 'pide ' + m[1] + ', que NO existe en PARAMETROS.md', linea.trim()]);
      }
    }
    for (const [re, que] of RESERVA) {
      if (re.test(linea)) fallos.push([rel, i + 1, 'reserva escrita a mano: ' + que, linea.trim()]);
    }
  });
}

console.log('parámetros');
console.log('  en el plan    ' + existen.size);
console.log('  pedidos       ' + pedidos);
if (fallos.length) {
  console.log('  FALLOS        ' + fallos.length + '\n');
  for (const [arch, n, que, linea] of fallos) {
    console.log('  ✗ ' + arch + ':' + n + '  — ' + que);
    console.log('      ' + linea.slice(0, 140));
  }
  console.log('\n  Existen: ' + [...existen].join(', '));
  process.exit(1);
}
console.log('  fallos        0');
