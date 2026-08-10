-- 2026-08-10 — Quitar las imágenes base64 de `diagnosticos_diarios.chat_messages`
--
-- Contexto: el Coach mandaba la gráfica del día a Claude como bloque `image` en
-- base64 dentro del primer mensaje, y `chatHistory` completo se guardaba en el
-- JSONB `chat_messages`. Resultado: 46 filas, 40 MB de chat (la fila más pesada,
-- 1274 kB) sobre una tabla de 42 MB — el ~95% del peso eran imágenes duplicadas.
--
-- Es seguro: las 46 sesiones con diagnóstico tienen `sesiones.imagen_url` en
-- Cloudinary (verificado: 0 sin respaldo), y el Coach ya la recarga sola con
-- `autoCargarImagen(sesion.imagen_url)` al abrir el día. Aquí solo se sustituye
-- cada bloque `image` por un bloque de TEXTO marcador — sigue siendo contenido
-- válido para la API de Anthropic si esa conversación se reenvía.
--
-- El código (js/coach.js → `chatSinImagenes`) ya evita que vuelva a pasar.

-- Antes / después (informativo)
-- select count(*) filter (where chat_messages::text ilike '%"type"%image%') as con_imagen,
--        pg_size_pretty(sum(pg_column_size(chat_messages))::bigint) as peso
--   from diagnosticos_diarios;

update diagnosticos_diarios d
set chat_messages = (
  select jsonb_agg(
    case
      when jsonb_typeof(msg -> 'content') = 'array' then
        jsonb_set(msg, '{content}', (
          select jsonb_agg(
            case
              when blk ->> 'type' = 'image' then jsonb_build_object(
                'type', 'text',
                'text', '[Gráfica de la sesión — adjunta en el análisis original]'
              )
              else blk
            end
            order by b.ord
          )
          from jsonb_array_elements(msg -> 'content') with ordinality as b(blk, ord)
        ))
      else msg
    end
    order by m.ord
  )
  from jsonb_array_elements(d.chat_messages) with ordinality as m(msg, ord)
)
where d.chat_messages is not null
  and d.chat_messages::text ilike '%"type"%image%';

-- El UPDATE deja tuplas muertas en la tabla TOAST; sin esto el espacio no vuelve
-- al disco (solo se reutiliza). VACUUM FULL no puede ir dentro de una transacción:
-- si el cliente la abre, correrlo suelto desde el SQL Editor.
vacuum full diagnosticos_diarios;
