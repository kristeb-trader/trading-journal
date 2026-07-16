#region Using declarations
using System;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using NinjaTrader.Cbi;
using NinjaTrader.Data;
using NinjaTrader.NinjaScript;
#endregion

/*
 * SupabaseDailyLevels — Indicador NinjaTrader 8 (v2.1 — 2026-07-16)
 *
 * v2.1: fix de zona horaria. Los Time[] de las velas vienen en la zona GLOBAL de
 *   NinjaTrader (Tools>Options>General), aquí Colombia (UTC-5), no en la del
 *   template del CME (Central). Antes se convertía desde la del template → +1h en
 *   verano → el RTH abría 1 hora antes (7:30 en vez de 8:30 hora Colombia).
 *
 * Calcula automáticamente los niveles de referencia del día y los sube a la
 * sesión de hoy en Supabase, para no escribirlos a mano:
 *   - PDO / PDH / PDL / PDC  → OHLC de la sesión RTH (cash) de AYER
 *   - ONH / ONL              → máx/mín del overnight (desde el cierre RTH de
 *                              ayer hasta la apertura RTH de hoy)
 *   - Apertura de hoy        → open RTH de HOY
 *
 * Cómo lo hace (v2.0):
 *   En vez de pedir series con plantilla de horario (AddDataSeries no aplica el
 *   horario de forma fiable en este entorno), trabaja sobre las velas del
 *   gráfico y las CLASIFICA por hora de Nueva York (ET): RTH = 9:30–16:00 ET;
 *   el resto = overnight. Por eso el GRÁFICO debe estar en sesión completa
 *   (ETH / <Use instrument settings>) para tener día + noche.
 *
 *   Al detectar la apertura de un nuevo RTH: el RTH de ayer ya está completo y
 *   el overnight recién cerrado → hace UPSERT a `sesiones` por sesion_date.
 *
 * Instalación:
 *   1. Copiar a: Documentos\NinjaTrader 8\bin\Custom\Indicators\ → F5
 *   2. Gráfico de MNQ en 1 min, Trading hours = <Use instrument settings> (ETH).
 *   3. Agregarlo UNA vez (junto al SupabaseAutoExport).
 *
 * Diagnóstico: imprime una línea por día RTH en la ventana de Output, también
 *   con datos históricos, para verificar los valores sin esperar a tiempo real.
 */

namespace NinjaTrader.NinjaScript.Indicators
{
    public class SupabaseDailyLevels : Indicator
    {
        private const string SESIONES_ENDPOINT =
            "https://jothoslozctflfrnysrx.supabase.co/rest/v1/sesiones";

        // La service_role key vive en un archivo local (fuera del repo):
        //   Documentos\NinjaTrader 8\supabase-service-key.txt
        // Necesaria con RLS activado (Fase 2 del plan de seguridad).
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

        // Ventana RTH en hora de NUEVA YORK (ET) — NO en hora local/Colombia.
        // El RTH del CME es 9:30–16:00 ET → usar 930 y 1600. (En verano eso es
        // 8:30–15:00 Colombia; en invierno 9:30–16:00. El código ya ajusta el DST,
        // por eso el valor SIEMPRE va en ET.) Formato HHmm.
        [NinjaScriptProperty]
        [Display(Name = "RTH abre — hora NEW YORK/ET (usar 930)", Order = 1, GroupName = "Niveles")]
        public int RthOpenHHmm { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "RTH cierra — hora NEW YORK/ET (usar 1600)", Order = 2, GroupName = "Niveles")]
        public int RthCloseHHmm { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Diagnóstico (imprime en Output)", Order = 3, GroupName = "Niveles")]
        public bool Diagnostico { get; set; }

        private HttpClient   httpClient;
        private TimeZoneInfo etTz;
        private TimeZoneInfo srcTz;

        // RTH del día en curso
        private DateTime curRthDate = DateTime.MinValue;
        private double   rthO, rthH, rthL, rthC;
        private bool     rthActive;

        // RTH de ayer (completo)
        private double   pO, pH, pL, pC;
        private bool     pValid;

        // Overnight desde el último cierre RTH
        private double   onH = double.NaN, onL = double.NaN;

        private int lastSentDate = -1;   // yyyymmdd ya enviado

        // Niveles del último RTH detectado, listos para enviar al entrar a realtime.
        private bool   hasPending = false;
        private int    pendDateInt;
        private string pendFecha;
        private double pPdo, pPdh, pPdl, pPdc, pOpen, pOnh, pOnl;

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Description = "Sube niveles de referencia (RTH de ayer + overnight + apertura) a Supabase";
                Name        = "SupabaseDailyLevels";
                Calculate   = Calculate.OnBarClose;
                IsOverlay   = true;
                DisplayInDataBox         = false;
                DrawOnPricePanel         = false;
                IsSuspendedWhileInactive = false;
                RthOpenHHmm  = 930;
                RthCloseHHmm = 1600;
                Diagnostico  = true;
            }
            else if (State == State.Configure)
            {
                supabaseKey = ReadServiceKey();
                if (string.IsNullOrEmpty(supabaseKey))
                    Print("[SupabaseDailyLevels] ⚠️ Falta la service_role key. Crea el archivo " +
                          "Documentos\\NinjaTrader 8\\supabase-service-key.txt con la key. " +
                          "Sin ella no se subirán niveles con RLS activado.");

                httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("apikey",        supabaseKey);
                httpClient.DefaultRequestHeaders.Add("Authorization", "Bearer " + supabaseKey);
            }
            else if (State == State.DataLoaded)
            {
                try { etTz = TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"); } catch { etTz = null; }
                // Zona en la que vienen los Time[] de las velas = la GLOBAL de NinjaTrader
                // (Tools > Options > General > Time zone), que está en Colombia (UTC-5), NO
                // la del template del CME. Usar la del template (Central) metía +1h en verano
                // al convertir a ET y hacía que el RTH se detectara 1 hora antes (la vela de
                // las 7:30 Colombia en vez de las 8:30). Fijar Colombia arregla el DST.
                try { srcTz = TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"); } // Bogotá/Lima (UTC-5)
                catch { srcTz = null; }
            }
            else if (State == State.Terminated)
            {
                httpClient?.Dispose();
                httpClient = null;
            }
        }

        private DateTime ToEt(DateTime t)
        {
            if (etTz == null || srcTz == null) return t;
            try { return TimeZoneInfo.ConvertTime(t, srcTz, etTz); }
            catch { return t; }
        }

        private bool IsRth(DateTime et)
        {
            if (et.DayOfWeek == DayOfWeek.Saturday || et.DayOfWeek == DayOfWeek.Sunday) return false;
            int hhmm = et.Hour * 100 + et.Minute;
            // Velas con timestamp de cierre: (open, close] → abre exclusivo, cierra inclusivo.
            return hhmm > RthOpenHHmm && hhmm <= RthCloseHHmm;
        }

        protected override void OnBarUpdate()
        {
            if (CurrentBar < 1) return;

            DateTime et = ToEt(Time[0]);

            if (IsRth(et))
            {
                DateTime rthDate = et.Date;

                if (!rthActive || rthDate != curRthDate)
                {
                    // ── Abre un nuevo RTH ──
                    // El RTH anterior ya está completo → pasa a "ayer".
                    if (curRthDate != DateTime.MinValue)
                    {
                        pO = rthO; pH = rthH; pL = rthL; pC = rthC; pValid = true;
                    }

                    curRthDate = rthDate;
                    rthO = Open[0]; rthH = High[0]; rthL = Low[0]; rthC = Close[0];
                    rthActive = true;

                    int dateInt = rthDate.Year * 10000 + rthDate.Month * 100 + rthDate.Day;

                    if (Diagnostico && pValid)
                        Print(string.Format(CultureInfo.InvariantCulture,
                            "[DailyLevels] {0:yyyy-MM-dd}  PDO={1} PDH={2} PDL={3} PDC={4}  RTHopen={5}  ONH={6} ONL={7}",
                            rthDate, pO, pH, pL, pC, rthO, onH, onL));

                    // Guardar los niveles del RTH recién abierto como "pendiente de enviar".
                    // El envío real se hace al entrar a tiempo real (ver flush abajo),
                    // porque esta apertura suele detectarse durante la carga histórica.
                    if (pValid)
                    {
                        hasPending  = true;
                        pendDateInt = dateInt;
                        pendFecha   = rthDate.ToString("yyyy-MM-dd");
                        pPdo = pO; pPdh = pH; pPdl = pL; pPdc = pC; pOpen = rthO; pOnh = onH; pOnl = onL;
                    }

                    // El overnight recién terminó → reset para el próximo.
                    onH = double.NaN; onL = double.NaN;
                }
                else
                {
                    // Continúa el RTH del día: actualizar H/L/C.
                    if (High[0] > rthH) rthH = High[0];
                    if (Low[0]  < rthL) rthL = Low[0];
                    rthC = Close[0];
                }
            }
            else
            {
                // ── Vela de overnight ──
                rthActive = false;
                if (double.IsNaN(onH)) { onH = High[0]; onL = Low[0]; }
                else { if (High[0] > onH) onH = High[0]; if (Low[0] < onL) onL = Low[0]; }
            }

            // ── Flush: enviar los niveles pendientes en cuanto estemos en tiempo real ──
            // (La apertura del RTH del día suele detectarse durante la carga histórica,
            //  cuando aún no se debe/puede enviar; aquí se envía una sola vez por día.)
            if (State == State.Realtime && hasPending && pendDateInt != lastSentDate)
            {
                lastSentDate = pendDateInt;
                if (Diagnostico) Print("[DailyLevels] Enviando niveles de " + pendFecha + " a Supabase…");
                string f = pendFecha;
                double a = pPdo, b = pPdh, c = pPdl, d = pPdc, o = pOpen, oh = pOnh, ol = pOnl;
                Task.Run(() => SendLevelsAsync(f, a, b, c, d, o, oh, ol));
            }
        }

        private async Task SendLevelsAsync(
            string fecha, double pdo, double pdh, double pdl, double pdc, double openHoy,
            double onh, double onl)
        {
            try
            {
                HttpClient client = httpClient;
                if (client == null) return;

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

                var req = new HttpRequestMessage(HttpMethod.Post,
                    SESIONES_ENDPOINT + "?on_conflict=sesion_date");
                req.Headers.Add("Prefer", "resolution=merge-duplicates,return=minimal");
                req.Content = new StringContent(json, Encoding.UTF8, "application/json");
                var res = await client.SendAsync(req);

                if (Diagnostico)
                {
                    if (res.IsSuccessStatusCode)
                        NinjaTrader.Code.Output.Process(
                            "[DailyLevels] ✅ Niveles de " + fecha + " guardados (HTTP " + (int)res.StatusCode + ")",
                            NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    else
                    {
                        string bodyResp = res.Content != null ? await res.Content.ReadAsStringAsync() : "";
                        NinjaTrader.Code.Output.Process(
                            "[DailyLevels] 🔴 Error al guardar " + fecha + ": HTTP " + (int)res.StatusCode + " " + bodyResp,
                            NinjaTrader.NinjaScript.PrintTo.OutputTab1);
                    }
                }
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process(
                    "[DailyLevels] 🔴 Excepción al enviar " + fecha + ": " + ex.Message,
                    NinjaTrader.NinjaScript.PrintTo.OutputTab1);
            }
        }
    }
}
