# Deliverables - Cuarta Entrega

**Fecha:** 5 de Marzo, 2026
**Equipo:** Alessandro Alecio - Diego Sican
**Proyecto:** OWASP Juice Shop v19.1.1
**Focus:** Architecture Strategy & DevEx

---

## Resumen Ejecutivo

En esta cuarta entrega se implementaron dos entregables de arquitectura y experiencia de desarrollo:

1. **One-Command Setup (Docker Compose)** — `docker-compose.yml` que levanta el entorno completo de Juice Shop con `docker compose up` en menos de 1 minuto (~50s primera vez, ~5s con cache)
2. **ADR: Migracion a Microservicios** — RFC profesional siguiendo el template de Juan Pablo Buritica que propone y evalua la migracion de arquitectura monolitica a microservicios, respaldada con datos cuantitativos de las 3 entregas anteriores

---

## Entregables

### 1. Docker Compose Setup
**Archivo:** [DOCKER_SETUP.md](DOCKER_SETUP.md)
**Compose file:** [`docker-compose.yml`](../../docker-compose.yml) (raiz del proyecto)

- Un solo comando: `docker compose up`
- Imagen oficial pre-built `bkimminich/juice-shop:v19.1.1`
- Health check automatico via Node.js (compatible con imagen distroless)
- Volume persistente para logs
- Tiempo total < 1 minuto (50s primera vez, 5s con cache)
- Elimina necesidad de Node.js, npm, Python, gcc localmente
- Onboarding log con terminal output completo

### 2. ADR: Migracion a Microservicios
**Archivo:** [ADR_MICROSERVICES_MIGRATION.md](ADR_MICROSERVICES_MIGRATION.md)

RFC profesional con 10 secciones siguiendo el template de [Juan Pablo Buritica](https://medium.com/juans-and-zeroes/a-thorough-team-guide-to-rfcs-8aa14f8e757c):
- **Executive Summary** — panorama del problema y decision
- **Motivation** — pain points cuantificados con datos de Entregas 1-3
- **Proposed Implementation** — Strangler Fig en 2 fases (Challenge Service + Chatbot Service)
- **Metrics & Dashboard** — baselines vs targets medibles
- **Drawbacks** — 5 desventajas documentadas incluyendo impacto educativo
- **Alternatives** — 3 alternativas con matriz de comparacion ponderada
- **Impacts & Dependencies** — impacto en CI/CD, supply chain, Docker, testing
- **Unresolved Questions** — 4 preguntas abiertas con recomendaciones tentativas
- **Conclusion** — Decision: Modular Monolith + extraccion selectiva de 2 servicios
- **Referencias** — 6 fuentes academicas + 6 datos del proyecto

**Decision:** Adoptar estrategia hibrida — Modular Monolith para Core Domains + extraccion de Challenge Service y Chatbot Service como proof of concept. Justificado por: Shared Kernel Identity↔Shopping bloquea extraccion de Core Domains, y Juice Shop es una app de entrenamiento donde over-engineering es un riesgo real.

---

## Mini-Rubrica

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Environment spins up with a single command without manual steps | Implementado | `docker compose up` — 50s primera vez, 5s con cache. [DOCKER_SETUP.md §6](DOCKER_SETUP.md) con timing evidence |
| ADR follows a standard format RFC (Context, Decision, Consequences) | Implementado | 10 secciones per template Buritica. [ADR_MICROSERVICES_MIGRATION.md](ADR_MICROSERVICES_MIGRATION.md) |
| ADR arguments are backed by data/patterns, not just opinion | Implementado | Referencia directa a: hotspot scores (Entrega 2), bounded contexts (Entrega 1), SBOM 750 deps (Entrega 3), DORA metrics, Strangler Fig pattern |

---

## Archivos Creados/Modificados

| Archivo | Accion | Proposito |
|---------|--------|-----------|
| `docker-compose.yml` | Creado | One-command environment setup |
| `deliverables/Entrega 4/README.md` | Creado | Este archivo |
| `deliverables/Entrega 4/DOCKER_SETUP.md` | Creado | Docker documentation + onboarding log |
| `deliverables/Entrega 4/ADR_MICROSERVICES_MIGRATION.md` | Creado | RFC/ADR: Migracion a Microservicios |

---

## Decisiones No-Triviales

### D1: Imagen pre-built vs build local
**Decision:** Usar `bkimminich/juice-shop:v19.1.1` (DockerHub) en lugar de `build: .` local.
**Razon:** El Dockerfile usa `--omit=dev` pero el script `prepare` ejecuta `husky` (devDependency agregada en Entrega 3), causando fallo de build. La imagen oficial ya esta construida y probada. Pull de ~500MB toma ~45s vs ~3-7min de build local.

### D2: Health check via Node.js inline en distroless
**Decision:** Usar `/nodejs/bin/node -e "..."` como health check.
**Razon:** La imagen distroless (`gcr.io/distroless/nodejs22-debian12`) no tiene shell, curl, ni wget. El unico binario disponible es Node.js en `/nodejs/bin/node`.

### D3: ADR concluye con Modular Monolith, no Full Microservices
**Decision:** Recomendar estrategia hibrida (Modular Monolith + 2 microservicios de prueba) en lugar de migracion completa.
**Razon:** El Shared Kernel Identity↔Shopping (User referenciado por 8+ entidades en 5 contextos) hace inviable la extraccion de Core Domains. Juice Shop es una app de entrenamiento — el beneficio de microservicios completos (escalabilidad) es irrelevante. La matriz de comparacion ponderada favorece Modular Monolith (72/100) sobre Microservices (62/100).

### D4: docker-compose.yml en raiz, no en deliverables/
**Decision:** Colocar el compose file en la raiz del proyecto.
**Razon:** `docker compose` busca `docker-compose.yml` en el directorio actual por defecto. Colocarlo en la raiz permite `docker compose up` sin argumentos adicionales, cumpliendo el requisito de "single command without manual steps".

---

## Como Verificar

```bash
# 1. Levantar el entorno (primera vez descarga imagen ~500MB)
docker compose up -d

# 2. Verificar health (esperar ~5-10s)
docker compose ps
# STATUS debe mostrar "healthy"

# 3. Verificar acceso a la aplicacion
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000
# Debe retornar: HTTP 200

# 4. Verificar API funcionando
curl -s http://localhost:3000/api/Challenges | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Status: {d[\"status\"]}, Challenges: {len(d[\"data\"])}')"
# Debe retornar: Status: success, Challenges: 110

# 5. Abrir en browser
open http://localhost:3000

# 6. Detener
docker compose down
```
