# PROMPT — FASE 2: MÓDULO WEB DEL TRADING PLAN (Claude Code)

**Cómo usarlo:** abre PowerShell, sitúate en **`E:\Proyectos\Chaumer`** (la raíz, **no** en `04_Web`) y lanza Claude Code desde ahí. Pega todo lo que sigue como primer mensaje.

> **Por qué desde la raíz.** Claude Code trata su carpeta de arranque como "el proyecto": lo que queda fuera lo lee pidiendo permiso archivo por archivo, y **sus búsquedas no llegan ahí**. Todo el material fuente (`01_Plan\`, `02_Assets\`) está fuera de `04_Web`, el script de sincronización cruza esa frontera en cada ejecución, y el repositorio git está en la raíz. Arrancando en `04_Web` no encontraría nada al buscar.

---

## OBJETIVO

Construir el módulo web **"Trading Plan"**: una página **privada**, de solo lectura, que renderice el trading plan completo desde los documentos fuente. Es el primero de tres módulos; los otros dos (backtesting y dashboard) vienen después y deben poder acoplarse sin rehacer la base.

## ENTORNO

- **Raíz del proyecto y directorio de trabajo:** `E:\Proyectos\Chaumer`
- **El módulo web vive en `04_Web\`**, como carpeta del repositorio que **ya existe** en la raíz. **No crees un repositorio anidado dentro de `04_Web`.**
- ⚠️ El `.gitignore` actual **excluye `04_Web/`**. Hay que quitar esa línea o nada del módulo se versiona. Ver el apartado de seguridad.
- **El repositorio es PRIVADO.** Se publicará más adelante, cuando el módulo esté terminado, y solo para que Alfredo Chaumer pueda revisarlo.

### Fuentes de verdad — solo lectura, no las edites

| Archivo | Qué aporta |
|---|---|
| `01_Plan\reglas.json` | **la fuente de verdad de las reglas.** 38 reglas con id, categoría, enunciado, condiciones medibles, acción, excepciones, prioridad, estado, fuente y nota |
| `01_Plan\TRADING_PLAN_CHAUMER.md` | documento maestro: razonamiento, casos y sub-fases |
| `01_Plan\PARAMETROS.md` | **imprescindible.** Los números que pueden cambiar. Las reglas citan el parámetro **por nombre, no por valor** — sin este archivo la web dirá "el tope de stop" sin decir nunca que son 80 puntos |
| `01_Plan\GLOSARIO.md` | 24 términos con definición medible |
| `01_Plan\CHECKLIST_DIARIA.md` | **de aquí sale el modo checklist**, no de la sub-fase F1.9 del plan |
| `01_Plan\GALERIA.md` | **de aquí sale la galería**: 21 casos etiquetados |
| `01_Plan\PENDIENTES.md` | lo que sigue abierto. **Tiene que verse en la web** |
| `01_Plan\CONTEXTUALIZACION.md` | 10 elementos que **NO son reglas y no deben convertirse en reglas** |
| `01_Plan\CIERRE_FASE_1.md` | **léelo primero.** Qué está probado y qué no |
| `01_Plan\EQUIVALENCIA_NUMERACION.md` | las reglas se **renumeraron** el 06/09/2026 · tabla vieja→nueva |
| `02_Assets\` | capturas anotadas, diagramas y gráficas de sesión |

No edites nada de `01_Plan\` ni de `02_Assets\`. Si necesitas un cambio ahí, pídemelo.

En el build, copia los archivos fuente que necesites hacia `04_Web\src\content\` y `04_Web\public\assets\`. Deja ese paso automatizado en un script (`npm run sync` o equivalente) para que actualizar el plan sea un solo comando.

---

## REGLA DURA

La web **no reinterpreta ni resume el plan: renderiza lo que dicen los documentos.** Si una regla cambia, cambia el archivo fuente y la web se actualiza sola. **No hardcodees contenido de trading en los componentes.**

---

## 🚨 EL PLAN NO ESTÁ PROBADO — Y LA WEB TIENE QUE DECIRLO

El plan está en **v3.0**, con 38 reglas, cerrado el 01/09/2026 y contrastado contra 11 sesiones reales al tick. **No está congelado y no está validado.** Se cerró con **cuatro huecos declarados**, y los cuatro **deben verse en la web, no esconderse**:

1. **El test ciego nunca se ejecutó.** No hay ninguna medida de si el documento se sostiene solo, sin el operador corrigiendo al lado.
2. **No hay regla de parada.** El plan no dice cuándo se deja de operar en la semana o el mes. Cada operación arriesga el 5,3 % de la cuenta objetivo.
3. **Falta la capa de contextualización.** En las sesiones grabadas decidió 2 de 4 días de "hoy no opero".
4. **Las cifras del backtesting no miden la estrategia:** 9 operaciones, reglas que cambiaron durante la propia revisión, sin filtro de noticias rojas y sin capa de contexto.

> Si la web muestra el resultado del backtesting (**−91,00 pts en 9 operaciones**), **debe mostrar esos cuatro motivos en la misma pantalla**. Detalle completo en `CIERRE_FASE_1.md`.

---

## REQUISITOS FUNCIONALES

1. **Navegación lateral por sub-fases: `F1.0` → `F1.12`.** Con scroll-spy.
   - ⚠️ **Son doce, no once.** `F1.12` (estructura y marcado) contiene **cinco reglas** y es la más reciente. Un rango que pare en `F1.11` se la deja fuera sin avisar.
   - `F1.11` (test de operabilidad) **no tiene contenido que renderizar**: se muestra como **hueco declarado**, no como sección vacía.
   - En el documento maestro las sub-fases **no están en orden numérico**. Respeta el orden del documento, no el del número.
2. **Buscador** que filtre por texto, por id de regla (`R-21`) y por categoría.
   Las categorías vienen de `reglas.json` y son **siete**, ya ordenadas en el archivo por `categoria_orden`:

   | # | `categoria` | `categoria_nombre` | Reglas |
   |---|---|---|---|
   | 1 | `perimetro` | Perímetro operativo | 4 |
   | 2 | `estructura` | Estructura del precio | 4 |
   | 3 | `zonas` | **Zonas** | **14** |
   | 4 | `setup_entrada` | Setup y entrada | 5 |
   | 5 | `riesgo_gestion` | Riesgo, orden y gestión | 7 |
   | 6 | `filtros` | Filtros de no-operar | 3 |
   | 7 | `proceso` | Proceso diario | 1 |

   - **`zonas` lleva un segundo nivel** en el campo `subcategoria`: `marcado` (11) y `vigencia` (3). Muéstralo como **una sola categoría con dos apartados dentro**, no como dos categorías. Son 14 de 38 reglas: sin el segundo nivel el filtro devuelve más de un tercio del plan.
   - Cada regla trae además `categoria_nombre`, `categoria_descripcion` y `categoria_orden`. **Úsalos: no escribas los nombres a mano ni inventes el orden.**
   - `R-20` (rompimiento y consecución) está en `zonas · vigencia` pero define también la entrada: **enlázala desde Setup y entrada**.
   - **No inventes categorías nuevas ni las renombres.**
3. **Ficha de regla:** enunciado, condiciones medibles, acción, excepciones, estado, fuente y nota.
   - ⚠️ **`reglas.json` no tiene campo de imagen, y la mayoría de las reglas no tiene ninguna.** En todo el proyecto hay **9 diagramas** (`02_Assets\diagramas\`, nombrados por regla o por concepto — los dos de `apendice_*` ilustran `R-10`, `R-11` y `R-14`) y **un solo contraejemplo** (`02_Assets\invalidos\R-12_invalido_01.png`).
   - Asocia imagen a regla **solo cuando el nombre del archivo lo diga**. Si una regla no tiene imagen, **la ficha simplemente no muestra imagen**: nada de placeholders, ni huecos, ni "imagen pendiente".
4. **Diagramas Mermaid.** Hay exactamente **dos** en todo el plan. Que rendericen bien y sean legibles en móvil; el zoom es opcional.
5. **Galería de casos**, con lightbox y filtro por regla. Fuente: `GALERIA.md`, **21 casos**.
   - Las gráficas de sesión están en `02_Assets\galeria\sesiones\` (`G-11` … `G-21`), todas con el estándar visual actual.
   - Los archivos sueltos que hay en `02_Assets\galeria\` son **anteriores** a ese estándar. Si un caso tiene las dos versiones, usa la de `sesiones\`.
   - Los casos sin imagen se muestran **igualmente**, con su texto.
6. **Modo checklist:** vista imprimible del proceso operativo diario, desde `CHECKLIST_DIARIA.md` — **cuatro bloques**: antes de abrir NinjaTrader · premercado · ventana operativa · después del llenado.
7. **Vista de pendientes:** los 8 puntos abiertos de `PENDIENTES.md` más los cuatro huecos declarados. ⚠️ **Ninguna de las 38 reglas está marcada como `PENDIENTE`** — todas están confirmadas. Lo pendiente vive en `PENDIENTES.md` y en `CIERRE_FASE_1.md`; no lo busques en el estado de las reglas.
8. **Vista de contextualización**, claramente separada de las reglas y marcada como **"esto NO es regla"**.
9. **Versión del plan y fecha de última actualización**, visibles. Hoy: **v3.0 · 2026-09-06**. Léelas del documento, no las escribas a mano.
10. **Responsive:** tiene que leerse bien en iPhone durante la sesión.

---

## DISEÑO

Usa la skill de diseño del proyecto. Estética oscura tipo terminal financiero (Linear / TradingView), tipografía legible en bloques largos, jerarquía clara entre enunciado de regla y detalle. **Nada de aspecto "plantilla de IA":** sin degradados morados, sin emojis decorativos, sin tarjetas genéricas con sombra.

**El estándar visual del proyecto ya está fijado y validado por el operador** — está en `CLAUDE.md`, en la raíz. Resumen: fondo `#0B0E14`, sin cuadrícula, velas azul `#2E86FF` alcista y blanca `#FFFFFF` bajista, zonas **todas del mismo gris** `#8B93A7`, zigzag blanco, franjas roja y verde solo sobre el tramo de la operación, **sin líneas de entrada, stop ni objetivo**. Si el módulo dibuja algo parecido a un gráfico, **debe respetarlo**.

Dos frases del operador que valen como criterio: *"entre más limpio sea el gráfico, mucho mejor"* y *"nada de tablas de datos donde quepa una gráfica"*.

---

## SEGURIDAD Y CONTENIDO

- **Módulo 100 % estático.** No toca base de datos.
- **El repositorio es privado hasta nuevo aviso.** El riesgo aquí **no son solo las claves: es el contenido.** Este plan es metodología de un tercero (Alfredo Chaumer) y es un plan **no validado**.
- ⚠️ **`00_Guias\` no puede acabar en el repositorio.** Contiene PDFs de terceros y **1,4 GB de video** de sesiones de Chaumer. Añádelo al `.gitignore`. Además, GitHub rechaza archivos de más de 100 MB y esos mp4 pasan de 200 MB cada uno: el push fallaría.
- **Revisa el `.gitignore` como primera tarea.** Hoy dice `04_Web/` (hay que quitarlo) y no dice `00_Guias/` (hay que añadirlo). Añade también `node_modules/`, `dist/`, `.env*`.
- Cuando lleguen los módulos de backtesting: **nada de escritura desde el cliente**. Lectura vía RLS con políticas explícitas; escritura autenticada.
- **Ninguna clave, endpoint privado ni token en el bundle.** Revísalo antes de cerrar.

---

## RESTRICCIONES

- **No inventes reglas de trading. No completes vacíos del documento.** Si algo falta, falta.
- **Ningún adjetivo es una regla.** Solo ticks, puntos, porcentajes, número de velas y horas exactas.
- **No conviertas en regla nada de `CONTEXTUALIZACION.md`.** Esos elementos están fuera del plan a propósito, porque no tienen número.
- **No modifiques `01_Plan\` ni `02_Assets\`.** Si hace falta, pídemelo.
- No mezcles este módulo con los datos de operativa real del journal existente (`kristeb-trader/trading-journal`).
- Commits pequeños y descriptivos.

---

## ANTES DE PROGRAMAR

1. Lee `01_Plan\CIERRE_FASE_1.md`, luego `04_Web\BRIEF_PORTAL.md`, luego el resto de `01_Plan\`.
2. Dime **cómo estructurarías el renderizado** y de dónde sale cada vista.
3. Propón la **estructura de archivos de `04_Web`** y espera mi visto bueno.
4. **Pregúntame las cinco decisiones abiertas** que están en `BRIEF_PORTAL.md` — no las resuelvas tú.
5. Solo entonces empieza a construir.

---

## CRITERIOS DE ACEPTACIÓN

- [ ] Cambiar una línea en `01_Plan\TRADING_PLAN_CHAUMER.md`, ejecutar el sync y ver el cambio en la web **sin tocar código**
- [ ] **Las 38 reglas de `reglas.json` aparecen en la web** — cuéntalas, no lo des por hecho
- [ ] **Las 12 sub-fases están en la navegación**, incluida `F1.12`
- [ ] **Los cuatro huecos declarados se ven**, y las cifras del backtesting nunca aparecen sin sus advertencias
- [ ] Los valores de los parámetros se resuelven desde `PARAMETROS.md`: en ningún sitio se lee un número escrito a mano
- [ ] Los 21 casos de la galería aparecen, con o sin imagen, y ninguna ficha muestra un placeholder inventado
- [ ] Los dos diagramas Mermaid renderizan en móvil y escritorio
- [ ] Lighthouse: rendimiento y accesibilidad por encima de 90
- [ ] **Cero secretos en el repositorio, y `00_Guias\` fuera de él**
