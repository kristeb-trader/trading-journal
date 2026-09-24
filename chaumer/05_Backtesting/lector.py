# -*- coding: utf-8 -*-
"""
LECTOR CHAUMER  ·  reescrito 2026-08-26 con las reglas confirmadas por el operador.
HERRAMIENTA DE AUDITORIA. No es una herramienta operativa.
Vive en 05_Backtesting, fuera de 01_Plan.
"""
TICK = 0.25
STOP_MAX = 80.0

# Umbral de volumen del premercado (PARAMETROS.md).
# PARAMETRO AJUSTABLE desde el 14/09/2026 (R-15): no es un numero fijo del metodo.
#   MNQ  ->  8000   <- valor del plan desde el 14/09/2026
#   MNQ  ->  6000   <- valor del 06/09 al 14/09/2026
#   NQ   ->  2000   <- solo para releer el archivo historico 'NQ 09-26.Last.txt'
# Para cambiarlo desde fuera:  lector.UMBRAL_VOL = 2000
# Pendiente P-37: el criterio de ajuste lo fija el operador (cerrado 14/09/2026).
UMBRAL_VOL = 8000
PLAZO = 5            # velas para la consecucion

# Dias de FOMC: solo se operan Reingresos, nunca Continuacion (antes IRI).
# Julio 2026 confirmado por el operador (26/08/2026). Agosto: PENDIENTE de confirmar.
FOMC = {'20260708','20260729','20260916'}

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
    for i,k in enumerate(V):
        if hm(k)>=1331: break
        if k['v']<=UMBRAL_VOL: continue
        if k['c']>=k['o']: lo,hi=z_res(k); Z.append(Zona(lo,hi,'R',i,f"{col(k)//100}:{k['t'][2:4]} pm"))
        else:              lo,hi=z_sop(k); Z.append(Zona(lo,hi,'S',i,f"{col(k)//100}:{k['t'][2:4]} pm"))
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
def leer_sesion(V, dia):
    D=[k for k in V if k['d']==dia]
    if not D: return None
    Z = zonas_premercado(D)
    S=[i for i,k in enumerate(D) if 1331<=hm(k)<=1530]
    if len(S)<30: return None   # no es una jornada americana completa
    b=S[0]                                   # indice de la vela base 08:31
    base=D[b]
    if base['c']==base['o']:
        return dict(error='vela base sin cuerpo (P-23)')
    alc = base['c']>base['o']                # direccion del dia

    ref_actual=None; z_pend=None
    rangos=[]        # bandas entre zonas ya resueltas: una sola zona por banda y por jornada
    log=[]
    log.append(f"08:31 vela base {'ALCISTA' if alc else 'BAJISTA'} "
               f"(abre {base['o']:.2f} cierra {base['c']:.2f})")

    estado='corrida'
    ini=b                                    # primera vela de la corrida (origen)
    ext=b                                    # vela con el extremo de la corrida
    r_ini=None; r_ext=None                   # retroceso
    retros=[]                                # (i_confirma, extremo)
    piv=[(b, D[b]['l'] if alc else D[b]['h'])]   # zigzag de corridas y retrocesos

    fin = S[-1]
    for i in range(b+1, fin+1):
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
                            z.lo=min(z.lo,kr['l']); z.hist.append((i,z.lo,z.hi))
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
                            z.hi=max(z.hi,kr['h']); z.hist.append((i,z.lo,z.hi))
                            log.append(f"{col(k)//100}:{k['t'][2:4]} plazo vencido → se ESTIRA "
                                       f"la zona a {z.lo:.2f}-{z.hi:.2f}")
                    # El rompimiento SIGUE pendiente: si algun dia llega la consecucion,
                    # la zona queda traspasada igual.
                    z.pend=(d,ir,ex,True)
            if z.pend is None and not resuelto:
                # La vela que confirma un traspaso NO abre a la vez el rompimiento del
                # otro lado: el rompimiento contrario se busca a partir de la SIGUIENTE.
                # (operador 27/08/2026, 13 de julio: 8:58 y 9:18)
                # una zona nace con el precio a UN lado: ese lado es su casa y no cuenta.
                # ROMPIMIENTO = pasar 1 tick del borde, la mecha basta (el cierre da igual).
                if z.tipo=='R':
                    if   not z.arriba and k['h'] > z.hi: z.pend=('arriba',i,k['h'],False)
                    elif z.arriba and not z.abajo and k['l'] < z.lo: z.pend=('abajo',i,k['l'],False)
                else:
                    if   not z.abajo and k['l'] < z.lo: z.pend=('abajo',i,k['l'],False)
                    elif z.abajo and not z.arriba and k['h'] > z.hi: z.pend=('arriba',i,k['h'],False)
            if z.arriba and z.abajo: z.fin=i
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
            piv.append((ext, D[ext]['h'] if alc else D[ext]['l']))
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
            piv.append((r_ext, D[r_ext]['l'] if alc else D[r_ext]['h']))
            estado='corrida'; ini=i-1; ext=i



    piv.append((ext if estado=='corrida' else r_ext,
                (D[ext]['h'] if alc else D[ext]['l']) if estado=='corrida'
                else (D[r_ext]['l'] if alc else D[r_ext]['h'])))
    return dict(D=D, Z=Z, alc=alc, log=log, b=b, fin=fin, retros=retros, piv=piv)

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

SOLO_ZONA_DE_CORRIDA = True   # variante en prueba

def _mapa_fluidez(res):
    """R-40 · Corrida fluida. Las parejas corrida-retroceso NO se solapan: la
    vela de apertura declara el sentido, asi que las piernas 1,3,5... son
    corridas y las 2,4,6... sus retrocesos. Tras una pareja rota la cuenta
    vuelve a empezar con la corrida siguiente."""
    piv = res['piv']; D = res['D']
    def caja(n):
        d = 1 if piv[n][1] > piv[n-1][1] else -1
        k = D[piv[n][0]]
        return (d, max(k['o'],k['c']), k['h']) if d > 0 else (d, k['l'], min(k['o'],k['c']))
    estado = {}; barrera = {1: None, -1: None}
    def bloquear(n):
        if n >= len(piv): return
        d, lo, hi = caja(n); estado[piv[n][0]] = False
        nb = hi if d > 0 else lo; b = barrera[d]
        if b is None or ((nb > b) if d > 0 else (nb < b)): barrera[d] = nb
    for n in range(1, len(piv)-1, 2):
        corrida   = abs(piv[n][1]   - piv[n-1][1])
        retroceso = abs(piv[n+1][1] - piv[n][1])
        if retroceso > corrida:
            bloquear(n); bloquear(n+1); continue
        for m, es_corrida in ((n, True), (n+1, False)):
            if m >= len(piv): break
            if es_corrida is False and SOLO_ZONA_DE_CORRIDA:
                bloquear(m); continue
            d, lo, hi = caja(m); ok = True
            if m+2 < len(piv):
                ext = piv[m+2][1]
                if (ext <= hi) if d > 0 else (ext >= lo): ok = False
            b = barrera[d]
            if b is not None and ((lo <= b) if d > 0 else (hi >= b)): ok = False
            estado[piv[m][0]] = ok
            if not ok: bloquear(m)
    return estado

def _veto_R40(res, z):
    if '_fluidez' not in res: res['_fluidez'] = _mapa_fluidez(res)
    return not res['_fluidez'].get(z.i_org, False)

def detectar_setups(res, solo_reingresos=False):
    D,Z,b,fin,retros = res['D'],res['Z'],res['b'],res['fin'],res['retros']
    ev=[]; orden=None; trade=None
    # reingresos evaluados en la jornada: (vela, entrada, objetivo, sentido).
    # R-41: los puntos de control SOLO se dibujan cuando se presenta un reingreso.
    res['reingresos']=[]
    def hh(k): return f"{col(k)//100}:{k['t'][2:4]}"

    for i in range(b+1, fin+1):
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

        # ---------- llenado / caducidad ----------
        if orden and not trade:
            o=orden
            # La caducidad se mira ANTES del llenado: pasado el plazo la orden ya no existe.
            if i - o['i'] > PLAZO:
                ev.append(f"{hh(k)}  orden cancelada — 5 velas sin consecución"); orden=None
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
                for j in range(i,fin+1):
                    kk=D[j]
                    pier=(kk['l']<=trade['s']) if trade['dir']>0 else (kk['h']>=trade['s'])
                    gana=(kk['h']>=trade['t']) if trade['dir']>0 else (kk['l']<=trade['t'])
                    if pier: trade.update(res='STOP',pts=-trade['r'],i_out=j,h_out=hh(kk)); break
                    if gana: trade.update(res='TARGET',pts=trade['r'],i_out=j,h_out=hh(kk)); break
                else: trade.update(res='ABIERTO',pts=None,i_out=fin,h_out=hh(D[fin]))
                break
            # CANCELACION (operador 27/08/2026): un retroceso nuevo NO cancela.
            # Solo cancela (a) que pasen 5 velas sin consecucion, o (b) que el precio
            # vuelva al extremo del retroceso, que es el mismo punto del stop.
            if orden and ((k['l'] <= o['s']) if o['dir']>0 else (k['h'] >= o['s'])):
                ev.append(f"{hh(k)}  orden cancelada — el precio volvió al punto del stop "
                          f"({o['s']:.2f})"); orden=None
            elif orden and col(k)>=1029:
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
            if o: ev.append(tag+"  ✓ orden enviada"); orden=o
            else: ev.append(tag+f"  ✗ descartado — {motivo}")
            break
        if orden: continue

        # ---------- ROMPIMIENTO -> CONTINUACION (el setup que se llamaba IRI) ----------
        for z in ([] if solo_reingresos else vivas):
            if z.roto or not z.de_corrida or z.r_ini is None: continue
            zlo,zhi=z.en(i); nd=z.dir
            if   nd>0 and k['l']<=zhi and k['h'] > zhi+TICK/2: d,e0='arriba',k['h']
            elif nd<0 and k['h']>=zlo and k['l'] < zlo-TICK/2: d,e0='abajo', k['l']
            else: continue
            z.roto=(d,i,e0)
            # R-40 (14/09/2026): no se entra en el rompimiento de una zona cuyo
            # RETROCESO fue mayor que la CORRIDA que la creo. Ojo al ORDEN de estas
            # lineas: el rompimiento se REGISTRA (z.roto, arriba) y solo despues se
            # descarta la ORDEN. Si se filtrase antes, el rompimiento no quedaria
            # anotado y el reingreso de R-26 —que nace justo de un rompimiento que
            # falla— se volveria invisible. El veto es solo para ESTA entrada de
            # continuacion; la zona sigue viva y el reingreso no se toca.
            if _veto_R40(res, z):
                ev.append(f"{hh(k)}  rompimiento de {z} ✗ no se opera — la corrida no es fluida (R-40)")
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
            if o: ev.append(tag+"  ✓ orden enviada"); orden=o
            else: ev.append(tag+f"  ✗ descartado — {motivo}")
            break
    return ev, trade
