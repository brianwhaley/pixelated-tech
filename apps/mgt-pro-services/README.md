# Mgt Pro Services

A modern, production-ready starter template for building responsive web applications with Next.js 16, TypeScript, and the Pixelated Components library. Perfect for small businesses, agencies, and developers looking to quickly launch professional websites.

## ✨ Key Features

- **🚀 Next.js 16** with App Router for optimal performance and SEO
- **⚡ TypeScript** for type safety and better developer experience
- **🎨 Pixelated Components** - Pre-built, accessible UI components
- **📱 Responsive Design** - Mobile-first approach with flexible layouts
- **🎯 SEO Optimized** - Automatic meta tags, sitemaps, and schema markup
- **⚙️ Configurable** - JSON-based content and design token management
- **🔧 Developer Friendly** - ESLint, automated setup, and build scripts

## Quick Start

### Using Degit (Recommended)

```bash
# Create a new project from the template
npx degit brianwhaley/pixelated-template my-site
cd my-site

# Initialize the project
node scripts/setup.js my-site git@github.com:username/my-site.git

# Install dependencies and start development
npm install
npm run dev
```

### Using GitHub Template

```bash
# Create a new repository from this template
gh repo create my-site --template brianwhaley/pixelated-template --public
gh repo clone my-site
cd my-site

# Initialize the project
node scripts/setup.js my-site git@github.com:username/my-site.git

# Install dependencies and start development
npm install
npm run dev
```

### Using Create Next App

```bash
npx create-next-app my-site --example https://github.com/brianwhaley/pixelated-template
```

## Project Structure

```
pixelated-template/
├── src/
│   ├── app/
│   │   ├── (pages)/          # Page components
│   │   ├── data/
│   │   │   └── routes.json   # Site configuration and routes
│   │   ├── elements/         # Layout components (header, nav, footer)
│   │   ├── layout.tsx        # Root layout
│   │   ├── manifest.tsx      # PWA manifest
│   │   ├── not-found.tsx     # 404 page
│   │   ├── robots.tsx        # Robots.txt
│   │   ├── sitemap.tsx       # XML sitemap
│   │   └── styles/           # SCSS styles
│   └── proxy.ts              # API proxy configuration
├── public/                   # Static assets
├── scripts/
│   └── setup.js              # Project initialization script
├── docs/                     # Documentation
├── package.json
├── tsconfig.json
├── next.config.ts
└── FEATURE_CHECKLIST.md      # Complete feature and adoption guide
```

## Customization Guide

For detailed instructions on adapting this template to your project, see [FEATURE_CHECKLIST.md](./FEATURE_CHECKLIST.md), which includes:

- Complete list of included features
- Step-by-step adoption checklist
- Configuration guides
- Best practices

### Quick Customization Steps

1. **Update Site Configuration**: Edit `src/app/data/routes.json` with your site info and routes
2. **Customize Design**: Modify the `visualdesign` section in `routes.json` for branding
3. **Replace Content**: Update page components in `src/app/(pages)/` with your content
4. **Add Assets**: Place images and other assets in the `public/` directory

## Projects and Gallery offerings

The site creator offers these as independent pages. Select `projects`, `gallery`,
or both. `portfolio`, `work`, and `case-studies` remain Projects aliases;
`photo-gallery`, `image-gallery`, and `photos` select Gallery. Existing client
pages are not migrated or renamed.

- **Projects** (`/projects`) loads Contentful entries and renders each project's
  title, description, and image set using `ProjectsClient`. Configure
  `integrations.contentful` in `src/app/config/pixelated.config.json` with
  `base_url`, `space_id`, `environment`, `delivery_access_token`, and
  `projectsContentType`. The content type must have text `title` and
  `description` fields and an `images` field containing asset references.
  Numeric-leading titles sort numerically descending before other titles,
  which sort alphabetically descending, matching the GEA Projects example.
  Entries without resolved images are skipped; if none remain, samples are shown.
  Contentful credentials are read only on the server.
- **Gallery** (`/gallery`) loads a Flickr album into a flat three-column image
  grid. Configure `integrations.flickr.urlProps.api_key`, `user_id`,
  `photoset_id`, and optionally `photoSize`. This page uses
  `flickr.photosets.getPhotos`, matching the PixelVivid Gallery example,
  and shows a loading indicator while fetching.

Both pages prioritize live integrations. Missing configuration, fetch failures,
and empty results activate their co-located sample JSON
(`projects/projects.json` or `gallery/gallery.json`). Sample content is visibly
labeled and the reason is logged; it is not presented as live client work.
The sample images use the template's existing local image asset. Page folders,
including fallback data, are copied together even when an alias changes the
route name.

Use the canonical configuration vault workflow (`npm run config:encrypt`) after
editing configuration; do not add environment-variable credentials. Do not copy
GEA's content-type ID or PixelVivid's album ID into a new client site.

## Available Scripts

```bash
npm run dev          # Start development server (port 3004 with HTTPS)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint with auto-fix
npm run clean        # Clean build artifacts
npm run setup        # Initialize project (run after cloning)
```

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: SCSS/Sass
- **Components**: Pixelated Components Library
- **Linting**: ESLint
- **Build Tool**: Next.js CLI

## Requirements

- Node.js 18+
- npm or yarn

## Updating from Template

If you created a project with degit and want to pull template updates:

```bash
# Add template as remote
git remote add template https://github.com/brianwhaley/pixelated-template.git

# Fetch and merge updates
git fetch template
git merge template/main

# Or use the provided script
./scripts/upstream-merge.sh https://github.com/brianwhaley/pixelated-template.git
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Update FEATURE_CHECKLIST.md if adding new features
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- 📖 [Documentation](./FEATURE_CHECKLIST.md)
- 🐛 [Issues](https://github.com/brianwhaley/pixelated-template/issues)
- 💬 [Discussions](https://github.com/brianwhaley/pixelated-template/discussions)

---

Built with ❤️ using [Next.js](https://nextjs.org/) and [Pixelated Components](https://github.com/brianwhaley/pixelated-components)

## Local config

This template reads a unified Pixelated config via the environment variables `PIXELATED_CONFIG_JSON` or `PIXELATED_CONFIG_B64`. For local development, copy `.env.local.example` to `.env.local` and set `PIXELATED_CONFIG_B64` or `PIXELATED_CONFIG_JSON`.

If you prefer a JSON file locally, copy `.local/pixelated.config.json.example` to `.local/pixelated.config.json` and set `PIXELATED_CONFIG_B64` to the base64-encoded contents.

Home page and routing

IMPORTANT: This template uses the App Router (`src/app`) — avoid adding a classic `pages/` directory that duplicates routes. If you add `pages/`, be sure not to overlap route paths with `src/app`.
The template ships with the root `layout.tsx` under `src/app` for shared HEAD/meta and header/footer layout. The sample home page is provided at `src/app/(pages)/(home)/page.tsx` (route group). If you need to create additional pages, add them under `src/app` as nested folders and `page.tsx` files.

Path aliases
------------

This template defines the `@` path alias that resolves to `src`, so you can import files from the app root using e.g. `import Header from '@/app/elements/header'`.
The alias is configured in `tsconfig.json` and `next.config.ts` (webpack alias), and ESLint is set up to resolve it.

Notes: this repository uses `next.config.ts` as the canonical Next.js configuration. If you see a `next.config.js`, it's safe to delete it; `next.config.ts` is the authoritative file and includes the webpack alias configuration.
