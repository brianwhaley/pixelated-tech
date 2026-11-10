"use server";

import type { Page } from 'puppeteer';

const debug = false;
const nextdoorTimeout = 120000;
const postControlSelector = 'button[data-integration-id="post"][data-part="tapArea"]';

async function debugPageState(page: Page, label: string, startedAt: number): Promise<void> {
	if (!debug) return;
	try {
		const state = await page.evaluate((selector) => {
			const describe = (element: HTMLElement) => {
				const bounds = element.getBoundingClientRect();
				const style = window.getComputedStyle(element);
				return {
					tag: element.tagName.toLowerCase(),
					text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300),
					ariaLabel: element.getAttribute('aria-label'),
					dataIntegrationId: element.getAttribute('data-integration-id'),
					dataPart: element.getAttribute('data-part'),
					disabled: element instanceof HTMLButtonElement ? element.disabled : false,
					display: style.display,
					visibility: style.visibility,
					opacity: style.opacity,
					width: bounds.width,
					height: bounds.height,
					x: bounds.x,
					y: bounds.y,
					outerHTML: element.outerHTML.slice(0, 500),
				};
			};
			const body = document.body;
			return {
				url: window.location.href,
				pathname: window.location.pathname,
				viewport: { width: window.innerWidth, height: window.innerHeight },
				userAgent: navigator.userAgent,
				bodyText: (body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 2000),
				bodyHtml: (body?.innerHTML || '').replace(/(value|content)=(["']).*?\2/gi, '$1=$2[redacted]$2').slice(0, 10000),
				postControls: Array.from(document.querySelectorAll<HTMLElement>(selector)).map(describe),
				composer: describe(document.querySelector<HTMLElement>('textarea[data-testid="composer-text-field"]') || document.body),
			};
		}, postControlSelector);
		console.log(`[Nextdoor debug] ${label}`, JSON.stringify({ elapsedMs: Date.now() - startedAt, ...state }));
	} catch (error) {
		console.log(`[Nextdoor debug] ${label} failed`, error instanceof Error ? error.message : String(error));
	}
}

async function debugScreenshot(page: Page, label: string): Promise<void> {
	if (!debug) return;
	try {
		const path = `/tmp/nextdoor-${label}-${Date.now()}.png`;
		await page.screenshot({ path, fullPage: true });
		console.log(`[Nextdoor debug] screenshot: ${path}`);
	} catch (error) {
		console.log('[Nextdoor debug] screenshot failed', error instanceof Error ? error.message : String(error));
	}
}

async function settlePage(page: Page, milliseconds: number): Promise<void> {
	await page.evaluate((delayMilliseconds) => new Promise<void>((resolve) => setTimeout(resolve, delayMilliseconds)), milliseconds);
}

export interface NextdoorPublishInput {
	page: Page;
	username: string;
	password: string;
	authenticated?: boolean;
	businessPageUrl: string;
	title: string;
	excerpt: string;
	url: string;
}

async function fillFirst(page: Page, selectors: string[], value: string): Promise<void> {
	await page.waitForSelector(selectors.join(', '), { visible: true });
	for (const selector of selectors) {
		const field = await page.$(selector);
		if (field) {
			await field.click();
			await field.type(value);
			return;
		}
	}
	throw new Error(`Nextdoor field not found: ${selectors.join(', ')}`);
}

async function selectBusinessPage(page: Page, businessPageUrl: string): Promise<void> {
	const businessPageUrlObject = new URL(businessPageUrl);
	const slug = businessPageUrlObject.pathname.split('/').filter(Boolean).pop();
	if (!slug) throw new Error('Nextdoor business page URL does not contain a page name.');
	const pageName = decodeURIComponent(slug).replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
	const expectedPath = businessPageUrlObject.pathname.replace(/\/+$/, '') || '/';
	const clickAvatar = async (): Promise<void> => {
		const avatarPoint = await page.evaluate(() => {
			const candidates = Array.from(document.querySelectorAll<HTMLElement>('img, [role="img"]'))
				.filter((candidate) => {
					const bounds = candidate.getBoundingClientRect();
					const style = window.getComputedStyle(candidate);
					return style.display !== 'none'
						&& style.visibility !== 'hidden'
						&& bounds.width > 0
						&& bounds.height > 0
						&& bounds.y < 60
						&& bounds.x > window.innerWidth * 0.75;
				})
				.sort((left, right) => right.getBoundingClientRect().x - left.getBoundingClientRect().x);
			const avatar = candidates[0];
			if (!avatar) return null;
			const bounds = avatar.getBoundingClientRect();
			return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
		});
		if (!avatarPoint) throw new Error('Nextdoor account avatar was not found.');
		await page.mouse.click(avatarPoint.x, avatarPoint.y);
		await settlePage(page, 1000);
	};
	const getMenuAction = async (): Promise<string> => {
		await page.waitForFunction(() => Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], a[href]')).some((candidate) => {
			const style = window.getComputedStyle(candidate);
			const bounds = candidate.getBoundingClientRect();
			const text = (candidate.innerText || candidate.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
			return style.display !== 'none'
				&& style.visibility !== 'hidden'
				&& bounds.width > 0
				&& bounds.height > 0
				&& (text === 'view page' || text === 'view profile');
		}), { timeout: nextdoorTimeout });
		return page.evaluate(() => {
			const candidates = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], a[href]'));
			const action = candidates.find((candidate) => {
				const style = window.getComputedStyle(candidate);
				const bounds = candidate.getBoundingClientRect();
				const text = (candidate.innerText || candidate.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
				return style.display !== 'none'
					&& style.visibility !== 'hidden'
					&& bounds.width > 0
					&& bounds.height > 0
					&& (text === 'view page' || text === 'view profile');
			});
			return (action?.innerText || action?.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
		});
	};
	const clickViewPage = async (): Promise<void> => {
		let clicked = false;
		try {
			clicked = await page.evaluate((path) => {
				const candidate = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], a[href]')).find((link) => {
					const style = window.getComputedStyle(link);
					const bounds = link.getBoundingClientRect();
					const text = (link.innerText || link.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
					return style.display !== 'none'
						&& style.visibility !== 'hidden'
						&& bounds.width > 0
						&& bounds.height > 0
						&& text.includes('view page')
						&& (!link.hasAttribute('href') || new URL(link.getAttribute('href') || '', window.location.href).pathname === path);
				});
				if (!candidate) return false;
				candidate.click();
				return true;
			}, expectedPath);
		} catch (error) {
			if (!(error instanceof Error) || !/execution context was destroyed|navigation/i.test(error.message)) throw error;
			clicked = true;
		}
		if (!clicked) throw new Error(`Nextdoor View Page control was not found: ${expectedPath}`);
		await page.waitForFunction((path) => window.location.pathname === path, { timeout: nextdoorTimeout }, expectedPath);
	};

	await clickAvatar();
	const menuAction = await getMenuAction();
	if (menuAction === 'view page') {
		await clickViewPage();
		return;
	}
	if (menuAction !== 'view profile') throw new Error(`Nextdoor account menu state was not recognized: ${menuAction || 'unknown'}`);

	await page.waitForFunction((expectedPageName) => {
		const normalizedPageName = expectedPageName.replace(/\s+/g, ' ').trim().toLowerCase();
		const links = document.querySelectorAll<HTMLAnchorElement>('a[href*="/page-admin/home/"][href*="profile_id="]');
		for (const candidate of links) {
			const style = window.getComputedStyle(candidate);
			const bounds = candidate.getBoundingClientRect();
			if (style.display !== 'none'
				&& style.visibility !== 'hidden'
				&& bounds.width > 0
				&& bounds.height > 0
				&& (candidate.innerText || candidate.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase() === normalizedPageName) return true;
		}
		return false;
	}, { timeout: nextdoorTimeout }, pageName);
	let selected = false;
	try {
		selected = await page.evaluate((expectedPageName) => {
			const normalizedPageName = expectedPageName.replace(/\s+/g, ' ').trim().toLowerCase();
			const links = document.querySelectorAll<HTMLAnchorElement>('a[href*="/page-admin/home/"][href*="profile_id="]');
			for (const candidate of links) {
				const style = window.getComputedStyle(candidate);
				const bounds = candidate.getBoundingClientRect();
				if (style.display !== 'none'
					&& style.visibility !== 'hidden'
					&& bounds.width > 0
					&& bounds.height > 0
					&& (candidate.innerText || candidate.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase() === normalizedPageName) {
					candidate.click();
					return true;
				}
			}
			return false;
		}, pageName);
	} catch (error) {
		if (!(error instanceof Error) || !/execution context was destroyed|navigation/i.test(error.message)) throw error;
		selected = true;
	}
	if (!selected) throw new Error(`Nextdoor business page was not found in the account menu: ${pageName}`);

	await page.waitForFunction(() => window.location.pathname.includes('/page-admin/home/'), { timeout: nextdoorTimeout });
	await settlePage(page, 1000);
	await clickAvatar();
	if (await getMenuAction() !== 'view page') throw new Error('Nextdoor business profile did not expose a View Page control.');
	await clickViewPage();
}

async function clickPostControl(page: Page, startedAt: number): Promise<void> {
	await debugPageState(page, 'before-page-post-wait', startedAt);
	try {
		await page.waitForFunction(() => {
			const selectors = ['#navigation button', 'button[data-integration-id="post"][data-part="tapArea"]'];
			return selectors.some((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)).some((candidate) => {
				const style = window.getComputedStyle(candidate);
				const bounds = candidate.getBoundingClientRect();
				return style.display !== 'none' && style.visibility !== 'hidden' && bounds.width > 0 && bounds.height > 0;
			}));
		}, { timeout: nextdoorTimeout });
	} catch (error) {
		await debugPageState(page, 'page-post-wait-failed', startedAt);
		await debugScreenshot(page, 'page-post-wait-failed');
		throw error;
	}
	const clicked = await page.evaluate(() => {
		const controls = Array.from(document.querySelectorAll<HTMLElement>('#navigation button, button[data-integration-id="post"][data-part="tapArea"]'));
		const control = controls.find((candidate) => {
			const style = window.getComputedStyle(candidate);
			const bounds = candidate.getBoundingClientRect();
			return style.display !== 'none'
				&& style.visibility !== 'hidden'
				&& bounds.width > 0
				&& bounds.height > 0;
		});
		if (!control) return false;
		control.click();
		return true;
	});
	if (!clicked) throw new Error('Nextdoor Post control was not found.');
}

export async function publishToNextdoor(input: NextdoorPublishInput): Promise<void> {
	const startedAt = Date.now();
	input.page.setDefaultNavigationTimeout(nextdoorTimeout);
	input.page.setDefaultTimeout(nextdoorTimeout);
	if (input.authenticated) {
		await input.page.goto('https://nextdoor.com/', { waitUntil: 'domcontentloaded' });
		await settlePage(input.page, 3000);
		await debugPageState(input.page, 'authenticated-session-loaded', startedAt);
	} else {
		await input.page.goto('https://nextdoor.com/login/', { waitUntil: 'domcontentloaded' });
		await debugPageState(input.page, 'login-loaded', startedAt);
		await fillFirst(input.page, [
			'input[placeholder*="email" i]',
			'input[aria-label*="email" i]',
			'input[name="email"]',
			'input[name="username"]',
			'input[type="email"]',
			'input[type="text"]',
		], input.username);
		await fillFirst(input.page, [
			'input[placeholder*="password" i]',
			'input[aria-label*="password" i]',
			'input[name="password"]',
			'input[type="password"]',
		], input.password);
		await input.page.click('button[type="submit"]');
		await input.page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => undefined);
		await settlePage(input.page, 3000);
		await debugPageState(input.page, 'login-complete', startedAt);
	}
	await selectBusinessPage(input.page, input.businessPageUrl);
	await debugPageState(input.page, 'public-page-selected', startedAt);

	await clickPostControl(input.page, startedAt);
	await settlePage(input.page, 1500);
	await input.page.waitForSelector('textarea[data-testid="composer-text-field"]', { visible: true });
	await debugPageState(input.page, 'composer-loaded', startedAt);

	const message = `${input.title}\n\n${input.excerpt}\n\n${input.url}`;
	const editor = await input.page.$('textarea[data-testid="composer-text-field"]');
	if (!editor) throw new Error('Nextdoor composer text field was not found.');
	await editor.click();
	await editor.type(message);

	const expectedUrl = input.url.trim();
	if (!expectedUrl) throw new Error('Nextdoor post URL is required before publishing.');
	await input.page.waitForFunction((url) => {
		const editor = document.querySelector<HTMLTextAreaElement>('textarea[data-testid="composer-text-field"]');
		return Boolean(editor?.value.includes(url));
	}, { timeout: nextdoorTimeout }, expectedUrl);
	await settlePage(input.page, 5000);

	const publishClicked = await input.page.evaluate(() => {
		const editor = document.querySelector<HTMLTextAreaElement>('textarea[data-testid="composer-text-field"]');
		if (!editor || !editor.value.trim()) return false;
		const editorBounds = editor.getBoundingClientRect();
		const dialog = editor.closest<HTMLElement>('[role="dialog"], [aria-modal="true"]');
		const selector = 'button[data-integration-id="post"][data-part="tapArea"], div[data-part="children"], button, [role="button"]';
		const roots: ParentNode[] = dialog ? [dialog, document] : [document];
		const controls = new Set<HTMLElement>();
		for (const root of roots) {
			for (const candidate of Array.from(root.querySelectorAll<HTMLElement>(selector))) {
				const style = window.getComputedStyle(candidate);
				const bounds = candidate.getBoundingClientRect();
				const text = (candidate.innerText || candidate.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
				if (style.display === 'none' || style.visibility === 'hidden' || bounds.width <= 0 || bounds.height <= 0 || text !== 'post') continue;
				controls.add(candidate.closest<HTMLElement>('div[data-part="button"], button, [role="button"]') || candidate);
			}
			if (controls.size && dialog && root === dialog) break;
		}
		const control = Array.from(controls).sort((left, right) => {
			const leftBounds = left.getBoundingClientRect();
			const rightBounds = right.getBoundingClientRect();
			const leftDistance = Math.abs(leftBounds.x - editorBounds.x) + Math.abs(leftBounds.y - editorBounds.y);
			const rightDistance = Math.abs(rightBounds.x - editorBounds.x) + Math.abs(rightBounds.y - editorBounds.y);
			return leftDistance - rightDistance;
		})[0];
		if (control instanceof HTMLButtonElement && control.disabled) return false;
		if (!control) return false;
		if (control.getAttribute('aria-disabled') === 'true') return false;
		control.click();
		return true;
	});
	if (!publishClicked) throw new Error('Nextdoor publish control was not found.');
	await input.page.waitForFunction(() => !document.querySelector('textarea[data-testid="composer-text-field"]'), { timeout: nextdoorTimeout });
}
