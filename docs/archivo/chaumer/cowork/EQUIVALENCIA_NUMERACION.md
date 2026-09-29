# EQUIVALENCIA DE NUMERACIÓN — antes y después del 06/09/2026

El **06/09/2026** las 38 reglas se **renumeraron** para que corran seguidas dentro del orden de las siete categorías. Antes los números venían del orden en que se fueron descubriendo, y por eso la categoría *Estructura del precio* saltaba de la 11 a la 31.

> 🔴 **Toda la documentación usa ya la numeración nueva**, incluido el historial de versiones y el registro cronológico. **No conviven dos numeraciones.** Esta tabla existe para traducir notas viejas, capturas antiguas o cualquier referencia externa.

## De la numeración nueva a la vieja

| Nueva | Antes era | Categoría | Regla |
|---|---|---|---|
| **R-01** | R-01 | Perímetro operativo | Analiza, marca zonas y ejecuta TODO sobre MNQ |
| **R-02** | R-02 | Perímetro operativo | Opera unicamente durante los 120 minutos siguientes a la apertura de la sesion |
| **R-03** | R-09 | Perímetro operativo | Opera con un grafico limpio: velas de 1 minuto y volumen, nada mas |
| **R-04** | R-26 | Perímetro operativo | Opera siempre 1 contrato MNQ |
| **R-05** | R-10 | Estructura del precio | Una corrida (= impulso) es la secuencia de velas que arranca cuando una vela s |
| **R-06** | R-11 | Estructura del precio | El retroceso es la secuencia de velas que arranca en la vela que mata la corri |
| **R-07** | R-31 | Estructura del precio | La vela de las 08:31 declara la direccion inicial de la sesion con su propio c |
| **R-08** | R-32 | Estructura del precio | Vela con maximo mayor y minimo menor sin corrida viva: pasa a ser la nueva vel |
| **R-09** | R-12 | Zonas · marcado | Marca la zona sobre la vela designada, desde el borde de su cuerpo hasta el ex |
| **R-10** | R-15 | Zonas · marcado | Si el rompimiento fue con mecha y pasan 5 velas sin consecucion, extiende la z |
| **R-11** | R-16 | Zonas · marcado | Si el rompimiento fue con cuerpo y pasan 5 velas sin consecucion, marca una zo |
| **R-12** | R-17 | Zonas · marcado | Marca una zona entre dos zonas solo si el movimiento que la genera queda enter |
| **R-13** | R-18 | Zonas · marcado | Si la zona que ibas a marcar toca una existente, no marques una nueva: estira  |
| **R-14** | R-19 | Zonas · marcado | El plazo de 5 velas es un TOPE, no una espera obligatoria: si antes el mercado |
| **R-15** | R-20 | Zonas · marcado | En la ventana de premercado (19:00 hora Colombia del dia anterior hasta la ape |
| **R-16** | R-33 | Zonas · marcado | La zona de la corrida se marca al aparecer el retroceso; la del retroceso solo |
| **R-17** | R-35 | Zonas · marcado | Dentro de una banda entre dos zonas se marca como maximo una zona en toda la j |
| **R-18** | R-36 | Zonas · marcado | Salir de una zona o de una banda es rompimiento mas consecucion, no geometria |
| **R-19** | R-38 | Zonas · marcado | Seis precisiones de dibujo de zonas |
| **R-20** | R-13 | Zonas · vigencia | Rompimiento es superar el borde de la zona por al menos un tick; consecucion e |
| **R-21** | R-14 | Zonas · vigencia | Una zona deja de tener efecto cuando ha sido superada en las dos direcciones |
| **R-22** | R-37 | Zonas · vigencia | La vela que confirma un traspaso no abre a la vez el rompimiento del lado cont |
| **R-23** | R-05 | Setup y entrada | Toma el primer setup valido cuya orden se llene |
| **R-24** | R-07 | Setup y entrada | Entra siempre con orden stop en reposo colocada al cierre de la vela de rompim |
| **R-25** | R-22 | Setup y entrada | Setup IRI: corrida, retroceso, zona, rompimiento de esa zona y consecucion |
| **R-26** | R-23 | Setup y entrada | Setup Reingreso: tras un rompimiento con consecucion que falla, el precio recu |
| **R-27** | R-34 | Setup y entrada | La direccion de la vela de las 08:31 marca por donde empieza el dia pero no ob |
| **R-28** | R-03 | Riesgo, orden y gestión | Ejecuta como maximo una operacion por sesion |
| **R-29** | R-04 | Riesgo, orden y gestión | Manten la orden pendiente hasta que se llene, hasta que se agoten 5 velas sin  |
| **R-30** | R-06 | Riesgo, orden y gestión | Una operacion abierta se gestiona hasta stop o target, aunque termine la venta |
| **R-31** | R-08 | Riesgo, orden y gestión | Ejecuta con la ATM K1 al valor de ATM_DEFECTO y ajusta stop y target a mano tr |
| **R-32** | R-24 | Riesgo, orden y gestión | Ancla la regla en el nivel de entrada, mide el stop hasta su referencia estruc |
| **R-33** | R-25 | Riesgo, orden y gestión | Una vez ajustados stop y target, NO se gestiona la posicion |
| **R-34** | R-30 | Riesgo, orden y gestión | Al llenarse la orden termina el ANALISIS del dia, no solo la operativa |
| **R-35** | R-21 | Filtros de no-operar | No operes en la ventana de +/-5 minutos alrededor de una noticia roja de Forex |
| **R-36** | R-27 | Filtros de no-operar | En dia de FOMC no se opera IRI |
| **R-37** | R-28 | Filtros de no-operar | No se opera estando enfermo o sin encontrarse bien mentalmente |
| **R-38** | R-29 | Proceso diario | Ejecuta la sesion siguiendo la checklist diaria en orden, y registra TODAS las |

## Lo que cambió y lo que no

- **No cambió ninguna regla.** Solo el número con el que se la nombra.
- El archivo `reglas.json` queda **ordenado por categoría y por número**, y cada regla conserva su historial.
- Los **diagramas** de `02_Assets\diagramas\` se copiaron con los nombres nuevos. **Las copias con el nombre viejo siguen ahí y se pueden borrar**: `R-10_corrida.png`, `R-11_retroceso.png`, `R-12_zona.png`, `R-13_vigencia.png`, `R-15_extension_apendice.png`, `R-17_zonas_entre_zonas.png`, `R-23_reingreso.png` y `02_Assets\invalidos\R-17_invalido_01.png`.

## ✅ El desajuste que quedaba, resuelto el 06/09/2026

`TRADING_PLAN_CHAUMER.md` estaba organizado **por sub-fases** (`F1.0`, `F1.1`, …) —el orden en que se construyó el plan—, así que con la numeración nueva sus secciones ya no iban en orden: se leía `R-01`, `R-02`, `R-28`, `R-29`…

**El operador decidió reorganizarlo.** El documento pasa a **v3.1**: primero las **siete categorías** en su orden de uso durante el día, con las reglas por número dentro de cada una, y después un bloque de **anexos** que conserva íntegra la narrativa de cada sub-fase, los diagramas, las desviaciones y las correcciones del auditor.

Ninguna regla cambió. La navegación por sub-fases del portal hay que rehacerla contra `reglas.json`, que es donde viven las categorías.
