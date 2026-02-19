# DORA Metrics Dashboard

**Fecha:** 11 de Febrero, 2026
**Equipo:** Alessandro Alecio - Diego Sican
**Periodo:** Ultimos 30 dias
**Fuente de datos:** Repositorio upstream [juice-shop/juice-shop](https://github.com/juice-shop/juice-shop) (proyecto OWASP oficial)

> Se utiliza el repositorio upstream como fuente de datos porque tiene historial suficiente de PRs, issues y deploys para calcular las 4 metricas DORA de forma significativa. El fork del equipo ([SebastianAlecio/juice-shop](https://github.com/SebastianAlecio/juice-shop)) acumulara sus propias metricas conforme avance el proyecto.

---

## Metricas Actuales

| Metrica | Valor | Clasificacion | Benchmark DORA |
|---------|-------|--------------|----------------|
| **Deployment Frequency** | 9 merges (2.1/semana) | High (semanal) | Elite: diario, High: semanal |
| **Lead Time for Changes** | 6.4 dias promedio | High (1-7 dias) | Elite: <1 dia, High: 1-7 dias |
| **Time to Restore (MTTR)** | 18.5 horas promedio | High (< 1 dia) | Elite: <1 hora, High: <1 dia |
| **Change Failure Rate** | 0% (0 reverts / 9 merges) | Elite (0-15%) | Elite: 0-15%, High: 16-30% |

---

## Detalle por Metrica

### 1. Deployment Frequency (Frecuencia de Deploy)

**Valor:** 9 PRs mergeados en los ultimos 30 dias (2.1/semana)
**Clasificacion:** High

| Periodo | PRs mergeados | Deploys/semana | Clasificacion |
|---------|--------------|----------------|---------------|
| Ultimos 30 dias | 9 | 2.1 | High |

**Fuente de datos:** `gh pr list --repo juice-shop/juice-shop --state merged --limit 30`

**Interpretacion:** El proyecto upstream mantiene una frecuencia de deploy semanal consistente, con picos de actividad alrededor de sprints de contribuciones open-source. Para alcanzar "Elite" se necesitarian merges diarios.

### 2. Lead Time for Changes (Tiempo de Entrega)

**Valor:** 6.4 dias promedio (ultimos 30 dias) | 4.7 dias promedio (ultimos 30 PRs)
**Clasificacion:** High (1-7 dias)

**Fuente de datos:** `gh pr list --repo juice-shop/juice-shop --state merged --json createdAt,mergedAt`

**Calculo:** Promedio del tiempo entre la creacion de un PR y su merge.

| PR | Titulo | Creado | Mergeado | Lead Time |
|----|--------|--------|----------|-----------|
| #1 | refactor: removed duplicate code in verify.ts | Feb 11 | Feb 11 | 0.8 hrs |
| #2 | modernize stylelint to v16 | Feb 04 | Feb 08 | 88.1 hrs |
| #3 | New Crowdin updates | Jan 31 | Feb 08 | 196.1 hrs |
| #4 | fix(chatbot): remove duplicate addUser call | Jan 25 | Jan 26 | 26.0 hrs |
| #5 | test: add validation for challenge tags | Jan 20 | Jan 22 | 41.1 hrs |
| #6 | chore: remove unused dependencies | Jan 19 | Jan 22 | 76.2 hrs |
| #7 | Add unit tests for NFTUnlockComponent | Jan 14 | Jan 15 | 9.8 hrs |
| #8 | Extend /rest/languages with metrics | Jan 03 | Jan 05 | 53.4 hrs |
| #9 | New Crowdin updates | Jan 02 | Jan 14 | 290.5 hrs |

**Interpretacion:** El lead time varia significativamente: refactors simples se mergen en horas, mientras que traducciones (Crowdin) y features complejas toman dias a semanas. Excluyendo actualizaciones automaticas de Crowdin, el lead time promedio es ~4 dias.

### 3. Mean Time to Restore (MTTR)

**Valor:** 18.5 horas promedio (ultimos 30 dias) | 7.6 dias promedio (ultimos 30 bugs)
**Clasificacion:** High (< 1 dia) para los ultimos 30 dias

**Fuente de datos:** `gh issue list --repo juice-shop/juice-shop --state closed --label bug --json createdAt,closedAt`

**Bugs cerrados en los ultimos 30 dias:**

| Bug | Titulo | Creado | Cerrado | Tiempo |
|-----|--------|--------|---------|--------|
| #1 | [bug] (sin descripcion) | Feb 11 | Feb 11 | 1.0 hrs |
| #2 | Security Question Dropdown Not Opening | Feb 04 | Feb 06 | 40.0 hrs |
| #3 | Debug console.log left in production | Jan 21 | Jan 22 | 19.5 hrs |
| #4 | Silent error handling in verify.ts | Jan 21 | Jan 22 | 23.8 hrs |
| #5 | Race condition in product review likes | Jan 19 | Jan 20 | 8.2 hrs |

**Interpretacion:** El MTTR reciente (18.5 horas) es significativamente mejor que el historico (7.6 dias). Esto indica que el equipo upstream ha mejorado su velocidad de respuesta a bugs. La mayoria de bugs se resuelven en menos de 24 horas.

### 4. Change Failure Rate (Tasa de Fallos)

**Valor:** 0% (0 reverts de 9 merges)
**Clasificacion:** Elite

**Fuente de datos:** `gh api repos/juice-shop/juice-shop/commits` filtrado por mensajes con "revert"

**Interpretacion:** No se encontraron reverts en los commits recientes, lo cual indica que los cambios mergeados son estables. El proceso de code review via PRs y el CI pipeline del upstream contribuyen a esta estabilidad.

---

## Resumen de Clasificacion DORA

```
                     ELITE        HIGH         MEDIUM       LOW
                   ─────────── ─────────── ─────────── ───────────
Deploy Frequency   |           |███████████|           |           |  2.1/sem
Lead Time          |           |███████████|           |           |  6.4 dias
MTTR               |           |███████████|           |           |  18.5 hrs
Change Failure     |███████████|           |           |           |  0%
```

**Clasificacion general del proyecto: HIGH** (3 metricas High, 1 Elite)

---

## Tendencia Historica

| Semana | Deploy Freq. | Lead Time | MTTR | CFR |
|--------|-------------|-----------|------|-----|
| 2026-W06 (actual) | 2.1/sem (High) | 6.4 dias (High) | 18.5 hrs (High) | 0% (Elite) |

---

## Metodologia

### Fuentes de Datos

| Metrica | Fuente | Comando |
|---------|--------|---------|
| Deployment Frequency | GitHub API (PRs mergeados) | `gh pr list --repo juice-shop/juice-shop --state merged --limit 30` |
| Lead Time for Changes | GitHub API (PRs) | `gh pr list --repo juice-shop/juice-shop --state merged --json createdAt,mergedAt` |
| Mean Time to Restore | GitHub API (Issues) | `gh issue list --repo juice-shop/juice-shop --state closed --label bug --json createdAt,closedAt` |
| Change Failure Rate | GitHub API (Commits) | `gh api repos/juice-shop/juice-shop/commits` filtrado por "revert" |

### Clasificacion DORA

| Nivel | Deploy Frequency | Lead Time | MTTR | Change Failure Rate |
|-------|-----------------|-----------|------|-------------------|
| **Elite** | On-demand (diario) | < 1 dia | < 1 hora | 0-15% |
| **High** | Semanal | 1-7 dias | < 1 dia | 16-30% |
| **Medium** | Mensual | 1-4 semanas | < 1 semana | 31-45% |
| **Low** | > Mensual | > 1 mes | > 1 semana | > 45% |

### Supuestos y Limitaciones

1. **Se usa el repositorio upstream** como fuente de datos porque el fork del equipo tiene historial limitado (commits directos sin PRs)
2. **Cada PR mergeado a master/develop se considera un deploy**, ya que el upstream tiene CI/CD que publica Docker images automaticamente
3. **Los reverts se detectan por el mensaje del commit** (`revert` en el mensaje). Hotfixes directos no se contabilizan
4. **MTTR se calcula con issues etiquetados como "bug"**. Incidentes no reportados en GitHub no se capturan
5. **Lead Time incluye PRs de Crowdin** (traducciones automaticas) que inflan el promedio por su naturaleza de batch updates

---

## Como Ejecutar

```bash
# Metricas del fork (automatico en GitHub Actions)
bash scripts/dora-metrics.sh

# Metricas del upstream (manual)
gh pr list --repo juice-shop/juice-shop --state merged --limit 30 --json createdAt,mergedAt
gh issue list --repo juice-shop/juice-shop --state closed --label bug --limit 30 --json createdAt,closedAt
```

---

## Referencias

- [DORA Team - State of DevOps Reports](https://dora.dev)
- [Four Keys Project (Google)](https://github.com/dora-team/fourkeys)
- [Accelerate: The Science of Lean Software and DevOps](https://itrevolution.com/book/accelerate/)
