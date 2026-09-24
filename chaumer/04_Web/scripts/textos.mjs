/**
 * textos.mjs — saca a .md todo el texto visible de la portada y los ocho
 * modulos, para corregirlo comodo en un editor y devolverlo despues.
 *
 * POR QUE EXISTE
 * Corregir la prosa pidiendo cambio a cambio por el chat es lento y caro. Con
 * esto el operador recibe nueve archivos de texto plano, los corrige del
 * tiron, y la vuelta se aplica leyendo esos archivos — sin que el contenido
 * tenga que viajar por la conversacion.
 *
 * DE DONDE LEE
 * De `dist/`, es decir de la pagina ya compilada. Asi el texto es EXACTAMENTE
 * el que se ve en pantalla, con los parametros ya resueltos (donde el codigo
 * pone {v('STOP_MAX')} aqui pone «80 puntos»).
 *
 *   npm run build   ← primero, siempre
 *   node scripts/textos.mjs
 *
 * QUE NO SALE
 * Los codigos de regla (R-22, P-14…), que son del modo tecnico y no se
 * corrigen; el menu, la ruta de apartados y el pie, que no son contenido.
 *
 * CADA BLOQUE LLEVA SU ANCLA  <!-- id: … -->
 * Es lo que permite devolver los cambios al sitio exacto. No se tocan.
 */
import fs from 'node:fs';
import path from 'node:path';

const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const WEB = path.dirname(AQUI);
const DIST = path.join(WEB, 'dist');
const SALIDA = path.join(WEB, 'textos');

const PAGINAS = [
  { archivo: '00-portada.md', ruta: '', titulo: 'Portada' },
  { archivo: '01-premercado.md', ruta: 'premercado', titulo: '01 · Premercado' },
  { archivo: '02-zonas.md', ruta: 'zonas', titulo: '02 · Marcación de zonas' },
  { archivo: '03-setups.md', ruta: 'setups', titulo: '03 · Setups operativos' },
  { archivo: '04-jornada.md', ruta: 'jornada', titulo: '04 · Jornada operativa' },
  { archivo: '05-entrada.md', ruta: 'entrada', titulo: '05 · Mecánica de entrada' },
  { archivo: '06-filtros.md', ruta: 'filtros', titulo: '06 · Cuándo NO se entra' },
  { archivo: '07-dentro.md', ruta: 'dentro', titulo: '07 · Dentro de la operación' },
  { archivo: '08-riesgo.md', ruta: 'riesgo', titulo: '08 · Riesgo y tamaño' },
];

// ── utilidades de texto ───────────────────────────────────────────────────
const ENTIDADES = {
  amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ',
  laquo: '«', raquo: '»', hellip: '…', mdash: '—', ndash: '–', rsquo: '’',
  lsquo: '‘', ldquo: '“', rdquo: '”', times: '×', deg: '°', middot: '·',
  larr: '←', rarr: '→', check: '✓',
};

function desentidad(t) {
  return t
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z#0-9]+);/gi, (m, n) => (n in ENTIDADES ? ENTIDADES[n] : m));
}

const limpio = (t) => desentidad(t.replace(/\s+/g, ' ')).trim();

/** Quita un elemento entero, con sus anidados, buscando su cierre real. */
function quitarElemento(html, apertura, etiqueta) {
  const ini = html.indexOf(apertura);
  if (ini === -1) return html;
  const abre = new RegExp(`<${etiqueta}\\b`, 'gi');
  const cierra = new RegExp(`</${etiqueta}>`, 'gi');
  let i = ini + apertura.length, nivel = 1;
  while (nivel > 0 && i < html.length) {
    abre.lastIndex = i; cierra.lastIndex = i;
    const a = abre.exec(html), c = cierra.exec(html);
    if (!c) return html.slice(0, ini);
    if (a && a.index < c.index) { nivel++; i = a.index + a[0].length; }
    else { nivel--; i = c.index + c[0].length; }
  }
  return html.slice(0, ini) + html.slice(i);
}

/** Quita todos los elementos cuya etiqueta de apertura contenga `marca`. */
function quitarTodos(html, marca, etiqueta) {
  let antes;
  do {
    antes = html;
    const re = new RegExp(`<${etiqueta}\\b[^>]*${marca}[^>]*>`, 'i');
    const m = html.match(re);
    if (m) html = quitarElemento(html, m[0], etiqueta);
  } while (html !== antes);
  return html;
}

/** El HTML de dentro de una etiqueta a texto con marcas de Markdown. */
function aTexto(html) {
  let t = html;
  t = t.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, x) => `**${limpio(quitarMarcas(x))}**`);
  t = t.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, x) => `*${limpio(quitarMarcas(x))}*`);
  t = t.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, x) => `\`${limpio(quitarMarcas(x))}\``);
  t = t.replace(/<br\s*\/?>/gi, ' ');
  return limpio(quitarMarcas(t));
}

const quitarMarcas = (t) => t.replace(/<[^>]+>/g, '');

/** Todos los elementos de una etiqueta, con sus atributos y su interior. */
function* elementos(html, etiqueta) {
  const re = new RegExp(`<${etiqueta}\\b([^>]*)>`, 'gi');
  let m;
  while ((m = re.exec(html))) {
    const abre = new RegExp(`<${etiqueta}\\b`, 'gi');
    const cierra = new RegExp(`</${etiqueta}>`, 'gi');
    let i = m.index + m[0].length, nivel = 1, fin = -1;
    while (nivel > 0 && i < html.length) {
      abre.lastIndex = i; cierra.lastIndex = i;
      const a = abre.exec(html), c = cierra.exec(html);
      if (!c) break;
      if (a && a.index < c.index) { nivel++; i = a.index + a[0].length; }
      else { nivel--; fin = c.index; i = c.index + c[0].length; }
    }
    if (fin === -1) continue;
    yield { attrs: m[1], dentro: html.slice(m.index + m[0].length, fin), fin: i };
    re.lastIndex = i;
  }
}

const atributo = (attrs, nombre) => {
  const m = attrs.match(new RegExp(`${nombre}="([^"]*)"`, 'i'));
  return m ? desentidad(m[1]) : null;
};

// ── conversion de un bloque a Markdown ────────────────────────────────────
function bloqueAMd(html, salida) {
  // Se recorre en orden de aparicion para no perder la secuencia del texto.
  const re = /<(h1|h2|h3|h4|p|ol|ul|dl|figure|table|blockquote|div)\b([^>]*)>/gi;
  let m;
  const vistos = new Set();

  while ((m = re.exec(html))) {
    if (vistos.has(m.index)) continue;
    const etiqueta = m[1].toLowerCase();
    const attrs = m[2];
    const clase = atributo(attrs, 'class') || '';

    // Contenedores que solo agrupan: se entra dentro, no se imprimen.
    if (etiqueta === 'div' && !/\b(duro|veto|tarj)\b/.test(clase)) continue;
    // El «01 de 08» es cronica de la pagina, no texto que se corrija.
    if (etiqueta === 'p' && /\bmod-n\b/.test(clase)) continue;

    const trozo = [...elementos(html.slice(m.index), etiqueta)][0];
    if (!trozo) continue;
    const dentro = trozo.dentro;
    // Se salta el elemento ENTERO, no solo su etiqueta de apertura: si no,
    // los <p> de dentro de un aviso se volvian a leer sueltos y el bloque
    // salia dos veces, una dentro de la cita y otra fuera.
    const finReal = m.index + trozo.fin;

    if (/^h[1-4]$/.test(etiqueta)) {
      const nivel = Number(etiqueta[1]);
      const txt = aTexto(dentro);
      if (txt) salida.push('', '#'.repeat(Math.min(nivel + 1, 6)) + ' ' + txt);
    } else if (etiqueta === 'p') {
      const txt = aTexto(dentro);
      if (txt) salida.push('', txt);
    } else if (etiqueta === 'ol' || etiqueta === 'ul') {
      salida.push('');
      let n = 1;
      for (const li of elementos(dentro, 'li')) {
        const txt = aTexto(li.dentro);
        if (txt) salida.push(etiqueta === 'ol' ? `${n++}. ${txt}` : `- ${txt}`);
      }
    } else if (etiqueta === 'dl') {
      salida.push('');
      const dts = [...elementos(dentro, 'dt')].map((x) => aTexto(x.dentro));
      const dds = [...elementos(dentro, 'dd')].map((x) => aTexto(x.dentro));
      dts.forEach((dt, i) => { if (dt) salida.push(`- **${dt}** — ${dds[i] ?? ''}`); });
    } else if (etiqueta === 'figure') {
      const img = dentro.match(/<img\b([^>]*)>/i);
      const alt = img ? atributo(img[1], 'alt') : null;
      const cap = [...elementos(dentro, 'figcaption')][0];
      salida.push('', `> 🖼 **Gráfico.** Texto alternativo: ${alt || '(sin texto)'}`);
      if (cap) salida.push(`> Pie: ${aTexto(cap.dentro)}`);
    } else if (etiqueta === 'blockquote') {
      const txt = aTexto(dentro);
      if (txt) salida.push('', '> ' + txt);
    } else if (etiqueta === 'table') {
      salida.push('');
      for (const fila of elementos(dentro, 'tr')) {
        const celdas = [...elementos(fila.dentro, 'th'), ...elementos(fila.dentro, 'td')]
          .map((c) => aTexto(c.dentro));
        if (celdas.length) salida.push('| ' + celdas.join(' | ') + ' |');
      }
    } else if (etiqueta === 'div') {
      const tipo = /\bveto\b/.test(clase) ? 'NO SE HACE'
        : /\bduro\b/.test(clase) ? 'REGLA DURA' : 'FICHA';
      salida.push('', `> **[${tipo}]**`);
      const dentroSalida = [];
      bloqueAMd(dentro, dentroSalida);
      for (const l of dentroSalida) if (l.trim()) salida.push('> ' + l);
    }
    re.lastIndex = finReal;
  }
}

// ── una pagina ────────────────────────────────────────────────────────────
function pagina(p) {
  const f = path.join(DIST, p.ruta, 'index.html');
  if (!fs.existsSync(f)) return { error: 'no existe ' + f };
  let html = fs.readFileSync(f, 'utf8');

  // Solo el contenido: fuera cabecera, menu y pie de pagina.
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (!main) return { error: 'sin <main> en ' + p.ruta };
  html = main[1];

  // Fuera lo que no es contenido corregible.
  html = quitarTodos(html, 'class="ruta', 'nav');
  html = quitarTodos(html, 'class="mod-pie', 'nav');
  html = quitarTodos(html, 'solo-tecnico', 'span');
  html = quitarTodos(html, 'ref-cod', 'span');
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  const out = [
    `# ${p.titulo}`,
    '',
    `> Dirección: \`/${p.ruta}\``,
    '> Corrige el texto libremente. **No borres ni cambies las líneas `<!-- id: … -->`**:',
    '> son las que dicen a qué parte de la página vuelve cada bloque.',
  ];

  // La cabecera del modulo (numero, titulo y entradilla) va aparte.
  const cab = [...elementos(html, 'header')][0];
  if (cab) {
    out.push('', '<!-- id: cabecera -->');
    bloqueAMd(cab.dentro, out);
    html = quitarElemento(html, html.match(/<header\b[^>]*>/i)[0], 'header');
  }

  // Cada apartado con su ancla.
  const apartados = [...html.matchAll(/<section\b([^>]*)>/gi)];
  let hubo = false;
  for (const a of apartados) {
    const id = atributo(a[1], 'id');
    const clase = atributo(a[1], 'class') || '';
    if (!/\bap\b/.test(clase)) continue;
    const sec = [...elementos(html.slice(a.index), 'section')][0];
    if (!sec) continue;
    hubo = true;
    out.push('', '---', '', `<!-- id: ${id} -->`);
    bloqueAMd(sec.dentro, out);
  }

  // La portada no tiene apartados: se vuelca entera.
  if (!hubo) {
    out.push('', '---', '', '<!-- id: cuerpo -->');
    bloqueAMd(html, out);
  }

  let texto = out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  fs.mkdirSync(SALIDA, { recursive: true });
  // Las anotaciones del operador NO se pierden al regenerar. Si el archivo
  // anterior tenia [NOTA: ...] o [IMAGEN: ...] que todavia no estan en la
  // pagina, se arrastran al final en vez de desaparecer.
  const destino = path.join(SALIDA, p.archivo);
  if (fs.existsSync(destino)) {
    const antes = fs.readFileSync(destino, 'utf8');
    const notas = (antes.match(/\[(?:NOTA|IMAGEN):[^\]]*\]/g) || [])
      .filter((n) => !texto.includes(n));
    if (notas.length) {
      texto += [
        '', '---', '',
        '## Anotaciones que seguian abiertas', '',
        'Venian del archivo anterior y todavia no estan reflejadas en la pagina.',
        'Borralas cuando ya no hagan falta.', '',
      ].join('\n') + notas.map((n) => '- ' + n).join('\n') + '\n';
    }
  }
  fs.writeFileSync(destino, texto, 'utf8');
  return { palabras: texto.split(/\s+/).length, bytes: Buffer.byteLength(texto) };
}

// ── marcha ────────────────────────────────────────────────────────────────
if (!fs.existsSync(DIST)) {
  console.error('No existe dist/. Ejecuta antes:  npm run build');
  process.exit(1);
}

console.log('textos → 04_Web/textos/');
let total = 0;
for (const p of PAGINAS) {
  const r = pagina(p);
  if (r.error) { console.log('  ✗ ' + p.archivo + ' — ' + r.error); continue; }
  total += r.palabras;
  console.log(`  ${p.archivo.padEnd(20)} ${String(r.palabras).padStart(5)} palabras`);
}
console.log(`\n  ${PAGINAS.length} archivos · ${total} palabras en total`);
