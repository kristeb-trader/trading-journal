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


def _minutos_hhmm(h):
    a, b = str(h).split(':')[:2]
    return int(a) * 60 + int(b)


def _r(x): return None if x is None else round(x, 2)


def huella_trades(trades):
    """Cambia si cambia algo de los trades del día que entre en la medición."""
    claves = ('market_pos', 'entry_time', 'exit_time', 'entry_price', 'exit_price', 'resultado')
    filas = sorted(json.dumps({k: str(t.get(k)) for k in claves}, sort_keys=True) for t in trades)
    return hashlib.sha256('\n'.join(filas).encode('utf-8')).hexdigest()[:16]


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
        ops.append(op)
    return ops
