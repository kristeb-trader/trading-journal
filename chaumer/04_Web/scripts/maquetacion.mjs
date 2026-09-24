/**
 * maquetacion.mjs — vigila las dos cosas que el operador tuvo que pedir seis
 * veces: que el texto vaya justificado y que no se corte contra una pared.
 *
 * No comprueba como se ve: comprueba que NADIE vuelva a meter en el código
 * las dos declaraciones que rompen la regla común de `base.css`.
 *
 *   1. Un tope de ancho fijo sobre texto  →  la pared invisible.
 *   2. Un `text-align: left` o `start`    →  se pierde el justificado.
 *   3. `text-wrap: balance` en un titulo  →  la pared invisible otra vez,
 *      esta sin max-width: reparte el titular en lineas de igual longitud,
 *      asi que corta antes del borde. El operador lo reporto ocho veces; las
 *      siete primeras arregle sintomas porque el vigilante solo miraba los
 *      topes de ancho y esto no lo es.
 *
 * Y la portada NO TIENE ESCAPE. Ni `ancho-ok` ni `balance-ok` valen ahi: la
 * pared volvio justamente por una excepcion `ancho-ok` que escribi yo en la
 * entradilla del banner. En esos tres archivos el texto llega al borde y
 * punto.
 *
 * Las dos tienen escape, pero hay que declararlo en la misma línea y con su
 * motivo, para que sea una decisión y no un descuido:
 *
 *   max-width: 20rem;            /* ancho-ok: columna de imagen en móvil * /
 *   text-align: left;            /* alineacion-ok: columna de etiquetas * /
 *
 *   node scripts/maquetacion.mjs
 *
 * Sale con código 1 si encuentra algo, para que no se publique sin querer.
 */
import fs from 'node:fs';
import path from 'node:path';

const WEB = path.dirname(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')));
const SRC = path.join(WEB, 'src');

/** Todos los .astro y .css de src/. */
function fuentes(dir) {
  const salida = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'content') continue;   // copia generada de 01_Plan
      salida.push(...fuentes(abs));
    } else if (/\.(astro|css)$/.test(e.name)) salida.push(abs);
  }
  return salida;
}

// Un tope de ancho en ch, rem, em o px. Los de `%`, `none` y `var(--ancho)`
// son los que limitan el contenedor, no el texto: esos se dejan pasar.
const TOPE_FIJO = /max-width:\s*(?!none|100%|auto|var\()[^;]*\b\d+(\.\d+)?(ch|rem|em|px)\b/;
const IZQUIERDA = /text-align(-last)?:\s*(left|start)\b/;
const BALANCE = /text-wrap:\s*balance\b/;

// Archivos donde ninguna excepcion es valida: son los que ve Alfredo al abrir.
const SIN_ESCAPE = [
  'src/pages/index.astro',
  'src/componentes/BannerTerminal.astro',
  'src/componentes/TarjetasInicio.astro',
];

const fallos = [];
let revisados = 0;

for (const archivo of fuentes(SRC)) {
  const rel = path.relative(WEB, archivo).replace(/\\/g, '/');
  const lineas = fs.readFileSync(archivo, 'utf8').split('\n');
  lineas.forEach((linea, i) => {
    revisados++;
    // `@media (max-width: 900px)` es una condición, no una declaración.
    if (linea.trim().startsWith('@media')) return;
    const portada = SIN_ESCAPE.includes(rel);
    if (TOPE_FIJO.test(linea) && (portada || !linea.includes('ancho-ok'))) {
      fallos.push([rel, i + 1, linea.trim(), 'tope de ancho fijo sobre texto',
        portada ? '' : 'ancho-ok']);
    }
    if (BALANCE.test(linea) && (portada || !linea.includes('balance-ok'))) {
      fallos.push([rel, i + 1, linea.trim(),
        'text-wrap: balance corta el titular antes del borde — usa `pretty`',
        portada ? '' : 'balance-ok']);
    }
    if (IZQUIERDA.test(linea) && !linea.includes('alineacion-ok') && !linea.includes('text-align-last: left')) {
      fallos.push([rel, i + 1, linea.trim(), 'rompe el justificado', 'alineacion-ok']);
    }
  });
}

// La regla común tiene que seguir ahí. Si alguien la borra, todo lo demás
// pasaría la revisión y el portal quedaría sin justificar.
const base = fs.readFileSync(path.join(SRC, 'estilos', 'base.css'), 'utf8');
if (!/main :is\([^)]*\)\s*\{\s*\n\s*text-align: justify;/.test(base)) {
  fallos.push(['src/estilos/base.css', 0, '(falta)',
    'no encuentro la regla común de justificado', '']);
}

console.log('maquetación');
console.log('  líneas        ' + revisados);

if (fallos.length) {
  console.log('  FALLOS        ' + fallos.length + '\n');
  for (const [arch, linea, texto, por, escape] of fallos) {
    console.log('  ✗ ' + arch + ':' + linea + '  — ' + por);
    console.log('      ' + texto);
    if (escape) console.log('      si es a propósito, añade  /* ' + escape + ': motivo */');
  }
  process.exit(1);
}

console.log('  fallos        0');
