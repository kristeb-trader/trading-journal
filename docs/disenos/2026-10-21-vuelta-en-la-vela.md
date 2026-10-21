# La vuelta dentro de la vela: una vela puede ser dos puntos de la marcación

| Versión | Fecha | Estado |
|---|---|---|
| v1.0 | 21/10/2026 | Aprobado por Kris en el chat («Sí, apruebo el texto y el diseño, dale») · implementado |

## 1 · La pregunta

21/10/2026, vela **08:40** (azul). Venía una corrida alcista con su máximo en la **08:38**. La 08:40 **primero bajó**
por debajo del mínimo de la 08:39, lo que mata la corrida, y **después subió** por encima del máximo de la 08:39 (y
de la 08:38), lo que termina el retroceso. La marcación bajó a su mínimo, **pero no subió a su máximo**: el pico de
29.884,75 se perdió, y la corrida siguiente se marcó en la 08:43.

Kris: *«la línea se marca hasta ese mínimo, pero esa misma vela después hace máximo y supera la vela anterior,
entonces la misma línea se debe dibujar hasta arriba»*. Y: *«en el backtesting no se sabe qué hizo primero y las
reglas están bien, pero en tiempo real sí se puede saber»*.

**Causa:** el motor da **una sola vuelta por vela**. La regla del color acierta el orden (azul = primero el mínimo),
pero después de la primera vuelta no vuelve a mirar la misma vela. Es igual en `lector.py`, `MotorChaumer.cs` y
`MarcacionChaumer`.

**Cuánto pasa:** en los 34 días de septiembre y octubre, **166 velas** (unas 5 por día, todos los días).

## 2 · Lo decidido (Kris, 21/10/2026)

- **Opción B:** la regla cambia **en todo**: el plan, el motor (`lector.py`), el motor del bot (`MotorChaumer.cs`)
  y el indicador (`MarcacionChaumer`).
- **Desde hoy, sin rectificar lo anterior:** los días hasta el 20/10 se calculan exactamente como siempre.
- **El orden real por ticks, solo en el indicador.** El motor y el bot siguen con el color, porque el motor de
  Python no ve ticks: si el bot los usara, el sello no podría comprobarlo.

## 3 · El texto del plan

**Nuevo parámetro** en `PARAMETROS.md`, en Estructura (los números del motor solo salen de `reglas.json`):

| Parámetro | Valor actual | Dónde actúa |
|---|---|---|
| **`VUELTA_EN_VELA_DESDE`** | **20261021** (21/10/2026) | `R-05` · `R-06`: desde ese día, una vela puede dar dos vueltas. Los días anteriores se leen con una sola, como se leyeron |

**`R-05 · Corrida`**, nueva viñeta en «Cómo se aplica», después de «Muere»:

> - **🕯️ La misma vela puede matar el retroceso y ser corrida** *(desde `VUELTA_EN_VELA_DESDE`)*. Si una vela
>   hace **primero** un mínimo por debajo del de la anterior —muere la corrida— y **después**, en el mismo minuto,
>   un máximo por encima del de la anterior, esa vela es a la vez **el final del retroceso** (su mínimo) y **la
>   corrida nueva** (su máximo). La corrida nueva nace en esa vela, que es su origen: es la excepción al tamaño
>   mínimo de 2 velas. **Y al revés:** si una vela **primero** termina el retroceso y **después**, en el mismo
>   minuto, hace mínimo por debajo del de la anterior, la corrida que acaba de nacer muere en esa misma vela: su
>   máximo es el extremo de la corrida y su mínimo empieza el retroceso siguiente. **El orden lo dice el color**,
>   como en `R-09`: vela azul, primero el mínimo; vela blanca, primero el máximo. Espejo en la bajista.

**`R-06 · Retroceso`**, nueva viñeta en «Cómo se aplica», después de «Tras una corrida bajista»:

> - **Un retroceso puede durar una sola vela y terminar en ella misma** *(desde `VUELTA_EN_VELA_DESDE`)*: es la
>   vela que mata la corrida y, después, hace máximo por encima del de la anterior (`R-05`). Su nivel de referencia
>   es el mínimo de esa vela.

**`R-09 · Marcar una zona`**, en el último punto de «Cómo se aplica», se añade:

> … decide qué vela sostiene la zona. **Desde `VUELTA_EN_VELA_DESDE`, si la vela da las dos vueltas (`R-05`),
> sostiene las dos zonas**: la del retroceso, sobre su mínimo, y la de la corrida, sobre su máximo, cada una cuando
> se confirma.

**`HISTORIAL.md`** del plan: la entrada del cambio, con el caso del 21/10 vela 08:40 y las palabras de Kris.

El plan se cambia en su commit `plan: …`, sincronizado (`sincronizar.mjs`, huellas, `npm run verificar`).

## 4 · El motor y el bot

**La regla:** después de la primera vuelta de una vela, si el color dice que la segunda llegó **después**, se
vuelve a evaluar **la misma vela** en el estado nuevo:

| Estado al empezar la vela | La vela hace | Color (alcista) | Hoy | Con el cambio |
|---|---|---|---|---|
| corrida | máximo nuevo **y** mínimo bajo el de la anterior | azul (primero el mínimo) | punto en el máximo anterior; el retroceso arranca en esta vela | igual y, además, **si su máximo supera el de la anterior**: punto en su mínimo (fin del retroceso) y la corrida nueva arranca con su máximo |
| retroceso | mínimo nuevo **y** máximo sobre el de la anterior | blanca (primero el máximo) | punto en el mínimo anterior; la corrida arranca en esta vela | igual y, además, **si su mínimo baja del de la anterior**: punto en su máximo (muere la corrida) y el retroceso nuevo arranca con su mínimo |

Espejo en la bajista. La segunda vuelta pasa por el **mismo código** que la primera: crea su zona (`R-09`),
respeta el 50 % (`R-12`), cierra la zona pendiente, todo igual. No hay una tercera vuelta: una vela tiene dos
extremos.

**La fecha va dentro del motor**, con `VUELTA_EN_VELA_DESDE`. Sin ella, cambiar `lector.py` cambia su huella, y
la cadena (`subir_dia.py --pendientes`) **rehace los últimos días** con la regla nueva: se rectificaría lo
anterior sin querer. Con la fecha, esos días se rehacen y salen idénticos.

**Las dos copias, juntas:** `lector.py` y `MotorChaumer.cs`, con `scripts/bot/sincronia.py --sellar` a **0
diferencias** (el hook lo exige).

## 5 · El indicador `MarcacionChaumer`

- **`ZigzagChaumer.Calcular`** gana la segunda vuelta, con la fecha, igual que el motor.
- **El orden real**, solo en vivo:
  - el indicador pasa a recibir cada tick (`OnPriceChange`), pero **solo calcula al cerrar la vela**, como hoy;
  - durante la vela apunta **a qué hora llegó su máximo y a qué hora su mínimo**; al cerrar, ese orden sustituye
    al color para esa vela;
  - las velas que no vio en vivo (al recompilar o reabrir el gráfico) usan el color. Ese orden **se guarda en un
    archivo del día** (`Documentos\NinjaTrader 8\marcacion-chaumer\AAAA-MM-DD.txt`) para no perderlo al reabrir;
  - `Calcular` recibe el orden como argumento opcional. Sin él, usa el color, así que `sincronia.py` sigue
    comparándolo con el motor y a 0 diferencias.
- **Lo que verás distinto del motor:** solo las velas en que el color se equivoque de orden. Ahí tu línea sigue lo
  que de verdad pasó; el motor y el bot, el color.

## 6 · Verificación

1. **Regresión:** el motor nuevo sobre **todos los días hasta el 20/10** da exactamente las mismas fichas que el
   actual (zigzag, zonas, operaciones).
2. **Hoy, 21/10:** el motor marca la 08:40 en 29.813,50 **y** en 29.884,75, como el boceto aprobado.
3. `sincronia.py --sellar` a 0 diferencias, y el hook pasa.
4. Los `.cs` compilan con el Roslyn de NinjaTrader (`compilar_todo.ps1`). Kris **recompila en NT8** (F5) y
   reinicia el bot.
5. La cadena rehace los últimos días: comprobar con un `SELECT` que las fichas anteriores al 21/10 no cambian de
   operación ni de resultado.

## 7 · Fuera

- **Los días anteriores al 21/10** no cambian, ni en el motor ni en el backtesting.
- **El bot no usa ticks** (§2).
- `VistaMotorChaumer` dibuja el motor del bot: hereda el cambio sin tocarla.
