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
	class NextResponse extends Response {
		constructor(body?: BodyInit | null, init?: ResponseInit) {
			super(body, init);
		}

		static next(options: any) {
			const response = new NextResponse(null, { status: 200, headers: new Headers(), ...options });
			if (options?.request) {
				(response as any).request = options.request;
			}
			return response;
		}

		static redirect(url: string, status: number = 307) {
			const response = new NextResponse(null, { status, headers: new Headers({ location: url }) });
			(response as any).request = { headers: new Headers() };
			return response;
		}

		static json(body: any, init?: ResponseInit) {
			return new NextResponse(JSON.stringify(body), { ...init, headers: init?.headers ?? new Headers({ 'Content-Type': 'application/json' }), status: init?.status ?? 200 });
		}
	}

	return {
		NextResponse,
	};
}
