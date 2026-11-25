// La foto del día con sus placas (25/11/2026). La llama FotoChaumer (NinjaTrader) cuando el día está registrado.
//
//   node scripts/foto/componer.mjs --fecha 2026-11-25 --grafico <png del gráfico> --salida <png final>
//   node scripts/foto/componer.mjs --fecha 2026-11-25 --firma      (solo los datos: ¿registrado? y su huella)
//
// Arriba, la placa con el día («MIÉRCOLES, 25 DE NOVIEMBRE, 2026») y la entrada en su recuadro; en el medio, el gráfico
// de 1 minuto TAL CUAL, píxel a píxel y sin bordes; abajo, la placa con Resultado · Puntos · Contratos · P&L · Setup
// (o Resultado · Motivo, sin operación). El color del resultado: target verde, stop rojo, lo demás gris. Diseño
// aprobado por Kris el 25/11/2026 (los bocetos, en el chat; sin documento de diseño). Los datos salen del Journal y se
// calculan como el banner del visor (`Modal.bannerDia` de js/app.js): si allí cambian, aquí también.
//
// Imprime una línea JSON: { ok, registrada, firma, salida? , error? }. La clave de Supabase, la del PC de NinjaTrader.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SUPABASE = 'https://jothoslozctflfrnysrx.supabase.co/rest/v1/';
const PLACA_ARRIBA = 160, PLACA_ABAJO = 160;   // lo que añaden las placas al alto del gráfico

const arg = n => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : null; };
const salir = (o, code = 0) => { console.log(JSON.stringify(o)); process.exit(code); };

const fecha = arg('fecha');
if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) salir({ ok: false, error: 'falta --fecha AAAA-MM-DD' }, 1);

// ── Los datos del día ──────────────────────────────────────────────────────────
const clave = (() => {
  try { return fs.readFileSync(path.join(os.homedir(), 'Documents', 'NinjaTrader 8', 'supabase-service-key.txt'), 'utf8').replace(/^﻿/, '').trim(); }
  catch { return null; }
})();
if (!clave) salir({ ok: false, error: 'sin supabase-service-key.txt' }, 1);
const leer = async ruta => {
  const r = await fetch(SUPABASE + ruta, { headers: { apikey: clave, Authorization: `Bearer ${clave}` } });
  if (!r.ok) throw new Error(`Supabase ${r.status}`);
  return r.json();
};

const DIAS = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const titulo = f => { const d = new Date(`${f}T12:00:00`); return `${DIAS[d.getDay()]}, ${d.getDate()} DE ${MESES[d.getMonth()]}, ${d.getFullYear()}`; };
const miles = n => Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const dinero = n => `${n < 0 ? '−' : '+'}$${miles(n)}`;                                   // fmtDinero de db.js
const puntos = n => `${n < 0 ? '−' : n > 0 ? '+' : ''}${Math.abs(n).toLocaleString('es-ES', { maximumFractionDigits: 2 })}`;

let ses, trades;
try {
  [ses, trades] = await Promise.all([
    leer(`sesiones?sesion_date=eq.${fecha}&select=registrada_at,no_opero,motivo_no_opero,setup,setup_valido_no_tomado`),
    leer(`trades?trade_date=eq.${fecha}&select=entry_time,entry_price,exit_price,market_pos,qty,profit&order=entry_time`),
  ]);
} catch (e) { salir({ ok: false, error: e.message }, 1); }
const s = ses[0] || {};

const D = { dia: titulo(fecha), entry: trades.length ? String(trades[0].entry_time).slice(0, 8) : null };
if (trades.length) {
  // Como `_dayState` y `_puntosDia` de js/app.js.
  const pnl = trades.reduce((n, t) => n + (parseFloat(t.profit) || 0), 0);
  const be = trades.every(t => Math.abs(parseFloat(t.profit) || 0) <= 6);
  D.tono = be ? 'nada' : pnl >= 0 ? 'target' : 'stop';
  D.res = be ? 'B.E.' : pnl >= 0 ? 'TARGET' : 'STOP';
  let pts = null;
  for (const t of trades) {
    const e = parseFloat(t.entry_price), x = parseFloat(t.exit_price);
    if (!isFinite(e) || !isFinite(x)) continue;
    pts = (pts || 0) + (/short|sell/i.test(t.market_pos || '') ? e - x : x - e);
  }
  D.pts = pts == null ? '—' : puntos(Math.round(pts * 100) / 100);
  D.ptsNeg = pts != null && pts < 0;
  D.ct = String(trades.reduce((n, t) => n + (Number(t.qty) || 0), 0) || '—');
  D.pnl = dinero(pnl);
  D.setup = (s.setup || '').trim() || '—';
} else {
  D.tono = 'nada';
  D.res = 'SIN OPERACIÓN';
  D.motivo = s.setup_valido_no_tomado ? 'Setup válido no tomado' : ((s.motivo_no_opero || '').trim() || '—');
}
const firma = crypto.createHash('sha1').update(JSON.stringify(D)).digest('hex').slice(0, 16);
const registrada = !!s.registrada_at;
if (process.argv.includes('--firma')) salir({ ok: true, registrada, firma });

const grafico = arg('grafico'), salida = arg('salida');
if (!grafico || !fs.existsSync(grafico) || !salida) salir({ ok: false, error: 'faltan --grafico (que exista) y --salida' }, 1);

// ── La imagen ──────────────────────────────────────────────────────────────────
const require = createRequire(path.join(RAIZ, 'chaumer', '04_Web', 'package.json'));
const puppeteer = require('puppeteer');

const png = fs.readFileSync(grafico);
const W = png.readUInt32BE(16), H = png.readUInt32BE(20);   // el tamaño del PNG, de su cabecera
const ALTO = H + PLACA_ARRIBA + PLACA_ABAJO;

const TONO = {
  target: { txt: '#3fe0a6', fondo: 'rgba(63,224,166,.16)', borde: 'rgba(63,224,166,.45)' },
  stop:   { txt: '#f2706f', fondo: 'rgba(226,75,74,.16)',  borde: 'rgba(242,112,111,.5)' },
  nada:   { txt: '#c9d3ce', fondo: 'rgba(255,255,255,.07)', borde: 'rgba(255,255,255,.22)' },
}[D.tono];
const esc = x => String(x ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tonoPts = D.tono === 'nada' ? '' : 'tono';
const abajo = trades.length
  ? `<div class="c"><div class="lbl">Resultado</div><div class="pill">${esc(D.res)}</div></div>
     <div class="c"><div class="lbl">Puntos</div><div class="val ${tonoPts}">${esc(D.pts)}</div></div>
     <div class="c"><div class="lbl">Contratos</div><div class="val">${esc(D.ct)}</div></div>
     <div class="c"><div class="lbl">P&amp;L</div><div class="val ${tonoPts}">${esc(D.pnl)}</div></div>
     <div class="c setup"><div class="lbl">Setup</div><div class="val chica">${esc(D.setup)}</div></div>`
  : `<div class="c"><div class="lbl">Resultado</div><div class="pill">${esc(D.res)}</div></div>
     <div class="c ancho"><div class="lbl">Motivo</div><div class="val chica">${esc(D.motivo)}</div></div>`;

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${ALTO}px; overflow: hidden; }
  body { font-family: Manrope, 'Segoe UI', sans-serif; color: #f2f5f3; -webkit-font-smoothing: antialiased;
         background: radial-gradient(120% 90% at 50% 0%, #12261f 0%, #0a1411 55%, #060b09 100%); }
  .placa { position: absolute; left: 28px; right: 28px; display: flex; align-items: stretch;
           background: linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.02));
           border: 1px solid rgba(120,230,180,.28); border-radius: 20px;
           box-shadow: 0 1px 0 rgba(255,255,255,.12) inset, 0 -2px 0 rgba(0,0,0,.35) inset, 0 14px 34px rgba(0,0,0,.55); }
  .arriba { top: 22px; height: 116px; }
  .arriba h1 { flex: 1; display: flex; align-items: center; justify-content: center; padding-left: 300px;
               font-size: 44px; font-weight: 800; letter-spacing: .06em; white-space: nowrap; }
  .entry { width: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
           border-left: 2px solid rgba(120,230,180,.16); background: rgba(0,0,0,.18); border-radius: 0 19px 19px 0; }
  .lbl { font-size: 17px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: #8fa59b; }
  .entry .v { font-size: 42px; font-weight: 800; letter-spacing: .02em; }
  .entry .v.no { font-size: 26px; color: #8fa59b; letter-spacing: .1em; }
  .graf { position: absolute; left: 0; top: ${PLACA_ARRIBA}px; width: ${W}px; height: ${H}px; }
  .abajo { top: ${PLACA_ARRIBA + H + 28}px; height: 112px; }
  .abajo .c { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-width: 0; }
  .abajo .c + .c { border-left: 2px solid rgba(120,230,180,.16); }
  .abajo .c.setup { flex: 1.7; } .abajo .c.ancho { flex: 5.7; }
  .val { font-size: 40px; font-weight: 800; letter-spacing: -.01em; white-space: nowrap; }
  .val.chica { font-size: 36px; }
  .tono { color: ${TONO.txt}; }
  .pill { padding: 4px 18px; border-radius: 8px; font-size: 24px; font-weight: 800; letter-spacing: .08em; white-space: nowrap;
          background: ${TONO.fondo}; color: ${TONO.txt}; border: 1px solid ${TONO.borde}; }
</style>
<body>
  <div class="placa arriba"><h1>${esc(D.dia)}</h1>
    <div class="entry"><div class="lbl">Entry</div>${D.entry ? `<div class="v">${esc(D.entry)}</div>` : '<div class="v no">SIN ENTRADA</div>'}</div></div>
  <img class="graf" src="data:image/png;base64,${png.toString('base64')}">
  <div class="placa abajo">${abajo}</div>
</body>`;

let nav;
try {
  nav = await puppeteer.launch();
  const pag = await nav.newPage();
  await pag.setViewport({ width: W, height: ALTO, deviceScaleFactor: 1 });
  await pag.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});   // sin red: la letra de respaldo
  await pag.evaluate(() => document.fonts.ready);
  await pag.screenshot({ path: salida });
} catch (e) { salir({ ok: false, registrada, firma, error: e.message }, 1); }
finally { if (nav) await nav.close(); }
salir({ ok: true, registrada, firma, salida, ancho: W, alto: ALTO });
