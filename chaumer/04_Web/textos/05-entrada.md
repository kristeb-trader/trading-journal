# 05 · Mecánica de entrada

> Dirección: `/entrada`
> Corrige el texto libremente. **No borres ni cambies las líneas `<!-- id: … -->`**:
> son las que dicen a qué parte de la página vuelve cada bloque.

<!-- id: cabecera -->

## Mecánica de entrada

Cómo se coloca la orden, dónde va el stop y dónde el objetivo

---

<!-- id: orden -->

### Qué orden y dónde R-24

La entrada no se hace a mano. Se deja una orden puesta y se espera a que el mercado la llene solo.

> 🖼 **Gráfico.** Texto alternativo: La orden colocada un tick más allá del extremo de la vela de rompimiento
> Pie: La orden se coloca al cierre de la vela que rompió, un tick más allá de su extremo.

- **Tipo de orden** — **Stop Market.** Buy Stop para largos, Sell Stop para cortos
- **Cuándo se coloca** — Al **cierre de la vela de rompimiento**, ni antes ni después
- **A qué nivel, en largo** — Máximo de esa vela **+ 1 tick** (0,25 puntos)
- **A qué nivel, en corto** — Mínimo de esa vela **− 1 tick** (0,25 puntos)
- **Dónde se lee el nivel** — En el gráfico de **MNQ**, no en el de NQ
- **Desde dónde se manda** — Desde el Chart Trader de MNQ

> **[NO SE HACE]**
> **Orden a mercado: prohibida. Orden límite: prohibida.**
> No se persigue el precio a mano. Se coloca la orden y se espera.

Colocar la orden un tick más allá del extremo de la vela que rompió es lo mismo que decir que **entra sola cuando llega la confirmación**. La orden es la confirmación, convertida en instrucción.

---

<!-- id: medir -->

### Stop y objetivo R-32

Los dos se miden desde el nivel de entrada, y en este orden: primero el stop, que lo decide la estructura; después el objetivo, que sale del stop.

> 🖼 **Gráfico.** Texto alternativo: La distancia al stop y la misma distancia al objetivo desde la entrada
> Pie: La distancia hasta el stop, repetida al otro lado. Esa es toda la aritmética.

1. **Se ancla en la entrada.** Todo se mide desde ahí.
2. **Se coloca el stop en su referencia estructural.** En una Continuación, el punto más extremo que alcanzó el precio **desde que nació la zona hasta la vela que rompió** — no solo el extremo del retroceso que la originó. En un Reingreso, el extremo de la corrida fallida.
3. **Se mide esa distancia** y se pone el objetivo a la misma distancia al otro lado.

- **Relación** — **1:1.** El objetivo recorre exactamente lo mismo que el stop
- **Stop de una Continuación** — El punto más extremo alcanzado desde que nació la zona hasta la vela de rompimiento
- **Stop de un Reingreso** — El extremo de la corrida que rompió y no continuó

> **[NO SE HACE]**
> **El objetivo nunca se acorta para que quepa.** Si no cabe, la entrada se descarta entera.
> No existe media entrada, ni relación reducida, ni «lo tomo más corto por esta vez».

---

<!-- id: antes -->

### Antes de enviar

Con el stop y el objetivo ya medidos, y **antes** de tocar el botón, se comprueban los filtros. Basta que falle uno para que no haya operación.

> **[FICHA]**
> #### ¿El stop cabe?
> La distancia hasta el stop no puede pasar de **80 puntos**.

> **[FICHA]**
> #### ¿El camino está libre?
> Entre la entrada y el objetivo no puede haber ninguna zona viva.

> **[FICHA]**
> #### ¿Es día de la Fed?
> Ese día la Continuación no se opera.

> **[FICHA]**
> #### ¿Hay noticia cerca?
> Dentro de la ventana de una noticia roja no se coloca nada.

Los cuatro filtros, con sus casos límite, están en el módulo siguiente.

---

<!-- id: espera -->

### La orden esperando R-29

Entre que se coloca la orden y que se llena pueden pasar varias cosas. Solo una de ellas es entrar.

> **[REGLA DURA]**
> **Un retroceso nuevo NO cancela la orden.** Es lo más fácil de confundir: la aparición de una estructura nueva marca zona nueva, sí, pero deja la orden pendiente intacta.

Lo que sí la cancela — el plazo, la vuelta al stop, la hora y las noticias — está en el módulo siguiente, junto con el resto de lo que impide operar.

- **Si se llena** — Empieza el módulo **Dentro de la operación**
- **Si se cancela** — **No consume el cupo del día.** Se puede esperar otro setup dentro de la ventana
