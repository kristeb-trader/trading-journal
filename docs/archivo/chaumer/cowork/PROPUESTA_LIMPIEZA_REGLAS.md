# PROPUESTA DE LIMPIEZA DE LAS REGLAS

**Fecha:** 2026-09-04 · **Estado:** 🟢 **Puntos 1, 2 y 4 APLICADOS el 04/09/2026. El punto 3 (fusiones) sigue pendiente.**
**Origen:** revisión completa de las 39 reglas, una por una, tras descubrir un duplicado.

> Este documento **no cambia ninguna regla**. Recoge lo que encontré al revisarlas todas y lo que propongo hacer. Cada punto necesita tu visto bueno antes de tocarse.

---

## 1 · ✅ YA APLICADO — el duplicado

**`R-39` era `R-14` otra vez.** `R-14` se confirmó el 24/08/2026 y decía, con estas palabras, *"el plazo de 5 velas es un tope, no una espera"*. El 01/09 el auditor escribió `R-39` diciendo exactamente lo mismo, sin haberla buscado antes.

**Hecho:** `R-39` eliminada. Su aportación real —la definición medible de las tres velas de la estructura contraria— vive ahora dentro de `R-14`, que además gana **sección propia** en el documento maestro. Hasta hoy `R-14` existía solo como una fila de tabla, **y ésa es la razón de fondo por la que se pudo duplicar**.

**Plan de 39 → 38 reglas.**

---

## 2 · ✅ APLICADO 04/09/2026 — cinco sitios donde sobrevivía una definición ya corregida

Esto no son duplicados. Son **contradicciones vivas**: reglas confirmadas que siguen diciendo lo que decían **antes** de que tú las corrigieras. Un ejecutor que lea la regla equivocada hace la operación mal.

### 2.1 · El stop, en cuatro sitios con la definición vieja

El **27/08/2026** confirmaste que el stop es **el extremo alcanzado desde que nació la zona hasta el rompimiento**, no solo el extremo del retroceso que la originó. Ese cambio se escribió en el texto de `R-32`… pero **no se propagó**:

| Dónde | Qué sigue diciendo |
|---|---|
| `R-32` en `reglas.json` | *"stop_IRI_largo: el punto MÁS BAJO del retroceso"* — **el propio archivo de datos contradice al texto de su propia regla** |
| `R-06` | *"nivel_de_referencia: el mínimo más bajo del retroceso… ahí va el stop"* |
| `R-31` | *"filtro_previo_al_envio: IRI: distancia entrada ↔ extremo del RETROCESO"* |
| `R-29` | *"el precio vuelve al extremo del retroceso, que es el mismo punto del stop"* |

> ⚠️ **La primera es la peligrosa.** El portal se construye contra `reglas.json`. Tal como está hoy, **el portal va a mostrar la definición vieja del stop**, aunque el documento maestro tenga la buena.

**Propuesta:** corregir los cuatro para que digan *"el extremo alcanzado desde que nació la zona hasta la vela de rompimiento"*. No es cambiar una regla: es terminar de aplicar una corrección que ya autorizaste.

### 2.2 · La consecución, con un plazo que ya no existe

`R-20` sigue diciendo que la consecución es *"superar el extremo de la vela de rompimiento **dentro de las 5 velas siguientes**"*.

El **27/08/2026** confirmaste lo contrario: **la consecución que traspasa una zona NO tiene plazo** — puede llegar 25 velas después, como pasó el 13 de julio. El plazo de 5 velas gobierna la geometría de la zona y la vida de la orden, no el traspaso.

**Propuesta:** quitar *"dentro de las 5 velas siguientes"* del enunciado de `R-20` y dejar el plazo donde corresponde.

---

## 3 · 🟡 Reglas que se pueden unir

Ninguna se contradice con otra. Son la misma idea dicha desde dos ángulos, y separadas obligan a leer dos fichas para entender una sola cosa.

### 3.1 · Tres reglas para decir "una operación y se acabó el día"

| Regla | Qué dice hoy |
|---|---|
| `R-28` | máximo una operación por sesión |
| `R-23` | se toma el primer setup válido; no se comparan setups |
| `R-34` | al llenarse la orden termina el **análisis** del día, no solo la operativa |

Las tres describen el mismo momento. `R-34` es la que más añade —no marcar más zonas, no buscar más setups, cerrar la plataforma—.

**Propuesta:** una sola regla, *"una operación por sesión, la primera que se llene, y ahí termina el día"*, con las tres partes dentro. **3 → 1**

### 3.2 · Dos reglas para decir "solo hay dos salidas"

| Regla | Qué dice hoy |
|---|---|
| `R-30` | la posición se gestiona hasta stop o target, aunque termine la ventana |
| `R-33` | una vez ajustados stop y target, no se gestiona la posición. Nunca |

`R-30` lo dice contra el reloj, `R-33` contra la mano. La conclusión es idéntica: **solo stop o target cierran la posición**.

**Propuesta:** una sola regla con las dos caras. **2 → 1**

### 3.3 · Dos reglas para la vela de apertura

| Regla | Qué dice hoy |
|---|---|
| `R-07` | la vela de las 08:31 declara la dirección inicial y es la vela origen |
| `R-27` | esa dirección **no obliga** a operar en ese sentido toda la sesión |

`R-27` es literalmente la segunda mitad de la frase de `R-07`. Leerlas por separado es lo que llevó al auditor a sesgar toda una jornada en su momento.

**Propuesta:** una sola regla, *"la vela de apertura: origen sí, sesgo no"*. **2 → 1**

### 3.4 · `R-19` no es una regla: es un cajón

`R-19` son *"seis precisiones de dibujo"*, y **cinco de las seis ya viven en otra regla**:

| Punto de `R-19` | Dónde ya está |
|---|---|
| 1 · el rompimiento se lee por la mecha | `R-20` |
| 2 · el rompimiento solo no invalida | `R-21` |
| 3 · el rectángulo se dibuja desde la vela origen | `R-09` y `R-16` |
| 4 · se estira solo hacia el nuevo extremo | `R-13` |
| 5 · no se solapan zonas de tipo distinto | **solo aquí** — esto sí es propio |
| 6 · el orden intravela decide qué vela sostiene la zona | `R-08` |

**Propuesta:** disolver `R-19`, llevar cada punto a su regla de origen, y dejar el punto 5 como regla propia. Así ninguna precisión se pierde y ninguna se dice dos veces.

### Si aceptas los cuatro
**38 → 33 reglas.** Ninguna idea se pierde: se juntan las que ya eran la misma.

---

## 4 · ✅ APLICADO 04/09/2026 — cómo quedan agrupadas

Hoy las categorías del archivo de reglas están desordenadas: hay una llamada `marcado_zonas` con 4 reglas, y **otras 11 del mismo tema repartidas en cinco categorías distintas** — doce metidas en un cajón llamado `contexto` que no significa nada. El buscador del portal se va a construir sobre eso.

Propongo **siete grupos por tema real**, en el orden en que se usan durante el día. El grupo de zonas lleva **dos niveles**, por lo que se explica más abajo:

### 1 · Perímetro operativo — *qué, cuándo y con qué* (4)
`R-01` instrumento · `R-02` ventana · `R-03` gráfico limpio · `R-04` tamaño

### 2 · Estructura del precio — *el vocabulario* (4)
`R-05` corrida · `R-06` retroceso · `R-07` vela de apertura · `R-08` vela envolvente

### 3 · ZONAS — *todo lo que tiene que ver con una zona* (14)
Una sola categoría, con **dos apartados dentro**:

| Apartado | Qué contesta | Reglas |
|---|---|---|
| **Marcado** (11) | dónde se dibuja una zona | `R-09` · `R-10` · `R-11` · `R-12` · `R-13` · `R-14` · `R-15` · `R-16` · `R-17` · `R-18` · `R-19` |
| **Vigencia** (3) | cuándo una zona vale y cuándo muere | `R-20` rompimiento y consecución · `R-21` invalidación · `R-22` la vela que confirma |

> 🔑 **Por qué dos niveles y no dos categorías separadas.** Cuando al operador le surge una duda no piensa *"esto es de marcado"* o *"esto es de vigencia"*: piensa **"es una duda de zonas"**. Así que arriba va una sola categoría. Pero **14 de 38 es más de un tercio del plan**, y un filtro que devuelve un tercio no filtra nada — por eso dentro hacen falta los dos apartados.
>
> ⚠️ La regla del rompimiento y la consecución (`R-20`) tiene un pie en cada lado: define cómo muere una zona **y** cómo se entra. Va en Zonas, pero debe aparecer enlazada también desde Setup y entrada.

### 4 · Setup y entrada — *cuándo se opera* (5)
`R-23` · `R-24` · `R-25` IRI · `R-26` Reingreso · `R-27`

### 5 · Riesgo, orden y gestión — *cuánto y hasta dónde* (7)
`R-28` · `R-29` · `R-30` · `R-31` · `R-32` · `R-33` · `R-34`

### 6 · Filtros de no-operar — *los días que no* (3)
`R-35` noticias rojas · `R-36` FOMC · `R-37` estado del operador

### 7 · Proceso diario (1)
`R-38` checklist y bitácora

**Cobertura verificada: las 38 reglas entran, ninguna se repite, ninguna se queda fuera.**

> 📌 **Si se aprueban las fusiones del punto 3**, el grupo de Zonas baja de 14 a 13 (se disuelve `R-19`) y el de Riesgo de 7 a 4. El reparto sigue siendo el mismo.

---

## Qué falta decidir

| # | Decisión | Estado |
|---|---|---|
| 1 | Corregir la definición del stop en los cuatro sitios | ✅ 04/09 |
| 2 | Quitar el plazo del enunciado de la consecución | ✅ 04/09 |
| 3 | Unir las tres de "una operación por sesión" | ⏳ |
| 4 | Unir las dos de "solo hay dos salidas" | ⏳ |
| 5 | Unir las dos de la vela de apertura | ⏳ |
| 6 | Disolver el cajón de las seis precisiones | ⏳ |
| 7 | Adoptar los siete grupos, con Zonas en dos niveles | ✅ 04/09 |

**Aplicado hoy:** cero contradicciones vivas y siete categorías con sentido.
**Queda pendiente:** las cuatro fusiones del punto 3 — llevarían el plan de **38 → 33 reglas**.
