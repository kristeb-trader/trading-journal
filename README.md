# Trading Journal NQ Futures

Dashboard personal para registrar y analizar la operativa diaria en futuros **NQ/MNQ**
(temporalidad de 1 minuto), siguiendo la **Metodología Chaumer**.

No es solo un registro de trades: mide **adherencia al proceso**. Cada día se registra el
contexto, el checklist de reglas y los errores cometidos, y de ahí sale un porcentaje de
disciplina que distingue lo que se cumplió de lo que solo se declaró cumplido.

**En producción:** https://kristeb-trader.github.io/trading-journal

## Qué hace

| | |
|---|---|
| **Captura automática** | Los trades entran solos desde NinjaTrader 8, con comisión real, MAE/MFE y los niveles de referencia del día |
| **Registro diario** | Desde la web o por Telegram: emoción, premercado, setup, checklist y errores |
| **Coach IA** | Analiza el día en 3 etapas (técnico → chat → diagnóstico) y tipifica los errores contra el rulebook |
| **Disciplina** | % de adherencia por fase del proceso, racha y errores por causa |
| **Apex Tracker** | Estado de las cuentas de fondeo: drawdown, target y safety net |
| **Experimentos** | Condiciones en prueba, con veredicto según resultados |

## Cómo está montado

100% serverless, ~$0,40/mes. Frontend en **HTML + JavaScript vanilla** (sin frameworks ni
bundler) servido por GitHub Pages; **Supabase** como base de datos; **Cloudflare Workers**
para el proxy de IA y el bot de Telegram; **Cloudinary** para las imágenes.

## Cómo se levanta en local

```bash
npx -y serve -l 3210
```

Y abrir `http://localhost:3210`. No hay paso de build: lo que ves en local es lo que se
publica al hacer `git push` a `main`.

## Documentación

| Busco | Está en |
|---|---|
| Cómo trabajar en este proyecto | [`CLAUDE.md`](CLAUDE.md) |
| Cómo se calcula la disciplina | [`docs/Disciplina.md`](docs/Disciplina.md) |
| La metodología y el rulebook | [`docs/metodologia-chaumer.md`](docs/metodologia-chaumer.md) |
| Por qué se decidió algo así | [`docs/decisiones.md`](docs/decisiones.md) |
| Qué pasó y cuándo | [`docs/historial-proyecto.md`](docs/historial-proyecto.md) |
| Qué falta por hacer | [`tasks/current.md`](tasks/current.md) |

Repositorio privado.
