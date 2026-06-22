import { createServerMocks } from './server-mocks';

export async function createAppShellServerMocks() {
	const actual = await vi.importActual<typeof import('@pixelated-tech/components/server')>('@pixelated-tech/components/server');
	return {
		__esModule: true,
		...actual,
		...createServerMocks(),
	};
}

export function createNextHeadersMock() {
	return {
		headers: vi.fn(async () => new Headers({ 'x-path': '/', 'x-origin': 'https://example.com', 'x-url': 'https://example.com/' })),
	};
}

export function createNextServerMock() {
	return {
		NextResponse: {
			next: (options: any) => ({ ...options, headers: new Headers() }),
		},
	};
}
