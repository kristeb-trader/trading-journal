/**
 * Trading Journal — Telegram Bot
 * Cloudflare Worker + KV para registro de sesiones diarias
 *
 * Variables de entorno requeridas (Cloudflare Dashboard → Worker → Settings → Variables):
 *   BOT_TOKEN             — Token del bot de @BotFather
 *   SUPABASE_URL          — https://jothoslozctflfrnysrx.supabase.co
 *   SUPABASE_SERVICE_ROLE — service_role key de Supabase (ignora RLS; secreto
 *                           server-side, NUNCA en el JS público). Necesaria desde
 *                           que RLS está activado (Fase 2 del plan de seguridad).
 *   ALLOWED_CHAT_ID       — Tu chat ID de Telegram (obtener con @userinfobot)
 *
 * KV Namespace requerido:
 *   KV — binding "KV" en wrangler.toml
 */

// ── Constantes del flujo ────────────────────────────────────────────────────
const STEPS = {
  OPERO:        'opero',
  SE_CONECTO:   'se_conecto',
  MOTIVO:       'motivo',
  // Premercado: los niveles de precio los pone el indicador; el bot solo lo cualitativo
  PRE_SOPORTES: 'pre_soportes',
  PRE_RESIST:   'pre_resist',
  PRE_NOTICIAS: 'pre_noticias',
  // Resto del flujo operativo: setup → análisis, y se guarda.
  // Ya no se preguntan (27/10/2026) la emoción al llegar, la confianza, el contexto, la
  // corrida, las zonas en contra ni la emoción al cierre; las velas, desde el 23/10.
  // VELAS y EMOCION_FIN se quedan solo por si quedó un estado a medias en KV.
  VELAS:        'velas',
  SETUP:        'setup',
  REFLEXION:    'reflexion',
  EMOCION_FIN:  'emocion_fin',
};

// Parsea un número (acepta coma decimal). Devuelve null si no es válido o es /skip.
function parseNum(text) {
  const t = (text || '').trim().toLowerCase();
  if (!t || t === '/skip' || t === 'skip' || t === '-') return null;
  const n = parseFloat(t.replace(',', '.'));
  return isNaN(n) ? NaN : n;  // NaN => entrada inválida (re-preguntar)
}

// Escapa < > & para insertar texto (títulos de reglas, notas del usuario) en
// mensajes con parse_mode 'HTML'. Sin esto, un título con esos caracteres hace
// que Telegram rechace el mensaje (400) y el flujo se queda pegado.
function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

// Fallback si no se puede leer `catalogo_setup_variantes` (sin red / error).
// La lista viva está en BD: los setups nuevos aparecen aquí sin tocar el bot.
const SETUPS_FALLBACK = [
  { codigo: 'continuacion_alcista', nombre: 'Continuación Alcista' },
  { codigo: 'continuacion_bajista', nombre: 'Continuación Bajista' },
  { codigo: 'reingreso_alcista',    nombre: 'Reingreso Alcista' },
  { codigo: 'reingreso_bajista',    nombre: 'Reingreso Bajista' },
];

// (El checklist ya no se llena en el bot: se marca en el Diario del Journal. El AddOn
// ChecklistChaumer de NinjaTrader que lo hacía está archivado desde el 19/10/2026, D-040.)

// ── Helpers de Telegram API ─────────────────────────────────────────────────
async function tg(token, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let desc = '';
    try { desc = (await res.clone().json()).description || ''; } catch {}
    console.error(`[tg] ${method} falló ${res.status}: ${desc}`);
  }
  return res;
}

const sendMessage = (token, chatId, text, replyMarkup) =>
  tg(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...(replyMarkup && { reply_markup: replyMarkup }),
  });

const editMessage = (token, chatId, msgId, text, replyMarkup) =>
  tg(token, 'editMessageText', {
    chat_id: chatId,
    message_id: msgId,
    text,
    parse_mode: 'HTML',
    ...(replyMarkup && { reply_markup: replyMarkup }),
  });

const answerCbq = (token, id) =>
  tg(token, 'answerCallbackQuery', { callback_query_id: id });

// ── KV helpers ──────────────────────────────────────────────────────────────
const getState  = (kv, id) => kv.get(`s:${id}`, 'json');
// 12 h: desde oct 2026 el registro arranca SOLO al cerrar el trade (≈9:30 Col.) y
// se contesta cuando se puede, a veces por la tarde. Con 1 h caducaba a mitad.
const saveState = (kv, id, state) => kv.put(`s:${id}`, JSON.stringify(state), { expirationTtl: 12 * 3600 });
const delState  = (kv, id) => kv.delete(`s:${id}`);

// (La emoción al llegar y al cierre y la confianza en la entrada ya no se preguntan,
// 27/10/2026: casi no variaban o repetían el resultado. Lo psicológico va en los errores
// del diagnóstico —Duda, Miedo, Afán—, que se anotan cuando pasan.)

const PREGUNTA_SETUP = '📐 <b>Setup</b>\n\n¿Qué setup operaste?';

// ── Disciplina: ¿tu trade cumplía las reglas? (10/11/2026, D-052) ──────────────
// El juicio de cada trade lo calcula la cadena (medir.py) dentro de `motor_fichas`. El bot lo
// manda UNA vez por día (`sesiones.disciplina_avisada_at`) y SOLO si el día está registrado: es
// el candado del motor (D-026), lo que marcó no se ve antes de que Kris escriba su lectura.
// Dos caminos: al cerrar el registro, si la ficha ya está; o cuando la cadena mide y llama a
// `/disciplina`, si el registro llegó antes. Diseño: docs/disenos/2026-11-10-disciplina-reglas.md.
const AVISO_DISCIPLINA_DESDE = '2026-11-10';   // los días anteriores no se avisan de golpe
const sbFetch = (env, ruta, init = {}) => fetch(`${env.SUPABASE_URL}/rest/v1/${ruta}`, {
  ...init,
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}`,
    'Content-Type': 'application/json', ...(init.headers || {}),
  },
});
const diaMes = f => `${f.slice(8, 10)}/${f.slice(5, 7)}`;

// Manda «🎯 Disciplina» del día si toca. Devuelve por qué no, o 'enviado'.
async function avisarDisciplina(fecha, env) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '') || fecha < AVISO_DISCIPLINA_DESDE) return 'fuera de fecha';
  const leer = async ruta => { const r = await sbFetch(env, ruta); return r.ok ? r.json() : []; };
  const [ses, fichas, trades] = await Promise.all([
    leer(`sesiones?sesion_date=eq.${fecha}&select=registrada_at,disciplina_avisada_at,setup,no_opero,se_conecto`),
    leer(`motor_fichas?fecha=eq.${fecha}&select=estado,operacion:ficha->operacion,tu:ficha->tu_operacion`),
    leer(`trades?trade_date=eq.${fecha}&select=entry_time`),
  ]);
  const s = ses[0], m = fichas[0];
  if (!s || !s.registrada_at) return 'sin registrar';
  if (s.disciplina_avisada_at) return 'ya avisado';
  let lineas, rota;
  if (!trades.length) {
    // Sin trade también se juzga (18/11/2026): ¿el plan, con sus límites, daba una operación? Sin conexión, nada.
    if (s.no_opero && s.se_conecto === false) return 'sin conexión';
    const st = m && m.estado === 'ok' && m.tu && m.tu.sin_trade;
    if (!st) return 'sin juicio';
    const p = st.operacion;
    rota = !!p;
    lineas = [p
      ? `❌ No operaste, pero el plan daba <b>${escHtml(`${p.setup} ${p.sentido} a las ${p.hora}`)}</b>: setup válido no tomado.`
      : '✅ No operaste y el plan no daba ninguna operación: <b>no operar era lo correcto</b>.'];
  } else {
    const ops = ((m && m.tu && m.tu.operaciones) || []).filter(op => op.juicio);
    if (!m || m.estado !== 'ok' || ops.length < trades.length) return 'sin juicio';
    // Solo las reglas de SU entrada (12/11/2026, D-053): nada de lo que hizo el bot.
    const quien = op => [s.setup, op.hora].filter(Boolean).join(' ');
    lineas = ops.map(op => op.juicio.cumple
      ? `✅ ${escHtml(quien(op))} — <b>dentro de las reglas</b>.`
      : `❌ ${escHtml(quien(op))} — <b>${escHtml(op.juicio.texto)}</b>.`);
    rota = ops.some(op => !op.juicio.cumple);
  }

  await sendMessage(env.BOT_TOKEN, env.ALLOWED_CHAT_ID,
    `🎯 <b>Disciplina · ${diaMes(fecha)}</b>\n${lineas.join('\n')}`,
    rota ? { inline_keyboard: [[{ text: '🤔 No estoy de acuerdo', callback_data: `discno_${fecha}` }]] } : undefined);
  await sbFetch(env, `sesiones?sesion_date=eq.${fecha}`, {
    method: 'PATCH', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ disciplina_avisada_at: new Date().toISOString() }),
  });
  return 'enviado';
}

// La cadena (subir_dia.py) avisa tras medir: { fechas: [...] }. Se autentica con la service_role,
// que ya tienen los dos: así no hace falta otro secreto en el repositorio público. No se compara
// con la del bot letra a letra: la del PC y la del bot pueden ser dos claves de servicio distintas
// (la nueva `sb_secret_…` y la antigua), y las dos valen. Se le pregunta a Supabase: una clave que
// lee `sesiones` sin usuario es de servicio (la pública, `anon`, no ve nada: RLS sin políticas).
// → '' si vale, o el motivo (sin nada secreto) para el 403.
async function esClaveDeServicio(clave, env) {
  if (!clave) return 'sin clave';
  if (clave === env.SUPABASE_SERVICE_ROLE) return '';
  try {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/sesiones?select=sesion_date&limit=1`,
      { headers: { apikey: clave, Authorization: `Bearer ${clave}` } });
    if (!r.ok) return `supabase ${r.status}`;
    return (await r.json()).length > 0 ? '' : 'no es de servicio';
  } catch (e) { return 'sin respuesta de supabase'; }
}

async function handleDisciplina(request, env) {
  const clave = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const motivo = await esClaveDeServicio(clave, env);
  if (motivo) return new Response(`Unauthorized (${motivo})`, { status: 403 });
  const { fechas = [] } = await request.json().catch(() => ({}));
  const res = {};
  for (const f of fechas.slice(0, 10)) res[f] = await avisarDisciplina(f, env);
  return new Response(JSON.stringify(res), { headers: { 'Content-Type': 'application/json' } });
}

// «No estoy de acuerdo»: abre (o reabre) la discusión del día con la frase de Kris.
async function abrirDiscusion(fecha, nota, env) {
  const r = await sbFetch(env, 'disciplina_discusiones?on_conflict=fecha', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ fecha, nota: nota || null, estado: 'abierta', cerrada_at: null }),
  });
  return r.ok;
}

// ── Setup keyboard ──────────────────────────────────────────────────────────
// Las variantes se leen de BD (activas, en orden). El callback lleva el CÓDIGO,
// no el índice: si la lista cambia entre que se muestra el teclado y se pulsa,
// un índice apuntaría al setup equivocado.
async function fetchSetups(env) {
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/catalogo_setup_variantes?activo=eq.true&order=orden.asc&select=codigo,nombre`,
      { headers: { apikey: env.SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}` } }
    );
    if (!res.ok) return SETUPS_FALLBACK;
    const data = await res.json();
    return Array.isArray(data) && data.length ? data : SETUPS_FALLBACK;
  } catch { return SETUPS_FALLBACK; }
}

function setupKeyboard(setups) {
  const rows = [];
  for (let i = 0; i < setups.length; i += 2) {
    const row = [{ text: setups[i].nombre, callback_data: `setup_${setups[i].codigo}` }];
    if (setups[i + 1]) row.push({ text: setups[i + 1].nombre, callback_data: `setup_${setups[i + 1].codigo}` });
    rows.push(row);
  }
  return { inline_keyboard: rows };
}

// ── Resumen completo de la sesión ───────────────────────────────────────────
// Una línea (25/11/2026): el resumen largo repetía el análisis que Kris acababa de escribir.
function buildResumen(data) {
  const que = data.no_opero ? 'sin operación' : escHtml(data.setup || 'sin setup');
  return `✅ <b>Guardado</b> · ${diaMes(data.sesion_date)} · ${que}`;
}

// ── Supabase upsert de sesión ────────────────────────────────────────────────
async function saveSession(data, env) {
  // El checklist NO lo maneja el bot: vive en `sesion_checklist` y se marca en el Diario.
  // Como el upsert es merge-duplicates, al no enviar `checklist` ni las columnas `chk_*`
  // se conserva lo que ya hubiera.
  const payload = {
    sesion_date:       data.sesion_date,
    no_opero:          data.no_opero         ?? false,
    motivo_no_opero:   data.motivo_no_opero   ?? null,
    puntos_retroceso:  data.puntos_retroceso  ?? null,
    setup:             data.setup             ?? null,
    setup_codigo:      data.setup_codigo      ?? null,
    analisis_trader:       data.analisis_trader       ?? null,
    // Ni `estado_emocional_id` ni `nivel_confianza` (27/10/2026): ya no se preguntan, y
    // mandarlos en null borraría lo que se registró en días anteriores.
    // Premercado / contexto técnico
    // OJO: NO se incluyen los niveles de precio (cierre/apertura, OHLC de ayer ni
    // overnight precio_max_pre/min_pre) — los escribe el indicador
    // SupabaseDailyLevels. Mandarlos aquí (en null) los borraría.
    se_conecto:            data.se_conecto            ?? true,
    // OJO: NO se incluyen soportes_naranja / resistencias_naranja: ya no los escribe nadie
    // (5 oct), pero los de días viejos siguen ahí. Mandarlos (en []) los BORRARIA,
    // exactamente igual que pasaria con los niveles de precio.
    noticias:              data.noticias              ?? null,
    // Registrar el día abre el candado de la ficha del motor (fase 7). Un trigger
    // congela la primera registrada_at; diario_editado_at se mueve en cada guardado.
    registrada_at:         new Date().toISOString(),
    diario_editado_at:     new Date().toISOString(),
  };

  // on_conflict=sesion_date → upsert resuelto por la restricción única de fecha
  // (no por la PK id). Si el indicador SupabaseDailyLevels ya creó la fila del día,
  // hace UPDATE de las columnas enviadas y conserva las de precio (que no se mandan).
  const post = body => fetch(`${env.SUPABASE_URL}/rest/v1/sesiones?on_conflict=sesion_date`, {
    method: 'POST',
    headers: {
      apikey:          env.SUPABASE_SERVICE_ROLE,
      Authorization:   `Bearer ${env.SUPABASE_SERVICE_ROLE}`,
      'Content-Type':  'application/json',
      Prefer:          'resolution=merge-duplicates',
    },
    body: JSON.stringify(body),
  });

  try {
    const res = await post(payload);
    if (res.ok) return { ok: true };
    const body = await res.text();
    return { ok: false, status: res.status, error: (body || '').slice(0, 300) };
  } catch (e) {
    return { ok: false, status: 0, error: String((e && e.message) || e) };
  }
}

// ── Stats desde Supabase ────────────────────────────────────────────────────
async function fetchMonthStats(env) {
  try {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: env.TIMEZONE || 'America/Bogota',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const from = today.slice(0, 7) + '-01';

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/trades?trade_date=gte.${from}&select=trade_date,profit,resultado`,
      { headers: { apikey: env.SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}` } }
    );
    if (!res.ok) return { error: `Supabase error ${res.status}` };
    const trades = await res.json();

    const totalTrades = trades.length;
    const targets = trades.filter(t => t.resultado === 'target').length;
    const stops   = trades.filter(t => t.resultado === 'stop').length;
    const netPnl  = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
    const winRate = totalTrades > 0 ? (targets / totalTrades * 100).toFixed(1) : 0;

    const grossWin  = trades.filter(t => (parseFloat(t.profit) || 0) > 0).reduce((s, t) => s + parseFloat(t.profit), 0);
    const grossLoss = Math.abs(trades.filter(t => (parseFloat(t.profit) || 0) < 0).reduce((s, t) => s + parseFloat(t.profit), 0));
    const pf = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : '—';

    const byDate = {};
    trades.forEach(t => {
      if (!t.trade_date) return;
      byDate[t.trade_date] = (byDate[t.trade_date] || 0) + (parseFloat(t.profit) || 0);
    });
    const dates = Object.keys(byDate).sort();
    let streak = 0, streakType = 'none';
    if (dates.length > 0) {
      const results = dates.map(d => byDate[d] >= 0 ? 'win' : 'loss');
      streakType = results[results.length - 1];
      for (let i = results.length - 1; i >= 0; i--) {
        if (results[i] === streakType) streak++;
        else break;
      }
    }

    return { totalTrades, targets, stops, netPnl, winRate, pf, streak, streakType, from };
  } catch (e) {
    return { error: e.message };
  }
}

// ── Iniciar flujo de sesión ─────────────────────────────────────────────────
const hoyBogota = env => new Intl.DateTimeFormat('en-CA', {
  timeZone: env.TIMEZONE || 'America/Bogota',
  year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

async function startSesionFlow(chatId, token, kv, env) {
  const today = hoyBogota(env);
  const state = { step: STEPS.OPERO, data: { sesion_date: today } };
  await saveState(kv, chatId, state);

  await sendMessage(token, chatId,
    `📅 <b>Registro de sesión — ${today}</b>\n\n¿Operaste hoy?`,
    { inline_keyboard: [[
      { text: '✅ Sí, operé',  callback_data: 'opero_si' },
      { text: '❌ No operé',   callback_data: 'opero_no' },
    ]] }
  );
}

// ── El trade, la foto y el setup (25/11/2026) ───────────────────────────────
// Antes: «🔔 Trade cerrado» al cerrar y, aparte, «¿Qué setup operaste?» con 4 botones. Ahora el trade se
// GUARDA (KV `t:<fecha>`) y la pregunta llega con la foto de la operación que hace FotoChaumer 3 minutos
// después (`/foto`): el trade en el pie, y solo 2 botones, Continuación o Reingreso, porque la dirección
// sale del trade (Long → alcista, Short → bajista). Si la foto no llega en 8 minutos (FotoChaumer
// apagado o sin red), el cron pregunta igual, sin foto. Lo que el motor vio no se usa: el setup sigue
// siendo la lectura de Kris (y el candado, D-026).
const ESPERA_FOTO_MS = 8 * 60 * 1000;

async function tradesDelDia(env, fecha) {
  return (await env.KV.get(`t:${fecha}`, 'json')) || [];
}

// 'alcista' / 'bajista' si todos los trades del día van en la misma dirección; si no, null (4 botones).
async function direccionDelDia(env, fecha) {
  let lados = (await tradesDelDia(env, fecha)).map(t => t.market_pos);
  if (!lados.length) {
    try {
      const r = await sbFetch(env, `trades?trade_date=eq.${fecha}&select=market_pos`);
      if (r.ok) lados = (await r.json()).map(t => t.market_pos);
    } catch { /* sin red: 4 botones */ }
  }
  const u = [...new Set(lados.filter(Boolean))];
  return u.length === 1 ? (u[0] === 'Long' ? 'alcista' : u[0] === 'Short' ? 'bajista' : null) : null;
}

function familiaKeyboard() {
  return { inline_keyboard: [[
    { text: 'Continuación', callback_data: 'fam_continuacion' },
    { text: 'Reingreso',    callback_data: 'fam_reingreso' },
  ]] };
}

// La pregunta del setup: 2 botones si se sabe la dirección, los 4 de siempre si no.
async function preguntaSetup(env, fecha) {
  const dir = await direccionDelDia(env, fecha);
  return dir
    ? { dir, texto: `📐 <b>Setup ${dir}</b>\n\n¿Continuación o Reingreso?`, teclado: familiaKeyboard() }
    : { dir: null, texto: PREGUNTA_SETUP, teclado: setupKeyboard(await fetchSetups(env)) };
}

// El pie de la foto: los trades del día, en una línea cada uno.
function lineasTrades(trades) {
  return trades.map(t => {
    const ins  = (t.instrument || '').split(' ')[0];
    const dir  = t.market_pos === 'Long' ? '🟢 Long' : '🔴 Short';
    const res  = t.resultado === 'target' ? '✅ Target' : t.resultado === 'stop' ? '🔴 Stop' : '⚫ Otro';
    const p    = parseFloat(t.profit) || 0;
    return `${ins} ${dir} · ${t.qty} ct · <b>${p >= 0 ? '+' : '−'}$${Math.abs(p).toFixed(2)}</b> ${res}`;
  }).join('\n');
}

// ¿Se puede arrancar el registro de hoy? No si ya hay uno a medias o el día ya está registrado
// (`registrada_at`, la pone el primer guardado del bot o de la web).
async function puedePreguntar(env, chatId, fecha) {
  const enCurso = await getState(env.KV, chatId);
  if (enCurso && enCurso.data && enCurso.data.sesion_date === fecha) return false;
  try {
    const r = await sbFetch(env, `sesiones?sesion_date=eq.${fecha}&select=registrada_at`);
    if (r.ok) { const f = await r.json(); if (f[0] && f[0].registrada_at) return false; }
  } catch { /* sin red: mejor preguntar de más que dejar el día sin registrar */ }
  return true;
}

// Arranca el registro: la pregunta del setup con el trade, con la foto si la hay.
async function preguntarTrasTrade(env, fecha, png) {
  const chatId = env.ALLOWED_CHAT_ID;
  await env.KV.delete(`p:${fecha}`);
  if (!chatId || !(await puedePreguntar(env, chatId, fecha))) return 'no toca';
  const trades = await tradesDelDia(env, fecha);
  const q = await preguntaSetup(env, fecha);
  const texto = `🔔 <b>Trade cerrado · ${diaMes(fecha)}</b>\n${lineasTrades(trades)}\n\n${q.texto}`;
  let ok = false;
  if (png) {
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('caption', texto);
    form.append('parse_mode', 'HTML');
    form.append('reply_markup', JSON.stringify(q.teclado));
    form.append('photo', new Blob([png], { type: 'image/png' }), `${fecha}.png`);
    const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: 'POST', body: form });
    ok = r.ok;
    if (!ok) console.error('[foto] sendPhoto', r.status, await r.text());
  }
  if (!ok) await sendMessage(env.BOT_TOKEN, chatId, texto, q.teclado);
  await saveState(env.KV, chatId, {
    step: STEPS.SETUP,
    data: { sesion_date: fecha, no_opero: false, se_conecto: true, _dir: q.dir },
  });
  return ok ? 'con foto' : 'sin foto';
}

// Cierre del registro: guarda la sesión y deja el resumen. Con `msgId` lo escribe en
// el mismo mensaje del teclado (un botón viejo de «¿Cómo terminaste?»); sin él, en un
// mensaje nuevo (el análisis, que es texto, cierra el registro desde el 27/10/2026).
async function cerrarSesion(state, chatId, msgId, env) {
  const token = env.BOT_TOKEN;
  const decir = text => msgId ? editMessage(token, chatId, msgId, text) : sendMessage(token, chatId, text);
  const r = await saveSession(state.data, env);
  if (!r.ok) {
    // El estado se conserva: puede reintentar.
    await decir(
      `⚠️ <b>Error al guardar (HTTP ${r.status})</b>\n<code>${(r.error || 'sin detalle').replace(/[<>]/g, '')}</code>\n\nReintenta con /sesion.`
    );
    return;
  }
  await delState(env.KV, chatId);
  await decir(buildResumen(state.data));
  // Con el día registrado, el juicio del motor (si la ficha ya está; si no, avisa la cadena).
  try { await avisarDisciplina(state.data.sesion_date, env); } catch (e) { console.error('[disciplina]', e); }
}

// ── Handlers principales ────────────────────────────────────────────────────
async function handleCommand(msg, env) {
  const chatId = String(msg.chat.id);
  const token  = env.BOT_TOKEN;

  if (msg.text === '/sesion') {
    await startSesionFlow(chatId, token, env.KV, env);
    return;
  }

  if (msg.text === '/stats') {
    const s = await fetchMonthStats(env);
    if (!s || s.error) {
      await sendMessage(token, chatId, `⚠️ Error al consultar estadísticas: ${s?.error || 'desconocido'}`);
      return;
    }
    const pnlSign  = s.netPnl >= 0 ? '+' : '';
    const pnlEmoji = s.netPnl >= 0 ? '📈' : '📉';
    const streakEmoji = s.streakType === 'win' ? '🟢' : s.streakType === 'loss' ? '🔴' : '—';
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const month = MESES[parseInt(s.from.slice(5, 7)) - 1];
    await sendMessage(token, chatId,
      `📊 <b>Stats — ${month}</b>\n\n` +
      `${pnlEmoji} <b>P&amp;L Neto:</b> ${pnlSign}$${s.netPnl.toFixed(2)}\n` +
      `🎯 <b>Win Rate:</b> ${s.winRate}%\n` +
      `📋 <b>Trades:</b> ${s.totalTrades} (${s.targets}✅ / ${s.stops}❌)\n` +
      `⚡ <b>Profit Factor:</b> ${s.pf}\n` +
      `🔥 <b>Racha:</b> ${s.streak > 0 ? `${s.streak} ${streakEmoji}` : '—'}`
    );
    return;
  }

  if (msg.text === '/cancelar') {
    await delState(env.KV, chatId);
    await sendMessage(token, chatId, '🚫 Registro cancelado.');
    return;
  }
}

async function handleCallback(cbq, env) {
  const chatId = String(cbq.message.chat.id);
  const msgId  = cbq.message.message_id;
  const action = cbq.data;
  const token  = env.BOT_TOKEN;

  await answerCbq(token, cbq.id);

  // ── Botón "Registrar sesión" de los avisos de trade ANTERIORES a oct 2026 ──
  // Los avisos nuevos ya no lo llevan; se conserva para los que quedan en el chat.
  if (action === 'iniciar_sesion') {
    await startSesionFlow(chatId, token, env.KV, env);
    return;
  }

  // «🤔 No estoy de acuerdo» del aviso de disciplina: pide la frase. Va en su propia clave del
  // KV (d:) para no pisar un registro a medias.
  if (action.startsWith('discno_')) {
    const fecha = action.slice(7);
    await env.KV.put(`d:${chatId}`, fecha, { expirationTtl: 12 * 3600 });
    await sendMessage(token, chatId,
      `🤔 <b>No estás de acuerdo con el ${diaMes(fecha)}</b>\n\nEscribe en una frase qué vio mal el motor (o /skip para abrirla sin nota):`);
    return;
  }

  const state = await getState(env.KV, chatId);
  if (!state) {
    await sendMessage(token, chatId, '⏱ Sesión expirada. Usa /sesion para empezar.');
    return;
  }

  // ── Setup seleccionado → directo al análisis ──────────────────────────────
  // El checklist ya NO se llena en el bot (se marca en el Diario del Journal).
  // `fam_continuacion` / `fam_reingreso` (25/11/2026): la familia, con la dirección del trade del día.
  if (action.startsWith('setup_') || action.startsWith('fam_')) {
    const codigo = action.startsWith('fam_')
      ? `${action.slice(4)}_${state.data._dir || ''}`
      : action.slice(6);
    const setups = await fetchSetups(env);
    const elegido = setups.find(s => s.codigo === codigo);
    // Se guarda el CÓDIGO: el trigger fn_sync_setup_codigo rellena el nombre en
    // `sesiones.setup`, así el bot no depende de que los textos coincidan.
    state.data.setup_codigo = codigo;
    state.data.setup = elegido ? elegido.nombre : null;
    state.step = STEPS.REFLEXION;
    await saveState(env.KV, chatId, state);
    const pide = `📐 Setup: <b>${escHtml(state.data.setup || codigo)}</b>\n\n` +
                 `✍️ <b>Análisis del día</b>\n\nEscribe tu análisis y reflexión de la sesión:`;
    if (cbq.message.photo) {
      // El mensaje de la foto no se puede convertir en texto: se le quitan los botones y se pide aparte.
      await tg(token, 'editMessageReplyMarkup', { chat_id: chatId, message_id: msgId, reply_markup: { inline_keyboard: [] } });
      await sendMessage(token, chatId, pide);
    } else {
      await editMessage(token, chatId, msgId, pide);
    }
    return;
  }

  // ── «¿Cómo terminaste?» de un registro a medias de antes del 27/10/2026 ───
  // Ya no se pregunta: el botón guarda la sesión sin el estado al cierre.
  if (action.startsWith('emofin_')) {
    if (state.step !== STEPS.EMOCION_FIN) return;   // botón viejo de otro registro
    await cerrarSesion(state, chatId, msgId, env);
    return;
  }

  // ── Flujo principal ───────────────────────────────────────────────────────
  switch (action) {
    // Las zonas naranjas ya NO se piden aqui (ago 2026): el plan nuevo no las usa.
    case 'opero_si':
      state.data.no_opero = false;
      state.data.se_conecto = true;
      state.step = STEPS.SETUP;
      {
        const q = await preguntaSetup(env, state.data.sesion_date);   // 2 botones si ya hay trade de hoy
        state.data._dir = q.dir;
        await saveState(env.KV, chatId, state);
        await editMessage(token, chatId, msgId, q.texto, q.teclado);
      }
      break;

    case 'opero_no':
      state.data.no_opero = true;
      state.step = STEPS.SE_CONECTO;
      await saveState(env.KV, chatId, state);
      await editMessage(token, chatId, msgId,
        '🔌 <b>¿Te conectaste a analizar el día?</b>\n\n(aunque no hayas tomado ningún trade)',
        { inline_keyboard: [[
          { text: '✅ Sí, analicé', callback_data: 'conecto_si' },
          { text: '❌ No me conecté', callback_data: 'conecto_no' },
        ]] }
      );
      break;

    case 'conecto_si':
      state.data.se_conecto = true;
      state.step = STEPS.REFLEXION;
      await saveState(env.KV, chatId, state);
      await editMessage(token, chatId, msgId, '✍️ <b>Análisis del día</b>\n\nEscribe tu análisis de la sesión (no hubo setup válido):');
      break;

    case 'conecto_no':
      state.data.se_conecto = false;
      state.step = STEPS.MOTIVO;
      await saveState(env.KV, chatId, state);
      await editMessage(token, chatId, msgId, '📝 ¿Cuál fue el motivo para no conectarte hoy?');
      break;

    default:
      // Teclados de preguntas que ya no se hacen (27/10/2026): la emoción al llegar, la
      // confianza, el contexto de mercado (el sesgo que el plan no usa, D-035), la corrida y
      // las zonas en contra (las comprueba el motor). Se quedan SOLO por si quedó en el chat
      // uno de un registro a medias: avanzan al setup sin guardar nada.
      if (/^(emoc|conf|ctx|cor|zonas)_/.test(action)) {
        state.step = STEPS.SETUP;
        await saveState(env.KV, chatId, state);
        await editMessage(token, chatId, msgId, PREGUNTA_SETUP, setupKeyboard(await fetchSetups(env)));
      }
  }
}

async function handleText(msg, env) {
  const chatId = String(msg.chat.id);
  const text   = msg.text.trim();
  const token  = env.BOT_TOKEN;

  // Permitir /skip dentro del flujo; ignorar el resto de comandos
  if (text.startsWith('/') && text.toLowerCase() !== '/skip') return;

  // La frase de «No estoy de acuerdo» (la pidió el botón del aviso de disciplina).
  const discFecha = await env.KV.get(`d:${chatId}`);
  if (discFecha) {
    await env.KV.delete(`d:${chatId}`);
    const ok = await abrirDiscusion(discFecha, text.toLowerCase() === '/skip' ? null : text, env);
    await sendMessage(token, chatId, ok
      ? `🔵 <b>Discusión abierta · ${diaMes(discFecha)}</b>\nEse día no cuenta en la disciplina hasta que la cierres en el Journal (Otros → Disciplina).`
      : '⚠️ No se pudo guardar la discusión. Ábrela desde el visor del día en el Journal.');
    return;
  }

  const state = await getState(env.KV, chatId);
  if (!state) return;

  switch (state.step) {

    case STEPS.MOTIVO: {
      state.data.motivo_no_opero = text;
      const r = await saveSession(state.data, env);
      await delState(env.KV, chatId);
      await sendMessage(token, chatId,
        r.ok
          ? `✅ <b>Sesión guardada</b>\n\n📅 ${state.data.sesion_date}\n❌ Sin operación — ${text}`
          : `⚠️ <b>Error al guardar (HTTP ${r.status})</b>\n<code>${(r.error || 'sin detalle').replace(/[<>]/g, '')}</code>\n\nReintenta con /sesion.`
      );
      break;
    }

    // ── Premercado (flujo viejo) ──
    // El bot ya NO pregunta zonas naranjas ni noticias: las noticias se guardan en el
    // Diario del Journal («Guardar noticias», D-040). Estos 3 pasos se
    // conservan SOLO por si quedo un estado a medias en KV: no preguntan nada,
    // solo dejan avanzar para que la sesion se pueda cerrar.
    case STEPS.PRE_SOPORTES:
    case STEPS.PRE_RESIST:
    case STEPS.PRE_NOTICIAS: {
      if (state.data.no_opero) {
        state.step = STEPS.REFLEXION;
        await saveState(env.KV, chatId, state);
        await sendMessage(token, chatId, '✍️ <b>Análisis del día</b>\n\nEscribe tu análisis de la sesión (no hubo setup válido):');
      } else {
        state.step = STEPS.SETUP;
        await saveState(env.KV, chatId, state);
        await sendMessage(token, chatId, PREGUNTA_SETUP, setupKeyboard(await fetchSetups(env)));
      }
      break;
    }

    // Ya no se llega aquí (23/10/2026, las velas no se preguntan). Se conserva SOLO
    // por si quedó un estado a medias en KV, para que la sesión se pueda cerrar: no
    // guarda el número, pasa al setup.
    case STEPS.VELAS: {
      const n = parseInt(text);
      if (isNaN(n) || n < 1 || n > 20) {
        await sendMessage(token, chatId, '⚠️ Ingresa un número entre 1 y 20.');
        return;
      }
      state.step = STEPS.SETUP;
      await saveState(env.KV, chatId, state);
      await sendMessage(token, chatId, PREGUNTA_SETUP, setupKeyboard(await fetchSetups(env)));
      break;
    }

    // El análisis cierra el registro (27/10/2026: ya no se pregunta «¿Cómo terminaste?»).
    case STEPS.REFLEXION:
      state.data.analisis_trader = text;
      await cerrarSesion(state, chatId, null, env);
      break;
  }
}

// ── Notificación de trade desde NinjaTrader ─────────────────────────────────
async function handleNotify(request, env) {
  const token = request.headers.get('X-Notify-Token');
  if (!token || token !== env.NOTIFY_SECRET) {
    return new Response('Unauthorized', { status: 403 });
  }

  // Ya no se manda nada aquí (25/11/2026): el trade se guarda y sale en el pie de la foto (`/foto`),
  // o en la pregunta sin foto si a los 8 minutos no ha llegado (el cron).
  const t = await request.json();
  const fecha = hoyBogota(env);
  const trades = await tradesDelDia(env, fecha);
  trades.push({ instrument: t.instrument, market_pos: t.market_pos, qty: t.qty, profit: t.profit, resultado: t.resultado });
  await env.KV.put(`t:${fecha}`, JSON.stringify(trades), { expirationTtl: 36 * 3600 });
  await env.KV.put(`p:${fecha}`, String(Date.now()), { expirationTtl: 36 * 3600 });
  return new Response('OK');
}

// La foto de FotoChaumer (automática, tras cerrar): { fecha, png: base64 }. Con el mismo secreto que /notify.
async function handleFoto(request, env) {
  const token = request.headers.get('X-Notify-Token');
  if (!token || token !== env.NOTIFY_SECRET) return new Response('Unauthorized', { status: 403 });
  const { fecha, png } = await request.json().catch(() => ({}));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) return new Response('fecha', { status: 400 });
  if (!(await env.KV.get(`p:${fecha}`))) return new Response('sin trade pendiente');
  const bytes = png ? Uint8Array.from(atob(png), c => c.charCodeAt(0)) : null;
  return new Response(await preguntarTrasTrade(env, fecha, bytes));
}

// Cada 5 minutos: si un trade lleva 8 minutos sin foto, se pregunta igual (sin foto).
async function vigilarPendientes(env) {
  const fecha = hoyBogota(env);
  const p = await env.KV.get(`p:${fecha}`);
  if (p && Date.now() - Number(p) >= ESPERA_FOTO_MS) await preguntarTrasTrade(env, fecha, null);
}

// ── Entry point ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('OK');

    const url = new URL(request.url);
    if (url.pathname === '/notify') return handleNotify(request, env);
    if (url.pathname === '/disciplina') return handleDisciplina(request, env);
    if (url.pathname === '/foto') return handleFoto(request, env);

    try {
      const update = await request.json();
      const chatId = String(
        update.message?.chat.id ?? update.callback_query?.message.chat.id ?? ''
      );

      if (env.ALLOWED_CHAT_ID && chatId !== env.ALLOWED_CHAT_ID) {
        return new Response('OK');
      }

      if (update.message?.text) {
        const txt = update.message.text.trim();
        // /skip es entrada del flujo (omitir paso), no un comando
        if (txt.startsWith('/') && txt.toLowerCase() !== '/skip') {
          await handleCommand(update.message, env);
        } else {
          await handleText(update.message, env);
        }
      } else if (update.callback_query) {
        await handleCallback(update.callback_query, env);
      }
    } catch (e) {
      console.error(e);
    }

    return new Response('OK');
  },

  // El cron de wrangler.toml: la pregunta del setup sin foto si FotoChaumer no la mandó.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(vigilarPendientes(env));
  },
};
