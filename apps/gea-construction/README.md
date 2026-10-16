# Pixelated Template

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

### Projects configuration

The Projects page reads `integrations.contentful.projectsContentType` from
`src/app/config/pixelated.config.json`. Its value preserves this site's existing
Contentful project content-type ID. Missing or blank values produce an explicit
configuration error. After editing the configuration, run `npm run config:encrypt`
to synchronize the encrypted configuration before deployment.

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
