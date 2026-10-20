import { describe, expect, it, vi } from 'vitest';

const page = {
	goto: vi.fn(async () => undefined),
	keyboard: { type: vi.fn(async () => undefined), press: vi.fn(async () => undefined) },
	waitForFunction: vi.fn(async () => undefined),
	waitForSelector: vi.fn(async () => undefined),
	$eval: vi.fn(async () => '<a>result</a>'),
	close: vi.fn(async () => undefined),
};
vi.mock('../lib/puppeteer', () => ({ openNewPage: vi.fn(async () => page) }));

describe('Google AI search helper', () => {
	it('returns the main result HTML and closes the page', async () => {
		const { searchMainColumnHtml } = await import('../lib/google-ai-search');
		expect(await searchMainColumnHtml({} as never, 'acme')).toBe('<a>result</a>');
		expect(page.keyboard.type).toHaveBeenCalledWith('acme');
		expect(page.close).toHaveBeenCalled();
	});

	it('returns empty HTML when results are unavailable', async () => {
		page.waitForSelector.mockRejectedValueOnce(new Error('missing'));
		expect(await (await import('../lib/google-ai-search')).searchMainColumnHtml({} as never, 'none')).toBe('');
	});

	it('continues when the URL heuristic fails and returns empty evaluated HTML', async () => {
		page.waitForFunction.mockRejectedValueOnce(new Error('mstk missing'));
		page.waitForSelector.mockResolvedValueOnce(undefined);
		page.$eval.mockResolvedValueOnce('');
		expect(await (await import('../lib/google-ai-search')).searchMainColumnHtml({} as never, 'fallback')).toBe('');
	});

	it('ignores page close failures during cleanup', async () => {
		page.close.mockRejectedValueOnce(new Error('already closed'));
		expect(await (await import('../lib/google-ai-search')).searchMainColumnHtml({} as never, 'closed')).toBe('<a>result</a>');
	});
});
