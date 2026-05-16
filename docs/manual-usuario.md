# Manual de Usuario — Trading Journal NQ Futures

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Autor:** Equipo Trading Journal

---

> ⚠️ **Este documento es editable — actualizalo cuando el sistema cambie.**

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Resumen de Componentes](#resumen-de-componentes)
3. [Módulo 1: Indicador NinjaTrader 8](#módulo-1-indicador-ninjatrader-8)
4. [Módulo 2: Dashboard Web](#módulo-2-dashboard-web)
5. [Módulo 3: Bot de Telegram](#módulo-3-bot-de-telegram)
6. [Módulo 4: Resumen con IA (Claude)](#módulo-4-resumen-con-ia-claude)
7. [Rutina Diaria Recomendada](#rutina-diaria-recomendada)
8. [Preguntas Frecuentes (FAQ)](#preguntas-frecuentes-faq)
9. [Tarjeta de Referencia Rápida](#tarjeta-de-referencia-rápida)
10. [Glosario](#glosario)
11. [Historial de Versiones](#historial-de-versiones)
12. [Cómo Reportar Problemas o Sugerir Mejoras](#cómo-reportar-problemas-o-sugerir-mejoras)

---

## Introducción

### ¿Qué es el Trading Journal NQ Futures?

El Trading Journal NQ Futures es un sistema completo de registro y análisis de operaciones diseñado específicamente para traders de futuros NQ (Nasdaq). Su objetivo es simple: **ayudarte a mejorar como trader capturando automáticamente tus operaciones y permitiéndote reflexionar sobre ellas cada día.**

El sistema elimina el trabajo manual de anotar trades. Cuando cierras una operación en NinjaTrader 8, el sistema la registra automáticamente. Tú solo necesitas agregar el contexto del día: cómo te sentiste, qué setup usaste, qué salió bien y qué no.

### ¿Por qué ayuda llevar este diario?

Los estudios sobre traders rentables muestran consistentemente que **la reflexión diaria es uno de los hábitos más importantes** que separa a los traders consistentes de los que no lo son. Este sistema te da:

- **Registro automático:** tus trades llegan solos a la base de datos, sin que hagas nada.
- **Visión histórica clara:** calendario, gráficos y métricas que muestran patrones en tu trading.
- **Accountability con tus reglas:** un checklist de 6 reglas que se evalúa en cada sesión.
- **Resúmenes objetivos con IA:** sin excusas ni sesgos, la IA te dice lo que realmente pasó.
- **Flexibilidad:** puedes registrar tu sesión desde el dashboard web o desde Telegram, lo que prefieras.

---

## Resumen de Componentes

El sistema tiene 5 piezas que trabajan juntas:

| Componente | Para qué sirve | Cuándo lo usas |
|---|---|---|
| **Indicador NT8** | Exporta trades automáticamente a la nube | Se configura una vez, trabaja solo |
| **Dashboard Web** | Ver métricas, calendario, análisis, registrar sesión | Al final del día o cuando quieras revisar |
| **Bot de Telegram** | Registrar la sesión del día por chat | Al terminar de operar |
| **Claude AI** | Generar resumen objetivo de la sesión | Al registrar sesión en el dashboard |
| **Cloudinary** | Guardar imágenes de tus charts | Al subir capturas en el formulario |

---

## Módulo 1: Indicador NinjaTrader 8

### ¿Qué hace este indicador?

El indicador corre en segundo plano dentro de NinjaTrader 8. Cada vez que cierras una operación, él la detecta automáticamente y la envía a la base de datos en la nube (Supabase). No necesitas hacer nada manualmente.

### Configuración inicial (se hace una sola vez)

> ⚠️ **Esta configuración solo la haces la primera vez. Una vez configurado, el indicador trabaja solo.**

**Pasos para instalar y configurar el indicador:**

1. Abre NinjaTrader 8.
2. En el menú superior, ve a **Tools → Import → NinjaScript Add-On**.
3. Selecciona el archivo del indicador (`.zip` o `.cs`) que te fue entregado.
4. Espera a que NinjaTrader confirme que la importación fue exitosa.
5. Abre un gráfico de cualquier instrumento (puede ser NQ).
6. Haz clic derecho en el gráfico → **Indicators**.
7. En la lista de indicadores disponibles, busca **SupabaseTradeExporter** (o el nombre que aparezca).
8. Haz doble clic para agregarlo al gráfico.
9. En el panel de propiedades del indicador, localiza el campo **Account** (Cuenta).
10. En el menú desplegable, selecciona la cuenta que usas para operar NQ.
11. Haz clic en **OK** para confirmar.
12. Verifica que el indicador aparezca en la lista de indicadores activos del gráfico.

> 💡 **Tip:** Deja el gráfico con el indicador abierto mientras operas. Si cierras el gráfico, el indicador deja de enviar datos.

### Uso diario

Una vez configurado, no hay nada que hacer. El flujo es:

1. Abres NinjaTrader 8 como siempre.
2. Abres el gráfico con el indicador activo.
3. Operas normalmente.
4. Cuando cierras una posición, el indicador detecta el trade y lo envía a la nube en segundos.
5. Puedes verificar en el dashboard web que el trade apareció.

### ¿Cómo saber si está funcionando?

- Abre el dashboard web después de cerrar un trade.
- Ve a la sección **Tabla de Trades**.
- El trade reciente debe aparecer ahí dentro de unos segundos o minutos.
- Si ves el trade, todo funciona correctamente.

### Problemas comunes y soluciones

| Problema | Posible causa | Solución |
|---|---|---|
| Los trades no aparecen en el dashboard | El gráfico con el indicador estaba cerrado | Reabre el gráfico y asegúrate de que el indicador esté activo |
| El indicador no aparece en la lista | No se importó correctamente | Repite el paso de importación (Tools → Import) |
| Aparece la cuenta equivocada | Se seleccionó la cuenta incorrecta en las propiedades | Haz clic derecho en el gráfico → Indicators → selecciona el indicador → cambia la cuenta |
| NinjaTrader muestra un error rojo | Error de conexión a internet o a la base de datos | Verifica tu conexión a internet y vuelve a intentarlo |

> ⚠️ **Importante:** El indicador necesita que NinjaTrader esté conectado a internet para enviar los datos. Si operas sin internet, los trades no se registrarán automáticamente.

---

## Módulo 2: Dashboard Web

### Cómo acceder

Abre tu navegador web y ve a:

**https://kristeb-trader.github.io/trading-journal/**

No necesitas instalar nada. Funciona en cualquier navegador moderno (Chrome, Firefox, Edge).

> 💡 **Tip:** Agrega la página a tus favoritos o a la pantalla de inicio de tu teléfono para acceder rápido.

---

### Sección 1: Calendario

**¿Qué muestra?**

Un calendario mensual donde cada día con actividad tiene un color:

| Color | Significado |
|---|---|
| 🟢 Verde | Día con ganancia que alcanzó el objetivo |
| 🔴 Rojo | Día que llegó al stop loss |
| 🟡 Amarillo | Día mixto (ni objetivo ni stop completo) |
| ⚫ Negro/gris | Día sin operaciones |

**¿Qué puedes hacer aquí?**

- Ver de un vistazo qué tan consistente fue tu mes.
- Hacer clic en cualquier día para ver:
  - Los trades de ese día
  - El checklist de reglas de esa sesión
  - Tu reflexión del día
  - La imagen de chart que hayas subido
- Navegar entre meses con las flechas.

> 💡 **Tip:** Usa el calendario para identificar patrones: ¿hay días de la semana donde pierdes más? ¿Hay semanas donde la consistencia cae?

---

### Sección 2: Métricas

**¿Qué muestra?**

Los indicadores clave de rendimiento (KPIs) de tu trading. Puedes filtrar por:

- Esta semana
- Este mes
- Todo el tiempo

**Métricas disponibles:**

| Métrica | Qué significa |
|---|---|
| P&L total | Ganancias o pérdidas en dólares en el período |
| Win rate | Porcentaje de trades ganadores |
| Número de trades | Total de operaciones en el período |
| Racha actual | Cuántos días seguidos ganando o perdiendo |
| Mejor día | El día con mayor ganancia |
| Peor día | El día con mayor pérdida |
| Sesiones limpias | Cuántas sesiones cumpliste todas las reglas |
| Error más frecuente | La regla que más has incumplido |

> 💡 **Tip:** Revisa las métricas al menos una vez por semana. El "error más frecuente" es especialmente valioso: te dice exactamente en qué trabajar.

---

### Sección 3: Tabla de Trades

**¿Qué muestra?**

Una tabla con todos tus trades, mostrando para cada uno: fecha, hora, instrumento, dirección (largo/corto), precio de entrada, precio de salida, resultado en puntos y resultado en dólares.

**¿Qué puedes hacer aquí?**

- Buscar un trade específico usando la barra de búsqueda.
- Filtrar por fecha, instrumento u otros criterios.
- Ordenar la tabla haciendo clic en el encabezado de cualquier columna.
- Ver el detalle de cualquier trade.

> 💡 **Tip:** Usa la búsqueda para encontrar todos los trades de un día específico o para ver cómo te fue con un tipo de setup en particular.

---

### Sección 4: Registrar Sesión

Esta es la sección más importante del uso diario. Aquí registras el contexto de tu sesión de trading.

**¿Cuándo usarla?**

Al terminar de operar cada día, antes de que pase demasiado tiempo y olvides los detalles.

**Campos del formulario:**

| Campo | Qué escribir |
|---|---|
| Fecha | Se llena automáticamente con hoy |
| Contexto de mercado | Describe cómo estaba el mercado: tendencia, volatilidad, si había rango definido |
| Corrida | Cuántas velas tuvo la corrida previa al setup |
| Velas | Número de velas del movimiento que operaste |
| Retroceso | Tipo de retroceso que viste (ej: 50%, estructura clara, zona limpia) |
| Zonas en contra | ¿Había zonas de oferta/demanda importantes en contra de tu trade? |
| Setup | El setup que usaste para entrar |

**El Checklist de 6 Reglas:**

Marca cada regla que cumpliste en esa sesión. Las reglas son:

1. **Zonas vigentes verificadas** — Revisaste que las zonas de demanda/oferta estaban activas.
2. **Orden precolocada a tiempo** — Colocaste la orden antes de que el precio llegara, no en caliente.
3. **Máx 5 velas en corrida** — La corrida tenía 5 velas o menos (si pusiste más de 5 en el campo "Velas", esta regla se marca automáticamente como incumplida).
4. **Sin noticia roja activa** — No había noticias de alto impacto en el momento del trade.
5. **Zona con rompimiento + consecución** — La zona que operaste tenía un rompimiento previo y consecución.
6. **Estructura Impulso-Retroceso-Impulso** — El trade tenía la estructura IRI completa.

> ⚠️ **Nota:** La regla #3 (máx 5 velas) se marca automáticamente como fallida si escribes un número mayor a 5 en el campo "Velas". El sistema lo hace solo.

**Reflexión:**

Escribe libremente sobre el día: qué sentiste, qué funcionó, qué no funcionó, qué harías diferente.

> 💡 **Tip:** No dejes la reflexión en blanco. Aunque sea una frase corta, el hábito de reflexionar es lo que genera el aprendizaje real.

**Subir imagen:**

Puedes subir una captura de pantalla de tu chart del día. El sistema la guarda automáticamente.

**Cómo subir una imagen:**

1. Toma una captura de pantalla de tu chart en NinjaTrader (puedes usar la tecla `Print Screen` o la herramienta de recorte de Windows).
2. Guarda la imagen en tu computadora.
3. En el formulario, haz clic en el botón **Subir imagen**.
4. Selecciona el archivo de imagen.
5. Espera a que aparezca la miniatura de confirmación.

**Guardar la sesión:**

Cuando hayas completado todos los campos, haz clic en **Guardar sesión**. Verás una confirmación de que se guardó.

---

### Sección 5: Análisis

**¿Qué muestra?**

Seis gráficos que te dan una visión profunda de tu desempeño:

| Gráfico | Qué muestra |
|---|---|
| Curva de equidad | Tu P&L acumulado a lo largo del tiempo |
| Win rate semanal | Cómo varía tu porcentaje de éxito semana a semana |
| P&L por día de la semana | Si hay días donde sistemáticamente ganas o pierdes más |
| MAE vs MFE scatter | Relación entre tu máxima pérdida en trade abierto vs máxima ganancia disponible |
| Distribución de resultados | Donut chart mostrando proporción de días ganadores, perdedores y neutros |
| Disciplina por sesión | Cuántas reglas cumpliste en cada sesión a lo largo del tiempo |

> 💡 **Tip:** El gráfico de "P&L por día de la semana" puede revelar que los lunes son tus peores días o que los miércoles son los mejores. Usa esto para decidir si operas todos los días o seleccionas los mejores.

---

### Configuración (icono ⚙️)

Aquí solo hay un ajuste importante: tu **API Key de Claude** para los resúmenes con IA.

Ver instrucciones completas en el [Módulo 4: Resumen con IA](#módulo-4-resumen-con-ia-claude).

---

## Módulo 3: Bot de Telegram

### ¿Qué hace el bot?

El bot de Telegram (@trading_journal_bot) te permite registrar la sesión del día de forma conversacional, usando botones en Telegram en lugar del formulario web. Es útil si estás en el teléfono o prefieres no abrir el navegador.

> 💡 **Tip:** Usa el bot cuando termines de operar si estás lejos de la computadora, o si prefieres el formato de chat para reflexionar.

### Cómo encontrar el bot

1. Abre Telegram en tu teléfono o computadora.
2. En el buscador, escribe: `@trading_journal_bot`
3. Selecciona el bot y presiona **Iniciar** (Start).

### Comandos disponibles

| Comando | Acción |
|---|---|
| `/sesion` | Inicia el registro de la sesión del día |
| `/cancelar` | Cancela el registro en cualquier momento |

### Flujo completo del comando /sesion

Cuando escribes `/sesion`, el bot te guía paso a paso. Aquí está cada pregunta y qué responder:

**Paso 1: ¿Operaste hoy?**
- El bot pregunta si operaste ese día.
- Responde **Sí** o **No** usando los botones.
- Si dices No, el registro se cierra y queda anotado como día sin operaciones.

**Paso 2: Contexto de mercado**
- El bot te pide describir el contexto del mercado.
- Escribe libremente: "tendencia alcista clara desde la apertura", "rango tight en las primeras horas", etc.

**Paso 3: Corrida**
- El bot pregunta cuántas velas tuvo la corrida.
- Escribe el número (ej: `3`).

**Paso 4: Velas**
- El bot pregunta cuántas velas tuvo el movimiento del trade.
- Escribe el número (ej: `4`).

**Paso 5: Retroceso**
- Describe el retroceso que usaste (ej: `50%`, `estructura limpia`).

**Paso 6: ¿Había zonas en contra?**
- El bot pregunta si había zonas de oferta/demanda en contra de tu trade.
- Responde usando los botones: **Sí** o **No**.

**Paso 7: Setup**
- Describe el setup que usaste para entrar (ej: `Zona de demanda con IRI`).

**Paso 8: Checklist de reglas**
- El bot muestra cada una de las 6 reglas.
- Para cada una, presiona **✅ Cumplida** o **❌ No cumplida**.
- Las reglas se presentan una por una.

**Paso 9: Reflexión**
- Escribe tu reflexión del día: qué aprendiste, cómo te sentiste, qué mejorar.

**Guardado:**
- El bot confirma que la sesión fue guardada.
- Los datos aparecerán en el dashboard web en segundos.

> ⚠️ **Nota:** El bot no permite subir imágenes. Si quieres adjuntar una captura de chart, hazlo desde el formulario del dashboard web.

> 💡 **Tip:** Si en algún momento te equivocas o quieres empezar de nuevo, escribe `/cancelar` y luego `/sesion` para reiniciar el flujo.

---

## Módulo 4: Resumen con IA (Claude)

### ¿Qué hace el resumen con IA?

Cuando haces clic en el botón **"Generar resumen"** dentro del formulario de sesión en el dashboard, el sistema envía la información de tu sesión a Claude (la IA de Anthropic) y recibe un análisis objetivo del día.

El resumen incluye:
- Un análisis de las condiciones de mercado que describiste.
- Evaluación de las reglas que cumpliste e incumpliste.
- Observaciones sobre el setup y el contexto.
- Sugerencias concretas para mejorar.

> 💡 **Tip:** El resumen de IA es especialmente valioso porque no tiene sesgos emocionales. Te dice lo que pasó de forma directa, sin justificar ni suavizar.

### Cómo configurar la API Key de Claude (se hace una sola vez)

> ⚠️ **Necesitas una API Key de Anthropic para usar esta función. Es un costo adicional pequeño por uso. Sin la key, el botón de resumen no funcionará.**

**Pasos para obtener y configurar la API Key:**

1. Ve a [https://console.anthropic.com](https://console.anthropic.com) en tu navegador.
2. Crea una cuenta o inicia sesión.
3. En el menú lateral, haz clic en **API Keys**.
4. Haz clic en **Create Key**.
5. Ponle un nombre (ej: "Trading Journal") y copia la clave que aparece.

> ⚠️ **Importante:** Copia la clave en ese momento. Solo se muestra una vez. Si la pierdes, deberás crear una nueva.

6. Abre el dashboard web: [https://kristeb-trader.github.io/trading-journal/](https://kristeb-trader.github.io/trading-journal/)
7. Haz clic en el ícono de configuración **⚙️** en la navegación.
8. Pega tu API Key en el campo correspondiente.
9. Haz clic en **Guardar**.

La key queda guardada en tu navegador (localStorage). No se sube a ningún servidor ni se comparte.

### Cómo generar un resumen

1. Ve a la sección **Registrar Sesión** en el dashboard.
2. Completa todos los campos del formulario.
3. Haz clic en el botón **"Generar resumen"**.
4. Espera unos segundos mientras la IA procesa la información.
5. El resumen aparecerá en el formulario, listo para guardarse junto con la sesión.

> 💡 **Tip:** Genera el resumen antes de guardar la sesión, no después. El resumen se guarda como parte del registro del día.

---

## Rutina Diaria Recomendada

### Antes de operar

- [ ] Abre NinjaTrader 8 y conéctate al mercado.
- [ ] Verifica que el gráfico con el indicador SupabaseTradeExporter esté abierto y activo.
- [ ] Revisa el calendario en el dashboard para recordar cómo vas en la semana.
- [ ] Revisa las métricas para tener el contexto de tu racha actual.

### Durante la sesión de trading

- [ ] Opera según tu plan. El indicador registra automáticamente cada trade que cierres.
- [ ] Toma nota mental (o en papel) del contexto del día para recordarlo al registrar la sesión.

### Al terminar de operar

- [ ] Toma una captura de pantalla del chart con las operaciones del día.
- [ ] Verifica en la **Tabla de Trades** del dashboard que todos los trades aparezcan correctamente.
- [ ] Ve a **Registrar Sesión** (en el dashboard web o via Telegram) y completa el formulario:
  - Contexto, corrida, velas, retroceso, zonas, setup.
  - Marca el checklist de las 6 reglas con honestidad.
  - Escribe tu reflexión.
  - Sube la captura de pantalla.
  - Haz clic en "Generar resumen" para el análisis de IA.
  - Guarda la sesión.

### Revisión semanal (viernes o fin de semana)

- [ ] Abre la sección **Análisis** en el dashboard.
- [ ] Revisa la curva de equidad de la semana.
- [ ] Identifica el error más frecuente de la semana en **Métricas**.
- [ ] Define un objetivo de mejora para la semana siguiente.

---

## Preguntas Frecuentes (FAQ)

**1. ¿Qué pasa si olvidé abrir el gráfico con el indicador y ya operé?**

Los trades que se ejecutaron mientras el gráfico estaba cerrado no se habrán enviado automáticamente. Deberás registrarlos manualmente si quieres tenerlos en el sistema. Consulta con el administrador del sistema si necesitas agregar trades manualmente.

---

**2. ¿Puedo registrar la sesión tanto en el dashboard como en Telegram?**

Sí, ambos canales llegan a la misma base de datos. Sin embargo, si ya registraste la sesión de hoy en uno de los dos, no la registres de nuevo en el otro porque se crearían dos registros para el mismo día.

---

**3. ¿La API Key de Claude tiene algún costo?**

Sí, Anthropic cobra por el uso de la API. El costo es por la cantidad de texto procesado, y para el uso de este sistema (un resumen diario) es muy bajo. Anthropic ofrece créditos gratuitos al registrarse. Puedes ver el costo estimado en [https://www.anthropic.com/pricing](https://www.anthropic.com/pricing).

---

**4. ¿Mis datos están seguros? ¿Alguien más puede ver mis trades?**

Tus trades se guardan en Supabase, una base de datos segura en la nube. El acceso está protegido. La API Key de Claude se guarda solo en tu navegador y nunca sale de tu dispositivo hacia el servidor del proyecto.

---

**5. ¿Qué pasa si el dashboard no carga o muestra un error?**

Primero verifica tu conexión a internet. Si tienes conexión, intenta recargar la página (F5). Si el problema persiste, puede ser un mantenimiento temporal del servidor. Espera unos minutos y vuelve a intentarlo.

---

**6. ¿Puedo ver el historial de sesiones de meses anteriores?**

Sí. En el calendario, usa las flechas de navegación para ir al mes anterior. Todos los datos históricos están disponibles desde que empezaste a usar el sistema.

---

**7. ¿Qué hago si un trade aparece duplicado en la Tabla de Trades?**

Esto puede ocurrir si el indicador se reinició mientras tenías una posición abierta. Reporta el trade duplicado al administrador del sistema para que lo elimine de la base de datos.

---

## Tarjeta de Referencia Rápida

```
TRADING JOURNAL NQ FUTURES — REFERENCIA RÁPIDA
================================================

ACCESO
Dashboard web: https://kristeb-trader.github.io/trading-journal/
Bot Telegram:  @trading_journal_bot

CHECKLIST ANTES DE OPERAR
□ NT8 abierto con indicador activo en el gráfico

CHECKLIST AL TERMINAR
□ Verificar trades en Tabla de Trades
□ Abrir "Registrar Sesión"
□ Completar: contexto, corrida, velas, retroceso, zonas, setup
□ Marcar las 6 reglas del checklist
□ Escribir reflexión
□ Subir imagen del chart
□ Clic en "Generar resumen" (opcional)
□ Guardar sesión

LAS 6 REGLAS DEL CHECKLIST
1. Zonas vigentes verificadas
2. Orden precolocada a tiempo
3. Máx 5 velas en corrida
4. Sin noticia roja activa
5. Zona con rompimiento + consecución
6. Estructura Impulso-Retroceso-Impulso

COLORES DEL CALENDARIO
🟢 Verde  = Objetivo alcanzado
🔴 Rojo   = Stop loss activado
🟡 Amarillo = Resultado mixto
⚫ Negro  = Sin operaciones

COMANDOS TELEGRAM
/sesion   → Iniciar registro de sesión
/cancelar → Cancelar el registro en curso
```

---

## Glosario

| Término | Definición |
|---|---|
| **P&L** | Profit and Loss (Ganancias y Pérdidas). El resultado económico de tus operaciones en dólares. |
| **Win rate** | Porcentaje de trades que terminaron en ganancia. Si ganaste 6 de 10 trades, tu win rate es 60%. |
| **Setup** | La configuración específica de condiciones de mercado que usas como señal para entrar a una operación. |
| **Corrida** | Movimiento previo al retroceso que operaste. Se mide en número de velas. |
| **Retroceso** | La corrección del precio (movimiento opuesto a la tendencia) que da la oportunidad de entrada. |
| **MAE** | Maximum Adverse Excursion. La máxima pérdida que tuvo una operación mientras estaba abierta. |
| **MFE** | Maximum Favorable Excursion. La máxima ganancia que tuvo una operación mientras estaba abierta. |
| **Checklist** | Lista de reglas que debes cumplir antes de entrar a una operación. Son tus criterios de calidad. |
| **Curva de equidad** | Gráfico que muestra el P&L acumulado a lo largo del tiempo. Una curva ascendente indica rentabilidad consistente. |
| **IRI** | Impulso-Retroceso-Impulso. Estructura de precio en tres fases: movimiento fuerte, corrección, y continuación. |
| **Stop loss** | Nivel de precio predefinido donde cierras la operación para limitar la pérdida. |
| **Supabase** | La base de datos en la nube donde se guardan todos tus trades y registros de sesión. |

---

## Historial de Versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | Mayo 2026 | Versión inicial del manual |
| | | |
| | | |
| | | |

---

## Cómo Reportar Problemas o Sugerir Mejoras

### Si algo no funciona

Cuando encuentres un error, reúne la siguiente información antes de reportarlo:

1. **¿Qué estabas haciendo** cuando ocurrió el problema?
2. **¿Qué esperabas que pasara** vs. **qué pasó realmente**?
3. **Captura de pantalla** del error si aparece algún mensaje.
4. **Fecha y hora** aproximada del problema.
5. **Qué navegador** usas (Chrome, Firefox, Edge) y en qué dispositivo (PC, teléfono).

### Canales de reporte

- **GitHub:** Ve al repositorio del proyecto y abre un "Issue" con los detalles del problema.
- **Directo al administrador:** Envía la información recopilada al desarrollador del sistema.

### Si tienes una sugerencia de mejora

Las sugerencias son bienvenidas. Describe:

- **Qué quisieras que el sistema hiciera** que no hace hoy.
- **Por qué sería útil** para tu trading.
- Si tienes una idea de **cómo implementarlo**, inclúyela, pero no es obligatorio.

> 💡 **Tip:** Las mejores sugerencias vienen del uso real del sistema. Si algo te hace perder tiempo o te genera fricción en tu flujo diario, reportalo. Eso es exactamente lo que se quiere mejorar.

---

*Manual de Usuario — Trading Journal NQ Futures | Versión 1.0 | Mayo 2026*
