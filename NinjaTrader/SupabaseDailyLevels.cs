#region Using declarations
using System;
using System.Globalization;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using NinjaTrader.Cbi;
using NinjaTrader.Data;
using NinjaTrader.NinjaScript;
#endregion

/*
 * SupabaseDailyLevels — Indicador NinjaTrader 8 (v1.0 — 2026-06-17)
 *
 * Calcula automáticamente los niveles de referencia del día y los sube a la
 * sesión de hoy en Supabase, para no tener que escribirlos a mano:
 *   - PDO / PDH / PDL / PDC  → OHLC de la sesión RTH de AYER (ya completa)
 *   - Apertura de hoy        → open de la sesión RTH de HOY
 *
 * Cómo lo hace:
 *   Añade una serie DIARIA con la plantilla de horario "CME US Index Futures
 *   RTH", así el OHLC diario corresponde a la sesión cash (9:30–16:00 ET),
 *   independientemente de la plantilla del gráfico. En la apertura RTH de hoy
 *   se forma un nuevo bar diario: ayer queda en [1][1] y hoy en [1][0].
 *   Hace un UPSERT a `sesiones` por `sesion_date` (solo toca estas columnas;
 *   no pisa el resto de la sesión). El formulario sigue editable como respaldo.
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

        // Nombre de la plantilla de horario RTH del CME (índices). Si tu versión
        // de NT la nombra distinto, ajústalo aquí.
        private const string RTH_TEMPLATE = "CME US Index Futures RTH";

        private HttpClient httpClient;
        private int        lastDailyBar = -1;

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
            }
            else if (State == State.Configure)
            {
                // Serie diaria con sesión RTH (BarsArray[1])
                AddDataSeries(Instrument.FullName,
                    new BarsPeriod { BarsPeriodType = BarsPeriodType.Day, Value = 1 },
                    RTH_TEMPLATE);

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
            // Solo en tiempo real (no reenviar todos los días históricos) y solo
            // sobre la serie diaria RTH.
            if (State != State.Realtime) return;
            if (BarsInProgress != 1) return;
            if (CurrentBars[1] < 1) return;            // necesito ayer + hoy
            if (CurrentBars[1] == lastDailyBar) return; // ya enviado para este día
            lastDailyBar = CurrentBars[1];

            double pdo = Opens[1][1];   // OHLC de AYER (bar diario RTH completo)
            double pdh = Highs[1][1];
            double pdl = Lows[1][1];
            double pdc = Closes[1][1];
            double openHoy = Opens[1][0];               // apertura RTH de HOY
            string fecha = Times[1][0].ToString("yyyy-MM-dd");

            Task.Run(() => SendLevelsAsync(fecha, pdo, pdh, pdl, pdc, openHoy));
        }

        private async Task SendLevelsAsync(
            string fecha, double pdo, double pdh, double pdl, double pdc, double openHoy)
        {
            try
            {
                HttpClient client = httpClient;
                if (client == null) return;

                string json = string.Format(
                    CultureInfo.InvariantCulture,
                    "{{" +
                    "\"sesion_date\":\"{0}\","        +
                    "\"precio_apertura_ayer\":{1},"   +
                    "\"precio_max_ayer\":{2},"        +
                    "\"precio_min_ayer\":{3},"        +
                    "\"precio_cierre_ayer\":{4},"     +
                    "\"precio_apertura\":{5}"         +
                    "}}",
                    fecha, pdo, pdh, pdl, pdc, openHoy);

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
