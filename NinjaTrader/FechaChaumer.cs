// FechaChaumer — el recuadro con la fecha y la hora, en el gráfico operativo
//
// Sustituye a la fecha que Kris escribía a mano cada día con la herramienta de texto (16/11/2026).
// Dos líneas del mismo tamaño, centradas:
//
//      Lunes, 16 de Noviembre, 2026
//          Entry = 09:46:55          (o la hora, 09:57:15, si ese día no hubo entrada)
//
//   La fecha  es la de la ÚLTIMA VELA del gráfico, no la del PC: en un día pasado o en Market Replay sale ese día.
//   La hora   si ese día la cuenta vigilada entró, «Entry = » y la hora de la entrada (la de la última operación, si
//             hubo varias), sacada de sus ejecuciones (17/11/2026, Kris). Si no, en tiempo real la de NinjaTrader
//             (Colombia; en Market Replay, la de la reproducción), avanzando cada segundo; sin datos en vivo, la de
//             la última vela. La foto del día (FotoChaumer) la deja escrita.
//   Dónde     fijo en la pantalla, no pegado a una vela: no se mueve al desplazar el gráfico. Se arrastra con el
//             ratón (mientras se arrastra, el gráfico no se desplaza) y la posición se guarda con el espacio de
//             trabajo. Si el panel se achica y el recuadro queda fuera, vuelve al borde.
//
// No toca cuentas ni Supabase: solo dibuja (de la cuenta, solo lee sus ejecuciones).
//
// En C# 5. Instalar: copiar a Documentos\NinjaTrader 8\bin\Custom\Indicators\, F5, y añadirlo al gráfico.

#region Using declarations
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.ComponentModel.DataAnnotations;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;
using System.Xml.Serialization;
using NinjaTrader.Cbi;
using NinjaTrader.Gui;
using NinjaTrader.Gui.Chart;
using NinjaTrader.NinjaScript;
#endregion

namespace NinjaTrader.NinjaScript.Indicators
{
    public class FechaChaumer : Indicator
    {
        private static readonly string[] DIAS  = { "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado" };
        private static readonly string[] MESES = { "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
                                                   "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" };

        private DispatcherTimer reloj;
        private bool enganchado;
        private SharpDX.RectangleF caja;      // dónde se dibujó, en píxeles del ChartControl (para pulsarlo)
        private bool arrastrando;
        private float agarreX, agarreY;       // dónde se agarró, dentro del recuadro

        /// <summary>«Lunes, 16 de Noviembre, 2026».</summary>
        public static string Fecha(DateTime t)
        {
            return DIAS[(int)t.DayOfWeek] + ", " + t.Day + " de " + MESES[t.Month - 1] + ", " + t.Year;
        }

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Name                     = "Fecha Chaumer";
                Description              = "La fecha y la hora en un recuadro que se arrastra con el ratón.";
                Calculate                = Calculate.OnBarClose;
                IsOverlay                = true;
                DisplayInDataBox         = false;
                DrawOnPricePanel         = true;
                PaintPriceMarkers        = false;
                IsSuspendedWhileInactive = false;
                Cuenta                   = "Sim101";
                Tamano                   = 26;
                Fuente                   = "Calibri";
                ColorFondo               = Congelado(Color.FromRgb(52, 52, 50));
                ColorTexto               = Congelado(Color.FromRgb(240, 240, 236));
                PosX                     = 210;     // donde la escribía a mano (captura del 16/11/2026)
                PosY                     = 90;
            }
            else if (State == State.Historical)
            {
                if (ChartControl != null)
                    ChartControl.Dispatcher.InvokeAsync(Enganchar);
            }
            else if (State == State.Terminated)
            {
                if (ChartControl != null)
                    ChartControl.Dispatcher.InvokeAsync(Soltar);
            }
        }

        private static SolidColorBrush Congelado(Color c)
        {
            var b = new SolidColorBrush(c);
            b.Freeze();
            return b;
        }

        protected override void OnBarUpdate() { }

        // Sin la etiqueta del indicador arriba a la izquierda del gráfico: el recuadro ya dice lo que es.
        // En la ventana de Indicadores (las copias que edita están en SetDefaults o Configure) sí lleva el nombre: vacío, la
        // lista «Configured» salía en blanco (17/11/2026).
        public override string DisplayName { get { return State == State.SetDefaults || State == State.Configure ? Name : string.Empty; } }

        // ── El ratón y el segundero (en el hilo del gráfico) ─────────────────
        private void Enganchar()
        {
            if (enganchado || ChartControl == null) return;
            enganchado = true;
            ChartControl.PreviewMouseLeftButtonDown += AlPulsar;
            ChartControl.PreviewMouseMove           += AlMover;
            ChartControl.PreviewMouseLeftButtonUp   += AlSoltar;
            reloj = new DispatcherTimer(DispatcherPriority.Background, ChartControl.Dispatcher);
            reloj.Interval = TimeSpan.FromSeconds(1);
            reloj.Tick += delegate { if (State == State.Realtime) ForceRefresh(); };
            reloj.Start();
        }

        private void Soltar()
        {
            if (reloj != null) { reloj.Stop(); reloj = null; }
            if (!enganchado || ChartControl == null) return;
            ChartControl.PreviewMouseLeftButtonDown -= AlPulsar;
            ChartControl.PreviewMouseMove           -= AlMover;
            ChartControl.PreviewMouseLeftButtonUp   -= AlSoltar;
            enganchado = false;
        }

        private SharpDX.Vector2 Raton(MouseEventArgs e)
        {
            System.Windows.Point p = e.GetPosition(ChartControl);
            return new SharpDX.Vector2(
                (float)ChartingExtensions.ConvertToHorizontalPixels(p.X, ChartControl.PresentationSource),
                (float)ChartingExtensions.ConvertToVerticalPixels(p.Y, ChartControl.PresentationSource));
        }

        private void AlPulsar(object sender, MouseButtonEventArgs e)
        {
            if (caja.Width <= 0) return;
            var m = Raton(e);
            if (m.X < caja.Left || m.X > caja.Right || m.Y < caja.Top || m.Y > caja.Bottom) return;
            arrastrando = true;
            agarreX = m.X - caja.Left;
            agarreY = m.Y - caja.Top;
            ChartControl.CaptureMouse();
            e.Handled = true;       // que el gráfico no se desplace ni seleccione nada
        }

        private void AlMover(object sender, MouseEventArgs e)
        {
            if (!arrastrando) return;
            var m = Raton(e);
            PosX = m.X - agarreX - ChartPanel.X;
            PosY = m.Y - agarreY - ChartPanel.Y;
            ForceRefresh();
            e.Handled = true;
        }

        private void AlSoltar(object sender, MouseButtonEventArgs e)
        {
            if (!arrastrando) return;
            arrastrando = false;
            ChartControl.ReleaseMouseCapture();
            e.Handled = true;
        }

        /// <summary>La hora de la última entrada de la cuenta ese día (la ejecución que la saca de plano), o null.</summary>
        private DateTime? Entrada(DateTime dia)
        {
            if (string.IsNullOrEmpty(Cuenta)) return null;
            Account acc = null;
            lock (Account.All)
                acc = Account.All.FirstOrDefault(a => string.Equals(a.Name, Cuenta, StringComparison.OrdinalIgnoreCase));
            if (acc == null) return null;

            List<Execution> ejecs;
            lock (acc.Executions)
                ejecs = acc.Executions.Where(e => e.Time.Date == dia).OrderBy(e => e.Time).ToList();
            var pos = new Dictionary<string, int>();
            DateTime? entrada = null;
            foreach (var e in ejecs)
            {
                string ins = e.Instrument != null ? e.Instrument.FullName : "";
                bool plana = pos.Values.All(v => v == 0);
                int p;
                pos.TryGetValue(ins, out p);
                pos[ins] = p + (e.MarketPosition == MarketPosition.Long ? e.Quantity : -e.Quantity);
                if (plana && pos.Values.Any(v => v != 0)) entrada = e.Time;
            }
            return entrada;
        }

        // ── El dibujo ────────────────────────────────────────────────────────
        protected override void OnRender(ChartControl chartControl, ChartScale chartScale)
        {
            base.OnRender(chartControl, chartScale);
            if (Bars == null || Bars.Count == 0 || ChartPanel == null) return;

            DateTime ultima = Bars.GetTime(Bars.Count - 1);
            DateTime ahora  = State == State.Realtime ? NinjaTrader.Core.Globals.Now : ultima;
            string l1 = Fecha(ultima);
            DateTime? entrada = Entrada(ultima.Date);
            string l2 = entrada.HasValue ? "Entry = " + entrada.Value.ToString("HH:mm:ss") : ahora.ToString("HH:mm:ss");

            var dw = NinjaTrader.Core.Globals.DirectWriteFactory;
            using (var tf = new SharpDX.DirectWrite.TextFormat(dw, Fuente, SharpDX.DirectWrite.FontWeight.Bold,
                                SharpDX.DirectWrite.FontStyle.Normal, Tamano))
            using (var t1 = new SharpDX.DirectWrite.TextLayout(dw, l1, tf, 2000f, 200f))
            using (var t2 = new SharpDX.DirectWrite.TextLayout(dw, l2, tf, 2000f, 200f))
            {
                float padX = Tamano * .6f, padY = Tamano * .35f, entre = Tamano * .15f;
                float w = Math.Max(t1.Metrics.Width, t2.Metrics.Width) + padX * 2;
                float h = t1.Metrics.Height + t2.Metrics.Height + entre + padY * 2;

                // Dentro del panel siempre: si se achica, el recuadro vuelve al borde.
                float x = (float)Math.Max(0, Math.Min(PosX, ChartPanel.W - w));
                float y = (float)Math.Max(0, Math.Min(PosY, ChartPanel.H - h));
                caja = new SharpDX.RectangleF(ChartPanel.X + x, ChartPanel.Y + y, w, h);

                var fondo = ColorFondo.ToDxBrush(RenderTarget);
                var texto = ColorTexto.ToDxBrush(RenderTarget);
                try
                {
                    RenderTarget.FillRectangle(caja, fondo);
                    RenderTarget.DrawTextLayout(new SharpDX.Vector2(caja.Left + (w - t1.Metrics.Width) / 2, caja.Top + padY), t1, texto);
                    RenderTarget.DrawTextLayout(new SharpDX.Vector2(caja.Left + (w - t2.Metrics.Width) / 2,
                                                                    caja.Top + padY + t1.Metrics.Height + entre), t2, texto);
                }
                finally { fondo.Dispose(); texto.Dispose(); }
            }
        }

        #region Propiedades
        [TypeConverter(typeof(AccountNameConverter))]
        [Display(Name = "Cuenta de la entrada", Order = 0, GroupName = "Recuadro",
                 Description = "Si ese día entró, la segunda línea dice «Entry = » y la hora de la entrada; si no, la hora.")]
        public string Cuenta { get; set; }

        [Range(8, 72)]
        [Display(Name = "Tamaño de la letra", Order = 1, GroupName = "Recuadro")]
        public int Tamano { get; set; }

        [Display(Name = "Tipo de letra", Order = 2, GroupName = "Recuadro")]
        public string Fuente { get; set; }

        [XmlIgnore]
        [Display(Name = "Fondo", Order = 3, GroupName = "Recuadro")]
        public Brush ColorFondo { get; set; }

        [Browsable(false)]
        public string ColorFondoSerializable
        {
            get { return Serialize.BrushToString(ColorFondo); }
            set { ColorFondo = Serialize.StringToBrush(value); }
        }

        [XmlIgnore]
        [Display(Name = "Letra", Order = 4, GroupName = "Recuadro")]
        public Brush ColorTexto { get; set; }

        [Browsable(false)]
        public string ColorTextoSerializable
        {
            get { return Serialize.BrushToString(ColorTexto); }
            set { ColorTexto = Serialize.StringToBrush(value); }
        }

        // Dónde está, en píxeles desde la esquina de arriba a la izquierda del panel. No se ven en las propiedades:
        // se cambian arrastrando, y el espacio de trabajo las guarda.
        [Browsable(false)]
        public double PosX { get; set; }

        [Browsable(false)]
        public double PosY { get; set; }
        #endregion
    }
}
