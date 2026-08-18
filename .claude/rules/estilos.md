---
paths:
  - "css/**"
  - "index.html"
---

# Tokens y lenguaje visual

**Todos los tokens viven en `css/styles.css`, bloque `:root`** (26). Cards `radius 10px`,
transiciones 150ms. Iconos: Tabler Icons (CDN). Gráficas: Chart.js (CDN).

## Cada color semántico tiene DOS valores, y no son intercambiables

| Familia | `base` — bordes, fondos, rellenos | `-txt` — texto sobre fondo oscuro | `-dim` — fondo tenue |
|---|---|---|---|
| accent | `--accent` #1D9E75 | `--accent-txt` #3FE0A6 | `--accent-dim` |
| stop / error | `--red` #E24B4A | `--red-txt` #F2706F | `--red-dim` |
| warning | `--warning` #BA7517 | `--warning-txt` #E0A33B | `--warning-dim` |
| info / Fase 3 | `--blue` #5B94C9 | `--blue-txt` #8FBDE8 | — |
| experimentos | `--violet` #7C6CF3 | `--violet-txt` #AFA9EC | — |

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

Estructura: `--sidebar-w` 220px · `--topbar-h` 56px · `--radius` 10px · `--shadow` ·
`--transition` 150ms.

## Reglas al escribir UI

- **Usar el token, NUNCA el hex.** Cada literal nuevo es un lenguaje visual nuevo: la
  siguiente pantalla no sabrá que ese valor existe.
- Excepción legítima: un valor que de verdad solo tiene sentido en un sitio (la altura de
  un gráfico, un `z-index` puntual). Va con un comentario que diga por qué no es token.
- **Reutilizar la estructura de una pantalla parecida** antes de inventar un componente.

## ⚠️ Deuda conocida

1. **Dos lenguajes visuales conviviendo.** El nuevo (16 ago) solo está en la pestaña
   **Diario**; Coach IA, Días anteriores y el resto de la app siguen con el viejo. Migrar
   **por pantalla completa**, nunca a medias: media pantalla migrada se ve peor que ninguna.
2. **Quedan 44 literales** de color fuera del `:root` (eran 140). Casi todos son variantes
   casi-idénticas de estos mismos colores — `#e87c7b` junto a `#f2706f`, `#a99cff` junto a
   `#afa9ec`, `#60a5fa` y `#6fa8dc` junto a `#5b94c9`. **Unificarlos cambiaría píxeles**,
   así que no se tocan en bloque: se consolidan al migrar cada pantalla, que es cuando el
   cambio visual está justificado y se puede revisar.
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
