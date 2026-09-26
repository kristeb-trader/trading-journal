// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';

// Las reglas fusionadas (F3 de la reestructuración, 26/09/2026) no se renumeran ni se borran: su dirección
// lleva a la regla que las absorbió. El mapa lo genera el lector de las reglas (reglas.json, «fusionadas»),
// y scripts/sync.mjs lo copia a src/content antes del build.
const fusionadas = (() => {
  try { return JSON.parse(fs.readFileSync(new URL('./src/content/reglas.json', import.meta.url), 'utf8')).fusionadas || {}; }
  catch { return {}; }
})();

// Salida estatica: el plan es contenido, no aplicacion. Las unicas partes
// dinamicas (las observaciones de Alfredo) viven en funciones de Cloudflare,
// fuera de este build.
export default defineConfig({
  // Sin compresion de HTML: colapsaba el salto de linea que hay antes de un
  // <strong> o de un {parametro}, y las frases salian pegadas («lo hizocon el
  // cuerpo», «pasan5 velas»). El peso de mas es irrelevante al lado de eso.
  compressHTML: false,
  output: 'static',
  redirects: Object.fromEntries(Object.entries(fusionadas).map(([de, a]) => [`/reglas/${de}`, `/reglas/${a}`])),
  outDir: './dist',
  srcDir: './src',
  publicDir: './public',
  build: { format: 'directory' },
  markdown: {
    // Sin resaltado de sintaxis: en el plan no hay codigo, hay tablas y prosa.
    syntaxHighlight: false,
  },
});
