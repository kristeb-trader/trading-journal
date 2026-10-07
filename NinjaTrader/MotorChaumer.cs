// ═══════════════════════════════════════════════════════════════════════════
//  MotorChaumer — el motor del plan de Chaumer, en C#
//  Diseño: docs/disenos/2026-10-06-bot-chaumer.md §6.1 · D-038
//
//  Traducción LITERAL de chaumer/05_Backtesting/claude/motor/lector.py, que es la referencia:
//  los mismos pasos en el mismo orden, los mismos nombres en lo posible y el MISMO TEXTO en cada
//  evento, para poder comparar los dos motores línea a línea. Si cambia lector.py, se cambia aquí
//  lo mismo y en el mismo commit; `python scripts/bot/sincronia.py --sellar` corre los dos motores
//  con el día entero y vela a vela en todos los días con datos y, con 0 diferencias, escribe el
//  SELLO. Con el sello viejo el hook de git rechaza el commit y el bot no opera.
//
//  Los números del plan NO viven aquí: se leen de chaumer/01_Plan/reglas.json (`parametros`), la
//  misma fuente que lee lector.py.
//
//  Sin dependencias de NinjaTrader y en C# 5 (sin ?., sin $"", sin =>-miembros), para que lo
//  compile el csc del sistema fuera de NinjaTrader. Lo usan BotChaumer (opera) y MarcacionChaumer
//  (dibuja el zigzag).
//
//  Instalar: copiar a Documentos\NinjaTrader 8\bin\Custom\AddOns\ y compilar (F5).
// ═══════════════════════════════════════════════════════════════════════════

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace NinjaTrader.NinjaScript
{
    public class MotorChaumer
    {
        // Huella de lector.py (L) y de este archivo sin esta línea (C) con la que pasó la sincronía.
        // La escribe SOLO `python scripts/bot/sincronia.py --sellar`, y solo con 0 diferencias.
        public const string SELLO = "L:8c98cbb36c090fb7 C:661e08ea1f6877dc";

        // ─────────────────────────────────────────────────────────── tipos
        public class Vela { public string D; public string T; public double O, H, L, C; public long V; }

        public class Parametros
        {
            public double Tick, StopMax, RiesgoMax;
            public int Plazo, VentanaNoticia;
            public long UmbralVol;

            /// <summary>Los números del plan, de la clave `parametros` de reglas.json. Si falta uno, falla:
            /// no se inventa. Es lo mismo que parametros_del_plan() de lector.py.</summary>
            public static Parametros Leer(string rutaReglasJson)
            {
                string txt = File.ReadAllText(rutaReglasJson, Encoding.UTF8);
                int ini = txt.IndexOf("\"parametros\"", StringComparison.Ordinal);
                if (ini < 0) throw new InvalidDataException("reglas.json sin `parametros`: node scripts/plan/leer-reglas.mjs --escribir");
                string bloque = txt.Substring(ini);
                var p = new Parametros();
                p.Tick           = Numero(bloque, "TICK");
                p.StopMax        = Numero(bloque, "STOP_MAX");
                p.RiesgoMax      = Numero(bloque, "RIESGO_MAX");
                p.Plazo          = (int)Numero(bloque, "PLAZO_CONSECUCION");
                p.UmbralVol      = (long)Numero(bloque, "UMBRAL_VOL");
                p.VentanaNoticia = (int)Numero(bloque, "VENTANA_NOTICIA");
                return p;
            }

            private static double Numero(string bloque, string nombre)
            {
                var m = Regex.Match(bloque, "\"" + nombre + "\"\\s*:\\s*\\{\\s*\"texto\"\\s*:\\s*\"(?:[^\"\\\\]|\\\\.)*\"\\s*,\\s*\"numero\"\\s*:\\s*(null|-?\\d+(?:\\.\\d+)?)");
                if (!m.Success || m.Groups[1].Value == "null")
                    throw new InvalidDataException(nombre + " no tiene número en reglas.json");
                return double.Parse(m.Groups[1].Value, CultureInfo.InvariantCulture);
            }
        }

        public class Pend { public string Dir; public int I; public double Ex; public bool Hecho; }
        public class Roto { public string Dir; public int I; public double Ex; }
        public class Hist { public int J; public double Lo, Hi; }

        public class Zona
        {
            public double Lo, Hi; public string Tipo;     // 'R', 'S' o 'P'
            public int I;                                  // vela en que se dibuja
            public string Origen;                          // etiqueta de la vela que la sostiene
            public int IOrg;                               // índice de esa vela
            public bool Arriba, Abajo;                     // traspasos CONFIRMADOS
            public Pend Pend;                              // rompimiento esperando consecución
            public int? Fin;                               // vela en que queda inactiva
            public Roto Roto;
            public bool Consec; public int? IConsec; public double? ConsecExt;
            public bool ReinOk;
            public double? Ref;                            // punto de referencia
            public bool DeCorrida, Pm;
            public int? IPapel;
            public Pend Pend2;                             // zona 'P': rompimiento del OTRO lado
            public int Dir;                                // +1 / -1
            public int? RIni, RFin;
            public List<Hist> Historia;

            public Zona(double lo, double hi, string tipo, int i, string origen, int? iOrg)
            {
                Lo = lo; Hi = hi; Tipo = tipo; I = i; Origen = origen; IOrg = iOrg.HasValue ? iOrg.Value : i;
                Historia = new List<Hist> { new Hist { J = i, Lo = lo, Hi = hi } };
            }
            public double[] En(int i)
            {
                Hist g = null;
                foreach (var h in Historia) if (h.J <= i) g = h;
                return g != null ? new[] { g.Lo, g.Hi } : new[] { Lo, Hi };
            }
            public bool Activa { get { return !(Arriba && Abajo); } }
            public bool Toca(double lo, double hi) { return !(hi < Lo || lo > Hi); }
            public override string ToString() { return Tipo + " " + F2(Lo) + "-" + F2(Hi) + " (vela " + Origen + ")"; }
        }

        public class Vertice { public int I; public double Precio; public int Confirma; }   // Confirma -1: sin confirmar

        public class Orden
        {
            public string Tipo; public int Dir; public double E, S, T, R; public int I;
            public int? Pausa; public bool Cruzo;
        }

        public class Trade : Orden
        {
            public int IFill; public string Hora; public string Res; public double? Pts; public int IOut; public string HOut;
        }

        public class Reingreso { public int I; public double E, T; public int Nd; }
        public class Retro { public int I; public double Ref; }

        public class Banda { public double A, B; public Zona Zb, Za; }

        public class Resultado
        {
            public string Error;
            public List<Vela> D; public List<Zona> Z; public bool Alc; public List<string> Log;
            public int B, Fin, FinV;
            public List<Retro> Retros; public List<Vertice> Piv;
            public List<Reingreso> Reingresos = new List<Reingreso>();
            public List<string> Eventos = new List<string>();
            public Trade Trade;
            public Orden Orden;      // la orden que sigue puesta (o aplazada) al acabar los datos
        }

        // ─────────────────────────────────────────────────────────── el motor
        public readonly Parametros P;
        private readonly List<int> noticias;     // minutos del día, hora Colombia, de las noticias rojas
        private readonly bool fed;

        public MotorChaumer(Parametros p, IEnumerable<int> noticiasDelDia, bool diaFed)
        {
            P = p; noticias = noticiasDelDia == null ? new List<int>() : noticiasDelDia.ToList(); fed = diaFed;
        }

        // Lo que el motor sabe al CIERRE de la vela `hasta` (índice en V; null = la última): el motor entero
        // sobre las velas cerradas hasta ahí, como lo corre el bot en vivo. Es decidir() de lector.py.
        public Resultado Decidir(List<Vela> V, string dia, int? hasta)
        {
            var corte = hasta.HasValue ? V.Take(hasta.Value + 1).ToList() : V;
            var r = LeerSesion(corte, dia, 1);
            if (r == null || r.Error != null) return r;
            DetectarSetups(r, fed);
            return r;
        }

        // ── utilidades ──
        public static string F2(double x) { return x.ToString("F2", CultureInfo.InvariantCulture); }
        public static string F3(double x) { return x.ToString("F3", CultureInfo.InvariantCulture); }
        public static int FloorDiv(int a, int b) { int q = a / b; if ((a % b != 0) && ((a < 0) != (b < 0))) q--; return q; }
        public static int FloorMod(int a, int b) { return a - FloorDiv(a, b) * b; }
        public static int Hm(Vela k) { return int.Parse(k.T.Substring(0, 4)); }          // HHMM en UTC
        public static int Col(Vela k) { return Hm(k) - 500; }                             // HHMM en hora Colombia
        public static string Hh(Vela k) { return FloorDiv(Col(k), 100) + ":" + k.T.Substring(2, 2); }
        private static int Minutos(Vela k) { int c = Col(k); return FloorDiv(c, 100) * 60 + FloorMod(c, 100); }
        private static string HhMm(int m) { return FloorDiv(m, 60) + ":" + FloorMod(m, 60).ToString("00"); }

        private int? Noticia(int t, int margenIni)
        {
            foreach (int T in noticias)
                if (T - margenIni <= t && t <= T + P.VentanaNoticia) return T;
            return null;
        }

        private static DateTime Domingo(int y, int m, int n)
        {
            var d = new DateTime(y, m, 1);
            d = d.AddDays((7 - (int)d.DayOfWeek) % 7);          // primer domingo del mes
            return d.AddDays(7 * (n - 1));
        }

        /// <summary>HHMM UTC de la vela base de la jornada `dia` (yyyyMMdd): 1331 en verano de EE. UU., 1431 en invierno.</summary>
        public static int AperturaUtc(string dia)
        {
            var f = new DateTime(int.Parse(dia.Substring(0, 4)), int.Parse(dia.Substring(4, 2)), int.Parse(dia.Substring(6, 2)));
            bool verano = Domingo(f.Year, 3, 2) <= f && f < Domingo(f.Year, 11, 1);
            return verano ? 1331 : 1431;
        }
        public static int CierreUtc(string dia) { return AperturaUtc(dia) + 199; }

        private static double[] ZRes(Vela k) { return new[] { Math.Max(k.O, k.C), k.H }; }
        private static double[] ZSop(Vela k) { return new[] { k.L, Math.Min(k.O, k.C) }; }

        public static List<Vela> Cargar(string path)
        {
            var V = new List<Vela>();
            foreach (var ln in File.ReadAllLines(path, Encoding.UTF8))
            {
                var p = ln.Trim().Split(';');
                if (p.Length < 6) continue;
                var dt = p[0].Split(' ');
                V.Add(new Vela
                {
                    D = dt[0], T = dt[1],
                    O = double.Parse(p[1], CultureInfo.InvariantCulture), H = double.Parse(p[2], CultureInfo.InvariantCulture),
                    L = double.Parse(p[3], CultureInfo.InvariantCulture), C = double.Parse(p[4], CultureInfo.InvariantCulture),
                    V = long.Parse(p[5], CultureInfo.InvariantCulture)
                });
            }
            return V;
        }

        // ─────────────────────────────────────────────────────────── premercado
        private List<Zona> ZonasPremercado(List<Vela> V)
        {
            var Z = new List<Zona>();
            int ini = V.Count > 0 ? AperturaUtc(V[0].D) : 1331;
            double? ap = null;
            foreach (var k in V) if (Hm(k) >= ini) { ap = k.O; break; }
            for (int i = 0; i < V.Count; i++)
            {
                var k = V[i];
                if (Hm(k) >= ini) break;
                if (k.V <= P.UmbralVol) continue;
                var lh = k.C >= k.O ? ZRes(k) : ZSop(k);
                double lo = lh[0], hi = lh[1];
                string tipo;
                if (ap == null) tipo = k.C >= k.O ? "R" : "S";
                else tipo = hi < ap.Value ? "S" : (lo > ap.Value ? "R" : "P");
                var z = new Zona(lo, hi, tipo, i, FloorDiv(Col(k), 100) + ":" + k.T.Substring(2, 2) + " pm", null);
                z.Pm = true;
                Z.Add(z);
            }
            return Z;
        }

        // ─────────────────────────────────────────────────── filtro zonas entre zonas
        private static bool Bloqueada(List<Zona> Z, double lo, double hi, double extremo, string tipo, out double? mid, out Banda banda)
        {
            mid = null; banda = null;
            var act = Z.Where(z => z.Activa).ToList();
            var arr = act.Where(z => z.Lo > hi).ToList();
            var aba = act.Where(z => z.Hi < lo).ToList();
            if (arr.Count == 0 || aba.Count == 0) return false;
            Zona za = arr[0]; foreach (var z in arr) if (z.Lo < za.Lo) za = z;      // zona de arriba
            Zona zb = aba[0]; foreach (var z in aba) if (z.Hi > zb.Hi) zb = z;      // zona de abajo
            banda = new Banda { A = zb.Hi, B = za.Lo, Zb = zb, Za = za };
            double m = (zb.Hi + za.Lo) / 2.0; mid = m;
            return tipo == "R" ? extremo > m : extremo < m;
        }

        private static bool EnBandaUsada(List<Banda> rangos, double lo, double hi)
        {
            if (rangos.Count == 0) return false;
            foreach (var r in rangos)
                if (hi > r.A + 1e-9 && lo < r.B - 1e-9) return true;
            return false;
        }

        private static bool BandaOcupada(List<Zona> Z, double lo, double hi)
        {
            var arr = Z.Where(z => z.Lo > hi + 1e-9).ToList();
            var aba = Z.Where(z => z.Hi < lo - 1e-9).ToList();
            if (arr.Count == 0 || aba.Count == 0) return false;
            Zona za = arr[0]; foreach (var z in arr) if (z.Lo < za.Lo) za = z;
            Zona zb = aba[0]; foreach (var z in aba) if (z.Hi > zb.Hi) zb = z;
            return Z.Any(z => z.Hi > zb.Hi + 1e-9 && z.Lo < za.Lo - 1e-9);
        }

        private static Zona Anadir(List<Zona> Z, double lo, double hi, string tipo, int i, string origen, double extremo,
                                   int? iOrg, List<Banda> rangos, out string que, out double? mid)
        {
            Banda banda;
            bool blo = Bloqueada(Z, lo, hi, extremo, tipo, out mid, out banda);
            if (rangos != null)
            {
                foreach (var r in rangos)
                {
                    if (hi > r.A + 1e-9 && lo < r.B - 1e-9) { que = "rango_usado"; return null; }
                    if (hi <= r.A + 1e-9 && !r.Zb.Abajo) { que = "salida_sin_consecucion"; return null; }
                    if (lo >= r.B - 1e-9 && !r.Za.Arriba) { que = "salida_sin_consecucion"; return null; }
                }
                if (banda != null) rangos.Add(banda);
                if (BandaOcupada(Z, lo, hi)) { que = "banda_gastada"; return null; }
            }
            foreach (var z in Z)
            {
                if (z.Fin != null || z.Pend == null || z.I > i) continue;
                if (z.Pend.Dir == "abajo" && extremo < z.Lo - 1e-9) { que = "sin_consecucion"; mid = null; return null; }
                if (z.Pend.Dir == "arriba" && extremo > z.Hi + 1e-9) { que = "sin_consecucion"; mid = null; return null; }
            }
            if (blo) { que = "bloqueada50"; return null; }
            foreach (var z in Z)
                if (z.Activa && z.Tipo != tipo && z.Toca(lo, hi)) { que = "solapa"; mid = null; return null; }
            foreach (var z in Z)
                if (z.Activa && z.Tipo == tipo && z.Toca(lo, hi))
                {
                    if (tipo == "R") z.Hi = Math.Max(z.Hi, hi);
                    else z.Lo = Math.Min(z.Lo, lo);
                    z.Historia.Add(new Hist { J = i, Lo = z.Lo, Hi = z.Hi });
                    que = "estirada"; mid = null; return z;
                }
            var nz = new Zona(lo, hi, tipo, i, origen, iOrg); Z.Add(nz);
            que = "nueva"; mid = null; return nz;
        }

        // ─────────────────────────────────────────────────────────── recorrido
        public Resultado LeerSesion(List<Vela> V, string dia, int minimo)
        {
            var D = V.Where(k => k.D == dia).ToList();
            if (D.Count == 0) return null;
            var Z = ZonasPremercado(D);
            int ini0 = AperturaUtc(dia), finV = CierreUtc(dia);
            var S = new List<int>();
            for (int i = 0; i < D.Count; i++) if (ini0 <= Hm(D[i]) && Hm(D[i]) <= finV) S.Add(i);
            if (S.Count < minimo) return null;
            int b = S[0];
            var bse = D[b];
            bool alc = bse.C > bse.O;
            int? decide = null;
            if (bse.C == bse.O)
            {
                foreach (int j in S.Skip(1))
                {
                    var kj = D[j]; bool up = kj.H > bse.H, dn = kj.L < bse.L;
                    if (!(up || dn)) continue;
                    if (up && dn)
                    {
                        if (kj.C == kj.O)
                            return new Resultado { Error = "vela base sin cuerpo y la que la supera por los dos lados tampoco tiene cuerpo" };
                        alc = kj.C < kj.O;
                    }
                    else alc = up;
                    decide = j; break;
                }
                if (decide == null)
                    return new Resultado { Error = "vela base sin cuerpo y ninguna vela de la ventana sale de su rango" };
            }

            Zona zPend = null;
            var rangos = new List<Banda>();
            var log = new List<string>();
            log.Add(FloorDiv(Col(bse), 100).ToString("00") + ":" + bse.T.Substring(2, 2) + " vela base " + (alc ? "ALCISTA" : "BAJISTA")
                    + " (abre " + F2(bse.O) + " cierra " + F2(bse.C) + ")"
                    + (decide != null ? " · sin cuerpo: decide la de " + FloorDiv(Col(D[decide.Value]), 100) + ":" + D[decide.Value].T.Substring(2, 2) : ""));

            string estado = "corrida";
            int ext = b;
            int rExt = -1;
            var retros = new List<Retro>();
            var piv = new List<Vertice> { new Vertice { I = b, Precio = alc ? D[b].L : D[b].H, Confirma = b } };

            int fin = S[S.Count - 1];
            for (int i = b; i <= fin; i++)
            {
                var k = D[i];
                // vigencia, en cada vela. Por índice: una zona apéndice que nace aquí se recorre en esta misma vela (como en Python)
                for (int zi = 0; zi < Z.Count; zi++)
                {
                    var z = Z[zi];
                    if (z.Fin != null || z.I > i) continue;
                    bool resuelto = false;
                    if (z.Pend != null)
                    {
                        string d = z.Pend.Dir; int ir = z.Pend.I; double ex = z.Pend.Ex; bool hecho = z.Pend.Hecho;
                        if (d == "arriba" ? k.H > ex : k.L < ex)
                        {
                            if (d == "arriba") z.Arriba = true; else z.Abajo = true;
                            z.Pend = null; resuelto = true;
                            if (z.Tipo == "P")
                            {
                                z.Tipo = d == "arriba" ? "S" : "R";
                                z.Arriba = false; z.Abajo = false; z.IPapel = i;
                                log.Add(Hh(k) + " la zona de premercado " + F2(z.Lo) + "-" + F2(z.Hi) + " sale " + d + ": queda como "
                                        + (z.Tipo == "S" ? "soporte" : "resistencia"));
                            }
                        }
                        else if (!hecho && i - ir >= P.Plazo)
                        {
                            var kr = D[ir];
                            bool estiraOk = (z.Tipo == "R" && d == "arriba") || (z.Tipo == "S" && d == "abajo");
                            if (d == "abajo")
                            {
                                bool cuerpo = kr.C < z.Lo;
                                double a = kr.L, bb = Math.Min(kr.O, kr.C);
                                if (cuerpo && !EnBandaUsada(rangos, a, bb) && !Ya(Z, "S", a, bb))
                                {
                                    var ap = new Zona(a, bb, "S", i, FloorDiv(Col(kr), 100) + ":" + kr.T.Substring(2, 2) + " ap", ir);
                                    Z.Add(ap);
                                    log.Add(Hh(k) + " plazo vencido → ZONA APÉNDICE S " + F2(ap.Lo) + "-" + F2(ap.Hi) + " sobre " + Hh(kr));
                                }
                                else if (!cuerpo && estiraOk)
                                {
                                    z.Lo = Math.Min(z.Lo, kr.L); z.Historia.Add(new Hist { J = i, Lo = z.Lo, Hi = z.Hi });
                                    log.Add(Hh(k) + " plazo vencido → se ESTIRA la zona a " + F2(z.Lo) + "-" + F2(z.Hi));
                                }
                            }
                            else
                            {
                                bool cuerpo = kr.C > z.Hi;
                                double a = Math.Max(kr.O, kr.C), bb = kr.H;
                                if (cuerpo && !EnBandaUsada(rangos, a, bb) && !Ya(Z, "R", a, bb))
                                {
                                    var ap = new Zona(a, bb, "R", i, FloorDiv(Col(kr), 100) + ":" + kr.T.Substring(2, 2) + " ap", ir);
                                    Z.Add(ap);
                                    log.Add(Hh(k) + " plazo vencido → ZONA APÉNDICE R " + F2(ap.Lo) + "-" + F2(ap.Hi) + " sobre " + Hh(kr));
                                }
                                else if (!cuerpo && estiraOk)
                                {
                                    z.Hi = Math.Max(z.Hi, kr.H); z.Historia.Add(new Hist { J = i, Lo = z.Lo, Hi = z.Hi });
                                    log.Add(Hh(k) + " plazo vencido → se ESTIRA la zona a " + F2(z.Lo) + "-" + F2(z.Hi));
                                }
                            }
                            z.Pend = new Pend { Dir = d, I = ir, Ex = ex, Hecho = true };
                        }
                    }
                    if (z.Tipo == "P" && z.Pend != null && !resuelto)
                    {
                        var p2 = z.Pend2;
                        if (p2 != null && p2.I < i && (p2.Dir == "arriba" ? k.H > p2.Ex : k.L < p2.Ex))
                        {
                            z.Tipo = p2.Dir == "arriba" ? "S" : "R";
                            z.Arriba = false; z.Abajo = false; z.IPapel = i; z.Pend2 = null;
                            log.Add(Hh(k) + " la zona de premercado " + F2(z.Lo) + "-" + F2(z.Hi) + " sale " + p2.Dir + ": queda como "
                                    + (z.Tipo == "S" ? "soporte" : "resistencia"));
                        }
                        else if (p2 == null)
                        {
                            if (z.Pend.Dir == "arriba" && k.L < z.Lo) z.Pend2 = new Pend { Dir = "abajo", I = i, Ex = k.L };
                            else if (z.Pend.Dir == "abajo" && k.H > z.Hi) z.Pend2 = new Pend { Dir = "arriba", I = i, Ex = k.H };
                        }
                    }
                    if (z.Pend == null && !resuelto)
                    {
                        if (z.Tipo == "P")
                        {
                            if (k.H > z.Hi) z.Pend = new Pend { Dir = "arriba", I = i, Ex = k.H };
                            else if (k.L < z.Lo) z.Pend = new Pend { Dir = "abajo", I = i, Ex = k.L };
                        }
                        else if (z.Tipo == "R")
                        {
                            if (!z.Arriba && k.H > z.Hi) z.Pend = new Pend { Dir = "arriba", I = i, Ex = k.H };
                            else if (z.Arriba && !z.Abajo && k.L < z.Lo) z.Pend = new Pend { Dir = "abajo", I = i, Ex = k.L };
                        }
                        else
                        {
                            if (!z.Abajo && k.L < z.Lo) z.Pend = new Pend { Dir = "abajo", I = i, Ex = k.L };
                            else if (z.Abajo && !z.Arriba && k.H > z.Hi) z.Pend = new Pend { Dir = "arriba", I = i, Ex = k.H };
                        }
                    }
                    if (z.Arriba && z.Abajo) z.Fin = i;
                }
                if (i == b) continue;                              // la vela base solo cuenta para la vigencia
                var p = D[i - 1];
                if (estado == "corrida")
                {
                    bool muere = alc ? k.L < p.L : k.H > p.H;
                    bool nuevoExt = alc ? k.H > D[ext].H : k.L < D[ext].L;
                    if (nuevoExt && !muere) ext = i;
                    else if (nuevoExt && muere)
                    {
                        bool extremoPrimero = alc ? k.C < k.O : k.C >= k.O;
                        if (extremoPrimero) ext = i;
                    }
                    if (!muere) continue;
                    if (zPend != null)
                    {
                        zPend.Ref = alc ? D[ext].H : D[ext].L;
                        zPend.RFin = Math.Max(ext, i - 1);
                        zPend = null;
                    }
                    var kx = D[ext];
                    double[] lh; string tipo; double extremo;
                    if (alc) { lh = ZRes(kx); tipo = "R"; extremo = kx.H; }
                    else     { lh = ZSop(kx); tipo = "S"; extremo = kx.L; }
                    string que; double? mid;
                    var z = Anadir(Z, lh[0], lh[1], tipo, i, Hh(kx), extremo, ext, rangos, out que, out mid);
                    log.Add(Hh(k) + " muere corrida → zona " + tipo + " " + F2(lh[0]) + "-" + F2(lh[1]) + " sobre " + Hh(kx) + " [" + que
                            + (mid.HasValue ? " mitad " + F3(mid.Value) : "") + "]");
                    if (z != null && que == "nueva" && z.Tipo == tipo)
                    {
                        z.DeCorrida = true; z.Dir = alc ? 1 : -1;
                        z.RIni = i; z.RFin = null;
                    }
                    else z = null;
                    zPend = z;
                    piv.Add(new Vertice { I = ext, Precio = alc ? D[ext].H : D[ext].L, Confirma = i });
                    estado = "retro"; rExt = i;
                }
                else
                {
                    bool confirma = alc ? k.H > p.H : k.L < p.L;
                    bool hunde = alc ? k.L < D[rExt].L : k.H > D[rExt].H;
                    if (hunde && !confirma) rExt = i;
                    else if (hunde && confirma)
                    {
                        bool extremoPrimero = alc ? k.C >= k.O : k.C < k.O;
                        if (extremoPrimero) rExt = i;
                    }
                    if (!confirma) continue;
                    var kx = D[rExt];
                    double[] lh; string tipo; double extremo;
                    if (alc) { lh = ZSop(kx); tipo = "S"; extremo = kx.L; }
                    else     { lh = ZRes(kx); tipo = "R"; extremo = kx.H; }
                    string que; double? mid;
                    var z = Anadir(Z, lh[0], lh[1], tipo, i, Hh(kx), extremo, rExt, rangos, out que, out mid);
                    log.Add(Hh(k) + " confirma retroceso → zona " + tipo + " " + F2(lh[0]) + "-" + F2(lh[1]) + " sobre " + Hh(kx) + " [" + que
                            + (mid.HasValue ? " mitad " + F3(mid.Value) : "") + "]");
                    double refActual = alc ? kx.L : kx.H;
                    retros.Add(new Retro { I = i, Ref = refActual });
                    if (zPend != null) { zPend.Ref = refActual; zPend.RFin = Math.Max(rExt, i - 1); zPend = null; }
                    if (z != null && que == "nueva" && z.Tipo == tipo)
                    {
                        z.DeCorrida = true; z.Dir = alc ? -1 : 1;
                        z.RIni = i; z.RFin = null;
                        zPend = z;
                    }
                    piv.Add(new Vertice { I = rExt, Precio = alc ? D[rExt].L : D[rExt].H, Confirma = i });
                    estado = "corrida"; ext = i;
                }
            }

            if (estado == "corrida") piv.Add(new Vertice { I = ext, Precio = alc ? D[ext].H : D[ext].L, Confirma = -1 });
            else piv.Add(new Vertice { I = rExt, Precio = alc ? D[rExt].L : D[rExt].H, Confirma = -1 });
            return new Resultado { D = D, Z = Z, Alc = alc, Log = log, B = b, Fin = fin, Retros = retros, Piv = piv, FinV = finV };
        }

        private static bool Ya(List<Zona> Z, string t, double a, double b)
        {
            return Z.Any(zz => zz.Fin == null && zz.Tipo == t && Math.Abs(zz.Lo - a) < 1e-9 && Math.Abs(zz.Hi - b) < 1e-9);
        }

        // ─────────────────────────────────────────────────────────── setups
        private static Zona Libre(List<Zona> Z, int i, double a, double b)
        {
            double lo = Math.Min(a, b), hi = Math.Max(a, b);
            foreach (var z in Z)
            {
                if (z.I > i) continue;
                if (z.Fin != null && z.Fin <= i) continue;
                var e = z.En(i);
                if (e[1] > lo && e[0] < hi) return z;
            }
            return null;
        }

        /// <summary>_evaluar de lector.py. Devuelve la orden o null; motivo, objetivo (null si la estructura
        /// es inválida antes de medirlo) y riesgo.</summary>
        private Orden Evaluar(List<Zona> Z, int i, string tipo, int nd, double e, double st, out string motivo, out double? t, out double r)
        {
            if (nd > 0 ? st >= e : st <= e)
            {
                motivo = "stop al lado equivocado de la entrada (estructura inválida)"; t = null; r = 0.0; return null;
            }
            r = Math.Abs(e - st); t = e + r * nd;
            if (r < P.Tick * 2) { motivo = "riesgo de " + F2(r) + " pts — estructura inválida"; return null; }
            var zb = Libre(Z, i, e, t.Value);
            var m = new List<string>();
            if (r > P.StopMax) m.Add("riesgo " + F2(r) + " pts (el máximo son 80)");
            if (zb != null) m.Add("el objetivo choca con " + zb);
            if (m.Count > 0) { motivo = string.Join(" · ", m); return null; }
            motivo = null;
            return new Orden { Tipo = tipo, Dir = nd, E = e, S = st, T = t.Value, R = r, I = i };
        }

        /// <summary>R-41: el punto de referencia vivo que estorba el objetivo de un reingreso, o null.</summary>
        private static double? PuntoDeReferencia(Resultado res, int i, double e, double t, int nd)
        {
            var D = res.D; double? mejor = null;
            foreach (var v in res.Piv)
            {
                int j = v.I; double p = v.Precio;
                if (j >= i) continue;
                if (nd < 0)
                {
                    if (Math.Abs(p - D[j].L) > 1e-9) continue;
                    if (!(t < p && p < e)) continue;
                    bool roto = false; for (int m = j + 1; m <= i; m++) if (D[m].C < p) { roto = true; break; }
                    if (roto) continue;
                    mejor = mejor == null ? p : Math.Max(mejor.Value, p);
                }
                else
                {
                    if (Math.Abs(p - D[j].H) > 1e-9) continue;
                    if (!(e < p && p < t)) continue;
                    bool roto = false; for (int m = j + 1; m <= i; m++) if (D[m].C > p) { roto = true; break; }
                    if (roto) continue;
                    mejor = mejor == null ? p : Math.Min(mejor.Value, p);
                }
            }
            return mejor;
        }

        /// <summary>R-40 · Corrida fluida: la clase Fluidez de lector.py.</summary>
        private class Fluidez
        {
            private class Estado { public string Que; public double? Barrera; }
            private class Rota { public int I; public double Ext; public int Consec; }   // Consec: 0 False · 1 True · -1 None

            private readonly MotorChaumer m;
            private readonly List<Vela> D; private readonly List<Zona> Z; private readonly List<Vertice> piv;
            private Dictionary<int, Estado> estado;
            private readonly Dictionary<Zona, string> veto = new Dictionary<Zona, string>();
            private readonly Dictionary<Zona, Rota> rota = new Dictionary<Zona, Rota>();
            private Dictionary<int, double?> iri = new Dictionary<int, double?> { { 1, null }, { -1, null } };
            private readonly Dictionary<Zona, int> info = new Dictionary<Zona, int>();
            private Apertura apertura;
            private class Apertura { public int D; public double Ini, Ext; }

            private int? Pconf(int n) { var c = piv[n].Confirma; return c < 0 ? (int?)null : c; }

            public Fluidez(MotorChaumer motor, Resultado res)
            {
                m = motor; D = res.D; Z = res.Z; piv = res.Piv;
                int d0 = res.Alc ? 1 : -1;
                estado = new Dictionary<int, Estado> { { d0, new Estado { Que = "libre" } }, { -d0, new Estado { Que = "espera" } } };
                foreach (var z in Z)
                {
                    if (!z.DeCorrida) continue;
                    for (int n = 1; n < piv.Count; n++)
                    {
                        int j = piv[n].I; double p = piv[n].Precio;
                        bool sube = p > piv[n - 1].Precio;
                        if (j == z.IOrg && (sube ? 1 : -1) == z.Dir) { info[z] = n; break; }
                    }
                }
                apertura = null;
                if (piv.Count > 1 && !info.Values.Contains(1))
                    apertura = new Apertura { D = d0, Ini = piv[0].Precio, Ext = piv[1].Precio };
            }

            private static double Lejano(Zona z, int i) { var e = z.En(i); return z.Dir > 0 ? e[1] : e[0]; }

            private void Segundo(int d, double barrera)
            {
                var e = estado[d];
                if (e.Que == "segundo" && e.Barrera != null)
                    barrera = d > 0 ? Math.Max(e.Barrera.Value, barrera) : Math.Min(e.Barrera.Value, barrera);
                estado[d] = new Estado { Que = "segundo", Barrera = barrera };
            }

            private static string Sentido(int d) { return d == 1 ? "alcista" : "bajista"; }

            /// <summary>Pone al día el estado con la vela i. Va ANTES de mirar rompimientos en esa vela.</summary>
            public void Vela_(int i, List<string> ev)
            {
                var k = D[i];
                var ap = apertura;
                if (ap != null)
                {
                    int? fin = piv.Count > 2 ? Pconf(2) : null;
                    if (fin != null && i > fin) apertura = null;
                    else if (ap.D > 0 ? k.L < ap.Ini : k.H > ap.Ini)
                    {
                        var dentro = Z.Where(z => z.I <= i && z.En(i)[0] - 1e-9 <= ap.Ext && ap.Ext <= z.En(i)[1] + 1e-9).ToList();
                        double barrera;
                        if (ap.D > 0) barrera = dentro.Select(z => z.En(i)[1]).Concat(new[] { ap.Ext }).Max();
                        else          barrera = dentro.Select(z => z.En(i)[0]).Concat(new[] { ap.Ext }).Min();
                        Segundo(ap.D, barrera); apertura = null;
                        ev.Add(Hh(k) + "  se pierde la fluidez " + Sentido(ap.D) + ": el retroceso se pasa de la corrida "
                               + "de la apertura; se espera un IRI entero más allá de " + F2(barrera) + " (R-40)");
                    }
                }
                foreach (var z in Z)
                {
                    int n;
                    if (!info.TryGetValue(z, out n) || z.I > i || (z.Fin != null && z.Fin < i)) continue;
                    int d = z.Dir; var lohi = z.En(i); double lo = lohi[0], hi = lohi[1];
                    Rota r; rota.TryGetValue(z, out r);
                    // A · el retroceso se pasa
                    if (!veto.ContainsKey(z) && r == null)
                    {
                        double ini = piv[n - 1].Precio;
                        if (d > 0 ? k.L < ini : k.H > ini)
                        {
                            veto[z] = "el retroceso se pasó de su corrida";
                            Segundo(d, Lejano(z, i));
                            ev.Add(Hh(k) + "  se pierde la fluidez " + Sentido(d) + ": el retroceso se pasa de la corrida de " + z + " (R-40)");
                            continue;
                        }
                    }
                    // rompimiento en su sentido (la mecha basta) y su consecución
                    if (r == null)
                    {
                        if (d > 0 ? k.H > hi + m.P.Tick / 2 : k.L < lo - m.P.Tick / 2)
                        {
                            rota[z] = new Rota { I = i, Ext = d > 0 ? k.H : k.L, Consec = 0 };
                            if (estado[d].Que == "espera")
                            {
                                if (!veto.ContainsKey(z))
                                    veto[z] = "es el primer IRI en este sentido tras un movimiento contrario: se espera un segundo IRI";
                                Segundo(d, Lejano(z, i));
                            }
                        }
                        else if (n + 2 < piv.Count && Pconf(n + 2) == i)
                        {
                            // B · la corrida siguiente termina sin romperla
                            if (!veto.ContainsKey(z))
                            {
                                veto[z] = "la corrida siguiente no la rompió";
                                Segundo(d, Lejano(z, i));
                                ev.Add(Hh(k) + "  se pierde la fluidez " + Sentido(d) + ": la corrida siguiente no rompe " + z + " (R-40)");
                            }
                        }
                        continue;
                    }
                    if (r.Consec != 0 || r.I >= i) continue;
                    if (d > 0 ? k.H > r.Ext : k.L < r.Ext)
                    {
                        r.Consec = 1;
                        string v;
                        if (!veto.TryGetValue(z, out v) || v.StartsWith("es el primer IRI", StringComparison.Ordinal))
                        {
                            iri[d] = piv[n - 1].Precio;
                            if (estado[-d].Que == "libre") estado[-d] = new Estado { Que = "espera" };
                        }
                    }
                    else if (i - r.I >= m.P.Plazo)
                    {
                        // B · la rompió sin consecución
                        r.Consec = -1;
                        veto[z] = "la rompió sin consecución y se devolvió";
                        Segundo(d, Lejano(z, i));
                        ev.Add(Hh(k) + "  se pierde la fluidez " + Sentido(d) + ": " + z + " rota sin consecución (R-40)");
                    }
                }
                // D · mercado mixto
                foreach (int d in new[] { 1, -1 })
                {
                    double? ini = iri[d];
                    if (ini == null || !(d > 0 ? k.L < ini.Value : k.H > ini.Value)) continue;
                    var vistas = Z.Where(z => z.I <= i).ToList();
                    if (vistas.Count == 0) continue;
                    iri = new Dictionary<int, double?> { { 1, null }, { -1, null } };
                    double arriba = vistas.Max(z => z.En(i)[1]), abajo = vistas.Min(z => z.En(i)[0]);
                    estado = new Dictionary<int, Estado> { { 1, new Estado { Que = "segundo", Barrera = arriba } },
                                                           { -1, new Estado { Que = "segundo", Barrera = abajo } } };
                    ev.Add(Hh(k) + "  mercado mixto: pasa del inicio del IRI " + Sentido(d) + " (" + F2(ini.Value) + "); "
                           + "se espera un IRI por fuera de " + F2(abajo) + " – " + F2(arriba) + " (R-40)");
                    break;
                }
            }

            /// <summary>null si el rompimiento de z en su sentido se opera; si no, el motivo.</summary>
            public string Permiso(Zona z, int i)
            {
                if (!info.ContainsKey(z)) return "la zona no sale de una corrida del zigzag";
                string v; if (veto.TryGetValue(z, out v)) return v;
                int d = z.Dir; var e = estado[d];
                if (e.Que == "segundo" && e.Barrera != null)
                {
                    var lohi = z.En(i);
                    if (!(d > 0 ? lohi[0] > e.Barrera.Value : lohi[1] < e.Barrera.Value))
                        return "rompimiento directo: la zona no queda entera más allá de " + F2(e.Barrera.Value);
                }
                estado[d] = new Estado { Que = "libre" };
                return null;
            }
        }

        private Orden Colocar(Orden o, string tag, List<string> ev, Vela k)
        {
            int? T = Noticia(Minutos(k), P.VentanaNoticia);
            if (T == null) ev.Add(tag + "  ✓ orden enviada");
            else
            {
                o.Pausa = T;
                ev.Add(tag + "  ✓ setup válido · la orden se aplaza: ventana de la noticia roja de las " + HhMm(T.Value) + " (R-35)");
            }
            return o;
        }

        public void DetectarSetups(Resultado res, bool soloReingresos)
        {
            var D = res.D; var Z = res.Z; int b = res.B, fin = res.Fin;
            var ev = res.Eventos; Orden orden = null; Trade trade = null;
            res.Reingresos = new List<Reingreso>();
            var flu = new Fluidez(this, res);

            for (int i = b; i <= fin; i++)
            {
                var k = D[i];

                // ---------- consecución de rompimientos previos ----------
                foreach (var z in Z)
                {
                    if (z.Roto != null && !z.Consec && z.Roto.I < i && i - z.Roto.I <= P.Plazo)
                    {
                        if ((z.Roto.Dir == "arriba" && k.H > z.Roto.Ex) || (z.Roto.Dir == "abajo" && k.L < z.Roto.Ex))
                        {
                            z.Consec = true; z.IConsec = i; z.ReinOk = true;
                            z.ConsecExt = z.Roto.Dir == "arriba" ? k.H : k.L;
                        }
                    }
                    else if (z.Consec && z.ReinOk && z.IConsec != null && i > z.IConsec)
                    {
                        if ((z.Roto.Dir == "arriba" && k.H > z.ConsecExt) || (z.Roto.Dir == "abajo" && k.L < z.ConsecExt))
                            z.ReinOk = false;
                    }
                }

                // ---------- rompimiento de las zonas de premercado (R-15) ----------
                foreach (var z in Z)
                {
                    if (!z.Pm || z.Roto != null || (z.Fin != null && z.Fin < i)) continue;
                    if (z.Tipo == "P" || (z.IPapel != null && i <= z.IPapel)) continue;
                    var lohi = z.En(i); double zlo = lohi[0], zhi = lohi[1];
                    if (z.Tipo == "R" && k.L <= zhi && k.H > zhi + P.Tick / 2) z.Roto = new Roto { Dir = "arriba", I = i, Ex = k.H };
                    else if (z.Tipo == "S" && k.H >= zlo && k.L < zlo - P.Tick / 2) z.Roto = new Roto { Dir = "abajo", I = i, Ex = k.L };
                    else continue;
                    ev.Add(Hh(k) + "  rompimiento de " + z + " — zona de premercado: sin Continuación, queda para el Reingreso");
                }
                if (i == b) continue;
                flu.Vela_(i, ev);

                // ---------- llenado / caducidad ----------
                int? tVela = (orden != null && trade == null) ? Noticia(Minutos(k), 4) : null;
                if (orden != null && trade == null && orden.Pausa != null && tVela == null)
                {
                    var o = orden; string motivo = null;
                    if (o.Cruzo) motivo = "el precio pasó de la entrada (" + F2(o.E) + ") mientras estaba retirada";
                    else
                    {
                        string m2; double? t2; double r2;
                        var o2 = Evaluar(Z, i, o.Tipo, o.Dir, o.E, o.S, out m2, out t2, out r2);
                        if (o2 == null) motivo = m2;
                        else if (o.Tipo == "Reingreso")
                        {
                            var pr = PuntoDeReferencia(res, i, o.E, t2.Value, o.Dir);
                            if (pr != null) motivo = "el objetivo pasa del punto de referencia " + F2(pr.Value);
                        }
                    }
                    int T0 = o.Pausa.Value; o.Pausa = null;
                    if (!string.IsNullOrEmpty(motivo))
                    {
                        ev.Add(Hh(k) + "  orden no se recoloca tras la noticia de las " + HhMm(T0) + " — " + motivo); orden = null;
                    }
                    else ev.Add(Hh(k) + "  orden recolocada pasada la noticia de las " + HhMm(T0));
                }
                if (orden != null && trade == null)
                {
                    var o = orden;
                    if (i - o.I > P.Plazo)
                    {
                        ev.Add(Hh(k) + "  orden cancelada — 5 velas sin consecución"); orden = null;
                    }
                    else if (tVela != null || o.Pausa != null)
                    {
                        if (o.Pausa == null)
                        {
                            o.Pausa = tVela;
                            ev.Add(Hh(k) + "  orden retirada — ventana de la noticia roja de las " + HhMm(tVela.Value) + " (R-35)");
                        }
                        if (o.Dir > 0 ? k.H >= o.E : k.L <= o.E) o.Cruzo = true;
                    }
                    else if (o.Dir > 0 ? (k.L <= o.S && k.C >= k.O) : (k.H >= o.S && k.C < k.O))
                    {
                        ev.Add(Hh(k) + "  orden cancelada — el precio volvió al punto del stop (" + F2(o.S) + ") antes de llenar, por el orden dentro de la vela");
                        orden = null;
                    }
                    else if (o.Dir > 0 ? k.H >= o.E : k.L <= o.E)
                    {
                        trade = new Trade { Tipo = o.Tipo, Dir = o.Dir, E = o.E, S = o.S, T = o.T, R = o.R, I = o.I, Pausa = o.Pausa, Cruzo = o.Cruzo,
                                            IFill = i, Hora = Hh(k) };
                        ev.Add(Hh(k) + "  ►► SE LLENA el " + o.Tipo + " " + (o.Dir > 0 ? "alcista" : "bajista") + " en " + F2(o.E));
                        // R-33: hasta stop u objetivo aunque acabe la ventana, hasta la última vela que haya
                        int ult = D.Count - 1; bool cerrado = false;
                        for (int j = i; j <= ult; j++)
                        {
                            var kk = D[j];
                            bool pier = trade.Dir > 0 ? kk.L <= trade.S : kk.H >= trade.S;
                            bool gana = trade.Dir > 0 ? kk.H >= trade.T : kk.L <= trade.T;
                            if (pier) { trade.Res = "STOP"; trade.Pts = -trade.R; trade.IOut = j; trade.HOut = Hh(kk); cerrado = true; break; }
                            if (gana) { trade.Res = "TARGET"; trade.Pts = trade.R; trade.IOut = j; trade.HOut = Hh(kk); cerrado = true; break; }
                        }
                        if (!cerrado) { trade.Res = "ABIERTO"; trade.Pts = null; trade.IOut = ult; trade.HOut = Hh(D[ult]); }
                        break;
                    }
                    if (orden != null && (o.Dir > 0 ? k.L <= o.S : k.H >= o.S))
                    {
                        ev.Add(Hh(k) + "  orden cancelada — el precio volvió al punto del stop (" + F2(o.S) + ")"); orden = null;
                    }
                    else if (orden != null && Hm(k) >= res.FinV - 1)
                    {
                        ev.Add(Hh(k) + "  orden cancelada — fin de ventana"); orden = null;
                    }
                }
                if (orden != null) continue;

                var vivas = Z.Where(z => z.I <= i && (z.Fin == null || z.Fin >= i)).ToList();

                // ---------- REINGRESO ----------
                foreach (var z in vivas)
                {
                    if (!(z.Roto != null && z.Consec && z.ReinOk) || z.Roto.I >= i) continue;
                    string d = z.Roto.Dir;
                    var lohi = z.En(i); double zlo = lohi[0], zhi = lohi[1];
                    int nd;
                    if (d == "arriba" && k.H >= zhi && k.L < zlo) nd = -1;
                    else if (d == "abajo" && k.L <= zlo && k.H > zhi) nd = 1;
                    else continue;
                    if (z.IConsec == i && !(nd < 0 ? k.C < k.O : k.C > k.O)) continue;
                    double st = nd < 0 ? double.MinValue : double.MaxValue;
                    for (int j = z.Roto.I; j <= i; j++) st = nd < 0 ? Math.Max(st, D[j].H) : Math.Min(st, D[j].L);
                    double e = nd < 0 ? k.L - P.Tick : k.H + P.Tick;
                    string motivo; double? t; double r;
                    var o = Evaluar(Z, i, "Reingreso", nd, e, st, out motivo, out t, out r);
                    if (t != null) res.Reingresos.Add(new Reingreso { I = i, E = e, T = t.Value, Nd = nd });
                    if (o != null)
                    {
                        var pr = PuntoDeReferencia(res, i, e, t.Value, nd);
                        if (pr != null) { o = null; motivo = "el objetivo pasa del punto de referencia " + F2(pr.Value); }
                    }
                    string tag = Hh(k) + "  REINGRESO " + (nd < 0 ? "bajista" : "alcista") + " · entrada " + F2(e) + " · stop " + F2(st)
                                 + (t != null ? " · objetivo " + F2(t.Value) + " · riesgo " + F2(r) : "");
                    if (o != null) orden = Colocar(o, tag, ev, k);
                    else ev.Add(tag + "  ✗ descartado — " + motivo);
                    break;
                }
                if (orden != null) continue;

                // ---------- ROMPIMIENTO -> CONTINUACIÓN ----------
                foreach (var z in vivas)
                {
                    if (z.Roto != null || !z.DeCorrida || z.RIni == null) continue;
                    var lohi = z.En(i); double zlo = lohi[0], zhi = lohi[1]; int nd = z.Dir;
                    string d; double e0;
                    if (nd > 0 && k.L <= zhi && k.H > zhi + P.Tick / 2) { d = "arriba"; e0 = k.H; }
                    else if (nd < 0 && k.H >= zlo && k.L < zlo - P.Tick / 2) { d = "abajo"; e0 = k.L; }
                    else continue;
                    z.Roto = new Roto { Dir = d, I = i, Ex = e0 };
                    if (soloReingresos)
                    {
                        ev.Add(Hh(k) + "  rompimiento de " + z + " — día de Fed: no se opera la continuación");
                        break;
                    }
                    string veto = flu.Permiso(z, i);
                    if (veto != null)
                    {
                        ev.Add(Hh(k) + "  rompimiento de " + z + " ✗ no se opera — " + veto + " (R-40)");
                        break;
                    }
                    double st = nd > 0 ? double.MaxValue : double.MinValue;
                    for (int j = z.RIni.Value; j <= i; j++) st = nd > 0 ? Math.Min(st, D[j].L) : Math.Max(st, D[j].H);
                    double e = e0 + P.Tick * nd;
                    string motivo; double? t; double r;
                    var o = Evaluar(Z, i, "Continuación", nd, e, st, out motivo, out t, out r);
                    string tag = Hh(k) + "  CONTINUACIÓN " + (nd > 0 ? "alcista" : "bajista") + " · entrada " + F2(e) + " · stop " + F2(st)
                                 + (t != null ? " · objetivo " + F2(t.Value) + " · riesgo " + F2(r) : "");
                    if (o != null) orden = Colocar(o, tag, ev, k);
                    else ev.Add(tag + "  ✗ descartado — " + motivo);
                    break;
                }
            }
            res.Trade = trade;
            res.Orden = trade != null ? null : orden;
        }

        // ─────────────────────────────────────────────────────────── zigzag suelto
        /// <summary>El zigzag de leer_sesion (piv) sobre las velas desde la vela base (índice 0), sin zonas: lo
        /// dibuja MarcacionChaumer. null si aún no se sabe la dirección del día. La sincronía lo compara con piv.</summary>
        public static List<Vertice> Zigzag(double[] o, double[] h, double[] l, double[] c, int n)
        {
            if (n < 1) return null;
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
                        if (c[j] == o[j]) return null;
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
                if (corrida)
                {
                    bool muere = alc ? l[i] < l[p] : h[i] > h[p];
                    bool nuevoExt = alc ? h[i] > h[ext] : l[i] < l[ext];
                    if (nuevoExt && !muere) ext = i;
                    else if (nuevoExt && muere)
                    {
                        bool extremoPrimero = alc ? c[i] < o[i] : c[i] >= o[i];
                        if (extremoPrimero) ext = i;
                    }
                    if (!muere) continue;
                    piv.Add(new Vertice { I = ext, Precio = alc ? h[ext] : l[ext], Confirma = i });
                    corrida = false; rExt = i;
                }
                else
                {
                    bool confirma = alc ? h[i] > h[p] : l[i] < l[p];
                    bool hunde = alc ? l[i] < l[rExt] : h[i] > h[rExt];
                    if (hunde && !confirma) rExt = i;
                    else if (hunde && confirma)
                    {
                        bool extremoPrimero = alc ? c[i] >= o[i] : c[i] < o[i];
                        if (extremoPrimero) rExt = i;
                    }
                    if (!confirma) continue;
                    piv.Add(new Vertice { I = rExt, Precio = alc ? l[rExt] : h[rExt], Confirma = i });
                    corrida = true; ext = i;
                }
            }
            if (corrida) piv.Add(new Vertice { I = ext, Precio = alc ? h[ext] : l[ext], Confirma = -1 });
            else piv.Add(new Vertice { I = rExt, Precio = alc ? l[rExt] : h[rExt], Confirma = -1 });
            return piv;
        }

        // ─────────────────────────────────────────────────────────── el sello
        /// <summary>sha256 (16 primeros hex) del texto con los saltos de línea normalizados a \n. Igual en
        /// scripts/bot/sincronia.py, para que Windows (CRLF) y git (LF) den la misma huella.</summary>
        public static string Huella(string texto)
        {
            var t = texto.Replace("\r\n", "\n");
            if (t.Length > 0 && t[0] == '﻿') t = t.Substring(1);
            using (var sha = SHA256.Create())
            {
                var b = sha.ComputeHash(new UTF8Encoding(false).GetBytes(t));
                var sb = new StringBuilder();
                foreach (var x in b) sb.Append(x.ToString("x2"));
                return sb.ToString().Substring(0, 16);
            }
        }

        /// <summary>El sello que corresponde a estos dos textos: "L:huella(lector.py) C:huella(este archivo sin el valor del SELLO)".</summary>
        public static string SelloDe(string textoLector, string textoMotorCs)
        {
            return "L:" + Huella(textoLector) + " C:" + Huella(Regex.Replace(textoMotorCs, "SELLO = \"[^\"]*\"", "SELLO = \"\""));
        }
    }
}
