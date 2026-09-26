/**
 * El lector de las reglas del plan de Chaumer: chaumer/01_Plan/reglas/*.md → datos.
 *
 *   node scripts/plan/leer-reglas.mjs                     comprueba la plantilla y resume
 *   node scripts/plan/leer-reglas.mjs --salida <ruta>     además escribe el JSON en <ruta>
 *
 * Es la ÚNICA pieza que entiende el formato de los siete archivos de grupo. Todo lo demás
 * (portal, sincronizar.mjs, generar_ficha.py, el vigilante) lee el JSON que escribe esto.
 * Diseño: docs/disenos/2026-09-25-reglas-chaumer.md §4.3.
 *
 * La plantilla de un archivo de grupo:
 *
 *   # 4 · Setup y entrada                 el grupo: su número (= el del archivo) y su nombre
 *   > cuándo se opera                     una línea que lo describe
 *   (texto de entrada, opcional)
 *
 *   ## R-40 · Corrida fluida              cada regla: su código y un nombre corto
 *   > La regla, en 1–3 frases.            obligatoria
 *   | | |                                 la tabla de datos (ver CLAVES)
 *   |---|---|
 *   | Aplica a | Continuación |
 *   ### Cómo se aplica                    y sus apartados, en este orden (ver APARTADOS);
 *   ### Si no se cumple                   dentro de un apartado, los subtítulos van con ####
 *   ### Excepciones
 *   ### Por qué                           (Cómo se aplica es obligatorio; los demás, si hay)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const DIR_REGLAS = path.join(RAIZ, 'chaumer', '01_Plan', 'reglas')

// Los apartados de una regla, en su orden. `clave` es el campo del JSON.
const APARTADOS = [
  { titulo: 'Cómo se aplica', clave: 'como_se_aplica', obligatorio: true },
  { titulo: 'Si no se cumple', clave: 'si_no_se_cumple', obligatorio: false },
  { titulo: 'Excepciones', clave: 'excepciones', obligatorio: false },
  // Opcional: seis reglas no tienen explicación en el plan, y escribirla sería inventar metodología.
  { titulo: 'Por qué', clave: 'porque', obligatorio: false },
]

// Las filas de la tabla de datos. `lista`: códigos o nombres separados por «·».
const CLAVES = {
  'Aplica a': { clave: 'aplica_a', obligatoria: true, lista: 'texto' },
  'Parámetros': { clave: 'parametros', obligatoria: true, lista: 'parametro' },
  'Relacionadas': { clave: 'relacionadas', obligatoria: true, lista: 'regla' },
  'Casos': { clave: 'casos', obligatoria: true, lista: 'caso' },
  'Apartado': { clave: 'apartado', obligatoria: false },
  'Fuente': { clave: 'fuente', obligatoria: false },
  'Pendiente': { clave: 'pendiente', obligatoria: false },
  'Absorbe': { clave: 'absorbe', obligatoria: false, lista: 'regla' },
}
const FORMATO = {
  parametro: /^[A-Z][A-Z0-9_]+$/,
  regla: /^R-\d{2}$/,
  caso: /^G-\d{2}$/,
  texto: /./,
}

const VACIO = /^(—|-|–)?$/

function lista(valor, tipo, error) {
  const v = valor.trim()
  if (VACIO.test(v)) return []
  return v.split(/\s*·\s*/).map((x) => x.replace(/`/g, '').trim()).filter((x) => {
    if (FORMATO[tipo].test(x)) return true
    error(`«${x}» no es un ${tipo} válido`)
    return false
  })
}

/** Lee un archivo de grupo. Devuelve { grupo, reglas } y apunta en `errores` lo que no cumple la plantilla. */
function leerArchivo(ruta, errores) {
  const nombreArchivo = path.basename(ruta)
  const m = nombreArchivo.match(/^(\d)-([a-z-]+)\.md$/)
  if (!m) { errores.push(`${nombreArchivo}: el nombre tiene que ser «N-grupo.md»`); return null }
  const grupo = { id: m[2].replace(/-/g, '_'), orden: Number(m[1]), nombre: null, descripcion: null, entrada: '' }
  const lineas = fs.readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n').split('\n')

  const reglas = []
  let regla = null        // la regla en curso
  let apartado = null     // { clave, texto } en curso, dentro de la regla
  let fase = 'cabecera'   // cabecera → entrada → regla (enunciado → tabla → apartados)
  let enCodigo = false

  const donde = (i) => `${nombreArchivo}:${i + 1}`
  const cierraApartado = () => {
    if (regla && apartado) regla._apartados.push(apartado)
    apartado = null
  }
  const cierraRegla = () => {
    cierraApartado()
    if (regla) reglas.push(regla)
    regla = null
  }

  lineas.forEach((linea, i) => {
    if (/^\s*```/.test(linea)) enCodigo = !enCodigo
    const h = enCodigo ? null : linea.match(/^(#{1,6})\s+(.*)$/)

    if (h && h[1].length === 1) {
      const g = h[2].match(/^(\d)\s*·\s*(.+)$/)
      if (grupo.nombre || !g) { errores.push(`${donde(i)}: solo puede haber un título de grupo, «# N · Nombre»`); return }
      if (Number(g[1]) !== grupo.orden) errores.push(`${donde(i)}: el grupo dice ${g[1]} y el archivo ${grupo.orden}`)
      grupo.nombre = g[2].trim()
      fase = 'descripcion'
      return
    }
    if (h && h[1].length === 2) {
      cierraRegla()
      const r = h[2].match(/^(R-\d{2})\s*·\s*(.+)$/)
      if (!r) { errores.push(`${donde(i)}: un «##» tiene que ser una regla, «## R-xx · Nombre»`); fase = 'fuera'; return }
      regla = { id: r[1], nombre: r[2].trim(), _linea: donde(i), _enunciado: [], _tabla: [], _apartados: [] }
      fase = 'enunciado'
      return
    }
    if (h && h[1].length === 3 && regla) {
      cierraApartado()
      const a = APARTADOS.find((x) => x.titulo === h[2].trim())
      if (!a) { errores.push(`${donde(i)}: «### ${h[2]}» no es un apartado de la plantilla (${APARTADOS.map((x) => x.titulo).join(' · ')}). Los subtítulos van con ####`); return }
      apartado = { clave: a.clave, titulo: a.titulo, lineas: [] }
      fase = 'apartados'
      return
    }
    if (h && h[1].length === 3) { errores.push(`${donde(i)}: «###» fuera de una regla`); return }

    // Líneas que no son título
    if (fase === 'descripcion') {
      if (/^>\s?/.test(linea)) { grupo.descripcion = ((grupo.descripcion ? grupo.descripcion + ' ' : '') + linea.replace(/^>\s?/, '')).trim(); return }
      if (linea.trim() === '' && !grupo.descripcion) return
      fase = 'entrada'
    }
    if (fase === 'entrada') { grupo.entrada += linea + '\n'; return }
    if (fase === 'enunciado') {
      if (/^>\s?/.test(linea)) { regla._enunciado.push(linea.replace(/^>\s?/, '')); return }
      if (linea.trim() === '') return
      if (/^\|/.test(linea)) { fase = 'tabla' } else { errores.push(`${donde(i)}: después del título de ${regla.id} va la regla, como cita («> …»)`); return }
    }
    if (fase === 'tabla') {
      if (/^\|/.test(linea)) { regla._tabla.push([linea, i]); return }
      if (linea.trim() === '') return
      errores.push(`${donde(i)}: texto suelto en ${regla.id} entre la tabla y el primer apartado`)
      return
    }
    if (fase === 'apartados' && apartado) { apartado.lineas.push(linea); return }
    if (linea.trim() !== '') errores.push(`${donde(i)}: texto fuera de sitio`)
  })
  cierraRegla()

  if (!grupo.nombre) errores.push(`${nombreArchivo}: falta el título del grupo, «# N · Nombre»`)
  if (!grupo.descripcion) errores.push(`${nombreArchivo}: falta la línea que describe el grupo («> …» bajo el título)`)
  grupo.entrada = grupo.entrada.trim()

  // De la regla en bruto a los datos, comprobando la plantilla
  const salida = reglas.map((r) => {
    const err = (t) => errores.push(`${r._linea} (${r.id}): ${t}`)
    const d = {
      id: r.id, nombre: r.nombre, grupo: grupo.id, grupo_nombre: grupo.nombre, grupo_orden: grupo.orden,
      regla: r._enunciado.join('\n').trim(),
    }
    if (!d.regla) err('falta la regla (la cita «> …» bajo el título)')

    const vistas = new Set()
    for (const [linea] of r._tabla) {
      const celdas = linea.split('|').slice(1, -1).map((c) => c.trim())
      if (celdas.length !== 2) { err(`fila de tabla con ${celdas.length} columnas: ${linea}`); continue }
      const [k, v] = celdas
      if (k === '' && v === '') continue             // cabecera vacía «| | |»
      if (/^-+$/.test(k.replace(/:/g, ''))) continue   // separador
      const def = CLAVES[k]
      if (!def) { err(`«${k}» no es una fila de la tabla (${Object.keys(CLAVES).join(' · ')})`); continue }
      if (vistas.has(k)) err(`la fila «${k}» está dos veces`)
      vistas.add(k)
      d[def.clave] = def.lista ? lista(v, def.lista, err) : (VACIO.test(v) ? null : v)
    }
    for (const [k, def] of Object.entries(CLAVES)) {
      if (def.obligatoria && !vistas.has(k)) err(`falta la fila «${k}» (si no tiene, «—»)`)
      if (!(def.clave in d)) d[def.clave] = def.lista ? [] : null
    }
    if (grupo.id === 'zonas' && !d.apartado) err('en zonas, la fila «Apartado» es obligatoria (Marcado o Vigencia)')

    let orden = -1
    for (const a of r._apartados) {
      const pos = APARTADOS.findIndex((x) => x.clave === a.clave)
      if (pos <= orden) err(`«${a.titulo}» está fuera de orden o repetido`)
      orden = Math.max(orden, pos)
      const texto = a.lineas.join('\n').trim()
      if (!texto) err(`«${a.titulo}» está vacío: si no aplica, se quita`)
      d[a.clave] = texto || null
    }
    for (const a of APARTADOS) {
      if (!(a.clave in d)) d[a.clave] = null
      if (a.obligatorio && !d[a.clave]) err(`falta el apartado «${a.titulo}»`)
    }
    return d
  })
  return { grupo, reglas: salida }
}

/** Lee los siete archivos. Devuelve { grupos, reglas, errores }. */
export function leerReglas(dir = DIR_REGLAS) {
  const errores = []
  if (!fs.existsSync(dir)) return { grupos: [], reglas: [], errores: [`no existe ${dir}`] }
  const archivos = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()
  const grupos = [], reglas = []
  for (const f of archivos) {
    const r = leerArchivo(path.join(dir, f), errores)
    if (!r) continue
    grupos.push({ ...r.grupo, n: r.reglas.length })
    reglas.push(...r.reglas)
  }
  const ordenes = grupos.map((g) => g.orden)
  if (new Set(ordenes).size !== ordenes.length) errores.push('dos archivos con el mismo número de grupo')

  // Entre archivos: códigos únicos, referencias que existen
  const ids = new Map()
  reglas.forEach((r, i) => {
    r.orden = i + 1
    if (ids.has(r.id)) errores.push(`${r.id} está definida dos veces`)
    ids.set(r.id, r)
  })
  for (const r of reglas) {
    for (const x of [...r.relacionadas, ...r.absorbe]) {
      if (x === r.id) errores.push(`${r.id} se cita a sí misma`)
      else if (!ids.has(x) && !r.absorbe.includes(x)) errores.push(`${r.id} cita ${x}, que no existe`)
    }
  }
  return { grupos, reglas, errores }
}

/** El JSON que leen las máquinas (se escribe como reglas.json en la F2c). */
export function aJson({ grupos, reglas }) {
  const fusionadas = {}
  for (const r of reglas) for (const x of r.absorbe) fusionadas[x] = r.id
  return {
    _leeme: 'GENERADO por scripts/plan/leer-reglas.mjs desde chaumer/01_Plan/reglas/*.md. No se edita a mano.',
    grupos: grupos.map(({ id, orden, nombre, descripcion, n }) => ({ id, orden, nombre, descripcion, n })),
    fusionadas,
    reglas,
  }
}

// ── Uso por línea de órdenes ─────────────────────────────────────────────────
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const datos = leerReglas()
  const i = process.argv.indexOf('--salida')
  for (const g of datos.grupos) console.log(`${g.orden} · ${g.nombre.padEnd(26)} ${String(g.n).padStart(2)} reglas`)
  console.log(`   ${datos.reglas.length} reglas en ${datos.grupos.length} grupos`)
  if (datos.errores.length) {
    console.log(`\n✘ ${datos.errores.length} fallos de plantilla:`)
    for (const e of datos.errores) console.log('  ' + e)
    process.exit(1)
  }
  console.log('✔ Todas cumplen la plantilla.')
  if (i > 0) {
    const ruta = path.resolve(process.argv[i + 1])
    fs.writeFileSync(ruta, JSON.stringify(aJson(datos), null, 2) + '\n')
    console.log(`JSON → ${path.relative(RAIZ, ruta)}`)
  }
}
