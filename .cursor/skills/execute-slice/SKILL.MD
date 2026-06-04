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
