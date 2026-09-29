# BRIEF DEL PORTAL — Fase 2

**Fecha:** 2026-09-01 · **Estado:** punto de partida, no especificación cerrada.
**Antes de leer esto:** `..\01_Plan\CIERRE_FASE_1.md` y `..\CLAUDE.md`.

---

## Para qué es el portal

Para que el operador **ejecute el plan sin decidir nada** y **audite después lo que hizo**.

No es una web de marketing, no es un curso y no es un bot. Es la herramienta de trabajo de una persona, en su escritorio, mientras opera.

> El plan ya existe y está escrito. El portal **no añade metodología**: la hace consultable, ejecutable paso a paso y auditable.

---

## Lo que el portal tiene que resolver, en orden de importancia

### 1 · La secuencia del día, sin decidir
`CHECKLIST_DIARIA.md` convertida en algo que se recorre: cuatro bloques —antes de abrir NinjaTrader · premercado · ventana operativa · después del llenado— con las comprobaciones en su orden real.

Lo importante no es que sea bonito: es que **cuando llega el momento de mandar la orden, todos los filtros ya estén comprobados**. Los tres que pueden anular una entrada son el tope de stop, que el objetivo esté libre de zonas, y —solo en Reingreso— el punto de referencia.

### 2 · Las 38 reglas, consultables en caliente
Construidas **desde `reglas.json`**, no copiadas a mano. Buscables, filtrables por categoría, enlazadas entre sí y con el glosario. Cada regla con sus condiciones medibles y, cuando exista, el caso real que la fijó.

### 3 · Los parámetros en un solo sitio
Los números que pueden cambiar viven en `PARAMETROS.md` y las reglas los citan **por nombre, no por valor**. El portal debe respetar eso: cambiar el tope de stop en un sitio y que se propague a todo.

### 4 · La galería de casos
21 casos reales etiquetados, con su gráfica. Es el material con el que el operador entrena el ojo y con el que se resuelven las dudas de marcado.

### 5 · Lo que está abierto, visible
`PENDIENTES.md` y los cuatro huecos declarados. **No como letra pequeña.**

---

## 🚨 Cuatro cosas que el portal NO puede hacer

1. **No puede presentar el plan como probado.** No pasó el test ciego. Si hay una portada o un resumen, esto va ahí.
2. **No puede mostrar el resultado del backtesting sin sus advertencias.** −91,00 pts en 9 operaciones no mide la estrategia: las reglas cambiaron durante la propia revisión, no hubo filtro de noticias rojas y falta la capa de contexto. Los cuatro motivos, en la misma pantalla que la cifra.
3. **No puede convertir en regla nada de `CONTEXTUALIZACION.md`.** Esos diez elementos están fuera del plan a propósito, porque no tienen número. Pueden mostrarse **como recordatorio de criterio**, nunca como condición automática.
4. **No puede mandar órdenes ni conectarse a la cuenta.** El portal acompaña la decisión; no la ejecuta.

---

## Estándar visual

Está fijado en `..\CLAUDE.md` y viene de las gráficas que el operador ya validó una por una: fondo negro, sin cuadrícula, velas azul/blanca, zonas todas del mismo gris, zigzag blanco, franjas roja y verde solo sobre el tramo de la operación, y **sin líneas de entrada, stop ni objetivo**.

Dos frases suyas que valen como criterio de diseño:

> *"Entre más limpio sea el gráfico, mucho mejor."*
> *"Nada de tablas de datos. Solo gráficas."*

---

## Decisiones que el operador todavía no ha tomado

No las resuelvas por tu cuenta. Pregúntaselas cuando toquen:

| # | Decisión |
|---|---|
| 1 | ¿Portal local en su equipo, o accesible desde fuera? |
| 2 | ¿Consulta el portal **mientras** opera, o solo antes y después? |
| 3 | ¿La bitácora se escribe en el portal, o sigue donde está hoy? |
| 4 | ¿El portal lee los datos de NinjaTrader, o se le cargan a mano? |
| 5 | ¿Debe generar las gráficas de backtesting, o solo mostrar las ya generadas? |

---

## Lo que queda pendiente de la fase 1 y puede volver

- **El test ciego** (`P-29`). Se puede ejecutar **contra el portal**: dar diez gráficos sin etiquetar a alguien que solo tenga el portal delante y comparar. Sería la mejor prueba posible de que el portal funciona.
- **La regla de parada** (`P-21`). Cuando exista, entra en los parámetros.
- **La capa de contextualización.** Es una fase propia, aplazada por el operador.
- Seis dudas abiertas: zona estirada, alcance del FOMC, calendario de noticias rojas, separación mínima entre zonas del mismo tipo, vela de apertura sin cuerpo, y si sobra una regla.
