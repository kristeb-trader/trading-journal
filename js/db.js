// Data access layer — all Supabase queries go here
const { createClient } = supabase
const supa = createClient(SUPABASE_URL, SUPABASE_KEY)

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
    return data
  },

  async getSesionByDate(date) {
    const { data, error } = await supa
      .from('sesiones')
      .select('*')
      .eq('sesion_date', date)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async upsertSesion(payload) {
    const secret = localStorage.getItem('dashboard_secret') || ''
    const res = await fetch('https://broad-hall-c53f.kristerock.workers.dev/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Dashboard-Token': secret,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Error ${res.status}: ${text}`)
    }
  },

  // ── Casuísticas ──────────────────────────────────────────────────────────

  // Nota: estas funciones ahora leen/escriben en `diagnostico_errores` (ocurrencias).
  // Se conserva el alias `casuistica:error` para no romper a los consumidores
  // existentes; las columnas nuevas (tipo, origen, descripcion, catalogo_id) van incluidas.
  async getCasuisticasByDate(date) {
    const { data, error } = await supa
      .from('diagnostico_errores')
      .select('id, sesion_date, casuistica:error, tipo, resultado, origen, descripcion, catalogo_id, recomendacion_ia, recomendacion_manual, recomendacion:recomendacion_id(nombre), created_at')
      .eq('sesion_date', date)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async saveCasuistica(sesionDate, casuistica, resultado, tipo = null) {
    const { data, error } = await supa
      .from('diagnostico_errores')
      .insert({ sesion_date: sesionDate, error: casuistica, resultado, tipo, origen: 'manual' })
      .select('id, sesion_date, casuistica:error, tipo, resultado, origen, descripcion, catalogo_id, created_at')
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
      .select('id, sesion_date, casuistica:error, tipo, resultado, origen, descripcion, catalogo_id, created_at')
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

  async addCatalogoCasuistica(nombre, tipo = null) {
    const { data: all } = await supa.from('catalogo_errores').select('orden').order('orden', { ascending: false }).limit(1)
    const orden = (all?.[0]?.orden || 0) + 1
    const { data, error } = await supa.from('catalogo_errores').insert({ nombre, tipo, orden }).select().single()
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
          await supa.from('diagnostico_errores').update({ origen: 'ambos', descripcion: e.detalle || null }).eq('id', match.id)
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

  async getApexRegistros() {
    const { data, error } = await supa
      .from('apex_registros')
      .select('*')
      .order('fecha', { ascending: true })
    if (error) throw error
    return data
  },

  async saveApexRegistro(payload) {
    const { error } = await supa
      .from('apex_registros')
      .upsert(payload, { onConflict: 'cuenta_id,fecha' })
    if (error) throw error
  },

  async deleteApexRegistro(id) {
    const { error } = await supa.from('apex_registros').delete().eq('id', id)
    if (error) throw error
  },

}
