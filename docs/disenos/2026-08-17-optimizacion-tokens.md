# Diseño — Optimizar el consumo de tokens por sesión

| | |
|---|---|
| **Versión** | v1 |
| **Fecha** | 2026-08-17 |
| **Estado** | ✅ **IMPLEMENTADO** (2026-08-17) — las 3 fases cerradas y verificadas |
| **Alcance** | Puntos 3 y 4 del diagnóstico: cómo trabajo. **No toca la app ni la documentación del proyecto.** |
| **Dónde se aplica** | `~/.claude/skills/flujo-desarrollo/SKILL.md` — genérico, vale para los tres proyectos |
| **Fuera de alcance** | Punto 1 (desconectar plugins) depende de Kris. Puntos 2 y 5 son hábitos, no código |

---

## 1. Corrección al diagnóstico

En el diagnóstico dije que había reescrito el documento de diseño entero unas 3,5 veces.
**Era falso.** Los datos del transcript:

| Archivo | Write | Edit | Total enviado |
|---|---|---|---|
| `2026-08-16-reestructuracion.md` | **1** | 17 | 65 KB |

Una escritura inicial de 44 KB (inevitable: era contenido nuevo) más 17 ediciones
pequeñas. Ese ya es el patrón correcto. La regla del "diseño íntegro" **no estaba
causando reescrituras**, y por tanto no hay que tocarla por ese motivo.

Lo que los datos sí muestran es otra cosa.

## 2. Dónde está el gasto de verdad

183 llamadas a herramientas en la sesión. Repartidas así:

| Herramienta | Llamadas | % del total | Volumen |
|---|---|---|---|
| **Bash** | **83** | **45%** | 68 KB |
| **Edit** | **35** | **19%** | 39 KB |
| Write | 33 | 18% | 143 KB |
| Todo lo demás | 32 | 18% | 9 KB |

**El volumen y el número de llamadas son problemas distintos, y el que importa es el
número.**

- `Write` mueve el triple de bytes que `Bash` pero en **un tercio** de llamadas, y casi
  todo su volumen es contenido nuevo escrito una sola vez (el diseño, los 4 skills, el
  `CLAUDE.md`, las reglas). Eso no es desperdicio: es el entregable.
- `Bash` + `Edit` = **118 de 183 llamadas (64%)** moviendo solo 107 KB.

Y esto es lo que lo convierte en el problema:

> **Coste ≈ llamadas × tamaño del contexto.** Cada llamada relee la conversación entera.
> A 300k de contexto, **cada llamada cuesta lo mismo tenga 20 bytes o 4 KB.**

Una llamada de `Bash` que imprime "OK" cuesta prácticamente igual que escribir el
documento de 44 KB. **Lo caro es preguntar, no lo que se dice.**

## 3. Las cuatro fuentes de llamadas evitables

Medidas sobre esta sesión.

### 3.1 Verificaciones troceadas

Comprobar cinco cosas con cinco `Bash` en vez de con uno. Ejemplo real de esta sesión: la
Fase 1 verificó `git check-ignore` ×3 + `git status` en llamadas separadas.

**Coste:** ~20 llamadas de las 83.

### 3.2 Bucles de reintento por comillas

Tres veces escribí un comando con expresiones regulares directamente en `Bash`, el shell
se comió los escapes, falló, y hubo que depurarlo y repetirlo:

| Qué falló | Llamadas gastadas |
|---|---|
| Sustitución de tokens CSS | 3 |
| Comparación del CSS antes/después | 3 |
| Chequeo de tokens contra el CSS | 3 |

**Coste:** 9 llamadas, y dos de esos fallos me llevaron a afirmar resultados incorrectos
que luego hubo que corregir (más llamadas).

### 3.3 Ediciones goteando a lo largo de la sesión

El documento de diseño recibió 17 ediciones repartidas por toda la sesión, muchas de una
línea, para mantener una cifra al día (149 → 166 líneas, etc.). Cada una es una llamada a
precio de contexto grande.

**Coste:** ~10 llamadas de las 35 de `Edit`.

### 3.4 Confirmaciones innecesarias

Releer un archivo tras editarlo, o volver a listar un directorio tras crear algo. `Edit`
falla ruidosamente si no aplica; si no falló, aplicó.

**Coste:** ~8 llamadas.

**Total evitable: ~47 de 183 llamadas (26%).**

---

## 4. El diseño

Seis reglas nuevas en `flujo-desarrollo`, todas verificables por conteo.

### R1 · Una verificación, un comando

Todas las comprobaciones de una fase van en **una sola llamada**, con etiquetas legibles.
No una llamada por comprobación.

```bash
# NO: cuatro llamadas
git check-ignore .claude/settings.json
git check-ignore .claude/settings.local.json
git status --short
wc -l CLAUDE.md

# SÍ: una
echo "=== 1 ==="; git check-ignore .claude/settings.json; echo "=== 2 ==="; ...
```

### R2 · Regex o comillas → script a archivo, a la primera

Cualquier comando con expresiones regulares, comillas anidadas o heredocs va a un archivo
en el scratchpad y se ejecuta con `node <archivo>`. **Sin intentar primero el one-liner.**

Esta sesión demostró que el intento cuesta 3 llamadas y arriesga una conclusión falsa.

### R3 · El diseño se actualiza al cerrar cada fase, no continuamente

El documento de diseño se edita **una vez por fase**, agrupando todos los cambios de esa
fase: estado, cifras medidas, desviaciones.

**Lo que NO cambia:** sigue siendo la fuente de verdad, sigue versionado, y ante una
revisión pedida por Kris se entrega **íntegro y actualizado, nunca un parche**. Esa regla
protege contra perder puntos acordados y **se mantiene tal cual** — el problema nunca fue
esa regla.

### R4 · No confirmar lo que la herramienta ya confirmó

- Tras `Edit` o `Write`: no releer el archivo. Si no falló, aplicó.
- Tras `mkdir`/`git mv`: no listar el directorio.
- **Sí se verifica** lo que no puede deducirse de que el comando no falló: que el número
  sea correcto, que la pantalla se vea bien, que el SELECT devuelva lo esperado.

### R5 · Llamadas independientes, en el mismo mensaje

Si dos lecturas o dos comandos no dependen uno del otro, van juntos. Es una regla que ya
existe; se hace explícita porque en esta sesión se cumplió a medias.

### R6 · Presupuesto de llamadas por fase, y avisar al pasarlo

Antes de una fase larga, estimar las llamadas. Si una fase va a pasar de **~25**, decirlo
y ofrecer partirla en dos peticiones:

> "Esta fase son ~40 llamadas. A este tamaño de contexto son unos X millones de tokens.
> ¿La parto en dos peticiones o sigo?"

Esto ataca directamente el turno de 164 llamadas que se comió el 51% de la sesión.

---

## 5. Qué se espera ganar

| Regla | Llamadas ahorradas |
|---|---|
| R1 · verificación agrupada | ~20 |
| R2 · script a archivo | ~9 |
| R3 · diseño por fase | ~10 |
| R4 · no reconfirmar | ~8 |
| **Total** | **~47 de 183 = 26%** |

Y sobre el coste real, que es `llamadas × contexto`:

| Escenario | Llamadas | Contexto medio | Coste relativo |
|---|---|---|---|
| Esta sesión, tal cual | 183 | ~300k | **100%** |
| Con R1-R6 | ~136 | ~300k | **74%** |
| Con R1-R6 **y** el punto 1 (plugins fuera) | ~136 | ~255k | **63%** |
| Lo anterior **+ sesión nueva por tarea** (punto 2) | ~136 | ~130k | **32%** |

> ⚠️ **Las tres primeras filas son estimaciones**, no medidas. La única cifra medida es la
> primera. El contexto de la última fila sale de que el arranque son 76k y una sesión corta
> no llega a crecer mucho más.

**El orden de rentabilidad no cambia:** lo que más ahorra sigue siendo desconectar los
plugins (punto 1) y trabajar en sesiones cortas (punto 2). R1-R6 es el tercio que depende
de mí.

---

## 6. Lo que NO se toca

- **La regla del diseño íntegro ante revisiones de Kris.** Protege contra perder puntos
  acordados; el diagnóstico la señaló por error.
- **Las dos paradas** (diagnóstico y diseño). Son lo que evita implementar lo que no era.
- **La verificación real.** Menos llamadas no significa menos verificación: significa la
  misma verificación en menos comandos. Nunca "debería funcionar".
- **El análisis profundo antes de opinar.** Leer el código real sigue siendo obligatorio.

## 7. Cómo se verifica que esto funcionó

No con opiniones. Con el mismo script que produjo estos números:

1. Guardar `analiza3.js` y `analiza5.js` (hoy en el scratchpad) en un sitio estable.
2. En la próxima sesión de trabajo real, medir: llamadas totales, reparto por herramienta,
   y coste por turno.
3. **Criterio de éxito:** menos de **0,7 llamadas por cada una** de las de hoy en un
   trabajo de tamaño comparable, sin que baje el número de verificaciones hechas.

Si no baja, las reglas están mal y se revisan.

## 8. Plan de implementación

| Fase | Qué | Verificación |
|---|---|---|
| **1** | Añadir R1-R6 a `~/.claude/skills/flujo-desarrollo/SKILL.md` | El skill sigue bajo 500 líneas y sin datos de proyecto |
| **2** | Corregir la cifra engañosa del diseño anterior (dice "−43% de contexto fijo"; es −4,6% del arranque real) | La cifra corregida coincide con lo medido |
| **3** | Mover los scripts de medición a `docs/herramientas/` para poder repetir la medida | `node` los ejecuta desde su ruta nueva |

---

## Registro de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| v1 | 2026-08-17 | Diseño inicial. Corrige el diagnóstico: el "diseño íntegro" no causaba reescrituras; el gasto está en el NÚMERO de llamadas (Bash 45% + Edit 19%), no en el volumen |
| v2 | 2026-08-17 | **Implementado.** R1-R6 en el skill (191 líneas, 0 contaminación); cifra del diseño anterior corregida; `docs/herramientas/medir-tokens.js` con 4 subcomandos, probado contra los transcripts reales |

---

## 9. Resultado de la implementación

| Fase | Qué se hizo | Verificación |
|---|---|---|
| 1 | R1-R6 en `~/.claude/skills/flujo-desarrollo/SKILL.md` | Las 6 presentes · 191 líneas (<500) · **0 menciones** a ningún proyecto |
| 2 | Corregida la cifra del diseño del 16 ago | Marcada como engañosa · aparecen el 4,6% y los 76k reales |
| 3 | `docs/herramientas/medir-tokens.js` | `node --check` limpio · los 4 subcomandos reproducen las cifras del diagnóstico |

**La medición es ahora repetible por Kris sin depender de mí:**

```
node docs/herramientas/medir-tokens.js arranque
node docs/herramientas/medir-tokens.js sesiones
node docs/herramientas/medir-tokens.js turnos   <id>
node docs/herramientas/medir-tokens.js llamadas <id>
```

Sin argumentos lista las sesiones disponibles. Con `--dir` apunta a otro proyecto.

**Línea base para comparar** (esta sesión, al implementar): 191 llamadas — Bash 45%,
Edit 20%, Write 18%. Arranque 76k, contexto final 444k. El criterio de éxito del §7 se
mide contra estas cifras en el próximo trabajo de tamaño comparable.
