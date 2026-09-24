/**
 * Las miniaturas de «Casos reales»: donde vive la version pequena de cada
 * grafica.
 *
 * La pagina es un indice de tarjetas (propuesta aprobada por el operador el
 * 22/09/2026): cargar las 30 graficas a tamano completo eran 8 MB para
 * mirarlas en pequeno. La grande solo se descarga al abrir el visor.
 *
 * Las genera scripts/miniaturas.mjs en cada compilacion, a partir de las
 * mismas imagenes que usa la pagina. Viven en public/min/ y no dentro de
 * public/assets/, porque el sync vacia esa carpeta cada vez y las obligaria a
 * rehacerse todas. Esta es la unica regla que traduce una ruta a la otra, y la
 * comparten el script y la pagina para que no se desalineen.
 */
export const ANCHO_MINIATURA = 720;

/** «/assets/galeria/G-01.png» -> «/min/galeria/G-01.webp». */
export function miniatura(url) {
  if (!url) return null;
  return url
    .replace(/^\/assets\//, '/min/')
    .replace(/\.(png|jpe?g|webp)$/i, '.webp');
}
