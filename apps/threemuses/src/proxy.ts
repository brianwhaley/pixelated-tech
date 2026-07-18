 

import { handlePixelatedProxy } from "@pixelated-tech/components/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
	const path = req.nextUrl.pathname + (req.nextUrl.search || "");
	const hostName = req.nextUrl?.hostname;
	if (hostName && hostName.endsWith('amplifyapp.com')) {
		return NextResponse.redirect(
			`https://www.thethreemusesofbluffton.com${path}`,
			301
		);
	}

	const response = handlePixelatedProxy(req);

	if (req.nextUrl.pathname === '/events/report' || req.nextUrl.pathname.startsWith('/events/report/')) {
		response.headers.set(
			'Cache-Control',
			'no-store, no-cache, max-age=0, s-maxage=0, must-revalidate',
		);
		response.headers.set('Pragma', 'no-cache');
		response.headers.set('Expires', '0');
	}

	return response;
}

// Limit middleware to page routes (avoid _next static, api, etc.)
export const config = {
	matcher: ["/((?!_next/image|_next/static|api|favicon.ico).*)"],
};
