# 6 · Filtros de no-operar

> los días que no

## R-35 · Noticia roja

> No operes en la ventana de `VENTANA_NOTICIA` alrededor de una noticia roja de Forex Factory.

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | `VENTANA_NOTICIA` |
| Relacionadas | R-28 · R-29 · R-36 |
| Casos | — |

### Cómo se aplica

- **Fuente única: Forex Factory.** Investing y los «3 toros» no se usan.
- **Solo el impacto ROJO.** Naranja y amarillo no bloquean. El nivel lo da el icono de Forex Factory, no un criterio propio.
- **La ventana:** `VENTANA_NOTICIA` alrededor de la hora publicada — de T−5 a T+5, ambos inclusive: 11 minutos.
- **Dentro de la ventana no se coloca ninguna orden.** Si ya hay una pendiente sin llenar, **se cancela al entrar T−5**, y no consume el cupo de `R-28` (`R-29`).
- **Pasado T+5**, si el setup sigue vivo, se vuelve a colocar la orden.

### Por qué

Una sola fuente evita el conflicto de dos calendarios que no siempre coinciden.

## R-36 · Día de FOMC

> En día de FOMC **no se opera Continuación. Solo se permite Reingreso.**

| | |
|---|---|
| Aplica a | Continuación |
| Parámetros | `VENTANA_NOTICIA` |
| Relacionadas | R-25 · R-26 · R-35 |
| Casos | G-13 |

### Cómo se aplica

| | |
|---|---|
| **Qué es un día de FOMC** | cualquier día en que **Forex Factory** marque en **rojo** un evento de la Fed — decisión de tipos, actas o discursos de Powell |
| **Fuente** | Forex Factory, **la misma única fuente de `R-35`** |
| **Alcance** | el **día entero**, no solo la hora del anuncio |
| **Continuación** (`R-25`) | ❌ **prohibida** |
| **Reingreso** (`R-26`) | ✅ **permitido**, con todas sus condiciones normales |

- Ese día solo se busca Reingreso. **Una Continuación válida se deja pasar aunque cumpla todo.**

### Por qué

> 🔑 **Convive con `R-35` sin conflicto.** Un evento rojo de la Fed dispara las dos: el veto de Continuación durante todo el día **y** el bloqueo de `VENTANA_NOTICIA`. Misma fuente única, así que no hay dos calendarios que puedan discrepar.

**La lógica del filtro:** el operador descarta el setup que **persigue continuación** y conserva el que **opera rompimientos fallidos** — justo el comportamiento que domina un mercado a la espera de la Fed.

## R-37 · Estado del operador

> **No se opera estando enfermo o sin encontrarse bien mentalmente.**

| | |
|---|---|
| Aplica a | Continuación · Reingreso |
| Parámetros | — |
| Relacionadas | R-38 |
| Casos | — |

### Cómo se aplica

- **Criterio libre:** juicio del operador, sin condición medible. Decisión consciente del operador (24/08/2026).
- Si no está bien, **no se abre operativa ese día**. Se contesta antes de abrir la plataforma (`R-38`, bloque A).

### Por qué

> ⚠️ **Es la única regla del plan sin criterio medible**, y la única que **un tercero no puede verificar**. Queda **fuera del alcance del test ciego**: ninguna captura podrá decir si se aplicó bien o mal.
>
> El operador la mantiene como criterio libre a propósito, y está registrado que lo es — no es un olvido ni un pendiente disfrazado.
