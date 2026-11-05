<?php
/**
 * Plugin Name: Pixelated Social Publish Webhook
 * Description: Sends newly published posts to the Pixelated social publishing webhook.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
	exit;
}

function pixelated_social_publish_get_settings() {
	$settings = get_option('pixelated_social_publish_settings', array());

	return array(
		'secret' => defined('PIXELATED_SOCIAL_PUBLISH_SECRET')
			? PIXELATED_SOCIAL_PUBLISH_SECRET
			: (!empty($settings['secret']) ? $settings['secret'] : ''),
	);
}

function pixelated_social_publish_get_webhook_url() {
	return defined('PIXELATED_SOCIAL_PUBLISH_WEBHOOK_URL')
		? PIXELATED_SOCIAL_PUBLISH_WEBHOOK_URL
		: 'https://admin.pixelated.tech/api/webhooks/wordpress';
}

function pixelated_social_publish_sanitize_settings($input) {
	$current_settings = get_option('pixelated_social_publish_settings', array());
	$secret = isset($input['secret']) ? trim(sanitize_text_field($input['secret'])) : '';

	return array(
		'secret' => $secret !== '' ? $secret : (!empty($current_settings['secret']) ? $current_settings['secret'] : ''),
	);
}

function pixelated_social_publish_register_settings() {
	register_setting(
		'pixelated_social_publish',
		'pixelated_social_publish_settings',
		array('sanitize_callback' => 'pixelated_social_publish_sanitize_settings')
	);

	add_settings_section(
		'pixelated_social_publish_section',
		'Webhook Configuration',
		function () {
			echo '<p>The webhook automatically identifies this site from the published post URL.</p>';
		},
		'pixelated_social_publish'
	);

	add_settings_field(
		'pixelated_social_publish_secret',
		'Webhook secret',
		'pixelated_social_publish_render_secret_field',
		'pixelated_social_publish',
		'pixelated_social_publish_section'
	);
}
add_action('admin_init', 'pixelated_social_publish_register_settings');

function pixelated_social_publish_add_settings_page() {
	add_options_page(
		'Pixelated Social Publish',
		'Pixelated Social Publish',
		'manage_options',
		'pixelated-social-publish',
		'pixelated_social_publish_render_settings_page'
	);
}
add_action('admin_menu', 'pixelated_social_publish_add_settings_page');

function pixelated_social_publish_render_settings_page() {
	if (!current_user_can('manage_options')) {
		return;
	}
	?>
	<div class="wrap">
		<h1><?php echo esc_html(get_admin_page_title()); ?></h1>
		<form action="options.php" method="post">
			<?php
			settings_fields('pixelated_social_publish');
			do_settings_sections('pixelated_social_publish');
			submit_button();
			?>
		</form>
	</div>
	<?php
}

function pixelated_social_publish_render_secret_field() {
	$settings = pixelated_social_publish_get_settings();
	$is_constant = defined('PIXELATED_SOCIAL_PUBLISH_SECRET');
	?>
	<input type="password" class="regular-text" name="pixelated_social_publish_settings[secret]" value="" autocomplete="new-password" <?php disabled($is_constant); ?> />
	<p class="description"><?php echo $settings['secret'] ? 'A secret is configured. Leave blank to keep it unchanged.' : 'Enter the shared secret used by the admin webhook.'; ?></p>
	<?php if ($is_constant) : ?>
		<p class="description">This value is managed by PIXELATED_SOCIAL_PUBLISH_SECRET in wp-config.php.</p>
	<?php endif; ?>
	<?php
}

add_action('transition_post_status', function ($new_status, $old_status, $post) {
	if ($new_status !== 'publish' || $old_status === 'publish' || !$post instanceof WP_Post || $post->post_type !== 'post') {
		return;
	}

	$settings = pixelated_social_publish_get_settings();
	$post_url = get_permalink($post);
	if (!$post_url || !$settings['secret']) {
		error_log('Pixelated social publish webhook is not configured.');
		return;
	}

	$payload = wp_json_encode(array(
		'postId' => (string) $post->ID,
		'postUrl' => $post_url,
		'destinations' => array('nextdoor'),
	));
	$signature = hash_hmac('sha256', $payload, $settings['secret']);
	$response = wp_remote_post(pixelated_social_publish_get_webhook_url(), array(
		'timeout' => 20,
		'blocking' => false,
		'headers' => array(
			'Content-Type' => 'application/json',
			'X-WordPress-Signature' => 'sha256=' . $signature,
		),
		'body' => $payload,
	));
	if (is_wp_error($response)) {
		error_log('Pixelated social publish webhook failed: ' . $response->get_error_message());
	}
}, 10, 3);
