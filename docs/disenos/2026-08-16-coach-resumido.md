# Coach IA — resumen arriba, detalle plegado

| | |
|---|---|
| **Versión** | 1.0 |
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

### Etapa 3 — el veredicto manda

1. **Veredicto** — banner con icono, fondo y color. Es la respuesta a "¿estuvo bien?", no
   una sección más. Lleva **forma además de color** (icono ✓/✕): el color nunca solo.
2. **Qué te llevas** — el aprendizaje en 1-2 líneas.
3. **Errores a registrar** — los chips interactivos de siempre.

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

## Riesgos asumidos

- **Resumen flojo con `effort: low`.** Si sale genérico, subir a `medium` — una línea.
- **Si el modelo se salta la marca**, la sección cae al camino retrocompatible y se ve como
  hoy. Degradación limpia, nunca pantalla vacía.
