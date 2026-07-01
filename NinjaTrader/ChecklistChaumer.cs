// ═══════════════════════════════════════════════════════════════════════════
//  ChecklistChaumer — AddOn de NinjaTrader 8
//
//  Panel flotante con el checklist de disciplina (metodología Chaumer, NQ/MNQ)
//  sincronizado con Supabase (mismo sesiones.checklist que el Trading Journal web).
//
//  - Ventana flotante independiente (NTWindow): mover, redimensionar, always-on-top.
//  - Persiste posición/tamaño/topmost en archivo local.
//  - Ítems traídos del rulebook `reglas` (es_checklist=true), agrupados por fase.
//  - Botón GO: se habilita solo con el 100% marcado; al pulsarlo sella la hora en BD.
//  - Reset automático a las 09:00 ET (30 min antes de la apertura RTH; DST automático).
//  - Lectura por polling (~5 s) + escritura inmediata al marcar. Tolerante a offline.
//
//  Carpeta: Documents\NinjaTrader 8\bin\Custom\AddOns\ChecklistChaumer.cs
//  Requiere referencia a Newtonsoft.Json (incluida con NinjaTrader 8).
//  Ver instrucciones de instalación al final del archivo.
// ═══════════════════════════════════════════════════════════════════════════

using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Media;
using System.Windows.Threading;
using Newtonsoft.Json.Linq;
using NinjaTrader.Gui;
using NinjaTrader.Gui.Tools;

namespace NinjaTrader.NinjaScript.AddOns
{
    // ── AddOn: integra la entrada de menú en el Control Center ───────────────
    public class ChecklistChaumerAddOn : AddOnBase
    {
        private NTMenuItem menuItem;
        private NTMenuItem existingNewMenu;
        private static ChecklistChaumerWindow openWindow;

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Name        = "Checklist Chaumer";
                Description = "Panel flotante de checklist de disciplina sincronizado con el Trading Journal.";
            }
        }

        protected override void OnWindowCreated(Window window)
        {
            // Solo agregamos el menú al Control Center
            ControlCenter cc = window as ControlCenter;
            if (cc == null) return;

            // El menú "New" del Control Center (automation id estándar de NT8)
            existingNewMenu = cc.FindFirst("ControlCenterMenuItemNew") as NTMenuItem;
            if (existingNewMenu == null) return;

            menuItem = new NTMenuItem
            {
                Header = "Checklist Chaumer",
                Style  = Application.Current.TryFindResource("MainMenuItem") as Style
            };
            menuItem.Click += OnMenuItemClick;
            existingNewMenu.Items.Add(menuItem);

            // Auto-abrir el panel al iniciar NinjaTrader (cuando carga el Control
            // Center). Se difiere a baja prioridad para que la UI termine de cargar
            // primero. El panel reaparece en la última posición/tamaño guardados.
            cc.Dispatcher.BeginInvoke(new Action(OpenChecklistWindow),
                System.Windows.Threading.DispatcherPriority.Background);
        }

        protected override void OnWindowDestroyed(Window window)
        {
            if (menuItem != null && window is ControlCenter)
            {
                if (existingNewMenu != null && existingNewMenu.Items.Contains(menuItem))
                    existingNewMenu.Items.Remove(menuItem);
                menuItem.Click -= OnMenuItemClick;
                menuItem = null;
            }
        }

        private void OnMenuItemClick(object sender, RoutedEventArgs e) => OpenChecklistWindow();

        // Abre el panel (o lo trae al frente si ya está abierto). Una sola instancia.
        private void OpenChecklistWindow()
        {
            if (openWindow != null)
            {
                try { openWindow.Activate(); return; } catch { openWindow = null; }
            }
            openWindow = new ChecklistChaumerWindow();
            openWindow.Closed += (s, a) => openWindow = null;
            openWindow.Show();
        }
    }

    // ── Ventana flotante con el checklist ────────────────────────────────────
    public class ChecklistChaumerWindow : NTWindow
    {
        // ── Config Supabase ──
        private const string SUPABASE_URL =
            "https://jothoslozctflfrnysrx.supabase.co";
        // La service_role key vive en un archivo local (fuera del repo, misma carpeta
        // que checklist-chaumer-config.json):
        //   Documentos\NinjaTrader 8\supabase-service-key.txt
        // Necesaria con RLS activado (Fase 2 del plan de seguridad).
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

        // Reset 30 min antes de la apertura RTH (09:30 ET) → 09:00 ET.
        private static readonly TimeSpan RESET_TIME_ET = new TimeSpan(9, 0, 0);
        private const int POLL_SECONDS = 5;

        // ── Paleta (consistente con el Journal) ──
        private static readonly Brush BG       = Brush("#1A1A18");
        private static readonly Brush CARD     = Brush("#232320");
        private static readonly Brush BORDER   = Brush("#3A3A35");
        private static readonly Brush TEXT     = Brush("#F4F3EF");
        private static readonly Brush TEXT2    = Brush("#9B9B8E");
        private static readonly Brush ACCENT   = Brush("#1D9E75");
        private static readonly Brush RED      = Brush("#E24B4A");
        private static readonly Brush WARNING  = Brush("#BA7517");
        private static readonly Brush BLUE     = Brush("#5B94C9");

        private static readonly Dictionary<int, string> FASE_LABEL = new Dictionary<int, string>
        {
            { 1, "Fase 1 · Pre-sesión" },
            { 2, "Fase 2 · Lectura del setup" },
            { 3, "Fase 3 · Ejecución" },
        };
        private static Brush FaseColor(int f) => f == 1 ? ACCENT : f == 2 ? WARNING : BLUE;

        // HttpClient compartido (igual patrón que SupabaseDailyLevels)
        private static readonly HttpClient http = CreateHttp();

        // Estado
        private class Item { public string Clave; public int Fase; public string Texto; public CheckBox Box; }
        private readonly List<Item> items = new List<Item>();
        private string currentDate;                 // sesion_date en uso (fecha ET)
        private DateTime lastLocalChangeUtc = DateTime.MinValue;
        private DateTime lastHoraChangeUtc = DateTime.MinValue;
        private bool applyingRemote = false;        // evita re-disparar writes al aplicar estado remoto
        private bool goConfirmed = false;
        private bool inNoticiaWindow = false;       // dentro de la ventana ±5 min de la noticia roja
        private const int NOTICIA_MARGEN_MIN = 5;   // ventana de bloqueo ±5 min
        private DispatcherTimer timer;

        // UI refs
        private StackPanel sectionsPanel;
        private Button goButton;
        private Border statusBanner;
        private TextBlock statusText;
        private TextBlock dateText;
        private ToggleButton pinButton;
        private TextBox horaBox;                     // "HH:MM" hora de la noticia roja
        private Border noticiaCard;
        private TextBlock noticiaWin;               // ventana / estado NO OPERAR

        private string ConfigPath => Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "NinjaTrader 8", "checklist-chaumer-config.json");

        public ChecklistChaumerWindow()
        {
            Caption = "Checklist Chaumer";
            Width = 340; Height = 560;
            currentDate = TradingDateEt();

            Content = BuildUi();
            RestoreWindowConfig();

            Loaded  += async (s, e) => { await LoadCatalogAsync(); await LoadStateAsync(); StartTimer(); };
            Closing += (s, e) => SaveWindowConfig();
        }

        // ═══ UI ═══════════════════════════════════════════════════════════════
        private FrameworkElement BuildUi()
        {
            var root = new Grid { Background = BG };
            root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // header
            root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // status
            root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // noticia roja
            root.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) }); // checklist
            root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // GO

            // Header
            var header = new Grid { Margin = new Thickness(12, 10, 12, 6) };
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            header.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

            var titleStack = new StackPanel();
            titleStack.Children.Add(new TextBlock {
                Text = "CHECKLIST · CHAUMER", Foreground = TEXT, FontSize = 13, FontWeight = FontWeights.Bold });
            dateText = new TextBlock { Text = currentDate, Foreground = TEXT2, FontSize = 11, Margin = new Thickness(0, 1, 0, 0) };
            titleStack.Children.Add(dateText);
            Grid.SetColumn(titleStack, 0);
            header.Children.Add(titleStack);

            pinButton = new ToggleButton {
                Content = "📌", ToolTip = "Mantener al frente (always on top)",
                Width = 30, Height = 26, Foreground = TEXT2, Background = CARD,
                BorderBrush = BORDER, BorderThickness = new Thickness(1), Cursor = System.Windows.Input.Cursors.Hand
            };
            pinButton.Checked   += (s, e) => { Topmost = true;  pinButton.Foreground = ACCENT; };
            pinButton.Unchecked += (s, e) => { Topmost = false; pinButton.Foreground = TEXT2; };
            Grid.SetColumn(pinButton, 1);
            header.Children.Add(pinButton);
            Grid.SetRow(header, 0);
            root.Children.Add(header);

            // Status banner
            statusBanner = new Border {
                Background = CARD, BorderBrush = BORDER, BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(6), Margin = new Thickness(12, 0, 12, 8), Padding = new Thickness(8, 5, 8, 5)
            };
            statusText = new TextBlock { Text = "Conectando…", Foreground = TEXT2, FontSize = 11 };
            statusBanner.Child = statusText;
            Grid.SetRow(statusBanner, 1);
            root.Children.Add(statusBanner);

            // Panel de noticia roja (hora + ventana de bloqueo ±5 min)
            var noticiaInner = new Grid { Margin = new Thickness(8, 6, 8, 6) };
            noticiaInner.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            noticiaInner.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            noticiaInner.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            var noticiaLbl = new TextBlock {
                Text = "🚫 Noticia roja", Foreground = TEXT2, FontSize = 11,
                VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(0, 0, 8, 0) };
            Grid.SetColumn(noticiaLbl, 0);
            noticiaInner.Children.Add(noticiaLbl);
            horaBox = new TextBox {
                Width = 58, Height = 24, Text = "", FontSize = 12,
                Background = Brush("#2A2A26"), Foreground = TEXT, BorderBrush = BORDER, BorderThickness = new Thickness(1),
                VerticalContentAlignment = VerticalAlignment.Center, ToolTip = "Hora de la noticia roja (HH:MM, hora ET)"
            };
            horaBox.TextChanged += OnHoraChanged;
            Grid.SetColumn(horaBox, 1);
            noticiaInner.Children.Add(horaBox);
            noticiaWin = new TextBlock {
                Text = "Sin noticia", Foreground = TEXT2, FontSize = 11, TextWrapping = TextWrapping.Wrap,
                VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(8, 0, 0, 0) };
            Grid.SetColumn(noticiaWin, 2);
            noticiaInner.Children.Add(noticiaWin);
            noticiaCard = new Border {
                Background = CARD, BorderBrush = BORDER, BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(6), Margin = new Thickness(12, 0, 12, 8), Child = noticiaInner
            };
            Grid.SetRow(noticiaCard, 2);
            root.Children.Add(noticiaCard);

            // Checklist (scroll)
            sectionsPanel = new StackPanel { Margin = new Thickness(12, 0, 12, 8) };
            var scroll = new ScrollViewer {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto, Content = sectionsPanel };
            Grid.SetRow(scroll, 3);
            root.Children.Add(scroll);

            // GO
            goButton = new Button {
                Content = "GO — completa el checklist", Height = 48, Margin = new Thickness(12, 4, 12, 12),
                FontSize = 15, FontWeight = FontWeights.Bold, Foreground = TEXT2,
                Background = Brush("#2A2A26"), BorderBrush = BORDER, BorderThickness = new Thickness(1),
                IsEnabled = false, Cursor = System.Windows.Input.Cursors.Hand
            };
            goButton.Click += OnGoClick;
            Grid.SetRow(goButton, 4);
            root.Children.Add(goButton);

            return root;
        }

        private void RenderSections()
        {
            sectionsPanel.Children.Clear();
            foreach (int fase in new[] { 1, 2, 3 })
            {
                var ofFase = items.Where(i => i.Fase == fase).ToList();
                if (ofFase.Count == 0) continue;

                // Header de fase
                sectionsPanel.Children.Add(new Border {
                    Margin = new Thickness(0, 8, 0, 6),
                    Child = new TextBlock {
                        Text = FASE_LABEL.ContainsKey(fase) ? FASE_LABEL[fase] : ("Fase " + fase),
                        Foreground = FaseColor(fase), FontSize = 12, FontWeight = FontWeights.Bold }
                });

                foreach (var it in ofFase)
                {
                    var cb = new CheckBox {
                        Content = new TextBlock { Text = it.Texto, TextWrapping = TextWrapping.Wrap, Foreground = TEXT, FontSize = 12 },
                        Margin = new Thickness(2, 4, 2, 4), Foreground = TEXT, IsChecked = false,
                        Cursor = System.Windows.Input.Cursors.Hand, VerticalContentAlignment = VerticalAlignment.Center
                    };
                    it.Box = cb;
                    cb.Checked   += OnCheckChanged;
                    cb.Unchecked += OnCheckChanged;
                    sectionsPanel.Children.Add(cb);
                }
            }
        }

        // ═══ Eventos ══════════════════════════════════════════════════════════
        private void OnCheckChanged(object sender, RoutedEventArgs e)
        {
            if (applyingRemote) return;        // cambio venido del poll, no re-escribir
            lastLocalChangeUtc = DateTime.UtcNow;
            UpdateGoButton();
            _ = SaveStateAsync();              // escritura inmediata (fire-and-forget)
        }

        private async void OnGoClick(object sender, RoutedEventArgs e)
        {
            if (!AllChecked()) return;
            goConfirmed = true;
            ShowGoConfirmed();
            await SaveGoAsync();
        }

        // ═══ Lógica de estado ════════════════════════════════════════════════
        private bool AllChecked() => items.Count > 0 && items.All(i => i.Box != null && i.Box.IsChecked == true);

        private void UpdateGoButton()
        {
            if (inNoticiaWindow)
            {
                goButton.IsEnabled   = false;
                goButton.Content     = "🚫 NO OPERAR — noticia roja";
                goButton.Background   = RED;
                goButton.Foreground   = Brushes.White;
                goButton.BorderBrush  = RED;
                return;
            }
            if (goConfirmed) { ShowGoConfirmed(); return; }
            if (AllChecked())
            {
                goButton.IsEnabled  = true;
                goButton.Content    = "GO — operar";
                goButton.Background  = ACCENT;
                goButton.Foreground  = Brushes.White;
                goButton.BorderBrush = ACCENT;
            }
            else
            {
                goButton.IsEnabled  = false;
                int done = items.Count(i => i.Box != null && i.Box.IsChecked == true);
                goButton.Content    = $"GO — faltan {items.Count - done} de {items.Count}";
                goButton.Background  = Brush("#2A2A26");
                goButton.Foreground  = TEXT2;
                goButton.BorderBrush = BORDER;
            }
        }

        private void ShowGoConfirmed()
        {
            goButton.IsEnabled  = false;
            goButton.Content    = "✓ VISTO BUENO PARA OPERAR";
            goButton.Background  = ACCENT;
            goButton.Foreground  = Brushes.White;
            goButton.BorderBrush = ACCENT;
        }

        private void SetStatus(string text, Brush color)
        {
            statusText.Text = text;
            statusText.Foreground = color;
        }

        // ═══ Noticia roja: hora + ventana de bloqueo ±5 min ══════════════════
        // Minutos del día de "HH:MM"; -1 si no es válida.
        private static int ParseHhmm(string s)
        {
            if (string.IsNullOrWhiteSpace(s)) return -1;
            var parts = s.Trim().Split(':');
            if (parts.Length < 2) return -1;
            int h, m;
            if (!int.TryParse(parts[0], out h) || !int.TryParse(parts[1], out m)) return -1;
            if (h < 0 || h > 23 || m < 0 || m > 59) return -1;
            return h * 60 + m;
        }
        private static string FmtMin(int t) { int x = ((t % 1440) + 1440) % 1440; return (x / 60).ToString("00") + ":" + (x % 60).ToString("00"); }

        private void OnHoraChanged(object sender, TextChangedEventArgs e)
        {
            if (applyingRemote) return;
            lastHoraChangeUtc = DateTime.UtcNow;
            string txt = horaBox.Text.Trim();
            // Guardar solo cuando está vacío (limpiar) o es una hora válida completa
            if (txt.Length == 0) _ = SaveHoraAsync(null);
            else if (ParseHhmm(txt) >= 0) _ = SaveHoraAsync(txt);
            UpdateNoticiaAlert();
        }

        private async Task SaveHoraAsync(string hhmm)
        {
            try
            {
                var body = new JObject { ["sesion_date"] = currentDate, ["hora_noticia_roja"] = (hhmm == null ? (JToken)JValue.CreateNull() : (JToken)hhmm) };
                await UpsertSesionAsync(body).ConfigureAwait(false);
                await Dispatcher.InvokeAsync(() => SetStatus("🟢 Sincronizado", ACCENT));
            }
            catch (Exception ex)
            {
                await Dispatcher.InvokeAsync(() => SetStatus("🟡 Hora sin guardar (sin conexión)", WARNING));
                NinjaTrader.Code.Output.Process("ChecklistChaumer SaveHora: " + ex.Message, PrintTo.OutputTab1);
            }
        }

        // Evalúa la ventana contra la hora actual ET y actualiza panel + GO + ítem.
        private void UpdateNoticiaAlert()
        {
            int n = ParseHhmm(horaBox.Text);
            bool wasIn = inNoticiaWindow;
            if (n < 0)
            {
                inNoticiaWindow = false;
                noticiaWin.Text = "Sin noticia";
                noticiaWin.Foreground = TEXT2;
                noticiaCard.Background = CARD;
                noticiaCard.BorderBrush = BORDER;
            }
            else
            {
                int now = (int)EtNow().TimeOfDay.TotalMinutes;
                inNoticiaWindow = Math.Abs(now - n) <= NOTICIA_MARGEN_MIN;
                string win = FmtMin(n - NOTICIA_MARGEN_MIN) + " → " + FmtMin(n + NOTICIA_MARGEN_MIN);
                if (inNoticiaWindow)
                {
                    noticiaWin.Text = "🚫 NO OPERAR · " + win;
                    noticiaWin.Foreground = Brushes.White;
                    noticiaCard.Background = RED;
                    noticiaCard.BorderBrush = RED;
                }
                else
                {
                    noticiaWin.Text = "No operar " + win;
                    noticiaWin.Foreground = Brush("#E87C7B");
                    noticiaCard.Background = CARD;
                    noticiaCard.BorderBrush = Brush("#5A2A2A");
                }
            }
            // Auto-marcar el ítem "No operar con noticia roja" (chk_noticias):
            // respetado (true) mientras NO estemos dentro de la ventana; false dentro.
            AutoMarkNoticia(!inNoticiaWindow);
            if (wasIn != inNoticiaWindow) UpdateGoButton();
        }

        private void AutoMarkNoticia(bool respetado)
        {
            var it = items.FirstOrDefault(x => x.Clave == "chk_noticias");
            if (it == null || it.Box == null) return;
            if ((it.Box.IsChecked == true) == respetado) return;   // ya está en el estado deseado
            applyingRemote = true;
            it.Box.IsChecked = respetado;
            applyingRemote = false;
            _ = SaveStateAsync();
        }

        // ═══ Red (Supabase REST) ═════════════════════════════════════════════
        private async Task LoadCatalogAsync()
        {
            try
            {
                string url = SUPABASE_URL + "/rest/v1/reglas?es_checklist=eq.true&activa=eq.true&order=fase.asc,orden.asc&select=clave:codigo,fase,texto:titulo,orden";
                string json = await http.GetStringAsync(url).ConfigureAwait(false);
                var arr = JArray.Parse(json);

                await Dispatcher.InvokeAsync(() =>
                {
                    items.Clear();
                    foreach (var t in arr)
                        items.Add(new Item {
                            Clave = (string)t["clave"],
                            Fase  = t["fase"] != null && t["fase"].Type != JTokenType.Null ? (int)t["fase"] : 1,
                            Texto = (string)t["texto"]
                        });
                    RenderSections();
                    UpdateGoButton();
                });
            }
            catch (Exception ex)
            {
                await Dispatcher.InvokeAsync(() => SetStatus("🔴 No se pudo cargar el checklist", RED));
                NinjaTrader.Code.Output.Process("ChecklistChaumer LoadCatalog: " + ex.Message, PrintTo.OutputTab1);
            }
        }

        private async Task LoadStateAsync()
        {
            try
            {
                string url = SUPABASE_URL + "/rest/v1/sesiones?sesion_date=eq." + currentDate + "&select=checklist,checklist_go_at,hora_noticia_roja";
                string json = await http.GetStringAsync(url).ConfigureAwait(false);
                var arr = JArray.Parse(json);

                JObject checklist = null;
                bool hasGo = false;
                string horaRemota = null;
                if (arr.Count > 0)
                {
                    checklist = arr[0]["checklist"] as JObject;
                    var goAt = arr[0]["checklist_go_at"];
                    hasGo = goAt != null && goAt.Type != JTokenType.Null;
                    var hn = arr[0]["hora_noticia_roja"];
                    if (hn != null && hn.Type != JTokenType.Null) horaRemota = (string)hn;
                }

                await Dispatcher.InvokeAsync(() =>
                {
                    // No pisar al usuario si acaba de tocar algo (margen 3s)
                    if ((DateTime.UtcNow - lastLocalChangeUtc).TotalSeconds < 3) { SetStatus("🟢 Sincronizado", ACCENT); return; }

                    applyingRemote = true;
                    foreach (var it in items)
                    {
                        if (it.Box == null) continue;
                        bool val = checklist != null && checklist[it.Clave] != null && (bool)checklist[it.Clave];
                        if (it.Box.IsChecked != val) it.Box.IsChecked = val;
                    }
                    // Hora de la noticia (no pisar si el usuario la está editando)
                    if ((DateTime.UtcNow - lastHoraChangeUtc).TotalSeconds >= 3)
                    {
                        string h = horaRemota ?? "";
                        if (horaBox.Text != h) horaBox.Text = h;
                    }
                    applyingRemote = false;

                    if (hasGo && !goConfirmed) { goConfirmed = true; ShowGoConfirmed(); }
                    else if (!goConfirmed) UpdateGoButton();

                    UpdateNoticiaAlert();
                    SetStatus("🟢 Sincronizado", ACCENT);
                });
            }
            catch (Exception ex)
            {
                await Dispatcher.InvokeAsync(() => SetStatus("🟡 Reintentando… (sin conexión)", WARNING));
                NinjaTrader.Code.Output.Process("ChecklistChaumer LoadState: " + ex.Message, PrintTo.OutputTab1);
            }
        }

        private async Task SaveStateAsync()
        {
            try
            {
                var checklist = new JObject();
                foreach (var it in items) checklist[it.Clave] = (it.Box != null && it.Box.IsChecked == true);
                var body = new JObject { ["sesion_date"] = currentDate, ["checklist"] = checklist };
                await UpsertSesionAsync(body).ConfigureAwait(false);
                await Dispatcher.InvokeAsync(() => SetStatus("🟢 Sincronizado", ACCENT));
            }
            catch (Exception ex)
            {
                await Dispatcher.InvokeAsync(() => SetStatus("🟡 Cambios sin guardar (sin conexión)", WARNING));
                NinjaTrader.Code.Output.Process("ChecklistChaumer SaveState: " + ex.Message, PrintTo.OutputTab1);
            }
        }

        private async Task SaveGoAsync()
        {
            try
            {
                var checklist = new JObject();
                foreach (var it in items) checklist[it.Clave] = (it.Box != null && it.Box.IsChecked == true);
                var body = new JObject {
                    ["sesion_date"]     = currentDate,
                    ["checklist"]       = checklist,
                    ["checklist_go_at"] = DateTime.UtcNow.ToString("o", CultureInfo.InvariantCulture)
                };
                await UpsertSesionAsync(body).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process("ChecklistChaumer SaveGo: " + ex.Message, PrintTo.OutputTab1);
            }
        }

        // Upsert por sesion_date (no pisa otras columnas como los niveles de precio)
        private async Task UpsertSesionAsync(JObject body)
        {
            var req = new HttpRequestMessage(HttpMethod.Post,
                SUPABASE_URL + "/rest/v1/sesiones?on_conflict=sesion_date");
            req.Headers.Add("Prefer", "resolution=merge-duplicates");
            req.Content = new StringContent(body.ToString(), Encoding.UTF8, "application/json");
            var res = await http.SendAsync(req).ConfigureAwait(false);
            if (!res.IsSuccessStatusCode)
                throw new Exception("HTTP " + (int)res.StatusCode + ": " + await res.Content.ReadAsStringAsync().ConfigureAwait(false));
        }

        // ═══ Timer: poll + reset por sesión ══════════════════════════════════
        private void StartTimer()
        {
            timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(POLL_SECONDS) };
            timer.Tick += async (s, e) =>
            {
                CheckSessionReset();
                UpdateNoticiaAlert();   // reevaluar la ventana en vivo cada tick
                await LoadStateAsync();
            };
            timer.Start();
        }

        private void CheckSessionReset()
        {
            DateTime etNow = EtNow();
            string etToday = etNow.ToString("yyyy-MM-dd");

            // Cambió el día y ya pasamos la hora de reset → nueva sesión
            if (etToday != currentDate && etNow.TimeOfDay >= RESET_TIME_ET)
            {
                currentDate = etToday;
                goConfirmed = false;
                applyingRemote = true;
                foreach (var it in items) if (it.Box != null) it.Box.IsChecked = false;
                if (horaBox != null) horaBox.Text = "";   // nueva sesión: limpiar la hora del día
                applyingRemote = false;
                dateText.Text = currentDate;
                UpdateNoticiaAlert();
                UpdateGoButton();

                // Reflejar el reset en BD solo en días hábiles (evita filas de fin de semana)
                if (etNow.DayOfWeek != DayOfWeek.Saturday && etNow.DayOfWeek != DayOfWeek.Sunday)
                    _ = SaveStateAsync();
            }
        }

        // ═══ Helpers ═════════════════════════════════════════════════════════
        private static HttpClient CreateHttp()
        {
            var key = ReadServiceKey();
            var c = new HttpClient();
            c.DefaultRequestHeaders.Add("apikey",        key);
            c.DefaultRequestHeaders.Add("Authorization", "Bearer " + key);
            c.Timeout = TimeSpan.FromSeconds(15);
            return c;
        }

        private static TimeZoneInfo EtZone()
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById("Eastern Standard Time"); }   // Windows (incluye DST)
            catch { return TimeZoneInfo.FindSystemTimeZoneById("America/New_York"); }       // fallback
        }
        private static DateTime EtNow() => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, EtZone());
        private static string TradingDateEt() => EtNow().ToString("yyyy-MM-dd");

        private static Brush Brush(string hex)
        {
            var b = (SolidColorBrush)(new BrushConverter().ConvertFromString(hex));
            b.Freeze();
            return b;
        }

        // ── Persistencia local de la ventana ──
        private void SaveWindowConfig()
        {
            try
            {
                var cfg = new JObject {
                    ["left"] = Left, ["top"] = Top, ["width"] = Width, ["height"] = Height,
                    ["topmost"] = Topmost
                };
                File.WriteAllText(ConfigPath, cfg.ToString());
            }
            catch (Exception ex) { NinjaTrader.Code.Output.Process("ChecklistChaumer SaveConfig: " + ex.Message, PrintTo.OutputTab1); }
        }

        private void RestoreWindowConfig()
        {
            try
            {
                if (!File.Exists(ConfigPath)) return;
                var cfg = JObject.Parse(File.ReadAllText(ConfigPath));
                if (cfg["width"]  != null) Width  = (double)cfg["width"];
                if (cfg["height"] != null) Height = (double)cfg["height"];
                if (cfg["left"]   != null) Left   = (double)cfg["left"];
                if (cfg["top"]    != null) Top    = (double)cfg["top"];
                if (cfg["topmost"] != null && (bool)cfg["topmost"]) { Topmost = true; pinButton.IsChecked = true; }
            }
            catch (Exception ex) { NinjaTrader.Code.Output.Process("ChecklistChaumer RestoreConfig: " + ex.Message, PrintTo.OutputTab1); }
        }
    }
}
