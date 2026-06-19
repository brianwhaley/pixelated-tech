
import Nav from "./components/Nav";
import { Providers } from "./components/providers";
import LayoutClient from "./components/layout-client";
import { headers } from "next/headers";
import { WebsiteSchema, LocalBusinessSchema, ServicesSchema } from "@pixelated-tech/components";
import { PageMetaTags, VisualDesignStyles, PixelatedServerConfigProvider, getFullPixelatedConfig } from "@pixelated-tech/components/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authentication";
import { getServerSession } from "next-auth";
import { isRouteAllowedForID, normalizeRoutePath } from '@pixelated-tech/components/adminclient';
import authorizationConfig from './data/authorization.json';
import "@pixelated-tech/components/css/pixelated.global.css";
import "@pixelated-tech/components/css/pixelated.grid.scss";
import "./styles/globals.css";

export default async function RootLayout({
	children,
}: Readonly<{
  children: React.ReactNode;
}>) {

	const reqHeaders: Headers = await (headers() as Promise<Headers>);
	const path = reqHeaders.get("x-path") ?? "/";
	const pathname = normalizeRoutePath(path);

	// Check if running on localhost
	const hostname = reqHeaders.get("host")?.split(':')[0];
	const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

	const isPrintRoute = pathname.startsWith('/billing/invoice');
	const urlToken = new URLSearchParams((reqHeaders.get('x-url') ?? '').split('?')[1] || '').get('token');
	const serverToken = getFullPixelatedConfig()?.integrations?.puppeteer?.internalToken;
	const isInternalPuppeteerRequest = isPrintRoute && !!serverToken && urlToken === serverToken;

	// Restrict new deployment page to localhost only
	if (pathname === '/newdeployment' && !isLocalhost) {
		// Check if user is authenticated
		let session;
		try {
			session = await getServerSession(authOptions);
		} catch (error) {
			console.error('Session check failed:', error);
			session = null;
		}
		
		// If authenticated, redirect to home; if not, redirect to login
		if (session) {
			redirect('/');
		} else {
			redirect('/login');
		}
	}

	// Check authentication and authorization for all routes (except login, unauthorized, and internal invoice renders)
	if (pathname !== '/login' && pathname !== '/unauthorized' && !isInternalPuppeteerRequest) {
		let session;
		try {
			session = await getServerSession(authOptions);
		} catch (error) {
			console.error('Session check failed:', error);
			session = null;
		}
		if (!session) {
			redirect('/login');
		}

		const email = session?.user?.email;
		if (!isRouteAllowedForID(email, pathname, authorizationConfig as any)) {
			redirect('/unauthorized');
		}
	}

	return (
		<html lang="en">
			<head>
				<PixelatedServerConfigProvider>
					<PageMetaTags />
					<WebsiteSchema />
					<LocalBusinessSchema />
					<ServicesSchema />
					<VisualDesignStyles />
				</PixelatedServerConfigProvider>
			</head>
			<body>
				<PixelatedServerConfigProvider>
					<Providers>
						{!isPrintRoute && <LayoutClient />}
						{!isPrintRoute && <Nav />}
						{children}
					</Providers>
				</PixelatedServerConfigProvider>
			</body>
		</html>
	);
}
