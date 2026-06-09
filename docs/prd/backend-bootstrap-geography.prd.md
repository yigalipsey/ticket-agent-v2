# PRD – Backend Bootstrap + Geography Slices

**Status:** Draft  
**Source:** Grilling session — monorepo init, NestJS + Drizzle, countries + cities vertical slices  
**Date:** 2026-06-04

---

## Problem Statement

The `ticket-agent-v2` project has no running backend. The `backend/` and `frontend/` workspace folders are empty. Before any domain feature (events, suppliers, auth) can be built, the foundational infrastructure must be in place and proven stable:

- A working NestJS application that boots, validates its environment, and listens for HTTP requests.
- A connected PostgreSQL database managed by Drizzle ORM with a reproducible migration workflow.
- At least one complete vertical slice that proves the full request-to-database pipeline works end-to-end.

Without this foundation, every subsequent feature is built on unverified assumptions. The risk of architectural debt grows exponentially if the skeleton is skipped or rushed.

---

## Solution

Bootstrap the `backend/` workspace as a properly configured NestJS v11 application with:

1. **Fail-fast environment validation** via Joi at bootstrap — the server refuses to start if any required variable is absent or malformed.
2. **A `DbModule`** that initialises a `postgres.js` connection pool and exposes a Drizzle ORM instance via NestJS dependency injection.
3. **Two complete vertical slices** — `countries` and `cities` — each with its own schema, types, repository, service, controller, and DTOs.
4. **A single combined database migration** (`0001_init_geography.sql`) that creates both tables with all constraints and indexes as specified in `docs/db/db-schema.md`.
5. **E2E tests** that boot the full application and assert correct HTTP behaviour for each endpoint.

Success is defined as: the NestJS server starts, migrations run cleanly, `GET /countries` returns an empty array, and `POST /countries` creates and returns a valid Country row — all provable via automated E2E tests.

---

## User Stories

**[Happy Path]**

1. As a **developer**, I want the NestJS server to boot and print a ready message, so that I can confirm the application and database connection are healthy.
2. As an **API consumer**, I want `GET /countries` to return a list of all Countries (empty array when none exist), so that I can display available geography options.
3. As an **API consumer**, I want `GET /countries/:slug` to return a single Country by its Slug, so that I can fetch a specific geography record.
4. As an **API consumer**, I want `POST /countries` with a valid body to create and return a new Country, so that geography data can be seeded into the system.
5. As an **API consumer**, I want `GET /cities` to return a list of all Cities, so that I can display city options.
6. As an **API consumer**, I want `GET /cities/:slug` to return a single City by Slug, so that I can fetch a specific City record including its `country_id`.
7. As an **API consumer**, I want `POST /cities` with a valid body (including a valid `country_id`) to create and return a new City.

**[Error Handling]**

8. As an **API consumer**, when I call `GET /countries/:slug` with a Slug that does not exist, the system must return `404 Not Found`.
9. As an **API consumer**, when I call `GET /cities/:slug` with a Slug that does not exist, the system must return `404 Not Found`.
10. As an **API consumer**, when I call `POST /countries` or `POST /cities` with a missing required field or wrong type, the system must return `400 Bad Request` with a structured validation error (NestJS `ValidationPipe` + `class-validator`).
11. As an **API consumer**, when I call `POST /cities` with a `country_id` that does not reference a real Country, the system must return `400 Bad Request` — not a `500 Internal Server Error`.
12. As an **API consumer**, when I attempt to create a Country or City with a `slug` that already exists, the system must return `409 Conflict`.

**[Failure Modes]**

13. When the PostgreSQL server is unreachable at startup, the NestJS bootstrap must fail immediately with a descriptive error log — the process must not start in a degraded state.
14. When a required environment variable (`DATABASE_URL`, `PORT`, `NODE_ENV`, `JWT_SECRET`) is missing or empty, Joi validation must abort the bootstrap with a clear, human-readable error message identifying the missing variable.

**[Rollback / Recovery]**

15. When a `POST /countries` or `POST /cities` request fails mid-insert (e.g. a DB constraint fires), the database must remain in a consistent state — no partial rows.

**[Maintenance / Admin]**

16. As a **developer**, I want to run `drizzle-kit generate` and `drizzle-kit migrate` to produce and apply repeatable SQL migration files, so that schema changes are tracked in version control and can be replayed on any environment.
17. As a **developer**, I want to run the E2E test suite against a real test database and get a passing result, so that I can confirm the full pipeline works before merging.

---

## Implementation Decisions

### Non-Negotiable Architectural Rules

These rules were agreed in the grilling session and must not be violated by any agent or developer working on this feature:

1. **Vertical Slice Architecture:** All business logic lives in isolated domain folders under `src/features/`. Each slice owns its module, controller, service, and repository. No cross-slice internal imports.
2. **Repository Pattern:** Services never import the Drizzle `db` instance directly. All DB access is delegated to the slice's repository.
3. **Co-located Schema:** Each slice defines its own Drizzle table schema file. `src/db/schema.ts` is a barrel re-export used only by drizzle-kit. No single god schema file.
4. **Co-located Types:** Named TypeScript types (aliases of `$inferSelect` / `$inferInsert`) live in `{feature}/types.ts`. They are re-exported from `src/types/index.ts`. **No inline type definitions** inside service or repository files.
5. **ESM Runtime Safety:** All imports of external types use `import type` syntax to prevent `ERR_MODULE_NOT_FOUND` in the Node.js ESM loader.
6. **FK Error Handling:** Postgres FK violation error code `23503` is caught at the repository layer and re-thrown as NestJS `BadRequestException`. No cross-service pre-validation round-trips for FK existence checks.
7. **Fail-Fast Bootstrap:** Joi validates `DATABASE_URL`, `PORT`, `NODE_ENV`, and `JWT_SECRET` on startup. The process aborts immediately if any are missing or malformed.
8. **Slug as Public Identifier:** Slugs are the canonical public identifiers. IDs never appear in URLs. `GET /:slug` routes resolve by Slug only.

### Modules and Ownership

| Module | Owns |
|---|---|
| **Config Module** | Joi validation schema, typed config service — exposes validated env values to the rest of the app |
| **DbModule** | Postgres.js connection pool, Drizzle ORM instance, injection token (`DRIZZLE`) — exported for use by all repositories |
| **CountriesModule** | `countries` schema, Country types, CountriesRepository, CountriesService, CountriesController, Create DTO |
| **CitiesModule** | `cities` schema, City types, CitiesRepository, CitiesService, CitiesController, Create DTO |
| **AppModule** | Root module — imports Config, Db, Countries, Cities; registers global `ValidationPipe` and `helmet` |

### Data Flow (End-to-End)

```
HTTP Request
  → NestJS Controller (DTO validation via ValidationPipe)
    → Service (business logic, NotFoundException for 404s)
      → Repository (Drizzle query, catches Postgres error codes)
        → PostgreSQL
```

### Schema Contracts

**`countries` table** — integer serial PK (unique exception in the schema), bilingual name, unique slug, timestamps.  
**`cities` table** — UUID PK, bilingual name, unique slug, `country_id` integer FK → `countries.id` (ON DELETE CASCADE), `is_popular` boolean, `image_url`, `seo_content` JSONB, `faqs` JSONB, timestamps.

Full column definitions are the authoritative source in `docs/db/db-schema.md` sections 1 and 2.

### Migration

Single combined migration file: `0001_init_geography.sql`. Covers both `countries` and `cities` tables in one atomic transaction. Generated by drizzle-kit from the barrel schema file.

### Cross-Cutting Concerns

- **Global `ValidationPipe`**: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — registered in `AppModule` bootstrap.
- **`helmet`**: Applied as global middleware on every request.
- **Unique slug conflict**: Caught via Postgres unique violation error code `23505` at the repository layer, re-thrown as `ConflictException`.
- **Environment validation**: Centralised in the Config Module using Joi. No other module reads `process.env` directly.

### Relevant ADRs

- `docs/adr/0001-defer-redis-bootstrap.md` — Redis and `@nestjs/throttler` are intentionally absent from v1. See ADR for full rationale.

---

## Testing Decisions

**Scope:** E2E tests only. No unit tests in this phase. Test runner: Vitest. HTTP client: `supertest` through the full NestJS application pipeline against a real test PostgreSQL database.

**Flows that MUST have automated E2E tests:**

| Flow | Expected behaviour |
|---|---|
| `GET /countries` — empty database | `200` with `[]` |
| `POST /countries` — valid body | `201` with created Country object |
| `GET /countries/:slug` — existing slug | `200` with matching Country object |
| `GET /countries/:slug` — unknown slug | `404` |
| `POST /countries` — missing required field | `400` with validation error |
| `POST /countries` — duplicate slug | `409` |
| `GET /cities` — empty database | `200` with `[]` |
| `POST /cities` — valid body with valid `country_id` | `201` with created City object |
| `GET /cities/:slug` — existing slug | `200` with matching City object |
| `GET /cities/:slug` — unknown slug | `404` |
| `POST /cities` — invalid `country_id` (no matching Country) | `400` |
| `POST /cities` — missing required field | `400` with validation error |

**What counts as passing:** Each test makes a real HTTP request to the test application, receives the correct status code, and (for success cases) validates the shape of the response body matches the Country or City type contract.

**Edge conditions the suite MUST trigger:**
- FK violation (`cities.country_id` → non-existent Country)
- Unique constraint violation (duplicate `slug` on both tables)
- Missing required fields in both DTOs

---

## Out of Scope

- `PATCH` and `DELETE` endpoints for Countries and Cities — read + create only in this phase.
- Frontend (`frontend/` workspace) — empty placeholder, not bootstrapped.
- Redis, `ioredis`, `@nestjs/throttler` — explicitly deferred (see ADR 0001).
- Unit tests — deferred until business logic grows beyond simple CRUD.
- Authentication guards on geography endpoints — JWT infrastructure is wired at bootstrap but no routes are guarded in this phase.
- Any domain beyond `countries` and `cities` (competitions, teams, venues, events, suppliers).
- Search / filtering on list endpoints — `GET /countries` and `GET /cities` return all rows with no query params.
- Pagination — deferred to a later phase.
- `pg_trgm` or full-text search extensions — `ILIKE` deferred until needed (see `docs/db/db-schema.md` Open Questions).

---

## Open Questions

None. All decisions were resolved in the grilling session.

---

## Further Notes

- The `countries` table uses a `serial` integer PK — the only table in the entire schema that does not use UUID. This is intentional: small, stable lookup table (~200 rows); integer FKs from `cities.country_id` and `competitions.country_id` are more efficient than UUIDs here.
- The Bilingual Name convention (`name` = Hebrew NOT NULL, `name_en` = English nullable) applies to both tables. DTOs must reflect this: `name` required, `name_en` optional.
- Drizzle ORM connection pooling: `postgres.js` `max` should be capped at `5–10` connections to respect Render free/starter tier limits. Do not allow unbounded connections.
- Once this PRD is implemented and E2E tests pass, the next logical slice is `competitions` (depends on `countries.id`) followed by `venues` (depends on `cities.id`).
