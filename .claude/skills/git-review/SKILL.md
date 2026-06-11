---
name: git-review
description: Run code review workflow for recent changes
disable-model-invocation: true
---

## How to Use

1. Run `git diff` to gather all recent modifications in the workspace.
2. Analyze the changes and categorize them by architectural risk (High, Medium, Low).
3. **Critical Filtering Rule (90% Confidence):** If you are 90%+ confident that a specific change, file, or line is purely boilerplate, standard imports, simple TS types, or routine field mapping that is definitely correct, **DO NOT** include it in the final guide. Keep it strictly focused on high-risk logic, database operations, I/O calls, or complex state mutations.
4. Create a temporary file named `TEMP_REVIEW_GUIDE.md` in the root of the workspace.
5. Format the file with a clear Markdown hierarchy, starting from the HIGHEST risk item to the LOWEST risk item. Use bolding for key issues and blockquotes (`>`) for major red flags.
6. Once the file is written, inform the user that their review guide is ready at `TEMP_REVIEW_GUIDE.md` and summarize the top 2 highest-risk items directly in the chat.
