---
paths:
  - "js/form.js"
  - "js/app.js"
  - "index.html"
---

# Sesión Operativa — invariantes

Una pantalla (`section-register`, menú "Sesión") con **3 pestañas** y **una sola fecha**:
**Diario** (`form.js`) · **Coach IA** (`coach.js`) · **Días anteriores**
(`Coach.renderHistorial`). `SesionOperativa` en `app.js` controla pestañas y cabecera.

## Invariantes

- **`Nav.go('coach')` y `Nav.go('historial')` son alias** que abren esta sección y su
  pestaña (`Nav.TAB_ALIAS`). Siguen usándose desde la vista del día — no romperlos.
- **El markup del Coach vive dentro de la sección conservando todos sus ids**: por eso
  `coach.js` funciona sin cambios. Si se mueve, mantener los ids.
- **Nada interactivo dentro de `#sessionFieldset` funciona en modo lectura**: el fieldset se
  deshabilita entero y un control deshabilitado no recibe clics. Lo que deba responder en
  lectura va **fuera** del fieldset o como `role="button"` (así son los desplegables de fase
  del checklist).
- **NO filtrar por `objetivos.cuenta_principal` al mostrar los trades de un día.** La cuenta
  de Apex rota (la -14 pasó a la -15) y filtrar por la de hoy vacía todo el histórico
  anterior. `trades` ya contiene solo la operativa del journal.
- **En lectura no se dibujan los campos vacíos** (`marcarVacios` + `.vacio-en-lectura`). Al
  ocultar un grupo de botones sin opción elegida, comprobar que no arrastre listas: los T/S
  de errores y experimentos llegaron a ocultar sus propias listas.
- **Nunca se muestra sábado ni domingo.** El stepper ‹ › salta el fin de semana (viernes
  ▶ lunes), al abrir en finde se cae al viernes, elegir un finde en el `input type=date`
  lo corrige con aviso, y "Días anteriores" los filtra. No es cosmética: el AddOn de NT8
  crea la fila de `sesiones` con solo abrir la plataforma (la necesita por la FK de
  `sesion_checklist`), así que hay sesiones fantasma de finde, y hay trades de simulación
  en domingo. El criterio es `esDiaHabil` de `db.js` — **no reimplementarlo**: ya se
  perdió una vez, cuando las 3 pestañas se unificaron en una sola fecha y el
  `shiftWeekday` del Coach quedó huérfano sin que nadie lo notara.
- **El diseño aprobado manda.** Vive en `docs/disenos/`. Ya pasó que se implementara otra
  cosa y hubo que rehacerla.

## Al guardar

`upsertSesion` manda el payload al Worker `/api/session`, que lo escribe **TAL CUAL como
columnas de `sesiones`**. Cualquier clave que no sea una columna real revienta el guardado
entero (PGRST204). Las claves de tablas relacionales —hoy `checklist` y `noticiasRojas`—
hay que **sacarlas del destructuring** antes de enviarlo. Ya rompió el guardado una vez
(3 ago).

## Vista del día

El clic en el calendario abre la **vista del día a pantalla completa** (`Modal.openDay` en
`app.js`), no un modal pequeño.

**Pendiente:** un ítem del checklist tumbado por un error se ve igual que uno nunca marcado.
`_checklistDia` ya expone `roto` para distinguirlos ("marcado, pero el diagnóstico lo
desmiente") — falta el render. Ver `tasks/current.md`.
