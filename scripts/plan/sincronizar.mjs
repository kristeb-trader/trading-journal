/**
 * El plan de Chaumer → catalogo_reglas del Journal. Un solo sentido.
 *
 *   node scripts/plan/sincronizar.mjs            informe + SQL en scripts/plan/salida.sql
 *
 * Lee (SOLO LECTURA: el plan se cambia aparte, con el sí de Kris, D-028):
 *   chaumer/01_Plan/CHECKLIST_DIARIA.md   las líneas de la checklist diaria
 *   chaumer/01_Plan/reglas/*.md           las reglas del plan, con el lector (leer-reglas.mjs)
 *   chaumer/01_Plan/PARAMETROS.md         el valor de cada parámetro, para el texto del Journal
 * y el mapa del Journal (scripts/plan/mapa-casillas.json): qué líneas son casilla o
 * automática. Todo lo demás es guía.
 *
 * Genera el SQL que deja en catalogo_reglas, en la etapa 2:
 *   · las reglas del plan          (origen plan_regla, capa plan, no checklist)
 *   · cada línea de la checklist   (origen plan_linea, casilla/auto → checklist; guía → no)
 *   · las automáticas que salen de una regla (origen plan_regla, tipo auto, checklist)
 * El SQL lo aplica Claude por el MCP de Supabase. No hace falta ninguna clave.
 *
 * Nunca borra: lo que ya no está en el plan pasa a activa = false y su historial sigue
 * contando en la disciplina (la disciplina no mira `activa`).
 * Si una casilla o automática del mapa no se encuentra en el plan, lo dice y NO la
 * toca: se queda como estaba hasta que se arregle el mapa.
 *
 * Diseño: docs/disenos/2026-09-24-etapa-plan-chaumer.md §5 · desde el 26/09/2026, las reglas en siete
 * archivos de grupo: docs/disenos/2026-09-25-reglas-chaumer.md §4.6.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { leerReglas, textoPlano, valoresDeParametros, DIR_REGLAS } from './leer-reglas.mjs'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PLAN = path.join(RAIZ, 'chaumer', '01_Plan')
const ETAPA = 2

const mapa = JSON.parse(fs.readFileSync(path.join(RAIZ, 'scripts', 'plan', 'mapa-casillas.json'), 'utf8'))
const leidas = leerReglas()
if (leidas.errores.length) {
  console.error('✘ Las reglas no cumplen la plantilla (node scripts/plan/leer-reglas.mjs):')
  leidas.errores.forEach(e => console.error('  ' + e))
  process.exit(1)
}
const reglas = leidas.reglas
const valoresParam = valoresDeParametros()
// El Journal no lee Markdown: la regla va en texto plano y con cada parámetro ya resuelto («80 puntos»).
const plano = t => textoPlano(t, valoresParam)
const md = fs.readFileSync(path.join(PLAN, 'CHECKLIST_DIARIA.md'), 'utf8').split(/\r?\n/)

const limpia = t => String(t)
  .replace(/\*\*|`|\*/g, '')
  .replace(/^\s*\((solo [^)]+)\)\s*/i, '')
  .replace(/\s+/g, ' ')
  .trim()
const norma = t => limpia(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9≤]+/g, ' ').trim()
const esRef = t => /^\s*(`?[RPDGF]-?\d+(\.\d+)?`?[\s,/]*)+$/.test(t)
const refsDe = t => [...new Set((t.match(/\bR-\d+\b/g) || []))]

// ── Las líneas de la checklist ─────────────────────────────────────────────
const lineas = []
let bloque = '', sub = ''
for (let i = 0; i < md.length; i++) {
  const l = md[i]
  if (l.startsWith('## ')) { bloque = limpia(l.slice(3)); sub = ''; continue }
  if (l.startsWith('### ')) { sub = limpia(l.slice(4)); continue }
  if (!/^\|\s*☐\s*\|/.test(l)) continue
  if (/^\|\s*-{3,}/.test(md[i + 1] || '')) continue            // fila de encabezado
  const celdas = l.split('|').slice(2, -1).map(c => c.trim()).filter(Boolean)
  // La checklist cita los números por su parámetro (`STOP_MAX`) desde la 3.16: el Journal los lee ya resueltos.
  const texto = celdas.filter(c => !esRef(c) && !/^[—–-]$/.test(c)).map(c => limpia(plano(c))).join(' — ')
  lineas.push({ n: lineas.length + 1, bloque: sub ? `${bloque} · ${sub}` : bloque, texto, reglas: refsDe(l) })
}

// ── Casar el mapa con las líneas ───────────────────────────────────────────
const avisos = []
const porLinea = new Map()
for (const c of mapa.casillas.filter(c => c.linea)) {
  const f = norma(c.linea)
  const hits = lineas.filter(l => norma(l.texto).includes(f))
  if (hits.length !== 1) { avisos.push(`✘ ${c.codigo}: «${c.linea}» casa con ${hits.length} líneas del plan (tiene que ser 1). No se toca.`); continue }
  porLinea.set(hits[0].n, c)
}

// ── Filas de catalogo_reglas ───────────────────────────────────────────────
const filas = []
const q = v => v == null ? 'null' : (typeof v === 'boolean' || typeof v === 'number') ? String(v) : `'${String(v).replace(/'/g, "''")}'`
const arr = a => a && a.length ? `array[${a.map(q).join(',')}]::text[]` : 'null'

reglas.forEach(r => filas.push({
  codigo: r.id, titulo: plano(r.nombre), enunciado: plano(r.regla), capa: 'plan', tipo: 'dura',
  fase: null, setup: null, es_checklist: false, orden: r.orden, evidencia: null, bloquea_go: false,
  aplica_si: 'siempre', plan_reglas: [r.id], origen: 'plan_regla', plan_tipo: null,
  plan_bloque: r.grupo_nombre, campo: null,
}))

lineas.forEach(l => {
  const c = porLinea.get(l.n)
  if (c) {
    filas.push({
      codigo: c.codigo, titulo: l.texto, enunciado: l.texto, capa: 'proceso', tipo: 'dura',
      fase: c.fase, setup: c.setup, es_checklist: true, orden: c.orden,
      evidencia: c.tipo === 'auto' ? 'auto' : 'declarada', bloquea_go: c.bloquea_go, aplica_si: c.aplica_si,
      plan_reglas: l.reglas, origen: 'plan_linea', plan_tipo: c.tipo, plan_bloque: l.bloque, campo: c.campo || null,
      plan_linea: l.n,
    })
  } else {
    const h = crypto.createHash('sha1').update(norma(l.texto)).digest('hex').slice(0, 8)
    filas.push({
      codigo: `p2_g_${h}`, titulo: l.texto, enunciado: l.texto, capa: 'plan', tipo: 'blanda',
      fase: null, setup: null, es_checklist: false, orden: 100 + l.n, evidencia: null, bloquea_go: false,
      aplica_si: 'siempre', plan_reglas: l.reglas, origen: 'plan_linea', plan_tipo: 'guia',
      plan_bloque: l.bloque, campo: null, plan_linea: l.n,
    })
  }
})

for (const c of mapa.casillas.filter(c => c.regla)) {
  const r = reglas.find(x => x.id === c.regla)
  if (!r) { avisos.push(`✘ ${c.codigo}: la regla ${c.regla} no está en reglas/. No se toca.`); continue }
  filas.push({
    codigo: c.codigo, titulo: plano(r.regla), enunciado: plano(r.regla), capa: 'proceso', tipo: 'dura',
    fase: c.fase, setup: c.setup, es_checklist: true, orden: c.orden, evidencia: 'auto',
    bloquea_go: c.bloquea_go, aplica_si: c.aplica_si, plan_reglas: [r.id], origen: 'plan_regla',
    plan_tipo: 'auto', plan_bloque: r.grupo_nombre, campo: c.campo || null,
  })
}

const dup = filas.map(f => f.codigo).filter((c, i, a) => a.indexOf(c) !== i)
if (dup.length) { console.error('✘ Códigos repetidos (dos líneas con el mismo texto):', dup.join(', ')); process.exit(1) }

// ── SQL ────────────────────────────────────────────────────────────────────
const cols = ['codigo', 'titulo', 'enunciado', 'capa', 'tipo', 'fase', 'setup', 'es_checklist', 'orden', 'evidencia',
  'bloquea_go', 'aplica_si', 'plan_reglas', 'origen', 'plan_tipo', 'plan_bloque', 'campo', 'plan_linea']
const valores = filas.map(f => `  (${cols.map(k => k === 'plan_reglas' ? arr(f[k]) : q(f[k])).join(', ')}, 'vigente', true, ${ETAPA})`)
const intocables = mapa.casillas.map(c => c.codigo).filter(c => !filas.some(f => f.codigo === c))

const sql = `-- Generado por scripts/plan/sincronizar.mjs el ${new Date().toISOString().slice(0, 10)}. No editar a mano.
-- Plan: ${reglas.length} reglas · checklist: ${lineas.length} líneas (${filas.filter(f => f.plan_tipo === 'casilla').length} casillas, ${filas.filter(f => f.plan_tipo === 'auto').length} automáticas, ${filas.filter(f => f.plan_tipo === 'guia').length} guía).
insert into catalogo_reglas (${cols.join(', ')}, estado, activa, etapa) values
${valores.join(',\n')}
on conflict (codigo) do update set
${[...cols.filter(c => c !== 'codigo'), 'estado', 'activa', 'etapa'].map(c => `  ${c} = excluded.${c}`).join(',\n')},
  updated_at = now();

-- Lo que ya no está en el plan se desactiva (nunca se borra: su historial sigue contando).
update catalogo_reglas set activa = false, updated_at = now()
 where etapa = ${ETAPA} and origen in ('plan_linea', 'plan_regla') and activa
   and codigo not in (${[...filas.map(f => f.codigo), ...intocables].map(q).join(', ')});
`
const salida = path.join(RAIZ, 'scripts', 'plan', 'salida.sql')
fs.writeFileSync(salida, sql)

// ── Los documentos del plan para el Coach (fase 6) → plan_documentos ───────
// El Coach los lee enteros, tal cual. Las reglas son los siete archivos de grupo seguidos, en su orden:
// ya son Markdown limpio y sin historia, así que no hace falta convertir nada. Salen a
// scripts/plan/salida-documentos.sql, UN insert por documento, para aplicarlos por el MCP de uno en uno.
const leer = f => fs.readFileSync(path.join(PLAN, f), 'utf8').replace(/\r\n/g, '\n')
const reglasEnTexto = () => fs.readdirSync(DIR_REGLAS).filter(f => f.endsWith('.md')).sort()
  .map(f => leer(path.join('reglas', f)).trim()).join('\n\n---\n\n') + '\n'
const documentos = [
  { nombre: 'reglas', origen: 'reglas/*.md', contenido: reglasEnTexto() },
  { nombre: 'parametros', origen: 'PARAMETROS.md', contenido: leer('PARAMETROS.md') },
  { nombre: 'glosario', origen: 'GLOSARIO.md', contenido: leer('GLOSARIO.md') },
  { nombre: 'checklist', origen: 'CHECKLIST_DIARIA.md', contenido: leer('CHECKLIST_DIARIA.md') },
  { nombre: 'contextualizacion', origen: 'CONTEXTUALIZACION.md',
    contenido: '> ⚠️ RECORDATORIOS DE CRITERIO. NO SON REGLAS: nunca se juzga un incumplimiento con ellos.\n\n' + leer('CONTEXTUALIZACION.md') },
]
const TAG = '$plan_doc$'
const docSql = documentos.map(d => {
  if (d.contenido.includes(TAG)) { console.error(`✘ ${d.nombre} contiene ${TAG}`); process.exit(1) }
  const h = crypto.createHash('sha256').update(d.contenido, 'utf8').digest('hex')
  d.huella = h
  return `-- ${d.nombre} · ${d.origen} · ${d.contenido.length} caracteres\n` +
    `insert into plan_documentos (nombre, contenido, huella, origen) values ('${d.nombre}', ${TAG}${d.contenido}${TAG}, '${h}', '${d.origen}')\n` +
    `on conflict (nombre) do update set contenido = excluded.contenido, huella = excluded.huella, origen = excluded.origen, actualizado = now()\n` +
    ` where plan_documentos.huella is distinct from excluded.huella;\n`
}).join('\n')
fs.writeFileSync(path.join(RAIZ, 'scripts', 'plan', 'salida-documentos.sql'), docSql)

console.log(`Plan: ${reglas.length} reglas · checklist: ${lineas.length} líneas`)
console.log(`  casillas ${filas.filter(f => f.plan_tipo === 'casilla').length} · automáticas ${filas.filter(f => f.plan_tipo === 'auto').length} · guía ${filas.filter(f => f.plan_tipo === 'guia').length} · reglas ${reglas.length}`)
for (const f of filas.filter(f => f.plan_tipo === 'casilla' || f.plan_tipo === 'auto'))
  console.log(`  ${f.plan_tipo === 'auto' ? '⚙' : '✋'} ${f.codigo.padEnd(22)} F${f.fase} ${(f.setup || '—').padEnd(12)} ${f.titulo.slice(0, 70)}`)
avisos.forEach(a => console.log(a))
console.log(avisos.length ? `\n⚠ ${avisos.length} aviso(s). El SQL NO toca esas filas.` : '\n✔ Todo el mapa casa con el plan.')
console.log(`SQL: ${path.relative(RAIZ, salida)} (${filas.length} filas)`)
console.log('Documentos del Coach: ' + documentos.map(d => `${d.nombre} ${Math.round(d.contenido.length / 1024)} KB (${d.huella.slice(0, 12)})`).join(' · ') + ' → scripts/plan/salida-documentos.sql')
