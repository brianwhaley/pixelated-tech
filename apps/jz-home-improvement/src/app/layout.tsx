import { headers } from 'next/headers';
import { getRouteByKey } from '@pixelated-tech/components/server';
import { generateMetaTags } from "@pixelated-tech/components/server";
import { WebsiteSchema, LocalBusinessSchema, ServicesSchema, BreadcrumbListSchema } from '@pixelated-tech/components';
import { PixelatedServerConfigProvider } from '@pixelated-tech/components/server';
import { VisualDesignStyles } from "@pixelated-tech/components/server";
import type { SiteInfo } from '@pixelated-tech/components/server';
import LayoutClient from '@/app/elements/layout-client';
import Header from '@/app/elements/header';
import Nav from '@/app/elements/nav';
import Footer from '@/app/elements/footer';
import myRoutes from "@/app/data/routes.json";
import "@pixelated-tech/components/css/pixelated.global.css";
import "@pixelated-tech/components/css/pixelated.grid.scss";
import './styles/globals.css';

export default async function RootLayout({
	children,
}: Readonly<{
  children: React.ReactNode;
}>) {

	const reqHeaders: Headers = await (headers() as Promise<Headers>);
	const path = reqHeaders.get("x-path") ?? "/";
	const origin = reqHeaders.get("x-origin");
	const url = reqHeaders.get("x-url") ?? `${origin}${path}`;
	const pathname = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
	const metadata = getRouteByKey(myRoutes.routes, "path", pathname);

	return (
		<html lang="en">
			<LayoutClient />
			<head>
				{ generateMetaTags({
					title: metadata?.title ?? "",
					description: metadata?.description ?? "",
					keywords: metadata?.keywords ?? "",
					origin: origin ?? "",
					url: url ?? "",
					siteInfo: myRoutes.siteInfo as SiteInfo,
				}) }
				<BreadcrumbListSchema routes={myRoutes.routes} currentPath={pathname} siteUrl={myRoutes.siteInfo.url} />
				<WebsiteSchema siteInfo={myRoutes.siteInfo as SiteInfo} />
				<LocalBusinessSchema siteInfo={myRoutes.siteInfo} />
				<ServicesSchema siteInfo={myRoutes.siteInfo} />
				<VisualDesignStyles visualdesign={myRoutes.visualdesign} />
			</head>
			<body>
				<PixelatedServerConfigProvider>
					<header><Header /></header>
					<nav><Nav /></nav>
					<main>{children}</main>
					<nav><Nav /></nav>
					<footer><Footer /></footer>
				</PixelatedServerConfigProvider>
			</body>
		</html>
	);
}
