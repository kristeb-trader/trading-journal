# Orden de la raíz del Journal

| | |
|---|---|
| **Versión** | v1 |
| **Estado** | ✅ Implementado y publicado (29/09/2026) |
| **Precedente** | `2026-09-28-orden-chaumer.md` (D-030): el mismo criterio, aplicado fuera de `chaumer/` |

## 1. Diagnóstico

La raíz está más sana de lo que estaba `chaumer/`: no hay cinco documentos contando el estado. Los problemas:

| # | Qué | Coste |
|---|---|---|
| 1 | `docs/historial-proyecto.md`, 173 KB y 3.012 líneas. Su primer tercio es una foto de mayo: Coach con `claude-sonnet-4-6`, «el repositorio es privado», esquema y carpetas de mayo, «Estado actual» de junio | El documento más caro del proyecto (~45.000 tokens), y acaba con «leer este archivo para contexto completo» |
| 2 | Checkpoints desordenados (31/08 antes que 23/08; 29/09 antes que 28/09), dos con la misma fecha sin sufijo y uno con el formato viejo («Ago 2026 (3)») | Encontrar algo cuesta; el índice no los lista todos |
| 3 | `README.md` dice «Repositorio privado» (es público, D-022) y no nombra el portal, el backtesting ni la cadena diaria | Es lo primero que ve cualquiera |
| 4 | `desktop.ini` (icono de la carpeta en Windows, con ruta `E:\`) e `icons/TJ.ico` en git; el `.ico` se publica en Pages sin que la app lo use | Ruido en el repositorio y en la web |
| 5 | `create-icons.html` en la raíz: generó `icons/` en mayo | Un solo uso |
| 6 | `Otros/` (1 MB, fuera de git): el material con que arrancó el journal; choca con la sección «Otros» de la app | Ruido en la raíz |
| 7 | `TelegramBot/deploy.bat`: el bot se despliega solo con GitHub Actions desde el 21/09 | Obsoleto |
| 8 | `scripts/plan/comparar-*.py` (3): comprobaciones de un solo uso de la reestructuración de reglas (26/09), atadas a commits viejos | Un solo uso |
| 9 | `docs/herramientas/medir-tokens.js`: un script dentro de `docs/` | Mal puesto |
| 10 | `docs/disenos/prompt-reestructuracion.md`: no es un diseño ni lleva fecha | Mal puesto |
| 11 | `.gitignore`: `chaumer/00_Guias/` ya no existe | Regla muerta |
| 12–14 | `INDICE.md` de migraciones («65 archivos», hoy 94); el mapa del `CLAUDE.md` sin `table.js`, `data.js`, `gallery.js`; cifras del código en `backlog.md` de agosto | Pequeñas mentiras |

**Fuera a propósito:** los 19 diseños (son el porqué de cada pantalla y no se cargan solos), las migraciones, `decisiones.md`,
`Disciplina.md`, `metodologia-chaumer.md`, `.claude/rules/`, mover la app a una subcarpeta (toca el service worker y
media docena de rutas por estética) y la deuda del código (D-001, en `backlog.md`). Nada toca `chaumer/01_Plan`, la BD
ni el código de la app.

## 2. Diseño

**F1 · historial.** Lo anterior a la reestructuración documental del 16/08 —la foto de mayo, las fases 1–22, el
«Estado actual» y los checkpoints de junio al 11/08 (con el del 6/08, «Ago 2026 (3)»)— pasa a
`docs/archivo/historial-hasta-2026-08-15.md`, con un aviso de en qué miente y su línea en el `LEEME`. Lo que queda,
del más reciente al más antiguo, con un índice generado de las propias secciones; se renombran «2026-08-31» (Motivos)
→ `2026-08-31b` y «2026-09-24» (Fase 6) → `2026-09-24b`. Sale «Cómo continuar en un nuevo chat», que repite el
`CLAUDE.md`. Ninguna referencia viva apunta a un checkpoint archivado (comprobado).

Los IDs de Cloudflare y del chat de Telegram **no** se tachan: `TelegramBot/wrangler.toml` los necesita para
desplegar y ya son públicos ahí. No son claves.

**F2 · raíz.** `README.md` reescrito. `desktop.ini` e `icons/TJ.ico` salen de git y se ignoran (se quedan en disco:
la carpeta conserva su icono). `create-icons.html`, borrado. `Otros/` → `docs/archivo/inicio-journal/`, ignorada
**antes** de moverla. `.gitignore`: fuera `chaumer/00_Guias/`; `chaumer/**/_Historia/` se queda (existe
`claude/motor/_Historia` en disco).

**F3 · scripts.** Borrados `TelegramBot/deploy.bat` y los tres `comparar-*.py` (las menciones en
`01_Plan/HISTORIAL.md` son historia y siguen siendo verdad: el plan no se toca). `medir-tokens.js` →
`scripts/herramientas/`. `prompt-reestructuracion.md` → `docs/archivo/`.

**F4 · verdades.** Puntos 12–14 y el checkpoint del día.

## 3. Verificación

- F1: cada línea del historial original está en uno de los dos archivos, salvo «Cómo continuar» y los títulos
  renombrados; el índice lista todas las secciones.
- F2–F3: ninguna ruta viva apunta a un archivo borrado o movido; `git check-ignore` confirma lo ignorado antes de
  cualquier `git add`; la publicación del Journal en Actions termina en verde.

## 4. Cómo quedó (29/09/2026)

| Fase | Commit | Verificado |
|---|---|---|
| F1 · historial | `fe793c9` | 0 líneas perdidas contra el original; 21 checkpoints en el índice; 169 KB → 61 KB (+108 KB en el archivo) |
| F2 · raíz | `d6b1061` | `git check-ignore` de `inicio-journal/`, `desktop.ini` y `TJ.ico`; «Publicar Journal» en verde; producción: `index.html` e `icon-192.png` 200, `TJ.ico` y `create-icons.html` 404 |
| F3 · scripts | `82237a5` | ninguna ruta viva a lo movido o borrado; `medir-tokens.js arranque` corre desde `scripts/herramientas/` |
| F4 · verdades | el de este cambio | `INDICE.md`: 86 archivos, todos con su fila (26 MCP + 4 sin registro + 56 previas) |

**Desviaciones:** los IDs de Cloudflare y de Telegram no se tacharon (`wrangler.toml` los publica de todos modos). El
mapa del `CLAUDE.md` gana también `scripts/plan/` y `workers/proxy-ia/`, que faltaban.

**Resultado:** en la raíz, en git, solo quedan la app (`index.html`, `favicon.svg`, `manifest.json`, `sw.js`, `css/`,
`js/`, `icons/`), sus piezas (`NinjaTrader/`, `TelegramBot/`, `workers/`, `scripts/`), `chaumer/`, `docs/`, `tasks/`,
`CLAUDE.md` y `README.md`.
