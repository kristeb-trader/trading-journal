# Índice de migraciones

> Una fila por archivo. **Ninguna se reaplica**: esta tabla es historial, no un script.
>
> **Convención desde el 16 ago 2026:** toda migración nueva se escribe aquí como
> `YYYY-MM-DD-descripcion.sql` **y** se aplica con `apply_migration` del MCP de Supabase,
> usando el nombre del archivo sin extensión como `name`. Así el registro de Supabase y
> esta carpeta coinciden 1:1. Con `execute_sql` los cambios no quedan registrados.
>
> Si una migración toca datos existentes, deja respaldo en `_bak_<fecha>_<qué>`.

## Cómo leer la columna "Registro"

| Valor | Significa |
|---|---|
| ✅ **MCP** | Aplicada con `apply_migration`. Consta en `supabase_migrations.schema_migrations` |
| ⚠️ **sin registro** | Aplicada con `execute_sql` o a mano. Funcionó, pero no dejó rastro |
| ✅ **previa al registro** | De antes de que existiera la práctica (jun – 15 jul 2026) |

**Estado a 2026-08-16:** 65 archivos = 5 con registro en Supabase + 4 aplicadas sin
registrar (ago) + 56 previas a la práctica.

## Migraciones

| Archivo | Registro | Qué hace |
|---|---|---|
| `2026-06-01-setup-reglas.sql` | ✅ previa al registro | setup reglas |
| `2026-06-02-normalizar-pnl-live.sql` | ✅ previa al registro | normalizar pnl live |
| `2026-06-03-premercado-sesiones.sql` | ✅ previa al registro | premercado sesiones |
| `2026-06-03-unificar-experimentos.sql` | ✅ previa al registro | unificar experimentos |
| `2026-06-12-apex-tracker.sql` | ✅ previa al registro | apex tracker |
| `2026-06-12-valor-experimentos.sql` | ✅ previa al registro | valor experimentos |
| `2026-06-13-apex-plan-config.sql` | ✅ previa al registro | apex plan config |
| `2026-06-13-apex-trades.sql` | ✅ previa al registro | apex trades |
| `2026-06-13-apex11-comisiones.sql` | ✅ previa al registro | apex11 comisiones |
| `2026-06-13-apex11-trades-reales.sql` | ✅ previa al registro | apex11 trades reales |
| `2026-06-13-apex12-comisiones.sql` | ✅ previa al registro | apex12 comisiones |
| `2026-06-13-apex12-trades-reales.sql` | ✅ previa al registro | apex12 trades reales |
| `2026-06-14-apex-pa-03.sql` | ✅ previa al registro | apex pa 03 |
| `2026-06-15-pa-trade-manual.sql` | ✅ previa al registro | pa trade manual |
| `2026-06-16-apex-pa-reconstruccion-oficial.sql` | ✅ previa al registro | apex pa reconstruccion oficial |
| `2026-06-16-mover-trade-pa-a-journal.sql` | ✅ previa al registro | mover trade pa a journal |
| `2026-06-17-fomc-dates-2026.sql` | ✅ previa al registro | fomc dates 2026 |
| `2026-06-17-fomc-dates-rls-fix.sql` | ✅ previa al registro | fomc dates rls fix |
| `2026-06-17-pa-trade-manual.sql` | ✅ previa al registro | pa trade manual |
| `2026-06-17-sesiones-apertura-ayer.sql` | ✅ previa al registro | sesiones apertura ayer |
| `2026-06-17-sesiones-max-min-ayer.sql` | ✅ previa al registro | sesiones max min ayer |
| `2026-06-17-sesiones-unique-date.sql` | ✅ previa al registro | sesiones unique date |
| `2026-06-19-errores-fase-regla.sql` | ✅ previa al registro | errores fase regla |
| `2026-06-19-sesiones-alerta-riesgo.sql` | ✅ previa al registro | sesiones alerta riesgo |
| `2026-06-19-sesiones-chk-cuenta-pa.sql` | ✅ previa al registro | sesiones chk cuenta pa |
| `2026-06-22-backfill-chk-cuenta-pa.sql` | ✅ previa al registro | backfill chk cuenta pa |
| `2026-06-22-backfill-fase-errores-registrados.sql` | ✅ previa al registro | backfill fase errores registrados |
| `2026-06-22-catalogo-errores-fase.sql` | ✅ previa al registro | catalogo errores fase |
| `2026-06-22-checklist-dinamico.sql` | ✅ previa al registro | checklist dinamico |
| `2026-06-22-sesiones-checklist-go-at.sql` | ✅ previa al registro | sesiones checklist go at |
| `2026-06-23-apex-unificar-tablas.sql` | ✅ previa al registro | apex unificar tablas |
| `2026-06-23-apex11-trade-manual-nq.sql` | ✅ previa al registro | apex11 trade manual nq |
| `2026-06-24-disable-rls-baseline.sql` | ✅ previa al registro | disable rls baseline |
| `2026-06-24-fase2-activar-rls.sql` | ✅ previa al registro | fase2 activar rls |
| `2026-06-24-fase2-rollback-rls.sql` | ✅ previa al registro | fase2 rollback rls |
| `2026-06-24-grants-authenticated.sql` | ✅ previa al registro | grants authenticated |
| `2026-06-25-grants-service-role.sql` | ✅ previa al registro | grants service role |
| `2026-06-25-pa-trade-manual-mnq.sql` | ✅ previa al registro | pa trade manual mnq |
| `2026-06-26-reglas-fase4-archivar.sql` | ✅ previa al registro | reglas fase4 archivar |
| `2026-06-26-reglas-modelo-final.sql` | ✅ previa al registro | reglas modelo final |
| `2026-06-26-reglas-unificacion-fase1.sql` | ✅ previa al registro | reglas unificacion fase1 |
| `2026-06-30-reglas-hora-noticia.sql` | ✅ previa al registro | reglas hora noticia |
| `2026-07-01-reglas-mover-fase-hora-sesion.sql` | ✅ previa al registro | reglas mover fase hora sesion |
| `2026-07-02-apex13-trade-29jun-manual.sql` | ✅ previa al registro | apex13 trade 29jun manual |
| `2026-07-02-drop-apex-registros.sql` | ✅ previa al registro | drop apex registros |
| `2026-07-02-drop-reglas-hora-noticia.sql` | ✅ previa al registro | drop reglas hora noticia |
| `2026-07-02-drop-tablas-archivadas.sql` | ✅ previa al registro | drop tablas archivadas |
| `2026-07-07-checklist-setup-orden.sql` | ✅ previa al registro | checklist setup orden |
| `2026-07-08-catalogo-fechas.sql` | ✅ previa al registro | catalogo fechas |
| `2026-07-08-drop-columnas-chk.sql` | ✅ previa al registro | drop columnas chk |
| `2026-07-08-drop-fomc-dates.sql` | ✅ previa al registro | drop fomc dates |
| `2026-07-08-drop-sesiones-checklist-jsonb.sql` | ✅ previa al registro | drop sesiones checklist jsonb |
| `2026-07-08-normalizar-checklist-catalogo-reglas.sql` | ✅ previa al registro | normalizar checklist catalogo reglas |
| `2026-07-21-objetivos-cuenta-principal.sql` | ✅ MCP | objetivos cuenta principal |
| `2026-07-24-backfill-reglas-nuevas-na.sql` | ✅ MCP | backfill reglas nuevas na |
| `2026-07-24-catalogo-setups.sql` | ✅ previa al registro | catalogo setups |
| `2026-07-24-sesiones-sync-setup-codigo.sql` | ✅ previa al registro | sesiones sync setup codigo |
| `2026-08-03-borrar-sesion-fin-de-semana.sql` | ✅ previa al registro | borrar sesion fin de semana |
| `2026-08-03-errores-regla-codigo.sql` | ✅ MCP | errores regla codigo |
| `2026-08-03-mapeo-errores-reglas.sql` | ⚠️ sin registro | mapeo errores reglas |
| `2026-08-03-rediseno-checklist-fase1.sql` | ✅ MCP | rediseno checklist fase1 |
| `2026-08-11-chat-messages-sin-imagenes.sql` | ⚠️ sin registro | chat messages sin imagenes |
| `2026-08-14-mover-trade-apex15-a-trades.sql` | ⚠️ sin registro | mover trade apex15 a trades |
| `2026-08-16-checklist-sin-materializar-en-true.sql` | ✅ MCP | checklist sin materializar en true |
| `2026-08-16-migrar-noticias-texto.sql` | ⚠️ sin registro | migrar noticias texto |
| `2026-08-19-chaumer-operativas.sql` | ✅ MCP | tabla `chaumer_operativas` para el comparador Chaumer vs yo (`20260819151243`) |

> La columna "Qué hace" se deriva del nombre del archivo. Para el detalle exacto de una
> migración histórica, abrir el `.sql` — son cortos.
