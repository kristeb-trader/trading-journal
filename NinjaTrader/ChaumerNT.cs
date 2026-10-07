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
