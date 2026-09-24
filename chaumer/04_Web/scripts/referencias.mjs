/**
 * referencias.mjs — vigila los códigos de regla escritos a mano.
 *
 * El portal escribe códigos a mano en dos sitios: las referencias del título
 * de cada apartado de módulo (`<Refs cods="R-05 · R-06" />`) y el enlace
 * cruzado de `parsers.mjs`. Esos códigos NO se traducen solos.
 *
 * El 06/09/2026 las 38 reglas se renumeraron y **47 referencias quedaron
 * apuntando a otra regla**. Ningún comprobador de enlaces lo vio: los códigos
 * seguían existiendo, solo que ya no eran esa regla.
 *
 * Este script guarda una huella de qué enunciado tiene cada código
 * (`referencias.lock.json`) y **falla si alguno cambia**. No sabe si una
 * referencia es la correcta —eso hay que leerlo— pero obliga a releerlas
 * justo cuando la numeración se mueve, que es cuando se rompen.
 *
 *   node scripts/referencias.mjs            comprueba
 *   node scripts/referencias.mjs --sellar   acepta el estado actual
 */
import fs from 'node:fs';
import path from 'node:path';

const WEB = path.dirname(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')));
const RAIZ = path.dirname(WEB);
const LOCK = path.join(WEB, 'scripts', 'referencias.lock.json');

const reglas = JSON.parse(fs.readFileSync(path.join(RAIZ, '01_Plan', 'reglas.json'), 'utf8'));
const HOY = {};
for (const r of reglas) HOY[r.id] = (r.enunciado || '').replace(/\s+/g, ' ').slice(0, 70);

// ── los códigos que el portal escribe a mano ───────────────────────────
const usados = new Map();   // código → dónde aparece
function apunta(id, donde) {
  if (!usados.has(id)) usados.set(id, new Set());
  usados.get(id).add(donde);
}

const PAGINAS = path.join(WEB, 'src', 'pages');
for (const f of fs.readdirSync(PAGINAS)) {
  if (!f.endsWith('.astro')) continue;
  const t = fs.readFileSync(path.join(PAGINAS, f), 'utf8');
  for (const m of t.matchAll(/<Refs cods="([^"]+)"/g)) {
    for (const id of m[1].split('·').map((x) => x.trim())) apunta(id, f);
  }
}
const parsers = fs.readFileSync(path.join(WEB, 'src', 'lib', 'parsers.mjs'), 'utf8');
for (const m of parsers.matchAll(/ENLACES_CRUZADOS = new Map\(\[\['(R-\d\d)'/g)) {
  apunta(m[1], 'parsers.mjs (enlace cruzado)');
}

console.log('referencias escritas a mano');
console.log('  códigos       ' + usados.size);

// ── ninguno puede haber desaparecido ───────────────────────────────────
const fantasmas = [...usados.keys()].filter((id) => !HOY[id]);
if (fantasmas.length) {
  console.log('\n  ✗ apuntan a reglas que no existen:');
  for (const id of fantasmas) console.log('      ' + id + '  (' + [...usados.get(id)].join(', ') + ')');
  process.exit(1);
}

// ── ¿le cambió el enunciado a alguno? ──────────────────────────────────
if (process.argv.includes('--sellar')) {
  const sello = {};
  for (const id of [...usados.keys()].sort()) sello[id] = HOY[id];
  fs.writeFileSync(LOCK, JSON.stringify(sello, null, 2) + '\n');
  console.log('  sellado       ' + Object.keys(sello).length + ' códigos');
  process.exit(0);
}

if (!fs.existsSync(LOCK)) {
  console.log('\n  ✗ no hay huella guardada. Revisa las referencias a mano y luego:');
  console.log('      node scripts/referencias.mjs --sellar');
  process.exit(1);
}

const sello = JSON.parse(fs.readFileSync(LOCK, 'utf8'));
const movidos = [];
for (const id of usados.keys()) {
  if (sello[id] === undefined) { movidos.push([id, '(nuevo, sin revisar)', HOY[id]]); continue; }
  if (sello[id] !== HOY[id]) movidos.push([id, sello[id], HOY[id]]);
}

if (movidos.length) {
  console.log('  CAMBIADOS     ' + movidos.length + '\n');
  console.log('  Estos códigos ya NO son la regla que eran. Las referencias que los');
  console.log('  usan apuntan a otra cosa: hay que releerlas una por una.\n');
  for (const [id, antes, ahora] of movidos) {
    console.log('  ✗ ' + id + '  (' + [...usados.get(id)].join(', ') + ')');
    console.log('      era:   ' + antes);
    console.log('      es:    ' + ahora);
  }
  console.log('\n  Cuando estén revisadas:  node scripts/referencias.mjs --sellar');
  process.exit(1);
}

console.log('  cambiados     0');
