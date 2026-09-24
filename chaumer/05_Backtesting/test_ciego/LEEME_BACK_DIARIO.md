# TEST CIEGO DIARIO — instrucciones para la sesión de Cowork

> El operador abre una **conversación nueva** cada día y escribe una línea:
> *"back del 10 de septiembre"* + las noticias rojas de ese día.
> Esto es lo que se lee entonces. Nada más.

---

# 🔴 La regla que hace que esto sirva

**Marcas el día SIN saber qué hizo el operador.**

No le preguntes si operó. No le preguntes qué vio. No le pidas su gráfico. Si él te lo ofrece antes de que entregues, **dile que se lo guarde** — su captura está en `mio\` y no se abre hasta después.

Lo único que él te da de entrada, porque el plan lo necesita y se sabe antes de que abra el mercado:

- las **noticias rojas** de ese día y sus horas
- si es **día de reunión de la Fed**

Si no te lo dice, **pregúntaselo antes de marcar**. Eso sí.

---

## Qué leer, y en qué orden

**1 · `FICHA_MARCADO.md`**, en esta carpeta. Las 38 reglas y los parámetros, sin el porqué. **Es lo único que necesitas del plan.**

🚫 **No abras `TRADING_PLAN_CHAUMER.md`.** Son 29.000 tokens de explicaciones y ejemplos. Para marcar no hacen falta.
🚫 **No abras `ESTADO.md`, ni la bitácora, ni la galería.** Cuentan lo que pasó en julio y te sesgan.

**2 · Los datos:** `..\datos\dia\AAAA-MM-DD.txt`
Formato `yyyyMMdd HHmmss;o;h;l;c;v`, **en UTC**, marca de **cierre** de vela.
El gráfico del operador es hora Colombia: `Colombia = UTC − 5`.
Ventana operativa **08:31–10:30 Col = 13:31–15:30 UTC**.
El archivo arranca a las 00:00 UTC, que son las 19:00 Col de la noche anterior — el inicio del barrido de premercado. Todo lo anterior a las 13:31 UTC es premercado.

---

## Cómo se marca

El motor está en `..\lector.py` y el gráfico en `..\dia.py`. Los dos son **de auditoría**. Se usan así:

```
python lector.py 20260910 ../datos/dia/2026-09-10.txt
python dia.py    20260910 ../datos/dia/2026-09-10.txt claude/2026-09-10.png
```

El umbral de volumen del premercado va por defecto en **8.000, que es el valor del plan desde el 14/09/2026** — y es un **parámetro ajustable**, así que antes de marcar conviene mirar `01_Plan\PARAMETROS.md` por si cambió. Si algún día se marca un archivo del NQ viejo, hay que pasarle `2000` como último argumento.

### ⚠️ El motor tiene dos agujeros conocidos. Revisa a mano encima de él.

*(El tercero se tapó el 14/09/2026: `lector.py` ya aplica la regla de que no se entra en el rompimiento de una zona cuyo retroceso fue mayor que la corrida que la creó.)*

**No resuelve el plazo antes de tiempo.** Cuando un rompimiento se queda sin consecución, el plazo de 5 velas es un tope, no una espera: si antes se arma la estructura contraria, la geometría se resuelve en ese momento. El motor espera siempre a la quinta vela. **Comprueba a mano cada rompimiento sin consecución.**

**No está verificado contra la secuencia de marcado de la jornada.** Esa secuencia está al principio del capítulo de zonas del plan y es, en corto: la apertura deja dos zonas y ésas son la banda · dentro de esa banda se marca **una zona como máximo en toda la jornada** · después no se dibuja nada más dentro · la única zona nueva sale de superar un extremo con rompimiento y consecución · y ese traspaso abre banda nueva con turno propio para todo el día. **Cuenta las zonas que marcó el motor y comprueba que respetan esto.** Si marcó de más, la buena es la secuencia.

Si el motor y tu lectura a mano no coinciden, **manda tu lectura a mano** y déjalo escrito en la entrega.

---

## Qué entregar

**El gráfico** en `Back_claude\AAAA-MM-DD.png`, con el estándar visual de siempre — ya lo aplica `dia.py`.

**Y el veredicto, en pocas líneas y sin códigos de regla:**

- dirección declarada por la vela de apertura
- las zonas marcadas, con su hora y su precio
- **si hubo entrada válida o no** — y si no la hubo, **por qué no**
- si la hubo: hora, precio de entrada, stop, objetivo, riesgo en puntos, y cómo terminó
- y si el motor y tú discrepasteis, dónde

**Entonces paras.** Él abre su sobre y compara. Ahí empieza la otra mitad.

---

## Cuando comparéis

Cada diferencia cae en una de tres, y se anota en `DISCREPANCIAS.md`:

**Coincide.**
**Marcamos distinto** — y entonces hay que decidir cuál de los dos aplicó mal las reglas escritas.
**Las reglas no cubren el caso** — 🟡 esto es lo valioso. Se anota con el caso concreto y se abre un pendiente en el plan.

**No cambies ninguna regla desde aquí.** Ni aunque la diferencia deje clarísimo qué habría que tocar. Se anota y se decide con el operador, en otra conversación.

---

## Cómo hablarle

Sin códigos de regla. Nunca. No tiene el manual a mano.
Máximo **2 preguntas por turno**.
Enséñale el gráfico; no se lo describas.
Nada se da por bueno sin su sí.

---

## Si `FICHA_MARCADO.md` está desactualizada

Se regenera, **no se edita**:

```
python generar_ficha.py
```

Lee `01_Plan\reglas.json` y la reescribe entera. Así no puede desviarse del plan.
