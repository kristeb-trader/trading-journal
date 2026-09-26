# -*- coding: utf-8 -*-
"""
Genera FICHA_MARCADO.md a partir de reglas.json.

NO se escribe a mano. Se genera. Asi la ficha no puede desviarse del plan:
si una regla cambia, se regenera reglas.json (node scripts/plan/leer-reglas.mjs
--escribir, desde la raiz del repositorio), se vuelve a correr esto y ya esta.

    python generar_ficha.py

Escribe FICHA_MARCADO.md en esta misma carpeta. Desde el 26/09/2026 las reglas
viven en 01_Plan/reglas/ (siete archivos de grupo) y reglas.json es su version
generada: de cada regla, la ficha lleva lo que hay que aplicar —la regla, como se
aplica, si no se cumple y las excepciones—, sin el porque ni los casos.
"""
import json, os, datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
REGLAS = os.path.join(AQUI, '..', '..', '01_Plan', 'reglas.json')
PARAMS = os.path.join(AQUI, '..', '..', '01_Plan', 'PARAMETROS.md')
SALIDA = os.path.join(AQUI, 'FICHA_MARCADO.md')


def main():
    datos = json.load(open(REGLAS, encoding='utf-8'))
    R = datos['reglas']
    grupos = sorted(datos['grupos'], key=lambda g: g['orden'])

    out = []
    out.append('# FICHA DE MARCADO — generada automáticamente')
    out.append('')
    out.append(f"> ⚙️ **No editar a mano.** Generada desde `01_Plan/reglas.json` "
               f"el {datetime.date.today().isoformat()} con `generar_ficha.py`.")
    out.append('> Si algo aquí contradice a las reglas (`01_Plan/reglas/`), mandan las reglas — y se vuelve a generar la ficha.')
    out.append('> Los nombres en `MAYÚSCULAS_CON_GUION` son parámetros: su valor está al final, en `PARAMETROS.md`.')
    out.append('')
    out.append(f"**{len(R)} reglas.** Aquí van sin el porqué ni los ejemplos: solo lo que hay que aplicar.")
    out.append('')

    for g in grupos:
        rs = [r for r in R if r['grupo'] == g['id']]
        if not rs: continue
        out.append('---')
        out.append('')
        out.append(f"## {g['nombre']}  ({len(rs)})")
        out.append('')
        apartado = None
        for r in rs:
            if r.get('apartado') and r['apartado'] != apartado:
                apartado = r['apartado']
                out.append(f"### — {apartado.lower()} —")
                out.append('')
            out.append(f"#### `{r['id']}` · {r['nombre']}")
            out.append('')
            out.append(r['regla'])
            out.append('')
            for titulo, clave in (('Cómo se aplica', 'como_se_aplica'), ('Si no se cumple', 'si_no_se_cumple'),
                                  ('⚠️ Excepciones', 'excepciones')):
                if r.get(clave):
                    out.append(f"**{titulo}**")
                    out.append('')
                    out.append(r[clave].strip())
                    out.append('')

    # Parametros, tal cual estan escritos
    if os.path.exists(PARAMS):
        out.append('---')
        out.append('')
        out.append('## Parámetros (copiados de `PARAMETROS.md`)')
        out.append('')
        out.append('```')
        out.append(open(PARAMS, encoding='utf-8').read().strip())
        out.append('```')

    txt = '\n'.join(out) + '\n'
    open(SALIDA, 'w', encoding='utf-8', newline='\n').write(txt)
    print(f'FICHA_MARCADO.md  ·  {len(R)} reglas  ·  {len(txt):,} caracteres')


if __name__ == '__main__':
    main()
