// ═══════════════════════════════════════════════════════════════════════════
//  VistaMotorChaumer — el motor del bot, dibujado en vivo sobre el gráfico
//  Diseño: docs/disenos/2026-10-06-bot-chaumer.md §12.2 · D-038
//
//  Corre MotorChaumer (el mismo motor sellado que opera BotChaumer) al cierre de cada vela, sobre
//  las velas del día, y dibuja lo que sale con el estándar de los gráficos del motor (dia.py):
//    · zonas grises (vigentes marcadas con su etiqueta; inactivas, tenues)
//    · el zigzag blanco de corridas y retrocesos
//    · los puntos de referencia, solo si en el día se presentó un reingreso
//    · la operación: franja roja entrada→stop y verde entrada→objetivo, solo sobre su tramo
//    · una línea arriba con lo que el motor tiene en marcha
//  Al llenarse la orden del motor no se dibujan más zonas (R-28); el zigzag sigue hasta el resultado.
//  Las zonas de premercado se dibujan desde la vela donde nacen; las demás, desde la vela base (14/10/2026).
//  El premercado, como el bot, se pide al servidor (14/10/2026); hasta que llega, se usa el del gráfico.
//
//  No decide nada ni toca cuentas: solo enseña el motor. No depende del bot ni el bot de él.
//  NO es MarcacionChaumer: ese es el indicador del gráfico operativo de Kris y no se toca (07/10/2026).
//  Si están los dos en el mismo gráfico, apaga el zigzag de uno.
//
//  Solo el último día con ventana (en Market Replay, el que se reproduce). Sin el sello del motor no
//  dibuja nada; sin Supabase dibuja zonas y zigzag pero no la operación (dependen de noticias y Fed).
//
//  En C# 5. Instalar: copiar a Documentos\NinjaTrader 8\bin\Custom\Indicators\ (con MotorChaumer.cs y
//  ChaumerNT.cs en Custom\AddOns\) y F5. Gráfico MNQ 1 minuto con la plantilla ETH.
// ═══════════════════════════════════════════════════════════════════════════

#region Using declarations
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using NinjaTrader.Gui.Chart;
using NinjaTrader.NinjaScript;
#endregion

namespace NinjaTrader.NinjaScript.Indicators
{
    public class VistaMotorChaumer : Indicator
    {
        // ── la foto que se dibuja (la arma OnBarUpdate, la lee OnRender) ──────
        // X1 -1 = hasta el borde (ventana aún abierta). FinVentana: X1 es la última vela de la ventana y la zona la cubre entera
        private class ZonaDib { public int X0, X1; public double Lo, Hi; public bool Vigente, FinVentana; public string Etiqueta; }
        private class RefDib { public int X0, X1; public double Precio; public bool Vivo; }
        private class OpDib { public int X0, X1; public double E, S, T; public bool Pendiente; }
        private class Foto
        {
            public List<ZonaDib> Zonas = new List<ZonaDib>();
            public List<KeyValuePair<int, double>> Zigzag = new List<KeyValuePair<int, double>>();
            public List<RefDib> Refs = new List<RefDib>();
            public OpDib Op;
            public string Cabecera, Aviso;
            public bool Fed;
            public int ColorCabecera;       // 0 gris · 1 verde · 2 rojo · 3 oro
        }

        private static readonly CultureInfo ES = CultureInfo.GetCultureInfo("es-ES");
        private volatile Foto foto;
        private string problema;            // sin sello: no se dibuja nada
        private MotorChaumer.Parametros P;
        private HttpClient http;
        private string repo;                // para leer las velas del bot (19/10/2026)
        private TimeZoneInfo tzNt;

        // estado del día que se calcula
        private string dia;
        private int inicioDia = -1, ultimaVela = -1;
        private readonly List<MotorChaumer.Vela> velas = new List<MotorChaumer.Vela>();
        private readonly List<int> barraDe = new List<int>();   // la barra del gráfico de cada vela del motor (para dibujar)
        private MotorChaumer motor;
        private bool sinNoticias, fed;
        // el premercado del servidor, como el bot (14/10/2026): hasta que llega, el del gráfico
        private volatile List<MotorChaumer.Vela> pmServidor;
        private string pmDia;

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Name = "VistaMotorChaumer";
                Description = "El motor del bot (MotorChaumer, sellado) dibujado en vivo: zonas, zigzag, puntos de referencia y la operación.";
                Calculate = Calculate.OnBarClose;
                IsOverlay = true;
                DisplayInDataBox = false;
                DrawOnPricePanel = true;
                PaintPriceMarkers = false;
                IsSuspendedWhileInactive = false;
                VerZonas = true; VerZigzag = true; VerPuntos = false; VerReferencias = true; VerOperacion = true; VerEtiquetas = true; VerCabecera = true;
            }
            else if (State == State.DataLoaded)
            {
                tzNt = Core.Globals.GeneralOptions.TimeZoneInfo;
                var cfg = ChaumerNT.LeerConfig(null);
                repo = cfg.Repo;
                problema = ChaumerNT.ComprobarMotor(cfg.Repo, out P);
                if (problema == null) http = ChaumerNT.Cliente();
                if (problema != null) Print("[VistaMotorChaumer] no dibuja: " + problema);
            }
            else if (State == State.Historical)
            {
                SetZOrder(-1);              // detrás de las velas, como en dia.py
            }
            else if (State == State.Terminated)
            {
                if (http != null) { http.Dispose(); http = null; }
            }
        }

        protected override void OnBarUpdate()
        {
            if (problema != null) return;
            // Solo velas CERRADAS, como el bot, sea cual sea el Calculate: el diálogo de Indicators puede guardarlo en
            // «On each tick» y entonces CurrentBar es la vela en formación. El 13/10/2026 la vista metía cada vela con
            // su primer tick (o=h=l=c) y no la volvía a leer: no vio la Continuación que el bot sí operó.
            bool cierre = State == State.Historical || Calculate == Calculate.OnBarClose;
            if (!cierre && !IsFirstTickOfBar) return;
            int cerrada = cierre ? CurrentBar : CurrentBar - 1;
            if (cerrada < 1) return;
            if (Bars.Count - 1 - cerrada > 1500) return;                     // solo lo reciente: el último día
            DateTime u = ChaumerNT.Utc(Bars, cerrada, tzNt);
            string d = u.ToString("yyyyMMdd", ChaumerNT.INV);
            int hm = u.Hour * 100 + u.Minute;
            if (hm < MotorChaumer.AperturaUtc(d)) return;                    // antes de la ventana: se queda la foto anterior
            try
            {
                if (d != dia) NuevoDia(d, cerrada);
                for (int i = ultimaVela + 1; i <= cerrada; i++) { velas.Add(ChaumerNT.Vela(Bars, i, tzNt)); barraDe.Add(i); }
                ultimaVela = cerrada;
                Calcular();
            }
            catch (Exception e) { Print("[VistaMotorChaumer] " + e.Message); }
        }

        private void Calcular()
        {
            // Las velas de la ventana que el bot ya apuntó mandan sobre las del gráfico: tras recargar el gráfico la vista
            // sigue viendo lo que vio el bot en vivo (19/10/2026, docs/disenos/2026-10-19-velas-del-bot.md)
            var vs = velas;
            if (repo != null && dia != null)
            {
                var bot = ChaumerNT.LeerVelasBot(ChaumerNT.RutaVelasBot(repo, dia.Substring(0, 4) + "-" + dia.Substring(4, 2) + "-" + dia.Substring(6, 2)));
                if (bot.Count > 0)
                {
                    vs = new List<MotorChaumer.Vela>(velas.Count);
                    foreach (var k in velas) { MotorChaumer.Vela f; vs.Add(bot.TryGetValue(k.D + k.T, out f) ? f : k); }
                }
            }
            var r = motor.Decidir(vs, dia, null);
            foto = Fotografiar(r);
            ForceRefresh();
        }

        /// <summary>Pide al servidor el premercado del día; al llegar, rehace las velas y la foto.</summary>
        private void PedirPremercado(string d)
        {
            DateTime desde, hasta;
            ChaumerNT.TramoPremercado(d, out desde, out hasta);
            ChaumerNT.PedirVelas(Instrument, Bars.TradingHours, desde, hasta, tzNt, delegate(List<MotorChaumer.Vela> v, string fallo)
            {
                if (v == null || v.Count == 0) { Print("[VistaMotorChaumer] premercado del servidor: " + (fallo ?? "sin velas") + " · uso el del gráfico"); return; }
                try { TriggerCustomEvent(delegate(object o) { if ((string)o == dia) { pmServidor = v; Rehacer(); } }, d); }
                catch (Exception e) { Print("[VistaMotorChaumer] " + e.Message); }
            });
        }

        /// <summary>Las velas del motor: el premercado del servidor (si ya llegó) y la ventana del gráfico.</summary>
        private void Rehacer()
        {
            var pm = pmServidor;
            if (pm == null || motor == null || ultimaVela < inicioDia) return;
            int ap = MotorChaumer.AperturaUtc(dia), primera = inicioDia;
            while (primera <= ultimaVela && Hm(primera) < ap) primera++;
            var porHora = new Dictionary<string, int>();
            for (int i = inicioDia; i < primera; i++) { var k = ChaumerNT.Vela(Bars, i, tzNt); porHora[k.D + k.T] = i; }
            velas.Clear(); barraDe.Clear();
            int ultima = inicioDia;
            foreach (var k in pm)
            {
                int j;
                if (porHora.TryGetValue(k.D + k.T, out j)) ultima = j;          // si el gráfico no tiene esa vela, la anterior que sí
                velas.Add(k); barraDe.Add(ultima);
            }
            for (int i = primera; i <= ultimaVela; i++) { velas.Add(ChaumerNT.Vela(Bars, i, tzNt)); barraDe.Add(i); }
            Calcular();
        }

        private int Hm(int idx) { DateTime u = ChaumerNT.Utc(Bars, idx, tzNt); return u.Hour * 100 + u.Minute; }

        /// <summary>La barra del gráfico de la vela i del motor (más allá de la última, se sigue contando).</summary>
        private int B(int i)
        {
            if (barraDe.Count == 0) return inicioDia + i;
            if (i < barraDe.Count) return barraDe[Math.Max(0, i)];
            return barraDe[barraDe.Count - 1] + (i - barraDe.Count + 1);
        }

        private void NuevoDia(string d, int cerrada)
        {
            dia = d;
            inicioDia = ChaumerNT.InicioDia(Bars, cerrada, d, tzNt);
            velas.Clear(); barraDe.Clear(); ultimaVela = inicioDia - 1;
            pmServidor = null;
            if (pmDia != d) { pmDia = d; PedirPremercado(d); }
            List<int> nots = new List<int>(); bool? go; fed = false; sinNoticias = true;
            if (http != null)
            {
                string fecha = d.Substring(0, 4) + "-" + d.Substring(4, 2) + "-" + d.Substring(6, 2);
                sinNoticias = ChaumerNT.LeerDia(http, fecha, out nots, out fed, out go) != null;
            }
            motor = new MotorChaumer(P, nots, fed);
        }

        // ═════════════════════════════════════════════════════════════ la foto (como dia.py)
        private Foto Fotografiar(MotorChaumer.Resultado r)
        {
            var f = new Foto();
            if (r == null) { f.Cabecera = "esperando la ventana"; return f; }
            if (r.Error != null) { f.Cabecera = "motor: " + r.Error; f.ColorCabecera = 3; return f; }
            var D = r.D; var t = r.Trade; int b = r.B;
            int ult = D.Count - 1;
            bool ventanaCerrada = MotorChaumer.Hm(D[r.Fin]) >= MotorChaumer.CierreUtc(D[b].D);   // ya está la vela de las 10:30 (11:30 en invierno)
            int corte = t != null ? t.IOut : ult;
            int corteZ = t != null ? t.IFill : corte;       // al llenarse la orden no se marcan más zonas (R-28)
            if (sinNoticias) { t = null; corte = ult; corteZ = ult; }

            int n = 0, vivas = 0;
            foreach (var z in r.Z)
            {
                if (z.I > corteZ) continue;
                n++;
                var g = z.En(corteZ);
                bool vig = z.Fin == null || z.Fin > corteZ;
                if (vig) vivas++;
                f.Zonas.Add(new ZonaDib
                {
                    // la de premercado, desde la vela donde nace; las demás, desde la vela base como mucho (Kris, 14/10/2026)
                    X0 = B(z.Pm ? z.IOrg : Math.Max(z.IOrg, b)),
                    // las vigentes acaban con la ventana (10:30 Col; 11:30 en invierno) en cuanto se cierra (Kris, 07/10/2026)
                    X1 = (z.Fin != null && z.Fin <= corteZ) ? B(z.Fin.Value) : (ventanaCerrada ? B(r.Fin) : -1),
                    FinVentana = !(z.Fin != null && z.Fin <= corteZ) && ventanaCerrada,
                    Lo = g[0], Hi = g[1], Vigente = vig,
                    Etiqueta = vig ? (z.Tipo == "R" ? "resistencia" : z.Tipo == "S" ? "soporte" : "zona") + "   "
                                     + g[0].ToString("N2", ES) + " – " + g[1].ToString("N2", ES) : null
                });
            }

            foreach (var v in r.Piv)
                if (v.I >= b && v.I <= corte) f.Zigzag.Add(new KeyValuePair<int, double>(B(v.I), v.Precio));

            // puntos de referencia (R-41): solo si se presentó un reingreso
            foreach (var re in r.Reingresos)
            {
                if (re.I > corteZ) continue;
                // ni los que quedan DETRÁS de una zona viva del camino: el precio choca antes con la zona (Kris, 15/10/2026)
                double? muro = null;
                foreach (var zm in r.Z)
                {
                    if (zm.I > re.I || (zm.Fin != null && zm.Fin <= re.I)) continue;
                    var gm = zm.En(re.I);
                    if (!(gm[1] > Math.Min(re.E, re.T) && gm[0] < Math.Max(re.E, re.T))) continue;
                    double m = re.Nd < 0 ? Math.Min(gm[1], re.E) : Math.Max(gm[0], re.E);
                    muro = muro == null ? m : (re.Nd < 0 ? Math.Max(muro.Value, m) : Math.Min(muro.Value, m));
                }
                // el reingreso que se OPERÓ deja además el punto de más allá del objetivo, el más cercano: no decide nada, pero
                // tiene que verse que el objetivo no lo pasa (Kris, 22/10/2026, el de la 8:49 del 20/08). Igual que dia.py.
                bool entrada = t != null && t.Tipo == "Reingreso" && t.I == re.I;
                RefDib detras = null;
                foreach (var v in r.Piv)
                {
                    int j = v.I; double pv = v.Precio;
                    if (j >= re.I) continue;
                    bool bajo = Math.Abs(pv - D[j].L) < 1e-9;
                    if ((re.Nd < 0) != bajo) continue;
                    bool fuera = re.Nd < 0 ? pv >= re.E : pv <= re.E;
                    if (fuera) continue;
                    int roto = -1;
                    for (int m = j + 1; m <= corte; m++)
                        if (bajo ? D[m].C < pv : D[m].C > pv) { roto = m; break; }
                    if (roto >= 0 && roto <= re.I) continue;
                    var p = new RefDib { X0 = B(Math.Max(j, b)), X1 = roto >= 0 ? B(roto + 1) : -1, Precio = pv, Vivo = roto < 0 };
                    // solo los que quedan ENTRE la entrada y el objetivo: los únicos que pueden descartar el reingreso (Kris, 07/10/2026)
                    if (re.Nd < 0 ? pv <= re.T : pv >= re.T)
                    {
                        if (entrada && (detras == null || (re.Nd < 0 ? pv > detras.Precio : pv < detras.Precio))) detras = p;
                        continue;
                    }
                    if (muro != null && (re.Nd < 0 ? pv <= muro.Value : pv >= muro.Value)) continue;
                    f.Refs.Add(p);
                }
                // tampoco ese si una zona viva queda entre el objetivo y el punto: el precio choca antes con la zona (15/10/2026)
                if (detras != null && muro == null)
                {
                    bool tapado = false;
                    foreach (var zm in r.Z)
                    {
                        if (zm.I > re.I || (zm.Fin != null && zm.Fin <= re.I)) continue;
                        var gm = zm.En(re.I);
                        if (gm[1] > Math.Min(re.T, detras.Precio) && gm[0] < Math.Max(re.T, detras.Precio)) { tapado = true; break; }
                    }
                    if (!tapado) f.Refs.Add(detras);
                }
            }

            string cab = n + " zonas · " + vivas + " vigentes";
            if (sinNoticias)
            {
                f.Aviso = "sin noticias de Supabase: no se muestra la operación";
            }
            else if (t != null)
            {
                f.Op = new OpDib { X0 = B(t.I), X1 = B(t.IOut), E = t.E, S = t.S, T = t.T };
                string sig = (t.Pts ?? 0) >= 0 ? "+" : "";
                cab += " · " + t.Tipo + (t.Dir > 0 ? " alcista" : " bajista") + " a las " + t.Hora + " · entrada " + P2(t.E)
                     + " · stop " + P2(t.S) + " · objetivo " + P2(t.T)
                     + (t.Res == "ABIERTO" ? "   →   ABIERTA" : "   →   " + t.Res + " " + t.HOut + " · " + sig + P2(t.Pts.Value) + " pts");
                f.ColorCabecera = t.Res == "TARGET" ? 1 : t.Res == "STOP" ? 2
                    : t.Res == "CIERRE POR HORA" ? ((t.Pts ?? 0) >= 0 ? 1 : 2) : 3;   // cierre por hora: verde si gana, rojo si pierde
            }
            else if (r.Orden != null)
            {
                var o = r.Orden;
                f.Op = new OpDib { X0 = B(o.I), X1 = -1, E = o.E, S = o.S, T = o.T, Pendiente = true };
                cab += " · orden: " + o.Tipo + (o.Dir > 0 ? " alcista" : " bajista") + " · entrada " + P2(o.E) + " · stop " + P2(o.S)
                     + " · objetivo " + P2(o.T) + (o.Pausa != null ? " · retirada por noticia" : "");
                f.ColorCabecera = 3;
            }
            else cab += " · sin operación";
            f.Cabecera = cab;
            f.Fed = fed && !sinNoticias;
            return f;
        }

        private static string P2(double x) { return x.ToString("N2", ES); }

        // ═════════════════════════════════════════════════════════════ dibujo
        private static SharpDX.Color4 C(int r, int g, int b, float a) { return new SharpDX.Color4(r / 255f, g / 255f, b / 255f, a); }

        protected override void OnRender(ChartControl chartControl, ChartScale chartScale)
        {
            base.OnRender(chartControl, chartScale);
            if (ChartBars == null || RenderTarget == null) return;
            var rt = RenderTarget;
            float xDer = ChartPanel.X + ChartPanel.W;
            float medio = (float)chartControl.GetBarPaintWidth(ChartBars) / 2f + 1f;
            var aa = rt.AntialiasMode;
            rt.AntialiasMode = SharpDX.Direct2D1.AntialiasMode.PerPrimitive;

            var gris = new SharpDX.Direct2D1.SolidColorBrush(rt, C(139, 147, 167, 1f));
            var blanco = new SharpDX.Direct2D1.SolidColorBrush(rt, C(255, 255, 255, 1f));
            var fondo = new SharpDX.Direct2D1.SolidColorBrush(rt, C(11, 14, 20, 1f));
            var naranja = new SharpDX.Direct2D1.SolidColorBrush(rt, C(255, 154, 60, 1f));
            var rojo = new SharpDX.Direct2D1.SolidColorBrush(rt, C(255, 92, 92, 1f));
            var verde = new SharpDX.Direct2D1.SolidColorBrush(rt, C(74, 222, 128, 1f));
            var oro = new SharpDX.Direct2D1.SolidColorBrush(rt, C(245, 197, 66, 1f));
            var trazos = new SharpDX.Direct2D1.StrokeStyle(Core.Globals.D2DFactory,
                new SharpDX.Direct2D1.StrokeStyleProperties { DashStyle = SharpDX.Direct2D1.DashStyle.Custom }, new float[] { 2f, 3f });
            var letra = new SharpDX.DirectWrite.TextFormat(Core.Globals.DirectWriteFactory, "Segoe UI",
                SharpDX.DirectWrite.FontWeight.Bold, SharpDX.DirectWrite.FontStyle.Normal, 12f);
            try
            {
                if (problema != null)
                {
                    Texto(rt, letra, "VistaMotorChaumer no dibuja: " + problema, ChartPanel.X + 8, ChartPanel.Y + 6, rojo, 1f, 900f);
                    return;
                }
                var f = foto;
                if (f == null) return;

                // la operación, debajo de todo
                if (VerOperacion && f.Op != null)
                {
                    float x0 = X(chartControl, f.Op.X0) - medio, x1 = f.Op.X1 >= 0 ? X(chartControl, f.Op.X1) + medio : xDer;
                    float a = f.Op.Pendiente ? .16f : .30f;   // más contraste (Kris, 27/10/2026; antes .07 / .13)
                    Rect(rt, rojo, a, x0, x1, chartScale.GetYByValue(f.Op.E), chartScale.GetYByValue(f.Op.S));
                    Rect(rt, verde, a, x0, x1, chartScale.GetYByValue(f.Op.E), chartScale.GetYByValue(f.Op.T));
                }

                // zonas y sus etiquetas
                var etiquetas = new List<Tuple<float, float, string>>();   // (y, x del final de la zona, texto)
                if (VerZonas)
                    foreach (var z in f.Zonas)
                    {
                        float x0 = X(chartControl, z.X0) - medio, x1 = z.X1 >= 0 ? X(chartControl, z.X1) + (z.FinVentana ? medio : 0f) : xDer;
                        float y0 = chartScale.GetYByValue(z.Hi), y1 = chartScale.GetYByValue(z.Lo);
                        var r = new SharpDX.RectangleF(x0, y0, Math.Max(1f, x1 - x0), Math.Max(1f, y1 - y0));
                        gris.Opacity = z.Vigente ? .28f : .10f; rt.FillRectangle(r, gris);
                        gris.Opacity = z.Vigente ? .9f : .45f; rt.DrawRectangle(r, gris, z.Vigente ? 1.5f : .7f);
                        if (z.Etiqueta != null) etiquetas.Add(Tuple.Create((y0 + y1) / 2f, Math.Min(x1, xDer), z.Etiqueta));
                    }

                // puntos de referencia
                if (VerReferencias)
                    foreach (var p in f.Refs)
                    {
                        float x0 = X(chartControl, p.X0), x1 = p.X1 >= 0 ? X(chartControl, p.X1) : xDer, y = chartScale.GetYByValue(p.Precio);
                        naranja.Opacity = p.Vivo ? .8f : .25f;
                        rt.DrawLine(new SharpDX.Vector2(x0, y), new SharpDX.Vector2(x1, y), naranja, p.Vivo ? 2f : 1.1f, trazos);
                        if (VerEtiquetas) Texto(rt, letra, "punto de referencia", x1 - 130, y - 16, naranja, p.Vivo ? .9f : .35f, 130f);
                    }
                naranja.Opacity = 1f;

                // zigzag
                if (VerZigzag && f.Zigzag.Count > 1)
                {
                    var xy = f.Zigzag.Select(v => new SharpDX.Vector2(X(chartControl, v.Key), chartScale.GetYByValue(v.Value))).ToList();
                    for (int k = 1; k < xy.Count; k++) rt.DrawLine(xy[k - 1], xy[k], fondo, 5.2f);
                    for (int k = 1; k < xy.Count; k++) rt.DrawLine(xy[k - 1], xy[k], blanco, 2.3f);
                    if (VerPuntos)
                        foreach (var v in xy)
                        {
                            var el = new SharpDX.Direct2D1.Ellipse(v, 3.5f, 3.5f);
                            rt.FillEllipse(el, blanco); rt.DrawEllipse(el, fondo, 1.2f);
                        }
                }

                // etiquetas de las zonas vigentes, a la derecha y sin pisarse
                if (VerZonas && VerEtiquetas && etiquetas.Count > 0)
                {
                    etiquetas.Sort((a, c) => a.Item1.CompareTo(c.Item1));
                    float yPrev = float.MinValue;
                    foreach (var e in etiquetas)
                    {
                        float y = Math.Max(e.Item1, yPrev + 16f); yPrev = y;
                        Texto(rt, letra, e.Item3, e.Item2 - 290, y - 8, gris, 1f, 280f, true);   // pegada al final de la zona
                    }
                }

                // cabecera
                if (VerCabecera)
                {
                    var color = f.ColorCabecera == 1 ? verde : f.ColorCabecera == 2 ? rojo : f.ColorCabecera == 3 ? oro : gris;
                    gris.Opacity = 1f;
                    Texto(rt, letra, f.Cabecera ?? "", ChartPanel.X + 8, ChartPanel.Y + 6, color, 1f, 1400f);
                    float y = ChartPanel.Y + 24;
                    if (f.Fed) { Texto(rt, letra, "DÍA DE FOMC · no se toman entradas de continuación, solo reingresos", ChartPanel.X + 8, y, oro, 1f, 900f); y += 18; }
                    if (f.Aviso != null) Texto(rt, letra, f.Aviso, ChartPanel.X + 8, y, oro, 1f, 900f);
                }
            }
            finally
            {
                rt.AntialiasMode = aa;
                gris.Dispose(); blanco.Dispose(); fondo.Dispose(); naranja.Dispose(); rojo.Dispose(); verde.Dispose(); oro.Dispose();
                trazos.Dispose(); letra.Dispose();
            }
        }

        private float X(ChartControl cc, int idx) { return cc.GetXByBarIndex(ChartBars, idx); }

        private static void Rect(SharpDX.Direct2D1.RenderTarget rt, SharpDX.Direct2D1.SolidColorBrush b, float a, float x0, float x1, float yA, float yB)
        {
            b.Opacity = a;
            rt.FillRectangle(new SharpDX.RectangleF(x0, Math.Min(yA, yB), Math.Max(1f, x1 - x0), Math.Abs(yB - yA)), b);
            b.Opacity = 1f;
        }

        private static void Texto(SharpDX.Direct2D1.RenderTarget rt, SharpDX.DirectWrite.TextFormat tf, string s, float x, float y,
                                  SharpDX.Direct2D1.SolidColorBrush b, float a, float ancho, bool derecha = false)
        {
            using (var tl = new SharpDX.DirectWrite.TextLayout(Core.Globals.DirectWriteFactory, s, tf, ancho, 20f))
            {
                if (derecha) tl.TextAlignment = SharpDX.DirectWrite.TextAlignment.Trailing;
                float antes = b.Opacity; b.Opacity = a;
                rt.DrawTextLayout(new SharpDX.Vector2(x, y), tl, b);
                b.Opacity = antes;
            }
        }

        #region Propiedades
        [Display(Name = "Zonas", Order = 1, GroupName = "Qué dibuja")] public bool VerZonas { get; set; }
        [Display(Name = "Zigzag", Order = 2, GroupName = "Qué dibuja", Description = "Apágalo si en el gráfico está también MarcacionChaumer.")]
        public bool VerZigzag { get; set; }
        [Display(Name = "Puntos de referencia", Order = 3, GroupName = "Qué dibuja")] public bool VerReferencias { get; set; }
        [Display(Name = "Operación", Order = 4, GroupName = "Qué dibuja")] public bool VerOperacion { get; set; }
        [Display(Name = "Etiquetas", Order = 5, GroupName = "Qué dibuja")] public bool VerEtiquetas { get; set; }
        [Display(Name = "Cabecera", Order = 6, GroupName = "Qué dibuja")] public bool VerCabecera { get; set; }
        [Display(Name = "Puntos del zigzag", Order = 7, GroupName = "Qué dibuja", Description = "Los puntos en los vértices del zigzag. Apagados por defecto (Kris, 27/10/2026).")]
        public bool VerPuntos { get; set; }
        #endregion
    }
}
