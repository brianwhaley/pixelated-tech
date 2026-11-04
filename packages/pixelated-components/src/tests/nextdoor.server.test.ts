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
	keyboard: { type: ReturnType<typeof vi.fn> };
};

function createPage(overrides: Partial<MockPage> = {}): MockPage {
	const fields = {
		username: { click: vi.fn(), type: vi.fn() },
		password: { click: vi.fn(), type: vi.fn() },
		editor: { click: vi.fn() },
		publish: { click: vi.fn() },
	};
	const page: MockPage = {
		goto: vi.fn(),
		waitForSelector: vi.fn(),
		$: vi.fn((selector: string) => {
			if (selector.includes('placeholder') && selector.includes('email')) return fields.username;
			if (selector.includes('placeholder') && selector.includes('password')) return fields.password;
			if (selector.includes('contenteditable')) return fields.editor;
			if (selector.includes('button[type="submit"]')) return fields.publish;
			return null;
		}),
		click: vi.fn(),
		waitForNavigation: vi.fn().mockResolvedValue(undefined),
		waitForFunction: vi.fn(async (predicate: () => boolean) => predicate()),
		evaluate: vi.fn().mockResolvedValue(true),
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
		<button style="display: none">Page</button>
		<button id="page-control">Page</button>
		<button style="display: none">${postLabel}</button>
		<button style="visibility: hidden">${postLabel}</button>
		<button id="zero-size-post">${postLabel}</button>
		<button id="post-control">${postLabel}</button>
	`;
	for (const id of ['page-control', 'post-control']) {
		const control = document.getElementById(id);
		if (control) Object.defineProperty(control, 'getBoundingClientRect', { value: () => ({ width: 100, height: 20 }) });
	}
}

describe('publishToNextdoor', () => {
	it('logs in, opens the configured page, fills the post, and publishes', async () => {
		addRenderedPostControls();
		const page = createPage({ waitForNavigation: vi.fn().mockRejectedValue(new Error('navigation already settled')) });

		await publishToNextdoor(input(page));

		expect(page.goto).toHaveBeenNthCalledWith(1, 'https://nextdoor.com/login/', { waitUntil: 'domcontentloaded' });
		expect(page.goto).toHaveBeenNthCalledWith(2, 'https://nextdoor.com/page/example', { waitUntil: 'domcontentloaded' });
		expect(page.waitForSelector).toHaveBeenCalledWith(expect.stringContaining('email'), { visible: true });
		expect(page.waitForSelector).toHaveBeenCalledWith(expect.stringContaining('password'), { visible: true });
		expect(page.click).toHaveBeenCalledWith('button[type="submit"]');
		expect(page.waitForFunction).toHaveBeenCalledTimes(2);
		expect(page.keyboard.type).toHaveBeenCalledWith('A new post\n\nUseful local information.\n\nhttps://example.com/post');
		expect(page.evaluate).toHaveBeenCalledTimes(1);
	});

	it('clicks Nextdoor\'s Write a post control', async () => {
		addRenderedPostControls('Write a post');
		const page = createPage({ waitForNavigation: vi.fn().mockRejectedValue(new Error('navigation already settled')) });

		await expect(publishToNextdoor(input(page))).resolves.toBeUndefined();
		expect(page.waitForFunction).toHaveBeenCalledTimes(2);
	});

	it('continues when the optional Page control is unavailable', async () => {
		const page = createPage({
			waitForFunction: vi.fn()
				.mockRejectedValueOnce(new Error('Page control unavailable'))
				.mockResolvedValueOnce(undefined),
		});

		await expect(publishToNextdoor(input(page))).resolves.toBeUndefined();
		expect(page.waitForFunction).toHaveBeenCalledTimes(2);
	});

	it('throws when no login field matches the configured selectors', async () => {
		const page = createPage({ $: vi.fn().mockReturnValue(null) });

		await expect(publishToNextdoor(input(page))).rejects.toThrow('Nextdoor field not found:');
	});

	it('throws when the editor is missing', async () => {
		const page = createPage({
			$: vi.fn((selector: string) => selector.includes('contenteditable') ? null : { click: vi.fn(), type: vi.fn() }),
		});

		await expect(publishToNextdoor(input(page))).rejects.toThrow('Nextdoor post editor was not found.');
	});

	it('throws when the publish control is missing', async () => {
		const page = createPage({
			$: vi.fn((selector: string) => selector.includes('button[type="submit"]') ? null : { click: vi.fn(), type: vi.fn() }),
			evaluate: vi.fn().mockResolvedValue(false),
		});

		await expect(publishToNextdoor(input(page))).rejects.toThrow('Nextdoor publish control was not found.');
	});
});
