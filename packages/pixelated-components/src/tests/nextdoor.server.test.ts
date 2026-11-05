import { describe, expect, it, vi } from 'vitest';
import { publishToNextdoor, type NextdoorPublishInput } from '../components/integrations/nextdoor.server';

type MockPage = {
	goto: ReturnType<typeof vi.fn>;
	waitForSelector: ReturnType<typeof vi.fn>;
	$: ReturnType<typeof vi.fn>;
	click: ReturnType<typeof vi.fn>;
	waitForNavigation: ReturnType<typeof vi.fn>;
	waitForFunction: ReturnType<typeof vi.fn>;
	evaluate: ReturnType<typeof vi.fn>;
	mouse: { click: ReturnType<typeof vi.fn> };
	setDefaultNavigationTimeout: ReturnType<typeof vi.fn>;
	setDefaultTimeout: ReturnType<typeof vi.fn>;
	keyboard: { type: ReturnType<typeof vi.fn> };
};

function createPage(overrides: Partial<MockPage> = {}): MockPage {
	const fields = {
		username: { click: vi.fn(), type: vi.fn() },
		password: { click: vi.fn(), type: vi.fn() },
		editor: { click: vi.fn(), type: vi.fn() },
		publish: { click: vi.fn() },
	};
	const page: MockPage = {
		goto: vi.fn(),
		waitForSelector: vi.fn(),
		$: vi.fn((selector: string) => {
			if (selector.includes('placeholder') && selector.includes('email')) return fields.username;
			if (selector.includes('placeholder') && selector.includes('password')) return fields.password;
			if (selector.includes('composer-text-field')) return fields.editor;
			if (selector.includes('button[type="submit"]')) return fields.publish;
			return null;
		}),
		click: vi.fn(),
		waitForNavigation: vi.fn().mockResolvedValue(undefined),
		waitForFunction: vi.fn(async (predicate: (...args: unknown[]) => boolean, ...args: unknown[]) => args.length ? true : predicate()),
		evaluate: vi.fn().mockResolvedValue(true),
		mouse: { click: vi.fn() },
		setDefaultNavigationTimeout: vi.fn(),
		setDefaultTimeout: vi.fn(),
		keyboard: { type: vi.fn() },
		...overrides,
	};
	return page;
}

function input(page: MockPage): NextdoorPublishInput {
	return {
		page: page as never,
		username: 'user@example.com',
		password: 'password',
		businessPageUrl: 'https://nextdoor.com/page/example',
		title: 'A new post',
		excerpt: 'Useful local information.',
		url: 'https://example.com/post',
	};
}

function addRenderedPostControls(postLabel = 'Post'): void {
	document.body.innerHTML = `
		<button data-integration-id="post" data-part="tapArea" style="display: none">${postLabel}</button>
		<button data-integration-id="post" data-part="tapArea" style="visibility: hidden">${postLabel}</button>
		<button id="zero-size-post" data-integration-id="post" data-part="tapArea">${postLabel}</button>
		<button id="post-control" data-integration-id="post" data-part="tapArea">${postLabel}</button>
	`;
	for (const id of ['post-control']) {
		const control = document.getElementById(id);
		if (control) Object.defineProperty(control, 'getBoundingClientRect', { value: () => ({ width: 100, height: 20 }) });
	}
}

describe('publishToNextdoor', () => {
	it('logs in, selects the business page, fills the text field, and publishes', async () => {
		addRenderedPostControls();
		const page = createPage({ waitForNavigation: vi.fn().mockRejectedValue(new Error('navigation already settled')) });

		await publishToNextdoor(input(page));

		expect(page.goto).toHaveBeenNthCalledWith(1, 'https://nextdoor.com/login/', { waitUntil: 'domcontentloaded' });
		expect(page.waitForSelector).toHaveBeenCalledWith(expect.stringContaining('email'), { visible: true });
		expect(page.waitForSelector).toHaveBeenCalledWith(expect.stringContaining('password'), { visible: true });
		expect(page.waitForSelector).toHaveBeenCalledWith('a[href*="/page-admin/home/"]', { visible: true });
		expect(page.waitForSelector).toHaveBeenCalledWith('button[data-integration-id="post"][data-part="tapArea"]', { visible: true });
		expect(page.click).toHaveBeenCalledWith('button[type="submit"]');
		expect(page.setDefaultNavigationTimeout).toHaveBeenCalledWith(120000);
		expect(page.setDefaultTimeout).toHaveBeenCalledWith(120000);
		expect(page.waitForFunction).toHaveBeenCalledTimes(5);
		expect(page.$).toHaveBeenCalledWith('textarea[data-testid="composer-text-field"]');
		expect(page.evaluate).toHaveBeenCalledTimes(9);
	});

	it('clicks Nextdoor\'s Write a post control', async () => {
		addRenderedPostControls('Write a post');
		const page = createPage({ waitForNavigation: vi.fn().mockRejectedValue(new Error('navigation already settled')) });

		await expect(publishToNextdoor(input(page))).resolves.toBeUndefined();
		expect(page.waitForFunction).toHaveBeenCalledTimes(5);
	});

	it('throws when no login field matches the configured selectors', async () => {
		const page = createPage({ $: vi.fn().mockReturnValue(null) });

		await expect(publishToNextdoor(input(page))).rejects.toThrow('Nextdoor field not found:');
	});

	it('throws when the editor is missing', async () => {
		const page = createPage({
			waitForSelector: vi.fn((selector: string) => selector.includes('composer-text-field')
				? Promise.reject(new Error('composer text field missing'))
				: Promise.resolve()),
		});

		await expect(publishToNextdoor(input(page))).rejects.toThrow('composer text field missing');
	});

	it('throws when the publish control is missing', async () => {
		addRenderedPostControls();
		const page = createPage({
			$: vi.fn((selector: string) => selector.includes('button[type="submit"]') ? null : { click: vi.fn(), type: vi.fn() }),
			evaluate: vi.fn(async (callback: unknown) => {
				const source = String(callback);
				return !source.includes('editorBounds');
			}),
		});

		await expect(publishToNextdoor(input(page))).rejects.toThrow('Nextdoor publish control was not found.');
	});
});
