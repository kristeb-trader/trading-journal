/**
 * Las pistas del mapa, dibujadas en un <canvas>.
 *
 * En SVG serian cientos de nodos del DOM y el navegador se arrastra; en
 * Canvas2D es una funcion de pintado. Sin dependencias: la referencia que
 * inspiro esto empezo con Three.js desde un CDN y lo tiro por el mismo
 * motivo.
 *
 * Cada pista se dibuja en CUATRO capas. Una sola linea gruesa de color no da
 * el efecto:
 *
 *   1. traza base apagada
 *   2. halo ancho y desenfocado
 *   3. filamento fino, casi blanco
 *   4. punto de luz recorriendola, solo si ya esta dibujada entera
 *
 * Y se revela por LONGITUD, no por opacidad: la linea se traza a lo largo de
 * su recorrido, que es lo que la hace parecer un circuito al encenderse.
 */

import { aPantalla } from './camara.mjs';

/** Velocidades en pixeles de mundo por segundo. Con duracion fija, un
 *  recorrido largo iria disparado y uno corto lentisimo. */
export const VEL_REVELADO = 760;
export const VEL_PULSO = 150;

function mezcla(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

export function rgba(c, alfa) {
  return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alfa == null ? 1 : alfa) + ')';
}

/** Distancia acumulada a lo largo de una polilinea. */
function acumulada(p) {
  const d = [0];
  for (let i = 1; i < p.length; i++) {
    d.push(d[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  }
  return d;
}

/** Los puntos hasta una longitud dada, interpolando el ultimo tramo parcial
 *  para que el extremo no de saltos. */
function truncar(p, d, largo) {
  if (largo <= 0) return [];
  const salida = [p[0]];
  for (let i = 1; i < p.length; i++) {
    if (d[i] <= largo) { salida.push(p[i]); continue; }
    const tramo = d[i] - d[i - 1];
    const t = tramo > 0 ? (largo - d[i - 1]) / tramo : 0;
    salida.push([
      p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t,
      p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t,
    ]);
    break;
  }
  return salida;
}

/** El punto que esta a `x` de recorrido, dando la vuelta si se pasa. */
function puntoEn(p, d, x) {
  const total = d[d.length - 1];
  if (total <= 0) return p[0];
  x = ((x % total) + total) % total;
  for (let i = 1; i < p.length; i++) {
    if (x <= d[i]) {
      const tramo = d[i] - d[i - 1];
      const t = tramo > 0 ? (x - d[i - 1]) / tramo : 0;
      return [
        p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t,
        p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t,
      ];
    }
  }
  return p[p.length - 1];
}

export function Pistas(contenedor) {
  this.lienzo = document.createElement('canvas');
  this.lienzo.setAttribute('aria-hidden', 'true');
  contenedor.appendChild(this.lienzo);
  this.ctx = this.lienzo.getContext('2d');
  // Por encima de 2 no se nota y cuesta el doble.
  this.dpr = Math.min(2, window.devicePixelRatio || 1);
  this.lineas = [];
  this.adornos = [];
  this.t0 = performance.now();
  this.reveladoEn = 0;
  this.ancho = 0;
  this.alto = 0;
  this.camara = null;
  /** Con movimiento reducido no hay bucle: hay que repintar a mano cada vez
   *  que cambia el estado, o se queda dibujada la pantalla anterior. */
  this.quieta = false;
}

Pistas.prototype.reloj = function () { return (performance.now() - this.t0) / 1000; };

Pistas.prototype.medir = function (ancho, alto) {
  this.ancho = ancho; this.alto = alto;
  this.lienzo.width = Math.round(ancho * this.dpr);
  this.lienzo.height = Math.round(alto * this.dpr);
  this.lienzo.style.width = ancho + 'px';
  this.lienzo.style.height = alto + 'px';
  if (this.quieta) this.pintar();
};

Pistas.prototype.revelar = function () {
  this.reveladoEn = this.reloj();
  if (this.quieta) this.pintar();
};

Pistas.prototype.poner = function (lineas, adornos) {
  this.lineas = lineas || [];
  this.adornos = adornos || [];
  if (this.quieta) this.pintar();
};

Pistas.prototype.usarCamara = function (cam) { this.camara = cam; };

Pistas.prototype.pintar = function () {
  const ctx = this.ctx;
  const cam = this.camara;
  if (!ctx || !cam) return;
  const w = this.ancho, h = this.alto;
  ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const t = this.reloj();
  const largo = this.quieta ? Infinity : (t - this.reveladoEn) * VEL_REVELADO;
  const aP = (pt) => aPantalla(pt, cam, w, h);

  for (const a of this.adornos) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(a.rgb, 0.5);
    ctx.lineWidth = 1.5;
    trazar(ctx, a.pts, aP);
    ctx.restore();
  }
  for (const l of this.lineas) this.una(l, t, largo, aP);
};

Pistas.prototype.una = function (L, t, largo, aP) {
  const ctx = this.ctx;
  const pts = L.pts;
  if (!pts || pts.length < 2) return;
  const d = acumulada(pts);
  const total = d[d.length - 1];
  if (total <= 0) return;
  const dibujado = Math.min(total, Math.max(0, largo));
  if (dibujado <= 0) return;

  const vis = truncar(pts, d, dibujado);
  const k = L.apagada ? 0.22 : 1;

  // 1 · traza base
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = rgba(L.rgb, 0.15 * k);
  ctx.lineWidth = 1.1;
  trazar(ctx, vis, aP);
  ctx.restore();

  // 2 · halo
  ctx.save();
  ctx.strokeStyle = rgba(L.rgb, 0.24 * k);
  ctx.shadowColor = rgba(L.rgb, 0.7 * k);
  ctx.shadowBlur = 8;
  ctx.lineWidth = 3;
  trazar(ctx, vis, aP);
  ctx.restore();

  // 3 · filamento
  ctx.save();
  ctx.strokeStyle = rgba(mezcla(L.rgb, [255, 255, 255], 0.35), 0.95 * k);
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.25;
  trazar(ctx, vis, aP);
  ctx.restore();

  if (L.apagada || this.quieta) return;

  // 4 · el pulso, solo cuando la pista ya esta dibujada del todo
  if (dibujado >= total) {
    const sp = aP(puntoEn(pts, d, (t * VEL_PULSO) + (L.fase || 0)));
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = rgba(L.rgb, 1);
    ctx.shadowBlur = 9;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(sp[0], sp[1], 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};

function trazar(ctx, p, aP) {
  if (p.length < 2) return;
  ctx.beginPath();
  const a = aP(p[0]);
  ctx.moveTo(a[0], a[1]);
  for (let i = 1; i < p.length; i++) {
    const b = aP(p[i]);
    ctx.lineTo(b[0], b[1]);
  }
  ctx.stroke();
}
