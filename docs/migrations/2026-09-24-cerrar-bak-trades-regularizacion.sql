-- Cierra el respaldo _bak_20260919_trades_regularizacion (109 trades con su P&L).
--
-- Por qué: se creó el 19/09 sin RLS, y el rol anon tenía SELECT/INSERT/UPDATE/DELETE.
-- La clave anon está en js/config.js y el repositorio es público: cualquiera podía
-- leer, cambiar o borrar esas filas. Detectado en el diagnóstico de la fase 7 (24/09).
--
-- Queda igual que los demás _bak_*: RLS activo y sin políticas (nadie lo lee salvo
-- service_role). Además se le quitan los permisos a anon, que no necesita ninguno.

ALTER TABLE public._bak_20260919_trades_regularizacion ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._bak_20260919_trades_regularizacion FROM anon;

NOTIFY pgrst, 'reload schema';
