# La apéndice forma bloque con su zona; tras un traspaso la zona nueva no estira la vieja

| Versión | Fecha | Estado |
|---|---|---|
| v0.1 | 21/10/2026 | En estudio: quedaba una duda abierta |
| v1.0 | 22/10/2026 | **Aprobado por Kris** («sí, está bien, actualiza todo»), tras validarlo con Alfredo · implementado: plan 3.50, `lector.py` y `MotorChaumer.cs` (D-045) |

## 1 · La pregunta

21/10/2026. El soporte de la vela 08:34 (29.847,00 – 29.825,75) lo rompe la vela 08:38 y la 08:40 hace la consecución.
Esa misma vela se da la vuelta y arma estructura nueva. El motor **estiraba** el soporte hasta el mínimo de las 08:40 y le
dejaba contado el traspaso. Kris no lo leía así, y la duda quedó abierta un día (v0.1): en unos casos la zona vieja moría
sola y en otros esperaba «al bloque».

**Lo que lo resolvió** (Kris, tras validarlo con Alfredo, 22/10): *«una zona es llamada zona apéndice cuando es una zona
creada por un movimiento que se generó con rompimiento pero SIN consecución, y esa es la que forma el bloque. Una zona que
se genera cuando hay rompimiento y consecución ya no es zona apéndice, sino una zona normal generada por la acción de
precio»*. La contradicción venía de llamar apéndice a las dos cosas.

## 2 · La regla

1. **La apéndice** solo nace de un rompimiento **sin** consecución (con cuerpo fuera, al vencer el plazo o con estructura
   contraria: lo de siempre, `R-11`). **Forma un bloque con su zona**, y con las apéndices de sus apéndices:
   - se dibujan por separado;
   - **para entrar hay que romper el borde exterior del bloque** (la apéndice); romper solo la zona original no da entrada;
   - **se superan y mueren juntas**, por los bordes exteriores: rompimiento y consecución por la apéndice, y después por
     el otro lado de la zona original (`R-21`);
   - **al nacer la apéndice, el rompimiento que la creó se cierra**, como al estirarse (`R-10`): para romper el bloque
     hace falta uno nuevo, con su consecución.
2. **Tras rompimiento y consecución**, la zona que deja la estructura nueva es **normal e independiente**: si toca la zona
   ya traspasada, **no la estira** (`R-13`); nace aparte, **recortada en su borde**, porque dos zonas nunca se montan. Cada
   una lleva su propia cuenta de traspasos.
3. **Sin consecución y solo con mecha**, la zona se estira, como hasta ahora (`R-10`).
4. **Vigente desde el 22/10/2026** (`BLOQUE_DESDE`), sin rectificar los días anteriores.

El 21/10 leído con la regla: la zona de la 8:34 muere sola a las 8:48 (abajo 8:38–8:40, arriba 8:46–8:48); la de la 8:40
nace aparte (29.813,50 – 29.825,75); la vela 8:44 la rompe con cuerpo sin consecución y a las 8:49 nace su apéndice
(29.771,25 – 29.779,25), en bloque con ella.

**La duda 3** (una zona traspasada que recibe otra del mismo tipo por el otro lado) no existe: las reglas de la banda
(`R-12`, `R-17`) no dejan marcar esa zona. Medido: ni una vez en 76 días; las 48 veces que el motor estiraba una zona ya
traspasada eran todas del tipo de la 8:40.

## 3 · Lo medido antes de cambiar nada

En una copia aparte del motor, sobre los 76 días con datos y aplicando la regla a todos (solo para medir):

| | |
|---|---|
| Días en que cambian las zonas | 39 de 76 |
| Días en que cambia la operación | 1: el 31/07, Continuación bajista 9:02 TARGET +72,00 → 9:08 TARGET +61,25 |
| Zonas que se estiraban y nacen aparte | 47 |
| Apéndices que forman bloque | 36 |

Un fallo de la primera pasada, corregido antes de enseñarlo: la búsqueda de entradas recorre el día entero después de la
vigencia, y el bloque contaba apéndices **aún no nacidas** (le quitaba al 21/07 la entrada de las 8:34 por una apéndice de
las 8:40). Ahora solo cuentan las zonas nacidas en esa vela (`borde(z, i)`, `con_hijas`).

Kris revisó el 21/10 y el 31/07 con el motor de antes y el nuevo, uno encima del otro: *«sí, está bien»*.

## 4 · Cómo está hecho

- **Plan 3.50** (`3520f28`): `R-11`, `R-13`, `R-21`, glosario, dos líneas nuevas en la checklist y el parámetro `BLOQUE_DESDE`.
- **`lector.py` y `MotorChaumer.cs`**, la misma traducción línea a línea:
  - la `Zona` sabe de su bloque (`madre`, `hijas`);
  - la vigencia la lleva la zona raíz con los bordes del bloque (`_bloque_entrar` / `_bloque_salir`): si el bloque se
    estira, se estira la zona del borde que se movió, y al final de cada vela las hijas copian el estado del bloque;
  - `anadir` recorta en lugar de estirar cuando la zona que toca ya tiene un traspaso (`que = 'aparte'`, que cuenta como
    zona nueva de corrida o de retroceso);
  - las tres comprobaciones de rompimiento de `detectar_setups` usan los bordes del bloque.
- **Verificado:** los 75 días anteriores al 22/10, idénticos al motor anterior; con la fecha a 0, los 76 días con la misma
  operación que la simulación; `sincronia.py --sellar --cambio-de-regla` a 76/76 días idénticos entre los dos motores. El
  22/10 cambian zonas después de las 9:32, no la operación (Continuación alcista 9:04, STOP −53,25, como el bot).
