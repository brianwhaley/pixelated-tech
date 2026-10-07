# App-Specific Differences

This document records intentional differences between applications in the monorepo. Keep app-specific deployment behavior local to the owning app unless multiple consumers have been verified to need the same behavior.

## Pixelated Admin deployment

The shared Next.js configuration remains repository-rooted because shared packages may be runtime dependencies of multiple applications. Pixelated Admin currently uses a narrower `outputFileTracingRoot` in `apps/pixelated-admin/next.config.ts` to keep its deployment artifact focused on the Admin app.

Admin also has isolated Next.js output cleanup in its `amplify.yml` application entry. The cleanup removes stale repository and Admin `.next` output, especially `.next/cache`, before and after the build. It must remain isolated from the shared Amplify frontend anchor unless another app demonstrates the same artifact problem.

App-specific tracing changes must be validated through the deployed server routes they affect. A smaller downloadable artifact confirms packaging size, but not that runtime files outside the app directory were unnecessary.
