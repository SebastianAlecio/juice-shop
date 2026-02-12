# Auditoria de Deuda Tecnica — Hotspots de Churn x Complejidad

**Fecha:** 11 de Febrero, 2026
**Equipo:** Alessandro Alecio - Diego Sican
**Proyecto:** OWASP Juice Shop v19.1.1

---

## 1. Resumen Ejecutivo

Se realizo un analisis de deuda tecnica del backend de OWASP Juice Shop utilizando la formula **Churn x Complejidad Ciclomatica** para identificar los archivos con mayor riesgo de defectos y mayor beneficio de refactorizacion.

**Hallazgos clave:**
- **200 archivos** analizados en `lib/`, `routes/`, `models/`, `data/`, `server.ts`, `app.ts`
- **3 archivos** en zona CRITICO (score normalizado >= 75)
- **2 archivos** en zona ALTO (score normalizado 50-74)
- **Top 3 candidatos** para refactorizacion: `routes/verify.ts`, `routes/order.ts`, `lib/startup/validateConfig.ts`
- La complejidad ciclomatica maxima del codebase es **19** (`validateConfig.ts`) — debajo del umbral de fallo (20) pero en zona WARN

---

## 2. Metodologia

### 2.1 Metricas Utilizadas

| Metrica | Descripcion | Fuente |
|---------|-------------|--------|
| **Churn** | Total de commits que modifican el archivo (historial completo) | `git log --follow --oneline -- <file>` |
| **Complejidad Ciclomatica (CC)** | Maxima CC medida por ESLint regla `complexity` con umbral 1 | `npx eslint --rule 'complexity: [warn, {max: 1}]'` |
| **LOC** | Lineas de codigo no vacias | Conteo directo del archivo |

### 2.2 Formula de Hotspot

```
Hotspot Score = Churn (commits) x Max CC (del archivo)
Normalized Score = (Score / Max Score) x 100
```

**Justificacion:** Un archivo complejo que nunca cambia tiene bajo riesgo operativo. Un archivo simple que cambia frecuentemente es manejable. La combinacion identifica archivos que son **simultaneamente complejos Y frecuentemente modificados** — donde los defectos son mas probables y la refactorizacion tiene mayor retorno de inversion.

> **Referencia:** Adam Tornhill, *Your Code as a Crime Scene* (2015) — analisis forense de codigo usando churn x complexity como predictor de defectos.

### 2.3 Clasificacion de Riesgo

| Nivel | Score Normalizado | Interpretacion | Accion |
|-------|------------------|----------------|--------|
| **CRITICO** | >= 75 | Alta probabilidad de defectos | Refactorizacion urgente |
| **ALTO** | 50-74 | Riesgo significativo | Planificar refactorizacion |
| **MEDIO** | 25-49 | Riesgo moderado | Monitorear, refactorizar si se modifica |
| **BAJO** | < 25 | Riesgo aceptable | Ninguna accion requerida |

---

## 3. Top 10 Hotspots

| # | Archivo | Commits | LOC | Max CC | Raw Score | Norm. | Riesgo |
|---|---------|---------|-----|--------|-----------|-------|--------|
| 1 | `routes/verify.ts` | 332 | 407 | 13 | 4,316 | 100 | CRITICO |
| 2 | `data/datacreator.ts` | 379 | 693 | 11 | 4,169 | 97 | CRITICO |
| 3 | `server.ts` | 583 | 687 | 7 | 4,081 | 95 | CRITICO |
| 4 | `routes/order.ts` | 145 | 196 | 17 | 2,465 | 57 | ALTO |
| 5 | `lib/utils.ts` | 177 | 199 | 13 | 2,301 | 53 | ALTO |
| 6 | `lib/startup/validateConfig.ts` | 61 | 169 | 19 | 1,159 | 27 | MEDIO |
| 7 | `lib/antiCheat.ts` | 79 | 142 | 14 | 1,106 | 26 | MEDIO |
| 8 | `routes/chatbot.ts` | 85 | 225 | 13 | 1,105 | 26 | MEDIO |
| 9 | `routes/fileUpload.ts` | 102 | 137 | 9 | 918 | 21 | BAJO |
| 10 | `routes/userProfile.ts` | 71 | 87 | 12 | 852 | 20 | BAJO |

*190 archivos adicionales analizados — todos con riesgo MEDIO o BAJO.*

---

## 4. Matriz de Riesgo/Impacto

```
                    ALTO CHURN
                    │
     CRITICO        │  ● datacreator.ts (379, CC=11)
     Refactorizar   │  ● server.ts (583, CC=7)
     Primero        │  ● verify.ts (332, CC=13)
                    │
 ALTA              ─┤─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
 COMPLEJIDAD        │
                    │  ● order.ts (145, CC=17)
                    │  ● utils.ts (177, CC=13)
                    │
                   ─┤─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
     Monitorear     │  ● chatbot.ts (85, CC=13)
                    │  ● antiCheat.ts (79, CC=14)
     BAJO CHURN     │  ● validateConfig.ts (61, CC=19)
                    └──────────────────────────────────
                     BAJA COMPLEJIDAD → ALTA COMPLEJIDAD
```

### Interpretacion de la Matriz

- **Cuadrante superior-derecho (CRITICO):** `verify.ts`, `datacreator.ts`, `server.ts` — archivos con churn extremo (300+ commits) y complejidad significativa. Mayor impacto de refactorizacion.
- **Cuadrante inferior-derecho (ALTO):** `order.ts` — churn moderado pero la complejidad mas alta entre routes (CC=17). Cada cambio tiene alto riesgo de introducir defectos.
- **Cuadrante inferior-izquierdo (MEDIO):** `validateConfig.ts` — la CC mas alta del repo (19), pero bajo churn. Refactorizar si se necesita modificar.
- `server.ts` y `datacreator.ts` tienen el churn mas alto pero complejidad moderada — su riesgo viene del tamano (687-693 LOC) mas que de funciones individuales.

---

## 5. Top 3 Candidatos para Refactorizacion

### Candidato 1: `routes/verify.ts`

| Metrica | Valor |
|---------|-------|
| **Score Normalizado** | 100 (CRITICO) |
| **Commits** | 332 (mas modificado en routes/) |
| **LOC** | 407 |
| **Max CC** | 13 |
| **Funciones exportadas** | 28 |

**Problemas identificados:**
1. **Patron duplicado 8 veces:** Funciones como `knownVulnerableComponentChallenge()`, `weirdCryptoChallenge()`, `typosquattingNpmChallenge()`, etc. repiten el mismo patron de consultar `FeedbackModel.findAndCountAll()` Y `ComplaintModel.findAndCountAll()` con la misma logica — ~160 lineas de codigo duplicado
2. **440 LOC en un solo archivo:** Mezcla verificaciones de acceso, JWT, server-side, database-driven y coding challenges
3. **Alto acoplamiento:** Cada funcion de verificacion esta acoplada a `challengeUtils.solveIf/solve` y al objeto `challenges`
4. **Sin vuln-code-snippet:** El archivo no contiene anotaciones del sistema de coding challenges, permitiendo refactorizacion segura

**Justificacion:** Puntaje maximo de hotspot. La duplicacion de codigo es la fuente principal de deuda — 8 funciones con el mismo patron de FeedbackModel + ComplaintModel. Extraer un helper eliminaria ~120 lineas redundantes.

### Candidato 2: `routes/order.ts`

| Metrica | Valor |
|---------|-------|
| **Score Normalizado** | 57 (ALTO) |
| **Commits** | 145 |
| **LOC** | 196 |
| **Max CC** | 17 (WARN — segunda mas alta del repo) |
| **Funciones** | 2 (`placeOrder`, `calculateApplicableDiscount`) |

**Problemas identificados:**
1. **8 responsabilidades en una sola funcion:** `placeOrder()` (lineas 33-176) maneja autenticacion, generacion de PDF, calculo de precios, gestion de inventario, delivery, pagos con wallet, verificacion de challenges y persistencia de orden
2. **CC=17:** Cerca del umbral de fallo (20), la segunda mas alta del codebase
3. **Nesting profundo:** Cadena asincrona con callbacks anidados (`then → forEach → then → catch`)
4. **Sin vuln-code-snippet:** Refactorizacion segura

**Justificacion:** La CC mas alta entre archivos de rutas. La funcion `placeOrder()` es un ejemplo clasico de "God Function" que viola el principio de responsabilidad unica. Cada modificacion tiene alto riesgo de efectos secundarios.

### Candidato 3: `lib/startup/validateConfig.ts`

| Metrica | Valor |
|---------|-------|
| **Score Normalizado** | 27 (MEDIO) |
| **Commits** | 61 |
| **LOC** | 169 |
| **Max CC** | 19 (la mas alta del codebase) |
| **Funciones exportadas** | 10 |

**Problemas identificados:**
1. **CC=19 en `validateConfig()`:** Cadena secuencial de 10 llamadas a validadores con `&&` short-circuit (lineas 28-54)
2. **Repeticion de patron:** Cada validador sigue el mismo patron: iterar array, verificar condicion, loggear warning, retornar boolean
3. **Acercandose al umbral de fallo:** CC=19 esta a 1 punto del limite duro (20) que bloquea PRs

**Justificacion:** Aunque su churn es moderado, tiene la CC mas alta del codebase. Los validadores ya estan parcialmente extraidos como funciones independientes — el refactoring a un patron Validator Registry es mecanico y de bajo riesgo.

---

## 6. Distribucion de Riesgo

| Nivel | Archivos | % del Total |
|-------|----------|-------------|
| CRITICO | 3 | 1.5% |
| ALTO | 2 | 1.0% |
| MEDIO | 3 | 1.5% |
| BAJO | 192 | 96.0% |

**Conclusion:** El 96% del codebase tiene riesgo bajo. La deuda tecnica se concentra en **5 archivos** (CRITICO + ALTO) que representan solo el 2.5% de los archivos pero acumulan el mayor riesgo de defectos.

---

## 7. Relacion con SonarCloud

El analisis de hotspots (churn x complejidad) y SonarCloud son **complementarios:**

| Dimension | Hotspot Analysis | SonarCloud |
|-----------|-----------------|------------|
| **Temporal** | Si (churn = historial git) | No (snapshot actual) |
| **Complejidad** | Ciclomatica (ESLint) | Ciclomatica + Cognitiva |
| **Duplicacion** | No | Si (bloques duplicados) |
| **Bugs potenciales** | Indirecto (churn x CC) | Directo (pattern matching) |
| **Code Smells** | No | Si (150+ reglas) |
| **Coverage** | No | Si (integrado con NYC) |

**En conjunto:**
- Hotspot analysis identifica **donde** invertir esfuerzo de refactorizacion (dimension temporal)
- SonarCloud identifica **que** cambiar en esos archivos (bugs, smells, duplicacion)
- Los archivos CRITICO del hotspot analysis son los candidatos prioritarios para revisar en el dashboard de SonarCloud

---

## 8. Herramienta de Analisis

**Script:** [`scripts/hotspot-analysis.js`](../../scripts/hotspot-analysis.js)

```bash
# Ejecucion
node scripts/hotspot-analysis.js

# Output
build/reports/hotspot-analysis.md
```

El script:
1. Resuelve archivos `.ts` en `lib/`, `routes/`, `models/`, `data/`, `server.ts`, `app.ts`
2. Calcula churn via `git log --follow`
3. Obtiene CC maxima via ESLint con umbral reducido (`max: 1`)
4. Genera reporte markdown con top 10, distribucion de riesgo y resumen

---

## 9. Referencias

- Tornhill, A. (2015). *Your Code as a Crime Scene*. Pragmatic Bookshelf.
- Nagappan, N., Ball, T., & Zeller, A. (2006). "Mining metrics to predict component failures". *ICSE '06*.
- Fowler, M. (2018). *Refactoring: Improving the Design of Existing Code*. 2nd ed. Addison-Wesley.
