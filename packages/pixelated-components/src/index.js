// File naming conventions for this component library:
// - *.components.tsx: client-side UI components
// - *.functions.ts: shared helper functions usable by both frontend and server
// - *.server.ts / *.server.tsx: server-only modules
// - *.integration.ts: legacy server-side integration modules (treated as server-only)


// sorted alphabetically and grouped by folder for easier reading

export * from './components/config/config.client';
export * from './components/config/config.types';
export * from './components/config/config.validators';

export * from './components/elements/index.elements';
export * as ElementsComponents from './components/elements/index.elements';

export * from './components/foundation/index.foundation';
export * as FoundationComponents from './components/foundation/index.foundation';

export * from './components/integrations/index.integrations';
export * as IntegrationsComponents from './components/integrations/index.integrations';

export * from './components/pixelated/index.pixelated';
export * as PixelatedComponents from './components/pixelated/index.pixelated';

export * from './components/shoppingcart/index.shoppingcart';
export * as ShoppingCartComponents from './components/shoppingcart/index.shoppingcart';

export * from './components/structure/index.structure';
export * as StructureComponents from './components/structure/index.structure';

export * from './components/sitebuilder/index.sitebuilder';
export * as SiteBuilderComponents from './components/sitebuilder/index.sitebuilder';

export * from './version';
