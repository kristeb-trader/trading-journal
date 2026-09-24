/**
 * Cuenta el contenido REAL de las fuentes y lo imprime.
 *
 * Existe para que ningun numero del portal se de por supuesto. Se ejecuta
 * antes de tocar nada visual: si algo no cuadra, se ve aqui y no tres fases
 * mas tarde.
 *
 *   npm run fuentes
 */
import * as P from '../src/lib/parsers.mjs';

const linea = (etiqueta, valor, nota) =>
  console.log('  ' + String(etiqueta).padEnd(26) + String(valor).padStart(4) + (nota ? '   ' + nota : ''));

const v = P.version();
console.log('\nPLAN  v' + v.version + '  ·  ' + v.fecha + '\n');

// --- reglas
const reglas = P.reglas();
const cats = P.categorias();
console.log('REGLAS');
linea('reglas', reglas.length);
linea('identificadores unicos', new Set(reglas.map((r) => r.id)).size);
linea('categorias', cats.length);
console.log('     ' + cats.map((c) => c.id + ' (' + c.n + ')').join(' · '));
const conCampo = (c) => reglas.filter((r) => r[c] != null && r[c] !== ''
  && !(Array.isArray(r[c]) && r[c].length === 0)).length;
console.log('     campos presentes: accion ' + conCampo('accion') + ' · prioridad ' + conCampo('prioridad')
  + ' · nota ' + conCampo('nota') + ' · excepciones ' + conCampo('excepciones')
  + ' · fuente ' + conCampo('fuente') + ' · pendiente ' + conCampo('pendiente'));

// Sub-fases, glosario y backtesting ya no se cuentan: sus lectores se
// borraron el 22/09/2026 con la pagina que los usaba (tarea 9 de
// PENDIENTE_PORTAL.md). El portal no los ensena.

// --- resto de documentos
const gal = P.galeria();
const pen = P.pendientes();
const ctx = P.contextualizacion();
const chk = P.checklist();
const par = P.parametros();
const dia = P.diagramas();

console.log('\nDOCUMENTOS');
linea('casos de galeria', gal.length, gal.filter((c) => c.imagen).length + ' con imagen · '
  + gal.filter((c) => c.estandarActual).length + ' con el estandar actual');
linea('pendientes abiertos', pen.filter((p) => p.abierto).length,
  pen.filter((p) => p.abierto).map((p) => p.id).join(' '));
linea('desviaciones conscientes', P.desviaciones().length);
linea('cerrados', pen.filter((p) => p.estado === 'cerrado').length,
  'de ' + pen.length + ' encabezados con identificador');
linea('elementos de contexto', ctx.items.length,
  new Set(ctx.items.map((i) => i.id)).size + ' identificadores'
  + (ctx.duplicados.length ? ' · REPETIDOS: ' + ctx.duplicados.join(', ') : ''));
linea('bloques de checklist', chk.length);
linea('parametros', par.size, [...par.keys()].join(' '));
linea('diagramas mermaid', dia.reduce((a, d) => a + d.n, 0),
  dia.map((d) => d.archivo + ':' + d.n).join(' · '));

// --- contraste con lo que dicen las cabeceras
console.log('\nDESAJUSTES CON LAS CABECERAS  (se muestran, no se corrigen)');
const desajustes = [
  ['GALERIA.md dice 11 casos', gal.length],
  ['el guion dice 8 pendientes abiertos', pen.filter((p) => p.abierto).length],
  ['el guion dice 2 diagramas', dia.reduce((a, d) => a + d.n, 0)],
];
for (const [dice, hay] of desajustes) console.log('  ' + dice.padEnd(38) + '-> hay ' + hay);
if (ctx.duplicados.length) {
  console.log('  identificadores de contexto repetidos'.padEnd(40) + '-> ' + ctx.duplicados.join(', '));
}
console.log('');
