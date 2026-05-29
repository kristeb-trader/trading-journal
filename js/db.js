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

  // Nota: estas funciones ahora leen/escriben en `errores_sesion` (registro
  // unificado). Se conserva el alias `casuistica:error` para no romper a los
  // consumidores existentes; las columnas nuevas (tipo, origen) van incluidas.
  async getCasuisticasByDate(date) {
    const { data, error } = await supa
      .from('errores_sesion')
      .select('id, sesion_date, casuistica:error, tipo, resultado, origen, created_at')
      .eq('sesion_date', date)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async saveCasuistica(sesionDate, casuistica, resultado, tipo = null) {
    const { data, error } = await supa
      .from('errores_sesion')
      .insert({ sesion_date: sesionDate, error: casuistica, resultado, tipo, origen: 'manual' })
      .select('id, sesion_date, casuistica:error, tipo, resultado, origen, created_at')
      .single()
    if (error) throw error
    return data
  },

  async deleteCasuistica(id) {
    const { error } = await supa
      .from('errores_sesion')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getAllCasuisticas() {
    const { data, error } = await supa
      .from('errores_sesion')
      .select('id, sesion_date, casuistica:error, tipo, resultado, origen, created_at')
      .order('sesion_date', { ascending: false })
    if (error) throw error
    return data
  },

  async getCasuisticasByMonth(year, month) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
    const { data, error } = await supa
      .from('errores_sesion')
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
      .from('catalogo_casuisticas')
      .select('*')
      .order('orden', { ascending: true })
    if (error) throw error
    return data
  },

  async addCatalogoCasuistica(nombre, tipo = null) {
    const { data: all } = await supa.from('catalogo_casuisticas').select('orden').order('orden', { ascending: false }).limit(1)
    const orden = (all?.[0]?.orden || 0) + 1
    const { data, error } = await supa.from('catalogo_casuisticas').insert({ nombre, tipo, orden }).select().single()
    if (error) throw error
    return data
  },

  async toggleCatalogoCasuistica(id, activa) {
    const { error } = await supa.from('catalogo_casuisticas').update({ activa }).eq('id', id)
    if (error) throw error
  },

  async renameCatalogoCasuistica(id, nombre) {
    const { error } = await supa.from('catalogo_casuisticas').update({ nombre }).eq('id', id)
    if (error) throw error
  },

  async updateCasuisticaTipo(id, tipo) {
    const { error } = await supa.from('catalogo_casuisticas').update({ tipo: tipo || null }).eq('id', id)
    if (error) throw error
  },

  async deleteCatalogoCasuistica(id) {
    const { error } = await supa.from('catalogo_casuisticas').delete().eq('id', id)
    if (error) throw error
  },

  async updateCasuisticaOrden(id, orden) {
    const { error } = await supa.from('catalogo_casuisticas').update({ orden }).eq('id', id)
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

  // ── Errores de la IA (registro unificado: errores_sesion) ────────────────

  // Reemplaza los errores IA del día y aplica dedup contra los manuales:
  // - si un error IA coincide con uno manual del día → ese manual pasa a 'ambos'
  // - si es nuevo → se inserta con origen 'ia'
  async saveErroresIA(sesionDate, errores) {
    // Reset: borrar IA previos y revertir 'ambos' → 'manual' para recalcular
    await supa.from('errores_sesion').delete().eq('sesion_date', sesionDate).eq('origen', 'ia')
    await supa.from('errores_sesion').update({ origen: 'manual' })
      .eq('sesion_date', sesionDate).eq('origen', 'ambos')

    if (!errores?.length) return

    const { data: existentes } = await supa.from('errores_sesion')
      .select('id, error, origen').eq('sesion_date', sesionDate)
    const existMap = {}
    ;(existentes || []).forEach(e => { existMap[(e.error || '').toLowerCase().trim()] = e })

    const toInsert = []
    for (const e of errores) {
      const desc = (e.descripcion || '').trim()
      const key = desc.toLowerCase()
      if (!desc) continue
      const match = existMap[key]
      if (match) {
        if (match.origen === 'manual') {
          await supa.from('errores_sesion').update({ origen: 'ambos' }).eq('id', match.id)
        }
      } else {
        toInsert.push({ sesion_date: sesionDate, error: desc, tipo: e.tipo || null, origen: 'ia' })
        existMap[key] = { origen: 'ia' } // evitar duplicar entre los propios IA
      }
    }
    if (toInsert.length) {
      const { error } = await supa.from('errores_sesion').insert(toInsert)
      if (error) throw error
    }
  },

  // Errores recientes (planos) para detección de patrones e historial.
  // Devuelve `descripcion` (alias de error) para compatibilidad con el Coach.
  async getErroresHistoricos(limit = 600) {
    const { data, error } = await supa
      .from('errores_sesion')
      .select('sesion_date, tipo, descripcion:error, origen')
      .order('sesion_date', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  },

}
