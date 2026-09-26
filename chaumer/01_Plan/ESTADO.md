# ESTADO — índice de trabajo compacto

> **Archivo de arranque.** Léelo primero cada sesión. Las reglas, en `reglas/` (un archivo por grupo); las definiciones, en `GLOSARIO.md`.

**v3.16** · 2026-09-26 · **40 reglas** · 🏁 FASE 1 CERRADA · 🔴 **TEST CIEGO EN MARCHA** · 🚧 FASE 2 en curso: portal web en `04_Web\`

> 🔴 **El test ciego arrancó el 14/09/2026.** Protocolo en `05_Backtesting\test_ciego\LEEME_BACK_DIARIO.md`; diferencias en `DISCREPANCIAS.md`; las jornadas, en `GALERIA.md`.

## ⚠️ Advertencia de uso

**El plan está escrito y contrastado, no probado.** Los cuatro huecos declarados del cierre de la fase 1 siguen escritos en `PENDIENTES.md` y en `CIERRE_FASE_1.md`, y de ahí no se borran:

🚨 `P-29` el **test ciego** —en marcha desde el 14/09/2026, sin cerrar · 🚨 `P-21` **no hay regla de parada** · 🚨 falta toda la **capa de contextualización** · 🚨 `P-27` las cifras del backtesting **no miden la estrategia**.

## Las 40 reglas, por grupo

*El nombre de cada regla es el título de su apartado en `reglas/`. La regla entera, en su archivo.*

### 1 · Perímetro operativo (4) · `reglas/1-perimetro.md`

| ID | Regla |
|---|---|
| `R-01` | Instrumento, gráfico y timeframe |
| `R-02` | Ventana operativa |
| `R-03` | Plantilla de gráfico |
| `R-04` | Tamaño de posición |

### 2 · Estructura del precio (4) · `reglas/2-estructura.md`

| ID | Regla |
|---|---|
| `R-05` | Corrida (= impulso) |
| `R-06` | Retroceso |
| `R-07` | Vela base de la ventana operativa |
| `R-08` | Vela envolvente sin corrida viva |

### 3 · Zonas (14) · `reglas/3-zonas.md`

| ID | Regla |
|---|---|
| | **── MARCADO ──** |
| `R-09` | Marcar una zona |
| `R-10` | Estirar la zona · rompimiento con mecha sin consecución |
| `R-11` | Zona apéndice · rompimiento con cuerpo sin consecución |
| `R-12` | Zonas entre zonas — la regla del 50 % |
| `R-13` | Superposición de zonas — se estira, no se duplica |
| `R-14` | El plazo de consecución es un tope, no una espera |
| `R-15` | Zona de premercado — la única que nace del volumen |
| `R-16` | Cuándo se dibuja cada zona |
| `R-17` | Una sola zona entre zonas, por banda y por jornada |
| `R-18` | Salir de una zona es rompimiento + consecución |
| `R-19` | Cómo se dibuja una zona — seis precisiones |
| | **── VIGENCIA ──** |
| `R-20` | Rompimiento y consecución |
| `R-21` | Vigencia e invalidación de una zona |
| `R-22` | La vela que confirma un traspaso no abre el rompimiento contrario |

*`R-16` + `R-12` + `R-17` + `R-18`, leídas en orden, son la secuencia del día: «Cómo se marca una jornada», al principio de `reglas/3-zonas.md`.*

### 4 · Setup y entrada (7) · `reglas/4-setup-entrada.md`

| ID | Regla |
|---|---|
| `R-23` | Selección de setup |
| `R-24` | Tipo de orden y momento de colocación |
| `R-25` | Setup Continuación |
| `R-26` | Setup Reingreso |
| `R-27` | La vela de apertura no sesga la jornada |
| `R-40` | Corrida fluida |
| `R-41` | Punto de referencia |

### 5 · Riesgo, orden y gestión (7) · `reglas/5-riesgo-gestion.md`

| ID | Regla |
|---|---|
| `R-28` | Máximo de operaciones por sesión |
| `R-29` | Caducidad de la orden pendiente |
| `R-30` | Fin de ventana con posición abierta |
| `R-31` | Configuración de ejecución (ATM `K1`) |
| `R-32` | Stop y target |
| `R-33` | No se gestiona |
| `R-34` | Al llenarse la orden termina el análisis del día |

### 6 · Filtros de no-operar (3) · `reglas/6-filtros.md`

| ID | Regla |
|---|---|
| `R-35` | Noticia roja |
| `R-36` | Día de FOMC |
| `R-37` | Estado del operador |

### 7 · Proceso diario (1) · `reglas/7-proceso.md`

| ID | Regla |
|---|---|
| `R-38` | Checklist diaria y registro |

## Fuera de las reglas

| Documento | Qué tiene |
|---|---|
| `CHECKLIST_DIARIA.md` | la secuencia del día, en sus bloques, cada línea con su regla |
| `GLOSARIO.md` | qué significa cada palabra del plan |
| `PARAMETROS.md` | los números que pueden cambiar; las reglas citan su **nombre** |
| `GALERIA.md` | los casos reales etiquetados — imágenes en `02_Assets\galeria\` |
| `CONTEXTUALIZACION.md` | lo que **NO es regla y no debe convertirse en regla** |
| `PENDIENTES.md` | lo abierto y las desviaciones conscientes respecto al curso |
| `CIERRE_FASE_1.md` | el acta de cierre de la fase 1 y sus cuatro huecos declarados |
| `HISTORIAL.md` | la historia del plan: versiones, cambios con su fecha, pendientes cerrados, notas de construcción |

## Siguiente

🚧 **Fase 2 en curso — el portal web**, en `04_Web\`, construido desde Claude Code contra `reglas.json`. Instrucciones en `CLAUDE.md` (raíz) y `04_Web\CLAUDE.md`. Lo que queda por hacer está en `tasks/current.md`, en la raíz del repositorio (desde el 25/09/2026, D-028).

**Aplazado, con fecha por decidir:** la capa de contextualización · el backtesting de un año · el bot de NinjaTrader · el test ciego, que puede ejecutarse **contra el portal**.

## Reglas permanentes del proyecto

1. El auditor no conoce el método. Todo sale de las respuestas del operador.
2. Ningún adjetivo se acepta como regla. Sin número → `PENDIENTE`.
3. Coach estricto: parar contradicciones e intuiciones disfrazadas de regla.
4. No se escribe código.
5. Entrevista: máx **2 preguntas** por turno → ficha → `confirmado` → escritura.
6. Nada se escribe en `01_Plan\` sin confirmación.

---

## Dónde está el historial

**Aquí queda solo el estado de hoy.** Todo lo que pasó —las versiones, las correcciones de reglas y las decisiones fechadas, los pendientes cerrados— vive en **`HISTORIAL.md`**; la bitácora de la fase 1, las 11 sesiones revisadas vela a vela y la equivalencia de numeración, en **`_Historia\`**.

> No hace falta abrirlos para trabajar. Solo para saber **por qué** una regla dice lo que dice
> —y para eso suele bastar con el apartado «Por qué» de esa regla, en `reglas/`.
