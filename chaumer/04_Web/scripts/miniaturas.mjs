/**
 * miniaturas.mjs — la version pequena de cada grafica de «Casos reales».
 *
 * Va despues del sync: lee las imagenes que la pagina usa de verdad (las da
 * P.casosReales()) y escribe su miniatura en public/min/, que es generado y
 * no va a git.
 *
 * Solo rehace una miniatura si su grafica CAMBIO DE CONTENIDO. No vale la
 * fecha del archivo: el sync vuelve a copiar todas las imagenes en cada
 * compilacion. Las huellas quedan en public/min/huellas.json. Una miniatura
 * que ya no pide la pagina se borra.
 *
 *   node scripts/miniaturas.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import * as P from '../src/lib/parsers.mjs';
import { miniatura, ANCHO_MINIATURA } from '../src/lib/miniaturas.mjs';

const WEB = path.dirname(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')));
const PUBLICO = path.join(WEB, 'public');
const MIN = path.join(PUBLICO, 'min');
const HUELLAS = path.join(MIN, 'huellas.json');

const { testCiego, sesiones, ejemplos } = P.casosReales();
const urls = [...new Set([
  ...testCiego.map((x) => (x.jornada ? x.jornada.imagen : x.caso && x.caso.imagen)),
  ...sesiones.map((c) => c.imagen),
  ...ejemplos.map((c) => c.imagen),
].filter(Boolean))];

let antes = {};
try { antes = JSON.parse(fs.readFileSync(HUELLAS, 'utf8')); } catch { /* primera vez */ }
const ahora = {};
const faltan = [];
let hechas = 0;

for (const url of urls) {
  const origen = path.join(PUBLICO, url);
  if (!fs.existsSync(origen)) { faltan.push(url); continue; }
  const destino = path.join(PUBLICO, miniatura(url));
  const huella = crypto.createHash('sha1').update(fs.readFileSync(origen)).digest('hex');
  ahora[miniatura(url)] = huella;
  if (antes[miniatura(url)] === huella && fs.existsSync(destino)) continue;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  await sharp(origen)
    .resize({ width: ANCHO_MINIATURA, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(destino);
  hechas++;
}

// Las que sobran: una grafica que salio de la pagina no deja su miniatura.
let borradas = 0;
for (const rel of Object.keys(antes)) {
  if (ahora[rel]) continue;
  fs.rmSync(path.join(PUBLICO, rel), { force: true });
  borradas++;
}

fs.mkdirSync(MIN, { recursive: true });
fs.writeFileSync(HUELLAS, JSON.stringify(ahora, null, 1));
console.log(`miniaturas: ${urls.length} graficas · ${hechas} rehechas · ${borradas} borradas`);

if (faltan.length) {
  // Una grafica que la pagina pide y no esta. El vigilante de enlaces lo
  // cazaria igual, pero asi se ve en que paso se perdio.
  console.error('  sin grafica de origen:\n    ' + faltan.join('\n    '));
  process.exit(1);
}
