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

  async getCasuisticasByDate(date) {
    const { data, error } = await supa
      .from('sesion_casuisticas')
      .select('*')
      .eq('sesion_date', date)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async saveCasuistica(sesionDate, casuistica, resultado) {
    const { data, error } = await supa
      .from('sesion_casuisticas')
      .insert({ sesion_date: sesionDate, casuistica, resultado })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteCasuistica(id) {
    const { error } = await supa
      .from('sesion_casuisticas')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getAllCasuisticas() {
    const { data, error } = await supa
      .from('sesion_casuisticas')
      .select('*')
      .order('sesion_date', { ascending: false })
    if (error) throw error
    return data
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

  async addCatalogoCasuistica(nombre) {
    const { data: all } = await supa.from('catalogo_casuisticas').select('orden').order('orden', { ascending: false }).limit(1)
    const orden = (all?.[0]?.orden || 0) + 1
    const { data, error } = await supa.from('catalogo_casuisticas').insert({ nombre, orden }).select().single()
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

  async deleteCatalogoCasuistica(id) {
    const { error } = await supa.from('catalogo_casuisticas').delete().eq('id', id)
    if (error) throw error
  },

  // ── Catálogo Reglas ──────────────────────────────────────────────────────

  async getCatalogoReglas() {
    const { data, error } = await supa
      .from('catalogo_reglas')
      .select('*')
      .order('orden', { ascending: true })
    if (error) throw error
    return data
  },

  async addCatalogoRegla(nombre) {
    const { data: all } = await supa.from('catalogo_reglas').select('orden').order('orden', { ascending: false }).limit(1)
    const orden = (all?.[0]?.orden || 0) + 1
    const { data, error } = await supa.from('catalogo_reglas').insert({ nombre, orden }).select().single()
    if (error) throw error
    return data
  },

  async toggleCatalogoRegla(id, activa) {
    const { error } = await supa.from('catalogo_reglas').update({ activa }).eq('id', id)
    if (error) throw error
  },

  async renameCatalogoRegla(id, nombre) {
    const { error } = await supa.from('catalogo_reglas').update({ nombre }).eq('id', id)
    if (error) throw error
  },

  async deleteCatalogoRegla(id) {
    const { error } = await supa.from('catalogo_reglas').delete().eq('id', id)
    if (error) throw error
  },
}
