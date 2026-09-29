/**
 * Donde va cada cosa en el mapa. Solo calculo: no toca el DOM ni pinta nada,
 * asi que se puede razonar (y probar) sin navegador.
 *
 * Dos disposiciones:
 *   · el HUB      nucleo + 7 piezas en corona, con haces de pistas
 *   · una PIEZA   sus reglas en filas, con las relaciones en carriles
 */

/* ── medidas ─────────────────────────────────────────────────────────── */

export const NUCLEO = { w: 326, h: 212 };
export const PIEZA = { w: 262, h: 126 };
export const COLUMNA = 492;   // separacion del nucleo a las columnas laterales
export const FILA_Y = 216;    // separacion vertical entre piezas de una columna
export const ARRIBA_Y = -352; // la pieza del paso 1

export const REGLA = { w: 224, h: 118 };
export const REGLA_GAP = 42;
export const REGLA_COLS = 5;
export const REGLA_FILA = 302;

/** Relleno de la caja que se usa para encuadrar. SIMETRICO a proposito: con
 *  relleno desigual el contenido sale corrido aunque la caja este centrada. */
const RELLENO_X = 134;
const RELLENO_Y = 26;

/* ── el hub ──────────────────────────────────────────────────────────── */

/**
 * Las 7 piezas en corona: arriba el paso 1, a la derecha 2-3-4 bajando, a la
 * izquierda 7-6-5 bajando. Se recorre en el sentido de las agujas del reloj
 * y ese es el orden real de la jornada.
 */
export function disponerHub(grupos) {
  const pos = {};
  const orden = [];
  const arriba = grupos[0];
  pos[arriba.id] = { x: 0, y: ARRIBA_Y, w: PIEZA.w, h: PIEZA.h, lado: 'arriba', i: 0 };
  orden.push(arriba.id);

  [1, 2, 3].forEach((k, i) => {
    const g = grupos[k];
    if (!g) return;
    pos[g.id] = { x: COLUMNA, y: (i - 1) * FILA_Y, w: PIEZA.w, h: PIEZA.h, lado: 'derecha', i };
    orden.push(g.id);
  });
  [6, 5, 4].forEach((k, i) => {
    const g = grupos[k];
    if (!g) return;
    pos[g.id] = { x: -COLUMNA, y: (i - 1) * FILA_Y, w: PIEZA.w, h: PIEZA.h, lado: 'izquierda', i };
    orden.push(g.id);
  });

  return { pos, orden, caja: cajaHub() };
}

function cajaHub() {
  const x = -COLUMNA - PIEZA.w / 2 - 40;
  const y = ARRIBA_Y - PIEZA.h / 2 - 40;
  const x2 = COLUMNA + PIEZA.w / 2 + 40;
  const y2 = FILA_Y + PIEZA.h / 2 + 40;
  return { x, y, w: x2 - x, h: y2 - y };
}

/**
 * Los haces: tres pistas por pieza, en paralelo, hasta las patillas del
 * nucleo. Salen del borde de la pieza, corren en horizontal, giran y entran.
 */
export function pistasHub(grupos, pos) {
  const lineas = [];
  const cR = NUCLEO.w / 2, cL = -NUCLEO.w / 2, cT = -NUCLEO.h / 2;

  for (const g of grupos) {
    const p = pos[g.id];
    if (!p) continue;

    if (p.lado === 'arriba') {
      const yN = p.y + PIEZA.h / 2;
      const yCarril = cT - 66;
      for (let j = 0; j < 3; j++) {
        const o = (j - 1) * 6;
        const xPatilla = (j - 1) * 36;
        lineas.push({
          pts: [[o * 3.4, yN], [o * 3.4, yCarril + o], [xPatilla, yCarril + o], [xPatilla, cT]],
          rgb: g.rgb, fase: j * 200,
        });
      }
      continue;
    }

    const der = p.lado === 'derecha';
    const xN = der ? COLUMNA - PIEZA.w / 2 : -COLUMNA + PIEZA.w / 2;
    const xCarril = der ? cR + 58 + (2 - p.i) * 26 : cL - 58 - (2 - p.i) * 26;
    const xBorde = der ? cR : cL;
    for (let j = 0; j < 3; j++) {
      const o = (j - 1) * 6;
      const oc = der ? o : -o;
      const yPatilla = -86 + (p.i * 3 + j) * 21.5;
      lineas.push({
        pts: [[xN, p.y + o], [xCarril + oc, p.y + o], [xCarril + oc, yPatilla], [xBorde, yPatilla]],
        rgb: g.rgb, fase: j * 200,
      });
    }
  }
  return lineas;
}

/** Las patillas del nucleo. Decoracion, sin pulso. */
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

/* ── una pieza ───────────────────────────────────────────────────────── */

/** Las reglas del grupo en filas de REGLA_COLS. */
export function disponerPieza(reglas) {
  const pos = {};
  reglas.forEach((r, i) => {
    const c = i % REGLA_COLS;
    const f = Math.floor(i / REGLA_COLS);
    const x = c * (REGLA.w + REGLA_GAP);
    const y = f * REGLA_FILA;
    pos[r.id] = {
      x: x + REGLA.w / 2, y: y + REGLA.h / 2,
      izq: x, arr: y, aba: y + REGLA.h,
      w: REGLA.w, h: REGLA.h, fila: f, col: c,
    };
  });
  const filas = Math.ceil(reglas.length / REGLA_COLS);
  return { pos, filas, caja: cajaDe(pos) };
}

function cajaDe(pos) {
  const ids = Object.keys(pos);
  if (!ids.length) return { x: 0, y: 0, w: 100, h: 100 };
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const id of ids) {
    const p = pos[id];
    x1 = Math.min(x1, p.x - p.w / 2); x2 = Math.max(x2, p.x + p.w / 2);
    y1 = Math.min(y1, p.arr); y2 = Math.max(y2, p.aba);
  }
  return {
    x: x1 - RELLENO_X, y: y1 - RELLENO_Y,
    w: (x2 - x1) + RELLENO_X * 2, h: (y2 - y1) + RELLENO_Y * 2,
  };
}

/**
 * Las relaciones, enrutadas POR DEBAJO de la fila en carriles apilados: el
 * par que abarca menos distancia coge el carril de arriba. Es lo que hace que
 * treinta relaciones se lean como un circuito y no como una marana.
 *
 * Un par que cruza de fila sale por abajo de la de arriba y entra por arriba
 * de la de abajo.
 */
export function carriles(reglas, pos, rgb) {
  const pares = [];
  const hechos = new Set();
  for (const r of reglas) {
    for (const otro of (r.rel || [])) {
      if (!pos[otro]) continue;               // de otro grupo: aqui no se pinta
      const clave = [r.id, otro].sort().join('>');
      if (hechos.has(clave)) continue;
      hechos.add(clave);
      pares.push([r.id, otro]);
    }
  }
  pares.sort((p, q) =>
    Math.abs(pos[p[0]].x - pos[p[1]].x) - Math.abs(pos[q[0]].x - pos[q[1]].x));

  const ocupacion = {};
  const lineas = [];
  for (const [a, b] of pares) {
    const A = pos[a], B = pos[b];
    const sup = A.fila <= B.fila ? A : B;
    const inf = A.fila <= B.fila ? B : A;
    const x1 = Math.min(A.x, B.x), x2 = Math.max(A.x, B.x);

    const cs = ocupacion[sup.fila] || (ocupacion[sup.fila] = []);
    let n = 0;
    while (n < 16) {
      const ocupa = cs[n] || (cs[n] = []);
      const choca = ocupa.some(([i1, i2]) => !(x2 < i1 - 16 || x1 > i2 + 16));
      if (!choca) { ocupa.push([x1, x2]); break; }
      n++;
    }

    const yCarril = sup.fila * REGLA_FILA + REGLA.h + 22 + n * 12;
    const yFin = sup.fila === inf.fila ? (sup.fila * REGLA_FILA + REGLA.h) : inf.arr;
    lineas.push({
      pts: [[sup.x, sup.aba], [sup.x, yCarril], [inf.x, yCarril], [inf.x, yFin]],
      rgb, fase: n * 110, par: [a, b],
    });
  }
  return lineas;
}

/* ── encuadre ────────────────────────────────────────────────────────── */

/**
 * El encuadre para una caja. Siempre CENTRADO en el hueco libre, que no es el
 * centro de la ventana: hay que descontar el menu por la izquierda.
 *
 * Dentro de una pieza nunca se encoge por debajo de `zMin`: un mapa que no se
 * puede leer no es un mapa. Si no cabe, se recorre.
 */
export function encuadrar(caja, { ancho, alto, menu = 0, arriba = 104, abajo = 96, zMin = 0, zMax = 1.1 }) {
  const libreW = ancho - menu - 104;
  const libreH = alto - arriba - abajo;
  let z = Math.min(libreW / (caja.w + 60), libreH / (caja.h + 60), zMax);
  if (z < zMin) z = zMin;
  return {
    x: caja.x + caja.w / 2 - menu / (2 * z),
    y: caja.y + caja.h / 2 - (arriba - abajo) / (2 * z),
    z,
  };
}
