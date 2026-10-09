# BotChaumer — el motor operando en NinjaTrader

**Versión:** v1.13 · **Estado:** ✅ **APROBADO** el 06/10/2026 (D-038) · 🚧 en implementación: **fases 1 y 2 cerradas · fase 3: Strategy Analyzer 17/17, falta el Market Replay** · §12 (el motor dibujado en vivo) **aprobado**: D0 cerrada · D1 cerrada · D2 con el código hecho, falta el Market Replay.
**Escrito:** 06/10/2026, tras el diagnóstico del mismo día.

| Versión | Fecha | Qué cambió |
|---|---|---|
| v1 | 06/10/2026 | Primera versión. Kris decide construir el bot ya y validarlo en una cuenta de simulación (`SimBot`) en vivo y con las herramientas de NinjaTrader sobre el pasado, y exige que **cualquier cambio de regla aprobado quede sincronizado en todo** |
| v1.1 | 06/10/2026 | **Aprobado.** Las dos preguntas de §11, con la recomendación: stop y objetivo exactos al llenarse, y GO apagado en `SimBot`. **Fase 1 cerrada**: 15 parámetros en `reglas.json` (los 6 del motor con número), `lector.py` sin un solo número del plan escrito a mano, `minimo` y `decidir()`. Verificado: `prueba_motor.py` ✅, vela a vela con `decidir()` 1.463 velas y 0 diferencias (55 con orden viva), `dia.py` y `medir.py` funcionan, `vigilar.mjs --estricto` limpio, `npm run verificar` 57 páginas y 0 fallos |
| v1.2 | 06/10/2026 | **Fase 2 cerrada.** `MotorChaumer.cs` (lector.py en C# 5), `pruebas/ArnesMotor.cs`, `scripts/bot/sincronia.py`, el `SELLO` (`L:8c98cbb36c090fb7 C:661e08ea1f6877dc`) y el hook `scripts/hooks/pre-commit`. **V0 cumplida al primer intento: 64 de 64 días idénticos** (12.983 líneas con el día entero, 7.677 velas vela a vela), parámetros y huella iguales en los dos. La prueba **sí detecta** fallos: tres de cuatro mutaciones a propósito saltaron; la cuarta (rompimiento de 1 tick exacto) no, porque ningún día con datos lo tiene — límite de cobertura apuntado en `.claude/rules/bot.md`. **Desviación de §6.1:** `MarcacionChaumer` no corre el motor entero; dibuja con `MotorChaumer.Zigzag`, la misma traducción que tenía, ahora dentro de `MotorChaumer.cs` y comparada con el zigzag del motor en cada día (líneas `ZZ`). Correr el motor entero obligaba a pasarle el premercado y los parámetros a un indicador que solo pinta. Compila con los mismos errores de referencia que la versión anterior y ninguno nuevo |
| v1.3 | 06/10/2026 | **Fase 3, el código.** `BotChaumer.cs` compila con **0 errores** contra las DLL de NT8 (csc del sistema, C# 5). Tabla `bot_operaciones` aplicada (`2026-10-06-bot-operaciones`, RLS + `auth_all` + grants, verificada). `scripts/bot/comparar.py` (adelantado de la fase 4) probado con un CSV igual al motor (11/11) y con un tick movido (lo caza). **Desviaciones de §6.3–§6.4, dentro de lo aprobado:** la ruta del repositorio y «exigir GO» van en `bot-chaumer.json`, no como propiedades (la única propiedad es el modo); candados añadidos: gráfico MNQ de 1 minuto, premercado desde las 00:00 UTC (plantilla ETH), sin posición abierta y sin operación previa del bot ese día en esa cuenta; en un gráfico solo opera en tiempo real (en el Analyzer, cuenta `Backtest`, sobre el histórico); el Market Replay escribe en `bot_operaciones` con su cuenta (`Playback101`). **Para el Analyzer:** un solo contrato y sin serie ajustada, o los precios salen desplazados (`comparar.py` lo reconoce) |
| v1.4 | 07/10/2026 | **Strategy Analyzer (MNQ 12-26, 1 min, ETH, 13/09 → 06/10): 17 de 17 días idénticos al motor** — setup, sentido, hora de la orden, precios, contratos, hora del llenado y resultado. Hizo falta: (1) corregir la hora de una orden repuesta (02/10: el motor cambia el Reingreso de las 9:23 por la Continuación de las 9:24); (2) **el 18/09 no estaba en la base de datos de NinjaTrader** (el archivo de minutos pesaba 32 bytes; la cadena sí lo tenía, del 24/09): se descargó con Tools → Historical Data → Load. Desde entonces el bot deja en el Analyzer su registro en un archivo de la pasada y anota cada día hábil con menos de 120 velas de ventana; `comparar.py` cuenta los días del motor que faltan en el CSV. Diferencias intravela: ninguna en estos 17 días |
| v1.5 | 07/10/2026 | **§12 en propuesta:** el motor dibujado en vivo (zonas, zigzag, puntos de referencia y la operación) en `MarcacionChaumer`, con `ChaumerNT.cs` compartido con el bot. Lo pide Kris |
| v1.6 | 07/10/2026 | **§12 rehecho entero.** Kris: `MarcacionChaumer` no se toca y queda independiente del bot. Se restaura su versión de `b2cd618` (la fase 2 le había quitado su zigzag propio), `sincronia.py` lo vigila sin modificarlo, y el dibujo en vivo va a un indicador nuevo, `VistaMotorChaumer` |
| v1.7 | 07/10/2026 | **§12 aprobado. D0 cerrada:** `MarcacionChaumer.cs` restaurado byte a byte a `b2cd618` (blob `9cea7cf`); `MotorChaumer.Zigzag` borrado; `sincronia.py` extrae `ZigzagChaumer` del indicador sin tocarlo y lo compara: 64/64, y una mutación en su zigzag salta. Sello nuevo `L:8c98cbb36c090fb7 C:7deb42cb5f9f9576` (solo cambió el C#: el motor de Python es el mismo) |
| v1.8 | 07/10/2026 | **D1, el código:** `ChaumerNT.cs` (configuración, sello y parámetros, lecturas de Supabase, velas en UTC) y `BotChaumer` sobre él: el diff solo mueve código, la lógica de órdenes y candados no cambia. `csc` 0 errores; el sello no cambia (`MotorChaumer.cs` intacto). Falta que el Strategy Analyzer vuelva a dar 17/17 |
| v1.9 | 07/10/2026 | **D1 cerrada:** el Strategy Analyzer con `ChaumerNT` da otra vez **17/17** y su CSV es idéntico línea a línea al de la pasada anterior en esos 17 días. Traía además el 07/10 en curso (sin velas del motor todavía: se compara tras la cadena de las 10:32) |
| v1.10 | 07/10/2026 | **D2, el código:** `VistaMotorChaumer.cs` compila con 0 errores contra las DLL de NT8. Calcula el motor al cierre de cada vela y dibuja una foto en `OnRender` (SharpDX), detrás de las velas. Propiedades `VerZonas`, `VerZigzag`, `VerReferencias`, `VerOperacion`, `VerEtiquetas`, `VerCabecera` (no `Zigzag`: se confunde con el `ZigZag` de NinjaTrader). Una orden **pendiente** también se dibuja, más tenue y hasta el borde. Etiquetas con el formato español (*29.840,75*). Falta el Market Replay del 23/09 y el 02/10 al lado de sus PNG |
| v1.11 | 07/10/2026 | **Primer cambio de regla pasado por toda la cadena (plan 3.45: al estirarse la zona, el rompimiento se cierra).** Plan, los dos motores (65/65, sello `L:bf7669a4 C:b1f08879`), fichas de sep–oct rehechas y, en el Strategy Analyzer, el bot con el motor nuevo: **18/18 iguales**, el 07/10 en NO OPERA como el motor. `sincronia.py --cambio-de-regla` para sellar tras un cambio aprobado. Dibujo (dia.py y la vista): solo los puntos de referencia entre la entrada y el objetivo, y las zonas vigentes cortadas al fin de la ventana |
| v1.12 | 07/10/2026 | **El bot distingue «encendido tarde» de una diferencia.** Si el motor llenó su orden antes de la vela en que el bot se armó (un F5 en plena ventana, como el 07/10 a las 9:36), la fila queda `NO OPERA` con `motivo` *«encendido tarde: … no se persigue»* y **sin** `diferencia`. La comparación diaria de la fase 5 (V4) deja fuera esos días: no miden al bot |
| v1.13 | 09/10/2026 | **Plan 3.46, tercera salida: el cierre por hora.** Lo que siga abierto a las 16:50 de Nueva York (`CIERRE_POR_HORA`) se cierra a mercado al terminar esa vela y se apunta como CIERRE POR HORA. Los dos motores lo miden con el cierre de esa vela (stop u objetivo en esa vela mandan); el bot cancela stop y objetivo y, con los dos cancelados, cierra a mercado (nunca dos salidas). `sincronia.py` gana un **caso sintético** (el 09/10 con velas planas hasta las 21:10 UTC: CIERRE POR HORA a las 15:50 Col, −37,00, igual en los dos motores), porque ningún día real recorre esa rama. 67/67 días idénticos, sello `L:4d3bfdd2 C:d143afbc`. La cadena exporta hasta las 16:50; `bot_operaciones` acepta el resultado; el calendario lo pinta por su signo sin contarlo como target ni stop |

---

## 1 · Qué se pide y qué no

**Se pide** (Kris, 06/10/2026):

1. Un bot en NinjaTrader que opere **el plan tal como lo marca el motor**: zonas, Continuación, Reingreso, filtros,
   noticias, Fed, una operación al día, stop y objetivo 1:1, sin gestionar.
2. Validarlo **sin esperar** a saber si el motor gana: en vivo, en una cuenta de simulación `SimBot`, y sobre el
   pasado con el Strategy Analyzer y el Market Replay de NinjaTrader.
3. **Sincronía total:** un cambio de regla aprobado llega al motor, al bot y a todo lo demás, o no llega a ninguno.

**No se pide, y queda fuera de v1:** operar en una cuenta real o en una cuenta de Apex (§9, fase 6), una pantalla del
bot en el Journal y la capa de contexto automatizada (el bot no decide si hoy se opera: §6.4).

**Se levanta una prohibición** (D-038): *«Los scripts de `05_Backtesting\` son de auditoría, nunca de operación»*. Los
scripts siguen siendo de auditoría. El único código operativo es `BotChaumer`, y solo opera las cuentas de su lista
blanca (§6.4).

---

## 2 · Lo que se comprobó antes de diseñar

| Comprobación | Resultado | Consecuencia |
|---|---|---|
| **El motor corrido vela a vela (como en vivo) contra el día entero** — 33 días de MNQ (1/09 → 6/10), 1.463 velas, decisión por decisión | **0 diferencias** en las decisiones. 16 diferencias de texto, todas en cómo se escribe la zona (bordes de final del día, `Zona.__repr__`) | **El motor no ve el futuro.** El bot puede correrlo entero en cada vela y decide lo mismo que la ficha del día |
| Lo único que impide correrlo en vivo | `lector.py:266` — `if len(S)<30: return None`: con menos de 30 velas de ventana no lee el día | Un parámetro `minimo` (30 para el día entero, 1 en vivo). Sin él, el bot no vería nada hasta las 9:01 |
| Los números del plan dentro del motor | `UMBRAL_VOL` se lee de `PARAMETROS.md`; `STOP_MAX = 80`, `TICK`, `PLAZO = 5` y `VENTANA_NOTICIA = 5` están **escritos a mano** en `lector.py`; `RIESGO_MAX` no está | **Hoy ya hay un hueco de sincronía**: si cambia `STOP_MAX` en el plan, el motor no se entera. Se cierra en la fase 1 |
| Traducir el motor a C# sin perder nada | Ya se hizo con el zigzag (`MarcacionChaumer.cs`): **100 días, 5.278 líneas, 0 diferencias** | El método está probado. Se amplía a todo el motor |
| Compilar C# fuera de NinjaTrader | El `csc` del sistema (C# 5) compila entero `CadenaDiaria.cs` contra las DLL de NT8 (`.claude/rules/ninjatrader.md`) | La comparación C# ↔ Python se automatiza sin abrir NinjaTrader |
| ¿Los trades de `SimBot` contaminan el Journal? | `SupabaseAutoExport.EsCuentaSimulada()` ignora las cuentas `Simulator`/`Playback` y las que empiezan por `Sim` | No llegan a `trades` ni a `apex_trades`. El bot lleva su propio registro (§7) |
| De dónde salen noticias y Fed | `sesion_noticias` y Fechas Especiales en Supabase; `subir_dia.py` las copia a `noticias_rojas.txt` y `dias_fed.txt` | El bot lee **la misma fuente** (Supabase), no las copias |

---

## 3 · La idea en una línea

**Una sola lógica, escrita dos veces y atada por una prueba que no deja pasar ni una diferencia.** `lector.py` sigue
siendo la referencia; `MotorChaumer.cs` es su traducción literal. Los números viven en un solo sitio y los leen los
dos. Un sello (la huella de `lector.py`) impide que el bot opere con un motor que no es el del repositorio.

```
01_Plan/reglas/*.md + PARAMETROS.md          ← la regla y el número (se cambian SOLO aquí, con el sí de Kris)
        │  leer-reglas.mjs
        ▼
01_Plan/reglas.json  { reglas, parametros }  ← GENERADO: lo leen el portal, el Journal… y ahora los dos motores
        │
        ├──► lector.py (Python, la REFERENCIA)        → cadena diaria, fichas, gráficos, medir.py, Coach
        │         ▲
        │         │  sincronia.py: vela a vela, todos los días, 0 diferencias → SELLO (huella de lector.py)
        │         ▼
        └──► MotorChaumer.cs (C#, traducción literal) → BotChaumer (opera) · MarcacionChaumer (dibuja)
                                                         └─ no arma si su sello ≠ huella de lector.py en disco
```

---

## 4 · Las fuentes únicas

| Qué | Única fuente | Quién lo lee | Antes |
|---|---|---|---|
| El texto de las reglas | `chaumer/01_Plan/reglas/*.md` | portal, Journal, Coach (sin cambios) | igual |
| **Los números** (`STOP_MAX`, `RIESGO_MAX`, `TICK`, `PLAZO_CONSECUCION`, `UMBRAL_VOL`, `VENTANA_NOTICIA`, `RATIO_TARGET`, `OPS_POR_SESION`…) | `PARAMETROS.md` → **clave `parametros` de `reglas.json`** (generada) | `lector.py`, `MotorChaumer.cs`, `medir.py` | `UMBRAL_VOL` por regex; el resto, a mano en `lector.py` |
| La lógica | `lector.py` | `MotorChaumer.cs` la traduce, con el sello | `ZigzagChaumer` era una traducción suelta |
| Noticias rojas | `sesion_noticias` (Supabase) | `subir_dia.py` (copia) y el bot (directo) | igual |
| Días de Fed | Fechas Especiales (Supabase) | ídem | igual |
| Valor del punto y comisión | `bt_cabecera` / instrumento de NT | el bot, para el P&L neto | — |

**Regla nueva para el bot:** ningún número del plan es una propiedad de la estrategia en NinjaTrader. Si fuese
editable en su ventana, se desincronizaría el primer día. La estrategia solo tiene propiedades **operativas**: modo,
ruta del repositorio y si exige el GO (§6.4).

`parametros` va **dentro** de `reglas.json`, no en un archivo nuevo: en `chaumer/` no nacen documentos (D-030).

---

## 5 · La cadena de sincronía — qué pasa cuando cambia una regla

| Paso | Quién | Qué | Qué lo vigila |
|---|---|---|---|
| 1 | Kris | Aprueba el cambio | — |
| 2 | Claude | Cambia `01_Plan/` en su commit `plan: …`, regenera `reglas.json`, `sincronizar.mjs` y huellas en Supabase, `npm run verificar` (el flujo de hoy) | `vigilar.mjs --estricto` |
| 3 | Claude | **Si es solo un número**: no hay nada más que tocar; los dos motores lo leen de `reglas.json` | `sincronia.py` igual se pasa (paso 5) |
| 4 | Claude | **Si cambia la lógica**: el cambio en `lector.py` y **el mismo** en `MotorChaumer.cs`, en el mismo commit | — |
| 5 | Claude | `python scripts/bot/sincronia.py`: regresión del motor (`prueba_motor.py`) + C# contra Python vela a vela en **todos** los días con datos. Con 0 diferencias, `--sellar` escribe en `MotorChaumer.cs` la huella nueva de `lector.py` | sale con código 1 si hay una sola diferencia |
| 6 | git | El hook `pre-commit` rechaza el commit si `lector.py` cambió y el sello de `MotorChaumer.cs` no es su huella | `scripts/hooks/pre-commit` (versionado, `core.hooksPath`) |
| 7 | Kris | **Recompilar en NinjaTrader (F5)** — el paso que el push no hace | el paso 8 |
| 8 | el bot | Cada día, antes de armarse: huella de `lector.py` en disco = su sello compilado, y `reglas.json` legible | si no cuadra **no se arma**, pasa a modo Alerta y lo dice en el registro y en una alerta de NT |
| 9 | la cadena | La ficha del día y el registro del bot llevan la huella del motor que los produjo | la comparación diaria (§8, V4) solo compara días con la misma huella |

**Qué queda sincronizado y qué no:**

- **Sincronizado por construcción:** el motor de la cadena (fichas, gráficos, calendario «Claude», Coach), `medir.py`,
  el bot y el zigzag de `MarcacionChaumer` (que pasa a usar `MotorChaumer`: una sola traducción en C#).
- **Sincronizado por el flujo de hoy, sin cambios:** el portal, el catálogo de reglas del Journal y el checklist.
- **No se sincroniza, a propósito:** `CIERRE_FASE_1.md` y el historial. Son historia.

---

## 6 · Las piezas

### 6.1 `MotorChaumer.cs` — `NinjaTrader/`

- Traducción **literal** de `lector.py`: `leer_sesion`, `Fluidez`, `detectar_setups` y sus ayudantes, con los mismos
  nombres en lo posible. Sin dependencias de NinjaTrader (clase estática, como `ZigzagChaumer`), en **C# 5** para que
  la compile el `csc` del sistema.
- Entrada: las velas del día en UTC (hora de cierre), desde las 00:00 UTC, los parámetros de `reglas.json`, las
  noticias y si es día de Fed. Salida: zonas, zigzag, eventos (el mismo texto que el motor), **la orden que debería
  estar viva ahora** y la operación.
- `const string SELLO` = huella sha256 de `lector.py` con la que pasó la sincronía.
- Absorbe `ZigzagChaumer`: `MarcacionChaumer` dibuja con `MotorChaumer`.

### 6.2 El arnés — `NinjaTrader/pruebas/ArnesMotor.cs` + `scripts/bot/sincronia.py`

- `ArnesMotor.exe` (compilado con `csc`, fuera de NT): lee un archivo de velas y escribe, **vela a vela**, la decisión
  del motor en JSON.
- `sincronia.py`: corre `prueba_motor.py`, compila el arnés, corre los dos motores vela a vela en todos los días de
  `datos/dia/` y compara decisión por decisión. Imprime las diferencias con su hora. `--sellar` solo escribe el sello
  con 0 diferencias.
- `lector.py` gana un parámetro `minimo` (por defecto 30: el día entero no cambia) y una función `decidir(V, dia, i)`
  que la prueba y el bot usan igual.

### 6.3 `BotChaumer.cs` — la estrategia

| | |
|---|---|
| Gráfico | MNQ 1 minuto, plantilla de horario **ETH** (necesita el premercado desde las 19:00 Col) |
| Cálculo | `OnPriceChange`. Al primer tick de cada vela, corre el motor sobre las velas cerradas del día |
| Órdenes | **Modo no gestionado** (unmanaged): entrada **stop-market** en el nivel del motor; al llenarse, stop y objetivo **OCO en el nivel estructural exacto** |
| Contratos | `floor(RIESGO_MAX / (riesgo × valor del punto))`, de `reglas.json` |
| Cancelación | La que diga el motor (5 velas, fin de ventana, noticia). **La vuelta al punto del stop antes de llenarse se mira tick a tick** |
| Tras el llenado | Nada más ese día. Sigue hasta stop u objetivo **aunque acabe la ventana**: `IsExitOnSessionCloseStrategy = false` (por defecto NT cierra al final de sesión, y eso rompería la regla de no cerrar por hora) |
| Horas | `Time[]` viene en hora Colombia; se pasa a UTC con `Globals.GeneralOptions.TimeZoneInfo` (como `CadenaDiaria`). Nada de horas fijas |
| Propiedades | Modo (Alerta · Automático), ruta del repositorio, exigir GO. **Ningún número del plan** |

**Una diferencia con el plan escrito, que aprueba Kris:** el plan ejecuta con la ATM `K1` (stop provisional de 80
pts ÷ contratos) y luego ajusta a mano. El bot pone el stop y el objetivo exactos **en el mismo instante del
llenado**. El resultado de la operación es el mismo, y desaparece la ventana de exposición que el plan acepta
como riesgo (P-09).

### 6.4 Los candados

| Candado | Qué hace | En `SimBot` |
|---|---|---|
| **Sello del motor** | Sin sincronía (§5, paso 8), no opera | siempre |
| **Lista blanca de cuentas** | Solo opera en las cuentas de `bot-chaumer.json` (local, como `cadena-diaria.json`). En v1: `SimBot`, `Sim101`, `Playback101` y `Backtest` | siempre |
| **Noticias leídas** | Si no puede leer las noticias de hoy de Supabase, **no opera** (un día de IPC sin noticias anotadas sería operar a ciegas) | siempre |
| **GO del checklist** | Solo se arma si hoy está `sesiones.checklist_go_at`. Aquí vive la capa de contexto: **el bot no decide si hoy se opera, lo decide Kris** | **apagado**: en `SimBot` se mide el plan mecánico puro. El registro anota si hubo GO, para medir después cuánto aporta el contexto |
| **Freno** (regla de parada) | Racha o pérdida semanal | apagado. **Obligatorio antes de una cuenta real**, con los números que ponga Kris: no se inventa (P-21) |

---

## 7 · El registro — tabla `bot_operaciones`

Los trades de `SimBot` no van a `trades` ni a `apex_trades`, y así debe ser (una tabla, un rol: D-019). El bot
escribe **una fila por día y cuenta** en una tabla nueva, con `service_role` desde un archivo local, como los
indicadores:

`fecha · cuenta · modo · sello_motor · go (bool) · setup · direccion · hora_orden · entrada · stop · objetivo ·
contratos · hora_llenado · precio_llenado · deslizamiento_ticks · resultado · puntos · pnl_neto · comision ·
eventos (jsonb) · coincide_motor (bool) · diferencia (texto)`

- Un día sin operación también tiene fila (`resultado = NO OPERA`, con sus eventos): sin ella no se distingue «no
  operó» de «no estaba encendido».
- RLS activo + `auth_all` + grants a `service_role`. Migración `docs/migrations/2026-10-XX-bot-operaciones.sql`, con
  el skill `base-de-datos`.
- Los resultados del Strategy Analyzer **no** van aquí: se exportan a CSV y los compara `scripts/bot/comparar.py`.

---

## 8 · La validación

| | Qué | Contra qué | Qué se mira |
|---|---|---|---|
| **V0** | Sincronía: C# contra Python vela a vela | `lector.py` | **0 diferencias** en todos los días. Sin esto no se pasa a nada más |
| **V1** | Relleno de velas: `CadenaDiaria` exporta un rango (12/06/2025 → hoy, unos 330 días hábiles) y el motor los marca todos | — | Es la referencia: lo que el bot **debería** haber hecho cada día |
| **V2** | **Strategy Analyzer** sobre ese rango, con resolución de llenado alta (serie de 1 tick, si NT tiene esos ticks; si no, estándar, y se dice) | V1 | Operación por operación igual al motor. Las diferencias solo pueden ser **intravela** (el motor decide por el color de la vela; NT, por los ticks) y se listan una a una. Informe: acierto, puntos, $ con el tamaño por riesgo, peor racha y caída máxima |
| **V3** | **Market Replay** (conexión Playback) en días elegidos: los de diferencias intravela, un día de noticia roja, un día de Fed y 10 al azar | V1 | El ciclo real: orden, retirada por noticia, recolocación, llenado, OCO y deslizamiento |
| **V4** | **`SimBot` en vivo**, cada día | la ficha de las 10:32 | `subir_dia.py` compara la ficha con `bot_operaciones` del día y rellena `coincide_motor` y `diferencia`. Tres caras del mismo día: motor, bot y Kris (`medir.py` ya pone a Kris al lado) |

**Para pasar a dinero real** no se fija aquí un umbral de ganancias: lo decide Kris con V2 y V4 delante. Lo que sí
es condición: V4 con coincidencia completa salvo diferencias intravela explicadas, el freno definido y las
condiciones de la cuenta leídas (las de Apex sobre trading automatizado, antes de conectar una PA).

**Dos limitaciones que se declaran, no se tapan:**

- Las noticias del pasado solo existen desde que Kris las anota en el Journal. Un día anterior sin noticias cuenta
  como día sin noticia roja: el motor ya lo trata así, así que el bot y el motor coinciden, pero **la cifra de V2
  antes de esa fecha no aplica el filtro de noticias**.
- Julio está en datos de NQ (`NQ 09-26.Last.txt`). V1 y V2 se hacen sobre MNQ, que es lo que opera el bot.

---

## 9 · Fases — cada una se verifica por separado

| Fase | Qué | Archivos | Se verifica con | Le toca a Kris |
|---|---|---|---|---|
| **1 · Números en un sitio** | `leer-reglas.mjs` añade `parametros` a `reglas.json`; `lector.py` lee de ahí `STOP_MAX`, `TICK`, `PLAZO`, `VENTANA_NOTICIA`, `UMBRAL_VOL` y `RIESGO_MAX`; parámetro `minimo` y `decidir()` | `scripts/plan/leer-reglas.mjs`, `chaumer/01_Plan/reglas.json`, `lector.py`, `medir.py` | `prueba_motor.py` 0 diferencias · `vigilar.mjs --estricto` · `npm run verificar` · el vela a vela de §2 | — |
| **2 · Motor en C# y sincronía** | `MotorChaumer.cs`, arnés, `sincronia.py`, sello, hook, `MarcacionChaumer` sobre `MotorChaumer` | `NinjaTrader/MotorChaumer.cs`, `NinjaTrader/pruebas/ArnesMotor.cs`, `scripts/bot/sincronia.py`, `scripts/hooks/pre-commit`, `NinjaTrader/MarcacionChaumer.cs` | **V0** · `csc` sin errores · el zigzag sigue igual | F5 en NT |
| **3 · El bot** | `BotChaumer.cs`, `bot-chaumer.json`, candados, `bot_operaciones` | `NinjaTrader/BotChaumer.cs`, migración | `csc` · Strategy Analyzer sobre 1/09 → 6/10 = las fichas del motor · Market Replay de 2 días | Crear la cuenta `SimBot` · F5 · bajar los datos de Market Replay |
| **4 · El pasado entero** | Relleno de velas desde el 12/06/2025 · V1 · V2 · V3 · informe | `CadenaDiaria.cs` (modo rango), `scripts/bot/comparar.py` | Diferencias listadas una a una · informe publicado | Lanzar el Strategy Analyzer y el Market Replay (o dejarme hacerlo con control del equipo) |
| **5 · SimBot en vivo** | El bot encendido cada día · comparación diaria en la cadena | `scripts/cadena/subir_dia.py` | **V4**, día a día | Tener el bot habilitado en el gráfico |
| **6 · Real** | Fuera de v1. Diseño propio cuando Kris lo decida | — | — | Freno, cuenta y sí explícito |

**Documentación que se toca al implementar** (skill `documentacion`): D-038 en `docs/decisiones.md`; la regla 4 de
`chaumer/CLAUDE.md`; una invariante en `CLAUDE.md` (*«lector.py y MotorChaumer.cs cambian juntos, con el sello»*),
el mapa del código y la fila de `bot_operaciones`; `.claude/rules/ninjatrader.md`; una regla nueva
`.claude/rules/bot.md` que se carga al abrir `lector.py`, `MotorChaumer.cs`, `BotChaumer.cs` o `01_Plan/reglas/**`;
y `tasks/current.md`.

---

## 10 · Riesgos y cosas con fecha

| | |
|---|---|
| **Diferencias intravela** | El motor decide por el color de la vela qué tocó primero; en vivo decide el tick. Es correcto que difieran: se registran, no se «arreglan» |
| **Datos de ticks del pasado** | La resolución alta del Strategy Analyzer necesita ticks históricos, y su disponibilidad depende del proveedor. Si no hay, V2 se hace en resolución estándar y lo dice; V3 cubre el detalle |
| **El PC apagado o NT caído** | Stop y objetivo son órdenes en el servidor (OCO): siguen puestos. Una orden de entrada pendiente se pierde, y el día queda como diferencia explicada |
| **2/11 — horario de invierno** | La vela base pasa a las 9:31 Col. El bot calcula la ventana con la hora de Nueva York, como el motor |
| **≈10/12 — cambio de contrato** | El gráfico del bot pasa a `MNQ 03-27`. Va al recordatorio de `tasks/current.md` junto al del AddOn |
| **El plan cambia cada semana** | Es la razón de §5: el coste de un cambio es un commit + `sincronia.py` + F5, y si falta el F5 el bot no opera |

---

## 11 · Decisiones de Kris (06/10/2026)

1. **El bot pone stop y objetivo exactos al llenarse**, en lugar de la ATM `K1` con el ajuste a mano (§6.3). ✅
2. **GO apagado en `SimBot`**: mide el plan puro y anota si hubo GO. ✅

---

## 12 · Ampliación: el motor dibujado en vivo — ✅ APROBADO (07/10/2026), segunda versión

**Lo pide Kris (07/10):** que en el gráfico donde corre el bot se dibujen solos, en vivo, el zigzag **y las zonas**. Hoy
el bot calcula todo pero no dibuja nada, y las zonas solo existen en los PNG de `dia.py`.

**Condición de Kris (07/10): `MarcacionChaumer` no se toca y queda independiente del bot.** Es el indicador de su gráfico
operativo, con el que opera a mano. La primera versión de esta propuesta lo ampliaba: descartada.

### 12.1 MarcacionChaumer vuelve a ser independiente

- **La fase 2 ya lo había tocado** (`ad78c67`): le quitó su copia del zigzag (`ZigzagChaumer`) para que usara
  `MotorChaumer.Zigzag`. Dibuja lo mismo, pero desde entonces depende de `MotorChaumer.cs`: si ese archivo faltara o no
  compilara, el indicador de Kris tampoco. Va contra lo que Kris quiere.
- **Se restaura exactamente la versión de `b2cd618`**, la que Kris usaba hasta el 06/10: su propio `ZigzagChaumer`, sin
  depender de nada del bot.
- **Para que no se separe del motor sin que nadie lo vea**, `sincronia.py` **lee** su `ZigzagChaumer` del archivo (sin
  modificarlo), lo compila aparte junto al arnés y lo compara con el zigzag del motor en todos los días, como hacía con
  `MotorChaumer.Zigzag`. Si un cambio de regla toca corridas o retrocesos, la sincronía avisa; el cambio en
  `MarcacionChaumer` se le pide a Kris, como cualquier otro cambio de ese indicador.
- `MotorChaumer.Zigzag` se borra: ya no lo usa nadie.

### 12.2 Un indicador nuevo para el gráfico del bot: `VistaMotorChaumer`

`NinjaTrader/VistaMotorChaumer.cs`, en `Custom\Indicators\`. Corre **el motor entero** (`MotorChaumer`, el mismo sellado
que opera el bot) al cierre de cada vela y dibuja lo que sale con el estándar de `dia.py`. Va en el gráfico donde corre el
bot, y en cualquier otro donde Kris lo quiera; no depende del bot ni el bot de él.

| Elemento | Cómo (de `dia.py`) |
|---|---|
| **Zonas** | Rectángulo gris `#8B93A7` desde la vela que la sostiene (`i_org`) hasta que queda inactiva (`fin`) o hasta el borde derecho; **vigente** con relleno 28 % y borde 1,5; **inactiva**, 10 % y borde fino. Geometría de cada momento: una zona que se estira se ve estirarse. Etiqueta a la derecha solo en las vigentes: *resistencia 29.840,75 – 29.845,25* |
| **Zigzag** | Línea blanca con puntos en los vértices, del `Piv` del motor entero |
| **Puntos de referencia** | Solo si en el día se presentó un reingreso: flecha punteada naranja `#FF9A3C`, tenue y cortada una vela después cuando se rompe por cierre |
| **La operación** | Franja roja entrada→stop y verde entrada→objetivo, **solo sobre el tramo** (de la vela de la orden a la de salida). Sin líneas de entrada, stop ni objetivo |
| **Cabecera** (una línea, arriba a la izquierda) | `N zonas · M vigentes` y lo que el motor tiene en marcha: *orden: Continuación alcista · entrada · stop · objetivo* o *sin operación*; en día de Fed, el aviso dorado |
| **El corte** | Como `dia.py`: al llenarse la orden del motor **no se dibujan más zonas** (R-28); el zigzag sigue hasta el resultado |

Cada pieza con su interruptor en las propiedades (zonas, zigzag, referencias, operación, etiquetas). Las velas no se tocan:
son de la plantilla del gráfico. Si en el mismo gráfico está también `MarcacionChaumer`, se apaga el zigzag de uno de los dos.

- **Dibujo en `OnRender`** (SharpDX), como `MarcacionChaumer`, no con objetos `Draw.*`: cientos de rectángulos de dibujo
  ensucian la lista del gráfico y pesan.
- **Sin Supabase también dibuja:** zonas y zigzag no dependen de noticias ni de Fed. Si no puede leerlas, no dibuja la
  operación y lo dice en la cabecera.
- **Sin sello no dibuja nada** y lo dice en la cabecera: el gráfico no puede enseñar un motor que no es el del bot.
- **Solo hoy** (en Market Replay, el día que se reproduce).

### 12.3 Lo común, en un solo sitio: `ChaumerNT.cs`

`NinjaTrader/ChaumerNT.cs` (nuevo, `Custom\AddOns\`): lo que hoy vive dentro de `BotChaumer` y necesita también la vista —
las velas del día en UTC desde `Bars`, la configuración `bot-chaumer.json`, la comprobación del sello, los parámetros y las
lecturas de Supabase (noticias, Fed). Lo usan `BotChaumer` y `VistaMotorChaumer`; **`MarcacionChaumer` no**.
`MotorChaumer.cs` no se toca (sigue sin NinjaTrader, para el arnés).

### 12.4 Fases y verificación

| Fase | Qué | Se verifica con | Le toca a Kris |
|---|---|---|---|
| **D0** | `MarcacionChaumer` restaurado tal cual (`b2cd618`) · `sincronia.py` vigila su `ZigzagChaumer` · fuera `MotorChaumer.Zigzag` | el archivo idéntico byte a byte al de `b2cd618` · `sincronia.py` 64/64 con la comparación del zigzag de `MarcacionChaumer` | copiar `MarcacionChaumer.cs` y `MotorChaumer.cs`, F5 |
| **D1** | `ChaumerNT.cs` y `BotChaumer` sobre él | `csc` 0 errores · **el Strategy Analyzer vuelve a dar 17/17** (el refactor no puede cambiar nada) | copiar, F5, Analyzer |
| **D2** | `VistaMotorChaumer` | `csc` 0 errores · **Market Replay del 23/09 y del 02/10**, el gráfico al lado del PNG del motor de ese día: mismas zonas, mismo zigzag, misma franja | copiar, F5, replay |

**Encaja con la fase 3:** el Market Replay pendiente (§9) se hace una sola vez y prueba a la vez el bot y la vista.
