/**
 * El vigilante del plan de Chaumer (chaumer/01_Plan). Solo lee: no cambia nada.
 *
 *   node scripts/plan/vigilar.mjs              informe: enseña lo que no cuadra, sale con 0
 *   node scripts/plan/vigilar.mjs --estricto   sale con 1 si encuentra algo (para cerrar un commit plan:)
 *
 * Fase 0 de la reestructuración (docs/disenos/2026-09-25-reglas-chaumer.md §4.5): hoy va en
 * MODO INFORME sobre el formato actual (reglas.json + los .md). Con la F2 pasa a vigilar los
 * siete archivos de reglas/ y se vuelve estricto.
 *
 * Qué mira:
 *   1. códigos definidos dos veces (P, C, G, D en los títulos de los documentos)
 *   2. reglas citadas que no existen en reglas.json
 *   3. valores de un parámetro escritos a mano en vez de su nombre
 *   4. nombres de parámetro que no existen en PARAMETROS.md
 *   5. versiones y cuentas de reglas que no coinciden entre documentos
 *   6. historia dentro de las reglas (fechas, «palabras del operador», el motor…)
 *   7. palabras sin tilde en reglas.json
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { leerReglas, DIR_REGLAS } from './leer-reglas.mjs'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const PLAN = path.join(RAIZ, 'chaumer', '01_Plan')
const ESTRICTO = process.argv.includes('--estricto')

const leer = (f) => fs.readFileSync(path.join(PLAN, f), 'utf8').replace(/\r\n/g, '\n')
const hallazgos = []   // { apartado, texto }
const anota = (apartado, texto) => hallazgos.push({ apartado, texto })

// La fuente de las reglas: los siete archivos de reglas/ si existen (F2 de la reestructuración, diseño §4.5);
// si no, reglas.json, como hasta el 26/09/2026.
const NUEVAS = fs.existsSync(DIR_REGLAS)
let reglas, FUENTE
if (NUEVAS) {
  const leidas = leerReglas()
  reglas = leidas.reglas
  FUENTE = 'reglas/'
  for (const e of leidas.errores) anota('0 · Plantilla de las reglas', e)
} else {
  reglas = JSON.parse(leer('reglas.json'))
  FUENTE = 'reglas.json'
}
const ids = new Set(reglas.map((r) => r.id))
const DOCS = fs.readdirSync(PLAN).filter((f) => f.endsWith('.md'))
// Los documentos que describen el plan de HOY. TRADING_PLAN_CHAUMER.md, GALERIA.md, PENDIENTES.md, HISTORIAL.md y
// CIERRE_FASE_1.md cuentan también su historia, y citan a propósito códigos de versiones anteriores.
const VIVOS = ['CHECKLIST_DIARIA.md', 'GLOSARIO.md', 'PARAMETROS.md', 'CONTEXTUALIZACION.md', 'ESTADO.md']

// Los textos de una regla, campo a campo, para poder decir dónde está cada cosa.
function camposDe(r) {
  const out = NUEVAS
    ? [['regla', r.regla], ['cómo se aplica', r.como_se_aplica], ['si no se cumple', r.si_no_se_cumple],
       ['excepciones', r.excepciones], ['por qué', r.porque], ['pendiente', r.pendiente]]
    : [['enunciado', r.enunciado], ['accion', r.accion], ['nota', r.nota], ['estado', r.estado],
       ...(r.condiciones || []).map((c) => [`condiciones.${c.variable}`, c.valor]),
       ...(r.excepciones || []).map((e) => ['excepciones', e])]
  return out.filter(([, v]) => typeof v === 'string' && v.trim())
}
const textoDeReglas = () => reglas.map((r) => camposDe(r).map(([, v]) => v).join('\n')).join('\n')

// ── 1 · Códigos definidos dos veces ───────────────────────────────────────────
for (const f of DOCS) {
  const vistos = new Map()
  leer(f).split('\n').forEach((linea, i) => {
    const m = linea.match(/^#{1,4}\s+(.*)$/)
    if (!m) return
    // quita emoji, marcas y adornos del principio: «🆕 C-08 ·», «✅ `P-22` ·», «~~P-19 ·»
    const titulo = m[1].replace(/^[^\p{L}\p{N}]+/u, '').replace(/^[`~*]+/, '')
    const c = titulo.match(/^([PCGD]-\d{2})\b/)
    if (!c) return
    if (!vistos.has(c[1])) vistos.set(c[1], [])
    vistos.get(c[1]).push(i + 1)
  })
  for (const [cod, lineas] of vistos) {
    if (lineas.length > 1) anota('1 · Códigos definidos dos veces', `${cod} en ${f}, líneas ${lineas.join(' y ')}`)
  }
}

// ── 2 · Reglas citadas que no existen ─────────────────────────────────────────
{
  const fuentes = [[FUENTE, NUEVAS ? textoDeReglas() : JSON.stringify(reglas)], ...VIVOS.map((f) => [f, leer(f)])]
  for (const [f, t] of fuentes) {
    const faltan = [...new Set(t.match(/\bR-\d{2}\b/g) || [])].filter((id) => !ids.has(id))
    if (faltan.length) anota('2 · Reglas citadas que no existen', `${f}: ${faltan.join(', ')}`)
  }
}

// ── 3 · Valores de parámetro escritos a mano ──────────────────────────────────
// Cada patrón es el VALOR de un parámetro. Si el valor cambia en PARAMETROS.md, el vigilante lo
// avisa (el patrón deja de encontrarse allí) y hay que cambiarlo aquí.
const PARAMETROS = leer('PARAMETROS.md')
const VALORES = [
  ['STOP_MAX', /\b80\s*(?:puntos|pts)\b/gi, /\*\*80 puntos\*\*/],
  ['ATM_DEFECTO', /\b320\s*ticks\b/gi, /\*\*320 ticks\*\*/],
  ['PLAZO_CONSECUCION', /\b(?:5|cinco) velas\b/gi, /\*\*5 velas/],
  ['UMBRAL_VOL', /\b8\.?000\b/g, /> 8\.000 contratos/],
  ['VENTANA_NOTICIA', /±\s?5\s?min/gi, /±5 minutos/],
  ['CANCELACION_FINAL', /\b11:29\b/g, /11:29 ET/],
]
for (const [nombre, , enParametros] of VALORES) {
  if (!enParametros.test(PARAMETROS)) {
    anota('3 · Valores de parámetro escritos a mano',
      `⚠ el vigilante busca el valor viejo de ${nombre}: ya no está así en PARAMETROS.md. Actualiza VALORES en vigilar.mjs`)
  }
}
{
  const cuenta = new Map()   // `${nombre} · ${sitio}` -> n
  const suma = (k, n) => cuenta.set(k, (cuenta.get(k) || 0) + n)
  for (const r of reglas) {
    for (const [campo, texto] of camposDe(r)) {
      if (!NUEVAS && (campo === 'estado' || campo === 'nota')) continue   // la historia se mira en el apartado 6
      for (const [nombre, patron] of VALORES) {
        const n = (texto.match(patron) || []).length
        if (n) suma(`${nombre} · ${FUENTE} (${r.id})`, n)
      }
    }
  }
  const checklist = leer('CHECKLIST_DIARIA.md')
  for (const [nombre, patron] of VALORES) {
    const n = (checklist.match(patron) || []).length
    if (n) suma(`${nombre} · CHECKLIST_DIARIA.md`, n)
  }
  const porParametro = new Map()
  for (const [k, n] of cuenta) {
    const [nombre, sitio] = k.split(' · ')
    if (!porParametro.has(nombre)) porParametro.set(nombre, [])
    porParametro.get(nombre).push(`${sitio}${n > 1 ? ` ×${n}` : ''}`)
  }
  for (const [nombre, sitios] of porParametro) {
    anota('3 · Valores de parámetro escritos a mano', `${nombre}: ${sitios.join(' · ')}`)
  }
}

// ── 4 · Parámetros que no existen ────────────────────────────────────────────
{
  const definidos = new Set((PARAMETROS.match(/\*\*`([A-Z][A-Z0-9_]+)`\*\*/g) || []).map((s) => s.replace(/[*`]/g, '')))
  // Los nombres de documento también van en mayúsculas con guion bajo: no son parámetros.
  const documentos = new Set([...DOCS.map((f) => f.replace(/\.md$/, '')), 'PROPUESTAS_AL_PLAN', 'PENDIENTE_PORTAL'])
  const fuentes = [[FUENTE, NUEVAS ? textoDeReglas() : JSON.stringify(reglas)], ['CHECKLIST_DIARIA.md', leer('CHECKLIST_DIARIA.md')]]
  for (const [f, t] of fuentes) {
    const citados = [...new Set(t.match(/\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/g) || [])]
    const faltan = citados.filter((p) => !definidos.has(p) && !documentos.has(p))
    if (faltan.length) anota('4 · Parámetros que no existen en PARAMETROS.md', `${f}: ${faltan.join(', ')}`)
  }
}

// ── 5 · Versiones y cuentas ──────────────────────────────────────────────────
{
  const version = (f, re) => (leer(f).match(re) || [])[1] || '¿?'
  const versiones = {
    'ESTADO.md': version('ESTADO.md', /\*\*v(\d+\.\d+)\*\*/),
    ...(fs.existsSync(path.join(PLAN, 'TRADING_PLAN_CHAUMER.md'))
      ? { 'TRADING_PLAN_CHAUMER.md': version('TRADING_PLAN_CHAUMER.md', /\*\*Versión:\*\*\s*(\d+\.\d+)/) } : {}),
    'CHECKLIST_DIARIA.md': version('CHECKLIST_DIARIA.md', /\*\*Versión del plan:\*\*\s*(\d+\.\d+)/),
  }
  if (new Set(Object.values(versiones)).size > 1) {
    anota('5 · Versiones y cuentas', 'versión del plan distinta: ' +
      Object.entries(versiones).map(([f, v]) => `${f} ${v}`).join(' · '))
  }
  // La cuenta de reglas que declara la cabecera de cada documento (sus primeras 15 líneas) y las
  // instrucciones del proyecto, contra las que hay de verdad en reglas.json.
  const cabeceras = [
    ...['ESTADO.md', 'TRADING_PLAN_CHAUMER.md', 'CHECKLIST_DIARIA.md', 'PENDIENTES.md']
      .filter((f) => fs.existsSync(path.join(PLAN, f)))
      .map((f) => [f, leer(f).split('\n').slice(0, 15).join('\n')]),
    ['chaumer/CLAUDE.md', fs.readFileSync(path.join(RAIZ, 'chaumer', 'CLAUDE.md'), 'utf8')],
  ]
  for (const [f, t] of cabeceras) {
    const dicen = [...new Set((t.match(/\b(\d{2})\s+reglas\b/g) || []).map((s) => parseInt(s, 10)))]
    const mal = dicen.filter((n) => n !== reglas.length)
    if (mal.length) anota('5 · Versiones y cuentas', `${f} dice ${mal.join(' y ')} reglas; ${FUENTE} tiene ${reglas.length}`)
  }
}

// ── 6 · Historia dentro de las reglas ────────────────────────────────────────
{
  const FECHA = NUEVAS ? /(?!)/g : /\b\d{1,2}\/\d{2}\/20\d{2}\b|\b20\d{2}-\d{2}-\d{2}\b/g
  // En los archivos nuevos, la fecha de un caso real está bien: lo que no, una marca de cambio con su fecha.
  const MARCAS = NUEVAS
    ? /\b(?:confirmad|precisad|corregid|reescrit|ampliad|añadid|unificad|fusionad|simplificad)[oa]s?\b[^.\n]{0,25}\d{1,2}\/\d{2}\/20\d{2}|secci[oó]n creada|\bestado:|regresi[oó]n|antes dec[ií]a/gi
    : /palabras del operador|\bmotor\b|regresi[oó]n|\bampliad[ao]\b|\breescrit[ao]\b|\bcorregid[ao]\b/gi
  let fechas = 0, marcas = 0
  const peores = []
  for (const r of reglas) {
    let fr = 0, mr = 0
    for (const [, texto] of camposDe(r)) {
      fr += (texto.match(FECHA) || []).length
      mr += (texto.match(MARCAS) || []).length
    }
    fechas += fr; marcas += mr
    if (fr + mr) peores.push([r.id, fr, mr])
  }
  if (fechas + marcas) {
    peores.sort((a, b) => (b[1] + b[2]) - (a[1] + a[2]))
    anota('6 · Historia dentro de las reglas',
      `${fechas} fechas y ${marcas} marcas de historia en ${peores.length} de ${reglas.length} reglas. Las que más: ` +
      peores.slice(0, 6).map(([id, f, m]) => `${id} (${f} fechas, ${m} marcas)`).join(' · '))
  }
}

// ── 7 · Palabras sin tilde en reglas.json ────────────────────────────────────
{
  const SIN_TILDE = /\b(?:grafico|unicamente|tamano|condicion|consecucion|continuacion|minimo|maximo|sesion|direccion|despues|numero|operacion|segun|tambien|mas alla|linea|parametro|posicion|ultim[ao])\b/gi
  const n = ((NUEVAS ? textoDeReglas() : JSON.stringify(reglas)).match(SIN_TILDE) || []).length
  if (n) anota(`7 · Palabras sin tilde en ${FUENTE}`, `${n} apariciones de palabras comunes sin tilde («grafico», «sesion», «continuacion»…)`)
}

// ── Informe ──────────────────────────────────────────────────────────────────
console.log(`Vigilante del plan · ${reglas.length} reglas en ${FUENTE} · modo ${ESTRICTO ? 'estricto' : 'informe'}\n`)
if (!hallazgos.length) {
  console.log('✔ Nada que señalar.')
  process.exit(0)
}
let apartado = null
for (const h of hallazgos) {
  if (h.apartado !== apartado) { apartado = h.apartado; console.log(`\n${apartado}`) }
  console.log(`  ✘ ${h.texto}`)
}
const apartados = new Set(hallazgos.map((h) => h.apartado)).size
console.log(`\n${hallazgos.length} hallazgos en ${apartados} de ${NUEVAS ? 8 : 7} apartados.`)
process.exit(ESTRICTO ? 1 : 0)
