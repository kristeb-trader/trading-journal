# FICHA DE MARCADO — generada automáticamente

> ⚙️ **No editar a mano.** Generada desde `01_Plan/reglas.json` el 2026-09-23 con `generar_ficha.py`.
> Si algo aquí contradice a `reglas.json`, manda `reglas.json` — y vuelve a generar la ficha.

**40 reglas.** Aquí van sin el porqué ni los ejemplos: solo lo que hay que aplicar.

---

## Perímetro operativo  (4)

**`R-01`** · Analiza, marca zonas y ejecuta TODO sobre MNQ. Un solo grafico.
- `instrumento_analisis` → MNQ
- `instrumento_ejecucion` → MNQ
- `numero_de_graficos` → 1 (MNQ, 1 minuto)
- `origen_nivel_trigger` → grafico_MNQ
- `origen_nivel_stop` → grafico_MNQ
- `origen_nivel_target` → grafico_MNQ
- `valor_punto_MNQ` → 2.00 USD
- `valor_tick_MNQ` → 0.25 pts = 0.50 USD
- `timeframes_que_deciden` → 1m unicamente
- ▶️ **acción:** Mantener UN grafico de 1 minuto de MNQ. Marcar zonas, leer volumen, leer maximo/minimo de la vela y enviar la orden, todo sobre ese mismo grafico.

**`R-02`** · Opera unicamente durante los 120 minutos siguientes a la apertura de la sesion americana.
- `hora_inicio_ventana` → 09:30:00 ET (apertura sesion americana)
- `hora_fin_ventana` → 11:30:00 ET
- `duracion_ventana` → 120 minutos
- `huso_grafico_NT8` → America/Bogota (UTC-5 fijo) - decision P-02 opcion B
- `ventana_en_pantalla_horario_verano_NY` → 08:30-10:30
- `ventana_en_pantalla_horario_invierno_NY` → 09:30-11:30
- `proximo_cambio_horario_NY` → 2026-11-01
- ▶️ **acción:** No colocar ninguna orden antes del inicio ni despues del fin de ventana. El ancla es la apertura americana, no el numero del reloj en pantalla.

**`R-03`** · Opera con un grafico limpio: velas de 1 minuto y volumen, nada mas.
- `indicadores_en_pantalla` → Volume Up Down unicamente
- `grafico_de_lectura_de_volumen` → MNQ (el unico grafico, R-01)
- `medias_osciladores_vwap_perfil` → prohibidos
- ▶️ **acción:** No anadir ninguna herramienta al grafico sin revisar este plan.

**`R-04`** · Opera siempre 1 contrato MNQ. El tamano no cambia por capital, racha ni conviccion.
- `tamano` → 1 contrato MNQ, siempre
- `escalado_por_capital` → NO. El tamano no sube aunque la cuenta crezca
- `reduccion_por_racha` → NO. El tamano no baja aunque la cuenta caiga
- `revision` → ANUAL. Es el unico momento en que se evalua cambiar el numero de contratos
- ▶️ **acción:** Enviar siempre 1 contrato. Cualquier cambio de tamano solo puede decidirse en la revision anual.

---

## Estructura del precio  (4)

**`R-05`** · Una corrida (= impulso) es la secuencia de velas que arranca cuando una vela supera el extremo de la anterior y termina en la primera vela que retrocede al menos 1 tick contra ella.
- `nace_alcista` → maximo[n] > maximo[n-1]
- `nace_bajista` → minimo[n] < minimo[n-1]
- `composicion_inicial` → vela n-1 (origen) + vela n
- `tamano_minimo` >= → 2 velas
- `tamano_maximo` → ninguno - la sobreextension NO es parametro operativo, es contextualizacion (C-01)
- `vive_alcista` → minimo[n] >= minimo[n-1]
- `vive_bajista` → maximo[n] <= maximo[n-1]
- `empate_de_extremos` → no corta la corrida
- `muere_alcista` <= → minimo[n] <= minimo[n-1] - 0.25 pts (1 tick)
- `muere_bajista` >= → maximo[n] >= maximo[n-1] + 0.25 pts (1 tick)
- `color_de_la_vela` → irrelevante
- `vela_interior` → no corta la corrida
- `exigencia_de_maximos_crecientes` → no existe
- ▶️ **acción:** Identificar inicio y fin de la corrida antes de evaluar el retroceso. La vela que mata la corrida es ya la primera del retroceso.

**`R-06`** · El retroceso es la secuencia de velas que arranca en la vela que mata la corrida y termina cuando nace la siguiente corrida.
- `empieza_tras_corrida_alcista` → primera vela con minimo[n] <= minimo[n-1] - 0.25 pts
- `termina_tras_corrida_alcista` → primera vela con maximo[n] > maximo[n-1]
- `empieza_tras_corrida_bajista` → primera vela con maximo[n] >= maximo[n-1] + 0.25 pts
- `termina_tras_corrida_bajista` → primera vela con minimo[n] < minimo[n-1]
- `nivel_de_referencia_alcista` → minimo MAS BAJO de todas las velas del retroceso. OJO: esto define el RETROCESO, no el stop
- `nivel_de_referencia_bajista` → maximo MAS ALTO de todas las velas del retroceso. OJO: esto define el RETROCESO, no el stop
- `numero_de_velas` → irrelevante, sin minimo ni maximo
- `tamano_minimo` → ninguno (ver P-12)
- `tamano_maximo` <= → 240 ticks entre entrada y nivel de referencia (R-31)
- `color_de_la_vela` → irrelevante
- ▶️ **acción:** Localizar el nivel de referencia del retroceso. El STOP no se mide aqui: se mide con R-32, sobre el extremo alcanzado DESDE QUE NACIO LA ZONA hasta la vela de rompimiento (corregido 27/08/2026; NO es solo el extremo del retroceso que la origino).

**`R-07`** · La vela de las 08:31 declara la direccion inicial de la sesion con su propio cuerpo y es la vela origen.
- `direccion` → cierre por encima de su apertura = inicia alcista; por debajo = inicia bajista
- `premercado` → las velas de 08:30 y anteriores no sirven como n-1
- `origen` → la corrida se mide desde su minimo si es alcista, desde su maximo si es bajista
- `puede_sostener_zona` → si

**`R-08`** · Vela con maximo mayor y minimo menor sin corrida viva: pasa a ser la nueva vela origen y la direccion la da la siguiente.
- `condicion` → maximo[n]>maximo[n-1] y minimo[n]<minimo[n-1] sin corrida viva
- `repeticion` → si n+1 tambien lo es, se repite sin limite
- `no_aplica` → con corrida viva manda R-05

---

## Zonas  (14)

### — marcado —

**`R-09`** · Marca la zona sobre la vela designada, desde el borde de su cuerpo hasta el extremo de su mecha, y extiendela hacia la derecha.
- `regla_unica_de_marcado` → del borde del cuerpo al extremo de la mecha de una vela designada
- `vela_designada_corrida_alcista` → la vela de maximo mas alto (alcista) o minimo mas bajo (bajista) contando desde el origen de la corrida HASTA LA VELA QUE DISPARA EL RETROCESO, ambas incluidas
- `vela_designada_corrida_bajista` → la vela de maximo mas alto (alcista) o minimo mas bajo (bajista) contando desde el origen de la corrida HASTA LA VELA QUE DISPARA EL RETROCESO, ambas incluidas
- `momento_de_marcado` → al aparecer el retroceso (R-06), no antes
- `limite_inferior_zona_resistencia` → borde superior del cuerpo: cierre si verde, apertura si roja
- `limite_superior_zona_resistencia` → maximo de la vela
- `color_de_la_vela` → irrelevante
- `vela_sin_mecha` → la zona es una linea en el extremo de la vela
- `extension_temporal` → hacia la derecha a lo largo del grafico
- `vela_sin_cuerpo` → apertura = cierre: el cuerpo mide cero; la zona va de ese precio a la punta de la mecha
- `soporte_en_el_retroceso` → el RETROCESO de una corrida alcista marca zona de SOPORTE, y el retroceso de una corrida bajista marca RESISTENCIA. Sujeto a R-12: si el movimiento cruza el 50% entre las zonas vecinas, NO se marca
- ▶️ **acción:** Marcar la zona al aparecer el retroceso y extenderla hacia la derecha.

**`R-10`** · Estirar la zona, rompimiento con mecha sin consecucion. El precio rompe una zona con mecha —el cierre se queda dentro— y la consecucion no llega. La zona se extiende hasta la punta de esa mecha: si es una RESISTENCIA se estira solo por arriba; si es un SOPORTE, solo por abajo.
- `disparador` → el precio rompe la zona CON MECHA (el cierre se queda dentro) y la consecucion no llega. Se acaba de dos maneras y vale LA QUE LLEGUE PRIMERO
- `final_1_cinco_velas` → pasan CINCO velas desde la siguiente a la del rompimiento, y la consecucion no ha llegado
- `final_2_estructura_contraria` → antes de esas cinco velas el mercado arma una estructura completa en sentido contrario: una vela que no da la consecucion y se va en contra, otra que hace retroceso, y una tercera que no sigue ese retroceso y vuelve en el sentido de la primera. La zona se estira EN ESA TERCERA VELA, sin esperar mas (R-14)
- `nuevo_limite` → la punta de la mecha que la rompio
- `que_borde_se_mueve` → lo decide el TIPO de zona, no el lado del rompimiento. RESISTENCIA: se estira solo por ARRIBA. SOPORTE: solo por ABAJO. El otro borde no se mueve. PRECISADO 14/09/2026
- `cruce_por_el_lado_contrario` → un soporte NUNCA se estira hacia arriba, ni una resistencia hacia abajo. Si el precio cruza la zona por el lado contrario —el cruce de vuelta, cuando ya la traspaso una vez— no hay nada que estirar: ese cruce no la toca, solo la mata cuando llegue su consecucion (R-21)
- `numero_de_zonas_resultante` → 1 (mas grande). Conserva su historial de rompimientos y consecuciones
- ▶️ **acción:** Estirar la zona existente por el borde que le toca segun su tipo. No se crea ninguna zona nueva. Si el cruce viene por el lado contrario al tipo de la zona, no se toca nada.

**`R-11`** · Zona apendice, rompimiento con cuerpo sin consecucion. El precio rompe una zona CON CUERPO —el cierre queda fuera— y la consecucion no llega. La zona original no se toca y nace una SEGUNDA zona sobre la mecha de la vela de rompimiento: un borde es el borde del cuerpo de esa vela, el otro es la punta de su mecha.
- `disparador` → el precio rompe la zona CON CUERPO (el cierre queda fuera) y la consecucion no llega. Se acaba de dos maneras y vale LA QUE LLEGUE PRIMERO
- `final_1_cinco_velas` → pasan CINCO velas desde la siguiente a la del rompimiento, y la consecucion no ha llegado
- `final_2_estructura_contraria` → antes de esas cinco velas el mercado arma una estructura completa en sentido contrario: una vela que no da la consecucion y se va en contra, otra que hace retroceso, y una tercera que no sigue ese retroceso y vuelve en el sentido de la primera. La apendice NACE EN ESA TERCERA VELA, sin esperar mas (R-14)
- `zona_original` → no se modifica
- `limite_1_apendice` → borde del cuerpo de la vela de rompimiento
- `limite_2_apendice` → extremo de la mecha de la vela de rompimiento
- `dibujo` → se dibuja desde la vela de rompimiento, su vela origen, aunque no quede marcada hasta ese momento. Es del MISMO GRIS que cualquier otra zona (R-19 precision 3)
- `numero_de_zonas_resultante` → 2: la original y su apendice
- ▶️ **acción:** Marcar la zona apendice del borde del cuerpo a la punta de la mecha de la vela de rompimiento. Mantener la original intacta. La apendice NO nace por accion del precio sobre ella: es el rastro de un rompimiento que se quedo sin terminar.

**`R-12`** · Marca una zona entre dos zonas solo si el movimiento que la genera queda entero dentro de la mitad en la que empezo.
- `cuando_aplica` → existe zona por arriba y zona por abajo
- `referencia_del_50` → punto medio entre borde interno de la zona superior y borde interno de la inferior
- `que_se_mide` → el recorrido del precio (el movimiento), NO el rectangulo de la zona
- `criterio` → el movimiento no cruza el 50% en ningun punto
- `si_el_movimiento_cruza_el_50` → no se marca zona aunque el rectangulo quede entero a un lado
- `numero_maximo_de_zonas_intermedias` → sin limite
- `recalculo_del_50` → contra la zona mas cercana por arriba y la mas cercana por abajo en ese momento
- `frecuencia_real` → baja - el operador: 'pasa poco, pero si pasa'
- ▶️ **acción:** Mirar el recorrido del precio, no la caja. Si el movimiento cruzo el 50%, no marcar.

**`R-13`** · Si la zona que ibas a marcar toca una existente, no marques una nueva: estira la existente.
- `disparador` → la zona candidata toca en cualquier punto una zona ya marcada; el contacto de bordes cuenta
- `crear_zona_nueva` → prohibido
- `accion` → extender la zona existente hasta el extremo mas lejano de la candidata
- `numero_de_zonas_resultante` → 1
- `historial_de_vigencia` → la zona extendida conserva su historial de rompimientos y consecuciones (R-21)
- `candidata_dentro_de_la_existente` → sin cambios; no hay nada que extender
- `estirar_hacia_el_extremo` → se estira SOLO hacia el nuevo extremo; el otro borde no se mueve. No se engloba
- `no_solapar_tipos_distintos` → no se solapan zonas de tipo distinto mientras una este vigente: una zona viva ocupa su franja de precio
- ▶️ **acción:** No crear zona nueva. Estirar la existente hasta englobar la candidata.

**`R-14`** · El plazo de 5 velas es un TOPE, no una espera obligatoria: si antes el mercado arma una estructura completa en sentido contrario al rompimiento, la geometria se resuelve en ese momento.
- `naturaleza_del_plazo_de_5_velas` → tope maximo, NO espera obligatoria
- `estructura_contraria_vela_1` → no da la consecucion y va en sentido contrario al rompimiento; su extremo NO pasa del extremo de la vela de rompimiento
- `estructura_contraria_vela_2` → hace retroceso: su extremo es MENOR (rompimiento bajista) o MAYOR (rompimiento alcista) que el de la vela anterior, y NO pasa del extremo de la vela de rompimiento
- `estructura_contraria_vela_3` → no continua el retroceso: vuelve en el sentido de la estructura contraria. AQUI queda armada la estructura y AQUI se marca la zona
- `si_el_retroceso_pasa_el_extremo` → entonces NO es retroceso: es la CONSECUCION. No hay apendice ni estiramiento; la zona queda traspasada
- `que_se_marca` → lo mismo que al vencer el plazo: rompimiento con mecha ESTIRA la zona (R-10); rompimiento con cuerpo hace nacer la ZONA APENDICE (R-11). Solo cambia el momento. CONFIRMADO 07/09/2026: aplica IGUAL a los dos caminos, sin excepcion
- `dibujo` → la apendice es del MISMO GRIS que cualquier zona y se dibuja desde la vela de rompimiento, su vela origen, aunque no este marcada hasta que la estructura queda armada
- `simetria` → aplica igual hacia arriba: resistencia rota con cuerpo + estructura bajista completa antes del plazo
- `si_no_hay_estructura_contraria` → esperar a las 5 velas y aplicar R-10 o R-11
- `si_la_zona_nueva_toca_la_existente` → R-13 la convierte en extension
- ▶️ **acción:** Resolver la geometria del rompimiento sin consecucion con lo que llegue primero: la estructura contraria completa, o las 5 velas.
- ⚠️ **excepción:** Si el precio simplemente se va en sentido contrario SIN hacer retroceso en el medio, no hay estructura: se espera al plazo. Contraejemplo real 20/07/2026, velas 8:42 a 8:45.

**`R-15`** · En la ventana de premercado (19:00 hora Colombia del dia anterior hasta la apertura americana), marca zona sobre TODA vela cuyo volumen supere el umbral. Fuera de esa ventana la regla no aplica.
- `ventana_inicio` → ESCANEO desde las 19:00 hora Colombia (09:00 JST, apertura de Tokio). Fijo todo el ano. NO confundir con el sombreado gris del indicador Premercado.1, que empieza a las 15:00 Col del dia anterior y es SOLO VISUAL
- `ventana_fin` → apertura del mercado americano (inicio de R-02): 08:30 Col en verano EEUU, 09:30 Col en invierno EEUU
- `duracion_ventana` → 13h30 en verano EEUU (~810 velas); 14h30 en invierno EEUU (~870 velas)
- `umbral_volumen` > → UMBRAL_VOL, parametro AJUSTABLE que vive en PARAMETROS.md; no es un numero fijo del metodo. Valor actual: 8000 contratos en MNQ, desde el 14/09/2026. Anteriores: >6000 en MNQ del 06/09 al 14/09/2026; >2000 en NQ hasta el 06/09/2026. PENDIENTE P-37: no esta definido con que criterio medible se cambia ni cada cuanto se revisa; hasta entonces lo fija el operador y se anota con su fecha. ATENCION: la equivalencia entre umbrales NO esta verificada con datos, y las 11 sesiones validadas se marcaron con el umbral de NQ sobre datos de NQ. Ver P-32
- `indicador` → Volume Up Down (R-03)
- `cuantas_se_marcan` → TODAS las velas que superen el umbral, sin seleccionar. No se marca solo el extremo del grupo
- `vela_alcista` → RESISTENCIA sobre la mecha superior
- `vela_bajista` → SOPORTE sobre la mecha inferior
- `limites` → del borde del cuerpo al extremo de la mecha, igual que R-09
- `comportamiento_posterior` → identico al de cualquier zona: R-21, R-10, R-11, R-12, R-13 y R-14 aplican sin excepcion. Tambien hace de BORDE DE BANDA para R-17 (confirmado 01/09/2026)
- `sombreado_visual` → el indicador Premercado.1 sombrea de 15:00 Col del dia anterior a 08:30 Col. Es marca visual, NO define donde se buscan zonas
- ▶️ **acción:** Marcar la zona en premercado y tratarla despues como una zona normal.
- ⚠️ **excepción:** Tras la apertura del mercado americano la regla del volumen se APAGA: dentro de sesion solo se marcan zonas por estructura (R-09), sin importar el volumen de la vela.

**`R-16`** · La zona de la corrida se marca al aparecer el retroceso; la del retroceso solo cuando el retroceso queda confirmado. Antes es solo una linea provisional.
- `zona_corrida` → se dibuja en la primera vela del retroceso, en vivo
- `linea_provisional` → mientras el retroceso vive, linea en el extremo alcanzado; se mueve con cada vela que lo supere
- `confirmacion` → al aparecer estructura contraria la linea se convierte en zona sobre la vela del extremo
- `la_linea_no_opera` → no admite rompimiento, consecucion ni reingreso

**`R-17`** · Dentro de una banda entre dos zonas se marca como maximo una zona en toda la jornada, y es la del primer retroceso.
- `banda` → del borde interno de la zona de abajo al borde interno de la de arriba
- `turno` → lo resuelve el PRIMER retroceso que aparezca dentro
- `resultado` → si respeta el 50 por ciento se marca; si no, no se marca. En los dos casos la banda queda cerrada por el resto de la jornada
- `no_reabre` → la banda no se vuelve a abrir aunque se mueran las zonas que la formaron
- `bordes_de_la_banda` → cualquier zona viva sirve de borde, incluidas las zonas de premercado de R-15
- `la_banda_gastada_no_se_reabre` → desde que la banda tiene su zona queda CERRADA el resto de la jornada, y NO se reabre porque las zonas se invaliden: ni la resistencia de arriba, ni el soporte de abajo, ni la propia zona de dentro devuelven el turno al quedar traspasadas por los dos lados. Una zona invalida deja de valer COMO ZONA pero no deja de OCUPAR EL SITIO. Se mira sobre TODAS las zonas, activas e invalidas. PRECISADO 18/09/2026

**`R-18`** · Salir de una zona o de una banda es rompimiento mas consecucion, no geometria.
- `prohibicion` → no se marca zona al otro lado de una zona viva cuyo rompimiento espera consecucion
- `medida` → decide el EXTREMO del movimiento, no el rectangulo de la zona candidata

**`R-19`** · Seis precisiones de dibujo de zonas.
- `1_rompimiento_por_mecha` → el rompimiento se lee por la mecha, no por el cierre; basta 1 tick
- `2_no_invalida_sola` → el rompimiento solo no invalida: hace falta la consecucion
- `3_rectangulo` → el rectangulo se dibuja desde la vela origen, no desde la que confirma
- `4_estirar` → se estira solo hacia el nuevo extremo
- `5_no_solapar` → no se solapan zonas de tipo distinto; una zona superada cambia de papel y sigue ocupando su franja
- `6_orden_intravela` → cuando una vela hace maximo mayor y minimo menor, el orden intravela decide que vela sostiene la zona

### — vigencia —

**`R-20`** · Rompimiento es superar el borde de la zona por al menos un tick; consecucion es superar por un tick el extremo de la vela de rompimiento. La consecucion que TRASPASA una zona no tiene plazo.
- `rompimiento` >= → 1 tick mas alla del borde de la zona
- `cierre_de_la_vela_de_rompimiento` → irrelevante para que haya rompimiento
- `rompimiento_con_cuerpo` → el cierre queda mas alla del borde traspasado
- `rompimiento_con_mecha` → el cierre NO queda mas alla del borde traspasado
- `consecucion_al_alza` >= → maximo de la vela de rompimiento + 1 tick
- `consecucion_a_la_baja` <= → minimo de la vela de rompimiento - 1 tick
- `plazo_de_consecucion` <= → 5 velas contadas desde la vela siguiente a la de rompimiento
- `plazo_del_traspaso` → el traspaso de la zona NO tiene plazo: el rompimiento queda pendiente indefinidamente y la consecucion lo confirma cuando llegue. El plazo de 5 velas solo gobierna la geometria (R-10/R-11) y la vida de la orden (R-29)
- `plazo_de_la_consecucion` → NINGUNO para el traspaso de la zona: puede llegar muchas velas despues (caso real 13/07/2026, 25 velas). El plazo de 5 velas gobierna la GEOMETRIA de la zona (R-10, R-11, R-14) y la VIDA DE LA ORDEN (R-29), no el traspaso
- ▶️ **acción:** La consecucion al alza es la entrada de R-24. El mismo motor sirve para matar una zona y para entrar.

**`R-21`** · Una zona deja de tener efecto cuando ha sido superada en las dos direcciones.
- `superada_en_una_direccion` → rompimiento Y consecucion en ese sentido
- `solo_rompimiento_sin_consecucion` → la zona sigue vigente
- `zona_invalida` → superada en las dos direcciones
- `efecto_de_zona_invalida` → ninguno: no bloquea el target ni sirve para entrar
- `tratamiento_visual_zona_invalida` → se conserva con tonalidad muy tenue, solo como recuerdo visual
- `invalida_es_invalida` → una zona traspasada en ambos sentidos no cuenta para NADA como zona: ni bloquea el target, ni sirve para entrar, ni cuenta para medir el 50 por ciento entre zonas. PERO SIGUE OCUPANDO SU SITIO: la banda que ya gasto su zona no se reabre porque la zona se invalide (R-17, precisado 18/09/2026). Deja de valer como zona; no deja de ocupar el sitio
- ▶️ **acción:** Retirar del calculo de filtros toda zona superada en ambas direcciones; dejarla dibujada en tono minimo.

**`R-22`** · La vela que confirma un traspaso no abre a la vez el rompimiento del lado contrario.
- `cuando` → el rompimiento contrario se busca a partir de la vela SIGUIENTE

---

## Filtros de no-operar  (3)

**`R-35`** · No operes en la ventana de +/-5 minutos alrededor de una noticia roja de Forex Factory.
- `fuente` → Forex Factory (unica fuente). Investing / 3 toros NO se usa
- `nivel` → solo impacto ROJO. Naranja y amarillo no bloquean
- `bloqueo_previo` → 5 minutos antes de la hora publicada
- `bloqueo_posterior` → 5 minutos despues de la hora publicada
- `ventana_total` → 11 minutos (T-5 a T+5, ambos inclusive)
- `orden_pendiente` → se cancela al entrar la ventana T-5. No consume el cupo de R-28 (R-29)
- `reentrada_tras_T+5` → si el setup sigue vivo se vuelve a colocar la orden. Sujeto a P-19 (conflicto con el reloj de 5 velas de R-20)
- ▶️ **acción:** No colocar orden dentro de la ventana. Si ya hay orden pendiente sin llenar, se CANCELA al entrar T-5. Pasado T+5, si el setup sigue vivo, se vuelve a colocar la orden.

**`R-36`** · En dia de FOMC no se opera Continuacion. Solo se permite Reingreso.
- `definicion_dia_FOMC` → cualquier dia en que Forex Factory marque en ROJO un evento de la Fed. Incluye decision de tipos, actas y discursos de Powell si aparecen en rojo
- `fuente` → Forex Factory, la misma unica fuente de R-35
- `alcance` → el DIA ENTERO, no solo la hora del anuncio
- `Continuacion` → PROHIBIDO (R-25)
- `Reingreso` → PERMITIDO (R-26), con todas sus condiciones normales
- ▶️ **acción:** Ese dia solo se busca Reingreso. Una Continuacion valida se deja pasar aunque cumpla todo.

**`R-37`** · No se opera estando enfermo o sin encontrarse bien mentalmente.
- `criterio` → LIBRE. Juicio del operador, sin condicion medible. Decision consciente del operador el 24/08/2026
- ▶️ **acción:** No abrir operativa ese dia.

---

## Proceso diario  (1)

**`R-38`** · Ejecuta la sesion siguiendo la checklist diaria en orden, y registra TODAS las sesiones, incluidas aquellas en que no se opero.
- `orden` → bloques A (antes de abrir NT8), B (premercado desde 19:00 Col), C (ventana operativa), D (tras el llenado). No se altera el orden
- `bloque_A_antes_de_la_plataforma` → R-37 estado, R-36 FOMC y R-35 noticias se contestan ANTES de abrir NinjaTrader
- `registro_automatico` → indicador de NT8: entrada, salida, niveles, hora, resultado
- `registro_manual` → setup, imagen, errores, observaciones, y el MOTIVO los dias en que no se opero
- `cobertura` → TODOS los dias, se opere o no
- ▶️ **acción:** Seguir CHECKLIST_DIARIA.md de arriba abajo. Rellenar el journal al cierre de la sesion.

---

## Riesgo, orden y gestión  (7)

**`R-28`** · Ejecuta como maximo una operacion por sesion.
- `ordenes_llenadas_por_sesion` <= → 1
- `orden_no_llenada_consume_cupo` → false
- `cupo_consumido_por_resultado` → indiferente (target o stop)
- ▶️ **acción:** Tras la primera orden llenada, no colocar ninguna orden mas en esa sesion aunque aparezcan setups validos.

**`R-29`** · Manten la orden pendiente hasta que se llene, hasta que se agoten 5 velas sin consecucion, hasta que el precio vuelva al punto del stop, o hasta el fin de la ventana.
- `cancelacion_1_plazo` → pasan 5 velas desde el rompimiento sin que el precio alcance el nivel de la orden
- `cancelacion_2_vuelta_al_stop` → el precio vuelve al PUNTO DEL STOP tal como lo define R-32 (el extremo alcanzado DESDE QUE NACIO LA ZONA hasta la vela de rompimiento (corregido 27/08/2026; NO es solo el extremo del retroceso que la origino)). Las palabras originales del operador el 27/08/2026 fueron "llega al mismo punto del retroceso, que seria el mismo punto del stop": entonces coincidian. Desde que R-32 se corrigio pueden NO coincidir, y manda el punto del stop. Asi lo aplico el motor en las 11 sesiones validadas.
- `cancelacion_3_hora` → 11:29:00 ET
- `NO_es_causa_de_cancelacion` → la aparicion de un retroceso nuevo. Un retroceso nuevo deja la orden intacta
- `orden_de_comprobacion` → la caducidad se comprueba ANTES del llenado: pasado el plazo la orden no existe y no puede llenarse
- `misma_vela_toca_orden_y_stop` → si una misma vela toca el nivel de la orden y el punto del stop, se aplica el orden de la vela (el mismo de R-19 punto 6): vela AZUL, primero el minimo; vela BLANCA, primero el maximo. Si llega antes al nivel de la orden, la orden se LLENA, y el stop puede saltar en esa misma vela. Si llega antes al stop, la orden se CANCELA sin llenarse. CONFIRMADO 23/09/2026
- ▶️ **acción:** Cancelar al ocurrir lo PRIMERO de las tres causas. El cupo de R-28 no se consume; se puede esperar un setup nuevo dentro de la ventana de R-02.

**`R-30`** · Una operacion abierta se gestiona hasta stop o target, aunque termine la ventana operativa.
- `fin_ventana_obliga_a_cerrar` → false
- `fin_ventana_prohibe_abrir` → true
- `cierre_por_tiempo` → no existe
- ▶️ **acción:** No ejecutar ninguna accion por hora. Solo stop o target cierran la posicion.

**`R-31`** · Ejecuta con la ATM K1 al valor de ATM_DEFECTO y ajusta stop y target a mano tras el llenado, en ese orden.
- `ATM` → K1 · 1 contrato MNQ · Auto Breakeven OFF · Auto Trail OFF
- `defecto` → ATM_DEFECTO = 320 ticks = 80 puntos = $160. Igual a STOP_MAX a proposito: el stop provisional nunca debe ser mas ajustado que el estructural
- `filtro_previo_al_envio` <= → STOP_MAX = 80 puntos. La distancia se mide entre la ENTRADA y el stop estructural de R-32: Continuacion = el extremo alcanzado DESDE QUE NACIO LA ZONA hasta la vela de rompimiento (corregido 27/08/2026; NO es solo el extremo del retroceso que la origino). Reingreso = extremo de la CORRIDA FALLIDA.
- `tras_el_llenado` → 1o el stop a su referencia estructural, 2o el target a distancia 1:1 (R-32)
- ▶️ **acción:** Verificar distancia antes de enviar. Si supera 240 ticks, no operar. Tras el llenado arrastrar stop y luego target. No volver a moverlos.

**`R-32`** · Ancla la regla en el nivel de entrada, mide el stop hasta su referencia estructural y pon el target a esa misma distancia.
- `ancla` → el nivel de ENTRADA (la consecucion)
- `stop_Continuacion_alcista` → el punto MAS BAJO alcanzado desde que nacio la zona hasta la vela de rompimiento
- `stop_Continuacion_bajista` → el punto MAS ALTO alcanzado desde que nacio la zona hasta la vela de rompimiento
- `stop_Reingreso_largo` → el punto MAS BAJO de la corrida fallida (la que rompio la zona y no continuo)
- `stop_Reingreso_corto` → el punto MAS ALTO de la corrida fallida
- `target` → RATIO_TARGET = 1:1. La misma distancia del stop, medida desde la entrada al otro lado
- `filtro_1_riesgo` <= → STOP_MAX = 80 puntos
- `filtro_2_zonas` → el target 1:1 debe estar LIBRE de zonas vigentes (R-21). Camino de recorrido sin nada en contra
- `filtro_3_punto_de_referencia` → solo Reingreso: el objetivo debe caber dentro del punto de referencia, definido en R-41 (unificado 14/09/2026)
- `stop_Continuacion` → punto mas extremo alcanzado desde que nacio la zona hasta la vela de rompimiento, no solo el extremo del retroceso que la origino
- ▶️ **acción:** Si CUALQUIERA de los tres filtros falla, la entrada queda INVALIDADA y no se opera. El target NUNCA se acorta para que quepa.

**`R-33`** · Una vez ajustados stop y target, NO se gestiona la posicion. Nunca.
- `mover_stop` → PROHIBIDO, en cualquier direccion
- `mover_target` → PROHIBIDO, en cualquier direccion
- `breakeven_manual` → PROHIBIDO
- `cierre_manual` → PROHIBIDO, tambien si el precio no se mueve o va en contra
- `cierre_parcial` → PROHIBIDO. R-31 fija 1 contrato: no hay nada que partir
- `anadir_contratos` → PROHIBIDO
- `cierre_por_hora` → NO EXISTE. El fin de ventana prohibe abrir, no obliga a cerrar (R-30)
- `unicas_salidas` → stop o target. No hay una tercera
- ▶️ **acción:** Ninguna. Se deja que el mercado defina el resultado.

**`R-34`** · Al llenarse la orden termina el ANALISIS del dia, no solo la operativa.
- `al_llenarse` → se ajustan stop y target (R-31) y se cierra el analisis
- `marcar_zonas_nuevas` → PROHIBIDO despues del llenado
- `buscar_setups` → PROHIBIDO despues del llenado
- `al_cerrar_la_operacion` → bitacora, observaciones, pantallazo, y CERRAR NinjaTrader
- ▶️ **acción:** Solo esperar el resultado. Terminada la operacion, registrar y cerrar la plataforma.

---

## Setup y entrada  (7)

**`R-23`** · Toma el primer setup valido cuya orden se llene.
- `criterio_de_seleccion` → cronologico (primero en cumplir todas las condiciones necesarias)
- `comparacion_con_setups_posteriores` → prohibida
- ▶️ **acción:** Ejecutar el primer setup valido. Una vez llenada la orden, ignorar el resto de la sesion.
- ⚠️ **excepción:** Un setup valido cuya orden caduque sin llenarse (R-29) no consume el cupo ni bloquea los siguientes.

**`R-24`** · Entra siempre con orden stop en reposo colocada al cierre de la vela de rompimiento.
- `tipo_de_orden_long` → Buy Stop Market
- `tipo_de_orden_short` → Sell Stop Market
- `nivel_de_entrada_long` → maximo de la vela de rompimiento + 1 tick, leido en MNQ
- `nivel_de_entrada_short` → minimo de la vela de rompimiento - 1 tick, leido en MNQ
- `momento_de_colocacion` → al cierre de la vela de rompimiento
- `orden_a_mercado` → prohibida
- `orden_limite` → prohibida
- ▶️ **acción:** Colocar la orden Stop Market en el Chart Trader de MNQ y esperar. No perseguir el precio a mano.

**`R-25`** · Setup Continuacion: un IRI —corrida, retroceso, zona y rompimiento de esa zona— y su consecucion. La consecucion es la entrada.
- `paso_1` → corrida (R-05)
- `paso_2` → retroceso (R-06)
- `paso_3` → se marca la zona en la vela extrema de la corrida (R-09). Alcista: RESISTENCIA. Bajista: SOPORTE
- `paso_4` → rompimiento de ESA zona por >=1 tick, en el sentido de la corrida (R-20)
- `paso_5_entrada` → consecucion: >=1 tick mas alla del extremo de la vela de rompimiento (R-20 + R-24)
- `plazo` <= → 5 velas desde la siguiente a la de rompimiento. Lo habitual es la 1a o 2a
- `zona_requerida` → SI. La zona la genera el propio impulso del paso 1. No existe Continuacion sin zona
- `filtro_de_target` → solo zona vigente (R-21). El punto de referencia NO aplica a la Continuacion
- `direcciones` → Continuacion alcista / Continuacion bajista. La etiqueta Apertura desaparece (decision del operador 23/09/2026; cierra P-20)
- ▶️ **acción:** Colocar Stop Market al cierre de la vela de rompimiento, en el nivel de consecucion (R-24). Bajista: espejo exacto.
- ⚠️ **excepción:** Si a la 6a vela no hubo consecucion, la ENTRADA queda invalidada. El destino de la ZONA lo deciden R-10/R-11.

**`R-26`** · Setup Reingreso: tras un rompimiento con consecucion que falla, el precio recupera la zona entera y se opera en sentido contrario.
- `paso_1` → sobre una zona hay rompimiento Y consecucion (R-20)
- `paso_2` → el precio NO continua en esa direccion
- `paso_3_vela_de_reingreso` → el precio atraviesa la zona ENTERA y SOBREPASA el borde contrario. Reingreso alcista: supera el borde SUPERIOR del soporte. Reingreso bajista: supera el borde INFERIOR de la resistencia. NO basta con tocar la zona. Esta vela hace de vela de rompimiento del reingreso
- `paso_4_entrada` → consecucion: >=1 tick mas alla del extremo de la vela de reingreso (R-24)
- `plazo` → NINGUNO. El limite de 5 velas de R-20 NO aplica al reingreso
- `direccion` → contraria al rompimiento fallido
- `filtro_propio_punto_de_referencia` → el objetivo debe quedar del lado interior del PUNTO DE REFERENCIA. DEFINICION UNIFICADA EN R-41 desde el 14/09/2026: ya no es solo el extremo del retroceso que origino la zona, sino el nivel de referencia de CUALQUIER retroceso vivo que quede entre la entrada y el objetivo, y muere cuando una vela CIERRA mas alla. Si el objetivo lo pasa, el reingreso es INVALIDO y no se opera. Ver R-41
- `plazo_reingreso` → la ventana se abre con la vela de consecucion y se cierra en cuanto el precio supera el extremo de esa vela de consecucion. El reingreso es inmediato o no es
- ▶️ **acción:** Colocar Stop Market al cierre de la vela de reingreso, en el nivel de consecucion. Verificar antes que el target cabe dentro del punto de referencia.

**`R-27`** · La direccion de la vela de las 08:31 marca por donde empieza el dia pero no obliga a operar en ese sentido toda la sesion.
- `sentido` → se buscan entradas de continuacion en los dos sentidos
- `zona_y_sentido` → cada tramo deja su zona al terminar y esa zona se opera a favor de ese tramo

**`R-40`** · Corrida fluida: solo se entra en el rompimiento de la zona de una corrida FLUIDA. La secuencia tiene que salir bien tres veces seguidas: corrida, retroceso que no se pasa, y corrida siguiente que rompe la zona.
- `como_se_emparejan` → la vela de apertura declara el sentido (R-07). Desde ahi el mercado alterna corrida en ese sentido / retroceso en contra. Cada corrida se empareja con el retroceso que viene JUSTO DESPUES de ella; las parejas NO se solapan. Tras una pareja rota la cuenta vuelve a empezar con la corrida siguiente
- `condicion_1_la_corrida` → la corrida deja su zona al terminar (R-09)
- `condicion_2_el_retroceso_no_se_pasa` <= → el retroceso mide MENOS que su corrida. Se miden los dos sobre el zigzag: la corrida de su punto de arranque a su extremo, y el retroceso de ese mismo extremo a su nivel de referencia (R-06). Empate = no se pasa
- `condicion_3_la_siguiente_rompe` → la corrida siguiente ROMPE la zona de la primera. Si no es capaz y se devuelve, el mercado esta lateral
- `entrada` → el rompimiento de esa zona por la corrida siguiente. Es el paso 4 de la Continuacion (R-25)
- `fallo_A_el_retroceso_se_pasa` → si el retroceso mide MAS que su corrida, caen LAS DOS zonas de la pareja: la de la corrida y la que deja el propio retroceso pasado. Palabras del operador 14/09/2026: 'cuando el retroceso fue mayor que la corrida bajista, se genera zona de resistencia, y no se deberia ingresar en un rompimiento directo'
- `fallo_B_no_rompe` → si la corrida siguiente no rompe la zona y se devuelve, esa zona queda bloqueada. Palabras del operador: 'como no fue capaz de romper, el mercado va a estar lateral'
- `como_se_recupera` → DOS pasos, en este orden. PRIMERO: la zona bloqueada queda rota CON SU CONSECUCION — ese rompimiento es el ROMPIMIENTO DIRECTO y NO se opera nunca. DESPUES: el mercado arma un IRI nuevo entero mas alla — corrida que deja su zona, retroceso que la confirma, y rompimiento de esa zona con su consecucion. La zona nueva tiene que quedar ENTERA mas alla de la bloqueada: por encima si se busca largo, por debajo si se busca corto. Se entra en ESE rompimiento, no antes. En la practica el segundo paso arrastra al primero: si el rompimiento fue con mecha y no llego la consecucion, R-10 estira la zona hasta la punta de la mecha, y para que el IRI nuevo quede entero mas alla el precio tiene que pasar de esa punta, que es la consecucion. CONFIRMADO 14/09/2026 · dos pasos explicitados 21/09/2026
- `el_IRI_nuevo_se_juzga_igual` → si, y la fluidez SE PUEDE VOLVER A PERDER: el desbloqueo no vale para toda la jornada. Cada movimiento se juzga por separado; si el IRI siguiente tampoco es fluido, el sentido se vuelve a bloquear y hay que esperar otro. CONFIRMADO 14/09/2026 · ampliado 19/09/2026
- `efecto_sobre_la_zona` → NINGUNO. Una zona bloqueada sigue vigente: se dibuja, tapa objetivos (R-32), hace de borde de banda (R-17) y se rompe e invalida como cualquier otra (R-20, R-21). Lo unico que se descarta es entrar en su rompimiento
- `alcance` → solo entradas de CONTINUACION (R-25). El Reingreso (R-26) no se toca
- `no_es_un_filtro_de_riesgo` → independiente de STOP_MAX. Una entrada puede caber de sobra en el tope y quedar fuera igual
- `el_bloqueo_es_del_SENTIDO` → perdida la fluidez, NO se opera ningun rompimiento EN EL SENTIDO DEL DIA, sea cual sea la zona — no solo la zona de la pareja que fallo. Operador, 18/09/2026: 'ya no hay fluidez bajista, por lo tanto ya no pienso en cortos'. PRECISADO 19/09/2026
- `zonas_sin_corrida_detras` → las zonas de PREMERCADO (R-15) no tienen corrida que las haya creado, asi que la comprobacion de 'si su corrida fue limpia' no se les puede aplicar. El BLOQUEO DE SENTIDO las alcanza igual: con el sentido bloqueado, su rompimiento tampoco se opera. Caso de origen: 18/09/2026, rompimiento de la zona de premercado a las 8:49. PRECISADO 19/09/2026
- `rompimiento_directo` → el rompimiento de una zona mientras el sentido esta bloqueado. Por parametros cumple, pero el mercado esta lateral y por contexto pierde probabilidad. NO SE OPERA NUNCA. Sirve solo como primer paso de la recuperacion. Termino del operador, 18/09/2026
- `solo_el_sentido_del_dia` → el bloqueo afecta SOLO al sentido que declaro la vela de apertura. No toca el sentido contrario. CONFIRMADO 19/09/2026
- ▶️ **acción:** Antes de colocar una orden de continuacion, comprobar las tres condiciones sobre la zona que se va a romper. Si alguna falla, no se opera ese rompimiento y se espera a un IRI nuevo mas alla de esa zona.

**`R-41`** · Punto de referencia: el objetivo de un REINGRESO no puede pasar del nivel de referencia de un retroceso anterior que siga vivo. Solo aplica al reingreso.
- `que_es_un_punto_de_referencia` → el nivel de referencia de un retroceso (R-06): el minimo mas bajo si el retroceso baja, el maximo mas alto si sube. Es el mismo vertice que ya dibuja el zigzag de corridas y retrocesos; no es un nivel nuevo. UNIFICADO 14/09/2026: antes habia dos conceptos — 'punto de referencia' (el extremo del retroceso que origino ESA zona, R-26) y 'punto de control' (el extremo de CUALQUIER retroceso vivo). El operador decidio que son lo mismo. Queda uno solo, con este nombre y esta mecanica
- `cuantos_hay` → TODOS los retrocesos dejan uno, se dibujen o no. Palabras del operador 14/09/2026: 'normalmente todos los retrocesos serian puntos de control'
- `cual_manda` → el punto de referencia vivo mas cercano a la entrada que quede ENTRE la entrada y el objetivo. Los que quedan fuera de ese tramo no estorban. Ya NO se limita al retroceso que origino la zona: vale cualquiera
- `criterio_de_descarte` > → si el objetivo PASA de ese nivel, el reingreso no se opera. Si el objetivo cae justo encima del nivel, se opera: solo descarta pasarlo. CONFIRMADO 14/09/2026
- `cuando_se_rompe` → cuando una vela CIERRA mas alla del nivel. El pinchazo de mecha NO lo rompe. Ojo: es distinto del rompimiento de una zona (R-19 punto 1), que si se lee por la mecha. CONFIRMADO 14/09/2026
- `efecto_de_estar_roto` → deja de contar. No estorba ningun objetivo a partir de ahi
- `alcance` → SOLO reingresos (R-26). Las entradas de continuacion (R-25) NO lo miran. CONFIRMADO 14/09/2026
- `relacion_con_los_otros_filtros` → es un filtro ADICIONAL. No sustituye al de zonas vigentes ni al del punto de referencia de R-26: los tres tienen que pasar
- `dibujo` → NO se dibujan todos: el grafico se llenaria. Se dibuja solo cuando aparece un reingreso, para comprobar si el objetivo esta libre. Flecha punteada, naranja oscuro, contraste bajo, extendida hacia la derecha. Al romperse: contraste mas leve y se corta una vela despues de la que lo rompio
- `unificacion` → 14/09/2026: absorbe el filtro propio del reingreso que vivia en R-26. Ya no hay dos filtros: hay uno. Cierra P-36. Y cierra tambien P-35, porque al valer cualquier retroceso vivo ya no hace falta que la zona venga de uno — una zona de premercado tambien puede dar reingreso. Probado: NO cambia ninguna de las 11 sesiones de julio (-91.00 en 9 operaciones) ni el 10/09 ni el 11/09
- ▶️ **acción:** Al evaluar un reingreso, mirar si entre la entrada y el objetivo queda vivo el nivel de referencia de algun retroceso anterior. Si el objetivo lo pasa, no se opera.

---

## Parámetros (copiados de `PARAMETROS.md`)

```
# PARÁMETROS DEL PLAN

> **Un solo sitio para los números que pueden cambiar.**
> Las reglas citan el **nombre** del parámetro, no el valor. Se cambia aquí y se propaga a todo el plan.

**Actualizado:** 2026-09-14 (b)

---

## Riesgo y ejecución

| Parámetro | Valor actual | Equivalencias | Dónde actúa | Desde |
|---|---|---|---|---|
| **`STOP_MAX`** | **80 puntos** | 320 ticks · **$160** en MNQ | **Filtro de entrada** (`R-31`, `R-32`): si el stop estructural lo supera **aunque sea por 1 tick**, no se opera | 24/08/2026 |
| **`ATM_DEFECTO`** | **320 ticks** | 80 puntos · $160 | Stop y target provisionales de la ATM `K1` hasta el ajuste manual (`R-31`) | 24/08/2026 |
| **`RATIO_TARGET`** | **1:1** | — | El target recorre la misma distancia que el stop (`R-32`) | 21/08/2026 |
| **`CONTRATOS`** | **1** MNQ | — | Tamaño de posición (`R-31`) | 21/08/2026 |
| **`OPS_POR_SESION`** | **1** llenada | — | `R-28` | 21/08/2026 |

> 🔴 **`STOP_MAX` es una línea dura, no una zona de aviso.** No hay margen de seguridad por debajo del tope: un stop de 79,75 pts se opera exactamente igual que uno de 30. No existe *"está muy cerca del límite, mejor la dejo"*. Confirmado por el operador el **01/09/2026** sobre el caso del 16/07 (75,50 pts = **94 %** del tope, operación tomada y ganada).

> 🔑 **`ATM_DEFECTO` = `STOP_MAX` a propósito.** El stop provisional **nunca** debe ser más ajustado que el estructural: si lo fuera, el mercado podría sacarte de una operación todavía viva antes de que muevas el stop a mano. Si un día cambia `STOP_MAX`, **hay que cambiar `ATM_DEFECTO` con él**.

## Estructura

| Parámetro | Valor actual | Dónde actúa |
|---|---|---|
| **`TICK`** | 0,25 puntos | umbral de rompimiento y consecución (`R-20`) |
| **`PLAZO_CONSECUCION`** | **5 velas — es un TOPE, no una espera obligatoria** *(`R-14`, precisada 01/09/2026)* | `R-20`, `R-25`, `R-10`, `R-11` y **`R-29`** (vida de la orden). 🔴 **Gobierna la geometría de la zona y la vida de la orden, NO el traspaso de la zona:** la consecución que invalida una zona **no tiene plazo** *(27/08/2026)*. 🔵 **Y se resuelve antes si el mercado arma una estructura completa en sentido contrario** — `R-14` *(01/09/2026)* |
| **`VENTANA_REINGRESO`** | **hasta que el precio supere el extremo de la vela de consecución** | `R-26`. El reingreso es **inmediato o no es**: en cuanto el precio sigue de largo, la ventana se cierra para siempre *(27/08/2026)* |
| **`UMBRAL_50`** | 50 % | zonas entre zonas (`R-12`) |

## Volumen y sesión

> 🔵 **`UMBRAL_VOL` es el único parámetro que el operador cambia a mano durante la vida del plan.** El resto se fijaron una vez. Éste depende de la volatilidad del momento, y por eso vive aquí y no dentro de la regla. **`P-37` cerrado el 14/09/2026 sin criterio medible, a propósito:** *"dejemos que quede paramétrico"*. Lo fija el operador, igual que `R-37` es criterio libre. 🔴 **La condición que lo hace seguro: el umbral NUNCA se cambia con la sesión empezada**, y cada cambio se anota con su fecha en la fila de abajo. Sin eso, el umbral se podría mover *después* de ver el día.
>
> El cambio del **14/09/2026** salió del test ciego: el 10/09 la vela más fuerte del premercado hizo **7.799** contratos. Con el umbral en 6.000 nacían cuatro soportes que desviaban todo el marcado de la mañana; con 8.000 el premercado no deja ninguna zona y el día se lee limpio.

| Parámetro | Valor actual | Dónde actúa |
|---|---|---|
| **`UMBRAL_VOL`** | **> 8.000 contratos en MNQ** *(desde 14/09/2026)* | `R-15` — solo premercado. **Parámetro ajustable, no un número fijo del método.** Historial: >2.000 en NQ hasta el 06/09/2026 · >6.000 en MNQ del 06/09 al 14/09/2026 · **>8.000 en MNQ desde el 14/09/2026**. Lo fija el operador, sin criterio medible y a propósito — ver `P-37`. **No se cambia con la sesión empezada.** La equivalencia entre umbrales **no está verificada** — ver `P-32` |
| **`PREMERCADO_INICIO`** | 19:00 hora Colombia (apertura de Tokio) | `R-15` |
| **`VENTANA_OPERATIVA`** | 09:30–11:30 ET | `R-02` |
| **`CANCELACION_FINAL`** | 11:29 ET | `R-29` |
| **`ORIGEN_DEL_STOP`** | desde que **nació la zona** hasta la vela de rompimiento | `R-32` — el stop es el extremo alcanzado en todo ese tramo, no solo el del retroceso que originó la zona *(27/08/2026)* |
| **`VENTANA_NOTICIA`** | ±5 minutos | `R-35` |

---

## Consecuencias de riesgo de `STOP_MAX = 80`

Sobre la cuenta objetivo de **$3.000**:

| | |
|---|---|
| Riesgo por operación | **$160** |
| Porcentaje del capital | **5,3 %** |
| Pérdida máxima diaria (`R-28`: 1 operación) | **5,3 %** |
| Cuatro sesiones perdedoras seguidas | **−21 %** |

**Aceptado explícitamente por el operador el 24/08/2026.** Ver `P-08`.

> Con `RATIO_TARGET` = 1:1, el win rate de equilibrio depende del tamaño del stop, no de este tope. Ver `P-12`.
```
