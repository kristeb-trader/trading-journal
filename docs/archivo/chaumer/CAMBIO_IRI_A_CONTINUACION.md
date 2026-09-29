# CAMBIO DE NOMBRE · el setup IRI pasa a llamarse CONTINUACIÓN

| | |
|---|---|
| **Versión** | v1 · 23/09/2026 |
| **Estado** | ✅ Decisiones **aprobadas por el operador** (23/09/2026) · ✅ **① Cowork hecho el 23/09/2026** (ver §8) · ✅ **② portal hecho el 23/09/2026** (ver §9) · ⏳ ③ NinjaTrader |
| **Orden** | ① Cowork: plan, auditoría e imágenes → ② Claude Code: portal, el mismo día → ③ operador: NinjaTrader |
| **Quién lo escribe** | Claude Code, desde el portal. El portal **no edita `01_Plan\`**: esto es el encargo para Cowork |

**Registro de versiones**
- **v1 · 23/09/2026** — primera versión, tras el diagnóstico y el sí del operador.
- **v2 · 23/09/2026** — Cowork ejecuta la fase ①. Lo hecho y lo que el portal tiene que saber, en §8.
- **v3 · 23/09/2026** — el portal ejecuta la fase ②. Lo hecho y lo que queda, en §9.

---

## 1 · Lo que decidió el operador

Palabras del operador (22/09/2026):

> *"Vamos a dejar solamente 2 Setups: 1. Continuación (Antes IRI) 2. Reingreso, y las respectivas
> direcciones (Alcista y Bajista). Es decir, vamos a remplazar IRI por Continuación. Ahora cuando
> hablemos de IRI es un Impulso-Retroceso-Impulso que corresponde a la corrida normal que se necesita
> para dar paso al Setup de Continuación."*

Y confirmado el 23/09/2026 (*"si, confirmado, dale"*) sobre las tres lecturas que se le propusieron:

| # | Decisión | Consecuencia |
|---|---|---|
| **D1** | **El setup se llama Continuación.** Mismas condiciones, mismo número de regla (`R-25`). **Nada operativo cambia**: solo el nombre | Toda mención del setup pasa a «Continuación» |
| **D2** | **IRI es la estructura:** una corrida deja su zona, el precio retrocede y la corrida siguiente rompe esa zona. **Continuación = un IRI fluido + su consecución**, que es la entrada. La corrida fluida (`R-40`) es la condición que el IRI tiene que cumplir | Las menciones que ya usan IRI así («esperar un IRI nuevo entero más allá») **se quedan** |
| **D3** | **Quedan cuatro nombres:** Continuación alcista · Continuación bajista · Reingreso alcista · Reingreso bajista. **Desaparece la etiqueta «Apertura»** (IRI Apertura / IRI Continuación eran la misma mecánica) | `P-20` —dónde acaba la apertura— **se cierra**: ya no hay nada que clasificar |
| **D4** | **En las operaciones se escribe la dirección como alcista / bajista**, no largo / corto: «Continuación alcista 8:40» en vez de «IRI largo 8:40». Vale también para el Reingreso: «Reingreso bajista 8:48» | alcista = compra · bajista = venta |

---

## 2 · Cómo se reemplaza — y por qué no vale buscar y reemplazar

«IRI» hoy significa **dos cosas**, y solo una cambia. Cada línea está clasificada en el anexo:

| Clase | Qué es | Qué se hace |
|---|---|---|
| **SETUP** | IRI como nombre del setup: «no se opera IRI», «stop de un IRI» | → **Continuación** |
| **DIRECCION** | «IRI largo», «Reingreso corto»… | → «Continuación alcista», «Reingreso bajista»… (D4) |
| **ETIQUETA** | «IRI Apertura», «IRI Continuación» | Se reescribe: la etiqueta desaparece (D3). Textos en §3 |
| **ESTRUCTURA** | «otro IRI», «un IRI nuevo entero más allá», «el IRI siguiente» | **Se queda**: ya es el sentido nuevo (D2) |
| **CITA** | Palabras textuales del operador o de Chaumer | **Se queda**: cambiarla sería falsear lo que se dijo |
| **HISTORIAL** | Registro de cambios del plan, acta de cierre, tablas de resultados ya cerradas | **Se queda**: cuenta lo que pasó con los nombres de entonces. Se añade una entrada nueva con este cambio |

**Concordancia.** IRI es masculino y Continuación femenino: *el IRI → la Continuación · un IRI → una
Continuación · del IRI → de la Continuación · al IRI → a la Continuación · IRI válido → Continuación
válida · IRI descartado → Continuación descartada · IRIs → Continuaciones*. Donde la frase ya dice
«entrada de continuación» o «las continuaciones», se deja.

**Mayúscula.** Como nombre del setup, **Continuación** con mayúscula, igual que **Reingreso**. En
«entradas de continuación» sigue en minúscula.

**Un aviso de ambigüedad.** Con el nombre nuevo, *«continuación»* ya no puede usarse como sinónimo de
*consecución*. Hay un sitio donde se usa así — ver §3.8.

---

## 3 · Textos propuestos para las piezas delicadas

### 3.1 · `GLOSARIO.md` — la entrada IRI se parte en dos

La entrada `## IRI *(Impulso–Retroceso–Impulso)*` (línea 640) se sustituye por estas dos:

> ## CONTINUACIÓN
>
> Uno de los **dos únicos setups** del plan. **Opera el rompimiento que funciona.** Hasta el
> 23/09/2026 se llamaba **IRI**.
>
> Es **autocontenido**: el propio setup crea la zona que después rompe. Se construye sobre un **IRI**
> —la estructura, ver abajo— que tiene que ser **fluido** (`R-40`):
>
> `R-05` corrida → `R-06` retroceso → `R-09` zona → `R-20` rompimiento → **consecución = entrada**
>
> **Direcciones:** **Continuación alcista** (compra) · **Continuación bajista** (venta).
>
> **Plazo:** 5 velas. Lo habitual es la 1ª o la 2ª.
>
> *(la nota a CONTEXTUALIZACION sobre la consecución en la vela 3 o 4 se queda igual)*
>
> **Regla asociada:** `R-25` · **Estado:** ✅ Confirmada 24/08/2026 · renombrada 23/09/2026

> ## IRI  *(Impulso–Retroceso–Impulso)*
>
> **La estructura, no el setup.** Una corrida deja su zona, el precio retrocede, y la corrida
> siguiente rompe esa zona. No se opera por sí sola: es lo que tiene que pasar para que exista una
> **Continuación**, que es este IRI más su consecución.
>
> Para que sea operable tiene que ser **fluido** (`R-40`): el retroceso no se pasa.
>
> **Estado:** término redefinido por el operador el 23/09/2026. Antes era el nombre del setup.

Las demás menciones del glosario, según el anexo (casi todas ESTRUCTURA o CITA).

### 3.2 · `reglas.json` · `R-25`

| Campo | Hoy | Propuesto |
|---|---|---|
| `enunciado` | Setup IRI: corrida, retroceso, zona, rompimiento de esa zona y consecucion. La consecucion es la entrada. | **Setup Continuacion: un IRI —corrida, retroceso, zona y rompimiento de esa zona— y su consecucion. La consecucion es la entrada.** |
| `zona_requerida` | …No existe IRI sin zona | …No existe **Continuacion** sin zona |
| `filtro_de_target` | …El punto de referencia NO aplica al IRI | …El punto de referencia NO aplica a la **Continuacion** |
| `etiquetas_NT8` | IRI Apertura e IRI Continuacion: MISMA mecanica, la etiqueta es solo estadistica (P-20) | Se renombra la variable a **`direcciones`** con valor: **Continuacion alcista / Continuacion bajista. La etiqueta Apertura desaparece (decision del operador 23/09/2026; cierra P-20)** |
| `nota` | El IRI es autocontenido… Impulso-Retroceso-Impulso; el segundo impulso es la entrada. | **La Continuacion es autocontenida: el setup crea la zona que despues rompe. Se construye sobre un IRI (Impulso-Retroceso-Impulso): el segundo impulso rompe la zona y su consecucion es la entrada. Hasta el 23/09/2026 el setup se llamaba IRI.** |

### 3.3 · `reglas.json` · `R-26`, `R-31`, `R-32`, `R-40`

- **`R-26` nota:** *Es la contraria de la Continuacion: la Continuacion opera el rompimiento que funciona, el Reingreso el que fallo.* (el resto igual)
- **`R-31` y `R-32`:** «IRI = el extremo alcanzado…» → «**Continuacion** = el extremo alcanzado…»; «mayor que el de un IRI» → «mayor que el de una **Continuacion**».
- **`R-40`:** «Es el paso 4 del IRI (R-25)» → «Es el paso 4 de la **Continuacion** (R-25)». Las frases «un IRI nuevo entero mas alla» e «si el IRI siguiente tampoco es fluido» **se quedan**: son la estructura.

### 3.4 · `reglas.json` · `R-36` (día de la Fed)

| Campo | Propuesto |
|---|---|
| `enunciado` | **En dia de FOMC no se opera Continuacion. Solo se permite Reingreso.** |
| condición `IRI` | la variable pasa a llamarse **`Continuacion`**: PROHIBIDO (R-25) |
| `accion` | Ese dia solo se busca Reingreso. **Una Continuacion valida** se deja pasar aunque cumpla todo. |
| `nota` | …el veto de **Continuacion** todo el dia y el bloqueo de +/-5 min… (el resto igual) |

### 3.5 · `TRADING_PLAN_CHAUMER.md` · la tabla del selector de NinjaTrader (líneas 1150–1167)

La tabla de 6 entradas y la subsección «`IRI Apertura` vs `IRI Continuación`» se sustituyen por:

> | Setup | Dirección | Mecánica |
> |---|---|---|
> | **Continuación** | alcista / bajista | se construye sobre un IRI fluido |
> | **Reingreso** | alcista / bajista | distinta: opera el rompimiento que falló |
>
> **4 entradas en el menú → 2 mecánicas.** El espejo alcista/bajista no se documenta por separado.
>
> **Hasta el 23/09/2026 el menú tenía 6 entradas:** *IRI Apertura* e *IRI Continuación* eran la
> misma mecánica con dos etiquetas, solo para estadística. El operador quitó la etiqueta Apertura y
> renombró el setup: *"Vamos a dejar solamente 2 Setups: Continuación (Antes IRI) y Reingreso, y las
> respectivas direcciones (Alcista y Bajista)."* Con eso se cierra `P-20`.

La cita del 24/08 (*"Son la misma mecánica, solo que IRI Apertura…"*) puede quedarse como historia
debajo, o irse con la subsección: a criterio de Cowork.

El título de la sección de la regla, `## R-25 · Setup IRI *(Impulso–Retroceso–Impulso)*`, pasa a
**`## R-25 · Setup Continuación`**, y su primer párrafo explica que se construye sobre un IRI (§3.1).

### 3.6 · `PENDIENTES.md` · `P-20`

Se **cierra**, no se borra: *✅ CERRADO 23/09/2026 por decisión del operador. La etiqueta Apertura
desaparece: el setup es Continuación, alcista o bajista. No queda nada que clasificar.* Y su línea
«Origen: `IRI Apertura` vs `IRI Continuación`» se queda como está: es historia.

### 3.7 · `CHECKLIST_DIARIA.md`

| Línea | Propuesto |
|---|---|
| 15 | **SÍ → hoy solo Reingreso. Continuación prohibida todo el día** |
| 47 | ¿Es **Continuación** o **Reingreso**? |
| 48 y 65 | *(solo Continuación)* … — en la 65, «se espera a otro IRI que deje una zona nueva» **se queda** |
| 54 | **Continuación** · extremo del retroceso |
| 66 | ¿Es día de FOMC y el setup es una **Continuación**? |
| 70 | Tras rechazar una **Continuación** por cualquiera de los filtros… |
| 119 | **Setup**: `Continuación` / `Reingreso` · **Dirección**: alcista / bajista |

### 3.8 · `GALERIA.md`

- **Títulos:** G-01 `CONTINUACIÓN ALCISTA` · G-02 `CONTINUACIÓN BAJISTA 🔴 *el caso al límite*` (se va «APERTURA») · G-03 `CONTINUACIÓN ALCISTA · la zona superada cambia de papel` · G-04 `CONTINUACIÓN BAJISTA · zona invertida, y el stop más pequeño` · G-12 `… una Continuación rechazada y un Reingreso operado sobre la MISMA zona` · G-18 `… la primera Continuación ganadora, y una vela que hace dos cosas a la vez`.
- **G-02, línea 64:** *📌 El propio operador lo etiquetó entonces «IRI Apertura». Esa etiqueta desapareció el 23/09/2026 y `P-20` se cerró con ella.*
- **Líneas «Operación:»** y **las tablas por jornada** (resumen del test ciego y de julio): D4. «IRI largo 8:40» → «Continuación alcista 8:40» · «IRI corto» → «Continuación bajista» · «Reingreso corto» → «Reingreso bajista».
- **La tabla de lo que valida la galería** (línea 279): «`R-25` IRI» → «`R-25` Continuación».
- **G-22, línea 572:** *«La 8:36 la rompe y la 8:37 da la **continuación**»* → **«da la consecución»**. Es el único sitio donde «continuación» se usa como sinónimo de consecución, y con el nombre nuevo se leería como el setup.
- **Nombres de imagen:** `G-01_IRI_alcista.png` → `G-01_Continuacion_alcista.png`, y lo mismo para G-02 (`G-02_Continuacion_bajista.png`, sin «apertura»), G-03 y G-04. El portal resuelve por el prefijo `G-xx`, así que no se rompe nada.

### 3.9 · `ESTADO.md`, `CONTEXTUALIZACION.md`, `CIERRE_FASE_1.md`

- `ESTADO.md` línea 64 (`R-25` | **IRI**: …) → **Continuación**; línea 87 (día FOMC: IRI prohibido) → **Continuación prohibida**. Las líneas 13 y 67 son ESTRUCTURA: se quedan.
- `CONTEXTUALIZACION.md`: solo citas. No se toca nada.
- `CIERRE_FASE_1.md`: acta cerrada. No se toca nada.
- **Registro de cambios de `TRADING_PLAN_CHAUMER.md`:** entrada nueva con este cambio. Las anteriores se quedan.

---

## 4 · Auditoría (`05_Backtesting\`)

| Archivo | Qué |
|---|---|
| `lector.py` | Las etiquetas de la operación, que son lo que se dibuja en la cabecera de cada gráfica: línea 585 `IRI {'largo'…'corto'}` → `Continuación {'alcista' if nd>0 else 'bajista'}`; línea 553 `REINGRESO {'corto'…'largo'}` → `REINGRESO {'bajista' if nd<0 else 'alcista'}`; y línea 513, el aviso «SE LLENA el … largo/corto», igual. Los comentarios de las líneas 20 y 560, y la clave interna `'IRI'` de la línea 584, a criterio: si se cambia la clave, cambiarla en todos sus usos |
| `test_ciego/FICHA_MARCADO.md` | Copia de las reglas: se regenera como dice `LEEME_BACK_DIARIO.md` («Si FICHA_MARCADO.md está desactualizada») después de cambiar `reglas.json` |
| `test_ciego/DISCREPANCIAS.md` | Es un diario: lo ya escrito es HISTORIAL. Lo nuevo, con los nombres nuevos |

---

## 5 · Imágenes (Cowork)

| Imagen | Qué tiene | Qué necesita |
|---|---|---|
| `04_Web\public\conceptos\27-setup-iri.png` | Título grande «IRI», antetítulo «SETUP · CONTINUACIÓN» | Título **Continuación**; el antetítulo pasa a explicar la estructura: *«sobre un IRI · Impulso — Retroceso — Impulso»*. **Nombre nuevo: `27-setup-continuacion.png`** (el portal cambia la ruta en su fase) |
| `02_Assets\galeria\G-01…G-04` | «IRI» en el nombre (y probablemente en el título dibujado) | Renombrar (§3.8) y, si llevan «IRI» dibujado, rehacer el rótulo |
| Gráficas de las sesiones de julio con operación de IRI (7, 9, 10, 15, 16, 17 y 20 de julio) | Cabecera «Operación · IRI corto a las…» y la flecha «IRI corto · 8:38» | Regenerar con `dia.py` después de cambiar `lector.py`. **Las de Reingreso también** (6 y 13 de julio), por D4 |
| Gráficas del test ciego (`test_ciego\Back_claude\`) | Las que tienen operación dicen «IRI largo…» o «Reingreso corto…» | Regenerar igual. **Sin tocar el veredicto**: solo cambia la etiqueta |
| `02_Assets\NT8_selector_setups.png` | La captura del menú de 6 entradas | Nueva captura cuando el operador cambie su NinjaTrader (§7) |

---

## 6 · El portal (Claude Code) — después de ①, el mismo día

| Fase | Qué | Cómo se verifica |
|---|---|---|
| **P1 · páginas** | `setups.astro`: la sección pasa a **«Continuación»** con ancla `#continuacion` (y `#iri` se conserva como ancla muda para no romper enlaces guardados). El título deja de ser «IRI (Impulso - Retroceso - Impulso)»; el IRI se explica **dentro** como la estructura, con el texto del glosario nuevo. El diagrama de flujo, la tabla que compara los dos setups, los textos alternativos y la ruta de la lámina 27. `filtros.astro` (6), `entrada.astro` (3), `jornada.astro` (1) y el subtítulo del módulo en `src\lib\modulos.mjs` | `npm run verificar` en verde; captura de Setups |
| **P2 · textos y sellos** | Regenerar `textos\03-setups.md`, `04`, `05` y `06` solo en las secciones cambiadas. Revisar y **sellar** los textos nuevos de `R-25`, `R-26` y `R-36` en el vigilante de referencias | `aprobados` y `referencias` en verde |
| **P3 · vigilante de nombres** | Un vigilante nuevo que falla si el HTML publicado dice «IRI largo/corto», «IRI Apertura» o «setup IRI»: así el nombre viejo no vuelve a colarse | falla a propósito con una frase de prueba, pasa sin ella |
| **P4 · lo que se actualiza solo** | Casos reales (títulos y veredictos), fichas de regla y el filtro por regla leen el plan: basta con recompilar. **Comprobar** que las tarjetas del test ciego y de julio dicen «Continuación alcista/bajista» | búsqueda en `dist\` de `IRI` y revisión de lo que quede |
| **P5 · instrucciones** | `CLAUDE.md` de la raíz, vocabulario: *«**Continuación** (el setup; antes IRI) · **IRI** (impulso–retroceso–impulso: la estructura que da paso a la Continuación)»* | — |
| **P6 · publicar** | Desplegar, commit y push | el sitio publicado responde con los nombres nuevos |

**Lo que el portal ya tiene a favor:** la bitácora de backtesting guarda el setup como `continuacion`
/ `reingreso` desde el principio (`d1\0002_backtesting.sql`). **La base de datos no se toca.**

---

## 7 · El operador

En NinjaTrader, el selector de setups pasa de 6 entradas a 4: **Continuación Alcista · Continuación
Bajista · Reingreso Alcista · Reingreso Bajista**. Después, una captura nueva para `02_Assets\`.

---

## 8 · Fase ① hecha por Cowork — 23/09/2026

**Plan (`01_Plan\`), versión 3.12:** `reglas.json`, `TRADING_PLAN_CHAUMER.md`, `GLOSARIO.md` (26 términos: la entrada IRI partida en CONTINUACIÓN + IRI), `CHECKLIST_DIARIA.md`, `GALERIA.md`, `PENDIENTES.md` (`P-20` cerrado) y `ESTADO.md`. Citas, historial, `CONTEXTUALIZACION.md` y `CIERRE_FASE_1.md` sin tocar, como pedía §2. **Siguen 40 reglas.**

**⚠️ Tres cosas que el portal tiene que saber:**

1. **Nombres de variable que cambian en `reglas.json`** — si algún parser o vigilante los lee por nombre, hay que actualizarlo:
   - `R-25`: `etiquetas_NT8` → **`direcciones`** (lo pedía §3.2)
   - `R-36`: `IRI` → **`Continuacion`** (lo pedía §3.4)
   - `R-32`: `stop_IRI_largo` → **`stop_Continuacion_alcista`** · `stop_IRI_corto` → **`stop_Continuacion_bajista`** · `stop_IRI` → **`stop_Continuacion`**. *No estaban en el anexo; se cambiaron por coherencia con D1 y D4.*
2. **`R-25` estado:** ahora dice *"confirmada · renombrada de IRI a Continuacion el 23/09/2026 (solo el nombre, nada operativo)"*.
3. **Imagen nueva:** `public\conceptos\27-setup-continuacion.png`. La vieja `27-setup-iri.png` **sigue en su sitio** hasta que P1 cambie la ruta; después se puede borrar.

**Auditoría (`05_Backtesting\`):** `lector.py` y `dia.py` escriben ya «Continuación alcista/bajista» y «Reingreso alcista/bajista». La etiqueta también estaba en `dia.py` (cabecera y flecha de la gráfica), que el §4 no nombraba. **Regresión: 20 jornadas (11 de julio + 9 del test ciego), el motor da exactamente los mismos eventos y las mismas operaciones con el código viejo y el nuevo.** `FICHA_MARCADO.md` regenerada: solo cambian los nombres.

**Gráficas regeneradas:** las 6 del test ciego con operación (10, 15, 17, 18, 21 y 22 de septiembre) — antes de tocarlas se comprobó que las viejas eran **idénticas píxel a píxel** a lo que da el motor, así que solo cambia la etiqueta. Y 4 de julio: 6, 10, 13 y 15.

**⏳ Pendiente de decisión del operador:**
- **Julio 7, 9, 16, 17 y 20** (`02_Assets\galeria\sesiones\`): esas gráficas se dibujaron **antes del 14/09** y enseñan operaciones que la regla de la corrida fluida retiró. Regenerarlas no cambiaría solo la etiqueta: cambiaría la operación que muestran. **No se han tocado.**
- **G-02:** es una captura real del NinjaTrader del operador con el rótulo *«SETUP IRI APERTURA BAJISTA»* dibujado a mano por él. **No se ha tocado.**
- **G-01…G-04:** el renombrado de archivos está en `_renombrar_galeria_continuacion.ps1` (raíz del proyecto), porque desde Cowork no se puede renombrar en el disco. `GALERIA.md` ya apunta a los nombres nuevos.

---

## 9 · Fase ② hecha por el portal — 23/09/2026

| Fase | Hecho | Verificado |
|---|---|---|
| **P1 · páginas** | Setups: la sección es **Continuación** (`#continuacion`), explica el IRI como la estructura con el texto del glosario, y la tarjeta de «Solo hay dos» dice *Continuación · Rompimiento que funciona*. La lámina apunta a `27-setup-continuacion.png`. Filtros (5), Mecánica de entrada (3), Jornada (1) y el subtítulo del módulo | `npm run verificar` en verde, 56 páginas |
| **Ancla vieja** | `/setups#iri` sigue abriendo el apartado de Continuación. Arreglado en `Modulo.astro` para todos los módulos: un ancla que vive **dentro** de un apartado abre ese apartado (antes caía en el primero) | navegador: `#iri` → apartado 2 de 5 |
| **P2 · textos y sellos** | `textos/03`, `04`, `05` y `06` regenerados. Entran también dos arreglos anteriores que no habían llegado a los textos: el tick con su valor en puntos y la frase del plazo de la orden. `R-25` y `R-36` revisadas y selladas: solo cambió el nombre | `referencias` y `aprobados` en verde |
| **P3 · vigilante** | `scripts/nombres.mjs`, dentro de `npm run verificar`: falla si el HTML dice «IRI largo/corto/alcista/bajista», «IRI Apertura», «IRI Continuación», «setup IRI», «IRI prohibido» o «Reingreso largo/corto». Las citas textuales entre comillas quedan fuera | una página de prueba con tres frases viejas y una cita: caza las tres, deja pasar la cita |
| **P4 · lo automático** | Casos reales, fichas de regla y filtro leen el plan: las tarjetas dicen «Continuación alcista 8:40» y los cuatro ejemplos «CONTINUACIÓN ALCISTA/BAJISTA», con sus imágenes renombradas | navegador |
| **P5 · instrucciones** | `CLAUDE.md` de la raíz, vocabulario | — |

**Una línea que se le pasó a ①** (el portal no edita el plan): `CHECKLIST_DIARIA.md` línea 70, al final —
*«Caso real: `G-12`, 06/07/2026, **IRI descartado** y Reingreso operado…»* → **«Continuación descartada y
Reingreso operado…»**. Sale publicada en la página de la checklist. El vigilante no la caza porque «IRI
descartado» no es una de sus formas: se añadió solo lo inequívoco.

**Lo que queda de «IRI» en el portal** después del cambio son 28 frases, revisadas una a una: todas son la
estructura («esperar un IRI nuevo entero más allá», «se construye sobre un IRI»), citas textuales, o
notas del propio plan que cuentan el cambio de nombre.

---

## Anexo · todas las líneas, clasificadas

Generado el 23/09/2026 leyendo los archivos del plan y de la auditoría. La clase es una propuesta:
donde una línea mezcla dos clases, se aplica cada una a su mención. Las citas y el historial están
marcados para **no** tocarlos. `¦` es una barra vertical de la tabla original.

**Recuento:** 177 líneas · SETUP 125 · DIRECCION 36 · ESTRUCTURA 22 · HISTORIAL 20 · CITA 11 · ETIQUETA 8
*(una línea puede sumar en dos clases)*.

#### `01_Plan/reglas.json` · 18 líneas

| Línea | Clase | Texto |
|---:|---|---|
| 1317 | SETUP | "enunciado": "Setup IRI: corrida, retroceso, zona, rompimiento de esa zona y consecucion. La consecucion es la entrada.", |
| 1358 | SETUP | …": "SI. La zona la genera el propio impulso del paso 1. No existe IRI sin zona", |
| 1364 | SETUP | …": "solo zona vigente (R-21). El punto de referencia NO aplica al IRI", |
| 1370 | SETUP + ETIQUETA | "valor": "IRI Apertura e IRI Continuacion: MISMA mecanica, la etiqueta es solo estadistica (P-20)", |
| 1380 | SETUP | "nota": "El IRI es autocontenido: el setup crea la zona que despues rompe. Impulso-Retroceso-Impulso; el segundo impulso es la entrada.", |
| 1443 | SETUP | "nota": "Es la contraria del IRI: el IRI opera el rompimiento que funciona, el Reingreso el que fallo. Unico setup del plan con un segundo filtro de target. La orden muer |
| 1504 | SETUP | …ompimiento de esa zona por la corrida siguiente. Es el paso 4 del IRI (R-25)", |
| 1522 | ESTRUCTURA | …PIMIENTO DIRECTO y NO se opera nunca. DESPUES: el mercado arma un IRI nuevo entero mas alla — corrida que deja su zona, retroceso que la confirma, y rompimiento de esa zo |
| 1528 | ESTRUCTURA | …ara toda la jornada. Cada movimiento se juzga por separado; si el IRI siguiente tampoco es fluido, el sentido se vuelve a bloquear y hay que esperar otro. CONFIRMADO 14/0 |
| 1574 | ESTRUCTURA | …mper. Si alguna falla, no se opera ese rompimiento y se espera a un IRI nuevo mas alla de esa zona.", |
| 1578 | ESTRUCTURA | …on consecucion — rompimiento directo, no se opera; (4) se espera un IRI nuevo entero mas alla y se entra en ese. Respuestas del 19/09: se puede volver a perder; solo afec |
| 1653 | SETUP + DIRECCION | …an defender para evitar que lo rompan'. CASO DE ORIGEN, 11/09/2026: reingreso corto a las 9:01 sobre la zona de premercado de 8:29, entrada 29440.25, stop 29475.00, objet |
| 1787 | SETUP | …distancia se mide entre la ENTRADA y el stop estructural de R-32: IRI = el extremo alcanzado DESDE QUE NACIO LA ZONA hasta la vela de rompimiento (corregido 27/08/2026; N |
| 1876 | SETUP | …ncluye el ancho de la zona entera y tiende a ser mayor que el de un IRI. El filtro STOP_MAX muerde mas en Reingreso. ¦ CORREGIDO 04/09/2026: este archivo seguia diciendo  |
| 2043 | SETUP | "enunciado": "En dia de FOMC no se opera IRI. Solo se permite Reingreso.", |
| 2064 | SETUP | "variable": "IRI", |
| 2076 | SETUP | "accion": "Ese dia solo se busca Reingreso. Un IRI valido se deja pasar aunque cumpla todo.", |
| 2080 | SETUP | …n R-35: un evento rojo de la Fed dispara las dos reglas, el veto de IRI todo el dia y el bloqueo de +/-5 min. Misma fuente unica, sin conflicto de calendarios. El operado |

#### `01_Plan/TRADING_PLAN_CHAUMER.md` · 46 líneas

| Línea | Clase | Texto |
|---:|---|---|
| 18 | SETUP | ¦ **F1.3** ¦ Identificación del setup ¦ ✅ **CERRADA** — 'R-25' IRI y 'R-26' Reingreso confirmadas ¦ |
| 80 | SETUP | ¦ 'R-25' ¦ Setup IRI: corrida, retroceso, zona, rompimiento de esa zona y consecucion ¦ Setup y entrada ¦ |
| 93 | SETUP | ¦ 'R-36' ¦ En dia de FOMC no se opera IRI ¦ Filtros de no-operar ¦ |
| 661 | SETUP | ## R-25 · Setup IRI *(Impulso–Retroceso–Impulso)* |
| 676 | SETUP | …ida:** **sí** — y la genera el propio impulso del paso 1. **No existe IRI sin zona.** |
| 677 | SETUP | …lo **zona vigente** ('R-21'). El punto de referencia **no** aplica al IRI. |
| 682 | SETUP | > 🔑 **El IRI es autocontenido:** el propio setup crea la zona que después rompe. |
| 710 | SETUP | > 🔑 **Es la contraria del IRI:** el IRI opera el rompimiento que **funciona**; el Reingreso, el que **falló**. |
| 719 | CITA | … en esa dirección, solo da el mayor grado de favorabilidad a un trade IRI en la apertura, pero no quiere decir que se sesgue y no pueda operar un trade IRI en dirección c |
| 743 | SETUP | …umplidas las tres, ese rompimiento es la entrada — el cuarto paso del IRI ('R-25'). |
| 759 | ESTRUCTURA | En los dos casos: **se espera a otro IRI que deje una zona nueva entera más allá de la bloqueada** — por encima si se busca largo, por debajo si se busca corto. No basta  |
| 769 | ESTRUCTURA | … resistencia de 8:34 no se opera, y en toda la sesión no aparece otro IRI por encima de ella. **NO OPERA.** |
| 771 | CITA | …r mal marcada: *"efectivamente está mal esa entrada, porque no fue un IRI bajista fluido; primero empezó alcista, y luego fue bajista. Esa primera entrada fue arriesgada, |
| 801 | ESTRUCTURA | …ión** — el rompimiento directo; **después**, que el mercado arme un **IRI nuevo entero más allá**: una corrida que deje su zona, un retroceso que la confirme, y el rompim |
| 803 | ESTRUCTURA | …le para toda la jornada: cada movimiento se juzga por separado. Si el IRI siguiente tampoco es fluido, se vuelve a bloquear y hay que esperar otro. |
| 807 | ESTRUCTURA | …llegó, 'R-10' estira la zona hasta la punta de esa mecha. Para que el IRI nuevo quede entero más allá, el precio tiene que pasar de esa punta — y eso **es** la consecució |
| 809 | CITA | …enso en cortos; espero que se rompa la zona de soporte, que haga otro IRI, y ahí sí entro"*. |
| 880 | SETUP + DIRECCION | Reingreso corto a las **9:01** sobre la zona de premercado de 8:29: entrada **29.440,25**, stop **29.475,00**, objetivo **29.405,50**, riesgo 34,75. El punto de control d |
| 929 | SETUP | …l envío:** el stop estructural debe ser **≤ 'STOP_MAX' = 80 puntos**. IRI → distancia entrada ↔ extremo del **retroceso**. Reingreso → distancia entrada ↔ extremo de la * |
| 959 | SETUP | ¦ **IRI** ¦ punto **más bajo alcanzado desde que nació la zona hasta el rompimiento** ¦ punto **más alto alcanzado desde que nació la zona hasta el rompimiento** ¦ |
| 965 | SETUP | … ancho de la zona entera, así que **tiende a ser mayor** que el de un IRI. El filtro 'STOP_MAX' muerde más en Reingreso. |
| 1062 | SETUP | - **Enunciado:** En día de FOMC **no se opera IRI. Solo se permite Reingreso.** |
| 1069 | SETUP | ¦ **IRI** ('R-25') ¦ ❌ **prohibido** ¦ |
| 1072 | SETUP | - **Acción:** ese día solo se busca Reingreso. **Un IRI válido se deja pasar aunque cumpla todo.** |
| 1075 | SETUP | …sin conflicto.** Un evento rojo de la Fed dispara las dos: el veto de IRI durante todo el día **y** el bloqueo de ±5 minutos. Misma fuente única, así que no hay dos calen |
| 1155 | SETUP | ¦ **IRI** *(Impulso–Retroceso–Impulso)* ¦ **Apertura** ¦ alcista / bajista ¦ 🔗 **idéntica a Continuación** ¦ |
| 1156 | SETUP | ¦ **IRI** ¦ **Continuación** ¦ alcista / bajista ¦ 🔗 **idéntica a Apertura** ¦ |
| 1161 | SETUP + ETIQUETA | ### 'IRI Apertura' vs 'IRI Continuación' — no es una distinción operativa |
| 1163 | CITA | > *"Son la misma mecánica, solo que IRI Apertura se da cuando es la apertura, y el otro IRI ya se da durante la jornada operativa."* — Operador, 24/08/2026 |
| 1165 | SETUP | **El plan escribe UNA sola regla de IRI.** La etiqueta Apertura/Continuación existe solo para el **registro estadístico**, no cambia ninguna condición de entrada, stop o  |
| 1217 | SETUP | ¦ ¦ **IRI** ¦ **Reingreso** ¦ |
| 1314 | SETUP | … contra, el giro es la 5ª"*) ¦ **No lo opera** → descartado. Solo hay IRI y Reingreso ¦ |
| 1423 | HISTORIAL | …reso válido** y lo detectó el operador: la 8:47 da la consecución del IRI y **en la misma vela** se da la vuelta y actúa como vela de reingreso. 'R-26' **ampliada**: una  |
| 1433 | SETUP | ¦ **Qué hizo el auditor** ¦ Tras descartar el IRI de la 8:47 por 'STOP_MAX', siguió analizando corridas, retrocesos y zonas hasta la 8:53, y planteó dos preguntas sobre ' |
| 1437 | SETUP | ¦ **La causa** ¦ El auditor trató el descarte del IRI como *"aquí no hay nada"* en vez de *"aquí no hay ESTE setup"*. Solo había buscado **un** setup por zona ¦ |
| 1438 | SETUP | …**Lección** ¦ *Un setup descartado no vacía la zona. Tras rechazar un IRI hay que comprobar de inmediato si el rompimiento fallido abre un Reingreso — es la contraria exa |
| 1505 | HISTORIAL | …e setups cerrada** con el selector de NT8 del operador: **2 familias (IRI, Reingreso), 2 mecánicas**. 'IRI Apertura' e 'IRI Continuación' son la MISMA mecánica — la etiqu |
| 1506 | HISTORIAL | ¦ **1.3-F1.3** ¦ **2026-08-24** ¦ 🏁 **F1.3 CERRADA.** 'R-25' (IRI) y 'R-26' (Reingreso) confirmadas con diagrama. Nuevo término **PUNTO DE REFERENCIA**, que no es lo mism |
| 1510 | HISTORIAL | … ¦ **2026-08-24** ¦ 🏁 **F1.8 CERRADA.** Nuevas 'R-36' (día de FOMC: **IRI prohibido, solo Reingreso**, día entero, fuente Forex Factory) y 'R-37' (estado del operador, ** |
| 1512 | HISTORIAL | …-F1.10** ¦ **2026-08-24** ¦ 🟡 **F1.10 abierta con 6 casos reales.** 4 IRI (2 alcistas, 2 bajistas) y 2 Reingresos. **Validan 'R-20', 'R-25', 'R-26', 'R-32' y 'R-21' sobre |
| 1519 | HISTORIAL | …del 15/07/2026 cerrada: primera operación GANADORA del backtesting.** IRI corto, entrada 29.910,25, stop 29.966,50, riesgo 56,25 pts → **TARGET en la vela siguiente al ll |
| 1520 | HISTORIAL | …01** ¦ 🟢 **Sesión del 16/07/2026 cerrada: segunda ganadora seguida.** IRI corto, entrada 29.395,50, stop 29.471,00, riesgo 75,50 pts → **TARGET: +75,50 pts = +151,00 USD* |
| 1521 | HISTORIAL | …026-09-01** ¦ 🔴 **Sesión del 17/07/2026 cerrada: se corta la racha.** IRI corto, entrada 28.434,75, stop 28.512,00, riesgo 77,25 pts (**97 % del tope**) → **STOP: −77,25  |
| 1522 | HISTORIAL | …sión del 20/07/2026 cerrada: primer día que no cambia NI UNA regla.** IRI corto → **TARGET: +54,50 pts = +109,00 USD**. **Primera validación en datos de la cancelación re |
| 1534 | HISTORIAL | …uiente no es capaz de romper— con una sola recuperación: esperar otro IRI que deje una zona nueva **entera** más allá de la bloqueada. Tercera jornada del test ciego, **l |
| 1539 | HISTORIAL | …iento directo); y se vuelve a entrar solo cuando el mercado arma un **IRI nuevo entero más allá**. Alcanza también a las zonas de premercado, que no tienen corrida detrás |

#### `01_Plan/GLOSARIO.md` · 7 líneas

| Línea | Clase | Texto |
|---:|---|---|
| 556 | ESTRUCTURA | …imiento directo**, y no se opera—; **después** el mercado arma **otro IRI que deje una zona nueva entera más allá de la bloqueada** — por encima para largo, por debajo pa |
| 560 | CITA | …r, el mercado va a estar lateral, entonces toca esperar que haga otro IRI encima de esa zona"*. |
| 574 | ESTRUCTURA | …primer paso para que vuelvan las entradas: después hay que esperar un IRI nuevo entero más allá de la zona, y se entra en ése. |
| 576 | CITA | …stá lateral… hay que esperar que el mercado rompa esa zona, haga otro IRI, y se ingresa en ese otro"*. |
| 634 | SETUP + DIRECCION | **Caso de origen de la mecánica nueva · 11/09/2026:** reingreso corto a las 9:01, entrada 29.440,25, objetivo 29.405,50. El punto de referencia de la vela de **8:58**, en |
| 640 | SETUP | ## IRI  *(Impulso–Retroceso–Impulso)* |
| 870 | CITA | … en esa dirección, solo da el mayor grado de favorabilidad a un trade IRI en la apertura, pero no quiere decir que se sesgue y no pueda operar un trade IRI en dirección c |

#### `01_Plan/CHECKLIST_DIARIA.md` · 8 líneas

| Línea | Clase | Texto |
|---:|---|---|
| 15 | SETUP | …evento de la Fed en rojo hoy?** ¦ 'R-36' ¦ **SÍ → hoy solo Reingreso. IRI prohibido todo el día** ¦ |
| 47 | SETUP | ¦ ☐ ¦ ¿Es **IRI** o **Reingreso**? ¦ 'R-25' / 'R-26' ¦ |
| 48 | SETUP | ¦ ☐ ¦ *(solo IRI)* **¿La corrida es FLUIDA?** Tres cosas seguidas: la corrida dejó su zona · **el retroceso no se pasó** (mide menos que su corrida) · y **ésta es la corr |
| 54 | SETUP | ¦ ☐ ¦ **IRI** ¦ extremo del **retroceso** ¦ 'R-32' ¦ |
| 65 | ESTRUCTURA + SETUP | ¦ ☐ ¦ *(solo IRI)* ¿La corrida es fluida? ¦ 'R-40' ¦ **NO SE OPERA ESE ROMPIMIENTO.** La zona sigue viva. Se espera a otro IRI que deje una zona nueva **entera** más allá |
| 66 | SETUP | ¦ ☐ ¦ ¿Es día de FOMC y el setup es un IRI? ¦ 'R-36' ¦ **NO SE OPERA** ¦ |
| 70 | SETUP | …Si un setup se descarta, la zona NO queda vacía.** Tras rechazar un **IRI** por cualquiera de los cuatro filtros, **seguir mirando esa misma zona**: si el rompimiento fal |
| 119 | SETUP + ETIQUETA | ¦ **Setup**: 'IRI Apertura' / 'IRI Continuación' / 'Reingreso' ¦ sin esto no se pueden separar estadísticas por setup ¦ |

#### `01_Plan/GALERIA.md` · 48 líneas

| Línea | Clase | Texto |
|---:|---|---|
| 20 | SETUP | ¦ **G-01** ¦ IRI alcista ¦ 995 ¦ 49,75 ¦ $99,50 ¦ 62 % ¦ |
| 21 | SETUP + ETIQUETA | ¦ **G-02** ¦ IRI Apertura bajista ¦ 1.535 ¦ **76,75** ¦ **$153,50** ¦ 🔴 **96 %** ¦ |
| 22 | SETUP | ¦ **G-03** ¦ IRI alcista ¦ 885 ¦ 44,25 ¦ $88,50 ¦ 55 % ¦ |
| 23 | SETUP | ¦ **G-04** ¦ IRI bajista ¦ 400 ¦ **20** ¦ $40 ¦ 25 % ¦ |
| 33 | SETUP | ## G-01 · IRI ALCISTA |
| 49 | SETUP + ETIQUETA | ## G-02 · IRI APERTURA BAJISTA 🔴 *el caso al límite* |
| 64 | CITA | 📌 El propio operador lo etiquetó **"IRI Apertura"**. Es el material que servirá para cerrar 'P-20' — dónde acaba "la apertura". |
| 68 | SETUP | ## G-03 · IRI ALCISTA · la zona superada cambia de papel |
| 85 | SETUP | ## G-04 · IRI BAJISTA · zona invertida, y el stop más pequeño |
| 156 | SETUP | … **Es la prueba de que los filtros son independientes del setup.** Un IRI perfecto con el stop demasiado grande **no es una operación**. |
| 279 | SETUP | ¦ 'R-25' IRI ¦ ✅ 4 casos, 2 alcistas y 2 bajistas ¦ |
| 295 | SETUP | ¦ ❌ **Un IRI en día de FOMC** *(descartado por 'R-36')* ¦ la prohibición más reciente ¦ |
| 311 | SETUP | ## G-12 · 🔴 LA SESIÓN COMPLETA · 6 JULIO 2026 · un IRI rechazado y un Reingreso operado sobre la MISMA zona |
| 330 | SETUP | ¦ **8:47** ¦ **consecución del IRI** (29.967,25) → pero el stop estructural queda a **114 pts**. 'STOP_MAX' = 80 → **la orden NO se envía** ¦ 'R-31' ¦ |
| 355 | SETUP | > 1. **'STOP_MAX' no mata la sesión, la redirige.** El IRI se cae por 34 puntos de exceso y **un minuto después** la misma zona entrega un Reingreso que sí cabe. El filtr |
| 356 | SETUP | > 2. **El stop del Reingreso salió MENOR que el del IRI** — 58,75 contra 114 — pese a la advertencia de 'R-32' de que el Reingreso *"tiende a ser mayor"*. Aquí no lo fue, |
| 357 | SETUP | …cerrar un setup y abrir el contrario.** La 8:47 da la consecución del IRI y es la vela de reingreso. Ver la ampliación de 'R-26'. |
| 360 | SETUP | …22' nació aquí.** El plan no dice **cuál** retroceso fija el stop del IRI cuando ha pasado más de uno. Los dos candidatos daban 114,00 y 173,75 pts — **59,75 de diferenci |
| 388 | SETUP + DIRECCION | **Operación:** IRI largo · entrada **29.871,50** · stop **29.811,75** · objetivo 29.931,25 · riesgo **59,75 pts** → **STOP** en la vela de las 8:50 · **−59,75 pts = −119, |
| 406 | SETUP + DIRECCION | **Operación:** IRI corto · entrada **29.226,00** · stop **29.282,50** · objetivo 29.169,50 · riesgo **56,50 pts** → **STOP** en la vela de las 9:48 · **−56,50 pts = −113, |
| 420 | SETUP + DIRECCION | **Operación:** Reingreso corto · entrada **29.724,00** · stop **29.752,50** · objetivo 29.695,50 · riesgo **28,50 pts** → **TARGET** en la vela de las 10:09 · **+28,50 pt |
| 459 | SETUP | ## G-18 · 🟢 SESIÓN COMPLETA · 15 JULIO 2026 · el primer IRI ganador, y una vela que hace dos cosas a la vez |
| 461 | SETUP + DIRECCION | **Operación:** IRI corto · entrada **29.910,25** · stop **29.966,50** · objetivo 29.854,00 · riesgo **56,25 pts** → **TARGET** en la vela de las 8:39 · **+56,25 pts = +11 |
| 477 | SETUP | > 🔑 **Primera operación ganadora del backtesting, y el primer IRI que llega a target.** También el primer día sin ninguna zona de premercado: ninguna vela superó el umbra |
| 487 | CITA | … al revisarla: *"efectivamente está mal esa entrada, porque no fue un IRI bajista fluido; primero empezó alcista, y luego fue bajista. Esa primera entrada fue arriesgada, |
| 491 | SETUP + DIRECCION | **Operación:** IRI corto · entrada **29.395,50** · stop **29.471,00** · objetivo 29.320,00 · riesgo **75,50 pts** → **TARGET** en la vela de las 8:45 · **+75,50 pts = +15 |
| 515 | SETUP + DIRECCION | **Operación:** IRI corto · entrada **28.434,75** · stop **28.512,00** · objetivo 28.357,50 · riesgo **77,25 pts** → **STOP** en la vela de las 8:49 · **−77,25 pts = −154, |
| 541 | SETUP + DIRECCION | **Operación:** IRI corto · entrada **29.018,25** · stop **29.072,75** · objetivo 28.963,75 · riesgo **54,50 pts** → **TARGET** en la vela de las 9:02 · **+54,50 pts = +10 |
| 547 | SETUP + DIRECCION | ¦ 1 ¦ **IRI largo 8:38** · entrada 29.167,50 · stop 29.126,25 ¦ 41,25 pts ¦ **cancelada a las 8:40**: el precio volvió al punto del stop (mínimo 29.119,50) sin haberse ll |
| 548 | SETUP + DIRECCION | ¦ 2 ¦ **IRI corto 8:40** · entrada 29.119,25 · stop 29.167,25 ¦ 48,00 pts ¦ **cancelada a las 8:44**: el precio volvió al punto del stop (máximo 29.181,75) sin haberse ll |
| 549 | SETUP + DIRECCION | ¦ 3 ¦ **IRI corto 8:57** · entrada 29.018,25 · stop 29.072,75 ¦ 54,50 pts ¦ **llenada a las 8:58 → TARGET a las 9:02** ¦ |
| 567 | SETUP + DIRECCION | **Operación:** IRI largo · entrada **29.145,75** a las 8:40 · stop **29.105,25** · objetivo 29.186,25 · riesgo **40,50 pts** → **TARGET** en la vela siguiente · **+40,50  |
| 604 | SETUP + DIRECCION | **El caso que trajo la regla.** A las 9:01 había un reingreso corto sobre la zona de premercado de las 8:29: entrada 29.440,25, stop 29.475,00, riesgo 34,75, objetivo 29. |
| 645 | SETUP + DIRECCION | ¦ **6 jul** ¦ Reingreso corto 8:48 ¦ STOP 8:51 ¦ **−58,75** ¦ |
| 649 | SETUP + DIRECCION | ¦ **10 jul** ¦ IRI largo 8:38 ¦ STOP 8:40 ¦ **−53,50** ¦ |
| 650 | SETUP + DIRECCION | ¦ **13 jul** ¦ Reingreso corto 10:04 ¦ **TARGET 10:09** ¦ **+28,50** ¦ |
| 652 | SETUP + DIRECCION | ¦ **15 jul** ¦ **IRI corto 8:38** ¦ **TARGET 8:39** ¦ **+56,25** ¦ |
| 654 | SETUP + DIRECCION | ¦ **17 jul** ¦ IRI largo 9:04 *(el corto de 8:44 se retira el 14/09)* ¦ STOP 9:05 ¦ **−50,25** ¦ |
| 662 | SETUP + DIRECCION | ¦ **10 sep** ¦ **IRI largo 8:40** ¦ **TARGET 8:41** ¦ **+40,50** ¦ |
| 672 | SETUP + DIRECCION | ¦ 6 jul ¦ Reingreso corto 8:48 ¦ STOP 8:51 ¦ −58,75 ¦ |
| 673 | SETUP + DIRECCION | ¦ 7 jul ¦ IRI corto 9:43 ¦ STOP 9:48 ¦ −56,50 ¦ |
| 675 | SETUP + DIRECCION | ¦ 9 jul ¦ IRI largo 8:46 ¦ STOP 8:50 ¦ −59,75 ¦ |
| 676 | SETUP + DIRECCION | ¦ 10 jul ¦ IRI largo 8:38 ¦ STOP 8:40 ¦ −53,50 ¦ |
| 677 | SETUP + DIRECCION | ¦ 13 jul ¦ Reingreso corto 10:04 ¦ TARGET 10:09 ¦ +28,50 ¦ |
| 679 | SETUP + DIRECCION | ¦ 15 jul ¦ IRI corto 8:38 ¦ TARGET 8:39 ¦ +56,25 ¦ |
| 680 | SETUP + DIRECCION | ¦ 16 jul ¦ IRI corto 8:40 ¦ TARGET 8:45 ¦ +75,50 ¦ |
| 681 | SETUP + DIRECCION | ¦ 17 jul ¦ IRI corto 8:44 ¦ STOP 8:49 ¦ −77,25 ¦ |
| 682 | SETUP + DIRECCION | ¦ 20 jul ¦ IRI corto 8:58 ¦ TARGET 9:02 ¦ +54,50 ¦ |

#### `01_Plan/PENDIENTES.md` · 4 líneas

| Línea | Clase | Texto |
|---:|---|---|
| 44 | SETUP + ETIQUETA | - **Origen:** 'IRI Apertura' vs 'IRI Continuación' (24/08/2026). |
| 145 | SETUP | - **El operador (24/08/2026):** *"Giro fuera del plan"*. Solo opera **IRI** y **Reingreso**. |
| 146 | SETUP + ETIQUETA | …2 mecánicas**. El "Patrón de Apertura" no era una familia aparte: es 'IRI Apertura'. |
| 334 | SETUP | **Cómo apareció.** El 06/07/2026 el IRI se completó a las 8:47 con entrada en 29.959,75. Los dos candidatos daban: |

#### `01_Plan/ESTADO.md` · 4 líneas

| Línea | Clase | Texto |
|---:|---|---|
| 13 | ESTRUCTURA | …to que llega después **no se opera nunca**; se vuelve a entrar con un IRI nuevo entero más allá. Alcanza a las zonas de premercado. Se puede volver a perder. |
| 64 | SETUP | ¦ 'R-25' ¦ **IRI**: corrida→retroceso→zona→rompimiento→consecución = entrada · plazo 5 velas · filtro: zona vigente ¦ |
| 67 | ESTRUCTURA | …so **no se pasa**, y la siguiente **rompe**. Si falla, se espera otro IRI con zona nueva **entera** más allá. Solo continuación ¦ |
| 87 | SETUP | ¦ 'R-36' ¦ **Día FOMC** (Forex Factory en rojo): IRI prohibido todo el día, solo Reingreso ¦ |

#### `01_Plan/CONTEXTUALIZACION.md` · 2 líneas

| Línea | Clase | Texto |
|---:|---|---|
| 132 | CITA | …a gran probabilidad de continuar la dirección, por eso se entra en un IRI de continuación."* |
| 151 | CITA | … (27/08/2026):** *"solo da el mayor grado de favorabilidad a un trade IRI en la apertura, pero no quiere decir que se sesgue y no pueda operar un trade IRI en dirección c |

#### `01_Plan/CIERRE_FASE_1.md` · 9 líneas

| Línea | Clase | Texto |
|---:|---|---|
| 74 | HISTORIAL | ¦ 6 jul ¦ Reingreso corto ¦ STOP ¦ −58,75 ¦ |
| 75 | HISTORIAL | ¦ 7 jul ¦ IRI corto ¦ STOP ¦ −56,50 ¦ |
| 77 | HISTORIAL | ¦ 9 jul ¦ IRI largo ¦ STOP ¦ −59,75 ¦ |
| 78 | HISTORIAL | ¦ 10 jul ¦ IRI largo ¦ STOP ¦ −53,50 ¦ |
| 79 | HISTORIAL | ¦ 13 jul ¦ Reingreso corto ¦ TARGET ¦ +28,50 ¦ |
| 81 | HISTORIAL | ¦ 15 jul ¦ IRI corto ¦ TARGET ¦ +56,25 ¦ |
| 82 | HISTORIAL | ¦ 16 jul ¦ IRI corto ¦ TARGET ¦ +75,50 ¦ |
| 83 | HISTORIAL | ¦ 17 jul ¦ IRI corto ¦ STOP ¦ −77,25 ¦ |
| 84 | HISTORIAL | ¦ 20 jul ¦ IRI corto ¦ TARGET ¦ +54,50 ¦ |

#### `05_Backtesting/lector.py` · 4 líneas

| Línea | Clase | Texto |
|---:|---|---|
| 20 | SETUP | # Dias de FOMC: solo se operan Reingresos, nunca IRI. |
| 560 | SETUP | # ---------- ROMPIMIENTO -> IRI ---------- |
| 584 | SETUP | o,motivo,t,r=_evaluar(Z,i,'IRI',nd,e,st) |
| 585 | SETUP | tag=(f"{hh(k)}  IRI {'largo' if nd>0 else 'corto'} · entrada {e:.2f} · stop {st:.2f}" |

#### `05_Backtesting/test_ciego/FICHA_MARCADO.md` · 12 líneas

| Línea | Clase | Texto |
|---:|---|---|
| 249 | SETUP | **'R-36'** · En dia de FOMC no se opera IRI. Solo se permite Reingreso. |
| 253 | SETUP | - 'IRI' → PROHIBIDO (R-25) |
| 255 | SETUP | - ▶️ **acción:** Ese dia solo se busca Reingreso. Un IRI valido se deja pasar aunque cumpla todo. |
| 300 | SETUP | … La distancia se mide entre la ENTRADA y el stop estructural de R-32: IRI = el extremo alcanzado DESDE QUE NACIO LA ZONA hasta la vela de rompimiento (corregido 27/08/202 |
| 355 | SETUP | **'R-25'** · Setup IRI: corrida, retroceso, zona, rompimiento de esa zona y consecucion. La consecucion es la entrada. |
| 362 | SETUP | …rida' → SI. La zona la genera el propio impulso del paso 1. No existe IRI sin zona |
| 363 | SETUP | …rget' → solo zona vigente (R-21). El punto de referencia NO aplica al IRI |
| 364 | SETUP + ETIQUETA | - 'etiquetas_NT8' → IRI Apertura e IRI Continuacion: MISMA mecanica, la etiqueta es solo estadistica (P-20) |
| 388 | SETUP | …el rompimiento de esa zona por la corrida siguiente. Es el paso 4 del IRI (R-25) |
| 391 | ESTRUCTURA | … ROMPIMIENTO DIRECTO y NO se opera nunca. DESPUES: el mercado arma un IRI nuevo entero mas alla — corrida que deja su zona, retroceso que la confirma, y rompimiento de es |
| 392 | ESTRUCTURA | …le para toda la jornada. Cada movimiento se juzga por separado; si el IRI siguiente tampoco es fluido, el sentido se vuelve a bloquear y hay que esperar otro. CONFIRMADO  |
| 400 | ESTRUCTURA | …romper. Si alguna falla, no se opera ese rompimiento y se espera a un IRI nuevo mas alla de esa zona. |

#### `05_Backtesting/test_ciego/DISCREPANCIAS.md` · 14 líneas

| Línea | Clase | Texto |
|---:|---|---|
| 92 | SETUP + DIRECCION | **reingreso corto en la vela de 8:37** sobre esa misma resistencia: orden en 29.109,00, stop en |
| 156 | SETUP + DIRECCION | A mano encontré un reingreso corto sobre la zona de premercado de 8:29: la rompió por arriba, |
| 206 | SETUP | …que no**, y tenía razón: *"la vela al nacer bajista, uno esperaría un IRI |
| 208 | ESTRUCTURA | …o se debería ingresar en un rompimiento directo; se debe esperar otro IRI superando esa |
| 225 | SETUP | porque no fue un IRI bajista fluido; primero empezó alcista, y luego fue bajista. Esa primera |
| 226 | ESTRUCTURA | entrada fue arriesgada, se debe esperar que genere otro IRI bajista."* |
| 243 | ESTRUCTURA | …uiente no es capaz de romper— y una sola recuperación: **esperar otro IRI que deje una zona |
| 260 | SETUP + DIRECCION | **Veredicto del día: IRI corto, −23,25 pts = −46,50 USD.** El operador y el marcado a ciegas dan |
| 415 | SETUP + DIRECCION | **Veredicto: IRI corto, −33,75 pts = −67,50 USD.** Coincidimos con el operador, con los mismos |
| 477 | SETUP + DIRECCION | **Veredicto final: IRI corto, +31,00 pts = +62,00 USD.** El operador y el auditor acaban en la misma |
| 501 | SETUP + DIRECCION | Con la corrección de arriba, el auditor propuso un **reingreso corto** a las 8:50, entrada 29.793,50, |
| 516 | ESTRUCTURA | otro IRI, y se ingresa en ese otro."* |
| 527 | ESTRUCTURA | 4. Desde ahí se cuenta un **IRI nuevo entero por debajo**: corrida que deja zona, retroceso que la |
| 531 | SETUP | > siguiente IRI tampoco es fluido —hay que esperar otro—, y el bloqueo es **solo del sentido del |

#### `CLAUDE.md` · 1 líneas

| Línea | Clase | Texto |
|---:|---|---|
| 83 | SETUP | …ó) · **traspaso** (rompimiento + consecución) · **zona apéndice** · **IRI** (continuación) · **Reingreso** (inmediato o no es) · **punto de referencia** *(el nivel de ref |
