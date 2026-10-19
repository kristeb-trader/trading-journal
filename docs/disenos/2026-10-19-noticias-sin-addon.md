# Noticias rojas desde el Diario, y ChecklistChaumer archivado

| Versión | Fecha | Estado |
|---|---|---|
| v1.0 | 19/10/2026 | Aprobado por Kris en el chat («Sí, dale, implementa el diseño y archiva el AddOn») · implementado |

## La pregunta

Kris deja de usar el AddOn `ChecklistChaumer`: las 2 reglas manuales ya las tiene interiorizadas y el GO
no lo lee nadie (`exigir_go = false`). Pero las **noticias rojas** sí hay que seguir registrándolas, y
**antes de la apertura**: el bot las lee al armarse, y la cadena de las 10:32 las copia para el motor (R-35).

Decisión de Kris (19/10): opción **A** (las noticias, en el Diario) y apagado **limpio**, con el código
**archivado**, no borrado.

## Dónde

**Sesión → Diario → tarjeta «Contexto técnico»** (la ámbar del principio), en el bloque rojo **Noticias
rojas**, que ya existe y se ve aunque la tarjeta esté plegada. No hay pantalla ni sección nueva.

## Cómo queda

Hoy el bloque tiene la lista y el botón «Añadir noticia roja». Se añade **un botón a su lado** y una
línea de estado:

```
┌─ NOTICIAS ROJAS — no se opera ±5 min alrededor de cada una ──────────────┐
│  [ 07:30 ]  [ CPI                                         ]  [ x ]       │
│  [ 09:00 ]  [ ISM servicios                               ]  [ x ]       │
│                                                                          │
│  [ + Añadir noticia roja ]   [ 💾 Guardar noticias ]    ● Sin guardar     │
└──────────────────────────────────────────────────────────────────────────┘
```

- **«Guardar noticias»** (`ti-device-floppy`), con el mismo estilo del botón de añadir. Solo se activa
  cuando hay cambios sin guardar.
- **Estado**, a la derecha y en pequeño:
  - `● Sin guardar` en ámbar (`--warning-txt`) en cuanto se añade, edita o quita una noticia.
  - `✓ Guardadas 07:12` en verde (`--accent-txt`) al guardar.
  - `✕ No se pudo guardar` en rojo (`--red-txt`) si falla, con el botón activo para reintentar.
- En el móvil, los dos botones bajan a dos líneas si no caben, y el estado va debajo.

## Qué hace el botón

1. **Asegura la fila del día en `sesiones`** con solo `sesion_date` (la exige la FK de `sesion_noticias`).
   Va directo a Supabase, **no** por el Worker y **sin** `registrada_at`: guardar las noticias **no**
   cuenta como registrar el día, así que no abre el candado del motor. Es lo mismo que hacía el AddOn.
   Un upsert sin `hora_noticia_roja` no dispara el trigger que borra las noticias.
2. **Guarda la lista visible en `sesion_noticias`** como lo hacía el AddOn:
   - primero **upsert** por (fecha, hora), y luego **borra solo las que quitaste**. Así nunca hay un
     instante con la tabla vacía, y el bot, si lee en ese momento, no ve cero noticias;
   - dos noticias a **la misma hora** se juntan en una fila, con los nombres unidos por « / »
     (UNIQUE fecha + hora: es un evento con una sola ventana).
3. **El «Guardar sesión» del final** sigue guardando las noticias, y pasa a usar esta misma función.
   Hoy borra todas y las vuelve a insertar (`DB.saveNoticias`).

## Lo que no cambia

- La vista del día del calendario, el Coach, el bot y la cadena siguen leyendo `sesion_noticias`.
- Las 2 reglas manuales siguen en el Diario por si se quieren marcar. Si no se marcan, quedan N/A y la
  disciplina de la etapa 2 se mide con las 7 automáticas.

## El AddOn, archivado

- `NinjaTrader/ChecklistChaumer.cs` pasa a `NinjaTrader/archivo/ChecklistChaumer.cs`, con una cabecera
  que diga desde cuándo y por qué está archivado, y que **no se instala**.
- Decisión **D-040** en `docs/decisiones.md`.
- Se quita de las listas de instalación: `NinjaTrader/LEEME.md`, `CLAUDE.md` y
  `.claude/rules/ninjatrader.md`. También se corrigen los comentarios que lo daban por vivo: el Worker
  de Telegram y `.claude/rules/sesion.md`. Sale de `tasks/backlog.md`.
- **En NinjaTrader, Kris**, solo cuando el botón ya esté publicado:
  1. borra `Documentos\NinjaTrader 8\bin\Custom\AddOns\ChecklistChaumer.cs`;
  2. pulsa F5 en el editor de NinjaScript;
  3. si quiere, borra también `Documentos\NinjaTrader 8\checklist-chaumer-config.json`.

  La referencia a Newtonsoft se queda: la usan la cadena y el bot.

## Verificación

1. `node --check` de `js/form.js` y `js/db.js`.
2. Preview del Diario: añadir dos noticias, guardar, quitar una y guardar otra vez, con la consola limpia.
   También en móvil.
3. `SELECT` en `sesion_noticias`: que quede lo que se ve; que dos noticias a la misma hora queden en una
   fila; y que `sesiones.registrada_at` del día **siga en NULL** tras guardar solo las noticias.
