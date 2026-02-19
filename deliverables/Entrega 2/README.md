# Deliverables - Segunda Entrega

**Fecha:** 11 de Febrero, 2026
**Equipo:** Alessandro Alecio - Diego Sican
**Proyecto:** OWASP Juice Shop v19.1.1
**Focus:** Quality Strategy & Metrics

---

## Resumen Ejecutivo

En esta segunda entrega se implemento una estrategia de calidad completa con:

1. **Governance Pipeline** — Un workflow de GitHub Actions con 8+ stages que mide complejidad ciclomatica y code coverage, con quality gates que bloquean PRs si las metricas se degradan
2. **DORA Metrics Dashboard** — Sistema automatizado de calculo de las 4 metricas DORA (Deployment Frequency, Lead Time, MTTR, Change Failure Rate)
3. **Quality Gates** — Umbrales definidos y justificados para cada stage del pipeline
4. **SonarCloud Integration** — Analisis de calidad de codigo con quality gates de bugs, code smells, duplicacion y coverage
5. **Tech Debt Audit** — Analisis de hotspots (churn x complejidad) con top 10 archivos y matriz de riesgo/impacto
6. **Plan de Refactorizacion** — Estrategia Strangler Fig para los top 3 candidatos con metricas de exito

---

## Entregables

### 1. Governance Pipeline
**Archivo:** [GOVERNANCE_PIPELINE.md](GOVERNANCE_PIPELINE.md)

Documentacion completa del pipeline CI/CD que incluye:
- Diagrama MermaidJS del flujo de 8+ stages (incluyendo SonarCloud)
- Tabla de quality gates con herramienta, umbral y accion por fallo
- Reporte de complejidad ciclomatica (2 funciones WARN, 0 FAIL)
- Umbrales de coverage calibrados (Server: Lines >=20%, API: Lines >=40%)
- 7 decisiones de diseno justificadas

**Implementacion:** [`.github/workflows/governance.yml`](../../.github/workflows/governance.yml)

### 2. DORA Metrics Dashboard
**Archivo:** [DORA_DASHBOARD.md](DORA_DASHBOARD.md)

Dashboard con las 4 metricas DORA:
- **Deployment Frequency:** 2.1/semana (High)
- **Lead Time for Changes:** 6.4 dias (High)
- **MTTR:** 18.5 horas (High)
- **Change Failure Rate:** 0% (Elite)

Incluye metodologia de calculo, clasificacion DORA, y tabla de tendencia historica.

**Implementacion:** [`scripts/dora-metrics.sh`](../../scripts/dora-metrics.sh)

### 3. SonarCloud Integration
**Archivo:** [GOVERNANCE_PIPELINE.md](GOVERNANCE_PIPELINE.md) (Stage 5b)

Integracion de SonarCloud en el pipeline de gobernanza:
- Configuracion en [`sonar-project.properties`](../../sonar-project.properties)
- Stage 5b en el workflow que consume reportes de coverage de Stages 3 y 4
- Quality gates: bugs, code smells, duplicacion, coverage en codigo nuevo

Resultados de la primera ejecucion:
- **Bugs:** 0 | **Vulnerabilities:** 33 (intencionales) | **Code Smells:** 256
- **Coverage:** 75.7% | **Duplicated Lines:** 0.7%
- **Reliability:** A | **Maintainability:** A | **Security:** E (esperado)
- **Dashboard:** [sonarcloud.io](https://sonarcloud.io/dashboard?id=SebastianAlecio_juice-shop)

**Implementacion:** [`sonar-project.properties`](../../sonar-project.properties) + Stage 5b en [`.github/workflows/governance.yml`](../../.github/workflows/governance.yml)

### 4. Tech Debt Audit
**Archivo:** [TECH_DEBT_AUDIT.md](TECH_DEBT_AUDIT.md)

Analisis de hotspots con formula churn x complejidad ciclomatica:
- **200 archivos** analizados
- **Top 10 hotspots** con score normalizado 0-100
- **3 archivos CRITICO:** `verify.ts` (100), `datacreator.ts` (97), `server.ts` (95)
- **2 archivos ALTO:** `order.ts` (57), `utils.ts` (53)
- Matriz de riesgo/impacto
- Top 3 candidatos para refactorizacion con justificacion

**Implementacion:** [`scripts/hotspot-analysis.js`](../../scripts/hotspot-analysis.js)

### 5. Plan de Refactorizacion (Strangler Fig)
**Archivo:** [REFACTORING_PLAN.md](REFACTORING_PLAN.md)

Plan de refactorizacion priorizado para los 3 archivos con mayor deuda tecnica:
- **`routes/verify.ts`** — Helper para eliminar 120 LOC duplicadas (Prioridad ALTA)
- **`routes/order.ts`** — Extraccion de servicios: PricingService, PdfService, PaymentService (Prioridad ALTA)
- **`lib/startup/validateConfig.ts`** — Patron Validator Registry (Prioridad MEDIA)

Incluye metricas antes/despues, cronograma, evaluacion de riesgo por candidato.

### 6. Herramientas de Analisis
- [`scripts/complexity-report.js`](../../scripts/complexity-report.js) — Generador de reporte de complejidad ciclomatica
- [`scripts/dora-metrics.sh`](../../scripts/dora-metrics.sh) — Calculador automatizado de metricas DORA
- [`scripts/hotspot-analysis.js`](../../scripts/hotspot-analysis.js) — Analizador de hotspots (churn x complejidad)

---

## Mini-Rubrica

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| CI Pipeline runs successfully on PRs | Implementado | `.github/workflows/governance.yml` — 10 jobs (8 stages + SonarCloud + DORA) |
| Dashboard with four DORA metrics | Implementado | `DORA_DASHBOARD.md` + `scripts/dora-metrics.sh` |
| Define Quality gates + configure SonarQube | Implementado | `sonar-project.properties` + Stage 5b en `governance.yml` + quality gates documentados |
| Refactoring plan is specific and prioritized | Implementado | `REFACTORING_PLAN.md` — 3 candidatos con Strangler Fig, metricas de exito, cronograma |

---

## Archivos Creados/Modificados

| Archivo | Accion | Proposito |
|---------|--------|-----------|
| `.github/workflows/governance.yml` | Creado/Modificado | Pipeline de gobernanza con 8+ stages (incluye SonarCloud) |
| `.eslintrc.js` | Modificado | Regla `complexity` con umbral 15 |
| `sonar-project.properties` | Creado | Configuracion de SonarCloud |
| `scripts/complexity-report.js` | Creado | Reporte de complejidad ciclomatica |
| `scripts/dora-metrics.sh` | Creado | Calculador de metricas DORA |
| `scripts/hotspot-analysis.js` | Creado | Analisis de hotspots (churn x complejidad) |
| `deliverables/Entrega 2/GOVERNANCE_PIPELINE.md` | Creado | Documentacion del pipeline |
| `deliverables/Entrega 2/DORA_DASHBOARD.md` | Creado | Dashboard de metricas DORA |
| `deliverables/Entrega 2/TECH_DEBT_AUDIT.md` | Creado | Auditoria de deuda tecnica |
| `deliverables/Entrega 2/REFACTORING_PLAN.md` | Creado | Plan de refactorizacion Strangler Fig |
| `deliverables/Entrega 2/README.md` | Creado | Este archivo |

---

## Decisiones No-Triviales

### D1: Workflow Separado del Upstream
**Decision:** Crear `governance.yml` separado en lugar de modificar el `ci.yml` existente.
**Razon:** El `ci.yml` pertenece al upstream de OWASP y tiene logica condicional para forks (`github.repository == 'juice-shop/juice-shop'`). Modificarlo crearia conflictos de merge. Nuestro pipeline es complementario.

### D2: ESLint complexity vs Herramientas Externas (Plato, SonarQube)
**Decision:** Usar la regla `complexity` built-in de ESLint para el analisis primario.
**Razon:** Zero dependencias nuevas, integracion nativa con el lint step existente. Plato esta sin mantenimiento. SonarCloud complementa con metricas adicionales (cognitive complexity, duplicacion).

### D3: Calibracion de Umbrales de Coverage
**Decision inicial:** 60% lines, 50% branches, 55% functions. **Fallo en CI** — coverage real de server tests es ~21%.
**Decision final:** Umbrales calibrados con datos reales (server: 20/15/15%, API: 40/5/25%).
**Razon:** Se aplico el principio "baseline - margen": el objetivo es detectar degradacion, no alcanzar un numero arbitrario. El pipeline bloquea PRs que reduzcan coverage por debajo de los pisos actuales.

### D4: Security Scan como Warning
**Decision:** `npm audit` no falla el pipeline.
**Razon:** Las vulnerabilidades de Juice Shop son intencionales (es un proyecto de entrenamiento en seguridad). El reporte se captura como artefacto para documentacion.

### D5: DORA Metrics via Script Propio
**Decision:** Shell script con git + gh CLI en lugar de Four Keys (Google) o Grafana.
**Razon:** Mas transparente y educativo para un proyecto universitario. Sin dependencias externas de infraestructura. Los datos se generan on-demand y son reproducibles.

### D6: SonarCloud como Warning
**Decision:** SonarCloud quality gate no bloquea el pipeline inicialmente.
**Razon:** Similar a D4, SonarCloud reportaria todas las vulnerabilidades intencionales como issues de seguridad. Se desactivan hotspots de seguridad en la configuracion y se usa el quality gate solo para metricas de mantenibilidad (bugs, code smells, duplicacion, coverage en codigo nuevo).

### D7: Churn x Complejidad como Metrica de Hotspots
**Decision:** Usar formula `churn x complexity` en lugar de solo CC o solo churn.
**Razon:** Un archivo con CC alta pero que nunca cambia no es urgente (bajo riesgo operativo). Un archivo que cambia mucho pero tiene baja complejidad es manejable. La combinacion identifica archivos que son simultaneamente complejos Y frecuentemente modificados — los que mas se benefician de refactorizacion. Basado en Tornhill (2015), *Your Code as a Crime Scene*.

---

## Como Verificar

```bash
# 1. Verificar lint con complexity rule
npm run lint

# 2. Generar reporte de complejidad
node scripts/complexity-report.js

# 3. Generar analisis de hotspots
node scripts/hotspot-analysis.js

# 4. Generar metricas DORA (localmente)
bash scripts/dora-metrics.sh

# 5. Pipeline completo (push a GitHub)
git push origin master
# Ver tab "Actions" en GitHub → workflow "Governance Pipeline"
```

---

## Trabajo Futuro (Proxima Iteracion)

- **Ejecutar Refactorizacion:** Implementar las fases del plan Strangler Fig para los 3 candidatos
- **SonarCloud Enforcement:** Cambiar SonarCloud de warning a blocking una vez calibrados los umbrales
- **DORA Historical Tracking:** Acumulacion de metricas historicas conforme el equipo trabaja
- **Mutation Testing:** Agregar mutation testing para funciones criticas de seguridad
