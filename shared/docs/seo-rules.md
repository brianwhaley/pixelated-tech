
# SEO Rules



## SEO LINTING / TESTING

seo/enforce-single-h1: Flag pages (/app/page.tsx or top-level components) that have zero or multiple <h1> tags. Every indexable page should have exactly one <h1>.

seo/no-skipped-heading-levels: Ensure headings follow strict sequential order (e.g., an <h3> cannot appear directly after an <h2> without an <h2> parent, and an <h4> shouldn't jump right after an <h2>).

seo/prefer-semantic-html: Flag layout-heavy <div> elements with click handlers or headings inside them, suggesting <main>, <article>, <section>, <nav>, or <header>.

seo/require-img-alt: Require alt attributes on all standard <img> or <SmartImage> tags.

Advanced rule: Flag non-descriptive alt text (e.g., alt="image", alt="photo", alt="icon", or alt="" unless marked aria-hidden="true" for decorative icons).

seo/enforce-image-dimensions: Warn when raw <img> tags lack explicit width and height attributes to prevent Cumulative Layout Shift (CLS).

seo/smartvideo-poster-required: If using your SmartVideo component, enforce passing a poster image so search engine crawlers have a fallback thumbnail image to index.

seo/no-generic-link-text: Flag links containing generic anchor text like "click here", "read more", or "link". Enforce descriptive anchor text containing contextual keywords.

seo/enforce-rel-attributes: Require rel="noopener noreferrer" (or rel="nofollow") on all external outbound links (target="_blank").

seo/prefer-framework-links: In Next.js/React, flag plain <a href="..."> tags for internal relative links and require standard <Link> components to maintain client-side routing and prefetching.

seo/require-schema-context: If a component or object outputs JSON-LD schema, enforce that @context is strictly set to '[https://schema.org](https://schema.org)'.

seo/require-canonical-id: Warn when top-level schema nodes (like Organization, WebSite, Book, or Event) lack an @id property, preventing fragmented Knowledge Graph nodes.

seo/no-empty-schema-props: Warn when schema properties evaluate to empty strings (""), undefined, or null in generated JSON-LD output.

seo/page-metadata-limits: If using Next.js generateMetadata or standard <title>/<meta> tags, enforce character count ranges:

Title length: Warn if title is under 30 or over 60 characters (prevents SERP truncation).

Description length: Warn if meta description is under 70 or over 160 characters.

seo/require-og-image: Require pages with explicit route metadata to define an Open Graph og:image or twitter card image.

- [  ] Entity Co-occurrence & Salience: Check if a page mentions a core topic (e.g., "Cloud Architecture") without including its mandatory entity clusters (e.g., "microservices", "latency", "scalability"). Low co-occurrence signals to search engines that the article lacks depth or authority.

- [  ] Orphaned Entity Identification: Flag pages that introduce a new primary entity, brand, or topic that has zero internal links to/from other pages in your content graph.

- [  ] Internal Anchor Text Cannibalization: Catch instances where two different pages are target linked using the exact same anchor text, which dilutes topical signals.

Redundant / Fluff Content Ratio: Flag pages with high ratios of low-value transitional phrases ("In today's fast-paced digital world...", "It goes without saying that...").

Missing Direct Answer (Featured Snippet Failure): For informational or "How-To" content, enforce an "Answer First" structure—ensuring the first 100 words explicitly define the core concept before diving into long-form explanations.

EEAT Signals (Experience, Expertise, Authoritativeness, Trust): Flag content lacking explicit citations, external source links to high-authority domains, or first-person experience markers ("In our testing...", "We configured...").

Internal Link Depth & Thresholds: Scan page trees or content manifests to flag any page that requires more than 3 clicks from the root domain to reach.

Outbound Internal Link Ratio: Flag long-form pages (e.g., >1,000 words) that contain fewer than 3-5 contextual internal links to related platform entities.

Dead-End Content Detection: Flag pages that do not contain a next step, call-to-action (CTA), or related-content section at the bottom, which increases bounce rates and halts crawler traversal.

Above-the-Fold Content-to-DOM Ratio: Enforce that primary body text or <h1> titles are rendered high enough in the layout structure before large hero assets, banners, or decorative space push content down.

Duplicate Content / Dynamic Variant Detection: When generating content dynamically across multiple subdomains or white-label sites, check if content variants share more than 70–80% identical text without distinct localization or canonical overrides.

Primary Entity Density (The Anchor): The exact target keyword/phrase.

Secondary / LSI Keyword Density: Related terminology (e.g., if target is "Cloud Hosting", secondary entities are "server", "uptime", "AWS", "DNS").

Stemmed Variants: Plurals, verbs, and natural variations ("cloud host", "hosted in the cloud").

Rule: 100% of non-stop words in the title must appear within the first 15-20% of the body content (or first 200 words).

Why: Search engines expect immediate alignment. If your title is "How to Migrate PostgreSQL to AWS", but the word "AWS" doesn't appear until paragraph 6, the page fails search intent alignment.

Primary Keyword Density: 1.0% to 2.5% of total body word count.

Below 0.5%: Warning — "Low relevance signal for target keyword."

Above 3.0%: Warning — "Potential keyword stuffing penalty risk."

Meta Description Term Coverage: At least 70% of key entities present in the description should exist in the main body copy.

Rule: Break the body text into 3 equal sections (Beginning, Middle, End). Ensure the primary keyword or its LSI variants are distributed across all 3 sections.

Why: If 90% of your keywords are jammed into the introduction and conclusion, but the body covers something else, it signals artificial optimization or thin mid-article content.