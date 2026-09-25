-- Fase 7 · relleno de sesiones.registrada_at para los días que Kris ya registró (diseño §4.2).
--
-- Registrado = tiene su lectura (analisis_trader, no_opero o setup) o es anterior al 16/08/2026:
-- hasta esa fecha ninguna herramienta creaba la fila por su cuenta, solo el registro de Kris (desde
-- el 16/08 los indicadores de NinjaTrader la crean en premercado). Contado el 24/09: 146 + 17 = 163
-- de 164. Queda fuera el 07/09 (festivo, fila creada en premercado).
-- La hora exacta de aquel primer guardado no se conoce: se usa updated_at. Solo importa para los
-- días que tengan ficha del motor, y esos llegan desde ahora.

UPDATE public.sesiones
   SET registrada_at = COALESCE(updated_at, created_at, now())
 WHERE registrada_at IS NULL
   AND (analisis_trader IS NOT NULL OR COALESCE(no_opero, false) OR setup IS NOT NULL
        OR sesion_date < DATE '2026-08-16');
