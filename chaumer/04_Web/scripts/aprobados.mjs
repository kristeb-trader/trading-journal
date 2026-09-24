/**
 * aprobados.mjs — que el texto aprobado este DIBUJADO en su pagina.
 *
 * Tarea 3 de PENDIENTE_PORTAL.md. `textos\` guarda el texto de la portada y
 * de los ocho modulos para que se corrija comodo. Pero nada comprobaba que
 * lo corregido llegara a la pagina: la seccion de riesgo quedo escrita en
 * `textos\08-riesgo.md` y nunca se dibujo, y nadie se entero.
 *
 * Compara los TITULOS de cada archivo con los de su pagina ya compilada:
 *
 *   FALTA EN LA PAGINA   un titulo aprobado que la pagina no tiene.   → falla
 *   SOLO EN LA PAGINA    un titulo de la pagina que el texto no tiene: el
 *                        archivo se quedo atras. Se avisa, no falla — se
 *                        arregla regenerando con scripts/textos.mjs.
 *
 * Los codigos de regla no cuentan (el texto los arrastra y la pagina los
 * pinta aparte), ni la seccion «Anotaciones que seguian abiertas», que el
 * exportador anade a proposito con las notas del operador.
 *
 * La lista de paginas se lee de scripts/textos.mjs: una sola lista.
 *
 *   npm run build   ← primero
 *   node scripts/aprobados.mjs
 *
 * Sale con codigo 1 si falta algun titulo aprobado.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(WEB, 'dist');
const TEXTOS = path.join(WEB, 'textos');

const fuente = fs.readFileSync(path.join(WEB, 'scripts', 'textos.mjs'), 'utf8');
const PAGINAS = [...fuente.matchAll(/\{\s*archivo:\s*'([^']+)',\s*ruta:\s*'([^']*)'/g)]
  .map((m) => ({ archivo: m[1], ruta: m[2] }));
if (PAGINAS.length === 0) {
  console.log('aprobados\n  no encuentro la lista de paginas en scripts/textos.mjs');
  process.exit(1);
}

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };
const normal = (t) => t
  .normalize('NFC')
  .replace(/&(#?\w+);/g, (m, e) => ENTIDADES[e] ?? m)
  .replace(/\b[RPGCF]-\d+(\.\d+)?\b/g, ' ')   // codigos de regla, pendiente, caso
  .replace(/[·|]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/[.:]+$/, '')
  .toLowerCase();

function titulosDelTexto(archivo) {
  const titulos = [];
  for (const linea of fs.readFileSync(path.join(TEXTOS, archivo), 'utf8').split(/\r?\n/)) {
    // «> ####» son los titulos de dentro de una tarjeta o un aviso: cuentan igual.
    const m = linea.match(/^(?:>\s*)?(#{2,6})\s+(.*)$/);   // el «# » es el nombre del archivo
    if (!m) continue;
    if (/^anotaciones que segu[ií]an abiertas/i.test(m[2])) break;
    titulos.push({ nivel: m[1].length - 1, texto: m[2].trim() });
  }
  return titulos;
}

function titulosDeLaPagina(ruta) {
  const html = fs.readFileSync(path.join(DIST, ruta, 'index.html'), 'utf8');
  const main = (html.match(/<main\b[\s\S]*<\/main>/i) || [html])[0];
  return [...main.matchAll(/<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map((m) => ({ nivel: Number(m[1]), texto: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }))
    .filter((t) => t.texto);
}

const faltan = [];
const soloPagina = [];
let comparados = 0;
for (const { archivo, ruta } of PAGINAS) {
  if (!fs.existsSync(path.join(TEXTOS, archivo))) { faltan.push([archivo, '(no existe el archivo)']); continue; }
  if (!fs.existsSync(path.join(DIST, ruta, 'index.html'))) { faltan.push([archivo, '(no existe la pagina /' + ruta + ')']); continue; }
  const texto = titulosDelTexto(archivo);
  const pagina = titulosDeLaPagina(ruta);
  const enPagina = new Set(pagina.map((t) => normal(t.texto)));
  const enTexto = new Set(texto.map((t) => normal(t.texto)));
  comparados += texto.length;
  for (const t of texto) if (!enPagina.has(normal(t.texto))) faltan.push([archivo, t.texto]);
  for (const t of pagina) if (!enTexto.has(normal(t.texto))) soloPagina.push([archivo, t.texto]);
}

console.log('aprobados');
console.log('  archivos      ' + PAGINAS.length);
console.log('  títulos       ' + comparados);
if (soloPagina.length) {
  console.log('  AVISOS        ' + soloPagina.length + '  (en la página y no en el texto: regenerar con scripts/textos.mjs)');
  for (const [a, t] of soloPagina) console.log('    · ' + a + '  «' + t + '»');
}
if (faltan.length) {
  console.log('  FALLOS        ' + faltan.length + '  (aprobado y NO dibujado en la página)\n');
  for (const [a, t] of faltan) console.log('  ✗ ' + a + '  «' + t + '»');
  process.exit(1);
}
console.log('  fallos        0');
