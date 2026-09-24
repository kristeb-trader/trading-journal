# -*- coding: utf-8 -*-
# ─────────────────────────────────────────────────────────────────────────
# ⚠️  NO SE EJECUTA DESDE EL PORTAL.
#
#     Los diagramas del metodo (public/conceptos/) se hacen en Cowork, donde
#     se revisan mirandolos uno por uno. Este script es de cuando se dibujaban
#     desde aqui: se conserva como referencia, no como herramienta.
#     Nota anadida el 22/09/2026 (tarea 9 de PENDIENTE_PORTAL.md).
# ─────────────────────────────────────────────────────────────────────────
"""
graficos_conceptos.py — dibuja los gráficos que explican la estrategia.

Los 21 casos de la galería enseñan operaciones concretas. Faltaban gráficos
que expliquen los CONCEPTOS: qué es una corrida, de dónde sale una zona, la
diferencia entre romper y confirmar, y las dos formas de entrar.

Se dibujan sobre DATOS REALES usando el mismo motor de 05_Backtesting, para
que no sean dibujos inventados sino mercado de verdad.

NO MODIFICA NADA de 05_Backtesting: solo importa su motor.
NO ESCRIBE en 01_Plan ni en 02_Assets.

Uso:  python scripts/graficos_conceptos.py
Salida: public/conceptos/*.png
"""
import os
import sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

AQUI = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(AQUI)
RAIZ = os.path.dirname(WEB)
BACKTEST = os.path.join(RAIZ, "05_Backtesting")
DATOS = os.path.join(BACKTEST, "datos", "NQ 09-26.Last.txt")
SALIDA = os.path.join(WEB, "public", "conceptos")

sys.path.insert(0, BACKTEST)
import motor  # noqa: E402  (el motor del operador, sin tocar)

# ── estándar visual del operador, al pie de la letra ────────────────────
FONDO = "#0B0E14"
ALCISTA = "#2E86FF"   # azul
BAJISTA = "#FFFFFF"   # blanca
ZONA = "#8B93A7"      # todas las zonas del mismo gris
EJE = "#3A4256"
TXT = "#F2F5F9"
TENUE = "#A8B0BF"
ORO = "#F5C542"
ROJO = "#FF5C5C"
TICK = 0.25       # el tick del NQ, de PARAMETROS.md
TOPE_STOP = 80.0  # STOP_MAX, de PARAMETROS.md. Si se supera, no se opera
UMBRAL_VOL_NQ = 2000  # UMBRAL_VOL_NQ, de PARAMETROS.md. Solo en premercado
VERDE = "#4ADE80"
CIAN = "#22D3EE"

plt.rcParams["font.family"] = ["DejaVu Sans"]


def ventana_sesion(V, dia):
    """Índices de la ventana operativa. El ancla es la apertura americana:
       13:31-15:30 UTC en horario de verano de Nueva York.

       Empieza en 1331, no en 1330: las velas del archivo van marcadas al
       CIERRE, así que la vela «13:31» es la que cubre el minuto de la
       apertura. Se ve en el volumen — 641 contratos en la 13:30 y 4.333 en
       la 13:31 del 13/07 — y es la misma cuenta que hace lector.py, que la
       llama «la vela base 08:31»."""
    idx = [i for i, k in enumerate(V) if k["d"] == dia and 1331 <= int(k["t"][:4]) <= 1530]
    return (idx[0], idx[-1] + 1) if idx else (None, None)


def hora(k):
    return "%02d:%s" % ((int(k["t"][:2]) - 5) % 24, k["t"][2:4])


def dibujar(V, i0, i1, titulo, explicacion, salida,
            zonas=None, zigzag=None, tramos=None, marcas=None,
            operacion=None, franja=None, lineas=None, flechas=None):
    """Un lienzo con el estándar del operador. Sin cuadrícula, sin adornos.

    `tramos` son los rótulos importantes: en vez de una flecha a una vela,
    una llave debajo de un tramo entero. Un concepto como «corrida» es un
    tramo, no un punto, y señalarlo con flecha confunde más que aclara.
    """
    n = i1 - i0
    fig, ax = plt.subplots(figsize=(16, 8))
    fig.patch.set_facecolor(FONDO)
    ax.set_facecolor(FONDO)
    fig.subplots_adjust(top=0.83, bottom=0.14, left=0.06, right=0.97)

    lo = min(V[i]["l"] for i in range(i0, i1))
    hi = max(V[i]["h"] for i in range(i0, i1))
    # Las zonas y las lineas de referencia tambien tienen que caber. Si una
    # zona queda por encima de todas las velas del recorte, se salia del
    # lienzo y el grafico aparecia cortado.
    for z in (zonas or []):
        lo, hi = min(lo, z["lo"]), max(hi, z["hi"])
    for ln in (lineas or []):
        lo, hi = min(lo, ln[0]), max(hi, ln[0])
    rango = hi - lo
    # Aire abajo para las llaves de los tramos, y arriba para las notas.
    ax.set_ylim(lo - rango * (0.26 if tramos else 0.10), hi + rango * 0.16)
    ax.set_xlim(-1, n + 1)

    if franja:
        a, b, color, etiqueta = franja
        ax.axvspan(a - i0, b - i0, color=color, alpha=0.08, zorder=0)
        ax.text((a + b) / 2 - i0, hi + rango * 0.09, etiqueta, color=color,
                fontsize=13, ha="center", weight="bold")

    for z in (zonas or []):
        x = max(z["vela"] - i0, 0)
        tenue = z.get("tenue", False)
        ax.add_patch(Rectangle((x, z["lo"]), n - x + 1, max(z["hi"] - z["lo"], 0.25),
                               facecolor=ZONA, alpha=0.08 if tenue else 0.26,
                               edgecolor=ZONA, lw=0.8 if tenue else 1.4,
                               linestyle=":" if tenue else "-", zorder=1))
        # La etiqueta va DENTRO de la zona, a la derecha, como en el material
        # del operador. Dice que es y de que vela sale, sin tapar las velas.
        et = z.get("etiqueta")
        if et:
            # Por defecto pegada al borde derecho. Con `et_x` se coloca donde
            # haga falta: dos zonas cercanas en precio chocarian si no.
            ex = z.get("et_x")
            # Con fondo propio: la zona llega hasta el borde derecho y ahi casi
            # siempre hay una vela debajo del rotulo.
            ax.text(n - 0.6 if ex is None else ex - i0,
                    (z["lo"] + z["hi"]) / 2, et,
                    color=TENUE if tenue else TXT, fontsize=11.5, weight="bold",
                    ha="right" if ex is None else "left", va="center", zorder=6,
                    bbox=dict(facecolor=FONDO, edgecolor="none", alpha=0.72,
                              boxstyle="square,pad=0.25"))

    for i in range(i0, i1):
        k = V[i]
        x = i - i0
        c = ALCISTA if k["c"] >= k["o"] else BAJISTA
        ax.plot([x, x], [k["l"], k["h"]], color=c, lw=1.1, zorder=3)
        alto = abs(k["c"] - k["o"]) or rango * 0.002
        ax.add_patch(Rectangle((x - 0.34, min(k["o"], k["c"])), 0.68, alto,
                               facecolor=c, edgecolor=c, lw=0.6, zorder=4))

    if zigzag:
        ax.plot([p[0] - i0 for p in zigzag], [p[1] for p in zigzag],
                color="#FFFFFF", lw=1.6, alpha=0.8, zorder=5)

    # Flechas de recorrido. Una corrida o un retroceso no es un punto: es un
    # trayecto, y el operador pidio el 03/09/2026 verlo como flecha. Van en
    # cian y oro, que no son colores de vela, para que se lean por encima.
    for fl in (flechas or []):
        ia, pa, ib, pb, etiqueta, color = fl
        xa, xb = ia - i0, ib - i0
        ax.annotate("", xy=(xb, pb), xytext=(xa, pa),
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=2.8,
                                    alpha=0.95, shrinkA=0, shrinkB=0,
                                    mutation_scale=28),
                    zorder=7)
        sube = pb > pa
        # Con fondo propio y separado de la linea: encima de las velas el
        # rotulo se perdia.
        ax.text((xa + xb) / 2, (pa + pb) / 2 + rango * (0.11 if sube else -0.11),
                etiqueta, color=color, fontsize=17, weight="bold",
                ha="center", va="bottom" if sube else "top", zorder=8,
                bbox=dict(facecolor=FONDO, edgecolor=color, lw=1.2, alpha=0.9,
                          boxstyle="round,pad=0.35"))

    # llaves de tramo, debajo del precio
    base = lo - rango * 0.13
    for t in (tramos or []):
        a, b, etiqueta, color = t
        xa, xb = a - i0, b - i0
        ax.plot([xa, xb], [base, base], color=color, lw=2.4, solid_capstyle="butt", zorder=6)
        for x in (xa, xb):
            ax.plot([x, x], [base, base + rango * 0.022], color=color, lw=2.4, zorder=6)
        ax.text((xa + xb) / 2, base - rango * 0.055, etiqueta, color=color,
                fontsize=14, ha="center", va="top", weight="bold", zorder=7)

    if operacion:
        # El estandar del operador: las franjas van SOLO sobre el tramo de la
        # operacion, no de lado a lado del grafico. Con la vela de salida se
        # cortan ahi; sin ella llegan hasta el borde.
        xe, entrada, stop, objetivo = operacion[:4]
        xs = operacion[4] if len(operacion) > 4 else None
        x = xe - i0
        ancho = (xs - i0 - x + 1) if xs is not None else (n - x + 1)
        ax.add_patch(Rectangle((x, min(entrada, stop)), ancho,
                               abs(stop - entrada), facecolor=ROJO, alpha=0.14, zorder=2))
        ax.add_patch(Rectangle((x, min(entrada, objetivo)), ancho,
                               abs(objetivo - entrada), facecolor=VERDE, alpha=0.14, zorder=2))

    for mk in (marcas or []):
        i, precio, texto, color, dy = mk[:5]
        # Sexto elemento opcional: a que lado de la vela va el rotulo. Sin el,
        # se decide por la posicion. Con el, manda lo que diga.
        lado = mk[5] if len(mk) > 5 else None
        x = i - i0
        izq = (lado == "derecha") if lado else (x < n * 0.62)
        ax.annotate(texto, xy=(x, precio),
                    xytext=(x + (3.2 if izq else -3.2), precio + dy * rango),
                    color=color, fontsize=13.5, weight="bold",
                    ha="left" if izq else "right", va="center",
                    arrowprops=dict(arrowstyle="->", color=color, lw=1.7, alpha=0.95),
                    # Fondo propio: sobre las velas el rotulo se perdia.
                    bbox=dict(facecolor=FONDO, edgecolor="none", alpha=0.8,
                              boxstyle="square,pad=0.25"),
                    zorder=8)

    # Lineas horizontales de referencia (la mitad entre dos zonas, R-17).
    # A trazos y con su etiqueta a la izquierda: es una medida, no un nivel
    # del mercado, y tiene que distinguirse de una zona.
    for ln in (lineas or []):
        precio, etiqueta, color = ln
        ax.plot([0, n], [precio, precio], color=color, lw=1.4,
                linestyle=(0, (6, 4)), alpha=0.9, zorder=5)
        ax.text(0.4, precio + rango * 0.012, etiqueta, color=color,
                fontsize=12, weight="bold", ha="left", va="bottom", zorder=7,
                bbox=dict(facecolor=FONDO, edgecolor="none", alpha=0.8,
                          boxstyle="square,pad=0.25"))

    ax.tick_params(colors=TENUE, labelsize=10)
    for lado in ("top", "right"):
        ax.spines[lado].set_visible(False)
    for lado in ("bottom", "left"):
        ax.spines[lado].set_color(EJE)
    paso = max(n // 9, 1)
    ax.set_xticks(range(0, n, paso))
    ax.set_xticklabels([hora(V[i0 + i]) for i in range(0, n, paso)])
    ax.grid(False)

    fig.text(0.06, 0.945, titulo, color=TXT, fontsize=23, weight="bold", va="top")
    fig.text(0.06, 0.878, explicacion, color=TENUE, fontsize=14, va="top")

    fig.savefig(salida, dpi=110, facecolor=FONDO)
    plt.close(fig)
    print("  " + os.path.basename(salida))


def zigzag_de(V, zonas, i0, i1):
    puntos = []
    for z in sorted(zonas, key=lambda z: z["vela"]):
        if i0 <= z["vela"] < i1:
            puntos.append((z["vela"], V[z["vela"]]["h"] if z["tipo"] == "R" else V[z["vela"]]["l"]))
    return puntos


def main():
    if not os.path.exists(DATOS):
        print("No encuentro los datos de mercado en " + DATOS)
        return 1
    os.makedirs(SALIDA, exist_ok=True)
    V = motor.cargar(DATOS)
    print("velas cargadas:", len(V))

    DIA = "20260713"
    # Sesiones validadas al tick por el operador, para buscar los casos.
    DIAS = ["20260713", "20260716", "20260715", "20260720", "20260710",
            "20260709", "20260708", "20260707", "20260706", "20260717"]
    i0, i1 = ventana_sesion(V, DIA)
    if i0 is None:
        print("No hay datos para " + DIA)
        return 1

    zonas = motor.estructura(V, i0, i1)
    zz = zigzag_de(V, zonas, i0, i1)
    print("ventana:", i1 - i0, "velas ·", len(zonas), "zonas")

    def sesiones():
        """Los dias validados, con su ventana y su estructura ya calculada."""
        for d in DIAS:
            a, b = ventana_sesion(V, d)
            if a is None or b - a < 30:
                continue
            yield d, a, b, motor.estructura(V, a, b)

    def borde_de(z):
        return z["hi"] if z["tipo"] == "R" else z["lo"]

    def busca_rompimiento(z, j1, desde=None):
        """La primera vela que pasa el borde de la zona por un tick."""
        arriba = z["tipo"] == "R"
        borde = borde_de(z)
        ini = desde if desde is not None else z["vela"] + 2
        for i in range(ini, min(z["vela"] + 60, j1)):
            if (V[i]["h"] > borde) if arriba else (V[i]["l"] < borde):
                return i
        return None

    def busca_consecucion(z, rot, j1, plazo=5):
        """La vela que pasa del extremo de la que rompio, dentro del plazo."""
        arriba = z["tipo"] == "R"
        for j in range(rot + 1, min(rot + 1 + plazo, j1)):
            if (V[j]["h"] > V[rot]["h"]) if arriba else (V[j]["l"] < V[rot]["l"]):
                return j
        return None

    def con_cuerpo(z, rot):
        """El cierre quedo al otro lado del borde: rompimiento con cuerpo."""
        borde = borde_de(z)
        return (V[rot]["c"] > borde) if z["tipo"] == "R" else (V[rot]["c"] < borde)


    def corrida_limpia(z):
        """Cuantas velas de la corrida avanzan de verdad, en tanto por uno.

        Una corrida «limpia» es la que sube (o baja) vela a vela sin dientes.
        Es lo que el operador pidio para los graficos que explican el
        concepto: nada de recorridos enredados."""
        arriba = z["tipo"] == "R"
        a, b = z["c0"], z["vela"]
        if b <= a:
            return 0.0
        buenas = 0
        for i in range(a + 1, b + 1):
            if (V[i]["h"] > V[i - 1]["h"]) if arriba else (V[i]["l"] < V[i - 1]["l"]):
                buenas += 1
        return buenas / (b - a)

    def recorrido(z):
        """Cuanto avanza la corrida, en puntos."""
        return (V[z["vela"]]["h"] - V[z["c0"]]["l"] if z["tipo"] == "R"
                else V[z["c0"]]["h"] - V[z["vela"]]["l"])


    # ── 1 · la ventana operativa ────────────────────────────────────────
    dia_idx = [i for i, k in enumerate(V) if k["d"] == DIA]
    a, b = max(dia_idx[0], i0 - 150), min(dia_idx[-1] + 1, i1 + 80)
    dibujar(V, a, b,
            "Solo se opera en las dos primeras horas",
            "Fuera de esa ventana no se coloca ninguna orden. El resto del día no cuenta.",
            os.path.join(SALIDA, "01-ventana.png"),
            franja=(i0, i1, ORO, "VENTANA OPERATIVA"))

    # ── 2 · corrida y retroceso, con flechas ────────────────────────────
    # El operador las quiere LIMPIAS: que se vea subir vela a vela, sin
    # dientes, y con pocas velas alrededor. Se busca en todo el archivo.
    mejor = None
    for d, j0, j1, zs in sesiones():
        for z in zs:
            if z["tipo"] != "R" or not (4 <= z["c1"] - z["c0"] <= 7):
                continue
            if corrida_limpia(z) < 0.85 or recorrido(z) < 25:
                continue
            if mejor is None or recorrido(z) > recorrido(mejor[1]):
                mejor = (j0, z, j1)
    if mejor:
        j0, z, j1 = mejor
        fin_retro = min(z["c1"] + 3, j1 - 1)
        a, b = max(z["c0"] - 3, j0), min(fin_retro + 4, j1)
        dibujar(V, a, b,
                "El precio avanza y descansa",
                "Al movimiento que avanza se le llama corrida. Al descanso que viene después, retroceso.",
                os.path.join(SALIDA, "02-corrida-retroceso.png"),
                flechas=[(z["c0"], V[z["c0"]]["l"], z["vela"], V[z["vela"]]["h"],
                          "CORRIDA", CIAN),
                         (z["vela"], V[z["vela"]]["h"], fin_retro, V[fin_retro]["l"],
                          "RETROCESO", ORO)])
    else:
        print("  aviso: sin corrida alcista limpia")

    # ── 4 · romper no es confirmar ──────────────────────────────────────
    hecho = False
    for z in sorted(zonas, key=lambda z: z["vela"]):
        borde = z["hi"] if z["tipo"] == "R" else z["lo"]
        rot = next((i for i in range(z["vela"] + 2, min(z["vela"] + 45, i1))
                    if (V[i]["h"] > borde if z["tipo"] == "R" else V[i]["l"] < borde)), None)
        if rot is None or rot + 6 >= i1:
            continue
        conf = next((j for j in range(rot + 1, min(rot + 6, i1))
                     if (V[j]["h"] > V[rot]["h"] if z["tipo"] == "R" else V[j]["l"] < V[rot]["l"])), None)
        if not conf:
            continue
        a, b = max(z["vela"] - 5, i0), min(conf + 12, i1)
        arriba = z["tipo"] == "R"
        dibujar(V, a, b,
                "Cruzar la zona no basta: hace falta la consecución",
                "Una vela la atraviesa. Solo cuenta cuando otra pasa del extremo de esa vela.",
                os.path.join(SALIDA, "04-romper-confirmar.png"),
                zonas=[z],
                marcas=[(rot, V[rot]["h"] if arriba else V[rot]["l"],
                         "Esta vela rompe la zona", ORO, 0.20 if arriba else -0.20),
                        (conf, V[conf]["h"] if arriba else V[conf]["l"],
                         "Esta es la consecución", VERDE, 0.30 if arriba else -0.30)])
        hecho = True
        break
    if not hecho:
        print("  aviso: no se encontró un cruce con confirmación en esta sesión")

    # ── 5 · cruzar sin confirmar ────────────────────────────────────────
    for z in sorted(zonas, key=lambda z: z["vela"]):
        arriba = z["tipo"] == "R"
        borde = z["hi"] if arriba else z["lo"]
        rot = next((i for i in range(z["vela"] + 2, min(z["vela"] + 45, i1))
                    if (V[i]["h"] > borde if arriba else V[i]["l"] < borde)), None)
        if rot is None or rot + 8 >= i1:
            continue
        # que NINGUNA de las siguientes pase del extremo de la que cruzó
        if any((V[j]["h"] > V[rot]["h"] if arriba else V[j]["l"] < V[rot]["l"])
               for j in range(rot + 1, min(rot + 6, i1))):
            continue
        # Que haya roto con MECHA: es el caso que estira la zona (R-15).
        borde_z = z["hi"] if arriba else z["lo"]
        cierre_fuera = (V[rot]["c"] > borde_z) if arriba else (V[rot]["c"] < borde_z)
        if cierre_fuera:
            continue
        # NO se dibuja otra zona: es LA MISMA, que crece hasta la punta de la
        # mecha. El operador lo corrigio el 03/09/2026: el rectangulo es uno.
        k = V[rot]
        borde_viejo = z["hi"] if arriba else z["lo"]
        estirada = (dict(z, hi=k["h"], etiqueta="LA MISMA ZONA, YA ESTIRADA") if arriba
                    else dict(z, lo=k["l"], etiqueta="LA MISMA ZONA, YA ESTIRADA"))
        a, b = max(z["vela"] - 4, i0), min(rot + 9, i1)
        dibujar(V, a, b,
                "Sin consecución, la zona se estira hasta la mecha",
                "Rompió con la mecha y pasaron las cinco velas. El otro borde no se mueve: sigue siendo una sola zona, más grande.",
                os.path.join(SALIDA, "05-sin-confirmar.png"),
                zonas=[estirada],
                lineas=[(borde_viejo, "DONDE ESTABA EL BORDE", TENUE)],
                marcas=[(rot, k["h"] if arriba else k["l"],
                         "Rompió con la mecha", ORO, 0.20 if arriba else -0.20,
                         "izquierda")],
                tramos=[(rot + 1, min(rot + 5, i1 - 1),
                         "CINCO VELAS SIN CONSECUCIÓN", TENUE)])
        break

    # ── 6, 7 y 8 · la entrada, el stop y el descarte por tope ───────────
    #
    # OJO: un setup cuyo stop pase del tope NO SE OPERA. Ensenarlo como
    # ejemplo de «asi va el stop» seria enganoso, asi que se buscan los dos
    # casos por separado: uno dentro del tope para explicar la operacion, y
    # uno fuera para explicar por que a veces no se opera.
    dentro = fuera = None
    for dia in DIAS:
        j0, j1 = ventana_sesion(V, dia)
        if j0 is None:
            continue
        for z in sorted(motor.estructura(V, j0, j1), key=lambda z: z["vela"]):
            arriba = z["tipo"] == "R"
            borde = z["hi"] if arriba else z["lo"]
            rot = next((i for i in range(z["vela"] + 2, min(z["vela"] + 45, j1))
                        if (V[i]["h"] > borde if arriba else V[i]["l"] < borde)), None)
            if rot is None or rot + 14 >= j1:
                continue
            conf = next((j for j in range(rot + 1, min(rot + 6, j1))
                         if (V[j]["h"] > V[rot]["h"] if arriba else V[j]["l"] < V[rot]["l"])), None)
            if conf is None:
                continue

            # La orden espera un tick mas alla del extremo de la vela que cruzo.
            entrada = V[rot]["h"] + TICK if arriba else V[rot]["l"] - TICK
            # El stop, al extremo alcanzado desde que nacio la zona.
            tramo = range(z["vela"], conf + 1)
            stop = min(V[i]["l"] for i in tramo) if arriba else max(V[i]["h"] for i in tramo)
            riesgo = abs(entrada - stop)
            caso = (z, rot, conf, entrada, stop, riesgo, j0, j1)
            if riesgo <= TOPE_STOP and dentro is None:
                dentro = caso
            elif riesgo > TOPE_STOP and fuera is None:
                fuera = caso
            if dentro and fuera:
                break
        if dentro and fuera:
            break

    if dentro:
        z, rot, conf, entrada, stop, riesgo, j0, j1 = dentro
        arriba = z["tipo"] == "R"
        objetivo = entrada + (entrada - stop)          # la misma distancia
        a, b = max(z["vela"] - 4, j0), min(conf + 24, j1)

        dibujar(V, a, b,
                "La entrada se coloca por adelantado",
                "La orden espera un tick más allá de la vela que cruzó. El mercado la ejecuta solo.",
                os.path.join(SALIDA, "06-entrada.png"),
                zonas=[z],
                marcas=[(rot, entrada, "Aquí espera la orden", ALCISTA, 0.24 if arriba else -0.24),
                        (conf, V[conf]["h"] if arriba else V[conf]["l"],
                         "Aquí se llena", VERDE, 0.38 if arriba else -0.38)])

        dibujar(V, a, b,
                "El stop no se elige: lo pone la estructura",
                "Rojo lo que se arriesga, verde lo que se busca. El objetivo recorre la misma distancia.",
                os.path.join(SALIDA, "07-stop-objetivo.png"),
                zonas=[z],
                operacion=(conf, entrada, stop, objetivo),
                marcas=[(conf, stop, "Stop, a %.2f puntos" % riesgo, ROJO, -0.13),
                        (conf, objetivo, "Objetivo, la misma distancia", VERDE, 0.13)])
    else:
        print("  aviso: no se encontró un setup dentro del tope de stop")

    if fuera:
        z, rot, conf, entrada, stop, riesgo, j0, j1 = fuera
        arriba = z["tipo"] == "R"
        a, b = max(z["vela"] - 4, j0), min(conf + 20, j1)
        dibujar(V, a, b,
                "Si el stop pasa del tope, no se opera",
                "Aquí el stop mediría %.0f puntos y el tope son %.0f. El setup se descarta entero."
                % (riesgo, TOPE_STOP),
                os.path.join(SALIDA, "08-descarte.png"),
                zonas=[z],
                marcas=[(conf, entrada, "La entrada estaría aquí", TENUE, 0.16 if arriba else -0.16),
                        (conf, stop, "Pero el stop llega hasta aquí", ROJO, -0.18 if arriba else 0.18)])
    else:
        print("  aviso: no se encontró un setup fuera del tope de stop")

    # ── 9 · zona de premercado por volumen ──────────────────────────────
    #
    # La ventana de premercado empieza a las 19:00 hora Colombia del dia
    # ANTERIOR, que en UTC es la medianoche del dia en curso. Por eso basta
    # con filtrar el mismo dia por debajo de la hora de apertura.
    pre, cand = [], []
    for dia in [DIA] + DIAS:
        pre = [i for i, k in enumerate(V) if k["d"] == dia and int(k["t"][:4]) < 1330]
        cand = [i for i in pre if V[i]["v"] > UMBRAL_VOL_NQ]
        if cand:
            break
    if cand:
        # La de mas volumen de todas: es la que mejor ensena el concepto.
        i = max(cand, key=lambda i: V[i]["v"])
        k = V[i]
        alcista = k["c"] >= k["o"]
        lo, hi = (max(k["o"], k["c"]), k["h"]) if alcista else (k["l"], min(k["o"], k["c"]))
        a, b = max(i - 26, pre[0]), min(i + 34, pre[-1] + 1)
        dibujar(V, a, b,
                "De madrugada, el volumen deja zona",
                "Toda vela por encima de %s contratos deja zona. Alcista deja resistencia, bajista deja soporte."
                % "{:,}".format(UMBRAL_VOL_NQ).replace(",", "."),
                os.path.join(SALIDA, "09-zona-volumen.png"),
                zonas=[dict(vela=i, lo=lo, hi=hi, tipo="R" if alcista else "S")],
                marcas=[(i, (lo + hi) / 2,
                         "%s contratos en un minuto" % "{:,}".format(k["v"]).replace(",", "."),
                         ORO, 0.22 if alcista else -0.22)])
    else:
        print("  aviso: ninguna vela de premercado supera el umbral ese dia")

    # ── 10 · zona apéndice ──────────────────────────────────────────────
    #
    # RETIRADO el 03/09/2026. El nombre 10-zona-apendice.png lo ocupa ahora un
    # diagrama didactico que trajo el operador —«caso 1, pasan las 5 velas»— y
    # regenerarlo se lo comeria. El modulo usa el suyo y el 20 sigue
    # ensenando el mismo caso sobre mercado real.

    # ── 11 · reingreso ──────────────────────────────────────────────────
    #
    # Rompimiento CONFIRMADO que falla: el precio se da la vuelta, atraviesa
    # la zona entera y sale por el borde contrario.
    puesto = False
    for dia in DIAS:
        j0, j1 = ventana_sesion(V, dia)
        if j0 is None:
            continue
        for z in sorted(motor.estructura(V, j0, j1), key=lambda z: z["vela"]):
            arriba = z["tipo"] == "R"
            borde = z["hi"] if arriba else z["lo"]
            contra = z["lo"] if arriba else z["hi"]
            rot = next((i for i in range(z["vela"] + 2, min(z["vela"] + 40, j1))
                        if (V[i]["h"] > borde if arriba else V[i]["l"] < borde)), None)
            if rot is None:
                continue
            conf = next((j for j in range(rot + 1, min(rot + 6, j1))
                         if (V[j]["h"] > V[rot]["h"] if arriba else V[j]["l"] < V[rot]["l"])), None)
            if conf is None or conf + 12 >= j1:
                continue
            # el precio vuelve y SALE por el borde contrario
            rein = next((i for i in range(conf + 1, min(conf + 30, j1))
                         if (V[i]["l"] < contra if arriba else V[i]["h"] > contra)), None)
            if rein is None or rein + 6 >= j1:
                continue
            ent = next((j for j in range(rein + 1, min(rein + 4, j1))
                        if (V[j]["l"] < V[rein]["l"] if arriba else V[j]["h"] > V[rein]["h"])), None)
            if ent is None:
                continue
            # El plan pide que el rompimiento NO continue. Eso no es un
            # adjetivo: el stop del reingreso va al extremo de la corrida
            # fallida, y si esa corrida se fue lejos el stop no cabe en el
            # tope y el reingreso NO SE OPERA. Ensenar uno asi enganaria.
            ent_nivel = V[rein]["l"] - TICK if arriba else V[rein]["h"] + TICK
            fallida = range(rot, rein + 1)
            stop_re = (max(V[i]["h"] for i in fallida) if arriba
                       else min(V[i]["l"] for i in fallida))
            if abs(ent_nivel - stop_re) > TOPE_STOP:
                continue
            a, b = max(z["vela"] - 3, j0), min(ent + 14, j1)
            dibujar(V, a, b,
                    "El rompimiento falló: se opera la vuelta",
                    "Hubo consecución y no siguió. El precio atraviesa la zona entera, sale por el otro lado y ahí entra.",
                    os.path.join(SALIDA, "11-reingreso.png"),
                    zonas=[z],
                    marcas=[(conf, V[conf]["h"] if arriba else V[conf]["l"],
                             "Rompimiento y consecución", TENUE, 0.20 if arriba else -0.20),
                            (rein, contra, "Atraviesa la zona entera", ORO, -0.24 if arriba else 0.24),
                            (ent, V[ent]["l"] if arriba else V[ent]["h"],
                             "Aquí entra el reingreso", VERDE, -0.36 if arriba else 0.36)])
            puesto = True
            break
        if puesto:
            break
    if not puesto:
        print("  aviso: no se encontró un reingreso completo")

    # ── 12 · la primera vela de la sesión ───────────────────────────────
    #
    # Se busca una sesion cuya primera vela tenga cuerpo de verdad: con una
    # vela plana el concepto («declara la direccion con su propio cuerpo»)
    # no se ve, y un grafico que no ensena lo que dice sobra.
    mejor = None
    for dia in [DIA] + DIAS:
        j0, j1 = ventana_sesion(V, dia)
        if j0 is None:
            continue
        k = V[j0]
        cuerpo = abs(k["c"] - k["o"])
        rango_v = k["h"] - k["l"]
        if rango_v <= 0:
            continue
        # cuerpo que ocupe al menos la mitad de la vela, y vela con tamano
        proporcion = cuerpo / rango_v
        if proporcion >= 0.5 and cuerpo >= 4:
            mejor = (j0, j1, k)
            break
    if mejor:
        j0, j1, k0 = mejor
        sube = k0["c"] >= k0["o"]
        dibujar(V, j0 - 2, min(j0 + 16, j1),
                "La primera vela declara la dirección",
                "Cierra %s de su apertura, así que el día empieza %s. Y es el origen desde el que se mide el primer movimiento."
                % ("por encima" if sube else "por debajo", "alcista" if sube else "bajista"),
                os.path.join(SALIDA, "12-vela-0831.png"),
                marcas=[(j0, k0["c"],
                         "Cierra %s de su apertura" % ("por encima" if sube else "por debajo"),
                         VERDE if sube else ROJO, 0.30 if sube else -0.30),
                        (j0, k0["l"] if sube else k0["h"],
                         "Y aquí empieza a medirse el primer movimiento", ALCISTA,
                         -0.30 if sube else 0.30)],
                franja=(j0, j0 + 1, ORO, "PRIMERA VELA"))
    else:
        print("  aviso: ninguna primera vela con cuerpo suficiente")

    # ── 13 · la operación de principio a fin ────────────────────────────
    if dentro:
        z, rot, conf, entrada, stop, riesgo, j0, j1 = dentro
        arriba = z["tipo"] == "R"
        objetivo = entrada + (entrada - stop)
        # hasta donde llega: primera vela que toca el objetivo o el stop
        fin = j1 - 1
        for i in range(conf + 1, j1):
            toca_obj = V[i]["h"] >= objetivo if arriba else V[i]["l"] <= objetivo
            toca_stop = V[i]["l"] <= stop if arriba else V[i]["h"] >= stop
            if toca_obj or toca_stop:
                fin = i
                resultado = "objetivo" if toca_obj else "stop"
                break
        else:
            resultado = None
        a, b = max(conf - 8, j0), min(fin + 4, j1)
        marcas = [(conf, entrada, "Se llena aquí", ALCISTA, 0.16 if arriba else -0.16)]
        if resultado:
            marcas.append((fin, objetivo if resultado == "objetivo" else stop,
                           "Sale en el " + resultado,
                           VERDE if resultado == "objetivo" else ROJO,
                           0.16 if arriba else -0.16))
        dibujar(V, a, b,
                "Colocados el stop y el objetivo, no se toca nada",
                "Solo hay dos salidas. Ni punto de entrada, ni cierre a mano, ni cierre por hora.",
                os.path.join(SALIDA, "13-dentro.png"),
                zonas=[z],
                operacion=(conf, entrada, stop, objetivo, fin),
                marcas=marcas)

    # ── 14 · el traspaso, en otra sesion ────────────────────────────────
    # El apartado «Romper y confirmar» de Marcacion de zonas se quedaba sin
    # grafico. Es el mismo patron del numero 4, pero se busca en OTRO dia
    # para no ensenar dos veces la misma imagen en el mismo recorrido.
    hecho = False
    for d in DIAS:
        if d == DIA:
            continue
        j0, j1 = ventana_sesion(V, d)
        if j0 is None:
            continue
        zs = motor.estructura(V, j0, j1)
        for z in sorted(zs, key=lambda z: z["vela"]):
            arriba = z["tipo"] == "R"
            borde = z["hi"] if arriba else z["lo"]
            rot = next((i for i in range(z["vela"] + 2, min(z["vela"] + 45, j1))
                        if (V[i]["h"] > borde if arriba else V[i]["l"] < borde)), None)
            if rot is None or rot + 6 >= j1:
                continue
            conf = next((k for k in range(rot + 1, min(rot + 6, j1))
                         if (V[k]["h"] > V[rot]["h"] if arriba else V[k]["l"] < V[rot]["l"])), None)
            if not conf:
                continue
            a, b = max(z["vela"] - 5, j0), min(conf + 12, j1)
            dibujar(V, a, b,
                    "Rompimiento y consecución: recién ahí la zona quedó superada",
                    "La primera pasa el borde por un tick, y basta la mecha. La segunda pasa del extremo de la primera.",
                    os.path.join(SALIDA, "14-traspaso.png"),
                    zonas=[z],
                    marcas=[(rot, V[rot]["h"] if arriba else V[rot]["l"],
                             "ROMPIMIENTO", ORO, 0.26 if arriba else -0.26,
                             "izquierda"),
                            (conf, V[conf]["h"] if arriba else V[conf]["l"],
                             "CONSECUCIÓN", VERDE, 0.46 if arriba else -0.46,
                             "izquierda")])
            hecho = True
            break
        if hecho:
            break
    if not hecho:
        print("  aviso: no se encontro un traspaso en otra sesion")

    # ── 15 · la sesion entera, con sus zonas ────────────────────────────
    # «Como avanza la sesion» tampoco tenia grafico. Es la ventana completa
    # con su zigzag: el apartado habla de como AVANZA la sesion, o sea de la
    # cadena de corridas y retrocesos.
    #
    # SIN las zonas a proposito. Dibujar las 44 que devuelve el motor tapa
    # las velas con una mancha gris, y ademas el plan dice que en pantalla
    # va una sola zona por banda y por jornada, no las 44 en crudo. Filtrar
    # cual sobrevive en cada banda es metodologia, no dibujo: se decide en
    # 01_Plan, no aqui.
    dibujar(V, i0, i1,
            "Una sesión entera, de la primera vela a la última",
            "La línea blanca une los extremos: cada movimiento que avanza y cada descanso, de la primera vela a la última.",
            os.path.join(SALIDA, "15-sesion.png"),
            zigzag=zz)

    # ══════════════════════════════════════════════════════════════════
    # MARCACION DE ZONAS — 16 a 23
    # El modulo 2 necesita una imagen por casuistica. Todas se buscan en
    # datos reales del operador; ninguna se dibuja a mano.
    # ══════════════════════════════════════════════════════════════════

    # ── 16 · la corrida bajista ─────────────────────────────────────────
    # El apartado del movimiento necesita los dos sentidos, y con el mismo
    # criterio de limpieza que el alcista.
    mejor = None
    for d, j0, j1, zs in sesiones():
        for z in zs:
            if z["tipo"] != "S" or not (4 <= z["c1"] - z["c0"] <= 7):
                continue
            if corrida_limpia(z) < 0.85 or recorrido(z) < 25:
                continue
            if mejor is None or recorrido(z) > recorrido(mejor[1]):
                mejor = (j0, z, j1)
    if mejor:
        j0, z, j1 = mejor
        fin_retro = min(z["c1"] + 3, j1 - 1)
        a, b = max(z["c0"] - 3, j0), min(fin_retro + 4, j1)
        dibujar(V, a, b,
                "El mismo movimiento, hacia abajo",
                "La corrida baja y el retroceso sube. El soporte sale de la vela más baja del movimiento.",
                os.path.join(SALIDA, "16-corrida-bajista.png"),
                zonas=[dict(z, etiqueta="SOPORTE")],
                flechas=[(z["c0"], V[z["c0"]]["h"], z["vela"], V[z["vela"]]["l"],
                          "CORRIDA", CIAN),
                         (z["vela"], V[z["vela"]]["l"], fin_retro, V[fin_retro]["h"],
                          "RETROCESO", ORO)])
    else:
        print("  aviso: sin corrida bajista limpia")

    # ── 17 · la vela designada y sus dos bordes ─────────────────────────
    # De donde salen exactamente los dos limites de la zona.
    hecho = False
    for d, j0, j1, zs in sesiones():
        # El operador la quiere sencilla: una corrida de unas cuatro velas y un
        # retroceso corto, para que la vela de la zona se vea sin ruido.
        cand = [z for z in zs if z["tipo"] == "R"
                and V[z["vela"]]["h"] - max(V[z["vela"]]["o"], V[z["vela"]]["c"]) > 3.0
                and 3 <= z["c1"] - z["c0"] <= 5
                # que el mercado venga SUBIENDO de verdad hasta esa vela: el
                # operador la quiere alcista, y si no se ve la subida el
                # grafico no explica de donde sale la zona
                and V[z["vela"]]["h"] - V[z["c0"]]["l"] >= 15.0]
        if not cand:
            continue
        z = max(cand, key=lambda z: V[z["vela"]]["h"] - V[z["c0"]]["l"])
        k = V[z["vela"]]
        a, b = max(z["c0"] - 2, j0), min(z["c1"] + 7, j1)
        z2 = dict(z, etiqueta="RESISTENCIA")
        dibujar(V, a, b,
                "Los dos bordes salen de una sola vela",
                "Del borde del cuerpo a la punta de la mecha. Ni un tick más, ni un tick menos.",
                os.path.join(SALIDA, "17-vela-designada.png"),
                zonas=[z2],
                marcas=[(z["vela"], k["h"], "Punta de la mecha", ZONA, 0.16,
                         "izquierda"),
                        (z["vela"], max(k["o"], k["c"]), "Borde del cuerpo", ZONA,
                         -0.22, "izquierda")])
        hecho = True
        break
    if not hecho:
        print("  aviso: sin vela con mecha larga para el detalle")

    # ── 18 y 19 · rompimiento con mecha y con cuerpo ────────────────────
    # La diferencia importa despues: decide si la zona se estira o si nace
    # una apendice (R-15 / R-16).
    for etiqueta, quiere_cuerpo, archivo, titulo, expl in [
        ("mecha", False, "18-rompe-mecha.png",
         "Rompimiento con mecha",
         "La vela pasa el borde pero cierra dentro de la zona. Sigue siendo rompimiento: basta un tick."),
        ("cuerpo", True, "19-rompe-cuerpo.png",
         "Rompimiento con cuerpo",
         "Aquí la vela cierra al otro lado del borde. Mismo rompimiento, pero deja otro rastro si no llega la consecución."),
    ]:
        hecho = False
        for d, j0, j1, zs in sesiones():
            for z in sorted(zs, key=lambda z: z["vela"]):
                rot = busca_rompimiento(z, j1)
                if rot is None or rot + 8 >= j1:
                    continue
                if con_cuerpo(z, rot) != quiere_cuerpo:
                    continue
                conf = busca_consecucion(z, rot, j1)
                if not conf:
                    continue
                arriba = z["tipo"] == "R"
                a, b = max(z["vela"] - 5, j0), min(conf + 12, j1)
                z2 = dict(z, etiqueta="RESISTENCIA" if arriba else "SOPORTE")
                dibujar(V, a, b, titulo, expl,
                        os.path.join(SALIDA, archivo),
                        zonas=[z2],
                        marcas=[(rot, V[rot]["h"] if arriba else V[rot]["l"],
                                 "Rompimiento", ORO, 0.20 if arriba else -0.20),
                                (conf, V[conf]["h"] if arriba else V[conf]["l"],
                                 "Consecución", VERDE, 0.32 if arriba else -0.32)])
                hecho = True
                break
            if hecho:
                break
        if not hecho:
            print("  aviso: sin rompimiento con " + etiqueta)

    # ── 20 · la zona apendice, ya rota ──────────────────────────────────
    # El PDF del operador dedica dos paginas a esto: lo que pasa DESPUES de
    # que nace la apendice. La original queda traspasada en los dos sentidos.
    hecho = False
    for d, j0, j1, zs in sesiones():
        for z in sorted(zs, key=lambda z: z["vela"]):
            rot = busca_rompimiento(z, j1)
            if rot is None or rot + 14 >= j1:
                continue
            if not con_cuerpo(z, rot):
                continue
            if busca_consecucion(z, rot, j1):
                continue                      # aqui hace falta que NO la haya
            arriba = z["tipo"] == "R"
            k = V[rot]
            ap_lo, ap_hi = ((max(k["o"], k["c"]), k["h"]) if arriba
                            else (k["l"], min(k["o"], k["c"])))
            ap = dict(vela=rot, lo=ap_lo, hi=ap_hi, tipo=z["tipo"],
                      etiqueta="APÉNDICE")
            a = max(z["vela"] - 4, j0)
            b = min(rot + 7, j1)          # seis velas despues de la que rompio
            z2 = dict(z, etiqueta="ZONA ORIGINAL")
            dibujar(V, a, b,
                    "La zona apéndice nace del rompimiento sin consecución",
                    "Rompió con cuerpo y pasaron las cinco velas. La original no se toca; la apéndice se marca sobre la mecha de la vela que rompió.",
                    os.path.join(SALIDA, "20-apendice-nace.png"),
                    zonas=[z2, ap],
                    marcas=[(rot, k["h"] if arriba else k["l"],
                             "Rompió con cuerpo", ORO, 0.24 if arriba else -0.24,
                             "izquierda")],
                    tramos=[(rot + 1, min(rot + 5, j1 - 1),
                             "CINCO VELAS SIN CONSECUCIÓN", TENUE)])
            hecho = True
            break
        if hecho:
            break
    if not hecho:
        print("  aviso: sin caso de zona apendice")

    # ── 21 · dos zonas que se tocan se funden en una ────────────────────
    hecho = False
    for d, j0, j1, zs in sesiones():
        mismo = {}
        for z in zs:
            mismo.setdefault(z["tipo"], []).append(z)
        for tipo, lista in mismo.items():
            lista = sorted(lista, key=lambda z: z["vela"])
            for x, y in zip(lista, lista[1:]):
                if not (y["lo"] <= x["hi"] and y["hi"] >= x["lo"]):
                    continue
                if y["vela"] - x["vela"] < 2 or y["vela"] - x["vela"] > 25:
                    continue
                union = dict(vela=x["vela"], tipo=tipo,
                             lo=min(x["lo"], y["lo"]), hi=max(x["hi"], y["hi"]),
                             etiqueta="UNA SOLA ZONA")
                a = max(x["vela"] - 5, j0)
                b = min(y["vela"] + 16, j1)
                dibujar(V, a, b,
                        "Si la nueva toca a la existente, se estira",
                        "No quedan dos zonas pegadas: queda una sola, estirada hasta el extremo nuevo. El otro borde no se mueve.",
                        os.path.join(SALIDA, "21-zonas-se-funden.png"),
                        zonas=[union],
                        marcas=[(x["vela"], (x["lo"] + x["hi"]) / 2,
                                 "La que ya estaba", ZONA, 0.20),
                                (y["vela"], (y["lo"] + y["hi"]) / 2,
                                 "La que iba a marcarse", ZONA, -0.24)])
                hecho = True
                break
            if hecho:
                break
        if hecho:
            break
    if not hecho:
        print("  aviso: sin dos zonas que se toquen")

    # ── 22 y 26 · zona entre zonas: el caso que si y el caso que no ─────
    # El operador anoto que el grafico anterior estaba mal: ensenaba solo el
    # caso que se marca. Su propia imagen (02_Assets/invalidos/R-17_invalido_01)
    # ensena justo el contrario. Ninguna sesion del archivo tiene los dos casos
    # en la misma banda y lo bastante separados como para que se lean juntos,
    # asi que va uno en cada grafico.
    def entre_zonas(z, orden):
        """La zona de arriba, la de abajo y la mitad, para un candidato."""
        vivas = [w for w in orden if w["vela"] < z["c0"]]
        arr = [w for w in vivas if w["lo"] > V[z["vela"]]["h"]]
        aba = [w for w in vivas if w["hi"] < V[z["vela"]]["l"]]
        if not arr or not aba:
            return None
        sup = min(arr, key=lambda w: w["lo"])
        inf = max(aba, key=lambda w: w["hi"])
        if sup["lo"] - inf["hi"] < 20:
            return None                       # banda demasiado estrecha
        mitad = (sup["lo"] + inf["hi"]) / 2
        alto = max(V[i]["h"] for i in range(z["c0"], z["c1"] + 1))
        bajo = min(V[i]["l"] for i in range(z["c0"], z["c1"] + 1))
        return sup, inf, mitad, alto, bajo, (alto > mitad and bajo < mitad)

    for quiere_cruce, archivo, titulo, expl, etiq in [
            (False, "22-entre-zonas.png",
             "Entre dos zonas, solo si el movimiento no cruza la mitad",
             "El movimiento entero se queda del lado en el que empezó. Por eso esta zona sí se marca.",
             "SE MARCA"),
            (True, "26-entre-zonas-no.png",
             "El mismo caso, pero el movimiento cruzó la mitad",
             "Se mide el recorrido del precio, no el rectángulo. Cruzó la mitad, así que esta zona no se marca.",
             "NO SE MARCA")]:
        hecho = False
        for d, j0, j1, zs in sesiones():
            orden = sorted(zs, key=lambda z: z["vela"])
            for z in orden:
                r = entre_zonas(z, orden)
                if r is None:
                    continue
                sup, inf, mitad, alto, bajo, cruza = r
                if cruza != quiere_cruce:
                    continue
                banda = sup["lo"] - inf["hi"]
                if quiere_cruce and (alto - mitad < banda * 0.10
                                     or mitad - bajo < banda * 0.10):
                    continue              # que se vea que cruza, no de refilon
                a = max(z["c0"] - 8, j0)
                b = min(z["c1"] + 12, j1)
                if b - a > 44:
                    continue
                marcas = None
                if quiere_cruce:
                    pico = max(range(z["c0"], z["c1"] + 1),
                               key=lambda i: V[i]["h"])
                    marcas = [(pico, V[pico]["h"], "El movimiento cruzó la mitad",
                               ROJO, 0.22, "izquierda")]
                dibujar(V, a, b, titulo, expl,
                        os.path.join(SALIDA, archivo),
                        zonas=[dict(sup, etiqueta="RESISTENCIA"),
                               dict(inf, etiqueta="SOPORTE"),
                               dict(z, etiqueta=etiq, tenue=quiere_cruce)],
                        lineas=[(mitad, "LA MITAD", ORO)],
                        marcas=marcas)
                hecho = True
                break
            if hecho:
                break
        if not hecho:
            print("  aviso: sin caso para " + archivo)

    # ── 23 · zona traspasada en los dos sentidos ────────────────────────
    hecho = False
    for d, j0, j1, zs in sesiones():
        for z in sorted(zs, key=lambda z: z["vela"]):
            rot = busca_rompimiento(z, j1)
            if rot is None:
                continue
            conf = busca_consecucion(z, rot, j1)
            if not conf or conf + 12 >= j1:
                continue
            arriba = z["tipo"] == "R"
            borde2 = z["lo"] if arriba else z["hi"]
            rot2 = None
            for i in range(conf + 1, min(conf + 50, j1)):
                if (V[i]["l"] < borde2) if arriba else (V[i]["h"] > borde2):
                    rot2 = i
                    break
            if rot2 is None or rot2 + 6 >= j1:
                continue
            conf2 = None
            for j in range(rot2 + 1, min(rot2 + 6, j1)):
                if (V[j]["l"] < V[rot2]["l"]) if arriba else (V[j]["h"] > V[rot2]["h"]):
                    conf2 = j
                    break
            if conf2 is None:
                continue
            a = max(z["vela"] - 4, j0)
            b = min(conf2 + 12, j1)
            z2 = dict(z, etiqueta="YA NO CUENTA", tenue=True)
            dibujar(V, a, b,
                    "Traspasada en los dos sentidos: deja de contar",
                    "Se superó hacia un lado y después hacia el otro, las dos veces con consecución. A partir de ahí no bloquea ni sirve para entrar.",
                    os.path.join(SALIDA, "23-zona-invalida.png"),
                    zonas=[z2],
                    marcas=[(conf, V[conf]["h"] if arriba else V[conf]["l"],
                             "Traspaso de ida", VERDE, 0.20 if arriba else -0.20),
                            (conf2, V[conf2]["l"] if arriba else V[conf2]["h"],
                             "Traspaso de vuelta", VERDE, -0.26 if arriba else 0.26)])
            hecho = True
            break
        if hecho:
            break
    if not hecho:
        print("  aviso: sin zona traspasada en los dos sentidos")

    # ── 3 · de donde sale la zona · en BAJISTA ──────────────────────────
    # La primera imagen del apartado ya es alcista; esta ensena el mismo
    # mecanismo al reves. El operador pidio una corrida bajista limpia y que
    # se vea de que vela sale el soporte.
    mejor = None
    for d, j0, j1, zs in sesiones():
        for z in zs:
            if z["tipo"] != "S" or not (4 <= z["c1"] - z["c0"] <= 6):
                continue
            if corrida_limpia(z) < 0.85 or not (20 <= recorrido(z) <= 70):
                continue
            # que la vela del minimo tenga mecha: si no, la zona es una raya
            k = V[z["vela"]]
            if min(k["o"], k["c"]) - k["l"] < 1.5:
                continue
            if mejor is None or recorrido(z) > recorrido(mejor[1]):
                mejor = (j0, z, j1)
    if mejor:
        j0, z, j1 = mejor
        k = V[z["vela"]]
        fin_retro = min(z["c1"] + 3, j1 - 1)
        a, b = max(z["c0"] - 3, j0), min(fin_retro + 6, j1)
        dibujar(V, a, b,
                "Cada movimiento deja un rastro",
                "Corrida bajista y retroceso al alza. La vela del mínimo deja una zona de soporte, y ese rastro es lo que se opera después.",
                os.path.join(SALIDA, "03-zona.png"),
                zonas=[dict(z, etiqueta="SOPORTE")],
                marcas=[(z["vela"], (z["lo"] + z["hi"]) / 2,
                         "El soporte sale de esta vela", ZONA, 0.10, "izquierda")],
                flechas=[(z["c0"], V[z["c0"]]["h"], z["vela"], k["l"],
                          "CORRIDA", CIAN),
                         (z["vela"], k["l"], fin_retro, V[fin_retro]["h"],
                          "RETROCESO", ORO)])
    else:
        print("  aviso: sin corrida bajista limpia para el gráfico de la zona")

    # ── 24 y 25 · la estructura nueva llega antes que las cinco velas ───
    # R-19: el plazo es un tope, no una espera. Si aparece un retroceso nuevo
    # antes, se actua ya. Uno con rompimiento de mecha y otro de cuerpo.
    for quiere_cuerpo, prefiere_tocar, archivo, titulo, expl in [
            (False, True, "24-estructura-antes.png",
             "No hizo falta esperar las cinco velas",
             "Apareció un retroceso nuevo antes de que se cumpliera el plazo. Se marca zona en ese momento y el reloj deja de contar."),
            (True, False, "25-apendice-antes.png",
             "Lo mismo cuando el rompimiento fue con cuerpo",
             "Rompió con cuerpo y, antes de las cinco velas, apareció un retroceso nuevo. La zona se marca ahí y no se espera más.")]:
        hecho = False
        for d, j0, j1, zs in sesiones():
            orden = sorted(zs, key=lambda z: z["vela"])
            for z in orden:
                rot = busca_rompimiento(z, j1)
                if rot is None or rot + 10 >= j1:
                    continue
                if con_cuerpo(z, rot) != quiere_cuerpo:
                    continue
                if busca_consecucion(z, rot, j1):
                    continue          # con consecucion no hay nada que ilustrar
                # una estructura nueva DENTRO del plazo de las cinco velas, y
                # que no sea la propia vela que rompio
                dentro = [w for w in orden if rot < w["vela"] <= rot + 5]
                if not dentro:
                    continue
                # Si la zona nueva toca a la original, lo que pasa es que la
                # original se estira. Si no la toca, es una zona aparte. Se
                # prefiere el caso que se toca, que es el que ilustra el texto.
                tocan = [w for w in dentro
                         if w["lo"] <= z["hi"] and w["hi"] >= z["lo"]]
                sueltas = [w for w in dentro if w not in tocan]
                # Si la zona nueva toca a la original, lo que se ve es que la
                # original se estira; si no la toca, se ve una zona aparte. Cada
                # grafico quiere un caso, y si no lo hay se descarta y sigue
                # buscando: dos rectangulos superpuestos no explican nada.
                elegidas = tocan if prefiere_tocar else sueltas
                if not elegidas:
                    continue
                nueva = elegidas[0]
                arriba = z["tipo"] == "R"
                if prefiere_tocar:
                    # Un solo rectangulo: LA MISMA zona, estirada hasta la
                    # MECHA de la vela que rompio — no hasta la zona de la
                    # estructura nueva. Corregido por el operador el
                    # 03/09/2026 sobre el caso de las 09:10 / 09:17 / 09:20.
                    pintadas = [dict(z, hi=max(z["hi"], V[rot]["h"])) if arriba
                                else dict(z, lo=min(z["lo"], V[rot]["l"]))]
                    pintadas[0]["etiqueta"] = "LA MISMA ZONA, YA ESTIRADA"
                    refs = [(z["hi"] if arriba else z["lo"],
                             "DONDE ESTABA EL BORDE", TENUE)]
                else:
                    pintadas = [dict(z, etiqueta="ZONA ORIGINAL"),
                                dict(nueva, etiqueta="SE MARCA YA")]
                    refs = None
                a = max(z["vela"] - 4, j0)
                b = min(nueva["vela"] + 8, j1)
                sube = nueva["tipo"] == "R"
                dibujar(V, a, b, titulo, expl,
                        os.path.join(SALIDA, archivo),
                        zonas=pintadas,
                        lineas=refs,
                        marcas=[(rot, V[rot]["h"] if arriba else V[rot]["l"],
                                 "Rompió sin consecución", ORO,
                                 0.10 if arriba else -0.10, "izquierda"),
                                # Siempre por encima del punto: debajo esta la
                                # llave del plazo y los rotulos se pisaban.
                                (nueva["vela"],
                                 V[nueva["vela"]]["h"] if sube else V[nueva["vela"]]["l"],
                                 "Retroceso nuevo", VERDE, 0.14, "derecha")])
                hecho = True
                break
            if hecho:
                break
        if not hecho:
            print("  aviso: sin estructura nueva dentro del plazo (" + archivo + ")")

    print("\nlistos en public/conceptos/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
