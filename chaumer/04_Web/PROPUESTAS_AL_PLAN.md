# PROPUESTAS AL PLAN — desde el portal

> El portal **no edita `01_Plan\`**. Cuando desde aquí se ve una contradicción o una imprecisión,
> se anota en este archivo y se decide con el operador en la conversación del plan.

---

## 14/09/2026 · Dos frases del portal que hay que corregir en la página del estiramiento

Las dos salieron al reescribir la regla del estiramiento con el operador. **Las gráficas ya estaban
bien** — `05-sin-confirmar.png` y `24-estructura-antes.png` no se tocan. Lo que falla es el texto.

### 1 · Falta "con la mecha" en la primera frase

**Dice hoy:**

> Si el precio rompe una zona y pasan 5 velas sin que llegue la consecución, la zona cambia de forma,
> es decir, se extiende la zona original hasta la punta de esa mecha.

**El problema:** promete estirar para **cualquier** rompimiento, y luego habla de una mecha que no ha
mencionado. Si el rompimiento fue con el **cuerpo** no se estira nada — nace una zona apéndice. La
frase siguiente lo aclara, pero ésta ya prometió de más.

### 2 · "Un retroceso nuevo" se queda corto

**Dice hoy:**

> O si aparece una nueva estructura —un retroceso nuevo— antes de las 5 velas, también se estira la zona.

**El problema:** la estructura completa al contrario son **tres velas**, y así está numerado en la
propia gráfica `24-estructura-antes.png`: ① la vela que no da la consecución y se va en contra ·
② la que hace retroceso · ③ la que no sigue ese retroceso y vuelve en el sentido de la primera. La
flecha de *"aquí se estira"* apunta a la **tercera**. *"Un retroceso nuevo"* es solo el paso ②, así
que con esa redacción se estiraría **una vela antes de tiempo**.

---

## Texto propuesto, el mismo que quedó en el plan el 14/09/2026

> ### Estirar la zona · rompimiento con mecha sin consecución
>
> El precio rompe una zona **con mecha** —el cierre se queda dentro— y la consecución no llega. Eso
> se puede acabar de dos maneras, y vale **la que llegue primero**:
>
> **Una ·** pasan **cinco velas** desde la siguiente a la del rompimiento, y la consecución no ha llegado.
>
> **Otra ·** antes de esas cinco velas, el mercado arma una **estructura completa en sentido contrario**:
> una vela que no da la consecución y se va en contra, otra que hace retroceso, y una tercera que no
> sigue ese retroceso y vuelve en el sentido de la primera. **La zona se estira en esa tercera vela**,
> sin esperar más.
>
> En cualquiera de los dos casos, la zona se extiende hasta la punta de la mecha que la rompió.
> **Si es una resistencia se estira solo por arriba; si es un soporte, solo por abajo.** El otro borde
> no se mueve. Sigue habiendo **una sola zona**, más grande, y conserva su historial.
>
> Un soporte nunca se estira hacia arriba, ni una resistencia hacia abajo. Si el precio cruza la zona
> por el lado contrario, **no hay nada que estirar**: ese cruce no la toca, solo la mata cuando llegue
> su consecución.

Se quitó además la palabra **"plazo"** de todo el texto: no se entiende si no te sabes ya la regla.

**Estado:** el plan ya está actualizado (`R-10`, versión 3.8 del 14/09/2026). ✅ **Pasado al portal el 22/09/2026** (`/zonas/#estira`).

---

## 15/09/2026 · La página de la zona apéndice dice solo "5 velas"

Misma página del portal (`/zonas/`, ancla `#apendice`). **Las dos gráficas están bien** — no se tocan.

**Dice hoy:**

> Si el rompimiento **fue con cuerpo** y pasan 5 velas sin consecución, **nace una zona nueva, pegada a
> la anterior**, llamada zona apéndice […]
>
> **Qué lo dispara:** Rompimiento con cuerpo + 5 velas sin consecución
>
> *(y al final de la sección, suelto)* O si aparece una nueva estructura antes de las 5 velas, también
> se genera la zona apéndice.

**El problema:** el disparador promete **un solo final** —las cinco velas— y el segundo camino aparece
como una nota al pie, después de la ficha. Son **dos finales del mismo rango**, y vale el que llegue
primero. Tal como está, quien lea solo la ficha esperará cinco velas siempre.

### Texto propuesto, el mismo que quedó en el plan el 15/09/2026

> ### Zona apéndice · rompimiento con cuerpo sin consecución
>
> El precio rompe una zona **con cuerpo** —el cierre queda fuera— y la consecución no llega. Eso se
> puede acabar de dos maneras, y vale **la que llegue primero**:
>
> **Una ·** pasan **cinco velas** desde la siguiente a la del rompimiento, y la consecución no ha llegado.
>
> **Otra ·** antes de esas cinco velas, el mercado arma una **estructura completa en sentido contrario**:
> una vela que no da la consecución y se va en contra, otra que hace retroceso, y una tercera que no
> sigue ese retroceso y vuelve en el sentido de la primera. **La apéndice nace en esa tercera vela**,
> sin esperar más.
>
> En cualquiera de los dos casos **la zona original no se toca** y nace una **segunda zona** sobre la
> mecha de la vela de rompimiento: un borde es el **borde del cuerpo** de esa vela, el otro es la
> **punta de su mecha**. Quedan **dos zonas**, la original y su apéndice.
>
> La apéndice se dibuja desde la vela de rompimiento, su vela origen, aunque no quede marcada hasta ese
> momento. Es del **mismo gris** que cualquier otra zona.
>
> **La apéndice no nace por acción del precio sobre ella** — es el rastro de un rompimiento que se
> quedó sin terminar.

**Y una sugerencia de estructura:** las dos secciones de esa página —estirar y apéndice— ahora tienen
en el plan **el mismo texto salvo una línea**. Merece la pena que el portal lo diga: *lo único que
cambia es dónde cierra la vela de rompimiento*.

**Estado:** el plan ya está actualizado (`R-11`, versión 3.9 del 15/09/2026). ✅ **Pasado al portal el 22/09/2026** (`/zonas/#apendice`), con la frase sugerida: *lo único que cambia es dónde cierra la vela de rompimiento*.

---

## 22/09/2026 · La checklist cuenta cuatro filtros y enumera cinco

`CHECKLIST_DIARIA.md`, bloque **«Los filtros · basta que falle uno»**. La tabla ya tiene **cinco**
filas desde que entró la corrida fluida: tope de stop, camino libre, punto de referencia (solo
Reingreso), corrida fluida (solo IRI) y día de la Fed con un IRI. Pero la nota que va justo debajo
sigue diciendo:

> Tras rechazar un **IRI** por cualquiera de **los cuatro filtros**, seguir mirando esa misma zona…

**En el portal** la página de filtros ya dice *«Los cinco filtros»* y, en esa nota, *«cualquiera de
los filtros»*, sin número — así no depende de cuántos haya.

**Propuesta:** quitar el número de esa nota en la checklist, o pasarlo a *cinco*. No lo toco: es el plan.

**Estado:** pendiente de Cowork.

---

## 23/09/2026 · El setup IRI pasa a llamarse Continuación — ENCARGO APROBADO POR EL OPERADOR

**No es una contradicción encontrada: es un cambio de nombre que el operador ya decidió** (22/09,
confirmado el 23/09). El encargo completo, con los textos propuestos y las 177 líneas clasificadas
una a una, está en **`CAMBIO_IRI_A_CONTINUACION.md`**, en esta misma carpeta.

En una línea: el setup se llama **Continuación** (alcista / bajista), igual que el **Reingreso**
(alcista / bajista). **IRI** pasa a nombrar la estructura —impulso, retroceso, impulso— sobre la que
se construye la Continuación. Desaparece la etiqueta «Apertura» y se cierra `P-20`. **Nada operativo
cambia.**

Orden: Cowork cambia el plan, `lector.py` y las imágenes → el portal se cambia el mismo día → el
operador renombra su selector de NinjaTrader.

### 23/09/2026 · Una línea del cambio que quedó a medias

`CHECKLIST_DIARIA.md`, línea 70, al final: *«Caso real: `G-12`, 06/07/2026, **IRI descartado** y
Reingreso operado con un minuto de diferencia.»* → **«Continuación descartada y Reingreso operado…»**.
Sale publicada en la checklist del portal. Detalle en `CAMBIO_IRI_A_CONTINUACION.md` §9.
