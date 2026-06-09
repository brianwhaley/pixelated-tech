# 🚀 Pixelated Components Roadmap

This document outlines planned improvements and refactoring initiatives for the Pixelated Components library.

## Original Roadmap Items

### Quick Wins

- [  ] **Mega-Component Splitting**: Split large components (formcomponents.tsx 1,341 lines, ConfigBuilder.tsx 899 lines, schema.tsx 840 lines) into focused, single-responsibility modules. Payoff: 30-50% faster test runs, easier PRs, clearer ownership. Effort: 12-16 hours

- [  ] **Standardize Error Handling**: Only 42 try/catch blocks across codebase with inconsistent patterns—some silently fail, some crash, no centralized logging. Create unified error handling strategy and production monitoring setup. Payoff: Production visibility into failures, proactive bug detection. Effort: 6-8 hours

- [  ] **Extract Design Tokens**: Replace inline hardcoded styles ('1rem', '#f9f9f9', '0.5rem') scattered across SaveLoadSection.tsx, ComponentTree.tsx, PageBuilderUI.tsx, ConfigBuilder.tsx with centralized design token system. Payoff: Theme changes become 1-file updates, consistent spacing/colors across library. Effort: 3-4 hours

- [  ] **Optimize Contentful Queries**: Implement field projection and pagination to prevent over-fetching. No current enforcement in production components. Payoff: 20-40% faster API calls, lower Contentful costs, prevent rate-limiting. Effort: 8-12 hours

- [  ] **Surface Technical Debt**: Catalog and prioritize TODO/FIXME items (8 known issues: carousel drag/click bug, recipe deep-linking incomplete, SocialCard missing 9 platform integrations). Payoff: Clear backlog visibility, eliminate rediscovery of same issues. Effort: 1-2 hours


### New Components

- [ OH ] **ON HOLD** LinkedIn Recommendations Integration (Not possible with current LinkedIn API)

- [ OH ] **ON HOLD** eBay Feedback Integration - requires user OAuth login

- [ OH ] **ON HOLD** Yelp Recommendations integration (Cost Prohibitive)

- [ IP ] **IN PROGRESS** Instagram Image Integration for Carousels

- [  ] Map Based Project Component

- [  ] New Callout Variant based on https://onthespothome.com/services


### Component Improvements

- [  ] Align typography to `--font-sizeN` clamp variables.

- [  ] **SocialCards Component**: Fix state initialization to track prop changes properly.

- [  ] **Modal Component**: Clarify content source pattern (accepts both `modalContent` and `children`).

- [  ] **Carousel Component**: Fix active card state reset when `props.cards` changes.

- [  ] **NerdJoke Component**: Add props to useEffect dependencies if endpoint becomes configurable.

- [  ] **Instagram Component**: Add accessToken and userId to config provider for centralized API credentials.

- [  ] **Critters Integration**: Explore adding critters CSS inlining tool for improved page load performance and critical CSS optimization.

- [  ] **SplitScroll Enhancement**: Improve scrolling behavior and image transitions to match [safariportal lookbook style](https://itineraries.safariportal.app/Mary-Ann-Sarao/1589988388230923612?type=lookbook) (smoother layering and focal point transitions).

- [  ] **FormHoneypot**: Future - configurable global honeypot name, timing/token checks, optional telemetry for spam signal analysis.

- [  ] **Form validation on submit**: Ensure untouched required fields are validated on submit by processing all form schema fields, not only fields that have been interacted with.

- [  ] Create a dedicated `SiteInfoProvider` / `useSiteConfig()` hook for site metadata.

- remove config props from these components and retrieve the data direct from pixelated config providers:

why would the props be optional, with a fallbeck to getting them direclty? that is the opposite of what i want to do . i ahve said this before already. today the page extracts the config values, passes them to the component, then the component uses it. why? there are almost no examples where there is override data. let the component get the data direclty from the config file, no middle man, no confusion. it is a bad DX, bad pattern, bharder to test, more code, more brittle, more plaeces to break, and makes pagebuilder more complex. it is an unneeded featre. i propose you get the data direct from the config file, and remove any other options, any other fallbacks. one way to get the data or throw an error. let the component do the work, keep the integration thin.

- [  ] integrations - all of them retrieve config integration data from config integration section
- [  ] admin: 
- [  ] shopping cart - all of them
- [  ] sitebuilder - contentful integration


### Platform Enhancements

- [  ] **Static Search Index**: Build-time script to generate `search-index.json` from `routes.json` for serverless, instant client-side search.

- [  ] **AI-Driven Image & Meta Pipeline**: Integrate AI Vision APIs into `generate-site-images.js` to automatically generate alt text, SEO descriptions, and image captions.

- [  ] **Template Marketplace**: Pre-built industry-specific templates (restaurant, law firm, contractor, etc.) that users can clone and customize

- [  ] **Configuration Wizard**: Step-by-step setup wizard that collects business info, generates site configuration, and creates initial content structure

- [  ] **Content Migration Tools**: Automated importers for WordPress, Squarespace, Wix, and other platforms to migrate content to pixelated sites

- [  ] **Automated Security Scanner**: Regular security audits with vulnerability detection and automated fixes

- [  ] **GDPR Compliance Toolkit**: Automated cookie consent, data mapping, and privacy policy generation

- [  ] **API Gateway**: Unified API management for connecting to CRM, email marketing, payment processors, and other business tools

- [  ] **Webhook Automation**: Event-driven automation for form submissions, new content, user registrations, and business workflows

- [  ] **Documentation Auto-Generator**: Automatically generated API docs, component usage guides, and deployment instructions

- [  ] **Standardized Component Interface**: Create consistent component interfaces with `BaseComponentProps` and `InteractiveComponentProps` extending patterns.

- [  ] **Unified Configuration System**: Create centralized configuration with `ConfigContext.tsx`, `ConfigProvider.tsx`, `useConfig.ts` hook, and service-specific config modules.

- [  ] **Type-Safe Configuration**: Implement strict TypeScript interfaces with runtime validation for configuration objects.

- [  ] **CMS API Client**: Create standardized CMS API clients (`ContentfulClient.ts`, `WordPressClient.ts`) with base `ApiClient.ts` for consistent error handling.

- [  ] **Decentralize sites.json data**: split the sites.json data file and put the sections per site into routes.json.  

- [  ] **Additional Entry points** - add new entry points for shoppingcart and sitebuilder

To make your sites more configuration-driven and reduce the code footprint at the individual site level, I recommend moving toward a "Kernel" architecture.

Currently, your sites have a lot of structural duplication (identical layout.tsx, not-found.tsx, and dozens of (pages) folders). You can "thin" these by centralizing the routing logic and using a JSON-driven page engine.

- [  ] Implement a Catch-all Route Engine
Instead of having a folder for every page (e.g., about/page.tsx, services/page.tsx), move to a dynamic catch-all route at the site level:
Create: apps/*/src/app/[[...slug]]/page.tsx
Logic: This page reads the current path, looks up the configuration in siteconfig.json, and passes the data to the PageEngine.
Goal: This would allow you to delete almost all the folders in src/app/(pages) and manage the entire site structure via JSON.

- [  ] Centralize Site Boilerplate (The "Kernel")
You can move the standard Next.js files into a shared library or a site-level "Kernel" wrapper.
Shared Layout: Create a SharedRootLayout in pixelated-components that handles the common metadata, schemas, and context providers I saw in your layout.tsx.
Boilerplate Routes: Move robots.tsx, sitemap.tsx, manifest.tsx, and humans.txt to shared route handlers that generate their output dynamically from the site's pixelated.config.json.

- [  ] Configuration-Driven Theming
Your VisualDesign structure in siteconfig.types.ts is already excellent.
Next Step: Ensure that all site-level CSS variables are strictly derived from this config.
Tooling: We can create a script that validates pixelated.config.json against its TypeScript schema before build, ensuring that a "configuration-driven" site is also a "type-safe" site.

- [  ]  Automated Asset Management
Since you have a root-level site-images.json, we can improve DX by:
Creating a CLI tool (e.g., npm run sync-assets) that scans your project and generates these manifests automatically.
Ensuring SmartImage can resolve assets by a simple "Key" (like id="logo") instead of requiring full URLs in every component.
Would you like to start by expanding the componentMap or should we try implementing a catch-all route for one of the sites to see it in action?



- [ ] **Universal Page Blocks (MVP)**:
  - [ ] **PageList**: A generic "Retailer" component that iterates over any data source (FAQs, Team, Projects) using a single JSON-defined layout. Eliminates the need for specialized `ServiceList` components.
  - [ ] **PageItem**: A generic "Matcher" component for dynamic routes (`[slug]`). It automatically finds the correct data item (Service, Project, etc.) based on the URL and injects it into the page context.
  - [ ] **Prop Tokenization**: Enable `{{token.path}}` resolution inside `PageEngine` to support truly dynamic, data-driven layouts without new React code.



### WORKSPACE Enhancements

- [  ] **Standardize app scripts** - Move repeated script definitions into shared tooling if possible. Example: config:encrypt, config:decrypt, generate-site-images, update. With workspaces, apps can run shared scripts from the component package without repeating them.

- [  ] **Selective Amplify deployment support** - Add a release helper or workflow that extracts a single `appRoot` section from the monorepo `amplify.yml` so only the target app is deployed, while preserving the full multi-app YAML in source control.

### Shopping Cart Enhancements

- [  ] Pull out registration as an item from pixelated components and move to in three muses and allow custom item injection into the shopping cart

#### SCALING BLOCKERS

1. All cart/shipping data stored in browser localStorage only
1. No server-side persistence or session management
1. Order data sent via simple emailJSON call — no real order processing system
1. No inventory management or stock tracking
1. No order history or customer accounts
1. Discount codes loaded from single Contentful space
1. No site-specific pricing, tax rates, or shipping rules
1. No real tax calculation engine
1. All purchases anonymous — no customer accounts or authentication
1. No order tracking or history
1. No abandoned cart recovery
1. No customer communication workflows
1. Shipping form fields must match exact names in localStorage
1. No client-side validation exposed to cart
1. No retry logic if form save fails

#### RECOMMENDATIONS FOR SCALE

##### Architecture Redesign

- [  ] REST API for cart operations (add/remove/update)
- [  ] Persistent order storage with customer reference
- [  ] Real-time inventory management
- [  ] Order status tracking (pending → confirmed → shipped → delivered)
- [  ] Config-driven tax rates
- [  ] Per-site discount code repositories
- [  ] User authentication (optional: anonymous sessions with tracking)
- [  ] Cart recovery across browser sessions
- [  ] Order history and tracking
- [  ] Wishlist support
- [  ] Carrier Tracking integration
- [  ] Multi-carrier selection UI
- [  ] Integrate TaxJar or similar
- [  ] Support multiple jurisdictions
- [  ] Real-time tax calculation during checkout
- [  ] Compliance reporting
- [  ] Cart abandonment tracking
- [  ] Conversion funnels
- [  ] Error logging
- [  ] Payment gateway reconciliation
- [  ] Guest + registered checkout flows
- [  ] Saved payment methods
- [  ] Address book
- [  ] Order notes/special requests
- [  ] Coupon/loyalty point support


## Admin Feature Enhancements

### High Priority Refactoring (Development Speed Focus)

- [  ] **API Client Abstraction**: Create centralized `ApiClient` class with consistent error handling, caching, and retry logic to eliminate repeated fetch/error patterns across components.

- [  ] **SEO Integration Modularization**: Split 1, 193-line monolithic file into focused modules: `page-analyzer.ts`, `site-crawler.ts`, `header-analyzer.ts`, and `metric-scorers.ts`.

- [  ] **Component Memoization**: Add `React.memo` and `useMemo` to reduce unnecessary re-renders by 30-50% in large components.

### Medium Priority Improvements

- [ IP ] **Standardized Component Architecture**: Establish consistent patterns for component props interfaces, error/loading state management, event handling, and styling approaches.

- [ IP ] **Shared Type Definitions**: Create centralized type definitions in `src/types/` directory to eliminate duplicated interfaces across components.

- [  ] **Bundle Optimization**: Implement dynamic imports and tree shaking optimizations to reduce large bundle sizes and enable code splitting.

## Contributing to Roadmap

This roadmap is a living document. To contribute:

1. Open an issue with the `enhancement` label
2. Propose changes via pull request
3. Discuss priorities in the project's discussions

See the [main README](../README.md) for contribution guidelines.
