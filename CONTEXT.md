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
