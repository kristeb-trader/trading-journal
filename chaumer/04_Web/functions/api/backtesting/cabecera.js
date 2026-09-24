/**
 * PUT /api/backtesting/cabecera   los datos de inicio
 *
 * Valor inicial, contratos e instrumento. Son la PROPUESTA para la próxima
 * jornada: cambiarlos no toca ni una jornada ya registrada, porque cada una
 * congeló los suyos al guardarse. Lo único que cambia hacia atrás es el saldo
 * de partida de la curva, que es exactamente lo que se espera.
 */

import { json, autorizado, ahora, recorta, leerCabecera } from './_comun.js';

export async function onRequestPut({ request, env }) {
  if (!autorizado(request, env)) return json({ error: 'Los datos de inicio son del operador' }, 403);

  let cuerpo;
  try { cuerpo = await request.json(); }
  catch { return json({ error: 'El cuerpo de la petición no es JSON válido' }, 400); }

  const valorInicial = Number(cuerpo?.valor_inicial);
  if (!Number.isFinite(valorInicial) || valorInicial < 0) {
    return json({ error: 'El valor inicial tiene que ser un número de 0 en adelante' }, 400);
  }

  const contratos = Number(cuerpo?.contratos);
  if (!Number.isInteger(contratos) || contratos < 1) {
    return json({ error: 'Los contratos tienen que ser un entero de 1 en adelante' }, 400);
  }

  const instrumento = recorta(cuerpo?.instrumento, 20);
  if (!instrumento) return json({ error: 'Falta el instrumento' }, 400);

  // La comision del broker, por contrato y por operacion.
  const comision = Number(cuerpo?.comision ?? 0);
  if (!Number.isFinite(comision) || comision < 0) {
    return json({ error: 'La comisión tiene que ser un número de 0 en adelante' }, 400);
  }

  try {
    await leerCabecera(env); // crea la fila la primera vez
    await env.DB
      .prepare(`UPDATE bt_cabecera
                SET valor_inicial = ?, contratos = ?, instrumento = ?,
                    comision = ?, actualizada_en = ?
                WHERE id = 1`)
      .bind(valorInicial, contratos, instrumento, comision, ahora())
      .run();

    return json({ valor_inicial: valorInicial, contratos, instrumento, comision });
  } catch (e) {
    return json({ error: 'No se pudieron guardar los datos de inicio', detalle: String(e) }, 500);
  }
}
