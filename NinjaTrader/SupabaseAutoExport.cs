#region Using declarations
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
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
 *   4. Seleccionar la cuenta en el dropdown "Account Name"
 *   5. Para cuentas de evaluación de fondeo: marcar "Cuenta de evaluación Apex"
 *
 * Routing por cuenta (v2.3 — 2026-06-13):
 *   - PA real (checkbox OFF): trades → tabla `trades` + notificación Telegram.
 *   - Evaluación Apex (checkbox ON): trades → tabla `apex_trades`, SIN Telegram.
 *     La app deriva días/balance/threshold automáticamente desde estos trades.
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
            var names = new List<string>();
            lock (Account.All)
            {
                foreach (Account acc in Account.All)
                    names.Add(acc.Name);
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

        private const string SUPABASE_KEY =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdGhvc2xvemN0Zmxmcm55c3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODQ1MTMsImV4cCI6MjA5Mzk2MDUxM30.8perbSMHaE2K73aRU2NjfrUsWgbwmm2lL2dA-e2CG18";

        // ── Estado de posición ────────────────────────────────────────────────
        private readonly object syncLock = new object();
        private bool     inTrade;
        private double   entryPrice;
        private DateTime entryTime;
        private int      tradeQty;
        private bool     isLong;
        private double   maeExtreme;
        private double   mfeExtreme;
        private int      netQty;
        private double   tradeCommission;   // acumulado de todas las patas (entrada + salida + scaling)

        // ── Ventana de fusión ATM (3 segundos) ───────────────────────────────
        private readonly object mergeLock = new object();
        private Timer    mergeTimer;
        private bool     hasPending;

        private string   pendingInstrument;
        private string   pendingAccount;
        private string   pendingMarketPos;
        private int      pendingQty;
        private double   pendingEntryPrice;   // promedio ponderado
        private double   pendingExitPrice;    // promedio ponderado
        private DateTime pendingEntryTime;
        private DateTime pendingExitTime;
        private string   pendingExitName;
        private double   pendingProfit;       // suma
        private double   pendingCommission;   // suma
        private double   pendingMae;          // suma
        private double   pendingMfe;          // suma
        private int      pendingBars;
        private string   pendingTradeDate;
        private string   pendingResultado;

        private Account    monitoredAccount;
        private HttpClient httpClient;

        [NinjaScriptProperty]
        [TypeConverter(typeof(AccountNameConverter))]
        [Display(Name = "Account Name", Order = 1, GroupName = "Supabase Export",
                 Description = "Seleccionar la cuenta a monitorear")]
        public string AccountName { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Cuenta de evaluación Apex", Order = 2, GroupName = "Supabase Export",
                 Description = "Si está marcado, los trades van a apex_trades (Apex Tracker) y NO notifican por Telegram")]
        public bool ApexEvalAccount { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Comisión por lado", Order = 3, GroupName = "Supabase Export",
                 Description = "Comisión por contrato por lado. NQ: 1.99, MNQ: 0.51. Si es 0 usa la comisión que reporta NinjaTrader.")]
        public double CommissionPerSide { get; set; }

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
                AccountName  = string.Empty;
                ApexEvalAccount = false;
                CommissionPerSide = 0;
            }
            else if (State == State.Configure)
            {
                httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("apikey",        SUPABASE_KEY);
                httpClient.DefaultRequestHeaders.Add("Authorization", "Bearer " + SUPABASE_KEY);
                httpClient.DefaultRequestHeaders.Add("Prefer",        "return=minimal");
            }
            else if (State == State.DataLoaded)
            {
                lock (Account.All)
                {
                    foreach (Account acc in Account.All)
                    {
                        if (acc.Name == AccountName)
                        {
                            monitoredAccount = acc;
                            break;
                        }
                    }
                }

                if (monitoredAccount != null)
                    monitoredAccount.ExecutionUpdate += OnAccountExecutionUpdate;
            }
            else if (State == State.Terminated)
            {
                if (monitoredAccount != null)
                {
                    monitoredAccount.ExecutionUpdate -= OnAccountExecutionUpdate;
                    monitoredAccount = null;
                }

                // Publicar cualquier trade pendiente antes de terminar
                lock (mergeLock)
                {
                    mergeTimer?.Change(Timeout.Infinite, Timeout.Infinite);
                    mergeTimer?.Dispose();
                    mergeTimer = null;
                }
                FlushPendingTrade(null);

                httpClient?.Dispose();
                httpClient = null;
            }
        }

        protected override void OnBarUpdate()
        {
            lock (syncLock)
            {
                if (!inTrade) return;

                if (isLong)
                {
                    if (Low[0]  < maeExtreme) maeExtreme = Low[0];
                    if (High[0] > mfeExtreme) mfeExtreme = High[0];
                }
                else
                {
                    if (High[0] > maeExtreme) maeExtreme = High[0];
                    if (Low[0]  < mfeExtreme) mfeExtreme = Low[0];
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
                string   postAccount    = AccountName;
                string   postMarketPos  = string.Empty;
                int      postQty = 0;
                double   postProfit = 0;
                double   postCommission = 0;

                lock (syncLock)
                {
                    int prevQty = netQty;
                    netQty += qtyDelta;

                    if (prevQty == 0 && netQty != 0)
                    {
                        // Apertura de un nuevo trade
                        isLong          = netQty > 0;
                        entryPrice      = ex.Price;
                        entryTime       = ex.Time;
                        tradeQty        = Math.Abs(netQty);
                        maeExtreme      = ex.Price;
                        mfeExtreme      = ex.Price;
                        inTrade         = true;
                        tradeCommission = FillCommission(ex);   // comisión de la pata de entrada
                    }
                    else if (inTrade && Math.Sign(netQty) == Math.Sign(prevQty) && Math.Abs(netQty) > Math.Abs(prevQty))
                    {
                        // Scaling in — sumar comisión y actualizar qty al máximo alcanzado
                        tradeCommission += FillCommission(ex);
                        tradeQty = Math.Abs(netQty);
                    }
                    else if (prevQty != 0 && netQty == 0)
                    {
                        // Cierre total del trade
                        inTrade = false;
                        tradeCommission += FillCommission(ex);   // comisión de la pata de salida

                        postEntryPrice = entryPrice;
                        postExitPrice  = ex.Price;
                        postEntryTime  = entryTime;
                        postExitTime   = ex.Time;
                        postExitName   = ex.Name ?? ex.Order.Name ?? string.Empty;
                        postMarketPos  = isLong ? "Long" : "Short";
                        postQty        = tradeQty;

                        double pointValue   = Instrument.MasterInstrument.PointValue;
                        double profitPoints = isLong
                            ? postExitPrice - postEntryPrice
                            : postEntryPrice - postExitPrice;
                        double grossProfit  = profitPoints * pointValue * postQty;

                        // Comisión round-trip (todas las patas) y profit NETO,
                        // alineado con la convención de los datos históricos.
                        postCommission = Math.Round(tradeCommission, 2);
                        postProfit     = Math.Round(grossProfit - postCommission, 2);

                        postMae = isLong
                            ? Math.Max(0, postEntryPrice - maeExtreme)
                            : Math.Max(0, maeExtreme     - postEntryPrice);
                        postMfe = isLong
                            ? Math.Max(0, mfeExtreme     - postEntryPrice)
                            : Math.Max(0, postEntryPrice - mfeExtreme);

                        postMae = Math.Round(postMae * pointValue * postQty, 2);
                        postMfe = Math.Round(postMfe * pointValue * postQty, 2);

                        shouldPost = true;
                    }
                    else if (inTrade)
                    {
                        // Cierre parcial u otra ejecución dentro del trade — acumular comisión
                        tradeCommission += FillCommission(ex);
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
                        // Cancelar el timer actual mientras decidimos
                        mergeTimer?.Change(Timeout.Infinite, Timeout.Infinite);

                        bool merged = false;
                        if (hasPending &&
                            pendingMarketPos   == postMarketPos   &&
                            pendingInstrument  == postInstrument  &&
                            pendingAccount     == postAccount     &&
                            (postEntryTime - pendingEntryTime).TotalSeconds <= 30)
                        {
                            // Fusionar con el trade pendiente
                            int totalQty = pendingQty + postQty;
                            pendingEntryPrice = (pendingEntryPrice * pendingQty + postEntryPrice * postQty) / totalQty;
                            pendingExitPrice  = (pendingExitPrice  * pendingQty + postExitPrice  * postQty) / totalQty;
                            pendingQty        = totalQty;
                            pendingProfit    += postProfit;
                            pendingCommission += postCommission;
                            pendingMae       += postMae;
                            pendingMfe       += postMfe;
                            pendingExitTime   = postExitTime > pendingExitTime ? postExitTime : pendingExitTime;
                            pendingBars       = Math.Max(pendingBars, bars);
                            if (pendingResultado != resultado) pendingResultado = "otro";
                            merged = true;
                        }

                        if (!merged)
                        {
                            // Publicar el pendiente anterior si existe
                            if (hasPending) FlushPendingTrade(null);

                            // Guardar el nuevo trade como pendiente
                            hasPending        = true;
                            pendingInstrument = postInstrument;
                            pendingAccount    = postAccount;
                            pendingMarketPos  = postMarketPos;
                            pendingQty        = postQty;
                            pendingEntryPrice = postEntryPrice;
                            pendingExitPrice  = postExitPrice;
                            pendingEntryTime  = postEntryTime;
                            pendingExitTime   = postExitTime;
                            pendingExitName   = postExitName;
                            pendingProfit     = postProfit;
                            pendingCommission = postCommission;
                            pendingMae        = postMae;
                            pendingMfe        = postMfe;
                            pendingBars       = bars;
                            pendingTradeDate  = tradeDate;
                            pendingResultado  = resultado;
                        }

                        // Reiniciar timer de 3 segundos
                        if (mergeTimer == null)
                            mergeTimer = new Timer(FlushPendingTrade, null, 3000, Timeout.Infinite);
                        else
                            mergeTimer.Change(3000, Timeout.Infinite);
                    }
                }
            }
            catch { }
        }

        private void FlushPendingTrade(object state)
        {
            string instrument, account, marketPos, exitName, tradeDate, resultado;
            int qty, bars;
            double entryPrc, exitPrc, profit, commission, mae, mfe;
            DateTime entryT, exitT;

            lock (mergeLock)
            {
                if (!hasPending) return;

                instrument = pendingInstrument;
                account    = pendingAccount;
                marketPos  = pendingMarketPos;
                qty        = pendingQty;
                entryPrc   = pendingEntryPrice;
                exitPrc    = pendingExitPrice;
                entryT     = pendingEntryTime;
                exitT      = pendingExitTime;
                exitName   = pendingExitName;
                profit     = pendingProfit;
                commission = pendingCommission;
                mae        = pendingMae;
                mfe        = pendingMfe;
                bars       = pendingBars;
                tradeDate  = pendingTradeDate;
                resultado  = pendingResultado;
                hasPending = false;
            }

            Task.Run(() => PostTradeAsync(
                instrument, account, marketPos, qty,
                entryPrc, exitPrc, entryT, exitT, exitName,
                profit, commission, mae, mfe, bars, tradeDate, resultado));

            // Las cuentas de evaluación no notifican por Telegram (solo la PA real)
            if (!ApexEvalAccount)
                Task.Run(() => SendNotificationAsync(
                    instrument, marketPos, qty,
                    entryPrc, exitPrc, profit, commission, mae, mfe, resultado));
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
                string endpoint = ApexEvalAccount ? APEX_ENDPOINT : SUPABASE_ENDPOINT;
                await client.PostAsync(endpoint, content);
            }
            catch { }
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
