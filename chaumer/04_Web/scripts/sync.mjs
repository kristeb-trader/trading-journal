/**
 * sync.mjs — trae las fuentes de verdad al modulo web.
 *
 * 01_Plan/  -> src/content/
 * 02_Assets/ -> public/assets/
 *
 * 05_Backtesting/test_ciego/Back_claude/ -> public/assets/test-ciego/
 *
 * REGLA DURA: abre `01_Plan/`, `02_Assets/` y el test ciego en SOLO LECTURA y aborta si algun
 * destino cae fuera de `04_Web/`. El plan no se toca nunca desde aqui.
 *
 * Lo copiado esta en .gitignore: es derivado. El original vive en el repositorio.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(AQUI, '..');
const RAIZ = path.resolve(WEB, '..');
const PLAN = path.join(RAIZ, '01_Plan');
const ASSETS = path.join(RAIZ, '02_Assets');
const DEST_CONTENIDO = path.join(WEB, 'src', 'content');
const DEST_ASSETS = path.join(WEB, 'public', 'assets');
// Los graficos del test ciego diario. Los genera Cowork, uno por jornada.
const TEST_CIEGO = path.join(RAIZ, '05_Backtesting', 'test_ciego', 'Back_claude');

// Los documentos que el portal espera encontrar. Si falta uno, se avisa.
const DOCUMENTOS = [
  'TRADING_PLAN_CHAUMER.md',
  'CIERRE_FASE_1.md',
  'GLOSARIO.md',
  'PARAMETROS.md',
  'CHECKLIST_DIARIA.md',
  'GALERIA.md',
  'PENDIENTES.md',
  'CONTEXTUALIZACION.md',
  'ESTADO.md',
];

const avisos = [];
const aviso = (m) => { avisos.push(m); };

/** Ningun destino puede salirse de 04_Web. */
function destinoSeguro(destino) {
  const rel = path.relative(WEB, destino);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    console.error('ABORTADO: el destino cae fuera de 04_Web -> ' + destino);
    process.exit(1);
  }
  return destino;
}

function copiar(origen, destino) {
  destinoSeguro(destino);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, fs.readFileSync(origen)); // lectura + escritura, nunca mueve
}

function limpiar(dir) {
  destinoSeguro(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function pngsDe(dir, prefijo = '') {
  if (!fs.existsSync(dir)) return [];
  const salida = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefijo ? prefijo + '/' + e.name : e.name;
    if (e.isDirectory()) salida.push(...pngsDe(path.join(dir, e.name), rel));
    else if (/\.png$/i.test(e.name)) salida.push(rel);
  }
  return salida;
}

// ---------------------------------------------------------------- documentos
limpiar(DEST_CONTENIDO);
let docsCopiados = 0;
for (const doc of DOCUMENTOS) {
  const origen = path.join(PLAN, doc);
  if (!fs.existsSync(origen)) { aviso('falta el documento esperado: 01_Plan/' + doc); continue; }
  copiar(origen, path.join(DEST_CONTENIDO, 'plan', doc));
  docsCopiados++;
}

// -------------------------------------------------------------- reglas.json
const ORIGEN_REGLAS = path.join(PLAN, 'reglas.json');
let reglas = [];
if (!fs.existsSync(ORIGEN_REGLAS)) {
  console.error('ABORTADO: no existe 01_Plan/reglas.json, que es la fuente de verdad.');
  process.exit(1);
}
try {
  reglas = JSON.parse(fs.readFileSync(ORIGEN_REGLAS, 'utf8'));
  if (!Array.isArray(reglas)) throw new Error('se esperaba un array de reglas');
} catch (e) {
  console.error('ABORTADO: reglas.json no es JSON valido -> ' + e.message);
  process.exit(1);
}
copiar(ORIGEN_REGLAS, path.join(DEST_CONTENIDO, 'reglas.json'));

// ---------------------------------------------------------- indice de reglas
// Una linea por regla: numero, grupo y enunciado. Sirve para leer UNA regla
// sin cargar las cuarenta: reglas.json pesa unos 88 KB y esto, unos 6.
// Tarea 6 de PENDIENTE_PORTAL.md. Se genera siempre, asi que no se desvia.
{
  const lineas = [
    '# Índice de reglas',
    '',
    '> **Generado por `scripts/sync.mjs` desde `01_Plan/reglas.json`. No se edita.**',
    '> Una línea por regla: número · grupo · enunciado. Para el detalle —condiciones,',
    '> excepciones, nota— abre ESA regla en `reglas.json`, no el archivo entero.',
    '',
    reglas.length + ' reglas.',
    '',
  ];
  for (const r of reglas) {
    const grupo = (r.categoria_nombre || r.categoria || '—')
      + (r.subcategoria ? ' (' + r.subcategoria + ')' : '');
    const enunciado = String(r.enunciado || '').replace(/\s+/g, ' ').trim();
    lineas.push(r.id + ' · ' + grupo + ' · ' + enunciado);
  }
  fs.writeFileSync(
    destinoSeguro(path.join(DEST_CONTENIDO, 'reglas_indice.md')),
    lineas.join('\n') + '\n',
    'utf8',
  );
}

// ----------------------------------------------------------------- subfases
const DIR_SUBFASES = path.join(PLAN, 'subfases');
let subfases = 0;
if (fs.existsSync(DIR_SUBFASES)) {
  for (const f of fs.readdirSync(DIR_SUBFASES)) {
    if (!/\.md$/i.test(f)) continue;
    copiar(path.join(DIR_SUBFASES, f), path.join(DEST_CONTENIDO, 'subfases', f));
    subfases++;
  }
}

// ------------------------------------------------------------------- assets
limpiar(DEST_ASSETS);
const imagenes = pngsDe(ASSETS);
for (const rel of imagenes) copiar(path.join(ASSETS, rel), path.join(DEST_ASSETS, rel));

// --------------------------------------------------------------- manifiesto
// La imagen se asocia SOLO por nombre de archivo. Si no lo dice el nombre,
// no hay imagen: nada de placeholders ni de suplentes inventados.
const manifiesto = { reglas: {}, casos: {}, sueltas: [] };

for (const rel of imagenes) {
  const base = path.basename(rel);
  const regla = base.match(/^(R-\d{1,2})_/i);
  const caso = base.match(/^(G-\d{1,2})_/i);
  const url = '/assets/' + rel.split(path.sep).join('/');

  if (regla) {
    const id = regla[1].toUpperCase();
    const papel = /(^|\/)invalidos\//i.test(rel) ? 'contraejemplo' : 'diagrama';
    (manifiesto.reglas[id] = manifiesto.reglas[id] || []).push({ url, papel });
  } else if (caso) {
    const id = caso[1].toUpperCase();
    // Las de sesiones/ llevan el estandar visual actual y ganan siempre.
    const actual = /(^|\/)galeria\/sesiones\//i.test(rel);
    const previo = manifiesto.casos[id];
    if (!previo || (actual && !previo.actual)) manifiesto.casos[id] = { url, actual };
  } else {
    manifiesto.sueltas.push(url);
  }
}

// Aviso: gráfica de sesión que no corresponde a ningún caso de GALERIA.md
const galeria = path.join(PLAN, 'GALERIA.md');
if (fs.existsSync(galeria)) {
  const texto = fs.readFileSync(galeria, 'utf8');
  const casosDocumentados = new Set((texto.match(/^##\s*(G-\d{1,2})/gim) || [])
    .map((h) => h.replace(/^##\s*/i, '').toUpperCase()));
  for (const id of Object.keys(manifiesto.casos)) {
    if (!casosDocumentados.has(id)) aviso('imagen de caso ' + id + ' sin entrada en GALERIA.md');
  }
} else {
  aviso('falta GALERIA.md: no se puede comprobar la correspondencia de imagenes');
}

fs.writeFileSync(
  path.join(DEST_CONTENIDO, 'manifiesto.json'),
  JSON.stringify(manifiesto, null, 2) + '\n',
  'utf8',
);

// --------------------------------------------------------------- test ciego
// Solo lectura, como el plan. Se copia solo lo que se llama AAAA-MM-DD.png:
// la fecha del nombre es lo unico que dice a que jornada pertenece. Lo demas
// de la carpeta (el LEEME) no viaja.
const jornadas = [];
if (fs.existsSync(TEST_CIEGO)) {
  for (const f of fs.readdirSync(TEST_CIEGO).sort()) {
    const m = f.match(/^(\d{4}-\d{2}-\d{2})\.png$/i);
    if (!m) continue;
    copiar(path.join(TEST_CIEGO, f), path.join(DEST_ASSETS, 'test-ciego', f));
    jornadas.push({ fecha: m[1], url: '/assets/test-ciego/' + f });
  }
} else {
  aviso('no existe 05_Backtesting/test_ciego/Back_claude: la pagina del test ciego saldra vacia');
}
fs.writeFileSync(
  path.join(DEST_CONTENIDO, 'test_ciego.json'),
  JSON.stringify(jornadas, null, 2) + '\n',
  'utf8',
);

// ------------------------------------------------------------------ informe
console.log('sync');
console.log('  documentos    ' + docsCopiados + '/' + DOCUMENTOS.length);
console.log('  reglas.json   ' + reglas.length + ' reglas');
console.log('  indice        src/content/reglas_indice.md');
console.log('  subfases      ' + subfases);
console.log('  imagenes      ' + imagenes.length);
console.log('  test ciego    ' + jornadas.length + ' jornadas');
console.log('  manifiesto    ' + Object.keys(manifiesto.reglas).length + ' reglas con imagen · '
  + Object.keys(manifiesto.casos).length + ' casos con imagen · '
  + manifiesto.sueltas.length + ' sueltas');
if (avisos.length) {
  console.log('\n  AVISOS (' + avisos.length + '):');
  avisos.forEach((a) => console.log('   - ' + a));
}
