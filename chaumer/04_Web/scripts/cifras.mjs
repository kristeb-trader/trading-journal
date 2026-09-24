/**
 * cifras.mjs — que la cifra del backtesting no salga en ninguna pagina.
 *
 * Decision del operador, 22/09/2026: el resultado agregado del backtesting
 * («−91,00 pts en 9», «−77,75 en 5») no se pinta en el portal. El lector de
 * fuentes lo filtra al leer el plan; esto comprueba el resultado, sobre el
 * HTML ya compilado, por si entra por una puerta que el filtro no cubre.
 *
 * El patron es el mismo que usa el filtro: se importa, no se copia.
 *
 * Sale con codigo 1 si encuentra alguna.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CIFRA_BACKTESTING } from '../src/lib/fuentes.mjs';

const WEB = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(WEB, 'dist');

function paginas(dir) {
  const salida = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) salida.push(...paginas(p));
    else if (e.name.endsWith('.html')) salida.push(p);
  }
  return salida;
}

const global = new RegExp(CIFRA_BACKTESTING.source, 'g');
const fallos = [];
const todas = paginas(DIST);
for (const archivo of todas) {
  const texto = fs.readFileSync(archivo, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
  for (const m of texto.matchAll(global)) {
    fallos.push([path.relative(DIST, archivo).split(path.sep).join('/'),
      texto.slice(Math.max(0, m.index - 60), m.index + m[0].length + 20).trim()]);
  }
}

console.log('cifra del backtesting');
console.log('  páginas       ' + todas.length);
if (fallos.length) {
  console.log('  FALLOS        ' + fallos.length + '\n');
  for (const [pag, ctx] of fallos) console.log('  ✗ ' + pag + '\n      …' + ctx + '…');
  process.exit(1);
}
console.log('  fallos        0');
