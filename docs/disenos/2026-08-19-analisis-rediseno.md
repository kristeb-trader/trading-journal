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
