import { headers } from "next/headers";
import { getRouteByKey, SiteInfo, getFullPixelatedConfig } from "@pixelated-tech/components/server";
import { generateMetaTags } from "@pixelated-tech/components/server";
import { BreadcrumbListSchema, WebsiteSchema, LocalBusinessSchema, ServicesSchema } from "@pixelated-tech/components";
import { GoogleFonts } from "@pixelated-tech/components";
import { PixelatedServerConfigProvider } from "@pixelated-tech/components/server";
import { VisualDesignStyles } from "@pixelated-tech/components/server";
import LayoutClient from "./elements/layout-client";
import Header from "./elements/header";
import Hero from "./elements/hero";
import Nav from "./elements/nav";
import Search from './elements/search';
import Footer from './elements/footer';
import "@pixelated-tech/components/css/pixelated.global.css";
import "@pixelated-tech/components/css/pixelated.grid.scss";
// LOAD THIS AS LAST CSS FILE
import "./styles/globals.css";

export default async function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
	
	const reqHeaders: Headers = await (headers() as Promise<Headers>);
	const path = reqHeaders.get("x-path") ?? "/";
	const origin = reqHeaders.get("x-origin");
	const url = reqHeaders.get("x-url") ?? `${origin}${path}`;
	const pathname = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
	const pixelatedConfig = getFullPixelatedConfig();
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
						siteInfo: siteInfo as SiteInfo,
					}) }
					<BreadcrumbListSchema currentPath={pathname} />
					<WebsiteSchema />
					<LocalBusinessSchema />
					<ServicesSchema />
					<VisualDesignStyles />
					<GoogleFonts visualdesign={pixelatedConfig.visualdesign} />
					<meta name="google-site-verification" content="t2yy9wL1bXPiPQjBqDee2BTgpiGQjwVldlfa4X5CQkU" />
					<meta name="google-site-verification" content="l7D0Y_JsgtACBKNCeFAXPe-UWqo13fPTUCWhkmHStZ4" />
				</PixelatedServerConfigProvider>
			</head>
			<body>
				<PixelatedServerConfigProvider>
					<header>
						<div id="page-header" className="fixed-header"><Header /></div>
						<div id="fixed-header-spacer"></div>
						{ ( pathname === '/' ) ? <div><Hero /></div> : null }
						<div id="page-search" className="no-mobile"><Search /></div>
					</header>
					<nav>
						<Nav />
					</nav>
					<main>
						{children}
					</main>
					<footer>
						<Footer />
					</footer>
				</PixelatedServerConfigProvider>
			</body>
		</html>
	);
}
