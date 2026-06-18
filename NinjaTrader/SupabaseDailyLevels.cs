#region Using declarations
using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using NinjaTrader.Cbi;
using NinjaTrader.Data;
using NinjaTrader.NinjaScript;
#endregion

/*
 * SupabaseDailyLevels — Indicador NinjaTrader 8 (v1.2 — 2026-06-18)
 *
 * Calcula automáticamente los niveles de referencia del día y los sube a la
 * sesión de hoy en Supabase, para no tener que escribirlos a mano:
 *   - PDO / PDH / PDL / PDC  → OHLC RTH (cash) de AYER (ya completa)
 *   - ONH / ONL              → máx/mín del overnight (sesión ETH antes del open)
 *   - Apertura de hoy        → open RTH de HOY
 *
 * v1.2: añade ONH/ONL usando una segunda serie diaria con la sesión ETH/Globex
 *   (su máx/mín antes de la apertura RTH = el overnight). Se guardan en
 *   precio_max_pre / precio_min_pre.
 *
 * Cómo lo hace:
 *   Añade una serie DIARIA con la plantilla de horario del parámetro
 *   "Plantilla de horario (sesión)" — por defecto "US Equities RTH" (cash
 *   9:30–16:00 ET) — así el OHLC diario corresponde a esa sesión,
 *   independientemente de la plantilla del gráfico. En la apertura de hoy se
 *   forma un nuevo bar diario: ayer queda en [1][1] y hoy en [1][0]. Hace un
 *   UPSERT a `sesiones` por `sesion_date` (solo toca estas columnas; no pisa
 *   el resto de la sesión). El formulario sigue editable como respaldo.
 *
 *   Las plantillas RTH y ETH son configurables desde los parámetros del
 *   indicador. El horario se aplica con AddDataSeries(string, BarsPeriod,
 *   tradingHoursName).
 *
 * Instalación:
 *   1. Copiar a: Documentos\NinjaTrader 8\bin\Custom\Indicators\
 *   2. NinjaScript Editor → compilar (F5)
 *   3. Agregarlo UNA vez al gráfico de MNQ (junto al SupabaseAutoExport).
 *
 * Verificación: contrastar los valores contra el indicador nativo PriorDayOHLC.
 *
 * Requisitos en BD: las columnas precio_apertura_ayer/max_ayer/min_ayer/
 *   cierre_ayer/apertura, y una restricción UNIQUE en sesiones(sesion_date)
 *   para que el upsert funcione (ver migración 2026-06-17-sesiones-unique-date.sql).
 */

namespace NinjaTrader.NinjaScript.Indicators
{
    public class SupabaseDailyLevels : Indicator
    {
        private const string SESIONES_ENDPOINT =
            "https://jothoslozctflfrnysrx.supabase.co/rest/v1/sesiones";

        private const string SUPABASE_KEY =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdGhvc2xvemN0Zmxmcm55c3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODQ1MTMsImV4cCI6MjA5Mzk2MDUxM30.8perbSMHaE2K73aRU2NjfrUsWgbwmm2lL2dA-e2CG18";

        private HttpClient httpClient;
        private int        lastDailyBar = -1;

        // Overnight (ONH/ONL): se acumula sobre la serie ETH [2] mientras no haya
        // abierto el RTH del día; se congela al abrir RTH.
        private double onHigh = double.NaN, onLow = double.NaN;
        private int    lastEthBar = -1;
        private bool   rthOpened;

        // Plantilla de horario que define la sesión RTH (cash) del OHLC de ayer.
        // Por defecto "US Equities RTH" (9:30–16:00 ET). Si tus niveles no cuadran,
        // prueba "CME US Index Futures RTH" desde los parámetros (sin recompilar).
        // Debe coincidir EXACTO con un nombre de la lista de Trading Hours.
        [NinjaScriptProperty]
        [Display(Name = "Plantilla RTH (sesión cash)", Order = 1, GroupName = "Niveles",
                 Description = "Sesión para PDO/PDH/PDL/PDC + apertura. RTH cash = 'US Equities RTH'. Alterna a 'CME US Index Futures RTH' si no cuadra.")]
        public string RthTemplate { get; set; }

        // Plantilla de la sesión completa Globex/ETH, para calcular el overnight
        // (ONH/ONL = máx/mín desde que abre el ETH en la tarde hasta el open RTH).
        [NinjaScriptProperty]
        [Display(Name = "Plantilla ETH (overnight)", Order = 2, GroupName = "Niveles",
                 Description = "Sesión Globex/ETH para el overnight (ONH/ONL). Por defecto 'CME US Index Futures ETH'.")]
        public string EthTemplate { get; set; }

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Description = "Sube los niveles de referencia del día (OHLC de ayer + apertura) a Supabase";
                Name        = "SupabaseDailyLevels";
                Calculate   = Calculate.OnPriceChange;
                IsOverlay   = true;
                DisplayInDataBox         = false;
                DrawOnPricePanel         = false;
                IsSuspendedWhileInactive = false;
                RthTemplate              = "US Equities RTH";
                EthTemplate              = "CME US Index Futures ETH";
            }
            else if (State == State.Configure)
            {
                // [1] serie diaria RTH (cash) → PDO/PDH/PDL/PDC + apertura.
                // [2] serie diaria ETH (Globex) → overnight (ONH/ONL).
                // Overload (string, BarsPeriod, string tradingHoursName): aplica la
                // plantilla de horario a cada serie.
                AddDataSeries(Instrument.FullName,
                    new BarsPeriod { BarsPeriodType = BarsPeriodType.Day, Value = 1 },
                    RthTemplate);
                AddDataSeries(Instrument.FullName,
                    new BarsPeriod { BarsPeriodType = BarsPeriodType.Day, Value = 1 },
                    EthTemplate);

                httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("apikey",        SUPABASE_KEY);
                httpClient.DefaultRequestHeaders.Add("Authorization", "Bearer " + SUPABASE_KEY);
            }
            else if (State == State.Terminated)
            {
                httpClient?.Dispose();
                httpClient = null;
            }
        }

        protected override void OnBarUpdate()
        {
            // [2] ETH diaria: mantener máx/mín del overnight. El bar ETH empieza en
            // la tarde (Globex); mientras NO haya abierto el RTH del día, su máx/mín
            // es el overnight. (Corre también en histórico para tener el dato al
            // arrancar a mitad de la noche.)
            if (BarsInProgress == 2)
            {
                if (CurrentBars[2] != lastEthBar)
                {
                    lastEthBar = CurrentBars[2];
                    onHigh = Highs[2][0];
                    onLow  = Lows[2][0];
                    rthOpened = false;        // nuevo día ETH → nuevo overnight
                }
                else if (!rthOpened)
                {
                    if (Highs[2][0] > onHigh) onHigh = Highs[2][0];
                    if (Lows[2][0]  < onLow)  onLow  = Lows[2][0];
                }
                return;
            }

            if (BarsInProgress != 1) return;  // [1] RTH diaria

            rthOpened = true;                 // abrió RTH → congelar overnight

            // El envío solo en tiempo real (no reenviar todos los días históricos).
            if (State != State.Realtime) return;
            if (CurrentBars[1] < 1) return;            // necesito ayer + hoy
            if (CurrentBars[1] == lastDailyBar) return; // ya enviado para este día
            lastDailyBar = CurrentBars[1];

            double pdo = Opens[1][1];   // OHLC RTH de AYER (bar diario cash completo)
            double pdh = Highs[1][1];
            double pdl = Lows[1][1];
            double pdc = Closes[1][1];
            double openHoy = Opens[1][0];               // apertura RTH de HOY
            string fecha = Times[1][0].ToString("yyyy-MM-dd");

            Task.Run(() => SendLevelsAsync(fecha, pdo, pdh, pdl, pdc, openHoy, onHigh, onLow));
        }

        private async Task SendLevelsAsync(
            string fecha, double pdo, double pdh, double pdl, double pdc, double openHoy,
            double onh, double onl)
        {
            try
            {
                HttpClient client = httpClient;
                if (client == null) return;

                // ONH/ONL (overnight) → precio_max_pre / precio_min_pre. Solo se
                // incluyen si son válidos (NaN = aún sin datos overnight).
                string onhJson = double.IsNaN(onh) ? ""
                    : string.Format(CultureInfo.InvariantCulture, ",\"precio_max_pre\":{0}", onh);
                string onlJson = double.IsNaN(onl) ? ""
                    : string.Format(CultureInfo.InvariantCulture, ",\"precio_min_pre\":{0}", onl);

                string json = string.Format(
                    CultureInfo.InvariantCulture,
                    "{{" +
                    "\"sesion_date\":\"{0}\","        +
                    "\"precio_apertura_ayer\":{1},"   +
                    "\"precio_max_ayer\":{2},"        +
                    "\"precio_min_ayer\":{3},"        +
                    "\"precio_cierre_ayer\":{4},"     +
                    "\"precio_apertura\":{5}"         +
                    "{6}{7}"                          +
                    "}}",
                    fecha, pdo, pdh, pdl, pdc, openHoy, onhJson, onlJson);

                // UPSERT por sesion_date: solo actualiza estas columnas.
                var req = new HttpRequestMessage(HttpMethod.Post,
                    SESIONES_ENDPOINT + "?on_conflict=sesion_date");
                req.Headers.Add("Prefer", "resolution=merge-duplicates,return=minimal");
                req.Content = new StringContent(json, Encoding.UTF8, "application/json");
                await client.SendAsync(req);
            }
            catch { }
        }
    }
}
