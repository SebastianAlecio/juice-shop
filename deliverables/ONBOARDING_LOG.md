# Onboarding Log — OWASP Juice Shop

## DevEx Audit Report

### Executive Summary

This document chronicles the developer experience of onboarding onto the OWASP Juice Shop project, a Node.js/Angular e-commerce application intentionally designed with security vulnerabilities for training purposes. The audit systematically evaluates setup friction, documentation quality, testing experience, and code navigability.

**Key Metrics:**

- **Time to first run:** ~12 minutes (npm cache issues added ~3 minutes; clean install ~9 minutes)
- **Time to first contribution blocker:** ~5 minutes (npm cache permission errors on macOS)
- **Overall DevEx Score:** 3.2/5
- **10 friction points** identified: 3 Critical, 4 Medium, 3 Minor

**Top Critical Issues:**

1. npm cache permission errors require workaround (`--cache /tmp/npm-cache`)
2. Dual package.json architecture (root + frontend) doubles install time
3. API tests require server NOT running, but no documentation explains this

**Verdict:** Good "clone and run" experience once past initial npm issues. Documentation exists but is fragmented across README, CONTRIBUTING.md, and external book. A developer familiar with Node.js can be productive within 30 minutes; a junior developer may struggle with the multi-framework testing setup.

---

## 1. Setup Timeline

| Time | Action | Result |
|------|--------|--------|
| T+0:00 | `git clone` | Success (~15 seconds with `--depth 1`) |
| T+0:30 | Read README.md | Found setup instructions; clear 5-step process documented |
| T+1:00 | Check Node version | `node --version` → v22.18.0 (within supported range 20-24) |
| T+1:30 | `npm install` | **FAILED** — npm cache permission error (EACCES) |
| T+4:00 | Research fix | Found solution: use alternate cache location |
| T+5:00 | `npm install --cache /tmp/npm-cache` | Success (~7 minutes, includes postinstall) |
| T+12:00 | `npm start` | Server started on :3000 with seed data |
| T+12:30 | Browse http://localhost:3000 | **Application running successfully** |
| T+13:00 | `npm run lint` | All files pass linting (~8 seconds) |
| T+14:00 | `npm test` | Server tests run with Mocha (~5 seconds) |
| T+15:00 | `npm run frisby` | **FAILED** — "Exiting due to unsatisfied precondition" |
| T+18:00 | Research API tests | Discovered: API tests start their own server, conflicts if port 3000 is in use |
| T+20:00 | Stop server, re-run frisby | Tests execute (some failures due to test isolation) |

---

## 2. Prerequisites Check

| Requirement | Specification | Status | Notes |
|-------------|---------------|--------|-------|
| Node.js | v20-24 (LTS) | v22.18.0 | Strict range; older versions fail |
| npm | Included with Node | v11.7.0 | Cache permissions may need fix on macOS |
| Git | For cloning | v2.50.1 | No issues |
| Docker | Optional | Not tested | Alternative to source install |
| Python/gcc | For native modules | Present | Required for sqlite3, libxmljs2 |

---

## 3. Friction Points Identified

### 3.1 CRITICAL (Blocks Progress)

#### F1: npm Cache Permission Errors
- **Error:** `EACCES: permission denied, rename` in `~/.npm/_cacache`
- **Cause:** Previous npm runs with sudo created root-owned files
- **Impact:** Complete installation failure
- **Workaround:** `npm install --cache /tmp/npm-cache`
- **Time Lost:** ~3 minutes
- **Fix Recommendation:** Document in README or add pre-install check script

#### F2: Dual Package.json Architecture
- **Description:** Separate `package.json` in root and `/frontend`
- **Impact:**
  - `postinstall` runs `cd frontend && npm install` automatically
  - Total install time ~7 minutes (vs ~3 minutes for single package.json)
  - Two `node_modules` directories (~800MB total)
- **Time Lost:** ~4 minutes extra install time
- **Fix Recommendation:** Consider monorepo tools (nx, turborepo) or document expected times

#### F3: API Tests Server Conflict
- **Description:** `npm run frisby` fails if server is already running on port 3000
- **Error:** "Exiting due to unsatisfied precondition!"
- **Impact:** Developer confusion after successfully starting app
- **Documentation:** None found explaining this requirement
- **Time Lost:** ~5 minutes researching
- **Fix Recommendation:** Add clear message or document in README

### 3.2 MEDIUM (Slows Progress)

#### F4: Multiple Testing Frameworks
- **Frameworks in use:**
  - Mocha (server unit tests)
  - Jest/Frisby (API integration tests)
  - Jasmine/Karma (frontend unit tests)
  - Cypress (E2E tests)
- **Impact:** Different commands, configurations, and patterns to learn
- **Commands:** `npm test`, `npm run test:server`, `npm run frisby`, `npm run cypress:run`

#### F5: Native Module Compilation
- **Modules:** sqlite3, libxmljs2
- **Impact:** Requires Python, make, gcc on system
- **Error if missing:** `node-gyp rebuild failed`
- **Platforms affected:** Fresh macOS/Linux installs without Xcode/build-essential

#### F6: Fragmented Documentation
- **Sources:**
  - README.md (basic setup)
  - CONTRIBUTING.md (PR requirements)
  - External book: pwning.owasp-juice.shop (detailed guide)
  - Swagger: Only B2B API documented
- **Impact:** Must check multiple sources for complete picture

#### F7: No .nvmrc File
- **Impact:** Developer must manually check README for Node version
- **Risk:** Easy to use wrong Node version and get cryptic errors

### 3.3 MINOR (Inconvenience)

#### F8: Large Dependency Tree
- **Production deps:** 88 packages
- **Dev deps:** 76 packages
- **Total download:** ~200MB
- **Impact:** Slow install on poor connections

#### F9: No .env.example
- **Configuration:** Spread across 15 YAML files in `/config`
- **Impact:** Unclear which settings can be customized
- **Note:** Default config works for development

#### F10: RSN System Undocumented for Newcomers
- **What it is:** Refactoring Safety Net for code challenges
- **Impact:** `npm run rsn` fails without context on why or when to use it

---

## 4. Testing Experience

### 4.1 Test Execution Results

| Test Suite | Command | Time | Result |
|------------|---------|------|--------|
| Server (Mocha) | `npm run test:server` | ~5 seconds | 3 failures (port conflict in test) |
| API (Frisby) | `npm run frisby` | ~10 seconds | Requires server stopped first |
| Lint | `npm run lint` | ~8 seconds | All pass |
| E2E (Cypress) | `npm run cypress:run` | Not tested | Requires headed browser |

### 4.2 Test Coverage

```
Server Tests:
  Statements: 24.39% (742/3042)
  Branches:   17.55% (218/1242)
  Functions:  18.14% (123/678)
  Lines:      21.81% (607/2783)

API Tests:
  Statements: 41.81% (1484/3549)
  Branches:   7.00% (87/1242)
  Functions:  25.51% (173/678)
  Lines:      40.75% (1331/3266)
```

### 4.3 Testing Friction Points

1. **No single command runs all tests** — must run multiple commands
2. **API tests conflict with running server** — undocumented
3. **Coverage reports in different locations** — `./build/reports/coverage/`
4. **E2E tests require additional setup** — Cypress install, browser availability

---

## 5. Project Metrics

| Metric | Value |
|--------|-------|
| Lines of code (estimated) | ~50,000+ |
| Production dependencies | 88 |
| Development dependencies | 76 |
| Sequelize models | 20 |
| API route files | 64 |
| Frontend components | 70+ |
| Frontend services | 76 |
| Supported languages (i18n) | 44 |
| Security challenges | 126 |
| Test files | 111 |

---

## 6. Time Estimates by Method

| Method | Time to First Run | Complexity | Notes |
|--------|-------------------|------------|-------|
| Docker | 2-5 minutes | Low | `docker pull && docker run` |
| From sources (SSD, fast network) | 10-15 minutes | Medium | Includes postinstall build |
| From sources (HDD, slow network) | 20-40 minutes | Medium | Large dependency download |
| From sources (with npm issues) | 15-25 minutes | Medium-High | Add time for troubleshooting |

---

## 7. Useful Commands for Developers

```bash
# Development
npm install              # Install all dependencies (runs postinstall)
npm start                # Start production server
npm run serve:dev        # Development with hot reload

# Testing (stop server first for API tests!)
npm test                 # Frontend + server unit tests
npm run test:server      # Server tests only (Mocha)
npm run frisby           # API tests (Jest/Frisby) — SERVER MUST BE STOPPED
npm run cypress:open     # E2E tests interactive
npm run cypress:run      # E2E tests headless

# Code Quality
npm run lint             # Check all code style
npm run lint:fix         # Auto-fix lint issues
npm run rsn              # Check code challenge consistency
npm run rsn:update       # Update RSN cache after intentional changes

# Individual Tests
npx mocha -r ts-node/register test/server/utilsSpec.ts
npx jest test/api/loginApiSpec.ts
npx cypress run --spec test/cypress/e2e/login.spec.ts
```

---

## 8. DevEx Score Card

| Aspect | Score | Notes |
|--------|-------|-------|
| Time to first run | 3/5 | Good with Docker; npm issues reduce score |
| README quality | 4/5 | Clear setup steps; missing test instructions |
| Dependency management | 3/5 | Dual package.json; native modules need build tools |
| Configuration clarity | 3/5 | YAML configs work but underdocumented |
| Test experience | 2/5 | Multiple frameworks; server conflict undocumented |
| Code readability | 4/5 | Well-structured; TypeScript helps |
| IDE support | 4/5 | ESLint config present; TypeScript definitions |
| Containerization | 5/5 | Official Docker image; works out of box |
| CI/CD | 4/5 | GitHub Actions configured; good coverage |
| **Overall** | **3.2/5** | Good for Node.js developers; rough edges for newcomers |

---

## 9. Recommendations

### High Priority
1. **Add .nvmrc file** with `20` to specify Node version
2. **Document API test requirement** (server must be stopped)
3. **Add npm cache troubleshooting** to README

### Medium Priority
4. **Create DEVELOPMENT.md** with detailed contributor guide
5. **Unify or document test strategy** — explain when to use each framework
6. **Add .env.example** with configurable environment variables

### Low Priority
7. **Consider monorepo tooling** to unify frontend/backend installs
8. **Add pre-install script** to check system requirements
9. **Generate full API documentation** (currently only B2B endpoints)

---

## 10. Conclusion

OWASP Juice Shop provides a functional developer experience with clear setup instructions for the happy path. However, several friction points can significantly delay onboarding:

1. **npm permission issues** are common on macOS and require workarounds
2. **Dual architecture** doubles install time and disk usage
3. **Testing is fragmented** across four frameworks with undocumented requirements

For new developers, **Docker is the recommended approach** for initial exploration. Only set up from sources when contributing code is necessary.

---

*Generated 2026-02-10 via hands-on testing and AI-assisted analysis (Claude Code) of setup process, build configs, test execution, and documentation.*
