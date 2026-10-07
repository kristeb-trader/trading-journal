# -*- coding: utf-8 -*-
"""
LECTOR CHAUMER  ·  reescrito 2026-08-26 con las reglas confirmadas por el operador.
HERRAMIENTA DE AUDITORIA. No es una herramienta operativa.
Vive en 05_Backtesting/claude/motor (desde el 28/09/2026), fuera de 01_Plan.
"""
import os, re, json

# LOS NUMEROS DEL PLAN (06/10/2026, D-038): se LEEN de la clave `parametros` de 01_Plan/reglas.json,
# que genera scripts/plan/leer-reglas.mjs desde PARAMETROS.md. Es la fuente unica de este motor y
# de MotorChaumer.cs (el bot): un numero se cambia en PARAMETROS.md y llega a los dos. Hasta hoy
# solo UMBRAL_VOL se leia (de PARAMETROS.md, desde el 26/09/2026); TICK, STOP_MAX, PLAZO y
# VENTANA_NOTICIA iban escritos aqui y se habrian quedado viejos si el plan los cambiaba.
# UMBRAL_VOL es AJUSTABLE (R-15, P-37). Para cambiarlo desde fuera:  lector.UMBRAL_VOL = 2000
#   NQ -> 2000   <- solo para releer el archivo historico 'NQ 09-26.Last.txt'
_DEL_PLAN = ('TICK', 'STOP_MAX', 'RIESGO_MAX', 'PLAZO_CONSECUCION', 'UMBRAL_VOL', 'VENTANA_NOTICIA')

def parametros_del_plan():
    """{nombre: numero} de reglas.json. Si falta uno, falla: no se inventa.
    Sin __file__ (la regresion carga una version de git con exec) devuelve los valores del
    06/10/2026 y UMBRAL_VOL None: quien lo carga asi fija el umbral en cada pasada
    (scripts/cadena/prueba_motor.py lo hace). Solo para eso: el motor de verdad lee el plan."""
    if '__file__' not in globals():
        return dict(TICK=0.25, STOP_MAX=80.0, RIESGO_MAX=160.0, PLAZO_CONSECUCION=5,
                    UMBRAL_VOL=None, VENTANA_NOTICIA=5)
    ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '01_Plan', 'reglas.json')
    P = json.load(open(ruta, encoding='utf-8')).get('parametros', {})
    out = {}
    for n in _DEL_PLAN:
        v = P.get(n, {}).get('numero')
        if v is None: raise ValueError(f'lector.py: {n} no tiene numero en {ruta} (node scripts/plan/leer-reglas.mjs --escribir)')
        out[n] = v
    return out

PARAMETROS = parametros_del_plan()
TICK = PARAMETROS['TICK']
STOP_MAX = float(PARAMETROS['STOP_MAX'])
RIESGO_MAX = PARAMETROS['RIESGO_MAX']        # $ por operacion (R-04): lo usa el bot para los contratos
UMBRAL_VOL = PARAMETROS['UMBRAL_VOL']
PLAZO = int(PARAMETROS['PLAZO_CONSECUCION'])  # velas para la consecucion

# Dias de FOMC (R-36): la sesion entera, solo Reingresos (confirmado por el operador 28/09/2026).
# Desde el 28/09/2026 se LEEN de dias_fed.txt, la copia de Fechas Especiales del Trading Journal
# que reescribe scripts/cadena/subir_dia.py. Antes iban escritos aqui y se quedaban atras: faltaban
# el 19/08 (actas) y el 28/08 (Jackson Hole). La cadena diaria, ademas, los fija en cada pasada.
def dias_fed():
    """Las fechas de dias_fed.txt como 'AAAAMMDD'. Sin __file__ (la regresion carga una version
    de git con exec) devuelve las tres de julio-septiembre que habia escritas hasta el 28/09."""
    if '__file__' not in globals(): return {'20260708','20260729','20260916'}
    ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dias_fed.txt')
    return {ln.split()[0].replace('-', '') for ln in open(ruta, encoding='utf-8')
            if ln.strip() and not ln.startswith('#')}

FOMC = dias_fed()

# Noticias rojas (R-35): de T-5 a T+5 no se coloca ninguna orden; una pendiente se retira al entrar
# T-5 y se vuelve a colocar pasado T+5 si el setup sigue vivo. Desde el 28/09/2026 se LEEN de
# noticias_rojas.txt, la copia de las noticias que Kris anota en el Journal (sesion_noticias),
# en hora Colombia; la reescribe scripts/cadena/subir_dia.py. Un dia sin noticias anotadas cuenta
# como dia sin noticia roja.
VENTANA_NOTICIA = int(PARAMETROS['VENTANA_NOTICIA'])
def noticias_rojas():
    """{'AAAAMMDD': [minutos del dia, hora Colombia]}. Sin __file__ (la regresion carga una
    version de git con exec) no hay noticias: el motor anterior al 28/09 no las aplicaba."""
    if '__file__' not in globals(): return {}
    ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'noticias_rojas.txt')
    out = {}
    for ln in open(ruta, encoding='utf-8'):
        if not ln.strip() or ln.startswith('#'): continue
        f, h = ln.split()[:2]
        out.setdefault(f.replace('-', ''), []).append(int(h[:2]) * 60 + int(h[3:5]))
    return out

NOTICIAS = noticias_rojas()

def _minutos(k): c = col(k); return (c // 100) * 60 + c % 100

def _noticia(dia, t, margen_ini):
    """La hora (minutos) de la noticia cuya ventana contiene t, o None. margen_ini=5 para colocar
    una orden al cierre de la vela t (T-5..T+5); 4 para la vela (t-1, t] con la orden viva, que
    toca la ventana si t-1 < T+5 y t > T-5."""
    for T in NOTICIAS.get(dia, []):
        if T - margen_ini <= t <= T + VENTANA_NOTICIA: return T
    return None

def _hhmm(m): return f"{m // 60}:{m % 60:02d}"

def cargar(path):
    V=[]
    for ln in open(path,encoding='utf-8'):
        p=ln.strip().split(';')
        if len(p)<6: continue
        d,t=p[0].split(' ')
        V.append(dict(d=d,t=t,o=float(p[1]),h=float(p[2]),l=float(p[3]),
                      c=float(p[4]),v=int(p[5])))
    return V

def hm(k): return int(k['t'][:4])          # HHMM en UTC
def col(k): return hm(k)-500               # HHMM en hora Colombia

# APERTURA AMERICANA (R-02) — 24/09/2026, fase 7 del Trading Journal, con el OK del operador.
# La ventana es 09:30-11:30 de NUEVA YORK. Colombia no cambia de hora y Nueva York si, asi que
# la vela base es la 08:31 Col (13:31 UTC) en el horario de verano de EE. UU. y la 09:31 Col
# (14:31 UTC) en invierno. Hasta hoy el motor tenia 13:31 UTC fijo y desde el 2/11/2026 habria
# tomado una vela de premercado como vela base. El grafico sigue en hora Colombia: col() no cambia.
# La regla de EE. UU. (desde 2007: del segundo domingo de marzo al primer domingo de noviembre) va
# escrita a mano porque zoneinfo no trae la base de husos horarios en Windows.
def _domingo(y, m, n):
    import datetime
    d = datetime.date(y, m, 1)
    d += datetime.timedelta(days=(6 - d.weekday()) % 7)      # primer domingo del mes
    return d + datetime.timedelta(weeks=n - 1)

def apertura_utc(dia):
    """HHMM UTC de la vela base de la jornada `dia` (yyyymmdd): 1331 en verano de EE. UU., 1431 en invierno."""
    import datetime
    f = datetime.date(int(dia[:4]), int(dia[4:6]), int(dia[6:]))
    verano = _domingo(f.year, 3, 2) <= f < _domingo(f.year, 11, 1)
    return 1331 if verano else 1431

def cierre_utc(dia):
    """HHMM UTC de la ultima vela de la ventana: 120 velas despues de la base (15:30 o 16:30 UTC)."""
    return apertura_utc(dia) + 199

def z_res(k): return (max(k['o'],k['c']), k['h'])
def z_sop(k): return (k['l'], min(k['o'],k['c']))

class Zona:
    def __init__(self,lo,hi,tipo,i,origen,i_org=None):
        self.lo=lo; self.hi=hi; self.tipo=tipo   # 'R' o 'S'
        self.i=i                                  # indice de la vela en que se dibuja
        self.origen=origen                        # etiqueta de la vela que la sostiene
        self.i_org=i if i_org is None else i_org  # indice de esa vela: el dibujo arranca AHI
        self.arriba=False; self.abajo=False       # traspasos CONFIRMADOS (rompimiento + consecucion)
        self.pend=None                            # rompimiento esperando consecucion: (dir,i,extremo,plazo_resuelto)
        self.fin=None                             # indice en que queda inactiva
        self.roto=None                            # ('arriba'/'abajo', i, extremo_vela)
        self.consec=False                         # el rompimiento consiguio continuacion
        self.i_consec=None                        # vela de esa consecucion
        self.consec_ext=None                      # extremo de la vela de consecucion
        self.rein_ok=False                        # ventana de reingreso abierta
        self.ref=None                             # punto de referencia
        self.de_corrida=False                     # la creo una corrida (no un retroceso)
        self.pm=False                             # zona de premercado (R-15)
        self.i_papel=None                         # vela en que una zona 'P' tomo su papel
        self.pend2=None                           # zona 'P': rompimiento del OTRO lado, esperando consecucion
        self.dir=0                                # sentido de esa corrida: +1 / -1
        self.r_ini=None; self.r_fin=None          # retroceso que la origina
        self.hist=[(i,lo,hi)]                     # geometria a lo largo del dia
    def en(self,i):
        g=[(j,a,b) for (j,a,b) in self.hist if j<=i]
        return (g[-1][1],g[-1][2]) if g else (self.lo,self.hi)
    @property
    def activa(self): return not (self.arriba and self.abajo)
    def toca(self,lo,hi): return not (hi < self.lo or lo > self.hi)
    def __repr__(self):
        return f"{self.tipo} {self.lo:.2f}-{self.hi:.2f} (vela {self.origen})"

# ---------------------------------------------------------------- premercado
def zonas_premercado(V):
    Z=[]
    ini = apertura_utc(V[0]['d']) if V else 1331   # el premercado acaba en la apertura (24/09/2026)
    # R-15, CONFIRMADO POR EL OPERADOR 28/09/2026 (cierra P-39): el COLOR dice DONDE va la
    # zona (alcista -> mecha superior, bajista -> mecha inferior); la APERTURA de la primera
    # vela de la ventana dice si es soporte o resistencia: por debajo -> 'S', por encima ->
    # 'R'. Si abre DENTRO, la zona es 'P' (ni una cosa ni la otra) hasta que el precio salga
    # de ella con rompimiento + consecucion. Lo anterior a la apertura no cuenta.
    ap = next((k['o'] for k in V if hm(k)>=ini), None)
    for i,k in enumerate(V):
        if hm(k)>=ini: break
        if k['v']<=UMBRAL_VOL: continue
        lo,hi = z_res(k) if k['c']>=k['o'] else z_sop(k)
        if ap is None: tipo = 'R' if k['c']>=k['o'] else 'S'
        else:          tipo = 'S' if hi < ap else ('R' if lo > ap else 'P')
        z=Zona(lo,hi,tipo,i,f"{col(k)//100}:{k['t'][2:4]} pm"); z.pm=True
        Z.append(z)
    return Z

# ------------------------------------------------------- filtro zonas entre zonas
def bloqueada(Z, lo, hi, extremo, tipo):
    """tipo 'R': el movimiento subio hasta `extremo`. 'S': bajo hasta `extremo`.
    Devuelve (bloqueada_por_50, mitad, banda) — banda = (techo de abajo, piso de arriba)."""
    act=[z for z in Z if z.activa]
    arr=[z for z in act if z.lo > hi]
    aba=[z for z in act if z.hi < lo]
    if not arr or not aba: return False, None, None
    za=min(arr, key=lambda z:z.lo)          # zona de arriba
    zb=max(aba, key=lambda z:z.hi)          # zona de abajo
    banda=(zb.hi, za.lo, zb, za)
    mid=(zb.hi+za.lo)/2.0
    if tipo=='R': return (extremo > mid), mid, banda
    else:         return (extremo < mid), mid, banda

def en_banda_usada(rangos, lo, hi):
    """R-17/R-12: una banda entre dos zonas se resuelve con UNA sola zona por jornada.
    Ya resuelta, no se dibuja NADA mas dentro — y eso incluye la ZONA APENDICE, que
    hasta el 15/09/2026 se anadia directamente sin pasar por este filtro."""
    if not rangos: return False
    for (a, b, zb, za) in rangos:
        if hi > a + 1e-9 and lo < b - 1e-9: return True
    return False

def banda_ocupada(Z, lo, hi):
    """R-12/R-17, precisado 18/09/2026 por el operador.

    Entre una resistencia y un soporte se marca UNA SOLA zona en toda la jornada.
    Desde que esa banda tiene su zona queda cerrada, y NO se reabre porque los
    bordes o la zona de dentro queden invalidos: una zona invalida deja de valer
    como zona, pero NO deja de ocupar el sitio.

    Se mira sobre TODAS las zonas, activas o invalidas — a diferencia de
    bloqueada(), que solo mira las activas, y de rangos, que solo anota la banda
    cuando se evalua una candidata dentro de ella. Ese era el hueco: la jornada
    del 18/09/2026 marcaba la resistencia 29804.75-29805.75 de la vela 8:54
    dentro de la banda que ya habia gastado la zona de premercado, invalida
    desde las 8:50."""
    arr = [z for z in Z if z.lo > hi + 1e-9]
    aba = [z for z in Z if z.hi < lo - 1e-9]
    if not arr or not aba: return False
    za = min(arr, key=lambda z: z.lo)
    zb = max(aba, key=lambda z: z.hi)
    return any(z.hi > zb.hi + 1e-9 and z.lo < za.lo - 1e-9 for z in Z)

def anadir(Z, lo, hi, tipo, i, origen, extremo, i_org=None, rangos=None):
    blo, mid, banda = bloqueada(Z, lo, hi, extremo, tipo)
    if rangos is not None:
        # UNA SOLA zona entre zonas por banda y por jornada (Alfredo, 27/08/2026).
        # El primer retroceso dentro de la banda la resuelve: se marque o no,
        # la banda queda cerrada. Y SALIR de la banda no es geometria: hace falta
        # que el mercado rompa la zona del borde Y consiga la consecucion.
        for (a,b,zb,za) in rangos:
            if hi > a+1e-9 and lo < b-1e-9:
                return None, ('rango_usado', mid)
            # para estar FUERA de la banda no basta la geometria: el mercado tiene que
            # haber roto la zona del borde Y conseguido la consecucion en ese sentido.
            if hi <= a+1e-9 and not zb.abajo:
                return None, ('salida_sin_consecucion', mid)
            if lo >= b-1e-9 and not za.arriba:
                return None, ('salida_sin_consecucion', mid)
        if banda is not None: rangos.append(banda)
        # La comprobacion va AQUI, despues de anotar la banda: si fuese antes,
        # la banda no quedaria registrada y una candidata posterior que el
        # registro habria bloqueado se colaria. (18/09/2026)
        if banda_ocupada(Z, lo, hi):
            return None, ('banda_gastada', mid)
    # No se marca nada AL OTRO LADO de una zona viva cuyo rompimiento todavia
    # espera consecucion: hasta que llegue, el mercado no ha salido de esa zona.
    # (confirmado por el operador 27/08/2026, casos 9:13 y 9:44 del 8 de julio)
    for z in Z:
        if z.fin is not None or z.pend is None or z.i > i: continue
        # lo que cuenta es el EXTREMO del movimiento, no el rectangulo de la zona nueva
        if z.pend[0]=='abajo'  and extremo < z.lo-1e-9: return None, ('sin_consecucion', None)
        if z.pend[0]=='arriba' and extremo > z.hi+1e-9: return None, ('sin_consecucion', None)
    if blo: return None, ('bloqueada50', mid)
    # una zona viva OCUPA su franja de precio. No se dibuja nada encima.
    for z in Z:
        if z.activa and z.tipo!=tipo and z.toca(lo,hi):
            return None, ('solapa', None)
    for z in Z:
        if z.activa and z.tipo==tipo and z.toca(lo,hi):
            # se estira SOLO hacia el nuevo extremo. El otro borde no se mueve.
            if tipo=='R': z.hi=max(z.hi,hi)
            else:         z.lo=min(z.lo,lo)
            z.hist.append((i,z.lo,z.hi))
            return z, ('estirada', None)
    nz=Zona(lo,hi,tipo,i,origen,i_org); Z.append(nz)
    return nz, ('nueva', None)

# ---------------------------------------------------------------- recorrido
def leer_sesion(V, dia, minimo=30):
    """minimo: velas de ventana que hacen falta para leer el dia. 30 con el dia entero (menos no es
    una jornada americana completa); 1 en vivo, vela a vela (decidir(), el bot: 06/10/2026)."""
    D=[k for k in V if k['d']==dia]
    if not D: return None
    Z = zonas_premercado(D)
    ini, fin_v = apertura_utc(dia), cierre_utc(dia)   # la ventana sigue a Nueva York (24/09/2026)
    S=[i for i,k in enumerate(D) if ini<=hm(k)<=fin_v]
    if len(S)<minimo: return None
    b=S[0]                                   # indice de la vela base 08:31
    base=D[b]
    alc = base['c']>base['o']                # direccion del dia
    decide=None
    if base['c']==base['o']:
        # R-07, CONFIRMADO POR EL OPERADOR 28/09/2026 (cierra P-23): sin cuerpo, la direccion la
        # da la primera vela siguiente que pase del maximo (alcista) o del minimo (bajista) de la
        # vela base; las de dentro no dicen nada. Si pasa de los dos, manda lo que hizo primero,
        # por su color: azul = minimo primero -> bajista; blanca = maximo primero -> alcista.
        # La vela base sigue siendo la vela origen.
        for j in S[1:]:
            kj=D[j]; up=kj['h']>base['h']; dn=kj['l']<base['l']
            if not (up or dn): continue
            if up and dn:
                if kj['c']==kj['o']:
                    return dict(error='vela base sin cuerpo y la que la supera por los dos lados tampoco tiene cuerpo')
                alc = kj['c']<kj['o']
            else:
                alc = up
            decide=j; break
        if decide is None:
            return dict(error='vela base sin cuerpo y ninguna vela de la ventana sale de su rango')

    ref_actual=None; z_pend=None
    rangos=[]        # bandas entre zonas ya resueltas: una sola zona por banda y por jornada
    log=[]
    log.append(f"{col(base)//100:02d}:{base['t'][2:4]} vela base {'ALCISTA' if alc else 'BAJISTA'} "
               f"(abre {base['o']:.2f} cierra {base['c']:.2f})"
               + (f" · sin cuerpo: decide la de {col(D[decide])//100}:{D[decide]['t'][2:4]}" if decide is not None else ""))

    estado='corrida'
    ini=b                                    # primera vela de la corrida (origen)
    ext=b                                    # vela con el extremo de la corrida
    r_ini=None; r_ext=None                   # retroceso
    retros=[]                                # (i_confirma, extremo)
    piv=[(b, D[b]['l'] if alc else D[b]['h'])]   # zigzag de corridas y retrocesos
    pconf=[b]                                # vela en que se sabe cada vertice del zigzag (R-40, 29/09/2026)

    fin = S[-1]
    # R-15 (28/09/2026): todo se lee desde la primera vela de la ventana, y eso incluye
    # a la propia vela base: tambien ella puede romper una zona de premercado. Por eso la
    # vigencia arranca en b; la estructura (corrida/retroceso), en b+1.
    for i in range(b, fin+1):
        k=D[i]; p=D[i-1]
        for z in Z:                                   # vigencia, en cada vela
            if z.fin is not None or z.i > i: continue
            # Una zona nace con el precio a UN lado. Cuenta como traspaso cruzarla
            # hacia el otro lado, y luego volver a cruzarla de vuelta.
            # Un pinchazo de mecha NO cuenta: hace falta que el CUERPO quede fuera.
            # Y la vela de rompimiento POR SI SOLA NO invalida la zona: hace falta
            # la vela de consecucion  (confirmado por el operador 27/08/2026).
            resuelto=False
            if z.pend is not None:
                d,ir,ex,hecho = z.pend
                if (k['h'] > ex) if d=='arriba' else (k['l'] < ex):
                    # CONSECUCION. Confirma el traspaso en ese sentido. NO tiene plazo:
                    # puede llegar muchas velas despues (operador 27/08/2026, 13 de julio).
                    if d=='arriba': z.arriba=True
                    else:           z.abajo=True
                    z.pend=None; resuelto=True
                    if z.tipo=='P':
                        # R-15 (28/09/2026): la zona de premercado dentro de la que abrio la
                        # ventana toma su papel al salir: por arriba soporte, por abajo
                        # resistencia. Nace ahi, con el precio a un lado y sin traspasos.
                        z.tipo = 'S' if d=='arriba' else 'R'
                        z.arriba=False; z.abajo=False; z.i_papel=i
                        log.append(f"{col(k)//100}:{k['t'][2:4]} la zona de premercado "
                                   f"{z.lo:.2f}-{z.hi:.2f} sale {d}: queda como "
                                   f"{'soporte' if z.tipo=='S' else 'resistencia'}")
                elif not hecho and i-ir >= PLAZO:
                    # VENCIO EL PLAZO SIN CONSECUCION (operador 27/08/2026):
                    #   rompimiento con MECHA  → la zona se ESTIRA hasta esa mecha
                    #   rompimiento con CUERPO → nace una ZONA APENDICE, del cuerpo de
                    #   la vela hasta el final de su mecha. Quedan vigentes las dos.
                    kr=D[ir]
                    def _ya(t_,a,b_):
                        return any(zz.fin is None and zz.tipo==t_ and abs(zz.lo-a)<1e-9
                                   and abs(zz.hi-b_)<1e-9 for zz in Z)
                    # R-10 (precisada 14/09/2026): el ESTIRAMIENTO va por el TIPO de zona,
                    # no por el lado del rompimiento. Una resistencia solo se estira por
                    # arriba y un soporte solo por abajo. Si el precio cruza la zona por el
                    # lado contrario —el cruce de vuelta, cuando ya la traspaso una vez— no
                    # hay nada que estirar: ese cruce no la toca, solo la mata cuando llegue
                    # su consecucion. Caso de origen: 14/09/2026, soporte de 9:10 cruzado
                    # hacia arriba a las 10:07, que antes lo estiraba dentro de la
                    # resistencia viva de 9:09 y dejaba las dos zonas pisandose.
                    estira_ok = (z.tipo=='R' and d=='arriba') or (z.tipo=='S' and d=='abajo')
                    estirada = False
                    if d=='abajo':
                        cuerpo = kr['c'] < z.lo
                        # 15/09/2026: la apendice tambien pasa por el filtro de la banda.
                        # Hasta hoy se anadia directamente a Z, saltandose anadir(), y nacia
                        # dentro de bandas ya resueltas — el motor llegaba a RECHAZAR el
                        # rectangulo como zona por rango_usado y a dibujarlo unas velas
                        # despues como apendice. Detectado por el operador en la jornada del
                        # 15/09 (resistencia 29384.75-29388.00 de la vela 9:09, rechazada a
                        # las 9:10 y dibujada a las 9:14). No cambia ningun resultado:
                        # julio sigue en -77.75 en 5 y las cuatro jornadas de septiembre
                        # dan la misma entrada. Solo desaparecen zonas del dibujo.
                        if cuerpo and not en_banda_usada(rangos, kr['l'], min(kr['o'],kr['c'])) \
                                and not _ya('S', kr['l'], min(kr['o'],kr['c'])):
                            ap=Zona(kr['l'], min(kr['o'],kr['c']), 'S', i,
                                    f"{col(kr)//100}:{kr['t'][2:4]} ap", ir)
                            Z.append(ap)
                            log.append(f"{col(k)//100}:{k['t'][2:4]} plazo vencido → ZONA "
                                       f"APÉNDICE S {ap.lo:.2f}-{ap.hi:.2f} sobre "
                                       f"{col(kr)//100}:{kr['t'][2:4]}")
                        elif not cuerpo and estira_ok:
                            z.lo=min(z.lo,kr['l']); z.hist.append((i,z.lo,z.hi)); estirada=True
                            log.append(f"{col(k)//100}:{k['t'][2:4]} plazo vencido → se ESTIRA "
                                       f"la zona a {z.lo:.2f}-{z.hi:.2f}")
                    else:
                        cuerpo = kr['c'] > z.hi
                        if cuerpo and not en_banda_usada(rangos, max(kr['o'],kr['c']), kr['h']) \
                                and not _ya('R', max(kr['o'],kr['c']), kr['h']):
                            ap=Zona(max(kr['o'],kr['c']), kr['h'], 'R', i,
                                    f"{col(kr)//100}:{kr['t'][2:4]} ap", ir)
                            Z.append(ap)
                            log.append(f"{col(k)//100}:{k['t'][2:4]} plazo vencido → ZONA "
                                       f"APÉNDICE R {ap.lo:.2f}-{ap.hi:.2f} sobre "
                                       f"{col(kr)//100}:{kr['t'][2:4]}")
                        elif not cuerpo and estira_ok:
                            z.hi=max(z.hi,kr['h']); z.hist.append((i,z.lo,z.hi)); estirada=True
                            log.append(f"{col(k)//100}:{k['t'][2:4]} plazo vencido → se ESTIRA "
                                       f"la zona a {z.lo:.2f}-{z.hi:.2f}")
                    # Con la APENDICE el rompimiento SIGUE pendiente: si algun dia llega la
                    # consecucion, la zona original queda traspasada igual (R-20).
                    # Si la zona SE ESTIRA, el rompimiento se CIERRA (plan 3.45, 07/10/2026, R-10):
                    # la zona estirada vuelve a empezar en su borde nuevo y para traspasarla hace
                    # falta un rompimiento nuevo con su propia consecucion. Antes seguia pendiente
                    # y, como su consecucion es el borde nuevo, pasar 1 tick de la zona estirada
                    # ya la daba por traspasada (07/10: la resistencia de las 8:32 murio a las 9:28).
                    z.pend = None if estirada else (d,ir,ex,True)
            if z.tipo=='P' and z.pend is not None and not resuelto:
                # R-15 (30/09/2026, jornada del 8/09): una zona sin papel sale por el lado que PRIMERO
                # consiga rompimiento + consecucion. Hasta hoy, anotado un lado, el motor ya no miraba el
                # otro: el 8/09 la vela de 8:31 rompe por arriba sin consecucion, la de 8:33 rompe por
                # abajo y la de 8:34 da la consecucion, y la zona se quedaba sin papel todo el dia.
                # El primer rompimiento sigue pendiente, con su apendice o su estiramiento al vencer el plazo.
                p2=z.pend2
                if p2 is not None and p2[1] < i and ((k['h'] > p2[2]) if p2[0]=='arriba' else (k['l'] < p2[2])):
                    z.tipo = 'S' if p2[0]=='arriba' else 'R'
                    z.arriba=False; z.abajo=False; z.i_papel=i; z.pend2=None
                    log.append(f"{col(k)//100}:{k['t'][2:4]} la zona de premercado "
                               f"{z.lo:.2f}-{z.hi:.2f} sale {p2[0]}: queda como "
                               f"{'soporte' if z.tipo=='S' else 'resistencia'}")
                elif p2 is None:
                    if   z.pend[0]=='arriba' and k['l'] < z.lo: z.pend2=('abajo',i,k['l'])
                    elif z.pend[0]=='abajo'  and k['h'] > z.hi: z.pend2=('arriba',i,k['h'])
            if z.pend is None and not resuelto:
                # La vela que confirma un traspaso NO abre a la vez el rompimiento del
                # otro lado: el rompimiento contrario se busca a partir de la SIGUIENTE.
                # (operador 27/08/2026, 13 de julio: 8:58 y 9:18)
                # una zona nace con el precio a UN lado: ese lado es su casa y no cuenta.
                # ROMPIMIENTO = pasar 1 tick del borde, la mecha basta (el cierre da igual).
                if z.tipo=='P':
                    if   k['h'] > z.hi: z.pend=('arriba',i,k['h'],False)
                    elif k['l'] < z.lo: z.pend=('abajo',i,k['l'],False)
                elif z.tipo=='R':
                    if   not z.arriba and k['h'] > z.hi: z.pend=('arriba',i,k['h'],False)
                    elif z.arriba and not z.abajo and k['l'] < z.lo: z.pend=('abajo',i,k['l'],False)
                else:
                    if   not z.abajo and k['l'] < z.lo: z.pend=('abajo',i,k['l'],False)
                    elif z.abajo and not z.arriba and k['h'] > z.hi: z.pend=('arriba',i,k['h'],False)
            if z.arriba and z.abajo: z.fin=i
        if i==b: continue                              # la vela base solo cuenta para la vigencia
        if estado=='corrida':
            muere = (k['l'] < p['l']) if alc else (k['h'] > p['h'])
            nuevo_ext = (k['h'] > D[ext]['h']) if alc else (k['l'] < D[ext]['l'])
            if nuevo_ext and not muere:
                ext=i
            elif nuevo_ext and muere:
                # la vela hace las dos cosas. Solo cuenta para el extremo si el
                # extremo ocurrio ANTES de la vuelta. Vela azul = minimo primero,
                # vela blanca = maximo primero  (confirmado por el operador 26/08/2026)
                extremo_primero = (k['c'] < k['o']) if alc else (k['c'] >= k['o'])
                if extremo_primero: ext=i
            if not muere: continue
            # cerrar la zona pendiente que venia del retroceso: su pullback fue
            # justamente esta corrida, y termina aqui.
            if z_pend is not None:
                z_pend.ref = D[ext]['h'] if alc else D[ext]['l']
                z_pend.r_fin = max(ext, i-1)
                z_pend = None
            kx=D[ext]
            if alc:
                lo,hi=z_res(kx); tipo='R'; extremo=kx['h']
            else:
                lo,hi=z_sop(kx); tipo='S'; extremo=kx['l']
            z,(que,mid)=anadir(Z,lo,hi,tipo,i,f"{col(kx)//100}:{kx['t'][2:4]}",extremo,ext if estado=='corrida' else r_ext,rangos)
            log.append(f"{col(k)//100}:{k['t'][2:4]} muere corrida → zona {tipo} "
                       f"{lo:.2f}-{hi:.2f} sobre {col(kx)//100}:{kx['t'][2:4]} [{que}"
                       + (f" mitad {mid:.3f}" if mid else "") + "]")
            if z is not None and que=='nueva' and z.tipo==tipo:
                z.de_corrida=True; z.dir = 1 if alc else -1
                z.r_ini=i; z.r_fin=None
            else:
                z=None
            z_pend = z
            piv.append((ext, D[ext]['h'] if alc else D[ext]['l'])); pconf.append(i)
            estado='retro'; r_ini=i; r_ext=i
        else:
            confirma = (k['h'] > p['h']) if alc else (k['l'] < p['l'])
            hunde = (k['l'] < D[r_ext]['l']) if alc else (k['h'] > D[r_ext]['h'])
            if hunde and not confirma:
                r_ext=i
            elif hunde and confirma:
                # misma logica: el extremo del retroceso solo cuenta si ocurrio antes
                extremo_primero = (k['c'] >= k['o']) if alc else (k['c'] < k['o'])
                if extremo_primero: r_ext=i
            if not confirma: continue
            kx=D[r_ext]
            if alc:
                lo,hi=z_sop(kx); tipo='S'; extremo=kx['l']
            else:
                lo,hi=z_res(kx); tipo='R'; extremo=kx['h']
            z,(que,mid)=anadir(Z,lo,hi,tipo,i,f"{col(kx)//100}:{kx['t'][2:4]}",extremo,ext if estado=='corrida' else r_ext,rangos)
            log.append(f"{col(k)//100}:{k['t'][2:4]} confirma retroceso → zona {tipo} "
                       f"{lo:.2f}-{hi:.2f} sobre {col(kx)//100}:{kx['t'][2:4]} [{que}"
                       + (f" mitad {mid:.3f}" if mid else "") + "]")
            ref_actual = kx['l'] if alc else kx['h']
            retros.append((i, ref_actual))
            if z_pend is not None: z_pend.ref=ref_actual; z_pend.r_fin=max(r_ext,i-1); z_pend=None
            # El retroceso es un movimiento en si mismo y su zona TAMBIEN es zona de
            # corrida, pero en sentido contrario. La direccion de la vela de apertura
            # NO sesga la jornada: se opera en los dos sentidos.
            # (confirmado por el operador 27/08/2026, caso del 9 de julio)
            if z is not None and que=='nueva' and z.tipo==tipo:
                z.de_corrida=True; z.dir = -1 if alc else 1
                z.r_ini=i; z.r_fin=None
                z_pend=z
            piv.append((r_ext, D[r_ext]['l'] if alc else D[r_ext]['h'])); pconf.append(i)
            estado='corrida'; ini=i-1; ext=i



    piv.append((ext if estado=='corrida' else r_ext,
                (D[ext]['h'] if alc else D[ext]['l']) if estado=='corrida'
                else (D[r_ext]['l'] if alc else D[r_ext]['h'])))
    pconf.append(None)                       # el ultimo vertice no llega a confirmarse
    return dict(D=D, Z=Z, alc=alc, log=log, b=b, fin=fin, retros=retros, piv=piv, pconf=pconf, fin_v=fin_v)

if __name__=='__main__':
    import sys
    if len(sys.argv) < 3:
        print('uso:  python lector.py <yyyymmdd> <archivo_de_datos.txt> [umbral]')
        sys.exit(1)
    if len(sys.argv) > 3: UMBRAL_VOL = int(sys.argv[3])
    V=cargar(sys.argv[2])
    r=leer_sesion(V, sys.argv[1])
    for l in r['log'][:14]: print(l)
    print('--- zonas ---')
    for z in r['Z']: print(('ACTIVA ' if z.activa else 'inactiva'), z)


# ================================================================ SETUPS
def _libre(Z, i, a, b_):
    lo,hi=min(a,b_),max(a,b_)
    for z in Z:
        if z.i > i: continue
        if z.fin is not None and z.fin <= i: continue
        a,b2=z.en(i)
        if b2 > lo and a < hi: return False, z
    return True, None

def _ref_previa(retros, i):
    r=[e for (j,e) in retros if j <= i]
    return r[-1] if r else None

def _evaluar(Z,i,tipo,nd,e,st,ref=None):
    if (st >= e) if nd>0 else (st <= e):
        return None, "stop al lado equivocado de la entrada (estructura inválida)", None, 0.0
    r=abs(e-st); t = e + r*nd
    if r < TICK*2:
        return None, f"riesgo de {r:.2f} pts — estructura inválida", t, r
    lib,zb=_libre(Z,i,e,t)
    m=[]
    if r>STOP_MAX: m.append(f"riesgo {r:.2f} pts (el máximo son 80)")
    if not lib:    m.append(f"el objetivo choca con {zb}")
    if ref is not None and ((t < ref) if nd<0 else (t > ref)):
        m.append(f"el objetivo pasa del punto de referencia {ref:.2f}")
    if m: return None, " · ".join(m), t, r
    return dict(tipo=tipo,dir=nd,e=e,s=st,t=t,r=r,i=i), None, t, r

def _punto_de_referencia(res, i, e, t, nd):
    """R-41 (14/09/2026) · Devuelve el PUNTO DE REFERENCIA vivo que estorba el
    objetivo de un reingreso, o None si el camino esta libre.

    Punto de referencia = nivel de referencia de un retroceso (R-06), que es
    exactamente un vertice del zigzag. Solo estorban los que quedan ENTRE la
    entrada y el objetivo; manda el mas cercano a la entrada.
    UNIFICADO 14/09/2026: absorbe el filtro viejo que vivia en R-26 (el extremo
    del retroceso que originaba ESA zona). Ya no se limita a ese: vale cualquier
    retroceso vivo. Por eso a _evaluar se le pasa ref=None.
    OJO: se rompe cuando una vela CIERRA mas alla, no con la mecha. Es lo unico
    del plan que se lee por cierre; las zonas se rompen por mecha (R-19 punto 1).
    Solo aplica a REINGRESOS: las continuaciones no lo miran.
    """
    D = res['D']; mejor = None
    for (j, p) in res['piv']:
        if j >= i: continue
        if nd < 0:                                  # objetivo abajo -> mandan los MINIMOS
            if abs(p - D[j]['l']) > 1e-9: continue
            if not (t < p < e): continue
            if any(D[m]['c'] < p for m in range(j+1, i+1)): continue   # roto por cierre
            mejor = p if mejor is None else max(mejor, p)
        else:                                       # objetivo arriba -> mandan los MAXIMOS
            if abs(p - D[j]['h']) > 1e-9: continue
            if not (e < p < t): continue
            if any(D[m]['c'] > p for m in range(j+1, i+1)): continue
            mejor = p if mejor is None else min(mejor, p)
    return mejor

class Fluidez:
    """R-40 · Corrida fluida, plan 3.36 (29/09/2026, sobre la jornada del 1/09, con el operador).

    La vela de apertura dice como EMPIEZA el primer movimiento, no la direccion del dia: cada
    tramo se juzga en su propio sentido. Una zona de corrida (la del tramo n del zigzag, sea
    subida o bajada) da Continuacion en su sentido si el retroceso (tramo n+1) no se pasa y la
    corrida siguiente (n+2) la rompe — tambien si la rompe la misma vela del retroceso.

    Cada sentido lleva su estado:
      'libre'    se opera el IRI fluido
      'espera'   el primer IRI tras un movimiento contrario no se opera (forma C): su zona pasa
                 a ser la barrera
      'segundo'  se opera el IRI fluido cuya zona quede ENTERA mas alla de la barrera
    Lo que lleva a 'segundo', con la barrera en el borde lejano de la zona que falla:
      A · el retroceso se pasa (cae la zona de la corrida; la del retroceso se juzga en su sentido)
      B · la corrida siguiente no la rompe, o la rompe sin consecucion (vence el plazo)
      D · mercado mixto: un tramo pasa del punto donde empezo el ultimo IRI del otro sentido;
          las barreras son la resistencia mas alta y el soporte mas bajo
    Solo cuentan las corridas que dejaron zona (condicion 1): sin zona no hay IRI."""

    def __init__(self, res):
        self.D, self.Z, self.piv, self.pconf = res['D'], res['Z'], res['piv'], res['pconf']
        d0 = 1 if res['alc'] else -1
        self.estado = {d0: ['libre', None], -d0: ['espera', None]}
        self.veto = {}                       # id(zona) -> motivo por el que su rompimiento no se opera
        self.rota = {}                       # id(zona) -> [vela, extremo, consecucion?]
        self.iri = {1: None, -1: None}       # punto donde empezo el ultimo IRI completo de cada sentido
        self.info = {}
        for z in self.Z:
            if not z.de_corrida: continue
            for n in range(1, len(self.piv)):
                j, p = self.piv[n]
                sube = p > self.piv[n-1][1]
                if j == z.i_org and (1 if sube else -1) == z.dir:
                    self.info[id(z)] = n; break
        # La corrida de la APERTURA se juzga siempre, deje zona de corrida o no (30/09/2026, jornadas del
        # 4/09 y el 8/09): si su zona se funde con la de premercado o nace como apendice, no entra en
        # self.info y nadie miraba si su retroceso se pasaba.
        self.apertura = None
        if len(self.piv) > 1 and 1 not in self.info.values():
            self.apertura = dict(d=d0, ini=self.piv[0][1], ext=self.piv[1][1])

    def _lejano(self, z, i):
        lo, hi = z.en(i)
        return hi if z.dir > 0 else lo

    def _segundo(self, d, barrera):
        e = self.estado[d]
        if e[0] == 'segundo' and e[1] is not None:
            barrera = max(e[1], barrera) if d > 0 else min(e[1], barrera)
        self.estado[d] = ['segundo', barrera]

    def vela(self, i, ev, hh):
        """Pone al dia el estado con la vela i. Va ANTES de mirar rompimientos en esa vela."""
        k = self.D[i]; sentido = {1: 'alcista', -1: 'bajista'}
        ap = self.apertura
        if ap is not None:
            fin = self.pconf[2] if len(self.pconf) > 2 else None        # ahi acaba su retroceso
            if fin is not None and i > fin: self.apertura = None
            elif (k['l'] < ap['ini']) if ap['d'] > 0 else (k['h'] > ap['ini']):
                # la barrera: el borde lejano de la zona donde quedo el extremo de la corrida, o el extremo
                dentro = [z for z in self.Z if z.i <= i and z.en(i)[0] - 1e-9 <= ap['ext'] <= z.en(i)[1] + 1e-9]
                if ap['d'] > 0: barrera = max([z.en(i)[1] for z in dentro] + [ap['ext']])
                else:           barrera = min([z.en(i)[0] for z in dentro] + [ap['ext']])
                self._segundo(ap['d'], barrera); self.apertura = None
                ev.append(f"{hh(k)}  se pierde la fluidez {sentido[ap['d']]}: el retroceso se pasa de la corrida "
                          f"de la apertura; se espera un IRI entero más allá de {barrera:.2f} (R-40)")
        for z in self.Z:
            n = self.info.get(id(z))
            if n is None or z.i > i or (z.fin is not None and z.fin < i): continue
            d = z.dir; lo, hi = z.en(i); r = self.rota.get(id(z))
            # A · el retroceso se pasa: el precio va mas alla del arranque de la corrida
            if id(z) not in self.veto and r is None:
                ini = self.piv[n-1][1]
                if (k['l'] < ini) if d > 0 else (k['h'] > ini):
                    self.veto[id(z)] = 'el retroceso se pasó de su corrida'
                    # La zona que deja ese retroceso NO cae con ella (operador, 30/09/2026, sobre el
                    # 20/07): se juzga en su propio sentido, como primer o segundo IRI.
                    self._segundo(d, self._lejano(z, i))
                    ev.append(f"{hh(k)}  se pierde la fluidez {sentido[d]}: el retroceso se pasa de la corrida de {z} (R-40)")
                    continue
            # rompimiento en su sentido (la mecha basta) y su consecucion
            if r is None:
                if (k['h'] > hi + TICK/2) if d > 0 else (k['l'] < lo - TICK/2):
                    self.rota[id(z)] = [i, k['h'] if d > 0 else k['l'], False]
                    if self.estado[d][0] == 'espera':
                        # cuenta como primer IRI aunque ya estuviese descartado por otra cosa: es el
                        # rompimiento que no se opera (16/07: "se debe esperar que genere otro IRI bajista")
                        self.veto.setdefault(id(z), 'es el primer IRI en este sentido tras un movimiento contrario: se espera un segundo IRI')
                        self._segundo(d, self._lejano(z, i))
                elif n+2 < len(self.pconf) and self.pconf[n+2] == i:
                    # B · la corrida siguiente termina sin romperla
                    if id(z) not in self.veto:
                        self.veto[id(z)] = 'la corrida siguiente no la rompió'
                        self._segundo(d, self._lejano(z, i))
                        ev.append(f"{hh(k)}  se pierde la fluidez {sentido[d]}: la corrida siguiente no rompe {z} (R-40)")
                continue
            if r[2] is not False or r[0] >= i: continue
            if (k['h'] > r[1]) if d > 0 else (k['l'] < r[1]):
                r[2] = True
                if id(z) not in self.veto or self.veto[id(z)].startswith('es el primer IRI'):
                    self.iri[d] = self.piv[n-1][1]
                    if self.estado[-d][0] == 'libre': self.estado[-d] = ['espera', None]
            elif i - r[0] >= PLAZO:
                # B · la rompio sin consecucion: esa zona ya no da entrada aunque se vuelva a romper
                r[2] = None
                self.veto[id(z)] = 'la rompió sin consecución y se devolvió'
                self._segundo(d, self._lejano(z, i))
                ev.append(f"{hh(k)}  se pierde la fluidez {sentido[d]}: {z} rota sin consecución (R-40)")
        # D · mercado mixto
        for d in (1, -1):
            ini = self.iri[d]
            if ini is None or not ((k['l'] < ini) if d > 0 else (k['h'] > ini)): continue
            vistas = [z for z in self.Z if z.i <= i]
            if not vistas: continue
            self.iri = {1: None, -1: None}
            arriba = max(z.en(i)[1] for z in vistas); abajo = min(z.en(i)[0] for z in vistas)
            self.estado = {1: ['segundo', arriba], -1: ['segundo', abajo]}
            ev.append(f"{hh(k)}  mercado mixto: pasa del inicio del IRI {sentido[d]} ({ini:.2f}); "
                      f"se espera un IRI por fuera de {abajo:.2f} – {arriba:.2f} (R-40)")
            break

    def permiso(self, z, i):
        """(True, None) si el rompimiento de z en su sentido se opera; si no, (False, motivo)."""
        if id(z) not in self.info: return False, 'la zona no sale de una corrida del zigzag'
        if id(z) in self.veto: return False, self.veto[id(z)]
        d = z.dir; e = self.estado[d]
        if e[0] == 'segundo' and e[1] is not None:
            lo, hi = z.en(i)
            if not ((lo > e[1]) if d > 0 else (hi < e[1])):
                return False, f"rompimiento directo: la zona no queda entera más allá de {e[1]:.2f}"
        self.estado[d] = ['libre', None]
        return True, None

def o_pausa(o): return o.get('pausa') is not None

def _colocar(o, tag, ev, dia, k):
    """R-35: una orden que se colocaria dentro de la ventana de una noticia roja se aplaza."""
    T = _noticia(dia, _minutos(k), VENTANA_NOTICIA)
    if T is None:
        ev.append(tag+"  ✓ orden enviada")
    else:
        o['pausa']=T
        ev.append(tag+f"  ✓ setup válido · la orden se aplaza: ventana de la noticia roja de las {_hhmm(T)} (R-35)")
    return o

def detectar_setups(res, solo_reingresos=False):
    D,Z,b,fin,retros = res['D'],res['Z'],res['b'],res['fin'],res['retros']
    ev=[]; orden=None; trade=None
    dia = D[b]['d']
    # reingresos evaluados en la jornada: (vela, entrada, objetivo, sentido).
    # R-41: los puntos de control SOLO se dibujan cuando se presenta un reingreso.
    res['reingresos']=[]
    def hh(k): return f"{col(k)//100}:{k['t'][2:4]}"
    flu = Fluidez(res)

    for i in range(b, fin+1):
        k=D[i]

        # ---------- consecucion de rompimientos previos ----------
        for z in Z:
            if z.roto and not z.consec and z.roto[1] < i and i-z.roto[1] <= PLAZO:
                if (z.roto[0]=='arriba' and k['h']>z.roto[2]) or (z.roto[0]=='abajo' and k['l']<z.roto[2]):
                    z.consec=True; z.i_consec=i; z.rein_ok=True
                    z.consec_ext = k['h'] if z.roto[0]=='arriba' else k['l']
            elif z.consec and z.rein_ok and z.i_consec is not None and i > z.i_consec:
                # EL REINGRESO ES INMEDIATO. Si el precio pasa del extremo de la vela de
                # consecucion, el rompimiento quedo bueno y la ventana se cierra para
                # siempre.  (operador 27/08/2026, comparacion 6 vs 13 de julio)
                if (z.roto[0]=='arriba' and k['h'] > z.consec_ext) or \
                   (z.roto[0]=='abajo'  and k['l'] < z.consec_ext):
                    z.rein_ok=False

        # ---------- rompimiento de las zonas de premercado (R-15, cierra la mitad de P-34) ----------
        # Hasta el 28/09/2026 un rompimiento solo se anotaba en el bloque de Continuacion, que exige
        # zona de corrida: el de una zona de premercado no se anotaba nunca y el motor no podia ver un
        # Reingreso sobre ella (11/09/2026, 9:01). R-15: se comporta como cualquier zona, asi que se
        # anota con el mismo criterio que las de corrida — la resistencia hacia arriba, el soporte
        # hacia abajo, una vez por zona —, en cualquier vela de la ventana, la base incluida, y
        # aunque haya una orden puesta. Solo sirve para el Reingreso: la Continuacion necesita el IRI
        # que crea su zona (R-25), y una zona de premercado no nace de ninguna corrida.
        # Una zona 'P' (la ventana abrio dentro) no tiene papel hasta que sale: su rompimiento se
        # busca desde la vela siguiente a la que se lo dio (R-22). Su salida no se anota como
        # rompimiento: el plan no dice si puede fallar y dar Reingreso.
        for z in Z:
            if not z.pm or z.roto or (z.fin is not None and z.fin < i): continue
            if z.tipo=='P' or (z.i_papel is not None and i <= z.i_papel): continue
            zlo,zhi=z.en(i)
            if   z.tipo=='R' and k['l']<=zhi and k['h'] > zhi+TICK/2: z.roto=('arriba',i,k['h'])
            elif z.tipo=='S' and k['h']>=zlo and k['l'] < zlo-TICK/2: z.roto=('abajo', i,k['l'])
            else: continue
            ev.append(f"{hh(k)}  rompimiento de {z} — zona de premercado: sin Continuación, "
                      f"queda para el Reingreso")
        if i==b: continue                              # la vela base solo cuenta para esos rompimientos
        flu.vela(i, ev, hh)

        # ---------- llenado / caducidad ----------
        T_vela = _noticia(dia, _minutos(k), 4) if orden and not trade else None
        if orden and not trade and o_pausa(orden) and T_vela is None:
            # R-35, CONFIRMADO POR EL OPERADOR 28/09/2026: pasado T+5 se entra solo si el setup sigue
            # vivo y cumpliendo reglas; si no, se espera otro setup. Si con la orden retirada el precio
            # paso del nivel de entrada, ya no hay orden stop que poner (mercado y limite, prohibidas).
            # Los filtros se vuelven a pasar con las zonas de ahora.
            o = orden; motivo = None
            if o.get('cruzo'):
                motivo = f"el precio pasó de la entrada ({o['e']:.2f}) mientras estaba retirada"
            else:
                o2, m2, t2, _ = _evaluar(Z, i, o['tipo'], o['dir'], o['e'], o['s'])
                if o2 is None: motivo = m2
                elif o['tipo'] == 'Reingreso':
                    pr = _punto_de_referencia(res, i, o['e'], t2, o['dir'])
                    if pr is not None: motivo = f"el objetivo pasa del punto de referencia {pr:.2f}"
            T0 = o.pop('pausa')
            if motivo:
                ev.append(f"{hh(k)}  orden no se recoloca tras la noticia de las {_hhmm(T0)} — {motivo}"); orden=None
            else:
                ev.append(f"{hh(k)}  orden recolocada pasada la noticia de las {_hhmm(T0)}")
        if orden and not trade:
            o=orden
            # La caducidad se mira ANTES del llenado: pasado el plazo la orden ya no existe.
            if i - o['i'] > PLAZO:
                ev.append(f"{hh(k)}  orden cancelada — 5 velas sin consecución"); orden=None
            elif T_vela is not None or o_pausa(o):
                # R-35: dentro de la ventana la orden no esta puesta: no se llena.
                if not o_pausa(o):
                    o['pausa']=T_vela
                    ev.append(f"{hh(k)}  orden retirada — ventana de la noticia roja de las {_hhmm(T_vela)} (R-35)")
                if (k['h']>=o['e']) if o['dir']>0 else (k['l']<=o['e']): o['cruzo']=True
            elif (((k['l'] <= o['s']) and (k['c'] >= k['o'])) if o['dir']>0
                  else ((k['h'] >= o['s']) and (k['c'] <  k['o']))):
                # CONFIRMADO POR EL OPERADOR 23/09/2026 (R-29) — era propuesta desde el 14/09.
                # La vela toca el nivel de la orden Y el punto del stop. Se aplica la
                # convencion intravela que el plan ya usa para las zonas (R-19 punto 6):
                # vela azul = minimo primero, vela blanca = maximo primero. Si el punto
                # del stop llega antes, la orden se CANCELA (R-29) y no llega a llenarse.
                ev.append(f"{hh(k)}  orden cancelada — el precio volvió al punto del stop "
                          f"({o['s']:.2f}) antes de llenar, por el orden dentro de la vela"); orden=None
            elif (k['h']>=o['e']) if o['dir']>0 else (k['l']<=o['e']):
                trade=dict(**o,i_fill=i,hora=hh(k))
                ev.append(f"{hh(k)}  ►► SE LLENA el {o['tipo']} {'alcista' if o['dir']>0 else 'bajista'} en {o['e']:.2f}")
                # R-33: la operacion sigue hasta stop u objetivo AUNQUE acabe la ventana. Se mira
                # hasta la ultima vela que haya en los datos, no hasta el fin de ventana (06/10/2026:
                # la del dia se lleno a las 10:07 y a las 10:30 seguia viva; el AddOn vuelve a
                # exportar con mas tiempo los dias que quedan ABIERTO).
                ult=len(D)-1
                for j in range(i,ult+1):
                    kk=D[j]
                    pier=(kk['l']<=trade['s']) if trade['dir']>0 else (kk['h']>=trade['s'])
                    gana=(kk['h']>=trade['t']) if trade['dir']>0 else (kk['l']<=trade['t'])
                    if pier: trade.update(res='STOP',pts=-trade['r'],i_out=j,h_out=hh(kk)); break
                    if gana: trade.update(res='TARGET',pts=trade['r'],i_out=j,h_out=hh(kk)); break
                else: trade.update(res='ABIERTO',pts=None,i_out=ult,h_out=hh(D[ult]))
                break
            # CANCELACION (operador 27/08/2026): un retroceso nuevo NO cancela.
            # Solo cancela (a) que pasen 5 velas sin consecucion, o (b) que el precio
            # vuelva al extremo del retroceso, que es el mismo punto del stop.
            if orden and ((k['l'] <= o['s']) if o['dir']>0 else (k['h'] >= o['s'])):
                ev.append(f"{hh(k)}  orden cancelada — el precio volvió al punto del stop "
                          f"({o['s']:.2f})"); orden=None
            elif orden and hm(k)>=res['fin_v']-1:      # 10:29 Col en verano, 11:29 en invierno
                ev.append(f"{hh(k)}  orden cancelada — fin de ventana"); orden=None
        if orden: continue

        vivas=[z for z in Z if z.i<=i and (z.fin is None or z.fin>=i)]

        # ---------- REINGRESO ----------
        for z in vivas:
            if not (z.roto and z.consec and z.rein_ok) or z.roto[1] >= i: continue
            d=z.roto[0]
            zlo,zhi=z.en(i)
            if   d=='arriba' and k['h']>=zhi and k['l']<zlo: nd=-1
            elif d=='abajo'  and k['l']<=zlo and k['h']>zhi: nd=+1
            else: continue
            # CONFIRMADO POR EL OPERADOR 28/09/2026 (R-26, cierra P-38): si la consecucion
            # llega en ESTA misma vela, solo es reingreso si la consecucion fue primero.
            # Lo dice el color, como en R-09 y R-29: bajista -> vela blanca (maximo
            # primero); alcista -> vela azul (minimo primero). Sin cuerpo: la consecucion
            # cuenta, pero esta vela no es de reingreso; se mira lo que viene despues.
            if z.i_consec == i and not ((k['c'] < k['o']) if nd < 0 else (k['c'] > k['o'])):
                continue
            seg=range(z.roto[1], i+1)
            st = max(D[j]['h'] for j in seg) if nd<0 else min(D[j]['l'] for j in seg)
            e  = k['l']-TICK if nd<0 else k['h']+TICK
            # R-41 unificado: el filtro del punto de referencia ya no es el de R-26
            # (z.ref), por eso va ref=None. Lo aplica _punto_de_referencia, abajo.
            o,motivo,t,r=_evaluar(Z,i,'Reingreso',nd,e,st,None)
            if t is not None: res['reingresos'].append((i,e,t,nd))
            if o is not None:
                pr=_punto_de_referencia(res,i,e,t,nd)
                if pr is not None:
                    o, motivo = None, f"el objetivo pasa del punto de referencia {pr:.2f}" 
            tag=(f"{hh(k)}  REINGRESO {'bajista' if nd<0 else 'alcista'} · entrada {e:.2f} · stop {st:.2f}"
                 + (f" · objetivo {t:.2f} · riesgo {r:.2f}" if t else ""))
            if o: orden=_colocar(o, tag, ev, dia, k)
            else: ev.append(tag+f"  ✗ descartado — {motivo}")
            break
        if orden: continue

        # ---------- ROMPIMIENTO -> CONTINUACION (el setup que se llamaba IRI) ----------
        # DIA DE FED (R-36) — 24/09/2026, fase 7 del Trading Journal, con el OK del operador.
        # Hasta hoy este bloque se saltaba entero en dia de Fed: no se anotaba ningun rompimiento y,
        # sin rompimiento anotado, el motor no podia ver NINGUN reingreso, que es justo el unico setup
        # permitido ese dia (DISCREPANCIAS, 16/09/2026). Ahora el rompimiento se anota siempre y lo que
        # se salta es solo la ORDEN de continuacion. Efecto: el 8/07 aparece un reingreso, que Cowork
        # tiene que revalidar (PROPUESTAS_AL_PLAN, 24/09/2026).
        for z in vivas:
            if z.roto or not z.de_corrida or z.r_ini is None: continue
            zlo,zhi=z.en(i); nd=z.dir
            if   nd>0 and k['l']<=zhi and k['h'] > zhi+TICK/2: d,e0='arriba',k['h']
            elif nd<0 and k['h']>=zlo and k['l'] < zlo-TICK/2: d,e0='abajo', k['l']
            else: continue
            z.roto=(d,i,e0)
            if solo_reingresos:
                ev.append(f"{hh(k)}  rompimiento de {z} — día de Fed: no se opera la continuación")
                break
            # R-40 (14/09/2026): no se entra en el rompimiento de una zona cuyo
            # RETROCESO fue mayor que la CORRIDA que la creo. Ojo al ORDEN de estas
            # lineas: el rompimiento se REGISTRA (z.roto, arriba) y solo despues se
            # descarta la ORDEN. Si se filtrase antes, el rompimiento no quedaria
            # anotado y el reingreso de R-26 —que nace justo de un rompimiento que
            # falla— se volveria invisible. El veto es solo para ESTA entrada de
            # continuacion; la zona sigue viva y el reingreso no se toca.
            ok, motivo = flu.permiso(z, i)
            if not ok:
                ev.append(f"{hh(k)}  rompimiento de {z} ✗ no se opera — {motivo} (R-40)")
                break
            # El stop es el extremo que haya hecho el mercado DESDE QUE NACIO LA ZONA
            # HASTA EL ROMPIMIENTO, no solo el techo/suelo del retroceso que la origino.
            # (confirmado por el operador 27/08/2026, caso del 7 de julio a las 9:36)
            seg=list(range(z.r_ini, i+1))
            st = min(D[j]['l'] for j in seg) if nd>0 else max(D[j]['h'] for j in seg)
            e=e0+TICK*nd
            o,motivo,t,r=_evaluar(Z,i,'Continuación',nd,e,st)
            tag=(f"{hh(k)}  CONTINUACIÓN {'alcista' if nd>0 else 'bajista'} · entrada {e:.2f} · stop {st:.2f}"
                 + (f" · objetivo {t:.2f} · riesgo {r:.2f}" if t else ""))
            if o: orden=_colocar(o, tag, ev, dia, k)
            else: ev.append(tag+f"  ✗ descartado — {motivo}")
            break
    # La orden que sigue puesta (o aplazada por noticia) al acabar los datos: en vivo, la que el bot
    # tiene que tener en el mercado ahora mismo (06/10/2026). Con el dia entero suele ser None.
    res['orden'] = None if trade else orden
    return ev, trade

def decidir(V, dia, hasta=None):
    """Lo que el motor sabe al CIERRE de la vela `hasta` (indice en V; None = la ultima): el motor
    entero sobre las velas cerradas hasta ahi, como lo corre el bot en vivo (MotorChaumer.cs, D-038).
    Comprobado el 06/10/2026 en 33 dias y 1.463 velas: vela a vela decide exactamente lo mismo que
    con el dia entero. Devuelve (res, eventos, trade); res['orden'] es la orden que debe estar viva."""
    corte = V if hasta is None else V[:hasta+1]
    r = leer_sesion(corte, dia, minimo=1)
    if not r or 'error' in r: return r, [], None
    ev, trade = detectar_setups(r, solo_reingresos=dia in FOMC)
    return r, ev, trade
