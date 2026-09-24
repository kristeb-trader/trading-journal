/**
 * Acceso a las fuentes ya sincronizadas en src/content/.
 *
 * Nadie fuera de src/lib/ lee un archivo. Las paginas piden datos, no texto
 * crudo, para que ningun componente acabe con contenido de trading dentro.
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * La raiz se busca desde el directorio de trabajo, NO desde import.meta.url:
 * al compilar, Astro empaqueta este modulo dentro de dist/ y la ruta relativa
 * al propio archivo deja de apuntar a src/content/.
 */
function raizDelModulo() {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, 'astro.config.mjs'))) return dir;
    const padre = path.dirname(dir);
    if (padre === dir) break;
    dir = padre;
  }
  return process.cwd();
}

export const CONTENIDO = path.join(raizDelModulo(), 'src', 'content');

/** Donde quedan los SVG ya dibujados por scripts/diagramas.mjs. */
export const CONTENIDO_DIAGRAMAS = path.join(raizDelModulo(), '.diagramas');

const cache = new Map();

// ─────────────────────────────────────────── la cifra del backtesting
/**
 * El resultado agregado del backtesting NO sale en el portal.
 *
 * Decision del operador, 22/09/2026. El plan lo cita en varios sitios —las
 * notas de regresion de las reglas, la galeria, la historia del plan— y la
 * regla del proyecto dice que si esa cifra aparece en pantalla, los cuatro
 * motivos por los que no mide la estrategia van al lado. El operador eligio
 * quitarla en vez de explicarla.
 *
 * Se reconoce por su forma, no por su valor, para que la siguiente cifra
 * rehecha tampoco se cuele: un total con signo, dos decimales y «en N»
 * operaciones — «−91,00 pts en 9», «-77.75 en 5». El resultado de un caso
 * suelto («+40,50 pts») no tiene esa forma y se queda.
 *
 * Se quita la FRASE que la contiene, no solo el numero: una frase con el
 * numero borrado diria otra cosa. Si una nota de regresion entera gira en
 * torno a la cifra, se va la nota entera. Las filas de tabla, enteras.
 *
 * El archivo del plan no se toca: esto solo decide que se pinta.
 * `scripts/cifras.mjs` comprueba sobre lo compilado que no quede ninguna.
 */
export const CIFRA_BACKTESTING = /[−\-+]\s?\d{1,3}[.,]\d{2}\s*(?:pts\s*)?en\s*\d+\b/;

function sinCifraEnFrases(texto) {
  return texto
    .split(/(?<=[.!?])\s+/)
    .filter((frase) => !CIFRA_BACKTESTING.test(frase))
    .join(' ');
}

/** Para los campos de reglas.json: segmentos separados por «||». */
function sinCifraEnNota(texto) {
  if (!CIFRA_BACKTESTING.test(texto)) return texto;
  return texto
    .split(/\s*\|\|\s*/)
    .filter((seg) => !(CIFRA_BACKTESTING.test(seg) && /^REGRESI[OÓ]N\b/i.test(seg)))
    .map(sinCifraEnFrases)
    .filter((seg) => seg.trim() !== '')
    .join(' || ');
}

/** Para los .md: linea a linea. */
function sinCifraEnMarkdown(md) {
  if (!CIFRA_BACKTESTING.test(md)) return md;
  return md
    .split('\n')
    .filter((linea) => !(/^\s*\|/.test(linea) && CIFRA_BACKTESTING.test(linea)))
    .map((linea) => (CIFRA_BACKTESTING.test(linea) ? sinCifraEnFrases(linea) : linea))
    .join('\n');
}

function sinCifraEnDatos(valor) {
  if (typeof valor === 'string') return sinCifraEnNota(valor);
  if (Array.isArray(valor)) return valor.map(sinCifraEnDatos);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, sinCifraEnDatos(v)]));
  }
  return valor;
}

/** Lee un documento sincronizado. Falla ruidosamente: un documento que falta
 *  es un error de sincronizacion, no algo que se disimule con texto vacio. */
export function documento(nombre) {
  if (cache.has(nombre)) return cache.get(nombre);
  const ruta = path.join(CONTENIDO, 'plan', nombre);
  if (!fs.existsSync(ruta)) {
    throw new Error('falta ' + nombre + ' en src/content/plan/. Ejecuta: npm run sync');
  }
  const texto = sinCifraEnMarkdown(fs.readFileSync(ruta, 'utf8'));
  cache.set(nombre, texto);
  return texto;
}

export function json(nombre) {
  const ruta = path.join(CONTENIDO, nombre);
  if (!fs.existsSync(ruta)) {
    throw new Error('falta ' + nombre + ' en src/content/. Ejecuta: npm run sync');
  }
  const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  return nombre === 'reglas.json' ? sinCifraEnDatos(datos) : datos;
}

export function subfasesSueltas() {
  const dir = path.join(CONTENIDO, 'subfases');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => /\.md$/i.test(f))
    .map((f) => ({ archivo: f, texto: fs.readFileSync(path.join(dir, f), 'utf8') }));
}

/** Parte un documento por encabezados de un nivel dado.
 *  Devuelve [{ nivel, titulo, cuerpo }] en el orden del documento. */
export function partirPorEncabezado(texto, niveles = [2]) {
  const lineas = texto.split(/\r?\n/);
  const marca = new RegExp('^(#{' + Math.min(...niveles) + ',' + Math.max(...niveles) + '})\\s+(.*)$');
  const bloques = [];
  let actual = null;
  let enCodigo = false;
  for (const linea of lineas) {
    if (/^\s*```/.test(linea)) enCodigo = !enCodigo;
    const m = enCodigo ? null : linea.match(marca);
    if (m && niveles.includes(m[1].length)) {
      if (actual) bloques.push(actual);
      actual = { nivel: m[1].length, titulo: m[2].trim(), cuerpo: '' };
    } else if (actual) {
      actual.cuerpo += linea + '\n';
    }
  }
  if (actual) bloques.push(actual);
  return bloques;
}

/** Quita emoji y adornos del principio de un titulo, sin tocar su texto. */
export function tituloLimpio(t) {
  // Quita todo lo que no sea letra, digito o backtick por delante: emoji,
  // simbolos y espacios. Deja intacto el texto del titulo.
  return t.replace(/^[^\p{L}\p{N}`~]+/u, '').replace(/^#+\s*/, '').trim();
}

/** Cuenta bloques ```mermaid en un texto. */
export function contarMermaid(texto) {
  return (texto.match(/^\s*```mermaid/gim) || []).length;
}
