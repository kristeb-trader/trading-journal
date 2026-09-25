// ═══════════════════════════════════════════════════════════════════════════
//  CadenaDiaria — AddOn de NinjaTrader 8 (fase 7e de la cadena diaria)
//  Diseño: docs/disenos/2026-09-24-cadena-diaria.md §4.4
//
//  Exporta las velas de 1 minuto del día al cerrar la ventana operativa y lanza el
//  puente (scripts/cadena/subir_dia.py), que corre el motor y sube la ficha a Supabase.
//
//  - Sin ventana, sin gráfico, sin tocar cuentas ni órdenes. Solo pide velas y
//    escribe archivos. Arranca solo con NinjaTrader.
//  - Cada minuto (el primero, 1 min después de abrir el Control Center): si hay una
//    conexión con precios, revisa los últimos 5 días hábiles, y hoy si ya pasó el fin
//    de la ventana + 2 min en hora de Nueva York (11:32 ET = 10:32 Col en verano,
//    11:32 Col en invierno). Cada día SIN archivo se pide y se escribe.
//  - El archivo es como la exportación manual de Kris: `yyyyMMdd HHmmss;o;h;l;c;v`,
//    en UTC, hora de CIERRE de la vela, punto decimal (cultura invariante), desde las
//    00:00 del día hábil anterior hasta la última vela de la ventana.
//  - Contrato: el vigente ese día según la lista de rollover de NinjaTrader (hoy
//    MNQ 12-26), con la merge policy global (la de los gráficos de Kris).
//  - Si escribió algo (o al arrancar), lanza `python subir_dia.py --pendientes` en
//    segundo plano, sin consola, y guarda su salida en el registro.
//
//  Configuración: Documentos\NinjaTrader 8\cadena-diaria.json (se crea sola).
//  Registro:      Documentos\NinjaTrader 8\cadena-diaria\registro.txt
//
//  Escrito en C# 5 (sin ?. ni $"") para poder compilarlo fuera de NinjaTrader con el
//  csc del sistema contra las DLL de NT8 (ver .claude/rules/ninjatrader.md).
//
//  Instalar: copiar a Documentos\NinjaTrader 8\bin\Custom\AddOns\ y compilar (F5 en
//  el NinjaScript Editor). No hay nada que abrir: trabaja solo.
// ═══════════════════════════════════════════════════════════════════════════

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Windows;
using Newtonsoft.Json.Linq;
using NinjaTrader.Cbi;
using NinjaTrader.Data;

namespace NinjaTrader.NinjaScript.AddOns
{
    public class CadenaDiaria : AddOnBase
    {
        // ── Constantes de la ventana (09:31–11:30 de Nueva York, 120 velas) ──
        private static readonly TimeSpan VELA_BASE_ET = new TimeSpan(9, 31, 0);
        private const int VELAS_VENTANA = 120;
        private const int MARGEN_MIN = 2;          // se exporta 2 min después del fin de ventana
        private const int ESPERA_HOY_MIN = 60;     // hoy incompleto: se reintenta hasta 1 h después

        // Una sola instancia viva: NinjaTrader crea varias del AddOn (SetDefaults, etc.)
        private static readonly object candado = new object();
        private static System.Threading.Timer reloj;
        private static bool ocupado;
        private static bool puenteCorriendo;
        private static bool puenteLanzadoAlArrancar;

        private static string DirNT
        {
            get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "NinjaTrader 8"); }
        }

        // ── Ciclo de vida ────────────────────────────────────────────────────
        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Name        = "Cadena Diaria";
                Description = "Exporta las velas del día al cerrar la ventana y lanza el puente del motor (Trading Journal, fase 7).";
            }
            else if (State == State.Terminated)
            {
                Parar();
            }
        }

        // El Control Center existe mientras NinjaTrader está abierto: ahí arranca el reloj.
        protected override void OnWindowCreated(Window window)
        {
            if (!(window is NinjaTrader.Gui.ControlCenter)) return;
            lock (candado)
            {
                if (reloj != null) return;
                reloj = new System.Threading.Timer(Tic, null, TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(1));
            }
            Log("AddOn activo: primera revisión en 1 minuto");
        }

        protected override void OnWindowDestroyed(Window window)
        {
            if (window is NinjaTrader.Gui.ControlCenter) Parar();
        }

        private static void Parar()
        {
            lock (candado)
            {
                if (reloj == null) return;
                reloj.Dispose();
                reloj = null;
            }
        }

        // ── Configuración ────────────────────────────────────────────────────
        private class Config
        {
            public bool Activo = true;
            public string Carpeta = @"E:\Proyectos\Trading Journal\chaumer\05_Backtesting\datos\dia_auto";
            public string Python = "python";
            public string Puente = @"E:\Proyectos\Trading Journal\scripts\cadena\subir_dia.py";
            public bool LanzarPuente = true;
            public string Instrumento = "MNQ";
            public int DiasAtras = 5;
        }

        private static Config LeerConfig()
        {
            Config c = new Config();
            string path = Path.Combine(DirNT, "cadena-diaria.json");
            try
            {
                if (!File.Exists(path))
                {
                    JObject d = new JObject();
                    d["activo"] = c.Activo;
                    d["carpeta_salida"] = c.Carpeta;
                    d["python"] = c.Python;
                    d["puente"] = c.Puente;
                    d["lanzar_puente"] = c.LanzarPuente;
                    d["instrumento"] = c.Instrumento;
                    d["dias_atras"] = c.DiasAtras;
                    File.WriteAllText(path, d.ToString(), new UTF8Encoding(false));
                    Log("configuración creada con valores por defecto: " + path);
                    return c;
                }
                JObject j = JObject.Parse(File.ReadAllText(path));
                if (j["activo"] != null)         c.Activo = (bool)j["activo"];
                if (j["carpeta_salida"] != null) c.Carpeta = (string)j["carpeta_salida"];
                if (j["python"] != null)         c.Python = (string)j["python"];
                if (j["puente"] != null)         c.Puente = (string)j["puente"];
                if (j["lanzar_puente"] != null)  c.LanzarPuente = (bool)j["lanzar_puente"];
                if (j["instrumento"] != null)    c.Instrumento = (string)j["instrumento"];
                if (j["dias_atras"] != null)     c.DiasAtras = (int)j["dias_atras"];
            }
            catch (Exception e) { Log("configuración ilegible (" + e.Message + "): uso los valores por defecto"); }
            return c;
        }

        // ── El reloj: cada minuto ────────────────────────────────────────────
        private class Pendiente
        {
            public DateTime Dia;          // la jornada (fecha de Nueva York = fecha UTC de la ventana)
            public bool EsHoy;
            public DateTime CierreUtc;    // cierre de la última vela de la ventana
        }

        private static void Tic(object _)
        {
            lock (candado) { if (ocupado) return; ocupado = true; }
            bool liberar = true;
            try
            {
                Config cfg = LeerConfig();
                if (!cfg.Activo) return;
                if (!HayConexion()) return;

                Directory.CreateDirectory(cfg.Carpeta);
                List<Pendiente> cola = DiasSinArchivo(cfg);
                if (cola.Count == 0)
                {
                    if (!puenteLanzadoAlArrancar) { puenteLanzadoAlArrancar = true; LanzarPuente(cfg, "al arrancar"); }
                    return;
                }
                // Los BarsRequest se lanzan desde el hilo de la interfaz, uno detrás de otro.
                liberar = false;
                Application.Current.Dispatcher.BeginInvoke(new Action(delegate { Siguiente(cfg, cola, 0, false); }));
            }
            catch (Exception e) { Log("❌ " + e.Message); }
            finally { if (liberar) lock (candado) ocupado = false; }
        }

        private static bool HayConexion()
        {
            try
            {
                foreach (Connection c in Connection.Connections.ToArray())
                    if (c.Status == ConnectionStatus.Connected && c.PriceStatus == ConnectionStatus.Connected) return true;
            }
            catch { }
            return false;
        }

        private static TimeZoneInfo NuevaYork
        {
            get { return TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"); }
        }

        // Cierre (UTC) de la vela base: 09:31 ET → 13:31 UTC en verano, 14:31 en invierno.
        private static DateTime BaseUtc(DateTime dia)
        {
            return TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(dia.Date + VELA_BASE_ET, DateTimeKind.Unspecified), NuevaYork);
        }

        private static bool EsHabil(DateTime d) { return d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday; }

        private static DateTime HabilAnterior(DateTime d)
        {
            do d = d.AddDays(-1); while (!EsHabil(d));
            return d;
        }

        private static List<Pendiente> DiasSinArchivo(Config cfg)
        {
            DateTime ahoraUtc = DateTime.UtcNow;
            DateTime hoy = TimeZoneInfo.ConvertTimeFromUtc(ahoraUtc, NuevaYork).Date;
            List<DateTime> dias = new List<DateTime>();
            DateTime d = hoy;
            for (int n = 0; n < cfg.DiasAtras; n++) { d = HabilAnterior(d); dias.Add(d); }
            dias.Reverse();
            if (EsHabil(hoy)) dias.Add(hoy);

            List<Pendiente> cola = new List<Pendiente>();
            foreach (DateTime dia in dias)
            {
                if (File.Exists(Archivo(cfg, dia))) continue;
                DateTime cierre = BaseUtc(dia).AddMinutes(VELAS_VENTANA - 1);
                bool esHoy = dia == hoy;
                if (esHoy && ahoraUtc < cierre.AddMinutes(MARGEN_MIN)) continue;   // aún no acabó la ventana
                cola.Add(new Pendiente { Dia = dia, EsHoy = esHoy, CierreUtc = cierre });
            }
            return cola;
        }

        private static string Archivo(Config cfg, DateTime dia)
        {
            return Path.Combine(cfg.Carpeta, dia.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) + ".txt");
        }

        // ── Un día: pedir las velas y escribir el archivo ────────────────────
        private static void Siguiente(Config cfg, List<Pendiente> cola, int i, bool escribio)
        {
            if (i >= cola.Count)
            {
                if (escribio || !puenteLanzadoAlArrancar)
                {
                    puenteLanzadoAlArrancar = true;
                    LanzarPuente(cfg, escribio ? "días nuevos" : "al arrancar");
                }
                lock (candado) ocupado = false;
                return;
            }
            Pendiente p = cola[i];
            try
            {
                Instrument ins = Contrato(cfg, p.Dia);
                if (ins == null)
                {
                    Log(Dia(p) + "  ❌ no encuentro el contrato vigente de " + cfg.Instrumento);
                    Siguiente(cfg, cola, i + 1, escribio);
                    return;
                }
                TimeZoneInfo zonaNT = NinjaTrader.Core.Globals.GeneralOptions.TimeZoneInfo;
                DateTime desde = HabilAnterior(p.Dia).Date;                                     // 00:00 hora NinjaTrader, como Kris
                DateTime hasta = TimeZoneInfo.ConvertTimeFromUtc(p.CierreUtc.AddMinutes(5), zonaNT);

                BarsRequest req = new BarsRequest(ins, desde, hasta);
                req.BarsPeriod = new BarsPeriod { BarsPeriodType = BarsPeriodType.Minute, Value = 1, MarketDataType = MarketDataType.Last };
                req.TradingHours = ins.MasterInstrument.TradingHours;                           // <Use instrument settings>
                req.MergePolicy = MergePolicy.UseGlobalSettings;
                req.Request(new Action<BarsRequest, ErrorCode, string>(delegate (BarsRequest r, ErrorCode err, string msg)
                {
                    bool ok = false;
                    try
                    {
                        if (err != ErrorCode.NoError) Log(Dia(p) + "  ❌ " + ins.FullName + ": " + err + " " + msg);
                        else ok = Escribir(cfg, p, ins, r.Bars, zonaNT);
                    }
                    catch (Exception e) { Log(Dia(p) + "  ❌ " + e.Message); }
                    finally { r.Dispose(); }
                    Application.Current.Dispatcher.BeginInvoke(new Action(delegate { Siguiente(cfg, cola, i + 1, escribio || ok); }));
                }));
            }
            catch (Exception e)
            {
                Log(Dia(p) + "  ❌ " + e.Message);
                Siguiente(cfg, cola, i + 1, escribio);
            }
        }

        // El contrato vigente ESE día según la lista de rollover: el del último rollover
        // con fecha <= día. Si la lista no sirve, GetNextExpiry.
        private static Instrument Contrato(Config cfg, DateTime dia)
        {
            MasterInstrument master = null;
            for (int k = 0; k < 6 && master == null; k++)
            {
                DateTime m = new DateTime(dia.Year, dia.Month, 1).AddMonths(k);
                if (m.Month % 3 != 0) continue;
                Instrument i = Instrument.GetInstrument(cfg.Instrumento + " " + m.ToString("MM-yy", CultureInfo.InvariantCulture), false);
                if (i != null) master = i.MasterInstrument;
            }
            if (master == null) return null;

            DateTime mes = DateTime.MinValue, fechaRoll = DateTime.MinValue;
            foreach (Rollover r in master.RolloverCollection)
                if (r.Date.Date <= dia.Date && r.Date > fechaRoll) { fechaRoll = r.Date; mes = r.ContractMonth; }
            if (mes == DateTime.MinValue) mes = master.GetNextExpiry(dia);
            return Instrument.GetInstrument(cfg.Instrumento + " " + mes.ToString("MM-yy", CultureInfo.InvariantCulture), false);
        }

        private static bool Escribir(Config cfg, Pendiente p, Instrument ins, Bars bars, TimeZoneInfo zonaNT)
        {
            DateTime baseUtc = BaseUtc(p.Dia);
            StringBuilder sb = new StringBuilder();
            int n = 0, enVentana = 0, delDia = 0;
            DateTime primera = DateTime.MinValue, ultima = DateTime.MinValue;
            CultureInfo inv = CultureInfo.InvariantCulture;
            for (int k = 0; k < bars.Count; k++)
            {
                // GetTime = cierre de la vela, en la zona de NinjaTrader (Colombia) → UTC
                DateTime utc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(bars.GetTime(k), DateTimeKind.Unspecified), zonaNT);
                if (utc > p.CierreUtc) break;
                sb.Append(utc.ToString("yyyyMMdd HHmmss", inv)).Append(';')
                  .Append(bars.GetOpen(k).ToString(inv)).Append(';')
                  .Append(bars.GetHigh(k).ToString(inv)).Append(';')
                  .Append(bars.GetLow(k).ToString(inv)).Append(';')
                  .Append(bars.GetClose(k).ToString(inv)).Append(';')
                  .Append(bars.GetVolume(k).ToString(inv)).Append("\r\n");
                if (n == 0) primera = utc;
                ultima = utc; n++;
                if (utc.Date == p.Dia.Date) delDia++;
                if (utc >= baseUtc && utc <= p.CierreUtc) enVentana++;
            }

            if (enVentana < VELAS_VENTANA)
            {
                // Hoy puede faltar aún la última vela: se reintenta el minuto siguiente,
                // hasta 1 h después. Un día pasado (festivo, medio día) se escribe tal cual:
                // el puente lo marcará sin_jornada si no hay ventana.
                if (p.EsHoy && DateTime.UtcNow < p.CierreUtc.AddMinutes(ESPERA_HOY_MIN))
                {
                    Log(Dia(p) + "  ventana incompleta (" + enVentana + "/" + VELAS_VENTANA + "): reintento el minuto siguiente");
                    return false;
                }
                if (n == 0) { Log(Dia(p) + "  ❌ " + ins.FullName + " no devolvió velas"); return false; }
                Log(Dia(p) + "  ⚠️ ventana incompleta (" + enVentana + "/" + VELAS_VENTANA + "): se escribe igual");
            }

            string destino = Archivo(cfg, p.Dia);
            string tmp = destino + ".tmp";
            File.WriteAllText(tmp, sb.ToString(), new UTF8Encoding(false));
            if (File.Exists(destino)) File.Delete(tmp);          // otro pase lo escribió antes
            else File.Move(tmp, destino);

            JObject meta = new JObject();
            meta["instrumento"] = ins.FullName;
            meta["velas"] = n;
            meta["velas_del_dia"] = delDia;
            meta["velas_ventana"] = enVentana;
            meta["primera_utc"] = primera.ToString("yyyyMMdd HHmmss", inv);
            meta["ultima_utc"] = ultima.ToString("yyyyMMdd HHmmss", inv);
            meta["zona_ninjatrader"] = zonaNT.Id;
            meta["escrito"] = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", inv);
            File.WriteAllText(Path.Combine(cfg.Carpeta, p.Dia.ToString("yyyy-MM-dd", inv) + ".meta.json"), meta.ToString(), new UTF8Encoding(false));

            Log(Dia(p) + "  " + ins.FullName + " · " + n + " velas (" + delDia + " del día, " + enVentana + "/" + VELAS_VENTANA +
                " en la ventana) · " + primera.ToString("dd/MM HH:mm", inv) + " → " + ultima.ToString("dd/MM HH:mm", inv) + " UTC");
            return true;
        }

        // ── El puente ────────────────────────────────────────────────────────
        private static void LanzarPuente(Config cfg, string motivo)
        {
            if (!cfg.LanzarPuente) return;
            lock (candado) { if (puenteCorriendo) return; puenteCorriendo = true; }
            try
            {
                if (!File.Exists(cfg.Puente)) { Log("❌ no encuentro el puente: " + cfg.Puente); lock (candado) puenteCorriendo = false; return; }
                ProcessStartInfo psi = new ProcessStartInfo(cfg.Python, "\"" + cfg.Puente + "\" --pendientes")
                {
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    StandardOutputEncoding = Encoding.UTF8,
                    StandardErrorEncoding = Encoding.UTF8,
                    WorkingDirectory = Path.GetDirectoryName(cfg.Puente),
                };
                psi.EnvironmentVariables["PYTHONIOENCODING"] = "utf-8";
                Process pr = new Process { StartInfo = psi, EnableRaisingEvents = true };
                pr.OutputDataReceived += delegate (object s, DataReceivedEventArgs e) { if (!string.IsNullOrEmpty(e.Data)) Log("  puente · " + e.Data); };
                pr.ErrorDataReceived  += delegate (object s, DataReceivedEventArgs e) { if (!string.IsNullOrEmpty(e.Data)) Log("  puente ! " + e.Data); };
                pr.Exited += delegate
                {
                    try { Log("puente terminado (código " + pr.ExitCode + ")"); } catch { }
                    lock (candado) puenteCorriendo = false;
                    pr.Dispose();
                };
                Log("lanzo el puente (" + motivo + ")");
                pr.Start();
                pr.BeginOutputReadLine();
                pr.BeginErrorReadLine();
            }
            catch (Exception e)
            {
                Log("❌ no pude lanzar el puente: " + e.Message);
                lock (candado) puenteCorriendo = false;
            }
        }

        // ── Registro ─────────────────────────────────────────────────────────
        private static readonly object candadoLog = new object();

        private static string Dia(Pendiente p) { return p.Dia.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture); }

        private static void Log(string msg)
        {
            try
            {
                lock (candadoLog)
                {
                    string dir = Path.Combine(DirNT, "cadena-diaria");
                    Directory.CreateDirectory(dir);
                    File.AppendAllText(Path.Combine(dir, "registro.txt"),
                        DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture) + "  " + msg + "\r\n",
                        new UTF8Encoding(false));
                }
            }
            catch { }
        }
    }
}
