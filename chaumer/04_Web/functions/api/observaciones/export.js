/**
 * GET /api/observaciones/export
 *
 * Descarga todas las observaciones en Markdown, agrupadas por donde se
 * dejaron, para llevarlas al ciclo de trabajo del plan.
 *
 * Es del operador: pide la misma clave que responder y marcar.
 */

const ETIQUETA = {
  regla: 'Reglas', termino: 'Glosario', caso: 'Casos de la galería',
  parametro: 'Parámetros', pendiente: 'Pendientes', subfase: 'Sub-fases',
  general: 'Sobre el plan en general',
};

function igual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function onRequestGet({ request, env }) {
  const clave = request.headers.get('x-clave')
    || new URL(request.url).searchParams.get('k') || '';
  if (!env.CLAVE_OPERADOR || !igual(clave, env.CLAVE_OPERADOR)) {
    return new Response('Esta descarga es del operador', { status: 403 });
  }

  let filas = [];
  try {
    const { results } = await env.DB
      .prepare(`SELECT * FROM observaciones ORDER BY ancla_tipo, ancla_id, creada_en`)
      .all();
    filas = results ?? [];
  } catch (e) {
    return new Response('No se pudieron leer las observaciones: ' + e, { status: 500 });
  }

  const fecha = new Date().toISOString().slice(0, 10);
  const lineas = [
    '# Observaciones sobre el plan',
    '',
    `**Exportado:** ${fecha} · **Total:** ${filas.length}`,
    '',
    '> Una observación **no es una regla**. El plan solo cambia si el operador',
    '> cambia `01_Plan/`. Esto es constancia de la revisión, no la fuente.',
    '',
  ];

  let grupoActual = null;
  for (const o of filas) {
    if (o.ancla_tipo !== grupoActual) {
      grupoActual = o.ancla_tipo;
      lineas.push('', '---', '', `## ${ETIQUETA[grupoActual] ?? grupoActual}`, '');
    }
    const donde = o.ancla_id ? `\`${o.ancla_id}\`` : 'general';
    const titulo = o.ancla_titulo ? ` · ${o.ancla_titulo}` : '';
    lineas.push(`### ${donde}${titulo}`, '');
    lineas.push(`**${o.autor}** · ${o.creada_en} · estado: ${o.estado}`, '');
    if (o.cita) lineas.push(`> Sobre: «${o.cita}»`, '');
    lineas.push(o.texto, '');
    if (o.respuesta) lineas.push(`**Respuesta del operador** (${o.respondida_en}):`, '', o.respuesta, '');
  }

  return new Response(lineas.join('\n'), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'content-disposition': `attachment; filename="observaciones-${fecha}.md"`,
      'cache-control': 'no-store',
    },
  });
}
