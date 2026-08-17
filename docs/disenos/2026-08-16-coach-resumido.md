# Coach IA — resumen arriba, detalle plegado

| | |
|---|---|
| **Versión** | 1.2 |
| **Estado** | ✅ Aprobado por Kris (16 ago 2026) — implementado |
| **Alcance** | Etapa 1 (Análisis técnico) y Etapa 3 (Diagnóstico final) de `section-coach` |
| **Mockup** | https://claude.ai/code/artifact/affe4f53-1d51-4d9f-9751-9bd3dccff85f |

## El problema

Un análisis técnico ocupaba ~50 líneas antes de llegar a lo importante: 11 reglas del
checklist una por una, 14 precios crudos, cronología a nivel de tick. Kris:

> *"Son datos muy valiosos, pero más valiosos para ti como Coach. A mí no me interesa ver
> tanta cosa técnica."*

## La idea, en una frase

**Mostrar menos NO es que el Coach sepa menos.** Lo que el Coach usa para pensar entra por
el system prompt (premercado, checklist, trades, reglamento, historial) y no cambia. Lo que
se recorta es solo el informe de vuelta.

Con un matiz que obliga a no borrar el detalle: **la Etapa 3 relee el detalle de validación
para construir el diagnóstico**. Si el modelo deja de generarlo, el diagnóstico empeora. Por
eso se genera siempre y se **muestra solo bajo petición**.

## Almacenamiento — sin migración

El modelo emite cada sección en dos partes dentro del MISMO texto:

```
En corto: <1-2 frases en lenguaje llano, sin números crudos>
Detalle:
<lo de hoy: sesgo/vigilar/noticias, cronología, reglas por fase…>
```

`partirResumen()` corta por ahí. Las columnas `sec_*` no cambian.

**Por qué así y no con columnas nuevas** (`sec_contexto_resumen`, …):

- Cero migración sobre los diagnósticos ya guardados.
- **Retrocompatible**: sin la marca `En corto:`, la sección se renderiza como hoy —
  detalle visible, sin plegar. Un día viejo nunca se ve vacío.
- El resumen y su detalle no pueden desincronizarse: son el mismo campo.
- Nadie necesita consultar los resúmenes por SQL — para eso ya está
  `sec_resumen_compacto`, que alimenta el historial de 60 días y el modal del día.

## Presentación

### Etapa 1 — tres secciones, misma anatomía

```
CONTEXTO                       ← etiqueta pequeña, borde de color a la izquierda
Día rotacional, sin dirección  ← el resumen (.cz-keep), tamaño de lectura
clara. Abriste dentro del…
▸ Ver detalle                  ← SIEMPRE cerrado
```

**Validación lleva además las píldoras de fase**, que son su resumen real:

```
Fase 1 · 3/3    Fase 2 · 0/5    Fase 3 · 3/3
```

De un vistazo se ve **en qué fase se rompió el día**, que es la pregunta que responde el
checklist. Los contadores ya se calculaban en `renderValidacion`: no se le pide nada nuevo
al modelo.

### Etapa 3 — mismo orden y colores que el mockup de Kris

1. **Veredicto** (azul) — la palabra *válida* / *inválida* va resaltada: el sentido lo
   lleva el TEXTO, no el color, así que se lee igual sin distinguir tonos.
2. **Errores detectados** (rojo; verde si el día salió limpio).
3. **Aprendizaje del día** (naranja).
4. **Errores a registrar** — los chips interactivos de siempre.

> **v1.1** — el veredicto se probó como banner con icono y Kris prefirió su mockup:
> sección normal, como las demás. Se descarta el banner.

### Colores por sección

| Sección | Borde y título |
|---|---|
| Contexto | verde — `--accent` / `--accent-txt` |
| Desarrollo de sesión | naranja — `--warning` / `--warning-txt` |
| Validación de setups | azul — `--blue` / `--blue-txt` |
| Veredicto | azul — `--blue` / `--blue-txt` |
| Errores detectados | rojo — `--red` / `--red-txt` |
| Aprendizaje del día | naranja — `--warning` / `--warning-txt` |

Título en MAYÚSCULA y del mismo tono que su borde, en variante `-txt` porque la `base` no
contrasta como color de letra.

**Validación va SIEMPRE en azul**, falle o no: si el título cambiara de color cada día se
perdería la referencia visual. Que una fase falle ya lo dice su píldora en rojo.

**Cambio de contenido:** hasta ahora la sección de errores volcaba el texto crudo del
modelo, con el formato de 9 partes separado por `|` a la vista. Ahora ese texto vive en el
detalle y arriba va el recuento en lenguaje humano.

**"Resumen para el diario" deja de mostrarse.** Repetía lo que ya dice la barra de KPIs de
la cabecera. Se sigue guardando en `sec_resumen_compacto` porque alimenta otras pantallas.

## Decisiones cerradas

| Decisión | Elegido |
|---|---|
| Lenguaje visual | **Migrar la pantalla entera** al nuevo (el de Diario) |
| Estado del desplegable | **Siempre cerrado.** Si recordara el estado, se vuelve al muro sin darse cuenta |
| Mensajes viejos del chat | **Se quedan todos**, sin colapsar |

## Reutilización

No se inventa componente: el lenguaje nuevo ya resolvió esto en Diario con
`.form-card.collapsible` + `.collapse-keep`, comentado como *"el resumen que se consulta a
diario"*. Las clases `.cz-sec` / `.cz-keep` / `.cz-det` son ese patrón aplicado al Coach.

De paso se consolidan los literales de color de esta pantalla a tokens (deuda conocida
nº 2 de `.claude/rules/estilos.md`: se consolidan al migrar cada pantalla).

## v1.2 — lo que falló en la primera prueba real (16 ago)

Kris regeneró el 14-ago y **siguió viendo el muro técnico**. Dos causas, las dos mías:

**1. El formato estaba definido en DOS sitios y solo actualicé uno.**
`buildSystemPrompt` (system) y `instruccionFormato` (mensaje del turno del usuario, en
`analisisTecnico`). Cambié el system y me dejé el segundo, que **pesa más** porque va en el
turno del usuario. El modelo obedeció al concreto y cercano: escribió el formato viejo.

La prueba está en el dato guardado: de las cuatro secciones, la única que salió con
`En corto:` fue **Aprendizaje** — la única cuyo formato vive *solo* en el system prompt.

> ⚠️ **Al tocar el formato de salida hay que cambiarlo en LOS DOS SITIOS.** Queda un
> comentario en `analisisTecnico` avisándolo.

**2. La degradación estaba mal diseñada.** Si faltaba la marca, la sección se mostraba
entera "para que no se viera vacía". Es exactamente lo que Kris no quiere ver, y convertía
un fallo del modelo en el peor resultado posible.

Ahora **el detalle se pliega SIEMPRE**, y si el modelo no escribió el resumen se **deriva
del propio texto** (`resumenDerivado`):

| Sección | De dónde sale el resumen si falta la marca |
|---|---|
| Contexto | la línea `Sesgo:` + la línea `Vigilar:` |
| Desarrollo | la primera viñeta |
| Validación | los contadores: *"6 de 11 filtros cumplidos. Falló la Fase 2."* |
| Aprendizaje | la primera línea |

Esto arregla de paso los **48 diagnósticos guardados antes del rediseño**: ahora se ven
resumidos y plegados, no como un muro.

## Riesgos asumidos

- **Resumen flojo con `effort: low`.** Si sale genérico, subir a `medium` — una línea.
- **El resumen derivado es peor que uno escrito por el modelo** — es una red de seguridad,
  no un sustituto. Pero garantiza que la pantalla nunca vuelva a ser un muro técnico.
