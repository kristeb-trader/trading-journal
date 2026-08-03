// ═══════════════════════════════════════════════════════════════════════════
//  ChecklistChaumer — AddOn de NinjaTrader 8
//
//  Panel flotante con el checklist de disciplina (metodología Chaumer, NQ/MNQ)
//  sincronizado con Supabase (misma tabla sesion_checklist que el Trading Journal web).
//
//  - Ventana flotante independiente (NTWindow): mover, redimensionar, always-on-top.
//  - Persiste posición/tamaño/topmost/setup en archivo local.
//  - Ítems traídos del catálogo `catalogo_reglas` (es_checklist=true), agrupados por fase
//    en tarjetas. Selector IRI | Reingreso: Fase 2 muestra los ítems comunes +
//    los del setup elegido (mismas claves JSONB; cambiar de setup no borra marcas).
//  - Botón GO: se habilita con el 100% de los ítems VISIBLES; al pulsarlo sella la hora en BD.
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
        // Checked vive en el Item (no solo en el CheckBox): los ítems del setup
        // no visible conservan su marca aunque su Box no esté renderizado.
        // BloqueaGo: hay que marcarla para poder dar GO. Las que van en false describen
        //   hechos POSTERIORES a la entrada (consecución, gestión): marcarlas antes de
        //   tiempo obligaba a mentir o a perder el trade esperando a llenar el checklist.
        // Evidencia: "auto" = la resuelve el sistema con los trades del día; no se marca.
        private class Item {
            public string Clave; public int Fase; public string Setup; public string Texto;
            public bool Checked; public CheckBox Box;
            public bool BloqueaGo = true; public string Evidencia = "declarada";
            public bool EsAuto { get { return Evidencia == "auto"; } }
        }
        private readonly List<Item> items = new List<Item>();

        // Noticias rojas del día: varias, cada una con su ventana de ±5 min sobre la
        // ENTRADA. Estar ya dentro de una posición cuando sale la noticia es válido.
        private class Noticia {
            public string Hora; public string Nombre;
            public TextBox HoraBox; public TextBox NombreBox;
        }
        private readonly List<Noticia> noticias = new List<Noticia>();

        // Familias de setup: se leen de catalogo_setups, así un setup nuevo sale
        // solo (antes eran dos botones fijos IRI/REINGRESO en el código).
        private class SetupDef { public string Codigo; public string Nombre; }
        private readonly List<SetupDef> setups = new List<SetupDef>();
        private static readonly List<SetupDef> SETUPS_FALLBACK = new List<SetupDef> {
            new SetupDef { Codigo = "iri",       Nombre = "IRI" },
            new SetupDef { Codigo = "reingreso", Nombre = "REINGRESO" },
        };
        private string selectedSetup = "iri";       // código de la familia (persistido en config local)
        private string currentDate;                 // sesion_date en uso (fecha ET)
        private DateTime lastLocalChangeUtc = DateTime.MinValue;
        private DateTime lastHoraChangeUtc = DateTime.MinValue;
        private bool applyingRemote = false;        // evita re-disparar writes al aplicar estado remoto
        private bool goConfirmed = false;
        private bool inNoticiaWindow = false;       // dentro de la ventana ±5 min de la noticia roja
        private const int NOTICIA_MARGEN_MIN = 5;   // ventana de bloqueo ±5 min
        private DispatcherTimer timer;
        private DispatcherTimer noticiasSaveTimer;  // debounce al escribir las noticias

        // UI refs
        private StackPanel sectionsPanel;
        private Grid setupGrid;                                  // contenedor de los botones de setup
        private readonly Dictionary<string, Button> setupBtns    // código → botón
            = new Dictionary<string, Button>();
        private readonly Dictionary<int, TextBlock> faseBadges = new Dictionary<int, TextBlock>();
        private Button goButton;
        private Border statusBanner;
        private TextBlock statusText;
        private TextBlock dateText;
        private ToggleButton pinButton;
        private StackPanel noticiasPanel;           // filas de noticias rojas (hora + nombre)
        private Border noticiaCard;
        private TextBlock noticiaWin;               // ventana / estado NO OPERAR

        private string ConfigPath => Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "NinjaTrader 8", "checklist-chaumer-config.json");

        public ChecklistChaumerWindow()
        {
            Caption = "Checklist Chaumer";
            Width = 340; Height = 620;
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
            root.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto }); // selector de setup
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

            // Panel de noticias rojas: VARIAS por día, cada una con su ventana ±5 min.
            var noticiaInner = new StackPanel { Margin = new Thickness(8, 6, 8, 6) };
            var noticiaHead = new Grid();
            noticiaHead.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
            noticiaHead.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
            var noticiaLbl = new TextBlock {
                Text = "🚫 Noticias rojas", Foreground = TEXT2, FontSize = 11,
                VerticalAlignment = VerticalAlignment.Center };
            Grid.SetColumn(noticiaLbl, 0);
            noticiaHead.Children.Add(noticiaLbl);
            var addBtn = new Button {
                Content = "+", Width = 22, Height = 20, FontSize = 12, FontWeight = FontWeights.Bold,
                Background = Brush("#2A2A26"), Foreground = ACCENT, BorderBrush = BORDER,
                BorderThickness = new Thickness(1), Cursor = System.Windows.Input.Cursors.Hand,
                ToolTip = "Añadir noticia roja"
            };
            addBtn.Click += (s, e) => { AddNoticia(null, null); RenderNoticias(); };
            Grid.SetColumn(addBtn, 1);
            noticiaHead.Children.Add(addBtn);
            noticiaInner.Children.Add(noticiaHead);

            noticiasPanel = new StackPanel { Margin = new Thickness(0, 4, 0, 0) };
            noticiaInner.Children.Add(noticiasPanel);

            noticiaWin = new TextBlock {
                Text = "Sin noticias", Foreground = TEXT2, FontSize = 11, TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(0, 4, 0, 0) };
            noticiaInner.Children.Add(noticiaWin);
            noticiaCard = new Border {
                Background = CARD, BorderBrush = BORDER, BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(6), Margin = new Thickness(12, 0, 12, 8), Child = noticiaInner
            };
            Grid.SetRow(noticiaCard, 2);
            root.Children.Add(noticiaCard);

            // Selector de setup — filtra la Fase 2. Los botones se construyen en
            // BuildSetupButtons() desde catalogo_setups (uno por familia).
            setupGrid = new Grid { Margin = new Thickness(12, 0, 12, 8) };
            Grid.SetRow(setupGrid, 3);
            root.Children.Add(setupGrid);
            if (setups.Count == 0) setups.AddRange(SETUPS_FALLBACK);
            BuildSetupButtons();

            // Checklist (scroll)
            sectionsPanel = new StackPanel { Margin = new Thickness(12, 0, 12, 8) };
            var scroll = new ScrollViewer {
                VerticalScrollBarVisibility = ScrollBarVisibility.Auto, Content = sectionsPanel };
            Grid.SetRow(scroll, 4);
            root.Children.Add(scroll);

            // GO
            goButton = new Button {
                Content = "GO — completa el checklist", Height = 48, Margin = new Thickness(12, 4, 12, 12),
                FontSize = 15, FontWeight = FontWeights.Bold, Foreground = TEXT2,
                Background = Brush("#2A2A26"), BorderBrush = BORDER, BorderThickness = new Thickness(1),
                IsEnabled = false, Cursor = System.Windows.Input.Cursors.Hand
            };
            goButton.Click += OnGoClick;
            Grid.SetRow(goButton, 5);
            root.Children.Add(goButton);

            StyleSetupButtons();
            return root;
        }

        // Un botón por familia, en columnas iguales. Se rehace cuando llega el
        // catálogo de BD (puede haber más de dos setups).
        private void BuildSetupButtons()
        {
            if (setupGrid == null) return;
            setupGrid.Children.Clear();
            setupGrid.ColumnDefinitions.Clear();
            setupBtns.Clear();

            for (int i = 0; i < setups.Count; i++)
            {
                setupGrid.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                var s = setups[i];
                var margin = new Thickness(i == 0 ? 0 : 3, 0, i == setups.Count - 1 ? 0 : 3, 0);
                var btn = MakeSetupButton(s.Nombre.ToUpperInvariant(), s.Codigo, margin);
                Grid.SetColumn(btn, i);
                setupGrid.Children.Add(btn);
                setupBtns[s.Codigo] = btn;
            }

            // Si el setup persistido ya no existe (familia borrada o renombrada),
            // caer al primero para no quedar sin selección válida.
            if (setups.Count > 0 && !setupBtns.ContainsKey(selectedSetup))
                selectedSetup = setups[0].Codigo;

            StyleSetupButtons();
        }

        private Button MakeSetupButton(string label, string key, Thickness margin)
        {
            var btn = new Button {
                Content = label, Height = 30, Margin = margin, FontSize = 12,
                FontWeight = FontWeights.Bold, Cursor = System.Windows.Input.Cursors.Hand,
                Background = CARD, Foreground = TEXT2, BorderBrush = BORDER, BorderThickness = new Thickness(1)
            };
            btn.Click += (s, e) => SelectSetup(key);
            return btn;
        }

        private void SelectSetup(string key)
        {
            if (selectedSetup == key) return;
            selectedSetup = key;
            StyleSetupButtons();
            RenderSections();       // re-render con el filtro nuevo (las marcas viven en Item.Checked)
            UpdateGoButton();
            SaveWindowConfig();
        }

        private void StyleSetupButtons()
        {
            foreach (var kv in setupBtns)
            {
                bool on = kv.Key == selectedSetup;
                kv.Value.Background  = on ? ACCENT : CARD;
                kv.Value.Foreground  = on ? Brushes.White : TEXT2;
                kv.Value.BorderBrush = on ? ACCENT : BORDER;
            }
        }

        // Ítem visible: común (sin setup) o del setup seleccionado
        private bool IsVisible(Item i) => string.IsNullOrEmpty(i.Setup) || i.Setup == selectedSetup;

        private void RenderSections()
        {
            sectionsPanel.Children.Clear();
            faseBadges.Clear();
            foreach (var it in items) it.Box = null;   // los no visibles quedan sin Box (estado en Item.Checked)
            bool goSepPuesto = false;                  // el separador ▶ GO se pinta una sola vez

            foreach (int fase in new[] { 1, 2, 3 })
            {
                var ofFase = items.Where(i => i.Fase == fase && IsVisible(i)).ToList();
                if (ofFase.Count == 0) continue;

                var faseStack = new StackPanel();

                // Header de fase: título + badge de progreso (n/m)
                var head = new Grid();
                head.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                head.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
                var lbl = new TextBlock {
                    Text = FASE_LABEL.ContainsKey(fase) ? FASE_LABEL[fase] : ("Fase " + fase),
                    Foreground = FaseColor(fase), FontSize = 12, FontWeight = FontWeights.Bold };
                Grid.SetColumn(lbl, 0);
                head.Children.Add(lbl);
                var badge = new TextBlock { Foreground = TEXT2, FontSize = 11, FontWeight = FontWeights.Bold };
                Grid.SetColumn(badge, 1);
                head.Children.Add(badge);
                faseBadges[fase] = badge;
                faseStack.Children.Add(head);
                faseStack.Children.Add(new Border { Height = 1, Background = BORDER, Margin = new Thickness(0, 6, 0, 3) });

                foreach (var it in ofFase)
                {
                    // Separador del GO: se pinta UNA sola vez en todo el checklist, justo
                    // antes del primer ítem que ya no bloquea (cae dentro de la Fase 2).
                    if (!goSepPuesto && !it.BloqueaGo)
                    {
                        goSepPuesto = true;
                        var sep = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(0, 7, 0, 3) };
                        sep.Children.Add(new Border {
                            Background = Brush("#1F3D33"), BorderBrush = ACCENT, BorderThickness = new Thickness(1),
                            CornerRadius = new CornerRadius(9), Padding = new Thickness(7, 1, 7, 1),
                            Child = new TextBlock { Text = "▶ GO", Foreground = ACCENT, FontSize = 10, FontWeight = FontWeights.Bold }
                        });
                        sep.Children.Add(new TextBlock {
                            Text = "  se marca después de entrar", Foreground = TEXT2, FontSize = 10,
                            VerticalAlignment = VerticalAlignment.Center });
                        faseStack.Children.Add(sep);
                    }

                    // Ítems verificados por dato: no se marcan, los resuelve el journal
                    // con los trades del día. Se muestran para no esconder que existen.
                    if (it.EsAuto)
                    {
                        var auto = new StackPanel { Orientation = Orientation.Horizontal, Margin = new Thickness(2, 4, 2, 4) };
                        auto.Children.Add(new TextBlock {
                            Text = "⚙ ", Foreground = Brush("#60A5FA"), FontSize = 12,
                            VerticalAlignment = VerticalAlignment.Center });
                        auto.Children.Add(new TextBlock {
                            Text = it.Texto, TextWrapping = TextWrapping.Wrap, Foreground = TEXT2, FontSize = 11,
                            VerticalAlignment = VerticalAlignment.Center, MaxWidth = 250 });
                        auto.ToolTip = "Se verifica solo con los trades del día";
                        faseStack.Children.Add(auto);
                        it.Box = null;
                        continue;
                    }

                    var cb = new CheckBox {
                        Content = new TextBlock { Text = it.Texto, TextWrapping = TextWrapping.Wrap, Foreground = TEXT, FontSize = 12 },
                        Margin = new Thickness(2, 4, 2, 4), Foreground = TEXT, IsChecked = it.Checked,
                        Cursor = System.Windows.Input.Cursors.Hand, VerticalContentAlignment = VerticalAlignment.Center
                    };
                    it.Box = cb;
                    cb.Checked   += OnCheckChanged;
                    cb.Unchecked += OnCheckChanged;
                    faseStack.Children.Add(cb);
                }

                // Tarjeta de la fase: barra de acento a la izquierda + contenido
                var inner = new Grid();
                inner.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(3) });
                inner.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                var accentBar = new Border { Background = FaseColor(fase), CornerRadius = new CornerRadius(2) };
                Grid.SetColumn(accentBar, 0);
                inner.Children.Add(accentBar);
                faseStack.Margin = new Thickness(9, 0, 0, 0);
                Grid.SetColumn(faseStack, 1);
                inner.Children.Add(faseStack);

                sectionsPanel.Children.Add(new Border {
                    Background = CARD, BorderBrush = BORDER, BorderThickness = new Thickness(1),
                    CornerRadius = new CornerRadius(8), Padding = new Thickness(10, 8, 10, 8),
                    Margin = new Thickness(0, 0, 0, 8), Child = inner
                });
            }
            UpdateFaseBadges();
        }

        private void UpdateFaseBadges()
        {
            foreach (var kv in faseBadges)
            {
                // Los ítems automáticos no se marcan: no cuentan para el progreso.
                var ofFase = items.Where(i => i.Fase == kv.Key && IsVisible(i) && !i.EsAuto).ToList();
                int done = ofFase.Count(i => i.Checked);
                kv.Value.Text = done + "/" + ofFase.Count;
                kv.Value.Foreground = (ofFase.Count > 0 && done == ofFase.Count) ? ACCENT : TEXT2;
            }
        }

        // ═══ Eventos ══════════════════════════════════════════════════════════
        private void OnCheckChanged(object sender, RoutedEventArgs e)
        {
            // Sincronizar Item.Checked SIEMPRE (también cuando el cambio viene del poll)
            var it = items.FirstOrDefault(x => x.Box == sender);
            if (it != null) it.Checked = ((CheckBox)sender).IsChecked == true;

            if (applyingRemote) { UpdateFaseBadges(); return; }   // cambio venido del poll, no re-escribir
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
        // El GO exige el 100% de los ítems que lo BLOQUEAN: los que se pueden responder
        // ANTES de entrar. Los demás (consecución, gestión, y los automáticos) describen
        // hechos posteriores — exigirlos aquí obligaba a marcar lo que aún no ha pasado,
        // o a perder el trade mientras se llenaba el checklist.
        private bool AllChecked()
        {
            var req = items.Where(i => IsVisible(i) && i.BloqueaGo && !i.EsAuto).ToList();
            return req.Count > 0 && req.All(i => i.Checked);
        }

        private void UpdateGoButton()
        {
            UpdateFaseBadges();
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
                var vis = items.Where(IsVisible).ToList();
                int done = vis.Count(i => i.Checked);
                goButton.Content    = $"GO — faltan {vis.Count - done} de {vis.Count}";
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

        // ── Noticias rojas (varias por día) ──────────────────────────────────
        private void AddNoticia(string hora, string nombre)
        {
            noticias.Add(new Noticia { Hora = hora ?? "", Nombre = nombre ?? "" });
        }

        // Reconstruye las filas: [hora] [nombre] [x]
        private void RenderNoticias()
        {
            if (noticiasPanel == null) return;
            noticiasPanel.Children.Clear();
            foreach (var n in noticias.ToList())
            {
                var row = new Grid { Margin = new Thickness(0, 2, 0, 2) };
                row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });
                row.ColumnDefinitions.Add(new ColumnDefinition { Width = new GridLength(1, GridUnitType.Star) });
                row.ColumnDefinitions.Add(new ColumnDefinition { Width = GridLength.Auto });

                var hb = new TextBox {
                    Width = 52, Height = 22, Text = n.Hora, FontSize = 11,
                    Background = Brush("#2A2A26"), Foreground = TEXT, BorderBrush = BORDER,
                    BorderThickness = new Thickness(1), VerticalContentAlignment = VerticalAlignment.Center,
                    ToolTip = "Hora de la noticia (HH:MM, hora ET)"
                };
                var nb = new TextBox {
                    Height = 22, Text = n.Nombre, FontSize = 11, Margin = new Thickness(4, 0, 4, 0),
                    Background = Brush("#2A2A26"), Foreground = TEXT2, BorderBrush = BORDER,
                    BorderThickness = new Thickness(1), VerticalContentAlignment = VerticalAlignment.Center,
                    ToolTip = "Nombre (ISM, NFP…)"
                };
                var del = new Button {
                    Content = "✕", Width = 20, Height = 20, FontSize = 10,
                    Background = Brush("#2A2A26"), Foreground = TEXT2, BorderBrush = BORDER,
                    BorderThickness = new Thickness(1), Cursor = System.Windows.Input.Cursors.Hand
                };
                n.HoraBox = hb; n.NombreBox = nb;
                hb.TextChanged += OnNoticiasChanged;
                nb.TextChanged += OnNoticiasChanged;
                del.Click += (s, e) => { noticias.Remove(n); RenderNoticias(); OnNoticiasChanged(null, null); };

                Grid.SetColumn(hb, 0); Grid.SetColumn(nb, 1); Grid.SetColumn(del, 2);
                row.Children.Add(hb); row.Children.Add(nb); row.Children.Add(del);
                noticiasPanel.Children.Add(row);
            }
            UpdateNoticiaAlert();
        }

        private void OnNoticiasChanged(object sender, TextChangedEventArgs e)
        {
            if (applyingRemote) return;
            lastHoraChangeUtc = DateTime.UtcNow;
            foreach (var n in noticias)
            {
                if (n.HoraBox != null)   n.Hora   = n.HoraBox.Text.Trim();
                if (n.NombreBox != null) n.Nombre = n.NombreBox.Text.Trim();
            }
            UpdateNoticiaAlert();

            // Debounce: guardar 900 ms después de la última tecla. Sin esto, escribir
            // "ISM Manufacturing PMI" lanzaría un DELETE+INSERT por cada pulsación.
            if (noticiasSaveTimer == null)
            {
                noticiasSaveTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(900) };
                noticiasSaveTimer.Tick += (s2, e2) => { noticiasSaveTimer.Stop(); _ = SaveNoticiasAsync(); };
            }
            noticiasSaveTimer.Stop();
            noticiasSaveTimer.Start();
        }

        // Reemplaza el set del día en `sesion_noticias`. Un trigger sincroniza
        // `sesiones.hora_noticia_roja` para el Worker y la web.
        private async Task SaveNoticiasAsync()
        {
            if (EsFinDeSemana()) return;
            try
            {
                // La fila de sesiones debe existir antes (FK)
                await UpsertSesionAsync(new JObject { ["sesion_date"] = currentDate }).ConfigureAwait(false);

                var del = new HttpRequestMessage(HttpMethod.Delete,
                    SUPABASE_URL + "/rest/v1/sesion_noticias?sesion_date=eq." + currentDate);
                var dres = await http.SendAsync(del).ConfigureAwait(false);
                if (!dres.IsSuccessStatusCode)
                    throw new Exception("DELETE HTTP " + (int)dres.StatusCode);

                var rows = new JArray();
                foreach (var n in noticias)
                {
                    if (ParseHhmm(n.Hora) < 0) continue;   // hora incompleta: aún se está escribiendo
                    rows.Add(new JObject {
                        ["sesion_date"] = currentDate,
                        ["hora"] = n.Hora,
                        ["nombre"] = string.IsNullOrWhiteSpace(n.Nombre) ? (JToken)JValue.CreateNull() : (JToken)n.Nombre
                    });
                }
                if (rows.Count > 0)
                {
                    var req = new HttpRequestMessage(HttpMethod.Post, SUPABASE_URL + "/rest/v1/sesion_noticias");
                    req.Content = new StringContent(rows.ToString(), Encoding.UTF8, "application/json");
                    var res = await http.SendAsync(req).ConfigureAwait(false);
                    if (!res.IsSuccessStatusCode)
                        throw new Exception("HTTP " + (int)res.StatusCode + ": " + await res.Content.ReadAsStringAsync().ConfigureAwait(false));
                }
                await Dispatcher.InvokeAsync(() => SetStatus("🟢 Sincronizado", ACCENT));
            }
            catch (Exception ex)
            {
                await Dispatcher.InvokeAsync(() => SetStatus("🟡 Noticias sin guardar (sin conexión)", WARNING));
                NinjaTrader.Code.Output.Process("ChecklistChaumer SaveNoticias: " + ex.Message, PrintTo.OutputTab1);
            }
        }

        // Evalúa TODAS las ventanas contra la hora actual ET y actualiza panel + GO.
        // La más cercana manda: basta con estar dentro de una para bloquear.
        private void UpdateNoticiaAlert()
        {
            if (noticiaWin == null || noticiaCard == null) return;
            bool wasIn = inNoticiaWindow;
            var validas = noticias.Where(n => ParseHhmm(n.Hora) >= 0).ToList();

            if (validas.Count == 0)
            {
                inNoticiaWindow = false;
                noticiaWin.Text = "Sin noticias";
                noticiaWin.Foreground = TEXT2;
                noticiaCard.Background = CARD;
                noticiaCard.BorderBrush = BORDER;
            }
            else
            {
                int now = (int)EtNow().TimeOfDay.TotalMinutes;
                inNoticiaWindow = validas.Any(n => Math.Abs(now - ParseHhmm(n.Hora)) <= NOTICIA_MARGEN_MIN);
                if (inNoticiaWindow)
                {
                    var dentro = validas.First(n => Math.Abs(now - ParseHhmm(n.Hora)) <= NOTICIA_MARGEN_MIN);
                    int m = ParseHhmm(dentro.Hora);
                    noticiaWin.Text = "🚫 NO OPERAR · " + FmtMin(m - NOTICIA_MARGEN_MIN) + " → " + FmtMin(m + NOTICIA_MARGEN_MIN);
                    noticiaWin.Foreground = Brushes.White;
                    noticiaCard.Background = RED;
                    noticiaCard.BorderBrush = RED;
                }
                else
                {
                    // Fuera de ventana: anunciar la PRÓXIMA del día (la ya pasada no importa)
                    var futuras = validas.Where(n => ParseHhmm(n.Hora) > now).OrderBy(n => ParseHhmm(n.Hora)).ToList();
                    if (futuras.Count > 0)
                    {
                        var prox = futuras.First();
                        int m = ParseHhmm(prox.Hora);
                        string quien = string.IsNullOrWhiteSpace(prox.Nombre) ? "" : " (" + prox.Nombre + ")";
                        noticiaWin.Text = "Próxima" + quien + ": no operar "
                                        + FmtMin(m - NOTICIA_MARGEN_MIN) + " → " + FmtMin(m + NOTICIA_MARGEN_MIN)
                                        + "  ·  faltan " + (m - now) + " min";
                    }
                    else
                    {
                        noticiaWin.Text = validas.Count + " noticia" + (validas.Count != 1 ? "s" : "") + " · todas pasadas";
                    }
                    noticiaWin.Foreground = Brush("#E87C7B");
                    noticiaCard.Background = CARD;
                    noticiaCard.BorderBrush = Brush("#5A2A2A");
                }
            }
            if (wasIn != inNoticiaWindow) UpdateGoButton();
        }

        // ═══ Red (Supabase REST) ═════════════════════════════════════════════
        // Familias de setup (catalogo_setups). Si falla, se conserva lo que haya
        // (fallback IRI/REINGRESO) para no dejar la ventana sin selector.
        private async Task LoadSetupsAsync()
        {
            try
            {
                string url = SUPABASE_URL + "/rest/v1/catalogo_setups?activo=eq.true&order=orden.asc&select=codigo,nombre";
                string json = await http.GetStringAsync(url).ConfigureAwait(false);
                var arr = JArray.Parse(json);
                if (arr.Count == 0) return;

                await Dispatcher.InvokeAsync(() =>
                {
                    setups.Clear();
                    foreach (var t in arr)
                        setups.Add(new SetupDef { Codigo = (string)t["codigo"], Nombre = (string)t["nombre"] });
                    BuildSetupButtons();
                });
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process("ChecklistChaumer LoadSetups: " + ex.Message, PrintTo.OutputTab1);
            }
        }

        private async Task LoadCatalogAsync()
        {
            await LoadSetupsAsync().ConfigureAwait(false);   // el filtro de Fase 2 depende de las familias
            try
            {
                string url = SUPABASE_URL + "/rest/v1/catalogo_reglas?es_checklist=eq.true&activa=eq.true&order=fase.asc,orden.asc&select=clave:codigo,fase,setup,texto:titulo,orden,bloquea_go,evidencia";
                string json = await http.GetStringAsync(url).ConfigureAwait(false);
                var arr = JArray.Parse(json);

                await Dispatcher.InvokeAsync(() =>
                {
                    items.Clear();
                    foreach (var t in arr)
                        items.Add(new Item {
                            Clave = (string)t["clave"],
                            Fase  = t["fase"] != null && t["fase"].Type != JTokenType.Null ? (int)t["fase"] : 1,
                            Setup = t["setup"] != null && t["setup"].Type != JTokenType.Null ? (string)t["setup"] : null,
                            Texto = (string)t["texto"],
                            // Si la columna faltara (BD sin migrar), el default conserva
                            // el comportamiento anterior: todo bloquea y todo se marca.
                            BloqueaGo = t["bloquea_go"] == null || t["bloquea_go"].Type == JTokenType.Null || (bool)t["bloquea_go"],
                            Evidencia = t["evidencia"] != null && t["evidencia"].Type != JTokenType.Null ? (string)t["evidencia"] : "declarada"
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
                // El checklist vive en sesion_checklist (relacional); se trae anidado.
                // Checklist y noticias viven en tablas relacionales; se traen anidadas.
                string url = SUPABASE_URL + "/rest/v1/sesiones?sesion_date=eq." + currentDate + "&select=checklist_go_at,sesion_checklist(regla_codigo,cumplido),sesion_noticias(hora,nombre)";
                string json = await http.GetStringAsync(url).ConfigureAwait(false);
                var arr = JArray.Parse(json);

                JObject checklist = null;
                bool hasGo = false;
                var noticiasRemotas = new List<Noticia>();
                if (arr.Count > 0)
                {
                    // Reconstruye { codigo: bool } desde las filas anidadas de sesion_checklist
                    var scArr = arr[0]["sesion_checklist"] as JArray;
                    if (scArr != null)
                    {
                        checklist = new JObject();
                        foreach (var row in scArr)
                            checklist[(string)row["regla_codigo"]] = (bool)row["cumplido"];
                    }
                    var goAt = arr[0]["checklist_go_at"];
                    hasGo = goAt != null && goAt.Type != JTokenType.Null;
                    var nArr = arr[0]["sesion_noticias"] as JArray;
                    if (nArr != null)
                        foreach (var row in nArr)
                        {
                            string h = (string)row["hora"] ?? "";
                            if (h.Length >= 5) h = h.Substring(0, 5);   // "09:00:00" → "09:00"
                            noticiasRemotas.Add(new Noticia {
                                Hora = h,
                                Nombre = row["nombre"] != null && row["nombre"].Type != JTokenType.Null ? (string)row["nombre"] : ""
                            });
                        }
                    noticiasRemotas = noticiasRemotas.OrderBy(n => n.Hora).ToList();
                }

                await Dispatcher.InvokeAsync(() =>
                {
                    // No pisar al usuario si acaba de tocar algo (margen 3s)
                    if ((DateTime.UtcNow - lastLocalChangeUtc).TotalSeconds < 3) { SetStatus("🟢 Sincronizado", ACCENT); return; }

                    applyingRemote = true;
                    foreach (var it in items)
                    {
                        bool val = checklist != null && checklist[it.Clave] != null && (bool)checklist[it.Clave];
                        it.Checked = val;
                        if (it.Box != null && it.Box.IsChecked != val) it.Box.IsChecked = val;
                    }
                    // Noticias (no pisar si el usuario las está editando). Se comparan
                    // por contenido para no re-renderizar en cada poll y perder el foco.
                    if ((DateTime.UtcNow - lastHoraChangeUtc).TotalSeconds >= 3)
                    {
                        string firmaLocal  = string.Join("|", noticias.Select(n => n.Hora + "~" + n.Nombre));
                        string firmaRemota = string.Join("|", noticiasRemotas.Select(n => n.Hora + "~" + n.Nombre));
                        if (firmaLocal != firmaRemota)
                        {
                            noticias.Clear();
                            foreach (var n in noticiasRemotas) noticias.Add(n);
                            RenderNoticias();
                        }
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
                // 1) Asegura la fila de sesiones (FK de sesion_checklist; el trigger
                //    materializa las reglas en true si la fila es nueva).
                await UpsertSesionAsync(new JObject { ["sesion_date"] = currentDate }).ConfigureAwait(false);
                // 2) Escribe TODAS las claves (ambos setups): cambiar de vista no borra marcas.
                await UpsertChecklistAsync().ConfigureAwait(false);
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
                // Sella la hora del GO en sesiones (asegura también la fila) + persiste el checklist.
                await UpsertSesionAsync(new JObject {
                    ["sesion_date"]     = currentDate,
                    ["checklist_go_at"] = DateTime.UtcNow.ToString("o", CultureInfo.InvariantCulture)
                }).ConfigureAwait(false);
                await UpsertChecklistAsync().ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                NinjaTrader.Code.Output.Process("ChecklistChaumer SaveGo: " + ex.Message, PrintTo.OutputTab1);
            }
        }

        // Sábados y domingos no hay sesión de trading: el AddOn no escribe NADA en BD.
        // Sin esta guarda, abrir NinjaTrader un fin de semana dejaba una fila fantasma
        // en `sesiones` (con `no_opero=false`, el default) que el journal contaba como
        // día operado y hundía la disciplina del mes.
        private bool EsFinDeSemana()
        {
            DateTime d;
            if (!DateTime.TryParseExact(currentDate, "yyyy-MM-dd", CultureInfo.InvariantCulture,
                                        DateTimeStyles.None, out d)) return false;
            return d.DayOfWeek == DayOfWeek.Saturday || d.DayOfWeek == DayOfWeek.Sunday;
        }

        // Upsert por sesion_date (no pisa otras columnas como los niveles de precio)
        private async Task UpsertSesionAsync(JObject body)
        {
            if (EsFinDeSemana()) return;
            var req = new HttpRequestMessage(HttpMethod.Post,
                SUPABASE_URL + "/rest/v1/sesiones?on_conflict=sesion_date");
            req.Headers.Add("Prefer", "resolution=merge-duplicates");
            req.Content = new StringContent(body.ToString(), Encoding.UTF8, "application/json");
            var res = await http.SendAsync(req).ConfigureAwait(false);
            if (!res.IsSuccessStatusCode)
                throw new Exception("HTTP " + (int)res.StatusCode + ": " + await res.Content.ReadAsStringAsync().ConfigureAwait(false));
        }

        // Upsert del checklist como filas en sesion_checklist (1 por regla).
        private async Task UpsertChecklistAsync()
        {
            if (EsFinDeSemana()) return;
            var rows = new JArray();
            string now = DateTime.UtcNow.ToString("o", CultureInfo.InvariantCulture);
            foreach (var it in items)
                rows.Add(new JObject {
                    ["sesion_date"]  = currentDate,
                    ["regla_codigo"] = it.Clave,
                    ["cumplido"]     = it.Checked,
                    ["updated_at"]   = now
                });
            var req = new HttpRequestMessage(HttpMethod.Post,
                SUPABASE_URL + "/rest/v1/sesion_checklist?on_conflict=sesion_date,regla_codigo");
            req.Headers.Add("Prefer", "resolution=merge-duplicates");
            req.Content = new StringContent(rows.ToString(), Encoding.UTF8, "application/json");
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
                foreach (var it in items) { it.Checked = false; if (it.Box != null) it.Box.IsChecked = false; }
                noticias.Clear(); RenderNoticias();       // nueva sesión: sin noticias aún
                applyingRemote = false;
                dateText.Text = currentDate;
                UpdateNoticiaAlert();
                UpdateGoButton();

                // Reflejar el reset en BD (los upserts ya se auto-bloquean en fin de semana)
                if (!EsFinDeSemana()) _ = SaveStateAsync();
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
                    ["topmost"] = Topmost, ["setup"] = selectedSetup
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
                if (cfg["setup"] != null && cfg["setup"].Type != JTokenType.Null)
                {
                    // Se acepta cualquier código: la lista de familias es dinámica.
                    // Si al llegar el catálogo ese código ya no existe,
                    // BuildSetupButtons() cae al primero disponible.
                    string s = (string)cfg["setup"];
                    if (!string.IsNullOrWhiteSpace(s)) { selectedSetup = s; StyleSetupButtons(); }
                }
            }
            catch (Exception ex) { NinjaTrader.Code.Output.Process("ChecklistChaumer RestoreConfig: " + ex.Message, PrintTo.OutputTab1); }
        }
    }
}
