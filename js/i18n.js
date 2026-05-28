// Internationalization module — ES / EN
const I18n = (() => {
  const translations = {
    es: {
      // Navigation
      'nav.calendar': 'Calendario',
      'nav.images': 'Imágenes',
      'nav.trades': 'Trades',
      'nav.analysis': 'Análisis',
      'nav.annual': 'Anual',
      'nav.coach': 'Coach IA',
      'nav.register': 'Registrar',
      'nav.data': 'Datos',
      'nav.account': 'Cuenta Fondeo',

      // Header
      'header.menu': 'Menú',
      'header.connecting': 'Conectando...',
      'header.connected': 'Conectado',
      'header.disconnected': 'Sin conexión',
      'header.settings': 'Ajustes',

      // Calendar section
      'calendar.section_title': 'Calendario de Operativa',
      'calendar.prev_month': 'Mes anterior',
      'calendar.next_month': 'Mes siguiente',
      'calendar.all_accounts': 'Todas las cuentas',
      'calendar.legend.target': 'Target',
      'calendar.legend.stop': 'Stop',
      'calendar.legend.no_entries': 'Sin entradas válidas',
      'calendar.legend.no_trade': 'No operé',
      'calendar.legend.holiday': 'Festivo',

      // Calendar cell badges
      'badge.no_entries': 'Sin entradas',
      'badge.fomc': 'FOMC',
      'badge.holiday': 'Festivo',
      'badge.no_trade': 'No operé',
      'badge.be': 'B.E.',
      'badge.net_pnl': 'P&L Neto',

      // Calendar tooltips
      'tooltip.fomc': 'Día de reunión FOMC',
      'tooltip.errors': 'Errores registrados',

      // Metrics section
      'metrics.title': 'Métricas Generales',
      'metrics.period.all': 'Todo',
      'metrics.period.month': 'Este mes',
      'metrics.period.week': 'Esta semana',

      // Metric cards
      'metric.net_pnl': 'P&L Neto Total',
      'metric.net_pnl_avg': 'Promedio',
      'metric.win_rate': 'Tasa de Acierto',
      'metric.discipline': 'Disciplina',
      'metric.discipline_failed': 'sesiones con fallos',
      'metric.top_error': 'Error más frecuente',
      'metric.top_error_none': 'Sin errores registrados',
      'metric.targets_stops': 'Targets · Stops · Sin entrada',
      'metric.streak': 'Racha actual',
      'metric.streak_wins': 'victorias seguidas',
      'metric.streak_losses': 'pérdidas seguidas',
      'metric.best_day': 'Mejor día',
      'metric.worst_day': 'Peor día',
      'metric.max_drawdown': 'Max Drawdown',
      'metric.max_drawdown_sub': 'Máxima caída desde pico',
      'metric.profit_factor': 'Profit Factor',
      'metric.pf_solid': 'Sistema sólido',
      'metric.pf_marginal': 'Sistema marginal',
      'metric.pf_negative': 'Sistema negativo',
      'metric.pf_no_losses': 'Sin pérdidas en el período',
      'metric.avg_win_loss': 'Avg Win / Avg Loss',
      'metric.avg_ratio': 'Ratio',
      'metric.avg_no_data': 'Sin datos suficientes',
      'metric.total_trades': 'Total Trades',
      'metric.trading_days': 'días operados',

      // Discipline modal
      'discipline.modal_title': 'Análisis de Disciplina',
      'discipline.exec_errors': 'Errores de ejecución',
      'discipline.no_exec_errors': '✓ Sin errores de ejecución',
      'discipline.failed_days': 'Días con fallos',
      'discipline.perfect': '¡Disciplina perfecta en el período! 🎯',
      'discipline.no_sessions': 'Sin sesiones en el período.',
      'discipline.typification_errors': 'Errores de tipificación ({count} registros)',
      'discipline.no_errors': 'Sin errores registrados',
      'discipline.days_with': 'Días con "{name}"',
      'discipline.no_opero_badge': 'sin operar',
      'discipline.fallo': 'fallo',
      'discipline.fallos': 'fallos',

      // Checklist keys (long form — for modal & form)
      'chk.zonas': 'Zonas vigentes verificadas',
      'chk.orden': 'Orden precolocada a tiempo',
      'chk.5velas': 'Máx 5 velas en corrida',
      'chk.noticias': 'Sin noticia roja activa',
      'chk.consecucion': 'Zona marcada con consecución',
      'chk.estructura': 'Estructura de Impulso + Retroceso + Impulso, Fluida',
      // Short form — for discipline detail
      'chk_short.zonas': 'Zonas vigentes',
      'chk_short.orden': 'Orden a tiempo',
      'chk_short.5velas': 'Máx 5 velas',
      'chk_short.noticias': 'Sin noticias rojas',
      'chk_short.consecucion': 'Rompimiento + Consecución',
      'chk_short.estructura': 'Estructura IRI',
      'chk_short.no_errors': 'Sin errores de tipificación',
      'discipline.checklist_score': 'Disciplina',

      // Trades section
      'trades.title': 'Registro de Trades',
      'trades.search_ph': 'Buscar...',
      'trades.all_accounts': 'Todas las cuentas',
      'trades.filter.all': 'Todos',
      'trades.filter.target': 'Target',
      'trades.filter.stop': 'Stop',
      'trades.filter.no_entries': 'Sin entradas válidas',
      'trades.headers.day': 'Día',
      'trades.headers.date': 'Fecha',
      'trades.headers.time': 'Hora',
      'trades.headers.instrument': 'Instrumento',
      'trades.headers.direction': 'Dirección',
      'trades.headers.contracts': 'Contratos',
      'trades.headers.result': 'Resultado',
      'trades.headers.pnl': 'P&L',
      'trades.headers.error': 'Error',
      'trades.loading': '<i class="ti ti-loader-2 spin"></i> Cargando...',
      'trades.no_results': 'Sin resultados',
      'trades.no_errors': 'Sin Errores',
      'trades.sin_entradas': 'Sin entradas válidas',
      'trades.no_opero': 'No operé',
      'trades.see_detail': 'Ver detalle',
      'trades.edit_session': 'Editar sesión',
      'pagination.records': 'registros',
      'pagination.prev': '‹ Anterior',
      'pagination.next': 'Siguiente ›',
      'pagination.page': 'Página',
      'pagination.of': '/',

      // Register section
      'register.title': 'Registrar Sesión',
      'register.date': 'Fecha',
      'register.no_opero': 'No operé este día',
      'register.motivo': 'Motivo',
      'register.context': 'Contexto del mercado',
      'register.zones': '¿Zonas en contra?',
      'register.zones_yes': 'Sí',
      'register.zones_no': 'No',
      'register.checklist': 'Checklist',
      'register.typification': 'Tipificación de errores',
      'register.add': 'Agregar',
      'register.reflection': 'Reflexión / Análisis del trader',
      'register.reflection_ph': 'Escribe tu reflexión del día...',
      'register.notes': 'Notas / Resumen IA',
      'register.notes_ph': 'Resumen generado por el Coach IA...',
      'register.image': 'Imagen del día',
      'register.image_drag': 'Haz clic o arrastra una imagen aquí',
      'register.image_size': 'PNG, JPG o WebP · máx 10MB',
      'register.remove_image': 'Quitar imagen',
      'register.save': 'Guardar sesión',
      'register.clear': 'Limpiar',
      'register.run_number': 'Número de corrida',
      'register.candles': 'Velas en corrida',
      'register.retrace': 'Puntos de retroceso',

      // Data section
      'data.title': 'Gestión de Datos',
      'data.casuisticas': 'Casuísticas',
      'data.casuisticas_sub': 'Situaciones a tipificar por día',
      'data.emociones': 'Emociones',
      'data.emociones_sub': 'Estados emocionales del Coach IA',
      'data.new_cas_ph': 'Nueva casuística...',
      'data.new_emocion_ph': 'Nombre de emoción...',
      'data.new_emocion_emoji_ph': 'Emoji',

      // Coach IA section
      'coach.title': 'Coach IA — Estrategia Chaumer',
      'coach.tab_analysis': 'Análisis de Hoy',
      'coach.tab_history': 'Historial',
      'coach.tab_strategy': 'Estrategia',

      // Gallery section
      'gallery.title': 'Imágenes',
      'gallery.all': 'Todas',

      // Analysis section
      'analysis.title': 'Análisis y Estadísticas',
      'analysis.period.week': 'Semana',
      'analysis.period.month': 'Mes',
      'analysis.period.all': 'Todo',
      'analysis.prev_month': 'Mes anterior',
      'analysis.next_month': 'Mes siguiente',
      'analysis.all_accounts': 'Todas las cuentas',
      'analysis.help': '¿Qué es esto?',

      // Chart titles
      'chart.equity_title': 'Curva de Equity — P&L Acumulado',
      'chart.winrate_title': 'Win Rate semanal',
      'chart.pnl_day_title': 'P&L promedio por día de semana',
      'chart.pnl_hour_title': 'P&L promedio por hora (ET)',
      'chart.mae_mfe_title': 'MAE vs MFE — Gestión de excursiones',
      'chart.pnl_hist_title': 'Distribución de P&L — Frecuencia por rango',
      'chart.results_title': 'Distribución de resultados',
      'chart.discipline_title': 'Disciplina por sesión',
      'chart.disc_pnl_title': 'Disciplina vs P&L — ¿Las reglas generan dinero?',
      'chart.errors_title': 'Errores en el tiempo — Evolución semanal',

      // Chart dataset labels
      'chart.equity_label': 'P&L Acumulado',
      'chart.drawdown_label': 'Drawdown',
      'chart.pnl_avg_label': 'P&L promedio',
      'chart.pnl_avg_trade_label': 'P&L promedio/trade',
      'chart.discipline_label': 'Disciplina % (7 factores)',
      'chart.winning_day': 'Día ganador',
      'chart.losing_day': 'Día perdedor',
      'chart.other': 'Otro',
      'chart.no_trades': 'Sin trades',
      'chart.pnl_x_label': 'P&L por trade ($)',
      'chart.frequency_label': 'Frecuencia',
      'chart.discipline_x': 'Disciplina (%)',
      'chart.pnl_y': 'P&L del día ($)',

      // KPI strip (analysis section)
      'kpi.net_pnl': 'P&L Neto',
      'kpi.trades': 'Trades',
      'kpi.win_rate': 'Win Rate',
      'kpi.profit_factor': 'Profit Factor',
      'kpi.avg_win': 'Avg Win',
      'kpi.avg_loss': 'Avg Loss',
      'kpi.etd': 'ETD medio',
      'kpi.help_tooltip': '¿Qué es esto?',

      // Annual section
      'annual.prev_year': 'Año anterior',
      'annual.next_year': 'Año siguiente',
      'annual.all_accounts': 'Todas las cuentas',
      'annual.capital': 'Capital inicial',
      'annual.capital_hint': '(para rentabilidad %)',
      'annual.loading': 'Cargando datos anuales...',
      'annual.equity_title': 'Equity Curve Anual',
      'annual.pnl_bar_title': 'P&L por Mes',
      'annual.table_title': 'Resumen por Mes',
      'annual.table.month': 'Mes',
      'annual.table.net_pnl': 'P&L Neto',
      'annual.table.cumulative': 'Acumulado',
      'annual.table.return': 'Rentabilidad',
      'annual.table.win_rate': 'Efectividad',
      'annual.table.discipline': 'Disciplina',
      'annual.table.trades': 'Trades',
      'annual.table.status': 'Estado',
      'annual.no_activity': '— sin actividad —',
      'annual.summary': 'Resumen Anual',
      'annual.status.positive': '▲ Positivo',
      'annual.status.negative': '▼ Negativo',
      'annual.status.neutral': '— Neutro',
      'annual.chart.cumulative': 'Acumulado',
      'annual.chart.monthly': 'P&L Mensual',

      // Annual KPIs
      'annual.kpi.pnl': 'P&L Anual',
      'annual.kpi.return': 'Rentabilidad',
      'annual.kpi.pf': 'Profit Factor',
      'annual.kpi.max_dd': 'Max Drawdown',
      'annual.kpi.max_dd_sub': 'Máxima caída desde pico',
      'annual.kpi.avg_disc': 'Disciplina Prom.',
      'annual.kpi.avg_disc_sub': 'Checklist + sin errores',
      'annual.kpi.consistency': 'Consistencia',
      'annual.kpi.consistency_sub': 'meses positivos',
      'annual.kpi.best_month': 'Mejor mes',
      'annual.kpi.worst_month': 'Peor mes',
      'annual.kpi.no_data': 'Sin datos',
      'annual.kpi.pf_solid': 'Sistema sólido',
      'annual.kpi.pf_marginal': 'Sistema marginal',
      'annual.kpi.pf_negative': 'Sistema negativo',
      'annual.kpi.pf_no_losses': 'Sin pérdidas',

      // Modal
      'modal.day_detail': 'Detalle del día',
      'modal.close': 'Cerrar',
      'modal.tab_image': 'Imagen',
      'modal.tab_analysis': 'Análisis',
      'modal.tab_checklist': 'Checklist',
      'modal.tab_summary': 'Resumen',
      'modal.edit_session': 'Editar sesión',
      'modal.no_trade': 'Sin operación este día',
      'modal.no_trades': 'Sin trades registrados',
      'modal.no_image': 'Sin imagen para este día',
      'modal.no_session_data': 'Sin datos de sesión para este día.',
      'modal.no_analysis_data': 'Sin datos de análisis para este día.',
      'modal.errors_title': 'Errores',
      'modal.no_errors': 'Sin errores registrados',
      'modal.suggestions': 'Sugerencias',
      'modal.coming_soon': 'Próximamente...',
      'modal.contracts': 'contratos',
      'modal.context': 'Contexto',
      'modal.run': 'Corrida',
      'modal.candles_run': 'Velas en corrida',
      'modal.retrace_pts': 'Puntos retroceso',
      'modal.setup': 'Setup',
      'modal.reflection': 'Reflexión',
      'modal.ai_summary': 'Resumen IA',

      // Settings modal
      'settings.title': 'Ajustes',
      'settings.claude_key': 'API Key de Claude',
      'settings.claude_key_ph': 'sk-ant-api03-...',
      'settings.claude_key_hint': 'Se guarda solo en este navegador, nunca en GitHub.',
      'settings.dashboard_secret': 'Dashboard Secret',
      'settings.dashboard_secret_ph': 'Clave configurada en Cloudflare Worker',
      'settings.dashboard_secret_hint': 'Requerido para guardar sesiones y generar resúmenes con IA.',
      'settings.save': 'Guardar',

      // Holiday modal
      'holiday.closed': 'Mercado Cerrado — CME',
      'holiday.generic': 'Día Festivo',
      'holiday.new_year': 'Año Nuevo',
      'holiday.mlk': 'Día de Martin Luther King Jr.',
      'holiday.presidents': 'Día de los Presidentes',
      'holiday.good_friday': 'Viernes Santo',
      'holiday.memorial': 'Día de los Caídos',
      'holiday.juneteenth': 'Juneteenth',
      'holiday.independence': 'Día de la Independencia',
      'holiday.labor': 'Día del Trabajo',
      'holiday.thanksgiving': 'Día de Acción de Gracias',
      'holiday.christmas': 'Navidad',

      // Help modal
      'help.title': 'Ayuda',

      // Toast messages
      'toast.error_section': 'Error cargando sección',
      'toast.settings_saved': 'Ajustes guardados',
      'toast.connection_ok': 'Conectado',
      'toast.connection_error': 'Sin conexión a Supabase',
      'toast.image_uploaded': 'Imagen subida correctamente',
      'toast.image_error': 'Error al subir imagen a Cloudinary',
      'toast.cloudinary_nc': 'Cloudinary no configurado — imagen solo visible localmente',
      'toast.update_error': 'Error al actualizar',
      'toast.delete_error': 'Error al eliminar',
      'toast.name_updated': 'Nombre actualizado',
      'toast.order_saved': 'Orden guardado',
      'toast.order_error': 'Error al guardar el orden',
      'toast.emocion_updated': 'Emoción actualizada',
      'toast.emocion_added': 'Emoción agregada',
      'toast.cas_added': 'Casuística agregada',
      'toast.saving': 'Guardando...',
      'toast.session_saved': 'Sesión guardada correctamente',
      'toast.session_save_error': 'Error al guardar',

      // Data dialogs
      'data.edit_name_prompt': 'Editar nombre:',
      'data.confirm_delete': '¿Eliminar esta casuística? Los registros históricos conservarán el nombre anterior.',
      'data.empty': 'Sin ítems registrados',
      'data.emociones_empty': 'Sin emociones registradas',
      'data.active': 'Activa',
      'data.inactive': 'Inactiva',
      'data.drag_hint': 'Arrastra para reordenar',
      'data.emocion_name_prompt': 'Nombre de la emoción:',
      'data.emocion_emoji_prompt': 'Emoji:',
      'data.confirm_delete_emocion': '¿Eliminar esta emoción?',
      'data.enter_cas': 'Escribe el nombre de la casuística',
      'data.enter_emocion': 'Escribe el nombre de la emoción',

      // Form warnings
      'form.select_date': 'Selecciona una fecha',
      'form.select_situation': 'Selecciona una situación',
      'form.select_ts': 'Selecciona T o S',
      'form.select_date_first': 'Selecciona la fecha primero',
      'form.save_btn': 'Guardar sesión',
      'form.invalidated': 'Invalidado: {velas} velas superan el máximo de 5',

      // Month names (full)
      'months.0': 'Enero', 'months.1': 'Febrero', 'months.2': 'Marzo',
      'months.3': 'Abril', 'months.4': 'Mayo', 'months.5': 'Junio',
      'months.6': 'Julio', 'months.7': 'Agosto', 'months.8': 'Septiembre',
      'months.9': 'Octubre', 'months.10': 'Noviembre', 'months.11': 'Diciembre',
      // Month names (short)
      'months_s.0': 'Ene', 'months_s.1': 'Feb', 'months_s.2': 'Mar',
      'months_s.3': 'Abr', 'months_s.4': 'May', 'months_s.5': 'Jun',
      'months_s.6': 'Jul', 'months_s.7': 'Ago', 'months_s.8': 'Sep',
      'months_s.9': 'Oct', 'months_s.10': 'Nov', 'months_s.11': 'Dic',
      // Day names Sun=0 … Sat=6
      'days.0': 'Dom', 'days.1': 'Lun', 'days.2': 'Mar', 'days.3': 'Mié',
      'days.4': 'Jue', 'days.5': 'Vie', 'days.6': 'Sáb',
      // Calendar column headers Mon–Fri + Week
      'cal_days.0': 'Lun', 'cal_days.1': 'Mar', 'cal_days.2': 'Mié',
      'cal_days.3': 'Jue', 'cal_days.4': 'Vie', 'cal_days.5': 'Semana',
    },

    en: {
      // Navigation
      'nav.calendar': 'Calendar',
      'nav.images': 'Images',
      'nav.trades': 'Trades',
      'nav.analysis': 'Analysis',
      'nav.annual': 'Annual',
      'nav.coach': 'AI Coach',
      'nav.register': 'Register',
      'nav.data': 'Data',
      'nav.account': 'Funded Account',

      // Header
      'header.menu': 'Menu',
      'header.connecting': 'Connecting...',
      'header.connected': 'Connected',
      'header.disconnected': 'Disconnected',
      'header.settings': 'Settings',

      // Calendar section
      'calendar.section_title': 'Trading Calendar',
      'calendar.prev_month': 'Previous month',
      'calendar.next_month': 'Next month',
      'calendar.all_accounts': 'All accounts',
      'calendar.legend.target': 'Target',
      'calendar.legend.stop': 'Stop',
      'calendar.legend.no_entries': 'No valid entries',
      'calendar.legend.no_trade': "Didn't trade",
      'calendar.legend.holiday': 'Holiday',

      // Calendar cell badges
      'badge.no_entries': 'No entries',
      'badge.fomc': 'FOMC',
      'badge.holiday': 'Holiday',
      'badge.no_trade': "Didn't trade",
      'badge.be': 'B.E.',
      'badge.net_pnl': 'Net P&L',

      // Calendar tooltips
      'tooltip.fomc': 'FOMC meeting day',
      'tooltip.errors': 'Errors recorded',

      // Metrics section
      'metrics.title': 'General Metrics',
      'metrics.period.all': 'All',
      'metrics.period.month': 'This month',
      'metrics.period.week': 'This week',

      // Metric cards
      'metric.net_pnl': 'Net Total P&L',
      'metric.net_pnl_avg': 'Average',
      'metric.win_rate': 'Win Rate',
      'metric.discipline': 'Discipline',
      'metric.discipline_failed': 'sessions with failures',
      'metric.top_error': 'Most frequent error',
      'metric.top_error_none': 'No errors recorded',
      'metric.targets_stops': 'Targets · Stops · No entry',
      'metric.streak': 'Current streak',
      'metric.streak_wins': 'consecutive wins',
      'metric.streak_losses': 'consecutive losses',
      'metric.best_day': 'Best day',
      'metric.worst_day': 'Worst day',
      'metric.max_drawdown': 'Max Drawdown',
      'metric.max_drawdown_sub': 'Max drop from peak',
      'metric.profit_factor': 'Profit Factor',
      'metric.pf_solid': 'Solid system',
      'metric.pf_marginal': 'Marginal system',
      'metric.pf_negative': 'Negative system',
      'metric.pf_no_losses': 'No losses in period',
      'metric.avg_win_loss': 'Avg Win / Avg Loss',
      'metric.avg_ratio': 'Ratio',
      'metric.avg_no_data': 'Insufficient data',
      'metric.total_trades': 'Total Trades',
      'metric.trading_days': 'trading days',

      // Discipline modal
      'discipline.modal_title': 'Discipline Analysis',
      'discipline.exec_errors': 'Execution errors',
      'discipline.no_exec_errors': '✓ No execution errors',
      'discipline.failed_days': 'Failed days',
      'discipline.perfect': 'Perfect discipline in this period! 🎯',
      'discipline.no_sessions': 'No sessions in this period.',
      'discipline.typification_errors': 'Typification errors ({count} records)',
      'discipline.no_errors': 'No errors recorded',
      'discipline.days_with': 'Days with "{name}"',
      'discipline.no_opero_badge': 'no trade',
      'discipline.fallo': 'failure',
      'discipline.fallos': 'failures',

      // Checklist keys (long form)
      'chk.zonas': 'Active zones verified',
      'chk.orden': 'Order pre-placed on time',
      'chk.5velas': 'Max 5 candles in run',
      'chk.noticias': 'No active red news',
      'chk.consecucion': 'Zone marked with continuation',
      'chk.estructura': 'Impulse + Retrace + Impulse Structure, Fluid',
      // Short form
      'chk_short.zonas': 'Active zones',
      'chk_short.orden': 'Order on time',
      'chk_short.5velas': 'Max 5 candles',
      'chk_short.noticias': 'No red news',
      'chk_short.consecucion': 'Breakout + Continuation',
      'chk_short.estructura': 'IRI Structure',
      'chk_short.no_errors': 'No typification errors',
      'discipline.checklist_score': 'Discipline',

      // Trades section
      'trades.title': 'Trade Log',
      'trades.search_ph': 'Search...',
      'trades.all_accounts': 'All accounts',
      'trades.filter.all': 'All',
      'trades.filter.target': 'Target',
      'trades.filter.stop': 'Stop',
      'trades.filter.no_entries': 'No valid entries',
      'trades.headers.day': 'Day',
      'trades.headers.date': 'Date',
      'trades.headers.time': 'Time',
      'trades.headers.instrument': 'Instrument',
      'trades.headers.direction': 'Direction',
      'trades.headers.contracts': 'Contracts',
      'trades.headers.result': 'Result',
      'trades.headers.pnl': 'P&L',
      'trades.headers.error': 'Error',
      'trades.loading': '<i class="ti ti-loader-2 spin"></i> Loading...',
      'trades.no_results': 'No results',
      'trades.no_errors': 'No Errors',
      'trades.sin_entradas': 'No valid entries',
      'trades.no_opero': "Didn't trade",
      'trades.see_detail': 'View detail',
      'trades.edit_session': 'Edit session',
      'pagination.records': 'records',
      'pagination.prev': '‹ Prev',
      'pagination.next': 'Next ›',
      'pagination.page': 'Page',
      'pagination.of': '/',

      // Register section
      'register.title': 'Register Session',
      'register.date': 'Date',
      'register.no_opero': "Didn't trade today",
      'register.motivo': 'Reason',
      'register.context': 'Market context',
      'register.zones': 'Zones against?',
      'register.zones_yes': 'Yes',
      'register.zones_no': 'No',
      'register.checklist': 'Checklist',
      'register.typification': 'Error typification',
      'register.add': 'Add',
      'register.reflection': 'Reflection / Trader analysis',
      'register.reflection_ph': 'Write your daily reflection...',
      'register.notes': 'Notes / AI Summary',
      'register.notes_ph': 'Summary generated by the AI Coach...',
      'register.image': 'Day image',
      'register.image_drag': 'Click or drag an image here',
      'register.image_size': 'PNG, JPG or WebP · max 10MB',
      'register.remove_image': 'Remove image',
      'register.save': 'Save session',
      'register.clear': 'Clear',
      'register.run_number': 'Run number',
      'register.candles': 'Candles in run',
      'register.retrace': 'Retrace points',

      // Data section
      'data.title': 'Data Management',
      'data.casuisticas': 'Error Types',
      'data.casuisticas_sub': 'Situations to typify per day',
      'data.emociones': 'Emotions',
      'data.emociones_sub': 'AI Coach emotional states',
      'data.new_cas_ph': 'New error type...',
      'data.new_emocion_ph': 'Emotion name...',
      'data.new_emocion_emoji_ph': 'Emoji',

      // Coach IA section
      'coach.title': 'AI Coach — Chaumer Strategy',
      'coach.tab_analysis': "Today's Analysis",
      'coach.tab_history': 'History',
      'coach.tab_strategy': 'Strategy',

      // Gallery section
      'gallery.title': 'Images',
      'gallery.all': 'All',

      // Analysis section
      'analysis.title': 'Analysis & Statistics',
      'analysis.period.week': 'Week',
      'analysis.period.month': 'Month',
      'analysis.period.all': 'All',
      'analysis.prev_month': 'Previous month',
      'analysis.next_month': 'Next month',
      'analysis.all_accounts': 'All accounts',
      'analysis.help': 'What is this?',

      // Chart titles
      'chart.equity_title': 'Equity Curve — Cumulative P&L',
      'chart.winrate_title': 'Weekly Win Rate',
      'chart.pnl_day_title': 'Avg P&L by Day of Week',
      'chart.pnl_hour_title': 'Avg P&L by Hour (ET)',
      'chart.mae_mfe_title': 'MAE vs MFE — Excursion Management',
      'chart.pnl_hist_title': 'P&L Distribution — Frequency by Range',
      'chart.results_title': 'Results Distribution',
      'chart.discipline_title': 'Discipline by Session',
      'chart.disc_pnl_title': 'Discipline vs P&L — Do rules generate profit?',
      'chart.errors_title': 'Errors Over Time — Weekly Evolution',

      // Chart dataset labels
      'chart.equity_label': 'Cumulative P&L',
      'chart.drawdown_label': 'Drawdown',
      'chart.pnl_avg_label': 'Avg P&L',
      'chart.pnl_avg_trade_label': 'Avg P&L/trade',
      'chart.discipline_label': 'Discipline % (7 factors)',
      'chart.winning_day': 'Winning day',
      'chart.losing_day': 'Losing day',
      'chart.other': 'Other',
      'chart.no_trades': 'No trades',
      'chart.pnl_x_label': 'P&L per trade ($)',
      'chart.frequency_label': 'Frequency',
      'chart.discipline_x': 'Discipline (%)',
      'chart.pnl_y': "Day's P&L ($)",

      // KPI strip (analysis section)
      'kpi.net_pnl': 'Net P&L',
      'kpi.trades': 'Trades',
      'kpi.win_rate': 'Win Rate',
      'kpi.profit_factor': 'Profit Factor',
      'kpi.avg_win': 'Avg Win',
      'kpi.avg_loss': 'Avg Loss',
      'kpi.etd': 'Avg ETD',
      'kpi.help_tooltip': 'What is this?',

      // Annual section
      'annual.prev_year': 'Previous year',
      'annual.next_year': 'Next year',
      'annual.all_accounts': 'All accounts',
      'annual.capital': 'Initial capital',
      'annual.capital_hint': '(for return %)',
      'annual.loading': 'Loading annual data...',
      'annual.equity_title': 'Annual Equity Curve',
      'annual.pnl_bar_title': 'P&L by Month',
      'annual.table_title': 'Monthly Summary',
      'annual.table.month': 'Month',
      'annual.table.net_pnl': 'Net P&L',
      'annual.table.cumulative': 'Cumulative',
      'annual.table.return': 'Return',
      'annual.table.win_rate': 'Win Rate',
      'annual.table.discipline': 'Discipline',
      'annual.table.trades': 'Trades',
      'annual.table.status': 'Status',
      'annual.no_activity': '— no activity —',
      'annual.summary': 'Annual Summary',
      'annual.status.positive': '▲ Positive',
      'annual.status.negative': '▼ Negative',
      'annual.status.neutral': '— Neutral',
      'annual.chart.cumulative': 'Cumulative',
      'annual.chart.monthly': 'Monthly P&L',

      // Annual KPIs
      'annual.kpi.pnl': 'Annual P&L',
      'annual.kpi.return': 'Return',
      'annual.kpi.pf': 'Profit Factor',
      'annual.kpi.max_dd': 'Max Drawdown',
      'annual.kpi.max_dd_sub': 'Max drop from peak',
      'annual.kpi.avg_disc': 'Avg. Discipline',
      'annual.kpi.avg_disc_sub': 'Checklist + no errors',
      'annual.kpi.consistency': 'Consistency',
      'annual.kpi.consistency_sub': 'positive months',
      'annual.kpi.best_month': 'Best month',
      'annual.kpi.worst_month': 'Worst month',
      'annual.kpi.no_data': 'No data',
      'annual.kpi.pf_solid': 'Solid system',
      'annual.kpi.pf_marginal': 'Marginal system',
      'annual.kpi.pf_negative': 'Negative system',
      'annual.kpi.pf_no_losses': 'No losses',

      // Modal
      'modal.day_detail': 'Day detail',
      'modal.close': 'Close',
      'modal.tab_image': 'Image',
      'modal.tab_analysis': 'Analysis',
      'modal.tab_checklist': 'Checklist',
      'modal.tab_summary': 'Summary',
      'modal.edit_session': 'Edit session',
      'modal.no_trade': 'No trade this day',
      'modal.no_trades': 'No trades registered',
      'modal.no_image': 'No image for this day',
      'modal.no_session_data': 'No session data for this day.',
      'modal.no_analysis_data': 'No analysis data for this day.',
      'modal.errors_title': 'Errors',
      'modal.no_errors': 'No errors recorded',
      'modal.suggestions': 'Suggestions',
      'modal.coming_soon': 'Coming soon...',
      'modal.contracts': 'contracts',
      'modal.context': 'Context',
      'modal.run': 'Run',
      'modal.candles_run': 'Candles in run',
      'modal.retrace_pts': 'Retrace points',
      'modal.setup': 'Setup',
      'modal.reflection': 'Reflection',
      'modal.ai_summary': 'AI Summary',

      // Settings modal
      'settings.title': 'Settings',
      'settings.claude_key': 'Claude API Key',
      'settings.claude_key_ph': 'sk-ant-api03-...',
      'settings.claude_key_hint': 'Stored only in this browser, never on GitHub.',
      'settings.dashboard_secret': 'Dashboard Secret',
      'settings.dashboard_secret_ph': 'Key configured in Cloudflare Worker',
      'settings.dashboard_secret_hint': 'Required to save sessions and generate AI summaries.',
      'settings.save': 'Save',

      // Holiday modal
      'holiday.closed': 'Market Closed — CME',
      'holiday.generic': 'Holiday',
      'holiday.new_year': "New Year's Day",
      'holiday.mlk': 'Martin Luther King Jr. Day',
      'holiday.presidents': "Presidents' Day",
      'holiday.good_friday': 'Good Friday',
      'holiday.memorial': 'Memorial Day',
      'holiday.juneteenth': 'Juneteenth',
      'holiday.independence': 'Independence Day',
      'holiday.labor': 'Labor Day',
      'holiday.thanksgiving': 'Thanksgiving Day',
      'holiday.christmas': 'Christmas Day',

      // Help modal
      'help.title': 'Help',

      // Toast messages
      'toast.error_section': 'Error loading section',
      'toast.settings_saved': 'Settings saved',
      'toast.connection_ok': 'Connected',
      'toast.connection_error': 'No connection to Supabase',
      'toast.image_uploaded': 'Image uploaded successfully',
      'toast.image_error': 'Error uploading image to Cloudinary',
      'toast.cloudinary_nc': 'Cloudinary not configured — image only visible locally',
      'toast.update_error': 'Error updating',
      'toast.delete_error': 'Error deleting',
      'toast.name_updated': 'Name updated',
      'toast.order_saved': 'Order saved',
      'toast.order_error': 'Error saving order',
      'toast.emocion_updated': 'Emotion updated',
      'toast.emocion_added': 'Emotion added',
      'toast.cas_added': 'Error type added',
      'toast.saving': 'Saving...',
      'toast.session_saved': 'Session saved successfully',
      'toast.session_save_error': 'Error saving session',

      // Data dialogs
      'data.edit_name_prompt': 'Edit name:',
      'data.confirm_delete': 'Delete this error type? Historical records will retain the previous name.',
      'data.empty': 'No items recorded',
      'data.emociones_empty': 'No emotions recorded',
      'data.active': 'Active',
      'data.inactive': 'Inactive',
      'data.drag_hint': 'Drag to reorder',
      'data.emocion_name_prompt': 'Emotion name:',
      'data.emocion_emoji_prompt': 'Emoji:',
      'data.confirm_delete_emocion': 'Delete this emotion?',
      'data.enter_cas': 'Enter the error type name',
      'data.enter_emocion': 'Enter the emotion name',

      // Form warnings
      'form.select_date': 'Please select a date',
      'form.select_situation': 'Please select a situation',
      'form.select_ts': 'Please select T or S',
      'form.select_date_first': 'Please select a date first',
      'form.save_btn': 'Save session',
      'form.invalidated': 'Invalidated: {velas} candles exceed the maximum of 5',

      // Month names (full)
      'months.0': 'January', 'months.1': 'February', 'months.2': 'March',
      'months.3': 'April', 'months.4': 'May', 'months.5': 'June',
      'months.6': 'July', 'months.7': 'August', 'months.8': 'September',
      'months.9': 'October', 'months.10': 'November', 'months.11': 'December',
      // Month names (short)
      'months_s.0': 'Jan', 'months_s.1': 'Feb', 'months_s.2': 'Mar',
      'months_s.3': 'Apr', 'months_s.4': 'May', 'months_s.5': 'Jun',
      'months_s.6': 'Jul', 'months_s.7': 'Aug', 'months_s.8': 'Sep',
      'months_s.9': 'Oct', 'months_s.10': 'Nov', 'months_s.11': 'Dec',
      // Day names Sun=0 … Sat=6
      'days.0': 'Sun', 'days.1': 'Mon', 'days.2': 'Tue', 'days.3': 'Wed',
      'days.4': 'Thu', 'days.5': 'Fri', 'days.6': 'Sat',
      // Calendar column headers Mon–Fri + Week
      'cal_days.0': 'Mon', 'cal_days.1': 'Tue', 'cal_days.2': 'Wed',
      'cal_days.3': 'Thu', 'cal_days.4': 'Fri', 'cal_days.5': 'Week',
    }
  }

  let currentLang = localStorage.getItem('lang') || 'es'

  function t(key, params) {
    let str = (translations[currentLang] || translations.es)[key]
    if (str === undefined) str = translations.es[key]
    if (str === undefined) return key
    if (params) Object.entries(params).forEach(([k, v]) => { str = str.replace(`{${k}}`, v) })
    return str
  }

  function getLang() { return currentLang }

  // Returns array of 12 full month names for the current language
  function months() {
    return Array.from({ length: 12 }, (_, i) => t(`months.${i}`))
  }

  // Returns array of 12 short month names
  function monthsShort() {
    return Array.from({ length: 12 }, (_, i) => t(`months_s.${i}`))
  }

  // Returns Sun–Sat day abbreviations (index 0=Sun)
  function daysAll() {
    return Array.from({ length: 7 }, (_, i) => t(`days.${i}`))
  }

  // Returns Mon–Fri + Week (6 items for calendar header)
  function calendarDays() {
    return Array.from({ length: 6 }, (_, i) => t(`cal_days.${i}`))
  }

  // Format a YYYY-MM-DD date in locale style
  function formatDate(dateStr) {
    if (!dateStr) return '—'
    const [y, m, day] = dateStr.split('-')
    const mn = months()[parseInt(m) - 1]
    if (currentLang === 'en') return `${mn} ${parseInt(day)}, ${y}`
    return `${parseInt(day)} de ${mn} de ${y}`
  }

  // Format YYYY-MM-DD with short month
  function formatDateShort(dateStr) {
    if (!dateStr) return '—'
    const [y, m, day] = dateStr.split('-')
    const mn = monthsShort()[parseInt(m) - 1]
    if (currentLang === 'en') return `${mn} ${parseInt(day)}, ${y}`
    return `${parseInt(day)} ${mn} ${y}`
  }

  function applyToDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n)
    })
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.dataset.i18nHtml)
    })
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPh)
    })
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.dataset.i18nTitle)
    })
    // Update <html lang> attribute
    document.documentElement.lang = currentLang
  }

  function setLang(lang) {
    currentLang = lang
    localStorage.setItem('lang', lang)
    applyToDOM()
    const btn = document.getElementById('langToggle')
    if (btn) btn.textContent = lang === 'es' ? 'EN' : 'ES'
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }))
  }

  function initToggle() {
    const btn = document.getElementById('langToggle')
    if (!btn) return
    btn.textContent = currentLang === 'es' ? 'EN' : 'ES'
    btn.addEventListener('click', () => setLang(currentLang === 'es' ? 'en' : 'es'))
    applyToDOM()
  }

  return { t, getLang, months, monthsShort, daysAll, calendarDays, formatDate, formatDateShort, setLang, applyToDOM, initToggle }
})()
