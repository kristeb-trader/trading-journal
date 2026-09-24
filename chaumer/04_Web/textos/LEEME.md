# Los textos del portal, para corregirlos de una vez

Aquí está **todo el texto que se ve** en la portada y en los ocho módulos,
sacado de la página ya compilada. Es exactamente lo que lee Alfredo.

## Cómo se usa

1. **Corrige los nueve archivos** con el editor que quieras. Sin prisa y sin
   pedir nada por el chat.
2. Cuando termines, dime **«ya están los textos corregidos»**.
3. Yo los leo de aquí y los aplico al portal.

## Las dos reglas

**No borres las líneas `<!-- id: … -->`.** Son las que dicen a qué parte de la
página vuelve cada bloque. Si desaparecen, hay que buscar a mano dónde iba
cada cosa.

**Los números y las horas, déjalos como están** si solo quieres cambiar la
redacción. Muchos no están escritos en la página: se leen de `PARAMETROS.md`.
Si de verdad quieres cambiar un valor —el tope de stop, el umbral de volumen,
una hora— **dímelo aparte**, porque eso no es corregir un texto: es cambiar el
plan, y se cambia en `01_Plan\`.

## Tres marcadores que puedes usar

| Marcador | Para qué |
|---|---|
| `<!-- id: … -->` | ya viene puesto. **No lo toques**: dice a qué bloque de la página vuelve el texto |
| `[IMAGEN: descripción]` | pides una imagen nueva ahí. Escríbelo donde quieras que aparezca, y cuando me avises adjúntame también el archivo (PNG o JPG) con un nombre que se entienda. Si son varias, numéralas: `[IMAGEN 1: ...]`, `[IMAGEN 2: ...]` |
| `[NOTA: comentario]` | una anotación para mí — dudas, algo que revisar, contexto. **No se sube a la página**: la leo y la tengo en cuenta, pero nunca se publica como si fuera texto de Alfredo |

## Qué NO está aquí, y por qué

| | |
|---|---|
| Los códigos de regla (`R-22`, `P-14`…) | son del modo técnico, no se corrigen |
| El menú, la ruta de apartados y el pie | no son contenido |
| Los títulos de los gráficos | van dentro de la imagen: se cambian regenerándola |

## Los archivos

| Archivo | Página |
|---|---|
| `00-portada.md` | la portada |
| `01-premercado.md` | Premercado |
| `02-zonas.md` | Marcación de zonas |
| `03-setups.md` | Setups operativos |
| `04-jornada.md` | Jornada operativa |
| `05-entrada.md` | Mecánica de entrada |
| `06-filtros.md` | Cuándo NO se entra |
| `07-dentro.md` | Dentro de la operación |
| `08-riesgo.md` | Riesgo y tamaño |

Unas **7.150 palabras** en total.

## Para volver a generarlos

Si la página cambia y quieres los textos otra vez al día:

```
cd 04_Web
npm run build
node scripts/textos.mjs
```

> ⚠️ **Ojo:** volver a generarlos **pisa tus correcciones**. Hazlo solo cuando
> los cambios ya estén aplicados en el portal.
