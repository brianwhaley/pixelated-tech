<?php
/**
 * Title: Blog: Single Column
 * Slug: Pixelated/single-blog-column
 * Categories: Pixelated
 * Description: All blog posts: Single column
 * Keywords: Single blog column
 */
?>
<!-- wp:group {"tagName":"main","layout":{"type":"constrained","contentSize":"1024px"}} -->
<main class="wp-block-group"><!-- wp:query {"queryId":0,"query":{"perPage":10,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false,"taxQuery":null,"parents":[]},"displayLayout":{"type":"list","columns":2},"align":"wide","layout":{"type":"constrained","wideSize":"100%"}} -->
<div class="wp-block-query alignwide"><!-- wp:post-template {"align":"wide"} -->
<!-- wp:group {"align":"wide","layout":{"type":"default"}} -->
<div class="wp-block-group alignwide"><!-- wp:post-featured-image {"isLink":true,"width":"","height":"","align":"wide"} /-->

<!-- wp:group {"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:post-title {"isLink":true} /-->

<!-- wp:post-date {"isLink":true} /-->

<!-- wp:post-excerpt /--></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
<!-- /wp:post-template -->

<!-- wp:group {"align":"wide","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide"><!-- wp:query-pagination {"paginationArrow":"arrow","align":"wide","layout":{"type":"flex","justifyContent":"space-between"}} -->
<!-- wp:query-pagination-previous /-->

<!-- wp:query-pagination-next /-->
<!-- /wp:query-pagination --></div>
<!-- /wp:group --></div>
<!-- /wp:query --></main>
<!-- /wp:group -->