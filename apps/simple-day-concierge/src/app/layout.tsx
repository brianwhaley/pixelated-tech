import { headers } from 'next/headers';
import { getRouteByKey, getFullPixelatedConfig } from '@pixelated-tech/components/server';
import { generateMetaTags } from "@pixelated-tech/components/server";
import { WebsiteSchema, LocalBusinessSchema, ServicesSchema, BreadcrumbListSchema } from "@pixelated-tech/components";
import { GoogleFonts } from "@pixelated-tech/components";
import { PixelatedServerConfigProvider } from '@pixelated-tech/components/server';
import { VisualDesignStyles } from "@pixelated-tech/components/server";
import LayoutClient from '@/app/elements/layout-client';
import { PageBg } from '@pixelated-tech/components';
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

	const pixelatedConfig = getFullPixelatedConfig();
	const reqHeaders: Headers = await (headers() as Promise<Headers>);
	const path = reqHeaders.get("x-path") ?? "/";
	const origin = reqHeaders.get("x-origin");
	const url = reqHeaders.get("x-url") ?? `${origin}${path}`;
	const pathname = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
	const metadata = getRouteByKey(pixelatedConfig.routes, "path", pathname);

	const siteInfo = pixelatedConfig.siteInfo;

	return (
		<html lang="en">
			<LayoutClient />
			<head>
				<PixelatedServerConfigProvider>
					{ generateMetaTags({
						title: metadata?.title ?? "",
						description: metadata?.description ?? "",
						keywords: metadata?.keywords ?? "",
						origin: origin ?? "",
						url: url ?? "",
						siteInfo: siteInfo as any,
					}) }
					<BreadcrumbListSchema currentPath={pathname} />
					<WebsiteSchema />
					<LocalBusinessSchema />
					<ServicesSchema />
					<VisualDesignStyles />
					<GoogleFonts visualdesign={pixelatedConfig.visualdesign} />
				</PixelatedServerConfigProvider>
			</head>
			<body>
				<PixelatedServerConfigProvider>
					<PageBg image="/images/3d-style-flowing-white-golden-wavy-background.png" />
					<nav><Nav /></nav>
					<header><Header /></header>
					<main>{children}</main>
					<footer><Footer /></footer>
				</PixelatedServerConfigProvider>
			</body>
		</html>
	);
}
