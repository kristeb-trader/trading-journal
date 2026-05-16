# Trading Journal NQ Futures
## Guía Funcional del Sistema

**Versión:** 2.0 | **Fecha:** Mayo 2026

---

## ¿Qué es el Trading Journal?

Es un sistema personal diseñado para registrar, revisar y mejorar tu operativa diaria en futuros NQ/MNQ. Centraliza toda la información de tus sesiones de trading en un solo lugar: los trades que ejecutas, cómo te comportaste con tus reglas, tus reflexiones del día, y estadísticas que te ayudan a identificar patrones en tu operativa.

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
│  • Ganancia/    │   • Puntos retroceso  │   • Puntos retroceso      │
│    pérdida      │   • Zonas en contra   │   • Zonas en contra       │
│  • Tipo de      │   • Setup del día     │   • Setup del día         │
│    resultado    │   • Checklist 6 reglas│   • Checklist 6 reglas    │
│    (target/stop)│   • Reflexión del día │   • Reflexión del día     │
│  • MAE y MFE    │   • Imagen del día    │                           │
│                 │   • Resumen con IA    │                           │
└─────────────────┴───────────────────────┴───────────────────────────┘
```

---

## ¿Dónde se guarda todo?

Toda la información va a una base de datos en la nube. No está en tu computador — está en internet, accesible desde cualquier dispositivo. Se organiza en dos grandes grupos:

```
┌──────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS                             │
├─────────────────────────┬────────────────────────────────────┤
│                         │                                    │
│  TABLA DE TRADES        │  TABLA DE SESIONES                 │
│  (lo automático)        │  (lo manual del trader)            │
│                         │                                    │
│  Un registro por cada   │  Un registro por día operado       │
│  trade ejecutado        │                                    │
│                         │                                    │
│  60 trades históricos   │  Contexto, corrida, setup          │
│  cargados + nuevos      │  Checklist, reflexión, imagen      │
│  automáticos desde NT8  │  Resumen generado con IA           │
│                         │                                    │
└─────────────────────────┴────────────────────────────────────┘
```

---

## ¿Qué puedes ver en el Dashboard?

El dashboard es una página web accesible desde cualquier navegador. Tiene 5 secciones:

### 📅 Sección 1 — Calendario

```
┌─────────────────────────────────────────────────────┐
│              MAYO 2026                  ← →         │
├─────┬─────┬─────┬─────┬─────┬─────┬─────────────────┤
│ Lun │ Mar │ Mié │ Jue │ Vie │                        │
├─────┼─────┼─────┼─────┼─────┤                        │
│  4  │  5  │  6  │  7  │  8  │  Resumen del mes:      │
│     │🟢   │🔴   │⚫   │🟢   │  • 18 días operados    │
│     │+$42 │-$18 │     │+$35 │  • 60 trades           │
├─────┼─────┼─────┼─────┼─────┤  • 67% win rate        │
│ 11  │ 12  │ 13  │ 14  │ 15  │  • P&L: +$487          │
│🟡   │🟢   │🔴   │⚫   │🟢   │                        │
│+$8  │+$65 │-$22 │     │+$40 │                        │
└─────┴─────┴─────┴─────┴─────┴────────────────────────┘

🟢 Target alcanzado    🔴 Stop activado
🟡 Día mixto           ⚫ No se operó
```

Al hacer clic en cualquier día aparece un panel con 4 pestañas:
- **Resumen:** lista de trades del día con ganancia/pérdida
- **Checklist:** las 6 reglas con ✅/❌ y tu score del día
- **Análisis:** contexto, setup, reflexión tuya + resumen de la IA
- **Imagen:** captura del gráfico del día

---

### 📊 Sección 2 — Métricas

Estadísticas de tu operativa con filtros por semana, mes o todo el historial:

```
┌──────────┬──────────┬──────────┬──────────┐
│ P&L NETO │ WIN RATE │  TRADES  │ SESIONES │
│  +$487   │   67%    │    60    │    18    │
└──────────┴──────────┴──────────┴──────────┘

┌──────────┬──────────┬──────────┬──────────┐
│  RACHA   │ MEJOR    │  PEOR    │ SESIONES │
│ ACTUAL   │  DÍA     │  DÍA    │ LIMPIAS  │
│ 3 wins   │  +$120   │  -$85   │  8/18    │
└──────────┴──────────┴──────────┴──────────┘
```

También muestra cuál es el error más frecuente en tu checklist.

---

### 📋 Sección 3 — Tabla de Trades

Todos tus trades en una tabla filtrable y buscable. Puedes filtrar por resultado (target/stop), buscar por fecha o instrumento, y hacer clic en cualquier fila para ver el detalle completo del día.

---

### ✍️ Sección 4 — Registrar Sesión

Formulario para documentar tu sesión del día. Si ya existe un registro para hoy, lo edita en lugar de crear uno nuevo. Al terminar de llenar el formulario puedes:
- Pulsar **"Generar resumen"** para que la IA (Claude) redacte un análisis de tu sesión
- Subir la imagen del gráfico del día

---

### 📈 Sección 5 — Análisis

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

El sistema calcula automáticamente tu **score de disciplina (X/6)** por sesión.

---

## El Bot de Telegram

En lugar de abrir el dashboard web, puedes registrar tu sesión diaria directamente desde Telegram en tu celular. El bot te hace preguntas una por una con botones para responder:

```
Tú:   /sesion

Bot:  📅 Registro de sesión — 2026-05-15
      ¿Operaste hoy?
      [ ✅ Sí, operé ]  [ ❌ No operé ]

Tú:   ✅ Sí, operé

Bot:  📊 Contexto de mercado
      ¿Cómo estaba el mercado hoy?
      [ Tendencia alcista ]
      [ Tendencia bajista ]
      [ Lateral           ]
      [ Volátil           ]
      [ Sin contexto      ]

Tú:   Lateral

Bot:  🔢 ¿Qué corrida operaste?
      [ 1ª corrida ]  [ 2ª corrida ]  [ 3ª corrida ]

      ... (continúa con velas, retroceso, zonas, setup)

Bot:  📋 Checklist de disciplina
      ❌ Zonas vigentes verificadas
      ❌ Orden precolocada a tiempo
      ✅ Máx 5 velas en corrida
      ❌ Sin noticia roja activa
      ❌ Zona con rompimiento + consecución
      ❌ Estructura IRI fluida
      [ Toggle cada regla y confirmar ]

Bot:  ✅ Sesión guardada correctamente
      📅 2026-05-15
      📊 Lateral | 3ª corrida | 4 velas
      📏 Retroceso: 50.25 pts
      📋 Disciplina: 6/6
```

---

## Resumen Visual del Sistema Completo

```
                    TRADING JOURNAL NQ FUTURES
                    ═══════════════════════════

  ┌─────────────────────────────────────────────────────────────┐
  │                    TÚ — EL TRADER                           │
  └──────────────┬───────────────────┬──────────────────────────┘
                 │                   │                   │
         En NT8  │         En el PC  │         En el     │
         operas  │         completas │         celular   │
                 │         el form   │         /sesion   │
                 ▼                   ▼                   ▼
  ┌──────────────────┐  ┌────────────────────┐  ┌────────────────┐
  │  NinjaTrader 8   │  │  Dashboard Web     │  │  Bot Telegram  │
  │                  │  │  github.io/...     │  │                │
  │  Trades se       │  │  Formulario        │  │  Preguntas     │
  │  guardan solos   │  │  de sesión         │  │  con botones   │
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
                    └─────────────┬──────────┘
                                  │
                                  ▼
                    ┌────────────────────────┐
                    │   DASHBOARD WEB        │
                    │                        │
                    │  📅 Calendario         │
                    │  📊 Métricas           │
                    │  📋 Tabla de trades    │
                    │  📈 Gráficas           │
                    └────────────────────────┘
```

---

## Beneficios del Sistema

| Antes | Con el Trading Journal |
|---|---|
| Los trades quedaban solo en NT8 | Todos los datos centralizados y accesibles |
| No había registro del contexto del día | Cada sesión documentada con setup y reflexión |
| Difícil identificar patrones de error | El checklist muestra tu error más frecuente |
| Sin métricas de disciplina | Score de disciplina por sesión y en el tiempo |
| Registrar la sesión tomaba mucho tiempo | El bot de Telegram la registra en 2 minutos |
| Las imágenes del día se perdían | Guardadas en la nube, accesibles desde el modal |
| Sin análisis externo de la sesión | La IA genera un resumen objetivo de cada día |
