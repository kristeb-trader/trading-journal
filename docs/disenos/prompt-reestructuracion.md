# Prompt — Reestructuración del Trading Journal

> Pegar este prompt completo al inicio de una sesión nueva de Claude Code, con el
> working directory en `E:\Proyectos\Trading Journal`.

---

## MISIÓN

Quiero reestructurar cómo llevo este proyecto. No es un cambio de funcionalidad: la app
funciona y **no quiero romperla**. Es un cambio de **orden**: documentación, memoria,
skills, configuración y forma de trabajar contigo.

Objetivos, por prioridad:

1. **Unificar** — que cada hecho viva en UN solo sitio y que no haya dos fuentes que se
   contradigan.
2. **Simplificar** — menos archivos, menos texto, menos que leer para entender algo.
3. **Ordenar y estructurar** — que se sepa dónde va cada cosa nueva sin preguntar.
4. **Optimizar tokens** — que lo que se carga en cada sesión sea lo mínimo necesario, y
   lo demás se lea bajo demanda.
5. **Cumplir los estándares de Claude Code** para `CLAUDE.md`, skills, comandos y
   settings — no mi versión artesanal.
6. **Dejar de repetirme** — convertir en skills lo que hoy te explico cada sesión.

Trabaja en español. Sé directo: si algo de lo que pido está mal planteado, dilo.

### Decisión ya tomada: los skills son GENÉRICOS

**Todos los skills van a nivel de usuario (`~/.claude/skills/`) y deben servirme en
cualquier proyecto**, no solo en el Trading Journal. Tengo al menos tres en marcha
(Trading Journal, KrisKapital, Finanzas Personales) y no quiero mantener cuatro copias
de lo mismo.

Esto impone una separación estricta que atraviesa todo el trabajo:

| | Dónde vive | Qué contiene |
|---|---|---|
| **El CÓMO** (skill, genérico y portable) | `~/.claude/skills/` | El proceso, el criterio, el estándar. Cero rutas, tablas, nombres de archivo o paletas de este repo. |
| **El QUÉ** (proyecto, específico) | `CLAUDE.md` + `docs/` + memoria del repo | Stack, esquema, invariantes, paleta, URLs. |

**El riesgo de un skill genérico es volverse vago** ("documenta bien", "usa tokens
coherentes"): eso no sirve para nada. Para evitarlo, cada skill debe **decir de dónde
lee los datos específicos del proyecto en el que se está ejecutando**.

Por eso, además de los skills, tienes que diseñar el **contrato**: qué debe exponer el
`CLAUDE.md` de CUALQUIER proyecto mío para que estos skills funcionen sobre él
(secciones con nombre estable, dónde se declaran los tokens visuales, dónde vive la
convención de migraciones, dónde están las invariantes intocables). Ese contrato es
parte del entregable, y el `CLAUDE.md` nuevo del Trading Journal debe ser su primera
implementación y servir de plantilla para los otros dos proyectos.

Ojo con la contaminación que ya existe: `flujo-desarrollo` es un skill de usuario pero
tiene mis proyectos escritos dentro (§9) y preferencias atadas a repos concretos. Eso
hay que limpiarlo aplicando la misma regla.

**Ya evaluamos duplicar los skills por proyecto y se DESCARTÓ. No lo propongas de
nuevo.** Las razones, por si te sirven de criterio al diseñar:

- Cuatro skills × tres proyectos = doce archivos a sincronizar. Es exactamente el
  problema de verdad duplicada que esta reestructuración viene a eliminar (ver
  hallazgos #2 y #3).
- Un dato del proyecto guardado en `~/.claude/` queda **fuera del repo**: la paleta se
  desincroniza del `styles.css` que describe en cuanto cambio un color, y nada avisa.
  Dentro del repo, cambia en el mismo commit.
- El proceso (analizar → diagnóstico → diseño → implementar → verificar) es idéntico en
  los tres proyectos. Es lo más portable que tengo y lo último que hay que duplicar.

**La costura es esta:** si el contenido cambia al cambiar de proyecto, es un DATO y va
al repo. Si no cambia, es PROCESO y va al skill. Un skill es un archivo de
instrucciones, no una base de datos.

**Lo que sí puede justificar un skill de proyecto más adelante** (no ahora, y no estos
cuatro): un flujo que solo existe en un repo — recompilar el indicador de NinjaTrader,
el routing de cuentas Apex, desplegar el bot de Telegram. Si detectas alguno, anótalo
como propuesta aparte; no lo mezcles con los cuatro genéricos.

**Y el punto donde esta decisión se caería:** si al escribir el contrato resulta que
necesita más de ~5 secciones por proyecto para que los skills sean concretos y no
genéricos-vagos, entonces la abstracción era falsa. Dímelo en el diagnóstico en vez de
seguir adelante y entregarme cuatro skills que digan "documenta bien".

---

## FASE 0 — LECTURA OBLIGATORIA ANTES DE OPINAR

No propongas nada hasta haber leído (de verdad, no por encima):

| Archivo | Por qué |
|---|---|
| `CLAUDE.md` | El objeto principal del rediseño |
| `docs/historial-proyecto.md` — al menos cabecera + los 3 checkpoints de Ago 2026 | Estado real |
| `C:\Users\Asus\.claude\projects\E--Proyectos-Trading-Journal\memory\MEMORY.md` + los 11 `.md` | Capa de memoria |
| `C:\Users\Asus\.claude\skills\flujo-desarrollo\SKILL.md` | El skill que ya existe |
| `C:\Users\Asus\.claude\skills\dashboards-informes\SKILL.md` + `references/` | Referencia de skill bien montado |
| `.claude/settings.local.json` | 112 permisos literales |
| `docs/Disciplina.md` | Criterio canónico que **no se toca** |
| Listado de `docs/`, `docs/migrations/`, `js/`, raíz del repo | Inventario |

Además, **consulta la documentación oficial vigente** de Claude Code sobre `CLAUDE.md`,
skills (`SKILL.md`, frontmatter, `references/`, skills de proyecto vs de usuario),
slash commands, hooks y `settings.json`. No lo hagas de memoria: quiero que lo que
propongas sea el estándar real de hoy, con enlaces. Si algo que hago hoy contradice el
estándar, señálalo explícitamente.

---

## HALLAZGOS YA VERIFICADOS — parte de aquí, no los redescubras

Esto ya está comprobado contra el repo. Confírmalo rápido y sigue; no gastes tokens
repitiendo el inventario.

1. **`CLAUDE.md` = 258 líneas / 20 KB.** Mezcla 5 tipos de contenido: referencia
   (stack, tablas), invariantes de arquitectura, post-mortems de bugs, changelog de
   hitos cerrados (4 bloques ✅ + 1 bloque 🚫 "decidido y cerrado") y flujo de trabajo.
   Se carga entero en cada sesión.
2. **Contradicción viva:** `CLAUDE.md:136` dice "entregar SQL en `docs/migrations/` y
   avisar al usuario que lo corra". El skill `flujo-desarrollo` y la memoria
   `migraciones-via-mcp.md` dicen lo contrario (las aplica Claude vía MCP de Supabase).
   **Hay que resolverla, no documentar las dos.**
3. **Triple duplicación:** CLAUDE.md (tabla de tablas) ↔ `memory/db-schema.md`;
   CLAUDE.md (Flujo de trabajo) ↔ skill `flujo-desarrollo`; CLAUDE.md (bloques ✅) ↔
   `docs/historial-proyecto.md`.
4. **~3.600 líneas de docs obsoletas y engañosas:** `manual-tecnico.md` (982),
   `manual-usuario.md` (764), `arquitectura-funcional.md` (522),
   `arquitectura-tecnica.md` (631), `COACH_IA_SPEC.md` (728, del 27 may — describe un
   Coach que ya no existe). Más `supabase_coach_ia.sql`, `architecture-diagram.html`,
   `user-journey.html`, 2 PNG y `Otros/`. El propio CLAUDE.md admite que describen el
   modelo viejo de 3 secciones.
5. **`docs/historial-proyecto.md` = 1.938 líneas**, con **dos secciones tituladas
   idénticamente "Checkpoint Ago 2026 (3)"** (líneas 1603 y 1853) y una cabecera de un
   solo párrafo de ~1.800 caracteres.
6. **Cero skills de proyecto, cero slash commands.** `.claude/` solo tiene
   `launch.json` y `settings.local.json` (16 KB, **112 permisos literales** — el
   anti-patrón contra el que advierte mi propio skill `flujo-desarrollo`).
7. **El diseño aprobado no se persiste:** vive "en el artefacto de la propuesta". Ya
   provocó que se implementara otra cosa y hubiera que rehacerla.
8. **65 migraciones SQL planas** en `docs/migrations/`, mezclando DDL de esquema con
   parches de datos puntuales, sin índice ni registro de cuáles se aplicaron.
9. **`README.md` = 2 líneas.** Inútil como punto de entrada.
10. **Código:** 18 archivos JS (~10.400 líneas) sin módulos ni bundler — `coach.js`
    2.136, `form.js` 1.327, `db.js` 1.153; `index.html` 1.409 con el markup de todas
    las secciones; `styles.css` 4.217 en un solo archivo. Acoplamiento por ids del DOM.
11. **Dos lenguajes visuales conviviendo:** el nuevo (16 ago) solo está en la pestaña
    Diario; el resto de la app sigue con el viejo.

---

## FASE 1 — ANÁLISIS PROFUNDO

Analiza, con evidencia (rutas y números, no impresiones):

**A. Contexto y tokens**
- Qué se carga hoy en cada sesión (CLAUDE.md + MEMORY.md + memorias + skills) y cuánto
  pesa aproximadamente en tokens.
- Qué porcentaje de eso es *necesario siempre* vs *necesario a veces* vs *histórico*.
- Qué debería cargarse bajo demanda y con qué mecanismo (skill, `@import`, doc apuntada).

**B. Fuentes de verdad**
- Mapa de cada hecho importante → dónde está escrito hoy → dónde debería estar.
- Lista completa de duplicaciones y **de contradicciones** (hay al menos una).
- Regla clara y defendible del tipo: invariantes → CLAUDE.md · esquema → memoria ·
  narrativa → historial · proceso → skill.

**C. Documentación**
- Clasifica CADA archivo de `docs/` y de la raíz en: **vigente** / **obsoleto** /
  **fusionable** / **archivable** / **borrable**. Con justificación por archivo.
- Propón el árbol final de `docs/` y qué documento se escribe en cada tipo de cambio.

**D. Skills** *(todos genéricos, a nivel de usuario — ver "Decisión ya tomada")*
- Qué skills hacen falta y qué cubre cada uno, sin solaparse entre ellos.
- **Línea de corte genérico/específico:** para cada skill, qué es proceso portable y
  qué es dato del proyecto que debe leerse del repo en tiempo de ejecución.
- **El contrato skill ↔ proyecto:** qué debe exponer el `CLAUDE.md` de cualquier
  proyecto mío para que estos skills funcionen. Nombres de sección estables y mínimos:
  si el contrato exige diez secciones, nadie lo va a cumplir en el proyecto siguiente.
- Qué hacer con `flujo-desarrollo`: reemplazarlo, dividirlo o reescribirlo. Y cómo
  limpiar los nombres de proyecto que tiene dentro.
- Cómo se comportan estos skills en un proyecto que **todavía no cumple el contrato**
  (los otros dos repos, hoy). Degradación digna, no error.
- Si algo se resuelve mejor con un slash command o un hook que con un skill, dilo.

**E. Configuración**
- `.claude/settings.local.json`: cómo pasar de 112 reglas literales a patrones amplios
  sin perder seguridad. Qué debería ir en settings de proyecto vs de usuario.
- Si algún automatismo que hoy hago a mano debería ser un hook, propónlo.

**F. Código y CSS** *(analizar sí, tocar no todavía — ver ALCANCE)*
- Riesgos reales de la estructura actual y qué costaría ordenarla.
- Cómo cerrar la deuda del doble lenguaje visual sin rehacer la app.

---

## FASE 2 — DIAGNÓSTICO PARA USUARIO (no técnico)

Antes del diseño, entrégame un diagnóstico **en lenguaje claro**, pensado para mí, no
para un ingeniero. Requisitos:

- Qué está desordenado y **qué me cuesta hoy** (tiempo, tokens, riesgo de error,
  repetirme cada sesión). Con ejemplos concretos de mi propio repo.
- Priorizado: qué duele más, qué es cosmético.
- Sin jerga innecesaria; si usas un término técnico, explícalo en la misma línea.
- Tablas y listas cortas, no ensayos.
- **Para y espera.** No pases al diseño hasta que yo responda.

---

## FASE 3 — DISEÑO

Con el diagnóstico aprobado, entrégame el diseño completo de la solución:

- Árbol de archivos final (antes → después), incluyendo qué se borra y qué se archiva.
- **Contenido propuesto del `CLAUDE.md` nuevo**, completo, listo para leer. Con su
  tamaño objetivo y la justificación de qué se sacó y a dónde fue. Debe cumplir el
  contrato y **servir de plantilla** para KrisKapital y Finanzas Personales.
- **El contrato skill ↔ proyecto**, escrito como documento aparte: qué secciones exige,
  con qué nombres, y un esqueleto vacío que yo pueda copiar al arrancar un proyecto.
- Ficha de cada skill: `name`, `description`, contenido resumido, cuándo se dispara,
  **qué lee del proyecto** y qué hace si ese dato falta.
- Cómo se verifica que un skill genérico funciona: al menos una prueba mental contra
  un proyecto que NO sea este.
- Nueva estructura de memoria y de `docs/`.
- Convención de migraciones y de nombrado de checkpoints.
- Diff propuesto de `settings.local.json`.
- **Plan de implementación por fases, cada una verificable de forma independiente.**

**Regla del diseño:** si le pido modificaciones, **arréglalo sin perder los puntos
anteriores**. Cada iteración es el diseño completo actualizado, no un parche suelto ni
un "además de lo anterior". Numera las versiones (v1, v2…) y marca qué cambió respecto
a la anterior.

**Persiste el diseño en un archivo del repo** (p. ej. `docs/disenos/`), no solo en un
artefacto de chat. El diseño aprobado es la fuente de verdad de la implementación y ya
me pasó una vez que se implementara otra cosa.

**Para y espera aprobación explícita del diseño.**

---

## FASE 4 — IMPLEMENTACIÓN

Solo cuando el diseño esté aprobado:

- Implementa **fase por fase**, sin perder detalles del diseño aprobado. Al terminar
  cada fase, verifica y reporta antes de seguir.
- Verificación real, no "debería funcionar": preview levantado, consola sin errores,
  `node --check` donde aplique, y para la BD un SELECT que lo confirme.
- Commit + push tras cada fase. Conventional commits en español.
- Al final, una tabla: qué cambió, dónde, qué verificaste y qué queda pendiente.

---

## LOS SKILLS QUE QUIERO

Cuatro, más los que tú justifiques. **Los cuatro son genéricos y van a
`~/.claude/skills/`.** Ninguno puede tener dentro rutas, nombres de tabla, paletas ni
detalles del Trading Journal: cuando necesiten un dato del proyecto, lo leen del repo
en el que se estén ejecutando, vía el contrato.

Para cada uno entrégame: `name`, `description` (es el campo que decide si se dispara
solo — trabájalo), qué contiene, qué lee del proyecto, y cómo se comporta si ese dato
no existe.

### 1. Skill de flujo de trabajo
El más importante. Debe imponer, para todo cambio no trivial:

1. **Análisis a detalle y profundo** — leer el código real antes de opinar, verificar
   en el repo, nada de suposiciones.
2. **Diagnóstico para usuario** — claro, no técnico, priorizado. Y **parar**.
3. **Diseño** — completo y persistido en archivo.
   - 3.1 Si pido cambios, se corrige el diseño **sin perder los puntos ya acordados**;
     entrega siempre el diseño íntegro actualizado y versionado.
   - Se implementa solo cuando el diseño está aprobado.
4. **Implementación** — fiel al diseño, por fases, **sin perder detalles**, verificada.

Es puro proceso, así que es el más fácil de mantener genérico. Lo único que debe leer
del proyecto es **dónde se persisten los diseños aprobados** y **qué se considera
"verificado"** en ese stack (aquí es preview + consola; en otro puede ser una suite de
tests).

Piensa el nombre: `flujo-trabajo` es descriptivo pero decide tú y justifícalo. Ojo: ya
existe `flujo-desarrollo`; decide si este lo reemplaza, lo divide o convive con él, y
**elimina el solapamiento** — no quiero dos skills de proceso compitiendo.

### 2. Skill de diseño
Genérico: cómo mantener un lenguaje visual coherente en cualquier app mía. Qué mirar
antes de crear una pantalla, cómo detectar que estoy inventando un estilo nuevo en vez
de reutilizar el existente, cómo tratar estados (vacío, carga, error), densidad,
responsive y accesibilidad, y cómo se cierra la deuda cuando conviven dos lenguajes
visuales — que es justo mi caso hoy.

**La paleta y los tokens concretos NO van en el skill**: van en el proyecto, y el skill
dice dónde buscarlos y qué hacer si el proyecto aún no los tiene declarados
(proponerlos y pedir aprobación, no improvisar). Revisa el skill `dashboards-informes`,
que ya existe y ya es genérico: puede que parte de esto sea suyo. No dupliques —
delimita o fusiona.

### 3. Skill de base de datos
Genérico sobre **Supabase/Postgres**, que es el stack de mis tres proyectos:
convención de migraciones, aplicarlas vía MCP, verificación obligatoria posterior con
un SELECT, RLS y roles (`authenticated` vs `service_role`), cómo se documenta el
esquema después del cambio, y qué hacer antes de tocar algo destructivo.

**Aquí se resuelve la contradicción del hallazgo #2**: una sola regla sobre quién
aplica las migraciones, y que la misma valga en los tres repos.

Lo intocable de cada proyecto (aquí: el criterio de disciplina en `db.js`, el P&L neto,
la zona horaria de NT8) **no se escribe en el skill** — el skill exige que el proyecto
declare sus invariantes de datos en un sitio conocido y obliga a leerlas antes de
tocar la BD. Esa lista es parte del contrato.

### 4. Skill de documentación
Genérico: qué se documenta, dónde y con qué formato, en cualquier proyecto mío. Debe
responder sin ambigüedad "¿esto va al CLAUDE.md, a memoria, al historial, a un manual o
a ningún sitio?" mediante un criterio portable — algo como *permanencia × frecuencia de
uso*, no una lista de rutas de este repo.

Incluye: qué NO se documenta (lo que el código ya dice), cuándo un doc se archiva en
vez de actualizarse, y la convención de checkpoints/changelog que evita el choque de
nombres del hallazgo #5. Este skill es también el que **mantiene vivo el contrato**:
cuando un proyecto gana una invariante nueva, dice dónde ponerla.

---

## ALCANCE — qué NO tocar en esta ronda

- **No cambiar comportamiento de la app.** Si un cambio de orden obliga a tocar código
  funcional, sepáralo, dilo y espera decisión aparte.
- **No tocar el criterio de disciplina** (`db.js`) ni las invariantes documentadas
  (caché del Coach, zona horaria NT8, P&L neto, `upsertSesion`). Se conservan; lo que
  cambia es dónde y cómo están escritas.
- **No reabrir lo decidido y cerrado** (el bloque 🚫 del 24 jul sobre las 6 reglas de
  feb–may).
- **La reestructuración de `js/`, `index.html` y `styles.css` se ANALIZA pero no se
  ejecuta ahora.** Es la parte de mayor riesgo: entra como fase propia, con su propio
  diseño y su propia aprobación, después de que el orden documental esté cerrado. Si
  discrepas, dilo en el diagnóstico con argumentos.
- **Nada de dependencias nuevas ni frameworks.** El stack es vanilla y así se queda.
- **No borrar nada sin listarlo primero** y sin que yo lo apruebe.

---

## CÓMO QUIERO QUE ME LO ENTREGUES

- Español, directo, sin relleno.
- Tablas y listas; nada de párrafos largos.
- Cada afirmación sobre el repo, con su ruta y su número de línea.
- Si algo que pido es mala idea, dilo con argumentos en vez de obedecer.
- Distingue siempre lo verificado de lo supuesto.
- Respeta las tres paradas: **diagnóstico → diseño → implementación.** No las saltes
  aunque tengas claro el camino.

**Empieza por la Fase 0 y la Fase 1. Cuando termines, entrégame solo el diagnóstico de
la Fase 2 y espera.**
