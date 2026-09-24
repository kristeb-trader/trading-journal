# -*- coding: utf-8 -*-
"""
GRAFICA ESTANDAR DE BACKTESTING  (formato acordado con el operador 27/08/2026)

  · zonas marcadas, todas del mismo gris
  · zigzag blanco de corridas y retrocesos
  · el grafico se CORTA en la vela donde la operacion da su resultado.
    Solo llega hasta las 10:30 cuando la jornada no dio ningun setup valido.
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
import lector, sys, calendar

BG='#0B0E14'; UP='#2E86FF'; DN='#FFFFFF'; GREY='#8B93A7'; GOLD='#F5C542'; RED='#FF5C5C'; NAR='#FF9A3C'
CY='#22D3EE'; GRN='#4ADE80'
MES={'01':'ENERO','02':'FEBRERO','03':'MARZO','04':'ABRIL','05':'MAYO','06':'JUNIO',
     '07':'JULIO','08':'AGOSTO','09':'SEPTIEMBRE','10':'OCTUBRE','11':'NOVIEMBRE','12':'DICIEMBRE'}
DIAS=['LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO','DOMINGO']

def dibujar(dia, salida, datos):
    V=lector.cargar(datos)
    fomc = dia in lector.FOMC
    r=lector.leer_sesion(V,dia)
    ev,t=lector.detectar_setups(r, solo_reingresos=fomc)
    D,Z,b,fin=r['D'],r['Z'],r['b'],r['fin']

    # ---- el corte: la vela donde la operacion da resultado, o el fin de ventana
    corte = t['i_out'] if (t and t.get('i_out') is not None) else fin
    # Al LLENARSE la orden termina el analisis del dia: no se marcan mas zonas.
    # (R-34, confirmado por el operador el 01/09/2026 sobre el 17 de julio)
    corte_z = t['i_fill'] if (t and t.get('i_fill') is not None) else corte
    S=list(range(b,corte+1)); off=b; N=len(S); W=N+9.0

    fig,ax=plt.subplots(figsize=(20,10.6),facecolor=BG)
    fig.subplots_adjust(top=.79,bottom=.105,left=.055,right=.985)

    for i in S:
        k=D[i]; x=i-off; c=UP if k['c']>=k['o'] else DN
        lw = 2.4 if N<=60 else (1.6 if N<=100 else 1.1)
        ax.plot([x,x],[k['l'],k['h']],color=c,lw=lw,zorder=4)
        lo,hi=min(k['o'],k['c']),max(k['o'],k['c'])
        an = .32 if N<=60 else (.34 if N<=100 else .36)
        ax.add_patch(Rectangle((x-an,lo),an*2,max(hi-lo,.25),facecolor=c,edgecolor=c,lw=.6,zorder=5))

    ylo=min(D[i]['l'] for i in S); yhi=max(D[i]['h'] for i in S)
    if t: ylo=min(ylo,t['s'],t['t'],t['e']); yhi=max(yhi,t['s'],t['t'],t['e'])
    pad=(yhi-ylo)*.07
    ax.set_facecolor(BG); ax.set_xlim(-1,W); ax.set_ylim(ylo-pad,yhi+pad)

    if N<=22:   marcas=None
    elif N<=60: marcas=('0','5')
    else:       marcas=('00','15','30','45')
    if marcas is None: tk=list(range(N))
    elif len(marcas[0])==1: tk=[i-off for i in S if D[i]['t'][3:4] in marcas]
    else: tk=[i-off for i in S if D[i]['t'][2:4] in marcas]
    ax.set_xticks(tk)
    ax.set_xticklabels([f"{lector.col(D[i+off])//100}:{D[i+off]['t'][2:4]}" for i in tk],
                       color=GREY,fontsize=11.5,rotation=90 if N<=22 else 0)
    ax.tick_params(colors=GREY,labelsize=11.5,length=0); ax.grid(False)
    for nm,s in ax.spines.items():
        if nm in ('bottom','left'):
            s.set_visible(True); s.set_color('#3A4256'); s.set_linewidth(1.2)
        else: s.set_visible(False)
    ax.tick_params(axis='y',colors=GREY,labelsize=11.5,length=4,color='#3A4256')

    # ---- zonas (solo las nacidas antes del corte)
    n=0; viva=0; etiquetas=[]
    for z in Z:
        if z.i > corte_z: continue
        n+=1
        x0=max(z.i_org-off,-1); x1=(z.fin-off) if (z.fin is not None and z.fin<=corte_z) else W
        zl,zh=z.en(corte_z)
        vig = (z.fin is None or z.fin>corte_z)
        if vig: viva+=1
        ax.add_patch(Rectangle((x0-.45,zl),x1-x0+.45,zh-zl,facecolor=GREY,
                     alpha=.28 if vig else .10,edgecolor=GREY,lw=1.5 if vig else .7,zorder=2))
        if vig:
            et='resistencia' if z.tipo=='R' else 'soporte'
            etiquetas.append([(zl+zh)/2, f"{et}   {zl:,.2f} – {zh:,.2f}".replace(',','.')])
    etiquetas.sort(key=lambda e:e[0]); sep=(yhi-ylo)*.042
    for j in range(1,len(etiquetas)):
        if etiquetas[j][0]-etiquetas[j-1][0] < sep: etiquetas[j][0]=etiquetas[j-1][0]+sep
    for yy,txt in etiquetas:
        ax.text(W-.2,yy,txt,color=GREY,fontsize=11,fontweight='bold',ha='right',va='center',zorder=10)

    # ---- puntos de referencia (R-41, unificado 14/09/2026)
    # Solo se dibujan si en la jornada se presento un reingreso: "la idea es tener
    # el grafico lo mas limpio posible" (operador, 14/09/2026). Se pintan los que
    # seguian VIVOS en la vela del reingreso y quedan del lado del objetivo.
    for (ir, er, tr, ndr) in r.get('reingresos', []):
        if ir > corte_z: continue
        for (j, pv) in r['piv']:
            if j >= ir: continue
            bajo = abs(pv - D[j]['l']) < 1e-9
            if (ndr < 0) != bajo: continue
            fuera = (pv >= er) if ndr < 0 else (pv <= er)
            if fuera: continue
            roto = None
            for m in range(j+1, corte+1):
                if (D[m]['c'] < pv) if bajo else (D[m]['c'] > pv):
                    roto = m; break
            if roto is not None and roto <= ir: continue      # ya estaba roto
            x0 = max(j-off, -1); x1 = (roto-off+1) if roto is not None else W
            vivo = roto is None
            ax.plot([x0, x1], [pv, pv], color=NAR, lw=2.0 if vivo else 1.1,
                    ls=(0, (2, 3)), alpha=.80 if vivo else .25, zorder=6)
            ax.text(x1-.3, pv, "punto de referencia", color=NAR, fontsize=10.5,
                    fontweight='bold', ha='right', va='bottom',
                    alpha=.9 if vivo else .35, zorder=11)

    # ---- zigzag de corridas y retrocesos
    P=[(i-off,p) for (i,p) in r['piv'] if b<=i<=corte]
    if len(P)>1:
        X_=[x for x,_ in P]; Y_=[y for _,y in P]
        ax.plot(X_,Y_,color=BG,lw=5.2,solid_capstyle='round',zorder=7)
        ax.plot(X_,Y_,color='#FFFFFF',lw=2.3,solid_capstyle='round',zorder=8)
        ax.plot(X_,Y_,'o',color='#FFFFFF',ms=5,mec=BG,mew=1.2,zorder=9)

    # ---- la operacion
    if t:
        x=t['i_fill']-off; xo=t['i_out']-off
        cres = GRN if t['res']=='TARGET' else RED
        # sin lineas de entrada / stop / objetivo: la regla ya las dice.
        # (operador, 01/09/2026: cuanto mas limpio el grafico, mejor)
        # regla de la operacion: area de stop en rojo, area de objetivo en verde,
        # solo sobre la zona de la entrada, no en todo el ancho de la ventana.
        rx0 = t['i']-off-.5; rx1 = xo+.5
        ax.add_patch(Rectangle((rx0,min(t['e'],t['s'])),rx1-rx0,abs(t['s']-t['e']),
                     facecolor=RED,alpha=.13,edgecolor='none',zorder=1))
        ax.add_patch(Rectangle((rx0,min(t['e'],t['t'])),rx1-rx0,abs(t['t']-t['e']),
                     facecolor=GRN,alpha=.13,edgecolor='none',zorder=1))
        der = x < N*0.55
        ax.annotate(f"{t['tipo']} {'alcista' if t['dir']>0 else 'bajista'} · {t['hora']}",
                    xy=(x+(.4 if der else -.4),t['e']),
                    xytext=(x+(2.0 if der else -2.0),t['e']+t['dir']*(yhi-ylo)*.07),color=cres,fontsize=13,
                    fontweight='bold',ha='left' if der else 'right',va='center',
                    arrowprops=dict(arrowstyle='-|>',color=cres,lw=1.8,mutation_scale=14),zorder=11)
        sig='+' if (t['pts'] or 0)>=0 else ''
        sub=(f"Operación · {t['tipo']} {'alcista' if t['dir']>0 else 'bajista'} a las {t['hora']} · "
             f"entrada {t['e']:.2f} · stop {t['s']:.2f} · objetivo {t['t']:.2f} · "
             f"riesgo {t['r']:.2f} pts   →   {t['res']} en {t.get('h_out','')} · "
             f"{sig}{t['pts']:.2f} pts = {sig}{t['pts']*2:.2f} USD")
        cierre=''
    else:
        sub='NO HAY OPERACIÓN en toda la ventana'
        cierre=''

    if fomc:
        ax.text(.5,.045,'DÍA DE FOMC  ·  no se toman entradas de continuación, solo reingresos',
                transform=ax.transAxes,color=GOLD,fontsize=14.5,fontweight='bold',ha='center',
                bbox=dict(boxstyle='round,pad=0.55',facecolor='#241E06',edgecolor=GOLD,lw=1.6),zorder=12)

    y,m,d=dia[:4],dia[4:6],dia[6:]
    nd=DIAS[calendar.weekday(int(y),int(m),int(d))]
    ax.set_title(f"{nd} {int(d)} DE {MES[m]} DE {y}",
                 color='#FFFFFF',fontsize=21,fontweight='bold',loc='center',pad=84)
    ax.text(0,1.072,f"{n} zonas marcadas · {viva} vigentes",
            transform=ax.transAxes,color=GREY,fontsize=12.5,va='bottom')
    ax.text(0,1.026,sub,transform=ax.transAxes,
            color=(GRN if t and t['res']=='TARGET' else RED if t else GOLD),
            fontsize=13.5,fontweight='bold',va='bottom')
    fig.savefig(salida,facecolor=BG,dpi=100)
    return ev,t

if __name__=='__main__':
    if len(sys.argv) < 3:
        print('uso:  python dia.py <yyyymmdd> <archivo_de_datos.txt> [salida.png] [umbral]')
        sys.exit(1)
    d, datos = sys.argv[1], sys.argv[2]
    if len(sys.argv) > 4: lector.UMBRAL_VOL = int(sys.argv[4])
    ev,t=dibujar(d, sys.argv[3] if len(sys.argv)>3 else f'D_{d}.png', datos)
    for e in ev: print(' ',e)
