# Deliverables - Segunda Entrega

**Fecha:** 11 de Febrero, 2026
**Equipo:** Alessandro Alecio - Diego Sican
**Proyecto:** OWASP Juice Shop v19.1.1
**Focus:** Quality Strategy & Metrics

---

## Resumen Ejecutivo

En esta segunda entrega se implemento una estrategia de calidad completa con:

1. **Governance Pipeline** — Un workflow de GitHub Actions con 8 stages que mide complejidad ciclomatica y code coverage, con quality gates que bloquean PRs si las metricas se degradan
2. **DORA Metrics Dashboard** — Sistema automatizado de calculo de las 4 metricas DORA (Deployment Frequency, Lead Time, MTTR, Change Failure Rate)
3. **Quality Gates** — Umbrales definidos y justificados para cada stage del pipeline

---

## Entregables

### 1. Governance Pipeline
**Archivo:** [GOVERNANCE_PIPELINE.md](GOVERNANCE_PIPELINE.md)

Documentacion completa del pipeline CI/CD que incluye:
- Diagrama MermaidJS del flujo de 8 stages
- Tabla de quality gates con herramienta, umbral y accion por fallo
- Reporte de complejidad ciclomatica (2 funciones WARN, 0 FAIL)
- Umbrales de coverage (Lines >=60%, Branches >=50%)
- 5 decisiones de diseno justificadas

**Implementacion:** [`.github/workflows/governance.yml`](../../.github/workflows/governance.yml)

### 2. DORA Metrics Dashboard
**Archivo:** [DORA_DASHBOARD.md](DORA_DASHBOARD.md)

Dashboard con las 4 metricas DORA:
- **Deployment Frequency:** 1.4/semana (High)
- **Lead Time for Changes:** Pendiente (requiere PRs)
- **MTTR:** N/A (sin incidentes registrados)
- **Change Failure Rate:** 0% (Elite)

Incluye metodologia de calculo, clasificacion DORA, y tabla de tendencia historica.

**Implementacion:** [`scripts/dora-metrics.sh`](../../scripts/dora-metrics.sh)

### 3. Herramientas de Analisis
- [`scripts/complexity-report.js`](../../scripts/complexity-report.js) — Generador de reporte de complejidad ciclomatica
- [`scripts/dora-metrics.sh`](../../scripts/dora-metrics.sh) — Calculador automatizado de metricas DORA

---

## Mini-Rubrica

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| CI Pipeline runs successfully on PRs | Implementado | `.github/workflows/governance.yml` — 7 stages automatizados |
| Dashboard with four DORA metrics | Implementado | `DORA_DASHBOARD.md` + `scripts/dora-metrics.sh` |
| Define Quality gates + configure SonarQube | Parcial | Quality gates definidos en pipeline; SonarQube pendiente (trabajo futuro) |
| Refactoring plan is specific and prioritized | Pendiente | Se abordara en siguiente iteracion con datos del pipeline |

---

## Archivos Creados/Modificados

| Archivo | Accion | Proposito |
|---------|--------|-----------|
| `.github/workflows/governance.yml` | Creado | Pipeline de gobernanza con 8 stages |
| `.eslintrc.js` | Modificado | Regla `complexity` con umbral 15 |
| `scripts/complexity-report.js` | Creado | Reporte de complejidad ciclomatica |
| `scripts/dora-metrics.sh` | Creado | Calculador de metricas DORA |
| `deliverables/entrega-2/GOVERNANCE_PIPELINE.md` | Creado | Documentacion del pipeline |
| `deliverables/entrega-2/DORA_DASHBOARD.md` | Creado | Dashboard de metricas DORA |
| `deliverables/entrega-2/README.md` | Creado | Este archivo |

---

## Decisiones No-Triviales

### D1: Workflow Separado del Upstream
**Decision:** Crear `governance.yml` separado en lugar de modificar el `ci.yml` existente.
**Razon:** El `ci.yml` pertenece al upstream de OWASP y tiene logica condicional para forks (`github.repository == 'juice-shop/juice-shop'`). Modificarlo crearia conflictos de merge. Nuestro pipeline es complementario.

### D2: ESLint complexity vs Herramientas Externas (Plato, SonarQube)
**Decision:** Usar la regla `complexity` built-in de ESLint.
**Razon:** Zero dependencias nuevas, integracion nativa con el lint step existente. Plato esta sin mantenimiento. SonarQube se integrara como trabajo futuro.

### D3: Umbrales Iniciales Moderados
**Decision:** Coverage al 60% (no 80%), complejidad warn en 15 (no 10).
**Razon:** El codebase tiene codigo legacy del upstream. Umbrales agresivos requeririan backfill de tests fuera del scope. Los umbrales elegidos establecen un piso significativo que previene degradacion sin bloquear el trabajo existente.

### D4: Security Scan como Warning
**Decision:** `npm audit` no falla el pipeline.
**Razon:** Las vulnerabilidades de Juice Shop son intencionales (es un proyecto de entrenamiento en seguridad). El reporte se captura como artefacto para documentacion.

### D5: DORA Metrics via Script Propio
**Decision:** Shell script con git + gh CLI en lugar de Four Keys (Google) o Grafana.
**Razon:** Mas transparente y educativo para un proyecto universitario. Sin dependencias externas de infraestructura. Los datos se generan on-demand y son reproducibles.

---

## Como Verificar

```bash
# 1. Verificar lint con complexity rule
npm run lint

# 2. Generar reporte de complejidad
node scripts/complexity-report.js

# 3. Generar metricas DORA (localmente)
bash scripts/dora-metrics.sh

# 4. Pipeline completo (push a GitHub)
git push origin master
# Ver tab "Actions" en GitHub → workflow "Governance Pipeline"
```

---

## Trabajo Futuro (Proxima Iteracion)

- **SonarQube/SonarCloud:** Quality gates de coverage, bugs, code smells, duplicacion
- **Tech Debt Audit:** Top 3 hotspots (churn x complejidad) con plan Strangler Fig
- **Plan de Refactorizacion:** Priorizado por riesgo/impacto usando datos del pipeline
