import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';
import { createPageComponentMocks, resetMockState } from '@/tests/page-mocks';
import { createAppShellServerMocks, createNextHeadersMock, createNextServerMock } from './index.test-utils';

if (typeof globalThis.IntersectionObserver === 'undefined') {
	class IntersectionObserverMock {
		constructor() {}
		observe() {}
		unobserve() {}
		disconnect() {}
	}
	(globalThis as any).IntersectionObserver = IntersectionObserverMock;
}

if (typeof globalThis.fetch === 'function') {
	const originalFetch = globalThis.fetch.bind(globalThis);
	globalThis.fetch = async (input: RequestInfo, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input.url;
		if (typeof url === 'string' && url.includes('sendmail.pixelated.tech')) {
			return new Response(JSON.stringify({ success: true, message: 'Mocked sendmail endpoint' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}
		return originalFetch(input, init);
	};
}

vi.mock('@pixelated-tech/components', async () => {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components')>('@pixelated-tech/components');
	return {
		__esModule: true,
		...actual,
		...createPageComponentMocks(),
	};
});

vi.mock('@pixelated-tech/components/server', async () => createAppShellServerMocks());
vi.mock('next/headers', () => createNextHeadersMock());
vi.mock('next/server', () => createNextServerMock());

beforeEach(() => {
	resetMockState();
	vi.clearAllMocks();
});
