# Pixelated Tech Monorepo Architecture

## Structure

```
pixelated-tech/
  packages/
    pixelated-components/     (Shared component library, published to npm)
  apps/
    brianwhaley/              (Customer site - MVP)
  tools/
    pixelated-blog-wp-theme/  (WordPress theme)
```

## Setup Status

✅ **MVP Bootstrap Complete**
- Root configs: `tsconfig.base.json`, `eslint.config.mjs`, `vitest.config.ts`
- npm workspaces configured in root `package.json`
- brianwhaley linked to local pixelated-components (verified: `npm ls @pixelated-tech/components`)

## Workspace Linking

When you run `npm install` at monorepo root:
- Dependencies are hoisted to root `node_modules/`
- Workspace packages symlink to each other automatically
- brianwhaley references local `@pixelated-tech/components 3.15.2` instead of npm registry

## Next: Git Subtree Push

Test pushing brianwhaley to its original repo:

```bash
git subtree push --prefix apps/brianwhaley git@github.com:brianwhaley/brianwhaley.git main
```

This extracts just the `apps/brianwhaley/` folder and pushes it to the brianwhaley repo as if it were the full repo.

## Future: Amplify Deployment

Once validated, configure Amplify for brianwhaley:
- Repository: `pixelated-tech`
- Branch: `main`
- Build settings → App root folder: `apps/brianwhaley/`

Amplify will clone the monorepo and build only that app.
