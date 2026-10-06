# Testing Documentation

Shared testing harnesses, tools, fixtures, and test cases are the first line of defense across the Pixelated monorepo. When behavior is shared by multiple sites, packages, or tools, the test helpers and contract tests belong in the shared boundary so every consumer exercises the same expectations. Individual sites should add local tests only for genuinely site-specific behavior or a one-off feature that has no reusable contract.

## What is implemented in this repo

- The monorepo uses Vitest for test execution, `jsdom` for DOM-oriented tests, React Testing Library for component rendering, and the V8 provider for coverage.
- `shared/configs/vitest.config.base.ts` provides the common Vitest configuration used by the root, applications, tools, and shared packages.
- `shared/test-utils` contains reusable renderers, page runners, mocks, setup, headers, and coverage helpers for cross-workspace tests.
- Package-local shared test helpers live in `src/test`; test specifications live in `src/tests`; Storybook stories and interaction tests live in `src/stories`.
- `packages/pixelated-components/src/scripts/test-validator.js` checks test placement and focused tests, and measures reuse of shared test utilities, render harnesses, configuration factories, test data, fixtures, data factories, assertions, and inline data.
- Root workspace scripts expose `npm run test -ws`, `npm run test:coverage -ws`, and `npm run lint -ws`; workspaces may add package-specific validation commands.

## Shared-first testing

Testing work follows the platform order: reuse an existing component, harness, fixture, data object, script, or test case first; if it needs more capability, extend or enhance the shared object and update its affected consumers as part of that work; create a net-new test capability only when extending the existing one is not viable.

Before creating a local test or helper, inspect `shared/test-utils`, `packages/pixelated-components/src/test`, existing shared fixtures, and neighboring tests for an established pattern. Extend a shared harness when the setup, assertions, fixtures, or behavior will be used by more than one consumer. Keep reusable test cases close to the shared capability they protect, and keep site tests focused on composition, configuration, content, and client-specific behavior.

When creating test data, start with the closest existing data object or fixture and add or override only the fields required for the test. Do not immediately create a new data object when an existing object can be extended to represent the case.

Do not copy a shared mock, fixture builder, renderer, or assertion helper into an individual app. If the shared helper is difficult to use, improve the shared helper or its public test contract instead. A local helper is appropriate when the behavior is intentionally private to one app and extracting it would add more abstraction than reuse.

## Current commands

### Root workspace

- `npm run test -ws`
- `npm run test:coverage -ws`
- `npm run lint -ws`
- `npm run release:prep`

### Shared component package

From `packages/pixelated-components`:

- `npm run test:validator` validates test placement, focused tests, and shared-helper usage.
- `npm run test` runs the validator and the Vitest suite.
- `npm run test:coverage` runs the validator and the coverage suite.
- `npm run test:watch` starts Vitest watch mode.

Other workspaces may expose additional commands, but their tests should use the shared harnesses and conventions whenever the behavior is reusable.

## Toolchain and coverage

- Vitest is the repository test runner. The shared component package currently uses Vitest 5.
- `jsdom` is the default environment for React and DOM tests.
- `@testing-library/react` is the preferred library for component rendering and assertions.
- Coverage uses the V8 provider.

The active shared thresholds are defined in `shared/configs/vitest.config.base.ts`:

- Statements: 85%
- Branches: 73%
- Functions: 85%
- Lines: 85%

**Coverage thresholds are immutable:** Never lower, weaken, bypass, or otherwise change the thresholds to make a failing test or release check pass. Fix the implementation or add the missing shared and local test coverage instead.

The shared configuration includes TypeScript and TSX source under `src`, and excludes declarations, stories, styles, data, scripts, and test helper directories. Change the shared config when the platform-wide policy changes; do not document a second set of thresholds in an individual app.

## Test layout

- `src/tests` contains test specifications and integration tests.
- `src/test` contains shared setup, fixtures, helpers, utilities, and mock factories.
- `shared/test-utils` contains harnesses intended for reuse across workspaces.
- `src/stories` contains Storybook stories and interaction tests.

Keep test specifications out of runtime directories such as `src/app`, `src/pages`, and `public`. Follow the existing workspace layout when a package has an established local convention.

## Test design

- Test shared behavior at the shared boundary before testing site composition.
- Prefer deterministic tests that do not depend on live networks, wall-clock timing, or external services.
- Add success, error, loading, empty, and accessibility cases where the capability exposes those states.
- Reuse shared fixtures and contract cases across representative consumers.
- Add a local test for a site-only route, content rule, integration, or visual composition when no shared contract exists.
- Promote a local test and its fixture into shared coverage when a second real consumer appears.
- Keep tests readable and specific; do not create generic test utilities without multiple real consumers.

## Validation expectations

Run the narrowest relevant workspace test first, then the shared package tests when a shared capability or harness changes. For cross-workspace changes, run the affected app tests and the root workspace checks before release. Focused tests must not be committed; shared validators should reject focused test modifiers and misplaced test files.