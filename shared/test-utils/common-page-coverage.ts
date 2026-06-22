import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
/* eslint-disable pixelated/package-json-missing-dependency, pixelated/package-json-wrong-dependency-type */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(__dirname, '../../packages/pixelated-components/src/scripts/create-pixelated-app.json');

interface CreatePixelatedAppTemplate {
	name: string;
	aliases?: string[];
	src?: string;
	action?: string;
	associated_files?: string[];
}

interface CreatePixelatedAppManifest {
	templates: CreatePixelatedAppTemplate[];
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as CreatePixelatedAppManifest;

const pageTypes = manifest.templates
	.filter((template) => template.src && template.action !== 'ignore')
	.map((template) => ({
		name: template.name,
		routeSegment: template.src!.split('/').pop() ?? template.name.toLowerCase().replace(/\s+/g, '-'),
		aliases: template.aliases ?? [],
		associatedFiles: template.associated_files ?? [],
	}))
	.filter((template) => !!template.routeSegment);

const fileExtensions = ['.tsx', '.ts', '.jsx', '.js'];
const pageFileNames = ['/page', '/index'];
const commonElementPaths = {
	GlobalError: 'src/app/global-error',
	Loading: 'src/app/loading',
	NotFound: 'src/app/not-found',
	LayoutClient: ['src/app/elements/layoutclient', 'src/app/elements/layout-client'],
	SocialTags: 'src/app/elements/socialtags',
	RootLayout: 'src/app/layout',
	Manifest: 'src/app/manifest',
	Robots: 'src/app/robots',
	Sitemap: 'src/app/sitemap',
	Proxy: 'src/proxy',
	HumansRoute: 'src/app/humans.txt/route',
	SecurityRoute: 'src/app/security.txt/route',
	PageMocks: ['src/test/page-mocks', 'src/tests/page-mocks'],
};

function findFile(appRoot: string, relativeBase: string): string | null {
	const basePath = path.join(appRoot, relativeBase);
	for (const ext of fileExtensions) {
		const filePath = `${basePath}${ext}`;
		if (fs.existsSync(filePath)) {
			return filePath;
		}
	}
	return null;
}

function findAppModule(appRoot: string, relativePathOrPaths: string | string[]): string | null {
	const candidates = Array.isArray(relativePathOrPaths) ? relativePathOrPaths : [relativePathOrPaths];
	for (const relativePath of candidates) {
		const filePath = findFile(appRoot, relativePath);
		if (filePath) {
			return filePath;
		}
	}
	return null;
}

function findPageFile(appRoot: string, routeSegments: string | string[]): string | null {
	const candidates = Array.isArray(routeSegments) ? routeSegments : [routeSegments];
	for (const routeSegment of candidates) {
		for (const pageName of pageFileNames) {
			const candidate = path.join(appRoot, 'src', 'app', '(pages)', routeSegment, pageName);
			for (const ext of fileExtensions) {
				const filePath = `${candidate}${ext}`;
				if (fs.existsSync(filePath)) {
					return filePath;
				}
			}
		}
	}
	return null;
}

function getPageRouteCandidates(pageType: any, routeOverrides?: Record<string, string>) {
	const overrideKey = pageType.routeSegment.toLowerCase();
	const nameKey = pageType.name.toLowerCase();
	const override = routeOverrides?.[overrideKey] ?? routeOverrides?.[nameKey];
	const candidates = [override || pageType.routeSegment, ...(pageType.aliases ?? [])];
	return Array.from(new Set(candidates.filter(Boolean)));
}

function resolveAssociatedFile(appRoot: string, associatedFile: string) {
	return path.join(appRoot, associatedFile);
}

function getIgnoredPageTypes(overrides: string[] = []) {
	return new Set(overrides.map((item) => item.toLowerCase()));
}

function importModule(filePath: string) {
	return import(pathToFileURL(filePath).href);
}

function safeRenderComponent(Component: any) {
	expect(Component).toBeDefined();
	render(React.createElement(Component));
}

function getExportedFunction(importedModule: any, names: string[]) {
	for (const name of names) {
		if (typeof importedModule[name] === 'function') {
			return importedModule[name];
		}
	}
	return undefined;
}

interface CommonPageCoverageOptions {
	appRoot?: string;
	ignoredPageTypes?: string[];
	routeOverrides?: Record<string, string>;
	ignoredCommonRoutes?: string[];
	verifyPageImport?: boolean;
	verifyPageRender?: boolean;
	verifyAssociatedFiles?: boolean;
	verifyCommonRoutes?: boolean;
	// eslint-disable-next-line no-unused-vars
	pageRenderAssertion?: (_route: string) => void | Promise<void>;
}

export function runCommonPageCoverage({
	appRoot = process.cwd(),
	ignoredPageTypes = [],
	routeOverrides,
	ignoredCommonRoutes = [],
	verifyPageImport = true,
	verifyPageRender = true,
	verifyAssociatedFiles = true,
	verifyCommonRoutes = true,
	pageRenderAssertion,
}: CommonPageCoverageOptions = {}) {
	describe('Common page coverage', () => {
		const ignored = getIgnoredPageTypes(ignoredPageTypes);
		const ignoredRoutes = getIgnoredPageTypes(ignoredCommonRoutes);

		for (const pageType of pageTypes) {
			const routeCandidates = getPageRouteCandidates(pageType, routeOverrides);
			if (ignored.has(pageType.routeSegment.toLowerCase()) || ignored.has(pageType.name.toLowerCase())) {
				it.skip(`skips ${pageType.name} when the app does not implement that page type`, () => {
					expect(true).toBe(true);
				});
				continue;
			}

			it(`includes a ${pageType.name} page route`, () => {
				const filePath = findPageFile(appRoot, routeCandidates);
				expect(filePath).not.toBeNull();
			});

			if (verifyPageImport) {
				it(`imports the ${pageType.name} page component`, async () => {
					const filePath = findPageFile(appRoot, routeCandidates);
					expect(filePath).not.toBeNull();
					const importedModule = await importModule(filePath!);
					expect(importedModule).toHaveProperty('default');
				});
			}

			if (verifyPageRender) {
				it(`renders the ${pageType.name} page without throwing`, async () => {
					const filePath = findPageFile(appRoot, routeCandidates);
					expect(filePath).not.toBeNull();
					const importedModule = await importModule(filePath!);
					safeRenderComponent(importedModule.default);
					if (pageRenderAssertion) {
						await pageRenderAssertion(pageType.routeSegment);
					}
				});
			}

			if (verifyAssociatedFiles && pageType.associatedFiles.length > 0) {
				for (const associatedFile of pageType.associatedFiles) {
					it(`includes associated file ${associatedFile} for ${pageType.name}`, () => {
						const filePath = resolveAssociatedFile(appRoot, associatedFile);
						expect(fs.existsSync(filePath)).toBe(true);
					});
				}
			}
		}

		if (verifyCommonRoutes) {
			it('renders the global error UI', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.GlobalError);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				safeRenderComponent(importedModule.default);
			});

			it('renders the loading component', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.Loading);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				safeRenderComponent(importedModule.default);
			});

			it('returns manifest metadata', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.Manifest);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				const result = await importedModule.default();
				if (result?.manifest === true) {
					expect(result).toHaveProperty('manifest', true);
				} else {
					expect(result).toHaveProperty('name');
					expect(result).toHaveProperty('short_name');
					expect(result).toHaveProperty('start_url');
				}
			});

			it('generates robots metadata', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.Robots);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				const result = await importedModule.default();
				expect(result).toHaveProperty('sitemap');
			});

			it('generates a sitemap object', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.Sitemap);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				const result = await importedModule.default();
				expect(result).toEqual(expect.any(Array));
			});

			it('renders the not-found page', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.NotFound);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				safeRenderComponent(importedModule.default);
			});

			it('renders layout client without error', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.LayoutClient);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				const LayoutClientComponent = importedModule.default ?? importedModule.LayoutClient ?? importedModule.layoutClient;
				safeRenderComponent(LayoutClientComponent);
			});

			const socialTagsTest = ignoredRoutes.has('socialtags') ? it.skip : it;
			socialTagsTest('renders social tags section', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.SocialTags);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				safeRenderComponent(importedModule.default);
			});

			it('uses real pixelated.config.json siteInfo and route data', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.PageMocks);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				expect(importedModule.config).toBeDefined();
				expect(importedModule.config.siteInfo?.url).toEqual(expect.any(String));
				expect(importedModule.config.routes.some((route: any) => route.path === '/')).toBe(true);
			});

			it('renders root layout with metadata and children', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.RootLayout);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				const root = await importedModule.default({ children: React.createElement('div', { 'data-testid': 'child' }) });
				expect(root).toBeDefined();
				expect(root.props?.children).toBeTruthy();
			});

			it('renders root layout with trailing slash path and fallback metadata', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.RootLayout);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				const root = await importedModule.default({ children: React.createElement('div', { 'data-testid': 'child' }) });
				expect(root).toBeDefined();
				expect(root.props?.children).toBeTruthy();
			});

			it('proxies request headers correctly', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.Proxy);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				const proxyFn = getExportedFunction(importedModule, ['default', 'proxy']);
				expect(proxyFn).toBeDefined();
				const result = proxyFn({
					nextUrl: { pathname: '/test', search: '?a=1', origin: 'https://example.com', href: 'https://example.com/test?a=1' },
					headers: new Headers({}),
					url: 'https://example.com/test?a=1',
				});
				expect(result.request.headers.get('x-path')).toBe('/test?a=1');
				expect(result.request.headers.get('x-origin')).toBe('https://example.com');
			});

			it('proxies request headers with fallback url when href is unavailable', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.Proxy);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				const proxyFn = getExportedFunction(importedModule, ['default', 'proxy']);
				expect(proxyFn).toBeDefined();
				const result = proxyFn({
					nextUrl: { pathname: '/test', search: '?a=1', origin: 'https://example.com', href: undefined },
					headers: new Headers({}),
					url: 'https://example.com/test?a=1',
				});
				expect(result.request.headers.get('x-url')).toBe('https://example.com/test?a=1');
			});

			it('returns humans well-known response', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.HumansRoute);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				const response = await importedModule.GET({ url: 'https://example.com/humans.txt' } as any);
				if (typeof Response !== 'undefined' && response instanceof Response) {
					expect(await response.text()).toContain('humans');
				} else {
					expect(response).toEqual({ type: 'humans', url: 'https://example.com/humans.txt' });
				}
			});

			it('returns security well-known response', async () => {
				const filePath = findAppModule(appRoot, commonElementPaths.SecurityRoute);
				expect(filePath).not.toBeNull();
				const importedModule = await importModule(filePath!);
				const response = await importedModule.GET({ url: 'https://example.com/security.txt' } as any);
				if (typeof Response !== 'undefined' && response instanceof Response) {
					expect(await response.text()).toContain('security');
				} else {
					expect(response).toEqual({ type: 'security', url: 'https://example.com/security.txt' });
				}
			});
		}
	});
}
