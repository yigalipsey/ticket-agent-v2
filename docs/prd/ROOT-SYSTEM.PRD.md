# Root System Production Readiness Document (PRD) — TICKET-AGENT-V2

## 1. Global System Overview

`TICKET-AGENT-V2` is a high-performance full-stack ticket aggregator service designed as a **Modular Monolith inside a Monorepo workspace**. The project architecture isolates business logic into independent vertical feature slices to prevent technical debt and simplify AI-assisted development.

The system is split into two independent architectural layers during deployment, but managed together during development:

1. **Backend Application:** A robust, persistent, 24/7 NestJS server handling data aggregation, authentication, background workers, and business logic.
2. **Frontend Application:** A fast Next.js user interface focused on SEO, server-side rendering, and customer experience.

---

## 2. Technical Stack Specifications (2026 Standards)

### Core Runtime & Languages

- **Language:** TypeScript (Strict Mode enabled, zero `any` allowance).
- **Package Manager:** Yarn (v4+) using Workspaces for global dependency management.
- **Compiler/Build Engine:** SWC (`@swc/core`) for sub-millisecond Hot Reloading.

### Backend Layer (`backend/`)

- **Framework:** NestJS v11 (Express-based core, strictly utilizing built-in dependency injection).
- **Database:** PostgreSQL (The absolute relational source of truth).
- **ORM:** Drizzle ORM (v0.41.0+) — Used for native Type-safe SQL-first interaction.
- **Database Driver:** `postgres` (postgres.js) for high-performance connection pooling.
- **Migrations Engine:** `drizzle-kit` (v0.30.0+) running via isolated migration files under `src/db/migrations`.
- **Cache & Key-Value Store:** Redis (`ioredis` v5.0.0+) for distributed rate-limiting, session management, and caching.

### Security, Validation & Infrastructure

- **Environment Validation:** `joi` running a pre-flight schema check on application bootstrap (forces instant crash if `.env` variables are invalid).
- **API Guarding & Headers:** `helmet` for secure HTTP headers.
- **Rate Limiting:** `@nestjs/throttler` backed by Redis to prevent scraping abuses on live endpoints.
- **Authentication:** `@nestjs/jwt` + Passport (`passport-jwt`) implementing secure HttpOnly cookie or Bearer authorization.
- **Request Validation:** NestJS global `ValidationPipe` leveraging `class-validator` and `class-transformer` for strict DTO checking.

### Testing Layer

- **Test Runner:** Vitest (v2.0.0+) for native, ultra-fast test execution.
- **E2E Validation:** `supertest` for mocking clean HTTP requests directly through the NestJS runtime pipeline.

---

## 3. Engineering Rules & Architecture Constraints

### Rule 1: Vertical Slice Architecture

All business capabilities must live inside isolated domain folders under `src/features/`. Each domain must contain its own self-contained parts:

- `*.module.ts` (The NestJS encapsulation)
- `*.controller.ts` (HTTP layer endpoints)
- `*.service.ts` (Pure business logic and coordination)
- `*.repository.ts` (Isolated database interaction)

### Rule 2: The Repository Pattern

Services **must never** import or invoke Drizzle ORM instance (`db`) directly. All data access must be delegated to a specific `*.repository.ts` file within that slice. This isolates database concerns and maintains long-term structural flexibility.

### Rule 3: Strict Domain Boundaries (No Circular Dependencies)

Feature slices cannot import internal files from other feature slices directly. Cross-feature communication must happen strictly via the exposed public Service of that module (e.g., `CountriesService` talking to `CitiesService`).

### Rule 4: Relational Database Integrity

Database schemas defined via Drizzle must strictly enforce relational data integrity using native PostgreSQL constraints (`Foreign Keys`, `Unique Constraints`). Cascading deletes (`ON DELETE CASCADE`) must be deliberately implemented on hierarchical relations (e.g., Country ➔ City).

### Rule 5: Fail-Fast Bootstrapping

If any environment variable required by the `Joi` validation matrix is missing or corrupt at startup, the system must immediately abort with a descriptive log. The application must never run in an unconfigured state.

---

## 4. Immediate Development Roadmap (The Diagonal Strategy)

Development will proceed step-by-step from the smallest core primitive to prove architecture stability before introducing external integrations:

1. **Step 1 (Workspace Initialization):** Configure the root Monorepo structure, set up global configs (`tsconfig.json`), and bootstrap the basic `backend/` skeleton.
2. **Step 2 (Database Layer):** Initialize `DbModule`, map the connection pool to Drizzle ORM, and configure the `Joi` configuration guard.
3. **Step 3 (First Vertical Slice - Countries):** Implement the `countries` feature folder. Create the PostgreSQL schema, generate the first migration with `drizzle-kit`, and write a simple `GET /countries` endpoint utilizing the Repository Pattern.
4. **Step 4 (Validation & Tests Verification):** Implement basic Vitest unit/E2E assertions against the `countries` endpoint to lock down system integrity.
