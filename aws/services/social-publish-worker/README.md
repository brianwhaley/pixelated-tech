# Social Publish Worker

This Lambda owns the server-side social publishing workflow that previously ran in the Admin Next.js route.

The worker receives the raw signed webhook envelope from the intake Lambda, verifies the WordPress HMAC signature, loads the canonical Pixelated config, and delegates to the existing component-library social publisher. The Lambda is packaged as a container so Puppeteer and Chromium are isolated from Amplify builds.

`PIXELATED_CONFIG_KEY` is the only runtime environment value required to decrypt the copied encrypted canonical config file.
