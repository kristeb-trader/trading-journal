// Data access layer — all Supabase queries go here
const { createClient } = supabase
const supa = createClient(SUPABASE_URL, SUPABASE_KEY)

const DB = {
  // ── Trades ──────────────────────────────────────────────────────────────

  async getTrades(filters = {}) {
    let q = supa.from('trades').select('*').order('entry_time', { ascending: false })
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
    const { data, error } = await supa
      .from('sesiones')
      .upsert(payload, { onConflict: 'sesion_date' })
      .select()
    if (error) throw error
    return data
  },

  // ── Reglas ───────────────────────────────────────────────────────────────

  async getRules() {
    const { data, error } = await supa
      .from('reglas')
      .select('*')
      .eq('activa', true)
      .order('orden', { ascending: true })
    if (error) throw error
    return data
  },
}
