/**
 * Dónde va cada cosa en «Reglas» (/plan). Solo cálculo: no toca el DOM.
 *
 * Diseño: docs/disenos/2026-10-20-reglas-plan-jornada.md §4.
 *
 * Dos disposiciones:
 *   · el HUB     núcleo + los 8 pasos de la jornada en corona
 *   · un PASO    sus apartados en serpiente, unidos por el recorrido del día
 *
 * Las medidas del hub son las del mapa de las 7 piezas (src/lib/mapa/), para
 * que las dos vistas se reconozcan como de la misma familia.
 */

export const NUCLEO = { w: 326, h: 212 };
export const PIEZA = { w: 262, h: 126 };
export const COLUMNA = 492;   // del núcleo a las columnas laterales
export const FILA_Y = 216;    // entre piezas de una columna
export const POLO_Y = 352;    // el paso de arriba (01) y el de abajo (05)

export const AP = { w: 248, h: 252 };   // la tarjeta de un apartado
export const AP_GAP_X = 48;
export const AP_FILA = AP.h + 104;

/* ── el hub ──────────────────────────────────────────────────────────── */

/**
 * Los 8 pasos en el sentido de las agujas del reloj, que es el orden de la
 * jornada: 01 arriba, 02-03-04 a la derecha bajando, 05 abajo, 06-07-08 a la
 * izquierda subiendo. Con 7 piezas (el mapa) no había polo de abajo.
 */
export function disponerHub(pasos) {
  const pos = {};
  const sitio = [
    { x: 0, y: -POLO_Y, lado: 'arriba', i: 0 },
    { x: COLUMNA, y: -FILA_Y, lado: 'derecha', i: 0 },
    { x: COLUMNA, y: 0, lado: 'derecha', i: 1 },
    { x: COLUMNA, y: FILA_Y, lado: 'derecha', i: 2 },
    { x: 0, y: POLO_Y, lado: 'abajo', i: 0 },
    { x: -COLUMNA, y: FILA_Y, lado: 'izquierda', i: 2 },
    { x: -COLUMNA, y: 0, lado: 'izquierda', i: 1 },
    { x: -COLUMNA, y: -FILA_Y, lado: 'izquierda', i: 0 },
  ];
  pasos.forEach((p, k) => {
    const s = sitio[k];
    if (!s) throw new Error('disponerHub: el hub tiene sitio para 8 pasos y llegan ' + pasos.length);
    pos[p.slug] = { ...s, w: PIEZA.w, h: PIEZA.h };
  });
  const x = COLUMNA + PIEZA.w / 2 + 40;
  const y = POLO_Y + PIEZA.h / 2 + 30;
  return { pos, caja: { x: -x, y: -y, w: 2 * x, h: 2 * y } };
}

/**
 * Tres pistas por paso hasta las patillas del núcleo. Los polos entran en
 * vertical; los laterales corren en horizontal, giran en su carril y entran
 * por el costado, cada uno a su altura para que no se crucen.
 */
export function pistasHub(pasos, pos) {
  const lineas = [];
  const cR = NUCLEO.w / 2, cL = -NUCLEO.w / 2, cT = -NUCLEO.h / 2, cB = NUCLEO.h / 2;

  for (const p of pasos) {
    const s = pos[p.slug];
    if (s.lado === 'arriba' || s.lado === 'abajo') {
      const sg = s.lado === 'arriba' ? 1 : -1;            // hacia el núcleo
      const yN = s.y + sg * PIEZA.h / 2;
      const yBorde = sg > 0 ? cT : cB;
      const yCarril = yBorde - sg * 66;
      for (let j = 0; j < 3; j++) {
        const o = (j - 1) * 6;
        const xPatilla = (j - 1) * 36;
        lineas.push({
          pts: [[o * 3.4, yN], [o * 3.4, yCarril + sg * o], [xPatilla, yCarril + sg * o], [xPatilla, yBorde]],
          rgb: p.rgb, fase: j * 200,
        });
      }
      continue;
    }
    const der = s.lado === 'derecha';
    const xN = der ? COLUMNA - PIEZA.w / 2 : -COLUMNA + PIEZA.w / 2;
    const xCarril = der ? cR + 58 + (2 - s.i) * 26 : cL - 58 - (2 - s.i) * 26;
    const xBorde = der ? cR : cL;
    for (let j = 0; j < 3; j++) {
      const o = (j - 1) * 6;
      const oc = der ? o : -o;
      const yPatilla = -86 + (s.i * 3 + j) * 21.5;
      lineas.push({
        pts: [[xN, s.y + o], [xCarril + oc, s.y + o], [xCarril + oc, yPatilla], [xBorde, yPatilla]],
        rgb: p.rgb, fase: j * 200,
      });
    }
  }
  return lineas;
}

/** Las patillas del núcleo. Decoración, sin pulso. */
export function patillas(rgb) {
  const a = [];
  const cR = NUCLEO.w / 2, cL = -NUCLEO.w / 2, cT = -NUCLEO.h / 2, cB = NUCLEO.h / 2;
  for (let x = cL + 18; x < cR - 12; x += 13) {
    a.push({ pts: [[x, cT - 11], [x, cT - 2]], rgb });
    a.push({ pts: [[x, cB + 2], [x, cB + 11]], rgb });
  }
  for (let y = cT + 20; y < cB - 14; y += 13) {
    a.push({ pts: [[cL - 11, y], [cL - 2, y]], rgb });
    a.push({ pts: [[cR + 2, y], [cR + 11, y]], rgb });
  }
  return a;
}

/* ── un paso ─────────────────────────────────────────────────────────── */

/**
 * Los apartados en serpiente: la primera fila de izquierda a derecha, la
 * segunda de derecha a izquierda, y así. La línea del recorrido baja por el
 * extremo y nunca cruza la pantalla de lado a lado.
 *
 * Columnas: todos en una fila si son 4 o menos; si no, la mitad redondeando
 * hacia arriba (5 → 3+2, 7 → 4+3). Así no queda una tarjeta huérfana.
 */
export function disponerPaso(apartados) {
  const n = apartados.length;
  const cols = n <= 4 ? n : Math.ceil(n / 2);
  const pos = {};
  apartados.forEach((a, k) => {
    const fila = Math.floor(k / cols);
    const enFila = k % cols;
    const col = fila % 2 === 0 ? enFila : cols - 1 - enFila;
    const izq = col * (AP.w + AP_GAP_X);
    const arr = fila * AP_FILA;
    pos[a.id] = { izq, arr, x: izq + AP.w / 2, y: arr + AP.h / 2, w: AP.w, h: AP.h, fila, col, k };
  });
  const filas = Math.ceil(n / cols);
  const ancho = cols * AP.w + (cols - 1) * AP_GAP_X;
  const alto = (filas - 1) * AP_FILA + AP.h;
  return { pos, cols, filas, caja: { x: -30, y: -20, w: ancho + 60, h: alto + 40 } };
}

/**
 * El recorrido: una sola polilínea de un apartado al siguiente. Dentro de una
 * fila va de costado a costado; al cambiar de fila baja desde el pie de la
 * última tarjeta hasta la cabeza de la primera de la fila siguiente, que está
 * justo debajo (por eso la serpiente).
 */
export function recorrido(apartados, pos, rgb) {
  const lineas = [];
  for (let k = 0; k < apartados.length - 1; k++) {
    const A = pos[apartados[k].id], B = pos[apartados[k + 1].id];
    let pts;
    if (A.fila === B.fila) {
      const haciaDer = B.x > A.x;
      const xa = haciaDer ? A.izq + A.w : A.izq;
      const xb = haciaDer ? B.izq : B.izq + B.w;
      const y = A.arr + 62;              // a la altura de la miniatura
      pts = [[xa, y], [xb, y]];
    } else {
      const yMedio = A.arr + A.h + (AP_FILA - AP.h) / 2;
      pts = [[A.x, A.arr + A.h], [A.x, yMedio], [B.x, yMedio], [B.x, B.arr]];
    }
    lineas.push({ pts, rgb, fase: k * 160 });
  }
  return lineas;
}

/* ── encuadre ────────────────────────────────────────────────────────── */

/**
 * El encuadre de una caja dentro del escenario. `arriba` descuenta lo que
 * tapa la cabecera del paso (la tira de pasos y el título).
 */
export function encuadrar(caja, { ancho, alto, arriba = 24, abajo = 24, zMin = 0, zMax = 1.1 }) {
  const libreW = ancho - 48;
  const libreH = alto - arriba - abajo;
  let z = Math.min(libreW / caja.w, libreH / caja.h, zMax);
  if (z < zMin) z = zMin;
  return {
    x: caja.x + caja.w / 2,
    y: caja.y + caja.h / 2 - (arriba - abajo) / (2 * z),
    z,
  };
}
