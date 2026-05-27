# Manual de Usuario — Trading Journal NQ Futures

**Versión:** 4.0  
**Fecha:** Mayo 2026  
**Autor:** Equipo Trading Journal

---

> ⚠️ **Este documento es editable — actualizalo cuando el sistema cambie.**

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Resumen de Componentes](#resumen-de-componentes)
3. [Módulo 1: Indicador NinjaTrader 8](#módulo-1-indicador-ninjatrader-8)
4. [Módulo 2: Dashboard Web](#módulo-2-dashboard-web)
5. [Módulo 3: Bot de Telegram](#módulo-3-bot-de-telegram)
6. [Módulo 4: Coach IA](#módulo-4-coach-ia)
7. [Rutina Diaria Recomendada](#rutina-diaria-recomendada)
8. [Preguntas Frecuentes (FAQ)](#preguntas-frecuentes-faq)
9. [Tarjeta de Referencia Rápida](#tarjeta-de-referencia-rápida)
10. [Glosario](#glosario)
11. [Historial de Versiones](#historial-de-versiones)
12. [Cómo Reportar Problemas o Sugerir Mejoras](#cómo-reportar-problemas-o-sugerir-mejoras)

---

## Introducción

### ¿Qué es el Trading Journal NQ Futures?

El Trading Journal NQ Futures es un sistema completo de registro y análisis de operaciones diseñado específicamente para traders de futuros NQ (Nasdaq). Su objetivo es simple: **ayudarte a mejorar como trader capturando automáticamente tus operaciones y permitiéndote reflexionar sobre ellas cada día.**

El sistema elimina el trabajo manual de anotar trades. Cuando cierras una operación en NinjaTrader 8, el sistema la registra automáticamente. Tú solo necesitas agregar el contexto del día: cómo te sentiste, qué setup usaste, qué salió bien y qué no.

### ¿Por qué ayuda llevar este diario?

Los estudios sobre traders rentables muestran consistentemente que **la reflexión diaria es uno de los hábitos más importantes** que separa a los traders consistentes de los que no lo son. Este sistema te da:

- **Registro automático:** tus trades llegan solos a la base de datos, sin que hagas nada.
- **Visión histórica clara:** calendario, gráficos, métricas mensuales y **resumen anual** que muestran patrones en tu trading.
- **Accountability con tus reglas:** un checklist de 6 reglas que se evalúa en cada sesión.
- **Resúmenes objetivos con IA:** el coach es estricto y directo — te dice lo que realmente pasó sin suavizar los errores.
- **Flexibilidad:** puedes registrar tu sesión desde el dashboard web o desde Telegram, lo que prefieras.

---

## Resumen de Componentes

El sistema tiene 7 piezas que trabajan juntas:

| Componente | Para qué sirve | Cuándo lo usas |
|---|---|---|
| **Indicador NT8** | Exporta trades automáticamente a la nube | Se configura una vez, trabaja solo |
| **Dashboard Web** | Ver métricas, calendario, galería, análisis, registrar sesión, ver resumen anual | Al final del día o cuando quieras revisar |
| **Bot de Telegram** | Registrar la sesión del día por chat | Al terminar de operar (desde notificación o con /sesion) |
| **Coach IA** | Diagnóstico inteligente 6 secciones, chat multi-turn, historial | Desde la sección Coach IA (cualquier fecha) |
| **Cloudinary** | Guardar imágenes de tus charts | Al subir capturas en el formulario |
| **Galería de Imágenes** | Ver miniaturas de tus capturas organizadas por semana | Al revisar tu historial visual |
| **Resumen Anual** | Ver KPIs, equity curve y tabla del año completo por cuenta | Al revisar tu desempeño global |

---

## Módulo 1: Indicador NinjaTrader 8

### ¿Qué hace este indicador?

El indicador corre en segundo plano dentro de NinjaTrader 8. Cada vez que cierras una operación, él la detecta automáticamente y la envía a la base de datos en la nube. No necesitas hacer nada manualmente.

**Fusión automática con ATM:** si operas 2 o más contratos usando ATM, el indicador espera 3 segundos acumulando todos los cierres y los publica como **un único trade consolidado**.

### Configuración inicial (se hace una sola vez)

1. Abre NinjaTrader 8.
2. Ve a **Tools → Import → NinjaScript Add-On** y selecciona el archivo del indicador.
3. Abre un gráfico del instrumento activo.
4. Clic derecho en el gráfico → **Indicators** → busca **SupabaseAutoExport** → doble clic.
5. En las propiedades, selecciona la cuenta que usas para operar NQ.
6. Haz clic en **OK**.

> 💡 **Tip:** Deja el gráfico con el indicador abierto mientras operas. Si cierras el gráfico, el indicador deja de enviar datos.

### Problemas comunes

| Problema | Solución |
|---|---|
| Los trades no aparecen | Verifica que el gráfico con el indicador esté abierto |
| Trades duplicados con ATM | Actualiza al indicador v2.1+ con fusión de 3 segundos |
| Aparece la cuenta equivocada | Clic derecho → Indicators → cambia la cuenta en propiedades |

---

## Módulo 2: Dashboard Web

### Cómo acceder

**https://kristeb-trader.github.io/trading-journal/**

Funciona en cualquier navegador moderno. También puedes instalarlo como **app en tu iPhone o Android** (en Safari: botón compartir → "Agregar al inicio"). La app en el teléfono se actualiza automáticamente cuando hay nuevas versiones.

Tiene **8 secciones** en la barra de navegación.

---

### Sección 1: Calendario

Un calendario mensual donde cada día con actividad tiene un color. Filtro de cuenta en la parte superior (por defecto PA-APEX).

**Colores del calendario:**

| Color | Significado |
|---|---|
| 🟢 Verde | Target alcanzado |
| 🔴 Rojo | Stop activado |
| 🟡 Amarillo | Sin entradas válidas |
| ⚫ Negro/gris | No operé |
| 🔵 Azul tenue | Festivo CME — mercado cerrado |
| 🟠 Ámbar/caramelo | Día FOMC (no operado) |

**Iconos en las celdas:**

| Icono | Posición | Significado |
|---|---|---|
| ⚠️ triángulo ámbar | Esquina superior derecha | Hubo casuísticas (errores tipificados) ese día |
| 🔺/🔻 flecha | Esquina inferior derecha | Dirección del trade (largo/corto) |
| 📊 ámbar pequeño | Esquina superior izquierda | Día FOMC pero sí operaste |

**Al hacer clic en un día** aparece un panel con 4 pestañas:
1. **Imagen** — la captura del gráfico (primera pestaña)
2. **Análisis** — contexto, setup, reflexión + resumen IA
3. **Checklist** — las 6 reglas con ✅/❌ y score del día
4. **Resumen** — lista de trades del día

---

### Sección 2: Métricas

KPIs de tu operativa. Siguen el mes del calendario y el filtro de cuenta.

| Métrica | Qué significa |
|---|---|
| P&L total | Ganancias/pérdidas en dólares |
| Win rate | Porcentaje de trades ganadores |
| Número de trades | Total de operaciones |
| Racha actual | Días seguidos ganando o perdiendo |
| Mejor/Peor día | Extremos del período |
| Disciplina | % de factores cumplidos (7 factores, **clickable**) |
| Error más frecuente | Casuística que más se repite |

**Disciplina — 7 factores:** 6 ítems del checklist + "sin errores de tipificación".
- 🟢 Verde: ≥ 80% | 🟡 Amarillo: 50-79% | 🔴 Rojo: < 50%

**Hacer clic en Disciplina** → modal con barras por factor y lista de días con fallos.

---

### Sección 3: Galería de Imágenes

Miniaturas de tus capturas, agrupadas por semana. Borde de color según resultado del día.

**Lightbox:** clic en cualquier miniatura → imagen a pantalla completa con flechas prev/next. Teclado: ← → para navegar, **Esc** para cerrar.

---

### Sección 4: Tabla de Trades

Todos tus trades en una tabla filtrable y buscable.

---

### Sección 5: Registrar Sesión

Esta es la sección más importante del uso diario.

**Campos del formulario:**

| Campo | Qué escribir |
|---|---|
| Contexto de mercado | Tendencia, volatilidad, rango del día |
| Corrida | Cuántas corridas identificaste |
| Velas | Número de velas del movimiento operado |
| Zonas en contra | ¿Había zonas de oferta/demanda en contra? |
| Setup | El setup que usaste |

**El Checklist de 6 Reglas:**

1. **Zonas vigentes verificadas** — Revisaste las zonas antes de operar.
2. **Orden precolocada a tiempo** — La orden estaba lista antes de que llegara el precio.
3. **Máx 5 velas en corrida** — La corrida tenía 5 velas o menos.
4. **Sin noticia roja activa** — No había noticias de alto impacto.
5. **Zona con rompimiento + consecución** — La zona cumplió la estructura.
6. **Estructura Impulso-Retroceso-Impulso** — El trade tenía la estructura IRI completa.

**Casuísticas:** errores específicos que tipificas en cada sesión. Permanecen visibles aunque marques "No operé hoy".

**Si no operaste — motivos disponibles:**

| Motivo | Cuándo usarlo |
|---|---|
| FOMC / Fed | La reunión de la Fed te hizo evitar el mercado |
| Festivo (mercado cerrado) | El mercado CME estaba cerrado ese día |
| Sin entradas válidas | No se presentó ningún setup válido |
| Noticia roja activa | Había un evento de alto impacto |
| Motivo personal | Razón personal |
| Otro | Cualquier otra razón |

**Notas adicionales:**
Campo de texto libre para apuntes extra, ideas para mañana, contexto adicional.

> Para el análisis detallado con IA, usá la sección **Coach IA** (ícono 🤖).

---

### Sección 6: Análisis

Seis gráficos que te dan una visión profunda de tu desempeño:

| Gráfico | Qué muestra |
|---|---|
| Curva de equidad | Tu P&L acumulado a lo largo del tiempo |
| Win rate semanal | Cómo varía tu porcentaje de éxito semana a semana |
| P&L por día de la semana | Si hay días donde sistemáticamente ganas o pierdes más |
| MAE vs MFE scatter | Relación entre pérdida máxima y ganancia disponible en cada trade |
| Distribución de resultados | Donut: proporción de días ganadores, perdedores y neutros |
| Disciplina por sesión | Cuántas reglas cumpliste en cada sesión a lo largo del tiempo |

---

### Sección 7: Resumen Anual

Vista consolidada de todo un año de trading. Perfecta para la revisión mensual y el cierre de año.

**¿Cómo acceder?**
Haz clic en el ícono 📆 (calendario con estadísticas) en la barra de navegación.

**¿Qué muestra?**

```
◀ 2026 ▶    [Cuenta: PA-APEX ▼]    Capital inicial: $__________

KPIs del año:
┌──────────┬────────┬──────────┬────────────┬─────────┬──────────┐
│ P&L TOTAL│ TRADES │ WIN RATE │ PROFIT FAC.│ MAX DD  │ DISCIPL. │
│  +$2,340 │  248   │   61%    │    2.3x    │  -$450  │   78%    │
└──────────┴────────┴──────────┴────────────┴─────────┴──────────┘
  MEJOR MES: Marzo +$620    PEOR MES: Enero -$180

[Equity Curve del año — línea de P&L acumulado]
[P&L por mes — barras verdes y rojas]

Tabla mensual:
┌──────────┬─────────┬──────────┬──────────┬──────────┬───────┬────┐
│ Mes      │ P&L     │ Acumulado│ Rentab.  │ Efectiv. │ Disc. │ #  │
├──────────┼─────────┼──────────┼──────────┼──────────┼───────┼────┤
│ Enero    │ -$180   │  -$180   │  -1.8%   │  45% 🟡  │  72%  │ 20 │
│ Febrero  │ +$340   │  +$160   │  +3.4%   │  63% 🟢  │  85%  │ 18 │
│ ...      │         │          │          │          │       │    │
├──────────┼─────────┼──────────┼──────────┼──────────┼───────┼────┤
│ TOTAL    │ +$2,340 │    —     │ +23.4%   │  61% 🟢  │  78%  │248 │
└──────────┴─────────┴──────────┴──────────┴──────────┴───────┴────┘
  ↑ Fila de totales con celdas coloreadas (verde/rojo/amarillo)
```

**Columnas de la tabla:**

| Columna | ¿Qué muestra? |
|---|---|
| Mes | Nombre del mes |
| P&L Neto | Ganancias o pérdidas del mes (verde = ganancia, rojo = pérdida) |
| Acumulado | P&L acumulado hasta ese mes |
| Rentabilidad | Ganancia/pérdida como % del capital inicial |
| Efectividad | Win rate del mes (🟢 ≥50% / 🟡 ≥40% / 🔴 <40%) |
| Disciplina | Score promedio de checklist del mes |
| # Trades | Número de operaciones del mes |
| Estado | Badge visual del resultado |

**Configurar el Capital Inicial:**
En la cabecera de la sección Anual hay un campo "Capital inicial". Escribe el monto de tu cuenta y presiona Enter. Se guarda automáticamente y no necesitas ingresarlo de nuevo. Este valor se usa para calcular la columna "Rentabilidad".

> Si el capital inicial no está configurado, la columna Rentabilidad muestra `—`.

**Filtro de cuenta:**
El dropdown de cuenta funciona igual que en el Calendario: por defecto selecciona PA-APEX, y tu selección se guarda para la próxima vez.

**Navegar entre años:**
Usa los botones ◀ y ▶ junto al año para cambiar al año anterior o siguiente.

> 💡 **Tip:** Usa el Resumen Anual al cierre de cada mes para ver cómo vas vs. tu objetivo de rentabilidad anual. La tabla te muestra de inmediato si tu win rate tiene tendencia a mejorar o deteriorarse mes a mes.

---

---

### Sección 8: Coach IA (NUEVO v4.0)

El módulo de análisis inteligente. A diferencia de las demás secciones, **podés analizar cualquier fecha** — no solo la de hoy.

**Cómo usarlo:**

1. Seleccioná la fecha que querés analizar (por defecto: hoy).
2. Registrá tu emoción del día y nivel de confianza.
3. Opcionalmente, subí una imagen del chart.
4. Hacé clic en **"Analizar sesión"**.
5. El Coach genera 6 tarjetas de análisis.
6. Hacé clic en **"Guardar diagnóstico"** para persistirlo.

**Las 4 pestañas del Coach IA:**

| Pestaña | Qué hace |
|---|---|
| **Análisis** | Genera y muestra el diagnóstico de 6 secciones |
| **Chat** | Conversación libre con el Coach sobre la sesión |
| **Historial** | Lista de diagnósticos guardados — clic para recargar |
| **Estrategia** | Editá las secciones de tu estrategia Chaumer |

**Las 6 secciones del diagnóstico:**

| Sección | Contenido |
|---|---|
| 📋 Contexto | Tu situación del día en el contexto histórico |
| 📈 Desarrollo | Cómo evolucionó la sesión |
| ✅ Validación | Qué salió bien y por qué |
| ⚠️ Errores | Qué falló, con referencia a tu estrategia |
| 📚 Aprendizaje | Lección concreta y acción para mañana |
| 📝 Resumen | Síntesis de 2-3 frases |

> 💡 **Tip:** Usá el Coach IA también para fechas anteriores — podés ir analizando la semana el fin de semana, o completar días que no registraste en el momento.

> ⚙️ La API Key de Claude se configura en el ícono ⚙️ del dashboard — se guarda en tu navegador.

---

### Configuración (icono ⚙️)

Aquí solo hay un ajuste importante: tu **API Key de Claude** para el Coach IA.

Ver instrucciones completas en el [Módulo 4: Coach IA](#módulo-4-coach-ia).

---

## Módulo 3: Bot de Telegram

### ¿Qué hace el bot?

El bot (@trading_journal_bot) te permite registrar la sesión del día de forma conversacional, usando botones en Telegram. Es útil si estás en el teléfono o prefieres no abrir el navegador.

### Novedad v3.0: botón directo desde la notificación de trade

Cuando NinjaTrader registra un trade, recibes una notificación en Telegram. Desde v3.0, esa notificación incluye un botón:

```
[ 📝 Registrar sesión del día ]
```

Al presionarlo, el bot inicia el flujo de registro directamente. **Ya no necesitas escribir `/sesion`** — solo presiona el botón cuando termines de operar.

### Comandos disponibles

| Comando | Acción |
|---|---|
| `/sesion` | Inicia el registro de la sesión del día |
| `/cancelar` | Cancela el registro en cualquier momento |

### Flujo completo del registro (v4.0)

**Paso 1: ¿Operaste hoy?**
El bot pregunta con botones. Si dices **No**, te pide el motivo y cierra el registro.

**Paso 2: Estado emocional (NUEVO v4.0)**
El bot muestra las emociones disponibles en tu catálogo con botones:

```
[ 😤 Frustrado ]  [ 😰 Ansioso ]
[ 😌 Tranquilo ]  [ 💪 Confiado ]
...                [ ⏭ Omitir ]
```

**Paso 3: Nivel de confianza (NUEVO v4.0)**
```
[ ★☆☆☆☆ Muy baja ]  [ ★★☆☆☆ Baja ]
[ ★★★☆☆ Media ]
[ ★★★★☆ Alta ]  [ ★★★★★ Muy alta ]
[ ⏭ Omitir ]
```

**Paso 4: Contexto de mercado**
El bot muestra **5 opciones con botones**:

```
[ 📈 Alcista fuerte ]  [ ↗ Alcista ]
[ ↔ Mixto ]
[ ↘ Bajista ]  [ 📉 Bajista fuerte ]
```

**Paso 5: Corrida**
El bot pregunta cuántas corridas operaste con botones: `[ 1ª corrida ] [ 2ª corrida ] [ 3ª corrida ]`

**Paso 6: Velas**
Escribe el número de velas que tuvo la corrida.

**Paso 7: ¿Había zonas en contra?**
Botones: `[ ✅ Sí ] [ ❌ No ]`

**Paso 8: Setup del día**
El bot muestra la lista de setups con botones — igual que el formulario web:

```
[ IRI Apertura Alcista    ]  [ IRI Apertura Bajista    ]
[ IRI Continuación Alc.  ]  [ IRI Continuación Baj.  ]
[ Reingreso Alcista      ]  [ Reingreso Bajista       ]
```

**Paso 9: Checklist de reglas**
El bot te permite marcar/desmarcar cada una de las 6 reglas con botones y confirmar.

**Paso 10: Análisis del día**
Escribe tu análisis del día libremente.

**Guardado y resumen:**
El bot confirma que la sesión fue guardada y te muestra **un resumen completo** con todos los campos, incluyendo el checklist ítem por ítem:

```
✅ Sesión guardada — 2026-05-15
📊 Contexto: Alcista
🔢 2ª corrida | 🕯 4 velas
🏔 Sin zonas en contra
📐 IRI Continuación Alcista
📋 Checklist:
  ✅ Zonas vigentes verificadas
  ✅ Orden precolocada a tiempo
  ✅ Máx 5 velas en corrida
  ✅ Sin noticia roja activa
  ❌ Zona con rompimiento + consecución
  ✅ Estructura IRI fluida
💬 Análisis del día: "..."
```

**Cambios respecto a versiones anteriores:**

| Aspecto | v2.1 | v3.0 | v4.0 |
|---|---|---|---|
| Emoción y Confianza | No existía | No existía | **NUEVO** — pasos 2 y 3 |
| Inicio del flujo | Solo `/sesion` | `/sesion` o botón notificación | Igual |
| Contexto de mercado | Texto libre | Lista 5 opciones | Igual |
| Puntos de retroceso | Paso manual | **Eliminado** | Eliminado |
| Setup | Texto libre | Lista 6 setups | Igual |
| Confirmación al guardar | Solo básico | Resumen completo | Incluye emoción/confianza |

> ⚠️ **Nota:** El bot no permite subir imágenes. Para adjuntar una captura de chart, hazlo desde el formulario del dashboard web.

> 💡 **Tip:** Si en algún momento te equivocas, escribe `/cancelar` y luego `/sesion` (o presiona el botón de la notificación de nuevo) para reiniciar el flujo.

---

## Módulo 4: Coach IA

### ¿Qué es el Coach IA?

Es un módulo dedicado de análisis inteligente, accesible desde el ícono 🤖 del dashboard. Usa Claude Sonnet (Anthropic) para generar un diagnóstico profundo de tu sesión basado en la metodología Alfredo Chaumer.

A diferencia del análisis simple de versiones anteriores, el Coach IA:
- Tiene su propia sección en el dashboard
- Analiza **cualquier fecha** — no solo la de hoy
- Genera **6 secciones detalladas** (no 4 breves)
- Permite **chat libre** para profundizar en cualquier tema
- Guarda el diagnóstico para consultarlo después
- Usa tu **estrategia personalizada** como referencia

### Tono: estricto y directo

El coach está configurado para señalar errores sin suavizarlos. Si tu sesión fue mala, el análisis lo refleja. El objetivo es que el feedback sea útil para mejorar, no para sentirte bien.

### ¿Qué datos usa?

| Fuente de datos | Qué aporta |
|---|---|
| Sesión del día analizado | Trades, checklist, emoción, confianza, notas |
| Historial 60 días | Patrones, errores recurrentes, tendencias |
| Tu estrategia Chaumer | Marco de referencia para evaluar decisiones |
| Imagen del chart (opcional) | El coach la ve y la incluye en el análisis |

### Cómo usarlo paso a paso

1. Hacé clic en el ícono 🤖 en la barra de navegación.
2. Seleccioná la fecha a analizar (por defecto: hoy).
3. Registrá tu emoción del día y nivel de confianza.
4. Opcionalmente, arrastrá o seleccioná una imagen del chart.
5. Hacé clic en **"Analizar sesión"**.
6. Esperá unos segundos — aparecen las 6 tarjetas de análisis.
7. Si querés profundizar en algo, usá el **chat** (pestaña Chat).
8. Hacé clic en **"Guardar diagnóstico"** para persistirlo.

### Las 6 secciones del diagnóstico

| Sección | Descripción |
|---|---|
| 📋 **Contexto** | Tu situación del día comparada con el historial |
| 📈 **Desarrollo** | Cómo evolucionó la sesión |
| ✅ **Validación** | Qué salió bien y por qué |
| ⚠️ **Errores** | Qué falló, con referencia a tu estrategia |
| 📚 **Aprendizaje** | Lección concreta + acción para mañana |
| 📝 **Resumen** | Síntesis de 2-3 frases del día |

### Estrategia Chaumer editable

La pestaña **Estrategia** te permite editar las secciones de tu estrategia. Cuanto más completa esté, más preciso será el análisis.

### Cómo configurar la API Key de Claude (se hace una sola vez)

1. Ve a [https://console.anthropic.com](https://console.anthropic.com).
2. Crea una cuenta o inicia sesión.
3. Ve a **API Keys** → **Create Key** → copia la clave.
4. Abre el dashboard web y haz clic en el ícono ⚙️.
5. Pega tu API Key y haz clic en **Guardar**.

La key queda guardada en tu navegador. No se sube a ningún servidor.

> 💡 **Tip:** El Coach IA funciona mejor cuando la sesión del día está completa en el formulario. Registrá primero la sesión, luego abrí el Coach IA para analizarla.

---

## Rutina Diaria Recomendada

### Antes de operar

- [ ] Abre NinjaTrader 8 y verifica que el gráfico con el indicador esté abierto y activo.
- [ ] Revisa el calendario para recordar cómo vas en la semana.
- [ ] Verifica si hoy es festivo CME o día FOMC.

### Durante la sesión

- [ ] Opera normalmente. El indicador registra cada trade automáticamente.

### Al terminar de operar

- [ ] Toma una captura de pantalla del chart del día.
- [ ] Verifica en la **Tabla de Trades** que todos los trades aparezcan.
- [ ] Registra la sesión desde el **bot de Telegram** (presiona el botón de la notificación o escribe `/sesion`) o desde el **formulario web**:
  - Contexto, corrida, velas, zonas, setup.
  - Marca el checklist con honestidad.
  - Registra las casuísticas si cometiste errores tipificables.
  - Escribe tu análisis del día.
  - Sube la captura de pantalla.
  - Guarda la sesión.
- Abrí el **Coach IA** (ícono 🤖), seleccioná la fecha de hoy y hacé clic en **"Analizar sesión"**.

### Revisión semanal (viernes o fin de semana)

- [ ] Abre **Análisis** y revisa la curva de equidad de la semana.
- [ ] Identifica el error más frecuente en **Métricas** (clicka en Disciplina para el desglose).
- [ ] Abre la **Galería de Imágenes** y compara visualmente días ganadores vs perdedores.

### Revisión mensual (último día del mes)

- [ ] Abre el **Resumen Anual** para ver tu resultado del mes en contexto del año.
- [ ] Revisa la columna de Efectividad mes a mes — ¿hay tendencia?
- [ ] Compara tu disciplina promedio del mes con el histórico anual.
- [ ] Define un objetivo de mejora para el mes siguiente.

---

## Preguntas Frecuentes (FAQ)

**1. ¿Qué pasa si olvidé abrir el gráfico con el indicador y ya operé?**

Los trades no se habrán enviado automáticamente. Deberás registrarlos manualmente si quieres tenerlos en el sistema.

---

**2. ¿Puedo registrar la sesión tanto en el dashboard como en Telegram?**

Sí, ambos canales llegan a la misma base de datos. Sin embargo, si ya registraste la sesión de hoy en uno de los dos, no la registres de nuevo en el otro porque el sistema actualizaría el registro existente (no crea duplicados por fecha).

---

**3. ¿La API Key de Claude tiene algún costo?**

Sí, Anthropic cobra por uso. Con el Coach IA v4.0 (Sonnet), el costo por diagnóstico es aproximadamente $0.02. Con 20 sesiones al mes, son ~$0.40/mes — prácticamente despreciable. Puedes ver el costo en [https://www.anthropic.com/pricing](https://www.anthropic.com/pricing).

---

**4. ¿Para qué sirve la sección Anual?**

Para ver tu desempeño global del año: cuánto ganaste o perdiste, tu win rate promedio, cuál fue tu mejor y peor mes, y tu disciplina a lo largo del año. Es especialmente útil para la revisión mensual y el cierre de año.

---

**5. ¿Qué es el "Capital inicial" en la sección Anual?**

Es el saldo de tu cuenta al inicio del año. Se usa para calcular la columna "Rentabilidad" (% de ganancia/pérdida sobre el capital). Solo lo escribes una vez — el sistema lo guarda. Si no lo configuras, la columna Rentabilidad muestra `—`.

---

**6. ¿Por qué el Coach IA a veces parece duro en su análisis?**

El coach está configurado para ser estricto y directo. Si cometiste errores o tu desempeño fue malo, el análisis lo señala sin suavizarlo. El objetivo es que el feedback sea útil para mejorar, no para sentirte bien. Si los datos muestran buen desempeño, el análisis lo reconoce.

---

**7. ¿El bot de Telegram ya no pide los puntos de retroceso?**

Correcto. Desde v3.0, el paso de "puntos de retroceso" fue eliminado del bot porque es un valor que se calcula automáticamente. Si necesitas registrarlo, puedes hacerlo manualmente desde el formulario web.

---

**8. ¿Cómo actualizo la app cuando hay cambios nuevos?**

**En el navegador:** `Ctrl + Shift + R` para forzar recarga sin caché.
**En el iPhone (como PWA instalada):** La app se actualiza automáticamente la próxima vez que la abras con conexión a internet. Si necesitas forzar la actualización: abre Safari → ve a la URL del journal → recarga la página → vuelve al ícono en pantalla de inicio.

---

**9. ¿Qué diferencia hay entre Disciplina y Error más frecuente?**

**Disciplina** evalúa los 6 ítems del checklist + el factor "sin errores de tipificación" (7 en total). Mide si seguiste tus reglas operativas. **Error más frecuente** muestra la casuística específica que más se repite — son errores concretos que tipificaste tú mismo. Haz clic en cualquiera para ver el desglose detallado.

---

## Tarjeta de Referencia Rápida

```
TRADING JOURNAL NQ FUTURES — REFERENCIA RÁPIDA v4.0
====================================================

ACCESO
Dashboard web: https://kristeb-trader.github.io/trading-journal/
Bot Telegram:  @trading_journal_bot

CHECKLIST ANTES DE OPERAR
□ NT8 abierto con indicador activo en el gráfico
□ Verificar calendario: ¿es festivo CME o día FOMC?

CHECKLIST AL TERMINAR
□ Verificar trades en Tabla de Trades
□ Registrar sesión:
  □ Opción A: presionar botón en notificación de Telegram
  □ Opción B: escribir /sesion en Telegram
  □ Opción C: abrir formulario web
□ Completar: contexto, corrida, velas, zonas, setup
□ Marcar las 6 reglas del checklist
□ Registrar casuísticas si aplica
□ Escribir notas adicionales
□ Subir imagen del chart
□ Guardar sesión
□ Abrir Coach IA → seleccionar fecha → Analizar sesión → Guardar diagnóstico

LAS 6 REGLAS DEL CHECKLIST
1. Zonas vigentes verificadas
2. Orden precolocada a tiempo
3. Máx 5 velas en corrida
4. Sin noticia roja activa
5. Zona con rompimiento + consecución
6. Estructura Impulso-Retroceso-Impulso

OPCIONES DE CONTEXTO (bot y formulario)
📈 Alcista fuerte | ↗ Alcista | ↔ Mixto
↘ Bajista | 📉 Bajista fuerte

SETUPS DISPONIBLES (bot y formulario)
IRI Apertura Alcista     | IRI Apertura Bajista
IRI Continuación Alcista | IRI Continuación Bajista
Reingreso Alcista        | Reingreso Bajista

COLORES DEL CALENDARIO
🟢 Verde        = Target alcanzado
🔴 Rojo         = Stop activado
🟡 Amarillo     = Sin entradas válidas
⚫ Negro/gris   = No operé
🔵 Azul tenue  = Festivo CME (mercado cerrado)
🟠 Ámbar       = Día FOMC (no operé por FOMC)

ICONOS EN CELDAS
⚠️  sup. derecha    = Hubo casuísticas (errores tipificados)
🔺  inf. derecha    = Dirección del trade (largo)
🔻  inf. derecha    = Dirección del trade (corto)
📊  sup. izquierda  = Día FOMC pero sí operé

MOTIVOS DE NO OPERACIÓN
• FOMC / Fed
• Festivo (mercado cerrado)
• Sin entradas válidas
• Noticia roja activa
• Motivo personal
• Otro

COMANDOS TELEGRAM
/sesion   → Iniciar registro de sesión
/cancelar → Cancelar el registro en curso
[Botón en notificación] → Iniciar registro directamente

SECCIONES DEL DASHBOARD (8)
1. Calendario  2. Métricas  3. Galería
4. Tabla       5. Registrar Sesión
6. Análisis    7. Anual
8. Coach IA (NUEVO)

ACTUALIZAR PWA EN IPHONE
Abrir Safari → ir a la URL → recargar → volver al ícono
```

---

## Glosario

| Término | Definición |
|---|---|
| **P&L** | Profit and Loss. El resultado económico de tus operaciones en dólares. |
| **Win rate / Efectividad** | Porcentaje de trades que terminaron en ganancia. |
| **Setup** | La configuración específica de condiciones de mercado que usas como señal para entrar. |
| **Corrida** | Movimiento previo al retroceso que operaste. Se mide en número de velas. |
| **Retroceso** | La corrección del precio que da la oportunidad de entrada. |
| **MAE** | Maximum Adverse Excursion. La máxima pérdida que tuvo una operación mientras estaba abierta. |
| **MFE** | Maximum Favorable Excursion. La máxima ganancia que tuvo una operación mientras estaba abierta. |
| **Checklist** | Lista de reglas que debes cumplir antes de entrar a una operación. |
| **Casuística** | Error específico tipificado por el trader (ej: "entré tarde", "no respeté el plan"). |
| **Curva de equidad** | Gráfico que muestra el P&L acumulado a lo largo del tiempo. |
| **IRI** | Impulso-Retroceso-Impulso. Estructura de precio en tres fases: movimiento fuerte, corrección, y continuación. |
| **Profit Factor** | Ratio de ganancias totales / pérdidas totales. Factor >1 indica estrategia rentable. |
| **Max Drawdown** | Máxima caída del capital desde un pico hasta el valle subsiguiente. |
| **Disciplina** | Métrica de 7 factores: 6 ítems del checklist + "sin errores de tipificación". |
| **Supabase** | La base de datos en la nube donde se guardan todos tus trades y sesiones. |
| **Festivo CME** | Día en que el mercado CME (donde se opera el NQ) está cerrado. |
| **FOMC** | Federal Open Market Committee. Reunión de la Fed que puede generar alta volatilidad. |
| **Fusión ATM** | Proceso automático del indicador NT8 que agrupa trades de múltiples contratos ATM en un único registro. |
| **Lightbox** | Vista de imagen a pantalla completa con navegación prev/next y atajos de teclado. |
| **PWA** | Progressive Web App. La app instalada en iPhone/Android desde el navegador. Se actualiza automáticamente. |
| **Break Even (BE)** | Trade con resultado entre -$6 y +$6. Clasificado como neutro. |

---

## Historial de Versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | Mayo 2026 | Versión inicial del manual |
| 2.1 | Mayo 2026 | Galería de imágenes con lightbox; festivos CME automáticos y días FOMC en el calendario (6 colores); iconos por celda (error/dirección/FOMC operado); filtro de cuenta PA-APEX por defecto con persistencia; disciplina 7 factores clickable con desglose; error frecuente desde casuísticas; pestaña Imagen primera en modal de día; motivo "Festivo" en formulario; casuísticas visibles en no-operación; fusión ATM 3s en NT8; tarjeta de referencia rápida |
| 3.0 | Mayo 2026 | **Sección Anual**: KPI strip (8 métricas), equity curve, barras P&L mensual, tabla por mes, account filter PA-APEX, capital inicial en localStorage, totals row coloreados. **Bot Telegram v3**: botón automático desde notificación de trade; contexto como lista; setup como lista (2/fila); resumen completo con checklist. **Coach IA v2**: análisis 4 secciones desde formulario, max_tokens=400, claude-haiku. **PWA**: network-first, updates automáticos en iPhone. **Casuísticas**: catálogo con drag-and-drop. |
| 4.0 | Mayo 2026 | **Coach IA v3 — módulo dedicado**: sección propia 🤖, diagnóstico 6 secciones (Contexto, Desarrollo, Validación, Errores, Aprendizaje, Resumen), chat multi-turn, historial de diagnósticos persistido, subida de imagen (Claude Vision), selector de fecha para días pasados, estrategia Chaumer editable por sección. Modelo: claude-sonnet-4-5, max_tokens=3000. **Emociones**: catálogo de emociones, estado emocional y confianza en sesiones. **Bot Telegram v4**: pasos EMOCION y CONFIANZA nuevos. **form.js**: eliminado "Generar resumen", reemplazado por "Notas adicionales". **PWA**: sw v4 (nqjournal-v4). |

---

## Cómo Reportar Problemas o Sugerir Mejoras

### Si algo no funciona

1. **¿Qué estabas haciendo** cuando ocurrió el problema?
2. **¿Qué esperabas que pasara** vs. **qué pasó realmente**?
3. **Captura de pantalla** del error si aparece algún mensaje.
4. **Fecha y hora** aproximada del problema.
5. **Qué dispositivo** (PC, iPhone, Android) y **qué navegador/app** usas.

### Si tienes una sugerencia de mejora

Describe:
- **Qué quisieras que el sistema hiciera** que no hace hoy.
- **Por qué sería útil** para tu trading.

> 💡 **Tip:** Las mejores sugerencias vienen del uso real del sistema. Si algo te genera fricción en tu flujo diario, reportalo — eso es exactamente lo que se quiere mejorar.

---

*Manual de Usuario — Trading Journal NQ Futures | Versión 4.0 | Mayo 2026*
