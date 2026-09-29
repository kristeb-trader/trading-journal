# Trading Journal NQ Futures

Dashboard personal para registrar y analizar la operativa diaria en futuros **NQ/MNQ**
(temporalidad de 1 minuto), siguiendo el plan de trading de **Alfredo Chaumer**.

No es solo un registro de trades: mide **adherencia al proceso**. Cada día se registra el
contexto, el checklist de reglas y los errores cometidos, y de ahí sale un porcentaje de
disciplina que distingue lo que se cumplió de lo que solo se declaró cumplido.

**En producción:** https://kristeb-trader.github.io/trading-journal

## Qué hace

| | |
|---|---|
| **Captura automática** | Los trades entran solos desde NinjaTrader 8, con comisión real, MAE/MFE y los niveles de referencia del día |
| **Registro diario** | Desde la web o por Telegram: emoción, premercado, setup, checklist y errores |
| **Coach IA** | Analiza el día en 3 etapas (técnico → chat → diagnóstico) contra el plan de Chaumer |
| **Disciplina** | % de adherencia por etapa y fase del proceso, racha y errores por causa |
| **Cadena diaria** | Al cierre de la mañana, un motor lee las velas del día y marca lo que el plan habría operado |
| **Backtesting** | Bitácora de jornadas de backtesting y las Sesiones del motor, separadas de los trades reales |
| **Apex Tracker** | Estado de las cuentas de fondeo: drawdown, target y safety net |
| **Chaumer vs yo** | Día a día, lo que operó Chaumer frente a lo que operé yo |

Aparte vive el **portal del plan** (`chaumer/04_Web`, Astro en Cloudflare Pages): la web
donde Alfredo Chaumer revisa su plan. Tiene sus propias reglas en `chaumer/`.

## Cómo está montado

100% serverless, ~$0,40/mes. Frontend en **HTML + JavaScript vanilla** (sin frameworks ni
bundler) servido por GitHub Pages; **Supabase** como base de datos; **Cloudflare Workers**
para el proxy de IA y el bot de Telegram; **Cloudinary** para las imágenes. Todo se
publica solo al hacer `git push` a `main` (GitHub Actions).

## Cómo se levanta en local

```bash
npx -y serve -l 3210
```

Y abrir `http://localhost:3210`. No hay paso de build.

## Documentación

| Busco | Está en |
|---|---|
| Cómo trabajar en este proyecto | [`CLAUDE.md`](CLAUDE.md) |
| Cómo se calcula la disciplina | [`docs/Disciplina.md`](docs/Disciplina.md) |
| El plan de Chaumer (vigente) | [`chaumer/01_Plan/`](chaumer/01_Plan/) |
| Por qué se decidió algo así | [`docs/decisiones.md`](docs/decisiones.md) |
| Qué pasó y cuándo | [`docs/historial-proyecto.md`](docs/historial-proyecto.md) |
| Qué falta por hacer | [`tasks/current.md`](tasks/current.md) |

El repositorio es **público** (D-022): ninguna clave va en el código.
