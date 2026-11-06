# Pixelated Social Publish Webhook

Install this package as a WordPress plugin, separately from the Pixelated theme.

1. In WordPress, go to Plugins > Add New.
2. Choose Upload Plugin and select the plugin ZIP.
3. Install and activate the plugin.
4. Go to Settings > Pixelated Social Publish and configure the webhook secret.

The plugin sends newly published posts to https://admin.pixelated.tech/api/webhooks/wordpress. The webhook identifies the site from the hostname in the published post URL.

The PIXELATED_SOCIAL_PUBLISH_WEBHOOK_URL and PIXELATED_SOCIAL_PUBLISH_SECRET constants remain available as wp-config.php deployment overrides.
