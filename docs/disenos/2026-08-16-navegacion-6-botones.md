# Diseño — Navegación de 6 botones, título único y Ajustes

| | |
|---|---|
| **Versión** | v2 |
| **Fecha** | 2026-08-16 |
| **Estado** | 🟡 **PENDIENTE DE APROBACIÓN** |
| **Origen** | Petición de Kris: en el móvil no caben los 11 botones; títulos duplicados |
| **Cambios v2** | **El tema claro sale del alcance.** La fila "Tema" se queda en Ajustes marcada como pendiente, sin interruptor y sin `[data-theme]`. Desaparece la antigua Fase 4; quedan 4 fases. Detalle y motivo medido en §7 |
| **Alcance** | `index.html`, `css/styles.css`, `js/app.js`, `js/db.js`, `js/metrics.js`, `js/gallery.js`, `js/disciplina.js`, `manifest.json`, `sw.js`. **No toca datos, ni disciplina, ni el Coach.** |

> **Cómo se usa este documento.** Es la fuente de verdad de la implementación. Si algo se
> implementa distinto a lo que dice aquí, o se corrige aquí primero, o está mal
> implementado. Cada iteración es este documento **completo** actualizado (v2, v3…), nunca
> un parche suelto.

---

## 0. Decisiones ya cerradas con Kris (16 ago)

| # | Decisión | Consecuencia |
|---|---|---|
| 1 | **Son 6 botones**, con **Apex** rescatado de "Otros" y colocado **después de Sesión** | Otros baja de 7 a 6 tarjetas |
| 2 | **Ajustes vive dentro de Otros**, no es botón principal | La tuerca desaparece de la barra superior |
| 3 | **Seguridad = cambiar contraseña** | Nuevo modal + `DB.changePassword` |
| 4 | **El tema NO se construye.** Solo se deja la fila en Ajustes, marcada como pendiente | Cero CSS de tema, cero `[data-theme]`, cero `localStorage`. La fila es un recordatorio visible, no una función a medias. Ver §7 |

Lo que este diseño **no** reabre: el criterio de disciplina, el P&L neto, la zona horaria
NT8, las invariantes del Coach y de Sesión Operativa. Cambia dónde se pulsa y qué se lee,
no qué se calcula.

---

## 1. El problema, en números

### 1.1 La barra del móvil

11 `.nav-item` ([index.html:54](../../index.html)-103) × `flex: 0 0 60px`
([css/styles.css:2566](../../css/styles.css)) = **660 px** de barra contra ~390 px de
pantalla. Caben 6,5. Y la barra de scroll está oculta a propósito
(`scrollbar-width: none`, línea 2555), así que nada indica que haya más.

Con 6 botones: **360 px**. Entra entero, sin deslizar, y sobran 30 px de holgura.

### 1.2 Los títulos dobles

Cada sección trae su `<h2 class="analysis-hero-title">` (11 apariciones) **y**
`Nav.go()` escribe el nombre en la barra superior
([js/app.js:376](../../js/app.js)). Dos títulos para la misma pantalla.

Dos de esos heroes **no son texto fijo, llevan dato** y no se pueden borrar sin más:

| Sección | Texto real | Quién lo escribe |
|---|---|---|
| Calendario | `Estadísticas — Agosto 2026` | [js/metrics.js:373](../../js/metrics.js) |
| Imágenes | cambia con el mes filtrado | [js/gallery.js:131](../../js/gallery.js) |
| Disciplina | subtítulo `#disciplinaHeroSub` colgando del hero | [js/disciplina.js:531](../../js/disciplina.js) |

### 1.3 Fallo colateral que este cambio arregla

**Hoy no se puede cerrar sesión desde el móvil.** El botón vive en `.sidebar-footer`, y
ese pie está `display: none` en móvil ([css/styles.css:2543](../../css/styles.css)).

Y la etiqueta **"Cuenta Fondeo"** ([index.html:105](../../index.html)) está escrita a mano
en el HTML: ningún JS la actualiza. Es decoración que miente.

---

## 2. Navegación — antes y después

```
ANTES (11 botones)                    DESPUÉS (6 botones)
─────────────────────                 ────────────────────────────────
Disciplina                            Disciplina
Análisis                              Análisis
Calendario                            Calendario
Apex                ─┐                Sesión
Experimentos         │                Apex
Trades               ├─ 7 se van      Otros ──┬── Experimentos
Sesión               │   a "Otros"            ├── Trades
Imágenes             │   (Apex vuelve         ├── Imágenes
Estrategia           │    a subir)            ├── Estrategia
Datos                │                        ├── Datos
Fechas Especiales   ─┘                        ├── Fechas Especiales
                                              └── Ajustes ─┬── Claves y objetivos
                                                           ├── Tema (pendiente)
                                                           ├── Seguridad
                                                           └── Cerrar sesión
```

### 2.1 Las secciones no se mueven, solo el menú

Las 6 secciones que salen del menú **siguen siendo `<section>` en su sitio, con sus ids
intactos**. Solo dejan de tener un `.nav-item`. `Nav.go('trades')` sigue funcionando igual
— es el mismo mecanismo que ya usan los alias `coach` e `historial`
([js/app.js:364](../../js/app.js)).

### 2.2 Qué botón se queda encendido

`Nav.go()` enciende el `.nav-item` cuyo `data-section` coincide
([js/app.js:370](../../js/app.js)-372). Al entrar a Trades ya no hay ninguno que coincida
→ **la barra se quedaría apagada entera**. Se resuelve con un mapa de padres, gemelo del
`TAB_ALIAS` que ya existe:

```js
// Secciones que ya no tienen botón propio: iluminan "Otros", que es de donde se llega.
PADRE: {
  experimentos: 'otros', trades: 'otros', gallery: 'otros',
  estrategia: 'otros', data: 'otros', fechas: 'otros',
},
```

### 2.3 Cómo se vuelve

Desde una subsección hay que poder volver a Otros sin buscar. La barra superior muestra un
**chevron de volver a la izquierda del título**, y solo cuando la sección actual tiene
padre. En el resto de secciones no aparece.

En escritorio el sidebar sigue visible con los 6 botones, así que el chevron es útil pero
no imprescindible; en móvil es la única salida elegante.

---

## 3. La barra superior — antes y después

```
ANTES   [☰]  Análisis ················· ● Conectado   [⚙]
DESPUÉS [‹]  ANÁLISIS  ················ ●
             ^^^^^^^^                   ^
             verde, mayúscula,          solo el punto: verde/rojo.
             + contexto pequeño         Botón, con etiqueta accesible.
```

| Elemento | Qué pasa |
|---|---|
| `#currentSectionTitle` | Pasa a ser **el único** título: verde `--accent-txt`, mayúsculas, `1.05rem` / `0.95rem` en móvil, `font-weight 700`, `letter-spacing .06em` |
| `#sectionContext` (nuevo) | Dato variable al lado, pequeño y en `--text3`: `Agosto 2026`, el mes filtrado de Imágenes, el subtítulo de Disciplina |
| `.status-indicator` | Pierde el texto "Conectado". Se queda **solo el punto de color** y pasa a ser `<button>`: al pulsarlo, un toast dice el estado. `aria-label` + `title` obligatorios |
| `#openSettings` (la tuerca) | **Se va de la barra** → Otros › Ajustes › Claves y objetivos. ⚠️ **Se retira en la Fase 3, no en la 2**: cada fase se sube a producción, y quitarla antes de que exista la fila de Ajustes dejaría los ajustes inalcanzables entre un despliegue y el siguiente |
| `.menu-toggle` (☰) | Se queda como está: solo escritorio, ya está oculto en móvil ([css/styles.css:2584](../../css/styles.css)) |
| `#navBack` (nuevo) | Chevron de volver, visible solo en subsecciones (§2.3) |

**Por qué `--accent-txt` (#3FE0A6) y no `--accent` (#1D9E75):** la base no contrasta
suficiente como texto sobre fondo oscuro. Es la regla de `.claude/rules/estilos.md` y el
error típico del proyecto.

**Por qué no más grande:** la barra mide 56 px (`--topbar-h`). Un título de 1.05rem con
mayúsculas y `letter-spacing` llena la barra sin desbordarla y sin competir con el
contenido — que es lo que hacía el hero de 2.1rem.

### 3.1 Los 11 heroes que se retiran

| Sección | Contenedor hoy | Qué se hace |
|---|---|---|
| Calendario | `.calendar-header` (grid 3 columnas) | Se quita la columna central → grid pasa a `1fr auto`. El "— Agosto 2026" lo escribe `metrics.js` en `#sectionContext` |
| Trades · Sesión · Datos · Análisis · Experimentos · Fechas | `.analysis-hero` | Se borra el bloque entero |
| Apex | `.analysis-hero` dentro de `#apexLista` | Se borra el bloque |
| Estrategia | `.rb-hero` | Se borra el `<h2>`; el contenedor solo tenía eso, se va también |
| Imágenes | `#galleryTitle` | Se borra; `gallery.js` escribe en `#sectionContext` |
| Disciplina | `.dd-hero` + `.dd-hero-titles` + `#disciplinaHeroSub` | Se borra el `<h2>` y `.dd-hero-titles`; el subtítulo pasa a `#sectionContext`. `.dd-hero` sobrevive porque sostiene los controles de mes |

CSS que queda huérfano y se retira: `.analysis-hero`, `.analysis-hero-title`,
`.dd-hero .analysis-hero-title`, `.calendar-header > .analysis-hero-title`,
`.dd-hero-titles`, `.dd-hero-sub` y sus dos reglas responsive.

**Riesgo controlado:** `.analysis-hero-title` no lo genera ningún JS — se verificó con
`grep -rn` sobre `js/`. Solo aparece escrito en `index.html`.

---

## 4. La pantalla "Otros"

Una sección nueva, `section-otros`. **Estructura copiada de Datos** (`.data-top-cards` +
`.catalog-card`, [css/styles.css:1818](../../css/styles.css)-1831): mismo radio, mismo
borde, mismo tamaño de título. No se inventa un componente nuevo, se adapta el que ya hay.

```
┌─ OTROS ───────────────────────────────────────────────────┐
│                                                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 🧪           │ │ 📋           │ │ 🖼            │        │
│  │ Experimentos │ │ Trades       │ │ Imágenes     │        │
│  │ Qué estás    │ │ Todas tus    │ │ Gráficos de  │        │
│  │ probando     │ │ operaciones  │ │ cada día     │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Estrategia   │ │ Datos        │ │ Fechas Esp.  │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                            │
│  ── Ajustes ──────────────────────────────────────────     │
│  ⚙  Claves y objetivos          API de Claude, objetivos ›│
│  🌗 Tema                                     Pendiente     │
│  🔒 Seguridad                             Cambiar clave  › │
│  🚪 Cerrar sesión                                          │
└────────────────────────────────────────────────────────────┘
```

### 4.1 Las 6 tarjetas

| Tarjeta | Icono | Descripción de una línea | Va a |
|---|---|---|---|
| Experimentos | `ti-flask` | Qué estás probando y si funciona | `experimentos` |
| Trades | `ti-list-details` | Todas tus operaciones, una a una | `trades` |
| Imágenes | `ti-photo` | Los gráficos de cada día | `gallery` |
| Estrategia | `ti-book-2` | Tus reglas y setups | `estrategia` |
| Datos | `ti-database` | Cuentas, catálogos e importación | `data` |
| Fechas Especiales | `ti-calendar-star` | Festivos, FOMC y días marcados | `fechas` |

Rejilla: `repeat(auto-fill, minmax(240px, 1fr))` con `max-width: 860px` → **3 columnas ×
2 filas** en escritorio. (Se probó con `180px` y salían 4+2, con la última fila coja.)
En móvil (`≤640px`) pasa a `repeat(2, 1fr)` — **dos columnas, no una**: con una sola, seis
tarjetas obligan a deslizar en una pantalla cuyo motivo de existir es no deslizar.

Cada tarjeta es un objetivo táctil de ~96 px de alto: muy por encima del mínimo de 44 px.
Estados `:hover`, `:active` y `:focus-visible` con el borde en `--accent` — foco visible,
como exige el sistema.

**Añadir una opción nueva en el futuro** = una entrada más en el array `OTROS_ITEMS` de
`app.js`. La rejilla se reacomoda sola; no hay que tocar HTML ni CSS.

**Estados de datos:** esta pantalla no muestra datos, es un índice fijo. No tiene estado
vacío, ni de carga, ni de error. Es la única razón por la que se salta esa regla.

### 4.2 El bloque Ajustes

Cuatro filas dentro de una `.catalog-card` a ancho completo (`.catalog-card-wide`, que ya
existe, [css/styles.css:769](../../css/styles.css)):

| Fila | Qué hace |
|---|---|
| **Claves y objetivos** | Abre `#settingsModal` **tal cual está hoy** — API Key de Claude, Dashboard Secret y los 4 objetivos. Cero cambios en ese modal, cero riesgo |
| **Tema** | **Inerte.** Sin interruptor. A la derecha, la etiqueta `Pendiente` en `--text3`. No es pulsable, no tiene `:hover`, no engaña (§7) |
| **Seguridad** | Abre `#securityModal`, nuevo (§6) |
| **Cerrar sesión** | El mismo `#logoutBtn` de hoy, movido aquí. Con esto el móvil recupera el logout. Debajo, **el email de la sesión** (`session.user.email`) |

El `.sidebar-footer` (badge "Cuenta Fondeo" + logout) **se elimina entero**. El badge era
texto muerto; el logout vive ahora en Ajustes, donde se ve en las dos pantallas.

El email bajo "Cerrar sesión" es el único añadido sobre el diseño original: donde antes
había una etiqueta fija que mentía, ahora hay un dato real, y además responde a la pregunta
que uno se hace justo antes de pulsar ese botón — *¿de qué cuenta estoy saliendo?*. No es
la "cuenta principal" de Apex (esa sigue siendo otro encargo, §11).

---

## 5. Nombre: "NQ Journal" → "Trading Journal"

| Sitio | Antes | Después |
|---|---|---|
| `index.html:6` `<title>` | `NQ Journal — Trading Diario` | `Trading Journal` |
| `index.html:15` `apple-mobile-web-app-title` | `NQ Journal` | `Trading Journal` |
| `index.html:37` logo del login | `NQ Journal` | `Trading Journal` |
| `index.html:51` logo del sidebar | `NQ Journal` | `Trading Journal` |
| `manifest.json` `name` | `NQ Journal — Trading Diario` | `Trading Journal` |
| `manifest.json` `short_name` | `NQ Journal` | `Trading Journal` |
| `sw.js:7` `CACHE` | `nqjournal-v5` | `nqjournal-v6` — hay que subirlo o el navegador sirve el HTML viejo desde caché |

El icono `ti-chart-candlestick` ya va delante del texto en ambos logos. Se mantiene.

⚠️ `short_name` de 16 caracteres: Android recorta a ~12 bajo el icono. Se acepta —
alternativa sería "Trading J." y es peor.

---

## 6. Seguridad — cambiar contraseña

`js/db.js`, junto a `signIn`/`signOut` ([js/db.js:1145](../../js/db.js)-1150):

```js
async changePassword(nueva) {
  const { error } = await supa.auth.updateUser({ password: nueva })
  if (error) throw error
},
```

Modal `#securityModal`, copiado del patrón de `#fechaModal` (`.modal-overlay` +
`.modal` estrecho):

- Nueva contraseña · Repetir contraseña, ambos `type="password"` con el mismo botón de
  ojo que ya usan la API Key y el Dashboard Secret.
- Validación en cliente: mínimo **8 caracteres** y las dos iguales. Mensaje en lenguaje
  humano, no un código.
- Éxito → toast `Contraseña actualizada` y cierra. Error → toast con el mensaje de
  Supabase.
- No pide la contraseña actual: Supabase no la exige para una sesión ya autenticada.

---

## 7. Tema — por qué la fila entra vacía

**Decisión de Kris (v2): el tema no se construye ahora.** La fila queda en Ajustes con la
etiqueta `Pendiente`, sin interruptor. Es un marcador de sitio, no una función a medias.

### 7.1 Por qué es la decisión correcta

Se midió el CSS antes de decidir. Un tema claro hoy dejaría esto sin cambiar de color:

| Qué | Cuántos | Qué se vería |
|---|---|---|
| `rgba(255,255,255,…)` fuera del `:root` | **82** | Bordes, hovers y separadores blancos **sobre fondo blanco: invisibles** |
| Colores hex escritos a mano | **45** | Pensados para fondo oscuro: chillones o lavados en claro |
| Estilos incrustados en el HTML | **58** | No responden a tokens en absoluto |
| Colores de las gráficas | 5 en `charts.js` + 4 en `disciplina.js` | Chart.js pintaría igual que hoy |

Traducción: Calendario, Disciplina, Análisis y el Coach se verían a trozos. Y media
pantalla migrada se ve **peor** que ninguna — parece un error, no una transición. Es la
regla que ya está escrita en `.claude/rules/estilos.md`.

### 7.2 Qué NO entra, explícitamente

Sin `[data-theme="light"]`, sin pares claros de los 26 tokens, sin `localStorage`, sin
script de anti-destello en el `<head>`, sin cambio de `<meta name="theme-color">`, sin
interruptor. **`css/styles.css` no gana ni una regla de tema.**

### 7.3 Qué haría falta para retomarlo

El orden ya está decidido en `.claude/rules/estilos.md` y apuntado en `tasks/current.md`:
primero consolidar los 45 hex y los 82 blancos en tokens, después migrar **pantalla
completa por pantalla completa**, y solo al final encender el interruptor. Se añade como
entrada en `tasks/backlog.md` con estos números, para que el día que se retome no haya que
volver a medirlo.

---

## 8. Árbol de archivos

```
index.html          MOD  6 nav-item · barra superior · 11 heroes fuera ·
                         section-otros nueva · #securityModal nuevo ·
                         sidebar-footer fuera · nombre
css/styles.css      MOD  .otros-* nuevo · barra superior · heroes fuera
                         (NADA de tema — ver §7.2)
js/app.js           MOD  Nav.PADRE · Nav.setContexto · Otros.init ·
                         Seguridad · logout movido · openSettings desde Ajustes
js/db.js            MOD  + changePassword
js/metrics.js       MOD  el mes va a #sectionContext, no a #calHeroTitle
js/gallery.js       MOD  el título va a #sectionContext
js/disciplina.js    MOD  el subtítulo va a #sectionContext  (hoy: disciplina.js:531)
manifest.json       MOD  name · short_name
sw.js               MOD  CACHE v5 → v6
tasks/backlog.md    MOD  el tema claro, con los números de §7.1
docs/decisiones.md  MOD  por qué el tema se aplaza en vez de entrar a medias
```

Ningún archivo se crea ni se borra fuera de este documento. **Cero dependencias nuevas.**

---

## 9. Plan por fases

Cada fase se verifica sola y se commitea sola. Verificación según `## Verificación` del
`CLAUDE.md`: `node --check` en cada `.js`, preview abierto con la consola limpia y la
pantalla afectada mirada de verdad.

| Fase | Qué | Cómo se verifica |
|---|---|---|
| **1** | Barra de 6 botones + `section-otros` con las 6 tarjetas + `Nav.PADRE` + chevron de volver | A 390 px: los 6 caben sin deslizar. Entrar y volver de las 6 subsecciones; "Otros" queda encendido en todas. Las 11 secciones siguen abriendo |
| **2** | Título único arriba (verde, mayúscula) + `#sectionContext` + retirada de los 11 heroes + conexión reducida al punto. **La tuerca sigue en la barra** hasta la Fase 3 | Recorrer las 11 secciones: un solo título en cada una. Calendario muestra el mes y cambia al navegar; Imágenes al filtrar; Disciplina muestra su rango |
| **3** | Ajustes: Claves y objetivos · Tema (inerte) · Seguridad · Cerrar sesión. **Y ahí se retira la tuerca de la barra** | El modal de claves abre y guarda igual que antes. Cerrar sesión funciona **desde el móvil**. Cambiar contraseña y volver a entrar con la nueva. La fila Tema no responde al clic |
| **4** | Renombrado a "Trading Journal" + `sw.js` v6 | Pestaña, login, sidebar y el icono instalado en el móvil. Recargar dos veces por el service worker |

---

## 10. Lo que puede salir mal

| Riesgo | Mitigación |
|---|---|
| Una subsección deja de ser alcanzable | `Nav.PADRE` + las 6 tarjetas. La verificación de Fase 1 entra en las 6 |
| Se pierde el mes del Calendario al borrar su hero | Fase 2 mueve el dato **antes** de borrar el hero, y lo comprueba navegando meses |
| El grid de `.calendar-header` se descoloca al quitar la columna central | Pasa a `1fr auto`; se mira a 390 px y a 1280 px |
| El service worker sirve el HTML viejo y "no se ve el cambio" | `CACHE` sube a v6 en Fase 4. Si aparece antes, recarga forzada |
| La fila "Tema" se lee como un botón roto | Sin `:hover`, sin cursor de mano, con la etiqueta `Pendiente` a la derecha. Se ve inerte a propósito |
| `#settingsModal` se rompe al mover el disparador | No se toca su markup ni su lógica: solo cambia quién lo abre |

---

## 11. Lo que este cambio NO hace

- **No construye el tema claro.** Solo deja la fila como recordatorio (§7).
- No cierra la deuda del doble lenguaje visual.
- No toca el cálculo de disciplina, ni el P&L, ni el Coach, ni la base de datos.
- No reordena las secciones dentro de cada pantalla: solo se les quita el título duplicado.
- No convierte "Cuenta Fondeo" en un dato real: lo **borra**. Si Kris quiere ver la cuenta
  principal en algún sitio, es otro encargo.
