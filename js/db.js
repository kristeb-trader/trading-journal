// Data access layer — all Supabase queries go here
const { createClient } = supabase
const supa = createClient(SUPABASE_URL, SUPABASE_KEY)

// Checklist por defecto — usado como fallback si el catálogo aún no existe en
// BD (pre-migración) o si la consulta falla. Las claves = columnas chk_* legado.
const CHECKLIST_DEFAULT = [
  { id: -1, clave: 'chk_cuenta_pa',   fase: 1, texto: 'Cuenta PA activa — verificada visualmente en la plataforma', orden: 1, activo: true },
  { id: -2, clave: 'chk_noticias',    fase: 1, texto: 'Calendario económico verificado (sin noticia roja)',         orden: 2, activo: true },
  { id: -3, clave: 'chk_zonas',       fase: 1, texto: 'Zonas vigentes verificadas',                                 orden: 3, activo: true },
  { id: -4, clave: 'chk_5velas',      fase: 2, texto: 'Máx 5 velas en el impulso de la corrida',                    orden: 1, activo: true },
  { id: -5, clave: 'chk_consecucion', fase: 2, texto: 'Zona marcada con rompimiento + consecución + retroceso',     orden: 2, activo: true },
  { id: -6, clave: 'chk_estructura',  fase: 2, texto: 'Estructura de Impulso + Retroceso + Impulso, fluida',        orden: 3, activo: true },
  { id: -7, clave: 'chk_orden',       fase: 3, texto: 'Orden precolocada a tiempo',                                 orden: 1, activo: true },
]
let _checklistCache = null  // catálogo cacheado tras la primera carga
let _cuentaPrincipalCache = 'PA-APEX-232411-03'  // fallback histórico hasta leer objetivos

// ── Setups paramétricos (catalogo_setups + catalogo_setup_variantes) ────────
// La FAMILIA del setup ('iri'|'reingreso'|…) es la que agrupa las reglas de
// Fase 2. Antes se deducía con startsWith('iri') repetido en 5 archivos; ahora
// sale del catálogo, así un setup nuevo solo requiere insertar filas en BD.
let _setupsCache = null     // [{ codigo, nombre, descripcion, orden, activo }]
let _variantesCache = null  // [{ codigo, setup_codigo, nombre, subtipo, direccion }]

// Fallback por prefijo: solo se usa si el catálogo aún no cargó (arranque en
// frío o sin conexión). Mantiene el comportamiento histórico.
function _setupFamilyFallback(texto) {
  const v = (texto || '').toLowerCase()
  if (v.startsWith('iri')) return 'iri'
  if (v.startsWith('reingreso')) return 'reingreso'
  return null
}

// Familia del setup de una sesión. Prioriza el FK `setup_codigo`; si no está
// (sesión vieja o escritura de un cliente que aún no lo manda), resuelve por el
// nombre del catálogo, y como último recurso usa el prefijo.
function setupFamilyOf(sesion) {
  if (!sesion) return null
  const vs = _variantesCache
  if (vs && vs.length) {
    if (sesion.setup_codigo) {
      const v = vs.find(x => x.codigo === sesion.setup_codigo)
      if (v) return v.setup_codigo
    }
    const txt = (sesion.setup || '').trim().toLowerCase()
    if (txt) {
      const v = vs.find(x => (x.nombre || '').trim().toLowerCase() === txt)
      if (v) return v.setup_codigo
    }
  }
  return _setupFamilyFallback(sesion.setup)
}

// Hidrata una sesión: reconstruye s.checklist = { codigo: bool } desde las filas
// de sesion_checklist (modelo relacional) y expone s[codigo] para que el código
// que lee s.chk_zonas (calendario, charts, métricas) siga funcionando sin cambios.
// Fallback: si aún viniera el JSONB viejo (columna sin dropear), también se usa.
function hydrateChecklist(s) {
  if (!s) return s
  if (Array.isArray(s.sesion_checklist)) {
    const chk = {}
    for (const row of s.sesion_checklist) chk[row.regla_codigo] = row.cumplido
    s.checklist = chk
    delete s.sesion_checklist
  }
  if (s.checklist && typeof s.checklist === 'object') Object.assign(s, s.checklist)
  return s
}

// Clasificación del resultado efectivo de un trade (para tasa de acierto y conteos):
//  - break-even (|profit| ≤ 6) → null (no cuenta como acierto ni stop)
//  - resultado 'target'/'stop' explícito manda
//  - cualquier otro (p. ej. 'close'/sin clasificar) se infiere por el signo del P&L:
//    positivo → 'win', negativo → 'loss'
// Mantiene la tasa de acierto coherente con el color del día en el calendario.
function tradeOutcome(t) {
  const p = parseFloat(t.profit) || 0
  if (Math.abs(p) <= 6) return null
  if (t.resultado === 'target') return 'win'
  if (t.resultado === 'stop') return 'loss'
  return p > 0 ? 'win' : 'loss'
}
const isWinTrade = t => tradeOutcome(t) === 'win'
const isLossTrade = t => tradeOutcome(t) === 'loss'

// ── Ventana de bloqueo por noticia roja (±5 min) ──────────────────────────
// Minutos del día de una hora 'HH:MM' o 'HH:MM:SS' (ET). null si inválida.
function _minsOfTime(s) {
  const m = /^(\d{1,2}):(\d{2})/.exec(s || '')
  return m ? (+m[1]) * 60 + (+m[2]) : null
}
// ¿La hora de entrada de un trade cae en la ventana ±margen de la noticia?
// entry y hora en el mismo reloj (ET). Soporta varias horas separadas por coma.
function enVentanaNoticia(entryTime, horaNoticia, margen = 5) {
  const e = _minsOfTime(entryTime)
  if (e == null || !horaNoticia) return false
  return String(horaNoticia).split(',').some(h => {
    const n = _minsOfTime(h.trim())
    return n != null && Math.abs(e - n) <= margen
  })
}
// Trades de un día que cayeron dentro de la ventana de la noticia roja de la sesión.
function tradesEnVentanaNoticia(trades, sesion, margen = 5) {
  if (!sesion || !sesion.hora_noticia_roja || !trades) return []
  return trades.filter(t => enVentanaNoticia(t.entry_time, sesion.hora_noticia_roja, margen))
}

// ── Día hábil: sábados y domingos NUNCA cuentan para estadísticas ────────────
// El mercado no se opera en fin de semana. El calendario solo pinta Lun–Vie, pero
// pueden existir filas de `sesiones` de sábado/domingo: el AddOn de NT8 crea la fila
// al abrir la plataforma (la necesita por la FK de `sesion_checklist`). Sin este
// filtro, esas sesiones fantasma entraban en disciplina y en "días con actividad".
function esDiaHabil(fecha) {
  if (!fecha) return false
  const dow = new Date(`${String(fecha).slice(0, 10)}T12:00:00`).getDay()
  return dow >= 1 && dow <= 5
}
// Set de fechas que tuvieron al menos un trade — señal de operativa real.
function fechasConTrades(trades) {
  return new Set((trades || []).map(t => t.trade_date || t.entry_time?.slice(0, 10)).filter(Boolean))
}

// ── Disciplina: cálculo canónico (compartido por calendario, análisis y dashboard) ──
// Definición única: % de adherencia al checklist, consciente de fase, sin penalizar
// los ítems no registrados (p. ej. reglas nuevas en sesiones previas).
function _discSeConecto(s) { return !s.no_opero || s.se_conecto !== false }
const _discSetupFamily = setupFamilyOf  // fuente única: catálogo de setups
// ¿Ese día hubo operativa real (llegó a la lectura del setup y la ejecución)?
// `no_opero = false` NO basta: es el default de la columna, así que una sesión creada
// por el AddOn al abrir NT8 nace "operada" aunque no se haya dado GO. Se exige señal
// real: trades ese día, o un setup declarado.
// Sin el Set de fechas con trades no se puede afirmar lo contrario, así que se
// mantiene el criterio histórico (`!no_opero`) en vez de alterar el pasado en silencio.
function sesionOpero(s, conTrades) {
  if (!s || s.no_opero) return false
  if (!conTrades) return true
  return conTrades.has(s.sesion_date) || !!(s.setup_codigo || s.setup)
}
// ¿Ese día había noticia roja registrada? La columna la mantiene sincronizada un
// trigger desde `sesion_noticias`, así que sirve como fuente para el contexto.
function _hayNoticia(s) { return !!(s && s.hora_noticia_roja && String(s.hora_noticia_roja).trim()) }

// ── Contexto del día: TERCER eje de aplicabilidad ────────────────────────────
// Una regla se filtra por FASE (cuándo), por FAMILIA DE SETUP (para qué setup) y
// —desde el rediseño de ago 2026— por CONTEXTO del día. Sin esto, una regla como
// "en día FOMC solo reingresos" contaría como cumplida los ~250 días que no son
// FOMC y su porcentaje no diría nada.
function discAplicaContexto(f, s, opts) {
  const cond = f.aplica_si || 'siempre'
  if (cond === 'siempre') return true
  if (cond === 'dia_fomc') return !!(opts && opts.fomcDates && opts.fomcDates.has(s.sesion_date))
  if (cond === 'hay_noticia') return _hayNoticia(s)
  return true
}

// ¿El factor (ítem del checklist) aplica y debe contarse para esta sesión?
//  Solo días hábiles conectados. Fase 1 en todo día conectado; Fases 2/3 solo si
//  hubo operativa real; reglas por setup solo si coincide la familia; y las
//  condicionales solo si su contexto se da ese día.
function discFactorAplica(f, s, opts) {
  // Retro-compatible: si llega un Set suelto, es el `conTrades` de la firma vieja.
  const o = (opts instanceof Set) ? { conTrades: opts } : (opts || {})
  if (!esDiaHabil(s.sesion_date)) return false
  if (!_discSeConecto(s)) return false
  const base = (f.fase || 1) === 1 ? true : sesionOpero(s, o.conTrades)
  if (!base) return false
  if (f.setup && _discSetupFamily(s) !== f.setup) return false
  return discAplicaContexto(f, s, o)
}

// ── Verificación automática (reglas con `evidencia = 'auto'`) ────────────────
// El checklist es auto-reportado; cuando el dato puede responder, responde el dato.
// Devuelven true (cumplida) · false (incumplida) · null (NO evaluable → no cuenta
// ni a favor ni en contra, igual que un ítem sin registrar).

// $ por punto según el contrato: MNQ = $2, NQ = $20. Normalizar mal esto infla el
// MAE ×10 en los trades de NQ (ya llevó a una conclusión falsa una vez).
function _usdPorPunto(t) { return /^\s*MNQ/i.test(t.instrument || '') ? 2 : 20 }

// MAE del trade convertido a PUNTOS. El riesgo se mide en puntos, no en dólares:
// con varios contratos el importe escala pero la regla sigue siendo la misma.
function maeEnPuntos(t) {
  const qty = parseFloat(t.qty) || 0
  if (!qty || t.mae == null) return null
  return Math.abs(parseFloat(t.mae) || 0) / (_usdPorPunto(t) * qty)
}

function reglaAutoResultado(codigo, s, opts) {
  const o = opts || {}
  const trades = (o.tradesPorDia && o.tradesPorDia.get(s.sesion_date)) || []

  if (codigo === 'stop_max_puntos') {
    const lim = o.stopMaxPuntos || 80
    const pts = trades.map(maeEnPuntos).filter(p => p != null)
    if (!pts.length) return null                 // sin MAE no se puede afirmar nada
    return pts.every(p => p <= lim)
  }

  if (codigo === 'chk_noticias') {
    // Solo sobre la ENTRADA: estar ya dentro cuando sale la noticia es válido.
    if (!trades.length || !_hayNoticia(s)) return null
    return tradesEnVentanaNoticia(trades, s).length === 0
  }

  if (codigo === 'fomc_solo_reingreso') {
    // La regla SOLO existe en días FOMC. Se comprueba aquí y no solo en
    // `discFactorAplica` porque hay llamadores que piden el resultado directamente
    // (el Coach): sin esta guarda, un día normal con IRI salía como violación.
    if (!(o.fomcDates && o.fomcDates.has(s.sesion_date))) return null
    if (!trades.length) return null
    const fam = _discSetupFamily(s)
    if (!fam) return null                        // sin setup declarado no se puede juzgar
    return fam === 'reingreso'
  }

  return null
}
// Reglas que un error contradice, indexadas por día: Map fecha → Set(regla_codigo).
// Se construye desde `diagnostico_errores.regla_codigo`.
function reglasRotasPorDia(errores) {
  const m = new Map()
  ;(errores || []).forEach(e => {
    if (!e.regla_codigo || !e.sesion_date) return
    if (!m.has(e.sesion_date)) m.set(e.sesion_date, new Set())
    m.get(e.sesion_date).add(e.regla_codigo)
  })
  return m
}
// ¿La regla se cumplió REALMENTE ese día? La casilla del checklist es auto-reportada
// por el trader antes/durante la sesión; si el diagnóstico posterior registró un error
// que rompe esa misma regla, manda el error. (Ej. 8-jul-2026: "No operar con noticia
// roja" marcada en true y un error "FOMC" por operar ese día → cuenta como incumplida.)
function reglaCumplida(s, key, rotas) {
  if (!s[key]) return false
  return !(rotas && rotas.get(s.sesion_date)?.has(key))
}
// ── Contexto de disciplina ───────────────────────────────────────────────────
// Construye de una vez todo lo que necesita el cálculo. Úsalo SIEMPRE con los
// trades y errores COMPLETOS (sin filtro de cuenta ni de período): son índices de
// "qué pasó ese día", no métricas del período. La disciplina es del proceso del
// trader, no de una cuenta — pasarlos filtrados ya causó una regresión.
function discContexto({ trades, fechasEsp, errores, stopMaxPuntos } = {}) {
  const tradesPorDia = new Map()
  ;(trades || []).forEach(t => {
    const d = t.trade_date || t.entry_time?.slice(0, 10)
    if (!d) return
    if (!tradesPorDia.has(d)) tradesPorDia.set(d, [])
    tradesPorDia.get(d).push(t)
  })
  return {
    conTrades: new Set(tradesPorDia.keys()),
    tradesPorDia,
    fomcDates: new Set((fechasEsp || []).filter(f => f.tipo === 'fomc').map(f => f.fecha)),
    rotas: reglasRotasPorDia(errores),
    stopMaxPuntos: stopMaxPuntos || 80,
  }
}

// % de disciplina sobre un conjunto de sesiones. Devuelve { total, ok, pct }.
// Solo cuenta ítems APLICABLES y EVALUABLES:
//   · regla `auto`      → la resuelve el dato; si no hay dato, no cuenta
//   · regla `declarada` → la casilla del trader, salvo que un error la contradiga
// opts: usa `discContexto()` para construirlo.
function calcDisciplinaStats(sesiones, items, opts) {
  const o = opts || {}
  const rotas = o.rotas || null
  const factores = (items || DB.checklistItemsSync())
    .filter(i => i.activo !== false)
    .map(i => ({
      key: i.clave, fase: i.fase || 1, setup: i.setup || null,
      aplica_si: i.aplica_si || 'siempre', evidencia: i.evidencia || 'declarada',
    }))
  let total = 0, ok = 0
  ;(sesiones || []).forEach(s => factores.forEach(f => {
    if (!discFactorAplica(f, s, o)) return
    if (f.evidencia === 'auto') {
      const r = reglaAutoResultado(f.key, s, o)
      if (r === null) return            // sin evidencia suficiente: no cuenta
      total++; if (r) ok++
      return
    }
    if (s[f.key] === undefined) return  // ítem sin registrar = N/A
    total++; if (reglaCumplida(s, f.key, rotas)) ok++
  }))
  return { total, ok, pct: total > 0 ? Math.round(ok / total * 100) : null }
}

const DB = {
  // ── Trades ──────────────────────────────────────────────────────────────

  async getTrades(filters = {}) {
    let q = supa.from('trades').select('*')
      .order('trade_date', { ascending: false })
      .order('entry_time', { ascending: false })
    if (filters.resultado) q = q.eq('resultado', filters.resultado)
    if (filters.from) q = q.gte('trade_date', filters.from)
    if (filters.to) q = q.lte('trade_date', filters.to)
    const { data, error } = await q
    if (error) throw error
    return data
  },

  async getTradesByMonth(year, month) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
    const { data, error } = await supa
      .from('trades')
      .select('*')
      .gte('trade_date', from)
      .lte('trade_date', to)
      .order('trade_date', { ascending: true })
      .order('entry_time', { ascending: true })
    if (error) throw error
    return data
  },

  async getTradesByDate(date) {
    const { data, error } = await supa
      .from('trades')
      .select('*')
      .eq('trade_date', date)
      .order('entry_time', { ascending: true })
    if (error) throw error
    return data
  },

  async getSessionsWithImages() {
    const { data, error } = await supa
      .from('sesiones')
      .select('sesion_date, imagen_url')
      .not('imagen_url', 'is', null)
      .order('sesion_date', { ascending: true })
    if (error) throw error
    return data
  },

  // ── Sesiones ─────────────────────────────────────────────────────────────

  async getSesiones() {
    const { data, error } = await supa
      .from('sesiones')
      .select('*, sesion_checklist(regla_codigo, cumplido)')
      .order('sesion_date', { ascending: false })
    if (error) throw error
    return (data || []).map(hydrateChecklist)
  },

  async getSesionByDate(date) {
    const { data, error } = await supa
      .from('sesiones')
      .select('*, sesion_checklist(regla_codigo, cumplido)')
      .eq('sesion_date', date)
      .maybeSingle()
    if (error) throw error
    return hydrateChecklist(data)
  },

  async upsertSesion(payload) {
    // El checklist y las noticias viven en tablas relacionales propias
    // (sesion_checklist, sesion_noticias). Hay que SACARLOS del payload: el resto va
    // al Worker /api/session (no versionado), que lo escribe tal cual como columnas de
    // `sesiones` — cualquier clave que no sea una columna real revienta el guardado.
    const { checklist, noticiasRojas, ...rest } = payload
    const secret = localStorage.getItem('dashboard_secret') || ''
    const res = await fetch('https://broad-hall-c53f.kristerock.workers.dev/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Dashboard-Token': secret,
      },
      body: JSON.stringify(rest),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Error ${res.status}: ${text}`)
    }
    // Checklist → filas en sesion_checklist (tras crear/actualizar la fila por el
    // Worker; el trigger ya materializó las reglas en true, aquí se actualizan las
    // que el trader marcó distinto). Upsert por (sesion_date, regla_codigo).
    if (checklist && rest.sesion_date) {
      const now = new Date().toISOString()
      const rows = Object.entries(checklist).map(([regla_codigo, cumplido]) => ({
        sesion_date: rest.sesion_date, regla_codigo, cumplido: !!cumplido, updated_at: now,
      }))
      if (rows.length) {
        const { error } = await supa.from('sesion_checklist')
          .upsert(rows, { onConflict: 'sesion_date,regla_codigo' })
        if (error) console.warn('No se pudo guardar el checklist:', error.message)
      }
    }
    // Noticias rojas → sesion_noticias (después del Worker: hay FK a sesiones).
    if (noticiasRojas !== undefined && rest.sesion_date) {
      await DB.saveNoticias(rest.sesion_date, noticiasRojas)
    }
  },

  // ── Noticias rojas del día (sesion_noticias) ──────────────────────────────
  // Varias por día, cada una con su ventana de ±5 min sobre la ENTRADA del trade.
  // Un trigger mantiene sincronizado `sesiones.hora_noticia_roja` (texto) para el
  // Worker y el AddOn, que aún escriben esa columna.
  async getNoticiasByDate(date) {
    if (!date) return []
    const { data, error } = await supa
      .from('sesion_noticias')
      .select('id, hora, nombre')
      .eq('sesion_date', date)
      .order('hora', { ascending: true })
    if (error) throw error
    return (data || []).map(n => ({ ...n, hora: String(n.hora).slice(0, 5) }))
  },

  // Reemplaza el set completo del día (más simple y sin huérfanos que un diff).
  async saveNoticias(sesionDate, noticias) {
    if (!sesionDate) return
    const rows = (noticias || [])
      .filter(n => n && /^\d{1,2}:\d{2}/.test(String(n.hora || '')))
      .map(n => ({ sesion_date: sesionDate, hora: String(n.hora).slice(0, 5), nombre: (n.nombre || '').trim() || null }))
    const { error: delErr } = await supa.from('sesion_noticias').delete().eq('sesion_date', sesionDate)
    if (delErr) { console.warn('No se pudieron limpiar las noticias:', delErr.message); return }
    if (!rows.length) return
    const { error } = await supa.from('sesion_noticias').insert(rows)
    if (error) console.warn('No se pudieron guardar las noticias:', error.message)
  },

  // ── Checklist de disciplina (catálogo dinámico) ───────────────────────────
  // El checklist es la capa 'proceso' del rulebook canónico `reglas` (es_checklist=true).
  // Se devuelven con alias (codigo→clave, titulo→texto, activa→activo) para conservar
  // la forma que esperan el formulario, métricas y caché.
  async getChecklistItems({ force = false, soloActivos = false } = {}) {
    if (_checklistCache && !force) {
      return soloActivos ? _checklistCache.filter(i => i.activo !== false) : _checklistCache
    }
    const { data, error } = await supa
      .from('catalogo_reglas')
      // `bloquea_go` = hay que marcarla para dar GO; `aplica_si` = condición de
      // contexto del día (siempre|dia_fomc|hay_noticia); `evidencia` = auto|declarada.
      .select('id, clave:codigo, fase, setup, texto:titulo, enunciado, orden, activo:activa, peso, bloquea_go, aplica_si, evidencia, campo')
      .eq('es_checklist', true)
      .order('fase', { ascending: true })
      .order('orden', { ascending: true })
    if (error || !data || !data.length) {
      _checklistCache = CHECKLIST_DEFAULT
    } else {
      _checklistCache = data
    }
    return soloActivos ? _checklistCache.filter(i => i.activo !== false) : _checklistCache
  },

  // ── Setups paramétricos ──────────────────────────────────────────────────
  // Familias (iri, reingreso, …). Cachea; `force` recarga tras editar el catálogo.
  async getSetups({ force = false, soloActivos = true } = {}) {
    if (!_setupsCache || force) {
      const { data, error } = await supa
        .from('catalogo_setups')
        .select('codigo, nombre, descripcion, orden, activo')
        .order('orden', { ascending: true })
      _setupsCache = (error || !data) ? [] : data
    }
    return soloActivos ? _setupsCache.filter(s => s.activo !== false) : _setupsCache
  },

  // Variantes operativas (IRI Apertura Alcista, …). `setup` filtra por familia.
  async getSetupVariantes({ force = false, soloActivos = true, setup = null } = {}) {
    if (!_variantesCache || force) {
      const { data, error } = await supa
        .from('catalogo_setup_variantes')
        .select('codigo, setup_codigo, nombre, subtipo, direccion, orden, activo')
        .order('orden', { ascending: true })
      _variantesCache = (error || !data) ? [] : data
    }
    let out = soloActivos ? _variantesCache.filter(v => v.activo !== false) : _variantesCache
    if (setup) out = out.filter(v => v.setup_codigo === setup)
    return out
  },

  // Versiones sincrónicas (tras una carga previa; [] si aún no cargó).
  setupsSync() { return (_setupsCache || []).filter(s => s.activo !== false) },
  setupVariantesSync() { return (_variantesCache || []).filter(v => v.activo !== false) },

  // Familia ('iri'|'reingreso'|null) del setup de una sesión. Fuente única.
  setupFamily(sesion) { return setupFamilyOf(sesion) },

  // Etiqueta visible de una familia ('iri' → 'IRI'). Cae al propio código.
  setupLabel(codigo) {
    const s = (_setupsCache || []).find(x => x.codigo === codigo)
    return s ? s.nombre : (codigo || '')
  },

  // ── Alta/edición de setups (pantalla Datos → Setups) ─────────────────────
  // El `codigo` es la clave estable (lo referencian catalogo_reglas.setup y
  // sesiones.setup_codigo), así que se deriva del nombre UNA vez y no se toca
  // al renombrar: cambiar el nombre no debe romper el histórico.
  _slug(txt) {
    return (txt || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'setup'
  },

  async addSetup({ nombre, descripcion = null }) {
    const base = this._slug(nombre)
    const existentes = (await this.getSetups({ force: true, soloActivos: false })).map(s => s.codigo)
    let codigo = base, i = 2
    while (existentes.includes(codigo)) codigo = `${base}_${i++}`
    const orden = existentes.length + 1
    const { data, error } = await supa.from('catalogo_setups')
      .insert({ codigo, nombre, descripcion, orden, activo: true }).select('*').single()
    if (error) throw error
    _setupsCache = null
    return data
  },

  async updateSetup(codigo, patch) {
    const { error } = await supa.from('catalogo_setups').update(patch).eq('codigo', codigo)
    if (error) throw error
    _setupsCache = null
  },

  async addSetupVariante({ setup_codigo, nombre, direccion = 'ambas', subtipo = null }) {
    const base = this._slug(nombre)
    const todas = await this.getSetupVariantes({ force: true, soloActivos: false })
    const existentes = todas.map(v => v.codigo)
    let codigo = base, i = 2
    while (existentes.includes(codigo)) codigo = `${base}_${i++}`
    const orden = todas.length + 1
    const { data, error } = await supa.from('catalogo_setup_variantes')
      .insert({ codigo, setup_codigo, nombre, direccion, subtipo, orden, activo: true })
      .select('*').single()
    if (error) throw error
    _variantesCache = null
    return data
  },

  async updateSetupVariante(codigo, patch) {
    const { error } = await supa.from('catalogo_setup_variantes').update(patch).eq('codigo', codigo)
    if (error) throw error
    _variantesCache = null
  },

  // Precarga de catálogos que otros módulos consultan de forma sincrónica.
  async preloadCatalogos() {
    await Promise.all([
      this.getSetups().catch(() => {}),
      this.getSetupVariantes().catch(() => {}),
      this.getChecklistItems().catch(() => {}),
      // Sin esto, `cuentaPrincipal()` devuelve el fallback histórico hasta que
      // alguien la pida, y el Coach analizaría la cuenta equivocada.
      this.fetchCuentaPrincipal().catch(() => {}),
    ])
  },

  // Claves activas (sincrónico, tras una carga previa). Fallback al default.
  checklistClaves() {
    return (_checklistCache || CHECKLIST_DEFAULT).filter(i => i.activo !== false).map(i => i.clave)
  },

  // Ítems activos cacheados (sincrónico). Fallback al default.
  checklistItemsSync() {
    return (_checklistCache || CHECKLIST_DEFAULT).filter(i => i.activo !== false)
  },

  async addChecklistItem({ fase, texto, orden = 0 }) {
    const codigo = 'chk_' + Date.now().toString(36)
    const { data, error } = await supa
      .from('catalogo_reglas')
      .insert({ codigo, titulo: texto, enunciado: texto, capa: 'proceso', tipo: 'blanda', fase, es_checklist: true, orden, activa: true })
      .select('id, clave:codigo, fase, texto:titulo, orden, activo:activa')
      .single()
    if (error) throw error
    _checklistCache = null
    return data
  },

  // patch del editor: { activo } | { fase } | { texto }. Se traduce a columnas de `reglas`.
  async updateChecklistItem(id, patch) {
    const map = { updated_at: new Date().toISOString() }
    if ('texto' in patch) map.titulo = patch.texto
    if ('activo' in patch) map.activa = patch.activo
    if ('fase' in patch) map.fase = patch.fase
    if ('orden' in patch) map.orden = patch.orden
    const { error } = await supa.from('catalogo_reglas').update(map).eq('id', id)
    if (error) throw error
    _checklistCache = null
  },

  async deleteChecklistItem(id) {
    // Soft-delete: la regla tiene historial en sesion_checklist (FK). Se desactiva
    // en vez de borrar; el cliente la filtra por activa y la disciplina se preserva.
    const { error } = await supa.from('catalogo_reglas').update({ activa: false }).eq('id', id)
    if (error) throw error
    _checklistCache = null
  },

  // ── Casuísticas ──────────────────────────────────────────────────────────

  // Nota: estas funciones ahora leen/escriben en `diagnostico_errores` (ocurrencias).
  // Se conserva el alias `casuistica:error` para no romper a los consumidores
  // existentes; las columnas nuevas (tipo, origen, descripcion, catalogo_id) van incluidas.
  async getCasuisticasByDate(date) {
    const { data, error } = await supa
      .from('diagnostico_errores')
      .select('id, sesion_date, casuistica:error, tipo, resultado, origen, descripcion, catalogo_id, fase, regla_vista, regla_codigo, recomendacion_ia, recomendacion_manual, recomendacion:recomendacion_id(nombre), created_at')
      .eq('sesion_date', date)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async saveCasuistica(sesionDate, casuistica, resultado, tipo = null, fase = null) {
    const { data, error } = await supa
      .from('diagnostico_errores')
      .insert({ sesion_date: sesionDate, error: casuistica, resultado, tipo, origen: 'manual', fase })
      .select('id, sesion_date, casuistica:error, tipo, resultado, origen, descripcion, catalogo_id, fase, created_at')
      .single()
    if (error) throw error
    return data
  },

  async deleteCasuistica(id) {
    const { error } = await supa
      .from('diagnostico_errores')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getAllCasuisticas() {
    const { data, error } = await supa
      .from('diagnostico_errores')
      .select('id, sesion_date, casuistica:error, tipo, resultado, origen, descripcion, catalogo_id, fase, regla_vista, regla_codigo, created_at')
      .order('sesion_date', { ascending: false })
    if (error) throw error
    return data
  },

  async getCasuisticasByMonth(year, month) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
    const { data, error } = await supa
      .from('diagnostico_errores')
      .select('sesion_date')
      .gte('sesion_date', from)
      .lte('sesion_date', to)
    if (error) throw error
    return data
  },

  // ── Fechas especiales (catalogo_fechas: fomc | festivo | vacaciones | otro) ─

  // Todas las fechas activas de un año (para el calendario y la sección Fechas).
  async getFechasEspeciales(year = null) {
    let q = supa.from('catalogo_fechas').select('*').eq('activa', true)
    if (year) q = q.gte('fecha', `${year}-01-01`).lte('fecha', `${year}-12-31`)
    const { data, error } = await q.order('fecha', { ascending: true })
    if (error) throw error
    return data || []
  },

  async addFechaEspecial(payload) {
    const { data, error } = await supa.from('catalogo_fechas').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async updateFechaEspecial(id, patch) {
    const { error } = await supa.from('catalogo_fechas').update(patch).eq('id', id)
    if (error) throw error
  },

  async deleteFechaEspecial(id) {
    const { error } = await supa.from('catalogo_fechas').delete().eq('id', id)
    if (error) throw error
  },

  // ── Catálogo Casuísticas ─────────────────────────────────────────────────

  async getCatalogoCasuisticas() {
    const { data, error } = await supa
      .from('catalogo_errores')
      .select('*')
      .order('orden', { ascending: true })
    if (error) throw error
    return data
  },

  async addCatalogoCasuistica(nombre, tipo = null, fase = null) {
    const { data: all } = await supa.from('catalogo_errores').select('orden').order('orden', { ascending: false }).limit(1)
    const orden = (all?.[0]?.orden || 0) + 1
    let { data, error } = await supa.from('catalogo_errores').insert({ nombre, tipo, fase, orden }).select().single()
    // Reintento sin `fase` por si la columna aún no existe (pre-migración)
    if (error && /fase/i.test(error.message || '')) {
      ;({ data, error } = await supa.from('catalogo_errores').insert({ nombre, tipo, orden }).select().single())
    }
    if (error) throw error
    return data
  },

  async toggleCatalogoCasuistica(id, activa) {
    const { error } = await supa.from('catalogo_errores').update({ activa }).eq('id', id)
    if (error) throw error
  },

  async renameCatalogoCasuistica(id, nombre) {
    const { error } = await supa.from('catalogo_errores').update({ nombre }).eq('id', id)
    if (error) throw error
  },

  async updateCasuisticaTipo(id, tipo) {
    const { error } = await supa.from('catalogo_errores').update({ tipo: tipo || null }).eq('id', id)
    if (error) throw error
  },

  async updateCasuisticaFase(id, fase) {
    const { error } = await supa.from('catalogo_errores').update({ fase: fase || null }).eq('id', id)
    if (error) throw error
  },

  async deleteCatalogoCasuistica(id) {
    const { error } = await supa.from('catalogo_errores').delete().eq('id', id)
    if (error) throw error
  },

  async updateCasuisticaOrden(id, orden) {
    const { error } = await supa.from('catalogo_errores').update({ orden }).eq('id', id)
    if (error) throw error
  },

  // ── Catálogo Emociones ───────────────────────────────────────────────────

  async getCatalogoEmociones() {
    const { data, error } = await supa
      .from('catalogo_emociones')
      .select('*')
      .eq('activa', true)
      .order('orden', { ascending: true })
    if (error) throw error
    return data
  },

  async addCatalogoEmocion(nombre, emoji) {
    const { data: all } = await supa.from('catalogo_emociones').select('orden').order('orden', { ascending: false }).limit(1)
    const orden = (all?.[0]?.orden || 0) + 1
    const { data, error } = await supa.from('catalogo_emociones').insert({ nombre, emoji: emoji || '😐', orden }).select().single()
    if (error) throw error
    return data
  },

  async toggleCatalogoEmocion(id, activa) {
    const { error } = await supa.from('catalogo_emociones').update({ activa }).eq('id', id)
    if (error) throw error
  },

  async renameCatalogoEmocion(id, nombre, emoji) {
    const { error } = await supa.from('catalogo_emociones').update({ nombre, emoji }).eq('id', id)
    if (error) throw error
  },

  async deleteCatalogoEmocion(id) {
    const { error } = await supa.from('catalogo_emociones').delete().eq('id', id)
    if (error) throw error
  },

  async updateEmocionOrden(id, orden) {
    const { error } = await supa.from('catalogo_emociones').update({ orden }).eq('id', id)
    if (error) throw error
  },

  // ── Rulebook canónico (reglas) ───────────────────────────────────────────
  // (Reemplaza a estrategia_chaumer y setup_reglas, retiradas en Fase 4.)
  async getReglas({ capa = null, soloActivas = false } = {}) {
    let q = supa.from('catalogo_reglas').select('*')
    if (capa) q = q.eq('capa', capa)
    if (soloActivas) q = q.eq('activa', true)
    const { data, error } = await q
      .order('capa', { ascending: true })
      .order('orden', { ascending: true })
    if (error) throw error
    return data
  },

  async addRegla(payload) {
    const { data, error } = await supa.from('catalogo_reglas').insert(payload).select('*').single()
    if (error) throw error
    _checklistCache = null
    return data
  },

  async updateRegla(id, patch) {
    const { error } = await supa.from('catalogo_reglas')
      .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    _checklistCache = null
  },

  async deleteRegla(id) {
    // Soft-delete: si es regla de checklist tiene historial en sesion_checklist (FK).
    // Se desactiva en vez de borrar para no romper la integridad ni la disciplina.
    const { error } = await supa.from('catalogo_reglas').update({ activa: false }).eq('id', id)
    if (error) throw error
    _checklistCache = null
  },

  // ── Diagnósticos Diarios ─────────────────────────────────────────────────

  async getDiagnosticoByDate(date) {
    const { data, error } = await supa
      .from('diagnosticos_diarios')
      .select('*')
      .eq('sesion_date', date)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async saveDiagnostico(payload) {
    const { error } = await supa
      .from('diagnosticos_diarios')
      .upsert(payload, { onConflict: 'sesion_date' })
    if (error) throw error
  },

  // `antesDe` (YYYY-MM-DD, EXCLUSIVA): solo diagnósticos de días anteriores. El Coach
  // la pasa con la fecha analizada para no meterle en el prompt lo que pasó DESPUÉS
  // de ese día (al re-analizar el 8-jul se le colaban los resúmenes de agosto).
  // Sin ella devuelve todo el historial (la sección Historial lo lista completo).
  async getHistorialCompacto(limit = 60, antesDe = null) {
    let q = supa
      .from('diagnosticos_diarios')
      .select('sesion_date, sec_resumen_compacto, setups_json, estado_emocional_fin_id, patron_detectado, patron_descripcion')
      .not('sec_resumen_compacto', 'is', null)
    if (antesDe) q = q.lt('sesion_date', antesDe)
    const { data, error } = await q
      .order('sesion_date', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },

  // ── Errores de la IA (ocurrencias: diagnostico_errores) ──────────────────

  // Guarda los errores confirmados de la IA. Cada error trae { nombre, tipo, detalle }.
  // - Crea la entrada en catalogo_errores si el nombre es nuevo.
  // - Dedup por nombre: si coincide con uno manual del día → lo marca 'ambos'.
  async saveErroresIA(sesionDate, errores) {
    // Reset: borrar IA previos y revertir 'ambos' → 'manual'
    await supa.from('diagnostico_errores').delete().eq('sesion_date', sesionDate).eq('origen', 'ia')
    await supa.from('diagnostico_errores').update({ origen: 'manual' })
      .eq('sesion_date', sesionDate).eq('origen', 'ambos')

    if (!errores?.length) return

    // Ocurrencias existentes del día
    const { data: existentes } = await supa.from('diagnostico_errores')
      .select('id, error, origen').eq('sesion_date', sesionDate)
    const existMap = {}
    ;(existentes || []).forEach(e => { existMap[(e.error || '').toLowerCase().trim()] = e })

    // Catálogo de errores (para enlazar o crear)
    const { data: cat } = await supa.from('catalogo_errores').select('id, nombre, orden')
    const catMap = {}
    let maxOrden = 0
    ;(cat || []).forEach(c => {
      catMap[(c.nombre || '').toLowerCase().trim()] = c.id
      if ((c.orden || 0) > maxOrden) maxOrden = c.orden
    })

    // Catálogo de recomendaciones (para enlazar o crear)
    const { data: catRec } = await supa.from('catalogo_recomendaciones').select('id, nombre')
    const recCatMap = {}
    ;(catRec || []).forEach(r => { recCatMap[(r.nombre || '').toLowerCase().trim()] = r.id })

    for (const e of errores) {
      const nombre = (e.nombre || '').trim()
      if (!nombre) continue
      const key = nombre.toLowerCase()

      const match = existMap[key]
      if (match) {
        // ya existe ese día (manual) → confirmado por ambos
        if (match.origen === 'manual') {
          const upd = { origen: 'ambos', descripcion: e.detalle || null }
          if (e.fase) upd.fase = e.fase
          if (e.reglaVista != null) upd.regla_vista = e.reglaVista
          if (e.reglaCodigo) upd.regla_codigo = e.reglaCodigo
          await supa.from('diagnostico_errores').update(upd).eq('id', match.id)
        }
        continue
      }

      // Enlazar o crear en el catálogo
      let catId = catMap[key]
      if (!catId) {
        const { data: creado } = await supa.from('catalogo_errores')
          .insert({ nombre, tipo: e.tipo || null, orden: ++maxOrden, activa: true })
          .select('id').single()
        catId = creado?.id || null
        catMap[key] = catId
      }

      // Enlazar o crear recomendación en el catálogo
      let recId = null
      const recNombre = (e.recNombre || '').trim()
      if (recNombre && recNombre.toLowerCase() !== 'ninguna') {
        const recKey = recNombre.toLowerCase()
        if (!recCatMap[recKey]) {
          const { data: allRec } = await supa.from('catalogo_recomendaciones').select('orden').order('orden', { ascending: false }).limit(1)
          const recOrden = (allRec?.[0]?.orden || 0) + 1
          const { data: recCreado } = await supa.from('catalogo_recomendaciones')
            .insert({ nombre: recNombre, tipo: e.tipo || null, orden: recOrden, activa: true })
            .select('id').single()
          recId = recCreado?.id || null
          recCatMap[recKey] = recId
        } else {
          recId = recCatMap[recKey]
        }
      }

      await supa.from('diagnostico_errores').insert({
        sesion_date: sesionDate,
        error: nombre,
        tipo: e.tipo || null,
        resultado: e.resultado || null,
        descripcion: e.detalle || null,
        catalogo_id: catId,
        origen: 'ia',
        fase: e.fase || null,
        regla_vista: e.reglaVista == null ? null : e.reglaVista,
        // Regla del checklist que este error contradice (NULL = ninguna). Hace que
        // la disciplina la cuente como incumplida aunque la casilla esté marcada.
        regla_codigo: e.reglaCodigo || null,
        recomendacion_id: recId,
        recomendacion_ia: (e.recTexto && e.recTexto.toLowerCase() !== 'ninguna') ? e.recTexto : null,
        recomendacion_manual: e.recManual || null,
      })
      existMap[key] = { origen: 'ia' }
    }
  },

  // Errores recientes (planos) para detección de patrones e historial.
  // Devuelve `descripcion` (alias de error) para compatibilidad con el Coach.
  // `antesDe` (YYYY-MM-DD, EXCLUSIVA): mismo criterio que `getHistorialCompacto`.
  // Los patrones repetidos que ve el Coach deben ser los que ya existían ESE día,
  // no los que se acumularon después.
  async getErroresHistoricos(limit = 600, antesDe = null) {
    let q = supa
      .from('diagnostico_errores')
      .select('sesion_date, tipo, descripcion:error, origen, resultado')
    if (antesDe) q = q.lt('sesion_date', antesDe)
    const { data, error } = await q
      .order('sesion_date', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },

  // ── Catálogo de Recomendaciones ──────────────────────────────────────────

  async getCatalogoRecomendaciones() {
    const { data, error } = await supa
      .from('catalogo_recomendaciones')
      .select('*')
      .order('orden', { ascending: true })
    if (error) throw error
    return data
  },

  async addCatalogoRecomendacion(nombre, tipo = null) {
    const { data: all } = await supa.from('catalogo_recomendaciones').select('orden').order('orden', { ascending: false }).limit(1)
    const orden = (all?.[0]?.orden || 0) + 1
    const { data, error } = await supa.from('catalogo_recomendaciones').insert({ nombre, tipo, orden }).select().single()
    if (error) throw error
    return data
  },

  async toggleCatalogoRecomendacion(id, activa) {
    const { error } = await supa.from('catalogo_recomendaciones').update({ activa }).eq('id', id)
    if (error) throw error
  },

  async updateRecomendacionManual(diagnosticoErrorId, texto) {
    const { error } = await supa.from('diagnostico_errores').update({ recomendacion_manual: texto || null }).eq('id', diagnosticoErrorId)
    if (error) throw error
  },

  // ── Experimentos ─────────────────────────────────────────────────────────

  async getCatalogoExperimentos() {
    const { data, error } = await supa
      .from('catalogo_experimentos')
      .select('*')
      .order('orden', { ascending: true })
    if (error) throw error
    return data
  },

  async addExperimento(nombre, descripcion = null) {
    const { data: all } = await supa.from('catalogo_experimentos').select('orden').order('orden', { ascending: false }).limit(1)
    const orden = (all?.[0]?.orden || 0) + 1
    const { data, error } = await supa.from('catalogo_experimentos').insert({ nombre, descripcion, orden }).select().single()
    if (error) throw error
    return data
  },

  async toggleExperimento(id, activo) {
    const { error } = await supa.from('catalogo_experimentos').update({ activo }).eq('id', id)
    if (error) throw error
  },

  async getExperimentosByDate(date) {
    const { data, error } = await supa
      .from('diagnostico_experimentos')
      .select('*, experimento:catalogo_experimentos(nombre)')
      .eq('sesion_date', date)
    if (error) throw error
    return data
  },

  async saveExperimentoRegistro(sesionDate, experimentoId, presente, resultado, nota, valor) {
    const { error } = await supa
      .from('diagnostico_experimentos')
      .upsert({
        sesion_date: sesionDate,
        experimento_id: experimentoId,
        presente: presente ?? false,
        resultado: resultado || null,
        nota: nota || null,
        valor: valor ?? null,
      }, { onConflict: 'sesion_date,experimento_id' })
    if (error) throw error
  },

  async getAllExperimentoRegistros() {
    const { data, error } = await supa
      .from('diagnostico_experimentos')
      .select('*, experimento:catalogo_experimentos(nombre)')
      .eq('presente', true)
      .order('sesion_date', { ascending: false })
    if (error) throw error
    return data
  },

  // ── Objetivos / reglas ───────────────────────────────────────────────────

  async getObjetivos() {
    const { data, error } = await supa
      .from('objetivos')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
    if (error) throw error
    if (data) _cuentaPrincipalCache = data.cuenta_principal || _cuentaPrincipalCache
    return data
  },

  // Cuenta principal del journal (P&L, análisis, Coach). Cacheada tras la 1ª
  // lectura de objetivos; fallback a la PA histórica si aún no se ha configurado.
  cuentaPrincipal() { return _cuentaPrincipalCache },
  async fetchCuentaPrincipal() {
    try { const o = await this.getObjetivos(); return o?.cuenta_principal || _cuentaPrincipalCache }
    catch { return _cuentaPrincipalCache }
  },

  async saveObjetivos(payload) {
    const { error } = await supa
      .from('objetivos')
      .upsert({ id: 1, ...payload, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    if (error) throw error
    if ('cuenta_principal' in payload && payload.cuenta_principal) _cuentaPrincipalCache = payload.cuenta_principal
  },

  // Nombres de cuenta conocidos (de trades + apex_cuentas) para selectores.
  async getCuentasConocidas() {
    const [t, a] = await Promise.all([
      supa.from('trades').select('account'),
      supa.from('apex_cuentas').select('numero_cuenta'),
    ])
    const set = new Set()
    ;(t.data || []).forEach(r => r.account && set.add(r.account))
    ;(a.data || []).forEach(r => r.numero_cuenta && set.add(r.numero_cuenta))
    return [...set].sort()
  },

  // ── Apex Tracker ─────────────────────────────────────────────────────────

  async getApexCuentas() {
    const { data, error } = await supa
      .from('apex_cuentas')
      .select('*')
      .order('nombre', { ascending: true })
    if (error) throw error
    return data
  },

  async saveApexCuenta(payload) {
    const { data, error } = await supa
      .from('apex_cuentas')
      .upsert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Día manual: vive en apex_trades como tipo='dia' (account = número de cuenta).
  // Idempotente por (account, fecha): borra el día previo y reinserta.
  async saveApexRegistro({ account, fecha, pnl_dia, balance, threshold, contratos, nota }) {
    if (!account) throw new Error('La cuenta necesita número de cuenta para registrar días')
    await supa.from('apex_trades').delete().eq('account', account).eq('trade_date', fecha).eq('tipo', 'dia')
    const { error } = await supa.from('apex_trades').insert({
      account, trade_date: fecha, profit: pnl_dia, balance, threshold,
      contratos: contratos ?? null, nota: nota ?? null, tipo: 'dia',
    })
    if (error) throw error
  },

  async deleteApexRegistro(id) {
    const { error } = await supa.from('apex_trades').delete().eq('id', id)
    if (error) throw error
  },

  async saveApexPlan(cuentaId, perfil, ritmo) {
    const { error } = await supa
      .from('apex_cuentas')
      .update({ plan_perfil: perfil, plan_ritmo: ritmo })
      .eq('id', cuentaId)
    if (error) throw error
  },

  async getApexTrades() {
    const { data, error } = await supa
      .from('apex_trades')
      .select('*')
      .order('trade_date', { ascending: true })
      .order('entry_time', { ascending: true })
    if (error) throw error
    return data
  },

  // ── Autenticación (Supabase Auth) ──────────────────────────────────────────
  async getSession() {
    const { data } = await supa.auth.getSession()
    return data.session
  },
  async signIn(email, password) {
    const { error } = await supa.auth.signInWithPassword({ email, password })
    if (error) throw error
  },
  async signOut() {
    await supa.auth.signOut()
  },

}
