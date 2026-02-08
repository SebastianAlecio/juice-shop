# Deliverables - Primera Entrega

**Fecha:** 2 de Febrero, 2026
**Equipo:** Alessandro Alecio - Diego Sican
**Proyecto Seleccionado:** OWASP Juice Shop (Node.js/Angular)

---

## Proyecto Seleccionado

De las opciones disponibles, elegimos **OWASP Juice Shop**:

| Proyecto | Stack | Challenge |
|----------|-------|-----------|
| **OWASP Juice Shop** | Node.js/Angular | Intentionally broken and vulnerable. High complexity. Best for DevSecOps focus. |
| Spring PetClinic | Java Spring | Clean code but outdated monolithic architecture. Best for Architecture & Modernization strategy. |
| eShopOnWeb | ASP.NET Core | Tightly coupled monolithic e-commerce. Great for Refactoring patterns. |
| Vulnerable Node App | Node.js/Express | Pure Backend focus. Excellent for API performance and security hardening. |
| Django RealWorld App | Django | Lack of engineering rigor (no CI, no docs). Good for setting up Engineering Standards. |

---

## Justificacion de la Eleccion

### Criterio Principal: Experiencia del Equipo
El equipo tiene mayor experiencia con el stack **Node.js + Angular**, lo que permite:
- Menor curva de aprendizaje inicial
- Mayor velocidad de análisis y comprensión del código
- Capacidad de identificar patrones y anti-patrones más rápidamente

### Criterios Adicionales

| Criterio | OWASP Juice Shop | Evaluacion |
|----------|------------------|------------|
| **Complejidad arquitectural** | Full-stack con 10 bounded contexts identificados | Alta - ideal para DDD |
| **Documentación existente** | README, CONTRIBUTING, libro externo completo | Buena base para onboarding |
| **Testing** | Jest, Mocha, Cypress, Frisby (múltiples frameworks) | Oportunidad de análisis de estrategias |
| **Comunidad activa** | Proyecto OWASP oficial, mantenido activamente | Código actualizado y relevante |
| **Dominio de negocio** | E-commerce con features reales (pagos, entregas, GDPR) | Fácil de mapear a user stories |
| **DevSecOps focus** | 126 challenges de seguridad integrados | Relevante para prácticas modernas |

### Por Que No Elegimos Otros

- **Spring PetClinic:** Stack Java no alineado con experiencia del equipo
- **eShopOnWeb:** Requiere conocimiento de ecosistema .NET
- **Vulnerable Node App:** Demasiado simple (solo backend), menos interesante para Context Map
- **Django RealWorld:** Falta de CI/docs haría el onboarding más difícil de evaluar

---

## Entregables

### 1. Context Map
**Archivo:** [CONTEXT_MAP.md](CONTEXT_MAP.md)

Análisis Domain-Driven Design que identifica:
- **2 Core Domains:** Identity (autenticación) y Shopping (compras)
- **3 Supporting Domains:** Delivery, Feedback, Privacy (GDPR)
- **5 Generic Subdomains:** Challenge, Admin, Blockchain, Chatbot, Localization

Incluye diagramas MermaidJS de:
- Relaciones entre bounded contexts
- Modelos de dominio por contexto
- Eventos de dominio implícitos
- Mapeo a archivos del código

### 2. User Stories
**Archivo:** [USER_STORIES.md](USER_STORIES.md)

Backlog recuperado mediante ingeniería inversa del código:
- **44 User Stories** identificadas
- **19 Must** / **16 Should** / **9 Could** (priorización MoSCoW)
- Cada story incluye:
  - Archivos de implementación (backend routes, models)
  - Componentes frontend asociados
  - Endpoints de API

### 3. Onboarding Log
**Archivo:** [ONBOARDING_LOG.md](ONBOARDING_LOG.md)

- **10 friction points** identificados (3 alto, 4 medio, 3 bajo impacto)
- Métricas del proyecto (50,000+ líneas de código, 88 dependencias de producción, 126 challenges de seguridad)
- Tiempos de setup estimados por método
- Recomendaciones de mejora priorizadas

---

## Decisiones No-Triviales

### D1: Granularidad del Context Map
**Decisión:** Identificar 10 bounded contexts en lugar de consolidar en menos.

**Razón:** El código muestra clara separación de responsabilidades en `/routes/` y `/models/`. Aunque algunos contextos (Blockchain, Chatbot) podrían considerarse features del contexto Shopping, su implementación aislada y complejidad propia justifican tratarlos como contextos separados.

### D2: Uso de MermaidJS para Diagramas
**Decisión:** Usar MermaidJS en lugar de imágenes estáticas.

**Razón:**
- Los diagramas son versionables junto al código
- Se renderizan automáticamente en GitHub/GitLab
- Facilitan actualizaciones futuras sin herramientas externas

### D3: Priorización MoSCoW en User Stories
**Decisión:** Asignar prioridades basadas en funcionalidad core de e-commerce.

**Razón:** Sin acceso a stakeholders reales, priorizamos basándonos en:
- **Must:** Funcionalidades sin las cuales la app no funciona (login, carrito, checkout)
- **Should:** Features importantes pero no bloqueantes (historial, cupones)
- **Could:** Features opcionales o experimentales (Web3, chatbot)

### D4: Friction Points vs Bugs
**Decisión:** Enfocarnos en fricción de onboarding, no en vulnerabilidades de seguridad.

**Razón:** Las vulnerabilidades son intencionales (es un proyecto de training en seguridad). Los friction points documentados son problemas reales de Developer Experience que afectarían a cualquier nuevo contribuidor.

---

## Como Usar Este Repositorio

```bash
# Clonar
git clone [repo-url]
cd juice-shop

# Instalar (requiere Node 20-24)
npm install

# Ejecutar
npm start
# Abrir http://localhost:3000

# Desarrollo con hot reload
npm run serve:dev
```

---

## Referencias

- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)
- [Pwning OWASP Juice Shop (Libro)](https://pwning.owasp-juice.shop/)
- [Repositorio Original](https://github.com/juice-shop/juice-shop)
