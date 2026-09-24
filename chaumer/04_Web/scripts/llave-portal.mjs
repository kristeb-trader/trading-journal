/**
 * La llave con la que el portal lee la bitácora de Supabase.
 *
 *   node scripts/llave-portal.mjs        (desde chaumer/04_Web)
 *
 * Pide el JWT secret del proyecto de Supabase (Settings → JWT Keys → Legacy JWT
 * Secret) SIN enseñarlo en pantalla, y con él firma un JWT de rol
 * `portal_lector`: el rol que solo puede leer las vistas `portal_bt_*`.
 *
 * El secreto no se guarda en ningún sitio: se usa para firmar y se olvida. Lo
 * que queda es la llave firmada, que no sirve para nada más que leer esas dos
 * vistas.
 *
 * Antes de dar la llave por buena, la PRUEBA contra Supabase: tiene que leer
 * las dos vistas y tiene que fallar al leer `trades`, `bt_jornadas` o al
 * escribir. Si algo de eso no se cumple, no escribe nada.
 *
 * Si todo pasa:
 *   · la escribe en .dev.vars (gitignoreado) como SUPABASE_PORTAL_KEY, para
 *     probar el portal en local;
 *   · la enseña para pegarla en Cloudflare Pages como secreto del mismo nombre.
 *
 * Diseño: docs/disenos/2026-09-24-unificacion-chaumer.md, fase 4a.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const WEB = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEV_VARS = path.join(WEB, '.dev.vars');

const REF = 'jothoslozctflfrnysrx';
const URL_SB = `https://${REF}.supabase.co`;
// La misma clave publicable que usa functions/api/backtesting/_comun.js.
const PUBLICA = 'sb_publishable_XQX0FdnJFuq0YJS-_ashug_c6Hb1mS4';
const ROL = 'portal_lector';
const DIEZ_ANOS = 10 * 365 * 24 * 3600;

/** Lee una línea sin eco. Si la entrada no es una terminal (tubería), la lee tal cual. */
function preguntarOculto(texto) {
  const entrada = process.stdin;
  process.stdout.write(texto);
  if (!entrada.isTTY) {
    return new Promise((ok) => {
      let v = '';
      entrada.setEncoding('utf8');
      entrada.on('data', (c) => { v += c; });
      entrada.on('end', () => { process.stdout.write('\n'); ok(v.trim()); });
    });
  }
  return new Promise((ok) => {
    let v = '';
    entrada.setRawMode(true);
    entrada.setEncoding('utf8');
    entrada.resume();
    const alPulsar = (trozo) => {
      for (const c of trozo) {
        if (c === '\r' || c === '\n') {
          entrada.setRawMode(false);
          entrada.pause();
          entrada.off('data', alPulsar);
          process.stdout.write('\n');
          ok(v.trim());
          return;
        }
        if (c === '\u0003') { process.stdout.write('\n'); process.exit(1); }
        if (c === '\u007f' || c === '\b') { v = v.slice(0, -1); continue; }
        v += c;
      }
    };
    entrada.on('data', alPulsar);
  });
}

const b64url = (x) => Buffer.from(x).toString('base64url');

function firmar(secreto) {
  const ahora = Math.floor(Date.now() / 1000);
  const cabeza = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const cuerpo = b64url(JSON.stringify({
    iss: 'supabase', ref: REF, role: ROL, iat: ahora, exp: ahora + DIEZ_ANOS,
  }));
  const firma = createHmac('sha256', secreto).update(`${cabeza}.${cuerpo}`).digest('base64url');
  return `${cabeza}.${cuerpo}.${firma}`;
}

async function pedir(llave, ruta, opciones = {}) {
  const r = await fetch(`${URL_SB}/rest/v1/${ruta}`, {
    ...opciones,
    headers: {
      apikey: PUBLICA,
      authorization: `Bearer ${llave}`,
      'content-type': 'application/json',
      ...(opciones.headers || {}),
    },
  });
  let cuerpo = null;
  try { cuerpo = await r.json(); } catch { /* sin cuerpo */ }
  return { estado: r.status, cuerpo, rango: r.headers.get('content-range') };
}

async function probar(llave) {
  const pruebas = [];
  const anota = (nombre, ok, detalle) => pruebas.push({ nombre, ok, detalle });

  const cab = await pedir(llave, 'portal_bt_cabecera?select=*');
  anota('lee portal_bt_cabecera', cab.estado === 200 && Array.isArray(cab.cuerpo) && cab.cuerpo.length === 1,
    `${cab.estado} ${cab.estado === 200 ? '' : JSON.stringify(cab.cuerpo)}`);

  const jor = await pedir(llave, 'portal_bt_jornadas?select=fecha', { headers: { prefer: 'count=exact' } });
  anota('lee portal_bt_jornadas', jor.estado === 200 || jor.estado === 206,
    `${jor.estado} · ${jor.rango || ''}`);

  for (const tabla of ['trades', 'bt_jornadas', 'sesiones']) {
    const r = await pedir(llave, `${tabla}?select=*&limit=1`);
    anota(`NO lee ${tabla}`, r.estado === 401 || r.estado === 403, String(r.estado));
  }

  // Con un filtro que no casa con ninguna fila: si por error se pudiera
  // escribir, no cambiaría nada. Lo que se mide es el permiso.
  const esc = await pedir(llave, 'portal_bt_cabecera?valor_inicial=lt.0', {
    method: 'PATCH', body: JSON.stringify({ comision: 0 }), headers: { prefer: 'return=minimal' },
  });
  anota('NO escribe', esc.estado === 401 || esc.estado === 403, String(esc.estado));

  return pruebas;
}

function guardarDevVars(llave) {
  const lineas = fs.existsSync(DEV_VARS)
    ? fs.readFileSync(DEV_VARS, 'utf8').split(/\r?\n/).filter((l) => !l.startsWith('SUPABASE_PORTAL_KEY='))
    : [];
  while (lineas.length && lineas[lineas.length - 1] === '') lineas.pop();
  lineas.push(`SUPABASE_PORTAL_KEY=${llave}`, '');
  fs.writeFileSync(DEV_VARS, lineas.join('\n'));
}

/**
 * ¿Es este el secreto que firmó la clave anónima del Journal (js/config.js)?
 * Esa clave es un JWT firmado con el Legacy JWT Secret: si la firma recalculada
 * coincide, el secreto es el bueno. Se comprueba sin red y sin enseñar nada.
 */
function firmaLaClaveAnonima(secreto) {
  const config = path.join(WEB, '..', '..', 'js', 'config.js');
  const m = fs.existsSync(config) && fs.readFileSync(config, 'utf8').match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/);
  if (!m) return null; // sin la clave a mano no se puede saber
  const [cabeza, cuerpo, firma] = m[0].split('.');
  return createHmac('sha256', secreto).update(`${cabeza}.${cuerpo}`).digest('base64url') === firma;
}

// Pegar en una terminal sin eco puede colar basura: las marcas de «pegado entre
// corchetes» (ESC[200~ … ESC[201~) o un Ctrl+V que llega como carácter de control.
const secreto = (await preguntarOculto('JWT secret de Supabase (no se ve al pegarlo): '))
  .replace(/\x1b\[20[01]~/g, '')
  .replace(/[\x00-\x1f\x7f]/g, '')
  .trim();
if (!secreto) { console.error('No llegó ningún secreto.'); process.exit(1); }

console.log(`Secreto recibido: ${secreto.length} caracteres.`);
const esElBueno = firmaLaClaveAnonima(secreto);
if (esElBueno === false) {
  console.error('');
  console.error('✘ Ese NO es el secreto que firmó la clave anónima del Journal: no se ha probado nada.');
  console.error('  Cópialo otra vez de Supabase → Settings → JWT Keys → pestaña «Legacy JWT Secret»');
  console.error('  y pásalo desde el portapapeles, sin pegar en la terminal:');
  console.error('    Get-Clipboard | node scripts/llave-portal.mjs');
  process.exit(1);
}
if (esElBueno) console.log('✔ Es el secreto que firmó la clave anónima del Journal.');

const llave = firmar(secreto);
const pruebas = await probar(llave);

console.log('');
for (const p of pruebas) console.log(`  ${p.ok ? '✔' : '✘'} ${p.nombre}  (${p.detalle})`);
console.log('');

if (!pruebas.every((p) => p.ok)) {
  console.error('La llave NO pasa las pruebas: no se ha guardado nada.');
  console.error('Si falla la lectura de las vistas con 401, el secreto no es el "Legacy JWT Secret"');
  console.error('o el proyecto ya no acepta llaves firmadas con él.');
  process.exit(1);
}

guardarDevVars(llave);
console.log('Pasa las pruebas. Guardada en .dev.vars como SUPABASE_PORTAL_KEY.');
console.log('');
console.log('Ahora, en Cloudflare → Workers & Pages → plan-operativo-nq → Settings →');
console.log('Variables and Secrets → Add (Production), tipo Secret, nombre SUPABASE_PORTAL_KEY,');
console.log('y este valor:');
console.log('');
console.log(llave);
console.log('');
