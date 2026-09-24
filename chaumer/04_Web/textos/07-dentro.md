# 07 · Dentro de la operación

> Dirección: `/dentro`
> Corrige el texto libremente. **No borres ni cambies las líneas `<!-- id: … -->`**:
> son las que dicen a qué parte de la página vuelve cada bloque.

<!-- id: cabecera -->

## Dentro de la operación

Qué se hace al llenarse la orden, y qué no se hace nunca

---

<!-- id: llenado -->

### Al llenarse R-31 · R-32

La orden se llenó. Hay dos cosas que hacer, en este orden exacto, y después no hay ninguna más.

> 🖼 **Gráfico.** Texto alternativo: Una operación desde el llenado hasta su resultado, con el stop y el objetivo colocados
> Pie: Desde el llenado hasta el resultado. Colocados el stop y el objetivo, no se vuelve a intervenir.

1. **Primero el stop**, a su nivel estructural.
2. **Después el objetivo**, a la misma distancia al otro lado.

El orden importa. Entre el llenado y este ajuste, la posición corre con el valor por defecto de la ATM — 320 ticks, que son 80 puntos. Ese valor es igual al tope de riesgo justo para que nunca sea más ajustado que el stop real.

---

<!-- id: no-tocar -->

### No se toca nada R-33

Colocados el stop y el objetivo, la operación deja de gestionarse.

> **[NO SE HACE]**
> **Prohibido mover el stop**, en cualquier dirección.
> **Prohibido mover el objetivo**, en cualquier dirección.
> **Prohibido pasar a punto de entrada.**
> **Prohibido cerrar a mano**, también si el precio no se mueve o va en contra.
> **Prohibido cerrar por partes.** Hay un solo contrato: no hay nada que partir.
> **Prohibido añadir contratos.**

Palabras del operador: *«no se toca nada, jamás… Repito, jamás se gestiona»*. Es la única regla del método enunciada como prohibición absoluta y sin una sola excepción.

> **[REGLA DURA]**
> **Esto es lo que convierte cada operación en una medida limpia.** El resultado mide el setup, no la habilidad para gestionar. Si se interviene, deja de saberse qué se estaba midiendo.

---

<!-- id: salidas -->

### Solo hay dos salidas R-30

- **Salida 1** — **El stop.**
- **Salida 2** — **El objetivo.**
- **Cierre por hora** — **No existe.** El fin de la ventana prohíbe abrir, no obliga a cerrar

Si la ventana de dos horas termina con la operación viva, la operación sigue. No hay ninguna acción que se dispare por reloj.

---

<!-- id: cerrar -->

### Al cerrar R-34 · R-28

Terminada la operación, con el resultado que sea:

1. **Se anota en la bitácora:** el setup, la imagen, los errores y las observaciones.
2. **Se cierra NinjaTrader.**

> **[REGLA DURA]**
> **El cupo del día está consumido.** No se coloca ninguna orden más, aunque aparezcan setups perfectamente válidos y quede ventana de sobra.
