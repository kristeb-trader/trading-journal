# Trading Coach — diseño

**Versión:** v1.2 · **Estado:** 🔵 **REEMPLAZADO el 24/09/2026.** El operador decidió unificar todo en el Trading Journal: el coach vive allí, sobre el que ya existe. Este documento queda como referencia de las salvaguardas, la memoria con aprobación y la cadena diaria, que el diseño de la unificación reutiliza.
**Diseño que manda ahora:** `E:/Proyectos/Trading Journal/docs/disenos/2026-09-24-unificacion-chaumer.md`
**Escrito:** 23/09/2026, a partir de la conversación con el operador de ese mismo día.

| Versión | Fecha | Qué cambió |
|---|---|---|
| v1 | 23/09/2026 | Primera versión |
| v1.1 | 23/09/2026 | El operador decide: coach dentro del portal; la fase 3 es el agente diario que reemplaza el test ciego. Nuevo apartado 12 |
| v1.2 | 24/09/2026 | Reemplazado: todo se unifica en el Trading Journal y el portal queda como pantalla para Alfredo |

> Si el código y este documento se contradicen, **manda este documento**. Si algo de aquí resulta
> inviable al implementarlo, primero se corrige el documento y se avisa; no se improvisa otra cosa.

---

## 1 · Qué es y qué no es

Un módulo del portal donde Christian **conversa con Claude sobre su operativa**: qué marcaba el plan
un día, qué hizo él, qué hizo bien, qué hizo mal y qué errores repite. El coach **aprende sobre
Christian** con los días, y solo aprende lo que Christian aprueba.

| Es | No es |
|---|---|
| un entrenador que compara lo que hiciste con lo que dicen las reglas escritas | una fuente de reglas. **Nunca crea, cambia ni relaja una regla** |
| alguien que recuerda tus patrones: horas, setups, errores repetidos | un marcador de zonas. Las zonas las marca el motor (`lector.py`), no Claude leyendo velas |
| de uso **exclusivo del operador** | visible para Alfredo ni para nadie que tenga la dirección |
| un lector de la bitácora | parte de la bitácora. La bitácora no lleva metodología ([DISENO_BACKTESTING.md](DISENO_BACKTESTING.md)); el coach va aparte y solo la lee |
| — | una conexión a la cuenta ni un emisor de órdenes |

**Decisiones del operador (23/09/2026):**
- El coach es **solo para él**.
- Casi todo se automatiza; lo manual queda en sus decisiones.
- La data del día sale de **NinjaTrader, exportada al final** de la sesión, no escrita minuto a minuto.
- El coach es un **módulo del portal (fase 2)**. **Decidido por el operador el 23/09/2026.**
  La fase 3 es otra cosa: el agente diario que reemplaza el test ciego (apartado 12).

---

## 2 · Las seis salvaguardas

Cada una se hace cumplir **en el código**, no solo pidiéndoselo al modelo en el texto de instrucciones.

| # | Riesgo | Cómo se impide |
|---|---|---|
| 1 | Alguien con la dirección gasta tus créditos | Toda ruta `/api/coach/*` exige la clave de operador (la misma `autorizado()` de [_comun.js](functions/api/backtesting/_comun.js)). Sin clave, el menú no muestra el coach. **Además:** tope de gasto en la consola de Claude y tope mensual propio en el código (`COACH_TOPE_USD`) que corta al llegar |
| 2 | El coach "aprende" metodología | Las reglas llegan **siempre frescas** desde `reglas.json` en cada compilación; el coach no las puede editar. Su memoria (el **cuaderno**) solo guarda hechos sobre ti. Todo aprendizaje entra como **propuesto** y solo cuenta cuando lo apruebas. Lo que suene a regla nueva va a **propuestas al plan**, que tú llevas a Cowork |
| 3 | Contaminar el test ciego | Las herramientas `dia` y `velas` **se niegan** a devolver nada de una fecha que no esté registrada en tu bitácora. La página tampoco enseña el gráfico del motor antes de eso |
| 4 | Tratar al motor como la verdad | El motor tiene dos agujeros conocidos ([LEEME_BACK_DIARIO.md](../05_Backtesting/test_ciego/LEEME_BACK_DIARIO.md)). El coach dice "según el motor…" y la ficha del día marca un aviso cuando el caso cae en uno de ellos. Ejemplo real: el 23/09 el motor dejó **más de una zona dentro de la banda de apertura**, y la secuencia de marcado solo admite una |
| 5 | Rellenar con price action genérico | Instrucción fija: si el plan no lo cubre, dice **"el plan no cubre este caso"** y ofrece anotarlo como propuesta. `CONTEXTUALIZACION.md` entra marcado como *recordatorios de criterio, no reglas* |
| 6 | Códigos de regla en la conversación | Instrucción fija, más un vigilante en la fase 1 que revisa las respuestas guardadas buscando `R-`, `P-` o `G-` seguido de número |

**Y una regla del portal que sigue en pie:** el coach no recibe `CIERRE_FASE_1.md` ni `ESTADO.md`. Si alguna vez
menciona la cifra del backtesting (**−91,00 pts**), tiene que dar los cuatro motivos en la misma respuesta.

---

## 3 · Las piezas

```
 TU PC                                              CLOUDFLARE (el portal)                         CLAUDE
 ─────                                              ──────────────────────                         ──────
 NinjaTrader
  └─ Exportador (AddOn)  10:45 ─► datos\dia\AAAA-MM-DD.txt
                                        │
 Tarea de Windows       10:50 ─► subir_dia.py
                                   ├─ lector.py (zonas, entradas)
                                   ├─ dia.py    (gráfico)
                                   └─ POST /api/coach/dia ──────► D1  coach_dias  (ficha)
                                                                  R2  coach/…     (velas, gráfico)

 Navegador ── /coach ─────────────────────────────► /api/coach/* ◄──── lee bt_jornadas (bitácora)
             (con tu clave)                               │
                                                          └──── Messages API ────────────────────► Opus 5
                                                                (reglas en caché + cuaderno + herramientas)
```

### 3.1 · El exportador de NinjaTrader

**Comprobado en la documentación de NinjaTrader:**
- No hay forma de lanzar su exportación de datos históricos desde fuera (ni por línea de comandos ni por tarea programada).
- Su exportación escribe **UTC con la hora de cierre de la vela**, que es lo que el proyecto ya asume.
- `BarsRequest` pide velas desde código, dentro de un **AddOn**, **sin necesidad de gráfico abierto**. Las horas que recibe y devuelve van en la zona horaria configurada en NinjaTrader.

**Qué hace:**
1. A las **10:45 Col** (hora configurable) pide las velas de 1 minuto del instrumento configurado.
2. Convierte cada hora a **UTC**, con la zona horaria de NinjaTrader, y conserva la hora de cierre.
3. Escribe `05_Backtesting\datos\dia\AAAA-MM-DD.txt` **entero**, en el formato de siempre
   (`yyyyMMdd HHmmss;o;h;l;c;v`), reemplazando el archivo si ya existía.
4. Deja una línea en su registro (`coach_pc\registro.txt`): cuántas velas escribió, la primera y la última.

**Qué NO hace:** no ve la cuenta, no ve operaciones, no manda órdenes y no se conecta a internet.

**Instrumento y rango:** los mismos que tu exportación manual de hoy. Se fijan en la fase 0 mirando varios
archivos (el del 23/09 empieza el 22/09 a las 05:01 UTC).

**Lo instalas tú.** Yo lo escribo y te lo enseño antes.

### 3.2 · `subir_dia.py` — el puente

Corre en tu PC. **Importa** `lector.py` y `dia.py` **sin modificarlos**; los dos siguen siendo de auditoría.

1. Localiza el archivo del día. Si no está (NinjaTrader cerrado), lo anota y termina sin error.
2. Corre el motor con el umbral de `PARAMETROS.md`, igual que el protocolo del test ciego.
3. Arma la **ficha del día** en JSON:
   - dirección de apertura, zonas (tipo, rango, vela, activa o no), entradas del motor, registro;
   - el umbral usado y la **huella de `lector.py`**, para saber qué versión del motor la produjo;
   - avisos de los agujeros conocidos (hoy: número de zonas dentro de la banda de apertura mayor que 1).
4. Hace el gráfico con `dia.py` en `04_Web\coach_pc\salida\`. **Nunca en `test_ciego\`**, que es de Cowork.
5. Sube la ficha, el archivo de velas y el gráfico a `POST /api/coach/dia`, con la clave leída de
   `%USERPROFILE%\.chaumer\clave`. La clave queda fuera del repositorio.
6. Si se sube dos veces el mismo día, la segunda reemplaza a la primera.

**Automático:** una tarea de Windows de lunes a viernes a las **10:50 Col**.
**A mano**, si ese día el PC estaba apagado: un acceso directo `Subir el día` en el escritorio.

> ⚠️ **Corrección a lo dicho en la conversación:** propuse "un botón *subir el día* en el portal", pero
> el portal no puede ejecutar el motor, porque está en Python y vive en tu PC. El botón manual es ese acceso directo.

### 3.3 · El portal: la página `/coach`

Cascarón estático como `backtesting.astro`; los datos llegan por `fetch`. Entra en el grupo de herramientas
del menú ([Marco.astro:47](src/componentes/Marco.astro:47)), **oculto si no hay clave de operador**.

| Zona de la pantalla | Qué muestra |
|---|---|
| Lateral | conversaciones: **del día** (una por fecha), **de la semana**, **libres** |
| Arriba | el **análisis del día** ya preparado, con el gráfico del motor |
| Centro | el chat, con la respuesta apareciendo mientras se escribe |
| Bandeja | **aprendizajes por aprobar** (aceptar / descartar) y **propuestas al plan** (exportar para Cowork) |
| Cuaderno | lo que el coach sabe de ti. Puedes retirar cualquier entrada |
| Pie | **gasto del mes** frente al tope |

Estilo: `tokens.css` y el estándar visual del proyecto. El gráfico del día es el de `dia.py`, que ya lo cumple.

### 3.4 · La API

| Ruta | Qué hace |
|---|---|
| `POST /api/coach/dia` | recibe la ficha, las velas y el gráfico de `subir_dia.py` |
| `GET  /api/coach/conversaciones` | lista las conversaciones |
| `POST /api/coach/conversaciones` | crea una conversación (del día, semanal o libre) |
| `POST /api/coach/conversaciones/:id/mensaje` | tu mensaje → respuesta de Claude en streaming, con el bucle de herramientas |
| `POST /api/coach/conversaciones/:id/cerrar` | resumen y propuesta de 1–3 aprendizajes |
| `GET/PATCH /api/coach/aprendizajes` | la bandeja y el cuaderno: aprobar, descartar, retirar |
| `GET  /api/coach/propuestas` · `…/export` | las propuestas al plan, exportables a Markdown para Cowork |
| `GET  /api/coach/uso` | gasto del mes |

Todas pasan por `autorizado()`. **Sin clave, todas cerradas, incluida la lectura.** Aquí no hay nada público.

---

## 4 · Lo que sabe el coach en cada conversación

Tres capas, de la más estable a la más cambiante, porque la caché de Claude trabaja por prefijo:

| Capa | Contenido | De dónde sale | Caché |
|---|---|---|---|
| 1 · Instrucciones fijas | quién es, las salvaguardas del apartado 2, cómo hablarte (sin códigos de regla, máximo 2 preguntas, corregir vela a vela) | `textos/coach_sistema.md`, redactado y aprobado por ti | ✅ |
| 2 · El plan | las reglas renderizadas desde `reglas.json` (enunciado, condiciones, acción, excepciones, **estado**), `PARAMETROS.md`, `GLOSARIO.md`, `CONTEXTUALIZACION.md` (etiquetado como *no son reglas*) y el **índice** de secciones del plan | generado en cada compilación por `scripts/coach-contexto.mjs` desde `src/content/` | ✅ |
| 3 · El cuaderno | los aprendizajes **aprobados** | D1 | ✅ (cambia poco) |
| — | la conversación | D1 | — |

**Tamaño estimado de las capas 1–3: ~45.000 tokens.** Se mide de verdad en la fase 1 con `count_tokens`.

**Herramientas** (las ejecuta el portal, no Claude):

| Herramienta | Devuelve | Candado |
|---|---|---|
| `bitacora(desde, hasta)` | tus jornadas y operaciones | — |
| `dia(fecha)` | la ficha del motor y el gráfico | 🔒 solo si la fecha está en tu bitácora |
| `velas(fecha, desde, hasta)` | las velas de un tramo, en hora Colombia | 🔒 igual |
| `estadisticas(desde, hasta, agrupar_por)` | acierto, puntos y P&L por setup, hora o dirección. **Lo calcula el código, no Claude** | — |
| `documento(nombre, seccion)` | una sección del plan, de `PENDIENTES.md` o de `GALERIA.md`. **Nunca** el plan entero | lista cerrada de documentos |
| `proponer_aprendizaje(texto, evidencia)` | crea un aprendizaje **propuesto** | nunca aprobado |
| `proponer_al_plan(texto, fecha, hora, precio)` | crea una propuesta al plan | — |

**Modelo:** **Claude Opus 5** (`claude-opus-5`), con razonamiento adaptativo y respuesta en streaming.
- Si el modelo se niega a responder una petición, el reintento automático en el servidor (`fallbacks`) queda activado. Se puede quitar si lo prefieres.
- Cambiar a Sonnet 5 (~40 % del coste) es una línea de configuración. **La decisión es tuya.**

**Coste estimado. No está medido; la fase 1 lo mide con los datos de uso de cada respuesta.**

| | Por vez | Al mes (21 días de mercado) |
|---|---|---|
| Análisis automático del día | ~0,35 USD | ~7 USD |
| Conversación de ~10 mensajes | ~1 USD | ~15 USD si conversas 15 días |
| Resumen semanal | ~0,50 USD | ~2 USD |
| **Total** | | **~25 USD** → tope propuesto **30 USD** |

---

## 5 · Cómo aprende

1. **Al cerrar una conversación**, el coach escribe un resumen de 3–5 líneas y propone **1–3 aprendizajes**.
   Cada uno lleva su **evidencia**, las fechas que lo sostienen. Ejemplo: *"Tres de tus últimos cuatro stops
   entraron antes de las 8:45 (15/09, 17/09, 22/09)."*
2. Van a la **bandeja**. Tú aceptas o descartas cada uno.
3. Solo los aceptados entran en el **cuaderno**, que es la capa 3 de todas las conversaciones siguientes.
4. Cualquier entrada del cuaderno se puede **retirar**. No se borra: queda como retirada, con su fecha.
5. Las **cifras** nunca son memoria del coach. Se recalculan desde la bitácora cada vez con `estadisticas`.

Tipos de aprendizaje: **patrón** (algo que repites) · **hábito** (cómo trabajas) · **preferencia** (cómo quieres que te hable).
**No existe el tipo "regla".**

---

## 6 · El día, de punta a punta

| Hora Col | Qué pasa | Quién |
|---|---|---|
| 08:31–10:30 | operas o haces tu back | **tú** |
| 10:45 | el exportador escribe el archivo del día | ⚙️ NinjaTrader |
| 10:50 | motor, gráfico y subida | ⚙️ tarea de Windows |
| cuando termines | registras la jornada en la bitácora | **tú** |
| al guardar | la bitácora avisa al coach y se prepara el análisis del día | ⚙️ |
| cuando quieras | conversas | **tú** |
| al cerrar | propone aprendizajes | ⚙️ propone, **tú apruebas** |
| viernes | resumen de la semana | ⚙️ |

**Dos matices, para no prometer de más:**
- **"Al guardar"**: tras registrar la jornada, la página de la bitácora pide el análisis y este se genera
  mientras la pestaña sigue abierta, en torno a un minuto. Si la cierras antes, se genera al abrir el coach.
  Es el único cambio que toca la bitácora: una línea en su página, **ninguna en su API**.
- **"Viernes"**: Cloudflare Pages no programa tareas por sí solo. El resumen semanal se genera **la primera
  vez que abres el coach después del viernes a las 10:30**, o con un botón. Si no lo abres, no se gasta.

---

## 7 · Base de datos — `d1/0004_coach.sql`

Mismo criterio que la bitácora: SQL corriente, horas generadas en el código y prefijo propio (`coach_`).

```sql
CREATE TABLE coach_dias (             -- la ficha que sube subir_dia.py
  fecha        TEXT PRIMARY KEY,      -- yyyy-mm-dd
  ficha        TEXT NOT NULL,         -- JSON del motor
  velas        TEXT NOT NULL,         -- clave en R2 del .txt del día
  imagen       TEXT,                  -- clave en R2 del gráfico
  huella_motor TEXT NOT NULL,         -- hash de lector.py
  umbral       INTEGER NOT NULL,
  subida_en    TEXT NOT NULL
);

CREATE TABLE coach_conversaciones (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo       TEXT NOT NULL CHECK (tipo IN ('dia','semana','libre')),
  fecha      TEXT,                    -- el día o el lunes de la semana
  titulo     TEXT,
  resumen    TEXT,                    -- al cerrar
  creada_en  TEXT NOT NULL,
  cerrada_en TEXT
);

CREATE TABLE coach_mensajes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversacion_id INTEGER NOT NULL REFERENCES coach_conversaciones(id) ON DELETE CASCADE,
  orden           INTEGER NOT NULL,
  rol             TEXT NOT NULL CHECK (rol IN ('user','assistant')),
  contenido       TEXT NOT NULL,      -- los bloques tal cual, en JSON: el razonamiento se reenvía sin tocar
  entrada_tokens  INTEGER, salida_tokens INTEGER, cache_tokens INTEGER,
  coste_usd       REAL,
  creado_en       TEXT NOT NULL
);

CREATE TABLE coach_aprendizajes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo            TEXT NOT NULL CHECK (tipo IN ('patron','habito','preferencia')),
  texto           TEXT NOT NULL,
  evidencia       TEXT,               -- JSON: fechas
  estado          TEXT NOT NULL CHECK (estado IN ('propuesto','aprobado','descartado','retirado')),
  conversacion_id INTEGER REFERENCES coach_conversaciones(id),
  creado_en       TEXT NOT NULL,
  decidido_en     TEXT
);

CREATE TABLE coach_propuestas (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  texto     TEXT NOT NULL,
  fecha     TEXT, hora TEXT, precio REAL,   -- el caso concreto
  estado    TEXT NOT NULL CHECK (estado IN ('abierta','llevada','descartada')),
  creada_en TEXT NOT NULL
);
```

**El análisis del día** es el primer mensaje de su conversación del día; no necesita tabla propia.
**Los mensajes son de solo añadir.** No se edita el historial, porque romper el historial invalida el razonamiento que se reenvía.

---

## 8 · Archivos, antes → después

```
04_Web\
  DISENO_COACH.md                         ＋ este documento
  d1\0004_coach.sql                       ＋
  functions\api\coach\                    ＋ carpeta nueva
    _comun.js                               clave, tope, precios, registro de uso
    _herramientas.js                        las siete herramientas
    _contexto.generado.js                   🚫 generado en la compilación, fuera de git
    dia.js · conversaciones\… · aprendizajes.js · propuestas\… · uso.js
  src\pages\coach.astro                   ＋
  src\componentes\Marco.astro             ～ una entrada en el menú, oculta sin clave
  src\pages\backtesting.astro             ～ una línea: avisar al coach al guardar
  textos\coach_sistema.md                 ＋ las instrucciones fijas, para que las revises
  scripts\coach-contexto.mjs              ＋ genera la capa 2 desde src\content\
  scripts\coach-vigilante.mjs             ＋ busca códigos de regla en las respuestas
  coach_pc\                               ＋ lo que corre en tu PC
    Exportador.cs                           el AddOn de NinjaTrader
    subir_dia.py
    comparar.py                             tu exportación frente a la del AddOn
    Subir el dia.bat · tarea.xml            el acceso directo y la tarea de Windows
    salida\                                 🚫 fuera de git
  package.json                            ～ + @anthropic-ai/sdk, y coach-contexto dentro de build
  wrangler.toml                           ～ COACH_TOPE_USD
  .gitignore                              ～ las dos rutas generadas
```

**Secreto nuevo:** `ANTHROPIC_API_KEY` con `wrangler pages secret put`. Nunca en el repositorio ni en el navegador.
**Dependencia nueva:** `@anthropic-ai/sdk`. Funciona en Cloudflare (usa `fetch`) y es la vía oficial; hacer las
llamadas a mano obligaría a rehacer el streaming y el bucle de herramientas. **Pide tu aprobación**, como toda dependencia nueva.
**No se toca:** `01_Plan\`, `lector.py`, `dia.py`, `test_ciego\`, la API de la bitácora.
**Nada se borra.**

---

## 9 · Plan por fases

Cada fase se verifica sola. Al cerrar cada una: `npm run verificar`, commit, push y despliegue.

### Fase 0 · El exportador de NinjaTrader (~12 llamadas)
- `Exportador.cs` + `comparar.py`. Lo instalas tú.
- **Verificado cuando** 3–5 días seguidos el archivo del AddOn y tu exportación manual **coinciden línea a
  línea** en el tramo común. Una sola diferencia reabre la fase.
- Mientras tanto sigues exportando a mano, y las fases 1 y 2 avanzan en paralelo.

### Fase 1 · El chat, sin memoria ni datos del día (~25 llamadas)
- Tablas, contexto generado, `/api/coach/conversaciones`, la página, el tope y el vigilante de códigos.
- Herramientas: `bitacora`, `estadisticas`, `documento`.
- **Verificado cuando:**
  - el tamaño real del contexto está medido con `count_tokens`;
  - el **segundo** mensaje de una conversación lee de caché (`cache_read_input_tokens > 0`);
  - una conversación de prueba sobre un día ya registrado responde sin códigos de regla;
  - la ruta rechaza sin clave (403);
  - el consumo de CPU en producción cabe en el plan de Cloudflare (ver 10.1).

### Fase 2 · Los datos del día (~20 llamadas)
- `subir_dia.py`, `POST /api/coach/dia`, R2, herramientas `dia` y `velas`, tarea de Windows y acceso directo.
- **Verificado cuando:**
  - el 23/09 sube y la ficha coincide con lo que imprime `lector.py` a mano;
  - **una fecha no registrada en la bitácora es rechazada** por `dia` y por `velas`;
  - la tarea corre sola un día.

### Fase 3 · Análisis del día y memoria (~20 llamadas)
- Análisis automático al registrar, cierre de conversación, bandeja, cuaderno y propuestas al plan.
- **Verificado contra la verdad que ya existe:** los días del test ciego con **resultado acordado** en
  `DISCREPANCIAS.md` (10/09 en adelante). El análisis del coach tiene que llegar a la misma entrada, o
  explicar por qué el motor no lo hizo. Si discrepa sin explicación, la fase no se cierra.

### Fase 4 · El resumen semanal (~8 llamadas)
- Generado al abrir tras el viernes, o con el botón.
- **Verificado** con la semana del 14 al 18/09.

---

## 10 · Lo que queda por comprobar

| # | Duda | Cómo se resuelve | En qué fase |
|---|---|---|---|
| 1 | **El plan gratuito de Cloudflare limita la CPU por petición** (10 ms). Esperar a Claude no cuenta, pero procesar el streaming sí | medirlo en producción. Si no cabe: Workers de pago, **5 USD/mes**. Eso lo decides tú | 1 |
| 2 | El instrumento y el rango exactos de tu exportación manual | mirar varios archivos de `datos\dia\` | 0 |
| 3 | Que la zona horaria de NinjaTrader convierta bien a UTC en los cambios de horario de EE. UU. (Colombia no cambia de hora; el mercado sí) | `comparar.py` sobre un día de noviembre, cuando llegue | 0 y después |
| 4 | La caché dura 5 minutos por defecto. Si entre mensaje y mensaje tardas más, se vuelve a pagar la capa 2 | medir el uso real; si compensa, caché de 1 hora (escribirla cuesta el doble) | 1 |
| 5 | `lector.py` tiene cambios sin confirmar en git ahora mismo | la huella del motor en cada ficha deja constancia de qué versión la produjo | 2 |

---

## 12 · Relación con las fases 3 y 4

**Fase 3 — el agente diario (decidido por el operador el 23/09/2026):** backtesting lo más automático posible,
todos los días, y **reemplaza el test ciego** que hoy se hace a mano en Cowork. Tendrá su propio diseño; aquí
solo consta cómo encaja con el coach.

| | Agente (fase 3) | Coach (este documento) |
|---|---|---|
| Responde | ¿qué decía el plan hoy? | ¿qué hice yo frente a eso? |
| Corre | solo, a las 10:50, antes de que registres nada. Es ciego por construcción | contigo, cuando quieras |

- **La cadena diaria es común** (exportador, tarea de Windows, motor, subida): fases 0 y 2 de este documento.
  Se construye una vez y el agente se engancha a ella.
- **La ficha del día cambia de productor:** hoy es solo la salida del motor. Cuando exista el agente, será la
  salida del agente: el motor más la revisión con IA de sus agujeros conocidos. El coach no cambia; lee la ficha igual.
- **El test ciego tiene dos mitades**, y hoy las hace Cowork: marcar el día a ciegas, y comparar con lo tuyo y
  anotar en `DISCREPANCIAS.md`. La primera la hará el agente. La segunda encaja con el coach. Se decide en el diseño de la fase 3.

**Fase 4 — el bot en NinjaTrader:** no toca este diseño. La regla del portal *"no manda órdenes ni se conecta
a la cuenta"* sigue en pie para el portal y para el coach; el bot vivirá fuera de los dos.

## 11 · Para aprobar

- [ ] El diseño en general
- [ ] La dependencia `@anthropic-ai/sdk`
- [ ] El modelo, Opus 5, y el tope mensual de 30 USD
- [ ] Empezar por la fase 0 y la fase 1 en paralelo
