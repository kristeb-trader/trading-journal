# -*- coding: utf-8 -*-
"""
EL PUENTE de la cadena diaria (fase 7 · docs/disenos/2026-09-24-cadena-diaria.md §4.3).

Corre el motor de Chaumer sobre el archivo de velas de un día, hace su gráfico, lo sube a
Cloudinary y guarda la FICHA en Supabase (motor_fichas). El motor se IMPORTA, no se copia:
chaumer/05_Backtesting/lector.py y dia.py son de auditoría y los mantiene Cowork.

    python scripts/cadena/subir_dia.py 2026-09-23 [2026-09-22 ...]    unos días
    python scripts/cadena/subir_dia.py --pendientes [--dias 10]        lo que falte o haya cambiado
    python scripts/cadena/subir_dia.py --comparar                      fase 7e: AddOn contra exportación manual

Lo lanza el AddOn CadenaDiaria de NinjaTrader; a mano, el acceso directo "Subir el dia.bat".
Clave: la service_role de los indicadores (Documentos\\NinjaTrader 8\\supabase-service-key.txt).
Umbral: el de chaumer/01_Plan/PARAMETROS.md. Días de Fed: Fechas Especiales (tipo fomc).
Nunca escribe en test_ciego/ (es de Cowork). Registro: %LOCALAPPDATA%\\TradingJournal\\cadena\\registro.txt
"""
import os, re, sys, json, glob, hashlib, datetime, traceback, urllib.request, urllib.error, uuid

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BT = os.path.join(RAIZ, 'chaumer', '05_Backtesting')
PARAMETROS = os.path.join(RAIZ, 'chaumer', '01_Plan', 'PARAMETROS.md')
DIA_MANUAL = os.path.join(BT, 'datos', 'dia')         # la exportación de Kris (y del AddOn tras la 7e)
DIA_AUTO = os.path.join(BT, 'datos', 'dia_auto')      # la del AddOn mientras dura la verificación (7e)
SALIDA = os.path.join(os.environ.get('LOCALAPPDATA', os.path.expanduser('~')), 'TradingJournal', 'cadena')
CLAVE = os.path.join(os.path.expanduser('~'), 'Documents', 'NinjaTrader 8', 'supabase-service-key.txt')
SUPABASE = 'https://jothoslozctflfrnysrx.supabase.co'
CLOUDINARY = ('dq4n7bjta', 'trading-journal')         # los mismos que la app (js/config.js)

sys.path.insert(0, BT)
import lector, dia  # noqa: E402  (dia importa el mismo módulo lector)

os.makedirs(SALIDA, exist_ok=True)


def log(msg):
    linea = f"{datetime.datetime.now():%Y-%m-%d %H:%M:%S}  {msg}"
    print(linea)
    with open(os.path.join(SALIDA, 'registro.txt'), 'a', encoding='utf-8') as f:
        f.write(linea + '\n')


# ── Supabase (service_role, solo la librería estándar) ─────────────────────────
def _clave():
    if not os.path.exists(CLAVE):
        raise SystemExit(f'Falta la clave service_role en {CLAVE}')
    return open(CLAVE, encoding='utf-8-sig').read().strip()


def sb(metodo, ruta, cuerpo=None, prefer=None):
    k = _clave()
    h = {'apikey': k, 'Authorization': f'Bearer {k}', 'Content-Type': 'application/json'}
    if prefer: h['Prefer'] = prefer
    data = json.dumps(cuerpo).encode('utf-8') if cuerpo is not None else None
    req = urllib.request.Request(SUPABASE + '/rest/v1/' + ruta, data=data, headers=h, method=metodo)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            txt = r.read().decode('utf-8')
            return json.loads(txt) if txt else None
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'Supabase {e.code}: {e.read().decode("utf-8", "replace")}')


def subir_grafico(png, fecha):
    frontera = uuid.uuid4().hex
    partes = []
    for nombre, valor in (('upload_preset', CLOUDINARY[1]), ('folder', 'motor')):
        partes.append(f'--{frontera}\r\nContent-Disposition: form-data; name="{nombre}"\r\n\r\n{valor}\r\n'.encode())
    partes.append(f'--{frontera}\r\nContent-Disposition: form-data; name="file"; filename="{fecha}.png"\r\n'
                  f'Content-Type: image/png\r\n\r\n'.encode() + open(png, 'rb').read() + b'\r\n')
    partes.append(f'--{frontera}--\r\n'.encode())
    req = urllib.request.Request(f'https://api.cloudinary.com/v1_1/{CLOUDINARY[0]}/image/upload',
                                 data=b''.join(partes), method='POST',
                                 headers={'Content-Type': f'multipart/form-data; boundary={frontera}'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode('utf-8'))['secure_url']


# ── Lo que el motor necesita saber de fuera ────────────────────────────────────
def umbral_del_plan():
    """UMBRAL_VOL de PARAMETROS.md: (valor, fecha desde). Sin él no se inventa uno."""
    txt = open(PARAMETROS, encoding='utf-8').read()
    m = re.search(r'\|\s*\*\*`UMBRAL_VOL`\*\*\s*\|\s*\*\*>\s*([\d.]+)\s*contratos en MNQ\*\*\s*\*\(desde (\d{2})/(\d{2})/(\d{4})\)', txt)
    if not m: raise ValueError('no encuentro la fila UMBRAL_VOL en PARAMETROS.md')
    return int(m.group(1).replace('.', '')), datetime.date(int(m.group(4)), int(m.group(3)), int(m.group(2)))


def dias_fed():
    filas = sb('GET', 'catalogo_fechas?tipo=eq.fomc&activa=eq.true&select=fecha')
    return {f['fecha'].replace('-', '') for f in filas}


def noticias_fed(fecha):
    filas = sb('GET', f'sesion_noticias?sesion_date=eq.{fecha}&select=hora,nombre')
    return [f"{str(n['hora'])[:5]} {n['nombre']}" for n in filas
            if re.search(r'fomc|\bfed\b|powell', n.get('nombre') or '', re.I)]


# ── La ficha ───────────────────────────────────────────────────────────────────
def hhmm(k): return f"{lector.col(k)//100}:{k['t'][2:4]}"
def minutos(h): a, b = h.split(':'); return int(a) * 60 + int(b)


def origen(z):
    return 'premercado' if z.origen.endswith(' pm') else 'apendice' if z.origen.endswith(' ap') else 'estructura'


def avisos_del_motor(r, corte_z):
    """El agujero conocido del motor que se puede detectar (LEEME_BACK_DIARIO.md): el plazo de un
    rompimiento sin consecución. El otro (la secuencia de marcado de la jornada) NO se calcula: hacerlo
    exigiría definir aquí la secuencia, y eso es metodología del plan. El Coach lo recuerda siempre."""
    D, av = r['D'], []
    tope = minutos(hhmm(D[corte_z]))
    for l in r['log']:
        if 'plazo vencido' in l and minutos(l.split()[0]) <= tope:
            av.append(f"rompimiento sin consecución ({l.split()[0]}): el motor espera siempre a la 5.ª vela; comprobar a mano si la estructura contraria lo resolvió antes")
    return av


def ficha_del_dia(V, d, umbral, fed):
    """Corre el motor y arma la ficha. Devuelve (estado, ficha, operacion)."""
    r = lector.leer_sesion(V, d)
    if r is None:
        return 'sin_jornada', {'motivo': 'sin ventana completa (festivo o datos incompletos)'}, None
    if 'error' in r:
        return 'error', {'motivo': r['error']}, None
    ev, t = lector.detectar_setups(r, solo_reingresos=fed)
    D, Z, b = r['D'], r['Z'], r['b']
    fin = t['i_out'] if (t and t.get('i_out') is not None) else r['fin']
    corte_z = t['i_fill'] if (t and t.get('i_fill') is not None) else fin      # igual que dia.py
    ini = lector.apertura_utc(d)
    pm = [k for k in D if lector.hm(k) < ini]
    base = D[b]
    ficha = {
        'fecha': f'{d[:4]}-{d[4:6]}-{d[6:]}',
        'apertura': {'vela': hhmm(base), 'direccion': 'alcista' if r['alc'] else 'bajista',
                     'abre': base['o'], 'cierra': base['c']},
        'premercado': {'velas_sobre_umbral': sum(k['v'] > umbral for k in pm),
                       'maximo_volumen': max((k['v'] for k in pm), default=0)},
        'zonas': [{'tipo': 'resistencia' if z.tipo == 'R' else 'soporte',
                   'desde': round(z.en(corte_z)[0], 2), 'hasta': round(z.en(corte_z)[1], 2),
                   'vela': z.origen.split(' ')[0], 'origen': origen(z),
                   'vigente_al_final': z.fin is None or z.fin > corte_z}
                  for z in Z if z.i <= corte_z],
        'eventos': ev,
        'operacion': t and {'setup': t['tipo'], 'sentido': 'alcista' if t['dir'] > 0 else 'bajista',
                            'hora': t['hora'], 'entrada': t['e'], 'stop': t['s'], 'objetivo': t['t'],
                            'riesgo': round(t['r'], 2), 'resultado': t['res'],
                            'puntos': t['pts'], 'salida': t.get('h_out')},
        'avisos': avisos_del_motor(r, corte_z),
    }
    return 'ok', ficha, t


def velas_del_dia(path, d):
    """Las líneas del día en UTC, de las 00:00 al fin de ventana: lo que el motor lee."""
    fin = lector.cierre_utc(d)
    return ''.join(l for l in open(path, encoding='utf-8')
                   if l.startswith(d + ' ') and int(l[9:13]) <= fin)


def comparar(manual, auto, d):
    a, b = velas_del_dia(manual, d).splitlines(), velas_del_dia(auto, d).splitlines()
    if a == b: return None
    sa, sb_ = set(a), set(b)
    solo_m, solo_a = sorted(sa - sb_), sorted(sb_ - sa)
    return (f"la exportación del AddOn difiere de la manual: {len(a)} vs {len(b)} velas; "
            f"primera distinta manual={solo_m[:1]} addon={solo_a[:1]}")


def huella(texto): return hashlib.sha256(texto.encode('utf-8')).hexdigest()


# ── Un día ──────────────────────────────────────────────────────────────────────
def archivos(fecha):
    m, a = os.path.join(DIA_MANUAL, f'{fecha}.txt'), os.path.join(DIA_AUTO, f'{fecha}.txt')
    return (m if os.path.exists(m) else None), (a if os.path.exists(a) else None)


def instrumento(path):
    meta = path[:-4] + '.meta.json'       # lo deja el AddOn al lado del archivo
    try: return json.load(open(meta, encoding='utf-8')).get('instrumento') or 'MNQ'
    except Exception: return 'MNQ'


def procesar(fecha, umbral, desde, fed_set, huella_motor):
    manual, auto = archivos(fecha)
    path = manual or auto
    if not path:
        log(f'{fecha}  sin archivo de velas: nada que subir'); return False
    d = fecha.replace('-', '')
    fed = d in fed_set
    lector.UMBRAL_VOL = umbral
    lector.FOMC = set(fed_set)
    V = lector.cargar(path)
    estado, ficha, t = ficha_del_dia(V, d, umbral, fed)
    avisos = ficha.setdefault('avisos', []) if estado == 'ok' else []
    if datetime.date.fromisoformat(fecha) < desde:
        avisos.append(f'umbral actual ({umbral}, desde {desde:%d/%m/%Y}) aplicado a un día anterior a ese cambio')
    if not fed and estado == 'ok':
        nf = noticias_fed(fecha)
        if nf: avisos.append(f"noticia roja de la Fed ({'; '.join(nf)}) y el día no está en Fechas Especiales como FOMC")
    if manual and auto:
        dif = comparar(manual, auto, d)
        if dif: avisos.append(dif); log(f'{fecha}  ⚠️ {dif}')
        else: log(f'{fecha}  exportación del AddOn = manual, línea a línea')
    grafico = None
    if estado == 'ok':
        png = os.path.join(SALIDA, f'{fecha}.png')
        ev2, t2 = dia.dibujar(d, png, path)
        if (t2 and {k: t2[k] for k in ('e', 's', 't', 'res')}) != (t and {k: t[k] for k in ('e', 's', 't', 'res')}):
            raise RuntimeError('el gráfico y la ficha no dan la misma operación')
        grafico = subir_grafico(png, fecha)
        ficha['motor'] = {'umbral_vol': umbral, 'dia_fed': fed, 'huella': huella_motor}
    velas = velas_del_dia(path, d)
    fila = {'fecha': fecha, 'estado': estado, 'instrumento': instrumento(path), 'umbral_vol': umbral,
            'dia_fed': fed, 'ficha': ficha, 'velas': velas, 'grafico_url': grafico,
            'huella_motor': huella_motor, 'huella_datos': huella(velas),
            'origen_datos': 'manual' if manual else 'addon',
            'generada_en': datetime.datetime.now(datetime.timezone.utc).isoformat()}
    sb('POST', 'motor_fichas?on_conflict=fecha', fila, 'resolution=merge-duplicates,return=minimal')
    op = ficha.get('operacion') if estado == 'ok' else None
    res = (f"{op['setup']} {op['sentido']} {op['hora']} → {op['resultado']} {op['puntos']:+.2f}" if op
           else 'sin operación' if estado == 'ok' else ficha.get('motivo'))
    log(f"{fecha}  {estado} · {res} · {len(avisos)} aviso(s) · {'Fed · ' if fed else ''}{'manual' if manual else 'addon'}")
    return True


def comparar_todo():
    """Fase 7e: cada día con las dos exportaciones (datos/dia y datos/dia_auto), ¿son idénticas entre
    las 00:00 UTC y el fin de ventana? --pendientes solo apunta las DIFERENCIAS (si la huella no cambia
    no reprocesa el día), así que el "son iguales" hay que pedirlo aquí. No sube nada."""
    fechas = sorted(os.path.basename(p)[:10] for p in glob.glob(os.path.join(DIA_AUTO, '????-??-??.txt')))
    if not fechas: log('comparar: el AddOn aún no ha escrito ningún día'); return 0
    iguales = distintas = 0
    for f in fechas:
        m, a = archivos(f)
        if not m: log(f'{f}  comparar: falta la exportación manual'); continue
        d = f.replace('-', '')
        dif = comparar(m, a, d)
        if dif: distintas += 1; log(f'{f}  comparar: ⚠️ {dif}')
        else:
            iguales += 1
            log(f"{f}  comparar: idénticas ({len(velas_del_dia(a, d).splitlines())} velas del día hasta el fin de ventana)")
    log(f'comparar: {iguales} día(s) idénticos, {distintas} con diferencias')
    return 1 if distintas else 0


def pendientes(n_dias, huella_motor):
    hoy = datetime.date.today()
    fechas = sorted({os.path.basename(p)[:10] for c in (DIA_MANUAL, DIA_AUTO)
                     for p in glob.glob(os.path.join(c, '????-??-??.txt'))
                     if (hoy - datetime.date.fromisoformat(os.path.basename(p)[:10])).days <= n_dias})
    if not fechas: return []
    hay = {f['fecha']: f for f in sb('GET', f"motor_fichas?fecha=gte.{fechas[0]}&select=fecha,huella_motor,huella_datos")}
    fuera = []
    for f in fechas:
        m, a = archivos(f)
        h = huella(velas_del_dia(m or a, f.replace('-', '')))
        if f not in hay or hay[f]['huella_motor'] != huella_motor or hay[f]['huella_datos'] != h:
            fuera.append(f)
    return fuera


def main(argv):
    if '--comparar' in argv: return comparar_todo()
    huella_motor = hashlib.sha256(open(os.path.join(BT, 'lector.py'), 'rb').read()).hexdigest()
    try:
        umbral, desde = umbral_del_plan()
    except Exception as e:
        log(f'❌ {e}: no se sube nada (el umbral no se inventa)'); return 1
    fed_set = dias_fed()
    if '--pendientes' in argv:
        n = int(argv[argv.index('--dias') + 1]) if '--dias' in argv else 10
        fechas = pendientes(n, huella_motor)
        if not fechas: log('pendientes: nada que subir'); return 0
    else:
        fechas = [a for a in argv if re.fullmatch(r'\d{4}-\d{2}-\d{2}', a)]
        if not fechas: print(__doc__); return 1
    fallos = 0
    for f in fechas:
        try:
            procesar(f, umbral, desde, fed_set, huella_motor)
        except Exception as e:
            fallos += 1
            log(f'{f}  ❌ {e}')
            with open(os.path.join(SALIDA, 'registro.txt'), 'a', encoding='utf-8') as fh: traceback.print_exc(file=fh)
            try:
                sb('POST', 'motor_fichas?on_conflict=fecha',
                   {'fecha': f, 'estado': 'error', 'ficha': {'motivo': str(e)[:500]}, 'huella_motor': huella_motor},
                   'resolution=ignore-duplicates,return=minimal')   # una ficha buena no se pisa con un error
            except Exception: pass
    return 1 if fallos else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
