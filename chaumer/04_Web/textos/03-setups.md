# 03 · Setups operativos

> Dirección: `/setups`
> Corrige el texto libremente. **No borres ni cambies las líneas `<!-- id: … -->`**:
> son las que dicen a qué parte de la página vuelve cada bloque.

<!-- id: cabecera -->

## Setups operativos

Los dos únicos setups que se operan: Continuación y Reingreso

---

<!-- id: dos -->

### Solo hay dos R-23

El método no busca oportunidades: busca **dos figuras concretas**. Si lo que hay delante no es una de las dos, no hay operación, por bien que se vea el gráfico.

> **[FICHA]**
> #### Rompimiento que funciona
> El precio rompe una zona y sigue. Se opera **a favor** del rompimiento.

> **[FICHA]**
> #### Rompimiento fallido
> El precio rompe una zona, no sigue y se da la vuelta. Se opera **en contra** del rompimiento.

> 🖼 **Gráfico.** Texto alternativo: Lámina del setup Continuación: sobre un IRI fluido —impulso, retroceso, impulso— el segundo impulso rompe la zona y la entrada va en la vela que confirma

> 🖼 **Gráfico.** Texto alternativo: Lámina del setup Reingreso: el precio rompe la zona y confirma, falla, y vuelve a atravesarla entera hasta salir por el borde contrario, donde está la entrada

> **[REGLA DURA]**
> **Se toma el primero que aparezca y se llene.** No se compara con lo que pueda venir después, ni se espera «uno mejor». El criterio es el reloj, no la calidad.

---

<!-- id: continuacion -->

### Continuación R-25

#### El concepto fundamental

La Continuación es un modelo de entrada autocontenido. Significa que no necesitas buscar referencias del pasado ni indicadores externos: el propio movimiento del precio crea en tiempo real la zona que va a romper.

Se construye sobre un **IRI (Impulso - Retroceso - Impulso)**: una corrida deja su zona, el precio retrocede y la corrida siguiente rompe esa zona. El IRI es la estructura, y no se opera por sí solo; la Continuación es ese IRI más su consecución, que es la entrada.

La lógica de la entrada es simple:

#### La secuencia operativa en 5 pasos (sesión real)

1. **Una corrida (Impulso 1).** Es el movimiento inicial donde el precio avanza con fuerza en una dirección.
2. **Un retroceso.** El movimiento se detiene a descansar o “respirar”. Este punto define el extremo opuesto temporal.
3. **La zona.** Se marca el nivel exacto en la vela extrema que dejó la corrida antes de empezar a retroceder. **Sin zona marcada en la vela extrema, no existe la Continuación.**
4. **Rompimiento.** El precio reanuda la marcha y rompe esa misma zona en el sentido del movimiento original por al menos un tick.
5. **Confirmación / consecución (la entrada).** La entrada se ejecuta en la vela que da la consecución. Esto ocurre cuando una vela sobrepasa el extremo de la vela que rompió la zona.

> 🖼 **Gráfico.** Texto alternativo: Una Continuación completa: movimiento, retroceso, zona, rompimiento y consecución
> Pie: Los cinco pasos sobre una sesión real. La vela de la consecución es la que entra.

#### Reglas de tiempo e invalidación

- **Plazo para la consecución (Regla R-14)** — Hay un tope máximo de **5 velas**, contadas a partir de la vela siguiente a la que rompió la zona, para que aparezca la vela de confirmación.
- **Nota importante** — Las **5 velas** son un límite máximo, no una espera obligatoria. Lo normal es que la consecución ocurra en la primera o segunda vela inmediatamente posterior al rompimiento.
- **Si no llega a tiempo** — La entrada queda completamente invalidada. La orden o idea se descarta. La zona deja de funcionar para este setup y sigue su propio camino técnico.

#### Gestión parametrizada (stop loss y filtro)

- **Ubicación del stop loss (SL)** — Se coloca en el punto más extremo alcanzado por el retroceso: el punto más lejano desde que nació la zona extrema hasta la vela que realizó el rompimiento.
- **Relación riesgo/beneficio** — Se mantiene estrictamente en **1:1** con respecto a la distancia del stop.
- **Filtro de objetivo** — Para que la operación sea válida, el camino desde el punto de entrada hasta el objetivo 1:1 debe estar completamente libre de zonas vivas que puedan frenar o rebotar el precio.

---

<!-- id: fluida -->

### Corrida fluida R-40

La Continuación solo se opera si la corrida que la arma es **fluida**. La secuencia tiene que salir bien tres veces seguidas; si falla una, ese rompimiento no se opera.

1. **La corrida deja su zona** al terminar.
2. **El retroceso no se pasa.** Mide menos que su corrida. Se miden los dos sobre el zigzag: la corrida desde su arranque hasta su extremo, y el retroceso desde ese mismo extremo hasta su nivel de referencia. Si empatan, no se pasa.
3. **La corrida siguiente rompe esa zona.** Ese es el rompimiento que opera la Continuación.

- **Quién declara el sentido** — La vela de apertura. Desde ahí el mercado alterna corrida en ese sentido y retroceso en contra
- **Cómo se emparejan** — Cada corrida con el retroceso que viene justo después de ella. Las parejas no se solapan: tras una pareja rota, la cuenta empieza de nuevo con la corrida siguiente
- **A qué setup afecta** — Solo a la Continuación. El Reingreso no se toca
- **El tope de riesgo** — No tiene nada que ver. Una entrada puede caber de sobra en el tope y quedar fuera igual

#### Cuando falla

- **El retroceso se pasa** — Mide más que su corrida. Quedan fuera para entrar las dos zonas de la pareja: la de la corrida y la que deja el propio retroceso
- **La corrida siguiente no rompe** — Se devuelve sin romper la zona. El mercado está lateral y esa zona queda bloqueada

> **[NO SE HACE]**
> **Perdida la fluidez, se bloquea el sentido del día entero.** No se opera ningún rompimiento en el sentido que declaró la vela de apertura, sea cual sea la zona — tampoco las de premercado. El sentido contrario no se toca.

#### El rompimiento directo

Es el rompimiento de una zona mientras el sentido está bloqueado. Por parámetros cumple, pero el mercado está lateral: **no se opera nunca**. Solo sirve como primer paso para recuperar la fluidez.

#### Cómo se recupera

1. **La zona bloqueada queda rota con su consecución.** Ese es el rompimiento directo, y no se opera.
2. **El mercado arma un IRI nuevo entero más allá:** corrida que deja su zona, retroceso que la confirma y rompimiento de esa zona con su consecución. La zona nueva tiene que quedar **entera** más allá de la bloqueada: por encima si se busca largo, por debajo si se busca corto. Se entra en ese rompimiento, no antes.

> **[REGLA DURA]**
> **La fluidez se puede volver a perder.** Recuperarla no vale para toda la jornada: cada movimiento se juzga por separado. Si el IRI siguiente tampoco es fluido, el sentido se vuelve a bloquear y hay que esperar otro.

> **[REGLA DURA]**
> **La zona bloqueada sigue viva.** Se dibuja, tapa objetivos, hace de borde de franja y se rompe e invalida como cualquier otra. Lo único que se descarta es entrar en su rompimiento.

---

<!-- id: reingreso -->

### Reingreso · rompimiento fallido R-26

Es el contrario exacto de la Continuación. Aquí el rompimiento se confirmó pero el precio **no continuó**: se dio la vuelta y se comió la zona entera. Se opera esa vuelta.

> 🖼 **Gráfico.** Texto alternativo: Un Reingreso: rompimiento con consecución que falla y el precio recupera la zona entera
> Pie: El rompimiento se confirmó y no siguió. El precio atraviesa la zona completa y sale por el borde contrario: ahí empieza el Reingreso.

1. **Sobre una zona hubo rompimiento y confirmación.** El traspaso está hecho.
2. **El precio no continúa** en esa dirección.
3. **El precio atraviesa la zona entera y sobrepasa el borde contrario.** No basta con tocarla ni con meterse dentro: tiene que salir por el otro lado. Esa vela hace de vela de rompimiento del Reingreso.
4. **Confirmación: y esa es la entrada.** Una vela pasa el extremo de la vela anterior, igual que en la Continuación.

- **Dirección** — Contraria a la del rompimiento que falló
- **Plazo para que aparezca** — **Ninguno.** El límite de 5 velas no aplica aquí
- **Dónde va el stop** — En el extremo de la **corrida fallida**, la que rompió y no continuó
- **Filtro propio** — El objetivo **no puede pasar del punto de referencia**

#### El punto de referencia R-41

El Reingreso es el único setup con este filtro. **Todo retroceso deja un punto de referencia:** su nivel de referencia, el mínimo más bajo si el retroceso baja y el máximo más alto si sube. Es el mismo vértice que ya dibuja el zigzag.

- **Cuál manda** — El punto de referencia vivo más cercano a la entrada que quede entre la entrada y el objetivo. Vale el de cualquier retroceso, no solo el del que originó la zona. Los que quedan fuera de ese tramo no estorban
- **Cuándo descarta** — Si el objetivo **pasa** de ese nivel, el Reingreso no se opera. Si cae justo encima, se opera: solo descarta pasarlo
- **Cuándo deja de contar** — Cuando una vela **cierra** más allá del nivel. A partir de ahí no estorba ningún objetivo

> **[REGLA DURA]**
> **Aquí manda el cierre, no la mecha.** Un pinchazo de mecha no rompe el punto de referencia. Es al revés que con una zona, que se rompe con solo pasar la mecha.

> **[REGLA DURA]**
> **El Reingreso es inmediato o no es.** La ventana se abre con la vela de la consecución y se cierra en cuanto el precio supera el extremo de esa misma vela.
> Cuando el precio sigue de largo, la ventana se cerró para siempre. No se espera a que vuelva.

---

<!-- id: comparar -->

### Diferencias

Comparten la mecánica de entrada — los dos entran con la confirmación — pero se diferencian en casi todo lo demás.

|  | Continuación | Reingreso |
| Qué opera | El rompimiento que funciona | El rompimiento que falló |
| Dirección | A favor del movimiento | Contraria al rompimiento |
| Plazo | 5 velas para la consecución | Sin plazo para aparecer; inmediato para entrar |
| Stop | Extremo del retroceso | Extremo de la corrida fallida |
| Filtros de objetivo | Camino libre de zonas vivas | Camino libre *y* sin pasar del punto de referencia |
| Corrida fluida | Obligatoria | No aplica |
| Día de la Fed | Prohibido | Permitido |

> **[REGLA DURA]**
> **El stop del Reingreso suele salir más ancho.** Se mide contra la corrida fallida, que está al otro lado de la zona, así que incluye la zona entera. Por eso el tope de riesgo descarta más Reingresos que Continuaciones.

---

## Anotaciones que seguian abiertas

Venian del archivo anterior y todavia no estan reflejadas en la pagina.
Borralas cuando ya no hagan falta.
- [NOTA: Puedes modificar el grafico, colocar uno mas tendencial y sencillo, explicando Impulso, Retroceso, Impulso]
- [NOTA: Puedes modificar el grafico, colocar uno mas sencillo, con menos velas, pero que se entienda el setup de Reingreso]
