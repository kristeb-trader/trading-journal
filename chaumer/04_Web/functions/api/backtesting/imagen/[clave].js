/**
 * GET /api/backtesting/imagen/:clave   sirve el gráfico de una jornada
 * PUT /api/backtesting/imagen/:clave   lo sube
 *
 * Las imágenes viven en R2, en un bucket PRIVADO. No hay dirección pública ni
 * dominio propio: salen solo por aquí. Verlas es libre, igual que la bitácora;
 * subirlas es del operador.
 *
 * La clave es el nombre del archivo tal cual. Se conserva a propósito: el día
 * que el almacén cambie, las filas de la base siguen apuntando bien sin tocar
 * ninguna.
 */

import { json, autorizado } from '../_comun.js';

const TIPOS = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const MAX = 8 * 1024 * 1024; // una captura de pantalla no llega ni de lejos

/** Solo letras, digitos, guiones, puntos y la extension. Sin barras: nadie
 *  escribe fuera de su sitio. */
const LIMPIA = /^[A-Za-z0-9._-]{1,120}$/;

function extension(clave) {
  const punto = clave.lastIndexOf('.');
  return punto < 0 ? '' : clave.slice(punto + 1).toLowerCase();
}

export async function onRequestGet({ env, params }) {
  const clave = String(params.clave || '');
  if (!LIMPIA.test(clave) || clave.includes('..')) {
    return new Response('Nombre de imagen no válido', { status: 400 });
  }
  if (!env.IMAGENES) return new Response('El almacén de imágenes no está configurado', { status: 503 });

  const objeto = await env.IMAGENES.get(clave);
  if (!objeto) return new Response('Esa imagen no está', { status: 404 });

  return new Response(objeto.body, {
    headers: {
      'content-type': TIPOS[extension(clave)] || 'application/octet-stream',
      // La imagen de una jornada no cambia; si se corrige, se sube con otro
      // nombre. Por eso se puede cachear de verdad.
      'cache-control': 'public, max-age=31536000, immutable',
      'etag': objeto.httpEtag,
    },
  });
}

export async function onRequestPut({ request, env, params }) {
  if (!autorizado(request, env)) return json({ error: 'Subir el gráfico es del operador' }, 403);

  const clave = String(params.clave || '');
  if (!LIMPIA.test(clave) || clave.includes('..')) {
    return json({ error: 'Nombre de imagen no válido' }, 400);
  }
  if (!TIPOS[extension(clave)]) {
    return json({ error: 'Solo PNG, JPG o WebP' }, 400);
  }
  if (!env.IMAGENES) return json({ error: 'El almacén de imágenes no está configurado' }, 503);

  const largo = Number(request.headers.get('content-length') || 0);
  if (largo > MAX) return json({ error: 'La imagen pesa demasiado' }, 413);

  const datos = await request.arrayBuffer();
  if (!datos.byteLength) return json({ error: 'La imagen viene vacía' }, 400);
  if (datos.byteLength > MAX) return json({ error: 'La imagen pesa demasiado' }, 413);

  await env.IMAGENES.put(clave, datos, {
    httpMetadata: { contentType: TIPOS[extension(clave)] },
  });

  return json({ imagen: clave, bytes: datos.byteLength }, 201);
}
