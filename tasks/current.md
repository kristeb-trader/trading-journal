# En marcha

> Solo lo que está en curso. Lo terminado va a `docs/historial-proyecto.md`; las ideas y lo que
> está por comprobar, a `backlog.md`.

## Backtesting de Chaumer

Las reglas están cerradas. **Cada duda se resuelve cuando aparezca en un día concreto**, con ese día
delante: nada de listas previas (decisión de Kris, 28/09). Si cambia el motor, su regresión
(`python scripts/cadena/prueba_motor.py`); si cambia el plan, el sí de Kris y su commit `plan:`.

**Objetivo (Kris, 28/09):** poder hacer el backtesting completo **de cualquier fecha**, no de un tramo fijo.
El motor corre sobre cualquier día del que haya velas de 1 minuto; lo que limita es qué velas hay.

- [ ] **Arrancar:** ver con Kris cómo conseguir las velas de 1 minuto de MNQ del periodo que quiera, exportadas
  de NinjaTrader (hoy solo hay del 01/07 al 25/08/2026 y los días desde el 10/09), y cómo encaja el backtesting
  manual de 2025 (116 gráficos)

Dudas que ya salieron, para reconocerlas si vuelven: `docs/historial-proyecto.md`, checkpoint del 28/09.

**Las Sesiones (D-029, 28/09):** `chaumer/05_Backtesting/` es `kris/` (el backtesting a mano) y `claude/`
(un gráfico por día + su `.json`; el protocolo del chat «Backtesting» en `claude/protocolo/LEEME.md`).
- [ ] **Mañana (29/09), en `%LOCALAPPDATA%\TradingJournal\cadena\registro.txt`:** la primera publicación
  automática de verdad — `publicar: 29/09 subido al portal`. Si pone «el push falló», es que git no tiene
  credenciales cuando lo lanza NinjaTrader (sin consola): mirarlo entonces
- [ ] Mañana, en `Documentos\NinjaTrader 8\cadena-diaria\registro.txt`: que el AddOn escribió las velas en
  `claude\motor\datos\dia\` y no volvió a crear la carpeta vieja

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

- Primer Coach de un día con ficha del motor: que la caché se siga leyendo (`coach_uso.cache_leida` > 0)
- **28/10** (Fed): la ficha sale con `dia_fed` y el motor ve reingresos
- **2/11** (invierno): vela base 9:31; el AddOn exporta a las 11:32
- **≈10/12** (cambio de contrato): el AddOn pasa solo a `MNQ 03-27`
