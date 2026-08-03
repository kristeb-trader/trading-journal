# Plan — Rediseño del checklist y de la métrica de disciplina

> **Estado: IMPLEMENTADO (3 de agosto de 2026).** Las 5 fases están aplicadas.
> Queda **recompilar `ChecklistChaumer` en NinjaTrader** para que la Fase 4 surta efecto.
>
> Este documento conserva el diagnóstico y las decisiones. Para saber **cómo funciona
> hoy** el cálculo, ver `docs/Disciplina.md`.
>
> | Fase | Estado | Commit |
> |---|---|---|
> | 1 · Base de datos | ✅ | `753d51b` |
> | 2 · Cálculo (`db.js`) | ✅ | `2427888` |
> | 3 · Web | ✅ | `06e42bd` |
> | 4 · AddOn NT8 | ✅ código · ⏳ **falta recompilar** | `ec2af13` |
> | 5 · Coach y docs | ✅ | `e183416` + este |
>
> **Resultado medido:** la disciplina global **subió de 81% a 83%**, no bajó como se
> preveía. Al evaluar solo cuando hay algo que cumplir desaparecen tanto los aprobados
> gratis (casillas siempre en `true`) como los suspensos gratis (reglas contadas en días
> sin riesgo). Detalle por mes en `docs/Disciplina.md`.

---

## 1. Por qué

La pregunta que lo destapó todo: *"¿por qué junio tiene 95% de disciplina con 32% de días con errores?"*

La respuesta corta es que **la métrica no mide lo que dice medir**. Mide si se marcaron
casillas, no si se operó según el plan. Cuatro defectos, todos verificados con datos:

**1.1 El checklist no es un compromiso previo, es un recuerdo.**
Solo **10 de 126 sesiones** tienen `checklist_go_at` (el GO sellado antes de operar). El
92% se marcó después de conocer el resultado. Una casilla rellenada a posteriori no mide
disciplina: mide memoria y buena fe, con el sesgo obvio de que cuesta marcar ✗ en un día
que salió bien.

**1.2 Pregunta por cosas que los datos ya saben.**
`trades` tiene precios, horas, MAE y MFE al 100%. El stop máximo, la ventana de noticia y
el día FOMC son verificables sin preguntar nada.

**1.3 Diluye y no pondera.**
184 casillas en junio; un día entero echado a perder mueve la métrica menos de un punto.
Y "no mover el stop" pesa igual que "verifiqué la cuenta". El campo `peso` existe y está
en `1` en las 17 reglas.

**1.4 Es redundante con Errores.**
Desde junio, **el día que falla el checklist es exactamente el día que tiene errores**:
correspondencia 1 a 1, sin excepciones en junio ni julio. Dos métricas midiendo lo mismo
en escalas distintas, dando números que parecen contradecirse.

**1.5 Y obligaba a elegir entre disciplina y ejecución.**
El GO exigía marcar las 13 casillas, incluidas las que describen hechos que **aún no han
ocurrido** (rompimiento, consecución). O se marcaba en falso, o se perdía el trade.
Este fue el hallazgo del propio Kris y es el que más cambia el diseño.

### Lo que la métrica actual esconde

| Mes | Disciplina (ítems) | Días perfectos |
|---|---|---|
| Febrero | 75% | 16% |
| Marzo | 64% | 5% |
| Abril | 70% | 14% |
| Mayo | 90% | 45% |
| Junio | 95% | 68% |
| Julio | 99% | 94% |

La columna de la izquierda es plana y siempre alta. La de la derecha (**16% → 94%**) es la
evolución real del año.

---

## 2. Qué es la disciplina — definición de trabajo

> **Disciplina es la distancia entre lo que el plan dice y lo que los datos muestran que
> se hizo.**

Es una medida de **adherencia**, no de resultado. Un trade puede ser perfectamente
adherente y perder (pérdida sana, coste del negocio), y puede violar todo el plan y ganar
(el caso más peligroso: el mercado premia el mal hábito).

Para que una medida de adherencia sea válida necesita tres cosas:

1. Un **plan explícito y anterior** → el rulebook, sellado con `checklist_go_at`
2. Una **ejecución observable** → los trades
3. Una **comparación objetiva** entre ambos → *esto es lo que hoy no existe*

### Tres niveles de confianza

No se trata de sustituir el checklist por datos, sino de saber **cuánto de la disciplina
está probada y cuánto solo declarada**:

| Nivel | Fuente | Se puede maquillar |
|---|---|---|
| ⚙️ **Verificado** | Dato del trade | No |
| 🔍 **Contrastado** | El Coach lo desmiente (error → regla) | Difícil |
| ✋ **Declarado** | La casilla del trader | Sí |

El objetivo del rediseño es mover el máximo de reglas hacia arriba, **sin eliminar el
checklist**: sigue siendo la única fuente para todo lo que es juicio técnico sobre el
gráfico, y su mayor valor no es el porcentaje que produce sino que obliga a parar antes
de entrar.

---

## 3. El checklist rediseñado

**13 reglas** (antes 17). El GO exige **8 clics** (antes 13).

| # | Regla | Fase | Tipo | Bloquea GO |
|---|---|---|---|---|
| 1 | Calendario económico revisado | 1 | ✋ | 🔒 |
| 2 | Zonas vigentes marcadas | 1 | ✋ | 🔒 |
| 3 | Cuenta correcta verificada | 1 | ✋ | 🔒 |
| 4 | Contexto / tendencia a favor *(IRI)* · 2º intento a zona *(Rei)* | 2 | ✋ | 🔒 |
| 5 | Impulso no sobreextendido *(IRI)* · Consecución fallida *(Rei)* | 2 | ✋ | 🔒 |
| 6 | Estructura I-R-I fluida *(IRI)* · Vela de reingreso *(Rei)* | 2 | ✋ | 🔒 |
| 7 | Target sin zonas en contra | 2 | ✋ | 🔒 |
| 8 | Orden precolocada | 2 | ✋ | 🔒 |
| | **▶ GO** | | | |
| 9 | Rompimiento + consecución *(IRI)* · Vela de consecución *(Rei)* | 2b | ✋ | — |
| 10 | Stop máximo 80 puntos | 3 | ⚙️ | — |
| 11 | No mover target/stop | 3 | ✋ | — |
| 12 | No entrar en ventana de noticia | 3 | ⚙️ | — |
| 13 | Día FOMC: solo reingresos | 3 | ⚙️ | — |

### El eje nuevo: antes / después del GO

El checklist tiene **dos ejes**, no uno:

- **Fase del proceso** (pre-sesión → lectura → gestión) — conceptual, ya existía
- **Momento respecto al GO** (antes / después) — operativo, **no existía**

El GO se da cuando el rompimiento está identificado y la orden lista. Todo lo que
describe hechos posteriores (la consecución, el stop real, la gestión) se resuelve
después: tres reglas solas y dos con el trade ya en marcha.

---

## 4. Cambios regla por regla

### 4.1 Reglas que SALEN del checklist

| Código | Motivo |
|---|---|
| `rr_1a1` | Pasa a Filosofía. Ya está descrita en `fil_4` (Mecánica de Entrada). Decisión de Kris: quitar ruido, dejar solo lo esencial |
| `no_fomc` | **Se archiva.** Decía *"preferencia: no operar en día FOMC, regla blanda a criterio del trader"* y **contradice** a la regla real. El Coach la trataba como grave mientras el rulebook la llamaba opcional |

### 4.2 Regla NUEVA

| | |
|---|---|
| **Código** | `fomc_solo_reingreso` |
| **Título** | Día FOMC: solo reingresos |
| **Enunciado** | En días de FOMC no se toman entradas tendenciales. Solo se permite el setup de Reingreso. |
| **Capa / tipo** | riesgo · **dura** |
| **Fase** | 2 · Lectura del setup |
| **Verificación** | ⚙️ automática — `catalogo_fechas.tipo='fomc'` + familia del setup operado |
| **Aplica si** | `dia_fomc` **y** hubo operativa |

Estaba escrita en `fil_1` (*"Día Fed/Powell/FOMC → solo reingresos, NUNCA entrada
tendencial"*) pero enterrada en un texto de filosofía, fuera del checklist. **Nunca se
preguntó.**

**Decisión de Kris:** aplica a *cualquier* fecha con `tipo='fomc'`, sin importar el nombre
del evento (Day 1, Day 2 o Minutes). Él se encarga de que el catálogo esté bien cargado.

**Violaciones históricas que detecta:**

| Día | Evento | Setup operado | Resultado |
|---|---|---|---|
| 18-mar-2026 | FOMC Day 2 | IRI Continuación Bajista | −$125,60 |
| 17-jun-2026 | FOMC Meeting | IRI Apertura Bajista | −$146,80 |
| 8-jul-2026 | FOMC Minutes | IRI Apertura Alcista | −$381,06 |
| | | | **−$653,46** |

Tres violaciones, tres pérdidas, ninguna ganó. La del 18-mar **nunca se detectó**: no
existía la regla y el Coach no la registró.

### 4.3 Las dos reglas de noticias — estaban cruzadas

Los enunciados estaban **intercambiados**: `chk_calendario` llevaba el texto de
`chk_noticias` y viceversa. Además ambas estaban en Fase 1, cuando son de momentos
distintos.

| | `chk_calendario` | `chk_noticias` |
|---|---|---|
| **Título** | Calendario económico revisado | No entrar en ventana de noticia roja |
| **Enunciado** | Revisar Forex Factory y registrar las noticias rojas del día con su hora. Si no hay ninguna, se marca igual. | No abrir posición en los ±5 min alrededor de una noticia roja. **Estar ya dentro es válido.** |
| **Fase** | 1 | **3** *(hoy mal en Fase 1)* |
| **Tipo** | ✋ declarado | ⚙️ **automático** |
| **Aplica si** | Todo día conectado | `hay_noticia` **y** hubo operativa |

**Decisiones de Kris:** solo noticias **rojas** · margen fijo de **5 minutos** · estar
dentro de una posición cuando sale la noticia **es válido** (la regla es sobre la entrada).

**La casilla de `chk_noticias` desaparece como casilla.** No se marca: se calcula. En vivo
el AddOn muestra el semáforo y bloquea el GO; después, el sistema deduce el resultado
comparando `entry_time` con cada ventana. Si el dato es erróneo se corrige **la noticia**,
no la casilla.

**Cuándo se evalúa** — y esto es clave para que el número signifique algo:

| Situación | ¿Se evalúa? |
|---|---|
| Hubo noticia **y** operó | ✅ Sí |
| Hubo noticia y no operó | ➖ N/A |
| No hubo noticia | ➖ N/A |
| No operó | ➖ N/A |

Si contara los días sin noticia como "cumplida", saldría al 99% siempre y no diría nada.

### 4.4 Solapes corregidos (reediciones de texto, sin fusionar ni eliminar)

| Regla | Cambio |
|---|---|
| `chk_no_mover` | Enunciado propio: *"Una vez colocada la orden, no se mueve el stop ni el target, pase lo que pase."* (hoy su enunciado es su propio título) |
| `chk_estructura` | Quitar *"(consecución)"* → *"Impulso 1 → Retroceso → Impulso 2, estructura fluida y proporcionada"* |
| `chk_consecucion` | Quitar la mecánica de la orden (que es de `chk_orden`) → *"Tras el retroceso, el precio rompe la zona (alto/bajo del impulso 1)"* |
| `rei_zona` | Recortar a su paso → *"El precio llega por 2ª vez a una zona importante"* (hoy describe el setup entero y se traga los pasos 2 y 3) |
| `chk_5velas` | Renombrar a **"Impulso no sobreextendido"**, sin el `(<5 velas)`. El enunciado es bueno y detallado; el título prometía un umbral que el propio enunciado desmiente |

### 4.5 Reglas que se mueven de fase

| Regla | De | A | Motivo |
|---|---|---|---|
| `chk_orden` | 3 | **2** | La orden se precoloca *antes* del GO |
| `chk_noticias` | 1 | **3** | Es una restricción de ejecución, no de preparación |

### 4.6 Lo que NO se añade — y por qué

Se evaluaron cuatro candidatas de la capa filosofía. **Ninguna entra**, por decisión de
Kris:

| Candidata | Decisión |
|---|---|
| Target supera máx/mín de premercado | Ya cubierta por *"Target sin zonas en contra"* |
| Target debe superar la zona crítica de apertura | Ya cubierta por *"Target sin zonas en contra"* |
| Esperar una corrida completa antes de evaluar | Ya cubierta por *"Estructura I-R-I fluida"* |
| Máximo de trades por día | **A Filosofía**, no es regla de checklist |

> ⚠️ **Consecuencia asumida:** al no ser regla, el máximo de trades por día **deja de
> contar en la disciplina** — y es el fallo verificable más frecuente del histórico
> (5 veces: 1 en marzo, 2 en mayo, 2 en junio). Se puede seguir vigilando como estadística
> informativa en el dashboard (`objetivos.max_trades_dia = 1`), pero no penaliza.

---

## 5. Modelo de datos

### 5.1 Campos nuevos en `catalogo_reglas`

| Campo | Tipo | Para qué |
|---|---|---|
| `bloquea_go` | boolean | `true` = hay que marcarla para dar GO (las 8 primeras) |
| `aplica_si` | text | Condición de contexto: `siempre` (default) · `dia_fomc` · `hay_noticia` |

**`aplica_si` no es un parche para FOMC.** Hoy una regla se filtra por *fase* y por
*familia de setup*; le falta el tercer eje: **contexto del día**. Lo necesitan tanto la
regla FOMC como la de noticias. Valores cerrados, sin inventar un lenguaje de condiciones.

### 5.2 Campos existentes que se empiezan a usar

| Campo | Hoy | Después |
|---|---|---|
| `evidencia` | vacío en las 17 | `auto` / `declarada` — de dónde sale la respuesta |
| `campo` | vacío en las 17 | Qué dato la verifica (ej. `trades.mae`) |
| `peso` | `1` en las 17 | Reservado para ponderar por gravedad (**fuera de este plan**) |

### 5.3 Tabla nueva `sesion_noticias`

```sql
CREATE TABLE sesion_noticias (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sesion_date date NOT NULL REFERENCES sesiones(sesion_date) ON DELETE CASCADE,
  hora        time NOT NULL,
  nombre      text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (sesion_date, hora)
);
```

Sin columna de impacto (solo rojas) ni de margen (fijo 5 min), según lo acordado.

**Por qué hace falta:** hoy `sesiones.hora_noticia_roja` es un texto con una sola hora
—las 8 sesiones que lo tienen usan una— y `NULL` significa a la vez *"no había noticias"*
y *"no lo revisé"*. Tampoco guarda **qué** noticia era, que es lo que permitiría analizar
después qué tipo hace más daño.

Con el modelo nuevo los tres estados quedan separados:

| Situación | Cómo se ve |
|---|---|
| Revisé y no había | `chk_calendario` ✓ + 0 filas |
| Revisé y hay dos | `chk_calendario` ✓ + 2 filas |
| No lo revisé | `chk_calendario` ✗ |

La casilla del checklist hace de flag; **no hace falta columna nueva en `sesiones`**.

> ⚠️ **Trigger de sincronía obligatorio.** El Worker `/api/session` **no está versionado**
> y escribe en `sesiones.hora_noticia_roja`. Igual que se hizo con `setup`/`setup_codigo`,
> hay que mantener esa columna sincronizada desde `sesion_noticias` para no romperlo en
> silencio. Y como allí se aprendió: **el trigger debe comparar contra `OLD`**, o revierte
> los cambios que manden Worker y bot.

---

## 6. Verificación automática

Las tres reglas ⚙️ dejan de leerse de `sesion_checklist` y se calculan al vuelo (nada que
guardar, nada que pueda quedar desincronizado):

| Regla | Cómo se calcula | Cuidado |
|---|---|---|
| **Stop máximo 80 pts** | `MAE ÷ ($/punto × contratos)` | **$/punto según instrumento: MNQ = $2, NQ = $20.** Normalizar mal infla el resultado ×10 |
| **No entrar en ventana** | `entry_time` contra cada fila de `sesion_noticias`, ±5 min | Solo sobre la **entrada**; estar dentro es válido |
| **Día FOMC: solo reingresos** | `catalogo_fechas.tipo='fomc'` + familia del setup | Cualquier nombre de evento |

**Estado actual medido con estas reglas:**

- Stop ≤ 80 pts → **89 de 90 trades** cumplen. MAE medio **31,4 puntos**. Única violación:
  6-feb con 96,5 puntos.
- Ventana de noticia → solo 4 trades evaluables (falta el dato en el 96% de las sesiones);
  los 4 cumplen.
- FOMC → 3 violaciones (ver 4.2).

> La verificación automática **confirma** la disciplina de riesgo, no la desmiente. Es una
> buena noticia que la métrica actual no estaba dando.

### Nota sobre el límite de pérdida diaria

`objetivos.limite_perdida_dia = $150` quedó obsoleto: **el riesgo se mide en puntos, no en
dólares.** Un stop de 80 puntos cuesta entre $200 y $800 según los contratos, así que la
regla en dólares es imposible de cumplir y marcaba en rojo días perfectos (julio: 5 de 9
"fallaban" por esto, cuando en puntos era 9 de 9).

**Propuesta:** el límite en dólares deja de ser regla de proceso y pasa a ser **control de
capital en el Apex Tracker**, que es donde tiene sentido (drawdown de la cuenta). No entra
en este plan; queda anotado.

---

## 7. Plan de implementación

### Fase 1 — Base de datos
- Editar enunciados y fases de las 5 reglas de 4.4 y las 2 de 4.5
- Corregir los enunciados cruzados de `chk_calendario` / `chk_noticias`
- Crear `fomc_solo_reingreso`
- Archivar `rr_1a1` (a Filosofía) y `no_fomc` (soft-delete: `activa=false`)
- Añadir el máximo de trades/día al texto de Filosofía
- Campos `bloquea_go` y `aplica_si` + rellenar `evidencia` y `campo` en las 13
- Tabla `sesion_noticias` + trigger de sincronía + migrar las 8 horas actuales

### Fase 2 — Cálculo (`db.js`)
- `discFactorAplica` entiende `aplica_si` (contexto del día)
- Las 3 reglas ⚙️ se resuelven por dato, no por `sesion_checklist`
- `enVentanaNoticia` pasa a leer de `sesion_noticias`
- Normalización correcta de MAE por instrumento y contratos

### Fase 3 — Web
- **Registrar sesión** (`form.js`): lista de noticias (hora + nombre); checklist reordenado
  con separador visual del GO; ítems ⚙️ en solo lectura con su resultado
- **Modal del día** (`app.js`): noticias del día y marca del trade que cayó en ventana
- **Dashboard** (`disciplina.js`) y **card** (`metrics.js`): heredan el cálculo

### Fase 4 — AddOn NT8 (`ChecklistChaumer.cs`) — **requiere recompilar**
- GO exige solo las 8 con `bloquea_go`
- Las post-GO quedan marcables después de entrar
- Lista de noticias con alerta de la próxima ventana y bloqueo del GO dentro de ella

### Fase 5 — Coach y documentación
- Prompt con las reglas nuevas y los códigos actualizados
- Re-vincular los 2 errores "FOMC" a `fomc_solo_reingreso`
- Actualizar `Disciplina.md`, `CLAUDE.md` e `historial-proyecto.md`

---

## 8. Impacto esperado

| | Antes | Después |
|---|---|---|
| Reglas del checklist | 17 | **13** |
| Clics para el GO | 13 | **8** |
| Reglas verificadas por dato | 0 | **3** |
| Reglas que obligan a marcar hechos futuros | 2 | **0** |

> ⚠️ **La disciplina histórica se va a mover.** Las reglas condicionales dejan de contar
> los días sin riesgo (denominador menor), salen dos reglas y entra una nueva que detecta
> 3 violaciones no registradas. El número resultante será **más bajo y más honesto**.
> Conviene anotar los valores previos antes de aplicar, para poder comparar.

---

## 9. Fuera de alcance (anotado para después)

- **Ponderar por gravedad** (`peso`): que las reglas duras que cuestan dinero pesen más
- **Unidad de medida por día** en vez de por casilla, para que Disciplina y Errores
  compartan escala
- **Exigir GO previo**: que un día sin `checklist_go_at` no cuente como "proceso declarado"
- **El Coach evaluando el gráfico regla por regla** — la palanca de mayor impacto: ya
  recibe la imagen del día, y las reglas de estructura (consecución, IRI, sobreextensión,
  zonas) son verificables mirándola. Subiría ~6 reglas de "declarada" a "contrastada" y
  dejaría la parte no verificable del plan por debajo del 25%
- **Límite de pérdida diaria en dólares** → al Apex Tracker como control de capital
- **Máximo de trades/día** como estadística informativa en el dashboard

---

## 10. Decisiones tomadas en esta sesión

| # | Decisión |
|---|---|
| 1 | Tabla nueva para noticias · solo rojas · margen fijo 5 min |
| 2 | Estar dentro de una posición cuando sale la noticia **es válido**; solo es inválido entrar en la ventana |
| 3 | En día FOMC solo se opera Reingreso — aplica a cualquier evento con `tipo='fomc'` |
| 4 | Archivar `no_fomc` |
| 5 | `rr_1a1` sale del checklist → Filosofía |
| 6 | El GO va **dentro** de la Fase 2, no al final del checklist |
| 7 | Reingreso: los 3 primeros pasos antes del GO, la vela de consecución después |
| 8 | `chk_cuenta_pa` se mantiene en Fase 1 tal como está |
| 9 | `chk_5velas` → "Impulso no sobreextendido" |
| 10 | No se añaden reglas nuevas de la filosofía: ya están cubiertas |
| 11 | Máximo de trades/día → Filosofía, no checklist |
