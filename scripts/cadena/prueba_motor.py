# -*- coding: utf-8 -*-
"""
Regresión del motor (chaumer/05_Backtesting/lector.py): compara el motor de una versión
de git (por defecto HEAD) con el del disco, día a día, sobre todos los datos disponibles.

    python scripts/cadena/prueba_motor.py            # HEAD contra el disco
    python scripts/cadena/prueba_motor.py a203380    # otra versión contra el disco

Un día no Fed tiene que dar EXACTAMENTE lo mismo (zonas, eventos y operación). Los días
de Fed se imprimen aparte: ahí se espera que cambie lo que el cambio pretendía cambiar.
Además comprueba apertura_utc() y simula un día de invierno (horas +1 h).
Sale con código 1 si algo no cuadra.
"""
import os, sys, glob, subprocess, types, importlib.util

sys.stdout.reconfigure(encoding='utf-8')
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BT = os.path.join(RAIZ, 'chaumer', '05_Backtesting')
REL = 'chaumer/05_Backtesting/lector.py'


def motor_de_git(ref):
    src = subprocess.check_output(['git', '-C', RAIZ, 'show', f'{ref}:{REL}']).decode('utf-8')
    m = types.ModuleType('lector_' + ref)
    exec(compile(src, f'lector@{ref}', 'exec'), m.__dict__)
    return m


def motor_del_disco():
    spec = importlib.util.spec_from_file_location('lector_disco', os.path.join(BT, 'lector.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


def correr(mod, V, dia, umbral, fed):
    mod.UMBRAL_VOL = umbral
    r = mod.leer_sesion(V, dia)
    if r is None or 'error' in r: return None if r is None else ('error', r['error'])
    ev, t = mod.detectar_setups(r, solo_reingresos=fed)
    op = t and {k: t.get(k) for k in ('tipo', 'dir', 'hora', 'e', 's', 't', 'r', 'res', 'pts', 'h_out')}
    return dict(zonas=[repr(z) for z in r['Z']], eventos=ev, op=op)


def dias_de(mod, path):
    V = mod.cargar(path)
    return V, sorted({k['d'] for k in V})


def main():
    ref = sys.argv[1] if len(sys.argv) > 1 else 'HEAD'
    viejo, nuevo = motor_de_git(ref), motor_del_disco()
    FED = set(viejo.FOMC)
    fallos = 0

    fuentes = [(p, 8000) for p in sorted(glob.glob(os.path.join(BT, 'datos', 'dia', '*.txt')))]
    nq = os.path.join(BT, 'datos', 'NQ 09-26.Last.txt')
    if os.path.exists(nq): fuentes.append((nq, 2000))

    print(f'=== Regresión: motor de {ref} contra el del disco ===')
    iguales = 0; vistos = set()
    for path, umbral in fuentes:
        V, dias = dias_de(nuevo, path)
        solo = os.path.basename(path)[:10].replace('-', '') if 'dia' in os.path.dirname(path) else None
        for d in dias:
            if solo and d != solo: continue           # cada archivo diario: solo su jornada
            if d in vistos: continue
            fed = d in FED
            a, b = correr(viejo, V, d, umbral, fed), correr(nuevo, V, d, umbral, fed)
            if a is None and b is None: continue
            vistos.add(d)
            if fed:
                print(f'  FED {d}: antes {a and a["op"]} · ahora {b and b["op"]}')
                for e in (b or {}).get('eventos', []): print('        ', e)
            elif a == b:
                iguales += 1
            else:
                fallos += 1
                print(f'  ❌ {d} (umbral {umbral}) CAMBIÓ:\n     antes {a}\n     ahora {b}')
    print(f'  días no Fed idénticos: {iguales} · distintos: {fallos}')

    print('=== apertura_utc ===')
    for d, esperado in (('20260923', 1331), ('20261030', 1331), ('20261102', 1431), ('20261215', 1431),
                        ('20270312', 1431), ('20270315', 1331)):
        got = nuevo.apertura_utc(d); ok = got == esperado; fallos += not ok
        print(f'  {"✅" if ok else "❌"} {d} → {got} (esperado {esperado})')

    print('=== Invierno simulado: el 23/09 con las horas +1 h, como si fuera el 4/11 ===')
    V, _ = dias_de(nuevo, os.path.join(BT, 'datos', 'dia', '2026-09-23.txt'))
    W = []
    for k in V:
        if k['d'] != '20260923': continue
        h = int(k['t'][:2]) + 1
        W.append(dict(k, d='20261104', t=f"{h:02d}{k['t'][2:]}"))
    a, b = correr(nuevo, V, '20260923', 8000, False), correr(nuevo, W, '20261104', 8000, False)
    precios = lambda r: [z.split(' (')[0] for z in r['zonas']]
    ok = (a and b and precios(a) == precios(b)
          and {k: v for k, v in a['op'].items() if k not in ('hora', 'h_out')} ==
              {k: v for k, v in b['op'].items() if k not in ('hora', 'h_out')})
    fallos += not ok
    print(f'  {"✅" if ok else "❌"} mismas zonas y misma operación · verano {a["op"]["hora"]} → invierno {b["op"]["hora"]}')
    print(f'     vela base en invierno: {b["eventos"] and nuevo.leer_sesion(W, "20261104")["log"][0]}')

    print(f'\n{"✅ TODO CUADRA" if not fallos else f"❌ {fallos} FALLO(S)"}')
    sys.exit(1 if fallos else 0)


if __name__ == '__main__':
    main()
