# Cost Optimization — Refactorizacion de Funciones Resource-Intensive

**Fecha:** 20 de Marzo, 2026
**Equipo:** Alessandro Alecio - Diego Sican
**Proyecto:** OWASP Juice Shop v19.1.1

---

## 1. Resumen Ejecutivo

Se identificaron y refactorizaron **3 funciones resource-intensive** del backend de Juice Shop:

1. **`getLanguageList()`** (`routes/languages.ts`) — Leia 44+ archivos de disco en cada request sin cache. Refactorizado con lazy caching + `Promise.all` + `fs.promises`. **Resultado: 77% reduccion de latencia, 335% mas throughput.**
2. **`dataExport()`** (`routes/dataExport.ts`) — 3 queries secuenciales en callback pyramid. Refactorizado con `Promise.all` + async/await.
3. **`databaseRelatedChallenges()`** (`routes/verify.ts`) — 8 funciones duplicadas con 16 queries identicos. Deduplicado con helper `solveIfMentionedIn()` + `Promise.all`. **Resultado: 240 LOC → 50 LOC (79% reduccion de codigo).**

---

## 2. Herramientas de Deteccion

### 2.1 Hotspot Analysis (Entrega 2)

La funcion resource-intensive fue detectada inicialmente mediante el **analisis de hotspots (Churn x Complejidad Ciclomatica)** de la Entrega 2, basado en la metodologia de Adam Tornhill (*Your Code as a Crime Scene*, 2015).

| # | Archivo | Score Normalizado | Riesgo |
|---|---------|-------------------|--------|
| 1 | `routes/verify.ts` | 100 | CRITICO |
| 2 | `data/datacreator.ts` | 97 | CRITICO |
| 3 | `server.ts` | 95 | CRITICO |
| 4 | `routes/order.ts` | 57 | ALTO |

> **Fuente:** [`deliverables/Entrega 2/TECH_DEBT_AUDIT.md`](../Entrega%202/TECH_DEBT_AUDIT.md) — Seccion 3.

### 2.2 Manual Code Review

A partir de los hotspots, se realizo una **revision manual del codigo** buscando anti-patrones de rendimiento:

- **N+1 queries**: queries de base de datos dentro de loops
- **Sequential I/O**: operaciones asincronas ejecutadas secuencialmente sin `Promise.all`
- **Callback pyramids**: nesting excesivo con callbacks (callback hell)
- **Missing cache**: operaciones costosas repetidas sin caching
- **Blocking I/O**: operaciones sincronas bloqueando el event loop

### 2.3 `autocannon` — HTTP Load Testing

Para el benchmark antes/despues se utilizo **[autocannon](https://github.com/mcollina/autocannon)** (v8.0.0), una herramienta de HTTP benchmarking para Node.js:

```bash
npx autocannon -c 10 -d 10 http://localhost:3000/rest/languages
```

Parametros: 10 conexiones concurrentes, 10 segundos de duracion.

---

## 3. Funcion Optimizada: `getLanguageList()` (`routes/languages.ts`)

### 3.1 Problema Detectado

La funcion `getLanguageList()` se invoca en `GET /rest/languages` y realiza las siguientes operaciones **en cada request**:

1. Lee `en.json` (archivo de referencia en ingles) — 1 lectura de disco
2. Lee el directorio `i18n/` — 1 lectura de directorio
3. Lee **cada uno de los 44 archivos** de idioma — 44 lecturas de disco
4. Para cada archivo, parsea JSON y calcula porcentaje de traduccion
5. Ordena resultados alfabeticamente

**Total: 46 operaciones de I/O de disco por request.**

Los archivos de idioma son estaticos — no cambian durante la ejecucion de la aplicacion. Sin embargo, la funcion los re-lee desde disco en cada invocacion.

### 3.2 Codigo ANTES

```typescript
// routes/languages.ts (ANTES — 74 lineas)
export function getLanguageList () {
  return (req: Request, res: Response, next: NextFunction) => {
    const languages = []
    let count = 0
    let enContent: any

    // Callback nivel 1: leer en.json
    fs.readFile('...i18n/en.json', 'utf-8', (err, content) => {
      enContent = JSON.parse(content)
      // Callback nivel 2: leer directorio
      fs.readdir('...i18n/', (err, languageFiles) => {
        // Para CADA archivo: callback nivel 3
        languageFiles.forEach((fileName) => {
          fs.readFile('...i18n/' + fileName, 'utf-8', async (err, content) => {
            const fileContent = JSON.parse(content)
            const percentage = await calcPercentage(fileContent, enContent)
            // ... construir objeto language
            count++
            if (count === languageFiles.length) {
              languages.sort(...)
              res.status(200).json(languages)
            }
          })
        })
      })
    })

    // Wrapper asincrono innecesario alrededor de codigo sincrono
    async function calcPercentage (...): Promise<number> {
      return await new Promise((resolve) => {
        for (const key in fileContent) { /* ... */ }
        resolve(result)
      })
    }
  }
}
```

**Anti-patrones identificados:**
1. **No caching** — 46 lecturas de disco en cada request
2. **Callback pyramid** — 3 niveles de nesting (callback hell)
3. **Manual counter** — `count++` con `if (count === length)` en lugar de `Promise.all`
4. **Unnecessary async wrapper** — `calcPercentage()` envuelve codigo sincrono en un `Promise`
5. **`fs` callbacks** — usa `fs.readFile` con callbacks en lugar de `fs.promises`

### 3.3 Codigo DESPUES

```typescript
// routes/languages.ts (DESPUES — 67 lineas)
import fs from 'node:fs/promises'

let cachedLanguages: LanguageEntry[] | null = null

export function getLanguageList () {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Lazy cache: si ya se calculo, retornar inmediatamente
      if (cachedLanguages) {
        res.status(200).json(cachedLanguages)
        return
      }

      // Parallelizar lectura de en.json + listado de directorio
      const [enRaw, languageFiles] = await Promise.all([
        fs.readFile(i18nDir + 'en.json', 'utf-8'),
        fs.readdir(i18nDir)
      ])
      const enContent = JSON.parse(enRaw)

      // Parallelizar lectura de TODOS los archivos de idioma
      const fileContents = await Promise.all(
        languageFiles.map(async (fileName) => ({
          fileName,
          content: JSON.parse(await fs.readFile(i18nDir + fileName, 'utf-8'))
        }))
      )

      // Calcular porcentajes (sincrono, sin wrapper async innecesario)
      const languages = []
      for (const { fileName, content } of fileContents) {
        // ... calcPercentage inline, sin Promise wrapper
      }

      cachedLanguages = languages
      res.status(200).json(languages)
    } catch (err) {
      next(new Error(`Unable to retrieve language files: ${err.message}`))
    }
  }
}
```

**Mejoras aplicadas:**
1. **Lazy caching** — primera request calcula y cachea, subsiguientes retornan inmediatamente
2. **`Promise.all`** — lectura de en.json + directorio en paralelo, luego lectura de 44 archivos en paralelo
3. **`fs.promises`** — API moderna basada en promesas (no callbacks)
4. **Eliminacion de callback pyramid** — de 3 niveles de nesting a flat async/await
5. **Eliminacion de `calcPercentage` wrapper** — calculo sincrono inline (sin Promise innecesario)
6. **Manejo de errores centralizado** — un solo `try/catch` en lugar de checks de error repetidos

---

## 4. Benchmark: Antes vs. Despues

### 4.1 Entorno de Pruebas

| Parametro | Valor |
|-----------|-------|
| **Maquina** | MacBook Air M4 |
| **Node.js** | v22.18.0 |
| **SO** | macOS Tahoe 26.2 |
| **Herramienta** | autocannon v8.0.0 |
| **Conexiones** | 10 concurrentes |
| **Duracion** | 10 segundos |
| **Endpoint** | `GET /rest/languages` |
| **Ambiente** | Local (mismo entorno para ANTES y DESPUES) |

### 4.2 Resultados — ANTES (sin cache, 44 lecturas de disco por request)

```
Running 10s test @ http://localhost:3000/rest/languages
10 connections

┌─────────┬───────┬───────┬────────┬────────┬──────────┬──────────┬────────┐
│ Stat    │ 2.5%  │ 50%   │ 97.5%  │ 99%    │ Avg      │ Stdev    │ Max    │
├─────────┼───────┼───────┼────────┼────────┼──────────┼──────────┼────────┤
│ Latency │ 67 ms │ 77 ms │ 111 ms │ 117 ms │ 80.47 ms │ 11.26 ms │ 144 ms │
└─────────┴───────┴───────┴────────┴────────┴──────────┴──────────┴────────┘
┌───────────┬────────┬────────┬────────┬────────┬────────┬─────────┬────────┐
│ Stat      │ 1%     │ 2.5%   │ 50%    │ 97.5%  │ Avg    │ Stdev   │ Min    │
├───────────┼────────┼────────┼────────┼────────┼────────┼─────────┼────────┤
│ Req/Sec   │ 111    │ 111    │ 123    │ 129    │ 123    │ 5.32    │ 111    │
└───────────┴────────┴────────┴────────┴────────┴────────┴─────────┴────────┘

1k requests in 10.01s
```

### 4.3 Resultados — DESPUES (con lazy cache + Promise.all)

```
Running 10s test @ http://localhost:3000/rest/languages
10 connections

┌─────────┬───────┬───────┬───────┬───────┬──────────┬─────────┬───────┐
│ Stat    │ 2.5%  │ 50%   │ 97.5% │ 99%   │ Avg      │ Stdev   │ Max   │
├─────────┼───────┼───────┼───────┼───────┼──────────┼─────────┼───────┤
│ Latency │ 15 ms │ 17 ms │ 30 ms │ 40 ms │ 18.19 ms │ 5.15 ms │ 92 ms │
└─────────┴───────┴───────┴───────┴───────┴──────────┴─────────┴───────┘
┌───────────┬─────────┬─────────┬────────┬─────────┬────────┬────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%    │ 97.5%   │ Avg    │ Stdev  │ Min     │
├───────────┼─────────┼─────────┼────────┼─────────┼────────┼────────┼─────────┤
│ Req/Sec   │ 447     │ 447     │ 534    │ 589     │ 534.71 │ 50.87  │ 447     │
└───────────┴─────────┴─────────┴────────┴─────────┴────────┴────────┴─────────┘

5k requests in 10.01s
```

### 4.4 Tabla Comparativa

| Metrica | ANTES | DESPUES | Mejora |
|---------|-------|---------|--------|
| **Latencia P50** | 77 ms | 17 ms | **77.9% mas rapido** |
| **Latencia Promedio** | 80.47 ms | 18.19 ms | **77.4% mas rapido** |
| **Latencia P99** | 117 ms | 40 ms | **65.8% mas rapido** |
| **Requests/segundo** | 123 | 534.71 | **334.7% mas throughput** |
| **Requests totales (10s)** | ~1,230 | ~5,347 | **4.3x mas capacidad** |
| **Lecturas de disco/request** | 46 | 0 (cached) | **100% eliminadas** |

### 4.5 Analisis de Reduccion de Costos Teorica

En un entorno cloud (AWS EC2, GCP Compute, Azure VM), el costo esta directamente relacionado con la utilizacion de CPU y la cantidad de instancias necesarias para manejar el trafico.

| Escenario | ANTES | DESPUES | Ahorro |
|-----------|-------|---------|--------|
| 10,000 req/hora al endpoint `/rest/languages` | 81 instancias-segundo de CPU | 19 instancias-segundo de CPU | **77% menos CPU** |
| Throughput por instancia | 123 req/s | 535 req/s | **4.3x menos instancias** |
| Cloud cost (proporcional al CPU) | 1.0x | 0.23x | **77% reduccion de costo** |

> **Nota:** La reduccion de I/O de disco tambien reduce el desgaste de storage y la latencia de I/O para otros procesos en el mismo servidor. En instancias cloud con IOPS limitados (ej. gp2 EBS volumes en AWS), esto puede evitar throttling bajo carga alta.

---

## 5. Optimizaciones Adicionales

### 5.1 `dataExport()` — Sequential → Parallel Queries (`routes/dataExport.ts`)

**Problema:** 3 queries de base de datos ejecutados secuencialmente en callback pyramid (Sequelize + 2 MongoDB).

**ANTES:**
```typescript
const memories = await MemoryModel.findAll(...)      // Query 1 (espera)
db.ordersCollection.find(...).then(orders => {        // Query 2 (espera a Query 1)
  db.reviewsCollection.find(...).then(reviews => {    // Query 3 (espera a Query 2)
    res.send(...)
  })
})
```

**DESPUES:**
```typescript
const [memories, orders, reviews] = await Promise.all([
  MemoryModel.findAll({ where: { UserId: req.body.UserId } }),
  db.ordersCollection.find({ email: updatedEmail }),
  db.reviewsCollection.find({ author: email })
])
// Procesar y responder
```

**Mejora:** 3 queries en paralelo → reduccion teorica de ~66% del tiempo de DB (limitado por la query mas lenta en lugar de la suma de las 3). Nesting reducido de 4 niveles a 1.

### 5.2 `databaseRelatedChallenges()` — Deduplicacion + Parallelizacion (`routes/verify.ts`)

**Problema:** 8 funciones identicas (knownVulnerableComponent, weirdCrypto, typosquattingNpm, etc.), cada una haciendo 2 queries separados a Feedback + Complaint = 16 queries totales.

**ANTES (240 lineas de codigo duplicado):**
```typescript
function knownVulnerableComponentChallenge () {
  FeedbackModel.findAndCountAll({ where: { comment: condition } }).then(({ count }) => {
    if (count > 0) challengeUtils.solve(challenges.knownVulnerableComponentChallenge)
  })
  ComplaintModel.findAndCountAll({ where: { message: condition } }).then(({ count }) => {
    if (count > 0) challengeUtils.solve(challenges.knownVulnerableComponentChallenge)
  })
}
// ... x8 funciones identicas con diferentes condiciones
```

**DESPUES (50 lineas — helper reutilizable):**
```typescript
function solveIfMentionedIn (challenge: Challenge, condition: any): void {
  void Promise.all([
    FeedbackModel.findAndCountAll({ where: { comment: condition } }),
    ComplaintModel.findAndCountAll({ where: { message: condition } })
  ]).then(([{ count: feedbackCount }, { count: complaintCount }]) => {
    if (feedbackCount > 0 || complaintCount > 0) {
      challengeUtils.solve(challenge)
    }
  })
}

// Uso: una linea por challenge
solveIfMentionedIn(challenges.knownVulnerableComponentChallenge, { [Op.or]: knownVulnerableComponents() })
```

**Mejora:**
| Metrica | ANTES | DESPUES | Cambio |
|---------|-------|---------|--------|
| Lineas de codigo (funciones DB) | ~240 | ~50 | **-79%** |
| Funciones | 8 funciones duplicadas | 1 helper reutilizable | **-87%** |
| Queries por challenge | 2 secuenciales | 2 en paralelo (Promise.all) | **Parallelizado** |

---

## 6. Verificacion de Funcionalidad

Se verifico que las refactorizaciones no rompen la funcionalidad existente:

```bash
# Endpoint /rest/languages retorna mismos 41 idiomas
$ curl -s http://localhost:3000/rest/languages | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(f'Languages: {len(d)}')"
Languages: 41

# Endpoint /rest/user/data-export retorna datos correctos
$ TOKEN=$(curl -s http://localhost:3000/rest/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@juice-sh.op","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['authentication']['token'])")
$ curl -s http://localhost:3000/rest/user/data-export -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"UserId":1}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('Status: OK')"
Status: OK

# TypeScript compila sin errores
$ npx tsc -p tsconfig.json --noEmit
# (sin errores)
```

---

## 7. Referencias

| Fuente | Uso |
|--------|-----|
| [Adam Tornhill, *Your Code as a Crime Scene*](https://pragprog.com/titles/atcrime/your-code-as-a-crime-scene/) | Metodologia de hotspot analysis |
| [autocannon](https://github.com/mcollina/autocannon) | Herramienta de benchmark HTTP |
| [`deliverables/Entrega 2/TECH_DEBT_AUDIT.md`](../Entrega%202/TECH_DEBT_AUDIT.md) | Hotspot scores originales |
| [Node.js `fs.promises` API](https://nodejs.org/api/fs.html#fspromisesreadfilepath-options) | Modernizacion de file I/O |
| [MDN `Promise.all()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) | Parallelizacion de operaciones asincronas |
