---
paths:
  - "NinjaTrader/**"
  - "js/coach.js"
  - "js/db.js"
---

# NinjaTrader 8 — zona horaria y pipeline de captura

## ⏰ REGLA DE ORO — zona horaria (ya causó 2 bugs)

**NinjaTrader está configurado en hora de Colombia** (Tools → Options → General → Time zone
= `(UTC-05:00) Bogotá, Lima, Quito`), igual que el PC. Por lo tanto **TODO lo que NT exporta
viene en hora Colombia, NO en ET**: los `Time[]` de las velas y los `entry_time` /
`exit_time` que llegan a `trades`.

**Colombia no tiene horario de verano; Nueva York sí.** En verano (EDT, ~mar–nov) ET va 1 h
adelante: **09:30 ET = 08:30 Colombia**. En invierno coinciden.

**Siempre que se toque una hora, convertir a ET antes de razonar sobre sesión** (RTH =
09:30–16:00 ET, premercado = antes de 09:30 ET). Conversión correcta: tratar el dato como
`America/Bogota` (UTC-5 fijo) → convertir a `America/New_York` (maneja el DST solo).

**Los parámetros "RTH abre/cierra" del indicador van en ET: 930 / 1600.** Poner 830
(pensando en hora local) hacía tomar la vela de las 7:30 Colombia.

Los dos bugs que causó (jul 2026):
1. `SupabaseDailyLevels` convertía las velas con `Bars.TradingHours.TimeZoneInfo` (zona del
   template del CME = Central) en vez de la zona real de los `Time[]` → detectaba el RTH 1 h
   antes. Fix: zona de origen fija `SA Pacific Standard Time`.
2. El **Coach IA** leía `entry_time` como si fuera ET y llamaba "premercado" a un trade de
   las 08:36 (= 09:36 ET, plena apertura). Fix: `coach.js` convierte a ET antes del prompt.

**Al implementar algo con horas, verificar primero en qué zona viene el dato.** No asumir ET
solo porque el mercado sea de NY.

## Los tres indicadores

| Archivo | Qué hace |
|---|---|
| `SupabaseAutoExport.cs` | Exporta trades. Una instancia monitorea varias cuentas |
| `SupabaseDailyLevels.cs` | Escribe los niveles de referencia del día en `sesiones` |
| `ChecklistChaumer.cs` | Pinta el checklist en el gráfico; lee de `catalogo_reglas` y `catalogo_setups` |

## Routing de trades (`SupabaseAutoExport`)

Rutea **por nombre de cuenta**: la que empieza por `PA-` **o la cuenta principal
configurada** (`objetivos.cuenta_principal`, que el indicador lee de Supabase al iniciar) →
tabla `trades` + notificación de Telegram. El resto (evaluaciones Apex) → `apex_trades`,
sin notificar. Estado de trade por-cuenta, para no mezclar trades simultáneos.

Por eso una cuenta de **evaluación** puede alimentar el journal. Al cambiar de cuenta principal:
elegirla en Datos y **reiniciar NinjaTrader** — no hace falta recompilar.

## Niveles de referencia (`SupabaseDailyLevels`, v2.1)

Escribe en la tabla `sesiones` (no en una tabla aparte) por `sesion_date`, vía upsert con
`on_conflict=sesion_date` + `Prefer: resolution=merge-duplicates` (requiere el UNIQUE en
`sesiones(sesion_date)`).

| Nivel | Columna |
|---|---|
| PDO | `precio_apertura_ayer` |
| PDH | `precio_max_ayer` |
| PDL | `precio_min_ayer` |
| PDC | `precio_cierre_ayer` |
| Apertura de hoy | `precio_apertura` |
| ONH / ONL | `precio_max_pre` / `precio_min_pre` |

**Lección que costó muchas iteraciones:** `AddDataSeries` con plantilla de horario NO aplica
de forma fiable aquí (el overload de 3 args corre pero da ETH; el de 5 args tumba el
indicador). Solución: el indicador **no usa series con trading hours** — clasifica las velas
del gráfico por hora de Nueva York. Por eso el gráfico DEBE estar en
`<Use instrument settings>` (ETH, sesión completa). El push solo ocurre en tiempo real al
abrir un nuevo RTH; el `Print` de diagnóstico corre sobre histórico (sirve para verificar sin
mercado abierto).

**Anti-sobreescritura:** como el indicador escribe estos niveles, ni el bot de Telegram ni el
formulario web deben pisarlos. El bot ya no pide ningún nivel de precio. El formulario carga
la sesión del día al abrir (`prefill` con `suppressAutoLoad`) para que salgan prellenados y
se conserven al guardar.

## Guarda de fin de semana

`ChecklistChaumer` tiene `EsFinDeSemana()` en `UpsertSesionAsync` / `UpsertChecklistAsync`:
abrir NT8 un sábado ya no deja filas fantasma en `sesiones`. Ver
`.claude/rules/disciplina.md`, invariante 1.


## Anti-replay de ejecuciones (18 ago 2026) — trades fantasma

`SupabaseAutoExport` **no** reconstruye trades desde una lista: lleva una máquina de estados
por cuenta (`NetQty`: de 0 a ≠0 abre, de ≠0 a 0 cierra y publica).

**Cuando el indicador se resuscribe** —recompilar, reconectar, recargar el gráfico— NT le
vuelve a entregar las ejecuciones de la sesión, y las entrega **de la más reciente a la más
antigua**. Con el estado recién reiniciado, el fill de **salida** se leía como apertura y el
de **entrada** como cierre: nacía un **trade espejo** con el P&L duplicado.

**Las tres huellas de un fantasma** (sirven para cazarlos en la BD):

```sql
select * from trades      where exit_time < entry_time;
select * from apex_trades where exit_time < entry_time;
```

- `exit_time < entry_time`
- `mae = 0 and mfe = 0` — `OnBarUpdate` nunca llegó a seguirlo
- `exit_name` con el nombre de la orden de **entrada** (`External` si la entrada fue manual)

Se encontraron dos: `trades` #108 (18-ago, +77,96) y `apex_trades` #125 (24-jun, −1.593,80,
que inflaba el drawdown de la evaluación `APEX-232411-11`).

**Los tres candados** en `OnAccountExecutionUpdate`:

1. `if (e.Operation != Cbi.Operation.Add) return;` — el enum es **`Add`**, no `Insert`
   (`NinjaTrader.Cbi.Operation = {Add, Update, Remove}`, verificado por reflexión).
2. `if (ex.Time < subscribedAt) return;` — `subscribedAt` se sella en `State.DataLoaded`
   con 30 s de holgura por el desfase de reloj.
3. `HashSet` de `ExecutionId` ya procesados.

## Verificar un `.cs` sin abrir NinjaTrader

El `csc` del sistema (`C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe`) es **C# 5**
y se atraganta con los `=>` y `?.` que NT8 sí acepta, así que no vale por sí solo. Lo que sí
vale es **comparar contra la baseline**:

```bash
git show HEAD:NinjaTrader/X.cs > baseline.cs
# compilar baseline.cs y X.cs con csc y comparar la lista de errores
```

Si la lista de errores es **idéntica**, el cambio no añade problemas de sintaxis. Y los tipos
o miembros nuevos se confirman por reflexión sobre `NinjaTrader.Core.dll`
(`[Reflection.Assembly]::ReflectionOnlyLoadFrom`). Referencias para compilar:
`C:\Program Files\NinjaTrader 8\bin\*.dll` + `Documents\NinjaTrader 8\bin\Custom\NinjaTrader.Custom.dll`
+ las de WPF en `…\v4.0.30319\WPF\`.

## ⚠️ Tras editar cualquier `.cs`

**Hay que recompilar en NinjaTrader 8** (F5 en el editor de NinjaScript). El push a git no
basta: el indicador que corre es el compilado. Avisar a Kris explícitamente.
