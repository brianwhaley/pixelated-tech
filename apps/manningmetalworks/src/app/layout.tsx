import { headers } from 'next/headers';
import { getRouteByKey } from '@pixelated-tech/components/server';
import { generateMetaTags } from "@pixelated-tech/components/server";
import { WebsiteSchema, LocalBusinessSchema, ServicesSchema, BreadcrumbListSchema } from "@pixelated-tech/components";
import { PixelatedServerConfigProvider } from '@pixelated-tech/components/server';
import { VisualDesignStyles } from "@pixelated-tech/components/server";
import type { SiteInfo } from '@pixelated-tech/components/server';
import LayoutClient from '@/app/elements/layout-client';
import Header from '@/app/elements/header';
import Footer from '@/app/elements/footer';
import siteConfig from "@/app/data/siteconfig.json";
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
	const metadata = getRouteByKey(siteConfig.routes, "path", pathname);

	const siteInfo = siteConfig.siteInfo;

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
					siteInfo: siteInfo as SiteInfo,
				}) }
				<BreadcrumbListSchema routes={siteConfig.routes} currentPath={pathname} siteUrl={siteInfo.url} />
				<WebsiteSchema siteInfo={siteInfo as SiteInfo} />
				<LocalBusinessSchema siteInfo={siteInfo} />
				<ServicesSchema siteInfo={siteInfo} />
				<VisualDesignStyles visualdesign={siteConfig.visualdesign} />
			</head>
			<body>
				<PixelatedServerConfigProvider>
					<header><Header /></header>
					{ /* <nav><Nav /></nav> */ }
					<main>{children}</main>
					<footer><Footer /></footer>
				</PixelatedServerConfigProvider>
			</body>
		</html>
	);
}
