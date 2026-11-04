<?php
/**
 * Plugin Name: Pixelated Social Publish Webhook
 * Description: Sends newly published posts to the Pixelated social publishing webhook.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
	exit;
}

add_action('transition_post_status', function ($new_status, $old_status, $post) {
	if ($new_status !== 'publish' || $old_status === 'publish' || !$post instanceof WP_Post || $post->post_type !== 'post') {
		return;
	}
	if (!defined('PIXELATED_SOCIAL_PUBLISH_WEBHOOK_URL') || !defined('PIXELATED_SOCIAL_PUBLISH_SITE') || !defined('PIXELATED_SOCIAL_PUBLISH_SECRET')) {
		error_log('Pixelated social publish webhook is not configured.');
		return;
	}

	$payload = wp_json_encode(array(
		'site' => PIXELATED_SOCIAL_PUBLISH_SITE,
		'postId' => (string) $post->ID,
		'postUrl' => get_permalink($post),
		'destinations' => array('nextdoor'),
	));
	$signature = hash_hmac('sha256', $payload, PIXELATED_SOCIAL_PUBLISH_SECRET);
	$response = wp_remote_post(PIXELATED_SOCIAL_PUBLISH_WEBHOOK_URL, array(
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
