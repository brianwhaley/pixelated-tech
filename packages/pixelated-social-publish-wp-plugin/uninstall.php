<?php

if (!defined('WP_UNINSTALL_PLUGIN')) {
	exit;
}

delete_option('pixelated_social_publish_settings');
