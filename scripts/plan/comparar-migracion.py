# -*- coding: utf-8 -*-
"""
¿Se ha perdido algo al pasar el plan a los siete archivos de reglas? (F2b, 26/09/2026)

    python scripts/plan/comparar-migracion.py [--ref <commit>]

Toma cada frase del plan de antes —TRADING_PLAN_CHAUMER.md y reglas.json, leídos de git en
<ref> (por defecto 1100b6d, el último commit que lo tiene)— y la busca en el plan de ahora: reglas/*.md, HISTORIAL.md y
ESTADO.md. La comparación ignora tildes, mayúsculas y marcas de formato, y lee los
nombres de parámetro como su valor (`STOP_MAX` = «80 puntos»).

Una frase que no aparece tal cual puede estar bien —reescrita, o fundida con otra—: por
eso las que se dan por buenas a mano van en REVISADAS, con el motivo. Sale con 1 si queda
alguna sin encontrar ni revisar. Es de un solo uso: se conserva como prueba de la migración.
"""
import io, os, re, sys, json, subprocess, unicodedata
sys.stdout.reconfigure(encoding='utf-8')

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PLAN = os.path.join(RAIZ, 'chaumer', '01_Plan')
# Por defecto, el último commit con el plan de antes: después, el documento maestro ya no existe.
ref = sys.argv[sys.argv.index('--ref') + 1] if '--ref' in sys.argv else '1100b6d'
git = lambda ruta: subprocess.check_output(['git', '-C', RAIZ, 'show', f'{ref}:chaumer/01_Plan/{ruta}']).decode('utf-8')

VALORES = {'STOP_MAX': '80 puntos', 'ATM_DEFECTO': '320 ticks', 'PLAZO_CONSECUCION': '5 velas',
           'VENTANA_NOTICIA': '±5 minutos', 'CANCELACION_FINAL': '11:29 ET'}

# Frases que no aparecen tal cual y se han revisado a mano: fragmento normalizado → motivo.
REVISADAS = {
    'tratamiento_visual_zona_invalida': 'nombre de variable de la tabla de R-21; su contenido («se conserva dibujada en tono muy tenue») está en la regla',
    'relacion_con_los_otros_filtros': 'nombre de variable de la tabla de R-41; su contenido («va junto al de zonas vigentes, los dos tienen que pasar») está en la regla',
}

# «`STOP_MAX` = 80 puntos» y «80 puntos» se escriben ahora `STOP_MAX`: los dos lados pasan por aquí.
LITERALES = [
    (r'`?STOP_MAX`?\s*=\s*\**80 puntos\**', 'STOP_MAX'), (r'`?ATM_DEFECTO`?\s*=\s*\**320 ticks\**', 'ATM_DEFECTO'),
    (r'\b80 (?:puntos|pts)\b', 'STOP_MAX'), (r'\b320 ticks\b', 'ATM_DEFECTO'), (r'\b5 velas\b', 'PLAZO_CONSECUCION'),
    (r'(?:±|\+/-)\s?5 minutos', 'VENTANA_NOTICIA'), (r'\b11:29(?::00)? ET\b', 'CANCELACION_FINAL'),
]
# Las etiquetas de la ficha vieja de cada regla: la plantilla nueva las sustituye.
ETIQUETAS = r'^\s*-\s*\*\*(?:Categoría|Enunciado|Estado|Excepciones)\s*:?\*\*\s*:?\s*'

def norm(t):
    t = re.sub(ETIQUETAS, '', t)
    t = re.sub(r'\*\*', '', t)
    for pat, rep in LITERALES: t = re.sub(pat, rep, t)
    t = re.sub(r'`?(STOP_MAX|ATM_DEFECTO|PLAZO_CONSECUCION|VENTANA_NOTICIA|CANCELACION_FINAL)`?\s*\(`?\1`?\)', r'\1', t)
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    t = re.sub(r'[^\w\s.,;:()¿?¡!=+≤≥<>/%$€·—–-]', ' ', t)             # emoji y marcas de formato
    t = re.sub(r'\(\s*(confirmad|precisad|corregid|reescrit|ampliad|anadid|unificad|actualizad|cerrad)[oa]s? [^)]*\)', ' ', t)
    t = re.sub(r'\s+', ' ', t)
    return re.sub(r'\s+([.,;:)])', r'\1', t).replace('( ', '(').strip()

def frases(texto):
    for linea in texto.split('\n'):
        if re.match(r'^\s*\|?[\s:|-]+\|?\s*$', linea): continue          # separadores de tabla
        for trozo in re.split(r'(?<=[.;!?])\s+|\s\|\|?\s|\s·\s', linea):
            n = re.sub(r'^[>\-\s]+', '', norm(trozo))                   # la marca de cita o de viñeta
            if len(n) >= 30: yield trozo.strip(), n

# El plan de antes
antes = [('TRADING_PLAN_CHAUMER.md', git('TRADING_PLAN_CHAUMER.md'))]
reglas = json.loads(git('reglas.json'))
for r in reglas:
    campos = [r.get('enunciado'), r.get('accion'), r.get('nota'), r.get('estado'), r.get('pendiente'), r.get('fuente')]
    campos += [c.get('valor') for c in r.get('condiciones', [])] + list(r.get('excepciones') or [])
    antes.append((f"reglas.json {r['id']}", '\n'.join(str(x) for x in campos if x)))

# El plan de ahora: el texto de cada regla, y lo demás
dir_reglas = os.path.join(PLAN, 'reglas')
reglas_ahora = {}
for f in sorted(os.listdir(dir_reglas)):
    partes = re.split(r'^## (R-\d{2})\b', io.open(os.path.join(dir_reglas, f), encoding='utf-8').read(), flags=re.M)
    reglas_ahora['_' + f] = partes[0]
    for i in range(1, len(partes), 2): reglas_ahora[partes[i]] = partes[i + 1]
REGLAS = norm(''.join(reglas_ahora.values()) + io.open(os.path.join(PLAN, 'ESTADO.md'), encoding='utf-8').read())
HISTORIAL = norm(io.open(os.path.join(PLAN, 'HISTORIAL.md'), encoding='utf-8').read())

# Una frase reescrita cuenta como conservada si al menos el 85 % de sus palabras (de 4 letras o más) siguen en su
# regla —o, si pasó a otra, en el conjunto de las reglas—. Por debajo, tiene que estar tal cual en el historial.
VACIAS = set('para como pero esta este esto esos esas estos estas desde hasta sobre entre cuando donde porque sino solo '
             'cada todo toda todos todas otra otro otras otros mismo misma tiene tienen hace hacen puede pueden sigue queda quedan'.split())
palabras = lambda t: {w for w in re.findall(r'[a-z0-9ñ]{4,}', norm(t)) if w not in VACIAS}
TODAS = palabras(''.join(reglas_ahora.values()))
def cobertura(original, rid):
    p = palabras(original)
    if not p: return 1.0
    suya = len(p & palabras(reglas_ahora.get(rid, ''))) / len(p) if rid else 0
    return max(suya, len(p & TODAS) / len(p))

# De qué regla es cada frase del documento maestro
def con_regla(fuente, texto):
    if not fuente.startswith('TRADING_PLAN'):
        rid = fuente.split()[-1]
        for o, n in frases(texto): yield rid, o, n
        return
    actual, nivel = None, 9
    for linea in texto.split('\n'):
        m = re.match(r'^(#{1,6}) (.*)$', linea)
        if m:
            rid = re.match(r'^[^\w]*(R-\d{2})\b', m.group(2))
            if rid and len(m.group(1)) in (2, 3): actual, nivel = rid.group(1), len(m.group(1))
            elif len(m.group(1)) <= nivel: actual, nivel = None, 9
        for o, n in frases(linea): yield actual, o, n

cuenta = {'tal cual en las reglas': 0, 'reescritas (≥85 %)': 0, 'en el historial': 0, 'revisadas a mano': 0}
faltan, total = [], 0
for fuente, texto in antes:
    for rid, original, n in con_regla(fuente, texto):
        total += 1
        if n in REGLAS: cuenta['tal cual en las reglas'] += 1
        elif cobertura(original, rid) >= 0.85: cuenta['reescritas (≥85 %)'] += 1
        elif n in HISTORIAL: cuenta['en el historial'] += 1
        elif any(k in n for k in REVISADAS): cuenta['revisadas a mano'] += 1
        else: faltan.append((fuente, original))

print(f'Frases del plan de antes ({ref}): {total} · ' + ' · '.join(f'{k}: {v}' for k, v in cuenta.items()) +
      f' · SIN ENCONTRAR: {len(faltan)}')
por_fuente = {}
for f, o in faltan: por_fuente.setdefault(f, []).append(o)
for f, os_ in por_fuente.items():
    print(f'\n{f} ({len(os_)})')
    for o in os_: print('   · ' + o[:200])
sys.exit(1 if faltan else 0)
