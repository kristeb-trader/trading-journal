/**
 * Trading Journal — Telegram Bot
 * Cloudflare Worker + KV para registro de sesiones diarias
 *
 * Variables de entorno requeridas (Cloudflare Dashboard → Worker → Settings → Variables):
 *   BOT_TOKEN       — Token del bot de @BotFather
 *   SUPABASE_URL    — https://jothoslozctflfrnysrx.supabase.co
 *   SUPABASE_KEY    — anon key de Supabase
 *   ALLOWED_CHAT_ID — Tu chat ID de Telegram (obtener con @userinfobot)
 *
 * KV Namespace requerido:
 *   KV — binding "KV" en wrangler.toml
 */

// ── Constantes del flujo ────────────────────────────────────────────────────
const STEPS = {
  OPERO:          'opero',
  MOTIVO:         'motivo',
  CONTEXTO:       'contexto',
  CORRIDA:        'corrida',
  VELAS:          'velas',
  RETROCESO:      'retroceso',
  ZONAS_CONTRA:   'zonas_contra',
  SETUP:          'setup',
  CHECKLIST:      'checklist',
  REFLEXION:      'reflexion',
};

const CONTEXTOS = [
  'Tendencia alcista',
  'Tendencia bajista',
  'Lateral',
  'Volátil',
  'Sin contexto claro',
];

const CHECKLIST_ITEMS = [
  { key: 'chk_zonas',       label: 'Zonas vigentes verificadas'           },
  { key: 'chk_orden',       label: 'Orden precolocada a tiempo'           },
  { key: 'chk_5velas',      label: 'Máx 5 velas en corrida'               },
  { key: 'chk_noticias',    label: 'Sin noticia roja activa'              },
  { key: 'chk_consecucion', label: 'Zona con rompimiento + consecución'   },
  { key: 'chk_estructura',  label: 'Estructura Impulso-Retroceso-Impulso' },
];

// ── Helpers de Telegram API ─────────────────────────────────────────────────
async function tg(token, method, body) {
  await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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
function checklistText(data) {
  const lines = CHECKLIST_ITEMS.map(
    ({ key, label }) => `${data[key] ? '✅' : '❌'} ${label}`
  ).join('\n');
  return `<b>📋 Checklist de disciplina</b>\n\n${lines}`;
}

function checklistKeyboard(data) {
  const rows = CHECKLIST_ITEMS.map(({ key, label }) => [{
    text: `${data[key] ? '✅' : '❌'} ${label}`,
    callback_data: `tog_${key}`,
  }]);
  rows.push([{ text: '💾 Confirmar checklist', callback_data: 'chk_ok' }]);
  return { inline_keyboard: rows };
}

function scoreChecklist(data) {
  return CHECKLIST_ITEMS.filter(({ key }) => data[key]).length;
}

// ── Supabase upsert de sesión ────────────────────────────────────────────────
async function saveSession(data, env) {
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
    chk_zonas:         data.chk_zonas         ?? false,
    chk_orden:         data.chk_orden         ?? false,
    chk_5velas:        data.chk_5velas        ?? false,
    chk_noticias:      data.chk_noticias      ?? false,
    chk_consecucion:   data.chk_consecucion   ?? false,
    chk_estructura:    data.chk_estructura    ?? false,
    analisis_trader:   data.analisis_trader   ?? null,
  };

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/sesiones`, {
    method: 'POST',
    headers: {
      apikey:          env.SUPABASE_KEY,
      Authorization:   `Bearer ${env.SUPABASE_KEY}`,
      'Content-Type':  'application/json',
      Prefer:          'resolution=merge-duplicates',
    },
    body: JSON.stringify(payload),
  });

  return res.ok;
}

// ── Stats desde Supabase ────────────────────────────────────────────────────
async function fetchMonthStats(env) {
  try {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: env.TIMEZONE || 'America/Guatemala',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  const from = today.slice(0, 7) + '-01'

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/trades?trade_date=gte.${from}&select=trade_date,profit,resultado`,
    { headers: { apikey: env.SUPABASE_KEY, Authorization: `Bearer ${env.SUPABASE_KEY}` } }
  )
  if (!res.ok) return { error: `Supabase error ${res.status}` }
  const trades = await res.json()

  const totalTrades = trades.length
  const targets = trades.filter(t => t.resultado === 'target').length
  const stops   = trades.filter(t => t.resultado === 'stop').length
  const netPnl  = trades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0)
  const winRate = totalTrades > 0 ? (targets / totalTrades * 100).toFixed(1) : 0

  const grossWin  = trades.filter(t => (parseFloat(t.profit) || 0) > 0).reduce((s, t) => s + parseFloat(t.profit), 0)
  const grossLoss = Math.abs(trades.filter(t => (parseFloat(t.profit) || 0) < 0).reduce((s, t) => s + parseFloat(t.profit), 0))
  const pf = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : '—'

  // Racha actual por día
  const byDate = {}
  trades.forEach(t => {
    if (!t.trade_date) return
    byDate[t.trade_date] = (byDate[t.trade_date] || 0) + (parseFloat(t.profit) || 0)
  })
  const dates = Object.keys(byDate).sort()
  let streak = 0, streakType = 'none'
  if (dates.length > 0) {
    const results = dates.map(d => byDate[d] >= 0 ? 'win' : 'loss')
    streakType = results[results.length - 1]
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i] === streakType) streak++
      else break
    }
  }

  return { totalTrades, targets, stops, netPnl, winRate, pf, streak, streakType, from }
  } catch (e) {
    return { error: e.message }
  }
}

// ── Handlers principales ────────────────────────────────────────────────────
async function handleCommand(msg, env) {
  const chatId = String(msg.chat.id);
  const token  = env.BOT_TOKEN;

  if (msg.text === '/sesion') {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: env.TIMEZONE || 'America/Guatemala',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const state = { step: STEPS.OPERO, data: { sesion_date: today } };
    await saveState(env.KV, chatId, state);

    await sendMessage(token, chatId,
      `📅 <b>Registro de sesión — ${today}</b>\n\n¿Operaste hoy?`,
      { inline_keyboard: [[
        { text: '✅ Sí, operé',  callback_data: 'opero_si' },
        { text: '❌ No operé',   callback_data: 'opero_no' },
      ]] }
    );
    return;
  }

  if (msg.text === '/stats') {
    const s = await fetchMonthStats(env)
    if (!s || s.error) {
      await sendMessage(token, chatId, `⚠️ Error al consultar estadísticas: ${s?.error || 'desconocido'}`)
      return
    }
    const pnlSign  = s.netPnl >= 0 ? '+' : ''
    const pnlEmoji = s.netPnl >= 0 ? '📈' : '📉'
    const streakEmoji = s.streakType === 'win' ? '🟢' : s.streakType === 'loss' ? '🔴' : '—'
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const month = MESES[parseInt(s.from.slice(5, 7)) - 1]
    await sendMessage(token, chatId,
      `📊 <b>Stats — ${month.charAt(0).toUpperCase() + month.slice(1)}</b>\n\n` +
      `${pnlEmoji} <b>P&amp;L Neto:</b> ${pnlSign}$${s.netPnl.toFixed(2)}\n` +
      `🎯 <b>Win Rate:</b> ${s.winRate}%\n` +
      `📋 <b>Trades:</b> ${s.totalTrades} (${s.targets}✅ / ${s.stops}❌)\n` +
      `⚡ <b>Profit Factor:</b> ${s.pf}\n` +
      `🔥 <b>Racha:</b> ${s.streak > 0 ? `${s.streak} ${streakEmoji}` : '—'}`
    )
    return
  }

  if (msg.text === '/cancelar') {
    await delState(env.KV, chatId);
    await sendMessage(token, chatId, '🚫 Registro cancelado.');
    return;
  }
}

async function handleCallback(cbq, env) {
  const chatId  = String(cbq.message.chat.id);
  const msgId   = cbq.message.message_id;
  const action  = cbq.data;
  const token   = env.BOT_TOKEN;

  await answerCbq(token, cbq.id);

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
    await editMessage(token, chatId, msgId, checklistText(state.data), checklistKeyboard(state.data));
    return;
  }

  // ── Confirmar checklist ───────────────────────────────────────────────────
  if (action === 'chk_ok') {
    state.step = STEPS.REFLEXION;
    await saveState(env.KV, chatId, state);
    const score = scoreChecklist(state.data);
    await sendMessage(token, chatId,
      `✅ Checklist guardado — Score: <b>${score}/6</b>\n\n` +
      `✍️ <b>Reflexión del día</b>\n\nEscribe tu análisis y reflexión de la sesión:`
    );
    return;
  }

  // ── Flujo principal ───────────────────────────────────────────────────────
  switch (action) {
    case 'opero_si':
      state.data.no_opero = false;
      state.step = STEPS.CONTEXTO;
      await saveState(env.KV, chatId, state);
      await editMessage(token, chatId, msgId,
        '📊 <b>Contexto de mercado</b>\n\n¿Cómo estaba el mercado hoy?',
        { inline_keyboard: CONTEXTOS.map((c, i) => [{ text: c, callback_data: `ctx_${i}` }]) }
      );
      break;

    case 'opero_no':
      state.data.no_opero = true;
      state.step = STEPS.MOTIVO;
      await saveState(env.KV, chatId, state);
      await editMessage(token, chatId, msgId, '📝 ¿Cuál fue el motivo para no operar hoy?');
      break;

    default:
      if (action.startsWith('ctx_')) {
        state.data.contexto = CONTEXTOS[parseInt(action.slice(4))];
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
          '🕯️ <b>Velas en corrida</b>\n\n¿Cuántas velas tuvo la corrida? (escribe un número del 1 al 20)'
        );
      } else if (action === 'zonas_si' || action === 'zonas_no') {
        state.data.zonas_contra = action === 'zonas_si';
        state.step = STEPS.SETUP;
        await saveState(env.KV, chatId, state);
        await editMessage(token, chatId, msgId,
          '📐 <b>Setup</b>\n\nDescribe brevemente el setup que operaste:'
        );
      }
  }
}

async function handleText(msg, env) {
  const chatId = String(msg.chat.id);
  const text   = msg.text.trim();
  const token  = env.BOT_TOKEN;

  if (text.startsWith('/')) return;

  const state = await getState(env.KV, chatId);
  if (!state) return;

  switch (state.step) {

    case STEPS.MOTIVO:
      state.data.motivo_no_opero = text;
      await saveSession(state.data, env);
      await delState(env.KV, chatId);
      await sendMessage(token, chatId,
        `✅ <b>Sesión guardada</b>\n\n📅 ${state.data.sesion_date}\n❌ Sin operación — ${text}`
      );
      break;

    case STEPS.VELAS: {
      const n = parseInt(text);
      if (isNaN(n) || n < 1 || n > 20) {
        await sendMessage(token, chatId, '⚠️ Ingresa un número entre 1 y 20.');
        return;
      }
      state.data.velas_corrida = n;
      if (n > 5) state.data.chk_5velas = false; // auto-invalidar
      state.step = STEPS.RETROCESO;
      await saveState(env.KV, chatId, state);
      await sendMessage(token, chatId,
        '📏 <b>Puntos de retroceso</b>\n\n¿Cuántos puntos retrocedió antes del entry? (ej: 8.5)'
      );
      break;
    }

    case STEPS.RETROCESO: {
      const p = parseFloat(text.replace(',', '.'));
      if (isNaN(p) || p < 0) {
        await sendMessage(token, chatId, '⚠️ Ingresa un número válido (ej: 8.5)');
        return;
      }
      state.data.puntos_retroceso = p;
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

    case STEPS.SETUP:
      state.data.setup = text;
      state.step = STEPS.CHECKLIST;
      // Inicializar checklist en false (respetar chk_5velas si ya fue auto-invalidado)
      CHECKLIST_ITEMS.forEach(({ key }) => {
        if (state.data[key] === undefined) state.data[key] = false;
      });
      await saveState(env.KV, chatId, state);
      await sendMessage(token, chatId, checklistText(state.data), checklistKeyboard(state.data));
      break;

    case STEPS.REFLEXION:
      state.data.analisis_trader = text;
      const ok = await saveSession(state.data, env);
      await delState(env.KV, chatId);
      const score = scoreChecklist(state.data);
      await sendMessage(token, chatId,
        ok
          ? `✅ <b>Sesión guardada correctamente</b>\n\n` +
            `📅 Fecha: ${state.data.sesion_date}\n` +
            `📊 Contexto: ${state.data.contexto}\n` +
            `🔢 Corrida: ${state.data.num_corrida}ª\n` +
            `🕯️ Velas: ${state.data.velas_corrida}\n` +
            `📏 Retroceso: ${state.data.puntos_retroceso} pts\n` +
            `📋 Disciplina: <b>${score}/6</b>`
          : '⚠️ Error al guardar en Supabase. Intenta de nuevo con /sesion.'
      );
      break;
  }
}

// ── Notificación de trade desde NinjaTrader ─────────────────────────────────
async function handleNotify(request, env) {
  const token = request.headers.get('X-Notify-Token');
  if (!token || token !== env.NOTIFY_SECRET) {
    return new Response('Unauthorized', { status: 403 });
  }

  const t = await request.json();
  const dir   = t.market_pos === 'Long' ? '▲ Long' : '▼ Short';
  const emoji = t.resultado === 'target' ? '✅ Target' :
                t.resultado === 'stop'   ? '🔴 Stop'   : '⚫ Otro';
  const sign  = t.profit >= 0 ? '+' : '';

  const text =
    `🔔 <b>Trade cerrado — ${t.instrument}</b>\n` +
    `${dir} | ${t.qty} contrato${t.qty !== 1 ? 's' : ''}\n` +
    `Entrada: ${parseFloat(t.entry_price).toFixed(2)} → Salida: ${parseFloat(t.exit_price).toFixed(2)}\n` +
    `PnL: <b>${sign}$${Math.abs(parseFloat(t.profit)).toFixed(2)}</b> ${emoji}\n` +
    `MAE: $${parseFloat(t.mae).toFixed(2)} | MFE: $${parseFloat(t.mfe).toFixed(2)}`;

  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.ALLOWED_CHAT_ID, text, parse_mode: 'HTML' }),
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

      // Verificar autorización
      if (env.ALLOWED_CHAT_ID && chatId !== env.ALLOWED_CHAT_ID) {
        return new Response('OK');
      }

      if (update.message?.text) {
        if (update.message.text.startsWith('/')) {
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
