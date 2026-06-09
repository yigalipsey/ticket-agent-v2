# Domain Glossary

## Competition

A **competition** is a football league or cup tournament (formerly called "league" in Mongo). Examples: Premier League, FA Cup, Champions League.

- **Canonical table:** `competitions`
- **Public identifier:** `slug` (never expose UUID in URLs)
- **Geography:** every competition belongs to exactly one `country` via `country_id`
- **Hierarchy:** optional `parent_competition_id` links a child to its parent (e.g. domestic cup → domestic league, knockout phase → main tournament). Nullable at top level. No cycles.
- **Type:** `League` or `Cup` — stored as PostgreSQL `competition_type` enum via Drizzle `pgEnum`
- **External ID:** `api_competition_id` — nullable, unique API-Football league/cup ID for ingest sync

## Competition Type

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
