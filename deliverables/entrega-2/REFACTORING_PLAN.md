# Plan de Refactorizacion — Strangler Fig Pattern

**Fecha:** 11 de Febrero, 2026
**Equipo:** Alessandro Alecio - Diego Sican
**Proyecto:** OWASP Juice Shop v19.1.1

---

## 1. Resumen Ejecutivo

Se presenta un plan de refactorizacion para los **3 archivos con mayor deuda tecnica** identificados en el [Tech Debt Audit](TECH_DEBT_AUDIT.md). Se utiliza el patron **Strangler Fig** (Martin Fowler): en lugar de reescrituras grandes, se reemplazan incrementalmente las implementaciones internas manteniendo las interfaces externas estables.

**Candidatos priorizados:**

| # | Archivo | CC | Churn | Riesgo Hotspot | Prioridad |
|---|---------|-----|-------|---------------|-----------|
| 1 | `routes/verify.ts` | 13 | 332 | CRITICO (100) | **ALTA** |
| 2 | `routes/order.ts` | 17 | 145 | ALTO (57) | **ALTA** |
| 3 | `lib/startup/validateConfig.ts` | 19 | 61 | MEDIO (27) | **MEDIA** |

**Metricas objetivo globales:**
- CC maxima del codebase: de 19 → ≤10
- Lineas duplicadas en verify.ts: de ~160 → ~40
- LOC del archivo mas grande en routes/: de 407 → ≤150

---

## 2. Estrategia: Strangler Fig Pattern

### Que es

El patron Strangler Fig (nombrado por las higueras estranguladoras que crecen alrededor de un arbol existente) consiste en:

1. **Crear** la nueva implementacion junto a la existente
2. **Redirigir** gradualmente llamadas de la vieja a la nueva
3. **Eliminar** el codigo viejo cuando ya no se usa

### Por que es apropiado aqui

- **Bajo riesgo:** Cada fase produce un sistema funcional — si algo falla, solo se revierte una fase
- **Verificable incrementalmente:** Los tests API existentes (`npm run frisby`) validan cada paso
- **Sin reescritura:** No se cambian interfaces publicas (rutas HTTP, imports en `server.ts`)
- **Compatible con CI:** El governance pipeline detecta regresiones en complejidad y coverage

### Restricciones del proyecto

| Restriccion | Descripcion |
|-------------|-------------|
| **vuln-code-snippet** | Ninguno de los 3 archivos candidatos contiene anotaciones vuln-code-snippet. Sin embargo, `server.ts` contiene `hide-line` en lineas que llaman funciones de `verify.ts` — mantener API compatible |
| **RSN** | Ejecutar `npm run rsn` despues de cada fase para verificar que los code snippets del sistema de challenges no se rompan |
| **Tests API** | Ejecutar `npm run frisby` despues de cada fase. Los API tests ejercitan `placeOrder` y los verificadores de challenges |
| **ESLint** | Ejecutar `npm run lint` para verificar que la complejidad no sube |

---

## 3. Candidato 1: `routes/verify.ts` — Eliminacion de Duplicacion

### 3.1 Estado Actual

- **Archivo:** [`routes/verify.ts`](../../routes/verify.ts) (407 LOC, CC=13, 332 commits)
- **28 funciones exportadas**, 39 llamadas a `challengeUtils.solveIf/solve`
- **Sin anotaciones vuln-code-snippet** (verificado)
- **Registrado en `server.ts`** via `import * as verify from './routes/verify'`

### 3.2 Patron Duplicado (El Problema)

8 funciones repiten el mismo patron de consultar `FeedbackModel` Y `ComplaintModel`:

```typescript
// PATRON REPETIDO 8 VECES (lineas 202-431):
function someChallenge () {
  FeedbackModel.findAndCountAll({
    where: { comment: { [Op.or]: criteriaList() } }
  }).then(({ count }) => {
    if (count > 0) challengeUtils.solve(challenges.someChallenge)
  }).catch(() => { throw new Error('...') })

  ComplaintModel.findAndCountAll({
    where: { message: { [Op.or]: criteriaList() } }
  }).then(({ count }) => {
    if (count > 0) challengeUtils.solve(challenges.someChallenge)
  }).catch(() => { throw new Error('...') })
}
```

**Funciones afectadas:**
1. `knownVulnerableComponentChallenge` (lineas 202-229)
2. `weirdCryptoChallenge` (lineas 248-275)
3. `typosquattingNpmChallenge` (lineas 287-303)
4. `typosquattingAngularChallenge` (lineas 306-322)
5. `hiddenImageChallenge` (lineas 325-341)
6. `supplyChainAttackChallenge` (lineas 344-361)
7. `dlpPastebinDataLeakChallenge` (lineas 370-393)
8. `csafChallenge` / `leakedApiKeyChallenge` (lineas 395-431)

### 3.3 Estructura Propuesta

**Helper para eliminar la duplicacion:**

```typescript
// Nuevo helper dentro de verify.ts
async function solveIfMentionedIn (
  challenge: Challenge,
  criteria: WhereOptions
): Promise<void> {
  const [feedbackResult, complaintResult] = await Promise.all([
    FeedbackModel.findAndCountAll({ where: { comment: criteria } }),
    ComplaintModel.findAndCountAll({ where: { message: criteria } })
  ])
  if (feedbackResult.count > 0 || complaintResult.count > 0) {
    challengeUtils.solve(challenge)
  }
}
```

**Cada funcion duplicada se reduce a:**

```typescript
function knownVulnerableComponentChallenge () {
  void solveIfMentionedIn(challenges.knownVulnerableComponentChallenge, {
    [Op.or]: knownVulnerableComponents()
  })
}
```

### 3.4 Fases de Refactorizacion

| Fase | Cambio | LOC impactadas | Riesgo |
|------|--------|---------------|--------|
| **F1** | Crear helper `solveIfMentionedIn` | +15 | Ninguno (codigo nuevo) |
| **F2** | Migrar las 8 funciones al helper | -120 | BAJO (misma logica) |
| **F3** | (Opcional) Agrupar exports por categoria en sub-archivos | ~0 neto | MEDIO (cambio de imports) |

### 3.5 Metricas de Exito

| Metrica | Antes | Objetivo |
|---------|-------|----------|
| LOC de verify.ts | 407 | ≤ 280 (-30%) |
| Lineas duplicadas | ~160 | ~40 |
| Funciones en el archivo | 28 + helpers | 28 + 1 helper |
| CC maxima | 13 | ≤ 13 (sin cambio esperado) |

### 3.6 Evaluacion de Riesgo

**Riesgo: BAJO.** El helper no cambia la logica — solo la centraliza. Las funciones exportadas mantienen el mismo nombre y firma. `server.ts` no necesita cambios. Los API tests (`npm run frisby`) validan que los challenges siguen funcionando.

---

## 4. Candidato 2: `routes/order.ts` — Extraccion de Servicios

### 4.1 Estado Actual

- **Archivo:** [`routes/order.ts`](../../routes/order.ts) (196 LOC, CC=17, 145 commits)
- **Funcion principal:** `placeOrder()` (lineas 33-176) — una sola funcion asincrona con 8 responsabilidades
- **Sin anotaciones vuln-code-snippet** (verificado)
- **Registrado en `server.ts`:** `app.post('/rest/basket/:id/checkout', order.placeOrder())`

### 4.2 Analisis de Responsabilidades

La funcion `placeOrder()` mezcla estas responsabilidades:

| # | Responsabilidad | Lineas | Dependencias |
|---|----------------|--------|--------------|
| 1 | Autenticacion del usuario | 39-41 | `security.authenticatedUsers` |
| 2 | Generacion de ID y setup PDF | 41-45 | `PDFDocument`, `fs`, `security.hash` |
| 3 | Escritura del PDF (header, items, totales) | 53-134 | `PDFDocument`, `req.__()` |
| 4 | Calculo de precios por item | 68-100 | `basket.Products`, `security.isDeluxe` |
| 5 | Gestion de inventario | 71-78 | `QuantityModel` |
| 6 | Calculo de delivery | 111-127 | `DeliveryModel` |
| 7 | Pagos con wallet + bonus | 138-152 | `WalletModel` |
| 8 | Persistencia de orden + challenges | 136, 154-168, 70 | `db.ordersCollection`, `challengeUtils` |

### 4.3 Estructura Propuesta

```
routes/order.ts                         # Thin handler (~60 LOC)
  ├── services/order/PricingService.ts  # Calculo de precios + descuentos
  ├── services/order/PdfService.ts      # Generacion de PDF
  └── services/order/PaymentService.ts  # Wallet + bonus points
```

**Nota:** Se mantiene la gestion de inventario en el handler porque esta entrelazada con el loop de productos del PDF. Se puede extraer en una fase posterior.

### 4.4 Fases de Refactorizacion

**Fase 1: Extraer PricingService** (mayor impacto en CC)

```typescript
// services/order/PricingService.ts
interface PricedProduct {
  quantity: number
  id: number | undefined
  name: string
  price: number
  total: number
  bonus: number
}

export function calculateItemPrice (
  product: BasketProduct,
  isDeluxe: boolean
): PricedProduct { ... }

export function calculateDiscount (
  basket: BasketModel,
  couponData?: string
): { discount: number, amount: number } { ... }

// Mover constante campaigns y funcion calculateApplicableDiscount
```

- Mover lineas 68-100 (calculo de precios) y lineas 178-208 (`calculateApplicableDiscount` + `campaigns`)
- `placeOrder` pasa a llamar `PricingService.calculateItemPrice()` y `PricingService.calculateDiscount()`
- **Reduccion esperada de CC:** de 17 a ~12

**Fase 2: Extraer PdfService**

```typescript
// services/order/PdfService.ts
interface OrderPdfData {
  appName: string
  email: string
  orderId: string
  date: string
  products: PricedProduct[]
  discount: { percent: number, amount: string }
  deliveryPrice: number
  totalPrice: number
  totalPoints: number
  translate: (key: string) => string
}

export function generateOrderPdf (data: OrderPdfData): Promise<string> { ... }
```

- Mover toda la logica de PDFDocument (lineas 43-45, 53-64, 96, 102-134)
- **Reduccion esperada de CC:** de ~12 a ~8

**Fase 3: Extraer PaymentService**

```typescript
// services/order/PaymentService.ts
export async function processWalletPayment (
  userId: number,
  totalPrice: number,
  paymentId: string
): Promise<void> { ... }

export async function addBonusPoints (
  userId: number,
  points: number
): Promise<void> { ... }
```

- Mover logica de wallet (lineas 138-152)
- **Reduccion esperada de CC:** de ~8 a ~5

### 4.5 Resultado Final

```typescript
// routes/order.ts — despues de refactorizacion (~60 LOC)
export function placeOrder () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const basket = await BasketModel.findOne({ where: { id: req.params.id }, include: [...] })
    if (!basket) return next(new Error(`Basket with id=${req.params.id} does not exist.`))

    const customer = security.authenticatedUsers.from(req)
    const email = customer?.data?.email ?? ''
    const orderId = security.hash(email).slice(0, 4) + '-' + utils.randomHexString(16)

    // Calculate prices
    const { products, totalPrice, totalPoints } = PricingService.calculateOrder(basket, req)

    // Check challenges
    challengeUtils.solveIf(challenges.christmasSpecialChallenge, ...)
    challengeUtils.solveIf(challenges.negativeOrderChallenge, ...)

    // Generate PDF
    await PdfService.generateOrderPdf({ orderId, email, products, ... })

    // Process payment
    if (req.body.UserId) {
      await PaymentService.processWalletPayment(req.body.UserId, totalPrice, ...)
      await PaymentService.addBonusPoints(req.body.UserId, totalPoints)
    }

    // Persist order
    await db.ordersCollection.insert({ orderId, totalPrice, products, ... })

    // Cleanup basket
    await basket.update({ coupon: null })
    await BasketItemModel.destroy({ where: { BasketId: req.params.id } })

    res.json({ orderConfirmation: orderId })
  }
}
```

### 4.6 Metricas de Exito

| Metrica | Antes | Objetivo |
|---------|-------|----------|
| CC de `placeOrder` | 17 | ≤ 8 |
| LOC de `order.ts` | 196 | ≤ 60 |
| Responsabilidades por funcion | 8 | 1 (orquestacion) |
| LOC total (todos los archivos) | 196 | ~250 (redistribuido) |

### 4.7 Evaluacion de Riesgo

**Riesgo: BAJO.**
- Sin vuln-code-snippet annotations
- API tests existentes (`npm run frisby`) cubren el endpoint `/rest/basket/:id/checkout`
- La interfaz HTTP no cambia — solo la implementacion interna
- Cada fase se puede validar independientemente

---

## 5. Candidato 3: `lib/startup/validateConfig.ts` — Validator Registry

### 5.1 Estado Actual

- **Archivo:** [`lib/startup/validateConfig.ts`](../../lib/startup/validateConfig.ts) (169 LOC, CC=19, 61 commits)
- **Funcion principal:** `validateConfig()` (lineas 28-54) — cadena secuencial de 10 validadores con `&&`
- **Sin anotaciones vuln-code-snippet** (verificado)
- **10 validadores ya extraidos** como funciones exportadas independientes

### 5.2 El Problema

La CC=19 proviene de la funcion `validateConfig` que encadena 10 llamadas:

```typescript
const validateConfig = async ({ products, memories, exitOnFailure }) => {
  let success = true
  success = checkYamlSchema() && success
  success = checkMinimumRequiredNumberOfProducts(products) && success
  success = checkUnambiguousMandatorySpecialProducts(products) && success
  success = checkUniqueSpecialOnProducts(products) && success
  success = checkNecessaryExtraKeysOnSpecialProducts(products) && success
  success = checkMinimumRequiredNumberOfMemories(memories) && success
  success = checkUnambiguousMandatorySpecialMemories(memories) && success
  success = checkUniqueSpecialOnMemories(memories) && success
  success = checkSpecialMemoriesHaveNoUserAssociated(memories) && success
  success = checkForIllogicalCombos() && success
  // + if/else para logging y exit
}
```

Cada `&&` agrega una rama al grafo de flujo, incrementando la CC. Los validadores individuales tienen CC baja (1-4 cada uno).

### 5.3 Estructura Propuesta

**Patron: Validator Registry**

```typescript
// lib/startup/validateConfig.ts — refactorizado

interface ValidationContext {
  products: ProductConfig[]
  memories: MemoryConfig[]
}

interface Validator {
  name: string
  validate: (ctx: ValidationContext) => boolean
}

const validators: Validator[] = [
  { name: 'yaml-schema', validate: () => checkYamlSchema() },
  { name: 'min-products', validate: (ctx) => checkMinimumRequiredNumberOfProducts(ctx.products) },
  { name: 'special-products', validate: (ctx) => checkUnambiguousMandatorySpecialProducts(ctx.products) },
  // ... 7 mas
]

const validateConfig = async ({ products, memories, exitOnFailure = true }) => {
  const ctx = { products: products ?? config.get('products'), memories: memories ?? config.get('memories') }
  const results = validators.map(v => ({ name: v.name, passed: v.validate(ctx) }))
  const success = results.every(r => r.passed)

  if (success) {
    logger.info(`Configuration ${config} validated (OK)`)
  } else {
    logger.warn(`Configuration ${config} validated (NOT OK)`)
    if (exitOnFailure) process.exit(1)
  }
  return success
}
```

### 5.4 Fases de Refactorizacion

| Fase | Cambio | Riesgo |
|------|--------|--------|
| **F1** | Definir interfaz `Validator` y crear array `validators` | Ninguno |
| **F2** | Reemplazar cadena `&&` con `validators.map()` + `every()` | BAJO |
| **F3** | (Opcional) Mover cada validador a archivo separado bajo `lib/startup/validators/` | BAJO |

### 5.5 Metricas de Exito

| Metrica | Antes | Objetivo |
|---------|-------|----------|
| CC de `validateConfig` | 19 | ≤ 5 |
| LOC de `validateConfig.ts` | 169 | ~170 (similar — se reemplaza logica, no se elimina) |
| Extensibilidad | Modificar funcion principal | Agregar entrada al array |

### 5.6 Evaluacion de Riesgo

**Riesgo: BAJO.** Las funciones validadoras ya estan separadas — el refactoring es mecanico. Se verifica con `npm start` (el servidor ejecuta `validateConfig` al arrancar) y con los tests unitarios existentes (`test/server/validateConfigSpec.ts`).

---

## 6. Priorizacion por Riesgo x Impacto

| Candidato | Impacto | Riesgo | Esfuerzo | Prioridad |
|-----------|---------|--------|----------|-----------|
| `routes/verify.ts` | ALTO (eliminar ~120 LOC duplicadas) | BAJO (sin vuln-code, API estable) | 2-3 horas | **1 (ALTA)** |
| `routes/order.ts` | ALTO (CC 17→8, SRP) | BAJO (sin vuln-code, tests API) | 4-6 horas | **2 (ALTA)** |
| `lib/startup/validateConfig.ts` | MEDIO (CC 19→5) | BAJO (refactoring mecanico) | 1-2 horas | **3 (MEDIA)** |

### Justificacion del Orden

1. **verify.ts primero:** Mayor hotspot score (100), mayor cantidad de duplicacion, cambio mas simple (un helper)
2. **order.ts segundo:** Segunda prioridad por CC (17) y violacion de SRP. Requiere mas esfuerzo pero tiene mayor impacto arquitectonico
3. **validateConfig.ts tercero:** Aunque tiene la CC mas alta (19), su churn es bajo y el refactoring es mecanico. Se puede hacer rapidamente al final

---

## 7. Cronograma Sugerido

| Semana | Fase | Archivo | Entregable |
|--------|------|---------|------------|
| S1 | F1-F2 | `routes/verify.ts` | Helper `solveIfMentionedIn` + migracion de 8 funciones |
| S1 | F1 | `routes/order.ts` | Extraer `PricingService` |
| S2 | F2-F3 | `routes/order.ts` | Extraer `PdfService` + `PaymentService` |
| S2 | F1-F2 | `validateConfig.ts` | Validator Registry pattern |

**Tiempo total estimado:** 7-11 horas de trabajo
**Validacion por fase:** `npm run lint && npm run frisby && npm run rsn`

---

## 8. Metricas de Exito Globales

### Antes (Estado Actual)

| Metrica | Valor |
|---------|-------|
| CC maxima del codebase | 19 |
| Funciones en WARN (CC 15-19) | 2 |
| LOC en verify.ts | 407 |
| LOC duplicadas en verify.ts | ~160 |
| Responsabilidades en placeOrder() | 8 |

### Despues (Objetivo)

| Metrica | Valor | Cambio |
|---------|-------|--------|
| CC maxima del codebase | ≤ 10 | -47% |
| Funciones en WARN (CC 15-19) | 0 | -100% |
| LOC en verify.ts | ≤ 280 | -31% |
| LOC duplicadas en verify.ts | ~40 | -75% |
| Responsabilidades en placeOrder() | 1 | -87% |

### Como Medir

```bash
# 1. Verificar CC despues de refactorizacion
node scripts/complexity-report.js

# 2. Verificar hotspots actualizados
node scripts/hotspot-analysis.js

# 3. Verificar que no se rompio nada
npm run lint && npm run frisby && npm run rsn
```

---

## 9. Referencias

- Fowler, M. (2004). [Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html). martinfowler.com.
- Fowler, M. (2018). *Refactoring: Improving the Design of Existing Code*. 2nd ed. Addison-Wesley.
- Martin, R. C. (2008). *Clean Code: A Handbook of Agile Software Craftsmanship*. Prentice Hall.
- Tornhill, A. (2015). *Your Code as a Crime Scene*. Pragmatic Bookshelf.
