# -*- coding: utf-8 -*-
"""
¿Se ha perdido algo al limpiar el glosario, la checklist, los pendientes y el estado? (F2d, 26/09/2026)

    python scripts/plan/comparar-documentos.py [--ref <commit>] [--faltan]

Hermano de comparar-migracion.py (la 2b). Toma cada frase de GLOSARIO.md, CHECKLIST_DIARIA.md, PENDIENTES.md
y ESTADO.md tal como estaban en <ref> (por defecto 8299783, el plan 3.15) y la busca en el plan de ahora:
las reglas, esos cuatro documentos, PARAMETROS.md, CONTEXTUALIZACION.md y HISTORIAL.md. Ignora tildes,
mayúsculas y marcas de formato, y lee los nombres de parámetro como su valor.

Una frase cuenta como conservada si está tal cual, o si al menos el 85 % de sus palabras (de 4 letras o más)
están juntas en UN mismo apartado del plan de ahora (una regla, o una sección de un documento): así una frase
reescrita no se da por buena solo porque sus palabras anden sueltas por el plan. Si no, tiene que estar tal
cual en HISTORIAL.md. Las que se dan por buenas a mano van en REVISADAS, con el motivo.

Sale con 1 si queda alguna sin encontrar ni revisar. --faltan las imprime enteras, agrupadas por apartado.
Es de un solo uso: se conserva como prueba de la 2d.
"""
import io, os, re, sys, subprocess, unicodedata
sys.stdout.reconfigure(encoding='utf-8')

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PLAN = os.path.join(RAIZ, 'chaumer', '01_Plan')
ref = sys.argv[sys.argv.index('--ref') + 1] if '--ref' in sys.argv else '8299783'
git = lambda ruta: subprocess.check_output(['git', '-C', RAIZ, 'show', f'{ref}:chaumer/01_Plan/{ruta}']).decode('utf-8')
leer = lambda ruta: io.open(os.path.join(PLAN, ruta), encoding='utf-8').read()
DOCUMENTOS = ['GLOSARIO.md', 'CHECKLIST_DIARIA.md', 'PENDIENTES.md', 'ESTADO.md']

# Frases que no aparecen tal cual y se han revisado a mano: fragmento normalizado → motivo.
REVISADAS = {
    'no deja de ocupar el sitio (precisado 27/08/2026': 'trozo de la marca «(precisado 27/08/2026 · matizado 18/09/2026)», partido por el «·»; la frase está en el glosario nuevo',
    'reglas sin cerrar y decisiones aplazadas': 'la entradilla de PENDIENTES.md, reescrita',
    'abiertos con la precision del plazo': 'cabecera de sección de la maqueta vieja de PENDIENTES.md; sus pendientes están, cada uno con su fecha',
    'abierto al salir el nq del plan': 'ídem',
    'cerrados el 14/09/2026 por la unificacion del punto de referencia': 'ídem: sus tres pendientes cerrados están en HISTORIAL.md',
}

# Los valores que las frases de antes llevaban escritos y ahora se escriben por nombre.
LITERALES = [
    (r'\b80 (?:puntos|pts)\b', 'STOP_MAX'), (r'\b320 ticks\b', 'ATM_DEFECTO'), (r'\b(?:5|cinco) velas\b', 'PLAZO_CONSECUCION'),
    (r'(?:±|\+/-)\s?5 min(?:utos)?\b', 'VENTANA_NOTICIA'), (r'\b11:29(?::00)? ET\b', 'CANCELACION_FINAL'),
    (r'\b0,25 pts \(1 tick\)', 'TICK'), (r'\b1 tick\b', 'TICK'),
    (r'\b19:00 Col \(apertura de Tokio\)', 'PREMERCADO_INICIO'),
]

def norm(t):
    t = re.sub(r'\*\*', '', t)
    for pat, rep in LITERALES: t = re.sub(pat, rep, t, flags=re.I)
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    t = re.sub(r'[^\w\s.,;:()¿?¡!=+≤≥<>/%$€·—–-]', ' ', t)              # emoji y marcas de formato
    t = re.sub(r'\(\s*(confirmad|precisad|corregid|reescrit|ampliad|anadid|unificad|actualizad|cerrad)[oa]s? [^)]*\)', ' ', t)
    t = re.sub(r'\s+', ' ', t)
    return re.sub(r'\s+([.,;:)])', r'\1', t).replace('( ', '(').strip()

def frases(texto):
    for linea in texto.split('\n'):
        if re.match(r'^\s*\|?[\s:|-]+\|?\s*$', linea): continue           # separadores de tabla
        for trozo in re.split(r'(?<=[.;!?])\s+|\s\|\|?\s|\s·\s', linea):
            n = re.sub(r'^[>\-\s|]+', '', norm(trozo))                    # la marca de cita, viñeta o tabla
            if len(n) >= 30: yield trozo.strip(), n

VACIAS = set('para como pero esta este esto esos esas estos estas desde hasta sobre entre cuando donde porque sino solo '
             'cada todo toda todos todas otra otro otras otros mismo misma tiene tienen hace hacen puede pueden sigue queda quedan'.split())
palabras = lambda t: {w for w in re.findall(r'[a-z0-9ñ]{4,}', norm(t)) if w not in VACIAS}

def apartados(texto, fuente):
    """Parte un documento por sus encabezados: cada apartado es un sitio donde puede haber quedado una frase."""
    trozos = re.split(r'^(?=#{1,4} )', texto, flags=re.M)
    return [(fuente, t) for t in trozos if t.strip()]

# El plan de ahora
ahora = []
for f in sorted(os.listdir(os.path.join(PLAN, 'reglas'))):
    ahora += apartados(leer(os.path.join('reglas', f)), f'reglas/{f}')
for f in DOCUMENTOS + ['PARAMETROS.md', 'CONTEXTUALIZACION.md']:
    ahora += apartados(leer(f), f)
TODO = norm('\n'.join(t for _, t in ahora))
PALABRAS = [palabras(t) for _, t in ahora]
HISTORIAL = norm(leer('HISTORIAL.md'))

def cobertura(original):
    p = palabras(original)
    if not p: return 1.0
    return max(len(p & q) / len(p) for q in PALABRAS)

cuenta = {'tal cual': 0, 'reescritas (≥85 % en un apartado)': 0, 'en el historial': 0, 'revisadas a mano': 0}
faltan, total = [], 0
for doc in DOCUMENTOS:
    seccion = None
    for linea in git(doc).replace('\r\n', '\n').split('\n'):
        m = re.match(r'^#{1,4}\s+(.*)$', linea)
        if m: seccion = m.group(1)
        for original, n in frases(linea):
            total += 1
            if n in TODO: cuenta['tal cual'] += 1
            elif cobertura(original) >= 0.85: cuenta['reescritas (≥85 % en un apartado)'] += 1
            elif n in HISTORIAL: cuenta['en el historial'] += 1
            elif any(k in n for k in REVISADAS): cuenta['revisadas a mano'] += 1
            else: faltan.append((doc, seccion, original))

print(f'Frases de los cuatro documentos en {ref}: {total} · ' + ' · '.join(f'{k}: {v}' for k, v in cuenta.items()) +
      f' · SIN ENCONTRAR: {len(faltan)}')
if '--faltan' in sys.argv:
    actual = None
    for doc, sec, o in faltan:
        if (doc, sec) != actual:
            actual = (doc, sec)
            print(f'\n## {doc} · {sec}')
        print('   · ' + o)
else:
    por = {}
    for doc, sec, o in faltan: por[doc] = por.get(doc, 0) + 1
    for d, n in por.items(): print(f'   {d}: {n}')
sys.exit(1 if faltan else 0)
