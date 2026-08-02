import { headers } from 'next/headers';
import { PageMetaTags, PixelatedServerConfigProvider, getRouteByKey, getFullPixelatedConfig, SchemaWebPage } from '@pixelated-tech/components/server';
import { WebsiteSchema, LocalBusinessSchema } from "@pixelated-tech/components";
import { BreadcrumbListSchema } from "@pixelated-tech/components/server";
import { GoogleFonts } from "@pixelated-tech/components/server";
import { VisualDesignStyles } from "@pixelated-tech/components/server";
import { ContentfulAlerts } from '@pixelated-tech/components';
import LayoutClient from '@/app/elements/layout-client';
import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import "@pixelated-tech/components/css/pixelated.global.css";
import "@pixelated-tech/components/css/pixelated.grid.scss";
import './styles/globals.css';

export default async function RootLayout({
	children,
}: Readonly<{
  children: React.ReactNode;
}>) {
	const reqHeaders: Headers = await (headers() as Promise<Headers>);
	const path = reqHeaders.get('x-path') ?? '/';
	const pathname = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
	const pixelatedConfig = getFullPixelatedConfig();
	const metadata = getRouteByKey(pixelatedConfig.routes, 'path', pathname) ?? {};

	return (
		<html lang="en">
			<LayoutClient />
			<head>
				<PixelatedServerConfigProvider>
					<PageMetaTags />
					<BreadcrumbListSchema />
					<SchemaWebPage {...metadata} />
					<WebsiteSchema />
					<LocalBusinessSchema />
					<VisualDesignStyles />
					<GoogleFonts />
				</PixelatedServerConfigProvider>
			</head>
			<body>
				<PixelatedServerConfigProvider>
					<header><Header /></header>
					<nav><Nav /></nav>
					<main>
						<ContentfulAlerts alertContentType="alert" />
						{children}
					</main>
					<footer><Footer /></footer>
				</PixelatedServerConfigProvider>
			</body>
		</html>
	);
}
