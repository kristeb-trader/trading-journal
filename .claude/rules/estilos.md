---
paths:
  - "css/**"
  - "index.html"
---

# Tokens y lenguaje visual

**Todos los tokens viven en `css/styles.css`, bloque `:root`** (29). Cards `radius 10px`,
transiciones 150ms. Iconos: Tabler Icons (CDN). Gráficas: Chart.js (CDN).

## Cada color semántico tiene DOS valores, y no son intercambiables

| Familia | `base` — bordes, fondos, rellenos | `-txt` — texto sobre fondo oscuro | `-dim` — fondo tenue |
|---|---|---|---|
| accent | `--accent` #1D9E75 | `--accent-txt` #3FE0A6 | `--accent-dim` |
| stop / error | `--red` #E24B4A | `--red-txt` #F2706F | `--red-dim` |
| warning | `--warning` #BA7517 | `--warning-txt` #E0A33B | `--warning-dim` |
| info / Fase 3 | `--blue` #5B94C9 | `--blue-txt` #8FBDE8 | `--blue-dim` |
| violeta | `--violet` #7C6CF3 | `--violet-txt` #AFA9EC | `--violet-dim` |

El violeta era «el color de Experimentos», pero en las tarjetas de **Otros** manda que las
del mismo grupo se distingan entre sí, no la asociación histórica. Reparto vigente
(19 ago), tras entrar Chaumer:

| Grupo | Tarjetas |
|---|---|
| Consultar | Trades `accent` · Imágenes `violet` · Experimentos `warning` · Chaumer `blue` |
| Configurar | Estrategia `warning` · Datos neutro · Fechas `red` |

Dentro de un grupo no se repite ningún color; entre grupos sí puede. **La sección
Experimentos en sí sigue en violeta** — lo que cambió es su tarjeta, no la pantalla.

La `base` **no contrasta lo suficiente como texto**. Usarla en un `color:` es el error
típico: se ve apagada sobre `--bg`. Para texto, la variante `-txt`.

## Superficies y tinta

| Token | Uso |
|---|---|
| `--bg` #1a1a18 | Fondo de página |
| `--bg2` #242422 · `--bg3` #2e2e2b | Elementos elevados |
| `--card` #252523 | Tarjetas |
| `--border` rgba(255,255,255,.07) | Separadores y bordes de tarjeta |
| `--text` #F4F3EF · `--text2` #A8A89B · `--text3` #6B6B60 | Primario · secundario · terciario |

Estructura: `--sidebar-w` 220px · `--topbar-h` 56px · `--radius` 10px · `--content-max`
1180px · `--shadow` · `--transition` 150ms.

`--content-max` es el ancho máximo de una pantalla de configuración o de índice (Otros,
Datos). Sustituye a los `max-width: 860px` que estaban repetidos a mano en tres sitios.

## Color por tarjeta sin repetir el bloque

Cuando una rejilla de tarjetas necesita un color por tarjeta (Otros, ago 2026), **no se
duplica el bloque de estilos seis veces**: la tarjeta declara dos variables locales y el
resto del CSS las consume.

```css
.otros-card { --c: var(--text2); --c-dim: rgba(255,255,255,0.06); }  /* neutra */
.oc-violet  { --c: var(--violet-txt); --c-dim: var(--violet-dim); }
```

Así el modificador es una línea por color y el componente no sabe cuántos colores hay.

## Reglas al escribir UI

- **Usar el token, NUNCA el hex.** Cada literal nuevo es un lenguaje visual nuevo: la
  siguiente pantalla no sabrá que ese valor existe.
- Excepción legítima: un valor que de verdad solo tiene sentido en un sitio (la altura de
  un gráfico, un `z-index` puntual). Va con un comentario que diga por qué no es token.
- **Reutilizar la estructura de una pantalla parecida** antes de inventar un componente.

## ⚠️ Deuda conocida

1. **Dos lenguajes visuales conviviendo.** El nuevo está en la pestaña **Diario** (16 ago)
   y en **Otros** y **Datos** (19 ago); Coach IA, Días anteriores y el resto de la app
   siguen con el viejo. Migrar **por pantalla completa**, nunca a medias: media pantalla
   migrada se ve peor que ninguna.
2. **Quedan 44 literales** de color fuera del `:root` (eran 140). Casi todos son variantes
   casi-idénticas de estos mismos colores — `#e87c7b` junto a `#f2706f`, `#a99cff` junto a
   `#afa9ec`, `#60a5fa` y `#6fa8dc` junto a `#5b94c9`. **Unificarlos cambiaría píxeles**,
   así que no se tocan en bloque: se consolidan al migrar cada pantalla, que es cuando el
   cambio visual está justificado y se puede revisar.

   El rediseño de Otros y Datos (19 ago) **no bajó esta cifra**: los bloques que tocó ya
   usaban tokens, así que no había nada que consolidar ahí. Lo único que añadió es el
   `rgba(255,255,255,0.06)` que sirve de `--c-dim` neutro por defecto en `.otros-card`,
   comentado en su sitio.
3. **177 estilos inline** (66 en `index.html`, 111 en `js/`) escapan a este sistema.

Ver `tasks/current.md`.

## Trampa: `direction: rtl` para recortar por delante

Recortar un texto **por delante** (para que se vea su final) con
`direction: rtl; text-align: right` **no mueve solo los puntos suspensivos**: cambia la
dirección del párrafo, y el algoritmo bidireccional **reordena** los tramos. Una etiqueta
que empiece por número se rompe:

```
"3 cuentas"  →  se renderiza  "cuentas 3"   →  recortado:  "ntas 3"
```

Pasó en el filtro de cuentas de la barra superior (18 ago 2026). `unicode-bidi: plaintext`
arregla el reorden pero devuelve el recorte al final, así que tampoco sirve.

**La solución es acortar el texto en JS**, no recortarlo en CSS: `labelBtn()` de
`account-filter.js` deja `APEX-232411-15` en `APEX-15` (primer + último segmento), que cabe
entero. El nombre completo se queda en el desplegable y en el `title`.
