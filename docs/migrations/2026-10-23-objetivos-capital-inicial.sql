-- objetivos.capital_inicial: la base de la Rentabilidad (%) de Análisis.
-- Hasta hoy vivía solo en el localStorage del navegador ('annual_capital_inicial'):
-- se perdía al borrar los datos del sitio y no llegaba a otro dispositivo, y
-- Rentabilidad salía «—». NULL = sin configurar (Análisis enseña «—»).
ALTER TABLE public.objetivos
  ADD COLUMN IF NOT EXISTS capital_inicial numeric
  CHECK (capital_inicial IS NULL OR capital_inicial > 0);

COMMENT ON COLUMN public.objetivos.capital_inicial IS
  'Capital inicial en USD: base de la Rentabilidad % de Análisis. NULL = sin configurar. Se edita en Otros → Datos.';

NOTIFY pgrst, 'reload schema';
