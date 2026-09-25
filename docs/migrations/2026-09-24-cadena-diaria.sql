-- Fase 7 (la cadena diaria) · diseño docs/disenos/2026-09-24-cadena-diaria.md §4.2
--
-- 1) sesiones.registrada_at: la primera vez que Kris guarda el día (Diario o bot). Un trigger la
--    CONGELA: una vez puesta no se mueve ni se borra. Los indicadores de NinjaTrader nunca la mandan
--    (escriben la fila en premercado, antes de que Kris registre nada).
-- 2) sesiones.diario_editado_at: la última vez que Kris tocó su lectura (cada guardado del Diario o bot).
-- 3) motor_fichas: lo que marcó el motor cada día (la sube scripts/cadena/subir_dia.py con service_role).
--    EL CANDADO DEL TEST CIEGO: `authenticated` solo lee una ficha si el día está registrado. A PROPÓSITO
--    NO es la política auth_all del resto de tablas (D-026): con auth_all el candado sería de adorno.
-- 4) motor_estado(fecha): dice si hay ficha y si está bloqueada, SIN enseñar su contenido.
--    motor_marcar_vista(fecha): la primera vez que Kris la ve (para saber si editó su lectura después).

-- ── 1 y 2 · sesiones ────────────────────────────────────────────────────────
ALTER TABLE public.sesiones
  ADD COLUMN IF NOT EXISTS registrada_at     timestamptz,
  ADD COLUMN IF NOT EXISTS diario_editado_at timestamptz;

COMMENT ON COLUMN public.sesiones.registrada_at IS
  'Primera vez que Kris guardó el día (Diario o bot). Congelada por trigger. Abre el candado de motor_fichas.';
COMMENT ON COLUMN public.sesiones.diario_editado_at IS
  'Último guardado del Diario o del bot. Si es posterior a motor_fichas.vista_en, la lectura se editó tras ver al motor.';

CREATE OR REPLACE FUNCTION public.fn_sesion_registrada_congelada()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.registrada_at IS NOT NULL THEN
    NEW.registrada_at := OLD.registrada_at;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sesion_registrada_congelada ON public.sesiones;
CREATE TRIGGER trg_sesion_registrada_congelada
  BEFORE UPDATE ON public.sesiones
  FOR EACH ROW EXECUTE FUNCTION public.fn_sesion_registrada_congelada();

-- ── 3 · motor_fichas ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.motor_fichas (
  fecha         date PRIMARY KEY,
  estado        text NOT NULL CHECK (estado IN ('ok', 'sin_jornada', 'error')),
  instrumento   text,
  umbral_vol    integer,
  dia_fed       boolean NOT NULL DEFAULT false,
  ficha         jsonb NOT NULL DEFAULT '{}'::jsonb,
  velas         text,
  grafico_url   text,
  huella_motor  text,
  huella_datos  text,
  origen_datos  text CHECK (origen_datos IN ('addon', 'manual')),
  generada_en   timestamptz NOT NULL DEFAULT now(),
  vista_en      timestamptz
);

COMMENT ON TABLE public.motor_fichas IS
  'Lo que marcó el motor (lector.py) cada día. La escribe solo scripts/cadena/subir_dia.py (service_role). '
  'Candado: authenticated solo la lee si el día está registrado (motor_dia_registrado). NO es auth_all, a propósito (D-026).';

ALTER TABLE public.motor_fichas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.motor_fichas FROM anon, authenticated, portal_lector;
GRANT SELECT ON public.motor_fichas TO authenticated;
GRANT ALL    ON public.motor_fichas TO service_role;

CREATE OR REPLACE FUNCTION public.motor_dia_registrado(p_fecha date)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM sesiones   WHERE sesion_date = p_fecha AND registrada_at IS NOT NULL)
      OR EXISTS (SELECT 1 FROM bt_jornadas WHERE fecha = p_fecha)
$$;

DROP POLICY IF EXISTS candado ON public.motor_fichas;
CREATE POLICY candado ON public.motor_fichas
  FOR SELECT TO authenticated
  USING (public.motor_dia_registrado(fecha));
-- Sin políticas de escritura: solo service_role (que ignora RLS) inserta o cambia.

-- ── 4 · funciones para el Journal ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.motor_estado(p_fecha date)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT CASE WHEN motor_dia_registrado(p_fecha) THEN estado ELSE 'bloqueada' END
       FROM motor_fichas WHERE fecha = p_fecha),
    'sin_ficha')
$$;

CREATE OR REPLACE FUNCTION public.motor_marcar_vista(p_fecha date)
RETURNS void LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  UPDATE motor_fichas SET vista_en = now()
   WHERE fecha = p_fecha AND vista_en IS NULL AND motor_dia_registrado(p_fecha)
$$;

REVOKE ALL ON FUNCTION public.motor_dia_registrado(date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.motor_estado(date)         FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.motor_marcar_vista(date)   FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.motor_dia_registrado(date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.motor_estado(date)         TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.motor_marcar_vista(date)   TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
