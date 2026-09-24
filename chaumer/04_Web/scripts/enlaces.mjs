/**
 * enlaces.mjs — comprueba que ningun enlace del portal apunte a la nada.
 *
 * Recorre dist/ y, por cada href y cada src interno, verifica que exista la
 * pagina, el archivo o el ancla al que apunta. Se ejecuta ANTES de publicar.
 *
 * El `src` se anadio el 07/09/2026: hasta entonces solo se miraban los
 * enlaces, asi que una imagen rota pasaba el control sin que nadie lo viera.
 * Salio al borrar ocho diagramas de golpe.
 *
 *   node scripts/enlaces.mjs
 *
 * Sale con codigo 1 si encuentra algo roto, para que no se suba sin querer.
 */
import fs from 'node:fs';
import path from 'node:path';

const WEB = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const DIST = path.join(path.dirname(WEB), 'dist');

if (!fs.existsSync(DIST)) {
  console.error('No existe dist/. Ejecuta antes:  npm run build');
  process.exit(1);
}

/** Todos los .html de dist, con su ruta de URL. */
function paginas(dir = DIST, base = '') {
  const salida = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) salida.push(...paginas(abs, base + '/' + e.name));
    else if (e.name.endsWith('.html')) {
      salida.push({ archivo: abs, url: (base || '/') === '/' ? '/' : base });
    }
  }
  return salida;
}

const html = paginas();
const urls = new Set(html.map((p) => p.url));

// Las anclas que existen en cada pagina, para comprobar los enlaces con #.
const anclas = new Map();
for (const p of html) {
  const t = fs.readFileSync(p.archivo, 'utf8');
  const ids = new Set();
  for (const m of t.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1]);
  for (const m of t.matchAll(/\sname="([^"]+)"/g)) ids.add(m[1]);
  anclas.set(p.url, ids);
}

const rotos = [];
let total = 0;

for (const p of html) {
  const texto = fs.readFileSync(p.archivo, 'utf8');
  for (const m of texto.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const href = m[1];
    // fuera: externos, correo, telefono, anclas vacias
    if (/^(https?:|mailto:|tel:|data:|#$)/.test(href)) continue;
    // fuera: hrefs que arma el JavaScript de la pagina, no son enlaces
    if (href.includes("' +") || href.includes('${')) continue;
    total++;

    const [rutaCruda, ancla] = href.split('#');
    let ruta = rutaCruda;

    if (!ruta) {                       // enlace a un ancla de esta misma pagina
      ruta = p.url;
    } else if (!ruta.startsWith('/')) {
      rotos.push([p.url, href, 'ruta relativa, el portal usa absolutas']);
      continue;
    }

    const limpia = ruta.replace(/\/$/, '') || '/';

    // ¿es una pagina?
    if (urls.has(limpia)) {
      // Las anclas de filtro (#g=grupo) las resuelve el JavaScript de la
      // pagina, no son ids del documento.
      if (ancla && !ancla.startsWith('g=') && !anclas.get(limpia).has(ancla)) {
        rotos.push([p.url, href, 'la pagina existe pero no tiene ese ancla']);
      }
      continue;
    }

    // ¿es un archivo de public/?
    const archivo = path.join(DIST, decodeURIComponent(ruta));
    if (fs.existsSync(archivo)) continue;

    // /api/... lo sirve una funcion de Cloudflare, no esta en dist
    if (ruta.startsWith('/api/')) continue;

    rotos.push([p.url, href, 'no existe']);
  }
}

console.log('enlaces e imagenes');
console.log('  paginas       ' + html.length);
console.log('  comprobados   ' + total);

if (rotos.length) {
  console.log('  ROTOS         ' + rotos.length + '\n');
  const vistos = new Set();
  for (const [donde, href, por] of rotos) {
    const clave = href + ' ' + por;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    console.log('  ✗ ' + href + '  — ' + por);
    console.log('      en ' + donde);
  }
  process.exit(1);
}

console.log('  rotos         0');
