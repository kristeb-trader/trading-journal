# Mensaje para Claude Code — reorganizar el portal · 06/09/2026

> Pégalo tal cual en Claude Code, abierto desde la raíz `E:\Proyectos\Chaumer`.

---

La documentación del plan cambió hoy. Antes de tocar nada del portal, **vuelve a leer** en este orden:

1. `CLAUDE.md` (raíz)
2. `01_Plan\ESTADO.md` — estrena cabecera: las 38 reglas en una línea, agrupadas por categoría
3. `01_Plan\reglas.json` — **la fuente de verdad**
4. `01_Plan\EQUIVALENCIA_NUMERACION.md`
5. `01_Plan\TRADING_PLAN_CHAUMER.md` — **reorganizado**

## Qué cambió

**1 · El documento maestro ya no va por sub-fases: va por categorías.**
`TRADING_PLAN_CHAUMER.md` pasa a **v3.1**. Su cuerpo es ahora `# 📕 LAS 38 REGLAS, POR CATEGORÍA`, con los siete grupos en el orden en que se usan durante el día, y dentro de cada grupo las reglas por número. El grupo **Zonas** va partido por dos marcas de texto, `**── MARCADO ──**` y `**── VIGENCIA ──**`.

Todo lo que no es una regla —la narrativa de cada sub-fase `F1.x`, los diagramas, las 13 desviaciones respecto al curso y las correcciones del auditor— se movió íntegro a `# 📎 ANEXOS Y NOTAS DE CONSTRUCCIÓN`, al final del documento.

> ⚠️ **Si el portal navega por sub-fases, esa navegación ya no corresponde a nada.** Hay que rehacerla contra las categorías de `reglas.json`.

**2 · Las 38 reglas tienen todas sección propia.**
Siete que hasta hoy vivían solo como fila de tabla —`R-12`, `R-13`, `R-15`, `R-20`, `R-21`, `R-34`, `R-35`— ganaron sección, generada desde `reglas.json`. Si el portal las mostraba vacías o solo con el enunciado, ahora tienen texto largo.

**3 · Ninguna regla cambió.** Siguen siendo **38**. Cero reglas nuevas, cero modificadas.

**4 · El NQ salió del plan (era del 06/09, por si no lo habías recogido).**
Todo se analiza, se marca y se ejecuta en **MNQ**, con **un solo gráfico**. Se limpiaron hoy los sitios donde el NQ sobrevivía como si fuera regla vigente: glosario, parámetros, galería, pendientes y el archivo de sub-fase `F1.0_Perimetro.md`. Lo que queda con NQ es **historia fechada** o el nombre del archivo de datos del backtesting, y no debe mostrarse como regla.

**5 · Cabeceras corregidas.** Varios documentos llevaban meses declarando estados viejos: 33 reglas, 24 reglas, 11 casos en la galería, sub-fases abiertas que están cerradas. Si el portal leía esas cabeceras para pintar contadores, **vuelve a leerlas**. Los números buenos hoy: **38 reglas · 7 categorías · 23 términos en el glosario · 21 casos en la galería · 11 sesiones validadas al tick**.

## Qué quiero que hagas en el portal

1. **Reconstruye la navegación por las siete categorías de `reglas.json`**, usando los campos `categoria`, `categoria_nombre`, `categoria_descripcion`, `categoria_orden` y —solo en zonas— `subcategoria`. **No escribas nombres de categoría a mano.**
2. **Zonas en dos niveles.** Es una sola categoría de 14 reglas, más de un tercio del plan: un filtro que devuelve un tercio no filtra. Dentro, los dos apartados: *marcado* (11) y *vigencia* (3).
3. **Enlaza `R-20` también desde Setup y entrada.** Vive en Zonas, pero define cómo muere una zona **y** cómo se entra.
4. **Revisa los contadores y los textos de estado** contra los números de arriba.
5. **Comprueba que las siete reglas nuevas con sección se muestran con su texto largo.**

## Lo que NO debes hacer

- **No apliques las fusiones de `01_Plan\PROPUESTA_LIMPIEZA_REGLAS.md`.** Son cuatro, llevarían el plan de 38 a 33 reglas, y **el operador no las ha decidido**. Hoy son 38.
- **No edites nada de `01_Plan\`.** Es de solo lectura desde Code. Si encuentras una contradicción o quieres proponer un cambio, escríbelo en `04_Web\PROPUESTAS_AL_PLAN.md` y avisa.
- **No inventes metodología.** Si algo falta, falta.
- **No escondas los cuatro huecos declarados** — test ciego no ejecutado, sin regla de parada, sin capa de contextualización, y las cifras del backtesting que no miden la estrategia. Si el portal muestra los −91,00 pts, los cuatro motivos van **en la misma pantalla**.

## Al terminar

Haz commit y dime qué pantallas tocaste y cuáles quedaron rotas por el cambio de estructura.
