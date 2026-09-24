# Proyecto Chaumer

Metodología de trading de Alfredo Chaumer para **MNQ** en NinjaTrader 8, traducida a un plan mecánico de **40 reglas medibles**. Operador: **Christian**. Uso personal.

**Fase 1** 🏁 cerrada (el plan) · **Fase 2** 🚧 en curso (el portal, en `04_Web\`) · 🔴 **TEST CIEGO EN MARCHA** desde el 14/09/2026 — protocolo en `05_Backtesting\test_ciego\LEEME_BACK_DIARIO.md`.

---

## 🔴 Las cinco reglas del proyecto — no se negocian

1. **No inventes metodología.** Ninguna regla ni umbral sale de price action genérico. Si algo falta, **falta**: se marca pendiente, no se rellena.
2. **Ningún adjetivo es una regla.** "Fuerte", "sano", "claro" no valen. Solo ticks, puntos, porcentajes, número de velas y horas exactas.
3. **No se cambia una regla confirmada** sin pedírselo al operador y esperar su sí.
4. **Los scripts de `05_Backtesting\` son de auditoría**, nunca de operación.
5. **Los huecos declarados quedan escritos en el plan.** El plan está escrito y contrastado, **no probado**: el test ciego nunca se ejecutó, no hay regla de parada, falta la capa de contexto, y las cifras del backtesting no miden la estrategia. Viven en `01_Plan\PENDIENTES.md` y en `01_Plan\CIERRE_FASE_1.md`, y **de ahí no se borran**.
   🔸 *El **portal** no tiene que enseñarlos — decisión del operador, 07/09/2026. Es su herramienta personal, no un producto. Lo único que sigue en pie: si algún día el portal muestra la cifra del backtesting (**−91,00 pts**), los cuatro motivos van en la misma pantalla.*

---

## Quién hace qué

| Cowork (chat) | Claude Code (en `04_Web\`) |
|---|---|
| Las reglas y el plan · `01_Plan\` | El código del portal |
| Los gráficos del método (PNG) | Maquetación, compilar, publicar |
| Auditar sesiones con los datos | **Nada de `01_Plan\`** |

`01_Plan\` es **de solo lectura desde el portal**. Si encuentras una contradicción, escríbela en `04_Web\PROPUESTAS_AL_PLAN.md` y avisa. No la corrijas tú.

---

## Dónde está la verdad, y qué leer para cada cosa

`01_Plan\reglas.json` es **la fuente de verdad legible por máquina**: 38 reglas ordenadas por grupo, con `categoria`, `categoria_nombre`, `categoria_orden` y —solo en zonas— `subcategoria` (`marcado` / `vigencia`). Siete grupos: perímetro (4) · estructura (4) · **zonas (14)** · setup y entrada (7) · riesgo y gestión (7) · filtros (3) · proceso (1).

| Si la tarea es… | Lee SOLO |
|---|---|
| una duda de una regla | `reglas.json`, **esa regla** |
| cambiar un número | `01_Plan\PARAMETROS.md` |
| una definición | `01_Plan\GLOSARIO.md` |
| el porqué de una regla | **su sección** en `01_Plan\TRADING_PLAN_CHAUMER.md` |
| la secuencia del día | `01_Plan\CHECKLIST_DIARIA.md` |
| qué falta / qué está abierto | `01_Plan\PENDIENTES.md` |
| casos reales | `01_Plan\GALERIA.md` |
| lo que NO es regla | `01_Plan\CONTEXTUALIZACION.md` |
| dónde estamos | `01_Plan\ESTADO.md` (la cabecera basta) |
| el portal | `04_Web\CLAUDE.md` |

> ⚠️ **No abras `TRADING_PLAN_CHAUMER.md` entero.** Son 29.000 tokens. Busca la sección de la regla.
> Si `reglas.json` y un `.md` se contradicen, **para y pregunta.** No elijas tú.

---

## Estándar visual — fijado por el operador

| | |
|---|---|
| Fondo | negro `#0B0E14` |
| Cuadrícula | **ninguna**. Sí la línea del eje horizontal y la vertical de precios (`#3A4256`) |
| Velas | 🔵 azul `#2E86FF` alcista · ⬜ blanca `#FFFFFF` bajista |
| Zonas | **todas del mismo gris** `#8B93A7` |
| Corridas y retrocesos | línea blanca en zigzag uniendo extremos |
| Puntos de referencia | flecha punteada **naranja oscuro `#FF9A3C`**, contraste bajo, extendida a la derecha. Roto: más tenue y cortado una vela después. **Solo se dibujan cuando hay un reingreso** |
| La operación | franja roja entrada→stop, verde entrada→objetivo, **solo sobre el tramo** |
| Líneas de entrada / stop / objetivo | **no se dibujan** |
| Otros | oro `#F5C542` · rojo `#FF5C5C` · verde `#4ADE80` · naranja `#FF9A3C` |

**Nada de tablas de datos donde quepa una gráfica.**

---

## Cómo hablarle al operador

- **Nunca uses códigos de regla** (`R-31`, `P-22`, `G-12`) al hablar. Son para los documentos.
- Máximo **2 preguntas por turno**.
- Corrige vela a vela. **Nada se da por bueno sin su visto bueno explícito.**
- Tiene contacto directo con Chaumer y le consulta cuando algo se traba.

---

## Vocabulario

**corrida / impulso** · **corrida fluida** *(la corrida deja su zona, el retroceso no se pasa, y la siguiente rompe — solo entonces se opera el rompimiento; R-40, 14/09/2026)* · **retroceso** · **zona** (soporte o resistencia) · **rompimiento** (pasar 1 tick del borde; **la mecha basta**) · **consecución** (pasar del extremo de la vela que rompió) · **traspaso** (rompimiento + consecución) · **zona apéndice** · **Continuación** *(el setup: alcista o bajista; se llamaba IRI hasta el 23/09/2026)* · **IRI** *(impulso–retroceso–impulso: la estructura sobre la que se construye la Continuación)* · **Reingreso** (inmediato o no es; alcista o bajista) · **punto de referencia** *(el nivel de referencia de cualquier retroceso vivo; tapa el objetivo del reingreso y muere por CIERRE, no por mecha — unificado 14/09/2026, absorbió al antiguo "punto de control")* · **inversión de papel** · **banda entre zonas**.

Definiciones medibles en `01_Plan\GLOSARIO.md`.

---

## Datos y motor

- `05_Backtesting\datos\NQ 09-26.Last.txt` — `yyyyMMdd HHmmss;o;h;l;c;v`, **en UTC**.
- **Horario:** el gráfico es hora Colombia (UTC−5). Ventana **08:31–10:30 Col = 13:31–15:30 UTC**.
- ⚠️ El plan opera **solo MNQ** desde el 06/09/2026. Los datos de backtesting son de **NQ** y así se quedan, por decisión del operador. No intentes arreglar esa diferencia.
- `lector.py` reproduce el marcado · `dia.py` genera la gráfica de una jornada. **Los dos son auditoría.**
