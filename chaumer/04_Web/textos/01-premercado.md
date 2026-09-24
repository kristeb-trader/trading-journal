# 01 · Premercado

> Dirección: `/premercado`
> Corrige el texto libremente. **No borres ni cambies las líneas `<!-- id: … -->`**:
> son las que dicen a qué parte de la página vuelve cada bloque.

<!-- id: cabecera -->

## Premercado

Todo lo que se resuelve antes de que abra el mercado

---

<!-- id: estado -->

### Cómo estoy hoy R-37

La primera pregunta del día no es sobre el mercado. Es sobre uno mismo: ¿estoy bien, física y mentalmente?

> **[NO SE HACE]**
> **Si la respuesta es no, no se opera.** El día se cierra ahí, sin abrir la plataforma.
> Es la única condición del método que no tiene una medida. No la tiene a propósito: la decide el operador y nadie más la puede comprobar por él.

Esta pregunta se contesta **antes de abrir NinjaTrader**.

> 🖼 **Gráfico.** Texto alternativo: El puesto de trabajo con las pantallas apagadas, antes de empezar la sesión

---

<!-- id: noticias -->

### El calendario R-35 · R-36

Se mira Forex Factory, y solo Forex Factory. Un único calendario evita el problema de dos fuentes que no siempre coinciden.

> 🖼 **Gráfico.** Texto alternativo: El calendario de Forex Factory con un evento de la Fed en rojo

#### Qué se anota

1. **¿Hay hoy un evento de la Fed en rojo?** Si lo hay, el día entero cambia de reglas: **Día con la Fed en rojo:** ese día no se opera el setup de continuación. Solo se permite el **Reingreso**, con todas sus condiciones normales.
2. **La hora exacta de cada noticia roja.** Solo aplica el **Rojo**: naranja y amarillo no cuentan, no bloquean nada.
3. **La ventana de cada una:** no se opera cinco minutos antes y cinco después.

---

<!-- id: instrumento -->

### El gráfico R-01 · R-03

Se trabaja únicamente con el micro Nasdaq, **MNQ**. Aquí se marcan las zonas, se lee el volumen, se leen los niveles de entrada, stop y objetivo, y desde aquí se manda la orden.

> 🖼 **Gráfico.** Texto alternativo: El gráfico de MNQ a un minuto, con el indicador de volumen

> **[REGLA DURA]**
> **Para todo, el mismo gráfico:** análisis y ejecución. No hay un segundo instrumento de referencia.

Va a **un minuto**. No hay ningún otro marco temporal en el método: ni cinco minutos para «ver el contexto», ni diario para «ver la tendencia».

- **Indicadores en pantalla** — **Uno solo: Volume Up Down.** Nada más
- **Prohibidos** — Medias, osciladores, VWAP, perfil de volumen
- **Qué vale un punto** — $2,00
- **Qué vale un tick** — 0,25 puntos · $0,50

---

<!-- id: atm -->

### Estrategia ATM R-31

La estrategia ATM de NinjaTrader se deja configurada antes de empezar y no se toca durante la sesión.

> 🖼 **Gráfico.** Texto alternativo: La estrategia ATM K1 configurada en NinjaTrader

- **Cuál** — **K1**
- **Contratos** — **1 MNQ**
- **Auto Breakeven** — **Apagado**
- **Auto Trail** — **Apagado**
- **Stop y objetivo por defecto** — **320 ticks** = 80 puntos = $160

> **[REGLA DURA]**
> **Ese valor por defecto no es el stop de la operación:** es lo que protege la posición entre el llenado y el ajuste a mano, que son unos segundos. El stop de verdad se coloca después, y sale de la estructura del mercado.

**El valor por defecto es igual al tope de stop a propósito.** Si algún día cambia el tope, hay que cambiar la ATM con él.

---

<!-- id: zonas-vol -->

### Zonas por volumen R-15

Si en el premercado se forma una vela con un volumen por encima del umbral (**> 8.000 contratos en MNQ**), se debe marcar una zona. Es la única manera de que nazca una zona sin que haya habido un movimiento y su descanso.

> 🖼 **Gráfico.** Texto alternativo: Vela de premercado con volumen por encima del umbral y la zona que deja
> Pie: Una vela de premercado por encima del umbral y la zona que deja. La zona se comporta después como cualquier otra.

1. **Se escanea desde las 19:00 hora Colombia (apertura de Tokio)** del día anterior, hasta la apertura americana.
2. **Toda vela que supere el umbral de volumen deja zona.** Todas, no solo las más altas o las más bajas del grupo.
3. **El color de la vela decide el tipo:** vela alcista deja resistencia sobre su mecha superior; vela bajista deja soporte sobre su mecha inferior.
4. **Los límites son los de siempre:** del borde del cuerpo a la punta de la mecha.

- **Umbral** — **> 8.000 contratos en MNQ**, en una vela de un minuto
- **Desde cuándo** — 19:00 hora Colombia (apertura de Tokio)
- **Hasta cuándo** — La apertura del mercado americano

> **[REGLA DURA]**
> **En la apertura, la regla del volumen se apaga.** A partir de ahí las zonas solo nacen de la estructura, por alto que sea el volumen de una vela.

Estas zonas se comportan luego **igual que cualquier otra**: se rompen igual, se estiran igual, caducan igual y sirven de borde para medir las que vengan después.
