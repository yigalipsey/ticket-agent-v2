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

### Team Competition
A junction representing a team's participation in a competition for a specific season.
*   **Canonical table:** `team_competitions`
*   **Composite Primary Key:** `(team_id, competition_id, season)`
*   **Status:** Marks the team's standing in the competition. Stored as `team_competition_status` enum with values:
    *   `active`: The team is currently participating and active in the competition.
    *   `eliminated`: The team has been knocked out of the tournament (e.g., cup).
    *   `relegated`: The team has been relegated at the end of the season.
    *   `withdrawn`: The team withdrew from the competition.

### Football Event
A scheduled football match between two teams (which may be specific resolved teams or placeholder TBD slots like "Winner of Match A") at a specific venue, belonging to a competition.
*   **Canonical table:** `football_events`
*   **Public Identifier:** `event_number` (a unique public URL ID, e.g., starts at 20000). The `slug` is used for SEO-friendly URLs.
*   **Teams**: Can be fully resolved clubs or placeholder TBD name labels (at least one placeholder must be set if it is flagged as a TBD match).
*   **Venue**: Always linked to a venue. If the venue is unknown, it references a designated placeholder TBD venue.
*   **External Mappings**: Synced using IDs from canonical fixture providers (API-Football) and linked to ticket supplier offerings via mappings.


## Suppliers

### Supplier
A **Supplier** represents an external provider or secondary marketplace (e.g., Ticombo, SportsEvents365) that provides inventory (such as tickets or packages) to our platform.
*   **Canonical table:** `suppliers`
*   **Public identifier:** `slug` (never expose UUID in URLs)
*   **Integration Key:** A Supplier is uniquely identified in code by an immutable `internal_code` (e.g., `TICOMBO_API`), which acts as the key for the backend factory pattern to route to their specific API integration logic.
*   **Flexible Schema Pattern:** Fields like `type` ('tickets', 'hotels', etc.) and `origin` ('israeli', 'international') are explicitly stored as simple `text` columns in PostgreSQL to maintain schema flexibility.
*   **Strict One-Way Data Flow:** The database schema (`suppliers.schema.ts`) is the absolute single source of truth. Union types (e.g., `SupplierType`) are defined directly alongside the schema and injected via Drizzle generics (`text('type').$type<SupplierType>()`). `suppliers.types.ts` must remain clean, exclusively using Drizzle's `$inferSelect` and `$inferInsert` to derive the domain types, ensuring types always flow downstream: Schema -> Types -> Services/Repositories.
*   **Soft Deactivation:** Suppliers are never hard-deleted. They use `is_active` and `deactivated_at` fields to support soft-deactivation, preserving historical mapping and sync integrity while signaling to ingest workers to skip them.

## Geography Chain

```
venues.city_id → cities.id → cities.country_id → countries.id
                                                ↑
                              competitions.country_id
```

Teams have no direct country column; location is inferred via `team_competitions` or `football_events`.

## Lazy Update Strategy

Supplier mapping tables (`*_supplier_mappings`) are lookup indexes from `(supplier_id, supplier_external_id)` → internal UUID. Updates are applied in **batched deferred writes** during ingest — not per HTTP request. No `last_synced_at` in v1.

## Mapping Verification and Moderation

Supplier mappings (`*_supplier_mappings`) follow a strict auto-capture with moderation gate model:
- **Auto-Capture**: The background ingest worker automatically creates new mappings when it discovers unknown `supplier_external_id`s, capturing the raw `supplier_team_name` and setting `is_verified: false`.
- **Moderation Gate**: Any tickets or events associated with an `is_verified: false` mapping are completely blocked/ignored during sync until an admin manually flips it to `is_verified: true`. This ensures absolute data integrity so tickets are never routed to the wrong internal team.
