/**
 * Camara 2D con desplazamiento y zoom, interpolados.
 *
 * No sabe nada de reglas ni de pantallas: recibe posiciones en pixeles de
 * mundo y devuelve x, y, z. Quien la usa convierte eso en un `transform`.
 *
 * Interpola las TRES a la vez (x, y, z). Si se animan el desplazamiento y el
 * acercamiento por separado, el recorrido se ve torcido.
 */

export function Camara(z0) {
  this.x = 0;
  this.y = 0;
  this.z = z0 || 1;
  this.anim = null;
  /** Cuando es true, no hay interpolacion: todo salta al destino. Lo pone
   *  quien detecta que el sistema pide movimiento reducido. */
  this.quieta = false;
  /**
   * Se llama en cada cambio que NO viene del bucle de fotogramas.
   *
   * Sin esto, con movimiento reducido la camara se queda donde la dejo el
   * penultimo salto: no hay bucle que aplique la transformacion despues del
   * ultimo. Se detecto verificando `/mapa` con `prefers-reduced-motion`,
   * donde el mapa acababa al 82 % en vez de al 95 %.
   */
  this.alCambiar = null;
}

Camara.prototype.irYa = function (a) {
  this.anim = null;
  this.x = a.x; this.y = a.y; this.z = a.z;
  if (this.alCambiar) this.alCambiar();
};

Camara.prototype.irHasta = function (a, ms, alAcabar) {
  if (this.quieta) {
    this.irYa(a);
    if (alAcabar) alAcabar();
    return;
  }
  this.anim = {
    desde: { x: this.x, y: this.y, z: this.z },
    hasta: a,
    t0: performance.now(),
    ms,
    cb: alAcabar,
  };
};

Camara.prototype.cancelar = function () { this.anim = null; };

/** Avanza un fotograma. Devuelve true mientras haya animacion en curso. */
Camara.prototype.tick = function () {
  const a = this.anim;
  if (!a) return false;
  const p = Math.min(1, (performance.now() - a.t0) / a.ms);
  // easeInOutCubic: arranca suave, acelera, frena suave.
  const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  this.x = a.desde.x + (a.hasta.x - a.desde.x) * e;
  this.y = a.desde.y + (a.hasta.y - a.desde.y) * e;
  this.z = a.desde.z + (a.hasta.z - a.desde.z) * e;
  if (p >= 1) { this.anim = null; if (a.cb) a.cb(); }
  return true;
};

Camara.prototype.moverPor = function (dx, dy) {
  this.anim = null;
  this.x += dx; this.y += dy;
  if (this.alCambiar) this.alCambiar();
};

Camara.prototype.acercar = function (factor, min, max) {
  this.anim = null;
  this.z = Math.max(min, Math.min(max, this.z * factor));
  if (this.alCambiar) this.alCambiar();
};

/** La cadena de transformacion que comparten las tres capas del mapa. */
export function transformacion(cam, ancho, alto) {
  return 'translate(' + (ancho / 2) + 'px,' + (alto / 2) + 'px)'
    + ' scale(' + cam.z + ')'
    + ' translate(' + (-cam.x) + 'px,' + (-cam.y) + 'px)';
}

/** Un punto del mundo, en coordenadas de pantalla. */
export function aPantalla(pt, cam, ancho, alto) {
  return [
    ancho / 2 + (pt[0] - cam.x) * cam.z,
    alto / 2 + (pt[1] - cam.y) * cam.z,
  ];
}
