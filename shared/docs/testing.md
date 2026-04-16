# 🧪 Testing Documentation

This document describes the current testing setup and standards for the Pixelated monorepo.
It reflects the actual commands, validators, and coverage enforcement used in the repo today.

## What is implemented in this repo

- The monorepo uses Vitest for unit/integration testing and ESLint for linting.
- `packages/pixelated-components` is the primary shared component package with an enforced test workflow.
- The root workspace exposes workspace-wide commands using `-ws`.
- `packages/pixelated-components/src/scripts/test-validator.js` is the real validator used before running Vitest.

## Current commands

### Root-level commands

- `npm run test -ws`
- `npm run test:coverage -ws`
- `npm run lint -ws`
- `npm run release:prep` — runs the prep workflow from the root via `packages/pixelated-components/src/scripts/release.sh --prep`.

### Shared component package commands (`packages/pixelated-components`)

- `npm run test:validator` — validates test file placement and focused tests.
- `npm run test` — runs `npm run test:validator && vitest run --silent`.
- `npm run test:coverage` — runs `npm run test:validator && vitest run --coverage`.
- `npm run test:watch` — runs `vitest` in watch mode.

Other packages may have their own test scripts, but the shared component package is the example of the current enforced standard.

## Standards

### Toolchain

- Vitest 4.x is the standard test runner.
- `jsdom` is the default environment for React and DOM-related tests.
- `@testing-library/react` is the preferred library for component rendering and assertions.
- Coverage runs through the `v8` provider via `@vitest/coverage-v8`.

### Coverage enforcement

The real thresholds are defined in `packages/pixelated-components/vitest.config.ts`:

- `lines: 73.75`
- `functions: 75.25`
- `branches: 62`
- `statements: 71.5`

Coverage applies to component source files under `src/components/**/*.{ts,tsx,js}` and excludes:

- `node_modules/`
- `dist/`
- `**/*.stories.ts`
- `**/*.stories.tsx`
- `**/*.css`
- `**/data/**`
- `**/scripts/**`
- `**/test/**`
- `**/tests/**`

### Validator behavior

The real validation script in `packages/pixelated-components/src/scripts/test-validator.js` enforces:

- No focused tests: `describe.only`, `it.only`, `test.only`, `fit`, `fdescribe`, `vi.only`.
- No local `./test-utils` or `../tests/test-utils` imports when shared helpers already exist in `src/test/test-utils`.
- Test files are placed in the intended test folders, not scattered in runtime code.

## Expected file layout

- `src/tests` — test specs and integration tests, typically `*.test.ts`, `*.test.tsx`, or `*.spec.tsx`.
- `src/test` — shared setup, fixtures, helpers, utilities, and mock factories.
- `src/stories` — Storybook stories and interaction/play tests.

Do not place component test specs inside runtime directories like `src/app`, `src/pages`, `public`, or other unrelated source folders for shared packages.

## Practical guidance

- Keep tests deterministic and fast.
- Avoid network and timing dependencies in unit tests.
- Prefer shared helper modules from `src/test`.
- Keep tests close to the code under test when appropriate.
- Always run `npm run test:validator` before `vitest run` in the shared component package.

## Real next steps

1. Standardize `test:validator` across all workspaces.
   - Add the validator script to apps/tools/packages that do not yet have it.
   - Use the same focused-test and helper import rules everywhere.

2. Add `test:coverage` to any workspace that currently only has `eslint --fix`.
   - Make `npm run test:coverage -ws` the default CI coverage command.

3. Document exact test file naming and folder expectations in the contributor guide.
   - `src/tests/**/*.test.tsx`
   - `src/test/**` for shared helpers only
   - `src/stories/**` for Storybook and interaction examples

4. Make the root CI flow explicit.
   - `npm run lint -ws`
   - `npm run test -ws`
   - `npm run test:coverage -ws`
   - `npm run release:prep`

5. Keep coverage thresholds locked in `packages/pixelated-components/vitest.config.ts` and review them periodically.

---

See the [main README](../README.md) for general project information and contribution guidelines.
