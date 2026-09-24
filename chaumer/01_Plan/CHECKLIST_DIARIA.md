# CHECKLIST DIARIA

> **Se ejecuta de arriba abajo. No se decide nada que no esté aquí.**
> Cada línea cita su regla. Si una respuesta es **NO** donde dice parar, **se para** — no se evalúa, no se matiza.

**Versión del plan:** 3.12 · 2026-09-23 · **40 reglas**

---

## 🅰 ANTES DE ABRIR NINJATRADER

| ☐ | Comprobación | Regla | Si falla |
|---|---|---|---|
| ☐ | **¿Estoy bien, física y mentalmente?** | `R-37` | **NO → no se opera hoy.** Se cierra aquí |
| ☐ | Forex Factory: **¿hay evento de la Fed en rojo hoy?** | `R-36` | **SÍ → hoy solo Reingreso. Continuación prohibida todo el día** |
| ☐ | Forex Factory: anotar la **hora de cada noticia roja** | `R-35` | — |
| ☐ | Calcular las ventanas **T−5 → T+5** y marcar las que caigan dentro de la ventana operativa | `R-35` | — |

> Este bloque se contesta **antes** de abrir la plataforma. Con el gráfico delante ya no es la misma pregunta.

---

## 🅱 PREMERCADO · desde las 19:00 hora Colombia del día anterior

| ☐ | Acción | Regla |
|---|---|---|
| ☐ | Gráfico abierto: **MNQ, 1 minuto**, único indicador **Volume Up Down** | `R-03`, `R-01` |
| ☐ | Escanear desde **19:00 Col** (apertura de Tokio) hasta la apertura americana | `R-15` |
| ☐ | Toda vela que **supere el umbral de volumen** → marcar zona. **Alcista → resistencia · Bajista → soporte** | `R-15` |
| ☐ | ⚠️ **Mirar el umbral vigente en `PARAMETROS.md` antes de empezar.** Hoy son **más de 8.000 contratos en MNQ** (desde el 14/09/2026). Es un parámetro ajustable, y **no se cambia con la sesión empezada** | `R-15`, `P-37` |
| ☐ | Se marcan **todas** las que superen el umbral, no solo los extremos | `R-15`, `D-09` |
| ☐ | Límites de cada zona: **del borde del cuerpo a la punta de la mecha** | `R-09` |
| ☐ | Si una zona candidata **toca** otra existente → **estirar la existente**, no crear una nueva | `R-13` |
| ☐ | Zona entre dos zonas: solo si el **movimiento no cruza el 50 %** entre bordes internos | `R-12` |

> 🔴 **La regla del volumen se apaga en la apertura americana.** A partir de ahí solo se marcan zonas por estructura.

---

## 🅲 VENTANA OPERATIVA · 08:30–10:30 Col *(verano)* · 09:30–11:30 Col *(invierno)*

### Identificar

| ☐ | Acción | Regla |
|---|---|---|
| ☐ | **Primer setup válido.** No se compara con posibles setups posteriores ni se espera uno mejor | `R-23` |
| ☐ | ¿Es **Continuación** o **Reingreso**? | `R-25` / `R-26` |
| ☐ | *(solo Continuación)* **¿La corrida es FLUIDA?** Tres cosas seguidas: la corrida dejó su zona · **el retroceso no se pasó** (mide menos que su corrida) · y **ésta es la corrida siguiente, que la rompe**. Cada corrida se empareja con el retroceso que viene justo después de ella | `R-40` |

### Medir · anclar la regla en el nivel de entrada

| ☐ | Setup | Dónde va el stop | Regla |
|---|---|---|---|
| ☐ | **Continuación** | extremo del **retroceso** | `R-32` |
| ☐ | **Reingreso** | extremo de la **corrida fallida** | `R-32` |
| ☐ | **Target** = misma distancia, al otro lado. **1:1** | | `R-32` |

### Los filtros · basta que falle uno

| ☐ | Filtro | Regla | Si falla |
|---|---|---|---|
| ☐ | Stop ≤ **80 puntos** (`STOP_MAX`) | `R-31` | **NO SE OPERA** |
| ☐ | Target 1:1 **libre de zonas vigentes** | `R-32`, `R-21` | **NO SE OPERA** |
| ☐ | *(solo Reingreso)* Target **sin pasar del punto de referencia** vivo más cercano que quede entre la entrada y el objetivo — el nivel de referencia de cualquier retroceso. Muere solo cuando **una vela CIERRA** más allá; la mecha no lo rompe | `R-41`, `R-26` | **NO SE OPERA** |
| ☐ | *(solo Continuación)* ¿La corrida es fluida? | `R-40` | **NO SE OPERA ESE ROMPIMIENTO.** La zona sigue viva. Se espera a otro IRI que deje una zona nueva **entera** más allá de ésta — por encima para largo, por debajo para corto |
| ☐ | ¿Es día de FOMC y el setup es una **Continuación**? | `R-36` | **NO SE OPERA** |

> 🔴 **El target nunca se acorta para que quepa.** No existe media entrada ni ratio reducido.

> 🟠 **Si un setup se descarta, la zona NO queda vacía.** Tras rechazar una **Continuación** por cualquiera de los cuatro filtros, **seguir mirando esa misma zona**: si el rompimiento falla y el precio la atraviesa entera hasta salir por el borde contrario, ahí hay un **Reingreso** (`R-26`) — y puede llegar en la **misma vela**. Caso real: `G-12`, 06/07/2026, IRI descartado y Reingreso operado con un minuto de diferencia.

### Enviar

| ☐ | Acción | Regla |
|---|---|---|
| ☐ | ¿Estoy dentro de una ventana de noticia **T−5 → T+5**? → **no colocar**. Si ya hay orden puesta, **cancelarla** | `R-35` |
| ☐ | **Stop Market** al cierre de la vela de rompimiento o de reingreso, **1 tick más allá de su extremo** | `R-24` |
| ☐ | La orden se envía sobre el gráfico de **MNQ** — el único que hay | `R-01`, `R-24` |
| ☐ | **No se persigue el precio a mano.** Orden a mercado y orden límite: prohibidas | `R-24` |

### Vigilar la orden pendiente · cancelar con lo primero que llegue

| ☐ | Causa de cancelación | Regla |
|---|---|---|
| ☐ | **Pasan 5 velas desde el rompimiento sin consecución** (el precio no llega al nivel de la orden) | `R-29` |
| ☐ | El precio **vuelve al punto del stop** — el extremo alcanzado desde que nació la zona (`R-32`) | `R-29` |
| ☐ | Son las **11:29 ET** | `R-29` |
| ☐ | ⚠️ **Un retroceso nuevo NO cancela.** La orden sigue viva | `R-29` |
| ☐ | Entra una **ventana de noticia roja** | `R-35` |

> 🔴 **CORREGIDO 27/08/2026 — antes decía lo contrario.** El paso de 5 velas **SÍ cancela la orden**, y un retroceso nuevo **NO**.
> La caducidad se comprueba **antes** del llenado: pasado el plazo la orden ya no existe y no puede llenarse aunque el precio toque el nivel en esa misma vela.
> Caso real 9/07/2026: orden puesta en la 8:43, cancelada por error en la 8:45; con la regla correcta sigue viva y se llena en la **8:46**.
> Una orden cancelada **no consume el cupo** de `R-28`: se puede esperar otro setup.

---

## 🅳 TRAS EL LLENADO

| ☐ | Acción | Regla |
|---|---|---|
| ☐ | **1º** mover el **stop** a su nivel estructural | `R-31` |
| ☐ | **2º** mover el **target** a distancia 1:1 | `R-31`, `R-32` |
| ☐ | 🛑 **NO SE TOCA NADA MÁS. JAMÁS.** Ni breakeven, ni cierre manual, ni parcial, ni añadir | `R-33` |
| ☐ | Solo hay dos salidas: **stop o target** | `R-33` |
| ☐ | Cupo consumido. **No más órdenes hoy**, aunque aparezcan setups válidos | `R-28` |
| ☐ | El fin de ventana **no obliga a cerrar** una posición abierta | `R-30` |

---

## 📓 REGISTRO · se llena TODOS los días, se opere o no

### Automático · indicador de NinjaTrader
entrada · salida · niveles · hora · resultado

### Manual
| Campo | Por qué |
|---|---|
| **Setup**: `Continuación` / `Reingreso` · **Dirección**: alcista / bajista | sin esto no se pueden separar estadísticas por setup |
| **Imagen** de la operativa | `F1.10`, galería de casos |
| **Errores** cometidos | detecta desviaciones del plan |
| **Observaciones** | |
| **Días sin operar: el motivo** | 🔑 lo que casi ningún journal registra, y lo que más falta hace |

### Campos que cierran pendientes abiertos

| Campo a anotar | Cierra |
|---|---|
| Nº de zonas de premercado marcadas ese día | `D-09` — ¿marcar todas satura el gráfico? |
| ¿El precio se frenó en el **mín/máx de premercado** antes del target? | `P-01` |
| **Comisión real** ida y vuelta por contrato MNQ | `P-12` |
| Racha de días perdedores consecutivos | 🚨 `P-21` — **la regla de parada que el plan no tiene** |
| ¿El stop saltó en 80 pts siendo el estructural menor? | `P-09` |
| Hora exacta de la entrada | `P-20` — dónde acaba "la apertura" |


---

## 🔴 Añadido 27/08/2026 · lo que hay que mirar en cada zona

*Estas comprobaciones son de **marcado**, no de ejecución. Van mientras se lee el gráfico.*

| ☐ | Comprobación | Regla |
|---|---|---|
| ☐ | ¿La zona candidata cae dentro de una **banda ya gastada** hoy? → **no se marca** | `R-17` |
| ☐ | ¿Hay una zona viva con **rompimiento esperando consecución** entre el precio y la zona candidata? → **no se marca** | `R-18` |
| ☐ | El rompimiento se lee por la **mecha**, no por el cierre | `R-19` |
| ☐ | Una zona **no queda inválida** hasta que llega la **consecución** — y esa consecución **no tiene plazo** | `R-20`, `R-21` |
| ☐ | La vela que confirma un traspaso **no abre** el rompimiento contrario: se busca desde la siguiente | `R-22` |
| ☐ | Vencido el plazo sin consecución: **mecha → se estira** · **cuerpo → nace apéndice** | `R-10`, `R-11` |
| ☐ | El rectángulo se dibuja **desde la vela origen** | `R-19` |

## 🔴 Añadido 27/08/2026 · antes de enviar la orden

| ☐ | Comprobación | Regla |
|---|---|---|
| ☐ | El **stop** es el extremo alcanzado **desde que nació la zona** hasta el rompimiento — no solo el del retroceso que la originó | `R-32` |
| ☐ | Si es **Reingreso**: ¿el precio ya superó el extremo de la vela de consecución? → **no hay reingreso** | `R-26` |
| ☐ | Se buscan entradas en **los dos sentidos**; la vela de apertura no sesga el día | `R-27` |
