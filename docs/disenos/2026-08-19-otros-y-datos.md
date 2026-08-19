# Diseño — Otros y Datos: rediseño visual y arreglo de proporciones

| | |
|---|---|
| **Versión** | v2 |
| **Fecha** | 2026-08-19 |
| **Estado** | ✅ **IMPLEMENTADO** (19 ago) — las 4 fases cerradas y verificadas. Queda una comprobación que solo puede hacer Kris: ver §6.1 |
| **Origen** | Petición de Kris (19 ago): «en Otros el diseño parece una pantalla de los años 90»; «al ingresar a Datos todo se ve desproporcionado, las cajas para escoger lo de fase se salen de la ventana» |
| **Alcance** | `index.html`, `css/styles.css`, `js/app.js`, `js/data.js`, `js/db.js`. **Cero migraciones, cero cambios de esquema, cero escrituras nuevas** — solo lecturas de conteo |

> **Cómo se usa este documento.** Es la fuente de verdad de la implementación. Si algo se
> implementa distinto a lo que dice aquí, o se corrige aquí primero, o está mal
> implementado. Cada iteración es este documento **completo** actualizado (v2, v3…), nunca
> un parche suelto.

---

## 0. Decisiones ya cerradas con Kris (19 ago)

| # | Decisión | Consecuencia |
|---|---|---|
| 1 | **Las tarjetas de Otros llevan datos en vivo** | Nueva `DB.getResumenOtros()`: 6 conteos `head:true` en paralelo, cacheados. Ver §2.4 |
| 2 | **Datos se reorganiza en pestañas por catálogo** | Cada catálogo pasa de ~340 px a ancho completo. El desbordamiento se queda sin sitio de donde salir. Ver §3.1 |

Lo que este diseño **no** reabre: el criterio de disciplina, el P&L neto, la zona horaria,
las fechas locales, el menú de 6 botones ni el invariante de un solo título por pantalla.

---

## 1. Diagnóstico — la causa real, no el síntoma

### 1.1 Datos: por qué se sale de la ventana

| # | Causa | Dónde |
|---|---|---|
| 1 | `.catalog-add` es un `flex` **sin `flex-wrap`**. En «Errores» mete 4 hijos: input + select Tipo + select Fase + botón Agregar | `css/styles.css:1945` |
| 2 | `.catalog-tipo-select` lleva **`flex-shrink: 0`** — literalmente «no me encojas nunca» — y su ancho mínimo lo fija la opción más larga, `Fase 1 · Pre-sesión` (≈150 px) | `css/styles.css:2051` |
| 3 | Suma: ≈330 px de controles **rígidos** dentro de una columna de ≈340 px útiles. Nada puede ceder → la fila sale de la tarjeta | — |
| 4 | Lo mismo en cada fila de la lista: drag + toggle + nombre + 2 selects + 2 botones, en un `flex` sin wrap | `js/data.js:33` |
| 5 | `.data-catalogs` usa `repeat(2, 1fr)` en vez de `repeat(2, minmax(0, 1fr))`. Una columna con contenido que no encoge **crece por encima de 1fr** y descuadra la rejilla entera | `css/styles.css:1926` |
| 6 | Las tarjetas de arriba están limitadas a `max-width: 860px`; los catálogos de abajo van al 100 %. Dos anchos distintos en la misma pantalla | `css/styles.css:1931` |

**El punto 5 es el que produce la sensación de «todo desproporcionado»**: no es que se vea
apretado, es que la rejilla está mal declarada y el desbordamiento la deforma.

### 1.2 Otros: por qué parece de los 90

1. **Seis tarjetas idénticas** — mismo fondo, mismo borde, mismo icono verde, misma
   tipografía. Sin jerarquía: es un índice de sistema, no un panel.
2. **Ni un dato vivo.** Cada tarjeta dice *qué es*, ninguna dice *cuánto hay*. Un índice sin
   información es, literalmente, un menú de 1995.
3. **Sin agrupar.** Consultar (Trades, Imágenes, Experimentos) y configurar (Estrategia,
   Datos, Fechas) pesan exactamente igual.
4. **`max-width: 860px` con `auto-fill minmax(240px)`** — en monitor ancho quedan 3 columnas
   pegadas a la izquierda y medio metro de vacío a la derecha.
5. **Cero profundidad.** Sin sombra, sin gradiente, sin elevación; el hover solo cambia el
   fondo. Mientras tanto el modal del día v2 ya tiene hero con gradiente, borde de acento y
   chips: Otros se quedó fuera de esa migración.
6. En Ajustes, **«Cerrar sesión» pesa lo mismo que «Tema · Pendiente»**, que ni siquiera es
   un botón.

---

## 2. Otros — diseño

### 2.1 Estructura

```
section-otros                                    (max-width: var(--content-max))
│
├── .otros-eyebrow      CONSULTAR
├── .otros-grid         Trades · Imágenes · Experimentos
│
├── .otros-eyebrow      CONFIGURAR
├── .otros-grid         Estrategia · Datos · Fechas Especiales
│
└── .ajustes-card       Claves · Seguridad · Tema · ── · Cerrar sesión
```

Sin hero ni título propio: el invariante **un solo título por pantalla** manda, y la barra
superior ya dice «Otros» con el punto de conexión. Los rótulos `CONSULTAR` / `CONFIGURAR`
son *eyebrows* (0,7 rem, mayúsculas, `--text3`), del mismo tipo que `.ajustes-title` — no
son `<h2>`.

### 2.2 Anatomía de la tarjeta

```
┌───────────────────────────────────────────┐  ← hairline 2px del color de la tarjeta
│                                           │
│   ╭─────╮    99                        →  │  ← nº 1,75rem/800/tabular-nums
│   │  📈 │    OPERACIONES                  │  ← unidad 0,7rem mayúsculas --text3
│   ╰─────╯                                 │  ← pastilla 38×38, radius 11
│                                           │
│   Trades                                  │  ← 1rem / 600 / --text
│   Todas tus operaciones, una a una        │  ← 0,78rem / --text3
│   ·······································  │
│   última · 18 ago                         │  ← meta opcional, 0,72rem / --text3
└───────────────────────────────────────────┘
```

| Estado | Qué cambia |
|---|---|
| Reposo | `--card` + borde `--border` + hairline superior de 2 px en el color de la tarjeta |
| Hover | `border-color` → color de la tarjeta · fondo `linear-gradient(160deg, var(--c-dim), var(--card) 55%)` · `translateY(-2px)` · `box-shadow: var(--shadow)` · el chevron se desplaza 3 px |
| Activo | `translateY(0) scale(0.99)` |
| Foco | `outline: 2px solid var(--c)` con `outline-offset: 2px` |

**El color no se repite seis veces en el CSS.** La tarjeta declara dos variables locales y
el resto del bloque las usa:

```css
.otros-card { --c: var(--text2); --c-dim: rgba(255,255,255,0.06); }
.oc-accent  { --c: var(--accent-txt);  --c-dim: var(--accent-dim);  }
.oc-blue    { --c: var(--blue-txt);    --c-dim: var(--blue-dim);    }
.oc-violet  { --c: var(--violet-txt);  --c-dim: var(--violet-dim);  }
.oc-warning { --c: var(--warning-txt); --c-dim: var(--warning-dim); }
.oc-red     { --c: var(--red-txt);     --c-dim: var(--red-dim);     }
```

### 2.3 Las 6 tarjetas y sus contadores

Los números son los **medidos hoy contra Supabase** (19 ago 2026), no inventados:

| Tarjeta | Color | Nº | Unidad | Meta | De dónde sale |
|---|---|---|---|---|---|
| **Trades** | `accent` | **99** | operaciones | `última · 18 ago` | `count(trades)` + `max(trade_date)` |
| **Imágenes** | `violet` | **127** | gráficos | — | `count(sesiones)` con `imagen_url not null` |
| **Experimentos** | `blue` | **19** | en prueba | — | `count(catalogo_experimentos)` con `activo` |
| **Estrategia** | `warning` | **28** | reglas activas | — | `count(catalogo_reglas)` con `activa` |
| **Datos** | neutro | **87** | ítems en catálogo | `cuenta principal · APEX-15` | suma de los 5 catálogos + `objetivos` (ya cacheado) |
| **Fechas Especiales** | `red` | **26** | en 2026 | `próxima · 19 ago` | `catalogo_fechas` activas del año + `min(fecha) ≥ hoy` |

> ⚠️ **Superado el mismo día.** Al entrar la tarjeta de **Chaumer** en este grupo, el azul
> pasó a ser suyo y **Experimentos se quedó el ámbar** (`warning`). El reparto vigente está
> en `docs/disenos/2026-08-19-chaumer-vs-yo.md` §4.0 y en `.claude/rules/estilos.md`. Lo de
> abajo se conserva como registro de por qué se movió el violeta, no como estado actual.

> Experimentos usa `--blue` y no `--violet` porque **Imágenes** se queda el violeta: el
> violeta es el color con el que Kris ya asocia el laboratorio, pero aquí manda la
> distinción entre las tres tarjetas del grupo. Si prefieres al revés, es una línea.
> `estilos.md` documenta `--violet` como «experimentos»: **si se aprueba este reparto, hay
> que actualizar esa línea de `estilos.md`**.

`Otros.ITEMS` sigue siendo **la única lista**: se le añaden dos campos (`color`, `stat`) y
nada más. Añadir una sección nueva sigue siendo una entrada en ese array.

### 2.4 Cómo se cargan los datos

Nueva `DB.getResumenOtros()` en `js/db.js`:

- **6 conteos con `.select('*', { count: 'exact', head: true })`** — Supabase devuelve la
  cabecera con el total y **cero filas**. El payload es prácticamente nulo.
- **2 mini-consultas** de una fila: `max(trade_date)` y la próxima fecha especial.
- Todo en un `Promise.all`. Una sola ida y vuelta en paralelo.
- **Caché de módulo con TTL de 5 min** (`_resumenOtrosCache`), como ya hacen
  `_setupsCache` y `_checklistCache`. Entrar y salir de Otros no repite consultas.
- **Degradación:** si una consulta falla, esa tarjeta pinta `—` en el número y **sigue
  navegando**. Otros nunca se bloquea por los contadores; el `try/catch` es por tarjeta.
- **Sin salto de layout:** la caja del número nace con alto fijo y un `·· ` en `--text3`
  mientras carga. No hay *skeleton* animado: la consulta tarda menos que la animación.

### 2.5 Rejilla y anchos

| Antes | Después |
|---|---|
| `repeat(auto-fill, minmax(240px, 1fr))` + `max-width: 860px` | `repeat(auto-fit, minmax(260px, 1fr))` + `max-width: var(--content-max)` |

`auto-fit` en vez de `auto-fill`: con 3 tarjetas por grupo, las pistas vacías **se colapsan**
y las tres se reparten todo el ancho, en vez de dejar hueco muerto a la derecha.

| Ancho | Columnas |
|---|---|
| ≥ 900 px | 3 |
| 560–900 px | 2 |
| ≤ 560 px | 2 compactas — se oculta la descripción, el nº baja a 1,4 rem y la pastilla a 32 px |

Se mantiene el criterio ya acordado en el diseño del 16 ago: **en móvil nunca una sola
columna**, porque obligaría a deslizar en la pantalla cuyo motivo de existir es no deslizar.

### 2.6 Ajustes

Se conserva el componente de filas (funciona y es el idioma correcto para acciones de una
línea). Tres retoques:

1. El icono de cada fila pasa a **pastilla** de 30×30 (`--bg3` / `--text2`), igual que las
   tarjetas. Deja de flotar suelto.
2. **Orden nuevo:** Claves y objetivos · Seguridad · Tema *(pendiente, `opacity .7`)* ·
   separador de 8 px · **Cerrar sesión**.
3. **Cerrar sesión** se separa del bloque y usa fondo `--bg2` + icono en `--red-txt` en
   reposo (hoy solo se colorea al pasar por encima). Deja de pesar lo mismo que un
   recordatorio inerte.

Los `id` (`ajustesClaves`, `ajustesSeguridad`, `logoutBtn`, `ajustesCuenta`) **no cambian**.

---

## 3. Datos — diseño

### 3.1 Estructura nueva

```
section-data                                     (max-width: var(--content-max))
│
├── .data-hero        Cuenta principal  │  Capital inicial
│
├── .so-tabs#dataTabs   ← REUTILIZA el componente de Sesión Operativa, tal cual
│      Setups 2 · Errores 34 · Emociones 12 · Experimentos 19 · Recomendaciones 14
│
└── .so-panel × 5       ← uno visible a la vez, ancho completo
```

**Se reutiliza `.so-tabs` / `.so-tab` / `.so-panel` sin escribir CSS nuevo para la barra.**
Ya existe, ya está probado en Sesión Operativa, y ya trae `overflow-x: auto` en móvil
(`styles.css:1018`). Inventar un *segmented control* paralelo sería deuda desde el minuto
uno.

- El contador de cada pestaña es un `.chip-soft` (componente existente).
- Al cambiar de pestaña: `Nav.setContexto('data', 'Errores')` → la barra superior lee
  **«Datos · Errores»**. Cumple el invariante de un solo título por pantalla.
- **Persistencia:** `localStorage['datos.tab']`, por defecto `setups`.

### 3.2 El arreglo del desbordamiento — cuatro reglas

| # | Regla | Antes | Después |
|---|---|---|---|
| 1 | La fila de añadir **envuelve** | `.catalog-add { display:flex; gap:8px }` | `+ flex-wrap: wrap`; el input pasa a `flex: 1 1 240px; min-width: 0` |
| 2 | Los selects **pueden encoger** | `flex-shrink: 0; max-width: 150px` | `flex: 0 1 auto; min-width: 0; max-width: 100%` |
| 3 | Las columnas de rejilla **no crecen** | `repeat(2, 1fr)` | siempre `minmax(0, 1fr)` |
| 4 | La fila de ítem es **rejilla**, no flex | `display: flex` | `display: grid` con columnas nombradas y salto a 2 líneas en móvil |

La regla 2 es la causa raíz: `flex-shrink: 0` impide que nada ceda, y sin `min-width: 0` el
control nativo no puede recortar su propio texto. **Las dos juntas** son lo que revienta la
tarjeta.

Y lo que garantiza que no vuelva: con pestañas, **cada catálogo ocupa ≈1.100 px en
escritorio en vez de ≈340 px**. El desbordamiento se queda sin sitio de donde salir.

### 3.3 La fila del ítem (`.catalog-item`)

**Escritorio** — rejilla de 7 columnas:

```
grid-template-columns: 22px 34px minmax(0,1fr) 150px 168px 30px 30px;
                       drag  tog   nombre       tipo   fase   ✎    🗑
```

**≤ 760 px** — dos líneas, los selects bajan enteros:

```
grid-template-columns: 22px 34px minmax(0,1fr) 30px 30px;

[⋮][●]  Entrar sin zona marcada          [✎][🗑]
[  Tipo ▾              ][  Fase ▾              ]     ← grid-column: 1 / -1
```

El nombre lleva `min-width: 0` + `overflow: hidden; text-overflow: ellipsis`: es lo único
que puede ceder, y debe ser lo único.

### 3.4 La caja de añadir (`.catalog-add`)

De fila suelta a bloque con identidad propia:

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│  [ Nuevo error…                                ]  │
│  [ Tipo ▾ ]  [ Fase ▾ ]            [ + Agregar ]  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

`background: var(--bg2)`, `border: 1px dashed var(--border)`, `radius: 10px`,
`padding: 12px`. El borde discontinuo como afordancia de «crear» ya se usa en `.md2-clean`.
Hoy crear y listar se confunden porque comparten superficie.

### 3.5 Cabecera de panel

```
Errores                                          34 activos
Errores registrados por sesión
```

Reutiliza `.catalog-header` + `.catalog-sub` + `.chip-soft`. El `<h3>` sube a 1,05 rem.

### 3.6 `.data-hero` — Cuenta principal y Capital

Se quedan **fuera** de las pestañas, siempre visibles: no son un catálogo, son la
configuración que decide qué ve todo el journal.

```css
.data-hero { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
.data-hero > * { min-width: 0; }   /* sin esto, 1fr vuelve a poder desbordarse */
```

La tarjeta de Cuenta principal marca el nombre con el chip de acento; el `hint` de debajo se
mantiene igual (`cuentaPrincipalHint`).

### 3.7 Setups (pestaña 1)

Ya está bien resuelto con chips: **no se rediseña**. Solo dos parches del mismo problema:

- `.setup-var-add` gana `flex-wrap: wrap` y su input `min-width: 0`.
- `.setup-fam` alinea su superficie con el resto (`--bg2`, `radius 10`).

---

## 4. Tokens nuevos (3)

| Token | Valor | Por qué |
|---|---|---|
| `--blue-dim` | `rgba(91,148,201,0.15)` | La tabla de `.claude/rules/estilos.md` ya lo deja como hueco («—»). Hoy se escribe a mano cada vez que hace falta |
| `--violet-dim` | `rgba(124,108,243,0.15)` | Ídem |
| `--content-max` | `1180px` | Los `max-width: 860px` repetidos en 3 sitios sin nombre (`otros-grid`, `ajustes-card`, `data-top-cards`) |

`:root` pasa de **26 a 29 tokens**. Al aplicarlos se sustituyen los literales equivalentes
que aparezcan **en los bloques tocados** (`rgba(124,108,243,…)`, `rgba(91,148,201,…)`); no
se toca ninguno fuera del alcance. La cifra exacta de literales retirados se mide y se
apunta al cerrar la Fase 3, no se promete ahora.

**Hay que actualizar `.claude/rules/estilos.md`** con los 3 tokens nuevos y la cifra nueva
de deuda al cerrar la última fase.

---

## 5. Plan de implementación — 4 fases

| Fase | Qué | Archivos | Cómo se verifica |
|---|---|---|---|
| **1** ✅ | **Arreglo estructural de Datos**, sin rediseño: las 4 reglas de §3.2 | `css/styles.css`, `js/data.js` | ✅ **Hecho** — medido, ver §5.1 |
| **2** ✅ | **Pestañas en Datos** + `.data-hero` + cabeceras con contador | `index.html`, `js/data.js`, `css/styles.css` | ✅ **Hecho** — medido, ver §5.2 |
| **3** ✅ | **Otros: tokens, rejilla, tarjetas y Ajustes** (aún sin contadores) | `css/styles.css`, `index.html`, `js/app.js` | ✅ **Hecho** — medido, ver §5.3 |
| **4** ✅ | **Otros: contadores en vivo** | `js/db.js`, `js/app.js`, `js/account-filter.js` | ✅ **Hecho** — medido, ver §5.4 |

**La Fase 1 es autónoma.** Si se decide parar ahí, el desbordamiento ya está arreglado sin
haber movido una sola línea de markup.

### 5.1 Fase 1 — lo medido (19 ago)

El panel del navegador **no compone frames** (mismo problema que el 16 ago), así que la
verificación no es «se ve bien»: es medir `scrollWidth > clientWidth` en cada
`.catalog-card`, `.catalog-add`, `.catalog-item` y `.catalog-item-meta`, con filas reales
inyectadas en el DOM.

**Desbordamientos: 0** a 1280, 1024 y 375 px. Y el ancho de las tarjetas, que es lo que
Kris veía como «desproporcionado», a 1024 px:

| | Tarjeta 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| **Antes** (`repeat(2, 1fr)`) | 441 px | 306 px | 441 px | 306 px |
| **Después** (`minmax(0, 1fr)`) | 363 px | 363 px | 363 px | 363 px |

Con las reglas viejas reinyectadas a la fuerza, `.catalog-item-meta` medía 246 px dentro de
231 px disponibles: el desbordamiento reproducido y cuantificado.

#### Tres desviaciones respecto al diseño

| # | Qué apareció | Qué se hizo |
|---|---|---|
| 1 | El suelo `minmax(140px, 1fr)` de §3.3 **es mayor que el hueco disponible** a 375 px y seguía desbordando 5 px | `minmax(min(140px, 100%), 1fr)`, que ata el suelo al contenedor |
| 2 | El botón «Agregar familia» de Setups no cabe a la derecha del input en móvil | `.catalog-add .btn-primary` pasa a ancho completo por debajo de 760 px |
| 3 | **Bug preexistente encontrado en el camino:** `setupDragDrop` construía la lista de orden con `querySelectorAll('[data-id]')`, que recoge también el checkbox, los selects y los botones de dentro de cada fila — 6 entradas por fila en vez de 1, y el `orden` guardado salían múltiplos (6, 12, 18…) | `':scope > [data-id]'`. Se sostenía por accidente porque todas las filas aportaban el mismo número de nodos; al reestructurar las filas dejaba de ser seguro |

**Lo que no se pudo verificar:** nada que exija estar autenticado. El login pide contraseña
y no la introduzco, así que las filas son inyectadas, no traídas de Supabase.

### 5.2 Fase 2 — lo medido (19 ago)

| Qué | Resultado |
|---|---|
| Las 5 pestañas existen y conmutan | ✅ `setups · errores · emociones · experimentos · recomendaciones`; **exactamente un panel visible** en cada momento |
| Barra superior | ✅ Título «Datos» + contexto «Errores» / «Recomendaciones» según la pestaña |
| Persistencia | ✅ Se abre `recomendaciones` tras recargar habiéndola dejado abierta (`localStorage['datos.tab']`) |
| **Ancho del catálogo de Errores** a 1280 px | **1.012 px** — era 491 px con la rejilla de 2 columnas, y 306 px con la rejilla rota |
| Desbordamientos a 1280 px y a 375 px | **0** |
| Scroll horizontal de página en móvil | **Ninguno** (`scrollWidth` = 375 = viewport). La barra de pestañas hace su propio scroll, heredado de `.so-tabs` |
| Errores de JS en consola | Ninguno |

#### Desviaciones respecto al diseño

| # | Qué | Por qué |
|---|---|---|
| 1 | **`--content-max` se adelanta de la Fase 3 a la Fase 2** | Lo necesita `#section-data`, no solo Otros. Dejarlo para después habría dejado Datos sin límite de ancho en monitor grande justo en la fase que lo reorganiza |
| 2 | Se retiran dos reglas que quedaron muertas: `.catalog-card-wide` y el `@media` de `.data-catalogs` | La rejilla de 2 columnas a la que pertenecían ya no existe |
| 3 | El contador del panel se inyecta desde JS dentro del `<h3>` en vez de ir en el markup | Cinco ediciones de `index.html` para el mismo `<span>`; el `<h3>` pasa a `flex` y el chip va con `margin-left: auto` |

#### Lo que sigue sin verificarse, y es de verdad

**El alta, la edición, el borrado, el toggle y el arrastre reales contra Supabase.** Sin
sesión iniciada las seis lecturas de catálogo devuelven **401** (comprobado: son las
llamadas a `/rest/v1/catalogo_*`, no un fallo del cambio), así que las listas salen vacías
y las filas que mido son inyectadas a mano en el DOM.

El markup de cada fila y todos los `id` se conservan sin renombrar, y el cableado de
eventos no se ha tocado — pero eso es un argumento, no una comprobación. **Le toca a Kris
entrar con su clave y probar en cada pestaña: agregar, renombrar, borrar, activar/desactivar
y arrastrar para reordenar.** Es el único punto de la Fase 2 que no puedo cerrar yo.

### 5.3 Fase 3 — lo medido (19 ago)

| Qué | Resultado |
|---|---|
| Grupos | ✅ `Consultar` y `Configurar`, 3 tarjetas cada uno |
| Rejilla a 1440 px | `381,3 · 381,3 · 381,3 · 0px` — **tres columnas reales y la cuarta colapsada**, que es exactamente lo que hace `auto-fit`. Las 6 tarjetas miden lo mismo |
| Los 6 colores | ✅ Distintos y resueltos desde token: `#3FE0A6` · `#AFA9EC` · `#8FBDE8` · `#E0A33B` · `#A8A89B` · `#F2706F` |
| Hairline superior | ✅ `::before` con `content:""`, `height: 2px`, `background: rgb(63,224,166)` en Trades |
| Orden de Ajustes | ✅ Claves · Seguridad · Tema · separador · Cerrar sesión |
| Móvil (375 px) | ✅ 2 columnas de 173,5 px, descripción oculta, número a 19,6 px (1,4 rem), sin scroll horizontal |
| Navegación | ✅ Pulsar «Fechas Especiales» abre la sección, el título cambia, **el botón de Otros sigue encendido** (`Nav.PADRE`) y aparece el chevron de volver |
| Errores de JS | Ninguno (solo los 401 de Supabase por no haber sesión) |

#### Decisiones de implementación

| # | Qué | Por qué |
|---|---|---|
| 1 | **`Otros.ITEMS` sigue siendo un array plano**, con un campo `grupo` nuevo | El invariante del `CLAUDE.md` dice «una sección nueva = una entrada más en ese array». Partirlo en `GRUPOS` habría dejado esa frase mintiendo |
| 2 | La tarjeta de Datos va sin modificador de color (`color: ''`) | Es la neutra del reparto; hereda el `--c: var(--text2)` por defecto de `.otros-card` |
| 3 | El contador nace como `··` con la clase `.cargando` y `min-height: 1em` | Evita el salto de layout cuando la Fase 4 sustituya el marcador por el número |

### 5.4 Fase 4 — lo medido (19 ago)

**Los números de pantalla contra la base de datos.** El `SELECT` replicando los filtros
exactos de `getResumenOtros` devuelve lo mismo que pinta la tarjeta:

| Tarjeta | Consulta | Pantalla |
|---|---|---|
| Trades | 99 · último `2026-08-18` | `99` · «última · 18 ago» |
| Imágenes | 127 | `127` |
| Experimentos | 19 | `19` |
| Estrategia | 28 | `28` |
| Datos | 87 · `APEX-232411-15` | `87` · «principal · APEX-15» |
| Fechas Especiales | 26 · próxima `2026-08-19` | `26` · «próxima · 19 ago» |

**Degradación**, forzada en el navegador:

| Escenario | Resultado |
|---|---|
| La consulta entera revienta | Las 6 tarjetas pintan `—` |
| Solo falla el conteo de un catálogo | Solo Datos pinta `—`; las otras 5 conservan su número |
| Navegar con los contadores caídos | ✅ Pulsar Trades abre `section-trades` |
| Separador de miles | `1204` → **`1.204`** vía `fmtMiles`, como manda el invariante |

Las tres tarjetas sin meta (Imágenes, Experimentos, Estrategia) **ocultan la línea entera**,
no dejan el separador colgando de un texto vacío.

#### Desviaciones respecto al diseño

| # | Qué | Por qué |
|---|---|---|
| 1 | **Son 12 peticiones, no 6** | La tarjeta de Datos suma *cinco* catálogos (errores, emociones, experimentos, recomendaciones, setups + variantes), y hacen falta dos `select … limit 1` para el último trade y la próxima fecha. Siguen siendo todas `head: true` — cero filas — y van en un solo `Promise.all`, pero el diseño decía «6 conteos» y son 12 peticiones |
| 2 | La unidad de Fechas es **«este año»**, no «en 2026» | Un año escrito a mano caduca el 1 de enero. El conteo sí usa el año local (`getFullYear`, seguro: lo que rompe es sacar el día del instante actual en UTC) |
| 3 | `getResumenOtros` devuelve datos **en crudo**; el texto lo compone `Otros.META` | `db.js` no debe saber cómo se redacta una tarjeta |
| 4 | `abreviar` se exporta desde `AccountFilter` como **`corto`** | «APEX-232411-15 → APEX-15» ya estaba resuelto ahí. Copiarlo habría sido un segundo criterio de abreviatura suelto |

#### Lo que sigue sin verificarse

**El camino real cliente → Supabase de estos contadores.** Sin sesión iniciada las lecturas
dan 401, así que lo comprobado es (a) que las consultas SQL devuelven los números correctos
y (b) que el pintado, el formato y las tres rutas de degradación funcionan con esos datos
inyectados. Falta ver los 6 números llegar solos al abrir Otros con la sesión de Kris.

Presupuesto estimado: **8–12 llamadas por fase**. Ninguna pasa del umbral de 25.

---

## 6.1 Lo que le toca probar a Kris

Todo lo que exige sesión iniciada. El login pide contraseña y no la introduzco, así que
estas tres cosas quedan sin comprobar **de verdad**:

1. **En cada pestaña de Datos:** agregar, renombrar, borrar, activar/desactivar y
   **arrastrar para reordenar**. Los `id` y el cableado de eventos no se han tocado, pero
   eso es un argumento, no una prueba.
2. **Los 6 contadores de Otros llegando solos** al abrir la pantalla.
3. Que el **orden** guardado al arrastrar sea ahora `1, 2, 3…` y no múltiplos de 6
   (§5.1, desviación 3).

---

## 6. Lo que este diseño NO toca

- El criterio de disciplina, el P&L neto, el riesgo en puntos, las horas de NinjaTrader y
  las fechas locales.
- **El esquema de la BD: cero migraciones.** Solo lecturas de conteo.
- El menú de 6 botones. `Otros.ITEMS` sigue siendo la única lista y `Nav.PADRE` queda
  intacto.
- `#settingsModal` y el modal de Seguridad: mismos `id`, misma lógica, mismo disparador.
- La pestaña Diario, el Coach IA y Días anteriores.

---

## 7. Riesgos y cómo se cubren

| Riesgo | Mitigación |
|---|---|
| `data.js` busca sus nodos por `getElementById`; mover el markup a paneles podría romperlos | **Ningún `id` se renombra.** El diff mueve nodos, no los reescribe. La Fase 2 verifica las 5 altas y los 5 borrados uno a uno |
| Las pestañas ocultan paneles con `display: none`; el drag & drop se engancha sobre nodos ocultos | `setupDragDrop` escucha en el contenedor y no depende de medidas, así que funciona igual. Se verifica **arrastrando en cada pestaña**, no razonando |
| 6 conteos al entrar en Otros encarecen la navegación | `head: true` (cero filas), en paralelo, cacheados 5 min. Cada fallo es por tarjeta y no bloquea |
| Dos lenguajes visuales conviviendo (deuda conocida nº 1 de `estilos.md`) | Las dos pantallas se migran **enteras**, nunca a medias: media pantalla migrada se ve peor que ninguna |

---

## 8. Registro de versiones

| Versión | Fecha | Qué cambió |
|---|---|---|
| v1 | 2026-08-19 | Documento inicial. Recoge las 2 decisiones de Kris (contadores en vivo, pestañas en Datos) |
| v2 | 2026-08-19 | Aprobado e implementado. Se añaden §5.1–§5.4 con lo medido en cada fase y sus desviaciones, y §6.1 con lo que solo puede probar Kris |
