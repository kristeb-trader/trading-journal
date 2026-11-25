// FotoChaumer — la foto de la operativa, sola y al Journal
//
// Sustituye a la captura que Kris hacía a mano al terminar, la recortaba y la subía en el Diario (16/11/2026).
//
//   Qué       la ventana del gráfico entera (barra de herramientas, velas, volumen y Chart Trader), como su captura
//             del 16/11. La hace NinjaTrader por dentro (Chart.GetScreenshot), no es una foto de la pantalla: sale
//             bien aunque otra ventana tape el gráfico. Minimizada no se puede: espera a que vuelva.
//   Tamaño    siempre Ancho × Alto (2000 × 1190, el de su captura): la ventana se encaja sin deformarse y el
//             sobrante queda en negro.
//   Cuándo    · sola, «Minutos tras cerrar» (3) después de que la cuenta principal quede plana. Si vuelve a operar
//               antes, espera a la última salida. Solo en tiempo real y con las operaciones de hoy.
//             · sola, al final de la ventana (11:30 de Nueva York) si ese día no operó y aún no hay foto.
//             · con el botón de la cámara de la barra del gráfico («Foto del día»), cuando quiera.
//   Dónde     1) Documentos\NinjaTrader 8\fotos-chaumer\AAAA-MM-DD.png  2) Cloudinary (el preset del Diario)
//             3) sesiones.imagen_url de ese día, que leen el Diario, el Coach, el visor y el portal.
//   Respeta   la automática NO pisa una imagen que Kris haya puesto en el Diario: solo escribe si el día no tiene
//             o si la que tiene la subió ella (la apunta en AAAA-MM-DD.url). El botón sí la reemplaza.
//
// La fecha de la foto es la de la última vela del gráfico (en Market Replay, el día que se reproduce). Sábado y
// domingo, solo en el PC. La cuenta principal es objetivos.cuenta_principal, la misma de SupabaseAutoExport.
// Si falla la red, la foto queda en el PC y se dice en la ventana de salida (NinjaScript Output); el botón reintenta.
//
// En C# 5. Usa ChaumerNT (la clave de Supabase). Instalar: copiar a Documentos\NinjaTrader 8\bin\Custom\Indicators\,
// F5, y añadirlo al gráfico operativo.

#region Using declarations
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using Newtonsoft.Json.Linq;
using NinjaTrader.Cbi;
using NinjaTrader.Gui.Chart;
using NinjaTrader.NinjaScript;
#endregion

namespace NinjaTrader.NinjaScript.Indicators
{
    public class FotoChaumer : Indicator
    {
        private const string CLOUDINARY = "https://api.cloudinary.com/v1_1/dq4n7bjta/image/upload";
        private const string PRESET     = "trading-journal";   // el del Diario (js/config.js): sin firma, no es secreto
        private const string TELEGRAM_FOTO = "https://trading-journal-bot.kristerock.workers.dev/foto";
        private static readonly string DIR = Path.Combine(ChaumerNT.DIR_NT, "fotos-chaumer");

        private Chart ventana;
        private System.Windows.Controls.Button boton;
        private DispatcherTimer vigia;
        private volatile string cuentaPrincipal;
        private DateTime cuentaLeida = DateTime.MinValue;
        private volatile bool ocupado;
        private TimeZoneInfo nuevaYork;

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Name                     = "Foto Chaumer";
                Description              = "La foto de la operativa: sola tras cerrar la operación, y al Journal.";
                Calculate                = Calculate.OnBarClose;
                IsOverlay                = true;
                DisplayInDataBox         = false;
                PaintPriceMarkers        = false;
                IsSuspendedWhileInactive = false;
                Ancho                    = 2000;
                Alto                     = 1190;
                MinutosTrasCerrar        = 3;
                FotoSinOperacion         = true;
                SubirAlJournal           = true;
            }
            else if (State == State.DataLoaded)
            {
                try   { nuevaYork = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"); }
                catch { nuevaYork = null; }
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

        protected override void OnBarUpdate() { }

        // Sin la etiqueta «Foto Chaumer(MNQ 12-26 (1 Minute))» arriba a la izquierda del gráfico: salía en la foto.
        // En la ventana de Indicadores (las copias que edita están en SetDefaults o Configure) sí lleva el nombre: vacío, la
        // lista «Configured» salía en blanco (17/11/2026).
        public override string DisplayName { get { return State == State.SetDefaults || State == State.Configure ? Name : string.Empty; } }

        // ── El botón y el vigía (en el hilo del gráfico) ─────────────────────
        private void Enganchar()
        {
            if (ventana != null || ChartControl == null) return;
            ventana = Window.GetWindow(ChartControl.Parent) as Chart;
            if (ventana == null) return;

            // El vigía primero: si el botón falla, la foto automática sigue funcionando.
            vigia = new DispatcherTimer(DispatcherPriority.Background, ChartControl.Dispatcher);
            vigia.Interval = TimeSpan.FromSeconds(5);
            vigia.Tick += delegate { Vigilar(); };
            vigia.Start();

            try { PonerBoton(); }
            catch (Exception ex) { Print("[FotoChaumer] no se pudo poner el botón de la cámara: " + Mensaje(ex)); }
        }

        // Un icono de cámara, como los de la barra de NinjaTrader (17/11/2026; antes, el texto «Foto del día»). Su fuente de
        // iconos (IconsFamily) no trae cámara: va la de Windows (Segoe Fluent Icons; en Windows 10, MDL2), de línea y de un
        // color como los suyos. Plantilla propia, plana, con un sombreado al pasar el ratón: copiar el estilo de un botón de
        // la barra dejaba el botón sin poner (17/11/2026, dos intentos), y lo que hay dentro de NinjaTrader no se ve desde aquí.
        private void PonerBoton()
        {
            var fondo = new FrameworkElementFactory(typeof(System.Windows.Controls.Border));
            fondo.Name = "fondo";
            fondo.SetValue(System.Windows.Controls.Border.BackgroundProperty, Brushes.Transparent);
            fondo.SetValue(System.Windows.Controls.Border.CornerRadiusProperty, new CornerRadius(2));
            fondo.SetValue(System.Windows.Controls.Border.PaddingProperty, new Thickness(5, 1, 5, 1));
            var contenido = new FrameworkElementFactory(typeof(System.Windows.Controls.ContentPresenter));
            contenido.SetValue(FrameworkElement.VerticalAlignmentProperty, VerticalAlignment.Center);
            fondo.AppendChild(contenido);

            var plantilla = new System.Windows.Controls.ControlTemplate(typeof(System.Windows.Controls.Button)) { VisualTree = fondo };
            var encima = new Trigger { Property = UIElement.IsMouseOverProperty, Value = true };
            var sombra = new SolidColorBrush(Color.FromArgb(0x40, 0xFF, 0xFF, 0xFF));
            sombra.Freeze();
            encima.Setters.Add(new Setter(System.Windows.Controls.Border.BackgroundProperty, sombra, "fondo"));
            plantilla.Triggers.Add(encima);

            var color = Application.Current.TryFindResource("FontActionBrush") as Brush;
            boton = new System.Windows.Controls.Button
            {
                Template          = plantilla,
                Content           = new System.Windows.Controls.TextBlock
                {
                    Text       = "\uE722",       // Camera
                    FontFamily = new FontFamily("Segoe Fluent Icons, Segoe MDL2 Assets"),
                    FontSize   = 15,
                    Foreground = color ?? Brushes.Gainsboro,
                },
                ToolTip           = "Foto del día: la ventana, en tu PC y en el Journal (reemplaza la del día)",
                Margin            = new Thickness(4, 0, 4, 0),
                VerticalAlignment = VerticalAlignment.Center,
                Cursor            = System.Windows.Input.Cursors.Hand,
            };
            boton.Click += delegate { Foto(true); };
            ventana.MainMenu.Add(boton);
            Print("[FotoChaumer] botón de la cámara puesto en la barra");
        }

        private void Soltar()
        {
            if (vigia != null) { vigia.Stop(); vigia = null; }
            if (ventana != null && boton != null) ventana.MainMenu.Remove(boton);
            boton = null; ventana = null;
        }

        // Cada 5 segundos: ¿toca la foto automática?
        private void Vigilar()
        {
            if (State != State.Realtime || ventana == null || ocupado) return;
            DateTime ahora = NinjaTrader.Core.Globals.Now;
            if (ahora.DayOfWeek == DayOfWeek.Saturday || ahora.DayOfWeek == DayOfWeek.Sunday) return;
            LeerCuentaPrincipal(ahora);
            string nombre = cuentaPrincipal;
            if (string.IsNullOrEmpty(nombre)) return;

            Account acc = null;
            lock (Account.All)
                acc = Account.All.FirstOrDefault(a => string.Equals(a.Name, nombre, StringComparison.OrdinalIgnoreCase));
            if (acc == null) return;

            bool opero;
            DateTime? salida = UltimaSalida(acc, ahora.Date, out opero);
            string marca = Ruta(ahora.Date, ".salida");

            if (salida.HasValue)
            {
                if (ahora < salida.Value.AddMinutes(MinutosTrasCerrar)) return;
                string clave = salida.Value.Ticks.ToString(CultureInfo.InvariantCulture);
                if (Leer(marca) == clave) return;                       // esa salida ya tiene su foto
                if (Foto(false)) Escribir(marca, clave);
            }
            else if (!opero && FotoSinOperacion && ahora >= FinVentana(ahora.Date)
                     && !File.Exists(Ruta(ahora.Date, ".png")))
            {
                if (Foto(false)) Escribir(marca, "sin operación");
            }
        }

        /// <summary>La hora de la última vez que la cuenta quedó plana hoy, o null si ahora mismo está dentro (o no operó).
        /// Se reconstruye desde las ejecuciones del día, así que sirve también tras recompilar o reabrir el gráfico.</summary>
        private static DateTime? UltimaSalida(Account acc, DateTime hoy, out bool opero)
        {
            List<Execution> ejecs;
            lock (acc.Executions)
                ejecs = acc.Executions.Where(e => e.Time.Date == hoy).OrderBy(e => e.Time).ToList();
            opero = ejecs.Count > 0;

            var pos = new Dictionary<string, int>();
            DateTime? salida = null;
            foreach (var e in ejecs)
            {
                string ins = e.Instrument != null ? e.Instrument.FullName : "";
                int p;
                pos.TryGetValue(ins, out p);
                pos[ins] = p + (e.MarketPosition == MarketPosition.Long ? e.Quantity : -e.Quantity);
                salida = pos.Values.All(v => v == 0) ? (DateTime?)e.Time : null;
            }
            return salida;
        }

        private DateTime FinVentana(DateTime hoy)
        {
            DateTime ny = hoy.AddHours(11).AddMinutes(30);              // 11:30 de Nueva York
            if (nuevaYork == null) return ny;
            return TimeZoneInfo.ConvertTime(DateTime.SpecifyKind(ny, DateTimeKind.Unspecified), nuevaYork,
                                            NinjaTrader.Core.Globals.GeneralOptions.TimeZoneInfo);
        }

        private void LeerCuentaPrincipal(DateTime ahora)
        {
            if ((ahora - cuentaLeida).TotalMinutes < 10) return;
            cuentaLeida = ahora;
            Task.Run(() =>
            {
                try
                {
                    using (var http = ChaumerNT.Cliente())
                    {
                        if (http == null) { Print("[FotoChaumer] sin la clave de Supabase: no sé cuál es la cuenta principal"); return; }
                        JArray a = ChaumerNT.Get(http, "objetivos?id=eq.1&select=cuenta_principal");
                        if (a.Count > 0) cuentaPrincipal = (string)a[0]["cuenta_principal"];
                    }
                }
                catch (Exception ex) { Print("[FotoChaumer] no se pudo leer la cuenta principal: " + ex.Message); }
            });
        }

        // ── La foto ──────────────────────────────────────────────────────────
        /// <summary>Hace la foto (en el hilo del gráfico), la guarda y la sube en segundo plano. false si no se pudo hacer.</summary>
        private bool Foto(bool aMano)
        {
            if (ventana == null || ocupado || Bars == null || Bars.Count == 0) return false;
            if (ventana.WindowState == WindowState.Minimized)
            {
                if (aMano) Print("[FotoChaumer] la ventana está minimizada: no se puede fotografiar");
                return false;
            }
            DateTime dia = Bars.GetTime(Bars.Count - 1).Date;
            byte[] png;
            try
            {
                BitmapSource crudo = ventana.GetScreenshot(ShareScreenshotType.Window, null);
                png = Png(Encajar(crudo, Ancho, Alto));
                Directory.CreateDirectory(DIR);
                File.WriteAllBytes(Ruta(dia, ".png"), png);
            }
            catch (Exception ex)
            {
                Print("[FotoChaumer] no se pudo hacer la foto: " + ex.Message);
                return false;
            }
            Print("[FotoChaumer] foto del " + dia.ToString("yyyy-MM-dd") + (aMano ? " (botón)" : " (automática)") + ": " + Ruta(dia, ".png"));

            bool finde = dia.DayOfWeek == DayOfWeek.Saturday || dia.DayOfWeek == DayOfWeek.Sunday;
            if (SubirAlJournal && !finde)
            {
                ocupado = true;
                Task.Run(() => { try { Subir(dia, png, aMano); } finally { ocupado = false; } });
            }
            // La automática va también a Telegram (25/11/2026): con ella llega la pregunta del setup.
            if (!aMano && !finde) Task.Run(() => AvisarTelegram(dia, png));
            return true;
        }

        private static BitmapSource Encajar(BitmapSource src, int w, int h)
        {
            double k = Math.Min((double)w / src.PixelWidth, (double)h / src.PixelHeight);
            double iw = src.PixelWidth * k, ih = src.PixelHeight * k;
            var dv = new DrawingVisual();
            RenderOptions.SetBitmapScalingMode(dv, BitmapScalingMode.HighQuality);
            using (DrawingContext dc = dv.RenderOpen())
            {
                dc.DrawRectangle(Brushes.Black, null, new Rect(0, 0, w, h));
                dc.DrawImage(src, new Rect((w - iw) / 2, (h - ih) / 2, iw, ih));
            }
            var rtb = new RenderTargetBitmap(w, h, 96, 96, PixelFormats.Pbgra32);
            rtb.Render(dv);
            return rtb;
        }

        private static byte[] Png(BitmapSource img)
        {
            var enc = new PngBitmapEncoder();
            enc.Frames.Add(BitmapFrame.Create(img));
            using (var ms = new MemoryStream()) { enc.Save(ms); return ms.ToArray(); }
        }

        // En segundo plano: primero si se puede (la automática no pisa la del Diario), luego Cloudinary y sesiones.imagen_url.
        private void Subir(DateTime dia, byte[] png, bool aMano)
        {
            string fecha = dia.ToString("yyyy-MM-dd");
            if (!aMano)
            {
                try
                {
                    using (var http = ChaumerNT.Cliente())
                    {
                        if (http == null) { Print("[FotoChaumer] sin la clave de Supabase: la foto se queda en el PC"); return; }
                        JArray a = ChaumerNT.Get(http, "sesiones?sesion_date=eq." + fecha + "&select=imagen_url");
                        string actual = a.Count > 0 ? (string)a[0]["imagen_url"] : null;
                        if (!string.IsNullOrEmpty(actual) && actual != Leer(Ruta(dia, ".url")))
                        {
                            Print("[FotoChaumer] el " + fecha + " ya tiene una imagen tuya en el Diario: no se cambia (el botón la reemplaza)");
                            return;
                        }
                    }
                }
                catch (Exception ex) { Print("[FotoChaumer] no se pudo mirar la imagen del día (queda en el PC; el botón reintenta): " + Mensaje(ex)); return; }
            }

            string url;
            try
            {
                using (var http = new HttpClient { Timeout = TimeSpan.FromSeconds(60) })
                using (var form = new MultipartFormDataContent())
                {
                    var img = new ByteArrayContent(png);
                    img.Headers.ContentType = MediaTypeHeaderValue.Parse("image/png");
                    form.Add(img, "file", fecha + ".png");
                    form.Add(new StringContent(PRESET), "upload_preset");
                    HttpResponseMessage res = http.PostAsync(CLOUDINARY, form).Result;
                    string cuerpo = res.Content.ReadAsStringAsync().Result;
                    if (!res.IsSuccessStatusCode) throw new Exception("Cloudinary HTTP " + (int)res.StatusCode + ": " + Corto(cuerpo));
                    url = (string)JObject.Parse(cuerpo)["secure_url"];
                    if (string.IsNullOrEmpty(url)) throw new Exception("Cloudinary no devolvió la URL");
                }
            }
            catch (Exception ex) { Print("[FotoChaumer] no se subió (queda en el PC; el botón reintenta): " + Mensaje(ex)); return; }

            try
            {
                using (var http = ChaumerNT.Cliente())
                {
                    if (http == null) { Print("[FotoChaumer] subida a Cloudinary, pero sin la clave de Supabase no llega al Journal: " + url); return; }
                    var cuerpo = new JObject { { "sesion_date", fecha }, { "imagen_url", url } };
                    var req = new HttpRequestMessage(HttpMethod.Post, ChaumerNT.URL + "sesiones?on_conflict=sesion_date");
                    req.Headers.Add("Prefer", "resolution=merge-duplicates,return=minimal");
                    req.Content = new StringContent(cuerpo.ToString(), Encoding.UTF8, "application/json");
                    HttpResponseMessage res = http.SendAsync(req).Result;
                    if (!res.IsSuccessStatusCode)
                        throw new Exception("Supabase HTTP " + (int)res.StatusCode + ": " + Corto(res.Content.ReadAsStringAsync().Result));
                }
                Escribir(Ruta(dia, ".url"), url);
                Print("[FotoChaumer] ✅ en el Journal, el " + fecha + ": " + url);
            }
            catch (Exception ex) { Print("[FotoChaumer] subida a Cloudinary, pero no llegó al Journal: " + Mensaje(ex) + " · " + url); }
        }

        // A /foto del bot de Telegram, con el secreto de /notify (el de SupabaseAutoExport, fuera del repo). El bot la
        // manda con el trade en el pie y la pregunta Continuación / Reingreso; si no llega, pregunta igual a los 8 minutos.
        private void AvisarTelegram(DateTime dia, byte[] png)
        {
            try
            {
                string secreto = Leer(Path.Combine(ChaumerNT.DIR_NT, "telegram-notify-secret.txt"));
                if (string.IsNullOrEmpty(secreto)) { Print("[FotoChaumer] sin telegram-notify-secret.txt: la foto no va a Telegram"); return; }
                var cuerpo = new JObject { { "fecha", dia.ToString("yyyy-MM-dd") }, { "png", Convert.ToBase64String(png) } };
                using (var http = new HttpClient { Timeout = TimeSpan.FromSeconds(60) })
                {
                    var req = new HttpRequestMessage(HttpMethod.Post, TELEGRAM_FOTO);
                    req.Headers.Add("X-Notify-Token", secreto);
                    req.Content = new StringContent(cuerpo.ToString(), Encoding.UTF8, "application/json");
                    HttpResponseMessage res = http.SendAsync(req).Result;
                    string r = res.Content.ReadAsStringAsync().Result;
                    Print("[FotoChaumer] Telegram: " + (res.IsSuccessStatusCode ? r : "HTTP " + (int)res.StatusCode + " " + Corto(r)));
                }
            }
            catch (Exception ex) { Print("[FotoChaumer] no llegó a Telegram (pregunta sin foto a los 8 min): " + Mensaje(ex)); }
        }

        // ── Utilidades ───────────────────────────────────────────────────────
        private static string Ruta(DateTime dia, string ext) { return Path.Combine(DIR, dia.ToString("yyyy-MM-dd") + ext); }

        private static string Leer(string ruta)
        {
            try { return File.Exists(ruta) ? File.ReadAllText(ruta).Trim() : null; } catch { return null; }
        }

        private static void Escribir(string ruta, string txt)
        {
            try { Directory.CreateDirectory(DIR); File.WriteAllText(ruta, txt); } catch { }
        }

        private static string Corto(string s) { return s == null ? "" : (s.Length > 200 ? s.Substring(0, 200) : s); }

        private static string Mensaje(Exception ex)
        {
            while (ex.InnerException != null) ex = ex.InnerException;
            return ex.Message;
        }

        #region Propiedades
        [Range(400, 8000)]
        [Display(Name = "Ancho (px)", Order = 1, GroupName = "Foto")]
        public int Ancho { get; set; }

        [Range(300, 8000)]
        [Display(Name = "Alto (px)", Order = 2, GroupName = "Foto")]
        public int Alto { get; set; }

        [Range(0, 60)]
        [Display(Name = "Minutos tras cerrar", Order = 3, GroupName = "Foto",
                 Description = "Cuánto espera, después de que la cuenta principal quede plana, para hacer la foto sola.")]
        public int MinutosTrasCerrar { get; set; }

        [Display(Name = "Foto los días sin operación", Order = 4, GroupName = "Foto",
                 Description = "A las 11:30 de Nueva York, si no operaste y aún no hay foto.")]
        public bool FotoSinOperacion { get; set; }

        [Display(Name = "Subir al Journal", Order = 5, GroupName = "Foto",
                 Description = "Apagado, la foto solo se guarda en Documentos\\NinjaTrader 8\\fotos-chaumer.")]
        public bool SubirAlJournal { get; set; }
        #endregion
    }
}
