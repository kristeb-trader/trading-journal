# Backlog

> Ideas sin fecha ni compromiso. Cuando una se activa, pasa a `current.md`.

## Por comprobar

Cosas hechas que no se pudieron probar del todo. Ninguna bloquea.

- **Kris, en NinjaTrader:** que `ChecklistChaumer` enseña la casilla nueva de la etapa 2 (sin recompilar)
- **Datos, con la sesión iniciada:** agregar, renombrar, borrar, activar/desactivar y arrastrar para
  reordenar; que el orden se guarde `1, 2, 3…` (`docs/disenos/2026-08-19-otros-y-datos.md` § 6.1)
- **Ajustes:** el cambio de contraseña real y Cerrar sesión (probados sin ejecutarlos)
- **A ojo, la UI del 16 ago:** los controles en la barra superior en móvil, y el alto de la imagen en la
  vista del día (`46vh` escritorio, `34vh` móvil)

## Cuatro calendarios

- **Julio y agosto en el calendario de Claude.** Hoy empieza el 10-sep: los 11 días de julio
  (6–20) solo están como archivos en `chaumer/05_Backtesting/claude/`, y del 21-jul al 25-ago el
  motor no ha corrido aunque hay velas. Sería pasar el motor por esos días y subir sus fichas con
  `subir_dia.py`. Diseño: `docs/disenos/2026-09-29-cuatro-calendarios.md` §9.
- **Por comprobar con la sesión iniciada:** los cuatro cuadros con los datos en vivo (verificado con
  los de septiembre inyectados en la copia local, y cada cifra contra un `SELECT`).

## Comparador Chaumer vs yo

Terminado; vive de cargar días en **Otros › Chaumer › Registrar** (también los que él no operó). Queda
decidir con datos si un día con mismo setup y resultado pero la mitad de puntos cuenta «Igual» o
«Ejecución» (`veredicto()` en `js/chaumer.js`). Diseño: `docs/disenos/2026-08-19-chaumer-vs-yo.md` (v8).

## Seguridad y repositorio

El repositorio es **público** (D-022). Cuando haya presupuesto: GitHub Pro y pasarlo a privado. Aparte:
proteger el portal (Cloudflare Access) y ver qué devuelve `/api/backtesting/export`, que responde 200
sin sesión.

## Apex Tracker

- **El filtro de cuentas no distingue una cuenta renovada.** Calendario, Trades y Análisis
  filtran por nombre de cuenta de NT8, así que "APEX-15" mezcla la etapa quemada (12-ago →
  8-sep) con la renovada (desde 11-sep). El Tracker sí las separa (por periodo, 14 sep).
- **El Tracker formatea importes en `en-US`** (`$49,896`) con su propio `fmt$`, no con
  `fmtDinero` como pide el invariante de importes (`49.896`).

## Tema claro

Pedido y **aplazado a sabiendas** (D-010). La fila ya existe en Otros › Ajustes, inerte y
marcada "Pendiente". Los números están medidos, para no tener que volver a medirlos:

| Fuera del `:root` | Cuántos |
|---|---|
| `rgba(255,255,255,…)` — invisibles sobre fondo claro | **82** |
| Colores hex a mano | **44** |
| Estilos incrustados en `index.html` | **66** |
| Colores de gráficas (`charts.js` 5, `disciplina.js` 4) | **9** |

Orden para retomarlo: consolidar en tokens → migrar **pantalla completa por pantalla
completa** → encender el interruptor al final. Va junto con la deuda del doble lenguaje
visual; son el mismo trabajo. El lenguaje nuevo (16 ago) solo está en **Diario**: faltan Coach, Días
anteriores y el resto. Se migra **por pantalla completa**, y los literales de color casi iguales se
unifican al migrar cada pantalla, no en bloque (cambian píxeles).

## Journal

- **Trigger para cuando la cuenta principal sea una de Apex.** Desde el 18 sep `apex.js` no lee `trades`
  (D-019): antes de ese cambio, un trigger `after insert` en `trades` que replique a `apex_trades` si
  `account` está en `apex_cuentas`. Mientras la principal sea `Sim101`, no hace falta. Fase 4 de
  `docs/disenos/2026-09-18-cuenta-unica-en-trades.md`
- **Modal del día:** distinguir el ítem que un error tumbó del que nunca se marcó (`_checklistDia` ya expone
  `roto`; falta el render)
- **Coach:** pasarle el catálogo de recomendaciones para que no invente nombres nuevos (última pieza de la 4B)
- **Rendimiento:** el modal del día carga lento. Medir antes de tocar

## Métricas que faltan

- **Estadísticas de la 3ª corrida.** Hoy no se distingue el rendimiento por número de
  corrida, y la metodología sí lo hace (apertura = 1ª–2ª, continuación = 3ª+).
- **Volumen en `trades`.** No se captura. Serviría para la señal opcional del Reingreso
  (rompimiento con mucho volumen que no continúa).
- **Tasa de ejecución de setups válidos.** Cuántos setups válidos se vieron vs cuántos se
  tomaron. Hoy solo se registra `setup_valido_no_tomado` como booleano.

## "Dejé de ganar" — ampliar la captura

Hoy captura pocos casos. Faltan al menos: entrada no tomada por **miedo**, **reingreso no
tomado**, salida anticipada antes del target. Es el reverso de los errores: mide lo que
costó no actuar, no lo que costó actuar mal.

## Tipificación de errores

23 de 50 errores tienen `regla_codigo` (11 ago). Los 27 sin vínculo son en su mayoría
psicológicos y condiciones de mercado, que **no deben tenerlo**. El resto se va tipificando
solo según el Coach analiza días nuevos — no requiere trabajo manual, solo tiempo.

## Estructura del código

Analizado en la reestructuración de agosto y **explícitamente aplazado**. A 29/09/2026: 19 archivos JS
(~13.900 líneas) sin módulos ni bundler, `index.html` con el markup de todas las secciones,
`styles.css` de 5.507 líneas (en agosto eran 18, ~10.400 y 4.217). Acoplamiento por ids del DOM.

Es el coste conocido de la decisión D-001, no un descuido. Si algún día se aborda, va con
su propio diseño y su propia aprobación. Ver `docs/decisiones.md` D-001.
