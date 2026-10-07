# Coding Conventions

This document outlines the coding standards and conventions used across the Pixelated Technologies monorepo, including client applications, Pixelated Admin, shared packages, and the `pixelated-components` library.

## AI Agent & Code Review Discipline

**For AI agents and code reviewers:**
- Never recommend changes based on assumptions about library/framework behavior
- All claims must be backed by actual code analysis, testing, or documentation
- Always provide documentation URLs when claiming something about a tool or library
- If unsure about behavior: test it first or explicitly state the uncertainty
- Read actual type definitions (node_modules) and official docs before claiming "X doesn't support Y"
- Verify changes work by running tests before recommending them

Example: Don't say "vitest v8 doesn't support coverage thresholds" — test it first or link to the actual vitest docs proving it.

### Deployment and Release Boundaries

- Agents must not deploy code, publish packages, push releases, trigger production deployments, or modify production data unless the user explicitly requests that deployment or release action.
- Building, testing, validating, and preparing release artifacts do not constitute permission to deploy or publish them.

## Documentation source of truth

When documentation conflicts with an active script, shared configuration, validator, schema, or implementation, the active repository artifact is authoritative. Update the documentation to match verified behavior; do not preserve a conflicting instruction for historical convenience.

## Terminal Command Output - CRITICAL Rule for AI Agents

**🚫 NEVER pipe command output to files or use grep/tail/head to filter results**

- All command output MUST display directly to stdout/stderr in the terminal
- User must be able to see all output in the terminal
- Transparency is required - do not hide, filter, or pre-process execution details
- **FORBIDDEN patterns**:
  - `npm run test | grep "FAIL"` - user can't see full output
  - `npm run build > build.log` - user can't see results
  - `command 2>&1 | tail -100` - user doesn't see beginning
  - Any piping to files or output truncation
- **REQUIRED patterns**:
  - `npm run test:coverage` - full unfiltered output visible
  - `npm run build` - complete results displayed
  - Let the user see everything, always

## Git Conventions

### Remote Naming
- Name Git remotes after the repository, not "origin"
- Pattern: `git remote add <repo-name> https://github.com/<org>/<repo-name>.git`
- Example: `git remote add pixelated-components https://github.com/brianwhaley/pixelated-components.git`
- Benefits: Multiple remotes are self-documenting; `git fetch pixelated-components` is clearer than `git fetch upstream`
- Monorepo context: pixelated-tech monorepo has remotes for all apps, making cross-project operations clear
- Use `src/scripts/setup-remotes.sh` to configure all remotes consistently

## General

### Indentation
- Use tabs for indentation with tab size 4
- Do not use spaces for indentation

## Shared-First Architecture

All platform work follows this order: reuse an existing component, harness, fixture, data object, script, or test case first; if it needs more capability, extend or enhance the shared object and update its affected consumers as part of that work; create a net-new feature only when extending the existing capability is not viable.

- Search existing applications, shared packages, components, integrations, schemas, configuration accessors, and test utilities before creating new code.
- Prefer extending or composing an existing shared capability over creating a local duplicate.
- Keep individual site applications thin: site-specific code should primarily compose shared capabilities with client-specific routes, content, styling, configuration, and behavior.
- Move genuinely reusable behavior into the correct shared package through an approved platform change; do not force one-off behavior into shared abstractions without evidence of reuse.
- Use shared tests and fixtures before creating local test infrastructure when the behavior is reusable.
- Prefer configuration and data-driven behavior over repeated branching when it reduces duplication and remains easy to validate.
- Do not add abstractions, dependencies, APIs, or configuration solely because reuse is theoretically possible.
- Site-specific work belongs in the target application. Cross-site components, packages, schemas, integrations, admin capabilities, and testing infrastructure belong in their owning shared boundary.

## Abstraction Discipline

- Prefer clear, direct code over helpers, normalizers, wrappers, adapters, and generic utility layers.
- Do not create a helper or normalizer for a single call site unless the logic is genuinely complex, domain-significant, or materially easier to test in isolation.
- Before creating an abstraction, search for multiple real consumers and confirm that the abstraction removes meaningful duplication rather than hiding simple logic.
- Keep one-use transformations close to the code that uses them so the data flow remains readable.
- Do not create generic `utils` files as dumping grounds for unrelated functions.
- When an abstraction is justified, give it a specific domain name, a small public surface, clear ownership, and focused tests.

## TypeScript & React

### PropTypes & Type Inference
- Use PropTypes for runtime validation
- Use `InferProps<typeof Component.propTypes>` for TypeScript types
- Define PropTypes before the component function
- Require JSDoc on propTypes (either a JSDoc block immediately above the `propTypes` declaration or inline per-prop comments). Enforced by ESLint rule `pixelated/required-proptypes-jsdoc` (severity: **error**).
- Example:
```typescript
Component.propTypes = {
	propName: PropTypes.string.isRequired,
	optionalProp: PropTypes.number
};
export type ComponentType = InferProps<typeof Component.propTypes>;
export function Component(props: ComponentType) { ... }
```

### Component Structure
- Use functional components with hooks
- Export both the component and its type
- Use named exports over default exports
- Place PropTypes definition immediately before the component

### File Organization
- Group related components in feature directories
- Use kebab-case for file names: `component-name.tsx`
- Place CSS files alongside components: `component-name.css`
- Use index files for clean imports

### File Naming and Usage
- `*.components.tsx`: front-end UI components
- `*.functions.ts`: shared helper functions usable by both front-end and server
- `*.server.ts` / `*.server.tsx`: server-only modules and actions
- `*.integration.ts`: legacy integration files that should be treated as server-only

## APIs & Services

### API Service Structure
- Create thin API services that handle external integrations
- Separate business logic from API calls
- Use TypeScript interfaces for API request/response types
- Handle errors gracefully with proper typing

### Service File Naming
- Use descriptive names: `gemini-api.ts`, `analytics-service.ts`
- Place services and integrations in the owning package's established directory and server/client boundary; do not assume a generic `utilities/` or `services/` directory exists
- Export functions and types clearly

### Error Handling
- Use try/catch blocks for async operations
- Return typed error responses
- Log errors appropriately
- Provide user-friendly error messages

## Configuration & environment variables
- Prefer a single source-of-truth config file: `pixelated.config.json` (server-side) and access it via the `PixelatedClientConfigProvider` / `getFullPixelatedConfig()` APIs.
- Environment variables must be avoided at all costs. The config provider exists so teams can use developer-friendly, code-first, and versioned configuration instead of brittle, environment-variable-based wiring — always explore provider-driven, build-time, or feature-flagging alternatives before considering an env var.
- Secrets must be injected into `pixelated.config.json.enc` and surfaced via the config loader; do **not** read secrets from ad-hoc `process.env` in application code. Consumer components must read configuration from the config provider (`useConfig()` / `usePixelatedConfig()`), not `process.env` directly — this ensures consistent defaulting, secret-stripping for client bundles, and server/client parity.

Exception (allowed env usage — single, narrowly-scoped):
- `PIXELATED_CONFIG_KEY` — only to decrypt `pixelated.config.json.enc` in local/CI debugging; prefer injecting the key via the CI/platform secrets manager. This is the only permitted environment variable for application configuration in the codebase unless an explicit, documented approval and migration plan is provided.

> ⚠️ Migration rule: any existing `process.env` references (other than `PIXELATED_CONFIG_KEY`) must include a migration PR that maps the value into `pixelated.config.json` and updates `config.types.ts` (no silent roll-forwards).

Enforcement & best practices:
- Wrap any dev-only env reads in clear helpers and document them in `shared/docs`.
- Add a CI check that reports any new references to `process.env` in `src/components` (denylist) unless explicitly approved.
- Temporary security dependencies (e.g., `fast-xml-parser`) are flagged by the ESLint rule `pixelated/no-temp-dependency` (severity: **error**). This rule inspects the project's `package-lock.json` and errors the build when a configured temporary dependency remains; remove the dependency and update the rule options when the transient issue is resolved. If the lockfile no longer contains vulnerable versions but the dependency is still pinned via `overrides`/`resolutions` in `package.json`, the rule will also error and require removal of the override so the dependency graph is normalized.
- Hardcoded configuration values are prevented by the ESLint rule `pixelated/no-hardcoded-config-keys` (severity: **error**). This rule detects hardcoded Pixelated-specific configuration keys (e.g., `space_id`, `api_key`, `access_token`, etc.) and enforces their use via the config provider instead. **SECRET keys** (API tokens, encryption keys, credentials) are reported with heightened messaging; **non-secret config keys** are reported with standard messaging. Migration: any hardcoded config keys must be moved to `pixelated.config.json`, `pixelated.config.json.enc` (for secrets), or accessed via `usePixelatedConfig()` / `getFullPixelatedConfig()`. Example fix: replace `const base_url = 'https://cdn.contentful.com'` with `const base_url = config.base_url || 'https://cdn.contentful.com'` (where `config` comes from the provider).
- Example (preferred):
```ts
// server-side: canonical config loader
import { getFullPixelatedConfig } from '../config/config';
const cfg = getFullPixelatedConfig();
// client-safe: use provider to avoid leaking secrets
const clientCfg = getClientOnlyPixelatedConfig(cfg);
```

## CSS

### Naming Convention
- Use kebab-case for class names
- Enforced by ESLint rule `pixelated/class-name-kebab-case` (severity: **error**)
- Use BEM methodology when appropriate
- Prefix component-specific classes: `.component-name__element`

### CSS Variables
- Use CSS custom properties for theming
- Define variables at the root level when possible
- Use semantic variable names: `--font-size5`, `--color-primary`

## Testing

### Shared-first testing
- Shared testing harnesses, fixtures, mock factories, validators, and reusable test cases are the first line of defense for behavior used across sites, packages, or tools.
- Before creating a local test helper or fixture, search `shared/test-utils`, the owning package's shared test directory, and existing tests for an established pattern.
- Extend the shared harness when setup, assertions, fixtures, or contract behavior has multiple real consumers.
- Individual sites should create local tests for site composition, content, configuration, or a genuinely one-off feature only when no shared contract exists.
- Do not copy shared helpers into individual apps. Improve the shared helper or its contract when reuse is expected.

### Test File Structure
- Place test specifications in `src/tests` using names such as `component-name.test.tsx`.
- Place reusable package-local setup, fixtures, helpers, and mock factories in `src/test`.
- Place cross-workspace reusable harnesses in `shared/test-utils`.
- Place Storybook stories and interaction tests in `src/stories`.
- Keep test names descriptive and cover success, error, loading, empty, and accessibility states when they apply.
- Keep test specifications out of runtime directories such as `src/app`, `src/pages`, and `public`.

## Documentation

### Code Comments
- Use JSDoc for function documentation
- Comment complex logic
- Keep comments up to date

### README Files
- Include usage examples
- Document props and types
- Provide setup instructions

## Development Workflow

### Before Implementing New Features
1. **Use Existing Components**: Build on existing components rather than creating new ones from scratch
2. **Small Iterations**: Implement features in small, incremental steps
3. **Regular Quality Checks**: Run linting, testing, and building frequently during development
4. **Storybook Testing**: Test components in Storybook to ensure proper functionality and appearance

### Implementation Process
- Start with existing component patterns
- Make small changes and validate each step
- Use linting tools to maintain code quality
- Test in Storybook for visual and functional verification
- Run build process regularly to catch issues early

### Debugging & debug-only code
- Use a single, explicit debug flag per module when needed: `const debug = false` (set true only in local/dev runs).
- Wrap debug-only behavior in `if (debug) { ... }` so it can be removed by minifiers/treeshaking in production.
- Never ship persistent debug traces, sensitive dumps, or verbose stacks to production logs.
- One-shot diagnostics (for reproducing rare races) must be clearly labeled, gated behind `debug` and removed or feature-flagged before release.

Examples:
```ts
// local-only diagnostic (must be false in prod)
const debug = false;
if (debug) {
  // debug-only instrumentation (stack-capture, MutationObserver, etc.)
}
```

Acceptance criteria:
- All `if (debug)` blocks are eliminated or `debug` is `false` in production builds (checked by CI).
- No persistent `console.log`/`console.debug` calls in production bundles (enforce via lint rule).
- File naming: prefer `kebab-case` for source file names (lowercase, hyphen-separated). Examples: `my-component.tsx`, `form-utils.ts`. Exceptions: `index.*`, TypeScript declaration files (`*.d.ts`), test/spec (`*.test.tsx`, `*.spec.ts`), Storybook stories (`*.stories.tsx`), documentation (`docs/`) and intentionally generated files. This is enforced by `pixelated/file-name-kebab-case` (recommended `warn`).
- One-shot diagnostics are documented and gated behind explicit opt-in.

### Code Coverage Requirements

Code coverage thresholds enforce quality gates during releases:

**Thresholds** (configured in `shared/configs/vitest.config.base.ts`):
- **Lines**: 85% minimum
- **Functions**: 85% minimum
- **Branches**: 73% minimum
- **Statements**: 85% minimum

**TypeScript and TSX files under `src` are counted by the shared config**. Declarations, stories, styles, data, scripts, and test helper directories are excluded.

**When coverage is enforced:**
- `npm run test:coverage` runs the workspace's coverage suite.
- `npm run test:coverage -ws` runs coverage across workspaces that expose the script.
- `npm run release:prep` runs the repository release-preparation checks.

**Coverage thresholds are immutable:**
Never adjust the coverage thresholds under any circumstances. Do not lower them, weaken them, bypass them, or change the shared configuration to make a failing test or release check pass. Fix the implementation or add the missing shared and local test coverage instead.

**Development workflow:**
- Run the narrowest relevant shared or workspace test first.
- Run `npm run test:coverage` when changing shared behavior or before release.
- Run `npm run release:prep` as the final release-preparation check.

## Versioning & releases — Semantic Versioning
- This project follows [Semantic Versioning 2.0.0](https://semver.org/): `MAJOR.MINOR.PATCH`.
  - MAJOR: incompatible API changes (breaking changes)
  - MINOR: backward-compatible new features and new public APIs
  - PATCH: backward-compatible bug fixes and documentation/test updates
- Deprecation policy:
  - Mark API as deprecated in docs and types with the version it will be removed in.
  - Provide migration notes and a codemod if the change is non-trivial.
  - Keep deprecated behavior supported for at least one MINOR cycle where feasible.

Release checklist (must-pass before publishing):
- Tests: all unit/integration/e2e passing
- Lint: no errors (warnings reviewed)
- Changelog: add entry following Conventional Commits (type/scope/summary)
- Compatibility: update `peerDependencies` table in README/docs if applicable
- Docs: update `docs/` with migration notes for breaking or deprecated changes

Version bump guidance (practical):
- Bump PATCH for bug fixes, tests, docs, and non-behavioral changes.
- Bump MINOR for new features, new public API, or additions that are backwards-compatible.
- Bump MAJOR for breaking API changes (document migration + deprecation window).

Automation & enforcement:
- Use CI to validate changelog + required changelog entry for releases.
- Fail release job if changelog or migration notes are missing for MAJOR/MINOR bumps.

## Git & Workflow

### Commit Messages
- Use conventional commit format
- Write clear, descriptive messages
- Reference issues when applicable

### Branch Naming
- Use feature branches: `feature/component-name`
- Use bugfix branches: `bugfix/issue-description`
- Use kebab-case for branch names