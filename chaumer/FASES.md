# FASES DEL PROYECTO CHAUMER

> **El mapa completo del proyecto.** Qué fase está hecha, cuál está en marcha y
> cuáles vienen después.
>
> Las fases 3 y 4 **están declaradas, no definidas**. Aquí solo consta lo que el
> operador ha dicho. Nada más. Cuando llegue el momento se detallan con él.

**Actualizado:** 2026-09-24

---

| | Fase | Qué es | Estado |
|---|---|---|---|
| **1** | **El plan** | extraer la metodología de Alfredo Chaumer a reglas medibles | 🏁 **cerrada** el 2026-09-01 |
| **2** | **El portal** | la web donde Alfredo revisa las reglas y deja observaciones | 🚧 **en marcha** — publicada, en revisión |
| **3** | **Agente de backtesting** | un agente de IA para hacer backtesting de la estrategia | 🔵 **declarada** — sin definir |
| **4** | **El bot** | un bot que opere la estrategia directamente en NinjaTrader | 🔵 **declarada** — sin definir |

---

## Fase 1 · El plan 🏁

**Cerrada el 2026-09-01.**

La metodología, extraída a **38 reglas medibles** con sus parámetros, su
vocabulario, su checklist diaria y 21 casos reales etiquetados.

| | |
|---|---|
| Dónde vive | `01_Plan\` |
| Qué leer primero | `01_Plan\CIERRE_FASE_1.md` |
| Fuente de verdad legible por máquina | `01_Plan\reglas.json` |

> 🚨 **Se cerró con cuatro huecos declarados.** No es un plan probado: es un plan
> escrito y contrastado. Los cuatro están en `CIERRE_FASE_1.md` y **condicionan
> directamente las fases 3 y 4** — ver abajo.

---

## Fase 2 · El portal 🚧

**En marcha.** Publicado en https://plan-operativo-nq.pages.dev

La página donde **Alfredo Chaumer** revisa las reglas que se extrajeron de su
metodología y **deja observaciones escritas**.

| | |
|---|---|
| Dónde vive | `04_Web\` |
| Seguimiento | **`04_Web\ESTADO_FASE_2.md`** |
| Módulo nuevo | ~~Trading Coach dentro del portal~~ — **reemplazado el 2026-09-24**: el coach vive en el Trading Journal |

> 🔀 **Decidido por el operador el 2026-09-24: un solo proyecto por debajo, dos webs por encima.**
> Todo lo importante (el plan, el motor, el backtesting, las bases de datos, el coach, y las fases 3 y 4)
> pasa al **Trading Journal**, dentro de una carpeta `chaumer/`. El **portal** sigue siendo su propia web y
> queda como **pantalla** para Alfredo. Alfredo no tiene acceso al Journal.
> La disciplina y la historia del Journal no se tocan; desde el 24/09 empieza una etapa nueva con las reglas del plan.
> Diseño: `E:/Proyectos/Trading Journal/docs/disenos/2026-09-24-unificacion-chaumer.md`. Se ejecuta desde una sesión en el Journal.

**Ahora mismo:** el operador está recorriendo el portal **por partes** y
reportando cambios por partes. El avance de esa revisión se lleva en
`ESTADO_FASE_2.md`.

---

## Fase 3 · Agente de backtesting 🔵

**Declarada por el operador el 2026-09-01. Todavía sin definir.**

### Lo único que consta

> Crear un **agente de IA para backtesting** de la estrategia.

**Ampliado por el operador el 2026-09-23:**

> Un agente que haga el backtesting **lo más automático posible**, que **corra
> todos los días** y que **reemplace el test ciego** que hoy se hace a mano en
> Cowork.

Consta también que **comparte con el Trading Coach la cadena diaria**:
exportación de NinjaTrader, motor y subida. Esa cadena se construye una sola vez.

### Lo que ya existe y le sirve de base

| | |
|---|---|
| `05_Backtesting\lector.py` · `motor.py` · `dia.py` · `dibujo.py` | motor de marcado de zonas, detección de setups y gráfica estándar |
| `05_Backtesting\datos\NQ 09-26.Last.txt` | datos de mercado al minuto, formato `yyyyMMdd HHmmss;o;h;l;c;v`, **en UTC** |
| `01_Plan\reglas.json` | las 38 reglas en formato legible por máquina |

> ⚠️ **Las velas van marcadas al CIERRE.** La vela de la apertura americana es la
> `1331` UTC, no la `1330`. `lector.py` ya lo hace bien. Se comprueba con el
> volumen: pasa de ~600 contratos a ~4.000 de golpe.

### Lo que hay que tener delante antes de empezar

Del cierre de la fase 1, y no son detalles menores:

1. **Las cifras del backtesting actual no miden la estrategia.** 9 operaciones,
   reglas que cambiaron durante la propia revisión, sin filtro de noticias rojas
   y sin capa de contexto. El resultado de −91,00 puntos **no es un resultado de
   la estrategia**.
2. **El test ciego nunca se ejecutó.** No hay medida de si el plan se sostiene
   solo, sin el operador corrigiendo al lado.
3. **Falta la capa de contextualización.** En las sesiones grabadas el operador
   decidió 2 de 4 días de «hoy no opero». Un backtest puramente mecánico
   contará como operables días que él no habría operado.

### Sin definir

Todo lo demás: qué hace exactamente el agente, con qué se construye, qué mide,
qué entrega y cómo se valida. **No se rellena por deducción.**

---

## Fase 4 · El bot 🔵

**Declarada por el operador el 2026-09-01. Todavía sin definir.**

### Lo único que consta

> Crear un **bot de trading que siga la estrategia directamente en
> NinjaTrader**.

**Reafirmado por el operador el 2026-09-23:** que opere **de manera automática**
en NinjaTrader.

### Restricción que ya está en firme

> 🔴 **Los documentos de `01_Plan\` no se tocan.** Confirmado por el operador el
> 2026-09-01: **son la base con la que se va a construir el bot.** El portal los
> lee y los presenta, pero no los modifica, y nada de lo que se haga en otras
> fases los reescribe.

### Lo que hay que tener delante antes de empezar

Los mismos cuatro huecos de la fase 1, y dos pesan de forma directa sobre un
ejecutor automático:

1. **No existe regla de parada.** El plan no dice cuándo se deja de operar en la
   semana ni en el mes. Cada operación arriesga el 5,3 % de la cuenta objetivo, y
   una racha de 10 días perdedores —todos con reglas cumplidas— deja la cuenta
   un 53 % abajo sin que el plan emita una sola señal de alarma.
2. **Falta la capa de contextualización.** **Un ejecutor puramente mecánico
   operará días que el operador no operaría.** Es el hueco más peligroso de los
   cuatro para esta fase concreta.

Y una regla del plan **no es verificable por una máquina**: «no se opera estando
enfermo o sin encontrarse bien mentalmente». Es la única sin criterio medible, y
el operador la mantiene así a propósito.

### Sin definir

Todo lo demás: lenguaje, arquitectura, si opera solo o pide confirmación, cómo
se prueba antes de tocar dinero real, y qué se hace con los dos huecos de
arriba. **No se rellena por deducción.**

---

## Cómo se abre una fase nueva

1. El operador la detalla. **No se deduce el alcance de una frase.**
2. Se crea su carpeta y su `ESTADO_FASE_N.md`, igual que `04_Web\ESTADO_FASE_2.md`.
3. Se apunta desde `CLAUDE.md` y desde este archivo.
4. Se cierra la fase anterior antes, o se declara explícitamente que corren en paralelo.
