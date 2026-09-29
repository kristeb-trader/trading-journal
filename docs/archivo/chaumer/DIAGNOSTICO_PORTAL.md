# DIAGNÓSTICO DEL PORTAL

**Fecha:** 07/09/2026 · **Modo:** solo mirar y contar. **No se tocó ni una línea del portal.**

Lo único que se ejecutó fue compilar y pasar los cuatro vigilantes (`npm run verificar`). Eso regenera `src\content\`, `public\assets\` y `dist\`, que son copias, y no cambia nada del portal.

**Resultado de los vigilantes: los cuatro en verde.** 53 páginas, 2.532 enlaces e imágenes comprobados, 0 rotos. 0 fallos de maquetación. 0 fallos de vista. 0 referencias descuadradas.

Eso es importante para leer lo que viene: **nada de lo que encontré lo detecta ningún vigilante actual.** Son cosas que pasan por debajo de ellos.

---

## 📌 Dos decisiones del operador — 07/09/2026

Leído el informe, el operador cerró dos puntos. **No son hallazgos: son decisiones, y mandan sobre lo que dice el resto de este documento.**

1. **El glosario se quitó a propósito.** No vuelve al portal. Donde este informe lo señalaba como fallo, léase como decisión tomada.
2. **Los cuatro huecos declarados no van al portal.** Siguen siendo huecos abiertos **del plan** —eso no cambia—, pero el portal no tiene que enseñarlos ni enseñar la cifra del backtesting.

Las dos tachan cosas de aquí abajo. Están marcadas con **~~texto tachado~~** y con la etiqueta 🚫 **DECIDIDO** allí donde aparecen, en vez de borradas, para que se vea qué se decidió y no parezca que nunca se encontró.

> ⚠️ **Queda una contradicción abierta, y no la he corregido.** Las instrucciones escritas del portal (`04_Web\CLAUDE.md`) dicen hoy, como una de sus cinco reglas, que *«los cuatro huecos declarados se ven»* y que si el portal muestra los −91,00 los cuatro motivos van en la misma pantalla. Eso ya no es lo que quiere el operador. **Mientras esa regla siga escrita, el próximo diagnóstico volverá a levantar esto como fallo, y con razón.** Hay que reescribirla o quitarla — pendiente del visto bueno.

---

## Lo urgente — dos cosas, por este orden

### 🔴 1 · El umbral de volumen del premercado está escrito a mano, y todavía enseña el número del NQ que se retiró

**Dónde:** `src\pages\premercado.astro`, líneas 156, 157, 176 y 178.

**Qué pasa.** La página pide dos parámetros que **no existen en el plan**: uno para el umbral de MNQ y otro para el de NQ. El plan tiene **un solo** parámetro de volumen, no dos, y con otro nombre. Como el nombre no existe, la página cae en el texto de reserva que lleva escrito al lado —`> 6.000 contratos` y `> 2.000 contratos`— y **enseña esos números tal cual, sin que nadie lo note.**

**Por qué importa, y mucho.** El plan dice, con fecha, que **el umbral del NQ se retiró el 06/09/2026 junto con el NQ**, y que la equivalencia entre ambos no está verificada. El portal lo sigue mostrando en pantalla en dos sitios, como si fuera vigente. Y el día que se cambie el umbral de MNQ en el documento de parámetros, **el portal seguirá enseñando 6.000** sin avisar a nadie. Es exactamente lo que la regla del portal quiere impedir.

**Qué propongo.** Apuntar al nombre real del parámetro, quitar de la pantalla la fila del NQ, y —esto es lo que evita que vuelva a pasar— añadir un vigilante que falle si una página pide un parámetro que no existe. Hoy el fallo es silencioso: se ve bonito y es mentira.

**Cuánto cuesta:** el arreglo, 15 minutos. El vigilante nuevo, media hora más.

---

### 🟠 2 · La regla del rompimiento enseña un diagrama que se llama «vigencia»

**Dónde:** `..\02_Assets\diagramas\R-20_vigencia.png`, colocado por el manifiesto en la ficha de la regla del rompimiento y la consecución.

**Qué pasa.** Las imágenes se asignan a las reglas **por el número del nombre del archivo**. Tras la renumeración del 06/09, ese número apunta a la regla del rompimiento y la consecución, pero el archivo se llama *vigencia*, que hoy es la regla siguiente. Las otras siete imágenes las comprobé una a una y **todas cuadran**; esta es la única sospechosa.

**Por qué importa.** No lo detecta ningún vigilante —el archivo existe, el enlace funciona— y el operador vería un dibujo que no corresponde a lo que está leyendo.

**Qué propongo.** Mirar la imagen y decidir: o se renombra al número correcto, o se confirma que el dibujo sí es del rompimiento y solo está mal el nombre. **No lo toco yo.** Y de paso, dejar de asignar imágenes por el número del archivo: es una trampa que volverá a saltar en la próxima renumeración.

**Cuánto cuesta:** mirarlo, 2 minutos. Renombrarlo, 5. Cambiar el sistema de asignación, 1 hora.

---

## Lo que dejó de ser urgente, pero sigue sin resolverse

### 🟡 La pantalla de riesgo tiene una sección escrita que nadie dibuja

**Dónde:** `src\pages\riesgo.astro` — la tabla en la línea 24, sus estilos en las líneas 118 a 134. El texto aprobado que sí la tiene: `textos\08-riesgo.md`, a partir de la línea 64.

**En la primera versión de este informe esto era urgente**, porque incumplía la regla de enseñar los cuatro huecos. **Con la decisión del 07/09 ya no lo es.** Pero no desaparece, porque el problema de fondo es otro y sigue ahí:

El texto redactado y revisado tiene una sección entera —el aviso de que el plan no dice cuándo se deja de operar, la tabla de rachas de días malos, y la advertencia de que ninguna regla del método se rompe en esa tabla—. **En la página no está.** La tabla sí está escrita dentro del archivo, con sus estilos completos, y **nada la dibuja**. Es código muerto que parece vivo: quien abra el archivo verá una tabla que jamás llega a la pantalla.

**Por qué sigue importando.** No por los huecos, sino por dos cosas: hay código muerto en una página viva, y hay un texto aprobado por el operador que la página no respeta. Lo segundo es lo que preocupa — **si pasó aquí, puede haber pasado en otro módulo y nadie se enteraría.** Comprobar eso a mano son ocho páginas y sus ocho textos.

**Qué propongo.** Dos decisiones, las dos del operador:

1. Esa sección, ¿se dibuja o se borra? Si se borra, se quita también del texto aprobado, para que los dos digan lo mismo. **Dibujarla, 30 minutos. Borrarla, 10.**
2. El vigilante que compara los títulos de cada texto aprobado con los de su página. **Media hora, y es el que más rinde de todo el informe** — es el único que habría encontrado esto solo.

---

## 1 · Lo que el operador cree que ya está hecho

### La navegación por las siete categorías — ✅ está bien

Sale entera de `reglas.json`. Comprobado:

- Los nombres de los grupos, su orden y sus descripciones se leen del archivo. **No hay ni un nombre de categoría escrito a mano** ni en el menú ni en la página de reglas. Si mañana se renombra un grupo en el plan, el portal lo sigue.
- Los siete grupos y sus cuentas cuadran exactamente: perímetro 4 · estructura 4 · **zonas 14** · setup y entrada 5 · riesgo y gestión 7 · filtros 3 · proceso 1.
- **Zonas está partida** en marcado (**11**) y vigencia (**3**), tanto en el menú como en la página, y el apartado viaja en el enlace.
- **No queda navegación vieja por sub-fases** en las reglas.

Dos matices pequeños, ninguno urgente:

- La página del plan completo, la que va sub-fase por sub-fase, **sigue existiendo y compilándose, pero ya no está en el menú**. Solo se llega escribiendo la dirección, o desde la pantalla de observaciones, que sí enlaza a ella. Es la única página huérfana del portal. Ver el apartado 5.
- En la portada, las tres tarjetas llevan al pie una lista de cuatro nombres de grupo **escritos a mano** (`src\componentes\TarjetasInicio.astro`, línea 36). Son decorativos, pero son nombres de grupo escritos a mano, y hoy son 4 de 7 elegidos a ojo. **10 minutos.**

### Las siete reglas que ganaron sección propia — ✅ están bien

Las siete muestran su texto largo, completo, bajo el título «Por qué dice esto»:

| Regla | Sección que muestra | Tamaño |
|---|---|---|
| Zonas entre zonas | La regla del 50 % | 1.436 caracteres |
| Superposición de zonas | Se estira, no se duplica | 1.378 |
| Zona de premercado | La única que nace del volumen | 3.028 |
| Rompimiento y consecución | — | 1.886 |
| Vigencia e invalidación de una zona | — | 1.145 |
| Al llenarse la orden termina el análisis | — | 1.234 |
| Noticia roja | Ventana de ±5 minutos | 1.376 |

**Ninguna queda como ficha vacía.** De las 38 reglas, **36 tienen sección larga**; las dos que no la tienen son las dos del apéndice —la que estira la zona cuando el rompimiento fue con mecha, y la que marca apéndice cuando fue con cuerpo—. No es un fallo del portal: esas dos secciones no existen en el documento maestro. Si el operador las quiere, es una propuesta al plan, no un arreglo aquí.

### Los contadores — ⚠️ tres de cinco

| Cifra | Qué dice el portal | Veredicto |
|---|---|---|
| 38 reglas | 38, contadas del archivo | ✅ |
| 7 categorías | 7, contadas del archivo | ✅ |
| 21 casos en la galería | 21, contados del documento | ✅ |
| ~~23 términos en el glosario~~ | no aparece — **quitado a propósito** | 🚫 DECIDIDO |
| 11 sesiones validadas al tick | **no aparece en ninguna parte** | ⚠️ sin decidir |

🚫 **El glosario: decisión tomada el 07/09.** El operador lo quitó él mismo y no lo quiere en el portal. Queda constancia de lo que hay debajo, por si algún día se revisa: el lector que extrae los 23 términos **sigue existiendo y funcionando** —lo ejecuté, devuelve los 23, desde CORRIDA hasta SESGO DE LA APERTURA— pero ninguna página lo usa. Es código huérfano, no un fallo. Ver el apartado 5.

⚠️ **Las 11 sesiones siguen sin decidir.** Ese dato vive en el acta de cierre, que es otra de las pantallas retiradas el 06/09, así que **es muy probable que caiga con la misma decisión** — pero el operador no se ha pronunciado sobre él y no lo doy por cerrado. Es una cifra sola, no una pantalla: si se quisiera, cabría en la portada junto a las otras tres. **20 minutos si se quiere; cero si no.**

---

## 2 · Las imágenes

### Qué hay en cada sitio

**No son tres carpetas de verdad, son dos.** `public\assets\` **la genera la compilación**: copia entera de `..\02_Assets\`, y está en el `.gitignore`. Borrarla y recompilar la deja idéntica. Así que el reparto real es:

| Carpeta | Qué es | Cuántas |
|---|---|---|
| `..\02_Assets\` | original, versionado. Diagramas de reglas, galería, sesiones, contraejemplos | 10 diagramas + 13 galería + 11 sesiones + 1 contraejemplo + 4 sueltas |
| `public\conceptos\` | original, versionado. Los diagramas didácticos del recorrido | 29 |
| `public\assets\` | **copia automática** de la primera | espejo exacto |

### Duplicadas de verdad — tres, byte a byte

Comprobado con la huella de cada archivo. Son **el mismo archivo con dos nombres en dos carpetas**:

| En `02_Assets\diagramas\` | En `public\conceptos\` |
|---|---|
| `apendice_caso1_plazo.png` | `10-zona-apendice.png` |
| `apendice_caso2_estructura.png` | `10-zona-apendice-caso2.png` |
| `R-15_premercado_volumen.png` | `09-zona-volumen.png` |

Las otras 36 son distintas entre sí. No hay más duplicación.

### Las que no usa nadie — siete

En `public\conceptos\`, tres nunca se enlazan: **`20-apendice-nace.png`**, **`21-zonas-se-funden.png`** y **`25-apendice-antes.png`**. Las 26 restantes sí se usan, algunas varias veces.

En `..\02_Assets\` (raíz), cuatro no las pide nadie: **`8jul_dia_completo.png`**, **`BT_10jul.png`**, **`BT_13jul.png`** y **`NT8_selector_setups.png`**. Se copian a la web en cada compilación y se publican sin que ninguna página las enseñe.

Ojo: que no se usen **no significa que sobren**. Tres de ellas dibujan el nacimiento del apéndice y la fusión de zonas, que son justo los dos puntos donde la explicación del módulo de zonas va más apretada. Puede que falte la sección, no la imagen.

### Enlaces rotos — ninguno

Las 2.532 comprobaciones del vigilante de enlaces pasan. **El portal no pide ni una imagen que no exista.**

### Qué habría que tocar para dejarlas en un sitio, y qué se rompería

Hoy la separación tiene una lógica: `02_Assets\` es lo que produce Cowork con el motor de datos reales, `conceptos\` son los dibujos didácticos. **Antes de fusionarlas conviene decidir si esa distinción sigue valiendo**, porque tres archivos ya viven en las dos.

Si se fusionan, se tocan cuatro cosas: las 28 direcciones escritas en las páginas del recorrido, el manifiesto que asigna diagramas a reglas, el copiador, y el `.gitignore`. **Lo que se rompe si nos equivocamos:** el manifiesto asigna imágenes **por el número del nombre del archivo** —eso es lo del punto urgente 2, el diagrama que se llama «vigencia»—, así que renombrar un diagrama de regla lo cambia de dueño en silencio, sin que ningún vigilante se queje. La galería resuelve sus imágenes igual, por nombre. Y hay un detalle fino: las gráficas de la subcarpeta de sesiones **ganan siempre** sobre las de la carpeta principal, porque llevan el estándar visual vigente; si se aplanan las carpetas, se pierde ese desempate.

**Cuánto cuesta:** decidir el criterio, una conversación. Ejecutarlo bien, con vigilante que impida el silencio, **dos horas**. Ejecutarlo mal, un día de encontrar imágenes cambiadas de sitio.

---

## 3 · Los números escritos a mano

Hay dos formas distintas de escribir un número aquí, y conviene no mezclarlas.

**La primera, y la que preocupa:** un número literal en el HTML, sin conexión con el plan. Si el plan cambia, esto no cambia.

| Archivo | Línea | Qué dice | Debería salir de |
|---|---|---|---|
| `premercado.astro` | 156, 176 | `> 6.000 contratos` | el umbral de volumen del plan |
| `premercado.astro` | 157, 178 | `> 2.000 contratos` | **retirado del plan el 06/09** |
| `premercado.astro` | 108 | `0,25` puntos · `$0,50` | el valor del tick |
| `premercado.astro` | 168 | `19:00 hora Colombia` | el inicio del premercado |
| `zonas.astro` | 225, 245, 250, 268, 281, 303, 308, 373 | `5 velas` — **ocho veces** | el plazo de consecución |
| `setups.astro` | 102, 104, 144, 194 | `5 velas` — **cuatro veces** | el plazo de consecución |
| `jornada.astro` | 42 | `120 minutos` | derivado de la ventana operativa |
| `jornada.astro` | 44, 46 | `08:30 – 10:30` y `09:30 – 11:30` | la ventana operativa |
| `jornada.astro` | 61 | `08:31` | la primera vela |
| `entrada.astro` | 43, 45 | `+ 1 tick` y `− 1 tick` | el valor del tick |
| `dentro.astro` | 44 | `80 puntos` | el tope de stop |
| `riesgo.astro` | 42 | `320 ticks` y `$160` | equivalencias del tope de stop |
| `riesgo.astro` | 109 | `$160`, `$3.000`, `$1.400`, `5 %`, `11 %` | el plan los da todos |
| `riesgo.astro` | 24-28 | la tabla de rachas entera | el plan la da entera |
| `filtros.astro` | 86 · `riesgo.astro` 56-57 | `79,75`, `30`, `80,25` | son ejemplos, no umbrales |

**Las 12 apariciones de «5 velas» son el peor caso**, no por gravedad sino por número: el plazo de consecución está escrito doce veces a mano en dos páginas, y el plan lleva ese valor con una nota larga que dice que es un tope y no una espera. Doce sitios donde el matiz puede perderse.

Los tres de la última fila (`79,75`, `30`, `80,25`) **no me preocupan**: son ejemplos que ilustran que el tope es una línea dura, no valores del plan. Los listo por completitud.

**La segunda forma, más discreta:** el portal tiene un atajo que pide un parámetro y, si no lo encuentra, usa un texto de reserva escrito al lado. Hay **16 usos** de ese atajo, todos con su reserva escrita a mano. **Catorce funcionan** —el parámetro existe y se lee del plan, la reserva nunca se usa— pero son catorce números duplicados a mano esperando a divergir. **Y dos no funcionan**: los del umbral de volumen, que es el punto urgente 1.

**Qué propongo.** Tres cosas, de menos a más:

1. El vigilante que falla si una página pide un parámetro que no existe. **Media hora, y cierra la categoría entera.**
2. Sustituir las 12 apariciones de «5 velas» y las de la ventana horaria por el parámetro. **Una hora.**
3. Decidir qué se hace con las reservas: quitarlas del todo (y que la página falle al compilar si falta el parámetro) es más honesto que enseñar un número viejo. **Media hora**, pero es decisión del operador.

Los dólares y la tabla de rachas dependen de una decisión que sigue abierta: si esa sección **se dibuja**, los dejaría como están, saliendo del texto aprobado; si **se borra**, desaparecen solos. Está en «lo que dejó de ser urgente».

---

## 4 · Lo que el portal dice y el plan no

### Metodología inventada — no encontré ninguna

Revisé las afirmaciones de los ocho módulos contra el plan. **Todo lo que afirma el portal está respaldado.** Concretamente comprobé las que más me olieron a añadido:

- Las cifras de las rachas —$640, $1.600, −53 %, +114 %— están en el documento de pendientes y en el maestro, iguales.
- Lo del riesgo porcentual que crece cuando la cuenta cae, y los $160 que pasan del 5 % al 11 %, está escrito en el plan casi con las mismas palabras.
- La ventana horaria del portal, 08:30–10:30 hora Colombia en verano, coincide con la checklist diaria.
- La frase de que hace falta acertar más de la mitad de las veces para no perder dinero es aritmética directa de una operación al día con relación uno a uno. La dejaría.

**La única cosa que el portal dice y el plan ya no:** el umbral de volumen del NQ, retirado el 06/09. Punto urgente 1.

### Reglas del plan que el portal no muestra — una

De las 38 reglas, **37 aparecen citadas en el recorrido de los ocho módulos**. La que no: la de la vela que hace máximo mayor y mínimo menor sin corrida viva, que pasa a ser nueva vela origen. Tiene su ficha propia y se llega a ella desde el índice de reglas, pero **ningún módulo del recorrido la menciona**, y es una regla de estructura, de las que se usan a diario.

**Qué propongo:** una frase en el módulo de zonas, donde se explica la vela designada. **20 minutos.**

### ~~Los cuatro huecos declarados~~ — 🚫 DECIDIDO: no van al portal

> **Decisión del operador, 07/09/2026.** Los cuatro huecos **siguen abiertos en el plan** —el test ciego que no se ejecutó, la falta de regla de parada, la capa de contextualización que falta, y las cifras del backtesting que no miden la estrategia—. Lo que se decide aquí es solo que **el portal no tiene que enseñarlos**, ni a ellos ni a la cifra de los −91,00.
>
> Lo que sigue se conserva como constancia de lo que se encontró, **no como pendiente**. Con una excepción, que está arriba: la sección escrita y no dibujada de la pantalla de riesgo, que sigue siendo código muerto se enseñe el hueco o no.
>
> ⚠️ **Y recordar la contradicción de la cabecera:** las instrucciones escritas del portal siguen diciendo lo contrario de esta decisión. Hasta que se reescriban, esto volverá a salir como fallo.

**El portal no muestra los −91,00 pts en ninguna parte.** Lo busqué en las 53 páginas compiladas: no aparece. El lector que extrae la cifra **junto con sus cuatro motivos** existe, está escrito a propósito como un solo objeto para que nadie pueda pedir la cifra sin los motivos, y **no lo usa ninguna página**. Así que la regla del portal —si se muestran los −91, los cuatro motivos van en la misma pantalla— **no se está incumpliendo**. Pero por omisión, no por diseño.

El problema es el otro: **de los cuatro huecos, hoy solo se ve uno bien.**

| Hueco | Dónde se ve hoy |
|---|---|
| El plan no está probado — el test ciego nunca se ejecutó | Solo en la página del plan completo, **que ya no está en el menú** |
| No hay regla de parada | **En ninguna pantalla del recorrido.** El texto aprobado lo tiene, la página no |
| Falta la capa de contextualización | Mencionado de pasada en la galería y en una ficha de regla. No como hueco |
| Las cifras del backtesting no son válidas | **En ninguna parte** |

Al retirar el 06/09 las pantallas de auditoría —el plan completo, el vocabulario, los pendientes, la contextualización y el acta de cierre— **se fueron con ellas tres de los cuatro huecos**, y el cuarto se quedó en una página a la que ya no lleva el menú.

~~**Qué proponía:** una sola pantalla, «Lo que este plan todavía no sabe», con los cuatro motivos y la cifra. Hora y media.~~ **Descartado el 07/09 por decisión del operador.** No se hace.

---

## 5 · Lo que sobra

**Nada de esto rompe nada. Es peso muerto.**

**Lectores del plan que no usa ninguna página — diez.** En `src\lib\parsers.mjs`: el del glosario, el del backtesting con sus cuatro huecos, el del acta de cierre entera, el de contextualización, el de desviaciones, el de pendientes abiertos, el de la versión del plan, el del recuento de diagramas, y dos ayudantes de formato de títulos. Son unas 180 líneas. Todos son huérfanos de la limpieza del 06/09: quedaron sin página.

**Actualizado el 07/09 con las decisiones del operador.** Antes escribí que no los tocaría hasta saber si volvía alguna pantalla. Ya se sabe, y eso cambia el veredicto de tres de ellos:

- **El del glosario y el del backtesting con los cuatro huecos: ya no van a volver.** Con las dos decisiones tomadas, son borrables de verdad. Son los dos más grandes del grupo.
- **El del acta de cierre entera**, lo mismo, salvo que se quiera rescatar de ahí la cifra de las 11 sesiones — que es lo único de esa pantalla que sigue sin decidir.
- Los otros siete siguen igual que estaban: huérfanos, pequeños, y sin decisión que los afecte.

Aun así, **no borraría nada todavía**. El del backtesting está escrito a propósito como un solo objeto para que nadie pueda pedir la cifra sin sus cuatro motivos, y esa protección tiene valor mientras la cifra siga existiendo en el plan. Borrarlo es fácil; volver a escribirlo bien, no tanto. **Es media hora de trabajo y no corre prisa.**

**Una página huérfana:** la del plan completo, sub-fase por sub-fase (227 líneas). Se compila en cada build, se publica, y no está en el menú. Se llega desde las observaciones, que enlazan a ella cuando una observación es sobre una sub-fase. **Si se borra, hay que arreglar ese enlace.**

**Código muerto dentro de un archivo vivo:** la tabla de rachas y sus estilos en la página de riesgo. Ya no es urgente, pero **sigue sin resolverse**: o se dibuja o se borra, y si se borra hay que quitarla también del texto aprobado. Está explicado arriba, en «lo que dejó de ser urgente».

**Dos scripts que no ejecuta nadie:**
- `scripts\textos.mjs` — saca el texto visible de las páginas a los `.md` de `textos\`. No está en `package.json`; se ejecuta a mano. Tiene sentido que sea así, pero conviene que esté escrito dónde y cuándo.
- `scripts\graficos_conceptos.py` — **este me chirría.** Genera los diagramas del método importando el motor de backtesting. Las instrucciones del portal dicen, con todas las letras, que los diagramas del método **no los genero yo**, que se hacen en Cowork revisándolos uno a uno. Que el script viva aquí invita a lo contrario. **Yo no lo he ejecutado.** Propongo moverlo donde se usa de verdad, o dejar una nota en su cabecera diciendo que no se ejecuta desde aquí.

**Un comando de `package.json` sin uso aparente:** `npm run fuentes`, que cuenta las fuentes tipográficas. No forma parte de `verificar`.

**Dependencias:** las seis se usan. Nada que quitar.

**Siete imágenes que nadie enlaza:** las del apartado 2.

**Restos de pruebas:** ninguno. La carpeta de capturas del vigilante de vista se regenera y está ignorada.

---

## 6 · Qué me está costando tokens

Concreto, sin excusas.

**Lo más caro con diferencia: `reglas.json` no se puede leer por partes.** Son 72 KB en un solo archivo, sin índice. Las instrucciones dicen «lee esa regla, no el archivo entero», pero **no hay forma de hacerlo**: para responder «¿qué dice la regla del rompimiento?» hay que cargar las 38. En esta sesión lo esquivé ejecutando pequeños programas de Node que abren el archivo, sacan lo que necesito y me devuelven tres líneas — funciona, pero es un rodeo, y solo se me ocurre porque puedo ejecutar código. **Un índice al lado, con una línea por regla —número, grupo, enunciado— resolvería el 80 % de las consultas sin abrir el grande.** Media hora de script y se regenera con el copiador.

**Lo segundo: los enunciados de las reglas llegan sin tildes.** «vela designada», «direccion», «consecucion». Buscar por texto falla a la primera y hay que repetir la búsqueda sin acentos. Es el archivo del plan, así que **no lo toco** — lo dejo aquí por si al operador le sirve saberlo.

**Lo tercero: para saber si algo se ve en pantalla hay que abrir la página entera.** Las páginas del recorrido mezclan en un solo archivo el código, todo el texto visible y los estilos: la de zonas son 416 líneas, la de setups 305. Para responder «¿aparece el hueco de la regla de parada?» tuve que recorrer la página de riesgo completa **y** su texto aprobado, y compararlos a mano. Ese es exactamente el fallo que encontré, y me costó lo que cuesta leer dos archivos enteros. **Un vigilante que compare los títulos de cada texto aprobado con los de su página lo habría encontrado solo**, y de paso me habría ahorrado la lectura. Media hora, y es el que más rentabilidad tiene de todos.

**Lo cuarto, menor: las búsquedas por número devuelven mucha basura.** Buscar «5 velas» o «80 puntos» trae también los archivos de imagen `.jfif` de la carpeta de textos, que el buscador abre como binarios. Cuatro archivos, siempre los mismos. Ignorarlos en las búsquedas es un cambio de una línea.

**Lo que NO me costó nada, y merece decirse:** el copiador y la carpeta generada funcionan exactamente como promete la documentación. Nunca tuve que salir a `01_Plan\`, y las instrucciones del portal me dijeron a la primera qué archivo abrir para cada cosa. El aviso de no abrir el documento maestro entero —29.000 tokens— **me ahorró abrirlo**: saqué las siete secciones que necesitaba con el lector que ya existe, sin leer una línea del archivo.

---

## Resumen, para decidir rápido

**Actualizado el 07/09/2026.** Eran doce puntos; las dos decisiones del operador cerraron dos. **Quedan diez.**

| # | Qué | Cuánto | Riesgo si se toca |
|---|---|---|---|
| 1 | El umbral de volumen y el número del NQ retirado | 15 min + 30 del vigilante | ninguno |
| 2 | El diagrama que se llama «vigencia» | 2 min mirarlo | **hay que mirarlo antes** |
| 3 | Vigilante de texto aprobado contra página | 30 min | ninguno — **el que más rinde** |
| 4 | La sección escrita y no dibujada de riesgo: ¿se dibuja o se borra? | 30 o 10 min | es decisión, no arreglo |
| 5 | Reescribir la regla de las instrucciones que contradice la decisión | 10 min | ninguno |
| 6 | Las 12 apariciones de «5 velas» a parámetro | 1 h | bajo |
| 7 | Índice ligero de reglas | 30 min | ninguno |
| 8 | La regla de la vela origen, ausente del recorrido | 20 min | ninguno |
| 9 | Los nombres de grupo de la portada | 10 min | ninguno |
| 10 | Limpiar lectores y página huérfanos | 45 min | bajo — ya se puede |
| 11 | Unificar las carpetas de imágenes | 2 h | **alto — leer el apartado 2** |

**Cerrados por decisión del operador el 07/09:**

| ~~Qué~~ | Por qué |
|---|---|
| ~~¿Vuelve el glosario?~~ | Lo quitó él. No vuelve |
| ~~Una pantalla con los cuatro huecos y la cifra~~ | El portal no tiene que enseñarlos |

**Sigue sin decidir, y es lo único que queda colgando:** la cifra de las 11 sesiones validadas al tick, que no aparece en el portal. Probablemente cae con la misma decisión de los huecos, pero no lo doy por hecho.

**Nada de esto está hecho. Paro aquí y espero el visto bueno.**
