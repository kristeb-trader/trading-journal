# Trading Journal NQ Futures
## Guía Funcional del Sistema

**Versión:** 4.0 | **Fecha:** Mayo 2026

---

## ¿Qué es el Trading Journal?

Es un sistema personal diseñado para registrar, revisar y mejorar tu operativa diaria en futuros NQ/MNQ. Centraliza toda la información de tus sesiones de trading en un solo lugar: los trades que ejecutas, cómo te comportaste con tus reglas, tus reflexiones del día, y estadísticas que te ayudan a identificar patrones en tu operativa — tanto diarios como anuales.

---

## ¿Cómo se alimenta el sistema?

El sistema tiene **tres formas de recibir información**, y las tres trabajan juntas:

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ¿CÓMO ENTRA LA INFORMACIÓN?                        │
├─────────────────┬───────────────────────┬───────────────────────────┤
│                 │                       │                           │
│  AUTOMÁTICO     │   DESDE EL            │   DESDE TU                │
│  NinjaTrader    │   DASHBOARD WEB       │   CELULAR                 │
│                 │                       │                           │
│  Cada trade que │   Formulario web para │   Bot de Telegram para    │
│  cierras queda  │   registrar tu sesión │   registrar la sesión     │
│  guardado solo, │   del día con todos   │   conversando con el bot  │
│  sin hacer nada │   los detalles        │   con botones simples     │
│                 │                       │                           │
│  ¿Qué guarda?   │   ¿Qué guarda?        │   ¿Qué guarda?            │
│  • Precio entry │   • Contexto mercado  │   • Contexto mercado      │
│  • Precio exit  │   • Nº de corrida     │   • Nº de corrida         │
│  • Hora exacta  │   • Velas en corrida  │   • Velas en corrida      │
│  • Ganancia/    │   • Zonas en contra   │   • Zonas en contra       │
│    pérdida      │   • Setup del día     │   • Setup del día         │
│  • Tipo de      │   • Checklist 6 reglas│   • Checklist 6 reglas    │
│    resultado    │   • Análisis del día  │   • Análisis del día      │
│    (target/stop)│   • Imagen del día    │                           │
│  • MAE y MFE    │   • Resumen con IA    │                           │
│  • Comisión     │                       │                           │
└─────────────────┴───────────────────────┴───────────────────────────┘
```

---

## ¿Dónde se guarda todo?

Toda la información va a una base de datos en la nube. No está en tu computador — está en internet, accesible desde cualquier dispositivo. Se organiza en cuatro grupos:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             BASE DE DATOS                                │
├──────────────────┬────────────────────┬───────────────┬──────────────────┤
│                  │                    │               │                  │
│  TABLA TRADES    │  TABLA SESIONES    │  FOMC_DATES   │  CATALOGOS       │
│  (automático)    │  (manual)          │  (referencia) │  (catálogos)     │
│                  │                    │               │                  │
│  Un registro por │  Un registro por   │  Fechas FOMC  │  casuisticas     │
│  cada trade      │  día operado       │  2025-2026    │  emociones       │
│                  │                    │               │                  │
│  Trade entry/    │  Contexto, corrida │  Solo lectura │  ESTRATEGIA_     │
│  exit, profit,   │  setup, checklist  │  pre-poblada  │  CHAUMER         │
│  commission,     │  emoción, conf.    │               │  (6 secciones    │
│  resultado       │  notas adicionales │               │   editables)     │
│                  │                    │               │                  │
│                  │                    │               │  DIAGNOSTICOS_   │
│                  │                    │               │  DIARIOS         │
│                  │                    │               │  (Coach IA)      │
└──────────────────┴────────────────────┴───────────────┴──────────────────┘
```

---

## ¿Qué puedes ver en el Dashboard?

El dashboard es una página web accesible desde cualquier navegador — y también instalable como PWA en iPhone/Android. Tiene **8 secciones**:

### 📅 Sección 1 — Calendario

```
┌─────────────────────────────────────────────────────┐
│              MAYO 2026                  ← →         │
│  [Cuenta: PA-APEX ▼]                                │
├─────┬─────┬─────┬─────┬─────┬─────┬─────────────────┤
│ Lun │ Mar │ Mié │ Jue │ Vie │                        │
├─────┼─────┼─────┼─────┼─────┤                        │
│  4  │  5  │  6  │  7  │  8  │  Resumen del mes:      │
│     │🟢   │🔴   │⚫   │🟢   │  • 18 días operados    │
│     │+$42 │-$18 │     │+$35 │  • 60 trades           │
├─────┼─────┼─────┼─────┼─────┤  • 67% win rate        │
│ 11  │ 12  │ 13  │ 14  │ 15  │  • P&L: +$487          │
│🟡   │🟢🔺  │🔴⚠️  │🏦  │📊  │                        │
│+$8  │+$65 │-$22 │Fest.│FOMC │                        │
└─────┴─────┴─────┴─────┴─────┴────────────────────────┘

🟢 Target alcanzado    🔴 Stop activado
🟡 Día mixto           ⚫ No se operó
🔵 Festivo CME         🟠 Día FOMC (no operado)

Iconos en celda:
⚠️ Error de tipificación (esquina sup. derecha, ámbar)
🔺 Dirección del trade (esquina inf. derecha)
📊 FOMC operado (esquina sup. izquierda, pequeño ámbar)
```

**Leyenda completa (6 colores):**
| Color | Significado |
|---|---|
| 🟢 Verde | Target alcanzado |
| 🔴 Rojo | Stop activado |
| 🟡 Amarillo | Sin entradas válidas (registró sesión pero no hubo trade) |
| ⚫ Negro/gris | No operé (motivo personal, noticia, etc.) |
| 🔵 Azul tenue | Festivo CME (mercado cerrado) |
| 🟠 Ámbar/caramelo | Día FOMC (no operado por FOMC) |

**Filtro de cuenta:**
- Por defecto selecciona **PA-APEX** al cargar el calendario.
- La selección persiste en `localStorage` al navegar entre secciones y recargar.

**Festivos CME automáticos:**
Los 10 festivos anuales del mercado CME se calculan algorítmicamente en JavaScript para cualquier año. No requieren registro de sesión.

**Días FOMC:**
Las fechas FOMC se cargan desde la tabla `fomc_dates` de Supabase.

Al hacer clic en cualquier día aparece un panel con 4 pestañas:
- **Imagen:** captura del gráfico del día (primera pestaña)
- **Análisis:** contexto, setup, reflexión + resumen de la IA
- **Checklist:** las 6 reglas con ✅/❌ y score del día
- **Resumen:** lista de trades del día

---

### 📊 Sección 2 — Métricas

Estadísticas de tu operativa. Siguen el **mes del calendario** y el **filtro de cuenta**.

```
┌──────────┬──────────┬──────────┬──────────┐
│ P&L NETO │ WIN RATE │  TRADES  │ SESIONES │
│  +$487   │   67%    │    60    │    18    │
└──────────┴──────────┴──────────┴──────────┘

┌──────────┬──────────┬──────────┬──────────┐
│  RACHA   │ MEJOR    │  PEOR    │DISCIPLINA│
│ ACTUAL   │  DÍA     │  DÍA    │ CLICKABLE│
│ 3 wins   │  +$120   │  -$85   │  82% 🟢  │
└──────────┴──────────┴──────────┴──────────┘
```

**Disciplina (7 factores):**
Evalúa 6 ítems del checklist + 1 factor "sin errores de tipificación". Colores: ≥80% verde, 50-79% amarillo, <50% rojo. **Es clickable** → modal con desglose por factor.

**Error más frecuente:**
Muestra la casuística más frecuente. Clickable → modal con frecuencia de cada casuística.

---

### 🖼️ Sección 3 — Galería de Imágenes

Vista de miniaturas de las capturas de pantalla de tus sesiones, agrupadas por semana. Borde de color por resultado. **Lightbox** con navegación y atajos de teclado.

---

### 📋 Sección 4 — Tabla de Trades

Todos tus trades en una tabla filtrable y buscable.

---

### ✍️ Sección 5 — Registrar Sesión

Formulario para documentar tu sesión del día. Si ya existe un registro para hoy, lo edita en lugar de crear uno nuevo. Al terminar puedes:
- Escribir notas adicionales en el campo "Notas adicionales" (libre).
- Subir la imagen del gráfico del día.

> El análisis IA ya no se genera desde aquí — ver **Sección 8: Coach IA**.

**Motivos de no operación disponibles:**
- FOMC / Fed
- Festivo (mercado cerrado)
- Sin entradas válidas
- Noticia roja activa
- Motivo personal
- Otro

**Casuísticas:** Los errores de tipificación permanecen visibles aunque se marque "No operé hoy".

---

### 📈 Sección 6 — Análisis

Seis gráficas para identificar patrones en tu operativa:

| Gráfica | ¿Qué muestra? |
|---|---|
| Curva de Equity | Evolución de tu capital acumulado en el tiempo |
| Win Rate semanal | Porcentaje de éxito semana a semana |
| P&L por día de semana | ¿En qué días del week operas mejor? |
| MAE vs MFE | Relación entre cuánto pierde y cuánto gana cada trade |
| Distribución de resultados | Proporción targets vs stops |
| Disciplina por sesión | Tu score de checklist a lo largo del tiempo |

---

### 📆 Sección 7 — Resumen Anual

Vista consolidada de todo un año de trading. Permite comparar meses, detectar estacionalidad y evaluar el desempeño global.

```
┌──────────────────────────────────────────────────────────────────┐
│  RESUMEN ANUAL              ◀  2026  ▶    [Cuenta: PA-APEX ▼]   │
│  Capital inicial: $__________                                    │
├──────────────────────────────────────────────────────────────────┤
│  P&L TOTAL  │ TRADES │ WIN RATE │ PROFIT F. │ MAX DD  │ DISCIP. │
│  +$2,340    │  248   │  61%     │  2.3x     │ -$450   │  78%    │
│                                                                  │
│  MEJOR MES: Marzo +$620  │  PEOR MES: Enero -$180               │
├──────────────────────────────────────────────────────────────────┤
│  [Equity Curve anual — línea acumulada]                          │
│  [P&L por mes — barras verdes/rojas]                             │
├──────────────────────────────────────────────────────────────────┤
│  Mes      │ P&L     │ Acumulado│ Rentab. │ Efectiv.│ Disc. │ #  │
│  Enero    │ -$180   │  -$180   │  -1.8%  │  45% 🟡 │  72%  │ 20 │
│  Febrero  │ +$340   │  +$160   │  +3.4%  │  63% 🟢 │  85%  │ 18 │
│  Marzo    │ +$620   │  +$780   │  +6.2%  │  68% 🟢 │  91%  │ 24 │
│  ...                                                             │
├──────────────────────────────────────────────────────────────────┤
│  Resumen  │ +$2,340 │    —     │ +23.4%  │  61% 🟢 │  78%  │248 │  ← celdas coloreadas
└──────────────────────────────────────────────────────────────────┘
```

**Columnas de la tabla mensual:**

| Columna | Descripción |
|---|---|
| Mes | Nombre del mes (Jan → Dic) |
| P&L Neto | Ganancia/pérdida neta del mes (verde/rojo) |
| Acumulado | P&L acumulado hasta ese mes |
| Rentabilidad | P&L / capital inicial × 100 (requiere configurar capital) |
| Efectividad | Win rate del mes (color: ≥50% verde, ≥40% amarillo, <40% rojo) |
| Disciplina | Score promedio de checklist del mes |
| # Trades | Total de operaciones del mes |
| Estado | Badge visual de resultado del mes |

**Totals row coloreados:**
La fila de totales al final de la tabla usa fondos de color según el valor:
- Fondo verde con texto en negrita → resultado positivo
- Fondo rojo con texto en negrita → resultado negativo
- Fondo amarillo con texto en negrita → rango de advertencia
- Fondo neutro → campos sin semántica de color

**Capital inicial:**
Se configura una sola vez en el campo de la cabecera. Se guarda en `localStorage`. Permite calcular la rentabilidad porcentual del año.

**Filtro de cuenta:**
Mismo principio que en el calendario — por defecto PA-APEX, persistido en `localStorage`.

---

### 🤖 Sección 8 — Coach IA (NUEVO v4.0)

Módulo dedicado de análisis inteligente con Claude Sonnet. Puede analizar **cualquier fecha** — no solo hoy.

```
┌─────────────────────────────────────────────────────────────────────┐
│  COACH IA                               Fecha: [2026-05-27 ▼] — hoy │
│                                                                      │
│  Estado emocional: [😤 Frustrado ▼]  Confianza: ★★★☆☆               │
│                                                                      │
│  [ Análisis ]  [ Chat ]  [ Historial ]  [ Estrategia ]              │
├─────────────────────────────────────────────────────────────────────┤
│  [Analizar sesión]  [🖼 Subir imagen]                                │
├─────────────────────────────────────────────────────────────────────┤
│  📋 CONTEXTO      │  📈 DESARROLLO    │  ✅ VALIDACIÓN              │
│  Situación del   │  Evolución de    │  Qué salió bien             │
│  día en contexto │  la sesión       │  y por qué                  │
│  histórico       │                  │                              │
├──────────────────┼──────────────────┼─────────────────────────────┤
│  ⚠️ ERRORES       │  📚 APRENDIZAJE   │  📝 RESUMEN                 │
│  Qué falló con  │  Lección concreta│  Síntesis de                │
│  ref. a la      │  + acción para   │  2-3 frases                 │
│  estrategia     │  mañana          │                              │
├─────────────────────────────────────────────────────────────────────┤
│  [Guardar diagnóstico]                                               │
├─────────────────────────────────────────────────────────────────────┤
│  Chat:                                                               │
│  Coach: ¿Qué quieres profundizar?                                   │
│  [Escribe tu pregunta...]                         [Enviar]          │
└─────────────────────────────────────────────────────────────────────┘
```

**Pestañas del Coach IA:**

| Pestaña | Función |
|---|---|
| Análisis | Genera el diagnóstico de 6 secciones con Sonnet · guarda en `diagnosticos_diarios` |
| Chat | Conversación multi-turn · mantiene historial de mensajes · acepta imágenes |
| Historial | Lista de diagnósticos guardados · clic para recargar cualquier fecha |
| Estrategia | Edición de las 6 secciones de la estrategia Chaumer · se guardan en `estrategia_chaumer` |

**Características clave:**
- **Selector de fecha**: analizás cualquier día pasado para llenar la base de datos histórica.
- **Imagen**: se puede adjuntar una captura del chart — Claude la analiza con Vision API.
- **Diagnóstico persistido**: el análisis se guarda y se puede recuperar desde Historial.
- **System prompt dinámico**: incluye la estrategia Chaumer actual + 60 días de historial + patrones detectados.

---

## Las 6 Reglas del Checklist

Cada vez que registras una sesión — desde el web o el bot — evalúas si cumpliste estas 6 reglas:

| # | Regla | ¿Qué valida? |
|---|---|---|
| 1 | Zonas vigentes verificadas | Revisaste las zonas antes de operar |
| 2 | Orden precolocada a tiempo | La orden estaba lista antes de que llegara el precio |
| 3 | Máx 5 velas en corrida | La corrida no fue demasiado extensa |
| 4 | Sin noticia roja activa | No había evento de alto impacto en el momento |
| 5 | Zona con rompimiento + consecución | El setup cumplió la estructura técnica |
| 6 | Estructura Impulso-Retroceso-Impulso | El contexto de la corrida era fluido |

El sistema calcula automáticamente tu **score de disciplina** por sesión, evaluando estos 6 factores más el factor adicional "sin errores de tipificación" (7 en total para la métrica de disciplina).

---

## El Bot de Telegram (v3.0)

En lugar de abrir el dashboard web, puedes registrar tu sesión diaria directamente desde Telegram. El bot te hace preguntas una por una con botones para responder.

**Novedades v4.0: pasos EMOCION y CONFIANZA añadidos al flujo.**
Ahora el bot pregunta emoción (del catálogo dinámico) y nivel de confianza antes de continuar con el contexto.

```
[Notificación de trade en Telegram]
📊 NQ — Long | Target +$237.50
🕐 09:31:42 | 1 contrato | 3 barras

[ 📝 Registrar sesión del día ]   ← botón inline
                │
                ▼
Bot:  📅 Registro de sesión — 2026-05-15
      ¿Operaste hoy?
      [ ✅ Sí, operé ]  [ ❌ No operé ]

Tú:   ✅ Sí, operé

Bot:  😊 ¿Cómo llegás emocionalmente hoy?
      [ 😤 Frustrado ]  [ 😰 Ansioso ]
      [ 😌 Tranquilo ]  [ 💪 Confiado ]
      ...                [ ⏭ Omitir ]

Tú:   😌 Tranquilo

Bot:  ⭐ Nivel de confianza
      [ ★☆☆☆☆ Muy baja ]  [ ★★☆☆☆ Baja ]
      [ ★★★☆☆ Media ]
      [ ★★★★☆ Alta ]  [ ★★★★★ Muy alta ]
      [ ⏭ Omitir ]

Tú:   ★★★☆☆ Media

Bot:  📊 Contexto de mercado
      [ 📈 Alcista fuerte ]  [ ↗ Alcista ]
      [ ↔ Mixto ]
      [ ↘ Bajista ]  [ 📉 Bajista fuerte ]

Tú:   ↗ Alcista

Bot:  🔢 ¿Qué corrida operaste?
      [ 1ª corrida ]  [ 2ª corrida ]  [ 3ª corrida ]

Tú:   2ª corrida

Bot:  🕯 ¿Cuántas velas tuvo la corrida?
      (escribe el número)

Tú:   4

Bot:  🏔 ¿Había zonas en contra?
      [ ✅ Sí ]  [ ❌ No ]

Tú:   No

Bot:  📐 Setup del día
      [ IRI Apertura Alcista   ]  [ IRI Apertura Bajista   ]
      [ IRI Continuación Alc. ]  [ IRI Continuación Baj. ]
      [ Reingreso Alcista      ]  [ Reingreso Bajista      ]

Tú:   IRI Continuación Alcista

Bot:  📋 Checklist de disciplina
      (toggle cada regla)

Bot:  ✍️ Análisis del día
      Escribe tu análisis...

Bot:  ✅ Sesión guardada — 2026-05-15
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
      💬 Análisis: "Buena ejecución, pero la zona no tenía consecución."
```

**Cambios respecto a versiones anteriores:**

| Aspecto | v2.1 | v3.0 | v4.0 |
|---|---|---|---|
| Inicio del flujo | Solo con `/sesion` | Con `/sesion` O botón notificación | Igual |
| Emoción y Confianza | No existía | No existía | **NUEVO** — pasos EMOCION + CONFIANZA |
| Contexto de mercado | Texto libre | Lista de 5 opciones | Igual |
| Puntos de retroceso | Paso manual | **Eliminado** | Eliminado |
| Setup | Texto libre | Lista de 6 setups (2/fila) | Igual |
| Resumen tras guardar | Solo confirmación | Resumen completo | Igual + muestra emoción/confianza |

---

## El Coach IA — Análisis Inteligente de Sesión (v4.0)

Módulo dedicado accesible desde la sección **Coach IA** del dashboard. Analiza cualquier día — pasado o presente — con un diagnóstico de 6 secciones basado en la metodología Alfredo Chaumer.

**¿Qué datos usa el coach?**

| Fuente | Datos |
|---|---|
| Sesión del día analizado | Trades, checklist, casuísticas, emoción, confianza, notas del trader |
| Historial 60 días | Win rate, P&L, disciplina, patrones, errores recurrentes |
| Estrategia Chaumer | 6 secciones editables por el trader (fundamentos, setups, gestión, psicología…) |
| Imagen (opcional) | Captura del chart analizada con Claude Vision |

**Estructura del análisis (6 secciones, ~3000 tokens de salida):**

1. **Contexto** — Situación del día en el contexto histórico.
2. **Desarrollo** — Cómo evolucionó la sesión.
3. **Validación** — Qué salió bien y por qué.
4. **Errores** — Qué falló con referencias a la estrategia.
5. **Aprendizaje** — Lección concreta y acción para mañana.
6. **Resumen** — Síntesis de 2-3 frases.

**Tono:** directo y estricto. Señala errores sin suavizarlos. Fundamenta cada observación en la estrategia Chaumer del trader.

**Diagnóstico persistido:** se guarda en `diagnosticos_diarios`. Recuperable desde la pestaña Historial.

---

## Resumen Visual del Sistema Completo

```
                    TRADING JOURNAL NQ FUTURES v4.0
                    ════════════════════════════════

  ┌─────────────────────────────────────────────────────────────┐
  │                    TÚ — EL TRADER                           │
  └──────────────┬───────────────────┬──────────────────────────┘
                 │                   │                   │
         En NT8  │         En el PC  │         En el     │
         operas  │         completas │         celular   │
                 │         el form   │         /sesion   │
                 ▼                   ▼         o botón ↑ │
  ┌──────────────────┐  ┌────────────────────┐  ┌────────────────┐
  │  NinjaTrader 8   │  │  Dashboard Web     │  │  Bot Telegram  │
  │                  │  │  github.io/...     │  │                │
  │  Trades se       │  │  Formulario        │  │  Preguntas     │
  │  guardan solos   │  │  de sesión         │  │  con botones   │
  │  (fusión ATM)    │  │  + Coach IA        │  │  + auto-botón  │
  │  + notif. bot    │  │  + Anual           │  │  en notif.     │
  └────────┬─────────┘  └────────┬───────────┘  └───────┬────────┘
           │                     │                       │
           └─────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   BASE DE DATOS        │
                    │   (Supabase / nube)    │
                    │                        │
                    │  trades   │  sesiones  │
                    │  fomc_dates            │
                    │  catalogo_casuisticas  │
                    └─────────────┬──────────┘
                                  │
                                  ▼
                    ┌────────────────────────┐
                    │   DASHBOARD WEB (PWA)  │
                    │                        │
                    │  📅 Calendario         │
                    │  📊 Métricas           │
                    │  🖼️  Galería           │
                    │  📋 Tabla de trades    │
                    │  ✍️  Registrar sesión  │
                    │  📈 Gráficas           │
                    │  📆 Anual              │
                    │  🤖 Coach IA ← NUEVO   │
                    └────────────────────────┘
```

---

## Beneficios del Sistema

| Antes | Con el Trading Journal |
|---|---|
| Los trades quedaban solo en NT8 | Todos los datos centralizados y accesibles |
| No había registro del contexto del día | Cada sesión documentada con setup y reflexión |
| Difícil identificar patrones de error | El checklist y las casuísticas muestran tu error más frecuente |
| Sin métricas de disciplina | Score de disciplina (7 factores) por sesión, con desglose clickable |
| Registrar la sesión tomaba mucho tiempo | El bot la registra en 2 minutos, con botón directo desde notificación |
| Las imágenes del día se perdían | Galería de imágenes con lightbox, agrupadas por semana |
| Sin análisis externo de la sesión | Coach IA con Sonnet — diagnóstico 6 secciones, chat multi-turn, historial persistido, análisis de imagen |
| No había visibilidad de festivos CME | Festivos calculados automáticamente |
| Sin referencia de días FOMC | Días FOMC marcados desde la base de datos |
| Trades con múltiples contratos ATM registrados por separado | Fusión automática de 3s consolida contratos |
| Sin visión anual del desempeño | Dashboard anual con KPIs, equity curve, tabla mensual y account filter |
| La PWA no se actualizaba en el iPhone | Estrategia network-first: updates automáticos al recargar con conexión |
