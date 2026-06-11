
import Nav from "./components/Nav";
import { Providers } from "./components/providers";
import LayoutClient from "./components/layout-client";
import { headers } from "next/headers";
import { WebsiteSchema, LocalBusinessSchema, ServicesSchema } from "@pixelated-tech/components";
import { PageMetaTags, VisualDesignStyles, PixelatedServerConfigProvider } from "@pixelated-tech/components/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
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
	const pathname = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;

	// Check if running on localhost
	const hostname = reqHeaders.get("host")?.split(':')[0];
	const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

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

	// Check authentication for all routes (except login page)
	if (pathname !== '/login') {
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
						<LayoutClient />
						<Nav />
						{children}
					</Providers>
				</PixelatedServerConfigProvider>
			</body>
		</html>
	);
}
