---
description: "Use when running terminal commands, executing code, or making file changes. Ensures compliance with command execution rules and question handling."
applyTo: "**"
---

# Command Execution & Question Handling Rules

## Rule 1: Inspect Before Answering, Edit Only With Permission

**For repository-specific questions:**
- Inspect the relevant source files and supporting tests/configuration before answering
- Keep that inspection read-only; it is evidence gathering, not permission to change files
- Cite the inspected files and distinguish verified behavior from recommendations or uncertainty
- Do not answer from generic assumptions when the repository can establish the fact

**For all questions:**
- Answer the question before proposing or making implementation changes
- Do not edit files, run mutating commands, or implement a recommendation unless the user explicitly requests it

**For general conceptual questions that do not depend on repository state:**
- Answer directly without repository inspection

## Rule 2: Command Execution Safety Checklist

Before executing any command via `run_in_terminal`, `edit_notebook_file`, `replace_string_in_file`, or similar:

1. **Review active rules**: Check `/memories/user/CRITICAL-WORKFLOW.md` for current constraints
2. **Parse the command** for forbidden patterns:
   - `|` (pipe)
   - `tail`
   - `head`
   - `>` (output redirection to file)
   - `tee`
   - `--silent`
   - `--reporter`
   - Any output filtering or truncation mechanism

3. **If forbidden patterns found**: STOP and ask user for explicit confirmation before proceeding
4. **Verify output transparency**: Command must output results directly to terminal without truncation or manipulation unless user explicitly requests it

**Active Rule**: Never use pipes, tails, head, or output redirection without explicit user request. All command output must be visible to the user.

## Rule 3: Memory Review Before Execution

Before any command execution:
- Review `/memories/user/CRITICAL-WORKFLOW.md` 
- Review `/memories/user/coding-conventions.md`
- Check `/memories/session/` for any active session-specific constraints
- Apply all relevant rules before proceeding

## Rule 4: Review Project Instructions & Conventions

Before any implementation, refactoring, or feature work:
- Check for `copilot-instructions.md` in the workspace root or `.github/` folder
- Check for `coding-conventions.md` in `/docs/` or project root
- Review for framework-specific practices, naming conventions, configuration patterns, and code organization
- Apply discovered conventions to all work in the project
- If instructions conflict with user requests, clarify before proceeding

## File Naming Conventions for Component Library
- `*.components.tsx`: front-end UI components
- `*.functions.ts`: shared helper functions usable by both front-end and server
- `*.server.ts` / `*.server.tsx`: server-only modules
- `*.integration.ts`: legacy integration files; treat as server-only
- Use these conventions when deciding where logic belongs and whether a file is client-safe or server-only

## Violations

Each violation of these rules represents a failure to follow documented requirements. Repeated violations should result in:
1. First violation: Direct reminder of the rule
2. Second violation: Explicit acknowledgment that the rule was broken
3. Third+ violations: Ask for explicit permission to continue
