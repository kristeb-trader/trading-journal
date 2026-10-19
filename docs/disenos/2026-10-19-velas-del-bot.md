# Las velas del bot mandan — la ficha del motor con las velas con las que decidió el bot

**Versión:** v1.0 · **Estado:** 🟡 PROPUESTO (19/10/2026), pendiente del sí de Kris · Relacionado: D-038 (el bot),
`docs/disenos/2026-10-06-bot-chaumer.md` (v1.14: el premercado, del servidor).

---

## 1 · El problema (19/10/2026)

El bot operó una **Continuación bajista a las 9:02** (STOP −43,75) y la ficha del motor de las 10:32 dice
**Continuación alcista a las 9:19** (STOP −35,75). Los dos motores deciden igual con las mismas velas (73/73 días
con la sincronía); lo que cambió fue **la vela base de las 8:31**:

| Fuente | 8:31 | Lo que dice el plan |
|---|---|---|
| El gráfico en vivo (el bot, lo que ve Kris) | con cuerpo bajista | el día empieza bajista → 9:02 Continuación bajista |
| El servidor (la exportación de la cadena) | sin cuerpo: abre y cierra en 29.778,25 | la dirección la da la 8:33 → alcista → el IRI bajista de las 9:02 es el primero tras un movimiento contrario, no se opera |

En el corte de minuto el gráfico y el servidor reparten alguna operación en velas distintas (el registro del bot ya
lo enseña en la 8:30: cierre 29.778,75 en el gráfico, 29.778,25 en el servidor). Un tick basta para cambiar el día.

**Decisión de Kris (19/10/2026), opción a:** manda la vela **en vivo** — la que ve al operar y con la que decidió el bot.
La ficha, la imagen, el calendario «Claude» y la comparación bot↔motor se hacen con **las velas del bot**.

## 2 · Lo que no cambia

- **El motor** (`lector.py` y `MotorChaumer.cs`): ni una línea. El sello sigue igual.
- **El premercado sigue saliendo del servidor** (v1.14 del bot): las velas en vivo de los primeros minutos tras
  conectar pueden traer volumen falso (14/10). «Las velas del bot» son: **premercado del servidor + ventana en vivo**.
- **Los días sin bot** (apagado, días antiguos, fines de semana): la ficha sale como hoy, con el servidor.

## 3 · Las piezas

### 3.1 BotChaumer — guarda las velas con las que decide

- Archivo: `chaumer/05_Backtesting/claude/motor/datos/dia_bot/AAAA-MM-DD.txt` (en el repositorio, carpeta ignorada
  por git como el resto de `datos/`), **mismo formato** que la exportación de la cadena (`yyyyMMdd HHmmss;o;h;l;c;v`,
  UTC, hora de cierre) y su `.meta.json` (`instrumento`, `fuente: "bot"`, `cuenta`, `sello`).
- **Al armarse (8:31):** escribe el premercado del servidor con el que se armó.
- **En cada vela cerrada**, desde la vela base hasta la de las **16:50 de Nueva York** (la del cierre por hora), la
  añade **tal como la tenía al decidir**. Sigue escribiendo aunque ya haya operado o no se haya armado: la ficha
  necesita la ventana entera y, si la operación sigue abierta, el resto del día.
- **Solo añade, nunca reescribe:** una vela ya escrita no se cambia. Si el bot se reinicia (un F5) y el gráfico
  recarga, lo ya escrito sigue siendo lo que se vio en vivo.
- **Al reiniciarse, lee su propio archivo:** las velas ya escritas las toma del archivo, no del gráfico recargado.
  Así el motor del bot sigue decidiendo con las mismas velas antes y después del reinicio.
- No escribe en el Strategy Analyzer ni en Market Replay.

### 3.2 La cadena (`subir_dia.py`) — prefiere las velas del bot

- `archivos(fecha)` gana una tercera fuente, `datos/dia_bot/`, que **manda** sobre la exportación del servidor
  cuando trae la ventana completa (120 velas). Si no está o le faltan velas, se usa el servidor como hasta hoy.
- `motor_fichas.origen_datos` = `'bot'` (hoy `'manual'` / `'addon'`).
- **Se compara con el servidor** y las diferencias van a los avisos de la ficha, como el registro del bot hace con el
  premercado: *«8:31 · bot 29.778,75 → 29.778,25 / servidor 29.778,25 → 29.778,25»*. Las que cambian algo
  (cuerpo ↔ sin cuerpo, color, o un extremo que decide un rompimiento) se marcan.
- **Operación abierta:** la huella de datos ya incluye el archivo; como el bot sigue escribiendo hasta las 16:50,
  cada pasada de la cadena (la de cada 30 minutos con la marca `.abierta`) lo ve crecer y rehace la ficha.
- La imagen (`dia.py`) y la medición de la operación de Kris (`medir.py`) usan el mismo archivo: no cambian.

### 3.3 VistaMotorChaumer — las mismas velas que el bot

Si existe el archivo del bot del día, la vista toma de él las velas de la ventana ya escritas (igual que el bot al
reiniciarse). Sin esto, tras recargar el gráfico la vista dibujaría con las del servidor y volvería a discrepar.

### 3.4 La comparación diaria (fase 5)

Con la ficha y el bot sobre las mismas velas, `bot_operaciones.coincide_motor` pasa a medir de verdad la ejecución
(llenados, deslizamiento, rechazos), no diferencias de datos.

## 4 · Riesgos

| Riesgo | Cómo se cubre |
|---|---|
| El bot no estaba encendido o se encendió tarde | Sin archivo completo → servidor, como hoy, y la ficha lo dice (`origen_datos`) |
| Dos instancias del bot el mismo día (dos cuentas) | El archivo lleva la cuenta en el `.meta.json`; manda la de la lista blanca principal (`SimBot`). Si hay dos, se avisa |
| Una vela en vivo claramente mala (desconexión) | La comparación con el servidor la saca en los avisos; Kris decide si ese día se rehace con el servidor (opción manual en `subir_dia.py --servidor AAAA-MM-DD`) |

## 5 · El 19/10, hoy

El archivo no existe todavía: el bot no guardaba velas. **Mientras el gráfico del bot no se recargue**, sus velas
en memoria siguen siendo las de vivo. Si al instalar la versión nueva el bot no encuentra archivo del día, **vuelca
las velas del gráfico** al arrancar (marcado en el `.meta.json` como `volcado al arrancar`). Si se hace hoy, antes de
recargar el gráfico o cerrar NinjaTrader, la ficha del 19/10 se rehace con las velas en vivo y debería dar la
Continuación bajista de las 9:02, como el bot.

## 6 · Fases y verificación

| Fase | Qué | Verificación |
|---|---|---|
| 1 | BotChaumer escribe, lee al reiniciarse y vuelca al arrancar | compila (csc contra NT8); prueba con un archivo de ejemplo; en NinjaTrader, el archivo del día crece vela a vela |
| 2 | La cadena prefiere `dia_bot/` y compara con el servidor | `subir_dia.py` sobre el 19/10 con el archivo volcado: ficha = operación del bot, avisos con la 8:31 |
| 3 | La vista lee el archivo | tras recargar el gráfico, la cabecera sigue diciendo lo mismo que el bot |
| 4 | Documentación | LEEME, `.claude/rules/ninjatrader.md`, diseño del bot (v1.15), CLAUDE.md (`motor_fichas`) |

**Kris, al terminar:** copiar `BotChaumer.cs`, `ChaumerNT.cs` y `VistaMotorChaumer.cs`, un F5 en el editor y otro en
el gráfico, **fuera de la ventana** (y el 19/10, sin recargar antes el gráfico).
