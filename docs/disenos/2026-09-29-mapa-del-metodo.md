# El mapa del método — una página nueva en el portal

**Versión:** v1.3 · **Estado:** ✅ **CERRADO el 29/09/2026.** Las 5 fases, el color y D-031.
**Escrito:** 29/09/2026. **Alcance:** el portal (`chaumer/04_Web`), una página nueva.

| Versión | Fecha | Qué cambió |
|---|---|---|
| v1 | 29/09/2026 | Primera versión, escrita después de una maqueta funcional revisada por Kris |
| v1.1 | 29/09/2026 | **Aprobado e implementado.** Tres correcciones del §11 contra los datos reales, y §13 con lo que cambió al construirlo |
| v1.2 | 29/09/2026 | Decidido el color (§11): por número de relaciones. Zonas y Proceso diario se intercambian el tono. La transición se vuelve a comparar con la referencia y se suaviza (§14) |
| v1.3 | 29/09/2026 | **D-031: el portal deja de consultar `prefers-reduced-motion`.** El §6.1 cambia de sentido y se reescribe. Y §15: el rendimiento del bucle, medido y mejorado |

---

## 1. Qué problema resuelve

El portal enseña las 34 reglas como **una lista filtrada por grupo** (`src/pages/reglas/index.astro`).
Funciona para buscar un dato concreto. No sirve para lo otro: **ver el método entero y cómo
encajan sus piezas.**

Los datos para enseñarlo ya están y no se usan:

- Los 7 grupos de `reglas.json` **vienen ordenados** (`orden` 1–7): son una secuencia, no un montón.
- Las reglas traen `relacionadas`: **123 enlaces**, de los cuales **46 cruzan de un grupo a otro**.

Una lista no puede enseñar eso. Un mapa sí. Y hay un hallazgo que sale solo al dibujarlo:
**Setup y entrada tiene 17 cruces**, casi el triple que cualquier otra pieza. Es la que toca todo
lo demás, y en la lista no se ve.

## 2. Dónde vive, y qué NO toca

**Una página nueva: `/mapa`.** Enlazada desde la portada. **Ni una línea de las demás páginas.**

Esto resuelve una contradicción real. `src/estilos/tokens.css` declara, con fecha 02/09/2026:

> *"Minimalism & Swiss: limpio, espacioso, rejilla, jerarquía clara. (…) Es un portal de consulta:
> lo primero es encontrar, no impresionar."*

El mapa es lo contrario: su trabajo **es** impresionar, porque no se usa para buscar un dato sino
para ver la forma del método. Las dos cosas conviven **porque son páginas distintas con oficios
distintos**. La dirección del 02/09 sigue vigente para el resto del portal.

Si el mapa no convence, se borra el archivo y no queda rastro.

## 3. La forma

Se toma de `musar-skill-tree-navigator.vercel.app`, que Kris eligió como referencia, **con los
tokens de este portal**. Dos niveles y un detalle.

### 3.1 Nivel 1 · el hub

Un **núcleo** central (tarjeta con patillas de integrado) y **7 nodos hexagonales** en corona:
arriba el paso 1, la columna derecha los pasos 2-3-4, la izquierda los 7-6-5. Se lee en el sentido
de las agujas del reloj y **es el orden real de la jornada.**

Del núcleo salen **haces de tres pistas** hacia cada nodo, con trazado ortogonal.

Cada nodo lleva: `PASO n · X CRUCES` · el nombre · insignia de dos letras + número de reglas · la
descripción del grupo.

### 3.2 Nivel 2 · la pieza

Las reglas del grupo en **filas de 5**, con etiqueta `FILA 01`, `FILA 02`… a la izquierda.

Las relaciones **no se dibujan en línea recta**: se enrutan **por debajo de la fila, en carriles
apilados**, el de menor recorrido en el carril de arriba. Ese es el patrón que produce el aspecto
de circuito impreso, y es lo que hace legible un grupo con 13 reglas y 30 relaciones.

**Menú lateral** (290 px) con las 7 piezas: insignia hexagonal del color de la pieza, nombre
completo, `PASO n · X CRUCES` y la cuenta. La activa lleva barra lateral con halo.

**Al posarse en una regla:** se apagan las demás y solo quedan encendidos ella, sus relacionadas y
los carriles que las unen.

### 3.3 Nivel 3 · la regla

Ventana con el identificador, el grupo, el nombre, el resumen, las etiquetas y **un botón que
lleva a `/reglas/[id]`**, que es la página que ya existe. El mapa **no duplica** el contenido de
las reglas: es una puerta.

## 4. Los datos: todos reales

Regla 1 del portal: *"Ningún número escrito a mano."* Se cumple.

| En pantalla | De dónde sale |
|---|---|
| `PASO 3 · 6 CRUCES` | `grupos[].orden` y las `relacionadas` que apuntan fuera del grupo |
| `ZO · 13` | Sigla derivada del `id` del grupo + `grupos[].n` |
| «todo lo que tiene que ver con una zona» | `grupos[].descripcion` |
| `34` del núcleo | Las reglas vigentes de `reglas.json` |
| Carriles entre reglas | `reglas[].relacionadas` |
| `AMBOS · 2 PAR` | `aplica_a` y `parametros` |

**No se inventan códigos decorativos.** La referencia los usa (`MS.03 · 0x1F7`); aquí cada cifra
dice algo verdadero. Decisión de Kris, 29/09/2026.

## 5. El lenguaje de movimiento

Medido y ajustado sobre la maqueta con Kris delante. Las curvas ya existen en `tokens.css`.

| Pieza | Valor |
|---|---|
| **Barrido** al cambiar de nivel | 1150 ms, `cubic-bezier(.35,0,.3,1)`, de `-100%` a `215%` |
| **Entrada de cada nodo** | 0,44 s con `--curva-salida`, escalonado **30 ms**, tope en 13 |
| **Entrada del menú** | 0,5 s, escalonado **38 ms** |
| **Cámara: bajar de nivel** | acercarse ×1,9 en **210 ms** → recolocar (`y−46`, `z×0,86`) → asentar **620 ms** |
| **Cámara: subir** | alejarse ×0,68 en 210 ms → llegar a `z×2,2` sobre el nodo → asentar **600 ms** |
| **Entre piezas hermanas** | **sin zoom**, solo fundido: 150 ms + 120 de espera + 380 de asentamiento |
| **Atenuado durante el cambio** | a **0,3**, nunca a 0 — ver §7 |
| **Dibujado de las pistas** | **760 px/s** (velocidad, no duración) |
| **Pulso ambiental** | **150 px/s**, solo en pistas ya dibujadas del todo |
| **Latido del núcleo** | 4,2 s |

**La dirección del zoom codifica la jerarquía:** bajar es acercarse, subir es alejarse, y entre
hermanos no hay zoom porque no se cambia de nivel. Eso es lo que hace que se sienta un espacio y
no una web.

**Las pistas usan velocidad, no duración fija.** Con duración fija un recorrido largo va disparado
y uno corto lentísimo; con velocidad constante el ojo lo lee como algo físico.

### La receta del brillo

Cuatro capas por pista, en este orden. Una sola línea gruesa de color **no** da el efecto:

1. Traza base apagada — el color al 15 % de opacidad, 1,1 px.
2. Halo — el color al 24 %, `shadowBlur` 8, 3 px de grosor.
3. Filamento — el color mezclado un 35 % con blanco, al 95 %, 1,25 px, sin sombra.
4. Punto de luz viajando, solo si la pista está dibujada entera.

## 6. El contrato innegociable

Tres cosas que van en el diseño desde el principio, no parcheadas después.

### 6.1 El modo quieto ~~y `prefers-reduced-motion`~~

> ⚠️ **Cambiado el 29/09/2026 (D-031).** Este apartado decía que el mapa consultaría
> `prefers-reduced-motion`. **Ya no lo hace, ni él ni el resto del portal**: el Windows de Kris la
> pedía y el portal se veía congelado. El porqué y lo que se pierde, en `docs/decisiones.md`.

Lo que **sí** queda, y sigue siendo necesario: un modo quieto de verdad, que no se limita a apagar
CSS. Apagar solo `transition` y `animation` **no alcanza a tres cosas**, y por eso el modo quieto
vive en JavaScript:

| No lo cubre el CSS | Qué hace el modo quieto |
|---|---|
| El bucle `requestAnimationFrame` del canvas | No lo arranca; pinta el estado final |
| `element.animate()` (el barrido) | No lo lanza |
| Las interpolaciones sobre `performance.now()` (la cámara) | Salta al encuadre final |

Se activa **solo con `?sin-movimiento`**, y además una clase en el `body` apaga las animaciones
CSS del mapa (el latido del núcleo es infinito y haría que cada captura saliera distinta).

### 6.2 Modo congelado para el verificador

`npm run verificar` saca vistas con puppeteer. Un canvas que nunca se queda quieto da capturas
distintas cada vez y **se pierde el verificador**: deja de poder distinguirse un fallo de
maquetación de un fotograma cualquiera.

`?sin-movimiento` deja todo en su estado final y estable. El verificador lo usa.

### 6.3 Enlace profundo y versión sin JavaScript

- **El estado va en la URL** (`/mapa?pieza=zonas`) con `history.pushState`, se lee al arrancar y
  se atiende el botón «atrás». **Un mapa al que no se puede enlazar no sirve en un portal de
  consulta**: Alfredo tiene que poder guardarlo en favoritos o recibir un enlace a una pieza.
- **Sin JavaScript queda la lista de siempre**, navegable y completa. Nunca una página en blanco.

> La página de referencia **no cumple ninguna de las dos**: no tiene `prefers-reduced-motion` en
> ningún archivo, ni `pushState`, ni hash. Son los dos defectos que **no** se copian.

## 7. Lo que la maqueta enseñó

Cinco fallos reales encontrados al construirla. Van escritos porque se habrían colado igual en la
implementación.

1. **El modo congelado pintaba una sola vez.** Con movimiento reducido, el canvas se pintaba al
   arrancar y nunca más: al cambiar de pantalla quedaban dibujadas **las pistas de la anterior**
   encima de la nueva. Al cambiar de estado hay que repintar aunque esté congelado.
2. **Atenuar a 0 deja la pantalla en blanco.** El primer intento fundía el mundo a 0 antes del
   cambio: medio segundo de negro, y el efecto se percibía como «no hay animación». Se atenúa a
   **0,3** y el barrido tapa el cambio.
3. **`backdrop-filter` con `opacity: 0` sigue pintando.** El menú oculto tapaba el mapa con su
   rectángulo desenfocado. Hace falta `visibility: hidden`.
4. **El hover no puede pasar por un re-render completo.** Si al pasar el ratón se reconstruye el
   mundo, se destruye y recrea el nodo bajo el cursor, eso vuelve a disparar el `mouseover`, y es
   un bucle infinito. El hover escribe directo en el DOM del tooltip.
5. **Centrar la caja no es centrar el contenido.** Un relleno asimétrico (150 px a la izquierda
   por las etiquetas de fila, 60 a la derecha) dejaba el flujo 90 px corrido. El relleno va
   simétrico.

## 8. Arquitectura

Sin dependencias nuevas. Astro sirve la página; dentro es una isla de JavaScript propio.

```
src/pages/mapa.astro          la página: datos desde reglas.json en tiempo de compilación
src/estilos/mapa.css          estilos propios del mapa (no tocan base.css)
src/lib/mapa/camara.mjs       cámara con interpolación (pan + zoom)      ~4 KB
src/lib/mapa/pistas.mjs       dibujado en canvas: brillo, revelado, pulso ~7 KB
src/lib/mapa/disposicion.mjs  posiciones del hub y de las filas, y los carriles
src/lib/mapa/mapa.mjs         estado, transiciones, teclado, URL
```

**Tres capas superpuestas** compartiendo **una sola** transformación de cámara, escrita
imperativamente (no re-renderizando el árbol en cada fotograma):

| Capa | Qué lleva |
|---|---|
| Fondo | La rejilla, muy tenue |
| Conexiones | Un `<canvas>`, **no SVG**: cientos de líneas en SVG matan al navegador |
| Mundo | Los nodos, en DOM normal — así son enfocables y accesibles |

Rendimiento: **un solo** `requestAnimationFrame`, `will-change: transform` solo en las capas que
se mueven, densidad de píxeles del canvas limitada a **2**.

## 9. Fases

| Fase | Qué | Cómo se verifica |
|---|---|---|
| **1 · Motor y contrato** | Cámara, canvas, las tres capas, **y desde el minuto uno** §6 entero: movimiento reducido en JS, `?sin-movimiento`, `pushState`, degradación sin JS | Se recorre a 60 fps · `?sin-movimiento` da dos capturas idénticas · sin JS sale la lista · `/mapa?pieza=zonas` abre donde debe |
| **2 · El hub** | Núcleo, corona de 7, haces de pistas, patillas | Nombres, cuentas y cruces contrastados contra `reglas.json` · ni un número a mano |
| **3 · El descenso** | Las tres transiciones con las cifras de §5, el barrido y las entradas escalonadas | El zoom va en la dirección correcta en cada una · entre hermanas no hay zoom |
| **4 · La pieza** | Filas, carriles apilados, menú lateral, hover con apagado, ventana de detalle | Los carriles no se solapan en ninguna de las 7 piezas · cada nodo enlaza a su `/reglas/[id]` |
| **5 · Cierre** | Teclado, foco visible, táctil, móvil, enlace desde la portada | `npm run verificar` limpio · recorrible solo con teclado |

**Teclado** (fase 5): flechas o `WASD` mover · `+`/`−` zoom · `F`, `0`, `Inicio` reencuadrar ·
`Escape` cerrar o subir · `[` `]` pieza anterior y siguiente. Con una guarda al principio: si el
foco está en un campo de texto, no se mueve el mapa.

## 10. Lo que NO se hace

- **Desbloquear y progreso.** La referencia es un árbol de habilidades que se van ganando. Las 34
  reglas aplican todas, todos los días: convertirlas en una progresión las trivializa.
- **Duplicar el contenido de las reglas.** El mapa es una puerta a `/reglas/[id]`.
- **Tocar `01_Plan/`.** El mapa solo lee lo que `npm run sync` deja en `src/content/`.
- **Cambiar la estética del resto del portal.** §2.
- **Dependencias nuevas.** La referencia empezó con Three.js desde un CDN y lo tiraron por la
  misma razón que aquí: sin paso de compilación. Canvas2D hace lo mismo en 7 KB.

## 11. El color dentro de una pieza — decidido

**El color dentro de una pieza.** Las 13 reglas de Zonas comparten el color del grupo y Kris lo ve
monótono. Darles tonos distintos sería decoración que miente: son de la misma pieza. Lo honesto es
variar la **intensidad** según un dato real. Contados sobre `reglas.json`:

| Opción | Qué hay de verdad | Sirve para |
|---|---|---|
| **Por nº de relaciones** *(recomendada)* | De 2 a 6 por regla; las más conectadas brillan más | **Las 7 piezas** |
| Por apartado | **Solo Zonas** tiene apartados (`Marcado` / `Vigencia`); los otros 6 grupos lo traen a `null` | 1 de 7 |
| Por `aplica_a` | 29 reglas son «ambos», 3 solo Continuación y 2 solo Reingreso. **En Zonas las 13 son «ambos»** | Casi nada |
| Por `bloquea_go` | **Sin comprobar**: está en `catalogo_reglas` (Supabase), no en `reglas.json`. Sería lo más útil — qué reglas impiden operar — pero hay que ver si el portal puede leerlo | Por confirmar |

> ⚠️ **Corrección.** Al revisar el diseño contra los datos, dos afirmaciones que había escrito eran
> falsas: que `aplica_a` no tenía variedad (sí la tiene, aunque poca: 5 de 34) y que el apartado
> servía como eje general (solo existe en Zonas). Por eso cambia la recomendación.

**Decidido el 29/09/2026: por número de relaciones.** La intensidad del borde y del texto sigue
al número de relacionadas, repartida **dentro de cada pieza** (no sobre una escala absoluta, o una
pieza poco conectada saldría entera apagada). El tono no cambia: sería mentir, todas son de la
misma pieza.

En Zonas eso pone fuertes a *Zona de premercado* y *Rompimiento y consecución* (6 relaciones cada
una) y apagada a *La vela que confirma un traspaso* (2). El esqueleto del grupo se ve sin leer.

**Y dos tonos cambiados**, a petición del operador: Zonas pasa a coral y Proceso diario al azul.

## 13. Qué cambió al implementarlo

Tres decisiones que el diseño no fijaba y se tomaron con el código delante.

**El mapa no usa `Marco`.** Es la única página del portal que no lo hace. `Marco` trae su propio
rail de secciones, y con el menú de piezas del mapa habría dos menús laterales peleándose. La
página lleva su propia cabecera, con la insignia enlazando a la portada y un «Ver como lista» que
lleva a `/reglas`.

**La puerta de la portada no es una cuarta tarjeta.** La rejilla es de tres columnas y el operador
fijó esas tres puertas el 06/09; una cuarta quedaría sola en una segunda fila. El mapa va en su
propio bloque ancho debajo, que además le pega: no se entra a buscar un dato, se entra a ver la
forma del método.

**Las siglas de las piezas se derivan del nombre**, no se escriben a mano. Si el plan renombra un
grupo, la insignia le sigue sola.

### Un fallo que encontró la verificación

Con `prefers-reduced-motion`, el mapa acababa **al 82 % en vez de al 95 %**, y desplazado. La
causa: sin bucle de fotogramas, nadie aplicaba la transformación después del último salto de
cámara, así que se quedaba donde la dejó el penúltimo. La cámara ahora avisa de cada cambio que no
viene del bucle (`Camara.alCambiar`).

No se habría visto mirando la pantalla: salió de comprobar el contrato del §6 con la media query
emulada.

### Lo verificado

| Qué | Resultado |
|---|---|
| Comprobaciones de `/mapa` (normales y con movimiento reducido) | **20/20** en los dos modos |
| `?sin-movimiento` | Dos capturas con 1,4 s de diferencia, **idénticas** |
| Sin JavaScript | Las **34 reglas** enlazadas, ninguna página en blanco |
| Enlace profundo `?pieza=filtros` | Abre su pieza, y el botón «atrás» del navegador funciona |
| Zoom mínimo dentro de una pieza | **95 %**, nunca menos |
| `npm run verificar` | **57 páginas, 0 fallos** en enlaces, maquetación, parámetros, cifras, nombres, referencias y vista |
| Consola | Sin errores |

## 14. La transición, comparada otra vez con la referencia

El 29/09, ya con el mapa publicado, Kris no veía el efecto al entrar en una pieza. Se grabaron las
dos transiciones con el screencast del navegador, a los mismos hitos. El resultado fue claro:

| | Referencia | El mío, antes |
|---|---|---|
| ~385 ms | el hub **intacto** | ya atenuado y a medio zoom |
| ~500 ms | **funde a negro limpio** | una **banda blanca con halo** cruzando la pantalla |
| ~830 ms | negro, tranquilo | la banda todavía dominando |

Dos errores, los dos míos:

1. **El destello era un foco.** Tenía un borde casi blanco al 95 % y un `box-shadow` de 34 px. En
   la referencia el destello casi no se ve: lo que se percibe es el fundido.
2. **Atenuar a 0,3 ensucia.** Deja el contenido viejo por debajo del nuevo. Era un parche contra
   un hueco en blanco que en realidad venía de otro sitio (§7.2), y sobraba.

Corregido: se funde **del todo** en 300 ms, el destello baja a un degradado suave sin halo, y la
entrada vuelve con un fundido de 340 ms además del escalonado. El ritmo ya coincide con el de la
referencia.

**Y el flujo se asienta 70 px por encima del centro**, para que la primera fila quede a la altura
de la vista y se empiece a leer por arriba.

## 15. El rendimiento del bucle

Al quitar la consulta de la preferencia, el mapa pasó a animarse también en las pruebas, y eso
destapó algo que antes quedaba tapado: **la cámara no interpolaba, saltaba.**

Medido con el reloj de la página, muestreando los fotogramas:

| | Antes | Después |
|---|---|---|
| Fotograma mediano | 18,4 ms | **8,3 ms** |
| Fotograma medio | 32,1 ms | **13,5 ms** |
| Fotogramas de más de 50 ms | 3 | **1** |

Dos causas, las dos quitadas:

1. **`shadowBlur` en cada trazo.** Se aplicaba a tres capas por pista: con treinta pistas son
   noventa trazos desenfocados por fotograma. El halo se hace ahora con dos trazos anchos y
   translúcidos, que cuestan una fracción. El punto de luz sí conserva la sombra: es uno por
   pista, no noventa.
2. **`backdrop-filter` en el menú.** Desenfocar 290 px por todo el alto se recalcula con cada
   fotograma del mapa que hay debajo. Sobre fondo oscuro, un degradado opaco se ve igual.

Además, la vista se monta en un `DocumentFragment` y se inserta de una vez, en lugar de añadir
dieciséis nodos al árbol vivo.

**Lo que queda sin resolver, dicho claro:** sigue habiendo **un** fotograma largo (~730 ms) en el
primer pintado de una vista. Se reproduce igual en el sitio compilado que en desarrollo, así que
no es cosa del servidor. La sospecha es que es del navegador sin ventana, que rasteriza por
software y paga caro los recortes (`clip-path`) de los 26 hexágonos; **no se pudo comprobar con
GPU** porque el panel del navegador pausa los fotogramas cuando está oculto. Si en una máquina real
se nota un tirón al entrar en una pieza, el siguiente sospechoso es ese.

## 12. La maqueta

Vive fuera del repositorio, en el scratchpad de la sesión:
`…/scratchpad/proto/` — `index.html` (la maqueta), `EL-METODO-maqueta.html` (archivo suelto que
Kris revisó, con los datos dentro y un bucle de demostración), y los capturadores.

**No es código de producción**: es lo que se usó para decidir las cifras de §5 y encontrar los
fallos de §7. Se tira cuando la fase 1 esté hecha.

Hubo una entrada `proto` en `.claude/launch.json` para servirla; **se quitó al cerrar** (29/09/2026).
