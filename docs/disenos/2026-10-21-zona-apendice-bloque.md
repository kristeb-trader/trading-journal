# La apéndice del retroceso y el bloque de zonas

| Versión | Fecha | Estado |
|---|---|---|
| v0.1 | 21/10/2026 | **En estudio.** Queda una duda abierta (§4). **No se toca el plan, ni el motor, ni el bot** hasta cerrarla con el sí de Kris |

## 1 · La pregunta

21/10/2026. El soporte de la vela 08:34 (29.847,00 – 29.825,75) lo rompe la vela 08:38 y la 08:40 hace la consecución.
Esa misma vela de las 08:40 se da la vuelta y arma estructura nueva. Hoy el motor **estira** el soporte hasta el mínimo
de las 08:40 y le deja contado el traspaso, así que a las 08:48 lo da por inválido. Kris lo lee de otra forma: nace una
**zona apéndice**, hija del soporte, y las zonas forman un **bloque**.

Las respuestas de Kris salieron de dibujos con velas inventadas (soporte de 100 a 110) y del gráfico real del 21/10.
Los dibujos no se guardan en el repositorio, pero cada caso se puede volver a dibujar con lo que dice §3.

## 2 · Lo decidido

1. **Con consecución y estructura nueva, nace una apéndice en lugar de estirar la zona.** Es la zona normal de la vela
   (del borde del cuerpo a la punta de la mecha), **recortada en el borde de la zona madre**: dos zonas nunca se montan
   una encima de otra. Si la vela abrió dentro de la zona madre, la apéndice empieza en el borde de la madre; si cerró
   fuera, empieza en su cierre.
2. **Sin consecución no cambia nada**, aunque el precio suba: se espera a las 5 velas o a la estructura contraria. Con
   mecha, la zona se estira; con cuerpo fuera, nace la apéndice de siempre, desde el cierre.
3. **Madre y apéndices (hijas, nietas) forman un bloque**: se dibujan por separado, pero se rompen juntas.
4. **Para entrar hay que romper el borde exterior del bloque**, la última apéndice. Romper solo la madre no da entrada:
   *«sería incorrecto entrar en la zona 1, sabiendo que tiene la zona apéndice en contra»*.
5. **Un bloque muere** cuando se rompe, con rompimiento y consecución, primero por un borde exterior y después por el
   otro. El 21/10: debajo de la apéndice 2 como soporte, y después encima de la Zona 1 como resistencia.
6. **Las apéndices de siempre** (rompimiento con cuerpo sin consecución) también forman bloque con su madre.
7. **Una caída con cuerpo por debajo del bloque anula un rompimiento hacia arriba** que esperaba su consecución
   (21/10, la vela 08:44 anula el rompimiento hacia arriba de las 08:40).
8. Vale igual en espejo para las resistencias.

## 3 · Los casos revisados por Kris

Soporte de 100 a 110 en todos los inventados.

| Caso | Qué pasa | Lo que dijo Kris |
|---|---|---|
| 1 | v5 rompe (mín. 97), v6 abre dentro (101), baja a 94 (consecución) y sube por encima de v5 | Bien: nace la apéndice 100→94. **Además, la Zona 1 queda inválida** porque tiene traspaso en los dos sentidos |
| 2 | v5 rompe, v6 consecución (92) y cierra fuera (95), v7 sube | Bien: nace la zona 95→92. La Zona 1 queda inválida (v7 rompe arriba, v8 consecución) y **solo queda activa la 95→92** |
| 3 | v5 rompe solo con mecha (96), sin consecución, y el precio sube | **Mal la apéndice**: sin consecución, a las 5 velas o con estructura nueva la zona **se estira** |
| 4 | v5 rompe con cuerpo (cierra 99), sin consecución, y el precio sube | **Mal la apéndice en ese momento**: a las 5 velas o con estructura nueva nace la zona 99→96 |
| 5 | Rompe sin consecución y el precio no sube | Bien: con mecha se estira; con cuerpo, apéndice desde el cierre |
| 6 | Bloque de soporte 100–110 y apéndice 96–100 | Para que mueran las dos, hay que traspasar las dos zonas en los dos sentidos |
| 7 | El precio rompe el soporte, pero queda la apéndice | Hay que romper todo el bloque para entrar |
| 21/10 | Zona 1 (8:34), apéndice 1 de 29.825,75 a 29.813,50 (8:40) y apéndice 2 de 29.779,25 a 29.771,25 (vela 8:44, nace a las 8:49 por plazo, cuerpo sin consecución) | Las **tres activas**, en bloque. Mueren cuando se rompa la apéndice 2 como soporte y después la Zona 1 como resistencia |

## 4 · La duda abierta

**¿Cuándo muere una zona sola por sus traspasos y cuándo espera al bloque?**

- En los **casos 1 y 2** la Zona 1 muere **sola** en cuanto tiene sus dos traspasos, aunque tenga apéndice.
- El **21/10** la Zona 1 también tiene sus dos traspasos: abajo a las 08:38–08:40 y arriba con el rompimiento de las 08:46
  (29.873,00) y la consecución de las 08:48 (29.903,25). **Y no muere**: espera al bloque. La apéndice 2 nace a las
  08:49, después de esos dos traspasos.

Mientras no se sepa qué distingue un caso del otro, vela a vela, la regla no se puede escribir sin inventar metodología.
Kris puede consultarlo con Chaumer.

## 5 · Cuando se cierre

Igual que el plan 3.49: el texto del plan con el sí de Kris, cambio a cambio, con fecha de vigencia y sin rectificar lo
anterior. Antes de tocar el bot, la regla nueva se pasa **en una copia aparte** por todos los días con datos, y se le
enseñan a Kris en imágenes los días que cambian. Solo con su visto bueno se cambian a la vez `lector.py` y
`MotorChaumer.cs`, con el sello a 0 diferencias. Antes de empezar se marca en git la versión del bot que funciona hoy.
