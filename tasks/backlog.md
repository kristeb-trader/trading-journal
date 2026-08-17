# Backlog

> Ideas sin fecha ni compromiso. Cuando una se activa, pasa a `current.md`.

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
visual de abajo; son el mismo trabajo.

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

Analizado en la reestructuración de agosto y **explícitamente aplazado**: 18 archivos JS
(~10.400 líneas) sin módulos ni bundler, `index.html` con el markup de todas las secciones,
`styles.css` de 4.217 líneas. Acoplamiento por ids del DOM.

Es el coste conocido de la decisión D-001, no un descuido. Si algún día se aborda, va con
su propio diseño y su propia aprobación. Ver `docs/decisiones.md` D-001.
