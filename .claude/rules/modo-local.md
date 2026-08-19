---
paths:
  - "js/dev.local.js"
  - "js/app.js"
---

# Modo local — verificar sin pedir la contraseña

`js/dev.local.js` arranca la app en `localhost` **sin sesión de Supabase**. Existe para que
verificar una pantalla no dependa nunca de que alguien escriba una clave.

| Situación | Qué arranca |
|---|---|
| Hay sesión de Supabase en ese navegador | La app real, con datos en vivo. **La sesión manda siempre** |
| No hay sesión y existe `js/dev.local.js` | Copia local, con banda ámbar arriba |
| No hay sesión y no existe el archivo | Login normal (lo que pasa en producción) |
| `?login` en la URL | Fuerza la pantalla de login — la única forma de entrar si la copia local está disponible |

**El orden importa.** La sesión real tiene prioridad, así que en cuanto alguien inicia
sesión en ese navegador los fixtures quedan dormidos. Y si la sesión caduca, en vez de
quedarse bloqueado se cae al modo local. Por eso **nunca hay que pedirle el login a Kris**:
solo se le menciona si lo que hay que comprobar exige datos frescos **en pantalla** y un
`SELECT` por el MCP no basta.

## Dos cierres para que no exista en producción

1. El archivo está **gitignoreado** (`*.local.js`) y no se despliega.
2. El `hostname` corta la rama antes de intentar cargarlo: en `kristeb-trader.github.io`
   es código muerto.

## Qué contiene

Una **copia de datos reales** tomada con el MCP (trades, sesiones, catálogos, checklist,
fechas). Sus escrituras mutan los arrays en memoria, así que agregar, renombrar, borrar y
reordenar también se pueden probar contra la interfaz.

⚠️ **Es una foto, no un espejo.** Refleja la BD del día en que se tomó. Sirve para
maquetación, interacción y "esta pantalla aguanta datos reales". **No sirve para dar por
bueno un número**: para eso, un `SELECT` por el MCP, que lee lo vivo.

## Cómo se mantiene

- Si una pantalla sale vacía, la consola dice qué falta:
  `[dev.local] sin fixture: DB.getX()`. Se añade esa entrada a `FIXTURES` y ya.
- Si el archivo se pierde o la foto envejece, **se regenera** pidiendo las tablas por el
  MCP y reescribiendo el fixture.
- Los módulos que hablan con `supa` directamente (en vez de pasar por `DB`) los cubre un
  stub de `supa.from` que imita la cadena de PostgREST.
