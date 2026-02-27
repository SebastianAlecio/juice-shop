# Deliverables - Tercera Entrega

**Fecha:** 26 de Febrero, 2026
**Equipo:** Alessandro Alecio - Diego Sican
**Proyecto:** OWASP Juice Shop v19.1.1
**Focus:** Supply Chain Security

---

## Resumen Ejecutivo

En esta tercera entrega se implementaron tres controles de seguridad de la cadena de suministro:

1. **SBOM Generation** — Generacion de Software Bill of Materials en formato CycloneDX 1.6 (JSON y XML) con 750 componentes de produccion catalogados
2. **Vulnerability Patching** — Escaneo con Trivy + npm audit, identificacion y remediacion de 2 vulnerabilidades: `crypto-js` CRITICAL (via pdfkit) y `ws` HIGH (via socket.io)
3. **Secret Protection** — Hook pre-commit con Husky v9 + secretlint que bloquea commits con API keys, tokens y credenciales

---

## Entregables

### 1. SBOM Generation
**Archivo:** [SBOM_REPORT.md](SBOM_REPORT.md)

Generacion de Software Bill of Materials usando CycloneDX npm plugin:
- **750 componentes** de produccion catalogados
- **15 licencias unicas** (82% MIT)
- Formatos: CycloneDX JSON + XML (spec v1.6)
- SBOMs almacenados en [`sbom/`](sbom/)

### 2. Vulnerability Patching
**Archivo:** [VULNERABILITY_PATCHING.md](VULNERABILITY_PATCHING.md)

Escaneo y remediacion de vulnerabilidades en dependencias:
- **Before:** 44 vulnerabilidades (9 CRITICAL, 35 HIGH)
- **After:** 42 vulnerabilidades (8 CRITICAL, 34 HIGH)
- **Fix 1:** `pdfkit` 0.11.0 → 0.17.2 (elimina `crypto-js` CRITICAL CVE-2023-46233)
- **Fix 2:** `socket.io` 3.1.2 → 4.8.3 (elimina `ws` HIGH CVE-2024-37890)
- Reportes before/after en [`vulnerability-scan/`](vulnerability-scan/)

### 3. Secret Protection
**Archivo:** [SECRET_PROTECTION.md](SECRET_PROTECTION.md)

Pre-commit hook para prevencion de leaks de secretos:
- **Husky v9** para gestion de git hooks
- **secretlint** con preset recomendado (AWS, GCP, GitHub, Slack, npm, SendGrid, SSH keys)
- Demostracion exitosa bloqueando commit con Slack token dummy
- Configuracion: `.husky/pre-commit`, `.secretlintrc.json`, `.secretlintignore`

---

## Mini-Rubrica

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| SBOM file is present in the repo | Implementado | [`sbom/bom.json`](sbom/bom.json) + [`sbom/bom.xml`](sbom/bom.xml) (CycloneDX 1.6) |
| Evidence of vulnerability remediation (Before/After report) | Implementado | [`VULNERABILITY_PATCHING.md`](VULNERABILITY_PATCHING.md) — 44→42 vulns, 2 fixes documentados con CVE |
| Pre-commit hook blocks dummy secrets effectively | Implementado | [`SECRET_PROTECTION.md`](SECRET_PROTECTION.md) — Husky + secretlint bloquea Slack tokens, evidencia incluida |

---

## Archivos Creados/Modificados

| Archivo | Accion | Proposito |
|---------|--------|-----------|
| `deliverables/Entrega 3/README.md` | Creado | Este archivo |
| `deliverables/Entrega 3/SBOM_REPORT.md` | Creado | Documentacion de generacion SBOM |
| `deliverables/Entrega 3/VULNERABILITY_PATCHING.md` | Creado | Reporte de remediacion de vulnerabilidades |
| `deliverables/Entrega 3/SECRET_PROTECTION.md` | Creado | Documentacion del pre-commit hook |
| `deliverables/Entrega 3/sbom/bom.json` | Creado | SBOM CycloneDX JSON |
| `deliverables/Entrega 3/sbom/bom.xml` | Creado | SBOM CycloneDX XML |
| `deliverables/Entrega 3/vulnerability-scan/*` | Creado | 8 reportes (Trivy + npm audit, before/after) |
| `.husky/pre-commit` | Creado | Hook pre-commit con secretlint |
| `.secretlintrc.json` | Creado | Configuracion de secretlint |
| `.secretlintignore` | Creado | Exclusiones para secretlint |
| `package.json` | Modificado | Bump pdfkit, socket.io, socket.io-client; add husky, secretlint |
| `test/api/socketSpec.ts` | Modificado | Imports actualizados para socket.io-client v4 |
| `test/api/vulnCodeFixesSpec.ts` | Modificado | Imports actualizados para socket.io-client v4 |
| `test/api/vulnCodeSnippetSpec.ts` | Modificado | Imports actualizados para socket.io-client v4 |
| `lib/challengeUtils.ts` | Modificado | Tipo global actualizado (removido SocketIOClientStatic) |
| `lib/startup/registerWebsocketEvents.ts` | Modificado | Tipo global simplificado para socket.io v4 |

---

## Decisiones No-Triviales

### D1: Trivy sobre Snyk
**Decision:** Usar Trivy como scanner de vulnerabilidades en lugar de Snyk.
**Razon:** Trivy es open-source, no requiere cuenta ni API token, y genera reportes en multiples formatos (JSON, table). Snyk requiere registro y autenticacion. Para un entregable academico, Trivy ofrece el mismo valor con menor friccion.

### D2: secretlint sobre gitleaks/detect-secrets
**Decision:** Usar secretlint (Node.js) en lugar de gitleaks (Go) o detect-secrets (Python).
**Razon:** secretlint es nativo del ecosistema Node.js del proyecto. No requiere instalar Go ni Python. Se integra directamente con npm/npx y tiene un preset recomendado mantenido activamente.

### D3: No parchear vulnerabilidades intencionales
**Decision:** No actualizar `jsonwebtoken`, `express-jwt`, `sanitize-html`, `marsdb`, `vm2`, ni `unzipper`.
**Razon:** OWASP Juice Shop es una aplicacion intencionalmente vulnerable. Estas dependencias son parte de los challenges de seguridad y actualizarlas romperia la funcionalidad educativa del proyecto. Se documentan explicitamente en el reporte.

### D4: SBOM en deliverables en vez de raiz
**Decision:** Almacenar los SBOMs en `deliverables/Entrega 3/sbom/` en lugar de removerlos del `.gitignore` de raiz.
**Razon:** Los SBOMs de raiz (`bom.json`, `bom.xml`) son artefactos de build regenerables que cambian con cada `npm install`. Commiterlos en la raiz causaria diffs innecesarios. Las copias en deliverables son una snapshot puntual para evidencia.

### D5: socket.io v3 → v4 como segunda remediacion
**Decision:** Actualizar socket.io de v3 a v4 (major version bump).
**Razon:** Elimina la vulnerabilidad `ws` CVE-2024-37890 (HIGH) y ademas mantiene la compatibilidad cliente-servidor. Los cambios de API fueron minimos (imports de tipos TypeScript). Se verifico con `npx tsc --noEmit` sin errores.

---

## Como Verificar

```bash
# 1. Verificar SBOM existe
ls deliverables/Entrega\ 3/sbom/bom.json

# 2. Verificar reportes before/after
ls deliverables/Entrega\ 3/vulnerability-scan/

# 3. Verificar compilacion TypeScript (post-parcheo)
npx tsc --noEmit

# 4. Verificar pre-commit hook bloquea secretos
echo '<slack-bot-token-here>' > test-secret.txt
git add test-secret.txt
git commit -m "test"   # Debe fallar con "SLACK_TOKEN found"
git reset HEAD test-secret.txt && rm test-secret.txt

# 5. Verificar versions parcheadas
npm ls pdfkit socket.io socket.io-client
```
