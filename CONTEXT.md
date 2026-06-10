# Domain Glossary (CONTEXT)

This file defines the canonical domain vocabulary and relationships for the Ticket Agent project.

## Football Core

### Team
A football club represented in the ticketing system.
*   Each team has a Hebrew name (primary) and an optional English name.
*   Each team has a unique, immutable URL slug used as its public identifier (IDs are never exposed in public URLs).
*   Each team has a strict 3-letter alphabetical shortcode (e.g., `"LIV"` for Liverpool), which is stored in uppercase and enforced at both the API and database levels.
*   Each team can be associated with external identifier mapping fields (specifically, `api_football_id` from API-Football) to facilitate automated synchronization of fixtures.
*   Teams do not directly store country or city fields; their geographic association is resolved dynamically via their competitions or scheduled events.

### Competition
A **competition** is a football league or cup tournament (formerly called "league" in Mongo). Examples: Premier League, FA Cup, Champions League.

- **Canonical table:** `competitions`
- **Public identifier:** `slug` (never expose UUID in URLs)
- **Geography:** every competition belongs to exactly one `country` via `country_id`
- **Hierarchy:** optional `parent_competition_id` links a child to its parent (e.g. domestic cup → domestic league, knockout phase → main tournament). Nullable at top level. No cycles.
- **Type:** `League` or `Cup` — stored as PostgreSQL `competition_type` enum via Drizzle `pgEnum`
- **External ID:** `api_competition_id` — nullable, unique API-Football league/cup ID for ingest sync

### Venue
A stadium or concert hall where events (football matches or concerts) take place.
- **Canonical table:** `venues`
- **Public identifier:** `slug` (never expose UUID in URLs)
- **Geography:** every venue belongs to exactly one `city` via `city_id`
- **Capacity:** holds capacity metadata, geographical coordinates (latitude/longitude), and visual assets (image, banner, static map image).
- **External ID:** `api_football_id` — nullable, unique API-Football venue ID for fixture synchronization.


### Competition Type

| Value | Meaning |
|---|---|
| `League` | Round-robin or season-long division (default) |
| `Cup` | Knockout or multi-phase tournament; affects match slug generation (appends round segment) |

## Geography Chain

```
venues.city_id → cities.id → cities.country_id → countries.id
                                                ↑
                              competitions.country_id
```

Teams have no direct country column; location is inferred via `team_competitions` or `football_events`.

## Lazy Update Strategy

Supplier mapping tables (`*_supplier_mappings`) are lookup indexes from `(supplier_id, supplier_external_id)` → internal UUID. Updates are applied in **batched deferred writes** during ingest — not per HTTP request. No `last_synced_at` in v1.
