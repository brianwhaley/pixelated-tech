<?php

add_action('init', function() {
	remove_theme_support('core-block-patterns');
});

add_theme_support( 'wp-block-styles' );

function pixelated_render_footer_copyright() {
	$current_year = wp_date('Y');

	return sprintf(
		'<p class="has-secondary-color has-text-color" style="font-size:16px">Copyright %s | <a href="%s">Pixelated</a> WordPress Theme</p>',
		esc_html($current_year),
		esc_url('https://www.pixelated.tech')
	);
}

// Initialize information content
// require_once trailingslashit(get_template_directory()) . 'inc/vendor/autoload.php';

add_action("init", function () {
	register_block_pattern_category(
		'pixelated',
		array( 'label' => __( 'Pixelated', 'pixelated' ) )
	);

	register_block_type_from_metadata(get_template_directory() . '/blocks/footer-copyright', array(
		'render_callback' => 'pixelated_render_footer_copyright',
	));

});
