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
  // Resto del flujo operativo
  EMOCION:      'emocion',
  CONFIANZA:    'confianza',
  CONTEXTO:     'contexto',
  CORRIDA:      'corrida',
  VELAS:        'velas',
  ZONAS_CONTRA: 'zonas_contra',
  SETUP:        'setup',
  CHECKLIST:    'checklist',
  REFLEXION:    'reflexion',
};

// Parsea un número (acepta coma decimal). Devuelve null si no es válido o es /skip.
function parseNum(text) {
  const t = (text || '').trim().toLowerCase();
  if (!t || t === '/skip' || t === 'skip' || t === '-') return null;
  const n = parseFloat(t.replace(',', '.'));
  return isNaN(n) ? NaN : n;  // NaN => entrada inválida (re-preguntar)
}

// Parsea una lista de números separados por coma (líneas naranjas). [] si /skip.
function parseNumList(text) {
  const t = (text || '').trim().toLowerCase();
  if (!t || t === '/skip' || t === 'skip' || t === '-') return [];
  return t.split(/[,;]+/).map(s => parseFloat(s.trim().replace(',', '.'))).filter(n => !isNaN(n));
}

// Escapa < > & para insertar texto (títulos de reglas, notas del usuario) en
// mensajes con parse_mode 'HTML'. Sin esto, un título con esos caracteres hace
// que Telegram rechace el mensaje (400) y el flujo se queda pegado.
function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

const CONTEXTOS = [
  { label: '📈 Alcista fuerte', value: 'Alcista fuerte' },
  { label: '↗ Alcista',         value: 'Alcista'        },
  { label: '↔ Mixto',           value: 'Mixto'          },
  { label: '↘ Bajista',         value: 'Bajista'        },
  { label: '📉 Bajista fuerte', value: 'Bajista fuerte' },
];

const SETUPS = [
  'IRI Apertura Alcista',
  'IRI Apertura Bajista',
  'IRI Continuación Alcista',
  'IRI Continuación Bajista',
  'Reingreso Alcista',
  'Reingreso Bajista',
];

// Checklist por fases — se lee del rulebook `reglas` (es_checklist=true). Fallback
// local si la consulta falla o el catálogo aún no existe (pre-migración).
// Si actualizas el catálogo en la web, esto se refleja solo aquí (sin re-deploy).
const CHECKLIST_FALLBACK = [
  { clave: 'chk_cuenta_pa',   fase: 1, texto: 'Cuenta PA activa verificada'              },
  { clave: 'chk_noticias',    fase: 1, texto: 'Sin noticia roja activa'                  },
  { clave: 'chk_zonas',       fase: 1, texto: 'Zonas vigentes verificadas'               },
  { clave: 'chk_5velas',      fase: 2, texto: 'Máx 5 velas en corrida'                   },
  { clave: 'chk_consecucion', fase: 2, texto: 'Zona con rompimiento + consecución'       },
  { clave: 'chk_estructura',  fase: 2, texto: 'Estructura Impulso-Retroceso-Impulso'     },
  { clave: 'chk_orden',       fase: 3, texto: 'Orden precolocada a tiempo'               },
];

async function fetchChecklistItems(env) {
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/reglas?es_checklist=eq.true&activa=eq.true&order=fase.asc,orden.asc&select=clave:codigo,fase,texto:titulo`,
      { headers: { apikey: env.SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}` } }
    );
    if (!res.ok) return CHECKLIST_FALLBACK;
    const data = await res.json();
    return Array.isArray(data) && data.length ? data : CHECKLIST_FALLBACK;
  } catch { return CHECKLIST_FALLBACK; }
}

// Prompts del flujo de premercado (todos opcionales: /skip para omitir)
const PREMKT_PROMPTS = {
  // Todos los niveles de precio (cierre/apertura, OHLC de ayer y overnight) los
  // calcula el indicador SupabaseDailyLevels; el bot solo pide lo cualitativo.
  pre_soportes: '🟠 <b>Soportes (líneas naranjas)</b>\n\nSepara por comas, ej: <code>30669, 30700</code>\n<i>(o /skip)</i>',
  pre_resist:   '🟠 <b>Resistencias (líneas naranjas)</b>\n\nSepara por comas, ej: <code>30810, 30850</code>\n<i>(o /skip)</i>',
  pre_noticias: '📰 <b>Noticias del día</b>\n\nej: <code>9:00am → ISM Services PMI</code>\n<i>(o /skip)</i>',
};

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
const saveState = (kv, id, state) => kv.put(`s:${id}`, JSON.stringify(state), { expirationTtl: 3600 });
const delState  = (kv, id) => kv.delete(`s:${id}`);

// ── Checklist helpers ───────────────────────────────────────────────────────
function checklistText(data, items = CHECKLIST_FALLBACK) {
  const lines = items.map(
    ({ clave, texto }) => `${data[clave] ? '✅' : '❌'} ${escHtml(texto || clave)}`
  ).join('\n');
  return `<b>📋 Checklist de disciplina</b>\n\n${lines}`;
}

function checklistKeyboard(data, items = CHECKLIST_FALLBACK) {
  // El texto de los botones NO se parsea como HTML (no se escapa), pero sí se
  // recorta y se protege contra vacío para no romper el inline_keyboard.
  const rows = items.map(({ clave, texto }) => [{
    text: `${data[clave] ? '✅' : '❌'} ${(texto || clave || '—')}`.slice(0, 90),
    callback_data: `tog_${clave}`,
  }]);
  rows.push([{ text: '💾 Confirmar checklist', callback_data: 'chk_ok' }]);
  return { inline_keyboard: rows };
}

function scoreChecklist(data, items = CHECKLIST_FALLBACK) {
  return items.filter(({ clave }) => data[clave]).length;
}

// ── Emociones ───────────────────────────────────────────────────────────────
// Fallback local con los IDs REALES del catálogo (catalogo_emociones).
// Se usa si la consulta a Supabase falla o devuelve vacío, para que el paso
// emocional del bot SIEMPRE muestre opciones seleccionables.
// Si actualizas el catálogo en la web, sincroniza esta lista.
const EMOCIONES_FALLBACK = [
  { id: 1,  nombre: 'En zona',       emoji: '🟢' },
  { id: 2,  nombre: 'Tranquilo',     emoji: '😌' },
  { id: 3,  nombre: 'Confiado',      emoji: '💪' },
  { id: 4,  nombre: 'Neutral',       emoji: '😐' },
  { id: 5,  nombre: 'Ansioso',       emoji: '😰' },
  { id: 6,  nombre: 'Presionado',    emoji: '😤' },
  { id: 7,  nombre: 'Cansado',       emoji: '😴' },
  { id: 8,  nombre: 'Sobreconfiado', emoji: '🚫' },
  { id: 9,  nombre: 'Rabia',         emoji: '😤' },
  { id: 10, nombre: 'Con Duda',      emoji: '😕' },
];

async function fetchEmociones(env) {
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/catalogo_emociones?activa=eq.true&order=orden.asc&select=id,nombre,emoji`,
      { headers: { apikey: env.SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}` } }
    );
    if (!res.ok) return EMOCIONES_FALLBACK;
    const data = await res.json();
    return Array.isArray(data) && data.length ? data : EMOCIONES_FALLBACK;
  } catch { return EMOCIONES_FALLBACK; }
}

function emocionKeyboard(emociones) {
  const rows = [];
  for (let i = 0; i < emociones.length; i += 2) {
    const row = [{ text: `${emociones[i].emoji} ${emociones[i].nombre}`, callback_data: `emoc_${emociones[i].id}` }];
    if (emociones[i + 1]) row.push({ text: `${emociones[i + 1].emoji} ${emociones[i + 1].nombre}`, callback_data: `emoc_${emociones[i + 1].id}` });
    rows.push(row);
  }
  rows.push([{ text: '⏭ Omitir', callback_data: 'emoc_skip' }]);
  return { inline_keyboard: rows };
}

const CONFIANZA_KEYBOARD = { inline_keyboard: [[
  { text: '★☆☆☆☆ Muy baja', callback_data: 'conf_1' },
  { text: '★★☆☆☆ Baja',     callback_data: 'conf_2' },
],[
  { text: '★★★☆☆ Normal',   callback_data: 'conf_3' },
  { text: '★★★★☆ Alta',     callback_data: 'conf_4' },
],[
  { text: '★★★★★ Máxima',   callback_data: 'conf_5' },
  { text: '⏭ Omitir',        callback_data: 'conf_skip' },
]]};

// ── Setup keyboard ──────────────────────────────────────────────────────────
function setupKeyboard() {
  const rows = [];
  for (let i = 0; i < SETUPS.length; i += 2) {
    const row = [{ text: SETUPS[i], callback_data: `setup_${i}` }];
    if (SETUPS[i + 1]) row.push({ text: SETUPS[i + 1], callback_data: `setup_${i + 1}` });
    rows.push(row);
  }
  return { inline_keyboard: rows };
}

// Resumen del premercado (solo líneas con dato)
function premktResumen(d) {
  const lines = [];
  if (d.soportes_naranja && d.soportes_naranja.length)         lines.push(`🟠 Soportes: ${d.soportes_naranja.join(', ')}`);
  if (d.resistencias_naranja && d.resistencias_naranja.length) lines.push(`🟠 Resist: ${d.resistencias_naranja.join(', ')}`);
  if (d.noticias) lines.push(`📰 ${escHtml(d.noticias)}`);
  return lines.length ? `🌅 <b>Premercado:</b>\n${lines.map(l => '  ' + l).join('\n')}\n\n` : '';
}

// ── Resumen completo de la sesión ───────────────────────────────────────────
function buildResumen(data) {
  const premkt = premktResumen(data);

  // Caso 2: me conecté a analizar pero no hubo setup válido
  if (data.no_opero) {
    return (
      `✅ <b>Sesión guardada</b>\n\n` +
      `📅 <b>Fecha:</b> ${data.sesion_date}\n` +
      `🔌 Me conecté a analizar (sin setup válido)\n\n` +
      premkt +
      `✍️ <b>Análisis del día:</b>\n${escHtml(data.analisis_trader || '—')}`
    );
  }

  const chkItems = data._chk || CHECKLIST_FALLBACK;
  const score = scoreChecklist(data, chkItems);
  const chkLines = chkItems
    .map(({ clave, texto }) => `  ${data[clave] ? '✅' : '❌'} ${escHtml(texto || clave)}`)
    .join('\n');

  const stars = data.nivel_confianza ? '★'.repeat(data.nivel_confianza) + '☆'.repeat(5 - data.nivel_confianza) : null;

  return (
    `✅ <b>Sesión guardada</b>\n\n` +
    `📅 <b>Fecha:</b> ${data.sesion_date}\n` +
    (stars ? `⭐ <b>Confianza:</b> ${stars}\n` : '') +
    premkt +
    `📊 <b>Contexto:</b> ${data.contexto}\n` +
    `🔢 <b>Corrida:</b> ${data.num_corrida}ª\n` +
    `🕯️ <b>Velas:</b> ${data.velas_corrida}\n` +
    `⚠️ <b>Zonas en contra:</b> ${data.zonas_contra ? 'Sí' : 'No'}\n` +
    `📐 <b>Setup:</b> ${data.setup}\n\n` +
    `📋 <b>Checklist (${score}/${chkItems.length}):</b>\n${chkLines}\n\n` +
    `✍️ <b>Análisis del día:</b>\n${escHtml(data.analisis_trader || '—')}`
  );
}

// ── Supabase upsert de sesión ────────────────────────────────────────────────
async function saveSession(data, env) {
  // Checklist dinámico → JSONB { clave: bool } (keyed por la clave del catálogo)
  const chkItems = data._chk || CHECKLIST_FALLBACK;
  const checklist = {};
  chkItems.forEach(({ clave }) => { checklist[clave] = data[clave] ?? false; });

  const payload = {
    sesion_date:       data.sesion_date,
    no_opero:          data.no_opero         ?? false,
    motivo_no_opero:   data.motivo_no_opero   ?? null,
    contexto:          data.contexto          ?? null,
    num_corrida:       data.num_corrida       ?? null,
    velas_corrida:     data.velas_corrida     ?? null,
    puntos_retroceso:  data.puntos_retroceso  ?? null,
    zonas_contra:      data.zonas_contra      ?? false,
    setup:             data.setup             ?? null,
    checklist,
    chk_cuenta_pa:     data.chk_cuenta_pa     ?? false,
    chk_zonas:         data.chk_zonas         ?? false,
    chk_orden:         data.chk_orden         ?? false,
    chk_5velas:        data.chk_5velas        ?? false,
    chk_noticias:      data.chk_noticias      ?? false,
    chk_consecucion:   data.chk_consecucion   ?? false,
    chk_estructura:        data.chk_estructura        ?? false,
    analisis_trader:       data.analisis_trader       ?? null,
    estado_emocional_id:   data.estado_emocional_id   ?? null,
    nivel_confianza:       data.nivel_confianza        ?? null,
    // Premercado / contexto técnico
    // OJO: NO se incluyen los niveles de precio (cierre/apertura, OHLC de ayer ni
    // overnight precio_max_pre/min_pre) — los escribe el indicador
    // SupabaseDailyLevels. Mandarlos aquí (en null) los borraría.
    se_conecto:            data.se_conecto            ?? true,
    soportes_naranja:      data.soportes_naranja      ?? [],
    resistencias_naranja:  data.resistencias_naranja  ?? [],
    noticias:              data.noticias              ?? null,
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
    let res = await post(payload);
    if (res.ok) return { ok: true };
    // Reintento sin `checklist` por si la columna aún no existe (pre-migración)
    const body = await res.text();
    if (/checklist/i.test(body)) {
      const { checklist, ...rest } = payload;
      res = await post(rest);
      if (res.ok) return { ok: true };
      const body2 = await res.text();
      return { ok: false, status: res.status, error: (body2 || '').slice(0, 300) };
    }
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
async function startSesionFlow(chatId, token, kv, env) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: env.TIMEZONE || 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
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

  // ── Arrancar sesión desde botón en notificación de trade ──────────────────
  if (action === 'iniciar_sesion') {
    await startSesionFlow(chatId, token, env.KV, env);
    return;
  }

  const state = await getState(env.KV, chatId);
  if (!state) {
    await sendMessage(token, chatId, '⏱ Sesión expirada. Usa /sesion para empezar.');
    return;
  }

  // ── Toggle de checklist ───────────────────────────────────────────────────
  if (action.startsWith('tog_')) {
    const key = action.slice(4);
    state.data[key] = !state.data[key];
    await saveState(env.KV, chatId, state);
    const items = state.data._chk || CHECKLIST_FALLBACK;
    await editMessage(token, chatId, msgId, checklistText(state.data, items), checklistKeyboard(state.data, items));
    return;
  }

  // ── Confirmar checklist ───────────────────────────────────────────────────
  if (action === 'chk_ok') {
    state.step = STEPS.REFLEXION;
    await saveState(env.KV, chatId, state);
    const items = state.data._chk || CHECKLIST_FALLBACK;
    const score = scoreChecklist(state.data, items);
    await sendMessage(token, chatId,
      `✅ Checklist guardado — Score: <b>${score}/${items.length}</b>\n\n` +
      `✍️ <b>Análisis del día</b>\n\nEscribe tu análisis y reflexión de la sesión:`
    );
    return;
  }

  // ── Setup seleccionado ────────────────────────────────────────────────────
  if (action.startsWith('setup_')) {
    const idx = parseInt(action.slice(6));
    state.data.setup = SETUPS[idx];
    state.step = STEPS.CHECKLIST;
    const items = await fetchChecklistItems(env);
    state.data._chk = items;   // se conserva en el estado para toggles/score/guardado
    items.forEach(({ clave }) => {
      if (state.data[clave] === undefined) state.data[clave] = false;
    });
    await saveState(env.KV, chatId, state);
    await editMessage(token, chatId, msgId, checklistText(state.data, items), checklistKeyboard(state.data, items));
    return;
  }

  // ── Flujo principal ───────────────────────────────────────────────────────
  switch (action) {
    case 'opero_si':
      state.data.no_opero = false;
      state.data.se_conecto = true;
      state.step = STEPS.PRE_SOPORTES;
      await saveState(env.KV, chatId, state);
      await editMessage(token, chatId, msgId, PREMKT_PROMPTS.pre_soportes);
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
      state.step = STEPS.PRE_SOPORTES;
      await saveState(env.KV, chatId, state);
      await editMessage(token, chatId, msgId, PREMKT_PROMPTS.pre_soportes);
      break;

    case 'conecto_no':
      state.data.se_conecto = false;
      state.step = STEPS.MOTIVO;
      await saveState(env.KV, chatId, state);
      await editMessage(token, chatId, msgId, '📝 ¿Cuál fue el motivo para no conectarte hoy?');
      break;

    default:
      if (action.startsWith('emoc_')) {
        const val = action.slice(5);
        state.data.estado_emocional_id = val === 'skip' ? null : parseInt(val);
        state.step = STEPS.CONFIANZA;
        await saveState(env.KV, chatId, state);
        await editMessage(token, chatId, msgId,
          '⭐ <b>Nivel de confianza</b>\n\n¿Cuánta confianza tienes en tu operativa hoy?',
          CONFIANZA_KEYBOARD
        );
      } else if (action.startsWith('conf_')) {
        const val = action.slice(5);
        state.data.nivel_confianza = val === 'skip' ? null : parseInt(val);
        state.step = STEPS.CONTEXTO;
        await saveState(env.KV, chatId, state);
        await editMessage(token, chatId, msgId,
          '📊 <b>Contexto de mercado</b>\n\n¿Cómo estaba el mercado hoy?',
          { inline_keyboard: CONTEXTOS.map(c => [{ text: c.label, callback_data: `ctx_${c.value}` }]) }
        );
      } else if (action.startsWith('ctx_')) {
        state.data.contexto = action.slice(4);
        state.step = STEPS.CORRIDA;
        await saveState(env.KV, chatId, state);
        await editMessage(token, chatId, msgId,
          '🔢 <b>Número de corrida</b>\n\n¿Qué corrida operaste?',
          { inline_keyboard: [[
            { text: '1ª corrida', callback_data: 'cor_1' },
            { text: '2ª corrida', callback_data: 'cor_2' },
            { text: '3ª corrida', callback_data: 'cor_3' },
          ]] }
        );
      } else if (action.startsWith('cor_')) {
        state.data.num_corrida = parseInt(action.slice(4));
        state.step = STEPS.VELAS;
        await saveState(env.KV, chatId, state);
        await sendMessage(token, chatId,
          '🕯️ <b>Velas en corrida</b>\n\n¿Cuántas velas tuvo la corrida? (número del 1 al 20)'
        );
      } else if (action === 'zonas_si' || action === 'zonas_no') {
        state.data.zonas_contra = action === 'zonas_si';
        state.step = STEPS.SETUP;
        await saveState(env.KV, chatId, state);
        await editMessage(token, chatId, msgId,
          '📐 <b>Setup</b>\n\n¿Qué setup operaste?',
          setupKeyboard()
        );
      }
  }
}

async function handleText(msg, env) {
  const chatId = String(msg.chat.id);
  const text   = msg.text.trim();
  const token  = env.BOT_TOKEN;

  // Permitir /skip dentro del flujo; ignorar el resto de comandos
  if (text.startsWith('/') && text.toLowerCase() !== '/skip') return;

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

    // ── Premercado ──
    // Los niveles de precio (cierre/apertura/OHLC ayer y overnight ONH/ONL) los
    // escribe el indicador SupabaseDailyLevels. El bot solo captura lo cualitativo:
    // soportes/resistencias naranja y noticias.
    case STEPS.PRE_SOPORTES:
      state.data.soportes_naranja = parseNumList(text);
      state.step = STEPS.PRE_RESIST;
      await saveState(env.KV, chatId, state);
      await sendMessage(token, chatId, PREMKT_PROMPTS.pre_resist);
      break;
    case STEPS.PRE_RESIST:
      state.data.resistencias_naranja = parseNumList(text);
      state.step = STEPS.PRE_NOTICIAS;
      await saveState(env.KV, chatId, state);
      await sendMessage(token, chatId, PREMKT_PROMPTS.pre_noticias);
      break;
    case STEPS.PRE_NOTICIAS: {
      const t = text.toLowerCase();
      state.data.noticias = (t === '/skip' || t === 'skip' || t === '-') ? null : text;
      if (state.data.no_opero) {
        // Caso 2: me conecté sin setup → directo a la reflexión
        state.step = STEPS.REFLEXION;
        await saveState(env.KV, chatId, state);
        await sendMessage(token, chatId, '✍️ <b>Análisis del día</b>\n\nEscribe tu análisis de la sesión (no hubo setup válido):');
      } else {
        // Día operado → continúa con emoción
        state.step = STEPS.EMOCION;
        await saveState(env.KV, chatId, state);
        const emociones = await fetchEmociones(env);
        await sendMessage(token, chatId,
          '😊 <b>Estado emocional</b>\n\n¿Cómo llegas a la sesión de hoy?',
          emociones.length ? emocionKeyboard(emociones) : { inline_keyboard: [[{ text: '⏭ Omitir', callback_data: 'emoc_skip' }]] }
        );
      }
      break;
    }

    case STEPS.VELAS: {
      const n = parseInt(text);
      if (isNaN(n) || n < 1 || n > 20) {
        await sendMessage(token, chatId, '⚠️ Ingresa un número entre 1 y 20.');
        return;
      }
      state.data.velas_corrida = n;
      if (n > 5) state.data.chk_5velas = false;
      state.step = STEPS.ZONAS_CONTRA;
      await saveState(env.KV, chatId, state);
      await sendMessage(token, chatId,
        '⚠️ <b>Zonas en contra</b>\n\n¿Había zonas en contra del trade?',
        { inline_keyboard: [[
          { text: '✅ Sí', callback_data: 'zonas_si' },
          { text: '❌ No', callback_data: 'zonas_no' },
        ]] }
      );
      break;
    }

    case STEPS.REFLEXION: {
      state.data.analisis_trader = text;
      const r = await saveSession(state.data, env);
      await delState(env.KV, chatId);
      if (r.ok) {
        await sendMessage(token, chatId, buildResumen(state.data));
      } else {
        await sendMessage(token, chatId,
          `⚠️ <b>Error al guardar (HTTP ${r.status})</b>\n<code>${(r.error || 'sin detalle').replace(/[<>]/g, '')}</code>\n\nReintenta con /sesion.`
        );
      }
      break;
    }
  }
}

// ── Notificación de trade desde NinjaTrader ─────────────────────────────────
async function handleNotify(request, env) {
  const token = request.headers.get('X-Notify-Token');
  if (!token || token !== env.NOTIFY_SECRET) {
    return new Response('Unauthorized', { status: 403 });
  }

  const t = await request.json();

  const instrument  = t.instrument?.split(' ')[0] || t.instrument;
  const accountParts = (t.account || '').split('-');
  const account = accountParts.length > 2 ? accountParts.slice(0, 2).join('-') : (t.account || '');

  const isLong = t.market_pos === 'Long';
  const dir    = isLong ? '🟢 ▲ Long' : '🔴 ▼ Short';
  const emoji  = t.resultado === 'target' ? '✅ Target' :
                 t.resultado === 'stop'   ? '🔴 Stop'   : '⚫ Otro';
  const sign   = t.profit >= 0 ? '+' : '';

  const text =
    `🔔 <b>Trade cerrado — ${instrument}</b>\n` +
    `${account ? `🏦 ${account}\n` : ''}` +
    `${dir} | ${t.qty} contrato${t.qty !== 1 ? 's' : ''}\n` +
    `PnL: <b>${sign}$${Math.abs(parseFloat(t.profit)).toFixed(2)}</b> ${emoji}\n` +
    `MAE: $${parseFloat(t.mae).toFixed(2)} | MFE: $${parseFloat(t.mfe).toFixed(2)}`;

  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: env.ALLOWED_CHAT_ID,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '📝 Registrar sesión del día', callback_data: 'iniciar_sesion' },
        ]],
      },
    }),
  });

  return new Response('OK');
}

// ── Entry point ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('OK');

    const url = new URL(request.url);
    if (url.pathname === '/notify') return handleNotify(request, env);

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
};
