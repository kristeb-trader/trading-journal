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
        private class ZonaDib { public int X0, X1; public double Lo, Hi; public bool Vigente; public string Etiqueta; }   // X1 -1 = hasta el borde
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
        private TimeZoneInfo tzNt;

        // estado del día que se calcula
        private string dia;
        private int inicioDia = -1, ultimaVela = -1;
        private readonly List<MotorChaumer.Vela> velas = new List<MotorChaumer.Vela>();
        private MotorChaumer motor;
        private bool sinNoticias, fed;

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
                VerZonas = true; VerZigzag = true; VerReferencias = true; VerOperacion = true; VerEtiquetas = true; VerCabecera = true;
            }
            else if (State == State.DataLoaded)
            {
                tzNt = Core.Globals.GeneralOptions.TimeZoneInfo;
                var cfg = ChaumerNT.LeerConfig(null);
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
            if (problema != null || CurrentBar < 1) return;
            if (Bars.Count - 1 - CurrentBar > 1500) return;                  // solo lo reciente: el último día
            DateTime u = ChaumerNT.Utc(Bars, CurrentBar, tzNt);
            string d = u.ToString("yyyyMMdd", ChaumerNT.INV);
            int hm = u.Hour * 100 + u.Minute;
            if (hm < MotorChaumer.AperturaUtc(d)) return;                    // antes de la ventana: se queda la foto anterior
            try
            {
                if (d != dia) NuevoDia(d);
                for (int i = ultimaVela + 1; i <= CurrentBar; i++) velas.Add(ChaumerNT.Vela(Bars, i, tzNt));
                ultimaVela = CurrentBar;
                var r = motor.Decidir(velas, d, null);
                foto = Fotografiar(r);
                ForceRefresh();
            }
            catch (Exception e) { Print("[VistaMotorChaumer] " + e.Message); }
        }

        private void NuevoDia(string d)
        {
            dia = d;
            inicioDia = ChaumerNT.InicioDia(Bars, CurrentBar, d, tzNt);
            velas.Clear(); ultimaVela = inicioDia - 1;
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
            var D = r.D; var t = r.Trade; int b = r.B, off = inicioDia;
            int ult = D.Count - 1;
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
                    X0 = off + Math.Max(z.IOrg, b),
                    X1 = (z.Fin != null && z.Fin <= corteZ) ? off + z.Fin.Value : -1,
                    Lo = g[0], Hi = g[1], Vigente = vig,
                    Etiqueta = vig ? (z.Tipo == "R" ? "resistencia" : z.Tipo == "S" ? "soporte" : "zona") + "   "
                                     + g[0].ToString("N2", ES) + " – " + g[1].ToString("N2", ES) : null
                });
            }

            foreach (var v in r.Piv)
                if (v.I >= b && v.I <= corte) f.Zigzag.Add(new KeyValuePair<int, double>(off + v.I, v.Precio));

            // puntos de referencia (R-41): solo si se presentó un reingreso
            foreach (var re in r.Reingresos)
            {
                if (re.I > corteZ) continue;
                foreach (var v in r.Piv)
                {
                    int j = v.I; double pv = v.Precio;
                    if (j >= re.I) continue;
                    bool bajo = Math.Abs(pv - D[j].L) < 1e-9;
                    if ((re.Nd < 0) != bajo) continue;
                    bool fuera = re.Nd < 0 ? pv >= re.E : pv <= re.E;
                    if (fuera) continue;
                    // solo los que quedan ENTRE la entrada y el objetivo: los únicos que pueden descartar el reingreso (Kris, 07/10/2026)
                    if (re.Nd < 0 ? pv <= re.T : pv >= re.T) continue;
                    int roto = -1;
                    for (int m = j + 1; m <= corte; m++)
                        if (bajo ? D[m].C < pv : D[m].C > pv) { roto = m; break; }
                    if (roto >= 0 && roto <= re.I) continue;
                    f.Refs.Add(new RefDib { X0 = off + Math.Max(j, b), X1 = roto >= 0 ? off + roto + 1 : -1, Precio = pv, Vivo = roto < 0 });
                }
            }

            string cab = n + " zonas · " + vivas + " vigentes";
            if (sinNoticias)
            {
                f.Aviso = "sin noticias de Supabase: no se muestra la operación";
            }
            else if (t != null)
            {
                f.Op = new OpDib { X0 = off + t.I, X1 = off + t.IOut, E = t.E, S = t.S, T = t.T };
                string sig = (t.Pts ?? 0) >= 0 ? "+" : "";
                cab += " · " + t.Tipo + (t.Dir > 0 ? " alcista" : " bajista") + " a las " + t.Hora + " · entrada " + P2(t.E)
                     + " · stop " + P2(t.S) + " · objetivo " + P2(t.T)
                     + (t.Res == "ABIERTO" ? "   →   ABIERTA" : "   →   " + t.Res + " " + t.HOut + " · " + sig + P2(t.Pts.Value) + " pts");
                f.ColorCabecera = t.Res == "TARGET" ? 1 : t.Res == "STOP" ? 2 : 3;
            }
            else if (r.Orden != null)
            {
                var o = r.Orden;
                f.Op = new OpDib { X0 = off + o.I, X1 = -1, E = o.E, S = o.S, T = o.T, Pendiente = true };
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
                    float a = f.Op.Pendiente ? .07f : .13f;
                    Rect(rt, rojo, a, x0, x1, chartScale.GetYByValue(f.Op.E), chartScale.GetYByValue(f.Op.S));
                    Rect(rt, verde, a, x0, x1, chartScale.GetYByValue(f.Op.E), chartScale.GetYByValue(f.Op.T));
                }

                // zonas y sus etiquetas
                var etiquetas = new List<KeyValuePair<float, string>>();
                if (VerZonas)
                    foreach (var z in f.Zonas)
                    {
                        float x0 = X(chartControl, z.X0) - medio, x1 = z.X1 >= 0 ? X(chartControl, z.X1) : xDer;
                        float y0 = chartScale.GetYByValue(z.Hi), y1 = chartScale.GetYByValue(z.Lo);
                        var r = new SharpDX.RectangleF(x0, y0, Math.Max(1f, x1 - x0), Math.Max(1f, y1 - y0));
                        gris.Opacity = z.Vigente ? .28f : .10f; rt.FillRectangle(r, gris);
                        gris.Opacity = z.Vigente ? .9f : .45f; rt.DrawRectangle(r, gris, z.Vigente ? 1.5f : .7f);
                        if (z.Etiqueta != null) etiquetas.Add(new KeyValuePair<float, string>((y0 + y1) / 2f, z.Etiqueta));
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
                    foreach (var v in xy)
                    {
                        var el = new SharpDX.Direct2D1.Ellipse(v, 3.5f, 3.5f);
                        rt.FillEllipse(el, blanco); rt.DrawEllipse(el, fondo, 1.2f);
                    }
                }

                // etiquetas de las zonas vigentes, a la derecha y sin pisarse
                if (VerZonas && VerEtiquetas && etiquetas.Count > 0)
                {
                    etiquetas.Sort((a, c) => a.Key.CompareTo(c.Key));
                    float yPrev = float.MinValue;
                    foreach (var e in etiquetas)
                    {
                        float y = Math.Max(e.Key, yPrev + 16f); yPrev = y;
                        Texto(rt, letra, e.Value, xDer - 290, y - 8, gris, 1f, 280f, true);
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
        #endregion
    }
}
