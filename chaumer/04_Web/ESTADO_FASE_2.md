# ESTADO DE LA FASE 2 — el portal

> **Este es el documento de seguimiento.** Qué hay hecho, qué falta, qué se
> decidió y por qué. Es el equivalente de `01_Plan\ESTADO.md` para la fase 2.
>
> **Se actualiza al cerrar cada sesión de trabajo.** Si abres un chat nuevo,
> léelo primero: con esto y `CLAUDE.md` se retoma sin que nadie te cuente nada.

**Fase:** 2 — portal web · **Estado:** 🟢 publicado, 🔍 **en revisión por partes**
**El mapa de todas las fases está en `..\FASES.md`.** Después de esta vienen el agente de backtesting y el bot de NinjaTrader, las dos **declaradas y sin definir**.
**Última actualización:** 2026-09-02
**Dirección:** https://plan-operativo-nq.pages.dev

---

## Lo primero que hay que saber

| | |
|---|---|
| **Qué es** | la página donde **Alfredo Chaumer** revisa las reglas que se extrajeron de su metodología y **deja observaciones escritas** |
| **Quién entra** | cualquiera con la dirección. **Sin código, sin correo, sin contraseña** — decisión del operador |
| **Qué se comparte** | **la dirección**, nunca el repositorio. El repositorio es privado y se queda privado |
| **Cómo se publica** | se compila en el equipo y se sube con `wrangler`. Cloudflare **no** está conectado al repositorio |
| **Dónde viven las observaciones** | Cloudflare D1, la base de datos de Cloudflare |
| **Qué NO es** | una herramienta de operación. No manda órdenes y no se conecta a ninguna cuenta |

> 🔴 **Una observación de Alfredo no es una regla.** El plan solo cambia si el
> operador cambia `01_Plan\`. El portal deja constancia; no toca la fuente.

---

## Los documentos de esta carpeta, y cuál manda

| Archivo | Qué es | Vigencia |
|---|---|---|
| **`ESTADO_FASE_2.md`** | **este archivo. El seguimiento** | ✅ **vivo** |
| `DESPLIEGUE.md` | cómo se publica, paso a paso | ✅ vivo |
| `DISENO_PORTAL.md` | el diseño de partida, escrito el 31/08 | 🟡 parcial — la estructura de ocho módulos es posterior |
| `BRIEF_PORTAL.md` | el encargo original | 🔴 superado |
| `PROMPT_FASE_2.md` | el guion de arranque | 🔴 superado |

**Si dos se contradicen, manda el de más abajo en el tiempo**, y este archivo por
encima de todos. Los dos marcados en rojo se conservan como historia; no se
trabaja contra ellos.

---

## Qué hay construido

### El recorrido del método — ocho módulos

Cada uno en su propia dirección. Es lo que Alfredo recorre.

| | Módulo | Qué cubre |
|---|---|---|
| 01 | **Premercado** | estado del operador, calendario de noticias, los dos gráficos, la ATM, zonas por volumen |
| 02 | **Marcación de zonas** | corrida y retroceso, de qué vela sale la zona, romper y confirmar, las cinco velas, convivencia de zonas, caducidad |
| 03 | **Setups operativos** | IRI y Reingreso, con una comparación lado a lado |
| 04 | **Jornada operativa** | las dos horas, la primera vela, cómo avanza la sesión, el registro |
| 05 | **Mecánica de entrada** | qué orden y dónde, stop y objetivo, la orden esperando |
| 06 | **Filtros: cuándo NO se entra** | los cuatro filtros, las noticias, lo que cancela la orden |
| 07 | **Dentro de la operación** | los dos ajustes al llenarse y la prohibición de gestionar |
| 08 | **Riesgo y tamaño** | el tope, el cupo diario, el tamaño fijo, y que **no existe regla de parada** |

Los módulos 07 y 08 **no estaban en la lista original del operador**. Se
añadieron el 01/09 con su visto bueno: sin el 07 el portal explicaba cómo entrar
pero no la regla más dura del plan, y el 08 recoge un hueco declarado.

### El resto del portal

| Sección | Estado |
|---|---|
| Portada de bienvenida | ✅ |
| Casos reales (21, con filtro) | ✅ |
| Vocabulario (23 términos) | ✅ |
| Observaciones | ✅ funcionando de punta a punta |
| Buscador con `Ctrl+K` | ✅ 114 entradas |
| El plan completo, las 38 fichas de regla, parámetros, checklist, pendientes, contextualización, acta de cierre | ✅ **solo en modo técnico** |

### Modo técnico

Enseña los códigos de regla (`R-22`, `P-14`…) y el grupo «Todo el detalle» del
menú. **Es para el operador, no para Alfredo.**

- **Encender:** añadir `?tecnico=1` a cualquier dirección. El navegador lo recuerda.
- **Apagar:** `?tecnico=0`, o el enlace «apagar» que aparece abajo del menú cuando está encendido.

### Gráficos

**Trece**, generados con Python sobre datos reales de mercado, con
`scripts/graficos_conceptos.py`, que importa el motor de `05_Backtesting`
**sin tocarlo**. Se regeneran con:

```
python scripts/graficos_conceptos.py
```

---

## 🔍 La revisión del operador — EN MARCHA

**El operador está revisando el portal por partes**, y reporta los cambios por
partes, cada tanda en su propio chat. Decidido así el 2026-09-01: recorrerlo
entero de una vez es demasiado.

> **Al terminar cada tanda, marca aquí la parte revisada y anota los cambios
> hechos.** Es lo que permite que el siguiente chat sepa por dónde va la cosa
> sin preguntar.

| | Parte | Dirección | Revisada | Cambios |
|---|---|---|---|---|
| | Portada | `/` | ✅ **2026-09-02** | marca nueva, menú con iconos, dos portadas, pie del operador. Detalle en el historial |
| 01 | Premercado | `/premercado` | ⬜ | |
| 02 | Marcación de zonas | `/zonas` | 🚧 **2026-09-03** | dos vueltas: reescrito en apartados con imagen, y luego sus correcciones de `02-zonas.md`. Quedan 4 cosas que quitó, pendientes de su respuesta |
| 03 | Setups operativos | `/setups` | ⬜ | |
| 04 | Jornada operativa | `/jornada` | ⬜ | |
| 05 | Mecánica de entrada | `/entrada` | ⬜ | |
| 06 | Filtros: cuándo NO se entra | `/filtros` | ⬜ | |
| 07 | Dentro de la operación | `/dentro` | ⬜ | |
| 08 | Riesgo y tamaño | `/riesgo` | ⬜ | |
| | Casos reales | `/galeria` | ⬜ | |
| | Vocabulario | `/glosario` | ⬜ | |
| | Observaciones | `/observaciones` | ⬜ | |

**Cómo se retoma una tanda en un chat nuevo:**

> Lee `CLAUDE.md` y `04_Web\ESTADO_FASE_2.md`. Vamos con la revisión del módulo *(el que sea)*.

---

## Qué falta

| | Qué | Quién |
|---|---|---|
| 🔴 | **Crear la clave del operador** para poder ver y borrar las observaciones desde fuera del portal: `npx wrangler pages secret put CLAVE_OPERADOR --project-name=plan-operativo-nq` | **el operador** |
| 🟡 | La revisión por partes de arriba | el operador |
| 🔴 | **Alfredo no puede dejar observaciones en los ocho módulos.** Comprobado uno por uno: cero puntos comentables en premercado, zonas, setups, jornada, entrada, filtros, dentro y riesgo. Solo se comenta en casos reales y vocabulario, y `/observaciones` es de solo lectura. **Es la razón de ser de la fase.** Siguiente tanda | pendiente |
| 🟡 | Simplificar la prosa de los casos reales, que todavía suena a auditoría | pendiente |
| 🟡 | Pasarle la dirección a Alfredo | el operador, **cuando termine la revisión** |

---

## Historial

Está en **`ESTADO_FASE_2_HISTORIAL.md`**, en esta misma carpeta: 916 líneas de
registro cronológico, de lo más nuevo a lo más viejo.

Se sacó de aquí el 07/09/2026 porque era el 80 % del archivo. Este documento
se lee al arrancar un chat, y cargar el historial entero costaba unos 17 000
tokens **que se vuelven a pagar en cada turno de esa sesión**. Ahora cuesta
una quinta parte. El historial se abre solo cuando de verdad hace falta
buscar algo en él, y buscando por fecha, no leyéndolo entero.

---

## Cómo se trabaja aquí

### Tocar el portal a mano y ver el cambio al momento

**VS Code**, con la carpeta `E:\Proyectos\Chaumer` abierta entera (no solo
`04_Web`: así se ve el plan al lado del portal).

Al abrirla, VS Code ofrece instalar dos extensiones y **levanta el portal solo**
— está en `.vscode	asks.json`. Si hiciera falta a mano:

```
npm run dev --prefix 04_Web
```

Queda en `http://localhost:4321`. **Se guarda el archivo y la página se
actualiza sola**, sin recargar.

Para verlo al lado del código sin salir del editor: `Ctrl+Shift+P` →
*Simple Browser: Show* → esa dirección. El navegador queda en la mitad derecha.

**Los textos del portal viven en `04_Web\src\pages\*.astro`**, uno por módulo,
en prosa normal. Lo de arriba entre `---` es cálculo; lo de abajo es lo que se
lee en pantalla.

> ⚠️ Si un cambio de estilo no aparece, es el caché de Vite. Se para el
> servidor, se borran `node_modules\.vite` y `.astro`, y se vuelve a arrancar.

*(Antigravity también sirve —es un VS Code por dentro— pero la extensión de
Astro se instala desde otro repositorio de extensiones y no siempre está al día.
Para este proyecto, que es casi todo `.astro`, VS Code va mejor.)*

---

### Cerrar un cambio — los tres pasos, siempre los tres

```
cd 04_Web
npm run verificar                                          # compila y comprueba
npx wrangler pages deploy dist --project-name=plan-operativo-nq
git push origin main                                       # 🔴 no se olvida
```

`npm run verificar` compila y pasa las tres comprobaciones: enlaces rotos,
maquetación y referencias de regla movidas. **Si alguna falla, no se publica.**

> 🔴 **El `git push` va SIEMPRE, decidido por el operador el 07/09/2026.**
> Publicar y enviar a GitHub son cosas distintas y se hacían por separado:
> `wrangler` sube la web compilada a Cloudflare, `git push` sube el código y
> el historial. Durante once commits se publicó el portal sin enviar nada, y
> en GitHub se quedó todo parado en el 03/09. No vuelve a pasar: los tres
> pasos van juntos.

Los envíos se ven en
<https://github.com/kristeb-trader/Trading_Plan/commits/main>.

Detalle completo en `DESPLIEGUE.md`.

### Si los documentos de `01_Plan\` cambian

```
cd 04_Web
node scripts/sync.mjs
```

El portal **no inventa contenido**: lee los documentos del plan y los presenta.
Si el plan cambia, se sincroniza y se vuelve a compilar.

### Reglas que no se saltan

1. **No se inventa metodología.** Todo sale de `01_Plan\`. Si falta, **falta**.
2. **Los documentos de `01_Plan\` no se tocan desde el portal.** Son la base del futuro bot.
3. **Ningún adjetivo es una regla.** Solo ticks, puntos, porcentajes, velas y horas.
4. **Nada de códigos de regla a la vista** fuera del modo técnico.
5. **Nada de textos que hablen del portal, del repositorio o de documentos.** Alfredo viene a leer la estrategia.
6. **Los cuatro huecos declarados se enseñan, no se esconden.**

---

## Para retomar en un chat nuevo

Basta con abrir Claude Code en `E:\Proyectos\Chaumer` y decir qué se quiere
hacer. `CLAUDE.md` se carga solo, y apunta aquí.

Si quieres darle contexto de golpe:

> Lee `CLAUDE.md` y `04_Web\ESTADO_FASE_2.md`. Vamos a seguir con la fase 2.

El historial real y completo está en el repositorio: `git log --oneline`.

**Y lo primero que hay que hacer al terminar una tanda:** actualizar la tabla de
revisión de arriba y, si hubo cambios de fondo, el apartado de historial. Si no
se hace, el siguiente chat empieza a ciegas.
