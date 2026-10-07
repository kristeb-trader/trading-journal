---
paths:
  - "chaumer/05_Backtesting/claude/motor/lector.py"
  - "chaumer/01_Plan/reglas/**"
  - "chaumer/01_Plan/PARAMETROS.md"
  - "NinjaTrader/MotorChaumer.cs"
  - "NinjaTrader/BotChaumer.cs"
  - "NinjaTrader/MarcacionChaumer.cs"
  - "scripts/bot/**"
---

# El bot y la sincronía de los dos motores (D-038)

Diseño: `docs/disenos/2026-10-06-bot-chaumer.md`. **Un cambio de regla aprobado llega a la vez al motor, al bot y a
todo lo demás, o no llega a ninguno** (Kris, 06/10/2026).

| Qué | Única fuente | La leen |
|---|---|---|
| Los números del plan | `PARAMETROS.md` → `parametros` de `reglas.json` (`leer-reglas.mjs --escribir`) | `lector.py`, `MotorChaumer.cs` y `medir.py`. **Ninguno escrito a mano en un motor**, y ninguno como propiedad editable del bot en NinjaTrader |
| La lógica | `lector.py` (la referencia) | `MotorChaumer.cs`: traducción **literal**, con el mismo texto en cada evento |

## Al cambiar el marcado o un setup

1. El cambio en `lector.py` **y el mismo** en `MotorChaumer.cs`. **`MarcacionChaumer.cs` no se toca sin el sí de
   Kris** (07/10/2026): es el indicador de su gráfico operativo manual y es independiente del bot, con su propio
   `ZigzagChaumer`. La sincronía lo compara sin modificarlo; si un cambio de corridas o retrocesos lo descuadra, se le
   dice a Kris y se le pide el cambio.
2. `python scripts/bot/sincronia.py --sellar`: regresión + los dos motores con el día entero y vela a vela en todos
   los días con datos. Solo con **0 diferencias** escribe el `SELLO`. Si es un **cambio de regla aprobado**, con
   `--cambio-de-regla`: los días que cambian respecto a git se enseñan para revisarlos y no bloquean; los dos motores
   tienen que seguir a 0 entre sí. Después, las fichas de los días que cambian se rehacen con la cadena.
3. Commit con los dos archivos. El hook `scripts/hooks/pre-commit` rechaza el commit si el sello no es el suyo
   (activado con `git config core.hooksPath scripts/hooks`).
4. **Avisar a Kris: copiar `MotorChaumer.cs` a `Documentos\NinjaTrader 8\bin\Custom\AddOns\` y F5.** Sin eso el bot
   no opera (comprueba su sello contra el repositorio).

Si solo cambia un **número** de `PARAMETROS.md`, basta regenerar `reglas.json`: los dos motores lo leen. Igual se pasa
`sincronia.py`.

## Lo que la sincronía no puede ver

Solo prueba lo que pasa en los días con datos (64 el 06/10/2026). Una rama del motor que esos días no recorren no
queda probada: el 06/10, un cambio en el rompimiento de **1 tick exacto** no se detectó porque ningún día lo tuvo.
Al traducir, **línea a línea**, no "algo equivalente".

`MotorChaumer.cs` y el arnés (`NinjaTrader/pruebas/ArnesMotor.cs`) están en **C# 5** para el `csc` del sistema: sin
`?.`, sin `$""`, sin miembros con `=>`. Los archivos de C# van en UTF-8 y se compilan con `/codepage:65001`.
