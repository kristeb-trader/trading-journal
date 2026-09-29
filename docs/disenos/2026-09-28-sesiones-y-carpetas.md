# Sesiones: una sola pestaña, dos carpetas

| | |
|---|---|
| **Versión** | v1 |
| **Estado** | 🟢 Aprobado (28/09/2026) — en implementación |
| **Fecha** | 28/09/2026 |
| **Decidido con Kris** | el motor va dentro de `claude/` · el término «test ciego» sale también del plan |

## Registro de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| v1 | 28/09/2026 | Primera propuesta. Aprobada entera, con los 9 cambios del plan |

---

## 1. Qué se pide

1. **«Test ciego» deja de existir como término.** Pasa a llamarse **Sesiones**.
2. **Las Sesiones de julio y las de septiembre (hoy «test ciego") son lo mismo** y van juntas en el portal.
3. **La tarjeta** de cada sesión: la **fecha arriba**; debajo del gráfico, el resultado (`STOP` / `TARGET`) con su
   color de hoy pero **con los puntos en vez de la hora**; el setup en **un solo color** y **sin los puntos**
   al final.
4. **`05_Backtesting/` con dos carpetas y nada más:** `kris/` (tu backtesting) y `claude/` (las Sesiones: julio,
   septiembre, las diarias del motor y las del chat «Backtesting»).

## 2. Cómo está hoy (verificado)

### El portal — `chaumer/04_Web/src/pages/galeria.astro`

| Pestaña | Casos | De dónde sale | Tarjeta |
|---|---|---|---|
| Test ciego | 10 (10 → 23 sep) | gráficos de `05_Backtesting/test_ciego/Back_claude/` (`sync.mjs:26`) · veredicto de la tabla «Test ciego — día por día» de `GALERIA.md` (`parsers.mjs:208`) | gráfico · `STOP 8:36` · fecha · «Continuación bajista 8:36 · −28,25 pts» |
| Sesiones de julio | 11 (G-11 → G-21) | casos «SESIÓN COMPLETA» de `GALERIA.md` · gráficos `02_Assets/galeria/sesiones/G-xx_…png` | gráfico · `G-11` · «🔴 10 JULIO 2026 · primer caso con…» — sin resultado ni setup |
| Ejemplos | 10 (G-01 → G-10) | resto de `GALERIA.md` | **no cambia** |

### Las carpetas

| Qué | Dónde | En git |
|---|---|---|
| Tu backtesting de 2025 (116 PNG) | `05_Backtesting/05_01_Operativo/Back_2025/` | no (`.gitignore:35`) |
| Instrucciones del módulo de registro | `05_Backtesting/05_01_Operativo/CLAUDE.md` | sí |
| Una copia vieja del 10/09 (dice «IRI largo») | `05_Backtesting/05_02_Operativo_Contexto/2026-09-10.png` | sí |
| Gráficos de septiembre (10) | `05_Backtesting/test_ciego/Back_claude/` | sí — el portal se publica desde aquí |
| Protocolo, ficha, discrepancias | `05_Backtesting/test_ciego/*.md`, `generar_ficha.py` | sí |
| Tus capturas para comparar | `05_Backtesting/test_ciego/mio/` (vacía) | solo el LEEME |
| Gráficos de julio (11) | `02_Assets/galeria/sesiones/G-11_10jul_sesion.png`… | sí |
| El motor | `05_Backtesting/lector.py`, `dia.py`, `dias_fed.txt`, `noticias_rojas.txt` | sí |
| Las velas | `05_Backtesting/datos/` (el archivo de jul–ago y un `.txt` por día desde el 10/09) | no |
| Motor viejo archivado | `05_Backtesting/_Historia/` | no |
| Gráficos diarios del motor (10:32) | `%LOCALAPPDATA%\TradingJournal\cadena\` (`subir_dia.py:29`) | fuera del proyecto |

### Lo que se descubrió al mirar

- **Los gráficos de septiembre están viejos.** Los del motor son los mismos días y la misma operación, pero ya
  dicen «Continuación»; los de `Back_claude` aún dicen «IRI corto» (comparado el 23/09: mismo gráfico, distinto
  nombre, distinto md5).
- **Los gráficos de julio no cuadran con la tabla vigente.** La tabla se rehízo el 14/09 y el 28/09: 7, 9, 16 y
  20 de julio pierden la operación, 17 de julio la cambia y 8 de julio pasa a un reingreso. Las imágenes G-13 y
  compañía siguen enseñando lo de antes. Las velas de julio están en `datos/NQ 09-26.Last.txt` (del 01/07 al
  25/08), así que el motor actual puede volver a dibujarlas.
- **Los días nuevos (24, 25, 28…) no tienen resultado escrito en ningún sitio que lea el portal.** Solo están en
  `motor_fichas` (Supabase), y el portal no lee nada del Journal.

## 3. Cómo queda

### 3.1 Las carpetas

```
chaumer/05_Backtesting/
├── kris/                                ← tu backtesting a mano
│   ├── CLAUDE.md                          (hoy 05_01_Operativo/CLAUDE.md, con las rutas al día)
│   └── AAAA-MM-DD.png                     116 de 2025 (hoy Back_2025/) · y tus capturas para comparar
│                                          (hoy test_ciego/mio/)
└── claude/                              ← las Sesiones
    ├── AAAA-MM-DD.png                     el gráfico del día, siempre dibujado por el motor
    ├── AAAA-MM-DD.json                    su resultado: setup, STOP/TARGET/NO OPERA, puntos (nuevo)
    ├── protocolo/
    │   ├── LEEME.md                       cómo se hace una sesión en el chat «Backtesting»
    │   │                                  (hoy test_ciego/LEEME_BACK_DIARIO.md)
    │   ├── DISCREPANCIAS.md
    │   ├── FICHA_MARCADO.md
    │   └── generar_ficha.py
    └── motor/
        ├── lector.py · dia.py
        ├── dias_fed.txt · noticias_rojas.txt
        ├── datos/                         las velas — fuera de git, como hoy
        └── _Historia/                     el motor viejo — fuera de git, como hoy
```

Qué desaparece: `05_01_Operativo/`, `05_02_Operativo_Contexto/` (su única imagen es una copia vieja del
10/09; queda en el historial de git), `test_ciego/`, `02_Assets/galeria/sesiones/` (los 11 de julio pasan a
`claude/` con el nombre de su fecha; los viejos quedan en el historial de git).

`registro.txt` de la cadena **se queda en AppData**: es un log de la máquina, no una sesión.

### 3.2 Quién escribe en `claude/`

| Quién | Qué | Cuándo |
|---|---|---|
| El motor (`subir_dia.py`, lanzado por NinjaTrader) | `AAAA-MM-DD.png` + `.json` | cada día a las 10:32 (11:32 en invierno) |
| El chat «Backtesting» | los días que se marquen ahí, con el mismo `dia.py` | cuando se haga |

- **La imagen la dibuja siempre el motor.** Así todas son iguales y siguen el estándar visual.
- **El resultado de la tarjeta:** si el plan tiene el día en su tabla, **manda el plan**; si no, el `.json` del
  motor. Julio y septiembre salen del plan; lo nuevo sale del motor hasta que el chat «Backtesting» lo lleve a la
  tabla.
- **El candado sigue en pie.** El motor deja los archivos en disco, pero **el portal solo cambia al hacer push**.
  Los archivos del día se suben por la noche, cuando ya registraste tu lectura. Nada se sube solo.
- **Lo que no cambia del protocolo:** Claude no mira tu captura de un día hasta haber entregado su marcado. La
  regla sigue igual; lo único que cambia es que la carpeta ahora es `kris/`.

### 3.3 El portal

Una sola pestaña, **Sesiones**, con julio y septiembre juntos, de la más reciente a la más antigua. Detrás sigue
**Ejemplos**, sin cambios.

```
┌──────────────────────────────┐
│ Miércoles 23 de sep. de 2026 │  ← la fecha, arriba
│ [gráfico]                    │
│ ( STOP −28,25 )              │  ← rojo / verde / ámbar como hoy; los puntos en vez de la hora
│ Continuación bajista 8:36    │  ← un solo color, sin puntos
└──────────────────────────────┘
```

- **NO OPERA** queda igual: la píldora ámbar y, debajo, el motivo.
- **El código G-xx y el lema** de los casos (G-11 «primer caso con pérdida real»…) no van en la tarjeta: se ven
  al abrir el visor, con el texto del caso.
- **Las direcciones antiguas siguen funcionando:** `/galeria#G-11`, `/galeria#2026-09-10`, `/galeria#test-ciego`
  → pestaña Sesiones, y `/test-ciego` redirige a `/galeria/#sesiones`.
- Sin totales, como hoy (decisión del 22/09).

### 3.4 Lo que cambia de nombre en el plan (necesita tu sí, cambio a cambio)

Va en su propio commit `plan: …`, sube la versión a **v3.34** y se sincroniza entera (`sincronizar.mjs`, los dos
SQL con sus huellas, `npm run verificar`). Puedes tachar cualquiera.

| # | Archivo | Hoy | Propuesto |
|---|---|---|---|
| P1 | `GALERIA.md` L8 | «`G-22` en adelante son del TEST CIEGO… Gráficos en `…Back_claude`» | «`G-22` en adelante son **sesiones de septiembre**, marcadas sin ver lo que hizo el operador… Gráficos en `05_Backtesting\claude\`» |
| P2 | `GALERIA.md` G-22, G-23, G-24 | «TEST CIEGO · JUEVES 10 SEPTIEMBRE 2026 · …» | «SESIÓN · JUEVES 10 SEPTIEMBRE 2026 · …» |
| P3 | `GALERIA.md` G-11 → G-21 | «SESIÓN COMPLETA · 10 JULIO 2026 · …» | «SESIÓN · 10 JULIO 2026 · …» — un solo nombre para todas |
| P4 | `GALERIA.md` L570, 598, 619, 226 | rutas `05_Backtesting\test_ciego\Back_claude\…` y `../05_Backtesting/G-11_…` | `05_Backtesting\claude\AAAA-MM-DD.png` |
| P5 | `GALERIA.md` L641 y L662 | «Resumen del backtesting día por día — remarcado…» · «Test ciego — día por día» | «Sesiones de julio — día por día» · «Sesiones de septiembre — día por día» |
| P6 | `ESTADO.md` L5, L7, L109 | «TEST CIEGO EN MARCHA» · ruta del protocolo · «el test ciego… contra el portal» | «SESIONES EN MARCHA» · `05_Backtesting\claude\protocolo\LEEME.md` · «las sesiones…» |
| P7 | `reglas/4-setup-entrada.md` L167, L206 | «Origen: test ciego… ver `…test_ciego\DISCREPANCIAS.md`» | «Origen: sesiones de septiembre… ver `…claude\protocolo\DISCREPANCIAS.md`» |
| P8 | `reglas/3-zonas.md` L276 · `reglas/6-filtros.md` L79 · `PARAMETROS.md` L37 · `CONTEXTUALIZACION.md` L32 | «el test ciego» | «las sesiones» |
| ⚠️ P9 | `PENDIENTES.md` `P-29` (L6, L8, L14, L16) · `ESTADO.md` L13 | «`P-29` · El test ciego: en marcha, sin evaluar — HUECO DECLARADO» | «`P-29` · **Las sesiones de validación**: en marcha, sin evaluar — HUECO DECLARADO» |

**P9 no es solo un nombre.** `P-29` es uno de los cuatro huecos declarados, y esos **no se borran del plan**
(regla 5 de `chaumer/CLAUDE.md`). El hueco es este: el plan no se ha puesto a prueba con días marcados **sin ver
la respuesta**. Las sesiones de julio **no** cuentan para eso, porque se marcaron contigo delante. Por eso el nuevo
nombre dice «de validación» y el texto sigue diciendo que solo cuentan las de septiembre en adelante. El hueco
queda igual de abierto; solo cambia cómo se llama.

**No se tocan:** `HISTORIAL.md` (30 menciones) y `CIERRE_FASE_1.md` (3), porque son historia: cuentan lo que se
llamaba así cuando pasó. `reglas.json` se regenera solo.

### 3.5 Fuera del plan

| Dónde | Cambio |
|---|---|
| `chaumer/CLAUDE.md` | cabecera «TEST CIEGO EN MARCHA» → «SESIONES EN MARCHA»; regla 5 → «las sesiones de validación no se han evaluado»; tabla «Quién hace qué»; rutas del motor y de los datos |
| `CLAUDE.md` (raíz) | `motor_fichas`: «candado del test ciego» → «candado del motor» |
| `chaumer/05_Backtesting/kris/CLAUDE.md` | las rutas nuevas |
| `claude/protocolo/LEEME.md` | pasa a ser el protocolo del chat «Backtesting» |
| `.claude/rules/ninjatrader.md` | la carpeta de salida de `CadenaDiaria` |
| `chaumer/04_Web/DISENO_PORTAL.md` | la pestaña única |
| `docs/decisiones.md` | una decisión nueva (D-029): Sesiones y dos carpetas. Las decisiones antiguas no se reescriben |
| `tasks/current.md` | lo que quede |

**Fuera de este diseño:** las carpetas de Cloudinary (`motor/`, `backtesting/`). Las imágenes que ya están allí
no se pueden mover desde el código; si se quiere, va aparte.

## 4. Plan de implementación

Cada fase se verifica por separado y va en su propio commit con push.

### F1 · Las carpetas y las rutas

`git mv` de todo lo de §3.1 y las rutas nuevas en:

| Archivo | Qué |
|---|---|
| `scripts/cadena/subir_dia.py` | `BT` → `claude/motor`; `DIA_MANUAL`/`DIA_AUTO` → `claude/motor/datos/…`; el PNG se escribe en `claude/` (no en AppData); el log se queda en AppData |
| `scripts/cadena/prueba_motor.py` | `BT` y `REL` → `chaumer/05_Backtesting/claude/motor/lector.py` |
| `claude/motor/lector.py` | la ruta relativa a `01_Plan/PARAMETROS.md` (ahora está dos niveles más abajo) |
| `claude/protocolo/generar_ficha.py` | rutas a `01_Plan/` |
| `chaumer/04_Web/scripts/graficos_conceptos.py` | `BACKTEST` → `claude/motor` |
| `chaumer/04_Web/scripts/sync.mjs` | lee de `claude/` (en F3 cambia qué genera) |
| `.gitignore` | `05_Backtesting/claude/motor/datos/`, `05_Backtesting/kris/*.png` |
| `.github/workflows/publicar-portal.yml` | dispara con `chaumer/05_Backtesting/claude/*` |
| `chaumer/.vscode/settings.json` | la carpeta oculta de datos |
| `Documentos\NinjaTrader 8\cadena-diaria.json` | `carpeta_salida` → `…\claude\motor\datos\dia` (se relee cada minuto: sin recompilar) |
| `NinjaTrader/CadenaDiaria.cs` L111 | el valor por defecto, por si falta el JSON (**recompilar en NT8**, no urgente: manda el JSON) |

**Verificación:** `py_compile` de los `.py`; `node --check` de los `.mjs`; `prueba_motor.py` (la regresión da lo
mismo que antes); `subir_dia.py 2026-09-25` escribe en `claude/` y la fila de `motor_fichas` sale igual (`SELECT`);
`npm run build` sin avisos nuevos. Commit: `refactor(backtesting): dos carpetas, kris y claude`.

### F2 · Los gráficos de las Sesiones

1. El motor escribe también `AAAA-MM-DD.json` junto al PNG.
2. Se vuelven a dibujar con el motor actual los 11 días de julio y los 10 de septiembre, y se copian los tres del
   motor (24, 25 y 28 de septiembre).
3. **Día por día, se compara lo que dice el motor con la tabla del plan.** Si no coincide, se te enseña el día. No
   se corrige nada por mi cuenta: el motor es auditoría, no verdad.
4. **Te enseño las imágenes nuevas antes de sustituir las de julio.** Esas las revisaste tú vela a vela, así que
   no se cambian sin tu visto bueno.

**Verificación:** una tabla día × (motor, plan) con todas las diferencias a la vista. Commit:
`feat(backtesting): las sesiones, redibujadas con el motor actual`.

### F3 · El portal

- `sync.mjs`: `claude/*.png` + `.json` → `public/assets/sesiones/`, y `sesiones.json` en lugar de
  `test_ciego.json`.
- `parsers.mjs`: `casosReales()` devuelve `{ sesiones, ejemplos }`. Julio y septiembre, cada uno con su veredicto
  (el del plan manda sobre el del motor). Acepta los títulos de antes y los de después, así F3 no depende de F4.
- `galeria.astro`: una pestaña **Sesiones** y la tarjeta nueva (§3.3); `#test-ciego` → `#sesiones`.
- `test-ciego.astro` → redirige a `/galeria/#sesiones`.
- `TarjetasInicio.astro`, `Marco.astro`, `textos/00-portada.md`, `miniaturas.mjs`: «Sesiones · Ejemplos».

**Verificación:** `npm run verificar`; capturas con puppeteer de la pestaña y del visor en escritorio y en móvil;
las cuatro direcciones antiguas probadas. Commit: `feat(portal): sesiones en una sola pestaña`.

### F4 · El plan

Los cambios de §3.4 que apruebes, en un commit `plan: las sesiones sustituyen al test ciego`, con la versión
v3.34, `vigilar.mjs --estricto`, `sincronizar.mjs`, los dos SQL con sus huellas y `npm run verificar`.

### F5 · La documentación

Lo de §3.5. Commit: `docs: sesiones y dos carpetas (D-029)`.

## 5. Riesgos

| Riesgo | Qué lo evita |
|---|---|
| La cadena de las 10:32 se rompe por una ruta | F1 se prueba con `subir_dia.py` sobre un día real y un `SELECT` de su fila, antes del commit |
| NinjaTrader escribe las velas en la carpeta vieja | `cadena-diaria.json` se cambia en F1; se comprueba el día siguiente en el `registro.txt` de NinjaTrader |
| Un enlace viejo del portal cae en la portada | las cuatro direcciones antiguas se prueban en F3 |
| El motor contradice a la tabla del plan | F2 lo enseña; manda el plan, y la diferencia se te pregunta |
| Git crece con un PNG al día | ~130 KB/día, ~33 MB/año; aceptable. Si molesta, se revisa |
