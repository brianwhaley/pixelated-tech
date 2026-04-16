# Pixelated Template Feature Checklist

## Overview

Pixelated Template is a modern, production-ready starter template for building responsive web applications using Next.js 16, TypeScript, and the Pixelated Components library. It provides a solid foundation with pre-configured routing, styling, SEO optimization, and common web development patterns.

This checklist serves two purposes:
1. **Features**: A comprehensive list of what's included in the template
2. **Adoption**: Step-by-step guide for adopting the template to a new customer project

## Standard Site Structure

The repository defines shared standards for all customer sites and template apps.

- Use a single shared page route group: `src/app/(pages)/(home)/page.tsx` for the home page and keep all page routes under `src/app/(pages)/`
- Keep shared Next.js configuration centralized in `shared/configs/next.config.base.ts`
- Set `reactStrictMode: false` in the shared base config for consistent behavior across all sites
- Apply webpack browser fallback handling in the shared base config with `config.resolve.fallback = { fs: false, path: false }`
- Keep per-site `next.config.ts` focused on app-specific aliasing and redirects only
- All apps under `/apps/*` are private packages and should use `private: true`
- Only include `@next/third-parties` in apps that import it
- All apps should expose shared utility scripts such as `generate-site-images` and config helpers
- TypeScript-based apps should use `.tsx` for React component source files

## Template Features

### Core Development Framework
- **Next.js 16** with App Router (src/app directory structure)
- **TypeScript 6** for type safety and better development experience
- **React 19** with latest features and performance optimizations
- **ESLint 9** configuration for code quality and consistency

### Foundation Features
- Cache Manger for standard cache management
- CSS priority and load time amanagement
- Image priority and load time management
- Intersection observer for managing events above the fold / within the viiewport
- Dynamic route management and metadata loading for pages via layout.tsx
- MicroInteractions centralized via flags on layout.tsx
- Proxy handler for Content Security management and standardized response headers
- Standard use of Rich Schemas for SEO / AEO - BlogPosting, Breadcrumb, FAQ, LocalBusiness, Podcast, Product, Recipe, Review, Services, Website
- App Router global error boundary — accessible `global-error` at `src/app/global-error.tsx` (branded, testable error UI)- SmartFetch to help manage Next based caching of API data via fetch
- URL Builder for key-value pairs, properties, and directories
- Well-Known txt pages such as humans.txt, security.txt
- A general set of other utilities managing a wide variety of functions

### Caching
- Cache Manager to manage localstorage caching on demand
- SmartImage - leverage Next based image caching
- Next.cofig.js - caching for images
- customHttp.yml - cache strategy for CloudFront and edge caching via Amplify

### Foundation Pages
- 404 Error Page / Not Found page
- Global Error page
- Humans.txt
- Loading page
- Manifest.webmanifest page
- Robots.txt
- Security.txt
- Dynamically loaded sitemap.xml driven by content and integrations via pixelated.config.json config management
- Style Guide
- App-level loading & skeleton UI — canonical `SkeletonLoading` available at `src/app/loading.tsx` (consistent page-level loading state)

### Development Tools and CI / CD
- **Setup Script** - Automated project initialization and configuration
- **Build Scripts** - Development, build, and deployment commands
- **Package Update Script**
- **Release Script**
- **TypeScript Configuration** - Optimized tsconfig.json settings
- **Package Management** - NPM scripts for common tasks
- **Environment Variables** - Support for .env files and runtime configuration
- **Centralized Config Managment** All integration configuration ( ie Contentful, Cloudinary, Ebay, Flickr, Google APIs, Wordpress, Yelp, etc) are all centralized in the config/pixelated.config.json file, and properly encrypted / decrypted as necessary for CI/CD and Build

### Content Management
- **JSON-based Configuration** - Easy-to-edit site data in routes.json
- **Component-based Architecture** - Modular, reusable page components
- **Image Optimization** - Next.js built-in image handling
- **Config Provider** - PixelatedServerConfigProvider for centralized configuration management

### Routing & Navigation
- **File-based Routing** - Automatic route generation from routes.json configuration
- **Dynamic Navigation** - Header, footer, and navigation components
- **SEO-friendly URLs** - Clean, readable URL structures

### UI & Styling
- **Pixelated Components Library** - Pre-built, reusable components for common UI elements
- **General Components** - Accordion, Callout, Carousel, CountUp, FAQ Accordion, Hero, Markdown Display, Menus (accordion, expando, simple), Modal, Semantic (pagesection, pagesectionheader, pagetitleheader, pagegriditem, pageflexitem), sidepanel, SmartImage, SmartVideo, Split Scroll, Tab, Table, Tiles, Timeline
- **Content Components** - Buzzword Bingo, Resume, Recipe, NerdJokes
- **Integration Components** - Calendly, Cloudinary, Contentful, Flickr, Gemini, Google (reviews, analytics, maps, places, search), Gravatar, Hubspot, Instagram, LoremIpsum, Spotify, Wordpress, Yelp
- **Shopping Cart Functionality** - Integrates with PayPal
- **SiteBuilder** - Configuration Builder (SiteInfo, Routes, VisualDesign), Form Builder, Page Builder, 
- **SCSS/Sass** support for advanced styling capabilities
- **Responsive Design** - Mobile-first approach with flexible layouts
- **Visual Design System** - Configurable design tokens (colors, fonts, spacing) via routes.json

### SEO & Performance
- **Meta Tags** - Automatic generation from route configuration
- **Schema Markup** - LocalBusiness and other structured data support
- **Sitemap Generation** - Automatic XML sitemap creation
- **Robots.txt** - Search engine crawling configuration
- **Web App Manifest** - PWA-ready configuration
- **Performance Optimized** - Built-in Next.js optimizations
- **Proxy Middleware** - Header injection for SEO and routing (x-path, x-origin, x-url)
- **Automated Rich Schemas** - LocalBusiness, WebSite, Breadcrumb, Product, Services, BlogPosts, Podcast, FAQ, Review, Resume, Recipe
- ** Automaed SEO features**  - Sitemap.xml, Robots.txt, Humans.txt, Security.txt, Manifest.webmanifest


## Adoption Checklist

### Phase 1: Initial Setup
- [  ] Run `node scripts/setup.js <project-name> <git-repo-url>` to initialize the project
- [  ] Update `package.json` with project-specific details (name, description, repository)
- [  ] Install dependencies with `npm install`
- [  ] Start development server with `npm run dev` and verify basic functionality
- [  ] Update `src/app/config/pixelated.config.json` with all config based keys and integration data

### Phase 2: Content Replacement
- [  ] Update `src/app/data/routes.json`:
  - Replace siteInfo with customer details (name, description, URL, contact info)
  - Update route titles, descriptions, and keywords for each page
  - Configure visualdesign section with customer's brand colors and fonts
- [  ] Replace placeholder content in page components:
  - Update header, navigation, and footer text
  - Add customer-specific copy and messaging
  - Replace default images with customer assets
  - **Verify loading & error pages:** confirm `src/app/loading.tsx` (loading skeleton) and `src/app/global-error.tsx` content/brand copy are updated or intentionally left as the canonical implementations
- [  ] Update 404 page data in `src/app/data/404-data.json`:
  - Replace default images with customer-branded assets
  - Update error message text to match brand voice
- [  ] Be sure to update Contact Us form with `src/app/data/contactform.json`
- [  ] Update `src/app/data/faqs.json` with relevant FAQs
- [  ] Set up Contentful for content management features
  - Common content types are Pages, Reviews, Items, PhotoAlbums, and Media (images, videos)
- [  ] Create / Update Blog Schedule in `public/data/blogcalendar.md`
- [  ] Set up Wordpress Jetpack to email subscribers and post on social media platforms for you
- [  ] Create / Update `public/data/updates.md` wit meeting notes, to-dos, etc.
- [  ] Build basic pages
  - Home Page
  - About Us
  - Blog , wordpress URL
  - Contact Us, Contact Us JSON File
  - Projects / Gallery
  - Services 

### Phase 3: Branding & Styling
- [  ] Customize visual design tokens in `routes.json`:
  - Update primary/secondary colors to match brand
  - Configure typography (header/body fonts, sizes)
  - Adjust layout properties (border radius, shadows, transitions)
- [  ] Update favicon and app icons in `public/` directory
- [  ] Modify component styles in `src/app/styles/` if needed
- [  ] Update Elements in `src/app/elements`
  - Header
  - Footer
  - Nav
- [  ] Test responsive design across different screen sizes

### Phase 4: Functionality Customization
- [  ] Add or modify routes in `routes.json` for customer-specific pages
- [  ] Customize page components in `src/app/(pages)/` directory
- [  ] Set up environment variables:
  - Create `.env.local` file for local development
  - Configure production environment variables on hosting platform
  - Set up PIXELATED_CONFIG_JSON or PIXELATED_CONFIG_B64 for advanced configuration
- [  ] Configure PixelatedServerConfigProvider:
  - Update config provider in `src/app/layout.tsx` with customer-specific settings
  - Integrate third-party services (analytics, CMS, payment processors)
  - Set up API endpoints and external service connections
  - Configure proxy headers for SEO and routing (x-path, x-origin, x-url)
- [  ] Set up Google Analytics:
  - Create Google Analytics account and property
  - Get tracking code (GA4 Measurement ID)
  - Add tracking code to footer component or config provider
  - Configure analytics events for key user interactions
- [  ] Configure Cloudinary for image CDN:
  - Create Cloudinary account and get API credentials
  - Set up environment variables for Cloudinary configuration
  - Configure image optimization and CDN delivery
  - Update image references to use Cloudinary URLs for better performance
- [  ] Integrate customer-specific features:
  - Forms (contact, newsletter, etc.)
  - Third-party integrations (analytics, CRM, etc.)
  - Custom components from Pixelated Components library
- [  ] Update SEO configuration (meta tags, schema markup)

### Phase 5: Social Media
- [  ] Add / Update `src/app/elements/socialtags.tsx` with links to social media accounts
- [  ] Create new social media accounts as necessary
  - [  ] Google Business Profile
  - [  ] Facebook
  - [  ] Instagram
  - [  ] X / Twitter
  - [  ] Yelp
  - [  ] Nextdoor
  - [  ] Reddit 
  - [  ] Pinterest
  

### Phase 6: Testing & Deployment
- [  ] Run `npm run build` to ensure production build works
- [  ] Test all pages and functionality:
  - Navigation works correctly
  - Forms submit properly
  - Images load and are optimized
  - SEO tags are generated correctly
  - **Loading behavior:** verify client navigations show `src/app/loading.tsx` (SkeletonLoading) on slow routes and that skeletons are accessible (aria-hidden + live region announces)
  - **Global error boundary:** force an App Router error and verify `src/app/global-error.tsx` renders accessible messaging, appropriate status code, and a clear recovery path
- [  ] Test SEO features ar working properly
  - Meta tags - title, description, keyword - are coming from routes.json
  - Schemas are displaying proeprly
  - Sitemap.xml
  - Robots.txt
  - Humans.txt
  - Security.txt
  - Manifest.webmanifest
- [  ] Configure deployment settings:
  - Verify production environment variables are set on hosting platform
  - Configure hosting platform (Vercel, Netlify, etc.)
  - Set up domain and SSL certificates
- [  ] Run final performance and accessibility tests

### Phase 7: Launch & Maintenance
- [  ] Set up PIXELATED_CONFIG_KEY environment variable
- [  ] Deploy to production environment
- [  ] Set up monitoring and analytics
- [  ] Create documentation for content editors (if applicable)
- [  ] Plan for future updates and maintenance

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Pixelated Components Documentation](https://github.com/brianwhaley/pixelated-components)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SCSS Documentation](https://sass-lang.com/documentation)

## Support

For questions about the template or adoption process, please:
- Check the [GitHub Issues](https://github.com/brianwhaley/pixelated-template/issues) for common problems
- Review the [Pixelated Components README](https://github.com/brianwhaley/pixelated-components) for component usage
- Contact the maintainer at [your-email@example.com]

---

*Last updated: December 2025 (v0.1.6)*</content>
<parameter name="filePath">/Users/btwhaley/Git/pixelated-template/FEATURE_CHECKLIST.md