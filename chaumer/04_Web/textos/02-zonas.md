# 02 · Marcación de zonas

> Dirección: `/zonas`
> Corrige el texto libremente. **No borres ni cambies las líneas `<!-- id: … -->`**:
> son las que dicen a qué parte de la página vuelve cada bloque.

<!-- id: cabecera -->

## Marcación de zonas

Qué es una zona, de qué vela sale y cómo se dibuja

---

<!-- id: movimiento -->

### Corrida y retroceso R-05 · R-06

El mercado solo tiene dos fases: se mueve con fuerza hacia una dirección (arriba o abajo) o hace una pausa y retrocede un poco, ya sea para continuar el movimiento o para cambiar de sentido. El movimiento con dirección es la **corrida**; la pausa es el **retroceso**. Todo lo que pasa en el gráfico cae en una de esas dos categorías.

> 🖼 **Gráfico.** Texto alternativo: Un movimiento alcista real separado en su corrida y su retroceso
> Pie: Movimiento alcista: la corrida sube y el retroceso baja.

> 🖼 **Gráfico.** Texto alternativo: El mismo mecanismo en un movimiento bajista real
> Pie: El mismo mecanismo hacia abajo: la corrida baja y el retroceso sube.

- **Cuándo nace una corrida** — Surge en la vela que rompe y supera el extremo de la anterior
- **Continuidad del movimiento** — Se mantiene activa mientras cada vela respete el extremo opuesto de la previa. Si empatan al tick, continúa vigente
- **Cuándo termina** — Termina en la primera vela que rompe en dirección contraria, así sea por 1 solo tick
- **Duración** — No tiene límite
- **El color de la vela** — No importa en absoluto
- **Una vela dentro de la anterior** — No interrumpe ni altera la continuidad de la corrida

> **[REGLA DURA]**
> **Un retroceso no tiene tamaño mínimo ni máximo de velas.** Puede ser una sola vela. No se descarta un movimiento por parecer demasiado corto o demasiado largo.

Del retroceso interesa un punto concreto: **su extremo** — el más bajo si la corrida era alcista, el más alto si era bajista. Ahí irá el stop cuando llegue el momento, y ese punto reaparece en casi todas las decisiones que vienen después.

---

<!-- id: nace -->

### Generación de zonas R-09 · R-16 · R-19

Cuando una corrida termina, deja un rastro en el gráfico: una franja de precio que se llama **zona**. No se dibuja a ojo. Sale siempre de la misma vela y con los mismos límites.

1. **Se Identifica fin de corrida**: Se busca la vela del máximo más alto si la corrida fue alcista, la del mínimo más bajo si fue bajista.
2. **Se dibuja una zona del borde del cuerpo a la punta de la mecha** de esa vela. Ese es todo el criterio.
3. **Se extiende hacia la derecha**, a lo largo del gráfico.

> 🖼 **Gráfico.** Texto alternativo: La vela que genera la zona y los dos bordes exactos que la delimitan
> Pie: La vela que genera zona y sus dos bordes: del borde del cuerpo a la punta de la mecha. Ni un tick más, ni un tick menos.

- **Corrida alcista** — Deja una zona de **resistencia** en la parte de arriba
- **Corrida bajista** — Deja una zona de **soporte** en la parte de abajo
- **Y su retroceso** — El retroceso de una corrida alcista deja **soporte**; el de una corrida bajista genera una **resistencia** arriba
- **Vela sin mecha** — La zona queda dibujada como una línea sobre el precio de cierre o apertura
- **Vela sin cuerpo** — La zona se traza desde el precio de apertura o cierre hasta la punta de la mecha
- **Una vela con máximo mayor y mínimo menor** — El orden dentro de la vela decide cuál sostiene la zona

> 🖼 **Gráfico.** Texto alternativo: La zona ya dibujada y extendida hacia la derecha sobre una sesión real
> Pie: Ya extendida: el rectángulo se dibuja desde la vela de origen, no desde donde el precio vuelva más tarde.

#### Cuándo se dibuja cada una

Las dos zonas de un movimiento no nacen a la vez, y confundirlo lleva a operar algo que todavía no existe:

> **[FICHA]**
> #### La zona de la corrida
> Se dibuja **en cuanto aparece el retroceso**, en vivo. Ya se puede operar.

> **[FICHA]**
> #### La zona del retroceso
> Mientras el retroceso vive es solo una **línea provisional** que se mueve con cada vela. Se convierte en zona cuando aparece el movimiento contrario.

> **[NO SE HACE]**
> **Una línea provisional no opera.** No admite rompimiento, ni consecución, ni reingreso. Hasta que no es zona, no existe para el método.

---

<!-- id: consecucion -->

### Rompimiento y consecución R-20 · R-22 · R-19

Superar una zona son dos cosas, no una. Primero el **rompimiento**, después la **consecución**. Y el mismo mecanismo que supera una zona es el que más tarde dispara la entrada.

> **[FICHA]**
> #### Rompimiento
> El precio pasa el borde de la zona por al menos **un tick**.
> Basta la mecha. **El cierre da igual.**

> **[FICHA]**
> #### Consecución
> Una vela posterior pasa por un tick el **extremo de la vela que rompió**.
> Recién ahí la zona quedó traspasada.

> 🖼 **Gráfico.** Texto alternativo: La vela que pasa el borde de la zona y la que después pasa de su extremo
> Pie: Las dos velas del traspaso sobre una sesión real: la que rompe, y la consecución que pasa de su extremo.

#### Dos maneras de romper

Hay dos tipos de vela de rompimiento: Vela de rompimiento con mecha y vela de rompimiento con cuerpo. La diferencia es que la primera pasa el borde pero cierra dentro de la zona, y la segunda pasa el borde y cierra fuera de la zona.

> 🖼 **Gráfico.** Texto alternativo: Una vela que pasa el borde con la mecha y cierra dentro de la zona
> Pie: Rompimiento con mecha: la vela pasa el borde pero cierra dentro de la zona. Sigue siendo rompimiento.

> 🖼 **Gráfico.** Texto alternativo: Una vela que pasa el borde y cierra fuera de la zona
> Pie: Rompimiento con cuerpo: la vela cierra al otro lado del borde.

> **[REGLA DURA]**
> **Un rompimiento solo, sin consecución, no invalida nada.** La zona sigue viva y sigue contando para todo.
> Y la vela que da la consecución de un traspaso no abre a la vez el rompimiento del lado contrario: eso se busca a partir de la siguiente.

---

<!-- id: estira -->

### Cuando no llega la consecución R-10 · R-14

El precio rompe una zona **con mecha** —el cierre se queda dentro— y la consecución no llega. Eso se puede acabar de dos maneras, y vale **la que llegue primero**:

**Una ·** pasan **5 velas** desde la siguiente a la del rompimiento, y la consecución no ha llegado.

> 🖼 **Gráfico.** Texto alternativo: Una vela cruza la zona y ninguna de las siguientes supera su extremo
> Pie: El caso más común: la vela cruza la zona, pero ninguna de las siguientes pasa de su extremo. No hubo traspaso y la zona sigue viva.

**Otra ·** antes de esas 5 velas, el mercado arma una **estructura completa en sentido contrario**:

1. Una vela que **no da la consecución** y se va en contra.
2. Otra que **hace retroceso**.
3. Una tercera que **no sigue ese retroceso** y vuelve en el sentido de la primera. **La zona se estira en esa tercera vela**, sin esperar más.

> 🖼 **Gráfico.** Texto alternativo: Antes de las cinco velas el mercado arma una estructura en contra y la zona se estira en la tercera vela
> Pie: No hizo falta esperar: antes de las cinco velas el mercado armó la estructura en contra, y la zona se estiró en la tercera vela.

En cualquiera de los dos casos, la zona **se estira** hasta la punta de la mecha que la rompió. **Si es una resistencia, se estira solo por arriba; si es un soporte, solo por abajo.** El otro borde no se mueve. Sigue habiendo **una sola zona**, más grande, y conserva su historial.

> **[NO SE HACE]**
> **Un soporte nunca se estira hacia arriba, ni una resistencia hacia abajo.** Si el precio cruza la zona por el lado contrario, no hay nada que estirar: ese cruce no la toca, solo la mata cuando llegue su consecución.

> **[REGLA DURA]**
> **Las 5 velas son un tope, no una espera obligatoria.** Si antes de que se cumplan el mercado arma la estructura en contra, todo se resuelve en ese momento y no se espera más.

---

<!-- id: apendice -->

### La zona apéndice R-11

El precio rompe una zona **con cuerpo** —el cierre queda fuera— y la consecución no llega. Se acaba igual que al estirar, de dos maneras, y vale **la que llegue primero**: o pasan **5 velas** desde la siguiente a la del rompimiento, o antes el mercado arma la **estructura completa en sentido contrario** —la misma de tres velas—, y entonces la apéndice nace en la tercera, sin esperar más.

En cualquiera de los dos casos **la zona original no se toca** y nace una **segunda zona** sobre la mecha de la vela de rompimiento: la **zona apéndice**. Un borde es el borde del cuerpo de esa vela; el otro, la punta de su mecha.

Con la mecha se estira la zona; con el cuerpo nace otra. **Lo único que cambia es dónde cierra la vela de rompimiento.**

> 🖼 **Gráfico.** Texto alternativo: Caso 1: pasan las cinco velas sin consecución y ahí se marca la zona apéndice
> Pie: Caso 1: ninguna de las cinco velas vuelve a pasar de la mecha. Al vencer el plazo se marca la apéndice, y la original se queda intacta.

- **Qué lo dispara** — Rompimiento con cuerpo sin consecución: o pasan **5 velas**, o antes el mercado arma la estructura en contra. Lo que llegue primero
- **La zona original** — No se modifica
- **Un borde de la apéndice** — El borde del cuerpo de la vela que rompió
- **El otro borde** — El extremo de su mecha
- **Zonas resultantes** — 2: la original y su apéndice
- **Desde dónde se dibuja** — Desde la vela que rompió, aunque no quede marcada hasta más tarde. Del mismo gris que cualquier otra zona

> **[REGLA DURA]**
> **La apéndice no nace por acción del precio sobre ella.** No es una zona más que apareció: es el rastro de un rompimiento que se quedó sin consecución.

> 🖼 **Gráfico.** Texto alternativo: Caso 2: antes de las cinco velas el mercado arma una estructura en sentido contrario
> Pie: Caso 2: antes de que venza el plazo el mercado arma una estructura completa en sentido contrario. La apéndice se marca ahí.

---

<!-- id: convivencia -->

### Zonas entre zonas R-12 · R-17 · R-18

A lo largo de la mañana el precio deja muchas zonas candidatas. Si se marcaran todas, el gráfico acabaría siendo una reja de rectángulos y se operaría con demasiado ruido. Dos reglas lo impiden, y las dos se aplican en el mismo momento.

#### Solo una zona entre zonas

Cuando hay una zona por arriba y otra por abajo, se calcula el punto medio entre sus bordes internos. Solo se marca zona nueva si el movimiento que la genera **no supera el 50%** entre esas dos zonas.

> 🖼 **Gráfico.** Texto alternativo: Una zona marcada entre otras dos: el movimiento se quedó de un lado de la mitad
> Pie: El movimiento entero se queda del lado en el que empezó. Por eso esta zona sí se marca.

> 🖼 **Gráfico.** Texto alternativo: Un movimiento entre dos zonas que cruza la mitad y por eso no marca zona
> Pie: El mismo caso al revés: el movimiento cruzó la mitad, así que ahí no se marca nada.

> **[REGLA DURA]**
> **Solo se marca una sola zona entre zonas** entre cada resistencia y soporte, si cumple las reglas. Es decir: si se presentan más zonas en el día entre ese rango de resistencia y soporte, ya no se marcan más zonas.

#### Una sola por franja y por jornada

La franja entre dos zonas admite **una zona en todo el día**, y el turno lo resuelve el primer retroceso que aparezca dentro. Si ese primero respeta la mitad, se marca; si no la respeta, no se marca. En los dos casos **la franja queda cerrada** para el resto de la jornada, y no se reabre aunque las zonas que la formaban se mueran.

Cualquier zona viva sirve de borde de la franja, incluidas las que se marcaron de madrugada por volumen.

> **[NO SE HACE]**
> **Salir de una zona es rompimiento y tambien consecución** No solo rompimiento. Mientras un rompimiento espera su consecución, no se marca zona al otro lado de esa zona, a menos que pasen las 5 velas sin consecución o aparezca un retroceso nuevo. En ese caso sí se marca zona, aunque no haya habido consecución.

---

<!-- id: caduca -->

### Cuándo quitar una zona R-21

Una zona muere cuando ha sido superada **en las dos direcciones**: rompimiento y consecución hacia un lado, y rompimiento y consecución hacia el otro.

> 🖼 **Gráfico.** Texto alternativo: Una zona traspasada primero hacia un lado y después hacia el otro
> Pie: Traspasada en los dos sentidos. A partir de ahí no bloquea ni sirve para entrar.

- **Solo rompimiento, sin consecución** — La zona sigue vigente. No ha pasado nada
- **Superada en un solo sentido** — Sigue viva. Cambia de papel: el soporte pasa a resistencia y al revés
- **Superada en los dos** — **No cuenta para nada.** Ni bloquea un objetivo, ni sirve para entrar, ni cuenta para medir la mitad entre zonas
- **En pantalla** — Se deja dibujada en tono muy tenue, solo como recuerdo

Esa distinción importa más de lo que parece: una zona que sigue viva puede impedir una entrada perfectamente válida, porque se cruza en el camino del objetivo.

Cuando una zona **no es válida visualmente**, se baja el contraste de color de esa zona, para que no confunda. Pero sigue viva en la memoria del plan hasta que se cierre la jornada.
