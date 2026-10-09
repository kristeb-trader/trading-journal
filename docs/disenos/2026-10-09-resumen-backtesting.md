# Resumen del backtesting (Otros › Backtesting)

| Versión | Fecha | Estado |
|---|---|---|
| v1.0 | 09/10/2026 | Aprobado por Kris en el chat («sí, hazlo con el punto 4 incluido») |

## La pregunta

¿Cómo va el backtesting en total, y qué setup y qué dirección funcionan mejor?

## Dónde

La sección Backtesting pasa a tener **dos pestañas**, con el patrón de Chaumer (`so-tabs`):

- **Resumen** (la que abre): el dashboard.
- **Bitácora**: la lista por meses de siempre, con los datos de inicio y su lápiz.

No es una sección nueva: la barra se queda en 6 botones, y el backtesting no entra en
Análisis porque nunca se mezcla con `trades`. "Registrar jornada" sigue en la cabecera.

## Qué lleva

1. **Seis cifras en dos filas.** Dinero: saldo actual (con el P&L), rentabilidad y caída
   máxima ($ y %). Método: efectividad (T/S en color), puntos netos (con las comisiones) y
   rachas (más targets seguidos · más stops seguidos).
2. **Curva** del P&L acumulado, jornada a jornada (`Metrics.pintarEquity`, la misma de
   los calendarios).
3. **Tabla por mes**, del más nuevo al más viejo: jornadas, operaciones, T, S,
   efectividad, puntos y P&L, con fila de **Total**.
4. **Por setup** (Continuación · Reingreso) y **por dirección** (Largo · Corto): operaciones,
   T·S, efectividad, puntos y P&L.

## Aritmética

La del portal (`chaumer/04_Web/src/pages/backtesting.astro`), para que nunca den cifras
distintas: P&L = suma de `bt_operaciones.pnl` (neto y congelado); saldo = valor inicial +
P&L acumulado en orden de fecha; caída máxima = la peor distancia entre un techo del saldo
y lo que vino después, por jornada; puntos con signo (stop en negativo); efectividad =
targets / operaciones. Las rachas, sobre las operaciones en orden de fecha: un día sin
operación no corta la racha.
