// Server-safe exports only - no client components, no CSS imports, no browser APIs
// Use this entry point for Next.js server components, API routes, and build-time code
// Note: Client components (with JSX, CSS imports, browser APIs) are NOT exported here.
// Import those from the main package entry point: @pixelated-tech/components

export * from './components/admin/sites/sites.integration';

// Billing server integrations (pure functions only, types can be loaded here but are client safe)

export * from './components/config/config';
export * from './components/config/config.server';
export * from './components/config/config.types';
export * from './components/config/config.validators';
export * from './components/config/crypto';

export * from './components/elements/index.elements.server';
export * as ElementsComponents from './components/elements/index.elements.server';

export * from './components/foundation/index.foundation.server';
export * as FoundationComponents from './components/foundation/index.foundation.server';

export * from './components/integrations/index.integrations.server';
export * as IntegrationsComponents from './components/integrations/index.integrations.server';

export * from './components/pixelated/index.pixelated.server';
export * as PixelatedComponents from './components/pixelated/index.pixelated.server';

export * from './components/shoppingcart/index.shoppingcart.server';
export * as ShoppingCartComponents from './components/shoppingcart/index.shoppingcart.server';

export * from './components/structure/index.structure.server';
export * as StructureComponents from './components/structure/index.structure.server';

export * from './components/sitebuilder/index.sitebuilder.server';
export * as SiteBuilderComponents from './components/sitebuilder/index.sitebuilder.server';

export * from './version';
