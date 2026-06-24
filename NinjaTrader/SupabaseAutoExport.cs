#region Using declarations
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using NinjaTrader.Cbi;
using NinjaTrader.NinjaScript;
using NinjaTrader.NinjaScript.Indicators;
#endregion

/*
 * SupabaseAutoExport — Indicador NinjaTrader 8
 *
 * Instalación:
 *   1. Copiar a: Documentos\NinjaTrader 8\bin\Custom\Indicators\
 *   2. NinjaScript Editor → compilar (F5)
 *   3. Agregar al gráfico de NQ/MNQ
 *   4. Una sola instancia en el gráfico de MNQ captura TODAS las cuentas
 *      seleccionadas (no hace falta una instancia por cuenta).
 *
 * Multi-cuenta + selección (v3.0 — 2026-06-17):
 *   - Una sola instancia monitorea varias cuentas a la vez, cada una con su
 *     propio estado de trade (no se mezclan trades simultáneos).
 *   - "Registrar todas las cuentas conectadas" (ON por defecto): registra todas.
 *     Si se apaga, registra solo las cuentas elegidas en los slots Cuenta 1..6.
 *   - Sigue filtrando por el instrumento del gráfico (una instancia por
 *     instrumento si se opera más de uno).
 *
 * Routing automático por nombre de cuenta:
 *   - Cuenta PA real (nombre empieza con "PA-"): trades → tabla `trades`
 *     + notificación Telegram. La app deriva sus días recientes desde `trades`.
 *   - Cualquier otra cuenta (evaluación): trades → tabla `apex_trades`, SIN
 *     Telegram. La app deriva días/balance/threshold desde estos trades.
 *
 * Comisiones (v2.4 — 2026-06-13):
 *   - "Comisión por lado": si NinjaTrader reporta comisión $0, configurar este
 *     valor por gráfico (NQ: 1.99, MNQ: 0.51). El indicador la calcula como
 *     qty × valor en cada fill y la descuenta del profit (NETO). Si es 0, usa
 *     la comisión que reporte NT (comportamiento previo).
 *
 * Fusión de contratos ATM:
 *   Cuando el ATM opera 2+ contratos por separado, cada contrato genera
 *   un ExecutionUpdate independiente. El indicador espera 3 segundos antes
 *   de publicar, acumulando todos los cierres del mismo instrumento y
 *   dirección en un único trade consolidado.
 *
 * P&L y comisiones (v2.2 — 2026-06-02):
 *   - commission = round-trip: suma la comisión de TODAS las patas del trade
 *     (entrada + salida + scaling). Antes solo capturaba la pata de salida.
 *   - profit = NETO: bruto en puntos menos la comisión round-trip, para
 *     alinear con la convención de los datos históricos importados por CSV.
 */

namespace NinjaTrader.NinjaScript.Indicators
{
    public class AccountNameConverter : TypeConverter
    {
        public override bool GetStandardValuesSupported(ITypeDescriptorContext context) => true;
        public override bool GetStandardValuesExclusive(ITypeDescriptorContext context) => true;

        public override StandardValuesCollection GetStandardValues(ITypeDescriptorContext context)
        {
            // Primer valor en blanco: permite dejar un slot "Cuenta N" sin usar.
            // Luego solo cuentas activas (conexión conectada).
            var names = new List<string> { string.Empty };
            lock (Account.All)
            {
                foreach (Account acc in Account.All)
                {
                    try
                    {
                        if (acc.Connection != null && acc.Connection.Status == ConnectionStatus.Connected)
                            names.Add(acc.Name);
                    }
                    catch { }
                }
            }
            // Fallback: si no hay ninguna conectada (p. ej. en diseño), mostrar todas
            if (names.Count == 1)
            {
                lock (Account.All)
                {
                    foreach (Account acc in Account.All)
                        names.Add(acc.Name);
                }
            }
            return new StandardValuesCollection(names);
        }
    }

    public class SupabaseAutoExport : Indicator
    {
        private const string SUPABASE_ENDPOINT =
            "https://jothoslozctflfrnysrx.supabase.co/rest/v1/trades";

        // Cuentas de evaluación de fondeo: tabla separada, sin notificación Telegram
        private const string APEX_ENDPOINT =
            "https://jothoslozctflfrnysrx.supabase.co/rest/v1/apex_trades";

        private const string NOTIFY_ENDPOINT =
            "https://trading-journal-bot.kristerock.workers.dev/notify";

        private const string NOTIFY_SECRET = "tj-notify-2026";

        // La service_role key vive en un archivo local (fuera del repo):
        //   Documentos\NinjaTrader 8\supabase-service-key.txt
        // Necesaria con RLS activado (Fase 2 del plan de seguridad). Ver SupabaseKeyFile.
        private string supabaseKey = string.Empty;

        private static string ReadServiceKey()
        {
            try
            {
                string path = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                    "NinjaTrader 8", "supabase-service-key.txt");
                if (File.Exists(path))
                    return File.ReadAllText(path).Trim().TrimStart('﻿').Trim();
            }
            catch { }
            return string.Empty;
        }

        // ── Estado de posición POR CUENTA ─────────────────────────────────────
        // Cada cuenta monitoreada lleva su propio trade abierto, para que operar
        // varias cuentas a la vez (mismo instrumento) no mezcle datos.
        private readonly object syncLock = new object();

        private class AcctState
        {
            public int      NetQty;
            public bool     InTrade;
            public bool     IsLong;
            public double   EntryPrice;
            public DateTime EntryTime;
            public int      TradeQty;
            public double   MaeExtreme;
            public double   MfeExtreme;
            public double   Commission;   // acumulado de todas las patas del trade abierto
        }
        private readonly Dictionary<string, AcctState> states =
            new Dictionary<string, AcctState>(StringComparer.OrdinalIgnoreCase);

        // ── Ventana de fusión ATM (3 segundos), un buffer por cuenta ──────────
        private readonly object mergeLock = new object();

        private class PendingTrade
        {
            public string   Instrument, Account, MarketPos, ExitName, TradeDate, Resultado;
            public int      Qty, Bars;
            public double   EntryPrice, ExitPrice, Profit, Commission, Mae, Mfe;
            public DateTime EntryTime, ExitTime;
            public Timer    Timer;
        }
        private readonly Dictionary<string, PendingTrade> pendingByAccount =
            new Dictionary<string, PendingTrade>(StringComparer.OrdinalIgnoreCase);

        private readonly List<Account> monitoredAccounts = new List<Account>();
        private HttpClient httpClient;

        [NinjaScriptProperty]
        [Display(Name = "Registrar todas las cuentas conectadas", Order = 1, GroupName = "Supabase Export",
                 Description = "ON: registra los trades de TODAS las cuentas conectadas. OFF: registra solo las cuentas elegidas abajo (Cuenta 1..6).")]
        public bool RegistrarTodas { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Comisión por lado", Order = 2, GroupName = "Supabase Export",
                 Description = "Comisión por contrato por lado. NQ: 1.99, MNQ: 0.51. Si es 0 usa la comisión que reporta NinjaTrader.")]
        public double CommissionPerSide { get; set; }

        [NinjaScriptProperty]
        [TypeConverter(typeof(AccountNameConverter))]
        [Display(Name = "Cuenta 1", Order = 1, GroupName = "Cuentas a registrar (si 'todas' está OFF)",
                 Description = "Cuenta a registrar. Dejar en blanco si no se usa.")]
        public string Cuenta1 { get; set; }

        [NinjaScriptProperty]
        [TypeConverter(typeof(AccountNameConverter))]
        [Display(Name = "Cuenta 2", Order = 2, GroupName = "Cuentas a registrar (si 'todas' está OFF)",
                 Description = "Opcional. Dejar en blanco si no se usa.")]
        public string Cuenta2 { get; set; }

        [NinjaScriptProperty]
        [TypeConverter(typeof(AccountNameConverter))]
        [Display(Name = "Cuenta 3", Order = 3, GroupName = "Cuentas a registrar (si 'todas' está OFF)",
                 Description = "Opcional. Dejar en blanco si no se usa.")]
        public string Cuenta3 { get; set; }

        [NinjaScriptProperty]
        [TypeConverter(typeof(AccountNameConverter))]
        [Display(Name = "Cuenta 4", Order = 4, GroupName = "Cuentas a registrar (si 'todas' está OFF)",
                 Description = "Opcional. Dejar en blanco si no se usa.")]
        public string Cuenta4 { get; set; }

        [NinjaScriptProperty]
        [TypeConverter(typeof(AccountNameConverter))]
        [Display(Name = "Cuenta 5", Order = 5, GroupName = "Cuentas a registrar (si 'todas' está OFF)",
                 Description = "Opcional. Dejar en blanco si no se usa.")]
        public string Cuenta5 { get; set; }

        [NinjaScriptProperty]
        [TypeConverter(typeof(AccountNameConverter))]
        [Display(Name = "Cuenta 6", Order = 6, GroupName = "Cuentas a registrar (si 'todas' está OFF)",
                 Description = "Opcional. Dejar en blanco si no se usa.")]
        public string Cuenta6 { get; set; }

        // Routing automático por nombre: la cuenta PA real empieza con "PA-" y va
        // al journal (trades) + Telegram; el resto a apex_trades sin notificar.
        private static bool EsCuentaEval(string account) =>
            !(account != null && account.StartsWith("PA-", StringComparison.OrdinalIgnoreCase));

        // Cuentas elegidas en los slots (no vacías)
        private IEnumerable<string> CuentasSeleccionadas()
        {
            foreach (var c in new[] { Cuenta1, Cuenta2, Cuenta3, Cuenta4, Cuenta5, Cuenta6 })
                if (!string.IsNullOrWhiteSpace(c)) yield return c;
        }

        // ¿Debe monitorear esta cuenta? Todas (si el toggle está ON) o las elegidas.
        private bool DebeMonitorear(string name)
        {
            if (RegistrarTodas) return true;
            foreach (var c in CuentasSeleccionadas())
                if (string.Equals(c, name, StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        }

        // Comisión de un fill: calculada por lado si se configuró, si no la de NT
        private double FillCommission(Execution ex) =>
            CommissionPerSide > 0 ? ex.Quantity * CommissionPerSide : ex.Commission;

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Description  = "Exporta trades cerrados automáticamente a Supabase Trading Journal";
                Name         = "SupabaseAutoExport";
                Calculate    = Calculate.OnBarClose;
                IsOverlay    = true;
                DisplayInDataBox         = false;
                DrawOnPricePanel         = false;
                IsSuspendedWhileInactive = false;
                RegistrarTodas    = true;
                Cuenta1 = Cuenta2 = Cuenta3 = Cuenta4 = Cuenta5 = Cuenta6 = string.Empty;
                CommissionPerSide = 0;
            }
            else if (State == State.Configure)
            {
                supabaseKey = ReadServiceKey();
                if (string.IsNullOrEmpty(supabaseKey))
                    Print("[SupabaseAutoExport] ⚠️ Falta la service_role key. Crea el archivo " +
                          "Documentos\\NinjaTrader 8\\supabase-service-key.txt con la key. " +
                          "Sin ella no se exportarán trades con RLS activado.");
                else
                    Print("[SupabaseAutoExport] service_role cargada (" + supabaseKey.Length +
                          " chars, termina en ..." +
                          supabaseKey.Substring(Math.Max(0, supabaseKey.Length - 4)) + ").");

                httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("apikey",        supabaseKey);
                httpClient.DefaultRequestHeaders.Add("Authorization", "Bearer " + supabaseKey);
                httpClient.DefaultRequestHeaders.Add("Prefer",        "return=minimal");
            }
            else if (State == State.DataLoaded)
            {
                lock (Account.All)
                {
                    foreach (Account acc in Account.All)
                    {
                        if (DebeMonitorear(acc.Name))
                        {
                            monitoredAccounts.Add(acc);
                            acc.ExecutionUpdate += OnAccountExecutionUpdate;
                        }
                    }
                }
            }
            else if (State == State.Terminated)
            {
                foreach (Account acc in monitoredAccounts)
                {
                    try { acc.ExecutionUpdate -= OnAccountExecutionUpdate; } catch { }
                }
                monitoredAccounts.Clear();

                // Publicar cualquier trade pendiente (de cualquier cuenta) antes de terminar
                List<string> cuentas;
                lock (mergeLock) { cuentas = new List<string>(pendingByAccount.Keys); }
                foreach (var c in cuentas) FlushAccount(c);

                httpClient?.Dispose();
                httpClient = null;
            }
        }

        protected override void OnBarUpdate()
        {
            lock (syncLock)
            {
                foreach (var st in states.Values)
                {
                    if (!st.InTrade) continue;
                    if (st.IsLong)
                    {
                        if (Low[0]  < st.MaeExtreme) st.MaeExtreme = Low[0];
                        if (High[0] > st.MfeExtreme) st.MfeExtreme = High[0];
                    }
                    else
                    {
                        if (High[0] > st.MaeExtreme) st.MaeExtreme = High[0];
                        if (Low[0]  < st.MfeExtreme) st.MfeExtreme = Low[0];
                    }
                }
            }
        }

        private void OnAccountExecutionUpdate(object sender, ExecutionEventArgs e)
        {
            try
            {
                Execution ex = e.Execution;

                if (ex.Instrument == null || ex.Instrument.FullName != Instrument.FullName)
                    return;

                if (ex.Order == null) return;

                string acctName = ex.Account != null ? ex.Account.Name : (sender as Account)?.Name;
                if (string.IsNullOrEmpty(acctName)) return;

                int qtyDelta;
                switch (ex.Order.OrderAction)
                {
                    case OrderAction.Buy:
                    case OrderAction.BuyToCover:
                        qtyDelta = +ex.Quantity;
                        break;
                    case OrderAction.Sell:
                    case OrderAction.SellShort:
                        qtyDelta = -ex.Quantity;
                        break;
                    default:
                        return;
                }

                bool shouldPost = false;

                double   postEntryPrice = 0, postExitPrice = 0;
                double   postMae = 0, postMfe = 0;
                DateTime postEntryTime = DateTime.MinValue, postExitTime = DateTime.MinValue;
                string   postExitName = string.Empty;
                string   postInstrument = Instrument.FullName;
                string   postAccount    = acctName;
                string   postMarketPos  = string.Empty;
                int      postQty = 0;
                double   postProfit = 0;
                double   postCommission = 0;

                lock (syncLock)
                {
                    AcctState st;
                    if (!states.TryGetValue(acctName, out st))
                    {
                        st = new AcctState();
                        states[acctName] = st;
                    }

                    int prevQty = st.NetQty;
                    st.NetQty += qtyDelta;

                    if (prevQty == 0 && st.NetQty != 0)
                    {
                        // Apertura de un nuevo trade
                        st.IsLong     = st.NetQty > 0;
                        st.EntryPrice = ex.Price;
                        st.EntryTime  = ex.Time;
                        st.TradeQty   = Math.Abs(st.NetQty);
                        st.MaeExtreme = ex.Price;
                        st.MfeExtreme = ex.Price;
                        st.InTrade    = true;
                        st.Commission = FillCommission(ex);   // comisión de la pata de entrada
                    }
                    else if (st.InTrade && Math.Sign(st.NetQty) == Math.Sign(prevQty) && Math.Abs(st.NetQty) > Math.Abs(prevQty))
                    {
                        // Scaling in — sumar comisión y actualizar qty al máximo alcanzado
                        st.Commission += FillCommission(ex);
                        st.TradeQty = Math.Abs(st.NetQty);
                    }
                    else if (prevQty != 0 && st.NetQty == 0)
                    {
                        // Cierre total del trade
                        st.InTrade = false;
                        st.Commission += FillCommission(ex);   // comisión de la pata de salida

                        postEntryPrice = st.EntryPrice;
                        postExitPrice  = ex.Price;
                        postEntryTime  = st.EntryTime;
                        postExitTime   = ex.Time;
                        postExitName   = ex.Name ?? ex.Order.Name ?? string.Empty;
                        postMarketPos  = st.IsLong ? "Long" : "Short";
                        postQty        = st.TradeQty;

                        double pointValue   = Instrument.MasterInstrument.PointValue;
                        double profitPoints = st.IsLong
                            ? postExitPrice - postEntryPrice
                            : postEntryPrice - postExitPrice;
                        double grossProfit  = profitPoints * pointValue * postQty;

                        // Comisión round-trip (todas las patas) y profit NETO,
                        // alineado con la convención de los datos históricos.
                        postCommission = Math.Round(st.Commission, 2);
                        postProfit     = Math.Round(grossProfit - postCommission, 2);

                        postMae = st.IsLong
                            ? Math.Max(0, postEntryPrice - st.MaeExtreme)
                            : Math.Max(0, st.MaeExtreme  - postEntryPrice);
                        postMfe = st.IsLong
                            ? Math.Max(0, st.MfeExtreme  - postEntryPrice)
                            : Math.Max(0, postEntryPrice - st.MfeExtreme);

                        postMae = Math.Round(postMae * pointValue * postQty, 2);
                        postMfe = Math.Round(postMfe * pointValue * postQty, 2);

                        shouldPost = true;
                    }
                    else if (st.InTrade)
                    {
                        // Cierre parcial u otra ejecución dentro del trade — acumular comisión
                        st.Commission += FillCommission(ex);
                    }
                }

                if (shouldPost)
                {
                    int    bars      = (int)Math.Max(1, Math.Round((postExitTime - postEntryTime).TotalMinutes));
                    string tradeDate = postExitTime.ToString("yyyy-MM-dd");
                    string resultado =
                        postExitName.IndexOf("Target", StringComparison.OrdinalIgnoreCase) >= 0 ? "target" :
                        postExitName.IndexOf("Stop",   StringComparison.OrdinalIgnoreCase) >= 0 ? "stop"   :
                        "otro";

                    lock (mergeLock)
                    {
                        PendingTrade p;
                        pendingByAccount.TryGetValue(postAccount, out p);

                        bool merged = false;
                        if (p != null &&
                            p.MarketPos  == postMarketPos  &&
                            p.Instrument == postInstrument &&
                            (postEntryTime - p.EntryTime).TotalSeconds <= 30)
                        {
                            // Fusionar con el trade pendiente de esta cuenta
                            p.Timer?.Change(Timeout.Infinite, Timeout.Infinite);
                            int totalQty = p.Qty + postQty;
                            p.EntryPrice = (p.EntryPrice * p.Qty + postEntryPrice * postQty) / totalQty;
                            p.ExitPrice  = (p.ExitPrice  * p.Qty + postExitPrice  * postQty) / totalQty;
                            p.Qty        = totalQty;
                            p.Profit    += postProfit;
                            p.Commission += postCommission;
                            p.Mae       += postMae;
                            p.Mfe       += postMfe;
                            p.ExitTime   = postExitTime > p.ExitTime ? postExitTime : p.ExitTime;
                            p.Bars       = Math.Max(p.Bars, bars);
                            if (p.Resultado != resultado) p.Resultado = "otro";
                            merged = true;
                        }

                        if (!merged)
                        {
                            // Publicar el pendiente anterior de esta cuenta si existe
                            if (p != null)
                            {
                                p.Timer?.Change(Timeout.Infinite, Timeout.Infinite);
                                p.Timer?.Dispose();
                                PostPending(p);
                            }

                            // Guardar el nuevo trade como pendiente de esta cuenta
                            p = new PendingTrade
                            {
                                Instrument = postInstrument, Account = postAccount,
                                MarketPos  = postMarketPos,  Qty = postQty,
                                EntryPrice = postEntryPrice, ExitPrice = postExitPrice,
                                EntryTime  = postEntryTime,  ExitTime = postExitTime,
                                ExitName   = postExitName,   Profit = postProfit,
                                Commission = postCommission, Mae = postMae, Mfe = postMfe,
                                Bars = bars, TradeDate = tradeDate, Resultado = resultado
                            };
                            pendingByAccount[postAccount] = p;
                        }

                        // (Re)iniciar timer de 3 segundos de esta cuenta
                        if (p.Timer == null)
                            p.Timer = new Timer(OnMergeTimer, postAccount, 3000, Timeout.Infinite);
                        else
                            p.Timer.Change(3000, Timeout.Infinite);
                    }
                }
            }
            catch { }
        }

        // Callback del timer de fusión: publica el pendiente de esa cuenta.
        private void OnMergeTimer(object state) => FlushAccount(state as string);

        // Saca el pendiente de una cuenta del buffer y lo publica.
        private void FlushAccount(string account)
        {
            if (account == null) return;
            PendingTrade p;
            lock (mergeLock)
            {
                if (!pendingByAccount.TryGetValue(account, out p) || p == null) return;
                pendingByAccount.Remove(account);
                p.Timer?.Change(Timeout.Infinite, Timeout.Infinite);
                p.Timer?.Dispose();
            }
            PostPending(p);
        }

        // Publica un trade: a `trades`+Telegram si es PA, o a `apex_trades` si no.
        private void PostPending(PendingTrade p)
        {
            if (p == null) return;

            Task.Run(() => PostTradeAsync(
                p.Instrument, p.Account, p.MarketPos, p.Qty,
                p.EntryPrice, p.ExitPrice, p.EntryTime, p.ExitTime, p.ExitName,
                p.Profit, p.Commission, p.Mae, p.Mfe, p.Bars, p.TradeDate, p.Resultado));

            // Las cuentas de evaluación no notifican por Telegram (solo la PA real)
            if (!EsCuentaEval(p.Account))
                Task.Run(() => SendNotificationAsync(
                    p.Instrument, p.MarketPos, p.Qty,
                    p.EntryPrice, p.ExitPrice, p.Profit, p.Commission, p.Mae, p.Mfe, p.Resultado));
        }

        private async Task PostTradeAsync(
            string instrument, string account, string marketPos, int qty,
            double entryPrice, double exitPrice,
            DateTime entryTime, DateTime exitTime,
            string exitName,
            double profit, double commission, double mae, double mfe,
            int bars, string tradeDate, string resultado)
        {
            try
            {
                HttpClient client = httpClient;
                if (client == null) return;

                double etd = Math.Round(mfe - profit, 2);
                string json = string.Format(
                    System.Globalization.CultureInfo.InvariantCulture,
                    "{{" +
                    "\"instrument\":\"{0}\"," +
                    "\"account\":\"{1}\","    +
                    "\"market_pos\":\"{2}\"," +
                    "\"qty\":{3},"            +
                    "\"entry_price\":{4},"    +
                    "\"exit_price\":{5},"     +
                    "\"entry_time\":\"{6}\"," +
                    "\"exit_time\":\"{7}\","  +
                    "\"exit_name\":\"{8}\","  +
                    "\"profit\":{9},"         +
                    "\"commission\":{16},"    +
                    "\"mae\":{10},"           +
                    "\"mfe\":{11},"           +
                    "\"etd\":{12},"           +
                    "\"bars\":{13},"          +
                    "\"trade_date\":\"{14}\"," +
                    "\"resultado\":\"{15}\""  +
                    "}}",
                    Esc(instrument), Esc(account), marketPos, qty,
                    entryPrice, exitPrice,
                    entryTime.ToString("HH:mm:ss"),
                    exitTime.ToString("HH:mm:ss"),
                    Esc(exitName),
                    profit, mae, mfe,
                    etd, bars, tradeDate, resultado, commission
                );

                var content = new StringContent(json, Encoding.UTF8, "application/json");
                string endpoint = EsCuentaEval(account) ? APEX_ENDPOINT : SUPABASE_ENDPOINT;
                var resp = await client.PostAsync(endpoint, content);
                if (!resp.IsSuccessStatusCode)
                {
                    string body = "";
                    try { body = await resp.Content.ReadAsStringAsync(); } catch { }
                    Print("[SupabaseAutoExport] ⚠️ Supabase rechazó el trade (HTTP " +
                          (int)resp.StatusCode + "): " + body);
                }
            }
            catch (Exception ex) { Print("[SupabaseAutoExport] ⚠️ Error al enviar trade: " + ex.Message); }
        }

        private async Task SendNotificationAsync(
            string instrument, string marketPos, int qty,
            double entryPrice, double exitPrice,
            double profit, double commission, double mae, double mfe,
            string resultado)
        {
            try
            {
                HttpClient client = httpClient;
                if (client == null) return;

                string json = string.Format(
                    System.Globalization.CultureInfo.InvariantCulture,
                    "{{" +
                    "\"instrument\":\"{0}\"," +
                    "\"market_pos\":\"{1}\"," +
                    "\"qty\":{2},"            +
                    "\"entry_price\":{3},"    +
                    "\"exit_price\":{4},"     +
                    "\"profit\":{5},"         +
                    "\"commission\":{6},"     +
                    "\"mae\":{7},"            +
                    "\"mfe\":{8},"            +
                    "\"resultado\":\"{9}\""   +
                    "}}",
                    Esc(instrument), marketPos, qty,
                    entryPrice, exitPrice,
                    profit, commission, mae, mfe,
                    resultado
                );

                var req = new HttpRequestMessage(HttpMethod.Post, NOTIFY_ENDPOINT);
                req.Headers.Add("X-Notify-Token", NOTIFY_SECRET);
                req.Content = new StringContent(json, Encoding.UTF8, "application/json");
                await client.SendAsync(req);
            }
            catch { }
        }

        private static string Esc(string s) =>
            s.Replace("\\", "\\\\").Replace("\"", "\\\"");
    }
}
