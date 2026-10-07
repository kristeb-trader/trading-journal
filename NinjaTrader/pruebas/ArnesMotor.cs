// ═══════════════════════════════════════════════════════════════════════════
//  ArnesMotor — corre MotorChaumer fuera de NinjaTrader y escribe su salida canónica
//  Diseño: docs/disenos/2026-10-06-bot-chaumer.md §6.2 · D-038
//
//  No se instala en NinjaTrader. Lo compila y lo llama scripts/bot/sincronia.py, que escribe la
//  misma salida desde lector.py y compara las dos línea a línea:
//
//    ArnesMotor.exe param  <reglas.json>
//    ArnesMotor.exe huella <lector.py> <MotorChaumer.cs>
//    ArnesMotor.exe dia    <reglas.json> <velas.txt> <yyyyMMdd> <umbral> <fed 0|1> <noticias: min,min | ->
//    ArnesMotor.exe vivo   (los mismos argumentos que dia)
//
//  En C# 5, como MotorChaumer.cs. El formato de cada línea es el de canon_*() en sincronia.py.
// ═══════════════════════════════════════════════════════════════════════════

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using NinjaTrader.NinjaScript;
using NinjaTrader.NinjaScript.Indicators;

static class ArnesMotor
{
    static TextWriter w;

    static string Opt(int? x) { return x.HasValue ? x.Value.ToString(CultureInfo.InvariantCulture) : "-"; }
    static string OptF(double? x) { return x.HasValue ? MotorChaumer.F2(x.Value) : "-"; }
    static string B(bool x) { return x ? "1" : "0"; }

    static string CanonOrden(MotorChaumer.Orden o)
    {
        if (o == null) return "-";
        return string.Join("|", new[] { o.Tipo, o.Dir.ToString(CultureInfo.InvariantCulture), MotorChaumer.F2(o.E), MotorChaumer.F2(o.S),
                                        MotorChaumer.F2(o.T), MotorChaumer.F2(o.R), o.I.ToString(CultureInfo.InvariantCulture), Opt(o.Pausa), B(o.Cruzo) });
    }

    static string CanonTrade(MotorChaumer.Trade t)
    {
        if (t == null) return "-";
        return string.Join("|", new[] { t.Tipo, t.Dir.ToString(CultureInfo.InvariantCulture), MotorChaumer.F2(t.E), MotorChaumer.F2(t.S),
                                        MotorChaumer.F2(t.T), MotorChaumer.F2(t.R), t.I.ToString(CultureInfo.InvariantCulture),
                                        t.IFill.ToString(CultureInfo.InvariantCulture), t.Hora, t.Res, OptF(t.Pts),
                                        t.IOut.ToString(CultureInfo.InvariantCulture), t.HOut });
    }

    static void Dia(MotorChaumer m, List<MotorChaumer.Vela> V, string dia, bool fed)
    {
        var r = m.LeerSesion(V, dia, 30);
        if (r == null) { w.WriteLine("NONE"); return; }
        if (r.Error != null) { w.WriteLine("ERR " + r.Error); return; }
        m.DetectarSetups(r, fed);
        foreach (var l in r.Log) w.WriteLine("L " + l);
        foreach (var z in r.Z)
            w.WriteLine("Z " + string.Join("|", new[] {
                z.ToString(), B(z.Activa), Opt(z.Fin), B(z.Pm), B(z.DeCorrida), z.Dir.ToString(CultureInfo.InvariantCulture),
                OptF(z.Ref), Opt(z.RIni), Opt(z.RFin), Opt(z.IPapel),
                z.Roto == null ? "-" : z.Roto.Dir + "," + z.Roto.I + "," + MotorChaumer.F2(z.Roto.Ex),
                B(z.Consec), Opt(z.IConsec) }));
        foreach (var v in r.Piv) w.WriteLine("P " + v.I + " " + MotorChaumer.F2(v.Precio) + " " + (v.Confirma < 0 ? "-" : v.Confirma.ToString()));
        foreach (var x in r.Retros) w.WriteLine("R " + x.I + " " + MotorChaumer.F2(x.Ref));
        foreach (var x in r.Reingresos) w.WriteLine("RI " + x.I + " " + MotorChaumer.F2(x.E) + " " + MotorChaumer.F2(x.T) + " " + x.Nd);
        foreach (var e in r.Eventos) w.WriteLine("E " + e);
        w.WriteLine("T " + CanonTrade(r.Trade));
        w.WriteLine("O " + CanonOrden(r.Orden));
        // el zigzag propio de MarcacionChaumer (ZigzagChaumer, que sincronia.py extrae del indicador SIN tocarlo),
        // sobre las velas desde la base: tiene que dar el mismo piv que el motor
        int n = r.Fin - r.B + 1;
        double[] o = new double[n], h = new double[n], l2 = new double[n], c = new double[n];
        for (int k = 0; k < n; k++) { var x = r.D[r.B + k]; o[k] = x.O; h[k] = x.H; l2[k] = x.L; c[k] = x.C; }
        var zz = ZigzagChaumer.Calcular(o, h, l2, c, n);
        if (zz != null)
            foreach (var v in zz) w.WriteLine("ZZ " + v.I + " " + MotorChaumer.F2(v.Precio) + " " + (v.Confirma < 0 ? "-" : v.Confirma.ToString()));
    }

    static void Vivo(MotorChaumer m, List<MotorChaumer.Vela> V, string dia)
    {
        var D = V.Where(k => k.D == dia).ToList();
        var full = m.LeerSesion(D, dia, 30);
        if (full == null || full.Error != null) return;
        for (int i = full.B; i <= full.Fin; i++)
        {
            var r = m.Decidir(D, dia, i);
            string hora = MotorChaumer.Hh(D[i]);
            if (r == null || r.Error != null) { w.WriteLine("V " + hora + " -"); continue; }
            w.WriteLine("V " + hora + " O " + CanonOrden(r.Orden) + " T " + CanonTrade(r.Trade));
        }
    }

    static int Main(string[] a)
    {
        w = new StreamWriter(Console.OpenStandardOutput(), new UTF8Encoding(false));
        ((StreamWriter)w).NewLine = "\n";
        try
        {
            if (a[0] == "param")
            {
                var p = MotorChaumer.Parametros.Leer(a[1]);
                w.WriteLine(string.Format(CultureInfo.InvariantCulture, "TICK={0} STOP_MAX={1} RIESGO_MAX={2} PLAZO_CONSECUCION={3} UMBRAL_VOL={4} VENTANA_NOTICIA={5}",
                    p.Tick, p.StopMax, p.RiesgoMax, p.Plazo, p.UmbralVol, p.VentanaNoticia));
            }
            else if (a[0] == "huella")
            {
                w.WriteLine(MotorChaumer.SelloDe(File.ReadAllText(a[1], Encoding.UTF8), File.ReadAllText(a[2], Encoding.UTF8)));
            }
            else if (a[0] == "dia" || a[0] == "vivo")
            {
                var p = MotorChaumer.Parametros.Leer(a[1]);
                p.UmbralVol = long.Parse(a[4], CultureInfo.InvariantCulture);
                bool fed = a[5] == "1";
                var noticias = a[6] == "-" ? new List<int>() : a[6].Split(',').Select(x => int.Parse(x, CultureInfo.InvariantCulture)).ToList();
                var m = new MotorChaumer(p, noticias, fed);
                var V = MotorChaumer.Cargar(a[2]);
                if (a[0] == "dia") Dia(m, V, a[3], fed); else Vivo(m, V, a[3]);
            }
            else throw new ArgumentException("modo desconocido: " + a[0]);
        }
        catch (Exception ex)
        {
            w.WriteLine("EXCEPCION " + ex.GetType().Name + ": " + ex.Message);
            w.WriteLine(ex.StackTrace);
            w.Flush();
            return 2;
        }
        w.Flush();
        return 0;
    }
}
