# Deliverables — OWASP Juice Shop

**Equipo:** Alessandro Alecio - Diego Sican
**Proyecto:** OWASP Juice Shop v19.1.1
**Curso:** Ingenieria de Software Avanzada
**Periodo:** Febrero - Marzo 2026

---

## Indice de Entregas

| # | Fecha | Focus | Entregables Clave | Link |
|---|-------|-------|-------------------|------|
| 1 | 2 Feb 2026 | Domain Analysis & Onboarding | Context Map (10 bounded contexts), User Stories (4), Onboarding Log (8 friction points) | [Entrega 1](Entrega%201/README.md) |
| 2 | 11 Feb 2026 | Governance & Tech Debt | Governance Pipeline, DORA Dashboard, Tech Debt Audit (hotspot analysis), Refactoring Plan (Strangler Fig) | [Entrega 2](Entrega%202/README.md) |
| 3 | 26 Feb 2026 | Supply Chain Security | SBOM (750 deps, CycloneDX), Vulnerability Patching (npm audit + Trivy), Secret Protection (git hooks + secretlint) | [Entrega 3](Entrega%203/README.md) |
| 4 | 5 Mar 2026 | Architecture Strategy & DevEx | One-Command Docker Setup (`docker compose up`), ADR: Migracion a Microservicios (RFC 10 secciones) | [Entrega 4](Entrega%204/README.md) |
| 5 | 20 Mar 2026 | FinOps Optimization & Final Defense | Cost Optimization (77% latencia, 335% throughput), Benchmark antes/despues, Final Repo Polish | [Entrega 5](Entrega%205/README.md) |

---

## Resumen por Entrega

### Entrega 1 — Domain Analysis & Onboarding
Analisis de dominio con Domain-Driven Design: 10 bounded contexts identificados (Identity, Shopping, Challenge, Chatbot, etc.), relaciones entre contextos (Shared Kernel, Customer-Supplier), 4 user stories en formato Connextra, y onboarding log documentando 8 friction points del setup del proyecto.

### Entrega 2 — Governance & Tech Debt
Pipeline de gobernanza con branch protection y CI/CD, dashboard DORA con 4 metricas clave (Lead Time 6.4 dias, CFR 0%), auditoria de deuda tecnica con hotspot analysis (churn x complejidad ciclomatica) identificando 3 archivos criticos, y plan de refactorizacion con Strangler Fig Pattern.

### Entrega 3 — Supply Chain Security
SBOM completo con CycloneDX (750 dependencias de produccion, 15 licencias), escaneo de vulnerabilidades con npm audit + Trivy (antes/despues de patches), y proteccion de secretos con git hooks (Husky) + secretlint para deteccion automatica de credenciales en pre-commit.

### Entrega 4 — Architecture Strategy & DevEx
Setup de entorno con un solo comando via `docker-compose.yml` (50s primera vez, 5s con cache), y RFC profesional de 10 secciones (template Buritica) evaluando migracion a microservicios. Decision: Modular Monolith + extraccion selectiva de 2 servicios.

### Entrega 5 — FinOps Optimization & Final Defense
Identificacion y refactorizacion de 3 funciones resource-intensive: `getLanguageList()` (44 lecturas de disco/request → lazy cache, **77% menos latencia**), `dataExport()` (callback pyramid → Promise.all), `databaseRelatedChallenges()` (8 funciones duplicadas → 1 helper, **-79% LOC**). Benchmark con `autocannon` mostrando 334.7% mas throughput.

---

## Herramientas Utilizadas

| Herramienta | Entrega(s) | Proposito |
|-------------|-----------|-----------|
| ESLint (`complexity` rule) | 2 | Medicion de complejidad ciclomatica |
| Git log analysis | 2 | Medicion de churn (commits por archivo) |
| npm audit | 3 | Escaneo de vulnerabilidades en dependencias |
| Trivy | 3 | Escaneo de vulnerabilidades en contenedores |
| CycloneDX | 3 | Generacion de SBOM |
| Husky + secretlint | 3 | Git hooks para deteccion de secretos |
| Docker Compose | 4 | One-command environment setup |
| autocannon | 5 | HTTP load testing para benchmarks |

---

## Estructura del Repositorio (Deliverables)

```
deliverables/
├── README.md                              ← Este archivo
├── Entrega 1/
│   ├── README.md
│   ├── CONTEXT_MAP.md
│   ├── USER_STORIES.md
│   └── ONBOARDING_LOG.md
├── Entrega 2/
│   ├── README.md
│   ├── GOVERNANCE_PIPELINE.md
│   ├── DORA_DASHBOARD.md
│   ├── TECH_DEBT_AUDIT.md
│   └── REFACTORING_PLAN.md
├── Entrega 3/
│   ├── README.md
│   ├── SBOM_REPORT.md
│   ├── VULNERABILITY_PATCHING.md
│   ├── SECRET_PROTECTION.md
│   ├── sbom/
│   └── vulnerability-scan/
├── Entrega 4/
│   ├── README.md
│   ├── DOCKER_SETUP.md
│   └── ADR_MICROSERVICES_MIGRATION.md
└── Entrega 5/
    ├── README.md
    └── COST_OPTIMIZATION.md
```
