---
paths:
  - "index.html"
  - "sw.js"
  - ".github/workflows/publicar-journal.yml"
---

# Publicar un archivo nuevo de la app

Dos listas a mano que se olvidan, y las dos fallan en silencio:

- **Un archivo nuevo fuera de `js/`, `css/` o `icons/`** → añadirlo al `cp` de
  `.github/workflows/publicar-journal.yml`. Si no, da 404 en producción: GitHub Pages solo
  publica lo que copia ese paso (fase 1 de la unificación Chaumer).
- **Un `<script>` nuevo en `index.html`** → añadirlo también a `APP_SHELL` en `sw.js` y subir
  `CACHE`. Si no, ese archivo falta en la primera visita sin conexión (arreglado el 16 ago:
  `APP_SHELL` no se usaba y listaba un archivo que ya no existía).
