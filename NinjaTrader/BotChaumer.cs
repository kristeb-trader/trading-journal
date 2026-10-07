// ═══════════════════════════════════════════════════════════════════════════
//  BotChaumer — el plan de Chaumer operado por el motor, en NinjaTrader 8
//  Diseño: docs/disenos/2026-10-06-bot-chaumer.md §6.3–§7 · D-038
//
//  El bot NO decide nada: al cierre de cada vela corre MotorChaumer (lector.py en C#, sellado)
//  sobre las velas del día y pone en el mercado la orden que el motor dice que debe estar viva.
//  Lo único suyo es la ejecución:
//    - entrada stop-market en el nivel del motor, con los contratos que caben en RIESGO_MAX;
//    - al llenarse, stop y objetivo OCO en el nivel estructural EXACTO (no la ATM K1: §6.3);
//    - una orden que vuelve al punto del stop antes de llenarse se cancela tick a tick;
//    - después del llenado, nada: solo cierran el stop o el objetivo, aunque acabe la ventana.
//
//  Candados (§6.4). Si falla uno, ese día (o esa sesión) no opera y lo deja escrito:
//    sello del motor = el del repositorio · cuenta en la lista blanca · MNQ de 1 minuto con premercado
//    · noticias de hoy leídas de Supabase · sin posición ni operación previa hoy · GO si se exige.
//
//  Registro: una fila por día y cuenta en `bot_operaciones` (Supabase, service_role). En el Strategy
//  Analyzer (cuenta Backtest) no escribe en Supabase: deja un CSV en Documentos\NinjaTrader 8\bot-chaumer\.
//  En un gráfico solo opera en tiempo real (y en Market Replay); en el Analyzer, sobre el histórico.
//
//  Configuración: Documentos\NinjaTrader 8\bot-chaumer.json (se crea sola): ruta del repositorio,
//  cuentas de la lista blanca y si exige el GO. Ningún número del plan es una propiedad: los lee
//  el motor de chaumer/01_Plan/reglas.json.
//
//  Lo común con VistaMotorChaumer (configuración, sello, Supabase, velas en UTC) vive en ChaumerNT.cs.
//
//  En C# 5, como MotorChaumer.cs. Instalar: copiar a Documentos\NinjaTrader 8\bin\Custom\Strategies\
//  (con MotorChaumer.cs y ChaumerNT.cs en Custom\AddOns\) y F5. Gráfico MNQ 1 minuto con la plantilla ETH.
// ═══════════════════════════════════════════════════════════════════════════

#region Using declarations
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Media;
using Newtonsoft.Json.Linq;
using NinjaTrader.Cbi;
using NinjaTrader.Data;
using NinjaTrader.NinjaScript;
using NinjaTrader.NinjaScript.DrawingTools;
#endregion

namespace NinjaTrader.NinjaScript.Strategies
{
    public enum ModoBotChaumer { Automatico, Alerta }

    public class BotChaumer : Strategy
    {
        private const string N_ENTRADA = "Chaumer entrada", N_STOP = "Chaumer stop", N_OBJETIVO = "Chaumer objetivo";
        private static readonly CultureInfo INV = CultureInfo.InvariantCulture;
        private static readonly string DIR_NT = ChaumerNT.DIR_NT;

        // ── la fila del día (bot_operaciones) ────────────────────────────────
        private class Fila
        {
            public string Fecha, Cuenta, Modo, Sello, Setup, HoraOrden, HoraLlenado, HoraSalida, Resultado = "EN CURSO", Motivo, Diferencia;
            public bool? Go; public int? Direccion, Contratos;
            public double? Entrada, Stop, Objetivo, Riesgo, PrecioLlenado, Deslizamiento, PrecioSalida, Puntos, Comision, PnlNeto;
            public List<string> Eventos = new List<string>();

            public JObject Json()
            {
                var j = new JObject();
                j["fecha"] = Fecha; j["cuenta"] = Cuenta; j["modo"] = Modo; j["sello_motor"] = Sello; j["go"] = Go;
                j["setup"] = Setup; j["direccion"] = Direccion; j["hora_orden"] = HoraOrden;
                j["entrada"] = Entrada; j["stop"] = Stop; j["objetivo"] = Objetivo; j["riesgo"] = Riesgo; j["contratos"] = Contratos;
                j["hora_llenado"] = HoraLlenado; j["precio_llenado"] = PrecioLlenado; j["deslizamiento_ticks"] = Deslizamiento;
                j["hora_salida"] = HoraSalida; j["precio_salida"] = PrecioSalida; j["resultado"] = Resultado;
                j["puntos"] = Puntos; j["comision"] = Comision; j["pnl_neto"] = PnlNeto; j["motivo"] = Motivo;
                j["diferencia"] = Diferencia; j["eventos"] = new JArray(Eventos.ToArray());
                j["actualizada_en"] = DateTime.UtcNow.ToString("o", INV);
                return j;
            }

            public static string CabeceraCsv()
            {
                return "fecha;setup;direccion;hora_orden;entrada;stop;objetivo;riesgo;contratos;hora_llenado;precio_llenado;"
                     + "deslizamiento_ticks;hora_salida;precio_salida;resultado;puntos;comision;pnl_neto;motivo;diferencia";
            }

            private static string N(double? x) { return x.HasValue ? x.Value.ToString("0.####", INV) : ""; }
            private static string T(string s) { return (s ?? "").Replace(";", ",").Replace("\n", " "); }

            public string Csv()
            {
                return string.Join(";", new[] { Fecha, T(Setup), Direccion.HasValue ? Direccion.Value.ToString(INV) : "", T(HoraOrden),
                    N(Entrada), N(Stop), N(Objetivo), N(Riesgo), Contratos.HasValue ? Contratos.Value.ToString(INV) : "",
                    T(HoraLlenado), N(PrecioLlenado), N(Deslizamiento), T(HoraSalida), N(PrecioSalida), T(Resultado),
                    N(Puntos), N(Comision), N(PnlNeto), T(Motivo), T(Diferencia) });
            }
        }

        // ── estado de la sesión ──────────────────────────────────────────────
        private ConfigChaumer cfg;
        private MotorChaumer.Parametros P;
        private string problemaGlobal;            // un candado que impide operar toda la sesión
        private bool avisadoGlobal, esBacktest;
        private TimeZoneInfo tzNt;
        private HttpClient http;
        private Task escritura = Task.FromResult(0);
        private Dictionary<string, List<int>> noticiasTodas;
        private HashSet<string> fedTodas;
        private readonly List<Fila> filasBacktest = new List<Fila>();

        // ── estado del día ───────────────────────────────────────────────────
        private string dia;                         // yyyyMMdd (UTC) de la jornada
        private int inicioDia = -1;                 // primera vela del día UTC en el gráfico
        private readonly List<MotorChaumer.Vela> velas = new List<MotorChaumer.Vela>();
        private int ultimaVela = -1;                // última vela ya pasada a `velas`
        private bool armadoIntentado, armado, terminado, finalizado;
        private MotorChaumer motor;
        private Fila fila;
        private List<string> eventos = new List<string>();

        // ── estado de la operación (sobrevive al cambio de día si sigue abierta) ──
        private MotorChaumer.Orden ordenMotor, pendienteTrasCancelar;
        private string horaPendiente;               // la hora (etiqueta del motor) de la orden que espera a que se cancele la vieja
        private string registroBacktest;            // en el Analyzer, el registro va a un archivo de la pasada
        private Order entrada, stopO, objetivoO;
        private Fila filaOp;
        private int llenados, salidos;
        private double comision, sumaSalida;

        [NinjaScriptProperty]
        [Display(Name = "Modo", Order = 1, GroupName = "BotChaumer",
                 Description = "Automatico: pone las órdenes. Alerta: avisa y dibuja la entrada; la orden la pones tú.")]
        public ModoBotChaumer Modo { get; set; }

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Name = "BotChaumer";
                Description = "El plan de Chaumer operado por el motor (MotorChaumer, sellado). D-038.";
                Calculate = Calculate.OnPriceChange;
                IsUnmanaged = true;
                IsExitOnSessionCloseStrategy = false;          // R-33: no se cierra por hora
                BarsRequiredToTrade = 0;
                StartBehavior = StartBehavior.ImmediatelySubmit;
                RealtimeErrorHandling = RealtimeErrorHandling.IgnoreAllErrors;   // los rechazos los trata OnOrderUpdate
                IsInstantiatedOnEachOptimizationIteration = true;
                Modo = ModoBotChaumer.Automatico;
            }
            else if (State == State.DataLoaded)
            {
                tzNt = Core.Globals.GeneralOptions.TimeZoneInfo;
                cfg = ChaumerNT.LeerConfig(Log);
                esBacktest = Account != null && Account.Name == "Backtest";
                if (esBacktest)
                    registroBacktest = Path.Combine(DIR_NT, "bot-chaumer", "backtest-" + DateTime.Now.ToString("yyyyMMdd-HHmmss", INV) + "-registro.txt");
                problemaGlobal = ComprobarSesion();
                if (problemaGlobal == null && esBacktest) problemaGlobal = CargarNoticiasYFed();
                Log(problemaGlobal == null
                    ? "listo · cuenta " + Account.Name + " · modo " + Modo + " · sello " + MotorChaumer.SELLO
                    : "NO OPERA en esta sesión: " + problemaGlobal);
            }
            else if (State == State.Terminated)
            {
                if (esBacktest && filasBacktest.Count > 0) EscribirCsv();
                if (http != null) { try { escritura.Wait(5000); } catch { } http.Dispose(); http = null; }
            }
        }

        // ═════════════════════════════════════════════════════════════ candados de la sesión
        private string ComprobarSesion()
        {
            if (Account == null || !cfg.Cuentas.Contains(Account.Name))
                return "la cuenta " + (Account == null ? "?" : Account.Name) + " no está en la lista blanca (bot-chaumer.json)";
            if (BarsPeriod.BarsPeriodType != BarsPeriodType.Minute || BarsPeriod.Value != 1) return "el gráfico no es de 1 minuto";
            if (Instrument.MasterInstrument.Name != "MNQ") return "el instrumento es " + Instrument.MasterInstrument.Name + ", no MNQ";
            string m = ChaumerNT.ComprobarMotor(cfg.Repo, out P);
            if (m != null) return m;
            http = ChaumerNT.Cliente();
            if (http == null) return "falta Documentos\\NinjaTrader 8\\supabase-service-key.txt";
            return null;
        }

        // ═════════════════════════════════════════════════════════════ cada vela
        protected override void OnBarUpdate()
        {
            if (CurrentBar < 1) return;
            if (problemaGlobal != null)
            {
                if (!avisadoGlobal && State == State.Realtime) { avisadoGlobal = true; Avisar("BotChaumer no opera: " + problemaGlobal); }
                return;
            }
            bool historico = State == State.Historical;
            if (historico && !esBacktest) return;              // en un gráfico, solo en tiempo real
            if (!historico) VigilarTick();
            if (!historico && !IsFirstTickOfBar) return;
            int cerrada = historico ? CurrentBar : CurrentBar - 1;
            try { Decidir(cerrada); }
            catch (Exception e) { Log("ERROR en la vela " + Hora(cerrada) + ": " + e); }
        }

        private void Decidir(int cerrada)
        {
            DateTime utc = Utc(cerrada);
            string d = utc.ToString("yyyyMMdd", INV);
            if (d != dia) NuevoDia(d, cerrada);
            if (terminado) return;
            int hm = utc.Hour * 100 + utc.Minute;
            int ap = MotorChaumer.AperturaUtc(d), ci = MotorChaumer.CierreUtc(d);
            if (hm < ap) return;
            if (!armadoIntentado)
            {
                if (hm > ci) return;                            // encendido con la ventana ya cerrada
                Armar(d);
                if (!armado) return;
            }
            if (llenados > 0) return;                           // ya hay operación: solo la cierran stop u objetivo
            if (hm > ci)
            {
                CancelarEntrada();
                if (!finalizado) Finalizar("NO OPERA");
                terminado = true;
                return;
            }

            var r = motor.Decidir(VelasHasta(cerrada), d, null);
            if (r == null) return;
            if (r.Error != null) { if (fila.Motivo == null) { fila.Motivo = "motor: " + r.Error; Guardar(fila); } return; }
            eventos = r.Eventos;

            if (r.Trade != null)
            {
                // el motor la da por llenada y aquí no se llenó: diferencia intravela (o un rechazo)
                CancelarEntrada();
                fila.Diferencia = "el motor la da por llenada a las " + r.Trade.Hora + " (" + r.Trade.Res + ") y en el mercado no se llenó";
                Finalizar("NO OPERA");
                terminado = true;
                return;
            }
            var o = r.Orden;
            if (o == null || o.Pausa != null) { CancelarEntrada(); return; }       // ninguna, o retirada por noticia
            if (EntradaViva())
            {
                if (Misma(o, ordenMotor)) return;
                pendienteTrasCancelar = o; horaPendiente = MotorChaumer.Hh(r.D[o.I]);   // otra orden: se pone al cancelar la vieja
                CancelarEntrada();
                return;
            }
            if (entrada != null && !Order.IsTerminalState(entrada.OrderState))
            {
                pendienteTrasCancelar = o; horaPendiente = MotorChaumer.Hh(r.D[o.I]);
                return;
            }
            if (Misma(o, ordenMotor) && Modo == ModoBotChaumer.Alerta) return;
            Enviar(o, MotorChaumer.Hh(r.D[o.I]));
        }

        private void NuevoDia(string d, int cerrada)
        {
            if (fila != null && !finalizado && llenados == 0) Finalizar(fila.Resultado == "EN CURSO" ? "NO OPERA" : null);
            if (dia != null && inicioDia >= 0)
            {
                // ¿Tuvo el día que se acaba sus 120 velas de ventana? Un hueco de datos no es un fallo del bot (18/09/2026)
                int ap0 = MotorChaumer.AperturaUtc(dia), ci0 = MotorChaumer.CierreUtc(dia), n = 0;
                for (int i = inicioDia; i < cerrada; i++) { DateTime u = Utc(i); int h = u.Hour * 100 + u.Minute; if (h >= ap0 && h <= ci0) n++; }
                DayOfWeek dw = new DateTime(int.Parse(dia.Substring(0, 4)), int.Parse(dia.Substring(4, 2)), int.Parse(dia.Substring(6, 2))).DayOfWeek;
                bool habil = dw != DayOfWeek.Saturday && dw != DayOfWeek.Sunday;
                if (habil && n < 120) Log("⚠ " + dia + ": ventana incompleta, " + n + " de 120 velas (faltan datos o es festivo)");
            }
            dia = d;
            inicioDia = cerrada;
            inicioDia = ChaumerNT.InicioDia(Bars, cerrada, d, tzNt);
            velas.Clear(); ultimaVela = inicioDia - 1;
            if (esBacktest) Log("día " + d + " · primera vela " + Utc(inicioDia).ToString("HH:mm", INV) + " UTC · vela " + inicioDia);
            armadoIntentado = armado = terminado = finalizado = false;
            motor = null; fila = null; eventos = new List<string>();
            if (Position.MarketPosition == MarketPosition.Flat && (llenados == 0 || salidos >= llenados))
            {
                ordenMotor = pendienteTrasCancelar = null; entrada = stopO = objetivoO = null;
                filaOp = null; llenados = salidos = 0; comision = sumaSalida = 0;
            }
        }

        // ═════════════════════════════════════════════════════════════ candados del día
        private void Armar(string d)
        {
            armadoIntentado = true;
            fila = new Fila
            {
                Fecha = d.Substring(0, 4) + "-" + d.Substring(4, 2) + "-" + d.Substring(6, 2),
                Cuenta = Account.Name, Modo = Modo == ModoBotChaumer.Alerta ? "alerta" : "automatico", Sello = MotorChaumer.SELLO
            };
            List<int> nots; bool fed; bool? go = null;
            if (esBacktest)
            {
                if (!noticiasTodas.TryGetValue(d, out nots)) nots = new List<int>();
                fed = fedTodas.Contains(d);
            }
            else
            {
                string fallo = ChaumerNT.LeerDia(http, fila.Fecha, out nots, out fed, out go);
                if (fallo != null) { NoArmado("no pude leer de Supabase las noticias de hoy (" + fallo + ")"); return; }
                if (!Account.Name.StartsWith("Playback", StringComparison.Ordinal) && YaOperoHoy(fila.Fecha))
                { NoArmado("el bot ya operó hoy en esta cuenta"); return; }
            }
            fila.Go = go;
            if (Position.MarketPosition != MarketPosition.Flat) { NoArmado("sigue abierta una operación anterior"); return; }
            if (cfg.ExigirGo && go != true) { NoArmado("sin el GO del checklist"); return; }
            int hm0 = Utc(inicioDia).Hour * 100 + Utc(inicioDia).Minute;
            if (hm0 > 100) { NoArmado("el gráfico no trae el premercado desde las 00:00 UTC (19:00 Col): usa la plantilla ETH"); return; }
            motor = new MotorChaumer(P, nots, fed);
            armado = true;
            Guardar(fila);
            Log("armado " + fila.Fecha + (fed ? " · día de Fed" : "") + " · noticias " + nots.Count + " · GO " + (go.HasValue ? go.Value.ToString() : "?"));
        }

        private void NoArmado(string motivo)
        {
            fila.Resultado = "NO ARMADO"; fila.Motivo = motivo;
            finalizado = terminado = true;
            Guardar(fila);
            Log("no se arma el " + fila.Fecha + ": " + motivo);
            if (State == State.Realtime) Avisar("BotChaumer no opera hoy: " + motivo);
        }

        // ═════════════════════════════════════════════════════════════ órdenes
        private void Enviar(MotorChaumer.Orden o, string horaOrden)
        {
            double pv = Instrument.MasterInstrument.PointValue;
            int qty = (int)Math.Floor(P.RiesgoMax / (o.R * pv) + 1e-9);     // R-04: los contratos que caben, hacia abajo
            fila.Setup = o.Tipo; fila.Direccion = o.Dir; fila.HoraOrden = horaOrden;
            fila.Entrada = o.E; fila.Stop = o.S; fila.Objetivo = o.T; fila.Riesgo = o.R; fila.Contratos = qty;
            ordenMotor = o;
            if (qty < 1) { fila.Motivo = "no cabe ni un contrato en RIESGO_MAX"; Guardar(fila); return; }
            if (Modo == ModoBotChaumer.Alerta)
            {
                Avisar("BotChaumer: " + o.Tipo + (o.Dir > 0 ? " alcista" : " bajista") + " · entrada " + MotorChaumer.F2(o.E)
                       + " · stop " + MotorChaumer.F2(o.S) + " · objetivo " + MotorChaumer.F2(o.T) + " · " + qty + " contratos");
                Draw.HorizontalLine(this, "chaumer-entrada", o.E, Brushes.Gold);
                Guardar(fila);
                return;
            }
            SubmitOrderUnmanaged(0, o.Dir > 0 ? OrderAction.Buy : OrderAction.SellShort, OrderType.StopMarket, qty,
                                 0, Instrument.MasterInstrument.RoundToTickSize(o.E), "", N_ENTRADA);
            filaOp = fila;
            Guardar(fila);
            Log("orden " + o.Tipo + " " + (o.Dir > 0 ? "alcista" : "bajista") + " · " + qty + " × entrada " + MotorChaumer.F2(o.E)
                + " · stop " + MotorChaumer.F2(o.S) + " · objetivo " + MotorChaumer.F2(o.T));
        }

        private bool EntradaViva() { return entrada != null && !Order.IsTerminalState(entrada.OrderState); }
        private void CancelarEntrada() { if (EntradaViva() && llenados == 0) CancelOrder(entrada); }

        private static bool Misma(MotorChaumer.Orden a, MotorChaumer.Orden b)
        {
            return b != null && a.I == b.I && a.Tipo == b.Tipo && Math.Abs(a.E - b.E) < 1e-9 && Math.Abs(a.S - b.S) < 1e-9;
        }

        /// <summary>R-29 tick a tick: si el precio vuelve al punto del stop antes de llenar, la orden se cancela.</summary>
        private void VigilarTick()
        {
            if (!EntradaViva() || llenados > 0 || ordenMotor == null) return;
            double px = Close[0];
            if (ordenMotor.Dir > 0 ? px <= ordenMotor.S : px >= ordenMotor.S)
            {
                CancelOrder(entrada);
                eventos.Add("tick " + MotorChaumer.F2(px) + ": vuelve al punto del stop antes de llenar → orden cancelada");
            }
        }

        protected override void OnOrderUpdate(Order order, double limitPrice, double stopPrice, int quantity, int filled,
                                              double averageFillPrice, OrderState orderState, DateTime time, ErrorCode error, string comment)
        {
            if (order.Name == N_ENTRADA) entrada = order;
            else if (order.Name == N_STOP) stopO = order;
            else if (order.Name == N_OBJETIVO) objetivoO = order;
            else return;

            if (orderState == OrderState.Rejected)
            {
                string msg = order.Name + " rechazada: " + comment;
                Log(msg);
                Fila f = filaOp ?? fila;
                if (f != null) { f.Diferencia = (f.Diferencia == null ? "" : f.Diferencia + " · ") + msg; Guardar(f); }
                if (order.Name != N_ENTRADA) Avisar("¡BotChaumer: " + msg + "! La posición puede estar sin protección.");
            }
            if (order.Name == N_ENTRADA && orderState == OrderState.Cancelled && pendienteTrasCancelar != null && llenados == 0 && !terminado)
            {
                var o = pendienteTrasCancelar; pendienteTrasCancelar = null;
                Enviar(o, horaPendiente);
            }
        }

        protected override void OnExecutionUpdate(Execution execution, string executionId, double price, int quantity,
                                                  MarketPosition marketPosition, string orderId, DateTime time)
        {
            Order ord = execution.Order;
            if (ord == null || filaOp == null) return;
            comision += execution.Commission;
            var o = ordenMotor;
            if (ord.Name == N_ENTRADA)
            {
                llenados += quantity; terminado = true; pendienteTrasCancelar = null;
                if (filaOp.HoraLlenado == null) filaOp.HoraLlenado = HoraDe(time);
                filaOp.PrecioLlenado = ord.AverageFillPrice;
                filaOp.Deslizamiento = (ord.AverageFillPrice - o.E) * o.Dir / TickSize;
                filaOp.Contratos = llenados;
                OrderAction salida = o.Dir > 0 ? OrderAction.Sell : OrderAction.BuyToCover;
                if (stopO == null)
                {
                    string oco = "chaumer-" + Guid.NewGuid().ToString("N");
                    SubmitOrderUnmanaged(0, salida, OrderType.StopMarket, llenados, 0, Instrument.MasterInstrument.RoundToTickSize(o.S), oco, N_STOP);
                    SubmitOrderUnmanaged(0, salida, OrderType.Limit, llenados, Instrument.MasterInstrument.RoundToTickSize(o.T), 0, oco, N_OBJETIVO);
                }
                else
                {
                    ChangeOrder(stopO, llenados, 0, stopO.StopPrice);
                    if (objetivoO != null) ChangeOrder(objetivoO, llenados, objetivoO.LimitPrice, 0);
                }
                Guardar(filaOp);
                Log("llenada " + llenados + " × " + MotorChaumer.F2(ord.AverageFillPrice) + " a las " + filaOp.HoraLlenado);
            }
            else if (ord.Name == N_STOP || ord.Name == N_OBJETIVO)
            {
                salidos += quantity; sumaSalida += price * quantity;
                if (salidos < llenados) return;
                double ps = sumaSalida / salidos;
                filaOp.PrecioSalida = ps; filaOp.HoraSalida = HoraDe(time);
                filaOp.Resultado = ord.Name == N_STOP ? "STOP" : "TARGET";
                filaOp.Puntos = (ps - filaOp.PrecioLlenado.Value) * o.Dir;
                filaOp.Comision = comision;
                filaOp.PnlNeto = filaOp.Puntos.Value * llenados * Instrument.MasterInstrument.PointValue - comision;
                if (filaOp == fila) { fila.Eventos = new List<string>(eventos); finalizado = true; }
                Guardar(filaOp);
                Log(filaOp.Resultado + " · " + MotorChaumer.F2(filaOp.Puntos.Value) + " pts · neto $" + filaOp.PnlNeto.Value.ToString("0.00", INV));
            }
        }

        private void Finalizar(string resultado)
        {
            if (fila == null) return;
            if (resultado != null) fila.Resultado = resultado;
            fila.Eventos = new List<string>(eventos);
            finalizado = true;
            Guardar(fila);
        }

        // ═════════════════════════════════════════════════════════════ velas y horas
        private DateTime Utc(int idx) { return ChaumerNT.Utc(Bars, idx, tzNt); }

        private string Hora(int idx) { return ChaumerNT.Hora(Bars, idx, tzNt); }

        private string HoraDe(DateTime tNt) { return ChaumerNT.HoraDe(tNt, tzNt); }

        private List<MotorChaumer.Vela> VelasHasta(int cerrada)
        {
            for (int i = ultimaVela + 1; i <= cerrada; i++) velas.Add(ChaumerNT.Vela(Bars, i, tzNt));
            if (cerrada > ultimaVela) ultimaVela = cerrada;
            return velas;
        }

        // ═════════════════════════════════════════════════════════════ Supabase

        private JArray Get(string ruta) { return ChaumerNT.Get(http, ruta); }

        private bool YaOperoHoy(string fecha)
        {
            try
            {
                var f = Get("bot_operaciones?select=precio_llenado&fecha=eq." + fecha + "&cuenta=eq." + Uri.EscapeDataString(Account.Name));
                return f.Count > 0 && f[0]["precio_llenado"] != null && f[0]["precio_llenado"].Type != JTokenType.Null;
            }
            catch { return false; }
        }

        /// <summary>El Strategy Analyzer recorre muchos días: noticias y Fed de todos, de una vez.</summary>
        private string CargarNoticiasYFed()
        {
            try
            {
                noticiasTodas = new Dictionary<string, List<int>>();
                foreach (var n in Get("sesion_noticias?select=sesion_date,hora&order=sesion_date,hora"))
                {
                    string d = ((string)n["sesion_date"]).Replace("-", "");
                    if (!noticiasTodas.ContainsKey(d)) noticiasTodas[d] = new List<int>();
                    noticiasTodas[d].Add(ChaumerNT.Minutos((string)n["hora"]));
                }
                fedTodas = new HashSet<string>();
                foreach (var f in Get("catalogo_fechas?select=fecha&tipo=eq.fomc&activa=eq.true")) fedTodas.Add(((string)f["fecha"]).Replace("-", ""));
                return null;
            }
            catch (Exception e) { return "no pude leer noticias y días de Fed de Supabase: " + (e.InnerException ?? e).Message; }
        }

        private void Guardar(Fila f)
        {
            if (f == null) return;
            if (esBacktest) { if (!filasBacktest.Contains(f)) filasBacktest.Add(f); return; }
            if (http == null) return;
            string json = f.Json().ToString(Newtonsoft.Json.Formatting.None);
            // en serie: una escritura vieja no puede llegar después de una nueva
            escritura = escritura.ContinueWith(delegate(Task t)
            {
                try
                {
                    var req = new HttpRequestMessage(HttpMethod.Post, ChaumerNT.URL + "bot_operaciones?on_conflict=fecha,cuenta");
                    req.Headers.Add("Prefer", "resolution=merge-duplicates,return=minimal");
                    req.Content = new StringContent(json, Encoding.UTF8, "application/json");
                    var resp = http.SendAsync(req).Result;
                    if (!resp.IsSuccessStatusCode)
                        Log("Supabase rechazó la fila: " + (int)resp.StatusCode + " " + resp.Content.ReadAsStringAsync().Result);
                }
                catch (Exception e) { Log("no pude guardar en Supabase: " + (e.InnerException ?? e).Message); }
            });
        }

        // ═════════════════════════════════════════════════════════════ configuración, CSV y registro

        private void EscribirCsv()
        {
            try
            {
                string dir = Path.Combine(DIR_NT, "bot-chaumer");
                Directory.CreateDirectory(dir);
                string path = Path.Combine(dir, "backtest-" + DateTime.Now.ToString("yyyyMMdd-HHmmss", INV) + ".csv");
                var lineas = new List<string> { "# BotChaumer · Strategy Analyzer · sello " + MotorChaumer.SELLO + " · " + Instrument.FullName, Fila.CabeceraCsv() };
                lineas.AddRange(filasBacktest.OrderBy(f => f.Fecha).Select(f => f.Csv()));
                File.WriteAllLines(path, lineas, new UTF8Encoding(false));
                Print("[BotChaumer] backtest: " + filasBacktest.Count + " días → " + path);
            }
            catch (Exception e) { Print("[BotChaumer] no pude escribir el CSV: " + e.Message); }
        }

        private void Avisar(string msg)
        {
            Log(msg);
            try { Alert("BotChaumer", Priority.High, msg, Core.Globals.InstallDir + @"\sounds\Alert2.wav", 0, Brushes.Black, Brushes.Gold); }
            catch { }
        }

        private void Log(string msg)
        {
            Print("[BotChaumer] " + msg);
            try
            {
                string dir = Path.Combine(DIR_NT, "bot-chaumer");
                Directory.CreateDirectory(dir);
                File.AppendAllText(esBacktest && registroBacktest != null ? registroBacktest : Path.Combine(dir, "registro.txt"),
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss", INV) + "  " + msg + Environment.NewLine, new UTF8Encoding(false));
            }
            catch { }
        }
    }
}
