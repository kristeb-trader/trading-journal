# Proyecto Chaumer

Metodología de trading de Alfredo Chaumer para **MNQ** en NinjaTrader 8, traducida a un plan mecánico de **34 reglas medibles**. Operador: **Christian**. Uso personal.

**Fase 1** 🏁 cerrada (el plan) · **Fase 2** 🚧 en curso (el portal, en `04_Web\`) · 🔴 **SESIONES EN MARCHA** desde el 14/09/2026 — protocolo en `05_Backtesting\claude\protocolo\LEEME.md` (hasta el 28/09/2026 se llamaban «test ciego»).

---

## 🔴 Las cinco reglas del proyecto — no se negocian

1. **No inventes metodología.** Ninguna regla ni umbral sale de price action genérico. Si algo falta, **falta**: se marca pendiente, no se rellena.
2. **Ningún adjetivo es una regla.** "Fuerte", "sano", "claro" no valen. Solo ticks, puntos, porcentajes, número de velas y horas exactas.
3. **No se cambia una regla confirmada** sin pedírselo al operador y esperar su sí.
4. **Los scripts de `05_Backtesting\` son de auditoría**, nunca de operación. El único código operativo es el bot
   (`NinjaTrader\BotChaumer.cs`, D-038, 06/10/2026), que opera **lo que marca el motor** y solo en las cuentas de su
   lista blanca. Por eso **un cambio que toque el marcado o los números cambia a la vez `lector.py` y
   `MotorChaumer.cs`**: diseño en `docs/disenos/2026-10-06-bot-chaumer.md` §5.
5. **Los huecos declarados quedan escritos en el plan.** El plan está escrito y contrastado, **no probado**: las sesiones de validación no se han evaluado, no hay regla de parada, falta la capa de contexto, y las cifras del backtesting no miden la estrategia. Viven en `01_Plan\PENDIENTES.md` y en `01_Plan\CIERRE_FASE_1.md`, y **de ahí no se borran**.
   🔸 *El **portal** no tiene que enseñarlos — decisión del operador, 07/09/2026. Es su herramienta personal, no un producto. Lo único que sigue en pie: si algún día el portal muestra la cifra del backtesting (**−91,00 pts**), los cuatro motivos van en la misma pantalla.*

---

## Quién hace qué

Todo se hace desde Claude Code: **Cowork dejó de existir el 25/09/2026** (D-028, en `docs/decisiones.md` del Journal). Lo que separa el trabajo ya no es la herramienta: es la **sesión** y el **commit**.

| Sesión del plan | Sesión del portal o del Journal |
|---|---|
| Las reglas y el plan · `01_Plan\` | El código del portal y del Journal |
| Los gráficos del método (PNG), que el operador revisa uno por uno | Maquetación, compilar, publicar |
| Las Sesiones (el chat «Backtesting») y auditar con los datos · `05_Backtesting\claude\` | **Nada de `01_Plan\`** |

**Un cambio de `01_Plan\` solo entra con el sí del operador, cambio a cambio — erratas incluidas.** Va en su propio commit `plan: …`, nunca mezclado con cambios del portal o del Journal, y sube la versión (cabecera de `ESTADO.md`, versión de la checklist y tabla de versiones de `HISTORIAL.md`), y se regenera `reglas.json`. No está cerrado hasta sincronizarlo: `node scripts/plan/sincronizar.mjs` desde la raíz del repo, los dos SQL por el MCP con sus huellas, y `npm run verificar` en `04_Web\`. Si tocó `lector.py`, además el mismo cambio en `NinjaTrader\MotorChaumer.cs` y `python scripts/bot/sincronia.py --sellar` (incluye la regresión `scripts/cadena/prueba_motor.py`), y avisar al operador de que recompile en NinjaTrader.

Si trabajando en otra cosa ves algo mal en el plan, **díselo al operador en ese momento**. No lo corrijas de paso, aunque sea evidente: una vez se coló así un cambio de metodología que nadie había aprobado. Si se deja para después, va a `tasks/current.md` (raíz del repo).

---

## Dónde va cada cosa — en `chaumer/` no nacen documentos

Hasta el 29/09/2026 cada chat abría su propio `.md` aquí dentro, y acabó habiendo cinco sitios con el estado y
documentos que mentían (D-030). **En `chaumer/` no se crea ningún documento nuevo.** Cada cosa va a su sitio del
Journal:

| Si es… | Va a |
|---|---|
| un diseño | `docs/disenos/AAAA-MM-DD-tema.md` |
| un pendiente | `tasks/current.md` |
| una decisión y su porqué | `docs/decisiones.md` |
| lo que pasó | `docs/historial-proyecto.md` · del plan, solo en `01_Plan\HISTORIAL.md` |
| una imagen de trabajo (una duda, una previa, una comparación) | el scratchpad de la sesión, **nunca** el repositorio |
| algo que ya no vale | `docs/archivo/chaumer/`, con su línea en el `LEEME` |

Lo único que vive en `chaumer/`: el plan (`01_Plan\`), las imágenes que publica el portal (`02_Assets\`), el portal
(`04_Web\`, con `CLAUDE.md` y `DESPLIEGUE.md`), las Sesiones (`05_Backtesting\`, con los tres documentos de su
protocolo) y este archivo.

---

## Dónde está la verdad, y qué leer para cada cosa

**Las reglas viven en `01_Plan\reglas\`: siete archivos, uno por grupo, en el orden del día** — perímetro (4) · estructura (3) · **zonas (13)** · setup y entrada (5) · riesgo y gestión (5) · filtros (3) · proceso (1). Cada regla con la misma plantilla: la regla, cómo se aplica, si no se cumple, excepciones y por qué. Es **la única fuente**: se edita ahí y en ningún otro sitio (desde el 26/09/2026; diseño en `docs/disenos/2026-09-25-reglas-chaumer.md`, en la raíz del repositorio).

`01_Plan\reglas.json` **se genera** a partir de ellos —`node scripts/plan/leer-reglas.mjs --escribir`, desde la raíz del repositorio— y **no se edita a mano**: lo leen el portal, el Journal y la ficha de las Sesiones. La historia del plan (cambios, fechas, notas de construcción) está en `01_Plan\HISTORIAL.md`, y **no se lee para trabajar**.

| Si la tarea es… | Lee SOLO |
|---|---|
| una duda de una regla | **su archivo de grupo** en `01_Plan\reglas\`, esa regla |
| cambiar un número | `01_Plan\PARAMETROS.md` |
| una definición | `01_Plan\GLOSARIO.md` |
| el porqué de una regla | su apartado **«Por qué»**, en la misma regla |
| la secuencia del día | `01_Plan\CHECKLIST_DIARIA.md` |
| qué falta / qué está abierto | `01_Plan\PENDIENTES.md` |
| casos reales | `01_Plan\GALERIA.md` |
| lo que NO es regla | `01_Plan\CONTEXTUALIZACION.md` |
| dónde estamos | `01_Plan\ESTADO.md` (la cabecera basta) |
| el portal | `04_Web\CLAUDE.md` |

> ⚠️ **Abre el archivo de grupo de la regla, no los siete.** Zonas, el más grande, son unos 35 KB.
> Si una regla y otro documento del plan se contradicen, **para y pregunta.** No elijas tú.
> Antes de cerrar un cambio del plan: `node scripts/plan/vigilar.mjs --estricto` (la plantilla, los números por nombre, los códigos).

---

## Estándar visual — fijado por el operador

| | |
|---|---|
| Fondo | negro `#0B0E14` |
| Cuadrícula | **ninguna**. Sí la línea del eje horizontal y la vertical de precios (`#3A4256`) |
| Velas | 🔵 azul `#2E86FF` alcista · ⬜ blanca `#FFFFFF` bajista |
| Zonas | **todas del mismo gris** `#8B93A7` |
| Corridas y retrocesos | línea blanca en zigzag uniendo extremos |
| Puntos de referencia | flecha punteada **naranja oscuro `#FF9A3C`**, contraste bajo, extendida a la derecha. Roto: más tenue y cortado una vela después. **Solo se dibujan cuando hay un reingreso, y solo los que quedan entre su entrada y su objetivo** (07/10/2026) |
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

- **`05_Backtesting\` tiene dos carpetas y nada más** (28/09/2026): `kris\` (el backtesting a mano del operador; las imágenes, fuera de git) y `claude\` (las Sesiones: un `AAAA-MM-DD.png` por día y su `.json`, más `protocolo\` y `motor\`).
- `05_Backtesting\claude\motor\datos\NQ 09-26.Last.txt` (julio y agosto) y `…\datos\dia\AAAA-MM-DD.txt` (un día, desde el 10/09) — `yyyyMMdd HHmmss;o;h;l;c;v`, **en UTC**.
- **Horario:** el gráfico es hora Colombia (UTC−5). Ventana **08:31–10:30 Col = 13:31–15:30 UTC** en el horario de verano de EE. UU.; **09:31–11:30 Col = 14:31–16:30 UTC** en invierno (desde el 2/11/2026). `lector.py` la calcula sola con `apertura_utc()` desde el 24/09/2026.
- **Días de Fed:** desde el 24/09/2026 el motor anota los rompimientos también en día de Fed (antes no veía ningún reingreso). La lista la pone la cadena diaria del Journal desde Fechas Especiales.
- ⚠️ El plan opera **solo MNQ** desde el 06/09/2026. Los datos de backtesting son de **NQ** y así se quedan, por decisión del operador. No intentes arreglar esa diferencia.
- `claude\motor\lector.py` reproduce el marcado · `claude\motor\dia.py` genera la gráfica de una jornada. **Los dos son auditoría.**
- **Los números del motor** (`TICK`, `STOP_MAX`, `RIESGO_MAX`, `PLAZO_CONSECUCION`, `UMBRAL_VOL`, `VENTANA_NOTICIA`) se leen de la clave `parametros` de `01_Plan\reglas.json`, que se genera de `PARAMETROS.md` (06/10/2026). Ni uno escrito a mano en el motor.
