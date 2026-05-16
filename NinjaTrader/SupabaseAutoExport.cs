#region Using declarations
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Net.Http;
using System.Text;
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
 */

namespace NinjaTrader.NinjaScript.Indicators
{
    // Dropdown con las cuentas disponibles en NT8
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

        private const string NOTIFY_ENDPOINT =
            "https://trading-journal-bot.kristerock.workers.dev/notify";

        private const string NOTIFY_SECRET = "tj-notify-2026"; // mismo valor que NOTIFY_SECRET en Cloudflare Worker #2

        private const string SUPABASE_KEY =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdGhvc2xvemN0Zmxmcm55c3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODQ1MTMsImV4cCI6MjA5Mzk2MDUxM30.8perbSMHaE2K73aRU2NjfrUsWgbwmm2lL2dA-e2CG18";

        private readonly object syncLock = new object();
        private bool     inTrade;
        private double   entryPrice;
        private DateTime entryTime;
        private int      tradeQty;
        private bool     isLong;
        private double   maeExtreme;
        private double   mfeExtreme;
        private int      netQty;

        private Account    monitoredAccount;
        private HttpClient httpClient;

        [NinjaScriptProperty]
        [TypeConverter(typeof(AccountNameConverter))]
        [Display(Name = "Account Name", Order = 1, GroupName = "Supabase Export",
                 Description = "Seleccionar la cuenta a monitorear")]
        public string AccountName { get; set; }

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

                lock (syncLock)
                {
                    int prevQty = netQty;
                    netQty += qtyDelta;

                    if (prevQty == 0 && netQty != 0)
                    {
                        isLong       = netQty > 0;
                        entryPrice   = ex.Price;
                        entryTime    = ex.Time;
                        tradeQty     = Math.Abs(netQty);
                        maeExtreme   = ex.Price;
                        mfeExtreme   = ex.Price;
                        inTrade      = true;
                    }
                    else if (prevQty != 0 && netQty == 0)
                    {
                        inTrade = false;

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
                        postProfit = Math.Round(profitPoints * pointValue * postQty, 2);

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
                }

                if (shouldPost)
                {
                    int    bars      = (int)Math.Max(1, Math.Round((postExitTime - postEntryTime).TotalMinutes));
                    string tradeDate = postExitTime.ToString("yyyy-MM-dd");
                    string resultado =
                        postExitName.IndexOf("Target", StringComparison.OrdinalIgnoreCase) >= 0 ? "target" :
                        postExitName.IndexOf("Stop",   StringComparison.OrdinalIgnoreCase) >= 0 ? "stop"   :
                        "otro";

                    Task.Run(() => PostTradeAsync(
                        postInstrument, postAccount, postMarketPos, postQty,
                        postEntryPrice, postExitPrice,
                        postEntryTime, postExitTime,
                        postExitName,
                        postProfit, postMae, postMfe,
                        bars, tradeDate, resultado
                    ));

                    Task.Run(() => SendNotificationAsync(
                        postInstrument, postMarketPos, postQty,
                        postEntryPrice, postExitPrice,
                        postProfit, postMae, postMfe,
                        resultado
                    ));
                }
            }
            catch { }
        }

        private async Task PostTradeAsync(
            string instrument, string account, string marketPos, int qty,
            double entryPrice, double exitPrice,
            DateTime entryTime, DateTime exitTime,
            string exitName,
            double profit, double mae, double mfe,
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
                    "\"commission\":0,"       +
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
                    etd, bars, tradeDate, resultado
                );

                var content  = new StringContent(json, Encoding.UTF8, "application/json");
                await client.PostAsync(SUPABASE_ENDPOINT, content);
            }
            catch { }
        }

        private async Task SendNotificationAsync(
            string instrument, string marketPos, int qty,
            double entryPrice, double exitPrice,
            double profit, double mae, double mfe,
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
                    "\"mae\":{6},"            +
                    "\"mfe\":{7},"            +
                    "\"resultado\":\"{8}\""   +
                    "}}",
                    Esc(instrument), marketPos, qty,
                    entryPrice, exitPrice,
                    profit, mae, mfe,
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
