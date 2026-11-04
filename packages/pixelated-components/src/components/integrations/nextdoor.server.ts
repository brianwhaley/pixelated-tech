"use server";

import type { Page } from 'puppeteer';

export interface NextdoorPublishInput {
	page: Page;
	username: string;
	password: string;
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

async function clickPageControl(page: Page): Promise<void> {
	await page.waitForFunction(() => {
		const controls = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], a'));
		const control = controls.find((candidate) => {
			const style = window.getComputedStyle(candidate);
			const bounds = candidate.getBoundingClientRect();
			const label = [candidate.textContent, candidate.getAttribute('aria-label'), candidate.getAttribute('title')]
				.filter(Boolean)
				.join(' ')
				.replace(/\s+/g, ' ')
				.trim()
				.toLowerCase();
			return style.display !== 'none'
				&& style.visibility !== 'hidden'
				&& bounds.width > 0
				&& bounds.height > 0
				&& label === 'page';
		});
		if (!control) return false;
		control.click();
		return true;
	}, { timeout: 5000 });
}

async function clickPostControl(page: Page): Promise<void> {
	await page.waitForFunction(() => {
		const controls = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], a'));
		const control = controls.find((candidate) => {
			const style = window.getComputedStyle(candidate);
			const bounds = candidate.getBoundingClientRect();
			const label = [candidate.textContent, candidate.getAttribute('aria-label'), candidate.getAttribute('title')]
				.filter(Boolean)
				.join(' ')
				.replace(/\s+/g, ' ')
				.trim()
				.toLowerCase();
			return style.display !== 'none'
				&& style.visibility !== 'hidden'
				&& bounds.width > 0
				&& bounds.height > 0
				&& /^(write\s+a\s+|create\s+)?post\b/.test(label);
		});
		if (!control) return false;
		control.click();
		return true;
	}, { timeout: 30000 });
}

export async function publishToNextdoor(input: NextdoorPublishInput): Promise<void> {
	await input.page.goto('https://nextdoor.com/login/', { waitUntil: 'domcontentloaded' });
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
	await input.page.goto(input.businessPageUrl, { waitUntil: 'domcontentloaded' });

	await clickPageControl(input.page).catch(() => undefined);
	await clickPostControl(input.page);
	await input.page.waitForSelector('textarea, [contenteditable="true"]');

	const message = `${input.title}\n\n${input.excerpt}\n\n${input.url}`;
	const editor = await input.page.$('textarea, [contenteditable="true"]');
	if (!editor) throw new Error('Nextdoor post editor was not found.');
	await editor.click();
	await input.page.keyboard.type(message);

	const publishClicked = await input.page.evaluate(() => {
		const controls = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], a'));
		const control = controls.find((candidate) => {
			const style = window.getComputedStyle(candidate);
			const bounds = candidate.getBoundingClientRect();
			const labels = [candidate.innerText, candidate.textContent, candidate.getAttribute('aria-label'), candidate.getAttribute('title')]
				.filter((label): label is string => Boolean(label))
				.map((label) => label.replace(/\s+/g, ' ').trim().toLowerCase());
			return style.display !== 'none'
				&& style.visibility !== 'hidden'
				&& bounds.width > 0
				&& bounds.height > 0
				&& labels.some((label) => /\b(submit|publish)\b/.test(label) || /^(post|post now)$/.test(label));
		});
		if (!control) return false;
		control.click();
		return true;
	});
	if (!publishClicked) throw new Error('Nextdoor publish control was not found.');
}
