---
description: "Use when running terminal commands, executing code, or making file changes. Ensures compliance with command execution rules and question handling."
applyTo: "**"
---

# Command Execution & Question Handling Rules

## Config Vault Safety

- Never manually encrypt or decrypt configuration unless the user explicitly asks for that exact operation.
- The existing decrypted `pixelated.config.json` is the working source of truth; preserve all local changes.
- Build and deployment scripts handle encryption for deployment. Do not run vault commands during ordinary implementation, testing, or validation.
- Never decrypt `pixelated.config.json.enc` to overwrite or replace the existing local decrypted configuration.

## Rule 1: Inspect Before Answering, Edit Only With Permission

### Mandatory Reuse Audit Before Mutation

Before using any edit, file-creation, dependency, build, formatting, test-with-generated-output, repository, or external-system mutation tool, the agent must complete the repository's Required Reuse Audit and receive explicit approval for the exact proposal. This requirement is non-optional and overrides autopilot or bias-to-action behavior.

The audit must identify inspected prior art, exact reusable components and props, existing consumers, the composition/extension decision, the exact mutation scope, compatibility impact, and validation plan. If reuse is not viable, the agent must state: **No reusable component or existing extension point was found for this requirement.**

The agent must stop after presenting the audit under the headings `Reuse Audit`, `Implementation Proposal`, `Approved Mutation Scope`, `Behavior and Compatibility Impact`, `Validation Plan`, and `Approval Required: yes`. No mutation command or edit tool may run until the user approves that proposal. If the available harness cannot enforce tool permissions, the agent must still treat this as a hard process stop and must not proceed.

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

## Investigation vs. Implementation Approval

Explicit approval is scoped to the action that was requested and described.

- Approval to investigate, trace, inspect, measure, audit, or reproduce a problem authorizes read-only investigation and validation only.
- It does not authorize edits, refactors, configuration changes, dependency changes, test changes, builds that mutate tracked/generated files, deployment, or implementation.
- If investigation identifies a possible fix, stop and report:
  - verified findings,
  - affected consumers,
  - proposed implementation,
  - behavior and compatibility changes,
  - validation plan.
- Request separate explicit approval before editing.
- If the assistant promised “no code changes during the investigation,” that promise remains binding until the user separately approves implementation.
- Never infer implementation approval from “go,” “proceed,” or “continue” when the immediately preceding request was for investigation only.
- Finding a root cause does not authorize fixing it. After investigating a shared component, inventory its consumers and present the proposed scope before changing the component or its tests.

## Mutation Scope and Unexpected Files

Implementation approval authorizes only the files, systems, behaviors, and actions explicitly included in the approved scope. It is not blanket permission to perform unrelated cleanup, formatting, renaming, moving, backup removal, generated-file removal, or repository housekeeping.

- Treat every pre-existing, untracked, backup, temporary, generated, timestamped, or otherwise unexpected file as user-owned unless its ownership is proven.
- Never delete, move, rename, overwrite, or restore an existing or unexpected file based only on its name, extension, timestamp, Git status, or apparent relationship to a build.
- Cleanup is limited to disposable temporary files created by the assistant during the current task. Build or test completion does not authorize cleanup of files whose ownership is uncertain.
- If a requested action would affect a path outside the approved scope, stop and ask for explicit authorization before mutating it.
- Before finishing, compare all created, changed, deleted, moved, and restored paths with the approved scope. Report any unexpected mutation immediately and do not perform compensating cleanup or restoration without user direction.

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

## Closed Monorepo Cleanup

This monorepo is consumed only by code within the repository. Consolidate equivalent behavior into one canonical implementation and update all in-repository consumers to use it in the same change.

- Delete duplicate implementations, legacy exports, compatibility re-exports, aliases, wrappers, fallback paths, and deprecation shims.
- Never preserve or recommend any of those compatibility paths for hypothetical consumers.

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
