# En marcha

> Solo lo que está en curso. Lo terminado va a `docs/historial-proyecto.md`; las ideas y lo que
> está por comprobar, a `backlog.md`.

## Backtesting de Chaumer

Las reglas están cerradas. **Cada duda se resuelve cuando aparezca en un día concreto**, con ese día
delante: nada de listas previas (decisión de Kris, 28/09). Si cambia el motor, su regresión
(`python scripts/cadena/prueba_motor.py`); si cambia el plan, el sí de Kris y su commit `plan:`.

**Objetivo (Kris, 28/09):** poder hacer el backtesting completo **de cualquier fecha**, no de un tramo fijo.
El motor corre sobre cualquier día del que haya velas de 1 minuto; lo que limita es qué velas hay.

- **Velas:** NinjaTrader las tiene guardadas desde el 12/06/2025 (MNQ 09-25, 12-25, 03-26, 06-26, 09-26, 12-26):
  se exportan por **contrato** (el de ese vencimiento, no el siguiente). El backtesting a mano de 2025 (116 gráficos,
  01/08/2025 → 16/01/2026) queda cubierto. Septiembre, en `datos/dia/Septiembre.txt` (MNQ 09-26, 31/08 → 18/09).
- **Hecho:** 1/09 (Continuación alcista 9:44, +15,75; el motor dice NO OPERA). Sale la corrida fluida 3.36.
- **Hecho (30/09):** el motor aplica la corrida fluida 3.36–3.38 (`b7bdcf7`). Septiembre sale idéntico; cuatro días
  de julio, revalidados con Kris uno a uno: 7 (−56,50), 9 (−29,75), 16 (−66,75) y 20 (+54,50). Julio, −241,00 en 10
- [ ] **Textos del plan que cuentan esos días con el resultado de antes** (con el sí de Kris, frase a frase): en la
  galería, el caso del 9/07 (el largo de 8:46, −59,75) y el del 16/07 (dice que la operación ya no existe); en la
  regla de la vela de apertura y en la de la caducidad de la orden, el ejemplo del 9/07 (orden de 8:43 que se llena
  a las 8:46); en la corrida fluida, el caso del 16/07 no dice cómo acaba el día
- [ ] **Doce días sin validar de julio y agosto cambian con el motor nuevo** (1, 23, 28 y 31/07; 3, 5, 6, 7, 11, 13,
  14 y 18/08): se ven cuando les toque en el backtesting
- [ ] **Siguiente día:** 2/09 (velas en `datos/dia/Septiembre.txt`, hasta el 9/09)

Dudas que ya salieron, para reconocerlas si vuelven: `docs/historial-proyecto.md`, checkpoint del 28/09.

**Las Sesiones (D-029, 28/09):** `chaumer/05_Backtesting/` es `kris/` (el backtesting a mano) y `claude/`
(un gráfico por día + su `.json`; el protocolo del chat «Backtesting» en `claude/protocolo/LEEME.md`).
La publicación automática funciona desde el 29/09: el AddOn exportó a las 10:32 en `claude\motor\datos\dia\` y
el puente subió el día solo (`6461e1a`).

## El mapa del método — implementado, queda una decisión

`/mapa`: el método como mapa navegable (núcleo, las 7 piezas en corona y las reglas de cada una
con sus relaciones), enlazado desde la portada. Las 5 fases dentro y verificadas el 29/09: 20/20
comprobaciones en modo normal y con movimiento reducido, `npm run verificar` limpio (57 páginas),
y sin JavaScript queda la lista de las 34 reglas. Diseño: `docs/disenos/2026-09-29-mapa-del-metodo.md`.

- [ ] **Decidir el color dentro de una pieza** — **Kris**. Hoy las 13 reglas de Zonas comparten el
  tono del grupo y se ve monótono. La recomendación es variar la intensidad por **número de
  relaciones**: es el único eje con datos en las siete piezas (el apartado solo existe en Zonas y
  `aplica_a` casi no varía). El §11 del diseño lo compara.
- [ ] **El móvil**, sin mirar de verdad: solo la reordenación básica del menú. Un mapa de este
  tamaño en un teléfono merece su propia decisión.

## Portal de Alfredo

Rescatados de `chaumer/04_Web/ESTADO_FASE_2.md` al archivarlo (28/09, D-030). Estaban ahí desde el 24/09.

- [ ] **Crear la clave del operador** para ver y borrar las observaciones desde fuera del portal:
  `npx wrangler pages secret put CLAVE_OPERADOR --project-name=plan-operativo-nq` — **Kris** (`chaumer/04_Web/DESPLIEGUE.md`)
- [ ] **Alfredo no puede dejar observaciones en los ocho módulos** (premercado, zonas, setups, jornada, entrada,
  filtros, dentro y riesgo): solo en casos reales y vocabulario, y `/observaciones` es de solo lectura. Es la razón
  de ser del portal
- [ ] Simplificar la prosa de los casos reales, que todavía suena a auditoría
- [ ] Pasarle la dirección a Alfredo — **Kris**, cuando termine su revisión del portal

## Con fecha (las hace Claude)

- **28/10** (Fed): la ficha sale con `dia_fed` y el motor ve reingresos
- **2/11** (invierno): vela base 9:31; el AddOn exporta a las 11:32
- **≈10/12** (cambio de contrato): el AddOn pasa solo a `MNQ 03-27`
