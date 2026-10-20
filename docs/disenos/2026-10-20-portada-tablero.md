# La portada del portal como tablero

**Versión:** v1 · **Estado:** ✅ implementado (20/10/2026) · **Fecha:** 20/10/2026

| Versión | Qué cambió |
|---|---|
| v1 | Propuesta con boceto, aprobada tal cual |

---

## 1. Por qué

Con D-042 salieron del menú Mapa, Casos reales, Checklist y Observaciones. La portada seguía mandando a
ellas: «El plan operativo», «Las reglas» y «Casos reales» como puertas, y «El método, de un vistazo». El
portal ahora es sobre todo **la operativa de Kris**, y la portada pasa a enseñar **cómo va**.

## 2. Qué lleva, de arriba abajo

1. **Banner** (`BannerTerminal`): se queda la cinta y los cuatro datos. El titular va a la izquierda, más
   corto, y los cuatro datos a su derecha en 2×2 (variante `lado`).
2. **«Cómo va · En vivo»**: dos tarjetas que leen `/api/operativa` y `/api/backtesting` en el navegador:
   - **Operativa diaria**: P&L neto en grande, efectividad, puntos, caída máxima, curva pequeña y el último
     trade (fecha, setup, resultado, P&L). Sin trades: «Todavía sin operaciones».
   - **Backtesting**: saldo, rentabilidad sobre el valor inicial, efectividad, operaciones, P&L neto y curva.
   - Cada una lleva a su página. El mismo relieve que las placas de la lupa.
3. **«Último día operado»**: el gráfico del último día de la operativa con su ficha (setup, resultado en
   relieve, puntos, P&L) y «Ver la operativa». Si no hay ningún día, no sale.
4. **«El plan, en el orden de la jornada»**: los 8 módulos numerados, de `modulos.mjs`.

## 3. Lo que sale

- Las tres tarjetas de `TarjetasInicio` y el bloque del mapa. `TarjetasInicio.astro` queda sin uso y se borra.
- Las páginas no se tocan: siguen abiertas (D-042).

## 4. Reglas que se mantienen

- Los números salen de las mismas funciones que las páginas: ninguna cifra escrita a mano.
- Los cálculos son los de `Bitacora.astro`: P&L neto, efectividad = targets / operaciones, puntos con el signo
  del resultado (el «otro», con el de su P&L), caída máxima desde el techo de la curva.
- Si una de las dos lecturas falla, su tarjeta lo dice y la otra se pinta igual.
