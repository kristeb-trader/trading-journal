/**
 * Lo que comparten las rutas de la bitácora.
 *
 * El guion bajo del nombre es lo que impide que Pages lo publique como ruta.
 *
 * Regla que atraviesa todo este módulo: aquí NO hay metodología. No se valida
 * si una operación cumple el plan, no hay tope de puntos, no se marca nada por
 * apartarse de las reglas. Es un registro de decisiones ya tomadas.
 */

export const DIRECCIONES = ['largo', 'corto'];
export const SETUPS = ['continuacion', 'reingreso'];
export const RESULTADOS = ['target', 'stop'];

export const json = (datos, estado = 200) =>
  new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

/** Comparacion en tiempo constante: sin esto la clave se adivina midiendo
 *  cuanto tarda en fallar. Mismo criterio que en las observaciones. */
function igual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** Leer la bitacora es libre. Escribirla, no. Si CLAVE_OPERADOR no esta
 *  configurada, escribir queda cerrado del todo: mejor eso que abierto. */
export function autorizado(request, env) {
  if (!env.CLAVE_OPERADOR) return false;
  const clave = request.headers.get('x-clave')
    || new URL(request.url).searchParams.get('k') || '';
  return igual(clave, env.CLAVE_OPERADOR);
}

/** Marca de tiempo en ISO, generada aqui y no por la base. Es lo que permite
 *  llevar estas tablas a PostgreSQL sin tocar el esquema. */
export const ahora = () => new Date().toISOString();

export const recorta = (v, max) =>
  (v == null ? null : String(v).trim().slice(0, max) || null);

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{2}:\d{2}$/;

/**
 * Valida una jornada entrante y la deja lista para escribir.
 * Devuelve { error } o { jornada, operaciones }.
 *
 * Solo rechaza lo que corromperia el registro. Un stop de 200 puntos entra
 * sin protestar: el plan dira lo que quiera, pero eso fue lo que pasó.
 */
export function normalizarJornada(cuerpo, cabecera) {
  const fecha = String(cuerpo?.fecha || '').trim();
  if (!FECHA.test(fecha)) return { error: 'La fecha falta o no tiene la forma aaaa-mm-dd' };

  const contratos = Number(cuerpo?.contratos ?? cabecera.contratos);
  if (!Number.isInteger(contratos) || contratos < 1) {
    return { error: 'Los contratos tienen que ser un entero de 1 en adelante' };
  }

  const valorPunto = Number(cuerpo?.valor_punto);
  if (!Number.isFinite(valorPunto) || valorPunto <= 0) {
    return { error: 'Falta el valor del punto, que sale de las reglas del plan' };
  }

  // La comision del broker, congelada en esta jornada igual que los contratos.
  const comision = Number(cuerpo?.comision ?? cabecera.comision ?? 0);
  if (!Number.isFinite(comision) || comision < 0) {
    return { error: 'La comisión tiene que ser un número de 0 en adelante' };
  }

  const instrumento = recorta(cuerpo?.instrumento, 20) || cabecera.instrumento;

  const entrantes = Array.isArray(cuerpo?.operaciones) ? cuerpo.operaciones : [];
  if (entrantes.length > 20) return { error: 'Demasiadas operaciones para una sola jornada' };

  const operaciones = [];
  for (let i = 0; i < entrantes.length; i++) {
    const o = entrantes[i] || {};
    const hora = String(o.hora || '').trim();
    if (!HORA.test(hora)) return { error: `La hora de la operación ${i + 1} no tiene la forma hh:mm` };

    const direccion = String(o.direccion || '').toLowerCase();
    if (!DIRECCIONES.includes(direccion)) return { error: `La dirección de la operación ${i + 1} no existe` };

    const setup = String(o.setup || '').toLowerCase();
    if (!SETUPS.includes(setup)) return { error: `El setup de la operación ${i + 1} no existe` };

    const resultado = String(o.resultado || '').toLowerCase();
    if (!RESULTADOS.includes(resultado)) return { error: `El resultado de la operación ${i + 1} no existe` };

    const puntos = Number(o.puntos);
    if (!Number.isFinite(puntos) || puntos < 0) {
      return { error: `Los puntos de la operación ${i + 1} van siempre en positivo` };
    }

    // Aqui, y solo aqui, se calcula el P&L. Se guarda ya resuelto, y NETO:
    // lo que de verdad entra o sale de la cuenta. La comision se cobra por
    // contrato, que es como cobra un broker, y se resta gane o pierda.
    const signo = resultado === 'stop' ? -1 : 1;
    const bruto = signo * puntos * valorPunto * contratos;
    const comisionOp = Math.round(comision * contratos * 100) / 100;
    const pnl = Math.round((bruto - comisionOp) * 100) / 100;

    operaciones.push({
      orden: i,
      hora,
      direccion,
      setup,
      puntos,
      resultado,
      comision: comisionOp,
      pnl,
      observaciones: recorta(o.observaciones, 2000),
    });
  }

  return {
    jornada: {
      fecha,
      instrumento,
      contratos,
      valor_punto: valorPunto,
      comision,
      imagen: recorta(cuerpo?.imagen, 120),
      notas: recorta(cuerpo?.notas, 2000),
    },
    operaciones,
  };
}

/** La fila de cabecera, creandola la primera vez si no existe. */
export async function leerCabecera(env) {
  const fila = await env.DB
    .prepare('SELECT valor_inicial, contratos, instrumento, comision FROM bt_cabecera WHERE id = 1')
    .first();
  if (fila) return fila;

  const inicial = { valor_inicial: 0, contratos: 1, instrumento: 'MNQ', comision: 0 };
  await env.DB
    .prepare(`INSERT INTO bt_cabecera (id, valor_inicial, contratos, instrumento, comision, actualizada_en)
              VALUES (1, ?, ?, ?, ?, ?)`)
    .bind(inicial.valor_inicial, inicial.contratos, inicial.instrumento, inicial.comision, ahora())
    .run();
  return inicial;
}

/** Las operaciones de una jornada, listas para insertar. */
export function sentenciasDeOperaciones(env, jornadaId, operaciones) {
  const sql = `INSERT INTO bt_operaciones
                 (jornada_id, orden, hora, direccion, setup, puntos, resultado,
                  comision, pnl, observaciones)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  return operaciones.map((o) => env.DB.prepare(sql).bind(
    jornadaId, o.orden, o.hora, o.direccion, o.setup,
    o.puntos, o.resultado, o.comision, o.pnl, o.observaciones,
  ));
}
