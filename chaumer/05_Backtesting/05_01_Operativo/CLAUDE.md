# Registro de backtesting manual — instrucciones para Claude Code

**Arranca siempre desde esta carpeta (`05_01_Operativo`).** Las instrucciones generales del proyecto están en `..\..\CLAUDE.md`.

---

## 🔴 Qué es esto, y qué NO es

**Es un módulo de REGISTRO.** Christian hace el backtesting **a mano**, mirando el gráfico en NinjaTrader, aplicando el plan él mismo. Este módulo solo **guarda lo que él ya decidió**: una fila por día, con su imagen.

**NO es un motor de backtesting.** No lee datos de mercado. No aplica reglas. No marca zonas. No calcula si hubo setup. No detecta nada. Si te encuentras escribiendo lógica de la metodología, **te saliste del encargo: para y pregunta.**

El backtesting automático —el que sí usa el motor— es la segunda fase y vive en la carpeta de al lado, `05_02_Operativo_Contexto`. **No la toques.**

---

## Lo que no se toca

| Carpeta | Por qué |
|---|---|
| `..\..\01_Plan\` | El plan. Solo lectura, siempre. |
| `..\..\04_Web\` | El portal. Otra vía, otro encargo. |
| `..\05_02_Operativo_Contexto\` | La fase siguiente. Vacía a propósito. |
| `..\lector.py` · `..\dia.py` | El motor de auditoría. **Este módulo no lo usa ni lo importa.** |

Los cuatro huecos que bloquean el backtesting automático **no bloquean esto**: un módulo que guarda decisiones ya tomadas no depende de que el motor esté bien.

---

## Cómo hablarle al operador

- **Nunca uses códigos de regla** (`R-17`, `P-22`, `G-12`). No los tiene a mano. Lenguaje claro.
- Máximo **2 preguntas por turno**.
- **Nada se da por bueno sin su sí explícito.** Si algo no está definido, para y pregunta — no lo rellenes con lo que suele hacerse.
- Prefiere que le enseñes cómo va a quedar, no que se lo describas.

---

## Lo que te toca hacer


---

## Para gastar menos

- `/clear` entre tareas.
- No listes la carpeta del proyecto entera: hay `node_modules\` y `.git`, son miles de entradas.
- No abras `TRADING_PLAN_CHAUMER.md`. **No lo necesitas para esto.** Es el plan del método, y este módulo no aplica el método.
