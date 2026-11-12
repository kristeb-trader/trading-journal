# -*- coding: utf-8 -*-
"""
TU OPERACIÓN, MEDIDA CON EL MOTOR (02/10/2026 · ruta A de D-034: «el motor mide, el Coach juzga»).

El Coach medía a ojo sobre la imagen la operación de Kris; el motor medía la suya con las velas
exactas, y nadie comparaba las dos. Esto pone la operación de Kris al lado de lo que marcó el motor,
con números, para que el Coach no tenga que adivinar ni preguntar.

NO AÑADE REGLAS (chaumer/CLAUDE.md, regla 1). Solo usa lo que el motor ya aplica a su propia
operación —el objetivo libre de zonas vigentes (`lector._libre`), el stop máximo (`lector.STOP_MAX`),
la ventana de la noticia roja (`lector._noticia`)— y los eventos que el propio motor anotó a esa
hora. Lo que no se puede deducir se queda en None: el Coach dice «no se puede saber».

El stop y el objetivo de Kris no están en la tabla de trades: se deducen de la salida y del 1:1 del
plan. Si salió por stop, la salida es el stop; si salió por objetivo, la salida es el objetivo. Una
salida a mano (BE o sin resultado) no permite deducir ninguno de los dos.
"""
import re, json, hashlib
import lector

COINCIDE_VELAS = 2      # la operación del motor «es la misma» si llena a ±2 velas y en el mismo sentido
EVENTOS_ANTES = 15      # minutos de eventos del motor antes de la entrada de Kris
# Sube cuando cambia lo que se mide: entra en la huella y obliga a medir de nuevo las fichas ya hechas.
# 2 (10/11/2026): el juicio de cada operación («¿cumplía las reglas?») y los contratos.
# 3 (12/11/2026): el juicio solo mira las reglas de SU entrada; nada se compara con la operación del bot.
MEDIR_VERSION = 3

# ── El juicio: ¿tu trade cumplía las reglas? (10/11/2026, docs/disenos/2026-11-10-disciplina-reglas.md) ──
# Solo las reglas de la entrada de Kris (12/11, D-053): NO se compara con la operación del bot —ni
# para dar por bueno un trade que coincide con ella—. Tampoco añade reglas: lee lo que ya mide esta
# medición y lo que el motor decidió en la vela de la entrada para ESE setup. Los motivos del motor se
# reconocen por su frase (lector.py); uno que no case va a 'otra' con su texto, no se pierde. Si
# lector.py cambia sus frases, se revisa esta tabla.
MOTIVOS = [
    (r'riesgo ([\d.]+) pts', 'stop_max'),
    (r'pasa del punto de referencia', 'punto_referencia'),
    (r'choca con', 'objetivo_zona'),
    (r'primer IRI', 'primer_iri'),
    (r'sin consecución', 'consecucion'),
    (r'retroceso se pasó|no la rompió|no es fluida|rompimiento directo', 'fluidez'),
    (r'día de Fed', 'fed'),
    (r'zona de premercado', 'premercado'),
]
TEXTO = {
    'punto_referencia': 'el objetivo pasaba del punto de referencia',
    'objetivo_zona': 'el objetivo chocaba con una zona',
    'primer_iri': 'primer IRI tras un movimiento contrario: el plan espera el segundo',
    'consecucion': 'sin consecución',
    'fluidez': 'la corrida no era fluida',
    'fed': 'continuación en día de Fed',
    'premercado': 'rompimiento de una zona de premercado: sin continuación',
}


def _minutos_hhmm(h):
    a, b = str(h).split(':')[:2]
    return int(a) * 60 + int(b)


def _r(x): return None if x is None else round(x, 2)


def huella_trades(trades):
    """Cambia si cambia algo de los trades del día que entre en la medición."""
    claves = ('market_pos', 'entry_time', 'exit_time', 'entry_price', 'exit_price', 'resultado', 'qty')
    filas = sorted(json.dumps({k: str(t.get(k)) for k in claves}, sort_keys=True) for t in trades)
    filas.append(f'medir v{MEDIR_VERSION}')
    return hashlib.sha256('\n'.join(filas).encode('utf-8')).hexdigest()[:16]


def _usd_punto(tr): return 2 if re.match(r'\s*MNQ', str(tr.get('instrument') or 'MNQ'), re.I) else 20


def juicio(op, i, tr):
    """¿La operación cumplía las reglas? → {cumple, regla, texto}. i = su orden en el día (0 = la primera).
    La primera comprobación que salta manda: lo medido por esta medición, y después lo que decidió el motor
    para su setup en la vela de la entrada (entre 2 minutos antes y la del llenado, en el mismo sentido)."""
    def mal(regla, texto): return {'cumple': False, 'regla': regla, 'texto': texto}
    riesgo = op.get('riesgo')
    if i > 0: return mal('una_operacion', 'segunda operación del día')
    if riesgo is not None and riesgo > lector.STOP_MAX:
        return mal('stop_max', f'stop de {riesgo:.0f} pts (el máximo son {lector.STOP_MAX:.0f})')
    if op.get('en_ventana') is False: return mal('ventana', 'fuera de la ventana 09:30–11:30 ET')
    if op.get('noticia_cerca'): return mal('noticia', f"en la ventana de la noticia de las {op['noticia_cerca']}")
    if op.get('objetivo_libre') is False: return mal('objetivo_zona', TEXTO['objetivo_zona'])

    m = _minutos_hhmm(op['hora'])
    hallado = None
    for l in op.get('eventos_motor') or []:
        mm = re.match(r'\s*(\d{1,2}):(\d{2})\s+(.*)', l)
        if not mm or not (m - 2 <= int(mm[1]) * 60 + int(mm[2]) <= m + 1): continue
        txt = mm[3]
        sentido = ('alcista' if re.search(r'alcista|rompimiento de R ', txt) else
                   'bajista' if re.search(r'bajista|rompimiento de S ', txt) else None)
        if sentido != op['sentido']: continue
        if '✓ orden enviada' in txt:
            # Los contratos que caben en el riesgo máximo, con el stop que el plan da a SU setup (el
            # deslizamiento de la salida no cuela falsos fallos); sin él, con el suyo.
            g = re.search(r'riesgo ([\d.]+)', txt)
            r_c = float(g[1]) if g else riesgo
            qty = int(tr.get('qty') or 0) if tr else 0
            caben = int(float(lector.RIESGO_MAX) // (r_c * _usd_punto(tr))) if r_c and qty else None
            hallado = (mal('contratos', f'{qty} contratos (cabían {caben})') if caben is not None and qty > caben
                       else {'cumple': True, 'regla': None, 'texto': 'setup válido del plan'})
        elif '✗' in txt:
            motivo = txt.split('✗', 1)[1].strip(' —')
            for patron, regla in MOTIVOS:
                g = re.search(patron, motivo)
                if not g: continue
                if regla == 'stop_max':   # el stop del plan, no el suyo (el suyo ya pasó la regla 2)
                    hallado = mal(regla, f'con el stop del plan ({float(g[1]):.0f} pts) pasaba de {lector.STOP_MAX:.0f}')
                else:
                    hallado = mal(regla, TEXTO[regla])
                break
            else:
                hallado = mal('otra', motivo[:120])
    return hallado or mal('sin_setup', 'el motor no veía ningún setup a esa hora')


def _eventos_cerca(ev, desde, hasta):
    out = []
    for l in ev:
        m = re.match(r'\s*(\d{1,2}):(\d{2})\s', l)
        if m and desde <= int(m[1]) * 60 + int(m[2]) <= hasta: out.append(l.strip())
    return out[-8:]


def medir(r, ev, t, trades, dia):
    """r, ev, t: lo que devuelven lector.leer_sesion y lector.detectar_setups ese día.
    trades: las filas de `trades` del día. dia: 'AAAAMMDD'. Devuelve la lista de operaciones medidas."""
    D, Z = r['D'], r['Z']
    por_minuto = {lector._minutos(k): i for i, k in enumerate(D)}
    ops = []
    for tr in sorted(trades, key=lambda x: str(x.get('entry_time') or '')):
        if not tr.get('entry_time') or tr.get('entry_price') is None: continue
        nd = -1 if re.search(r'short|sell', str(tr.get('market_pos') or ''), re.I) else 1
        e = float(tr['entry_price'])
        x = float(tr['exit_price']) if tr.get('exit_price') is not None else None
        res = (tr.get('resultado') or '').lower() or None
        m_ent = _minutos_hhmm(tr['entry_time'])
        # La vela del llenado es la que CIERRA en el minuto siguiente: NinjaTrader y el motor
        # etiquetan cada vela por su hora de cierre (08:47:05 → la vela de las 8:48).
        i_fill = por_minuto.get(m_ent + 1)

        if res == 'stop' and x is not None:
            st, riesgo = x, abs(e - x); obj = e + riesgo * nd
            deduccion = 'salió por stop: el stop es la salida y el objetivo, el mismo recorrido (1:1)'
        elif res == 'target' and x is not None:
            obj, riesgo = x, abs(x - e); st = e - riesgo * nd
            deduccion = 'salió por objetivo: el objetivo es la salida y el stop, el mismo recorrido (1:1)'
        else:
            st = obj = riesgo = None
            deduccion = 'salida a mano: el stop y el objetivo no se pueden deducir'

        op = dict(hora=str(tr['entry_time'])[:5], sentido='alcista' if nd > 0 else 'bajista',
                  entrada=_r(e), salida=_r(x), resultado=res, stop=_r(st), objetivo=_r(obj),
                  riesgo=_r(riesgo), deduccion=deduccion,
                  vela=(f"{lector.col(D[i_fill]) // 100}:{D[i_fill]['t'][2:4]}" if i_fill is not None else None))

        op['en_ventana'] = i_fill is not None and r['b'] < i_fill <= r['fin']
        op['riesgo_dentro_del_maximo'] = None if riesgo is None else riesgo <= lector.STOP_MAX
        op['stop_maximo'] = lector.STOP_MAX

        # El objetivo, con el mismo filtro que el motor aplica a su orden (zonas vivas en el camino),
        # mirado en la vela anterior al llenado: ahí la orden ya estaba puesta.
        if obj is not None and i_fill is not None:
            libre, z = lector._libre(Z, i_fill - 1, e, obj)
            op['objetivo_libre'] = libre
            if not libre:
                lo, hi = z.en(i_fill - 1)
                op['zona_en_el_camino'] = (f"{'resistencia' if z.tipo == 'R' else 'soporte' if z.tipo == 'S' else 'zona'} "
                                           f"{lo:.2f}-{hi:.2f} (vela {z.origen})")
        else:
            op['objetivo_libre'] = None

        T = lector._noticia(dia, m_ent, lector.VENTANA_NOTICIA)
        op['noticia_cerca'] = lector._hhmm(T) if T is not None else None

        # La operación del motor, y si es la misma que la de Kris.
        if t:
            mot = dict(setup=t['tipo'], sentido='alcista' if t['dir'] > 0 else 'bajista', hora=t['hora'],
                       entrada=_r(t['e']), stop=_r(t['s']), objetivo=_r(t['t']), riesgo=_r(t['r']),
                       resultado=t.get('res'), puntos=_r(t.get('pts')))
            op['motor'] = mot
            op['coincide'] = (t['dir'] == nd and i_fill is not None
                              and abs(t['i_fill'] - i_fill) <= COINCIDE_VELAS)
            if op['coincide'] and riesgo is not None:
                op['diferencias'] = dict(entrada=_r(e - t['e']), stop=_r(st - t['s']),
                                         objetivo=_r(obj - t['t']), riesgo=_r(riesgo - t['r']))
        else:
            op['motor'] = None
            op['coincide'] = False

        # Lo que anotó el motor justo antes de la entrada: ahí está el stop que el plan le daba a ese
        # rompimiento aunque lo descartara («CONTINUACIÓN alcista · entrada … · stop … ✗ descartado — …»).
        op['eventos_motor'] = _eventos_cerca(ev, m_ent + 1 - EVENTOS_ANTES, m_ent + 1)
        op['contratos'] = int(tr['qty']) if tr.get('qty') is not None else None
        op['juicio'] = juicio(op, len(ops), tr)
        ops.append(op)
    return ops
