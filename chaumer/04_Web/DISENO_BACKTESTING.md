# Bitácora de backtesting operativo — diseño cerrado

**Cerrado con el operador el 09/09/2026.** Este archivo es la referencia:
si el código y este documento se contradicen, manda este documento.

---

## Qué es

Una bitácora del backtesting **visual** que Christian hace a mano sobre el
mercado pasado, aplicando el plan él mismo. El portal **guarda lo que él ya
decidió**. No lee datos de mercado, no marca zonas, no aplica reglas, no
detecta setups. Si aparece lógica de la metodología aquí, es un error.

## Dónde vive cada cosa

| | |
|---|---|
| Los datos | **D1**, la misma base que las observaciones. Tablas con prefijo `bt_` |
| Las imágenes | **R2**, bucket privado. La página las pide a la API, nunca directo |
| La página | `src/pages/backtesting.astro` — cascarón estático, datos por `fetch` |
| La API | `functions/api/backtesting/` |

**Por qué no archivos en el repositorio:** para poder registrar desde el
navegador sin recompilar ni publicar. El precio es que el registro deja de
estar versionado en git; se compensa con el botón de exportar.

**Por qué R2 y no D1 para las imágenes:** una captura no es una fila.

## Migrar a Supabase algún día

Se decidió empezar en D1 dejando la puerta abierta. Lo que la mantiene abierta:

1. **La página nunca habla con la base.** Solo conoce `/api/backtesting/…`.
   Migrar es reescribir esos archivos; la página ni se entera.
2. **SQL corriente, sin atajos de SQLite.** Nada de `datetime('now')` en el
   esquema ni en las consultas: las marcas de tiempo se generan en el código.
3. El esquema versionado vive en `d1/`, y es lo que se traduce a Postgres.
4. Las claves de las imágenes en R2 son los nombres de archivo. Al copiar el
   bucket a otro almacén, las filas siguen apuntando bien sin tocar ninguna.

## Las tres tablas

**`bt_cabecera`** — una sola fila (`id = 1`). Los datos de inicio.

| campo | |
|---|---|
| `valor_inicial` | capital con el que arranca el backtesting |
| `contratos` | propuesta para la siguiente jornada |
| `instrumento` | propuesta para la siguiente jornada |
| `comision` | lo que cobra el bróker **por contrato y operación** |

**`bt_jornadas`** — un día. `fecha` es única.

| campo | |
|---|---|
| `instrumento`, `contratos`, `valor_punto`, `comision` | **congelados** al guardar |
| `imagen` | clave en R2, o vacío |
| `notas` | el día en general |

**`bt_operaciones`** — cuelga de su jornada.

| campo | |
|---|---|
| `hora` | hora Colombia |
| `direccion` | `largo` · `corto` |
| `setup` | `continuacion` · `reingreso` |
| `puntos` | **siempre en positivo**; el signo lo pone el resultado |
| `resultado` | `target` · `stop` |
| `comision` | lo cobrado: tarifa × contratos |
| `pnl` | **neto**, calculado al guardar y no al mostrar |
| `observaciones` | |

### Las tres decisiones que no son cosmética

1. **El P&L se guarda, y se calcula al escribir.** El operador lo pidió en la
   tabla. Calcularlo al mostrar haría que cambiar los contratos reescribiera
   el pasado; calcularlo al guardar lo deja escrito y correcto, y se recalcula
   solo cuando se corrige esa jornada.
2. **Contratos, instrumento y valor del punto se congelan en cada jornada.**
   La cabecera es la propuesta para lo próximo, no la verdad del pasado.
3. **Nada bloquea.** No hay tope de puntos, ni aviso, ni fila en rojo por
   apartarse del plan. Es un registro, no un juez. Solo se rechaza lo que
   corrompería el registro: una dirección que no existe, unos puntos
   negativos, una jornada sin fecha.

**Un día sin operación es una jornada sin operaciones**, con su nota. Si solo
se anotan los días con entrada, la bitácora miente sobre la frecuencia.

## Aritmética

```
bruto = puntos × valor_punto × contratos     (negativo si el resultado es stop)
pnl   = bruto − comision × contratos
```

El P&L guardado es **neto**: lo que de verdad entra o sale de la cuenta. La
comisión se resta se gane o se pierda, así que **empeora las pérdidas**. Un
día sin operación no paga comisión, porque no hubo operación.

**La comisión se multiplica por los contratos** — 1,02 con dos contratos son
2,04 — que es como cobra un bróker. Confirmado con el operador el 09/09/2026,
que lo enunció como «por trade» con un solo contrato en juego.

`valor_punto` sale de `reglas.json` (`valor_punto_MNQ`, en `R-01`) al compilar
la página, y se congela en cada jornada al guardarla. **No se escribe a mano
en ningún sitio.**

## Vocabulario en pantalla

| El plan dice | La pantalla dice |
|---|---|
| IRI | **Continuación** |
| Objetivo | **Target** |

Decisión del operador, 09/09/2026. **El plan no se ha cambiado**: la propuesta
queda escrita en `PROPUESTAS_AL_PLAN.md` y la decide él.

## Quién puede qué

| | |
|---|---|
| Leer la bitácora | cualquiera con el enlace, sin clave |
| Ver las imágenes | cualquiera con el enlace, sin clave |
| Registrar, corregir, borrar | pide `CLAVE_OPERADOR`, la que ya existe |

## La pantalla

- **Seis cifras en dos filas de tres.** Arriba el dinero: valor inicial (con
  el lápiz de **Datos de inicio**), saldo actual y **rentabilidad** —en su
  propia tarjeta, en grande y en color, 15/09/2026—. Abajo el método:
  **efectividad** con los target en verde y los stop en rojo debajo, puntos
  netos con lo pagado en comisiones, y caída máxima.
- **Curva de capital** en el estándar visual del método: fondo oscuro, sin
  cuadrícula, solo el eje horizontal y el vertical. El vertical lleva
  **unas cinco marcas en cifras redondas** (1, 2, 2,5 o 5 por potencia de
  diez), a la misma distancia y recalculadas con los datos, para que no se
  amontonen.
- Filtros por setup, por resultado y **«Con observación»** (solo las
  operaciones con algo escrito).
- **La tabla, por meses.** Cada mes abre con **una sola fila** que lleva sus
  totales, cada uno bajo su columna: nombre del mes, operaciones y
  target/stop en color; puntos netos; P&L; y la **efectividad**, bajo
  Resultado, en grande y en cian —ni verde ni rojo: destaca, no juzga—
  (16/09/2026). La fila se distingue de los días por el fondo teñido de
  acento, un filete arriba, más altura y cifras en negrita.
  **Los totales son de lo que se ve**: con un filtro puesto, suman lo filtrado.
- Columnas: fecha · hora · dirección · setup · puntos · P&L · resultado ·
  observaciones · gráfico. **Sin saldo** —el operador no lo usa, 15/09/2026—
  ni instrumento, que se repite idéntico y vive bajo el título.
- **Sin texto explicativo.** El operador lo pidió tres veces: la pantalla
  enseña datos, no se explica a sí misma.

## Lo que falta para publicar

El bucket de R2 y el binding. Está en `DESPLIEGUE.md`.
