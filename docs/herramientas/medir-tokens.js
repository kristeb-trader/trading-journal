#!/usr/bin/env node
/**
 * medir-tokens.js — de dónde salen los tokens de una sesión de Claude Code.
 *
 * Lee los transcripts .jsonl que Claude Code deja en
 *   ~/.claude/projects/<proyecto>/
 * y saca los contadores reales de uso. No estima nada: son las cifras que
 * devuelve la API en cada mensaje.
 *
 *   node docs/herramientas/medir-tokens.js sesiones
 *   node docs/herramientas/medir-tokens.js arranque
 *   node docs/herramientas/medir-tokens.js turnos   <id-sesion>
 *   node docs/herramientas/medir-tokens.js llamadas <id-sesion>
 *
 * El <id-sesion> es el nombre del .jsonl sin extensión (basta el prefijo).
 * Otro proyecto:  --dir "C:/Users/<tu>/.claude/projects/<otro>"
 *
 * La clave para leer los resultados:
 *
 *     coste ≈ nº de llamadas × tamaño del contexto
 *
 * Cada llamada a una herramienta relee la conversación entera, así que a mitad
 * de sesión una llamada que imprime "OK" cuesta casi lo mismo que escribir un
 * archivo grande. Por eso lo que hay que vigilar es el NÚMERO de llamadas y el
 * crecimiento del contexto, no los bytes.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const args = process.argv.slice(2);
const cmd = args[0];
const iDir = args.indexOf('--dir');
const DIR = iDir >= 0 ? args[iDir + 1]
  : path.join(os.homedir(), '.claude', 'projects', 'E--Proyectos-Trading-Journal');

const K = (x) => Math.round(x / 1000) + 'k';
const M = (x) => (x / 1e6).toFixed(1) + 'M';
const pad = (x, n) => String(x).padStart(n);

function transcripts() {
  if (!fs.existsSync(DIR)) {
    console.error('No existe la carpeta de transcripts:\n  ' + DIR);
    process.exit(1);
  }
  return fs.readdirSync(DIR).filter((f) => f.endsWith('.jsonl'));
}

function* eventos(archivo) {
  for (const l of fs.readFileSync(path.join(DIR, archivo), 'utf8').split('\n')) {
    if (!l.trim()) continue;
    try { yield JSON.parse(l); } catch { /* linea corrupta, se salta */ }
  }
}

// Un "turno" es una petición real del usuario, no un resultado de herramienta.
function esTurnoUsuario(o) {
  if (o.type !== 'user' || !o.message || o.isMeta) return false;
  const c = o.message.content;
  if (typeof c === 'string') return true;
  if (!Array.isArray(c)) return false;
  return !c.some((b) => b.type === 'tool_result') && c.some((b) => b.type === 'text');
}

function resumen(archivo) {
  let out = 0, cacheR = 0, cacheW = 0, turnos = 0, msgs = 0, maxCtx = 0, primerCtx = null;
  let fecha = '';
  for (const o of eventos(archivo)) {
    if (o.timestamp && !fecha) fecha = o.timestamp.slice(0, 10);
    if (esTurnoUsuario(o)) turnos++;
    if (o.type === 'assistant' && o.message && o.message.usage) {
      const u = o.message.usage;
      msgs++;
      out += u.output_tokens || 0;
      cacheR += u.cache_read_input_tokens || 0;
      cacheW += u.cache_creation_input_tokens || 0;
      const ctx = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
      if (primerCtx === null) primerCtx = ctx;
      if (ctx > maxCtx) maxCtx = ctx;
    }
  }
  return { id: archivo.slice(0, 8), fecha, turnos, msgs, out, cacheR, cacheW, maxCtx, primerCtx: primerCtx || 0 };
}

function buscar(prefijo) {
  const f = transcripts().find((x) => x.startsWith(prefijo));
  if (!f) { console.error('No encuentro ninguna sesión que empiece por: ' + prefijo); process.exit(1); }
  return f;
}

// ── sesiones ──────────────────────────────────────────────────────────────
function cmdSesiones() {
  const filas = transcripts().map(resumen).filter((r) => r.msgs > 0 && r.turnos > 0);
  filas.sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  console.log('fecha      | id       | turnos | msgs | msgs/turno | out/turno | cacheR/turno | ctx max');
  console.log('-----------|----------|--------|------|------------|-----------|--------------|--------');
  for (const r of filas) {
    console.log(r.fecha + ' | ' + r.id + ' | ' + pad(r.turnos, 6) + ' | ' + pad(r.msgs, 4) + ' | ' +
      pad((r.msgs / r.turnos).toFixed(1), 10) + ' | ' + pad(K(r.out / r.turnos), 9) + ' | ' +
      pad(M(r.cacheR / r.turnos), 12) + ' | ' + pad(K(r.maxCtx), 7));
  }
  console.log('\nmsgs/turno alto = muchas llamadas por petición. Es el multiplicador del coste.');
}

// ── arranque ──────────────────────────────────────────────────────────────
function cmdArranque() {
  const filas = transcripts().map(resumen).filter((r) => r.msgs > 0);
  filas.sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  console.log('fecha      | id       | arranque | ctx final | crecimiento');
  console.log('-----------|----------|----------|-----------|------------');
  for (const r of filas) {
    console.log(r.fecha + ' | ' + r.id + ' | ' + pad(K(r.primerCtx), 8) + ' | ' +
      pad(K(r.maxCtx), 9) + ' | ' + pad('x' + (r.maxCtx / Math.max(r.primerCtx, 1)).toFixed(1), 11));
  }
  console.log('\nEl arranque es lo que se carga ANTES de escribir nada: system prompt,');
  console.log('esquemas de herramientas, descripciones de TODOS los skills y plugins');
  console.log('conectados, instrucciones de los MCP, CLAUDE.md y la memoria.');
  console.log('Si sube sin que el proyecto haya cambiado, mira qué plugins tienes conectados.');
}

// ── turnos ────────────────────────────────────────────────────────────────
function cmdTurnos(prefijo) {
  const archivo = buscar(prefijo);
  const turnos = [];
  let actual = null;
  for (const o of eventos(archivo)) {
    if (esTurnoUsuario(o)) {
      actual = { n: turnos.length + 1, msgs: 0, out: 0, cacheR: 0, ctx: 0 };
      turnos.push(actual);
    } else if (o.type === 'assistant' && o.message && o.message.usage && actual) {
      const u = o.message.usage;
      actual.msgs++;
      actual.out += u.output_tokens || 0;
      actual.cacheR += u.cache_read_input_tokens || 0;
      actual.ctx = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
    }
  }
  console.log('SESION ' + archivo.replace('.jsonl', '') + '\n');
  console.log('turno | llamadas | out    | cacheR  | ctx al final');
  console.log('------|----------|--------|---------|-------------');
  for (const t of turnos) {
    console.log(pad(t.n, 5) + ' | ' + pad(t.msgs, 8) + ' | ' + pad(K(t.out), 6) + ' | ' +
      pad(M(t.cacheR), 7) + ' | ' + pad(K(t.ctx), 12));
  }
  const total = turnos.reduce((a, t) => a + t.cacheR, 0);
  const peor = turnos.slice().sort((a, b) => b.cacheR - a.cacheR)[0];
  if (peor && total) {
    console.log('\nTurno más caro: el ' + peor.n + ' — ' + peor.msgs + ' llamadas, ' +
      Math.round((peor.cacheR / total) * 100) + '% de toda la sesión.');
    console.log('Si un turno pasa de ~25 llamadas, conviene partirlo en varias peticiones.');
  }
}

// ── llamadas ──────────────────────────────────────────────────────────────
function cmdLlamadas(prefijo) {
  const archivo = buscar(prefijo);
  const porTool = {};
  const pesadas = [];
  const porArchivo = {};
  let n = 0;
  for (const o of eventos(archivo)) {
    if (o.type !== 'assistant' || !o.message || !Array.isArray(o.message.content)) continue;
    for (const b of o.message.content) {
      if (b.type !== 'tool_use') continue;
      n++;
      const inp = b.input || {};
      const bytes = JSON.stringify(inp).length;
      porTool[b.name] = porTool[b.name] || { n: 0, bytes: 0 };
      porTool[b.name].n++; porTool[b.name].bytes += bytes;
      pesadas.push({ tool: b.name, bytes, destino: inp.file_path || inp.url || (inp.command || '').slice(0, 55) || '' });
      if (['Read', 'Write', 'Edit'].includes(b.name) && inp.file_path) {
        const k = inp.file_path.replace(/\\/g, '/').split('/').slice(-2).join('/');
        porArchivo[k] = porArchivo[k] || { Read: 0, Write: 0, Edit: 0 };
        porArchivo[k][b.name]++;
      }
    }
  }
  console.log('TOTAL de llamadas: ' + n + '\n');
  console.log('=== Reparto por herramienta ===');
  Object.entries(porTool).sort((a, b) => b[1].n - a[1].n).forEach(([k, v]) =>
    console.log('  ' + pad(v.n, 4) + ' llamadas  ' + pad(Math.round(v.bytes / 1024) + ' KB', 8) +
      '  ' + pad(Math.round((v.n / n) * 100) + '%', 4) + '  ' + k));
  console.log('\n=== Las 10 llamadas más pesadas ===');
  pesadas.sort((a, b) => b.bytes - a.bytes).slice(0, 10).forEach((c) =>
    console.log('  ' + pad(Math.round(c.bytes / 1024) + ' KB', 7) + '  ' + c.tool.padEnd(7) + '  ' + c.destino.slice(0, 58)));
  const repetidos = Object.entries(porArchivo).filter(([, v]) => v.Write + v.Edit > 1);
  if (repetidos.length) {
    console.log('\n=== Archivos escritos o editados más de una vez ===');
    repetidos.sort((a, b) => (b[1].Write + b[1].Edit) - (a[1].Write + a[1].Edit))
      .forEach(([k, v]) => console.log('  R:' + v.Read + ' W:' + v.Write + ' E:' + v.Edit + '   ' + k));
    console.log('\nMuchas ediciones sueltas del mismo archivo = ediciones a goteo.');
    console.log('Agruparlas por fase ahorra llamadas (regla R3 del skill flujo-desarrollo).');
  }
  console.log('\nBash y Edit suelen ser el 60%+ de las llamadas moviendo pocos bytes:');
  console.log('ahí es donde se recorta, no en Write.');
}

switch (cmd) {
  case 'sesiones': cmdSesiones(); break;
  case 'arranque': cmdArranque(); break;
  case 'turnos': cmdTurnos(args[1] || ''); break;
  case 'llamadas': cmdLlamadas(args[1] || ''); break;
  default:
    console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace('#!/usr/bin/env node\n/**', '').replace(/^ \* ?/gm, ''));
    console.log('Sesiones disponibles:');
    transcripts().forEach((f) => console.log('  ' + f.replace('.jsonl', '')));
}
