# El portal — instrucciones para Claude Code

**Arranca siempre desde esta carpeta (`04_Web`), no desde la raíz.** Aquí está todo lo que necesitas. Las instrucciones generales del proyecto están en `..\CLAUDE.md` y se leen solas: no hace falta que abras nada más de fuera.

**Tu trabajo es el portal.** No tocas el plan. No decides metodología.

---

## 🔴 Lo primero, y lo que más tokens te ahorra

**`src\content\` se regenera sola.** `npm run sync` copia ahí `01_Plan\` entero. Es la copia que debes leer.

| Necesitas… | Abre |
|---|---|
| las reglas | primero `src\content\reglas_indice.md` — una línea por regla — y después **el archivo de grupo** de esa regla en `..\01_Plan\reglas\` (o esa regla en `src\content\reglas.json`, que se genera de ahí) |
| un número (stop, umbral, horario) | `src\content\plan\PARAMETROS.md` |
| una definición | `src\content\plan\GLOSARIO.md` |
| el porqué de una regla | su apartado **«Por qué»**, en la misma regla |
| el texto que se ve en pantalla | `textos\` |
| cómo se ve el portal | `DISENO_PORTAL.md` |
| la bitácora de backtesting | `DISENO_BACKTESTING.md` — el diseño cerrado, y manda sobre el código |

> ⚠️ **El documento maestro (`TRADING_PLAN_CHAUMER.md`) ya no existe** (26/09/2026): cada regla trae su explicación. Su historia está en `..\01_Plan\HISTORIAL.md`, que el portal no enseña.
> ⚠️ **No edites nada de `src\content\`.** Se pisa en la siguiente compilación.
> ⚠️ **No edites nada de `..\01_Plan\` desde una sesión del portal.** El plan se cambia en una sesión del plan, con el sí del operador y en su propio commit `plan:` (`..\CLAUDE.md`, «Quién hace qué»).

---

## Si encuentras algo mal en el plan

**Díselo al operador en ese momento.** No lo corriges tú de paso, aunque sea evidente. Ya pasó una vez y se coló un cambio de metodología que nadie había aprobado. Si se deja para después, va a `tasks/current.md` (raíz del repo).

*(Hasta el 25/09/2026 esto se apuntaba en `PROPUESTAS_AL_PLAN.md`, y el portal tenía su buzón en `PENDIENTE_PORTAL.md`. Los dos están archivados en `docs/archivo/chaumer/`, D-028.)*

---

## Lo que queda abierto en el portal

Lo que está por hacer vive en `tasks/current.md` (raíz del repo). Dos cosas que siguen en pie desde `PENDIENTE_PORTAL.md`:

- **No toques `..\02_Assets\diagramas\` ni el manifiesto que asigna diagramas a reglas.** Los siete diagramas de reglas de agosto se van del portal cuando estén rehechos; hasta entonces, mover archivos es trabajo tirado.
- **No apliques las cuatro fusiones de reglas** (38 → 33). Sin decidir.

---

## El stack, en cuatro líneas

Astro · sin framework de UI · CSS propio en `src\estilos\` (`tokens.css` manda) · Cloudflare Pages con Wrangler · las observaciones de Alfredo van a D1 (`d1\` y `functions\api\`), y se quedan ahí (D-027). **R2 ya no está conectado** (fase 8). La bitácora de backtesting **ya no**: desde el 24/09/2026 vive en Supabase (el Journal) y el portal solo la lee, desde `functions\api\backtesting\`, con la llave `SUPABASE_PORTAL_KEY`.

```
npm run dev          sync + diagramas + servidor local en el 4321
npm run build        lo mismo, compilado
npm run verificar    build + enlaces + maquetación + referencias + vista
```

**`npm run verificar` antes de dar nada por terminado.** Siempre.

---

## Estructura

```
src\pages\          una por vista
src\componentes\    Marco (la plantilla), Modulo, Marca, Observaciones…
src\lib\parsers.mjs   convierte los .md del plan en datos — el archivo delicado
src\estilos\        tokens.css (las variables) + base.css
src\content\        🚫 generado, no tocar
textos\             el texto redactado, para que Alfredo lo corrija
public\conceptos\   los diagramas didácticos (1760×880)
public\assets\      🚫 generado por el sync
scripts\            sync, diagramas, y los verificadores
```

---

## Reglas del portal que no se saltan

1. **Ningún número escrito a mano.** Todo sale de `PARAMETROS.md` o de `reglas.json`. Si ves un número en el HTML, es un error.
2. **Los cuatro huecos declarados NO van al portal** *(decisión del operador, 07/09/2026)*. Siguen abiertos en el plan y ahí quedan escritos; el portal no tiene que enseñarlos, ni a ellos ni a la cifra del backtesting. **Lo único que sigue en pie:** si algún día el portal llegara a mostrar los **−91,00 pts**, los cuatro motivos van en la misma pantalla. Hoy no los muestra, así que no aplica.
3. **Nada de `CONTEXTUALIZACION.md` se convierte en regla.** Son recordatorios de criterio, nunca condiciones automáticas.
4. **El portal no manda órdenes ni se conecta a la cuenta.**
5. **Nunca uses códigos de regla al hablarle al operador.** En la página sí; en el chat no.

---

## Los gráficos del método

**No los generas desde una sesión del portal.** Los diagramas de `public\conceptos\` se hacen en una sesión del plan, siguiendo el estándar visual de `..\CLAUDE.md`, y el operador los revisa mirándolos uno por uno antes de colocarlos. Desde el portal los colocas y los enlazas.

Si uno está mal o falta, díselo al operador con el nombre del archivo y qué le pasa, o apúntalo en `tasks/current.md`.

---

## Para gastar menos

- **`/clear` entre tareas.** Lo que más pesa es arrastrar la conversación anterior.
- **Una tarea por sesión.** Terminas, limpias, empiezas.
- Pide el archivo y la sección; no releas lo que acabas de escribir.
- No listes la carpeta entera: `node_modules\` y `dist\` son 900 entradas.

---

## Publicar

`DESPLIEGUE.md` tiene el detalle. El portal es **privado** hasta que el operador diga lo contrario.
