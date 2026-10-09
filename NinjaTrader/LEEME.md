# NinjaTrader — qué hay, qué instalar y cómo se usa

**Actualizado:** 07/10/2026 · Es la referencia para **reinstalar NinjaTrader desde cero** y para recordar qué hace cada
pieza. La versión buena de cada archivo es **la de esta carpeta** del repositorio.

---

## 1 · Lo que se instala

Todos van en `Documentos\NinjaTrader 8\bin\Custom\`, cada uno en su carpeta.

### Indicadores · `Custom\Indicators\`

| Archivo | Qué hace | Dónde se pone | Depende de |
|---|---|---|---|
| **SupabaseAutoExport** | Exporta cada operación cerrada a Supabase. La cuenta principal (o las que empiezan por `PA-`) va al Journal (`trades`) y avisa por Telegram; el resto de cuentas Apex, a `apex_trades`. **Ignora las cuentas de simulación** (SimBot, Sim101, Playback) | Un gráfico de MNQ: una sola instancia vigila todas las cuentas | la clave de Supabase |
| **SupabaseDailyLevels** | Escribe los niveles del día en la sesión del Journal: apertura, máximo, mínimo y cierre de ayer; apertura de hoy; máximo y mínimo del premercado | Gráfico MNQ con la plantilla **ETH**. Propiedades: RTH abre **930**, cierra **1600** (hora de **Nueva York**) | la clave de Supabase |
| **MarcacionChaumer** | El **zigzag blanco** de corridas y retrocesos, en tiempo real. Es el de **tu gráfico operativo manual**: **independiente del bot**, no se toca sin tu sí | Tu gráfico de operar, 1 minuto. Propiedad: la cuenta que vigilas (al volver a plano tras operar, deja de dibujar) | nada |
| **VistaMotorChaumer** | **El motor del bot dibujado en vivo**: zonas (las vigentes, hasta las 10:30; 11:30 en invierno), zigzag, puntos de referencia (solo los que quedan entre la entrada y el objetivo de un reingreso), la franja de la operación y una línea arriba con lo que el motor tiene en marcha | El gráfico del bot (o donde quieras ver las zonas). Si está también MarcacionChaumer, apaga **Zigzag** en uno de los dos | `MotorChaumer`, `ChaumerNT`, el repositorio |

### AddOns · `Custom\AddOns\`

| Archivo | Qué hace | Cómo se usa | Depende de |
|---|---|---|---|
| **ChecklistChaumer** | El **panel flotante del checklist**, sincronizado con el Journal: casillas, noticias rojas y el GO | Control Center → **New → Checklist Chaumer**. Se reinicia solo a las 9:00 de Nueva York | la clave de Supabase |
| **CadenaDiaria** | Sin ventana. A las **10:32** (11:32 en invierno) exporta las velas del día y lanza el puente: el motor, la ficha en Supabase, el gráfico y la publicación en el portal. Si el motor deja la operación abierta, vuelve a exportar **cada 30 minutos** hasta las 16:50 de Nueva York (la hora del cierre por hora); mientras, el calendario «Claude» la muestra como «abierta» | Nada: arranca solo con NinjaTrader | Python, el repositorio, la clave |
| **MotorChaumer** | **El motor del plan en C#**: la traducción literal de `lector.py`, **sellada** | No se ve: lo usan el bot y la vista | nada |
| **ChaumerNT** | Lo común del bot y la vista: configuración, sello, lecturas de Supabase, velas del día | No se ve | `MotorChaumer` |

### Estrategia · `Custom\Strategies\`

| Archivo | Qué hace | Cómo se usa | Depende de |
|---|---|---|---|
| **BotChaumer** | **El bot.** Al cierre de cada vela pregunta al motor qué orden debe estar viva y la pone: entrada stop, con los contratos que caben en $160; al llenarse, stop y objetivo exactos; nada más ese día. **A las 16:50 de Nueva York** (15:50 Col en verano), si sigue abierta, cancela stop y objetivo y **cierra a mercado** (CIERRE POR HORA). Solo opera en las cuentas de su lista blanca. Deja una fila por día en `bot_operaciones` | Gráfico MNQ 1 minuto ETH → clic derecho → **Strategies…** → BotChaumer, cuenta **SimBot**, Modo **Automatico**, **Enabled** | `MotorChaumer`, `ChaumerNT`, el repositorio, la clave |

### Herramienta de dibujo · `Custom\DrawingTools\`

| Archivo | Qué hace |
|---|---|
| **RR** | El Risk Reward que mide en **puntos**. Convive con el original de NinjaTrader |

### No se instala

| Archivo | Para qué |
|---|---|
| `pruebas/ArnesMotor.cs` | Solo lo usa `scripts/bot/sincronia.py` fuera de NinjaTrader, para comparar los dos motores |

---

## 2 · Lo que hay fuera del repositorio · `Documentos\NinjaTrader 8\`

| Archivo | Qué | ¿Se crea solo? |
|---|---|---|
| `supabase-service-key.txt` | La clave secreta de Supabase (service_role). Sin ella nada escribe en el Journal | **No.** Está en el gestor de contraseñas. **Nunca en el repositorio** (es público) |
| `cadena-diaria.json` | Configuración de la cadena: carpeta de las velas, Python, el puente | Sí |
| `bot-chaumer.json` | Configuración del bot y la vista: ruta del repositorio, cuentas permitidas, si exige el GO | Sí |
| `checklist-chaumer-config.json` | Posición y tamaño del panel del checklist | Sí |
| `cadena-diaria\registro.txt` · `bot-chaumer\registro.txt` | Lo que hicieron la cadena y el bot. En `bot-chaumer\` quedan también los CSV del Strategy Analyzer | Sí |

---

## 3 · Instalar desde cero

1. **NinjaTrader:** zona horaria **(UTC−05:00) Bogotá** (Tools → Options → General).
2. **Copiar todos los `.cs` de esta carpeta a la vez**, cada uno en su carpeta de la tabla, y **un solo F5** en el editor
   de NinjaScript. El bot y la vista no compilan sin `MotorChaumer` y `ChaumerNT`.
3. **La clave:** `Documentos\NinjaTrader 8\supabase-service-key.txt`.
4. **La cuenta de simulación `SimBot`**, creada a mano.
5. **El repositorio** en `E:\Proyectos\Trading Journal` (o la ruta que diga `bot-chaumer.json`): el bot y la vista
   comprueban ahí el sello del motor.
6. **Python** en el PATH, con `matplotlib`: la cadena dibuja los gráficos con `dia.py`.
7. **Gráficos:** MNQ del **contrato vigente**, **1 minuto**, plantilla **ETH** (`<Use instrument settings>`).
8. **Datos:** si un día falta en el histórico (lo avisa el bot en su registro: *«ventana incompleta»*), Tools →
   Historical Data → **Load** → MNQ del contrato, Minute, las fechas → Download.

---

## 4 · El bot, cada día

| Cuándo | Qué |
|---|---|
| Antes de las **8:31** (9:31 en invierno) | Anotar las noticias rojas en el checklist. Activar BotChaumer en **SimBot**. En el Output: `[BotChaumer] listo · cuenta SimBot · … · sello L:…` |
| **8:31** | En el Output: `armado AAAA-MM-DD · noticias N · GO …` |
| Durante la ventana | **Nada de F5 ni recompilar**: desactiva o reinicia el bot |
| **10:32** | La cadena hace la ficha del motor; se compara con lo que hizo el bot |

**Si dice `NO OPERA en esta sesión` o `no se arma`**, el motivo viene en la misma línea. Los más comunes:

| Motivo | Qué hacer |
|---|---|
| *motor desincronizado* | Cambió el motor en el repositorio: copiar `MotorChaumer.cs` a `Custom\AddOns\` y F5 (fuera de la ventana) |
| *la cuenta … no está en la lista blanca* | Usar SimBot, o añadir la cuenta a `bot-chaumer.json` |
| *no trae el premercado* | El gráfico no es ETH, o le faltan datos desde las 19:00 del día anterior |
| *no pude leer las noticias* | Sin conexión con Supabase: ese día no opera, a propósito |
| *encendido tarde* | El bot se activó después de que el motor llenara su orden: no la persigue |

---

## 5 · Cuando cambia una regla del plan

El motor del bot (`MotorChaumer.cs`) cambia **a la vez** que el de Python (`lector.py`), con la prueba de sincronía y el
sello nuevo (`.claude/rules/bot.md`). Lo único que te toca: **copiar `MotorChaumer.cs` a `Custom\AddOns\` y F5, fuera de
la ventana.** Si no se hace, el bot y la vista dicen *«motor desincronizado»* y no operan: es el candado funcionando.

`MarcacionChaumer` no cambia con las reglas de zonas; si alguna vez un cambio de corridas o retrocesos lo descuadra, la
sincronía lo avisa y el cambio se te pide a ti.
