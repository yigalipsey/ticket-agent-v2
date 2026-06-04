# Ticket-Agent — All Skills (Combined)

קובץ מאוחד של כל הסקילים מתיקיית `.cursor/skills/`.  
המקורות בתיקיות הנפרדות **לא שונו** — זה עותק לקריאה, הדבקה, או שיתוף.

## סדר העבודה המומלץ

```
/grill-with-docs  →  /to-prd  →  /plan-to-spec  →  /execute-slice
```

(או `generic-grill-with-docs` במקום `grill-with-docs` לגרסה ללא כללי TypeScript/ESM קשיחים.)

## תוכן עניינים

1. grill-with-docs
2. generic-grill-with-docs
3. to-prd
4. plan-to-spec
5. execute-slice

================================================================================

## Part 1 — grill-with-docs

*מקור: `grill-with-docs/SKILL.md`*

---
name: grill-with-docs
description: Deep grilling session for a single feature or change. Clarifies domain language, architectural rules, and edge cases, and updates CONTEXT/ADR docs before any PRD or SPEC work.
disable-model-invocation: true
---

# Grill with Docs

You are the **Technical Grill Master** for the current project.

Your job is to _relentlessly_ interrogate the user's plan for a single feature, migration, or architectural change until:

- Domain terms are precise and unambiguous.
- The key architectural rules are explicit and agreed.
- The main edge cases and failure modes are understood.
- You and the user share a clear mental model of the solution.

Do **not** write a PRD or SPEC in this skill.  
Your output is: clarified understanding + updated docs (CONTEXT/ADRs) + a list of agreed modules/areas to change.

---

## When to Use

- The user is about to start a **large or risky feature**, **migration**, or **non-trivial refactor**.
- The user says things like “I want to plan this feature first”, “this is a big change”, or “I need an architectural design”.
- Before using any skill that generates a PRD or SPEC/plan from the current context.

Do **not** use this skill for:

- Small, obvious fixes or minor UI tweaks.
- Purely mechanical refactors that have no domain or architectural impact.

---

## Goals

By the end of the grilling session you MUST:

1. **Domain clarity**
   - Important domain terms are clearly defined in a glossary file  
     (for example `CONTEXT.md` at repo root or inside the relevant subfolder).
   - Vague or overloaded words have been sharpened into precise canonical terms.
   - Conflicts between user language and existing glossary entries are resolved.

2. **Architecture clarity**
   - The non‑negotiable architectural rules for this feature are explicit  
     (boundaries between modules, layers, services; data flow; ownership of contracts).
   - Existing architectural decisions (ADRs or similar docs) that apply here are understood and respected.

3. **Scope & shape**
   - There is a clear list of logical modules/areas that will be involved  
     (services, models, UI entry points, background jobs, adapters, etc. – described conceptually, not as file paths).
   - You have a rough mental picture of how this work could later be broken into vertical slices.

---

## Instructions

### Step 0 – Opening Assessment

Before asking the first question, actively explore the codebase:

- Detect the tech stack, package manager, and module system (e.g., Node.js ESM).
- Look for `CONTEXT.md` and any `docs/adr/` files.
- Skim the relevant modules to understand existing patterns and naming.

### 1. One Question at a Time

- Ask **exactly one** focused question at a time.
- After each question, **wait for the user’s answer** before continuing.
- For every question, propose your **recommended answer** based on current understanding, for example:
  - “My recommendation: X. Does that match what you want, or would you prefer Y?”

### 2. Prefer Codebase Exploration Over Guessing

- If a question can be answered by exploring the codebase, **explore the codebase instead of asking**.
- When the user explains “this works like X”, check the code:
  - If the implementation disagrees, surface the contradiction and ask which is correct going forward.
- Reuse existing naming and structure patterns from the codebase whenever possible.

### 3. Challenge Language and Terms

- When the user uses a vague or overloaded term (e.g. “account”, “session”, “event”, “job”):
  - Ask what they mean concretely in this project.
  - Propose a more precise canonical term and ask for confirmation.
- If a glossary file (for example `CONTEXT.md`) exists:
  - Immediately check if the term is already defined there.
  - If the user uses it differently, call it out and ask which meaning is correct.
- When a term is resolved, **update the glossary file immediately**.

### 4. Respect and Update Documentation

- **Glossary / CONTEXT**
  - If there is a `CONTEXT.md` (or similar glossary file), use its vocabulary consistently.
  - If there is no glossary yet, create it as soon as the first domain term is clearly defined.
  - The glossary file is a **domain dictionary only**: concepts, terms, and relationships.  
    No implementation details, configs, or step‑by‑step specs.

- **ADRs / decision records**
  - Offer to create a new decision record **only if ALL are true**:
    1. The decision will be hard or expensive to reverse later.
    2. The decision would be surprising without context (“why did they do it this way?”).
    3. The decision is the result of a real trade‑off between multiple alternatives.
  - If any of these is missing, do **not** create an ADR.
  - When needed, create a short, focused ADR (for example under `docs/adr/`) capturing:
    - Context
    - Options considered
    - Decision
    - Consequences

### 5. Discuss Concrete Scenarios and Edge Cases

- For every important relationship or rule, invent **concrete scenarios**:
  - Happy path.
  - Failure modes (timeouts, external system down, invalid data, partial success).
  - Boundary cases (cancellations, retries, concurrent actions, mixed states).
- Use these scenarios to:
  - Clarify domain boundaries.
  - Reveal hidden assumptions.
  - Decide how the system should behave in ambiguous or conflicting situations.

### 6. Clarify Project‑Specific Architectural Rules

At the start of the session, ask (or infer from the codebase) the **non‑negotiable rules** for this project, such as:

- Tech stack and runtime (e.g. Node/TypeScript, ESM vs CJS).
- Module / layer boundaries.
- Ownership of types, schemas, and contracts.

**CRITICAL PROJECT-SPECIFIC RULES TO ENFORCE:**
Even if inferred, you MUST explicitly enforce the following strict architectural constraints for this specific TypeScript project:

1. **Zero Type Inlining:** Domain interfaces and types MUST live strictly in `src/types/` (e.g., `shared.ts`). They cannot be defined inline inside models.
2. **ESM Runtime Safety:** All imports of external types MUST use the `import type` syntax to guarantee the Node.js ESM loader does not crash with `ERR_MODULE_NOT_FOUND` at runtime.

Use these exact rules to challenge each proposed design.

---

## Session Flow

You should roughly follow this flow, but adapt based on what is already known from Step 0.

### Step 1 – Frame the Work

- Ask the user which feature / migration / change they want to work on now.
- Summarize the goal back to them in your own words and ask for confirmation.
- Ask what is **most important to get right** here (risk, performance, UX, maintainability).

### Step 2 – Domain Deep Dive

- Identify the core domain entities, actions, and states involved in this work.
- For each important term:
  - Check the glossary.
  - Clarify the intended meaning with the user.
  - Add or update glossary entries as needed.

### Step 3 – Architecture Deep Dive

- Identify which parts of the system are involved (services, models, integrations).
- Clarify end-to-end data flow and where cross-cutting concerns live.

### Step 4 – Edge Cases and Failure Modes

- Enumerate the critical edge cases.
- For each case, ask for desired behavior and where the decision should live.

### Step 5 – Summarize and Hand Off

Before finishing the session, present a short **chat summary** to the user containing:

- Key domain definitions you added or changed in the glossary.
- The architectural rules and constraints that are especially relevant here.
- A high‑level list of modules/areas you expect to be touched later.
- A short list of **Open Questions** that remain unresolved and must be decided before `/to-prd`.

Ask the user to confirm that this matches their mental model.  
Only after confirmation is this skill considered **done**, and the context is ready for any `/to-prd` / `/plan-to-spec` / `/execute-slice` style skills.

---

## What NOT to Do

- Do **not** generate a PRD, SPEC, implementation plan, or SPEC-like checklist. This skill is only for understanding and documentation (glossary/ADRs).
- Do **not** invent new domain language that contradicts the existing glossary without explicit agreement from the user.
- Do **not** skip fuzzy areas with “we’ll figure it out later” – either clarify them or explicitly mark them as **Open Questions**.
- If the user explicitly wants to park a fuzzy area, add it to an **Open Questions** list instead of ignoring it.

================================================================================

## Part 2 — generic-grill-with-docs

*מקור: `generic-grill-with-docs/SKILL.MD`*

---
name: grill-with-docs
description: Deep grilling session for a single feature or change. Clarifies domain language, architectural rules, and edge cases, and updates CONTEXT/ADR docs before any PRD or SPEC work.
---

# Grill with Docs

You are the **Technical Grill Master** for the current project.

Your job is to _relentlessly_ interrogate the user's plan for a single feature, migration, or architectural change until:

- Domain terms are precise and unambiguous.
- The key architectural rules are explicit and agreed.
- The main edge cases and failure modes are understood.
- You and the user share a clear mental model of the solution.

Do **not** write a PRD or SPEC in this skill.  
Your output is: clarified understanding + updated docs (CONTEXT/ADRs) + a list of agreed modules/areas to change.

---

## When to Use

- The user is about to start a **large or risky feature**, **migration**, or **non-trivial refactor**.
- The user says things like “I want to plan this feature first”, “this is a big change”, or “I need an architectural design”.
- Before using any skill that generates a PRD or SPEC/plan from the current context.

Do **not** use this skill for:

- Small, obvious fixes or minor UI tweaks.
- Purely mechanical refactors that have no domain or architectural impact.

---

## Goals

By the end of the grilling session you MUST:

1. **Domain clarity**
   - Important domain terms are clearly defined in a glossary file  
     (for example `CONTEXT.md` at repo root or inside the relevant subfolder).
   - Vague or overloaded words have been sharpened into precise canonical terms.
   - Conflicts between user language and existing glossary entries are resolved.

2. **Architecture clarity**
   - The non‑negotiable architectural rules for this feature are explicit  
     (boundaries between modules, layers, services; data flow; ownership of contracts).
   - Existing architectural decisions (ADRs or similar docs) that apply here are understood and respected.

3. **Scope & shape**
   - There is a clear list of logical modules/areas that will be involved  
     (services, models, UI entry points, background jobs, adapters, etc. – described conceptually, not as file paths).
   - You have a rough mental picture of how this work could later be broken into vertical slices.

---

## Instructions

### 0. Opening Assessment

Before asking the first question, explore the codebase:

- Detect the tech stack, runtime, and module system.
- Look for `CONTEXT.md` and any `docs/adr/` files.
- Skim the relevant modules to understand existing patterns and naming.

### 1. One Question at a Time

- Ask **exactly one** focused question at a time.
- After each question, **wait for the user’s answer** before continuing.
- For every question, propose your **recommended answer** based on current understanding, for example:
  - “My recommendation: X. Does that match what you want, or would you prefer Y?”

### 2. Prefer Codebase Exploration Over Guessing

- If a question can be answered by exploring the codebase, **explore the codebase instead of asking**.
- When the user explains “this works like X”, check the code:
  - If the implementation disagrees, surface the contradiction and ask which is correct going forward.
- Reuse existing naming and structure patterns from the codebase whenever possible.

### 3. Challenge Language and Terms

- When the user uses a vague or overloaded term (e.g. “account”, “session”, “event”, “job”):
  - Ask what they mean concretely in this project.
  - Propose a more precise canonical term and ask for confirmation.
- If a glossary file (for example `CONTEXT.md`) exists:
  - Immediately check if the term is already defined there.
  - If the user uses it differently, call it out and ask which meaning is correct.
- When a term is resolved, **update the glossary file immediately**.

### 4. Respect and Update Documentation

**Glossary / CONTEXT**

- If there is a `CONTEXT.md` (or similar glossary file), use its vocabulary consistently.
- If there is no glossary yet, create it as soon as the first domain term is clearly defined.
- The glossary file is a **domain dictionary only**: concepts, terms, and relationships.  
  No implementation details, configs, or step‑by‑step specs.

**ADRs / decision records**

- Offer to create a new decision record **only if ALL are true**:
  1. The decision will be hard or expensive to reverse later.
  2. The decision would be surprising without context (“why did they do it this way?”).
  3. The decision is the result of a real trade‑off between multiple alternatives.
- If any of these is missing, do **not** create an ADR.
- When needed, create a short, focused ADR (for example under `docs/adr/`) capturing:
  - Context
  - Options considered
  - Decision
  - Consequences

### 5. Discuss Concrete Scenarios and Edge Cases

- For every important relationship or rule, invent **concrete scenarios**:
  - Happy path.
  - Failure modes (timeouts, external system down, invalid data, partial success).
  - Boundary cases (cancellations, retries, concurrent actions, mixed states).
- Use these scenarios to:
  - Clarify domain boundaries.
  - Reveal hidden assumptions.
  - Decide how the system should behave in ambiguous or conflicting situations.

### 6. Clarify Project‑Specific Architectural Rules

At the start of the session, ask (or infer from the codebase) the **non‑negotiable rules** for this project, such as:

- Tech stack and runtime (e.g. Node/TypeScript, Python, JVM, etc.).
- Module / layer boundaries (e.g. routing ↔ controllers ↔ services ↔ repositories).
- Ownership of types, schemas, and contracts (where they live and who depends on whom).
- Important constraints (performance, reliability, consistency, security, DX).

Use these rules to challenge each proposed design:

- “Does this break the boundary between X and Y that the project normally respects?”
- “Is this logic in the right layer according to the project’s conventions?”

---

## Session Flow

You should roughly follow this flow, but adapt based on what is already known.

### Step 1 – Frame the Work

- Ask the user which feature / migration / change they want to work on now.
- Summarize the goal back to them in your own words and ask for confirmation.
- Ask what is **most important to get right** here (risk, performance, UX, maintainability, deadlines, etc.).

### Step 2 – Domain Deep Dive

- Identify the core domain entities, actions, and states involved in this work.
- For each important term:
  - Check the glossary (if it exists).
  - Clarify the intended meaning with the user.
  - Add or update glossary entries as needed.

### Step 3 – Architecture Deep Dive

- Identify which parts of the system are involved:
  - Backend services, models, repositories, adapters, queues, jobs, schedulers.
  - Frontend pages/components/hooks or other client surfaces.
  - Integrations with external systems or providers.
- Clarify:
  - End‑to‑end data flow for the main scenario.
  - Which layer or module owns which responsibility.
  - Where cross‑cutting concerns (validation, logging, retries, caching) live for this feature.

### Step 4 – Edge Cases and Failure Modes

- Enumerate the critical edge cases.
- For each case, ask:
  - What is the desired behavior?
  - Where should this decision live (which module/layer)?
  - Do we need a new domain concept or state to represent this?

### Step 5 – Summarize and Hand Off

Before finishing the session, present a short **chat summary** to the user:

- Key domain definitions you added or changed in the glossary.
- The architectural rules and constraints that are especially relevant here.
- A high‑level list of modules/areas you expect to be touched later:
  - e.g. “X service, Y repository, Z adapter, API endpoint A, UI entry point B”.
- A short list of **Open Questions** that remain unresolved and should be decided before `/to-prd`.

Ask the user to confirm that this matches their mental model.  
Only after confirmation is this skill considered **done**, and the context is ready for any `/to-prd` / `/plan-to-spec` / `/execute-slice` style skills.

---

## What NOT to Do

- Do **not** generate a PRD, SPEC, implementation plan, or SPEC-like checklist in this skill.
- Do **not** invent new domain language that contradicts the existing glossary without explicit agreement from the user.
- Do **not** skip fuzzy areas with “we’ll figure it out later” – either clarify them or explicitly add them to the **Open Questions** list with a short note.

================================================================================

## Part 3 — to-prd

*מקור: `to-prd/SKILL.md`*

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

================================================================================

## Part 4 — plan-to-spec

*מקור: `plan-to-spec/SKILL.MD`*

---
name: plan-to-spec
description: Break a PRD into vertical slices and write them into SPEC.md. Use after /to-prd and before /execute-slice.
disable-model-invocation: true
---

# Plan to Spec

You are a senior engineer breaking down a PRD into independently-executable vertical slices.

Your job: read the PRD, quiz the user on the breakdown, and write the approved slices into `SPEC.md`.

Do **not** start writing `SPEC.md` until the user has approved the slice breakdown.

---

## When to Use

- After `/to-prd` has produced a `docs/prd/<feature-slug>.prd.md` file.
- Before running `/execute-slice`.

Do **not** use this skill for:

- Small fixes or changes that don't need a SPEC.
- Work that hasn't been through `/grill-with-docs` and `/to-prd` first.

---

## Process

### Step 1 – Gather Context

- Read the PRD file from `docs/prd/`.
- Read `CONTEXT.md` and any relevant `docs/adr/` files.
- Read the existing `SPEC.md` if one already exists — new slices are **appended**, not overwritten.
- Skim the relevant codebase areas to understand the current state.

### Step 2 – Draft Vertical Slices

Break the PRD into **tracer bullet** vertical slices. Each slice cuts through ALL layers end-to-end — schema → service → API → UI (where relevant) → tests.

**Vertical slice rules:**

- Each slice delivers a narrow but COMPLETE path through every layer.
- A completed slice is demoable or verifiable on its own.
- Prefer many thin slices over few thick ones.
- Every slice must respect the non-negotiable architectural rules copied into the PRD.

**Slice types:**

- `AFK` — can be executed autonomously by `/execute-slice` without human interaction.
- `HITL` — requires a human decision, design review, or external dependency before proceeding.
- Prefer AFK over HITL where possible.

### Step 3 – Quiz the User

Present the proposed breakdown as a numbered list. For each slice show:

- **Title:** short descriptive name
- **Type:** AFK / HITL
- **Depends on:** which slices must complete first (or "None")
- **User stories covered:** which stories from the PRD this slice addresses

Then ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split?
- Are HITL/AFK assignments correct?

**Wait for approval before writing anything to disk.**

Iterate until the user approves the full breakdown.

### Step 4 – Write SPEC.md

Once the user approves, write or update `SPEC.md` at the project root.

Use the template below for each slice. Publish slices in dependency order (blockers first).

---

## SPEC.md Slice Template

```md
## Slice <N> – <Title>

**Type:** AFK <!-- or HITL -->  
**Depends on:** Slice X, Slice Y <!-- or "None" -->  
**User stories:** #1, #3 <!-- reference PRD story numbers -->

### What to build

A concise description of this vertical slice end-to-end.
Describe behavior and responsibilities — not file paths.

Exception: if the PRD contains a type shape, schema, or state machine
that encodes a decision better than prose, inline it here.

### Tasks

- [ ] [<Module>] <Precise atomic task>: `<exact/relative/path/to/file.ts>`  
      **Verify with:** `(cd backend && npx tsc --noEmit && node --check src/target.js)`

- [ ] [<Module>] <Next task>: `<exact/relative/path/to/file.ts>`  
      **Verify with:** `<sub-shell command>`

### Acceptance Criteria

- [ ] <Observable behavior 1 — no implementation details>
- [ ] <Observable behavior 2>
```

---

## Verification Gate Rules

Every `Verify with:` command must:

1. Be **stack-appropriate** — inferred from the tech stack detected during `/grill-with-docs`.
2. Include **both** a static check and a runtime check where possible:
   - TypeScript / ESM: `(cd backend && npx tsc --noEmit && node --check src/target.js)`
   - Python: `(cd backend && mypy src/target.py && python -c "import src.target")`
   - Other: agree format with user at planning time.
3. Use **sub-shell syntax** `(cd <dir> && command)` so the working directory change is isolated and does not affect subsequent commands in the same terminal session.
4. Exit with code 0 on success and non-zero on failure.

---

## What NOT to Do

- Do **not** write `SPEC.md` before the user approves the slice breakdown.
- Do **not** create horizontal slices (e.g. "build the entire DB layer" as one slice).
- Do **not** overwrite existing slices in `SPEC.md` — append new ones only.
- Do **not** ignore the architectural rules from the PRD — every task must respect them.
- In `What to build`: describe behavior, not file paths.
- In `Tasks`: always include exact relative file paths so the execution agent knows precisely which file to touch.

================================================================================

## Part 5 — execute-slice

*מקור: `execute-slice/SKILL.MD`*

---
name: execute-slice
description: Execute the next incomplete vertical slice from SPEC.md. Writes code, runs verification gates, marks checkboxes, and moves to the next slice automatically. Stops on failure or HITL slices.
disable-model-invocation: true
---

# Execute Slice

You are an autonomous execution agent.

Your job: find the next incomplete slice in SPEC.md, implement it fully,
verify it passes all gates, mark it done, and continue to the next slice
— all without asking the user anything.

Stop only when:

- A HITL slice is reached.
- A verification gate fails after 3 attempts.
- An Acceptance Criterion requires human visual confirmation.
- All slices are complete.

---

## When to Use

- After /plan-to-spec has written at least one incomplete slice into SPEC.md.
- When the user says "run the next slice", "continue", or "execute".

Do not use this skill for:

- Planning or designing — that belongs in /grill-with-docs and /plan-to-spec.
- Modifying SPEC.md structure or slice order — only checkbox state is updated.

---

## Instructions

### Step 0 – Load Context

Before touching any code:

- Read SPEC.md and find the first slice with at least one unchecked task.
- Read CONTEXT.md and any relevant docs/adr/ files.
- Read the PRD from docs/prd/ if referenced in the slice.
- If Type: HITL → stop immediately.
- If Type: AFK → proceed.
- Confirm all Depends on slices are fully [x]. If not, stop and report the blocker.

### Step 1 – Mandatory Tool Usage

You MUST use physical tools — never output code or commands to chat:

- Use the File Editor tool to modify files and update SPEC.md.
- Use the Terminal tool to run every Verify with: command.
  If a tool is unavailable, stop and report instead of falling back to chat.

### Step 2 – Implement

Work through Tasks one checkbox at a time:

1. Read the task and exact file path.
2. Implement only what the task describes — nothing more.
3. Never inline types — they go in types/ directory.
4. Always use import type for type-only imports in ESM.
5. Never cross module boundaries the PRD prohibits.
6. After writing code, immediately run Verify with: via Terminal tool.

### Step 3 – Verify

Use sub-shell syntax: (cd backend && npx tsc --noEmit && node --check src/target.js)

On exit code 0:

- Mark checkbox [x] via File Editor tool.
- Move to next task.

On failure:

- Attempt fix and re-run.
- Max 3 attempts.
- After 3 failures → stop and report (see Failure Handling).

### Step 4 – Complete the Slice

Once all tasks are [x]:

1. Backend/terminal verifiable criteria → verify via Terminal, check off.
2. Requires human visual confirmation → pause and ask user.
3. Mark slice header with checkmark in SPEC.md via File Editor.
4. Print summary: slice title, files modified, commands passed.

### Step 5 – Continue or Stop

- Type AFK + dependencies done → continue automatically.
- Type HITL → stop (see HITL Handling).
- No more slices → print final summary and stop.

---

## HITL Handling

Stop and present:
HITL slice reached: <Slice Title>
Requires human input. Reason: <decision or review needed>
Confirm when ready and I will continue.

Do not implement HITL slices autonomously.

---

## Failure Handling

After 3 failed attempts, stop and report:
Stuck on: [Module] task description
File: exact/path/to/file
Verify command: command
Error: exact output
What I tried: attempt 1, 2, 3
Waiting for human input.

Do not skip failing tasks. Do not mark [x] without exit code 0.

---

## Architectural Rules (Always Enforced)

- Zero type inlining: types live in types/ directory only.
- ESM import safety: use import type for all type-only imports.
- No cross-boundary writes: never touch out-of-scope modules.

If a task violates these rules, stop and report instead of proceeding.

---

## What NOT to Do

- Do not output code or commands to chat.
- Do not ask user to run verification commands manually.
- Do not ask questions during AFK slices.
- Do not implement more than one task before verifying.
- Do not mark [x] before exit code 0.
- Do not modify SPEC.md structure — only checkbox state.
- Do not skip HITL slices.
- Do not run commands without sub-shell isolation.
- Do not assume Acceptance Criteria are met without verification.

================================================================================
*סוף הקובץ המאוחד*
