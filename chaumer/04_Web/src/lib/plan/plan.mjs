/**
 * «Reglas» (/plan): el plan de la jornada como mapa, dentro del portal.
 *
 * Diseño: docs/disenos/2026-10-20-reglas-plan-jornada.md
 *
 * Tres niveles con una sola cámara:
 *   1 · el hub     los 8 pasos alrededor del núcleo
 *   2 · un paso    sus apartados en serpiente, con su gráfico en miniatura
 *   3 · la lámina  el apartado COMPLETO: el mismo componente que la página
 *                  del paso (src/contenido/plan/), clonado de su <template>
 *
 * Es otro orquestador, no el del mapa de las 7 piezas (src/lib/mapa/mapa.mjs),
 * para no arriesgar aquel: de él se reutilizan la cámara y las pistas.
 *
 * Diferencias con el mapa, todas porque vive DENTRO del portal:
 *   · mide su caja (ResizeObserver), no la ventana;
 *   · la rueda sin Ctrl desplaza la página, no hace zoom: la página tiene
 *     menú y pie, y secuestrar la rueda la dejaría atrapada;
 *   · las flechas del teclado solo actúan con la lámina abierta.
 *
 * Como el mapa (D-031): no consulta `prefers-reduced-motion`; `?sin-movimiento`
 * lo deja todo en su estado final para `npm run verificar`.
 */

import { Camara, transformacion } from '../mapa/camara.mjs';
import { Pistas, rgba } from '../mapa/pistas.mjs';
import * as D from './disposicion.mjs';

const AZUL = [76, 141, 255];
const ZOOM_MIN = 0.25, ZOOM_MAX = 2.2;
const ESTRECHA = 900;   // el único punto de ruptura del portal (Marco.astro)

function hexARgb(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** La variante clara de un tono, para TEXTO sobre oscuro (la base es para
 *  bordes y pistas). La misma mezcla que el mapa. */
function aclarar(c, k = 0.34) {
  return c.map((v) => Math.round(v + (255 - v) * k));
}

export function iniciarPlan(datos) {
  const q = new URLSearchParams(location.search);
  const quieta = q.has('sin-movimiento');

  const $ = (id) => document.getElementById(id);
  const el = {
    raiz: document.querySelector('[data-plan]'),
    marco: $('plan-marco'),
    escena: $('plan-escena'),
    rejilla: $('plan-rejilla'),
    pistas: $('plan-pistas'),
    mundo: $('plan-mundo'),
    tira: $('plan-tira'),
    cab: $('plan-cab'),
    eti: $('plan-eti'),
    titulo: $('plan-titulo'),
    sub: $('plan-sub'),
    volver: $('plan-volver'),
    pista: $('plan-pista'),
    barrido: $('plan-barrido'),
    zoom: $('plan-zoom'),
    velo: $('plan-velo'),
    lamina: $('plan-lamina'),
    lMiga: $('plan-l-miga'),
    lPasos: $('plan-l-pasos'),
    lCuerpo: $('plan-l-cuerpo'),
    lAtras: $('plan-l-atras'),
    lAlante: $('plan-l-alante'),
    lCerrar: $('plan-l-cerrar'),
    lista: $('plan-lista'),
  };
  if (!el.raiz || !el.escena) return;
  if (quieta) el.raiz.classList.add('plan-quieto');

  /* ── datos ─────────────────────────────────────────────────────────── */
  const P = datos.pasos.map((p) => {
    const rgb = hexARgb(p.tono);
    const luz = aclarar(rgb);
    return { ...p, rgb, luz, css: rgba(rgb), lcss: rgba(luz) };
  });
  const porSlug = Object.fromEntries(P.map((p) => [p.slug, p]));
  /** Todos los apartados en fila, para que «siguiente» cruce de paso. */
  const SERIE = P.flatMap((p) => p.apartados.map((a, k) => ({ paso: p.slug, id: a.id, k })));
  const indiceSerie = (paso, id) => SERIE.findIndex((s) => s.paso === paso && s.id === id);
  const apartado = (paso, id) => porSlug[paso].apartados.find((a) => a.id === id);

  /* ── motor ─────────────────────────────────────────────────────────── */
  const cam = new Camara(1);
  cam.quieta = quieta;
  cam.alCambiar = () => { aplicar(); if (quieta) pistas.pintar(); };
  const pistas = new Pistas(el.pistas);
  pistas.quieta = quieta;
  pistas.usarCamara(cam);

  let vista = 'hub';
  let pasoActual = null;
  let pos = {};
  let caja = null;
  let ocupado = false;
  let tarjetas = {};
  let abierta = null;           // { paso, id } con la lámina abierta
  let ancho = 0, alto = 0;

  const estrecha = () => innerWidth < ESTRECHA;

  function aplicar() {
    // Por si un navegador sin `overflow: clip` desplazó la caja (ver plan.css).
    if (el.escena.scrollLeft || el.escena.scrollTop) { el.escena.scrollLeft = 0; el.escena.scrollTop = 0; }
    const t = transformacion(cam, ancho, alto);
    el.mundo.style.transform = t;
    el.rejilla.style.transform = t;
    if (el.zoom) el.zoom.textContent = Math.round(cam.z * 100) + '%';
  }

  function encuadre() {
    return D.encuadrar(caja, {
      ancho, alto,
      // El titular centrado queda encima del mapa: el mapa empieza debajo.
      arriba: el.cab.offsetHeight + (vista === 'paso' ? 24 : 12),
      abajo: vista === 'paso' ? 34 : 30,
      zMax: vista === 'paso' ? 1 : 1.05,
    });
  }

  function medir() {
    const r = el.escena.getBoundingClientRect();
    if (!r.width || !r.height) return;
    ancho = r.width; alto = r.height;
    pistas.medir(ancho, alto);
    aplicar();
  }

  /* ── nivel 1 · el hub ──────────────────────────────────────────────── */

  function construirHub() {
    el.mundo.innerHTML = '';
    tarjetas = {};
    const lote = document.createDocumentFragment();
    const d = D.disponerHub(P);
    pos = d.pos; caja = d.caja;

    const nucleo = document.createElement('div');
    nucleo.className = 'pl-nucleo';
    nucleo.style.cssText = 'left:' + (-D.NUCLEO.w / 2) + 'px;top:' + (-D.NUCLEO.h / 2)
      + 'px;width:' + D.NUCLEO.w + 'px;height:' + D.NUCLEO.h + 'px';
    nucleo.innerHTML = '<span class="pl-nucleo__t">La jornada · núcleo</span>'
      + '<span class="pl-nucleo__n">' + datos.reglas + '</span>'
      + '<span class="pl-nucleo__s">reglas en ' + P.length + ' pasos · ' + SERIE.length + ' apartados</span>'
      + '<span class="pl-nucleo__e">Metodología Chaumer</span>';
    lote.appendChild(nucleo);

    P.forEach((p, k) => {
      const s = pos[p.slug];
      const env = document.createElement('div');
      env.className = 'pl-env';
      env.style.cssText = 'left:' + (s.x - s.w / 2) + 'px;top:' + (s.y - s.h / 2)
        + 'px;width:' + s.w + 'px;height:' + s.h + 'px;--d:' + (40 + k * 52) + 'ms';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pl-hex';
      b.style.cssText = tonos(p);
      b.innerHTML = '<span class="pl-hex__in">'
        + '<span class="pl-hex__m">Paso ' + dos(p.n) + ' · ' + p.cruces + (p.cruces === 1 ? ' cruce' : ' cruces') + '</span>'
        + '<span class="pl-hex__n">' + esc(p.corto) + '</span>'
        + '<span class="pl-hex__f"><span class="pl-hex__b">' + dos(p.n) + '</span>'
        + '<span class="pl-hex__c">' + p.reglasN + '</span><span class="pl-hex__u">reglas</span></span>'
        + '<span class="pl-hex__d">' + p.apartados.length + ' apartados</span></span>';
      b.setAttribute('aria-label', p.titulo + ', paso ' + p.n + ' de ' + P.length + ', '
        + p.apartados.length + ' apartados');
      b.addEventListener('click', () => entrar(p.slug));
      b.addEventListener('mouseenter', (e) => verPista(e, {
        m: 'Paso ' + dos(p.n) + ' · ' + p.apartados.length + ' apartados · ' + p.reglasN + ' reglas',
        t: p.titulo,
        d: p.sub + '.' + (p.cruces ? ' Comparte ' + p.cruces + (p.cruces === 1 ? ' regla' : ' reglas')
          + ' con otros pasos.' : '') + ' Se abre con un clic.',
        rgb: p.luz,
      }));
      b.addEventListener('mouseleave', ocultarPista);
      env.appendChild(b);
      lote.appendChild(env);
    });

    el.mundo.appendChild(lote);
    pistas.poner(D.pistasHub(P, pos), D.patillas(AZUL));
  }

  /* ── nivel 2 · un paso ─────────────────────────────────────────────── */

  function construirPaso(slug) {
    el.mundo.innerHTML = '';
    tarjetas = {};
    const lote = document.createDocumentFragment();
    const p = porSlug[slug];
    const d = D.disponerPaso(p.apartados);
    pos = d.pos; caja = d.caja;

    p.apartados.forEach((a, k) => {
      const s = pos[a.id];
      const env = document.createElement('div');
      env.className = 'pl-env';
      env.style.cssText = 'left:' + s.izq + 'px;top:' + s.arr + 'px;width:' + s.w + 'px;height:'
        + s.h + 'px;--d:' + (60 + Math.min(k, 7) * 60) + 'ms';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pl-ap';
      b.style.cssText = tonos(p);
      const otros = otrosPasos(p, a);
      b.innerHTML = (a.imagen
        ? '<span class="pl-ap__img"><img src="' + esc(a.imagen) + '" alt="" loading="eager" decoding="async"></span>'
        : '<span class="pl-ap__img pl-ap__sin" aria-hidden="true"><b>' + dos(k + 1) + '</b></span>')
        + '<span class="pl-ap__tx">'
        + '<span class="pl-ap__m">Apartado ' + (k + 1) + (a.graficos ? ' · ' + a.graficos
          + (a.graficos === 1 ? ' gráfico' : ' gráficos') : '') + '</span>'
        + '<span class="pl-ap__t">' + esc(a.titulo) + '</span>'
        + '<span class="pl-ap__r">' + a.reglas.map((c) => '<span class="pl-cod'
          + (p.comparte[c] ? ' cruza' : '') + '">' + c + '</span>').join('') + '</span>'
        + (otros.length ? '<span class="pl-ap__o">También en ' + esc(lista(otros)) + '</span>' : '')
        + '</span>';
      b.setAttribute('aria-label', 'Apartado ' + (k + 1) + ' de ' + p.apartados.length + ': ' + a.titulo);
      b.addEventListener('click', () => abrir(slug, a.id, b));
      b.addEventListener('mouseenter', (e) => verPista(e, {
        m: 'Apartado ' + (k + 1) + ' de ' + p.apartados.length,
        t: a.titulo,
        d: a.reglas.length
          ? a.reglas.map((c) => c + ' ' + (datos.nombres[c] || '')).join(' · ')
          : 'Este apartado no cita ninguna regla: es el contexto que las une.',
        rgb: p.luz,
      }));
      b.addEventListener('mouseleave', ocultarPista);
      tarjetas[a.id] = b;
      env.appendChild(b);
      lote.appendChild(env);
    });

    el.mundo.appendChild(lote);
    pistas.poner(D.recorrido(p.apartados, pos, p.rgb), []);
  }

  /** Los otros pasos que citan alguna regla de este apartado. */
  function otrosPasos(p, a) {
    const s = new Set();
    for (const c of a.reglas) for (const o of (p.comparte[c] || [])) s.add(o);
    return [...s].map((x) => porSlug[x].corto);
  }

  /* ── transiciones ──────────────────────────────────────────────────── */

  /** Funde del todo, no a medias: es lo que se lee como limpio (mapa, 29/09). */
  function atenuar(o, ms) {
    for (const e of [el.mundo, pistas.lienzo]) {
      e.style.transition = ms === 0 || quieta ? 'none' : 'opacity ' + (ms || 300) + 'ms ease';
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

  function entrar(slug, sinHistoria, alAcabar) {
    if (ocupado) return;
    if (vista === 'paso') return cambiar(slug, sinHistoria, alAcabar);
    ocupado = true;
    ocultarPista();
    const s = pos[slug];
    atenuar(0, 300); barrido();
    // Bajar de nivel es ACERCARSE: la dirección del zoom codifica la jerarquía.
    cam.irHasta({ x: s.x, y: s.y, z: cam.z * 1.9 }, 330, () => {
      vista = 'paso'; pasoActual = slug;
      construirPaso(slug); cromo(); url(sinHistoria);
      const f = encuadre();
      cam.irYa({ x: f.x, y: f.y - 46, z: f.z * 0.86 });
      aplicar(); pistas.revelar(); atenuar(1, 340);
      cam.irHasta(f, 660, () => { ocupado = false; if (alAcabar) alAcabar(); });
    });
  }

  /** Entre pasos hermanos NO hay zoom: no se ha cambiado de nivel. */
  function cambiar(slug, sinHistoria, alAcabar) {
    if (ocupado) return;
    if (slug === pasoActual) { if (alAcabar) alAcabar(); return; }
    ocupado = true;
    ocultarPista();
    atenuar(0, 240); barrido();
    setTimeout(() => {
      pasoActual = slug;
      construirPaso(slug); cromo(); url(sinHistoria);
      const f = encuadre();
      cam.irYa({ x: f.x, y: f.y, z: f.z * 0.92 });
      aplicar(); pistas.revelar(); atenuar(1, 300);
      cam.irHasta(f, 420, () => { ocupado = false; if (alAcabar) alAcabar(); });
    }, quieta ? 0 : 250);
  }

  function volver(sinHistoria) {
    if (ocupado || vista === 'hub') return;
    ocupado = true;
    ocultarPista();
    const previo = pasoActual;
    atenuar(0, 300); barrido();
    // Subir de nivel es ALEJARSE: el espejo de entrar.
    cam.irHasta({ x: cam.x, y: cam.y, z: cam.z * 0.68 }, 330, () => {
      vista = 'hub'; pasoActual = null;
      construirHub(); cromo(); url(sinHistoria);
      const f = encuadre();
      const s = pos[previo] || { x: f.x, y: f.y };
      cam.irYa({ x: s.x, y: s.y, z: f.z * 2.2 });
      aplicar(); pistas.revelar(); atenuar(1, 340);
      cam.irHasta(f, 640, () => { ocupado = false; });
    });
  }

  /** Coloca un paso sin animación (al abrir una dirección o cruzar de paso
   *  con la lámina abierta, que tapa el escenario). */
  function ponerPaso(slug) {
    vista = 'paso'; pasoActual = slug;
    construirPaso(slug); cromo();
    cam.irYa(encuadre());
    aplicar(); pistas.revelar(); atenuar(1, 0);
  }

  /* ── cromo: la cabecera del escenario y la tira de pasos ───────────── */

  function cromo() {
    const enPaso = vista === 'paso';
    el.volver.hidden = !enPaso;
    el.tira.hidden = !enPaso;
    el.eti.hidden = !enPaso;
    el.raiz.classList.toggle('pl--inicio', !enPaso);
    if (enPaso) {
      const p = porSlug[pasoActual];
      el.raiz.style.setProperty('--paso', p.lcss);
      el.eti.textContent = 'Paso ' + dos(p.n) + ' · ' + p.apartados.length + ' apartados · '
        + p.reglasN + ' reglas';
      el.titulo.textContent = p.titulo;
      el.sub.textContent = p.sub;
      for (const b of el.tira.querySelectorAll('[data-paso]')) {
        const on = b.dataset.paso === pasoActual;
        b.classList.toggle('activa', on);
        if (on) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      }
    } else {
      el.raiz.style.removeProperty('--paso');
      el.titulo.textContent = 'Reglas';
      el.sub.textContent = 'Los ' + P.length + ' pasos del día, en su orden. Elige uno para ver sus apartados.';
    }
  }

  /* ── nivel 3 · la lámina ───────────────────────────────────────────── */

  let focoPrevio = null;

  /**
   * Abre un apartado. Su contenido es el mismo componente que la página del
   * paso: se clona de su <template> (no hay copia del texto en ningún sitio).
   * `desde` es la tarjeta pulsada: la lámina crece desde ella.
   */
  function abrir(slug, id, desde, sinHistoria) {
    if (ocupado && !estrecha()) return;
    const a = apartado(slug, id);
    if (!a) return;
    ocultarPista();
    const yaAbierta = !!abierta;
    if (!yaAbierta) focoPrevio = document.activeElement;
    abierta = { paso: slug, id };

    // Cruzar de paso con la lámina abierta: el escenario de detrás se pone
    // al día sin animación, para que al cerrar se vuelva al paso correcto.
    if (!estrecha() && (vista !== 'paso' || pasoActual !== slug)) ponerPaso(slug);

    pintarLamina(slug, id);
    url(sinHistoria);

    if (yaAbierta) { entraCuerpo(); return; }
    el.velo.hidden = false;
    el.lamina.hidden = false;
    document.documentElement.classList.toggle('plan-lamina-movil', estrecha());
    crecerDesde(desde);
    // El foco va a la lámina, no al botón de cerrar: si no, se abre con el
    // aro de foco encendido. Esc y Tab siguen funcionando desde ahí.
    el.lamina.focus({ preventScroll: true });
  }

  function pintarLamina(slug, id) {
    const p = porSlug[slug];
    const k = p.apartados.findIndex((x) => x.id === id);
    const tpl = document.getElementById('plan-tpl-' + slug + '--' + id);
    el.lamina.style.setProperty('--c', p.lcss);
    el.lamina.style.setProperty('--cb', rgba(p.rgb, 0.5));
    el.lMiga.innerHTML = '<span>Reglas</span><i>›</i><span>Paso ' + dos(p.n) + ' · ' + esc(p.titulo)
      + '</span><i>›</i><b>Apartado ' + (k + 1) + ' de ' + p.apartados.length + '</b>';
    el.lPasos.innerHTML = p.apartados.map((x, j) => '<i class="' + (j === k ? 'on' : j < k ? 'hecho' : '')
      + '"></i>').join('');
    el.lCuerpo.innerHTML = '';
    if (tpl) el.lCuerpo.appendChild(tpl.content.cloneNode(true));
    // El apartado se ve entero: nada de la mecánica «un apartado a la vez»
    // de la página del paso, que aquí no aplica.
    for (const s of el.lCuerpo.querySelectorAll('section.ap')) { s.hidden = false; s.removeAttribute('tabindex'); }
    for (const img of el.lCuerpo.querySelectorAll('img')) img.loading = 'eager';
    el.lCuerpo.scrollTop = 0;

    const i = indiceSerie(slug, id);
    const ant = SERIE[i - 1], sig = SERIE[i + 1];
    pie(el.lAtras, ant, 'Anterior');
    pie(el.lAlante, sig, 'Siguiente');
  }

  function pie(b, s, etiqueta) {
    b.hidden = !s;
    if (!s) return;
    const a = apartado(s.paso, s.id);
    const otroPaso = !abierta || s.paso !== abierta.paso;
    b.dataset.paso = s.paso; b.dataset.id = s.id;
    b.innerHTML = '<small>' + etiqueta + (otroPaso ? ' · paso ' + dos(porSlug[s.paso].n) : '') + '</small>'
      + '<b>' + esc(a.titulo) + '</b>';
  }

  function paso(d) {
    if (!abierta) return;
    const s = SERIE[indiceSerie(abierta.paso, abierta.id) + d];
    if (s) abrir(s.paso, s.id);
  }

  function entraCuerpo() {
    if (quieta || !el.lCuerpo.animate) return;
    el.lCuerpo.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
      { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  }

  /** La lámina crece desde la tarjeta pulsada (FLIP): se calcula dónde está
   *  la tarjeta respecto a la lámina ya colocada y se anima esa diferencia. */
  function crecerDesde(desde) {
    if (quieta || !el.lamina.animate) return;
    const fin = el.lamina.getBoundingClientRect();
    const ini = desde && !estrecha() ? desde.getBoundingClientRect() : null;
    const marcos = ini
      ? [{ transform: 'translate(' + (ini.left - fin.left) + 'px,' + (ini.top - fin.top) + 'px) scale('
          + (ini.width / fin.width) + ',' + (ini.height / fin.height) + ')', opacity: 0.35 },
         { transform: 'none', opacity: 1 }]
      : [{ transform: 'translateY(18px) scale(0.985)', opacity: 0 }, { transform: 'none', opacity: 1 }];
    el.lamina.animate(marcos, { duration: ini ? 480 : 340, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    el.lCuerpo.animate([{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }],
      { duration: ini ? 560 : 360, easing: 'ease-out' });
    el.velo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
  }

  function cerrar(sinHistoria) {
    if (!abierta) return;
    const previo = abierta;
    abierta = null;
    const destino = !estrecha() && tarjetas[previo.id];
    const acabar = () => {
      el.lamina.hidden = true; el.velo.hidden = true; el.lCuerpo.innerHTML = '';
      document.documentElement.classList.remove('plan-lamina-movil');
    };
    url(sinHistoria);
    if (quieta || !el.lamina.animate) { acabar(); devolverFoco(previo); return; }
    const fin = el.lamina.getBoundingClientRect();
    const ini = destino ? destino.getBoundingClientRect() : null;
    const anim = el.lamina.animate(ini
      ? [{ transform: 'none', opacity: 1 },
         { transform: 'translate(' + (ini.left - fin.left) + 'px,' + (ini.top - fin.top) + 'px) scale('
           + (ini.width / fin.width) + ',' + (ini.height / fin.height) + ')', opacity: 0 }]
      : [{ opacity: 1 }, { opacity: 0, transform: 'translateY(14px) scale(0.985)' }],
    { duration: ini ? 380 : 240, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
    el.velo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280 });
    anim.onfinish = () => { acabar(); devolverFoco(previo); };
  }

  function devolverFoco(previo) {
    const t = tarjetas[previo.id];
    const f = t || focoPrevio;
    if (f && f.focus) f.focus({ preventScroll: true });
  }

  el.lAtras.addEventListener('click', () => paso(-1));
  el.lAlante.addEventListener('click', () => paso(1));
  el.lCerrar.addEventListener('click', () => cerrar());
  el.velo.addEventListener('click', () => cerrar());

  /* ── la dirección: /plan · /plan#zonas · /plan#zonas/movimiento ───── */

  function hashActual() {
    if (abierta) return '#' + abierta.paso + '/' + abierta.id;
    if (vista === 'paso' && !estrecha()) return '#' + pasoActual;
    return '';
  }
  function url(sinHistoria) {
    if (sinHistoria) return;
    const h = hashActual();
    if (h === location.hash || (!h && !location.hash)) return;
    history.pushState(null, '', location.pathname + location.search + h);
  }
  function leerHash() {
    const m = /^#([a-z-]+)(?:\/([a-z0-9-]+))?$/.exec(decodeURIComponent(location.hash || ''));
    if (!m || !porSlug[m[1]]) return { paso: null, id: null };
    const id = m[2] && apartado(m[1], m[2]) ? m[2] : null;
    return { paso: m[1], id };
  }

  /** Lleva la pantalla al estado de la dirección (al arrancar y al pulsar
   *  Atrás o Adelante del navegador). */
  function irAlHash() {
    const h = leerHash();
    if (h.id) {
      if (abierta && abierta.paso === h.paso && abierta.id === h.id) return;
      abrir(h.paso, h.id, null, true);
      return;
    }
    if (abierta) cerrar(true);
    if (estrecha()) return;
    if (h.paso) {
      if (vista === 'hub') entrar(h.paso, true); else cambiar(h.paso, true);
    } else if (vista === 'paso') volver(true);
  }
  addEventListener('popstate', irAlHash);

  /* ── globo ─────────────────────────────────────────────────────────── */

  /* Se escribe DIRECTO en su hueco: si pasara por un re-render del mundo se
     recrearía el nodo bajo el cursor y el mouseover entraría en bucle. */
  function verPista(ev, o) {
    const p = el.pista;
    p.style.setProperty('--tb', rgba(o.rgb, 0.4));
    p.style.setProperty('--tc', rgba(o.rgb));
    p.innerHTML = '<p class="pl-pista__m">' + esc(o.m) + '</p>'
      + '<p class="pl-pista__t">' + esc(o.t) + '</p>'
      + '<p class="pl-pista__d">' + esc(o.d) + '</p>';
    const r = ev.currentTarget.getBoundingClientRect();
    const e = el.escena.getBoundingClientRect();
    const w = 320;
    let x = r.left - e.left + r.width / 2 - w / 2;
    x = Math.max(12, Math.min(ancho - w - 12, x));
    let y = r.bottom - e.top + 12;
    if (y + 170 > alto) y = Math.max(12, r.top - e.top - 12 - 150);
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.classList.add('visible');
  }
  function ocultarPista() { el.pista.classList.remove('visible'); }

  /* ── ratón ─────────────────────────────────────────────────────────── */

  let arrastre = null;
  el.escena.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a')) return;
    arrastre = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
    el.escena.setPointerCapture(e.pointerId);
    el.escena.classList.add('arrastrando');
  });
  el.escena.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    cam.cancelar();
    cam.x = arrastre.cx - (e.clientX - arrastre.x) / cam.z;
    cam.y = arrastre.cy - (e.clientY - arrastre.y) / cam.z;
    aplicar(); if (quieta) pistas.pintar();
  });
  const soltar = () => { arrastre = null; el.escena.classList.remove('arrastrando'); };
  el.escena.addEventListener('pointerup', soltar);
  el.escena.addEventListener('pointercancel', soltar);
  // Solo con Ctrl (o el pellizco del trackpad, que llega como Ctrl+rueda):
  // la rueda sola desplaza la página, que tiene menú y pie debajo.
  el.escena.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    cam.acercar(e.deltaY < 0 ? 1.12 : 0.89, ZOOM_MIN, ZOOM_MAX);
  }, { passive: false });

  /* ── teclado ───────────────────────────────────────────────────────── */

  addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName || '')) return;
    if (t && t.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (abierta) {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); paso(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); paso(1); }
      return;
    }
    if (estrecha()) return;
    switch (e.key) {
      case 'Escape': return volver();
      case '[': return saltar(-1);
      case ']': return saltar(1);
      case '+': case '=': return cam.acercar(1.25, ZOOM_MIN, ZOOM_MAX);
      case '-': case '_': return cam.acercar(0.8, ZOOM_MIN, ZOOM_MAX);
      case '0': return ajustar();
    }
  });

  function saltar(d) {
    if (vista !== 'paso') return;
    const i = P.findIndex((p) => p.slug === pasoActual);
    const s = P[(i + d + P.length) % P.length];
    if (s) cambiar(s.slug);
  }
  function ajustar() { cam.irHasta(encuadre(), 450); }

  /* ── controles ─────────────────────────────────────────────────────── */

  el.volver.addEventListener('click', () => volver());
  for (const b of el.tira.querySelectorAll('[data-paso]')) {
    b.addEventListener('click', () => cambiar(b.dataset.paso));
  }
  const btn = (id, fn) => { const b = $(id); if (b) b.addEventListener('click', fn); };
  btn('plan-menos', () => cam.acercar(0.8, ZOOM_MIN, ZOOM_MAX));
  btn('plan-mas', () => cam.acercar(1.25, ZOOM_MIN, ZOOM_MAX));
  btn('plan-ajustar', ajustar);

  // La lista (celular y sin JavaScript): cada enlace va a la página del paso;
  // con JavaScript abre la lámina aquí mismo.
  if (el.lista) {
    el.lista.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-paso][data-id]');
      if (!a) return;
      e.preventDefault();
      abrir(a.dataset.paso, a.dataset.id, null);
    });
  }

  /* ── arranque ──────────────────────────────────────────────────────── */

  new ResizeObserver(() => { medir(); }).observe(el.escena);
  medir();
  construirHub();
  cromo();
  cam.irYa(encuadre());
  aplicar();
  pistas.revelar();

  // La dirección se lee AL ARRANCAR: un enlace a un paso o a un apartado
  // abre ese paso o ese apartado, no el hub.
  const inicial = leerHash();
  if (inicial.paso && !estrecha()) ponerPaso(inicial.paso);
  // En el celular, un enlace a un paso (los de la portada) lo deja abierto.
  if (inicial.paso && !inicial.id && estrecha()) {
    const d = document.getElementById(inicial.paso);
    if (d) d.open = true;
  }
  if (inicial.id) abrir(inicial.paso, inicial.id, null, true);

  if (quieta) {
    pistas.pintar();
  } else {
    (function bucle() {
      requestAnimationFrame(bucle);
      if (!ancho) return;
      if (cam.tick()) aplicar();
      pistas.pintar();
    })();
  }

  /* ── ayudas ────────────────────────────────────────────────────────── */

  function tonos(p) {
    return '--c:' + p.lcss + ';--cd:' + rgba(p.luz, 0.8) + ';--cb:' + rgba(p.rgb, 0.42)
      + ';--b:' + rgba(p.luz, 0.75) + ';--f:#090C12;--g:' + rgba(p.rgb, 0.35);
  }
  function dos(n) { return String(n).padStart(2, '0'); }
  function lista(xs) {
    return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1];
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
