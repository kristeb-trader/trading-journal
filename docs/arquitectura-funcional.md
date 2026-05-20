# Trading Journal NQ Futures
## Guía Funcional del Sistema

**Versión:** 2.1 | **Fecha:** Mayo 2026

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
│  • Comisión     │   • Resumen con IA    │                           │
└─────────────────┴───────────────────────┴───────────────────────────┘
```

---

## ¿Dónde se guarda todo?

Toda la información va a una base de datos en la nube. No está en tu computador — está en internet, accesible desde cualquier dispositivo. Se organiza en tres grandes grupos:

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BASE DE DATOS                                │
├─────────────────────────┬────────────────────┬───────────────────────┤
│                         │                    │                       │
│  TABLA DE TRADES        │  TABLA DE SESIONES │  TABLA FOMC_DATES     │
│  (lo automático)        │  (lo manual)       │  (referencia)         │
│                         │                    │                       │
│  Un registro por cada   │  Un registro por   │  Fechas de reuniones  │
│  trade ejecutado        │  día operado       │  FOMC 2025-2026       │
│                         │                    │                       │
│  60 trades históricos   │  Contexto, corrida │  Solo lectura,        │
│  cargados + nuevos      │  setup, checklist  │  pre-poblada          │
│  automáticos desde NT8  │  reflexión, imagen │                       │
│                         │  resumen IA        │                       │
│                         │                    │                       │
└─────────────────────────┴────────────────────┴───────────────────────┘
```

---

## ¿Qué puedes ver en el Dashboard?

El dashboard es una página web accesible desde cualquier navegador. Tiene 6 secciones:

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
- La lista de cuentas se carga de **todos los trades** (no solo el mes actual).

**Festivos CME automáticos:**
Los 10 festivos anuales del mercado CME se calculan algorítmicamente en JavaScript para cualquier año (New Year, MLK Day, Presidents' Day, Good Friday, Memorial Day, Juneteenth, Independence Day, Labor Day, Thanksgiving, Christmas). No requieren registro de sesión.

**Días FOMC:**
Las fechas FOMC se cargan desde la tabla `fomc_dates` de Supabase. Si no operaste ese día → fondo ámbar con badge "📊 FOMC". Si operaste en día FOMC → solo aparece un pequeño icono ámbar en la esquina superior izquierda de la celda.

Al hacer clic en cualquier día aparece un panel con 4 pestañas (en este orden):
- **Imagen:** captura del gráfico del día (primera pestaña)
- **Análisis:** contexto, setup, reflexión tuya + resumen de la IA
- **Checklist:** las 6 reglas con ✅/❌ y tu score del día
- **Resumen:** lista de trades del día con ganancia/pérdida

---

### 📊 Sección 2 — Métricas

Estadísticas de tu operativa. Siguen el **mes del calendario** y el **filtro de cuenta** del calendario (no el mes del sistema).

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
Evalúa 6 ítems del checklist + 1 factor "sin errores de tipificación". Incluye días "Sin setup" en el cálculo. Sub-texto muestra "N/total sesiones con fallos". Colores: ≥80% verde, 50-79% amarillo, <50% rojo. **Es clickable** → abre modal con desglose por factor (barras ordenadas de más a menos fallos + lista de días con fallos y qué factores fallaron).

**Error más frecuente:**
Muestra el error más frecuente de las **casuísticas** (tipificaciones de errores), no del checklist. Clickable → modal con frecuencia de cada casuística.

**Días operados:** incluye días "Sin setup" en el conteo.

Los filtros "semana" y "mes" sincronizan con el calendario.

---

### 🖼️ Sección 3 — Galería de Imágenes

Vista de miniaturas de las capturas de pantalla de tus sesiones.

```
┌──────────────────────────────────────────────────────────┐
│  GALERÍA DE IMÁGENES          [Mayo ▼] [Jun ▼]           │
├──────────────────────────────────────────────────────────┤
│  Semana 19 — 5 al 9 de mayo                             │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │
│  │ Lun 5  │  │ Mar 6  │  │ Mié 7  │  │ Jue 8  │         │
│  │ [img]  │  │ [img]  │  │ · · ·  │  │ [img]  │         │
│  │ borde🟢│  │ borde🔴│  │ vacío  │  │ borde🟡│         │
│  │ 🔺 ⚠️  │  │  🔻    │  │  🕐    │  │  🔺    │         │
│  └────────┘  └────────┘  └────────┘  └────────┘         │
│                                                          │
│  Semana 20 — 12 al 16 de mayo                           │
│  ...                                                     │
└──────────────────────────────────────────────────────────┘
```

**Características:**
- Barra de filtro por mes en la parte superior.
- Miniaturas agrupadas por semana.
- Borde de color por resultado: verde=target, rojo=stop, amarillo=mixto.
- Iconos: dirección del trade (largo/corto) e icono de error si hubo casuísticas.
- Días sin imagen → recuadro vacío punteado (con icono 🕐 si es fecha futura).
- **Lightbox:** al hacer clic en una miniatura se abre la imagen a pantalla completa con:
  - Flechas prev/next para navegar.
  - Teclado: ← → para navegar, Esc para cerrar.
  - Contador "3 / 12" en la esquina.

---

### 📋 Sección 4 — Tabla de Trades

Todos tus trades en una tabla filtrable y buscable. Puedes filtrar por resultado (target/stop), buscar por fecha o instrumento, y hacer clic en cualquier fila para ver el detalle completo del día.

---

### ✍️ Sección 5 — Registrar Sesión

Formulario para documentar tu sesión del día. Si ya existe un registro para hoy, lo edita en lugar de crear uno nuevo. Al terminar de llenar el formulario puedes:
- Pulsar **"Generar resumen"** para que la IA (Claude) redacte un análisis de tu sesión.
- Subir la imagen del gráfico del día.

**Motivos de no operación disponibles:**
- FOMC / Fed
- Festivo (mercado cerrado) ← nuevo
- Sin entradas válidas
- Noticia roja activa
- Motivo personal
- Otro

**Casuísticas:** Los errores de tipificación permanecen visibles en el formulario aunque se marque "No operé hoy".

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
  │  (fusión ATM)    │  │                    │  │                │
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
                    └─────────────┬──────────┘
                                  │
                                  ▼
                    ┌────────────────────────┐
                    │   DASHBOARD WEB        │
                    │                        │
                    │  📅 Calendario         │
                    │  📊 Métricas           │
                    │  🖼️  Galería           │
                    │  📋 Tabla de trades    │
                    │  ✍️  Registrar sesión  │
                    │  📈 Gráficas           │
                    └────────────────────────┘
```

---

## Beneficios del Sistema

| Antes | Con el Trading Journal |
|---|---|
| Los trades quedaban solo en NT8 | Todos los datos centralizados y accesibles |
| No había registro del contexto del día | Cada sesión documentada con setup y reflexión |
| Difícil identificar patrones de error | El checklist y las casuísticas muestran tu error más frecuente |
| Sin métricas de disciplina | Score de disciplina (7 factores) por sesión y en el tiempo, con desglose clickable |
| Registrar la sesión tomaba mucho tiempo | El bot de Telegram la registra en 2 minutos |
| Las imágenes del día se perdían | Galería de imágenes con lightbox, agrupadas por semana |
| Sin análisis externo de la sesión | La IA genera un resumen objetivo de cada día |
| No había visibilidad de festivos CME | Festivos calculados automáticamente, visibles en el calendario |
| Sin referencia de días FOMC | Días FOMC marcados desde la base de datos, con indicador visual |
| Trades con múltiples contratos ATM registrados por separado | Fusión automática de 3 seg consolida contratos en un solo trade |
