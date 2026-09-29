# SESIONES — instrucciones para el chat «Backtesting»

> Desde el 28/09/2026 esto se llama **Sesiones** (antes, «test ciego»; diseño en
> `docs/disenos/2026-09-28-sesiones-y-carpetas.md`, en la raíz del repositorio).
> Se hace en **Claude Code** (antes, en Cowork; D-028), en un chat que se llama **«Backtesting»**.
> El operador escribe una línea: *"sesión del 10 de septiembre"* + las noticias rojas de ese día.
> Esto es lo que se lee entonces. Nada más.

---

# 🔴 La regla que hace que esto sirva

**Marcas el día SIN saber qué hizo el operador.**

No le preguntes si operó. No le preguntes qué vio. No le pidas su gráfico. Si él te lo ofrece antes de que entregues, **dile que se lo guarde** — su captura está en `..\..\kris\AAAA-MM-DD.png` y no se abre hasta después.

Lo único que él te da de entrada, porque el plan lo necesita y se sabe antes de que abra el mercado:

- las **noticias rojas** de ese día y sus horas
- si es **día de reunión de la Fed**

Si no te lo dice, **pregúntaselo antes de marcar**. Eso sí.

### ⚠️ En Claude Code tienes a mano lo que Cowork no veía

Aquí nadie te tapa los ojos: la ceguera depende de ti. **Hasta haber entregado tu marcado de ese día:**

- no abras `..\..\kris\` ni nada del operador de ese día;
- no consultes por el MCP de Supabase **ninguna** tabla con lo suyo de ese día — `sesiones`, `trades`, `apex_trades`, `sesion_checklist`, `chaumer_operativas`, `bt_*`;
- no leas el historial del Journal (`docs/historial-proyecto.md`, `tasks/`) ni conversaciones anteriores sobre ese día.

Si algo de eso se te cruza por accidente, **dilo en la entrega**: ese día ya no es ciego.

**Lo que sí puedes ver:** lo que marcó el motor. Si el día ya pasó por la cadena diaria (10:32), en `..\AAAA-MM-DD.png` y `.json` está su marcado; es el mismo motor que vas a correr tú, así que no te sesga más que correrlo.

---

## Qué leer, y en qué orden

**1 · `FICHA_MARCADO.md`**, en esta carpeta. Las reglas y los parámetros, sin el porqué. **Es lo único que necesitas del plan.**

🚫 **No abras `01_Plan\reglas\` ni `01_Plan\HISTORIAL.md`.** El «por qué» de cada regla y su historia traen casos reales y te sesgan; para marcar no hacen falta.
🚫 **No abras `ESTADO.md`, ni la bitácora, ni la galería.** Cuentan lo que pasó en julio y te sesgan.

**2 · Los datos:** `..\motor\datos\dia\AAAA-MM-DD.txt`
Formato `yyyyMMdd HHmmss;o;h;l;c;v`, **en UTC**, marca de **cierre** de vela.
El gráfico del operador es hora Colombia: `Colombia = UTC − 5`.
Ventana operativa: **08:31–10:30 Col = 13:31–15:30 UTC** en el horario de verano de EE. UU. (hasta el 1/11/2026) · **09:31–11:30 Col = 14:31–16:30 UTC** en invierno (desde el 2/11/2026). `lector.py` la calcula sola.
El archivo arranca a las 00:00 UTC, que son las 19:00 Col de la noche anterior — el inicio del barrido de premercado. Todo lo anterior a la apertura (13:31 UTC en verano, 14:31 UTC en invierno) es premercado.

---

## Cómo se marca

El motor está en `..\motor\lector.py` y el gráfico en `..\motor\dia.py`. Los dos son **de auditoría**. Se usan así, desde `..\motor\`:

```
python lector.py 20260910 datos/dia/2026-09-10.txt
python dia.py    20260910 datos/dia/2026-09-10.txt ../2026-09-10.png
```

El umbral de volumen del premercado va por defecto en **8.000, que es el valor del plan desde el 14/09/2026** — y es un **parámetro ajustable**, así que antes de marcar conviene mirar `01_Plan\PARAMETROS.md` por si cambió. Si algún día se marca un archivo del NQ viejo (`datos/NQ 09-26.Last.txt`, julio y agosto), hay que pasarle `2000` como último argumento.

### ⚠️ El motor tiene dos agujeros conocidos. Revisa a mano encima de él.

*(El tercero se tapó el 14/09/2026: `lector.py` ya aplica la regla de que no se entra en el rompimiento de una zona cuyo retroceso fue mayor que la corrida que la creó.)*

**No resuelve el plazo antes de tiempo.** Cuando un rompimiento se queda sin consecución, el plazo de 5 velas es un tope, no una espera: si antes se arma la estructura contraria, la geometría se resuelve en ese momento. El motor espera siempre a la quinta vela. **Comprueba a mano cada rompimiento sin consecución.**

**No está verificado contra la secuencia de marcado de la jornada.** Esa secuencia está al principio del capítulo de zonas del plan y es, en corto: la apertura deja dos zonas y ésas son la banda · dentro de esa banda se marca **una zona como máximo en toda la jornada** · después no se dibuja nada más dentro · la única zona nueva sale de superar un extremo con rompimiento y consecución · y ese traspaso abre banda nueva con turno propio para todo el día. **Cuenta las zonas que marcó el motor y comprueba que respetan esto.** Si marcó de más, la buena es la secuencia.

Si el motor y tu lectura a mano no coinciden, **manda tu lectura a mano** y déjalo escrito en la entrega.

---

## Qué entregar

**El gráfico** en `..\AAAA-MM-DD.png` (la carpeta `claude\`), con el estándar visual de siempre — ya lo aplica `dia.py`. Un gráfico por día y con el nombre de su fecha: es lo que publica el portal, en la pestaña Sesiones.

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

**El veredicto del día va a la tabla del plan** («Sesiones de septiembre — día por día» en `01_Plan\GALERIA.md`, o la del mes que toque) **solo con el sí del operador**, en su commit `plan: …`. Mientras no esté ahí, el portal enseña el del motor (el `.json` de al lado del gráfico).

**El motor publica solo, pero solo días registrados:** al terminar cada pasada sube a GitHub —y así al portal— los gráficos y `.json` de `claude\` de los días que el operador ya registró. Un gráfico que dibujes tú aquí sube con tu commit, como cualquier otro cambio.

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
