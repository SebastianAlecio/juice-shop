# Deliverables - Quinta Entrega

**Fecha:** 20 de Marzo, 2026
**Equipo:** Alessandro Alecio - Diego Sican
**Proyecto:** OWASP Juice Shop v19.1.1
**Focus:** FinOps Optimization & Final Defense

---

## Resumen Ejecutivo

En esta quinta y ultima entrega se implementaron tres entregables de optimizacion de costos y preparacion final del repositorio:

1. **Cost Optimization** — Identificacion y refactorizacion de funciones resource-intensive usando hotspot analysis (Entrega 2) + code review manual + benchmarking con `autocannon`. La funcion principal optimizada (`getLanguageList`) logro **77% de reduccion de latencia** y **335% mas throughput**.
2. **Benchmark Before vs. After** — Comparacion cuantitativa con `autocannon` (10 conexiones, 10 segundos) mostrando mejora medible en el endpoint `/rest/languages`.
3. **Final Repo Polish** — README general de `deliverables/` indexando las 5 entregas, documentacion consistente y cross-references entre entregas.

---

## Entregables

### 1. Cost Optimization + Benchmark
**Archivo:** [COST_OPTIMIZATION.md](COST_OPTIMIZATION.md)

**Funciones refactorizadas:**

| Funcion | Archivo | Problema | Optimizacion | Impacto |
|---------|---------|----------|--------------|---------|
| `getLanguageList()` | `routes/languages.ts` | 44+ lecturas de disco por request, sin cache | Lazy caching + `Promise.all` + `fs.promises` | **77% menos latencia, 335% mas throughput** |
| `dataExport()` | `routes/dataExport.ts` | 3 queries DB secuenciales en callback pyramid | `Promise.all` + async/await | Parallelizacion, nesting 4→1 |
| `databaseRelatedChallenges()` | `routes/verify.ts` | 8 funciones duplicadas, 16 queries identicos | Helper `solveIfMentionedIn()` + `Promise.all` | **240→50 LOC (-79%)** |

**Herramientas de deteccion:**
- Hotspot analysis de Entrega 2 (churn x complejidad ciclomatica)
- Code review manual buscando anti-patrones de rendimiento
- `autocannon` v8.0.0 para HTTP load testing

**Resultados del benchmark principal (`/rest/languages`):**

| Metrica | ANTES | DESPUES | Mejora |
|---------|-------|---------|--------|
| Latencia P50 | 77 ms | 17 ms | **77.9%** |
| Latencia Promedio | 80.47 ms | 18.19 ms | **77.4%** |
| Requests/segundo | 123 | 534.71 | **334.7%** |

### 2. Final Repo Polish
**Archivo:** [`deliverables/README.md`](../README.md)

- Indice general de las 5 entregas con fechas, focus, y links
- Resumen de logros acumulados del proyecto

---

## Mini-Rubrica

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Benchmark shows measurable improvement (>15% faster or less resource-heavy) | Implementado | **77.4% reduccion de latencia**, 334.7% mas throughput. [COST_OPTIMIZATION.md §4](COST_OPTIMIZATION.md) |
| Code refactoring is clean and does not break functionality | Implementado | TypeScript compila sin errores. Endpoint retorna mismos 41 idiomas. [COST_OPTIMIZATION.md §6](COST_OPTIMIZATION.md) |
| Repository looks professional and "Handover-ready" | Implementado | README general en `deliverables/`, documentacion consistente en 5 entregas |

---

## Archivos Creados/Modificados

| Archivo | Accion | Proposito |
|---------|--------|-----------|
| `routes/languages.ts` | Modificado | Lazy caching + Promise.all + fs.promises |
| `routes/dataExport.ts` | Modificado | Sequential → parallel queries (Promise.all) |
| `routes/verify.ts` | Modificado | Helper solveIfMentionedIn() + deduplicacion |
| `deliverables/Entrega 5/README.md` | Creado | Este archivo |
| `deliverables/Entrega 5/COST_OPTIMIZATION.md` | Creado | Documentacion de optimizacion + benchmark |
| `deliverables/README.md` | Creado | Indice general de todas las entregas |

---

## Decisiones No-Triviales

### D1: Lazy cache vs. eager cache para getLanguageList()
**Decision:** Usar lazy cache (primera request calcula, subsiguientes retornan cache) en lugar de eager cache (cargar al inicio del servidor).
**Razon:** Los archivos de idioma estan en `frontend/dist/` que puede no existir si el frontend no esta construido. Lazy cache evita errores de inicio y solo carga cuando se necesita.

### D2: Target de optimizacion: languages.ts vs. dataExport.ts
**Decision:** Usar `getLanguageList()` como target principal del benchmark en lugar de `dataExport()`.
**Razon:** `dataExport()` usa SQLite embebido + MarsDB in-memory, donde la latencia de queries es <1ms. La diferencia entre secuencial y paralelo es indetectable. `getLanguageList()` hace I/O de disco real (44 lecturas de archivo), donde la optimizacion es claramente medible.

### D3: Deduplicacion de verify.ts con helper generico
**Decision:** Crear `solveIfMentionedIn(challenge, condition)` que busca en Feedback Y Complaint en paralelo.
**Razon:** Las 8 funciones originales (knownVulnerableComponent, weirdCrypto, etc.) tenian estructura identica, diferenciandose solo en la condicion WHERE y el challenge a resolver. El helper elimina 190 lineas de codigo duplicado.

### D4: Mantener las 3 optimizaciones como un conjunto
**Decision:** Entregar las 3 refactorizaciones juntas (languages.ts + dataExport.ts + verify.ts) en lugar de solo la que tiene benchmark.
**Razon:** Cada una demuestra un anti-patron diferente (missing cache, sequential I/O, code duplication). Juntas forman un analisis integral de cost optimization.

---

## Como Verificar

```bash
# 1. Compilar TypeScript
npx tsc -p tsconfig.json

# 2. Iniciar servidor
npm start &

# 3. Verificar funcionalidad del endpoint de idiomas
curl -s http://localhost:3000/rest/languages | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(f'Languages: {len(d)}')"
# Debe retornar: Languages: 41

# 4. Verificar funcionalidad del data export
TOKEN=$(curl -s http://localhost:3000/rest/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@juice-sh.op","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['authentication']['token'])")

curl -s http://localhost:3000/rest/user/data-export -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"UserId":1}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if 'userData' in d else 'FAIL')"
# Debe retornar: OK

# 5. Benchmark del endpoint optimizado
npx autocannon -c 10 -d 10 http://localhost:3000/rest/languages
# Debe mostrar latencia P50 < 25ms y > 400 req/sec

# 6. Detener servidor
kill $(lsof -t -i:3000)
```
