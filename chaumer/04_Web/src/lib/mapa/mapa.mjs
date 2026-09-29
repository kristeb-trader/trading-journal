/**
 * El mapa del metodo: estado, transiciones y entrada del usuario.
 *
 * Diseno: docs/disenos/2026-09-29-mapa-del-metodo.md
 *
 * Tres cosas que NO son opcionales y por eso estan aqui desde el principio:
 *
 *   1. `prefers-reduced-motion` tambien en JavaScript. La regla de base.css
 *      apaga transiciones y animaciones, pero NO alcanza a un bucle de
 *      canvas, ni a element.animate(), ni a una interpolacion sobre
 *      performance.now(). Con movimiento reducido la pagina sigue llevando al
 *      mismo sitio: sin animacion, no sin funcion.
 *   2. `?sin-movimiento` para `npm run verificar`. Un canvas que nunca se
 *      queda quieto da capturas distintas cada vez y se pierde el vigilante.
 *   3. El estado va en la URL. Un mapa al que no se puede enlazar no sirve en
 *      un portal de consulta.
 */

import { Camara, transformacion } from './camara.mjs';
import { Pistas, rgba } from './pistas.mjs';
import * as D from './disposicion.mjs';

/* Los siete tonos salen de tokens.css: --info, el cian de --texto-degradado,
   --acento, el violeta de la aurora, --positivo, --aviso y --negativo. */
/* Un tono por pieza, en el orden de la jornada. Salen de tokens.css: --info,
   el cian de --texto-degradado, --negativo, el violeta de la aurora,
   --positivo, --aviso y --acento.
   El coral y el azul están cambiados respecto al orden natural de la rampa:
   los pidió así el operador el 29/09/2026 — Zonas en coral y Proceso diario
   en azul. */
const TONOS = [
  [56, 189, 212], [91, 225, 240], [239, 95, 99], [120, 96, 255],
  [63, 207, 142], [227, 179, 65], [76, 141, 255],
];
const AZUL = [76, 141, 255];

/** El color base sirve para bordes y pistas; para TEXTO sobre fondo oscuro
 *  hace falta la variante clara. Usar la base en un `color:` es el error
 *  tipico que avisa el CLAUDE.md del proyecto. */
function aclarar(c) {
  return [
    Math.round(c[0] + (255 - c[0]) * 0.34),
    Math.round(c[1] + (255 - c[1]) * 0.34),
    Math.round(c[2] + (255 - c[2]) * 0.34),
  ];
}

const ZOOM_MIN = 0.2, ZOOM_MAX = 2.2;

export function iniciarMapa(datos) {
  const q = new URLSearchParams(location.search);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const quieta = reduce || q.has('sin-movimiento');

  const el = {
    lienzo: document.getElementById('mapa'),
    rejilla: document.getElementById('mapa-rejilla'),
    pistas: document.getElementById('mapa-pistas'),
    mundo: document.getElementById('mapa-mundo'),
    menu: document.getElementById('mapa-menu'),
    barrido: document.getElementById('mapa-barrido'),
    pista: document.getElementById('mapa-pista'),
    ficha: document.getElementById('mapa-ficha'),
    velo: document.getElementById('mapa-velo'),
    volver: document.getElementById('mapa-volver'),
    sub: document.getElementById('mapa-sub'),
    ctx: document.getElementById('mapa-ctx'),
    cifra: document.getElementById('mapa-cifra'),
    cifraTxt: document.getElementById('mapa-cifra-txt'),
    zoom: document.getElementById('mapa-zoom'),
    ayuda: document.getElementById('mapa-ayuda'),
    respaldo: document.getElementById('mapa-respaldo'),
  };
  if (!el.lienzo) return;
  document.body.classList.add('con-mapa');
  if (el.respaldo) el.respaldo.hidden = true;

  /* ── datos ─────────────────────────────────────────────────────────── */
  const G = datos.grupos.map((g, i) => {
    const rgb = TONOS[i % TONOS.length];
    const luz = aclarar(rgb);
    return { ...g, rgb, luz, css: rgba(rgb), lcss: rgba(luz) };
  });
  const R = datos.reglas;
  const porId = Object.fromEntries(G.map((g) => [g.id, g]));
  const reglasDe = (gid) => R.filter((r) => r.grupo === gid);

  /* ── motor ─────────────────────────────────────────────────────────── */
  const cam = new Camara(1);
  cam.quieta = quieta;
  // Cada salto de camara repinta. Con el bucle activo es redundante pero
  // inofensivo; SIN bucle (movimiento reducido) es lo unico que deja el mapa
  // en su sitio.
  cam.alCambiar = () => { aplicar(); if (quieta) pistas.pintar(); };
  const pistas = new Pistas(el.pistas);
  pistas.quieta = quieta;
  pistas.usarCamara(cam);

  let vista = 'hub';
  let piezaActual = null;
  let pos = {};
  let caja = null;
  let ocupado = false;
  let botones = {};
  let reglasVista = [];
  let lineasVista = [];

  function aplicar() {
    const t = transformacion(cam, innerWidth, innerHeight);
    el.mundo.style.transform = t;
    el.rejilla.style.transform = t;
    if (el.zoom) el.zoom.textContent = Math.round(cam.z * 100) + '%';
  }

  function encuadre() {
    return D.encuadrar(caja, {
      ancho: innerWidth, alto: innerHeight,
      menu: vista === 'pieza' ? 292 : 0,
      zMin: vista === 'pieza' ? 0.95 : 0,
      // El flujo se asienta algo por encima del centro: así la primera fila
      // queda a la altura de la vista y se empieza a leer por arriba.
      subir: vista === 'pieza' ? 70 : 0,
    });
  }

  /* ── nivel 1 · el hub ──────────────────────────────────────────────── */

  function construirHub() {
    el.mundo.innerHTML = '';
    const d = D.disponerHub(G);
    pos = d.pos; caja = d.caja;

    const nucleo = document.createElement('div');
    nucleo.className = 'mp-nucleo';
    nucleo.style.cssText = 'left:' + (-D.NUCLEO.w / 2) + 'px;top:' + (-D.NUCLEO.h / 2)
      + 'px;width:' + D.NUCLEO.w + 'px;height:' + D.NUCLEO.h + 'px';
    nucleo.innerHTML = '<span class="mp-nucleo__t">El método · núcleo</span>'
      + '<span class="mp-nucleo__n">' + R.length + '</span>'
      + '<span class="mp-nucleo__s">reglas en ' + G.length + ' piezas</span>'
      + '<span class="mp-nucleo__e">Metodología Chaumer</span>';
    el.mundo.appendChild(nucleo);

    for (const g of G) {
      const p = pos[g.id];
      if (!p) continue;
      const env = document.createElement('div');
      env.className = 'mp-env';
      env.style.cssText = 'left:' + (p.x - p.w / 2) + 'px;top:' + (p.y - p.h / 2)
        + 'px;width:' + p.w + 'px;height:' + p.h + 'px;--d:' + (40 + (g.orden - 1) * 52) + 'ms';

      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mp-hex';
      b.style.cssText = tonos(g);
      b.innerHTML = '<span class="mp-hex__in">'
        + '<span class="mp-hex__m">Paso ' + g.orden + ' · ' + g.cruces + ' cruces</span>'
        + '<span class="mp-hex__n">' + esc(g.nombre) + '</span>'
        + '<span class="mp-hex__f"><span class="mp-hex__b">' + g.sigla + '</span>'
        + '<span class="mp-hex__c">' + g.n + '</span></span>'
        + '<span class="mp-hex__d">' + esc(g.desc) + '</span></span>';
      b.setAttribute('aria-label', g.nombre + ', paso ' + g.orden + ' de ' + G.length
        + ', ' + g.n + (g.n === 1 ? ' regla' : ' reglas'));
      b.addEventListener('click', () => entrar(g.id));
      b.addEventListener('mouseenter', (e) => verPista(e, {
        m: 'Paso ' + g.orden + ' · ' + g.n + (g.n === 1 ? ' regla' : ' reglas') + ' · ' + g.cruces + ' cruces',
        t: g.nombre, d: mayus(g.desc) + '. Se abre con un clic.', rgb: g.luz,
      }));
      b.addEventListener('mouseleave', ocultarPista);
      b.addEventListener('focus', () => { /* el foco no abre el globo: molestaria al tabular */ });

      env.appendChild(b);
      el.mundo.appendChild(env);
    }

    pistas.poner(D.pistasHub(G, pos), D.patillas(AZUL));
  }

  /* ── nivel 2 · una pieza ───────────────────────────────────────────── */

  function construirPieza(gid) {
    el.mundo.innerHTML = '';
    botones = {};
    const g = porId[gid];
    const suyas = reglasDe(gid);
    reglasVista = suyas;

    const d = D.disponerPieza(suyas);
    pos = d.pos; caja = d.caja;

    /* Cuántas relaciones tiene la más y la menos conectada de la pieza: la
       intensidad se reparte entre esas dos, no sobre una escala absoluta, o
       una pieza con poco trato saldría toda apagada. */
    const cuenta = suyas.map((x) => x.rel.length);
    const menos = Math.min(...cuenta), mas = Math.max(...cuenta);
    const fuerza = (r) => (mas === menos ? 1 : (r.rel.length - menos) / (mas - menos));

    suyas.forEach((r, i) => {
      const p = pos[r.id];
      const env = document.createElement('div');
      env.className = 'mp-env';
      env.style.cssText = 'left:' + p.izq + 'px;top:' + p.arr + 'px;width:' + p.w
        + 'px;height:' + p.h + 'px;--d:' + (40 + Math.min(i, 13) * 30) + 'ms';

      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mp-hex mp-hex--regla';
      b.style.cssText = tonos(g, fuerza(r));
      b.innerHTML = '<span class="mp-hex__in">'
        + '<span class="mp-hex__m">' + g.sigla + ' #' + String(i + 1).padStart(2, '0') + '</span>'
        + '<span class="mp-hex__r">' + esc(r.nombre) + '</span>'
        + '<span class="mp-hex__p">' + etiquetaDe(r) + '</span></span>';
      b.setAttribute('aria-label', r.id + '. ' + r.nombre);
      b.addEventListener('click', () => abrirFicha(r, g));
      b.addEventListener('mouseenter', (e) => {
        verPista(e, {
          m: r.id + ' · ' + (r.aplica.join(' y ') || 'común'),
          t: r.nombre, d: r.resumen, rgb: g.luz,
        });
        resaltar(r);
      });
      b.addEventListener('mouseleave', () => { ocultarPista(); resaltar(null); });
      botones[r.id] = b;
      env.appendChild(b);
      el.mundo.appendChild(env);
    });

    for (let f = 0; f < d.filas; f++) {
      const e = document.createElement('div');
      e.className = 'mp-fila';
      e.setAttribute('aria-hidden', 'true');
      e.style.cssText = 'left:-118px;top:' + (f * D.REGLA_FILA + 26) + 'px;--c:' + rgba(g.luz, 0.6);
      e.innerHTML = 'Fila ' + String(f + 1).padStart(2, '0') + '<i></i>';
      el.mundo.appendChild(e);
    }

    lineasVista = D.carriles(suyas, pos, g.rgb);
    resaltar(null);
  }

  /** Al posarse en una regla se apagan las demas y solo quedan encendidos
   *  ella, sus relacionadas y los carriles que las unen. */
  function resaltar(r) {
    for (const L of lineasVista) L.apagada = !!r && L.par.indexOf(r.id) < 0;
    for (const x of reglasVista) {
      const vivo = !r || x.id === r.id || r.rel.indexOf(x.id) > -1;
      botones[x.id].classList.toggle('mp-hex--apagada', !vivo);
    }
    pistas.poner(lineasVista, []);
  }

  /* ── transiciones ──────────────────────────────────────────────────── */

  /**
   * El fundido de la transición.
   *
   * Funde del TODO, no a medias. Comparado fotograma a fotograma con la
   * referencia (29/09/2026): allí el mundo desaparece limpio y vuelve suave,
   * y eso es lo que se percibe como cuidado. Dejarlo a 0,3 deja el contenido
   * viejo por debajo del nuevo y se ve sucio.
   */
  function atenuar(o, ms) {
    for (const e of [el.mundo, pistas.lienzo]) {
      e.style.transition = ms === 0 ? 'none' : 'opacity ' + (ms || 300) + 'ms ease';
      e.style.opacity = o;
    }
  }

  function barrido() {
    if (quieta || !el.barrido || !el.barrido.animate) return;
    el.barrido.animate([
      { opacity: 0, transform: 'translateY(-100%)' },
      { opacity: 1, offset: 0.3 },
      { opacity: 1, offset: 0.66 },
      { opacity: 0, transform: 'translateY(210%)' },
    ], { duration: 980, easing: 'cubic-bezier(.35,0,.3,1)' });
  }

  function entrar(gid, sinHistoria) {
    if (ocupado) return;
    if (vista === 'pieza') return cambiar(gid, sinHistoria);
    ocupado = true;
    ocultarPista();
    const p = pos[gid];
    atenuar(0, 300); barrido();
    // Bajar de nivel es ACERCARSE. La direccion del zoom codifica la jerarquia.
    cam.irHasta({ x: p.x, y: p.y, z: cam.z * 1.9 }, 330, () => {
      vista = 'pieza'; piezaActual = gid;
      construirPieza(gid); cromo(); url(sinHistoria);
      const f = encuadre();
      cam.irYa({ x: f.x, y: f.y - 46, z: f.z * 0.86 });
      aplicar(); pistas.revelar(); atenuar(1, 340);
      cam.irHasta(f, 660, () => { ocupado = false; });
    });
  }

  /** Entre piezas hermanas NO hay zoom: no se ha cambiado de nivel. */
  function cambiar(gid, sinHistoria) {
    if (ocupado || gid === piezaActual) return;
    ocupado = true;
    ocultarPista();
    atenuar(0, 240); barrido();
    setTimeout(() => {
      piezaActual = gid;
      construirPieza(gid); cromo(); url(sinHistoria);
      const f = encuadre();
      cam.irYa({ x: f.x, y: f.y, z: f.z * 0.92 });
      aplicar(); pistas.revelar(); atenuar(1, 300);
      cam.irHasta(f, 420, () => { ocupado = false; });
    }, quieta ? 0 : 250);
  }

  function volver(sinHistoria) {
    if (ocupado || vista === 'hub') return;
    ocupado = true;
    ocultarPista();
    const previo = piezaActual;
    atenuar(0, 300); barrido();
    // Subir de nivel es ALEJARSE: la imagen en espejo de entrar.
    cam.irHasta({ x: cam.x, y: cam.y, z: cam.z * 0.68 }, 330, () => {
      vista = 'hub'; piezaActual = null;
      construirHub(); cromo(); url(sinHistoria);
      const f = encuadre();
      const p = pos[previo] || { x: f.x, y: f.y };
      cam.irYa({ x: p.x, y: p.y, z: f.z * 2.2 });
      aplicar(); pistas.revelar(); atenuar(1, 340);
      cam.irHasta(f, 640, () => { ocupado = false; });
    });
  }

  /* ── cromo ─────────────────────────────────────────────────────────── */

  function cromo() {
    const enPieza = vista === 'pieza';
    el.volver.hidden = !enPieza;
    el.menu.hidden = !enPieza;
    if (el.ayuda) el.ayuda.hidden = enPieza;

    if (enPieza) {
      const g = porId[piezaActual];
      el.sub.textContent = 'Paso ' + g.orden + ' de ' + G.length + ' · ' + g.nombre;
      el.ctx.textContent = g.nombre;
      el.cifra.textContent = g.n;
      el.cifraTxt.textContent = (g.n === 1 ? 'regla' : 'reglas') + ' en esta pieza';
      el.menu.innerHTML = '<p class="mp-menu__t">Las ' + G.length + ' piezas</p>'
        + G.map((x) => '<button type="button" class="mp-menu__i'
          + (x.id === g.id ? ' activa' : '') + '" data-pieza="' + x.id + '"'
          + (x.id === g.id ? ' aria-current="true"' : '')
          + ' style="--rc:' + x.lcss + ';--rb:' + rgba(x.rgb, 0.6) + ';--rs:' + rgba(x.rgb, 0.2)
          + ';--rd:' + (40 + x.orden * 38) + 'ms">'
          + '<span class="mp-menu__h"><i>' + x.sigla + '</i></span>'
          + '<span class="mp-menu__b"><span class="mp-menu__n">' + esc(x.nombre) + '</span>'
          + '<span class="mp-menu__d">Paso ' + x.orden + ' · ' + x.cruces + ' cruces</span></span>'
          + '<span class="mp-menu__c">' + x.n + '</span></button>').join('');
      for (const b of el.menu.querySelectorAll('[data-pieza]')) {
        b.addEventListener('click', () => cambiar(b.dataset.pieza));
      }
    } else {
      el.sub.textContent = 'Metodología Chaumer';
      el.ctx.textContent = 'El recorrido de la jornada';
      el.cifra.textContent = R.length;
      el.cifraTxt.textContent = 'reglas en vigor';
    }
  }

  /* ── globo y ficha ─────────────────────────────────────────────────── */

  /* El globo se escribe DIRECTO en su hueco. Si se hiciera pasando por un
     re-render del mundo, se destruiria y recrearia el nodo bajo el cursor,
     eso volveria a disparar el mouseover, y seria un bucle infinito. */
  function verPista(ev, o) {
    const p = el.pista;
    p.style.setProperty('--tb', rgba(o.rgb, 0.4));
    p.style.setProperty('--tc', rgba(o.rgb));
    p.innerHTML = '<p class="mp-pista__m">' + esc(o.m) + '</p>'
      + '<p class="mp-pista__t">' + esc(o.t) + '</p>'
      + '<p class="mp-pista__d">' + esc(o.d) + '</p>';
    const r = ev.currentTarget.getBoundingClientRect();
    p.style.left = Math.min(innerWidth - 340, Math.max(12, r.left + r.width / 2 - 160)) + 'px';
    p.style.top = Math.min(innerHeight - 190, r.bottom + 12) + 'px';
    p.classList.add('visible');
  }
  function ocultarPista() { el.pista.classList.remove('visible'); }

  let focoPrevio = null;
  function abrirFicha(r, g) {
    ocultarPista();
    focoPrevio = document.activeElement;
    el.ficha.style.setProperty('--mb', rgba(g.rgb, 0.4));
    el.ficha.style.setProperty('--mc', g.lcss);
    el.ficha.innerHTML = '<div class="mp-ficha__c"><span class="mp-ficha__id">' + r.id + '</span>'
      + '<span class="mp-ficha__g">' + esc(g.nombre) + '</span></div>'
      + '<h2 class="mp-ficha__t" id="mapa-ficha-t">' + esc(r.nombre) + '</h2>'
      + '<p class="mp-ficha__d">' + esc(r.resumen) + '…</p>'
      + '<div class="mp-ficha__k">'
      + r.aplica.map((a) => '<span class="mp-k">' + esc(a) + '</span>').join('')
      + (r.params ? '<span class="mp-k">' + r.params + ' parámetros</span>' : '')
      + (r.rel.length ? '<span class="mp-k">' + r.rel.length + ' relacionadas</span>' : '')
      + '</div><div class="mp-ficha__a">'
      + '<a class="mp-b1" href="/reglas/' + r.id + '">Abrir la regla completa</a>'
      + '<button type="button" class="mp-b2" data-cerrar>Cerrar</button></div>';
    el.velo.hidden = false;
    el.ficha.querySelector('[data-cerrar]').addEventListener('click', cerrarFicha);
    el.ficha.querySelector('.mp-b1').focus();
  }
  function cerrarFicha() {
    el.velo.hidden = true;
    if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
  }
  el.velo.addEventListener('click', (e) => { if (e.target === el.velo) cerrarFicha(); });

  /* ── la URL ────────────────────────────────────────────────────────── */

  function url(sinHistoria) {
    if (sinHistoria) return;
    const u = vista === 'pieza' ? '?pieza=' + piezaActual : location.pathname;
    history.pushState({ pieza: piezaActual }, '', u);
  }
  addEventListener('popstate', (e) => {
    const p = (e.state && e.state.pieza) || new URLSearchParams(location.search).get('pieza');
    if (p && porId[p]) { if (vista === 'hub') entrar(p, true); else cambiar(p, true); }
    else volver(true);
  });

  /* ── raton ─────────────────────────────────────────────────────────── */

  let arrastre = null;
  el.lienzo.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a')) return;
    arrastre = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
    el.lienzo.setPointerCapture(e.pointerId);
    el.lienzo.classList.add('arrastrando');
  });
  el.lienzo.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    cam.cancelar();
    cam.x = arrastre.cx - (e.clientX - arrastre.x) / cam.z;
    cam.y = arrastre.cy - (e.clientY - arrastre.y) / cam.z;
    aplicar(); if (quieta) pistas.pintar();
  });
  const soltar = () => { arrastre = null; el.lienzo.classList.remove('arrastrando'); };
  el.lienzo.addEventListener('pointerup', soltar);
  el.lienzo.addEventListener('pointercancel', soltar);
  el.lienzo.addEventListener('wheel', (e) => {
    e.preventDefault();
    cam.acercar(e.deltaY < 0 ? 1.12 : 0.89, ZOOM_MIN, ZOOM_MAX);
  }, { passive: false });

  /* ── teclado ───────────────────────────────────────────────────────── */

  addEventListener('keydown', (e) => {
    // Sin esta guarda, escribir una «w» en un campo mueve el mapa.
    const t = e.target;
    if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName || '')) return;
    if (t && t.isContentEditable) return;

    const paso = 90 / cam.z;
    const mover = (dx, dy) => {
      cam.moverPor(dx, dy); e.preventDefault();
    };
    const zoom = (f) => cam.acercar(f, ZOOM_MIN, ZOOM_MAX);

    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A': return mover(-paso, 0);
      case 'ArrowRight': case 'd': case 'D': return mover(paso, 0);
      case 'ArrowUp': case 'w': case 'W': return mover(0, -paso);
      case 'ArrowDown': case 's': case 'S': return mover(0, paso);
      case '+': case '=': return zoom(1.25);
      case '-': case '_': return zoom(0.8);
      case 'f': case 'F': case '0': case 'Home': return ajustar();
      case 'Escape':
        if (!el.velo.hidden) cerrarFicha(); else volver();
        return;
      case '[': return saltar(-1);
      case ']': return saltar(1);
    }
  });

  function saltar(paso) {
    if (vista !== 'pieza') return;
    const i = G.findIndex((g) => g.id === piezaActual);
    const s = G[(i + paso + G.length) % G.length];
    if (s) cambiar(s.id);
  }
  function ajustar() { cam.irHasta(encuadre(), 450); }

  /* ── controles ─────────────────────────────────────────────────────── */

  el.volver.addEventListener('click', () => volver());
  const btn = (id, fn) => {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', fn);
  };
  btn('mapa-mas', () => cam.acercar(1.25, ZOOM_MIN, ZOOM_MAX));
  btn('mapa-menos', () => cam.acercar(0.8, ZOOM_MIN, ZOOM_MAX));
  btn('mapa-ajustar', ajustar);

  addEventListener('resize', () => {
    pistas.medir(innerWidth, innerHeight);
    aplicar();
  });

  /* ── arranque ──────────────────────────────────────────────────────── */

  pistas.medir(innerWidth, innerHeight);
  construirHub();
  cromo();
  cam.irYa(encuadre());
  aplicar();
  pistas.revelar();

  // El estado de la URL se lee AL ARRANCAR: si no, un enlace a una pieza
  // abriria siempre el hub.
  const inicial = q.get('pieza');
  if (inicial && porId[inicial]) entrar(inicial, true);

  if (quieta) {
    pistas.pintar();
  } else {
    (function bucle() {
      requestAnimationFrame(bucle);
      if (cam.tick()) aplicar();
      pistas.pintar();
    })();
  }

  /* ── ayudas ────────────────────────────────────────────────────────── */

  /**
   * Las variables de color de un nodo.
   *
   * `f` (0..1) es opcional: cuando viene, el borde y el texto siguen a la
   * fuerza de la regla, de modo que se ve el esqueleto de la pieza sin leer
   * nada. El TONO no cambia —sería mentir, todas son de la misma pieza—,
   * cambia la intensidad.
   */
  function tonos(g, f) {
    if (f == null) {
      return '--c:' + g.lcss + ';--cd:' + rgba(g.luz, 0.8) + ';--cb:' + rgba(g.rgb, 0.38)
        + ';--b:' + rgba(g.luz, 0.75) + ';--f:#090C12';
    }
    return '--c:' + rgba(g.luz, 0.52 + f * 0.48)
      + ';--cd:' + rgba(g.luz, 0.38 + f * 0.42)
      + ';--cb:' + rgba(g.rgb, 0.2 + f * 0.3)
      + ';--b:' + rgba(g.luz, 0.3 + f * 0.6)
      + ';--f:#090C12';
  }
  function etiquetaDe(r) {
    const a = r.aplica.length === 2 ? 'Ambos' : (r.aplica[0] || 'Común');
    return esc(a) + (r.params ? ' · ' + r.params + ' par.' : '');
  }
  function mayus(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
