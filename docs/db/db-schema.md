# Database Schema Specification

**Database:** PostgreSQL  
**ORM:** Drizzle ORM  
**Source of truth:** `backend/src/db/schema.ts`  
**Last updated:** 2026-06-01

> This file is the living design reference for all 14 PostgreSQL tables.  
> Update it whenever a table, column, index, or FK relationship changes.

---

## Naming Conventions

| Rule | Detail |
|---|---|
| **Primary keys** | `uuid`, generated via `gen_random_uuid()` — except `countries` which uses `serial` integer |
| **Bilingual names** | `name` = Hebrew (NOT NULL, primary), `name_en` = English (nullable) |
| **Timestamps** | Every table has `created_at` and `updated_at` (both `timestamp NOT NULL, default now`) |
| **Enums** | Stored as PostgreSQL `pgEnum` in Drizzle (e.g. `event_status`) or `text` with enum constraint where noted |
| **JSONB** | Used for content blobs never queried row-by-row: `seo_content`, `faqs`, `metadata`, `sync_config`, etc. |
| **text[]** | Used for flat string arrays: `tags`, `months`, `supplier_countries`, `supplier_competitions` |
| **minPrice** | Four flat columns per event table: `min_price_amount`, `min_price_currency`, `min_price_sorting_ils`, `min_price_updated_at`. `sorting_ils` is sort-only and never displayed. |
| **Lazy Update** | `*_supplier_mappings` tables are lookup indexes from `(supplier_id, supplier_external_id)` → internal UUID. Enables batch updates without full-table scans. |
| **Public URLs** | Slugs are the canonical public identifiers. IDs never appear in URLs. Match URL: `ticketagent.co.il/[slug]/tickets` |
| **Match slugs** | Generated at ingest from team slugs + date; cup matches append round. See [football_events slug rules](#match-slug-generation). Immutable after first publish. |

---

## Geography Chain

```
venues.city_id → cities.id → cities.country_id → countries.id
                                                ↑
                              competitions.country_id
```

Teams have **no country or city columns**. They are located via `team_competitions` or via `football_events`.

Venue city and country labels are **not** stored on `venues`. Resolve them at read time:

```sql
venues → cities (name, name_en) → countries (name, name_en)
```

---

## Table Index

| # | Table | Role |
|---|---|---|
| 1 | [`countries`](#1-countries) | Geographic lookup — integer PK |
| 2 | [`cities`](#2-cities) | City pages + venue geography |
| 3 | [`competitions`](#3-competitions) | Leagues & cups |
| 4 | [`teams`](#4-teams) | Football clubs |
| 5 | [`venues`](#5-venues) | Stadiums & arenas |
| 6 | [`artists`](#6-artists) | Music performers |
| 7 | [`suppliers`](#7-suppliers) | External ticket providers |
| 8 | [`team_competitions`](#8-team_competitions) | Team ↔ competition junction |
| 9 | [`team_supplier_mappings`](#9-team_supplier_mappings) | Lazy Update: team ↔ supplier |
| 10 | [`venue_supplier_mappings`](#10-venue_supplier_mappings) | Lazy Update: venue ↔ supplier |
| 11 | [`football_events`](#11-football_events) | Match fixtures |
| 12 | [`football_event_supplier_mappings`](#12-football_event_supplier_mappings) | Lazy Update: match ↔ supplier |
| 13 | [`concert_events`](#13-concert_events) | Live music events |
| 14 | [`concert_event_supplier_mappings`](#14-concert_event_supplier_mappings) | Lazy Update: concert ↔ supplier |

---

## 1. `countries`

> **PK exception:** `serial` integer — small, stable lookup table (~200 rows). Integer FKs are more efficient here than UUIDs.

| Column | Type | Constraints |
|---|---|---|
| `id` | `serial` | PRIMARY KEY |
| `name` | `text` | NOT NULL (Hebrew) |
| `name_en` | `text` | nullable |
| `slug` | `text` | NOT NULL |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**Indexes**
- UNIQUE on `slug`

---

## 2. `cities`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY |
| `slug` | `text` | NOT NULL |
| `name` | `text` | NOT NULL (Hebrew) |
| `name_en` | `text` | nullable |
| `country_id` | `integer` | FK → `countries.id` |
| `is_popular` | `boolean` | default false |
| `image_url` | `text` | nullable |
| `seo_content` | `jsonb` | nullable — `[{ title, content, order? }]` |
| `faqs` | `jsonb` | nullable — `[{ question, answer, order? }]` |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**Indexes**
- UNIQUE on `slug`
- `country_id`
- `is_popular`

---

## 3. `competitions`

> Renamed from `leagues`. Covers both league and cup competitions.

**Hierarchy:** `parent_competition_id` links a child competition to its parent (e.g. domestic cup → domestic league, knockout phase → main tournament). Nullable when top-level. No cycles.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY |
| `name` | `text` | NOT NULL (Hebrew) |
| `name_en` | `text` | nullable |
| `slug` | `text` | NOT NULL |
| `country_id` | `integer` | FK → `countries.id` |
| `parent_competition_id` | `uuid` | nullable, FK → `competitions.id` — cup→league / phase hierarchy |
| `logo_url` | `text` | nullable |
| `image_url` | `text` | nullable |
| `banner_url` | `text` | nullable |
| `description` | `text` | nullable |
| `type` | `competition_type` | NOT NULL, pgEnum `'League' \| 'Cup'`, default `'League'` |
| `is_popular` | `boolean` | default false |
| `seo_content` | `jsonb` | nullable — `[{ title, content, order? }]` |
| `faqs` | `jsonb` | nullable — `[{ question, answer, order? }]` |
| `api_competition_id` | `integer` | UNIQUE, nullable (API-Football ID) |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**Indexes**
- UNIQUE on `slug`
- UNIQUE on `api_competition_id`
- `country_id`
- `parent_competition_id`
- `is_popular`

---

## 4. `teams`

> No country columns. No venue column. Teams are located via `team_competitions` or `football_events`.

**External IDs (Mongo → PostgreSQL)**

| Mongo field | PostgreSQL | Meaning |
|---|---|---|
| `teamId` | *(dropped)* | Legacy **internal** auto-increment (`max(teamId) + 1`). Not API-Football. Replaced by UUID `id`. |
| `apiFootballId` | `api_football_id` | API-Football team ID (`/teams?id=…`). Used for fixture sync and `findTeamByApiFootballId`. Nullable when the team has no API-Football row yet. |

Supplier-specific IDs live in `team_supplier_mappings`, not on `teams`.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY |
| `name` | `text` | NOT NULL (Hebrew) |
| `name_en` | `text` | nullable |
| `code` | `text` | NOT NULL — 3-letter shortcode e.g. `"LIV"` |
| `slug` | `text` | NOT NULL |
| `logo_url` | `text` | nullable |
| `shirt_image_url` | `text` | nullable |
| `image_url` | `text` | nullable |
| `banner_url` | `text` | nullable |
| `primary_color` | `text` | nullable — hex `#RRGGBB` |
| `secondary_color` | `text` | nullable — hex `#RRGGBB` |
| `api_football_id` | `integer` | UNIQUE, nullable |
| `is_popular` | `boolean` | default false |
| `seo_content` | `jsonb` | nullable — `[{ title, content, order? }]` |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**Indexes**
- UNIQUE on `slug`
- UNIQUE on `api_football_id`
- `name`
- `name_en`
- `is_popular`

---

## 5. `venues`

> City and country names come from `city_id` → `cities` → `countries`. Do not denormalize `city`, `city_en`, `country`, or `country_en` on this table.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY |
| `slug` | `text` | NOT NULL |
| `name` | `text` | NOT NULL (Hebrew) |
| `name_en` | `text` | nullable |
| `address` | `text` | nullable (Hebrew) |
| `address_en` | `text` | nullable |
| `capacity` | `integer` | nullable |
| `image_url` | `text` | nullable |
| `banner_url` | `text` | nullable |
| `map_url` | `text` | nullable — static venue thumbnail / overview image |
| `map_svg_path` | `text` | nullable — path or URL to the venue seating SVG source file |
| `map_sections_data` | `jsonb` | nullable — interactive section map config: `{ viewBox, blocks: [{ dataBlock, path, label, … }] }` |
| `api_football_id` | `integer` | UNIQUE, nullable — API-Football venue ID |
| `is_popular` | `boolean` | default false |
| `city_id` | `uuid` | FK → `cities.id`, nullable |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**Indexes**
- UNIQUE on `slug`
- UNIQUE on `api_football_id`
- `city_id`
- `is_popular`

---

## 6. `artists`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY |
| `name` | `text` | NOT NULL, UNIQUE (Hebrew) |
| `name_en` | `text` | nullable |
| `image_url` | `text` | NOT NULL |
| `banner_url` | `text` | nullable |
| `description` | `text` | nullable |
| `slug` | `text` | NOT NULL |
| `is_featured` | `boolean` | default false |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**Indexes**
- UNIQUE on `name`
- UNIQUE on `slug`
- `is_featured`

---

## 7. `suppliers`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY |
| `name` | `text` | NOT NULL, UNIQUE (Hebrew) |
| `name_en` | `text` | nullable |
| `slug` | `text` | NOT NULL |
| `type` | `text` | enum `'tickets'\|'hotels'\|'packages'\|'transport'\|'other'`, nullable |
| `origin` | `text` | enum `'israeli'\|'international'`, nullable |
| `description` | `text` | nullable |
| `image_url` | `text` | nullable |
| `website_url` | `text` | nullable |
| `affiliate_link_base` | `text` | nullable |
| `supplier_countries` | `text[]` | nullable — ISO country codes |
| `supplier_competitions` | `text[]` | nullable |
| `api_football_id` | `integer` | nullable |
| `internal_code` | `text` | nullable |
| `external_rating` | `jsonb` | nullable — `{ rating?, url?, provider?: 'trustpilot'\|'google' }` |
| `contact_info` | `jsonb` | nullable — `{ email?, phone?, supportUrl? }` |
| `sync_config` | `jsonb` | nullable — `{ enabled?, method?, schedule?, nextSyncAt? }` — schedule only; sync timestamps live in columns below |
| `is_active` | `boolean` | default true |
| `deactivated_at` | `timestamp` | nullable — set when `is_active` flips to false; cleared when reactivated |
| `last_successful_sync_at` | `timestamp` | nullable — last ingest run that completed without error for this supplier |
| `priority` | `integer` | default 0 |
| `metadata` | `jsonb` | nullable |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**Indexes**
- UNIQUE on `name`
- UNIQUE on `slug`
- `type`
- `is_active`
- `last_successful_sync_at`
- `priority` (desc)

**Invariants**
- `is_active = false` → `deactivated_at` NOT NULL. `is_active = true` → `deactivated_at` NULL.
- `last_successful_sync_at` updated only on successful batch/worker completion, not on partial failures.

---

## 8. `team_competitions`

> Junction table. Teams may exist without any row here (no mandatory competition link).  
> A team may have multiple rows across seasons (history) and across competitions (league + cup).  

| Column | Type | Constraints |
|---|---|---|
| `team_id` | `uuid` | NOT NULL, FK → `teams.id` ON DELETE CASCADE |
| `competition_id` | `uuid` | NOT NULL, FK → `competitions.id` ON DELETE CASCADE |
| `season` | `text` | NOT NULL — e.g. `"2024/2025"` |
| `status` | `team_competition_status` | NOT NULL, pgEnum `'active'\|'eliminated'\|'relegated'\|'withdrawn'`, default `'active'` |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**PK:** composite `(team_id, competition_id, season)`

**Indexes**
- `competition_id`
- `(competition_id, season)` — for "all teams in a competition this season"
- `(team_id, season)`

---

## 9. `team_supplier_mappings`

> Lazy Update lookup index: `(supplier_id, supplier_external_id)` → `teams.id`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY |
| `team_id` | `uuid` | NOT NULL, FK → `teams.id` ON DELETE CASCADE |
| `supplier_id` | `uuid` | NOT NULL, FK → `suppliers.id` ON DELETE CASCADE |
| `supplier_team_name` | `text` | nullable — supplier's display name for this team |
| `supplier_external_id` | `text` | NOT NULL |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**Indexes**
- Compound `(supplier_id, supplier_external_id)`
- `team_id`

---

## 10. `venue_supplier_mappings`

> Lazy Update lookup index: `(supplier_id, supplier_external_id)` → `venues.id`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY |
| `venue_id` | `uuid` | NOT NULL, FK → `venues.id` ON DELETE CASCADE |
| `supplier_id` | `uuid` | NOT NULL, FK → `suppliers.id` ON DELETE CASCADE |
| `supplier_venue_name` | `text` | nullable — supplier's display name for this venue |
| `supplier_external_id` | `text` | NOT NULL |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**Indexes**
- Compound `(supplier_id, supplier_external_id)`
- `venue_id`

---

## 11. `football_events`

### TBD / team display rules

Carried forward from Mongo `FootballEvent` (`hasTbdTeam`, `homeTeamName`, `awayTeamName`, embedded `homeTeam` / `awayTeam`).

| `has_tbd_team` | Side | DB columns | UI display source |
|---|---|---|---|
| `false` | home | `home_team_id` NOT NULL, `home_team_name` NULL | `teams.name` via JOIN on `home_team_id` |
| `false` | away | `away_team_id` NOT NULL, `away_team_name` NULL | `teams.name` via JOIN on `away_team_id` |
| `true` | home (known club) | `home_team_id` set, `home_team_name` NULL | `teams.name` via JOIN |
| `true` | home (placeholder) | `home_team_id` NULL, `home_team_name` NOT NULL | `home_team_name` (e.g. `"TBD"`, `"Winner Group A"`) |
| `true` | away | same pattern | `away_team_id` / `away_team_name` |

**Read-time rule (per side):** `display_name = COALESCE(teams.name, home_team_name)` (or `away_*`). Never store the same label in both FK and `*_team_name`.

**Write-time invariants**

1. `has_tbd_team = false` → both `home_team_id` and `away_team_id` required; both `*_team_name` must be NULL.
2. `has_tbd_team = true` → at least one of `home_team_name`, `away_team_name` non-null; each side uses FK **or** fallback name, not both.
3. A side with a resolved club always uses `*_team_id` only (placeholder name cleared when FK is set).

Frontend already follows this: `homeTeam?.name || homeTeamName` (see fixture offer pages).

### Match slug generation

Public URL: `ticketagent.co.il/{slug}/tickets`. Slug is set once at create and **never changed** (SEO + supplier deep links). Reschedules create a new row (see `rescheduled_from`); the old slug stays on the superseded row.

**Team segment source (per side)**

| Condition | Use |
|---|---|
| `*_team_id` set | `teams.slug` |
| TBD placeholder | slugify `*_team_name` (English preferred) |

**Slugify:** lowercase → replace non `[a-z0-9]` with `-` → trim leading/trailing `-`.

**Date segment:** `YYYY-MM-DD` from `football_events.date` (UTC calendar date).

**League** (`competitions.type = 'League'`)

```
{home_slug}-vs-{away_slug}-{date}
```

Example: `everton-vs-newcastle-2026-04-12`

**Cup** (`competitions.type = 'Cup'`)

Same teams can meet multiple times (group + knockout). Append slugified `round`:

```
{home_slug}-vs-{away_slug}-{date}-{round_slug}
```

Example: `brazil-vs-france-2026-07-06-final`, `england-vs-slovenia-2026-06-25-group-stage`

`round_slug` = slugify(`round`); if `round` is NULL, fall back to slugify(`round_number` as text) or `'tbd'`.

**Collisions:** if slug exists, append `-2`, `-3`, … before insert. Prefer resolving via `api_football_external_id` dedup first.

**TBD sides:** slugify placeholder text (`tbd`, `winner-group-a`, …). Slug may change when a TBD side resolves to a real team **only before first publish**; after any public URL exists, create a new event row instead of mutating slug.

### Status & rescheduling

| `status` | Meaning |
|---|---|
| `scheduled` | Default — fixture is (still) planned |
| `postponed` | Not playing on `date`; may be rescheduled |
| `cancelled` | Will not be played; no replacement row expected |
| `completed` | Match finished (optional filter for archive/history) |

**Reschedule flow**

1. Original row: `status = 'postponed'`, `date` unchanged (historical scheduled date) or frozen at last known schedule — pick one convention in ingest; **do not** change `slug`.
2. New row: new `date`, new `slug` (date segment changes), `rescheduled_from` → original.id, `status = 'scheduled'`.
3. Supplier mappings on the original row are copied/rewired to the new row as part of ingest.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY |
| `date` | `timestamp` | NOT NULL |
| `status` | `event_status` | NOT NULL, enum `'scheduled'\|'postponed'\|'cancelled'\|'completed'`, default `'scheduled'` |
| `rescheduled_from` | `uuid` | nullable, FK → `football_events.id` — points to superseded row when this event replaces a postponed fixture |
| `competition_id` | `uuid` | NOT NULL, FK → `competitions.id` |
| `home_team_id` | `uuid` | nullable, FK → `teams.id` — required when `has_tbd_team = false` |
| `away_team_id` | `uuid` | nullable, FK → `teams.id` — required when `has_tbd_team = false` |
| `venue_id` | `uuid` | NOT NULL, FK → `venues.id` |
| `home_team_name` | `text` | nullable — placeholder only when `home_team_id` IS NULL and `has_tbd_team = true` |
| `away_team_name` | `text` | nullable — placeholder only when `away_team_id` IS NULL and `has_tbd_team = true` |
| `has_tbd_team` | `boolean` | default false |
| `round` | `text` | nullable |
| `slug` | `text` | NOT NULL |
| `round_number` | `integer` | nullable |
| `tags` | `text[]` | nullable |
| `is_hot` | `boolean` | default false |
| `api_football_external_id` | `integer` | UNIQUE, nullable |
| `min_price_amount` | `numeric(10,2)` | nullable |
| `min_price_currency` | `text` | nullable, enum `'EUR'\|'USD'\|'ILS'\|'GBP'` |
| `min_price_sorting_ils` | `numeric(10,2)` | nullable — **sort-only, never displayed** |
| `min_price_updated_at` | `timestamp` | nullable |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**Indexes**
- UNIQUE on `slug`
- UNIQUE on `api_football_external_id`
- `rescheduled_from`
- `(status, date)`
- `(competition_id, date)`
- `(home_team_id, date)`
- `(away_team_id, date)`
- `(venue_id, date)`
- `(is_hot, date)`
- `min_price_sorting_ils`

---

## 12. `football_event_supplier_mappings`

> Lazy Update lookup index: `(supplier_id, supplier_external_id)` → `football_events.id`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY |
| `football_event_id` | `uuid` | NOT NULL, FK → `football_events.id` ON DELETE CASCADE |
| `supplier_id` | `uuid` | NOT NULL, FK → `suppliers.id` |
| `supplier_external_id` | `text` | NOT NULL |
| `metadata` | `jsonb` | nullable |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**Indexes**
- Compound `(supplier_id, supplier_external_id)`
- `football_event_id`

---

## 13. `concert_events`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY |
| `slug` | `text` | NOT NULL |
| `artist_id` | `uuid` | NOT NULL, FK → `artists.id` |
| `tour_name` | `text` | nullable |
| `date` | `timestamp` | NOT NULL |
| `venue_id` | `uuid` | NOT NULL, FK → `venues.id` |
| `city_id` | `uuid` | NOT NULL, FK → `cities.id` |
| `status` | `event_status` | NOT NULL, enum `'scheduled'\|'postponed'\|'cancelled'\|'completed'`, default `'scheduled'` — shared with `football_events` |
| `rescheduled_from` | `uuid` | nullable, FK → `concert_events.id` — same reschedule chain as `football_events` |
| `is_hot` | `boolean` | default false |
| `tags` | `text[]` | nullable |
| `min_price_amount` | `numeric(10,2)` | nullable |
| `min_price_currency` | `text` | nullable, enum `'EUR'\|'USD'\|'ILS'\|'GBP'` |
| `min_price_sorting_ils` | `numeric(10,2)` | nullable — **sort-only, never displayed** |
| `min_price_updated_at` | `timestamp` | nullable |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**Indexes**
- UNIQUE on `slug`
- `artist_id`
- `rescheduled_from`
- `(city_id, date)`
- `(venue_id, date)`
- `(status, date)`
- `(is_hot, date)`
- `min_price_sorting_ils`

---

## 14. `concert_event_supplier_mappings`

> Lazy Update lookup index: `(supplier_id, supplier_external_id)` → `concert_events.id`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY |
| `concert_event_id` | `uuid` | NOT NULL, FK → `concert_events.id` ON DELETE CASCADE |
| `supplier_id` | `uuid` | NOT NULL, FK → `suppliers.id` |
| `supplier_external_id` | `text` | NOT NULL |
| `metadata` | `jsonb` | nullable |
| `created_at` | `timestamp` | NOT NULL, default now |
| `updated_at` | `timestamp` | NOT NULL, default now |

**Indexes**
- Compound `(supplier_id, supplier_external_id)`
- `concert_event_id`

---

## Infrastructure

### PostgreSQL hosting (resolved)

**Decision: [Render](https://render.com) managed PostgreSQL**, paired with the existing API deploy in `backend/render.yaml`.

| Concern | Choice |
|---|---|
| Compute | Render Web Service (`ticket-agent-backend`) |
| Database | Render PostgreSQL (same account/region as the API) |
| Driver | `postgres` (postgres.js) — already in `backend/package.json` |
| ORM | Drizzle `drizzle-orm/postgres-js` |
| Env | `DATABASE_URL` — Render internal connection string in production; local Postgres URL in dev |
| Pooling | `postgres` client `max: 5–10` per instance (Render free/starter tiers have low connection limits; avoid one connection per request without a cap) |

Neon/Supabase are out of scope unless we move off Render; they would require revisiting driver/pooler setup.

---

## Open Questions

| # | Question | Status |
|---|---|---|
| 1 | **Lazy Update semantics** — does "lazy" mean update-on-user-request, update-on-price-check, or batched nightly? Affects whether `*_supplier_mappings` needs a `last_synced_at` column. | ✅ Default (unblocked): **batched deferred writes** on ingest (see `CONTEXT.md` Lazy Update Strategy). Map `(supplier_id, supplier_external_id)` → internal UUID, apply field/price updates in batch workers—not per HTTP request. **No `last_synced_at` in v1**; add only if we need per-mapping observability. |
| 2 | **Search strategy** — `ILIKE` plain substring, `pg_trgm` trigram index, or `tsvector` full-text? Affects whether `pg_trgm` extension needs to be enabled on the PostgreSQL host. | ✅ Default (unblocked): **`ILIKE` on `name`, `name_en`, `slug`** with B-tree indexes on those columns for v1 (no extension on Render). **`pg_trgm`** as a later optimization if substring search is too slow. |
| 3 | **PostgreSQL hosting** — Render, Neon, Supabase, or self-hosted? Affects connection pooling config in the Drizzle client. | ✅ **Resolved: Render PostgreSQL** (see [Infrastructure](#infrastructure)). |
