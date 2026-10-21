// MarcacionChaumer — la línea blanca de corridas y retrocesos, en tiempo real
//
// Marca sobre el gráfico operativo el mismo zigzag que dibuja el motor en los gráficos del
// backtesting (chaumer/05_Backtesting/claude/motor: lector.leer_sesion → piv, dia.py lo pinta
// en blanco). El cálculo, ZigzagChaumer, es una traducción LITERAL de esa parte del motor:
// si el motor cambia, se cambia aquí igual. Solo depende de las velas: no mira zonas ni setups.
//
//   Empieza  con la vela de apertura de Nueva York (cierra 09:31 ET): 08:31 hora Colombia en
//            el horario de verano de EE. UU., 09:31 desde el primer domingo de noviembre.
//   Termina  cuando la cuenta vigilada vuelve a plano tras operar (target o stop), o a los
//            120 minutos de la apertura (11:30 ET) si no hay operación.
//   Solo el día de hoy. Calcula al cierre de cada vela de 1 minuto, como el motor.
//   Plan 3.49 (21/10/2026): una vela puede ser dos puntos de la línea (bajar a su mínimo y subir a
//            su máximo, o al revés). El orden lo dan los ticks en vivo; sin ellos, el color.
//
// Instalación: copiar a Documentos > NinjaTrader 8 > bin > Custom > Indicators, F5, y añadirlo
// al gráfico de 1 minuto de MNQ con la cuenta a vigilar en sus propiedades.

#region Using declarations
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Windows.Media;
using System.Xml.Serialization;
using NinjaTrader.Cbi;
using NinjaTrader.Gui;
using NinjaTrader.Gui.Chart;
using NinjaTrader.NinjaScript;
#endregion

namespace NinjaTrader.NinjaScript.Indicators
{
    /// <summary>
    /// El zigzag del motor, sin dependencias de NinjaTrader (para poder compararlo contra el
    /// motor de Python con los mismos datos). Las velas van desde la vela base (índice 0) hasta
    /// la última disponible de la ventana.
    /// </summary>
    public static class ZigzagChaumer
    {
        public struct Vertice
        {
            public int I;          // índice de la vela (0 = vela base)
            public double Precio;
            public int Confirma;   // vela en que se sabe el vértice; -1 = el último, sin confirmar
        }

        /// <summary>Plan 3.49 (21/10/2026, R-05/R-06): desde este día (AAAAMMDD) una vela que pasa de los dos
        /// extremos de la anterior puede dar DOS vueltas. Es VUELTA_EN_VELA_DESDE de PARAMETROS.md; el indicador
        /// no lee el repositorio, así que va aquí escrito, y sincronia.py lo compara con el motor.</summary>
        public const int VUELTA_EN_VELA_DESDE = 20261021;

        /// <summary>El zigzag con la regla anterior al 21/10/2026 (una sola vuelta por vela, orden por color).</summary>
        public static List<Vertice> Calcular(double[] o, double[] h, double[] l, double[] c, int n)
        {
            return Calcular(o, h, l, c, n, 0, null);
        }

        /// <summary>null si aún no se sabe la dirección del día (vela base sin cuerpo y ninguna
        /// vela ha salido de su rango) o si no hay forma de saberla.
        /// fecha: el día, AAAAMMDD (decide si una vela puede dar dos vueltas).
        /// minPrimero: el orden REAL de cada vela, visto en los ticks (true = primero el mínimo); null, o
        /// sin valor en esa vela, = lo dice el color, como el motor: azul o sin cuerpo, primero el mínimo.</summary>
        public static List<Vertice> Calcular(double[] o, double[] h, double[] l, double[] c, int n,
                                             int fecha, bool?[] minPrimero)
        {
            if (n < 1) return null;
            // Dirección del día por la vela base (R-07). Sin cuerpo: la da la primera vela que
            // pase de su máximo (alcista) o de su mínimo (bajista); si pasa de los dos, su
            // color: c < o → máximo primero → alcista.
            bool alc = c[0] > o[0];
            if (c[0] == o[0])
            {
                bool decidido = false;
                for (int j = 1; j < n; j++)
                {
                    bool up = h[j] > h[0], dn = l[j] < l[0];
                    if (!(up || dn)) continue;
                    if (up && dn)
                    {
                        if (c[j] == o[j]) return null;        // el motor lo da por error
                        alc = c[j] < o[j];
                    }
                    else alc = up;
                    decidido = true; break;
                }
                if (!decidido) return null;
            }

            var piv = new List<Vertice> { new Vertice { I = 0, Precio = alc ? l[0] : h[0], Confirma = 0 } };
            bool corrida = true;
            int ext = 0, rExt = 0;
            for (int i = 1; i < n; i++)
            {
                int p = i - 1;
                bool mp = (minPrimero != null && i < minPrimero.Length && minPrimero[i].HasValue)
                          ? minPrimero[i].Value : c[i] >= o[i];
                // Plan 3.49: tras la primera vuelta, si el otro extremo llegó DESPUÉS, la misma vela
                // se vuelve a leer en el estado nuevo (la segunda vuelta).
                bool dosVueltas = fecha >= VUELTA_EN_VELA_DESDE && h[i] > h[p] && l[i] < l[p];
                bool segunda = false;
                while (true)
                {
                    if (corrida)
                    {
                        bool muere    = alc ? l[i] < l[p] : h[i] > h[p];
                        bool nuevoExt = alc ? h[i] > h[ext] : l[i] < l[ext];
                        if (nuevoExt && !muere) ext = i;
                        else if (nuevoExt && muere)
                        {
                            // La vela hace las dos cosas: el extremo cuenta solo si ocurrió antes.
                            bool extremoPrimero = alc ? !mp : mp;
                            if (extremoPrimero) ext = i;
                        }
                        if (!muere) break;
                        piv.Add(new Vertice { I = ext, Precio = alc ? h[ext] : l[ext], Confirma = i });
                        corrida = false; rExt = i;
                        if (dosVueltas && !segunda && mp == alc) { segunda = true; continue; }
                        break;
                    }
                    else
                    {
                        bool confirma = alc ? h[i] > h[p] : l[i] < l[p];
                        bool hunde    = alc ? l[i] < l[rExt] : h[i] > h[rExt];
                        if (hunde && !confirma) rExt = i;
                        else if (hunde && confirma)
                        {
                            bool extremoPrimero = alc ? mp : !mp;
                            if (extremoPrimero) rExt = i;
                        }
                        if (!confirma) break;
                        piv.Add(new Vertice { I = rExt, Precio = alc ? l[rExt] : h[rExt], Confirma = i });
                        corrida = true; ext = i;
                        if (dosVueltas && !segunda && mp != alc) { segunda = true; continue; }
                        break;
                    }
                }
            }
            if (corrida) piv.Add(new Vertice { I = ext,  Precio = alc ? h[ext]  : l[ext],  Confirma = -1 });
            else         piv.Add(new Vertice { I = rExt, Precio = alc ? l[rExt] : h[rExt], Confirma = -1 });
            return piv;
        }
    }

    public class MarcacionChaumer : Indicator
    {
        private static readonly TimeSpan APERTURA_ET = new TimeSpan(9, 31, 0);   // cierre de la vela base
        private static readonly TimeSpan FIN_ET      = new TimeSpan(11, 30, 0);  // 120 velas después
        private TimeZoneInfo et;

        private int baseBar = -1;                     // índice absoluto de la vela base de hoy
        private int ultimaBar = -1;                   // última vela de la ventana ya cerrada
        private int corteBar = -1;                    // vela en que la operación dio resultado
        private List<KeyValuePair<int, double>> puntos = new List<KeyValuePair<int, double>>();

        // El orden REAL de cada vela (plan 3.49, 21/10/2026): en vivo se apunta en qué momento llegó su
        // máximo y en qué momento su mínimo. Clave: la hora de cierre de la vela; valor: true = primero el
        // mínimo. Se guarda en un archivo del día para no perderlo al recompilar o reabrir el gráfico. Las
        // velas que no se vieron enteras en vivo no están: para ellas manda el color, como en el motor.
        private Dictionary<DateTime, bool> orden = new Dictionary<DateTime, bool>();
        private string archivoOrden;
        private int tickBar = -1;                     // la vela que se está siguiendo tick a tick
        private double tickMax, tickMin;
        private long tickSeq, seqMax, seqMin;

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Name                     = "Marcacion Chaumer";
                Description              = "La línea blanca de corridas y retrocesos del motor, en tiempo real.";
                // Recibe cada cambio de precio para saber el orden real de la vela, pero solo marca al
                // cierre de cada vela, como el motor.
                Calculate                = Calculate.OnPriceChange;
                IsOverlay                = true;
                DisplayInDataBox         = false;
                DrawOnPricePanel         = true;
                PaintPriceMarkers        = false;
                IsSuspendedWhileInactive = false;
                Cuenta                   = "Sim101";
                ColorLinea               = Brushes.White;
                Grosor                   = 2;
                Puntos                   = true;
            }
            else if (State == State.DataLoaded)
            {
                try   { et = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"); }
                catch { et = null; }
                CargarOrden();
            }
        }

        private DateTime AEt(DateTime t)
        {
            if (et == null) return t;
            return TimeZoneInfo.ConvertTime(t, Core.Globals.GeneralOptions.TimeZoneInfo, et);
        }

        protected override void OnBarUpdate()
        {
            if (et == null || CurrentBar < 1) return;
            if (State == State.Historical) { Procesar(CurrentBar); return; }

            // En vivo. El primer tick de una vela dice que la anterior ya cerró: se apunta su orden y se
            // marca. Una vela solo se sigue si se la ve nacer (aún sin rango); si no, manda su color.
            if (IsFirstTickOfBar)
            {
                if (tickBar == CurrentBar - 1) ApuntarOrden(tickBar);
                Procesar(CurrentBar - 1);
                tickBar = High[0] == Low[0] ? CurrentBar : -1;
                tickMax = tickMin = Close[0]; tickSeq = 0; seqMax = seqMin = 0;
                return;
            }
            if (tickBar != CurrentBar) return;
            tickSeq++;
            if (Close[0] > tickMax) { tickMax = Close[0]; seqMax = tickSeq; }
            if (Close[0] < tickMin) { tickMin = Close[0]; seqMin = tickSeq; }
        }

        // La vela que se siguió tick a tick acaba de cerrar: ¿llegó antes su mínimo o su máximo?
        private void ApuntarOrden(int barra)
        {
            if (seqMax == seqMin) return;                 // no se movió: no hay orden que apuntar
            bool minPrimero = seqMin < seqMax;
            DateTime t = Bars.GetTime(barra);
            orden[t] = minPrimero;
            if (archivoOrden == null) return;
            try
            {
                System.IO.Directory.CreateDirectory(System.IO.Path.GetDirectoryName(archivoOrden));
                System.IO.File.AppendAllText(archivoOrden, t.ToString("HH:mm") + (minPrimero ? ";minimo" : ";maximo") + Environment.NewLine);
            }
            catch (Exception ex) { Print("MarcacionChaumer: no pude guardar el orden de la vela: " + ex.Message); }
        }

        // El orden de las velas de hoy que ya se vieron en vivo: Documentos\NinjaTrader 8\marcacion-chaumer\AAAA-MM-DD.txt,
        // una línea por vela, "HH:mm;minimo" o "HH:mm;maximo" (hora de cierre, la de NinjaTrader: Colombia).
        private void CargarOrden()
        {
            orden.Clear();
            DateTime hoy = Core.Globals.Now.Date;
            archivoOrden = System.IO.Path.Combine(Core.Globals.UserDataDir, "marcacion-chaumer", hoy.ToString("yyyy-MM-dd") + ".txt");
            try
            {
                if (!System.IO.File.Exists(archivoOrden)) return;
                foreach (var linea in System.IO.File.ReadAllLines(archivoOrden))
                {
                    var p = linea.Split(';');
                    TimeSpan hm;
                    if (p.Length != 2 || !TimeSpan.TryParse(p[0], out hm)) continue;
                    orden[hoy.Add(hm)] = p[1].Trim() == "minimo";
                }
            }
            catch (Exception ex) { Print("MarcacionChaumer: no pude leer el orden de las velas: " + ex.Message); }
        }

        // Marca con las velas de la ventana hasta `barra`, ya cerrada.
        private void Procesar(int barra)
        {
            if (barra < 1) return;
            DateTime tEt   = AEt(Bars.GetTime(barra));
            DateTime hoyEt = AEt(Core.Globals.Now).Date;
            if (tEt.Date != hoyEt) return;                       // solo el día de hoy
            if (tEt.TimeOfDay < APERTURA_ET || tEt.TimeOfDay > FIN_ET) return;

            // La vela base es la primera de hoy dentro de la ventana (como el motor: si
            // faltara la de 09:31, manda la siguiente).
            if (baseBar < 0 || AEt(Bars.GetTime(baseBar)).Date != hoyEt)
            {
                baseBar = barra; corteBar = -1;
            }
            ultimaBar = barra;

            int n = ultimaBar - baseBar + 1;
            var o = new double[n]; var h = new double[n]; var l = new double[n]; var c = new double[n];
            var mp = new bool?[n];
            for (int k = 0; k < n; k++)
            {
                int idx = baseBar + k;
                o[k] = Bars.GetOpen(idx); h[k] = Bars.GetHigh(idx);
                l[k] = Bars.GetLow(idx);  c[k] = Bars.GetClose(idx);
                bool v;
                if (orden.TryGetValue(Bars.GetTime(idx), out v)) mp[k] = v;
            }

            if (corteBar < 0) corteBar = BuscarCorte();

            int fecha = hoyEt.Year * 10000 + hoyEt.Month * 100 + hoyEt.Day;
            var piv = ZigzagChaumer.Calcular(o, h, l, c, n, fecha, mp);
            var nuevos = new List<KeyValuePair<int, double>>();
            if (piv != null)
                foreach (var v in piv)
                {
                    int idx = baseBar + v.I;
                    // Como en dia.py: solo los vértices hasta la vela del resultado.
                    if (corteBar >= 0 && idx > corteBar) continue;
                    nuevos.Add(new KeyValuePair<int, double>(idx, v.Precio));
                }
            puntos = nuevos;
        }

        // La vela en que la cuenta vigilada vuelve a plano tras haber operado este
        // instrumento desde la apertura. Se reconstruye desde las ejecuciones del día, así que
        // también funciona tras recompilar o reabrir el gráfico. -1 si aún no hay resultado.
        private int BuscarCorte()
        {
            Account acc = null;
            lock (Account.All)
                acc = Account.All.FirstOrDefault(a => string.Equals(a.Name, Cuenta, StringComparison.OrdinalIgnoreCase));
            if (acc == null) return -1;

            DateTime desde = Bars.GetTime(baseBar).AddMinutes(-1);   // apertura de la vela base
            string master  = Instrument.MasterInstrument.Name;
            List<Execution> ejecs;
            lock (acc.Executions)
                ejecs = acc.Executions
                    .Where(e => e.Instrument != null && e.Instrument.MasterInstrument.Name == master
                             && e.Time.Date == Bars.GetTime(baseBar).Date)
                    .OrderBy(e => e.Time).ToList();

            int pos = 0; bool opero = false;
            foreach (var e in ejecs)
            {
                pos += e.MarketPosition == MarketPosition.Long ? e.Quantity : -e.Quantity;
                if (e.Time < desde) continue;
                if (pos != 0) opero = true;
                else if (opero)
                {
                    int bar = Bars.GetBar(e.Time);       // la vela que contiene la salida
                    return bar >= baseBar ? bar : -1;
                }
            }
            return -1;
        }

        protected override void OnRender(ChartControl chartControl, ChartScale chartScale)
        {
            base.OnRender(chartControl, chartScale);
            var pts = puntos;
            if (pts == null || pts.Count < 2 || ChartBars == null) return;

            var dx = ColorLinea.ToDxBrush(RenderTarget);
            var fondo = Brushes.Black.ToDxBrush(RenderTarget);
            var aa = RenderTarget.AntialiasMode;
            RenderTarget.AntialiasMode = SharpDX.Direct2D1.AntialiasMode.PerPrimitive;
            try
            {
                var xy = pts.Select(p => new SharpDX.Vector2(
                            chartControl.GetXByBarIndex(ChartBars, p.Key),
                            chartScale.GetYByValue(p.Value))).ToList();
                for (int k = 1; k < xy.Count; k++)
                    RenderTarget.DrawLine(xy[k - 1], xy[k], dx, Grosor);
                if (Puntos)
                    foreach (var v in xy)
                    {
                        var el = new SharpDX.Direct2D1.Ellipse(v, Grosor + 2.5f, Grosor + 2.5f);
                        RenderTarget.FillEllipse(el, dx);
                        RenderTarget.DrawEllipse(el, fondo, 1.2f);
                    }
            }
            finally
            {
                RenderTarget.AntialiasMode = aa;
                dx.Dispose(); fondo.Dispose();
            }
        }

        #region Propiedades
        [NinjaScriptProperty]
        [TypeConverter(typeof(AccountNameConverter))]
        [Display(Name = "Cuenta a vigilar", Order = 1, GroupName = "Marcación",
                 Description = "Cuando esta cuenta vuelve a plano tras operar, la línea deja de dibujarse.")]
        public string Cuenta { get; set; }

        [XmlIgnoreAttribute]
        [Display(Name = "Color", Order = 2, GroupName = "Marcación")]
        public Brush ColorLinea { get; set; }

        [Browsable(false)]
        public string ColorLineaSerializable
        {
            get { return Serialize.BrushToString(ColorLinea); }
            set { ColorLinea = Serialize.StringToBrush(value); }
        }

        [Range(1, 10)]
        [Display(Name = "Grosor", Order = 3, GroupName = "Marcación")]
        public int Grosor { get; set; }

        [Display(Name = "Puntos en los vértices", Order = 4, GroupName = "Marcación")]
        public bool Puntos { get; set; }
        #endregion
    }
}
