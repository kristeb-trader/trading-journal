# -*- coding: utf-8 -*-
"""
El bot en el Strategy Analyzer contra el motor de Python, día a día (D-038, docs/disenos/2026-10-06-bot-chaumer.md §8, V2).

    python scripts/bot/comparar.py                 el CSV más reciente de Documentos\\NinjaTrader 8\\bot-chaumer\\
    python scripts/bot/comparar.py <archivo.csv>

Por cada día del CSV que tenga velas en chaumer/05_Backtesting/claude/motor/datos/dia/, corre lector.py (el día entero,
con las noticias y los días de Fed de la cadena) y compara la operación: setup, sentido, hora de la orden, entrada, stop,
objetivo, contratos (los que caben en RIESGO_MAX), hora del llenado y resultado. Un día sin operación tiene que ser
NO OPERA en los dos.

Lo que puede diferir sin que sea un fallo, y se dice aparte:
  · intravela: el motor decide por el color de la vela qué tocó primero; NinjaTrader, con su motor de llenados;
  · precios desplazados todos lo mismo: el Analyzer con otro contrato o con la serie ajustada (merge policy).
"""
import os, sys, glob, csv, io, importlib.util

sys.stdout.reconfigure(encoding='utf-8')
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BT = os.path.join(RAIZ, 'chaumer', '05_Backtesting', 'claude', 'motor')
DIR_CSV = os.path.join(os.path.expanduser('~'), 'Documents', 'NinjaTrader 8', 'bot-chaumer')


def motor():
    spec = importlib.util.spec_from_file_location('lector_comp', os.path.join(BT, 'lector.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


def leer_csv(ruta):
    with open(ruta, encoding='utf-8') as f:
        lineas = [l for l in f if not l.startswith('#')]
    return list(csv.DictReader(io.StringIO(''.join(lineas)), delimiter=';'))


def num(x):
    return None if x in (None, '') else float(x)


def del_motor(m, d):
    path = os.path.join(BT, 'datos', 'dia', f'{d[:4]}-{d[4:6]}-{d[6:]}.txt')
    if not os.path.exists(path): return None
    V = m.cargar(path)
    r = m.leer_sesion(V, d)
    if not r or 'error' in r: return {'resultado': 'NO OPERA', 'nota': r and r.get('error')}
    ev, t = m.detectar_setups(r, solo_reingresos=d in m.FOMC)
    if not t: return {'resultado': 'NO OPERA'}
    D = r['D']
    return {'setup': t['tipo'], 'direccion': t['dir'], 'hora_orden': f"{m.col(D[t['i']]) // 100}:{D[t['i']]['t'][2:4]}",
            'entrada': t['e'], 'stop': t['s'], 'objetivo': t['t'], 'riesgo': t['r'],
            'contratos': int(m.RIESGO_MAX // (t['r'] * 2) + 1e-9), 'hora_llenado': t['hora'], 'resultado': t['res'],
            'puntos': t['pts']}


def main():
    ruta = sys.argv[1] if len(sys.argv) > 1 else max(glob.glob(os.path.join(DIR_CSV, 'backtest-*.csv')), key=os.path.getmtime)
    print(f'CSV: {ruta}')
    m = motor()
    filas = leer_csv(ruta)
    iguales = sin_datos = 0; distintos = []; desplazamientos = set()
    for f in filas:
        d = f['fecha'].replace('-', '')
        mo = del_motor(m, d)
        if mo is None: sin_datos += 1; continue
        bot_opera = f['resultado'] not in ('NO OPERA', 'NO ARMADO')
        if f['resultado'] == 'NO ARMADO':
            distintos.append((d, f'el bot no se armó: {f["motivo"]}')); continue
        if mo['resultado'] == 'NO OPERA' and not bot_opera:
            iguales += 1; continue
        if (mo['resultado'] == 'NO OPERA') != (not bot_opera):
            quien = 'el motor opera' if bot_opera is False else 'el bot opera'
            det = (f"motor: {mo.get('setup')} {mo.get('hora_orden')} → {mo['resultado']}" if mo['resultado'] != 'NO OPERA'
                   else f"bot: {f['setup']} {f['hora_orden']} → {f['resultado']}")
            distintos.append((d, f'{quien} y el otro no · {det}' + (f' · bot: {f["diferencia"]}' if f.get('diferencia') else '')))
            continue
        dif = []
        for k in ('setup', 'hora_orden', 'hora_llenado', 'resultado'):
            if str(mo[k]) != f[k]: dif.append(f'{k}: motor {mo[k]} · bot {f[k]}')
        if int(f['direccion']) != mo['direccion']: dif.append(f"sentido: motor {mo['direccion']} · bot {f['direccion']}")
        if f['contratos'] and int(f['contratos']) != mo['contratos']: dif.append(f"contratos: motor {mo['contratos']} · bot {f['contratos']}")
        off = [round(num(f[k]) - mo[k], 2) for k in ('entrada', 'stop', 'objetivo')]
        if any(abs(x) > 1e-6 for x in off):
            if len(set(off)) == 1: desplazamientos.add(off[0]); dif.append(f'precios desplazados {off[0]:+.2f} pts (contrato o serie ajustada)')
            else: dif.append(f"precios: motor {mo['entrada']:.2f}/{mo['stop']:.2f}/{mo['objetivo']:.2f} · bot {f['entrada']}/{f['stop']}/{f['objetivo']}")
        if dif: distintos.append((d, ' · '.join(dif)))
        else: iguales += 1
    # los días con velas del motor dentro del tramo del CSV que el bot no escribió: un día que el bot ni vio
    fechas = sorted(f['fecha'] for f in filas)
    if fechas:
        del_csv = set(fechas)
        for p in sorted(glob.glob(os.path.join(BT, 'datos', 'dia', '20*.txt'))):
            fe = os.path.basename(p)[:10]
            if fechas[0] <= fe <= fechas[-1] and fe not in del_csv:
                mo = del_motor(m, fe.replace('-', ''))
                que = 'NO OPERA' if mo['resultado'] == 'NO OPERA' else f"{mo['setup']} {mo['hora_orden']} → {mo['resultado']}"
                distintos.append((fe.replace('-', ''), f'falta en el CSV: el bot no dejó fila (el motor: {que})'))
    print(f'días del CSV: {len(filas)} · comparados: {len(filas) - sin_datos} (sin velas del motor: {sin_datos})')
    print(f'✅ iguales: {iguales}')
    for d, txt in distintos: print(f'❌ {d}  {txt}')
    if desplazamientos and all('desplazados' in t for _, t in distintos):
        print('   Todas las diferencias son un desplazamiento de precio: el Analyzer usó otro contrato o la serie ajustada.')
    sys.exit(1 if distintos else 0)


if __name__ == '__main__':
    main()
