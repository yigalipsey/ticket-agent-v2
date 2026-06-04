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
