// ═══════════════════════════════════════════════════════════════════════════
//  ChaumerNT — lo que comparten BotChaumer y VistaMotorChaumer dentro de NinjaTrader
//  Diseño: docs/disenos/2026-10-06-bot-chaumer.md §12.3 · D-038
//
//  - la configuración (Documentos\NinjaTrader 8\bot-chaumer.json: repositorio, cuentas, GO);
//  - el sello del motor contra el repositorio y los números del plan (reglas.json);
//  - las lecturas de Supabase de un día (noticias rojas, día de Fed, GO);
//  - las velas del día en UTC desde las Bars del gráfico, como las exporta la cadena diaria.
//
//  MarcacionChaumer NO lo usa: es el indicador del gráfico operativo de Kris y queda independiente
//  del bot (07/10/2026). MotorChaumer.cs tampoco: sigue sin NinjaTrader, para el arnés.
//
//  En C# 5. Instalar: copiar a Documentos\NinjaTrader 8\bin\Custom\AddOns\ y compilar (F5).
// ═══════════════════════════════════════════════════════════════════════════

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using NinjaTrader.Cbi;
using NinjaTrader.Data;

namespace NinjaTrader.NinjaScript
{
    public class ConfigChaumer
    {
        public string Repo = @"E:\Proyectos\Trading Journal";
        public List<string> Cuentas = new List<string> { "SimBot", "Sim101", "Playback101", "Backtest" };
        public bool ExigirGo = false;
    }

    public static class ChaumerNT
    {
        public const string URL = "https://jothoslozctflfrnysrx.supabase.co/rest/v1/";
        public static readonly CultureInfo INV = CultureInfo.InvariantCulture;
        public static readonly string DIR_NT = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "NinjaTrader 8");

        // ── configuración ────────────────────────────────────────────────────
        /// <summary>bot-chaumer.json; si no existe, lo crea con los valores por defecto. `log` recibe los avisos.</summary>
        public static ConfigChaumer LeerConfig(Action<string> log)
        {
            var c = new ConfigChaumer();
            string path = Path.Combine(DIR_NT, "bot-chaumer.json");
            try
            {
                if (!File.Exists(path))
                {
                    var j0 = new JObject();
                    j0["repo"] = c.Repo; j0["cuentas"] = new JArray(c.Cuentas.ToArray()); j0["exigir_go"] = c.ExigirGo;
                    File.WriteAllText(path, j0.ToString(), new UTF8Encoding(false));
                    return c;
                }
                var j = JObject.Parse(File.ReadAllText(path));
                if (j["repo"] != null) c.Repo = (string)j["repo"];
                if (j["cuentas"] != null) c.Cuentas = j["cuentas"].Select(x => (string)x).ToList();
                if (j["exigir_go"] != null) c.ExigirGo = (bool)j["exigir_go"];
            }
            catch (Exception e) { if (log != null) log("bot-chaumer.json ilegible (" + e.Message + "): uso los valores por defecto"); }
            return c;
        }

        // ── el motor: sello y parámetros ─────────────────────────────────────
        /// <summary>null si el motor compilado es el del repositorio y los parámetros se leen; si no, el motivo.</summary>
        public static string ComprobarMotor(string repo, out MotorChaumer.Parametros p)
        {
            p = null;
            try
            {
                string lector = Path.Combine(repo, @"chaumer\05_Backtesting\claude\motor\lector.py");
                string motorCs = Path.Combine(repo, @"NinjaTrader\MotorChaumer.cs");
                string sello = MotorChaumer.SelloDe(File.ReadAllText(lector, Encoding.UTF8), File.ReadAllText(motorCs, Encoding.UTF8));
                if (sello != MotorChaumer.SELLO)
                    return "motor desincronizado: el compilado es " + MotorChaumer.SELLO + " y el del repositorio " + sello
                         + ". Pasa scripts/bot/sincronia.py --sellar, copia MotorChaumer.cs a Custom\\AddOns y F5";
                p = MotorChaumer.Parametros.Leer(Path.Combine(repo, @"chaumer\01_Plan\reglas.json"));
                return null;
            }
            catch (Exception e) { return "no puedo leer el motor del repositorio (" + repo + "): " + e.Message; }
        }

        // ── Supabase ─────────────────────────────────────────────────────────
        public static string LeerClave()
        {
            try
            {
                string path = Path.Combine(DIR_NT, "supabase-service-key.txt");
                if (File.Exists(path)) return File.ReadAllText(path).Trim().TrimStart('\uFEFF').Trim();
            }
            catch { }
            return null;
        }

        /// <summary>Un cliente con la service_role key, o null si falta la key.</summary>
        public static HttpClient Cliente()
        {
            string clave = LeerClave();
            if (string.IsNullOrEmpty(clave)) return null;
            var http = new HttpClient();
            http.Timeout = TimeSpan.FromSeconds(8);
            http.DefaultRequestHeaders.Add("apikey", clave);
            http.DefaultRequestHeaders.Add("Authorization", "Bearer " + clave);
            return http;
        }

        public static JArray Get(HttpClient http, string ruta)
        {
            string txt = Task.Run(() => http.GetStringAsync(URL + ruta)).Result;
            return JArray.Parse(txt);
        }

        public static int Minutos(string hora) { return int.Parse(hora.Substring(0, 2), INV) * 60 + int.Parse(hora.Substring(3, 2), INV); }

        /// <summary>Noticias rojas (minutos, hora Colombia), día de Fed y GO de una fecha (yyyy-MM-dd).
        /// null si se leyeron noticias y Fed; si no, el fallo. El GO no bloquea: null si no se pudo leer.</summary>
        public static string LeerDia(HttpClient http, string fecha, out List<int> nots, out bool fed, out bool? go)
        {
            nots = new List<int>(); fed = false; go = null;
            try
            {
                foreach (var n in Get(http, "sesion_noticias?select=hora&order=hora&sesion_date=eq." + fecha)) nots.Add(Minutos((string)n["hora"]));
                fed = Get(http, "catalogo_fechas?select=fecha&tipo=eq.fomc&activa=eq.true&fecha=eq." + fecha).Count > 0;
            }
            catch (Exception e) { return (e.InnerException ?? e).Message; }
            try
            {
                var s = Get(http, "sesiones?select=checklist_go_at&sesion_date=eq." + fecha);
                go = s.Count > 0 && s[0]["checklist_go_at"] != null && s[0]["checklist_go_at"].Type != JTokenType.Null;
            }
            catch { go = null; }
            return null;
        }

        // ── velas y horas ────────────────────────────────────────────────────
        /// <summary>La hora (UTC) de CIERRE de la vela idx. Las Bars vienen en la zona de NinjaTrader (`tzNt`).</summary>
        public static DateTime Utc(Bars bars, int idx, TimeZoneInfo tzNt)
        {
            return TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(bars.GetTime(idx), DateTimeKind.Unspecified), tzNt);
        }

        /// <summary>La vela idx como la exporta la cadena diaria: fecha y hora de cierre en UTC.</summary>
        public static MotorChaumer.Vela Vela(Bars bars, int idx, TimeZoneInfo tzNt)
        {
            DateTime u = Utc(bars, idx, tzNt);
            return new MotorChaumer.Vela
            {
                D = u.ToString("yyyyMMdd", INV), T = u.ToString("HHmmss", INV),
                O = bars.GetOpen(idx), H = bars.GetHigh(idx), L = bars.GetLow(idx), C = bars.GetClose(idx), V = (long)bars.GetVolume(idx)
            };
        }

        /// <summary>La primera vela del día UTC `d` hacia atrás desde `idx`.</summary>
        public static int InicioDia(Bars bars, int idx, string d, TimeZoneInfo tzNt)
        {
            int i = idx;
            while (i > 0 && Utc(bars, i - 1, tzNt).ToString("yyyyMMdd", INV) == d) i--;
            return i;
        }

        // ── el premercado, pedido al servidor (14/10/2026) ───────────────────
        // Las velas que NinjaTrader arma en vivo justo después de conectarse pueden salir mal: el 14/10 la de las 8:03
        // llegó al gráfico con más de 8.000 contratos y en el servidor tuvo 3.708, y el motor marcó una zona de
        // premercado que no existía. Por eso el premercado se pide al servidor, igual que la cadena diaria a las 10:32.

        /// <summary>Pide al servidor las velas de 1 minuto con cierre en [desdeUtc, hastaUtc]. `fin` recibe las velas
        /// (o null) y el fallo (o null), en otro hilo. El BarsRequest se lanza desde el hilo de la interfaz, como en CadenaDiaria.</summary>
        public static void PedirVelas(Instrument ins, TradingHours horario, DateTime desdeUtc, DateTime hastaUtc, TimeZoneInfo tzNt,
                                      Action<List<MotorChaumer.Vela>, string> fin)
        {
            Action lanzar = delegate
            {
                try
                {
                    DateTime desde = TimeZoneInfo.ConvertTimeFromUtc(desdeUtc.AddMinutes(-2), tzNt);
                    DateTime hasta = TimeZoneInfo.ConvertTimeFromUtc(hastaUtc.AddMinutes(2), tzNt);
                    var req = new BarsRequest(ins, desde, hasta);
                    req.BarsPeriod = new BarsPeriod { BarsPeriodType = BarsPeriodType.Minute, Value = 1, MarketDataType = MarketDataType.Last };
                    req.TradingHours = horario ?? ins.MasterInstrument.TradingHours;
                    req.MergePolicy = MergePolicy.UseGlobalSettings;
                    req.Request(new Action<BarsRequest, ErrorCode, string>(delegate(BarsRequest r, ErrorCode err, string msg)
                    {
                        List<MotorChaumer.Vela> v = null; string fallo = null;
                        try
                        {
                            if (err != ErrorCode.NoError) fallo = err + " " + msg;
                            else
                            {
                                v = new List<MotorChaumer.Vela>();
                                for (int k = 0; k < r.Bars.Count; k++)
                                {
                                    DateTime u = Utc(r.Bars, k, tzNt);
                                    if (u >= desdeUtc && u <= hastaUtc) v.Add(Vela(r.Bars, k, tzNt));
                                }
                            }
                        }
                        catch (Exception e) { fallo = e.Message; v = null; }
                        finally { try { r.Dispose(); } catch { } }
                        fin(v, fallo);
                    }));
                }
                catch (Exception e) { fin(null, e.Message); }
            };
            if (System.Windows.Application.Current != null) System.Windows.Application.Current.Dispatcher.BeginInvoke(lanzar);
            else lanzar();
        }

        /// <summary>El tramo del premercado de un día del motor: de la primera vela del día UTC a la anterior a la apertura.</summary>
        public static void TramoPremercado(string d, out DateTime desdeUtc, out DateTime hastaUtc)
        {
            DateTime dia = DateTime.ParseExact(d, "yyyyMMdd", INV, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);
            int ap = MotorChaumer.AperturaUtc(d);                                   // 1331: la vela base cierra a las 13:31 UTC
            desdeUtc = dia.AddMinutes(1);
            hastaUtc = dia.AddHours(ap / 100).AddMinutes(ap % 100 - 1);
        }

        /// <summary>Compara el premercado del gráfico con el del servidor. Devuelve las líneas para el registro: la primera, el
        /// resumen; después las velas distintas (primero las que cambian de lado del umbral de volumen), hasta `max`.</summary>
        public static List<string> CompararVelas(List<MotorChaumer.Vela> servidor, List<MotorChaumer.Vela> grafico, long umbral, int max)
        {
            var g = new Dictionary<string, MotorChaumer.Vela>();
            foreach (var x in grafico) g[x.D + x.T] = x;
            var cruzan = new List<string>(); var otras = new List<string>(); int faltan = 0;
            foreach (var s in servidor)
            {
                MotorChaumer.Vela c;
                if (!g.TryGetValue(s.D + s.T, out c)) { faltan++; continue; }
                bool precio = Math.Abs(c.O - s.O) > 1e-9 || Math.Abs(c.H - s.H) > 1e-9 || Math.Abs(c.L - s.L) > 1e-9 || Math.Abs(c.C - s.C) > 1e-9;
                if (!precio && c.V == s.V) continue;
                string t = HoraCol(s) + " · gráfico " + c.V.ToString("N0", ES) + " / servidor " + s.V.ToString("N0", ES) + " contratos";
                if (precio) t += " · precios gráfico " + MotorChaumer.F2(c.O) + " " + MotorChaumer.F2(c.H) + " " + MotorChaumer.F2(c.L) + " " + MotorChaumer.F2(c.C)
                               + " / servidor " + MotorChaumer.F2(s.O) + " " + MotorChaumer.F2(s.H) + " " + MotorChaumer.F2(s.L) + " " + MotorChaumer.F2(s.C);
                if ((c.V > umbral) != (s.V > umbral)) cruzan.Add(t + "  ← cambia de lado del umbral de " + umbral.ToString("N0", ES));
                else otras.Add(t);
            }
            int distintas = cruzan.Count + otras.Count;
            var lineas = new List<string>();
            lineas.Add("premercado del servidor: " + servidor.Count + " velas · el gráfico tenía " + grafico.Count
                       + (distintas == 0 && faltan == 0 ? " · todas iguales"
                          : " · " + distintas + " distintas" + (cruzan.Count > 0 ? " (" + cruzan.Count + " cruzan el umbral)" : "")
                            + (faltan > 0 ? " · " + faltan + " que el gráfico no tenía" : "")));
            foreach (var t in cruzan.Concat(otras).Take(max)) lineas.Add("   " + t);
            if (distintas > max) lineas.Add("   … y " + (distintas - max) + " más");
            return lineas;
        }

        private static readonly CultureInfo ES = CultureInfo.GetCultureInfo("es-ES");

        // ── las velas del bot (19/10/2026, docs/disenos/2026-10-19-velas-del-bot.md) ──
        // La ventana tal como la vio el bot en vivo, vela a vela: la ficha del motor se hace con ellas.
        // Mismo formato que la exportación de la cadena. Solo se añade: una vela ya escrita no se cambia.

        public static string RutaVelasBot(string repo, string fecha)
        {
            return Path.Combine(repo, @"chaumer\05_Backtesting\claude\motor\datos\dia_bot", fecha + ".txt");
        }

        public static string LineaVela(MotorChaumer.Vela k)
        {
            return k.D + " " + k.T + ";" + k.O.ToString(INV) + ";" + k.H.ToString(INV) + ";" + k.L.ToString(INV) + ";"
                 + k.C.ToString(INV) + ";" + k.V.ToString(INV);
        }

        /// <summary>Las velas ya escritas en el archivo del bot, por fecha+hora (vacío si no existe).</summary>
        public static Dictionary<string, MotorChaumer.Vela> LeerVelasBot(string path)
        {
            var r = new Dictionary<string, MotorChaumer.Vela>();
            try
            {
                if (!File.Exists(path)) return r;
                foreach (string l in File.ReadAllLines(path))
                {
                    string[] p = l.Trim().Split(';');
                    if (p.Length < 6) continue;
                    string[] dt = p[0].Split(' ');
                    var k = new MotorChaumer.Vela
                    {
                        D = dt[0], T = dt[1], O = double.Parse(p[1], INV), H = double.Parse(p[2], INV),
                        L = double.Parse(p[3], INV), C = double.Parse(p[4], INV), V = long.Parse(p[5], INV)
                    };
                    if (!r.ContainsKey(k.D + k.T)) r[k.D + k.T] = k;
                }
            }
            catch { }
            return r;
        }

        /// <summary>Añade velas al archivo del bot (y su .meta.json la primera vez). Devuelve el fallo o null.</summary>
        public static string AnadirVelasBot(string path, List<MotorChaumer.Vela> nuevas, string instrumento, string cuenta, bool volcado)
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(path));
                string meta = path.Substring(0, path.Length - 4) + ".meta.json";
                if (!File.Exists(meta))
                {
                    var j = new JObject();
                    j["instrumento"] = instrumento; j["fuente"] = "bot"; j["cuenta"] = cuenta; j["sello"] = MotorChaumer.SELLO;
                    j["volcado_al_arrancar"] = volcado; j["creado"] = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", INV);
                    File.WriteAllText(meta, j.ToString(), new UTF8Encoding(false));
                }
                var sb = new StringBuilder();
                foreach (var k in nuevas) sb.Append(LineaVela(k)).Append("\r\n");
                File.AppendAllText(path, sb.ToString(), new UTF8Encoding(false));
                return null;
            }
            catch (Exception e) { return e.Message; }
        }

        /// <summary>La hora Colombia (UTC−5) del cierre de una vela, "19:07" — también la de la noche anterior.</summary>
        public static string HoraCol(MotorChaumer.Vela k)
        {
            int m = (MotorChaumer.Hm(k) / 100 * 60 + MotorChaumer.Hm(k) % 100 - 300 + 1440) % 1440;
            return (m / 60) + ":" + (m % 60).ToString("00", INV);
        }

        /// <summary>La etiqueta del motor ("8:38") de la vela idx.</summary>
        public static string Hora(Bars bars, int idx, TimeZoneInfo tzNt)
        {
            return MotorChaumer.Hh(new MotorChaumer.Vela { T = Utc(bars, idx, tzNt).ToString("HHmmss", INV) });
        }

        /// <summary>La etiqueta del motor de un instante: la de la vela que lo contiene (hora de cierre).</summary>
        public static string HoraDe(DateTime tNt, TimeZoneInfo tzNt)
        {
            DateTime u = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(tNt, DateTimeKind.Unspecified), tzNt);
            DateTime m = new DateTime(u.Year, u.Month, u.Day, u.Hour, u.Minute, 0);
            if (u > m) m = m.AddMinutes(1);
            return MotorChaumer.Hh(new MotorChaumer.Vela { T = m.ToString("HHmmss", INV) });
        }
    }
}
