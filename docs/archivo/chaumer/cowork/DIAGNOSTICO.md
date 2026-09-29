# DIAGNÓSTICO DEL PROYECTO — 07/09/2026

**Qué es esto:** una radiografía del estado real de `E:\Proyectos\Chaumer` y una propuesta para simplificarlo y para que cada petición cueste menos.

**Documento desechable.** Cuando apliquemos la reorganización, se borra.

---

## El diagnóstico en seis líneas

1. **La documentación del plan no está duplicada.** Está *dispersa*: 13 archivos para 38 reglas, y el 60 % del peso está en tres de ellos.
2. **Sí hay duplicación real en un sitio: los archivos de sub-fase.** Uno de ellos repite el 24 % del glosario.
3. **Hay 20 skills instaladas en el proyecto. Ninguna es de trading.** Todas son de diseño web, y once hacen lo mismo entre sí.
4. **Solo existe un `CLAUDE.md`.** Cowork y Claude Code leen el mismo. No hay configuración doble.
5. **La copia de `01_Plan` que hay dentro de la web es automática y correcta.** No la toques.
6. **Lo que encarece cada petición no son los documentos: es la forma de pedir las cosas y la longitud del chat.** Eso se arregla con hábitos, no con carpetas.

---

## Los números

| Bloque | Peso | Tokens aprox. |
|---|---|---|
| `01_Plan\` — 13 documentos `.md` | 350 KB | **100.000** |
| `01_Plan\reglas.json` | 70 KB | 19.600 |
| `04_Web\` — 7 documentos de proyecto | 105 KB | **30.300** |
| `CLAUDE.md` + `FASES.md` | 13 KB | 3.600 |
| **Documentación viva total** | | **≈ 153.000 tokens** |

Para hacerte una idea: leer la documentación entera de una sola vez consume **más del límite de un chat normal**. Por eso importa que cada archivo tenga un motivo claro para existir.

**Los cinco archivos más pesados** — el 70 % de todo:

| Archivo | Tokens |
|---|---|
| `01_Plan\TRADING_PLAN_CHAUMER.md` | 29.300 |
| `04_Web\ESTADO_FASE_2_HISTORIAL.md` | 14.300 |
| `01_Plan\ESTADO.md` | 13.800 |
| `01_Plan\GLOSARIO.md` | 12.600 |
| `01_Plan\PENDIENTES.md` | 10.400 |

---

## Hallazgo 1 · Las skills — lo más caro y lo más fácil de arreglar

En el proyecto hay **dos carpetas de skills**:

- `.agents\skills\` — 13 skills
- `.claude\skills\` — 20 entradas: **13 son enlaces a las anteriores** (no ocupan el doble en disco) **y 7 son reales**

Resultado: **20 skills activas**, todas de diseño y maquetación web. **Ninguna tiene que ver con trading, con el plan, ni con generar gráficos de velas.**

Y once de ellas dicen esencialmente lo mismo:

> `design` · `design-system` · `ui-styling` · `ui-ux-pro-max` · `minimalist-ui` · `industrial-brutalist-ui` · `high-end-visual-design` · `gpt-taste` · `stitch-design-taste` · `design-taste-frontend` · `design-taste-frontend-v1`

Dos de ellas son la misma con y sin `-v1`.

**Por qué te cuesta dinero, aunque no las uses.** Claude Code mete el **nombre y la descripción de cada skill** en su contexto **en cada petición**. Con 20 skills, y descripciones largas, eso es un peaje fijo que pagas escribas lo que escribas. Además `ui-ux-pro-max` arrastra **2,9 MB de datos** (catálogos de fuentes de Google, iconos, paletas) que se indexan.

**Lo peor:** compiten por la atención. Cuando le pides al portal "arregla esta tarjeta", once skills de diseño levantan la mano. Ése es exactamente el motivo por el que Claude Code te da resultados peores que los de aquí en las cosas visuales: no le falta capacidad, le sobran instrucciones contradictorias.

**Qué hacer:** dejar **como máximo dos**, y las que de verdad uses. Mi recomendación: quedarte con `ui-ux-pro-max` (es la más completa) y borrar las otras 19. Si el portal ya tiene su sistema de diseño escrito en `DISENO_PORTAL.md` y en `tokens.css`, no necesitas ninguna.

> ✅ Ya están fuera del repositorio (`.gitignore` las excluye). Borrarlas del disco no rompe nada y se reinstalan con su CLI si algún día las quieres.

---

## Hallazgo 2 · Los documentos `.md` — qué duplica qué

Medí el solapamiento real entre todos los documentos, comparando frases de cinco palabras. Esto es lo que salió:

| Solapamiento | Pareja | Veredicto |
|---|---|---|
| **62 %** | `EQUIVALENCIA_NUMERACION` ↔ `TRADING_PLAN` | falso positivo: son las tablas de números, no texto |
| **24 %** | `GLOSARIO` ↔ `subfases\F1.1_Glosario` | 🔴 **duplicación real** |
| **16 %** | `TRADING_PLAN` ↔ `subfases\F1.0_Perimetro` | 🔴 **duplicación real** |
| 11 % | `GLOSARIO` ↔ `TRADING_PLAN` | normal: el plan cita definiciones |
| 9 % | `PROMPT_FASE_2` ↔ `CLAUDE.md` | 🟡 se solapan las instrucciones al agente |
| 8 % | `ESTADO` ↔ `TRADING_PLAN` | normal: el historial cita el plan |

### Lo que sobra

**`01_Plan\subfases\` (11.500 tokens).** Son el cuaderno de trabajo de dos sub-fases de agosto. Todo su contenido vivo ya está en el glosario y en los anexos del plan. Ayer les puse un aviso de "archivo de construcción" — pero un archivo que hay que marcar como "no me leas" es un archivo que debería estar guardado, no en la carpeta principal.

**`01_Plan\PROPUESTA_LIMPIEZA_REGLAS.md` (2.400 tokens).** Tres de sus cuatro puntos ya están aplicados. Lo único vivo son las cuatro fusiones sin decidir — cuatro párrafos.

**`01_Plan\EQUIVALENCIA_NUMERACION.md` (1.800 tokens).** Una tabla de traducción vieja→nueva del 06/09. Ya no queda nada escrito con la numeración vieja: la usamos cero veces desde entonces.

**`04_Web\ESTADO_FASE_2_HISTORIAL.md` (14.300 tokens).** El archivo más pesado de toda la carpeta web y es puro historial.

**`04_Web\PROMPT_FASE_2.md` + `BRIEF_PORTAL.md` + `MENSAJE_A_CODE.md` (5.000 tokens).** Los tres dicen a un agente qué construir. `PROMPT_FASE_2` es de cuando la carpeta estaba vacía: el portal ya está construido, así que el documento está caducado.

### Lo que NO sobra, aunque lo parezca

**`04_Web\src\content\plan\` es una copia exacta de `01_Plan\`.** Comprobado: mismos nombres, mismos bytes. **La genera `npm run sync` y está fuera de git.** Es como debe ser: el portal necesita los documentos dentro de su carpeta para compilarlos. **No la borres ni la edites** — se regenera sola y cualquier cambio ahí se pierde.

**`04_Web\textos\` — 9 archivos, 30 KB.** Tampoco es duplicación: es el texto ya redactado del portal, extraído para que Alfredo lo corrija sin tocar código. Está bien pensado.

---

## Hallazgo 3 · La estructura de carpetas

**Carpetas vacías, creadas en su día y nunca usadas:**

```
06_Dashboard\                    vacía
99_Archivo\                      vacía
02_Assets\test_ciego\            vacía
02_Assets\validos\               vacía
02_Assets\frontera\              vacía
04_Web\functions\api\observaciones\   vacía
```

**Sueltos en la raíz, sin sitio:**

```
Claude outputs\                  3 PNG antiguos, dos ya obsoletos
00_SETUP_Estructura.ps1          el script que creó las carpetas en agosto
desktop.ini                      basura de Windows
skills-lock.json                 fichero de las skills que vamos a quitar
```

**Imágenes en el sitio equivocado:** hay 6 PNG sueltos en `05_Backtesting\` y 4 en la raíz de `02_Assets\`. Los diagramas del método viven en tres carpetas distintas a la vez: `02_Assets\diagramas\`, `04_Web\public\conceptos\` y `04_Web\public\assets\diagramas\`.

Ésa es la razón concreta por la que te pierdes buscando algo: **no hay un solo sitio donde vivan las imágenes del método.**

---

## Hallazgo 4 · Los archivos de Claude

Respuesta directa a tu pregunta: **no hay dos `CLAUDE.md`. Hay uno solo, en la raíz.**

```
CLAUDE.md                        el único · 2.100 tokens
.claude\settings.local.json      3 líneas, un permiso de bash
.claude\launch.json              atajo para arrancar el portal
.claude\skills\                  las 20 skills — fuera de git
.agents\skills\                  las mismas, por enlace — fuera de git
```

**Cowork (aquí) y Claude Code leen el mismo `CLAUDE.md`.** Eso es bueno: una sola verdad. Pero tiene una consecuencia que no habíamos visto:

> El `CLAUDE.md` actual está escrito **para Claude Code y para la fase 2**. Dice "la fase actual es construir el portal". Cuando trabajas conmigo aquí en cosas del plan o de gráficos, esa instrucción no ayuda — y falta lo que sí ayudaría: dónde están los datos, cómo se generan los gráficos, y el hecho de que en esta sesión el puente al disco funciona de otra manera.

**Lo que le falta al `CLAUDE.md`, y es lo que más caro te sale:** no dice **qué leer para cada tipo de tarea**. Sin esa guía, un agente que entra nuevo abre `TRADING_PLAN_CHAUMER.md` entero —29.300 tokens— para responder algo que estaba en `PARAMETROS.md`, que son 1.000.

---

## Hallazgo 5 · Por qué cada petición cuesta tanto

Ésta es la parte importante, y quiero ser honesto: **la culpa no la tienen los documentos.** Ordenar las carpetas ayuda a que tú te encuentres, pero apenas mueve la factura. Lo que la mueve es esto, en orden de impacto real:

### 1 · La longitud del chat (el que más pesa, con diferencia)

Cada mensaje nuevo arrastra **todo lo anterior**. Esta conversación lleva reorganizar documentación, cerrar un pendiente y dibujar cinco gráficos. Al pedir el quinto gráfico, se está pagando otra vez todo lo de antes.

**El hábito que más te va a ahorrar: un chat por tarea.** Cerrar y abrir uno nuevo no pierde nada — todo está en los archivos.

### 2 · Leer archivos enteros para cambiar dos líneas

Para corregir una frase del glosario hay que traer los 12.600 tokens del glosario. Con documentos más pequeños y mejor separados, ese mismo cambio cuesta una décima parte.

### 3 · Los listados de carpetas

El listado recursivo del proyecto que hice hoy devolvió **185.000 caracteres** de una sola vez, casi todo `node_modules` y `.git`. Un listado mal apuntado puede costar más que un documento entero.

### 4 · Los scripts de gráficos

Cada vez que retoco un script de gráficos, el sistema me devuelve **el script completo** para que vea el cambio. Cinco retoques a un script de 150 líneas son cinco copias del script en la conversación. Se arregla haciendo menos pasadas y más grandes.

### 5 · Verificar los gráficos mirándolos

Cada vez que abro un PNG para comprobar que no hay textos superpuestos, esa imagen entra en la conversación. **Es lo que hace que los gráficos salgan bien** —es la diferencia con Claude Code, que no se revisa a sí mismo— pero cuesta. Si un gráfico sale bien a la primera, no lo reviso dos veces.

---

## La propuesta

### Estructura nueva

```
Chaumer\
├─ CLAUDE.md                  reescrito: mapa + qué leer para cada tarea
├─ FASES.md                   dónde estamos y qué viene
│
├─ 01_Plan\                   LA VERDAD DEL MÉTODO — 8 archivos
│   ├─ reglas.json               fuente de verdad legible por máquina
│   ├─ PLAN.md                   el texto largo (era TRADING_PLAN_CHAUMER)
│   ├─ GLOSARIO.md
│   ├─ PARAMETROS.md
│   ├─ CHECKLIST_DIARIA.md
│   ├─ GALERIA.md
│   ├─ PENDIENTES.md             + las 4 fusiones sin decidir
│   └─ CONTEXTUALIZACION.md
│
├─ 02_Imagenes\               TODAS las imágenes del método, en un solo sitio
│   ├─ conceptos\                los diagramas didácticos del portal
│   ├─ galeria\                  los 21 casos reales
│   └─ sesiones\                 las 11 jornadas al tick
│
├─ 03_Fuentes\                material original (PDF, vídeo, transcripciones)
├─ 04_Web\                    el portal — 3 documentos, no 7
│   ├─ LEEME.md                  cómo se trabaja aquí (era ESTADO_FASE_2)
│   ├─ DISENO_PORTAL.md          la especificación
│   └─ PROPUESTAS_AL_PLAN.md     el buzón hacia 01_Plan
│
├─ 05_Motor\                  scripts de auditoría y de gráficos
│   ├─ datos\
│   ├─ lector.py · dia.py
│   └─ graficos\                 los scripts de los diagramas
│
└─ _Historia\                 todo lo cerrado, fuera de la vista
    ├─ CIERRE_FASE_1.md
    ├─ ESTADO_fase1.md
    ├─ ESTADO_FASE_2_HISTORIAL.md
    ├─ EQUIVALENCIA_NUMERACION.md
    ├─ PROMPT_FASE_2.md · BRIEF_PORTAL.md · MENSAJE_A_CODE.md
    └─ subfases\
```

**De 13 documentos en `01_Plan` a 8. De 7 en `04_Web` a 3. De 20 skills a 2 o a ninguna. De 6 carpetas vacías a cero.**

Nada se borra: lo cerrado se mueve a `_Historia\`, que queda fuera de git y fuera del camino.

### El `CLAUDE.md` nuevo — la pieza clave

Un solo archivo, corto, con una tabla que **hoy no existe** y que es la que va a bajar el coste:

| Si la tarea es… | Lee SOLO |
|---|---|
| una duda de una regla | `reglas.json` (esa regla) |
| cambiar un número | `PARAMETROS.md` |
| una definición | `GLOSARIO.md` |
| el porqué de una regla | la sección de esa regla en `PLAN.md` |
| un gráfico del método | `05_Motor\graficos\` + el estándar visual |
| tocar el portal | `04_Web\LEEME.md` |
| qué falta | `PENDIENTES.md` |

> Y una línea que hoy no está: **«no leas `PLAN.md` entero: busca la sección de la regla».**

---

## Plan de ejecución — cuatro pasos

| # | Paso | Riesgo | Tiempo |
|---|---|---|---|
| 1 | Borrar las skills que no usas y las carpetas vacías | ninguno | 5 min |
| 2 | Mover lo cerrado a `_Historia\` | ninguno — nada se borra | 10 min |
| 3 | Unificar las imágenes en `02_Imagenes\` y arreglar las rutas de los documentos | medio: hay que revisar los enlaces del portal | 30 min |
| 4 | Reescribir `CLAUDE.md` con la tabla de arriba | ninguno | 15 min |

**Los pasos 1, 2 y 4 los puedo hacer hoy.** El 3 conviene hacerlo desde Claude Code, porque toca rutas del portal y él tiene que recompilar y comprobar que no se rompe ninguna imagen.

---

## Los siete hábitos que más te van a ahorrar

1. **Un chat por tarea.** Terminas un gráfico, cierras. El siguiente empieza limpio.
2. **Di el archivo.** *"En el glosario, cambia la definición de traspaso"* cuesta mucho menos que *"cambia la definición de traspaso"*.
3. **Junta los encargos parecidos.** Cuatro gráficos en una petición cuestan bastante menos que cuatro peticiones de un gráfico.
4. **Separa decidir de ejecutar.** Preguntar "¿esto está bien?" y luego "hazlo" cuesta el doble que "hazlo, y si ves un problema páralo".
5. **Di cuándo NO quieres verificación.** Si un gráfico es para mirarlo tú y no para el portal, dilo: me ahorro revisarlo.
6. **Los cambios grandes de documentación, en su propio chat.**
7. **No pidas resúmenes de lo que ya hicimos.** Está escrito en `ESTADO`.

---

## Lo que NO voy a tocar sin que me lo digas

- Las cuatro fusiones de reglas (38 → 33). Siguen sin decidir.
- `04_Web\src\content\` — se regenera sola.
- Las 11 sesiones validadas y sus imágenes.
- Nada de `01_Plan\` sin avisarte antes.
