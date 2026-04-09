<?php

add_action('init', function() {
	remove_theme_support('core-block-patterns');
});

add_theme_support( 'wp-block-styles' );









// Initialize information content
// require_once trailingslashit(get_template_directory()) . 'inc/vendor/autoload.php';

add_action("init", function () {
register_block_pattern_category(
	'pixelated',
	array( 'label' => __( 'Pixelated', 'pixelated' ) )
);

	
});