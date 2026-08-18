# Análisis — controles a la barra superior y exportar al final

**Versión:** 1.0 · **Estado:** aprobado e implementado (18 ago 2026)
**Pedido por:** Kris — "mover los botones de atrás/adelante al título principal, y donde
sale el mes y el año; al lado derecho el filtro de cuentas. Lo de PDF e imagen moverlo al
final para dar más espacio."

## Punto de partida

Análisis era la última sección que conservaba una fila propia de controles
(`.analysis-controls`) dentro del contenido: píldoras Mes/Trimestre/Anual, flechas ‹ › con
el picker, y los botones PDF/Imagen. Calendario y Disciplina ya habían subido sus controles
a la barra en agosto; el filtro de cuentas de Análisis también, pero el resto no.

## Diseño

### Barra superior

```
‹   Análisis · Agosto 2026   ›              [ 📅 Mes ▾ ]  [ APEX-232411-15 ▾ ]
```

- Flechas ‹ › compartidas (`navMes: true`), con guarda `Nav.actual() === 'analysis'` para
  no pisar a Calendario ni Disciplina. Su rótulo se adapta: "Mes/Trimestre/Año anterior".
- El período va a `#sectionContext`, junto al título — **un solo título por pantalla**.
- Mes/Trimestre/Anual pasa de píldoras a desplegable `.per-filter`, igual que Disciplina.
- El desplegable lleva, bajo un separador, el **salto directo** a un mes/trimestre/año
  concreto. Sin él, ir de agosto a marzo serían 5 clics en la flecha.

`Nav.HERRAMIENTAS.filtro` pasa a admitir un **array**: Análisis es la primera sección con
dos controles en la barra. Retrocompatible con el string que usan las demás.

### Exportar

PDF e Imagen bajan a una fila propia al final (`.analysis-footer`), tras el contenido y
**fuera de `#analysisExportArea`** — si entraran, saldrían dibujados en el propio PDF.
Alineados a la derecha, con etiqueta "Exportar informe" a la izquierda y un borde superior
que los separa. Es una acción de salida, no un control de lectura.

## Móvil (≤768 px)

Análisis es la única sección con **dos** controles en la barra, y a 375 px no caben junto
al título y las dos flechas. Se aprieta solo aquí, vía `data-seccion` en `.top-bar`:

| Qué | Por qué |
|---|---|
| Fuera la palabra "Análisis" | La barra de navegación de abajo ya dice dónde estás |
| Fuera las flechas ‹ › | El desplegable lleva el salto directo a mes/año: navegar sigue siendo un gesto |
| Botón de período en icono | Qué período es se lee en el contexto ("Agosto 2026" / "Q3 2026" / "2026") |

**Descartado:** tocar `grid-template-columns` de `.top-bar` en general. Se probó
`minmax(0, auto)` en la columna central y recortaba el mes en Calendario y Disciplina, que
sí caben. El problema era de Análisis; el arreglo también.

## Dos bugs encontrados por el camino

1. **`.acct-filter-sm` arrastraba `flex: 1 0 100%`** de julio, de cuando el filtro vivía
   dentro de la sección (allí ocupar toda la fila en móvil era correcto). En la barra, ese
   basis del 100% con **shrink 0** hacía que el filtro reclamara la columna entera y
   expulsara a su vecino —el selector de período— encima del mes. Corregido con
   `flex: 0 1 auto` en `.header-actions > .acct-filter-sm`.

2. **El panel se cerraba al elegir el tipo de período.** Al re-pintar el desplegable, el
   nodo pulsado queda desconectado del DOM; para cuando el evento llega a `document`, su
   `closest('#analysisPeriod')` ya da `null` y el manejador de "clic fuera" lo cerraba —
   justo cuando toca elegir el mes concreto debajo. Se marca el evento con `_enPeriodo`.
   El mismo patrón existe en `disciplina.js`, pero allí cerrar al elegir es el
   comportamiento correcto (no tiene salto debajo), así que se deja.

## Verificación (preview, 18 ago)

- Escritorio 1280: 8/8 — flechas, título+mes, período con texto, cuenta sin recortar,
  exportar al final fuera del área capturada, con borde y alineación.
- Móvil 375: 6/6 — sin solapamiento, mes entero, desplegable dentro de pantalla,
  navegación por salto directo, icono presente.
- Desplegable: 9/9 — abre, sigue abierto al cambiar de tipo, el salto se re-pinta al tipo
  nuevo, cierra al clic fuera, toggle del botón.
- Sin solapamiento en Calendario, Disciplina, Trades ni Análisis. Consola limpia.

## Pendiente menor (no introducido aquí)

El contexto de Calendario y Disciplina se recorta a 375 px (`ctx_recortado: true`). Es
previo a este cambio y el arreglo del `flex` lo mejora, no lo empeora.
