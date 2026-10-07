# -*- coding: utf-8 -*-
"""
La sincronía del bot (D-038, docs/disenos/2026-10-06-bot-chaumer.md §5).

lector.py (Python, la referencia) y NinjaTrader/MotorChaumer.cs (C#, el que opera en NinjaTrader) tienen que
decidir EXACTAMENTE lo mismo. Esto lo comprueba y, solo entonces, sella.

    python scripts/bot/sincronia.py                              regresión + los dos motores en todos los días
    python scripts/bot/sincronia.py --sellar                     … y con 0 diferencias escribe el SELLO
    python scripts/bot/sincronia.py --comprobar-sello            ¿el SELLO es el de los archivos de hoy? (rápido)
    python scripts/bot/sincronia.py --comprobar-sello --staged   … el de lo que va al commit (el hook pre-commit)
    python scripts/bot/sincronia.py --sellar --cambio-de-regla   tras un cambio de regla APROBADO: los días que cambian
                                                                 respecto a git se enseñan, no bloquean; los dos motores
                                                                 tienen que seguir a 0 diferencias entre sí

Por cada día con datos (los mismos que scripts/cadena/prueba_motor.py) compara, con el día ENTERO, el registro, las
zonas, el zigzag, los reingresos, los eventos, la operación y la orden; y VELA A VELA, en cada vela de la ventana, la
orden que el bot debería tener puesta y la operación. Además: los números que cada motor lee de reglas.json, la huella
calculada por los dos, y el zigzag propio de MarcacionChaumer (ZigzagChaumer), que se lee del indicador sin tocarlo:
es el del gráfico operativo de Kris y queda independiente del bot (07/10/2026). Sale con código 1 si algo no cuadra.

El SELLO (`L:<huella de lector.py> C:<huella de MotorChaumer.cs sin el sello>`) solo lo escribe --sellar. Con el sello
viejo el hook de git rechaza el commit y el bot no opera.
"""
import os, sys, re, glob, hashlib, subprocess, tempfile, difflib, importlib.util

sys.stdout.reconfigure(encoding='utf-8')
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BT = os.path.join(RAIZ, 'chaumer', '05_Backtesting', 'claude', 'motor')
LECTOR = os.path.join(BT, 'lector.py')
MOTOR_CS = os.path.join(RAIZ, 'NinjaTrader', 'MotorChaumer.cs')
ARNES_CS = os.path.join(RAIZ, 'NinjaTrader', 'pruebas', 'ArnesMotor.cs')
MARCACION_CS = os.path.join(RAIZ, 'NinjaTrader', 'MarcacionChaumer.cs')
REGLAS = os.path.join(RAIZ, 'chaumer', '01_Plan', 'reglas.json')
CSC = r'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'
RE_SELLO = r'SELLO = "[^"]*"'
REL = {LECTOR: 'chaumer/05_Backtesting/claude/motor/lector.py', MOTOR_CS: 'NinjaTrader/MotorChaumer.cs'}


# ── el sello ────────────────────────────────────────────────────────────────
def huella(texto):
    """Igual que MotorChaumer.Huella: sha256 (16 hex) con los saltos normalizados a \\n."""
    t = texto.replace('\r\n', '\n')
    if t.startswith('\ufeff'): t = t[1:]
    return hashlib.sha256(t.encode('utf-8')).hexdigest()[:16]


def sello_de(lector, cs):
    return 'L:' + huella(lector) + ' C:' + huella(re.sub(RE_SELLO, 'SELLO = ""', cs))


def leer(ruta, staged=False):
    if staged:
        return subprocess.check_output(['git', '-C', RAIZ, 'show', ':' + REL[ruta]]).decode('utf-8')
    with open(ruta, encoding='utf-8', newline='') as f: return f.read()


def sello_escrito(cs):
    m = re.search(r'SELLO = "([^"]*)"', cs)
    return m.group(1) if m else None


def comprobar_sello(staged):
    lector, cs = leer(LECTOR, staged), leer(MOTOR_CS, staged)
    esperado, escrito = sello_de(lector, cs), sello_escrito(cs)
    if esperado == escrito:
        print(f'✅ sello al día: {escrito}')
        return 0
    print('❌ El SELLO de NinjaTrader/MotorChaumer.cs no es el de los archivos ' + ('del commit' if staged else 'de hoy') + ':')
    print(f'     escrito   {escrito or "(ninguno)"}\n     esperado  {esperado}')
    print('   lector.py o MotorChaumer.cs cambiaron sin pasar la sincronía. Cambia los DOS igual y luego:')
    print('     python scripts/bot/sincronia.py --sellar')
    return 1


# ── la salida canónica (la misma que NinjaTrader/pruebas/ArnesMotor.cs) ────
def F2(x): return f'{x:.2f}'
def opt(x, f=str): return '-' if x is None else f(x)
def b01(x): return '1' if x else '0'


def canon_orden(o):
    if not o: return '-'
    return '|'.join([o['tipo'], str(o['dir']), F2(o['e']), F2(o['s']), F2(o['t']), F2(o['r']), str(o['i']),
                     opt(o.get('pausa')), b01(o.get('cruzo', False))])


def canon_trade(t):
    if not t: return '-'
    return '|'.join([t['tipo'], str(t['dir']), F2(t['e']), F2(t['s']), F2(t['t']), F2(t['r']), str(t['i']),
                     str(t['i_fill']), t['hora'], t['res'], opt(t['pts'], F2), str(t['i_out']), t['h_out']])


def canon_dia(m, V, d, fed):
    r = m.leer_sesion(V, d)
    if r is None: return ['NONE']
    if 'error' in r: return ['ERR ' + r['error']]
    ev, t = m.detectar_setups(r, solo_reingresos=fed)
    out = ['L ' + l for l in r['log']]
    for z in r['Z']:
        roto = '-' if z.roto is None else f'{z.roto[0]},{z.roto[1]},{F2(z.roto[2])}'
        out.append('Z ' + '|'.join([repr(z), b01(z.activa), opt(z.fin), b01(z.pm), b01(z.de_corrida), str(z.dir),
                                    opt(z.ref, F2), opt(z.r_ini), opt(z.r_fin), opt(z.i_papel), roto, b01(z.consec),
                                    opt(z.i_consec)]))
    for (j, p), c in zip(r['piv'], r['pconf']): out.append(f'P {j} {F2(p)} {opt(c)}')
    for (i, ref) in r['retros']: out.append(f'R {i} {F2(ref)}')
    for (i, e, tt, nd) in r['reingresos']: out.append(f'RI {i} {F2(e)} {F2(tt)} {nd}')
    out += ['E ' + e for e in ev]
    out.append('T ' + canon_trade(t))
    out.append('O ' + canon_orden(r['orden']))
    b = r['b']
    for (j, p), c in zip(r['piv'], r['pconf']): out.append(f'ZZ {j - b} {F2(p)} {"-" if c is None else c - b}')
    return out


def canon_vivo(m, V, d):
    D = [k for k in V if k['d'] == d]
    full = m.leer_sesion(D, d)
    if not full or 'error' in full: return []
    out = []
    for i in range(full['b'], full['fin'] + 1):
        r, ev, t = m.decidir(D, d, i)
        hora = f"{m.col(D[i]) // 100}:{D[i]['t'][2:4]}"
        if not r or 'error' in r: out.append(f'V {hora} -'); continue
        out.append(f'V {hora} O {canon_orden(r["orden"])} T {canon_trade(t)}')
    return out


# ── los dos motores ────────────────────────────────────────────────────────
def zigzag_de_marcacion(carpeta):
    """La clase ZigzagChaumer de MarcacionChaumer.cs, copiada a un archivo aparte para compilarla con el arnés.
    El indicador NO se toca (Kris, 07/10/2026): es el de su gráfico operativo y queda independiente del bot."""
    txt = leer(MARCACION_CS)
    a = txt.index('public static class ZigzagChaumer')
    i = txt.index('{', a); nivel = 0
    for j in range(i, len(txt)):
        if txt[j] == '{': nivel += 1
        elif txt[j] == '}':
            nivel -= 1
            if nivel == 0: break
    destino = os.path.join(carpeta, 'ZigzagChaumer.cs')
    with open(destino, 'w', encoding='utf-8') as f:
        f.write('// Copiado de NinjaTrader/MarcacionChaumer.cs por scripts/bot/sincronia.py, solo para compararlo.\n'
                'using System;\nusing System.Collections.Generic;\nusing System.Linq;\n'
                'namespace NinjaTrader.NinjaScript.Indicators\n{\n    ' + txt[a:j + 1] + '\n}\n')
    return destino


def compilar():
    carpeta = tempfile.mkdtemp(prefix='arnes_')
    dest = os.path.join(carpeta, 'ArnesMotor.exe')
    p = subprocess.run([CSC, '/nologo', '/optimize', '/codepage:65001', '/target:exe', f'/out:{dest}', MOTOR_CS, ARNES_CS,
                        zigzag_de_marcacion(carpeta)], capture_output=True)
    salida = p.stdout.decode('utf-8', 'replace') + p.stderr.decode('utf-8', 'replace')
    if p.returncode != 0:
        print('❌ csc no compila MotorChaumer.cs + ArnesMotor.cs:\n' + salida)
        sys.exit(1)
    return dest


def arnes(exe, *args):
    p = subprocess.run([exe, *map(str, args)], capture_output=True)
    txt = p.stdout.decode('utf-8')
    if p.returncode != 0: raise RuntimeError(f'ArnesMotor {args[0]} falló:\n{txt}')
    return txt.rstrip('\n').split('\n') if txt.strip() else []


def motor():
    spec = importlib.util.spec_from_file_location('lector_sinc', LECTOR)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


def fuentes():
    """Los mismos días que scripts/cadena/prueba_motor.py: cada archivo diario, su jornada; el NQ histórico, con 2000."""
    out = [(p, 8000) for p in sorted(glob.glob(os.path.join(BT, 'datos', 'dia', '*.txt')))]
    nq = os.path.join(BT, 'datos', 'NQ 09-26.Last.txt')
    if os.path.exists(nq): out.append((nq, 2000))
    return out


def diferencias(a, b, n=12):
    return list(difflib.unified_diff(a, b, 'lector.py', 'MotorChaumer.cs', lineterm='', n=1))[:n + 3]


def main():
    args = sys.argv[1:]
    if '--comprobar-sello' in args:
        sys.exit(comprobar_sello('--staged' in args))
    sellar = '--sellar' in args
    fallos = 0

    print('=== 1 · Regresión del motor de Python (prueba_motor.py) ===')
    p = subprocess.run([sys.executable, os.path.join(RAIZ, 'scripts', 'cadena', 'prueba_motor.py')], capture_output=True)
    salida = p.stdout.decode('utf-8', 'replace')
    ultima = salida.strip().splitlines()[-1:] or ['(sin salida)']
    print('  ' + ultima[0])
    if p.returncode != 0:
        if '--cambio-de-regla' in args:
            # Un cambio de regla aprobado cambia días a propósito: se enseñan para revisarlos, no bloquean.
            # Lo que sí tiene que seguir a 0 es la diferencia entre los dos motores (paso 5).
            cambian = [l for l in salida.splitlines() if l.strip().startswith('❌')]
            print(f'  ⚠ cambio de regla: {len(cambian)} días no Fed cambian respecto a git (esperado, se revisan):')
            for l in cambian: print('   ' + l.strip()[:160])
        else:
            print(salida); fallos += 1

    print('=== 2 · Compilar MotorChaumer.cs con el csc del sistema (C# 5) ===')
    exe = compilar(); print('  ✅ compila')

    m = motor()
    print('=== 3 · Los números del plan que lee cada motor (reglas.json) ===')
    py = 'TICK={TICK:g} STOP_MAX={STOP_MAX:g} RIESGO_MAX={RIESGO_MAX:g} PLAZO_CONSECUCION={PLAZO_CONSECUCION} ' \
         'UMBRAL_VOL={UMBRAL_VOL} VENTANA_NOTICIA={VENTANA_NOTICIA}'.format(**m.PARAMETROS)
    cs = arnes(exe, 'param', REGLAS)[0]
    ok = py == cs; fallos += not ok
    print(f'  {"✅" if ok else "❌"} {cs}' + ('' if ok else f'\n     Python: {py}'))

    print('=== 4 · La huella, calculada por los dos ===')
    hp, hc = sello_de(leer(LECTOR), leer(MOTOR_CS)), arnes(exe, 'huella', LECTOR, MOTOR_CS)[0]
    ok = hp == hc; fallos += not ok
    print(f'  {"✅" if ok else "❌"} {hc}' + ('' if ok else f'\n     Python: {hp}'))

    print('=== 5 · Los dos motores, día a día: el día entero y vela a vela ===')
    FED = set(m.FOMC)
    vistos = set(); dias_ok = velas = lineas = 0
    for path, umbral in fuentes():
        V = m.cargar(path)
        solo = os.path.basename(path)[:10].replace('-', '') if 'dia' in os.path.dirname(path) else None
        for d in sorted({k['d'] for k in V}):
            if solo and d != solo: continue
            if d in vistos: continue
            m.UMBRAL_VOL = umbral
            fed = d in FED
            a = canon_dia(m, V, d, fed)
            if a == ['NONE']: continue
            vistos.add(d)
            noticias = ','.join(str(x) for x in m.NOTICIAS.get(d, [])) or '-'
            b = arnes(exe, 'dia', REGLAS, path, d, umbral, int(fed), noticias)
            va = canon_vivo(m, V, d)
            vb = arnes(exe, 'vivo', REGLAS, path, d, umbral, int(fed), noticias)
            if a == b and va == vb:
                dias_ok += 1; velas += len(va); lineas += len(a)
                continue
            fallos += 1
            print(f'  ❌ {d}' + (' (Fed)' if fed else '') + f' · umbral {umbral}')
            for l in (diferencias(a, b) if a != b else []): print('     ' + l)
            for l in (diferencias(va, vb) if va != vb else []): print('     ' + l)
    print(f'  días idénticos: {dias_ok} de {len(vistos)} · {lineas} líneas del día entero · {velas} velas vela a vela')

    if fallos:
        print(f'\n❌ {fallos} cosas no cuadran. El motor en C# NO está sincronizado: no se sella.')
        sys.exit(1)
    print('\n✅ LOS DOS MOTORES DECIDEN LO MISMO')
    if sellar:
        cs = leer(MOTOR_CS)
        nuevo = sello_de(leer(LECTOR), cs)
        if sello_escrito(cs) == nuevo:
            print(f'  el sello ya estaba al día: {nuevo}')
        else:
            with open(MOTOR_CS, 'w', encoding='utf-8', newline='') as f:
                f.write(re.sub(RE_SELLO, f'SELLO = "{nuevo}"', cs, count=1))
            print(f'  ✍ SELLO escrito en NinjaTrader/MotorChaumer.cs: {nuevo}')
            print('  ⚠️ Kris: copia MotorChaumer.cs a NinjaTrader y recompila (F5). Sin eso el bot no opera.')
    else:
        estado = 'al día' if sello_escrito(leer(MOTOR_CS)) == hp else 'VIEJO (falta --sellar)'
        print(f'  sello {estado}')


if __name__ == '__main__':
    main()
