# «Reglas»: el plan de la jornada como mapa

**Versión:** v1 · **Estado:** ✅ implementado (20/10/2026) · **Fecha:** 20/10/2026

| Versión | Qué cambió |
|---|---|
| v1 | Primera propuesta, tras el análisis con bocetos de los tres niveles. Decisiones de Kris del 20/10/2026 incluidas |
| v1.1 | Implementado. Desviaciones: (1) las fases 2, 3 y 4 se publicaron juntas, porque comparten el orquestador (`plan.mjs`); cada una se verificó con su criterio. (2) El contenido de las láminas va en un `<template>` por apartado, no en el HTML a la vista: así `/plan` no descarga los 32 gráficos al entrar; sin JavaScript queda la lista, que enlaza a la página de cada paso. (3) La rueda del ratón solo hace zoom con Ctrl (el pellizco del trackpad también): sin Ctrl desplaza la página, que tiene menú y pie. (4) El escenario usa `overflow: clip`: con `hidden` el navegador lo desplazaba al enfocar un botón. (5) Cada paso de la lista lleva su `id`, para que `/plan#zonas` (la portada) sea un ancla válida |

---

## 1. Qué se pide

Un ítem **«Reglas»** en el menú del portal. Al pulsarlo, a la derecha del menú (dentro del portal, no en una
página a pantalla completa) aparece **el plan de la jornada como un mapa**: los 8 pasos (Premercado, Marcación
de zonas, Setups…) con la estética del mapa actual: núcleo, piezas con borde de color, líneas luminosas,
transición con zoom.

**Lo que no se puede perder:** cada apartado de hoy, con **toda** su explicación y **sus gráficos**. El ejemplo de
Kris es «Corrida y retroceso», en Marcación de zonas: el texto, los dos gráficos y la tabla tienen que verse
igual que hoy.

### Decisiones de Kris (20/10/2026)

| Pregunta | Respuesta |
|---|---|
| Al entrar en un paso, ¿apartados o reglas? | **Apartados** (opción A), como hoy, y sin perder las imágenes |
| ¿Qué pasa con la versión actual (los 8 ítems del menú)? | **Se queda, para comparar, y solo la ve Kris** (oculta, D-042) |
| ¿Y el mapa de las 7 piezas? | Se queda como está: **«Mapa», oculto** |
| La R-13, que no cita ningún apartado | **Se añade** a «Cuando no llega la consecución» (Marcación de zonas) |

---

## 2. Lo medido

| | |
|---|---|
| Pasos | 8 (`src/lib/modulos.mjs`) |
| Apartados | 37: 5 · 7 · 5 · 4 · 4 · 5 · 4 · 3 |
| Gráficos | 32 `<figure>` en 26 apartados: 27 diagramas de `public/conceptos/` (1760×880, 81 KB de media) y 5 capturas de Premercado |
| Scripts dentro del contenido | ninguno |
| Estilos del contenido | globales en `base.css` (`.ap`, `.gr`, `.datos`, `.duro`, `.veto`, `.secuencia`, `.tarj`…). Propios solo en Setups (79 líneas: el flujo de la entrada y la tabla comparativa), Riesgo (18), Premercado (6) y Entrada (3) |
| Enlaces dentro del texto | ninguno escrito a mano: solo los códigos de regla, que `Refs` enlaza a `/reglas/R-xx` |
| Reglas citadas por algún apartado | 33 de 34 (falta la R-13) → 34 con esta versión |
| Reglas que cita más de un paso | 10: son los **cruces** entre pasos |

---

## 3. La pieza clave: el contenido, en un solo sitio

Hoy cada apartado está escrito dentro de la página de su paso (`src/pages/zonas.astro`…). **Se saca cada uno a su
propio componente** y las dos versiones lo usan:

```
src/contenido/plan/
  premercado/  estado.astro · noticias.astro · instrumento.astro · atm.astro · zonas-vol.astro
  zonas/       movimiento.astro · nace.astro · consecucion.astro · estira.astro · apendice.astro · convivencia.astro · caduca.astro
  setups/      … (5)    jornada/ … (4)    entrada/ … (4)    filtros/ … (5)    dentro/ … (4)    riesgo/ … (3)
  indice.mjs   los 37: paso, id, título, reglas que cita, primer gráfico. Una sola lista
```

- **`src/pages/<paso>.astro`** (la versión actual) pasa a ser la lista de sus apartados importados. Su HTML
  publicado **no cambia**.
- **`src/pages/plan.astro`** (la nueva) renderiza los mismos 37 componentes dentro de sus láminas.
- Los estilos propios de Setups, Riesgo, Premercado y Entrada **se mueven al componente del apartado** que los usa.
- `indice.mjs` sustituye a las listas `SECCIONES` de cada página: de ahí salen la ruta del módulo actual, las
  tarjetas del mapa y la cuenta de reglas y cruces. Ningún número escrito a mano.

**Descartado:**
- **Copiar el contenido** a la página nueva: se desincroniza a la primera corrección.
- **Que el mapa lleve a la página actual**: Kris pidió que no sea otra página.
- **Leer la página actual desde el navegador y recortar el apartado**: frágil, y los estilos propios no llegarían.

---

## 4. Lo que se ve

Ruta: **`/plan`**. En el menú, **«Reglas»**.

### Nivel 1 · los 8 pasos

- **Centro:** el núcleo con «La jornada», **34** reglas, 8 pasos y 37 apartados, todo calculado.
- **Alrededor:** las 8 piezas, una arriba (01), tres a la derecha (02-04), una abajo (05) y tres a la izquierda
  (06-08), en el orden de la jornada y en el sentido de las agujas del reloj.
- **Cada pieza:** «Paso 0N · N apartados · N cruces», el nombre, la frase de `modulos.mjs` y su color.
- **Las líneas:** tres pistas luminosas por pieza hasta el núcleo, con el punto de luz que corre (el lenguaje del
  mapa actual, de `pistas.mjs`).
- **Al pasar el ratón:** se ilumina la pieza y sus cruces, y sale un aviso con qué reglas comparte y con qué pasos.

### Nivel 2 · los apartados de un paso

- **Arriba, la tira de los 8 pasos:** el actual, encendido en su color. Saltar de un paso a otro es lateral (sin
  zoom), como entre piezas hermanas del mapa.
- **El título del paso:** «Paso 02 · 7 apartados · 13 reglas» y la frase.
- **Las tarjetas de los apartados, en orden, en serpiente:** filas de hasta 4; la segunda va de derecha a
  izquierda, para que la línea no cruce la pantalla. Cada tarjeta lleva:
  - **la miniatura de su primer gráfico**;
  - «Apartado N», el título y los códigos de sus reglas;
  - un punto en la regla que también está en otro paso, y debajo «también en Filtros».
- **Un apartado sin gráfico** (11 de 37) lleva en lugar de la miniatura una cabecera con el número grande y el
  icono del paso, en su color. No se inventa ninguna imagen.
- **Una línea luminosa** une las tarjetas en el orden del día y se dibuja al entrar, a velocidad constante.
- **Encuadre:** la cámara encuadra el paso entero en la caja disponible. Ninguna tarjeta queda cortada (en el
  boceto la cuarta se salía).

### Nivel 3 · el apartado

Al pulsar una tarjeta, la cámara entra en ella y se abre **la lámina**:

- **Cabecera:** «Reglas › Paso 02 · Marcación de zonas › Apartado 1 de 7», una barrita de 7 segmentos con el
  actual encendido, y ✕.
- **Cuerpo:** **el apartado completo, el mismo componente que la versión actual**: texto, gráficos a tamaño
  completo, tablas y recuadros. Se desplaza dentro de la lámina.
- **Pie:** «← anterior» y «Siguiente: Generación de zonas →». En el último apartado de un paso, el siguiente
  es el primero del paso siguiente (como hoy).
- **Teclado:** ← → cambia de apartado y Esc cierra.
- **Los códigos de regla** siguen enlazando a la ficha de cada regla.

### Movimiento

El del mapa actual, con su misma cámara (`camara.mjs`):
- entrar en un paso: zoom hacia la pieza, cambio de contenido mientras no se ve, y asiento;
- volver: zoom hacia fuera;
- entre pasos hermanos: sin zoom;
- la lámina aparece desde la tarjeta pulsada.

Sin consultar `prefers-reduced-motion` (D-031); `?sin-movimiento` para el verificador.

### Dirección y botón Atrás

`/plan` · `/plan#zonas` · `/plan#zonas/movimiento`. Cada nivel tiene su dirección, se puede enviar como enlace,
y Atrás y Adelante del navegador recorren los niveles.

### Celular (menos de 900 px)

El mapa no cabe al lado del menú. Allí sale una **lista de los 8 pasos**, cada uno desplegable con sus apartados
(miniatura, título y reglas). Al tocar un apartado se abre **la misma lámina a pantalla completa**. Mismo
contenido y mismas direcciones.

### Sin JavaScript

Los 37 apartados salen seguidos, en orden, como una lectura larga. Nada queda inaccesible.

---

## 5. El menú y la portada

| Ítem | Quién lo ve |
|---|---|
| Inicio | todos |
| **Reglas** (nuevo, `/plan`) | todos |
| Los 8 pasos actuales | **solo Kris** (`oculto`, D-042) |
| Mapa · Casos reales | solo Kris (como hoy) |
| Operativa diaria · Backtesting · Parámetros | todos |
| Checklist · Observaciones | solo Kris (como hoy) |

- Si todos los ítems de un grupo están ocultos, el grupo entero (con su separador) se oculta: si no, quedaría
  una línea suelta en el menú de Alfredo.
- **Portada:** la tira «El plan, en el orden de la jornada» lleva a `/plan#<paso>` en lugar de a la página
  actual, que Alfredo ya no ve en el menú.
- «Reglas» se queda marcado en `/plan` y en sus niveles.

---

## 6. Arquitectura

```
src/contenido/plan/<paso>/<apartado>.astro   el contenido (37), una sola vez
src/contenido/plan/indice.mjs                los 37 con sus datos
src/pages/<paso>.astro                       la versión actual: importa sus apartados (HTML igual que hoy)
src/pages/plan.astro                         la nueva, dentro de Marco: el escenario + las 37 láminas
src/lib/plan/plan.mjs                        el orquestador nuevo: niveles, URL, teclado, láminas
src/lib/plan/disposicion.mjs                 el hub de 8 y la serpiente de apartados
src/estilos/plan.css                         con prefijo pl-
reutilizados sin cambios de comportamiento: src/lib/mapa/camara.mjs y pistas.mjs
```

- **El mapa actual (`/mapa`, `mapa.mjs`) no se toca.** Lo nuevo es otro orquestador, para no arriesgarlo.
- **El escenario mide su propia caja** (con `ResizeObserver`), no la ventana: así vive dentro del portal. Es lo que
  el motor del mapa actual no hace (todo lo suyo es `position: fixed` e `innerWidth`).
- **Las láminas están en el HTML desde el principio**, ocultas. Sus imágenes llevan `loading="lazy"` y se fuerzan
  al abrirse (el mismo truco que `Modulo.astro` ya usa). Las miniaturas de un paso cargan al entrar en él.
- `pistas.mjs` recibe el tamaño de la caja en `medir(ancho, alto)`, que ya lo admite.

---

## 7. Fases

Cada fase se verifica, se sube y se puede revisar antes de la siguiente.

| Fase | Qué | Se verifica con |
|---|---|---|
| **1 · El contenido en un solo sitio** | Los 37 componentes, `indice.mjs`, las 8 páginas actuales importándolos, y la R-13 en «Cuando no llega la consecución» | El HTML publicado de las 8 páginas **idéntico** al de antes (comparación automática, quitando solo las marcas internas de Astro), salvo la R-13. `npm run verificar` |
| **2 · El escenario y el nivel 1** | `/plan` dentro de Marco, el hub de 8 con núcleo, pistas y avisos; el menú | Capturas a 1400 y 1920 px; nada cortado; la cifra del núcleo contra `reglas.json` |
| **3 · El nivel 2** | Tira de pasos, tarjetas con miniatura y línea del recorrido; transiciones | Los 8 pasos encuadrados; transición entrar, volver y hermanos medida fotograma a fotograma |
| **4 · El nivel 3** | La lámina con el contenido, anterior y siguiente, teclado, direcciones | **Los 37 apartados abiertos uno a uno**: mismo texto y mismo número de gráficos que en la versión actual, imágenes cargadas, sin errores |
| **5 · Celular, portada y cierre** | Versión de lista, la tira de la portada, D-043 y publicar | Capturas a 390 px; `npm run verificar`; el portal real |

---

## 8. Lo que no se hace

- **No se cambia ni una palabra** del contenido de los apartados (la R-13 es solo añadir su código a un apartado).
- **No se toca `chaumer/01_Plan/`.**
- **No se borra la versión actual** ni el mapa de las 7 piezas: se ocultan.
- **No se inventan imágenes** para los apartados que no las tienen.
