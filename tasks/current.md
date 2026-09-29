# En marcha

> Solo lo que está en curso. Lo terminado va a `docs/historial-proyecto.md`; las ideas y lo que
> está por comprobar, a `backlog.md`.

## Backtesting de Chaumer (desde el 29 sep)

Las reglas están cerradas. **Cada duda se resuelve cuando aparezca en un día concreto**, con ese día
delante: nada de listas previas (decisión de Kris, 28/09). Si cambia el motor, su regresión
(`python scripts/cadena/prueba_motor.py`); si cambia el plan, el sí de Kris y su commit `plan:`.

- [ ] **Arrancar:** decidir con Kris qué backtesting (el manual de 2025, 116 gráficos, o el del motor) y con
  qué datos. El motor solo tiene velas del 01/07 al 25/08/2026 y los días desde el 10/09: para un año hacen
  falta las de 1 minuto de MNQ de ese año, exportadas de NinjaTrader

Dudas que ya salieron, para reconocerlas si vuelven: `docs/historial-proyecto.md`, checkpoint del 28/09.

## Con fecha (las hace Claude)

- Primer Coach de un día con ficha del motor: que la caché se siga leyendo (`coach_uso.cache_leida` > 0)
- **28/10** (Fed): la ficha sale con `dia_fed` y el motor ve reingresos
- **2/11** (invierno): vela base 9:31; el AddOn exporta a las 11:32
- **≈10/12** (cambio de contrato): el AddOn pasa solo a `MNQ 03-27`
