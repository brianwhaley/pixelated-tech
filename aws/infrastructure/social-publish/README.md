# Social Publish Services

This stack moves the WordPress social-publish webhook out of Amplify.

- `social-publish-intake` receives the API Gateway request and invokes the worker asynchronously.
- `social-publish-worker` is a Lambda container that owns the existing Puppeteer/Nextdoor workflow.

The unified API stack must receive the `SocialPublishIntakeFunctionArn` output as its `SocialPublishIntakeFunctionArn` parameter.

The worker image is built from the repository root so it can include the encrypted canonical config from `apps/pixelated-admin/src/app/config/pixelated.config.json.enc`. Pass the existing `PIXELATED_CONFIG_KEY` value as the `PixelatedConfigKey` parameter during deployment. Do not commit that value.
