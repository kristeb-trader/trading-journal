# Una sola cuenta en `trades`, todas las de Apex en `apex_trades`

**Versión:** 1 · **Estado:** APLICADO (fases 1 y 2) el 18-sep-2026 · **Fecha:** 2026-09-18

---

## El problema

El histórico de `trades` está partido en **cuatro cuentas que se sucedieron en el tiempo**,
porque cada una fue "cuenta principal" durante un tramo:

| Cuenta | Desde → hasta | Trades | P&L |
|---|---|---|---|
| `PA-APEX-232411-03` | 3 feb → 16 jul | 80 | −$2.729,10 |
| `APEX-232411-14` | 22 jul → 13 ago | 12 | −$1.257,66 |
| `APEX-232411-15` | 14 ago → 31 ago | 6 | −$382,32 |
| `Sim101` | 1 sep → 18 sep | 11 | −$157,42 |
| **Total** | **3 feb → 18 sep** | **109** | **−$4.526,50** |

No se solapan: es una línea continua de operativa a la que solo le cambia la etiqueta. Pero
Calendario y Análisis la muestran troceada, y hay que ir eligiendo cuenta en el filtro para
ver el año entero.

## El modelo que se quiere

Cada tabla con **un rol**, sin ambigüedad:

| Tabla | Qué contiene | Quién la lee |
|---|---|---|
| `trades` | **Solo la operativa de la cuenta principal**, bajo un único nombre | Calendario · Análisis · Disciplina · Coach · Sesión · Trades · Chaumer |
| `apex_trades` | **Todas las cuentas de evaluación y fondeo**, con su nombre real | Apex Tracker, y solo él |

Hoy la cuenta principal es `Sim101`. El día que sea la cuenta real, esa pasa a ser la
etiqueta de `trades` y el modelo no cambia.

## El invariante que cambia

`CLAUDE.md` dice hoy:

> **Un trade vive en UNA tabla: `trades` o `apex_trades`, nunca en las dos.** `apex.js`
> concatena ambas y filtra por cuenta; duplicar infla el drawdown consumido de Apex.

Ese invariante existe **porque `apex.js` concatena las dos tablas**. Al dejar de concatenar,
la razón desaparece. El invariante pasa a ser:

> **`trades` es el journal de la cuenta principal; `apex_trades` es la contabilidad por
> cuenta de Apex.** Una operación ejecutada en una cuenta de Apex mientras esa cuenta era la
> principal existe en las dos, con roles distintos: en `trades` bajo la etiqueta del journal,
> en `apex_trades` con el nombre real de la cuenta. **`apex.js` NO lee `trades`** — si
> volviera a leerla, ese trade se contaría dos veces y el drawdown se inflaría.

## Lo que NO se hace

**No se copia nada de `apex_trades` hacia `trades`.** De los 21 días que hay en
`apex_trades`, **20 ya existen en `trades`**: son la misma operativa replicada en dos cuentas
con distinto número de contratos (18-sep: +$86,96 en `trades` frente a +$1.067,96 en
`apex_trades`). Copiarlos contaría esos días dos veces y con dos tamaños mezclados.

El único día que está solo en `apex_trades` es el **21-jul** (`SimPruebas`, +$105,96), y no
es operativa de cuenta Apex.

## Fases

### Fase 1 — Migración de datos

Un solo archivo en `docs/migrations/2026-09-18-cuenta-unica-en-trades.sql`, en una
transacción.

1. **Preservar la trazabilidad** — columna nueva en `trades`:
   ```sql
   alter table trades add column if not exists cuenta_origen text;
   update trades set cuenta_origen = account where cuenta_origen is null;
   ```
   Sirve de red: revertir es `update trades set account = cuenta_origen`.

2. **Copiar a `apex_trades` las 98 filas de cuentas Apex** (80 + 12 + 6), con su nombre real.
   `entry_time` / `exit_time` van de `time` a `text` con `::text`; `tipo` se fija a `'trade'`;
   `id` es identity, se genera solo.
   ```sql
   insert into apex_trades (account, instrument, market_pos, qty, entry_price, exit_price,
                            entry_time, exit_time, exit_name, profit, commission,
                            mae, mfe, etd, bars, trade_date, resultado, tipo)
   select account, instrument, market_pos, qty, entry_price, exit_price,
          entry_time::text, exit_time::text, exit_name, profit, commission,
          mae, mfe, etd, bars, trade_date, resultado, 'trade'
   from trades
   where account <> 'Sim101';
   ```
   **Verificado: cero solapamientos** por (cuenta, fecha, hora de entrada), así que no se
   duplica ninguna fila existente.

3. **Unificar la etiqueta del journal:**
   ```sql
   update trades set account = 'Sim101';
   ```

> ⚠️ `apex_trades` no tiene las columnas `strategy` ni `cum_net_profit`. `cum_net_profit` es
> un acumulado y no aplica; `strategy` solo está informada en **3 de las 98 filas** (PA-03).
> Se pierde ese dato en la copia — el original sigue en `trades`.

### Fase 2 — `apex.js` deja de leer `trades`

- `loadData()`: quitar `DB.getTrades()` y la variable `mainTrades`.
- La línea que arma los trades de cada tarjeta pasa de
  `[...trades, ...mainTrades].filter(...)` a `trades.filter(...)`.
- El filtro por `numero_cuenta` y el reparto por periodo (`periodoDe` / `enPeriodo`, que
  separa la Apex-15 de su renovación) **se quedan igual**.

### Fase 3 — Verificación

Los números tienen que cuadrar **antes y después**:

| Qué | Antes | Después (esperado) |
|---|---|---|
| Filas en `trades` | 109 | 109 (mismas, solo renombradas) |
| P&L total de `trades` | −$4.526,50 | −$4.526,50 |
| Filas en `apex_trades` (tipo `trade`) | 34 | 132 |
| Tarjeta PA-03 | 80 trades | 80 trades |
| Tarjeta Apex-14 | 12 trades | 12 trades |
| Tarjeta Apex-15 (1ª) | 6 + los suyos de agosto | los mismos |
| Cuentas en el filtro | 4 | 1 (`Sim101`) |

Y en pantalla: Calendario en varios meses (feb, jun, sep), Análisis en anual, y el Apex
Tracker tarjeta por tarjeta, con la consola abierta.

### Fase 4 — El caso futuro (recomendada, no bloqueante)

Cuando la cuenta real sea la principal **y** esté dada de alta en `apex_cuentas`, sus trades
irán a `trades` por el routing de NT8 y el Apex Tracker ya no los vería, porque habrá dejado
de leer esa tabla.

Se resuelve **sin recompilar NinjaTrader**, con un trigger `after insert` en `trades` que
replique la fila a `apex_trades` cuando `account` exista en `apex_cuentas`, y deje
`trades.cuenta_origen` con el nombre real antes de unificar la etiqueta.

Mientras la principal sea `Sim101` —que no es cuenta de Apex— no hace falta.

## Reversión

```sql
update trades set account = cuenta_origen where cuenta_origen is not null;
delete from apex_trades where id > <max_id_antes_de_la_migracion>;
```
Y revertir el commit de `apex.js`. Conviene anotar el `max(id)` de `apex_trades` antes de
empezar.

## Qué documentar al cerrar

- `CLAUDE.md`: reescribir el invariante "un trade vive en UNA tabla".
- `docs/decisiones.md`: por qué se cambió, y por qué NO se copió `apex_trades` → `trades`.
- `docs/migrations/INDICE.md`: la migración nueva.
