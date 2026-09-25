# Fase 7 — La cadena diaria

**Versión:** v1.1 · **Estado:** 🟢 **APROBADO por Kris el 24/09/2026.** 7a y 7b cerradas; la siguiente es la 7c.
**Escrito:** 24/09/2026. Sub-diseño de la fase 7 de `docs/disenos/2026-09-24-unificacion-chaumer.md`.
**Reemplaza** el texto de la fase 7 del diseño general (10:45, tarea de Windows, motor sin modificar): el
diagnóstico demostró que así se rompía el 2/11. Al aprobarse, el diseño general pasa a apuntar aquí.

| Versión | Fecha | Qué cambió |
|---|---|---|
| v1 | 24/09/2026 | Primera versión, tras el diagnóstico y las cuatro decisiones de Kris |
| v1.1 | 24/09/2026 | Aprobado, con las velas en `motor_fichas`. Resuelta la pregunta de §11: Kris guarda las noticias desde el AddOn del checklist, que **no** marca el día como registrado — la regla se queda. **7a cerrada** |
| v1.2 | 24/09/2026 | **7b cerrada**: tres migraciones en vez de una (esquema y dos parches de datos, un propósito por archivo). El relleno cuenta también los días anteriores al 16/08 |

> Toca un script del proyecto Chaumer (`lector.py`), una tabla nueva con una política que **no** es `auth_all`
> (a propósito), el Diario, el bot de Telegram, el Coach y un AddOn de NinjaTrader. No se implementa nada hasta
> el sí de Kris.

---

## 1 · Lo decidido

| # | Decisión | Quién |
|---|---|---|
| 1 | **Todo sigue en hora Colombia.** El motor aprende que la apertura es a las 9:30 de Nueva York: vela base 8:31 en verano, **9:31 en invierno** (desde el 2/11). Claude Code toca `lector.py` **solo** para eso y lo verifica con el test ciego | Kris, 24/09 |
| 2a | **Fechas Especiales es la única lista de días de Fed**, con el criterio del plan: día con un evento rojo de la Fed en Forex Factory, el día entero. Los "FOMC Day 1" futuros (27/10 y 8/12) salen de la lista. Los pasados no se tocan | Kris, 24/09 |
| 2b | **Se arregla el agujero de los días de Fed** en `lector.py`. El 8/07 (validado NO OPERA, el motor arreglado da un Reingreso con −64,75) se le lleva a Cowork para revalidarlo | Kris, 24/09 |
| 3 | **El día queda "registrado" la primera vez que Kris lo guarda** (Diario o bot). El candado vive **en la base de datos**. El Coach sabe si el Diario se editó **después** de ver la ficha | Kris, 24/09 |
| 4 | **Un AddOn** exporta el día al cerrar la ventana operativa (10:32 / 11:32 en invierno), **recupera** los días que falten al abrir NinjaTrader y **lanza él mismo** el motor y la subida. **Sin tarea de Windows.** Kris puede cerrar NinjaTrader cuando quiera | Kris, 24/09 |

**Descartado** de `chaumer/04_Web/DISENO_COACH.md` §3.1–3.2: la hora fija 10:45/10:50, la tarea de Windows, la
clave en `%USERPROFILE%\.chaumer\clave` (se usa la de los indicadores), R2 (el gráfico va a Cloudinary, como
desde la fase 4) y las herramientas `dia`/`velas` (el Coach de aquí no tiene herramientas: la ficha va en su
contexto).

---

## 2 · Diagnóstico (del código, 24/09)

**Lo que ya existe y se reutiliza:**
- NinjaTrader está en hora Colombia fija (`SupabaseDailyLevels.cs:150`): pasar a UTC es sumar 5 h, sin DST.
- Molde de AddOn (`ChecklistChaumer.cs:41`) y de clave: `Documentos\NinjaTrader 8\supabase-service-key.txt`.
- La exportación manual de Kris: `MNQ 12-26` · Minute · Last · desde el día hábil anterior hasta hoy; formato
  `yyyyMMdd HHmmss;o;h;l;c;v`, UTC, hora de **cierre**. Kris la renombra a `AAAA-MM-DD.txt`.
- NinjaTrader: *Global merge policy* = **Merge back adjusted**; *Get data from server* ✅ (permite recuperar días).
- Python 3.13 + matplotlib en el PC. El motor da hoy: 21/09 Continuación 8:59 +23,75 · 22/09 8:37 +44,50 ·
  23/09 8:36 −28,25.

**Lo que se arregla aquí:**

| # | Problema | Dónde |
|---|---|---|
| 1 | La apertura fija a las 13:31 UTC: desde el 2/11 el motor tomaría una vela de premercado como vela base | `lector.py:72`, `:173`, `:528` |
| 2 | Los días de Fed el motor no anota rompimientos y no ve ningún reingreso; la lista de días va a mano (3 fechas) | `lector.py:22`, `:561` |
| 3 | `zoneinfo` no tiene la base de husos en este Windows (`ZoneInfoNotFoundError`) | la regla del horario de EE. UU. se calcula a mano, **sin dependencias nuevas** |
| 4 | El motor imprime `→` y `✓`: la consola de Windows (cp1252) revienta | el puente fuerza UTF-8; el motor no se toca por esto |
| 5 | En `sesiones` hay fila **antes** de registrar (niveles, zonas naranjas, GO): no sirve para saber si Kris registró | columna nueva `registrada_at` |
| 6 | La app lee con `auth_all`: un candado solo en JavaScript sería de adorno | política propia en la tabla de fichas |

---

## 3 · Cómo queda

```
 NINJATRADER (PC de Kris)                          PC                                  SUPABASE                     JOURNAL
 ────────────────────────                          ──                                  ────────                     ───────
 AddOn CadenaDiaria
   10:32 Col (11:32 invierno)  ──►  datos\dia\AAAA-MM-DD.txt
   al arrancar: recupera los                │
   últimos 5 días hábiles                   ▼
   y lanza el puente ───────────────►  scripts\cadena\subir_dia.py
                                         ├─ lector.py  (zonas, entrada)       ─────►  motor_fichas            ◄── candado ──  Coach IA
                                         ├─ dia.py     (gráfico) ─► Cloudinary        (ficha, velas,              (solo si el   (tarjeta +
                                         └─ lee umbral (PARAMETROS.md)                 enlace al gráfico)          día está      contexto)
                                            y días de Fed (catalogo_fechas)                                        registrado)
                                                                                     sesiones.registrada_at  ◄──  Diario / bot
```

**Un día normal:**

| Hora Col | Qué pasa | Quién |
|---|---|---|
| 8:31–10:30 | opera | Kris |
| 10:32 | el AddOn guarda el archivo del día | ⚙️ |
| 10:33 | motor, gráfico y subida. La ficha queda **bloqueada** si el día no está registrado | ⚙️ |
| cuando quiera | registra el día (Diario o Telegram) → se abre el candado | Kris |
| por la noche | el Coach analiza con la ficha del motor en su contexto | Kris |

**Si Kris cierra NinjaTrader antes de las 10:32:** ese día queda pendiente. La próxima vez que abra NinjaTrader,
el AddOn lo descarga, lo guarda y lanza el puente. Si quiere el Coach esa noche con la ficha, abre NinjaTrader un
momento; la tarjeta del Coach se lo recuerda.

**En invierno** todo se corre una hora (ventana 9:31–11:30, exportación a las 11:32). Lo calculan el AddOn (con
la zona de Nueva York de Windows) y el motor (con la regla de EE. UU.). Kris no hace nada.

---

## 4 · Las piezas

### 4.1 · El motor — `chaumer/05_Backtesting/lector.py` (dos cambios, nada más)

**a) La apertura sigue a Nueva York.** Una función `apertura_utc(dia)` devuelve la hora UTC de la vela base:
`1331` en horario de verano de EE. UU. y `1431` en invierno. La regla se escribe a mano (del segundo domingo de
marzo al primer domingo de noviembre, vigente desde 2007) porque `zoneinfo` no funciona en este Windows y no se
añaden dependencias. Se sustituyen los tres sitios:
- `zonas_premercado`: el premercado acaba en la apertura del día, no en `1331` fijo;
- `leer_sesion`: la ventana va de la apertura a la apertura + 1:59 (13:31–15:30 o 14:31–16:30 UTC);
- `detectar_setups`: "fin de ventana" es la última vela de esa ventana, no `col(k) >= 1029`.

`col()` (hora Colombia = UTC − 5) **no cambia**: en invierno el gráfico dirá 9:31, igual que NinjaTrader.

**b) Los días de Fed.** En `detectar_setups`, el bloque de rompimientos recorre las zonas **también** con
`solo_reingresos=True`: anota el rompimiento (`z.roto`) y, si es día de Fed, **no manda la orden de
continuación**. Es exactamente la variante con la que se auditó el 16/09. La lista `FOMC` se queda en el archivo
como valor por defecto, pero el puente la sustituye por la de Fechas Especiales (igual que hace con el umbral).

**Nada más cambia.** Todo lo demás del motor sigue siendo de Cowork. Los comentarios de las líneas cambiadas
dicen la fecha y el motivo, como el resto del archivo.

### 4.2 · La base de datos — una migración, `2026-09-2x-cadena-diaria.sql`

**`sesiones` · dos columnas:**

| Columna | La escriben | Regla |
|---|---|---|
| `registrada_at` | el Diario y el bot, al guardar el día | un trigger la **congela**: una vez puesta no se mueve ni se borra. Los indicadores de NinjaTrader nunca la mandan |
| `diario_editado_at` | el Diario y el bot, en **cada** guardado | la última vez que Kris tocó su lectura. Los guardados de NinjaTrader no la tocan |

**Relleno de los días ya registrados:** `registrada_at = updated_at` en las filas con `analisis_trader`,
`no_opero = true` o `setup` rellenos. Se cuentan antes y después.

**Tabla nueva `motor_fichas`** (una fila por día):

| Columna | Qué |
|---|---|
| `fecha` (PK) | el día |
| `estado` | `ok` · `sin_jornada` (festivo, sin ventana completa) · `error` (con el motivo en `ficha`) |
| `instrumento`, `umbral_vol`, `dia_fed` | con qué se marcó ese día, congelado |
| `ficha` (jsonb) | lo que marcó el motor (§5) |
| `velas` (text) | las velas del día en UTC (00:00 → fin de ventana), en el formato del archivo. Unos 45 KB/día, ~11 MB/año. Para el agente de la fase 3 y como copia fuera del disco; **el Coach no las lee** |
| `grafico_url` | el PNG de `dia.py` en Cloudinary (carpeta `motor`) |
| `huella_motor`, `huella_datos` | sha256 de `lector.py` y del archivo: qué versión y qué datos la produjeron |
| `origen_datos` | `addon` o `manual` |
| `generada_en`, `vista_en` | cuándo se subió y **la primera vez que Kris la vio** en el Journal |

**El candado** (a propósito **no** es `auth_all`, y así se dirá en `CLAUDE.md`):
- función `motor_dia_registrado(fecha)`: hay `sesiones.registrada_at` **o** una jornada en `bt_jornadas` de esa
  fecha (esto último, para el agente cuando haga días pasados);
- política `SELECT` para `authenticated` **solo** si `motor_dia_registrado(fecha)`. Sin políticas de escritura:
  solo `service_role` (el puente) inserta o cambia;
- función `motor_estado(fecha)` (`SECURITY DEFINER`): devuelve `sin_ficha` · `bloqueada` · el `estado`, **sin**
  contenido. Así el Journal puede decir "el motor ya marcó este día" sin poder leerlo;
- función `motor_marcar_vista(fecha)` (`SECURITY DEFINER`): pone `vista_en` la primera vez, y solo si el día
  está registrado;
- `anon` y `portal_lector`: nada. **Alfredo no ve nada de esto.**

**`catalogo_fechas`:** el 27/10 y el 8/12 ("FOMC Day 1") pasan de `tipo = 'fomc'` a `tipo = 'otro'`. Siguen en el
calendario como información, pero dejan de ser día de Fed para la disciplina y para el motor. Soft, reversible.
Los "Day 1" anteriores al 24/09 no se tocan (son de la etapa 1).

### 4.3 · El puente — `scripts/cadena/subir_dia.py` (nuevo)

Vive en el Journal (como `scripts/plan/`), **no** en `test_ciego/`, que es de Cowork. Solo usa la librería
estándar de Python más matplotlib, que ya usa `dia.py`.

```
python scripts/cadena/subir_dia.py 2026-09-23        un día
python scripts/cadena/subir_dia.py --pendientes      los últimos 7 días con archivo y sin ficha (o con otra huella)
```

1. Lee la clave de `Documentos\NinjaTrader 8\supabase-service-key.txt` (la misma de los indicadores).
2. **Umbral:** lo lee de `chaumer/01_Plan/PARAMETROS.md`, fila `UMBRAL_VOL`. Si no lo encuentra, **no inventa uno**:
   la ficha sale con `estado = error` y el motivo.
3. **Días de Fed:** `catalogo_fechas` con `tipo = 'fomc'` y `activa`. Si una noticia roja del día
   (`sesion_noticias`) dice FOMC, Fed o Powell y la fecha no está en la lista, lo apunta como aviso.
4. Corre el motor **importándolo, sin copiarlo**: `lector.leer_sesion` + `detectar_setups`, y `dia.dibujar` para el
   gráfico (en `%LOCALAPPDATA%\TradingJournal\cadena\`). Comprueba que las dos pasadas dan la misma operación.
5. Arma la ficha (§5), sube el PNG a Cloudinary (preset sin firma `trading-journal`, el mismo de la app) y hace
   *upsert* en `motor_fichas`. Subir dos veces el mismo día reemplaza.
6. **Mientras dure la verificación de la fase 7e:** si en `datos\dia\` está la exportación manual y en
   `datos\dia_auto\` la del AddOn, las compara línea a línea entre las 00:00 UTC y el fin de ventana. Usa la manual
   y apunta cualquier diferencia como aviso y en el registro.
7. Todo va a `%LOCALAPPDATA%\TradingJournal\cadena\registro.txt`, en UTF-8.

**Acceso directo de emergencia:** `scripts/cadena/Subir el dia.bat` (corre `--pendientes`). Kris lo lleva al
escritorio una vez.

### 4.4 · El AddOn — `NinjaTrader/CadenaDiaria.cs` (nuevo)

Se instala en `Documentos\NinjaTrader 8\bin\Custom\AddOns\` y arranca solo con NinjaTrader. **Sin ventana, sin
gráfico abierto, sin tocar la cuenta ni órdenes, sin internet.** Solo pide velas y escribe un archivo.

- **Cada minuto** (el primero, 1 minuto después de arrancar, para dar tiempo a la conexión): si hay una conexión
  activa, revisa los **últimos 5 días hábiles**, más hoy si ya pasó el fin de ventana + 2 min en hora de Nueva York.
  Por cada día **sin archivo**:
  1. pide con `BarsRequest` las velas de 1 minuto (Last) desde las 00:00 del día hábil anterior (como Kris);
  2. comprueba que están las 120 velas de la ventana. Si es hoy y aún no están, lo reintenta el minuto siguiente;
  3. convierte cada hora a UTC con la zona de NinjaTrader (Colombia) y conserva la de cierre;
  4. escribe `AAAA-MM-DD.txt` con `.` decimal (**cultura invariante**: el Windows de Kris usa coma) en un temporal
     y lo renombra al final, para no dejar archivos a medias.
- Si escribió algo (o al arrancar), lanza `python subir_dia.py --pendientes` **en segundo plano**, sin consola,
  con UTF-8, y guarda su salida en el registro.
- **Instrumento:** el contrato vigente según la lista de *rollover* de NinjaTrader (hoy `MNQ 12-26`; hacia el
  10/12, `MNQ 03-27`). Con la misma *merge policy* que los gráficos de Kris.
- **Configuración** en `Documentos\NinjaTrader 8\cadena-diaria.json` (la crea el AddOn con valores por defecto):
  carpeta de salida, ruta de Python y del puente, `activo`. Durante la fase 7e la carpeta es `datos\dia_auto\`.
- **Registro** en `Documentos\NinjaTrader 8\cadena-diaria\registro.txt`: día, velas escritas, primera y última.

> A comprobar al escribirlo (supuesto, no verificado): los nombres exactos de la API de NinjaTrader para el
> contrato vigente (`MasterInstrument.GetNextExpiry` o similar), la zona de NinjaTrader
> (`Core.Globals.GeneralOptions.TimeZoneInfo`) y que `BarsRequest` baje días pasados con la conexión de Kris.
> Si algo no existe, se corrige este diseño antes de seguir.

### 4.5 · El Journal

**Diario** (`js/form.js`, `collectFormData`) y **bot** (`TelegramBot/worker.js`, `saveSession`): mandan
`registrada_at` y `diario_editado_at` con la hora actual. El trigger conserva la primera `registrada_at`. **La
migración va antes** que este cambio: `/api/session` escribe el payload como columnas y una clave desconocida
revienta el guardado (PGRST204).

**Coach IA · tarjeta "Lo que marcó el motor"**, arriba de la pestaña, según `motor_estado(fecha)`:

| Estado | Qué se ve |
|---|---|
| `bloqueada` | 🔒 *El motor ya marcó este día. Se abre cuando registres tu lectura (Diario o Telegram).* |
| `sin_ficha`, día hábil, ya pasó el fin de ventana | *La ficha del motor de hoy aún no llegó. Si cerraste NinjaTrader antes de las 10:32, ábrelo un momento.* (11:32 en invierno) |
| `sin_jornada` | *No hubo sesión completa ese día.* |
| `ok` | miniatura del gráfico (se amplía al tocar) + una línea: *Continuación bajista 8:36 · STOP −28,25 pts* o *Sin operación*, y los avisos. Al pintarla, `motor_marcar_vista` |
| `error` | el motivo, en una línea |

Los días anteriores a la cadena no enseñan nada (ni tarjeta vacía).

**Coach IA · contexto** (bloque B, el del día; el bloque A del plan **no cambia**, y con él la caché de todos
los días): si la ficha está disponible, una sección **"Lo que marcó el motor ese día"**:
- dirección de apertura, zonas (hora y precio), lo que pasó en la ventana y la operación con su resultado;
- **cómo leerla**: es un script de auditoría, no la verdad. Se dice "según el motor…". Tiene dos agujeros
  conocidos (no adelanta el plazo de un rompimiento sin consecución; no está verificado contra la secuencia de
  marcado de la jornada) y la ficha avisa cuando el día cae en uno;
- si `diario_editado_at > vista_en`: *"Kris editó su lectura después de ver esta ficha; lo que escribió puede
  estar influido por ella."*

Las líneas del motor llevan códigos (`(R-40)`): **se quitan al armar el contexto**, igual que el vigilante los
quita de las respuestas. Coste: ~1.500 tokens más por día en el bloque B (≈ 0,01 USD).

---

## 5 · La ficha (`motor_fichas.ficha`)

```json
{
  "fecha": "2026-09-23",
  "apertura": { "vela": "8:31", "direccion": "bajista", "abre": 31006.25, "cierra": 30965.25 },
  "premercado": { "velas_sobre_umbral": 0, "maximo_volumen": 3990 },
  "zonas": [ { "tipo": "resistencia", "desde": 30950.0, "hasta": 30954.0, "vela": "8:35",
               "origen": "corrida|retroceso|premercado|apendice", "vigente_al_final": true } ],
  "eventos": [ "8:36  CONTINUACIÓN bajista · entrada 30925.75 · stop 30954.00 …  ✓ orden enviada" ],
  "operacion": { "setup": "Continuación", "sentido": "bajista", "hora": "8:36", "entrada": 30925.75,
                 "stop": 30954.0, "objetivo": 30897.5, "riesgo": 28.25, "resultado": "STOP",
                 "puntos": -28.25, "salida": "8:41" },
  "avisos": [ "rompimiento sin consecución a las 9:12: comprobar a mano el plazo",
              "2 zonas dentro de la banda de apertura: la secuencia de marcado admite una" ],
  "motor": { "umbral_vol": 8000, "dia_fed": false, "huella": "sha256…" }
}
```

`operacion` es `null` si no hubo entrada. Precios en **puntos**, horas en **hora Colombia** (lo que dice
`col()`), igual que `trades.entry_time`.

**Avisos que se calculan** (los agujeros conocidos, más dos de datos):

| Aviso | Cuándo |
|---|---|
| plazo | el registro del motor tiene un "plazo vencido" (rompimiento sin consecución) |
| banda de apertura | entre las dos primeras zonas de la sesión nació más de una zona. La definición exacta se ajusta en la fase 7c con el 15/09, el caso conocido |
| Fed sin fecha | noticia roja con FOMC/Fed/Powell y el día no está en Fechas Especiales |
| datos | la exportación del AddOn y la manual difieren (solo durante la fase 7e) |

---

## 6 · Archivos, antes → después

```
chaumer/05_Backtesting/lector.py        ~  apertura según Nueva York + días de Fed (§4.1)
chaumer/CLAUDE.md                       ~  "Datos y motor": la ventana en invierno (14:31–16:30 UTC)
chaumer/04_Web/PROPUESTAS_AL_PLAN.md    ~  para Cowork: el 8/07, el agujero de Fed ya cerrado en el motor,
                                           y que LEEME_BACK_DIARIO.md da la ventana solo en verano
docs/migrations/2026-09-2x-cadena-diaria.sql   ＋ (§4.2)
scripts/cadena/subir_dia.py             ＋  el puente
scripts/cadena/Subir el dia.bat         ＋  acceso directo de emergencia
scripts/cadena/prueba_motor.py          ＋  la regresión del motor (§7a), reutilizable cada vez que cambie
NinjaTrader/CadenaDiaria.cs             ＋  el AddOn
js/form.js · TelegramBot/worker.js      ~  registrada_at + diario_editado_at
js/db.js                                ~  motor_estado, getFichaMotor, marcarFichaVista
js/coach.js · css/styles.css            ~  la tarjeta y la sección del contexto
.gitignore                              —  sin cambios: datos/ ya está fuera de git (dia_auto incluido)
```

**No se toca:** `01_Plan/` (solo se lee `PARAMETROS.md`), `dia.py`, `test_ciego/`, el portal, los indicadores
existentes de NinjaTrader.

---

## 7 · Plan por fases

Cada subfase se verifica sola y termina en commit + push. Estimación en llamadas.

### 7a · El motor (~12) ✅ CERRADA el 24/09/2026
- Los dos cambios de §4.1. `scripts/cadena/prueba_motor.py` corre el motor **viejo** (de git) y el **nuevo**
  sobre todos los días disponibles y compara eventos y operación.
- **Verificado cuando:**
  - todos los días **no Fed** del test ciego (10/09–23/09, umbral 8.000) y de julio–agosto (archivo NQ, umbral
    2.000) dan **exactamente** lo mismo que hoy;
  - 16/09: los 3 reingresos descartados por los mismos motivos · 29/07: NO OPERA · 8/07: Reingreso 8:38, −64,75;
  - **invierno simulado:** el 23/09 con todas las horas +1 h da las mismas zonas y la misma operación, con las
    horas del gráfico en 9:xx;
  - `apertura_utc` da 1331 el 30/10/2026, 1431 el 2/11/2026 y 1331 el 15/03/2027.
- Entregable para Kris: el gráfico del 8/07 con el motor arreglado, para llevárselo a Cowork.

> **Medido (24/09):** 46 días no Fed idénticos, 0 distintos · Fed: 16/09 los 3 reingresos con los mismos
> motivos, 29/07 NO OPERA, 8/07 Reingreso 8:38 −64,75 · `apertura_utc` bien en 6 fechas (incluidos los dos
> cambios de hora) · invierno simulado: mismas zonas y operación, 8:36 → 9:36, vela base 09:31.
> **Desviaciones:** (1) el texto fijo "08:31 vela base" del registro del motor también pasa a calcularse (en
> invierno habría dicho 08:31); (2) el 8/07 resulta ser un **reingreso de una sola vela** (el caso sin decidir
> del 16/09): anotado para Cowork en `chaumer/04_Web/PROPUESTAS_AL_PLAN.md` junto con el cambio de la ventana
> que falta en `LEEME_BACK_DIARIO.md`.

### 7b · La base de datos (~10) ✅ CERRADA el 24/09/2026
- La migración de §4.2, aplicada por el MCP.
- **Verificado con SELECT:** columnas y trigger (una segunda escritura no mueve `registrada_at`); filas
  rellenadas, antes y después; con una ficha de prueba, como `authenticated` un día **no registrado** devuelve 0
  filas y `motor_estado` = `bloqueada`, y uno registrado devuelve la fila; `anon` no ve nada; el 27/10 y el 8/12
  en `otro`. La ficha de prueba se borra.

> **Medido (24/09):** 163 de 164 días registrados (fuera, el 07/09 festivo); un intento de mover `registrada_at`
> del 23/09 no la movió · con fichas de prueba el 23/09 (registrado) y el 07/09 (no): `authenticated` ve solo el
> 23/09; `motor_estado` = `ok` / `bloqueada` / `sin_ficha`; `authenticated` no puede insertar ni actualizar;
> `anon` y `portal_lector` no leen la tabla ni la función; `motor_marcar_vista` marca el 23/09 y no el 07/09 ·
> 27/10 y 8/12 en `otro`, 28/10 y 9/12 siguen `fomc` · fichas de prueba borradas (0 filas).
> **Desviación:** tres archivos (`2026-09-24-cadena-diaria.sql`, `-registrada-at-relleno.sql`,
> `-fed-day1-a-otro.sql`) en vez de uno, por la regla de un propósito por migración.

### 7c · El puente (~15)
- `subir_dia.py` y el `.bat`. Se sube desde los archivos manuales del **10/09 al 23/09** (y el 24/09 si Kris lo
  exporta).
- **Verificado cuando:** cada ficha coincide con lo que imprime el motor a mano (zonas y operación); el PNG abre
  desde Cloudinary; un `SELECT` cuenta las fichas y sus estados; un festivo simulado da `sin_jornada`; el aviso de
  la banda de apertura sale el 15/09.

### 7d · El Journal (~22)
- Diario, bot, `db.js`, tarjeta y contexto del Coach.
- **Verificado cuando:** `node --check` en cada `.js`; en el preview, un día registrado enseña la tarjeta con su
  gráfico, y la consola sin errores; un día sin registrar enseña el candado (se prueba con un día de septiembre sin
  `registrada_at`, que luego se restaura); guardar el Diario pone `registrada_at` y la segunda vez no la mueve
  (SELECT); el contexto del Coach lleva la sección sin códigos y **el bloque A sigue leyéndose de caché**
  (`coach_uso`); el bot se despliega solo con el push y un registro de prueba escribe las dos columnas.

### 7e · El AddOn (~12, más 3–5 días hábiles de espera)
- `CadenaDiaria.cs` escribiendo en `datos\dia_auto\`. **Kris lo instala** (pasos en §8). Kris sigue exportando
  a mano esos días, como hoy.
- **Verificado cuando:**
  - 3–5 días hábiles seguidos, el puente no apunta **ninguna** diferencia entre la exportación del AddOn y la
    manual. Una sola reabre la fase;
  - **recuperación:** un día Kris cierra NinjaTrader antes de las 10:32 y, al abrirlo, el día aparece solo;
  - el registro del AddOn no muestra errores.
- Al cerrarla: la carpeta pasa a `datos\dia\` y **Kris deja de exportar a mano**. El test ciego de Cowork sigue
  leyendo la misma carpeta.

### Cierre
Diseño general a v1.9 (fase 7 cerrada, apunta aquí) · `tasks/current.md` · D-026 en `docs/decisiones.md` (por
qué el candado no es `auth_all` y por qué el motor se tocó) · `CLAUDE.md` (fila de `motor_fichas` y de
`sesiones.registrada_at` en la tabla de Datos) · `.claude/rules/coach.md` · `.claude/rules/ninjatrader.md`.

---

## 8 · Lo que te toca a ti

| Cuándo | Qué | Cómo |
|---|---|---|
| 7a | llevar el gráfico del 8/07 a Cowork | te lo mando al terminar la 7a |
| 7c | nada | — |
| 7d | nada, salvo mirar la tarjeta si quieres | — |
| 7e | instalar el AddOn y compilarlo | te lo explico paso a paso cuando lleguemos: copiar un archivo a una carpeta, abrir el NinjaScript Editor y pulsar F5 |
| 7e, 3–5 días | seguir exportando a mano como hoy | nada nuevo |
| 7e, un día | cerrar NinjaTrader antes de las 10:32 y abrirlo más tarde | para probar la recuperación |
| 7e, una vez | llevar `Subir el dia.bat` al escritorio | clic derecho → *Enviar a* → *Escritorio (crear acceso directo)* |
| al cerrar 7e | dejar de exportar a mano | — |

---

## 9 · Riesgos

| Riesgo | Qué lo evita |
|---|---|
| El cambio del motor altera un resultado ya validado | la regresión de 7a: todos los días no Fed tienen que dar **idéntico** |
| Un guardado **antes de operar** marca el día como registrado antes de tiempo | ✅ comprobado el 24/09: Kris guarda las noticias desde el AddOn del checklist, que en `sesiones` solo escribe la fecha y las zonas naranjas (`ChecklistChaumer.cs:719`, `:809`) y nunca manda `registrada_at`. Si algún día el Diario se usa antes de operar, se revisa |
| El AddOn escribe un archivo distinto al manual | 3–5 días de comparación automática; y `huella_datos` en cada ficha |
| El cambio de contrato (≈10/12) o el de horario (2/11) rompen algo que hoy no se ve | comprobaciones fijas en §10 |
| El Coach toma al motor por la verdad | instrucción fija + avisos de sus agujeros + la ficha nunca se presenta como regla |
| Un Claude futuro "arregla" la política del candado a `auth_all` porque es la norma | D-026 y la línea en `CLAUDE.md` |
| El puente falla en silencio | registro en disco + `estado = error` en la ficha + la tarjeta lo enseña |

---

## 10 · Comprobaciones que quedan para más adelante

| Fecha | Qué se mira |
|---|---|
| **28/10** (Fed) | la ficha sale con `dia_fed` y el motor ve reingresos |
| **2/11** (invierno) | vela base 9:31; el AddOn exporta a las 11:32; comparar con la exportación manual ese día |
| **≈10/12** (cambio de contrato) | el AddOn pasa solo a `MNQ 03-27`; comparar con la exportación manual ese día |

---

## 11 · Para aprobar

- [x] El diseño en general — Kris, 24/09
- [x] Que `motor_fichas` guarde también las velas del día (~11 MB/año) — Kris, 24/09
- [x] ¿Se guarda el Diario antes de operar? — no: las noticias salen del AddOn del checklist (ver §9)
- [x] Empezar por la 7a
