# CIERRE DE LA FASE 1

**Fecha:** 2026-09-01 · *revisado el 06/09/2026: sale el NQ, se renumeran las reglas y el documento maestro se reorganiza por categorías. Ninguna regla cambia.*
**Decisión:** del operador (Christian), explícita.
**Estado del plan hoy:** `TRADING_PLAN_CHAUMER.md` **v3.1** · **38 reglas** · **12 sub-fases** · **7 categorías**

---

## Qué se cierra

La fase 1 tenía un objetivo: **traducir la metodología Chaumer a reglas mecánicas, medibles y sin adjetivos**, de forma que un tercero pudiera ejecutarlas sin interpretar nada.

Ese objetivo está cumplido en lo que se refiere a **escribir** las reglas.

| | |
|---|---|
| Sub-fases cerradas | **12 de 12** |
| Reglas confirmadas | **38** |
| Términos con definición medible | 23 |
| Sesiones reales reconstruidas al tick y validadas por el operador | **11** — 6, 7, 8, 9, 10, 13, 14, 15, 16, 17 y 20 de julio de 2026 |
| Casos documentados en la galería | **21** |
| Elementos apartados a contextualización | 10 |
| Desviaciones inventariadas respecto del material original | 13 |

---

## Cómo se construyó — y por qué eso importa

Las reglas **no** salieron de una lectura del material. Salieron de un interrogatorio vela a vela sobre datos reales, en el que el operador corrigió al auditor decenas de veces. Las correcciones más grandes fueron éstas, y ninguna era evidente al leer el material original:

| Corrección | Qué decía antes | Qué dice ahora |
|---|---|---|
| Rompimiento | se leía por **cierre** | se lee por **mecha** — un solo tick basta |
| Cancelación de la orden | se cancelaba por **retroceso nuevo**, no por plazo | exactamente al revés: **5 velas sin consecución, o volver al punto del stop** |
| Traspaso de una zona | tenía plazo de 5 velas | **no tiene plazo** — la consecución puede llegar 25 velas después |
| Stop | se medía sobre el retroceso que originó la zona | **el extremo alcanzado desde que nació la zona** |
| Reingreso | valía en cualquier momento | **es inmediato o no es** |
| Sesgo de apertura | la vela de apertura sesgaba la jornada | **no sesga** — se opera en los dos sentidos |
| Zonas entre zonas | una por banda, sin límite de bandas | **una sola por banda y por jornada**, la del primer retroceso, y la banda queda cerrada aunque no se marque |

> 🔑 **Ese historial es el argumento de fondo para no dar el plan por probado.** Si siete lecturas razonables resultaron ser lo contrario de la verdad, la única defensa es la verificación externa — que es justo lo que no se ha hecho.

---

## 🚨 Lo que queda FUERA del cierre — cuatro huecos declarados

Ninguno de estos cuatro puntos es un olvido. Los cuatro se cierran **sabiendo** que están abiertos.

### 1 · El test ciego no se ejecutó · `F1.11` · `P-29`

Era la única prueba que separa *"el plan está escrito"* de *"el plan está probado"*: diez gráficos que el auditor no haya visto etiquetados, aplicar el plan tal como está escrito, comparar con lo que hizo el operador, y exigir **9 de 10** coincidencias.

**No se hizo.** Por lo tanto:

- No hay ninguna medida de si el documento es **auto-suficiente**.
- Todo lo validado hasta ahora se validó **con el operador delante**, corrigiendo. Eso demuestra que las reglas describen lo que él hace; no demuestra que otra persona llegue solo con el texto.

### 2 · No hay regla de parada · `P-21`

El plan dice cuánto se arriesga por operación (**1 MNQ**, tope de **80 puntos**) y cuántas operaciones por sesión (**1**). **No dice cuándo se deja de operar** en la semana o en el mes. Con 80 puntos de tope sobre una cuenta objetivo de $3.000, cada operación arriesga el **5,3 %** del capital y cuatro sesiones perdedoras seguidas son un **−21 %**.

Es una decisión consciente del operador: resolverlo con datos reales. Hasta entonces, **el plan no tiene freno**.

### 3 · Falta toda la capa de contextualización

Diez elementos quedaron fuera del plan mecánico a propósito, porque el operador dijo que no tienen número: sobreextensión, lateralidad, fluidez, alejamiento de la zona, longitud del recorrido, tamaño de la estructura, favorabilidad del sentido de la apertura, y otros. Viven en `CONTEXTUALIZACION.md`.

**No son adorno.** En las sesiones grabadas de Chaumer, la contextualización decidió **2 de 4 días** de "hoy no opero". Un ejecutor que aplique solo las reglas mecánicas operará días que el operador no operaría.

### 4 · Las cifras del backtesting no son válidas como resultado · `P-27`

| Día | Setup | Resultado | Puntos |
|---|---|---|---|
| 6 jul | Reingreso corto | STOP | −58,75 |
| 7 jul | IRI corto | STOP | −56,50 |
| 8 jul | — FOMC | NO OPERA | — |
| 9 jul | IRI largo | STOP | −59,75 |
| 10 jul | IRI largo | STOP | −53,50 |
| 13 jul | Reingreso corto | TARGET | +28,50 |
| 14 jul | — descartes por tope de stop | NO OPERA | — |
| 15 jul | IRI corto | TARGET | +56,25 |
| 16 jul | IRI corto | TARGET | +75,50 |
| 17 jul | IRI corto | STOP | −77,25 |
| 20 jul | IRI corto | TARGET | +54,50 |
| | | **Total 9 operaciones** | **−91,00 pts** |

**Estas cifras NO miden la estrategia.** Motivos, todos estructurales:

1. **Nueve operaciones no dicen nada** estadísticamente.
2. **Las reglas cambiaron durante la propia revisión** — los primeros días se leyeron con reglas que después resultaron ser incorrectas.
3. **No hay filtro de noticias rojas** (`P-27`). Ninguna operación se descartó por noticia.
4. **No hay capa de contexto**, que es la que quita varios de estos días.

> 🔴 **Cualquier producto que muestre estos números debe mostrar también estos cuatro motivos, en la misma pantalla.**

---

## 🔧 Una regla llegó después del cierre… y era un duplicado

El mismo 01/09/2026, ya cerrada la fase, el operador precisó al dibujar los diagramas de la zona apéndice que **el plazo de 5 velas es un tope, no una espera obligatoria**: si antes el mercado arma una estructura completa en sentido contrario, la geometría se resuelve ahí. Se escribió como `R-39` — y el **04/09/2026 se descubrió que `R-14`, confirmada el 24/08, ya decía exactamente eso**. `R-39` se eliminó y su definición medible se fusionó dentro de `R-14`. El plan vuelve a **38 reglas**.

**Vale la pena registrar lo que esto significa**, sin dramatizarlo y sin taparlo: el plan estaba en cero reglas movidas durante dos días, y aun así una conversación de dibujo destapó una precisión que no estaba escrita. No invalida el cierre — la regla no contradice ninguna otra, las amplía — pero **es exactamente el tipo de hallazgo que un test ciego habría buscado a propósito**.

- **Consecuencia pendiente:** el motor de auditoría (`05_Backtesting\lector.py`) todavía resuelve el plazo solo por vencimiento. Hay que actualizarlo y volver a pasar las 11 sesiones para ver si alguna zona cambia de fecha de nacimiento. Ninguna operación de las validadas depende de esto, pero conviene comprobarlo. Ver `P-31`.

---

## La señal de convergencia — por qué se cierra ahora y no antes

Se llevó la cuenta de cuántas reglas hubo que **cambiar, añadir o corregir** en cada día revisado:

```
6 jul  ███ 1        13 jul █████████ 3
7 jul  █████████ 3  14 jul ███ 1
8 jul  █████████ 3  15 jul  0
9 jul  ██████ 2     16 jul ██████ 2
10 jul ██████ 2     17 jul ███ 1
                    20 jul  0
```

El plan **dejó de moverse**: de dos y tres reglas por día al principio, a cero en el 15 y en el 20 de julio. En el 20 de julio la única duda del operador —dos soportes casi pegados— se resolvió **aplicando reglas ya escritas**, sin tocar ninguna.

Ése es el argumento a favor de cerrar. Es un argumento razonable y **no es lo mismo que un test ciego**: mide que el auditor y el operador ya coinciden, no que el documento se sostenga solo.

---

## Reglas permanentes del proyecto — siguen vigentes en la fase 2

1. **Nadie conoce la metodología salvo el operador.** Todo sale de sus respuestas. No se completa con price action genérico.
2. **Ningún adjetivo se acepta como regla.** Sin número → `PENDIENTE`.
3. **Se para al operador** ante contradicciones, intuiciones disfrazadas de regla y condiciones no verificables en tiempo real.
4. **No se escribe código operativo.** Los scripts de `05_Backtesting\` son **herramientas de auditoría**, nunca herramientas de operación.
5. Nada se da por bueno sin el visto bueno explícito del operador.

---

## Qué se lleva la fase 2

| Documento | Para qué sirve en el portal |
|---|---|
| `reglas.json` | **fuente de verdad legible por máquina** — 38 reglas con sus condiciones medibles |
| `TRADING_PLAN_CHAUMER.md` | texto largo, razonamiento y casos de cada regla |
| `GLOSARIO.md` | vocabulario con definición medible |
| `PARAMETROS.md` | los números que pueden cambiar, en un solo sitio |
| `CHECKLIST_DIARIA.md` | la secuencia del día, para ejecutar sin decidir |
| `GALERIA.md` | 21 casos reales etiquetados |
| `PENDIENTES.md` | lo que sigue abierto — **debe verse en el portal** |
| `CONTEXTUALIZACION.md` | lo que NO es regla y no debe convertirse en una |
| `ESTADO.md` | registro cronológico de cómo se llegó hasta aquí |

**Instrucciones de traspaso:** `..\CLAUDE.md` y `..\04_Web\BRIEF_PORTAL.md`.
