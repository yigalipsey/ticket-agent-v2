---
name: to-prd
description: Turn the current conversation and codebase understanding into a PRD file under docs/prd/. Use after /grill-with-docs and before planning SPEC.md.
disable-model-invocation: true
---

# To PRD

You are a senior engineer and product-minded technical writer.

Your job: **take what already exists in context** (from the grilling session + codebase) and turn it into a clear, compact PRD that future-you and agents can rely on.

Do **not** interview the user. Do **not** ask questions.  
If something is missing, record it as an **Open Question** instead of blocking.

If no proper `/grill-with-docs` session has run, still create a PRD, but mark missing areas clearly as **Open Questions** and treat the document as incomplete.

---

## Process

1. **Gather context**
   - Use the current conversation (especially `/grill-with-docs` summary).
   - Explore the repo if needed:
     - Read `CONTEXT.md` or any glossary.
     - Scan `docs/adr/` for relevant decisions.
   - Use the project’s existing vocabulary consistently and **match terms exactly as defined in the glossary**.

2. **Sketch modules (mentally)**
   - From the context, infer the main modules / areas that will change  
     (services, models, adapters, jobs, UI entry points, etc.).
   - Note deep modules that should be stable, reusable, and well‑tested.
   - If you are unsure about a module, note it as an Open Question.

3. **Write the PRD**
   - Ensure the `docs/prd/` directory exists. If it does not, create it.
   - Create a new file under `docs/prd/`:
     - `docs/prd/<feature-slug>.prd.md`
     - `<feature-slug>` = short, lowercase, hyphenated name (e.g. `supplier-sync`, `auth-refactor`).
   - Fill it using the template below.
   - Keep it concise but complete – enough for `/plan-to-spec` to break into slices.
   - Treat this PRD as the single source of truth for later planning and execution skills.

---

## PRD Template

```md
# PRD – <Feature Name>

**Status:** Draft  
**Source:** Grilling session – <short description>  
**Date:** <yyyy-mm-dd>

---

## Problem Statement

The problem the user/system is facing, from the user/business perspective.  
Why this is worth solving now.

---

## Solution

The intended behavior and outcome, from the user/business perspective.  
Describe what success looks like, not how to implement it.

---

## User Stories

You MUST cover all of the following categories — you are FORBIDDEN from listing only happy paths.  
Use existing project terminology consistently.

**[Happy Path]** – Main success flows

1. As a <actor>, I want <capability>, so that <benefit>.
2. ...

**[Error Handling]** – Validation and explicit rejections

3. As a <actor>, when <invalid condition>, the system must <behavior>.

**[Failure Modes]** – External/system failures

4. When <external system/provider> is down, the system must <fallback/behavior>.

**[Rollback / Recovery]** – Partial success, compensation, retries

5. When a flow fails after side effects, we must <rollback / mark state / notify>.

**[Maintenance / Admin]** – Operational flows

6. As an operator/admin, I need <capability> in order to maintain/monitor this feature.

Add more stories as needed until the feature’s behavior feels fully covered across all categories.

---

## Implementation Decisions

Technical decisions already made during the grilling session.  
Focus on responsibilities and contracts, not file paths.

Include, where relevant:

- **Non‑negotiable Architectural Rules (copy verbatim from Grill):**  
  Explicitly list every hard rule agreed in the Grill session (for example, exact type locations such as `src/types/`, isolation rules, runtime loader rules like `import type`, and boundaries between layers).  
  Do NOT use vague prose like “keep a clean architecture” – copy the concrete constraints as they were defined.
- Modules that will be built or modified, and what each owns.
- Data flow for the main scenario (end‑to‑end, conceptual).
- Important schema / API / type contracts.
- Cross-cutting concerns (validation, logging, retries, caching, etc.).
- References to relevant ADRs instead of duplicating their full content.

> Exception: If a prototype produced a schema/state-machine/type shape
> that encodes a decision better than prose, inline the minimal snippet here
> and note that it came from a prototype.

---

## Testing Decisions

Define actionable testing guidance, not philosophical statements:

- Which flows MUST have automated tests (name the flows explicitly using the same terminology as in User Stories).
- What counts as a passing test from the outside (observable behavior only, not internal implementation details).
- Specific failure modes and edge conditions that the test suite MUST trigger (for example, provider timeouts, invalid payloads, partial updates).
- Any similar existing tests in the codebase (prior art) that should be mirrored for consistency.

---

## Out of Scope

What is explicitly **not** being done in this feature.  
Be concrete (e.g. “No performance optimizations for X yet”, “No UI redesign”, “No support for legacy provider Y”).

---

## Open Questions

Unresolved questions that must be decided before detailed SPEC planning or implementation.

- [ ] <Open question 1>
- [ ] <Open question 2>

---

## Further Notes

Any additional context: risks, future extensions, links to ADRs, related features.
```

---

## What NOT to Do

- Do **not** ask the user follow‑up questions in this skill.
- Do **not** include specific file paths in the decisions (they go stale quickly).
- Do **not** duplicate the entire grilling conversation – **distill** it.
- Do **not** turn this into a task list – this is **input** for SPEC/vertical slices, not SPEC itself.
- Do **not** invent new terminology that conflicts with `CONTEXT.md` – reuse existing terms or flag inconsistencies as Open Questions.
