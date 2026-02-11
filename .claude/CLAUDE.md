# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> This document is the primary source of context for **all** AI tools. Context files of tools other than Claude should refer to [this `CLAUDE.md` file](CLAUDE.md) for detailed guidelines.

## Quick Reference

### Common Commands

```bash
# Development
npm install              # Install dependencies (runs postinstall to build frontend)
npm start                # Run production build (requires prior npm install)
npm run serve:dev        # Development with hot reload (backend + frontend)

# Testing
npm test                 # All tests (frontend + server unit tests)
npm run frisby           # API integration tests (Jest/Frisby)
npm run cypress:open     # E2E tests interactive mode
npm run cypress:run      # E2E tests headless

# Single test file examples
npx mocha -r ts-node/register test/server/utilsSpec.ts     # Single server test
npx jest test/api/loginApiSpec.ts                          # Single API test
npx cypress run --spec test/cypress/e2e/login.spec.ts      # Single E2E test

# Code quality
npm run lint             # ESLint (backend + frontend)
npm run lint:fix         # Auto-fix lint issues
npm run rsn              # Refactoring Safety Net check
npm run rsn:update       # Update RSN cache for intentional changes

# Build
npm run build:frontend   # Build Angular frontend
npm run build:server     # Compile TypeScript backend
```

### Requirements
- Node.js 20-24 (LTS versions)
- All commits must be signed off: `git commit -s -m "message"`
- PRs must be based on `develop` branch
- Code style: [JS Standard Style](http://standardjs.com/)

## Architecture Overview

OWASP Juice Shop is an intentionally vulnerable web application for security training. It's a full-stack Node.js/Angular application with 100+ security challenges.

### Startup Flow

`app.ts` → validates dependencies → imports `server.ts` → `server.start()`. The server sets up Express middleware, registers all route handlers, initializes finale-rest auto-generated CRUD endpoints, seeds the database via `data/datacreator.ts`, and starts listening on port 3000.

### Project Structure

```
juice-shop/
├── app.ts, server.ts    # Entry point and Express server setup
├── routes/              # 64 API route handlers
├── lib/                 # Core utilities (auth, challenge verification, etc.)
├── models/              # 21 Sequelize models (SQLite database)
├── data/
│   ├── datacreator.ts   # Database seeding on startup
│   ├── datacache.ts     # In-memory cache of challenges, users, products
│   ├── mongodb.ts       # MarsDB collections (reviews, orders)
│   └── static/
│       ├── challenges.yml     # Challenge definitions
│       ├── codefixes/         # 145+ vulnerable code snippets
│       └── i18n/              # Translations (44 languages)
├── frontend/            # Angular 16+ SPA
│   └── src/app/
│       ├── app.routing.ts     # 70+ routes
│       └── (70+ components, 76 services)
├── config/              # YAML configuration files
├── test/
│   ├── api/             # Jest/Frisby API tests
│   ├── server/          # Mocha unit tests
│   └── cypress/         # E2E browser tests
└── rsn/                 # Refactoring Safety Net
```

### Key Files

| Purpose | Location |
|---------|----------|
| Add API endpoint | `routes/*.ts` → register in `server.ts` |
| Add UI page | `frontend/src/app/` → add route in `app.routing.ts` |
| Add challenge | `data/static/challenges.yml` → verification in `routes/verify.ts` |
| Database models | `models/*.ts` (initialized in `models/index.ts`, relations in `models/relations.ts`) |
| Auth/security utils | `lib/insecurity.ts` |
| Challenge helpers | `lib/challengeUtils.ts` |
| In-memory data cache | `data/datacache.ts` |

### Tech Stack
- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: Angular 16+, Angular Material
- **Database**: SQLite via Sequelize ORM (structured data) + MarsDB in-memory (reviews, orders)
- **Testing**: Jest, Mocha, Cypress, Frisby
- **Security**: Helmet, JWT (intentionally vulnerable implementations)

### Auto-Generated CRUD Endpoints

`finale-rest` generates REST endpoints for 14 models at `/api/{ModelName}s` and `/api/{ModelName}s/:id` (e.g., `/api/Users`, `/api/Products/:id`). These are configured in `server.ts` around line 475. Custom route handlers in `routes/` handle non-CRUD logic.

### Configuration System

Uses `node-config` with YAML files in `config/`. `config/default.yml` is the base config. Set `NODE_APP_INSTANCE=ctf` (or any other config name) to load alternate configs like `config/ctf.yml`, `config/bodgeit.yml`, etc. The config controls theming, challenge availability, chatbot settings, social links, and more.

## Challenge System

Challenges are defined in `data/static/challenges.yml` with:
- Metadata (name, category, difficulty 1-6)
- OWASP vulnerability mappings
- Hints and mitigation URLs
- Environment restrictions

### Challenge Verification Pattern

Verification hooks in `routes/verify.ts` use Express middleware that calls `challengeUtils.solveIf(challenges.key, criteriaFn)`. The `datacache.challenges` object holds all challenges in memory. When a challenge is solved, it's persisted to the DB and a WebSocket notification is emitted.

### Vuln-Code-Snippet Comment System

Source files containing intentional vulnerabilities are annotated with special comments for the coding challenge system:

```typescript
// vuln-code-snippet start challengeName      // marks block start
// vuln-code-snippet end challengeName        // marks block end
// vuln-code-snippet vuln-line challengeName  // marks the vulnerable line(s)
// vuln-code-snippet neutral-line challengeName // context lines (not vulnerable)
// vuln-code-snippet hide-line                // excluded from snippet display
```

These comments are parsed by `lib/codingChallenges.ts` to extract code snippets shown to users. **Never remove or reformat these comments** when editing annotated files. The RSN ensures these stay synchronized with `data/static/codefixes/`.

## Refactoring Safety Net (RSN)

When modifying code that is part of a coding challenge, run RSN to ensure code snippets stay synchronized:

```bash
npm run rsn              # Check for inconsistencies
npm run rsn:update       # Update cache for intentional changes
```

The RSN compares files in `data/static/codefixes/` with their source code. Run it after:
- Refactoring challenge-related code
- Modifying source files referenced in challenges

## Contribution Guidelines

### Code Requirements
1. PRs must be based on `develop` branch
2. Code must pass ESLint (JS Standard Style)
3. New/changed challenges require E2E tests
4. All commits must be signed off (DCO)
5. Remove AI-generated noise (verbose comments, redundant docstrings)
6. Single, focused scope per PR

### Testing Requirements
- **Unit/integration tests**: Required for new features
- **E2E tests**: Required for challenge modifications
- **RSN check**: Required when modifying coding challenge code

### What to Avoid
- Modifying translations directly (use [Crowdin](https://crowdin.com/project/owasp-juice-shop))
- Creating new challenges without maintainer consultation
- Adding security vulnerabilities that aren't intentional for the project
- Low-effort or trivial PRs
