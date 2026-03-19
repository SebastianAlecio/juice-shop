# RFC-001: Migracion Incremental de Monolito a Microservicios

## Metadata

| Campo | Valor |
|-------|-------|
| **RFC** | RFC-001 |
| **Titulo** | Migracion Incremental de OWASP Juice Shop de Arquitectura Monolitica a Microservicios mediante Strangler Fig Pattern |
| **Autores** | Alessandro Alecio, Diego Sican |
| **Fecha** | 5 de Marzo, 2026 |
| **Estado** | Proposed |
| **Proyecto** | OWASP Juice Shop v19.1.1 |

---

## 1. Executive Summary

OWASP Juice Shop es una aplicacion monolitica de 50K+ LOC donde un unico proceso Node.js/Express orquesta 62 archivos de rutas, 22 modelos Sequelize y 12 librerias compartidas a traves de 10 bounded contexts identificados en [Entrega 1](../Entrega%201/CONTEXT_MAP.md). El analisis de hotspots de [Entrega 2](../Entrega%202/TECH_DEBT_AUDIT.md) revelo que los 3 archivos mas criticos (`verify.ts` score=100, `datacreator.ts` score=97, `server.ts` score=95) concentran el riesgo de defectos del sistema. Las 750 dependencias de produccion documentadas en [Entrega 3](../Entrega%203/SBOM_REPORT.md) son compartidas por todos los contextos, amplificando el blast radius de cada vulnerabilidad.

Este RFC propone una migracion incremental hacia microservicios utilizando el patron Strangler Fig — ya validado a nivel de codigo en Entrega 2 — elevandolo ahora a nivel de servicio. La propuesta es pragmatica: extraer unicamente los Generic Subdomains (Challenge Service + Chatbot Service) como proof of concept, manteniendo los Core Domains en un monolito modular.

**Decision:** Adoptar una estrategia hibrida — Modular Monolith para Core Domains + extraccion de 2 microservicios para Generic Subdomains.

---

## 2. Motivation

### 2.1 Pain Points del Monolito Actual

#### Evidencia cuantitativa (Entregas 1-3)

| Problema | Metrica | Fuente |
|----------|---------|--------|
| God Object central | `server.ts`: 755 LOC, 583 commits, CC=7, hotspot=95 | [Tech Debt Audit](../Entrega%202/TECH_DEBT_AUDIT.md) |
| Cross-cutting verificacion | `verify.ts`: 440 LOC, 332 commits, CC=13, hotspot=100 | [Tech Debt Audit](../Entrega%202/TECH_DEBT_AUDIT.md) |
| Seeding monolitico | `datacreator.ts`: 746 LOC, 379 commits, CC=11, hotspot=97 | [Tech Debt Audit](../Entrega%202/TECH_DEBT_AUDIT.md) |
| 10 contextos acoplados | Identity, Shopping, Delivery, Feedback, Privacy, Challenge, Admin, Blockchain, Chatbot, Localization — todos en un proceso | [Context Map](../Entrega%201/CONTEXT_MAP.md) |
| Supply chain compartida | 750 dependencias de produccion, 15 licencias — todas compartidas | [SBOM Report](../Entrega%203/SBOM_REPORT.md) |
| Build time elevado | ~7 minutos para `npm install` + build frontend + compilacion TypeScript | [Onboarding Log](../Entrega%201/ONBOARDING_LOG.md) |
| Lead Time | 6.4 dias promedio para llevar cambios a produccion | [DORA Dashboard](../Entrega%202/DORA_DASHBOARD.md) |

#### Analisis arquitectonico

El archivo `server.ts` actua como **God Object**: en sus 755 lineas registra las 62 rutas, configura 15+ middlewares Express, inicializa finale-rest para 14 modelos CRUD, siembra la base de datos, arranca el servidor HTTP y configura WebSockets. Cualquier cambio en cualquier contexto requiere modificar o al menos revalidar este archivo.

El archivo `verify.ts` es un **cross-cutting concern**: sus 28 funciones de verificacion de challenges estan acopladas a 8 de los 10 bounded contexts. Un cambio en el modelo de Feedback puede romper la verificacion de challenges de Shopping.

La base de datos SQLite es compartida por los 10 contextos sin boundaries de esquema — los 22 modelos coexisten en un solo archivo `data/juiceshop.sqlite` con `force: true` en cada reinicio.

### 2.2 Objetivos

| # | Objetivo | Metrica Target |
|---|----------|---------------|
| O1 | Reducir blast radius de cambios | Deploy units independientes por contexto |
| O2 | Reducir acoplamiento entre contextos | Eliminar imports directos cross-context |
| O3 | Reducir dependencias por servicio | De 750 compartidas a <200 por servicio |
| O4 | Mejorar fault isolation | Fallo en Chatbot no afecta Shopping |
| O5 | Reducir build time por servicio | De ~7 min total a ~2 min por servicio |

### 2.3 Non-Goals

- **No es sobre escalabilidad de trafico.** Juice Shop es una aplicacion de entrenamiento, no un sistema bajo carga.
- **No es sobre cambio de lenguaje.** Todo se mantiene en TypeScript/Node.js.
- **No es sobre cambio de base de datos.** SQLite se mantiene por servicio individual.
- **No es sobre reescritura completa.** Se utiliza Strangler Fig para migracion incremental.

---

## 3. Proposed Implementation

### 3.1 Arquitectura Target

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway (Express)                  │
│              (server.ts simplificado ~200 LOC)           │
├─────────────┬─────────────┬─────────────────────────────┤
│             │             │                             │
│  ┌──────────▼──────────┐  │  ┌──────────────────────┐   │
│  │  Challenge Service  │  │  │   Chatbot Service     │   │
│  │  ─────────────────  │  │  │  ──────────────────   │   │
│  │  challenge.ts       │  │  │  chatbot.ts (247 LOC) │   │
│  │  hint.ts            │  │  │  juicy-chat-bot       │   │
│  │  challengeUtils.ts  │  │  │  Stateless            │   │
│  │  codingChallenges.ts│  │  │  Puerto: 3002         │   │
│  │  verify.ts          │  │  └──────────────────────┘   │
│  │  Puerto: 3001       │  │                             │
│  └─────────────────────┘  │                             │
│                           │                             │
│  ┌────────────────────────▼─────────────────────────┐   │
│  │           Core Monolith (Modular)                 │   │
│  │  ─────────────────────────────────────────────    │   │
│  │  Identity Module  │  Shopping Module              │   │
│  │  Delivery Module  │  Feedback Module              │   │
│  │  Privacy Module   │  Admin Module                 │   │
│  │  Blockchain Module│  Localization Module           │   │
│  │  Puerto: 3000                                     │   │
│  └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Estrategia de Migracion: Strangler Fig

El patron Strangler Fig, ya adoptado en [Entrega 2](../Entrega%202/REFACTORING_PLAN.md) para refactorizacion a nivel de funciones, se eleva ahora a nivel de servicios:

1. **Crear** el nuevo servicio junto al monolito
2. **Redirigir** trafico gradualmente del monolito al servicio via API Gateway
3. **Eliminar** el codigo del monolito cuando el servicio es estable

#### Phase 0: Preparacion (Mes 0-1)

| Tarea | Descripcion | Riesgo |
|-------|-------------|--------|
| Definir contratos API | OpenAPI specs para Challenge y Chatbot endpoints | BAJO |
| Introducir API Gateway | Capa de reverse proxy en Express frente al monolito | BAJO |
| Configurar inter-service communication | HTTP REST para sincronico, EventEmitter para eventos | BAJO |

#### Phase 1: Extraccion de Generic Subdomains (Mes 2-4)

**Servicio 1: Challenge Service**

| Aspecto | Detalle |
|---------|---------|
| **Archivos a extraer** | `routes/verify.ts` (440 LOC), `routes/continueCode.ts`, `routes/vulnCodeSnippet.ts`, `routes/vulnCodeFixes.ts`, `lib/challengeUtils.ts`, `lib/codingChallenges.ts`, `models/challenge.ts`, `models/hint.ts` |
| **LOC total** | ~800 |
| **Endpoints** | 5 (`/api/Challenges`, `/api/Challenges/:id`, `/rest/continue-code/*`, `/snippets/*`) |
| **Base de datos** | `challenge-service.sqlite` (tablas: Challenges, Hints) |
| **Dependencias externas** | Ninguna Shared Kernel — Challenge Context no depende de User ([Context Map §2.6](../Entrega%201/CONTEXT_MAP.md)) |
| **Riesgo** | **BAJO** — ya identificado como primer candidato de extraccion en Entrega 1 |

Justificacion con datos:
- Entrega 1 Context Map §8 recomienda: *"Challenge Context — ya esta aislado, no tiene dependencias hacia User"*
- Relacion DDD con Shopping es **Conformist** (solo lectura), no Shared Kernel
- 5 endpoints bien definidos con contrato claro
- Sin dependencia de autenticacion para consultar challenges

**Servicio 2: Chatbot Service**

| Aspecto | Detalle |
|---------|---------|
| **Archivos a extraer** | `routes/chatbot.ts` (247 LOC), `data/chatbot/` (training data) |
| **LOC total** | ~300 |
| **Endpoints** | 2 (`/rest/chatbot/respond`, `/rest/chatbot/status`) |
| **Base de datos** | Ninguna (stateless) |
| **Dependencias externas** | Solo necesita `userId` para personalizar respuestas — se pasa como header |
| **Riesgo** | **BAJO** — servicio stateless, acoplamiento minimo |

Justificacion con datos:
- Entrega 1 Context Map §2.9: *"N/A (stateless)"* como Aggregate Root
- Relacion con Identity es **ACL** (Anti-Corruption Layer) — ya aislado por diseno
- Hotspot score de `chatbot.ts` = 26 (MEDIO) con CC=13 — complejidad contenida en un solo archivo
- Libreria `juicy-chat-bot` es autocontenida

#### Phase 2: Enforce Module Boundaries en Core Monolith (Mes 5-8)

En lugar de extraer los Core Domains como microservicios, se refuerzan las boundaries internas:

| Tarea | Implementacion |
|-------|---------------|
| Directory restructuring | Reorganizar `routes/`, `models/`, `lib/` por bounded context en lugar de por capa tecnica |
| ESLint import rules | `no-restricted-imports` para prevenir imports cross-context |
| Domain events | EventEmitter interno para comunicacion entre modulos |
| Per-module testing | Test suites independientes por modulo |

**Justificacion para NO extraer Core Domains:**

El **Shared Kernel** entre Identity y Shopping es el principal bloqueador:

```
User ──┬── Basket (Shopping)
       ├── Card (Shopping)
       ├── Address (Delivery)
       ├── Feedback (Feedback)
       ├── Complaint (Feedback)
       ├── PrivacyRequest (Privacy)
       └── Wallet (Blockchain)
```

El modelo `User` es referenciado por **8+ entidades** en 5 contextos diferentes ([Context Map §4](../Entrega%201/CONTEXT_MAP.md)). Extraer Identity como microservicio requeriria:
- Duplicar datos de User en cada servicio (data consistency risk)
- Implementar saga pattern para transacciones cross-service
- Mantener sincronizacion eventual de estados

El costo supera significativamente el beneficio para una aplicacion de entrenamiento.

### 3.3 Patrones de Comunicacion

| Patron | Caso de Uso | Implementacion |
|--------|------------|----------------|
| **Sync REST** | Consultas cross-service (Gateway → Service) | HTTP via `fetch` nativo de Node.js |
| **Async Events** | Challenge solved → WebSocket notification | Redis Pub/Sub o EventEmitter compartido |
| **API Gateway** | Routing de cliente a servicio | Express reverse proxy (`http-proxy-middleware`) |

### 3.4 Estrategia de Datos

**Estado actual:** Un solo archivo SQLite (`data/juiceshop.sqlite`) con `force: true` en cada reinicio via `sequelize.sync()`.

**Estado propuesto:**

| Servicio | Base de Datos | Tablas | Seed |
|----------|--------------|--------|------|
| Challenge Service | `challenge-service.sqlite` | Challenges, Hints | `challenges.yml` |
| Chatbot Service | Ninguna | N/A | Training data en archivos JSON |
| Core Monolith | `juiceshop.sqlite` | Users, Baskets, Products, etc. (18 tablas restantes) | `datacreator.ts` |

**Foreign keys cross-service:** No existen para Challenge (independiente). Para Chatbot, el `userId` se pasa como dato en el request, no como FK de base de datos. Esto es seguro porque `force: true` recrea toda la data en cada inicio.

---

## 4. Metrics and Dashboard

### 4.1 Metricas de Exito

| Metrica | Baseline Actual | Target Post-Phase 1 | Fuente |
|---------|----------------|---------------------|--------|
| Deploy units | 1 monolito | 3 (monolito + 2 servicios) | Infraestructura |
| `server.ts` LOC | 755 | ~400 (sin challenge routes) | `wc -l server.ts` |
| Dependencias por servicio | 750 (todas) | Challenge: ~50, Chatbot: ~20, Core: ~700 | SBOM por servicio |
| Hotspot score `server.ts` | 95 (CRITICO) | <50 (ALTO→MEDIO) | `hotspot-analysis.js` |
| Build time por servicio | ~7 min (total) | Challenge: ~1 min, Chatbot: ~30s, Core: ~5 min | CI pipeline |
| Lead Time | 6.4 dias | <5 dias (cambios en servicios) | DORA |
| Change Failure Rate | 0% (Elite) | Mantener 0% | DORA |

### 4.2 Monitoring Propuesto

| Capa | Herramienta | Proposito |
|------|-------------|-----------|
| Health checks | Docker Compose healthcheck | Disponibilidad por servicio |
| Metricas de aplicacion | Prometheus (ya integrado via `prom-client`) | Latencia, throughput por servicio |
| Logs | Winston (ya integrado) | Logs centralizados |
| Tracing distribuido | OpenTelemetry (futuro) | Correlacion de requests cross-service |
| SBOM por servicio | CycloneDX | Supply chain independiente |

---

## 5. Drawbacks

### 5.1 Complejidad Operacional Incrementada

| Antes | Despues |
|-------|---------|
| `npm start` | `docker compose up` (3 servicios) |
| 1 proceso para debuggear | 3 procesos + logs distribuidos |
| 1 suite de tests | Tests por servicio + tests de integracion cross-service |
| 1 pipeline CI | 3 pipelines + pipeline de integracion |

**Impacto:** El `docker-compose.yml` crece de 1 a 3+ servicios. La depuracion de problemas cross-service requiere correlacion de logs.

### 5.2 Impacto en el Valor Educativo

OWASP Juice Shop es una **aplicacion de entrenamiento en seguridad**. Su valor reside en ser simple de desplegar y usar. La complejidad de microservicios puede:

- Dificultar el onboarding de nuevos contribuidores
- Oscurecer las vulnerabilidades intencionales detras de infraestructura
- Romper challenges que dependen de comportamiento monolitico (ej: XSS que requiere server-side rendering en el mismo proceso)
- Aumentar la barrera de entrada para workshops de seguridad

**Mitigacion:** La extraccion se limita a Generic Subdomains que no contienen vulnerabilidades de challenges principales.

### 5.3 El Problema del Shared Kernel

La relacion Identity ↔ Shopping es un **Shared Kernel** ([Context Map §3.2](../Entrega%201/CONTEXT_MAP.md)):

- `User` es referenciado por `Basket`, `Card`, `Address`, `Feedback`, `Complaint`, `PrivacyRequest`, `Wallet`
- Separar estos contextos requiere duplicacion de datos o sincronizacion eventual
- El patron Saga agrega complejidad significativa para un beneficio marginal

**Decision:** No extraer Core Domains. El Shared Kernel se mantiene intacto dentro del monolito modular.

### 5.4 Complejidad de Testing

| Tipo de Test | Impacto |
|-------------|---------|
| Mocha server tests | Deben dividirse por servicio |
| Frisby API tests | Portables (testan HTTP), pero requieren orquestacion de servicios |
| Cypress E2E | Minimo impacto — testan via browser contra el Gateway |
| RSN (vuln-code-snippets) | Requiere adaptacion si snippets referencian archivos movidos |

### 5.5 Costo-Beneficio para una Aplicacion de Entrenamiento

El beneficio principal de microservicios — escalabilidad independiente — es **irrelevante** para Juice Shop. Los beneficios reales (fault isolation, deploy independiente) son modestos para un equipo de 2 personas.

**Este es el drawback mas significativo.** Se mitiga limitando la extraccion a un proof of concept con 2 servicios de bajo riesgo.

---

## 6. Alternatives

### Alternative A: Modular Monolith (Sin Extraccion)

| Aspecto | Detalle |
|---------|---------|
| **Descripcion** | Mantener un solo deployment unit, pero reorganizar internamente por bounded context con boundaries enforced via ESLint |
| **Pros** | Zero complejidad operacional, mismo codebase, sin overhead de red |
| **Contras** | No hay deploy independiente, no hay fault isolation, no hay reduccion de dependencias |
| **Esfuerzo** | BAJO (~2 semanas) |

### Alternative B: Database-First Split

| Aspecto | Detalle |
|---------|---------|
| **Descripcion** | Mantener un solo proceso Node.js pero dividir SQLite en multiples archivos por contexto |
| **Pros** | Mejor aislamiento de datos sin complejidad de red |
| **Contras** | Sequelize asume single DB; requiere refactoring significativo de models/index.ts y relaciones |
| **Esfuerzo** | MEDIO (~4 semanas) |

### Alternative C: Serverless Functions

| Aspecto | Detalle |
|---------|---------|
| **Descripcion** | Extraer endpoints stateless como funciones serverless (AWS Lambda, Cloudflare Workers) |
| **Pros** | Zero infraestructura, auto-scaling, pago por uso |
| **Contras** | Cold start latency, vendor lock-in, incompatible con la naturaleza self-hosted de Juice Shop |
| **Esfuerzo** | ALTO (~6 semanas) |

### Matriz de Comparacion

| Criterio | Peso | Microservicios (Propuesta) | Modular Monolith | DB Split | Serverless |
|----------|------|---------------------------|------------------|----------|------------|
| Complejidad operacional | 25% | MEDIA | **BAJA** | BAJA | MEDIA |
| Deploy independiente | 20% | **SI** | NO | NO | PARCIAL |
| Fault isolation | 15% | **SI** | NO | NO | SI |
| Complejidad de desarrollo | 15% | MEDIA | **BAJA** | MEDIA | ALTA |
| Impacto en testing | 10% | ALTO | **BAJO** | MEDIO | ALTO |
| Relevancia para Juice Shop | 10% | BAJA | **ALTA** | MEDIA | BAJA |
| Reduccion de dependencias | 5% | **SI** | NO | NO | SI |
| **Score ponderado** | | **62/100** | **72/100** | **55/100** | **45/100** |

**Resultado:** El Modular Monolith tiene el mejor score ponderado. Sin embargo, la propuesta hibrida (Modular Monolith + extraccion selectiva de 2 servicios) combina los beneficios de ambas aproximaciones.

---

## 7. Potential Impacts and Dependencies

### 7.1 Pipeline CI/CD (Entrega 2)

| Componente | Impacto | Adaptacion |
|-----------|---------|------------|
| `governance.yml` | Jobs de test por servicio | Agregar matrix strategy para multi-service builds |
| SonarCloud | Configurar multi-project | Separate project keys por servicio |
| Quality gates | Coverage thresholds por servicio | Mantener Server 20%, API 40% por servicio |
| DORA metrics | Lead Time calculado por servicio | Adaptar `scripts/dora-metrics.sh` |

### 7.2 Supply Chain Security (Entrega 3)

| Componente | Impacto | Adaptacion |
|-----------|---------|------------|
| SBOM generation | SBOM por servicio (mas pequenos, mas enfocados) | CycloneDX por cada `package.json` |
| secretlint pre-commit | Sin impacto (opera a nivel de repo) | Ninguna |
| Vulnerability scanning | Trivy scan por Docker image | Agregar scan jobs por servicio |

### 7.3 Docker Setup (Entrega 4)

| Componente | Impacto | Adaptacion |
|-----------|---------|------------|
| `docker-compose.yml` | Crece de 1 a 3+ servicios | Agregar service dependencies y startup ordering |
| Health checks | Health check por servicio | Endpoints de health individuales |
| Volumes | Log volume por servicio | Volumes nombrados separados |

### 7.4 Test Suites Existentes

| Suite | ~Tests | Impacto | Mitigacion |
|-------|--------|---------|------------|
| Mocha server | ~100 | ALTO — debe dividirse | Mover tests con su servicio |
| Frisby API | ~400 | BAJO — testan HTTP | Solo cambiar URLs si cambian ports |
| Cypress E2E | ~100 | NINGUNO — testan via browser | Sin cambios |

---

## 8. Unresolved Questions

### Q1: Acceso a escritura del Challenge Service

Cuando un usuario resuelve un challenge, el Challenge Service necesita persistir el estado `solved=true`. Actualmente esto se hace en el mismo proceso via `challengeUtils.solveIf()`. Con microservicios, las opciones son:

- **(a)** Challenge Service tiene su propia DB y se sincroniza via evento
- **(b)** Challenge Service llama al Core Monolith via REST para marcar solved
- **(c)** La logica de `solveIf` permanece en el monolito y el Challenge Service solo sirve metadata

**Recomendacion tentativa:** Opcion (a) — Challenge Service es la fuente de verdad para challenge state.

### Q2: Vuln-code-snippets cross-service

El sistema RSN ([CLAUDE.md](../../.claude/CLAUDE.md)) asume que todos los archivos con anotaciones `vuln-code-snippet` estan en un solo repositorio. Si `verify.ts` se mueve a otro servicio:

- ¿Se mantiene un monorepo con multiples servicios?
- ¿O se actualiza RSN para soportar multi-repo?

**Recomendacion tentativa:** Monorepo con directorios por servicio. RSN se adapta con paths relativos.

### Q3: Message bus minimo viable

Las opciones para comunicacion asincrona:

| Opcion | Complejidad | Dependencia externa |
|--------|-------------|-------------------|
| In-process EventEmitter | BAJA | Ninguna |
| Redis Pub/Sub | MEDIA | Redis server |
| HTTP Webhooks | BAJA | Ninguna |
| NATS/RabbitMQ | ALTA | Message broker |

**Recomendacion tentativa:** HTTP Webhooks para Phase 1 (simplicidad maxima). Evaluar Redis si el volumen de eventos crece.

### Q4: Experiencia "single docker run" para usuarios finales

Los usuarios de Juice Shop esperan un solo comando para levantar el entorno. Con microservicios, `docker compose up` mantiene esta experiencia. Pero el Docker image publicado en DockerHub (`bkimminich/juice-shop`) es un solo contenedor.

- ¿Se publica un multi-container image?
- ¿Se mantiene un "all-in-one" image para produccion y multi-service solo para desarrollo?

**Recomendacion tentativa:** Mantener el all-in-one image para DockerHub. Multi-service solo para desarrollo local.

---

## 9. Conclusion

### Decision

**Adoptar una estrategia hibrida:**

1. **Modular Monolith** para los Core Domains (Identity, Shopping) y Supporting Domains (Delivery, Feedback, Privacy) — enforce boundaries via estructura de directorios y ESLint rules
2. **Extraccion de 2 microservicios** como proof of concept:
   - Challenge Service (Generic Subdomain, 0 dependencias Shared Kernel, ~800 LOC)
   - Chatbot Service (Generic Subdomain, stateless, ~300 LOC)
3. **Evaluacion post-Phase 1** antes de continuar con extracciones adicionales

### Justificacion

| Factor | Analisis |
|--------|----------|
| **Data habla** | Los 3 hotspots CRITICOS (Entrega 2) estan todos en el Core Monolith, no en los servicios a extraer. La extraccion reduce scope pero no elimina los hotspots |
| **Pragmatismo** | Juice Shop es una app de entrenamiento. Over-engineering es un riesgo real (Drawback §5.5) |
| **Shared Kernel** | Identity ↔ Shopping Shared Kernel bloquea extraccion de Core Domains (Entrega 1 §8) |
| **Strangler Fig validado** | El patron ya se adopto en Entrega 2 a nivel de funciones. Escalarlo a servicios es una extension natural |
| **ROI** | 2 servicios de bajo riesgo demuestran viabilidad sin comprometer estabilidad |

### Prioridad de Implementacion

| Paso | Accion | Timeline |
|------|--------|----------|
| 1 | Enforce module boundaries en monolito (ESLint `no-restricted-imports`) | Inmediato |
| 2 | Definir OpenAPI specs para Challenge y Chatbot endpoints | Mes 1 |
| 3 | Extraer Challenge Service | Mes 2-3 |
| 4 | Extraer Chatbot Service | Mes 3-4 |
| 5 | Evaluar resultados y decidir si continuar | Mes 5 |

### Matriz de Riesgo

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Over-engineering | ALTA | MEDIO | Parar despues de Phase 1, evaluar ROI |
| Romper challenges existentes | MEDIA | ALTO | RSN + E2E tests por fase, rollback plan |
| Conflictos Shared Kernel | ALTA | ALTO | No extraer Core Domains, mantener en monolito |
| Aumento tiempo de onboarding | MEDIA | MEDIO | Docker Compose + documentacion completa |
| Complejidad de testing | MEDIA | MEDIO | Mantener Cypress E2E como safety net |

---

## 10. Referencias

### Academicas y de Industria

- Newman, S. (2019). *Monolith to Microservices: Evolutionary Patterns to Transform Your Monolith*. O'Reilly Media.
- Richardson, C. (2018). *Microservices Patterns: With Examples in Java*. Manning Publications.
- Fowler, M. (2004). [Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html). martinfowler.com.
- Fowler, M. (2015). [Microservice Trade-Offs](https://martinfowler.com/articles/microservice-trade-offs.html). martinfowler.com.
- Tornhill, A. (2015). *Your Code as a Crime Scene*. Pragmatic Bookshelf.
- Buritica, J.P. (2023). [A Thorough Team Guide to RFCs](https://medium.com/juans-and-zeroes/a-thorough-team-guide-to-rfcs-8aa14f8e757c). Medium.

### Datos del Proyecto

- [Entrega 1 — Context Map](../Entrega%201/CONTEXT_MAP.md): 10 bounded contexts, DDD relationships
- [Entrega 2 — Tech Debt Audit](../Entrega%202/TECH_DEBT_AUDIT.md): Hotspot scores (verify.ts=100, datacreator.ts=97, server.ts=95)
- [Entrega 2 — Refactoring Plan](../Entrega%202/REFACTORING_PLAN.md): Strangler Fig a nivel de funciones
- [Entrega 2 — DORA Dashboard](../Entrega%202/DORA_DASHBOARD.md): Lead Time 6.4 dias, CFR 0%
- [Entrega 3 — SBOM Report](../Entrega%203/SBOM_REPORT.md): 750 dependencias, 15 licencias
- [Entrega 3 — Vulnerability Patching](../Entrega%203/VULNERABILITY_PATCHING.md): 44→42 vulnerabilidades
