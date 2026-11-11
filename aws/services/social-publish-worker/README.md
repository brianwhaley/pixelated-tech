# Social Publish Worker

This Lambda owns the server-side social publishing workflow that previously ran in the Admin Next.js route.

The worker receives the raw signed webhook envelope from the intake Lambda, verifies the WordPress HMAC signature, loads the canonical Pixelated config, and delegates to the existing component-library social publisher. The Lambda is packaged as a container so Puppeteer and Chromium are isolated from Amplify builds.

`PIXELATED_CONFIG_KEY` is the only runtime environment value required to decrypt the copied encrypted canonical config file.

## Scripts

`scripts/invoke-local.mjs` creates a signed worker envelope from the local canonical config and sends it to a running Lambda Runtime Interface Emulator endpoint. It does not start Docker or publish anything by itself.

`scripts/run-live-nextdoor.mjs` starts the worker image with bounded CPU, memory, process, and `/tmp` limits, then invokes `invoke-local.mjs` against that container. It requires `--confirm-live` because it can create a real Nextdoor post. The optional final argument selects the local port and defaults to `9001`.

`scripts/bootstrap-nextdoor-session.mjs` is local-only maintenance tooling. It opens a visible browser so an operator can sign in to Nextdoor, then saves the resulting cookies to a local file with restricted permissions. It is not used by CodeBuild or Lambda and should never run in CI.

## Local validation

The production image must be built from the repository root because it includes the compiled component-library distribution. Before using Docker Desktop, configure a bounded Docker disk and memory allocation and keep the Docker data disk off any external project volume. The local live runner does not bind-mount the repository or any host directory.

Build and validate the component distribution first:

```bash
npm run build --workspace @pixelated-tech/components
npm run test --workspace @pixelated-tech/social-publish-worker
npm run test --workspace @pixelated-tech/social-publish-intake
```

After the Docker safety preflight has passed, build the image from the repository root:

```bash
docker build --file aws/services/social-publish-worker/Dockerfile --tag pixelated-social-publish-worker:local .
```

The image is deliberately checked separately from the live test. The live test requires an explicit confirmation flag, limits the container to 2 GB memory, 2 CPUs, 512 MB of `/tmp`, and 512 processes, and uses no host mounts. Replace the site and post ID with an intentionally approved test target:

```bash
npm run test:live-nextdoor --workspace @pixelated-tech/social-publish-worker -- <site> <post-id> pixelated-social-publish-worker:local --confirm-live
```

The command creates a real Nextdoor post. It is not part of the normal test suite and must never run in CI. Do not reuse a previously published post unless duplicate publication is intentional. `PIXELATED_CONFIG_KEY` must be supplied through the existing configuration-key mechanism when the container starts.

For a running Lambda Runtime Interface Emulator endpoint, the signed worker envelope can be invoked without starting a container:

```bash
npm run invoke:local --workspace @pixelated-tech/social-publish-worker -- <site> <post-id> [lambda-endpoint]
```

## Deployment

CodeBuild uses `aws/services/social-publish-worker/buildspec.yml` from the repository root. The build runs the component, worker, and intake tests, builds the `linux/amd64` container image, checks the compiled runtime artifacts, pushes the image to the existing ECR repository, resolves the immutable image digest, and updates the `social-publish-worker` Lambda to that digest.

The CodeBuild project is connected to the GitHub repository and automatically triggers on pushes to `main`. CodeBuild builds committed source from GitHub; local working-tree changes are not included until they are committed and pushed.

The build produces no CodeBuild artifact. ECR is the image artifact store, and the Lambda update is the deployment step. Do not put `PIXELATED_CONFIG_KEY`, webhook secrets, session cookies, or decrypted configuration values in the repository or CodeBuild project settings.
