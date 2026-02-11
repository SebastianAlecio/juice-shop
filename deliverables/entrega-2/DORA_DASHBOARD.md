# DORA Metrics Dashboard

**Fecha:** 11 de Febrero, 2026
**Equipo:** Alessandro Alecio - Diego Sican
**Periodo:** Ultimos 30 dias
**Repositorio:** [SebastianAlecio/juice-shop](https://github.com/SebastianAlecio/juice-shop)

---

## Metricas Actuales

| Metrica | Valor | Clasificacion | Benchmark DORA |
|---------|-------|--------------|----------------|
| **Deployment Frequency** | 6 deploys (1.4/semana) | High (semanal) | Elite: diario, High: semanal |
| **Lead Time for Changes** | Pendiente | Pendiente | Elite: <1 dia, High: 1-7 dias |
| **Time to Restore (MTTR)** | N/A | N/A (sin incidentes) | Elite: <1 hora, High: <1 dia |
| **Change Failure Rate** | 0% (0 reverts / 6 deploys) | Elite (0-15%) | Elite: 0-15%, High: 16-30% |

> **Nota:** Lead Time y MTTR requieren datos de Pull Requests y Issues con label "bug" en GitHub. Estos datos se popularan automaticamente conforme el equipo trabaje con PRs y reporte bugs. El script `dora-metrics.sh` calcula ambas metricas via la API de GitHub cuando corre en GitHub Actions (con `GH_TOKEN`).

---

## Detalle por Metrica

### 1. Deployment Frequency (Frecuencia de Deploy)

**Valor:** 6 commits a master en los ultimos 30 dias (1.4/semana)
**Clasificacion:** High

| Periodo | Commits a master | Merges | Deploys/semana |
|---------|-----------------|--------|----------------|
| Ultimos 30 dias | 6 | 0 | 1.4 |

**Fuente de datos:** `git log --since="30 days ago" master`

**Interpretacion:** El equipo esta desplegando con frecuencia semanal, lo cual se clasifica como "High" en los benchmarks DORA. Para alcanzar "Elite" se necesitarian deploys diarios.

### 2. Lead Time for Changes (Tiempo de Entrega)

**Valor:** Pendiente (requiere PRs mergeados)
**Clasificacion:** Pendiente

**Fuente de datos:** `gh pr list --state merged --json createdAt,mergedAt`

**Calculo:** Promedio del tiempo entre la creacion de un PR y su merge. Actualmente el equipo ha estado haciendo commits directos a master sin PRs, por lo que esta metrica se activara cuando se adopte el flujo de PRs.

### 3. Mean Time to Restore (MTTR)

**Valor:** N/A
**Clasificacion:** N/A (sin incidentes registrados)

**Fuente de datos:** `gh issue list --state closed --label bug --json createdAt,closedAt`

**Interpretacion:** No se han registrado issues con label "bug" en el fork. Esta metrica requiere tracking operacional de incidentes. Se recomienda:
1. Usar GitHub Issues con label "bug" para reportar problemas
2. Cerrar issues cuando se resuelvan para calcular MTTR automaticamente

### 4. Change Failure Rate (Tasa de Fallos)

**Valor:** 0% (0 reverts de 6 deploys)
**Clasificacion:** Elite

**Fuente de datos:** `git log --grep="revert" master`

**Interpretacion:** Ningun deploy ha requerido revert, lo cual indica estabilidad. Esta metrica se monitoreara conforme aumenten los cambios al codebase.

---

## Tendencia Historica

> Esta tabla se actualiza automaticamente en cada ejecucion del pipeline en GitHub Actions.

| Semana | Deploy Freq. | Lead Time | MTTR | CFR |
|--------|-------------|-----------|------|-----|
| 2026-W06 | 1.4/sem (High) | Pendiente | N/A | 0% (Elite) |

---

## Metodologia

### Fuentes de Datos

| Metrica | Fuente | Comando |
|---------|--------|---------|
| Deployment Frequency | Git history | `git log --oneline --since="30 days ago" master \| wc -l` |
| Lead Time for Changes | GitHub API (PRs) | `gh pr list --state merged --limit 20 --json createdAt,mergedAt` |
| Mean Time to Restore | GitHub API (Issues) | `gh issue list --state closed --label "bug" --limit 20 --json createdAt,closedAt` |
| Change Failure Rate | Git history | `git log --oneline --grep="revert" -i --since="30 days ago" master \| wc -l` |

### Clasificacion DORA

| Nivel | Deploy Frequency | Lead Time | MTTR | Change Failure Rate |
|-------|-----------------|-----------|------|-------------------|
| **Elite** | On-demand (diario) | < 1 dia | < 1 hora | 0-15% |
| **High** | Semanal | 1-7 dias | < 1 dia | 16-30% |
| **Medium** | Mensual | 1-4 semanas | < 1 semana | 31-45% |
| **Low** | > Mensual | > 1 mes | > 1 semana | > 45% |

### Supuestos y Limitaciones

1. **Cada commit a master se considera un deploy.** En un entorno de produccion real, el deploy podria estar condicionado a un pipeline exitoso
2. **Los reverts se detectan por el mensaje del commit** (`git log --grep="revert"`). Hotfixes directos que no incluyan "revert" no se contabilizan
3. **MTTR depende de la disciplina de usar GitHub Issues** con el label "bug". Incidentes no reportados no se capturan
4. **Lead Time requiere el uso de Pull Requests.** Commits directos a master tienen lead time = 0 por definicion

---

## Como Ejecutar

```bash
# Localmente (requiere gh CLI autenticado para Lead Time y MTTR)
bash scripts/dora-metrics.sh

# En GitHub Actions (automatico en push a master)
# Ver job "DORA Metrics" en .github/workflows/governance.yml
```

---

## Referencias

- [DORA Team - State of DevOps Reports](https://dora.dev)
- [Four Keys Project (Google)](https://github.com/dora-team/fourkeys)
- [Accelerate: The Science of Lean Software and DevOps](https://itrevolution.com/book/accelerate/)
