# Metodología Chaumer — la estrategia que este journal registra

> Conocimiento de dominio. Vive en el repo (no en la memoria) porque el código que lo
> implementa está aquí y cambian juntos.
>
> El rulebook **operativo y vivo** no es este documento: es la tabla `catalogo_reglas` en
> Supabase, que editas desde la sección **Estrategia**. Esto explica el modelo; la tabla
> manda.

## El modelo del rulebook (`catalogo_reglas`)

1 fila = 1 regla atómica. Aprobado 2026-06-26; la tabla se llamaba `reglas` y se renombró
en jul 2026.

**Tres capas:**

| Capa | Qué contiene |
|---|---|
| `filosofia` | Teoría. Sin reglas operativas |
| `proceso` | Lo operativo, por fases. `setup` = `iri` / `reingreso` / NULL como etiqueta en Fase 2 |
| `riesgo` | Reglas DURAS transversales |

**Campos:** `codigo` (slug estable, UNIQUE, FK desde `sesion_checklist`), `titulo`,
`enunciado`, `capa`, `tipo` (`dura` / `blanda` / `experimental`), `fase` (1/2/3), `setup`,
`es_checklist`, `bloquea_go`, `aplica_si`, `evidencia`, `estado`, `activa`.

**El checklist diario** = las reglas con `es_checklist = true`, filtradas por el setup del
día (la familia del día + las universales, que tienen `setup` NULL). Lo leen la web, el bot
de Telegram y el indicador `ChecklistChaumer` de NT8.

**No duplicar:** el texto de una regla vive en UNA capa; el checklist solo la marca.

**Soft-delete siempre** (`activa = false`), nunca borrado físico: hay historial con FK.

### Las tres familias de tablas de setup

| Tabla | Qué es | Ejemplo |
|---|---|---|
| `catalogo_setups` | La **familia**. Es lo que agrupa las reglas de Fase 2 | `iri`, `reingreso` |
| `catalogo_setup_variantes` | La **variante operativa** concreta | `iri_continuacion_alcista` → "IRI Continuación Alcista" |
| `sesion_checklist` | El estado diario: 1 fila = sesión × regla | — |

Las variantes alimentan los desplegables de la web, el teclado del bot y el AddOn de NT8.

---

## La estrategia

**6 setups.** IRI Apertura Alcista/Bajista · IRI Continuación Alcista/Bajista · Reingreso
Alcista/Bajista.

**IRI = Impulso – Retroceso – Impulso.** Los cuatro IRI comparten reglas; solo cambia el
momento (apertura = ventana de ~20 min **o** 1ª–2ª corrida; continuación = 3ª en adelante) y
la dirección.

### Reglas IRI (Fase 2, `setup='iri'`)

- Contexto y tendencia a favor.
- Estructura I-R-I fluida.
- **Zona gris** (soporte/resistencia) marcada en el alto (si alcista) o el bajo (si bajista)
  del **impulso 1** —cuerpo + mecha—, que es donde inicia el retroceso.
- Impulso 1 **no sobreextendido**: ~5 velas. De 5 a 10 vale si no está sobreextendido.
- Esperar el **rompimiento de la zona** tras el retroceso.
- **Entrada** = orden stop 1 tick sobre el máximo de la vela de rompimiento (1 tick bajo el
  mínimo si es bajista). Eso es la **consecución**.

### Reglas Reingreso (Fase 2, `setup='reingreso'`)

- Segundo intento a una zona importante **+** la consecución del IRI **falla** **+**
  reversión en la zona gris.
- Es **reversión, no tendencia**: la favorabilidad está en que la zona aguante.
- Esperar el **cierre** de la vela de reingreso.
- **Entrada** = 1 tick sobre la vela de reingreso (la vela de consecución).
- Volumen: señal **opcional** — un rompimiento con mucho volumen que no continúa puede
  anticipar un reingreso.

### Reglas DURAS transversales (capa `riesgo`)

| Código | Regla |
|---|---|
| `stop_max_puntos` | Stop ≤ **80 puntos** (distancia entrada → mínimo del retroceso). En PUNTOS, no en dólares: con varios contratos el $ escala. Parametrizable en `objetivos.stop_max_puntos` |
| `rr_1a1` | **R:R siempre 1:1** — el target va a la misma distancia que el stop. **Nunca** mover stop ni target |
| `target_sin_zonas` | Sin zonas vigentes en contra entre la entrada y el target |
| `no_noticia_roja` | Dura, Fase 1. Ventana ±5 min sobre la **entrada**; estar ya dentro de la posición es válido |
| `no_fomc` | Blanda |

> ⚠️ El stop de **80 puntos** es el vigente. Si encuentras "60 puntos" o "$120" en algún
> documento viejo, es de antes de junio de 2026.

---

## Notas

- Temporalidad de trabajo: **1 minuto**.
- La metodología es de **Alfredo Chaumer**; este documento resume cómo la aplica Kris y cómo
  la modela el journal, no la reproduce.
- Cómo se convierte todo esto en un porcentaje de disciplina: `docs/Disciplina.md`.
