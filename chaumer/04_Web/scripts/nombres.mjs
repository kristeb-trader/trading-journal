/**
 * nombres.mjs — que el nombre viejo del setup no vuelva a salir.
 *
 * El 23/09/2026 el operador renombro el setup IRI a Continuacion, alcista o
 * bajista, y quito la etiqueta Apertura (CAMBIO_IRI_A_CONTINUACION.md). IRI
 * sigue existiendo, pero nombra la ESTRUCTURA —impulso, retroceso, impulso—,
 * asi que no se puede prohibir la palabra: «esperar un IRI nuevo entero mas
 * alla» es correcto.
 *
 * Lo que se prohibe son las formas que solo pueden ser el setup viejo:
 *   · «IRI largo / corto / alcista / bajista», «IRI Apertura», «IRI Continuacion»
 *   · «setup IRI», «IRI prohibido»
 *   · «Reingreso largo / corto» (la direccion se escribe alcista / bajista)
 *
 * Las citas textuales quedan fuera: lo que el operador o Chaumer dijeron con
 * el nombre de entonces no se reescribe. Se descarta el texto entre comillas
 * antes de buscar.
 *
 * Mira el HTML ya compilado, como cifras.mjs. Sale con codigo 1 si encuentra
 * alguna.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(WEB, 'dist');

const VIEJO = /\bIRI\s+(?:largos?|cortos?|alcistas?|bajistas?|apertura|continuaci[oó]n)\b|\bsetup\s+IRI\b|\bIRI\s+prohibido\b|\bReingresos?\s+(?:largos?|cortos?)\b/gi;

function paginas(dir) {
  const salida = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) salida.push(...paginas(p));
    else if (e.name.endsWith('.html')) salida.push(p);
  }
  return salida;
}

const fallos = [];
const todas = paginas(DIST);
for (const archivo of todas) {
  const texto = fs.readFileSync(archivo, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    // las citas textuales se quedan como se dijeron
    .replace(/"[^"]*"|“[^”]*”|«[^»]*»/g, ' ');
  for (const m of texto.matchAll(VIEJO)) {
    fallos.push([path.relative(DIST, archivo).split(path.sep).join('/'),
      texto.slice(Math.max(0, m.index - 60), m.index + m[0].length + 30).trim()]);
  }
}

console.log('nombre del setup');
console.log('  páginas       ' + todas.length);
if (fallos.length) {
  console.log('  FALLOS        ' + fallos.length + '\n');
  for (const [pag, ctx] of fallos) console.log('  ✗ ' + pag + '\n      …' + ctx + '…');
  process.exit(1);
}
console.log('  fallos        0');
