# DISEÑO DEL PORTAL — Fase 2 · v2

**Estado:** 🟡 propuesta, pendiente del visto bueno del operador
**Fecha:** 2026-08-31
**Alcance:** módulo 1 de 3 — *Trading Plan*. Los módulos de *backtesting* y *dashboard* se acoplan después sobre esta base.

---

## 0 · Para qué es este portal — corregido en v2

**No es una herramienta de operación.** Es la página donde **Alfredo Chaumer revisa las reglas** que se extrajeron de su metodología, y **deja sus observaciones escritas** para que el operador las lea después.

Eso cambia tres cosas respecto a v1:

| | v1 | v2 |
|---|---|---|
| Dónde vive | local | **internet**, en Cloudflare Pages |
| Quién entra | el operador | **el operador y Alfredo**, por lista blanca de correo |
| Qué hace | solo lectura | lectura **+ observaciones que se guardan** |

Y deja intactas las reglas duras: no manda órdenes, no lee NinjaTrader, no genera gráficas, no reinterpreta el plan.

### Dos cosas del brief que quedan explícitamente derogadas por el operador

| Decía el brief | Qué pasa ahora | Quién lo decidió |
|---|---|---|
| «Módulo 100 % estático. No toca base de datos» | Las observaciones necesitan persistencia → **Supabase** | el operador, 31/08/2026 |
| «El portal es privado hasta nuevo aviso» | Se publica ya, **con puerta**, porque su razón de ser es que Alfredo entre | el operador, 31/08/2026 |

### Y una que NO queda derogada

> **«Nada de escritura desde el cliente. Ninguna clave, endpoint privado ni token en el bundle.»**

Se cumple al pie de la letra: el navegador **nunca** habla con Supabase. Habla con una función de Cloudflare, que comprueba la identidad y escribe. La clave de Supabase vive como secreto en Cloudflare y no entra ni en el repositorio ni en el paquete que se descarga el navegador. Ver §10.

---

## 1 · Principio que gobierna el contenido

> **La web no tiene contenido propio.** Cada palabra de trading que se ve en pantalla sale de un archivo de `01_Plan\`. Los componentes ponen la caja, la tipografía y el orden; nunca el texto.

Consecuencia práctica: **ningún contador está escrito a mano**. «38 reglas», «21 casos», «13 sub-fases» no son constantes del código — se cuentan del archivo en cada build. Si mañana `reglas.json` tiene 39, la web dice 39 sin que nadie toque código.

### Cómo se cumple «ningún número escrito a mano»

| | |
|---|---|
| **Números que dice el portal** (contadores, resúmenes, etiquetas) | Salen **siempre** de `PARAMETROS.md` o de contar el archivo fuente. Cero literales en el código |
| **Números dentro del texto citado** (`«el stop mide 76,75 puntos»` en `GALERIA.md`) | Se muestran **tal cual los escribió el documento**. Reescribirlos sería reinterpretar el plan, que es justo lo prohibido |

Además, cada aparición del **nombre** de un parámetro (`STOP_MAX`, `ATM_DEFECTO`, `PLAZO_CONSECUCION`…) en cualquier texto renderizado se convierte en una **pastilla** con el valor vigente resuelto desde `PARAMETROS.md`, enlazada a `/parametros`. Así `R-08` deja de decir «el tope de stop» sin decir nunca que son 80 puntos.

---

## 2 · Discrepancias encontradas en las fuentes — no se corrigen, se muestran

Detectadas al leer los archivos. **No se toca `01_Plan\`.** El portal cuenta el contenido real y enseña el número real.

| Documento | Lo que dice la cabecera | Lo que hay |
|---|---|---|
| `GALERIA.md` | «11 casos documentados» | **21 casos** (`G-01`…`G-21`) |
| `PENDIENTES.md` | el prompt de fase 2 habla de «8 puntos abiertos» | **16 sin cerrar**: 9 en *Abiertos* + `P-23`, `P-24` + `P-25`…`P-28` + `P-29` |
| `TRADING_PLAN_CHAUMER.md` | «12 sub-fases» | la tabla *Estado de construcción* tiene **13 filas**, `F1.0`…`F1.12` |
| `CONTEXTUALIZACION.md` | 10 elementos | **`C-08` y `C-09` están usados dos veces cada uno**, para elementos distintos |
| `PROMPT_FASE_2.md` | «el `.gitignore` excluye `04_Web/` y no tiene `00_Guias/`» | ya estaba corregido antes de empezar |

En `/pendientes` y en `/contextualizacion` aparece un aviso discreto señalando el identificador duplicado. **No se renumera nada.**

---

## 3 · Stack

| Pieza | Elección | Por qué |
|---|---|---|
| Framework | **Astro 5**, salida `static` | Renderiza Markdown de forma nativa y manda **0 KB de JS** por defecto → Lighthouse alto sin pelearse. Las islas interactivas se activan una a una |
| Alojamiento | **Cloudflare Pages** | Gratis, despliegue con un comando desde el equipo. No necesita que el repositorio esté en GitHub |
| Puerta | **Cloudflare Access** (Zero Trust, gratis hasta 50 personas) | Lista blanca de correos. Alfredo entra con un código de un solo uso a su correo: sin contraseña que compartir, revocable, y queda registro de quién entró |
| Servidor de observaciones | **Cloudflare Pages Functions** | Cuatro endpoints. Es el único que conoce la clave de Supabase |
| Base de datos | **Supabase** (PostgreSQL) | Decisión del operador: reutiliza la plataforma que ya tiene. Migraciones vía el MCP de Supabase, según el skill `base-de-datos` |
| Interactividad | **Web Components vanilla** | Buscador, lightbox, scroll-spy y caja de observaciones. Cuatro islas pequeñas no justifican el runtime de un framework |
| Diagramas | **Mermaid renderizado en el build** a SVG inline | Son exactamente 2 y no cambian. Así son legibles en móvil sin cargar ~900 KB de librería |
| Estilos | CSS propio con *design tokens* | La paleta ya está fijada en `CLAUDE.md`. Se invoca el skill `lenguaje-visual` antes de la primera línea de CSS |

**Dependencias nuevas:** `astro`, `mermaid` (solo build, `devDependency`), `wrangler` (solo despliegue, `devDependency`). Nada más. Si hace falta una cuarta, se pide antes.

---

## 4 · De dónde sale cada vista

**Ninguna vista tiene una fuente inventada.**

| Ruta | Vista | Fuente exacta |
|---|---|---|
| `/` | **Portada** | `TRADING_PLAN_CHAUMER.md` § *Advertencia de uso* + los 4 huecos de `CIERRE_FASE_1.md`. Los contadores se cuentan de los archivos |
| `/plan` | **El plan por sub-fases** | `TRADING_PLAN_CHAUMER.md`, partido por `# F1.x ·`. Título y estado de cada una, de la tabla *Estado de construcción* |
| `/reglas` | **Las 38 reglas** | `reglas.json` — buscador y filtro por categoría |
| `/reglas/R-08` | **Ficha de regla** | `reglas.json` + la sección `## R-08 ·` del plan + imagen si existe. Ver §6 |
| `/parametros` | **Parámetros** | `PARAMETROS.md`, tablas parseadas a mapa |
| `/glosario` | **Glosario** | `GLOSARIO.md` § *Términos definidos*, un término por `##` |
| `/checklist` | **Checklist diaria** (imprimible) | `CHECKLIST_DIARIA.md` — 4 bloques `🅰 🅱 🅲 🅳` + los bloques añadidos, que también se muestran |
| `/galeria` | **Galería de casos** | `GALERIA.md` + `02_Assets\galeria\`. Imagen resuelta por manifiesto, ver §7 |
| `/pendientes` | **Lo que está abierto** | `PENDIENTES.md` + los 4 huecos de `CIERRE_FASE_1.md` |
| `/contextualizacion` | **Contextualización** | `CONTEXTUALIZACION.md`, marcada *esto NO es regla* en cabecera y en cada tarjeta |
| `/cierre` | **Acta de cierre de la fase 1** | `CIERRE_FASE_1.md` entero, incluida la tabla de backtesting |
| `/historial` | **Cómo se llegó hasta aquí** | `ESTADO.md`. Secundaria, en el pie |
| `/observaciones` | **Lo que Alfredo ha escrito** | **Supabase.** Ver §8 |

### Las tres sub-fases especiales

| | Qué pasa |
|---|---|
| `F1.10` | No tiene sección en el cuerpo del plan: su contenido **es** `GALERIA.md`. En la navegación aparece y enlaza a `/galeria` |
| `F1.11` | No tiene contenido en ninguna parte. Aparece como **hueco declarado**, con el texto de `CIERRE_FASE_1.md` §1 y de `P-29`. **No** como sección vacía |
| `F1.2` | Cerrada sin reglas, y en el documento es `##` en vez de `#`. Se detecta igual y se muestra con su explicación |

### El orden de la navegación

El documento maestro tiene **dos órdenes que no coinciden**:

| | Orden |
|---|---|
| Tabla *Estado de construcción* | F1.0 · F1.1 · F1.2 · F1.3 · F1.4 · F1.5 · **F1.12** · F1.6 · F1.7 · F1.8 · F1.9 · F1.10 · F1.11 |
| Cuerpo del documento | F1.2 · F1.3 · F1.5 · F1.9 · F1.8 · F1.7 · F1.6 · F1.4 · F1.0 · F1.1 · F1.12 |

**Propuesta:** la navegación sigue el **orden de la tabla** — es el índice que el propio documento declara, y se lee de corrido: perímetro → glosario → contexto → setup → entrada → stop → estructura → gestión → riesgo → filtros → proceso → galería → test. Un conmutador *«orden del documento»* enseña el otro en un clic. **Para alguien que viene a revisar el plan de cero, como Alfredo, el orden de la tabla es el que tiene sentido.**

---

## 5 · Las advertencias — cómo se garantiza que no se pueden esconder

Requisito duro, así que se implementa como **invariante del código**:

1. **Banda permanente** en la cabecera de todas las páginas: *plan v2.0 · escrito y contrastado · **no probado***, enlazando a `/cierre`. Texto y versión leídos del documento.
2. **Componente `<HuecosDeclarados />`** alimentado desde `CIERRE_FASE_1.md`. Único sitio donde viven los cuatro huecos.
3. **Regla de build:** el módulo `backtesting.ts` expone las cifras (`−91,00 pts`, `9 operaciones`) leídas de `CIERRE_FASE_1.md`. Un verificador recorre el HTML generado y **falla el build** si encuentra esa cifra en una página que no contiene los cuatro motivos.
4. `/contextualizacion` lleva su propia banda: *estos elementos no son reglas y no deben convertirse en reglas*.
5. **La portada es lo primero que ve Alfredo**, y lo primero que ve en la portada es que el plan no pasó el test ciego. No en letra pequeña, no plegado.

---

## 6 · Ficha de regla

`reglas.json` no tiene los mismos campos en todas las reglas. Medido:

| Campo | De 38 |
|---|---|
| `id`, `categoria`, `enunciado`, `condiciones`, `estado` | 38 |
| `accion`, `prioridad` | 30 |
| `nota` | 21 |
| `excepciones` (no vacío) | 3 |
| `fuente` | 5 |
| `pendiente` | 2 (`R-31`, `R-32`) |

**Un campo ausente no se dibuja.** Nada de «—», ni «sin excepciones», ni bloques vacíos.

**Orden de la ficha:**

1. `id` · categoría · prioridad · estado *(el `estado` es texto libre, no un enum: se muestra literal)*
2. **Enunciado**, en grande
3. **Condiciones medibles** — tabla `variable · operador · valor · timeframe`
4. **Acción**
5. **Excepciones** — solo si las tiene
6. **Nota** y **fuente** — solo si las tiene
7. **Pendiente asociado** — solo `R-31` y `R-32`, enlazado
8. **Imagen** — solo si existe archivo con su nombre. Sin imagen, no hay hueco
9. **Casos de la galería** que citan esta regla — calculado
10. **Dónde aparece en el plan largo** — enlace a la sección
11. **🆕 Observaciones de Alfredo sobre esta regla** + caja para escribir una nueva

### Imágenes de regla — inventario real

**7 diagramas y 1 contraejemplo** en todo el proyecto. Asociación por nombre de archivo, nada más:

| Archivo | Regla | Papel |
|---|---|---|
| `diagramas/R-10_corrida.png` | R-10 | diagrama |
| `diagramas/R-11_retroceso.png` | R-11 | diagrama |
| `diagramas/R-12_zona.png` | R-12 | diagrama |
| `diagramas/R-13_vigencia.png` | R-13 | diagrama |
| `diagramas/R-15_extension_apendice.png` | R-15 | diagrama |
| `diagramas/R-17_zonas_entre_zonas.png` | R-17 | diagrama |
| `diagramas/R-23_reingreso.png` | R-23 | diagrama |
| `invalidos/R-17_invalido_01.png` | R-17 | **contraejemplo**, etiquetado como tal |

Las otras 30 reglas no muestran imagen. No se busca sustituto.

### Buscador

Un solo campo que filtra a la vez por **texto libre** (enunciado, condiciones, acción, nota), por **id** (`R-14` salta a la regla) y por **categoría**. Las 12 reales de `reglas.json`, sin renombrar ni agrupar:

`contexto` (12) · `gestion` (4) · `filtro` (4) · `entrada` (3) · `setup` (3) · `marcado_zonas` (3) · `riesgo` (2) · `proceso` (2) · `estructura` (2) · `zonas` (1) · `contexto_operativo` (1) · `vigencia_zonas` (1)

Índice generado en el build, filtrado en el cliente sobre un JSON de ~60 KB. Sin servidor.

---

## 7 · Galería — resolución de imagen

21 casos, `G-01` … `G-21`. Orden de resolución:

1. `02_Assets\galeria\sesiones\G-xx_*.png` — **estándar visual actual, gana siempre**
2. `02_Assets\galeria\G-xx_*.png` — anterior al estándar; solo si no hay versión en `sesiones\`
3. **Sin imagen** → el caso se muestra igual, solo con su texto

⚠️ El campo `**Archivo:**` de `GALERIA.md` **no se usa para resolver la imagen**: en `G-11` apunta a `../05_Backtesting/G-11_10jul_operacion.png`, que no existe ahí. La resolución es por prefijo `G-xx` sobre el árbol real de `02_Assets\`.

**Filtro por regla:** se extraen los `R-xx` citados en cada caso y se construye el índice en los dos sentidos.

**Índice y visor** *(22/09/2026, sustituye al lightbox)*: la página es una rejilla de miniaturas por pestañas (test ciego · sesiones · ejemplos) y cada caso se estudia en un `<dialog>` modal con la gráfica a la izquierda y el texto al lado, con flechas, teclado, deslizar y `Esc`. Las miniaturas las genera `scripts/miniaturas.mjs` en `public/min/`. Sin librería.

---

## 8 · 🆕 Observaciones de Alfredo

El corazón de por qué esto está en internet.

### Qué puede hacer Alfredo

- Leer todo el plan.
- **Escribir una observación anclada a lo que está mirando**: una regla, una sub-fase, un caso de la galería, un término del glosario, un pendiente, un elemento de contexto — o general.
- Ver las que ya escribió, y que el operador le haya respondido.

### Qué puede hacer el operador

- Todo lo anterior.
- `/observaciones`: verlas todas, filtrar por estado y por ancla, **marcar** cada una como *revisada · aplicada · descartada*, y **responder**.
- **Exportar a Markdown** para llevarlas al ciclo de trabajo del plan.

### Cómo se ve

En cada ficha de regla, al final: las observaciones sobre esa regla y una caja para añadir. En `/observaciones`, la lista completa con contador por estado. **Ninguna observación toca el texto del plan** — se muestran claramente aparte, con su autor y su fecha.

> 🔴 **Una observación no es una regla.** El plan solo cambia si el operador lo cambia en `01_Plan\`. El portal deja constancia; no modifica la fuente. Esto va escrito en la propia pantalla.

### Tabla en Supabase

```sql
create table public.observaciones (
  id            uuid primary key default gen_random_uuid(),
  ancla_tipo    text not null check (ancla_tipo in
                  ('regla','subfase','caso','termino','pendiente','contexto','general')),
  ancla_id      text,
  texto         text not null check (char_length(texto) between 1 and 5000),
  autor_email   text not null,
  estado        text not null default 'nueva' check (estado in
                  ('nueva','revisada','aplicada','descartada')),
  respuesta     text,
  respondida_en timestamptz,
  creada_en     timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);
```

**RLS activado y sin ninguna política.** Eso significa que **nadie** puede leer ni escribir con una clave pública: el único acceso es el del servidor, que usa la clave de servicio guardada como secreto en Cloudflare. No hay superficie anónima.

Índices en `(ancla_tipo, ancla_id)` y en `(estado, creada_en desc)`.

### Los cuatro endpoints

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| `GET` | `/api/observaciones` | los dos | Lista, con filtros |
| `POST` | `/api/observaciones` | los dos | Crea. El autor **no se envía desde el navegador**: lo pone el servidor con el correo verificado por Access |
| `PATCH` | `/api/observaciones/:id` | **solo el operador** | Cambia estado o añade respuesta |
| `GET` | `/api/observaciones/export` | **solo el operador** | Descarga todo en Markdown |

**Cada endpoint verifica el JWT de Cloudflare Access antes de hacer nada.** Sin token válido, `403` — aunque alguien encuentre la URL. La distinción operador/revisor sale de comparar el correo verificado con una variable de entorno, no de nada que mande el navegador.

---

## 9 · Enlazado automático entre documentos

Un plugin `rehype` recorre el HTML ya renderizado y convierte en enlace toda referencia de código, en cualquier documento:

| Patrón | Destino |
|---|---|
| `R-xx` | `/reglas/R-xx` |
| `P-xx` · `D-xx` | `/pendientes#…` |
| `G-xx` | `/galeria#G-xx` |
| `C-xx` | `/contextualizacion#C-xx` |
| `F1.x` | `/plan#F1.x` |
| `STOP_MAX`, `ATM_DEFECTO`, … | pastilla con el valor + enlace a `/parametros` |
| término del glosario | `/glosario#termino` |

⚠️ Como `C-08` y `C-09` están duplicados en el origen, el plugin enlaza a la **primera** aparición y el índice muestra las dos, con aviso visible. **No se renumera nada.**

---

## 10 · Seguridad

| | |
|---|---|
| **Puerta** | Cloudflare Access con lista blanca: el correo del operador y el de Alfredo. Código de un solo uso al correo. Revocable en cualquier momento |
| **Claves en el paquete** | **Cero.** El navegador no conoce Supabase. La clave de servicio es un secreto de Cloudflare, puesta con `wrangler secret`, nunca en el repositorio |
| **Escritura desde el cliente** | Ninguna directa. Todo pasa por la función, que valida el JWT de Access antes de tocar la base |
| **RLS** | Activado sin políticas → deniega todo lo anónimo por defecto |
| **`00_Guias\`** | Ya en `.gitignore`. Se verifica con `git check-ignore` antes del primer commit |
| **Barrido final** | Se recorre `dist\` buscando claves, correos y endpoints antes de publicar |
| **Contenido** | Es la metodología de Alfredo y un plan **sin validar**, publicado en internet. Por eso la puerta no es opcional: **sin Access configurado, no se despliega** |

---

## 11 · Estructura de archivos

```
04_Web\
├─ package.json                  dev · build · sync · preview · deploy · check
├─ astro.config.mjs
├─ wrangler.toml                 configuración de Cloudflare Pages
├─ tsconfig.json
├─ .env.example                  nombres de las variables, SIN valores
├─ BRIEF_PORTAL.md               (ya existe, no se toca)
├─ PROMPT_FASE_2.md              (ya existe, no se toca)
├─ DISENO_PORTAL.md              este archivo
├─ DESPLIEGUE.md                 pasos manuales de Cloudflare y Supabase
│
├─ scripts\
│  ├─ sync.mjs                   01_Plan\ y 02_Assets\ → src\content\ y public\assets\
│  └─ verificar-advertencias.mjs falla el build si una cifra sale sin sus 4 motivos
│
├─ functions\                    ← Cloudflare Pages Functions
│  ├─ _middleware.ts             valida el JWT de Access en todo /api
│  └─ api\
│     ├─ observaciones\index.ts        GET · POST
│     ├─ observaciones\[id].ts         PATCH
│     └─ observaciones\export.ts       GET
│
├─ supabase\
│  └─ migraciones\0001_observaciones.sql
│
├─ src\
│  ├─ content.config.ts          colecciones tipadas
│  │
│  ├─ content\                   ← GENERADO por sync. En .gitignore
│  │  ├─ reglas.json
│  │  ├─ plan\*.md               los 9 documentos de 01_Plan
│  │  ├─ subfases\*.md
│  │  └─ manifiesto.json         índice de imágenes + fechas
│  │
│  ├─ lib\                       ← toda la lectura de las fuentes vive aquí
│  │  ├─ parametros.ts           PARAMETROS.md → mapa de parámetros
│  │  ├─ subfases.ts             parte el plan por F1.x + tabla de estado
│  │  ├─ galeria.ts              parte por G-xx + resuelve imagen + reglas
│  │  ├─ pendientes.ts           parte por secciones y estado
│  │  ├─ contextualizacion.ts    parte por C-xx
│  │  ├─ glosario.ts             parte por término
│  │  ├─ checklist.ts            parte por bloques
│  │  ├─ backtesting.ts          cifras + los 4 huecos, siempre juntos
│  │  ├─ imagenes.ts             manifiesto: archivo → regla / caso
│  │  └─ version.ts              versión y fecha, leídas del documento
│  │
│  ├─ plugins\
│  │  ├─ rehype-referencias.mjs
│  │  ├─ rehype-parametros.mjs
│  │  └─ remark-mermaid.mjs
│  │
│  ├─ estilos\
│  │  ├─ tokens.css · base.css · markdown.css · imprimir.css
│  │
│  ├─ componentes\
│  │  ├─ Marco.astro             cabecera + navegación + banda de advertencia
│  │  ├─ NavLateral.astro        sub-fases con scroll-spy
│  │  ├─ HuecosDeclarados.astro  los 4 huecos, fuente única
│  │  ├─ FichaRegla.astro · TarjetaRegla.astro
│  │  ├─ Buscador.astro          + isla buscador.js
│  │  ├─ TarjetaCaso.astro · Lightbox.astro
│  │  ├─ Parametro.astro         la pastilla
│  │  ├─ BloqueChecklist.astro
│  │  ├─ Observaciones.astro     + isla observaciones.js
│  │  └─ Aviso.astro             una sola caja de aviso, 4 tonos
│  │
│  └─ pages\
│     ├─ index.astro · plan.astro
│     ├─ reglas\index.astro · reglas\[id].astro
│     ├─ parametros.astro · glosario.astro · checklist.astro
│     ├─ galeria.astro · pendientes.astro · contextualizacion.astro
│     ├─ cierre.astro · historial.astro
│     └─ observaciones.astro
│
└─ public\
   ├─ assets\                    ← GENERADO por sync. En .gitignore
   └─ fuentes\
```

**Sobre `src\content\` y `public\assets\` en `.gitignore`:** son copias derivadas. El original vive en `01_Plan\` y `02_Assets\`, que sí están en el repositorio. `sync` corre solo antes de `dev` y de `build`, así que nadie lo teclea.

---

## 12 · El sync

```
npm run sync
```

1. Copia los 9 `.md` de `01_Plan\` + `reglas.json` + `subfases\` → `src\content\`
2. Copia `02_Assets\**\*.png` → `public\assets\`
3. Escribe `manifiesto.json`: qué imagen pertenece a qué regla y a qué caso, resuelto por nombre de archivo
4. **Avisa** si `reglas.json` no es JSON válido, si falta un `.md` esperado, o si una imagen de `sesiones\` no corresponde a ningún caso de `GALERIA.md`

**Nunca escribe en `01_Plan\` ni en `02_Assets\`** — abre en lectura y aborta si el destino cae fuera de `04_Web\`.

**Criterio de aceptación 1 verificado así:** cambiar una línea en `TRADING_PLAN_CHAUMER.md` → `npm run build` → la línea aparece cambiada en `dist\plan\index.html`. Sin tocar código.

---

## 13 · Diseño visual

Estándar ya validado en `CLAUDE.md`, sin desviarse:

| Token | Valor | Uso |
|---|---|---|
| `--fondo` | `#0B0E14` | fondo de todo |
| `--linea` | `#3A4256` | separadores, bordes de tabla |
| `--azul` | `#2E86FF` | acento primario, enlaces |
| `--texto` | `#FFFFFF` | texto principal |
| `--gris-zona` | `#8B93A7` | texto secundario |
| `--oro` | `#F5C542` | avisos, pendientes |
| `--rojo` | `#FF5C5C` | huecos declarados, prohibiciones |
| `--verde` | `#4ADE80` | confirmado |
| `--cian` | `#22D3EE` | referencias cruzadas, glosario |

**Sin cuadrícula, sin degradados, sin sombras de tarjeta, sin emojis decorativos.** Los emojis del texto fuente se respetan porque son del documento. Jerarquía por peso tipográfico y espacio, no por cajas.

Tipografía servida local, nada de CDN. **Responsive:** una columna por debajo de 768 px, navegación colapsada, tablas con desplazamiento propio, Mermaid con `viewBox`.

> Se invoca el skill `lenguaje-visual` antes de escribir la primera línea de CSS.

---

## 14 · Plan de implementación — 7 fases, cada una verificable sola

| # | Fase | Qué entrega | Cómo se verifica |
|---|---|---|---|
| **1** | **Esqueleto y sync** | `package.json`, Astro, `sync.mjs`, colecciones tipadas | `npm run sync` copia los 10 archivos y escribe el manifiesto · `npm run build` compila |
| **2** | **Motor de fuentes** | los 10 módulos de `src\lib\` | Un script imprime y **se cuenta, no se supone**: 38 reglas · 13 sub-fases · 21 casos · 24 términos · 16 pendientes abiertos · 12 encabezados de contexto · 2 diagramas |
| **3** | **Diseño base** | tokens, CSS, `Marco.astro`, navegación, banda de advertencia | Se arranca y se mira en escritorio y en 390 px |
| **4** | **Reglas** | `/reglas`, `/reglas/[id]`, buscador, pastillas de parámetro, `/parametros`, `/glosario` | Las 38 fichas generan HTML · búsquedas por `R-14` y por `zonas` · ninguna ficha con hueco de imagen |
| **5** | **Plan, checklist, galería** | `/plan` con scroll-spy, Mermaid, `/checklist` imprimible, `/galeria` con lightbox | 13 entradas incluida `F1.12` · `F1.11` como hueco · 21 casos · 2 SVG en el HTML · vista de impresión |
| **6** | **Huecos, pendientes, cierre y portada** | `/pendientes`, `/contextualizacion`, `/cierre`, `/`, `verificar-advertencias.mjs` | El verificador falla al quitar el componente a propósito, y pasa al devolverlo |
| **7** | **Observaciones y publicación** | tabla en Supabase, las 4 funciones, `/observaciones`, Access, despliegue, Lighthouse | Escribir una observación desde el navegador y verla en Supabase · `403` sin token de Access · barrido de secretos limpio en `dist\` · Lighthouse ≥ 90 |

Commit y push al cerrar cada fase, conventional commits en español.

### Lo que necesito de ti, y cuándo

| Cuándo | Qué |
|---|---|
| Antes de la fase 7 | **El correo de Alfredo** para la lista blanca, y el tuyo |
| Antes de la fase 7 | Que crees la cuenta de **Cloudflare** (gratis) — te dejo los pasos en `DESPLIEGUE.md` |
| Antes de la fase 7 | Confirmar en qué **proyecto de Supabase** va la tabla, o si creo uno nuevo |

Las fases 1 a 6 no necesitan nada tuyo. Se pueden hacer de corrido.

---

## 15 · Lo que este diseño NO hace

- No manda órdenes, no se conecta a la cuenta, no lee NinjaTrader, no genera gráficas.
- No convierte en regla nada de `CONTEXTUALIZACION.md`.
- No rellena huecos del plan, no completa reglas, no inventa categorías.
- No corrige las cifras desactualizadas de las cabeceras de `GALERIA.md` ni de `PENDIENTES.md` — las cuenta y muestra el número real.
- No escribe en `01_Plan\` ni en `02_Assets\`. Una observación de Alfredo **no modifica el plan**.
- No incluye bitácora de operativa, ni backtesting, ni dashboard: son los módulos 2 y 3.
- No se despliega sin la puerta de Access puesta.

---

## Registro de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| v1 | 2026-08-31 | Primera propuesta: portal local, 100 % estático, solo lectura |
| **v2** | 2026-08-31 | **El operador decide: portal en internet para que Alfredo revise, con observaciones que se guardan.** Añadidos Cloudflare Pages + Access, Supabase, las 4 funciones, `/observaciones` y la fase 7. Derogados los dos puntos del brief que lo impedían, con constancia de quién lo decidió. Contestadas las 5 decisiones abiertas |
