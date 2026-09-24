# -*- coding: utf-8 -*-
"""
Genera FICHA_MARCADO.md a partir de reglas.json.

NO se escribe a mano. Se genera. Asi la ficha no puede desviarse del plan:
si una regla cambia en reglas.json, se vuelve a correr esto y ya esta.

    python generar_ficha.py

Escribe FICHA_MARCADO.md en esta misma carpeta.
"""
import json, os, datetime

AQUI = os.path.dirname(os.path.abspath(__file__))
REGLAS = os.path.join(AQUI, '..', '..', '01_Plan', 'reglas.json')
PARAMS = os.path.join(AQUI, '..', '..', '01_Plan', 'PARAMETROS.md')
SALIDA = os.path.join(AQUI, 'FICHA_MARCADO.md')

# El orden en que se necesitan al marcar una sesion.
ORDEN = ['perimetro', 'estructura', 'zonas', 'setup', 'riesgo', 'filtros']

def main():
    R = json.load(open(REGLAS, encoding='utf-8'))
    por_cat = {}
    for r in R:
        por_cat.setdefault(r['categoria'], []).append(r)

    out = []
    out.append('# FICHA DE MARCADO — generada automáticamente')
    out.append('')
    out.append(f"> ⚙️ **No editar a mano.** Generada desde `01_Plan/reglas.json` "
               f"el {datetime.date.today().isoformat()} con `generar_ficha.py`.")
    out.append('> Si algo aquí contradice a `reglas.json`, manda `reglas.json` — y vuelve a generar la ficha.')
    out.append('')
    out.append(f"**{len(R)} reglas.** Aquí van sin el porqué ni los ejemplos: solo lo que hay que aplicar.")
    out.append('')

    faltan = [c for c in por_cat if c not in ORDEN]
    for cat in ORDEN + sorted(faltan):
        if cat not in por_cat: continue
        rs = por_cat[cat]
        out.append('---')
        out.append('')
        out.append(f"## {rs[0].get('categoria_nombre', cat)}  ({len(rs)})")
        out.append('')
        sub_actual = None
        for r in rs:
            sub = r.get('subcategoria')
            if sub and sub != sub_actual:
                out.append(f"### — {sub} —")
                out.append('')
                sub_actual = sub
            out.append(f"**`{r['id']}`** · {r['enunciado']}")
            for c in r.get('condiciones', []):
                v, op, val = c.get('variable',''), c.get('operador','='), c.get('valor','')
                op = '' if op == '=' else f" {op}"
                out.append(f"- `{v}`{op} → {val}")
            if r.get('accion'):
                out.append(f"- ▶️ **acción:** {r['accion']}")
            for e in r.get('excepciones', []) or []:
                out.append(f"- ⚠️ **excepción:** {e}")
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
    open(SALIDA, 'w', encoding='utf-8').write(txt)
    print(f'FICHA_MARCADO.md  ·  {len(R)} reglas  ·  {len(txt):,} caracteres')

if __name__ == '__main__':
    main()
