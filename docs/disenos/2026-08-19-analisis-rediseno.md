# Análisis — rediseño de la pantalla

**Versión:** 1.0 · **Estado:** aprobado e implementado (19 ago 2026)
**Pedido por:** Kris — "algo más moderno, elegante y profesional; primero el Resumen de los
trades, segundo la Curva de Equity a ancho completo y más moderna, y tercero las tres
tarjetas. Que las gráficas no queden simples."

## Decisiones tomadas con Kris antes de implementar

| Duda | Resuelto |
|---|---|
| Qué era "el Resumen de los trades" | La **tabla** "Resumen por semana/mes", no la fila de KPIs |
| Cuántos KPIs y con qué peso | Los **7 al mismo peso**; la jerarquía va dentro de cada tarjeta |

## Orden final

```
1 · KPIs (7 tarjetas)
2 · Resumen por semana / mes        ← la tabla
3 · Curva de Equity — ancho completo
4 · [P&L por mes] [P&L medio por franja] [Distribución de resultados]
5 · Exportar PDF / Imagen
```

## Lo que mandó el diseño: los datos reales

Antes de dibujar nada se consultó la BD. Dos hechos cambiaron el resultado:

- **Las muestras son cortas.** Un mes típico son 2–18 trades; agosto en la `-15` son **2**.
  Una curva de equity con 2 puntos no describe una tendencia y un donut con n=2 son dos
  mitades. El diseño tiene que ser honesto con eso, no solo verse bien con datos ideales.
- **El gráfico de franja horaria estaba casi vacío.** Solo hay 5 franjas con operaciones
  (08:30–10:30 hora Colombia) y el eje iba fijo prometiendo 9:30–15:00 ET: dos tercios del
  gráfico eran aire, lo que parece "faltan datos" cuando lo que pasa es que ahí no se opera.

De ahí salen dos reglas que atraviesan toda la pantalla:

1. **La `n` siempre visible** en la cabecera de cada tarjeta. Un promedio sobre 2 trades y
   otro sobre 200 se dibujan igual de sólidos y no significan lo mismo.
2. **El dato raro se explica, no se esconde** (`.an-note`). Menos de 3 días con operaciones
   → aviso en la equity. Franjas con menos de 3 trades → se nombran una a una.

## Lenguaje visual

Pantalla migrada **entera** al lenguaje nuevo (el de Diario, Otros y Datos): tarjeta de
radio 14px con barra de acento de 2px arriba y el patrón `--c` por tarjeta. `CLAUDE.md`
exige migrar por pantalla completa — media pantalla migrada se ve peor que ninguna. Solo
tokens, cero hex nuevo.

## Los bloques

**KPIs** (`.an-kpis` / `.an-kpi`) — 7 tarjetas iguales; la jerarquía es interna: etiqueta en
versalitas, valor grande con `tabular-nums`, y debajo la **variación contra el período
anterior**, que antes no existía. Sin período anterior con datos no se inventa un 0%: dice
"sin mes ant.". La barra superior de 2px codifica el signo. Rejilla 7 → 4 → 2 columnas.

**Tabla** — se queda como `<table>` de verdad. La regla del skill ("grid, nunca flex") apunta
a las tablas falsas de divs; una tabla real ya alinea por construcción. Se le añade barra
inline en la columna P&L (escala común = mayor |P&L| del período, para que dos filas sean
comparables), pills de estado con icono + texto, y la fila de totales cerrando con borde
grueso.

**Curva de Equity a ancho completo** — degradado vertical que se tiñe de verde sobre cero y
de rojo bajo cero, curva `tension 0.35` de 2,5px, línea de cero punteada (plugin
`lineaCero`), solo el último punto visible con halo, y **tooltip HTML propio** (`.an-tip`)
con fecha, P&L del día y acumulado — el de Chart.js no admite esa jerarquía. Eje Y en
formato compacto (`$2,1k`) vía `fmtCorto`. En la cabecera, la caída máxima desde un pico.

**Las tres tarjetas** — barras con esquinas redondeadas y color por signo, etiqueta de valor
encima y línea de cero. La de franja horaria **recorta el eje a las franjas con datos**. El
donut lleva hueco grande, el % de acierto al centro, el porcentaje **dentro** de cada
segmento ≥8% (plugin `pctDentro`) y una leyenda propia con solo nombre y color: cada dato
vive en un sitio, no en dos.

## Verificación

Contra la BD real (SQL por MCP) y en el preview:

- Agosto / `APEX-232411-15`: P&L −$356, 50% de acierto, caída máx. $434 → coincide con el
  `SELECT` (2 trades: +77,96 y −434,14).
- Con 74 trades inyectados: 7 puntos de equity sin aviso, 8 franjas, nota informativa en vez
  de advertencia, 12 filas de tabla y totales coherentes (55,4% de acierto con PF 1,53 y
  P&L positivo).
- Responsive: 1280px → 3 tarjetas en fila y 7 KPIs en una fila · 1100px → 2+1 y 4+3 ·
  375px → apiladas, sin scroll horizontal de página (la tabla scrollea dentro de su
  contenedor) y sin valores de KPI recortados.
- Consola limpia.

## Corregido por el camino

- **La unidad del aviso mentía en vista Anual**: cada punto es un mes, no un día, y el texto
  decía "Solo 1 día con operaciones". Ahora la unidad depende del período.
- **El degradado reventaba si el lienzo aún no tenía alto** (render con la sección oculta):
  la escala devuelve NaN y `addColorStop` lanza. Se cae a relleno plano.

## Textos de ayuda actualizados

`equity` describía una "banda roja de drawdown" que no existe, y `pnlByHour` decía
"9:30–15:00 ET" cuando el eje va en hora local y ahora se recorta. Ambos reescritos.

## No se tocó

Los cálculos. Es un rediseño de presentación: `statsOf`, `calcDiscipline` y el resto siguen
igual, y los números se contrastaron contra la BD antes de cerrar.

---

# v1.1 — ajustes tras la primera revisión (19 ago 2026)

Kris revisó la v1.0 y pidió los cambios de abajo. Varios coinciden con entradas del
catálogo de anti-patrones del skill `dataviz`, que se consultó a petición suya
("busca un skill de UI/UX para mejorar esa gráfica").

## KPIs

- **Fuera la línea de contexto** bajo cada número (`↓ $1,1k vs mes ant.`, `sobre capital
  inicial`, `1 de 4 en positivo`…). Siete pies de texto convertían la fila en un párrafo.
  El "por qué" de cada métrica sigue en el `?` de su etiqueta.
- **Fuera Profit Factor** → quedan 6 KPIs (rejilla 6 → 3 → 2).

## Tabla

- **Fuera la columna Trades**: ya está en el KPI "Total Trades".
- **Nombres completos** en las cabeceras (`Rentabilidad`, no `Rentab.`), en negrita y
  mayores: se tienen que leer como títulos.
- **Todo más grande.** El P&L Neto sube a 19px en las filas y 21px en el total, un escalón
  por encima del resto porque es la columna que se mira primero.
- **Colores por resultado** en P&L Neto, Efectividad, Disciplina y Estado — también en la
  fila de totales, que antes iba en gris.
- **Barra de totales**: fondo propio, esquinas redondeadas y borde superior grueso. Es lo
  primero que busca quien audita sus números; en gris se confundía con una fila más.

> ⚠️ **La raíz del documento son 14px, no 16.** Cada `rem` sale un 12% más pequeño de lo
> que aparenta al escribirlo, y esa era la causa real de que la tabla se leyera diminuta
> pese a haberla "subido" en la v1.0. Los tamaños críticos de esta pantalla van en **px**.

## Gráfica de barras — "parecía hecha por un niño"

El catálogo lo nombra igual: *"bloques gruesos saturados, rejilla pesada, sin aire — se lee
ruidoso, incluso infantil"*. Corregido con las specs del skill:

- Barras de **22px máximo** (antes 46), sin borde — el borde añade tinta que no es dato — y
  extremo redondeado de 4px escuadrado contra la base.
- **Etiquetas selectivas**: solo el mejor y el peor sub-período, no un número sobre cada
  barra. Con 12 meses eso era un muro de cifras que se pisaban entre sí.
- El texto de las etiquetas va en **tinta**, nunca en el color de la serie.
- **Línea de cero sólida**, no punteada (el punteado es ruido y se lee como "provisional").

## Distribución de resultados — deja de ser una dona

Dos anti-patrones a la vez: *"un pastel de 2 porciones → usa una tarjeta de dato: el número
ES el gráfico"* y *"una dona para comparar valores cercanos → una barra, o los números"*.
Además obligaba a escribir el % **dentro** del color, ilegible, cuando la regla es que el
texto nunca viste el color de la serie.

Forma nueva: **cifra protagonista** (% de acierto, 2.6rem) + **medidor part-to-whole**
(tramos separados por un hueco de 2px del color de la superficie, no por un borde) + el
**recuento explícito de ganadores y perdedores** con su porcentaje, que es lo que faltaba.
El acierto se calcula sobre los decisivos (sin break-even) y el medidor reparte sobre el
total, así que las filas suman 100%.

## Curva de Equity

- Eje Y con **importes completos y separador de miles** (`$1.500`), no `1,5k`: el eje carga
  los valores que no llevan etiqueta directa, así que tiene que leerse sin traducir.
- **Fuera la leyenda** "7 meses · máx. caída $4,3k" de la cabecera.

## Eliminado

- La gráfica **P&L medio por franja horaria**, con su renderizador, su texto de ayuda y sus
  avisos. La fila baja de tres tarjetas a dos (`.an-charts-2`).
- Código muerto que arrastraba: `prevPeriodRange`, `NOMBRE_PREV`, `fmtCorto` y el plugin
  `pctDentro` de la dona.

## Verificación

13/13 comprobaciones sobre los puntos pedidos, con 66 trades sintéticos repartidos en 7
meses para juzgar las gráficas con volumen. Eje de equity: `−$1.000 · $0 · $1.000 · $2.000`.
Distribución: 55% de acierto, 36 ganadores / 30 perdedores. Móvil 375px sin scroll
horizontal ni valores recortados. Consola limpia.
