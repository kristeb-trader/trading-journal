# 7 · Proceso diario

> checklist y bitácora

## R-38 · Checklist diaria y registro

> Ejecuta la sesión siguiendo la checklist diaria **en orden**, y registra **todas** las sesiones, incluidas aquellas en que no se operó.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `PREMERCADO_INICIO` |
| Relacionadas | R-35 · R-36 · R-37 |
| Casos | G-09 |

### Cómo se aplica

- **Se sigue `CHECKLIST_DIARIA.md` de arriba abajo, sin alterar el orden de sus bloques:**

| Bloque | Cuándo | Contiene |
|---|---|---|
| **A** | **antes de abrir NinjaTrader** | `R-37` estado · `R-36` FOMC · `R-35` noticias |
| **B** | premercado, desde `PREMERCADO_INICIO` | `R-03` · `R-15` · `R-09` · `R-12` · `R-13` |
| **C** | ventana operativa | `R-23` · `R-25`/`R-26` · `R-32` filtros · `R-24` envío · `R-29` cancelación |
| **D** | tras el llenado | `R-31` ajuste · `R-33` no tocar · `R-28` cupo |

- **El bloque A se contesta antes de abrir la plataforma.** Con el gráfico delante, `R-37` ya no es la misma pregunta.
- **Registro automático** (indicador de NinjaTrader): entrada · salida · niveles · hora · resultado.
- **Registro manual:** setup · imagen · errores · observaciones · **y el motivo los días en que no se operó**.
- **Se registran TODOS los días, se opere o no.** El journal se rellena al cierre de la sesión.

### Por qué

🔑 **Esta regla no añade criterio operativo.** Ordena las reglas del plan en la secuencia real del día, para que la sesión se ejecute leyendo de arriba abajo sin decidir nada.

📓 **Lo que hace valioso este journal es que registra los días SIN operar y el porqué.** Casi ninguno lo hace, y es exactamente el dato que necesitan `P-01`, `P-21` y `D-09`. Sin él, esos pendientes no se cierran nunca.
