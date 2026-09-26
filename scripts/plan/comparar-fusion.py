# -*- coding: utf-8 -*-
"""
¿La regla fusionada dice todo lo que decían las que absorbe? (F3 de la reestructuración, 26/09/2026)

    python scripts/plan/comparar-fusion.py R-28 [--ref <commit>]

Lee la regla R-xx de chaumer/01_Plan/reglas/ tal como está ahora, con su fila «Absorbe», y las reglas de
antes —ella misma y las absorbidas— tal como estaban en <ref> (por defecto HEAD, el último commit antes de
la fusión). Cada frase de las de antes tiene que estar en la regla fusionada: tal cual, o con al menos el
85 % de sus palabras (de 4 letras o más). Ignora tildes, mayúsculas y marcas de formato.

Aquí no cuenta el historial: la fusión copia el texto de antes en HISTORIAL.md, y buscar allí daría siempre
verde. Lo que se mide es que la regla nueva conserve cada condición (diseño, §4.4). Las frases que no son una
condición —las citas de una regla absorbida en «Relacionadas», por ejemplo— se revisan a mano: van en
REVISADAS con su motivo. Sale con 1 si queda alguna sin encontrar.
"""
import io, os, re, sys, subprocess, unicodedata
sys.stdout.reconfigure(encoding='utf-8')

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DIR = os.path.join(RAIZ, 'chaumer', '01_Plan', 'reglas')
rid = next(a for a in sys.argv[1:] if re.fullmatch(r'R-\d{2}', a))
ref = sys.argv[sys.argv.index('--ref') + 1] if '--ref' in sys.argv else 'HEAD'

# Fragmentos normalizados que se dan por buenos a mano, con el motivo.
REVISADAS = {
    # R-28 absorbe R-23 y R-34 (plan 3.20), texto aprobado por Kris el 26/09/2026
    'maximo de operaciones por sesion': 'el título de antes; el nombre nuevo lo aprobó Kris',
    'ejecuta como maximo una operacion por sesion': 'la regla nueva: «como máximo OPS_POR_SESION» (1 llenada)',
    'tras la primera orden llenada, no se coloca ninguna orden mas': '«Prohibido después del llenado: colocar otra orden —aunque aparezcan setups válidos—»',
}

def norm(t):
    t = re.sub(r'\*\*|`', '', t)
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    t = re.sub(r'[^\w\s.,;:()¿?¡!=+≤≥<>/%$€·—–-]', ' ', t)
    return re.sub(r'\s+', ' ', t).strip()

VACIAS = set('para como pero esta este esto esos esas estos estas desde hasta sobre entre cuando donde porque sino solo '
             'cada todo toda todos todas otra otro otras otros mismo misma tiene tienen hace hacen puede pueden sigue queda quedan'.split())
palabras = lambda t: {w for w in re.findall(r'[a-z0-9ñ]{4,}', norm(t)) if w not in VACIAS}

def reglas_de(textos):
    """{id: texto} de un conjunto de archivos de grupo."""
    out = {}
    for t in textos:
        partes = re.split(r'^## (R-\d{2})\b', t, flags=re.M)
        for i in range(1, len(partes), 2): out[partes[i]] = partes[i + 1]
    return out

ahora = reglas_de(io.open(os.path.join(DIR, f), encoding='utf-8').read() for f in sorted(os.listdir(DIR)))
if rid not in ahora: sys.exit(f'{rid} no está en reglas/')
m = re.search(r'^\|\s*Absorbe\s*\|\s*(.+?)\s*\|\s*$', ahora[rid], flags=re.M)
absorbe = re.findall(r'R-\d{2}', m.group(1)) if m else []
if not absorbe: sys.exit(f'{rid} no absorbe ninguna regla (falta la fila «Absorbe»)')

archivos = subprocess.check_output(['git', '-C', RAIZ, 'ls-tree', '--name-only', f'{ref}:chaumer/01_Plan/reglas']).decode().split()
antes = reglas_de(subprocess.check_output(['git', '-C', RAIZ, 'show', f'{ref}:chaumer/01_Plan/reglas/{f}']).decode('utf-8')
                  for f in archivos)

nueva = norm(ahora[rid])
p_nueva = palabras(ahora[rid])
total, tal, reesc, rev, faltan = 0, 0, 0, 0, []
for vieja in [rid] + absorbe:
    for linea in antes[vieja].split('\n'):
        if re.match(r'^\s*\|?[\s:|-]+\|?\s*$', linea) or re.match(r'^\s*#', linea): continue
        for trozo in re.split(r'(?<=[.;!?])\s+|\s·\s', linea):
            n = re.sub(r'^[>\-\s|]+', '', norm(trozo))
            if len(n) < 20: continue
            total += 1
            p = palabras(trozo)
            if n in nueva: tal += 1
            elif p and len(p & p_nueva) / len(p) >= 0.85: reesc += 1
            elif any(k in n for k in REVISADAS): rev += 1
            else: faltan.append((vieja, trozo.strip()))

print(f'{rid} absorbe {" · ".join(absorbe)} · frases de antes: {total} · tal cual: {tal} · reescritas (≥85 %): {reesc}'
      f' · revisadas a mano: {rev} · SIN ENCONTRAR: {len(faltan)}')
for v, t in faltan: print(f'   {v} · {t}')
sys.exit(1 if faltan else 0)
