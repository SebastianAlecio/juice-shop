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

### Project Structure

```
juice-shop/
├── app.ts, server.ts    # Entry point and Express server setup
├── routes/              # 64 API route handlers
├── lib/                 # Core utilities (auth, challenge verification, etc.)
├── models/              # 19 Sequelize models (SQLite database)
├── data/
│   ├── datacreator.ts   # Database seeding on startup
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
| Database models | `models/*.ts` |
| Auth/security utils | `lib/insecurity.ts` |
| Challenge helpers | `lib/challengeUtils.ts` |

### Tech Stack
- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: Angular 16+, Angular Material
- **Database**: SQLite via Sequelize ORM
- **Testing**: Jest, Mocha, Cypress, Frisby
- **Security**: Helmet, JWT (intentionally vulnerable implementations)

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

## Challenge System

Challenges are defined in `data/static/challenges.yml` with:
- Metadata (name, category, difficulty 1-6)
- OWASP vulnerability mappings
- Hints and mitigation URLs
- Environment restrictions

Verification hooks in `routes/verify.ts` detect when challenges are solved by intercepting requests/responses.

Coding challenges include vulnerable code in `data/static/codefixes/` that users can fix. The RSN ensures these stay synchronized with source code.
