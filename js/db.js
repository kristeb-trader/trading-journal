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

// Hidrata una sesión: expone checklist[clave] como propiedades s[clave] para que
// el código que aún lee s.chk_zonas (calendario, charts, métricas) siga funcionando.
function hydrateChecklist(s) {
  if (s && s.checklist && typeof s.checklist === 'object') Object.assign(s, s.checklist)
  return s
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
      .select('*')
      .order('sesion_date', { ascending: false })
    if (error) throw error
    return (data || []).map(hydrateChecklist)
  },

  async getSesionByDate(date) {
    const { data, error } = await supa
      .from('sesiones')
      .select('*')
      .eq('sesion_date', date)
      .maybeSingle()
    if (error) throw error
    return hydrateChecklist(data)
  },

  async upsertSesion(payload) {
    // El checklist (JSONB) lo escribimos directo a Supabase: el Worker /api/session
    // (no versionado) no conoce ese campo. El resto va por el Worker como siempre.
    const { checklist, ...rest } = payload
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
    // Escritura directa del JSONB (tras crear/actualizar la fila por el Worker).
    if (checklist && rest.sesion_date) {
      const { error } = await supa.from('sesiones').update({ checklist }).eq('sesion_date', rest.sesion_date)
      if (error) console.warn('No se pudo guardar el checklist (¿migración pendiente?):', error.message)
    }
  },

  // ── Checklist de disciplina (catálogo dinámico) ───────────────────────────
  async getChecklistItems({ force = false, soloActivos = false } = {}) {
    if (_checklistCache && !force) {
      return soloActivos ? _checklistCache.filter(i => i.activo !== false) : _checklistCache
    }
    const { data, error } = await supa
      .from('checklist_items')
      .select('*')
      .order('fase', { ascending: true })
      .order('orden', { ascending: true })
    if (error || !data || !data.length) {
      _checklistCache = CHECKLIST_DEFAULT
    } else {
      _checklistCache = data
    }
    return soloActivos ? _checklistCache.filter(i => i.activo !== false) : _checklistCache
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
    const clave = 'chk_' + Date.now().toString(36)
    const { data, error } = await supa
      .from('checklist_items')
      .insert({ clave, fase, texto, orden })
      .select('*')
      .single()
    if (error) throw error
    _checklistCache = null
    return data
  },

  async updateChecklistItem(id, patch) {
    const { error } = await supa.from('checklist_items').update(patch).eq('id', id)
    if (error) throw error
    _checklistCache = null
  },

  async deleteChecklistItem(id) {
    const { error } = await supa.from('checklist_items').delete().eq('id', id)
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
      .select('id, sesion_date, casuistica:error, tipo, resultado, origen, descripcion, catalogo_id, fase, regla_vista, recomendacion_ia, recomendacion_manual, recomendacion:recomendacion_id(nombre), created_at')
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
      .select('id, sesion_date, casuistica:error, tipo, resultado, origen, descripcion, catalogo_id, fase, regla_vista, created_at')
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

  // ── FOMC Dates ───────────────────────────────────────────────────────────

  async getFomcDates(year, month) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
    const { data, error } = await supa
      .from('fomc_dates')
      .select('date')
      .gte('date', from)
      .lte('date', to)
    if (error) throw error
    return data.map(r => r.date)
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

  // ── Estrategia Chaumer ───────────────────────────────────────────────────

  async getEstrategiaSecciones() {
    const { data, error } = await supa
      .from('estrategia_chaumer')
      .select('*')
      .eq('activa', true)
      .order('orden', { ascending: true })
    if (error) throw error
    return data
  },

  async updateEstrategiaSeccion(id, contenido) {
    const { error } = await supa
      .from('estrategia_chaumer')
      .update({ contenido, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  // ── Reglas por Setup ─────────────────────────────────────────────────────

  async getSetupReglas() {
    const { data, error } = await supa
      .from('setup_reglas')
      .select('*')
      .order('orden', { ascending: true })
    if (error) throw error
    return data
  },

  async saveSetupRegla(payload) {
    const { error } = await supa
      .from('setup_reglas')
      .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'setup,direccion' })
    if (error) throw error
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

  async getHistorialCompacto(limit = 60) {
    const { data, error } = await supa
      .from('diagnosticos_diarios')
      .select('sesion_date, sec_resumen_compacto, setups_json, estado_emocional_fin_id, patron_detectado, patron_descripcion')
      .not('sec_resumen_compacto', 'is', null)
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
        recomendacion_id: recId,
        recomendacion_ia: (e.recTexto && e.recTexto.toLowerCase() !== 'ninguna') ? e.recTexto : null,
        recomendacion_manual: e.recManual || null,
      })
      existMap[key] = { origen: 'ia' }
    }
  },

  // Errores recientes (planos) para detección de patrones e historial.
  // Devuelve `descripcion` (alias de error) para compatibilidad con el Coach.
  async getErroresHistoricos(limit = 600) {
    const { data, error } = await supa
      .from('diagnostico_errores')
      .select('sesion_date, tipo, descripcion:error, origen, resultado')
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
    return data
  },

  async saveObjetivos(payload) {
    const { error } = await supa
      .from('objetivos')
      .upsert({ id: 1, ...payload, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    if (error) throw error
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

  // Lector de transición: días viejos en apex_registros (pre-unificación).
  // Tras correr la migración y dropear la tabla, esto devuelve [] y se ignora.
  async getApexRegistros() {
    const { data, error } = await supa
      .from('apex_registros')
      .select('*')
      .order('fecha', { ascending: true })
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
